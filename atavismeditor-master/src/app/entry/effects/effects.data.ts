export interface Effect {
  id: number;
  name: string;
  displayName: string;
  icon: string;
  icon2: string;
  effectMainType: string;
  effectType: string;
  isBuff: boolean;
  skillType: number;
  skillLevelMod: number;
  passive: boolean;
  stackLimit: number;
  stackTime: boolean;
  allowMultiple: boolean;
  duration: number;
  pulseCount: number;
  tooltip: string;
  bonusEffectReq: number;
  bonusEffectReqConsumed: boolean;
  bonusEffect: number;
  removeBonusWhenEffectRemoved: boolean;
  pulseCoordEffect: string;
  chance: number;
  intValue1: number;
  intValue2: number;
  intValue3: number;
  intValue4: number;
  intValue5: number;
  floatValue1: number;
  floatValue2: number;
  floatValue3: number;
  floatValue4: number;
  floatValue5: number;
  stringValue1: string;
  stringValue2: string;
  stringValue3: string;
  stringValue4: string;
  stringValue5: string;
  boolValue1: boolean;
  boolValue2: boolean;
  boolValue3: boolean;
  boolValue4: boolean;
  boolValue5: boolean;
  interruption_chance: number;
  interruption_chance_max: number;
  interruption_all: boolean;
  group_tags: string | string[];
  show_effect: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export enum EffectType {
  Damage = 'Damage',
  Restore = 'Restore',
  Revive = 'Revive',
  Stat = 'Stat',
  Stun = 'Stun',
  Sleep = 'Sleep',
  Immune = 'Immune',
  Morph = 'Morph',
  Dispel = 'Dispel',
  Teleport = 'Teleport',
  Mount = 'Mount',
  BuildObject = 'Build Object',
  TeachAbility = 'Teach Ability',
  TeachSkill = 'Teach Skill',
  Task = 'Task',
  State = 'State',
  Threat = 'Threat',
  CreateItem = 'CreateItem',
  CreateItemFromLoot = 'CreateItemFromLoot',
  Spawn = 'Spawn',
  SetRespawnLocation = 'Set Respawn Location',
  Vip = 'Vip',
  Bonuses = 'Bonus',
  Trap = 'Trap',
  Stealth = 'Stealth',
  Trigger = 'Trigger',
  Shield = 'Shield',
  ChangeClass = 'ChangeClass',
  UnlearnAbility = 'Unlearn Ability',
  SpawnInteractiveObject = 'SpawnInteractiveObject',
  Experience = 'Experience',
  SkillExperience = 'SkillExperience',
  Faction = 'Faction',
  ChangeFaction = 'ChangeFaction',
}
export const effectDefaults: Effect = {
  effectType: '',
  isBuff: false,
  skillType: -1,
  skillLevelMod: 0,
  passive: false,
  stackLimit: 1,
  stackTime: false,
  allowMultiple: false,
  duration: 0,
  pulseCount: 1,
  tooltip: '',
  bonusEffectReq: 0,
  bonusEffectReqConsumed: false,
  bonusEffect: -1,
  removeBonusWhenEffectRemoved: false,
  pulseCoordEffect: '',
  chance: 0,
  intValue1: 0,
  intValue2: 0,
  intValue3: 0,
  intValue4: 0,
  intValue5: 0,
  floatValue1: 0,
  floatValue2: 0,
  floatValue3: 0,
  floatValue4: 0,
  floatValue5: 0,
  stringValue1: '',
  stringValue2: '',
  stringValue3: '',
  stringValue4: '',
  stringValue5: '',
  boolValue1: false,
  boolValue2: false,
  boolValue3: false,
  boolValue4: false,
  boolValue5: false,
  isactive: false,
  id: 0,
  name: '',
  displayName: '',
  icon: '',
  effectMainType: '',
  icon2: '',
  group_tags: '',
  interruption_chance: 0,
  interruption_chance_max: 0,
  interruption_all: false,
  show_effect: false,
  creationtimestamp: '',
  updatetimestamp: '',
};

export const effectFields = [
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
  'floatValue1',
  'floatValue2',
  'floatValue3',
  'floatValue4',
  'floatValue5',
  'boolValue1',
  'boolValue2',
  'boolValue3',
  'boolValue4',
  'boolValue5',
  'skillType',
  'skillLevelMod',
  'stackLimit',
  'stackTime',
  'allowMultiple',
  'duration',
  'pulseCount',
  'pulseCoordEffect',
  'tooltip',
  'title1',
  'bonusEffectReq',
  'bonusEffect',
  'bonusEffectReqConsumed',
  'removeBonusWhenEffectRemoved',
  'isBuff',
  'show_effect',
  'passive',
];
