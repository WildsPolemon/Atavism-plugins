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
import {Stat, StatService} from './stat.service';
import {distinctPipe} from '../../directives/utils';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-stat',
  templateUrl: './stat.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.statService.tableConfig;
  public list: Stat[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.statService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly statService: StatService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.statService.init();
    this.statService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.statService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.statService.updateItemId(id as number).then((reload) => {
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
        const result = await this.tablesService.handleDeps<Stat>(
          this.statService.dbProfile,
          this.statService.dbTable,
          this.statService.tableKey,
          action,
          'id',
          'name',
        );
        if (result ) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.statService.dbProfile, this.statService.dbTable, action, 'id')
          .then(() => {
            if (action.type === ActionsTypes.DELETE) {
              this.databaseService.customQuery(
                this.statService.dbProfile,
                `DELETE FROM ${this.statService.dbTableStats} WHERE stat_id = ?`,
                [action.id],
                true,
              );
            }
            this.loadData(true);
          });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const itemName = await this.statService.duplicateItem(action.id);
      if (itemName) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.statService.dbProfile;
      const dbTable = this.statService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Stat>(
          profile,
          dbTable,
          this.statService.tableKey,
          action,
          'id',
          'name',
        );
         if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.statService.dbTableStats} WHERE stat_id IN ("${result.join('", "')}")`,
              [],
              true,
            );
          }
          await this.loadData(true);
         }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action, 'id');
        await this.loadData(true);
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.statService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.statService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.statService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
