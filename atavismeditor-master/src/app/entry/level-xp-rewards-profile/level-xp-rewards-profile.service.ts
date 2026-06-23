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
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap, WhereQuery
} from '../../models/configs';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {levelXpRequirementsRewardTemplatesTable, levelXpRewardsTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {DropdownItemsService} from '../dropdown-items.service';
import {abilityFieldConfig, bonusSettingsIdFieldConfig, effectFieldConfig, itemFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';

export interface LevelXpReward {
  reward_id: number;
  reward_template_id: number;
  reward_type: string;
  reward_value: number;
  reward_amount: number;
  give_once: boolean;
  on_level_down: boolean;
  isactive: boolean;
}

export interface LevelXpRewardsProfile {
  reward_template_id?: number;
  reward_template_name: string;
  reward_mail_subject: string;
  reward_mail_message: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  rewards?: LevelXpReward[];
}

export enum RewardType {
  Item = 'ITEM',
  ItemMail = 'ITEM_MAIL',
  SkillPoint = 'SKILL_POINT',
  TalentPoint = 'TALENT_POINT',
  Ability = 'ABILITY',
  Effect = 'EFFECT',
}

@Injectable({
  providedIn: 'root',
})
export class LevelXpRewardsProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.LEVELXP_REWARDS_PROFILE;
  private readonly listStream = new BehaviorSubject<LevelXpRewardsProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = levelXpRequirementsRewardTemplatesTable;
  public dbRewardTable = levelXpRewardsTable;
  private readonly rewardForm: SubFieldType = {
    reward_id: {value: '', required: false},
    reward_template_id: {value: ''},
    reward_type: {value: '', required: true},
    reward_value: {value: '', required: true},
    reward_amount: {value: '', required: true},
    give_once: {value: 1},
    on_level_down: {value: 0},
  };
  public readonly rewardType: DropdownValue[] = [
    {id: RewardType.Item, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM')},
    {id: RewardType.ItemMail, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM_MAIL')},
    {id: RewardType.SkillPoint, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.SKILL_POINT')},
    {id: RewardType.TalentPoint, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.TALENT_POINT')},
    {id: RewardType.Ability, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.ABILITY')},
    {id: RewardType.Effect, value: this.translate.instant(this.tableKey + '.REWARD_TYPES.EFFECT')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      reward_template_id: {
        type: ConfigTypes.numberType,
        visible: true,
        alwaysVisible: true,
      },
      reward_template_name: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      reward_mail_subject: {
        type: ConfigTypes.stringType,
        visible: true,
        filterVisible: true,
        useAsSearch: true,
      },
      reward_mail_message: {
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
      reward_type: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.rewardType,
      },
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.DEACTIVATE, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.DELETE, icon: ActionsIcons.DELETE},
    ],
    queryParams: {
      search: '',
      where: {},
      sort: {field: 'reward_template_name', order: 'asc'},
      limit: {limit: 10, page: 0},
    },
  };
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      reward_template_name: {name: 'reward_template_name', type: FormFieldType.input, require: true, length: 80},
      reward_mail_subject: {name: 'reward_mail_subject', type: FormFieldType.input, length: 255},
      reward_mail_message: {name: 'reward_mail_message', type: FormFieldType.textarea},
    },
    subForms: {
      rewards: {
        title: this.translate.instant(this.tableKey + '.REWARD'),
        submit: this.translate.instant(this.tableKey + '.ADD_REWARD'),
        columnWidth: 50,
        //  maxCount: 1,
        fields: {
          reward_id: {name: 'reward_id', label: '', type: FormFieldType.hidden},
          reward_template_id: {name: 'reward_template_id', label: '', type: FormFieldType.hidden},
          reward_type: {
            name: 'reward_type',
            label: this.translate.instant(this.tableKey + '.REWARD_TYPE'),
            type: FormFieldType.dropdown,
            require: true,
            search: true,
            width: 100,
            data: this.rewardType,
          },
          reward_value: {
            name: 'reward_value',
            type: FormFieldType.dynamicDropdown,
            label: ' ',
            tooltip: ' ',
            require: true,
            width: 66,
            disabled: true,
            allowNew: false,
            fieldConfig: undefined,
            conditionName: 'reward_type',
            condition: {
              reward_type: {
                [RewardType.Item]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM'),
                  tooltip: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM_HELP'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: itemFieldConfig,
                },
                [RewardType.ItemMail]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM'),
                  tooltip: this.translate.instant(this.tableKey + '.REWARD_TYPES.ITEM_MAIL_HELP'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: itemFieldConfig,
                },
                [RewardType.Ability]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_TYPES.ABILITY'),
                  tooltip: this.translate.instant(this.tableKey + '.REWARD_TYPES.ABILITY_HELP'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: abilityFieldConfig,
                },
                [RewardType.Effect]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_TYPES.EFFECT'),
                  tooltip: this.translate.instant(this.tableKey + '.REWARD_TYPES.EFFECT_HELP'),
                  disabled: false,
                  allowNew: true,
                  fieldConfig: effectFieldConfig,
                },
                [RewardType.SkillPoint]: {label: ' ', tooltip: ' ', allowNew: false, disabled: true, fieldConfig: null},
                [RewardType.TalentPoint]: {label: ' ', tooltip: ' ', allowNew: false, disabled: true, fieldConfig: null},
              },
            },
          },
          reward_amount: {
            name: 'reward_amount',
            type: FormFieldType.integer,
            require: true,
            disabled: true,
            width: 33,
            conditionName: 'reward_type',
            condition: {
              reward_type: {
                [RewardType.Item]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_AMOUNT'),
                  disabled: false,
                  min: 1,
                },
                [RewardType.ItemMail]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_AMOUNT'),
                  disabled: false,
                  min: 1,
                },
                [RewardType.Ability]: {
                  label: ' ',
                  disabled: true,
                  tooltip: ' ',
                },
                [RewardType.Effect]: {
                  label: ' ',
                  disabled: true,
                  tooltip: ' ',
                },
                [RewardType.SkillPoint]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_AMOUNT'),
                  disabled: false,
                  min: 1,
                },
                [RewardType.TalentPoint]: {
                  label: this.translate.instant(this.tableKey + '.REWARD_AMOUNT'),
                  disabled: false,
                  min: 1,
                },
              },
            },
          },
          give_once:{
            name: 'give_once',
            type: FormFieldType.boolean,
            search: true,
            width: 50,
          },
          on_level_down:{
            name: 'on_level_down',
            type: FormFieldType.boolean,
            search: true,
            width: 50,
          },
        },
      },
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
      }
    });
    const rewardsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).rewards.fields;
    this.dropdownItemsService.abilities.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (rewardsFields.reward_value.condition as TypeMap<string, any>).reward_type.ABILITY.data = listing;
    });
    this.dropdownItemsService.effects.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (rewardsFields.reward_value.condition as TypeMap<string, any>).reward_type.EFFECT.data = listing;
    });
    this.dropdownItemsService.items.pipe(distinctPipe(this.destroyer)).subscribe((listing) => {
      (rewardsFields.reward_value.condition as TypeMap<string, any>).reward_type.ITEM.data = listing;
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private async loadOptions(): Promise<void> {
    await this.dropdownItemsService.getAbilities();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getEffects();
  }
  public async getList(queryParams: QueryParams): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      reward_type: {
        type: SubTable.left_join,
        main: 'reward_template_id',
        related: 'reward_template_id',
        table: this.dbRewardTable,
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
    const response = await this.databaseService.queryList<LevelXpRewardsProfile>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
    this.listStream.next(response.list.map((item) => ({id: item.reward_template_id, ...item})));
  }

  public async previewItems(id: number): Promise<void> {
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbRewardTable} WHERE isactive = 1 and reward_template_id = ?`,
      [id],
    );
    const rewards = [];
    const rewardsFields = (this.formConfig.subForms as TypeMap<string, SubFormType>).rewards.fields.reward_value.condition;


    for (const item1 of list) {
      let itm;
      let amount;
      if (item1.reward_type === RewardType.Item || item1.reward_type === RewardType.ItemMail) {
        itm = rewardsFields.reward_type.ITEM.data
          ? rewardsFields.reward_type.ITEM.data.find((it) => it.id === +item1.reward_value)
          : undefined;
      } else if (item1.reward_type === RewardType.Ability) {
        itm = rewardsFields.reward_type.ABILITY.data
          ? rewardsFields.reward_type.ABILITY.data.find((it) => it.id === +item1.reward_value)
          : undefined;
        amount = ' ';
      } else if (item1.reward_type === RewardType.Effect) {
        itm = rewardsFields.reward_type.EFFECT.data
          ? rewardsFields.reward_type.EFFECT.data.find((it) => it.id === +item1.reward_value)
          : undefined;
        amount = ' ';
      }
      rewards.push({
        type: this.translate.instant(this.tableKey + '.REWARD_TYPES.' + item1.reward_type),
        name: itm ? itm.value : ' ',
        amount: item1.reward_amount < 1 ? '' : item1.reward_amount,
        give_once: item1.give_once === 1 ? this.translate.instant('GENERAL.YES') : this.translate.instant('GENERAL.NO'),
        on_level_down: item1.on_level_down === 1 ? this.translate.instant('GENERAL.YES') : this.translate.instant('GENERAL.NO'),
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {rewards}},
    });
  }
  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const {item} = await this.tablesService.openDialog<LevelXpRewardsProfile>(formConfig, form,{
      rewards: this.rewardForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const rewards = item.rewards as LevelXpReward[];

    delete item.rewards;
    let newId;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const record = await this.databaseService.queryItem<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, 'reward_template_id', item.reward_template_id);
    if (record) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_NAME'));
    } else {
      newId = await this.databaseService.insert<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, rewards, []);
    }
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.reward_template_name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, 'reward_template_id', id);
    if (!record) {
      return null;
    }
    const list = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbRewardTable} WHERE isactive = 1 and reward_template_id = ?`,
      [record.reward_template_id],
    );
    let {item, rewardsAll, action} = await this.prepareSubForm(record, list, true);
    if (!item) {
      return null;
    }
    const rewards = item.rewards as LevelXpReward[];

    delete item.rewards;
    let newId = id;
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    if (action === DialogCloseType.save_as_new) {
      delete item.reward_template_id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, rewards.map((b) => ({...b, reward_id: undefined})), []);
    } else {
      await this.databaseService.update<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, item, 'reward_template_id', record.reward_template_id as number);
      await this.saveSubs(record.reward_template_id as number, rewards, rewardsAll);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.reward_template_name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, 'reward_template_id', id);
    const record = {...duplicatedRecord};
    delete record.reward_template_id;
    record.reward_template_name = record.reward_template_name + ' (1)';
    let list: LevelXpReward[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbRewardTable} WHERE reward_template_id = ?`,
      [id],
    );
    list = list.map((l) => ({...l, reward_id: undefined}));
    let {item} = await this.prepareSubForm(record, list);
    if (!item) {
      return 0;
    }
    const rewards = item.rewards as LevelXpReward[];

    delete item.rewards;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
   // item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<LevelXpRewardsProfile>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, rewards, []);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }


  private async prepareSubForm(
    record: LevelXpRewardsProfile,
    list: LevelXpReward[],
    updateMode = false,
  ): Promise<{item: LevelXpRewardsProfile | undefined; rewardsAll: number[], action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const rewardsAll: number[] = [];
    for (const item2 of list) {
      if (item2.reward_id) {
        rewardsAll.push(item2.reward_id);
      }
      (form.get('rewards') as FormArray).push(
        this.subFormService.buildSubForm<LevelXpReward, any>(this.rewardForm, item2),
      );
    }
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<LevelXpRewardsProfile>(formConfig, form, {rewards: this.rewardForm});
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, rewardsAll: [], action};
    }
    this.resetForm(form);
    return {item, rewardsAll, action};
  }


  private async saveSubs(id: number, items: LevelXpReward[], all: number[] = []): Promise<void> {
    for (const item of items) {
      item.reward_template_id = id;
      item.reward_amount = item.reward_amount ? item.reward_amount : -1;
      if (item.reward_id) {
        all.splice(all.indexOf(item.reward_id), 1);
        await this.databaseService.update<LevelXpReward>(this.dbProfile, this.dbRewardTable, item, 'reward_id', item.reward_id);
      } else {
        delete item.reward_id;
        await this.databaseService.insert<LevelXpReward>(this.dbProfile, this.dbRewardTable, item, false);
      }
    }
    if (all.length > 0) {
      for (const id2 of all) {
        await this.databaseService.delete(this.dbProfile, this.dbRewardTable, 'reward_id', id2);
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      reward_template_name: ['', Validators.required],
      reward_mail_subject: [],
      reward_mail_message: [],
      rewards: new FormArray([]),
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('rewards') as FormArray).clear();
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'reward_template_id', order: 'asc'},
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
