import {Injectable} from '@angular/core';
import {ProfilesService} from '../profiles/profiles.service';
import {ReplaySubject, Subject} from 'rxjs';
import {Profile, ProfileType} from '../profiles/profile';
import {FileItem, metaFileExtension} from './file-manager.interfaces';
import {StorageKeys, StorageService} from '../../services/storage.service';
import {LoadingService} from '../../components/loading/loading.service';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from '../../services/notification.service';
import {distinctPipe} from '../../directives/utils';
import {ElectronService} from '../../services/electron.service';
import * as fs from 'fs';
import * as path from 'path';
import {ipcRenderer} from 'electron';

const allowedExceptions = ['.png', '.gif', '.jpg', '.jpeg', '.psd', '.tga', '.bmp'];

@Injectable({
  providedIn: 'root',
})
export class FileManagerService {
  private readonly fs: typeof fs;
  private readonly path: typeof path;
  private readonly destroyer = new Subject<void>();
  private profile: Profile | undefined;
  public syncInProgress = false;
  private ipc: typeof ipcRenderer;
  private readonly fileStream = new ReplaySubject<FileItem[]>(1);
  public files = this.fileStream.asObservable();

  constructor(
    private readonly electronService: ElectronService,
    private readonly profilesService: ProfilesService,
    private readonly loadingService: LoadingService,
    private readonly storageService: StorageService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
  ) {
    if (this.electronService.isElectron) {
      this.fs = this.electronService.fs;
      this.path = this.electronService.path;
      this.ipc = this.electronService.ipcRenderer;
      this.ipc.on(
        'sync-worker-next',
        (
          _,
          response: {
            list: FileItem[];
            error: string;
            in_progress: boolean;
            done: boolean;
          },
        ) => {
          this.syncInProgress = response.in_progress;
          if (response.done && !response.error) {
            this.handleResponse(response.list);
          } else if (response.done && response.error) {
            this.notification.error(this.translate.instant('FILE_MANAGER.SYNC_ERROR'));
            this.notification.error(response.error);
          }
        },
      );
    }
    this.profilesService.profile.pipe(distinctPipe(this.destroyer)).subscribe((profile) => {
      this.profile = profile;
      if (this.profile) {
        if (this.syncInProgress) {
          this.cancelSyncWorker();
        }
        setTimeout(() => this.startSyncWorker());
      }
    });
    const list = this.storageService.get<FileItem[]>(StorageKeys.storageMetaFilteredFilesKey);
    if (list) {
      this.fileStream.next(list);
    }
  }

  public async checkFoldersSync(): Promise<void> {
    if (this.syncInProgress) {
      this.loadingService.hide();
      this.notification.error(this.translate.instant('FILE_MANAGER.SYNC_ALREADY_WORKS'));
      return;
    }
    if (this.fs && this.path && this.profile) {
      try {
        const syncFolder = this.profile.folder + this.profile.syncFolder;
        if (syncFolder) {
          const list = await this.readFolderSync(syncFolder);
          this.fileStream.next(list);
          this.storageService.set<FileItem[]>(StorageKeys.storageMetaFilteredFilesKey, list);
          this.loadingService.hide();
          this.notification.success(this.translate.instant('FILE_MANAGER.SYNC_COMPLETE'));
        } else {
          this.loadingService.hide();
          this.notification.error(this.translate.instant('FILE_MANAGER.FOLDER_NOT_SETUP'));
        }
      } catch (e) {
        this.loadingService.hide();
        this.notification.error(this.translate.instant('FILE_MANAGER.SYNC_ERROR'));
      }
    }
  }

  private handleResponse(list: FileItem[] = []) {
    if (!list) {
      list = [];
    }
    this.fileStream.next(list);
    this.storageService.set<FileItem[]>(StorageKeys.storageMetaFilteredFilesKey, list);
    this.notification.success(this.translate.instant('FILE_MANAGER.SYNC_COMPLETE'));
  }

  public startSyncWorker(): void {
    if (!this.syncInProgress) {
      const syncFolder = (this.profile as Profile).folder + (this.profile as Profile).syncFolder;
      if (syncFolder) {
        this.syncInProgress = true;
        this.ipc.send('start-sync-worker', {
          folder: syncFolder,
          meta: (this.profile as Profile).meta,
        });
      } else {
        this.notification.error(this.translate.instant('FILE_MANAGER.FOLDER_NOT_SETUP'));
      }
    } else {
      this.notification.error(this.translate.instant('FILE_MANAGER.SYNC_ALREADY_WORKS'));
    }
  }

  public cancelSyncWorker(): void {
    this.syncInProgress = false;
    this.ipc.send('cancel-sync-worker');
  }

  private async readFolderSync(folder: string): Promise<FileItem[]> {
    let result: FileItem[] = [];
    const list = this.fs.readdirSync(folder);
    for (const file of list) {
      const folderFile = this.path.resolve(folder, file);
      const fileStat = await this.fs.statSync(folderFile);
      if (fileStat && fileStat.isDirectory()) {
        const files = await this.readFolderSync(folderFile);
        result = [...result, ...files];
      } else {
        if (await this.checkFileSync(folderFile)) {
          const checkedFile = folderFile.replace(metaFileExtension, '');
          const extension = this.path.extname(checkedFile);
          let relativePath = checkedFile.replace((this.profile as Profile).folder, '');
          if (relativePath[0] === '/') {
            relativePath = relativePath.slice(1);
          }
          result.push({
            path: checkedFile,
            relative_path: relativePath,
            title: this.path.basename(checkedFile, extension),
            name: this.path.basename(checkedFile),
            ext: extension.replace('.', '').toLowerCase(),
          });
        }
      }
    }
    return result;
  }

  private async checkFileSync(folderFile: string): Promise<boolean> {
    if (this.profile.type === ProfileType.Unity) {
      if (this.path.extname(folderFile) !== metaFileExtension) {
        return false;
      }
      const originalFile = folderFile.replace(metaFileExtension, '');
      const originalExtension = this.path.extname(originalFile);
      if (!allowedExceptions.includes(originalExtension.toLowerCase()) || !this.fs.existsSync(originalFile)) {
        return false;
      }
      const fileContent = await this.fs.readFileSync(folderFile, {
        encoding: 'utf-8',
      });
      return fileContent.toLowerCase().indexOf((this.profile as Profile).meta.toLowerCase()) !== -1;
    } else if (this.profile.type === ProfileType.Unreal) {
      const originalExtension = this.path.extname(folderFile);
      if (!allowedExceptions.includes(originalExtension.toLowerCase())) {
        return false;
      }
      return true;
    }
    return false
  }
}
