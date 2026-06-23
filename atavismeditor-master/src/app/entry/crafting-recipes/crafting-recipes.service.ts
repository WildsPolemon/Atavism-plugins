import {Injectable} from '@angular/core';
import {DialogCloseType, DialogConfig, FormConfig, FormFieldType, QueryParams, TableConfig} from '../../models/configs';
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {craftingRecipesTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubQueryField, SubTable} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {CraftingRecipe} from './crafting-recipes.data';
import {craftingStationFieldConfig, itemFieldConfig, skillFieldConfig} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CraftingRecipesService {
  public tableKey = TabTypes.CRAFTING_RECIPES;
  private readonly listStream = new BehaviorSubject<CraftingRecipe[]>([]);
  public list = this.listStream.asObservable();
  public profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = craftingRecipesTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      crafting_xp: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      skillID: {
        type: ConfigTypes.dropdown,
        visible: true,
        data: [],
        filterType: FilterTypes.dynamicDropdown,
        filterVisible: true,
        fieldConfig: skillFieldConfig,
      },
      skillLevelReq: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      stationReq: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: [],
      },
      creationTime: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      layoutReq: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      resultItem: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItemCount: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      component: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      componentcount: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
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
  private chanceTranslation = this.translate.instant(this.tableKey + '.CHANCE');
  private chanceHelpTranslation = this.translate.instant(this.tableKey + '.CHANCE_HELP');
  private createsLabel = this.translate.instant(this.tableKey + '.CREATES_ITEM');
  private createsHelpLabel = this.translate.instant(this.tableKey + '.CREATES_ITEM_HELP');
  private countTranslation = this.translate.instant(this.tableKey + '.COUNT');
  private countHelpTranslation = this.translate.instant(this.tableKey + '.COUNT_HELP');
  private andItemLabel = this.translate.instant(this.tableKey + '.AND_ITEM');
  private andItemHelpLabel = this.translate.instant(this.tableKey + '.AND_ITEM_HELP');
  private itemLabel = this.translate.instant(this.tableKey + '.ITEM');
  private itemHelpLabel = this.translate.instant(this.tableKey + '.ITEM_HELP');
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 64, width: 100},
      crafting_xp: {name: 'crafting_xp', type: FormFieldType.integer, length: 255, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      title1: {name: '', label: this.translate.instant(this.tableKey + '.GROUP_TITLE_1'), type: FormFieldType.title},
      chance: {
        name: 'chance',
        label: this.chanceTranslation,
        tooltip: this.chanceHelpTranslation,
        type: FormFieldType.integer,
        width: 100,
      },
      resultItemID: {
        name: 'resultItemID',
        label: this.createsLabel,
        tooltip: this.createsHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItemCount: {
        name: 'resultItemCount',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem2ID: {
        name: 'resultItem2ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem2Count: {
        name: 'resultItem2Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem3ID: {
        name: 'resultItem3ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem3Count: {
        name: 'resultItem3Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem4ID: {
        name: 'resultItem4ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem4Count: {
        name: 'resultItem4Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title2: {name: '', label: this.translate.instant(this.tableKey + '.GROUP_TITLE_2'), type: FormFieldType.title},
      chance2: {
        name: 'chance2',
        label: this.chanceTranslation,
        tooltip: this.chanceHelpTranslation,
        type: FormFieldType.integer,
        width: 100,
      },
      resultItem5ID: {
        name: 'resultItem5ID',
        label: this.createsLabel,
        tooltip: this.createsHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem5Count: {
        name: 'resultItem5Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem6ID: {
        name: 'resultItem6ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem6Count: {
        name: 'resultItem6Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem7ID: {
        name: 'resultItem7ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem7Count: {
        name: 'resultItem7Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem8ID: {
        name: 'resultItem8ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem8Count: {
        name: 'resultItem8Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title3: {name: '', label: this.translate.instant(this.tableKey + '.GROUP_TITLE_3'), type: FormFieldType.title},
      chance3: {
        name: 'chance3',
        label: this.chanceTranslation,
        tooltip: this.chanceHelpTranslation,
        type: FormFieldType.integer,
        width: 100,
      },
      resultItem9ID: {
        name: 'resultItem9ID',
        label: this.createsLabel,
        tooltip: this.createsHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem9Count: {
        name: 'resultItem9Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem10ID: {
        name: 'resultItem10ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem10Count: {
        name: 'resultItem10Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem11ID: {
        name: 'resultItem11ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem11Count: {
        name: 'resultItem11Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem12ID: {
        name: 'resultItem12ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem12Count: {
        name: 'resultItem12Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title4: {name: '', label: this.translate.instant(this.tableKey + '.GROUP_TITLE_4'), type: FormFieldType.title},
      chance4: {
        name: 'chance4',
        label: this.chanceTranslation,
        tooltip: this.chanceHelpTranslation,
        type: FormFieldType.integer,
        width: 100,
      },
      resultItem13ID: {
        name: 'resultItem13ID',
        label: this.createsLabel,
        tooltip: this.createsHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem13Count: {
        name: 'resultItem13Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem14ID: {
        name: 'resultItem14ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem14Count: {
        name: 'resultItem14Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem15ID: {
        name: 'resultItem15ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem15Count: {
        name: 'resultItem15Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      resultItem16ID: {
        name: 'resultItem16ID',
        label: this.andItemLabel,
        tooltip: this.andItemHelpLabel,
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      resultItem16Count: {
        name: 'resultItem16Count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title5: {name: '', label: this.translate.instant(this.tableKey + '.REQUIREMENTS'), type: FormFieldType.title},
      skillID: {
        name: 'skillID',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        allowNew: true,
        fieldConfig: skillFieldConfig,
      },
      skillLevelReq: {name: 'skillLevelReq', type: FormFieldType.integer, width: 25},
      stationReq: {
        name: 'stationReq',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: craftingStationFieldConfig,
        width: 25,
        search: true,
      },
      creationTime: {name: 'creationTime', type: FormFieldType.integer, width: 25},
      layoutReq: {name: 'layoutReq', type: FormFieldType.boolean, width: 100},
      title6: {name: '', label: this.translate.instant(this.tableKey + '.ITEMS_REQUIRED_1'), type: FormFieldType.title},
      component1: {
        name: 'component1',
        label: this.itemLabel + ' 1',
        tooltip: this.itemHelpLabel + ' 1',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component1count: {
        name: 'component1count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component2: {
        name: 'component2',
        label: this.itemLabel + ' 2',
        tooltip: this.itemHelpLabel + ' 2',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component2count: {
        name: 'component2count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component3: {
        name: 'component3',
        label: this.itemLabel + ' 3',
        tooltip: this.itemHelpLabel + ' 3',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component3count: {
        name: 'component3count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component4: {
        name: 'component4',
        label: this.itemLabel + ' 4',
        tooltip: this.itemHelpLabel + ' 4',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component4count: {
        name: 'component4count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title7: {name: '', label: this.translate.instant(this.tableKey + '.ITEMS_REQUIRED_2'), type: FormFieldType.title},
      component5: {
        name: 'component5',
        label: this.itemLabel + ' 5',
        tooltip: this.itemHelpLabel + ' 5',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component5count: {
        name: 'component5count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component6: {
        name: 'component6',
        label: this.itemLabel + ' 6',
        tooltip: this.itemHelpLabel + ' 6',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component6count: {
        name: 'component6count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component7: {
        name: 'component7',
        label: this.itemLabel + ' 7',
        tooltip: this.itemHelpLabel + ' 7',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component7count: {
        name: 'component7count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component8: {
        name: 'component8',
        label: this.itemLabel + ' 8',
        tooltip: this.itemHelpLabel + ' 8',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component8count: {
        name: 'component8count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title8: {name: '', label: this.translate.instant(this.tableKey + '.ITEMS_REQUIRED_3'), type: FormFieldType.title},
      component9: {
        name: 'component9',
        label: this.itemLabel + ' 9',
        tooltip: this.itemHelpLabel + ' 9',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component9count: {
        name: 'component9count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component10: {
        name: 'component10',
        label: this.itemLabel + ' 10',
        tooltip: this.itemHelpLabel + ' 10',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component10count: {
        name: 'component10count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component11: {
        name: 'component11',
        label: this.itemLabel + ' 11',
        tooltip: this.itemHelpLabel + ' 11',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component11count: {
        name: 'component11count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component12: {
        name: 'component12',
        label: this.itemLabel + ' 12',
        tooltip: this.itemHelpLabel + ' 12',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component12count: {
        name: 'component12count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      title9: {name: '', label: this.translate.instant(this.tableKey + '.ITEMS_REQUIRED_4'), type: FormFieldType.title},
      component13: {
        name: 'component13',
        label: this.itemLabel + ' 13',
        tooltip: this.itemHelpLabel + ' 13',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component13count: {
        name: 'component13count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component14: {
        name: 'component14',
        label: this.itemLabel + ' 14',
        tooltip: this.itemHelpLabel + ' 14',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component14count: {
        name: 'component14count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component15: {
        name: 'component15',
        label: this.itemLabel + ' 15',
        tooltip: this.itemHelpLabel + ' 15',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component15count: {
        name: 'component15count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
      component16: {
        name: 'component16',
        label: this.itemLabel + ' 16',
        tooltip: this.itemHelpLabel + ' 16',
        width: 25,
        allowNew: true,
        type: FormFieldType.dynamicDropdown,
        fieldConfig: itemFieldConfig,
      },
      component16count: {
        name: 'component16count',
        label: this.countTranslation,
        tooltip: this.countHelpTranslation,
        type: FormFieldType.integer,
        width: 25,
      },
    },
  };
  private itemsList: DropdownValue[] = [];
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly imageService: ImageService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      const defaultIsActiveFilter =
        typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
      this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
      if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
        this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
      }
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        this.loadOptions();
      }
    });
    this.dropdownItemsService.items.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.itemsList = list;
    });
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.skillID.data = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.stationReq.data = await this.optionChoicesService.getOptionsByType(
      'Crafting Station',
      true,
    );
  }

  private async loadOptions(): Promise<void> {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getSkills();
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getCraftingRecipes();
    }
    const subFields: Record<string, SubQueryField> = {
      resultItem: {
        type: SubTable.multiple,
        columns: [
          'resultItemID',
          'resultItem2ID',
          'resultItem3ID',
          'resultItem4ID',
          'resultItem5ID',
          'resultItem6ID',
          'resultItem7ID',
          'resultItem8ID',
          'resultItem9ID',
          'resultItem10ID',
          'resultItem11ID',
          'resultItem12ID',
          'resultItem13ID',
          'resultItem14ID',
          'resultItem15ID',
          'resultItem16ID',
        ],
      },
      resultItemCount: {
        type: SubTable.multiple,
        columns: [
          'resultItemCount',
          'resultItem2Count',
          'resultItem3Count',
          'resultItem4Count',
          'resultItem5Count',
          'resultItem6Count',
          'resultItem7Count',
          'resultItem8Count',
          'resultItem9Count',
          'resultItem10Count',
          'resultItem11Count',
          'resultItem12Count',
          'resultItem13Count',
          'resultItem14Count',
          'resultItem15Count',
          'resultItem16Count',
        ],
      },
      component: {
        type: SubTable.multiple,
        columns: [
          'component1',
          'component2',
          'component3',
          'component4',
          'component5',
          'component6',
          'component7',
          'component8',
          'component9',
          'component10',
          'component11',
          'component12',
          'component13',
          'component14',
          'component15',
          'component16',
        ],
      },
      componentcount: {
        type: SubTable.multiple,
        columns: [
          'component1count',
          'component2count',
          'component3count',
          'component4count',
          'component5count',
          'component6count',
          'component7count',
          'component8count',
          'component9count',
          'component10count',
          'component11count',
          'component12count',
          'component13count',
          'component14count',
          'component15count',
          'component16count',
        ],
      },
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<CraftingRecipe>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<CraftingRecipe>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.setDefaults(item);
    const newId = await this.databaseService.insert<CraftingRecipe>(this.dbProfile, this.dbTable, item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<CraftingRecipe>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const {item, action} = await this.prepareForm(record, true);
    if (!item) {
      return null;
    }
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<CraftingRecipe>(this.dbProfile, this.dbTable, item);
    } else {
      await this.databaseService.update<CraftingRecipe>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: newId, value: item.name};
  }

  public async setDefaults(item: CraftingRecipe): Promise<CraftingRecipe> {
    for (let i = 1; i <= 16; i++) {
      // @ts-ignore
      item[`resultItem${i === 1 ? '' : i}ID`] = item[`resultItem${i === 1 ? '' : i}ID`]
        ? item[`resultItem${i === 1 ? '' : i}ID`]
        : -1;
      // @ts-ignore
      if (!item[`resultItem${i === 1 ? '' : i}Count`]) {
        // @ts-ignore
        item[`resultItem${i === 1 ? '' : i}Count`] = 1;
      }
      // @ts-ignore
      item[`component${i}`] = item[`component${i}`] ? item[`component${i}`] : -1;
      // @ts-ignore
      item[`component${i}count`] = item[`component${i}count`] ? item[`component${i}count`] : 1;
    }
    item.isactive = true;
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.crafting_xp = item.crafting_xp ? item.crafting_xp : 0;
    item.skillID = item.skillID ? item.skillID : -1;
    item.skillLevelReq = item.skillLevelReq ? item.skillLevelReq : 1;
    item.stationReq = item.stationReq ? item.stationReq : 'none';
    item.recipeItemID = item.recipeItemID ? item.recipeItemID : -1;
    item.qualityChangeable = item.qualityChangeable ? item.qualityChangeable : false;
    item.allowDyes = item.allowDyes ? item.allowDyes : false;
    item.allowEssences = item.allowEssences ? item.allowEssences : false;
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    return item;
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<CraftingRecipe>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const {item} = await this.prepareForm(record);
    if (!item) {
      return 0;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item.updatetimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<CraftingRecipe>(this.dbProfile, this.dbTable, item, false);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(record: CraftingRecipe, updateMode = false): Promise<{item: CraftingRecipe | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    formConfig.saveAsNew = updateMode;
    let {item, action} = await this.tablesService.openDialog<CraftingRecipe>(formConfig, form);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    item = await this.setDefaults(item);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {item, action};
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<CraftingRecipe>(this.dbProfile, this.dbTable, 'id', id);
    const creates_item = [];
    const componentItems = [];
    for (let i = 1; i <= 16; i++) {
      const key = 'resultItem' + (i === 1 ? '' : i);
      // @ts-ignore
      if (record[key + 'ID'] > 0) {
        // @ts-ignore
        const itm = this.itemsList.find((it) => it.id === record[key + 'ID']);
        let chanceValue = null;
        if (i === 1) {
          chanceValue = record.chance;
        } else if (i === 5) {
          chanceValue = record.chance2;
        } else if (i === 9) {
          chanceValue = record.chance3;
        } else if (i === 13) {
          chanceValue = record.chance4;
        }
        creates_item.push({
          chance: chanceValue ? chanceValue : '',
          // @ts-ignore
          item: itm ? itm.value : record[key + 'ID'],
          // @ts-ignore
          count: record[key + 'Count'],
        });
      }
      const key2 = 'component' + i;
      // @ts-ignore
      if (record[key2] > 0) {
        // @ts-ignore
        const itm = this.itemsList.find((it) => it.id === record[key2]);
        componentItems.push({
          // @ts-ignore
          item: itm ? itm.value : record[key2],
          // @ts-ignore
          count: record[key2 + 'count'],
        });
      }
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {creates_item, componentItems}},
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      icon: '',
      crafting_xp: [0, [Validators.min(0)]],
      resultItemID: -1,
      resultItemCount: [1, Validators.min(1)],
      resultItem2ID: -1,
      resultItem2Count: [1, Validators.min(1)],
      resultItem3ID: -1,
      resultItem3Count: [1, Validators.min(1)],
      resultItem4ID: -1,
      resultItem4Count: [1, Validators.min(1)],
      chance: [100, Validators.min(1)],
      resultItem5ID: -1,
      resultItem5Count: [1, Validators.min(1)],
      resultItem6ID: -1,
      resultItem6Count: [1, Validators.min(1)],
      resultItem7ID: -1,
      resultItem7Count: [1, Validators.min(1)],
      resultItem8ID: -1,
      resultItem8Count: [1, Validators.min(1)],
      chance2: [100, Validators.min(1)],
      resultItem9ID: -1,
      resultItem9Count: [1, Validators.min(1)],
      resultItem10ID: -1,
      resultItem10Count: [1, Validators.min(1)],
      resultItem11ID: -1,
      resultItem11Count: [1, Validators.min(1)],
      resultItem12ID: -1,
      resultItem12Count: [1, Validators.min(1)],
      chance3: [100, Validators.min(1)],
      resultItem13ID: -1,
      resultItem13Count: [1, Validators.min(1)],
      resultItem14ID: -1,
      resultItem14Count: [1, Validators.min(1)],
      resultItem15ID: -1,
      resultItem15Count: [1, Validators.min(1)],
      resultItem16ID: -1,
      resultItem16Count: [1, Validators.min(1)],
      chance4: [100, Validators.min(1)],
      skillID: null,
      skillLevelReq: [1, Validators.min(1)],
      stationReq: '',
      creationTime: [0, Validators.min(0)],
      recipeItemID: null,
      layoutReq: true,
      qualityChangeable: false,
      allowDyes: false,
      allowEssences: false,
      component1: -1,
      component1count: [1, Validators.min(1)],
      component2: -1,
      component2count: [1, Validators.min(1)],
      component3: -1,
      component3count: [1, Validators.min(1)],
      component4: -1,
      component4count: [1, Validators.min(1)],
      component5: -1,
      component5count: [1, Validators.min(1)],
      component6: -1,
      component6count: [1, Validators.min(1)],
      component7: -1,
      component7count: [1, Validators.min(1)],
      component8: -1,
      component8count: [1, Validators.min(1)],
      component9: -1,
      component9count: [1, Validators.min(1)],
      component10: -1,
      component10count: [1, Validators.min(1)],
      component11: -1,
      component11count: [1, Validators.min(1)],
      component12: -1,
      component12count: [1, Validators.min(1)],
      component13: -1,
      component13count: [1, Validators.min(1)],
      component14: -1,
      component14count: [1, Validators.min(1)],
      component15: -1,
      component15count: [1, Validators.min(1)],
      component16: -1,
      component16count: [1, Validators.min(1)],
    });
  }

  private resetForm(form: FormGroup): void {
    form.reset();
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
