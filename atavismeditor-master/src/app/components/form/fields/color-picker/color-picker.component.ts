import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, Inject,
  Input, NgModule,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {DialogConfig, FormFieldConfig, FormFieldType} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Theme} from '../../../../settings/theme-settings/themes.service';
import {FormType} from '../../../../settings/profiles/profile';

@Component({
  selector: 'atv-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public errors: string[] = [];
  public FormFieldType = FormFieldType;
  public disableTooltip = true;
  public formField: AbstractControl;
  private destroyer = new Subject();
  public action: FormType;
  public FormType = FormType;
  public color = '';
  constructor(
    private readonly matDialog: MatDialog,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    public matDialogRef: MatDialogRef<ColorPickerComponent>,
    @Inject(MAT_DIALOG_DATA) _data: {action: FormType; theme: Theme},
  ) {}

  public ngOnInit(): void {
    if (this.subFormType && this.subForm !== -1) {
      this.color = (
        (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.field.name) as AbstractControl
      ).value;
    } else {
      this.color = (this.form.get(this.field.name) as AbstractControl).value;
    }

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

    this.formField = this.subFormService.getControl(this.form, this.subForm, this.subFormType, -1, '', this.field.name);
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public clearSelected(): void {
    this.formField.setValue('');
  }

  public PathValue(value: string) {
    (
      (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.field.name) as AbstractControl
    ).patchValue(value);
  }
  public getControl(){
    return (this.form.get(this.subFormType) as FormArray).at(this.subForm).get(this.field.name) as AbstractControl;
  }

}
