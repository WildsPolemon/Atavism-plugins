import {AbstractControl} from '@angular/forms';

export const usedValidator =
  (list: string[]) =>
  (control: AbstractControl): {usedError: boolean} | null => {
    if (control.value) {
      if (list.includes(control.value)) {
        return {usedError: true};
      }
    }
    return null;
  };
