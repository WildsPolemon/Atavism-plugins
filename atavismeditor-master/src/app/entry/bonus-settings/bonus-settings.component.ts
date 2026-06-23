import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {BonusSetting, BonusSettingService} from './bonus-settings.service';
import {distinctPipe} from '../../directives/utils';
import {Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-bonus-settings',
  templateUrl: './bonus-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusSettingsComponent implements OnInit, OnDestroy {
  public list: BonusSetting[] = [];
  public tableConfig: TableConfig = this.bonusSetting.tableConfig;
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly bonusSetting: BonusSettingService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.bonusSetting.init();
    this.bonusSetting.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.bonusSetting.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.bonusSetting.updateItem(id as number).then((reload) => {
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
        const result = await this.tablesService.handleDeps<BonusSetting>(
          this.bonusSetting.dbProfile,
          this.bonusSetting.dbTable,
          TabTypes.BONUS_SETTING,
          action,
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(this.bonusSetting.dbProfile, this.bonusSetting.dbTable, action);
        await this.loadData(true);
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.bonusSetting.dbProfile;
      const dbTable = this.bonusSetting.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<BonusSetting>(
          profile,
          dbTable,
          TabTypes.BONUS_SETTING,
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
    await this.bonusSetting.getList({...this.queryParams}, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
