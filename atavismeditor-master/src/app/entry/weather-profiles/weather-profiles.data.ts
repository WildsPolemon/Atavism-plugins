export interface WeatherProfile {
  id: number;
  name: string;
  temperature_min: number;
  temperature_max: number;
  humidity_min: number;
  humidity_max: number;
  wind_direction_min: number;
  wind_direction_max: number;
  wind_speed_min: number;
  wind_speed_max: number;
  wind_turbulence_min: number;
  wind_turbulence_max: number;
  fog_height_power_min: number;
  fog_height_power_max: number;
  fog_height_max: number;
  fog_distance_power_min: number;
  fog_distance_power_max: number;
  fog_distance_max: number;
  rain_power_min: number;
  rain_power_max: number;
  rain_power_terrain_min: number;
  rain_power_terrain_max: number;
  rain_min_height: number;
  rain_max_height: number;
  hail_power_min: number;
  hail_power_max: number;
  hail_power_terrain_min: number;
  hail_power_terrain_max: number;
  hail_min_height: number;
  hail_max_height: number;
  snow_power_min: number;
  snow_power_max: number;
  snow_power_terrain_min: number;
  snow_power_terrain_max: number;
  snow_min_height: number;
  snow_age_min: number;
  snow_age_max: number;
  thunder_power_min: number;
  thunder_power_max: number;
  cloud_power_min: number;
  cloud_power_max: number;
  cloud_min_height: number;
  cloud_max_height: number;
  cloud_speed_min: number;
  cloud_speed_max: number;
  moon_phase_min: number;
  moon_phase_max: number;
  priority: number;
  isactive: boolean;
}

export const fields: string[] = [
  'id',
  'name',
  'temperature_min',
  'temperature_max',
  'humidity_min',
  'humidity_max',
  'wind_direction_min',
  'wind_direction_max',
  'wind_speed_min',
  'wind_speed_max',
  'wind_turbulence_min',
  'wind_turbulence_max',
  'fog_height_power_min',
  'fog_height_power_max',
  'fog_height_max',
  'fog_distance_max',
  'fog_distance_power_min',
  'fog_distance_power_max',
  'rain_power_min',
  'rain_power_max',
  'rain_power_terrain_min',
  'rain_power_terrain_max',
  'rain_min_height',
  'rain_max_height',
  'hail_power_min',
  'hail_power_max',
  'hail_power_terrain_min',
  'hail_power_terrain_max',
  'hail_min_height',
  'hail_max_height',
  'snow_power_min',
  'snow_power_max',
  'snow_power_terrain_min',
  'snow_power_terrain_max',
  'snow_age_min',
  'snow_age_max',
  'snow_min_height',
  'thunder_power_min',
  'thunder_power_max',
  'cloud_power_min',
  'cloud_power_max',
  'cloud_min_height',
  'cloud_max_height',
  'cloud_speed_min',
  'cloud_speed_max',
  'moon_phase_min',
  'moon_phase_max',
];
export const defaultValues = {
  temperature_max: 0,
  humidity_max: 0,
  wind_direction_max: 0,
  temperature_min: 0,
  humidity_min: 0,
  wind_direction_min: 0,
  wind_speed_min: 0,
  wind_speed_max: 0,
  wind_turbulence_min: 0,
  wind_turbulence_max: 0,
  fog_height_power_min: 0,
  fog_height_power_max: 0,
  fog_height_max: 0,
  fog_distance_power_min: 0,
  fog_distance_power_max: 0,
  fog_distance_max: 0,
  rain_power_min: 0,
  rain_power_max: 0,
  rain_power_terrain_min: 0,
  rain_power_terrain_max: 0,
  rain_min_height: 0,
  rain_max_height: 0,
  hail_power_min: 0,
  hail_power_max: 0,
  hail_power_terrain_min: 0,
  hail_power_terrain_max: 0,
  hail_min_height: 0,
  hail_max_height: 0,
  snow_power_min: 0,
  snow_power_max: 0,
  snow_power_terrain_min: 0,
  snow_power_terrain_max: 0,
  snow_min_height: 0,
  snow_age_min: 0,
  snow_age_max: 0,
  thunder_power_min: 0,
  thunder_power_max: 0,
  cloud_power_min: 0,
  cloud_power_max: 0,
  cloud_min_height: 0,
  cloud_max_height: 0,
  cloud_speed_min: 0,
  cloud_speed_max: 0,
  moon_phase_min: 0,
  moon_phase_max: 0,
};
