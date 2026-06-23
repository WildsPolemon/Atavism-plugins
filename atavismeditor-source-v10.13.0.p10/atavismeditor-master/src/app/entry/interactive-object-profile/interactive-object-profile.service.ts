import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams, SubFormType,
  TableConfig, TypeMap,
  WhereQuery
} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {interactiveObjectProfileCoordEffectsTable, interactiveObjectProfileTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {
  currencyFieldConfig,
  effectFieldConfig,
  instanceAllFieldConfig,
  interactiveObjectInteractionTypeFieldConfig, itemFieldConfig,
  questFieldConfig,
  taskFieldConfig
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {ImageService} from '../../components/image/image.service';
import {MerchantItem} from '../merchant/merchant.service';
import {MobStat} from '../mobs/mobs.data';
import {SubFormService} from '../sub-form.service';
import {SkillProfileLevel} from '../skill-profiles/skill-profiles.service';

export interface InteractiveObjectProfileSettings {
  id?: number;
  name: string;
  gameObject: string;
  interactionType: string;
  interactionID: number;
  interactionData1: string;
  interactionData2: string;
  interactionData3: string;
  questReqID: number;
  interactTimeReq: number;
  coordEffect: string;
  respawnTime: number;
  despawnDelay: number;
  despawnTime: number;
  makeBusy: boolean;
  useLimit: number;
  minLevel: number;
  maxLevel: number;
  itemReq: number;
  itemCountReq: number;
  itemReqGet: boolean;
  currencyReq: number;
  currencyCountReq: number;
  currencyReqGet: boolean;
  interactDistance: number;
  isactive: boolean;
  icon: string;
  icon2: string;
  creationtimestamp: string;
  updatetimestamp: string;
  coordEffects?: InteractiveObjectCoordEffects[];
}

export interface InteractiveObjectCoordEffects {
  id?: number;
  objId: number;
  coordEffect: string;
  order: number;
}



export enum InteractiveObjectInteractionTypes {
  ApplyEffect = 'ApplyEffect',
  PlayCoordEffect = 'PlayCoordEffect',
  StartQuest = 'StartQuest',
  CompleteTask = 'CompleteTask',
  InstancePortal = 'InstancePortal',
  // PvP='PvP',
  // Sanctuary='Sanctuary',
  LeaveInstance = 'LeaveInstance',
  // CraftingStation = 'CraftingStation',
}


@Injectable({
  providedIn: 'root',
})
export class InteractiveObjectProfileService {
  public tableKey = TabTypes.INTERACTIVE_OBJECT_PROFILE;
  private readonly listStream = new BehaviorSubject<InteractiveObjectProfileSettings[]>([]);
  public list = this.listStream.asObservable();
  private formDestroyer = new Subject<void>();
  private profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = interactiveObjectProfileTable;
  public dbTableCoordEffects = interactiveObjectProfileCoordEffectsTable;
  private readonly coordEffectsForm = {
    coordEffect: {value: '', required: true},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      gameObject: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      interactionType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: interactiveObjectInteractionTypeFieldConfig,
        filterVisible: true,
        data: [],
      },
      quest: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: questFieldConfig,
        data: [],
      },
      respawnTime: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      currencyReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      currencyReqGet: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
      },
      currencyCountReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      itemReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      itemReqGet: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data:  this.dropdownItemsService.isActiveOptions,
      },
      itemCountReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
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
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64},
      title1: {name: '', label: this.translate.instant(this.tableKey + '.REQUIREMENTS'), type: FormFieldType.title},
      questReqID: {
        name: 'questReqID',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: questFieldConfig,
        allowNew: true,
        width: 33,
      },
      minLevel: {name: 'minLevel', type: FormFieldType.integer, width: 33},
      maxLevel: {name: 'maxLevel', type: FormFieldType.integer, width: 33},
      itemReq: {
        name: 'itemReq',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
        width: 20,
        allowNew: true,
      },
      itemCountReq: {name: 'itemCountReq', type: FormFieldType.integer, width: 15},
      itemReqGet: {name: 'itemReqGet', type: FormFieldType.boolean, width: 15},
      currencyReq: {
        name: 'currencyReq',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
        width: 20,
        allowNew: true,
      },
      currencyCountReq: {name: 'currencyCountReq', type: FormFieldType.integer, width: 15},
      currencyReqGet: {name: 'currencyReqGet', type: FormFieldType.boolean, width: 15},
      title2: {name: '', label: this.translate.instant(this.tableKey + '.SETTINGS'), type: FormFieldType.title},
      gameObject: {
        name: 'gameObject',
        type: FormFieldType.file,
        acceptFolder: '/',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 256,
        require: true,
        width: 100,
      },
      coordEffect: {
        name: 'coordEffect',
        type: FormFieldType.file,
        acceptFolder: '/',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        },
      icon: {name: 'icon', order: 1, type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 100},
      makeBusy: {name: 'makeBusy', type: FormFieldType.boolean, width: 33},
      interactTimeReq: {name: 'interactTimeReq', type: FormFieldType.integer, require: true, width: 33},
      interactDistance: {name: 'interactDistance', type: FormFieldType.integer, require: true, width: 33},
      respawnTime: {name: 'respawnTime', type: FormFieldType.integer, require: true, width: 25},
      despawnDelay: {name: 'despawnDelay', type: FormFieldType.integer, require: true, width: 25},
      despawnTime: {name: 'despawnTime', type: FormFieldType.integer, require: true, width: 25},
      useLimit: {name: 'useLimit', type: FormFieldType.integer, width: 25},

      interactionType: {
        name: 'interactionType',
        type: FormFieldType.dropdown,
        fieldConfig: interactiveObjectInteractionTypeFieldConfig,
        require: true,
        data: [],
        width: 50,
      },
      interactionID: {
        name: 'interactionID',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        require: false,
        disabled: true,
        width: -1,
        label: ' ',
        tooltip: ' ',
        conditionName: 'interactionType',
        condition: {
          interactionType: {
            [InteractiveObjectInteractionTypes.ApplyEffect]: {
              label: this.translate.instant(this.tableKey + '.EFFECT'),
              tooltip: this.translate.instant(this.tableKey + '.EFFECT_HELP'),
              require: true,
              fieldConfig: effectFieldConfig,
              disabled: false,
              width: 50,
            },
            [InteractiveObjectInteractionTypes.PlayCoordEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.StartQuest]: {
              label: this.translate.instant(this.tableKey + '.QUEST'),
              tooltip: this.translate.instant(this.tableKey + '.QUEST_HELP'),
              require: true,
              fieldConfig: questFieldConfig,
              disabled: false,
              width: 50,
            },
            [InteractiveObjectInteractionTypes.CompleteTask]: {
              label: this.translate.instant(this.tableKey + '.TASK'),
              tooltip: this.translate.instant(this.tableKey + '.TASK_HELP'),
              require: true,
              fieldConfig: taskFieldConfig,
              disabled: false,
              width: 50,
            },
            [InteractiveObjectInteractionTypes.InstancePortal]: {
              label: this.translate.instant(this.tableKey + '.INSTANCE'),
              tooltip: this.translate.instant(this.tableKey + '.INSTANCE_HELP'),
              require: true,
              fieldConfig: instanceAllFieldConfig,
              disabled: false,
              width: 50,
            },
            // [InteractiveObjectInteractionTypes.PvP]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            // [InteractiveObjectInteractionTypes.Sanctuary]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            [InteractiveObjectInteractionTypes.LeaveInstance]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              width: -1,
            },
            // [InteractiveObjectInteractionTypes.CraftingStation]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
          },
        },
      },
      interactionData1: {
        name: 'interactionData1',
        type: FormFieldType.input,
        require: false,
        disabled: true,
        width: -1,
        label: ' ',
        tooltip: ' ',
        conditionName: 'interactionType',
        condition: {
          interactionType: {
            [InteractiveObjectInteractionTypes.ApplyEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.PlayCoordEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.StartQuest]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.CompleteTask]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.InstancePortal]: {
              label: this.translate.instant(this.tableKey + '.POSITION_X'),
              tooltip: this.translate.instant(this.tableKey + '.POSITION_X_HELP'),
              require: true,
              fieldConfig: instanceAllFieldConfig,
              disabled: false,
              width: 33,
            },
            // [InteractiveObjectInteractionTypes.PvP]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            // [InteractiveObjectInteractionTypes.Sanctuary]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            [InteractiveObjectInteractionTypes.LeaveInstance]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              width: -1,
            },
            // [InteractiveObjectInteractionTypes.CraftingStation]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
          },
        },
      },
      interactionData2: {
        name: 'interactionData2',
        type: FormFieldType.input,
        require: false,
        disabled: true,
        width: -1,
        label: ' ',
        tooltip: ' ',
        conditionName: 'interactionType',
        condition: {
          interactionType: {
            [InteractiveObjectInteractionTypes.ApplyEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.PlayCoordEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.StartQuest]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.CompleteTask]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.InstancePortal]: {
              label: this.translate.instant(this.tableKey + '.POSITION_Y'),
              tooltip: this.translate.instant(this.tableKey + '.POSITION_Y_HELP'),
              require: true,
              fieldConfig: instanceAllFieldConfig,
              disabled: false,
              width: 33,
            },
            // [InteractiveObjectInteractionTypes.PvP]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            // [InteractiveObjectInteractionTypes.Sanctuary]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            [InteractiveObjectInteractionTypes.LeaveInstance]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              width: -1,
            },
            // [InteractiveObjectInteractionTypes.CraftingStation]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
          },
        },
      },
      interactionData3: {
        name: 'interactionData3',
        type: FormFieldType.input,
        require: false,
        disabled: true,
        width: -1,
        label: ' ',
        tooltip: ' ',
        conditionName: 'interactionType',
        condition: {
          interactionType: {
            [InteractiveObjectInteractionTypes.ApplyEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.PlayCoordEffect]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.StartQuest]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.CompleteTask]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              require: false,
              width: -1,
              fieldConfig: null,
            },
            [InteractiveObjectInteractionTypes.InstancePortal]: {
              label: this.translate.instant(this.tableKey + '.POSITION_Z'),
              tooltip: this.translate.instant(this.tableKey + '.POSITION_Z_HELP'),
              require: true,
              fieldConfig: instanceAllFieldConfig,
              disabled: false,
              width: 33,
            },
            // [InteractiveObjectInteractionTypes.PvP]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            // [InteractiveObjectInteractionTypes.Sanctuary]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
            [InteractiveObjectInteractionTypes.LeaveInstance]: {
              label: ' ',
              tooltip: ' ',
              disabled: true,
              width: -1,
            },
            // [InteractiveObjectInteractionTypes.CraftingStation]: {
            //   label: ' ',
            //   tooltip: ' ',
            //   disabled: true,
            //   width: -1,
            // },
          },
        },
      },

    },
    subForms: {
      coordEffects: {
        title: this.translate.instant(this.tableKey + '.COORDEFFECTS'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
         hiddenSubForm: true,
         minCount: 1,
         draggable: true,
         columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          coordEffect: {
            name: 'coordEffect',
            type: FormFieldType.file,
            acceptFolder: '/',
            acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
            accept: 'prefab',
            length: 127,
          },
        },
      },
    },
  };
  private destroyer = new Subject<void>();


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
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      this.formConfig.fields.gameObject.acceptFolder = profile.folder + profile.mobFolder;
      this.formConfig.fields.coordEffect.acceptFolder = profile.folder + profile.coordFolder;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;

     (this.formConfig.subForms as TypeMap<string, SubFormType>).coordEffects.fields.coordEffect.acceptFolder = profile.folder + profile.coordFolder;


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
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getQuests();
  }

  public async loadOptionChoices(): Promise<void> {
    this.formConfig.fields.interactionType.data =
      await this.optionChoicesService.getOptionsByType('Interaction Type', true);
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getSpawnData();
    }
    (queryParams.where as WhereQuery)['instance = -1'] = 'where_null_using';
    const response = await this.databaseService.queryList<InteractiveObjectProfileSettings>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);

    let {item} = await this.tablesService.openDialog<InteractiveObjectProfileSettings>(formConfig, form, {
      coordEffects: this.coordEffectsForm,
    });

    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const coordEffects = item.coordEffects as InteractiveObjectCoordEffects[];
    delete item.coordEffects;

    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<InteractiveObjectProfileSettings>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, coordEffects, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<InteractiveObjectProfileSettings>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    let coordEffectsList: InteractiveObjectCoordEffects[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableCoordEffects} WHERE objId = '${record.id}' order by \`order\``,
    );
    const coordEffectsAll = coordEffectsList.map((subItem) => subItem.id as number);

    let {item, action} = await this.prepareForm(record, coordEffectsList, true);
    if (!item) {
      return null;
    }
    const coordEffects = item.coordEffects as InteractiveObjectCoordEffects[];
    delete item.coordEffects;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<InteractiveObjectProfileSettings>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, coordEffects.map((l) => ({...l, id: undefined})), []);
    } else {
      await this.databaseService.update<InteractiveObjectProfileSettings>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      await this.saveSubs(record.id, coordEffects, coordEffectsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async setDefaults(item: InteractiveObjectProfileSettings): Promise<InteractiveObjectProfileSettings> {
    item.isactive = true;
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.interactionType = item.interactionType ? item.interactionType : '';
    item.interactionID = item.interactionID ? item.interactionID : -1;
    item.interactionData1 = item.interactionData1 ? item.interactionData1 : '';
    item.interactionData2 = item.interactionData2 ? item.interactionData2 : '';
    item.interactionData3 = item.interactionData3 ? item.interactionData3 : '';
    item.gameObject = item.gameObject ? item.gameObject : '';
    item.questReqID = item.questReqID ? item.questReqID : -1;
    item.interactTimeReq = item.interactTimeReq ? item.interactTimeReq : 0;
    item.interactDistance = item.interactDistance ? item.interactDistance : 9;
    item.coordEffect = item.coordEffect ? item.coordEffect : '';
    item.respawnTime = item.respawnTime ? item.respawnTime : 0;
    item.despawnDelay = item.despawnDelay ? item.despawnDelay : 0;
    item.despawnTime = item.despawnTime ? item.despawnTime : 0;
    item.makeBusy = item.makeBusy ? item.makeBusy : false;
    item.minLevel = item.minLevel ? item.minLevel : -1;
    item.maxLevel = item.maxLevel ? item.maxLevel : 99;
    item.itemReq = item.itemReq ? item.itemReq : -1;
    item.itemReqGet = item.itemReqGet ? item.itemReqGet : false;
    item.itemCountReq = item.itemCountReq ? item.itemCountReq : 0;
    item.currencyReq = item.currencyReq ? item.currencyReq : -1;
    item.currencyReqGet = item.currencyReqGet ? item.currencyReqGet : false;
    item.currencyCountReq = item.currencyCountReq ? item.currencyCountReq : 0;
    item.respawnTime = item.respawnTime ? item.respawnTime : 0;

    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<InteractiveObjectProfileSettings>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    let coordEffectsList: InteractiveObjectCoordEffects[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableCoordEffects} WHERE objId = '${baseRecord.id}' order by \`order\``,
    );
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    coordEffectsList = coordEffectsList.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, coordEffectsList);
    if (!item) {
      return 0;
    }
    const coordEffects = item.coordEffects as InteractiveObjectCoordEffects[];
    delete item.coordEffects;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<InteractiveObjectProfileSettings>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, coordEffects, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async saveSubs(recordId: number, items: InteractiveObjectCoordEffects[], itemsAll: number[] = []): Promise<void> {
    let i = 1;
    for (const item of items) {
      // item.isactive = true;
      item.order = i;
      item.objId = recordId;
      // item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<InteractiveObjectCoordEffects>(this.dbProfile, this.dbTableCoordEffects, item, 'id', item.id);
      } else {
        // @ts-ignore
        delete item.id;
        // item.creationtimestamp = this.databaseService.getTimestampNow();
        await this.databaseService.insert<InteractiveObjectCoordEffects>(this.dbProfile, this.dbTableCoordEffects, item, false);
      }
      ++i;
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableCoordEffects, 'id', itemId, false);
      }
    }
  }


  private async prepareForm(record: InteractiveObjectProfileSettings, coordEffectsList: InteractiveObjectCoordEffects[], updateMode = false): Promise<{item: InteractiveObjectProfileSettings | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const itm of coordEffectsList) {

      (form.get('coordEffects') as FormArray).push(this.subFormService.buildSubForm<InteractiveObjectCoordEffects, any>(this.coordEffectsForm, itm));
    }
    form.patchValue({...record});

    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<InteractiveObjectProfileSettings>(formConfig, form,{
      coordEffects: this.coordEffectsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    let it = await this.setDefaults(item);
    return {item: it, action};
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('coordEffects') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }


  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form =  this.fb.group({
      name: ['', Validators.required],
      icon: '',
      gameObject: [''],
      interactionType: ['', Validators.required],
      interactionID: [0],
      interactionData1: [''],
      interactionData2: [''],
      interactionData3: [''],
      questReqID: [0],
      interactTimeReq: [0],
      interactDistance:[9],
      coordEffect: [''],
      respawnTime: [0],
      despawnDelay: [0],
      despawnTime: [0],
      makeBusy: true,
      useLimit: [-1],
      minLevel: [1],
      maxLevel: [99],
      currencyReq: [-1],
      currencyReqGet: true,
      currencyCountReq: [0],
      itemReq: [-1],
      itemReqGet: true,
      itemCountReq: [0],
      icon2: '',
      coordEffects: new FormArray([]),

    });

   // (formConfig.subForms as TypeMap<string, SubFormType>).coordeffects.hiddenSubForm = false;
    (form.get('interactionType') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value === InteractiveObjectInteractionTypes.PlayCoordEffect) {
        (formConfig.subForms as TypeMap<string, SubFormType>).coordEffects.hiddenSubForm = false;
      } else {
        (form.get('coordEffects') as FormArray).clear();
        (formConfig.subForms as TypeMap<string, SubFormType>).coordEffects.hiddenSubForm = true;
      }
    });
    return form;
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
