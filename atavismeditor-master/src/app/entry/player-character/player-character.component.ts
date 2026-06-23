import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TablesService} from '../../services/tables.service';
import {QueryParams, TableConfig} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {distinctPipe} from '../../directives/utils';
import {PlayerCharacter, PlayerCharacterService} from './player-character.service';

@Component({
  selector: 'atv-player-character',
  templateUrl: './player-character.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCharacterComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.pcService.tableConfig;
  public list: PlayerCharacter[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.pcService.tableConfig.queryParams;
  private destroyer = new Subject<void>();
  private readonly oldActions = [...this.pcService.tableConfig.actions];

  constructor(
    private readonly pcService: PlayerCharacterService,
    private readonly databaseService: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.pcService.init();
    this.pcService.list.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.list = list;
      this.changeDetectorRef.markForCheck();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.pcService.loadOptionChoices();
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
    this.pcService.addItem().then((reload) => {
      if (reload) {
        this.loadData();
      }
      this.loadingService.hide();
    });
  }

  public updateItem(id: number | string): void {
    this.pcService.updateItem(id as number).then((reload) => {
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
      const profile = this.pcService.dbProfile;
      await this.tablesService.executeAction(profile, this.pcService.dbTable, action);
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableStat} WHERE character_create_id = ?`,
          [action.id],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableSkill} WHERE character_create_id = ?`,
          [action.id],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableItem} WHERE character_create_id = ?`,
          [action.id],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableGender} WHERE character_create_id = ?`,
          [action.id],
          true,
        );
      }
      this.loadData();
    } else if (action.type === ActionsTypes.COPY_TO) {
      const newId = await this.pcService.copyToItem(action.id);
      if (newId) {
        this.loadingService.hide();
        this.updateItem(newId);
        this.loadData();
      }
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.pcService.dbProfile;
      const dbTable = this.pcService.dbTable;
      await this.tablesService.executeBulkAction(profile, dbTable, action);
      if (action.type === ActionsTypes.DELETE) {
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableStat} WHERE character_create_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableSkill} WHERE character_create_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableItem} WHERE character_create_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
        await this.databaseService.customQuery(
          profile,
          `DELETE FROM ${this.pcService.dbTableGender} WHERE character_create_id IN (${action.id.join(', ')})`,
          [],
          true,
        );
      }
      await this.tablesService.executeBulkAction(profile, dbTable, action);
      await this.loadData();
    }
  }

  public getPreviewItem(id: number | string): void {
    this.pcService.previewItems(id as number);
  }

  private async loadData() {
    await this.pcService.getList(this.queryParams);
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.pcService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
