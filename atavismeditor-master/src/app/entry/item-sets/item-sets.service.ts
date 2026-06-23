import {Injectable} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {itemSetLevelTable, itemSetsItemsTable, itemSetsTable, itemTemplatesTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubQueryField, SubTable} from '../sub-form.service';
import {ItemSet, ItemSetItem, ItemSetLevel, ItemSetLevelStat} from './item-sets.data';
import {abilityFieldConfig, effectFieldConfig, statFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ItemSetsService {
  public tableKey = TabTypes.ITEM_SETS;
  private readonly listStream = new BehaviorSubject<ItemSet[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = itemSetsTable;
  public dbTableItems = itemSetsItemsTable;
  public dbTableLevels = itemSetLevelTable;
  private itemFieldConfig = {
    idField: 'id',
    valueField: 'name',
    profile: DataBaseType.world_content,
    table: itemTemplatesTable,
    options: {where: {isactive: 1, ' ( itemType = "Armor" OR itemType = "Weapon" ) ': 'where_null_using'}},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      number_of_parts: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      damage: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      damagep: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      template_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: this.itemFieldConfig,
      },
      effectname: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: statFieldConfig,
      },
      effectvalue: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      effectvaluep: {
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
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
      items: {
        name: 'items',
        type: FormFieldType.dynamicDropdown,
        multiple: true,
        allowNew: true,
        width: 100,
        fieldConfig: this.itemFieldConfig,
      },
    },
    subForms: {
      levels: {
        title: this.translate.instant(this.tableKey + '.LEVELS'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVELS'),
        columnWidth: 100,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          number_of_parts: {name: 'number_of_parts', type: FormFieldType.integer, require: true, width: 33},
          damage: {name: 'damage', type: FormFieldType.integer, require: true, width: 33},
          damagep: {name: 'damagep', type: FormFieldType.integer, require: true, width: 33},
        },
        subForms: {
          stats: {
            title: this.translate.instant(this.tableKey + '.STATS'),
            submit: this.translate.instant(this.tableKey + '.ADD_STAT'),
            maxCount: 32,
            countSubForms: {stats: true, abilities: true, effects: true},
            fields: {
              name: {
                name: 'name',
                label: this.translate.instant(this.tableKey + '.STAT_NAME'),
                type: FormFieldType.dynamicDropdown,
                require: true,
                allowNew: true,
                width: 33,
                fieldConfig: statFieldConfig,
              },
              value: {name: 'value', type: FormFieldType.integer, require: true, width: 33},
              valuep: {name: 'valuep', type: FormFieldType.integer, require: true, width: 33},
            },
          },
          abilities: {
            title: this.translate.instant(this.tableKey + '.ABILITIES'),
            submit: this.translate.instant(this.tableKey + '.ADD_ABILITIES'),
            maxCount: 32,
            columnWidth: 50,
            countSubForms: {stats: true, abilities: true, effects: true},
            fields: {
              value: {
                name: 'value',
                label: this.translate.instant(this.tableKey + '.ABILITY_NAME'),
                tooltip: this.translate.instant(this.tableKey + '.ABILITY_NAME_HELP'),
                type: FormFieldType.dynamicDropdown,
                require: true,
                allowNew: true,
                width: 100,
                fieldConfig: abilityFieldConfig,
              },
              name: {name: 'name', type: FormFieldType.hidden, disabled: true },
              valuep: {name: 'valuep', type: FormFieldType.hidden, disabled: true},
            },
          },
          effects: {
            title: this.translate.instant(this.tableKey + '.EFFECTS'),
            submit: this.translate.instant(this.tableKey + '.ADD_EFFECT'),
            maxCount: 32,
            columnWidth: 50,
            countSubForms: {stats: true, abilities: true, effects: true},
            fields: {
              value: {
                name: 'value',
                label: this.translate.instant(this.tableKey + '.EFFECT_NAME'),
                tooltip: this.translate.instant(this.tableKey + '.EFFECT_NAME_HELP'),
                type: FormFieldType.dynamicDropdown,
                require: true,
                allowNew: true,
                width: 100,
                fieldConfig: effectFieldConfig,
              },
              name: {name: 'name', type: FormFieldType.hidden, disabled: true},
              valuep: {name: 'valuep', type: FormFieldType.hidden, disabled: true},
            },
          },
        },
      },
    },
  };
  private destroyer = new Subject<void>();
  private levelForm: SubFieldType = {
    id: {value: '', required: false},
    number_of_parts: {value: 1, required: true, min: 1},
    damage: {value: 0, required: true, min: 0},
    damagep: {value: 0, required: true, min: 0, max: 100},
    stats: {isArray: true},
    abilities: {isArray: true},
    effects: {isArray: true},
  };
  private levelStatForm: SubFieldType = {
    name: {value: '', required: true},
    value: {value: 0, required: true, min: 0},
    valuep: {value: 0, required: true, min: 0},
  };

  private readonly abilityForm: SubFieldType = {
    name: {value: 'ability', required: true},
    value: {value: 0, required: true, min: 0},
    valuep: {value: 0, required: true, min: 0},
  };

  private readonly effectForm: SubFieldType = {
    name: {value: 'effect', required: true},
    value: {value: 0, required: true, min: 0},
    valuep: {value: 0, required: true, min: 0},
  };

  private abilitiesList: DropdownValue[] = [];
  private effectsList: DropdownValue[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
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
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.abilitiesList = listing;
    });
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.effectsList = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getEffects();
  }
  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      number_of_parts: {type: SubTable.left_join, main: 'id', related: 'set_id', table: this.dbTableLevels},
      damage: {type: SubTable.left_join, main: 'id', related: 'set_id', table: this.dbTableLevels},
      damagep: {type: SubTable.left_join, main: 'id', related: 'set_id', table: this.dbTableLevels},
      template_id: {type: SubTable.left_join, main: 'id', related: 'set_id', table: this.dbTableItems},
      effectname: {
        type: SubTable.multiple_left_join,
        columns: [
          'effect1name',
          'effect2name',
          'effect3name',
          'effect4name',
          'effect5name',
          'effect6name',
          'effect7name',
          'effect8name',
          'effect9name',
          'effect10name',
          'effect11name',
          'effect12name',
          'effect13name',
          'effect14name',
          'effect15name',
          'effect16name',
          'effect17name',
          'effect18name',
          'effect19name',
          'effect20name',
          'effect21name',
          'effect22name',
          'effect23name',
          'effect24name',
          'effect25name',
          'effect26name',
          'effect27name',
          'effect28name',
          'effect29name',
          'effect30name',
          'effect31name',
          'effect32name',
        ],
        main: 'id',
        related: 'set_id',
        table: this.dbTableLevels,
      },
      effectvalue: {
        type: SubTable.multiple_left_join,
        columns: [
          'effect1value',
          'effect2value',
          'effect3value',
          'effect4value',
          'effect5value',
          'effect6value',
          'effect7value',
          'effect8value',
          'effect9value',
          'effect10value',
          'effect11value',
          'effect12value',
          'effect13value',
          'effect14value',
          'effect15value',
          'effect16value',
          'effect17value',
          'effect18value',
          'effect19value',
          'effect20value',
          'effect21value',
          'effect22value',
          'effect23value',
          'effect24value',
          'effect25value',
          'effect26value',
          'effect27value',
          'effect28value',
          'effect29value',
          'effect30value',
          'effect31value',
          'effect32value',
        ],
        main: 'id',
        related: 'set_id',
        table: this.dbTableLevels,
      },
      effectvaluep: {
        type: SubTable.multiple_left_join,
        columns: [
          'effect1valuep',
          'effect2valuep',
          'effect3valuep',
          'effect4valuep',
          'effect5valuep',
          'effect6valuep',
          'effect7valuep',
          'effect8valuep',
          'effect9valuep',
          'effect10valuep',
          'effect11valuep',
          'effect12valuep',
          'effect13valuep',
          'effect14valuep',
          'effect15valuep',
          'effect16valuep',
          'effect17valuep',
          'effect18valuep',
          'effect19valuep',
          'effect20valuep',
          'effect21valuep',
          'effect22valuep',
          'effect23valuep',
          'effect24valuep',
          'effect25valuep',
          'effect26valuep',
          'effect27valuep',
          'effect28valuep',
          'effect29valuep',
          'effect30valuep',
          'effect31valuep',
          'effect32valuep',
        ],
        main: 'id',
        related: 'set_id',
        table: this.dbTableLevels,
      },
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<ItemSet>(
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
    const {item} = await this.tablesService.openDialog<ItemSet>(formConfig, form, {
      levels: this.levelForm,
      stats: this.levelStatForm,
      abilities: this.abilityForm,
      effects: this.effectForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    item.isactive = true;
    const items = item.items as string;
    delete item.items;
    const levels = item.levels as ItemSetLevel[];
    delete item.levels;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<ItemSet>(this.dbProfile, this.dbTable, item);
    this.saveSubs(newId, items.split(';'), levels, [], []);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async updateItem(id: number): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<ItemSet>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return 0;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and set_id = ${record.id}`,
    );
    const itemsAll: ItemSetItem[] = [];
    const items = [];
    for (const listItem of list) {
      itemsAll.push(listItem);
      items.push(listItem.template_id);
    }
    form.patchValue(record);
    (form.get('items') as AbstractControl).patchValue(items.join(';'));
    const levelList = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevels} WHERE set_id = ${record.id}`,
    );
    const levelsAll: number[] = [];
    for (const levelItem of levelList) {
      levelsAll.push(levelItem.id);
      const subForm = new FormGroup({});
      Object.keys(this.levelForm).forEach((key) => {
        if (this.levelForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          for (let i = 1; i <= 32; i++) {
            if (levelItem['effect' + i + 'name']) {
              const subSubForm = new FormGroup({});
              if (
                (levelItem['effect' + i + 'name'] === 'effect' && key === 'effects') ||
                (levelItem['effect' + i + 'name'] === 'ability' && key === 'abilities') ||
                (!['ability', 'effect'].includes(levelItem['effect' + i + 'name']) && !['abilities', 'effects'].includes(key))
              ) {
                Object.keys(this.levelStatForm).forEach((keyStat) => {
                  const validatorsSub = [];
                  if (this.levelStatForm[keyStat].required) {
                    validatorsSub.push(Validators.required);
                  }
                  if (this.levelStatForm[keyStat].min !== undefined) {
                    validatorsSub.push(Validators.min(this.levelStatForm[keyStat].min as number));
                  }
                  if (this.levelStatForm[keyStat].max !== undefined) {
                    validatorsSub.push(Validators.max(this.levelStatForm[keyStat].max as number));
                  }
                  subSubForm.addControl(keyStat, new FormControl(levelItem['effect' + i + keyStat], validatorsSub));
                });
                (subForm.get(key) as FormArray).push(subSubForm);
              }
            }
          }
        } else {
          const validators = [];
          if (this.levelForm[key].required) {
            validators.push(Validators.required);
          }
          if (this.levelForm[key].min !== undefined) {
            validators.push(Validators.min(this.levelForm[key].min as number));
          }
          if (this.levelForm[key].max !== undefined) {
            validators.push(Validators.max(this.levelForm[key].max as number));
          }
          subForm.addControl(key, new FormControl(levelItem[key], validators));
        }
      });
      (form.get('levels') as FormArray).push(subForm);
    }
    formConfig.saveAsNew = true;
    const {item, action} = await this.tablesService.openDialog<ItemSet>(formConfig, form, {
      levels: this.levelForm,
      stats: this.levelStatForm,
      abilities: this.abilityForm,
      effects: this.effectForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const itemItems = item.items as string;
    delete item.items;
    const itemLevels = item.levels as ItemSetLevel[];
    delete item.levels;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      const newId = await this.databaseService.insert<ItemSet>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, itemItems.split(';'), itemLevels.map((l) => ({...l, id: undefined})), [], []);
    } else {
      await this.databaseService.update<ItemSet>(this.dbProfile, this.dbTable, item, 'id', record.id);
      await this.saveSubs(record.id, itemItems.split(';'), itemLevels, itemsAll, levelsAll);
    }
    this.resetForm(form);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return 1;
  }

  private async saveSubs(
    recordId: number,
    items: string[],
    levels: ItemSetLevel[],
    itemsAll: ItemSetItem[] = [],
    levelsAll: number[] = [],
  ): Promise<void> {
    const allItems = itemsAll.map((itm) => itm.id);
    for (const item of items) {
      const currentItem = itemsAll.find((itm) => itm.template_id === Number(item) && itm.set_id === recordId);
      if (currentItem) {
        allItems.splice(allItems.indexOf(currentItem.id), 1);
      } else {
        await this.databaseService.insert<ItemSetItem>(
          this.dbProfile,
          this.dbTableItems,
          {template_id: Number(item), set_id: recordId, isactive: true},
          false,
        );
      }
    }
    for (const level of levels) {
      level.set_id = recordId;
      let stats = level.stats as ItemSetLevelStat[];
      const effects = level.effects as ItemSetLevelStat[];
      const abilities = level.abilities as ItemSetLevelStat[];
      stats = stats.concat(effects);
      stats = stats.concat(abilities);
      delete level.effects;
      delete level.abilities;
      delete level.stats;
      for (let i = 1; i <= 32; i++) {
        const statItem = stats[i - 1];
        // @ts-ignore
        level['effect' + i + 'name'] = statItem ? statItem.name : '';
        // @ts-ignore
        level['effect' + i + 'valuep'] = statItem ? statItem.valuep : 0;
        // @ts-ignore
        level['effect' + i + 'value'] = statItem ? statItem.value : 0;
      }
      if (level.id) {
        levelsAll.splice(levelsAll.indexOf(level.id), 1);
        await this.databaseService.update<ItemSetLevel>(this.dbProfile, this.dbTableLevels, level, 'id', level.id);
      } else {
        // @ts-ignore
        delete level.id;
        await this.databaseService.insert<ItemSetLevel>(this.dbProfile, this.dbTableLevels, level, false);
      }
    }
    if (allItems.length > 0) {
      for (const itemId of allItems) {
        if (itemId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableItems, 'id', itemId, false);
        }
      }
    }
    if (levelsAll.length > 0) {
      for (const levelId of levelsAll) {
        if (levelId) {
          await this.databaseService.delete(this.dbProfile, this.dbTableLevels, 'id', levelId, false);
        }
      }
    }
  }

  public async duplicateItem(id: number): Promise<number> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const baseRecord = await this.databaseService.queryItem<ItemSet>(this.dbProfile, this.dbTable, 'id', id);
    if (!baseRecord) {
      return 0;
    }
    const itemSet = {...baseRecord};
    // @ts-ignore
    delete itemSet.id;
    itemSet.name = itemSet.name + ' (1)';
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let list: ItemSetItem[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and set_id = ${baseRecord.id}`,
    );
    list = list.map((subItem) => ({...subItem, ...{id: undefined}}));
    const items = [];
    for (const listItem of list) {
      items.push(listItem.template_id);
    }
    form.patchValue(itemSet);
    (form.get('items') as AbstractControl).patchValue(items.join(';'));
    let levelList: ItemSetLevel[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevels} WHERE set_id = ${baseRecord.id}`,
    );
    levelList = levelList.map((subItem) => ({...subItem, ...{id: undefined}}));
    for (const levelItem of levelList) {
      const subForm = new FormGroup({});
      Object.keys(this.levelForm).forEach((key) => {
        if (this.levelForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          for (let i = 1; i <= 32; i++) {
            // @ts-ignore
            if (levelItem['effect' + i + 'name']) {
              const subSubForm = new FormGroup({});

              if (
                (levelItem['effect' + i + 'name'] === 'effect' && key === 'effects') ||
                (levelItem['effect' + i + 'name'] === 'ability' && key === 'abilities') ||
                (!['ability', 'effect'].includes(levelItem['effect' + i + 'name']) && !['abilities', 'effects'].includes(key))
              ) {
                Object.keys(this.levelStatForm).forEach((keyStat) => {
                  const validatorsSub = [];
                  if (this.levelStatForm[keyStat].required) {
                    validatorsSub.push(Validators.required);
                  }
                  if (this.levelStatForm[keyStat].min !== undefined) {
                    validatorsSub.push(Validators.min(this.levelStatForm[keyStat].min as number));
                  }
                  if (this.levelStatForm[keyStat].max !== undefined) {
                    validatorsSub.push(Validators.max(this.levelStatForm[keyStat].max as number));
                  }
                  subSubForm.addControl(keyStat, new FormControl(levelItem['effect' + i + keyStat], validatorsSub));
                });
                (subForm.get(key) as FormArray).push(subSubForm);
              }
            }
          }
        } else {
          const validators = [];
          if (this.levelForm[key].required) {
            validators.push(Validators.required);
          }
          if (this.levelForm[key].min !== undefined) {
            validators.push(Validators.min(this.levelForm[key].min as number));
          }
          if (this.levelForm[key].max !== undefined) {
            validators.push(Validators.max(this.levelForm[key].max as number));
          }
          // @ts-ignore
          subForm.addControl(key, new FormControl(levelItem[key], validators));
        }
      });
      (form.get('levels') as FormArray).push(subForm);
    }
    const {item} = await this.tablesService.openDialog<ItemSet>(formConfig, form, {
      levels: this.levelForm,
      stats: this.levelStatForm,
      abilities: this.abilityForm,
      effects: this.effectForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return 0;
    }
    const itemItems = item.items as string;
    delete item.items;
    const itemLevels = item.levels as ItemSetLevel[];
    delete item.levels;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<ItemSet>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, itemItems.split(';'), itemLevels, [], []);
    this.resetForm(form);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<ItemSet>(this.dbProfile, this.dbTable, 'id', id);
    const items = [];
    const levels = [];
    const itemList = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableItems} WHERE isactive = 1 and set_id = ${record.id}`,
    );
    let levelList: ItemSetLevel[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableLevels} WHERE set_id = ${record.id}`,
    );
    for (const item of itemList) {
      const itm = await this.dropdownItemsService.getItem(item.template_id);
      if (itm) {
        items.push({item: itm.value});
      }
    }
    levelList = levelList.sort((a, b) => a.number_of_parts - b.number_of_parts);
    for (const level of levelList) {
      const stats = [];
      const abilities = [];
      const effects = [];
      for (let i = 1; i <= 32; i++) {
        // @ts-ignore
        if (level['effect' + i + 'name']) {
          if (level['effect' + i + 'name'] === 'effect') {
            const itemEffect = this.effectsList.find((itm) => itm.id === +level['effect' + i + 'value']);
            if(itemEffect) {
              effects.push({
                //stats: item['effect' + i + 'name'],
                effect: itemEffect.value,
                //valuep: item['effect' + i + 'valuep'],
              });
            }
          } else if (level['effect' + i + 'name'] === 'ability') {
            const itemAbility = this.abilitiesList.find((itm) => itm.id === +level['effect' + i + 'value']);
            if(itemAbility) {
              abilities.push({
                //stats: item['effect' + i + 'name'],
                ability: itemAbility.value,
                //valuep: item['effect' + i + 'valuep'],
              });
            }
          } else {
            stats.push({
              // @ts-ignore
              stat_name: level[`effect${i}name`],
              // @ts-ignore
              value: level[`effect${i}value`],
              // @ts-ignore
              valuep: level[`effect${i}valuep`],
            });
          }
        }
      }
      levels.push({
        number_of_parts: level.number_of_parts,
        damage: level.damage,
        damagep: level.damagep,
        subs: stats,
        subs4: effects,
        subs5: abilities,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {items, levels}},
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      items: null,
      levels: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('levels') as FormArray).clear();
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
