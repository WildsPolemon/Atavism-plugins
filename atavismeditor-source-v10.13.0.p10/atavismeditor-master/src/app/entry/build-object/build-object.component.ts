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
import {BuildObjectService} from './build-object.service';
import {distinctPipe} from '../../directives/utils';
import {BuildObject} from './build-object.data';
import {buildObjectStageDamagedTable, buildObjectStageItemsTable, buildObjectStageProgressTable} from '../tables.data';

@Component({
  selector: 'atv-build-object',
  templateUrl: './build-object.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildObjectComponent implements OnInit, OnDestroy {
  public list: BuildObject[] = [];
  public activeRecords = true;
  public tableConfig: TableConfig = this.buildObjectService.tableConfig;
  private queryParams: QueryParams = this.buildObjectService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly buildObjectService: BuildObjectService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.buildObjectService.init();
    this.buildObjectService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.loadingService.hide();
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.buildObjectService.loadOptionChoices();
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
    const item = await this.buildObjectService.addItem();
    if (item) {
      await this.loadData(true);
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const item = await this.buildObjectService.updateItem(id as number);
    if (item) {
      await this.loadData(true);
    }
    this.loadingService.hide();
  }

  public async paramsUpdated(params: QueryParams): Promise<void> {
    this.queryParams = params;
    await this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<BuildObject>(
          this.buildObjectService.dbProfile,
          this.buildObjectService.dbTable,
          this.buildObjectService.tableKey,
          action,
        );
        if (result) {
          this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        if (action.type === ActionsTypes.DELETE) {
          const record = await this.databaseService.queryItem<BuildObject>(
            this.buildObjectService.dbProfile,
            this.buildObjectService.dbTable,
            'id',
            action.id,
          );
          if (record) {
            const stages = await this.buildObjectService.getAllStages(record.firstStageID, []);
            for (const stage of stages) {
              await this.databaseService.delete(
                this.buildObjectService.dbProfile,
                this.buildObjectService.dbTableStage,
                'id',
                stage.id as number,
                false,
              );
              await this.databaseService.customQuery(
                this.buildObjectService.dbProfile,
                `DELETE FROM ${buildObjectStageItemsTable} WHERE stage_id = ?`,
                [stage.id as number],
                true,
              );
              await this.databaseService.customQuery(
                this.buildObjectService.dbProfile,
                `DELETE FROM ${buildObjectStageProgressTable} WHERE stage_id = ?`,
                [stage.id as number],
                true,
              );
              await this.databaseService.customQuery(
                this.buildObjectService.dbProfile,
                `DELETE FROM ${buildObjectStageDamagedTable} WHERE stage_id = ?`,
                [stage.id as number],
                true,
              );
            }
          }
        }
        await this.tablesService.executeAction(
          this.buildObjectService.dbProfile,
          this.buildObjectService.dbTable,
          action,
        );
        this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.buildObjectService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.buildObjectService.dbProfile;
      const dbTable = this.buildObjectService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<BuildObject>(
          profile,
          dbTable,
          this.buildObjectService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            for (const id of action.id) {
              const record = await this.databaseService.queryItem<BuildObject>(
                this.buildObjectService.dbProfile,
                this.buildObjectService.dbTable,
                'id',
                id,
              );
              if (record) {
                const stages = await this.buildObjectService.getAllStages(record.firstStageID, []);
                for (const stage of stages) {
                  await this.databaseService.delete(
                    this.buildObjectService.dbProfile,
                    this.buildObjectService.dbTableStage,
                    'id',
                    stage.id as number,
                    false,
                  );
                  await this.databaseService.customQuery(
                    this.buildObjectService.dbProfile,
                    `DELETE FROM ${buildObjectStageItemsTable} WHERE stage_id = ?`,
                    [stage.id as number],
                    true,
                  );
                  await this.databaseService.customQuery(
                    this.buildObjectService.dbProfile,
                    `DELETE FROM ${buildObjectStageProgressTable} WHERE stage_id = ?`,
                    [stage.id as number],
                    true,
                  );
                  await this.databaseService.customQuery(
                    this.buildObjectService.dbProfile,
                    `DELETE FROM ${buildObjectStageDamagedTable} WHERE stage_id = ?`,
                    [stage.id as number],
                    true,
                  );
                }
              }
            }
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

  public async getPreviewItem(id: number | string): Promise<void> {
    await this.buildObjectService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.buildObjectService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.buildObjectService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
