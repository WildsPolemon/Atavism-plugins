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
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {LootTable, LootTablesService} from './loot-tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {distinctPipe} from '../../directives/utils';

@Component({
  selector: 'atv-loot-tables',
  templateUrl: './loot-tables.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LootTablesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.lootTablesService.tableConfig;
  public list: LootTable[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.lootTablesService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly lootTablesService: LootTablesService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.lootTablesService.init();
    this.lootTablesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.lootTablesService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.lootTablesService.updateItem(id as number).then((reload) => {
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
      const profile = this.lootTablesService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<LootTable>(
          this.lootTablesService.dbProfile,
          this.lootTablesService.dbTable,
          this.lootTablesService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(
          this.lootTablesService.dbProfile,
          this.lootTablesService.dbTable,
          action,
        );
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.lootTablesService.dbTableItems} WHERE loot_table_id = ?`,
            [action.id],
          );
        }
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.lootTablesService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.lootTablesService.dbProfile;
      const dbTable = this.lootTablesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<LootTable>(
          profile,
          dbTable,
          this.lootTablesService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.lootTablesService.dbTableItems} WHERE loot_table_id IN (${result.join(', ')})`,
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
    this.lootTablesService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.lootTablesService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.lootTablesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
