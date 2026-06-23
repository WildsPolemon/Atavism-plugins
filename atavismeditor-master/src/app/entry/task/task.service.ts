import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DialogCloseType, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {getProfilePipe} from '../../directives/utils';
import {taskTable} from '../tables.data';
import {DropdownItemsService} from '../dropdown-items.service';

export interface Task {
  id: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.TASK;
  private readonly listStream = new BehaviorSubject<Task[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = taskTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
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
    saveAsNew: true,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {name: {name: 'name', type: FormFieldType.input, require: true, length: 64}},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.dbProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getTasks();
    }
    const response = await this.databaseService.queryList<Task>(
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
    const {item} = await this.tablesService.openDialog<Task>(formConfig, form);
    if (!item) {
      form.reset();
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Task>(this.dbProfile, this.dbTable, item);
    form.reset();
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Task>(this.dbProfile, this.dbTable, 'id', id);
    const {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      item.updatetimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Task>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<Task>(this.dbProfile, this.dbTable, item, 'id', record.id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Task>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Task>(this.dbProfile, this.dbTable, item);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: Task, updateMode = false): Promise<{item: Task | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Task>(formConfig, form);
    if (!item) {
      form.reset();
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    form.reset();
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
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
}
