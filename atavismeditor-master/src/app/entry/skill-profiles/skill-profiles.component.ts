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
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {SkillProfile, SkillProfilesService} from './skill-profiles.service';
import {distinctPipe} from '../../directives/utils';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-skill-profiles',
  templateUrl: './skill-profiles.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillProfilesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.skillProfilesService.tableConfig;
  public list: SkillProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.skillProfilesService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly skillProfilesService: SkillProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.skillProfilesService.init();
    this.loadData();
    this.skillProfilesService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
  }

  public addItem(): void {
    this.skillProfilesService.addItem().then((reload) => {
      if (reload) {
        this.loadData(true);
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.skillProfilesService.updateItem(id as number).then((reload) => {
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

  public getPreviewItem(id: number | string): void {
    this.skillProfilesService.previewItems(id as number);
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<SkillProfile>(
          this.skillProfilesService.dbProfile,
          this.skillProfilesService.dbTable,
          this.skillProfilesService.tableKey,
          action,
          'id',
          'profile_name',
        );
        if (result) {
          await this.loadData(true);
          this.loadingService.hide();
        }
      } else {
        this.tablesService
          .executeAction(this.skillProfilesService.dbProfile, this.skillProfilesService.dbTable, action)
          .then(() => {
            if (action.type === ActionsTypes.DELETE) {
              this.databaseService.customQuery(
                this.skillProfilesService.dbProfile,
                `DELETE FROM ${this.skillProfilesService.dbTableLevel} WHERE profile_id = ?`,
                [action.id],
                true,
              );
            }
            this.loadData(true);
          });
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.skillProfilesService.duplicateItem(action.id);
      if (newId) {
        this.loadData(true);
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.skillProfilesService.dbProfile;
      const dbTable = this.skillProfilesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<SkillProfile>(
          profile,
          dbTable,
          this.skillProfilesService.tableKey,
          action,
          'id',
          'profile_name',
        );
        if (result.length > 0) {
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              profile,
              `DELETE FROM ${this.skillProfilesService.dbTableLevel} WHERE profile_id IN (${result.join(', ')})`,
              [],
              true,
            );
          }
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
    await this.skillProfilesService.getList(this.queryParams, loadAll);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.skillProfilesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
