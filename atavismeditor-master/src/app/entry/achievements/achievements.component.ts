import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {AchievementsService} from './achievements.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {Subject} from 'rxjs';
import {distinctPipe} from '../../directives/utils';
import {AchievementSettings} from './achievements.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-achievements',
  templateUrl: './achievements.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.achievementsService.tableConfig;
  public list: AchievementSettings[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.achievementsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.achievementsService.init();
    this.achievementsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.achievementsService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.achievementsService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData(true);
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
        const result = await this.tablesService.handleDeps<AchievementSettings>(
          this.achievementsService.dbProfile,
          this.achievementsService.dbTable,
          this.achievementsService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(
          this.achievementsService.dbProfile,
          this.achievementsService.dbTable,
          action,
        );
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            this.achievementsService.dbProfile,
            `DELETE FROM ${this.achievementsService.dbTableBonus} WHERE achievement_id = ?`,
            [action.id],
          );
          await this.databaseService.customQuery(
            this.achievementsService.dbProfile,
            `DELETE FROM ${this.achievementsService.dbTableStats} WHERE achievement_id = ?`,
            [action.id],
          );
        }
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.achievementsService.duplicateItem(action.id);
      if (newId) {
        await this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.achievementsService.dbProfile;
      const dbTable = this.achievementsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<AchievementSettings>(
          profile,
          dbTable,
          this.achievementsService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              this.achievementsService.dbProfile,
              `DELETE FROM ${this.achievementsService.dbTableBonus} WHERE achievement_id IN (${result.join(', ')})`,
              [],
              true,
            );
            await this.databaseService.customQuery(
              this.achievementsService.dbProfile,
              `DELETE FROM ${this.achievementsService.dbTableStats} WHERE achievement_id IN (${result.join(', ')})`,
              [],
              true,
            );
          }
          await this.loadData(true);
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        this.loadData(true);
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.achievementsService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.achievementsService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.achievementsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
