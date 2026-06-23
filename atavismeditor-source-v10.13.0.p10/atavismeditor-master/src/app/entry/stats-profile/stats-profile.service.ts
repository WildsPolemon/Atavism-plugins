import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType, hiddenField,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {
  statProfileStatsTable,
  statProfileTable,
  statsTable
} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  statIdFieldConfig
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {StatSetting, StatsProfile} from './stats-profile.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';



@Injectable({
  providedIn: 'root',
})
export class StatsProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.STATS_PROFILE;
  private readonly listStream = new BehaviorSubject<StatsProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = statProfileTable;
  public dbStatSettingsTable = statProfileStatsTable;
  public dbStatsTable = statsTable;
  private formDestroyer = new Subject<void>();

  private readonly statSettingForm: SubFieldType = {
    profile_id: {value: '', required: false},
    id: {value: -1, required: false},
    stat_id: {value: -1, required: true},
    value: {value: 0, required: true},
    level_increase: {value: 0, required: true},
    level_percent_increase: {value: 0, required: true},
    serverPresent: {value: 0, required: true},
    send_to_client: {value: 1, required: true},
    override_values: {value: 1, required: true},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {
        type: ConfigTypes.numberType,
        visible: true,
        alwaysVisible: true,
      },
      name: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
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
      // stat_id: {
      //   type: ConfigTypes.hidden,
      //   visible: false,
      //   alwaysVisible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.dynamicDropdown,
      //   fieldConfig: statIdFieldConfig,
      // },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 45},
    },
    subForms: {
      statsSettings: {
        title: this.translate.instant(this.tableKey + '.STAT'),
        submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
        minCount: 1,
        columnWidth: 100,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          profile_id: {name: 'profile_id', label: '', type: FormFieldType.hidden},
          stat_id: {
            name: 'stat_id',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            width: 25,
            search: true,
            fieldConfig: statIdFieldConfig,
            require: true
          },
          serverPresent: {
            name: 'serverPresent',
            type: FormFieldType.boolean,
            width: 15,
          },
          send_to_client: {
            name: 'send_to_client',
            type: FormFieldType.boolean,
            width: 15,
          },
          override_values: {
            name: 'override_values',
            type: FormFieldType.boolean,
            width: 15,
          },
          value: {
            name: 'value',
            type: FormFieldType.integer,
            width: 10,
            hidden: hiddenField.visible,
          },
          level_increase: {
            name: 'level_increase',
            type: FormFieldType.integer,
            width: 10,
             hidden: hiddenField.visible,
          },
          level_percent_increase: {
            name: 'level_percent_increase',
            type: FormFieldType.integer,
            width: 10,
            hidden: hiddenField.visible,
          },
        },
      },
    },
  };
  private statList: DropdownValue[] = [];
  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const defaultIsActiveFilter = typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        this.loadOptions();
        this.loadOptionChoices();
      }
    });
    this.dropdownItemsService.statsId.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.statList = list;
    });
    // this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
    //   this.loadOptionChoices();
    // });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
      this.loadOptionChoices();
    });
    this.loadOptionChoices();
  }

  public async loadOptionChoices(): Promise<void> {
    //this.actionList = await this.optionChoicesService.getOptionsByType('Weapon Actions');

  }
  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getStatsId();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      stat_id: {
        type: SubTable.left_join,
        main: 'stat_id',
        related: 'id',
        table: this.dbStatsTable,
      },
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<StatsProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    this.listStream.next(response.list.map((item) => ({id: item.profile_id, ...item})));
  }

  public async previewItems(id: number): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbStatSettingsTable} WHERE profile_id = ?`,
      [id],
    );
    const statsSettings = [];
    for (const item1 of list) {
      const act = this.statList.find((item) => item.id === item1.stat_id);
      statsSettings.push({
        stat_id: act ? act.value : item1.stat_id,
        value: item1.value,
        level_increase: item1.level_increase,
        level_percent_increase: item1.level_percent_increase,
        send_to_client: item1.send_to_client == 1 ? 'YES' : 'No',
        serverPresent: item1.serverPresent == 1 ? 'YES' : 'No',
        override_values: item1.override_values == 1 ? 'YES' : 'No',
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {statsSettings}},
    });
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<StatsProfile>(formConfig, form,{
      statsSettings: this.statSettingForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const statsSettings = item.statsSettings as StatSetting[];
    delete item.statsSettings;

    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<StatsProfile>(this.dbProfile, this.dbTable, 'id', item.id);
    let newId;
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      newId = await this.databaseService.insert<StatsProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, statsSettings, []);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<StatsProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbStatSettingsTable} WHERE profile_id = ?`,
      [record.id],
    );

    let {item, statsSettingsAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return null;
    }
    const statsSettings = item.statsSettings as StatSetting[];
    delete item.statsSettings;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<StatsProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, statsSettings.map((b) => ({...b, id: -1})), []);
    } else {
      await this.databaseService.update<StatsProfile>(this.dbProfile, this.dbTable, item, 'id', id);
      await this.saveSubs(record.id as number, statsSettings, statsSettingsAll);
    }
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }
  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<StatsProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: StatSetting[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbStatSettingsTable} WHERE profile_id = ?`,
      [id],
    );
    list = list.map((l) => ({...l, id: undefined}));
    let {item} = await this.prepareSubForm(record, list);
    if (!item) {
      return 0;
    }
    const statsSettings = item.statsSettings as StatSetting[];

    delete item.statsSettings;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    // item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<StatsProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, statsSettings, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }
  private async prepareSubForm(
    record: StatsProfile,
    list: StatSetting[],
    updateMode = false,
  ): Promise<{item: StatsProfile | undefined; statsSettingsAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const statsSettingsAll: number[] = [];
    for (const item2 of list) {

      if (item2.id) {
        statsSettingsAll.push(item2.id);
      }
      (form.get('statsSettings') as FormArray).push(
        this.subFormService.buildSubForm<StatSetting, any>(this.statSettingForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<StatsProfile>(formConfig, form, {statsSettings: this.statSettingForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, statsSettingsAll: [], action};
    }
    this.resetForm(form);
    return {item, statsSettingsAll, action};
  }


  private async saveSubs(id: number, items: StatSetting[], all: number[] = []): Promise<void> {
    for (const item of items) {
      console.log(item);
      item.profile_id = id;
      if(item.id == -1)
        delete item.id;

      const records = await this.databaseService.queryAll<StatSetting>(
        this.dbProfile,
        this.dbStatSettingsTable,
        this.tableConfig.fields,
        {
          where: {profile_id: id,
                  id: item.id,
                  },
        },
      );
      if (records.length > 0) {
        all.splice(all.indexOf(item.id), 1);
        await this.databaseService.update<StatSetting>(this.dbProfile, this.dbStatSettingsTable, item, 'profile_id = '+id+' and id', item.id);
      } else {
        await this.databaseService.insert<StatSetting>(this.dbProfile, this.dbStatSettingsTable, item, false);
      }
    }
    if (all.length > 0) {
      for (const id2 of all) {
        await this.databaseService.delete(this.dbProfile, this.dbStatSettingsTable, 'profile_id = '+id+' and id', id2);
      }
    }
  }


  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form =  this.fb.group({
      name: ['', Validators.required ],
      statsSettings: new FormArray([]),
    });

      return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'id', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.tableConfig.actions = [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ];
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
