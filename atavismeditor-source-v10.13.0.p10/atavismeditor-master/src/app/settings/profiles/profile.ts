export enum DataBaseType {
  admin = 'admin',
  atavism = 'atavism',
  master = 'master',
  world_content = 'world_content',
}
export enum ProfileType {
  Unity = 'Unity',
  Unreal = 'Unreal',
}
export const dataBase = [
  DataBaseType.admin,
  DataBaseType.atavism,
  DataBaseType.master,
  DataBaseType.world_content,
] as const;
export interface DataBaseProfile {
  type: DataBaseType;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export enum AddButtonPosition {
  left = 'left',
  right = 'right',
}

export interface Profile {
  id: string;
  profileId?: string;
  name: string;
  type: ProfileType;
  folder: string;
  mobFolder: string;
  itemFolder: string;
  buildObjectFolder: string;
  coordFolder: string;
  syncFolder: string;
  defaultImage: string;
  meta: string;
  limit: number;
  iconsToShow: number;
  delay: number;
  notificationDelay: number;
  image_width: number;
  image_height: number;
  databases: DataBaseProfile[];
  lastUsed: string;
  lastUsedVersion: string;
  buttonPosition: AddButtonPosition;
  defaultIsActiveFilter: string;
  created: string;
  updated: string;
  deleted: boolean;
  notFound: boolean;
}
export enum FormType {
  edit = 'edit',
  new = 'new',
  duplicate = 'duplicate',
}
