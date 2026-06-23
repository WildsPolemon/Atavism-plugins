import {Injectable} from '@angular/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery,
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {BonusDropdownValue, DropdownItemsService} from '../dropdown-items.service';
import {pvpRanksTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService} from '../sub-form.service';
import {currencyFieldConfig, effectFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {Diffs, PvpRank} from './pvp-ranks.data';
import {ImageService} from '../../components/image/image.service';

@Injectable({
  providedIn: 'root',
})
export class PvpRanksService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.PVP_RANKS;
  private readonly listStream = new BehaviorSubject<PvpRank[]>([]);
  public list = this.listStream.asObservable();
  public profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = pvpRanksTable;


  public tableConfig: TableConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.TITLE2'),
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      title: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
    //  icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      // description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      effect_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: effectFieldConfig,
      },
      value: {
        type: ConfigTypes.numberType,
        // title: this.translate.instant(this.tableKey + '.RANKVALUE'),
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      currency_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      currency_increase: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      currency_reduce: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },

      // isactive: {
      //   type: ConfigTypes.isActiveType,
      //   visible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.dropdown,
      //   data: this.dropdownItemsService.isActiveOptions,
      //   overrideValue: '-1',
      // },


      creationtimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
      updatetimestamp: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'value', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      // id: {name: 'id', type: FormFieldType.input, require: true, width: 25},
      title: {name: 'title', type: FormFieldType.input, require: true, length: 64, width: 50},
     // icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      effect_id: {
        name: 'effect_id',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        fieldConfig: effectFieldConfig,
      },
      value: {
        name: 'value',
        // label: this.translate.instant(this.tableKey + '.RANKVALUE'),
        type: FormFieldType.input,
        require: true,
        width: 25
      },

      currency_id: {
        name: 'currency_id',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        allowNew: true,
        fieldConfig: currencyFieldConfig,
      },
      currency_increase: {name: 'currency_increase', type: FormFieldType.input, require: true, width: 25},
      currency_reduce: {name: 'currency_reduce', type: FormFieldType.input, require: true, width: 25},


    },
    subForms: {
      diffa: {
        title: this.translate.instant(this.tableKey + '.DIFF_ABOVE'),
        submit: this.translate.instant(this.tableKey + '.ADD_DIFF_ABOVE'),
        fields: {
          leveldiff: {name: 'leveldiff', type: FormFieldType.integer, require: true, width: 33},
          currency_increase_diff: {name: 'currency_increase_diff', type: FormFieldType.integer, require: true, width: 33},
          currency_reduce_diff: {name: 'currency_reduce_diff', type: FormFieldType.integer, require: true, width: 33},
        },
      },
      diffb: {
        title: this.translate.instant(this.tableKey + '.DIFF_BELOW'),
        submit: this.translate.instant(this.tableKey + '.ADD_DIFF_BELOW'),
        fields: {
          leveldiff: {name: 'leveldiff', type: FormFieldType.integer, require: true, width: 33},
          currency_increase_diff: {name: 'currency_increase_diff', type: FormFieldType.integer, require: true, width: 33},
          currency_reduce_diff: {name: 'currency_reduce_diff', type: FormFieldType.integer, require: true, width: 33},
        },
      },
    },
  };
  private readonly diffForm = {
    leveldiff: {value: '', required: true},
    currency_increase_diff: {value: '', required: true},
    currency_reduce_diff: {value: '', required: true},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      // this.tableConfig.fields.icon.iconFolder = profile.folder;
      // this.formConfig.fields.icon.acceptFolder = profile.folder;
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        // this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        // if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        //   this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        // }
        this.loadOptions();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getBonusesSettings();
  }

  public async getList(queryParams: QueryParams): Promise<void> {

    console.log(queryParams);
    const response = await this.databaseService.queryList<PvpRank>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<PvpRank>(formConfig, form, {
      diffa: this.diffForm,
      diffb: this.diffForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }

    const diffb = item.diffb as Diffs[];
    const diffa = item.diffa as Diffs[];
    delete item.diffb;
    delete item.diffa;
    item.diff_above = diffa.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');
    item.diff_below = diffb.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');

    // item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<PvpRank>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return newId;
  }

  public async updateItem(id: number): Promise<number> {
    const record = await this.databaseService.queryItem<PvpRank>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }

    let {item, action} = await this.prepareSubForm(record, true);
    if (!item) {
      return 0;
    }
    const diffb = item.diffb as Diffs[];
    const diffa = item.diffa as Diffs[];
    delete item.diffb;
    delete item.diffa;
    item.diff_above = diffa.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');
    item.diff_below = diffb.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');

    item = await this.setDefaults(item);
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      // item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      const newId = await this.databaseService.insert<PvpRank>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<PvpRank>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<PvpRank>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.title = record.title + ' (1)';

    let {item} = await this.prepareSubForm(record);
    if (!item) {
      return 0;
    }
    const diffb = item.diffb as Diffs[];
    const diffa = item.diffa as Diffs[];
    delete item.diffb;
    delete item.diffa;
    item.diff_above = diffa.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');
    item.diff_below = diffb.map((d) => `${d.leveldiff};${d.currency_increase_diff};${d.currency_reduce_diff}`).join('|');
    // item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<PvpRank>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<PvpRank>(this.dbProfile, this.dbTable, 'id', id);
    const diffa: any[] = [];
    const diffb: any[] = [];

    const diff_below = record.diff_below.split('|');
    const diff_above = record.diff_above.split('|');

    for (const item of diff_above) {
      const it = item.split(';');
      diffa.push({
        leveldiff: it[0],
        currency_increase_diff: it[1],
        currency_reduce_diff: it[2],
      });
    }
    for (const item of diff_below) {
      const it = item.split(';');
      diffb.push({
        leveldiff: it[0],
        currency_increase_diff: it[1],
        currency_reduce_diff: it[2],
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {diffa, diffb}},
    });
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'value', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private async prepareSubForm(
    record: PvpRank,
    updateMode = false,
  ): Promise<{item: PvpRank | undefined; action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();

    const diff_below = record.diff_below.split('|');
    const diff_above = record.diff_above.split('|');
    for (const da of diff_above) {
      const it = da.split(';');
      if(it.length > 1) {
        const d: Partial<Diffs> = {leveldiff: Number(it[0]), currency_increase_diff: Number(it[1]), currency_reduce_diff: Number(it[2])};
        (form.get('diffa') as FormArray).push(
          this.subFormService.buildSubForm<Partial<Diffs>, any>(this.diffForm, d),
        );
      }
    }
    for (const db of diff_below) {
      const it = db.split(';');
      if(it.length > 1) {
        const d: Partial<Diffs> = {leveldiff: Number(it[0]), currency_increase_diff: Number(it[1]), currency_reduce_diff: Number(it[2])};
        (form.get('diffb') as FormArray).push(
          this.subFormService.buildSubForm<Partial<Diffs>, any>(this.diffForm, d),
        );
      }
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<PvpRank>(formConfig, form, {
      diffa: this.diffForm,
      diffb: this.diffForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  private async setDefaults(item: PvpRank): Promise<PvpRank> {
    item.title = item.title ?? '';
    item.currency_id = item.currency_id || -1;
    item.currency_increase = item.currency_increase || 0;
    item.value = item.value || 1;
    item.currency_reduce = item.currency_reduce || 0;
    item.effect_id = item.effect_id || -1;
    item.icon = "";
    item.icon2 = "";
    // item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    // if (!item.icon) {
    //   item.icon = this.profile.defaultImage;
    // }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }



  private resetForm(form: FormGroup): void {
    form.reset();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      icon: '',
      // description: ['', Validators.required],
      currency_id: [-1, Validators.min(1)],
      value: [-1, Validators.min(0)],
      currency_increase: [-1, Validators.min(1)],
      currency_reduce: [-1, Validators.min(0)],
      effect_id: [-1],
      diffb: new FormArray([]),
      diffa: new FormArray([]),
    });
  }
}
