import {Injectable} from '@angular/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap,
  WhereQuery,
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  characterGenderTable,
  characterItemTable,
  characterSkillsTable,
  characterStatTable,
  characterTemplateTable,
  statsTable,
} from '../tables.data';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {Stat, statType} from '../stat/stat.service';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {
  abilityFieldConfig,
  classFieldConfig,
  factionFieldConfig,
  genderFieldConfig,
  instanceAllFieldConfig,
  itemFieldConfig, levelXpProfileFieldConfig,
  raceFieldConfig,
  skillFieldConfig,
  statFieldConfig, statProfileFieldConfig,
  toggleAbilityFieldConfig
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {ImageService} from '../../components/image/image.service';

export interface PlayerCharacter {
  id: number;
  race: number;
  aspect: number;
  instance: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  orientation: number;
  faction: number;
  autoAttack: number;
  race_icon: string;
  race_icon2: string;
  class_icon: string;
  class_icon2: string;
  race_description: string;
  class_description: string;
  respawnInstance: number;
  respawnPosX: number;
  respawnPosY: number;
  respawnPosZ: number;
  startingLevel: number;
  sprint: number;
  dodge: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  stats?: string[] | string;
  skills?: string[] | string;
  items?: string[] | string;
  stat?: PlayerCharacterStat[];
  skill?: PlayerCharacterSkill[];
  item?: PlayerCharacterItem[];
  genders?: PlayerCharacterGender[];
  xpProfile: number;
  stat_profile_id: number;
}

export interface PlayerCharacterStat {
  id: number;
  character_create_id: number;
  stat: string;
  value: number;
  levelIncrease: number;
  levelPercentIncrease: number;
  sendToClient: boolean;
  serverPresent: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface PlayerCharacterSkill {
  id: number;
  character_create_id: number;
  skill: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface PlayerCharacterItem {
  id: number;
  character_create_id: number;
  item_id: number;
  count: number;
  equipped: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface PlayerCharacterGender {
  id?: number;
  character_create_id: number;
  gender: number;
  model: string;
  icon: string;
  icon2: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlayerCharacterService {
  public tableKey = TabTypes.PLAYER_CHARACTER;
  private readonly listStream = new BehaviorSubject<PlayerCharacter[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = characterTemplateTable;
  public dbTableSkill = characterSkillsTable;
  public dbTableItem = characterItemTable;
  public dbTableStat = characterStatTable;
  public dbTableGender = characterGenderTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    hideSearch: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      race: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      aspect: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      faction: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
        data: [],
      },
      instance: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: instanceAllFieldConfig,
        data: [],
      },
      pos_x: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      pos_y: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      pos_z: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      orientation: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      sprint: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: toggleAbilityFieldConfig,
        data: [],
      },
      dodge: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: toggleAbilityFieldConfig,
        data: [],
      }, respawnInstance: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: instanceAllFieldConfig,
        data: [],
      },
      respawnPosX: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      respawnPosY: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      respawnPosZ: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      startingLevel: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      autoAttack: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: abilityFieldConfig,
        data: [],
      },
      race_icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      class_icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      stat: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
      },
      race_description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      class_description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      skill: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: skillFieldConfig,
      },
      item_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      xpProfile: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: levelXpProfileFieldConfig,
        data: [],
      },
      // stat_profile_id: {
      //   type: ConfigTypes.dropdown,
      //   visible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.dynamicDropdown,
      //   fieldConfig: statProfileFieldConfig,
      //   data: [],
      // },
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
      {type: ActionsTypes.COPY_TO, name: ActionsNames.COPY_TO, icon: ActionsIcons.COPY_TO},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'id', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public copyToFormConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.smallDialogOverlay,
    title: this.translate.instant(this.tableKey + '.COPY_TO_TITLE'),
    fields: {
      race: {
        name: 'race',
        type: FormFieldType.dynamicDropdown,
        width: 100,
        require: true,
        fieldConfig: raceFieldConfig,
        allowNew: true,
      },
      aspect: {
        name: 'aspect',
        type: FormFieldType.dynamicDropdown,
        width: 100,
        require: true,
        fieldConfig: classFieldConfig,
        allowNew: true,
      },
    },
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      race: {
        name: 'race',
        type: FormFieldType.dynamicDropdown,
        width: 100,
        require: true,
        fieldConfig: raceFieldConfig,
        allowNew: true,
      },
      aspect: {
        name: 'aspect',
        type: FormFieldType.dynamicDropdown,
        width: 100,
        require: true,
        fieldConfig: classFieldConfig,
        allowNew: true,
      },
      race_icon: {name: 'race_icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      class_icon: {name: 'class_icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      race_description: {name: 'race_description', type: FormFieldType.textarea, width: 50},
      class_description: {name: 'class_description', type: FormFieldType.textarea, width: 50},
      faction: {
        name: 'faction',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        require: true,
        allowNew: true,
        fieldConfig: factionFieldConfig,
      },
      instance: {
        name: 'instance',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        require: true,
        allowNew: true,
        fieldConfig: instanceAllFieldConfig,
      },
      pos_x: {name: 'pos_x', type: FormFieldType.decimal, require: true, width: 33},
      pos_y: {name: 'pos_y', type: FormFieldType.decimal, require: true, width: 33},
      pos_z: {name: 'pos_z', type: FormFieldType.decimal, require: true, width: 33},
      orientation: {name: 'orientation', type: FormFieldType.decimal, width: 50},
      xpProfile: {
        name: 'xpProfile',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 50,
        fieldConfig: levelXpProfileFieldConfig,
      },
      sprint: {
        name: 'sprint',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 50,
        fieldConfig: toggleAbilityFieldConfig,
      },
      dodge: {
        name: 'dodge',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 50,
        fieldConfig: abilityFieldConfig,
      },
      title1: {
        name: '',
        label: this.translate.instant(this.tableKey + '.TITLE1'),
        type: FormFieldType.title,
        width: 100,
      },
      title2: {
        name: '',
        label: this.translate.instant(this.tableKey + '.TITLE2'),
        type: FormFieldType.title,
        width: 100,
      },
      respawnInstance: {
        name: 'respawnInstance',
        type: FormFieldType.dynamicDropdown,
        require: true,
        allowNew: true,
        width: 50,
        fieldConfig: instanceAllFieldConfig,
      },
      title3: {name: '', label: '', type: FormFieldType.title, width: 100},
      respawnPosX: {name: 'respawnPosX', type: FormFieldType.decimal, require: true, width: 33},
      respawnPosY: {name: 'respawnPosY', type: FormFieldType.decimal, require: true, width: 33},
      respawnPosZ: {name: 'respawnPosZ', type: FormFieldType.decimal, require: true, width: 33},
      title4: {
        name: '',
        label: this.translate.instant(this.tableKey + '.TITLE4'),
        type: FormFieldType.title,
        width: 100,
      },
      startingLevel: {name: 'startingLevel', type: FormFieldType.integer, require: true, width: 50},
      autoAttack: {
        name: 'autoAttack',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        fieldConfig: abilityFieldConfig,
      },
      // stat_profile_id: {
      //   name: 'stat_profile_id',
      //   type: FormFieldType.dynamicDropdown,
      //   width: 50,
      //   allowNew: true,
      //   // fieldConfig: statProfileFieldConfig,
      // },
    },
    subForms: {
      genders: {
        title: this.translate.instant(this.tableKey + '.GENDERS'),
        submit: this.translate.instant(this.tableKey + '.ADD_GENDER'),
        minCount: 1,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          gender: {
            name: 'gender',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            fieldConfig: genderFieldConfig,
          },
          model: {
            name: 'model',
            type: FormFieldType.file,
            acceptFolder: '',
            acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
            accept: 'prefab',
            require: true,
            length: 256,
          },
          icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255},
        },
      },
      stat: {
        title: this.translate.instant(this.tableKey + '.STAT'),
        submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
        columnWidth: 100,
        maxCount: -1,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          stat: {name: 'stat', type: FormFieldType.hidden},
          value: {name: 'value', type: FormFieldType.integer, require: true, width: 20},
          levelIncrease: {name: 'levelIncrease', type: FormFieldType.integer, require: true, width: 20},
          levelPercentIncrease: {name: 'levelPercentIncrease', type: FormFieldType.integer, require: true, width: 20},
          serverPresent: {name: 'serverPresent', type: FormFieldType.boolean, width: 20},
          sendToClient: {name: 'sendToClient', type: FormFieldType.boolean, width: 20},
        },
      },
      skill: {
        title: this.translate.instant(this.tableKey + '.STARTING_SKILLS'),
        submit: this.translate.instant(this.tableKey + '.ADD_SKILL'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          skill: {
            name: 'skill',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            width: 100,
            fieldConfig: skillFieldConfig,
          },
        },
      },
      item: {
        title: this.translate.instant(this.tableKey + '.STARTING_ITEMS'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          item_id: {
            name: 'item_id',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            width: 33,
            fieldConfig: itemFieldConfig,
          },
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 33},
          equipped: {name: 'equipped', type: FormFieldType.boolean, width: 33},
        },
      },
    },
  };
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  private statsForm = {
    id: {value: '', required: false},
    stat: {value: '', required: true},
    value: {value: 0, required: true},
    levelIncrease: {value: 0, required: false, min: 0},
    levelPercentIncrease: {value: 0, required: false, min: 0},
    serverPresent: {value: 1, required: false},
    sendToClient: {value: 0, required: false},
  };
  private skillsForm = {
    id: {value: '', required: false},
    skill: {value: '', required: true},
  };
  private itemsForm = {
    id: {value: '', required: false},
    item_id: {value: '', required: true},
    count: {value: 1, required: true, min: 1},
    equipped: {value: false, required: true},
  };
  private genderForm = {
    id: {value: '', required: false},
    gender: {value: '', required: true},
    model: {value: '', required: true},
    icon: {value: '', required: false},
  };
  private profile!: Profile;
  public relatedMaxStats: Record<string, any> = {};
  private gendersList: DropdownValue[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.race_icon.iconFolder = profile.folder;
      this.tableConfig.fields.class_icon.iconFolder = profile.folder;
      this.formConfig.fields.race_icon.acceptFolder = profile.folder;
      this.formConfig.fields.class_icon.acceptFolder = profile.folder;
      (this.formConfig.subForms as TypeMap<string, SubFormType>).genders.fields.icon.acceptFolder = profile.folder;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      (this.formConfig.subForms as TypeMap<string, SubFormType>).genders.fields.model.acceptFolder =
        profile.folder + profile.mobFolder;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
      }
    });
    // this.dropdownItemsService.skillProfile.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
    //   this.tableConfig.fields.stat_profile_id.data = list;
    // });
    this.dropdownItemsService.factions.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.faction.data = list;
    });
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.autoAttack.data = list;
      this.tableConfig.fields.dodge.data = list;
    });
    this.dropdownItemsService.toggleAbilities.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.sprint.data = list;

    });
    this.dropdownItemsService.levelXpProfile.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.xpProfile.data = list;
    });
    this.dropdownItemsService.instances.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.instance.data = list;
      this.tableConfig.fields.respawnInstance.data = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.race.data = await this.optionChoicesService.getOptionsByType('Race');
    this.tableConfig.fields.aspect.data = await this.optionChoicesService.getOptionsByType('Class');
    this.gendersList = await this.optionChoicesService.getOptionsByType('gender');
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getFactions();
    await this.dropdownItemsService.getInstances();
    await this.dropdownItemsService.getLevelXpProfile();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      stat: {
        type: SubTable.left_join,
        main: 'id',
        related: 'character_create_id',
        table: this.dbTableStat,
        where: {},
      },
      skill: {
        type: SubTable.left_join,
        main: 'id',
        related: 'character_create_id',
        table: this.dbTableSkill,
        where: {},
      },
      item_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'character_create_id',
        table: this.dbTableItem,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.stat.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.skill.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.item_id.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<PlayerCharacter>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async copyToItem(id: number): Promise<number> {
    const record = await this.databaseService.queryItem<PlayerCharacter>(this.dbProfile, this.dbTable, 'id', id);
    const form = this.createCopyForm();
    const {item} = await this.tablesService.openDialog<{race: number; aspect: number}>({...this.copyToFormConfig}, form);
    if (!item) {
      this.formCopyReset(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const isUsed = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`,
      [item.race, item.aspect],
    );
    if (isUsed.length > 0) {
      this.formCopyReset(form);
      this.tablesService.dialogRef = null;
      this.notification.error(this.translate.instant(this.tableKey + '.ALREADY_USED'));
      return 0;
    }
    const statsTmp = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const skillsTmp = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSkill} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const itemsTmp = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItem} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const gendersTmp = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableGender} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const newItem = {...record};
    // @ts-ignore
    delete newItem.id;
    newItem.race = item.race;
    newItem.aspect = item.aspect;
    newItem.creationtimestamp = this.databaseService.getTimestampNow();
    newItem.updatetimestamp = this.databaseService.getTimestampNow();
    const stats = [];
    const skills = [];
    const items = [];
    const genders = [];
    for (const stat of statsTmp) {
      const newStat = {...stat};
      delete newStat.id;
      stats.push(newStat);
    }
    for (const skill of skillsTmp) {
      const newStat = {...skill};
      delete newStat.id;
      skills.push(newStat);
    }
    for (const itm of itemsTmp) {
      const newStat = {...itm};
      delete newStat.id;
      items.push(newStat);
    }
    for (const gender of gendersTmp) {
      const newGen = {...gender};
      delete newGen.id;
      genders.push(newGen);
    }
    const newId = await this.databaseService.insert<PlayerCharacter>(this.dbProfile, this.dbTable, newItem);
    await this.saveSubs(newId, stats, skills, items, genders);
    this.formCopyReset(form);
    this.tablesService.dialogRef = null;
    return newId;
  }

  private buildRelatedStats(allStats: Stat[]): Record<string, any> {
    const relatedMaxStats: Record<string, {value: number; min: number; fields: string[]}> = {};
    for (const stat of allStats) {
      let min: number;
      let basicValue = 0;
      if (relatedMaxStats[stat.name]) {
        basicValue = relatedMaxStats[stat.name].value;
      }
      if (stat.type === statType.VITALITY) {
        basicValue = stat.min;
        if (stat.onMinHit && (stat.onMinHit.indexOf('death') !== -1 || stat.onMinHit.indexOf('effect') !== -1)) {
          basicValue = stat.min + 1;
        }
        min = basicValue;
        if (stat.maxstat) {
          const relatedStat = allStats.find((itm) => itm.name === stat.maxstat);
          if (relatedStat) {
            if (!relatedMaxStats[relatedStat.name]) {
              relatedMaxStats[relatedStat.name] = {value: basicValue, min, fields: []};
            }
            relatedMaxStats[relatedStat.name].fields.push(stat.name);
            if (stat.onMaxHit && (stat.onMaxHit.indexOf('death') !== -1 || stat.onMaxHit.indexOf('effect') !== -1)) {
              relatedMaxStats[stat.maxstat].value = basicValue + 1;
            }
          }
        }
      }
    }
    return relatedMaxStats;
  }

  public async addItem(): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const allStats = await this.databaseService.queryAll<Stat>(this.dbProfile, statsTable, {}, {where: {isactive: 1}});
    this.relatedMaxStats = this.buildRelatedStats(allStats);
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const stat of allStats) {
      let max: number;
      let min: number;
      let basicValue = 0;
      if (this.relatedMaxStats[stat.name]) {
        basicValue = this.relatedMaxStats[stat.name].value;
      }
      if (stat.type === statType.VITALITY) {
        basicValue = stat.min;
        if (stat.onMinHit && (stat.onMinHit.indexOf('death') !== -1 || stat.onMinHit.indexOf('effect') !== -1)) {
          basicValue = stat.min + 1;
        }
        min = basicValue;
        if (stat.maxstat) {
          const relatedStat = allStats.find((itm) => itm.name === stat.maxstat);
          if (relatedStat) {
            max = this.relatedMaxStats[stat.maxstat].value;
          }
        }
      }
      if (this.relatedMaxStats[stat.name] && this.relatedMaxStats[stat.name] !== undefined) {
        min = this.relatedMaxStats[stat.name].min;
      }
      (form.get('stat') as FormArray).push(
        // @ts-ignore
        this.buildSubForm(
          {stat: stat.name, value: basicValue, levelIncrease: 0, levelPercentIncrease: 0, serverPresent: true, sendToClient: true},
          basicValue,
          min,
          max,
        ),
      );
    }
    let {item} = await this.tablesService.openDialog<PlayerCharacter>(formConfig, form, {
      stat: this.statsForm,
      skill: this.skillsForm,
      item: this.itemsForm,
      genders: this.genderForm,
    });
    if (!item) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const isUsed = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`,
      [item.race, item.aspect],
    );
    if (isUsed.length > 0) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      this.notification.error(this.translate.instant(this.tableKey + '.ALREADY_USED'));
      return 0;
    }
    const stats = item.stat as PlayerCharacterStat[];
    delete item.stat;
    const skills = item.skill as PlayerCharacterSkill[];
    delete item.skill;
    const items = item.item as PlayerCharacterItem[];
    delete item.item;
    const genders = item.genders as PlayerCharacterGender[];
    delete item.genders;
    item = await this.setDefaults(item);
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<PlayerCharacter>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, stats, skills, items, genders);
    await this.updateSameRace(item);
    this.formReset(form);
    this.tablesService.dialogRef = null;
    return newId;
  }

  public async updateItem(id: number): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<PlayerCharacter>(this.dbProfile, this.dbTable, 'id', id);
    if (record.respawnInstance === -1) {
      record.respawnInstance = 0;
    }
    if (record.instance === -1) {
      record.instance = 0;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    const usedStats = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const allStats = await this.databaseService.queryAll<Stat>(this.dbProfile, statsTable, {}, {where: {isactive: 1}});
    this.relatedMaxStats = this.buildRelatedStats(allStats);
    const statsAll: number[] = [];
    for (const stat of usedStats) {
      statsAll.push(stat.id);
      const statItem = allStats.find((ast) => ast.name === stat.stat);
      if (!statItem) {
        continue;
      }
      if (statItem.type === statType.VITALITY) {
        let min = statItem.min;
        let max;
        if (
          statItem.onMinHit &&
          (statItem.onMinHit.indexOf('death') !== -1 || statItem.onMinHit.indexOf('effect') !== -1)
        ) {
          min = statItem.min + 1;
        }
        if (statItem.maxstat) {
          const relatedStat = allStats.find((itm) => itm.name === statItem.maxstat);
          if (relatedStat) {
            this.relatedMaxStats[relatedStat.name].value = stat.value;
            if (
              statItem.onMaxHit &&
              (statItem.onMaxHit.indexOf('death') !== -1 || statItem.onMaxHit.indexOf('effect') !== -1)
            ) {
              this.relatedMaxStats[statItem.maxstat].value = stat.value + 1;
            }
            (form.get('stat') as FormArray).controls.forEach((control) => {
              if (statItem.maxstat === (control.get('stat') as AbstractControl).value) {
                this.relatedMaxStats[statItem.maxstat].value = (control.get('value') as AbstractControl).value;
              }

            });
            max = this.relatedMaxStats[statItem.maxstat].value;
          }
        }
        if (this.relatedMaxStats[statItem.name] && this.relatedMaxStats[statItem.name].min !== undefined) {
          min = this.relatedMaxStats[statItem.name].min;
        }
        (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, min, max));
      }
      else  if (statItem.type === statType.DMG_BASE){
        console.log("DMG Base");
        // (form.get('stat') as FormArray).
        //(form.get('stat') as AbstractControl).disable();
        (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, stat.min, undefined));
      }  else if (statItem.type === statType.PET_COUNT){
        console.log("STAT PET COUNT Base");
        // (form.get('stat') as FormArray).
        //(form.get('stat') as AbstractControl).disable();
        // (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, stat.min, undefined));
        (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, stat.min, undefined));
      } else if (statItem.type === statType.PET_GLOBAL_COUNT){
        console.log("STAT PET GLOBAL COUNT Base");
        // (form.get('stat') as FormArray).
        //(form.get('stat') as AbstractControl).disable();
         (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, stat.min, undefined));
      }
      else  if (statItem.type === statType.EXP){
        (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, stat.min, undefined));
      }
      else {
        let min;
        if (this.relatedMaxStats[statItem.name] && this.relatedMaxStats[statItem.name].min !== undefined) {
          min = this.relatedMaxStats[statItem.name].min;
        }
        (form.get('stat') as FormArray).push(this.buildSubForm(stat, stat.value, min, undefined));
      }
    }
    for (const stat of allStats) {
      if (!usedStats.find((stt: {stat: string}) => stt.stat === stat.name)) {
        let max: number;
        let min: number;
        let basicValue = 0;
        if (this.relatedMaxStats[stat.name]) {
          basicValue = this.relatedMaxStats[stat.name].value;
        }
        if (stat.type === statType.VITALITY) {
          basicValue = stat.min;
          if (stat.onMinHit && (stat.onMinHit.indexOf('death') !== -1 || stat.onMinHit.indexOf('effect') !== -1)) {
            basicValue = stat.min + 1;
          }
          min = basicValue;
          if (stat.maxstat) {
            const relatedStat = allStats.find((itm) => itm.name === stat.maxstat);
            if (relatedStat) {
              if (stat.onMaxHit && (stat.onMaxHit.indexOf('death') !== -1 || stat.onMaxHit.indexOf('effect') !== -1)) {
                this.relatedMaxStats[stat.maxstat].value = basicValue + 1;
              }
              max = this.relatedMaxStats[stat.maxstat].value;
            }
          }
        }
        if (this.relatedMaxStats[stat.name] && this.relatedMaxStats[stat.name].min !== undefined) {
          min = this.relatedMaxStats[stat.name].min;
        }
        (form.get('stat') as FormArray).push(
          // @ts-ignore
          this.buildSubForm(
            {stat: stat.name, type: stat.type, value: basicValue, levelIncrease: 0, levelPercentIncrease: 0, serverPresent: true, sendToClient: true},
            basicValue,
            min,
            max,
          ),
        );
      }
    }
    const usedSkills = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSkill} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const skillsAll: number[] = [];
    for (const skill of usedSkills) {
      skillsAll.push(skill.id);
      (form.get('skill') as FormArray).push(
        this.subFormService.buildSubForm<PlayerCharacterSkill, any>(this.skillsForm, skill),
      );
    }
    const usedItems = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItem} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const itemsAll: number[] = [];
    for (const itm of usedItems) {
      itemsAll.push(itm.id);
      (form.get('item') as FormArray).push(
        this.subFormService.buildSubForm<PlayerCharacterSkill, any>(this.itemsForm, itm),
      );
    }
    const usedGenders = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableGender} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    const gendersAll: number[] = [];
    for (const gen of usedGenders) {
      gendersAll.push(gen.id);
      (form.get('genders') as FormArray).push(
        this.subFormService.buildSubForm<PlayerCharacterGender, any>(this.genderForm, gen),
      );
    }
    const subForms = {stat: this.statsForm, skill: this.skillsForm, item: this.itemsForm, genders: this.genderForm};
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<PlayerCharacter>(formConfig, form, subForms);
    if (!item) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const isUsed = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ? AND id != ?`,
      [item.race, item.aspect, record.id],
    );
    if (isUsed.length > 0) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      this.notification.error(this.translate.instant(this.tableKey + '.ALREADY_USED'));
      return 0;
    }
    const stats = item.stat as PlayerCharacterStat[];
    delete item.stat;
    const skills = item.skill as PlayerCharacterSkill[];
    delete item.skill;
    const items = item.item as PlayerCharacterItem[];
    delete item.item;
    const genders = item.genders as PlayerCharacterGender[];
    delete item.genders;
    item = await this.setDefaults(item);
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      const newId = await this.databaseService.insert<PlayerCharacter>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, stats.map((i) => ({...i, id: undefined})), skills.map((i) => ({...i, id: undefined})), items.map((i) => ({...i, id: undefined})), genders.map((i) => ({...i, id: undefined})));
    } else {
      await this.databaseService.update<PlayerCharacter>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, stats, skills, items, genders, statsAll, skillsAll, itemsAll, gendersAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    await this.updateSameRace(item);
    this.formReset(form);
    this.tablesService.dialogRef = null;
    return 1;
  }

  private async updateSameRace(item: PlayerCharacter): Promise<void> {
    const samePlayerTemplates: PlayerCharacter[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE isactive = 1 and race = ?`,
      [item.race],
    );
    for (const player of samePlayerTemplates) {
      player.race_icon = item.race_icon;
      player.race_icon2 = item.race_icon2;
      player.race_description = item.race_description;
      player.updatetimestamp = this.databaseService.getTimestampNow();
      await this.databaseService.update<PlayerCharacter>(this.dbProfile, this.dbTable, player, 'id', player.id);
    }
  }

  private buildSubForm(item: any, value: number, min: number | undefined, max: number | undefined) {
    const subForm = new FormGroup({});
    Object.keys(this.statsForm).forEach((key) => {
      const validators = [];
      // @ts-ignore
      if (this.statsForm[key].required) {
        validators.push(Validators.required);
      }
      this.statsForm[key].disable = true;
      if (key === 'value') {
        if (min !== undefined) {
          validators.push(Validators.min(min));
        }
        if (max !== undefined) {
          validators.push(Validators.max(max));
        }
      } else {
        // @ts-ignore
        if (this.statsForm[key].min !== undefined) {
          // @ts-ignore
          validators.push(Validators.min(this.statsForm[key].min));
        }
        // @ts-ignore
        if (this.statsForm[key].max !== undefined) {
          // @ts-ignore
          validators.push(Validators.max(this.statsForm[key].max));
        }
      }
      if (key === 'value') {
        subForm.addControl(key, new FormControl(value, validators));
      } else {
        subForm.addControl(key, new FormControl(item[key], validators));
      }
    });
    return subForm;
  }

  private async setDefaults(item: PlayerCharacter): Promise<PlayerCharacter> {
    item.isactive = true;
    item.pos_x = item.pos_x ? item.pos_x : 0;
    item.pos_y = item.pos_y ? item.pos_y : 0;
    item.pos_z = item.pos_z ? item.pos_z : 0;
    item.orientation = item.orientation ? item.orientation : 0;
    item.autoAttack = item.autoAttack ? item.autoAttack : -1;
    item.stat_profile_id = item.stat_profile_id ? item.stat_profile_id : -1;
    item.respawnInstance = item.respawnInstance ? item.respawnInstance : -1;
    item.respawnPosX = item.respawnPosX ? item.respawnPosX : 0;
    item.respawnPosY = item.respawnPosY ? item.respawnPosY : 0;
    item.respawnPosZ = item.respawnPosZ ? item.respawnPosZ : 0;
    item.startingLevel = item.startingLevel ? item.startingLevel : 1;
    item.sprint = item.sprint ? item.sprint : -1;
    item.dodge = item.dodge ? item.dodge : -1;
    item.xpProfile = item.xpProfile ? item.xpProfile : -1;
    if (!item.race_icon && this.profile.defaultImage) {
      item.race_icon = this.profile.defaultImage;
    }
    if (!item.class_icon && this.profile.defaultImage) {
      item.class_icon = this.profile.defaultImage;
    }
    item.race_icon2 = await this.imageService.parseImage(this.profile, item.race_icon);
    item.class_icon2 = await this.imageService.parseImage(this.profile, item.class_icon);
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveSubs(
    recordId: number,
    stats: PlayerCharacterStat[],
    skills: PlayerCharacterSkill[],
    items: PlayerCharacterItem[],
    genders: PlayerCharacterGender[],
    statAll: number[] = [],
    skillAll: number[] = [],
    itemsAll: number[] = [],
    gendersAll: number[] = [],
  ): Promise<void> {
    for (const item of items) {
      item.isactive = true;
      item.character_create_id = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<PlayerCharacterItem>(this.dbProfile, this.dbTableItem, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<PlayerCharacterItem>(this.dbProfile, this.dbTableItem, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        if (itemId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableItem, 'id', itemId, false);
        }
      }
    }
    for (const stat of stats) {
      stat.isactive = true;
      stat.character_create_id = recordId;
      stat.updatetimestamp = this.databaseService.getTimestampNow();
      if (stat.id) {
        statAll.splice(statAll.indexOf(stat.id), 1);
        await this.databaseService.update<PlayerCharacterStat>(this.dbProfile, this.dbTableStat, stat, 'id', stat.id);
      } else {
        stat.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete stat.id;
        await this.databaseService.insert<PlayerCharacterStat>(this.dbProfile, this.dbTableStat, stat, false);
      }
    }
    if (statAll.length > 0) {
      for (const itemId of statAll) {
        if (itemId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableStat, 'id', itemId, false);
        }
      }
    }
    for (const skill of skills) {
      skill.isactive = true;
      skill.character_create_id = recordId;
      skill.updatetimestamp = this.databaseService.getTimestampNow();
      if (skill.id) {
        skillAll.splice(skillAll.indexOf(skill.id), 1);
        await this.databaseService.update<PlayerCharacterSkill>(
          this.dbProfile,
          this.dbTableSkill,
          skill,
          'id',
          skill.id,
        );
      } else {
        skill.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete skill.id;
        await this.databaseService.insert<PlayerCharacterSkill>(this.dbProfile, this.dbTableSkill, skill, false);
      }
    }
    if (skillAll.length > 0) {
      for (const itemId of skillAll) {
        if (itemId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableSkill, 'id', itemId, false);
        }
      }
    }
    for (const gender of genders) {
      gender.isactive = true;
      gender.character_create_id = recordId;
      gender.updatetimestamp = this.databaseService.getTimestampNow();
      gender.icon2 = await this.imageService.parseImage(this.profile, gender.icon);
      if (!gender.icon) {
        gender.icon = this.profile.defaultImage;
      }
      if (gender.id) {
        gendersAll.splice(gendersAll.indexOf(gender.id), 1);
        await this.databaseService.update<PlayerCharacterGender>(
          this.dbProfile,
          this.dbTableGender,
          gender,
          'id',
          gender.id,
        );
      } else {
        gender.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete gender.id;
        await this.databaseService.insert<PlayerCharacterGender>(this.dbProfile, this.dbTableGender, gender, false);
      }
    }
    if (gendersAll.length > 0) {
      for (const genderId of gendersAll) {
        if (genderId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableGender, 'id', genderId, false);
        }
      }
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<PlayerCharacter>(this.dbProfile, this.dbTable, 'id', id);
    const stats = [];
    const skills = [];
    const items = [];
    const genders = [];
    const usedStats = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    for (const stat of usedStats) {
      if(stat.serverPresent) {
        stats.push({
          stat: stat.stat,
          value: stat.value,
          levelIncrease: stat.levelIncrease,
          levelPercentIncrease: stat.levelPercentIncrease,
          serverPresent: stat.serverPresent == 1 ? this.translate.instant('GENERAL.YES') : this.translate.instant('GENERAL.NO'),
          sendToClient: stat.sendToClient == 1 ? this.translate.instant('GENERAL.YES') : this.translate.instant('GENERAL.NO'),

        });
      }
    }
    const usedSkills = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSkill} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    for (const skill of usedSkills) {
      const itm = await this.dropdownItemsService.getSkill(skill.skill);
      skills.push({
        skill: itm ? itm.value : skill.skill,
      });
    }
    const usedItems = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItem} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    for (const itm of usedItems) {
      const item = await this.dropdownItemsService.getItem(itm.item_id);
      items.push({
        item_id: item ? item.value : itm.item_id,
        count: itm.count,
        equipped: itm.equipped,
      });
    }
    const usedGenders: PlayerCharacterGender[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableGender} WHERE isactive = 1 and character_create_id = ?`,
      [record.id],
    );
    for (const gender of usedGenders) {
      const gen = this.gendersList.find((item) => item.id === gender.gender);
      genders.push({
        gender: gen?.value ?? gender.gender,
        model: gender.model,
        icon: gender.icon,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {genders, stats, skills, items}},
    });
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      race: ['', Validators.required],
      aspect: ['', Validators.required],
      faction: ['', Validators.required],
      instance: ['', Validators.required],
      pos_x: ['', Validators.required],
      pos_y: ['', Validators.required],
      pos_z: ['', Validators.required],
      orientation: null,
      respawnInstance: ['', Validators.required],
      respawnPosX: ['', Validators.required],
      respawnPosY: ['', Validators.required],
      respawnPosZ: ['', Validators.required],
      startingLevel: [0, Validators.required],
      autoAttack: null,
      stat_profile_id: -1,
      race_icon: '',
      class_icon: '',
      race_description: '',
      class_description: '',
      sprint: -1,
      dodge: -1,
      xpProfile:[-1, Validators.required],
      stat: new FormArray([]),
      skill: new FormArray([]),
      item: new FormArray([]),
      genders: new FormArray([]),
    });
    (form.get('race') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((raceValue) => {
      if (raceValue) {
        const aspectValue = (form.get('aspect') as AbstractControl).value;
        if (raceValue && aspectValue) {
          this.databaseService
            .customQuery(this.dbProfile, `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`, [
              raceValue,
              aspectValue,
            ])
            .then((isUsed) => {
              if (isUsed.length > 0) {
                (form.get('race') as AbstractControl).setErrors({USED_RACE: true});
              } else {
                (form.get('race') as AbstractControl).setErrors(null);
              }
              (form.get('aspect') as AbstractControl).setErrors(null);
            });
        }
      }
    });
    (form.get('aspect') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((aspectValue) => {
        if (aspectValue) {
          const raceValue = (form.get('race') as AbstractControl).value;
          if (raceValue && aspectValue) {
            this.databaseService
              .customQuery(this.dbProfile, `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`, [
                raceValue,
                aspectValue,
              ])
              .then((isUsed) => {
                if (isUsed.length > 0) {
                  (form.get('aspect') as AbstractControl).setErrors({USED_ASPECT: true});
                } else {
                  (form.get('aspect') as AbstractControl).setErrors(null);
                }
                (form.get('race') as AbstractControl).setErrors(null);
              });
          }
        }
      });
    return form;
  }

  private createCopyForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const copyToForm = this.fb.group({
      race: ['', Validators.required],
      aspect: ['', Validators.required],
    });
    (copyToForm.get('race') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((raceValue) => {
        if (raceValue) {
          const aspectValue = (copyToForm.get('aspect') as AbstractControl).value;
          if (raceValue && aspectValue) {
            this.databaseService
              .customQuery(this.dbProfile, `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`, [
                raceValue,
                aspectValue,
              ])
              .then((isUsed) => {
                if (isUsed.length > 0) {
                  (copyToForm.get('race') as AbstractControl).setErrors({USED_RACE: true});
                } else {
                  (copyToForm.get('race') as AbstractControl).setErrors(null);
                }
                (copyToForm.get('aspect') as AbstractControl).setErrors(null);
              });
          }
        }
      });
    (copyToForm.get('aspect') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((aspectValue) => {
        if (aspectValue) {
          const raceValue = (copyToForm.get('race') as AbstractControl).value;
          if (raceValue && aspectValue) {
            this.databaseService
              .customQuery(this.dbProfile, `SELECT * FROM ${this.dbTable} WHERE race = ? AND aspect = ?`, [
                raceValue,
                aspectValue,
              ])
              .then((isUsed) => {
                if (isUsed.length > 0) {
                  (copyToForm.get('aspect') as AbstractControl).setErrors({USED_ASPECT: true});
                } else {
                  (copyToForm.get('aspect') as AbstractControl).setErrors(null);
                }
                (copyToForm.get('race') as AbstractControl).setErrors(null);
              });
          }
        }
      });
    return copyToForm;
  }

  private formReset(form: FormGroup): void {
    form.reset();
    (form.get('stat') as FormArray).clear();
    (form.get('skill') as FormArray).clear();
    (form.get('item') as FormArray).clear();
    (form.get('genders') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private formCopyReset(form: FormGroup): void {
    form.reset();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
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
      {type: ActionsTypes.COPY_TO, name: ActionsNames.COPY_TO, icon: ActionsIcons.COPY_TO},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.MARK_AS_REMOVED},
    ];
    this.destroyer.next(void 0);
    this.destroyer.complete();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }
}
