import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  FormInputData,
  SubFormType,
  TypeMap,
} from '../../models/configs';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {TabTypes} from '../../models/tabTypes.enum';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {SubFormService, TableTooltip} from '../../entry/sub-form.service';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import {interval, Subject} from 'rxjs';
import {TooltipHelperComponent} from './tooltip-helper/tooltip-helper.component';
import {TranslateService} from '@ngx-translate/core';
import {getProfilePipe, Utils} from "../../directives/utils";
import {DataBaseProfile, DataBaseType} from "../../settings/profiles/profile";
import {ProfilesService} from "../../settings/profiles/profiles.service";
import {Stat} from "../../entry/stat/stat.service";
import {DatabaseService} from "../../services/database.service";
import {characterTemplateTable, statsTable, statThresholdTable} from "../../entry/tables.data";
import {NotificationService} from "../../services/notification.service";

@Component({
  selector: 'atv-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent implements OnInit, OnDestroy {
  public form!: FormGroup;
  public subForms!: TypeMap<string, any>;
  public config!: FormConfig;
  public DialogCloseType = DialogCloseType;
  public FormFieldType = FormFieldType;
  public TabTypes = TabTypes;
  public hiddenLevels = true;
  public showTooltip = false;
  public overrideWidth: Record<string, number> = {};
  public submitted = false;
  public tooltip = '';
  public dbProfile!: DataBaseProfile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly matDialog: MatDialog,
    private readonly profilesService: ProfilesService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly translateService: TranslateService,
    private readonly subFormService: SubFormService,
    private readonly databaseService: DatabaseService,
    private readonly notification: NotificationService,
    public matDialogRef: MatDialogRef<FormComponent>,
    @Inject(MAT_DIALOG_DATA) private data: FormInputData,
  ) {
    this.form = this.data.form;
    this.subForms = this.data.subForms;
    this.config = this.data.config;
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'enter' && !(event.target as HTMLElement)?.classList.contains('textarea-custom')) {
      this.submitForm(DialogCloseType.update);
    }
  }

  public ngOnInit(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
      }
    });
    this.tooltip = this.config.tooltip ?? this.translateService.instant(`${this.config.type}.TITLE_TOOLTIP`);
    this.subFormService.showTooltips
      .pipe(
        filter(() => !!this.config.type),
        map((tables) => tables.find((item) => item.table === this.config.type) as TableTooltip),
        filter((tableTooltip: TableTooltip) => !!tableTooltip),
        map((tableTooltip: TableTooltip) => tableTooltip.value),
        takeUntil(this.destroyer),
      )
      .subscribe((showTooltip) => {
        this.showTooltip = showTooltip;
        this.changeDetectorRef.markForCheck();
      });
    this.form.statusChanges.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.changeDetectorRef.markForCheck();
    });
  }

  public openHelp(): void {
    if (this.tooltip !== `${this.config.type}.TITLE_TOOLTIP`) {
      const helperComp = this.matDialog.open(TooltipHelperComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      helperComp.componentInstance.message = this.tooltip;
    }
  }

  public get subFormTypes(): string[] {
    if (!this.config.subForms) {
      return [];
    }
    return Object.keys(this.config.subForms);
  }

  public async submitForm(action: DialogCloseType): Promise<void> {
    if(!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(key, control.errors);
        }
      });
    }
    if (this.form.valid) {
      if (action === DialogCloseType.save_as_new) {
        const item = this.form.getRawValue();
        if (this.config.type === TabTypes.STATS) {
          const exists = await this.databaseService.queryItem<Stat>(this.dbProfile, statsTable, 'name', item.name);
          if (exists) {
            this.notification.error(this.translateService.instant(TabTypes.STATS + '.DUPLICATED_NAME'));
            this.form.get('name').setErrors({DUPLICATED_VALUE: true});
            this.form.markAllAsTouched();
            return;
          }
        } else if(this.config.type === TabTypes.THRESHOLDS) {
          const exists = await this.databaseService.customQuery(
            this.dbProfile,
            `SELECT DISTINCT stat_function as count FROM ${statThresholdTable} WHERE stat_function = ?`,
            [item.stat_function]
          );
          if (exists.length > 0) {
            this.notification.error(this.translateService.instant('CONCLUSION.DUPLICATION_ERROR'));
            this.form.get('stat_function').setErrors({DUPLICATED_VALUE: true});
            this.form.markAllAsTouched();
            return;
          }
        } else if(this.config.type === TabTypes.PLAYER_CHARACTER) {
          const isUsed = await this.databaseService.customQuery(
            this.dbProfile,
            `SELECT * FROM ${characterTemplateTable} WHERE race = ? AND aspect = ?`,
            [item.race, item.aspect],
          );
          if (isUsed.length > 0) {
            this.notification.error(this.translateService.instant(TabTypes.PLAYER_CHARACTER + '.ALREADY_USED'));
            this.form.get('race').setErrors({DUPLICATED_VALUE: true});
            this.form.get('aspect').setErrors({DUPLICATED_VALUE: true});
            this.form.markAllAsTouched();
            return;
          }
        }
      }
      this.matDialogRef.close([this.form, action]);
    } else {
      let fields: string[] = Object.keys(this.config.fields);
      if (this.config.orderFields) {
        fields = this.sortFields();
      }
      let firstField = fields.find(
        (field) => this.form.controls[field] && !this.form.controls[field].valid && this.form.controls[field].enabled,
      );
      if (!firstField && this.config.subForms) {
        firstField = this.getFirstSubFieldError(Object.keys(this.config.subForms));
      }
      if (firstField) {
        const targetElement = document.getElementById('field_' + firstField);
        if (targetElement) {
          interval(650)
            .pipe(take(1))
            .subscribe(() => targetElement.scrollIntoView({behavior: 'smooth'}));
        }
      }
      this.submitted = true;
      this.form.markAllAsTouched();
      this.form.markAsDirty();
      this.changeDetectorRef.markForCheck();
    }
  }

  public get fields(): string[] {
    if (this.config.orderFields) {
      return this.sortFields();
    }
    return Object.keys(this.config.fields);
  }

  public generateLevels(): void {
    const percentageValue = (this.form.get('percentage_value') as AbstractControl).value;
    (this.form.get('levels') as FormArray).clear();
    const levelExp: number[] = [];
    for (let i = 0; i < (this.form.get('level_value') as AbstractControl).value; ++i) {
      let value = 0;
      if (i > 0) {
        const basePercentage = parseInt((levelExp[i - 1] * percentageValue) / 100 + '', 10);
        value = levelExp[i - 1] + basePercentage;
        if (value > 2000000000) {
          value = 2000000000;
        }
      } else {
        value = +(this.form.get('base_value') as AbstractControl).value;
      }
      value = parseInt(value + '', 10);
      const subForm = new FormGroup({});
      subForm.addControl('required_xp', new FormControl(value, [Validators.required, Validators.min(1)]));
      (this.form.get('levels') as FormArray).push(subForm);
      levelExp.push(value);
    }
    this.changeDetectorRef.markForCheck();
  }

  public get levelsToShow(): number {
    return (this.form.get('levels') as FormArray).length;
  }

  public toggleTooltips(event: MatSlideToggleChange): void {
    this.subFormService.toggleTooltip(this.config.type, event.checked);
    this.changeDetectorRef.markForCheck();
  }

  public showLevels(): void {
    this.hiddenLevels = !this.hiddenLevels;
    this.changeDetectorRef.markForCheck();
  }

  public updateHiddenItems(value: boolean): void {
    this.hiddenLevels = value;
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public updateWidth(field: string, width: number): void {
    this.overrideWidth[field] = width;
    this.changeDetectorRef.markForCheck();
  }

  private sortFields(): string[] {
    const subFields: {order: number; key: string}[] = [];
    Object.keys(this.config.fields).forEach((key) => {
      subFields.push({order: this.config.fields[key].order as number, key});
    });
    return subFields.sort((a, b) => a.order - b.order).map((item) => item.key);
  }

  private getFirstSubFieldError(subForms: string[]): string {
    for (const subForm of subForms) {
      const formGroups = (this.form.get(subForm) as FormArray).controls as FormGroup[];
      if (formGroups.length) {
        for (const formGroup of formGroups) {
          for (const key of Object.keys(formGroup.controls)) {
            if (
              this.config.subForms &&
              this.config.subForms[subForm].subForms &&
              (this.config.subForms[subForm].subForms as TypeMap<string, SubFormType>)[key]
            ) {
              const subFormGroups = (formGroup.controls[key] as FormArray).controls as FormGroup[];
              for (const subFormGroup of subFormGroups) {
                for (const subKey of Object.keys(subFormGroup.controls)) {
                  const subControl = subFormGroup.controls[subKey];
                  if (!subControl.valid) {
                    return `${formGroups.indexOf(formGroup)}_${subFormGroups.indexOf(subFormGroup)}_${subKey}`;
                  }
                }
              }
            } else {
              const control = formGroup.controls[key];
              if (!control.valid) {
                return `${formGroups.indexOf(formGroup)}_${key}`;
              }
            }
          }
        }
      }
    }
    return '';
  }
}
