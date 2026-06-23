import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {Subject} from 'rxjs';
import {distinctPipe} from '../../directives/utils';
import {AbilitiesService} from './abilities.service';
import {Ability} from './abilities.data';
import {takeUntil} from 'rxjs/operators';
import {DatabaseService} from '../../services/database.service';

@Component({
  selector: 'atv-abilities',
  templateUrl: './abilities.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.abilitiesService.tableConfig;
  public list: Ability[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.abilitiesService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly abilitiesService: AbilitiesService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.abilitiesService.init();
    this.abilitiesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.loadData(false);
  }

  public addItem(): void {
    this.abilitiesService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.abilitiesService.updateItem(id as number).then((reload) => {
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
        const result = await this.tablesService.handleDeps<Ability>(
          this.abilitiesService.dbProfile,
          this.abilitiesService.dbTable,
          this.abilitiesService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.abilitiesService.dbProfile, this.abilitiesService.dbTable, action)
          .then(() => this.loadData(true));
      }
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          this.abilitiesService.dbProfile,
          `DELETE FROM ${this.abilitiesService.dbTableCombo} WHERE ability_parent_id = ?`,
          [action.id],
          true,
        );
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.abilitiesService.duplicateItem(action.id);
      if (newId) {
        await this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.abilitiesService.dbProfile;
      const dbTable = this.abilitiesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Ability>(
          profile,
          dbTable,
          this.abilitiesService.tableKey,
          action,
        );
        if (action.type === ActionsTypes.DELETE) {
          this.abilitiesService.removeById(action.id);
        }
        if (result.length > 0) {
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
    this.abilitiesService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.abilitiesService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.abilitiesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
