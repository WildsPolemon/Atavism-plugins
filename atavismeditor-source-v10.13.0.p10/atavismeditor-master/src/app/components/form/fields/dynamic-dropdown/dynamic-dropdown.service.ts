import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {DatabaseService} from '../../../../services/database.service';
import {ProfilesService} from '../../../../settings/profiles/profiles.service';
import {DataBaseProfile, Profile} from '../../../../settings/profiles/profile';
import {QueryParams, TableFields} from '../../../../models/configs';
import {
  ConfigRow,
  ConfigTypes,
  DropdownValue,
  DynamicDropdownFieldConfig,
} from '../../../../models/configRow.interface';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {CoordinatedEffectsService} from '../../../../entry/coordinated-effects/coordinated-effects.service';
import {BonusSettingService} from '../../../../entry/bonus-settings/bonus-settings.service';
import {WeatherProfilesService} from '../../../../entry/weather-profiles/weather-profiles.service';
import {DialogueService} from '../../../../entry/dialogue/dialogue.service';
import {QuestsService} from '../../../../entry/quests/quests.service';
import {ItemsService} from '../../../../entry/items/items.service';
import {SkillsService} from '../../../../entry/skills/skills.service';
import {MobsService} from '../../../../entry/mobs/mobs.service';
import {StatService} from '../../../../entry/stat/stat.service';
import {DamageService} from '../../../../entry/damage/damage.service';
import {FactionsService} from '../../../../entry/factions/factions.service';
import {LootTablesService} from '../../../../entry/loot-tables/loot-tables.service';
import {CurrenciesService} from '../../../../entry/currencies/currencies.service';
import {TaskService} from '../../../../entry/task/task.service';
import {MerchantService} from '../../../../entry/merchant/merchant.service';
import {EnchantProfileService} from '../../../../entry/enchant-profile/enchant-profile.service';
import {BuildObjectService} from '../../../../entry/build-object/build-object.service';
import {CraftingRecipesService} from '../../../../entry/crafting-recipes/crafting-recipes.service';
import {AchievementsService} from '../../../../entry/achievements/achievements.service';
import {MobsSpawnDataService} from '../../../../entry/mobs-spawn-data/mobs-spawn-data.service';
import {InstancesService} from '../../../../entry/instances/instances.service';
import {SkillProfilesService} from '../../../../entry/skill-profiles/skill-profiles.service';
import {AbilitiesService} from '../../../../entry/ability/abilities.service';
import {EffectsService} from '../../../../entry/effects/effects.service';
import {
  abilitiesTable,
  buildObjectTable,
  currenciesTable,
  damageTable,
  effectsTable,
  factionsTable,
  instanceTemplateTable,
  itemTemplatesTable,
  lootTablesTable,
  mobTemplateTable,
  skillsTable,
  spawnDataTable,
  statsTable,
  taskTable,
} from '../../../../entry/tables.data';
import {OptionChoicesService} from '../../../../entry/option-choices/option-choices.service';
import {EditorOptionChoice} from '../../../../entry/option-choices/option-choices.data';
import {DropdownItemsService} from '../../../../entry/dropdown-items.service';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {Utils} from '../../../../directives/utils';
import {EffectType} from '../../../../entry/effects/effects.data';
import {EffectsTriggersService} from '../../../../entry/effects-triggers/effects-triggers.service';
import {actionTypes} from '../../../../entry/dialogue/dialogue.data';
import {InteractionTypes} from '../../../../entry/build-object/build-object.data';
import {AchievementTypesEnum} from '../../../../entry/achievements/achievements.data';
import {AuctionProfileService} from '../../../../entry/auction-profile/auction-profile.service';
import {SlotService} from '../../../../entry/slot/slot.service';
import {MobBehaviorProfileService} from '../../../../entry/mob-behavior-profile/mob-behavior-profile.service';
import {
  LevelXpRewardsProfileService,
  RewardType,
} from '../../../../entry/level-xp-rewards-profile/level-xp-rewards-profile.service';
import {LevelXpProfileService} from '../../../../entry/level-xp-profile/level-xp-profile.service';
import {AbilitiesTriggersService} from '../../../../entry/abilities-triggers/abilities-triggers.service';
import {WeaponProfileService} from '../../../../entry/weapon-profile/weapon-profile.service';
import {ItemAudioProfileService} from '../../../../entry/item-audio-profile/item-audio-profile.service';
import {StatsProfileService} from '../../../../entry/stats-profile/stats-profile.service';
import {
  InteractiveObjectInteractionTypes,
  InteractiveObjectProfileService,
} from '../../../../entry/interactive-object-profile/interactive-object-profile.service';
import {PetProfileService} from '../../../../entry/pet-profile/pet-profile.service';
import {SlotProfileService} from '../../../../entry/slot-profile/slot-profile.service';

interface SubForms {
  subForm: number;
  subFormType: string;
  subFormParent: number;
  subFormParentType: string;
}

