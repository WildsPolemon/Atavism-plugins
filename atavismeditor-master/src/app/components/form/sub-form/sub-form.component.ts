import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {DialogConfig, FormConfig, FormFieldType, SubFormType, TypeMap} from '../../../models/configs';
import {NotificationService} from '../../../services/notification.service';
import {DropdownValue} from '../../../models/configRow.interface';
import {TabTypes} from '../../../models/tabTypes.enum';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {DialogType} from '../../../models/types';
import {minNotEqualValidator} from '../../../validators/min-not-equal.validator';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'atv-sub-form',
  templateUrl: './sub-form.component.html',
  styleUrls: ['./sub-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubFormComponent implements OnInit, OnDestroy {
  @Input() public config!: FormConfig;
  @Input() public tableType!: TabTypes;
  @Input() public type!: string;
  @Input() public subFormConfig: SubFormType | undefined;
  @Input() public form!: FormGroup;
  @Input() public subForm!: any;
  @Input() public subForms!: TypeMap<string, any>;
  @Input() public hiddenItems = false;
  public formSubmitted = false;
  @Input() public set submitted(value: boolean) {
    this.formSubmitted = value;
    if (value) {
      this.form.markAllAsTouched();
    }
  }
  @Output() public hiddenItemsEmit = new EventEmitter();
  public fields: string[] = [];
  public FormFieldType = FormFieldType;
  public customOptions: Record<number, Record<string, DropdownValue[]>> = {};
  public TabTypes = TabTypes;
  public overrideWidth: Record<string, Record<number, number>> = {};
  public searchControl = new FormControl('');
  public isHiddenFormRow: Record<number, boolean> = {};
  private destroyer = new Subject();
  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key.toLowerCase() === 'enter') {
      e.preventDefault();
      return;
    }
  }

  constructor(
    private readonly matDialog: MatDialog,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notificationService: NotificationService,
    private readonly translate: TranslateService
  ) {}

  public ngOnInit(): void {
    this.parseFields();
    if (
      this.subFormConfig &&
      this.subFormConfig.minCount &&
      this.subFormConfig.minCount > 0 &&
      (this.form.get(this.type) as FormArray).length === 0
    ) {
      for (let i = 1; i <= this.subFormConfig.minCount; i++) {
        this.addSubForm();
      }
    }

    if (this.tableType === TabTypes.PLAYER_CHARACTER && this.type === 'stat') {
      this.searchControl.valueChanges.pipe(takeUntil(this.destroyer)).subscribe((value) => {
        this.isHiddenFormRow = {};
        for (let i = 0; i < (this.form.get(this.type) as FormArray).length; ++i) {
          const stat = ((this.form.get(this.type) as FormArray).at(i) as FormGroup).controls.stat;
          this.isHiddenFormRow[i] = stat.value.indexOf(value) === -1;
        }
      });
    }
  }

  public customTitle(i: number): string {
    if (this.subFormConfig && this.tableType === TabTypes.PLAYER_CHARACTER && this.type === 'stat') {
      return this.subFormConfig.title + ' ' + ((this.form.get(this.type) as FormArray).at(i).get('stat') as AbstractControl).value;
    }
    return '';
  }

  public addSubForm(): void {
    const subForm = new FormGroup({});
    const subFormValues: Record<string, {value: number | string}> = {};
    Object.keys(this.subForm).forEach((key) => {
      if (this.subForm[key].isArray) {
        subForm.addControl(key, new FormArray([]));
        if (this.tableType === TabTypes.BUILD_OBJECT && key === 'progresses') {
          for (let i = 1; i <= 2; i++) {
            const subSubForm = new FormGroup({});
            Object.keys(this.subForms[key]).forEach((subKey) => {
              if (subKey === 'progress') {
                subSubForm.addControl(subKey, new FormControl(i === 1 ? 0 : 100));
              } else {
                subSubForm.addControl(subKey, new FormControl(''));
              }
            });
            (subForm.get(key) as FormArray).push(subSubForm);
          }
        }
      } else {
        const validators = [];
        if (this.subForm[key].required) {
          validators.push(Validators.required);
        }
        if (this.subForm[key].min !== undefined) {
          validators.push(Validators.min(this.subForm[key].min));
        }
        if (this.subForm[key].minNotEqual !== undefined) {
          validators.push(minNotEqualValidator(this.subForm[key].minNotEqual, this.subForm[key].allowMinusOne));
        }
        if (this.subForm[key].max !== undefined) {
          validators.push(Validators.max(this.subForm[key].max));
        }
        if (!subFormValues[key]) {
          subFormValues[key] = {
            value: this.subForm[key].value,
          };
        }
        if (
          (this.tableType === TabTypes.ITEM_SETS && key === 'number_of_parts') ||
          (this.tableType === TabTypes.LEVELXP_PROFILE && key === 'level') ||
          (this.tableType === TabTypes.PET_PROFILE && key === 'level') ||
          (this.tableType === TabTypes.ENCHANT_PROFILE && key === 'level')
        ) {
          const allItems = (this.form.get(this.type) as FormArray).length;
          if (allItems > 0) {
            const prevValue = ((this.form.get(this.type) as FormArray).at(allItems - 1).get(key) as AbstractControl).value;
            subFormValues[key].value = +prevValue + 1;
          }
        }

        if (
          (this.tableType === TabTypes.PET_PROFILE && key === 'exp') ||
          (this.tableType === TabTypes.PET_PROFILE && key === 'template_id') ||
          (this.tableType === TabTypes.PET_PROFILE && key === 'slot_profile_id') ||
          (this.tableType === TabTypes.PET_PROFILE && key === 'coordEffect')
        ) {
          const allItems = (this.form.get(this.type) as FormArray).length;
          if (allItems > 0) {
            const prevValue = ((this.form.get(this.type) as FormArray).at(allItems - 1).get(key) as AbstractControl).value;
            subFormValues[key].value = prevValue;
          }
        }

        subForm.addControl(key, new FormControl(subFormValues[key].value, validators));
      }
    });
    (this.form.get(this.type) as FormArray).push(subForm);
    if (this.tableType === TabTypes.SKILL_PROFILES && this.type === 'levels') {
      this.hiddenItems = false;
      this.hiddenItemsEmit.emit(this.hiddenItems);
    }

    if (this.tableType === TabTypes.LOOT_TABLE) {
      const list = (this.form.get(this.type) as FormArray);
      let schance = 0;
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        const v = +(list.at(i).get('chance') as AbstractControl).value;
        count = 0;
        for (let j = 0; j < list.length; j++) {
          const cv = +(list.at(j).get('chance') as AbstractControl).value;
          if(cv === v){
            count++;
          }
        }
        if (i === 0){
          (list.at(i).get('chance2') as AbstractControl).patchValue(v / count);
          schance += v / count;
        } else {
          const pv = +(list.at(i - 1).get('chance') as AbstractControl).value;
          const pc = +(list.at(i - 1).get('chance2') as AbstractControl).value;
          (list.at(i).get('chance2') as AbstractControl).patchValue(v === pv ? pc : (v - schance) / count);
          schance += v === pv ? pc : (v - schance) / count;
        }
      }
    }

    this.changeDetectorRef.markForCheck();
  }

  public levelsToShow(type: string): number {
    return (this.form.get(type) as FormArray).length;
  }

  public showLevels(): void {
    this.hiddenItems = !this.hiddenItems;
    this.hiddenItemsEmit.emit(this.hiddenItems);
    this.changeDetectorRef.markForCheck();
  }

  public get showTitle(): boolean {
    if (this.tableType === TabTypes.SKILL_PROFILES && (this.type === 'levels' || this.type === 'level_diffs')) {
      return false;
    }
    if (!this.subFormConfig) {
      return false;
    }
    return (this.subFormConfig.title as string).length > 0;
  }

  public showRemoveButton(i: number): boolean {
    if (this.tableType === TabTypes.OPTION_CHOICE) {
      return ((this.form.get(this.type) as FormArray).at(i).get('deletable') as AbstractControl).value;
    }
    if ((this.tableType === TabTypes.SKILL_PROFILES && (this.type === 'levels' || this.type === 'level_diffs')) || !this.subFormConfig) {
      return false;
    }
    return !this.subFormConfig.freezeFirst || (this.subFormConfig.freezeFirst && i > 0);
  }

  public removeForm(i: number): void {
    console.log("remove Form "+i);
    let confirmDialogRef: DialogType<FuseConfirmDialogComponent> = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    confirmDialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroyer))
      .subscribe((result) => {
        if (result) {
          if (
            this.subFormConfig &&
            this.subFormConfig.minCount &&
            this.subFormConfig.minCount >= (this.form.get(this.type) as FormArray).length
          ) {
            this.notificationService.error(this.translate.instant('CONCLUSION.NOT_ALLOW_TO_REMOVE'));
          } else {
            (this.form.get(this.type) as FormArray).removeAt(i);
            if ((this.tableType === TabTypes.LEVELXP_PROFILE )||(this.tableType === TabTypes.PET_PROFILE )) {
              const fieldContainer = (this.form.get(this.type) as FormArray);
              for (let j = 0; j < fieldContainer.length; j++) {
                (fieldContainer.at(j).get('level') as AbstractControl).setValue(j + 1);
              }
            }
          }
          if (this.tableType === TabTypes.LOOT_TABLE) {
            const list = (this.form.get(this.type) as FormArray);
            let schance = 0;
            let count = 0;
            for (let i = 0; i < list.length; i++) {
              const v = +(list.at(i).get('chance') as AbstractControl).value;
              count = 0;
              for (let j = 0; j < list.length; j++) {
                const cv = +(list.at(j).get('chance') as AbstractControl).value;
                if(cv === v){
                  count++;
                }
              }
              if (i === 0){
                (list.at(i).get('chance2') as AbstractControl).patchValue(v / count);
                schance += v / count;
              } else {
                const pv = +(list.at(i - 1).get('chance') as AbstractControl).value;
                const pc = +(list.at(i - 1).get('chance2') as AbstractControl).value;
                (list.at(i).get('chance2') as AbstractControl).patchValue(v === pv ? pc : (v - schance) / count);
                schance += v === pv ? pc : (v - schance) / count;
              }
            }
          }
        }
        confirmDialogRef = undefined;

        this.changeDetectorRef.markForCheck();
      });
  }

  public removeLastSubForm(): void {
    let confirmDialogRef: DialogType<FuseConfirmDialogComponent> = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        (this.form.get(this.type) as FormArray).removeAt((this.form.get(this.type) as FormArray).length - 1);
      }
      confirmDialogRef = undefined;
      this.changeDetectorRef.markForCheck();
    });
  }

  public get allowMore(): boolean {
    if (this.subFormConfig && this.subFormConfig.maxCount) {
      return (this.form.get(this.type) as FormArray).length < this.subFormConfig.maxCount;
    }
    return true;
  }

  public getAllowToShow(i: number): boolean {
    if (this.tableType === TabTypes.ENCHANT_PROFILE && this.type) {
      if (((this.form.get(this.type) as FormArray).at(i).get('all_stats') as AbstractControl).value) {
        ((this.form.get(this.type) as FormArray).at(i).get('stats') as AbstractControl).disable();
        this.changeDetectorRef.markForCheck();
        return false;
      } else {
        ((this.form.get(this.type) as FormArray).at(i).get('stats') as AbstractControl).enable();
      }
    }
    this.changeDetectorRef.markForCheck();
    return true;
  }

  public get subFormTypes(): string[] {
    if (!this.subFormConfig || !this.subFormConfig.subForms) {
      return [];
    }
    return Object.keys(this.subFormConfig.subForms);
  }

  public get submitText(): string {
    if (this.subFormConfig && this.subFormConfig.submit && this.subFormConfig.submit.length > 0) {
      return this.subFormConfig.submit;
    }
    return '';
  }

  public get controls(): FormGroup[] {
    return (this.form.get(this.type) as FormArray).controls as FormGroup[];
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray((this.form.get(this.type) as FormArray).controls, event.previousIndex, event.currentIndex);
    if ((this.tableType === TabTypes.LEVELXP_PROFILE )||(this.tableType === TabTypes.PET_PROFILE )) {
      const fieldContainer = (this.form.get(this.type) as FormArray);
      for (let j = 0; j < fieldContainer.length; j++) {
        (fieldContainer.at(j).get('level') as AbstractControl).setValue(j + 1);
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  public updateWidth(field: string, i: number, width: number): void {
    if (!this.overrideWidth[field]) {
      this.overrideWidth[field] = {};
    }
    this.overrideWidth[field][i] = width;
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private parseFields(): void {
    if (this.subFormConfig) {
      Object.keys(this.subFormConfig.fields).forEach((key) => {
        this.fields.push(key);
      });
      this.changeDetectorRef.markForCheck();
    }
  }
}
