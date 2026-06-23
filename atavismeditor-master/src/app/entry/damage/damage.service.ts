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
import {DropdownItemsService} from '../dropdown-items.service';
import {damageTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {statFieldConfig} from '../dropdown.config';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';
import {takeUntil} from 'rxjs/operators';

export interface Damage {
  id?: string;
  name: string;
  resistance_stat: string;
  power_stat: string;
  accuracy_stat: string;
  evasion_stat: string;
  critic_chance_stat: string;
  critic_power_stat: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class DamageService {
  public tableKey = TabTypes.DAMAGE;
  private readonly listStream = new BehaviorSubject<Damage[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = damageTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      resistance_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
      power_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
      accuracy_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
      evasion_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
      critic_chance_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
      critic_power_stat: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
        data: [],
      },
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
      resistance_stat: {
        name: 'resistance_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      power_stat: {
        name: 'power_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      accuracy_stat: {
        name: 'accuracy_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      evasion_stat: {
        name: 'evasion_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      critic_chance_stat: {
        name: 'critic_chance_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      critic_power_stat: {
        name: 'critic_power_stat',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: statFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
    },
  };
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly handleDepService: HandleDependenciesService,
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
    this.dropdownItemsService.stats.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.resistance_stat.data = list;
      this.tableConfig.fields.power_stat.data = list;
      this.tableConfig.fields.accuracy_stat.data = list;
      this.tableConfig.fields.evasion_stat.data = list;
      this.tableConfig.fields.critic_chance_stat.data = list;
      this.tableConfig.fields.critic_power_stat.data = list;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getStats();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getDamages();
    }
    const response = await this.databaseService.queryList<Damage>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list.map((item) => ({id: item.name, ...item})));
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<Damage>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<Damage>(this.dbProfile, this.dbTable, 'name', item.name);
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    } else {
      await this.databaseService.insert<Damage>(this.dbProfile, this.dbTable, item);
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {id: item.name, value: item.name};
    }
  }

  public async updateItem(id: string): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Damage>(this.dbProfile, this.dbTable, 'name', id);
    if (!record) {
      return null;
    }
    const {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      const record = await this.databaseService.queryItem<Damage>(this.dbProfile, this.dbTable, 'name', item.name);
      if (record) {
        this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
        this.tablesService.dialogRef = null;
        return null;
      } else {
        await this.databaseService.insert<Damage>(this.dbProfile, this.dbTable, item);
      }
    } else {
      await this.databaseService.update<Damage>(this.dbProfile, this.dbTable, item, 'name', id);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return {id: item.name, value: item.name};
  }

  public async duplicateItem(id: string): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Damage>(this.dbProfile, this.dbTable, 'name', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    await this.databaseService.insert<Damage>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return 1;
  }

  private async prepareForm(record: Damage, updateMode = false): Promise<{item: Damage | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Damage>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      resistance_stat: ['', Validators.required],
      power_stat: ['', Validators.required],
      accuracy_stat: ['', Validators.required],
      evasion_stat: ['', Validators.required],
      critic_chance_stat: ['', Validators.required],
      critic_power_stat: ['', Validators.required],
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
