import {AbstractControl} from '@angular/forms';

export const minNotEqualValidator =
  (value: number, allowMinusOne = false) =>
  (control: AbstractControl): {minNotEqual: number} | null => {
    if (allowMinusOne && +control.value === -1) {
      return null;
    }
    if (control.value <= value) {
      return {minNotEqual: value};
    }
    return null;
  };
