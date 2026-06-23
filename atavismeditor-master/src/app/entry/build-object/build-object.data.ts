export interface BuildObject {
  id?: number;
  name: string;
  icon: string;
  icon2: string;
  category: number;
  skill: number;
  skillLevelReq: number;
  weaponReq: string;
  distanceReq: number;
  buildTaskReqPlayer: boolean;
  validClaimType: string | string[];
  firstStageID: number;
  availableFromItemOnly: boolean;
  lockable: boolean;
  lockLimit: number;
  buildSolo: boolean;
  fixedTime: boolean;
  claim_object_category: number;
  attackable: boolean;
  repairable: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  buildTimeReq?: string[] | string;
  stages?: BuildObjectStage[];
}

export interface BuildObjectStage {
  id?: number;
  gameObject: string;
  nextStage: number;
  buildTimeReq: number;
  repairTimeReq: number;
  interactionType: string;
  interactionID: number;
  interactionIDChest?: number;
  interactionData1: string;
  health: number;
  lootTable: number;
  lootMinPercentage: number;
  lootMaxPercentage: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  items?: BuildObjectStageItems[];
  progresses?: BuildObjectStageProgress[];
  damages?: BuildObjectStageDamaged[];
}

export interface BuildObjectStageItems {
  id?: number;
  stage_id?: number;
  item: number;
  count: number;
}

export interface BuildObjectStageProgress {
  id?: number;
  stage_id?: number;
  progress: number;
  prefab: string;
  trimesh: string;
}

export interface BuildObjectStageDamaged {
  id?: number;
  stage_id?: number;
  progress: number;
  prefab: string;
}

export enum InteractionTypes {
  Chest = 'Chest',
  Resource = 'Resource',
  NPC = 'NPC',
  Effect = 'Effect',
  Instance = 'Instance',
  LeaveInstance = 'LeaveInstance',
}

export const defaultValues = {
  category: 0,
  skill: 0,
  skillLevelReq: 0,
  weaponReq: '',
  distanceReq: 1,
  buildTaskReqPlayer: true,
  firstStageID: 0,
  availableFromItemOnly: false,
  lockable: false,
  lockLimit: true,
  isactive: true,
  validClaimType: '',
  buildSolo: false,
  fixedTime: false,
  claim_object_category: -1,
  attackable: false,
  repairable: false,
};
