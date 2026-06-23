import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {factionsTable, factionStancesTable} from '../tables.data';
import {getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {factionFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {ImageService} from '../../components/image/image.service';

export interface Faction {
  id?: number;
  category: number;
  name: string;
  factionGroup: string;
  color: string;
  public: boolean;
  defaultStance: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  otherFaction: string[] | string | number[] | number;
  canEnterGuild: boolean;
  icon: string;
  icon2: string;
  stances?: FactionStances[];
}
export interface FactionStances {
  id?: number;
  factionID: number;
  otherFaction: number;
  defaultStance: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class FactionsService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.FACTION;
  public stancesList: DropdownValue[] = [
    {id: -2, value: this.translate.instant('FACTION.STANCE.HATED')},
    {id: -1, value: this.translate.instant('FACTION.STANCE.DISLIKED')},
    {id: 0, value: this.translate.instant('FACTION.STANCE.NEUTRAL')},
    {id: 1, value: this.translate.instant('FACTION.STANCE.FRIENDLY')},
    {id: 2, value: this.translate.instant('FACTION.STANCE.HONOURED')},
    {id: 3, value: this.translate.instant('FACTION.STANCE.EXALTED')},
  ];
  private readonly listStream = new BehaviorSubject<Faction[]>([]);
  public list = this.listStream.asObservable();
  private profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = factionsTable;
  public dbTableStances = factionStancesTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      //icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      factionGroup: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      public: {type: ConfigTypes.booleanType, visible: true, filterVisible: true, filterType: FilterTypes.booleanType},
      canEnterGuild: {type: ConfigTypes.booleanType, visible: true, filterVisible: true, filterType: FilterTypes.booleanType},
      color: {type: ConfigTypes.stringType, visible: true, filterVisible: true, },
      defaultStance: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.stancesList,
      },
      otherFaction: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
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
    //  icon: {name: 'icon', order: 1, type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 100},
      public: {name: 'public', type: FormFieldType.boolean, width: 33},
      canEnterGuild: {name: 'canEnterGuild', type: FormFieldType.boolean, width: 33},
      color: {name: 'color', type: FormFieldType.colorPicker, length: 64, width: 33},
      factionGroup: {name: 'factionGroup', type: FormFieldType.input, length: 64, width: 50},
      defaultStance: {
        name: 'defaultStance',
        type: FormFieldType.dropdown,
        data: this.stancesList,
        require: true,
        width: 50,
      },
    },
    subForms: {
      stances: {
        title: this.translate.instant(this.tableKey + '.STANCES'),
        submit: this.translate.instant(this.tableKey + '.ADD_STANCE'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          otherFaction: {
            name: 'otherFaction',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            width: 50,
            fieldConfig: factionFieldConfig,
          },
          defaultStance: {
            name: 'defaultStance',
            type: FormFieldType.dropdown,
            require: true,
            width: 50,
            data: this.stancesList,
          },
        },
      },
    },
  };
  private stancesForm = {
    id: {value: '', required: false},
    otherFaction: {value: '', required: true},
    defaultStance: {value: '', required: true},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      // this.tableConfig.fields.icon.iconFolder = profile.folder;
      // this.formConfig.fields.icon.acceptFolder = profile.folder;
      // this.formConfig.fields.pulseCoordEffect.acceptFolder = profile.folder + profile.coordFolder;
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadOptions();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getFactions();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getFactions();
    }
    const subFields: Record<string, SubQueryField> = {
      otherFaction: {
        type: SubTable.left_join,
        main: 'id',
        related: 'factionID',
        table: factionStancesTable,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.otherFaction.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Faction>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<Faction>(formConfig, form, {stances: this.stancesForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    // item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    // if (!item.icon) {
    //   item.icon = this.profile.defaultImage;
    // }
    item.icon2 = "";
    item.icon = "";
    item.category = 1;
    item.isactive = true;
    item.public = item.public ? item.public : false;
    item.canEnterGuild = item.canEnterGuild ? item.canEnterGuild : false;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const items = item.stances as FactionStances[];
    delete item.stances;
    const newId = await this.databaseService.insert<Faction>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, items, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<Faction>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStances} WHERE isactive = 1 and factionID = ?`,
      [record.id],
    );
    const stancesAll: number[] = [];
    for (const stance of list) {
      stancesAll.push(stance.id);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const stances = item.stances as FactionStances[];
    delete item.stances;
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<Faction>(this.dbProfile, this.dbTable, item);
      this.saveSubs(newId, stances.map((s) => ({...s, id: undefined})), []);
    } else {
      await this.databaseService.update<Faction>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      this.saveSubs(record.id as number, stances, stancesAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<Faction>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: FactionStances[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStances} WHERE isactive = 1 and factionID = ?`,
      [baseRecord.id],
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const stances = item.stances as FactionStances[];
    delete item.stances;
    const newId = await this.databaseService.insert<Faction>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, stances, []);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    return newId;
  }

  private async prepareForm(record: Faction, list: FactionStances[], updateMode = false): Promise<{item: Faction | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const stance of list) {
      (form.get('stances') as FormArray).push(
        this.subFormService.buildSubForm<FactionStances, any>(this.stancesForm, stance),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Faction>(formConfig, form, {stances: this.stancesForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    // item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    // if (!item.icon) {
    //   item.icon = this.profile.defaultImage;
    // }
    item.icon2 = "";
    item.icon = "";
    item.category = 1;
    item.isactive = true;
    item.public = item.public ? item.public : false;
    item.canEnterGuild = item.canEnterGuild ? item.canEnterGuild : false;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private saveSubs(recordId: number, items: FactionStances[], itemsAll: number[]): void {
    for (const item of items) {
      item.isactive = true;
      item.factionID = recordId;
      item.updatetimestamp = this.databaseService.getTimestampNow();
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        this.databaseService.update<FactionStances>(this.dbProfile, this.dbTableStances, item, 'id', item.id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        this.databaseService.insert<FactionStances>(this.dbProfile, this.dbTableStances, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        this.databaseService.update<FactionStances>(
          this.dbProfile,
          this.dbTableStances,
          {isactive: false, updatetimestamp: this.databaseService.getTimestampNow()} as FactionStances,
          'id',
          itemId,
        );
      }
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Faction>(this.dbProfile, this.dbTable, 'id', id);
    const stances = [];
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableStances} WHERE isactive = 1 and factionID = ?`,
      [record.id],
    );
    for (const item of list) {
      const itm = await this.dropdownItemsService.getFaction(item.otherFaction);
      const defStance = this.stancesList.find((stance) => stance.id === item.defaultStance);
      stances.push({
        otherfaction: itm ? itm.value : item.otherFaction,
        defaultstance: defStance ? defStance.value : item.defaultStance,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {stances}},
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      color: [''],
      icon: '',
      factionGroup: [''],
      public: [''],
      canEnterGuild: [''],
      defaultStance: ['', Validators.required],
      stances: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('stances') as FormArray).clear();
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
