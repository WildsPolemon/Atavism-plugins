import {AbstractControl} from '@angular/forms';

export function boolValidator(control: AbstractControl): {boolError: boolean} | null {
  if (control.value && control.value.toLowerCase() !== 'true' && control.value.toLowerCase() !== 'false') {
    return {boolError: true};
  }
  return null;
}
