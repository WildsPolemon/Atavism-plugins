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
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {ItemsService} from './items.service';
import {distinctPipe} from '../../directives/utils';
import {Item} from './items.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-items',
  templateUrl: './items.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsComponent implements OnInit, OnDestroy {
  public list: Item[] = [];
  public activeRecords = true;
  private destroyer = new Subject<void>();
  public tableConfig: TableConfig = this.itemsService.tableConfig;
  private queryParams: QueryParams = this.itemsService.tableConfig.queryParams;

  constructor(
    private readonly itemsService: ItemsService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.itemsService.init();
    this.itemsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.itemsService.loadOptionChoices();
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
    this.itemsService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.itemsService.updateItem(id as number).then((reload) => {
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
        const result = await this.tablesService.handleDeps<Item>(
          this.itemsService.dbProfile,
          this.itemsService.dbTable,
          this.itemsService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(this.itemsService.dbProfile, this.itemsService.dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            this.itemsService.dbProfile,
            `DELETE FROM ${this.itemsService.dbTableRequirements} WHERE item_id = ?`,
            [action.id],
          );
        }
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.itemsService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.itemsService.dbProfile;
      const dbTable = this.itemsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Item>(
          profile,
          dbTable,
          this.itemsService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.itemsService.dbTableRequirements} WHERE item_id IN (${result.join(', ')})`,
              [],
              true,
            );
          }
          await this.loadData(true);
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData(true);
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.itemsService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.itemsService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.itemsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
