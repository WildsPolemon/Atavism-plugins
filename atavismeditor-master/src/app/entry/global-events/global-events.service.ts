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
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {BonusDropdownValue, DropdownItemsService} from '../dropdown-items.service';
import {globalEventsBonusesTable, globalEventsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {bonusSettingsIdFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {GlobalEvent, GlobalEventBonus} from './global-events.data';
import {ImageService} from '../../components/image/image.service';
import {minNotEqualValidator} from '../../validators/min-not-equal.validator';

@Injectable({
  providedIn: 'root',
})
export class GlobalEventsService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.GLOBAL_EVENTS;
  private readonly listStream = new BehaviorSubject<GlobalEvent[]>([]);
  public list = this.listStream.asObservable();
  public profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = globalEventsTable;
  public dbTableSub = globalEventsBonusesTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      start_year: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_month: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_day: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_hour: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_minute: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_year: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_month: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_day: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_hour: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_minute: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      bonus_settings_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: bonusSettingsIdFieldConfig,
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      description: {name: 'description', type: FormFieldType.textarea, width: 100, require: true},
      start: {
        name: 'start',
        type: FormFieldType.fillDateTimePicker,
        width: 5,
        fields: {
          year: 'start_year',
          month: 'start_month',
          day: 'start_day',
          hour: 'start_hour',
          minute: 'start_minute',
        },
      },
      start_year: {name: 'start_year', type: FormFieldType.integer, width: 19, length: 4},
      start_month: {name: 'start_month', type: FormFieldType.integer, width: 19, length: 2},
      start_day: {name: 'start_day', type: FormFieldType.integer, width: 19, length: 2},
      start_hour: {name: 'start_hour', type: FormFieldType.integer, width: 19, length: 2},
      start_minute: {name: 'start_minute', type: FormFieldType.integer, width: 19, length: 2},
      end: {
        name: 'end',
        type: FormFieldType.fillDateTimePicker,
        width: 5,
        fields: {year: 'end_year', month: 'end_month', day: 'end_day', hour: 'end_hour', minute: 'end_minute'},
      },
      end_year: {name: 'end_year', type: FormFieldType.integer, width: 19, length: 4},
      end_month: {name: 'end_month', type: FormFieldType.integer, width: 19, length: 2},
      end_day: {name: 'end_day', type: FormFieldType.integer, width: 19, length: 2},
      end_hour: {name: 'end_hour', type: FormFieldType.integer, width: 19, length: 2},
      end_minute: {name: 'end_minute', type: FormFieldType.integer, width: 19, length: 2},
    },
    subForms: {
      bonuses: {
        title: this.translate.instant(this.tableKey + '.BONUSES'),
        submit: this.translate.instant(this.tableKey + '.ADD_BONUS'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          bonus_settings_id: {
            name: 'bonus_settings_id',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            require: true,
            width: 100,
            fieldConfig: bonusSettingsIdFieldConfig,
          },
          value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
          valuep: {name: 'valuep', type: FormFieldType.decimal, require: true, width: 50},
        },
      },
    },
  };
  private readonly bonusForm = {
    id: {value: '', required: false},
    bonus_settings_id: {value: '', required: true},
    value: {value: '', required: true},
    valuep: {value: '', required: true},
  };
  private bonusSettingsList: BonusDropdownValue[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadOptions();
      }
    });
    this.dropdownItemsService.bonusSettings.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.bonusSettingsList = list;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getBonusesSettings();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      bonus_settings_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'global_event_id',
        table: this.dbTableSub,
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.bonus_settings_id.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<GlobalEvent>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<GlobalEvent>(formConfig, form, {bonuses: this.bonusForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const bonuses = item.bonuses as GlobalEventBonus[];
    delete item.bonuses;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<GlobalEvent>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, bonuses, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return newId;
  }

  public async updateItem(id: number): Promise<number> {
    const record = await this.databaseService.queryItem<GlobalEvent>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE global_event_id = ?`,
      [record.id],
      false,
    );
    let {item, bonusesAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return 0;
    }
    const bonuses = item.bonuses as GlobalEventBonus[];
    delete item.bonuses;
    item = await this.setDefaults(item);
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      const newId = await this.databaseService.insert<GlobalEvent>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, bonuses.map((b) => ({...b, id: undefined})), []);
    } else {
      await this.databaseService.update<GlobalEvent>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, bonuses, bonusesAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<GlobalEvent>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: GlobalEventBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE global_event_id = ?`,
      [id],
    );
    list = list.map((l) => ({...l, id: undefined}));
    let {item} = await this.prepareSubForm(record, list);
    if (!item) {
      return 0;
    }
    const bonuses = item.bonuses as GlobalEventBonus[];
    delete item.bonuses;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<GlobalEvent>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, bonuses, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<GlobalEvent>(this.dbProfile, this.dbTable, 'id', id);
    const bonuses: any[] = [];
    const list: GlobalEventBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE global_event_id = ?`,
      [record.id],
      false,
    );
    for (const item of list) {
      const bonus = this.bonusSettingsList.find((bon) => bon.id === item.bonus_settings_id);
      bonuses.push({
        bonus_settings_id: bonus?.name ?? item.bonus_settings_id,
        value: item.value,
        valuep: item.valuep,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {bonuses}},
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

  private async prepareSubForm(
    record: GlobalEvent,
    list: GlobalEventBonus[],
    updateMode = false,
  ): Promise<{item: GlobalEvent | undefined; bonusesAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const bonusesAll: number[] = [];
    for (const item2 of list) {
      if (item2.id) {
        bonusesAll.push(item2.id);
      }
      (form.get('bonuses') as FormArray).push(
        this.subFormService.buildSubForm<GlobalEventBonus, any>(this.bonusForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<GlobalEvent>(formConfig, form, {bonuses: this.bonusForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, bonusesAll: [], action};
    }
    this.resetForm(form);
    return {item, bonusesAll, action};
  }

  private async setDefaults(item: GlobalEvent): Promise<GlobalEvent> {
    item.description = item.description ?? '';
    item.start_year = item.start_year || -1;
    item.start_month = item.start_month || -1;
    item.start_day = item.start_day || -1;
    item.start_hour = item.start_hour || 0;
    item.start_minute = item.start_minute || 0;
    item.end_year = item.end_year || -1;
    item.end_month = item.start_month || -1;
    item.end_day = item.end_day || -1;
    item.end_hour = item.end_hour || 0;
    item.end_minute = item.end_minute || 0;
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveSubs(id: number, items: GlobalEventBonus[], all: number[] = []): Promise<void> {
    for (const item of items) {
      item.global_event_id = id;
      item.value = +item.value;
      item.valuep = +item.valuep;
      if (item.id) {
        all.splice(all.indexOf(item.id), 1);
        await this.databaseService.update<GlobalEventBonus>(this.dbProfile, this.dbTableSub, item, 'id', item.id);
      } else {
        delete item.id;
        await this.databaseService.insert<GlobalEventBonus>(this.dbProfile, this.dbTableSub, item, false);
      }
    }
    if (all.length > 0) {
      for (const id2 of all) {
        await this.databaseService.delete(this.dbProfile, this.dbTableSub, 'id', id2);
      }
    }
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('bonuses') as FormArray).clear();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      icon: '',
      description: ['', Validators.required],
      start_year: [-1, Validators.min(-1)],
      start_month: [-1, [minNotEqualValidator(0, true), Validators.max(12)]],
      start_day: [-1, [minNotEqualValidator(0, true), Validators.max(31)]],
      start_hour: [0, [Validators.min(0), Validators.max(23)]],
      start_minute: [0, [Validators.min(0), Validators.max(59)]],
      end_year: [-1, Validators.min(-1)],
      end_month: [-1, [minNotEqualValidator(0, true), Validators.max(12)]],
      end_day: [-1, [minNotEqualValidator(0, true), Validators.max(31)]],
      end_hour: [0, [Validators.min(0), Validators.max(23)]],
      end_minute: [0, [Validators.min(0), Validators.max(59)]],
      bonuses: new FormArray([]),
    });
  }
}
