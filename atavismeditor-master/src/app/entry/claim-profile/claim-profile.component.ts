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
import {ClaimProfile, ClaimProfileService} from './claim-profile.service';
import {distinctPipe} from '../../directives/utils';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';

@Component({
  selector: 'atv-claim-profile',
  templateUrl: './claim-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.claimService.tableConfig;
  public list: ClaimProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.claimService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly claimService: ClaimProfileService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.claimService.init();
    this.claimService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    const item = await this.claimService.addItem();
    if (item) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const item = await this.claimService.updateItem(id as number);
    if (item) {
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
      const profile = this.claimService.dbProfile;
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<ClaimProfile>(
          this.claimService.dbProfile,
          this.claimService.dbTable,
          this.claimService.tableKey,
          action,
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        this.tablesService.executeAction(profile, this.claimService.dbTable, action).then(() => {
          if (action.type === ActionsTypes.DELETE) {
            this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.claimService.dbTableLimits} WHERE profile_id = ?`,
              [action.id],
            );
          }
          this.loadData();
        });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.claimService.duplicateItem(action.id);
      if (newId) {
        this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.claimService.dbProfile;
      const dbTable = this.claimService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<ClaimProfile>(
          profile,
          dbTable,
          this.claimService.tableKey,
          action,
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.claimService.dbTableLimits} WHERE profile_id IN (${result.join(', ')})`,
              [],
              true,
            );
          }
          await this.loadData();
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
  }

  public async getPreviewItem(id: number | string): Promise<void> {
    await this.claimService.previewItems(id as number);
  }

  private async loadData(): Promise<void> {
    await this.claimService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.claimService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
