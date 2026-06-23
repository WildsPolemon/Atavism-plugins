import {Injectable} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {DropdownItemsService} from '../dropdown-items.service';
import {effectsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {ImageService} from '../../components/image/image.service';
import {Effect, effectDefaults, effectFields, EffectType} from './effects.data';
import {
  abilityFieldConfig,
  boFieldConfig,
  bonusSettingsFieldConfig,
  classFieldConfig,
  damageFieldConfig,
  effectFieldConfig,
  effectTagsFieldConfig, factionFieldConfig,
  instanceAllFieldConfig, interactiveObjectProfileFieldConfig,
  itemFieldConfig,
  lootTableFieldConfig,
  mobsFieldConfig,
  mobSpawnFieldConfig,
  passiveEffectFieldConfig, petProfileFieldConfig,
  skillFieldConfig,
  stateFieldConfig,
  statFieldConfig,
  taskFieldConfig,
  triggerProfileFieldConfig,
  vitalityStatFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EffectsService {
  public tableKey = TabTypes.EFFECTS;
  private readonly listStream = new BehaviorSubject<Effect[]>([]);
  public list = this.listStream.asObservable();
  private profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = effectsTable;
  private readonly effectTypes: DropdownValue[] = [
    {id: EffectType.Damage, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Damage)},
    {id: EffectType.Restore, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Restore)},
    {id: EffectType.Revive, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Revive)},
    {id: EffectType.Stat, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Stat)},
    {id: EffectType.Stun, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Stun)},
    {id: EffectType.Sleep, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Sleep)},
    {id: EffectType.Immune, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Immune)},
    {id: EffectType.Morph, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Morph)},
    {id: EffectType.Dispel, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Dispel)},
    {id: EffectType.Teleport, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Teleport)},
    {id: EffectType.Mount, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Mount)},
    {id: EffectType.BuildObject, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.BuildObject)},
    {id: EffectType.TeachAbility, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.TeachAbility)},
    {id: EffectType.TeachSkill, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.TeachSkill)},
    {id: EffectType.Task, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Task)},
    {id: EffectType.State, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.State)},
    {id: EffectType.Threat, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Threat)},
    {id: EffectType.CreateItem, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.CreateItem)},
    {
      id: EffectType.CreateItemFromLoot,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.CreateItemFromLoot),
    },
    {id: EffectType.Spawn, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Spawn)},
    {
      id: EffectType.SetRespawnLocation,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.SetRespawnLocation),
    },
    {id: EffectType.Vip, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Vip)},
    {id: EffectType.Bonuses, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Bonuses)},
    {id: EffectType.Trap, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Trap)},
    {id: EffectType.Stealth, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Stealth)},
    {id: EffectType.Trigger, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Trigger)},
    {id: EffectType.Shield, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Shield)},
    {id: EffectType.ChangeClass, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.ChangeClass)},
    {
      id: EffectType.UnlearnAbility,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.UnlearnAbility),
    },
    {
      id: EffectType.SpawnInteractiveObject,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.SpawnInteractiveObject),
    },
    {id: EffectType.Experience, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Experience)},
    {
      id: EffectType.SkillExperience,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.SkillExperience),
    },
    {id: EffectType.Faction, value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.Faction)},
    {
      id: EffectType.ChangeFaction,
      value: this.translate.instant(this.tableKey + '.TYPE.' + EffectType.ChangeFaction),
    },
  ];
  private readonly effectSubTypes: Record<EffectType, DropdownValue[]> = {
    [EffectType.Damage]: [
      {id: 'AttackEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.AttackEffect')},
      {id: 'AttackDotEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.AttackDotEffect')},
      {id: 'FlatDamageEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.FlatDamageEffect')},
    ],
    [EffectType.Restore]: [
      {id: 'HealInstantEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.HealInstantEffect')},
      {id: 'HealOverTimeEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.HealOverTimeEffect')},
      {id: 'HealthTransferEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.HealthTransferEffect')},
    ],
    [EffectType.Revive]: [
      {id: 'ReviveEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ReviveEffect')},
    ],
    [EffectType.Stat]: [{id: 'StatEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.StatEffect')}],
    [EffectType.Stun]: [{id: 'StunEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.StunEffect')}],
    [EffectType.Sleep]: [{id: 'SleepEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.SleepEffect')}],
    [EffectType.Immune]: [
      {id: 'ImmuneEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ImmuneEffect')},
    ],
    [EffectType.Morph]: [{id: 'MorphEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.MorphEffect')}],
    [EffectType.Dispel]: [
      {id: 'DispelEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.DispelEffect')},
    ],
    [EffectType.Teleport]: [
      {id: 'TeleportEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TeleportEffect')},
    ],
    [EffectType.Mount]: [{id: 'MountEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.MountEffect')}],
    [EffectType.BuildObject]: [
      {id: 'BuildObjectEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.BuildObjectEffect')},
    ],
    [EffectType.TeachAbility]: [
      {id: 'TeachAbilityEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TeachAbilityEffect')},
    ],
    [EffectType.TeachSkill]: [
      {id: 'TeachSkillEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TeachSkillEffect')},
    ],
    [EffectType.Task]: [
      {id: 'TaskCompleteEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TaskCompleteEffect')},
    ],
    [EffectType.State]: [{id: 'StateEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.StateEffect')}],
    [EffectType.Threat]: [
      {id: 'ThreatEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ThreatEffect')},
    ],
    [EffectType.CreateItem]: [
      {id: 'CreateItemEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.Create Item')},
    ],
    [EffectType.CreateItemFromLoot]: [
      {
        id: 'CreateItemFromLootEffect',
        value: this.translate.instant(this.tableKey + '.SUBTYPES.Create Item From Loot'),
      },
    ],
    [EffectType.Spawn]: [{id: 'SpawnEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.SpawnEffect')}],
    [EffectType.SetRespawnLocation]: [
      {
        id: 'SetRespawnLocationEffect',
        value: this.translate.instant(this.tableKey + '.SUBTYPES.SetRespawnLocationEffect'),
      },
    ],
    [EffectType.Vip]: [{id: 'VipEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.VipEffect')}],
    [EffectType.Bonuses]: [{id: 'BonusEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.BonusEffect')}],
    [EffectType.Trap]: [{id: 'TrapEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TrapEffect')}],
    [EffectType.Stealth]: [
      {id: 'StealthEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.StealthEffect')},
    ],
    [EffectType.Trigger]: [
      {id: 'TriggerEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.TriggerEffect')},
    ],
    [EffectType.Shield]: [
      {id: 'ShieldEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ShieldEffect')},
    ],
    [EffectType.ChangeClass]: [
      {id: 'ChangeClassEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ChangeClassEffect')},
    ],
    [EffectType.UnlearnAbility]: [
      {id: 'UnlearnAbilityEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.UnlearnAbilityEffect')},
    ],
    [EffectType.SpawnInteractiveObject]: [
      {
        id: 'SpawnInteractiveObjectEffect',
        value: this.translate.instant(this.tableKey + '.SUBTYPES.SpawnInteractiveObjectEffect'),
      },
    ],
    [EffectType.Experience]: [
      {id: 'ExperienceEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ExperienceEffect')},
    ],
    [EffectType.SkillExperience]: [
      {id: 'SkillExperienceEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.SkillExperienceEffect')},
    ],
    Faction: [
      {id: 'FactionEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.FactionEffect')},
    ],
    ChangeFaction: [
      {id: 'ChangeFactionEffect', value: this.translate.instant(this.tableKey + '.SUBTYPES.ChangeFactionEffect')},
    ],
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: false,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      effectMainType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: this.effectTypes,
      },
      effectType: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      isBuff: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      show_effect: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      passive: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      skillType: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: false,
        data: [],
        fieldConfig: skillFieldConfig,
      },
      skillLevelMod: {
        type: ConfigTypes.numberType,
        visible: false,
        filterType: FilterTypes.decimal,
        filterVisible: false,
      },
      stackLimit: {type: ConfigTypes.numberType, visible: false, filterType: FilterTypes.integer, filterVisible: false},
      stackTime: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      allowMultiple: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      duration: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.decimal, filterVisible: true},
      pulseCount: {type: ConfigTypes.numberType, visible: false, filterType: FilterTypes.integer, filterVisible: false},
      pulseCoordEffect: {type: ConfigTypes.stringType, visible: false, useAsSearch: true},
      tooltip: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      interruption_chance: {
        type: ConfigTypes.numberType,
        visible: false,
        filterType: FilterTypes.decimal,
        filterVisible: false,
      },
      interruption_chance_max: {
        type: ConfigTypes.numberType,
        visible: false,
        filterType: FilterTypes.decimal,
        filterVisible: false,
      },
      interruption_all: {
        type: ConfigTypes.booleanType,
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      bonusEffectReq: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        filterVisible: false,
        data: [],
      },
      bonusEffect: {
        type: ConfigTypes.dropdown,
        visible: false,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: effectFieldConfig,
        filterVisible: false,
        data: [],
      },
      bonusEffectReqConsumed: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: false,
        filterType: FilterTypes.booleanType,
        filterVisible: false,
      },
      removeBonusWhenEffectRemoved: {
        type: ConfigTypes.booleanType,
        textAlign: 'center',
        visible: false,
        filterType: FilterTypes.booleanType,
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
    orderFields: true,
    fields: {
      name: {name: 'name', order: 0, type: FormFieldType.input, require: true, length: 45, width: 50},
      icon: {name: 'icon', order: 1, type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      effectMainType: {
        name: 'effectMainType',
        order: 2,
        type: FormFieldType.dropdown,
        require: true,
        width: 50,
        search: true,
        hideNone: true,
        data: this.effectTypes,
      },
      effectType: {
        name: 'effectType',
        order: 3,
        type: FormFieldType.dropdown,
        require: true,
        hideNone: true,
        width: 50,
        data: [],
      },
      intValue1: {name: 'intValue1', type: FormFieldType.hidden, search: true, width: 25},
      intValue2: {name: 'intValue2', type: FormFieldType.hidden, search: true, width: 25},
      intValue3: {name: 'intValue3', type: FormFieldType.hidden, search: true, width: 25},
      intValue4: {name: 'intValue4', type: FormFieldType.hidden, search: true, width: 25},
      intValue5: {name: 'intValue5', type: FormFieldType.hidden, search: true, width: 25},
      floatValue1: {name: 'floatValue1', type: FormFieldType.hidden, search: true, width: 25},
      floatValue2: {name: 'floatValue2', type: FormFieldType.hidden, search: true, width: 25},
      floatValue3: {name: 'floatValue3', type: FormFieldType.hidden, search: true, width: 25},
      floatValue4: {name: 'floatValue4', type: FormFieldType.hidden, search: true, width: 25},
      floatValue5: {name: 'floatValue5', type: FormFieldType.hidden, search: true, width: 25},
      stringValue1: {name: 'stringValue1', type: FormFieldType.hidden, search: true, width: 25},
      stringValue2: {name: 'stringValue2', type: FormFieldType.hidden, search: true, width: 25},
      stringValue3: {name: 'stringValue3', type: FormFieldType.hidden, search: true, width: 25},
      stringValue4: {name: 'stringValue4', type: FormFieldType.hidden, search: true, width: 25},
      stringValue5: {name: 'stringValue5', type: FormFieldType.hidden, search: true, width: 25},
      boolValue1: {name: 'boolValue1', type: FormFieldType.hidden, width: 25},
      boolValue2: {name: 'boolValue2', type: FormFieldType.hidden, width: 25},
      boolValue3: {name: 'boolValue3', type: FormFieldType.hidden, width: 25},
      boolValue4: {name: 'boolValue4', type: FormFieldType.hidden, width: 25},
      boolValue5: {name: 'boolValue5', type: FormFieldType.hidden, width: 25},
      duration: {name: 'duration', type: FormFieldType.hidden, width: 25},
      title_1: {name: 'title_1', type: FormFieldType.hidden},
      title_2: {name: 'title_2', type: FormFieldType.hidden},
      title_3: {name: 'title_3', type: FormFieldType.hidden},
      title_4: {name: 'title_4', type: FormFieldType.hidden},
      pulseCoordEffect: {
        name: 'pulseCoordEffect',
        type: FormFieldType.hidden,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 127,
        width: 50,
      },
      isBuff: {name: 'isBuff', type: FormFieldType.hidden, width: 25},
      show_effect: {name: 'show_effect', type: FormFieldType.hidden, width: 25},
      skillType: {
        name: 'skillType',
        type: FormFieldType.hidden,
        allowNew: true,
        width: 25,
        fieldConfig: skillFieldConfig,
      },
      skillLevelMod: {name: 'skillLevelMod', type: FormFieldType.hidden, width: 25},
      passive: {name: 'passive', type: FormFieldType.hidden, width: 25},
      stackLimit: {name: 'stackLimit', type: FormFieldType.hidden, width: 25},
      stackTime: {name: 'stackTime', type: FormFieldType.hidden, width: 25},
      allowMultiple: {name: 'allowMultiple', type: FormFieldType.hidden, width: 50},
      pulseCount: {name: 'pulseCount', type: FormFieldType.hidden, width: 25},
      tooltip: {name: 'tooltip', type: FormFieldType.hidden, width: 100},
      interruption_chance: {name: 'interruption_chance', type: FormFieldType.hidden, width: 33},
      interruption_chance_max: {name: 'interruption_chance_max', type: FormFieldType.hidden, width: 33},
      interruption_all: {name: 'interruption_all', type: FormFieldType.hidden, width: 33},
      group_tags: {
        name: 'group_tags',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        fieldConfig: effectTagsFieldConfig,
        width: 100,
      },
      title1: {name: '', label: this.translate.instant(this.tableKey + '.TITLE1'), type: FormFieldType.hidden},
      bonusEffectReq: {name: 'bonusEffectReq', type: FormFieldType.hidden, width: 50, fieldConfig: effectFieldConfig},
      bonusEffect: {name: 'bonusEffect', type: FormFieldType.hidden, width: 50, fieldConfig: effectFieldConfig},
      bonusEffectReqConsumed: {name: 'bonusEffectReqConsumed', type: FormFieldType.hidden, width: 50},
      removeBonusWhenEffectRemoved: {name: 'removeBonusWhenEffectRemoved', type: FormFieldType.hidden, width: 50},
    },
  };
  private defaults: Partial<Effect> = {...effectDefaults, ...{name: '', icon: '', displayName: '', effectMainType: ''}};
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  private readonly morphTypeOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.Ground')},
    {id: 1, value: this.translate.instant(this.tableKey + '.Swimming')},
    {id: 2, value: this.translate.instant(this.tableKey + '.Flying')},
  ];
  private readonly dispelOptions: DropdownValue[] = [
    {id: 'All', value: this.translate.instant(this.tableKey + '.All')},
    {id: 'By Tags', value: this.translate.instant(this.tableKey + '.By Tags')},
    {id: 'MountEffect', value: this.translate.instant(this.tableKey + '.MountEffect')},
    {id: 'MorphEffect', value: this.translate.instant(this.tableKey + '.MorphEffect')},
  ];
  private readonly teleportTypeOptions: DropdownValue[] = [
    {id: 'Standard', value: this.translate.instant(this.tableKey + '.Standard')},
    {id: 'To Target', value: this.translate.instant(this.tableKey + '.To Target')},
  ];
  private readonly spawnTypes: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.Wild')},
    {id: 2, value: this.translate.instant(this.tableKey + '.Non Combat pet')},
    {id: 3, value: this.translate.instant(this.tableKey + '.Combat pet')},
  ];
  private readonly targetTypes: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.Friendly')},
    {id: 1, value: this.translate.instant(this.tableKey + '.Enemy')},
  ];
  private previousValue: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      this.formConfig.fields.pulseCoordEffect.acceptFolder = profile.folder + profile.coordFolder;
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
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.bonusEffectReq.data = listing;
      this.tableConfig.fields.bonusEffect.data = listing;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.skillType.data = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getSkills();
    await this.dropdownItemsService.getEffects();
    await this.dropdownItemsService.getVitalityStats();
    await this.dropdownItemsService.getDamages();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getInstances();
    await this.dropdownItemsService.getBuildObjects();
    await this.dropdownItemsService.getTasks();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getLootTables();
    await this.dropdownItemsService.getSpawnData();
    await this.dropdownItemsService.getMobs();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getEffects();
    }
    const response = await this.databaseService.queryList<Effect>(
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
    (form.get('effectMainType') as AbstractControl).enable();
    let {item} = await this.tablesService.openDialog<Effect>(formConfig, form);
    if (!item) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item = await this.setDefaults(item);
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Effect>(this.dbProfile, this.dbTable, item);
    this.formReset(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Effect>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const {item, action} = await this.updateEditForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.creationtimestamp = this.databaseService.getTimestampNow();
      delete item.id;
      newId = await this.databaseService.insert<Effect>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<Effect>(this.dbProfile, this.dbTable, item, 'id', record.id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  private async setDefaults(item: Effect): Promise<Effect> {
    item.isactive = true;
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isBuff = item.isBuff ? item.isBuff : (this.defaults.isBuff as boolean);
    item.show_effect = item.show_effect ? item.show_effect : (this.defaults.show_effect as boolean);
    item.skillLevelMod = item.skillLevelMod ? item.skillLevelMod : (this.defaults.skillLevelMod as number);
    item.bonusEffectReq = item.bonusEffectReq ? item.bonusEffectReq : (this.defaults.bonusEffectReq as number);
    item.bonusEffect = item.bonusEffect ? item.bonusEffect : (this.defaults.bonusEffect as number);
    item.bonusEffectReqConsumed = item.bonusEffectReqConsumed
      ? item.bonusEffectReqConsumed
      : (this.defaults.bonusEffectReqConsumed as boolean);
    item.removeBonusWhenEffectRemoved = item.removeBonusWhenEffectRemoved
      ? item.removeBonusWhenEffectRemoved
      : (this.defaults.removeBonusWhenEffectRemoved as boolean);
    item.intValue1 = item.intValue1 ? item.intValue1 : (this.defaults.intValue1 as number);
    item.intValue2 = item.intValue2 ? item.intValue2 : (this.defaults.intValue2 as number);
    item.intValue3 = item.intValue3 ? item.intValue3 : (this.defaults.intValue3 as number);
    item.intValue4 = item.intValue4 ? item.intValue4 : (this.defaults.intValue4 as number);
    item.intValue5 = item.intValue5 ? item.intValue5 : (this.defaults.intValue5 as number);
    item.floatValue1 = item.floatValue1 ? item.floatValue1 : (this.defaults.floatValue1 as number);
    item.floatValue2 = item.floatValue2 ? item.floatValue2 : (this.defaults.floatValue2 as number);
    item.floatValue3 = item.floatValue3 ? item.floatValue3 : (this.defaults.floatValue3 as number);
    item.floatValue4 = item.floatValue4 ? item.floatValue4 : (this.defaults.floatValue4 as number);
    item.floatValue5 = item.floatValue5 ? item.floatValue5 : (this.defaults.floatValue5 as number);
    item.stringValue1 = item.stringValue1 ? item.stringValue1 : (this.defaults.stringValue1 as string);
    item.stringValue2 = item.stringValue2 ? item.stringValue2 : (this.defaults.stringValue2 as string);
    item.stringValue3 = item.stringValue3 ? item.stringValue3 : (this.defaults.stringValue3 as string);
    item.stringValue4 = item.stringValue4 ? item.stringValue4 : (this.defaults.stringValue4 as string);
    item.stringValue5 = item.stringValue5 ? item.stringValue5 : (this.defaults.stringValue5 as string);
    item.boolValue1 = item.boolValue1 ? item.boolValue1 : (this.defaults.boolValue1 as boolean);
    item.boolValue2 = item.boolValue2 ? item.boolValue2 : (this.defaults.boolValue2 as boolean);
    item.boolValue3 = item.boolValue3 ? item.boolValue3 : (this.defaults.boolValue3 as boolean);
    item.boolValue4 = item.boolValue4 ? item.boolValue4 : (this.defaults.boolValue4 as boolean);
    item.boolValue5 = item.boolValue5 ? item.boolValue5 : (this.defaults.boolValue5 as boolean);
    item.group_tags = item.group_tags ? item.group_tags : '';
    item.skillType = item.skillType ? item.skillType : (this.defaults.skillType as number);
    item.passive = item.passive ? item.passive : (this.defaults.passive as boolean);
    item.stackLimit = item.stackLimit ? item.stackLimit : (this.defaults.stackLimit as number);
    item.allowMultiple = item.allowMultiple ? item.allowMultiple : (this.defaults.allowMultiple as boolean);
    item.pulseCount = item.pulseCount ? item.pulseCount : (this.defaults.pulseCount as number);
    item.pulseCoordEffect = item.pulseCoordEffect ? item.pulseCoordEffect : (this.defaults.pulseCoordEffect as string);
    item.duration = item.duration ? item.duration : (this.defaults.duration as number);
    if (
      (item.effectMainType === EffectType.Damage && item.effectType === 'AttackDotEffect') ||
      (item.effectMainType === EffectType.Restore && item.effectType === 'HealOverTimeEffect') ||
      item.effectMainType === EffectType.Stat ||
      item.effectMainType === EffectType.Stealth
    ) {
      item.stackTime = item.stackTime ? item.stackTime : false;
    } else {
      item.stackTime = false;
    }
    if (item.effectMainType === EffectType.Damage) {
      if (item.effectType !== 'AttackEffect') {
        item.intValue2 = this.defaults.intValue2 as number;
        item.intValue3 = this.defaults.intValue3 as number;
      }
      if (item.effectType === 'FlatDamageEffect') {
        item.floatValue1 = this.defaults.floatValue1 as number;
        item.skillType = this.defaults.skillType as number;
        item.skillLevelMod = this.defaults.skillLevelMod as number;
        item.boolValue1 = false;
      } else {
        item.floatValue1 = item.floatValue1 ? item.floatValue1 : 1;
        item.boolValue1 = item.boolValue1 ? item.boolValue1 : false;
      }
      if (item.effectType.indexOf('Dot') === -1) {
        item.pulseCount = this.defaults.pulseCount as number;
        item.allowMultiple = this.defaults.allowMultiple as boolean;
        item.stackLimit = this.defaults.stackLimit as number;
      }
      item = this.clearAllFields(item, [
        'isBuff',
        'passive',
        'duration',
        'pulseCoordEffect',
        'skillType',
        'skillLevelMod',
        'pulseCount',
        'allowMultiple',
        'stackLimit',
      ]);
      item = this.stringToDefault(item, 3);
      item = this.intToDefault(item, 4);
      item = this.floatToDefault(item, 3);
      item = this.boolToDefault(item, 2);
    } else if (item.effectMainType === EffectType.Restore) {
      if (item.effectType.indexOf('Transfer') !== -1 || item.effectType.indexOf('Instant') !== -1) {
        if (item.effectType.indexOf('Transfer') === -1) {
          item.floatValue1 = this.defaults.floatValue1 as number;
        }
        if (item.effectType.indexOf('Instant') === -1) {
          item.pulseCoordEffect = this.defaults.pulseCoordEffect as string;
        }
        item.stackLimit = this.defaults.stackLimit as number;
        item.allowMultiple = this.defaults.allowMultiple as boolean;
        item.duration = this.defaults.duration as number;
        item.pulseCount = this.defaults.pulseCount as number;
      }
      item = this.clearAllFields(item, [
        'skillType',
        'skillLevelMod',
        'pulseCount',
        'allowMultiple',
        'stackLimit',
        'duration',
        'pulseCoordEffect',
      ]);
      item = this.stringToDefault(item, 2);
      item.floatValue2 = this.defaults.floatValue2;
      item.floatValue3 = this.defaults.floatValue3;
      item = this.intToDefault(item, 3);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Revive) {
      item.tooltip = this.defaults.tooltip as string;
      item = this.clearAllFields(item, []);
      item = this.stringToDefault(item, 4);
      item = this.intToDefault(item, 4);
      item = this.floatToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Stat || item.effectMainType === EffectType.Stealth) {
      item = this.clearAllFields(item, [
        'isBuff',
        'passive',
        'skillType',
        'skillLevelMod',
        'pulseCount',
        'allowMultiple',
        'stackLimit',
        'duration',
        'pulseCoordEffect',
      ]);
      item = this.boolToDefault(item, 3);
      if (item.effectMainType === EffectType.Stat) {
        item = this.intToDefault(item);
      } else {
        item.boolValue1 = !!this.defaults.intValue1;
        item = this.intToDefault(item, 2);
      }
    } else if (item.effectMainType === EffectType.Stun || item.effectMainType === EffectType.Sleep) {
      item = this.clearAllFields(item, ['duration', 'pulseCoordEffect']);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item);
      item = this.intToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Immune) {
      item = this.clearAllFields(item, ['isBuff', 'passive', 'duration']);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item);
      item = this.intToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Morph) {
      item = this.clearAllFields(item, ['isBuff', 'duration']);
      item = this.stringToDefault(item, 2);
      item = this.floatToDefault(item);
      item = this.intToDefault(item, 3);
      item = this.boolToDefault(item, 2);
    } else if (item.effectMainType === EffectType.Dispel) {
      if (item.stringValue1 !== 'By Tags') {
        item.stringValue2 = '';
      }
      item = this.clearAllFields(item, []);
      item = this.stringToDefault(item, 3);
      item = this.floatToDefault(item);
      item = this.intToDefault(item, 2);
      item = this.boolToDefault(item);
    } else if (
      item.effectMainType === EffectType.BuildObject ||
      item.effectMainType === EffectType.TeachAbility ||
      item.effectMainType === EffectType.UnlearnAbility ||
      item.effectMainType === EffectType.TeachSkill ||
      item.effectMainType === EffectType.Task ||
      item.effectMainType === EffectType.Threat ||
      item.effectMainType === EffectType.CreateItem
    ) {
      item = this.clearAllFields(item, []);
      item = this.intToDefault(item, 2);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.State) {
      item = this.clearAllFields(item, ['isBuff', 'duration']);
      item = this.stringToDefault(item, 2);
      item = this.floatToDefault(item);
      item = this.intToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.CreateItemFromLoot) {
      item = this.clearAllFields(item, []);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Spawn) {
      if (item.intValue2 === 0) {
        item.duration = this.defaults.duration as number;
      }
      item = this.clearAllFields(item, ['duration']);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item);
      item = this.intToDefault(item, 4);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.SetRespawnLocation) {
      item.intValue1 = item.intValue1 ? item.intValue1 : -1;
      item = this.clearAllFields(item, []);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item, 4);
      item = this.intToDefault(item, 2);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Vip) {
      item = this.clearAllFields(item, []);
      item = this.stringToDefault(item);
      item = this.floatToDefault(item);
      item = this.intToDefault(item, 3);
      item = this.boolToDefault(item);
      item = this.clearBottom(item);
    } else if (item.effectMainType === EffectType.Bonuses) {
      item = this.clearAllFields(item, ['isBuff', 'passive', 'duration']);
      item.boolValue1 = this.defaults.boolValue1 as boolean;
      item = this.boolToDefault(item, 3);
    } else if (item.effectMainType === EffectType.Teleport) {
      item = this.stringToDefault(item, 2);
      item = this.floatToDefault(item, 4);
      item = this.intToDefault(item, 2);
      item = this.boolToDefault(item);
      if (item.stringValue1 === 'Standard') {
        item.intValue1 = item.intValue1 ? item.intValue1 : -1;
      }
    } else if (item.effectMainType === EffectType.Trap) {
      item = this.clearAllFields(item);
      item = this.floatToDefault(item, 4);
      item = this.intToDefault(item, 3);
      item = this.stringToDefault(item, 2);
      item = this.boolToDefault(item);
      item = this.clearBottom(item);
    } else if (item.effectMainType === EffectType.Trigger) {
      if (!item.stringValue1) {
        // @ts-ignore
        item['stringValue' + 1] = '';
      }
      item = this.clearAllFields(item, ['isBuff', 'duration']);
      item = this.intToDefault(item);
      item = this.stringToDefault(item, 2);
      item = this.floatToDefault(item);
      item = this.boolToDefault(item);
    } else if (item.effectMainType === EffectType.Shield) {
      item = this.clearAllFields(item, [
        'isBuff',
        'passive',
        'skillType',
        'skillLevelMod',
        'pulseCount',
        'allowMultiple',
        'stackLimit',
        'duration',
        'pulseCoordEffect',
      ]);
      item.intValue5 = item.intValue5 ? item.intValue5 : -1;
      item.floatValue5 = item.floatValue5 ? item.floatValue5 : -1;
      item.stringValue5 = '';
      item.boolValue5 = false;
    }
    if (
      ![EffectType.Damage, EffectType.Morph, EffectType.Stun, EffectType.Sleep].includes(
        item.effectMainType as EffectType,
      )
    ) {
      item = this.clearInterruption(item);
    }
    return item;
  }

  private clearInterruption(item: Effect): Effect {
    const allFields = ['interruption_chance', 'interruption_chance_max', 'interruption_all'];
    allFields.forEach((field) => {
      // @ts-ignore
      item[field] = this.defaults[field];
    });
    return item;
  }

  private clearBottom(item: Effect): Effect {
    const allFields = [
      'tooltip',
      'bonusEffectReq',
      'bonusEffect',
      'bonusEffectReqConsumed',
      'removeBonusWhenEffectRemoved',
    ];
    allFields.forEach((field) => {
      // @ts-ignore
      item[field] = this.defaults[field];
    });
    return item;
  }

  private clearAllFields(item: Effect, usedFields: string[] = []): Effect {
    const allFields = [
      'isBuff',
      'skillType',
      'skillLevelMod',
      'passive',
      'stackLimit',
      'allowMultiple',
      'duration',
      'pulseCount',
      'pulseCoordEffect',
      'chance',
    ];
    allFields.forEach((field) => {
      if (!usedFields.includes(field)) {
        // @ts-ignore
        item[field] = this.defaults[field];
      }
    });
    return item;
  }

  private intToDefault(item: Effect, i = 1): Effect {
    for (let j = i; j <= 5; j++) {
      // @ts-ignore
      item['intValue' + j] = this.defaults['intValue' + j];
    }
    return item;
  }

  private floatToDefault(item: Effect, i = 1): Effect {
    for (let j = i; j <= 5; j++) {
      // @ts-ignore
      item['floatValue' + j] = this.defaults['floatValue' + j];
    }
    return item;
  }

  private stringToDefault(item: Effect, i = 1): Effect {
    for (let j = i; j <= 5; j++) {
      // @ts-ignore
      item['stringValue' + j] = this.defaults['stringValue' + j];
    }
    return item;
  }

  private boolToDefault(item: Effect, i = 1): Effect {
    for (let j = i; j <= 5; j++) {
      // @ts-ignore
      item['boolValue' + j] = this.defaults['boolValue' + j];
    }
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Effect>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.updateEditForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Effect>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async updateEditForm(
    record: Effect,
    updateMode = false,
  ): Promise<{item: Effect | undefined; action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    this.previousValue = record.intValue2;
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    form.patchValue(record);
    (form.get('effectMainType') as AbstractControl).disable();
    formConfig.saveAsNew = updateMode;
    let {item, action} = await this.tablesService.openDialog<Effect>(formConfig, form);
    if (!item) {
      this.formReset(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item = await this.setDefaults(item);
    this.formReset(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      icon: '',
      effectMainType: ['', Validators.required],
      effectType: ['', Validators.required],
      isBuff: false,
      show_effect: true,
      skillType: '',
      skillLevelMod: [0, Validators.min(0)],
      passive: '',
      stackLimit: [0, Validators.min(0)],
      stackTime: false,
      allowMultiple: '',
      duration: [0, Validators.min(0)],
      pulseCount: [1, Validators.min(1)],
      tooltip: '',
      bonusEffectReq: '',
      bonusEffectReqConsumed: '',
      bonusEffect: '',
      removeBonusWhenEffectRemoved: '',
      pulseCoordEffect: '',
      intValue1: '',
      intValue2: '',
      intValue3: '',
      intValue4: '',
      intValue5: '',
      floatValue1: '',
      floatValue2: '',
      floatValue3: '',
      floatValue4: '',
      floatValue5: '',
      stringValue1: '',
      stringValue2: '',
      stringValue3: '',
      stringValue4: '',
      stringValue5: '',
      boolValue1: '',
      boolValue2: '',
      boolValue3: '',
      boolValue4: '',
      boolValue5: '',
      interruption_chance: [0, Validators.min(0)],
      interruption_chance_max: [0, Validators.min(0)],
      interruption_all: '',
      group_tags: '',
    });
    form.patchValue(this.defaults, {emitEvent: false});
    let prevType = '';
    (form.get('effectMainType') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((mainType) => {
        this.resetFields(form);
        this.resetFieldWidth(formConfig);
        effectFields.forEach((key) => {
          formConfig.fields[key].order = 99;
          formConfig.fields[key].type = FormFieldType.hidden;
        });
        formConfig.fields.effectType.data = [];
        if (mainType) {
          formConfig.fields.effectType.data = this.effectSubTypes[mainType as EffectType];
        }
        if (prevType && prevType.length > 0 && prevType !== mainType) {
          effectFields.forEach((key) => {
            if (key === 'title1') {
              return;
            }
            let value: any = '';
            if (key === 'skillLevelMod' || key === 'stackLimit' || key === 'duration') {
              value = 0;
            } else if (key === 'pulseCount') {
              value = 1;
            }
            form.get(key)?.patchValue(value);
          });
        }
        (form.get('effectType') as AbstractControl).setValue(null);
        this.clearValidators(form);
        if (mainType === EffectType.Damage) {
          this.damageFieldsSetup(form, formConfig);
          this.parseDamageTypeFields(form, formConfig, (form.get('effectType') as AbstractControl).value);
          if (prevType !== mainType && (form.get('effectType') as AbstractControl).value !== 'FlatDamageEffect') {
            (form.get('boolValue1') as AbstractControl).setValue(true);
          }
          this.showBottom(formConfig, 20, false, true, true);
        } else if (mainType === EffectType.Restore) {
          this.restoreFieldsSetup(form, formConfig);
          this.parseRestoreTypeFields(form, formConfig, (form.get('effectType') as AbstractControl).value);
          this.showBottom(formConfig, 14);
        } else if (mainType === EffectType.Revive) {
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue2.width = 50;
          formConfig.fields.stringValue3.width = 50;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue2.width = 50;
          formConfig.fields.intValue3.width = 50;
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.allowNew = true;
          formConfig.fields.stringValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue1.fieldConfig = vitalityStatFieldConfig;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.VITALITY_STAT') + ' 1';
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.VITALITY_STAT_HELP') + ' 1';
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.HEALTH_GIVEN') + ' 1';
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.HEALTH_GIVEN_HELP') + ' 1';
          (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue2.order = 6;
          formConfig.fields.stringValue2.allowNew = true;
          formConfig.fields.stringValue2.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue2.fieldConfig = vitalityStatFieldConfig;
          formConfig.fields.stringValue2.label = this.translate.instant(this.tableKey + '.VITALITY_STAT') + ' 2';
          formConfig.fields.stringValue2.tooltip = this.translate.instant(this.tableKey + '.VITALITY_STAT_HELP') + ' 2';
          formConfig.fields.intValue2.order = 7;
          formConfig.fields.intValue2.type = FormFieldType.integer;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.HEALTH_GIVEN') + ' 2';
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.HEALTH_GIVEN_HELP') + ' 2';
          (form.get('intValue2') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue2') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue3.order = 8;
          formConfig.fields.stringValue3.allowNew = true;
          formConfig.fields.stringValue3.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue3.fieldConfig = vitalityStatFieldConfig;
          formConfig.fields.stringValue3.label = this.translate.instant(this.tableKey + '.VITALITY_STAT') + ' 3';
          formConfig.fields.stringValue3.tooltip = this.translate.instant(this.tableKey + '.VITALITY_STAT_HELP') + ' 3';
          formConfig.fields.intValue3.order = 9;
          formConfig.fields.intValue3.type = FormFieldType.integer;
          formConfig.fields.intValue3.label = this.translate.instant(this.tableKey + '.HEALTH_GIVEN') + ' 3';
          formConfig.fields.intValue3.tooltip = this.translate.instant(this.tableKey + '.HEALTH_GIVEN_HELP') + ' 3';
          (form.get('intValue3') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue3') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 10, true);
        } else if (mainType === EffectType.Stat || mainType === EffectType.Stealth) {
          let position = 4;
          formConfig.fields.boolValue2.order = position;
          formConfig.fields.boolValue2.width = 50;
          formConfig.fields.boolValue2.type = FormFieldType.boolean;
          formConfig.fields.boolValue2.label = this.translate.instant(this.tableKey + '.EFFECT_AFTER_LOGOUT');
          formConfig.fields.boolValue2.tooltip = this.translate.instant(this.tableKey + '.EFFECT_AFTER_LOGOUT_HELP');
          position++;
          if (mainType === EffectType.Stealth) {
            formConfig.fields.intValue1.order = position;
            formConfig.fields.intValue1.width = 50;
            formConfig.fields.intValue1.type = FormFieldType.integer;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.STEALTH');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.STEALTH_HELP');
            position++;
          } else {
            formConfig.fields.boolValue1.order = position;
            formConfig.fields.boolValue1.width = 50;
            formConfig.fields.boolValue1.type = FormFieldType.boolean;
            formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.MODIFY_BY_PERCENT');
            formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.MODIFY_BY_PERCENT_HELP');
            position++;
          }
          if (mainType === EffectType.Stat) {
            for (let i = 1; i <= 5; ++i) {
              position += 1;
              formConfig.fields['stringValue' + i].order = position;
              formConfig.fields['stringValue' + i].allowNew = true;
              formConfig.fields['stringValue' + i].width = 50;
              formConfig.fields['stringValue' + i].type = FormFieldType.dynamicDropdown;
              formConfig.fields['stringValue' + i].fieldConfig = statFieldConfig;
              formConfig.fields['stringValue' + i].label = this.translate.instant(this.tableKey + '.STAT') + ' ' + i;
              formConfig.fields['stringValue' + i].tooltip =
                this.translate.instant(this.tableKey + '.STAT_HELP') + ' ' + i;
              position += 1;
              formConfig.fields['floatValue' + i].order = position;
              formConfig.fields['floatValue' + i].width = 50;
              formConfig.fields['floatValue' + i].type = (form.get('boolValue1') as AbstractControl).value
                ? FormFieldType.decimal
                : FormFieldType.integer;
              formConfig.fields['floatValue' + i].label =
                this.translate.instant(this.tableKey + '.MODIFICATION') + ' ' + i;
              formConfig.fields['floatValue' + i].tooltip =
                this.translate.instant(this.tableKey + '.MODIFICATION_HELP') + ' ' + i;
            }
          }
          position += 1;
          formConfig.fields.isBuff.order = position;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          position += 1;
          formConfig.fields.show_effect.order = position;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          position += 1;
          formConfig.fields.passive.order = position;
          formConfig.fields.passive.type = FormFieldType.boolean;
          position = this.showTimeFields(formConfig, position);
          formConfig.fields.skillLevelMod.type = FormFieldType.decimal;
          position += 1;
          this.showBottom(formConfig, position, false, true, false, true);
        } else if (mainType === EffectType.Stun || mainType === EffectType.Sleep) {
          this.showDurationField(formConfig, 4);
          formConfig.fields.show_effect.order = 5;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          formConfig.fields.pulseCoordEffect.order = 6;
          formConfig.fields.pulseCoordEffect.width = 50;
          formConfig.fields.pulseCoordEffect.type = FormFieldType.file;
          this.showBottom(formConfig, 6, false, true, true);
        } else if (mainType === EffectType.Immune) {
          formConfig.fields.isBuff.order = 4;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          formConfig.fields.passive.order = 5;
          formConfig.fields.passive.type = FormFieldType.boolean;
          formConfig.fields.show_effect.order = 6;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          this.showDurationField(formConfig, 7);
          this.showBottom(formConfig, 8);
        } else if (mainType === EffectType.Morph) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue1.type = FormFieldType.file;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.MODEL');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.MODEL_HELP');
          formConfig.fields.stringValue1.acceptFolder = this.profile.folder + this.profile.mobFolder;
          formConfig.fields.stringValue1.accept = 'prefab';
          formConfig.fields.stringValue1.acceptTitle = this.translate.instant('FILE_TYPE.PREFAB');
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.SWITCH_TO_ACTIONBAR');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.SWITCH_TO_ACTIONBAR_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.intValue2.order = 6;
          formConfig.fields.intValue2.type = FormFieldType.dropdown;
          formConfig.fields.intValue2.data = this.morphTypeOptions;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.MORPH_TYPE');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.MORPH_TYPE_HELP');
          formConfig.fields.boolValue1.order = 7;
          formConfig.fields.boolValue1.type = FormFieldType.boolean;
          formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.REMOVE_EXISTING_MORPHS');
          formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.REMOVE_EXISTING_MORPHS_HELP');
          formConfig.fields.isBuff.order = 8;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          formConfig.fields.isBuff.width = 25;
          formConfig.fields.show_effect.order = 9;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          this.showDurationField(formConfig, 10);
          this.showBottom(formConfig, 11, false, true, true);
        } else if (mainType === EffectType.Dispel) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue1.type = FormFieldType.dropdown;
          formConfig.fields.stringValue1.data = this.dispelOptions;
          formConfig.fields.stringValue1.require = true;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.DISPEL_TYPE');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.DISPEL_TYPE_HELP');
          (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.AMMOUNT_TO_REMOVE');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.AMMOUNT_TO_REMOVE_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 7);
        } else if (mainType === EffectType.Teleport) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue1.type = FormFieldType.dropdown;
          formConfig.fields.stringValue1.data = this.teleportTypeOptions;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.TELEPORT_TYPE');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.TELEPORT_TYPE_HELP');
          formConfig.fields.stringValue1.require = true;
          (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
          if ((form.get('stringValue1') as AbstractControl).value === 'Standard') {
            formConfig.fields.intValue1.order = 5;
            formConfig.fields.intValue1.width = 50;
            formConfig.fields.intValue1.allowNew = true;
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.fieldConfig = instanceAllFieldConfig;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.INSTANCE');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.INSTANCE_HELP');
            formConfig.fields.floatValue1.order = 6;
            formConfig.fields.floatValue1.type = FormFieldType.decimal;
            formConfig.fields.floatValue1.width = 33;
            formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.POSITION_X');
            formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.POSITION_X_HELP');
            formConfig.fields.floatValue2.order = 7;
            formConfig.fields.floatValue2.type = FormFieldType.decimal;
            formConfig.fields.floatValue2.width = 33;
            formConfig.fields.floatValue2.label = this.translate.instant(this.tableKey + '.POSITION_Y');
            formConfig.fields.floatValue2.tooltip = this.translate.instant(this.tableKey + '.POSITION_Y_HELP');
            formConfig.fields.floatValue3.order = 8;
            formConfig.fields.floatValue3.type = FormFieldType.decimal;
            formConfig.fields.floatValue3.width = 33;
            formConfig.fields.floatValue3.label = this.translate.instant(this.tableKey + '.POSITION_Z');
            formConfig.fields.floatValue3.tooltip = this.translate.instant(this.tableKey + '.POSITION_Z_HELP');
          } else {
            formConfig.fields.intValue1.type = FormFieldType.hidden;
            formConfig.fields.floatValue1.type = FormFieldType.hidden;
            formConfig.fields.floatValue2.type = FormFieldType.hidden;
            formConfig.fields.floatValue3.type = FormFieldType.hidden;
          }
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.SpawnInteractiveObject) {
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = interactiveObjectProfileFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.INTERACTIVEOBJECT');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.INTERACTIVEOBJECT_HELP');
          formConfig.fields.intValue1.require = true;
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue2.type = FormFieldType.hidden;
          formConfig.fields.floatValue3.type = FormFieldType.hidden;
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.SkillExperience) {
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = skillFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.SKILL');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.SKILL_HELP');
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue2.order = 6;
          formConfig.fields.intValue2.width = 50;
          formConfig.fields.intValue2.type = FormFieldType.integer;
          formConfig.fields.intValue2.require = true;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.EXP');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.EXP_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          (form.get('intValue2') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue2') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue2.type = FormFieldType.hidden;
          formConfig.fields.floatValue3.type = FormFieldType.hidden;
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.Experience) {
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.EXP');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.EXP_HELP');
          formConfig.fields.intValue1.require = true;
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue1.type = FormFieldType.hidden;
          formConfig.fields.floatValue2.type = FormFieldType.hidden;
          formConfig.fields.floatValue3.type = FormFieldType.hidden;
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.Mount) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue1.type = FormFieldType.file;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.MODEL');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.MODEL_HELP');
          formConfig.fields.stringValue1.acceptFolder = this.profile.folder + this.profile.mobFolder;
          formConfig.fields.stringValue1.accept = 'prefab';
          formConfig.fields.stringValue1.acceptTitle = this.translate.instant('FILE_TYPE.PREFAB');
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.type = FormFieldType.dropdown;
          formConfig.fields.intValue1.data = this.morphTypeOptions;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.MOUNT_TYPE');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.MOUNT_TYPE_HELP');
          formConfig.fields.intValue2.order = 5;
          formConfig.fields.intValue2.type = FormFieldType.integer;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.SPEED_INCREASE');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.SPEED_INCREASE_HELP');
          (form.get('intValue2') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue2') as AbstractControl).updateValueAndValidity();
          formConfig.fields.stringValue2.order = 6;
          formConfig.fields.stringValue2.allowNew = true;
          formConfig.fields.stringValue2.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue2.fieldConfig = statFieldConfig;
          formConfig.fields.stringValue2.label = this.translate.instant(this.tableKey + '.STAT_CHANGE');
          formConfig.fields.stringValue2.tooltip = this.translate.instant(this.tableKey + '.STAT_CHANGE_HELP');
          formConfig.fields.floatValue1.order = 7;
          formConfig.fields.floatValue1.type = FormFieldType.decimal;
          formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.MODIFICATION');
          formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.MODIFICATION_HELP');
          (form.get('floatValue1') as AbstractControl).setValidators(Validators.min(0));
          (form.get('floatValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.isBuff.order = 8;
          formConfig.fields.isBuff.width = 25;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          formConfig.fields.show_effect.order = 9;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          this.showBottom(formConfig, 10);
        } else if (mainType === EffectType.BuildObject) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = boFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.BUILD_OBJECT');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.BUILD_OBJECT_HELP');
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.TeachAbility || mainType === EffectType.UnlearnAbility) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = abilityFieldConfig;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.ABILITY');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.ABILITY_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.TeachSkill) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.fieldConfig = skillFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.SKILL_TO_LEARN');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.SKILL_TO_LEARN_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.Task) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.fieldConfig = taskFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.TASK');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.TASK_HELP');
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.State) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue1.fieldConfig = stateFieldConfig;
          formConfig.fields.stringValue1.require = true;
          formConfig.fields.stringValue1.allowNew = true;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.STATE');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.STATE_HELP');
          (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.isBuff.order = 5;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          formConfig.fields.isBuff.width = 25;
          formConfig.fields.show_effect.order = 6;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          this.showDurationField(formConfig, 7);
          this.showBottom(formConfig, 8);
        } else if (mainType === EffectType.Threat) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.THREAT_AMOUNT');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.THREAT_AMOUNT_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.CreateItem) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.fieldConfig = itemFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.ITEM');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.ITEM_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          this.showBottom(formConfig, 5);
        } else if (mainType === EffectType.CreateItemFromLoot) {
          let position = 3;
          for (let i = 1; i <= 5; i++) {
            position += 1;
            formConfig.fields['intValue' + i].order = position;
            formConfig.fields['intValue' + i].width = 33;
            formConfig.fields['intValue' + i].allowNew = true;
            formConfig.fields['intValue' + i].type = FormFieldType.dynamicDropdown;
            formConfig.fields['intValue' + i].fieldConfig = lootTableFieldConfig;
            formConfig.fields['intValue' + i].label = this.translate.instant(this.tableKey + '.LOOT_TABLE') + ' ' + i;
            formConfig.fields['intValue' + i].tooltip =
              this.translate.instant(this.tableKey + '.LOOT_TABLE_HELP') + ' ' + i;
            position += 1;
            formConfig.fields['floatValue' + i].order = position;
            formConfig.fields['floatValue' + i].width = 33;
            formConfig.fields['floatValue' + i].type = FormFieldType.decimal;
            formConfig.fields['floatValue' + i].label = this.translate.instant(this.tableKey + '.CHANCE') + ' ' + i;
            formConfig.fields['floatValue' + i].tooltip =
              this.translate.instant(this.tableKey + '.CHANCE_HELP') + ' ' + i;
            (form.get('floatValue' + i) as AbstractControl).setValidators(Validators.min(0));
            (form.get('floatValue' + i) as AbstractControl).updateValueAndValidity();

            position += 1;
            formConfig.fields['stringValue' + i].order = position;
            formConfig.fields['stringValue' + i].width = 33;
            formConfig.fields['stringValue' + i].type = FormFieldType.integer;
            formConfig.fields['stringValue' + i].label = this.translate.instant(this.tableKey + '.COUNT') + ' ' + i;
            formConfig.fields['stringValue' + i].tooltip =
              this.translate.instant(this.tableKey + '.COUNT_HELP') + ' ' + i;
            (form.get('stringValue' + i) as AbstractControl).setValidators(Validators.min(1));
            (form.get('stringValue' + i) as AbstractControl).updateValueAndValidity();
          }
          this.showBottom(formConfig, position + 1);
        } else if (mainType === EffectType.Spawn) {
          formConfig.fields.intValue2.order = 4;
          formConfig.fields.intValue2.type = FormFieldType.dropdown;
          formConfig.fields.intValue2.data = this.spawnTypes;
          formConfig.fields.intValue2.hideNone = true;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.SPAWN_TYPE');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.SPAWN_TYPE_HELP');
          formConfig.fields.intValue1.order = 5;
          formConfig.fields.intValue1.type = FormFieldType.hidden;
          if ((form.get('intValue2') as AbstractControl).value === 0) {
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.fieldConfig = mobSpawnFieldConfig;
            formConfig.fields.intValue1.allowNew = true;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.SPAWN_DATA');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.SPAWN_DATA_HELP');
            formConfig.fields.duration.order = 99;
            formConfig.fields.duration.type = FormFieldType.hidden;
          } else if ((form.get('intValue2') as AbstractControl).value === 2) {
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.fieldConfig = mobsFieldConfig;
            formConfig.fields.intValue1.allowNew = true;
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.PET_MODEL');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.PET_MODEL_HELP');
            this.showDurationField(formConfig, 6, 25, 'DURATION_2', 'DURATION_2_HELP');
          } else if ((form.get('intValue2') as AbstractControl).value === 3) {
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.fieldConfig = petProfileFieldConfig;
            formConfig.fields.intValue1.allowNew = true;
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.PET_PROFILE');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.PET_PROFILE_HELP');
            this.showDurationField(formConfig, 6, 25, 'DURATION_2', 'DURATION_2_HELP');
          }
          formConfig.fields.intValue3.order = 7;
          formConfig.fields.intValue3.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue3.fieldConfig = passiveEffectFieldConfig;
          formConfig.fields.intValue3.label = this.translate.instant(this.tableKey + '.PASSIVE_EFFECTS');
          formConfig.fields.intValue3.tooltip = this.translate.instant(this.tableKey + '.PASSIVE_EFFECTS_HELP');
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.SetRespawnLocation) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.width = 100;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = instanceAllFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.INSTANCE');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.INSTANCE_HELP');
          formConfig.fields.floatValue1.order = 5;
          formConfig.fields.floatValue1.type = FormFieldType.decimal;
          formConfig.fields.floatValue1.width = 33;
          formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.POSITION_X');
          formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.POSITION_X_HELP');
          formConfig.fields.floatValue2.order = 6;
          formConfig.fields.floatValue2.type = FormFieldType.decimal;
          formConfig.fields.floatValue2.width = 33;
          formConfig.fields.floatValue2.label = this.translate.instant(this.tableKey + '.POSITION_Y');
          formConfig.fields.floatValue2.tooltip = this.translate.instant(this.tableKey + '.POSITION_Y_HELP');
          formConfig.fields.floatValue3.order = 7;
          formConfig.fields.floatValue3.type = FormFieldType.decimal;
          formConfig.fields.floatValue3.width = 33;
          formConfig.fields.floatValue3.label = this.translate.instant(this.tableKey + '.POSITION_Z');
          formConfig.fields.floatValue3.tooltip = this.translate.instant(this.tableKey + '.POSITION_Z_HELP');
          this.showBottom(formConfig, 9);
        } else if (mainType === EffectType.Vip) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.type = FormFieldType.integer;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.EXTEND_TIME');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.EXTEND_TIME_HELP');
          formConfig.fields.intValue2.order = 5;
          formConfig.fields.intValue2.width = 50;
          formConfig.fields.intValue2.type = FormFieldType.integer;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.POINTS');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.POINTS_HELP');
          (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue2') as AbstractControl).setValidators(Validators.min(0));
          (form.get('intValue1') as AbstractControl).updateValueAndValidity();
          (form.get('intValue2') as AbstractControl).updateValueAndValidity();
        } else if (mainType === EffectType.Bonuses) {
          let position = 4;
          formConfig.fields.boolValue2.order = position;
          formConfig.fields.boolValue2.width = 100;
          formConfig.fields.boolValue2.type = FormFieldType.boolean;
          formConfig.fields.boolValue2.label = this.translate.instant(this.tableKey + '.EFFECT_AFTER_LOGOUT');
          formConfig.fields.boolValue2.tooltip = this.translate.instant(this.tableKey + '.EFFECT_AFTER_LOGOUT_HELP');
          for (let i = 1; i <= 5; ++i) {
            position += 1;
            formConfig.fields['stringValue' + i].order = position;
            formConfig.fields['stringValue' + i].width = 33;
            formConfig.fields['stringValue' + i].allowNew = true;
            formConfig.fields['stringValue' + i].type = FormFieldType.dynamicDropdown;
            formConfig.fields['stringValue' + i].fieldConfig = bonusSettingsFieldConfig;
            formConfig.fields['stringValue' + i].label = this.translate.instant(this.tableKey + '.BONUS') + ' ' + i;
            formConfig.fields['stringValue' + i].tooltip =
              this.translate.instant(this.tableKey + '.BONUS_HELP') + ' ' + i;
            position += 1;
            formConfig.fields['intValue' + i].order = position;
            formConfig.fields['intValue' + i].width = 33;
            formConfig.fields['intValue' + i].type = FormFieldType.integer;
            formConfig.fields['intValue' + i].label = this.translate.instant(this.tableKey + '.VALUE') + ' ' + i;
            formConfig.fields['intValue' + i].tooltip = this.translate.instant(this.tableKey + '.VALUE_HELP') + ' ' + i;
            (form.get('intValue' + i) as AbstractControl).updateValueAndValidity();
            position += 1;
            formConfig.fields['floatValue' + i].order = position;
            formConfig.fields['floatValue' + i].width = 33;
            formConfig.fields['floatValue' + i].type = FormFieldType.decimal;
            formConfig.fields['floatValue' + i].label = this.translate.instant(this.tableKey + '.VALUE_PERC') + ' ' + i;
            formConfig.fields['floatValue' + i].tooltip =
              this.translate.instant(this.tableKey + '.VALUE_PERC_HELP') + ' ' + i;
            (form.get('floatValue' + i) as AbstractControl).updateValueAndValidity();
          }
          position += 1;
          formConfig.fields.isBuff.order = position;
          formConfig.fields.isBuff.width = 33;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          position += 1;
          formConfig.fields.show_effect.order = position;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          position += 1;
          formConfig.fields.passive.order = position;
          formConfig.fields.passive.width = 33;
          formConfig.fields.passive.type = FormFieldType.boolean;
          position += 1;
          this.showDurationField(formConfig, position);
          position += 1;
          this.showBottom(formConfig, position, false, false);
        } else if (mainType === EffectType.Trap) {
          let position = 4;
          formConfig.fields.floatValue1.order = position;
          formConfig.fields.floatValue1.type = FormFieldType.decimal;
          formConfig.fields.floatValue1.width = 33;
          formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.SIZE');
          formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.SIZE_HELP');
          position += 1;
          formConfig.fields.floatValue2.order = position;
          formConfig.fields.floatValue2.type = FormFieldType.decimal;
          formConfig.fields.floatValue2.width = 33;
          formConfig.fields.floatValue2.label = this.translate.instant(this.tableKey + '.DURATION');
          formConfig.fields.floatValue2.tooltip = this.translate.instant(this.tableKey + '.DURATION_TIME_HELP');
          position += 1;
          formConfig.fields.floatValue3.order = position;
          formConfig.fields.floatValue3.type = FormFieldType.decimal;
          formConfig.fields.floatValue3.width = 33;
          formConfig.fields.floatValue3.label = this.translate.instant(this.tableKey + '.ACTIVATION_TIME');
          formConfig.fields.floatValue3.tooltip = this.translate.instant(this.tableKey + '.ACTIVATION_TIME_HELP');
          position += 1;
          formConfig.fields.intValue2.order = position;
          formConfig.fields.intValue2.type = FormFieldType.dropdown;
          formConfig.fields.intValue2.data = this.targetTypes;
          formConfig.fields.intValue2.width = 50;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.TARGET_TYPE');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.TARGET_TYPE_HELP');
          position += 1;
          formConfig.fields.intValue1.order = position;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = abilityFieldConfig;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.ABILITY');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.ABILITY_HELP');
          position += 1;
          formConfig.fields.stringValue1.order = position;
          formConfig.fields.stringValue1.width = 50;
          formConfig.fields.stringValue1.type = FormFieldType.file;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.MODEL');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.MODEL_HELP');
          formConfig.fields.stringValue1.acceptFolder = this.profile.folder + this.profile.mobFolder;
          formConfig.fields.stringValue1.accept = 'prefab';
          formConfig.fields.stringValue1.acceptTitle = this.translate.instant('FILE_TYPE.PREFAB');
          position += 1;
          this.showBottom(formConfig, position, true, false);
        } else if (mainType === EffectType.Trigger) {
          formConfig.fields.stringValue1.order = 4;
          formConfig.fields.stringValue1.width = 100;
          formConfig.fields.stringValue1.require = true;
          formConfig.fields.stringValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.stringValue1.fieldConfig = triggerProfileFieldConfig;
          formConfig.fields.stringValue1.multiple = true;
          formConfig.fields.stringValue1.allowNew = true;
          formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.TRIGGER_PROFILE');
          formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.TRIGGER_PROFILE_HELP');
          (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
          (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
          formConfig.fields.isBuff.order = 5;
          formConfig.fields.isBuff.width = 33;
          formConfig.fields.isBuff.type = FormFieldType.boolean;
          formConfig.fields.show_effect.order = 6;
          formConfig.fields.show_effect.type = FormFieldType.boolean;
          this.showDurationField(formConfig, 7, 33);
          this.showBottom(formConfig, 8, false, false);
        } else if (mainType === EffectType.Shield) {
          formConfig.fields.intValue5.order = 4;
          formConfig.fields.intValue5.width = 50;
          formConfig.fields.intValue5.type = FormFieldType.integer;
          formConfig.fields.intValue5.label = this.translate.instant(this.tableKey + '.SHIELD_VALUE');
          formConfig.fields.intValue5.tooltip = this.translate.instant(this.tableKey + '.SHIELD_VALUE_HELP');
          formConfig.fields.floatValue5.order = 5;
          formConfig.fields.floatValue5.width = 50;
          formConfig.fields.floatValue5.type = FormFieldType.integer;
          formConfig.fields.floatValue5.label = this.translate.instant(this.tableKey + '.HINT_COUNT');
          formConfig.fields.floatValue5.tooltip = this.translate.instant(this.tableKey + '.HINT_COUNT_HELP');
          (form.get('intValue5') as AbstractControl).setValidators(Validators.min(-1));
          (form.get('intValue5') as AbstractControl).updateValueAndValidity();
          (form.get('floatValue5') as AbstractControl).setValidators(Validators.min(-1));
          (form.get('floatValue5') as AbstractControl).updateValueAndValidity();
          let order = 5;
          for (let i = 1; i <= 4; i++) {
            order += 1;
            formConfig.fields['title_' + i].order = order;
            formConfig.fields['title_' + i].width = 100;
            formConfig.fields['title_' + i].type = FormFieldType.title;
            formConfig.fields['title_' + i].label = this.translate.instant(this.tableKey + '.SETTING') + ' ' + i;
            order += 1;
            formConfig.fields['stringValue' + i].order = order;
            formConfig.fields['stringValue' + i].width = 100;
            formConfig.fields['stringValue' + i].type = FormFieldType.dynamicDropdown;
            formConfig.fields['stringValue' + i].fieldConfig = effectTagsFieldConfig;
            formConfig.fields['stringValue' + i].multiple = true;
            formConfig.fields['stringValue' + i].allowNew = true;
            formConfig.fields['stringValue' + i].label = this.translate.instant(this.tableKey + '.TAGS');
            formConfig.fields['stringValue' + i].tooltip = this.translate.instant(this.tableKey + '.TAGS_HELP');
            order += 1;
            formConfig.fields['boolValue' + i].order = order;
            formConfig.fields['boolValue' + i].width = 33;
            formConfig.fields['boolValue' + i].type = FormFieldType.boolean;
            formConfig.fields['boolValue' + i].label = this.translate.instant(this.tableKey + '.REFLECT');
            formConfig.fields['boolValue' + i].tooltip = this.translate.instant(this.tableKey + '.REFLECT_HELP');
            order += 1;
            formConfig.fields['intValue' + i].order = order;
            formConfig.fields['intValue' + i].width = 33;
            formConfig.fields['intValue' + i].type = FormFieldType.integer;
            order += 1;
            formConfig.fields['floatValue' + i].order = order;
            formConfig.fields['floatValue' + i].width = 33;
            formConfig.fields['floatValue' + i].type = FormFieldType.integer;
            this.updateShieldLabelFields(form, formConfig, i);
            (form.get('intValue' + i) as AbstractControl).setValidators(Validators.min(0));
            (form.get('intValue' + i) as AbstractControl).updateValueAndValidity();
            order += 1;
            formConfig.fields.isBuff.order = order;
            formConfig.fields.isBuff.type = FormFieldType.boolean;
            order += 1;
            formConfig.fields.show_effect.order = order;
            formConfig.fields.show_effect.type = FormFieldType.boolean;
            order += 1;
            formConfig.fields.passive.order = order;
            formConfig.fields.passive.type = FormFieldType.boolean;
            order = this.showTimeFields(formConfig, order);
            this.showBottom(formConfig, order, false, true, false, true);
          }
        } else if (mainType === EffectType.ChangeClass) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.width = 33;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = classFieldConfig;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.NEW_CLASS');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.NEW_CLASS_HELP');
          formConfig.fields.boolValue1.order = 5;
          formConfig.fields.boolValue1.type = FormFieldType.boolean;
          formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.RESET_ABILITIES');
          formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.RESET_ABILITIES_HELP');
          formConfig.fields.boolValue1.width = 33;
          formConfig.fields.boolValue2.order = 6;
          formConfig.fields.boolValue2.type = FormFieldType.boolean;
          formConfig.fields.boolValue2.label = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS');
          formConfig.fields.boolValue2.tooltip = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS_HELP');
          formConfig.fields.boolValue2.width = 33;

          this.showBottom(formConfig, 7, true, false);
        } else if (mainType === EffectType.ChangeFaction) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.width = 100;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = factionFieldConfig;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.NEW_FACTION');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.NEW_FACTION_HELP');
          // formConfig.fields.boolValue1.order = 5;
          // formConfig.fields.boolValue1.type = FormFieldType.boolean;
          // formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.RESET_ABILITIES');
          // formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.RESET_ABILITIES_HELP');
          // formConfig.fields.boolValue1.width = 33;
          // formConfig.fields.boolValue2.order = 6;
          // formConfig.fields.boolValue2.type = FormFieldType.boolean;
          // formConfig.fields.boolValue2.label = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS');
          // formConfig.fields.boolValue2.tooltip = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS_HELP');
          // formConfig.fields.boolValue2.width = 33;

          this.showBottom(formConfig, 7, true, false);
        } else if (mainType === EffectType.Faction) {
          formConfig.fields.intValue1.order = 4;
          formConfig.fields.intValue1.width = 50;
          formConfig.fields.intValue1.require = true;
          formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          formConfig.fields.intValue1.fieldConfig = factionFieldConfig;
          formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.FACTION');
          formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.FACTION_HELP');

          formConfig.fields.intValue2.order = 5;
          formConfig.fields.intValue2.width = 50;
          formConfig.fields.intValue2.require = true;
          formConfig.fields.intValue2.type = FormFieldType.integer;
          // formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
          // formConfig.fields.intValue1.fieldConfig = factionFieldConfig;
          // formConfig.fields.intValue1.allowNew = true;
          formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.FACTION_REPUTATION');
          formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.FACTION_REPUTATION_HELP');

          //
          // formConfig.fields.boolValue1.order = 5;
          // formConfig.fields.boolValue1.type = FormFieldType.boolean;
          // formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.RESET_ABILITIES');
          // formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.RESET_ABILITIES_HELP');
          // formConfig.fields.boolValue1.width = 33;
          // formConfig.fields.boolValue2.order = 6;
          // formConfig.fields.boolValue2.type = FormFieldType.boolean;
          // formConfig.fields.boolValue2.label = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS');
          // formConfig.fields.boolValue2.tooltip = this.translate.instant(this.tableKey + '.RESET_SKILL_STATS_HELP');
          // formConfig.fields.boolValue2.width = 33;

          this.showBottom(formConfig, 7, true, false);
        }
        prevType = mainType;
      });
    (form.get('effectType') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((subType) => {
        const mainType = (form.get('effectMainType') as AbstractControl).value;
        if (mainType === EffectType.Damage) {
          this.resetFieldWidth(formConfig);
          this.damageFieldsSetup(form, formConfig);
          formConfig.fields.duration.type = FormFieldType.decimal;
          formConfig.fields.duration.width = 25;
          formConfig.fields.pulseCoordEffect.type = FormFieldType.file;
          this.parseDamageTypeFields(form, formConfig, subType);
          this.showBottom(formConfig, 20, false, true, true, subType === 'AttackDotEffect');
        } else if (mainType === EffectType.Restore) {
          this.resetFieldWidth(formConfig);
          this.restoreFieldsSetup(form, formConfig);
          this.parseRestoreTypeFields(form, formConfig, subType);
          this.showBottom(formConfig, 14, false, true, false, subType === 'HealOverTimeEffect');
        }
      });
    (form.get('stringValue1') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        if ((form.get('effectMainType') as AbstractControl).value === EffectType.Teleport) {
          if (value === 'Standard') {
            formConfig.fields.intValue1.order = 5;
            formConfig.fields.intValue1.allowNew = true;
            formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
            formConfig.fields.intValue1.width = 50;
            formConfig.fields.intValue1.fieldConfig = instanceAllFieldConfig;
            formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.INSTANCE');
            formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.INSTANCE_HELP');
            formConfig.fields.floatValue1.order = 6;
            formConfig.fields.floatValue1.type = FormFieldType.decimal;
            formConfig.fields.floatValue1.width = 33;
            formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.POSITION_X');
            formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.POSITION_X_HELP');
            formConfig.fields.floatValue2.order = 7;
            formConfig.fields.floatValue2.type = FormFieldType.decimal;
            formConfig.fields.floatValue2.width = 33;
            formConfig.fields.floatValue2.label = this.translate.instant(this.tableKey + '.POSITION_Y');
            formConfig.fields.floatValue2.tooltip = this.translate.instant(this.tableKey + '.POSITION_Y_HELP');
            formConfig.fields.floatValue3.order = 8;
            formConfig.fields.floatValue3.type = FormFieldType.decimal;
            formConfig.fields.floatValue3.width = 33;
            formConfig.fields.floatValue3.label = this.translate.instant(this.tableKey + '.POSITION_Z');
            formConfig.fields.floatValue3.tooltip = this.translate.instant(this.tableKey + '.POSITION_Z_HELP');
          } else {
            formConfig.fields.intValue1.type = FormFieldType.hidden;
            formConfig.fields.floatValue1.type = FormFieldType.hidden;
            formConfig.fields.floatValue2.type = FormFieldType.hidden;
            formConfig.fields.floatValue3.type = FormFieldType.hidden;
          }
        } else if ((form.get('effectMainType') as AbstractControl).value === EffectType.Dispel) {
          if (value === 'By Tags') {
            formConfig.fields.stringValue2.order = 6;
            formConfig.fields.stringValue2.width = 100;
            formConfig.fields.stringValue2.multiple = true;
            formConfig.fields.stringValue2.allowNew = true;
            formConfig.fields.stringValue2.type = FormFieldType.dynamicDropdown;
            formConfig.fields.stringValue2.fieldConfig = effectTagsFieldConfig;
            formConfig.fields.stringValue2.label = this.translate.instant(this.tableKey + '.DISPEL_TAGS');
            formConfig.fields.stringValue2.tooltip = this.translate.instant(this.tableKey + '.DISPEL_TAGS_HELP');
          } else {
            formConfig.fields.stringValue2.type = FormFieldType.hidden;
          }
        }
      });
    (form.get('intValue2') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        if ((form.get('effectMainType') as AbstractControl).value === EffectType.Spawn) {
          if (value !== null && this.previousValue !== value) {
            if ((this.previousValue === 0 && value > 1) || ((this.previousValue as number) > 1 && value === 0)) {
              formConfig.fields.intValue1.type = FormFieldType.hidden;
              (form.get('intValue1') as AbstractControl).reset(value);
            }
            this.previousValue = value;
          }
          setTimeout(() => {
            if (value === 0) {
              formConfig.fields.intValue1.fieldConfig = mobSpawnFieldConfig;
              formConfig.fields.intValue1.allowNew = true;
              formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
              formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.SPAWN_DATA');
              formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.SPAWN_DATA_HELP');
              formConfig.fields.duration.order = 99;
              formConfig.fields.duration.type = FormFieldType.hidden;
            } else if (value === 2) {
              formConfig.fields.intValue1.fieldConfig = mobsFieldConfig;
              formConfig.fields.intValue1.allowNew = true;
              formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
              formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.PET_MODEL');
              formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.PET_MODEL_HELP');
              this.showDurationField(formConfig, 6, 25, 'DURATION_2', 'DURATION_2_HELP');
            } else if (value === 3) {
              formConfig.fields.intValue1.fieldConfig = petProfileFieldConfig;
              formConfig.fields.intValue1.allowNew = true;
              formConfig.fields.intValue1.type = FormFieldType.dynamicDropdown;
              formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.PET_PROFILE');
              formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.PET_PROFILE_HELP');
              this.showDurationField(formConfig, 6, 25, 'DURATION_2', 'DURATION_2_HELP');
            }
          });
        }
      });
    (form.get('boolValue1') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        if ((form.get('effectMainType') as AbstractControl).value === EffectType.Stat) {
          formConfig.fields.floatValue1.type = value ? FormFieldType.decimal : FormFieldType.integer;
          formConfig.fields.floatValue2.type = value ? FormFieldType.decimal : FormFieldType.integer;
          formConfig.fields.floatValue3.type = value ? FormFieldType.decimal : FormFieldType.integer;
          formConfig.fields.floatValue4.type = value ? FormFieldType.decimal : FormFieldType.integer;
          formConfig.fields.floatValue5.type = value ? FormFieldType.decimal : FormFieldType.integer;
        } else if ((form.get('effectMainType') as AbstractControl).value === EffectType.Shield) {
          this.updateShieldLabelFields(form, formConfig, 1);
        }
      });
    (form.get('boolValue2') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe(() => {
      if ((form.get('effectMainType') as AbstractControl).value === EffectType.Shield) {
        this.updateShieldLabelFields(form, formConfig, 2);
      }
    });
    (form.get('boolValue3') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe(() => {
      if ((form.get('effectMainType') as AbstractControl).value === EffectType.Shield) {
        this.updateShieldLabelFields(form, formConfig, 3);
      }
    });
    (form.get('boolValue4') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe(() => {
      if ((form.get('effectMainType') as AbstractControl).value === EffectType.Shield) {
        this.updateShieldLabelFields(form, formConfig, 4);
      }
    });
    (form.get('interruption_chance') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        if (value) {
          (form.get('interruption_chance_max') as AbstractControl).setValidators([Validators.min(value)]);
        } else {
          (form.get('interruption_chance_max') as AbstractControl).setValidators([Validators.min(0)]);
          (form.get('interruption_chance_max') as AbstractControl).updateValueAndValidity();
        }
        (form.get('interruption_chance_max') as AbstractControl).updateValueAndValidity();
      });
    return form;
  }

  private damageFieldsSetup(form: FormGroup, formConfig: FormConfig): void {
    formConfig.fields.stringValue1.order = 4;
    formConfig.fields.stringValue1.allowNew = true;
    formConfig.fields.stringValue1.type = FormFieldType.dynamicDropdown;
    formConfig.fields.stringValue1.fieldConfig = vitalityStatFieldConfig;
    formConfig.fields.stringValue1.require = true;
    formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.DAMAGE_PROPERTY');
    formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.DAMAGE_PROPERTY_HELP');
    (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
    (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
    formConfig.fields.stringValue2.order = 5;
    formConfig.fields.stringValue2.allowNew = true;
    formConfig.fields.stringValue2.type = FormFieldType.dynamicDropdown;
    formConfig.fields.stringValue2.fieldConfig = damageFieldConfig;
    formConfig.fields.stringValue2.require = true;
    formConfig.fields.stringValue2.label = this.translate.instant(this.tableKey + '.DAMAGE_TYPE');
    formConfig.fields.stringValue2.tooltip = this.translate.instant(this.tableKey + '.DAMAGE_TYPE_HELP');
    (form.get('stringValue2') as AbstractControl).setValidators(Validators.required);
    (form.get('stringValue2') as AbstractControl).updateValueAndValidity();
    formConfig.fields.intValue1.order = 6;
    formConfig.fields.intValue1.type = FormFieldType.integer;
    formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.DAMAGE_AMOUNT');
    formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.DAMAGE_AMOUNT_HELP');
    (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
    (form.get('intValue1') as AbstractControl).updateValueAndValidity();
    formConfig.fields.floatValue2.order = 8;
    formConfig.fields.floatValue2.type = FormFieldType.decimal;
    formConfig.fields.floatValue2.label = this.translate.instant(this.tableKey + '.TRANSFER_RATE');
    formConfig.fields.floatValue2.tooltip = this.translate.instant(this.tableKey + '.TRANSFER_RATE_HELP');
    (form.get('floatValue2') as AbstractControl).setValidators(Validators.min(0));
    (form.get('floatValue2') as AbstractControl).updateValueAndValidity();
  }

  private formReset(form: FormGroup): void {
    form.reset();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private updateShieldLabelFields(form: FormGroup, formConfig: FormConfig, index: number): void {
    if ((form.get('boolValue' + index) as AbstractControl).value) {
      formConfig.fields['intValue' + index].label = this.translate.instant(this.tableKey + '.REFLECT_VALUE');
      formConfig.fields['intValue' + index].tooltip = this.translate.instant(this.tableKey + '.REFLECT_VALUE_HELP');
      formConfig.fields['floatValue' + index].label = this.translate.instant(this.tableKey + '.REFLECT_PERCENTAGE');
      formConfig.fields['floatValue' + index].tooltip = this.translate.instant(
        this.tableKey + '.REFLECT_PERCENTAGE_HELP',
      );
      (form.get('floatValue' + index) as AbstractControl).setValidators([Validators.min(0)]);
    } else {
      formConfig.fields['intValue' + index].label = this.translate.instant(this.tableKey + '.ABSORB_VALUE');
      formConfig.fields['intValue' + index].tooltip = this.translate.instant(this.tableKey + '.ABSORB_VALUE_HELP');
      formConfig.fields['floatValue' + index].label = this.translate.instant(this.tableKey + '.ABSORB_PERCENTAGE');
      formConfig.fields['floatValue' + index].tooltip = this.translate.instant(
        this.tableKey + '.ABSORB_PERCENTAGE_HELP',
      );
      (form.get('floatValue' + index) as AbstractControl).setValidators(Validators.min(0));
    }
    (form.get('floatValue' + index) as AbstractControl).updateValueAndValidity();
  }

  private parseDamageTypeFields(form: FormGroup, formConfig: FormConfig, subType: string): void {
    if (!subType) {
      return;
    }
    if (subType !== 'FlatDamageEffect') {
      if (subType === 'AttackDotEffect') {
        formConfig.fields.boolValue1.order = 17;
        formConfig.fields.boolValue1.width = 25;
      }
      formConfig.fields.boolValue1.type = FormFieldType.boolean;
      formConfig.fields.boolValue1.label = this.translate.instant(this.tableKey + '.USE_WEAPON');
      formConfig.fields.boolValue1.tooltip = this.translate.instant(this.tableKey + '.USE_WEAPON_HELP');
      formConfig.fields.floatValue1.order = 7;
      formConfig.fields.floatValue1.type = FormFieldType.decimal;
      formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.DAMAGE_MODIFIER');
      formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.DAMAGE_MODIFIER_HELP');
      (form.get('floatValue1') as AbstractControl).setValidators(Validators.min(0));
      if (!form.controls.floatValue1.value) {
        form.controls.floatValue1.setValue(1);
      }
      (form.get('floatValue1') as AbstractControl).updateValueAndValidity();
      formConfig.fields.skillType.order = 13;
      formConfig.fields.skillType.type = FormFieldType.dynamicDropdown;
      formConfig.fields.skillLevelMod.order = 14;
      formConfig.fields.skillLevelMod.type = FormFieldType.decimal;
    } else {
      formConfig.fields.boolValue1.order = 99;
      formConfig.fields.boolValue1.type = FormFieldType.hidden;
      formConfig.fields.pulseCoordEffect.width = 75;
      formConfig.fields.floatValue1.type = FormFieldType.hidden;
      formConfig.fields.skillType.type = FormFieldType.hidden;
      formConfig.fields.skillLevelMod.type = FormFieldType.hidden;
    }
    if (subType === 'AttackEffect') {
      formConfig.fields.intValue2.order = 9;
      formConfig.fields.intValue2.type = FormFieldType.dynamicDropdown;
      formConfig.fields.intValue2.fieldConfig = effectFieldConfig;
      formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.BONUS_DAMAGE_EFFECT_REQ');
      formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.BONUS_DAMAGE_EFFECT_REQ_HELP');
      formConfig.fields.intValue3.order = 10;
      formConfig.fields.intValue3.type = FormFieldType.integer;
      formConfig.fields.intValue3.label = this.translate.instant(this.tableKey + '.BONUS_DAMAGE_AMOUNT');
      formConfig.fields.intValue3.tooltip = this.translate.instant(this.tableKey + '.BONUS_DAMAGE_AMOUNT_HELP');
      (form.get('intValue3') as AbstractControl).setValidators(Validators.min(0));
      (form.get('intValue3') as AbstractControl).updateValueAndValidity();
    } else {
      formConfig.fields.intValue2.order = 99;
      formConfig.fields.intValue2.type = FormFieldType.hidden;
      formConfig.fields.intValue3.order = 99;
      formConfig.fields.intValue3.type = FormFieldType.hidden;
    }
    if (subType.indexOf('Dot') === -1) {
      this.showDurationField(formConfig, 11, 25, 'DAMAGE_DELAY', 'DAMAGE_DELAY_HELP');
      formConfig.fields.pulseCoordEffect.order = 12;
      if (subType === 'AttackEffect') {
        formConfig.fields.skillType.order = 12;
        formConfig.fields.skillLevelMod.order = 13;
        formConfig.fields.boolValue1.order = 14;
        formConfig.fields.boolValue1.width = 50;
        formConfig.fields.pulseCoordEffect.width = 100;
        formConfig.fields.pulseCoordEffect.order = 15;
      }
      formConfig.fields.stackLimit.require = false;
      formConfig.fields.stackLimit.type = FormFieldType.hidden;
      formConfig.fields.allowMultiple.type = FormFieldType.hidden;
      formConfig.fields.pulseCount.require = false;
      formConfig.fields.pulseCount.type = FormFieldType.hidden;
      (form.get('pulseCount') as AbstractControl).setValidators(Validators.min(1));
      (form.get('stackLimit') as AbstractControl).setValidators(Validators.min(0));
      (form.get('duration') as AbstractControl).setValidators(Validators.min(0));
      (form.get('pulseCount') as AbstractControl).updateValueAndValidity();
      (form.get('stackLimit') as AbstractControl).updateValueAndValidity();
      (form.get('duration') as AbstractControl).updateValueAndValidity();
    } else if (subType.indexOf('Dot') !== -1) {
      formConfig.fields.pulseCoordEffect.order = 19;
      formConfig.fields.pulseCoordEffect.width = 75;
      formConfig.fields.stackLimit.order = 15;
      formConfig.fields.stackLimit.require = true;
      formConfig.fields.stackLimit.type = FormFieldType.integer;
      formConfig.fields.allowMultiple.order = 16;
      formConfig.fields.allowMultiple.width = 25;
      formConfig.fields.allowMultiple.type = FormFieldType.boolean;
      this.showDurationField(formConfig, 15);
      formConfig.fields.duration.require = true;
      formConfig.fields.show_effect.order = 17;
      formConfig.fields.show_effect.type = FormFieldType.boolean;
      formConfig.fields.pulseCount.order = 18;
      formConfig.fields.pulseCount.require = true;
      formConfig.fields.pulseCount.type = FormFieldType.integer;
      (form.get('pulseCount') as AbstractControl).setValidators([Validators.min(1), Validators.required]);
      (form.get('stackLimit') as AbstractControl).setValidators([Validators.min(0), Validators.required]);
      (form.get('duration') as AbstractControl).setValidators([Validators.min(0), Validators.required]);
      (form.get('pulseCount') as AbstractControl).updateValueAndValidity();
      (form.get('stackLimit') as AbstractControl).updateValueAndValidity();
      (form.get('duration') as AbstractControl).updateValueAndValidity();
    }
  }

  private resetFields(form: FormGroup): void {
    (form.get('effectType') as AbstractControl).reset();
    (form.get('isBuff') as AbstractControl).reset();
    (form.get('show_effect') as AbstractControl).reset();
    (form.get('skillType') as AbstractControl).reset();
    (form.get('skillLevelMod') as AbstractControl).reset();
    (form.get('passive') as AbstractControl).reset();
    (form.get('stackLimit') as AbstractControl).reset();
    (form.get('allowMultiple') as AbstractControl).reset();
    (form.get('duration') as AbstractControl).reset();
    (form.get('pulseCount') as AbstractControl).reset();
    (form.get('tooltip') as AbstractControl).reset();
    (form.get('duration') as AbstractControl).reset();
    (form.get('bonusEffectReq') as AbstractControl).reset();
    (form.get('bonusEffectReqConsumed') as AbstractControl).reset();
    (form.get('bonusEffect') as AbstractControl).reset();
    (form.get('removeBonusWhenEffectRemoved') as AbstractControl).reset();
    (form.get('pulseCoordEffect') as AbstractControl).reset();
    for (let i = 1; i <= 5; i++) {
      (form.get('stringValue' + i) as AbstractControl).reset();
      (form.get('intValue' + i) as AbstractControl).reset();
      (form.get('floatValue' + i) as AbstractControl).reset();
      (form.get('boolValue' + i) as AbstractControl).reset();
    }
  }

  private showBottom(
    formConfig: FormConfig,
    position: number,
    hideToolbar = false,
    showBonusEffect = true,
    showInterruption = false,
    showStackTime = false,
  ): void {
    if (!hideToolbar) {
      position += 1;
      formConfig.fields.tooltip.order = position;
      formConfig.fields.tooltip.type = FormFieldType.textarea;
    } else {
      formConfig.fields.tooltip.type = FormFieldType.hidden;
    }
    if (showInterruption) {
      position += 1;
      formConfig.fields.interruption_chance.order = position;
      formConfig.fields.interruption_chance.type = FormFieldType.decimal;
      position += 1;
      formConfig.fields.interruption_chance_max.order = position;
      formConfig.fields.interruption_chance_max.type = FormFieldType.decimal;
      position += 1;
      formConfig.fields.interruption_all.order = position;
      formConfig.fields.interruption_all.type = FormFieldType.boolean;
    } else {
      formConfig.fields.interruption_chance.type = FormFieldType.hidden;
      formConfig.fields.interruption_chance_max.type = FormFieldType.hidden;
      formConfig.fields.interruption_all.type = FormFieldType.hidden;
    }
    if (showStackTime) {
      position += 1;
      formConfig.fields.stackTime.order = position;
      formConfig.fields.stackTime.type = FormFieldType.boolean;
    } else {
      formConfig.fields.stackTime.type = FormFieldType.hidden;
    }
    position += 1;
    formConfig.fields.group_tags.order = position;
    if (!showBonusEffect) {
      formConfig.fields.title1.type = FormFieldType.hidden;
      formConfig.fields.bonusEffect.type = FormFieldType.hidden;
      formConfig.fields.bonusEffectReq.type = FormFieldType.hidden;
      formConfig.fields.bonusEffectReqConsumed.type = FormFieldType.hidden;
      formConfig.fields.removeBonusWhenEffectRemoved.type = FormFieldType.hidden;
    } else {
      position += 1;
      formConfig.fields.title1.order = position;
      formConfig.fields.title1.type = FormFieldType.title;
      position += 1;
      formConfig.fields.bonusEffectReq.order = position;
      formConfig.fields.bonusEffectReq.type = FormFieldType.dynamicDropdown;
      position += 1;
      formConfig.fields.bonusEffect.order = position;
      formConfig.fields.bonusEffect.type = FormFieldType.dynamicDropdown;
      position += 1;
      formConfig.fields.bonusEffectReqConsumed.order = position;
      formConfig.fields.bonusEffectReqConsumed.type = FormFieldType.boolean;
      position += 1;
      formConfig.fields.removeBonusWhenEffectRemoved.order = position;
      formConfig.fields.removeBonusWhenEffectRemoved.type = FormFieldType.boolean;
    }
  }

  private showDurationField(
    formConfig: FormConfig,
    position: number,
    width = 25,
    labelKey = 'DURATION',
    tooltipKey = 'DURATION_HELP',
  ): void {
    formConfig.fields.duration.order = position;
    formConfig.fields.duration.width = width;
    formConfig.fields.duration.type = FormFieldType.decimal;
    formConfig.fields.duration.label = this.translate.instant(this.tableKey + '.' + labelKey);
    formConfig.fields.duration.tooltip = this.translate.instant(this.tableKey + '.' + tooltipKey);
  }

  private clearValidators(form: FormGroup): void {
    for (let i = 1; i <= 5; i++) {
      (form.get('stringValue' + i) as AbstractControl).clearValidators();
      (form.get('stringValue' + i) as AbstractControl).updateValueAndValidity();
      (form.get('intValue' + i) as AbstractControl).clearValidators();
      (form.get('intValue' + i) as AbstractControl).updateValueAndValidity();
      (form.get('floatValue' + i) as AbstractControl).clearValidators();
      (form.get('floatValue' + i) as AbstractControl).updateValueAndValidity();
    }
  }

  private resetFieldWidth(formConfig: FormConfig): void {
    delete formConfig.fields.stringValue1.acceptFolder;
    delete formConfig.fields.stringValue1.accept;
    delete formConfig.fields.stringValue1.acceptTitle;
    formConfig.fields.skillType.width = 25;
    formConfig.fields.skillLevelMod.width = 25;
    formConfig.fields.pulseCoordEffect.width = 50;
    for (let i = 1; i <= 5; i++) {
      formConfig.fields['stringValue' + i].require = false;
      formConfig.fields['stringValue' + i].width = 25;
      formConfig.fields['stringValue' + i].allowNew = false;
      formConfig.fields['stringValue' + i].multiple = false;
      formConfig.fields['stringValue' + i].fieldConfig = {};
      formConfig.fields['intValue' + i].width = 25;
      formConfig.fields['intValue' + i].hideNone = false;
      formConfig.fields['intValue' + i].allowNew = false;
      formConfig.fields['intValue' + i].multiple = false;
      formConfig.fields['intValue' + i].require = false;
      formConfig.fields['intValue' + i].fieldConfig = {};
      formConfig.fields['floatValue' + i].width = 25;
      formConfig.fields['floatValue' + i].multiple = false;
      formConfig.fields['floatValue' + i].require = false;
      formConfig.fields['floatValue' + i].fieldConfig = {};
      formConfig.fields['boolValue' + i].width = 25;
    }
    for (let i = 1; i <= 4; i++) {
      formConfig.fields['title_' + i].width = -1;
      formConfig.fields['title_' + i].type = FormFieldType.hidden;
    }
  }

  private restoreFieldsSetup(form: FormGroup, formConfig: FormConfig): void {
    formConfig.fields.intValue1.order = 4;
    formConfig.fields.intValue1.width = 25;
    formConfig.fields.intValue1.type = FormFieldType.integer;
    formConfig.fields.intValue1.label = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MIN');
    formConfig.fields.intValue1.tooltip = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MIN_HELP');
    (form.get('intValue1') as AbstractControl).setValidators(Validators.min(0));
    (form.get('intValue1') as AbstractControl).updateValueAndValidity();

    formConfig.fields.intValue2.order = 5;
    formConfig.fields.intValue2.width = 25;
    formConfig.fields.intValue2.type = FormFieldType.integer;
    formConfig.fields.intValue2.label = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MAX');
    formConfig.fields.intValue2.tooltip = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MAX_HELP');
    (form.get('intValue2') as AbstractControl).setValidators(Validators.min(0));
    (form.get('intValue2') as AbstractControl).updateValueAndValidity();

    formConfig.fields.floatValue4.order = 6;
    formConfig.fields.floatValue4.width = 25;
    formConfig.fields.floatValue4.type = FormFieldType.decimal;
    formConfig.fields.floatValue4.label = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MIN_PERCENTAGE');
    formConfig.fields.floatValue4.tooltip = this.translate.instant(
      this.tableKey + '.RESTORE_AMOUNT_MIN_PERCENTAGE_HELP',
    );
    (form.get('floatValue4') as AbstractControl).setValidators(Validators.min(0));
    (form.get('floatValue4') as AbstractControl).updateValueAndValidity();

    formConfig.fields.floatValue5.order = 7;
    formConfig.fields.floatValue5.width = 25;
    formConfig.fields.floatValue5.type = FormFieldType.decimal;
    formConfig.fields.floatValue5.label = this.translate.instant(this.tableKey + '.RESTORE_AMOUNT_MAX_PERCENTAGE');
    formConfig.fields.floatValue5.tooltip = this.translate.instant(
      this.tableKey + '.RESTORE_AMOUNT_MAX_PERCENTAGE_HELP',
    );
    (form.get('floatValue5') as AbstractControl).setValidators(Validators.min(0));
    (form.get('floatValue5') as AbstractControl).updateValueAndValidity();

    formConfig.fields.stringValue1.order = 10;
    formConfig.fields.stringValue1.allowNew = true;
    formConfig.fields.stringValue1.width = 33;
    formConfig.fields.stringValue1.require = true;
    formConfig.fields.stringValue1.type = FormFieldType.dynamicDropdown;
    formConfig.fields.stringValue1.fieldConfig = vitalityStatFieldConfig;
    formConfig.fields.stringValue1.label = this.translate.instant(this.tableKey + '.RESTORE_PROPERTY');
    formConfig.fields.stringValue1.tooltip = this.translate.instant(this.tableKey + '.RESTORE_PROPERTY_HELP');
    (form.get('stringValue1') as AbstractControl).setValidators(Validators.required);
    (form.get('stringValue1') as AbstractControl).updateValueAndValidity();
    formConfig.fields.skillType.order = 11;
    formConfig.fields.skillType.width = 33;
    formConfig.fields.skillType.type = FormFieldType.dynamicDropdown;
    formConfig.fields.skillLevelMod.order = 12;
    formConfig.fields.skillLevelMod.width = 33;
    formConfig.fields.skillLevelMod.type = FormFieldType.decimal;
  }

  private parseRestoreTypeFields(form: FormGroup, formConfig: FormConfig, subType: string): void {
    if (!subType) {
      return;
    }
    if (subType.indexOf('Transfer') !== -1) {
      formConfig.fields.stringValue1.width = 50;
      formConfig.fields.floatValue1.order = 8;
      formConfig.fields.floatValue1.width = 50;
      formConfig.fields.floatValue1.type = FormFieldType.decimal;
      formConfig.fields.floatValue1.label = this.translate.instant(this.tableKey + '.TRANSFER_RATE');
      formConfig.fields.floatValue1.tooltip = this.translate.instant(this.tableKey + '.TRANSFER_RATE_HELP');
      (form.get('floatValue1') as AbstractControl).setValidators(Validators.min(0));
      (form.get('floatValue1') as AbstractControl).updateValueAndValidity();
      formConfig.fields.skillType.width = 50;
      formConfig.fields.skillLevelMod.width = 50;
    } else {
      formConfig.fields.floatValue1.order = 99;
      formConfig.fields.floatValue1.type = FormFieldType.hidden;
    }
    if (subType.indexOf('Transfer') === -1 && subType.indexOf('Instant') === -1) {
      formConfig.fields.stringValue1.width = 25;
      formConfig.fields.stackLimit.order = 9;
      formConfig.fields.stackLimit.type = FormFieldType.integer;
      formConfig.fields.allowMultiple.order = 10;
      formConfig.fields.allowMultiple.width = 25;
      formConfig.fields.allowMultiple.type = FormFieldType.boolean;
      this.showDurationField(formConfig, 11);
      formConfig.fields.show_effect.order = 12;
      formConfig.fields.show_effect.type = FormFieldType.boolean;
      formConfig.fields.pulseCount.order = 13;
      formConfig.fields.pulseCount.width = 25;
      formConfig.fields.pulseCount.type = FormFieldType.integer;
      formConfig.fields.pulseCoordEffect.order = 14;
      formConfig.fields.pulseCoordEffect.width = 75;
      formConfig.fields.pulseCoordEffect.type = FormFieldType.file;
    } else {
      if (subType.indexOf('Instant') !== -1) {
        formConfig.fields.stringValue1.width = 50;
        formConfig.fields.skillType.width = 50;
        formConfig.fields.skillLevelMod.width = 50;
        formConfig.fields.pulseCoordEffect.order = 8;
        formConfig.fields.pulseCoordEffect.type = FormFieldType.file;
      } else {
        formConfig.fields.pulseCoordEffect.type = FormFieldType.hidden;
      }
      formConfig.fields.stackLimit.type = FormFieldType.hidden;
      formConfig.fields.allowMultiple.type = FormFieldType.hidden;
      formConfig.fields.duration.type = FormFieldType.hidden;
      formConfig.fields.pulseCount.type = FormFieldType.hidden;
    }
  }

  private showTimeFields(formConfig: FormConfig, position: number): number {
    position += 1;
    formConfig.fields.skillType.order = position;
    formConfig.fields.skillType.type = FormFieldType.dynamicDropdown;
    position += 1;
    formConfig.fields.skillLevelMod.order = position;
    formConfig.fields.skillLevelMod.type = FormFieldType.integer;
    position += 1;
    formConfig.fields.stackLimit.order = position;
    formConfig.fields.stackLimit.type = FormFieldType.integer;
    position += 1;
    formConfig.fields.allowMultiple.order = position;
    formConfig.fields.allowMultiple.type = FormFieldType.boolean;
    position += 1;
    this.showDurationField(formConfig, position);
    position += 1;
    formConfig.fields.show_effect.order = position;
    formConfig.fields.show_effect.type = FormFieldType.boolean;
    position += 1;
    formConfig.fields.pulseCount.order = position;
    formConfig.fields.pulseCount.type = FormFieldType.integer;
    position += 1;
    formConfig.fields.pulseCoordEffect.order = position;
    formConfig.fields.pulseCoordEffect.type = FormFieldType.file;
    position += 1;
    return position;
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
