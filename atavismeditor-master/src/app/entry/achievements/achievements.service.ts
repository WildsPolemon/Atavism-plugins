import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {NotificationService} from '../../services/notification.service';
import {achivementBonusesTable, achivementSettingsTable, achivementStatsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  abilityFieldConfig,
  bonusSettingsIdFieldConfig,
  itemFieldConfig,
  mobsFieldConfig,
  skillFieldConfig,
  statFieldConfig,
} from '../dropdown.config';
import {
  AchievementBonus,
  AchievementSettings,
  AchievementStats,
  AchievementTypes,
  AchievementTypesEnum,
} from './achievements.data';

@Injectable({
  providedIn: 'root',
})
export class AchievementsService {
  public tableKey = TabTypes.ACHIEVEMENTS;
  private readonly listStream = new BehaviorSubject<AchievementSettings[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = achivementSettingsTable;
  public dbTableBonus = achivementBonusesTable;
  public dbTableStats = achivementStatsTable;
  private readonly bonusForm: SubFieldType = {
    achievement_id: {value: '', required: false},
    bonus_settings_id: {value: '', required: true},
    value: {value: '', required: true},
    valuep: {value: '', required: true},
  };
  private readonly statsForm: SubFieldType = {
    achievement_id: {value: '', required: false},
    stat: {value: '', required: true},
    value: {value: '', required: true},
    valuep: {value: '', required: true},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: AchievementTypes,
      },
      value: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      bonus_settings_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: bonusSettingsIdFieldConfig,
      },
      stat: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
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
    saveAsNew: false,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 50},
      type: {
        name: 'type',
        type: FormFieldType.dropdown,
        require: true,
        data: AchievementTypes,
        width: 50,
        search: true,
      },
      value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
      objects: {name: 'objects', label: '', type: FormFieldType.hidden, multiple: true, width: 50, allowNew: true},
      description: {name: 'description', type: FormFieldType.textarea, require: true, width: 100},
    },
    subForms: {
      bonus_settings: {
        title: this.translate.instant(this.tableKey + '.BONUS_SETTINGS_ID'),
        submit: this.translate.instant(this.tableKey + '.ADD_BONUS'),
        fields: {
          achievement_id: {name: 'achievement_id', label: '', type: FormFieldType.hidden},
          bonus_settings_id: {
            name: 'bonus_settings_id',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: bonusSettingsIdFieldConfig,
            require: true,
            allowNew: true,
          },
          value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
          valuep: {name: 'valuep', type: FormFieldType.decimal, require: true, width: 50},
        },
      },
      stats: {
        title: this.translate.instant(this.tableKey + '.BONUS_STAT'),
        submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
        fields: {
          achievement_id: {name: 'achievement_id', label: '', type: FormFieldType.hidden},
          stat: {
            name: 'stat',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: statFieldConfig,
            require: true,
            allowNew: true,
          },
          value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
          valuep: {name: 'valuep', type: FormFieldType.decimal, require: true, width: 50},
        },
      },
    },
  };
  private destroyer = new Subject<void>();
  private formDestroy = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
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
      await this.dropdownItemsService.getAchievements();
    }
    const subFields: Record<string, SubQueryField> = {
      bonus_settings_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'achievement_id',
        table: achivementBonusesTable,
      },
      stat: {type: SubTable.left_join, main: 'id', related: 'achievement_id', table: achivementStatsTable},
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<AchievementSettings>(
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
    const subForms = {bonus_settings: this.bonusForm, stats: this.statsForm};
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    const {item} = await this.tablesService.openDialog<AchievementSettings>(formConfig, form, subForms);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    const subBonuses = item.bonus_settings as AchievementBonus[];
    const subStats = item.stats as AchievementStats[];
    delete item.bonus_settings;
    delete item.stats;
    const newId = await this.databaseService.insert<AchievementSettings>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, subBonuses, subStats);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<AchievementSettings>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableBonus} WHERE achievement_id =  ?`,
      [id],
    );
    const list2 = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE achievement_id = ?`,
      [id],
    );
    const {item, action} = await this.prepareUpdateForm(record, list, list2, true);
    if (!item) {
      return null;
    }
    const subBonuses = item.bonus_settings as AchievementBonus[];
    const subStats = item.stats as AchievementStats[];
    delete item.bonus_settings;
    delete item.stats;

    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      newId = await this.databaseService.insert<AchievementSettings>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, subBonuses, subStats);
    } else {
      await this.databaseService.update<AchievementSettings>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableBonus} WHERE achievement_id = ?`,
        [record.id],
        true,
      );
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableStats} WHERE achievement_id = ?`,
        [record.id],
        true,
      );
      await this.saveSubs(record.id as number, subBonuses, subStats);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<AchievementSettings>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    let bonuses: AchievementBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableBonus} WHERE achievement_id = ?`,
      [id],
    );
    let stats: AchievementStats[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE achievement_id = ?`,
      [id],
    );
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    bonuses = bonuses.map((bonus) => ({...bonus, ...{id: null}}));
    stats = stats.map((stat) => ({...stat, ...{id: null}}));
    const {item} = await this.prepareUpdateForm(record, bonuses, stats);
    if (!item) {
      return 0;
    }
    const subBonuses = item.bonus_settings as AchievementBonus[];
    const subStats = item.stats as AchievementStats[];
    delete item.bonus_settings;
    delete item.stats;
    const newId = await this.databaseService.insert<AchievementSettings>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, subBonuses, subStats);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const bonuses = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableBonus} WHERE achievement_id = ?`,
      [id],
    );
    const stats = [];
    const bonus_settings = [];
    for (const bonus of bonuses) {
      const bon = await this.dropdownItemsService.getBonusSettingItem(bonus.bonus_settings_id);
      bonus_settings.push({
        bonus_settings_id: bon ? bon.name : bonus.bonus_settings_id,
        value: bonus.value,
        valuep: bonus.valuep,
      });
    }
    const statsResult = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE achievement_id = ?`,
      [id],
    );
    for (const stat of statsResult) {
      stats.push({stat: stat.stat, value: stat.value, valuep: stat.valuep});
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {bonus_settings, stats}},
    });
  }

  private async prepareUpdateForm(
    record: AchievementSettings,
    list: AchievementBonus[],
    list2: AchievementStats[],
    updateMode = false
  ): Promise<{item: AchievementSettings | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const item1 of list) {
      const bonus = await this.dropdownItemsService.getBonusSettingItem(item1.bonus_settings_id);
      (form.get('bonus_settings') as FormArray).push(this.subFormService.bonusSubForm(bonus, item1, this.bonusForm));
    }
    for (const item2 of list2) {
      (form.get('stats') as FormArray).push(
        this.subFormService.buildSubForm<AchievementStats, any>(this.statsForm, item2),
      );
    }
    form.patchValue(record);
    (form.get('objects') as AbstractControl).patchValue(record.objects);
    const subForms = {bonus_settings: this.bonusForm, stats: this.statsForm};
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<AchievementSettings>(formConfig, form, subForms);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  private async saveSubs(newId: number, subBonuses: AchievementBonus[], subStats: AchievementStats[]): Promise<void> {
    for (const bonus of subBonuses) {
      await this.databaseService.insert<AchievementBonus>(
        this.dbProfile,
        this.dbTableBonus,
        {achievement_id: newId, bonus_settings_id: bonus.bonus_settings_id, value: +bonus.value, valuep: +bonus.valuep},
        false,
      );
    }
    for (const stat of subStats) {
      await this.databaseService.insert<AchievementStats>(
        this.dbProfile,
        this.dbTableStats,
        {achievement_id: newId, stat: stat.stat, value: +stat.value, valuep: +stat.valuep},
        false,
      );
    }
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

  public createForm(formConfig: FormConfig): FormGroup {
    this.formDestroy = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      objects: [''],
      bonus_settings: new FormArray([]),
      stats: new FormArray([]),
    });
    (form.get('objects') as AbstractControl).disable();
    (form.get('type') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroy)).subscribe((value) => {
      (form.get('objects') as AbstractControl).patchValue('');
      this.objectUpdate(form, formConfig, value);
    });
    return form;
  }

  private resetForm(form: FormGroup) {
    form.reset();
    (form.get('bonus_settings') as FormArray).clear();
    (form.get('stats') as FormArray).clear();
    this.formDestroy.next(void 0);
    this.formDestroy.complete();
  }

  private objectUpdate(form: FormGroup, formConfig: FormConfig, value: AchievementTypesEnum) {
    (form.get('objects') as AbstractControl).enable();
    if (value === AchievementTypesEnum.Kill) {
      formConfig.fields.objects.type = FormFieldType.dynamicDropdown;
      formConfig.fields.objects.fieldConfig = mobsFieldConfig;
      formConfig.fields.objects.label = this.translate.instant(this.tableKey + '.OBJECTIVE_MOB');
    } else if (value === AchievementTypesEnum.Harvesting) {
      formConfig.fields.objects.type = FormFieldType.dynamicDropdown;
      formConfig.fields.objects.fieldConfig = skillFieldConfig;
      formConfig.fields.objects.label = this.translate.instant(this.tableKey + '.OBJECTIVE_SKILLS');
    } else if (value === AchievementTypesEnum.Crafting) {
      formConfig.fields.objects.type = FormFieldType.dynamicDropdown;
      formConfig.fields.objects.fieldConfig = itemFieldConfig;
      formConfig.fields.objects.label = this.translate.instant(this.tableKey + '.OBJECTIVE_ITEM');
    } else if (value === AchievementTypesEnum.UseAbility) {
      formConfig.fields.objects.type = FormFieldType.dynamicDropdown;
      formConfig.fields.objects.fieldConfig = abilityFieldConfig;
      formConfig.fields.objects.label = this.translate.instant(this.tableKey + '.OBJECTIVE_ABILITY');
    } else {
      formConfig.fields.objects.type = FormFieldType.hidden;
      formConfig.fields.objects.label = '';
      (form.get('objects') as AbstractControl).disable();
    }
  }
}
