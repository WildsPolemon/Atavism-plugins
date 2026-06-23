import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {DialogConfig, FormFieldType, SubFormType} from '../../../models/configs';
import {NotificationService} from '../../../services/notification.service';
import {DropdownValue} from '../../../models/configRow.interface';
import {TabTypes} from '../../../models/tabTypes.enum';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MatDialogRef} from '@angular/material/dialog/dialog-ref';
import {minNotEqualValidator} from '../../../validators/min-not-equal.validator';

@Component({
  selector: 'atv-sub-sub-form',
  templateUrl: './sub-sub-form.component.html',
  styleUrls: ['./sub-sub-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubSubFormComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public type!: string;
  @Input() public subFormConfig?: SubFormType;
  @Input() public form!: FormGroup;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormFields!: any;
  @Input() public set submitted(value: boolean) {
    if (value) {
      this.form.markAllAsTouched();
    }
  }

  public fields: string[] = [];
  public FormFieldType = FormFieldType;
  public customOptions: Record<number, Record<string, DropdownValue[]>> = {};
  public overrideWidth: Record<string, Record<number, number>> = {};
  private destroyer = new Subject();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notificationService: NotificationService,
    private readonly translate: TranslateService
  ) {}

  public ngOnInit(): void {
    this.parseFields();
    if (this.subFormConfig && this.subFormConfig.minCount && this.subFormConfig.minCount > 0 && this.controls.length === 0) {
      for (let i = 1; i <= this.subFormConfig.minCount; i++) {
        this.addSubForm();
      }
    }
  }

  public get controls(): AbstractControl[] {
    const parentForm = (this.form.get(this.subFormType) as FormArray).at(this.subForm);
    if (parentForm.get(this.type)) {
      return (parentForm.get(this.type) as FormArray).controls;
    }
    return [];
  }

  public addSubForm(): void {
    const subForm = new FormGroup({});
    Object.keys(this.subFormFields).forEach((key) => {
      const validators = [];
      if (this.subFormFields[key].required) {
        validators.push(Validators.required);
      }
      if (this.subFormFields[key].min !== undefined) {
        validators.push(Validators.min(this.subFormFields[key].min));
      }
      if (this.subFormFields[key].minNotEqual !== undefined) {
        validators.push(minNotEqualValidator(this.subFormFields[key].minNotEqual, this.subFormFields[key].allowMinusOne));
      }
      if (this.subFormFields[key].max !== undefined) {
        validators.push(Validators.max(this.subFormFields[key].max));
      }
      subForm.addControl(key, new FormControl(this.subFormFields[key].value, validators));
    });
    ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.type) as FormArray).push(subForm);
    this.changeDetectorRef.markForCheck();
  }

  public showRemoveButton(i: number): boolean {
    if (this.tableType === TabTypes.BUILD_OBJECT && this.type === 'progresses') {
      const progressValue = (((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.type) as FormArray)
        .at(i)
        .get('progress') as AbstractControl).value;
      return progressValue !== 0 && progressValue !== 100;
    }
    if (!this.subFormConfig) {
      return false;
    }
    return !this.subFormConfig.freezeFirst || (this.subFormConfig.freezeFirst && i > 0);
  }

  public removeForm(i: number): void {
    let confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent> | undefined = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    confirmDialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroyer))
      .subscribe((result) => {
        if (result) {
          if (this.subForm === -1) {
            if (
              this.subFormConfig &&
              this.subFormConfig.minCount &&
              this.subFormConfig.minCount >= (this.form.get(this.type) as FormArray).length
            ) {
              this.notificationService.error(this.translate.instant('CONCLUSION.NOT_ALLOW_TO_REMOVE'));
            } else {
              (this.form.get(this.type) as FormArray).removeAt(i);
            }
          } else if (this.subForm !== -1) {
            const typeControls = (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.type) as FormArray;
            if (this.subFormConfig && this.subFormConfig.minCount && this.subFormConfig.minCount >= typeControls.length) {
              this.notificationService.error(this.translate.instant('CONCLUSION.NOT_ALLOW_TO_REMOVE'));
            } else {
              typeControls.removeAt(i);
            }
          }
        }
        confirmDialogRef = undefined;
        this.changeDetectorRef.markForCheck();
      });
  }

  public get allowMore(): boolean {
    if (this.subFormConfig && this.subFormConfig.maxCount) {
      if (this.subFormConfig && this.subFormConfig.maxCount && this.subFormConfig.countSubForms) {
        var count = 0;
        Object.keys(this.subFormConfig.countSubForms).forEach((key) => {
          count += ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(key) as FormArray).length;
        });
        return (count < this.subFormConfig.maxCount);
      } else if (this.subForm === -1) {
        return (this.form.get(this.type) as FormArray).length < this.subFormConfig.maxCount;
      } else {
        return (
          ((this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.type) as FormArray).length < this.subFormConfig.maxCount
        );
      }
    }
    return true;
  }

  public get title(): string {
    if (this.subFormConfig && this.subFormConfig.title && this.subFormConfig.title.length > 0) {
      return this.subFormConfig.title;
    }
    return '';
  }

  public get submitText(): string {
    if (this.subFormConfig && this.subFormConfig.submit && this.subFormConfig.submit.length > 0) {
      return this.subFormConfig.submit;
    }
    return '';
  }

  public updateWidth(field: string, i: number, width: number): void {
    if (!this.overrideWidth[field]) {
      this.overrideWidth[field] = {};
    }
    this.overrideWidth[field][i] = width;
    this.changeDetectorRef.markForCheck();
  }

  private parseFields(): void {
    if (this.subFormConfig) {
      Object.keys(this.subFormConfig.fields).forEach((key) => {
        this.fields.push(key);
      });
      this.changeDetectorRef.markForCheck();
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
