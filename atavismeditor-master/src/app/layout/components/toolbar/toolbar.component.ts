import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {interval, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {FuseConfigService} from '@fuse/services/config.service';
import {FuseSidebarService} from '@fuse/components/sidebar/sidebar.service';
import {FuseSidebarComponent} from '@fuse/components/sidebar/sidebar.component';
import {FuseConfig} from '@fuse/types';
import {Router} from '@angular/router';
import {ProfilesService} from '../../../settings/profiles/profiles.service';
import {FormType, Profile} from '../../../settings/profiles/profile';
import {TranslationService} from '../../../settings/translation/translation.service';
import {FileManagerService} from '../../../settings/file-manager/file-manager.service';
import {ServerService, ServerStatus} from './server.service';
import {LogService} from '../../../logs/log.service';
import {Utils} from '../../../directives/utils';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../../services/notification.service';
import {ProfileFormService} from '../../../services/profile-form.service';
import {ElectronService} from '../../../services/electron.service';
import {VersionCheckerService} from '../../../services/version-checker.service';
import {DialogConfig} from '../../../models/configs';
import {MatDialog} from '@angular/material/dialog';
import {VersionPopupComponent} from '../../../settings/version-popup/version-popup.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarComponent implements OnInit, OnDestroy {
  public horizontalNavbar = false;
  public rightNavbar = false;
  public hiddenNavbar = false;
  public ServerStatus = ServerStatus;
  private destroyer = new Subject<void>();
  public profile: Profile | undefined;
  public translations = this.translationService.translations.pipe(
    map((translations) => translations.filter((translation) => !translation.selected)),
    takeUntil(this.destroyer),
  );
  public selectedTranslation = this.translationService.translation.pipe(takeUntil(this.destroyer));
  public version = '';
  public dbVersion = '';
  public serverVersion = '';
  public serverButtonsDisabled = false;
  public oneProfileMode = false;
  public authServerStatus = false;
  public restartServerStatus = false;
  public worldServerStatus = false;

  constructor(
    private readonly router: Router,
    private readonly profilesService: ProfilesService,
    private readonly fuseConfigService: FuseConfigService,
    private readonly fuseSidebarService: FuseSidebarService,
    private readonly translationService: TranslationService,
    private readonly fileManagerService: FileManagerService,
    public readonly serverService: ServerService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
    private readonly logs: LogService,
    private readonly profileFormService: ProfileFormService,
    private readonly electronService: ElectronService,
    private readonly versionCheckerService: VersionCheckerService,
    private readonly matDialog: MatDialog,
  ) {
    this.oneProfileMode = this.profilesService.oneProfileMode;
  }

  public ngOnInit(): void {
    this.version = this.electronService.settings.version;
    this.fuseConfigService.config.pipe(takeUntil(this.destroyer)).subscribe((settings: FuseConfig) => {
      this.horizontalNavbar = settings.layout.navbar.position === 'top';
      this.rightNavbar = settings.layout.navbar.position === 'right';
      this.hiddenNavbar = settings.layout.navbar.hidden;
    });
    this.profilesService.profile
      .pipe(
        distinctUntilChanged((x, y) => Utils.equals(x, y)),
        takeUntil(this.destroyer),
      )
      .subscribe((profile) => {
        this.profile = profile;
      });
    this.serverService.authServerStatus.pipe(takeUntil(this.destroyer)).subscribe((status) => {
      this.authServerStatus = status;
    });
    this.serverService.restartServerStatus.pipe(takeUntil(this.destroyer)).subscribe((status) => {
      this.restartServerStatus = status;
    });
    this.serverService.worldServerStatus.pipe(takeUntil(this.destroyer)).subscribe((status) => {
      this.worldServerStatus = status;
    });
    this.serverService.dbVersionStatus.pipe(takeUntil(this.destroyer)).subscribe((ver) => {
      this.dbVersion = ver;
    });
    this.serverService.serverVersionStatus.pipe(takeUntil(this.destroyer)).subscribe((ver) => {
      this.serverVersion = ver;
    });

    interval(2500)
      .pipe(takeUntil(this.destroyer))
      .subscribe(() => {
        if (this.profile) {
          this.serverService.checkServerStatus();
        }
      });

    interval(25000)
      .pipe(
        filter(() => !!this.profile),
        takeUntil(this.destroyer),
      )
      .subscribe(() => {
        this.profilesService.updateUsedProfile(this.profile as Profile);
      });
  }

  public async serverStatusUpdate(status: ServerStatus): Promise<void> {
    await this.serverService.addServerStatus(status);
  }

  public get syncInProgress(): boolean {
    return this.fileManagerService.syncInProgress;
  }

  public toggleSidebarOpen(key: string): void {
    (this.fuseSidebarService.getSidebar(key) as FuseSidebarComponent).toggleOpen();
  }

  public changeTranslation(id: string): void {
    this.translationService.selected(id);
  }

  public redirectTo(url: string): Promise<boolean> {
    return this.router.navigate([url]);
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public startWorker(): void {
    this.fileManagerService.startSyncWorker();
  }

  public async changeProfiles(): Promise<void> {
    if (this.profile) {
      await this.profilesService.removeLockFile(this.profile.folder);
    }
    this.profilesService.clearSelectedProfile();
  }

  public async editProfile(): Promise<void> {
    const profile = await this.profilesService.readProfileFile(this.profile as Profile);
    if (!profile) {
      this.notification.error(this.translate.instant('PROFILES.PROFILE_FILE_MISSING'));
      return;
    }
    const result = await this.profileFormService.openProfileWindow(FormType.edit, profile);
    if (result) {
      this.profilesService.setProfileStream(result);
      this.notification.success(this.translate.instant('PROFILES.UPDATE_SUCCESS'));
    }
  }

  public async checkForUpdates(): Promise<void> {
    await this.versionCheckerService.checkForUpdate();
  }

  public async closeApp(): Promise<void> {
    if (this.profile) {
      await this.profilesService.removeLockFile(this.profile.folder);
    }
    const w = this.electronService.remote.getCurrentWindow();
    w.close();
  }

  public openLogsFolder(): void {
    this.logs.openLogsFolder(undefined);
  }

  public clearLogsFolder(): void {
    this.logs.clearLogsFolder(undefined);
  }

  public onMenuOpened(): void {
    const overlayBackdrop = document.querySelector('.menu-custom-overlay');
    if (overlayBackdrop) {
      overlayBackdrop.parentElement.classList.add('cdk-overlay-container-custom');
    }
  }

  public onMenuClosed(): void {
    const overlayBackdrop = document.querySelector('.menu-custom-overlay');
    if (overlayBackdrop) {
      overlayBackdrop.parentElement.classList.remove('cdk-overlay-container-custom');
    }
  }

  showVersionScreen() {
    let dialogRef = this.matDialog.open(VersionPopupComponent, {
      panelClass: [DialogConfig.fullDialogOverlay, 'mat-dialog-profiles'],
      hasBackdrop: true,
      disableClose: false,
    });
    dialogRef.afterClosed().subscribe(() => {
      dialogRef = undefined;
    });
  }
}
