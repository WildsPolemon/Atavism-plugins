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
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {Arena, ArenaService} from './arena.service';
import {distinctPipe} from '../../directives/utils';

@Component({
  selector: 'atv-arena',
  templateUrl: './arena.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.arenaService.tableConfig;
  public list: Arena[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.arenaService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly arenaService: ArenaService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.arenaService.init();
    this.arenaService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.arenaService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.arenaService.updateItem(id as number).then((reload) => {
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
      this.tablesService.executeAction(this.arenaService.dbProfile, this.arenaService.dbTable, action).then(() => {
        if (action.type === ActionsTypes.DELETE) {
          this.databaseService.customQuery(
            this.arenaService.dbProfile,
            `DELETE FROM ${this.arenaService.dbTableTeams} WHERE arenaID = ?`,
            [action.id],
          );
        }
        this.loadData();
      });
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.arenaService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.arenaService.dbProfile;
      const dbTable = this.arenaService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        if (action.type === ActionsTypes.DELETE) {
          await this.databaseService.customQuery(
            profile,
            `DELETE FROM ${this.arenaService.dbTableTeams} WHERE arenaID IN (${action.id.join(', ')})`,
            [],
            true,
          );
        }
        await this.loadData();
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
  }

  public getPreviewItem(id: number | string): void {
    this.arenaService.previewItems(id as number);
  }

  private async loadData() {
    await this.arenaService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.arenaService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
