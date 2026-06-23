import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TabTypes} from '../../models/tabTypes.enum';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {LoadingService} from '../../components/loading/loading.service';
import {intValidator} from '../../validators/int.validator';
import {floatValidator} from '../../validators/float.validator';
import {boolValidator} from '../../validators/bool.validator';
import {ActionsIcons, ActionsNames, ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {Subject} from 'rxjs';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {gameSettingsCategoryFieldConfig} from '../dropdown.config';

interface GameSetting {
  id?: number;
  name: string;
  datatype: string;
  value: string | number;
  description: string;
  sendtoclient: boolean;
  category: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

enum dataTypes {
  int = 'int',
  bool = 'bool',
  float = 'float',
  // eslint-disable-next-line id-blacklist
  string = 'string',
}

@Component({
  selector: 'atv-game-setting',
  templateUrl: './game-setting.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class GameSettingComponent implements OnInit, OnDestroy {
  private tableKey: TabTypes = TabTypes.GAMESETTING;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true, filterVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, filterVisible: true, useAsSearch: true},
      datatype: {
        type: ConfigTypes.dropdown,
        visible: true,
        alwaysVisible: false,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        useAsSearch: false,
        data: [
          {id: dataTypes.int, value: dataTypes.int},
          {id: dataTypes.bool, value: dataTypes.bool},
          {id: dataTypes.float, value: dataTypes.float},
          {id: dataTypes.string, value: dataTypes.string},
        ],
      },
      value: {type: ConfigTypes.stringType, visible: true, filterVisible: true, useAsSearch: true},
      sendtoclient: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
       // data: this.dropdownItemsService.isActiveOptions,
      },
      category: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
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
  public list: GameSetting[] = [];
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 99},
      datatype: {
        name: 'datatype',
        type: FormFieldType.dropdown,
        data: [
          {id: dataTypes.int, value: dataTypes.int},
          {id: dataTypes.bool, value: dataTypes.bool},
          {id: dataTypes.float, value: dataTypes.float},
          {id: dataTypes.string, value: dataTypes.string},
        ],
        require: true,
        width: 33,
      },
      category: {
        name: 'category',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        search: true,
        fieldConfig: gameSettingsCategoryFieldConfig,
        width: 33,
      },
      sendtoclient: {name: 'sendtoclient', type: FormFieldType.boolean, width: 33},
      value: {name: 'value', type: FormFieldType.input, require: true, length: 44},
      description: {name: 'description', type: FormFieldType.textarea, require: true, length: 20000},
    },
  };
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private dbProfile!: DataBaseProfile;
  private dbTable = 'game_setting';
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();

  constructor(
    private readonly translate: TranslateService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly fb: FormBuilder,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly optionChoicesService: OptionChoicesService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadData();
      }
      this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
        this.loadOptionChoices();
      });
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async addItem(): Promise<void> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<GameSetting>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return;
    }
    item.isactive = true;
    if (item.datatype === dataTypes.int) {
      item.value = parseInt(item.value as string, 10);
    } else if (item.datatype === dataTypes.float) {
      item.value = parseFloat(item.value as string);
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    await this.databaseService.insert<GameSetting>(this.dbProfile, this.dbTable, item);
    this.loadData();
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return;
  }

  public async updateItem(id: number | string): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<GameSetting>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }
    const item = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    await this.databaseService.update<GameSetting>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.loadData();
    return record.id as number;
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public actionTrigger(action: ActionTrigger): void {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      this.tablesService.executeAction(this.dbProfile, this.dbTable, action).then(() => this.loadData());
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      this.duplicateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      await this.tablesService.executeBulkAction(this.dbProfile, this.dbTable, action);
      await this.loadData();
    }
  }

  private async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<GameSetting>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const item = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<GameSetting>(this.dbProfile, this.dbTable, item, false);
    this.loadData();
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: GameSetting): Promise<GameSetting | undefined> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    const {item} = await this.tablesService.openDialog<GameSetting>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    if (item.datatype === dataTypes.int) {
      item.value = parseInt(item.value as string, 10);
    } else if (item.datatype === dataTypes.float) {
      item.value = parseFloat(item.value as string);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return item;
  }

  private async loadData() {
    const response = await this.databaseService.queryList<GameSetting>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      this.queryParams,
    );
    this.list = response.list;
    this.tableConfig.count = response.count;
    this.changeDetectorRef.markForCheck();
    this.loadingService.hide();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      datatype: ['', Validators.required],
      value: ['', Validators.required],
      sendtoclient: [0],
      description: [''],
      category: [-1],

    });
    form
      .get('datatype')
      ?.valueChanges.pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        form.get('value')?.setValidators(null);
        if (value === dataTypes.int) {
          form.get('value')?.setValidators([Validators.required, Validators.maxLength(16), intValidator]);
        } else if (value === dataTypes.float) {
          form.get('value')?.setValidators([Validators.required, Validators.maxLength(16), floatValidator]);
        } else if (value === dataTypes.bool) {
          form.get('value')?.setValidators([Validators.required, boolValidator]);
        } else {
          form.get('value')?.setValidators(Validators.required);
        }
        form.get('value')?.updateValueAndValidity();
      });
    return form;
  }
  public getPreviewItem(id: number | string): void {
    this.previewItems(id as number);
  }
  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<GameSetting>(this.dbProfile, this.dbTable, 'id', id);
    const Description = [];
    Description.push({
      Description2: record.description,
      });
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {Description}},
    });
  }



  private resetForm(form: FormGroup): void {
    form.reset();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
  }
  public async loadOptionChoices() {
    this.tableConfig.fields.category.data = await this.optionChoicesService.getOptionsByType(
      'Game Settings Category',
    );
  }
}
