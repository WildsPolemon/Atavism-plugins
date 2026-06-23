export interface InstanceTemplate {
  id: number;
  island_name: string;
  template: string;
  administrator: number;
  category: number;
  status: string;
  public: number;
  password: string;
  rating: number;
  islandType: number;
  globalWaterHeight: number;
  createOnStartup: boolean;
  style: string;
  recommendedLevel: number;
  description: string;
  size: number;
  populationLimit: number;
  subscription: string;
  lastUpdate: string;
  dateCreated: string;
  weather_profiles?: string | string[];
  weather_seasons?: string | string[];
  markers?: IslandPortals[];
  weathers?: WeatherInstance[];
  seasons?: WeatherSeason[];
}

export interface IslandPortals {
  id?: number;
  island: number;
  portalType: number;
  faction: number;
  locX: number;
  locY: number;
  locZ: number;
  orientX: number;
  orientY: number;
  orientZ: number;
  orientW: number;
  displayID: number;
  name: string;
  gameObject: string;
}

export interface WeatherInstance {
  id?: number;
  instance_id: number;
  weather_profile_id: number;
  month1: boolean;
  month2: boolean;
  month3: boolean;
  month4: boolean;
  month5: boolean;
  month6: boolean;
  month7: boolean;
  month8: boolean;
  month9: boolean;
  month10: boolean;
  month11: boolean;
  month12: boolean;
  priority: number;
}

export interface WeatherSeason {
  id?: number;
  instance_id: number;
  season: number;
  month1: boolean;
  month2: boolean;
  month3: boolean;
  month4: boolean;
  month5: boolean;
  month6: boolean;
  month7: boolean;
  month8: boolean;
  month9: boolean;
  month10: boolean;
  month11: boolean;
  month12: boolean;
}

export enum IslandType {
  World = 0,
  Dungeon = 1,
  GroupDungeon = 2,
  PlayerInstance = 3,
  Arena = 4,
  Guild = 5,
}
