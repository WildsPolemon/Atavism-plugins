import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {QueryParams, TableConfig} from "../../models/configs";
import {Subject} from "rxjs";
import {LoadingService} from "../../components/loading/loading.service";
import {DatabaseService} from "../../services/database.service";
import {TablesService} from "../../services/tables.service";
import {MobBehaviorProfile} from "./mob-behavior-profile";
import {distinctPipe} from "../../directives/utils";
import {takeUntil} from "rxjs/operators";
import {ActionsTypes, ActionTrigger} from "../../models/actions.interface";
import {MobBehaviorProfileService} from "./mob-behavior-profile.service";
import {mobBehaviorTable} from "../tables.data";

@Component({
  selector: 'atv-mob-behavior-profile',
  templateUrl: './mob-behavior-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobBehaviorProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.service.tableConfig;
  public list: MobBehaviorProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.service.tableConfig.queryParams;
  private destroyer = new Subject<void>();


  constructor(
    private readonly service: MobBehaviorProfileService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly databaseService: DatabaseService,
    private readonly tablesService: TablesService,
  ) {
  }

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
    const newItem = await this.service.addItem();
    if (newItem) {
      this.loadData();
    }
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
        const result2 = await this.tablesService.handleDeps<MobBehaviorProfile>(
          this.service.dbProfile,
          this.service.dbTable,
          this.service.tableKey,
          action,
        );
        if (result2) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        if(action.type === ActionsTypes.DELETE) {
          const mobBehaviors = (await this.databaseService.customQuery(this.service.dbProfile, `SELECT id FROM ${mobBehaviorTable} WHERE profile_id = ${action.id}`)).map(({id}) => id);
          if (mobBehaviors.length > 0) {
            await this.service.removeById(mobBehaviors, mobBehaviorTable);
          }
        }
        await this.tablesService.executeAction(this.service.dbProfile, this.service.dbTable, action);
        await this.loadData();
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
        let slots = await this.databaseService.customQuery(
          profile,
          `SELECT * FROM ${this.service.dbTable} WHERE id IN (${action.id.join(', ')})`,
        );
        if (!slots) {
          slots = [];
        }
        const result = await this.tablesService.handleBulkDeps<MobBehaviorProfile>(
          profile,
          dbTable,
          this.service.tableKey,
          {type: action.type, id: slots.map((s) => s.name)},
          'name',
        );
        if (result.length > 0) {
          const result2 = await this.tablesService.handleBulkDeps<MobBehaviorProfile>(
            profile,
            dbTable,
            this.service.tableKey,
            action,
          );
          if (result2.length > 0) {
            if(action.type === ActionsTypes.DELETE) {
              let usedMobBehaviors = await this.databaseService.customQuery(this.service.dbProfile, `SELECT id FROM ${mobBehaviorTable} WHERE profile_id IN (${action.id.join(', ')})`);
              usedMobBehaviors = usedMobBehaviors.map(({id}) => id);
              if (usedMobBehaviors.length > 0) {
                await this.service.removeById(usedMobBehaviors, mobBehaviorTable);
              }
            }
            await this.tablesService.executeBulkAction(profile, dbTable, action);
            await this.loadData();
          }
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
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
