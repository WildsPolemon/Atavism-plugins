import {Injectable} from '@angular/core';
import {FormComponent} from '../components/form/form.component';
import {
  CompareQuery,
  DialogCloseType,
  DialogConfig,
  FormConfig,
  QueryParams,
  TableFields,
  WhereQuery,
} from '../models/configs';
import {FormGroup} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {LoadingService} from '../components/loading/loading.service';
import {ActionsTypes, ActionTrigger} from '../models/actions.interface';
import {NotificationService} from './notification.service';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from './database.service';
import {DataBaseProfile} from '../settings/profiles/profile';
import * as moment from 'moment';
import {DateFormat} from '../models/date.enum';
import {ConfigTypes, FilterTypes, Operators} from '../models/configRow.interface';
import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {Tab} from '../tabs/tabs.data';
import {HandleDependenciesService} from '../components/handle-dependencies/handle-dependencies.service';
import {TabTypes} from '../models/tabTypes.enum';
import {
  coordinatedEffectsTable,
  damageTable,
  enchantProfileTable,
  slotsGroupTable,
  slotsTable,
  statsTable,
} from '../entry/tables.data';

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  public previewStream = new BehaviorSubject<Record<string, any>>({});
  public preview = this.previewStream.asObservable();
  public dialogRef: MatDialogRef<FormComponent> | undefined | null;
  public activeTabStream = new ReplaySubject<Tab>(1);
  public activeTab = this.activeTabStream.asObservable();
  public reloadActiveTabStream = new ReplaySubject<boolean>(1);
  public reloadActiveTab = this.reloadActiveTabStream.asObservable();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly handleDependencies: HandleDependenciesService,
  ) {}

  public filterItems<T>(list: T[], fields: TableFields, params: QueryParams): T[] {
    const keys = Object.keys(params.where as WhereQuery);
    const compareKeys = params.compare ? Object.keys(params.compare) : [];
    const searchFields = Object.keys(fields).filter((key) => fields[key].useAsSearch);
    return list.filter((item) => {
      for (const key of keys) {
        if (key === 'isactive') {
          continue;
        }
        if (
          (fields[key].filterType === FilterTypes.dropdown || fields[key].filterType === FilterTypes.dynamicDropdown) &&
          fields[key].type === ConfigTypes.hidden
        ) {
          // @ts-ignore
          if (Array.isArray(item[key]) && item[key].indexOf('' + params.where[key]) === -1) {
            return false;
            // @ts-ignore
          } else if (typeof item[key] === 'string' && item[key] !== '' + params.where[key]) {
            return false;
            // @ts-ignore
          } else if (typeof item[key] === 'number' && +item[key] !== +params.where[key]) {
            return false;
          }
        } else if (fields[key].filterType === FilterTypes.date) {
          // @ts-ignore
          if (this.parseDate(item[key]) !== params.where[key]) {
            return false;
          }
        } else if (fields[key].filterType === FilterTypes.booleanType) {
          // @ts-ignore
          if (+item[key] !== +params.where[key]) {
            return false;
          }
        } else {
          // @ts-ignore
          if (item[key] !== params.where[key]) {
            return false;
          }
        }
      }
      for (const key of compareKeys) {
        const compare = (params.compare as CompareQuery)[key];
        if (key === 'item_count') {
          // @ts-ignore
          const itemsCount = item[key].filter((itm) => {
            if (compare.operator === Operators.equal) {
              return +itm === compare.value;
            } else if (compare.operator === Operators.less) {
              return +itm < compare.value;
            } else if (compare.operator === Operators.less_equal) {
              return +itm <= compare.value;
            } else if (compare.operator === Operators.more) {
              return +itm > compare.value;
            } else if (compare.operator === Operators.more_equal) {
              return +itm >= compare.value;
            } else {
              return false;
            }
          }).length;
          if (itemsCount === 0) {
            return false;
          }
        } else {
          if (compare.operator === Operators.equal) {
            // @ts-ignore
            if (+item[key] !== compare.value) {
              return false;
            }
          } else if (compare.operator === Operators.less) {
            // @ts-ignore
            if (+item[key] >= compare.value) {
              return false;
            }
          } else if (compare.operator === Operators.less_equal) {
            // @ts-ignore
            if (+item[key] > compare.value) {
              return false;
            }
          } else if (compare.operator === Operators.more) {
            // @ts-ignore
            if (+item[key] <= compare.value) {
              return false;
            }
          } else if (compare.operator === Operators.more_equal) {
            // @ts-ignore
            if (+item[key] < compare.value) {
              return false;
            }
          }
        }
      }
      // @ts-ignore
      if (!params.search.length) {
        return true;
      }
      // search query
      const itemContainSearching = {};
      for (const field of searchFields) {
        // @ts-ignore
        itemContainSearching[field] = !(
          // @ts-ignore
          (
            (item[field] !== null ? item[field] : '').toString().toLowerCase().indexOf(params.search.toLowerCase()) ===
            -1
          )
        );
      }
      return Object.values(itemContainSearching).some((val) => val);
    });
  }

  public parseDate(date: string): string {
    return moment(date).format(DateFormat.DATE_FORMAT);
  }

  public async openDialog<T>(formConfig: FormConfig, form: FormGroup, subForms = {}): Promise<{ item: T | undefined, action?: DialogCloseType }> {
    this.loadingService.show();
    this.dialogRef = this.matDialog.open(FormComponent, {
      panelClass: formConfig.dialogType ? formConfig.dialogType : DialogConfig.smallDialogOverlay,
      data: {config: formConfig, form, subForms},
    });
    this.dialogRef
      .afterOpened()
      .toPromise()
      .then(() => {
        setTimeout(() => this.loadingService.hide(), 250);
      });
    return new Promise((resolve) => {
      (this.dialogRef as MatDialogRef<FormComponent>)
        .afterClosed()
        .toPromise()
        .then((response: [FormGroup, DialogCloseType]) => {
          if (!response || response[1] === DialogCloseType.cancel) {
            resolve({item: undefined});
            return;
          }
          this.loadingService.show();
          const item: T = {...response[0].getRawValue()};
          resolve({item, action: response[1]});
        });
    });
  }

  public async executeAction(
    dbProfile: DataBaseProfile,
    table: string,
    action: ActionTrigger,
    field = 'id',
    notify = true,
  ): Promise<void> {
    if (action.type === ActionsTypes.MARK_AS_REMOVED) {
      await this.markAsRemoved(dbProfile, table, field, action.id, 0);
      if (notify) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
      }
    } else if (action.type === ActionsTypes.RESTORE) {
      await this.markAsRemoved(dbProfile, table, field, action.id, 1);
      if (notify) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_RESTORED'));
      }
    } else if (action.type === ActionsTypes.DELETE) {
      await this.remove(dbProfile, table, field, action.id);
      if (notify) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_REMOVED'));
      }
    }
  }

  public async executeBulkAction(
    dbProfile: DataBaseProfile,
    table: string,
    action: ActionTrigger,
    field = 'id',
  ): Promise<void> {
    if (action.type === ActionsTypes.MARK_AS_REMOVED) {
      await this.markAsRemovedBulk(dbProfile, table, field, action.id, 0);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_DEACTIVATED'));
    } else if (action.type === ActionsTypes.RESTORE) {
      await this.markAsRemovedBulk(dbProfile, table, field, action.id, 1);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_ACTIVATED'));
    } else if (action.type === ActionsTypes.DELETE) {
      await this.removeBulk(dbProfile, table, field, action.id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
    }
  }

  public async handleDeps<T>(
    profile: DataBaseProfile,
    table: string,
    tableKey: TabTypes,
    action: ActionTrigger,
    field = 'id',
    nameField = 'name',
  ): Promise<boolean> {
    const record = await this.databaseService.queryItem<T>(profile, table, field, action.id);
    if (
      table === damageTable ||
    //  table === statsTable ||
      table === coordinatedEffectsTable ||
      table === slotsGroupTable
    ) {
      action = {id: (record as any).name, type: action.type};
    }

    // @ts-ignore
    const result = await this.handleDependencies.handleView(
      tableKey,
      table,
      profile.type,
      field,
      action,
      // @ts-ignore
      record[nameField],
      // @ts-ignore
      TabTypes.BONUS_SETTING ? record.code : '',
    );
    //, slotsTable
    if (result && ![enchantProfileTable, coordinatedEffectsTable].includes(table)) {
      await this.executeAction(profile, table, action, field);
    }
    if (result) {
      this.reloadActiveTabStream.next(void 0);
    }
    return result;
  }

  public async handleBulkDeps<T>(
    profile: DataBaseProfile,
    table: string,
    tableKey: TabTypes,
    action: ActionTrigger,
    field = 'id',
    nameField = 'name',
  ): Promise<any[]> {
    const where = {
      [` ${field} IN ("${action.id.join('", "')}") `]: 'where_null_using',
    };
    const records = await this.databaseService.queryAll<T>(profile, table, {}, {where});
    const finalResult = [];
    const finalResultSlotGroup = [];
    let anySuccess = false;
    for (const record of records) {
      let newAction = {id: (record as any).id, type: action.type};
      if (
        table === damageTable ||
        // table === statsTable ||
        table === coordinatedEffectsTable ||
        table === slotsGroupTable
      ) {
        newAction = {id: (record as any).name, type: action.type};
      }
      // @ts-ignore
      const result = await this.handleDependencies.handleView(
        tableKey,
        table,
        profile.type,
        field,
        newAction,
        // @ts-ignore
        record[nameField],
        // @ts-ignore
        TabTypes.BONUS_SETTING ? record.code : '',
      );
      if (result) {
        finalResult.push(newAction.id);
        if (table === coordinatedEffectsTable || table === slotsGroupTable) {
          finalResultSlotGroup.push((record as any).id);
        }
      }
      if (result) {
        anySuccess = true;
      }
    }
    if (finalResult.length > 0 && ![enchantProfileTable, coordinatedEffectsTable, slotsTable].includes(table)) {
      await this.executeBulkAction(profile, table, {id: finalResult, type: action.type}, field);
    } else {
    }
    if (anySuccess) {
      this.reloadActiveTabStream.next(void 0);
    }
    return table === coordinatedEffectsTable || table === slotsGroupTable ? finalResultSlotGroup : finalResult;
  }

  private async markAsRemoved(
    dbProfile: DataBaseProfile,
    table: string,
    field: string,
    id: number | string,
    status: number,
  ): Promise<void> {
    await this.databaseService.update(dbProfile, table, {isactive: status}, field, id);
  }

  private async markAsRemovedBulk(
    dbProfile: DataBaseProfile,
    table: string,
    field: string,
    id: Array<number | string>,
    status: number,
  ): Promise<void> {
    await this.databaseService.customQuery(
      dbProfile,
      `UPDATE ${table} SET isactive = ? WHERE ${field} IN ("${id.join('", "')}")`,
      [status],
      true,
    );
  }

  private async remove(dbProfile: DataBaseProfile, table: string, field: string, id: number | string): Promise<void> {
    await this.databaseService.delete(dbProfile, table, field, id, false);
  }

  private async removeBulk(
    dbProfile: DataBaseProfile,
    table: string,
    field: string,
    id: Array<number | string>,
  ): Promise<void> {
    await this.databaseService.customQuery(
      dbProfile,
      `DELETE FROM ${table} WHERE ${field} IN ("${id.join('", "')}")`,
      [],
      true,
    );
  }
}
