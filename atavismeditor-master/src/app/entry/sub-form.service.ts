import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {TabTypes} from '../models/tabTypes.enum';
import {SubFieldType} from '../models/configRow.interface';
import {BonusSetting} from './bonus-settings/bonus-settings.service';
import {VipLevelBonus} from './vip/vip.component';
import {AchievementBonus} from './achievements/achievements.data';
import {minNotEqualValidator} from '../validators/min-not-equal.validator';

export interface TableTooltip {
  table: TabTypes;
  value: boolean;
}

export interface SubQueryField {
  type: SubTable;
  main?: string;
  related?: string;
  table?: string;
  compare?: Record<string, unknown>;
  orCompare?: Record<string, unknown>;
  where?: Record<string, unknown>;
  orWhere?: Record<string, unknown>;
  search?: Record<string, unknown>;
  columns?: string[];
}

export enum SubTable {
  left_join = 0,
  multiple = 1,
  multiple_left_join = 2,
}

@Injectable({
  providedIn: 'root',
})
export class SubFormService {
  private readonly showTooltipsStream = new BehaviorSubject<TableTooltip[]>([]);
  public showTooltips = this.showTooltipsStream.asObservable();

  constructor() {}

  public toggleTooltip(table: TabTypes, value: boolean): void {
    const tooltips = this.showTooltipsStream.getValue();
    const tableTooltip = tooltips.find((item) => item.table === table);
    if (tableTooltip) {
      tableTooltip.value = value;
    } else {
      tooltips.push({table, value});
    }
    this.showTooltipsStream.next(tooltips);
  }

  public buildSubForm<T, K>(
    itemForm: SubFieldType,
    item: T,
    arrayItemForm?: SubFieldType | undefined,
    items?: K[] | undefined,
  ): FormGroup {
    const subForm = new FormGroup({});
    Object.keys(itemForm).forEach((key) => {
      if (!itemForm[key].isArray) {
        subForm.addControl(key, this.prepareSubFormControl<T>(itemForm, item, key));
      } else if (itemForm[key].isArray && arrayItemForm && items) {
        subForm.addControl(key, new FormArray([]));
        for (const subItem of items) {
          const subSubForm = new FormGroup({});
          Object.keys(arrayItemForm).forEach((subKey) => {
            const validators = [];
            if (arrayItemForm[subKey].required) {
              validators.push(Validators.required);
            }
            if (arrayItemForm[subKey].min !== undefined) {
              validators.push(Validators.min(arrayItemForm[subKey].min as number));
            }
            if (arrayItemForm[subKey].minNotEqual !== undefined) {
              validators.push(
                minNotEqualValidator(
                  arrayItemForm[subKey].minNotEqual as number,
                  !!arrayItemForm[subKey].allowMinusOne,
                ),
              );
            }
            if (arrayItemForm[subKey].max !== undefined) {
              validators.push(Validators.max(arrayItemForm[subKey].max as number));
            }
            subSubForm.addControl(subKey, new FormControl(subItem[subKey as keyof K], validators));
          });
          (subForm.get(key) as FormArray).push(subSubForm);
        }
      }
    });
    return subForm;
  }

  public getControl(
    form: FormGroup,
    subForm: number,
    subFormType: string,
    subFormParent: number,
    subFormTypeParent: string,
    name: string,
  ): AbstractControl {
    if (subForm !== -1 && subFormParent !== -1) {
      return ((form.get(subFormTypeParent) as FormArray).at(subFormParent).get(subFormType) as FormArray).controls[
        subForm
      ].get(name) as AbstractControl;
    } else if (subForm !== -1) {
      return (form.get(subFormType) as FormArray).controls[subForm].get(name) as AbstractControl;
    } else {
      return form.get(name) as AbstractControl;
    }
  }

  public bonusSubForm(bonus: BonusSetting, item: AchievementBonus | VipLevelBonus, bonusForm: SubFieldType): FormGroup {
    const subForm = new FormGroup({});
    Object.keys(bonusForm).forEach((key) => {
      // @ts-ignore
      const control = new FormControl(item[key], bonusForm[key].required ? Validators.required : null);
      if ((key === 'value' && !bonus.value) || (key === 'valuep' && !bonus.percentage)) {
        control.disable();
      }
      subForm.addControl(key, control);
    });
    return subForm;
  }

  public prepareSubFormControl<T>(itemForm: SubFieldType, item: T, key: string): FormControl {
    const validators = [];
    if (itemForm[key].required) {
      validators.push(Validators.required);
    }
    if (itemForm[key].min !== undefined) {
      validators.push(Validators.min(itemForm[key].min as number));
    }
    if (itemForm[key].minNotEqual !== undefined) {
      validators.push(minNotEqualValidator(itemForm[key].minNotEqual as number, itemForm[key].allowMinusOne));
    }
    if (itemForm[key].max !== undefined) {
      validators.push(Validators.max(itemForm[key].max as number));
    }
    return new FormControl(item[key as keyof T], validators);
  }
}
