import {AccountsComponent} from '../entry/accounts/accounts.component';
import {CurrenciesComponent} from '../entry/currencies/currencies.component';
import {InstancesComponent} from '../entry/instances/instances.component';
import {TaskComponent} from '../entry/task/task.component';
import {ItemsComponent} from '../entry/items/items.component';
import {DatabaseActionsComponent} from '../entry/database-actions/database-actions.component';
import {GameSettingComponent} from '../entry/game-setting/game-setting.component';
import {WeatherProfilesComponent} from '../entry/weather-profiles/weather-profiles.component';
import {OptionChoicesComponent} from '../entry/option-choices/option-choices.component';
import {BonusSettingsComponent} from '../entry/bonus-settings/bonus-settings.component';
import {VipComponent} from '../entry/vip/vip.component';
import {AchievementsComponent} from '../entry/achievements/achievements.component';
import {RankingsComponent} from '../entry/rankings/rankings.component';
import {MobsComponent} from '../entry/mobs/mobs.component';
import {LootTablesComponent} from '../entry/loot-tables/loot-tables.component';
import {MerchantComponent} from '../entry/merchant/merchant.component';
import {FactionsComponent} from '../entry/factions/factions.component';
import {QuestsComponent} from '../entry/quests/quests.component';
import {DialogueComponent} from '../entry/dialogue/dialogue.component';
import {MobsSpawnDataComponent} from '../entry/mobs-spawn-data/mobs-spawn-data.component';
import {CraftingRecipesComponent} from '../entry/crafting-recipes/crafting-recipes.component';
import {BuildObjectComponent} from '../entry/build-object/build-object.component';
import {ItemSetsComponent} from '../entry/item-sets/item-sets.component';
import {EnchantProfileComponent} from '../entry/enchant-profile/enchant-profile.component';
import {DamageComponent} from '../entry/damage/damage.component';
import {CoordinatedEffectsComponent} from '../entry/coordinated-effects/coordinated-effects.component';
import {ArenaComponent} from '../entry/arena/arena.component';
import {LevelXpComponent} from '../entry/level-xp/level-xp.component';
import {StatComponent} from '../entry/stat/stat.component';
import {SkillsComponent} from '../entry/skills/skills.component';
import {SkillProfilesComponent} from '../entry/skill-profiles/skill-profiles.component';
import {AbilitiesComponent} from '../entry/ability/abilities.component';
import {PlayerCharacterComponent} from '../entry/player-character/player-character.component';
import {EffectsComponent} from '../entry/effects/effects.component';
import {TabTypes} from '../models/tabTypes.enum';
import {ThresholdsComponent} from '../entry/thresholds/thresholds.component';
import {EffectsTriggersComponent} from '../entry/effects-triggers/effects-triggers.component';
import {AbilitiesTriggersComponent} from '../entry/abilities-triggers/abilities-triggers.component';
import {GuildLevelComponent} from '../entry/guild/guild-level.component';
import {ClaimProfileComponent} from '../entry/claim-profile/claim-profile.component';
import {AuctionProfileComponent} from '../entry/auction-profile/auction-profile.component';
import {SlotComponent} from '../entry/slot/slot.component';
import {SlotGroupComponent} from '../entry/slot-group/slot-group.component';
import {ResourceNodeProfileComponent} from '../entry/resource-node-profile/resource-node-profile.component';
import {GlobalEventsComponent} from '../entry/global-events/global-events.component';
import {MobBehaviorProfileComponent} from '../entry/mob-behavior-profile/mob-behavior-profile.component';
import {LevelXpProfileComponent} from '../entry/level-xp-profile/level-xp-profile.component';
import {LevelXpRewardsProfileComponent} from '../entry/level-xp-rewards-profile/level-xp-rewards-profile.component';
import {WeaponProfileComponent} from '../entry/weapon-profile/weapon-profile.component';
import {ItemAudioProfileComponent} from '../entry/item-audio-profile/item-audio-profile.component';
import {StatsProfileComponent} from '../entry/stats-profile/stats-profile.component';
import {
  InteractiveObjectProfileComponent
} from '../entry/interactive-object-profile/interactive-object-profile.component';
import {PetProfileComponent} from '../entry/pet-profile/pet-profile.component';
import {SlotProfileComponent} from '../entry/slot-profile/slot-profile.component';
import {PvpRanksComponent} from '../entry/pvp-ranks/pvp-ranks.component';

