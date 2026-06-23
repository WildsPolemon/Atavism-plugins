import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as moment from 'moment';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {
  DropdownValue,
  DynamicDropdownFieldConfig,
  FilterTypes,
  Operators,
  operators,
} from '../../../../models/configRow.interface';
import {DateFormat} from '../../../../models/date.enum';
import {FormControl} from '@angular/forms';
import {debounceTime, filter, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {DynamicDropdownService} from '../../../form/fields/dynamic-dropdown/dynamic-dropdown.service';
import {
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {CloseScrollStrategy, Overlay} from '@angular/cdk/overlay';

export function autoCompleteScroll(overlay: Overlay): () => CloseScrollStrategy {
  return () => overlay.scrollStrategies.close();
}

@Component({
  selector: 'atv-table-filter-input',
  templateUrl: './table-filter-input.component.html',
  styleUrls: ['./table-filter-input.component.scss'],
  providers: [{provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY, deps: [Overlay], useFactory: autoCompleteScroll}],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TableFilterInputComponent implements OnInit, OnDestroy {
  @ViewChild('autoCompleteInput') textInput!: ElementRef<HTMLInputElement>;
  @ViewChild('autoCompleteInput', {read: MatAutocompleteTrigger}) autoComplete!: MatAutocompleteTrigger;
  @Input() tableType: TabTypes | undefined;
  @Input() type: FilterTypes | undefined;
  @Input() name: string | undefined;
  @Input() dataConfig: DynamicDropdownFieldConfig | undefined;
  public data: DropdownValue[] = [];
  private _options: DropdownValue[] = [];
  @Input() public set options(values: DropdownValue[] | undefined) {
    if (!values) {
      values = [];
    }
    this.data = values;
    this._options = values;
  }
  public value = undefined;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  @Input() public set overrideValue(value: any) {
    this.overwriteValue = value;
    if (value === -1) {
      this.value = value;
      if (this.type === FilterTypes.dynamicDropdown) {
        this.optionSelected({option: {value: -1}} as MatAutocompleteSelectedEvent);
      }
    }
  }
  @Output() filterValue: EventEmitter<string | boolean | number> = new EventEmitter();
  @Output() filterNumber: EventEmitter<{operator: Operators; value: number | string}> = new EventEmitter();

  public FilterTypes = FilterTypes;
  public selected = Operators.equal;
  public values!: number;
  public operators = operators;
  public searchFilter: Record<string, any> = {};
  public dynamicOptions: DropdownValue[] = [];
  public optionCount = 0;
  public allowMore = false;
  public searchField = new FormControl();
  public disableTooltip = true;
  private loadList = true;
  private offset = 0;
  private selectedOption: DropdownValue | undefined = undefined;
  private useSearch = false;
  private overwriteValue = '';
  private destroyer = new Subject();

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dynamicDropdownService: DynamicDropdownService,
  ) {}

  public ngOnInit(): void {
    if (this.type === FilterTypes.dropdown && this.name) {
      this.searchFilter[this.name] = new FormControl();
      this.searchFilter[this.name].valueChanges.pipe(takeUntil(this.destroyer)).subscribe((query: string) => {
        this.data = [
          ...this._options.filter(
            (item: DropdownValue) => item.value.toLowerCase().indexOf(query.toLowerCase()) !== -1,
          ),
        ];
      });
      if (this.name === 'isactive') {
        this.value = this.overwriteValue;
      }
      this.changeDetectorRef.markForCheck();
    }
    if (this.type === FilterTypes.dynamicDropdown) {
      this.searchField.valueChanges
        .pipe(
          debounceTime(500),
          filter((value) => typeof value === 'string'),
          takeUntil(this.destroyer),
        )
        .subscribe((value) => {
          if (this.selectedOption && this.selectedOption.value !== value) {
            this.selectedOption = undefined;
          }
          this.useSearch = true;
          this.loadList = true;
          this.changeDetectorRef.markForCheck();
          this.listOpened(false);
        });
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public emitFilterValue(value: any): void {
    if (this.type === 'dropdown') {
      this.filterValue.emit(value);
    } else {
      if (!value) {
        value = '-1';
      }
      if (this.type === 'booleanType' || value === '-1') {
        this.filterValue.emit(value);
      } else if (this.type === 'date') {
        this.filterValue.emit(moment(value).format(DateFormat.DATE_FORMAT));
      }
    }
    this.changeDetectorRef.markForCheck();
  }

  public filterNumbers(): void {
    if (!isNaN(this.values)) {
      this.filterNumber.emit({operator: this.selected, value: this.values});
    }
    this.changeDetectorRef.markForCheck();
  }

  public onBlurList(): void {
    if (!this.searchField.value) {
      this.selectedOption = undefined;
    }
    this.useSearch = false;
    this.changeDetectorRef.markForCheck();
  }

  public async listOpened(showMore = false): Promise<void> {
    if (!this.dataConfig || Object.keys(this.dataConfig).length === 0) {
      return;
    }
    if (!this.loadList) {
      this.loadList = true;
      return;
    }
    if (!showMore) {
      this.offset = 0;
      this.dynamicOptions = [];
    }
    let search = '';
    if (this.useSearch || (showMore && this.searchField.value)) {
      search = this.searchField.value;
    }
    const response = await this.dynamicDropdownService.loadList(this.dataConfig, this.offset, search);
    this.optionCount = response.count;
    this.dynamicOptions = [...this.dynamicOptions, ...response.list];
    this.allowMore = response.allowMore;
    this.changeDetectorRef.markForCheck();
  }

  public async showMore(): Promise<void> {
    this.loadList = true;
    this.offset += 1;
    this.changeDetectorRef.markForCheck();
    await this.listOpened(true);
  }

  public optionSelected({option}: MatAutocompleteSelectedEvent): void {
    (document.activeElement as any).blur();
    if (option.value === -1) {
      this.searchField.patchValue('', {emitEvent: false});
      this.selectedOption = undefined;
      this.filterValue.emit('-1');
    } else {
      this.searchField.patchValue(option.value ? option.value.value : '', {emitEvent: false});
      this.selectedOption = option.value;
      this.filterValue.emit(option.value ? option.value.id : -1);
    }
    this.changeDetectorRef.markForCheck();
  }

  public cleanupList(): void {
    this.textInput.nativeElement.blur();
    this.loadList = true;
    if (this.selectedOption && this.searchField.value !== this.selectedOption.value) {
      this.selectedOption = undefined;
      this.filterValue.emit('-1');
    }
    if (!this.selectedOption && this.searchField.value && this.searchField.value.length > 0) {
      this.searchField.patchValue('', {emitEvent: false});
      this.filterValue.emit('-1');
    }
    this.useSearch = false;
    this.options = [];
    this.optionCount = 0;
    this.allowMore = false;
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
