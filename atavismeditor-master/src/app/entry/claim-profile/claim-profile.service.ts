import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {buildObjectLimitsTable, claimProfileTable} from '../tables.data';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {SubFormService} from '../sub-form.service';
import {takeUntil} from 'rxjs/operators';
import {getProfilePipe, Utils} from '../../directives/utils';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {buildObjectCategoryFieldConfig} from '../dropdown.config';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {DropdownItemsService} from '../dropdown-items.service';

export interface ClaimProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  limits?: BuildObjectLimits[];
}

export interface BuildObjectLimits {
  id?: number;
  profile_id: number;
  object_category: number;
  count: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClaimProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.CLAIM_PROFILE;
  private readonly listStream = new BehaviorSubject<ClaimProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = claimProfileTable;
  public dbTableLimits = buildObjectLimitsTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      isactive: {
        type: ConfigTypes.isActiveType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.dropdownItemsService.isActiveOptions,
        overrideValue: '-1',
      },
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
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 256, width: 100},
    },
    subForms: {
      limits: {
        title: this.translate.instant(this.tableKey + '.LIMITS_TITLE'),
        submit: this.translate.instant(this.tableKey + '.ADD_LIMITS'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          object_category: {
            name: 'object_category',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            require: true,
            hideNone: true,
            width: 50,
            fieldConfig: buildObjectCategoryFieldConfig,
          },
          count: {name: 'count', type: FormFieldType.integer, require: true, width: 50},
        },
      },
    },
  };
  private limitsForm: SubFieldType = {
    id: {value: '', required: false},
    object_category: {value: '', required: true},
    count: {value: '', required: true, min: 0},
  };
  private claimObjectCategoryList: DropdownValue[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    this.claimObjectCategoryList = await this.optionChoicesService.getOptionsByType('Claim Object Category');
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<ClaimProfile>(
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
    const {item} = await this.tablesService.openDialog<ClaimProfile>(formConfig, form, {limits: this.limitsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const items = item.limits as BuildObjectLimits[];
    delete item.limits;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<ClaimProfile>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, items, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<DropdownValue | null> {
    const record = await this.databaseService.queryItem<ClaimProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: BuildObjectLimits[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLimits} WHERE isactive = 1 and profile_id = ?`,
      [record.id],
    );
    const limitsAll: number[] = [];
    for (const item2 of list) {
      limitsAll.push(item2.id as number);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const limits = item.limits as BuildObjectLimits[];
    delete item.limits;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<ClaimProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, limits.map((l) => ({...l, id: undefined})), []);
    } else {
      await this.databaseService.update<ClaimProfile>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, limits, limitsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<ClaimProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: BuildObjectLimits[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLimits} WHERE isactive = 1 and profile_id = ?`,
      [baseRecord.id],
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const limits = item.limits as BuildObjectLimits[];
    delete item.limits;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.isactive = true;
    const newId = await this.databaseService.insert<ClaimProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, limits, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: ClaimProfile, list: BuildObjectLimits[], updateMode = false): Promise<{item: ClaimProfile | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const item2 of list) {
      (form.get('limits') as FormArray).push(
        this.subFormService.buildSubForm<BuildObjectLimits, any>(this.limitsForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<ClaimProfile>(formConfig, form, {limits: this.limitsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    record.updatetimestamp = this.databaseService.getTimestampNow();
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private async saveSubs(recordId: number, items: BuildObjectLimits[], itemsAll: number[]): Promise<void> {
    for (const item of items) {
      item.isactive = true;
      item.profile_id = recordId;
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<BuildObjectLimits>(this.dbProfile, this.dbTableLimits, item, 'id', item.id);
      } else {
        delete item.id;
        item.isactive = true;
        await this.databaseService.insert<BuildObjectLimits>(this.dbProfile, this.dbTableLimits, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableLimits, 'id', itemId, false);
      }
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<ClaimProfile>(this.dbProfile, this.dbTable, 'id', id);
    const limits: any = [];
    const list: BuildObjectLimits[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLimits} WHERE isactive = 1 and profile_id = ?`,
      [record.id],
    );
    for (const item of list) {
      const itm = this.claimObjectCategoryList.find((it) => it.id === item.object_category);
      limits.push({
        object_category: itm ? itm.value : item.object_category,
        count: item.count,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {limits}},
    });
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
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('limits') as FormArray).clear();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      limits: new FormArray([]),
    });
  }
}
