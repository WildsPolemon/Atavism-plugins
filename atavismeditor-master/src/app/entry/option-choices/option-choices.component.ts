import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {QueryParams, Sorting, TableConfig, WhereQuery} from '../../models/configs';
import {ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {distinctPipe} from '../../directives/utils';
import {Subject} from 'rxjs';
import {OptionChoicesService} from './option-choices.service';
import {EditorOption, EditorOptionChoice} from './option-choices.data';
import {HandleOptionDepsService} from '../../components/handle-option-deps/handle-option-deps.service';

@Component({
  selector: 'atv-option-choices',
  templateUrl: './option-choices.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionChoicesComponent implements OnInit, OnDestroy {
  public tableConfig: TableConfig = this.optionChoicesService.tableConfig;
  public list: EditorOption[] = [];
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private destroyer = new Subject<void>();

  constructor(
    private readonly translate: TranslateService,
    private readonly database: DatabaseService,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly handleOptionDeps: HandleOptionDepsService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.loadData();
    this.optionChoicesService.list.pipe(distinctPipe<EditorOption[]>(this.destroyer)).subscribe((list) => {
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
  }

  public async addItem(): Promise<void> {
    const reload = await this.optionChoicesService.addItem();
    if (reload) {
      this.loadData();
    }
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    const {result} = await this.optionChoicesService.updateItem(id as number);
    if (result) {
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
      const ocService = this.optionChoicesService;
      const profile = ocService.dbProfile;
      const record = await this.database.queryItem<EditorOption>(
        ocService.dbProfile,
        ocService.dbTable,
        'id',
        action.id,
      );
      if (!record.deletable) {
        this.notification.error(this.translate.instant(ocService.tableKey + '.NOT_DELETABLE'));
        this.loadingService.hide();
        return;
      }
      if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        const result = await this.handleOptionDeps.handleView(action.id);
        if (!result) {
          this.loadingService.hide();
          return;
        }
      }
      await this.tablesService.executeAction(profile, ocService.dbTable, action);
      await this.loadData();
      if (action.type === ActionsTypes.DELETE) {
        await this.database.customQuery(
          profile,
          `DELETE FROM ${ocService.dbTableChoice} WHERE optionTypeID = ?`,
          [action.id],
          true,
        );
      } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        await this.database.customQuery(
          profile,
          `UPDATE ${ocService.dbTableChoice} SET isactive = 0 WHERE optionTypeID = ?`,
          [action.id],
          true,
        );
      }
      ocService.optionsReload();
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      const newId = await this.optionChoicesService.duplicateItem(action.id);
      if (newId) {
        await this.updateItem(newId);
        this.optionChoicesService.optionsReload();
      }
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.optionChoicesService.dbProfile;
      const dbTable = this.optionChoicesService.dbTable;
      if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
        const handleResult = [];
        for (const id of action.id) {
          const result = await this.handleOptionDeps.handleView(id);
          if (result) {
            handleResult.push(id);
          }
        }
        if (handleResult.length === 0) {
          this.loadingService.hide();
          return;
        }
        await this.tablesService.executeBulkAction(profile, dbTable, {id: handleResult, type: action.type});
        if (action.type === ActionsTypes.DELETE) {
          await this.database.customQuery(
            profile,
            `DELETE FROM ${this.optionChoicesService.dbTableChoice} WHERE optionTypeID IN (${handleResult.join(', ')})`,
            [action.id],
            true,
          );
        } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
          await this.database.customQuery(
            profile,
            `UPDATE ${
              this.optionChoicesService.dbTableChoice
            } SET isactive = 0 WHERE optionTypeID IN (${handleResult.join(', ')})`,
            [action.id],
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

  public async updatePreviewItem(action: {id: number; parentId: number; type: ActionsTypes}): Promise<void> {
    let options = [];
    if (action.type === ActionsTypes.DELETE || action.type === ActionsTypes.MARK_AS_REMOVED) {
      options = await this.database.customQuery(
        this.optionChoicesService.dbProfile,
        `SELECT * FROM ${this.optionChoicesService.dbTableChoice} WHERE isactive = 1 AND optionTypeID = ?`,
        [action.parentId],
      );
    }

    if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.RESTORE) {
      await this.database.customQuery(
        this.optionChoicesService.dbProfile,
        `UPDATE ${this.optionChoicesService.dbTableChoice} SET isactive = ${
          action.type === ActionsTypes.MARK_AS_REMOVED ? '0' : '1'
        } WHERE id = ?`,
        [action.id],
        true,
      );
    } else if (action.type === ActionsTypes.DELETE) {
      await this.database.customQuery(
        this.optionChoicesService.dbProfile,
        `DELETE FROM ${this.optionChoicesService.dbTableChoice} WHERE id = ?`,
        [action.id],
        true,
      );
    }
    if (action.type === ActionsTypes.DELETE || action.type === ActionsTypes.MARK_AS_REMOVED) {
      const record = await this.database.queryItem<EditorOption>(
        this.optionChoicesService.dbProfile,
        this.optionChoicesService.dbTable,
        'id',
        action.parentId,
      );
      const choices = await this.database.customQuery(
        this.optionChoicesService.dbProfile,
        `SELECT * FROM ${this.optionChoicesService.dbTableChoice} WHERE isactive = 1 AND optionTypeID = ?`,
        [action.parentId],
      );
      await this.handleOptionDeps.handleEditedOptions(record, choices, options);
    }

    this.getPreviewItem(action.parentId);
  }

  public getPreviewItem(id: number | string): void {
    this.database
      .customQuery(
        this.optionChoicesService.dbProfile,
        `SELECT * FROM ${this.optionChoicesService.dbTableChoice} WHERE optionTypeID = '${id}'`,
      )
      .then((options: EditorOptionChoice[]) => {
        const choices = [];
        for (const option of options) {
          choices.push({
            id: option.id,
            choice: option.choice,
            deletable: this.translate.instant(option.deletable ? 'SETTINGS.YES' : 'SETTINGS.NO'),
            isactive: option.isactive,
            creationtimestamp: this.tablesService.parseDate(option.creationtimestamp),
            updatetimestamp: this.tablesService.parseDate(option.updatetimestamp),
          });
        }
        this.tablesService.previewStream.next({
          ...this.tablesService.previewStream.getValue(),
          ...{[this.optionChoicesService.tableKey]: {choices}},
        });
        this.changeDetectorRef.markForCheck();
      });
  }

  private async loadData() {
    delete (this.queryParams.where as WhereQuery)['mt.isactive'];
    const ocService = this.optionChoicesService;
    let query = '';
    if (this.queryParams.search) {
      const isActiveQuery = `isactive = ${this.activeRecords ? 1 : 0} AND `;
      query = ` OR (${isActiveQuery}  id in (SELECT optionTypeID FROM ${ocService.dbTableChoice} WHERE ${isActiveQuery} (choice LIKE '%${this.queryParams.search}%')))`;
    }
    if ((this.queryParams.sort as Sorting).field === 'choice') {
      (this.queryParams.sort as Sorting).field = 'optionType';
      this.tableConfig.queryParams = {...this.queryParams};
    }
    const {list, count} = await this.database.queryList<EditorOption>(
      ocService.dbProfile,
      ocService.dbTable,
      this.tableConfig.fields,
      this.queryParams,
      query,
    );
    this.list = list;
    this.tableConfig.count = count;
    this.changeDetectorRef.markForCheck();
    this.loadingService.hide();
  }

  public ngOnDestroy(): void {
    this.optionChoicesService.destroy();
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