@Injectable()
export class DynamicDropdownService {
  private profile!: Profile;
  private limit = 10;
  private readonly statFields = [
    'stat',
    'abilityStatReq0',
    'abilityStatReq1',
    'abilityStatReq2',
    'primaryStat',
    'secondaryStat',
    'thirdStat',
    'fourthStat',
    'resistance_stat',
    'power_stat',
    'accuracy_stat',
    'evasion_stat',
    'critic_chance_stat',
    'critic_power_stat',
    'maxstat',
    'shiftModStat',
    'activationCostType',
    'pulseCostType',
    'statTo',
  ];
  private readonly itemFields = [
    'item',
    'itemID',
    'weapon',
    'primaryWeapon',
    'secondaryWeapon',
    'chooseItem1',
    'chooseItem2',
    'chooseItem3',
    'chooseItem4',
    'chooseItem5',
    'chooseItem6',
    'chooseItem7',
    'chooseItem8',
    'item1',
    'item2',
    'item3',
    'item4',
    'item5',
    'item6',
    'item7',
    'item8',
    'itemReq',
    'itemReq1',
    'itemReq2',
    'itemReq3',
    'itemReq4',
    'itemReq5',
    'itemReq6',
    'item_id',
    'deliveryItem1',
    'deliveryItem2',
    'deliveryItem3',
    'reagentRequired',
    'reagent2Required',
    'reagent3Required',
    'pulseReagentRequired',
    'pulseReagent2Required',
    'pulseReagent3Required',
  ];
  private readonly lootsFields = ['skinningLootTable', 'lootTable'];
  private readonly damagesFields = ['damageType'];
  private readonly abilitiesFields = [
    'abilityID',
    'autoAttack',
    'autoattack',
    'ability',
    'ability0',
    'ability1',
    'ability2',
    'passive_ability',
    'sprint',
    'dodge',
    'ability_id'
  ];
  private readonly instancesFields = ['instance', 'respawnInstance'];
  private readonly skillsFields = [
    'skinningSkillId',
    'skill',
    'parentSkill',
    'prereqSkill1',
    'prereqSkill2',
    'prereqSkill3',
    'skillType',
    'skillID',
  ];
  private readonly factionsFields = [ 'faction', 'rep1', 'rep2', 'prereqFaction', 'faction', 'otherFaction'];
  private readonly currenciesFields = [
    'currency1',
    'currency2',
    'victoryCurrency',
    'defeatCurrency',
    'purchaseCurrency',
    'currency',
    'currencyToID',
    'currencyReq',
  ];
  private readonly effectsFields = [
    'casterEffectRequired',
    'targetEffectRequired',
    'pulseCasterEffectRequired',
    'pulseTargetEffectRequired',
    'activationEffect1',
    'activationEffect2',
    'activationEffect3',
    'activationEffect4',
    'activationEffect5',
    'activationEffect6',
    'onMinHitEffect',
    'onMaxHitEffect',
    'onThreshold',
    'onThreshold2',
    'onThreshold3',
    'onThreshold4',
    'onThreshold5',
    'effect',
  ];
  private readonly questsFields = [
    'prereqQuest',
    'questPrereq',
    'questStartedReq',
    'reqOpenedQuest',
    'reqCompletedQuest',
    'excludingQuest',
    'questReqID',
  ];
  private readonly mobsFields = ['mobTemplate', 'shopMobTemplate'];
  private readonly merchantFields = ['merchantTable', 'merchant_table'];
  private readonly enchantProfilesFields = ['enchant_profile_id'];
  private readonly instanceOptionsFields = ['arenaInstanceID'];
  private readonly skillProfileFields = ['skill_profile_id'];
  private readonly coordEffectFields = [
    'coordEffect1',
    'coordEffect2',
    'coordEffect3',
    'coordEffect4',
    'coordEffect5',
    'harvestCoordEffect',
    'activateCoordeffect',
    'deactivateCoordeffect',
    "coordEffect",
    "powerUpCoordEffect",
  ];
  private readonly effectListFields = [
    'stringValue1',
    'stringValue2',
    'stringValue3',
    'stringValue4',
    'stringValue5',
    'intValue1',
    'intValue2',
    'intValue3',
    'intValue4',
    'intValue5',
  ];
  private readonly effectStringFields = ['stringValue1', 'stringValue2', 'stringValue3', 'stringValue4', 'stringValue5'];

