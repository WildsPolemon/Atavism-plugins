import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {lootTableItemsTable, lootTablesTable} from '../tables.data';
import {getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {itemFieldConfig} from '../dropdown.config';

export interface LootTableItem {
  id?: number;
  loot_table_id: number;
  item: number;
  count: number;
  count_max: number;
  chance: number;
  chance2?: number;
}

export interface LootTable {
  id: number;
  name: string;
  category: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  item?: string[];
  items?: LootTableItem[];
}

@Injectable({
  providedIn: 'root',
})
export class LootTablesService {
  public tableKey = TabTypes.LOOT_TABLE;
  private readonly listStream = new BehaviorSubject<LootTable[]>([]);
  public list = this.listStream.asObservable();
  private itemsForm: SubFieldType = {
    id: {value: '', required: false},
    item: {value: '', required: true},
    count: {value: 1, required: true, min: 1},
    count_max: {value: 1, required: true, min: 1},
    chance: {value: 100, required: true, min: 0, max: 100},
    chance2: {value: '', required: false},
  };
  public dbProfile!: DataBaseProfile;
  public dbTable = lootTablesTable;
  public dbTableItems = lootTableItemsTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true, filterVisible: false, useAsSearch: false},
      name: {
        type: ConfigTypes.stringType,
        visible: true,
        alwaysVisible: false,
        filterVisible: false,
        useAsSearch: true,
      },
      item: {
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
      count_max: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      chance: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {
        type: ConfigTypes.date,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.date,
        useAsSearch: false,
      },
      updatetimestamp: {
        type: ConfigTypes.date,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.date,
        useAsSearch: false,
      },
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
        title: this.translate.instant(this.tableKey + '.ITEMS'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        minCount: 1,
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          item: {
            name: 'item',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: itemFieldConfig,
            require: true,
            allowNew: true,
            width: 50,
          },
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 12},
          count_max: {name: 'count_max', type: FormFieldType.integer, require: true, width: 12},
          chance: {name: 'chance', type: FormFieldType.decimal, require: true, width: 12},
          chance2: {name: 'chance2', type: FormFieldType.decimal, require: false, width: 12},
        },
      },
    },
  };
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly subFormService: SubFormService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
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
      this.dropdownItemsService.getLootTables();
    }
    const subFields: Record<string, SubQueryField> = {
      item: {type: SubTable.left_join, main: 'id', related: 'loot_table_id', table: this.dbTableItems},
      count: {type: SubTable.left_join, main: 'id', related: 'loot_table_id', table: this.dbTableItems},
      count_max: {type: SubTable.left_join, main: 'id', related: 'loot_table_id', table: this.dbTableItems},
      chance: {type: SubTable.left_join, main: 'id', related: 'loot_table_id', table: this.dbTableItems},
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<LootTable>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<LootTable>(formConfig, form, {items: this.itemsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const items = item.items as LootTableItem[];
    delete item.items;
    items.sort((a, b) => +a.chance - +b.chance);
    const newId = await this.databaseService.insert<LootTable>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, items);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<LootTable>(this.dbProfile, this.dbTable, 'id', id);
    const subItems: LootTableItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE loot_table_id = ?`,
      [record.id],
      false,
    );
    const itemsAll: number[] = subItems.map((subItem) => subItem.id as number);
    subItems.sort((a, b) => +a.chance - +b.chance);
    let schance = 0;
    let count = 0;
    for (let i = 0; i < subItems.length; i++) {
      const v = subItems[i].chance;
      count = 0;
      for (let j = 0; j < subItems.length; j++) {
        const cv = subItems[j].chance;
        if(cv === v){
          count++;
        }
      }
      if (i === 0){
        subItems[i].chance2 = v / count;
        schance += v / count;
      } else {
        const pv = subItems[i - 1].chance;
        const pc = subItems[i - 1].chance2;
        subItems[i].chance2 = v === pv ? pc : (v - schance) / count;
        schance += v === pv ? pc : (v - schance) / count;
      }
    }

    const {item, action} = await this.prepareForm(record, subItems, true);
    if (!item) {
      return null;
    }
    const items = item.items as LootTableItem[];
    delete item.items;
    items.sort((a, b) => +a.chance - +b.chance);
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = record.id;
    if(action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<LootTable>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, items.map((t) => ({...t, id: undefined})));
    } else {
      await this.databaseService.update<LootTable>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, items, itemsAll);
    }
    return {id: newId, value: item.name};
  }

  private async saveSubs(recordId: number, items: LootTableItem[], itemsAll: number[] = []): Promise<void> {
    for (const item of items) {
      item.loot_table_id = recordId;
      delete item.chance2;
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<LootTableItem>(this.dbProfile, this.dbTableItems, item, 'id', item.id);
      } else {
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<LootTableItem>(this.dbProfile, this.dbTableItems, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableItems, 'id', itemId, false);
      }
    }
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<LootTable>(this.dbProfile, this.dbTable, 'id', id);
    const record: LootTable = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    let subItems: LootTableItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE loot_table_id = ?`,
      [baseRecord.id],
      false,
    );
    subItems = subItems.map((subItem) => ({...subItem, ...{id: undefined}}));
    subItems.sort((a, b) => +a.chance - +b.chance);
    let schance = 0;
    let count = 0;
    for (let i = 0; i < subItems.length; i++) {
      const v = subItems[i].chance;
      count = 0;
      for (let j = 0; j < subItems.length; j++) {
        const cv = subItems[j].chance;
        if(cv === v){
          count++;
        }
      }
      if (i === 0){
        subItems[i].chance2 = v / count;
        schance += v / count;
      } else {
        const pv = subItems[i - 1].chance;
        const pc = subItems[i - 1].chance2;
        subItems[i].chance2 = v === pv ? pc : (v - schance) / count;
        schance += v === pv ? pc : (v - schance) / count;
      }
    }
    const {item} = await this.prepareForm(record, subItems);
    if (!item) {
      return 0;
    }
    const items = item.items as LootTableItem[];
    delete item.items;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    items.sort((a, b) => +a.chance - +b.chance);
    const newId = await this.databaseService.insert<LootTable>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, items);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: LootTable, subItems: LootTableItem[], updateMode = false): Promise<{item: LootTable | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const subItem of subItems) {
      const itemsForm = {...this.itemsForm};
      itemsForm.count_max.min = subItem.count;
      (form.get('items') as FormArray).push(this.subFormService.buildSubForm<LootTableItem, any>(itemsForm, subItem));
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<LootTable>(formConfig, form, {items: this.itemsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    this.resetForm(form);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<LootTable>(this.dbProfile, this.dbTable, 'id', id);
    const items = [];
    const subItems = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE loot_table_id = ?`,
      [record.id],
      false,
    );
    for (const subItem of subItems) {
      const item = await this.dropdownItemsService.getItem(subItem.item);
      items.push({
        item: item ? item.value : subItem.item,
        count: subItem.count,
        count_max: subItem.count_max,
        chance: subItem.chance,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {items}},
    });
  }

  private createForm(): FormGroup {
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
