import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {FormControl, FormGroup} from '@angular/forms';
import {FormFieldConfig} from '../../../../models/configs';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {SubFormService} from '../../../../entry/sub-form.service';

@Component({
  selector: 'atv-fill-datetime-picker',
  templateUrl: './fill-datetime-picker.component.html',
  styleUrls: ['./fill-datetime-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FillDatetimePickerComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  datepickerControl = new FormControl('');
  private destroyer = new Subject();

  constructor(private readonly subFormService: SubFormService, private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.datepickerControl.valueChanges.pipe(takeUntil(this.destroyer)).subscribe((value) => {
      const date = new Date(value);
      if (this.field.fields?.year) {
        const yearControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          this.field.fields.year
        );
        yearControl.setValue(date.getFullYear());
      }
      if (this.field.fields?.month) {
        const monthControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          this.field.fields.month
        );
        monthControl.setValue(date.getMonth() + 1);
      }
      if (this.field.fields?.day) {
        const dayControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          this.field.fields.day
        );
        dayControl.setValue(date.getDate());
      }
      if (this.field.fields?.hour) {
        const hourControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          this.field.fields.hour
        );
        hourControl.setValue(date.getHours());
      }
      if (this.field.fields?.minute) {
        const minuteControl = this.subFormService.getControl(
          this.form,
          this.subForm,
          this.subFormType,
          this.subFormParent,
          this.subFormTypeParent,
          this.field.fields.minute
        );
        minuteControl.setValue(date.getMinutes());
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
