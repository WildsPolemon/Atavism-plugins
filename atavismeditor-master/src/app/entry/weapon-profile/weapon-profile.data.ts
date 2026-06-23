export interface ActionSetting {
  id?: number;
  profile_id: number;
  action_id: number;
  slot: string;
  action_type?: number;
  ability_id: number;
  coordeffect: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface WeaponProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  actionSettings?: ActionSetting[];
}
