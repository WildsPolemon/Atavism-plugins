import {DropdownValue} from '../../models/configRow.interface';

export interface AchievementBonus {
  achievement_id: number;
  bonus_settings_id: number;
  value: number;
  valuep: number;
}
export interface AchievementStats {
  achievement_id: number;
  stat: string;
  value: number;
  valuep: number;
}
export interface AchievementSettings {
  id?: number;
  type: number;
  value: number;
  name: string;
  description: string;
  objects: string[] | string | number[] | number;
  isactive: boolean;
  bonus_settings_id?: string | string[];
  stat?: string | string[];
  bonus_settings?: AchievementBonus[];
  stats?: AchievementStats[];
}
export enum AchievementTypesEnum {
  Kill = 1,
  Experience = 2,
  Harvesting = 3,
  Crafting = 4,
  Looting = 5,
  UseAbility = 6,
  FinalBlow = 7,
  GearScore = 8,
}
export const AchievementTypes: DropdownValue[] = [
  {id: AchievementTypesEnum.Kill, value: 'Kill'},
  {id: AchievementTypesEnum.Experience, value: 'Experience'},
  {id: AchievementTypesEnum.Harvesting, value: 'Harvesting'},
  {id: AchievementTypesEnum.Crafting, value: 'Crafting'},
  {id: AchievementTypesEnum.Looting, value: 'Looting'},
  {id: AchievementTypesEnum.UseAbility, value: 'Use Ability'},
  {id: AchievementTypesEnum.FinalBlow, value: 'Final Blow'},
  {id: AchievementTypesEnum.GearScore, value: 'Gear Score'},
];
