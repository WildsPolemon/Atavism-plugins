import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter,
  Input,
  OnDestroy,
  OnInit, Output,
  ViewEncapsulation
} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {FormFieldConfig, hiddenField, TypeMap} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';

@Component({
  selector: 'atv-boolean',
  templateUrl: './boolean.component.html',
  styleUrls: ['./boolean.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public errors: string[] = [];

  @Output() public updateWidth: EventEmitter<number> = new EventEmitter<number>();
  public overrideLabel = '';
  private destroyer = new Subject<void>();
  public disableTooltip = true;
  public hiddenOverride = 0;
  public hiddenField = hiddenField;

  constructor(private readonly subFormService: SubFormService, private readonly changeDetectorRef: ChangeDetectorRef) {}

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
    if (this.subFormType && this.subForm !== -1 && this.field.condition) {
      const keys = Object.keys(this.field.condition);
      const formContainer = (this.form.get(this.subFormType) as FormArray).controls[this.subForm];
      for (const key of keys) {
        if ((formContainer.get(key) as AbstractControl).value) {
          const valueStarting = (formContainer.get(key) as AbstractControl).value;
          const numValue = valueStarting ? 2 : 1;
          this.overrideLabel = this.field.condition[key][numValue].label
            ? this.field.condition[key][numValue].label
            : '';
          this.changeDetectorRef.markForCheck();
        }
        (formContainer.get(key) as AbstractControl).valueChanges
          .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
          .subscribe((changedValue) => {
            const numValue = changedValue ? 2 : 1;
            this.overrideLabel = (this.field.condition as TypeMap<string, any>)[key][numValue].label
              ? (this.field.condition as TypeMap<string, any>)[key][numValue].label
              : '';
            this.changeDetectorRef.markForCheck();
          });
      }
    }
    if (this.tableType === TabTypes.WEAPON_PROFILE && ['zoom'].includes(this.field.name)) {
      const numValue = this.getControl(this.field.conditionName as string).value ? '2' : '1';
      this.overWriteVariables(numValue);
      this.getControl(this.field.conditionName as string)
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          const _numValue = value ? '2' : '1';
          this.overWriteVariables(_numValue as string);
        });
    }
    if ([TabTypes.PLAYER_CHARACTER].includes(this.tableType) && ['serverPresent'].includes(this.field.name)) {
      if(!this.getControl('serverPresent').value) {
        this.getControl('sendToClient').patchValue(false);
      };

      this.getControl('sendToClient')
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if(value){
          ((this.form.get(this.subFormType) as FormArray)
            .at(this.subForm )
            .get('serverPresent') as AbstractControl
        ).patchValue(true);
            }
        });
    }

    if ([TabTypes.PLAYER_CHARACTER].includes(this.tableType) && ['sendToClient'].includes(this.field.name)) {
      this.getControl('serverPresent')
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if(!value){
            ((this.form.get(this.subFormType) as FormArray)
                .at(this.subForm )
                .get('sendToClient') as AbstractControl
            ).patchValue(false);
          }
        });
    }

    if ([TabTypes.STATS_PROFILE].includes(this.tableType) && ['serverPresent'].includes(this.field.name)) {
      if(!this.getControl('serverPresent').value) {
        this.getControl('send_to_client').patchValue(false);
      };

      this.getControl('send_to_client')
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if(value){
            ((this.form.get(this.subFormType) as FormArray)
                .at(this.subForm )
                .get('serverPresent') as AbstractControl
            ).patchValue(true);
          }
        });
    }

    if ([ TabTypes.STATS_PROFILE].includes(this.tableType) && ['send_to_client'].includes(this.field.name)) {
      this.getControl('serverPresent')
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          if(!value){
            ((this.form.get(this.subFormType) as FormArray)
                .at(this.subForm )
                .get('send_to_client') as AbstractControl
            ).patchValue(false);
          }
        });
    }

  }

  public get isHidden(): boolean {
    if (this.hiddenOverride !== hiddenField.noAction) {
      return this.hiddenOverride === hiddenField.hidden;
    }
    return this.field.hidden === hiddenField.hidden;
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private overWriteVariables(value: string): void {
    const overWrite = (this.field.condition as TypeMap<string, any>)[this.field.conditionName as string][value];
    if (!overWrite) {
      this.hiddenOverride = hiddenField.noAction;
      return;
    }
    this.hiddenOverride = overWrite.hidden || this.field.hidden;
    setTimeout(() => {
      if (overWrite.width) {
        this.updateWidth.emit(overWrite.width);
        this.changeDetectorRef.markForCheck();
      }
    }, 100);
    this.changeDetectorRef.markForCheck();
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
