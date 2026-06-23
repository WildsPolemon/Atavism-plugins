import {DataBaseType} from '../settings/profiles/profile';
import {
  abilitiesTable, abilitiesTriggersProfileTable,
  achivementSettingsTable,
  auctionProfileTable,
  bonusesSettingsTable,
  buildObjectTable,
  coordinatedEffectsTable,
  craftingRecipesTable,
  currenciesTable,
  damageTable,
  dialogueTable,
  effectsTable,
  effectsTriggersTable,
  enchantProfileTable,
  factionsTable,
  instanceTemplateTable, interactiveObjectProfileTable, itemAudioProfileTable,
  itemTemplatesTable,
  levelXpRequirementsRewardTemplatesTable,
  levelXpRequirementsTemplatesTable,
  lootTablesTable,
  merchantTable,
  mobBehaviorProfileTable,
  mobTemplateTable,
  petProfileTable,
  questsTable,
  resourceNodeProfileTable,
  skillProfileTable,
  skillsTable,
  slotsGroupTable, slotsProfileTable,
  slotsTable,
  spawnDataTable, statProfileTable,
  statsTable,
  taskTable, weaponTemplatesProfileTable,
  weatherProfilesTable,
} from './tables.data';

export const questFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: questsTable,
  options: {where: {isactive: 1}},
};
export const itemFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: itemTemplatesTable,
  options: {where: {isactive: 1}},
};
export const abilityFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: abilitiesTable,
  options: {where: {isactive: 1}},
};
export const dialogueFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: dialogueTable,
  options: {where: {isactive: 1}},
};
export const factionFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: factionsTable,
  options: {where: {isactive: 1}},
};
export const skillFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: skillsTable,
  options: {where: {isactive: 1}},
};
export const effectFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: effectsTable,
  options: {where: {isactive: 1}},
};
export const coordFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: coordinatedEffectsTable,
  options: {where: {isactive: 1}},
};
export const vitalityStatFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1, type: 2}},
};
export const currencyFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: currenciesTable,
  options: {where: {isactive: 1}},
};
export const enchantFieldConfig = {
  idField: 'id',
  valueField: 'Name',
  profile: DataBaseType.world_content,
  table: enchantProfileTable,
  options: {where: {isactive: 1}},
};
export const statFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1}},
};
export const statProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statProfileTable,
  options: {where: {isactive: 1}},
};
export const statIdFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1}},
};
export const statBaseFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1, type: 0}},
};
export const passiveAbilityFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: abilitiesTable,
  options: {where: {isactive: 1, passive: 1}},
};
export const passiveEffectFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: effectsTable,
  options: {where: {isactive: 1, passive: 1}},
};
export const boFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: buildObjectTable,
  options: {where: {isactive: 1}},
};
export const craftingRecipesFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: craftingRecipesTable,
  options: {where: {isactive: 1}},
};
export const bonusSettingsFieldConfig = {
  idField: 'code',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: bonusesSettingsTable,
  options: {where: {isactive: 1}},
};
export const bonusSettingsIdFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: bonusesSettingsTable,
  options: {where: {isactive: 1}},
};
export const achievementFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: achivementSettingsTable,
  options: {where: {isactive: 1}},
};
export const mobsFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: mobTemplateTable,
  options: {where: {isactive: 1}},
};
export const instanceFieldConfig = {
  idField: 'id',
  valueField: 'island_name',
  profile: DataBaseType.admin,
  table: instanceTemplateTable,
  options: {where: {islandType: 4}},
};
export const instanceAllFieldConfig = {
  idField: 'id',
  valueField: 'island_name',
  profile: DataBaseType.admin,
  table: instanceTemplateTable,
  options: {},
};
export const lootTableFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: lootTablesTable,
  options: {where: {isactive: 1}},
};
export const mobSpawnFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: spawnDataTable,
  options: {where: {isactive: 1, 'instance IS NULL': 'where_null_using'}},
};
export const weatherProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: weatherProfilesTable,
  options: {where: {isactive: 1}},
};
export const skillProfileFieldConfig = {
  idField: 'id',
  valueField: 'profile_name',
  profile: DataBaseType.world_content,
  table: skillProfileTable,
  options: {where: {isactive: 1}},
};
export const skillProfileFieldConfig_0 = {
  idField: 'id',
  valueField: 'profile_name',
  profile: DataBaseType.world_content,
  table: skillProfileTable,
  options: {where: {isactive: 1, type: 0}},
};
export const skillProfileFieldConfig_1 = {
  idField: 'id',
  valueField: 'profile_name',
  profile: DataBaseType.world_content,
  table: skillProfileTable,
  options: {where: {isactive: 1, type: 1}},
};
export const skillProfileFieldConfig_2 = {
  idField: 'id',
  valueField: 'profile_name',
  profile: DataBaseType.world_content,
  table: skillProfileTable,
  options: {where: {isactive: 1, type: 2}},
};
export const taskFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: taskTable,
  options: {where: {isactive: 1}},
};
export const toggleAbilityFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: abilitiesTable,
  options: {where: {isactive: 1, toggle: 1}},
};
export const merchantFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: merchantTable,
  options: {where: {isactive: 1}},
};