  constructor(
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly bonusSettingService: BonusSettingService,
    private readonly weatherProfilesService: WeatherProfilesService,
    private readonly mobBehaviorProfileService: MobBehaviorProfileService,
    private readonly dialogueService: DialogueService,
    private readonly questsService: QuestsService,
    private readonly itemsService: ItemsService,
    private readonly skillsService: SkillsService,
    private readonly mobsService: MobsService,
    private readonly statService: StatService,
    private readonly damageService: DamageService,
    private readonly factionsService: FactionsService,
    private readonly lootTablesService: LootTablesService,
    private readonly currenciesService: CurrenciesService,
    private readonly taskService: TaskService,
    private readonly merchantService: MerchantService,
    private readonly enchantProfileService: EnchantProfileService,
    private readonly buildObjectService: BuildObjectService,
    private readonly craftingRecipesService: CraftingRecipesService,
    private readonly achievementsService: AchievementsService,
    private readonly mobsSpawnDataService: MobsSpawnDataService,
    private readonly instancesService: InstancesService,
    private readonly skillProfilesService: SkillProfilesService,
    private readonly abilitiesService: AbilitiesService,
    private readonly effectsService: EffectsService,
    private readonly coordinatedEffectsService: CoordinatedEffectsService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly effectsTriggersService: EffectsTriggersService,
    private readonly auctionProfileService: AuctionProfileService,
    private readonly slotService: SlotService,
    private readonly weaponProfileService: WeaponProfileService,
    private readonly levelXpRewardsProfileService: LevelXpRewardsProfileService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly levelXpProfileService: LevelXpProfileService,
    private readonly abilitiesTriggersService: AbilitiesTriggersService,
    private readonly itemAudioProfileService: ItemAudioProfileService,
    private readonly statProfileService: StatsProfileService,
    private readonly interactiveObjectProfileService: InteractiveObjectProfileService,
    private readonly petProfileService: PetProfileService,
    private readonly slotsProfileService: SlotProfileService,

  ) {
    this.profilesService.profile
      .pipe(
        filter((profile: any) => !!profile),
        map((profile: Profile) => profile),
        distinctUntilChanged((x, y) => Utils.equals(x, y))
      )
      .subscribe((profile: Profile) => {
        this.profile = profile;
        this.limit = profile.limit ? +profile.limit : 10;
      });
  }

