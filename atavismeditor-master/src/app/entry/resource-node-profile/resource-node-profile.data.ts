export interface ResourceNodeProfile {
  id?: number;
  name: string;
  spawnPercentage: number;
  spawnPecentageMax: number;
  maxHarvestDistance: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  subs?: ResourceNodeSubProfile[];
}

export interface ResourceNodeSubProfile {
  id?: number;
  profileId: number;
  priority: number;
  priorityMax: number;
  skill: number;
  skillLevel: number;
  skillLevelMax: number;
  skillExp: number;
  weaponReq: string;
  equipped: boolean;
  gameObject: string;
  harvestCoordEffect: string;
  activateCoordeffect: string;
  deactivateCoordeffect: string;
  respawnTime: number;
  respawnTimeMax: number;
  harvestCount: number;
  harvestTimeReq: number;
  cooldown: number;
  deactivationDelay: number;
  cursorIcon: string;
  cursorIcon2: string;
  selectedIcon: string;
  selectedIcon2: string;
  creationtimestamp: string;
  updatetimestamp: string;
  drops?: ResourceDrop[];
}

export interface ResourceDrop {
  id?: number;
  resourceSubProfileId: number;
  item: number;
  min: number;
  max: number;
  chance: number;
  chanceMax: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
