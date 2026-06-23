import {Injectable} from '@angular/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {merchantItemTable, merchantTable} from '../tables.data';
import {getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {Mob} from '../mobs/mobs.data';
import {itemFieldConfig} from '../dropdown.config';

export interface Merchant {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  items?: MerchantItem[];
}

export interface MerchantItem {
  id?: number;
  tableID: number;
  itemID: number;
  count: number;
  refreshTime: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  public tableKey = TabTypes.MERCHANT;
  private readonly listStream = new BehaviorSubject<Merchant[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = merchantTable;
  public dbTableItems = merchantItemTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      itemID: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      count: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      refreshTime: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
      updatetimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
    },
    subForms: {
      items: {
        title: this.translate.instant(this.tableKey + '.ITEMID'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        minCount: 1,
        draggable: true,
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          itemID: {
            name: 'itemID',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: itemFieldConfig,
            width: 50,
            require: true,
            allowNew: true,
          },
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 25},
          refreshTime: {name: 'refreshTime', type: FormFieldType.integer, require: true, width: 25},
        },
      },
    },
  };
  private itemsForm: SubFieldType = {
    id: {value: '', required: false},
    itemID: {value: '', required: true},
    count: {value: '', required: true, min: -1},
    refreshTime: {value: '', required: true, min: 0},
  };
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
      }
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getMerchants();
    }
    const subFields: Record<string, SubQueryField> = {
      itemID: {
        type: SubTable.left_join,
        main: 'id',
        related: 'tableID',
        table: this.dbTableItems,
        where: {},
      },
      count: {
        type: SubTable.left_join,
        main: 'id',
        related: 'tableID',
        table: this.dbTableItems,
        where: {},
      },
      refreshTime: {
        type: SubTable.left_join,
        main: 'id',
        related: 'tableID',
        table: this.dbTableItems,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.itemID.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.count.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.refreshTime.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Merchant>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<DropdownValue | null> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<Merchant>(formConfig, form, {items: this.itemsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const items = item.items as MerchantItem[];
    delete item.items;
    const newId = await this.databaseService.insert<Merchant>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, items, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<Merchant>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: MerchantItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and tableID = ?`,
      [record.id],
    );
    const itemsAll: number[] = list.map((subItem) => subItem.id as number);
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const items = item.items as MerchantItem[];
    delete item.items;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Merchant>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, items.map((t) => ({...t, id: undefined})), []);
    } else {
      await this.databaseService.update<Merchant>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, items, itemsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Merchant>(this.dbProfile, this.dbTable, 'id', id);
    let list: MerchantItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and tableID = ?`,
      [baseRecord.id],
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const used = await this.databaseService.queryItem<Mob>(this.dbProfile, this.dbTable, 'name', record.name);
    if (used) {
      this.notification.error(this.translate.instant('MERCHANT.DUPLICATED_NAME'));
      return 0;
    }
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const items = item.items as MerchantItem[];
    delete item.items;
    const newId = await this.databaseService.insert<Merchant>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, items, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: Merchant, list: MerchantItem[], updateMode = false): Promise<{item: Merchant | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const listItem of list) {
      (form.get('items') as FormArray).push(this.subFormService.buildSubForm(this.itemsForm, listItem));
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Merchant>(formConfig, form, {items: this.itemsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private async saveSubs(recordId: number, items: MerchantItem[], itemsAll: number[]) {
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableItems, 'id', itemId, false);
      }
    }
    for (const item of items) {
      item.isactive = true;
      item.tableID = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      item.creationtimestamp = this.databaseService.getTimestampNow();
      delete item.id;
      await this.databaseService.insert<MerchantItem>(this.dbProfile, this.dbTableItems, item, false);
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Merchant>(this.dbProfile, this.dbTable, 'id', id);
    const items = [];
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and tableID = ?`,
      [record.id],
    );
    for (const item of list) {
      const itm = await this.dropdownItemsService.getItem(item.itemID);
      items.push({
        itemID: itm ? itm.value : item.itemID,
        count: item.count,
        refreshTime: item.refreshTime,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {items}},
    });
  }

  private createForm() {
    return this.fb.group({
      name: ['', Validators.required],
      items: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('items') as FormArray).clear();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
