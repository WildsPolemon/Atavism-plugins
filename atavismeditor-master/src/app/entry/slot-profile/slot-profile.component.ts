import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {distinctPipe} from '../../directives/utils';
import {takeUntil} from 'rxjs/operators';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {Subject} from 'rxjs';
import {SlotProfileService} from './slot-profile.service';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {SlotProfile} from './slot-profile.data';
import {DatabaseService} from '../../services/database.service';

@Component({
  selector: 'atv-slot-profile',
  templateUrl: './slot-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.service.tableConfig;
  public list: SlotProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.service.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly service: SlotProfileService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly databaseService: DatabaseService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.service.init();
    this.service.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    const reload = await this.service.addItem();
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.service.updateItem(id as number);
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const slotProfile = await this.databaseService.queryItem<SlotProfile>(
          this.service.dbProfile,
          this.service.dbTable,
          'id',
          action.id,
        );
        const result = await this.tablesService.handleDeps<SlotProfile>(
          this.service.dbProfile,
          this.service.dbTable,
          this.service.tableKey,
          {type: action.type, id: slotProfile.name},
          'name',
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(this.service.dbProfile, this.service.dbTable, action);
        await this.loadData();
      }
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          this.service.dbProfile,
          `DELETE FROM ${this.service.dbTableSlot} WHERE slot_profile_id = ?`,
          [action.id],
          true,
        );
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.service.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.service.dbProfile;
      const dbTable = this.service.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        let slotsProfiles = await this.databaseService.customQuery(
          profile,
          `SELECT * FROM ${dbTable} WHERE id IN (${action.id.join(', ')})`,
        );
        if (!slotsProfiles) {
          slotsProfiles = [];
        }
        const result = await this.tablesService.handleBulkDeps<SlotProfile>(
          profile,
          dbTable,
          this.service.tableKey,
          {type: action.type, id: slotsProfiles.map((s) => s.name)},
          'name',
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.service.dbTableSlot} WHERE slot_profile_id IN (${result.join(', ')})`,
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
    await this.service.previewItems(id as number);
  }

  private async loadData() {
    await this.service.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.service.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
