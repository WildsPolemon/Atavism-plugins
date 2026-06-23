import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

/* tslint:disable:member-ordering */
@Component({
  selector: 'atv-dropdown-search',
  templateUrl: './dropdown-search.component.html',
  styleUrls: ['./dropdown-search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownSearchComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownSearchComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor {
  /** Reference to the search input field */
  @ViewChild('searchSelectInput', {read: ElementRef, static: true}) searchSelectInput!: ElementRef;

  /** Current search value */
  get value(): string {
    return this._value;
  }
  private _value = '';
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars
  onChange = (_: any) => {};
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars
  onTouched = (_: any) => {};

  /** Reference to the MatSelect options */
  public _options!: QueryList<MatOption>;

  /** Previously selected values when using <mat-select [multiple]="true">*/
  private previousSelectedValues!: any[];

  /** Whether the backdrop class has been set */
  private overlayClassSet = false;

  /** Event that emits when the current value changes */
  private change = new EventEmitter<string>();

  /** Subject that emits when the component has been destroyed. */
  private _onDestroy = new Subject<void>();

  constructor(@Inject(MatSelect) public matSelect: MatSelect, private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // set custom panel class
    const panelClass = 'mat-select-search-panel';
    if (this.matSelect.panelClass) {
      if (Array.isArray(this.matSelect.panelClass)) {
        this.matSelect.panelClass.push(panelClass);
      } else if (typeof this.matSelect.panelClass === 'string') {
        this.matSelect.panelClass = [this.matSelect.panelClass, panelClass];
      } else if (typeof this.matSelect.panelClass === 'object') {
        (this.matSelect.panelClass as {[key: string]: any})[panelClass] = true;
      }
    } else {
      this.matSelect.panelClass = panelClass;
    }

    // when the select dropdown panel is opened or closed
    this.matSelect.openedChange.pipe(takeUntil(this._onDestroy)).subscribe((opened) => {
      if (opened) {
        // focus the search field when opening
        this._focus();
      } else {
        // clear it when closing
        this._reset();
      }
    });

    // set the first item active after the options changed
    this.matSelect.openedChange
      .pipe(take(1))
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this._options = this.matSelect.options;
        this._options.changes.pipe(takeUntil(this._onDestroy)).subscribe(() => {
          const keyManager = this.matSelect._keyManager;
          if (keyManager && this.matSelect.panelOpen) {
            // avoid "expression has been changed" error
            setTimeout(() => {
              keyManager.setFirstItemActive();
            });
          }
        });
      });

    // detect changes when the input changes
    this.change.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.changeDetectorRef.detectChanges();
    });

    this.initMultipleHandling();
  }

  public ngOnDestroy(): void {
    this._onDestroy.next(void 0);
    this._onDestroy.complete();
  }

  public ngAfterViewInit(): void {
    this.setOverlayClass();
  }

  /**
   * Handles the key down event with MatSelect.
   * Allows e.g. selecting with enter key, navigation with arrow keys, etc.
   *
   * @param event
   * @private
   */
  public _handleKeydown(event: KeyboardEvent): void {
    if (event.code.toLowerCase() === 'space') {
      // do not propagate spaces to MatSelect, as this would select the currently active option
      event.stopPropagation();
    }
  }

  public writeValue(value: string): void {
    const valueChanged = value !== this._value;
    if (valueChanged) {
      this._value = value;
      this.change.emit(value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public onInputChange($event: any): void {
    const value = $event?.target?.value || '';
    const valueChanged = value !== this._value;
    if (valueChanged) {
      this._value = value;
      this.onChange(value);
      this.change.emit(value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public onBlur($event: any): void {
    const value = $event?.target?.value || '';
    this.writeValue(value);
    this.onTouched(value);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Focuses the search input field
   *
   * @private
   */
  public _focus(): void {
    if (!this.searchSelectInput) {
      return;
    }
    // save and restore scrollTop of panel, since it will be reset by focus()
    // note: this is hacky
    const panel = this.matSelect.panel.nativeElement;
    const scrollTop = panel.scrollTop;

    // focus
    this.searchSelectInput.nativeElement.focus();

    panel.scrollTop = scrollTop;
  }

  /**
   * Resets the current search value
   *
   * @param focus whether to focus after resetting
   * @private
   */
  public _reset(focus?: boolean): void {
    if (!this.searchSelectInput) {
      return;
    }
    this.searchSelectInput.nativeElement.value = '';
    this.onInputChange('');
    if (focus) {
      this._focus();
    }
  }

  /**
   * Sets the overlay class  to correct offsetY
   * so that the selected option is at the position of the select box when opening
   */
  private setOverlayClass(): void {
    if (this.overlayClassSet) {
      return;
    }
    this.overlayClassSet = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Initializes handling <mat-select [multiple]="true">
   * Note: to improve this code, mat-select should be extended to allow disabling resetting the selection while filtering.
   */
  private initMultipleHandling(): void {
    // if <mat-select [multiple]="true">
    // store previously selected values and restore them when they are deselected
    // because the option is not available while we are currently filtering
    this.matSelect.valueChange.pipe(takeUntil(this._onDestroy)).subscribe((values) => {
      if (this.matSelect.multiple) {
        let restoreSelectedValues = false;
        if (this._value && this._value.length && this.previousSelectedValues && Array.isArray(this.previousSelectedValues)) {
          if (!values || !Array.isArray(values)) {
            values = [];
          }
          const optionValues = this.matSelect.options.map((option) => option.value);
          this.previousSelectedValues.forEach((previousValue) => {
            if (values.indexOf(previousValue) === -1 && optionValues.indexOf(previousValue) === -1) {
              // if a value that was selected before is deselected and not found in the options, it was deselected
              // due to the filtering, so we restore it.
              values.push(previousValue);
              restoreSelectedValues = true;
            }
          });
        }

        if (restoreSelectedValues) {
          this.matSelect._onChange(values);
        }

        this.previousSelectedValues = values;
      }
    });
  }
}
