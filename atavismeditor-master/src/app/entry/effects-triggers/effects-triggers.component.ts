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
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {distinctPipe} from '../../directives/utils';
import {Tab} from '../../tabs/tabs.data';
import {EffectsTriggers} from './effects-triggers.data';
import {EffectsTriggersService} from './effects-triggers.service';
import {DatabaseService} from '../../services/database.service';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-effects-triggers',
  templateUrl: './effects-triggers.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsTriggersComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.effectsTriggersService.tableConfig;
  public list: EffectsTriggers[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.effectsTriggersService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly effectsTriggersService: EffectsTriggersService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly databaseService: DatabaseService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.effectsTriggersService.init();
    this.effectsTriggersService.list.pipe(distinctPipe<EffectsTriggers[]>(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe<Tab>(this.destroyer)).subscribe((tab) => {
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
    this.effectsTriggersService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.effectsTriggersService.updateItem(id as number).then((reload) => {
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
      const profile = this.effectsTriggersService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<EffectsTriggers>(
          this.effectsTriggersService.dbProfile,
          this.effectsTriggersService.dbTable,
          this.effectsTriggersService.tableKey,
          action,
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(profile, this.effectsTriggersService.dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.effectsTriggersService.dbActionsTable} WHERE effects_triggers_id = ?`,
            [action.id],
            true,
          );
        }
        await this.loadData();
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.effectsTriggersService.duplicateItem(action.id);
      if (newId) {
        this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.effectsTriggersService.dbProfile;
      const dbTable = this.effectsTriggersService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<EffectsTriggers>(
          profile,
          dbTable,
          this.effectsTriggersService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.effectsTriggersService.dbActionsTable} WHERE effects_triggers_id IN (${result.join(
                ', ',
              )})`,
              [],
              true,
            );
          }
          await this.loadData();
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
  }

  public async getPreviewItem(id: number | string): Promise<void> {
    await this.effectsTriggersService.previewItems(id as string);
  }

  private async loadData() {
    await this.effectsTriggersService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.effectsTriggersService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
