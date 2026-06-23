import {Injectable} from '@angular/core';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Mob, MobLoot, mobsDefaults, MobStat} from './mobs.data';
import {TranslateService} from '@ngx-translate/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery,
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {mobLootTable, mobStatTable, mobTemplateTable, statProfileStatsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {
  abilityFieldConfig,
  behaviorProfileFieldConfig, classFieldConfig,
  factionFieldConfig, genderFieldConfig,
  lootTableFieldConfig,
  mobTagsFieldConfig,
  mobTypeFieldConfig, petCountStatFieldConfig, raceFieldConfig,
  skillFieldConfig,
  speciesFieldConfig,
  statFieldConfig, statProfileFieldConfig,
  toolTypeFieldConfig,
  weaponItemFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MobsService {
  public tableKey = TabTypes.MOBS;
  private readonly listStream = new BehaviorSubject<Mob[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = mobTemplateTable;
  public dbTableStat = mobStatTable;
  public dbTableStatProfileStats = statProfileStatsTable;
  public dbTableLoot = mobLootTable;
  public baOptions: DropdownValue[] = [
    {id: 1, value: 'standing'},
    {id: 2, value: 'swimming'},
    {id: 3, value: 'flying'},
  ];
  private readonly statsForm: SubFieldType = {
    id: {value: '', required: false},
    stat: {value: '', required: true},
    value: {value: '', required: true, min: 0},
  };
  private readonly lootsForm: SubFieldType = {
    id: {value: '', required: false},
    lootTable: {value: '', required: true},
    dropChance: {value: '', required: true, min: 0},
    count: {value: 1, required: true, min: 1},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      displayName: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      subTitle: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      species: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      subSpecies: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      race_id: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      class_id: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      gender_id: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      mobType: {
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
      hitbox: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      speed_walk: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      speed_run: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      baseAnimationState: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.baOptions,
      },
      exp: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      addExplev: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      minLevel: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      maxLevel: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      minDmg: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      maxDmg: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      attackable: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      aggro_radius: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      chasing_distance: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      link_aggro_range: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      send_link_aggro: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      get_link_aggro: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      skinningLootTable: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: lootTableFieldConfig,
        data: [],
      },
      skinningLevelReq: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      skinningLevelMax: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      skinningSkillId: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: skillFieldConfig,
        data: [],
      },
      skinningSkillExp: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      skinningWeaponReq: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      behavior_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: behaviorProfileFieldConfig,
        data: [],
      },
      stat_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statProfileFieldConfig,
        data: [],
      },
      stat: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
      },
      lootTable: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: lootTableFieldConfig,
      },
      count: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
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
    dialogType: DialogConfig.fullDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 33},
      displayName: {name: 'displayName', type: FormFieldType.input, require: true, length: 200, width: 33},
      subTitle: {name: 'subTitle', type: FormFieldType.input, length: 200, width: 33},
      display1: {
        name: 'display1',
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 256,
        require: true,
        width: 100,
      },
      species: {
        name: 'species',
        type: FormFieldType.dynamicDropdown,
        search: true,
        require: true,
        width: 50,
        allowNew: true,
        fieldConfig: speciesFieldConfig,
      },
      subSpecies: {name: 'subSpecies', type: FormFieldType.input, length: 64, width: 50},
      race_id: {
        name: 'race_id',
        type: FormFieldType.dynamicDropdown,
        search: true,
        allowNew: true,
        fieldConfig: raceFieldConfig,
        width: 33,
      },
      class_id: {
        name: 'class_id',
        type: FormFieldType.dynamicDropdown,
        search: true,
        allowNew: true,
        fieldConfig: classFieldConfig,
        width: 33,
      },
      gender_id: {
        name: 'gender_id',
        type: FormFieldType.dynamicDropdown,
        search: true,
        allowNew: true,
        fieldConfig: genderFieldConfig,
        width: 33,
      },
      mobType: {
        name: 'mobType',
        type: FormFieldType.dynamicDropdown,
        search: true,
        require: true,
        allowNew: true,
        fieldConfig: mobTypeFieldConfig,
        width: 50,
      },
      faction: {
        name: 'faction',
        type: FormFieldType.dynamicDropdown,
        require: true,
        allowNew: true,
        width: 50,
        fieldConfig: factionFieldConfig,
      },
      behavior_profile_id: {
        name: 'behavior_profile_id',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: behaviorProfileFieldConfig,
        search: true,
        width: 25,
      },
      pet_count_stat: {
        name: 'pet_count_stat',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: petCountStatFieldConfig,
        search: true,
        width: 25,
      },
      tags: {
        name: 'tags',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: mobTagsFieldConfig,
        search: true,
        multiple: true,
        //require: true,
        width: 50,
      },
      title1: {name: '', label: this.translate.instant(this.tableKey + '.MOB_DISPLAY'), type: FormFieldType.title},
      hitbox: {name: 'hitbox', type: FormFieldType.integer, require: true, width: 33},
      speed_walk: {name: 'speed_walk', type: FormFieldType.integer, require: true, width: 33},
      speed_run: {name: 'speed_run', type: FormFieldType.integer, require: true, width: 33},
      baseAnimationState: {
        name: 'baseAnimationState',
        type: FormFieldType.dropdown,
        hideNone: true,
        search: true,
        width: 33,
        data: this.baOptions,
      },
      title2: {
        name: '',
        label: this.translate.instant(this.tableKey + '.MOB_COMBAT_SETTINGS'),
        type: FormFieldType.title,
      },
      exp: {name: 'exp', type: FormFieldType.integer, require: true, width: 25},
      addExplev: {name: 'addExplev', type: FormFieldType.integer, require: true, width: 25},
      minLevel: {name: 'minLevel', type: FormFieldType.integer, require: true, width: 25},
      maxLevel: {name: 'maxLevel', type: FormFieldType.integer, require: true, width: 25},
      minDmg: {name: 'minDmg', type: FormFieldType.integer, require: true, width: 25},
      maxDmg: {name: 'maxDmg', type: FormFieldType.integer, require: true, width: 25},
      attackable: {name: 'attackable', type: FormFieldType.boolean, width: 50},
      aggro_radius: {name: 'aggro_radius', type: FormFieldType.integer, width: 33},
      chasing_distance: {name: 'chasing_distance', type: FormFieldType.integer, width: 33},
      link_aggro_range: {name: 'link_aggro_range', type: FormFieldType.integer, width: 33},
      send_link_aggro: {name: 'send_link_aggro', type: FormFieldType.boolean, width: 50},
      get_link_aggro: {name: 'get_link_aggro', type: FormFieldType.boolean, width: 50},
      skinningLootTable: {
        name: 'skinningLootTable',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 33,
        fieldConfig: lootTableFieldConfig,
      },
      skinningLevelReq: {name: 'skinningLevelReq', type: FormFieldType.integer, width: 33},
      skinningLevelMax: {name: 'skinningLevelMax', type: FormFieldType.integer, width: 33},
      skinningSkillId: {
        name: 'skinningSkillId',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: skillFieldConfig,
      },
      skinningSkillExp: {name: 'skinningSkillExp', type: FormFieldType.integer, width: 33},
      skinningWeaponReq: {
        name: 'skinningWeaponReq',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: toolTypeFieldConfig,
        search: true,
        width: 33,
      },
      stat_profile_id: {
        name: 'stat_profile_id',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statProfileFieldConfig,
        search: true,
        width: 33,
      },
    },
    subForms: {
      // stats: {
      //   title: this.translate.instant(this.tableKey + '.STATS'),
      //   submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
      //   fields: {
      //     id: {name: 'id', label: '', type: FormFieldType.hidden},
      //     stat: {
      //       name: 'stat',
      //       type: FormFieldType.dynamicDropdown,
      //       require: true,
      //       allowNew: true,
      //       width: 50,
      //       fieldConfig: statFieldConfig,
      //     },
      //     value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
      //   },
      // },
      loot: {
        title: this.translate.instant(this.tableKey + '.LOOTS'),
        submit: this.translate.instant(this.tableKey + '.ADD_LOOT'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          lootTable: {
            name: 'lootTable',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            width: 50,
            fieldConfig: lootTableFieldConfig,
          },
          dropChance: {name: 'dropChance', type: FormFieldType.decimal, require: true, width: 25},
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 25},
        },
      },
    },
  };
  private loadDataReadyStream = new Subject<void>();
  loadDataReady = this.loadDataReadyStream.asObservable();
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.formConfig.fields.display1.acceptFolder = profile.folder + profile.mobFolder;
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
        this.loadData();
      }
    });
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((abilitiesList) => {
    });
    this.dropdownItemsService.stats.pipe(distinctPipe(this.destroyer)).subscribe((statsList) => {
      this.tableConfig.fields.stat.data = statsList;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.skinningSkillId.data = listing;
    });
    this.dropdownItemsService.lootTable.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.skinningLootTable.data = listing;
    });
    this.dropdownItemsService.factions.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.faction.data = listing;
    });
    this.dropdownItemsService.mobBehaviors.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.behavior_profile_id.data = listing;
    });
    this.dropdownItemsService.statsProfileId.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.stat_profile_id.data = listing;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadData();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.species.data = await this.optionChoicesService.getOptionsByType('Species', true);
    this.tableConfig.fields.mobType.data = await this.optionChoicesService.getOptionsByType('Mob Type');
    this.tableConfig.fields.race_id.data = await this.optionChoicesService.getOptionsByType('Race', true);
    this.tableConfig.fields.class_id.data = await this.optionChoicesService.getOptionsByType('Class', true);
    this.tableConfig.fields.gender_id.data = await this.optionChoicesService.getOptionsByType('Gender', true);
    this.tableConfig.fields.skinningWeaponReq.data = await this.optionChoicesService.getOptionsByType(
      'Weapon Type',
      true,
    );
  }

  private async loadData(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getWeaponItems();
    await this.dropdownItemsService.getSkills();
    await this.dropdownItemsService.getLootTables();
    await this.dropdownItemsService.getFactions();
    await this.dropdownItemsService.getMobBehaviors();
    await this.dropdownItemsService.getStatProfile();
    this.loadDataReadyStream.next();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getMobs();
    }
    const subFields: Record<string, SubQueryField> = {
      stat: {
        type: SubTable.left_join,
        main: 'id',
        related: 'mobTemplate',
        table: this.dbTableStat,
        where: {},
      },
      stat_id: {
        type: SubTable.left_join,
        main: 'stat_profile_id',
        related: 'profile_id',
        table: this.dbTableStatProfileStats,
        where: {},
      },
      lootTable: {
        type: SubTable.left_join,
        main: 'id',
        related: 'mobTemplate',
        table: this.dbTableLoot,
        where: {},
      },
      count: {
        type: SubTable.left_join,
        main: 'id',
        related: 'mobTemplate',
        table: this.dbTableLoot,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.stat.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.lootTable.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.count.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Mob>(
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
    let {item} = await this.tablesService.openDialog<Mob>(formConfig, form, {
      stats: this.statsForm,
      loot: this.lootsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const stats = item.stats as MobStat[];
    delete item.stats;
    const loots = item.loot as MobLoot[];
    delete item.loot;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<Mob>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, stats, loots);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<Mob>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const statsAll: number[] = [];
    const lootsAll: number[] = [];
    const listStats = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and mobTemplate = ${record.id}`,
    );
    const listLoots = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLoot} WHERE isactive = 1 and mobTemplate = ${record.id}`,
    );
    for (const itm of listStats) {
      statsAll.push(itm.id);
      (form.get('stats') as FormArray).push(this.subFormService.buildSubForm<MobStat, any>(this.statsForm, itm));
    }
    for (const itm of listLoots) {
      lootsAll.push(itm.id);
      (form.get('loot') as FormArray).push(this.subFormService.buildSubForm<MobLoot, any>(this.lootsForm, itm));
    }
    form.patchValue(record);
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<Mob>(formConfig, form, {
      stats: this.statsForm,
      loot: this.lootsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const stats = item.stats as MobStat[];
    delete item.stats;
    const loots = item.loot as MobLoot[];
    delete item.loot;
    item = this.setDefaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Mob>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, stats.map((s) => ({...s, id: undefined})), loots.map((l) => ({...l, id: undefined})));
    } else {
      await this.databaseService.update<Mob>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, stats, loots, statsAll, lootsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.resetForm(form);

    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  private setDefaults(item: Mob): Mob {
    item.category = 0;
    item.scale = 1;
    item.subTitle = item.subTitle ? item.subTitle : '';
    item.subSpecies = item.subSpecies ? item.subSpecies : '';
    item.attackable = item.attackable ? item.attackable : false;
    item.skinningLevelMax = item.skinningLevelMax ? item.skinningLevelMax : 0;
    item.baseAnimationState = item.baseAnimationState ? item.baseAnimationState : 1;
    item.skinningSkillId = item.skinningSkillId ? item.skinningSkillId : 0;
    item.skinningSkillExp = item.skinningSkillExp ? item.skinningSkillExp : 0;
    item.skinningWeaponReq = item.skinningWeaponReq ? item.skinningWeaponReq : '';
    item.skinningLootTable = item.skinningLootTable ? item.skinningLootTable : -1;
    item.stat_profile_id = item.stat_profile_id ? item.stat_profile_id : -1;
    item.attackSpeed = mobsDefaults.attackSpeed as number;
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.hitbox = item.hitbox ? item.hitbox : 0;
    item.speed_walk = item.speed_walk ? item.speed_walk : 0;
    item.speed_run = item.speed_run ? item.speed_run : 0;
    item.exp = item.exp ? item.exp : 0;
    item.addExplev = item.addExplev ? item.addExplev : 0;
    item.minLevel = item.minLevel ? item.minLevel : 1;
    item.maxLevel = item.maxLevel ? item.maxLevel : 0;
    item.minDmg = item.minDmg ? item.minDmg : 0;
    item.maxDmg = item.maxDmg ? item.maxDmg : 0;
    item.skinningLevelReq = item.skinningLevelReq ? item.skinningLevelReq : 0;
    item.aggro_radius = item.aggro_radius ? item.aggro_radius : 1;
    item.chasing_distance = item.chasing_distance ? item.chasing_distance : 60;
    item.link_aggro_range = item.link_aggro_range ? item.link_aggro_range : 0;
    item.send_link_aggro = item.send_link_aggro ? item.send_link_aggro : false;
    item.get_link_aggro = item.get_link_aggro ? item.get_link_aggro : false;
    item.behavior_profile_id = item.behavior_profile_id ? item.behavior_profile_id : -1;
    item.pet_count_stat = item.pet_count_stat ? item.pet_count_stat : -1;
    item.race_id = item.race_id ? item.race_id : -1;
    item.class_id = item.class_id ? item.class_id : -1;
    item.gender_id = item.gender_id ? item.gender_id : -1;
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Mob>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const used = await this.databaseService.queryItem<Mob>(this.dbProfile, this.dbTable, 'name', record.name);
    if (used) {
      this.notification.error(this.translate.instant('MOBS.DUPLICATED_NAME'));
      return 0;
    }
    const listStats = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and mobTemplate = ${baseRecord.id}`,
    );
    const listLoots = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLoot} WHERE isactive = 1 and mobTemplate = ${baseRecord.id}`,
    );
    const item = await this.prepareForm(record, listStats, listLoots);
    if (!item) {
      return 0;
    }
    let stats = item.stats as MobStat[];
    delete item.stats;
    let loots = item.loot as MobLoot[];
    delete item.loot;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Mob>(this.dbProfile, this.dbTable, item, false);
    stats = stats.map((stat) => ({...stat, id: undefined}));
    loots = loots.map((loot) => ({...loot, id: undefined}));
    await this.saveSubs(newId, stats, loots);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: Mob, stats: MobStat[], loots: MobLoot[]): Promise<Mob | undefined> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const itm of stats) {
      (form.get('stats') as FormArray).push(this.subFormService.buildSubForm<MobStat, any>(this.statsForm, itm));
    }
    for (const itm of loots) {
      (form.get('loot') as FormArray).push(this.subFormService.buildSubForm<MobLoot, any>(this.lootsForm, itm));
    }
    form.patchValue(record);
    const {item} = await this.tablesService.openDialog<Mob>(formConfig, form, {
      stats: this.statsForm,
      loot: this.lootsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return undefined;
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return this.setDefaults(item);
  }

  private async saveSubs(
    recordId: number,
    items: MobStat[],
    loots: MobLoot[],
    itemsAll: number[] = [],
    lootsAll: number[] = [],
  ) {
    for (const item of items) {
      item.isactive = true;
      item.mobTemplate = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<MobStat>(this.dbProfile, this.dbTableStat, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<MobStat>(this.dbProfile, this.dbTableStat, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableStat, 'id', itemId, false);
      }
    }
    for (const item of loots) {
      item.isactive = true;
      item.category = 0;
      item.mobTemplate = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        lootsAll.splice(lootsAll.indexOf(item.id), 1);
        await this.databaseService.update<MobLoot>(this.dbProfile, this.dbTableLoot, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<MobLoot>(this.dbProfile, this.dbTableLoot, item, false);
      }
    }
    if (lootsAll.length > 0) {
      for (const itemId of lootsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableLoot, 'id', itemId, false);
      }
    }
  }

  public async previewItems(id: number): Promise<void> {
    const statItems = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStat} WHERE isactive = 1 and mobTemplate = ${id}`,
    );
    const lootItems = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLoot} WHERE isactive = 1 and mobTemplate = ${id}`,
    );
    const stats = [];
    const loots = [];
    for (const item of statItems) {
      stats.push({stat: item.stat, value: item.value});
    }
    for (const item of lootItems) {
      const itm = (this.tableConfig.fields.skinningLootTable.data as DropdownValue[]).find(
        (im) => im.id === item.lootTable,
      );
      loots.push({lootTable: itm ? itm.value : item.lootTable, dropChance: item.dropChance, count: item.count});
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {stats, loots}},
    });
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      displayName: ['', Validators.required],
      subTitle: [''],
      display1: ['', Validators.required],
      species: ['', Validators.required],
      subSpecies: [''],
      mobType: ['', Validators.required],
      faction: ['', Validators.required],
      hitbox: [0, [Validators.required, Validators.min(0)]],
      speed_walk: [0, [Validators.required, Validators.min(0)]],
      speed_run: [0, [Validators.required, Validators.min(0)]],
      baseAnimationState: 1,
      exp: [0, [Validators.required, Validators.min(0)]],
      addExplev: [0, [Validators.required, Validators.min(0)]],
      minLevel: [1, [Validators.required, Validators.min(1)]],
      maxLevel: [1, Validators.required],
      minDmg: [0, [Validators.required, Validators.min(0)]],
      maxDmg: [0, Validators.required],
      attackable: 0,
      aggro_radius: [1, Validators.min(1)],
      chasing_distance: [1, Validators.min(1)],
      link_aggro_range: [0, Validators.min(0)],
      send_link_aggro: false,
      get_link_aggro: false,
      skinningLootTable: [''],
      skinningLevelReq: [0, [Validators.min(0)]],
      skinningLevelMax: [0, [Validators.min(0)]],
      skinningSkillId: [''],
      skinningSkillExp: [0, [Validators.min(0)]],
      skinningWeaponReq: [''],
      stat_profile_id: [-1, Validators.required],
      behavior_profile_id: -1,
      pet_count_stat: -1,
      race_id: -1,
      class_id: -1,
      gender_id: -1,
      tags: [''], //, Validators.required],
      stats: new FormArray([]),
      loot: new FormArray([]),
    });
    form.patchValue(mobsDefaults);
    (form.get('minLevel') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      const validators = [Validators.required];
      if (value !== null) {
        validators.push(Validators.min(value));
      }
      (form.get('maxLevel') as AbstractControl).setValidators(validators);
      (form.get('maxLevel') as AbstractControl).updateValueAndValidity();
    });
    (form.get('minDmg') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      const validators = [Validators.required];
      if (value !== null) {
        validators.push(Validators.min(value));
      }
      (form.get('maxDmg') as AbstractControl).setValidators(validators);
      (form.get('maxDmg') as AbstractControl).updateValueAndValidity();
    });
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('stats') as FormArray).clear();
    (form.get('loot') as FormArray).clear();
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
  }
}
