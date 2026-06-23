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
  FormFieldType,
  QueryParams, SubFormType,
  TableConfig,
  TypeMap
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {levelXpRequirementsTemplatesTable, levelXpTable} from '../tables.data';
import {vipLevelValidator} from '../../validators/vip-level.validator';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {levelXpRewardsProfileFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';

export interface LevelXp {
  xpProfile: number;
  level: number;
  xpRequired: number;
  reward_template_id: number;
  isactive: boolean;
}

export interface LevelXpProfile {
  xpProfile?: number;
  xpProfile_name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  levelXp?: LevelXp[];
}

@Injectable({
  providedIn: 'root',
})
export class LevelXpProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.LEVELXP_PROFILE;
  private readonly listStream = new BehaviorSubject<LevelXpProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = levelXpRequirementsTemplatesTable;
  public dbLevelTable = levelXpTable;
  private readonly levelForm: SubFieldType = {
    xpProfile: {value: '', required: false},
    level: {value: 1, required: true, min: 1},
    xpRequired: {value: 1, required: true, min: 1},
    reward_template_id: {value: -1},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      xpProfile: {
        type: ConfigTypes.numberType,
        visible: true,
        alwaysVisible: true,
      },
      xpProfile_name: {
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
      reward_template_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: levelXpRewardsProfileFieldConfig,
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'xpProfile_name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      xpProfile_name: {name: 'xpProfile_name', type: FormFieldType.input, require: true, length: 45},
    },
    subForms: {
      levelXp: {
        title: this.translate.instant(this.tableKey + '.LEVEL'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVEL'),
        minCount: 1,
        columnWidth: 100,
        draggable: true,
        fields: {
          xpProfile: {name: 'xpProfile', label: '', type: FormFieldType.hidden},
          level: {name: 'level', type: FormFieldType.integer,  width: 25, require: true},
          xpRequired: {name: 'xpRequired', type: FormFieldType.integer, width: 25, require: true},
          reward_template_id: {
            name: 'reward_template_id',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            width: 50,
            search: true,
            fieldConfig: levelXpRewardsProfileFieldConfig,
          },
        },
      },
    },
  };
  private rewardsProfiles: DropdownValue[] = [];

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
      const defaultIsActiveFilter = typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        this.loadOptions();
      }
    });
    this.dropdownItemsService.levelXpRewardProfile.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.rewardsProfiles = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }
  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getLevelXpRewardProfile();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      reward_template_id: {
        type: SubTable.left_join,
        main: 'xpProfile',
        related: 'xpProfile',
        table: this.dbLevelTable,
      },
    };
    //if (queryParams.where.hasOwnProperty('isactive')) {
    //   subFields.reward_type.where.isactive = (queryParams.where as WhereQuery).isactive;
    // }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<LevelXpProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    this.listStream.next(response.list.map((item) => ({id: item.xpProfile, ...item})));
  }

  public async previewItems(id: number): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbLevelTable} WHERE isactive = 1 and xpProfile = ?`,
      [id],
    );
    const levels = [];
    for (const item1 of list) {
      let tmpl = this.rewardsProfiles.find((it) => it.id === item1.reward_template_id);
      levels.push({
        level: item1.level,
        xpRequired: item1.xpRequired,
        rewardTemplate: tmpl?.value ?? '',
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {levels}},
    });
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<LevelXpProfile>(formConfig, form,{
      levelXp: this.levelForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const levelXp = item.levelXp as LevelXp[];
    delete item.levelXp;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<LevelXpProfile>(this.dbProfile, this.dbTable, 'xpProfile', item.xpProfile);
    let newId;
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      newId = await this.databaseService.insert<LevelXpProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, levelXp, []);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.xpProfile_name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<LevelXpProfile>(this.dbProfile, this.dbTable, 'xpProfile', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbLevelTable} WHERE isactive = 1 and xpProfile = ?`,
      [record.xpProfile],
    );
    let {item, levelsAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return null;
    }
    const levels = item.levelXp as LevelXp[];
    delete item.levelXp;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = id;
    if (action === DialogCloseType.save_as_new) {
      delete item.xpProfile;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<LevelXpProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, levels.map((b) => ({...b, })), []);
    } else {
      await this.databaseService.update<LevelXpProfile>(this.dbProfile, this.dbTable, item, 'xpProfile', id);
      await this.saveSubs(record.xpProfile as number, levels, levelsAll);
    }
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.xpProfile_name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<LevelXpProfile>(this.dbProfile, this.dbTable, 'xpProfile', id);
    const record = {...duplicatedRecord};
    delete record.xpProfile;
    record.xpProfile_name = record.xpProfile_name + ' (1)';
    let list: LevelXp[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbLevelTable} WHERE xpProfile = ?`,
      [id],
    );
    list = list.map((l) => ({...l, reward_id: undefined}));
    let {item} = await this.prepareSubForm(record, list);
    if (!item) {
      return 0;
    }
    const levels = item.levelXp as LevelXp[];

    delete item.levelXp;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    // item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<LevelXpProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, levels, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }


  private async prepareSubForm(
    record: LevelXpProfile,
    list: LevelXp[],
    updateMode = false,
  ): Promise<{item: LevelXpProfile | undefined; levelsAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const levelsAll: number[] = [];
    for (const item2 of list) {
      if (item2.level) {
        levelsAll.push(item2.level);
      }
      (form.get('levelXp') as FormArray).push(
        this.subFormService.buildSubForm<LevelXp, any>(this.levelForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<LevelXpProfile>(formConfig, form, {levelXp: this.levelForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, levelsAll: [], action};
    }
    this.resetForm(form);
    return {item, levelsAll, action};
  }


  private async saveSubs(id: number, items: LevelXp[], all: number[] = []): Promise<void> {
    for (const item of items) {
      item.xpProfile = id;
      const records = await this.databaseService.queryAll<LevelXp>(
        this.dbProfile,
        this.dbLevelTable,
        this.tableConfig.fields,
        {
          where: {xpProfile: id,
                  level: item.level,
                  },
        },
      );
      if (records.length > 0) {
        all.splice(all.indexOf(item.level), 1);
        await this.databaseService.update<LevelXp>(this.dbProfile, this.dbLevelTable, item, 'xpProfile = '+item.xpProfile+' and level', item.level);
      } else {
        await this.databaseService.insert<LevelXp>(this.dbProfile, this.dbLevelTable, item, false);
      }
    }
    if (all.length > 0) {
      for (const id2 of all) {
        await this.databaseService.delete(this.dbProfile, this.dbLevelTable, 'xpProfile = '+id+' and level', id2);
      }
    }
  }


  private createForm(): FormGroup {
    return this.fb.group({
      xpProfile_name: ['', Validators.required ],
      levelXp: new FormArray([]),
      //level: [0, [Validators.required, Validators.min(1), vipLevelValidator([...this.usedList])]],
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
//    (form.get('level') as AbstractControl).enable();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'xpProfile', order: 'asc'},
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
