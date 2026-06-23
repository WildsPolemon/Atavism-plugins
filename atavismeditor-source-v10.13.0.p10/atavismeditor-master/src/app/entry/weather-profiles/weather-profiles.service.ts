import {Injectable} from '@angular/core';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {weatherProfilesTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {defaultValues, fields, WeatherProfile} from './weather-profiles.data';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';

@Injectable({
  providedIn: 'root',
})
export class WeatherProfilesService {
  public tableKey = TabTypes.WEATHER_PROFILE;
  private readonly listStream = new BehaviorSubject<WeatherProfile[]>([]);
  public list = this.listStream.asObservable();
  public formConfig: FormConfig = {
    type: this.tableKey,
    saveAsNew: true,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    dialogType: DialogConfig.normalDialogOverlay,
    fields: {},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {},
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public dbProfile!: DataBaseProfile;
  public dbTable = weatherProfilesTable;
  private formFields: Record<string, any> = {};
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly tablesService: TablesService,
    private readonly profilesService: ProfilesService,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public init(): void {
    this.generateFields();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
      }
    });
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<WeatherProfile[]>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    formConfig.saveAsNew = false;
    const {item} = await this.tablesService.openDialog<WeatherProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    const newId = await this.databaseService.insert<WeatherProfile>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async update(id: number): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<WeatherProfile>(this.dbProfile, this.dbTable, 'id', id);
    const {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      newId = await this.databaseService.insert<WeatherProfile>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<WeatherProfile>(this.dbProfile, this.dbTable, item, 'id', record.id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<WeatherProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.isactive = true;
    return await this.databaseService.insert<WeatherProfile>(this.dbProfile, this.dbTable, item, false);
  }

  private async prepareForm(record: WeatherProfile, updateMode = false): Promise<{ item: WeatherProfile | undefined, action: DialogCloseType }> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<WeatherProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    form.patchValue(defaultValues);
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private generateFields(): void {
    this.formFields = {};
    fields.forEach((field) => {
      this.tableConfig.fields[field] = {
        type: field === 'name' ? ConfigTypes.stringType : ConfigTypes.numberType,
        visible: field === 'id' || field === 'name',
        alwaysVisible: field === 'id',
        filterVisible: !(field === 'id' || field === 'name'),
        useAsSearch: field === 'name',
        textAlign: field === 'id' || field === 'name' ? 'left' : 'center',
        filterType: field !== 'id' && field !== 'name' ? FilterTypes.decimal : undefined,
      };
      if (field === 'id') {
        return;
      }
      this.formFields[field] = [field === 'name' ? '' : '0', Validators.required];
      if (
        [
          'temperature_min',
          'humidity_min',
          'wind_direction_min',
          'fog_height_power_min',
          'rain_power_min',
          'hail_power_min',
          'snow_power_min',
          'thunder_power_min',
          'cloud_power_min',
          'moon_phase_min',
        ].includes(field)
      ) {
        this.formConfig.fields[field + '_title'] = {
          type: FormFieldType.title,
          label: this.translate.instant('WEATHER_PROFILE.GROUPS.' + field.split('_')[0].toUpperCase()),
          name: '',
        };
      }
      this.formConfig.fields[field] = {
        name: field,
        label: this.translate.instant('WEATHER_PROFILE.' + field.toUpperCase()),
        type: field === 'name' ? FormFieldType.input : FormFieldType.decimal,
        require: true,
        length: 48,
        width: field === 'name' ? 100 : 50,
      };
    });

    this.tableConfig.fields.isactive = {
      type: ConfigTypes.isActiveType,
      visible: true,
      filterVisible: true,
      filterType: FilterTypes.dropdown,
      data: this.dropdownItemsService.isActiveOptions,
      overrideValue: '-1',
    };
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group(this.formFields);
    form.patchValue(defaultValues);
    (form.get('temperature_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('temperature_max') as AbstractControl).setValidators(validators);
        (form.get('temperature_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('humidity_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('humidity_max') as AbstractControl).setValidators(validators);
        (form.get('humidity_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('wind_direction_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('wind_direction_max') as AbstractControl).setValidators(validators);
        (form.get('wind_direction_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('wind_speed_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('wind_speed_max') as AbstractControl).setValidators(validators);
        (form.get('wind_speed_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('wind_turbulence_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('wind_turbulence_max') as AbstractControl).setValidators(validators);
        (form.get('wind_turbulence_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('fog_height_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('fog_height_power_max') as AbstractControl).setValidators(validators);
        (form.get('fog_height_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('fog_distance_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('fog_distance_power_max') as AbstractControl).setValidators(validators);
        (form.get('fog_distance_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('rain_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('rain_power_max') as AbstractControl).setValidators(validators);
        (form.get('rain_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('rain_power_terrain_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('rain_power_terrain_max') as AbstractControl).setValidators(validators);
        (form.get('rain_power_terrain_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('rain_min_height') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('rain_max_height') as AbstractControl).setValidators(validators);
        (form.get('rain_max_height') as AbstractControl).updateValueAndValidity();
      });
    (form.get('hail_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('hail_power_max') as AbstractControl).setValidators(validators);
        (form.get('hail_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('hail_power_terrain_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('hail_power_terrain_max') as AbstractControl).setValidators(validators);
        (form.get('hail_power_terrain_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('hail_min_height') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('hail_max_height') as AbstractControl).setValidators(validators);
        (form.get('hail_max_height') as AbstractControl).updateValueAndValidity();
      });
    (form.get('snow_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('snow_power_max') as AbstractControl).setValidators(validators);
        (form.get('snow_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('snow_power_terrain_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('snow_power_terrain_max') as AbstractControl).setValidators(validators);
        (form.get('snow_power_terrain_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('snow_age_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('snow_age_max') as AbstractControl).setValidators(validators);
        (form.get('snow_age_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('thunder_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('thunder_power_max') as AbstractControl).setValidators(validators);
        (form.get('thunder_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('cloud_power_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('cloud_power_max') as AbstractControl).setValidators(validators);
        (form.get('cloud_power_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('cloud_min_height') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('cloud_max_height') as AbstractControl).setValidators(validators);
        (form.get('cloud_max_height') as AbstractControl).updateValueAndValidity();
      });
    (form.get('cloud_speed_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('cloud_speed_max') as AbstractControl).setValidators(validators);
        (form.get('cloud_speed_max') as AbstractControl).updateValueAndValidity();
      });
    (form.get('moon_phase_min') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        const validators = [Validators.required];
        if (value !== null) {
          validators.push(Validators.min(value));
        }
        (form.get('moon_phase_max') as AbstractControl).setValidators(validators);
        (form.get('moon_phase_max') as AbstractControl).updateValueAndValidity();
      });
    return form;
  }
}
