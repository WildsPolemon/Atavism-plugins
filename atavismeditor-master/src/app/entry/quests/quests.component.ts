import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {Subject} from 'rxjs';
import {QueryParams, TableConfig} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {QuestsService} from './quests.service';
import {distinctPipe} from '../../directives/utils';
import {Quest} from './quests.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-quests',
  templateUrl: './quests.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.questsService.tableConfig;
  public list: Quest[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.questsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly questsService: QuestsService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.questsService.init();
    this.questsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    const reload = await this.questsService.addItem();
    if (reload) {
      this.loadData(true);
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.questsService.updateItem(id as number);
    if (reload) {
      this.loadData(true);
    }
    this.loadingService.hide();
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.questsService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<Quest>(
          this.questsService.dbProfile,
          this.questsService.dbTable,
          this.questsService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(profile, this.questsService.dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.delete(
            profile,
            this.questsService.dbTableRequirements,
            'quest_id',
            action.id,
            false,
          );
          await this.databaseService.delete(profile, this.questsService.dbTableObjectives, 'questID', action.id, false);
          await this.databaseService.delete(profile, this.questsService.dbTableItems, 'quest_id', action.id, false);
        }
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.questsService.duplicateItem(action.id);
      if (newId) {
        await this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.questsService.dbProfile;
      const dbTable = this.questsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Quest>(
          profile,
          dbTable,
          this.questsService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.questsService.dbTableRequirements} WHERE quest_id IN (${result.join(', ')})`,
              [],
              true,
            );
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.questsService.dbTableObjectives} WHERE questID IN (${result.join(', ')})`,
              [],
              true,
            );
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.questsService.dbTableItems} WHERE quest_id IN (${result.join(', ')})`,
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
    this.questsService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.questsService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.questsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
