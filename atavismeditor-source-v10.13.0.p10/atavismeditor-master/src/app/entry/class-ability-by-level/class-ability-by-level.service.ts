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
import {classAbilityByLevelTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {abilityFieldConfig, classFieldConfig} from '../dropdown.config';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {takeUntil} from 'rxjs/operators';

export interface ClassAbilityByLevel {
  id?: number;
  aspect: number;
  player_level: number;
  ability_id: number;
  auto_learn: boolean;
  unlearn_on_delevel: boolean;
  sort_order: number;
  isactive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ClassAbilityByLevelService {
  public tableKey = TabTypes.CLASS_ABILITY_BY_LEVEL;
  private readonly listStream = new BehaviorSubject<ClassAbilityByLevel[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = classAbilityByLevelTable;
  private destroyer = new Subject<void>();

  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      aspect: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: [],
      },
      player_level: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
        useAsSearch: true,
      },
      ability_id: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: abilityFieldConfig,
        data: [],
      },
      auto_learn: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      unlearn_on_delevel: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      sort_order: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
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
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {
      search: '',
      where: {},
      sort: {field: 'aspect', order: 'asc'},
      limit: {limit: 10, page: 0},
    },
  };

  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      titleInfo: {
        name: '',
        label: this.translate.instant(this.tableKey + '.FORM_INTRO'),
        type: FormFieldType.title,
      },
      aspect: {
        name: 'aspect',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: classFieldConfig,
        require: true,
        allowNew: true,
        width: 50,
      },
      player_level: {
        name: 'player_level',
        type: FormFieldType.integer,
        require: true,
        width: 50,
      },
      ability_id: {
        name: 'ability_id',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: abilityFieldConfig,
        require: true,
        allowNew: true,
        width: 100,
      },
      auto_learn: {name: 'auto_learn', type: FormFieldType.boolean, width: 33},
      unlearn_on_delevel: {name: 'unlearn_on_delevel', type: FormFieldType.boolean, width: 33},
      sort_order: {name: 'sort_order', type: FormFieldType.integer, width: 33},
    },
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly optionChoicesService: OptionChoicesService,
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
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.ability_id.data = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadClassOptions();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getAbilities();
    await this.loadClassOptions();
  }

  private async loadClassOptions(): Promise<void> {
    const listing = await this.optionChoicesService.getOptionsByType('Class');
    this.tableConfig.fields.aspect.data = listing;
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      await this.loadOptions();
    }
    const response = await this.databaseService.queryList<ClassAbilityByLevel>(
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
    const {item} = await this.tablesService.openDialog<ClassAbilityByLevel>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.auto_learn = item.auto_learn !== false;
    item.unlearn_on_delevel = item.unlearn_on_delevel !== false;
    item.sort_order = item.sort_order || 0;
    await this.databaseService.insert<ClassAbilityByLevel>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: item.id as number, value: String(item.ability_id)};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<ClassAbilityByLevel>(this.dbProfile, this.dbTable, 'id', id);
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
      await this.databaseService.insert<ClassAbilityByLevel>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<ClassAbilityByLevel>(this.dbProfile, this.dbTable, item, 'id', id);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return {id: item.id as number, value: String(item.ability_id)};
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<ClassAbilityByLevel>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    if (!baseRecord) {
      return 0;
    }
    const record = {...baseRecord};
    delete record.id;
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.isactive = true;
    await this.databaseService.insert<ClassAbilityByLevel>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return 1;
  }

  private async prepareForm(
    record: ClassAbilityByLevel,
    updateMode = false,
  ): Promise<{item: ClassAbilityByLevel | undefined; action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<ClassAbilityByLevel>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private createForm(): FormGroup {
    return this.fb.group({
      aspect: ['', Validators.required],
      player_level: [1, [Validators.required, Validators.min(1)]],
      ability_id: ['', Validators.required],
      auto_learn: [true],
      unlearn_on_delevel: [true],
      sort_order: [0, [Validators.min(0)]],
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset({
      auto_learn: true,
      unlearn_on_delevel: true,
      sort_order: 0,
      player_level: 1,
    });
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'aspect', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
