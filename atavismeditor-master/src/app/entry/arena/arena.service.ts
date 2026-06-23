import {Injectable} from '@angular/core';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  TableConfig,
  WhereQuery
} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {arenaTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {currencyFieldConfig, instanceFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

export interface Arena {
  id?: number;
  arenaType: number;
  name: string;
  arenaCategory: number;
  arenaInstanceID: number;
  length: number;
  defaultWinner: number;
  team1: number;
  team2: number;
  team3: number;
  team4: number;
  levelReq: number;
  levelMax: number;
  victoryCurrency: number;
  victoryPayment: number;
  defeatCurrency: number;
  defeatPayment: number;
  victoryExp: number;
  defeatExp: number;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  description: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  teams?: ArenaTeam[];
}

export interface ArenaTeam {
  id?: number;
  arenaID: number;
  name: string;
  size: number;
  race: number;
  goal: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ArenaService {
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  public tableKey = TabTypes.ARENA;
  private readonly listStream = new BehaviorSubject<Arena[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = arenaTable;
  public dbTableTeams = 'arena_teams';
  private readonly arenaTypes: DropdownValue[] = [{id: 1, value: this.translate.instant('ARENA.TYPE.DEATHMATCH')}];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      arenaType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.arenaTypes,
      },
      arenaInstanceID: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: instanceFieldConfig,
      },
      length: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_hour: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      start_minute: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_hour: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      end_minute: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      levelReq: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      levelMax: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      victoryCurrency: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      victoryPayment: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      victoryExp: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      defeatCurrency: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      defeatPayment: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      defeatExp: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      size: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      goal: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 50},
      arenaType: {name: 'arenaType', type: FormFieldType.dropdown, require: true, width: 50, data: this.arenaTypes},
      arenaInstanceID: {
        name: 'arenaInstanceID',
        type: FormFieldType.dynamicDropdown,
        require: true,
        allowNew: true,
        width: 50,
        fieldConfig: instanceFieldConfig,
      },
      length: {name: 'length', type: FormFieldType.integer, require: true, width: 50},
      start_hour: {name: 'start_hour', type: FormFieldType.integer, width: 25, length: 2},
      start_minute: {name: 'start_minute', type: FormFieldType.integer, width: 25, length: 2},
      end_hour: {name: 'end_hour', type: FormFieldType.integer, width: 25, length: 2},
      end_minute: {name: 'end_minute', type: FormFieldType.integer, width: 25, length: 2},
      levelReq: {name: 'levelReq', type: FormFieldType.integer, width: 50},
      levelMax: {name: 'levelMax', type: FormFieldType.integer, width: 50},
      victoryCurrency: {
        name: 'victoryCurrency',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: currencyFieldConfig,
      },
      victoryPayment: {name: 'victoryPayment', type: FormFieldType.integer, width: 33},
      victoryExp: {name: 'victoryExp', type: FormFieldType.integer, width: 33},
      defeatCurrency: {
        name: 'defeatCurrency',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        allowNew: true,
        fieldConfig: currencyFieldConfig,
      },
      defeatPayment: {name: 'defeatPayment', type: FormFieldType.integer, width: 33},
      defeatExp: {name: 'defeatExp', type: FormFieldType.integer, width: 33},
      description: {name: 'description', type: FormFieldType.textarea, width: 100, length: 256},
    },
    subForms: {
      teams: {
        title: this.translate.instant(this.tableKey + '.TEAMS'),
        submit: '',
        minCount: 2,
        maxCount: 2,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          name: {name: 'name', type: FormFieldType.input, require: true, width: 33, length: 32},
          size: {name: 'size', type: FormFieldType.integer, width: 33},
          goal: {name: 'goal', type: FormFieldType.integer, width: 33},
          spawnX: {name: 'spawnX', type: FormFieldType.decimal, width: 33},
          spawnY: {name: 'spawnY', type: FormFieldType.decimal, width: 33},
          spawnZ: {name: 'spawnZ', type: FormFieldType.decimal, width: 33},
        },
      },
    },
  };
  private readonly teamForm = {
    id: {value: '', required: false},
    name: {value: '', required: true},
    size: {value: 1, required: false, min: 1},
    goal: {value: 1, required: false, min: 1},
    spawnX: {value: 0, required: false},
    spawnY: {value: 0, required: false},
    spawnZ: {value: 0, required: false},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
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
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.victoryCurrency.data = list;
      this.tableConfig.fields.defeatCurrency.data = list;
    });
    this.dropdownItemsService.instancesOptions.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.arenaInstanceID.data = list;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions() {
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getInstancesOption();
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      size: {
        type: SubTable.left_join,
        main: 'id',
        related: 'arenaID',
        table: this.dbTableTeams,
        where: {},
      },
      goal: {
        type: SubTable.left_join,
        main: 'id',
        related: 'arenaID',
        table: this.dbTableTeams,
        where: {},
      },
    };
    if (queryParams.where.hasOwnProperty('isactive')) {
      subFields.size.where.isactive = (queryParams.where as WhereQuery).isactive;
      subFields.goal.where.isactive = (queryParams.where as WhereQuery).isactive;
    }
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<Arena>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<Arena>(formConfig, form, {teams: this.teamForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const teams = item.teams as ArenaTeam[];
    delete item.teams;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<Arena>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, teams, []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return newId;
  }

  public async updateItem(id: number): Promise<number> {
    const record = await this.databaseService.queryItem<Arena>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableTeams} WHERE isactive = 1 and arenaID = ?`,
      [record.id],
      false,
    );
    let {item, teamsAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return 0;
    }
    const teams = item.teams as ArenaTeam[];
    delete item.teams;
    if (action === DialogCloseType.save_as_new) {
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      item = this.setDefaults(item);
      const newId = await this.databaseService.insert<Arena>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, teams.map((t) => ({...t, id: undefined})), []);
    } else {
      await this.databaseService.update<Arena>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, teams, teamsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async duplicateItem(recordId: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<Arena>(this.dbProfile, this.dbTable, 'id', recordId);
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const list: ArenaTeam[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableTeams} WHERE isactive = 1 and arenaID = ?`,
      [recordId],
    );
    const {item} = await this.prepareSubForm(
      record,
      list.map((arenaTmp) => {
        const {id, ...arenTmp} = arenaTmp;
        return arenTmp;
      }),
    );
    if (!item) {
      return 0;
    }
    const teams = item.teams as ArenaTeam[];
    delete item.teams;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<Arena>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, teams, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<Arena>(this.dbProfile, this.dbTable, 'id', id);
    const teams: any[] = [];
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableTeams} WHERE isactive = 1 and arenaID = ?`,
      [record.id],
      false,
    );
    for (const item of list) {
      teams.push({
        name: item.name,
        size: item.size,
        goal: item.goal,
        spawnX: item.spawnX,
        spawnY: item.spawnY,
        spawnZ: item.spawnZ,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {teams}},
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

  private async prepareSubForm(
    record: Arena,
    list: ArenaTeam[],
    updateMode = false,
  ): Promise<{item: Arena | undefined; teamsAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const teamsAll: number[] = [];
    for (const arenaTeam of list) {
      if (arenaTeam.id) {
        teamsAll.push(arenaTeam.id);
      }
      (form.get('teams') as FormArray).push(this.subFormService.buildSubForm<ArenaTeam, any>(this.teamForm, arenaTeam));
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<Arena>(formConfig, form, {teams: this.teamForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, teamsAll, action};;
    }
    this.resetForm(form);
    return {item, teamsAll, action};
  }

  private setDefaults(item: Arena): Arena {
    item.levelReq = item.levelReq ? item.levelReq : 1;
    item.levelMax = item.levelMax ? item.levelMax : 1;
    item.start_hour = item.start_hour ? item.start_hour : 0;
    item.start_minute = item.start_minute ? item.start_minute : 0;
    item.end_hour = item.end_hour ? item.end_hour : 0;
    item.end_minute = item.end_minute ? item.end_minute : 0;
    item.description = item.description ? item.description : '';
    item.defaultWinner = item.defaultWinner ? item.defaultWinner : 1;
    item.victoryCurrency = item.victoryCurrency ? item.victoryCurrency : -1;
    item.defeatCurrency = item.defeatCurrency ? item.defeatCurrency : -1;
    item.victoryPayment = item.victoryPayment ? item.victoryPayment : 0;
    item.victoryExp = item.victoryExp ? item.victoryExp : 0;
    item.defeatPayment = item.defeatPayment ? item.defeatPayment : 0;
    item.defeatExp = item.defeatExp ? item.defeatExp : 0;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveSubs(id: number, items: ArenaTeam[], itemsAll: number[] = []): Promise<void> {
    let i = 1;
    for (const item of items) {
      item.isactive = true;
      item.arenaID = id;
      item.race = 0;
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        item.updatetimestamp = this.databaseService.getTimestampNow();
        await this.databaseService.update<ArenaTeam>(this.dbProfile, this.dbTableTeams, item, 'id', item.id);
        const updateItem = {
          updatetimestamp: this.databaseService.getTimestampNow(),
        } as Arena;
        // @ts-ignore
        updateItem['team' + i] = item.id;
        await this.databaseService.update<Arena>(this.dbProfile, this.dbTable, updateItem, 'id', id);
      } else {
        item.creationtimestamp = this.databaseService.getTimestampNow();
        // @ts-ignore
        delete item.id;
        const itemNewId = await this.databaseService.insert<ArenaTeam>(this.dbProfile, this.dbTableTeams, item, false);
        const updateItem = {
          updatetimestamp: this.databaseService.getTimestampNow(),
        } as Arena;
        // @ts-ignore
        updateItem['team' + i] = itemNewId;
        await this.databaseService.update<Arena>(this.dbProfile, this.dbTable, updateItem, 'id', id);
      }
      ++i;
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        this.databaseService.update<ArenaTeam>(
          this.dbProfile,
          this.dbTableTeams,
          {isactive: false, updatetimestamp: this.databaseService.getTimestampNow()} as ArenaTeam,
          'id',
          itemId,
        );
      }
    }
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('teams') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      arenaType: [null, Validators.required],
      arenaInstanceID: ['', Validators.required],
      length: [1, [Validators.min(1), Validators.required]],
      start_hour: [0, [Validators.min(0), Validators.max(23)]],
      start_minute: [0, [Validators.min(0), Validators.max(59)]],
      end_hour: [0, [Validators.min(0), Validators.max(23)]],
      end_minute: [0, [Validators.min(0), Validators.max(59)]],
      levelReq: [1, Validators.min(1)],
      levelMax: [1, Validators.min(1)],
      victoryCurrency: '',
      victoryPayment: [0, Validators.min(0)],
      victoryExp: [0, Validators.min(0)],
      defeatCurrency: '',
      defeatPayment: [0, Validators.min(0)],
      defeatExp: [0, Validators.min(0)],
      description: '',
      teams: new FormArray([]),
    });
    (form.get('levelReq') as AbstractControl).valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      const validators = [];
      if (value !== null) {
        validators.push(Validators.min(value));
      }
      (form.get('levelMax') as AbstractControl).setValidators(validators);
      (form.get('levelMax') as AbstractControl).updateValueAndValidity();
    });
    return form;
  }
}
