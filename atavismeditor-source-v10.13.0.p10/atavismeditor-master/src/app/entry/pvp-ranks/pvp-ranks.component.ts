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
import {PvpRanksService} from './pvp-ranks.service';
import {distinctPipe} from '../../directives/utils';
import {PvpRank} from './pvp-ranks.data';
import {AbstractControl, Validators} from '@angular/forms';
import {vipLevelValidator} from '../../validators/vip-level.validator';

@Component({
  selector: 'atv-pvp-ranks',
  templateUrl: './pvp-ranks.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PvpRanksComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.service.tableConfig;
  public list: PvpRank[] = [];
  private used: PvpRank[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.service.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly service: PvpRanksService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.service.init();
    this.service.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.loadUsed();
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

  public async paramsUpdated(params: QueryParams): Promise<void> {
    this.queryParams = params;
    await this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      this.tablesService.executeAction(this.service.dbProfile, this.service.dbTable, action).then(() => {
        if (action.type === ActionsTypes.DELETE) {
          this.databaseService.customQuery(
            this.service.dbProfile,
            `DELETE FROM ${this.service.dbTable} WHERE id = ?`,
            [action.id],
          );
        }
        this.loadData();
      });
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
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
      await this.tablesService.executeBulkAction(profile, dbTable, action);
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          this.service.dbProfile,
          `DELETE FROM ${this.service.dbTable} WHERE id IN (${action.id.join(', ')})`,
          [],
          true,
        );
      }
      this.loadData();
    }
  }

  public getPreviewItem(id: number | string): void {
    this.service.previewItems(id as number);
  }

  private async loadData() {
    await this.service.getList(this.queryParams);
    this.loadingService.hide();
  }

  private async loadUsed(): Promise<void> {
    this.used = await this.databaseService.queryAll<PvpRank>(this.service.dbProfile, this.service.dbTable, this.tableConfig.fields, {
      where: {},
    });
    // if (this.form.get('level')) {
    //   (this.form.get('level') as AbstractControl).setValidators(null);
    //   (this.form.get('level') as AbstractControl).setValidators([
    //     Validators.required,
    //     Validators.min(0),
    //     vipLevelValidator(this.used),
    //   ]);
    // }
  }

  public ngOnDestroy(): void {
    this.service.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
