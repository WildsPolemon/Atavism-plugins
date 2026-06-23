export interface MobBehaviorProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  mobBehavior?: MobBehavior[];
}

export interface MobBehavior {
  id?: number;
  profile_id: number;
  behavior_order: number;
  type: number;
  flee_type: number;
  ability_interval: number;
  mob_tag: number;
  ignore_chase_distance: boolean;
  weapon: number;
  creationtimestamp: string;
  updatetimestamp: string;
  behaviorConditionsGroup?: BehaviorConditionsGroup[];
  mobAbility?: { abilityGroups: MobAbility[] };
  mobAbilityStart?: { abilityGroups: MobAbility[] }
  mobAbilityEnd?: { abilityGroups: MobAbility[] }
  pointsGroup?: MobBehaviorPoints[];
}

export interface MobBehaviorPoints {
  id?: number;
  behavior_id: number;
  loc_x: number;
  loc_y: number;
  loc_z: number;
}

export interface BehaviorConditionsGroup {
  id?: number;
  group_order: number;
  behavior_id: number;
  creationtimestamp: string;
  updatetimestamp: string;
  behaviorConditions?: BehaviorConditions[];
}

export interface BehaviorConditions {
  id?: number;
  conditions_group_id: number;
  type: number;
  distance: number;
  less: boolean;
  stat_name: string;
  stat_value: number;
  stat_vitality_percentage: boolean;
  target: number;
  effect_tag_id: number;
  on_target: boolean;
  combat_state: boolean;
  death_state: boolean;
  trigger_event_Id: number;
  target_number: number;
  target_ally: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface MobAbility {
  id?: number;
  mob_ability_order: number;
  behavior_id: number;
  abilities: string;
  minAbilityRangePercentage: number;
  maxAbilityRangePercentage: number;
  mob_ability_type: number;
  creationtimestamp: string;
  updatetimestamp: string;
  abilityConditionGroups?: MobAbilityConditionsGroup[];
}

export interface MobAbilityConditionsGroup {
  id?: number;
  group_order: number;
  mob_ability_id: number;
  creationtimestamp: string;
  updatetimestamp: string;
  abilityConditions?: MobAbilityConditions[];
}

export interface MobAbilityConditions {
  id?: number;
  conditions_group_id: number;
  type: number;
  distance: number;
  less: boolean;
  stat_name: string;
  stat_value: number;
  stat_vitality_percentage: boolean;
  target: number;
  effect_tag_id: number;
  on_target: boolean;
  combat_state: boolean;
  death_state: boolean;
  trigger_event_Id: number;
  target_number: number;
  target_ally: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export enum MobBehaviorType {
  Melee = 0,
  Offensive = 1,
  Defensive = 2,
  Defend = 3,
  Flee = 4,
  Heal = 5,
}

export enum FleeType {
  'Opposite direction' = 0,
  'Defined position' = 1,
  'To group friendly mobs' = 2,
}
