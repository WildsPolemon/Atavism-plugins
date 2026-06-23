import {Injectable} from '@angular/core';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  abilitiesCoordEffectsTable,
  abilitiesPowerUpTable,
  abilitiesTable,
  abilitiesTriggersTable,
  abilityAbilitiesTable,
  abilityCombosTable,
  abilityEffectsTable,
} from '../tables.data';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {
  Ability,
  AbilityAbilities,
  AbilityCombo,
  AbilityCoordEffect,
  AbilityEffect,
  AbilityPower,
  AbilityTriggers,
  AbilityType,
  AoeTypes,
  CoordEffectOption,
  PredictionOption,
  TargetCountTypeOption,
  TargetOption
} from './abilities.data';
import {
  abilityFieldConfig,
  abilityTagsFieldConfig,
  abilityTriggerFieldConfig,
  coordFieldConfig,
  damageFieldConfig,
  effectFieldConfig,
  effectTagsFieldConfig,
  itemFieldConfig,
  skillFieldConfig,
  speciesFieldConfig,
  targetTypeFieldConfig,
  targetTypeNotGroupFieldConfig,
  targetSubTypeFieldConfig,
  vitalityStatFieldConfig,
  weaponTypeIdFieldConfig,
  targetSubTypeNotEnemyFieldConfig,
  targetSubTypeFriendEnemyFieldConfig,
  targetSubTypeOnlySelfFieldConfig,
  targetSubTypeOnlyFriendlyFieldConfig,
  targetTypeSingleAoEFieldConfig,
  targetSubTypeOnlyEnemyFieldConfig,
  targetSubTypeOnlyFriendlySelfFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AbilitiesService {
  public tableKey = TabTypes.ABILITY;
  private readonly listStream = new BehaviorSubject<Ability[]>([]);
  public list = this.listStream.asObservable();
  private abilityPowerForm: SubFieldType = {
    id: {value: '', required: false},
    ability_id: {value: '', required: false},
    thresholdMaxTime: {value: 0, required: true, min: 0},
    effects: {isArray: true},
    abilities: {isArray: true},
    triggers: {isArray: true},
    coordEffects: {isArray: true},
  };
  private coordEffectForm: SubFieldType = {
    id: {value: '', required: false},
    ability_power_id: {value: '', required: false},
    coordEffectEvent: {value: '', required: true},
    coordEffect: {value: '', required: true},
  };
  private comboForm: SubFieldType = {
    id: {value: '', required: false},
    ability_parent_id: {value: '', required: false},
    ability_sub_id: {value: '', required: false},
    chance_min: {value: 0, required: true, min: 0, max: 100},
    chance_max: {value: 100, required: true, min: 1, max: 100},
    show_in_center_ui: {value: 1},
    replace_in_slot: {value: 1},
    check_cooldown: {value: 1},
    time: {value: 0, required: true, min: 0},
  };
  private effectForm: SubFieldType = {
    id: {value: '', required: false},
    ability_power_id: {value: '', required: false},
    target: {value: 'target', required: true},
    effect: {value: '', required: true},
    delay: {value: 0, required: true, min: 0},
    chance_min: {value: 100, required: true, min: 0, max: 100},
    chance_max: {value: 100, required: true, min: 1, max: 100},
  };
  private abilityForm: SubFieldType = {
    id: {value: '', required: false},
    ability_power_id: {value: '', required: false},
    target: {value: 'target', required: true},
    ability: {value: '', required: true},
    delay: {value: 0, required: true, min: 0},
    chance_min: {value: 100, required: true, min: 0, max: 100},
    chance_max: {value: 100, required: true, min: 1, max: 100},
  };
  private triggerForm: SubFieldType = {
    id: {value: '', required: false},
    ability_power_id: {value: '', required: false},
    trigger_id: {value: '', required: true},
  };
  private profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = abilitiesTable;
  public dbTableCombo = abilityCombosTable;
  public dbTableEffects = abilityEffectsTable;
  public dbTableAbilities = abilityAbilitiesTable;
  public dbTableTriggers = abilitiesTriggersTable;
  public dbTableCoordEffects = abilitiesCoordEffectsTable;
  public dbTableAbilityPower = abilitiesPowerUpTable;
  private readonly abilityTypes: DropdownValue[] = [
    {id: AbilityType.AttackAbility, value: this.translate.instant(this.tableKey + '.ABILITY_TYPE.AttackAbility')},
    {id: AbilityType.EffectAbility, value: this.translate.instant(this.tableKey + '.ABILITY_TYPE.EffectAbility')},
    {
      id: AbilityType.FriendlyEffectAbility,
      value: this.translate.instant(this.tableKey + '.ABILITY_TYPE.FriendlyEffectAbility'),
    },
  ];
  private readonly combatStates: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.IN_COMBAT')},
    {id: 1, value: this.translate.instant(this.tableKey + '.OUTSIDE_COMBAT')},
    {id: 2, value: this.translate.instant(this.tableKey + '.BOTH')},
  ];
  private readonly targetStates: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.DEAD')},
    {id: 1, value: this.translate.instant(this.tableKey + '.ALIVE')},
    {id: 2, value: this.translate.instant(this.tableKey + '.SPIRIT')},
    {id: 3, value: this.translate.instant(this.tableKey + '.DEAD_ALIVE')},
    {id: 4, value: this.translate.instant(this.tableKey + '.DEAD_SPIRIT')},
    {id: 5, value: this.translate.instant(this.tableKey + '.ALIVE_SPIRIT')},
    {id: 6, value: this.translate.instant(this.tableKey + '.ANY')},
  ];
  private readonly casterStates: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.DEAD')},
    {id: 1, value: this.translate.instant(this.tableKey + '.ALIVE')},
    {id: 2, value: this.translate.instant(this.tableKey + '.SPIRIT')},
    {id: 3, value: this.translate.instant(this.tableKey + '.DEAD_ALIVE')},
    {id: 4, value: this.translate.instant(this.tableKey + '.DEAD_SPIRIT')},
    {id: 5, value: this.translate.instant(this.tableKey + '.ALIVE_SPIRIT')},
    {id: 6, value: this.translate.instant(this.tableKey + '.ANY')},
  ];
  private readonly aoeTypes: DropdownValue[] = [
    {id: AoeTypes.PlayerRadius, value: this.translate.instant(this.tableKey + '.PlayerRadius')},
    {id: AoeTypes.TargetRadius, value: this.translate.instant(this.tableKey + '.TargetRadius')},
    {id: AoeTypes.LocationRadius, value: this.translate.instant(this.tableKey + '.LocationRadius')},
  ];
  private readonly groupTypes: DropdownValue[] = [
    {id: AoeTypes.PlayerRadius, value: this.translate.instant(this.tableKey + '.PlayerRadius')},
  ];
  private readonly targetOptions: DropdownValue[] = [
    {id: TargetOption.target, value: this.translate.instant(this.tableKey + '.TARGET')},
    {id: TargetOption.caster, value: this.translate.instant(this.tableKey + '.CASTER')},
  ];
  private readonly coordEffectOptions: DropdownValue[] = [
    {id: CoordEffectOption.activating, value: this.translate.instant(this.tableKey + '.ACTIVATING')},
    {id: CoordEffectOption.activated, value: this.translate.instant(this.tableKey + '.ACTIVATED')},
    {id: CoordEffectOption.ability_pulse, value: this.translate.instant(this.tableKey + '.ABILITY_PULSE')},
    {id: CoordEffectOption.channelling, value: this.translate.instant(this.tableKey + '.CHANNELLING_DROPDOWN')},
    {id: CoordEffectOption.completed, value: this.translate.instant(this.tableKey + '.COMPLETED')},
    {id: CoordEffectOption.interrupted, value: this.translate.instant(this.tableKey + '.INTERRUPTED')},
    {id: CoordEffectOption.failed, value: this.translate.instant(this.tableKey + '.FAILED')},
  ];
  private readonly predictionOptions: DropdownValue[] = [
    {id: PredictionOption.realtime, value: this.translate.instant(this.tableKey + '.REALTIME')},
    {id: PredictionOption.predicted, value: this.translate.instant(this.tableKey + '.PREDICTED')},
  ];
  private readonly aoeTargetCountTypeOptions: DropdownValue[] = [
    {id: TargetCountTypeOption.unlimited, value: this.translate.instant(this.tableKey + '.UNLIMITED')},
    {id: TargetCountTypeOption.first, value: this.translate.instant(this.tableKey + '.FIRST')},
    {id: TargetCountTypeOption.random, value: this.translate.instant(this.tableKey + '.RANDOM')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      tooltip: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      abilityType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.abilityTypes,
      },
      skill: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: skillFieldConfig,
        data: [],
      },
      exp: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      skill_up_chance: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      damageType: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: damageFieldConfig,
        data: [],
      },
      passive: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      chance: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.decimal},
      channelling: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      channelling_in_run: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      channelling_pulse_time: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.decimal,
      },
      channelling_pulse_num: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      activationLength: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      attack_time: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      miss_chance: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      castingInRun: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      skipChecks: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      checkBusy: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      makeBusy: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      enemyTargetChangeToSelf: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      drawnWeaponBefore: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      stealth_reduce: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      interruptible: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      interruption_chance: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.decimal,
      },
      toggle: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      pvp_enter: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      enterCombatState: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      tag_count: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      tag_disable: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      activationCostType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: vitalityStatFieldConfig,
        data: [],
      },
      activationCost: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      activationCostPercentage: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      combatState: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.combatStates,
      },
      casterEffectRequired: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        data: [],
      },
      casterEffectConsumed: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      targetEffectRequired: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        data: [],
      },
      targetEffectConsumed: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      reagentRequired: {type: ConfigTypes.dropdown, visible: false, data: []},
      reagentCount: {type: ConfigTypes.numberType, visible: false},
      reagentConsumed: {type: ConfigTypes.booleanType, visible: false},
      reagent2Required: {type: ConfigTypes.dropdown, visible: false, data: []},
      reagent2Count: {type: ConfigTypes.numberType, visible: false},
      reagent2Consumed: {type: ConfigTypes.booleanType, visible: false},
      reagent3Required: {type: ConfigTypes.dropdown, visible: false, data: []},
      reagent3Count: {type: ConfigTypes.numberType, visible: false},
      reagent3Consumed: {type: ConfigTypes.booleanType, visible: false},
      consumeOnActivation: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      ammoUsed: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      weaponRequired: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      targetType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      targetSubType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      targetState: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.targetStates,
      },
      casterState: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.casterStates,
      },
      aoeType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.aoeTypes,
      },
      chunk_length: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.decimal,
      },
      prediction: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.predictionOptions,
      },
      aoe_target_count_type: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.aoeTargetCountTypeOptions,
      },
      aoe_target_count: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      aoeRadius: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      aoeAngle: {type: ConfigTypes.numberType, visible: false, filterVisible: false, filterType: FilterTypes.integer},
      aoePrefab: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      activationDelay: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.decimal,
      },
      speciesTargetReq: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      minRange: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      maxRange: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      speed: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      reqTarget: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      reqFacingTarget: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      line_of_sight: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      pulseCostType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: vitalityStatFieldConfig,
        data: [],
      },
      pulseCost: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      pulseCostPercentage: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      pulseCasterEffectConsumed: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      pulseTargetEffectConsumed: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      pulseReagentRequired: {type: ConfigTypes.dropdown, visible: false, data: []},
      pulseReagentCount: {type: ConfigTypes.numberType, visible: false},
      pulseReagentConsumed: {type: ConfigTypes.booleanType, visible: false},
      pulseReagent2Required: {type: ConfigTypes.dropdown, visible: false, data: []},
      pulseReagent2Count: {type: ConfigTypes.numberType, visible: false},
      pulseReagent2Consumed: {type: ConfigTypes.booleanType, visible: false},
      pulseReagent3Required: {type: ConfigTypes.dropdown, visible: false, data: []},
      pulseReagent3Count: {type: ConfigTypes.numberType, visible: false},
      pulseReagent3Consumed: {type: ConfigTypes.booleanType, visible: false},
      pulseAmmoUsed: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      globalCooldown: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      weaponCooldown: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      cooldown1Type: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      cooldown1Duration: {
        type: ConfigTypes.numberType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.decimal,
      },
      startCooldownsOnActivation: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      attack_building: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      reagentReq: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      reagentC: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.integer,
      },
      reagentConsume: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.booleanType,
      },
      coordEffectEvent: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dropdown,
        data: this.coordEffectOptions,
      },
      coordEffect: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: coordFieldConfig,
      },
      powerUpCoordEffect: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: coordFieldConfig,
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
  private actTargetLabel = this.translate.instant(this.tableKey + '.ACTIVATIONTARGET');
  private actEffectLabel = this.translate.instant(this.tableKey + '.ACTIVATIONEFFECT');
  private actTargetHelpLabel = this.translate.instant(this.tableKey + '.ACTIVATIONTARGET_HELP');
  private actEffectHelpLabel = this.translate.instant(this.tableKey + '.ACTIVATIONEFFECT_HELP');
  private effectEventLabel = this.translate.instant(this.tableKey + '.COORDEFFECTEVENT');
  private coordEffectLabel = this.translate.instant(this.tableKey + '.COORDEFFECT');
  private effectEventHelpLabel = this.translate.instant(this.tableKey + '.COORDEFFECTEVENT_HELP');
  private coordEffectHelpLabel = this.translate.instant(this.tableKey + '.COORDEFFECT_HELP');
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      abilityType: {
        name: 'abilityType',
        type: FormFieldType.dropdown,
        require: true,
        width: 50,
        search: true,
        data: this.abilityTypes,
      },
      skill: {
        name: 'skill',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        allowNew: true,
        fieldConfig: skillFieldConfig,
      },
      skill_up_chance: {name: 'skill_up_chance', type: FormFieldType.integer, width: 25},
      exp: {name: 'exp', type: FormFieldType.integer, width: 50},
      damageType: {
        name: 'damageType',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        require: true,
        fieldConfig: damageFieldConfig,
        width: 50,
      },
      passive: {name: 'passive', type: FormFieldType.boolean, width: -1},
      chance: {name: 'chance', type: FormFieldType.decimal, width: -1},
      title6: {name: '', label: '', type: FormFieldType.title},
      channelling: {name: 'channelling', type: FormFieldType.boolean, width: 25},
      channelling_in_run: {name: 'channelling_in_run', type: FormFieldType.boolean, width: 25},
      channelling_pulse_time: {name: 'channelling_pulse_time', type: FormFieldType.decimal, width: 25},
      channelling_pulse_num: {name: 'channelling_pulse_num', type: FormFieldType.integer, width: 25},
      title8: {name: '', label: '', type: FormFieldType.title},
      activationLength: {name: 'activationLength', type: FormFieldType.decimal, require: true, width: 25},
      attack_time: {name: 'attack_time', type: FormFieldType.decimal, require: true, width: 25},
      castingInRun: {name: 'castingInRun', type: FormFieldType.boolean, width: 25},
      skipChecks: {name: 'skipChecks', type: FormFieldType.boolean, width: 25},
      checkBusy: {name: 'checkBusy', type: FormFieldType.boolean, width: 25},
      makeBusy: {name: 'makeBusy', type: FormFieldType.boolean, width: 25},
      weaponMustBeDrawn: {name: 'weaponMustBeDrawn', type: FormFieldType.boolean, width: 25},
      drawnWeaponBefore: {name: 'drawnWeaponBefore', type: FormFieldType.boolean, width: 25},
      miss_chance: {name: 'miss_chance', type: FormFieldType.decimal, width: 25},
      enterCombatState: {name: 'enterCombatState', type: FormFieldType.boolean, width: 25},
      h1: {name: '', type: FormFieldType.title, width: 50},
      stealth_reduce: {name: 'stealth_reduce', type: FormFieldType.boolean, width: 100},
      stealth_reduction_amount: {name: 'stealth_reduction_amount', type: FormFieldType.integer, width: -1},
      stealth_reduction_percentage: {name: 'stealth_reduction_percentage', type: FormFieldType.decimal, width: -1},
      stealth_reduction_timeout: {name: 'stealth_reduction_timeout', type: FormFieldType.integer, width: -1},
      interruptible: {name: 'interruptible', type: FormFieldType.boolean, width: 50},
      interruption_chance: {name: 'interruption_chance', type: FormFieldType.decimal, width: -1},
      title7: {name: '', label: '', type: FormFieldType.title},
      toggle: {name: 'toggle', type: FormFieldType.boolean, width: 25},
      pvp_enter: {name: 'pvp_enter', type: FormFieldType.boolean, width: -1},
      tag_count: {name: 'tag_count', type: FormFieldType.integer, width: -1},
      tag_disable: {
        name: 'tag_disable',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: abilityTagsFieldConfig,
        search: true,
        width: -1,
      },
      title1: {
        name: '',
        label: this.translate.instant(this.tableKey + '.TITLE1'),
        type: FormFieldType.title,
        width: 100,
      },
      activationCostType: {
        name: 'activationCostType',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        require: true,
        allowNew: true,
        fieldConfig: vitalityStatFieldConfig,
      },
      activationCost: {name: 'activationCost', type: FormFieldType.integer, require: true, width: 25},
      activationCostPercentage: {name: 'activationCostPercentage', type: FormFieldType.decimal, width: 25},
      combatState: {
        name: 'combatState',
        type: FormFieldType.dropdown,
        width: 25,
        require: true,
        hideNone: true,
        data: this.combatStates,
      },

      tags_on_caster: {
        name: 'tags_on_caster',
        type: FormFieldType.dynamicDropdown,
        width: 75,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
      },
      casterEffectConsumed: {name: 'casterEffectConsumed', type: FormFieldType.boolean, width: 25},
      tags_on_target: {
        name: 'tags_on_target',
        type: FormFieldType.dynamicDropdown,
        width: 75,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
      },
      targetEffectConsumed: {name: 'targetEffectConsumed', type: FormFieldType.boolean, width: 25},
      tags_not_on_caster: {
        name: 'tags_not_on_caster',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
        width: 100,
      },
      tags_not_on_target: {
        name: 'tags_not_on_target',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
        width: 100,
      },
      reagentRequired: {
        name: 'reagentRequired',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      reagentCount: {name: 'reagentCount', type: FormFieldType.integer, width: 33},
      reagentConsumed: {name: 'reagentConsumed', type: FormFieldType.boolean, width: 33},
      reagent2Required: {
        name: 'reagent2Required',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      reagent2Count: {name: 'reagent2Count', type: FormFieldType.integer, width: 33},
      reagent2Consumed: {name: 'reagent2Consumed', type: FormFieldType.boolean, width: 33},
      reagent3Required: {
        name: 'reagent3Required',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      reagent3Count: {name: 'reagent3Count', type: FormFieldType.integer, width: 33},
      reagent3Consumed: {name: 'reagent3Consumed', type: FormFieldType.boolean, width: 33},
      consumeOnActivation: {name: 'consumeOnActivation', type: FormFieldType.boolean, width: 50},
      ammoUsed: {name: 'ammoUsed', type: FormFieldType.integer, width: 50},
      weaponRequired: {
        name: 'weaponRequired',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: weaponTypeIdFieldConfig,
        multiple: true,
        width: 50,
      },
      targetType: {
        name: 'targetType',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        hideNone: true,
        width: 25,
        require: true,
      },
      targetSubType: {
        name: 'targetSubType',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        hideNone: true,
        width: 25,
        require: true,
      },
      aoeType: {name: 'aoeType', type: FormFieldType.dropdown, width: -1, hideNone: true, data: []},
      chunk_length: {name: 'chunk_length', type: FormFieldType.decimal, width: -1},
      prediction: {
        name: 'prediction',
        type: FormFieldType.dropdown,
        width: -1,
        hideNone: true,
        data: this.predictionOptions,
      },
      aoe_target_count_type: {
        name: 'aoe_target_count_type',
        type: FormFieldType.dropdown,
        width: -1,
        hideNone: true,
        data: this.aoeTargetCountTypeOptions,
      },
      aoe_target_count: {name: 'aoe_target_count', type: FormFieldType.decimal, width: -1},
      attack_building: {name: 'attack_building', type: FormFieldType.boolean, width: -1},
      title11: {name: '', label: ' ', type: FormFieldType.title},
      aoeRadius: {name: 'aoeRadius', type: FormFieldType.integer, width: -1},
      aoeAngle: {name: 'aoeAngle', type: FormFieldType.integer, width: -1},
      title10: {name: '', label: ' ', type: FormFieldType.title},
      aoePrefab: {
        name: 'aoePrefab',
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 256,
        width: -1,
      },
      activationDelay: {name: 'activationDelay', type: FormFieldType.decimal, width: -1},
      title9: {name: '', label: ' ', type: FormFieldType.title},
      casterState: {
        name: 'casterState',
        type: FormFieldType.dropdown,
        width: 50,
        require: true,
        hideNone: true,
        data: this.targetStates,
      },
      targetState: {
        name: 'targetState',
        type: FormFieldType.dropdown,
        width: 50,
        require: true,
        hideNone: true,
        data: this.casterStates,
      },
      enemyTargetChangeToSelf: {name: 'enemyTargetChangeToSelf', type: FormFieldType.boolean, width: 100},
      speciesTargetReq: {
        name: 'speciesTargetReq',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: speciesFieldConfig,
        width: 33,
        search: true,
      },
      minRange: {name: 'minRange', type: FormFieldType.integer, width: 33},
      maxRange: {name: 'maxRange', type: FormFieldType.integer, width: 33},
      speed: {name: 'speed', type: FormFieldType.decimal, width: 33},
      reqTarget: {name: 'reqTarget', type: FormFieldType.boolean, width: 33},
      reqFacingTarget: {name: 'reqFacingTarget', type: FormFieldType.boolean, width: 33},
      line_of_sight: {name: 'line_of_sight', type: FormFieldType.boolean, width: 33},
      title5: {name: '', label: this.translate.instant(this.tableKey + '.TITLE5'), type: FormFieldType.title},
      pulseCostType: {
        name: 'pulseCostType',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        require: true,
        allowNew: true,
        fieldConfig: vitalityStatFieldConfig,
      },
      pulseCost: {name: 'pulseCost', type: FormFieldType.integer, width: 33, require: true},
      pulseCostPercentage: {name: 'pulseCostPercentage', type: FormFieldType.decimal, width: 33},
      pulse_tags_on_caster: {
        name: 'pulse_tags_on_caster',
        type: FormFieldType.dynamicDropdown,
        width: 75,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
      },
      pulseCasterEffectConsumed: {name: 'pulseCasterEffectConsumed', type: FormFieldType.boolean, width: 25},
      pulse_tags_on_target: {
        name: 'pulse_tags_on_target',
        type: FormFieldType.dynamicDropdown,
        width: 75,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
      },
      pulseTargetEffectConsumed: {name: 'pulseTargetEffectConsumed', type: FormFieldType.boolean, width: 25},
      pulse_tags_not_on_caster: {
        name: 'pulse_tags_not_on_caster',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
        width: 100,
      },
      pulse_tags_not_on_target: {
        name: 'pulse_tags_not_on_target',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
        width: 100,
      },
      pulseReagentRequired: {
        name: 'pulseReagentRequired',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      pulseReagentCount: {name: 'pulseReagentCount', type: FormFieldType.integer, width: 33},
      pulseReagentConsumed: {name: 'pulseReagentConsumed', type: FormFieldType.boolean, width: 33},
      pulseReagent2Required: {
        name: 'pulseReagent2Required',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      pulseReagent2Count: {name: 'pulseReagent2Count', type: FormFieldType.integer, width: 33},
      pulseReagent2Consumed: {name: 'pulseReagent2Consumed', type: FormFieldType.boolean, width: 33},
      pulseReagent3Required: {
        name: 'pulseReagent3Required',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: itemFieldConfig,
      },
      pulseReagent3Count: {name: 'pulseReagent3Count', type: FormFieldType.integer, width: 33},
      pulseReagent3Consumed: {name: 'pulseReagent3Consumed', type: FormFieldType.boolean, width: 33},
      pulseAmmoUsed: {name: 'pulseAmmoUsed', type: FormFieldType.integer, width: 50},
      title2: {name: '', label: this.translate.instant(this.tableKey + '.TITLE2'), type: FormFieldType.title},
      globalCooldown: {name: 'globalCooldown', type: FormFieldType.boolean, width: 25},
      weaponCooldown: {name: 'weaponCooldown', type: FormFieldType.boolean, width: 25},
      cooldown1Type: {name: 'cooldown1Type', type: FormFieldType.input, width: 25, length: 32},
      cooldown1Duration: {name: 'cooldown1Duration', type: FormFieldType.decimal, width: 25},
      startCooldownsOnActivation: {name: 'startCooldownsOnActivation', type: FormFieldType.boolean, width: 50},
      tooltip: {name: 'tooltip', type: FormFieldType.textarea, width: 100, length: 255},
      tags: {
        name: 'tags',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: abilityTagsFieldConfig,
        width: 100,
      },
      powerUpCoordEffect: {
          name: 'powerUpCoordEffect',
          type: FormFieldType.dynamicDropdown,
          width: 100,
          allowNew: true,
          fieldConfig: coordFieldConfig,
        },
      titleCOMBO: {
        name: '',
        label: this.translate.instant(this.tableKey + '.TITLECOMBO'),
        type: FormFieldType.title,
        width: 100,
      },
      is_child: {name: 'is_child', type: FormFieldType.boolean, width: 33},
    },
    subForms: {
      combos: {
        title: this.translate.instant(this.tableKey + '.COMBOS'),
        submit: this.translate.instant(this.tableKey + '.ADD_COMBO'),
        columnWidth: 100,
        fields: {
          ability_parent_id: {name: 'ability_parent_id', label: '', type: FormFieldType.hidden},
          ability_sub_id: {
            name: 'ability_sub_id',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: abilityFieldConfig,
            allowNew: true,
            require: true,
            width: 50,
          },
          chance_min: {name: 'chance_min', type: FormFieldType.decimal, require: true, width: 25},
          chance_max: {name: 'chance_max', type: FormFieldType.decimal, require: true, width: 25},
          time: {name: 'time', type: FormFieldType.integer, require: true, width: 25},
          show_in_center_ui: {name: 'show_in_center_ui', type: FormFieldType.boolean, width: 25},
          replace_in_slot: {name: 'replace_in_slot', type: FormFieldType.boolean, width: 25},
          check_cooldown: {name: 'check_cooldown', type: FormFieldType.boolean, width: 25},
        },
      },
      abilityPowers: {
        title: this.translate.instant(this.tableKey + '.POWER_UP'),
        submit: this.translate.instant(this.tableKey + '.ADD_POWER_UP'),
        numerate: true,
        minCount: 1,
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          ability_id: {name: 'ability_id', label: '', type: FormFieldType.hidden},
          thresholdMaxTime: {name: 'thresholdMaxTime', type: FormFieldType.decimal, width: 100},
        },
        subForms: {
          coordEffects: {
            title: this.translate.instant(this.tableKey + '.COORD_EFFECT'),
            submit: this.translate.instant(this.tableKey + '.ADD_COORD_EFFECT'),
            columnWidth: 100,
            groupTitle: this.translate.instant(this.tableKey + '.EFFECTS'),
            numerate: false,
            draggable: false,
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              ability_power_id: {name: 'ability_power_id', label: '', type: FormFieldType.hidden},
              coordEffectEvent: {
                name: 'coordEffectEvent',
                type: FormFieldType.dropdown,
                width: 25,
                hideNone: true,
                data: this.coordEffectOptions,
              },
              coordEffect: {
                name: 'coordEffect',
                type: FormFieldType.dynamicDropdown,
                width: 75,
                allowNew: true,
                fieldConfig: coordFieldConfig,
              },
            },
          },
          effects: {
            title: this.translate.instant(this.tableKey + '.EFFECT'),
            submit: this.translate.instant(this.tableKey + '.ADD_EFFECT'),
            columnWidth: 100,
            groupTitle: this.translate.instant(this.tableKey + '.EFFECTS'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              ability_power_id: {name: 'ability_power_id', label: '', type: FormFieldType.hidden},
              target: {
                name: 'target',
                type: FormFieldType.dropdown,
                width: 20,
                hideNone: true,
                data: this.targetOptions,
              },
              effect: {
                name: 'effect',
                type: FormFieldType.dynamicDropdown,
                width: 50,
                allowNew: true,
                fieldConfig: effectFieldConfig,
              },
              delay: {name: 'delay', type: FormFieldType.decimal, require: true, width: 10},
              chance_min: {name: 'chance_min', type: FormFieldType.decimal, require: true, width: 10},
              chance_max: {name: 'chance_max', type: FormFieldType.decimal, require: true, width: 10},
            },
          },
          abilities: {
            title: this.translate.instant(this.tableKey + '.ABILITY'),
            submit: this.translate.instant(this.tableKey + '.ADD_ABILITY'),
            columnWidth: 100,
            groupTitle: this.translate.instant(this.tableKey + '.ABILITIES'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              ability_power_id: {name: 'ability_power_id', label: '', type: FormFieldType.hidden},
              target: {
                name: 'target',
                type: FormFieldType.dropdown,
                width: 20,
                hideNone: true,
                data: this.targetOptions,
              },
              ability: {
                name: 'ability',
                type: FormFieldType.dynamicDropdown,
                width: 50,
                allowNew: true,
                fieldConfig: abilityFieldConfig,
              },
              delay: {name: 'delay', type: FormFieldType.decimal, require: true, width: 10},
              chance_min: {name: 'chance_min', type: FormFieldType.decimal, require: true, width: 10},
              chance_max: {name: 'chance_max', type: FormFieldType.decimal, require: true, width: 10},
            },
          },
          triggers: {
            title: this.translate.instant(this.tableKey + '.TRIGGER'),
            submit: this.translate.instant(this.tableKey + '.ADD_TRIGGER'),
            columnWidth: 50,
            groupTitle: this.translate.instant(this.tableKey + '.TRIGGERS'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              ability_power_id: {name: 'ability_power_id', label: '', type: FormFieldType.hidden},
              trigger_id: {
                name: 'trigger_id',
                type: FormFieldType.dynamicDropdown,
                width: 100,
                allowNew: true,
                require: true,
                fieldConfig: abilityTriggerFieldConfig,
              },
            },
          },
        },
      },
    },
  };
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  private effectsList: DropdownValue[] = [];
  private abilityList: DropdownValue[] = [];
  private triggerList: DropdownValue[] = [];

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
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile: Profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      this.formConfig.fields.aoePrefab.acceptFolder = profile.folder + profile.mobFolder;
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        this.loadOptions();
      }
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.skill.data = list;
    });
    this.dropdownItemsService.vitalityStat.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.activationCostType.data = list;
    });
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.effectsList = list;
      this.tableConfig.fields.casterEffectRequired.data = list;
      this.tableConfig.fields.targetEffectRequired.data = list;
      this.tableConfig.fields.pulseCasterEffectConsumed.data = list;
      this.tableConfig.fields.pulseTargetEffectConsumed.data = list;
    });
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.abilityList = list;
    });
    this.dropdownItemsService.abilityTriggerProfile.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.triggerList = list;
    });
    this.dropdownItemsService.items.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.reagentRequired.data = list;
      this.tableConfig.fields.reagent2Required.data = list;
      this.tableConfig.fields.reagent3Required.data = list;
      this.tableConfig.fields.pulseReagentRequired.data = list;
      this.tableConfig.fields.pulseReagent2Required.data = list;
      this.tableConfig.fields.pulseReagent3Required.data = list;
    });
    this.dropdownItemsService.coordinatedEffects.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.coordEffect.data = list.map((item) => ({id: item.value, value: item.value}));
    });
    this.dropdownItemsService.damages.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.damageType.data = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.weaponRequired.data = await this.optionChoicesService.getOptionsByType('Weapon Type', true);
    this.tableConfig.fields.targetType.data = await this.optionChoicesService.getOptionsByType('Target Type', true);
    this.tableConfig.fields.targetSubType.data = await this.optionChoicesService.getOptionsByType('Target Sub Type', true);
    this.tableConfig.fields.speciesTargetReq.data = await this.optionChoicesService.getOptionsByType('Species', true);
    this.tableConfig.fields.tag_disable.data = await this.optionChoicesService.getOptionsByType('Ability Tags');
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getSkills();
    await this.dropdownItemsService.getVitalityStats();
    await this.dropdownItemsService.getEffects();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getCoordinatedEffects();
    await this.dropdownItemsService.getDamages();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getAbilityTriggersProfile();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getAbilities();
    }
    const subFields: Record<string, SubQueryField> = {
      reagentReq: {
        type: SubTable.multiple,
        columns: [
          'reagentRequired',
          'reagent2Required',
          'reagent3Required',
          'pulseReagentRequired',
          'pulseReagent2Required',
          'pulseReagent3Required',
        ],
      },
      reagentC: {
        type: SubTable.multiple,
        columns: [
          'reagentCount',
          'reagent2Count',
          'reagent3Count',
          'pulseReagentCount',
          'pulseReagent2Count',
          'pulseReagent3Count',
        ],
      },
      reagentConsume: {
        type: SubTable.multiple,
        columns: [
          'reagentConsumed',
          'reagent2Consumed',
          'reagent3Consumed',
          'pulseReagentConsumed',
          'pulseReagent2Consumed',
          'pulseReagent3Consumed',
        ],
      },
      coordEffectEvent: {
        type: SubTable.multiple,
        columns: [
          'coordEffect1event',
          'coordEffect2event',
          'coordEffect3event',
          'coordEffect4event',
          'coordEffect5event',
        ],
      },
      coordEffect: {
        type: SubTable.multiple,
        columns: ['coordEffect1', 'coordEffect2', 'coordEffect3', 'coordEffect4', 'coordEffect5'],
      },
      combo_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'ability_parent_id',
        table: this.dbTableCombo,
        where: {},
      },
      effects: {
        type: SubTable.left_join,
        main: 'id',
        related: 'ability_id',
        table: this.dbTableEffects,
        where: {},
      },
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Ability>(
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
    const subForm = new FormGroup({});
    Object.keys(this.abilityPowerForm).forEach((key) => {
      if (this.abilityPowerForm[key].isArray) {
        subForm.addControl(key, new FormArray([]));
      } else {
        const validators = [];
        if (this.abilityPowerForm[key].required) {
          validators.push(Validators.required);
        }
        if (this.abilityPowerForm[key].min !== undefined) {
          validators.push(Validators.min(this.abilityPowerForm[key].min as number));
        }
        if (this.abilityPowerForm[key].max !== undefined) {
          validators.push(Validators.max(this.abilityPowerForm[key].max as number));
        }
        subForm.addControl(key, new FormControl(this.abilityPowerForm[key].value, validators));
      }
    });

    (form.get('abilityPowers') as FormArray).push(subForm);
    let {item} = await this.tablesService.openDialog<Ability>(formConfig, form, {
      abilityPowers: this.abilityPowerForm,
      coordEffects: this.coordEffectForm,
      combos: this.comboForm,
      effects: this.effectForm,
      abilities: this.abilityForm,
      triggers: this.triggerForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();

    const abilityPowers = item.abilityPowers as AbilityPower[];
    delete item.abilityPowers;

    const combos = item.combos as AbilityCombo[];
    delete item.combos;

    item = await this.setDefaults(item);
    item.creationtimestamp = this.databaseService.getTimestampNow();

    const newId = await this.databaseService.insert<Ability>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, abilityPowers, []);
    await this.saveSubCombos(newId, combos, []);
    this.tablesService.dialogRef = null;
    this.resetForm(form);
    return {id: newId, value: item.name};
  }

  private async setDefaults(item: Ability): Promise<Ability> {
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    item.skill = item.skill ? item.skill : -1;
    item.exp = item.exp ? item.exp : 0;
    item.skill_up_chance = item.skill_up_chance ? item.skill_up_chance : 0;
    item.passive = item.passive ? item.passive : false;
    item.chance = item.chance ? item.chance : 1;
    if (item.abilityType === AbilityType.EffectAbility) {
      item.passive = false;
    } else if (item.abilityType === AbilityType.FriendlyEffectAbility) {
    } else {
      item.passive = false;
    }
    item.castingInRun = item.castingInRun ? item.castingInRun : false;
    item.channelling_in_run = item.channelling_in_run ? item.channelling_in_run : false;
    item.channelling_pulse_time = item.channelling_pulse_time ? item.channelling_pulse_time : 0.25;
    item.channelling_pulse_num = item.channelling_pulse_num ? item.channelling_pulse_num : 1;
    item.channelling = item.channelling ? item.channelling : false;
    if (!item.channelling) {
      item.channelling_in_run = false;
    }
    item.skipChecks = item.skipChecks ? item.skipChecks : false;
    item.enterCombatState = item.enterCombatState ? item.enterCombatState : false ;
    item.checkBusy = item.checkBusy ? item.checkBusy : false;
    item.makeBusy = item.makeBusy ? item.makeBusy : false;
    item.enemyTargetChangeToSelf = item.enemyTargetChangeToSelf ? item.enemyTargetChangeToSelf : false;
    item.weaponMustBeDrawn = item.weaponMustBeDrawn ? item.weaponMustBeDrawn : false;
    item.drawnWeaponBefore = item.drawnWeaponBefore ? item.drawnWeaponBefore : false;
    item.miss_chance = item.miss_chance ? item.miss_chance : 0;
    item.stealth_reduce = item.stealth_reduce ? item.stealth_reduce : false;
    item.stealth_reduction_amount = item.stealth_reduction_amount ? item.stealth_reduction_amount : 0;
    item.stealth_reduction_percentage = item.stealth_reduction_percentage ? item.stealth_reduction_percentage : 0;
    item.stealth_reduction_timeout = item.stealth_reduction_timeout ? item.stealth_reduction_timeout : 0;
    item.interruptible = item.interruptible ? item.interruptible : false;
    item.interruption_chance = item.interruption_chance ? item.interruption_chance : 0;
    if (!item.interruptible) {
      item.interruption_chance = 0;
    }
    item.tag_count = item.tag_count ? item.tag_count : 1;
    item.tag_disable = item.tag_disable ? item.tag_disable : -1;
    item.toggle = item.toggle ? item.toggle : false;
    item.pvp_enter = item.pvp_enter ? item.pvp_enter : false;
    if (!item.toggle) {
      item.tag_count = 1;
      item.tag_disable = -1;
      item.pvp_enter=false;
    }
    item.activationLength = item.activationLength ? item.activationLength : 0;
    item.attack_time = item.attack_time ? item.attack_time : 0;
    item.consumeOnActivation = item.consumeOnActivation ? item.consumeOnActivation : false;
    item.reagentRequired = item.reagentRequired ? item.reagentRequired : -1;
    item.reagent2Required = item.reagent2Required ? item.reagent2Required : -1;
    item.reagent3Required = item.reagent3Required ? item.reagent3Required : -1;
    item.reagentCount = item.reagentCount ? item.reagentCount : 1;
    item.reagent2Count = item.reagent2Count ? item.reagent2Count : 1;
    item.reagent3Count = item.reagent3Count ? item.reagent3Count : 1;
    item.reagentConsumed = item.reagentConsumed ? item.reagentConsumed : false;
    item.reagent2Consumed = item.reagent2Consumed ? item.reagent2Consumed : false;
    item.reagent3Consumed = item.reagent3Consumed ? item.reagent3Consumed : false;
    item.pulseReagentRequired = item.pulseReagentRequired ? item.pulseReagentRequired : -1;
    item.pulseReagent2Required = item.pulseReagent2Required ? item.pulseReagent2Required : -1;
    item.pulseReagent3Required = item.pulseReagent3Required ? item.pulseReagent3Required : -1;
    item.pulseReagentCount = item.pulseReagentCount ? item.pulseReagentCount : 1;
    item.pulseReagent2Count = item.pulseReagent2Count ? item.pulseReagent2Count : 1;
    item.pulseReagent3Count = item.pulseReagent3Count ? item.pulseReagent3Count : 1;
    item.pulseReagentConsumed = item.pulseReagentConsumed ? item.pulseReagentConsumed : false;
    item.pulseReagent2Consumed = item.pulseReagent2Consumed ? item.pulseReagent2Consumed : false;
    item.pulseReagent3Consumed = item.pulseReagent3Consumed ? item.pulseReagent3Consumed : false;
    item.ammoUsed = item.ammoUsed ? item.ammoUsed : 0;
    item.pulseAmmoUsed = item.pulseAmmoUsed ? item.pulseAmmoUsed : 0;
    item.minRange = item.minRange ? item.minRange : 0;
    item.maxRange = item.maxRange ? item.maxRange : 1;
    if ( item.targetState == undefined) item.targetState = 1;
    item.casterState = item.casterState ? item.casterState : 1;
    item.reqFacingTarget = item.reqFacingTarget ? item.reqFacingTarget : false;
    item.line_of_sight = item.line_of_sight ? item.line_of_sight : false;
    item.speciesTargetReq = item.speciesTargetReq ? item.speciesTargetReq : '';
    item.globalCooldown = item.globalCooldown ? item.globalCooldown : false;
    item.weaponCooldown = item.weaponCooldown ? item.weaponCooldown : false;
    item.cooldown1Duration = item.cooldown1Duration ? item.cooldown1Duration : 0;
    item.startCooldownsOnActivation = item.startCooldownsOnActivation ? item.startCooldownsOnActivation : false;
    item.coordEffect1event = item.coordEffect1event ? item.coordEffect1event : 'activating';
    item.coordEffect2event = item.coordEffect2event ? item.coordEffect2event : 'activating';
    item.coordEffect3event = item.coordEffect3event ? item.coordEffect3event : 'activating';
    item.coordEffect4event = item.coordEffect4event ? item.coordEffect4event : 'activating';
    item.coordEffect5event = item.coordEffect5event ? item.coordEffect5event : 'activating';
    item.aoeRadius = item.aoeRadius ? item.aoeRadius : 1;
    item.aoeAngle = item.aoeAngle ? item.aoeAngle : 360;
    item.aoeType = item.aoeType ? item.aoeType : 'None';
    item.activationDelay = item.activationDelay ? item.activationDelay : 0;
    item.aoePrefab = item.aoePrefab ? item.aoePrefab : '';
    item.targetState = item.targetState ?? -1;
    item.activationCost = item.activationCost ? item.activationCost : 0;
    if (
      item.targetType.toLowerCase() === 'group' ||
      item.targetType.toLowerCase() === 'aoe' ||
      item.targetType.toLowerCase() === 'location(trap)'
    ) {
      if (item.aoeType === 'PlayerRadius') {
        item.reqTarget = false;
        item.reqFacingTarget = false;
      } else {
        item.reqTarget = item.reqTarget ? item.reqTarget : false;
      }
    } else {
      item.reqTarget = item.reqTarget ? item.reqTarget : false;
      item.aoeType = 'None';
    }
    if (['aoe', 'location(trap)'].includes(item.targetType.toLowerCase())) {
      item.chunk_length = item.chunk_length ?? 1;
    } else {
      item.chunk_length = 1;
    }
    if (['enemy'].indexOf(item.targetSubType.toLowerCase()) === -1) {
      item.attack_building = false;
    }
    item.attack_building = item.attack_building ?? false;
    if (!item.speed) {
      item.speed = 0;
    }
    if (!item.prediction) {
      item.prediction = 0;
    }
    if (!item.aoe_target_count_type) {
      item.aoe_target_count_type = 0;
    }
    if (
      item.aoe_target_count_type !== TargetCountTypeOption.first &&
      item.aoe_target_count_type !== TargetCountTypeOption.random
    ) {
      item.aoe_target_count = 5;
    }
    if (!item.aoe_target_count) {
      item.aoe_target_count = 5;
    }
    if (item.aoeType === 'LocationRadius') {
      item.aoeAngle = 360;
    } else {
      item.aoePrefab = '';
      item.activationDelay = 0;
    }
    item.activationCostPercentage = item.activationCostPercentage ? item.activationCostPercentage : 0;
    item.pulseCostPercentage = item.pulseCostPercentage ? item.pulseCostPercentage : 0;
    item.pulseCost = item.pulseCost ? item.pulseCost : 0;
    item.activationLength = item.activationLength ? item.activationLength : 0;
    item.attack_time = item.attack_time ? item.attack_time : 0;
    item.casterEffectRequired = item.casterEffectRequired ? item.casterEffectRequired : 0;
    item.targetEffectRequired = item.targetEffectRequired ? item.targetEffectRequired : 0;
    item.casterEffectConsumed = item.casterEffectConsumed ? item.casterEffectConsumed : false;
    item.targetEffectConsumed = item.targetEffectConsumed ? item.targetEffectConsumed : false;
    item.pulseCasterEffectRequired = item.pulseCasterEffectRequired ? item.pulseCasterEffectRequired : 0;
    item.pulseTargetEffectRequired = item.pulseTargetEffectRequired ? item.pulseTargetEffectRequired : 0;
    item.pulseCasterEffectConsumed = item.pulseCasterEffectConsumed ? item.pulseCasterEffectConsumed : false;
    item.pulseTargetEffectConsumed = item.pulseTargetEffectConsumed ? item.pulseTargetEffectConsumed : false;
    item.tags = item.tags ? item.tags : '-1';
    item.tooltip = item.tooltip ? item.tooltip : '';
    item.weaponRequired = item.weaponRequired ? item.weaponRequired : '';
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    return item;
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<Ability>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const abilityPowers = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilityPower} WHERE ability_id = ?`,
      [record.id],
    );
    const abilityPowersAll: number[] = [];
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    const effectsAll: Record<number, number[]> = [];
    const abilitiesAll: Record<number, number[]> = [];
    const triggersAll: Record<number, number[]> = [];
    const coordEffectsAll: Record<number, number[]> = [];
    for (const abilityPower of abilityPowers) {
      effectsAll[abilityPower.id as number] = [];
      abilitiesAll[abilityPower.id as number] = [];
      triggersAll[abilityPower.id as number] = [];
      coordEffectsAll[abilityPower.id as number] = [];
      abilityPowersAll.push(abilityPower.id as number);

      const listEffects: AbilityEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listAbilities: AbilityAbilities[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableAbilities} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );

      const listTriggers: AbilityTriggers[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableTriggers} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listCoordEffects: AbilityCoordEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableCoordEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const subForm = new FormGroup({});
      Object.keys(this.abilityPowerForm).forEach((key) => {
        if (!this.abilityPowerForm[key].isArray) {
          subForm.addControl(
            key,
            this.subFormService.prepareSubFormControl<AbilityPower>(this.abilityPowerForm, abilityPower, key),
          );
        } else if (this.abilityPowerForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          if (key === 'effects') {

            for (const itemField of listEffects) {
              effectsAll[abilityPower.id as number].push(itemField.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.effectForm).forEach((itemKey) => {
                subSubForm.addControl(
                  itemKey,
                  this.subFormService.prepareSubFormControl<AbilityEffect>(this.effectForm, itemField, itemKey),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'abilities') {
            for (const ability of listAbilities) {
              abilitiesAll[abilityPower.id as number].push(ability.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.abilityForm).forEach((progressKey) => {
                subSubForm.addControl(
                  progressKey,
                  this.subFormService.prepareSubFormControl<AbilityAbilities>(
                    this.abilityForm,
                    ability,
                    progressKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'triggers') {
            for (const trigger of listTriggers) {
              triggersAll[abilityPower.id as number].push(trigger.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.triggerForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<AbilityTriggers>(
                    this.triggerForm,
                    trigger,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'coordEffects') {
            for (const coordEffect of listCoordEffects) {
              coordEffectsAll[abilityPower.id as number].push(coordEffect.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.coordEffectForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<AbilityCoordEffect>(
                    this.coordEffectForm,
                    coordEffect,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          }
        }
      });
      (form.get('abilityPowers') as FormArray).push(subForm);
    }

    const list: AbilityCombo[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableCombo} WHERE ability_parent_id = ?`,
      [record.id],
    );


    const combosAll = [];
    for (const itm of list) {
      combosAll.push(itm.id);
    }
    for (const itm of list) {
      (form.get('combos') as FormArray).push(
        this.subFormService.buildSubForm<Partial<AbilityCombo>, any>(this.comboForm, itm),
      );
    }
    form.patchValue(record);

    if (record) {
      record.tags = record.tags !== '-1' ? record.tags : '';
      form.patchValue(record);
    }
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<Ability>(formConfig, form, {
      abilityPowers: this.abilityPowerForm,
      coordEffects: this.coordEffectForm,
      combos: this.comboForm,
      effects: this.effectForm,
      abilities: this.abilityForm,
      triggers: this.triggerForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item = await this.setDefaults(item);
    const combos = item.combos as AbilityCombo[];
    delete item.combos;

    let _abilityPowers = item.abilityPowers as AbilityPower[];
    delete item.abilityPowers;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      delete item.id;
      newId = await this.databaseService.insert<Ability>(this.dbProfile, this.dbTable, item);

      _abilityPowers = _abilityPowers.map((s) => {
        const {id, ...st} = s;
        st.effects = st.effects.map((it) => ({...it, id: undefined}));
        st.abilities = st.abilities.map((it) => ({...it, id: undefined}));
        st.triggers = st.triggers.map((it) => ({...it, id: undefined}));
        st.coordEffects = st.coordEffects.map((it) => ({...it, id: undefined}));

        return st;
      })
      await this.saveSubs(newId, _abilityPowers, []);
      for (const combo of combos) {
        delete combo.id;
      }
      await this.saveSubCombos(newId, combos, []);
    } else {
      await this.databaseService.update<Ability>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubCombos(record.id, combos, combosAll);
      await this.saveSubs(record.id as number, _abilityPowers, abilityPowersAll, effectsAll, abilitiesAll, triggersAll, coordEffectsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  private async saveSubs(
    recordId: number,
    abilityPowers: AbilityPower[],
    abilityPowersAll: number[] = [],
    effectsAll: Record<number, number[]> = {},
    abilitiesAll: Record<number, number[]> = {},
    triggersAll: Record<number, number[]> = {},
    coordEffectsAll: Record<number, number[]> = {},
  ) {

    for (let abilityPower of abilityPowers) {
      let itemId = abilityPower.id;
      abilityPower.ability_id = recordId;
      abilityPower = this.subDefaults(abilityPower);
      const effects = abilityPower.effects as AbilityEffect[];
      delete abilityPower.effects;
      const abilities = abilityPower.abilities as AbilityAbilities[];
      delete abilityPower.abilities;
      const triggers = abilityPower.triggers as AbilityTriggers[];
      delete abilityPower.triggers;
      const coordEffects = abilityPower.coordEffects as AbilityCoordEffect[];
      delete abilityPower.coordEffects;
      if (abilityPower.id) {
        abilityPowersAll.splice(abilityPowersAll.indexOf(abilityPower.id), 1);
        await this.databaseService.update<AbilityPower>(this.dbProfile, this.dbTableAbilityPower, abilityPower, 'id', abilityPower.id);
        await this.saveSubEffects(itemId, effects, effectsAll[itemId as number] ?? []);
        await this.saveSubAbilities(itemId, abilities, abilitiesAll[itemId as number] ?? []);
        await this.saveSubTriggers(itemId, triggers, triggersAll[itemId as number] ?? []);
        await this.saveSubCoordEffects(itemId, coordEffects, coordEffectsAll[itemId as number] ?? []);
      } else {
        delete abilityPower.id;
        itemId = await this.databaseService.insert<AbilityPower>(this.dbProfile, this.dbTableAbilityPower, abilityPower, false);
        for (const effect of effects) {
          delete effect.id;
        }
        for (const ability of abilities) {
          delete ability.id;
        }
        for (const trigger of triggers) {
          delete trigger.id;
        }
        for (const coordEffect of coordEffects) {
          delete coordEffect.id;
        }
        await this.saveSubEffects(itemId, effects, effectsAll[itemId as number] ?? []);
        await this.saveSubAbilities(itemId, abilities, abilitiesAll[itemId as number] ?? []);
        await this.saveSubTriggers(itemId, triggers, triggersAll[itemId as number] ?? []);
        await this.saveSubCoordEffects(itemId, coordEffects, coordEffectsAll[itemId as number] ?? []);
      }


    }
    if (abilityPowersAll.length > 0) {
      for (const itemId of abilityPowersAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableAbilityPower, 'id', itemId, false);
        await this.saveSubEffects(itemId, [], effectsAll[itemId as number] ?? []);
        await this.saveSubAbilities(itemId, [], abilitiesAll[itemId as number] ?? []);
        await this.saveSubTriggers(itemId, [], triggersAll[itemId as number] ?? []);
        await this.saveSubCoordEffects(itemId, [], coordEffectsAll[itemId as number] ?? []);

      }
    }
  }
  private async saveSubCombos(recordId: number, combos: AbilityCombo[], comboAll: number[] = []): Promise<void> {
    if (combos) {
      for (const item of combos) {
        item.ability_parent_id = recordId;
        if (item.id) {
          delete comboAll[comboAll.indexOf(item.id)];
          await this.databaseService.update<AbilityCombo>(this.dbProfile, this.dbTableCombo, item, 'id', item.id);
        } else {
          //      // @ts-ignore
          delete item.id;
          await this.databaseService.insert<AbilityCombo>(this.dbProfile, this.dbTableCombo, item, false);
        }
      }
    }
    if (comboAll) {
      for (const itemId of comboAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableCombo, 'id', itemId, false);
      }
    }
  }
  private async saveSubCoordEffects(recordId: number, items: AbilityCoordEffect[], itemsAll: number[] = []): Promise<void> {
    if (items) {
      for (const item of items) {
        item.ability_power_id = recordId;
        if (item.id) {
          delete itemsAll[itemsAll.indexOf(item.id)];
          await this.databaseService.update<AbilityCoordEffect>(this.dbProfile, this.dbTableCoordEffects, item, 'id', item.id);
        } else {
          //      // @ts-ignore
          delete item.id;
          await this.databaseService.insert<AbilityCoordEffect>(this.dbProfile, this.dbTableCoordEffects, item, false);
        }
      }
    }
    if (itemsAll) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableCoordEffects, 'id', itemId, false);
      }
    }
  }

  private async saveSubEffects(recordId: number, items: AbilityEffect[], itemsAll: number[] = []): Promise<void> {
    if (items) {
      for (const item of items) {
        item.ability_power_id = recordId;
        if (item.id) {
          delete itemsAll[itemsAll.indexOf(item.id)];
          await this.databaseService.update<AbilityEffect>(this.dbProfile, this.dbTableEffects, item, 'id', item.id);
        } else {
          //      // @ts-ignore
          delete item.id;
          await this.databaseService.insert<AbilityEffect>(this.dbProfile, this.dbTableEffects, item, false);
        }
      }
    }
    if (itemsAll) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableEffects, 'id', itemId, false);
      }
    }
  }
  private async saveSubAbilities(recordId: number, items: AbilityAbilities[], itemsAll: number[] = []): Promise<void> {
    if (items) {
      for (const item of items) {
        item.ability_power_id = recordId;
        if (item.id) {
          delete itemsAll[itemsAll.indexOf(item.id)];
          await this.databaseService.update<AbilityAbilities>(this.dbProfile, this.dbTableAbilities, item, 'id', item.id);
        } else {
          //      // @ts-ignore
          delete item.id;
          await this.databaseService.insert<AbilityAbilities>(this.dbProfile, this.dbTableAbilities, item, false);
        }
      }
    }
    if (itemsAll) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableAbilities, 'id', itemId, false);
      }
    }
  }
  private async saveSubTriggers(recordId: number, items: AbilityTriggers[], itemsAll: number[] = []): Promise<void> {
    if (items) {
      for (const item of items) {
        item.ability_power_id = recordId;
        if (item.id) {
          delete itemsAll[itemsAll.indexOf(item.id)];
          await this.databaseService.update<AbilityTriggers>(this.dbProfile, this.dbTableTriggers, item, 'id', item.id);
        } else {
          //      // @ts-ignore
          delete item.id;
          await this.databaseService.insert<AbilityTriggers>(this.dbProfile, this.dbTableTriggers, item, false);
        }
      }
    }
    if (itemsAll) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableTriggers, 'id', itemId, false);
      }
    }
  }

  async removeById(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilityCombosTable} WHERE ability_parent_id IN (${ids.join(', ')})`, [], true);

      for(const id of ids) {
        const powerupsettings = (await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${abilitiesPowerUpTable} WHERE ability_id = ${id}`)).map(({id}) => id);
        if (powerupsettings.length > 0) {
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilitiesPowerUpTable} WHERE id IN (${powerupsettings.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilitiesCoordEffectsTable} WHERE ability_power_id IN (${powerupsettings.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilityEffectsTable} WHERE ability_power_id IN (${powerupsettings.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilityAbilitiesTable} WHERE ability_power_id IN (${powerupsettings.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${abilitiesTriggersTable} WHERE ability_power_id IN (${powerupsettings.join(', ')})`, [], true);

        }
      }
  }
  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<Ability>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    record.name = record.name + ' (1)';
    const abilityPowers = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilityPower} WHERE ability_id = ?`,
      [record.id],
    );
    const abilityPowersAll: number[] = [];
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    const effectsAll: Record<number, number[]> = [];
    const abilitiesAll: Record<number, number[]> = [];
    const triggersAll: Record<number, number[]> = [];
    const coordEffectsAll: Record<number, number[]> = [];
    for (const abilityPower of abilityPowers) {
      effectsAll[abilityPower.id as number] = [];
      abilitiesAll[abilityPower.id as number] = [];
      triggersAll[abilityPower.id as number] = [];
      coordEffectsAll[abilityPower.id as number] = [];
      abilityPowersAll.push(abilityPower.id as number);

      const listEffects: AbilityEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listAbilities: AbilityAbilities[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableAbilities} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );

      const listTriggers: AbilityTriggers[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableTriggers} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listCoordEffects: AbilityCoordEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableCoordEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const subForm = new FormGroup({});
      Object.keys(this.abilityPowerForm).forEach((key) => {
        if (!this.abilityPowerForm[key].isArray) {
          subForm.addControl(
            key,
            this.subFormService.prepareSubFormControl<AbilityPower>(this.abilityPowerForm, abilityPower, key),
          );
        } else if (this.abilityPowerForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          if (key === 'effects') {

            for (const itemField of listEffects) {
              effectsAll[abilityPower.id as number].push(itemField.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.effectForm).forEach((itemKey) => {
                subSubForm.addControl(
                  itemKey,
                  this.subFormService.prepareSubFormControl<AbilityEffect>(this.effectForm, itemField, itemKey),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'abilities') {
            for (const ability of listAbilities) {
              abilitiesAll[abilityPower.id as number].push(ability.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.abilityForm).forEach((progressKey) => {
                subSubForm.addControl(
                  progressKey,
                  this.subFormService.prepareSubFormControl<AbilityAbilities>(
                    this.abilityForm,
                    ability,
                    progressKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'triggers') {
            for (const trigger of listTriggers) {
              triggersAll[abilityPower.id as number].push(trigger.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.triggerForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<AbilityTriggers>(
                    this.triggerForm,
                    trigger,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'coordEffects') {
            for (const coordEffect of listCoordEffects) {
              coordEffectsAll[abilityPower.id as number].push(coordEffect.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.coordEffectForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<AbilityCoordEffect>(
                    this.coordEffectForm,
                    coordEffect,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          }
        }
      });
      (form.get('abilityPowers') as FormArray).push(subForm);
    }

    const list: AbilityCombo[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableCombo} WHERE ability_parent_id = ?`,
      [record.id],
    );


    const combosAll = [];
    for (const itm of list) {
      combosAll.push(itm.id);
    }
    for (const itm of list) {
      (form.get('combos') as FormArray).push(
        this.subFormService.buildSubForm<Partial<AbilityCombo>, any>(this.comboForm, itm),
      );
    }
    form.patchValue(record);

    if (record) {
      record.tags = record.tags !== '-1' ? record.tags : '';
      form.patchValue(record);
    }
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<Ability>(formConfig, form, {
      abilityPowers: this.abilityPowerForm,
      coordEffects: this.coordEffectForm,
      combos: this.comboForm,
      effects: this.effectForm,
      abilities: this.abilityForm,
      triggers: this.triggerForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item = await this.setDefaults(item);
    this.resetForm(form);
    delete item.id;
    let combos = item.combos as AbilityCombo[];
    for (const combo of combos) {
      delete combo.id;
    }
    delete item.combos;

    let itemAbilityPowers = item.abilityPowers as AbilityPower[];
    for (const abilityPower of itemAbilityPowers) {
      delete abilityPower.id;
    }
    delete item.abilityPowers;

    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Ability>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubCombos(newId, combos, []);
    await this.saveSubs(newId, itemAbilityPowers, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.tablesService.dialogRef = null;
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Ability>(this.dbProfile, this.dbTable, 'id', id);

    const combos = [];
    const list: AbilityCombo[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableCombo} WHERE ability_parent_id = ?`,
      [id],
    );

    const abilityPowersList = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableAbilityPower} WHERE ability_id = ?`,
      [record.id],
    );
    const abilityPowers = [];
    for (const abilityPower of abilityPowersList) {
      const listEffects: AbilityEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listAbilities: AbilityAbilities[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableAbilities} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );

      const listTriggers: AbilityTriggers[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableTriggers} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const listCoords: AbilityCoordEffect[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableCoordEffects} WHERE ability_power_id = ?`,
        [abilityPower.id],
      );
      const effects = [];
      const abilities = [];
      const triggers = [];
      const coordEffects = [];
      for (const r of listCoords) {
        if (r.coordEffect !== '~ none ~' && r.coordEffect !== '') {
          coordEffects.push({
            coordEffectEvent: r.coordEffectEvent,
            coordEffect: r.coordEffect,
          });
        }
      }
      for (const r of listEffects) {
        const effect = this.effectsList.find((item) => item.id === r.effect);
        effects.push({
          effect: effect ? effect.value : r.effect,
          target: r.target,
          chance_min: r.chance_min,
          chance_max: r.chance_max,
          delay: r.delay,
        });
      }
      for (const r of listAbilities) {
        const ability = this.abilityList.find((item) => item.id === r.ability);
        abilities.push({
          ability: ability ? ability.value : r.ability,
          target: r.target,
          chance_min: r.chance_min,
          chance_max: r.chance_max,
          delay: r.delay,
        });
      }
      for (const r of listTriggers) {
        const trigger = this.triggerList.find((item) => item.id === r.trigger_id);
        triggers.push({
          trigger: trigger ? trigger.value : r.trigger_id,
        });
      }
      abilityPowers.push({
        thresholdMaxTime: abilityPower.thresholdMaxTime,
        subs6: coordEffects,
        subs4: effects,
        subs5: abilities,
        subs7: triggers,
      });

    }

    for (const r of list) {
      const ability = this.abilityList.find((item) => item.id === r.ability_sub_id);
      combos.push({
        ability: ability ? ability.value : r.ability_sub_id,
        chance_min: r.chance_min,
        chance_max: r.chance_max,
        time: r.time,
        show_in_center_ui: r.show_in_center_ui ? 'Yes' : 'No',
        replace_in_slot: r.replace_in_slot ? 'Yes' : 'No',
        check_cooldown: r.check_cooldown ? 'Yes' : 'No',
      });
    }

    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {combos, abilityPowers}},
    });
  }

  private targetTypeChange(formConfig: FormConfig, targetType: string, aoeTypeValue: string, aoeTypeCount: number) {
    formConfig.fields.chunk_length.width = -1;
    formConfig.fields.prediction.width = -1;
    formConfig.fields.aoe_target_count_type.width = -1;
    formConfig.fields.aoe_target_count.width = -1;
    formConfig.fields.aoeRadius.width = -1;
    formConfig.fields.aoeAngle.width = -1;
    formConfig.fields.aoePrefab.width = -1;
    formConfig.fields.activationDelay.width = -1;
    if (
      (['aoe'].includes(targetType) && ['PlayerRadius', 'TargetRadius'].includes(aoeTypeValue)) ||
      (['aoe'].includes(targetType) && ['LocationRadius'].includes(aoeTypeValue)) ||
      (['location(trap)'].includes(targetType) && ['LocationRadius'].includes(aoeTypeValue)) ||
      ['group'].includes(targetType)
    ) {
      formConfig.fields.prediction.width = 33;
      formConfig.fields.aoe_target_count_type.width = 50;
      this.parseTargetCountType(formConfig, aoeTypeCount);
      formConfig.fields.aoeRadius.width = 50;
    }
    if (['aoe', 'location(trap)', 'group'].includes(targetType.toLowerCase())) {
      formConfig.fields.chunk_length.width = 33;
    }
    if (['aoe'].includes(targetType) && ['PlayerRadius', 'TargetRadius'].includes(aoeTypeValue)) {
      formConfig.fields.aoeAngle.width = 50;
    } else if (['aoe'].includes(targetType) && ['LocationRadius'].includes(aoeTypeValue)) {
      formConfig.fields.aoeAngle.width = 50;
      formConfig.fields.aoePrefab.width = 50;
      formConfig.fields.activationDelay.width = 50;
    } else if (['location(trap)'].includes(targetType) && ['LocationRadius'].includes(aoeTypeValue)) {
      formConfig.fields.aoePrefab.width = 50;
      formConfig.fields.activationDelay.width = 50;
    } else if (['group'].includes(targetType)) {
      formConfig.fields.aoeAngle.width = 50;
    }
  }

  private parseTargetCountType(formConfig: FormConfig, value: TargetCountTypeOption): void {
    if ([TargetCountTypeOption.first, TargetCountTypeOption.random].includes(value)) {
      formConfig.fields.aoe_target_count.width = 50;
    } else {
      formConfig.fields.aoe_target_count.width = -1;
    }
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

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('abilityPowers') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private subDefaults(stage: AbilityPower): AbilityPower {
    stage.thresholdMaxTime = stage.thresholdMaxTime || 0;
    return stage;
  }
  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      icon: '',
      abilityType: ['', Validators.required],
      skill: -1,
      exp: [0, Validators.min(0)],
      skill_up_chance: [80, [Validators.min(0), Validators.max(100)]],
      damageType: ['', Validators.required],
      passive: '',
      chance: [1, [Validators.min(0), Validators.max(1)]],
      activationLength: [0, [Validators.min(0), Validators.required]],
      attack_time: [0, [Validators.min(0), Validators.required]],
      castingInRun: '',
      channelling: false,
      channelling_in_run: false,
      channelling_pulse_time: [0.25, Validators.min(0.01)],
      channelling_pulse_num: [1, Validators.min(-1)],
      skipChecks: false,
      checkBusy: true,
      makeBusy: true,
      enemyTargetChangeToSelf: false,
      weaponMustBeDrawn: false,
      drawnWeaponBefore: false,
      stealth_reduce: false,
      stealth_reduction_amount: [0, Validators.min(0)],
      stealth_reduction_percentage: [0, Validators.min(0)],
      stealth_reduction_timeout: [0, Validators.min(0)],
      interruptible: false,
      interruption_chance: [0, [Validators.min(0), Validators.max(100)]],
      toggle: false,
      pvp_enter: false,
      enterCombatState: false,
      combatState: 2,
      miss_chance: [5, [Validators.min(0), Validators.max(100)]],
      tag_count: [0, Validators.min(0)],
      tag_disable: -1,
      pulseCostType: '',
      pulseCost: [0, [Validators.required, Validators.min(0)]],
      pulseCostPercentage: [0, [Validators.min(0), Validators.max(100)]],
      pulseCasterEffectRequired: 0,
      pulseCasterEffectConsumed: 0,
      pulseTargetEffectRequired: 0,
      pulseTargetEffectConsumed: 0,
      pulseReagentRequired: -1,
      pulseReagentCount: [1, Validators.min(1)],
      pulseReagentConsumed: 0,
      pulseReagent2Required: -1,
      pulseReagent2Count: [1, Validators.min(1)],
      pulseReagent2Consumed: 1,
      pulseReagent3Required: -1,
      pulseReagent3Count: [1, Validators.min(1)],
      pulseReagent3Consumed: 1,
      pulseAmmoUsed: [0, Validators.min(0)],
      activationCostType: ['', Validators.required],
      activationCost: [0, [Validators.min(0), Validators.required]],
      activationCostPercentage: [0, [Validators.min(0), Validators.max(100)]],
      casterEffectRequired: -1,
      casterEffectConsumed: '',
      targetEffectRequired: -1,
      targetEffectConsumed: '',
      reagentRequired: -1,
      reagentCount: [1, Validators.min(1)],
      reagentConsumed: 0,
      reagent2Required: -1,
      reagent2Count: [1, Validators.min(1)],
      reagent2Consumed: 0,
      reagent3Required: -1,
      reagent3Count: [1, Validators.min(1)],
      reagent3Consumed: 0,
      consumeOnActivation: '',
      ammoUsed: [0, Validators.min(0)],
      weaponRequired: '',
      targetType: ['', Validators.required],
      targetSubType: ['', Validators.required],
      targetState: [1, Validators.required],
      casterState: [1, Validators.required],
      aoeType: '',
      aoeRadius: [1, Validators.min(1)],
      aoeAngle: [1, [Validators.min(1), Validators.max(360)]],
      aoePrefab: '',
      activationDelay: [0, [Validators.min(0), Validators.max(100)]],
      attack_building: 0,
      speciesTargetReq: '',
      minRange: [0, Validators.min(0)],
      maxRange: [0, Validators.min(0)],
      reqTarget: '',
      reqFacingTarget: '',
      line_of_sight: '',
      globalCooldown: '',
      weaponCooldown: '',
      cooldown1Type: '',
      cooldown1Duration: [0, Validators.min(0)],
      startCooldownsOnActivation: '',
      tooltip: '',
      tags: '',
      tags_on_caster: '',
      tags_on_target: '',
      tags_not_on_caster: '',
      tags_not_on_target: '',
      pulse_tags_on_caster: '',
      pulse_tags_on_target: '',
      pulse_tags_not_on_caster: '',
      pulse_tags_not_on_target: '',
      powerUpCoordEffect: '',
      is_child: false,
      speed: [0, Validators.min(0)],
      chunk_length: [1, Validators.min(0.01)],
      prediction: 0,
      aoe_target_count_type: 0,
      aoe_target_count: [1, Validators.min(1)],
      combos: new FormArray([]),
      abilityPowers: new FormArray([]),
    });
    (form.get('abilityType') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        (form.get('passive') as AbstractControl).disable();
        (form.get('chance') as AbstractControl).disable();
        formConfig.fields.passive.width = -1;
        formConfig.fields.chance.width = -1;
        if (value === AbilityType.EffectAbility) {
          (form.get('chance') as AbstractControl).enable();
          formConfig.fields.chance.width = 50;
        } else if (value === AbilityType.FriendlyEffectAbility) {
          (form.get('passive') as AbstractControl).enable();
          formConfig.fields.passive.width = 50;
        }
        if (value === AbilityType.AttackAbility) {
          formConfig.fields.targetType.fieldConfig = targetTypeSingleAoEFieldConfig;
          (form.get('targetType') as AbstractControl).setValue('');
          (form.get('targetSubType') as AbstractControl).setValue('');
        } else if (value === AbilityType.EffectAbility) {
          formConfig.fields.targetType.fieldConfig = targetTypeNotGroupFieldConfig;
          (form.get('targetType') as AbstractControl).setValue('');
          (form.get('targetSubType') as AbstractControl).setValue('');
        } else if (value === AbilityType.FriendlyEffectAbility) {
          formConfig.fields.targetType.fieldConfig = targetTypeFieldConfig;
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeNotEnemyFieldConfig;
          (form.get('targetType') as AbstractControl).setValue('');
          (form.get('targetSubType') as AbstractControl).setValue('');
        }

      });
    form.controls.targetSubType.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      value = (value || '').toString().toLowerCase();
      if (['enemy', 'friendly or enemy'].indexOf(value) !== -1) {
        formConfig.fields.attack_building.width = 100;
      } else {
        formConfig.fields.attack_building.width = -1;
        (form.get('attack_building') as AbstractControl).patchValue(false);
      }
    });
    form.controls.targetType.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      value = (value || '').toString().toLowerCase();
      if (['single target'].includes(value)) {
        (form.get('aoeType') as AbstractControl).setValidators([]);
        (form.get('aoeType') as AbstractControl).updateValueAndValidity();
        formConfig.fields.aoeType.width = -1;
        (form.get('reqTarget') as AbstractControl).patchValue(true);
        (form.get('reqTarget') as AbstractControl).disable();
        (form.get('reqFacingTarget') as AbstractControl).enable();
      } else if (value.length > 0) {
        if ((form.get('aoeType') as AbstractControl).value === 'None') {
          (form.get('aoeType') as AbstractControl).setValue('');
        }
        (form.get('aoeType') as AbstractControl).setValidators(Validators.required.bind(this));
        (form.get('aoeType') as AbstractControl).updateValueAndValidity();
        formConfig.fields.aoeType.width = 33;
        formConfig.fields.aoeType.require = true;
        formConfig.fields.aoeType.hideNone = true;
        if ((form.get('aoeType') as AbstractControl).value === 'PlayerRadius') {
          (form.get('reqTarget') as AbstractControl).patchValue(false);
          (form.get('reqTarget') as AbstractControl).disable();
          (form.get('reqFacingTarget') as AbstractControl).patchValue(false);
          (form.get('reqFacingTarget') as AbstractControl).disable();
        } else if ((form.get('aoeType') as AbstractControl).value === 'TargetRadius') {
          (form.get('reqTarget') as AbstractControl).patchValue(true);
          (form.get('reqTarget') as AbstractControl).disable();
          (form.get('reqFacingTarget') as AbstractControl).enable();
        }
      }
      if (value === 'aoe') {
        if(form.controls.abilityType.value === AbilityType.AttackAbility) {
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlyEnemyFieldConfig;
        } else if(form.controls.abilityType.value === AbilityType.EffectAbility) {
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeFriendEnemyFieldConfig;
        } else{
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlyFriendlyFieldConfig;
          }

      } else if(value === 'location(trap)'){
        (form.get('targetSubType') as AbstractControl).setValue('');
        formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlySelfFieldConfig;
      }  else if(value === 'group'){
        (form.get('targetSubType') as AbstractControl).setValue('');
        formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlyFriendlyFieldConfig;
      } else {
        if(form.controls.abilityType.value === AbilityType.AttackAbility) {
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlyEnemyFieldConfig;
        } else if(form.controls.abilityType.value === AbilityType.FriendlyEffectAbility) {
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeOnlyFriendlySelfFieldConfig;
        } else {
          (form.get('targetSubType') as AbstractControl).setValue('');
          formConfig.fields.targetSubType.fieldConfig = targetSubTypeFieldConfig;
        }
      }
      if (value === 'group') {
        formConfig.fields.aoeType.data = this.groupTypes;
      } else if (value === 'location(trap)') {
        formConfig.fields.aoeType.data = [
          {id: AoeTypes.LocationRadius, value: this.translate.instant(this.tableKey + '.LocationRadius')},
        ];
      } else {
        formConfig.fields.aoeType.data = this.aoeTypes;
      }
      (form.get('targetSubType') as AbstractControl).patchValue('');;
      (form.get('targetSubType') as AbstractControl).updateValueAndValidity();

      this.targetTypeChange(formConfig, value, form.controls.aoeType.value, form.controls.aoe_target_count_type.value);
    });
    form.controls.aoeType.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value === 'PlayerRadius') {
        (form.get('reqTarget') as AbstractControl).patchValue(false);
        (form.get('reqTarget') as AbstractControl).disable();
        (form.get('reqFacingTarget') as AbstractControl).patchValue(false);
        (form.get('reqFacingTarget') as AbstractControl).disable();
      } else if (value === 'LocationRadius') {
        (form.get('reqTarget') as AbstractControl).patchValue(false);
        (form.get('reqTarget') as AbstractControl).disable();
        (form.get('reqFacingTarget') as AbstractControl).patchValue(false);
        (form.get('reqFacingTarget') as AbstractControl).disable();
      } else if (value === 'TargetRadius') {
        (form.get('reqTarget') as AbstractControl).patchValue(true);
        (form.get('reqTarget') as AbstractControl).disable();
        (form.get('reqFacingTarget') as AbstractControl).enable();
      }
      this.targetTypeChange(
        formConfig,
        (form.controls.targetType.value || '').toString().toLowerCase(),
        value,
        form.controls.aoe_target_count_type.value,
      );
    });
    form.controls.channelling.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value) {
        formConfig.fields.channelling.width = 25;
        formConfig.fields.channelling_pulse_time.label = this.translate.instant(
          this.tableKey + '.CHANNELLING_PULSE_TIME',
        );
        formConfig.fields.channelling_pulse_time.tooltip = this.translate.instant(
          this.tableKey + '.CHANNELLING_PULSE_TIME_HELP',
        );
        formConfig.fields.channelling_pulse_num.label = this.translate.instant(
          this.tableKey + '.CHANNELLING_PULSE_NUM',
        );
        formConfig.fields.channelling_pulse_num.tooltip = this.translate.instant(
          this.tableKey + '.CHANNELLING_PULSE_NUM_HELP',
        );
        formConfig.fields.channelling_in_run.width = 25;
      } else {
        formConfig.fields.channelling.width = 50;
        formConfig.fields.channelling_pulse_time.label = this.translate.instant(this.tableKey + '.ABILITY_PULSE_TIME');
        formConfig.fields.channelling_pulse_time.tooltip = this.translate.instant(
          this.tableKey + '.ABILITY_PULSE_TIME_HELP',
        );
        formConfig.fields.channelling_pulse_num.label = this.translate.instant(this.tableKey + '.ABILITY_PULSE_NUM');
        formConfig.fields.channelling_pulse_num.tooltip = this.translate.instant(
          this.tableKey + '.ABILITY_PULSE_NUM_HELP',
        );
        formConfig.fields.channelling_in_run.width = -1;
      }
    });
    form.controls.interruptible.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value) {
        formConfig.fields.interruption_chance.width = 50;
      } else {
        formConfig.fields.interruption_chance.width = -1;
      }
    });
    form.controls.stealth_reduce.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value) {
        formConfig.fields.stealth_reduction_amount.width = 25;
        formConfig.fields.stealth_reduction_percentage.width = 25;
        formConfig.fields.stealth_reduction_timeout.width = 25;
        formConfig.fields.stealth_reduce.width = 25;
      } else {
        formConfig.fields.stealth_reduction_amount.width = -1;
        formConfig.fields.stealth_reduction_percentage.width = -1;
        formConfig.fields.stealth_reduction_timeout.width = -1;
        formConfig.fields.stealth_reduce.width = 100;
      }
    });
    form.controls.toggle.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      if (value) {
        formConfig.fields.tag_count.width = 25;
        formConfig.fields.tag_disable.width = 25;
        formConfig.fields.pvp_enter.width = 25;
      } else {
        formConfig.fields.tag_count.width = -1;
        formConfig.fields.tag_disable.width = -1;
        formConfig.fields.pvp_enter.width = -1;
      }
    });
    form.controls.aoe_target_count_type.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      this.parseTargetCountType(formConfig, value);
    });
    formConfig.fields.channelling.width = 50;
    formConfig.fields.channelling_pulse_time.label = this.translate.instant(this.tableKey + '.ABILITY_PULSE_TIME');
    formConfig.fields.channelling_pulse_time.tooltip = this.translate.instant(
      this.tableKey + '.ABILITY_PULSE_TIME_HELP',
    );
    formConfig.fields.channelling_pulse_num.label = this.translate.instant(this.tableKey + '.ABILITY_PULSE_NUM');
    formConfig.fields.channelling_pulse_num.tooltip = this.translate.instant(
      this.tableKey + '.ABILITY_PULSE_NUM_HELP',
    );
    formConfig.fields.channelling_in_run.width = -1;
    return form;
  }
}
