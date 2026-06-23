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
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {FormFieldConfig, hiddenField, TypeMap} from '../../../../models/configs';
import {Subject} from 'rxjs';
import {DynamicDropdownFieldConfig} from '../../../../models/configRow.interface';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-dynamic-dropdown',
  templateUrl: './dynamic-dropdown.component.html',
  styleUrls: ['./dynamic-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DynamicDropdownComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup | any;
  public _field!: FormFieldConfig;
  private fieldControl!: AbstractControl;
  private fieldConditionControl: AbstractControl | undefined;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public errors: string[] = [];
  @Input()
  public set field(value: FormFieldConfig) {
    this._field = value;
    this.fieldControl = this.getControl(this._field.name);
    if (this._field.conditionName) {
      this.fieldConditionControl = this.getControl(this._field.conditionName);
    }
  }
  @Output() public updateWidth: EventEmitter<number> = new EventEmitter<number>();
  public fieldConfigOverride!: DynamicDropdownFieldConfig;
  public labelOverride = '';
  public hiddenOverride = 0;
  public disabledOverride = 0;
  public allowNewOverride = false;
  public requireOverride = false;
  public isMultipleOverride = false;
  public hiddenField = hiddenField;
  private destroyer = new Subject();

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    if (this._field.disabled) {
      setTimeout(() => {
        this.fieldControl.disable();
        this.changeDetectorRef.markForCheck();
      });
    }
    if (
      this.fieldConditionControl &&
      ((this.tableType === TabTypes.SKILLS && ['skill_profile_id'].includes(this._field.name)) ||
        (this.tableType === TabTypes.QUESTS && ['editor_option_choice_type_id', 'target'].includes(this._field.name)) ||
        (this.tableType === TabTypes.ITEMS &&
          ['editor_option_choice_type_id', 'name'].includes(this._field.name) &&
          ['requirements', 'effects'].includes(this.subFormType)) ||
        (this.tableType === TabTypes.DIALOGUE && ['actionID', 'editor_option_choice_type_id'].includes(this._field.name)) ||
        (this.tableType === TabTypes.BUILD_OBJECT && ['interactionID'].includes(this._field.name)) ||
        (this.tableType === TabTypes.INTERACTIVE_OBJECT_PROFILE && ['interactionID'].includes(this._field.name)) ||
        ((this.tableType === TabTypes.EFFECTS_TRIGGERS || this.tableType === TabTypes.ABILITIES_TRIGGERS) && ['tags_ability', 'tags_effect', 'ability', 'effect'].includes(this._field.name)) ||
        (this.tableType === TabTypes.LEVELXP_REWARDS_PROFILE) ||
        (this.tableType === TabTypes.RANKINGS)
      )
    ) {
      if ((this._field.condition as TypeMap<string, any>)[this._field.conditionName as string][this.fieldConditionControl.value]) {
       // console.log(this.fieldConditionControl.value);
        this.overWriteVariables(this.fieldConditionControl.value);
      }
      this.fieldConditionControl.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer)).subscribe((value) => {
        console.log(value)
        setTimeout(() => {
          if (this._field.conditionName !== 'action_type2') {
            this.fieldControl.patchValue(null);
          }
          this.changeDetectorRef.markForCheck();
        });
        this.overWriteVariables(value);
      });
    }
    if(this.fieldConditionControl && (this.tableType === TabTypes.WEAPON_PROFILE && ['ability_id'].includes(this._field.name)) ){
      const numValue = this.getControl(this._field.conditionName as string).value ? '2' : '1';
      this.overWriteVariables(numValue);
      this.fieldConditionControl.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer)).subscribe((value) => {
        const _numValue = value ? '2' : '1';
        this.overWriteVariables(_numValue);
      });
    }

  }

  private overWriteVariables(value: string) {
    const overWrite = (this._field.condition as TypeMap<string, any>)[this._field.conditionName as string][value];
    if (!overWrite) {
      this.disabledOverride = 0;
      this.hiddenOverride = hiddenField.noAction;
      this.labelOverride = this._field.label as string;
      if (this._field.disabled) {
        setTimeout(() => {
          this.fieldControl.disable();
          this.changeDetectorRef.markForCheck();
        });
      }
      return;
    }
    if (overWrite.disabled) {
      this.disabledOverride = 1;
      setTimeout(() => {
        this.fieldControl.disable();
        this.changeDetectorRef.markForCheck();
      });
    } else {
      this.disabledOverride = 2;
      setTimeout(() => {
        this.fieldControl.enable();
        this.changeDetectorRef.markForCheck();
      });
    }
    this.allowNewOverride = overWrite.allowNew || this._field.allowNew;
    if (overWrite.fieldConfig && Object.keys(overWrite.fieldConfig).length > 0) {
      this.fieldConfigOverride = overWrite.fieldConfig;
    }
    this.hiddenOverride = overWrite.hidden || this._field.hidden;
    this.labelOverride = overWrite.label || this._field.label;
    this.isMultipleOverride = overWrite.multiple || this._field.multiple;
    this.requireOverride = overWrite.require || this._field.require;
    setTimeout(() => {
      if (overWrite.width) {
        this.updateWidth.emit(overWrite.width);
        this.changeDetectorRef.markForCheck();
      }
    }, 100);
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private getControl(name: string): AbstractControl {
    if (this.subForm !== -1 && this.subFormParent !== -1) {
      return ((this.form.get(this.subFormTypeParent) as FormArray).at(this.subFormParent).get(this.subFormType) as FormArray).controls[
        this.subForm
      ].get(name) as AbstractControl;
    } else if (this.subForm !== -1) {
      return (this.form.get(this.subFormType) as FormArray).controls[this.subForm].get(name) as AbstractControl;
    } else {
      return this.form.get(name) as AbstractControl;
    }
  }
}
