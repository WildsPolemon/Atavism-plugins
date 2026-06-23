import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {GuildLevelSettings} from './guild.data';
import {GuildLevelService} from './guild-level.service';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {distinctPipe} from '../../directives/utils';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-guild-level',
  templateUrl: './guild-level.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuildLevelComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.mainService.tableConfig;
  public list: GuildLevelSettings[] = [];
  public activeRecords = true;
  private destroyer = new Subject<void>();
  private queryParams: QueryParams = this.mainService.tableConfig.queryParams;

  constructor(
    private readonly mainService: GuildLevelService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.mainService.init();
    this.mainService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
    this.loadData();
  }

  public async addItem(): Promise<void> {
    const reload = await this.mainService.addItem();
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.mainService.updateItem(id as number);
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async paramsUpdated(params: QueryParams): Promise<void> {
    this.queryParams = params;
    await this.loadData();
  }

  public getPreviewItem(id: number | string): void {
    this.mainService.previewItems(id as number);
  }

  public async loadData(): Promise<void> {
    await this.mainService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if (action.type === ActionsTypes.MARK_AS_REMOVED) {
      const record = await this.databaseService.queryItem<GuildLevelSettings>(
        this.mainService.dbProfile,
        this.mainService.dbTable,
        'id',
        action.id,
      );
      const result = await this.databaseService.customQuery(
        this.mainService.dbProfile,
        `SELECT count(*) as isBigger FROM ${this.mainService.dbTable} where level > ${record.level} and isactive = 1`,
      );
      if (+result[0].isBigger === 0) {
        await this.tablesService.executeAction(this.mainService.dbProfile, this.mainService.dbTable, action);
        await this.loadData();
        await this.mainService.loadUsed();
      } else {
        this.notification.error(this.translate.instant(this.mainService.tableKey + '.CANT_REMOVE_NOT_LAST'));
        this.loadingService.hide();
      }
    } else if (action.type === ActionsTypes.RESTORE) {
      const result = await this.databaseService.customQuery(
        this.mainService.dbProfile,
        `SELECT MAX(level) as maxLevel FROM ${this.mainService.dbTable} WHERE isactive = 1`,
      );
      await this.tablesService.executeAction(this.mainService.dbProfile, this.mainService.dbTable, action);
      await this.databaseService.update<GuildLevelSettings>(
        this.mainService.dbProfile,
        this.mainService.dbTable,
        {level: +result[0].maxLevel + 1} as GuildLevelSettings,
        'id',
        action.id,
      );
      await this.loadData();
      await this.mainService.loadUsed();
    } else if ([ActionsTypes.DELETE].includes(action.type)) {
      await this.tablesService.executeAction(this.mainService.dbProfile, this.mainService.dbTable, action);
      await this.databaseService.customQuery(
        this.mainService.dbProfile,
        `DELETE FROM ${this.mainService.dbTableRequirements} WHERE level = ?`,
        [action.id],
        true,
      );
      await this.loadData();
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.mainService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    const profile = this.mainService.dbProfile;
    const dbTable = this.mainService.dbTable;
    if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
      const list = await this.databaseService.customQuery(
        profile,
        `SELECT * FROM ${dbTable} WHERE id IN (${action.id.join(', ')})`,
      );
      const newList = list.sort((a, b) => b.level - a.level);
      for (const record of newList) {
        const result = await this.databaseService.customQuery(
          profile,
          `SELECT count(*) as isBigger FROM ${dbTable} where level > ${record.level} and isactive = 1`,
        );
        if (!+result[0].isBigger) {
          await this.tablesService.executeAction(
            profile,
            dbTable,
            {id: record.id, type: action.type},
            undefined,
            false,
          );
        } else {
          this.notification.error(this.translate.instant(this.mainService.tableKey + '.CANT_REMOVE_NOT_LAST'));
          await this.loadData();
          await this.mainService.loadUsed();
          this.loadingService.hide();
          return;
        }
      }
      if (action.type === ActionsTypes.DELETE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
      } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_DEACTIVATED'));
      }
      await this.loadData();
      await this.mainService.loadUsed();
      this.loadingService.hide();
    } else if (action.type === ActionsTypes.RESTORE) {
      const newList = action.id.sort((a, b) => a - b);
      for (const id of newList) {
        const result = await this.databaseService.customQuery(
          profile,
          `SELECT MAX(level) as maxLevel FROM ${dbTable} WHERE isactive = 1`,
        );
        await this.tablesService.executeAction(profile, dbTable, {id, type: action.type});
        await this.databaseService.update<GuildLevelSettings>(
          profile,
          dbTable,
          {level: +result[0].maxLevel + 1} as GuildLevelSettings,
          'id',
          id,
        );
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_ACTIVATED'));
      await this.loadData();
      await this.mainService.loadUsed();
      this.loadingService.hide();
    }
  }

  public ngOnDestroy(): void {
    this.mainService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
