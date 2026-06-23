import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, TableConfig, WhereQuery} from '../../models/configs';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {takeUntil} from 'rxjs/operators';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {LevelXp, LevelXpService} from './level-xp.service';
import {distinctPipe} from '../../directives/utils';
import {GuildLevelSettings} from '../guild/guild.data';

@Component({
  selector: 'atv-level-xp',
  templateUrl: './level-xp.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelXpComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.levelXpService.tableConfig;
  public list: LevelXp[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.levelXpService.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly levelXpService: LevelXpService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.levelXpService.init();
    this.levelXpService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
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
    this.levelXpService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.levelXpService.updateItem(id as number).then((reload) => {
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
    if (action.type === ActionsTypes.DELETE) {
      const record = await this.databaseService.queryItem<LevelXp>(
        this.levelXpService.dbProfile,
        this.levelXpService.dbTable,
        'level',
        action.id,
      );
      const result = await this.databaseService.customQuery(
        this.levelXpService.dbProfile,
        `SELECT count(*) as isBigger FROM ${this.levelXpService.dbTable} where level > ${record.level} and isactive = 1`,
      );
      if (!+result[0].isBigger) {
        await this.tablesService.executeAction(
          this.levelXpService.dbProfile,
          this.levelXpService.dbTable,
          action,
          'level',
        );
        this.loadData();
        this.levelXpService.loadAll();
      } else {
        this.notification.error(this.translate.instant(this.levelXpService.tableKey + '.CANT_REMOVE_NOT_LAST'));
        this.loadingService.hide();
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if (action.type === ActionsTypes.DELETE) {
      const newList = action.id.sort((a, b) => b - a);
      for (const id of newList) {
        const record = await this.databaseService.queryItem<GuildLevelSettings>(
          this.levelXpService.dbProfile,
          this.levelXpService.dbTable,
          'level',
          id,
        );
        const result = await this.databaseService.customQuery(
          this.levelXpService.dbProfile,
          `SELECT count(*) as isBigger FROM ${this.levelXpService.dbTable} where level > ${record.level} and isactive = 1`,
        );
        if (!+result[0].isBigger) {
          await this.tablesService.executeAction(
            this.levelXpService.dbProfile,
            this.levelXpService.dbTable,
            {id: record.level, type: action.type},
            'level',
            false,
          );
        } else {
          this.notification.error(this.translate.instant(this.levelXpService.tableKey + '.CANT_REMOVE_NOT_LAST'));
          await this.loadData();
          await this.levelXpService.loadAll();
          this.loadingService.hide();
          return;
        }
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
      await this.loadData();
      await this.levelXpService.loadAll();
      this.loadingService.hide();
    }
  }

  private async loadData() {
    (this.queryParams.where as WhereQuery).isactive = 1;
    await this.levelXpService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.levelXpService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
