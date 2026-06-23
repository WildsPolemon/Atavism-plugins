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
import {PatrolPath, PatrolPathService} from './patrol-path.service';
import {distinctPipe} from '../../directives/utils';

@Component({
  selector: 'atv-patrol-path',
  templateUrl: './patrol-path.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatrolPathComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.patrolPathService.tableConfig;
  public list: PatrolPath[] = [];
  private _list: PatrolPath[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.patrolPathService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly patrolPathService: PatrolPathService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.patrolPathService.init();
    this.patrolPathService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this._list = [...this.list];
      this.tableConfig.count = this.list.length;
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

  public updateItem(id: number | string): void {
    this.patrolPathService.updateItem(id as number).then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.list = this.tablesService.filterItems(this._list, this.tableConfig.fields, this.queryParams);
  }

  public actionTrigger(action: ActionTrigger): void {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      this.tablesService
        .executeAction(this.patrolPathService.dbProfile, this.patrolPathService.dbTable, action)
        .then(() => {
          this.loadData();
        });
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      this.patrolPathService.duplicateItem(action.id).then((newId) => {
        this.loadData();
        this.updateItem(newId);
        this.loadingService.hide();
      });
    }
  }

  private loadData() {
    this.patrolPathService.getList(this.activeRecords).then(() => this.loadingService.hide());
  }

  public ngOnDestroy(): void {
    this.patrolPathService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