export const weaponItemFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: itemTemplatesTable,
  options: {where: {isactive: 1, itemType: 'Weapon'}},
};
export const triggerProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: effectsTriggersTable,
  options: {where: {isactive: 1}},
};

export const damageFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: damageTable,
  options: {where: {isactive: 1}},
};
export const behaviorProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: mobBehaviorProfileTable,
  options: {where: {isactive: 1}},
};
export const abilityTagsFieldConfig = {
  isOption: true,
  optionKey: 'Ability Tags',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const effectTagsFieldConfig = {
  isOption: true,
  optionKey: 'Effects Tags',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const raceFieldConfig = {
  isOption: true,
  optionKey: 'Race',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const classFieldConfig = {
  isOption: true,
  optionKey: 'Class',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const slotsSetsFieldConfig = {
  isOption: true,
  optionKey: 'Slots Sets',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};

export const statFunctionsFieldConfig = {
  isOption: true,
  optionKey: 'Stat Functions',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const gameSettingsCategoryFieldConfig = {
  isOption: true,
  optionKey: 'Game Settings Category',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const statShiftActionFieldConfig = {
  isOption: true,
  optionKey: 'Stat Shift Action',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const questObjectiveTypeFieldConfig = {
  isOption: true,
  optionKey: 'Quest Objective Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const requirementsFieldConfig = {
  isOption: true,
  optionKey: 'Requirement',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const speciesFieldConfig = {
  isOption: true,
  optionKey: 'Species',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const mobTypeFieldConfig = {
  isOption: true,
  optionKey: 'Mob Type',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const weaponTypeFieldConfig = {
  isOption: true,
  optionKey: 'Weapon Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const weaponTypeIdFieldConfig = {
  isOption: true,
  optionKey: 'Weapon Type',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const toolTypeFieldConfig = {
  isOption: true,
  optionKey: 'Tool Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const armorTypeFieldConfig = {
  isOption: true,
  optionKey: 'Armor Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const stateFieldConfig = {
  isOption: true,
  optionKey: 'State',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const currencyGroupFieldConfig = {
  isOption: true,
  optionKey: 'Currency Group',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const craftingStationFieldConfig = {
  isOption: true,
  optionKey: 'Crafting Station',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const buildingCategoryFieldConfig = {
  isOption: true,
  optionKey: 'Building Category',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const claimObjectInteractionTypeFieldConfig = {
  isOption: true,
  optionKey: 'Claim Object Interaction Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const targetTypeFieldConfig = {
  isOption: true,
  optionKey: 'Target Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const targetSubTypeFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const targetTypeSingleAoEFieldConfig = {
  isOption: true,
  optionKey: 'Target Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice NOT LIKE 'Location' AND choice NOT LIKE 'Group'": 'where_null_using'}},
};
export const targetTypeNotGroupFieldConfig = {
  isOption: true,
  optionKey: 'Target Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice NOT LIKE '%group%'": 'where_null_using'}},
};
export const targetSubTypeNotEnemyFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice NOT LIKE '%enemy%'": 'where_null_using'}},
};
export const targetSubTypeOnlyEnemyFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice LIKE '%enemy%'": 'where_null_using'}},
};

export const targetSubTypeFriendEnemyFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice NOT LIKE '%Self%'": 'where_null_using'}},
};
export const targetSubTypeOnlySelfFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice LIKE 'Self'": 'where_null_using'}},
};
export const targetSubTypeOnlyFriendlyFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice LIKE 'Friendly'": 'where_null_using'}},
};
export const targetSubTypeOnlyFriendlySelfFieldConfig = {
  isOption: true,
  optionKey: 'Target Sub Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice LIKE 'Friendly' OR choice LIKE '%Self%'": 'where_null_using'}},
};
export const socketTypeFieldConfig = {
  isOption: true,
  optionKey: 'Sockets Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const socketType2FieldConfig = {
  isOption: true,
  optionKey: 'Sockets Type',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const itemEffectTypeFieldConfig = {
  isOption: true,
  optionKey: 'Item Effect Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const itemTypeFieldConfig = {
  isOption: true,
  optionKey: 'Item Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const itemTypeField2Config = {
  isOption: true,
  optionKey: 'Item Type',
  optionNameAsId: true,
  options: {where: {isactive: 1, "choice NOT LIKE '%Weapon%' AND choice NOT LIKE '%Armor%'": 'where_null_using'}},
};

export const weaponProfileActionsConfig = {
  isOption: true,
  optionKey: 'Weapon Actions',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const ammoTypeFieldConfig = {
  isOption: true,
  optionKey: 'Ammo Type',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const itemQualityFieldConfig = {
  isOption: true,
  optionKey: 'Item Quality',
  optionNameAsId: false,
  optionIdAsI: true,
  options: {where: {isactive: 1}},
};
export const buildObjectCategoryFieldConfig = {
  isOption: true,
  optionKey: 'Claim Object Category',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const claimTypeFieldConfig = {
  isOption: true,
  optionKey: 'Claim Type',
  optionNameAsId: false,
  options: {where: {isactive: 1}},
};
export const auctionHouseProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: auctionProfileTable,
  options: {where: {isactive: 1}},
};
export const itemSlotTypeFieldConfig = {
  isOption: true,
  optionKey: 'Item Slot Type',
  options: {where: {isactive: 1}},
};
export const genderFieldConfig = {
  isOption: true,
  optionKey: 'Gender',
  options: {where: {isactive: 1}},
};
export const slotsFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: slotsTable,
  options: {where: {isactive: 1}},
};
export const weaponSlotsFieldConfig = {
  idField: 'name',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: slotsTable,
  options: {where: {isactive: 1}},
  // options: {where: {isactive: 1, "type like '%415%'": 'where_null_using'}},
};
export const slotGroupsFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: slotsGroupTable,
  options: {where: {isactive: 1}},
};
export const resourceNodeProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: resourceNodeProfileTable,
  options: {where: {isactive: 1}},
};
export const mobTagsFieldConfig = {
  isOption: true,
  optionKey: 'Mob Tags',
  options: {where: {isactive: 1}},
};
export const levelXpRewardsProfileFieldConfig = {
  idField: 'reward_template_id',
  valueField: 'reward_template_name',
  profile: DataBaseType.world_content,
  table: levelXpRequirementsRewardTemplatesTable,
  options: {where: {isactive: 1}},
};
export const levelXpProfileFieldConfig = {
  idField: 'xpProfile',
  valueField: 'xpProfile_name',
  profile: DataBaseType.world_content,
  table: levelXpRequirementsTemplatesTable,
  options: {where: {isactive: 1}},
};
export const abilityTriggerFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: abilitiesTriggersProfileTable,
  options: {where: {isactive: 1}},
};
export const weaponProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: weaponTemplatesProfileTable,
  options: {where: {isactive: 1}},
};
export const itemAudioProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: itemAudioProfileTable,
  options: {where: {isactive: 1}},
};

export const interactiveObjectInteractionTypeFieldConfig = {
  isOption: true,
  optionKey: 'Interaction Type',
  optionNameAsId: true,
  options: {where: {isactive: 1}},
};
export const interactiveObjectProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: interactiveObjectProfileTable,
  options: {where: {isactive: 1, instance: -1}},
};
export const petProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: petProfileTable,
  options: {where: {isactive: 1}},
};
export const petCountStatFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1, type: 5}},
};
export const petGlobalCountStatFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: statsTable,
  options: {where: {isactive: 1, type: 6}},
};
export const slotsProfileFieldConfig = {
  idField: 'id',
  valueField: 'name',
  profile: DataBaseType.world_content,
  table: slotsProfileTable,
  options: {where: {isactive: 1}},
};
