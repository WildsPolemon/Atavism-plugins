import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {LoadingService} from '../../components/loading/loading.service';
import {TranslateService} from '@ngx-translate/core';
import {dataBase, DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {TabTypes} from '../../models/tabTypes.enum';
import {NotificationService} from '../../services/notification.service';
import {DialogType} from '../../models/types';
import {DialogConfig} from '../../models/configs';
import {instanceTemplateTable} from '../tables.data';
import {DropdownValue} from '../../models/configRow.interface';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import mysqldump from 'mysqldump';
import {ElectronService} from '../../services/electron.service';

enum DatabaseAction {
  wipeCharacters,
  wipeCharactersAccounts,
  disableSpawnedMobs,
  enableSpawnedMobs,
  deleteSpawnedMobs,
  checkBackupSize,
  cleanupHistoryObjectStore,
}

@Component({
  selector: 'atv-database-actions',
  templateUrl: './database-actions.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseActionsComponent implements OnInit {
  public tableKey = TabTypes.DATABASE_ACTIONS;
  public DatabaseAction = DatabaseAction;
  public showQueryField = false;
  public dataBase = dataBase;
  public selectedDatabase = dataBase[0];
  public customQuery = '';
  public visibleInstances = false;
  public allInstances = true;
  public instances: DropdownValue[] = [];
  public activeAction?: DatabaseAction;
  public instancesControl = new FormControl();
  public dataBaseType = DataBaseType;
  public backupSizeResult?: Record<DataBaseType, number>;
  public showBackupPreview = false;
  public backupForm = new FormGroup({
    db: new FormControl('', Validators.required),
    destination: new FormControl('', Validators.required),
  });
  public sqlScriptControl = new FormControl('');
  public showTextareaScript = true;
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;

  constructor(
    private readonly electronService: ElectronService,
    private readonly translate: TranslateService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly notifications: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  public async ngOnInit() {
    this.instances = await this.getInstances();
    this.changeDetectorRef.detectChanges();
  }

  public showInstancesForAction(action: DatabaseAction): void {
    if (this.activeAction !== action) {
      this.visibleInstances = true;
    } else {
      this.visibleInstances = !this.visibleInstances;
    }
    this.activeAction = action;
    this.changeDetectorRef.detectChanges();
  }

  public executeAction(action: DatabaseAction): void {
    this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant(
      'CONFIRM.EXECUTE_QUERY_DESCRIPTION',
    );
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingService.show();
        switch (action) {
          case DatabaseAction.deleteSpawnedMobs:
            this.deleteSpawnedMobs(this.instancesControl.value);
            break;
          case DatabaseAction.disableSpawnedMobs:
            this.disableSpawnedMobs(this.instancesControl.value);
            break;
          case DatabaseAction.enableSpawnedMobs:
            this.enableSpawnedMobs(this.instancesControl.value);
            break;
          case DatabaseAction.wipeCharacters:
            this.wipeCharacters();
            break;
          case DatabaseAction.wipeCharactersAccounts:
            this.wipeCharactersAccounts();
            break;
          case DatabaseAction.checkBackupSize:
            this.checkBackupSize();
            break;
          case DatabaseAction.cleanupHistoryObjectStore:
            this.cleanupHistoryObjectStore();
            break;
        }
      } else {
        this.confirmDialogRef = undefined;
      }
    });
  }

  public async madeBackup(): Promise<void> {
    if (this.backupForm.valid) {
      const dbType = this.backupForm.get('db')?.value;
      const size = await this.checkDBBackupSize(dbType);
      if (size > 100 && dbType === DataBaseType.atavism) {
        this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
          panelClass: DialogConfig.confirmDialogOverlay,
          disableClose: false,
        });
        this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.SIZE_TOO_BIG');
        const result = await this.confirmDialogRef.afterClosed().toPromise();
        this.loadingService.show();
        if (result) {
          await this.cleanupHistoryObjectStore(false);
        }
      } else {
        this.loadingService.show();
      }
      this.didBackup(dbType);
    }
  }

  private restoreFromFile(dbType: DataBaseType, file: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const Importer = require('@pivvenit/mysql-import');
        const dbProfile = this.profilesService.getDBProfileByType(dbType) as DataBaseProfile;
        const importer = new Importer({
          host: dbProfile.host,
          port: Number(dbProfile.port),
          user: dbProfile.user,
          password: String(dbProfile.password),
          database: dbProfile.database,
        });

        importer
          .import(file)
          .then(() => {
            this.loadingService.hide();
            this.notifications.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_EXECUTED'));
            resolve();
          })
          .catch((error: any) => {
            this.notifications.error(this.translate.instant('CONCLUSION.ERROR_EXECUTED'));
            this.loadingService.hide();
            reject(error);
          });
      } catch (e) {
        this.notifications.error(this.translate.instant('CONCLUSION.ERROR_EXECUTED'));
        this.loadingService.hide();
        reject(e);
      }
    });
  }

  public async executeCustomQuery() {
    if (this.selectedDatabase.length > 0) {
      let sql: string[] = [];
      if (this.showTextareaScript && this.customQuery.length > 0) {
        this.loadingService.show();
        sql = this.customQuery
          .trim()
          .split(';')
          .filter(
            (sqlString) =>
              sqlString.length > 0 &&
              (sqlString.toLowerCase().indexOf('insert') !== -1 || sqlString.toLowerCase().indexOf('update') !== -1),
          );
        if (sql.length === 0) {
          this.notifications.error(this.translate.instant('CONCLUSION.NOT_CONTAIN_INSERT_UPDATE'));
          this.loadingService.hide();
          return;
        }
      } else if (!this.showTextareaScript && this.sqlScriptControl.value.length > 0) {
        this.loadingService.show();
        await this.restoreFromFile(this.selectedDatabase, this.sqlScriptControl.value);
        return;
      }
      if (sql.length === 0) {
        this.notifications.error(this.translate.instant('CONCLUSION.NOTHING_TO_EXECUTE'));
        this.loadingService.hide();
        return;
      }
      const dbProfile = this.profilesService.getDBProfileByType(this.selectedDatabase) as DataBaseProfile;
      this.databaseService
        .transactionQueries(dbProfile, sql)
        .then(() => {
          this.loadingService.hide();
          this.notifications.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_EXECUTED'));
        })
        .catch(() => {
          this.notifications.error(this.translate.instant('CONCLUSION.ERROR_EXECUTED'));
          this.loadingService.hide();
        });
    }
  }

  public cancelCustom(): void {
    this.customQuery = '';
    this.changeDetectorRef.detectChanges();
  }

  public hideDBSizes(): void {
    this.backupSizeResult = undefined;
  }

  public async chooseBackupFile(): Promise<void> {
    const result = await this.electronService.remote.dialog.showSaveDialogSync({
      title: this.translate.instant(this.tableKey + '.CHOOSE_FILE_TITLE'),
      filters: [{name: 'SQL file', extensions: ['sql']}],
    });
    if (result) {
      this.backupForm.get('destination')?.patchValue(result.replace(/\\/g, '/'));
    }
  }

  public async chooseFile(): Promise<void> {
    const result = await this.electronService.remote.dialog.showOpenDialogSync({
      filters: [{name: 'SQL file', extensions: ['sql']}],
      properties: ['openFile'],
    });
    if (result && result[0]) {
      this.sqlScriptControl.patchValue(result[0].replace(/\\/g, '/'));
    }
  }

  private didBackup(dbType: DataBaseType): void {
    const dbProfile = this.profilesService.getDBProfileByType(dbType) as DataBaseProfile;
    mysqldump({
      connection: {
        host: dbProfile.host,
        port: Number(dbProfile.port),
        user: dbProfile.user,
        password: String(dbProfile.password),
        database: dbProfile.database,
      },
      dump: {
        schema: {
          format: false,
          table: {
            dropIfExist: true,
          },
        },
        data: {
          format: false,
          verbose: false,
          maxRowsPerInsertStatement: 1000,
        },
      },
      dumpToFile: this.backupForm.get('destination')?.value,
    })
      .then(() => {
        this.loadingService.hide();
        this.notifications.success(this.translate.instant(this.tableKey + '.BACKUP_DONE'));
      })
      .catch((error) => {
        this.notifications.error(error.toString());
        this.loadingService.hide();
      });
  }

  private wipeCharacters(direct = false): void {
    const adminDbProfile = this.profilesService.getDBProfileByType(DataBaseType.admin) as DataBaseProfile;
    const atavismDbProfile = this.profilesService.getDBProfileByType(DataBaseType.atavism) as DataBaseProfile;
    const masterDbProfile = this.profilesService.getDBProfileByType(DataBaseType.master) as DataBaseProfile;

    const atavismSqls = [
      'DELETE FROM player_character',
      'DELETE FROM objstore',
      'TRUNCATE history_objstore',
      'DELETE FROM player_items',
      'DELETE FROM player_item_sockets',
      'DELETE FROM plugin_status',
      'DELETE FROM player_bags',
      'DELETE FROM player_bag',
      'DELETE FROM player_bag_slots',
      'DELETE FROM player_bag_bank',
      'DELETE FROM player_bag_bank_slots',
      'DELETE FROM player_bag_equip',
      'DELETE FROM player_bag_equip_slots',
      'DELETE FROM player_bag_guild',
      'DELETE FROM player_bag_guild_slots',
      'DELETE FROM player_currencies',
      'DELETE FROM player_pets',
      'DELETE FROM player_skills',
      'DELETE FROM player_stats',
      'DELETE FROM player_stats_modifiers',
      'DELETE FROM player_stats_modifiers_percentage',
    ];
    /* tslint:disable */
    const adminSql = [
      'DELETE FROM account_character',
      'DELETE FROM character_purchases',
      'DELETE FROM auction_house',
      'DELETE FROM auction_house_ended',
      'DELETE FROM history_auction_house_ended',
      'DELETE FROM character_block_list',
      'DELETE FROM character_friends',
      'DELETE FROM character_mail',
      'DELETE FROM cooldowns',
      'DELETE FROM data_logs',
      'DELETE FROM claim WHERE permanent <> 1',
      `UPDATE claim SET cost = org_cost, currency = org_currency, instanceOwner=0, instanceGuild=-1,owner = -1, forSale = 1, sellerName ='' WHERE parent > -1`,
      'DELETE FROM claim_action',
      'DELETE FROM claim_object',
      'DELETE FROM claim_permission',
      'DELETE FROM guild',
      'DELETE FROM guild_member',
      'DELETE FROM guild_rank',
      'DELETE FROM history_character_mail',
      'DELETE FROM player_shop',
      'DELETE FROM player_shop_items',
      'DELETE FROM shop_spawn_data',
      'DELETE FROM achivement_data',
      'DELETE FROM rankings',

    ];
    /* tslint:enable */
    const masterSql = ['DELETE FROM account_character', 'DELETE FROM world', 'DELETE FROM bonuses'];

    this.databaseService.transactionQueries(adminDbProfile, adminSql).finally(() => {
      this.databaseService.transactionQueries(atavismDbProfile, atavismSqls).finally(() => {
        this.databaseService
          .transactionQueries(masterDbProfile, masterSql)
          .then(() => {
            if (!direct) {
              this.loadingService.hide();
            }
          })
          .catch(() => this.loadingService.hide());
      });
    });
  }

  private wipeCharactersAccounts(): void {
    this.wipeCharacters(true);

    const adminDbProfile = this.profilesService.getDBProfileByType(DataBaseType.admin) as DataBaseProfile;
    const adminSql = ['delete from account'];

    const masterDbProfile = this.profilesService.getDBProfileByType(DataBaseType.master) as DataBaseProfile;
    const masterSql = ['delete from account'];

    this.databaseService
      .transactionQueries(adminDbProfile, adminSql)
      .then(() => {
        this.databaseService
          .transactionQueries(masterDbProfile, masterSql)
          .then(() => {
            this.loadingService.hide();
          })
          .catch(() => this.loadingService.hide());
      })
      .catch(() => this.loadingService.hide());
  }

  private async checkBackupSize(): Promise<void> {
    this.backupSizeResult = {
      [DataBaseType.atavism]: await this.checkDBBackupSize(DataBaseType.atavism),
      [DataBaseType.admin]: await this.checkDBBackupSize(DataBaseType.admin),
      [DataBaseType.master]: await this.checkDBBackupSize(DataBaseType.master),
      [DataBaseType.world_content]: await this.checkDBBackupSize(DataBaseType.world_content),
    };
    this.changeDetectorRef.detectChanges();
    this.loadingService.hide();
  }

  private async checkDBBackupSize(db: DataBaseType): Promise<number> {
    const dbProfile = this.profilesService.getDBProfileByType(db) as DataBaseProfile;
    const sql = `SELECT Data_BB / POWER(1024,2) sizeMb FROM (SELECT SUM(data_length) Data_BB FROM information_schema.tables WHERE table_schema = '${dbProfile.database}') A;`;
    const result = await this.databaseService.customQuery(dbProfile, sql);
    return result[0].sizeMb;
  }

  private async cleanupHistoryObjectStore(hideLoading = true): Promise<void> {
    const atavismDbProfile = this.profilesService.getDBProfileByType(DataBaseType.atavism) as DataBaseProfile;
    const sql = ['truncate history_objstore'];
    await this.databaseService.transactionQueries(atavismDbProfile, sql);
    if (hideLoading) {
      this.loadingService.hide();
    }
  }

  private async getInstances(): Promise<DropdownValue[]> {
    const dbProfile = this.profilesService.getDBProfileByType(DataBaseType.admin) as DataBaseProfile;
    const result = await this.databaseService.customQuery(
      dbProfile,
      `SELECT id, island_name FROM ${instanceTemplateTable}`,
    );
    return result.map((item: {id: number; island_name: string}) => ({id: item.id, value: item.island_name}));
  }

  private disableSpawnedMobs(ids: number[]): void {
    const dbProfile = this.profilesService.getDBProfileByType(DataBaseType.world_content) as DataBaseProfile;
    let sql = 'UPDATE spawn_data SET isactive = 0 WHERE instance IS NOT NULL';
    if (!this.allInstances && ids.length > 0) {
      sql += ` AND instance IN (${ids.join(', ')}) `;
    }
    this.databaseService
      .transactionQueries(dbProfile, [sql])
      .then(() => {
        this.loadingService.hide();
      })
      .catch(() => this.loadingService.hide());
  }

  private deleteSpawnedMobs(ids: number[]): void {
    const dbProfile = this.profilesService.getDBProfileByType(DataBaseType.world_content) as DataBaseProfile;
    let sql = 'DELETE FROM spawn_data WHERE instance IS NOT NULL';
    if (!this.allInstances && ids.length > 0) {
      sql += ` AND instance IN (${ids.join(', ')}) `;
    }
    this.databaseService
      .transactionQueries(dbProfile, [sql])
      .then(() => {
        this.loadingService.hide();
      })
      .catch(() => this.loadingService.hide());
  }

  private enableSpawnedMobs(ids: number[]): void {
    const dbProfile = this.profilesService.getDBProfileByType(DataBaseType.world_content) as DataBaseProfile;
    let sql = 'UPDATE spawn_data SET isactive = 1 WHERE instance IS NOT NULL';
    if (!this.allInstances && ids.length > 0) {
      sql += ` AND instance IN (${ids.join(', ')}) `;
    }
    this.databaseService
      .transactionQueries(dbProfile, [sql])
      .then(() => {
        this.loadingService.hide();
      })
      .catch(() => {
        this.loadingService.hide();
      });
  }
}
