import {AbstractControl} from '@angular/forms';

export interface VipLevelValidatorError {
  vipLevelDuplicatedError?: boolean;
  vipLevelSequenceError?: number;
}

export const vipLevelValidator =
  (list: {level: number}[]) =>
  (control: AbstractControl): VipLevelValidatorError | null => {
    if (control.value) {
      const levels = list.map((lItem) => lItem.level);
      if (levels.includes(+control.value)) {
        return {vipLevelDuplicatedError: true};
      }
      levels.push(+control.value);
      levels.sort((a, b) => a - b);
      let errorLevel = -1;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] !== 1) {
          errorLevel = +levels[i - 1] + 1;
        }
      }
      if (errorLevel !== -1) {
        return {vipLevelSequenceError: errorLevel};
      }
    }
    return null;
  };
