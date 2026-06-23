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
import {TranslateService} from '@ngx-translate/core';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {InstancesService} from './instances.service';
import {TabTypes} from '../../models/tabTypes.enum';
import {distinctPipe} from '../../directives/utils';
import {InstanceTemplate} from './instances.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-instances',
  templateUrl: './instances.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstancesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.instancesService.tableConfig;
  public list: InstanceTemplate[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.instancesService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly instancesService: InstancesService,
    private readonly translate: TranslateService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.instancesService.init();
    this.instancesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.instancesService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.instancesService.updateItem(id as number).then((reload) => {
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
    if ([ActionsTypes.DELETE].includes(action.type)) {
      const canRemove = await this.instancesService.checkIfWorldExist(action.id);
      if (!canRemove) {
        this.notification.error(this.translate.instant(TabTypes.INSTANCES + '.ONE_WORLD_MUST_BE'));
        this.loadingService.hide();
        return;
      }
      const result = await this.tablesService.handleDeps<InstanceTemplate>(
        this.instancesService.dbProfileAdmin,
        this.instancesService.dbTable,
        this.instancesService.tableKey,
        action,
        'id',
        'island_name',
      );
      if (result) {
        await this.instancesService.removeRelated(action.id);
        await this.loadData(true);
        this.loadingService.hide();
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.instancesService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE].includes(action.type)) {
      const dbTable = this.instancesService.dbTable;

      const result = await this.tablesService.handleBulkDeps<InstanceTemplate>(
        this.instancesService.dbProfileAdmin,
        dbTable,
        this.instancesService.tableKey,
        action,
        'id',
        'island_name',
      );
      if (result.length > 0) {
        for (const id of result) {
          await this.instancesService.removeRelated(id);
        }
        await this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public getPreviewItem(id: number | string): void {
    this.instancesService.previewItems(id as number);
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.instancesService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.instancesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
