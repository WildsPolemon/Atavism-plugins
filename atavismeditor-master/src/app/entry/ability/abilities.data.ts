export interface Ability {
  id?: number;
  name: string;
  icon: string;
  icon2: string;
  abilityType: string;
  skill: number;
  passive: boolean;
  activationCost: number;
  activationCostType: string;
  activationLength: number;
  attack_time: number;
  activationAnimation: string;
  activationParticles: string;
  casterEffectRequired: number;
  casterEffectConsumed: boolean;
  targetEffectRequired: number;
  targetEffectConsumed: boolean;
  weaponRequired: string;
  reagentRequired: number;
  reagentCount: number;
  reagentConsumed: boolean;
  reagent2Required: number;
  reagent2Count: number;
  reagent2Consumed: boolean;
  reagent3Required: number;
  reagent3Count: number;
  reagent3Consumed: boolean;
  ammoUsed: number;
  maxRange: number;
  minRange: number;
  aoeRadius: number;
  aoeAngle: number;
  aoeType: string;
  reqTarget: boolean;
  reqFacingTarget: boolean;
  autoRotateToTarget: boolean;
  relativePositionReq: number;
  targetType: string;
  targetSubType: string;
  targetState: number;
  casterState: number;
  speciesTargetReq: string;
  specificTargetReq: string;
  globalCooldown: boolean;
  cooldown1Type: string;
  cooldown1Duration: number;
  weaponCooldown: boolean;
  startCooldownsOnActivation: boolean;
  activationEffect1: number;
  activationTarget1: string;
  activationEffect2: number;
  activationTarget2: string;
  activationEffect3: number;
  activationTarget3: string;
  activationEffect4: number;
  activationTarget4: string;
  activationEffect5: number;
  activationTarget5: string;
  activationEffect6: number;
  activationTarget6: string;
  coordEffect1event: string;
  coordEffect1: string;
  coordEffect2event: string;
  coordEffect2: string;
  coordEffect3event: string;
  coordEffect3: string;
  coordEffect4event: string;
  coordEffect4: string;
  coordEffect5event: string;
  coordEffect5: string;
  tooltip: string;
  interceptType: number;
  chance: number;
  castingInRun: boolean;
  exp: number;
  consumeOnActivation: boolean;
  channelling: boolean;
  channelling_cost: number;
  channelling_pulse_num: number;
  channelling_pulse_time: number;
  channelling_in_run: boolean;
  projectile: boolean;
  projectile_speed: number;
  activationDelay: number;
  pulseCost: number;
  pulseCostType: string;
  pulseCasterEffectRequired: number;
  pulseCasterEffectConsumed: boolean;
  pulseTargetEffectRequired: number;
  pulseTargetEffectConsumed: boolean;
  pulseReagentRequired: number;
  pulseReagentCount: number;
  pulseReagentConsumed: boolean;
  pulseReagent2Required: number;
  pulseReagent2Count: number;
  pulseReagent2Consumed: boolean;
  pulseReagent3Required: number;
  pulseReagent3Count: number;
  pulseReagent3Consumed: boolean;
  pulseAmmoUsed: number;
  skipChecks: boolean;
  activationCostPercentage: number;
  pulseCostPercentage: number;
  aoePrefab: string;
  stealth_reduce: boolean;
  interruptible: boolean;
  interruption_chance: number;
  toggle: boolean;
  tags: string | string[] | number[];
  tag_disable: number;
  tag_count: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  speed: number;
  chunk_length: number;
  prediction: number;
  aoe_target_count_type: number;
  aoe_target_count: number;
  attack_building: boolean;
  damageType: string;
  stealth_reduction_amount: number;
  stealth_reduction_percentage: number;
  stealth_reduction_timeout: number;
  skill_up_chance: number;
  miss_chance: number;
  tags_on_caster: string | string[] | number[];
  tags_on_target: string | string[] | number[];
  tags_not_on_caster: string | string[] | number[];
  tags_not_on_target: string | string[] | number[];
  pulse_tags_on_caster: string | string[] | number[];
  pulse_tags_on_target: string | string[] | number[];
  pulse_tags_not_on_caster: string | string[] | number[];
  pulse_tags_not_on_target: string | string[] | number[];
  is_child: boolean;
  line_of_sight: boolean;
  activationTarget: string | string[];
  activationEffect: string | string[];
  coordEffectEvent: string | string[];
  coordEffect: string | string[];
  combatState: number;
  checkBusy: boolean;
  makeBusy: boolean;
  enemyTargetChangeToSelf: boolean;
  weaponMustBeDrawn: boolean;
  drawnWeaponBefore: boolean;
  enterCombatState: boolean;
  combos?: AbilityCombo[];
  powerUpCoordEffect: string;
  pvp_enter: boolean;
  abilityPowers: AbilityPower[];
}

export interface AbilityTriggers {
  id?: number;
  ability_power_id: number;
  trigger_id: number;
}
export interface AbilityEffect {
  id?: number;
  ability_power_id: number;
  target: string;
  effect: number;
  delay: number;
  chance_min: number;
  chance_max: number;
}

export interface AbilityAbilities {
  id?: number;
  ability_power_id: number;
  target: string;
  ability: number;
  delay: number;
  chance_min: number;
  chance_max: number;
}

export interface AbilityCombo {
  id?: number;
  ability_parent_id?: number;
  ability_sub_id: number;
  chance_min: number;
  chance_max: number;
  show_in_center_ui: boolean;
  replace_in_slot: boolean;
  check_cooldown: boolean;
  time: number;
}

export interface AbilityPower {
  id?: number;
  ability_id?: number;
  thresholdMaxTime: number;
  coordEffects?: AbilityCoordEffect[];
  effects?: AbilityEffect[];
  abilities?: AbilityAbilities[];
  triggers?: AbilityTriggers[];
}

export interface AbilityCoordEffect {
  id?: number;
  ability_power_id?: number;
  coordEffectEvent: string;
  coordEffect: string;
}

export enum AbilityType {
  AttackAbility = 'AttackAbility',
  EffectAbility = 'EffectAbility',
  FriendlyEffectAbility = 'FriendlyEffectAbility',
}
export enum AoeTypes {
  PlayerRadius = 'PlayerRadius',
  TargetRadius = 'TargetRadius',
  LocationRadius = 'LocationRadius',
}
export enum TargetOption {
  target = 'target',
  caster = 'caster',
}
export enum CoordEffectOption {
  activating = 'activating',
  activated = 'activated',
  channelling = 'channelling',
  completed = 'completed',
  interrupted = 'interrupted',
  failed = 'failed',
  ability_pulse = 'ability_pulse',
}
export enum PredictionOption {
  realtime = 0,
  predicted = 1,
}
export enum TargetCountTypeOption {
  unlimited = 0,
  first = 1,
  random = 2,
}
