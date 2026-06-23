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
import {AuctionHouseProfile} from './auction-profile.data';
import {AuctionProfileService} from './auction-profile.service';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'atv-auction-profile',
  templateUrl: './auction-profile.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuctionProfileComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.auctionProfileService.tableConfig;
  public list: AuctionHouseProfile[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.auctionProfileService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly auctionProfileService: AuctionProfileService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.auctionProfileService.init();
    this.auctionProfileService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    const reload = await this.auctionProfileService.addItem();
    if (reload) {
      await this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const reload = await this.auctionProfileService.updateItem(id as number);
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
      if ([ActionsTypes.DELETE, ActionsTypes.MARK_AS_REMOVED].includes(action.type) && action.id === 1) {
        this.notification.warn(this.translate.instant('AUCTION_HOUSE_PROFILE.CANT_REMOVE_ID1'));
        this.loadingService.hide();
        return;
      }
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.tablesService.handleDeps<AuctionHouseProfile>(
          this.auctionProfileService.dbProfile,
          this.auctionProfileService.dbTable,
          this.auctionProfileService.tableKey,
          action,
        );
        if (result) {
          await this.loadData();
          this.loadingService.hide();
        }
      } else {
        await this.tablesService.executeAction(
          this.auctionProfileService.dbProfile,
          this.auctionProfileService.dbTable,
          action,
        );
        await this.loadData();
      }
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      const newId = await this.auctionProfileService.duplicateItem(action.id);
      if (newId) {
        await this.loadData();
      }
      this.loadingService.hide();
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if ([ActionsTypes.DELETE, ActionsTypes.MARK_AS_REMOVED].includes(action.type) && action.id.includes(1)) {
        this.notification.warn(this.translate.instant('AUCTION_HOUSE_PROFILE.CANT_REMOVE_ID1'));
        this.loadingService.hide();
        return;
      }
      const profile = this.auctionProfileService.dbProfile;
      const dbTable = this.auctionProfileService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const result = await this.tablesService.handleBulkDeps<AuctionHouseProfile>(
          profile,
          dbTable,
          this.auctionProfileService.tableKey,
          action,
        );
        if (result.length > 0) {
          await this.loadData();
        }
        this.loadingService.hide();
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
        await this.loadData();
      }
    }
  }

  private async loadData() {
    await this.auctionProfileService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.auctionProfileService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
