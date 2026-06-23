import {AbstractControl} from '@angular/forms';

export function floatValidator(control: AbstractControl): {floatError: boolean} | null {
  if (control.value) {
    const value = parseFloat(control.value);
    if (isNaN(value) || value !== Number(control.value)) {
      return {floatError: true};
    }
  }
  return null;
}
