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
import {Damage, DamageService} from './damage.service';
import {distinctPipe} from '../../directives/utils';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-damage',
  templateUrl: './damage.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DamageComponent implements OnInit, OnDestroy {
  public list: Damage[] = [];
  public activeRecords = true;
  public tableConfig: TableConfig = this.damageService.tableConfig;
  private queryParams: QueryParams = this.damageService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly damageService: DamageService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.damageService.init();
    this.damageService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.damageService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.damageService.updateItem(id as string).then((reload) => {
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
        const result = await this.tablesService.handleDeps<Damage>(
          this.damageService.dbProfile,
          this.damageService.dbTable,
          this.damageService.tableKey,
          action,
          'name',
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.damageService.dbProfile, this.damageService.dbTable, action, 'name')
          .then(() => {
            this.loadData(true);
          });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id as string);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.damageService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.damageService.dbProfile;
      const dbTable = this.damageService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<Damage>(
          profile,
          dbTable,
          this.damageService.tableKey,
          action,
          'name',
        );
        if (result.length > 0) {
          await this.loadData(true);
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action, 'name');
        await this.loadData(true);
      }
    }
  }

  private async loadData(loadAll = false): Promise<void> {
    await this.damageService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.damageService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
