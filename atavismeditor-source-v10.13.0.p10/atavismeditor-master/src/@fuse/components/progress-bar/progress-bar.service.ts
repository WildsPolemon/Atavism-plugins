import {Injectable} from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter} from 'rxjs/operators';

export enum ProgressBarMode {
  determinate = 'determinate',
  indeterminate = 'indeterminate',
  buffer = 'buffer',
  query = 'query',
}

@Injectable({
  providedIn: 'root',
})
export class FuseProgressBarService {
  private _bufferValue = new BehaviorSubject(0);
  private _mode = new BehaviorSubject(ProgressBarMode.indeterminate);
  private _value = new BehaviorSubject(0);
  private _visible = new BehaviorSubject(false);

  /**
   * Constructor
   *
   * @param _router
   */
  constructor(private _router: Router) {
    this._init();
  }

  /**
   * Buffer value
   */
  get bufferValue(): Observable<any> {
    return this._bufferValue.asObservable();
  }

  setBufferValue(value: number): void {
    this._bufferValue.next(value);
  }

  /**
   * Mode
   */
  get mode(): Observable<any> {
    return this._mode.asObservable();
  }

  setMode(value: ProgressBarMode): void {
    this._mode.next(value);
  }

  /**
   * Value
   */
  get value(): Observable<any> {
    return this._value.asObservable();
  }

  setValue(value: number): void {
    this._value.next(value);
  }

  /**
   * Visible
   */
  get visible(): Observable<any> {
    return this._visible.asObservable();
  }

  /**
   * Initialize
   *
   * @private
   */
  private _init(): void {
    this._router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      this.show();
    });

    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd || event instanceof NavigationError || event instanceof NavigationCancel))
      .subscribe(() => this.hide());
  }

  /**
   * Show the progress bar
   */
  public show(): void {
    this._visible.next(true);
  }

  /**
   * Hide the progress bar
   */
  public hide(): void {
    this._visible.next(false);
  }
}
