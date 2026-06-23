export interface PetLevelSetting {
  id?: number;
  level: number;
  profile_id: number;
  template_id: number;
  coordEffect: string;
  slot_profile_id: number;
  exp: number;
}

export interface PetProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  petLevelSettings?: PetLevelSetting[];
}
