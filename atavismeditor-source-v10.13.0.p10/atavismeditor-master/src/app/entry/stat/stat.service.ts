import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType, hiddenField,
  QueryParams, SubFormType,
  TableConfig, TypeMap,
  WhereQuery
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {statsLinkTable, statsTable} from '../tables.data';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {
  effectFieldConfig,
  statBaseFieldConfig,
  statFieldConfig,
  statFunctionsFieldConfig,
  statShiftActionFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';

export interface Stat {
  id?: number;
  name: string;
  type: number;
  stat_function: string;
  mob_base: number;
  mob_level_increase: number;
  mob_level_percent_increase: number;
  min: number;
  max: number;
  maxstat: string;
  canExceedMax: boolean;
  sharedWithGroup: boolean;
  shiftTarget: number;
  shiftValue: number;
  shiftReverseValue: number;
  shiftInterval: number;
  isShiftPercent: boolean;
  onMaxHit: string;
  onMaxHitEffect: string;
  onMinHit: string;
  onMinHitEffect: string;
  shiftReq1: string;
  shiftReq1State: boolean;
  shiftReq1SetReverse: boolean;
  shiftReq2: string;
  shiftReq2State: boolean;
  shiftReq2SetReverse: boolean;
  shiftReq3: string;
  shiftReq3State: boolean;
  shiftReq3SetReverse: boolean;
  startPercent: number;
  deathResetPercent: number;
  releaseResetPercent: number;
  sendToClient: boolean;
  serverPresent: boolean;
  onThreshold: string;
  onThreshold2: string;
  onThreshold3: string;
  onThreshold4: string;
  onThreshold5: string;
  threshold: number;
  threshold2: number;
  threshold3: number;
  threshold4: number;
  shiftModStat: string;
  stat_precision: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  stats?: StatLink[];
}

export interface StatLink {
  id: number;
  stat_id: number;
  stat: string;
  statTo: string;
  pointsForChange: number;
  changePerPoint: number;
  isactive: boolean;
}

export enum statType {
  BASE = 0,
  RESISTANCE = 1,
  VITALITY = 2,
  EXP = 3,
  DMG_BASE = 4,
  PET_COUNT = 5,
  PET_GLOBAL_COUNT = 6,
}

@Injectable({
  providedIn: 'root',
})
export class StatService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.STATS;
  private readonly listStream = new BehaviorSubject<Stat[]>([]);
  public list = this.listStream.asObservable();
  private statsForm: SubFieldType = {
    id: {value: '', required: false},
    statTo: {value: '', required: false},
    pointsForChange: {value: 1, required: true},
    changePerPoint: {value: 1, required: true},
  };
  public dbProfile!: DataBaseProfile;
  public dbTable = statsTable;
  public dbTableStats = statsLinkTable;
  public readonly statType: DropdownValue[] = [
    {id: statType.BASE, value: this.translate.instant(this.tableKey + '.STAT_TYPE.BASE_TYPE')},
    {id: statType.RESISTANCE, value: this.translate.instant(this.tableKey + '.STAT_TYPE.RESISTANCE_TYPE')},
    {id: statType.VITALITY, value: this.translate.instant(this.tableKey + '.STAT_TYPE.VITALITY_TYPE')},
    {id: statType.EXP, value: this.translate.instant(this.tableKey + '.STAT_TYPE.EXP_TYPE')},
    {id: statType.DMG_BASE, value: this.translate.instant(this.tableKey + '.STAT_TYPE.DMB_BASE_TYPE')},
    {id: statType.PET_COUNT, value: this.translate.instant(this.tableKey + '.STAT_TYPE.PET_COUNT_TYPE')},
    {id: statType.PET_GLOBAL_COUNT, value: this.translate.instant(this.tableKey + '.STAT_TYPE.PET_GLOBAL_COUNT_TYPE')},
  ];
  public readonly targetOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.ALL')},
    {id: 1, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.PLAYER_ONLY')},
    {id: 2, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.MOB_ONLY')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      name: {type: ConfigTypes.stringType, visible: true, alwaysVisible: true, useAsSearch: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: this.statType,
      },
      stat_function: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: [],
      },
      sharedWithGroup: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      mob_base: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      mob_level_increase: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      mob_level_percent_increase: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      min: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      max: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      stat_precision: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      maxstat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: true,
        data: [],
        fieldConfig: statBaseFieldConfig,
      },
      shiftModStat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: true,
        data: [],
        fieldConfig: statBaseFieldConfig,
      },
      canExceedMax: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      shiftTarget: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: this.targetOptions,
      },
      shiftValue: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      shiftReverseValue: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      shiftInterval: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      isShiftPercent: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      startPercent: {
        type: ConfigTypes.numberType,
        visible: false,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      releaseResetPercent: {
        type: ConfigTypes.numberType,
        visible: false,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      shiftReq1: {type: ConfigTypes.dropdown, visible: true, data: []},
      shiftReq2: {type: ConfigTypes.dropdown, visible: true, data: []},
      shiftReq3: {type: ConfigTypes.dropdown, visible: true, data: []},
      onThreshold: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: false,
        fieldConfig: effectFieldConfig,
      },
      threshold: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.decimal,
        filterVisible: false,
      },
      shiftReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: false,
        data: [],
      },
      statTo: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
      },
      pointsForChange: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      changePerPoint: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: false,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {type: ConfigTypes.date, visible: true, filterVisible: false, filterType: FilterTypes.date},
      updatetimestamp: {type: ConfigTypes.date, visible: true, filterVisible: false, filterType: FilterTypes.date},
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
      id: {name: 'id', label: '', type: FormFieldType.hidden},
      name: {name: 'name', type: FormFieldType.input, require: true, length: 45, width: 100},
      type: {name: 'type', type: FormFieldType.dropdown, require: true, data: this.statType, width: 33},
      stat_function: {
        name: 'stat_function',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        search: true,
        fieldConfig: statFunctionsFieldConfig,
        width: 33,
      },
      sharedWithGroup: {name: 'sharedWithGroup', type: FormFieldType.boolean, width: 33},
      title1: {name: '', label: this.translate.instant(this.tableKey + '.MOBS_VALUES'), type: FormFieldType.title},
      mob_base: {name: 'mob_base', type: FormFieldType.integer, require: true, width: 25},
      mob_level_increase: {name: 'mob_level_increase', type: FormFieldType.integer, require: true, width: 25},
      mob_level_percent_increase: {
        name: 'mob_level_percent_increase',
        type: FormFieldType.integer,
        require: true,
        width: 25,
      },
      stat_precision: {name: 'stat_precision', type: FormFieldType.integer, width: 25},
      title8: {name: '', label: '', type: FormFieldType.title},
      serverPresent: {name: 'serverPresent', type: FormFieldType.boolean, width: 50},
      sendToClient: {name: 'sendToClient', type: FormFieldType.boolean, width: 50},
      title2: {name: '', label: '', type: FormFieldType.title},


      min: {name: 'min', type: FormFieldType.integer, width: -1},
      max: {name: 'max', type: FormFieldType.integer, width: -1},



      maxstat: {
        name: 'maxstat',
        type: FormFieldType.dynamicDropdown,
        require: true,
        fieldConfig: statBaseFieldConfig,
        width: -1,
      },
      canExceedMax: {name: 'canExceedMax', type: FormFieldType.boolean, width: -1},
      shiftTarget: {
        name: 'shiftTarget',
        type: FormFieldType.dropdown,
        hideNone: true,
        require: true,
        data: this.targetOptions,
        width: -1,
      },
      shiftValue: {name: 'shiftValue', type: FormFieldType.integer, require: true, width: -1},
      shiftReverseValue: {name: 'shiftReverseValue', type: FormFieldType.integer, require: true, width: -1},
      shiftInterval: {name: 'shiftInterval', type: FormFieldType.integer, require: true, width: -1},
      isShiftPercent: {name: 'isShiftPercent', type: FormFieldType.boolean, width: -1},
      shiftModStat: {
        name: 'shiftModStat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statBaseFieldConfig,
        width: -1,
      },
      title3: {name: '', label: '', type: FormFieldType.title},
      onMinHit: {
        name: 'onMinHit',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statShiftActionFieldConfig,
        width: -1,
      },
      onMinHitEffect: {
        name: 'onMinHitEffect',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        width: -1,
      },
      title4: {name: '', label: '', type: FormFieldType.title},
      threshold: {name: 'threshold', type: FormFieldType.decimal, width: -1},
      onThreshold: {
        name: 'onThreshold',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        disabled: true,
        width: -1,
      },
      threshold2: {
        name: 'threshold2',
        label: this.translate.instant(this.tableKey + '.THRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.THRESHOLD_HELP'),
        type: FormFieldType.decimal,
        width: -1,
      },
      onThreshold2: {
        name: 'onThreshold2',
        label: this.translate.instant(this.tableKey + '.ONTHRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.ONTHRESHOLD_HELP'),
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        disabled: true,
        width: -1,
      },
      threshold3: {
        name: 'threshold3',
        label: this.translate.instant(this.tableKey + '.THRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.THRESHOLD_HELP'),
        type: FormFieldType.decimal,
        width: -1,
      },
      onThreshold3: {
        name: 'onThreshold3',
        label: this.translate.instant(this.tableKey + '.ONTHRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.ONTHRESHOLD_HELP'),
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        disabled: true,
        width: -1,
      },
      threshold4: {
        name: 'threshold4',
        label: this.translate.instant(this.tableKey + '.THRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.THRESHOLD_HELP'),
        type: FormFieldType.decimal,
        width: -1,
      },
      onThreshold4: {
        name: 'onThreshold4',
        label: this.translate.instant(this.tableKey + '.ONTHRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.ONTHRESHOLD_HELP'),
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        disabled: true,
        width: -1,
      },
      title5: {name: '', label: '', type: FormFieldType.title},
      onThreshold5: {
        name: 'onThreshold5',
        label: this.translate.instant(this.tableKey + '.ONTHRESHOLD'),
        tooltip: this.translate.instant(this.tableKey + '.ONTHRESHOLD_HELP'),
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        width: -1,
      },
      title6: {name: '', label: '', type: FormFieldType.title},
      onMaxHit: {
        name: 'onMaxHit',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statShiftActionFieldConfig,
        width: -1,
      },
      onMaxHitEffect: {
        name: 'onMaxHitEffect',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        allowNew: true,
        width: -1,
      },
      title7: {name: '', label: '', type: FormFieldType.title},
      startPercent: {name: 'startPercent', type: FormFieldType.integer, width: -1},
      releaseResetPercent: {name: 'releaseResetPercent', type: FormFieldType.integer, width: -1},
      shiftReq1: {name: 'shiftReq1', type: FormFieldType.dropdown, data: [], width: -1},
      shiftReq1State: {name: 'shiftReq1State', type: FormFieldType.boolean, width: -1},
      shiftReq1SetReverse: {name: 'shiftReq1SetReverse', type: FormFieldType.boolean, width: -1},
      shiftReq2: {name: 'shiftReq2', type: FormFieldType.dropdown, data: [], width: -1},
      shiftReq2State: {name: 'shiftReq2State', type: FormFieldType.boolean, width: -1},
      shiftReq2SetReverse: {name: 'shiftReq2SetReverse', type: FormFieldType.boolean, width: -1},
      shiftReq3: {name: 'shiftReq3', type: FormFieldType.dropdown, data: [], width: -1},
      shiftReq3State: {name: 'shiftReq3State', type: FormFieldType.boolean, width: -1},
      shiftReq3SetReverse: {name: 'shiftReq3SetReverse', type: FormFieldType.boolean, width: -1},
    },
    subForms: {
      stats: {
        title: this.translate.instant(this.tableKey + '.STATS'),
        submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
        hiddenSubForm: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          statTo: {
            name: 'statTo',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: statFieldConfig,
            allowNew: true,
            require: true,
            width: 50,
          },
          pointsForChange: {name: 'pointsForChange', type: FormFieldType.integer, require: true, width: 25},
          changePerPoint: {name: 'changePerPoint', type: FormFieldType.decimal, require: true, width: 25},
        },
      },
    },
  };
  private defaultValues: Partial<Stat> = {
    stat_function: '',
    mob_base: 0,
    mob_level_increase: 0,
    mob_level_percent_increase: 0,
    stat_precision: 0,
    min: 0,
    max: 0,
    maxstat: '',
    canExceedMax: false,
    sharedWithGroup: false,
    shiftTarget: 0,
    shiftValue: 0,
    shiftReverseValue: 0,
    shiftInterval: 1,
    isShiftPercent: false,
    onMaxHit: '',
    onMaxHitEffect: '',
    onMinHit: '',
    onMinHitEffect: '',
    shiftReq1: '',
    shiftReq1State: false,
    shiftReq1SetReverse: false,
    shiftReq2: '',
    shiftReq2State: false,
    shiftReq2SetReverse: false,
    shiftReq3: '',
    shiftReq3State: false,
    shiftReq3SetReverse: false,
    startPercent: 0,
    releaseResetPercent: -1,
    shiftModStat: '',
    onThreshold: '',
    threshold: -1,
    onThreshold2: '',
    threshold2: -1,
    onThreshold3: '',
    threshold3: -1,
    onThreshold4: '',
    threshold4: -1,
    onThreshold5: '',
    serverPresent: true,
    sendToClient: true,

  };

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
    private readonly handleDepService: HandleDependenciesService,
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
    this.dropdownItemsService.stats.pipe(distinctPipe<DropdownValue[]>(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.maxstat.data = list;
      this.tableConfig.fields.shiftModStat.data = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.stat_function.data = await this.optionChoicesService.getOptionsByType(
      'Stat Functions',
      true,
    );
    const statShiftActions = await this.optionChoicesService.getOptionsByType('Stat Shift Action', true);
    this.formConfig.fields.onMinHit.data = statShiftActions;
    this.formConfig.fields.onMaxHit.data = statShiftActions;
    const statShiftRequirements = await this.optionChoicesService.getOptionsByType('Stat Shift Requirement', true);
    const states = await this.optionChoicesService.getOptionsByType('State', true);
    const listingTmp = [];
    const listing = [];
    for (const item of statShiftRequirements) {
      listingTmp.push(item.value);
    }
    for (const item of states) {
      listingTmp.push(item.value);
    }
    for (let i = 0; i < listingTmp.length; i++) {
      listing.push({id: listingTmp[i], value: listingTmp[i]});
    }
    this.tableConfig.fields.shiftReq.data = listing;
    this.tableConfig.fields.shiftReq1.data = listing;
    this.tableConfig.fields.shiftReq2.data = listing;
    this.tableConfig.fields.shiftReq3.data = listing;
    this.formConfig.fields.shiftReq1.data = listing;
    this.formConfig.fields.shiftReq2.data = listing;
    this.formConfig.fields.shiftReq3.data = listing;
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getStats();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      await this.dropdownItemsService.getStats();
    }
    const subFields: Record<string, SubQueryField> = {
      statTo: {
        type: SubTable.left_join,
        main: 'id',
        related: 'stat_id',
        table: this.dbTableStats,
        where: {},
      },
      pointsForChange: {
        type: SubTable.left_join,
        main: 'name',
        related: 'stat',
        table: this.dbTableStats,
        where: {},
      },
      changePerPoint: {
        type: SubTable.left_join,
        main: 'id',
        related: 'stat_id',
        table: this.dbTableStats,
        where: {},
      },
      shiftReq: {type: SubTable.multiple, columns: ['shiftReq1', 'shiftReq2', 'shiftReq3']},
      onThreshold: {
        type: SubTable.multiple,
        columns: ['onThreshold', 'onThreshold2', 'onThreshold3', 'onThreshold4', 'onThreshold5'],
      },
      threshold: {type: SubTable.multiple, columns: ['threshold', 'threshold2', 'threshold3', 'threshold4']},
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.statTo.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.pointsForChange.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.changePerPoint.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Stat>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list.map((item) => ({id: item.name, ...item})));
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    let {item} = await this.tablesService.openDialog<Stat>(formConfig, form, {stats: this.statsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const stats = item.stats as StatLink[];
    delete item.stats;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const record = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'name', item.name);
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      await this.databaseService.insert<Stat>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(item, stats, []);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return !record ? {id: item.name, value: item.name} : null;
  }

  public async updateItem(id: string): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'name', id);
    if (!record) {
      return null;
    }
    const list: StatLink[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE isactive = 1 and stat_id = ?`,
      [record.id],
    );
    const statsAll = [];
    for (const itm of list) {
      statsAll.push(itm.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const stats = item.stats as StatLink[];
    delete item.stats;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      await this.databaseService.insert<Stat>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(item, stats.map((s) => ({...s, id: undefined})), []);
    } else {
      await this.databaseService.update<Stat>(this.dbProfile, this.dbTable, item, 'name', record.name);
      await this.saveSubs(record, stats, statsAll);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: item.name, value: item.name};
  }

  public async updateItemId(id: number): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: StatLink[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE isactive = 1 and stat_id = ?`,
      [record.id],
    );
    const statsAll = [];
    for (const itm of list) {
      statsAll.push(itm.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const stats = item.stats as StatLink[];
    delete item.stats;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      await this.databaseService.insert<Stat>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(item, stats.map((s) => ({...s, id: undefined})), []);
    } else {
      await this.databaseService.update<Stat>(this.dbProfile, this.dbTable, item, 'name', record.name);
      await this.saveSubs(record, stats, statsAll);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: item.id, value: item.name};
  }

  private setDefaults(item: Stat): Stat {
    if (item.type !== statType.VITALITY && item.type !== statType.EXP) {
      item.maxstat = this.defaultValues.maxstat as string;
    }
    if (item.type !== statType.VITALITY) {
      // item.min = this.defaultValues.min as number;
      // item.max = this.defaultValues.max as number;
      // item.maxstat = this.defaultValues.maxstat as string;
      item.canExceedMax = this.defaultValues.canExceedMax as boolean;
      item.shiftTarget = this.defaultValues.shiftTarget as number;
      item.shiftValue = this.defaultValues.shiftValue as number;
      item.shiftReverseValue = this.defaultValues.shiftReverseValue as number;
      item.shiftInterval = this.defaultValues.shiftInterval as number;
      item.isShiftPercent = this.defaultValues.isShiftPercent as boolean;
      item.onMinHit = this.defaultValues.onMinHit as string;
      item.onMinHitEffect = this.defaultValues.onMinHitEffect as string;
      item.onMaxHit = this.defaultValues.onMaxHit as string;
      item.onMaxHitEffect = this.defaultValues.onMaxHitEffect as string;
      item.startPercent = this.defaultValues.startPercent as number;
      item.releaseResetPercent = this.defaultValues.releaseResetPercent as number;
      item.shiftReq1 = this.defaultValues.shiftReq1 as string;
      item.shiftReq1State = this.defaultValues.shiftReq1State as boolean;
      item.shiftReq1SetReverse = this.defaultValues.shiftReq1SetReverse as boolean;
      item.shiftReq2 = this.defaultValues.shiftReq2 as string;
      item.shiftReq2State = this.defaultValues.shiftReq2State as boolean;
      item.shiftReq2SetReverse = this.defaultValues.shiftReq2SetReverse as boolean;
      item.shiftReq3 = this.defaultValues.shiftReq3 as string;
      item.shiftReq3State = this.defaultValues.shiftReq3State as boolean;
      item.shiftReq3SetReverse = this.defaultValues.shiftReq3SetReverse as boolean;
      item.shiftModStat = '';
      item.onThreshold = '';
      item.onThreshold2 = '';
      item.onThreshold3 = '';
      item.onThreshold4 = '';
      item.onThreshold5 = '';
      item.threshold = -1;
      item.threshold2 = -1;
      item.threshold3 = -1;
      item.threshold4 = -1;
    }
    item.serverPresent = item.serverPresent ? item.serverPresent : false;
    item.sendToClient = item.sendToClient ? item.sendToClient : false;
    item.min = item.min ? item.min : 0;
    item.max = item.max ? item.max : 0;
    item.stat_precision = item.stat_precision ? item.stat_precision : 0;
    item.canExceedMax = item.canExceedMax ? item.canExceedMax : false;
    item.sharedWithGroup = item.sharedWithGroup ? item.sharedWithGroup : false;
    item.shiftTarget = item.shiftTarget ? item.shiftTarget : 0;
    item.isShiftPercent = item.isShiftPercent ? item.isShiftPercent : false;
    item.shiftReq1State = item.shiftReq1State ? item.shiftReq1State : false;
    item.shiftReq2State = item.shiftReq2State ? item.shiftReq2State : false;
    item.shiftReq3State = item.shiftReq3State ? item.shiftReq3State : false;
    item.shiftReq1SetReverse = item.shiftReq1SetReverse ? item.shiftReq1SetReverse : false;
    item.shiftReq2SetReverse = item.shiftReq2SetReverse ? item.shiftReq2SetReverse : false;
    item.shiftReq3SetReverse = item.shiftReq3SetReverse ? item.shiftReq3SetReverse : false;
    item.startPercent = item.startPercent ? item.startPercent : 50;
    item.deathResetPercent = item.deathResetPercent ? item.deathResetPercent : -1;
    item.releaseResetPercent = item.releaseResetPercent ? item.releaseResetPercent : -1;
    item.shiftModStat = item.shiftModStat ? item.shiftModStat : '';
    if (item.threshold < 0) {
      item.threshold = -1;
      item.onThreshold = '';
    }
    if (item.threshold2 < 0) {
      item.threshold2 = -1;
      item.onThreshold2 = '';
    }
    if (item.threshold3 < 0) {
      item.threshold3 = -1;
      item.onThreshold3 = '';
    }
    if (item.threshold4 < 0) {
      item.threshold4 = -1;
      item.onThreshold4 = '';
    }
    item.onThreshold = item.onThreshold ? 'effect:' + item.onThreshold : '';
    item.onThreshold2 = item.onThreshold2 ? 'effect:' + item.onThreshold2 : '';
    item.onThreshold3 = item.onThreshold3 ? 'effect:' + item.onThreshold3 : '';
    item.onThreshold4 = item.onThreshold4 ? 'effect:' + item.onThreshold4 : '';
    item.onThreshold5 = item.onThreshold5 ? 'effect:' + item.onThreshold5 : '';
    item.onMaxHit = item.onMaxHit ? item.onMaxHit : '';
    if (item.onMaxHit.indexOf('effect') !== -1 && item.onMaxHitEffect) {
      item.onMaxHit += ':' + item.onMaxHitEffect;
    }
    item.onMinHit = item.onMinHit ? item.onMinHit : '';
    if (item.onMinHit.indexOf('effect') !== -1 && item.onMinHitEffect) {
      item.onMinHit += ':' + item.onMinHitEffect;
    }
    // @ts-ignore
    delete item.onMaxHitEffect;
    // @ts-ignore
    delete item.onMinHitEffect;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    return item;
  }

  private async saveSubs(recordStat: Stat, stats: StatLink[], statsAll: number[] = []): Promise<void> {
    for (const item of stats) {
      item.isactive = true;
      item.stat_id = recordStat.id;
      item.stat = recordStat.name;
      if (item.id) {
        delete statsAll[statsAll.indexOf(item.id)];
        await this.databaseService.update<StatLink>(this.dbProfile, this.dbTableStats, item, 'id', item.id);
      } else {
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<StatLink>(this.dbProfile, this.dbTableStats, item, false);
      }
    }
    if (statsAll.length > 0) {
      for (const itemId of statsAll) {
        const removeItem = {isactive: false} as StatLink;
        await this.databaseService.update<StatLink>(this.dbProfile, this.dbTableStats, removeItem, 'id', itemId);
      }
    }
  }

  public async duplicateItem(id: number): Promise<string> {
    const baseRecord = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    record.name = record.name + '_1';
    delete record.id;
    const used = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'name', record.name);

    if (used) {
      this.notification.error(this.translate.instant('STATS.DUPLICATED_NAME'));
      return '';
    }
    const list: StatLink[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE isactive = 1 and stat_id = ?`,
      [baseRecord.id],
    );
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return '';
    }
    const stats = item.stats as StatLink[];
    delete item.stats;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Stat>(this.dbProfile, this.dbTable, item, false);
    item.id = newId;
    await this.saveSubs(item, stats, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return item.name;
  }

  private async prepareForm(record: Stat, list: StatLink[], updateMode = false): Promise<{item: Stat | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const itm of list) {
      (form.get('stats') as FormArray).push(
        this.subFormService.buildSubForm<Partial<StatLink>, any>(this.statsForm, itm),
      );
    }
    if (record.onMinHit && record.onMinHit.indexOf('effect') !== -1) {
      const minEffect = record.onMinHit.split(':');
      if (minEffect[1]) {
        record.onMinHitEffect = minEffect[1];
      }
      record.onMinHit = minEffect[0];
    }
    if (record.onMaxHit && record.onMaxHit.indexOf('effect') !== -1) {
      const maxEffect = record.onMaxHit.split(':');
      if (maxEffect[1]) {
        record.onMaxHitEffect = maxEffect[1];
      }
      record.onMaxHit = maxEffect[0];
    }
    if (record.onThreshold && record.onThreshold.indexOf('effect') !== -1) {
      record.onThreshold = record.onThreshold.split(':').pop() as string;
    }
    if (record.onThreshold2 && record.onThreshold2.indexOf('effect') !== -1) {
      record.onThreshold2 = record.onThreshold2.split(':').pop() as string;
    }
    if (record.onThreshold3 && record.onThreshold3.indexOf('effect') !== -1) {
      record.onThreshold3 = record.onThreshold3.split(':').pop() as string;
    }
    if (record.onThreshold4 && record.onThreshold4.indexOf('effect') !== -1) {
      record.onThreshold4 = record.onThreshold4.split(':').pop() as string;
    }
    if (record.onThreshold5 && record.onThreshold5.indexOf('effect') !== -1) {
      record.onThreshold5 = record.onThreshold5.split(':').pop() as string;
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Stat>(formConfig, form, {stats: this.statsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item: this.setDefaults(item), action};
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Stat>(this.dbProfile, this.dbTable, 'id', id);
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStats} WHERE isactive = 1 and stat_id = ?`,
      [id],
    );
    const stats = [];
    const thresholds = [];
    if (record.threshold >= 0) {
      let effect1 = null;
      if (record.onThreshold && record.onThreshold.indexOf('effect') !== -1) {
        record.onThreshold = record.onThreshold.split(':').pop() as string;
        effect1 = await this.dropdownItemsService.getEffect(Number(record.onThreshold));
      }
      if (effect1) {
        thresholds.push({threshold: '', onThreshold: effect1.value});
      }
    }
    if (record.threshold2 >= 0) {
      let effect2 = null;
      if (record.onThreshold2 && record.onThreshold2.indexOf('effect') !== -1) {
        record.onThreshold2 = record.onThreshold2.split(':').pop() as string;
        effect2 = await this.dropdownItemsService.getEffect(Number(record.onThreshold2));
      }
      if (effect2) {
        thresholds.push({threshold: record.threshold, onThreshold: effect2 ? effect2.value : record.onThreshold2});
      }
    }
    if (record.threshold3 >= 0) {
      let effect3 = null;
      if (record.onThreshold3 && record.onThreshold3.indexOf('effect') !== -1) {
        record.onThreshold3 = record.onThreshold3.split(':').pop() as string;
        effect3 = await this.dropdownItemsService.getEffect(Number(record.onThreshold3));
      }
      if (effect3) {
        thresholds.push({threshold: record.threshold2, onThreshold: effect3 ? effect3.value : record.onThreshold3});
      }
    }
    if (record.threshold4 >= 0) {
      let effect4 = null;
      if (record.onThreshold4 && record.onThreshold4.indexOf('effect') !== -1) {
        record.onThreshold4 = record.onThreshold4.split(':').pop() as string;
        effect4 = await this.dropdownItemsService.getEffect(Number(record.onThreshold4));
      }
      if (effect4) {
        thresholds.push({threshold: record.threshold3, onThreshold: effect4 ? effect4.value : record.onThreshold4});
      }
    }
    let effect5 = null;
    if (record.onThreshold5 && record.onThreshold5.indexOf('effect') !== -1) {
      record.onThreshold5 = record.onThreshold5.split(':').pop() as string;
      effect5 = await this.dropdownItemsService.getEffect(Number(record.onThreshold5));
    }
    if (effect5) {
      thresholds.push({threshold: record.threshold4, onThreshold: effect5 ? effect5.value : record.onThreshold5});
    }
    for (const item of list) {
      stats.push({
        statTo: item.statTo,
        pointsForChange: item.pointsForChange,
        changePerPoint: item.changePerPoint,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {thresholds, stats}},
    });
  }

  private updateFieldValidation(
    form: FormGroup,
    formConfig: FormConfig,
    value: number | string,
    currentField: string,
    nextField = '',
    prevField = '',
    onField = '',
  ): void {
    value = parseFloat(value as string);
    if (onField) {
      if (value < 0) {
        (form.get(onField) as AbstractControl).disable();
        formConfig.fields[onField].disabled = true;
        formConfig.fields[onField].allowNew = false;
      } else {
        (form.get(onField) as AbstractControl).enable();
        formConfig.fields[onField].disabled = false;
        formConfig.fields[onField].allowNew = true;
      }
    }
    let prevValue = -1;
    if (value >= 0 && prevField) {
      prevValue = parseFloat((form.get(prevField) as AbstractControl).value);
      if (prevValue < 0) {
        prevValue = -1;
        (form.get(prevField) as AbstractControl).setValidators([Validators.min(0), Validators.max(99.99)]);
        (form.get(prevField) as AbstractControl).updateValueAndValidity();
      } else {
        prevValue += 0.01;
      }
    }
    (form.get(currentField) as AbstractControl).setValidators([Validators.min(prevValue), Validators.max(99.99)]);
    (form.get(currentField) as AbstractControl).updateValueAndValidity();
    if (nextField && (form.get(nextField) as AbstractControl).value >= 0) {
      const minValue = value < 0 ? -1 : value + 0.01;
      (form.get(nextField) as AbstractControl).setValidators([Validators.min(minValue), Validators.max(99.99)]);
      (form.get(nextField) as AbstractControl).updateValueAndValidity();
    }
  }

  private createForm(formConfig: FormConfig): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      stat_function: '',
      sharedWithGroup: false,
      mob_base: [0, [Validators.min(0), Validators.required]],
      mob_level_increase: [0, [Validators.min(0), Validators.required]],
      mob_level_percent_increase: [0, [Validators.min(0), Validators.required]],
      min: [0, Validators.min(0)],
      max: [0, [Validators.min(0), Validators.max(2147483646)]],
      stat_precision: [0, Validators.min(0)],
      maxstat: -1,
      canExceedMax: false,
      shiftTarget: -1,
      shiftValue: 0,
      shiftReverseValue: 0,
      shiftInterval: [1, Validators.min(1)],
      isShiftPercent: false,
      shiftModStat: '',
      onMinHit: -1,
      onMinHitEffect: -1,
      onThreshold: '',
      threshold: [-1, [Validators.min(-1), Validators.max(100)]],
      onThreshold2: '',
      threshold2: [-1, [Validators.min(-1), Validators.max(100)]],
      onThreshold3: '',
      threshold3: [-1, [Validators.min(-1), Validators.max(100)]],
      onThreshold4: '',
      threshold4: [-1, [Validators.min(-1), Validators.max(100)]],
      onThreshold5: '',
      onMaxHit: -1,
      onMaxHitEffect: -1,
      startPercent: [0, Validators.min(0)],
      releaseResetPercent: [-1, Validators.min(-1)],
      shiftReq1: -1,
      shiftReq1State: false,
      shiftReq1SetReverse: false,
      shiftReq2: -1,
      shiftReq2State: false,
      shiftReq2SetReverse: false,
      shiftReq3: -1,
      shiftReq3State: false,
      shiftReq3SetReverse: false,
      serverPresent: false,
      sendToClient: false,

      stats: new FormArray([]),
    });
    form.patchValue(this.defaultValues, {emitEvent: false});
    (form.get('onMinHit') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      if (value && value.indexOf('effect') !== -1) {
        formConfig.fields.onMinHitEffect.width = 50;
      } else {
        formConfig.fields.onMinHitEffect.width = -1;
      }
    });
    (form.get('onMaxHit') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      if (value && value.indexOf('effect') !== -1) {
        formConfig.fields.onMaxHitEffect.width = 50;
      } else {
        formConfig.fields.onMaxHitEffect.width = -1;
      }
    });
    (form.get('threshold') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      this.updateFieldValidation(form, formConfig, value, 'threshold', 'threshold2', '', 'onThreshold');
    });
    (form.get('threshold2') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      this.updateFieldValidation(form, formConfig, value, 'threshold2', 'threshold3', 'threshold', 'onThreshold2');
    });
    (form.get('threshold3') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      this.updateFieldValidation(form, formConfig, value, 'threshold3', 'threshold4', 'threshold2', 'onThreshold3');
    });
    (form.get('threshold4') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      this.updateFieldValidation(form, formConfig, value, 'threshold4', '', 'threshold3', 'onThreshold4');
    });

    (form.get('sendToClient') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      if (value) {
        (form.get('serverPresent') as AbstractControl).patchValue(true);
      }
    });
    (form.get('serverPresent') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      if (!value) {
        (form.get('sendToClient') as AbstractControl).patchValue(false);
      }
    });

    (form.get('type') as AbstractControl).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
      if (value === statType.VITALITY) {
        (form.get('mob_base') as AbstractControl).enable();
        (form.get('mob_level_increase') as AbstractControl).enable();
        (form.get('mob_level_percent_increase') as AbstractControl).enable();
        (form.get('shiftValue') as AbstractControl).enable();
        (form.get('shiftReverseValue') as AbstractControl).enable();

        // (form.get('serverPresent') as AbstractControl).enable();
        if(['Health', 'Movement Speed'].includes((form.get('stat_function') as AbstractControl).value)){
          (form.get('serverPresent') as AbstractControl).patchValue(true);
          (form.get('serverPresent') as AbstractControl).disable();
        }else{
          (form.get('serverPresent') as AbstractControl).enable();
        }
        if(['Health', 'Movement Speed'].includes((form.get('stat_function') as AbstractControl).value)){
          (form.get('sendToClient') as AbstractControl).patchValue(true);
          (form.get('sendToClient') as AbstractControl).disable();
        }else{
          (form.get('sendToClient') as AbstractControl).enable();
        }
        formConfig.fields.stat_function.width = 33;
        formConfig.fields.sharedWithGroup.width = 33;
        formConfig.fields.title1.width = 100;
        formConfig.fields.title8.width = -1;
        formConfig.fields.stat_precision.width = 25;
        formConfig.fields.mob_base.width = 25;
        formConfig.fields.mob_level_increase.width = 25;
        formConfig.fields.mob_level_percent_increase.width = 25;
        (formConfig.subForms as TypeMap<string, SubFormType>).stats.hiddenSubForm = false;
        (form.get('shiftInterval') as AbstractControl).enable();
        (form.get('maxstat') as AbstractControl).enable();
        formConfig.fields.title2.label = this.translate.instant(this.tableKey + '.VITALITY');
        formConfig.fields.min.width = 25;
        formConfig.fields.max.width = -1;
        formConfig.fields.maxstat.width = 25;
        formConfig.fields.canExceedMax.width = 25;
        formConfig.fields.shiftTarget.width = 25;
        formConfig.fields.shiftValue.width = 25;
        formConfig.fields.shiftReverseValue.width = 25;
        formConfig.fields.shiftInterval.width = 25;
        formConfig.fields.isShiftPercent.width = 25;
        formConfig.fields.shiftModStat.width = 50;
        formConfig.fields.onMinHit.width = 50;
        if (
          (form.get('onMinHit') as AbstractControl).value &&
          (form.get('onMinHit') as AbstractControl).value.indexOf('effect') !== -1
        ) {
          formConfig.fields.onMinHitEffect.width = 50;
        } else {
          formConfig.fields.onMinHitEffect.width = -1;
        }
        formConfig.fields.onThreshold.width = 50;
        formConfig.fields.threshold.width = 50;
        formConfig.fields.onThreshold2.width = 50;
        formConfig.fields.threshold2.width = 50;
        formConfig.fields.onThreshold3.width = 50;
        formConfig.fields.threshold3.width = 50;
        formConfig.fields.onThreshold4.width = 50;
        formConfig.fields.threshold4.width = 50;
        formConfig.fields.onThreshold5.width = 50;
        formConfig.fields.onMaxHit.width = 50;
        if (
          (form.get('onMaxHit') as AbstractControl).value &&
          (form.get('onMaxHit') as AbstractControl).value.indexOf('effect') !== -1
        ) {
          formConfig.fields.onMaxHitEffect.width = 50;
        } else {
          formConfig.fields.onMaxHitEffect.width = -1;
        }
        formConfig.fields.startPercent.width = 50;
        formConfig.fields.releaseResetPercent.width = 50;
        formConfig.fields.shiftReq1.width = 33;
        formConfig.fields.shiftReq1State.width = 33;
        formConfig.fields.shiftReq1SetReverse.width = 33;
        formConfig.fields.shiftReq2.width = 33;
        formConfig.fields.shiftReq2State.width = 33;
        formConfig.fields.shiftReq2SetReverse.width = 33;
        formConfig.fields.shiftReq3.width = 33;
        formConfig.fields.shiftReq3State.width = 33;
        formConfig.fields.shiftReq3SetReverse.width = 33;
        (form.get('min') as AbstractControl).setValidators([Validators.required, Validators.min(0)]);
        (form.get('min') as AbstractControl).updateValueAndValidity();
        (form.get('maxstat') as AbstractControl).setValidators(Validators.required);
        (form.get('maxstat') as AbstractControl).updateValueAndValidity();
        (form.get('shiftTarget') as AbstractControl).setValidators(Validators.required);
        (form.get('shiftTarget') as AbstractControl).updateValueAndValidity();
        (form.get('shiftValue') as AbstractControl).setValidators(Validators.required);
        (form.get('shiftValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftReverseValue') as AbstractControl).setValidators(Validators.required);
        (form.get('shiftReverseValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftInterval') as AbstractControl).setValidators([Validators.required, Validators.min(1)]);
        (form.get('shiftInterval') as AbstractControl).updateValueAndValidity();
        this.updateFieldValidation(
          form,
          formConfig,
          (form.get('threshold') as AbstractControl).value,
          'threshold',
          'threshold2',
          '',
          'onThreshold',
        );
        this.updateFieldValidation(
          form,
          formConfig,
          (form.get('threshold2') as AbstractControl).value,
          'threshold2',
          'threshold3',
          'threshold',
          'onThreshold2',
        );
        this.updateFieldValidation(
          form,
          formConfig,
          (form.get('threshold3') as AbstractControl).value,
          'threshold3',
          'threshold4',
          'threshold2',
          'onThreshold3',
        );
        this.updateFieldValidation(
          form,
          formConfig,
          (form.get('threshold4') as AbstractControl).value,
          'threshold4',
          '',
          'threshold3',
          'onThreshold4',
        );
      } else if (value === statType.DMG_BASE) {
        (form.get('mob_base') as AbstractControl).disable();
        (form.get('mob_level_increase') as AbstractControl).disable();
        (form.get('mob_level_percent_increase') as AbstractControl).disable();
        (form.get('shiftValue') as AbstractControl).disable();
        (form.get('shiftReverseValue') as AbstractControl).disable();
        (form.get('shiftInterval') as AbstractControl).disable();
        (form.get('maxstat') as AbstractControl).disable();
        (form.get('stats') as FormArray).clear();
        (form.get('serverPresent') as AbstractControl).patchValue(true);
        (form.get('serverPresent') as AbstractControl).disable();
        if(['level', 'Movement Speed'].includes((form.get('stat_function') as AbstractControl).value)){
          (form.get('sendToClient') as AbstractControl).patchValue(true);
          (form.get('sendToClient') as AbstractControl).disable();
        }else{
          (form.get('sendToClient') as AbstractControl).enable();
        }
        (formConfig.subForms as TypeMap<string, SubFormType>).stats.hiddenSubForm = true;
        formConfig.fields.min.width = 50;
        formConfig.fields.max.width = 50;
        formConfig.fields.max.label = this.translate.instant(this.tableKey + '.MAX');
        formConfig.fields.max.tooltip = this.translate.instant(this.tableKey + '.MAX_BASE_HELP');
        formConfig.fields.stat_function.width = -1;
        formConfig.fields.sharedWithGroup.width = -1;
        formConfig.fields.title8.width = 50;
        formConfig.fields.title1.width = -1;
        formConfig.fields.stat_precision.width = -1;
        formConfig.fields.mob_base.width = -1;
        formConfig.fields.mob_level_increase.width = -1;
        formConfig.fields.mob_level_percent_increase.width = -1;
        formConfig.fields.title2.label = '';
        formConfig.fields.maxstat.width = -1;
        formConfig.fields.canExceedMax.width = -1;
        formConfig.fields.shiftTarget.width = -1;
        formConfig.fields.shiftValue.width = -1;
        formConfig.fields.shiftReverseValue.width = -1;
        formConfig.fields.shiftInterval.width = -1;
        formConfig.fields.isShiftPercent.width = -1;
        formConfig.fields.shiftModStat.width = -1;
        formConfig.fields.onThreshold.width = -1;
        formConfig.fields.threshold.width = -1;
        formConfig.fields.onThreshold2.width = -1;
        formConfig.fields.threshold2.width = -1;
        formConfig.fields.onThreshold3.width = -1;
        formConfig.fields.threshold3.width = -1;
        formConfig.fields.onThreshold4.width = -1;
        formConfig.fields.threshold4.width = -1;
        formConfig.fields.onThreshold5.width = -1;
        formConfig.fields.onMinHit.width = -1;
        formConfig.fields.onMinHitEffect.width = -1;
        formConfig.fields.onMaxHit.width = -1;
        formConfig.fields.onMaxHitEffect.width = -1;
        formConfig.fields.startPercent.width = -1;
        formConfig.fields.releaseResetPercent.width = -1;
        formConfig.fields.shiftReq1.width = -1;
        formConfig.fields.shiftReq1State.width = -1;
        formConfig.fields.shiftReq1SetReverse.width = -1;
        formConfig.fields.shiftReq2.width = -1;
        formConfig.fields.shiftReq2State.width = -1;
        formConfig.fields.shiftReq2SetReverse.width = -1;
        formConfig.fields.shiftReq3.width = -1;
        formConfig.fields.shiftReq3State.width = -1;
        formConfig.fields.shiftReq3SetReverse.width = -1;
        (form.get('min') as AbstractControl).setValidators(null);
        (form.get('min') as AbstractControl).updateValueAndValidity();
        (form.get('maxstat') as AbstractControl).setValidators(null);
        (form.get('shiftTarget') as AbstractControl).setValidators(null);
        (form.get('shiftValue') as AbstractControl).setValidators(null);
        (form.get('shiftReverseValue') as AbstractControl).setValidators(null);
        (form.get('shiftInterval') as AbstractControl).setValidators([Validators.min(1)]);
        (form.get('max') as AbstractControl).setValidators([Validators.max(2147483646)]);
        (form.get('max') as AbstractControl).updateValueAndValidity();
        (form.get('min') as AbstractControl).updateValueAndValidity();
        (form.get('maxstat') as AbstractControl).updateValueAndValidity();
        (form.get('shiftTarget') as AbstractControl).updateValueAndValidity();
        (form.get('shiftValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftReverseValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftInterval') as AbstractControl).updateValueAndValidity();
        this.updateFieldValidation(form, formConfig, -1, 'threshold', 'threshold2', '', 'onThreshold');
        this.updateFieldValidation(form, formConfig, -1, 'threshold2', 'threshold3', 'threshold', 'onThreshold2');
        this.updateFieldValidation(form, formConfig, -1, 'threshold3', 'threshold4', 'threshold2', 'onThreshold3');
        this.updateFieldValidation(form, formConfig, -1, 'threshold4', '', 'threshold3', 'onThreshold4');
      } else if (value === statType.EXP) {
        (form.get('stats') as FormArray).clear();
        (formConfig.subForms as TypeMap<string, SubFormType>).stats.hiddenSubForm = true;
        (form.get('shiftValue') as AbstractControl).disable();
        (form.get('shiftReverseValue') as AbstractControl).disable();
        (form.get('shiftInterval') as AbstractControl).disable();
        (form.get('maxstat') as AbstractControl).disable();
        (form.get('serverPresent') as AbstractControl).patchValue(true);
        (form.get('serverPresent') as AbstractControl).disable();
        formConfig.fields.min.width = -1;
        formConfig.fields.max.width = -1;
        formConfig.fields.stat_function.width = -1;
        formConfig.fields.sharedWithGroup.width = -1;
        formConfig.fields.title8.width = 50;
        formConfig.fields.title1.width = -1;
        formConfig.fields.stat_precision.width = -1;
        formConfig.fields.mob_base.width = -1;
        formConfig.fields.mob_level_increase.width = -1;
        formConfig.fields.mob_level_percent_increase.width = -1;

        formConfig.fields.maxstat.width = 50;
        formConfig.fields.canExceedMax.width = -1;
        formConfig.fields.shiftTarget.width = -1;
        formConfig.fields.shiftValue.width = -1;
        formConfig.fields.shiftReverseValue.width = -1;
        formConfig.fields.shiftInterval.width = -1;
        formConfig.fields.isShiftPercent.width = -1;
        formConfig.fields.shiftModStat.width = -1;
        formConfig.fields.onThreshold.width = -1;
        formConfig.fields.threshold.width = -1;
        formConfig.fields.onThreshold2.width = -1;
        formConfig.fields.threshold2.width = -1;
        formConfig.fields.onThreshold3.width = -1;
        formConfig.fields.threshold3.width = -1;
        formConfig.fields.onThreshold4.width = -1;
        formConfig.fields.threshold4.width = -1;
        formConfig.fields.onThreshold5.width = -1;
        formConfig.fields.onMinHit.width = -1;
        formConfig.fields.onMinHitEffect.width = -1;
        formConfig.fields.onMaxHit.width = -1;
        formConfig.fields.onMaxHitEffect.width = -1;
        formConfig.fields.startPercent.width = -1;
        formConfig.fields.releaseResetPercent.width = -1;
        formConfig.fields.shiftReq1.width = -1;
        formConfig.fields.shiftReq1State.width = -1;
        formConfig.fields.shiftReq1SetReverse.width = -1;
        formConfig.fields.shiftReq2.width = -1;
        formConfig.fields.shiftReq2State.width = -1;
        formConfig.fields.shiftReq2SetReverse.width = -1;
        formConfig.fields.shiftReq3.width = -1;
        formConfig.fields.shiftReq3State.width = -1;
        formConfig.fields.shiftReq3SetReverse.width = -1;
        (form.get('min') as AbstractControl).setValidators(null);
        (form.get('min') as AbstractControl).updateValueAndValidity();
        (form.get('mob_base') as AbstractControl).setValidators(null);
        (form.get('mob_level_increase') as AbstractControl).setValidators(null);
        (form.get('mob_level_percent_increase') as AbstractControl).setValidators(null);

        (form.get('maxstat') as AbstractControl).setValidators(Validators.required);
        (form.get('maxstat') as AbstractControl).updateValueAndValidity();
        (form.get('shiftTarget') as AbstractControl).setValidators(null);
        (form.get('shiftValue') as AbstractControl).setValidators(null);
        (form.get('shiftReverseValue') as AbstractControl).setValidators(null);
        (form.get('shiftInterval') as AbstractControl).setValidators([Validators.min(1)]);
        (form.get('shiftTarget') as AbstractControl).updateValueAndValidity();
        (form.get('shiftValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftReverseValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftInterval') as AbstractControl).updateValueAndValidity();
        this.updateFieldValidation(form, formConfig, -1, 'threshold', 'threshold2', '', 'onThreshold');
        this.updateFieldValidation(form, formConfig, -1, 'threshold2', 'threshold3', 'threshold', 'onThreshold2');
        this.updateFieldValidation(form, formConfig, -1, 'threshold3', 'threshold4', 'threshold2', 'onThreshold3');
        this.updateFieldValidation(form, formConfig, -1, 'threshold4', '', 'threshold3', 'onThreshold4');
      } else {
        (form.get('mob_base') as AbstractControl).enable();
        (form.get('mob_level_increase') as AbstractControl).enable();
        (form.get('mob_level_percent_increase') as AbstractControl).enable();
        (form.get('shiftValue') as AbstractControl).enable();
        (form.get('shiftReverseValue') as AbstractControl).enable();

        if(['Health', 'Movement Speed'].includes((form.get('stat_function') as AbstractControl).value)){
          (form.get('serverPresent') as AbstractControl).patchValue(true);
          (form.get('serverPresent') as AbstractControl).disable();
        }else{
          (form.get('serverPresent') as AbstractControl).enable();
        }
        if(['Health', 'Movement Speed'].includes((form.get('stat_function') as AbstractControl).value)){
          (form.get('sendToClient') as AbstractControl).patchValue(true);
          (form.get('sendToClient') as AbstractControl).disable();
        }else{
          (form.get('sendToClient') as AbstractControl).enable();
        }
        formConfig.fields.stat_function.width = 33;
        formConfig.fields.sharedWithGroup.width = 33;
        formConfig.fields.title1.width = 100;
        formConfig.fields.title8.width = -1;
        formConfig.fields.stat_precision.width = 25;
        formConfig.fields.mob_base.width = 25;
        formConfig.fields.mob_level_increase.width = 25;
        formConfig.fields.mob_level_percent_increase.width = 25;
        (formConfig.subForms as TypeMap<string, SubFormType>).stats.hiddenSubForm = false;
        (form.get('shiftInterval') as AbstractControl).disable();
        (form.get('maxstat') as AbstractControl).disable();
        formConfig.fields.title2.label = '';
        if (value === statType.BASE) {
          formConfig.fields.min.width = -1;
          formConfig.fields.max.width = 50;
          formConfig.fields.max.label = this.translate.instant(this.tableKey + '.MAX');
          formConfig.fields.max.tooltip = this.translate.instant(this.tableKey + '.MAX_BASE_HELP');
          (form.get('max') as AbstractControl).setValidators([Validators.max(2147483646)]);
          (form.get('max') as AbstractControl).updateValueAndValidity();
        } else {
          formConfig.fields.min.width = -1;
          formConfig.fields.max.width = -1;
        }
        formConfig.fields.maxstat.width = -1;
        formConfig.fields.canExceedMax.width = -1;
        formConfig.fields.shiftTarget.width = -1;
        formConfig.fields.shiftValue.width = -1;
        formConfig.fields.shiftReverseValue.width = -1;
        formConfig.fields.shiftInterval.width = -1;
        formConfig.fields.isShiftPercent.width = -1;
        formConfig.fields.shiftModStat.width = -1;
        formConfig.fields.onThreshold.width = -1;
        formConfig.fields.threshold.width = -1;
        formConfig.fields.onThreshold2.width = -1;
        formConfig.fields.threshold2.width = -1;
        formConfig.fields.onThreshold3.width = -1;
        formConfig.fields.threshold3.width = -1;
        formConfig.fields.onThreshold4.width = -1;
        formConfig.fields.threshold4.width = -1;
        formConfig.fields.onThreshold5.width = -1;
        formConfig.fields.onMinHit.width = -1;
        formConfig.fields.onMinHitEffect.width = -1;
        formConfig.fields.onMaxHit.width = -1;
        formConfig.fields.onMaxHitEffect.width = -1;
        formConfig.fields.startPercent.width = -1;
        formConfig.fields.releaseResetPercent.width = -1;
        formConfig.fields.shiftReq1.width = -1;
        formConfig.fields.shiftReq1State.width = -1;
        formConfig.fields.shiftReq1SetReverse.width = -1;
        formConfig.fields.shiftReq2.width = -1;
        formConfig.fields.shiftReq2State.width = -1;
        formConfig.fields.shiftReq2SetReverse.width = -1;
        formConfig.fields.shiftReq3.width = -1;
        formConfig.fields.shiftReq3State.width = -1;
        formConfig.fields.shiftReq3SetReverse.width = -1;
        (form.get('maxstat') as AbstractControl).setValidators(null);
        (form.get('shiftTarget') as AbstractControl).setValidators(null);
        (form.get('shiftValue') as AbstractControl).setValidators(null);
        (form.get('shiftReverseValue') as AbstractControl).setValidators(null);
        (form.get('shiftInterval') as AbstractControl).setValidators([Validators.min(1)]);
        (form.get('maxstat') as AbstractControl).updateValueAndValidity();
        (form.get('shiftTarget') as AbstractControl).updateValueAndValidity();
        (form.get('shiftValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftReverseValue') as AbstractControl).updateValueAndValidity();
        (form.get('shiftInterval') as AbstractControl).updateValueAndValidity();
        this.updateFieldValidation(form, formConfig, -1, 'threshold', 'threshold2', '', 'onThreshold');
        this.updateFieldValidation(form, formConfig, -1, 'threshold2', 'threshold3', 'threshold', 'onThreshold2');
        this.updateFieldValidation(form, formConfig, -1, 'threshold3', 'threshold4', 'threshold2', 'onThreshold3');
        this.updateFieldValidation(form, formConfig, -1, 'threshold4', '', 'threshold3', 'onThreshold4');
      }
    });
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('stats') as FormArray).clear();
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
