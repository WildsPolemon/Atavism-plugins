import {Injectable, OnDestroy} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery
} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {DatabaseService} from '../../services/database.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {bonusesSettingsTable} from '../tables.data';
import {getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {NotificationService} from '../../services/notification.service';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';

export interface BonusSetting {
  id: number;
  name: string;
  code?: string;
  param?: string;
  isactive?: boolean;
  value?: boolean;
  percentage?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BonusSettingService implements OnDestroy {
  private readonly tableKey: TabTypes = TabTypes.BONUS_SETTING;
  private readonly listStream = new BehaviorSubject<BonusSetting[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = bonusesSettingsTable;
  public tableConfig: TableConfig = {
    type: TabTypes.BONUS_SETTING,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      code: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      value: {
        type: ConfigTypes.booleanType,
        visible: true,
        disableSort: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      percentage: {
        type: ConfigTypes.booleanType,
        visible: true,
        disableSort: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    saveAsNew: true,
    title: this.translate.instant(TabTypes.BONUS_SETTING + '.ADD_TITLE'),
    dialogType: DialogConfig.normalDialogOverlay,
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64},
      code: {name: 'code', type: FormFieldType.input, require: true, length: 20},
      value: {name: 'value', type: FormFieldType.boolean, require: false},
      percentage: {name: 'percentage', type: FormFieldType.boolean, require: false},
    },
  };
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly handleDepService: HandleDependenciesService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
      }
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getBonusesSettings();
    }
    if (!queryParams.where) {
      queryParams.where = {};
    }
    const newQueryParams: QueryParams = {
      search: queryParams.search,
      sort: queryParams.sort,
      limit: queryParams.limit,
      where: {},
    };
    if (queryParams.where.isactive === 1 || queryParams.where.isactive === 0) {
      newQueryParams.where.isactive = queryParams.where.isactive;
    }
    if (queryParams.where.value !== undefined) {
      if (+queryParams.where.value === 1) {
        (newQueryParams.where as WhereQuery)[`param LIKE '%v%' `] = 'where_null_using';
      } else if (+queryParams.where.value === 0) {
        (newQueryParams.where as WhereQuery)[`param NOT LIKE '%v%' `] = 'where_null_using';
      }
    }
    if (queryParams.where.percentage !== undefined) {
      if (+queryParams.where.percentage === 1) {
        (newQueryParams.where as WhereQuery)[`param LIKE '%p%' `] = 'where_null_using';
      } else if (+queryParams.where.percentage === 0) {
        (newQueryParams.where as WhereQuery)[`param NOT LIKE '%p%' `] = 'where_null_using';
      }
    }
    const response = await this.databaseService.queryList<BonusSetting>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(
      response.list.map((item) => {
        item.value = item.param.includes('v');
        item.percentage = item.param.includes('p');
        return item;
      }),
    );
  }

  public async addItem(field = 'id'): Promise<null | DropdownValue> {
    const form = this.createForm();
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    this.formConfig.saveAsNew = false;
    const {item} = await this.tablesService.openDialog<BonusSetting>(this.formConfig, form);
    if (!item) {
      form.reset();
      return null;
    }
    item.isactive = true;
    item.param = (item.value ? 'v' : '') + (item.percentage ? 'p' : '');
    delete item.value;
    delete item.percentage;
    const newId = await this.databaseService.insert<BonusSetting>(this.dbProfile, this.dbTable, item);
    form.reset();
    this.tablesService.dialogRef = null;
    return {id: field === 'id' ? newId : (item[field as keyof BonusSetting] as string), value: item.name};
  }

  public async updateItem(id: number, field = 'id'): Promise<DropdownValue | null> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<BonusSetting>(this.dbProfile, this.dbTable, field, id);
    if (!record) {
      return null;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    record.value = (record.param as string).includes('v');
    record.percentage = (record.param as string).includes('p');
    form.patchValue(record);
    (form.get('code') as AbstractControl).disable();
    (form.get('value') as AbstractControl).disable();
    (form.get('percentage') as AbstractControl).disable();
    formConfig.saveAsNew = true;
    const {item, action} = await this.tablesService.openDialog<BonusSetting>(formConfig, form);
    if (!item) {
      form.reset();
      this.tablesService.dialogRef = null;
      return null;
    }
    item.param = (item.value ? 'v' : '') + (item.percentage ? 'p' : '');
    delete item.value;
    delete item.percentage;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      newId = await this.databaseService.insert<BonusSetting>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<BonusSetting>(this.dbProfile, this.dbTable, item, 'id', record.id);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.code as string);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    form.reset();
    this.tablesService.dialogRef = null;
    return {id: field === 'id' ? newId : (item[field as keyof BonusSetting] as string), value: item.name};
  }

  public ngOnDestroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.tableConfig.actions = [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.MARK_AS_REMOVED},
    ];
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      value: false,
      percentage: false,
    });
    (form.get('code') as AbstractControl).enable();
    (form.get('value') as AbstractControl).enable();
    (form.get('percentage') as AbstractControl).enable();
    return form;
  }
}
