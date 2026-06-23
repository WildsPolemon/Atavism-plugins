import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {TabTypes} from '../../models/tabTypes.enum';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {resourceDropTable, resourceNodeProfileTable, resourceNodeSubProfileTable} from '../tables.data';
import {
  DialogCloseType,
  DialogConfig,
  FormConfig,
  FormFieldType,
  QueryParams,
  SubFormType,
  TableConfig,
  TypeMap,
} from '../../models/configs';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatabaseService} from '../../services/database.service';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {TablesService} from '../../services/tables.service';
import {NotificationService} from '../../services/notification.service';
import {getProfilePipe, Utils} from '../../directives/utils';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ResourceDrop, ResourceNodeProfile, ResourceNodeSubProfile} from './resource-node-profile.data';
import {DropdownItemsService} from '../dropdown-items.service';
import {takeUntil} from 'rxjs/operators';
import {HandleDependenciesService} from '../../components/handle-dependencies/handle-dependencies.service';
import {coordFieldConfig, itemFieldConfig, skillFieldConfig, toolTypeFieldConfig} from '../dropdown.config';
import {SubFormService} from '../sub-form.service';
import {ImageService} from '../../components/image/image.service';
import {minNotEqualValidator} from '../../validators/min-not-equal.validator';

@Injectable({
  providedIn: 'root',
})
export class ResourceNodeProfileService {
  private destroyer = new Subject<void>();
  public tableKey = TabTypes.RESOURCE_NODE_PROFILE;
  private readonly listStream = new BehaviorSubject<ResourceNodeProfile[]>([]);
  public list = this.listStream.asObservable();
  public profile!: Profile;
  public dbProfile!: DataBaseProfile;
  public dbTable = resourceNodeProfileTable;
  public dbTableSub = resourceNodeSubProfileTable;
  public dbTableDrop = resourceDropTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      spawnPercentage: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      spawnPecentageMax: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
      },
      maxHarvestDistance: {
        type: ConfigTypes.numberType,
        visible: true,
        filterVisible: true,
        filterType: FilterTypes.decimal,
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
    dialogType: DialogConfig.fullDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 250},
      spawnPercentage: {name: 'spawnPercentage', type: FormFieldType.decimal, width: 33},
      spawnPecentageMax: {name: 'spawnPecentageMax', type: FormFieldType.decimal, width: 33},
      maxHarvestDistance: {name: 'maxHarvestDistance', type: FormFieldType.decimal, width: 33},
    },
    subForms: {
      subs: {
        title: this.translate.instant(this.tableKey + '.SUBS_PROFILE'),
        submit: this.translate.instant(this.tableKey + '.ADD_SUB_ITEM'),
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          priority: {name: 'priority', type: FormFieldType.integer, width: 50, require: true},
          priorityMax: {name: 'priorityMax', type: FormFieldType.integer, width: 50, require: true},
          skill: {
            name: 'skill',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            fieldConfig: skillFieldConfig,
            allowNew: true,
          },
          skillExp: {name: 'skillExp', type: FormFieldType.integer, width: 50},
          skillLevel: {name: 'skillLevel', type: FormFieldType.integer, width: 50},
          skillLevelMax: {name: 'skillLevelMax', type: FormFieldType.integer, width: 50},
          weaponReq: {
            name: 'weaponReq',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            fieldConfig: toolTypeFieldConfig,
            allowNew: true,
          },
          harvestCoordEffect: {
            name: 'harvestCoordEffect',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            fieldConfig: coordFieldConfig,
            allowNew: true,
          },
          activateCoordeffect: {
            name: 'activateCoordeffect',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            fieldConfig: coordFieldConfig,
            allowNew: true,
          },
          deactivateCoordeffect: {
            name: 'deactivateCoordeffect',
            type: FormFieldType.dynamicDropdown,
            width: 50,
            fieldConfig: coordFieldConfig,
            allowNew: true,
          },
          respawnTime: {name: 'respawnTime', type: FormFieldType.integer, width: 50, require: true},
          respawnTimeMax: {name: 'respawnTimeMax', type: FormFieldType.integer, width: 50, require: true},
          harvestCount: {name: 'harvestCount', type: FormFieldType.integer, width: 50},
          harvestTimeReq: {name: 'harvestTimeReq', type: FormFieldType.decimal, width: 50},
          cooldown: {name: 'cooldown', type: FormFieldType.decimal, width: 50},
          deactivationDelay: {name: 'deactivationDelay', type: FormFieldType.decimal, width: 50},
          lootCount: {name: 'lootCount', type: FormFieldType.integer, width: 50},
          ensureLoot: {name: 'ensureLoot', type: FormFieldType.boolean, width: 50},
          cursorIcon: {name: 'cursorIcon', type: FormFieldType.filePicker, acceptFolder: '', width: 100},
          selectedIcon: {name: 'selectedIcon', type: FormFieldType.filePicker, acceptFolder: '', width: 100},
        },
        subForms: {
          drops: {
            title: this.translate.instant(this.tableKey + '.DROPS'),
            submit: this.translate.instant(this.tableKey + '.ADD_DROP'),
            columnWidth: 100,
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              item: {
                name: 'item',
                type: FormFieldType.dynamicDropdown,
                fieldConfig: itemFieldConfig,
                require: true,
                allowNew: true,
              },
              min: {name: 'min', type: FormFieldType.integer, width: 50, require: true},
              max: {name: 'max', type: FormFieldType.integer, width: 50, require: true},
              chance: {name: 'chance', type: FormFieldType.integer, width: 50, require: true},
              chanceMax: {name: 'chanceMax', type: FormFieldType.integer, width: 50, require: true},
            },
          },
        },
      },
    },
  };
  private subsForm: SubFieldType = {
    id: {value: '', required: false},
    priority: {value: '', required: true, minNotEqual: 0},
    priorityMax: {value: '', required: true, minNotEqual: 0},
    skill: {value: '', required: false},
    skillLevel: {value: '', required: false, minNotEqual: 0},
    skillLevelMax: {value: '', required: false, minNotEqual: 0},
    skillExp: {value: 0, required: false, min: 0},
    weaponReq: {value: '', required: false},
    harvestCoordEffect: {value: '', required: false},
    activateCoordeffect: {value: '', required: false},
    deactivateCoordeffect: {value: '', required: false},
    respawnTime: {value: '', required: true, minNotEqual: 0},
    respawnTimeMax: {value: '', required: true, minNotEqual: 0},
    harvestCount: {value: '', required: false, minNotEqual: 0, allowMinusOne: true},
    harvestTimeReq: {value: 0, required: false, min: 0},
    cooldown: {value: 0, required: false, min: 0},
    deactivationDelay: {value: 0, required: false, min: 0},
    lootCount: {value: 0, required: false, minNotEqual: 0},
    ensureLoot: {value: 1, required: false},
    cursorIcon: {value: '', required: false},
    selectedIcon: {value: '', required: false},
    drops: {isArray: true},
  };
  private dropForm: SubFieldType = {
    id: {value: '', required: false},
    item: {value: '', required: true},
    min: {value: '', required: true, minNotEqual: 0},
    max: {value: '', required: true, minNotEqual: 0},
    chance: {value: '', required: true, minNotEqual: 0, max: 100},
    chanceMax: {value: '', required: true, minNotEqual: 0, max: 100},
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService,
    private readonly subFormService: SubFormService,
    private readonly imageService: ImageService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly handleDepService: HandleDependenciesService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find(
        (dbProfile) => dbProfile.type === DataBaseType.world_content,
      ) as DataBaseProfile;
      this.profile = profile;
      (this.formConfig.subForms as TypeMap<string, SubFormType>).subs.fields.cursorIcon.acceptFolder = profile.folder;
      (this.formConfig.subForms as TypeMap<string, SubFormType>).subs.fields.selectedIcon.acceptFolder = profile.folder;
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
        this.loadOptions();
      }
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  private loadOptions() {}

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<ResourceNodeProfile>(
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
    const form = this.createForm();
    let {item} = await this.tablesService.openDialog<ResourceNodeProfile>(formConfig, form, {
      subs: this.subsForm,
      drops: this.dropForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const items = item.subs as ResourceNodeSubProfile[];
    delete item.subs;
    item = this.defaults(item);
    const newId = await this.databaseService.insert<ResourceNodeProfile>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, items);
    this.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number): Promise<null | DropdownValue> {
    const record = await this.databaseService.queryItem<ResourceNodeProfile>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    const subsList: ResourceNodeSubProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE profileId = ${record.id}`,
    );
    const subsAll = subsList.map((sub) => sub.id) as number[];
    let {item, action} = await this.prepareForm(record, subsList, true);
    if (!item) {
      return null;
    }
    const subs = item.subs as ResourceNodeSubProfile[];
    delete item.subs;
    item = this.defaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<ResourceNodeProfile>(this.dbProfile, this.dbTable, item);
      await this.saveSubs(newId, subs.map((s) => ({...s, id: undefined})));
    } else {
      await this.databaseService.update<ResourceNodeProfile>(
        this.dbProfile,
        this.dbTable,
        item,
        'id',
        record.id as number,
      );
      await this.saveSubs(record.id as number, subs, subsAll);
      const res = await this.handleDepService.updateRelatedValue(this.tableKey, item.name, record.name);
      if (res) {
        this.tablesService.reloadActiveTabStream.next(void 0);
      }
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    this.tablesService.dialogRef = null;
    this.dropdownItemsService.getSlotNames();
    return {id: newId, value: item.name};
  }

  private defaults(item: ResourceNodeProfile): ResourceNodeProfile {
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.spawnPercentage = item.spawnPercentage || 0;
    item.spawnPecentageMax = item.spawnPecentageMax || 0;
    item.maxHarvestDistance = item.maxHarvestDistance || 0;
    item.isactive = true;
    return item;
  }

  private async subDefaults(sub: ResourceNodeSubProfile): Promise<ResourceNodeSubProfile> {
    sub.priority = sub.priority || 0;
    sub.priorityMax = sub.priorityMax || 0;
    sub.skill = sub.skill || -1;
    sub.skillLevel = sub.skillLevel || 1;
    sub.skillLevelMax = sub.skillLevelMax || 1;
    sub.skillExp = sub.skillExp || 0;
    sub.weaponReq = sub.weaponReq || '';
    sub.equipped = sub.equipped || false;
    sub.harvestCoordEffect = sub.harvestCoordEffect || '';
    sub.activateCoordeffect = sub.activateCoordeffect || '';
    sub.deactivateCoordeffect = sub.deactivateCoordeffect || '';
    sub.harvestCount = sub.harvestCount || -1;
    sub.harvestTimeReq = sub.harvestTimeReq || 0;
    sub.cooldown = sub.cooldown || 0;
    sub.deactivationDelay = sub.deactivationDelay || 0;
    sub.cursorIcon2 = await this.imageService.parseImage(this.profile, sub.cursorIcon);
    sub.selectedIcon2 = await this.imageService.parseImage(this.profile, sub.selectedIcon);
    if (!sub.cursorIcon) {
      sub.cursorIcon = this.profile.defaultImage;
    }
    if (!sub.selectedIcon) {
      sub.selectedIcon = this.profile.defaultImage;
    }
    sub.updatetimestamp = this.databaseService.getTimestampNow();
    return sub;
  }

  private async saveSubs(id: number, subs: ResourceNodeSubProfile[], subsAll: number[] = []): Promise<void> {
    for (let sub of subs) {
      sub = await this.subDefaults(sub);
      sub.profileId = id;
      let dropsList: ResourceDrop[] = [];
      if (sub.id) {
        dropsList = await this.databaseService.customQuery(
          this.dbProfile,
          `SELECT * FROM ${this.dbTableDrop} WHERE isactive = 1 and resourceSubProfileId = ${sub.id}`,
        );
      }
      const dropsAll = dropsList.map((drop) => drop.id) as number[];
      let drops = sub.drops as ResourceDrop[];
      delete sub.drops;
      let subId;
      if (sub.id) {
        subId = sub.id;
        subsAll.splice(subsAll.indexOf(sub.id), 1);
        await this.databaseService.update<ResourceNodeSubProfile>(this.dbProfile, this.dbTableSub, sub, 'id', sub.id);
      } else {
        delete sub.id;
        drops = drops.map((dropItem) => {
          delete dropItem.id;
          return dropItem;
        });
        sub.creationtimestamp = this.databaseService.getTimestampNow();
        subId = await this.databaseService.insert<ResourceNodeSubProfile>(this.dbProfile, this.dbTableSub, sub, false);
      }
      await this.saveSubSubs(subId, drops, dropsAll);
    }
    if (subsAll.length > 0) {
      for (const subsId of subsAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableSub, 'id', subsId, false);
        await this.databaseService.customQuery(
          this.dbProfile,
          `DELETE FROM ${this.dbTableDrop} WHERE resourceSubProfileId = ?`,
          [subsId],
          true,
        );
      }
    }
  }

  private async saveSubSubs(id: number, drops: ResourceDrop[] = [], dropsAll: number[] = []): Promise<void> {
    for (const drop of drops) {
      drop.resourceSubProfileId = id;
      drop.item = drop.item || -1;
      drop.min = drop.min || -1;
      drop.max = drop.max || -1;
      drop.chance = drop.chance || -1;
      drop.chanceMax = drop.chanceMax || -1;
      drop.updatetimestamp = this.databaseService.getTimestampNow();
      if (drop.id) {
        if (dropsAll.indexOf(drop.id) !== -1) {
          dropsAll.splice(dropsAll.indexOf(drop.id), 1);
        }
        await this.databaseService.update<ResourceDrop>(this.dbProfile, this.dbTableDrop, drop, 'id', drop.id);
      } else {
        drop.isactive = true;
        drop.creationtimestamp = this.databaseService.getTimestampNow();
        delete drop.id;
        await this.databaseService.insert<ResourceDrop>(this.dbProfile, this.dbTableDrop, drop, false);
      }
    }
    if (dropsAll.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${this.dbTableDrop} WHERE id IN (${dropsAll.join(', ')})`,
        [],
        true,
      );
    }
  }

  private async prepareForm(
    record: ResourceNodeProfile,
    subs: ResourceNodeSubProfile[] = [],
    updateMode = false,
  ): Promise<{item: ResourceNodeProfile | undefined, action: DialogCloseType}> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(record);
    for (const sub of subs) {
      const drops: ResourceDrop[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableDrop} WHERE isactive = 1 and resourceSubProfileId = ${sub.id}`,
      );
      (form.get('subs') as FormArray).push(
        this.subFormService.buildSubForm<ResourceNodeSubProfile, any>(
          {...this.subsForm},
          sub,
          {...this.dropForm},
          drops,
        ),
      );
    }
    formConfig.saveAsNew = updateMode;
    const {item, action} = await this.tablesService.openDialog<ResourceNodeProfile>(formConfig, form, {
      subs: this.subsForm,
      drops: this.dropForm,
    });
    if (!item) {
      this.resetForm(form);
      this.tablesService.dialogRef = null;
      return {item: undefined, action};
    }
    this.resetForm(form);
    return {item, action};
  }

  public async duplicateItem(id: number): Promise<number> {
    const duplicatedRecord = await this.databaseService.queryItem<ResourceNodeProfile>(
      this.dbProfile,
      this.dbTable,
      'id',
      id,
    );
    const record = {...duplicatedRecord};
    delete record.id;
    record.name = record.name + ' (1)';
    const subsList: ResourceNodeSubProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE profileId = ${id}`,
    );
    let {item} = await this.prepareForm(record, subsList);
    if (!item) {
      return 0;
    }
    let subs = item.subs as ResourceNodeSubProfile[];
    delete item.subs;
    item = this.defaults(item);
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const newId = await this.databaseService.insert<ResourceNodeProfile>(this.dbProfile, this.dbTable, item, false);
    subs = subs.map((itemTmp) => {
      delete itemTmp.id;
      return itemTmp;
    });
    await this.saveSubs(newId, subs);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    this.dropdownItemsService.getSlotNames();
    return newId;
  }

  public async previewItems(id: number): Promise<void> {
    const subs_profile: any[] = [];
    const list: ResourceNodeSubProfile[] = await this.databaseService.customQuery(
      this.dbProfile,
      `SELECT * FROM ${this.dbTableSub} WHERE profileId = ?`,
      [id],
      false,
    );
    for (const item of list) {
      const skill = item.skill > 0 ? await this.dropdownItemsService.getSkill(item.skill) : undefined;
      const drops = [];

      const dropsList: ResourceDrop[] = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT * FROM ${this.dbTableDrop} WHERE isactive = 1 and resourceSubProfileId = ${item.id}`,
      );

      for (const drop of dropsList) {
        const dropItem = drop.item ? await this.dropdownItemsService.getItem(drop.item) : undefined;
        drops.push({
          id: drop.id,
          item: dropItem?.value || '',
          min: drop.min,
          max: drop.max,
          chance: drop.chance,
          chanceMax: drop.chanceMax,
        });
      }
      subs_profile.push({
        id: item.id,
        priority: item.priority,
        priorityMax: item.priorityMax,
        skill: skill?.value || '',
        skillLevel: item.skillLevel,
        skillLevelMax: item.skillLevelMax,
        skillExp: item.skillExp,
        weaponReq: item.weaponReq,
        equipped: item.equipped,
        harvestCoordEffect: item.harvestCoordEffect,
        activateCoordeffect: item.activateCoordeffect,
        deactivateCoordeffect: item.deactivateCoordeffect,
        respawnTime: item.respawnTime,
        respawnTimeMax: item.respawnTimeMax,
        harvestCount: item.harvestCount,
        harvestTimeReq: item.harvestTimeReq,
        cooldown: item.cooldown,
        deactivationDelay: item.deactivationDelay,
        cursorIcon: item.cursorIcon,
        selectedIcon: item.selectedIcon,
        subs: drops,
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {subs_profile}},
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

  private resetForm(form: FormGroup): void {
    form.reset();
    (form.get('subs') as FormArray).clear();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      spawnPercentage: [0, [Validators.min(0), Validators.max(100)]],
      spawnPecentageMax: [0, [Validators.min(0), Validators.max(100)]],
      maxHarvestDistance: [0, minNotEqualValidator(0)],
      subs: new FormArray([]),
    });
    form.controls.spawnPercentage.valueChanges.pipe(takeUntil(this.destroyer)).subscribe((value) => {
      value = +value;
      if (!value) {
        value = 0;
      }
      form.controls.spawnPecentageMax.setValidators([Validators.min(value), Validators.max(100)]);
      form.controls.spawnPecentageMax.updateValueAndValidity();
    });
    return form;
  }
}
