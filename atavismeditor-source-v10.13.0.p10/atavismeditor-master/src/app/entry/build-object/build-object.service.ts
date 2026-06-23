import {Injectable} from '@angular/core';
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
import {DatabaseService} from '../../services/database.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {DataBaseProfile, DataBaseType, Profile} from '../../settings/profiles/profile';
import {ConfigTypes, DropdownValue, FilterTypes, SubFieldType} from '../../models/configRow.interface';
import {ActionsIcons, ActionsNames, ActionsTypes} from '../../models/actions.interface';
import {TabTypes} from '../../models/tabTypes.enum';
import {ProfilesService} from '../../settings/profiles/profiles.service';
import {TranslateService} from '@ngx-translate/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TablesService} from '../../services/tables.service';
import {OptionChoicesService} from '../option-choices/option-choices.service';
import {NotificationService} from '../../services/notification.service';
import {DropdownItemsService} from '../dropdown-items.service';
import {
  buildObjectStageDamagedTable,
  buildObjectStageItemsTable,
  buildObjectStageProgressTable,
  buildObjectStageTable,
  buildObjectTable,
} from '../tables.data';
import {distinctPipe, getProfilePipe, Utils} from '../../directives/utils';
import {ImageService} from '../../components/image/image.service';
import {SubFormService} from '../sub-form.service';
import {
  buildingCategoryFieldConfig,
  buildObjectCategoryFieldConfig,
  claimObjectInteractionTypeFieldConfig,
  claimTypeFieldConfig,
  effectFieldConfig,
  instanceAllFieldConfig,
  itemFieldConfig,
  lootTableFieldConfig,
  mobSpawnFieldConfig,
  skillFieldConfig,
  weaponTypeFieldConfig,
} from '../dropdown.config';
import {takeUntil} from 'rxjs/operators';
import {
  BuildObject,
  BuildObjectStage,
  BuildObjectStageDamaged,
  BuildObjectStageItems,
  BuildObjectStageProgress,
  defaultValues,
  InteractionTypes,
} from './build-object.data';

