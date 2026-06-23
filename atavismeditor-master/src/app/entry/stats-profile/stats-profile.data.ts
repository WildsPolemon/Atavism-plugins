export interface StatSetting {
  id?: number;
  profile_id: number;
  stat_id: number;
  value: number;
  level_increase: number;
  level_percent_increase: number;
  serverPresent: boolean;
  send_to_client: boolean;
  override_values: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface StatsProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  statsSettings?: StatSetting[];
}
