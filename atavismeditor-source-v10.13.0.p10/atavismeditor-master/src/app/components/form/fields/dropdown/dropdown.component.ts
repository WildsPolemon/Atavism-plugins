import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {FormFieldConfig, hiddenField, TypeMap} from '../../../../models/configs';
import {DropdownValue} from '../../../../models/configRow.interface';
import {TabTypes} from '../../../../models/tabTypes.enum';
import {SubFormService, TableTooltip} from '../../../../entry/sub-form.service';

@Component({
  selector: 'atv-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent implements OnInit, OnDestroy {
  @Input() public tableType!: TabTypes;
  @Input() public form!: FormGroup;
  @Input() public field!: FormFieldConfig;
  public data: DropdownValue[] = [];
  private _options: DropdownValue[] = [];
  @Input() public set options(values: DropdownValue[] | undefined) {
    if (!values) {
      values = [];
    }
    this.data = values;
    this._options = values;
  }
  @Input() public set customOptions(values: DropdownValue[]) {
    if (values && values.length > 0) {
      this.data = values;
      this._options = values;
    }
  }
  @Input() public subForm = -1;
  @Input() public subFormType = '';
  @Input() public subFormParent = -1;
  @Input() public subFormTypeParent = '';
  @Input() public errors: string[] = [];
  public searchFilter: Record<string, any> = {};
  private destroyer = new Subject();
  public disableTooltip = true;
  public hiddenOverride = 0;

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
    if (this.field.search) {
      this.searchFilter[this.field.name] = new FormControl();
      this.searchFilter[this.field.name].valueChanges.pipe(takeUntil(this.destroyer)).subscribe((query: string) => {
        this.data = [
          ...this._options.filter(
            (item: DropdownValue) => item.value.toLowerCase().indexOf(query.toLowerCase()) !== -1,
          ),
        ];
      });
    }
    if (this.tableType === TabTypes.EFFECTS_TRIGGERS && ['target'].includes(this.field.name)) {
      if (
        (this.field.condition as TypeMap<string, any>)[this.field.conditionName as string][
          this.getControl(this.field.conditionName as string).value
          ]
      ) {
        this.overWriteVariables(this.getControl(this.field.conditionName as string).value);
      }
      this.getControl(this.field.conditionName as string)
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          setTimeout(() => {
            if (this.field.conditionName !== 'action_type2') {
              this.getControl(this.field.name).patchValue(null);
            }
            this.changeDetectorRef.markForCheck();
          });
          this.overWriteVariables(value);
        });
    }
    if (this.tableType === TabTypes.ABILITIES_TRIGGERS && ['target'].includes(this.field.name)) {
      if (
        (this.field.condition as TypeMap<string, any>)[this.field.conditionName as string][
          this.getControl(this.field.conditionName as string).value
          ]
      ) {
        this.overWriteVariables(this.getControl(this.field.conditionName as string).value);
      }
      this.getControl(this.field.conditionName as string)
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          setTimeout(() => {
            if (this.field.conditionName !== 'action_type2') {
              this.getControl(this.field.name).patchValue(null);
            }
            this.changeDetectorRef.markForCheck();
          });
          this.overWriteVariables(value);
        });
    }
    if (this.tableType === TabTypes.RANKINGS
      && !['type'].includes(this.field.name)
    ) {
     // console.log(this.field.name);
      if (
        (this.field.condition as TypeMap<string, any>)[this.field.conditionName as string][
          this.getControl(this.field.conditionName as string).value
          ]
      ) {
        console.log(this.getControl(this.field.conditionName as string).value);
        this.overWriteVariables(this.getControl(this.field.conditionName as string).value);
      }
      this.getControl(this.field.conditionName as string)
        .valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroyer))
        .subscribe((value) => {
          // setTimeout(() => {
          //   //if (this.field.conditionName !== 'type') {
          //     this.getControl(this.field.name).patchValue(null);
          //  // }
          //   this.changeDetectorRef.markForCheck();
          // });
          console.log(value);
          this.overWriteVariables(value);
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