  private async handleItem(
    fieldConfig: DynamicDropdownFieldConfig,
    form: FormGroup,
    tabType: TabTypes,
    field: string,
    subForms: SubForms,
    option?: DropdownValue
  ): Promise<DropdownValue | DropdownValue[] | null> {
    if (fieldConfig.isOption) {
      const {result, items} = await this.optionChoicesService.updateItem(
        fieldConfig.optionKey as string,
        'optionType',
        !!(option && option.id)
      );
      if (result && items.length > 0) {
        return items.map((item) => ({id: fieldConfig.optionNameAsId ? item.value : item.id, value: item.value}));
      }
      return null;
    } else if (
      this.currenciesFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === currenciesTable) ||
      (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'Currency') ||
      (tabType === TabTypes.RANKINGS && field === 'param1') ||
      (tabType === TabTypes.PVP_RANKS && field === 'currency_id')
    ) {
      return await this.handleCurrency(option && option.id ? (option.id as number) : undefined);
    } else if (['weather_profile_id'].includes(field)) {
      this.weatherProfilesService.init();
      return option && option.id
        ? await this.weatherProfilesService.update(option.id as number)
        : await this.weatherProfilesService.addItem();
    } else if (['behavior_profile_id'].includes(field)) {
      this.mobBehaviorProfileService.init();
      return option && option.id
        ? await this.mobBehaviorProfileService.updateItem(option.id as number)
        : await this.mobBehaviorProfileService.addItem();
    } else if (
      ['bonus_settings_id'].includes(field) ||
      (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Bonuses &&
        this.effectStringFields.includes(field)) ||
      (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'Bonus')
    ) {
      this.bonusSettingService.init();
      const item =
        option && option.id
          ? await this.bonusSettingService.updateItem(option.id as number, fieldConfig.idField)
          : await this.bonusSettingService.addItem(fieldConfig.idField);
      await this.dropdownItemsService.getBonusesSettings();
      return item;
    } else if (
      (tabType === TabTypes.STATS_PROFILE && ['stat_id'].includes(field))
      || (tabType === TabTypes.MOBS && ['pet_count_stat'].includes(field))
    ) {
      return await this.handleStatId(option && option.id ? (option.id as number) : undefined);
    }
    else if (
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === statsTable) ||
      (tabType === TabTypes.EFFECTS &&
        [EffectType.Damage, EffectType.Restore].includes((form.get('effectMainType') as AbstractControl).value) &&
        field === 'stringValue1') ||
      (tabType === TabTypes.EFFECTS &&
        [EffectType.Revive].includes((form.get('effectMainType') as AbstractControl).value) &&
        ['stringValue1', 'stringValue2', 'stringValue3'].includes(field)) ||
      (tabType === TabTypes.EFFECTS &&
        [EffectType.Stat, EffectType.Stealth].includes((form.get('effectMainType') as AbstractControl).value) &&
        this.effectStringFields.includes(field)) ||
      (tabType === TabTypes.EFFECTS &&
        [EffectType.Mount].includes((form.get('effectMainType') as AbstractControl).value) &&
        ['stringValue2'].includes(field)) ||
      ([TabTypes.ITEM_SETS, TabTypes.ENCHANT_PROFILE].includes(tabType) && field === 'name') ||
      (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'Stat') ||
      ([TabTypes.QUESTS, TabTypes.ITEMS, TabTypes.DIALOGUE].includes(tabType) &&
        field === 'editor_option_choice_type_id' &&
        +this.control(form, subForms, 'editor_option_type_id').value === 78) ||
      this.statFields.includes(field)
    ) {
      return await this.handleStat(option && option.id ? (option.id as string) : undefined);
    }  else if (
      this.merchantFields.includes(field) ||
      (field === 'actionID' && this.control(form, subForms, 'action').value === actionTypes.Merchant)
    ) {
      return this.handleMerchants(option && option.id ? (option.id as number) : undefined);
    } else if (
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === spawnDataTable) ||
      (tabType === TabTypes.EFFECTS &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Spawn &&
        field === 'intValue1' &&
        (form.get('intValue2') as AbstractControl).value === 0) ||
      (tabType === TabTypes.BUILD_OBJECT &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractionTypes.NPC)
    ) {
      return await this.handleMobsSpawnData(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.mobsFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === mobTemplateTable) ||
      (tabType === TabTypes.QUESTS &&
        field === 'target' &&
        ['mob', 'mobCategory'].includes(this.control(form, subForms, 'objectiveType').value)) ||
      (tabType === TabTypes.ACHIEVEMENTS &&
        field === 'objects' &&
        (form.get('type') as AbstractControl).value === AchievementTypesEnum.Kill) ||
      (tabType === TabTypes.PET_PROFILE && field === 'template_id' ) ||
      (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Spawn &&
        field === 'intValue1' &&
        (form.get('intValue2') as AbstractControl).value === 2)
    ) {
      return await this.handleMobs(option && option.id ? (option.id as number) : undefined);
    } else if (
      (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Spawn &&
        field === 'intValue1' &&
        (form.get('intValue2') as AbstractControl).value === 3)
    ) {
      return await this.handlePetProfile(option && option.id ? (option.id as number) : undefined);
    }
    else if (this.factionsFields.includes(field) || (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === factionsTable)
      ||  (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Faction &&
        field === 'intValue1')
      ||  (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.ChangeFaction &&
        field === 'intValue1')
      ||  (tabType === TabTypes.RANKINGS &&
        field === 'param2')
    ) {
      return await this.handleFaction(option && option.id ? (option.id as number) : undefined);
    } else if (
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === buildObjectTable) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'intValue1' &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.BuildObject) ||
      (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'ClaimObject')
    ) {
      return await this.handleBuildObject(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.skillsFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === skillsTable) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'intValue1' &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.TeachSkill) ||
      ([TabTypes.QUESTS, TabTypes.ITEMS, TabTypes.DIALOGUE].includes(tabType) &&
        field === 'editor_option_choice_type_id' &&
        +this.control(form, subForms, 'editor_option_type_id').value === 75) ||
      (tabType === TabTypes.ACHIEVEMENTS &&
        field === 'objects' &&
        (form.get('type') as AbstractControl).value === AchievementTypesEnum.Harvesting)
    ) {
      return await this.handleSkill(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.effectsFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === effectsTable) ||
      (tabType === TabTypes.LEVELXP_REWARDS_PROFILE &&
        field === 'reward_value' &&
        [RewardType.Effect].includes(this.control(form, subForms, 'reward_type').value)) ||
      (tabType === TabTypes.ITEMS &&
        field === 'name' &&
        ['SocketEffect'].includes(this.control(form, subForms, 'type').value)) ||
      ([TabTypes.ITEM_SETS, TabTypes.ENCHANT_PROFILE].includes(tabType) &&
        field === 'value' && ['effect'].includes(this.control(form, subForms, 'name').value)) ||
      (tabType === TabTypes.BUILD_OBJECT &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractionTypes.Effect)
      || (tabType === TabTypes.INTERACTIVE_OBJECT_PROFILE &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractiveObjectInteractionTypes.ApplyEffect)
      || (tabType === TabTypes.PVP_RANKS && field === 'effect_id')
    ) {
      return await this.handleEffect(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.abilitiesFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === abilitiesTable) ||
      (tabType === TabTypes.ITEMS &&
        field === 'name' &&
        ['UseAbility', 'AutoAttack', 'SocketAbility'].includes(this.control(form, subForms, 'type').value)) ||
      (tabType === TabTypes.ACHIEVEMENTS &&
        field === 'objects' &&
        (form.get('type') as AbstractControl).value === AchievementTypesEnum.UseAbility) ||
      (tabType === TabTypes.DIALOGUE && field === 'actionID' && this.control(form, subForms, 'action').value === actionTypes.Ability) ||
      (tabType === TabTypes.LEVELXP_REWARDS_PROFILE &&
        field === 'reward_value' &&
        [RewardType.Ability].includes(this.control(form, subForms, 'reward_type').value)) ||
      ([TabTypes.ITEM_SETS, TabTypes.ENCHANT_PROFILE].includes(tabType) &&
        field === 'value' && ['ability'].includes(this.control(form, subForms, 'name').value)) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'intValue1' &&
        [EffectType.TeachAbility,EffectType.UnlearnAbility, EffectType.Trap].includes((form.get('effectMainType') as AbstractControl).value)) ||
      (tabType === TabTypes.ABILITY && field === 'ability_sub_id')
    ) {
      return await this.handleAbility(option && option.id ? (option.id as number) : undefined);
    } else if (
      tabType === TabTypes.DIALOGUE &&
      field === 'actionID' &&
      this.control(form, subForms, 'action').value === actionTypes.Auction
    ) {
      this.auctionProfileService.init();
      return option && option.id
        ? await this.auctionProfileService.updateItem(option.id as number)
        : await this.auctionProfileService.addItem();
    } else if (
      (tabType === TabTypes.SLOT_GROUP && field === 'slot_id')||
      (tabType === TabTypes.SLOTS_PROFILE && field === 'slot_id')||
      (tabType === TabTypes.WEAPON_PROFILE && field === 'slot')
    ) {
      this.slotService.init();
      return option && option.id ? await this.slotService.updateItem(option.id as number) : await this.slotService.addItem();
    } else if ((tabType === TabTypes.ITEMS && field === 'weapon_profile_id')) {
      this.weaponProfileService.init();
      const item =  option && option.id ? await this.weaponProfileService.updateItem(option.id as number) : await this.weaponProfileService.addItem();
      await this.dropdownItemsService.getWeaponProfiles();
      return item;
    } else if ((tabType === TabTypes.ITEMS && field === 'audio_profile_id')) {
      this.itemAudioProfileService.init();
      const item =  option && option.id ? await this.itemAudioProfileService.updateItem(option.id as number) : await this.itemAudioProfileService.addItem();
      await this.dropdownItemsService.getItemAudioProfiles();
      return item;
    }  else if (
      this.itemFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === itemTemplatesTable) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'intValue1' &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.CreateItem) ||
      (tabType === TabTypes.ITEM_SETS && field === 'items') ||
      (tabType === TabTypes.QUESTS && field === 'target' && this.control(form, subForms, 'objectiveType').value === 'item') ||
      (tabType === TabTypes.ACHIEVEMENTS &&
        field === 'objects' &&
        (form.get('type') as AbstractControl).value === AchievementTypesEnum.Crafting) ||
      (tabType === TabTypes.LEVELXP_REWARDS_PROFILE &&
        field === 'reward_value' &&
        [RewardType.Item, RewardType.ItemMail].includes(this.control(form, subForms, 'reward_type').value)) ||
      (tabType === TabTypes.CRAFTING_RECIPES && (field.includes('component') || field.includes('resultItem')))
    ) {
      return await this.handleItemTemplate(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.instancesFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === instanceTemplateTable) ||
      (tabType === TabTypes.BUILD_OBJECT &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractionTypes.Instance) ||
      (tabType === TabTypes.EFFECTS &&
        this.effectListFields.includes(field) &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Teleport) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'intValue1' &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.SetRespawnLocation)
      || (tabType === TabTypes.INTERACTIVE_OBJECT_PROFILE &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractiveObjectInteractionTypes.InstancePortal)
    ) {
      return await this.handleInstance(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.lootsFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === lootTablesTable) ||
      (tabType === TabTypes.EFFECTS &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.CreateItemFromLoot &&
        ['intValue1', 'intValue2', 'intValue3', 'intValue4', 'intValue5'].includes(field)) ||
      (tabType === TabTypes.BUILD_OBJECT &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractionTypes.Resource)
    ) {
      return await this.handleLootTable(option && option.id ? (option.id as number) : undefined);
    } else if (
      this.damagesFields.includes(field) ||
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === damageTable) ||
      (tabType === TabTypes.EFFECTS &&
        field === 'stringValue2' &&
        [EffectType.Damage, EffectType.Restore].includes((form.get('effectMainType') as AbstractControl).value))
    ) {
      return await this.handleDamage(option && option.id ? (option.id as string) : undefined);
    } else if (
      (tabType === TabTypes.HANDLE_DEPENDENCIES && fieldConfig.table === taskTable) ||
      (tabType === TabTypes.EFFECTS &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.Task &&
        field === 'intValue1') ||
      (tabType === TabTypes.QUESTS && field === 'target' && this.control(form, subForms, 'objectiveType').value === 'task')
      || (tabType === TabTypes.INTERACTIVE_OBJECT_PROFILE &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractiveObjectInteractionTypes.CompleteTask)
    ) {
      return await this.handleTask(option && option.id ? (option.id as number) : undefined);
    } else if (
      tabType === TabTypes.EFFECTS &&
      'stringValue1' === field &&
      (form.get('effectMainType') as AbstractControl).value === EffectType.Trigger
    ) {
      this.effectsTriggersService.init();
      return option && option.id
        ? await this.effectsTriggersService.updateItem(option.id as number)
        : await this.effectsTriggersService.addItem();
    } else if (
      tabType === TabTypes.ABILITY &&
      'trigger_id' === field
    ) {
      this.abilitiesTriggersService.init();
      return option && option.id
        ? await this.abilitiesTriggersService.updateItem(option.id as number)
        : await this.abilitiesTriggersService.addItem();
    } else if (
      this.questsFields.includes(field) ||
      (tabType === TabTypes.DIALOGUE &&
        field === 'actionID' &&
        [actionTypes.Quest, actionTypes.QuestProgress].includes(this.control(form, subForms, 'action').value)) ||
      (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'StartQuest')
      || (tabType === TabTypes.INTERACTIVE_OBJECT_PROFILE &&
        field === 'interactionID' &&
        this.control(form, subForms, 'interactionType').value === InteractiveObjectInteractionTypes.StartQuest)
    ) {
      return await this.handleQuest(option && option.id ? (option.id as number) : undefined);
    } else if (
      tabType === TabTypes.ITEMS &&
      field === 'name' &&
      ['CraftsItem', 'Blueprint'].includes(this.control(form, subForms, 'type').value)
    ) {
      this.craftingRecipesService.init();
      const item =
        option && option.id
          ? await this.craftingRecipesService.updateItem(option.id as number)
          : await this.craftingRecipesService.addItem();
      await this.dropdownItemsService.getCraftingRecipes();
      return item;
    } else if (tabType === TabTypes.ITEMS && field === 'name' && this.control(form, subForms, 'type').value === 'Achievement') {
      this.achievementsService.init();
      const item =
        option && option.id ? await this.achievementsService.updateItem(option.id as number) : await this.achievementsService.addItem();
      await this.dropdownItemsService.getAchievements();
      return item;
    } else if (
      (tabType === TabTypes.DIALOGUE && ['prereqDialogue'].includes(field)) ||
      (tabType === TabTypes.DIALOGUE && field === 'actionID' && this.control(form, subForms, 'action').value === actionTypes.Dialogue)
    ) {
      this.dialogueService.init();
      let item;
      if (option && option.id) {
        const dialogue = await this.dialogueService.updateItem(option.id as number);
        if (dialogue) {
          item = {id: dialogue.id as number, value: dialogue.name};
        }
      } else {
        item = await this.dialogueService.addItem();
      }
      if (item) {
        await this.dropdownItemsService.getNotUsedDialogues();
        await this.dropdownItemsService.getDialogues();
        return item;
      }
      return null;
    } else if (this.skillProfileFields.includes(field)) {
      let type = -1;
      if (field === 'skill_profile_id') {
        type = (form.get('type') as AbstractControl).value;
      }
      this.skillProfilesService.init();
      const item =
        option && option.id
          ? await this.skillProfilesService.updateItem(option.id as number)
          : await this.skillProfilesService.addItem(type);
      await this.dropdownItemsService.getSkillProfile();
      return item;
    } else if (this.instanceOptionsFields.includes(field)) {
      return await this.handleInstance(option && option.id ? (option.id as number) : undefined, 4);
    } else if (this.coordEffectFields.includes(field)) {
      this.coordinatedEffectsService.init();
      const item =
        option && option.id
          ? await this.coordinatedEffectsService.updateItem(option.id as number, fieldConfig.idField)
          : await this.coordinatedEffectsService.addItem(fieldConfig.idField);
      await this.dropdownItemsService.getCoordinatedEffects();
      return item;
    } else if (this.enchantProfilesFields.includes(field)) {
      this.enchantProfileService.init();
      const item =
        option && option.id ? await this.enchantProfileService.updateItem(option.id as number) : await this.enchantProfileService.addItem();
      await this.dropdownItemsService.getEnchantProfiles();
      return item;
    } else if (tabType === TabTypes.ITEMS && field === 'name') {
      this.control(form, subForms, field).reset();
      return null;
    } else if (tabType === TabTypes.BUILD_OBJECT && field === 'interactionID') {
      this.control(form, subForms, 'interactionType').reset();
      return null;
    } else if ([TabTypes.QUESTS, TabTypes.ITEMS, TabTypes.DIALOGUE].includes(tabType) && field === 'editor_option_choice_type_id') {
      this.control(form, subForms, 'editor_option_type_id').reset();
      return null;
    } else if (tabType === TabTypes.LEVELXP_PROFILE && field === 'reward_template_id') {
      this.levelXpRewardsProfileService.init();
      const item =
        option && option.id
          ? await this.levelXpRewardsProfileService.updateItem(option.id as number)
          : await this.levelXpRewardsProfileService.addItem();
      await this.dropdownItemsService.getLevelXpRewardProfile();
      return item;
    } else if (tabType === TabTypes.PLAYER_CHARACTER && field === 'xpProfile') {
      this.levelXpProfileService.init();
      const item =
        option && option.id
          ? await this.levelXpProfileService.updateItem(option.id as number)
          : await this.levelXpProfileService.addItem();
      await this.dropdownItemsService.getLevelXpProfile();
      return item;
    } else if ((tabType === TabTypes.PLAYER_CHARACTER || tabType === TabTypes.MOBS) && field === 'stat_profile_id') {
      this.statProfileService.init();
      const item =
        option && option.id
          ? await this.statProfileService.updateItem(option.id as number)
          : await this.statProfileService.addItem();
      await this.dropdownItemsService.getStatProfile();
      return item;
    } else if (
      (tabType === TabTypes.EFFECTS &&
        (form.get('effectMainType') as AbstractControl).value === EffectType.SpawnInteractiveObject &&
        field === 'intValue1')){
      this.interactiveObjectProfileService.init();
      const item =
        option && option.id
          ? await this.interactiveObjectProfileService.updateItem(option.id as number)
          : await this.interactiveObjectProfileService.addItem();
      await this.dropdownItemsService.getInteractiveObjectProfile();
      return item;
    } else if (
      (tabType === TabTypes.PET_PROFILE && field === 'slot_profile_id')){
      this.slotsProfileService.init();
      const item =
        option && option.id
          ? await this.slotsProfileService.updateItem(option.id as number)
          : await this.slotsProfileService.addItem();
      await this.dropdownItemsService.getSlotsProfile();
      return item;
    }
      return null;
  }

  public async manageItem(
    fieldConfig: DynamicDropdownFieldConfig,
    form: FormGroup,
    tabType: TabTypes,
    field: string,
    subForms: SubForms,
    option?: DropdownValue
  ): Promise<DropdownValue | DropdownValue[] | null> {
    return await this.handleItem(fieldConfig, form, tabType, field, subForms, option);
  }

  public async getItem(fieldConfig: DynamicDropdownFieldConfig, id: number | string): Promise<DropdownValue | undefined> {
    if (fieldConfig.isData) {
      return (fieldConfig.data as DropdownValue[]).find((item) => item.id === +id) as DropdownValue;
    }
    if (fieldConfig.isOption) {
      const option = await this.optionChoicesService.getOptionsById(
        id,
        fieldConfig.optionNameAsId,
        fieldConfig.optionIdAsI,
        fieldConfig.optionKey,
        fieldConfig.options
      );
      if (!option) {
        return;
      }
      if (fieldConfig.optionIdAsI) {
        return option as DropdownValue;
      }
      return {
        id: fieldConfig.optionNameAsId ? (option as EditorOptionChoice).choice : option.id,
        value: (option as EditorOptionChoice).choice,
      };
    }
    const dbProfile = this.profile.databases.find((prof) => prof.type === fieldConfig.profile) as DataBaseProfile;
    const response: any = await this.databaseService.queryItem(dbProfile, fieldConfig.table as string, fieldConfig.idField as string, id);
    if (response) {
      return {id: response[fieldConfig.idField as string], value: response[fieldConfig.valueField as string]};
    }
    return;
  }

  public async loadList(
    fieldConfig: DynamicDropdownFieldConfig,
    offset = 0,
    search = ''
  ): Promise<{count: number; list: DropdownValue[]; allowMore: boolean}> {
    if (fieldConfig.isData) {
      return {
        count: (fieldConfig.data as DropdownValue[]).length,
        list: fieldConfig.data as DropdownValue[],
        allowMore: false,
      };
    }
    const dbProfile = this.profile.databases.find((prof) => prof.type === fieldConfig.profile) as DataBaseProfile;
    if (fieldConfig.isOption) {
      const list = await this.optionChoicesService.getOptionsByType(
        fieldConfig.optionKey as string,
        !!fieldConfig.optionNameAsId,
        !!fieldConfig.optionIdAsI,
        fieldConfig.options,
        search
      );
      return {
        count: list.length,
        list,
        allowMore: false,
      };
    }
    const fields: TableFields = {};
    fields[fieldConfig.idField as string] = {type: ConfigTypes.stringType} as ConfigRow;
    fields[fieldConfig.valueField as string] = {type: ConfigTypes.stringType, useAsSearch: true} as ConfigRow;
    let queryParams: QueryParams = {};
    if (Object.keys(fieldConfig.options as QueryParams).length > 0) {
      queryParams = {...fieldConfig.options};
    }
    if (search && search.length > 0) {
      queryParams.search = search;
    }
    queryParams.limit = {limit: this.limit, page: offset};
    const response = await this.databaseService.queryDropdownList(dbProfile, fieldConfig.table as string, fields, queryParams);
    if (fieldConfig.table === statsTable && fieldConfig.idField === "id") {
      return {
        count: response.count,
        list: response.list.map((itm) => ({id: itm.id, value: itm.name})),
        allowMore: this.limit + this.limit * offset < response.count,
      };
    } else if (fieldConfig.table === statsTable) {
      return {
        count: response.count,
        list: response.list.map((itm) => ({id: itm.name, value: itm.name})),
        allowMore: this.limit + this.limit * offset < response.count,
      };
    }
    return {
      count: response.count,
      list: response.list.map((itm) => ({id: itm[fieldConfig.idField as string], value: itm[fieldConfig.valueField as string]})),
      allowMore: this.limit + this.limit * offset < response.count,
    };
  }

  private control(form: FormGroup, {subForm, subFormType, subFormParent, subFormParentType}: SubForms, field: string): AbstractControl {
    let formField = form;
    if (subForm !== -1 && subFormParent !== -1) {
      formField = ((form.get(subFormParentType) as FormArray).at(subFormParent).get(subFormType) as FormArray).controls[
        subForm
      ] as FormGroup;
    } else if (subForm !== -1) {
      formField = (form.get(subFormType) as FormArray).controls[subForm] as FormGroup;
    }
    return formField.get(field) as AbstractControl;
  }

  private async handleQuest(id?: number): Promise<null | DropdownValue> {
    this.questsService.init();
    const item = id ? await this.questsService.updateItem(id) : await this.questsService.addItem();
    await this.dropdownItemsService.getQuests();
    return item;
  }

  private async handleLootTable(id?: number): Promise<null | DropdownValue> {
    this.lootTablesService.init();
    const item = id ? await this.lootTablesService.updateItem(id) : await this.lootTablesService.addItem();
    await this.dropdownItemsService.getLootTables();
    return item;
  }

  private async handleInstance(id?: number, type?: number): Promise<null | DropdownValue> {
    this.instancesService.init();
    const item = id ? await this.instancesService.updateItem(id) : await this.instancesService.addItem(type);
    await this.dropdownItemsService.getInstances();
    if (type) {
      await this.dropdownItemsService.getInstancesOption();
    }
    return item;
  }

  private async handleStat(id?: string): Promise<null | DropdownValue> {
    this.statService.init();
    const item = id ? await this.statService.updateItem(id) : await this.statService.addItem();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getVitalityStats();
    return item;
  }
  private async handleStatId(id?: number): Promise<null | DropdownValue> {
    this.statService.init();
    const item = id ? await this.statService.updateItemId(id) : await this.statService.addItem();
    await this.dropdownItemsService.getStats();
    await this.dropdownItemsService.getStatsId();
    await this.dropdownItemsService.getVitalityStats();
    return item;
  }
  private async handleItemTemplate(id?: number): Promise<null | DropdownValue> {
    this.itemsService.init();
    const item = id ? await this.itemsService.updateItem(id) : await this.itemsService.addItem();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getWeaponItems();
    return item;
  }

  private async handleAbility(id?: number): Promise<null | DropdownValue> {
    this.abilitiesService.init();
    const item = id ? await this.abilitiesService.updateItem(id) : await this.abilitiesService.addItem();
    await this.dropdownItemsService.getAbilities();
    return item;
  }

  private async handleEffect(id?: number): Promise<null | DropdownValue> {
    this.effectsService.init();
    const item = id ? await this.effectsService.updateItem(id) : await this.effectsService.addItem();
    await this.dropdownItemsService.getEffects();
    return item;
  }

  private async handleSkill(id?: number): Promise<null | DropdownValue> {
    this.skillsService.init();
    const item = id ? await this.skillsService.updateItem(id) : await this.skillsService.addItem();
    await this.dropdownItemsService.getSkills();
    return item;
  }

  private async handleBuildObject(id?: number): Promise<null | DropdownValue> {
    this.buildObjectService.init();
    const item = id ? await this.buildObjectService.updateItem(id) : await this.buildObjectService.addItem();
    await this.dropdownItemsService.getBuildObjects();
    return item;
  }

  private async handleFaction(id?: number): Promise<null | DropdownValue> {
    this.factionsService.init();
    const item = id ? await this.factionsService.updateItem(id) : await this.factionsService.addItem();
    await this.dropdownItemsService.getFactions();
    return item;
  }

  private async handleCurrency(id?: number): Promise<null | DropdownValue> {
    this.currenciesService.init();
    const item = id ? await this.currenciesService.updateItem(id) : await this.currenciesService.addItem();
    await this.dropdownItemsService.getCurrencies();
    return item;
  }

  private async handleMobs(id?: number): Promise<null | DropdownValue> {
    this.mobsService.init();
    const item = id ? await this.mobsService.updateItem(id) : await this.mobsService.addItem();
    await this.dropdownItemsService.getMobs();
    return item;
  }

  private async handleMobsSpawnData(id?: number): Promise<DropdownValue | null> {
    this.mobsSpawnDataService.init();
    const item = id ? await this.mobsSpawnDataService.updateItem(id) : await this.mobsSpawnDataService.addItem();
    await this.dropdownItemsService.getSpawnData();
    return item;
  }

  private async handleDamage(id?: string): Promise<null | DropdownValue> {
    this.damageService.init();
    const item = id ? await this.damageService.updateItem(id) : await this.damageService.addItem();
    await this.dropdownItemsService.getDamages();
    return item;
  }

  private async handleTask(id?: number): Promise<null | DropdownValue> {
    this.taskService.init();
    const item = id ? await this.taskService.updateItem(id) : await this.taskService.addItem();
    await this.dropdownItemsService.getTasks();
    return item;
  }

  private async handleMerchants(id?: number): Promise<DropdownValue | null> {
    this.merchantService.init();
    const item = id ? await this.merchantService.updateItem(id) : await this.merchantService.addItem();
    await this.dropdownItemsService.getMerchants();
    return item;
  }

  private async handlePetProfile(id?: number): Promise<DropdownValue | null> {
    this.petProfileService.init();
    const item = id ? await this.petProfileService.updateItem(id) : await this.petProfileService.addItem();
    await this.dropdownItemsService.getPetProfile();
    return item;
  }
}
