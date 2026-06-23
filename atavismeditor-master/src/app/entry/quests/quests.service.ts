import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
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
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {questItemsTable, questObjectivesTable, questRequirementTable, questsTable} from '../tables.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {Stat} from '../stat/stat.service';
import {Quest, QuestItem, QuestObjective, QuestRequirement} from './quests.data';
import {
  classFieldConfig,
  currencyFieldConfig,
  factionFieldConfig,
  itemFieldConfig,
  mobsFieldConfig,
  questFieldConfig,
  raceFieldConfig,
  skillFieldConfig,
  statFieldConfig,
  taskFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {Requirements} from '../option-choices/option-choices.data';

@Injectable({
  providedIn: 'root',
})
export class QuestsService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.QUESTS;
  private readonly listStream = new BehaviorSubject<Quest[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = questsTable;
  public dbTableRequirements = questRequirementTable;
  public dbTableObjectives = questObjectivesTable;
  public dbTableItems = questItemsTable;
  private itemsForm: SubFieldType = {
    id: {value: '', required: false},
    item: {value: '', required: true},
    count: {value: '', required: true, min: 1},
  };
  private requirementsForm: SubFieldType = {
    id: {value: '', required: false},
    editor_option_type_id: {value: '', required: true},
    editor_option_choice_type_id: {value: '', required: true},
    required_value: {value: '', required: true, min: 1},
  };
  private objectivesForm: SubFieldType = {
    id: {value: '', required: false},
    objectiveType: {value: '', required: true},
    target: {value: '', required: true},
    targetCount: {value: '', required: true, min: 0},
    targetText: {value: '', required: true},
  };
  public questsList: DropdownValue[] = [];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      objectiveText: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      progressText: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      completionText: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      faction: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        data: [],
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
      },
      level: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      chain: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      repeatable: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      deliveryItem1: {type: ConfigTypes.dropdown, visible: true, data: []},
      deliveryItem2: {type: ConfigTypes.dropdown, visible: true, data: []},
      deliveryItem3: {type: ConfigTypes.dropdown, visible: true, data: []},
      questPrereq: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        data: [],
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: questFieldConfig,
      },
      questStartedReq: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        data: [],
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: questFieldConfig,
      },
      experience: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      currency1: {type: ConfigTypes.dropdown, visible: true, data: []},
      currency1count: {type: ConfigTypes.numberType, visible: true},
      currency2: {type: ConfigTypes.dropdown, visible: true, data: []},
      currency2count: {type: ConfigTypes.numberType, visible: true},
      rep1: {type: ConfigTypes.dropdown, visible: true, data: []},
      rep1gain: {type: ConfigTypes.numberType, visible: true},
      rep2: {type: ConfigTypes.dropdown, visible: true, data: []},
      rep2gain: {type: ConfigTypes.numberType, visible: true},
      deliveryItem: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      currency: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      currencycount: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      item: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      count: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      rep: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
      },
      repgain: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
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
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.fullDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
      description: {name: 'description', type: FormFieldType.textarea, require: true, length: 2048, width: 50},
      objectiveText: {name: 'objectiveText', type: FormFieldType.textarea, require: true, length: 2048, width: 50},
      progressText: {name: 'progressText', type: FormFieldType.textarea, require: true, length: 2048, width: 50},
      completionText: {name: 'completionText', type: FormFieldType.textarea, require: true, length: 2048, width: 50},
      faction: {
        name: 'faction',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: factionFieldConfig,
      },
      level: {name: 'level', type: FormFieldType.integer, width: 25},
      chain: {name: 'chain', type: FormFieldType.input, width: 25, length: 64},
      repeatable: {name: 'repeatable', type: FormFieldType.boolean, width: 25},
      title1: {name: '', label: this.translate.instant(this.tableKey + '.ITEMS_GIVEN'), type: FormFieldType.title},
      deliveryItem1: {
        name: 'deliveryItem1',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 33,
        fieldConfig: itemFieldConfig,
      },
      deliveryItem2: {
        name: 'deliveryItem2',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 33,
        fieldConfig: itemFieldConfig,
      },
      deliveryItem3: {
        name: 'deliveryItem3',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 33,
        fieldConfig: itemFieldConfig,
      },
      title2: {name: '', label: this.translate.instant(this.tableKey + '.PREREQUISITES'), type: FormFieldType.title},
      questPrereq: {
        name: 'questPrereq',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        fieldConfig: questFieldConfig,
      },
      questStartedReq: {
        name: 'questStartedReq',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        fieldConfig: questFieldConfig,
      },
      title3: {name: '', label: this.translate.instant(this.tableKey + '.REWARDS'), type: FormFieldType.title},
      experience: {name: 'experience', type: FormFieldType.integer, require: true, width: 100},
      title4: {name: '', label: this.translate.instant(this.tableKey + '.CURRENCIES'), type: FormFieldType.title},
      currency1: {
        name: 'currency1',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: currencyFieldConfig,
      },
      currency1count: {name: 'currency1count', type: FormFieldType.integer, width: 25},
      currency2: {
        name: 'currency2',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: currencyFieldConfig,
      },
      currency2count: {name: 'currency2count', type: FormFieldType.integer, width: 25},
      title5: {name: '', label: this.translate.instant(this.tableKey + '.FACTIONS'), type: FormFieldType.title},
      rep1: {
        name: 'rep1',
        type: FormFieldType.dynamicDropdown,
        search: true,
        allowNew: true,
        width: 25,
        fieldConfig: factionFieldConfig,
      },
      rep1gain: {name: 'rep1gain', type: FormFieldType.integer, width: 25},
      rep2: {
        name: 'rep2',
        type: FormFieldType.dynamicDropdown,
        search: true,
        allowNew: true,
        width: 25,
        fieldConfig: factionFieldConfig,
      },
      rep2gain: {name: 'rep2gain', type: FormFieldType.integer, width: 25},
    },
    subForms: {
      requirements: {
        title: this.translate.instant(this.tableKey + '.REQUIREMENTS'),
        submit: this.translate.instant(this.tableKey + '.ADD_REQUIREMENT'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          editor_option_type_id: {
            name: 'editor_option_type_id',
            type: FormFieldType.dropdown,
            data: [],
            require: true,
            width: 100,
          },
          editor_option_choice_type_id: {
            name: 'editor_option_choice_type_id',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            require: true,
            disabled: true,
            allowNew: false,
            label: ' ',
            conditionName: 'editor_option_type_id',
            condition: {
              editor_option_type_id: {
                [Requirements.LEVEL]: {label: ' ', disabled: true},
                [Requirements.SKILL]: {
                  label: this.translate.instant(this.tableKey + '.SKILL'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: skillFieldConfig,
                },
                [Requirements.RACE]: {
                  label: this.translate.instant(this.tableKey + '.RACE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: raceFieldConfig,
                },
                [Requirements.CLASS]: {
                  label: this.translate.instant(this.tableKey + '.CLASS'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: classFieldConfig,
                },
                [Requirements.STAT]: {
                  label: this.translate.instant(this.tableKey + '.STAT'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: statFieldConfig,
                },
                [Requirements.GUILD_LEVEL]: {label: ' ', disabled: true},
              },
            },
          },
          required_value: {
            name: 'required_value',
            type: FormFieldType.integer,
            width: 50,
            require: true,
            disabled: true,
            conditionName: 'editor_option_type_id',
            condition: {
              editor_option_type_id: {
                [Requirements.LEVEL]: {disabled: false},
                [Requirements.SKILL]: {disabled: false},
                [Requirements.RACE]: {disabled: true},
                [Requirements.CLASS]: {disabled: true},
                [Requirements.STAT]: {disabled: false},
                [Requirements.GUILD_LEVEL]: {disabled: false},
              },
            },
          },
        },
      },
      objectives: {
        title: this.translate.instant(this.tableKey + '.OBJECTIVES'),
        submit: this.translate.instant(this.tableKey + '.ADD_OBJECTIVE'),
        columnWidth: 100,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          objectiveType: {
            name: 'objectiveType',
            type: FormFieldType.dropdown,
            data: [],
            require: true,
            search: true,
            width: 25,
          },
          target: {
            name: 'target',
            type: FormFieldType.dynamicDropdown,
            data: [],
            require: true,
            disabled: true,
            allowNew: false,
            width: 25,
            conditionName: 'objectiveType',
            condition: {
              objectiveType: {
                item: {
                  label: this.translate.instant(this.tableKey + '.TARGET'),
                  allowNew: true,
                  disabled: false,
                  fieldConfig: itemFieldConfig,
                },
                mob: {
                  label: this.translate.instant(this.tableKey + '.TARGET'),
                  allowNew: true,
                  disabled: false,
                  fieldConfig: mobsFieldConfig,
                },
                task: {
                  label: this.translate.instant(this.tableKey + '.TARGET'),
                  allowNew: true,
                  disabled: false,
                  fieldConfig: taskFieldConfig,
                },
                mobCategory: {
                  label: this.translate.instant(this.tableKey + '.TARGETS'),
                  allowNew: true,
                  disabled: false,
                  multiple: true,
                  fieldConfig: mobsFieldConfig,
                },
              },
            },
          },
          targetCount: {
            name: 'targetCount',
            type: FormFieldType.integer,
            require: true,
            width: 25,
          },
          targetText: {
            name: 'targetText',
            type: FormFieldType.input,
            require: true,
            length: 64,
            width: 25,
          },
        },
      },
      items: {
        title: this.translate.instant(this.tableKey + '.ITEMS'),
        submit: this.translate.instant(this.tableKey + '.ADD_ITEM'),
        columnWidth: 100,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          item: {
            name: 'item',
            width: 50,
            require: true,
            allowNew: true,
            type: FormFieldType.dynamicDropdown,
            fieldConfig: itemFieldConfig,
          },
          count: {
            name: 'count',
            type: FormFieldType.integer,
            require: true,
            width: 50,
          },
        },
      },
      chooseItems: {
        title: this.translate.instant(this.tableKey + '.CHOOSE_ITEMS'),
        submit: this.translate.instant(this.tableKey + '.ADD_CHOOSE_ITEM'),
        columnWidth: 100,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          item: {
            name: 'item',
            width: 50,
            require: true,
            allowNew: true,
            type: FormFieldType.dynamicDropdown,
            fieldConfig: itemFieldConfig,
          },
          count: {
            name: 'count',
            type: FormFieldType.integer,
            require: true,
            width: 50,
          },
        },
      },
    },
  };
  private defaultValues: Partial<Quest> = {
    repeatable: false,
    deliveryItem1: -1,
    deliveryItem2: -1,
    deliveryItem3: -1,
    questPrereq: -1,
    questStartedReq: -1,
    faction: -1,
    currency1: -1,
    currency2: -1,
    rep1: -1,
    rep2: -1,
    level: 1,
  };

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
    const subForm = this.formConfig.subForms as TypeMap<string, SubFormType>;
    const reqFields = (subForm.requirements.fields.editor_option_choice_type_id.condition as TypeMap<string, any>)
      .editor_option_type_id;
    const objectiveTypeFields = (subForm.objectives.fields.target.condition as TypeMap<string, any>).objectiveType;
    this.dropdownItemsService.stats.pipe(distinctPipe(this.destroyer)).subscribe((statList) => {
      reqFields[78].data = statList;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((skillsList) => {
      reqFields[75].data = skillsList;
    });
    this.dropdownItemsService.factions.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.faction.data = listing;
      this.tableConfig.fields.rep1.data = listing;
      this.tableConfig.fields.rep2.data = listing;
    });
    this.dropdownItemsService.items.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      objectiveTypeFields.item.data = listing;
      this.tableConfig.fields.deliveryItem1.data = listing;
      this.tableConfig.fields.deliveryItem2.data = listing;
      this.tableConfig.fields.deliveryItem3.data = listing;
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.currency.data = listing;
      this.tableConfig.fields.currency1.data = listing;
      this.tableConfig.fields.currency2.data = listing;
    });
    this.dropdownItemsService.mobs.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      objectiveTypeFields.mob.data = listing;
      objectiveTypeFields.mobCategory.data = listing;
    });
    this.dropdownItemsService.tasks.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      objectiveTypeFields.task.data = listing;
    });
    this.dropdownItemsService.quests.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.questsList = listing;
      this.tableConfig.fields.questPrereq.data = this.questsList;
      this.tableConfig.fields.questStartedReq.data = this.questsList;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    const requirementsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).requirements.fields;
    const optionChoiceIdConditions = (requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>)
      .editor_option_type_id;
    const objectivesFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).objectives.fields;
    requirementsFields.editor_option_type_id.data = await this.optionChoicesService.getOptionsByType('Requirement');
    optionChoiceIdConditions[76].data = await this.optionChoicesService.getOptionsByType('Race');
    optionChoiceIdConditions[77].data = await this.optionChoicesService.getOptionsByType('Class');
    objectivesFields.objectiveType.data = await this.optionChoicesService.getOptionsByType(
      'Quest Objective Type',
      true,
    );
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getSkills();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getFactions();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getMobs();
    await this.dropdownItemsService.getTasks();
    await this.dropdownItemsService.getQuests();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      await this.dropdownItemsService.getQuests();
    }
    const subFields: Record<string, SubQueryField> = {
      deliveryItem: {type: SubTable.multiple, columns: ['deliveryItem1', 'deliveryItem2', 'deliveryItem3']},
      currency: {type: SubTable.multiple, columns: ['currency1', 'currency2']},
      currencycount: {type: SubTable.multiple, columns: ['currency1count', 'currency2count']},
      item: {type: SubTable.left_join, main: 'id', related: 'quest_id', table: this.dbTableItems},
      count: {type: SubTable.left_join, main: 'id', related: 'quest_id', table: this.dbTableItems},
      rep: {type: SubTable.multiple, columns: ['rep1', 'rep2']},
      repgain: {type: SubTable.multiple, columns: ['rep1gain', 'rep2gain']},
    };
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
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const subForms = {
      requirements: this.requirementsForm,
      objectives: this.objectivesForm,
      items: this.itemsForm,
      chooseItems: this.itemsForm,
    };
    let {item} = await this.tablesService.openDialog<Quest>(formConfig, form, subForms);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const requirements = item.requirements as QuestRequirement[];
    const objectives = item.objectives as QuestObjective[];
    const items = item.items as QuestItem[];
    const chooseItems = item.chooseItems as QuestItem[];
    delete item.requirements;
    delete item.objectives;
    delete item.items;
    delete item.chooseItems;
    const newId = await this.databaseService.insert<Quest>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, requirements, objectives, items, chooseItems);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Quest>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const subs = await this.getSubs(record.id);
    const itemsAll = subs.items.map((subItem) => subItem.id as number);
    const objectivesAll = subs.objectives.map((subItem) => subItem.id as number);
    const requirementsAll = subs.requirements.map((subItem) => subItem.id as number);
    const {item, action} = await this.prepareForm(record, subs, true);
    if (!item) {
      return null;
    }
    const requirements = item.requirements as QuestRequirement[];
    const objectives = item.objectives as QuestObjective[];
    const items = item.items as QuestItem[];
    const chooseItems = item.chooseItems as QuestItem[];
    delete item.requirements;
    delete item.objectives;
    delete item.items;
    delete item.chooseItems;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Quest>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, requirements.map((r) => ({...r, id: undefined})), objectives.map((r) => ({...r, id: undefined})), items.map((r) => ({...r, id: undefined})), chooseItems.map((r) => ({...r, id: undefined})));
    } else {
      await this.databaseService.update<Quest>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(
        record.id,
        requirements,
        objectives,
        items,
        chooseItems,
        requirementsAll,
        objectivesAll,
        itemsAll,
      );
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  private setDefaults(item: Quest): Quest {
    item.category = 1;
    item.numGrades = 1;
    item.isactive = true;
    item.faction = (item.faction ? item.faction : this.defaultValues.faction) as number;
    item.deliveryItem1 = (item.deliveryItem1 ? item.deliveryItem1 : this.defaultValues.deliveryItem1) as number;
    item.deliveryItem2 = (item.deliveryItem2 ? item.deliveryItem2 : this.defaultValues.deliveryItem2) as number;
    item.deliveryItem3 = (item.deliveryItem3 ? item.deliveryItem3 : this.defaultValues.deliveryItem3) as number;
    item.currency1count = item.currency1count ? item.currency1count : 1;
    item.currency2count = item.currency2count ? item.currency2count : 1;
    item.rep1gain = item.rep1gain ? item.rep1gain : 0;
    item.rep2gain = item.rep2gain ? item.rep2gain : 0;
    item.currency1 = item.currency1 ? item.currency1 : -1;
    item.currency2 = item.currency2 ? item.currency2 : -1;
    item.rep1 = item.rep1 ? item.rep1 : -1;
    item.rep2 = item.rep2 ? item.rep2 : -1;
    item.level = item.level ? item.level : 1;
    item.questPrereq = (item.questPrereq ? item.questPrereq : this.defaultValues.questPrereq) as number;
    item.questStartedReq = (item.questStartedReq ? item.questStartedReq : this.defaultValues.questStartedReq) as number;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Quest>(this.dbProfile, this.dbTable, 'id', id);
    const subs = await this.getSubs(baseRecord.id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    const allObjectives = subs.objectives.map((subItem) => ({...subItem, ...{id: undefined}}));
    const allRequirements = subs.requirements.map((subItem) => ({...subItem, ...{id: undefined}}));
    const allItems = subs.items.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, {
      objectives: allObjectives,
      requirements: allRequirements,
      items: allItems,
    });
    if (!item) {
      return 0;
    }
    const requirements = item.requirements as QuestRequirement[];
    const objectives = item.objectives as QuestObjective[];
    const items = item.items as QuestItem[];
    const chooseItems = item.chooseItems as QuestItem[];
    delete item.requirements;
    delete item.objectives;
    delete item.items;
    delete item.chooseItems;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Quest>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, requirements, objectives, items, chooseItems);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(
    record: Quest,
    subs: {requirements: QuestRequirement[]; objectives: QuestObjective[]; items: QuestItem[]},
    updateMode = false,
  ): Promise<{item: Quest | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const requirement of subs.requirements) {
      if (requirement.editor_option_type_id !== 78) {
        requirement.editor_option_choice_type_id = parseFloat(requirement.editor_option_choice_type_id as string);
      }
      (form.get('requirements') as FormArray).push(
        this.subFormService.buildSubForm(this.requirementsForm, requirement),
      );
    }
    for (const listItem of subs.items) {
      if (listItem.choose) {
        (form.get('chooseItems') as FormArray).push(this.subFormService.buildSubForm(this.itemsForm, listItem));
      } else {
        (form.get('items') as FormArray).push(this.subFormService.buildSubForm(this.itemsForm, listItem));
      }
    }
    for (const objective of subs.objectives) {
      const subForm = new FormGroup({});
      Object.keys(this.objectivesForm).forEach((key) => {
        const validators = [];
        if (this.objectivesForm[key].required) {
          validators.push(Validators.required);
        }
        if (this.objectivesForm[key].min !== undefined) {
          validators.push(Validators.min(this.objectivesForm[key].min as number));
        }
        if (objective.objectiveType === 'mobCategory' && key === 'target') {
          const targets = objective.targets;
          subForm.addControl(key, new FormControl(targets, validators));
        } else {
          subForm.addControl(key, new FormControl(objective[key as keyof QuestObjective], validators));
        }
      });
      (form.get('objectives') as FormArray).push(subForm);
    }
    form.patchValue(record);
    const subForms = {
      requirements: this.requirementsForm,
      objectives: this.objectivesForm,
      items: this.itemsForm,
      chooseItems: this.itemsForm,
    };
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Quest>(formConfig, form, subForms);
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
    const record = await this.databaseService.queryItem<Quest>(this.dbProfile, this.dbTable, 'id', id);
    const requirements = [];
    const objectives = [];
    const items = [];
    const choose_items = [];
    const subForms = this.formConfig.subForms as TypeMap<string, SubFormType>;
    const requirementsFields = subForms.requirements.fields;
    const optionChoiceIdConds = (requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>)
      .editor_option_type_id;
    const objectiveTypeFields = (subForms.objectives.fields.target.condition as TypeMap<string, any>).objectiveType;
    const subs = await this.getSubs(record.id);
    for (const item of subs.requirements) {
      const itm = (requirementsFields.editor_option_type_id.data as DropdownValue[]).find(
        (it) => it.id === item.editor_option_type_id,
      );
      let item2 = null;
      if ([75, 76, 77, 78].includes(item.editor_option_type_id)) {
        item2 = optionChoiceIdConds[item.editor_option_type_id].data.find(
          (it: DropdownValue) =>
            parseFloat(it.id as string) === parseFloat(item.editor_option_choice_type_id as string),
        );
      }
      requirements.push({
        editor_option_type_id: itm ? itm.value : item.editor_option_type_id,
        choice_type_id: item2 ? item2.value : item.editor_option_choice_type_id,
        required_value: +item.required_value,
      });
    }
    for (const item of subs.objectives) {
      let target: string | number = item.target;
      if (item.objectiveType !== 'mobCategory') {
        const itm = objectiveTypeFields[item.objectiveType].data.find((itms: any) => itms.id === item.target);
        target = itm ? itm.value : target;
      } else if (item.objectiveType === 'mobCategory') {
        const targets = [];
        for (const targ of item.targets.split(';')) {
          const itm = objectiveTypeFields.mobCategory.data.find((itms: any) => itms.id === +targ);
          targets.push(itm ? itm.value : targ);
        }
        target = targets.join(', ');
      }
      objectives.push({objectiveType: item.objectiveType, target, count: +item.targetCount, text: item.targetText});
    }
    for (const item of subs.items) {
      const subItem = await this.dropdownItemsService.getItem(item.item);
      if (item.choose) {
        choose_items.push({
          item: subItem ? subItem.value : item.item,
          count: item.count,
        });
      } else {
        items.push({
          item: subItem ? subItem.value : item.item,
          count: item.count,
        });
      }
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {requirements, objectives, items, choose_items}},
    });
  }

  private async getSubs(
    id: number,
  ): Promise<{requirements: QuestRequirement[]; objectives: QuestObjective[]; items: QuestItem[]}> {
    const requirements: QuestRequirement[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and quest_id = ?`,
      [id],
    );
    const objectives: QuestObjective[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableObjectives} WHERE isactive = 1 and questID = ?`,
      [id],
    );
    const items: QuestItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE quest_id = ?`,
      [id],
    );
    return {requirements, objectives, items};
  }

  private async saveSubs(
    recordId: number,

    requirements: QuestRequirement[],
    objectives: QuestObjective[],
    items: QuestItem[],
    chooseItems: QuestItem[],

    requirementsAll: number[] = [],
    objectivesAll: number[] = [],
    itemsAll: number[] = [],
  ): Promise<void> {
    if (objectivesAll.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableObjectives} WHERE id IN (${objectivesAll.join(', ')})`,
        [],
        true,
      );
    }
    if (itemsAll.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableItems} WHERE id IN (${itemsAll.join(', ')})`,
        [],
        true,
      );
    }
    for (const item of requirements) {
      item.isactive = true;
      item.quest_id = recordId;
      item.required_value = item.required_value ? item.required_value : 1;
      item.editor_option_choice_type_id = item.editor_option_choice_type_id ? item.editor_option_choice_type_id : '';
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        if (requirementsAll.indexOf(item.id) !== -1) {
          requirementsAll.splice(requirementsAll.indexOf(item.id), 1);
        }
        await this.databaseService.update<QuestRequirement>(
          this.dbProfile,
          this.dbTableRequirements,
          item,
          'id',
          item.id,
        );
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<QuestRequirement>(this.dbProfile, this.dbTableRequirements, item, false);
      }
    }
    for (const item of objectives) {
      item.isactive = true;
      item.questID = recordId;
      item.target = item.target ? item.target : -1;
      item.primaryObjective = item.primaryObjective ?? true;
      item.targetCount = item.targetCount ?? 1;
      item.targetText = item.targetText ? item.targetText : '';
      item.targets = item.targets ? item.targets : '';
      if (item.objectiveType === 'mobCategory') {
        item.targets = item.target.toString();
        item.target = -1;
      }
      item.updatetimestamp = this.databaseService.getTimestampNow();
      item.creationtimestamp = this.databaseService.getTimestampNow();
      delete item.id;
      await this.databaseService.insert<QuestObjective>(this.dbProfile, this.dbTableObjectives, item, false);
    }
    for (const item of items) {
      item.quest_id = recordId;
      item.choose = false;
      item.rewardLevel = 0;
      delete item.id;
      await this.databaseService.insert<QuestItem>(this.dbProfile, this.dbTableItems, item, false);
    }
    for (const item of chooseItems) {
      item.quest_id = recordId;
      item.choose = true;
      item.rewardLevel = 0;
      delete item.id;
      await this.databaseService.insert<QuestItem>(this.dbProfile, this.dbTableItems, item, false);
    }
    if (requirementsAll.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableRequirements} WHERE id IN (${requirementsAll.join(', ')})`,
        [],
        true,
      );
    }
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      objectiveText: ['', Validators.required],
      progressText: ['', Validators.required],
      completionText: ['', Validators.required],
      faction: [''],
      level: [1, [Validators.required, Validators.min(1)]],
      chain: '',
      repeatable: false,
      deliveryItem1: -1,
      deliveryItem2: -1,
      deliveryItem3: -1,
      questPrereq: -1,
      questStartedReq: -1,
      experience: ['', [Validators.required, Validators.min(0)]],
      currency1: -1,
      currency1count: [1, [Validators.min(1)]],
      currency2: -1,
      currency2count: [1, [Validators.min(1)]],
      rep1: -1,
      rep1gain: null,
      rep2: -1,
      rep2gain: null,
      items: new FormArray([]),
      chooseItems: new FormArray([]),
      requirements: new FormArray([]),
      objectives: new FormArray([]),
    });
    form.patchValue(this.defaultValues);
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('requirements') as FormArray).clear();
    (form.get('objectives') as FormArray).clear();
    (form.get('items') as FormArray).clear();
    (form.get('chooseItems') as FormArray).clear();
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
