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
  hiddenField,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap,
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {effectsTriggersActionsTable, effectsTriggersTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService} from '../sub-form.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {EffectsTriggers, EffectsTriggersActions, eventType, subActionType} from './effects-triggers.data';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  abilityFieldConfig,
  abilityTagsFieldConfig,
  classFieldConfig,
  effectFieldConfig,
  effectTagsFieldConfig,
  raceFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EffectsTriggersService {
  public tableKey = TabTypes.EFFECTS_TRIGGERS;
  private readonly listStream = new BehaviorSubject<EffectsTriggers[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = effectsTriggersTable;
  public dbActionsTable = effectsTriggersActionsTable;
  private readonly eventTypesOptions: DropdownValue[] = [
    {id: eventType.dodge, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.DODGE')},
    {id: eventType.miss, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.MISS')},
    {id: eventType.damage, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.DAMAGE')},
    {id: eventType.heal, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.HEAL')},
    {id: eventType.critical, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.CRITICAL')},
    {id: eventType.kill, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.KILL')},
    {id: eventType.parry, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.PARRY')},
    {id: eventType.sleep, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.SLEEP')},
    {id: eventType.stun, value: this.translate.instant(this.tableKey + '.EVENT_TYPE_OPTIONS.STUN')},
  ];
  private readonly actionsTypeOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.ACTION_TYPE_OPTIONS.DEALT')},
    {id: 1, value: this.translate.instant(this.tableKey + '.ACTION_TYPE_OPTIONS.RECEIVED')},
  ];
  private readonly subActionsTypeOptions: DropdownValue[] = [
    {id: subActionType.ability, value: this.translate.instant(this.tableKey + '.SUB_ACTION_TYPE.ABILITY')},
    {id: subActionType.effect, value: this.translate.instant(this.tableKey + '.SUB_ACTION_TYPE.EFFECT')},
    {id: subActionType.modifier, value: this.translate.instant(this.tableKey + '.SUB_ACTION_TYPE.MODIFIER')},
  ];
  private readonly targetsOptions: DropdownValue[] = [
    {id: 0, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.ALL')},
    {id: 1, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.CASTER')},
    {id: 2, value: this.translate.instant(this.tableKey + '.TARGET_OPTIONS.TARGET')},
  ];
  private readonly actionsForm: SubFieldType = {
    id: {value: '', required: false},
    target: {value: 0, required: false},
    action_type2: {value: 0, required: false},
    ability: {value: -1, required: false},
    effect: {value: -1, required: false},
    mod_v: {value: 0, required: false},
    mod_p: {value: 0, required: false},
    chance_min: {value: 0, required: true, min: 0, max: 0},
    chance_max: {value: 0, required: true, min: 0, max: 100},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    showPreview: true,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      event_type: {
        type: ConfigTypes.dropdown,
        visible: true,
        data: this.eventTypesOptions,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
      },
      chance_min: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      chance_max: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.decimal},
      race: {
        type: ConfigTypes.dropdown,
        visible: true,
        data: [],
        filterVisible: true,
        filterType: FilterTypes.dropdown,
      },
      class: {
        type: ConfigTypes.dropdown,
        visible: true,
        data: [],
        filterVisible: true,
        filterType: FilterTypes.dropdown,
      },
      action_type: {
        type: ConfigTypes.dropdown,
        visible: true,
        data: this.actionsTypeOptions,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
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
      event_type: {
        name: 'event_type',
        type: FormFieldType.dropdown,
        data: this.eventTypesOptions,
        hideNone: true,
        width: 50,
      },
      tags_ability: {
        name: 'tags_ability',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: abilityTagsFieldConfig,
        allowNew: true,
        width: 100,
        multiple: true,
        hidden: hiddenField.hidden,
        conditionName: 'event_type',
        condition: {
          event_type: {
            0: {hidden: hiddenField.visible},
            1: {hidden: hiddenField.visible},
            2: {hidden: hiddenField.hidden},
            3: {hidden: hiddenField.hidden},
            4: {hidden: hiddenField.hidden},
            5: {hidden: hiddenField.hidden},
            6: {hidden: hiddenField.visible},
            7: {hidden: hiddenField.hidden},
            8: {hidden: hiddenField.hidden},
          },
        },
      },
      tags_effect: {
        name: 'tags_effect',
        type: FormFieldType.dynamicDropdown,
        fieldConfig: effectTagsFieldConfig,
        allowNew: true,
        width: 100,
        multiple: true,
        hidden: hiddenField.hidden,
        conditionName: 'event_type',
        condition: {
          event_type: {
            0: {hidden: hiddenField.hidden},
            1: {hidden: hiddenField.hidden},
            2: {hidden: hiddenField.visible},
            3: {hidden: hiddenField.visible},
            4: {hidden: hiddenField.visible},
            5: {hidden: hiddenField.visible},
            6: {hidden: hiddenField.hidden},
            7: {hidden: hiddenField.visible},
            8: {hidden: hiddenField.visible},
          },
        },
      },
      chance_min: {name: 'chance_min', type: FormFieldType.decimal, require: true, width: 50},
      chance_max: {name: 'chance_max', type: FormFieldType.decimal, require: true, width: 50},
      race: {
        name: 'race',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        fieldConfig: raceFieldConfig,
        allowNew: true,
      },
      class: {
        name: 'class',
        type: FormFieldType.dynamicDropdown,
        width: 33,
        fieldConfig: classFieldConfig,
        allowNew: true,
      },
      action_type: {
        name: 'action_type',
        type: FormFieldType.dropdown,
        hideNone: true,
        data: this.actionsTypeOptions,
        require: true,
        width: 33,
      },
    },
    subForms: {
      actions: {
        title: this.translate.instant(this.tableKey + '.ACTIONS'),
        submit: this.translate.instant(this.tableKey + '.ADD_ACTION'),
        fields: {
          target: {
            name: 'target',
            type: FormFieldType.dropdown,
            data: this.targetsOptions,
            width: 50,
            hideNone: true,
            hidden: hiddenField.visible,
            conditionName: 'action_type2',
            condition: {
              action_type2: {
                0: {hidden: hiddenField.visible},
                1: {hidden: hiddenField.visible},
                2: {hidden: hiddenField.hidden},
              },
            },
          },
          action_type2: {
            name: 'action_type2',
            type: FormFieldType.dropdown,
            data: this.subActionsTypeOptions,
            width: 50,
            hideNone: true,
          },
          ability: {
            name: 'ability',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: abilityFieldConfig,
            allowNew: true,
            hidden: hiddenField.hidden,
            conditionName: 'action_type2',
            condition: {
              action_type2: {
                0: {hidden: hiddenField.visible},
                1: {hidden: hiddenField.hidden},
                2: {hidden: hiddenField.hidden},
              },
            },
          },
          effect: {
            name: 'effect',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: effectFieldConfig,
            allowNew: true,
            hidden: hiddenField.hidden,
            conditionName: 'action_type2',
            condition: {
              action_type2: {
                0: {hidden: hiddenField.hidden},
                1: {hidden: hiddenField.visible},
                2: {hidden: hiddenField.hidden},
              },
            },
          },
          mod_v: {
            name: 'mod_v',
            type: FormFieldType.integer,
            disabled: true,
            hidden: hiddenField.hidden,
            width: 50,
            conditionName: 'action_type2',
            condition: {
              action_type2: {
                0: {disabled: true, hidden: hiddenField.hidden},
                1: {disabled: true, hidden: hiddenField.hidden},
                2: {disabled: false, hidden: 2},
              },
            },
          },
          mod_p: {
            name: 'mod_p',
            type: FormFieldType.decimal,
            disabled: true,
            hidden: hiddenField.hidden,
            width: 50,
            conditionName: 'action_type2',
            condition: {
              action_type2: {
                0: {disabled: true, hidden: hiddenField.hidden},
                1: {disabled: true, hidden: hiddenField.hidden},
                2: {disabled: false, hidden: hiddenField.visible},
              },
            },
          },
          chance_min: {name: 'chance_min', type: FormFieldType.decimal, require: true, width: 50},
          chance_max: {name: 'chance_max', type: FormFieldType.decimal, require: true, width: 50},
        },
      },
    },
  };
  private abilityTagsOptions: DropdownValue[] = [];
  private effectTagsOptions: DropdownValue[] = [];
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly optionChoicesService: OptionChoicesService,
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
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptions(): Promise<void> {
    this.tableConfig.fields.race.data = await this.optionChoicesService.getOptionsByType('Race');
    this.tableConfig.fields.class.data = await this.optionChoicesService.getOptionsByType('Class');
    this.abilityTagsOptions = await this.optionChoicesService.getOptionsByType('Ability Tags');
    this.effectTagsOptions = await this.optionChoicesService.getOptionsByType('Effects Tags');
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<EffectsTriggers>(
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
    const form = this.createForm(formConfig);
    let {item} = await this.tablesService.openDialog<EffectsTriggers>(formConfig, form, {actions: this.actionsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const actions = item.actions as EffectsTriggersActions[];
    delete item.actions;
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<EffectsTriggers>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    await this.saveSubs(newId, actions, []);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<EffectsTriggers>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const list: EffectsTriggersActions[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbActionsTable} WHERE effects_triggers_id = ?`,
      [record.id],
    );
    const actionsAll: number[] = [];
    for (const action of list) {
      actionsAll.push(action.id as number);
    }
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return null;
    }
    const actions = item.actions as EffectsTriggersActions[];
    delete item.actions;
    let newId = item.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<EffectsTriggers>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, actions.map((act) => ({...act,id: undefined})), []);
    } else {
      await this.databaseService.update<EffectsTriggers>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, actions, actionsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  private setDefaults(item: EffectsTriggers): EffectsTriggers {
    item.isactive = true;
    item.event_type = item.event_type || 0;
    item.race = item.race || -1;
    item.class = item.class || -1;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    if ([eventType.dodge, eventType.miss, eventType.parry].includes(item.event_type)) {
      item.tags = item.tags_ability as string;
    } else {
      item.tags = item.tags_effect as string;
    }
    item.tags = item.tags || '';
    item.action_type = item.action_type || 0;
    delete item.tags_effect;
    delete item.tags_ability;
    return item;
  }

  private async saveSubs(recordId: number, items: EffectsTriggersActions[], itemsAll: number[]): Promise<void> {
    for (const item of items) {
      if (item.action_type2 === subActionType.ability) {
        item.effect = -1;
        item.mod_v = 0;
        item.mod_p = 0;
        if (![0, 1, 2].includes(item.target)) {
          item.target = -1;
        }
      } else if (item.action_type2 === subActionType.effect) {
        item.ability = -1;
        item.mod_v = 0;
        item.mod_p = 0;
        if (![0, 1, 2].includes(item.target)) {
          item.target = -1;
        }
      } else if (item.action_type2 === subActionType.modifier) {
        item.ability = -1;
        item.effect = -1;
        item.target = -1;
      }
      delete item.action_type2;
      item.effects_triggers_id = recordId;
      if (item.id) {
        itemsAll.splice(itemsAll.indexOf(item.id), 1);
        await this.databaseService.update<EffectsTriggersActions>(
          this.dbProfile,
          this.dbActionsTable,
          item,
          'id',
          item.id,
        );
      } else {
        // @ts-ignore
        delete item.id;
        await this.databaseService.insert<EffectsTriggersActions>(this.dbProfile, this.dbActionsTable, item, false);
      }
    }
    if (itemsAll.length > 0) {
      for (const itemId of itemsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbActionsTable, 'id', itemId, false);
      }
    }
  }

  public async previewItems(id: string): Promise<void> {
    const record = await this.databaseService.queryItem<EffectsTriggers>(this.dbProfile, this.dbTable, 'id', id);
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbActionsTable} WHERE effects_triggers_id = ?`,
      [id],
    );
    if (!list) {
      return;
    }
    const actions = [];
    const tags: {tag: string}[] = [];
    if (!record.tags) {
      record.tags = '';
    }
    (record.tags as string).split(';').forEach((item) => {
      if ([eventType.dodge, eventType.miss, eventType.parry].includes(record.event_type)) {
        const ability = this.abilityTagsOptions.find((abilityItem) => +abilityItem.id === +item);
        if (ability) {
          tags.push({
            tag: ability.value,
          });
        }
      } else {
        const effect = this.effectTagsOptions.find((effectItem) => +effectItem.id === +item);
        if (effect) {
          tags.push({
            tag: effect.value,
          });
        }
      }
    });
    for (const item of list) {
      if (item.ability > 0) {
        const ability = await this.dropdownItemsService.getAbility(item.ability);
        item.ability = ability ? ability.value : item.ability;
      }
      if (item.effect > 0) {
        const effect = await this.dropdownItemsService.getEffect(item.effect);
        item.effect = effect ? effect.value : item.effect;
      }
      const target = this.targetsOptions.find((targ) => targ.id === item.target);
      actions.push({
        target: item.target >= 0 && target ? target.value : '',
        ability: item.ability !== -1 ? item.ability : '',
        effect: item.effect !== -1 ? item.effect : '',
        mod_v: item.mod_v,
        mod_p: item.mod_p,
        chance_min: item.chance_min,
        chance_max: item.chance_max,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {tags, actions}},
    });
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<EffectsTriggers>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    let list: EffectsTriggersActions[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbActionsTable} WHERE effects_triggers_id = ?`,
      [baseRecord.id],
    );
    list = list.map((itemC) => ({...itemC, ...{id: undefined}}));
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const actions = item.actions as EffectsTriggersActions[];
    delete item.actions;
    const newId = await this.databaseService.insert<EffectsTriggers>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, actions, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(
    record: EffectsTriggers,
    list: EffectsTriggersActions[],
    updateMode = false,
  ): Promise<{item:EffectsTriggers | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    if ([eventType.dodge, eventType.miss, eventType.parry].includes(record.event_type)) {
      record.tags_ability = record.tags as string;
    } else {
      record.tags_effect = record.tags as string;
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm(formConfig);
    for (const action of list) {
      const actionForm = {...this.actionsForm};
      if (action.ability !== -1) {
        action.action_type2 = subActionType.ability;
      } else if (action.effect !== -1) {
        action.action_type2 = subActionType.effect;
      } else {
        action.action_type2 = subActionType.modifier;
      }
      actionForm.chance_min.max = action.chance_max;
      actionForm.chance_max.min = action.chance_min;
      (form.get('actions') as FormArray).push(
        this.subFormService.buildSubForm<EffectsTriggersActions, any>(actionForm, action),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    let {item, action} = await this.tablesService.openDialog<EffectsTriggers>(formConfig, form, {actions: this.actionsForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item = this.setDefaults(item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  private createForm(formConfig: FormConfig): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      name: ['', Validators.required],
      event_type: -1,
      tags_ability: '',
      tags_effect: '',
      race: -1,
      class: -1,
      action_type: [0, [Validators.required, Validators.min(0)]],
      chance_min: [0, [Validators.required, Validators.min(0), Validators.max(0)]],
      chance_max: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      actions: new FormArray([]),
    });
    form.controls.event_type.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      (form.get('actions') as FormArray).controls.forEach((fields) => {
        if (![eventType.damage, eventType.heal].includes(value) && fields.get('action_type2')?.value === 2) {
          fields.get('action_type2')?.setValue(0);
        }
      });
      if ([eventType.damage, eventType.heal].includes(value)) {
        (formConfig.subForms as TypeMap<string, SubFormType>).actions.fields.action_type2.data =
          this.subActionsTypeOptions;
      } else {
        (formConfig.subForms as TypeMap<string, SubFormType>).actions.fields.action_type2.data =
          this.subActionsTypeOptions.filter((item) => item.id !== 2);
      }
    });
    form.controls.chance_min.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      form.controls.chance_max.setValidators([Validators.required, Validators.min(+value), Validators.max(100)]);
      form.controls.chance_max.updateValueAndValidity();
    });
    form.controls.chance_max.valueChanges.pipe(distinctPipe(this.formDestroyer)).subscribe((value) => {
      form.controls.chance_min.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(+value < 0 ? 0 : +value),
      ]);
      form.controls.chance_min.updateValueAndValidity();
    });
    return form;
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('actions') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
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
