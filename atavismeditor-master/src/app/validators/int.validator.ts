import {AbstractControl} from '@angular/forms';

export function intValidator(control: AbstractControl): {intError: boolean} | null {
  if (control.value) {
    const value = parseInt(control.value, 10);
    // eslint-disable-next-line eqeqeq
    if (isNaN(value) || value != control.value || value.toString().length !== control.value.length) {
      return {intError: true};
    }
  }
  return null;
}
