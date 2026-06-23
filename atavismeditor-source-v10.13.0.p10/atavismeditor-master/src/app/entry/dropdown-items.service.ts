import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DataBaseProfile, DataBaseType, Profile} from '../settings/profiles/profile';
import {DatabaseService} from '../services/database.service';
import {ProfilesService} from '../settings/profiles/profiles.service';
import {
  abilitiesTable, abilitiesTriggersProfileTable,
  achivementSettingsTable,
  auctionProfileTable,
  bonusesSettingsTable,
  buildObjectTable,
  coordinatedEffectsTable,
  craftingRecipesTable,
  currenciesTable,
  damageTable,
  dialogueActionsTable,
  dialogueTable,
  effectsTable,
  enchantProfileTable,
  factionsTable,
  instanceTemplateTable, interactiveObjectProfileTable, itemAudioProfileTable,
  itemTemplatesTable,
  levelXpRequirementsRewardTemplatesTable,
  levelXpRequirementsTemplatesTable,
  lootTablesTable,
  merchantTable,
  mobBehaviorProfileTable,
  mobTemplateTable, petProfileTable,
  questsTable,
  skillProfileTable,
  skillsTable,
  slotsGroupTable,
  slotsInGroupTable, slotsProfileTable,
  slotsTable,
  spawnDataTable, statProfileTable,
  statsTable,
  taskTable, weaponTemplatesProfileTable,
} from './tables.data';
import {DropdownValue, SkillProfileDropValue} from '../models/configRow.interface';
import {ReplaySubject} from 'rxjs';
import {Faction} from './factions/factions.service';
import {Skill} from './skills/skills.service';
import {BonusSetting} from './bonus-settings/bonus-settings.service';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {Utils} from '../directives/utils';
import {Item} from './items/items.data';
import {Effect} from './effects/effects.data';
import {Quest} from './quests/quests.data';
import {Ability} from './ability/abilities.data';
import {Dialogue} from './dialogue/dialogue.data';
import {Merchant} from './merchant/merchant.service';
import {Currency} from './currencies/currencies.service';
import {InstanceTemplate} from './instances/instances.data';
import {MobsSpawnDataSettings} from './mobs-spawn-data/mobs-spawn-data.service';
import {LootTable} from './loot-tables/loot-tables.service';
import {AuctionHouseProfile} from './auction-profile/auction-profile.data';
import {Slot} from './slot/slot.data';
import {SlotGroup} from './slot-group/slot-group.data';
import {EditorOptionChoice} from './option-choices/option-choices.data';

