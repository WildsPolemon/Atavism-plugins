import {Component, Input, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FormFieldConfig} from '../../../../models/configs';
import {TabTypes} from '../../../../models/tabTypes.enum';

@Component({
  selector: 'atv-hidden',
  templateUrl: './hidden.component.html',
  styleUrls: ['./hidden.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HiddenComponent {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  @Input() public subForm = -1;
  @Input() public subFormType = '';
}