export enum TabType {
  server = 'server',
  mob = 'mob',
  item = 'item',
  combat = 'combat',
  character = 'character',
}

export interface Tab {
  id: TabTypes | string;
  title: string;
  icon: string;
  type: TabType;
  locked: boolean;
  active?: boolean;
  component?: any;
}

export const tabs: Tab[] = [
  {
    id: TabTypes.DATABASE_ACTIONS,
    icon: 'database_operations.png',
    title: 'DATABASE_ACTIONS.TITLE',
    type: TabType.server,
    component: DatabaseActionsComponent,
    locked: false,
  },
  {
    id: TabTypes.OPTION_CHOICE,
    icon: 'option_choices.png',
    title: 'OPTION_CHOICE.TITLE',
    type: TabType.server,
    component: OptionChoicesComponent,
    locked: false,
  },
  {
    id: TabTypes.GAMESETTING,
    icon: 'game_settings.png',
    title: 'GAME_SETTING.TITLE',
    type: TabType.server,
    component: GameSettingComponent,
    locked: false,
  },
  {
    id: TabTypes.INSTANCES,
    icon: 'instances.png',
    title: 'INSTANCES.TITLE',
    type: TabType.server,
    component: InstancesComponent,
    locked: false,
  },
  {
    id: TabTypes.ACCOUNTS,
    icon: 'account.png',
    title: 'ACCOUNTS.TITLE',
    type: TabType.server,
    component: AccountsComponent,
    locked: false,
  },
  {
    id: TabTypes.TASK,
    icon: 'task.png',
    title: 'TASK.TITLE',
    type: TabType.server,
    component: TaskComponent,
    locked: false,
  },
  {
    id: TabTypes.WEATHER_PROFILE,
    icon: 'weather.png',
    title: 'WEATHER_PROFILE.TITLE',
    type: TabType.server,
    component: WeatherProfilesComponent,
    locked: false,
  },
  {
    id: TabTypes.BONUS_SETTING,
    icon: 'bonus_settings.png',
    title: 'BONUS_SETTING.TITLE',
    type: TabType.server,
    component: BonusSettingsComponent,
    locked: false,
  },
  {
    id: TabTypes.VIP,
    icon: 'vip_level.png',
    title: 'VIP.TITLE',
    type: TabType.server,
    component: VipComponent,
    locked: false,
  },
  {
    id: TabTypes.ACHIEVEMENTS,
    icon: 'achievements.png',
    title: 'ACHIEVEMENTS.TITLE',
    type: TabType.server,
    component: AchievementsComponent,
    locked: false,
  },
  {
    id: TabTypes.RANKINGS,
    icon: 'ranks.png',
    title: 'RANKINGS.TITLE',
    type: TabType.server,
    component: RankingsComponent,
    locked: false,
  },
  {
    id: TabTypes.GUILD_LEVEL,
    icon: 'guild.png',
    title: 'GUILD_LEVEL.TITLE',
    type: TabType.server,
    component: GuildLevelComponent,
    locked: false,
  },
  {
    id: TabTypes.RESOURCE_NODE_PROFILE,
    icon: 'resource_nodes_profile.png',
    title: 'RESOURCE_NODE_PROFILE.TITLE',
    type: TabType.server,
    component: ResourceNodeProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.GLOBAL_EVENTS,
    icon: 'global_events.png',
    title: 'GLOBAL_EVENTS.TITLE',
    type: TabType.server,
    component: GlobalEventsComponent,
    locked: false,
  },
  {
    id: TabTypes.MOBS,
    icon: 'mobs.png',
    title: 'MOBS.TITLE',
    type: TabType.mob,
    component: MobsComponent,
    locked: false,
  },
  {
    id: TabTypes.LOOT_TABLE,
    icon: 'loot_table.png',
    title: 'LOOT_TABLE.TITLE',
    type: TabType.mob,
    component: LootTablesComponent,
    locked: false,
  },
  {
    id: TabTypes.MERCHANT,
    icon: 'merchant.png',
    title: 'MERCHANT.TITLE',
    type: TabType.mob,
    component: MerchantComponent,
    locked: false,
  },
  {
    id: TabTypes.FACTION,
    icon: 'factions.png',
    title: 'FACTION.TITLE',
    type: TabType.mob,
    component: FactionsComponent,
    locked: false,
  },
  {
    id: TabTypes.QUESTS,
    icon: 'quests.png',
    title: 'QUESTS.TITLE',
    type: TabType.mob,
    component: QuestsComponent,
    locked: false,
  },
  {
    id: TabTypes.DIALOGUE,
    icon: 'dialogues.png',
    title: 'DIALOGUE.TITLE',
    type: TabType.mob,
    component: DialogueComponent,
    locked: false,
  },
  {
    id: TabTypes.MOBS_SPAWN_DATA,
    icon: 'mob_spawn.png',
    title: 'MOBS_SPAWN_DATA.TITLE',
    type: TabType.mob,
    component: MobsSpawnDataComponent,
    locked: false,
  },
  {
    id: TabTypes.AUCTION_HOUSE_PROFILE,
    icon: 'auction_house_profile.png',
    title: 'AUCTION_HOUSE_PROFILE.TITLE',
    type: TabType.mob,
    component: AuctionProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.MOB_BEHAVIOR_PROFILE,
    icon: 'mob_behavior_profile.png',
    title: 'MOB_BEHAVIOR_PROFILE.TITLE',
    type: TabType.mob,
    component: MobBehaviorProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.ITEMS,
    icon: 'items.png',
    title: 'ITEMS.TITLE',
    type: TabType.item,
    component: ItemsComponent,
    locked: false,
  },
  {
    id: TabTypes.CURRENCIES,
    icon: 'currencies.png',
    title: 'CURRENCIES.TITLE',
    type: TabType.item,
    component: CurrenciesComponent,
    locked: false,
  },
  {
    id: TabTypes.CRAFTING_RECIPES,
    icon: 'crafting_recipes.png',
    title: 'CRAFTING_RECIPES.TITLE',
    type: TabType.item,
    component: CraftingRecipesComponent,
    locked: false,
  },
  {
    id: TabTypes.BUILD_OBJECT,
    icon: 'build_objects.png',
    title: 'BUILD_OBJECT.TITLE',
    type: TabType.item,
    component: BuildObjectComponent,
    locked: false,
  },
  {
    id: TabTypes.ENCHANT_PROFILE,
    icon: 'enchanting.png',
    title: 'ENCHANT_PROFILE.TITLE',
    type: TabType.item,
    component: EnchantProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.ITEM_SETS,
    icon: 'item_sets.png',
    title: 'ITEM_SETS.TITLE',
    type: TabType.item,
    component: ItemSetsComponent,
    locked: false,
  },
  {
    id: TabTypes.CLAIM_PROFILE,
    icon: 'claim_profiles.png',
    title: 'CLAIM_PROFILE.TITLE',
    type: TabType.item,
    component: ClaimProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.SLOT,
    icon: 'slots.png',
    title: 'SLOT.TITLE',
    type: TabType.item,
    component: SlotComponent,
    locked: false,
  },
  {
    id: TabTypes.SLOT_GROUP,
    icon: 'slots.png',
    title: 'SLOT_GROUP.TITLE',
    type: TabType.item,
    component: SlotGroupComponent,
    locked: false,
  },
  {
    id: TabTypes.SLOTS_PROFILE,
    icon: 'slots.png',
    title: 'SLOTS_PROFILE.TITLE',
    type: TabType.item,
    component: SlotProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.ARENA,
    icon: 'arena.png',
    title: 'ARENA.TITLE',
    type: TabType.combat,
    component: ArenaComponent,
    locked: false,
  },
  {
    id: TabTypes.SKILLS,
    icon: 'skills.png',
    title: 'SKILLS.TITLE',
    type: TabType.combat,
    component: SkillsComponent,
    locked: false,
  },
  {
    id: TabTypes.SKILL_PROFILES,
    icon: 'skills_profiles.png',
    title: 'SKILL_PROFILES.TITLE',
    type: TabType.combat,
    component: SkillProfilesComponent,
    locked: false,
  },
  {
    id: TabTypes.ABILITY,
    icon: 'abilities.png',
    title: 'ABILITY.TITLE',
    type: TabType.combat,
    component: AbilitiesComponent,
    locked: false,
  },
  {
    id: TabTypes.EFFECTS,
    icon: 'effects.png',
    title: 'EFFECTS.TITLE',
    type: TabType.combat,
    component: EffectsComponent,
    locked: false,
  },
  {
    id: TabTypes.COORDINATED_EFFECTS,
    icon: 'coord_effects.png',
    title: 'COORDINATED_EFFECTS.TITLE',
    type: TabType.combat,
    component: CoordinatedEffectsComponent,
    locked: false,
  },
  {
    id: TabTypes.STATS,
    icon: 'stats.png',
    title: 'STATS.TITLE',
    type: TabType.combat,
    component: StatComponent,
    locked: false,
  },
  {
    id: TabTypes.STATS_PROFILE,
    icon: 'stats.png',
    title: 'STATS_PROFILE.TITLE',
    type: TabType.combat,
    component: StatsProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.DAMAGE,
    icon: 'damage.png',
    title: 'DAMAGE.TITLE',
    type: TabType.combat,
    component: DamageComponent,
    locked: false,
  },
  {
    id: TabTypes.THRESHOLDS,
    icon: 'thresholds.png',
    title: 'THRESHOLDS.TITLE',
    type: TabType.combat,
    component: ThresholdsComponent,
    locked: false,
  },
  {
    id: TabTypes.EFFECTS_TRIGGERS,
    icon: 'triggers.png',
    title: 'EFFECTS_TRIGGERS.TITLE',
    type: TabType.combat,
    component: EffectsTriggersComponent,
    locked: false,
  },
  {
    id: TabTypes.ABILITIES_TRIGGERS,
    icon: 'triggers.png',
    title: 'ABILITIES_TRIGGERS.TITLE',
    type: TabType.combat,
    component: AbilitiesTriggersComponent,
    locked: false,
  },
  {
    id: TabTypes.PLAYER_CHARACTER,
    icon: 'player_character_setup.png',
    title: 'PLAYER_CHARACTER.TITLE',
    type: TabType.character,
    component: PlayerCharacterComponent,
    locked: false,
  },
  {
    id: TabTypes.LEVELXP_PROFILE,
    icon: 'level_xp.png',
    title: 'LEVELXP_PROFILE.TITLE',
    type: TabType.character,
    component: LevelXpProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.LEVELXP_REWARDS_PROFILE,
    icon: 'level_xp.png',
    title: 'LEVELXP_REWARDS_PROFILE.TITLE',
    type: TabType.character,
    component: LevelXpRewardsProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.WEAPON_PROFILE,
    icon: 'weapon_profile.png',
    title: 'WEAPON_PROFILE.TITLE',
    type: TabType.item,
    component: WeaponProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.ITEM_AUDIO_PROFILE,
    icon: 'item_audio_profile.png',
    title: 'ITEM_AUDIO_PROFILE.TITLE',
    type: TabType.item,
    component: ItemAudioProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.INTERACTIVE_OBJECT_PROFILE,
    icon: 'interactive_object_profile.png',
    title: 'INTERACTIVE_OBJECT_PROFILE.TITLE',
    type: TabType.server,
    component: InteractiveObjectProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.PET_PROFILE,
    icon: 'pet_profile.png',
    title: 'PET_PROFILE.TITLE',
    type: TabType.mob,
    component: PetProfileComponent,
    locked: false,
  },
  {
    id: TabTypes.PVP_RANKS,
    icon: 'pet_profile.png',
    title: 'PVP_RANKS.TITLE2',
    type: TabType.character,
    component: PvpRanksComponent,
    locked: false,
  },
];
