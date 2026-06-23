import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {slotsInProfileTable, slotsProfileTable} from '../tables.data';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {getProfilePipe, Utils} from '../../directives/utils';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {slotsFieldConfig} from '../dropdown.config';
import {SlotProfile, SlotInProfile} from './slot-profile.data';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';
import {usedValidator} from '../../validators/used.validator';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';

@Injectable({
  providedIn: 'root',
})
export class SlotProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.SLOTS_PROFILE;
  private readonly listStream = new BehaviorSubject<SlotProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = slotsProfileTable;
  public dbTableSlot = slotsInProfileTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      // all_slots: {
      //   type: ConfigTypes.booleanType,
      //   visible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.booleanType,
      // },
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
    dialogType: DialogConfig.smallDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 32},
      // all_slots: {name: 'all_slots', type: FormFieldType.boolean},
      slot_id: {
        name: 'slot_id',
        type: FormFieldType.dynamicDropdown,
        require: true,
        multiple: true,
        allowNew: true,
        fieldConfig: slotsFieldConfig,
      },
    },
  };
  private uniqueNames: DropdownValue[] = [];

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
    this.dropdownItemsService.slotNames.pipe(takeUntil(this.destroyer)).subscribe((list) => {
      this.uniqueNames = list;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private loadOptions() {
    this.dropdownItemsService.getSlotNames();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    this.dropdownItemsService.getSlotNames();
    const response = await this.databaseService.queryList<SlotProfile>(
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
    const used = [...this.uniqueNames.map((item2) => item2.value)];
    (form.get('name') as AbstractControl).setValidators([Validators.required, usedValidator(used)]);
    (form.get('name') as AbstractControl).updateValueAndValidity();
    let {item} = await this.tablesService.openDialog<SlotProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    let slots: string | string[] = item.slot_id as string;
    if (slots) {
      slots = slots.split(';');
    } else {
      slots = [];
    }
    delete item.slot_id;
    item = this.defaults(item);
    const newId = await this.databaseService.insert<SlotProfile>(this.dbProfile, this.dbTable, item);
    await this.addSubs(newId, slots);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getSlotNames();
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<SlotProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: SlotInProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSlot} WHERE slot_profile_id = ?`,
      [record.id],
      false,
    );
    const itemsAll = list.map((item2) => item2.id) as number[];
    record.slot_id = list.map((item2) => item2.slot_id).join(';');
    let {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let slots: string | string[] = item.slot_id as string;
    if (slots) {
      slots = slots.split(';');
    } else {
      slots = [];
    }
    delete item.slot_id;
    item = this.defaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<SlotProfile>(this.dbProfile, this.dbTable, item);
      await this.addSubs(newId, slots);
    } else {
      await this.databaseService.update<SlotProfile>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, slots, itemsAll);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getSlotNames();
    return {id: newId, value: item.name};
  }

  public defaults(item: SlotProfile): SlotProfile {
    item.updatetimestamp = this.databaseService.getTimestampNow();
    // item.all_slots = item.all_slots || false;
    return item;
  }

  private async addSubs(id: number, items: string[]): Promise<void> {
    for (const item of items) {
      const newItem: SlotInProfile = {
        slot_profile_id: id,
        slot_id: +item,
      };
      await this.databaseService.insert<SlotInProfile>(this.dbProfile, this.dbTableSlot, newItem, false);
    }
  }

  private async saveSubs(id: number, items: string[], itemsAll: number[] = []): Promise<void> {
    for (const item of items) {
      const itemResult = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableSlot} WHERE slot_profile_id = ? and slot_id = ?`,
        [id, +item],
        false,
      );
      if (itemResult && itemResult.length > 0) {
        itemsAll.splice(itemsAll.indexOf(itemResult[0].id), 1);
      } else {
        await this.addSubs(id, [item]);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableSlot, 'id', itemId, false);
      }
    }
  }

  private async prepareForm(record: SlotProfile, updateMode = false): Promise<{item: SlotProfile | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let used;
    if (record.id) {
      used = [...this.uniqueNames.filter((item2) => item2.id !== record.id).map((item2) => item2.value)];
    } else {
      used = [...this.uniqueNames.map((item2) => item2.value)];
    }
    (form.get('name') as AbstractControl).setValidators([Validators.required, usedValidator(used)]);
    (form.get('name') as AbstractControl).updateValueAndValidity();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<SlotProfile>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<SlotProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const list: SlotInProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSlot} WHERE slot_profile_id = ?`,
      [id],
      false,
    );
    record.slot_id = list.map((item2) => item2.slot_id).join(';');
    let {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    let slots: string | string[] = item.slot_id as string;
    if (slots) {
      slots = slots.split(';');
    } else {
      slots = [];
    }
    delete item.slot_id;
    item = this.defaults(item);
    const newId = await this.databaseService.insert<SlotProfile>(this.dbProfile, this.dbTable, item, false);
    await this.addSubs(newId, slots);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.dropdownItemsService.getSlotNames();
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const slots: any[] = [];
    const list: SlotInProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSlot} WHERE slot_profile_id = ?`,
      [id],
      false,
    );
    for (const item of list) {
      const slot = await this.dropdownItemsService.getSlot(item.slot_id);
      if (slot) {
        slots.push({
          name: slot.value,
        });
      }
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {slots}},
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
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      slot_id: '',
    });
  }
}
