import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {AbstractControl, FormArray, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {distinctPipe} from '../../../../directives/utils';
import {BonusSetting} from '../../../../entry/bonus-settings/bonus-settings.service';
import {DropdownItemsService} from '../../../../entry/dropdown-items.service';
import {PlayerCharacterService} from '../../../../entry/player-character/player-character.service';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {FormFieldConfig, FormFieldType, hiddenField, TypeMap} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {DuplicateValidator} from '../../../../validators/duplicate.validator';
import {minNotEqualValidator} from '../../../../validators/min-not-equal.validator';
import {moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'atv-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup | any;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public errors: string[] = [];
  @Output() public updateWidth: EventEmitter<number> = new EventEmitter<number>();
  public FormFieldType = FormFieldType;
  public overrideLabel = '';
  public overrideTooltip = '';
  public disableTooltip = true;
  public hiddenOverride = hiddenField.noAction;
  public requireOverride = false;
  public fieldReadonly = false;
  private fieldControl!: AbstractControl;
  private fieldConditionControl: AbstractControl | undefined;
  private destroyer = new Subject<void>();

  constructor(
    private readonly subFormService: SubFormService,
    private readonly pcService: PlayerCharacterService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public _field!: FormFieldConfig;

  public get field(): FormFieldConfig {
    return this._field;
  }

  @Input()
  public set field(value: FormFieldConfig) {
    this._field = value;
    this.fieldControl = this.subFormService.getControl(
      this.form,
      this.subForm,
      this.subFormType,
      this.subFormParent,
      this.subFormTypeParent,
      this._field.name,
    );
    if (this._field.conditionName) {
      this.fieldConditionControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        this._field.conditionName,
      );
    }
    if (this.tableType === TabTypes.OPTION_CHOICE || this.tableType === TabTypes.BUILD_OBJECT) {
      this.fieldReadonly = this.checkIfReadonly();
    }
    this.changeDetectorRef.markForCheck();
  }

  public get isHidden(): boolean {
    if (this.hiddenOverride > 0) {
      return this.hiddenOverride === hiddenField.hidden;
    }
    return this._field.hidden === hiddenField.hidden;
  }

  public ngOnInit(): void {
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
    if (this._field.condition && this.fieldConditionControl) {
      if (this._field.disabled) {
        setTimeout(() => {
          this.fieldControl.disable();
          this.changeDetectorRef.markForCheck();
        });
      }
      this.overWriteValues(this.fieldConditionControl.value);
      this.fieldConditionControl.valueChanges
        .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((changedValue) => {
          this.overWriteValues(changedValue);
          this.changeDetectorRef.markForCheck();
        });
    }
    if (
      this.tableType === TabTypes.ITEMS &&
      this.subFormType &&
      this.subForm !== -1 &&
      this.subFormParent === -1 &&
      this.subFormType === 'effects'
    ) {
      const formContainer = (this.form.get(this.subFormType) as FormArray).controls[this.subForm];
      (formContainer.get('name') as AbstractControl).valueChanges
        .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if ((formContainer.get('type') as AbstractControl).value === 'Bonus') {
            if (value) {
              const currentValue = (formContainer.get(this._field.name) as AbstractControl).value;
              this.dropdownItemsService.getBonusByCode(value).then((bonus) => {
                if (
                  (this._field.name === 'value' || this._field.name === 'percentage') &&
                  bonus &&
                  bonus[this._field.name as keyof BonusSetting]
                ) {
                  (formContainer.get(this._field.name) as AbstractControl).enable();
                  (formContainer.get(this._field.name) as AbstractControl).setValue(currentValue);
                } else {
                  (formContainer.get(this._field.name) as AbstractControl).disable();
                }
              });
            } else if (this._field.name === 'value' || this._field.name === 'percentage') {
              (formContainer.get(this._field.name) as AbstractControl).disable();
            }
          }
          this.changeDetectorRef.markForCheck();
        });
    }
    if (
      (this.tableType === TabTypes.EFFECTS_TRIGGERS || this.tableType === TabTypes.ABILITIES_TRIGGERS || this.tableType === TabTypes.ABILITY)&&
      this.subForm !== -1 &&
      (this._field.name === 'chance_min' || this._field.name === 'chance_max')
    ) {
      this.getControl(this._field.name).valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
        if (this._field.name === 'chance_min') {
          const changeMaxField = this.getControl('chance_max');
          changeMaxField.setValidators([Validators.required, Validators.min(+value), Validators.max(100)]);
          changeMaxField.updateValueAndValidity();
        } else if (this._field.name === 'chance_max') {
          const changeMinField = this.getControl('chance_min');
          changeMinField.setValidators([
            Validators.required,
            Validators.min(0),
            Validators.max(+value < 0 ? 0 : +value),
          ]);
          changeMinField.updateValueAndValidity();
        }
      });
      this.changeDetectorRef.markForCheck();
    }

    if (this.tableType === TabTypes.STATS_PROFILE && ['level_increase','level_percent_increase','value'].includes(this.field.name)) {
      const numValue = this.getControl('override_values').value;
      if (numValue) {
        this.hiddenOverride = hiddenField.visible;
      } else {
        this.hiddenOverride = hiddenField.hidden;
      }
      this.changeDetectorRef.markForCheck();
      this.getControl('override_values')
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if (value) {
            this.hiddenOverride = hiddenField.visible;
          } else {
            this.hiddenOverride = hiddenField.hidden;
          }
          this.changeDetectorRef.markForCheck();
        });
    }

    if (this.tableType === TabTypes.BUILD_OBJECT && this.subForm !== -1 && this._field.name === 'lootMinPercentage') {
      const chanceField = (this.form.get(this.subFormType) as FormArray)
        .at(this.subForm)
        .get(this._field.name) as AbstractControl;
      chanceField.valueChanges.pipe(distinctPipe(this.destroyer)).subscribe((value) => {
        const changeMaxField = (this.form.get(this.subFormType) as FormArray)
          .at(this.subForm)
          .get('lootMaxPercentage') as AbstractControl;
        changeMaxField.setValidators([Validators.min(+value), Validators.max(100)]);
        changeMaxField.updateValueAndValidity();
      });
      this.changeDetectorRef.markForCheck();
    }
    if (
      this.tableType === TabTypes.LOOT_TABLE &&
      this._field.name === 'count' &&
      this.subFormType === 'items' &&
      this.subForm !== -1 &&
      this.subFormParent === -1
    ) {
      (
        (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this._field.name) as AbstractControl
      ).valueChanges
        .pipe(debounceTime(200), takeUntil(this.destroyer))
        .subscribe((value) => {
          (
            (this.form.get(this.subFormType) as FormArray).at(this.subForm).get('count_max') as AbstractControl
          ).setValidators(Validators.min(value));
          (
            (this.form.get(this.subFormType) as FormArray).at(this.subForm).get('count_max') as AbstractControl
          ).updateValueAndValidity();
          this.changeDetectorRef.markForCheck();
        });
    }

    if (
      this.tableType === TabTypes.RESOURCE_NODE_PROFILE &&
      (this._field.name === 'respawnTime' || this._field.name === 'priority' || this._field.name === 'skillLevel') &&
      this.subFormType === 'subs' &&
      this.subForm !== -1 &&
      this.subFormParent === -1
    ) {
      const minFieldControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        this._field.name,
      );
      minFieldControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroyer)).subscribe((value) => {
        let chanceMaxField = '';
        if (this._field.name === 'respawnTime') {
          chanceMaxField = 'respawnTimeMax';
        } else if (this._field.name === 'skillLevel') {
          chanceMaxField = 'skillLevelMax';
        } else if (this._field.name === 'priority') {
          chanceMaxField = 'priorityMax';
        }
        const chanceMaxControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          chanceMaxField,
        );
        chanceMaxControl.setValidators([minNotEqualValidator(0), Validators.min(value)]);
        chanceMaxControl.updateValueAndValidity();
      });
    } else if (
      this.tableType === TabTypes.RESOURCE_NODE_PROFILE &&
      (this._field.name === 'chance' || this._field.name === 'min') &&
      this.subFormType === 'drops' &&
      this.subForm !== -1 &&
      this.subFormParent !== -1
    ) {
      const chanceMinControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        this._field.name,
      );
      chanceMinControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroyer)).subscribe((value) => {
        if (this._field.name === 'chance') {
          const chanceMaxControl = this.subFormService.getControl(
            this.form,
            this.subForm,
            this.subFormType,
            this.subFormParent,
            this.subFormTypeParent,
            'chanceMax',
          );
          chanceMaxControl.setValidators([minNotEqualValidator(0), Validators.min(value), Validators.max(100)]);
          chanceMaxControl.updateValueAndValidity();
        } else if (this._field.name === 'min') {
          const chanceMaxControl = this.subFormService.getControl(
            this.form,
            this.subForm,
            this.subFormType,
            this.subFormParent,
            this.subFormTypeParent,
            'max',
          );
          chanceMaxControl.setValidators([minNotEqualValidator(0), Validators.min(value)]);
          chanceMaxControl.updateValueAndValidity();
        }
      });
    } else if (
      this.tableType === TabTypes.PLAYER_CHARACTER &&
      this._field.name === 'value' &&
      this.subFormType === 'stat' &&
      this.subForm !== -1 &&
      this.subFormParent === -1
    ) {
      (
        (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this._field.name) as AbstractControl
      ).valueChanges
        .pipe(debounceTime(200), takeUntil(this.destroyer))
        .subscribe((value) => {
          const stat = ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get('stat') as AbstractControl)
            .value;
          if (this.pcService.relatedMaxStats[stat]) {
            const fields = this.pcService.relatedMaxStats[stat].fields;
            for (const field of fields) {
              (this.form.get(this.subFormType) as FormArray).controls.forEach((control) => {
                if (field === (control.get('stat') as AbstractControl).value) {
                  (control.get('value') as AbstractControl).setValidators(Validators.max(value));
                  (control.get('value') as AbstractControl).updateValueAndValidity();
                }
              });
            }
          }
          this.changeDetectorRef.markForCheck();
        });
    }
    if ((this.tableType === TabTypes.LEVELXP_PROFILE && this._field.name === 'level')||
      (this.tableType === TabTypes.PET_PROFILE && this._field.name === 'level')
    ) {
      const fieldContainer = (this.form.get(this.subFormType) as FormArray);
      fieldContainer.valueChanges.pipe(debounceTime(200), takeUntil(this.destroyer)).subscribe((value) => {
        for (let j = 0; j < fieldContainer.length; j++) {
          (fieldContainer.at(j).get('level') as AbstractControl).setValue(j + 1);
        }
      });
    }

      if (
      (this.tableType === TabTypes.ITEM_SETS && this._field.name === 'number_of_parts') ||
      (this.tableType === TabTypes.ENCHANT_PROFILE && this._field.name === 'level')
    ) {
      const fieldContainer = (this.form.get(this.subFormType) as FormArray)
        .at(this.subForm)
        .get(this._field.name) as AbstractControl;
      fieldContainer.valueChanges.pipe(debounceTime(200), takeUntil(this.destroyer)).subscribe((value) => {
        const allItems = (this.form.get(this.subFormType) as FormArray).length;
        value = +value;
        if (this.subForm > 0) {
          const previous = +(
            (this.form.get(this.subFormType) as FormArray).at(this.subForm - 1).get(this._field.name) as AbstractControl
          ).value;
          if (previous >= value) {
            const newValue = value - 1 <= 1 ? 1 : value - 1;
            (
              (this.form.get(this.subFormType) as FormArray)
                .at(this.subForm - 1)
                .get(this._field.name) as AbstractControl
            ).patchValue(newValue);
          }
        }
        if (allItems > this.subForm + 1) {
          const next = +(
            (this.form.get(this.subFormType) as FormArray).at(this.subForm + 1).get(this._field.name) as AbstractControl
          ).value;
          if (next <= value) {
            (
              (this.form.get(this.subFormType) as FormArray)
                .at(this.subForm + 1)
                .get(this._field.name) as AbstractControl
            ).patchValue(+value + 1);
          }
        }
        this.changeDetectorRef.markForCheck();
      });
    }



    if (
      (this.tableType === TabTypes.LOOT_TABLE && this._field.name === 'chance')
    ) {
      const fieldContainer = (this.form.get(this.subFormType) as FormArray)
        .at(this.subForm)
        .get(this._field.name) as AbstractControl;
      fieldContainer.valueChanges.pipe(debounceTime(200), takeUntil(this.destroyer)).subscribe((value) => {
        const list = (this.form.get(this.subFormType) as FormArray);
        let maxUnderValue = -1;
        let maxUnderIndex = -1;
        let sumChance = 0;
        for (let i = 0; i < list.length; i++) {
          const v = +(list.at(i).get("chance") as AbstractControl).value;
          sumChance += v;
          if (v > maxUnderValue && v < value) {
            maxUnderValue = v;
            maxUnderIndex = (this.subForm < i) ? i : i + 1;
          }
        }
        if(maxUnderIndex > -1) {
          moveItemInArray(list.controls, this.subForm, maxUnderIndex);
          //moveItemInArray(list.value, this.subForm, maxUnderIndex);
        } else if(this.subForm>0){
          moveItemInArray(list.controls, this.subForm, 0);
        }
        let schance = 0;
        let count = 0;
        for (let i = 0; i < list.length; i++) {
          const v = +(list.at(i).get('chance') as AbstractControl).value;
          count = 0;
          for (let j = 0; j < list.length; j++) {
            const cv = +(list.at(j).get('chance') as AbstractControl).value;
            if(cv === v){
              count++;
            }
          }
          if (i === 0){
            (list.at(i).get('chance2') as AbstractControl).patchValue(v / count);
            schance += v / count;
          } else {
            const pv = +(list.at(i - 1).get('chance') as AbstractControl).value;
            const pc = +(list.at(i - 1).get('chance2') as AbstractControl).value;
            (list.at(i).get('chance2') as AbstractControl).patchValue(v === pv ? pc : (v - schance) / count);
            schance += v === pv ? pc : (v - schance) / count;
          }
        }
        this.changeDetectorRef.markForCheck();
      });
    }

    if (this.tableType === TabTypes.LOOT_TABLE && this._field.name === 'chance2') {
      ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this._field.name) as AbstractControl).disable();
    }

    if (this.tableType === TabTypes.THRESHOLDS && this.subForm !== -1 && this._field.name === 'threshold') {
      const fieldControl = (this.form.get(this.subFormType) as FormArray)
        .at(this.subForm)
        .get(this._field.name) as AbstractControl;
      if (this.subForm > 0) {
        const prevValue = (
          (this.form.get(this.subFormType) as FormArray).at(this.subForm - 1).get(this._field.name) as AbstractControl
        ).value;
        setTimeout(() => {
          fieldControl.setValidators(Validators.min(+prevValue + 1));
          fieldControl.updateValueAndValidity();
          this.changeDetectorRef.markForCheck();
        });
      }
      fieldControl.valueChanges.pipe(debounceTime(200), distinctPipe(this.destroyer)).subscribe((value) => {
        const nextFieldControl = (this.form.get(this.subFormType) as FormArray)
          .at(this.subForm + 1)
          ?.get(this._field.name) as AbstractControl;
        if (nextFieldControl) {
          setTimeout(() => {
            nextFieldControl.setValidators(Validators.min(Number(value) + 1));
            nextFieldControl.updateValueAndValidity();
            this.changeDetectorRef.markForCheck();
          });
        }
        this.changeDetectorRef.markForCheck();
      });
    }
    if (
      this.tableType === TabTypes.SKILL_PROFILES &&
      (this._field.name === 'level_diff' || this._field.name === 'required_xp')
    ) {
      this.overrideLabel = this._field.label + ' ' + (+this.subForm + 1);
      this.changeDetectorRef.markForCheck();
    }
    if (
      this.tableType === TabTypes.BUILD_OBJECT &&
      ((this.subFormType === 'progresses' && this._field.name === 'progress') ||
        (this.subFormType === 'damages' && this._field.name === 'progress'))
    ) {
      const progressControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        this._field.name,
      );
      progressControl.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer)).subscribe((value) => {
        const validators = [
          Validators.min(this.subFormType === 'damages' ? 1 : 0),
          Validators.max(this.subFormType === 'damages' ? 99 : 100),
          Validators.required,
        ];
        const allProgresses = (
          (this.form.get(this.subFormTypeParent) as FormArray).at(this.subFormParent).get(this.subFormType) as FormArray
        ).value.map((item: {progress: number}) => +item.progress);
        if (allProgresses.includes(+value)) {
          validators.push(DuplicateValidator);
        }
        progressControl.setValidators(validators);
        progressControl.updateValueAndValidity();
        this.changeDetectorRef.markForCheck();
      });
    }
  }

  public overWriteValues(value: string | number): void {
    const conditionName = this._field.conditionName as string;
    let valueConditions = (this._field.condition as TypeMap<string, any>)[conditionName][value];
    if (conditionName === 'all_stats') {
      const allStatsControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        'all_stats',
      );
      if (allStatsControl.value && this._field.name === 'damage') {
        this.fieldControl.setValue(0);
      }
      value = value ? 2 : 1;
      valueConditions = (this._field.condition as TypeMap<string, any>)[conditionName][value];
    }
    if (value && valueConditions) {
      const validators = [];
      this.overrideLabel = valueConditions.label ? valueConditions.label : '';
      this.overrideTooltip = valueConditions.tooltip ? valueConditions.tooltip : '';
      this.hiddenOverride = valueConditions.hidden || this._field.hidden;
      this.requireOverride = valueConditions.require || this._field.require;
      if (valueConditions.min) {
        validators.push(Validators.min(valueConditions.min));
      }
      if (valueConditions.max) {
        validators.push(Validators.max(valueConditions.max));
      }
      if (this.requireOverride) {
        validators.push(Validators.required);
      }
      setTimeout(() => {
        if (valueConditions.width) {
          this.updateWidth.emit(valueConditions.width);
        }
        if (valueConditions.disabled) {
          this.fieldControl.disable();
          this.fieldControl.setValue('');
          this.fieldControl.setValidators([]);
          this.fieldControl.updateValueAndValidity();
        } else {
          this.fieldControl.enable();
          this.fieldControl.setValidators(validators);
          this.fieldControl.updateValueAndValidity();
        }
        this.changeDetectorRef.markForCheck();
      });
    } else {
      this.overrideLabel = ' ';
      this.overrideTooltip = ' ';
      this.hiddenOverride = hiddenField.noAction;
      if ((this.tableType === TabTypes.EFFECTS_TRIGGERS ||this.tableType === TabTypes.ABILITIES_TRIGGERS) && conditionName === 'action_type2') {
        this.overrideLabel = this._field.label as string;
      }
      setTimeout(() => {
        if (this._field.width) {
          this.updateWidth.emit(this._field.width);
        }
        if (this._field.disabled) {
          this.fieldControl.disable();
          this.fieldControl.setValidators([]);
          this.fieldControl.updateValueAndValidity();
        } else {
          this.fieldControl.enable();
          const validators = [];
          if (this._field.require) {
            validators.push(Validators.required);
          }
          this.fieldControl.setValidators(validators);
          this.fieldControl.updateValueAndValidity();
        }
        this.changeDetectorRef.markForCheck();
      });
    }
    this.changeDetectorRef.markForCheck();
  }

  public getParams(): any {
    if (
      this.subForm === -1 &&
      this.subFormParent === -1 &&
      (this.form.get(this._field.name) as AbstractControl).errors
    ) {
      const errors = (this.form.get(this._field.name) as AbstractControl).errors as ValidationErrors;
      return {
        VIPLEVELSEQUENCEERROR: errors.vipLevelSequenceError ?? null,
        MIN: errors.min ? errors.min.min : null,
        MINNOTEQUAL: errors.minNotEqual ?? null,
        MAXNOTEQUAL: errors.maxNotEqual ?? null,
        MAX: errors.max ? errors.max.max : null,
        MAXLENGTH: errors.maxlength ? errors.maxlength.requiredLength : null,
      };
    } else if (this.subForm !== -1) {
      let errors: any;
      if (this.subFormParent !== -1) {
        errors = (
          (
            (this.form.get(this.subFormTypeParent) as FormArray)
              .at(this.subFormParent)
              .get(this.subFormType) as FormArray
          )
            .at(this.subForm)
            .get(this._field.name) as AbstractControl
        ).errors;
      } else {
        errors = (
          (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this._field.name) as AbstractControl
        ).errors;
      }
      if (errors) {
        return {
          VIPLEVELSEQUENCEERROR: errors.vipLevelSequenceError ?? null,
          MIN: errors.min ? errors.min.min : null,
          MINNOTEQUAL: errors.minNotEqual ?? null,
          MAXNOTEQUAL: errors.maxNotEqual ?? null,
          MAX: errors.max ? errors.max.max : null,
          MAXLENGTH: errors.maxlength ? errors.maxlength.requiredLength : null,
        };
      }
    }
    return {};
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private checkIfReadonly(): boolean {
    if (this.tableType === TabTypes.OPTION_CHOICE) {
      const deletableFieldControl = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        -1,
        '',
        'deletable',
      );
      if (deletableFieldControl) {
        return !deletableFieldControl.value;
      }
    } else if (
      this.tableType === TabTypes.BUILD_OBJECT &&
      this.subFormType === 'progresses' &&
      this._field.name === 'progress'
    ) {
      const progress = this.subFormService.getControl(
        this.form,
        this.subForm,
        this.subFormType,
        this.subFormParent,
        this.subFormTypeParent,
        'progress',
      );
      if (progress.value === 0 || progress.value === 100) {
        return true;
      }
    }
    return false;
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