export interface BonusDropdownValue {
  id: number | string;
  name: string;
  value: boolean;
  percentage: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DropdownItemsService {
  public dbProfileWordContent!: DataBaseProfile;
  public dbProfileAdmin!: DataBaseProfile;
  public claimTypes: DropdownValue[] = [
    {id: 1, value: this.translate.instant('CLAIMTYPES.ANY')},
    {id: 2, value: this.translate.instant('CLAIMTYPES.RESIDENTIAL')},
    {id: 4, value: this.translate.instant('CLAIMTYPES.FARM')},
  ];
  private readonly abilitiesStream = new ReplaySubject<DropdownValue[]>(1);
  public abilities = this.abilitiesStream.asObservable();
  private readonly toggleAbilitiesStream = new ReplaySubject<DropdownValue[]>(1);
  public toggleAbilities = this.toggleAbilitiesStream.asObservable();
  private readonly statsStream = new ReplaySubject<DropdownValue[]>(1);
  public stats = this.statsStream.asObservable();
  private readonly statsIdStream = new ReplaySubject<DropdownValue[]>(1);
  public statsId = this.statsIdStream.asObservable();
  private readonly statsProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public statsProfileId = this.statsProfileStream.asObservable();
  private readonly vitalityStatStream = new ReplaySubject<DropdownValue[]>(1);
  public vitalityStat = this.vitalityStatStream.asObservable();
  private readonly skillsStream = new ReplaySubject<DropdownValue[]>(1);
  public skills = this.skillsStream.asObservable();
  private readonly currenciesStream = new ReplaySubject<DropdownValue[]>(1);
  public currencies = this.currenciesStream.asObservable();
  private readonly enchantProfilesStream = new ReplaySubject<DropdownValue[]>(1);
  public enchantProfiles = this.enchantProfilesStream.asObservable();
  private readonly craftingRecipesStream = new ReplaySubject<DropdownValue[]>(1);
  public craftingRecipes = this.craftingRecipesStream.asObservable();
  private readonly buildObjectsStream = new ReplaySubject<DropdownValue[]>(1);
  public buildObjects = this.buildObjectsStream.asObservable();
  private readonly questsStream = new ReplaySubject<DropdownValue[]>(1);
  public quests = this.questsStream.asObservable();
  private readonly bonusSettingsStream = new ReplaySubject<BonusDropdownValue[]>(1);
  public bonusSettings = this.bonusSettingsStream.asObservable();
  private readonly achievementsStream = new ReplaySubject<DropdownValue[]>(1);
  public achievements = this.achievementsStream.asObservable();
  private readonly itemsStream = new ReplaySubject<DropdownValue[]>(1);
  public items = this.itemsStream.asObservable();
  private readonly weaponsStream = new ReplaySubject<DropdownValue[]>(1);
  public weapons = this.weaponsStream.asObservable();
  private readonly lootTableStream = new ReplaySubject<DropdownValue[]>(1);
  public lootTable = this.lootTableStream.asObservable();
  private readonly factionsStream = new ReplaySubject<DropdownValue[]>(1);
  public factions = this.factionsStream.asObservable();
  private readonly mobsStream = new ReplaySubject<DropdownValue[]>(1);
  public mobs = this.mobsStream.asObservable();
  private readonly merchantsStream = new ReplaySubject<DropdownValue[]>(1);
  public merchants = this.merchantsStream.asObservable();
  private readonly effectsStream = new ReplaySubject<DropdownValue[]>(1);
  public effects = this.effectsStream.asObservable();
  private readonly instancesStream = new ReplaySubject<DropdownValue[]>(1);
  public instances = this.instancesStream.asObservable();
  private readonly instancesOptionsStream = new ReplaySubject<DropdownValue[]>(1);
  public instancesOptions = this.instancesOptionsStream.asObservable();
  private readonly spawnDataStream = new ReplaySubject<DropdownValue[]>(1);
  public spawnData = this.spawnDataStream.asObservable();
  private readonly tasksStream = new ReplaySubject<DropdownValue[]>(1);
  public tasks = this.tasksStream.asObservable();
  private readonly dialogueNotUsedStream = new ReplaySubject<DropdownValue[]>(1);
  public dialogueNotUsed = this.dialogueNotUsedStream.asObservable();
  private readonly dialogueStream = new ReplaySubject<DropdownValue[]>(1);
  public dialogue = this.dialogueStream.asObservable();
  private readonly skillProfileStream = new ReplaySubject<SkillProfileDropValue[]>(1);
  public skillProfile = this.skillProfileStream.asObservable();
  private readonly coordinatedEffectsStream = new ReplaySubject<SkillProfileDropValue[]>(1);
  public coordinatedEffects = this.coordinatedEffectsStream.asObservable();
  private readonly damagesStream = new ReplaySubject<DropdownValue[]>(1);
  public damages = this.damagesStream.asObservable();
  private readonly passiveEffectsStream = new ReplaySubject<DropdownValue[]>(1);
  public passiveEffects = this.passiveEffectsStream.asObservable();
  private readonly auctionProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public auctionProfiles = this.auctionProfileStream.asObservable();
  private readonly slotNamesStream = new ReplaySubject<DropdownValue[]>(1);
  public slotNames = this.slotNamesStream.asObservable();
  private readonly mobBehavbiorsStream = new ReplaySubject<DropdownValue[]>(1);
  public mobBehaviors = this.mobBehavbiorsStream.asObservable();
  private readonly levelXpRewardProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public levelXpRewardProfile = this.levelXpRewardProfileStream.asObservable();
  private readonly levelXpProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public levelXpProfile = this.levelXpProfileStream.asObservable();
  private readonly abilityTriggerProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public abilityTriggerProfile = this.abilityTriggerProfileStream.asObservable();
  private readonly weaponProfilesStream = new ReplaySubject<DropdownValue[]>(1);
  public weaponProfiles = this.weaponProfilesStream.asObservable();
  private readonly itemAudioProfilesStream = new ReplaySubject<DropdownValue[]>(1);
  public itemAudioProfiles = this.itemAudioProfilesStream.asObservable();
  private readonly slotsProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public slotsProfile = this.slotsProfileStream.asObservable();
  private  readonly interactiveObjectProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public interactiveObjectProfile = this.interactiveObjectProfileStream.asObservable();
  private readonly petProfileStream = new ReplaySubject<DropdownValue[]>(1);
  public petProfile = this.petProfileStream.asObservable();


  public readonly isActiveOptions: DropdownValue[] = [
    {id: '1', value: this.translate.instant('GENERAL.ONLY_ACTIVE')},
    {id: '0', value: this.translate.instant('GENERAL.NOT_ACTIVE')},
  ];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
  ) {
    this.profilesService.profile
      .pipe(
        filter((profile: any) => !!profile),
        map((profile: Profile) => profile),
        distinctUntilChanged((x, y) => Utils.equals(x, y)),
      )
      .subscribe((profile) => {
        this.dbProfileWordContent = profile.databases.find(
          (dbProfile) => dbProfile.type === DataBaseType.world_content,
        ) as DataBaseProfile;
        this.dbProfileAdmin = profile.databases.find(
          (dbProfile) => dbProfile.type === DataBaseType.admin,
        ) as DataBaseProfile;
      });
  }

