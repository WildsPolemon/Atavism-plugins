import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FormFieldConfig, FormFieldType} from '../../../models/configs';
import {DropdownValue} from '../../../models/configRow.interface';
import {TabTypes} from '../../../models/tabTypes.enum';
import {SubFormService} from '../../../entry/sub-form.service';

@Component({
  selector: 'atv-fields-container',
  templateUrl: './fields-container.component.html',
  styleUrls: ['./fields-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FieldsContainerComponent {
  @Input() public tableType!: TabTypes;
  @Input() public type!: FormFieldType;
  @Input() public form!: FormGroup;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public customOptions: DropdownValue[] = [];
  @Input() public field!: FormFieldConfig;
  @Output() public updateWidth: EventEmitter<number> = new EventEmitter<number>();
  public FormFieldType = FormFieldType;

  constructor(private readonly subFormService: SubFormService) {}

  public get errors(): string[] {
    const field = this.subFormService.getControl(
      this.form,
      this.subForm,
      this.subFormType,
      this.subFormParent,
      this.subFormTypeParent,
      this.field.name
    );
    if (field && (field.dirty || field.touched) && field.errors) {
      return Object.keys(field.errors).map((key) => key.toUpperCase());
    }
    return [];
  }
}
