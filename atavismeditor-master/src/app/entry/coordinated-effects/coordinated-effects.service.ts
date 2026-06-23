import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {coordinatedEffectsTable} from '../tables.data';
import {getProfilePipe} from '../../directives/utils';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';
import {DropdownItemsService} from '../dropdown-items.service';

export interface CoordinatedEffect {
  id?: number;
  name: string;
  prefab: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoordinatedEffectsService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.COORDINATED_EFFECTS;
  private readonly listStream = new BehaviorSubject<CoordinatedEffect[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = coordinatedEffectsTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      prefab: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64},
      prefab: {
        name: 'prefab',
        type: FormFieldType.file,
        acceptFolder: '',
        acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
        accept: 'prefab',
        length: 256,
        require: true,
      },
    },
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly handleDepService: HandleDependenciesService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.formConfig.fields.prefab.acceptFolder = profile.folder + profile.coordFolder;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      this.dbProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
    });
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<CoordinatedEffect>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(field = 'id'): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<CoordinatedEffect>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<CoordinatedEffect>(
      this.dbProfile,
      this.dbTable,
      'name',
      item.name,
    );
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    } else {
      const newId = await this.databaseService.insert<CoordinatedEffect>(this.dbProfile, this.dbTable, item);
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {id: field === 'id' ? newId : (item[field as keyof CoordinatedEffect] as string), value: item.name};
    }
  }

  public async updateItem(id: number, field = 'id'): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<CoordinatedEffect>(this.dbProfile, this.dbTable, field, id);
    if (!record) {
      return null;
    }
    const {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      newId = await this.databaseService.insert<CoordinatedEffect>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<CoordinatedEffect>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
    }
    this.tablesService.dialogRef = null;
    return {
      id: field === 'id' ? newId : (item[field as keyof CoordinatedEffect] as string),
      value: item.name,
    };
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<CoordinatedEffect>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<CoordinatedEffect>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.tablesService.dialogRef = null;
    return newId;
  }

  private async prepareForm(record: CoordinatedEffect, updateMode = false): Promise<{item: CoordinatedEffect | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<CoordinatedEffect>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    let duplicated;
    if (action === DialogCloseType.save_as_new) {
      const record = await this.databaseService.queryItem<CoordinatedEffect>(
        this.dbProfile,
        this.dbTable,
        'name',
        item.name,
      );
      duplicated = !!record;
    } else {
      const countItem = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT COUNT(*) as nameCount FROM ${this.dbTable} WHERE name = ? AND id != ?`,
        [item.name, record.id],
      );
      duplicated = +countItem[0].nameCount > 0;
    }
    if (duplicated) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    } else {
      item.updatetimestamp = this.databaseService.getTimestampNow();
      this.resetForm(form);
      return {item, action};
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      prefab: ['', Validators.required],
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
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
}
