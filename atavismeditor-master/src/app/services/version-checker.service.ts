import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ElectronService} from './electron.service';
import fetch from 'electron-fetch';
import {DialogConfig} from '../models/configs';
import {FuseConfirmDialogComponent} from '../../@fuse/components/confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {LogService} from '../logs/log.service';

interface Version {
  mac: string;
  win: string;
  linux: string;
}

type VersionList = Record<string, Record<string, Version>>;

@Injectable({
  providedIn: 'root',
})
export class VersionCheckerService {
  constructor(
    private readonly http: HttpClient,
    private readonly electronService: ElectronService,
    private readonly matDialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly logService: LogService,
  ) {}

  async checkForUpdate(): Promise<string> {
    const version = this.electronService.settings.version;
    const mainVersion = version.split('p')[0];
    const patchVersion = Number(version.split('p')[1] ?? '');
    try {
      const versionsList = await this.getAvailableVersions();
      if (versionsList) {
        const availableVersions = versionsList[mainVersion];
        if (availableVersions) {
          const availableVersionsKeys = Object.keys(availableVersions)
            .map((v) => Number(v.split('p')[1] ?? ''))
            .filter((v) => v > patchVersion);
          if (availableVersionsKeys.length > 0) {
            const lastPatch = availableVersionsKeys[availableVersionsKeys.length - 1];
            const availableVersion = availableVersions[mainVersion + 'p' + lastPatch];
            if (availableVersion) {
              let versionUrl = '';
              if (this.electronService.isWindows) {
                versionUrl = availableVersion.win;
              } else if (this.electronService.isLinux) {
                versionUrl = availableVersion.linux;
              } else if (this.electronService.isMacOS) {
                versionUrl = availableVersion.mac;
              }
              if (versionUrl) {
                const url = await this.showConfirmPopup(versionUrl);
                if (url) {
                  await this.electronService.shell.openExternal(url);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
    return '';
  }

  private showConfirmPopup(url: string): Promise<string> {
    return new Promise((resolve) => {
      let confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
        panelClass: DialogConfig.confirmDialogOverlay,
        disableClose: false,
      });
      confirmDialogRef.componentInstance.confirmTitle = this.translate.instant('CONFIRM.UPDATE_TITLE');
      confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.UPDATE_TEXT');
      confirmDialogRef.componentInstance.confirmAcceptButton = this.translate.instant('ACTIONS.DOWNLOAD_UPDATE');
      confirmDialogRef.afterClosed().subscribe((result) => {
        if (result) {
          resolve(url);
        }
        confirmDialogRef = undefined;
        resolve('');
      });
    });
  }

  private getAvailableVersions(): Promise<VersionList> {
    return new Promise((resolve) => {
      fetch('https://atavismonline.com/editor-manifest/release.json')
        .then((res) => res.text())
        .then((body) => {
          if (body) {
            resolve(JSON.parse(body) as VersionList);
          }
          resolve({} as VersionList);
        })
        .catch(() => resolve({} as VersionList));
    });
  }
}
