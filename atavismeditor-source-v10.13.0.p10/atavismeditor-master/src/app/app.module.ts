import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {FuseModule} from '@fuse/fuse.module';
import {FuseConfirmDialogModule, FuseProgressBarModule, FuseSidebarModule} from '@fuse/components';
import {FuseSharedModule} from '@fuse/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import {AppRoutingModule} from './app-routing.module';
import {MaterialModule} from '@fuse/material.module';
import {LayoutModule} from './layout/layout.module';
import {AppComponent} from './app.component';
import {fuseConfig} from './fuse-config';
import {FileManagerComponent} from './settings/file-manager/file-manager.component';
import {DatabaseActionsComponent} from './entry/database-actions/database-actions.component';
import {GameSettingComponent} from './entry/game-setting/game-setting.component';
import {WeatherProfilesComponent} from './entry/weather-profiles/weather-profiles.component';
import {OptionChoicesComponent} from './entry/option-choices/option-choices.component';
import {AccountsComponent} from './entry/accounts/accounts.component';
import {CurrenciesComponent} from './entry/currencies/currencies.component';
import {ItemsComponent} from './entry/items/items.component';
import {InstancesComponent} from './entry/instances/instances.component';
import {TaskComponent} from './entry/task/task.component';
import {BonusSettingsComponent} from './entry/bonus-settings/bonus-settings.component';
import {VipComponent} from './entry/vip/vip.component';
import {AchievementsComponent} from './entry/achievements/achievements.component';
import {RankingsComponent} from './entry/rankings/rankings.component';
import {CustomErrorHandler} from './logs/custom-error-handler';
import {LootTablesComponent} from './entry/loot-tables/loot-tables.component';
import {MobsComponent} from './entry/mobs/mobs.component';
import {MerchantComponent} from './entry/merchant/merchant.component';
import {FactionsComponent} from './entry/factions/factions.component';
import {QuestsComponent} from './entry/quests/quests.component';
import {DialogueComponent} from './entry/dialogue/dialogue.component';
import {PatrolPathComponent} from './entry/patrol-path/patrol-path.component';
import {MobsSpawnDataComponent} from './entry/mobs-spawn-data/mobs-spawn-data.component';
import {ReteDialogModule} from './entry/dialogue/rete-dialog/rete-dialog.module';
import {CraftingRecipesComponent} from './entry/crafting-recipes/crafting-recipes.component';
import {BuildObjectComponent} from './entry/build-object/build-object.component';
import {EffectsComponent} from './entry/effects/effects.component';
import {EnchantProfileComponent} from './entry/enchant-profile/enchant-profile.component';
import {ItemSetsComponent} from './entry/item-sets/item-sets.component';
import {DamageComponent} from './entry/damage/damage.component';
import {CoordinatedEffectsComponent} from './entry/coordinated-effects/coordinated-effects.component';
import {ArenaComponent} from './entry/arena/arena.component';
import {LevelXpComponent} from './entry/level-xp/level-xp.component';
import {StatComponent} from './entry/stat/stat.component';
import {SkillsComponent} from './entry/skills/skills.component';
import {SkillProfilesComponent} from './entry/skill-profiles/skill-profiles.component';
import {AbilitiesComponent} from './entry/ability/abilities.component';
import {PlayerCharacterComponent} from './entry/player-character/player-character.component';
import {PopoverModule} from 'ngx-smart-popover';
import {ProfilesModule} from './settings/profiles/profiles.module';
import {HomeComponent} from './home/home.component';
import {ThresholdsComponent} from './entry/thresholds/thresholds.component';
import {EffectsTriggersComponent} from './entry/effects-triggers/effects-triggers.component';
import {AbilitiesTriggersComponent} from './entry/abilities-triggers/abilities-triggers.component';
import {GuildLevelComponent} from './entry/guild/guild-level.component';
import {AddButtonComponent} from './entry/add-button/add-button.component';
import {ClaimProfileComponent} from './entry/claim-profile/claim-profile.component';
import {AuctionProfileComponent} from './entry/auction-profile/auction-profile.component';
import {SlotComponent} from './entry/slot/slot.component';
import {SlotGroupComponent} from './entry/slot-group/slot-group.component';
import {ResourceNodeProfileComponent} from './entry/resource-node-profile/resource-node-profile.component';
import {GlobalEventsComponent} from './entry/global-events/global-events.component';
import {ElectronService} from './services/electron.service';
import {VersionPopupComponent} from './settings/version-popup/version-popup.component';
import {MobBehaviorProfileComponent} from './entry/mob-behavior-profile/mob-behavior-profile.component';
import {MobBehaviorProfileFormComponent} from './entry/mob-behavior-profile/mob-behavior-profile-form/mob-behavior-profile-form.component';
import {LevelXpProfileComponent} from './entry/level-xp-profile/level-xp-profile.component';
import {LevelXpRewardsProfileComponent} from './entry/level-xp-rewards-profile/level-xp-rewards-profile.component';
import {WeaponProfileComponent} from './entry/weapon-profile/weapon-profile.component';
import {ItemAudioProfileComponent} from './entry/item-audio-profile/item-audio-profile.component';
import {StatsProfileComponent} from './entry/stats-profile/stats-profile.component';
import {InteractiveObjectProfileComponent} from './entry/interactive-object-profile/interactive-object-profile.component';
import {PetProfileComponent} from './entry/pet-profile/pet-profile.component';
import {SlotProfileComponent} from './entry/slot-profile/slot-profile.component';
import {PvpRanksComponent} from './entry/pvp-ranks/pvp-ranks.component';
import {ClassAbilityByLevelComponent} from './entry/class-ability-by-level/class-ability-by-level.component';

