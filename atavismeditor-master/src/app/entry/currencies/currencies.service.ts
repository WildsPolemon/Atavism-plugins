import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {currenciesTable, currencyConversionTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {currencyFieldConfig, currencyGroupFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

export interface Currency {
  id?: number;
  category: number;
  name: string;
  icon: string;
  icon2: string;
  description: string;
  maximum: number;
  currencyGroup: number;
  currencyPosition: number;
  external: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  conversions?: CurrencyConversion[];
}
export interface CurrencyConversion {
  id?: number;
  currencyID?: number;
  currencyToID: number;
  amount: number;
  autoConverts: boolean;
  isactive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CurrenciesService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.CURRENCIES;
  private readonly listStream = new BehaviorSubject<Currency[]>([]);
  public list = this.listStream.asObservable();
  public profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = currenciesTable;
  public dbTableConversion = currencyConversionTable;
  private readonly currencyPosition: DropdownValue[] = [
    {id: 0, value: '1'},
    {id: 1, value: '2'},
    {id: 2, value: '3'},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      description: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      maximum: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      currencyGroup: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      currencyPosition: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.currencyPosition,
      },
      external: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
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
    saveAsNew: true,
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
      maximum: {name: 'maximum', type: FormFieldType.integer, require: true, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      currencyGroup: {
        name: 'currencyGroup',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: currencyGroupFieldConfig,
        search: true,
        width: 50,
        allowNew: true,
      },
      currencyPosition: {
        name: 'currencyPosition',
        type: FormFieldType.dropdown,
        width: 50,
        hideNone: true,
        require: true,
        data: this.currencyPosition,
      },
      external: {name: 'external', type: FormFieldType.boolean, width: 100},
      description: {name: 'description', type: FormFieldType.input, length: 224, width: 100},
    },
    subForms: {
      conversions: {
        title: this.translate.instant(this.tableKey + '.CONVERSIONS'),
        submit: this.translate.instant(this.tableKey + '.ADD_CONVERSION'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          amount: {name: 'amount', type: FormFieldType.integer, require: true, width: 33},
          currencyToID: {
            name: 'currencyToID',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            require: true,
            width: 33,
            fieldConfig: currencyFieldConfig,
          },
          autoConverts: {name: 'autoConverts', type: FormFieldType.boolean, width: 33},
        },
      },
    },
  };
  private conversionForm: SubFieldType = {
    id: {value: '', required: false},
    amount: {value: 0, required: true},
    currencyToID: {value: 0, required: true},
    autoConverts: {value: false},
  };
  private currenciesList: DropdownValue[] = [];
  private externalUsed = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile: Profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.getOptions();
      }
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.currenciesList = listing;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.getOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.currencyGroup.data = await this.optionChoicesService.getOptionsByType('Currency Group');
  }

  private async getOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getCurrencies();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getCurrencies();
    }
    const response = await this.databaseService.queryList<Currency>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    if (loadAll) {
      this.loadAll();
    }
  }

  public loadAll(): void {
    this.databaseService
      .queryAll<Currency>(this.dbProfile, this.dbTable, this.tableConfig.fields, {where: {isactive: 1}})
      .then((list) => (this.externalUsed = list.filter((item) => item.external).length > 0));
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    if (this.externalUsed) {
      (form.get('external') as AbstractControl).disable();
    }
    formConfig.saveAsNew = false;
    let {item} = await this.tablesService.openDialog<Currency>(formConfig, form, {conversions: this.conversionForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const items = item.conversions as CurrencyConversion[];
    delete item.conversions;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<Currency>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, items, []);
    this.resetForm(form);
    this.loadAll();
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<Currency>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: CurrencyConversion[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableConversion} WHERE isactive = 1 and currencyID = ?`,
      [record.id],
    );
    let conversionsAll: number[] = [];
    for (const conversion of list) {
      conversionsAll.push(conversion.id as number);
    }
    let {item, action} = await this.prepareForm(record, list);
    if (!item) {
      return null;
    }
    let conversions = item.conversions as CurrencyConversion[];
    delete item.conversions;
    item = await this.setDefaults(item);
    let newId = record.id as number;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      newId = await this.databaseService.insert<Currency>(this.dbProfile, this.dbTable, item);
      conversions = conversions.map((c) => ({...c, id: undefined}));
      conversionsAll = [];
    } else {
      await this.databaseService.update<Currency>(this.dbProfile, this.dbTable, item, 'id', newId);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    await this.saveSubs(newId, conversions, conversionsAll);
    this.loadAll();
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  private async saveSubs(recordId: number, items: CurrencyConversion[], itemsAll: number[]): Promise<void> {
    for (const item of items) {
      item.isactive = true;
      item.currencyID = recordId;
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<CurrencyConversion>(
          this.dbProfile,
          this.dbTableConversion,
          item,
          'id',
          item.id,
        );
      } else {
        // @ts-ignore
        delete item.id;
        item.isactive = true;
        item.autoConverts = item.autoConverts ? item.autoConverts : false;
        await this.databaseService.insert<CurrencyConversion>(this.dbProfile, this.dbTableConversion, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableConversion, 'id', itemId, false);
      }
    }
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Currency>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: CurrencyConversion[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableConversion} WHERE isactive = 1 and currencyID = ?`,
      [baseRecord.id],
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const conversions = item.conversions as CurrencyConversion[];
    delete item.conversions;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.external = false;
    const newId = await this.databaseService.insert<Currency>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, conversions, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: Currency, list: CurrencyConversion[]): Promise<{item: Currency | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    formConfig.saveAsNew = !!record.id;
    const form = this.createForm();
    for (const conversion of list) {
      (form.get('conversions') as FormArray).push(
        this.subFormService.buildSubForm<CurrencyConversion, any>(this.conversionForm, conversion),
      );
    }
    form.patchValue(record);
    if (this.externalUsed && !record.external) {
      form.get('external')?.disable();
    } else {
      form.get('external')?.enable();
    }
    let {item, action} = await this.tablesService.openDialog<Currency>(formConfig, form, {conversions: this.conversionForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action: DialogCloseType.cancel};
    }
    item = await this.setDefaults(item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private async setDefaults(record: Currency): Promise<Currency> {
    record.category = 0;
    record.isactive = true;
    record.maximum = record.maximum ? record.maximum : 1;
    record.currencyGroup = record.currencyGroup ? record.currencyGroup : 0;
    record.external = record.external ?? false;
    record.updatetimestamp = this.databaseService.getTimestampNow();
    record.description = record.description ? record.description : '';
    record.icon2 = await this.imageService.parseImage(this.profile, record.icon);
    if (!record.icon) {
      record.icon = this.profile.defaultImage;
    }
    return record;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Currency>(this.dbProfile, this.dbTable, 'id', id);
    const items: any = [];
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableConversion} WHERE isactive = 1 and currencyID = ?`,
      [record.id],
    );
    for (const item of list) {
      const itm = this.currenciesList.find((it) => it.id === item.currencyToID);
      items.push({
        amount: item.amount,
        currencyToID: itm ? itm.value : item.currencyToID,
        autoConverts: item.autoConverts
          ? this.translate.instant('SETTINGS.YES')
          : this.translate.instant('SETTINGS.NO'),
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {conversions: items}},
    });
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

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('conversions') as FormArray).clear();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      maximum: [1, [Validators.min(1), Validators.required]],
      icon: '',
      currencyGroup: 0,
      currencyPosition: [null, Validators.required],
      external: false,
      description: '',
      conversions: new FormArray([]),
    });
  }
}
