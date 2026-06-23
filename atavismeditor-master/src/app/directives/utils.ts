import {pipe, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {Profile} from '../settings/profiles/profile';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const distinctPipe = <T>(destroyer: Subject<void>) =>
  pipe(
    distinctUntilChanged((x: T, y: T) => Utils.equals(x, y)),
    map((item: T) => item),
    takeUntil(destroyer),
  );

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getProfilePipe = (destroyer: Subject<void>) =>
  pipe(
    filter((profile: any) => !!profile),
    map((profile: Profile) => profile),
    distinctUntilChanged((x, y) => Utils.equals(x, y)),
    takeUntil(destroyer),
  );

export class Utils {
  /**
   * Simple check for equality of two objects without cyclic references
   * Based on https://github.com/epoberezkin/fast-deep-equal
   * Alternatives with cyclic references check:
   * - https://github.com/lodash/lodash
   * - https://github.com/chaijs/deep-eql
   *
   * @param x
   * @param y
   * @throws RangeError: Maximum call stack size exceeded - when one of the parameters has cyclic reference
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static equals(x: any, y: any): boolean {
    // Primitives and NaN check
    if (x === y || (x !== x && y !== y)) {
      return true;
    }

    // Array check
    const arr = {x: Array.isArray(x), y: Array.isArray(y)};
    if (arr.x !== arr.y) {
      return false;
    } else if (arr.x && arr.y) {
      const xLen = x.length;
      if (xLen !== y.length) {
        return false;
      }

      for (let i = 0; i < xLen; i++) {
        if (!Utils.equals(x[i], y[i])) {
          return false;
        }
      }
      return true;
    }

    // Regex check
    const regex = {x: x instanceof RegExp, y: y instanceof RegExp};
    if (regex.x !== regex.y) {
      return false;
    } else if (regex.x && regex.y) {
      return x.toString() === y.toString();
    }

    // Date check
    const date = {x: x instanceof Date, y: y instanceof Date};
    if (date.x !== date.y) {
      return false;
    } else if (date.x && date.y) {
      return x.getTime() === y.getTime();
    }

    // Object check
    if (x instanceof Object && y instanceof Object) {
      const xKeys = Object.keys(x);

      if (xKeys.length !== Object.keys(y).length) {
        return false;
      }

      for (const key of xKeys) {
        if (!Object.prototype.hasOwnProperty.call(y, key)) {
          return false;
        }
      }

      for (const key of xKeys) {
        if (!Utils.equals(x[key], y[key])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
}