@NgModule({
  declarations: [
    AppComponent,
    AccountsComponent,
    CurrenciesComponent,
    ItemsComponent,
    InstancesComponent,
    TaskComponent,
    FileManagerComponent,
    DatabaseActionsComponent,
    GameSettingComponent,
    WeatherProfilesComponent,
    OptionChoicesComponent,
    BonusSettingsComponent,
    VipComponent,
    AchievementsComponent,
    RankingsComponent,
    LootTablesComponent,
    MobsComponent,
    MerchantComponent,
    FactionsComponent,
    QuestsComponent,
    DialogueComponent,
    PatrolPathComponent,
    MobsSpawnDataComponent,
    CraftingRecipesComponent,
    BuildObjectComponent,
    EffectsComponent,
    EnchantProfileComponent,
    ItemSetsComponent,
    DamageComponent,
    CoordinatedEffectsComponent,
    ArenaComponent,
    LevelXpComponent,
    StatComponent,
    SkillsComponent,
    SkillProfilesComponent,
    AbilitiesComponent,
    PlayerCharacterComponent,
    ClassAbilityByLevelComponent,
    HomeComponent,
    ThresholdsComponent,
    EffectsTriggersComponent,
    AbilitiesTriggersComponent,
    GuildLevelComponent,
    AddButtonComponent,
    ClaimProfileComponent,
    AuctionProfileComponent,
    SlotComponent,
    SlotGroupComponent,
    ResourceNodeProfileComponent,
    GlobalEventsComponent,
    VersionPopupComponent,
    MobBehaviorProfileComponent,
    MobBehaviorProfileFormComponent,
    LevelXpProfileComponent,
    LevelXpRewardsProfileComponent,
    WeaponProfileComponent,
    ItemAudioProfileComponent,
    StatsProfileComponent,
    InteractiveObjectProfileComponent,
    PetProfileComponent,
    SlotProfileComponent,
    PvpRanksComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    MaterialModule,
    ReteDialogModule,
    FuseModule.forRoot(fuseConfig),
    FuseProgressBarModule,
    FuseSharedModule,
    FuseSidebarModule,
    FuseConfirmDialogModule,
    PopoverModule,
    LayoutModule,
    ProfilesModule,
  ],
  providers: [ElectronService, {provide: ErrorHandler, useClass: CustomErrorHandler}],
  bootstrap: [AppComponent],
})
export class AppModule {}
