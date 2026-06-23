import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap,
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {skillProfileTable} from '../tables.data';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {SkillsService} from '../skills/skills.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';

export interface SkillProfile {
  id: number;
  type: number;
  profile_name: string;
  level_diff: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  levels?: SkillProfileLevel[];
  level_diffs?: {level_diff: string}[];
  level_value?: string;
  base_value?: string;
  percentage_value?: string;
}

export interface SkillProfileLevel {
  id?: number;
  profile_id: number;
  level: number;
  required_xp: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkillProfilesService {
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  public tableKey = TabTypes.SKILL_PROFILES;
  private readonly listStream = new BehaviorSubject<SkillProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = skillProfileTable;
  public dbTableLevel = 'skill_profile_levels';
  private readonly levelDiffForm = {
    level_diff: {value: 100, required: true, min: 0},
  };
  private readonly levelsForm = {
    id: {value: '', required: false},
    required_xp: {value: 100, required: true, min: 1},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    showPreview: true,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      profile_name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: this.skillsService.typeOptions,
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
    queryParams: {search: '', where: {}, sort: {field: 'profile_name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.smallDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      type: {
        name: 'type',
        type: FormFieldType.dropdown,
        require: true,
        search: true,
        data: this.skillsService.typeOptions,
        width: 50,
      },
      profile_name: {name: 'profile_name', type: FormFieldType.input, require: true, length: 64, width: 50},
      level_value: {name: 'level_value', type: FormFieldType.integer, require: true, width: 33},
      base_value: {name: 'base_value', type: FormFieldType.integer, require: true, width: 33},
      percentage_value: {name: 'percentage_value', type: FormFieldType.integer, require: true, width: 33},
    },
    subForms: {
      levels: {
        title: this.translate.instant(this.tableKey + '.LEVELS'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVEL'),
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          required_xp: {
            name: 'required_xp',
            label: this.translate.instant(this.tableKey + '.LEVEL'),
            tooltip: this.translate.instant(this.tableKey + '.LEVEL_HELP'),
            type: FormFieldType.integer,
            require: true,
            width: 100,
          },
        },
      },
      level_diffs: {
        title: this.translate.instant(this.tableKey + '.LEVEL_DIFFS'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVEL_DIFF'),
        hiddenSubForm: true,
        fields: {
          level_diff: {
            name: 'level_diff',
            label: this.translate.instant(this.tableKey + '.LEVEL_DIFF'),
            tooltip: this.translate.instant(this.tableKey + '.LEVEL_DIFF_HELP'),
            type: FormFieldType.integer,
            require: true,
            width: 100,
          },
        },
      },
    },
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly skillsService: SkillsService,
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
      }
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getSkillProfile();
    }
    const response = await this.databaseService.queryList<SkillProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(type = -1): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    if (type !== -1) {
      (form.get('type') as AbstractControl).patchValue(type);
    }
    (form.get('level_value') as AbstractControl).patchValue(100);
    (form.get('base_value') as AbstractControl).patchValue(100);
    (form.get('percentage_value') as AbstractControl).patchValue(100);
    const {item} = await this.tablesService.openDialog<SkillProfile>(formConfig, form, {
      levels: this.levelsForm,
      level_diffs: this.levelDiffForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const levels = item.levels as SkillProfileLevel[];
    delete item.levels;
    const level_diffs = item.level_diffs as {level_diff: string}[];
    delete item.level_diffs;
    delete item.level_value;
    delete item.base_value;
    delete item.percentage_value;
    item.level_diff = level_diffs.length > 0 ? level_diffs.map((itm) => +itm.level_diff).join(';') : '';
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    const newId = await this.databaseService.insert<SkillProfile>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, levels, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.profile_name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<SkillProfile>(this.dbProfile, this.dbTable, 'id', id);
    const levelsList: SkillProfileLevel[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevel} WHERE isactive = 1 and profile_id = '${record.id}'`,
    );
    const levelsAll = levelsList.map((subItem) => subItem.id as number);
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const {item, action} = await this.prepareForm(record, levelsList, true);
    if (!item) {
      return null;
    }
    const levels = item.levels as SkillProfileLevel[];
    delete item.levels;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      item.isactive = true;
      delete item.id;
      newId = await this.databaseService.insert<SkillProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, levels.map((l) => ({...l, id: undefined})), []);
    } else {
      await this.databaseService.update<SkillProfile>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, levels, levelsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.profile_name};
  }

  private buildSubForm<T>(form: FormGroup, itemForm: any, item: T, field: string): void {
    const subForm = new FormGroup({});
    Object.keys(itemForm).forEach((key) => {
      const validators = [];
      if (itemForm[key].required) {
        validators.push(Validators.required);
      }
      if (itemForm[key].min !== undefined) {
        validators.push(Validators.min(itemForm[key].min));
      }
      if (itemForm[key].max !== undefined) {
        validators.push(Validators.min(itemForm[key].max));
      }
      // @ts-ignore
      subForm.addControl(key, new FormControl(item[key], validators));
    });
    (form.get(field) as FormArray).push(subForm);
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<SkillProfile>(this.dbProfile, this.dbTable, 'id', id);
    let levelsList: SkillProfileLevel[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevel} WHERE isactive = 1 and profile_id = '${baseRecord.id}'`,
    );
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.profile_name = record.profile_name + ' (1)';
    levelsList = levelsList.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, levelsList);
    if (!item) {
      return 0;
    }
    const levels = item.levels as SkillProfileLevel[];
    delete item.levels;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<SkillProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, levels, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: SkillProfile, levelsList: SkillProfileLevel[], updateMode = false): Promise<{item: SkillProfile | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const itm of levelsList) {
      this.buildSubForm(form, this.levelsForm, itm, 'levels');
    }
    const levelDiffs = record.level_diff.split(';');
    for (const itm of levelDiffs) {
      if (itm) {
        this.buildSubForm(form, this.levelDiffForm, {level_diff: itm}, 'level_diffs');
      }
    }
    form.patchValue(record);
    (form.get('level_value') as AbstractControl).patchValue(100);
    (form.get('base_value') as AbstractControl).patchValue(100);
    (form.get('percentage_value') as AbstractControl).patchValue(100);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<SkillProfile>(formConfig, form, {
      levels: this.levelsForm,
      level_diffs: this.levelDiffForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    const level_diffs = item.level_diffs as {level_diff: string}[];
    delete item.level_diffs;
    delete item.level_value;
    delete item.base_value;
    delete item.percentage_value;
    item.level_diff = level_diffs.length > 0 ? level_diffs.map((itm) => +itm.level_diff).join(';') : '';
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<SkillProfile>(this.dbProfile, this.dbTable, 'id', id);
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevel} WHERE isactive = 1 and profile_id = ${id}`,
    );
    const levels = [];
    for (const item of list) {
      levels.push({
        level_nr: item.level,
        level: item.required_xp,
      });
    }
    const level_diffs = [];
    let i = 1;
    for (const ld of record.level_diff.split(';')) {
      if (ld) {
        level_diffs.push({level_nr: i, level_diff: ld});
        ++i;
      }
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {levels, level_diffs}},
    });
  }

  private async saveSubs(recordId: number, items: SkillProfileLevel[], itemsAll: number[] = []): Promise<void> {
    let i = 1;
    for (const item of items) {
      item.isactive = true;
      item.level = i;
      item.profile_id = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<SkillProfileLevel>(this.dbProfile, this.dbTableLevel, item, 'id', item.id);
      } else {
        // @ts-ignore
        delete item.id;
        item.creationtimestamp = this.databaseService.getTimestampNow();
        await this.databaseService.insert<SkillProfileLevel>(this.dbProfile, this.dbTableLevel, item, false);
      }
      ++i;
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableLevel, 'id', itemId, false);
      }
    }
  }

  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      type: ['', Validators.required],
      profile_name: ['', Validators.required],
      level_value: [100, [Validators.required, Validators.min(1)]],
      base_value: [100, [Validators.required, Validators.min(1)]],
      percentage_value: [100, [Validators.required, Validators.min(1)]],
      levels: new FormArray([]),
      level_diffs: new FormArray([]),
    });
    (form.get('type') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value === 0 || value === 2) {
        (formConfig.subForms as TypeMap<string, SubFormType>).level_diffs.hiddenSubForm = false;
      } else {
        (form.get('level_diffs') as FormArray).clear();
        (formConfig.subForms as TypeMap<string, SubFormType>).level_diffs.hiddenSubForm = true;
      }
    });
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('levels') as FormArray).clear();
    (form.get('level_diffs') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'profile_name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }
}
