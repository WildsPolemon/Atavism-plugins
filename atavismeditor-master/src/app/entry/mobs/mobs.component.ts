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
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {MobsService} from './mobs.service';
import {distinctPipe} from '../../directives/utils';
import {Mob} from './mobs.data';

@Component({
  selector: 'atv-mobs',
  templateUrl: './mobs.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.mobsService.tableConfig;
  public list: Mob[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.mobsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly mobsService: MobsService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.mobsService.init();
    this.mobsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.mobsService.loadDataReady.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
  }

  public addItem(): void {
    this.mobsService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.mobsService.updateItem(id as number).then((reload) => {
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
      const profile = this.mobsService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<Mob>(
          this.mobsService.dbProfile,
          this.mobsService.dbTable,
          this.mobsService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(profile, this.mobsService.dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.mobsService.dbTableStat} WHERE mobTemplate = ?`,
            [action.id],
            true,
          );
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.mobsService.dbTableLoot} WHERE mobTemplate = ?`,
            [action.id],
            true,
          );
        }
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.mobsService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.mobsService.dbProfile;
      const dbTable = this.mobsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Mob>(
          profile,
          dbTable,
          this.mobsService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.mobsService.dbTableStat} WHERE mobTemplate IN (${result.join(', ')})`,
              [],
              true,
            );
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.mobsService.dbTableLoot} WHERE mobTemplate IN (${result.join(', ')})`,
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
    this.mobsService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.mobsService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.mobsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
