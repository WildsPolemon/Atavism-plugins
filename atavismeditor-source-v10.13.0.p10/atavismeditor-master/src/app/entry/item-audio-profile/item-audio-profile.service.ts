import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType, hiddenField,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {itemAudioProfileTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {ItemAudioProfile} from './item-audio-profile.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';



@Injectable({
  providedIn: 'root',
})
export class ItemAudioProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.ITEM_AUDIO_PROFILE;
  private readonly listStream = new BehaviorSubject<ItemAudioProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = itemAudioProfileTable;
  private formDestroyer = new Subject<void>();

  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: false,
    count: 10,
    fields: {
      id: {
        type: ConfigTypes.numberType,
        visible: true,
        alwaysVisible: true,
      },
      name: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      use_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      drag_begin_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      drag_end_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      delete_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      broke_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      pick_up_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      fall_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      drop_event: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
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
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 45},
      use_event: {name: 'use_event', type: FormFieldType.input, length: 250},
      drag_begin_event: {name: 'drag_begin_event', type: FormFieldType.input, length: 250},
      drag_end_event: {name: 'drag_end_event', type: FormFieldType.input, length: 250},
      delete_event: {name: 'delete_event', type: FormFieldType.input, length: 250},
      broke_event: {name: 'broke_event', type: FormFieldType.input, length: 250},
      pick_up_event: {name: 'pick_up_event', type: FormFieldType.input, length: 250},
      fall_event: {name: 'fall_event', type: FormFieldType.input, length: 250},
      drop_event: {name: 'drop_event', type: FormFieldType.input, length: 250},
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
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const defaultIsActiveFilter = typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        this.loadOptions();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions(): Promise<void> {
    // await this.dropdownItemsService.getLevelXpRewardProfile();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
    };
    //if (queryParams.where.hasOwnProperty('isactive')) {
    //   subFields.reward_type.where.isactive = (queryParams.where as WhereQuery).isactive;
    // }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<ItemAudioProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    this.listStream.next(response.list.map((item) => ({id: item.profile_id, ...item})));
  }

  public async previewItems(id: number): Promise<void> {
    const actionSettings = [];
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {actionSettings}},
    });
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<ItemAudioProfile>(formConfig, form,{
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }

    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<ItemAudioProfile>(this.dbProfile, this.dbTable, 'id', item.id);
    let newId;
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      newId = await this.databaseService.insert<ItemAudioProfile>(this.dbProfile, this.dbTable, item);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<ItemAudioProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }

    let {item, action} = await this.prepareSubForm(record,true);
    if (!item) {
      return null;
    }
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<ItemAudioProfile>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<ItemAudioProfile>(this.dbProfile, this.dbTable, item, 'id', id);
    }
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<ItemAudioProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let {item} = await this.prepareSubForm(record);
    if (!item) {
      return 0;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    // item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<ItemAudioProfile>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }


  private async prepareSubForm(
    record: ItemAudioProfile,
    updateMode = false,
  ): Promise<{item: ItemAudioProfile | undefined; action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const actionSettingsAll: number[] = [];
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<ItemAudioProfile>(formConfig, form, {});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }


  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form =  this.fb.group({
      name: ['', Validators.required ],
      use_event: '',
      drag_begin_event: '',
      drag_end_event: '',
      delete_event: '',
      broke_event: '',
      pick_up_event: '',
      fall_event: '',
      drop_event: '',
    });
      return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'id', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.tableConfig.actions = [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ];
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
