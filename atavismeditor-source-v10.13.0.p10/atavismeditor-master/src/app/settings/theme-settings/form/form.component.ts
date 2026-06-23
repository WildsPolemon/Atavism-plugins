import {Component, Inject} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FormType} from '../../profiles/profile';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Theme} from '../themes.service';

@Component({
  selector: 'atv-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent {
  public form: FormGroup = this.fb.group({
    name: new FormControl('', Validators.required.bind(Validators)),
    size: new FormControl('font-size-normal', Validators.required.bind(Validators)),
    colorTheme: new FormControl('theme-default', Validators.required.bind(Validators)),
    tooltipSize: new FormControl('tooltip-font-size-normal', Validators.required.bind(Validators)),
    mainColor: '',
    secondaryColor: '',
    textColor: '',
    textSecondaryColor: '',
    primaryColor: '',
    accentColor: '',
    warnColor: '',
  });
  public action: FormType;
  public FormType = FormType;
  public mainColor = '';
  public secondaryColor = '';
  public textColor = '';
  public textSecondaryColor = '';
  public primaryColor = '';
  public accentColor = '';
  public warnColor = '';

  constructor(
    private readonly fb: FormBuilder,
    public matDialogRef: MatDialogRef<FormComponent>,
    @Inject(MAT_DIALOG_DATA) _data: {action: FormType; theme: Theme},
  ) {
    this.action = _data.action;
    if (this.action === FormType.edit) {
      this.form.patchValue(_data.theme);
      this.mainColor = _data.theme.mainColor;
      this.secondaryColor = _data.theme.secondaryColor;
      this.textColor = _data.theme.textColor;
      this.textSecondaryColor = _data.theme.textSecondaryColor;
      this.primaryColor = _data.theme.primaryColor;
      this.accentColor = _data.theme.accentColor;
      this.warnColor = _data.theme.warnColor;
      (this.form.get('mainColor') as AbstractControl).patchValue(_data.theme.mainColor);
      (this.form.get('secondaryColor') as AbstractControl).patchValue(_data.theme.secondaryColor);
      (this.form.get('textColor') as AbstractControl).patchValue(_data.theme.textColor);
      (this.form.get('textSecondaryColor') as AbstractControl).patchValue(_data.theme.textSecondaryColor);
      (this.form.get('primaryColor') as AbstractControl).patchValue(_data.theme.primaryColor);
      (this.form.get('accentColor') as AbstractControl).patchValue(_data.theme.accentColor);
      (this.form.get('warnColor') as AbstractControl).patchValue(_data.theme.warnColor);
    }
  }
}