  public async getTasks(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${taskTable} WHERE isactive = 1`,
    );
    this.tasksStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getSpawnData(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${spawnDataTable} WHERE isactive = 1 and instance IS NULL`,
    );
    this.spawnDataStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getSpawnDataItem(id: number): Promise<DropdownValue | undefined> {
    const item = await this.databaseService.queryItem<MobsSpawnDataSettings>(
      this.dbProfileWordContent,
      spawnDataTable,
      'id',
      id,
    );
    return item ? {id: item.id as number, value: item.name} : undefined;
  }

  public async getInstances(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT id, island_name FROM ${instanceTemplateTable}`,
    );
    this.instancesStream.next(response.map((item: any) => ({id: item.id, value: item.island_name})));
  }

  public async getInstance(id: number): Promise<DropdownValue | undefined> {
    const item = await this.databaseService.queryItem<InstanceTemplate>(
      this.dbProfileAdmin,
      instanceTemplateTable,
      'id',
      id,
    );
    return item ? {id: item.id, value: item.island_name} : undefined;
  }

  public async getInstancesOption(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileAdmin,
      `SELECT id, island_name FROM ${instanceTemplateTable} WHERE islandType = 4`,
    );
    this.instancesOptionsStream.next(response.map((item: any) => ({id: item.id, value: item.island_name})));
  }

  public async getEffect(id: number): Promise<null | DropdownValue> {
    const item = await this.databaseService.queryItem<Effect>(this.dbProfileWordContent, effectsTable, 'id', id);
    return {id: item.id, value: item.name};
  }

  public async getEffects(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${effectsTable} WHERE isactive = 1`,
    );
    this.effectsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getItems(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${itemTemplatesTable} WHERE isactive = 1`,
    );
    this.itemsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getItem(id: number): Promise<null | DropdownValue> {
    const item = await this.databaseService.queryItem<Item>(this.dbProfileWordContent, itemTemplatesTable, 'id', id);
    if (!item) {
      return null;
    }
    return {id: item.id, value: item.name};
  }

  public async getWeaponItems(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${itemTemplatesTable} WHERE isactive = 1 and itemType = 'Weapon'`,
    );
    this.weaponsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getFactions(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${factionsTable} WHERE isactive = 1`,
    );
    this.factionsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getMobBehaviors(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${mobBehaviorProfileTable} WHERE isactive = 1`,
    );
    this.mobBehavbiorsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getFaction(id: number): Promise<DropdownValue | undefined> {
    const item = await this.databaseService.queryItem<Faction>(this.dbProfileWordContent, factionsTable, 'id', id);
    return item ? {id: item.id as number, value: item.name} : undefined;
  }

  public async getLootTables(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${lootTablesTable} WHERE isactive = 1`,
    );
    this.lootTableStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getLootTable(id: number): Promise<DropdownValue | undefined> {
    const item = await this.databaseService.queryItem<LootTable>(this.dbProfileWordContent, lootTablesTable, 'id', id);
    return item ? {id: item.id, value: item.name} : undefined;
  }

  public async getMerchants(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${merchantTable} WHERE isactive = 1`,
    );
    this.merchantsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getMerchantById(id: number): Promise<Merchant> {
    return await this.databaseService.queryItem<Merchant>(this.dbProfileWordContent, merchantTable, 'id', id);
  }

