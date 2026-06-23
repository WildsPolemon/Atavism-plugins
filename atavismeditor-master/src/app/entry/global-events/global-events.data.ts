export interface GlobalEvent {
  id?: number;
  name: string;
  description: string;
  start_year: number;
  start_month: number;
  start_day: number;
  start_hour: number;
  start_minute: number;
  end_year: number;
  end_month: number;
  end_day: number;
  end_hour: number;
  end_minute: number;
  icon: string;
  icon2: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  bonuses?: GlobalEventBonus[];
}

export interface GlobalEventBonus {
  id?: number;
  global_event_id: number;
  bonus_settings_id: number;
  value: number;
  valuep: number;
}
