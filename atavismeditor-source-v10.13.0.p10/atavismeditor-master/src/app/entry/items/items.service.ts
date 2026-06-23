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
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  itemAudioProfileTable,
  itemRequirementTable,
  itemTemplatesTable,
  slotsGroupTable,
  slotsInGroupTable,
  slotsTable
} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {Item, ItemEffects, itemMainTypes, ItemOption} from './items.data';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {
  abilityFieldConfig,
  achievementFieldConfig,
  ammoTypeFieldConfig,
  armorTypeFieldConfig,
  boFieldConfig,
  bonusSettingsFieldConfig,
  claimTypeFieldConfig,
  classFieldConfig,
  craftingRecipesFieldConfig,
  currencyFieldConfig,
  effectFieldConfig,
  enchantFieldConfig, itemAudioProfileFieldConfig,
  itemQualityFieldConfig,
  mobsFieldConfig,
  passiveAbilityFieldConfig,
  questFieldConfig,
  raceFieldConfig,
  skillFieldConfig,
  socketTypeFieldConfig,
  statFieldConfig,
  toolTypeFieldConfig,
  weaponProfileFieldConfig,
  weaponTypeFieldConfig
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {Requirements} from '../option-choices/option-choices.data';
import {SlotInGroup} from '../slot-group/slot-group.data';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  public tableKey = TabTypes.ITEMS;
  private readonly listStream = new BehaviorSubject<Item[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = itemTemplatesTable;
  public dbTableRequirements = itemRequirementTable;
  public dbTableSlotgroup = slotsGroupTable;
  public dbTableSlotsInGroup = slotsInGroupTable;
  public dbTableSlot = slotsTable;
  private effectForm: SubFieldType = {
    type: {value: '', required: true},
    name: {value: '', required: true},
    value: {value: '', required: true},
    percentage: {value: '', required: true},
  };
  private requirementForm: SubFieldType = {
    id: {value: '', required: false},
    editor_option_type_id: {value: '', required: true},
    editor_option_choice_type_id: {value: '', required: true},
    required_value: {value: '', min: -1, required: true},
  };
  private readonly bindOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant('BINDING.NO_BINDING')},
    {id: 1, value: this.translate.instant('BINDING.EQUIP')},
    {id: 2, value: this.translate.instant('BINDING.PICKUP')},
  ];
  private slotWeaponOptions: DropdownValue[] = [];
  private slotArmorOptions: DropdownValue[] = [];
  private slotToolOptions: DropdownValue[] = [];
  private ammoSubTypes: DropdownValue[] = [];
  private claimTypeList: DropdownValue[] = [];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      itemType: {
        type: ConfigTypes.dropdown,
        visible: true,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      toolTip: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      subType: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      slot: {
        type: ConfigTypes.stringType,
        visible: true,
        useAsSearch: true,
      },
      itemQuality: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      binding: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.bindOptions,
      },
      isUnique: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      stackLimit: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      purchaseCurrency: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
        data: [],
      },
      purchaseCost: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      passive_ability: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: passiveAbilityFieldConfig,
        data: [],
      },
      sellable: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      damage: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      damageMax: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      delay: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      auctionHouse: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      shopSlots: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      shopMobTemplate: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: mobsFieldConfig,
        data: [],
      },
      shopTag: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      ground_prefab: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      numShops: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      shopTimeOut: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      shopDestroyOnLogOut: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      enchant_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: enchantFieldConfig,
        data: [],
      },
      parry: {type: ConfigTypes.booleanType, visible: false, filterVisible: false, filterType: FilterTypes.booleanType},
      durability: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      socket_type: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      death_loss: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      weight: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      autoattack: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: abilityFieldConfig,
        data: [],
      },
      ammotype: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      oadelete: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      repairable: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      type: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      editor_option_type_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      // drawWeaponEffect: {type: ConfigTypes.hidden, visible: false, useAsSearch: true},
      // holsteringWeaponEffect: {type: ConfigTypes.hidden, visible: false, useAsSearch: true},
      weapon_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: weaponProfileFieldConfig,
        data: [],
      },
      audio_profile_id: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemAudioProfileFieldConfig,
        data: [],
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
      itemType: {name: 'itemType', type: FormFieldType.dropdown, require: true, data: [], width: 50},
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 50},
      ground_prefab: {
        name: 'ground_prefab',
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 255,
        width: 100
      },
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      display: {
        name: 'display',
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 50,
      },
      skillExp: {name: 'skillExp', type: FormFieldType.integer, width: 25},
      subType: {name: 'subType', type: FormFieldType.dropdown, search: true, require: true, data: [], width: 25},
      slot: {name: 'slot', type: FormFieldType.dropdown, search: true, require: true, data: [], width: 25},
      gear_score: {name: 'gear_score', type: FormFieldType.integer, width: 25},
      damage: {name: 'damage', type: FormFieldType.integer, width: 25},
      damageMax: {name: 'damageMax', type: FormFieldType.integer, width: 25},
      delay: {name: 'delay', type: FormFieldType.decimal, require: true, width: 25},
      enchant_profile_id: {
        name: 'enchant_profile_id',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: enchantFieldConfig,
        width: 25,
      },
      itemQuality: {
        name: 'itemQuality',
        type: FormFieldType.dynamicDropdown,
        search: true,
        require: true,
        allowNew: true,
        fieldConfig: itemQualityFieldConfig,
        width: 25,
      },
      binding: {name: 'binding', type: FormFieldType.dropdown, data: this.bindOptions, require: true, width: 25},
      purchaseCurrency: {
        name: 'purchaseCurrency',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        require: true,
        fieldConfig: currencyFieldConfig,
        width: 25,
      },
      purchaseCost: {name: 'purchaseCost', type: FormFieldType.integer, width: 25},
      passive_ability: {
        name: 'passive_ability',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: passiveAbilityFieldConfig,
        width: 25,
      },
      stackLimit: {name: 'stackLimit', type: FormFieldType.integer, require: true, width: 25},
      sellable: {name: 'sellable', type: FormFieldType.boolean, width: 25},
      isUnique: {name: 'isUnique', type: FormFieldType.boolean, width: 25},
      auctionHouse: {name: 'auctionHouse', type: FormFieldType.boolean, width: 25},
      parry: {name: 'parry', type: FormFieldType.boolean, width: 25},
      repairable: {name: 'repairable', type: FormFieldType.boolean, width: 25},
      durability: {name: 'durability', type: FormFieldType.integer, width: 25},
      slot1: {
        name: 'slot1',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot1h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect1: {
        name: 'drawWeaponEffect1',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime1: {
        name: 'drawWeaponTime1',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect1: {
        name: 'holsteringWeaponEffect1',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime1: {
        name: 'holsteringWeaponTime1',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot2: {
        name: 'slot2',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot2h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect2: {
        name: 'drawWeaponEffect2',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime2: {
        name: 'drawWeaponTime2',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect2: {
        name: 'holsteringWeaponEffect2',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime2: {
        name: 'holsteringWeaponTime2',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot3: {
        name: 'slot3',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot3h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect3: {
        name: 'drawWeaponEffect3',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime3: {
        name: 'drawWeaponTime3',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect3: {
        name: 'holsteringWeaponEffect3',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime3: {
        name: 'holsteringWeaponTime3',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot4: {
        name: 'slot4',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot4h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect4: {
        name: 'drawWeaponEffect4',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime4: {
        name: 'drawWeaponTime4',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect4: {
        name: 'holsteringWeaponEffect4',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime4: {
        name: 'holsteringWeaponTime4',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot5: {
        name: 'slot5',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot5h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect5: {
        name: 'drawWeaponEffect5',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime5: {
        name: 'drawWeaponTime5',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect5: {
        name: 'holsteringWeaponEffect5',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime5: {
        name: 'holsteringWeaponTime5',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot6: {
        name: 'slot6',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot6h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect6: {
        name: 'drawWeaponEffect6',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime6: {
        name: 'drawWeaponTime6',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect6: {
        name: 'holsteringWeaponEffect6',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime6: {
        name: 'holsteringWeaponTime6',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot7: {
        name: 'slot7',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot7h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect7: {
        name: 'drawWeaponEffect7',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime7: {
        name: 'drawWeaponTime7',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect7: {
        name: 'holsteringWeaponEffect7',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime7: {
        name: 'holsteringWeaponTime7',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot8: {
        name: 'slot8',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot8h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect8: {
        name: 'drawWeaponEffect8',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime8: {
        name: 'drawWeaponTime8',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect8: {
        name: 'holsteringWeaponEffect8',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime8: {
        name: 'holsteringWeaponTime8',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot9: {
        name: 'slot9',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot9h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect9: {
        name: 'drawWeaponEffect9',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime9: {
        name: 'drawWeaponTime9',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect9: {
        name: 'holsteringWeaponEffect9',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime9: {
        name: 'holsteringWeaponTime9',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      slot10: {
        name: 'slot10',
        label: this.translate.instant(this.tableKey + '.SLOT'),
        tooltip: this.translate.instant(this.tableKey + '.SLOT_HELP'),
        type: FormFieldType.input,
        readonly: true,
        width: 25,
      },
      slot10h: {name: '', type: FormFieldType.title, width: 75},
      drawWeaponEffect10: {
        name: 'drawWeaponEffect10',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        readonly: false,
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      drawWeaponTime10: {
        name: 'drawWeaponTime10',
        label: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.DRAWWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },
      holsteringWeaponEffect10: {
        name: 'holsteringWeaponEffect10',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONEFFECT_HELP'),
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 75,
      },
      holsteringWeaponTime10: {
        name: 'holsteringWeaponTime10',
        label: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME'),
        tooltip: this.translate.instant(this.tableKey + '.HOLSTERINGWEAPONTIME_HELP'),
        type: FormFieldType.integer,
        width: 25,
      },

      weapon_profile_id: {
        name: 'weapon_profile_id',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: weaponProfileFieldConfig,
        width: 25,
      },
      audio_profile_id: {
        name: 'audio_profile_id',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: itemAudioProfileFieldConfig,
        width: 25,
      },
      socket_type: {
        name: 'socket_type',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: socketTypeFieldConfig,
        allowNew: true,
        width: 25,
      },
      death_loss: {name: 'death_loss', type: FormFieldType.integer, width: 25},
      weight: {name: 'weight', type: FormFieldType.integer, width: 25},
      autoattack: {
        name: 'autoattack',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        fieldConfig: abilityFieldConfig,
      },
      ammotype: {
        name: 'ammotype',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: ammoTypeFieldConfig,
        allowNew: true,
        width: 25,
      },
      oadelete: {name: 'oadelete', type: FormFieldType.boolean, width: 25},
      title_1: {
        name: 'title_1',
        label: this.translate.instant(this.tableKey + '.PLAYER_SHOP_TITLE'),
        type: FormFieldType.hidden,
      },
      shopSlots: {name: 'shopSlots', type: FormFieldType.integer, width: -1},
      shopMobTemplate: {
        name: 'shopMobTemplate',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: mobsFieldConfig,
        allowNew: true,
        width: -1,
      },
      shopTag: {name: 'shopTag', type: FormFieldType.input, width: -1, length: 255},
      numShops: {name: 'numShops', type: FormFieldType.integer, width: -1},
      shopTimeOut: {name: 'shopTimeOut', type: FormFieldType.integer, width: -1},
      shopDestroyOnLogOut: {name: 'shopDestroyOnLogOut', type: FormFieldType.boolean, width: -1},

      toolTip: {name: 'toolTip', type: FormFieldType.textarea, length: 255, width: 100},
    },
    subForms: {
      effects: {
        title: this.translate.instant(this.tableKey + '.EFFECTS'),
        submit: this.translate.instant(this.tableKey + '.ADD_EFFECT'),
        maxCount: 32,
        fields: {
          type: {name: 'type', type: FormFieldType.dropdown, data: [], require: true, search: true, width: 100},
          name: {
            name: 'name',
            type: FormFieldType.dynamicDropdown,
            label: ' ',
            require: true,
            disabled: true,
            width: 50,
            fieldConfig: undefined,
            conditionName: 'type',
            condition: {
              type: {
                Stat: {
                  label: this.translate.instant(this.tableKey + '.STAT'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: statFieldConfig,
                },
                UseAbility: {
                  label: this.translate.instant(this.tableKey + '.ABILITY'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: abilityFieldConfig,
                },
                SocketAbility: {
                  label: this.translate.instant(this.tableKey + '.ABILITY'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: abilityFieldConfig,
                },
                SocketEffect: {
                  label: this.translate.instant(this.tableKey + '.EFFECT'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: effectFieldConfig,
                },
                AutoAttack: {
                  label: this.translate.instant(this.tableKey + '.ABILITY'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: abilityFieldConfig,
                },
                ClaimObject: {
                  label: this.translate.instant(this.tableKey + '.BUILD_OBJECT'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: boFieldConfig,
                },
                CreateClaim: {
                  label: this.translate.instant(this.tableKey + '.VALID_CLAIM_TYPES'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: claimTypeFieldConfig,
                },
                StartQuest: {
                  label: this.translate.instant(this.tableKey + '.QUEST'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: questFieldConfig,
                },
                Currency: {
                  label: this.translate.instant(this.tableKey + '.CURRENCY'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: currencyFieldConfig,
                },
                BuildingMaterial: {label: ' ', disabled: true, fieldConfig: null},
                UseAmmo: {
                  label: this.translate.instant(this.tableKey + '.AMMO_TYPE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: ammoTypeFieldConfig,
                },
                Weight: {label: ' ', disabled: true, fieldConfig: null},
                Durability: {label: ' ', disabled: true, fieldConfig: null},
                CraftsItem: {
                  label: this.translate.instant(this.tableKey + '.CRAFTS_RECIPE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: craftingRecipesFieldConfig,
                },
                DeathLossChance: {label: ' ', disabled: true, fieldConfig: null},
                Sockets: {
                  label: this.translate.instant(this.tableKey + '.SOCKETS_TYPE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: socketTypeFieldConfig,
                },
                SocketsEffect: {
                  label: this.translate.instant(this.tableKey + '.SOCKETS_TYPE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: socketTypeFieldConfig,
                },
                Blueprint: {
                  label: this.translate.instant(this.tableKey + '.CRAFTS_RECIPE'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: craftingRecipesFieldConfig,
                },
                Parry: {label: ' ', disabled: true, fieldConfig: null},
                VipPoints: {label: ' ', disabled: true, fieldConfig: null},
                VipTime: {label: ' ', disabled: true, fieldConfig: null},
                Bonus: {
                  label: this.translate.instant(this.tableKey + '.OPTION_NAME'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: bonusSettingsFieldConfig,
                },
                SkillPoints: {label: ' ', disabled: true, fieldConfig: null},
                TalentPoints: {label: ' ', disabled: true, fieldConfig: null},
                SkillReset: {label: ' ', disabled: true, fieldConfig: null},
                TalentReset: {label: ' ', disabled: true, fieldConfig: null},
                Achievement: {
                  label: this.translate.instant(this.tableKey + '.ACHIEVEMENT'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: achievementFieldConfig,
                },
              },
            },
          },
          value: {
            name: 'value',
            label: ' ',
            type: FormFieldType.integer,
            width: 25,
            require: true,
            disabled: false,
            conditionName: 'type',
            condition: {
              type: {
                Stat: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false},
                UseAbility: {label: ' ', disabled: true},
                AutoAttack: {label: ' ', disabled: true},
                ClaimObject: {label: ' ', disabled: true},
                CreateClaim: {label: this.translate.instant(this.tableKey + '.SIZE'), disabled: false, min: 5},
                StartQuest: {label: ' ', disabled: true},
                Currency: {label: ' ', disabled: true},
                BuildingMaterial: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                UseAmmo: {label: ' ', disabled: true},
                Weight: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                Durability: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                CraftsItem: {label: ' ', disabled: true},
                DeathLossChance: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                Sockets: {label: this.translate.instant(this.tableKey + '.NUMBER_OF_SLOTS'), disabled: false, min: 1},
                SocketsEffect: {label: ' ', disabled: true},
                Blueprint: {label: ' ', disabled: true},
                Parry: {label: ' ', disabled: true},
                VipPoints: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                VipTime: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                Bonus: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: true, min: 1},
                SkillPoints: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                TalentPoints: {label: this.translate.instant(this.tableKey + '.VALUE'), disabled: false, min: 1},
                SkillReset: {label: ' ', disabled: true},
                TalentReset: {label: ' ', disabled: true},
                Achievement: {label: ' ', disabled: true},
                SocketAbility: {label: ' ', disabled: true},
                SocketEffect: {label: ' ', disabled: true},
              },
            },
          },
          percentage: {
            name: 'percentage',
            label: ' ',
            type: FormFieldType.integer,
            width: 25,
            require: true,
            disabled: true,
            conditionName: 'type',
            condition: {
              type: {
                Stat: {label: ' ', disabled: true},
                UseAbility: {label: ' ', disabled: true},
                AutoAttack: {label: ' ', disabled: true},
                ClaimObject: {label: ' ', disabled: true},
                CreateClaim: {label: ' ', disabled: true},
                StartQuest: {label: ' ', disabled: true},
                Currency: {label: ' ', disabled: true},
                BuildingMaterial: {label: ' ', disabled: true},
                UseAmmo: {label: ' ', disabled: true},
                Weight: {label: ' ', disabled: true},
                Durability: {label: ' ', disabled: true},
                CraftsItem: {label: ' ', disabled: true},
                DeathLossChance: {label: ' ', disabled: true},
                Sockets: {label: ' ', disabled: true},
                SocketsEffect: {label: ' ', disabled: true},
                Blueprint: {label: ' ', disabled: true},
                Parry: {label: ' ', disabled: true},
                VipPoints: {label: ' ', disabled: true},
                VipTime: {label: ' ', disabled: true},
                Bonus: {label: this.translate.instant(this.tableKey + '.PERCENTAGE'), disabled: true, min: 1},
                SkillPoints: {label: ' ', disabled: true},
                TalentPoints: {label: ' ', disabled: true},
                SkillReset: {label: ' ', disabled: true},
                TalentReset: {label: ' ', disabled: true},
                Achievement: {label: ' ', disabled: true},
                SocketAbility: {label: ' ', disabled: true},
                SocketEffect: {label: ' ', disabled: true},
              },
            },
          },
        },
      },
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
    },
  };
  private specialType = [
    'UseAbility',
    'AutoAttack',
    'ClaimObject',
    'StartQuest',
    'Currency',
    'CraftsItem',
    'Blueprint',
    'Achievement',
    'SocketAbility',
    'SocketEffect',
  ];
  private specialType2 = [
    'BuildingMaterial',
    'VipPoints',
    'VipTime',
    'SkillPoints',
    'TalentPoints',
    'SkillReset',
    'TalentReset',
  ];
  private profile!: Profile;

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
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.formConfig.fields.display.acceptFolder = profile.folder + profile.itemFolder;
      this.formConfig.fields.ground_prefab.acceptFolder = profile.folder + profile.mobFolder;
      this.formConfig.fields.drawWeaponEffect1.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect1.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect2.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect2.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect3.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect3.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect4.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect4.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect5.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect5.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect6.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect6.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect7.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect7.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect8.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect8.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect9.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect9.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.drawWeaponEffect10.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.holsteringWeaponEffect10.acceptFolder = profile.folder + profile.coordFolder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
      }
    });
    const requirementsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).requirements.fields;
    const effectsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).effects.fields;
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.autoattack.data = listing.map((item) => ({id: item.id, value: item.value}));
      this.tableConfig.fields.passive_ability.data = listing.filter((item) => item.passive);
      (effectsFields.name.condition as TypeMap<string, any>).type.UseAbility.data = listing;
      (effectsFields.name.condition as TypeMap<string, any>).type.AutoAttack.data = listing;
    });
    this.dropdownItemsService.stats.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (
        requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>
      ).editor_option_type_id[78].data = listing;
      (effectsFields.name.condition as TypeMap<string, any>).type.Stat.data = listing;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((skillsList) => {
      (
        requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>
      ).editor_option_type_id[75].data = skillsList;
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.Currency.data = listing;
      this.tableConfig.fields.purchaseCurrency.data = listing;
    });
    this.dropdownItemsService.enchantProfiles.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.enchant_profile_id.data = list;
    });
    this.dropdownItemsService.weaponProfiles.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.weapon_profile_id.data = list;
    });

    this.dropdownItemsService.itemAudioProfiles.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.audio_profile_id.data = list;
    });

    this.dropdownItemsService.craftingRecipes.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.CraftsItem.data = listing;
      (effectsFields.name.condition as TypeMap<string, any>).type.Blueprint.data = listing;
    });
    this.dropdownItemsService.buildObjects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.ClaimObject.data = listing;
    });
    this.dropdownItemsService.quests.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.StartQuest.data = listing;
    });
    this.dropdownItemsService.bonusSettings.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.Bonus.data = listing.map((item) => ({
        id: item.id,
        value: item.name,
      }));
    });
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.SocketEffect.data = listing;
    });
    this.dropdownItemsService.achievements.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (effectsFields.name.condition as TypeMap<string, any>).type.Achievement.data = listing;
    });
    this.dropdownItemsService.mobs.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.shopMobTemplate.data = listing;
    });
    this.dropdownItemsService.slotNames.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadSlotNames();
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadSlotNames(): Promise<void> {
    this.slotWeaponOptions = await this.dropdownItemsService.getSlotNamesByType(itemMainTypes.Weapon);
    this.slotArmorOptions = await this.dropdownItemsService.getSlotNamesByType(itemMainTypes.Armor);
    this.slotToolOptions = await this.dropdownItemsService.getSlotNamesByType(itemMainTypes.Tool);
  }

  public async loadOptionChoices(): Promise<void> {
    const requirementsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).requirements.fields;
    const effectsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).effects.fields;
    const optionChoiceIdConditions = (requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>)
      .editor_option_type_id;
    requirementsFields.editor_option_type_id.data = await this.optionChoicesService.getOptionsByType('Requirement');
    this.tableConfig.fields.editor_option_type_id.data = requirementsFields.editor_option_type_id.data;
    this.tableConfig.fields.itemQuality.data = await this.optionChoicesService.getOptionsByType(
      'Item Quality',
      false,
      true,
    );
    this.tableConfig.fields.socket_type.data = await this.optionChoicesService.getOptionsByType('Sockets Type', true);
    const socketsList = await this.optionChoicesService.getOptionsByType('Sockets Type');
    (effectsFields.name.condition as TypeMap<string, any>).type.Sockets.data = socketsList;
    (effectsFields.name.condition as TypeMap<string, any>).type.SocketsEffect.data = socketsList;
    effectsFields.type.data = await this.optionChoicesService.getOptionsByType('Item Effect Type', true);
    this.tableConfig.fields.type.data = effectsFields.type.data;
    this.claimTypeList = await this.optionChoicesService.getOptionsByType('Claim Type');
    const itemTypes = await this.optionChoicesService.getOptionsByType('Item Type', true);
    this.tableConfig.fields.itemType.data = itemTypes;
    this.formConfig.fields.itemType.data = itemTypes;
    const ammoSubTypes = await this.optionChoicesService.getOptionsByType('Ammo Type');
    this.tableConfig.fields.ammotype.data = ammoSubTypes;
    this.ammoSubTypes = [];
    for (const item of ammoSubTypes) {
      this.ammoSubTypes.push({
        id: item.id.toString(),
        value: item.value,
      });
    }
    (effectsFields.name.condition as TypeMap<string, any>).type.UseAmmo.data = ammoSubTypes;
    optionChoiceIdConditions[76].data = await this.optionChoicesService.getOptionsByType('Race');
    optionChoiceIdConditions[77].data = await this.optionChoicesService.getOptionsByType('Class');
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getEffects();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getSkills();
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getEnchantProfiles();
    await this.dropdownItemsService.getWeaponProfiles();
    await this.dropdownItemsService.getItemAudioProfiles();
    await this.dropdownItemsService.getCraftingRecipes();
    await this.dropdownItemsService.getBuildObjects();
    await this.dropdownItemsService.getQuests();
    await this.dropdownItemsService.getBonusesSettings();
    await this.dropdownItemsService.getAchievements();
    await this.dropdownItemsService.getMobs();
    await this.dropdownItemsService.getSlotNames();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getItems();
    }
    const subFields: Record<string, SubQueryField> = {
      type: {
        type: SubTable.multiple,
        columns: [
          'effect1type',
          'effect2type',
          'effect3type',
          'effect4type',
          'effect5type',
          'effect6type',
          'effect7type',
          'effect8type',
          'effect9type',
          'effect10type',
          'effect11type',
          'effect12type',
          'effect13type',
          'effect14type',
          'effect15type',
          'effect16type',
          'effect17type',
          'effect18type',
          'effect19type',
          'effect20type',
          'effect21type',
          'effect22type',
          'effect23type',
          'effect24type',
          'effect25type',
          'effect26type',
          'effect27type',
          'effect28type',
          'effect29type',
          'effect30type',
          'effect31type',
          'effect32type',
        ],
      },
      slot: {
        type: SubTable.multiple,
        columns: [
          'slot',
          'slot1',
          'slot2',
          'slot3',
          'slot4',
          'slot5',
          'slot6',
          'slot7',
          'slot8',
          'slot9',
          'slot10',
        ],
      },
      drawWeaponEffect: {
        type: SubTable.multiple,
        columns: [
          'drawWeaponEffect1',
          'drawWeaponEffect2',
          'drawWeaponEffect3',
          'drawWeaponEffect4',
          'drawWeaponEffect5',
          'drawWeaponEffect6',
          'drawWeaponEffect7',
          'drawWeaponEffect8',
          'drawWeaponEffect9',
          'drawWeaponEffect10',
        ],
      },
      holsteringWeaponEffect: {
        type: SubTable.multiple,
        columns: [
          'holsteringWeaponEffect1',
          'holsteringWeaponEffect2',
          'holsteringWeaponEffect3',
          'holsteringWeaponEffect4',
          'holsteringWeaponEffect5',
          'holsteringWeaponEffect6',
          'holsteringWeaponEffect7',
          'holsteringWeaponEffect8',
          'holsteringWeaponEffect9',
          'holsteringWeaponEffect10',
        ],
      },
      editor_option_type_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'item_id',
        table: this.dbTableRequirements,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.editor_option_type_id.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Item>(
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
    const form = this.createForm(formConfig);
    (form.get('itemType') as AbstractControl).enable();
    (this.formConfig.fields.itemType.data as DropdownValue[]).map((it) => {
      it.disabled = false;
      return it;
    });
    let {item} = await this.tablesService.openDialog<Item>(formConfig, form, {
      effects: this.effectForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefault(item);
    const requirements = item.requirements as ItemOption[];
    delete item.requirements;
    delete item.slot1h;
    delete item.slot2h;
    delete item.slot3h;
    delete item.slot4h;
    delete item.slot5h;
    delete item.slot6h;
    delete item.slot7h;
    delete item.slot8h;
    delete item.slot9h;
    delete item.slot10h;
    const newId = await this.databaseService.insert<Item>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, requirements, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Item>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and item_id = ${record.id}`,
      [],
      false,
    );
    const requirementsAll = [];
    for (const requirement of list) {
      requirementsAll.push(requirement.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const requirements = item.requirements as ItemOption[];
    delete item.requirements;
    delete item.slot1h;
    delete item.slot2h;
    delete item.slot3h;
    delete item.slot4h;
    delete item.slot5h;
    delete item.slot6h;
    delete item.slot7h;
    delete item.slot8h;
    delete item.slot9h;
    delete item.slot10h;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Item>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(
        newId,
        requirements.map((r) => ({...r, id: undefined})),
        [],
      );
    } else {
      await this.databaseService.update<Item>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, requirements, requirementsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async setDefault(item: Item): Promise<Item> {
    const effects = item.effects as any[];
    delete item.effects;
    for (let i = 1; i <= ((this.formConfig.subForms as TypeMap<string, SubFormType>).effects.maxCount as number); i++) {
      const itm = effects[i - 1] ? effects[i - 1] : null;
      if (itm && itm.type) {
        let name = itm.name;
        let value;
        if (this.specialType.includes(itm.type)) {
          value = itm.name;
          name = '';
        } else if (itm.type === 'Bonus') {
          const bonus = await this.dropdownItemsService.getBonusByCode(itm.name);
          if (bonus) {
            value = [itm.value ? itm.value : 0, itm.percentage ? itm.percentage : 0, bonus.name].join('|');
          } else {
            value = '';
            name = '';
          }
        } else {
          value = +itm.value;
        }
        if (this.specialType2.includes(itm.type) && !name) {
          name = '';
        }
        // @ts-ignore
        item[`effect${i}type`] = itm.type;
        // @ts-ignore
        item[`effect${i}name`] = name;
        // @ts-ignore
        item[`effect${i}value`] = value;
      } else {
        // @ts-ignore
        item[`effect${i}type`] = '';
        // @ts-ignore
        item[`effect${i}name`] = '';
        // @ts-ignore
        item[`effect${i}value`] = 1;
      }
    }
    item.isactive = true;
    item.category = item.category ? item.category : '0';
    item.subcategory = item.subcategory ? item.subcategory : '0';
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    if (item.itemType === itemMainTypes.Weapon) {
      item.oadelete = false;
    } else if (item.itemType === itemMainTypes.Tool) {
      item.oadelete = false;
      item.damage = 0;
      item.damageMax = 0;
      item.delay = 0;
      item.autoattack = -1;
      item.weapon_profile_id = -1;
    } else if (item.itemType === itemMainTypes.Armor) {
      item.skillExp = 0;
      item.damage = 0;
      item.damageMax = 0;
      item.delay = 0;
      item.oadelete = false;
      item.autoattack = -1;
      item.ammotype = -1;
      item.weapon_profile_id = -1;
    } else if (item.itemType === itemMainTypes.Ammo) {
      item.skillExp = 0;
      item.subType = '';
      item.display = '';
      item.gear_score = 0;
      item.damageMax = 0;
      item.delay = 0;
      item.enchant_profile_id = -1;
      item.autoattack = -1;
      item.ammotype = -1;
      item.durability = 0;
      item.parry = false;
      item.weapon_profile_id = -1;
    } else {
      item.skillExp = 0;
      item.subType = '';
      item.display = '';
      item.slot = '';
      item.gear_score = 0;
      item.damage = 0;
      item.damageMax = 0;
      item.delay = 0;
      item.enchant_profile_id = -1;
      item.autoattack = -1;
      item.ammotype = -1;
      item.durability = 0;
      item.parry = false;
      item.weapon_profile_id = -1;
    }
    item.isUnique = item.isUnique ? item.isUnique : false;
    item.repairable = item.repairable ? item.repairable : false;
    if (item.itemType !== itemMainTypes.Weapon && item.itemType !== itemMainTypes.Armor) {
      item.isUnique = false;
    }
    if (
      [
        itemMainTypes.Weapon,
        itemMainTypes.Tool,
        itemMainTypes.Armor,
        itemMainTypes.Ammo,
        itemMainTypes.Bag,
        itemMainTypes.Container,
      ].includes(item.itemType as itemMainTypes)
    ) {
      item.shopSlots = 0;
      item.shopMobTemplate = -1;
      item.shopTag = '';
      item.numShops = 1;
      item.shopTimeOut = 0;
      item.shopDestroyOnLogOut = true;
    } else {
      item.shopSlots = item.shopSlots ? item.shopSlots : 0;
      item.shopMobTemplate = item.shopMobTemplate ? item.shopMobTemplate : -1;
      item.shopTag = item.shopTag ? item.shopTag : '';
      item.numShops = item.numShops ? item.numShops : 1;
      item.shopTimeOut = item.shopTimeOut ? item.shopTimeOut : 0;
      item.shopDestroyOnLogOut = item.shopDestroyOnLogOut || false;
    }
    item.passive_ability = item.passive_ability ? item.passive_ability : -1;
    item.purchaseCost = item.purchaseCost ? item.purchaseCost : 0;
    item.sellable = item.sellable || !item.sellable ? item.sellable : true;
    item.damage = item.damage ? item.damage : 0;
    item.damageMax = item.damageMax ? item.damageMax : 0;
    item.actionBarAllowed = item.actionBarAllowed ? item.actionBarAllowed : false;
    item.enchant_profile_id = item.enchant_profile_id ? item.enchant_profile_id : -1;
    item.weapon_profile_id = item.weapon_profile_id ? item.weapon_profile_id : -1;
    item.audio_profile_id = item.audio_profile_id ? item.audio_profile_id : -1;
    item.skillExp = item.skillExp ? item.skillExp : 0;
    item.gear_score = item.gear_score ? item.gear_score : 0;
    item.purchaseCurrency = item.purchaseCurrency ? item.purchaseCurrency : -1;
    item.toolTip = item.toolTip ? item.toolTip : '';
    item.damageType = item.damageType ? item.damageType : '';
    item.stackLimit = item.stackLimit ? item.stackLimit : 1;
    item.weight = item.weight ? item.weight : 0;
    item.durability = item.durability ? item.durability : 0;
    item.autoattack = item.autoattack ? item.autoattack : -1;
    item.socket_type = item.socket_type ? item.socket_type : '';
    item.ammotype = item.ammotype ? item.ammotype : -1;
    item.death_loss = item.death_loss ? item.death_loss : 0;
    item.oadelete = item.oadelete ? item.oadelete : false;
    item.parry = item.parry ? item.parry : false;
    item.ground_prefab = item.ground_prefab ? item.ground_prefab: '';
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Item>(this.dbProfile, this.dbTable, 'id', id);
    let list: ItemOption[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and item_id = ${baseRecord.id}`,
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const requirements = item.requirements as ItemOption[];
    delete item.requirements;
    delete item.slot1h;
    delete item.slot2h;
    delete item.slot3h;
    delete item.slot4h;
    delete item.slot5h;
    delete item.slot6h;
    delete item.slot7h;
    delete item.slot8h;
    delete item.slot9h;
    delete item.slot10h;
    const newId = await this.databaseService.insert<Item>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, requirements, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(
    record: Item,
    list: ItemOption[],
    updateMode = false,
  ): Promise<{item: Item | undefined; action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const requirement of list) {
      const subForm = new FormGroup({});
      Object.keys(this.requirementForm).forEach((key) => {
        const validators = [];
        if (this.requirementForm[key].required) {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          validators.push(Validators.required);
        }
        if (this.requirementForm[key].min !== undefined) {
          validators.push(Validators.min(this.requirementForm[key].min as number));
        }
        if (key === 'editor_option_choice_type_id') {
          const intValue = Number(requirement[key]);
          // @ts-ignore
          // tslint:disable-next-line:triple-equals
          if (requirement[key] == intValue) {
            subForm.addControl(key, new FormControl(intValue, validators));
          } else {
            subForm.addControl(key, new FormControl(requirement[key], validators));
          }
        } else {
          // @ts-ignore
          subForm.addControl(key, new FormControl(requirement[key], validators));
        }
      });
      (form.get('requirements') as FormArray).push(subForm);
    }
    for (let i = 1; i <= ((formConfig.subForms as TypeMap<string, SubFormType>).effects.maxCount as any); i++) {
      if (record[`effect${i}type` as keyof Item]) {
        const itemEffect: ItemEffects = {
          type: record[`effect${i}type` as keyof Item] as string,
          name: '',
          value: '',
          percentage: '',
        };
        if (this.specialType.includes(record[`effect${i}type` as keyof Item] as string)) {
          itemEffect.name = Number(record[`effect${i}value` as keyof Item]).toString();
        } else if (record[`effect${i}type` as keyof Item] === 'Bonus') {
          const bon: string[] = (record[`effect${i}value` as keyof Item] as string).split('|');
          itemEffect.name = record[`effect${i}name` as keyof Item] as string;
          itemEffect.value = bon[0];
          itemEffect.percentage = bon[1];
        } else {
          if (
            record[`effect${i}name` as keyof Item] &&
            parseFloat(record[`effect${i}name` as keyof Item] as string) ===
              Number(record[`effect${i}name` as keyof Item])
          ) {
            itemEffect.name = Number(record[`effect${i}name` as keyof Item]);
          } else {
            itemEffect.name = record[`effect${i}name` as keyof Item] as string;
          }
          itemEffect.value = record[`effect${i}value` as keyof Item] as string;
        }
        (form.get('effects') as FormArray).push(
          this.subFormService.buildSubForm<ItemEffects, any>(this.effectForm, itemEffect),
        );
      }
    }
    form.patchValue(record);
    (form.get('itemType') as AbstractControl).enable();
    if (
      record.itemType === itemMainTypes.Weapon ||
      record.itemType === itemMainTypes.Tool ||
      record.itemType === itemMainTypes.Armor
    ) {
      (form.get('itemType') as AbstractControl).disable();
    }
    (formConfig.fields.itemType.data as DropdownValue[]).map((it) => {
      it.disabled =
        record.itemType !== itemMainTypes.Weapon &&
        record.itemType !== itemMainTypes.Tool &&
        record.itemType !== itemMainTypes.Armor &&
        (it.id === itemMainTypes.Weapon || it.id === itemMainTypes.Armor || it.id === itemMainTypes.Tool);
      return it;
    });
    formConfig.saveAsNew = updateMode;
    let {item, action} = await this.tablesService.openDialog<Item>(formConfig, form, {
      effects: this.effectForm,
      requirements: this.requirementForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item = await this.setDefault(item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private async saveSubs(recordId: number, items: ItemOption[], itemsAll: number[] = []): Promise<void> {
    for (const item of items) {
      item.isactive = true;
      item.item_id = recordId;
      item.editor_option_choice_type_id = item.editor_option_choice_type_id ? item.editor_option_choice_type_id : '';
      item.required_value = +item.required_value;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<ItemOption>(this.dbProfile, this.dbTableRequirements, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<ItemOption>(this.dbProfile, this.dbTableRequirements, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.update<ItemOption>(
          this.dbProfile,
          this.dbTableRequirements,
          {isactive: false, updatetimestamp: this.databaseService.getTimestampNow()} as ItemOption,
          'id',
          itemId,
        );
      }
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Item>(this.dbProfile, this.dbTable, 'id', id);
    const items: any[] = [];
    const effects: any[] = [];
    const effectsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).effects.fields.name.condition;
    const requirementsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).requirements.fields;
    const optionChoiceIdConditions = (requirementsFields.editor_option_choice_type_id.condition as TypeMap<string, any>)
      .editor_option_type_id;
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableRequirements} WHERE isactive = 1 and item_id = ${record.id}`,
    );
    for (const item of list) {
      // @ts-ignore
      const itm = requirementsFields.editor_option_type_id.data.find((it) => it.id === item.editor_option_type_id);
      let item2 = null;
      if ([75, 76, 77, 78].includes(item.editor_option_type_id)) {
        item2 = optionChoiceIdConditions[item.editor_option_type_id].data.find(
          (it: {id: any}) =>
            it.id ===
            (item.editor_option_type_id === 78
              ? item.editor_option_choice_type_id
              : +item.editor_option_choice_type_id),
        );
      }
      items.push({
        editor_option_type_id: itm ? itm.value : item.editor_option_type_id,
        editor_option_choice_type_id: item2 ? item2.value : item.editor_option_choice_type_id,
        required_value: +item.required_value,
      });
    }
    for (let i = 1; i <= ((this.formConfig.subForms as TypeMap<string, SubFormType>).effects.maxCount as number); i++) {
      // @ts-ignore
      const type = record[`effect${i}type`];
      if (type) {
        let itm = null;
        // @ts-ignore
        let name = record[`effect${i}name`];
        // @ts-ignore
        let value = record[`effect${i}value`];
        let percentage = '';
        if (this.specialType.includes(type)) {
          name = value;
          value = '';
        } else if (type === 'Bonus') {
          // @ts-ignore
          const bon = record[`effect${i}value`].split('|');
          value = bon[0];
          percentage = bon[1];
        }
        if (type === 'Stat') {
          // @ts-ignore
          itm = effectsFields.type.Stat.data ? effectsFields.type.Stat.data.find((it) => it.id === name) : undefined;
        } else if (type === 'UseAbility' || type === 'AutoAttack' || type === 'SocketAbility') {
          // @ts-ignore
          itm = effectsFields.type.UseAbility.data
            ? effectsFields.type.UseAbility.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'SocketEffect') {
          // @ts-ignore
          itm = effectsFields.type.SocketEffect.data
            ? effectsFields.type.SocketEffect.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'ClaimObject') {
          // @ts-ignore
          itm = effectsFields.type.ClaimObject.data
            ? effectsFields.type.ClaimObject.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'CreateClaim') {
          // @ts-ignore
          itm = this.claimTypeList.find((it) => it.id.toString() === name.toString());
        } else if (type === 'StartQuest') {
          // @ts-ignore
          itm = effectsFields.type.StartQuest.data
            ? effectsFields.type.StartQuest.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'Currency') {
          // @ts-ignore
          itm = effectsFields.type.Currency.data
            ? effectsFields.type.Currency.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'UseAmmo') {
          // @ts-ignore
          itm = effectsFields.type.UseAmmo.data
            ? effectsFields.type.UseAmmo.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'CraftsItem') {
          // @ts-ignore
          itm = effectsFields.type.CraftsItem.data
            ? effectsFields.type.CraftsItem.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'Sockets') {
          // @ts-ignore
          itm = effectsFields.type.Sockets.data
            ? effectsFields.type.Sockets.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'Blueprint') {
          // @ts-ignore
          itm = effectsFields.type.Blueprint.data
            ? effectsFields.type.Blueprint.data.find((it) => it.id === +name)
            : undefined;
        } else if (type === 'Bonus') {
          // @ts-ignore
          itm = effectsFields.type.Bonus.data ? effectsFields.type.Bonus.data.find((it) => it.id === +name) : undefined;
        } else if (type === 'Achievement') {
          // @ts-ignore
          itm = effectsFields.type.Achievement.data
            ? effectsFields.type.Achievement.data.find((it) => it.id === +name)
            : undefined;
        }
        effects.push({
          type,
          // @ts-ignore
          name: itm ? itm.value : record[`effect${i}name`],
          value,
          percentage,
        });
      }
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {effects, requirements: items}},
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('effects') as FormArray).clear();
    (form.get('requirements') as FormArray).clear();
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

  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      icon: '',
      itemType: '',
      subType: ['', Validators.required],
      slot: ['', Validators.required],
      display: '',
      itemQuality: [null, Validators.required],
      binding: ['', Validators.required],
      isUnique: false,
      stackLimit: [1, [Validators.min(1), Validators.required]],
      purchaseCurrency: [null, Validators.required],
      purchaseCost: [0, [Validators.min(0)]],
      sellable: false,
      damage: [0, [Validators.min(0)]],
      damageMax: [0, [Validators.min(0)]],
      delay: [0, [Validators.min(0), Validators.required]],
      toolTip: '',
      enchant_profile_id: 0,
      auctionHouse: false,
      skillExp: [0, [Validators.min(0)]],
      gear_score: [0, [Validators.min(0)]],
      weight: [0, Validators.min(0)],
      durability: [0, Validators.min(0)],
      autoattack: -1,
      socket_type: '',
      ammotype: -1,
      death_loss: [0, [Validators.min(0), Validators.max(100)]],
      parry: false,
      oadelete: false,
      passive_ability: -1,
      shopSlots: [0, [Validators.min(0)]],
      shopMobTemplate: '',
      shopTag: '',
      numShops: [1, [Validators.min(1)]],
      shopTimeOut: [0, [Validators.min(0)]],
      shopDestroyOnLogOut: true,
      effects: new FormArray([]),
      requirements: new FormArray([]),
      repairable: true,
      slot1: '',
      slot1h: '',
      slot2: '',
      slot2h: '',
      slot3: '',
      slot3h: '',
      slot4: '',
      slot4h: '',
      slot5: '',
      slot5h: '',
      slot6: '',
      slot6h: '',
      slot7: '',
      slot7h: '',
      slot8: '',
      slot8h: '',
      slot9: '',
      slot9h: '',
      slot10: '',
      slot10h: '',
      drawWeaponEffect1: '',
      drawWeaponTime1: [1000, [Validators.min(0)]],
      holsteringWeaponEffect1: '',
      holsteringWeaponTime1: [1000, [Validators.min(0)]],
      drawWeaponEffect2: '',
      drawWeaponTime2: [1000, [Validators.min(0)]],
      holsteringWeaponEffect2: '',
      holsteringWeaponTime2: [1000, [Validators.min(0)]],
      drawWeaponEffect3: '',
      drawWeaponTime3: [1000, [Validators.min(0)]],
      holsteringWeaponEffect3: '',
      holsteringWeaponTime3: [1000, [Validators.min(1)]],
      drawWeaponEffect4: '',
      drawWeaponTime4: [1000, [Validators.min(0)]],
      holsteringWeaponEffect4: '',
      holsteringWeaponTime4: [1000, [Validators.min(0)]],
      drawWeaponEffect5: '',
      drawWeaponTime5: [1000, [Validators.min(0)]],
      holsteringWeaponEffect5: '',
      holsteringWeaponTime5: [1000, [Validators.min(0)]],
      drawWeaponEffect6: '',
      drawWeaponTime6: [1000, [Validators.min(0)]],
      holsteringWeaponEffect6: '',
      holsteringWeaponTime6: [1000, [Validators.min(0)]],
      drawWeaponEffect7: '',
      drawWeaponTime7: [1000, [Validators.min(0)]],
      holsteringWeaponEffect7: '',
      holsteringWeaponTime7: [1000, [Validators.min(0)]],
      drawWeaponEffect8: '',
      drawWeaponTime8: [1000, [Validators.min(0)]],
      holsteringWeaponEffect8: '',
      holsteringWeaponTime8: [1000, [Validators.min(0)]],
      drawWeaponEffect9: '',
      drawWeaponTime9: [1000, [Validators.min(0)]],
      holsteringWeaponEffect9: '',
      holsteringWeaponTime9: [1000, [Validators.min(0)]],
      drawWeaponEffect10: '',
      drawWeaponTime10: [1000, [Validators.min(0)]],
      holsteringWeaponEffect10: '',
      holsteringWeaponTime10: [1000, [Validators.min(0)]],
      weapon_profile_id: -1,
      audio_profile_id: -1,
      ground_prefab:'',
    });
    (form.get('itemType') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((itemType) => {
        const slotValidators = [];
        const subTypeValidators = [];
        const damageMaxValidators = [];
        const delayValidators = [Validators.min(0)];
        formConfig.fields.skillExp.type = FormFieldType.hidden;
        formConfig.fields.display.type = FormFieldType.hidden;
        formConfig.fields.drawWeaponEffect1.width = -1;
        formConfig.fields.holsteringWeaponEffect1.width = -1;
        formConfig.fields.drawWeaponEffect2.width = -1;
        formConfig.fields.holsteringWeaponEffect2.width = -1;
        formConfig.fields.drawWeaponEffect3.width = -1;
        formConfig.fields.holsteringWeaponEffect3.width = -1;
        formConfig.fields.drawWeaponEffect4.width = -1;
        formConfig.fields.holsteringWeaponEffect4.width = -1;
        formConfig.fields.drawWeaponEffect5.width = -1;
        formConfig.fields.holsteringWeaponEffect5.width = -1;
        formConfig.fields.drawWeaponEffect6.width = -1;
        formConfig.fields.holsteringWeaponEffect6.width = -1;
        formConfig.fields.drawWeaponEffect7.width = -1;
        formConfig.fields.holsteringWeaponEffect7.width = -1;
        formConfig.fields.drawWeaponEffect8.width = -1;
        formConfig.fields.holsteringWeaponEffect8.width = -1;
        formConfig.fields.drawWeaponEffect9.width = -1;
        formConfig.fields.holsteringWeaponEffect9.width = -1;
        formConfig.fields.drawWeaponEffect10.width = -1;
        formConfig.fields.holsteringWeaponEffect10.width = -1;
        formConfig.fields.drawWeaponTime1.width = -1;
        formConfig.fields.holsteringWeaponTime1.width = -1;
        formConfig.fields.drawWeaponTime2.width = -1;
        formConfig.fields.holsteringWeaponTime2.width = -1;
        formConfig.fields.drawWeaponTime3.width = -1;
        formConfig.fields.holsteringWeaponTime3.width = -1;
        formConfig.fields.drawWeaponTime4.width = -1;
        formConfig.fields.holsteringWeaponTime4.width = -1;
        formConfig.fields.drawWeaponTime5.width = -1;
        formConfig.fields.holsteringWeaponTime5.width = -1;
        formConfig.fields.drawWeaponTime6.width = -1;
        formConfig.fields.holsteringWeaponTime6.width = -1;
        formConfig.fields.drawWeaponTime7.width = -1;
        formConfig.fields.holsteringWeaponTime7.width = -1;
        formConfig.fields.drawWeaponTime8.width = -1;
        formConfig.fields.holsteringWeaponTime8.width = -1;
        formConfig.fields.drawWeaponTime9.width = -1;
        formConfig.fields.holsteringWeaponTime9.width = -1;
        formConfig.fields.drawWeaponTime10.width = -1;
        formConfig.fields.holsteringWeaponTime10.width = -1;
        formConfig.fields.subType.type = FormFieldType.hidden;
        formConfig.fields.subType.allowNew = false;
        formConfig.fields.slot.type = FormFieldType.hidden;
        formConfig.fields.slot.label = this.translate.instant(this.tableKey + '.SLOT');
        formConfig.fields.gear_score.type = FormFieldType.hidden;
        formConfig.fields.damage.type = FormFieldType.hidden;
        formConfig.fields.damageMax.type = FormFieldType.hidden;
        formConfig.fields.delay.type = FormFieldType.hidden;
        formConfig.fields.enchant_profile_id.type = FormFieldType.hidden;
        formConfig.fields.stackLimit.label = this.translate.instant(this.tableKey + '.STACKLIMIT');
        formConfig.fields.oadelete.width = 25;
        formConfig.fields.autoattack.width = -1;
        formConfig.fields.ammotype.width = -1;
        formConfig.fields.parry.width = -1;
        formConfig.fields.durability.width = -1;
        formConfig.fields.isUnique.width = -1;
        formConfig.fields.repairable.width = -1;
        formConfig.fields.weapon_profile_id.type = FormFieldType.hidden;
        if (itemType === itemMainTypes.Weapon) {
          formConfig.fields.oadelete.width = -1;
          formConfig.fields.autoattack.width = 25;
          formConfig.fields.ammotype.width = 25;
          formConfig.fields.durability.width = 25;
          formConfig.fields.parry.width = 25;
          formConfig.fields.isUnique.width = 25;
          formConfig.fields.repairable.width = 25;
          formConfig.fields.display.type = FormFieldType.file;
          formConfig.fields.skillExp.type = FormFieldType.integer;
          formConfig.fields.subType.type = FormFieldType.dynamicDropdown;
          formConfig.fields.subType.fieldConfig = weaponTypeFieldConfig;
          formConfig.fields.subType.allowNew = true;
          formConfig.fields.damage.type = FormFieldType.integer;
          formConfig.fields.damageMax.type = FormFieldType.integer;
          formConfig.fields.delay.type = FormFieldType.decimal;
          formConfig.fields.gear_score.type = FormFieldType.integer;
          formConfig.fields.enchant_profile_id.type = FormFieldType.dynamicDropdown;
          formConfig.fields.slot.type = FormFieldType.dropdown;
          formConfig.fields.slot.data = this.slotWeaponOptions;
          formConfig.fields.weapon_profile_id.type = FormFieldType.dynamicDropdown;
          damageMaxValidators.push(Validators.min((form.get('damage') as AbstractControl).value));
          subTypeValidators.push(Validators.required);
          slotValidators.push(Validators.required);
          delayValidators.push(Validators.required);
        } else if (itemType === itemMainTypes.Tool) {
          formConfig.fields.damage.type = FormFieldType.hidden;
          formConfig.fields.damageMax.type = FormFieldType.hidden;
          formConfig.fields.delay.type = FormFieldType.hidden;
          formConfig.fields.autoattack.width = -1;
          formConfig.fields.oadelete.width = -1;
          formConfig.fields.ammotype.width = 25;
          formConfig.fields.durability.width = 25;
          formConfig.fields.parry.width = 25;
          formConfig.fields.isUnique.width = 25;
          formConfig.fields.repairable.width = 25;
          formConfig.fields.display.type = FormFieldType.file;
          formConfig.fields.skillExp.type = FormFieldType.integer;
          formConfig.fields.subType.type = FormFieldType.dynamicDropdown;
          formConfig.fields.subType.allowNew = true;
          formConfig.fields.subType.fieldConfig = toolTypeFieldConfig;
          formConfig.fields.gear_score.type = FormFieldType.integer;
          formConfig.fields.enchant_profile_id.type = FormFieldType.dynamicDropdown;
          formConfig.fields.slot.type = FormFieldType.dropdown;
          formConfig.fields.slot.data = this.slotToolOptions;
          subTypeValidators.push(Validators.required);
          slotValidators.push(Validators.required);
        } else if (itemType === itemMainTypes.Armor) {
          formConfig.fields.oadelete.width = -1;
          formConfig.fields.durability.width = 25;
          formConfig.fields.parry.width = 25;
          formConfig.fields.isUnique.width = 25;
          formConfig.fields.repairable.width = 25;
          formConfig.fields.display.type = FormFieldType.file;
          formConfig.fields.subType.type = FormFieldType.dynamicDropdown;
          formConfig.fields.subType.fieldConfig = armorTypeFieldConfig;
          formConfig.fields.subType.allowNew = true;
          formConfig.fields.gear_score.type = FormFieldType.integer;
          formConfig.fields.enchant_profile_id.type = FormFieldType.dynamicDropdown;
          formConfig.fields.slot.type = FormFieldType.dropdown;
          formConfig.fields.slot.data = this.slotArmorOptions;
          subTypeValidators.push(Validators.required);
          slotValidators.push(Validators.required);
        } else if (itemType === itemMainTypes.Bag) {
          formConfig.fields.stackLimit.label = this.translate.instant(this.tableKey + '.NUMBER_OF_SLOTS');
        } else if (itemType === itemMainTypes.Container) {
          formConfig.fields.stackLimit.label = this.translate.instant(this.tableKey + '.NUMBER_OF_SLOTS');
        } else if (itemType === itemMainTypes.Ammo) {
          formConfig.fields.slot.type = FormFieldType.dropdown;
          formConfig.fields.slot.data = this.ammoSubTypes;
          formConfig.fields.slot.label = this.translate.instant(this.tableKey + '.AMMO_TYPE');
          formConfig.fields.damage.type = FormFieldType.integer;
          formConfig.fields.damage.label = this.translate.instant(this.tableKey + '.DAMAGE_SIMPLE');
          slotValidators.push(Validators.required);
        }
        formConfig = this.shopFormSection(itemType, formConfig);
        (form.get('slot') as AbstractControl).setValidators(slotValidators);
        (form.get('slot') as AbstractControl).updateValueAndValidity();
        (form.get('subType') as AbstractControl).setValidators(subTypeValidators);
        (form.get('subType') as AbstractControl).updateValueAndValidity();
        (form.get('delay') as AbstractControl).setValidators(delayValidators);
        (form.get('delay') as AbstractControl).updateValueAndValidity();
        (form.get('damageMax') as AbstractControl).setValidators(damageMaxValidators);
        (form.get('damageMax') as AbstractControl).updateValueAndValidity();
      });
    (form.get('damage') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      const validators = [];
      if (value !== null && (form.get('itemType') as AbstractControl).value === itemMainTypes.Weapon) {
        validators.push(Validators.min(value));
      }
      (form.get('damageMax') as AbstractControl).setValidators(validators);
      (form.get('damageMax') as AbstractControl).updateValueAndValidity();
    });
    (form.get('slot') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value && value !== '' && (form.get('itemType') as AbstractControl).value !== itemMainTypes.Ammo) {
        this.databaseService
          .customQuery(
            this.dbProfile,
            `Select s.name name from ${this.dbTableSlot} s join ${this.dbTableSlotsInGroup} sig on  s.id = sig.slot_id join ${this.dbTableSlotgroup} g on sig.slot_group_id = g.id where g.name like ?`,
            [value],
          )
          .then((slots) => {
            if (slots.length > 0) {
              for (let i = 1; i <= 10; i++) {
                if (i <= slots.length) {
                  (form.get(`slot${i}`) as AbstractControl).setValue(slots[i - 1].name);
                  (form.get(`slot${i}`) as AbstractControl).disable();
                  formConfig.fields[`slot${i}`].width = 25;
                  formConfig.fields[`slot${i}h`].width = 75;
                  formConfig.fields[`drawWeaponEffect${i}`].width = 75;
                  formConfig.fields[`drawWeaponTime${i}`].width = 25;
                  formConfig.fields[`holsteringWeaponEffect${i}`].width = 75;
                  formConfig.fields[`holsteringWeaponTime${i}`].width = 25;
                  (form.get(`drawWeaponEffect${i}`) as AbstractControl).setValidators([]);
                  (form.get(`drawWeaponTime${i}`) as AbstractControl).setValidators([
                     Validators.min(0),
                  ]);
                  (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).setValidators([]);
                  (form.get(`holsteringWeaponTime${i}`) as AbstractControl).setValidators([
                    Validators.min(0),
                  ]);
                  (form.get(`drawWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`drawWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`holsteringWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
                } else {
                  formConfig.fields[`slot${i}`].width = -1;
                  formConfig.fields[`slot${i}h`].width = -1;
                  formConfig.fields[`drawWeaponEffect${i}`].width = -1;
                  formConfig.fields[`drawWeaponTime${i}`].width = -1;
                  formConfig.fields[`holsteringWeaponEffect${i}`].width = -1;
                  formConfig.fields[`holsteringWeaponTime${i}`].width = -1;
                  (form.get(`drawWeaponEffect${i}`) as AbstractControl).setValidators([]);
                  (form.get(`drawWeaponTime${i}`) as AbstractControl).setValidators([]);
                  (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).setValidators([]);
                  (form.get(`holsteringWeaponTime${i}`) as AbstractControl).setValidators([]);
                  (form.get(`drawWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`drawWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                  (form.get(`holsteringWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
                }
              }
              for (const slot of slots) {
              }
            } else {
              (form.get(`slot1`) as AbstractControl).setValue(value);
              (form.get(`slot1`) as AbstractControl).disable();
              formConfig.fields.slot1.width = 25;
              formConfig.fields.slot1h.width = 75;
              formConfig.fields.drawWeaponEffect1.width = 75;
              formConfig.fields.drawWeaponTime1.width = 25;
              formConfig.fields.holsteringWeaponEffect1.width = 75;
              formConfig.fields.holsteringWeaponTime1.width = 25;
              (form.get(`drawWeaponEffect1`) as AbstractControl).setValidators([]);
              (form.get(`drawWeaponTime1`) as AbstractControl).setValidators([ Validators.min(0)]);
              (form.get(`holsteringWeaponEffect1`) as AbstractControl).setValidators([]);
              (form.get(`holsteringWeaponTime1`) as AbstractControl).setValidators([
                 Validators.min(0),
              ]);
              (form.get(`drawWeaponEffect1`) as AbstractControl).updateValueAndValidity();
              (form.get(`drawWeaponTime1`) as AbstractControl).updateValueAndValidity();
              (form.get(`holsteringWeaponEffect1`) as AbstractControl).updateValueAndValidity();
              (form.get(`holsteringWeaponTime1`) as AbstractControl).updateValueAndValidity();

              for (let i = 2; i <= 10; i++) {
                (form.get(`slot${i}`) as AbstractControl).setValue('');
                formConfig.fields[`slot${i}`].width = -1;
                formConfig.fields[`slot${i}h`].width = -1;
                formConfig.fields[`drawWeaponEffect${i}`].width = -1;
                formConfig.fields[`drawWeaponTime${i}`].width = -1;
                formConfig.fields[`holsteringWeaponEffect${i}`].width = -1;
                formConfig.fields[`holsteringWeaponTime${i}`].width = -1;
                (form.get(`drawWeaponEffect${i}`) as AbstractControl).setValidators([]);
                (form.get(`drawWeaponTime${i}`) as AbstractControl).setValidators([]);
                (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).setValidators([]);
                (form.get(`holsteringWeaponTime${i}`) as AbstractControl).setValidators([]);
                (form.get(`drawWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                (form.get(`drawWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
                (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
                (form.get(`holsteringWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
              }
            }
          });
      } else {
        for (let i = 1; i <= 10; i++) {
          (form.get(`slot${i}`) as AbstractControl).setValue('');
          formConfig.fields[`slot${i}`].width = -1;
          formConfig.fields[`slot${i}h`].width = -1;
          formConfig.fields[`drawWeaponEffect${i}`].width = -1;
          formConfig.fields[`drawWeaponTime${i}`].width = -1;
          formConfig.fields[`holsteringWeaponEffect${i}`].width = -1;
          formConfig.fields[`holsteringWeaponTime${i}`].width = -1;
          (form.get(`drawWeaponEffect${i}`) as AbstractControl).setValidators([]);
          (form.get(`drawWeaponTime${i}`) as AbstractControl).setValidators([]);
          (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).setValidators([]);
          (form.get(`holsteringWeaponTime${i}`) as AbstractControl).setValidators([]);
          (form.get(`drawWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
          (form.get(`drawWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
          (form.get(`holsteringWeaponEffect${i}`) as AbstractControl).updateValueAndValidity();
          (form.get(`holsteringWeaponTime${i}`) as AbstractControl).updateValueAndValidity();
        }
      }
    });
    return form;
  }

  private shopFormSection(type: itemMainTypes, formConfig: FormConfig): FormConfig {
    if (
      [
        itemMainTypes.Weapon,
        itemMainTypes.Tool,
        itemMainTypes.Armor,
        itemMainTypes.Ammo,
        itemMainTypes.Bag,
        itemMainTypes.Container,
      ].includes(type)
    ) {
      formConfig.fields.title_1.type = FormFieldType.hidden;
      formConfig.fields.shopSlots.width = -1;
      formConfig.fields.shopMobTemplate.width = -1;
      formConfig.fields.shopTag.width = -1;
      formConfig.fields.numShops.width = -1;
      formConfig.fields.shopTimeOut.width = -1;
      formConfig.fields.shopDestroyOnLogOut.width = -1;
    } else {
      formConfig.fields.title_1.type = FormFieldType.title;
      formConfig.fields.shopSlots.width = 33;
      formConfig.fields.shopMobTemplate.width = 33;
      formConfig.fields.shopTag.width = 33;
      formConfig.fields.numShops.width = 33;
      formConfig.fields.shopTimeOut.width = 33;
      formConfig.fields.shopDestroyOnLogOut.width = 33;
    }
    return formConfig;
  }
}
