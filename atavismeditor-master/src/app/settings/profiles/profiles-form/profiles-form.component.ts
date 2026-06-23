import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AddButtonPosition, dataBase, DataBaseProfile, DataBaseType, FormType, Profile, ProfileType} from '../profile';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../../services/database.service';
import {NotificationService} from '../../../services/notification.service';
import {IMAGE_SIZE, ImageService} from '../../../components/image/image.service';
import {
  abilitiesTable,
  buildObjectTable,
  craftingRecipesTable,
  currenciesTable,
  effectsTable,
  itemTemplatesTable,
  skillsTable,
} from '../../../entry/tables.data';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {InputData, ProfilesService} from '../profiles.service';
import {ElectronService} from '../../../services/electron.service';
import {DialogConfig, FormFieldConfig, FormFieldType} from '../../../models/configs';
import {TabTypes} from '../../../models/tabTypes.enum';
import {SubFormService, TableTooltip} from '../../../entry/sub-form.service';
import {interval, Subject} from 'rxjs';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import {TooltipHelperComponent} from '../../../components/form/tooltip-helper/tooltip-helper.component';

interface IconReSave {
  profile: DataBaseType;
  table: string;
  base: string;
  src: string;
  dest: string;
  where: string;
}

@Component({
  selector: 'atv-profiles-form',
  templateUrl: './profiles-form.component.html',
  styleUrls: ['./profiles-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesFormComponent implements OnInit {
  public action: FormType;
  public tableType = TabTypes.PROFILES;
  public form: FormGroup = this.fb.group({
    name: new FormControl('', [Validators.required.bind(Validators)]),
    type: new FormControl(ProfileType.Unity, [Validators.required.bind(Validators)]),
    folder: new FormControl('', [Validators.required.bind(Validators)]),
    mobFolder: new FormControl('/Assets/Resources', [Validators.required.bind(Validators)]),
    itemFolder: new FormControl('/Assets/Resources/Content/EquipmentDisplay', [Validators.required.bind(Validators)]),
    buildObjectFolder: new FormControl('/Assets/Resources/Content/BuildObjects', [
      Validators.required.bind(Validators),
    ]),
    coordFolder: new FormControl('/Assets/Resources/Content/CoordinatedEffects', [
      Validators.required.bind(Validators),
    ]),
    syncFolder: new FormControl('/Assets', [Validators.required.bind(Validators)]),
    defaultImage: new FormControl('', [Validators.required.bind(Validators)]),
    meta: new FormControl('textureType: 8', [Validators.required.bind(Validators)]),
    delay: new FormControl(500),
    notificationDelay: new FormControl(25),
    image_width: new FormControl(IMAGE_SIZE),
    image_height: new FormControl(IMAGE_SIZE),
    limit: new FormControl(10),
    iconsToShow: new FormControl(50),
    buttonPosition: new FormControl(AddButtonPosition.right),
    defaultIsActiveFilter: new FormControl('-1'),
    databases: this.fb.array([
      this.createSubDatabase(DataBaseType.admin),
      this.createSubDatabase(DataBaseType.atavism),
      this.createSubDatabase(DataBaseType.master),
      this.createSubDatabase(DataBaseType.world_content),
    ]),
  });
  public ProfileType = ProfileType;
  public formFields: Record<string, FormFieldConfig> = {
    name: {name: 'name', type: FormFieldType.input, require: true, length: 1000},
    type: {
      name: 'type',
      type: FormFieldType.dropdown,
      require: true,
      allowNew: false,
      data: [
        {id: ProfileType.Unity, value: ProfileType.Unity},
        {id: ProfileType.Unreal, value: ProfileType.Unreal},
      ],
    },
    meta: {name: 'meta', type: FormFieldType.input, require: true, length: 1000},
    mobFolder: {name: 'mobFolder', type: FormFieldType.folderSelector, require: true, length: 1000},
    folder: {name: 'folder', type: FormFieldType.folderSelector, require: true, length: 1000},
    itemFolder: {name: 'itemFolder', type: FormFieldType.folderSelector, require: true, length: 1000},
    buildObjectFolder: {name: 'buildObjectFolder', type: FormFieldType.folderSelector, require: true, length: 1000},
    coordFolder: {name: 'coordFolder', type: FormFieldType.folderSelector, require: true, length: 1000},
    syncFolder: {name: 'syncFolder', type: FormFieldType.folderSelector, require: true, length: 1000},
    delay: {name: 'delay', type: FormFieldType.input, require: true, length: 1000},
    notificationDelay: {name: 'notificationDelay', type: FormFieldType.input, require: true, length: 1000},
    limit: {name: 'limit', type: FormFieldType.input, require: true, length: 1000},
    defaultImage: {
      name: 'defaultImage',
      type: FormFieldType.file,
      acceptFolder: '',
      require: true,
      acceptTitle: this.translate.instant('FILE_TYPE.IMAGES'),
      accept: 'png,gif,jpg,jpeg,psd,tga,bmp',
      length: 1000,
    },
    iconsToShow: {name: 'iconsToShow', type: FormFieldType.input, require: true, length: 1000},
    defaultIsActiveFilter: {
      name: 'defaultIsActiveFilter',
      type: FormFieldType.dropdown,
      require: true,
      allowNew: false,
      data: [
        {id: '-1', value: this.translate.instant('TABLE.ALL')},
        {id: '1', value: this.translate.instant('GENERAL.ONLY_ACTIVE')},
        {id: '0', value: this.translate.instant('GENERAL.NOT_ACTIVE')},
      ],
    },
    image_width: {name: 'image_width', type: FormFieldType.input, require: true, length: 1000},
    image_height: {name: 'image_height', type: FormFieldType.input, require: true, length: 1000},
    host: {name: 'host', type: FormFieldType.input, require: true, length: 1000},
    port: {name: 'port', type: FormFieldType.input},
    database: {name: 'database', type: FormFieldType.input, require: true, length: 1000},
    user: {name: 'user', type: FormFieldType.input, require: true, length: 1000},
    password: {name: 'password', type: FormFieldType.input, require: true, length: 1000},
  };
  public FormType = FormType;
  public dataBase = dataBase;
  public disableTooltip = true;
  public oneProfileMode = false;
  public AddButtonPosition = AddButtonPosition;
  public tooltip = this.translate.instant(`${TabTypes.PROFILES}.TITLE_TOOLTIP`);
  private readonly currentFolder: string = '';
  private readonly profile?: Profile;
  private readonly iconsPlaces: IconReSave[] = [
    {
      profile: DataBaseType.world_content,
      table: currenciesTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: craftingRecipesTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: buildObjectTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: skillsTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: effectsTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: itemTemplatesTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
    {
      profile: DataBaseType.world_content,
      table: abilitiesTable,
      base: 'id',
      src: 'icon',
      dest: 'icon2',
      where: ' AND isactive = 1 ',
    },
  ];
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly matDialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly notification: NotificationService,
    private readonly imageService: ImageService,
    private readonly profileService: ProfilesService,
    private readonly electronService: ElectronService,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    public matDialogRef: MatDialogRef<ProfilesFormComponent>,
    @Inject(MAT_DIALOG_DATA) _data: InputData,
  ) {
    this.oneProfileMode = this.profileService.oneProfileMode;
    this.action = _data.action;
    this.currentFolder = '';
    const folder = _data.folder ? _data.folder : '';
    if (this.action === FormType.edit || this.action === FormType.duplicate) {
      _data.profile.defaultIsActiveFilter =
        typeof _data.profile.defaultIsActiveFilter !== 'undefined' ? String(_data.profile.defaultIsActiveFilter) : '-1';
      this.profile = _data.profile;
      this.currentFolder = _data.profile?.folder as string;
      this.form.patchValue(this.profile as Profile);
    }
    if (this.oneProfileMode && ((folder.length > 0 && this.action === FormType.new) || this.action === FormType.edit)) {
      if (folder.length > 0 && this.action === FormType.new) {
        this.form.controls.folder.setValue(folder);
      }
      this.form.controls.folder.disable();
    }
  }

  ngOnInit() {
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
  }

  public openHelp(): void {
    if (this.tooltip) {
      const helperComp = this.matDialog.open(TooltipHelperComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      helperComp.componentInstance.message = this.tooltip;
    }
  }

  public get dbControls(): FormGroup[] {
    return (this.form.get('databases') as FormArray).controls as FormGroup[];
  }

  public async testConnection(item: FormGroup): Promise<void> {
    let error = false;
    if (!(item.get('host') as AbstractControl).value) {
      (item.get('host') as AbstractControl).markAsTouched();
      error = true;
    }
    if (!(item.get('port') as AbstractControl).value) {
      (item.get('port') as AbstractControl).markAsTouched();
      error = true;
    }
    if (!(item.get('database') as AbstractControl).value) {
      (item.get('database') as AbstractControl).markAsTouched();
      error = true;
    }
    if (!(item.get('user') as AbstractControl).value) {
      (item.get('user') as AbstractControl).markAsTouched();
      error = true;
    }
    if (!(item.get('password') as AbstractControl).value) {
      (item.get('password') as AbstractControl).markAsTouched();
      error = true;
    }
    if (error) {
      return;
    }
    const result = await this.databaseService.testConnection(item.getRawValue());
    if (!result.status) {
      this.notification.error(this.translate.instant('DATABASE.CONNECTION.ERROR') + ': ' + result.message);
    } else {
      this.notification.success(this.translate.instant('DATABASE.CONNECTION.SUCCESS'));
    }
  }

  public fillSettings(i: number, item: FormGroup): void {
    const subForms = (this.form.get('databases') as FormArray).controls;
    const host = (item.get('host') as AbstractControl).value;
    const port = (item.get('port') as AbstractControl).value;
    const user = (item.get('user') as AbstractControl).value;
    const password = (item.get('password') as AbstractControl).value;
    for (const form of subForms) {
      const index = subForms.indexOf(form);
      if (index === i) {
        continue;
      }
      form.patchValue({host, port, user, password});
    }
  }

  public async parseImages(): Promise<void> {
    if (!this.form.valid || !this.form.controls.folder.value || !this.form.controls.syncFolder.value) {
      this.notification.error(this.translate.instant('ERROR.FORM_NOT_VALID'));
      return;
    }
    const form = this.form.value;
    for (const place of this.iconsPlaces) {
      const dbProfile = form.databases.find((db: DataBaseProfile) => db.type === place.profile);
      const list = await this.databaseService.customQuery(
        dbProfile,
        `SELECT * FROM ${place.table} WHERE ${place.src} != '' ${place.where} `,
      );
      for (const item of list) {
        const iconBase = await this.imageService.parseImage(form, item[place.src]);
        if (!iconBase) {
          this.notification.error(
            this.translate.instant('ERROR.MISSING_FILE', {
              file: this.imageService.getFileFullPath(item[place.src], form.folder),
            }),
          );
          continue;
        }
        await this.databaseService.customQuery(
          dbProfile,
          `UPDATE ${place.table} SET ${place.dest} = '${iconBase}' WHERE ${place.base} = '${item[place.base]}'`,
          [],
          true,
        );
      }
    }
    this.notification.success(this.translate.instant('PROFILES.IMAGE_PARSE_SUCCESS'));
  }

  public toggleTooltips(event: MatSlideToggleChange): void {
    this.subFormService.toggleTooltip(TabTypes.PROFILES, event.checked);
  }

  public submitForm(): void {
    if (this.form.valid) {
      this.matDialogRef.close(this.form);
    } else {
      const fields: string[] = Object.keys(this.formFields);
      let firstField = fields.find(
        (field) => this.form.controls[field] && !this.form.controls[field].valid && this.form.controls[field].enabled,
      );
      if (!firstField) {
        firstField = this.getFirstSubFieldError(['databases']);
      }
      if (firstField) {
        const targetElement = document.getElementById('field_' + firstField);
        if (targetElement) {
          interval(650)
            .pipe(take(1))
            .subscribe(() => targetElement.scrollIntoView({behavior: 'smooth'}));
        }
      }
      this.form.markAllAsTouched();
      this.form.markAsDirty();
      this.changeDetectorRef.detectChanges();
    }
  }

  public getErrors(name: string, i = -1): string[] {
    let field;
    if (i >= 0) {
      const formGroups = ((this.form.get('databases') as FormArray)?.controls as FormGroup[]) ?? [];
      if (formGroups.length > 0) {
        field = formGroups[i].get(name);
      }
    } else {
      field = this.form.get(name);
    }
    if (field && (field.dirty || field.touched) && field.errors) {
      return Object.keys(field.errors).map((key) => key.toUpperCase());
    }
    return [];
  }

  private getFirstSubFieldError(subForms: string[]): string {
    for (const subForm of subForms) {
      const formGroups = (this.form.get(subForm) as FormArray).controls as FormGroup[];
      if (formGroups.length) {
        for (const formGroup of formGroups) {
          for (const key of Object.keys(formGroup.controls)) {
            const control = formGroup.controls[key];
            if (!control.valid) {
              return `${formGroups.indexOf(formGroup)}_${key}`;
            }
          }
        }
      }
    }
    return '';
  }

  private createSubDatabase(type: DataBaseType): FormGroup {
    return this.fb.group({
      type: new FormControl(type),
      host: new FormControl('', [Validators.required]),
      port: new FormControl('3306'),
      database: new FormControl(type, [Validators.required]),
      user: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }
}
