import {AbstractControl} from '@angular/forms';

export const usedItemValidator =
  (usedValue: string | number) =>
  (control: AbstractControl): {usedItemValidator: boolean} | null => {
    if (control.value && usedValue === control.value) {
      return {usedItemValidator: true};
    }
    return null;
  };
