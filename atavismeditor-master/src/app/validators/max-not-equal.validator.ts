import {AbstractControl} from '@angular/forms';

export const maxNotEqualValidator =
  (value: number, allowMinusOne = false) =>
  (control: AbstractControl): {maxNotEqual: number} | null => {
    if (allowMinusOne && +control.value === -1) {
      return null;
    }
    if (control.value >= value) {
      return {maxNotEqual: value};
    }
    return null;
  };
