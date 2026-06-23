import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig, WhereQuery} from '../../models/configs';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {StatsProfileService} from './stats-profile.service';
import {distinctPipe} from '../../directives/utils';
import {StatsProfile} from './stats-profile.data';
import {Stat} from '../stat/stat.service';

@Component({
  selector: 'atv-stats-profile',
  templateUrl: './stats-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.statsProfileService.tableConfig;
  public list: StatsProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.statsProfileService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly statsProfileService: StatsProfileService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.statsProfileService.init();
    this.statsProfileService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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

  public addItem(): void {
    this.statsProfileService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.statsProfileService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<StatsProfile>(
          this.statsProfileService.dbProfile,
          this.statsProfileService.dbTable,
          this.statsProfileService.tableKey,
          action,
        );
        //if (result) {
          await this.loadData();
          this.loadingService.hide();
       // }
      } else {
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            this.statsProfileService.dbProfile,
            `DELETE FROM ${this.statsProfileService.dbStatSettingsTable} WHERE profile_id = ?`,
            [action.id],
            true,
          );
        }
        await this.tablesService.executeAction(
          this.statsProfileService.dbProfile,
          this.statsProfileService.dbTable,
          action,
          'id',
        )
          .then(() => this.loadData());
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.statsProfileService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const newList = action.id.sort((a, b) => b - a);
      for (const id of newList) {
        if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<StatsProfile>(
          this.statsProfileService.dbProfile,
          this.statsProfileService.dbTable,
          this.statsProfileService.tableKey,
          action
        );

        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else
      {
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            this.statsProfileService.dbProfile,
            `DELETE FROM ${this.statsProfileService.dbStatSettingsTable} WHERE profile_id = ?`,
            [action.id],
            true,
          );
        }
        await this.tablesService.executeAction(
          this.statsProfileService.dbProfile,
          this.statsProfileService.dbTable,
          {id: id, type: action.type},
          'id',
          false,
        ).then(() => this.loadData());
      }
      }
      if (action.type === ActionsTypes.DELETE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
      } else if (action.type === ActionsTypes.RESTORE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_ACTIVATED'));
      } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_DEACTIVATED'));
      }
      await this.loadData();
      this.loadingService.hide();
    }
  }

  private async loadData() {
    await this.statsProfileService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.statsProfileService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
  public getPreviewItem(id: number | string): void {
    this.statsProfileService.previewItems(id as number);
  }
}
