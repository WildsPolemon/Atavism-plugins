import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {statThresholdTable} from '../tables.data';
import {getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService} from '../sub-form.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {usedValidator} from '../../validators/used.validator';
import {takeUntil} from 'rxjs/operators';
import {statFunctionsFieldConfig} from '../dropdown.config';

export interface StatThreshold {
  stat_function: string;
  threshold: number;
  num_per_point: number;
}

export interface StatThresholdTmp {
  stat_function: string;
  thresholds?: ThresholdsTmp[];
}

interface ThresholdsTmp {
  threshold: number;
  num_per_point: number;
}

@Injectable({
  providedIn: 'root',
})
export class ThresholdsService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.THRESHOLDS;
  private readonly listStream = new BehaviorSubject<StatThresholdTmp[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = statThresholdTable;
  private readonly thresholdsForm: SubFieldType = {
    threshold: {value: 1, required: true, min: 1},
    num_per_point: {value: 1, required: true, min: 1},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    showPreview: true,
    count: 10,
    fields: {
      stat_function: {
        type: ConfigTypes.stringType,
        alwaysVisible: true,
        visible: true,
        useAsSearch: true,
        data: [],
        filterVisible: true,
        filterType: FilterTypes.dropdown,
      },
      threshold: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      num_per_point: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'stat_function', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      stat_function: {
        name: 'stat_function',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: statFunctionsFieldConfig,
        require: true,
      },
    },
    subForms: {
      thresholds: {
        title: this.translate.instant(this.tableKey + '.THRESHOLDS'),
        submit: this.translate.instant(this.tableKey + '.ADD_THRESHOLD'),
        minCount: 1,
        columnWidth: 100,
        fields: {
          threshold: {name: 'threshold', type: FormFieldType.integer, require: true, width: 50},
          num_per_point: {name: 'num_per_point', type: FormFieldType.integer, require: true, width: 50},
        },
      },
    },
  };
  public used: string[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly optionChoicesService: OptionChoicesService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.getOptions();
      }
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.getOptions();
    });
  }

  public async getOptions(): Promise<void> {
    this.tableConfig.fields.stat_function.data = await this.optionChoicesService.getOptionsByType(
      'Stat Functions',
      true,
    );
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<StatThresholdTmp>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
      '',
      [],
      '',
      true,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list.map((item) => ({id: item.stat_function, ...item})));
    await this.getAllUsed();
  }

  private async getAllUsed(): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT DISTINCT stat_function FROM ${this.dbTable}`,
    );
    this.used = list.map((item: {stat_function: string}) => item.stat_function);
  }

  public async addItem(): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    (form.get('stat_function') as AbstractControl).setValidators([Validators.required, usedValidator(this.used)]);
    (form.get('stat_function') as AbstractControl).updateValueAndValidity();
    const {item} = await this.tablesService.openDialog<StatThresholdTmp>(formConfig, form, {
      thresholds: this.thresholdsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const thresholds = item.thresholds as ThresholdsTmp[];
    delete item.thresholds;
    for (const threshold of thresholds) {
      const statThreshold: StatThreshold = {
        stat_function: item.stat_function,
        threshold: threshold.threshold,
        num_per_point: threshold.num_per_point,
      };
      await this.databaseService.insert<StatThreshold>(this.dbProfile, this.dbTable, statThreshold, false);
    }
    this.resetForm(form);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_ADDED'));
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async updateItem(id: string): Promise<number> {
    this.used = this.used.filter((stat) => stat !== id);
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE stat_function = ?`,
      [id],
    );
    if (!list) {
      return 0;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const threshold of list) {
      const subForm = this.subFormService.buildSubForm<ThresholdsTmp, any>(this.thresholdsForm, threshold);
      (form.get('thresholds') as FormArray).push(subForm);
    }
    (form.get('stat_function') as AbstractControl).setValue(id);
    (form.get('stat_function') as AbstractControl).setValidators([Validators.required, usedValidator(this.used)]);
    (form.get('stat_function') as AbstractControl).updateValueAndValidity();
    formConfig.saveAsNew = true;
    const {item, action} = await this.tablesService.openDialog<StatThresholdTmp>(formConfig, form, {
      thresholds: this.thresholdsForm,
    });
    if (!item) {
      this.resetForm(form);
      this.getAllUsed();
      this.tablesService.dialogRef = null;
      return 0;
    }
    const thresholds = item.thresholds as ThresholdsTmp[];
    delete item.thresholds;
    if (action === DialogCloseType.save_as_new) {
      for (const threshold of thresholds) {
        const statThreshold: StatThreshold = {
          stat_function: item.stat_function,
          threshold: threshold.threshold,
          num_per_point: threshold.num_per_point,
        };
        await this.databaseService.insert<StatThreshold>(this.dbProfile, this.dbTable, statThreshold, false);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_ADDED'));
      this.getAllUsed();
    } else {
      await this.databaseService.delete(this.dbProfile, this.dbTable, 'stat_function', id, false);
      for (const threshold of thresholds) {
        const statThreshold: StatThreshold = {
          stat_function: item.stat_function,
          threshold: threshold.threshold,
          num_per_point: threshold.num_per_point,
        };
        await this.databaseService.insert<StatThreshold>(this.dbProfile, this.dbTable, statThreshold, false);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async previewItems(id: string): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} WHERE stat_function = ?`,
      [id],
    );
    if (!list) {
      return;
    }
    const thresholds = [];
    for (const item of list) {
      thresholds.push({threshold: item.threshold, num_per_point: item.num_per_point});
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {thresholds}},
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('thresholds') as FormArray).clear();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      stat_function: ['', Validators.required],
      thresholds: new FormArray([]),
    });
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'stat_function', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.tableConfig.actions = [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ];
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
