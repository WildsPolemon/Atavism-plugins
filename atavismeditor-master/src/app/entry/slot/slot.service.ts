import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {Slot, SlotsSets} from './slot.data';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {slotsSetsTable, slotsTable} from '../tables.data';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {getProfilePipe, Utils} from '../../directives/utils';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {
  abilityFieldConfig,
  classFieldConfig,
  itemSlotTypeFieldConfig,
  raceFieldConfig,
  slotsSetsFieldConfig
} from '../dropdown.config';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';
import {usedValidator} from '../../validators/used.validator';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';
import {AbilityCombo, AbilityEffect} from '../ability/abilities.data';
import {SubFormService} from '../sub-form.service';

@Injectable({
  providedIn: 'root',
})
export class SlotService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.SLOT;
  private readonly listStream = new BehaviorSubject<Slot[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = slotsTable;
  public dbTableSlotsSets = slotsSetsTable;
  private slotsSetsForm: SubFieldType = {
    id: {value: '', required: false},
    slot_id: {value: '', required: false},
    set_id: {value: '', required: true},
    race: {value: '', required: true},
    class: {value: '', required: true},

  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: false,
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
    dialogType: DialogConfig.smallDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 32},
      type: {
        name: 'type',
        type: FormFieldType.dynamicDropdown,
        require: true,
        multiple: true,
        fieldConfig: itemSlotTypeFieldConfig,
        allowNew: true,
      },
    },
    subForms: {
      slotsSets: {
        title: this.translate.instant(this.tableKey + '.SLOTSSETS'),
        submit: this.translate.instant(this.tableKey + '.ADD_SLOTSSET'),
        columnWidth: 100,
        groupTitle: this.translate.instant(this.tableKey + '.SLOTSSETS'),
        numerate: true,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          slot_id: {name: 'slot_id', label: '', type: FormFieldType.hidden},
          set_id: {
            name: 'set_id',
            type: FormFieldType.dynamicDropdown,
            width: 33,
            hideNone: true,
            require: true,
            allowNew: true,
            fieldConfig: slotsSetsFieldConfig,
          },
          race: {
            name: 'race',
            type: FormFieldType.dynamicDropdown,
            width: 33,
            allowNew: true,
            require: true,
            fieldConfig: raceFieldConfig,
          },
          class: {
            name: 'class', type: FormFieldType.dynamicDropdown,
            width: 33,
            allowNew: true,
            fieldConfig: classFieldConfig,
            require: true,
          },
        }
      }
    }
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
    private readonly subFormService: SubFormService,
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
    const response = await this.databaseService.queryList<Slot>(
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
    const {item} = await this.tablesService.openDialog<Slot>(formConfig, form, {slotsSets: this.slotsSetsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const slotsSets = item.slotsSets as SlotsSets[];

    delete item.slotsSets;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Slot>(this.dbProfile, this.dbTable, item);
    await this.saveSubSlotsSets(newId, slotsSets, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getSlotNames();
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Slot>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: SlotsSets[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSlotsSets} WHERE slot_id = ?`,
      [record.id],
    );
    const slotsSetsAll = [];
    for (const itm of list) {
      slotsSetsAll.push(itm.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const slotsSets = item.slotsSets as SlotsSets[];
    delete item.slotsSets;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      for (const set of slotsSets) {
        delete set.id;
      }
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Slot>(this.dbProfile, this.dbTable, item);
      await this.saveSubSlotsSets(newId, slotsSets, []);
    } else {
      await this.databaseService.update<Slot>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubSlotsSets(newId, slotsSets, slotsSetsAll);
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

  private async saveSubSlotsSets(recordId: number, items: SlotsSets[], itemsAll: number[] = []): Promise<void> {
    for (const item of items) {

      item.slot_id = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        delete itemsAll[itemsAll.indexOf(item.id)];
        await this.databaseService.update<SlotsSets>(this.dbProfile, this.dbTableSlotsSets, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        //      // @ts-ignore
        delete item.id;
        await this.databaseService.insert<SlotsSets>(this.dbProfile, this.dbTableSlotsSets, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableSlotsSets, 'id', itemId, false);
        // const removeItem = {isactive: false} as AbilityCombo;
        // await this.databaseService.update<StatLink>(this.dbProfile, this.dbTableCombo, removeItem, 'id', itemId);
      }
    }
  }
  private async prepareForm(record: Slot, list?: SlotsSets[],updateMode = false): Promise<{item: Slot | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let used;
    if (record.id) {
      used = [...this.uniqueNames.filter((item2) => item2.id !== record.id).map((item4) => item4.value)];
    } else {
      used = [...this.uniqueNames.map((item3) => item3.value)];
    }
    (form.get('name') as AbstractControl).setValidators([Validators.required, usedValidator(used)]);
    (form.get('name') as AbstractControl).updateValueAndValidity();
    for (const itm of list) {
      (form.get('slotsSets') as FormArray).push(
        this.subFormService.buildSubForm<Partial<SlotsSets>, any>(this.slotsSetsForm, itm),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Slot>(formConfig, form, {slotsSets: this.slotsSetsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item:undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<Slot>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const list: SlotsSets[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSlotsSets} WHERE slot_id = ?`,
      [record.id],
    );
    const slotsSetsAll = [];
    for (const itm of list) {
      slotsSetsAll.push(itm.id);
    }
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const slotsSets = item.slotsSets as SlotsSets[];
    delete item.slotsSets;
    for (const set of slotsSets) {
      delete set.id;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Slot>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubSlotsSets(newId, slotsSets, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.dropdownItemsService.getSlotNames();
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

  private resetForm(form: FormGroup): void {
    form.reset();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      type: '',
      slotsSets: new FormArray([]),
    });
  }
}
