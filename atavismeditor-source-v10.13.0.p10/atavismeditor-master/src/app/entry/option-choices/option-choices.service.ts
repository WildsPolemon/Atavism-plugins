import {Injectable} from '@angular/core';
import {DatabaseService} from '../../services/database.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {getProfilePipe, Utils} from '../../directives/utils';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {TabTypes} from '../../models/tabTypes.enum';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {EditorOption, EditorOptionChoice} from './option-choices.data';
import {HandleOptionDepsService} from '../../components/handle-option-deps/handle-option-deps.service';
import {DropdownItemsService} from '../dropdown-items.service';

export interface Item {
  id: number;
  name: string;
  isactive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OptionChoicesService {
  public tableKey: TabTypes = TabTypes.OPTION_CHOICE;
  private readonly listStream = new BehaviorSubject<EditorOption[]>([]);
  public list = this.listStream.asObservable();
  private readonly optionsUpdatedStream = new ReplaySubject<void>(1);
  public optionsUpdated = this.optionsUpdatedStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = 'editor_option';
  public dbTableChoice = 'editor_option_choice';
  public tableConfig: TableConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.TITLE'),
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      optionType: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      deletable: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
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
    queryParams: {search: '', where: {}, sort: {field: 'optionType', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      deletable: {name: 'deletable', label: '', type: FormFieldType.hidden},
      optionType: {
        name: 'optionType',
        type: FormFieldType.input,
        require: true,
        length: 44,
      },
    },
    subForms: {
      choices: {
        title: this.translate.instant(this.tableKey + '.CHOICE'),
        submit: this.translate.instant('ACTIONS.ADD_ITEM'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          deletable: {name: 'deletable', label: '', type: FormFieldType.hidden},
          choice: {
            name: 'choice',
            type: FormFieldType.input,
            require: true,
            length: 44,
          },
        },
      },
    },
  };
  public subForm: SubFieldType = {
    id: {value: '', required: false},
    deletable: {value: true, required: false},
    choice: {value: '', required: true},
  };
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly handleOptionDeps: HandleOptionDepsService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {
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
      }
    });
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    (form.get('deletable') as AbstractControl).patchValue(true);
    let {item} = await this.tablesService.openDialog<EditorOption>(formConfig, form, {choices: this.subForm});
    if (!item) {
      this.resetForm(form);
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const choices = item.choices as EditorOptionChoice[];
    delete item.choices;
    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT count(*) as isAlreadyUsed FROM ${this.dbTable} WHERE optionType = '${item.optionType}'`,
    );
    if (+result[0].isAlreadyUsed !== 0) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_ERROR'));
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const newId = await this.databaseService.insert<EditorOption>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, choices);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    this.optionsReload();
    return {id: newId, value: item.optionType};
  }

  public async updateItem(
    id: number | string,
    field = 'id',
    editOptionsMode = false,
  ): Promise<{items: DropdownValue[]; result: boolean}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    const record = await this.databaseService.queryItem<EditorOption>(this.dbProfile, this.dbTable, field, id);
    if (!record) {
      return {items: [], result: false};
    }
    const form = this.createForm();
    const options = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableChoice} WHERE isactive = 1 AND optionTypeID = ?`,
      [record.id],
    );
    const allOptions: number[] = [];
    for (const option of options) {
      allOptions.push(option.id);
      const subForm = new FormGroup({});
      Object.keys(this.subForm).forEach((key) => {
        subForm.addControl(key, new FormControl(option[key], this.subForm[key].required ? Validators.required : null));
      });
      (form.get('choices') as FormArray).push(subForm);
    }
    form.patchValue(record);
    let {item} = await this.tablesService.openDialog<EditorOption>(this.formConfig, form, {choices: this.subForm});
    if (!item) {
      this.resetForm(form);
      return {items: [], result: false};
    }
    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT count(*) as isAlreadyUsed FROM ${this.dbTable} WHERE id != '${record.id}' AND optionType = '${item.optionType}'`,
    );
    if (+result[0].isAlreadyUsed !== 0) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_ERROR'));
      this.resetForm(form);
      return {items: [], result: false};
    }
    const choices = item.choices as EditorOptionChoice[];
    delete item.choices;
    item = this.setDefaults(item);
    await this.databaseService.update<EditorOption>(this.dbProfile, this.dbTable, item, 'id', record.id);
    const newItems = await this.saveSubs(
      record.id,
      choices,
      allOptions,
      item.optionType === 'Item Quality',
      editOptionsMode,
    );
    await this.handleOptionDeps.handleEditedOptions(record, choices, options);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    this.optionsReload();
    return {items: newItems, result: true};
  }

  public optionsReload(): void {
    this.optionsUpdatedStream.next(void 0);
  }

  private setDefaults(item: EditorOption): EditorOption {
    item.deletable = item.deletable ?? true;
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const record = await this.databaseService.queryItem<EditorOption>(this.dbProfile, this.dbTable, 'id', id);
    const item = {...record};
    delete (item as any).id;
    item.optionType = item.optionType + ' (1)';
    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT count(*) as isAlreadyUsed FROM ${this.dbTable} WHERE optionType = ?`,
      [item.optionType],
    );
    if (+result[0].isAlreadyUsed === 0) {
      const options = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableChoice} WHERE isactive = 1 AND optionTypeID = ?`,
        [id],
      );
      item.creationtimestamp = this.databaseService.getTimestampNow();
      item.updatetimestamp = this.databaseService.getTimestampNow();
      const newId = await this.databaseService.insert<EditorOption>(this.dbProfile, this.dbTable, item, false);
      for (const option of options) {
        const newOption = {...option};
        delete newOption.id;
        newOption.optionTypeID = newId;
        newOption.creationtimestamp = this.databaseService.getTimestampNow();
        newOption.updatetimestamp = this.databaseService.getTimestampNow();
        await this.databaseService.insert<EditorOptionChoice>(this.dbProfile, this.dbTableChoice, newOption, false);
      }
      this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
      return newId;
    } else {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_ERROR'));
      return 0;
    }
  }

  public async saveSubs(
    parentId: number,
    choices: EditorOptionChoice[],
    all: number[] = [],
    special = false,
    editOptionsMode = false,
  ): Promise<DropdownValue[]> {
    const newItems: DropdownValue[] = [];
    const allItems: DropdownValue[] = [];
    let i = 1;
    for (const choice of choices) {
      if (choice.id) {
        all.splice(all.indexOf(choice.id), 1);
        await this.databaseService.update<EditorOptionChoice>(
          this.dbProfile,
          this.dbTableChoice,
          {choice: choice.choice, updatetimestamp: this.databaseService.getTimestampNow()} as EditorOptionChoice,
          'id',
          choice.id,
        );
        if (special) {
          allItems.push({id: i, value: choice.choice});
        } else {
          allItems.push({id: choice.id, value: choice.choice});
        }
      } else {
        const newId = await this.databaseService.insert<EditorOptionChoice>(
          this.dbProfile,
          this.dbTableChoice,
          {
            optionTypeID: parentId,
            choice: choice.choice,
            isactive: true,
            deletable: true,
            creationtimestamp: this.databaseService.getTimestampNow(),
            updatetimestamp: this.databaseService.getTimestampNow(),
          } as EditorOptionChoice,
          false,
        );
        if (special) {
          newItems.push({id: i, value: choice.choice});
          allItems.push({id: i, value: choice.choice});
        } else {
          newItems.push({id: newId, value: choice.choice});
          allItems.push({id: newId, value: choice.choice});
        }
      }
      i++;
    }
    if (all.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `UPDATE ${this.dbTableChoice} SET isactive = 0 and updatetimestamp = NOW() WHERE id IN (${all.join(', ')})`,
        [],
        true,
      );
    }
    return editOptionsMode ? allItems : newItems;
  }

  public createForm(): FormGroup {
    return this.fb.group({
      deletable: 0,
      optionType: ['', Validators.required],
      choices: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('choices') as FormArray).clear();
  }

  public async getOptionsById(
    id: number | string,
    nameAsId = false,
    optionIdAsI = false,
    optionKey = '',
    queryOptions?: QueryParams,
  ): Promise<DropdownValue | EditorOptionChoice | undefined> {
    let field = 'id';
    if (nameAsId) {
      field = 'choice';
    }
    if (!optionIdAsI) {
      const response = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableChoice} where optionTypeID = (SELECT id from ${this.dbTable} where optionType = ?) AND isactive = 1 AND ?? = ?`,
        [optionKey, field, id],
      );
      return response ? response[0] : undefined;
    } else {
      const options = await this.getOptionsByType(optionKey, nameAsId, optionIdAsI, queryOptions);
      return options.find((item) => item.id === id);
    }
  }

  public async getOptionsByType(
    type: string,
    choiceAsId = false,
    idAsNumber = false,
    options?: QueryParams,
    search = '',
  ): Promise<DropdownValue[]> {
    if (type.length === 0) {
      return [];
    }
    let searchSql = '';
    if (search) {
      searchSql = ` AND choice LIKE '%${search}%'`;
    }
    if (options && options.where) {
      const wheres: string[] = [];
      Object.keys(options.where).forEach((field: string) => {
        const value = options.where ? options.where[field] : '';
        if (value === 'where_null_using') {
          wheres.push(`${field}`);
        } else {
          wheres.push(`${field} = '${value}'`);
        }
      });
      if (wheres.length > 0) {
        searchSql += ` AND ${wheres.join(' AND ')}`;
      }
    }
    const response = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT id, choice FROM ${this.dbTableChoice} where optionTypeID = (SELECT id from ${this.dbTable} where optionType = ?) AND isactive = 1 ${searchSql}`,
      [type],
    );
    if (!idAsNumber) {
      return response.map((item: EditorOptionChoice) => ({id: choiceAsId ? item.choice : item.id, value: item.choice}));
    }
    const list: DropdownValue[] = [];
    for (let i = 1; i <= response.length; i++) {
      const item = response[i - 1];
      list.push({id: i, value: item.choice});
    }
    return list;
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'optionType', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
