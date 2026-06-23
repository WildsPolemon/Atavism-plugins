import {Injectable} from '@angular/core';
import {TabTypes} from "../../models/tabTypes.enum";
import {BehaviorSubject, Subject} from "rxjs";
import {DataBaseProfile, DataBaseType} from "../../settings/profiles/profile";
import {
  behaviorConditionsGroupTable,
  behaviorConditionsTable,
  mobAbilityConditionsGroupTable,
  mobAbilityConditionsTable,
  mobAbilityTable,
  mobBehaviorPoints,
  mobBehaviorProfileTable,
  mobBehaviorTable
} from "../tables.data";
import {DialogCloseType, DialogConfig, QueryParams, TableConfig} from '../../models/configs';
import {ConfigTypes, FilterTypes} from "../../models/configRow.interface";
import {ActionsIcons, ActionsNames, ActionsTypes} from "../../models/actions.interface";
import {DropdownItemsService} from "../dropdown-items.service";
import {FormBuilder} from "@angular/forms";
import {DatabaseService} from "../../services/database.service";
import {ProfilesService} from "../../settings/profiles/profiles.service";
import {TranslateService} from "@ngx-translate/core";
import {TablesService} from "../../services/tables.service";
import {NotificationService} from "../../services/notification.service";
import {getProfilePipe, Utils} from "../../directives/utils";
import {
  BehaviorConditions,
  BehaviorConditionsGroup,
  MobAbility,
  MobAbilityConditions,
  MobAbilityConditionsGroup,
  MobBehavior,
  MobBehaviorPoints,
  MobBehaviorProfile,
  MobBehaviorType
} from "./mob-behavior-profile";
import {MobBehaviorProfileFormComponent} from "./mob-behavior-profile-form/mob-behavior-profile-form.component";
import {delay, takeUntil} from "rxjs/operators";
import {LoadingService} from "../../components/loading/loading.service";
import {MatDialog} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class MobBehaviorProfileService {
  public tableKey = TabTypes.MOB_BEHAVIOR_PROFILE;
  private readonly listStream = new BehaviorSubject<MobBehaviorProfile[]>([]);
  public list = this.listStream.asObservable();
  public dbProfile!: DataBaseProfile;
  public dbTable = mobBehaviorProfileTable;
  public tableConfig: TableConfig = {
    type: this.tableKey,
    bulkActions: true,
    count: 10,
    fields: {
      id: {type: ConfigTypes.numberType, visible: true, alwaysVisible: true},
      name: {type: ConfigTypes.stringType, visible: true, useAsSearch: true},
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
  private destroyer = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly dropdownItemsService: DropdownItemsService,
    private readonly tablesService: TablesService,
    private readonly notification: NotificationService) {
  }

  public init(): void {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.world_content);
      if (!Utils.equals(latestProfile, this.dbProfile)) {
        this.dbProfile = latestProfile as DataBaseProfile;
        const defaultIsActiveFilter =
          typeof profile.defaultIsActiveFilter !== 'undefined' ? String(profile.defaultIsActiveFilter) : '-1';
        this.tableConfig.fields.isactive.overrideValue = defaultIsActiveFilter;
        if (defaultIsActiveFilter === '1' || defaultIsActiveFilter === '0') {
          this.tableConfig.queryParams.where.isactive = defaultIsActiveFilter;
        }
      }
    });
  }

  public async getList(queryParams: QueryParams): Promise<void> {
    const response = await this.databaseService.queryList<MobBehaviorProfile>(this.dbProfile, this.dbTable, this.tableConfig.fields, queryParams);
    this.tableConfig.count = response.count;
    this.listStream.next(response.list);
  }

  public async addItem() {
    this.loadingService.show();
    const{formData, action }= await this.manageModalPopup();
    if (!formData) {
      return null;
    }
    const newProfile = {
      name: formData.name,
      isactive: true,
      creationtimestamp: this.databaseService.getTimestampNow(),
      updatetimestamp: this.databaseService.getTimestampNow(),
    }
    const id = await this.databaseService.insert<MobBehaviorProfile>(this.dbProfile, this.dbTable, newProfile);
    await this.saveChildren(id, formData.mobBehavior);
    return {id, value: newProfile.name};
  }

  public async updateItem(id: number) {
    const record = await this.buildFullObject(id, true);
    if (!record) {
      return null;
    }
    const {formData, action} = await this.manageModalPopup(record, this.translate.instant('ACTIONS.UPDATE'));
    if (!formData) {
      return null;
    }
    if (action === DialogCloseType.save_as_new) {
      const profile: MobBehaviorProfile = {
        name: formData.name,
        isactive: true,
        creationtimestamp: this.databaseService.getTimestampNow(),
        updatetimestamp: this.databaseService.getTimestampNow(),
      };
      const newId = await this.databaseService.insert<MobBehaviorProfile>(this.dbProfile, this.dbTable, profile, false);
      await this.saveChildren(newId, formData.mobBehavior);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_ADDED'));
    } else {

      const profile: MobBehaviorProfile = {
        id: record.id,
        name: formData.name,
        isactive: record.isactive,
        creationtimestamp: record.creationtimestamp,
        updatetimestamp: this.databaseService.getTimestampNow(),
      };
      await this.databaseService.update<MobBehaviorProfile>(this.dbProfile, this.dbTable, profile, 'id', record.id);
      await this.saveChildren(record.id, formData.mobBehavior, true);
      this.notification.success(this.translate.instant('CONCLUSION.SUCCESSFULLY_UPDATED'));
    }
    return {id: record.id, value: record.name};
  }

  public async duplicateItem(id: number): Promise<number> {
    const record = await this.buildFullObject(id, true);
    if (!record) {
      return null;
    }

    const {formData, action} = await this.manageModalPopup({...record, name: record.name + ' (1)'});
    if (!formData) {
      return null;
    }
    const profile: MobBehaviorProfile = {
      name: formData.name,
      isactive: true,
      creationtimestamp: this.databaseService.getTimestampNow(),
      updatetimestamp: this.databaseService.getTimestampNow(),
    }
    const newId = await this.databaseService.insert<MobBehaviorProfile>(this.dbProfile, this.dbTable, profile, false);
    await this.saveChildren(newId, formData.mobBehavior);
    this.notification.success(this.translate.instant('CONCLUSION.DUPLICATION_SUCCESS'));
    return newId;
  }

  private setDefaultMobBehavior(data: any, order: number, id: number, updateMode = false): MobBehavior {
    const mobBehavior = {
      profile_id: id,
      behavior_order: order,
      type: data.type,
      flee_type: data.type === MobBehaviorType.Flee ? data.flee_type ?? -1 : -1,
      ability_interval: data.ability_interval ?? -1,
      mob_tag: data.mob_tag ?? -1,
      ignore_chase_distance: data.ignore_chase_distance ?? false,
      weapon: data.weapon ?? -1,
      updatetimestamp: this.databaseService.getTimestampNow(),
    } as MobBehavior;
    if (mobBehavior.type === 0) {
      mobBehavior.flee_type = -1;
      mobBehavior.mob_tag = -1;
    } else if (mobBehavior.type === 1) {
      mobBehavior.flee_type = -1;
      mobBehavior.mob_tag = -1;
    } else if (mobBehavior.type === 2) {
      mobBehavior.flee_type = -1;
      mobBehavior.mob_tag = -1;
    } else if (mobBehavior.type === 3) {
      mobBehavior.flee_type = -1;
     // mobBehavior.mob_tag = -1;
    } else if (mobBehavior.type === 4) {
      mobBehavior.mob_tag = -1;
    } else if (mobBehavior.type === 5) {
      mobBehavior.flee_type = -1;
    }
    if (updateMode && data.id) {
      mobBehavior.id = data.id;
    } else {
      mobBehavior.creationtimestamp = this.databaseService.getTimestampNow();
    }
    return mobBehavior;
  }

  private setDefaultCondition(data: BehaviorConditions, parentId: number, updateMode = false): BehaviorConditions {
    const condition = {
      conditions_group_id: parentId,
      type: data.type,
      distance: data.distance ?? -1,
      less: data.less,
      stat_name: data.stat_name ?? '',
      stat_value: data.stat_value ?? -1,
      stat_vitality_percentage: data.stat_vitality_percentage ?? 0,
      target: data.target ?? 1,
      effect_tag_id: data.effect_tag_id ?? -1,
      on_target: data.on_target ?? 0,
      combat_state: data.combat_state ?? 0,
      death_state: data.death_state ?? 0,
      trigger_event_Id: data.trigger_event_Id ?? -1,
      target_number: data.target_number ?? -1,
      target_ally: data.target_ally ?? 0,
      updatetimestamp: this.databaseService.getTimestampNow(),
    } as BehaviorConditions;
    if (condition.type === 0) {//Event
      condition.distance = -1;
      condition.target = -1;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.combat_state = false;
      condition.death_state = false;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 1) {//Distance
      condition.stat_name = '';
      condition.stat_value = -1;
      condition.stat_vitality_percentage = false;
      condition.target = -1;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.combat_state = false;
      condition.death_state = false;
      condition.trigger_event_Id = -1;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 2) {//Stat
      condition.distance = -1;
     // condition.target = -1;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.combat_state = false;
      condition.death_state = false;
      condition.trigger_event_Id = -1;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 3) {//Effect
      condition.distance = -1;
      condition.stat_name = '';
      condition.stat_value = -1;
      condition.stat_vitality_percentage = false;
      condition.combat_state = false;
      condition.death_state = false;
      condition.trigger_event_Id = -1;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 4) {//CombatState
      condition.distance = -1;
      condition.stat_name = '';
      condition.stat_value = -1;
      condition.stat_vitality_percentage = false;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.target = 0;
      condition.death_state = false;
      condition.trigger_event_Id = -1;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 5) {//DeathState
      condition.distance = -1;
      condition.stat_name = '';
      condition.stat_value = -1;
      condition.stat_vitality_percentage = false;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.target = 0;
      condition.combat_state = false;
      condition.trigger_event_Id = -1;
      condition.target_number = -1;
      condition.target_ally = false;
    } else if (condition.type === 6) {//NumberOfTargets
      condition.distance = -1;
      condition.stat_name = '';
      condition.stat_value = -1;
      condition.stat_vitality_percentage = false;
      condition.target = -1;
      condition.effect_tag_id = -1;
      condition.on_target = false;
      condition.combat_state = false;
      condition.death_state = false;
      condition.trigger_event_Id = -1;
    }
    if (updateMode && data.id) {
      condition.id = data.id;
    } else {
      condition.creationtimestamp = this.databaseService.getTimestampNow();
    }
    return condition;
  }

  private setDefaultAbilities(data: MobAbility, order: number, parentId: number, updateMode = false): MobAbility {
    let abilities = '';
    for(let ability of data.abilities) {
      abilities += `${(ability as any).ability};${(ability as any).priority ?? 1};`
    }
    const ability = {
      mob_ability_order: order,
      behavior_id: parentId,
      abilities,
      minAbilityRangePercentage: data.minAbilityRangePercentage,
      maxAbilityRangePercentage: data.maxAbilityRangePercentage,
      mob_ability_type: data.mob_ability_type,
      updatetimestamp: this.databaseService.getTimestampNow(),
    } as MobAbility;
    if (updateMode && data.id) {
      ability.id = data.id;
    } else {
      ability.creationtimestamp = this.databaseService.getTimestampNow();
    }
    return ability;
  }

  private async saveChildren(parentId: number, mobBehaviors: MobBehavior[], updateMode = false): Promise<void> {
    let usedMobBehaviors = [];
    if (updateMode) {
      usedMobBehaviors = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobBehaviorTable} WHERE profile_id = ${parentId}`);
      usedMobBehaviors = usedMobBehaviors.map(({id}) => id);
    }
    for (const mobBehaviorIndex in mobBehaviors) {
      const mobBehaviour = mobBehaviors[mobBehaviorIndex];
      const newMobBehaviour = this.setDefaultMobBehavior(mobBehaviour, +mobBehaviorIndex, parentId, updateMode);
      let mobBehaviourId = undefined;
      if (updateMode && newMobBehaviour.id) {
        if (usedMobBehaviors.indexOf(newMobBehaviour.id) !== -1) {
           usedMobBehaviors.splice(usedMobBehaviors.indexOf(newMobBehaviour.id), 1);
        }
        mobBehaviourId = newMobBehaviour.id
          await this.databaseService.update<MobBehavior>(this.dbProfile, mobBehaviorTable, newMobBehaviour, 'id', newMobBehaviour.id);
      } else {
        mobBehaviourId = await this.databaseService.insert<MobBehavior>(this.dbProfile, mobBehaviorTable, newMobBehaviour, false);
      }
      let usedMobBehaviorConditionGroup = [];
      if (updateMode && newMobBehaviour.id) {
        usedMobBehaviorConditionGroup = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${behaviorConditionsGroupTable} WHERE behavior_id = ${newMobBehaviour.id}`);
        usedMobBehaviorConditionGroup = usedMobBehaviorConditionGroup.map(({id}) => id);
      }
      for (const behaviorConditionGroupIndex in mobBehaviour.behaviorConditionsGroup) {
        const group = mobBehaviour.behaviorConditionsGroup[behaviorConditionGroupIndex];
        let mobBehaviourConditionGroupId;
        if (updateMode && group.id) {
          if (usedMobBehaviorConditionGroup.indexOf(group.id) !== -1) {
             usedMobBehaviorConditionGroup.splice(usedMobBehaviorConditionGroup.indexOf(group.id), 1);
          }
          mobBehaviourConditionGroupId = group.id;
          mobBehaviourId = newMobBehaviour.id
          const behaviorConditionGroup = {
            id: group.id,
            group_order: +behaviorConditionGroupIndex,
            behavior_id: mobBehaviourId,
            updatetimestamp: this.databaseService.getTimestampNow(),
          } as BehaviorConditionsGroup;
          await this.databaseService.update<BehaviorConditionsGroup>(this.dbProfile, behaviorConditionsGroupTable, behaviorConditionGroup, 'id', behaviorConditionGroup.id);
        } else {
          const newBehaviorConditionGroup: BehaviorConditionsGroup = {
            group_order: +behaviorConditionGroupIndex,
            behavior_id: mobBehaviourId,
            creationtimestamp: this.databaseService.getTimestampNow(),
            updatetimestamp: this.databaseService.getTimestampNow(),
          };
          mobBehaviourConditionGroupId = await this.databaseService.insert<BehaviorConditionsGroup>(this.dbProfile, behaviorConditionsGroupTable, newBehaviorConditionGroup, false);
        }
        let usedMobBehaviorConditions = [];
        if (updateMode) {
          usedMobBehaviorConditions = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${behaviorConditionsTable} WHERE conditions_group_id = ${mobBehaviourConditionGroupId}`);
          usedMobBehaviorConditions = usedMobBehaviorConditions.map(({id}) => id);
        }
        if (group.behaviorConditions) {
          for (const condition of group.behaviorConditions) {
            const newCondition = this.setDefaultCondition(condition, mobBehaviourConditionGroupId, updateMode);
            if (updateMode && newCondition.id) {
              if (usedMobBehaviorConditions.indexOf(newCondition.id) !== -1) {
                 usedMobBehaviorConditions.splice(usedMobBehaviorConditions.indexOf(newCondition.id), 1);
              }
              await this.databaseService.update<BehaviorConditions>(this.dbProfile, behaviorConditionsTable, newCondition, 'id', newCondition.id);
            } else {
              await this.databaseService.insert<BehaviorConditions>(this.dbProfile, behaviorConditionsTable, newCondition, false);
            }
          }
        }
        if (usedMobBehaviorConditions.length > 0) {
          await this.removeById(usedMobBehaviorConditions, behaviorConditionsTable);
        }
      }
      if (usedMobBehaviorConditionGroup.length > 0) {
        await this.removeById(usedMobBehaviorConditionGroup, behaviorConditionsGroupTable);
      }

      let usedBehaviorPoints = [];
      if(updateMode && newMobBehaviour.id) {
        usedBehaviorPoints = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobBehaviorPoints} WHERE behavior_id = ${newMobBehaviour.id}`);
        usedBehaviorPoints = usedBehaviorPoints.map(({id}) => id);
      }
      if (mobBehaviour.type === MobBehaviorType.Flee && mobBehaviour.flee_type === 1) {
        if(mobBehaviour.pointsGroup) {
          for(const point of mobBehaviour.pointsGroup) {
            const newPoint = {
              behavior_id: mobBehaviourId,
              ...point
            };
            if(updateMode && newPoint.id) {
              if (usedBehaviorPoints.indexOf(newPoint.id) !== -1) {
                 usedBehaviorPoints.splice(usedBehaviorPoints.indexOf(newPoint.id), 1);
              }
              await this.databaseService.update<MobBehaviorPoints>(this.dbProfile, mobBehaviorPoints, newPoint, 'id', newPoint.id);
            } else {
              const {id, ...otherPoint} = newPoint;
              await this.databaseService.insert<MobBehaviorPoints>(this.dbProfile, mobBehaviorPoints, otherPoint, false);
            }
          }
        }
      }
      if (usedBehaviorPoints.length > 0) {
        await this.removeById(usedBehaviorPoints, mobBehaviorPoints);
      }

      let usedMobAbility = [];
      if (updateMode && newMobBehaviour.id) {
        usedMobAbility = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityTable} WHERE behavior_id = ${newMobBehaviour.id}`);
        usedMobAbility = usedMobAbility.map(({id}) => id);
      }
      if (mobBehaviour.mobAbility) {
        await this.saveMobAbility(mobBehaviour, mobBehaviourId, updateMode, 'mobAbility', usedMobAbility);
      }
      if (mobBehaviour.type === MobBehaviorType.Flee && mobBehaviour.mobAbilityStart) {
        await this.saveMobAbility(mobBehaviour, mobBehaviourId, updateMode, 'mobAbilityStart', usedMobAbility);
      }
      if (mobBehaviour.type === MobBehaviorType.Flee && mobBehaviour.mobAbilityEnd) {
        await this.saveMobAbility(mobBehaviour, mobBehaviourId, updateMode, 'mobAbilityEnd', usedMobAbility);
      }
      if (usedMobAbility.length > 0){
        await this.removeById(usedMobAbility, mobAbilityTable);
      }
    }
    if (usedMobBehaviors.length > 0) {
      await this.removeById(usedMobBehaviors, mobBehaviorTable);
    }
    return;
  }

  private async saveMobAbility(mobBehaviour: MobBehavior, mobBehaviourId: number, updateMode: boolean, symbol: string, usedMobAbility: number[]): Promise<number[]> {
    const mobAbilities = mobBehaviour[symbol];
    for (const abilityGroupIndex in mobAbilities.abilityGroups) {
      const abilityGroup = mobAbilities.abilityGroups[abilityGroupIndex];
      const newAbility = this.setDefaultAbilities(abilityGroup, +abilityGroupIndex, mobBehaviourId, updateMode);
      let abilityId;
      if (updateMode && newAbility.id) {
        if (usedMobAbility.indexOf(newAbility.id) !== -1) {
          usedMobAbility.splice(usedMobAbility.indexOf(newAbility.id), 1);
        }
        abilityId = newAbility.id;
        await this.databaseService.update<MobAbility>(this.dbProfile, mobAbilityTable, newAbility, 'id', newAbility.id);
      } else {
        abilityId = await this.databaseService.insert<MobAbility>(this.dbProfile, mobAbilityTable, newAbility, false);
      }
      let usedAbilityConditionGroups = [];
      if (updateMode && newAbility.id) {
        usedAbilityConditionGroups = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityConditionsGroupTable} WHERE mob_ability_id = ${newAbility.id}`);
        usedAbilityConditionGroups = usedAbilityConditionGroups.map(({id}) => id);
      }
      if (abilityGroup.abilityConditionGroups) {
        for (const abilityConditionGroupIndex in abilityGroup.abilityConditionGroups) {
          const group = abilityGroup.abilityConditionGroups[abilityConditionGroupIndex];
          let abilityConditionGroupId;
          if (updateMode && group.id) {
            const newAbilityConditionGroup: MobAbilityConditionsGroup = {
              ...group,
              group_order: +abilityConditionGroupIndex,
              updatetimestamp: this.databaseService.getTimestampNow(),
            };
            if (usedAbilityConditionGroups.indexOf(newAbilityConditionGroup.id) !== -1) {
               usedAbilityConditionGroups.splice(usedAbilityConditionGroups.indexOf(newAbilityConditionGroup.id), 1);
            }
            abilityConditionGroupId = newAbilityConditionGroup.id;
            await this.databaseService.update<MobAbilityConditionsGroup>(this.dbProfile, mobAbilityConditionsGroupTable, newAbilityConditionGroup, 'id', newAbilityConditionGroup.id);
          } else {
            const newAbilityConditionGroup: MobAbilityConditionsGroup = {
              group_order: +abilityConditionGroupIndex,
              mob_ability_id: abilityId,
              creationtimestamp: this.databaseService.getTimestampNow(),
              updatetimestamp: this.databaseService.getTimestampNow(),
            };
            abilityConditionGroupId = await this.databaseService.insert<MobAbilityConditionsGroup>(this.dbProfile, mobAbilityConditionsGroupTable, newAbilityConditionGroup, false);
          }

          let usedMobAbilityConditions = [];
          if (updateMode) {
            usedMobAbilityConditions = await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityConditionsTable} WHERE conditions_group_id = ${abilityConditionGroupId}`);
            usedMobAbilityConditions = usedMobAbilityConditions.map(({id}) => id);
          }
          if (group.abilityConditions) {
            for (const condition of group.abilityConditions) {
              const newCondition = this.setDefaultCondition(condition, abilityConditionGroupId, updateMode);
              if (updateMode && newCondition.id) {
                if (usedMobAbilityConditions.indexOf(newCondition.id) !== -1) {
                   usedMobAbilityConditions.splice(usedMobAbilityConditions.indexOf(newCondition.id), 1);
                }
                await this.databaseService.update<MobAbilityConditions>(this.dbProfile, mobAbilityConditionsTable, newCondition, 'id', newCondition.id);
              } else {
                await this.databaseService.insert<MobAbilityConditions>(this.dbProfile, mobAbilityConditionsTable, newCondition, false)
              }
            }
          }
          if (usedMobAbilityConditions.length > 0) {
            await this.removeById(usedMobAbilityConditions, mobAbilityConditionsTable);
          }
        }
      }

      if (usedAbilityConditionGroups.length > 0){
        await this.removeById(usedAbilityConditionGroups, mobAbilityConditionsGroupTable);
      }
    }

    return usedMobAbility;
  }

  async removeById(ids: number[], table: string): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${table} WHERE id IN (${ids.join(', ')})`, [], true);
    if (table === behaviorConditionsGroupTable) {
      await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${behaviorConditionsTable} WHERE conditions_group_id IN (${ids.join(', ')})`, [], true);
    } else if(table === mobAbilityConditionsGroupTable) {
      await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityConditionsTable} WHERE conditions_group_id IN (${ids.join(', ')})`, [], true);
    } else if (table === mobAbilityTable) {
      for(const id of ids) {
        const usedAbilityConditionGroup = (await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityTable} WHERE behavior_id = ${id}`)).map(({id}) => id);
        if (usedAbilityConditionGroup.length > 0) {
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityConditionsGroupTable} WHERE id IN (${usedAbilityConditionGroup.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityConditionsTable} WHERE conditions_group_id IN (${usedAbilityConditionGroup.join(', ')})`, [], true);
        }
      }
    } else if (table === mobBehaviorTable) {
      for(const id of ids) {
        const usedMobBehaviorConditionGroup = (await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${behaviorConditionsGroupTable} WHERE behavior_id = ${id}`)).map(({id}) => id);
        if (usedMobBehaviorConditionGroup.length > 0) {
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${behaviorConditionsGroupTable} WHERE id IN (${usedMobBehaviorConditionGroup.join(', ')})`, [], true);
          await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${behaviorConditionsTable} WHERE conditions_group_id IN (${usedMobBehaviorConditionGroup.join(', ')})`, [], true);
        }
        const usedMobAbilities = (await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityTable} WHERE behavior_id = ${id}`)).map(({id}) => id);
        if (usedMobAbilities.length > 0) {
          const usedMobAbilitiesGroups = (await this.databaseService.customQuery(this.dbProfile, `SELECT id FROM ${mobAbilityConditionsGroupTable} WHERE mob_ability_id IN (${usedMobAbilities.join(', ')})`)).map(({id}) => id);
          if (usedMobAbilitiesGroups.length > 0) {
            await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityConditionsGroupTable} WHERE id IN (${usedMobAbilitiesGroups.join(', ')})`, [], true);
            await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityConditionsTable} WHERE conditions_group_id IN (${usedMobAbilitiesGroups.join(', ')})`, [], true);
          }
        }
      }
      await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobBehaviorPoints} WHERE behavior_id IN (${ids.join(', ')})`, [], true);
      await this.databaseService.customQuery(this.dbProfile, `DELETE FROM ${mobAbilityTable} WHERE behavior_id IN (${ids.join(', ')})`, [], true);
    }
  }

  private async manageModalPopup(profile?: MobBehaviorProfile, submit?: string): Promise<{formData: MobBehaviorProfile | undefined, action: DialogCloseType}> {
    const dialogRef = this.matDialog.open(MobBehaviorProfileFormComponent, {
      panelClass: DialogConfig.fullDialogOverlay,

      data: {
        profile,
        submit,
      },
    })
    dialogRef.afterOpened().pipe(delay(250), takeUntil(this.destroyer)).subscribe(() => this.loadingService.hide());
    return new Promise((resolve) => {
      dialogRef.afterClosed().pipe(takeUntil(this.destroyer)).subscribe((response:[MobBehaviorProfile, DialogCloseType]) => {
          resolve({formData: response[0], action: response[1]});
      });
    });
  }

  private async buildFullObject(id: number, updateMode = false): Promise<MobBehaviorProfile> {
    const mobBehaviorProfile = await this.databaseService.queryItem<MobBehaviorProfile>(this.dbProfile, this.dbTable, 'id', id);
    let mobBehaviours = await this.databaseService.queryAll<MobBehavior>(this.dbProfile, mobBehaviorTable, {}, {where: {profile_id: mobBehaviorProfile.id}, sort: {field: 'behavior_order', order: 'asc'}});
    for(const mobBehaviour of mobBehaviours) {
      let points = await this.databaseService.queryAll<MobBehaviorPoints>(this.dbProfile, mobBehaviorPoints, {}, {where: {behavior_id: mobBehaviour.id}});
      let behaviorConditionsGroup = await this.databaseService.queryAll<BehaviorConditionsGroup>(this.dbProfile, behaviorConditionsGroupTable, {}, {where: {behavior_id: mobBehaviour.id}, sort: {field: 'group_order', order: 'asc'}});
      for(const behaviorConditionGroup of behaviorConditionsGroup) {
        let behaviorConditions = await this.databaseService.queryAll<BehaviorConditions>(this.dbProfile, behaviorConditionsTable, {}, {where: {conditions_group_id: behaviorConditionGroup.id}});
        if (!updateMode) {
          behaviorConditions = behaviorConditions.map((bc) => ({...bc, id: undefined}));
        }
        behaviorConditionGroup.behaviorConditions = behaviorConditions;
      }
      let mobAbilities = await this.databaseService.queryAll<MobAbility>(this.dbProfile, mobAbilityTable, {}, {where: {behavior_id: mobBehaviour.id, mob_ability_type: 0}, sort: {field: 'mob_ability_order', order: 'asc'}});
      for(const mobAbility of mobAbilities) {
        let mobAbilityConditionsGroup = await this.databaseService.queryAll<MobAbilityConditionsGroup>(this.dbProfile, mobAbilityConditionsGroupTable, {}, {where: {mob_ability_id: mobAbility.id}, sort: {field: 'group_order', order: 'asc'}});
        for(const mobAbilityConditionGroup of mobAbilityConditionsGroup) {
          let conditions = await this.databaseService.queryAll<MobAbilityConditions>(this.dbProfile, mobAbilityConditionsTable, {}, {where: {conditions_group_id: mobAbilityConditionGroup.id}});
          if (!updateMode) {
            conditions = conditions.map((bc) => ({...bc, id: undefined}));
          }
          mobAbilityConditionGroup.abilityConditions = conditions;
        }
        if (!updateMode) {
          mobAbilityConditionsGroup = mobAbilityConditionsGroup.map((bc) => ({...bc, id: undefined}));
        }
        mobAbility.abilityConditionGroups = mobAbilityConditionsGroup;
      }
      let mobAbilitiesStart = await this.databaseService.queryAll<MobAbility>(this.dbProfile, mobAbilityTable, {}, {where: {behavior_id: mobBehaviour.id, mob_ability_type: 1}, sort: {field: 'mob_ability_order', order: 'asc'}});
      for(const mobAbility of mobAbilitiesStart) {
        let mobAbilityConditionsGroup = await this.databaseService.queryAll<MobAbilityConditionsGroup>(this.dbProfile, mobAbilityConditionsGroupTable, {}, {where: {mob_ability_id: mobAbility.id}, sort: {field: 'group_order', order: 'asc'}});
        for(const mobAbilityConditionGroup of mobAbilityConditionsGroup) {
          let conditions = await this.databaseService.queryAll<MobAbilityConditions>(this.dbProfile, mobAbilityConditionsTable, {}, {where: {conditions_group_id: mobAbilityConditionGroup.id}});
          if (!updateMode) {
            conditions = conditions.map((bc) => ({...bc, id: undefined}));
          }
          mobAbilityConditionGroup.abilityConditions = conditions;
        }
        if (!updateMode) {
          mobAbilityConditionsGroup = mobAbilityConditionsGroup.map((bc) => ({...bc, id: undefined}));
        }
        mobAbility.abilityConditionGroups = mobAbilityConditionsGroup;
      }
      let mobAbilitiesEnd = await this.databaseService.queryAll<MobAbility>(this.dbProfile, mobAbilityTable, {}, {where: {behavior_id: mobBehaviour.id, mob_ability_type: 2}, sort: {field: 'mob_ability_order', order: 'asc'}});
      for(const mobAbility of mobAbilitiesEnd) {
        let mobAbilityConditionsGroup = await this.databaseService.queryAll<MobAbilityConditionsGroup>(this.dbProfile, mobAbilityConditionsGroupTable, {}, {where: {mob_ability_id: mobAbility.id}, sort: {field: 'group_order', order: 'asc'}});
        for(const mobAbilityConditionGroup of mobAbilityConditionsGroup) {
          let conditions = await this.databaseService.queryAll<MobAbilityConditions>(this.dbProfile, mobAbilityConditionsTable, {}, {where: {conditions_group_id: mobAbilityConditionGroup.id}});
          if (!updateMode) {
            conditions = conditions.map((bc) => ({...bc, id: undefined}));
          }
          mobAbilityConditionGroup.abilityConditions = conditions;
        }
        if (!updateMode) {
          mobAbilityConditionsGroup = mobAbilityConditionsGroup.map((bc) => ({...bc, id: undefined}));
        }
        mobAbility.abilityConditionGroups = mobAbilityConditionsGroup;
      }
      if (!updateMode) {
        behaviorConditionsGroup = behaviorConditionsGroup.map((bcg) => ({...bcg, id: undefined}));
        points = points.map((point) => ({...point, id: undefined}));
        mobAbilities = mobAbilities.map((abl) => ({...abl, id: undefined}));
        mobAbilitiesStart = mobAbilitiesStart.map((abl) => ({...abl, id: undefined}));
        mobAbilitiesEnd = mobAbilitiesEnd.map((abl) => ({...abl, id: undefined}));
      }
      mobBehaviour.behaviorConditionsGroup = behaviorConditionsGroup;
      mobBehaviour.pointsGroup = points;
      mobBehaviour.mobAbility = {abilityGroups: mobAbilities};
      mobBehaviour.mobAbilityStart = {abilityGroups: mobAbilitiesStart};
      mobBehaviour.mobAbilityEnd = {abilityGroups: mobAbilitiesEnd};
    }
    if (!updateMode) {
      mobBehaviours = mobBehaviours.map((mb) => ({...mb, id: undefined}));
    }
    mobBehaviorProfile.mobBehavior = mobBehaviours;
    return mobBehaviorProfile;
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
