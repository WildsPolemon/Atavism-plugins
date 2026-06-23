import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FormType} from '../../profiles/profile';
import {Translations} from '../translation';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

interface InputData {
  action: FormType;
  translations?: Translations;
}
@Component({
  selector: 'atv-translation-form',
  templateUrl: './translation-form.component.html',
  styleUrls: ['./translation-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TranslationFormComponent {
  public action: FormType;
  public form: FormGroup = this.fb.group({
    name: new FormControl('', [Validators.required.bind(Validators)]),
    code: new FormControl('', [Validators.required.bind(Validators)]),
    file: new FormControl('', [Validators.required.bind(Validators)]),
    selected: new FormControl(false),
  });
  public FormType = FormType;
  public uploadedFileContent = '';

  constructor(
    private readonly fb: FormBuilder,
    public matDialogRef: MatDialogRef<TranslationFormComponent>,
    @Inject(MAT_DIALOG_DATA) _data: InputData
  ) {
    this.action = _data.action;
    if (this.action === FormType.edit) {
      this.form.patchValue(_data.translations as Translations);
    }
  }

  public onFileChanged(event: Event): void {
    const selectedFile = ((event.target as HTMLInputElement).files as FileList)[0];
    const fileName = selectedFile.name;
    const fileReader = new FileReader();
    fileReader.readAsText(selectedFile, 'UTF-8');
    fileReader.onload = () => {
      this.uploadedFileContent = JSON.parse(fileReader.result as string);
      (this.form.get('file') as AbstractControl).patchValue(fileName);
    };
  }
}
