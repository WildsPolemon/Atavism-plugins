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
import {distinctPipe} from '../../directives/utils';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {EffectsService} from './effects.service';
import {Effect} from './effects.data';

@Component({
  selector: 'atv-effects',
  templateUrl: './effects.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.effectsService.tableConfig;
  public list: Effect[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.effectsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly effectsService: EffectsService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.effectsService.init();
    this.effectsService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.effectsService.addItem().then((reload) => {
      if (reload) {
        this.loadData(false);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.effectsService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData(false);
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
        const result = await this.tablesService.handleDeps<Effect>(
          this.effectsService.dbProfile,
          this.effectsService.dbTable,
          this.effectsService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.effectsService.dbProfile, this.effectsService.dbTable, action)
          .then(() => this.loadData(true));
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.effectsService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.effectsService.dbProfile;
      const dbTable = this.effectsService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Effect>(
          profile,
          dbTable,
          this.effectsService.tableKey,
          action,
        );
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

  private async loadData(loadAll = false): Promise<void> {
    await this.effectsService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.effectsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
