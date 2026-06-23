import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {TabTypes} from '../../models/tabTypes.enum';
import {DialogCloseType, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {TranslateService} from '@ngx-translate/core';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {vipLevelValidator} from '../../validators/vip-level.validator';
import {Subject} from 'rxjs';
import {distinctPipe, getProfilePipe} from '../../directives/utils';
import {bonusesSettingsTable, vipLevelBonusesTable, vipLevelTable} from '../tables.data';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {DropdownItemsService} from '../dropdown-items.service';

interface VipLevel {
  id?: number;
  name: string;
  level: number;
  description: string;
  max_points: number;
  isactive: boolean;
  bonus_settings?: VipLevelBonus[];
}

export interface VipLevelBonus {
  vip_level_id?: number;
  bonus_settings_id: number;
  value: number;
  valuep: number;
}

@Component({
  selector: 'atv-vip',
  templateUrl: './vip.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VipComponent implements OnInit, OnDestroy {
  private destroyer = new Subject<void>();
  private tableKey: TabTypes = TabTypes.VIP;
  private bonusSettingsIdField = {
    idField: 'id',
    valueField: 'name',
    profile: DataBaseType.world_content,
    table: bonusesSettingsTable,
    options: {where: {isactive: 1}},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      description: {type: ConfigTypes.hidden, visible: false, alwaysVisible: true, useAsSearch: true},
      level: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      max_points: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      bonus_settings_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: this.bonusSettingsIdField,
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
    queryParams: {search: '', where: {}, sort: {field: 'level', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public list: VipLevel[] = [];
  private used: VipLevel[] = [];
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 49},
      level: {name: 'level', type: FormFieldType.integer, require: true},
      max_points: {name: 'max_points', type: FormFieldType.integer, require: true, length: 16},
      description: {name: 'description', type: FormFieldType.textarea, require: true},
    },
    subForms: {
      bonus_settings: {
        title: this.translate.instant(this.tableKey + '.BONUS_SETTINGS_ID'),
        submit: this.translate.instant('ACTIONS.ADD_BONUS'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          bonus_settings_id: {
            name: 'bonus_settings_id',
            type: FormFieldType.dynamicDropdown,
            fieldConfig: this.bonusSettingsIdField,
            require: true,
            allowNew: true,
          },
          value: {name: 'value', type: FormFieldType.integer, require: true, width: 50},
          valuep: {name: 'valuep', type: FormFieldType.decimal, require: true, width: 50},
        },
      },
    },
  };
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private dbProfile!: DataBaseProfile;
  private dbTable = vipLevelTable;
  private dbTableSub = vipLevelBonusesTable;
  private form!: FormGroup;
  private subForm: any;

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
    private readonly subFormService: SubFormService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.dbProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      this.loadData();
      this.loadUsed();
    });
    this.tablesService.activeTab.pipe(distinctPipe(this.destroyer)).subscribe((tab) => {
      if (!tab || (tab && tab.id !== this.tableConfig.type)) {
        this.changeDetectorRef.detach();
      } else {
        this.changeDetectorRef.reattach();
        this.changeDetectorRef.markForCheck();
      }
    });
    this.buildForm();
  }

  public async addItem(): Promise<void> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    (this.form.get('level') as AbstractControl).setValidators(null);
    (this.form.get('level') as AbstractControl).setValidators([
      Validators.required,
      Validators.min(0),
      vipLevelValidator(this.used),
    ]);
    this.formConfig.saveAsNew = false;
    const {item} = await this.tablesService.openDialog<VipLevel>(this.formConfig, this.form, {bonus_settings: this.subForm});
    if (!item) {
      this.form.reset();
      (this.form.get('bonus_settings') as FormArray).clear();
      this.tablesService.dialogRef = null;
      return;
    }
    item.isactive = true;
    const subList = item.bonus_settings as VipLevelBonus[];
    delete item.bonus_settings;
    const newId = await this.databaseService.insert<VipLevel>(this.dbProfile, this.dbTable, item);
    for (const subItem of subList) {
      this.databaseService.insert<VipLevelBonus>(
        this.dbProfile,
        this.dbTableSub,
        {
          vip_level_id: newId,
          bonus_settings_id: subItem.bonus_settings_id,
          value: +subItem.value,
          valuep: +subItem.valuep,
        },
        false,
      );
    }
    this.loadData();
    this.loadUsed();
    this.form.reset();
    (this.form.get('bonus_settings') as FormArray).clear();
    this.tablesService.dialogRef = null;
  }

  public async updateItem(id: number | string): Promise<number> {
    const record = await this.databaseService.queryItem<VipLevel>(this.dbProfile, this.dbTable, 'id', id);
    const list: VipLevelBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE vip_level_id = '${id}'`,
    );
    const {item, action} = await this.prepareForm(record, list, true);
    if (!item) {
      return 0;
    }
    const subList = item.bonus_settings as VipLevelBonus[];
    delete item.bonus_settings;

    if (action === DialogCloseType.save_as_new) {
      const exists = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTable} WHERE level = ?`,
        [item.level],
        true,
      );
      if (exists.length > 0) {
        this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_ERROR'));
        return 0;
      } else {
        delete item.id;
        const newId = await this.databaseService.insert<VipLevel>(this.dbProfile, this.dbTable, item);
        for (const subItem of subList) {
          this.databaseService.insert<VipLevelBonus>(
            this.dbProfile,
            this.dbTableSub,
            {
              vip_level_id: newId,
              bonus_settings_id: subItem.bonus_settings_id,
              value: +subItem.value,
              valuep: +subItem.valuep,
            },
            false,
          );
        }
      }


    } else {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableSub} WHERE vip_level_id = '${record.id}'`,
        [],
        true,
      );
      await this.databaseService.update<VipLevel>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      for (const subItem of subList) {
        await this.databaseService.insert<VipLevelBonus>(
          this.dbProfile,
          this.dbTableSub,
          {
            vip_level_id: record.id,
            bonus_settings_id: subItem.bonus_settings_id,
            value: +subItem.value,
            valuep: +subItem.valuep,
          },
          false,
        );
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.loadData();
    this.loadUsed();
    return 1;
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if (action.type === ActionsTypes.MARK_AS_REMOVED) {
      this.databaseService.queryItem<VipLevel>(this.dbProfile, this.dbTable, 'id', action.id).then((record) => {
        const query = `SELECT count(*) as isBigger FROM ${this.dbTable} where level > ${record.level} and isactive = 1`;
        this.databaseService.customQuery(this.dbProfile, query).then((result) => {
          if (+result[0].isBigger === 0) {
            this.tablesService.executeAction(this.dbProfile, this.dbTable, action).then(() => {
              this.loadData();
              this.loadUsed();
            });
          } else {
            this.notification.error(this.translate.instant(this.tableKey + '.CANT_REMOVE_NOT_LAST'));
            this.loadingService.hide();
          }
        });
      });
    } else if (action.type === ActionsTypes.RESTORE) {
      const result = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT MAX(level) as maxLevel FROM ${this.dbTable} WHERE isactive = 1`,
      );
      await this.tablesService.executeAction(this.dbProfile, this.dbTable, action);
      await this.databaseService.update<VipLevel>(
        this.dbProfile,
        this.dbTable,
        {level: +result[0].maxLevel + 1} as VipLevel,
        'id',
        action.id,
      );
      await this.loadData();
      await this.loadUsed();
    } else if (action.type === ActionsTypes.DELETE) {
      await this.tablesService.executeAction(this.dbProfile, this.dbTable, action);
      await this.loadData();
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableSub} WHERE vip_level_id = '${action.id}' `,
        [],
        true,
      );
    } else if (action.type === ActionsTypes.EDIT) {
      await this.updateItem(action.id);
    } else if (action.type === ActionsTypes.DUPLICATE) {
      this.loadingService.show();
      await this.duplicateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    const profile = this.dbProfile;
    const dbTable = this.dbTable;
    if (action.type === ActionsTypes.MARK_AS_REMOVED || action.type === ActionsTypes.DELETE) {
      const list = await this.databaseService.customQuery(
        profile,
        `SELECT * FROM ${dbTable} WHERE id IN (${action.id.join(', ')})`,
      );
      const newList = list.sort((a, b) => b.level - a.level);
      for (const record of newList) {
        const result = await this.databaseService.customQuery(
          profile,
          `SELECT count(*) as isBigger FROM ${dbTable} where level > ${record.level} and isactive = 1`,
        );
        if (!+result[0].isBigger) {
          await this.tablesService.executeAction(
            profile,
            dbTable,
            {id: record.id, type: action.type},
            undefined,
            false,
          );
          if (action.type === ActionsTypes.DELETE) {
            await this.databaseService.customQuery(
              this.dbProfile,
              `DELETE FROM ${this.dbTableSub} WHERE vip_level_id = '${record.id}' `,
              [],
              true,
            );
          }
        } else {
          this.notification.error(this.translate.instant(this.tableKey + '.CANT_REMOVE_NOT_LAST'));
          await this.loadData();
          await this.loadUsed();
          this.loadingService.hide();
          return;
        }
      }
      if (action.type === ActionsTypes.DELETE) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_REMOVED'));
      } else if (action.type === ActionsTypes.MARK_AS_REMOVED) {
        this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_DEACTIVATED'));
      }
      await this.loadData();
      await this.loadUsed();
      this.loadingService.hide();
    } else if (action.type === ActionsTypes.RESTORE) {
      const newList = action.id.sort((a, b) => a - b);
      for (const id of newList) {
        const result = await this.databaseService.customQuery(
          profile,
          `SELECT MAX(level) as maxLevel FROM ${dbTable} WHERE isactive = 1`,
        );
        await this.tablesService.executeAction(profile, dbTable, {id, type: action.type});
        await this.databaseService.update<VipLevel>(
          profile,
          dbTable,
          {level: +result[0].maxLevel + 1} as VipLevel,
          'id',
          id,
        );
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_BULK_ACTIVATED'));
      await this.loadData();
      await this.loadUsed();
      this.loadingService.hide();
    }
  }

  private async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<VipLevel>(this.dbProfile, this.dbTable, 'id', id);
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT MAX(level) as maxLevel FROM ${this.dbTable} WHERE isactive = 1`,
    );
    record.level = +result[0].maxLevel + 1;
    record.name = record.name + ' (1)';
    const list: VipLevelBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE vip_level_id = '${baseRecord.id}'`,
    );
    const {item} = await this.prepareForm(record, list);
    if (!item) {
      return 0;
    }
    const subList = item.bonus_settings as VipLevelBonus[];
    delete item.bonus_settings;
    const newId = await this.databaseService.insert<VipLevel>(this.dbProfile, this.dbTable, item, false);
    for (const subItem of subList) {
      await this.databaseService.insert<VipLevelBonus>(
        this.dbProfile,
        this.dbTableSub,
        {
          vip_level_id: newId,
          bonus_settings_id: subItem.bonus_settings_id,
          value: +subItem.value,
          valuep: +subItem.valuep,
        },
        false,
      );
    }
    await this.loadData();
    await this.loadUsed();
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  public async prepareForm(record: VipLevel, list: VipLevelBonus[], updateMode = false): Promise<{ item: VipLevel | undefined, action: DialogCloseType }> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    (this.form.get('level') as AbstractControl).setValidators(null);
    (this.form.get('level') as AbstractControl).setValidators([
      Validators.required,
      Validators.min(0),
      vipLevelValidator(this.used.filter((lItem) => (record.id ? lItem.id !== record.id : true))),
    ]);
    for (const lvl of list) {
      const bonus = await this.dropdownItemsService.getBonusSettingItem(lvl.bonus_settings_id);
      (this.form.get('bonus_settings') as FormArray).push(this.subFormService.bonusSubForm(bonus, lvl, this.subForm));
    }
    this.form.patchValue(record);
    this.formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<VipLevel>(this.formConfig, this.form, {
      bonus_settings: this.subForm,
    });
    this.form.reset();
    (this.form.get('bonus_settings') as FormArray).clear();
    this.tablesService.dialogRef = null;
    if (!item) {
      return {item: undefined, action};
    }
    return {item, action};
  }

  public async getPreviewItem(id: number | string): Promise<void> {
    const bonuses: VipLevelBonus[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE vip_level_id = '${id}'`,
    );
    const bonus_settings_id = [];
    for (const bonus of bonuses) {
      const bon = await this.dropdownItemsService.getBonusSettingItem(bonus.bonus_settings_id);
      bonus_settings_id.push({
        bonus_settings_id: bon ? bon.name : bonus.bonus_settings_id,
        value: bonus.value,
        valuep: bonus.valuep,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {bonus_settings_id}},
    });
  }

  private async loadData(): Promise<void> {
    const subFields: Record<string, SubQueryField> = {
      bonus_settings_id: {type: SubTable.left_join, main: 'id', related: 'vip_level_id', table: vipLevelBonusesTable},
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      this.queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<VipLevel[]>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.list = response.list;
    this.tableConfig.count = response.count;
    this.changeDetectorRef.markForCheck();
    this.loadingService.hide();
  }

  private buildForm(): void {
    this.subForm = {
      vip_level_id: {value: '', required: false},
      bonus_settings_id: {value: '', required: true},
      value: {value: '', required: true},
      valuep: {value: '', required: true},
    };
    this.form = this.fb.group({
      name: ['', Validators.required],
      level: ['', [Validators.required, Validators.min(1), vipLevelValidator(this.used)]],
      max_points: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      bonus_settings: new FormArray([]),
    });
    if (this.used.length > 0) {
      (this.form.get('level') as AbstractControl).setValidators(null);
      (this.form.get('level') as AbstractControl).setValidators([
        Validators.required,
        Validators.min(0),
        vipLevelValidator(this.used),
      ]);
    }
  }

  private async loadUsed(): Promise<void> {
    this.used = await this.databaseService.queryAll<VipLevel>(this.dbProfile, this.dbTable, this.tableConfig.fields, {
      where: {isactive: 1},
    });
    if (this.form.get('level')) {
      (this.form.get('level') as AbstractControl).setValidators(null);
      (this.form.get('level') as AbstractControl).setValidators([
        Validators.required,
        Validators.min(0),
        vipLevelValidator(this.used),
      ]);
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
