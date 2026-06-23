import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {FormConfig, QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {WeatherProfilesService} from './weather-profiles.service';
import {distinctPipe} from '../../directives/utils';
import {Subject} from 'rxjs';
import {WeatherProfile} from './weather-profiles.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-weather-profiles',
  templateUrl: './weather-profiles.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherProfilesComponent implements OnInit, OnDestroy {
  public list: WeatherProfile[] = [];
  public formConfig!: FormConfig;
  public activeRecords = true;
  public tableConfig: TableConfig = this.weatherProfilesService.tableConfig;
  private destroyer = new Subject<void>();
  private queryParams: QueryParams = this.weatherProfilesService.tableConfig.queryParams;

  constructor(
    private readonly translate: TranslateService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly weatherProfilesService: WeatherProfilesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.weatherProfilesService.init();
    this.weatherProfilesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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

  public async addItem(): Promise<void> {
    const reload = await this.weatherProfilesService.addItem();
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.weatherProfilesService.update(id as number);
    if (reload) {
      await this.loadData();
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
        const result = await this.tablesService.handleDeps<WeatherProfile>(
          this.weatherProfilesService.dbProfile,
          this.weatherProfilesService.dbTable,
          this.weatherProfilesService.tableKey,
          action,
        );
        if (result) {
          await this.loadData();
        }
      } else {
        await this.tablesService.executeAction(
          this.weatherProfilesService.dbProfile,
          this.weatherProfilesService.dbTable,
          action,
        );
        await this.loadData();
      }
      this.loadingService.hide();
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.weatherProfilesService.duplicateItem(action.id);
      if (newId) {
        this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.weatherProfilesService.dbProfile;
      const dbTable = this.weatherProfilesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<WeatherProfile>(
          profile,
          dbTable,
          this.weatherProfilesService.tableKey,
          action,
        );
        if (result.length > 0) {
          await this.loadData();
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        this.loadData();
      }
    }
  }

  public ngOnDestroy(): void {
    this.weatherProfilesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private async loadData(): Promise<void> {
    await this.weatherProfilesService.getList(this.queryParams);
    this.loadingService.hide();
  }
}
