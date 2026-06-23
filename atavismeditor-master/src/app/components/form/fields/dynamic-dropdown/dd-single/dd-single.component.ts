import {
  ChangeDetectionStrategy,
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
import {DynamicDropdownService} from '../dynamic-dropdown.service';
import {FormFieldConfig} from '../../../../../models/configs';
import {TabTypes} from '../../../../../models/tabTypes.enum';
import {DropdownValue, DynamicDropdownFieldConfig} from '../../../../../models/configRow.interface';
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {debounceTime, distinctUntilChanged, filter, map, skip, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SubFormService, TableTooltip} from '../../../../../entry/sub-form.service';
import {LoadingService} from '../../../../loading/loading.service';
import {DropdownItemsService} from '../../../../../entry/dropdown-items.service';
import {bonusesSettingsTable} from '../../../../../entry/tables.data';
import {EffectType} from '../../../../../entry/effects/effects.data';

@Component({
  selector: 'atv-dd-single',
  templateUrl: './dd-single.component.html',
  styleUrls: ['./dd-single.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdSingleComponent implements OnInit, OnDestroy {
  @ViewChild('autoCompleteInput') textInput!: ElementRef<HTMLInputElement>;
  @ViewChild('autoCompleteInput', {read: MatAutocompleteTrigger}) autoComplete!: MatAutocompleteTrigger;
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public label!: string;
  @Input() public allowNew!: boolean;
  @Input() public set disabled(value: boolean) {
    setTimeout(() => {
      if (value) {
        this.searchField.disable();
      } else {
        this.searchField.enable();
      }
    });
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
  public options: DropdownValue[] = [];
  public optionCount = 0;
  public allowMore = false;
  public searchField = new FormControl();
  public disableTooltip = true;
  public loadingList = false;
  private offset = 0;
  private destroyer = new Subject();
  private selectedOption: DropdownValue | undefined = undefined;
  private useSearch = false;
  private loadList = true;
  private skipLoading = false;

  constructor(
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dynamicDropdownService: DynamicDropdownService,
    private readonly dropdownItemService: DropdownItemsService,
    private readonly loadingService: LoadingService
  ) {}

  public get ableToEdit(): boolean {
    if (this.fieldConfig?.isData) {
      return false;
    }
    return this.getControl(this.field.name).value !== -1 && !!this.getControl(this.field.name).value;
  }

  public async ngOnInit(): Promise<void> {
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.tableType),
        map((tables) => tables.find((item) => item.table === this.tableType) as TableTooltip),
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
        skip(2),
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        takeUntil(this.destroyer),
      )
      .subscribe((value) => {
        if (this.selectedOption && this.selectedOption.value !== value) {
          setTimeout(() => {
            this.selectedOption = undefined;
            this.updateFieldValue(null);
          });
        }
        if (!this.skipLoading) {
          this.useSearch = true;
          this.loadList = true;
          this.listOpened(false);
        }
        this.skipLoading = false;
      });
    const fieldValue = this.getControl(this.field.name).value;
    if (fieldValue && this.fieldConfig) {
      const option = await this.dynamicDropdownService.getItem(this.fieldConfig, fieldValue);
      if (option) {
        setTimeout(() => {
          this.searchField.patchValue(option ? option.value : '', {emitEvent: false, onlySelf: true});
          this.updateFieldValue(option ? option.id : null);
          this.selectedOption = option;
        });
      }
    }
    this.getControl(this.field.name)
      .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
      .subscribe((value) => {
        if (
          ((this.tableType === TabTypes.SKILLS && ['skill_profile_id'].includes(this.field.name)) ||
            (this.tableType === TabTypes.QUESTS &&
              ['editor_option_choice_type_id', 'target'].includes(this.field.name)) ||
            (this.tableType === TabTypes.ITEMS &&
              ['requirements', 'effects'].includes(this.subFormType) &&
              ['editor_option_choice_type_id', 'name'].includes(this.field.name)) ||
            (this.tableType === TabTypes.LEVELXP_REWARDS_PROFILE &&
              ['rewards'].includes(this.subFormType) &&
              ['reward_value'].includes(this.field.name)) ||
            (this.tableType === TabTypes.DIALOGUE &&
              ['actionID', 'editor_option_choice_type_id'].includes(this.field.name)) ||
            (this.tableType === TabTypes.BUILD_OBJECT && ['interactionID'].includes(this.field.name))) &&
          value === null
        ) {
          setTimeout(() => {
            this.searchField.patchValue('', {emitEvent: false});
            this.updateFieldValue(null);
            this.selectedOption = undefined;
          });
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
    );
    if (items) {
      let item;
      if (this.fieldConfig.isOption) {
        const list = items as DropdownValue[];
        if (list.length > 0) {
          item = list[list.length - 1];
        }
      } else {
        item = items as DropdownValue;
      }
      if (item) {
        this.searchField.patchValue(item.value, {emitEvent: false});
        await this.updateFieldValue(item.id);
        this.selectedOption = item;
      }
    }
    this.loadingService.hide();
  }

  public async editItem(): Promise<void> {
    if (!this.fieldConfig || Object.keys(this.fieldConfig).length === 0) {
      return;
    }
    const option = {
      id: this.getControl(this.field.name).value,
    } as DropdownValue;
    await this.updateItem(option);
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
        if (this.getControl(this.field.name).value === option.id) {
          const item = (items as DropdownValue[]).find(({id}) => id === option.id);
          this.searchField.patchValue(item ? item.value : '', {emitEvent: false});
          await this.updateFieldValue(item ? item.id : null);
          this.selectedOption = item ?? undefined;
        }
      } else {
        const item = items as DropdownValue;
        this.searchField.patchValue(item ? item.value : '', {emitEvent: false});
        await this.updateFieldValue(item ? item.id : null);
        this.selectedOption = item ?? undefined;
      }
    }
    this.loadingService.hide();
  }

  public optionSelected({option}: MatAutocompleteSelectedEvent): void {
    (document.activeElement as any).blur();
    if (option.value === '-1') {
      this.searchField.patchValue('', {emitEvent: false, onlySelf: true});
      this.updateFieldValue(null);
      this.selectedOption = undefined;
    } else {
      this.skipLoading = true;
      this.searchField.setValue(option.value ? option.value.value : '', {emitEvent: false, onlySelf: true});
      this.updateFieldValue(option.value ? option.value.id : null);
      this.selectedOption = option.value;
    }
  }

  public async listOpened(showMore = false): Promise<void> {
    if (!this.fieldConfig || Object.keys(this.fieldConfig).length === 0) {
      return;
    }
    if (!this.loadList) {
      this.loadList = true;
      return;
    }
    if (!showMore) {
      this.offset = 0;
      this.options = [];
    }
    let search = '';
    if (this.useSearch) {
      search = this.searchField.value;
    }
    const response = await this.dynamicDropdownService.loadList(this.fieldConfig, this.offset, search);
    this.optionCount = response.count;
    this.options = [...this.options, ...response.list];
    this.allowMore = response.allowMore;
    this.loadingList = false;
    this.changeDetectorRef.markForCheck();
  }

  public async showMore($event: Event): Promise<void> {
    $event.preventDefault();
    $event.stopPropagation();
    this.loadList = true;
    this.loadingList = true;
    this.offset += 1;
    await this.listOpened(true);
  }

  public cleanupList(): void {
    this.textInput.nativeElement.blur();
    this.loadList = true;
    if (this.selectedOption && this.searchField.value !== this.selectedOption.value) {
      this.selectedOption = undefined;
    }
    if (!this.selectedOption) {
      this.searchField.patchValue('', {emitEvent: false, onlySelf: true});
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

  public onBlurList(): void {
    this.loadList = false;
    this.changeDetectorRef.markForCheck();
  }

  private async updateFieldValue(value: string | number | null): Promise<void> {
    this.getControl(this.field.name).patchValue(value);
    if (
      this.tableType === TabTypes.EFFECTS &&
      ['stringValue1', 'stringValue2', 'stringValue3', 'stringValue4', 'stringValue5'].includes(this.field.name) &&
      this.fieldConfig.table === bonusesSettingsTable
    ) {
      if (this.getControl('effectMainType').value === EffectType.Bonuses) {
        const fieldNumber = this.field.name.replace('stringValue', '');
        const valueField = this.getControl('intValue' + fieldNumber);
        const valuepField = this.getControl('floatValue' + fieldNumber);
        valueField.enable();
        valuepField.enable();
        if (!value) {
          return;
        }
        const bonus = await this.dropdownItemService.getBonusByCode(value as string);
        if (bonus) {
          if (!bonus.value) {
            valueField.patchValue(null);
            valueField.disable();
          }
          if (!bonus.percentage) {
            valuepField.patchValue(null);
            valuepField.disable();
          }
          this.changeDetectorRef.markForCheck();
        }
      }
    } else if (
      [TabTypes.VIP, TabTypes.ACHIEVEMENTS, TabTypes.GLOBAL_EVENTS].includes(this.tableType) &&
      this.field.name === 'bonus_settings_id'
    ) {
      const valueField = this.getControl('value');
      const valuepField = this.getControl('valuep');
      valueField.enable();
      valuepField.enable();
      if (!value) {
        return;
      }
      const bonus = await this.dropdownItemService.getBonusSettingItem(value as number);
      if (bonus) {
        if (!bonus.value) {
          valueField.patchValue(null);
          valueField.disable();
        }
        if (!bonus.percentage) {
          valuepField.patchValue(null);
          valuepField.disable();
        }
        this.changeDetectorRef.markForCheck();
      }
    }
  }

  private getControl(name: string): AbstractControl {
    if (this.subForm !== -1 && this.subFormParent !== -1) {
      return (
        (this.form.get(this.subFormTypeParent) as FormArray).at(this.subFormParent).get(this.subFormType) as FormArray
      ).controls[this.subForm].get(name) as AbstractControl;
    } else if (this.subForm !== -1) {
      return (this.form.get(this.subFormType) as FormArray).controls[this.subForm].get(name) as AbstractControl;
    } else {
      return this.form.get(name) as AbstractControl;
    }
  }
}
