import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {InteractiveObjectProfileService, InteractiveObjectProfileSettings} from './interactive-object-profile.service';
import {distinctPipe} from '../../directives/utils';

@Component({
  selector: 'atv-mobs-spawn-data',
  templateUrl: './interactive-object-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveObjectProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.interactiveObjectProfileService.tableConfig;
  public list: InteractiveObjectProfileSettings[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.interactiveObjectProfileService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly interactiveObjectProfileService: InteractiveObjectProfileService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.interactiveObjectProfileService.init();
    this.interactiveObjectProfileService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.interactiveObjectProfileService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.interactiveObjectProfileService.updateItem(id as number).then((reload) => {
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
      const profile = this.interactiveObjectProfileService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<InteractiveObjectProfileSettings>(
          this.interactiveObjectProfileService.dbProfile,
          this.interactiveObjectProfileService.dbTable,
          this.interactiveObjectProfileService.tableKey,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(profile, this.interactiveObjectProfileService.dbTable, action);
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.interactiveObjectProfileService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.interactiveObjectProfileService.dbProfile;
      const dbTable = this.interactiveObjectProfileService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<InteractiveObjectProfileSettings>(
          profile,
          dbTable,
          this.interactiveObjectProfileService.tableKey,
          action,
        );
        if (result.length > 0) {
          await this.loadData(true);
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        this.loadData(true);
      }
    }
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.interactiveObjectProfileService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.interactiveObjectProfileService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
