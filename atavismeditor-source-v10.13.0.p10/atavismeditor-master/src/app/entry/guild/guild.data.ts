export interface GuildLevelSettings {
  id?: number;
  level: number;
  members_num: number;
  merchant_table: number;
  warehouse_num_slots: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  requirements?: GuildLevelRequirements[];
}

export interface GuildLevelRequirements {
  id?: number;
  level: number;
  item_id: number;
  count: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
