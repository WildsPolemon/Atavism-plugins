import {Injectable} from '@angular/core';
import {DialogConfig} from '../models/configs';
import {MatDialog} from '@angular/material/dialog';
import {DialogType} from '../models/types';
import {FormType, Profile} from '../settings/profiles/profile';
import {ProfilesFormComponent} from '../settings/profiles/profiles-form/profiles-form.component';
import {FormGroup} from '@angular/forms';
import {ProfilesService} from '../settings/profiles/profiles.service';
import {FuseConfirmDialogComponent} from '../../@fuse/components/confirm-dialog/confirm-dialog.component';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from './notification.service';
import {LoadingService} from '../components/loading/loading.service';
import {DatabaseService} from './database.service';
import {ElectronService} from './electron.service';
import {TablesService} from './tables.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileFormService {
  private dialogRef: DialogType<ProfilesFormComponent>;
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;
  private skipFirst = false;

  constructor(
    private readonly electronService: ElectronService,
    private readonly matDialog: MatDialog,
    private readonly profilesService: ProfilesService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
    private readonly loadingService: LoadingService,
    private readonly databaseService: DatabaseService,
    private readonly tablesService: TablesService,
  ) {}

  public openProfileWindow(formType: FormType, profile?: Profile, folder?: string): Promise<Profile | undefined> {
    return new Promise((resolve) => {
      this.dialogRef = this.matDialog.open(ProfilesFormComponent, {
        panelClass: DialogConfig.profileDialogOverlay,
        data: {
          action: formType,
          profile,
          folder,
        },
      });

      this.dialogRef.afterClosed().subscribe((response: FormGroup) => {
        if (!response) {
          resolve(undefined);
          return;
        }
        let updatedProfile;
        if (formType === FormType.new || formType === FormType.duplicate) {
          updatedProfile = this.profilesService.newProfile(this.profilesService.updateFolders(response.getRawValue()));
        } else if (formType === FormType.edit && profile) {
          const formData = this.profilesService.updateFolders(response.getRawValue());
          if (profile.folder !== formData.folder) {
            this.profilesService.copyProfileFile(profile.folder, formData.folder);
          }
          updatedProfile = this.profilesService.updateProfile(profile.id, {
            ...profile,
            ...formData,
          });
        }
        this.dialogRef = undefined;
        if (updatedProfile) {
          resolve(updatedProfile);
          return;
        } else {
          resolve(undefined);
          return;
        }
      });
    });
  }

  public async selectProfile(
    profile: Profile,
  ): Promise<'locked' | 'different_version' | 'read_problem' | 'profile_selected'> {
    const profileLocked = this.profilesService.checkIsProfileLocked(profile);
    if (profileLocked && !this.electronService.settings.serve) {
      this.notification.warn(this.translate.instant('PROFILES.PROFILE_LOCKED'));
      return 'locked';
    }
    if (profile.lastUsedVersion.length > 0 && profile.lastUsedVersion !== this.electronService.settings.version) {
      let confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      confirmDialogRef.componentInstance.confirmTitle = this.translate.instant('CONFIRM.START_CONFIRM_TITLE');
      confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.START_CONFIRM');
      confirmDialogRef.componentInstance.confirmAcceptButton = this.translate.instant('ACTIONS.START_CONFIRM');
      confirmDialogRef.componentInstance.confirmCancelButton = this.translate.instant('ACTIONS.CANCEL');
      const result = await confirmDialogRef.afterClosed().toPromise();
      confirmDialogRef = null;
      if (!result) {
        return 'different_version';
      }
    }
    const item = await this.profilesService.readProfileFile(profile);
    if (!item) {
      this.notification.error(this.translate.instant('PROFILES.PROFILE_FILE_MISSING'));
      return 'read_problem';
    }
    this.loadingService.show();
    this.profilesService.setProfile(item);
    this.notification.success(
      this.translate.instant('PROFILES.PROFILE_SELECTED', {
        name: profile.name,
      }),
    );
    if (this.skipFirst) {
      this.tablesService.reloadActiveTabStream.next(void 0);
    }
    this.skipFirst = true;
    return 'profile_selected';
  }

  public async showInfoClosePopup(result: string, folder: string): Promise<void> {
    this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: true,
    });
    this.confirmDialogRef.componentInstance.confirmTitle = ' ';
    this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant(
      'PROFILES.PROFILE_' + result.toUpperCase(),
    );
    this.confirmDialogRef.componentInstance.confirmAcceptButton = this.translate.instant('ACTIONS.QUIT');
    this.confirmDialogRef.componentInstance.showCancelButton = false;
    await this.confirmDialogRef.afterClosed().toPromise();
    await this.profilesService.removeLockFile(folder);
    const w = this.electronService.remote.getCurrentWindow();
    w.close();
  }
}
