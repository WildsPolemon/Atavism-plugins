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
import {AbilitiesTriggers} from './abilities-triggers.data';
import {AbilitiesTriggersService} from './abilities-triggers.service';
import {DatabaseService} from '../../services/database.service';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-effects-triggers',
  templateUrl: './abilities-triggers.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesTriggersComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.abilitiesTriggersService.tableConfig;
  public list: AbilitiesTriggers[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.abilitiesTriggersService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly abilitiesTriggersService: AbilitiesTriggersService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly databaseService: DatabaseService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.abilitiesTriggersService.init();
    this.abilitiesTriggersService.list.pipe(distinctPipe<AbilitiesTriggers[]>(this.destroyer)).subscribe((list) => {
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
    this.abilitiesTriggersService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.abilitiesTriggersService.updateItem(id as number).then((reload) => {
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
      const profile = this.abilitiesTriggersService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<AbilitiesTriggers>(
          this.abilitiesTriggersService.dbProfile,
          this.abilitiesTriggersService.dbTable,
          this.abilitiesTriggersService.tableKey,
          action,
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(profile, this.abilitiesTriggersService.dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.abilitiesTriggersService.dbActionsTable} WHERE abilities_triggers_id = ?`,
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
      const newId = await this.abilitiesTriggersService.duplicateItem(action.id);
      if (newId) {
        this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.abilitiesTriggersService.dbProfile;
      const dbTable = this.abilitiesTriggersService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<AbilitiesTriggers>(
          profile,
          dbTable,
          this.abilitiesTriggersService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.abilitiesTriggersService.dbActionsTable} WHERE abilities_triggers_id IN (${result.join(
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
    await this.abilitiesTriggersService.previewItems(id as string);
  }

  private async loadData() {
    await this.abilitiesTriggersService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.abilitiesTriggersService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
