import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {
  ConfigTypes,
  DropdownValue,
  DynamicDropdownFieldConfig,
  FilterTypes,
  SubFieldType,
} from '../../models/configRow.interface';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldConfig,
  FormFieldType,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap,
  WhereQuery,
} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {DatabaseService} from '../../services/database.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  abilityFieldConfig,
  auctionHouseProfileFieldConfig,
  classFieldConfig,
  currencyFieldConfig,
  dialogueFieldConfig,
  factionFieldConfig,
  itemFieldConfig,
  merchantFieldConfig,
  questFieldConfig,
  raceFieldConfig,
  skillFieldConfig,
  statFieldConfig,
} from '../dropdown.config';
import {FactionsService} from '../factions/factions.service';
import {Requirements} from '../option-choices/option-choices.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {dialogueActionsRequirementsTable, dialogueActionsTable, dialogueTable} from '../tables.data';
import {actionTypes, Dialogue, DialogueAction, DialogueActionsRequirements} from './dialogue.data';

@Injectable({
  providedIn: 'root',
})
export class DialogueService {
  public tableKey = TabTypes.DIALOGUE;
  private readonly listStream = new BehaviorSubject<Dialogue[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = dialogueTable;
  public dbTableActions = dialogueActionsTable;
  public dbTableActionsRequirements = dialogueActionsRequirementsTable;
  private dialogueNotUsedFieldConfig: DynamicDropdownFieldConfig = {
    idField: 'id',
    valueField: 'name',
    profile: DataBaseType.world_content,
    table: dialogueTable,
    options: {where: {isactive: 1}},
  };
  public actionList: DropdownValue[] = [];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      text: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        useAsSearch: true,
      },
      openingDialogue: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      repeatable: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      prereqDialogue: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: dialogueFieldConfig,
        data: [],
      },
      prereqQuest: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: questFieldConfig,
        data: [],
      },
      prereqFaction: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
        data: [],
      },
      prereqFactionStance: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.factionsService.stancesList,
      },
      action: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
        relatedFieldData: {
          [actionTypes.Dialogue]: dialogueFieldConfig,
          [actionTypes.Quest]: questFieldConfig,
          [actionTypes.Ability]: abilityFieldConfig,
          [actionTypes.Repair]: null,
          [actionTypes.Merchant]: merchantFieldConfig,
          [actionTypes.GuildMerchant]: null,
          [actionTypes.Bank]: null,
          [actionTypes.Auction]: auctionHouseProfileFieldConfig,
          [actionTypes.Mail]: null,
          [actionTypes.GearModification]: null,
          [actionTypes.GuildWarehouse]: null,
          [actionTypes.QuestProgress]: questFieldConfig,
        },
      },
      actionID: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: undefined,
      },
      itemReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
      creationtimestamp: {
        type: ConfigTypes.date,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.date,
      },
      updatetimestamp: {
        type: ConfigTypes.date,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.date,
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {
      search: '',
      where: {},
      sort: {field: 'name', order: 'asc'},
      limit: {limit: 10, page: 0},
    },
  };
  private subFormFields: TypeMap<string, FormFieldConfig> = {
    id: {name: 'id', label: '', type: FormFieldType.hidden},
    dialogueID: {name: 'dialogueID', label: '', type: FormFieldType.hidden},
    actionOrder: {
      name: 'actionOrder',
      type: FormFieldType.integer,
      require: true,
      width: 33,
    },
    action: {
      name: 'action',
      label: this.translate.instant(this.tableKey + '.ACTION_TYPE'),
      tooltip: this.translate.instant(this.tableKey + '.ACTION_TYPE_HELP'),
      type: FormFieldType.dropdown,
      require: true,
      width: 33,
      data: [],
    },
    actionID: {
      name: 'actionID',
      type: FormFieldType.dynamicDropdown,
      require: false,
      allowNew: false,
      disabled: true,
      width: 33,
      label: ' ',
      conditionName: 'action',
      condition: {
        action: {
          [actionTypes.Dialogue]: {
            label: this.translate.instant('DIALOGUE.TITLE'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: this.dialogueNotUsedFieldConfig,
          },
          [actionTypes.Quest]: {
            label: this.translate.instant('QUESTS.TITLE'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: questFieldConfig,
          },
          [actionTypes.Ability]: {
            label: this.translate.instant('ABILITY.TITLE'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: abilityFieldConfig,
          },
          [actionTypes.Repair]: {
            label: ' ',
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.Merchant]: {
            label: this.translate.instant('DIALOGUE.MERCHANT'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: merchantFieldConfig,
          },
          [actionTypes.GuildMerchant]: {
            label: ' ',
            width: 33,
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.Bank]: {
            label: ' ',
            width: -1,
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.Auction]: {
            label: this.translate.instant('DIALOGUE.AUCTION'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: auctionHouseProfileFieldConfig,
          },
          [actionTypes.Mail]: {
            label: ' ',
            width: 33,
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.GearModification]: {
            label: ' ',
            width: 33,
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.GuildWarehouse]: {
            label: ' ',
            width: 33,
            disabled: true,
            require: false,
            allowNew: false,
            fieldConfig: null,
          },
          [actionTypes.QuestProgress]: {
            label: this.translate.instant('DIALOGUE.QUEST_PROGRESS'),
            width: 33,
            disabled: false,
            require: true,
            allowNew: true,
            fieldConfig: questFieldConfig,
          },
        },
      },
    },
    actionID_bank: {
      name: 'actionID_bank',
      type: FormFieldType.integer,
      require: false,
      disabled: true,
      width: -1,
      label: ' ',
      tooltip: ' ',
      conditionName: 'action',
      condition: {
        action: {
          [actionTypes.Dialogue]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Quest]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Ability]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Repair]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Merchant]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.GuildMerchant]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Bank]: {
            label: this.translate.instant('DIALOGUE.BANK'),
            tooltip: this.translate.instant('DIALOGUE.BANK_HELP'),
            width: 33,
            require: true,
            disabled: false,
          },
          [actionTypes.Auction]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.Mail]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.GearModification]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.GuildWarehouse]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
          [actionTypes.QuestProgress]: {
            label: ' ',
            tooltip: ' ',
            width: -1,
            require: false,
            disabled: true,
          },
        },
      },
    },
    text: {
      name: 'text',
      type: FormFieldType.input,
      width: 50,
      length: 255,
      require: true,
    },
    audioClip: {
      name: 'audioClip',
      type: FormFieldType.input,
      width: 50,
      length: 255,
    },
    reqOpenedQuest: {
      name: 'reqOpenedQuest',
      type: FormFieldType.dynamicDropdown,
      allowNew: true,
      width: 33,
      fieldConfig: questFieldConfig,
    },
    reqCompletedQuest: {
      name: 'reqCompletedQuest',
      type: FormFieldType.dynamicDropdown,
      allowNew: true,
      width: 33,
      fieldConfig: questFieldConfig,
    },
    excludingQuest: {
      name: 'excludingQuest',
      type: FormFieldType.dynamicDropdown,
      allowNew: true,
      width: 33,
      fieldConfig: questFieldConfig,
    },
    itemReq: {
      name: 'itemReq',
      type: FormFieldType.dynamicDropdown,
      allowNew: true,
      fieldConfig: itemFieldConfig,
      width: 25,
    },
    itemReqConsume: {
      name: 'itemReqConsume',
      type: FormFieldType.boolean,
      width: 25,
    },
    currency: {
      name: 'currency',
      type: FormFieldType.dynamicDropdown,
      allowNew: true,
      fieldConfig: currencyFieldConfig,
      width: 25,
    },
    currencyAmount: {
      name: 'currencyAmount',
      type: FormFieldType.integer,
      width: 25,
    },
  };
  private requirementsSubFormConfig: TypeMap<string, SubFormType> = {
    requirements: {
      title: this.translate.instant(this.tableKey + '.REQUIREMENTS'),
      submit: this.translate.instant(this.tableKey + '.ADD_REQUIREMENT'),
      columnWidth: 50,
      fields: {
        id: {name: 'id', label: '', type: FormFieldType.hidden},
        dialogue_action_id: {
          name: 'dialogue_action_id',
          label: '',
          type: FormFieldType.hidden,
        },
        editor_option_type_id: {
          name: 'editor_option_type_id',
          type: FormFieldType.dropdown,
          data: [],
          require: true,
          width: 33,
        },
        editor_option_choice_type_id: {
          name: 'editor_option_choice_type_id',
          type: FormFieldType.dynamicDropdown,
          width: 33,
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
          width: 33,
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
  };
  public subDialogueConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {},
    subForms: {
      actions: {
        title: this.translate.instant(this.tableKey + '.ACTION'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        columnWidth: 100,
        fields: this.subFormFields,
        subForms: this.requirementsSubFormConfig,
      },
    },
  };
  public dialogFormConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.fullDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {
        name: 'name',
        type: FormFieldType.input,
        require: true,
        length: 44,
        width: 50,
      },
      openingDialogue: {
        name: 'openingDialogue',
        type: FormFieldType.boolean,
        width: 25,
      },
      repeatable: {name: 'repeatable', type: FormFieldType.boolean, width: 25},
      prereqDialogue: {
        name: 'prereqDialogue',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: dialogueFieldConfig,
      },
      prereqQuest: {
        name: 'prereqQuest',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: questFieldConfig,
      },
      prereqFaction: {
        name: 'prereqFaction',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: factionFieldConfig,
      },
      prereqFactionStance: {
        name: 'prereqFactionStance',
        type: FormFieldType.dropdown,
        width: 25,
        require: true,
        data: this.factionsService.stancesList,
      },
      audioClip: {name: 'audioClip', type: FormFieldType.input, length: 255},
      text: {name: 'text', type: FormFieldType.textarea, require: true},
    },
  };
  public formConfig: FormConfig = {
    ...this.dialogFormConfig,
    subForms: {
      actions: {
        title: this.translate.instant(this.tableKey + '.ACTION'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        columnWidth: 100,
        fields: {
          ...this.subFormFields,
          id: {name: 'id', label: '', type: FormFieldType.hidden},
        },
        subForms: this.requirementsSubFormConfig,
      },
    },
  };
  private actionsForm: SubFieldType = {
    id: {value: '', required: false},
    dialogueID: {value: '', required: false},
    action: {value: '', required: true},
    actionID: {value: '', required: true},
    actionID_bank: {value: '', required: true, min: 0, max: 2147483647},
    actionOrder: {value: '', required: true},
    text: {value: '', required: true},
    audioClip: {value: '', required: false},
    reqOpenedQuest: {value: '', required: false},
    reqCompletedQuest: {value: '', required: false},
    excludingQuest: {value: '', required: false},
    itemReq: {value: '', required: false},
    itemReqConsume: {value: false, required: false},
    currency: {value: '', required: false},
    currencyAmount: {value: 0, required: false, min: 0},
    requirements: {isArray: true},
  };
  private requirementForm: SubFieldType = {
    id: {value: '', required: false},
    dialogue_action_id: {value: '', required: false},
    editor_option_type_id: {value: '', required: true},
    editor_option_choice_type_id: {value: '', required: true},
    required_value: {value: '', required: true, min: 1},
  };
  private destroyer = new Subject<void>();
  private subFormDestroyer = new Subject<void>();
  private filteredList: DropdownValue[] = [];
  public dialoguesList: DropdownValue[] = [];
  public questsList: DropdownValue[] = [];
  public factionsList: DropdownValue[] = [];
  public abilitiesList: DropdownValue[] = [];
  public merchantsList: DropdownValue[] = [];
  public currenciesList: DropdownValue[] = [];
  public auctionProfilesList: DropdownValue[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly factionsService: FactionsService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
    private readonly optionChoicesService: OptionChoicesService,
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
    this.dropdownItemsService.quests.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.prereqQuest.data = list;
      this.questsList = list;
    });
    this.dropdownItemsService.factions.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.prereqFaction.data = list;
      this.factionsList = list;
    });
    this.dropdownItemsService.dialogueNotUsed.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.filteredList = list;
      const fieldConfig = {...this.dialogueNotUsedFieldConfig};
      (fieldConfig.options as QueryParams).where = {isactive: 1};
      if (list.length > 0) {
        // @ts-ignore
        fieldConfig.options.where[` id IN (${this.filteredList.map((itm) => itm.id).join(', ')}) `] =
          'where_null_using';
      }
      (
        (this.formConfig.subForms as TypeMap<string, SubFormType>).actions.fields.actionID.condition as TypeMap<
          string,
          any
        >
      ).action[actionTypes.Dialogue].fieldConfig = fieldConfig;
      (this.subFormFields.actionID.condition as TypeMap<string, any>).action[actionTypes.Dialogue].fieldConfig =
        fieldConfig;
    });
    this.dropdownItemsService.dialogue.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.prereqDialogue.data = list;
      this.dialoguesList = list;
    });
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.abilitiesList = list;
    });
    this.dropdownItemsService.merchants.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.merchantsList = list;
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.currenciesList = list;
    });
    this.dropdownItemsService.auctionProfiles.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.auctionProfilesList = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    const requirementsFields = this.requirementsSubFormConfig.requirements.fields;
    requirementsFields.editor_option_type_id.data = await this.optionChoicesService.getOptionsByType('Requirement');
    this.actionList = await this.optionChoicesService.getOptionsByType('Dialogue Action', true);
    this.tableConfig.fields.action.data = this.actionList;
    this.subFormFields.action.data = this.actionList;
  }

  public async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getQuests();
    await this.dropdownItemsService.getFactions();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getMerchants();
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getAuctionProfiles();
    await this.getNotUsedDialogues();
  }

  public async getNotUsedDialogues(list: number[] = []): Promise<void> {
    await this.dropdownItemsService.getNotUsedDialogues(list);
    await this.dropdownItemsService.getDialogues();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    this.tableConfig.queryParams = queryParams;
    if (loadAll) {
      await this.getNotUsedDialogues();
    }
    const subFields: Record<string, SubQueryField> = {
      action: {
        type: SubTable.left_join,
        main: 'id',
        related: 'dialogueID',
        table: this.dbTableActions,
        where: {},
      },
      actionID: {
        type: SubTable.left_join,
        main: 'id',
        related: 'dialogueID',
        table: this.dbTableActions,
        where: {},
      },
      itemReq: {
        type: SubTable.left_join,
        main: 'id',
        related: 'dialogueID',
        table: this.dbTableActions,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.action.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.actionID.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.itemReq.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Dialogue>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(enableOpening = false): Promise<null | DropdownValue> {
    await this.getNotUsedDialogues();
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const form = this.createForm();
    if (enableOpening) {
      (form.get('openingDialogue') as AbstractControl).enable();
    } else {
      (form.get('openingDialogue') as AbstractControl).disable();
    }
    let {item} = await this.tablesService.openDialog<Dialogue>(this.formConfig, form, {
      actions: this.actionsForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const actions = item.actions as DialogueAction[];
    delete item.actions;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<Dialogue>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    await this.saveSubs(newId, actions);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<Dialogue | null> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<Dialogue>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const subActions: DialogueAction[] = await this.getDialogueActions(record.id as number);
    const dialogueList = subActions
      .filter((action) => action.action === actionTypes.Dialogue)
      .map((action) => action.actionID);
    await this.getNotUsedDialogues(dialogueList);
    const form = this.createForm();
    const actionsAll = [];
    const requirementsAll: Record<number, number[]> = [];
    form.patchValue(record);
    for (const action of subActions) {
      actionsAll.push(action.id as number);
      const requirements = await this.getActionRequirements(action.id as number);
      if (action.action === actionTypes.Bank) {
        action.actionID_bank = action.actionID;
        action.actionID = 0;
      }
      (form.get('actions') as FormArray).push(
        this.subFormService.buildSubForm<DialogueAction, DialogueActionsRequirements>(
          this.actionsForm,
          action,
          this.requirementForm,
          requirements,
        ),
      );
      requirementsAll[action.id as number] = requirements.map((requirement) => requirement.id) as number[];
    }
    (form.get('openingDialogue') as AbstractControl).disable();
    if (this.filteredList.filter((filteredItem) => filteredItem.id === id).length > 0) {
      (form.get('openingDialogue') as AbstractControl).enable();
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<Dialogue>(formConfig, form, {
      actions: this.actionsForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const actions = item.actions as DialogueAction[];
    delete item.actions;
    item = this.setDefaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      item.isactive = true;
      newId = await this.databaseService.insert<Dialogue>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, actions.map((a) => ({...a, id: undefined})));
    } else {
      await this.databaseService.update<Dialogue>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, actions, actionsAll, requirementsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return await this.databaseService.queryItem<Dialogue>(this.dbProfile, this.dbTable, 'id', newId);
  }

  private setDefaults(item: Dialogue): Dialogue {
    item.repeatable = item.repeatable || false;
    item.prereqDialogue = item.prereqDialogue || -1;
    item.prereqFaction = item.prereqFaction || -1;
    item.prereqQuest = item.prereqQuest || -1;
    item.openingDialogue = item.openingDialogue || false;
    item.audioClip = item.audioClip || '';
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private setSubDefault(id: number, item: DialogueAction): DialogueAction {
    item.dialogueID = id;
    item.reqOpenedQuest = item.reqOpenedQuest || 0;
    item.reqCompletedQuest = item.reqCompletedQuest || 0;
    item.excludingQuest = item.excludingQuest || 0;
    if (item.action === actionTypes.Bank) {
      item.actionID = item.actionID_bank as number;
    }
    delete item.actionID_bank;
    item.itemReq = item.itemReq || -1;
    item.itemReqConsume = item.itemReqConsume || false;
    item.currency = item.currency || -1;
    item.currencyAmount = item.currencyAmount || 0;
    item.actionOrder = item.actionOrder ?? 1;
    item.audioClip = item.audioClip ?? '';
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveSubs(
    id: number,
    actions: DialogueAction[] = [],
    actionsAll: number[] = [],
    requirementsAll: Record<number, number[]> = {},
  ): Promise<void> {
    for (let action of actions) {
      action = this.setSubDefault(id, action);
      const requirements = action.requirements as DialogueActionsRequirements[];
      delete action.requirements;
      delete action.canvasId;
      let actionId;
      if (action.id) {
        actionId = action.id;
        actionsAll.splice(actionsAll.indexOf(action.id), 1);
        await this.databaseService.update<DialogueAction>(this.dbProfile, this.dbTableActions, action, 'id', action.id);
      } else {
        delete action.id;
        action.isactive = true;
        action.creationtimestamp = this.databaseService.getTimestampNow();
        actionId = await this.databaseService.insert<DialogueAction>(
          this.dbProfile,
          this.dbTableActions,
          action,
          false,
        );
      }
      await this.saveSubSubs(actionId, requirements, requirementsAll[actionId] || []);
    }
    if (actionsAll.length > 0) {
      for (const actionId of actionsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableActions, 'id', actionId, false);
        await this.databaseService.customQuery(
          this.dbProfile,
          `DELETE FROM ${this.dbTableActionsRequirements} WHERE dialogue_action_id = ?`,
          [actionId],
          true,
        );
      }
    }
  }

  private async saveSubSubs(
    id: number,
    requirements: DialogueActionsRequirements[] = [],
    requirementsAll: number[] = [],
  ): Promise<void> {
    for (const requirement of requirements) {
      requirement.dialogue_action_id = id;
      requirement.required_value = requirement.required_value || 1;
      requirement.editor_option_choice_type_id = requirement.editor_option_choice_type_id || '';
      requirement.updatetimestamp = this.databaseService.getTimestampNow();
      if (requirement.id && requirement.id > 0) {
        if (requirementsAll.indexOf(requirement.id) !== -1) {
          requirementsAll.splice(requirementsAll.indexOf(requirement.id), 1);
        }
        await this.databaseService.update<DialogueActionsRequirements>(
          this.dbProfile,
          this.dbTableActionsRequirements,
          requirement,
          'id',
          requirement.id,
        );
      } else {
        requirement.isactive = true;
        requirement.creationtimestamp = this.databaseService.getTimestampNow();
        delete requirement.id;
        await this.databaseService.insert<DialogueActionsRequirements>(
          this.dbProfile,
          this.dbTableActionsRequirements,
          requirement,
          false,
        );
      }
    }
    if (requirementsAll.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableActionsRequirements} WHERE id IN (${requirementsAll.join(', ')})`,
        [],
        true,
      );
    }
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Dialogue>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const subActions: DialogueAction[] = await this.getDialogueActions(baseRecord.id as number);
    const dialogueList = subActions
      .filter((action) => action.action === actionTypes.Dialogue)
      .map((action) => action.actionID);
    await this.getNotUsedDialogues(dialogueList);
    const form = this.createForm();
    form.patchValue(record);
    for (const action of subActions) {
      const newAction = {...action};
      let requirements = await this.getActionRequirements(action.id as number);
      delete newAction.id;
      requirements = requirements.map((requirement) => ({
        ...requirement,
        ...{id: undefined},
      }));
      if (action.action === actionTypes.Bank) {
        newAction.actionID_bank = newAction.actionID;
        newAction.actionID = 0;
      }
      (form.get('actions') as FormArray).push(
        this.subFormService.buildSubForm<DialogueAction, DialogueActionsRequirements>(
          this.actionsForm,
          newAction,
          this.requirementForm,
          requirements,
        ),
      );
    }
    (form.get('openingDialogue') as AbstractControl).disable();
    if (this.filteredList.filter((filteredItem) => filteredItem.id === id).length > 0) {
      (form.get('openingDialogue') as AbstractControl).enable();
    }
    let {item} = await this.tablesService.openDialog<Dialogue>(this.formConfig, form, {
      actions: this.actionsForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const actions = item.actions as DialogueAction[];
    delete item.actions;
    item = this.setDefaults(item);
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Dialogue>(this.dbProfile, this.dbTable, item, false);
    this.resetForm(form);
    await this.saveSubs(newId, actions, [], []);
    this.tablesService.dialogRef = null;
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async handleSubItem(excludeList: number[], actions?: DialogueAction[]): Promise<DialogueAction[] | undefined> {
    await this.getNotUsedDialogues();
    const addMode = !!actions;
    const fieldConfig = Object.assign({}, this.dialogueNotUsedFieldConfig);
    const excluded = this.filteredList.filter((itm) => !excludeList.includes(itm.id as number));
    const options: Record<string, any> = {where: {isactive: 1}};
    if (excluded.length > 0) {
      options.where[` id IN (${excluded.map((itm) => itm.id).join(', ')}) `] = 'where_null_using';
    } else {
      options.where[' id IN (NULL) '] = 'where_null_using';
    }
    fieldConfig.options = options;
    (this.subDialogueConfig.subForms.actions.fields.actionID.condition as TypeMap<string, any>).action[
      actionTypes.Dialogue
    ].fieldConfig = fieldConfig;
    if (!addMode) {
      this.subDialogueConfig.title = this.translate.instant(this.tableKey + '.EDIT_DIALOGUE_ACTION');
    } else {
      this.subDialogueConfig.title = this.translate.instant(this.tableKey + '.ADD_DIALOGUE_ACTION');
    }
    this.subDialogueConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const form = this.createSubForm();

    const actionsForm = {
      ...this.actionsForm,
      ...{canvasId: {value: '', required: false}},
    };
    for (const action of actions) {
      const actionsRequirements = await this.getActionRequirements(action.id as number);
      if (action.action === actionTypes.Bank) {
        action.actionID_bank = action.actionID;
        action.actionID = 0;
      }
      (form.get('actions') as FormArray).push(
        this.subFormService.buildSubForm<DialogueAction, DialogueActionsRequirements>(
          actionsForm,
          action,
          this.requirementForm,
          actionsRequirements,
        ),
      );
    }
    let config = {...this.subDialogueConfig};
    if (actions.length > 0) {
      config = {
        ...config,
        subForms: {
          actions: {
            ...config.subForms.actions,
            minCount: 1,
          },
        },
      };
    }
    const {item: items} = await this.tablesService.openDialog<{
      actions: DialogueAction[];
    }>(config, form, {
      actions: actionsForm,
      requirements: this.requirementForm,
    });
    if (!items) {
      this.resetSubForm(form);
      this.tablesService.dialogRef = null;
      return;
    }
    const list = [];
    items.actions.forEach((item, index) => {
      if (!item.id) {
        item.id = new Date().getTime();
      }
      const requirements = item.requirements ? [...item.requirements] : [];
      delete item.requirements;
      item.requirements = [];
      for (const requirement of requirements) {
        if (!requirement.id) {
          requirement.id = -1;
        }
        requirement.dialogue_action_id = item.id;
        requirement.required_value = requirement.required_value || 1;
        requirement.editor_option_choice_type_id = requirement.editor_option_choice_type_id || '';
        item.requirements.push(requirement);
      }
      this.resetSubForm(form);
      this.tablesService.dialogRef = null;
      if (item.action === actionTypes.Bank) {
        item.actionID = item.actionID_bank as number;
      }
      delete item.actionID_bank;
      list.push(item);
    });
    return list;
  }

  public async getDialogue(id: number): Promise<Dialogue | undefined> {
    const dialogue = await this.dropdownItemsService.getDialogueById(id);
    if (!dialogue) {
      return undefined;
    }
    dialogue.actions = [];
    const actions = await this.getDialogueActions(dialogue.id as number);
    for (const action of actions) {
      action.requirements = await this.getActionRequirements(action.id as number);
      dialogue.actions.push(action);
    }
    return dialogue;
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

  public async updateDialogue(record: Dialogue, dialogs: number[] = []): Promise<Dialogue | null> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    await this.getNotUsedDialogues(dialogs);
    const fieldConfig: DynamicDropdownFieldConfig = {
      ...this.dialogueNotUsedFieldConfig,
    };
    ((fieldConfig.options as QueryParams).where as WhereQuery)[
      ` id IN (${this.filteredList.map((itm) => itm.id).join(', ')}) `
    ] = 'where_null_using';
    (
      (this.formConfig.subForms as TypeMap<string, SubFormType>).actions.fields.actionID.condition as TypeMap<
        string,
        any
      >
    ).action[actionTypes.Dialogue].fieldConfig = fieldConfig;
    const form = this.createForm();
    (form.get('openingDialogue') as AbstractControl).disable();
    form.patchValue(record);
    if (record.actions) {
      for (const action of record.actions) {
        if (action.action === actionTypes.Bank) {
          action.actionID_bank = action.actionID;
          action.actionID = 0;
        }
        (form.get('actions') as FormArray).push(
          this.subFormService.buildSubForm<DialogueAction, DialogueActionsRequirements>(
            this.actionsForm,
            action,
            this.requirementForm,
            action.requirements || [],
          ),
        );
      }
    }
    let {item} = await this.tablesService.openDialog<Dialogue>(this.formConfig, form, {
      actions: this.actionsForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const actions = item.actions as DialogueAction[];
    delete item.actions;
    item = this.setDefaults(item);
    item.id = record.id;
    item.actions = [];
    for (let action of actions) {
      if (!action.id) {
        action.id = new Date().getTime();
      }
      action = this.setSubDefault(item.id as number, action);
      const requirements = action.requirements ? [...action.requirements] : [];
      action.requirements = [];
      for (const requirement of requirements) {
        if (!requirement.id) {
          requirement.id = new Date().getTime();
        }
        requirement.dialogue_action_id = action.id;
        requirement.required_value = requirement.required_value || 1;
        requirement.editor_option_choice_type_id = requirement.editor_option_choice_type_id || '';
        action.requirements.push(requirement);
      }
      item.actions.push(action);
    }
    this.resetForm(form);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return item;
  }

  public async saveTreeDialogues(dialogues: Dialogue[]): Promise<void> {
    for (const dialogue of dialogues) {
      const savedActions = await this.getDialogueActions(dialogue.id as number);
      const requirementsAll: Record<number, number[]> = [];
      const actionsAll = savedActions.map((action) => action.id) as number[];
      for (const savedAction of savedActions) {
        const requirements = await this.getActionRequirements(savedAction.id as number);
        requirementsAll[savedAction.id as number] = requirements.map((requirement) => requirement.id) as number[];
      }
      let actions = dialogue.actions as DialogueAction[];
      delete dialogue.actions;
      actions = actions.map((action) => ({
        ...action,
        id: actionsAll.includes(action.id) ? action.id : undefined,
      }));
      const dialogueForSave = this.setDefaults(dialogue);
      await this.databaseService.update<Dialogue>(
        this.dbProfile,
        this.dbTable,
        dialogueForSave,
        'id',
        dialogueForSave.id as number,
      );
      await this.saveSubs(dialogue.id as number, actions, actionsAll, requirementsAll);
    }
    await this.getList(this.tableConfig.queryParams, true);
    return;
  }

  public async getDialogueActions(dialogueID: number): Promise<DialogueAction[]> {
    return await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableActions} WHERE isactive = 1 AND dialogueID =  ? ORDER BY actionOrder ASC`,
      [dialogueID],
    );
  }

  private async getActionRequirements(actionID: number): Promise<DialogueActionsRequirements[]> {
    return await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableActionsRequirements} WHERE isactive = 1 AND dialogue_action_id =  ? `,
      [actionID],
    );
  }

  private createSubForm(): FormGroup {
    return this.fb.group({
      actions: new FormArray([]),
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      openingDialogue: [false],
      repeatable: [false],
      prereqDialogue: [null],
      prereqQuest: [null],
      prereqFaction: [null],
      prereqFactionStance: [null, Validators.required],
      text: ['', Validators.required],
      audioClip: '',
      actions: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('actions') as FormArray).clear();
  }

  private resetSubForm(form: FormGroup): void {
    form.reset();
    (form.get('actions') as FormArray).clear();
    this.subFormDestroyer.next(void 0);
    this.subFormDestroyer.complete();
  }
}
