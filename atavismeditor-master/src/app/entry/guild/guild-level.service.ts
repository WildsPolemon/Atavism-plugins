import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {guildLevelRequirementsTable, guildLevelSettingsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService} from '../sub-form.service';
import {itemFieldConfig, merchantFieldConfig} from '../dropdown.config';
import {GuildLevelRequirements, GuildLevelSettings} from './guild.data';
import {vipLevelValidator} from '../../validators/vip-level.validator';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GuildLevelService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.GUILD_LEVEL;
  private readonly listStream = new BehaviorSubject<GuildLevelSettings[]>([]);
  public list = this.listStream.asObservable();
  private used: GuildLevelSettings[] = [];
  public dbProfile!: DataBaseProfile;
  public dbTable = guildLevelSettingsTable;
  public dbTableRequirements = guildLevelRequirementsTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    hideSearch: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      level: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      members_num: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      merchant_table: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: merchantFieldConfig,
        data: [],
      },
      warehouse_num_slots: {
        type: ConfigTypes.numberType,
        visible: true,
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
    queryParams: {search: '', where: {}, sort: {field: 'level', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      level: {name: 'level', type: FormFieldType.integer, require: true, width: 50},
      members_num: {name: 'members_num', type: FormFieldType.integer, require: true, width: 50},
      merchant_table: {
        name: 'merchant_table',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: merchantFieldConfig,
        allowNew: true,
        width: 50,
      },
      warehouse_num_slots: {name: 'warehouse_num_slots', type: FormFieldType.integer, width: 50},
    },
    subForms: {
      requirements: {
        title: this.translate.instant(this.tableKey + '.REQUIREMENTS'),
        submit: this.translate.instant(this.tableKey + '.ADD_REQUIREMENT'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          item_id: {
            name: 'item_id',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            width: 50,
            fieldConfig: itemFieldConfig,
          },
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 50},
        },
      },
    },
  };
  private requirementForm = {
    id: {value: '', required: false},
    item_id: {value: '', required: true},
    count: {value: '', required: true, min: 1},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
      }
    });
    this.dropdownItemsService.merchants.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.merchant_table.data = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getMerchants();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<GuildLevelSettings>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    await this.loadUsed();
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    (form.get('level') as AbstractControl).setValidators(null);
    (form.get('level') as AbstractControl).setValidators([
      Validators.required,
      Validators.min(1),
      vipLevelValidator(this.used),
    ]);
    let {item} = await this.tablesService.openDialog<GuildLevelSettings>(formConfig, form, {
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const requirements = item.requirements as GuildLevelRequirements[];
    delete item.requirements;
    const newId = await this.databaseService.insert<GuildLevelSettings>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, requirements, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    await this.loadUsed();
    return {id: newId, value: String(item.level)};
  }

  public async updateItem(id: number | string): Promise<number> {
    const record = await this.databaseService.queryItem<GuildLevelSettings>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and level = ?`,
      [record.id],
    );
    const requirementsAll: number[] = [];
    for (const requirement of list) {
      requirementsAll.push(requirement.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return 0;
    }
    const requirements = item.requirements as GuildLevelRequirements[];
    delete item.requirements;
    if (action === DialogCloseType.save_as_new) {
      const exists = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTable} WHERE level = ?`,
        [item.level],
        true,
      );
      if (exists.length > 0) {
        this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_ERROR'));
        return 0;
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        delete item.id;
        const newId = await this.databaseService.insert<GuildLevelSettings>(this.dbProfile, this.dbTable, item);
        await this.saveSubs(newId, requirements.map((r) => ({...r, id: undefined})), []);
      }
    } else {
      await this.databaseService.update<GuildLevelSettings>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      await this.saveSubs(record.id as number, requirements, requirementsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    await this.loadUsed();
    return 1;
  }

  public async duplicateItem(id: number | string): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<GuildLevelSettings>(
      this.dbProfile,
      this.dbTable,
      'id',
      id as string,
    );
    const record = {...baseRecord};
    delete record.id;
    const maxLevelResult = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT MAX(level) as maxLevel FROM ${this.dbTable} WHERE isactive = 1`,
    );
    record.level = +maxLevelResult[0].maxLevel + 1;
    let list: GuildLevelRequirements[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and level = ?`,
      [baseRecord.id],
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const requirements = item.requirements as GuildLevelRequirements[];
    delete item.requirements;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<GuildLevelSettings>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, requirements, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    await this.loadUsed();
    return newId;
  }

  private async prepareForm(
    record: GuildLevelSettings,
    list: GuildLevelRequirements[],
    updateMode = false
  ): Promise<{item: GuildLevelSettings | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    (form.get('level') as AbstractControl).setValidators(null);
    (form.get('level') as AbstractControl).setValidators([
      Validators.required,
      Validators.min(1),
      vipLevelValidator(this.used.filter((lItem) => (record.id ? lItem.id !== record.id : true))),
    ]);
    for (const requirement of list) {
      (form.get('requirements') as FormArray).push(
        this.subFormService.buildSubForm<GuildLevelRequirements, any>(this.requirementForm, requirement),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    let {item, action} = await this.tablesService.openDialog<GuildLevelSettings>(formConfig, form, {
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item = this.setDefaults(item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public async previewItems(id: number | string): Promise<void> {
    const record = await this.databaseService.queryItem<GuildLevelSettings>(
      this.dbProfile,
      this.dbTable,
      'id',
      id as number,
    );
    const requirements = [];
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and level = ?`,
      [record.id],
    );
    for (const item of list) {
      const itm = await this.dropdownItemsService.getItem(item.item_id);
      requirements.push({
        item_id: itm ? itm.value : item.otherFaction,
        count: item.count,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {requirements}},
    });
  }

  public async loadUsed(): Promise<void> {
    this.used = await this.databaseService.queryAll<GuildLevelSettings>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      {
        where: {isactive: 1},
      },
    );
  }

  public createForm(): FormGroup {
    return this.fb.group({
      level: ['', [Validators.required, Validators.min(1)]],
      members_num: ['', [Validators.required, Validators.min(1)]],
      merchant_table: '',
      warehouse_num_slots: ['', Validators.min(0)],
      requirements: new FormArray([]),
    });
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'level', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private setDefaults(item: GuildLevelSettings): GuildLevelSettings {
    item.members_num = item.members_num ? item.members_num : 1;
    item.merchant_table = item.merchant_table ? item.merchant_table : -1;
    item.warehouse_num_slots = item.warehouse_num_slots ? item.warehouse_num_slots : 1;
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveSubs(level: number, items: GuildLevelRequirements[], itemsAll: number[]): Promise<void> {
    for (const item of items) {
      item.isactive = true;
      item.level = level;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<GuildLevelRequirements>(
          this.dbProfile,
          this.dbTableRequirements,
          item,
          'id',
          item.id,
        );
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        delete item.id;
        await this.databaseService.insert<GuildLevelRequirements>(
          this.dbProfile,
          this.dbTableRequirements,
          item,
          false,
        );
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.update<GuildLevelRequirements>(
          this.dbProfile,
          this.dbTableRequirements,
          {isactive: false, updatetimestamp: this.databaseService.getTimestampNow()} as GuildLevelRequirements,
          'id',
          itemId,
        );
      }
    }
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('requirements') as FormArray).clear();
  }
}
