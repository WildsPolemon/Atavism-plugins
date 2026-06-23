import {Injectable} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BehaviorSubject, Subject} from 'rxjs';
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
import {DataBaseProfile, DataBaseType} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {LoadingService} from '../../components/loading/loading.service';
import {instanceTemplateTable, weatherInstanceTable, weatherProfilesTable} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {SubFormService, SubQueryField, SubTable} from '../sub-form.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {weatherProfileFieldConfig} from '../dropdown.config';
import {InstanceTemplate, IslandPortals, IslandType, WeatherInstance, WeatherSeason} from './instances.data';
import {WeatherProfile} from '../weather-profiles/weather-profiles.data';

@Injectable({
  providedIn: 'root',
})
export class InstancesService {
  private islandTypes: DropdownValue[] = [
    {id: IslandType.World, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.WORLD')},
    {id: IslandType.Dungeon, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.DUNGEON')},
    {id: IslandType.GroupDungeon, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.GROUPDUNGEON')},
    {id: IslandType.PlayerInstance, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.PLAYERINSTANCE')},
    {id: IslandType.Arena, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.ARENA')},
    {id: IslandType.Guild, value: this.translate.instant(TabTypes.INSTANCES + '.ISLANDTYPES.GUILD')},
  ];
  public tableKey = TabTypes.INSTANCES;
  private readonly listStream = new BehaviorSubject<InstanceTemplate[]>([]);
  public list = this.listStream.asObservable();
  public dbProfileContent!: DataBaseProfile;
  public dbProfileAdmin!: DataBaseProfile;
  public dbTable = instanceTemplateTable;
  private dbTableIslandPortals = 'island_portals';
  private dbTableWeather = weatherInstanceTable;
  private dbTableSeason = 'weather_season';
  private seasons: DropdownValue[] = [
    {id: 0, value: this.translate.instant('SEASON.WINTER')},
    {id: 1, value: this.translate.instant('SEASON.SPRING')},
    {id: 2, value: this.translate.instant('SEASON.SUMMER')},
    {id: 3, value: this.translate.instant('SEASON.AUTUMN')},
  ];
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      island_name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      islandType: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.islandTypes,
      },
      createOnStartup: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.booleanType,
      },
      globalWaterHeight: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      populationLimit: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.integer,
      },
      weather_profile_id: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: weatherProfileFieldConfig,
      },
      season: {
        type: ConfigTypes.hidden,
        visible: false,
        alwaysVisible: true,
        filterVisible: true,
        filterType: FilterTypes.dropdown,
        data: this.seasons,
      },
      lastUpdate: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
      dateCreated: {type: ConfigTypes.date, visible: true, filterVisible: true, filterType: FilterTypes.date},
    },
    actions: [
      {type: ActionsTypes.EDIT, name: ActionsNames.EDIT, icon: ActionsIcons.EDIT},
      {type: ActionsTypes.DUPLICATE, name: ActionsNames.DUPLICATE, icon: ActionsIcons.DUPLICATE},
      {type: ActionsTypes.DELETE, name: ActionsNames.MARK_AS_REMOVED, icon: ActionsIcons.DELETE},
    ],
    queryParams: {search: '', where: {}, sort: {field: 'island_name', order: 'asc'}, limit: {limit: 10, page: 0}},
  };
  private weatherMonthTootip = this.translate.instant(this.tableKey + '.PROFILE_MONTH_HELP');
  private seasonMonthTootip = this.translate.instant(this.tableKey + '.SEASON_MONTH_HELP');
  public formConfig: FormConfig = {
    type: this.tableKey,
    saveAsNew: false,
    dialogType: DialogConfig.normalDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      island_name: {name: 'island_name', type: FormFieldType.input, require: true, length: 64},
      islandType: {name: 'islandType', type: FormFieldType.dropdown, require: true, data: this.islandTypes},
      createOnStartup: {name: 'createOnStartup', type: FormFieldType.boolean},
      globalWaterHeight: {name: 'globalWaterHeight', type: FormFieldType.decimal, require: true},
      populationLimit: {name: 'populationLimit', type: FormFieldType.integer, require: true},
    },
    subForms: {
      markers: {
        title: this.translate.instant(this.tableKey + '.MARKERS'),
        submit: this.translate.instant(this.tableKey + '.ADD_MARKERS'),
        freezeFirst: true,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          island: {name: 'island', label: '', type: FormFieldType.hidden},
          name: {name: 'name', type: FormFieldType.input, require: true, length: 32},
          locX: {name: 'locX', type: FormFieldType.decimal, require: true, width: 33},
          locY: {name: 'locY', type: FormFieldType.decimal, require: true, width: 33},
          locZ: {name: 'locZ', type: FormFieldType.decimal, require: true, width: 33},
          orientY: {name: 'orientY', type: FormFieldType.decimal, require: true},
        },
      },
      weathers: {
        title: this.translate.instant(this.tableKey + '.WEATHER_PROFILE_ID'),
        submit: this.translate.instant(this.tableKey + '.ADD_WEATHERS'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          instance_id: {name: 'instance_id', label: '', type: FormFieldType.hidden},
          weather_profile_id: {
            name: 'weather_profile_id',
            type: FormFieldType.dynamicDropdown,
            require: true,
            allowNew: true,
            fieldConfig: weatherProfileFieldConfig,
          },
          title: {name: '', label: this.translate.instant(this.tableKey + '.MONTHS'), type: FormFieldType.title},
          month1: {name: 'month1', label: '1', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month2: {name: 'month2', label: '2', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month3: {name: 'month3', label: '3', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month4: {name: 'month4', label: '4', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month5: {name: 'month5', label: '5', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month6: {name: 'month6', label: '6', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month7: {name: 'month7', label: '7', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month8: {name: 'month8', label: '8', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month9: {name: 'month9', label: '9', tooltip: this.weatherMonthTootip, type: FormFieldType.boolean, width: 8},
          month10: {
            name: 'month10',
            label: '10',
            tooltip: this.weatherMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
          month11: {
            name: 'month11',
            label: '11',
            tooltip: this.weatherMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
          month12: {
            name: 'month12',
            label: '12',
            tooltip: this.weatherMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
          priority: {
            name: 'priority',
            label: this.translate.instant(this.tableKey + '.PRIORITY'),
            type: FormFieldType.integer,
            require: true,
          },
        },
      },
      seasons: {
        title: this.translate.instant(this.tableKey + '.SEASON'),
        submit: this.translate.instant(this.tableKey + '.ADD_SEASON'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          instance_id: {name: 'instance_id', label: '', type: FormFieldType.hidden},
          season: {name: 'season', type: FormFieldType.dropdown, data: this.seasons, require: true},
          title: {name: '', label: this.translate.instant(this.tableKey + '.MONTHS'), type: FormFieldType.title},
          month1: {name: 'month1', label: '1', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month2: {name: 'month2', label: '2', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month3: {name: 'month3', label: '3', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month4: {name: 'month4', label: '4', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month5: {name: 'month5', label: '5', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month6: {name: 'month6', label: '6', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month7: {name: 'month7', label: '7', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month8: {name: 'month8', label: '8', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month9: {name: 'month9', label: '9', tooltip: this.seasonMonthTootip, type: FormFieldType.boolean, width: 8},
          month10: {
            name: 'month10',
            label: '10',
            tooltip: this.seasonMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
          month11: {
            name: 'month11',
            label: '11',
            tooltip: this.seasonMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
          month12: {
            name: 'month12',
            label: '12',
            tooltip: this.seasonMonthTootip,
            type: FormFieldType.boolean,
            width: 8,
          },
        },
      },
    },
  };
  private destroyer = new Subject<void>();
  private formDestroyer = new Subject<void>();
  private readonly subMarkerForm: SubFieldType = {
    id: {value: '', required: false},
    island: {value: '', required: false},
    name: {value: '', required: true},
    locX: {value: '', required: true},
    locY: {value: '', required: true},
    locZ: {value: '', required: true},
    orientY: {value: '', required: true},
  };
  private readonly subWeatherForm: SubFieldType = {
    id: {value: '', required: false},
    instance_id: {value: '', required: false},
    weather_profile_id: {value: '', required: true},
    month1: {value: false, required: false},
    month2: {value: false, required: false},
    month3: {value: false, required: false},
    month4: {value: false, required: false},
    month5: {value: false, required: false},
    month6: {value: false, required: false},
    month7: {value: false, required: false},
    month8: {value: false, required: false},
    month9: {value: false, required: false},
    month10: {value: false, required: false},
    month11: {value: false, required: false},
    month12: {value: false, required: false},
    priority: {value: '1', min: 0, required: true},
  };
  private readonly subSeasonForm: SubFieldType = {
    id: {value: '', required: false},
    instance_id: {value: '', required: false},
    season: {value: '', required: true},
    month1: {value: false, required: false},
    month2: {value: false, required: false},
    month3: {value: false, required: false},
    month4: {value: false, required: false},
    month5: {value: false, required: false},
    month6: {value: false, required: false},
    month7: {value: false, required: false},
    month8: {value: false, required: false},
    month9: {value: false, required: false},
    month10: {value: false, required: false},
    month11: {value: false, required: false},
    month12: {value: false, required: false},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly loadingService: LoadingService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.dbProfileContent = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.admin,
      ) as DataBaseProfile;
      if (!Utils.equals(latestProfile, this.dbProfileAdmin)) {
        this.dbProfileAdmin = latestProfile;
      }
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getInstances();
    }
    (queryParams.where as WhereQuery)['1'] = '1';
    const subFields: Record<string, SubQueryField> = {
      weather_profile_id: {
        type: SubTable.left_join,
        main: 'id',
        related: 'instance_id',
        table: this.dbProfileContent.database + '.' + this.dbTableWeather,
      },
      season: {
        type: SubTable.left_join,
        main: 'id',
        related: 'instance_id',
        table: this.dbProfileContent.database + '.' + this.dbTableSeason,
      },
    };
    const {searchSubQuery, newQueryParams} = this.databaseService.buildSubQueries(
      this.tableConfig.fields,
      queryParams,
      subFields,
    );
    const response = await this.databaseService.queryList<InstanceTemplate>(
      this.dbProfileAdmin,
      this.dbTable,
      this.tableConfig.fields,
      newQueryParams,
      searchSubQuery,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem(type = 0): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const subForms = {markers: this.subMarkerForm, weathers: this.subWeatherForm, seasons: this.subSeasonForm};
    const subForm = new FormGroup({});
    Object.keys(this.subMarkerForm).forEach((key) => {
      const control = new FormControl(
        key === 'name' ? 'spawn' : '',
        this.subMarkerForm[key].required ? Validators.required : null,
      );
      if (key === 'name') {
        control.disable();
      }
      subForm.addControl(key, control);
    });
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    (form.get('markers') as FormArray).push(subForm);
    if (type) {
      form.get('islandType')?.setValue(type);
    }
    formConfig.saveAsNew = false;
    let {item} = await this.tablesService.openDialog<InstanceTemplate>(formConfig, form, subForms);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    const markers = item.markers as IslandPortals[];
    const weathers = item.weathers as WeatherInstance[];
    const seasons = item.seasons as WeatherSeason[];
    delete item.markers;
    delete item.weathers;
    delete item.seasons;
    item.dateCreated = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, item);
    this.saveSubs(newId, markers, weathers, seasons);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.island_name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const markers: IslandPortals[] = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT * FROM ${this.dbTableIslandPortals} WHERE island = '${record.id}'`,
    );
    const weathers: WeatherInstance[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableWeather} WHERE instance_id = '${record.id}'`,
    );
    const seasons: WeatherSeason[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableSeason} WHERE instance_id = '${record.id}'`,
    );
    const markersAll: number[] = [];
    const weathersAll: number[] = [];
    const seasonsAll: number[] = [];
    for (const marker of markers) {
      markersAll.push(marker.id as number);
    }
    for (const weather of weathers) {
      weathersAll.push(weather.id as number);
    }
    for (const season of seasons) {
      seasonsAll.push(season.id as number);
    }
    let {item, action} = await this.prepareForm(record, markers, weathers, seasons);
    if (!item) {
      return null;
    }
    let newId;
    if (item.islandType !== IslandType.World) {
      const canSave = await this.checkIfWorldExist(record.id);
      if (canSave) {
        if (action === DialogCloseType.save_as_new) {
          const markers = item.markers as IslandPortals[];
          const weathers = item.weathers as WeatherInstance[];
          const seasons = item.seasons as WeatherSeason[];
          delete item.markers;
          delete item.weathers;
          delete item.seasons;
          delete item.id;
          item.dateCreated = this.databaseService.getTimestampNow();
          item = this.setDefaults(item);
          newId = await this.databaseService.insert<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, item);
          this.saveSubs(newId, markers.map((m) => ({...m, id: undefined})), weathers.map((m) => ({...m, id: undefined})), seasons.map((m) => ({...m, id: undefined})));
        } else {
          item.lastUpdate = this.databaseService.getTimestampNow();
          await this.saveUpdate(item, record, markersAll, weathersAll, seasonsAll);
          newId = record.id;
        }
      } else {
        this.notification.success(this.translate.instant(TabTypes.INSTANCES + '.ONE_WORLD_MUST_BE'));
        this.loadingService.hide();
        return null;
      }
    } else {
      if (action === DialogCloseType.save_as_new) {
        const markers = item.markers as IslandPortals[];
        const weathers = item.weathers as WeatherInstance[];
        const seasons = item.seasons as WeatherSeason[];
        delete item.markers;
        delete item.weathers;
        delete item.seasons;
        delete item.id;
        item.dateCreated = this.databaseService.getTimestampNow();
        item = this.setDefaults(item);
        newId = await this.databaseService.insert<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, item);
        this.saveSubs(newId, markers.map((m) => ({...m, id: undefined})), weathers.map((m) => ({...m, id: undefined})), seasons.map((m) => ({...m, id: undefined})));
      } else {
        await this.saveUpdate(item, record, markersAll, weathersAll, seasonsAll);
        newId = record.id;
      }
    }
    return {id: newId, value: item.island_name};
  }

  private setDefaults(item: InstanceTemplate): InstanceTemplate {
    item.createOnStartup = item.createOnStartup ? item.createOnStartup : false;
    if (item.islandType === IslandType.World) {
      item.createOnStartup = true;
    }
    item.administrator = 0;
    item.template = '';
    item.category = 1;
    item.status = 'Active';
    item.public = 1;
    item.password = '';
    item.style = '';
    item.recommendedLevel = 0;
    item.description = '';
    item.size = -1;
    item.lastUpdate = this.databaseService.getTimestampNow();
    return item;
  }

  private async saveUpdate(
    item: InstanceTemplate,
    record: InstanceTemplate,
    markersAll: number[],
    weathersAll: number[],
    seasonsAll: number[],
  ) {
    const markers = item.markers as IslandPortals[];
    const weathers = item.weathers as WeatherInstance[];
    const seasons = item.seasons as WeatherSeason[];
    delete item.markers;
    delete item.weathers;
    delete item.seasons;
    await this.databaseService.update<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, item, 'id', record.id);
    markers.forEach((marker) => {
      if (marker.id) {
        markersAll.splice(markersAll.indexOf(marker.id), 1);
      }
    });
    weathers.forEach((weather) => {
      if (weather.id) {
        weathersAll.splice(weathersAll.indexOf(weather.id), 1);
      }
    });
    seasons.forEach((season) => {
      if (season.id) {
        seasonsAll.splice(seasonsAll.indexOf(season.id), 1);
      }
    });
    if (markersAll.length > 0) {
      this.databaseService.customQuery(
        this.dbProfileAdmin,
        `DELETE FROM ${this.dbTableIslandPortals} WHERE id IN (${markersAll.join(', ')})`,
        [],
        true,
      );
    }
    if (weathersAll.length > 0) {
      this.databaseService.customQuery(
        this.dbProfileContent,
        `DELETE FROM ${this.dbTableWeather} WHERE id IN (${weathersAll.join(', ')})`,
        [],
        true,
      );
    }
    if (seasonsAll.length > 0) {
      this.databaseService.customQuery(
        this.dbProfileContent,
        `DELETE FROM ${this.dbTableSeason} WHERE id IN (${seasonsAll.join(', ')})`,
        [],
        true,
      );
    }
    this.saveSubs(record.id, markers, weathers, seasons);
    this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    this.tablesService.dialogRef = null;
    return 1;
  }

  public async checkIfWorldExist(id: number): Promise<boolean> {
    const result = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT count(*) isWorldThere FROM ${this.dbTable} WHERE islandType = '${IslandType.World}' AND id != '${id}'`,
    );
    return +result[0].isWorldThere > 0;
  }

  public async removeRelated(id: number): Promise<void> {
    await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `DELETE FROM ${this.dbTableIslandPortals} WHERE island = '${id}'`,
      [],
      true,
    );
    await this.databaseService.customQuery(
      this.dbProfileContent,
      `DELETE FROM ${this.dbTableWeather} WHERE instance_id = '${id}'`,
      [],
      true,
    );
    await this.databaseService.customQuery(
      this.dbProfileContent,
      `DELETE FROM ${this.dbTableSeason} WHERE instance_id = '${id}'`,
      [],
      true,
    );
  }

  public async previewItems(id: number): Promise<void> {
    const result1: IslandPortals[] = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT * FROM ${this.dbTableIslandPortals} WHERE island = '${id}'`,
    );
    const res1 = [];
    const res2 = [];
    const res3 = [];
    for (const item1 of result1) {
      res1.push({
        name: item1.name,
        locx: item1.locX,
        locy: item1.locY,
        locz: item1.locZ,
        orientY: item1.orientY,
      });
    }
    const result2: WeatherInstance[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableWeather} WHERE instance_id = '${id}'`,
    );
    for (const item2 of result2) {
      const checkedMonths = [];
      for (let i = 1; i <= 12; i++) {
        // @ts-ignore
        if (item2['month' + i]) {
          checkedMonths.push(i);
        }
      }
      const weather = await this.databaseService.queryItem<WeatherProfile>(
        this.dbProfileContent,
        weatherProfilesTable,
        'id',
        item2.weather_profile_id,
      );
      res2.push({
        name: weather ? weather.name : item2.weather_profile_id,
        months: checkedMonths.join(', '),
        priority: item2.priority,
      });
    }
    const result3: WeatherSeason[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableSeason} WHERE instance_id = '${id}'`,
    );
    for (const item3 of result3) {
      const checkedMonths2 = [];
      for (let i = 1; i <= 12; i++) {
        // @ts-ignore
        if (item3['month' + i]) {
          checkedMonths2.push(i);
        }
      }
      const season = this.seasons.find((sit) => sit.id === item3.season);
      res3.push({
        name: season ? season.value : item3.season,
        months: checkedMonths2.join(', '),
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {markers: res1, weathers: res2, seasons: res3}},
    });
  }

  public async duplicateItem(id: number): Promise<number> {
    const baseRecord = await this.databaseService.queryItem<InstanceTemplate>(
      this.dbProfileAdmin,
      this.dbTable,
      'id',
      id,
    );
    const newName = baseRecord.island_name + ' (1)';
    const result = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT count(*) as countNames FROM ${this.dbTable} WHERE island_name = '${newName}'`,
    );
    if (+result[0].countNames > 0) {
      this.notification.error(this.translate.instant(this.tableKey + '.DUPLICATED_ERROR'));
      return 0;
    }
    const record = {...baseRecord};
    // @ts-ignore
    delete record.id;
    record.island_name = newName;
    let markers: IslandPortals[] = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT * FROM ${this.dbTableIslandPortals} WHERE island = '${baseRecord.id}'`,
    );
    let weathers: WeatherInstance[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableWeather} WHERE instance_id = '${baseRecord.id}'`,
    );
    let seasons: WeatherSeason[] = await this.databaseService.customQuery(
      this.dbProfileContent,
      `SELECT * FROM ${this.dbTableSeason} WHERE instance_id = '${baseRecord.id}'`,
    );
    markers = markers.map((subItem) => ({...subItem, ...{id: undefined}}));
    weathers = weathers.map((subItem) => ({...subItem, ...{id: undefined}}));
    seasons = seasons.map((subItem) => ({...subItem, ...{id: undefined}}));
    let {item} = await this.prepareForm(record, markers, weathers, seasons);
    if (!item) {
      return 0;
    }
    const allMarkers = item.markers as IslandPortals[];
    const allWeathers = item.weathers as WeatherInstance[];
    const allSeasons = item.seasons as WeatherSeason[];
    delete item.markers;
    delete item.weathers;
    delete item.seasons;
    item.dateCreated = this.databaseService.getTimestampNow();
    item.lastUpdate = this.databaseService.getTimestampNow();
    item = this.setDefaults(item);
    const newId = await this.databaseService.insert<InstanceTemplate>(this.dbProfileAdmin, this.dbTable, item, false);
    this.saveSubs(newId, allMarkers, allWeathers, allSeasons);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private async prepareForm(
    record: InstanceTemplate,
    markers: IslandPortals[],
    weathers: WeatherInstance[],
    seasons: WeatherSeason[],
  ): Promise<{item: InstanceTemplate | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const marker of markers) {
      const i = markers.indexOf(marker);
      const subForm = new FormGroup({});
      Object.keys(this.subMarkerForm).forEach((key) => {
        // @ts-ignore
        const control = new FormControl(marker[key], this.subMarkerForm[key].required ? Validators.required : null);
        if (i === 0 && key === 'name' && marker[key] === 'spawn') {
          control.disable();
        }
        subForm.addControl(key, control);
      });
      (form.get('markers') as FormArray).push(subForm);
    }
    for (const weather of weathers) {
      (form.get('weathers') as FormArray).push(
        this.subFormService.buildSubForm<WeatherInstance, any>(this.subWeatherForm, weather),
      );
    }
    for (const season of seasons) {
      (form.get('seasons') as FormArray).push(
        this.subFormService.buildSubForm<WeatherSeason, any>(this.subSeasonForm, season),
      );
    }
    form.patchValue(record);
    const subForms = {markers: this.subMarkerForm, weathers: this.subWeatherForm, seasons: this.subSeasonForm};
    formConfig.saveAsNew = !!record.id;
    const {item, action} = await this.tablesService.openDialog<InstanceTemplate>(formConfig, form, subForms);
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    return {item, action};
  }

  private saveSubs(id: number, markers: IslandPortals[], weathers: WeatherInstance[], seasons: WeatherSeason[]) {
    for (const marker of markers) {
      if (marker.id) {
        this.databaseService.update<IslandPortals>(
          this.dbProfileAdmin,
          this.dbTableIslandPortals,
          marker,
          'id',
          marker.id,
        );
      } else {
        this.databaseService.insert<IslandPortals>(
          this.dbProfileAdmin,
          this.dbTableIslandPortals,
          {
            island: id,
            name: marker.name,
            portalType: 0,
            faction: 0,
            locX: marker.locX,
            locY: marker.locY,
            locZ: marker.locZ,
            orientX: 0,
            orientY: marker.orientY,
            orientZ: 0,
            orientW: 0,
            displayID: 0,
          },
          false,
        );
      }
    }
    for (const weather of weathers) {
      if (weather.id) {
        this.databaseService.update<WeatherInstance>(
          this.dbProfileContent,
          this.dbTableWeather,
          weather,
          'id',
          weather.id,
        );
      } else {
        this.databaseService.insert<WeatherInstance>(
          this.dbProfileContent,
          this.dbTableWeather,
          {
            instance_id: id,
            weather_profile_id: weather.weather_profile_id,
            month1: weather.month1,
            month2: weather.month2,
            month3: weather.month3,
            month4: weather.month4,
            month5: weather.month5,
            month6: weather.month6,
            month7: weather.month7,
            month8: weather.month8,
            month9: weather.month9,
            month10: weather.month10,
            month11: weather.month11,
            month12: weather.month12,
            priority: weather.priority,
          },
          false,
        );
      }
    }
    for (const season of seasons) {
      if (season.id) {
        this.databaseService.update<WeatherSeason>(this.dbProfileContent, this.dbTableSeason, season, 'id', season.id);
      } else {
        this.databaseService.insert<WeatherSeason>(
          this.dbProfileContent,
          this.dbTableSeason,
          {
            instance_id: id,
            season: season.season,
            month1: season.month1,
            month2: season.month2,
            month3: season.month3,
            month4: season.month4,
            month5: season.month5,
            month6: season.month6,
            month7: season.month7,
            month8: season.month8,
            month9: season.month9,
            month10: season.month10,
            month11: season.month11,
            month12: season.month12,
          },
          false,
        );
      }
    }
  }

  public destroy(): void {
    this.tableConfig.queryParams = {
      search: '',
      where: {},
      sort: {field: 'island_name', order: 'asc'},
      limit: {limit: 10, page: 0},
    };
    this.destroyer.next(void 0);
    this.destroyer.complete();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('markers') as FormArray).clear();
    (form.get('weathers') as FormArray).clear();
    (form.get('seasons') as FormArray).clear();
    this.formDestroyer.next(void 0);
    this.formDestroyer.complete();
  }

  private createForm(): FormGroup {
    this.formDestroyer = new Subject<void>();
    const form = this.fb.group({
      island_name: ['', Validators.required],
      islandType: ['', Validators.required],
      createOnStartup: [''],
      globalWaterHeight: ['', Validators.required],
      populationLimit: ['', [Validators.required, Validators.min(-1)]],
      markers: new FormArray([]),
      weathers: new FormArray([]),
      seasons: new FormArray([]),
    });
    (form.get('islandType') as AbstractControl).valueChanges
      .pipe(distinctPipe(this.formDestroyer))
      .subscribe((value) => {
        if (value === IslandType.World) {
          form.get('createOnStartup')?.patchValue(true);
          form.get('createOnStartup')?.disable({onlySelf: true});
        } else {
          form.get('createOnStartup')?.enable();
        }
      });
    return form;
  }
}
