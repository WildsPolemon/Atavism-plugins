import {Injectable, OnDestroy} from '@angular/core';
import {ProfilesService} from '../settings/profiles/profiles.service';
import {skip, takeUntil} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {DialogType} from '../models/types';
import {FuseConfirmDialogComponent} from '../../@fuse/components/confirm-dialog/confirm-dialog.component';
import {DialogConfig} from '../models/configs';
import {NotificationService} from '../services/notification.service';
import {TranslateService} from '@ngx-translate/core';
import {Profile} from '../settings/profiles/profile';
import {ElectronService} from '../services/electron.service';
import * as fs from 'fs';
import * as path from 'path';
import {Subject} from 'rxjs';
import * as logs from 'electron-log';

const MAXSIZE_LOG_FILE = 1024 * 1024;

@Injectable({
  providedIn: 'root',
})
export class LogService implements OnDestroy {
  private loggerProfile: Record<string, any> = {};
  private loggerBase: any;
  private useBaseProfile = true;
  private profileId!: string;
  private readonly fs: typeof fs;
  private readonly path: typeof path;
  private readonly version: string = '001';
  private logFolder = '';
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;
  private readonly destroyer = new Subject<void>();

  constructor(
    private readonly electronService: ElectronService,
    private readonly profilesService: ProfilesService,
    private readonly matDialog: MatDialog,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
  ) {
    if (this.electronService.isElectron) {
      const settings = this.electronService.settings;
      this.version = settings.version;
      this.loggerBase = logs;
      this.fs = this.electronService.fs;
      this.path = this.electronService.path;
      this.setupBaseLogger(settings.userDataPath, `/logs/AtavismEditor_base_${settings.version}.log`);
      this.profilesService.profile.pipe(skip(1), takeUntil(this.destroyer)).subscribe((profile) => {
        if (profile) {
          this.useBaseProfile = false;
          this.profileId = profile.id.slice(0, 8);
          const mainFolder = this.path.join(profile.folder, `/logs/`);
          if (!this.fs.existsSync(mainFolder)) {
            this.fs.mkdirSync(mainFolder);
          }
          this.logFolder = this.path.join(profile.folder, `/logs/${this.profileId}/`);
          if (!this.fs.existsSync(this.logFolder)) {
            this.fs.mkdirSync(this.logFolder);
          }
          const logFile = this.path.join(this.logFolder, `${this.profileId}_AtavismEditor.log`);
          if (!this.fs.existsSync(logFile)) {
            this.fs.closeSync(this.fs.openSync(logFile, 'w'));
          }
          this.loggerProfile[this.profileId] = this.reSetupLogger(
            this.loggerBase.create(`profileLogger${this.profileId}`),
            profile.folder,
            `/logs/${this.profileId}/${this.profileId}_AtavismEditor.log`,
          );
        } else {
          this.useBaseProfile = true;
        }
      });
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public log(...messages: any): void {
    if (!this.useBaseProfile) {
      this.loggerProfile[this.profileId].log(`[${this.version}]`, ...messages);
    } else {
      this.loggerBase.log(`[${this.version}]`, ...messages);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public error(...messages: any): void {
    if (!this.useBaseProfile) {
      this.loggerProfile[this.profileId].error(`[${this.version}]`, ...messages);
    } else {
      this.loggerBase.error(`[${this.version}]`, ...messages);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public warn(...messages: any): void {
    if (!this.useBaseProfile) {
      this.loggerProfile[this.profileId].warn(`[${this.version}]`, ...messages);
    } else {
      this.loggerBase.warn(`[${this.version}]`, ...messages);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public info(...messages: any): void {
    if (!this.useBaseProfile) {
      this.loggerProfile[this.profileId].info(`[${this.version}]`, ...messages);
    } else {
      this.loggerBase.info(`[${this.version}]`, ...messages);
    }
  }

  public openLogsFolder(profile: Profile | undefined): void {
    if (profile) {
      const mainLogFolder = this.path.join(profile.folder, `/logs/`);
      if (!this.fs.existsSync(mainLogFolder)) {
        this.fs.mkdirSync(mainLogFolder);
      }
      const logFolder = this.path.join(mainLogFolder, `${profile.id.slice(0, 8)}/`);
      if (!this.fs.existsSync(logFolder)) {
        this.fs.mkdirSync(logFolder);
      }
      const logFile = this.path.join(logFolder, `${profile.id}_AtavismEditor.log`);
      if (!this.fs.existsSync(logFile)) {
        this.fs.openSync(logFile, 'w');
      }
      this.electronService.remote.shell.openPath(logFolder);
    } else {
      if (!this.fs.existsSync(this.logFolder)) {
        this.fs.mkdirSync(this.logFolder);
      }
      this.electronService.remote.shell.openPath(this.logFolder);
    }
  }

  public clearLogsFolder(profile: Profile | undefined): void {
    this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmTitle = this.translate.instant('CONFIRM.START_CONFIRM_TITLE');
    this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.CLEAR_LOGS');
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeLogs(profile);
        this.notification.success(this.translate.instant('PROFILES.REMOVE_SUCCESS'));
      }
      this.confirmDialogRef = undefined;
    });
  }

  private removeLogs(profile: Profile | undefined): void {
    if (profile) {
      const logFolder = this.path.join(profile.folder, `/logs/${profile.id.slice(0, 8)}/`);
      this.fs.rmdirSync(logFolder, {recursive: true});
    } else {
      this.fs.rmdirSync(this.logFolder, {recursive: true});
    }
  }

  private reSetupLogger(logger: any, directory: string, logFileName: string) {
    logger.transports.file.level = 'info';
    logger.transports.file.maxSize = MAXSIZE_LOG_FILE;
    logger.transports.file.resolvePath = () => this.path.join(directory, logFileName);
    logger.transports.file.archiveLog = (file: string) => {
      file = file.toString();
      const info = this.path.parse(file);
      const files = this.fs.readdirSync(info.dir);
      let lastUsed = 0;
      for (const logFile of files) {
        if (logFile.indexOf(logFileName) !== -1) {
          const logFileInfo = this.path.parse(logFile);
          let neededThings = logFileInfo.base.replace(logFileName, '');
          if (neededThings !== logFileInfo.ext) {
            neededThings = neededThings.replace(logFileInfo.ext, '');
            lastUsed = +neededThings.replace('_', '');
            if (isNaN(lastUsed)) {
              lastUsed = parseInt(neededThings, 10);
            }
            lastUsed++;
          }
        }
      }
      let archiveFile = this.path.join(info.dir, info.name + '_' + lastUsed + info.ext);
      if (this.fs.existsSync(archiveFile)) {
        archiveFile = this.path.join(info.dir, info.name + '_' + (lastUsed + 1) + info.ext);
      }
      this.fs.renameSync(file, archiveFile);
    };
    return logger;
  }

  private setupBaseLogger(directory: string, logFileName: string) {
    this.loggerBase.transports.file.level = 'info';
    this.loggerBase.transports.file.maxSize = 5 * MAXSIZE_LOG_FILE;
    const self = this;
    this.loggerBase.transports.file.resolvePath = () => self.path.join(directory, logFileName);
    this.loggerBase.transports.file.archiveLog = function (file: string) {
      file = file.toString();
      const info = self.path.parse(file);
      const files = self.fs.readdirSync(info.dir);
      let lastUsed = 0;
      for (const logFile of files) {
        if (logFile.indexOf(logFileName) !== -1) {
          const logFileInfo = self.path.parse(logFile);
          let neededThings = logFileInfo.base.replace(logFileName, '');
          if (neededThings !== logFileInfo.ext) {
            neededThings = neededThings.replace(logFileInfo.ext, '');
            lastUsed = +neededThings.replace('_', '');
            if (isNaN(lastUsed)) {
              lastUsed = parseInt(neededThings, 10);
            }
            lastUsed++;
          }
        }
      }
      let archiveFile = self.path.join(info.dir, info.name + '_' + lastUsed + info.ext);
      if (self.fs.existsSync(archiveFile)) {
        archiveFile = self.path.join(info.dir, info.name + '_' + (lastUsed + 1) + info.ext);
      }
      self.fs.renameSync(file, archiveFile);
    };
  }
}
