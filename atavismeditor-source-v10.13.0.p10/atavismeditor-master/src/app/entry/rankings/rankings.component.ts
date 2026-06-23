import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ConfigTypes, FilterTypes} from '../../models/configRow.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {DatabaseService} from '../../services/database.service';
import {ActionsIcons, ActionsNames, ActionsTypes, ActionTrigger} from '../../models/actions.interface';
import {DialogCloseType, FormConfig, FormFieldType, hiddenField, QueryParams, TableConfig} from '../../models/configs';
import {LoadingService} from '../../components/loading/loading.service';
import {NotificationService} from '../../services/notification.service';
import {TablesService} from '../../services/tables.service';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {Subject} from 'rxjs';
import {DropdownItemsService} from '../dropdown-items.service';
import {currencyFieldConfig, effectFieldConfig, factionFieldConfig} from '../dropdown.config';
import {SubFormService} from '../sub-form.service';

interface Ranking {
  id: number;
  type: number;
  sub_type: number;
  param1: number;
  param2: number;
  distinction: string;
  name: string;
  count: number;
  description: string;
  isactive: boolean;
  distinctions: Distinctions[];
}
export interface Distinctions {
  pos: number;
  color: string;
}
enum dataTypes {
  KILL = 'Kill',
  EXPERIENCE = 'Experience',
  HARVESTING = 'Harvesting',
  CRAFTING = 'Crafting',
  LOOTING = 'Looting',
  USE_ABILITY = 'Use Ability',
  FINAL_BLOW = 'Final blow',
  GEAR_SCORE = 'Gear Score',
  CURRENCY = 'Currency',
  PVP_KILL = 'PVP Kill',
}

enum subTypes {
  FACTION = 'Faction',
}

