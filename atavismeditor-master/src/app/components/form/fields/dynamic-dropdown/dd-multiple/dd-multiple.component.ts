import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {DropdownValue, DynamicDropdownFieldConfig} from '../../../../../models/configRow.interface';
import {Subject} from 'rxjs';
import {FormFieldConfig} from '../../../../../models/configs';
import {TabTypes} from '../../../../../models/tabTypes.enum';
import {DynamicDropdownService} from '../dynamic-dropdown.service';
import {ENTER} from '@angular/cdk/keycodes';
import {debounceTime, filter, map, takeUntil} from 'rxjs/operators';
import {SubFormService, TableTooltip} from '../../../../../entry/sub-form.service';
import {LoadingService} from '../../../../loading/loading.service';

@Component({
  selector: 'atv-dd-multiple',
  templateUrl: './dd-multiple.component.html',
  styleUrls: ['./dd-multiple.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DdMultipleComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput', {read: MatAutocompleteTrigger}) autoComplete!: MatAutocompleteTrigger;
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public label!: string;
  @Input() public allowNew!: boolean;
  @Input() public set disabled(value: boolean) {
    if (value) {
      this.searchField.disable();
    } else {
      this.searchField.enable();
    }
  }
  @Input() public required!: boolean;
  @Input() public fieldConfig!: DynamicDropdownFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  public list: any[] = [];
  @Input() public set errors(value: any[]) {
    this.list = value;
    if (this.required && this.list.includes('REQUIRED') && this.searchField) {
      if (!this.searchField.value) {
        this.searchField.markAsDirty();
        this.searchField.markAsTouched();
      }
    }
  }
  public selectedOptions: DropdownValue[] = [];
  public separatorKeysCodes: number[] = [ENTER];
  public searchField = new FormControl('');
  public options: DropdownValue[] = [];
  public optionCount = 0;
  public allowMore = false;
  public disableTooltip = true;
  public loadingList = false;
  private offset = 0;
  private destroyer = new Subject();
  private useSearch = false;

  constructor(
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dynamicDropdownService: DynamicDropdownService,
    private readonly loadingService: LoadingService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableType),
        map(
          (tables: TableTooltip[]) =>
            tables.find((item: TableTooltip) => item.table === this.tableType) as TableTooltip,
        ),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.disableTooltip = !showTooltip;
        this.changeDetectorRef.markForCheck();
      });
    this.searchField.valueChanges
      .pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        takeUntil(this.destroyer),
      )
      .subscribe(() => {
        this.useSearch = true;
        this.listOpened(false);
      });
    const fieldValue = this.formField.value;
    if (fieldValue && this.fieldConfig) {
      const options = [];
      for (const val of fieldValue.toString().split(';')) {
        const option = await this.dynamicDropdownService.getItem(this.fieldConfig, val);
        if (option) {
          options.push(option);
        }
      }
      this.selectedOptions = options;
      this.updateFieldValue();
    }
    this.formField.valueChanges.pipe(takeUntil(this.destroyer)).subscribe((value) => {
      if (this.field.name === 'editor_option_choice_type_id' && value === null) {
        this.searchField.patchValue('', {emitEvent: false});
        this.selectedOptions = [];
        this.updateFieldValue();
      }
      if (this.required) {
        this.searchField.markAsTouched();
        this.searchField.markAsDirty();
        this.searchField.updateValueAndValidity();
      }
      this.changeDetectorRef.markForCheck();
    });
  }

  public async addNewItem(): Promise<void> {
    const subForms = {
      subForm: this.subForm,
      subFormType: this.subFormType,
      subFormParent: this.subFormParent,
      subFormParentType: this.subFormTypeParent,
    };
    const items = await this.dynamicDropdownService.manageItem(
      this.fieldConfig,
      this.form,
      this.tableType,
      this.field.name,
      subForms,
    );
    if (items) {
      if (this.fieldConfig.isOption) {
        const list = items as DropdownValue[];
        list.forEach((item) => {
          this.selectedOptions.push(item);
        });
      } else {
        this.selectedOptions.push(items as DropdownValue);
      }
      this.updateFieldValue();
    }
    this.loadingService.hide();
  }

  public async updateItem(option: DropdownValue): Promise<void> {
    if (!this.fieldConfig || Object.keys(this.fieldConfig).length === 0) {
      return;
    }
    const subForms = {
      subForm: this.subForm,
      subFormType: this.subFormType,
      subFormParent: this.subFormParent,
      subFormParentType: this.subFormTypeParent,
    };
    const items = await this.dynamicDropdownService.manageItem(
      this.fieldConfig,
      this.form,
      this.tableType,
      this.field.name,
      subForms,
      option,
    );
    if (items) {
      if (this.fieldConfig.isOption) {
        const list = items as DropdownValue[];
        list.forEach((item) => {
          if (item.id === option.id && !this.selectedOptions.includes(option)) {
            this.selectedOptions.push(item);
          } else if (item.id === option.id) {
            this.selectedOptions[this.selectedOptions.indexOf(option)].value = item.value;
          }
          const itemIndex = this.selectedOptions.findIndex((val) => val.id === item.id);
          if (itemIndex > -1) {
            this.selectedOptions[itemIndex].value = item.value;
          }
        });
      } else {
        const item = items as DropdownValue;
        const itemIndex = this.selectedOptions.findIndex((val) => val.id === item.id);
        if (itemIndex > -1) {
          this.selectedOptions[itemIndex].value = item.value;
        } else {
          this.selectedOptions.push(items as DropdownValue);
        }
      }
      this.updateFieldValue();
    }
    this.loadingService.hide();
  }

  public remove(item: DropdownValue): void {
    if (this.selectedOptions.indexOf(item) >= 0) {
      this.selectedOptions.splice(this.selectedOptions.indexOf(item), 1);
      this.updateFieldValue();
    }
  }

  public optionSelected({option: selected}: MatAutocompleteSelectedEvent): void {
    const option = selected.value;
    if (option && option.id) {
      if (!this.selectedOptions.find((item) => item.id === option.id)) {
        this.selectedOptions.push(option);
      }
    }
    this.updateFieldValue();
  }

  public async listOpened(showMore = false): Promise<void> {
    if (!showMore) {
      this.offset = 0;
      this.options = [];
    }
    let search = '';
    if (this.useSearch && this.searchField.value) {
      search = this.searchField.value;
    }
    const response = await this.dynamicDropdownService.loadList(this.fieldConfig, this.offset, search);
    this.optionCount = response.count;
    this.options = [...this.options, ...response.list];
    this.allowMore = response.allowMore;
    this.loadingList = false;
    this.changeDetectorRef.markForCheck();
  }

  public async showMore(): Promise<void> {
    this.offset += 1;
    this.loadingList = true;
    await this.listOpened(true);
  }

  public cleanupList(): void {
    this.searchInput.nativeElement.blur();
    this.searchInput.nativeElement.value = '';
    this.searchField.patchValue('', {emitEvent: false});
    this.useSearch = false;
    this.options = [];
    this.optionCount = 0;
    this.allowMore = false;
  }

  private updateFieldValue(): void {
    this.formField.patchValue(this.selectedOptions.map((item) => item.id).join(';'), {emitEvent: false});
  }

  private get formField(): AbstractControl {
    if (this.subForm !== -1 && this.subFormParent !== -1) {
      return (
        (this.form.get(this.subFormTypeParent) as FormArray).at(this.subFormParent).get(this.subFormType) as FormArray
      ).controls[this.subForm].get(this.field.name) as AbstractControl;
    } else if (this.subForm !== -1) {
      return (this.form.get(this.subFormType) as FormArray).controls[this.subForm].get(
        this.field.name,
      ) as AbstractControl;
    } else {
      return this.form.get(this.field.name) as AbstractControl;
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
