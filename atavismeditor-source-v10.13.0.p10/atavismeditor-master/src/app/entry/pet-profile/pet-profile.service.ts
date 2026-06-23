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
import {
  petProfileLevelTable,
  petProfileTable,
} from '../tables.data';
import {vipLevelValidator} from '../../validators/vip-level.validator';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  mobsFieldConfig,
  slotsProfileFieldConfig,

} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {PetLevelSetting, PetProfile} from './pet-profile.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';



@Injectable({
  providedIn: 'root',
})
export class PetProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.PET_PROFILE;
  private readonly listStream = new BehaviorSubject<PetProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = petProfileTable;
  public dbPetLevelSettingsTable = petProfileLevelTable;
  private formDestroyer = new Subject<void>();
  private readonly actionType: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.ABILITY')},
    {id: 1, value: this.translate.instant(this.tableKey + '.ZOOM')},
  ];
  private readonly petLevelSettingForm: SubFieldType = {
    id: {value: -1, required: false},
    profile_id: {value: '', required: false},
    level: {value: 1, required: true, min: 1},
    exp: {value: 1, required: true, min: 1},
    template_id: {value: -1, required: true},
    slot_profile_id: {value: -1, required: false},
    coordEffect: {value: '', required: false},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
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
      template_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: mobsFieldConfig,
      },
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
    },
    subForms: {
      petLevelSettings: {
        title: this.translate.instant(this.tableKey + '.LEVEL'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVEL'),
        minCount: 1,
        columnWidth: 100,
        draggable: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          profile_id: {name: 'profile_id', label: '', type: FormFieldType.hidden},
          level: {name: 'level', type: FormFieldType.integer, require: true, width: 10},
          exp: {name: 'exp', type: FormFieldType.integer, require: true, width: 15},
          template_id: {
            name: 'template_id',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            width: 50,
            search: true,
            fieldConfig: mobsFieldConfig,
            require: true
          },
          slot_profile_id: {
            name: 'slot_profile_id',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            width: 25,
            search: true,
            fieldConfig: slotsProfileFieldConfig,
          },
          coordEffect: {
            name: 'coordEffect',
            type: FormFieldType.file,
            acceptFolder: '/',
            acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
            accept: 'prefab',
            length: 127,
          },
        },
      },
    },
  };
 // private slots: DropdownValue[] = [];
  private mobList: DropdownValue[] = [];
  private slotProfileList: DropdownValue[] = [];
  // private actionList: DropdownValue[] = [];
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
        this.loadOptionChoices();
      }
    });
    this.dropdownItemsService.mobs.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.mobList = list;
    });
    this.dropdownItemsService.slotsProfile.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.slotProfileList = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
      this.loadOptionChoices();
    });
    this.loadOptionChoices();
  }

  public async loadOptionChoices(): Promise<void> {
    // this.actionList = await this.optionChoicesService.getOptionsByType('Weapon Actions');

  }
  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getMobs();
    await this.dropdownItemsService.getSlotsProfile();
    // await this.dropdownItemsService.getLevelXpRewardProfile();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      template_id: {
        type: SubTable.left_join,
        main: 'template_id',
        related: 'id',
        table: this.dbPetLevelSettingsTable,
      },
    };
    //if (queryParams.where.hasOwnProperty('isactive')) {
    //   subFields.reward_type.where.isactive = (queryParams.where as WhereQuery).isactive;
    // }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<PetProfile>(
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
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbPetLevelSettingsTable} WHERE profile_id = ? order by level ASC`,
      [id],
    );
    const petLevelSettings = [];
    for (const item1 of list) {
      const mobs = this.mobList.find((item) => item.id === item1.template_id);
      const slotProfiles = this.slotProfileList.find((item) => item.id === item1.slot_profile_id);
      petLevelSettings.push({
        level: item1.level,
        exp: item1.exp,
        template_id: mobs ? mobs.value : item1.template_id,
        slot_profile_id: slotProfiles ? slotProfiles.value : item1.slot_profile_id,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {petLevelSettings}},
    });
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<PetProfile>(formConfig, form,{
      petLevelSettings: this.petLevelSettingForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const petLevelSettings = item.petLevelSettings as PetLevelSetting[];
    delete item.petLevelSettings;

    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<PetProfile>(this.dbProfile, this.dbTable, 'id', item.id);
    let newId;
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      newId = await this.databaseService.insert<PetProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, petLevelSettings, []);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<PetProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbPetLevelSettingsTable} WHERE profile_id = ? order by level ASC`,
      [record.id],
    );

    let {item, petLevelSettingsAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return null;
    }
    const petLevelSettings = item.petLevelSettings as PetLevelSetting[];
    delete item.petLevelSettings;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    let newId = id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<PetProfile>(this.dbProfile, this.dbTable, item);

      await this.saveSubs(newId, petLevelSettings.map((b) => ({...b, id: undefined })), []);
    } else {
      await this.databaseService.update<PetProfile>(this.dbProfile, this.dbTable, item, 'id', id);
      await this.saveSubs(record.id as number, petLevelSettings, petLevelSettingsAll);
    }
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<PetProfile>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: PetLevelSetting[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbPetLevelSettingsTable} WHERE profile_id = ? order by level ASC`,
      [id],
    );
    list = list.map((l) => ({...l, id: undefined}));
    let {item} = await this.prepareSubForm(record, list);
    if (!item) {
      return 0;
    }
    const petLevelSettings = item.petLevelSettings as PetLevelSetting[];

    delete item.petLevelSettings;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    // item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<PetProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, petLevelSettings, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }


  private async prepareSubForm(
    record: PetProfile,
    list: PetLevelSetting[],
    updateMode = false,
  ): Promise<{item: PetProfile | undefined; petLevelSettingsAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const petLevelSettingsAll: number[] = [];
    for (const item2 of list) {

      if (item2.id) {
        petLevelSettingsAll.push(item2.id);
      }
      (form.get('petLevelSettings') as FormArray).push(
        this.subFormService.buildSubForm<PetLevelSetting, any>(this.petLevelSettingForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<PetProfile>(formConfig, form, {petLevelSettings: this.petLevelSettingForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, petLevelSettingsAll: [], action};
    }
    this.resetForm(form);
    return {item, petLevelSettingsAll, action};
  }


  private async saveSubs(id: number, items: PetLevelSetting[], all: number[] = []): Promise<void> {
    for (const item of items) {
      item.profile_id = id;
      if(item.id == -1)
        delete item.id;
      if(item.slot_profile_id == undefined)
        item.slot_profile_id = -1;
      // if(item.pet_action_type==1)
      //   item.ability_id=-1;
      const records = await this.databaseService.queryAll<PetLevelSetting>(
        this.dbProfile,
        this.dbPetLevelSettingsTable,
        this.tableConfig.fields,
        {
          where: {profile_id: id,
                  id: item.id,
                  },
        },
      );
      if (records.length > 0) {
        all.splice(all.indexOf(item.id), 1);
        await this.databaseService.update<PetLevelSetting>(this.dbProfile, this.dbPetLevelSettingsTable, item, 'profile_id = '+id+' and id', item.id);
      } else {
        await this.databaseService.insert<PetLevelSetting>(this.dbProfile, this.dbPetLevelSettingsTable, item, false);
      }
    }
    if (all.length > 0) {
      for (const id2 of all) {
        await this.databaseService.delete(this.dbProfile, this.dbPetLevelSettingsTable, 'profile_id = '+id+' and id', id2);
      }
    }
  }


  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form =  this.fb.group({
      name: ['', Validators.required ],
      petLevelSettings: new FormArray([]),
    });

      return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
//    (form.get('level') as AbstractControl).enable();
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
