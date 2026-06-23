export interface EffectsTriggers {
  id?: number;
  name: string;
  event_type: number;
  tags: string | string[];
  race: number;
  class: number;
  action_type: number;
  chance_min: number;
  chance_max: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  actions?: EffectsTriggersActions[];
  tags_ability?: string;
  tags_effect?: string;
}
export interface EffectsTriggersActions {
  id?: number;
  effects_triggers_id: number;
  target: number;
  ability: number;
  effect: number;
  mod_v: number;
  mod_p: number;
  chance_min: number;
  chance_max: number;
  action_type2?: subActionType;
}
export enum subActionType {
  ability = 0,
  effect = 1,
  modifier = 2,
}
export enum eventType {
  dodge = 0,
  miss = 1,
  damage = 2,
  heal = 3,
  critical = 4,
  kill = 5,
  parry = 6,
  sleep = 7,
  stun = 8,
}
