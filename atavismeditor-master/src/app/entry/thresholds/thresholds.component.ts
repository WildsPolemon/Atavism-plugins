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
import {StatThresholdTmp, ThresholdsService} from './thresholds.service';
import {distinctPipe} from '../../directives/utils';
import {Tab} from '../../tabs/tabs.data';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-thresholds',
  templateUrl: './thresholds.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThresholdsComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.thresholdsService.tableConfig;
  public list: StatThresholdTmp[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.thresholdsService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly thresholdsService: ThresholdsService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.thresholdsService.init();
    this.thresholdsService.list.pipe(distinctPipe<StatThresholdTmp[]>(this.destroyer)).subscribe((list) => {
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
    this.thresholdsService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.thresholdsService.updateItem(id as string).then((reload) => {
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

  public actionTrigger(action: ActionTrigger): void {
    if (action.type === ActionsTypes.DELETE) {
      this.tablesService
        .executeAction(this.thresholdsService.dbProfile, this.thresholdsService.dbTable, action, 'stat_function')
        .then(() => {
          this.loadData();
        });
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async getPreviewItem(id: number | string): Promise<void> {
    await this.thresholdsService.previewItems(id as string);
  }

  private async loadData() {
    await this.thresholdsService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.thresholdsService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
