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
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {CoordinatedEffect, CoordinatedEffectsService} from './coordinated-effects.service';
import {distinctPipe} from '../../directives/utils';

@Component({
  selector: 'atv-coordinated-effects',
  templateUrl: './coordinated-effects.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatedEffectsComponent implements OnInit, OnDestroy {
  public list: CoordinatedEffect[] = [];
  public tableConfig: TableConfig = this.coordEffectsService.tableConfig;
  public activeRecords = true;
  private queryParams: QueryParams = this.coordEffectsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly coordEffectsService: CoordinatedEffectsService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.coordEffectsService.init();
    this.coordEffectsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.coordEffectsService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.coordEffectsService.updateItem(id as number).then((reload) => {
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
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<CoordinatedEffect>(
          this.coordEffectsService.dbProfile,
          this.coordEffectsService.dbTable,
          this.coordEffectsService.tableKey,
          action,
        );
        if (result) {
          await this.tablesService.executeAction(
            this.coordEffectsService.dbProfile,
            this.coordEffectsService.dbTable,
            action,
          );
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.coordEffectsService.dbProfile, this.coordEffectsService.dbTable, action)
          .then(() => {
            this.loadData();
          });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.coordEffectsService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.coordEffectsService.dbProfile;
      const dbTable = this.coordEffectsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<CoordinatedEffect>(
          profile,
          dbTable,
          this.coordEffectsService.tableKey,
          action,
        );
        if (result.length > 0) {
          await this.tablesService.executeBulkAction(profile, dbTable, {id: result, type: action.type});
          await this.loadData();
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
  }

  private async loadData() {
    await this.coordEffectsService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.coordEffectsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
