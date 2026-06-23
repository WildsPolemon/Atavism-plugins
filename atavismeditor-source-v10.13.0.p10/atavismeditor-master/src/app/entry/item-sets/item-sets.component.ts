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
import {ItemSetsService} from './item-sets.service';
import {distinctPipe} from '../../directives/utils';
import {ItemSet} from './item-sets.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-item-sets',
  templateUrl: './item-sets.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemSetsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.itemSetsService.tableConfig;
  public list: ItemSet[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.itemSetsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly itemSetsService: ItemSetsService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.itemSetsService.init();
    this.itemSetsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.itemSetsService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.itemSetsService.updateItem(id as number).then((reload) => {
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
      this.tablesService
        .executeAction(this.itemSetsService.dbProfile, this.itemSetsService.dbTable, action)
        .then(() => {
          if (action.type === ActionsTypes.DELETE) {
            this.databaseService.customQuery(
              this.itemSetsService.dbProfile,
              `DELETE FROM ${this.itemSetsService.dbTableItems} WHERE set_id = ?`,
              [action.id],
              true,
            );
            this.databaseService.customQuery(
              this.itemSetsService.dbProfile,
              `DELETE FROM ${this.itemSetsService.dbTableLevels} WHERE set_id = ?`,
              [action.id],
              true,
            );
          }
          this.loadData();
        });
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.itemSetsService.duplicateItem(action.id);
      if (newId) {
        this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.itemSetsService.dbProfile;
      const dbTable = this.itemSetsService.dbTable;
      await this.tablesService.executeBulkAction(profile, dbTable, action);
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          this.itemSetsService.dbProfile,
          `DELETE FROM ${this.itemSetsService.dbTableItems} WHERE set_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
        await this.databaseService.customQuery(
          this.itemSetsService.dbProfile,
          `DELETE FROM ${this.itemSetsService.dbTableLevels} WHERE set_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
      }
      await this.loadData();
      this.loadingService.hide();
    }
  }

  public getPreviewItem(id: number | string): void {
    this.itemSetsService.previewItems(id as number);
  }

  private async loadData() {
    await this.itemSetsService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.itemSetsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
