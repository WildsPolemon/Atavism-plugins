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
  FormFieldType,
  QueryParams, SubFormType,
  TableConfig,
  TypeMap
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {enchantProfileTable, itemQualityTable} from '../tables.data';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubQueryField, SubTable} from '../sub-form.service';
import {EnchantProfile, EnchantProfileItem, ItemQuality} from './enchant-profile.data';
import {abilityFieldConfig, currencyFieldConfig, effectFieldConfig, statFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EnchantProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.ENCHANT_PROFILE;
  private readonly listStream = new BehaviorSubject<EnchantProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = enchantProfileTable;
  public dbTableItemQuality = itemQualityTable;
  private readonly profileForm: SubFieldType = {
    id: {value: '', required: false},
    level: {value: 1, required: true, min: 1},
    lower_by: {value: 0, required: false, min: 0},
    lower_to: {value: -1, required: false, min: -1},
    chance: {value: 0, required: false, min: 0, max: 100},
    cost: {value: 0, required: false, min: 0},
    currency: {value: '', required: true},
    gear_score: {value: 0, required: false, min: 0},
    gear_scorep: {value: 0, required: false, min: 0},
    all_stats: {value: false, required: false},
    add_not_exist: {value: false, required: false},
    damage: {value: 0, required: true, min: 0},
    damagep: {value: 0, required: true, min: 0},
    stat_value: {value: 0, required: true, min: 0},
    stats: {isArray: true},
    abilities: {isArray: true},
    effects: {isArray: true},
  };
  private readonly statForm: SubFieldType = {
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
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      Name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      level: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      lower_by: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      lower_to: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      currency: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
      },
      cost: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      chance: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      gear_score: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      gear_scorep: {
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
      stat_value: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
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
      // subeffect: {
      //   type: ConfigTypes.hidden,
      //   visible: false,
      //   alwaysVisible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.integer,
      // },
      // subability: {
      //   type: ConfigTypes.hidden,
      //   visible: false,
      //   alwaysVisible: true,
      //   filterVisible: true,
      //   filterType: FilterTypes.integer,
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
    queryParams: {search: '', where: {}, sort: {field: 'Name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      Name: {name: 'Name', type: FormFieldType.input, require: true, length: 64},
    },
    subForms: {
      profiles: {
        title: this.translate.instant(this.tableKey + '.LEVELS'),
        submit: this.translate.instant(this.tableKey + '.ADD_LEVELS'),
        minCount: 1,
        columnWidth: 100,
        fields: {
          level: {name: 'level', type: FormFieldType.integer, require: true, width: 33},
          lower_by: {name: 'lower_by', type: FormFieldType.integer, width: 33},
          lower_to: {name: 'lower_to', type: FormFieldType.integer, width: 33},
          currency: {
            name: 'currency',
            type: FormFieldType.dynamicDropdown,
            width: 33,
            require: true,
            allowNew: true,
            fieldConfig: currencyFieldConfig,
          },
          cost: {name: 'cost', type: FormFieldType.integer, width: 33},
          chance: {name: 'chance', type: FormFieldType.integer, width: 33},
          gear_score: {name: 'gear_score', type: FormFieldType.integer, width: 50},
          gear_scorep: {name: 'gear_scorep', type: FormFieldType.integer, width: 50},
          all_stats: {name: 'all_stats', type: FormFieldType.boolean, width: 33},
          stat_value: {
            name: 'stat_value',
            type: FormFieldType.integer,
            width: 33,
            conditionName: 'all_stats',
            condition: {
              all_stats: {
                1: {disabled: true},
                2: {disabled: false},
              },
            },
          },
          add_not_exist: {
            name: 'add_not_exist',
            type: FormFieldType.boolean,
            width: 33,
            conditionName: 'all_stats',
            condition: {
              all_stats: {
                1: {label: this.translate.instant(this.tableKey + '.ADD_NOT_EXIST')},
                2: {label: this.translate.instant(this.tableKey + '.PERCENTAGE')},
              },
            },
          },
          damage: {
            name: 'damage',
            type: FormFieldType.integer,
            width: 50,
            require: true,
          },
          damagep: {
            name: 'damagep',
            type: FormFieldType.integer,
            width: 50,
            require: true,
          },
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
  private itemQualityList: DropdownValue[] = [];
  private currenciesList: DropdownValue[] = [];
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
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.abilitiesList = listing;
    });
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      this.effectsList = listing;
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.currenciesList = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.itemQualityList = await this.optionChoicesService.getOptionsByType('Item Quality', true);
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getEffects();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getEnchantProfiles();
    }
    const subFields: Record<string, SubQueryField> = {
      effectname: {
        type: SubTable.multiple,
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
      },
      effectvalue: {
        type: SubTable.multiple,
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
      },
      effectvaluep: {
        type: SubTable.multiple,
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
      },
      subeffect: {
        type: SubTable.multiple,
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
      },

    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<EnchantProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
      [],
      '',
      true,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<EnchantProfile>(formConfig, form, {
      profiles: this.profileForm,
      stats: this.statForm,
      abilities: this.abilityForm,
      effects: this.effectForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    // @ts-ignore
    const profiles = item.profiles;
    // @ts-ignore
    delete item.profiles;
    try {
      let newId = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT MAX(id) as id FROM ${this.dbTable} where isactive = 1`,
      );
      newId = newId && newId[0].id ? +newId[0].id + 1 : 1;
      for (const prof of profiles) {
        const newItem: EnchantProfile = {...prof};
        newItem.id = newId;
        newItem.Name = item.Name;
        let stats = newItem.stats as EnchantProfileItem[];
        const effects = newItem.effects as EnchantProfileItem[];
        const abilities = newItem.abilities as EnchantProfileItem[];
        stats = stats.concat(effects);
        stats = stats.concat(abilities);
        delete newItem.stats;
        delete newItem.effects;
        delete newItem.abilities;
        if (newItem.all_stats) {
          newItem.percentage = newItem.add_not_exist;
          newItem.add_not_exist = false;
          stats = [];
        } else {
          newItem.percentage = false;
          newItem.stat_value = 0;
        }
        for (let i = 1; i <= 32; i++) {
          const statItem = stats[i - 1];
          // @ts-ignore
          newItem['effect' + i + 'name'] = statItem ? statItem.name : '';
          // @ts-ignore
          newItem['effect' + i + 'valuep'] = statItem ? statItem.valuep : 0;
          // @ts-ignore
          newItem['effect' + i + 'value'] = statItem ? statItem.value : 0;
        }
        newItem.cost = newItem.cost ? newItem.cost : 0;
        newItem.chance = newItem.chance ? newItem.chance : 0;
        newItem.gear_score = newItem.gear_score ? newItem.gear_score : 0;
        newItem.gear_scorep = newItem.gear_scorep ? newItem.gear_scorep : 0;
        newItem.lower_by = newItem.lower_by ? newItem.lower_by : 0;
        newItem.stat_value = newItem.stat_value ? newItem.stat_value : 0;
        newItem.isactive = true;
        newItem.creationtimestamp = this.databaseService.getTimestampNow();
        newItem.updatetimestamp = this.databaseService.getTimestampNow();
        await this.databaseService.insert<EnchantProfile>(this.dbProfile, this.dbTable, newItem, false);
      }
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_ADDED'));
      return {id: newId, value: item.Name};
    } catch (e) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} where id = ? AND isactive = 1`,
      [id],
    );
    if (list) {
      const formConfig = JSON.parse(JSON.stringify(this.formConfig));
      const form = this.createForm();
      const oldValues = [];
      for (const item of list) {
        oldValues.push(item.creationtimestamp);
        const subForm = new FormGroup({});
        Object.keys(this.profileForm).forEach((key) => {
          if (this.profileForm[key].isArray) {
            console.log(key);
            subForm.addControl(key, new FormArray([]));
            for (let i = 1; i <= 32; i++) {
              if (item['effect' + i + 'name']) {
                const subSubForm = new FormGroup({});
                if((item['effect' + i + 'name'] ==='effect' && key === 'effects') ||
                  (item['effect' + i + 'name'] ==='ability' && key === 'abilities') ||
                  (!['ability', 'effect'].includes(item['effect' + i + 'name']) &&
                    !['abilities', 'effects'].includes(key)))
                {
                  Object.keys(this.statForm).forEach((keyStat) => {
                    const validatorsSub = [];
                    if (this.statForm[keyStat].required) {
                      validatorsSub.push(Validators.required);
                    }
                    if (this.statForm[keyStat].min !== undefined) {
                      validatorsSub.push(Validators.min(this.statForm[keyStat].min as number));
                    }
                    if (this.statForm[keyStat].max !== undefined) {
                      validatorsSub.push(Validators.max(this.statForm[keyStat].max as number));
                    }
                    subSubForm.addControl(keyStat, new FormControl(item['effect' + i + keyStat], validatorsSub));
                  });
                  (subForm.get(key) as FormArray).push(subSubForm);
                }
              }
            }
          } else {
            const validators = [];
            if (this.profileForm[key].required) {
              validators.push(Validators.required);
            }
            if (this.profileForm[key].min !== undefined) {
              validators.push(Validators.min(this.profileForm[key].min as number));
            }
            if (this.profileForm[key].max !== undefined) {
              validators.push(Validators.max(this.profileForm[key].max as number));
            }
            if (item.all_stats && key === 'add_not_exist') {
              subForm.addControl(key, new FormControl(item.percentage, validators));
            }
            else subForm.addControl(key, new FormControl(item[key], validators));
          }
        });
        (form.get('profiles') as FormArray).push(subForm);
      }
      form.patchValue(list[0]);
      formConfig.saveAsNew = true;
      const {item: record, action} = await this.tablesService.openDialog(formConfig, form, {
        profiles: this.profileForm,
        stats: this.statForm,
        abilities: this.abilityForm,
        effects: this.effectForm,
      });
      if (!record) {
        this.resetForm(form);
        this.tablesService.dialogRef = null;
        return null;
      }
      // @ts-ignore
      const profiles = record.profiles;
      // @ts-ignore
      delete record.profiles;
      try {
        let newId = id;
        if (action === DialogCloseType.save_as_new) {
          newId = await this.databaseService.customQuery(
            this.dbProfile,
            `SELECT MAX(id) as id FROM ${this.dbTable} where isactive = 1`,
          );
          newId = newId && newId[0].id ? +newId[0].id + 1 : 1;
        } else {
          await this.databaseService.customQuery(
            this.dbProfile,
            `DELETE FROM ${this.dbTable} where id = ? AND isactive = 1`,
            [newId],
            true,
          );
        }
        let j = 0;
        for (const prof of profiles) {
          const newItem: EnchantProfile = {...prof};
          newItem.id = newId;
          // @ts-ignore
          newItem.Name = record.Name;
          let stats = newItem.stats as EnchantProfileItem[];
          const effects = newItem.effects as EnchantProfileItem[];
          const abilities = newItem.abilities as EnchantProfileItem[];
          stats = stats.concat(effects);
          stats = stats.concat(abilities);
          delete newItem.stats;
          delete newItem.effects;
          delete newItem.abilities;
          if (newItem.all_stats) {
            newItem.percentage = newItem.add_not_exist;
            newItem.add_not_exist = false;
            stats = [];
          } else {
            newItem.percentage = false;
            newItem.stat_value = 0;
          }
          for (let i = 1; i <= 32; i++) {
            const statItem = stats[i - 1];
            // @ts-ignore
            newItem['effect' + i + 'name'] = statItem ? statItem.name : '';
            // @ts-ignore
            newItem['effect' + i + 'valuep'] = statItem ? statItem.valuep : 0;
            // @ts-ignore
            newItem['effect' + i + 'value'] = statItem ? statItem.value : 0;
          }
          newItem.cost = newItem.cost ? newItem.cost : 0;
          newItem.chance = newItem.chance ? newItem.chance : 0;
          newItem.gear_score = newItem.gear_score ? newItem.gear_score : 0;
          newItem.gear_scorep = newItem.gear_scorep ? newItem.gear_scorep : 0;
          newItem.lower_by = newItem.lower_by ? newItem.lower_by : 0;
          newItem.stat_value = newItem.stat_value ? newItem.stat_value : 0;
          newItem.isactive = true;
          newItem.creationtimestamp = oldValues[j] ? oldValues[j] : oldValues[0];
          newItem.updatetimestamp = this.databaseService.getTimestampNow();
          await this.databaseService.insert<EnchantProfile>(this.dbProfile, this.dbTable, newItem, false);
          ++j;
        }
        this.resetForm(form);
        this.tablesService.dialogRef = null;
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
        return {id: newId, value: (record as {Name: string}).Name};
      } catch (e) {
        this.resetForm(form);
        this.tablesService.dialogRef = null;
        this.notification.error('Something went wrong ' + e.toString());
        return null;
      }
    }
    return null;
  }

  public async itemQuality(): Promise<boolean> {
    let i = 0;
    const costLabel = this.translate.instant(this.tableKey + '.COST');
    const chanceLabel = this.translate.instant(this.tableKey + '.CHANCE');
    const costHelpLabel = this.translate.instant(this.tableKey + '.COST_HELP');
    const chanceHelpLabel = this.translate.instant(this.tableKey + '.CHANCE_HELP');
    const formFields = {};
    const itemFormConfig: FormConfig = {
      type: this.tableKey,
      dialogType: DialogConfig.smallDialogOverlay,
      title: this.translate.instant(this.tableKey + '.ITEM_QUALITY_TITLE'),
      fields: {},
    };
    for (const itemQuality of this.itemQualityList) {
      itemFormConfig.fields['title_' + i] = {name: '', label: itemQuality.value, type: FormFieldType.title, width: 100};
      itemFormConfig.fields['chance_' + i] = {
        name: 'chance_' + i,
        label: chanceLabel,
        tooltip: chanceHelpLabel,
        type: FormFieldType.integer,
        width: 50,
      };
      itemFormConfig.fields['cost_' + i] = {
        name: 'cost_' + i,
        label: costLabel,
        tooltip: costHelpLabel,
        type: FormFieldType.integer,
        width: 50,
      };
      let quality = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableItemQuality} WHERE name = ?`,
        [itemQuality.value],
      );
      if (quality) {
        quality = quality[0];
      }
      // @ts-ignore
      formFields['chance_' + i] = [
        quality ? quality.chance : 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ];
      // @ts-ignore
      formFields['cost_' + i] = [
        quality ? quality.cost : 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ];
      ++i;
    }
    const itemForm = this.fb.group(formFields);
    const {item} = await this.tablesService.openDialog(itemFormConfig, itemForm, {});
    if (!item) {
      itemForm.reset();
      this.tablesService.dialogRef = null;
      return false;
    }
    let j = 0;
    for (const itemQuality of this.itemQualityList) {
      let quality = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableItemQuality} WHERE name = ?`,
        [itemQuality.value],
      );
      if (quality.length > 0) {
        quality = {...quality[0]};
        // @ts-ignore
        quality.chance = item['chance_' + j];
        // @ts-ignore
        quality.cost = item['cost_' + j];
        await this.databaseService.update<ItemQuality>(
          this.dbProfile,
          this.dbTableItemQuality,
          quality,
          'id',
          quality.id,
        );
      } else {
        const maxID = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT MAX(id) as maxid FROM ${this.dbTableItemQuality}`,
        );
        let maxId = 1;
        if (maxID.length > 0) {
          maxId = maxID[0].maxid + 1;
        }
        await this.databaseService.insert<ItemQuality>(this.dbProfile, this.dbTableItemQuality, {
          id: maxId,
          name: itemQuality.value,
          // @ts-ignore
          chance: item['chance_' + j],
          // @ts-ignore
          cost: item['cost_' + j],
        });
      }
      ++j;
    }
    this.tablesService.dialogRef = null;
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_QUALITY_SAVED'));
    return true;
  }

  public async previewItems(id: number, activeRecord: boolean): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} where id = ? AND isactive = ${activeRecord ? 1 : 0}`,
      [id],
    );
    const levels = [];
    for (const item of list) {
      const itemCurrency = this.currenciesList.find((itm) => itm.id === item.currency);
      const stats = [];
      const abilities = [];
      const effects = [];
      for (let i = 1; i <= 32; i++) {
        if (item['effect' + i + 'name']) {

          if (item['effect' + i + 'name'] === 'effect') {
            const itemEffect = this.effectsList.find((itm) => itm.id === +item['effect' + i + 'value']);
            if(itemEffect) {
              effects.push({
                //stats: item['effect' + i + 'name'],
                effect: itemEffect.value,
                //valuep: item['effect' + i + 'valuep'],
              });
            }
          } else if (item['effect' + i + 'name'] === 'ability') {
            const itemAbility = this.abilitiesList.find((itm) => itm.id === +item['effect' + i + 'value']);
            if(itemAbility) {
              abilities.push({
                //stats: item['effect' + i + 'name'],
                ability: itemAbility.value,
                //valuep: item['effect' + i + 'valuep'],
              });
            }
          } else {
            stats.push({
              stats: item['effect' + i + 'name'],
              value: item['effect' + i + 'value'],
              valuep: item['effect' + i + 'valuep'],
            });
          }
        }
      }
      levels.push({
        level: item.level,
        lower_by: item.lower_by >= 0 ? item.lower_by : '',
        lower_to: item.lower_to >= 0 ? item.lower_to : '',
        currency: itemCurrency ? itemCurrency.value : item.currency,
        cost: item.cost,
        chance: item.chance,
        gear_score: item.gear_score,
        gear_scorep: item.gear_scorep,
        all_stats: item.all_stats ? this.translate.instant('GENERAL.YES') : this.translate.instant('GENERAL.NO'),
        add_not_exist: item.add_not_exist
          ? this.translate.instant('GENERAL.YES')
          : this.translate.instant('GENERAL.NO'),
        damage: item.damage,
        damagep: item.damagep,
        percentage:
          item.all_stats && item.percentage
            ? this.translate.instant('GENERAL.YES')
            : this.translate.instant('GENERAL.NO'),
        stat_value: item.stat_value,
        subs: stats,
        subs4: effects,
        subs5: abilities,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {levels}},
    });
  }

  public async duplicateItem(id: number): Promise<number> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTable} where id = ? AND isactive = 1`,
      [id],
    );
    let newId = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT MAX(id) as id FROM ${this.dbTable} where isactive = 1`,
    );
    newId = newId && newId[0].id ? +newId[0].id + 1 : 1;
    for (const item of list) {
      const newItem = {...item};
      newItem.id = newId;
      newItem.Name = newItem.Name + ' (1)';
      newItem.creationtimestamp = this.databaseService.getTimestampNow();
      newItem.updatetimestamp = this.databaseService.getTimestampNow();
      await this.databaseService.insert<EnchantProfile>(this.dbProfile, this.dbTable, newItem, false);
    }
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      Name: ['', Validators.required],
      profiles: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('profiles') as FormArray).clear();
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
