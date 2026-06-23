import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {AuctionHouseProfile} from './auction-profile.data';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {auctionProfileTable} from '../tables.data';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {currencyFieldConfig} from '../dropdown.config';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuctionProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.AUCTION_HOUSE_PROFILE;
  private readonly listStream = new BehaviorSubject<AuctionHouseProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = auctionProfileTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: false,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      cost_price_value: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      cost_price_value_percentage: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      currency: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      duration: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      display_limit: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      own_limit: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_price_value: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      start_price_percentage: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
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
      cost_price_value: {name: 'cost_price_value', type: FormFieldType.integer, width: 50},
      cost_price_value_percentage: {name: 'cost_price_value_percentage', type: FormFieldType.decimal, width: 50},
      currency: {
        name: 'currency',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        require: true,
        fieldConfig: currencyFieldConfig,
      },
      duration: {name: 'duration', type: FormFieldType.integer, width: 50},
      display_limit: {name: 'display_limit', type: FormFieldType.integer, width: 50},
      own_limit: {name: 'own_limit', type: FormFieldType.integer, width: 50},
      start_price_value: {name: 'start_price_value', type: FormFieldType.integer, width: 50},
      start_price_percentage: {name: 'start_price_percentage', type: FormFieldType.decimal, width: 50},
    },
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly notification: NotificationService,
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
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.currency.data = list;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getCurrencies();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<AuctionHouseProfile>(
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
    let {item} = await this.tablesService.openDialog<AuctionHouseProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<AuctionHouseProfile>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getAuctionProfiles();
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<AuctionHouseProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    let {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    item = this.setDefaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<AuctionHouseProfile>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<AuctionHouseProfile>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getAuctionProfiles();
    return {id: newId, value: item.name};
  }

  private async prepareForm(record: AuctionHouseProfile, updateMode = false): Promise<{item: AuctionHouseProfile | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<AuctionHouseProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<AuctionHouseProfile>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<AuctionHouseProfile>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
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

  private setDefaults(item: AuctionHouseProfile): AuctionHouseProfile {
    item.cost_price_value = item.cost_price_value || 0;
    item.cost_price_value_percentage = item.cost_price_value_percentage || 0;
    item.start_price_value = item.start_price_value || 0;
    item.start_price_percentage = item.start_price_percentage || 0;
    item.duration = item.duration || 1;
    item.display_limit = item.display_limit || 1;
    item.own_limit = item.own_limit || 1;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      cost_price_value: [0, Validators.min(0)],
      cost_price_value_percentage: [0, Validators.min(0)],
      currency: ['', Validators.required],
      duration: [1, Validators.min(1)],
      display_limit: [1, Validators.min(1)],
      own_limit: [1, Validators.min(1)],
      start_price_value: [0, Validators.min(0)],
      start_price_percentage: [0, Validators.min(0)],
    });
  }
}
