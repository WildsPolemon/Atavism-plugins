import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {Platform} from '@angular/cdk/platform';
import {Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {FuseConfigService} from '@fuse/services/config.service';
import {TranslationService} from './settings/translation/translation.service';
import {FuseConfig} from '@fuse/types';
import {fuseConfig} from './fuse-config';
import {ProfilesService} from './settings/profiles/profiles.service';
import {ProfileSelectService} from './services/profile-select.service';
import {ProfileFormService} from './services/profile-form.service';
import {DataBaseProfile, DataBaseType, FormType, Profile} from './settings/profiles/profile';
import {LoadingService} from './components/loading/loading.service';
import {Router} from '@angular/router';
import {DatabaseService} from './services/database.service';
import {VersionCheckerService} from './services/version-checker.service';

@Component({
  selector: 'atv-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public fuseConfig: FuseConfig = fuseConfig;
  private destroyer = new Subject<void>();

  private keepAliveInterval: any;
  private dbProfile?: DataBaseProfile;

  constructor(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    @Inject(DOCUMENT) private document: any,
    private readonly profilesService: ProfilesService,
    private readonly _fuseConfigService: FuseConfigService,
    private readonly _platform: Platform,
    private readonly translationService: TranslationService,
    private readonly profileSelectService: ProfileSelectService,
    private readonly profileFormService: ProfileFormService,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly databaseService: DatabaseService,
    private readonly versionCheckerService: VersionCheckerService,
  ) {
    this.translationService.translationLoading();
    if (this._platform.ANDROID || this._platform.IOS) {
      this.document.body.classList.add('is-mobile');
    }
  }

  public ngOnInit(): void {
    this._fuseConfigService.config.pipe(takeUntil(this.destroyer)).subscribe((config: FuseConfig) => {
      this.fuseConfig = config;
      if (this.fuseConfig.layout.width === 'boxed') {
        this.document.body.classList.add('boxed');
      } else {
        this.document.body.classList.remove('boxed');
      }
      const classList = [...this.document.body.classList];
      for (let i = 0; i < classList.length; i += 1) {
        const className = classList[i];
        if (className.startsWith('theme-')) {
          this.document.body.classList.remove(className);
        }
        if (className.startsWith('font-size-')) {
          this.document.body.classList.remove(className);
        }
        if (className.startsWith('tooltip-font-size-')) {
          this.document.body.classList.remove(className);
        }
      }
      if (this.fuseConfig.colorTheme === 'theme-custom') {
        this.document.body.classList.add('theme-default');
        this.document.body.style.setProperty('--custom-main-color', this.fuseConfig.customColors.mainColor);
        this.document.body.style.setProperty('--custom-secondary-color', this.fuseConfig.customColors.secondaryColor);
        this.document.body.style.setProperty('--custom-text-color', this.fuseConfig.customColors.textColor);
        this.document.body.style.setProperty(
          '--custom-text-secondary-color',
          this.fuseConfig.customColors.textSecondaryColor,
        );
        this.document.body.style.setProperty('--custom-primary-color', this.fuseConfig.customColors.primaryColor);
        this.document.body.style.setProperty('--custom-accent-color', this.fuseConfig.customColors.accentColor);
        this.document.body.style.setProperty('--custom-warn-color', this.fuseConfig.customColors.warnColor);
      }
      this.document.body.classList.add(this.fuseConfig.colorTheme);
      this.document.body.classList.add(this.fuseConfig.fontSize);
      this.document.body.classList.add(this.fuseConfig.tooltipFontSize);
      if (this.fuseConfig.autoCheckForUpdate) {
        this.checkForUpdates();
      }
    });
    this.profilesService.profile.pipe(distinctUntilChanged(), takeUntil(this.destroyer)).subscribe((profile) => {
      if (!profile) {
        this.dbProfile = undefined;
        this.clearIntr();
        const folder = this.profilesService.folderPassed();
        if (folder) {
          this.profilesService.processWithFolder(folder).then((inputData) => {
            if (inputData.action === FormType.new) {
              this.profileFormService
                .openProfileWindow(inputData.action, inputData.profile, folder)
                .then((profileForUse) => {
                  if (profileForUse) {
                    this.selectProfile(profileForUse);
                  }
                });
            } else if (inputData.profile) {
              this.selectProfile(inputData.profile);
            }
          });
        } else {
          this.profileSelectService.showList();
        }
      } else {
        this.dbProfile = profile.databases.find((p) => p.type === DataBaseType.world_content) as DataBaseProfile;
        this.keepAliveInterval = setInterval(this.keepAlive, 60 * 1000 * 10);
      }
    });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private checkForUpdates(): void {
    setTimeout(() => {
      this.versionCheckerService.checkForUpdate().then();
    }, 2000);
  }

  private keepAlive() {
    if (this.dbProfile) {
      this.databaseService.customQuery(this.dbProfile, 'SELECT 1');
    }
  }

  private clearIntr() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
  }

  private selectProfile(profile: Profile) {
    this.profileFormService.selectProfile(profile).then((result) => {
      if (['locked', 'different_version', 'read_problem'].includes(result)) {
        this.profileFormService.showInfoClosePopup(result, profile.folder);
        return;
      } else {
        if (this.router.url === '/home') {
          void this.router.navigateByUrl('/');
        }
        this.loadingService.hide();
      }
    });
  }
}
