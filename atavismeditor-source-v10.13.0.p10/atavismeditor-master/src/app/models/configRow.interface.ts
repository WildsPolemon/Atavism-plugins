import {QueryParams, TypeMap} from './configs';
import {DataBaseType} from '../settings/profiles/profile';

export enum ConfigTypes {
  numberType = 'numberType',
  stringType = 'stringType',
  dropdown = 'dropdown',
  booleanType = 'booleanType',
  date = 'date',
  hidden = 'hidden',
  icon = 'icon',
  iconBase64 = 'iconBase64',
  isActiveType = 'isActiveType',
}

export enum FilterTypes {
  dropdown = 'dropdown',
  dynamicDropdown = 'dynamicDropdown',
  booleanType = 'booleanType',
  date = 'date',
  integer = 'integer',
  decimal = 'decimal',
}

export interface DynamicDropdownFieldConfig {
  idField?: string;
  valueField?: string;
  profile?: DataBaseType;
  table?: string;
  isData?: boolean;
  data?: DropdownValue[];
  isOption?: boolean;
  optionKey?: string;
  optionNameAsId?: boolean;
  optionIdAsI?: boolean;
  options?: QueryParams;
}

export interface ConfigRow {
  type: ConfigTypes;
  visible: boolean;
  alwaysVisible?: boolean;
  useAsSearch?: boolean;
  filterVisible?: boolean;
  iconFolder?: string;
  disableSort?: boolean;
  fieldConfig?: DynamicDropdownFieldConfig;
  filterType?: FilterTypes;
  data?: DropdownValue[];
  textAlign?: 'left' | 'center' | 'right';
  overrideValue?: any;
  relatedFieldData?: TypeMap<string, DynamicDropdownFieldConfig | DropdownValue[] | null>;
  relatedField?: string;
}

export interface DropdownValue {
  id: number | string;
  value: string;
  passive?: boolean;
  disabled?: boolean;
}

export interface CustomFormField {
  value?: string | number | boolean;
  min?: number;
  minNotEqual?: number;
  max?: number;
  required?: boolean;
  isArray?: boolean;
  allowMinusOne?: boolean;
}

export type SubFieldType = Record<string, CustomFormField>;

export interface SkillProfileDropValue extends DropdownValue {
  type: number;
}

export enum Operators {
  equal = '=',
  less = '<',
  more = '>',
  less_equal = '<=',
  more_equal = '>=',
}

export const operators = [
  {id: Operators.equal, value: '='},
  {id: Operators.less, value: '<'},
  {id: Operators.more, value: '>'},
  {id: Operators.less_equal, value: '<='},
  {id: Operators.more_equal, value: '>='},
];