  public async getMobs(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${mobTemplateTable} WHERE isactive = 1`,
    );
    this.mobsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getBonusesSettings(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name, param FROM ${bonusesSettingsTable} WHERE isactive = 1`,
    );
    this.bonusSettingsStream.next(
      response.map((item: BonusSetting) => ({
        id: item.id,
        name: item.name,
        value: (item.param as string).includes('v'),
        percentage: (item.param as string).includes('p'),
      })),
    );
  }

  public async getBonusByCode(name: string): Promise<BonusSetting | null> {
    const item = await this.databaseService.queryItem<BonusSetting>(
      this.dbProfileWordContent,
      bonusesSettingsTable,
      'code',
      name,
    );
    if (!item) {
      return null;
    }
    return {
      id: item.id,
      name: item.name,
      value: (item.param as string).includes('v'),
      percentage: (item.param as string).includes('p'),
    };
  }

  public async getAchievements(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${achivementSettingsTable} WHERE isactive = 1`,
    );
    this.achievementsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getQuestById(id: number): Promise<Quest> {
    return await this.databaseService.queryItem<Quest>(this.dbProfileWordContent, questsTable, 'id', id);
  }

  public async getQuests(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${questsTable} WHERE isactive = 1`,
    );
    this.questsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getBuildObjects(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${buildObjectTable} WHERE isactive = 1`,
    );
    this.buildObjectsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getSkills(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${skillsTable} WHERE isactive = 1`,
    );
    this.skillsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getSkill(id: number): Promise<null | DropdownValue> {
    const item = await this.databaseService.queryItem<Skill>(this.dbProfileWordContent, skillsTable, 'id', id);
    return {id: item.id, value: item.name};
  }

  public async getEnchantProfiles(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT distinct id, Name FROM ${enchantProfileTable} WHERE isactive = 1`,
    );
    this.enchantProfilesStream.next(response.map((item: any) => ({id: item.id, value: item.Name})));
  }
  public async getWeaponProfiles(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT distinct id, Name FROM ${weaponTemplatesProfileTable} WHERE isactive = 1`,
    );
    this.weaponProfilesStream.next(response.map((item: any) => ({id: item.id, value: item.Name})));
  }
  public async getItemAudioProfiles(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT distinct id, Name FROM ${itemAudioProfileTable} WHERE isactive = 1`,
    );
    this.itemAudioProfilesStream.next(response.map((item: any) => ({id: item.id, value: item.Name})));
  }

  public async getCurrencies(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${currenciesTable} WHERE isactive = 1`,
    );
    this.currenciesStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getCurrencyById(id: number): Promise<Currency> {
    return await this.databaseService.queryItem<Currency>(this.dbProfileWordContent, currenciesTable, 'id', id);
  }

  public async getAbilities(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name, passive, toggle FROM ${abilitiesTable} WHERE isactive = 1`,
    );
    this.abilitiesStream.next(response.map((item: any) => ({id: item.id, value: item.name, passive: item.passive})));
    this.toggleAbilitiesStream.next(
      response.filter((item: any) => !!item.toggle).map((item: any) => ({id: item.id, value: item.name})),
    );
  }

  public async getAbilityById(id: number): Promise<Ability> {
    return await this.databaseService.queryItem<Ability>(this.dbProfileWordContent, abilitiesTable, 'id', id);
  }

  public async getAbility(id: number): Promise<null | DropdownValue> {
    const item = await this.databaseService.queryItem<Ability>(this.dbProfileWordContent, abilitiesTable, 'id', id);
    return {id: item.id as number, value: item.name};
  }

  public async getStats(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT name FROM ${statsTable} WHERE isactive = 1`,
    );
    this.statsStream.next(response.map((item: any) => ({id: item.name, value: item.name})));
  }
  public async getStatsId(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${statsTable} WHERE isactive = 1`,
    );
    this.statsIdStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getVitalityStats(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT name FROM ${statsTable} WHERE type = 2 AND isactive = 1`,
    );
    this.vitalityStatStream.next(response.map((item: any) => ({id: item.name, value: item.name})));
  }

  public async getCraftingRecipes(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${craftingRecipesTable} WHERE isactive = 1`,
    );
    this.craftingRecipesStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getNotUsedDialogues(exceptId: number[] = []): Promise<void> {
    let inceptIdSql = '';
    if (exceptId.length > 0) {
      inceptIdSql = ` OR (id IN (${exceptId.join(', ')}))`;
    }
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${dialogueTable} WHERE (isactive = 1 AND openingDialogue = 0 AND id NOT IN (SELECT actionID FROM ${dialogueActionsTable} WHERE isactive = 1 AND action = 'Dialogue'))${inceptIdSql}`,
    );
    this.dialogueNotUsedStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getDialogues(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${dialogueTable} WHERE isactive = 1`,
    );
    this.dialogueStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getDialogueById(id: number): Promise<Dialogue> {
    return await this.databaseService.queryItem<Dialogue>(this.dbProfileWordContent, dialogueTable, 'id', id);
  }

  public async getSkillProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, profile_name, type FROM ${skillProfileTable} WHERE isactive = 1`,
    );
    this.skillProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.profile_name, type: item.type})),
    );
  }

  public async getCoordinatedEffects(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${coordinatedEffectsTable} WHERE isactive = 1`,
    );
    this.coordinatedEffectsStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getDamages(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT name FROM ${damageTable} WHERE isactive = 1`,
    );
    this.damagesStream.next(response.map((item: any) => ({id: item.name, value: item.name})));
  }

  public async getPassiveEffects(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${effectsTable} WHERE isactive = 1 AND passive = 1`,
    );
    this.passiveEffectsStream.next(response.map((item: any) => ({id: item.name, value: item.name})));
  }

  public async getBonusSettingItem(id: number): Promise<BonusSetting> {
    const record = await this.databaseService.queryItem<BonusSetting>(
      this.dbProfileWordContent,
      bonusesSettingsTable,
      'id',
      id,
    );
    return {
      id: record.id,
      name: record.name,
      value: (record.param as string).includes('v'),
      percentage: (record.param as string).includes('p'),
      code: record.code,
      param: record.param,
      isactive: record.isactive,
    } as BonusSetting;
  }

  public async getAuctionProfiles(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${auctionProfileTable} WHERE isactive = 1`,
    );
    this.auctionProfileStream.next(response.map((item: AuctionHouseProfile) => ({id: item.id, value: item.name})));
  }

  public async getSlot(id: number): Promise<DropdownValue | undefined> {
    const item = await this.databaseService.queryItem<Slot>(this.dbProfileWordContent, slotsTable, 'id', id);
    if (!item) {
      return undefined;
    }
    return {id: item.id as number, value: item.name};
  }

  public async getSlotNames(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${slotsTable} WHERE isactive = 1 UNION SELECT id, name FROM ${slotsGroupTable} WHERE isactive = 1`,
    );
    this.slotNamesStream.next(response.map((item: any) => ({id: item.id, value: item.name})));
  }

  public async getSlotNamesByType(type: string): Promise<DropdownValue[]> {
    const list: EditorOptionChoice[] | undefined = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, choice FROM editor_option_choice where choice = '${type}' AND optionTypeID = (SELECT id FROM editor_option where optionType = 'Item Slot Type')`,
    );
    if (!list || list.length === 0) {
      return [];
    }
    const option: EditorOptionChoice = list[0];
    let result: DropdownValue[] = [];
    const slots: Slot[] = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name, type FROM ${slotsTable} WHERE isactive = 1`,
    );
    const usedSlots = [];
    for (const slot of slots) {
      const types = slot.type.split(';');
      if (types.indexOf(String(option.id)) !== -1) {
        usedSlots.push(slot);
      }
    }
    result = usedSlots.map((item) => ({id: item.name, value: item.name}));
    if (usedSlots.length > 0) {
      const usedSlotsIDs = usedSlots.map((item) => item.id).join(', ');
      const groups: SlotGroup[] = await this.databaseService.customQuery(
        this.dbProfileWordContent,
        `SELECT name FROM ${slotsGroupTable} WHERE isactive = 1 AND id IN (SELECT slot_group_id FROM ${slotsInGroupTable} where slot_id IN (${usedSlotsIDs}))`,
      );
      for (const group of groups) {
        result.push({id: group.name, value: group.name});
      }
    }
    return result;
  }

  public async getLevelXpRewardProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT reward_template_id, reward_template_name FROM ${levelXpRequirementsRewardTemplatesTable} WHERE isactive = 1`,
    );
    this.levelXpRewardProfileStream.next(
      response.map((item: any) => ({id: item.reward_template_id, value: item.reward_template_name})),
    );
  }

  public async getLevelXpProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT xpProfile, xpProfile_name FROM ${levelXpRequirementsTemplatesTable} WHERE isactive = 1`,
    );
    this.levelXpProfileStream.next(
      response.map((item: any) => ({id: item.xpProfile, value: item.xpProfile_name})),
    );
  }
  public async getAbilityTriggersProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${abilitiesTriggersProfileTable} WHERE isactive = 1`,
    );
    this.abilityTriggerProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.name})),
    );
  }
  public async getStatProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${statProfileTable} WHERE isactive = 1`,
    );
    this.statsProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.name})),
    );
  }

  public async getSlotsProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${slotsProfileTable} WHERE isactive = 1`,
    );
    this.slotsProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.name})),
    );
  }

  public async getInteractiveObjectProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${interactiveObjectProfileTable} WHERE isactive = 1`,
    );
    this.interactiveObjectProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.name})),
    );
  }

  public async getPetProfile(): Promise<void> {
    const response = await this.databaseService.customQuery(
      this.dbProfileWordContent,
      `SELECT id, name FROM ${petProfileTable} WHERE isactive = 1`,
    );
    this.petProfileStream.next(
      response.map((item: any) => ({id: item.id, value: item.name})),
    );
  }

}
