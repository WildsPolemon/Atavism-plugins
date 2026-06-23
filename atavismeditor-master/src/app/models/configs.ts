import {FormGroup} from '@angular/forms';
import {TabTypes} from './tabTypes.enum';
import {ConfigRow, DropdownValue, DynamicDropdownFieldConfig, Operators} from './configRow.interface';
import {TableAction} from './actions.interface';
import {SortDirection} from '@angular/material/sort';

export enum DialogConfig {
  smallDialogOverlay = 'small-dialog-overlay',
  normalDialogOverlay = 'normal-dialog-overlay',
  fullDialogOverlay = 'full-dialog-overlay',
  profileDialogOverlay = 'profile-dialog-overlay',
  confirmDialogOverlay = 'confirm-dialog-overlay',
}

// @ts-ignore
export type TypeMap<T, V> = {[key in T]: V} & {[key: string]: V};

export enum FormFieldType {
  hidden = 'hidden',
  input = 'input',
  dropdown = 'dropdown',
  // eslint-disable-next-line id-blacklist
  boolean = 'boolean',
  textarea = 'textarea',
  integer = 'integer',
  decimal = 'decimal',
  title = 'title',
  file = 'file',
  filePicker = 'filePicker',
  dynamicDropdown = 'dynamicDropdown',
  fillDateTimePicker = 'fillDateTimePicker',
  folderSelector = 'folderSelector',
  colorPicker = 'colorPicker',

}

export interface TooltipPart {
  type: 'string' | 'link';
  text: string;
  link?: string;
}

export interface FormFieldConfig {
  name: string;
  type: FormFieldType;
  order?: number;
  label?: string;
  tooltip?: string;
  error?: string;
  data?: DropdownValue[];
  length?: number | string;
  require?: boolean;
  hideNone?: boolean;
  hidden?: hiddenField;
  disabled?: boolean;
  allowNew?: boolean;
  width?: number;
  multiple?: boolean;
  search?: boolean;
  relatedField?: string;
  relatedFieldData?: any;
  accept?: string;
  acceptTitle?: string;
  acceptFolder?: string;
  conditionName?: string;
  condition?: TypeMap<string, any>;
  fields?: Record<string, string>;
  fieldConfig?: DynamicDropdownFieldConfig;
}

export enum hiddenField {
  noAction = 0,
  hidden = 1,
  visible = 2,
}

export interface SubFormType {
  fields: TypeMap<string, FormFieldConfig>;
  subForms?: TypeMap<string, SubFormType>;
  title?: string;
  groupTitle?: string;
  numerate?: boolean;
  submit?: string;
  freezeFirst?: boolean;
  maxCount?: number;
  minCount?: number;
  columnWidth?: number;
  hiddenSubForm?: boolean;
  draggable?: boolean;
  hideRemoveButton?: boolean;
  countSubForms?: TypeMap<string, boolean>;
}

export interface FormConfig {
  type: TabTypes;
  title: string;
  tooltip?: string;
  submit?: string;
  cancel?: string;
  fields: TypeMap<string, FormFieldConfig>;
  orderFields?: boolean;
  subForms?: TypeMap<string, SubFormType>;
  dialogType?: DialogConfig;
  saveAsNew?: boolean;
}

export interface FormInputData {
  config: FormConfig;
  form: FormGroup;
  subForms: TypeMap<string, FormGroup>;
}

export enum DialogCloseType {
  update = 'update',
  save_as_new = 'save_as_new',
  cancel = 'cancel',
}

export interface Sorting {
  field: string;
  order: SortDirection;
}
export interface Listing {
  limit: number;
  page: number;
}

export interface WhereQuery {
  [name: string]: string | boolean | number;
}
export interface CompareQuery {
  [name: string]: {
    operator: Operators;
    value: string | boolean | number;
  };
}

export interface QueryParams {
  search?: string;
  where?: WhereQuery;
  orWhere?: WhereQuery;
  compare?: CompareQuery;
  orCompare?: CompareQuery;
  sort?: Sorting;
  limit?: Listing;
}

export type TableFields = {[key: string]: ConfigRow};

export interface TableConfig {
  type: TabTypes;
  title?: string;
  count: number;
  fields: TableFields;
  actions: TableAction[];
  queryParams: QueryParams;
  hideSearch?: boolean;
  showPreview?: boolean;
  bulkActions?: boolean;
}