@Injectable({
  providedIn: 'root',
})
export class BuildObjectService {
  public tableKey = TabTypes.BUILD_OBJECT;
  private readonly listStream = new BehaviorSubject<BuildObject[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = buildObjectTable;
  public dbTableStage = buildObjectStageTable;
  private stagesForm: SubFieldType = {
    id: {value: '', required: false},
    buildTimeReq: {value: '', required: false, min: 0},
    repairTimeReq: {value: '', required: false, min: 0},
    interactionType: {value: '', required: false},
    interactionID: {value: '', required: false},
    interactionIDChest: {value: '', required: false},
    interactionData1: {value: 'spawn', required: false},
    health: {value: '', required: false, min: 0},
    lootTable: {value: '', required: false},
    lootMinPercentage: {value: '', required: false, min: 0, max: 100},
    lootMaxPercentage: {value: '', required: false, min: 0, max: 100},
    items: {isArray: true},
    progresses: {isArray: true},
    damages: {isArray: true},
  };
  private itemForm: SubFieldType = {
    id: {value: '', required: false},
    item: {value: -1, required: true},
    count: {value: 0, required: true, min: 0},
  };
  private progressForm: SubFieldType = {
    id: {value: '', required: false},
    progress: {value: 1, required: true, min: 0, max: 100},
    prefab: {value: '', required: true},
  };
  private damageForm: SubFieldType = {
    id: {value: '', required: false},
    progress: {value: '', required: true, min: 1, max: 99},
    prefab: {value: '', required: true},
  };
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    showPreview: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
      icon: {type: ConfigTypes.icon, iconFolder: '', visible: true, useAsSearch: true},
      skill: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dynamicDropdown,
        fieldConfig: skillFieldConfig,
        filterVisible: true,
        data: [],
      },
      skillLevelReq: {
        type: ConfigTypes.numberType,
        visible: true,
        filterType: FilterTypes.integer,
        filterVisible: true,
      },
      category: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: [],
      },
      weaponReq: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: [],
      },
      distanceReq: {type: ConfigTypes.numberType, visible: true, filterType: FilterTypes.integer, filterVisible: true},
      buildTaskReqPlayer: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      availableFromItemOnly: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      buildSolo: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      fixedTime: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      claim_object_category: {
        type: ConfigTypes.dropdown,
        visible: true,
        filterType: FilterTypes.dropdown,
        filterVisible: true,
        data: [],
      },
      attackable: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
        filterVisible: true,
      },
      repairable: {
        type: ConfigTypes.booleanType,
        visible: true,
        filterType: FilterTypes.booleanType,
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
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public formConfig: FormConfig = {
    type: this.tableKey,
    dialogType: DialogConfig.fullDialogOverlay,
    title: this.translate.instant(this.tableKey + '.ADD_TITLE'),
    fields: {
      name: {name: 'name', type: FormFieldType.input, require: true, length: 44, width: 50},
      icon: {name: 'icon', type: FormFieldType.filePicker, acceptFolder: '', length: 255, width: 50},
      skill: {
        name: 'skill',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        allowNew: true,
        fieldConfig: skillFieldConfig,
      },
      skillLevelReq: {name: 'skillLevelReq', type: FormFieldType.integer, width: 25},
      category: {
        name: 'category',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        fieldConfig: buildingCategoryFieldConfig,
        width: 25,
      },
      weaponReq: {
        name: 'weaponReq',
        type: FormFieldType.dynamicDropdown,
        allowNew: true,
        width: 25,
        search: true,
        fieldConfig: weaponTypeFieldConfig,
      },
      distanceReq: {name: 'distanceReq', type: FormFieldType.integer, width: 25},
      buildTaskReqPlayer: {name: 'buildTaskReqPlayer', type: FormFieldType.boolean, width: 25},
      validClaimType: {
        name: 'validClaimType',
        type: FormFieldType.dynamicDropdown,
        width: 25,
        multiple: true,
        require: true,
        hideNone: true,
        allowNew: true,
        fieldConfig: claimTypeFieldConfig,
      },
      availableFromItemOnly: {name: 'availableFromItemOnly', type: FormFieldType.boolean, width: 25},
      buildSolo: {name: 'buildSolo', type: FormFieldType.boolean, width: 25},
      fixedTime: {name: 'fixedTime', type: FormFieldType.boolean, width: 25},
      attackable: {name: 'attackable', type: FormFieldType.boolean, width: 25},
      repairable: {name: 'repairable', type: FormFieldType.boolean, width: 25},
      claim_object_category: {
        name: 'claim_object_category',
        type: FormFieldType.dynamicDropdown,
        width: 50,
        allowNew: true,
        search: true,
        fieldConfig: buildObjectCategoryFieldConfig,
      },
    },
    subForms: {
      stages: {
        title: this.translate.instant(this.tableKey + '.STAGE'),
        submit: this.translate.instant(this.tableKey + '.ADD_STAGE'),
        numerate: true,
        minCount: 1,
        fields: {
          id: {name: 'id', label: '', type: FormFieldType.hidden},
          buildTimeReq: {name: 'buildTimeReq', type: FormFieldType.integer, width: 50},
          repairTimeReq: {name: 'repairTimeReq', type: FormFieldType.integer, width: 50},
          interactionType: {
            name: 'interactionType',
            type: FormFieldType.dropdown,
            fieldConfig: claimObjectInteractionTypeFieldConfig,
            data: [],
            width: 50,
          },
          interactionID: {
            name: 'interactionID',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            require: false,
            disabled: true,
            width: -1,
            label: ' ',
            tooltip: ' ',
            conditionName: 'interactionType',
            condition: {
              interactionType: {
                [InteractionTypes.Chest]: {
                  label: ' ',
                  tooltip: ' ',
                  disabled: true,
                  require: false,
                  width: -1,
                  fieldConfig: null,
                },
                [InteractionTypes.Resource]: {
                  label: this.translate.instant(this.tableKey + '.LOOT_TABLE'),
                  tooltip: this.translate.instant(this.tableKey + '.LOOT_TABLE_HELP'),
                  require: true,
                  fieldConfig: lootTableFieldConfig,
                  disabled: false,
                  width: 50,
                },
                [InteractionTypes.NPC]: {
                  label: this.translate.instant(this.tableKey + '.MOB_TEMPLATE'),
                  tooltip: this.translate.instant(this.tableKey + '.MOB_TEMPLATE_HELP'),
                  require: true,
                  fieldConfig: mobSpawnFieldConfig,
                  disabled: false,
                  width: 50,
                },
                [InteractionTypes.Effect]: {
                  label: this.translate.instant(this.tableKey + '.EFFECT'),
                  tooltip: this.translate.instant(this.tableKey + '.EFFECT_HELP'),
                  require: true,
                  fieldConfig: effectFieldConfig,
                  disabled: false,
                  width: 50,
                },
                [InteractionTypes.Instance]: {
                  label: this.translate.instant(this.tableKey + '.INSTANCE'),
                  tooltip: this.translate.instant(this.tableKey + '.INSTANCE_HELP'),
                  require: true,
                  fieldConfig: instanceAllFieldConfig,
                  disabled: false,
                  width: 50,
                },
                [InteractionTypes.LeaveInstance]: {
                  label: ' ',
                  tooltip: ' ',
                  disabled: true,
                  width: -1,
                },
              },
            },
          },
          interactionIDChest: {
            name: 'interactionIDChest',
            type: FormFieldType.integer,
            require: false,
            disabled: true,
            width: -1,
            label: ' ',
            tooltip: ' ',
            conditionName: 'interactionType',
            condition: {
              interactionType: {
                [InteractionTypes.Chest]: {
                  label: this.translate.instant(this.tableKey + '.NUMBER_OF_SLOTS'),
                  tooltip: this.translate.instant(this.tableKey + '.NUMBER_OF_SLOTS_HELP'),
                  disabled: false,
                  width: 50,
                },
                [InteractionTypes.Resource]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.NPC]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.Effect]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.Instance]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.LeaveInstance]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
              },
            },
          },
          interactionData1: {
            name: 'interactionData1',
            type: FormFieldType.input,
            require: false,
            disabled: true,
            width: -1,
            conditionName: 'interactionType',
            condition: {
              interactionType: {
                [InteractionTypes.Resource]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.NPC]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.Effect]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.Chest]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.LeaveInstance]: {label: ' ', tooltip: ' ', disabled: true, width: -1},
                [InteractionTypes.Instance]: {
                  label: this.translate.instant(this.tableKey + '.INSTANCE_SPAWNER'),
                  tooltip: this.translate.instant(this.tableKey + '.INSTANCE_SPAWNER_HELP'),
                  disabled: false,
                  width: 100,
                  require: true,
                },
              },
            },
          },
          title2: {name: '', label: ' ', type: FormFieldType.title},
          health: {name: 'health', type: FormFieldType.integer, width: 50},
          lootTable: {
            name: 'lootTable',
            type: FormFieldType.dynamicDropdown,
            allowNew: true,
            fieldConfig: lootTableFieldConfig,
            width: 50,
          },
          title3: {name: '', label: ' ', type: FormFieldType.title},
          lootMinPercentage: {name: 'lootMinPercentage', type: FormFieldType.decimal, width: 50},
          lootMaxPercentage: {name: 'lootMaxPercentage', type: FormFieldType.decimal, width: 50},
        },
        subForms: {
          items: {
            title: this.translate.instant(this.tableKey + '.ITEMS_REQUIRED'),
            submit: this.translate.instant(this.tableKey + '.ADD_ITEM'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              item: {
                name: 'item',
                width: 50,
                allowNew: true,
                require: true,
                fieldConfig: itemFieldConfig,
                type: FormFieldType.dynamicDropdown,
              },
              count: {
                name: 'count',
                require: true,
                type: FormFieldType.integer,
                width: 50,
              },
            },
          },
          progresses: {
            title: this.translate.instant(this.tableKey + '.PROGRESSES'),
            submit: this.translate.instant(this.tableKey + '.ADD_PROGRESS'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              progress: {
                name: 'progress',
                type: FormFieldType.integer,
                require: true,
                width: 15,
              },
              prefab: {
                name: 'prefab',
                type: FormFieldType.file,
                acceptFolder: '',
                require: true,
                acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
                accept: 'prefab',
                length: 1000,
                width: 85,
              },
            },
          },
          damages: {
            title: this.translate.instant(this.tableKey + '.DAMAGES'),
            submit: this.translate.instant(this.tableKey + '.ADD_DAMAGE'),
            fields: {
              id: {name: 'id', label: '', type: FormFieldType.hidden},
              progress: {
                name: 'progress',
                require: true,
                type: FormFieldType.integer,
                width: 15,
              },
              prefab: {
                name: 'prefab',
                type: FormFieldType.file,
                acceptFolder: '',
                require: true,
                acceptTitle: this.translate.instant('FILE_TYPE.PREFAB'),
                accept: 'prefab',
                length: 1000,
                width: 85,
              },
            },
          },
        },
      },
    },
  };
  private itemsList: DropdownValue[] = [];
  private profile!: Profile;
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly tablesService: TablesService,
    private readonly optionChoicesService: OptionChoicesService,
    private readonly notificationService: NotificationService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly imageService: ImageService,
    private readonly subFormService: SubFormService,
  ) {}

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      this.tableConfig.fields.icon.iconFolder = profile.folder;
      this.formConfig.fields.icon.acceptFolder = profile.folder;
      const step1 = (this.formConfig.subForms as TypeMap<string, SubFormType>).stages.subForms as TypeMap<
        string,
        SubFormType
      >;
      step1.progresses.fields.prefab.acceptFolder = profile.folder + profile.buildObjectFolder;
      step1.damages.fields.prefab.acceptFolder = profile.folder + profile.buildObjectFolder;
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
    this.dropdownItemsService.skills.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.tableConfig.fields.skill.data = list;
    });
    this.dropdownItemsService.items.pipe(distinctPipe(this.destroyer)).subscribe((list) => {
      this.itemsList = list;
    });
    this.optionChoicesService.optionsUpdated.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptionChoices();
    });
    this.tablesService.reloadActiveTab.pipe(takeUntil(this.destroyer)).subscribe(() => {
      this.loadOptions();
    });
  }

  public async loadOptionChoices(): Promise<void> {
    this.tableConfig.fields.category.data = await this.optionChoicesService.getOptionsByType('Building Category');
    this.tableConfig.fields.weaponReq.data = await this.optionChoicesService.getOptionsByType('Weapon Type', true);
    this.tableConfig.fields.claim_object_category.data = await this.optionChoicesService.getOptionsByType(
      'Claim Object Category',
    );
    (this.formConfig.subForms as TypeMap<string, SubFormType>).stages.fields.interactionType.data =
      await this.optionChoicesService.getOptionsByType('Claim Object Interaction Type', true);
  }

  private async loadOptions() {
    await this.loadOptionChoices();
    await this.dropdownItemsService.getItems();
    await this.dropdownItemsService.getSkills();
  }

  public async addItem(): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.ADD_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.SAVE');
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    form.patchValue(defaultValues);
    const subForm = new FormGroup({});
    Object.keys(this.stagesForm).forEach((key) => {
      if (this.stagesForm[key].isArray) {
        subForm.addControl(key, new FormArray([]));
        if (key === 'progresses') {
          for (let i = 1; i <= 2; i++) {
            const subSubForm = new FormGroup({});
            Object.keys(this.progressForm).forEach((subKey) => {
              if (subKey === 'progress') {
                subSubForm.addControl(subKey, new FormControl(i === 1 ? 0 : 100));
              } else {
                subSubForm.addControl(subKey, new FormControl(''));
              }
            });
            (subForm.get(key) as FormArray).push(subSubForm);
          }
        }
      } else {
        const validators = [];
        if (this.stagesForm[key].required) {
          validators.push(Validators.required);
        }
        if (this.stagesForm[key].min !== undefined) {
          validators.push(Validators.min(this.stagesForm[key].min as number));
        }
        if (this.stagesForm[key].max !== undefined) {
          validators.push(Validators.max(this.stagesForm[key].max as number));
        }
        subForm.addControl(key, new FormControl(this.stagesForm[key].value, validators));
      }
    });
    (form.get('stages') as FormArray).push(subForm);
    let {item} = await this.tablesService.openDialog<BuildObject>(formConfig, form, {
      stages: this.stagesForm,
      progresses: this.progressForm,
      items: this.itemForm,
      damages: this.damageForm,
    });
    if (!item) {
      BuildObjectService.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    const stages = item.stages as BuildObjectStage[];
    delete item.stages;
    item = await this.defaults(item);
    const newId = await this.databaseService.insert<BuildObject>(this.dbProfile, this.dbTable, item);
    await this.saveSubs(newId, stages, []);
    BuildObjectService.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async updateItem(id: number | string): Promise<null | DropdownValue> {
    this.formConfig.title = this.translate.instant(this.tableKey + '.EDIT_TITLE');
    this.formConfig.submit = this.translate.instant('ACTIONS.UPDATE');
    const record = await this.databaseService.queryItem<BuildObject>(this.dbProfile, this.dbTable, 'id', id);
    if (!record) {
      return null;
    }
    let stages: BuildObjectStage[] = [];
    if (record.firstStageID) {
      stages = await this.getAllStages(record.firstStageID, []);
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    const stagesAll: number[] = [];
    const itemsAll: Record<number, number[]> = [];
    const progressesAll: Record<number, number[]> = [];
    const damagesAll: Record<number, number[]> = [];
    for (const stage of stages) {
      itemsAll[stage.id as number] = [];
      progressesAll[stage.id as number] = [];
      damagesAll[stage.id as number] = [];
      stagesAll.push(stage.id as number);
      if (stage.interactionType === InteractionTypes.Chest) {
        stage.interactionIDChest = stage.interactionID;
        stage.interactionID = 0;
      }
      if (stage.interactionType !== InteractionTypes.Instance) {
        stage.interactionData1 = '';
      }
      const items = await this.getSubSubs<BuildObjectStageItems>(stage.id as number, buildObjectStageItemsTable);
      const progresses = await this.getSubSubs<BuildObjectStageProgress>(
        stage.id as number,
        buildObjectStageProgressTable,
      );
      const damages = await this.getSubSubs<BuildObjectStageDamaged>(stage.id as number, buildObjectStageDamagedTable);
      if (progresses.length > 0) {
        progresses.sort((a, b) => a.progress - b.progress);
      }
      if (damages.length > 0) {
        damages.sort((a, b) => a.progress - b.progress);
      }
      const subForm = new FormGroup({});
      Object.keys(this.stagesForm).forEach((key) => {
        if (!this.stagesForm[key].isArray) {
          subForm.addControl(
            key,
            this.subFormService.prepareSubFormControl<BuildObjectStage>(this.stagesForm, stage, key),
          );
        } else if (this.stagesForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          if (key === 'items') {
            for (const itemField of items) {
              itemsAll[stage.id as number].push(itemField.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.itemForm).forEach((itemKey) => {
                subSubForm.addControl(
                  itemKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageItems>(this.itemForm, itemField, itemKey),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'progresses') {
            for (const progress of progresses) {
              progressesAll[stage.id as number].push(progress.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.progressForm).forEach((progressKey) => {
                subSubForm.addControl(
                  progressKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageProgress>(
                    this.progressForm,
                    progress,
                    progressKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'damages') {
            for (const damage of damages) {
              damagesAll[stage.id as number].push(damage.id as number);
              const subSubForm = new FormGroup({});
              Object.keys(this.damageForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageDamaged>(
                    this.damageForm,
                    damage,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          }
        }
      });
      (form.get('stages') as FormArray).push(subForm);
    }
    form.patchValue(record);
    formConfig.saveAsNew = true;
    let {item, action} = await this.tablesService.openDialog<BuildObject>(formConfig, form, {
      stages: this.stagesForm,
      progresses: this.progressForm,
      items: this.itemForm,
      damages: this.damageForm,
    });
    if (!item) {
      BuildObjectService.resetForm(form);
      this.tablesService.dialogRef = null;
      return null;
    }
    let itemStages = item.stages as BuildObjectStage[];
    delete item.stages;
    item = await this.defaults(item);
    let newId = record.id;
    if (action === DialogCloseType.save_as_new) {
      delete item.id;
      item.isactive = true;
      item.creationtimestamp = this.databaseService.getTimestampNow();
      newId = await this.databaseService.insert<BuildObject>(this.dbProfile, this.dbTable, item);
      itemStages = itemStages.map((s) => {
        const {id, ...st} = s;
        st.items = st.items.map((it) => ({...it, id: undefined}));
        st.damages = st.damages.map((it) => ({...it, id: undefined}));
        st.progresses = st.progresses.map((it) => ({...it, id: undefined}));
        return st;
      })
      await this.saveSubs(newId, itemStages, []);
    } else {
      await this.databaseService.update<BuildObject>(this.dbProfile, this.dbTable, item, 'id', record.id as number);
      await this.saveSubs(record.id as number, itemStages, stagesAll, itemsAll, progressesAll, damagesAll);
      this.notificationService.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    BuildObjectService.resetForm(form);
    this.tablesService.dialogRef = null;
    return {id: newId, value: item.name};
  }

  public async getAllStages(id: number, list: BuildObjectStage[]): Promise<BuildObjectStage[]> {
    const record = await this.databaseService.queryItem<BuildObjectStage>(this.dbProfile, this.dbTableStage, 'id', id);
    if (record && record.isactive) {
      list.push(record);
      if (record.nextStage > 0) {
        list = await this.getAllStages(record.nextStage, list);
      }
    }
    return list;
  }

  public async duplicateItem(recordId: number): Promise<boolean> {
    const boRecord = await this.databaseService.queryItem<BuildObject>(this.dbProfile, this.dbTable, 'id', recordId);
    const record = {...boRecord};
    record.name += ' (1)';
    const stagesList = [];
    let stages: BuildObjectStage[] = [];
    if (record.firstStageID) {
      stages = await this.getAllStages(record.firstStageID, []);
    }
    const formConfig = JSON.parse(JSON.stringify(this.formConfig));
    const form = this.createForm();
    for (const stageItem of stages) {
      const stage = {...stageItem};
      delete stage.id;
      stagesList.push(stage);
      if (stage.interactionType === InteractionTypes.Chest) {
        stage.interactionIDChest = stage.interactionID;
        stage.interactionID = 0;
      }
      if (stage.interactionType !== InteractionTypes.Instance) {
        stage.interactionData1 = '';
      }

      const items = await this.getSubSubs<BuildObjectStageItems>(stageItem.id as number, buildObjectStageItemsTable);
      const progresses = await this.getSubSubs<BuildObjectStageProgress>(
        stageItem.id as number,
        buildObjectStageProgressTable,
      );
      const damages = await this.getSubSubs<BuildObjectStageDamaged>(
        stageItem.id as number,
        buildObjectStageDamagedTable,
      );
      const subForm = new FormGroup({});
      Object.keys(this.stagesForm).forEach((key) => {
        if (!this.stagesForm[key].isArray) {
          subForm.addControl(
            key,
            this.subFormService.prepareSubFormControl<BuildObjectStage>(this.stagesForm, stage, key),
          );
        } else if (this.stagesForm[key].isArray) {
          subForm.addControl(key, new FormArray([]));
          if (key === 'items') {
            for (const itemField of [...items]) {
              const {id, stage_id, ...newItem} = itemField;
              const subSubForm = new FormGroup({});
              Object.keys(this.itemForm).forEach((itemKey) => {
                subSubForm.addControl(
                  itemKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageItems>(this.itemForm, newItem, itemKey),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'progresses') {
            for (const progressTmp of progresses) {
              const {id, stage_id, ...progress} = progressTmp;
              const subSubForm = new FormGroup({});
              Object.keys(this.progressForm).forEach((progressKey) => {
                subSubForm.addControl(
                  progressKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageProgress>(
                    this.progressForm,
                    progress,
                    progressKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          } else if (key === 'damages') {
            for (const damageTmp of damages) {
              const {id, stage_id, ...damage} = damageTmp;
              const subSubForm = new FormGroup({});
              Object.keys(this.damageForm).forEach((damageKey) => {
                subSubForm.addControl(
                  damageKey,
                  this.subFormService.prepareSubFormControl<BuildObjectStageDamaged>(
                    this.damageForm,
                    damage,
                    damageKey,
                  ),
                );
              });
              (subForm.get(key) as FormArray).push(subSubForm);
            }
          }
        }
      });
      (form.get('stages') as FormArray).push(subForm);
    }
    form.patchValue(record);
    let {item} = await this.tablesService.openDialog<BuildObject>(formConfig, form, {
      stages: this.stagesForm,
      progresses: this.progressForm,
      items: this.itemForm,
      damages: this.damageForm,
    });
    if (!item) {
      BuildObjectService.resetForm(form);
      this.tablesService.dialogRef = null;
      return false;
    }
    const allStages = item.stages as BuildObjectStage[];
    delete item.stages;
    item.isactive = true;
    item.creationtimestamp = this.databaseService.getTimestampNow();
    item = await this.defaults(item);
    const newId = await this.databaseService.insert<BuildObject>(this.dbProfile, this.dbTable, item, false);
    await this.saveSubs(newId, allStages, []);
    this.notificationService.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return true;
  }

  private async saveSubs(
    recordId: number,
    stages: BuildObjectStage[],
    stagesAll: number[] = [],
    itemsAll: Record<number, number[]> = {},
    progressesAll: Record<number, number[]> = {},
    damagesAll: Record<number, number[]> = {},
  ) {
    let isFirst = true;
    let prevId = null;
    for (let stage of stages) {
      stage.isactive = true;
      stage.nextStage = -1;
      let itemId = stage.id;
      stage = this.subDefaults(stage);
      const items = stage.items as BuildObjectStageItems[];
      const progresses = stage.progresses as BuildObjectStageProgress[];
      const damages = stage.damages as BuildObjectStageDamaged[];
      delete stage.items;
      delete stage.progresses;
      delete stage.damages;
      if (stage.id) {
        stagesAll.splice(stagesAll.indexOf(stage.id), 1);
        await this.databaseService.update<BuildObjectStage>(this.dbProfile, this.dbTableStage, stage, 'id', stage.id);
      } else {
        stage.creationtimestamp = this.databaseService.getTimestampNow();
        delete stage.id;
        itemId = await this.databaseService.insert<BuildObjectStage>(this.dbProfile, this.dbTableStage, stage, false);
      }
      if (isFirst) {
        prevId = itemId;
        await this.databaseService.update<BuildObject>(
          this.dbProfile,
          this.dbTable,
          {firstStageID: itemId, updatetimestamp: this.databaseService.getTimestampNow()} as BuildObject,
          'id',
          recordId,
        );
        isFirst = false;
      } else {
        await this.databaseService.update<BuildObjectStage>(
          this.dbProfile,
          this.dbTableStage,
          {nextStage: itemId, updatetimestamp: this.databaseService.getTimestampNow()} as BuildObjectStage,
          'id',
          prevId as number,
        );
        prevId = itemId;
      }
      await this.saveSubSubs(
        itemId as number,
        items,
        progresses,
        damages,
        itemsAll[itemId as number] ?? [],
        progressesAll[itemId as number] ?? [],
        damagesAll[itemId as number] ?? [],
      );
    }
    if (stagesAll.length > 0) {
      for (const itemId of stagesAll) {
        await this.databaseService.delete(this.dbProfile, this.dbTableStage, 'id', itemId, false);
      }
    }
  }

  private async saveSubSubs(
    stageId: number,
    items: BuildObjectStageItems[],
    processes: BuildObjectStageProgress[],
    damages: BuildObjectStageDamaged[],
    itemsAll: number[],
    processesAll: number[],
    damagesAll: number[],
  ) {
    if (items.length > 0) {
      for (const item of items) {
        if (item.id && itemsAll.indexOf(item.id) !== -1) {
          itemsAll.splice(itemsAll.indexOf(item.id), 1);
        }
        await this.saveSubSubRecord<BuildObjectStageItems>(stageId, item, buildObjectStageItemsTable);
      }
    }
    await this.removeSubSubs(buildObjectStageItemsTable, itemsAll);
    if (processes.length > 0) {
      for (const progress of processes) {
        if (progress.id && processesAll.indexOf(progress.id) !== -1) {
          processesAll.splice(processesAll.indexOf(progress.id), 1);
        }
        await this.saveSubSubRecord<BuildObjectStageProgress>(stageId, progress, buildObjectStageProgressTable);
      }
    }
    await this.removeSubSubs(buildObjectStageProgressTable, processesAll);
    if (damages.length > 0) {
      for (const damage of damages) {
        if (damage.id && damagesAll.indexOf(damage.id) !== -1) {
          damagesAll.splice(damagesAll.indexOf(damage.id), 1);
        }
        await this.saveSubSubRecord<BuildObjectStageDamaged>(stageId, damage, buildObjectStageDamagedTable);
      }
    }
    await this.removeSubSubs(buildObjectStageDamagedTable, damagesAll);
  }

  private async saveSubSubRecord<T extends {id?: number; stage_id?: number}>(
    stageId: number,
    record: T,
    table: string,
  ) {
    record.stage_id = stageId;
    if (record.id) {
      await this.databaseService.update<T>(this.dbProfile, table, record, 'id', record.id);
    } else {
      delete record.id;
      await this.databaseService.insert<T>(this.dbProfile, table, record, false);
    }
  }

  private async removeSubSubs(table: string, list: number[]): Promise<void> {
    if (list && list.length > 0) {
      await this.databaseService.customQuery(
        this.dbProfile,
        `DELETE FROM ${table} WHERE id IN (${list.join(', ')})`,
        [],
        true,
      );
    }
  }

  public async previewItems(id: number): Promise<void> {
    const record = await this.databaseService.queryItem<BuildObject>(this.dbProfile, this.dbTable, 'id', id);
    let stagesList: BuildObjectStage[] = [];
    if (record.firstStageID) {
      stagesList = await this.getAllStages(record.firstStageID, []);
    }
    const stages = [];
    for (const stage of stagesList) {
      const items = await this.getSubSubs<BuildObjectStageItems>(stage.id as number, buildObjectStageItemsTable);
      const progresses = await this.getSubSubs<BuildObjectStageProgress>(
        stage.id as number,
        buildObjectStageProgressTable,
      );
      const damages = await this.getSubSubs<BuildObjectStageDamaged>(stage.id as number, buildObjectStageDamagedTable);
      if (progresses.length > 0) {
        progresses.sort((a, b) => a.progress - b.progress);
      }
      if (damages.length > 0) {
        damages.sort((a, b) => a.progress - b.progress);
      }
      const lootItem = await this.dropdownItemsService.getLootTable(stage.lootTable);
      let interactionId = '';
      if (stage.interactionID) {
        if (stage.interactionType === InteractionTypes.Resource) {
          const interactionItem = await this.dropdownItemsService.getLootTable(stage.interactionID);
          interactionId = interactionItem ? interactionItem.value : '';
        } else if (stage.interactionType === InteractionTypes.NPC) {
          const interactionItem = await this.dropdownItemsService.getSpawnDataItem(stage.interactionID);
          interactionId = interactionItem ? interactionItem.value : '';
        } else if (stage.interactionType === InteractionTypes.Effect) {
          const interactionItem = await this.dropdownItemsService.getEffect(stage.interactionID);
          interactionId = interactionItem ? interactionItem.value : '';
        } else if (stage.interactionType === InteractionTypes.Instance) {
          const interactionItem = await this.dropdownItemsService.getInstance(stage.interactionID);
          interactionId = interactionItem ? interactionItem.value : '';
        }
      }
      stages.push({
        buildTimeReq: stage.buildTimeReq,
        repairTimeReq: stage.repairTimeReq,
        interactionType: stage.interactionType,
        interactionID: interactionId ? interactionId : stage.interactionID,
        interactionData1: stage.interactionData1,
        health: stage.health,
        lootTable: lootItem ? lootItem.value : stage.lootTable,
        lootMinPercentage: stage.lootMinPercentage,
        lootMaxPercentage: stage.lootMaxPercentage,
        subs: items.map(({item, count}) => {
          const selectedItem = this.itemsList.find((itl) => itl.id === item);
          return {
            item: selectedItem?.value || item,
            count,
          };
        }),
        subs2: progresses.map(({progress, prefab}) => ({progress, prefab})),
        subs3: damages.map(({progress, prefab}) => ({progress, prefab})),
      });
    }
    this.tablesService.previewStream.next({
      ...this.tablesService.previewStream.getValue(),
      ...{[this.tableKey]: {stages}},
    });
  }

  public async getList(queryParams: QueryParams, loadAll = false): Promise<void> {
    if (loadAll) {
      this.dropdownItemsService.getBuildObjects();
    }
    const response = await this.databaseService.queryList<BuildObject>(
      this.dbProfile,
      this.dbTable,
      this.tableConfig.fields,
      queryParams,
    );
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
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

  private async defaults(item: BuildObject): Promise<BuildObject> {
    item.updatetimestamp = this.databaseService.getTimestampNow();
    item.icon2 = await this.imageService.parseImage(this.profile, item.icon);
    if (!item.icon) {
      item.icon = this.profile.defaultImage;
    }
    item.category = item.category || 0;
    item.buildSolo = item.buildSolo || false;
    item.fixedTime = item.fixedTime || false;
    item.attackable = item.attackable || false;
    item.repairable = item.repairable || false;
    item.weaponReq = item.weaponReq || '';
    item.claim_object_category = item.claim_object_category || -1;
    return item;
  }

  private subDefaults(stage: BuildObjectStage): BuildObjectStage {
    stage.buildTimeReq = stage.buildTimeReq || 0;
    stage.repairTimeReq = stage.repairTimeReq || 0;
    stage.interactionType = stage.interactionType || '';
    stage.interactionID = stage.interactionID || -1;
    if (stage.interactionType === InteractionTypes.Chest) {
      stage.interactionID = stage.interactionIDChest || 0;
    } else if (stage.interactionType === InteractionTypes.LeaveInstance) {
      stage.interactionID = 0;
    }
    delete stage.interactionIDChest;
    stage.health = stage.health || 0;
    stage.lootTable = stage.lootTable || -1;
    stage.lootMinPercentage = stage.lootMinPercentage || 0;
    stage.lootMaxPercentage = stage.lootMaxPercentage || 0;
    stage.updatetimestamp = this.databaseService.getTimestampNow();
    stage.gameObject = stage.gameObject || '';
    return stage;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      icon: '',
      category: 0,
      skill: 0,
      skillLevelReq: [0, Validators.min(0)],
      weaponReq: '',
      distanceReq: [0, Validators.min(0)],
      buildTaskReqPlayer: 1,
      validClaimType: ['', Validators.required],
      availableFromItemOnly: false,
      buildSolo: false,
      fixedTime: false,
      claim_object_category: -1,
      attackable: false,
      repairable: false,
      stages: new FormArray([]),
    });
  }

  private static resetForm(form: FormGroup): void {
    form.reset();
    (form.get('stages') as FormArray).clear();
  }

  private async getSubSubs<T>(stageId: number, table: string): Promise<T[]> {
    return await this.databaseService.queryAll<T>(
      this.dbProfile,
      table,
      {},
      {
        where: {stage_id: stageId},
      },
    );
  }
}