@Component({
  selector: 'atv-rankings',
  templateUrl: './rankings.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingsComponent implements OnInit, OnDestroy {
  private tableKey: TabTypes = TabTypes.RANKINGS;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      type: {
        type: ConfigTypes.dropdown,
        visible: true,
        useAsSearch: true,
        data: [
          {id: 1, value: dataTypes.KILL},
          {id: 2, value: dataTypes.EXPERIENCE},
          {id: 3, value: dataTypes.HARVESTING},
          {id: 4, value: dataTypes.CRAFTING},
          {id: 5, value: dataTypes.LOOTING},
          {id: 6, value: dataTypes.USE_ABILITY},
          {id: 7, value: dataTypes.FINAL_BLOW},
          {id: 8, value: dataTypes.GEAR_SCORE},
          {id: 9, value: dataTypes.CURRENCY},
          {id: 10, value: dataTypes.PVP_KILL},
        ],
        filterType: FilterTypes.dropdown,
        filterVisible: true,
      },
      sub_type: {
        type: ConfigTypes.dropdown,
        visible: true,
        useAsSearch: true,
        data: [
          {id: 1, value: subTypes.FACTION},
        ],
        filterType: FilterTypes.dropdown,
        filterVisible: true,
      },

      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      count: {type: ConfigTypes.numberType, visible: true, filterVisible: true, filterType: FilterTypes.integer},
      description: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      param1:{
        type: ConfigTypes.dropdown,
        visible: true,
        useAsSearch: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: currencyFieldConfig,
        data: [],},
      param2:{
        type: ConfigTypes.dropdown,
        visible: true,
        useAsSearch: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: factionFieldConfig,
        data: [],},
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
      {type: ActionsTypes.MARK_AS_REMOVED, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.MARK_AS_REMOVED},
      {type: ActionsTypes.RESTORE, name: ActionsNames.ACTIVATE, icon: ActionsIcons.RESTORE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  public list: Ranking[] = [];
  private used: Ranking[] = [];
  public formConfig: FormConfig = {
    type: this.tableKey,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 100},
      type: {
        name: 'type',
        type: FormFieldType.dropdown,
        data: [
          {id: 1, value: dataTypes.KILL},
          {id: 2, value: dataTypes.EXPERIENCE},
          {id: 3, value: dataTypes.HARVESTING},
          {id: 4, value: dataTypes.CRAFTING},
          {id: 5, value: dataTypes.LOOTING},
          {id: 6, value: dataTypes.USE_ABILITY},
          {id: 7, value: dataTypes.FINAL_BLOW},
          {id: 8, value: dataTypes.GEAR_SCORE},
          {id: 9, value: dataTypes.CURRENCY},
          {id: 10, value: dataTypes.PVP_KILL},
        ],
        require: true,
      },

      param1: {
        name: 'param1',
        type: FormFieldType.dynamicDropdown,
       // width: 33,
        allowNew: true,
        fieldConfig: currencyFieldConfig,
        hidden: hiddenField.hidden,
        conditionName: 'type',
        condition: {
          type: {
            1: {hidden: hiddenField.hidden},
            2: {hidden: hiddenField.hidden},
            3: {hidden: hiddenField.hidden},
            4: {hidden: hiddenField.hidden},
            5: {hidden: hiddenField.hidden},
            6: {hidden: hiddenField.hidden},
            7: {hidden: hiddenField.hidden},
            8: {hidden: hiddenField.hidden},
            9: {hidden: hiddenField.visible},
            10: {hidden: hiddenField.hidden},
          },
        },
      },
      sub_type: {
        name: 'sub_type',
        type: FormFieldType.dropdown,
        hideNone: false,
        data: [
          {id: 1, value: subTypes.FACTION},
        ],
        hidden: hiddenField.hidden,
        conditionName: 'type',
        condition: {
          type: {
            1: {hidden: hiddenField.hidden},
            2: {hidden: hiddenField.hidden},
            3: {hidden: hiddenField.hidden},
            4: {hidden: hiddenField.hidden},
            5: {hidden: hiddenField.hidden},
            6: {hidden: hiddenField.hidden},
            7: {hidden: hiddenField.hidden},
            8: {hidden: hiddenField.hidden},
            9: {hidden: hiddenField.visible},
            10: {hidden: hiddenField.hidden},
          },
        },
      },
      param2: {
        name: 'param2',
        type: FormFieldType.dynamicDropdown,
        // width: 33,
        allowNew: true,
        fieldConfig: factionFieldConfig,
        hidden: hiddenField.hidden,
        conditionName: 'sub_type',
        condition: {
          sub_type: {
            0: {hidden: hiddenField.hidden},
            1: {hidden: hiddenField.visible},
          },
        },
      },
      count: {name: 'count', type: FormFieldType.integer, require: true},
      description: {name: 'description', type: FormFieldType.textarea, require: true, length: 2048},
    },
    subForms: {
      distinctions: {
        title: this.translate.instant(this.tableKey + '.DISTINCTION'),
        submit: this.translate.instant(this.tableKey + '.ADD_DISTINCTION'),
        fields: {
          pos: {name: 'pos', type: FormFieldType.integer, require: true, width: 50},
          color: {name: 'color', type: FormFieldType.colorPicker, require: true, width: 50},
        },
      },
    },
  };
  private readonly distinctionForm = {
    pos: {value: '', required: true},
    color: {value: '', required: true},
  };
  public activeRecords = true;
  private queryParams: QueryParams = this.tableConfig.queryParams;
  private dbProfile!: DataBaseProfile;
  private dbTable = 'ranking_settings';
  private form!: FormGroup;
  private destroyer = new Subject<void>();
  private currentType: number | undefined = undefined;

  constructor(
    private readonly translate: TranslateService,
    private readonly profilesService: ProfilesService,
    private readonly databaseService: DatabaseService,
    private readonly fb: FormBuilder,
    private readonly loadingService: LoadingService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly tablesService: TablesService,
    private readonly dropdownItemsService: DropdownItemsService,
  ) {}

  public ngOnInit(): void {
    this.loadingService.show();
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadData();
        this.loadUsed();
      }
    });
    this.dropdownItemsService.currencies.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.param1.data = list;
    });
    this.dropdownItemsService.factions.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.param2.data = list;
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
    this.formConfig.saveAsNew = false;
    const {item} = await this.tablesService.openDialog<Ranking>(this.formConfig, this.form, {
      distinctions: this.distinctionForm,
    });
    this.currentType = undefined;
    if (!item) {
      this.resetForm(this.form);
      this.tablesService.dialogRef = null;
      return;
    }
    const distinctions = item.distinctions as Distinctions[];
    delete item.distinctions;
    item.distinction = distinctions.map((d) => `${d.pos};${d.color}`).join('|');


    const result = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 and type = ? and param1 = ? and sub_type = ? and param2 = ?`,
      [item.type, item.param1, item.sub_type, item.param2],
    );
    if (!+result[0].isUsed) {
      item.isactive = true;
      item.sub_type = item.sub_type ? item.sub_type : 0;
      item.param1 = item.param1 ? item.param1 : -1;
      item.param2 = item.param2 ? item.param2 : -1;

      await this.databaseService.insert<Ranking>(this.dbProfile, this.dbTable, item);
      this.loadData();
      this.loadUsed();
    } else {
      this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
    }
    this.resetForm(this.form);
    this.tablesService.dialogRef = null;
    this.loadingService.hide();
  }

  public async updateItem(id: number | string): Promise<void> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', id);
    if (record) {
      this.currentType = record.type;
      const m = record.distinction.split('|');
      for (const da of m) {
        const it = da.split(';');
        if (it.length > 1) {
          const d: Partial<Distinctions> = {pos: Number(it[0]), color: String(it[1])};
          (this.form.get('distinctions') as FormArray).push(
            this.subFormService.buildSubForm<Partial<Distinctions>, any>(this.distinctionForm, d),
          );
        }
      }
      this.form.patchValue(record);
      this.formConfig.saveAsNew = true;
      const {item, action} = await this.tablesService.openDialog<Ranking>(this.formConfig, this.form, {
        distinctions: this.distinctionForm,
      });
      if (!item) {
        this.resetForm(this.form);
        this.tablesService.dialogRef = null;
        this.loadingService.hide();
        this.currentType = undefined;
        return;
      }
      const distinctions = item.distinctions as Distinctions[];
      delete item.distinctions;
      item.distinction = distinctions.map((d) => `${d.pos};${d.color}`).join('|');
      item.sub_type = item.sub_type ? item.sub_type : 0;
      item.param1 = item.param1 ? item.param1 : -1;
      item.param2 = item.param2 ? item.param2 : -1;
      if (action === DialogCloseType.save_as_new) {
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 and type = ? and param1 = ? and sub_type = ? and param2 = ?`,
          [item.type, item.param1, item.sub_type, item.param2],
        );
        if (!+result[0].isUsed) {
          item.isactive = true;
          delete item.id;
          item.sub_type = item.sub_type ? item.sub_type : 0;
          item.param1 = item.param1 ? item.param1 : -1;
          item.param2 = item.param2 ? item.param2 : -1;
          await this.databaseService.insert<Ranking>(this.dbProfile, this.dbTable, item);
          this.loadData();
          this.loadUsed();
        } else {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
        }
      } else {
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and param1 = ? and sub_type = ? and param2 = ? and id != ?`,
          [item.type, item.param1, item.sub_type, item.param2, record.id],
        );
        if (!+result[0].isUsed) {
          await this.databaseService.update<Ranking>(this.dbProfile, this.dbTable, item, 'id', record.id);
          this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
          this.loadData();
          this.loadUsed();
        } else {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
        }
      }
      this.resetForm(this.form);
      this.currentType = undefined;
      this.tablesService.dialogRef = null;
    }
  }

  public paramsUpdated(params: QueryParams): void {
    this.queryParams = params;
    this.loadData();
  }

  public async actionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      if (action.type === ActionsTypes.RESTORE) {
        const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', action.id);
        const result = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and param1 = ? and sub_type = ? and param2 = ? and id != ?`,
          [record.type, record.param1, record.sub_type, record.param2, action.id],
        );
        if (+result[0].isUsed) {
          this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          this.loadingService.hide();
          return;
        }
      }
      await this.tablesService.executeAction(this.dbProfile, this.dbTable, action);
      this.loadData();
      this.loadUsed();
    } else if (action.type === ActionsTypes.EDIT) {
      this.updateItem(action.id);
    }
  }

  public async bulkActionTrigger(action: ActionTrigger): Promise<void> {
    if ([ActionsTypes.DELETE, ActionsTypes.RESTORE, ActionsTypes.MARK_AS_REMOVED].includes(action.type)) {
      const profile = this.dbProfile;
      const dbTable = this.dbTable;
      if (action.type === ActionsTypes.RESTORE) {
        for (const id of action.id) {
          const record = await this.databaseService.queryItem<Ranking>(this.dbProfile, this.dbTable, 'id', id);
          const result = await this.databaseService.customQuery(
            this.dbProfile,
            `SELECT count(*) as isUsed FROM ${this.dbTable} WHERE isactive = 1 AND type = ? and param1 = ? and sub_type = ? and param2 = ?  and id != ?`,
            [record.type, record.param1, record.sub_type, record.param2, id],
          );
          if (+result[0].isUsed) {
            this.notification.error(this.translate.instant(TabTypes.RANKINGS + '.ALREADY_USED_TYPE'));
          } else {
            await this.tablesService.executeAction(this.dbProfile, this.dbTable, {id, type: action.type});
          }
        }
      } else {
        await this.tablesService.executeBulkAction(profile, dbTable, action);
      }
      this.loadData();
      this.loadUsed();
      this.loadingService.hide();
    }
  }

  private async loadData(): Promise<void> {
    const response = await this.databaseService.queryList<Ranking[]>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      this.queryParams,
    );
    this.list = response.list;
    this.tableConfig.count = response.count;
    this.changeDetectorRef.markForCheck();
    await this.dropdownItemsService.getCurrencies();
    await this.dropdownItemsService.getFactions();
    this.loadingService.hide();
  }

  private async loadUsed(): Promise<void> {
    this.used = await this.databaseService.queryAll<Ranking>(this.dbProfile, this.dbTable, this.tableConfig.fields, {
      where: {isactive: 1},
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      sub_type: [''],
      param1: [''],
      param2: [''],
      count: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      distinctions: new FormArray([]),
    });
    (this.form.get('type') as AbstractControl).valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
      .subscribe((value) => {
        if (value) {
          console.warn(value);
          console.warn(this.currentType);
          if (this.currentType && value === this.currentType) {
            (this.form.get('type') as AbstractControl).clearValidators();
          } else if (this.currentType && value == 9) {
            (this.form.get('type') as AbstractControl).clearValidators();
            (this.form.get('param1') as AbstractControl).setValidators(Validators.required);
          //  (this.form.get('sub_type') as AbstractControl).setValidators(Validators.required);
          } else {
            (this.form.get('sub_type') as AbstractControl).reset();
            if (value == 9) {
              console.warn('Currency sub type');
              const used = this.used.filter((item) =>
                item.type === value &&
                item.param1 === (this.form.get('param1') as AbstractControl).value &&
                item.sub_type === (this.form.get('sub_type') as AbstractControl).value &&
                item.param2 === (this.form.get('param2') as AbstractControl).value
              );
              console.warn(used.length);
              if (used.length > 0) {
                // (this.form.get('param1') as AbstractControl).setErrors({DUPLICATED: true});
              }

            } else {
              console.warn('Other sub type');
              const used = this.used.filter((item) => item.type === value);
              if (used.length > 0) {
                (this.form.get('type') as AbstractControl).setErrors({DUPLICATED: true});
              }
            }
          }
        }
      });
    (this.form.get('param1') as AbstractControl).valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroyer))
      .subscribe((value) => {
        if (value) {
          console.warn(value);
          console.warn('param1');
          // const used = this.used.filter((item) => item.param1 === value);
          // if (used.length > 0) {
          //   (this.form.get('param1') as AbstractControl).setErrors({DUPLICATED: true});
          // }
        }
      });
  }
  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('distinctions') as FormArray).clear();
  }
  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
