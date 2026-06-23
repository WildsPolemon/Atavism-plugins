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
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {skillAbilityGainTable, skillsTable} from '../tables.data';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {
  abilityFieldConfig,
  classFieldConfig,
  skillFieldConfig,
  skillProfileFieldConfig,
  skillProfileFieldConfig_0,
  skillProfileFieldConfig_1,
  skillProfileFieldConfig_2,
  statFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

export interface Skill {
  id: number;
  name: string;
  icon: string;
  icon2: string;
  aspect: number;
  oppositeAspect: number;
  mainAspectOnly: boolean;
  primaryStat: string;
  secondaryStat: string;
  thirdStat: string;
  fourthStat: string;
  primaryStatInterval: number;
  secondaryStatInterval: number;
  thirdStatInterval: number;
  fourthStatInterval: number;
  primaryStatValue: number;
  secondaryStatValue: number;
  thirdStatValue: number;
  fourthStatValue: number;
  maxLevel: number;
  automaticallyLearn: boolean;
  skillPointCost: number;
  parentSkill: number;
  parentSkillLevelReq: number;
  prereqSkill1: number;
  prereqSkill1Level: number;
  prereqSkill2: number;
  prereqSkill2Level: number;
  prereqSkill3: number;
  prereqSkill3Level: number;
  playerLevelReq: number;
  skill_profile_id: number;
  type: number;
  talent: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  abilities?: SkillAbility[];
}

export interface SkillAbility {
  id?: number;
  skillID: number;
  skillLevelReq: number;
  abilityID: number;
  automaticallyLearn: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  public tableKey = TabTypes.SKILLS;
  private readonly listStream = new BehaviorSubject<Skill[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = skillsTable;
  public dbTableAbilities = skillAbilityGainTable;
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  private abilityForm: SubFieldType = {
    id: {value: '', required: false},
    skillLevelReq: {value: '', required: true, min: 1},
    automaticallyLearn: {value: false, required: false},
    abilityID: {value: '', required: true},
  };
  public readonly typeOptions = [
    {id: 0, value: this.translate.instant(this.tableKey + '.TYPE_OPTION.CRAFTING')},
    {id: 1, value: this.translate.instant(this.tableKey + '.TYPE_OPTION.COMBAT')},
    {id: 2, value: this.translate.instant(this.tableKey + '.TYPE_OPTION.GATHERING')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    showPreview: true,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, alwaysVisible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      maxLevel: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      skillPointCost: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      automaticallyLearn: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      talent: {type: ConfigTypes.booleanType, visible: true, filterType: FilterTypes.booleanType, filterVisible: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: this.typeOptions,
      },
      skill_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: false,
        fieldConfig: skillProfileFieldConfig,
        data: [],
      },
      aspect: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dropdown,
        filterVisible: false,
        data: [],
      },
      mainAspectOnly: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      oppositeAspect: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dropdown,
        filterVisible: false,
        data: [],
      },
      primaryStat: {type: ConfigTypes.dropdown, visible: true, data: []},
      primaryStatValue: {type: ConfigTypes.numberType, visible: true},
      primaryStatInterval: {type: ConfigTypes.numberType, visible: true},
      secondaryStat: {type: ConfigTypes.dropdown, visible: true, data: []},
      secondaryStatValue: {type: ConfigTypes.numberType, visible: true},
      secondaryStatInterval: {type: ConfigTypes.numberType, visible: true},
      thirdStat: {type: ConfigTypes.dropdown, visible: true, data: []},
      thirdStatValue: {type: ConfigTypes.numberType, visible: true},
      thirdStatInterval: {type: ConfigTypes.numberType, visible: true},
      fourthStat: {type: ConfigTypes.dropdown, visible: true, data: []},
      fourthStatValue: {type: ConfigTypes.numberType, visible: true},
      fourthStatInterval: {type: ConfigTypes.numberType, visible: true},
      parentSkill: {type: ConfigTypes.dropdown, visible: false, data: []},
      parentSkillLevelReq: {type: ConfigTypes.numberType, visible: false},
      prereqSkill1: {type: ConfigTypes.dropdown, visible: false, data: []},
      prereqSkill1Level: {type: ConfigTypes.numberType, visible: false},
      prereqSkill2: {type: ConfigTypes.dropdown, visible: false, data: []},
      prereqSkill2Level: {type: ConfigTypes.numberType, visible: false},
      prereqSkill3: {type: ConfigTypes.dropdown, visible: false, data: []},
      prereqSkill3Level: {type: ConfigTypes.numberType, visible: false},
      playerLevelReq: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      stat: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: false,
        fieldConfig: statFieldConfig,
      },
      prereqSkill: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: false,
        fieldConfig: skillFieldConfig,
      },
      prereqSkillLevel: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      skillLevelReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      abilityID: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: false,
        fieldConfig: abilityFieldConfig,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {type: ConfigTypes.date, visible: false, filterVisible: false, filterType: FilterTypes.date},
      updatetimestamp: {type: ConfigTypes.date, visible: false, filterVisible: false, filterType: FilterTypes.date},
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 45, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      maxLevel: {name: 'maxLevel', type: FormFieldType.integer, width: 33},
      skillPointCost: {name: 'skillPointCost', type: FormFieldType.integer, width: 33},
      automaticallyLearn: {name: 'automaticallyLearn', type: FormFieldType.boolean, width: 33},
      talent: {name: 'talent', type: FormFieldType.boolean, width: 33},
      type: {
        name: 'type',
        type: FormFieldType.dropdown,
        search: true,
        data: this.typeOptions,
        require: true,
        hideNone: true,
        width: 33,
      },
      skill_profile_id: {
        name: 'skill_profile_id',
        type: FormFieldType.dynamicDropdown,
        search: true,
        disabled: true,
        allowNew: false,
        width: 33,
        conditionName: 'type',
        condition: {
          type: {
            0: {disabled: false, allowNew: true, fieldConfig: skillProfileFieldConfig_0},
            1: {disabled: false, allowNew: true, fieldConfig: skillProfileFieldConfig_1},
            2: {disabled: false, allowNew: true, fieldConfig: skillProfileFieldConfig_2},
          },
        },
      },
      aspect: {
        name: 'aspect',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: classFieldConfig,
        width: 33,
      },
      mainAspectOnly: {name: 'mainAspectOnly', type: FormFieldType.boolean, width: 33},
      oppositeAspect: {
        name: 'oppositeAspect',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: classFieldConfig,
        width: 33,
      },
      primaryStat: {
        name: 'primaryStat',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statFieldConfig,
        width: 33,
      },
      primaryStatValue: {name: 'primaryStatValue', type: FormFieldType.integer, width: 33},
      primaryStatInterval: {name: 'primaryStatInterval', type: FormFieldType.integer, width: 33},
      secondaryStat: {
        name: 'secondaryStat',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statFieldConfig,
        width: 33,
      },
      secondaryStatValue: {name: 'secondaryStatValue', type: FormFieldType.integer, width: 33},
      secondaryStatInterval: {name: 'secondaryStatInterval', type: FormFieldType.integer, width: 33},
      thirdStat: {
        name: 'thirdStat',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statFieldConfig,
        width: 33,
      },
      thirdStatValue: {name: 'thirdStatValue', type: FormFieldType.integer, width: 33},
      thirdStatInterval: {name: 'thirdStatInterval', type: FormFieldType.integer, width: 33},
      fourthStat: {
        name: 'fourthStat',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statFieldConfig,
        width: 33,
      },
      fourthStatValue: {name: 'fourthStatValue', type: FormFieldType.integer, width: 33},
      fourthStatInterval: {name: 'fourthStatInterval', type: FormFieldType.integer, width: 33},
      title1: {name: '', label: this.translate.instant(this.tableKey + '.REQUIREMENTS'), type: FormFieldType.title},
      parentSkill: {
        name: 'parentSkill',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: skillFieldConfig,
        width: 25,
      },
      parentSkillLevelReq: {name: 'parentSkillLevelReq', type: FormFieldType.integer, width: 25},
      prereqSkill1: {
        name: 'prereqSkill1',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: skillFieldConfig,
        width: 25,
      },
      prereqSkill1Level: {name: 'prereqSkill1Level', type: FormFieldType.integer, width: 25},
      prereqSkill2: {
        name: 'prereqSkill2',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: skillFieldConfig,
        width: 25,
      },
      prereqSkill2Level: {name: 'prereqSkill2Level', type: FormFieldType.integer, width: 25},
      prereqSkill3: {
        name: 'prereqSkill3',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: skillFieldConfig,
        width: 25,
      },
      prereqSkill3Level: {name: 'prereqSkill3Level', type: FormFieldType.integer, width: 25},
      playerLevelReq: {name: 'playerLevelReq', type: FormFieldType.integer, width: 50},
    },
    subForms: {
      abilities: {
        title: this.translate.instant(this.tableKey + '.SKILL_ABILITIES'),
        submit: this.translate.instant(this.tableKey + '.ADD_SKILL_ABILITIES'),
        draggable: true,
        columnWidth: 100,
        fields: {
          skillLevelReq: {name: 'skillLevelReq', type: FormFieldType.integer, require: true, width: 25},
          automaticallyLearn: {name: 'automaticallyLearn', type: FormFieldType.boolean, width: 25},
          abilityID: {
            name: 'abilityID',
            type: FormFieldType.dynamicDropdown,
            require: true,
            fieldConfig: abilityFieldConfig,
            allowNew: true,
            width: 50,
          },
        },
      },
    },
  };
  private profile!: Profile;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly imageService: ImageService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
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
    this.dropdownItemsService.stats.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.primaryStat.data = listing;
      this.tableConfig.fields.secondaryStat.data = listing;
      this.tableConfig.fields.thirdStat.data = listing;
      this.tableConfig.fields.fourthStat.data = listing;
    });
    this.dropdownItemsService.skillProfile.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.skill_profile_id.data = listing;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.parentSkill.data = listing;
      this.tableConfig.fields.prereqSkill1.data = listing;
      this.tableConfig.fields.prereqSkill2.data = listing;
      this.tableConfig.fields.prereqSkill3.data = listing;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    const listing = await this.optionChoicesService.getOptionsByType('Class');
    this.tableConfig.fields.aspect.data = listing;
    this.tableConfig.fields.oppositeAspect.data = listing;
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getSkillProfile();
    await this.dropdownItemsService.getSkills();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getSkills();
    }
    const subFields: Record<string, SubQueryField> = {
      abilityID: {
        type: SubTable.left_join,
        main: 'id',
        related: 'skillID',
        table: this.dbTableAbilities,
        where: {},
      },
      skillLevelReq: {
        type: SubTable.left_join,
        main: 'id',
        related: 'skillID',
        table: this.dbTableAbilities,
        where: {},
      },
      stat: {type: SubTable.multiple, columns: ['primaryStat', 'secondaryStat', 'thirdStat', 'fourthStat']},
      prereqSkill: {type: SubTable.multiple, columns: ['parentSkill', 'prereqSkill1', 'prereqSkill2', 'prereqSkill3']},
      prereqSkillLevel: {
        type: SubTable.multiple,
        columns: ['parentSkillLevelReq', 'prereqSkill1Level', 'prereqSkill2Level', 'prereqSkill3Level'],
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.abilityID.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.skillLevelReq.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Skill>(
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
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<Skill>(JSON.parse(JSON.stringify(this.formConfig)), form, {
      abilities: this.abilityForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const abilities = item.abilities as SkillAbility[];
    delete item.abilities;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<Skill>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, abilities, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Skill>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const savedAbilities: SkillAbility[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilities} WHERE isactive = 1 and skillID = '${record.id}'`,
    );
    const abilitiesAll: number[] = savedAbilities.map((ability) => ability.id as number);
    const {item, action} = await this.prepareForm(record, savedAbilities, true);
    if (!item) {
      return null;
    }
    const abilities = item.abilities as SkillAbility[];
    delete item.abilities;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Skill>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, abilities.map((sa) => ({...sa, id: undefined})), []);
    } else {
      await this.databaseService.update<Skill>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, abilities, abilitiesAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Skill>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    let list: SkillAbility[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilities} WHERE isactive = 1 and skillID = ${id}`,
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const abilities = item.abilities as SkillAbility[];
    delete item.abilities;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Skill>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, abilities, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: Skill, allAbilities: SkillAbility[], updateMode = false): Promise<{item: Skill | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
   const record2 = await this.setDefaults(record);
    const form = this.createForm();
    for (const ability of allAbilities) {
      (form.get('abilities') as FormArray).push(this.subFormService.buildSubForm(this.abilityForm, ability));
    }
    form.patchValue(record2);
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Skill>(formConfig, form, {
      abilities: this.abilityForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item: await this.setDefaults(item), action};
  }

  public async previewItems(id: number): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilities} WHERE isactive = 1 and skillID = ${id}`,
    );
    const skill_abilities = [];
    for (const item of list) {
      const ability = await this.dropdownItemsService.getAbility(item.abilityID);
      skill_abilities.push({
        skillLevelReq: item.skillLevelReq,
        automaticallyLearn: this.translate.instant(item.automaticallyLearn ? 'SETTINGS.YES' : 'SETTINGS.NO'),
        abilityID: ability ? ability.value : item.abilityID,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {skill_abilities}},
    });
  }

  private async setDefaults(item: Skill): Promise<Skill> {
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.maxLevel = item.maxLevel ? item.maxLevel : 1;
    item.skillPointCost = item.skillPointCost ? item.skillPointCost : 0;
    item.primaryStat = item.primaryStat ? item.primaryStat : '';
    item.primaryStatValue = item.primaryStatValue ? (item.primaryStatValue > 0 ? item.primaryStatValue : 1) : 1;
    item.primaryStatInterval = item.primaryStatInterval ? item.primaryStatInterval : 1;
    item.secondaryStat = item.secondaryStat ? item.secondaryStat : '';
    item.secondaryStatValue = item.secondaryStatValue ? (item.secondaryStatValue > 0 ? item.secondaryStatValue : 1) : 1;
    item.secondaryStatInterval = item.secondaryStatInterval ? item.secondaryStatInterval : 1;
    item.thirdStat = item.thirdStat ? item.thirdStat : '';
    item.thirdStatValue = item.thirdStatValue ? (item.thirdStatValue > 0 ? item.thirdStatValue : 1) : 1;
    item.thirdStatInterval = item.thirdStatInterval ? item.thirdStatInterval : 1;
    item.fourthStat = item.fourthStat ? item.fourthStat : '';
    item.fourthStatValue = item.fourthStatValue ? (item.fourthStatValue > 0 ? item.fourthStatValue : 1) : 1;
    item.fourthStatInterval = item.fourthStatInterval ? item.fourthStatInterval : 1;
    item.skill_profile_id = item.skill_profile_id ? item.skill_profile_id : -1;
    item.aspect = item.aspect ? item.aspect : -1;
    item.oppositeAspect = item.oppositeAspect ? item.oppositeAspect : -1;
    item.parentSkill = item.parentSkill ? item.parentSkill : -1;
    item.prereqSkill1 = item.prereqSkill1 ? item.prereqSkill1 : -1;
    item.prereqSkill2 = item.prereqSkill2 ? item.prereqSkill2 : -1;
    item.prereqSkill3 = item.prereqSkill3 ? item.prereqSkill3 : -1;
    item.talent = item.talent ? item.talent : false;
    item.mainAspectOnly = item.mainAspectOnly ? item.mainAspectOnly : false;
    item.automaticallyLearn = item.automaticallyLearn ? item.automaticallyLearn : false;
    item.parentSkillLevelReq = item.parentSkillLevelReq ? item.parentSkillLevelReq : 0;
    item.prereqSkill1Level = item.prereqSkill1Level ? item.prereqSkill1Level : 0;
    item.prereqSkill2Level = item.prereqSkill2Level ? item.prereqSkill2Level : 0;
    item.prereqSkill3Level = item.prereqSkill3Level ? item.prereqSkill3Level : 0;
    item.playerLevelReq = item.playerLevelReq ? item.playerLevelReq : 0;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    return item;
  }

  private async saveSubs(recordId: number, abilities: SkillAbility[], abilitiesAll: number[] = []): Promise<void> {
    if (abilitiesAll.length > 0) {
      for (const itemId of abilitiesAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableAbilities, 'id', itemId, false);
      }
    }
    for (const item of abilities) {
      item.isactive = true;
      item.skillID = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      await this.databaseService.insert<SkillAbility>(this.dbProfile, this.dbTableAbilities, item, false);
    }
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      icon: '',
      maxLevel: 0,
      skillPointCost: [0, Validators.min(0)],
      automaticallyLearn: false,
      talent: false,
      type: [null, Validators.required],
      skill_profile_id: -1,
      aspect: -1,
      mainAspectOnly: false,
      oppositeAspect: -1,
      primaryStat: '',
      primaryStatValue: [1, Validators.min(1)],
      primaryStatInterval: [1, Validators.min(1)],
      secondaryStat: '',
      secondaryStatValue: [1, Validators.min(1)],
      secondaryStatInterval: [1, Validators.min(1)],
      thirdStat: '',
      thirdStatValue: [1, Validators.min(1)],
      thirdStatInterval: [1, Validators.min(1)],
      fourthStat: '',
      fourthStatValue: [1, Validators.min(1)],
      fourthStatInterval: [1, Validators.min(1)],
      parentSkill: -1,
      parentSkillLevelReq: [1, Validators.min(1)],
      prereqSkill1: -1,
      prereqSkill1Level: [1, Validators.min(1)],
      prereqSkill2: -1,
      prereqSkill2Level: [1, Validators.min(1)],
      prereqSkill3: -1,
      prereqSkill3Level: [1, Validators.min(1)],
      playerLevelReq: 0,
      abilities: new FormArray([]),
    });
    (form.get('skill_profile_id') as AbstractControl).disable();
    (form.get('type') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe(() => {
      (form.get('skill_profile_id') as AbstractControl).enable();
    });
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('abilities') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
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
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }
}
