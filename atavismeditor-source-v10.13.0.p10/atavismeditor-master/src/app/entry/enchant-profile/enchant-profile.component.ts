import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig} from '../../models/configs';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {EnchantProfileService} from './enchant-profile.service';
import {distinctPipe} from '../../directives/utils';
import {EnchantProfile} from './enchant-profile.data';

@Component({
  selector: 'atv-enchant-profile',
  templateUrl: './enchant-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnchantProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.enchantProfileService.tableConfig;
  public list: EnchantProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.enchantProfileService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly enchantProfileService: EnchantProfileService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.enchantProfileService.init();
    this.enchantProfileService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.enchantProfileService.loadOptionChoices();
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
    this.loadData();
  }

  public addItem(): void {
    this.enchantProfileService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.enchantProfileService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public showItemQualitySettings(): void {
    this.enchantProfileService.itemQuality().then(() => {
      this.loadingService.hide();
    });
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      let result = false;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        result = await this.tablesService.handleDeps<EnchantProfile>(
          this.enchantProfileService.dbProfile,
          this.enchantProfileService.dbTable,
          this.enchantProfileService.tableKey,
          action,
          'id',
          'Name',
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      }
      let sql = '';
      if (action.type === ActionsTypes.MARK_AS_REMOVED && result) {
        sql = `UPDATE ${this.enchantProfileService.dbTable} SET isactive = 0 WHERE id = ?`;
      } else if (action.type === ActionsTypes.RESTORE) {
        sql = `UPDATE ${this.enchantProfileService.dbTable} SET isactive = 1 WHERE id = ?`;
      } else if (action.type === ActionsTypes.DELETE) {
        sql = `DELETE FROM ${this.enchantProfileService.dbTable} WHERE id = ?`;
      }
      if (sql) {
        this.databaseService.customQuery(this.enchantProfileService.dbProfile, sql, [action.id], true).then(() => {
          this.loadData(true);
          if (action.type === ActionsTypes.MARK_AS_REMOVED) {
            this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
          } else if (action.type === ActionsTypes.RESTORE) {
            this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_RESTORED'));
          } else if (action.type === ActionsTypes.DELETE) {
            this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
          }
        });
      }
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.enchantProfileService.duplicateItem(action.id);
      const reload = await this.enchantProfileService.updateItem(newId);
      if (reload) {
        this.loadData(true);
      } else {
        await this.databaseService.customQuery(
          this.enchantProfileService.dbProfile,
          `DELETE FROM ${this.enchantProfileService.dbTable} WHERE id = ?`,
          [newId],
          true,
        );
      }
      this.loadingService.hide();
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.enchantProfileService.dbProfile;
      const dbTable = this.enchantProfileService.dbTable;
      let result = [];
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        result = await this.tablesService.handleBulkDeps<EnchantProfile>(
          profile,
          dbTable,
          this.enchantProfileService.tableKey,
          action,
          'id',
          'Name',
        );
      }
      let sql = '';
      if (action.type === ActionsTypes.MARK_AS_REMOVED && result.length > 0) {
        sql = `UPDATE ${this.enchantProfileService.dbTable} SET isactive = 0 WHERE id IN (${result.join(', ')})`;
      } else if (action.type === ActionsTypes.RESTORE) {
        sql = `UPDATE ${this.enchantProfileService.dbTable} SET isactive = 1 WHERE id IN (${action.id.join(', ')})`;
      } else if (action.type === ActionsTypes.DELETE && result.length > 0) {
        sql = `DELETE FROM ${this.enchantProfileService.dbTable} WHERE id IN (${result.join(', ')})`;
      }
      if (sql) {
        await this.databaseService.customQuery(this.enchantProfileService.dbProfile, sql, [], true);
        if (action.type === ActionsTypes.MARK_AS_REMOVED) {
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
        } else if (action.type === ActionsTypes.RESTORE) {
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_RESTORED'));
        } else if (action.type === ActionsTypes.DELETE) {
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
        }
        await this.loadData(true);
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.enchantProfileService.previewItems(id as number, this.activeRecords);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.enchantProfileService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.enchantProfileService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
