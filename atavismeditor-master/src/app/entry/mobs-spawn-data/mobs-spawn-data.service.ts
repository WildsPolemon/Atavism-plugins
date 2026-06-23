import {Injectable} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
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
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {spawnDataTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {merchantFieldConfig, mobsFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

export interface MobsSpawnDataSettings {
  id?: number;
  name: string;
  numSpawns: number;
  respawnTime: number;
  respawnTimeMax: number;
  spawnRadius: number;
  corpseDespawnTime: number;
  isactive: boolean;
  combat: boolean;
  roamRadius: number;
  mobTemplate: number;
  merchantTable: number;
  startsQuests: string;
  endsQuests: string;
  startsDialogues: string;
  otherActions: string;
  baseAction: string;
  weaponSheathed: boolean;
  questOpenLootTable: number;
  pickupItem: number;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class MobsSpawnDataService {
  public tableKey = TabTypes.MOBS_SPAWN_DATA;
  private readonly listStream = new BehaviorSubject<MobsSpawnDataSettings[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = spawnDataTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      numSpawns: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      mobTemplate: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: mobsFieldConfig,
        data: [],
      },
      respawnTime: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      spawnRadius: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      corpseDespawnTime: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      combat: {type: ConfigTypes.booleanType, visible: true, filterVisible: true, filterType: FilterTypes.booleanType},
      roamRadius: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      merchantTable: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: merchantFieldConfig,
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64},
      mobTemplate: {
        name: 'mobTemplate',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: mobsFieldConfig,
        require: true,
        allowNew: true,
      },
      numSpawns: {name: 'numSpawns', type: FormFieldType.integer, require: true, length: 64, width: 50},
      respawnTime: {name: 'respawnTime', type: FormFieldType.integer, require: true, width: 50},
      spawnRadius: {name: 'spawnRadius', type: FormFieldType.integer, require: true, width: 50},
      corpseDespawnTime: {name: 'corpseDespawnTime', type: FormFieldType.integer, require: true, width: 50},
      combat: {name: 'combat', type: FormFieldType.boolean, require: false, width: 50},
      roamRadius: {name: 'roamRadius', type: FormFieldType.integer, require: true, width: 50},
      merchantTable: {
        name: 'merchantTable',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: merchantFieldConfig,
        allowNew: true,
      },
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
    this.dropdownItemsService.mobs.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.mobTemplate.data = listing;
    });
    this.dropdownItemsService.merchants.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.tableConfig.fields.merchantTable.data = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getMobs();
    await this.dropdownItemsService.getMerchants();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getSpawnData();
    }
    (queryParams.where as WhereQuery)['instance IS NULL'] = 'where_null_using';
    const response = await this.databaseService.queryList<MobsSpawnDataSettings>(
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
    let {item} = await this.tablesService.openDialog<MobsSpawnDataSettings>(formConfig, form);
    if (!item) {
      form.reset();
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<MobsSpawnDataSettings>(this.dbProfile, this.dbTable, item);
    form.reset();
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<MobsSpawnDataSettings>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    let {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<MobsSpawnDataSettings>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<MobsSpawnDataSettings>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public setDefaults(item: MobsSpawnDataSettings): MobsSpawnDataSettings {
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.merchantTable = item.merchantTable ? +item.merchantTable : -1;
    item.startsQuests = item.startsQuests ? item.startsQuests : '';
    item.endsQuests = item.endsQuests ? item.endsQuests : '';
    item.combat = item.combat ? item.combat : false;
    item.startsDialogues = item.startsDialogues ? item.startsDialogues : '';
    item.otherActions = item.otherActions ? item.otherActions : '';
    item.baseAction = item.baseAction ? item.baseAction : '';
    item.weaponSheathed = item.weaponSheathed ? item.weaponSheathed : false;
    item.questOpenLootTable = item.questOpenLootTable ? item.questOpenLootTable : -1;
    item.pickupItem = item.pickupItem ? item.pickupItem : -1;
    item.respawnTimeMax = item.respawnTime;
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<MobsSpawnDataSettings>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
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
    const newId = await this.databaseService.insert<MobsSpawnDataSettings>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: MobsSpawnDataSettings, updateMode = false): Promise<{item: MobsSpawnDataSettings | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue({...record});
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<MobsSpawnDataSettings>(formConfig, form);
    if (!item) {
      form.reset();
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    form.reset();
    this.tablesService.dialogRef = null;
    return {item: this.setDefaults(item), action};
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      mobTemplate: ['', Validators.required],
      numSpawns: ['', [Validators.required, Validators.min(1)]],
      respawnTime: ['', [Validators.required, Validators.min(1)]],
      spawnRadius: ['', [Validators.required, Validators.min(0)]],
      corpseDespawnTime: ['', [Validators.required, Validators.min(1)]],
      combat: false,
      roamRadius: ['', [Validators.required, Validators.min(0)]],
      merchantTable: '',
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
