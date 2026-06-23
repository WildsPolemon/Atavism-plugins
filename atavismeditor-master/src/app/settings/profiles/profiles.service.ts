import {Injectable} from '@angular/core';
import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {DataBaseProfile, DataBaseType, FormType, Profile} from './profile';
import * as moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {j2xParser, parse} from 'fast-xml-parser';
import {Utils} from '../../directives/utils';
import {ipcRenderer} from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {ElectronService} from '../../services/electron.service';

const profileFileName = 'atavismeditorprofile.xml';
const lockFileName = 'atavismeditor.lock';

export interface InputData {
  action: FormType;
  profile?: Profile;
  folder?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfilesService {
  public list: Partial<Profile>[] = [];
  public oneProfileMode = false;
  private readonly profilesStream = new ReplaySubject<Partial<Profile>[]>(1);
  public profiles = this.profilesStream.asObservable();
  private readonly profileStream = new BehaviorSubject<Profile | undefined>(undefined);
  public profile = this.profileStream.asObservable();
  private selectedProfile: Profile | undefined = undefined;
  private readonly fs: typeof fs;
  private readonly path: typeof path;
  private readonly profilesFile: string = '';
  private readonly appVersion: string = '';
  private readonly settingsFolder: string = '';
  private readonly ipcRenderer: typeof ipcRenderer;

  constructor(private readonly electronService: ElectronService) {
    if (this.electronService.isElectron) {
      this.fs = this.electronService.fs;
      this.path = this.electronService.path;
      this.ipcRenderer = this.electronService.ipcRenderer;
      this.profilesFile = this.electronService.settings.userDataPath + '/atavism-profiles.xml';
      this.appVersion = this.electronService.settings.version;
      this.settingsFolder = this.electronService.settings.folder;
    }
  }

  public folderPassed(): string {
    this.oneProfileMode = !!this.settingsFolder;
    return this.settingsFolder;
  }

  public async processWithFolder(folder: string): Promise<InputData> {
    const lastChar = folder[folder.length - 1];
    const profileFile = folder + (lastChar !== '/' ? '/' : '') + profileFileName;
    await this.getList();
    if (this.fs.existsSync(profileFile)) {
      const profileXml = this.fs.readFileSync(profileFile, 'utf8');
      const profile = parse(profileXml);
      if (this.list.filter((prf) => prf.id === profile.id).length > 0) {
        const saved = this.list.find((item) => item.id === profile.id) as Profile;
        this.list[this.list.indexOf(saved)] = profile;
      } else {
        this.list.push(profile);
      }
      this.updateProfiles();
      return {
        action: FormType.edit,
        profile,
      };
    }
    return {
      action: FormType.new,
      profile: undefined,
    };
  }

  public async getList(): Promise<void> {
    if (!this.profilesFile || !this.fs.existsSync(this.profilesFile)) {
      this.profilesStream.next([]);
      return;
    }
    try {
      const profilesXml = this.fs.readFileSync(this.profilesFile, 'utf8');
      const result = parse(profilesXml, {arrayMode: true});
      if (result) {
        this.list = await this.parseList(result.list);
        if (!Utils.equals(result.list, this.list)) {
          this.updateProfiles();
        }
      }
      this.profilesStream.next([...this.list]);
    } catch (_) {
      if (this.fs.existsSync(this.profilesFile)) {
        this.fs.unlinkSync(this.profilesFile);
      }
      this.profilesStream.next([]);
    }
  }

  public setProfile(profile: Profile): void {
    const saved = this.list.find((item) => item.id === profile.id) as Profile;
    profile.lastUsedVersion = this.appVersion;
    profile.lastUsed = this.getTimestampNow();
    this.list[this.list.indexOf(saved)] = profile;
    this.updateProfiles();
    this.saveProfileFile(profile);
    this.setProfileStream(profile);
    const lockFile = this.path.join(profile.folder, lockFileName);
    this.ipcRenderer.send('lock_file_update', {lockFile});
  }

  public setProfileStream(profile: Profile | undefined): void {
    this.selectedProfile = profile;
    this.profileStream.next(profile);
  }

  public clearSelectedProfile(): void {
    this.setProfileStream(undefined);
  }

  public getDBProfileByType(type: DataBaseType): DataBaseProfile | undefined {
    if (!this.selectedProfile) {
      return;
    }
    return this.selectedProfile.databases.find((dbProfile) => dbProfile.type === type);
  }

  public updateProfile(id: string, profile: Profile): Profile {
    const saved = this.list.find((item) => item.id === id);
    profile.id = id;
    profile.limit = +profile.limit;
    profile.updated = this.getTimestampNow();
    if (saved) {
      this.list[this.list.indexOf(saved)] = profile;
    } else {
      this.list.push(profile);
    }
    this.updateProfiles();
    this.saveProfileFile(profile);
    return {...profile};
  }

  public duplicate(profile: Profile): Profile {
    let newProfile = {...profile};
    newProfile.id = uuidv4();
    newProfile.name = newProfile.name + ' Copy';
    newProfile = this.setDefaults(newProfile);
    return newProfile;
  }

  public newProfile(profile: Profile): Profile {
    profile.id = uuidv4();
    profile.deleted = false;
    profile = this.setDefaults(profile);
    this.list.push(profile);
    this.updateProfiles();
    this.saveProfileFile(profile);
    return {...profile};
  }

  public removeProfile(profile: Profile): void {
    const selectedProfile = this.list.find((item) => item.id === profile.id);
    if (selectedProfile) {
      this.list[this.list.indexOf(selectedProfile)].deleted = true;
      this.removeProfileFile(selectedProfile);
      this.updateProfiles();
    }
  }

  public readProfileFile(profile: Partial<Profile>): Promise<Profile | undefined> {
    return new Promise((resolve, reject) => {
      const profileFile = this.getProfileFile(profile, profileFileName);
      try {
        if (this.fs.existsSync(profileFile)) {
          const profileXml = this.fs.readFileSync(profileFile, 'utf8');
          resolve(parse(profileXml));
        }else{
          profile.notFound = true;
        }
      } catch (e) {
        if (this.fs.existsSync(profileFile)) {
          this.fs.unlinkSync(profileFile);
        }
        reject(e);
      }
    });
  }

  public copyProfileFile(folderFrom: string, folderDest: string): void {
    const from = this.path.join(folderFrom, profileFileName);
    this.fs.copyFileSync(from, this.path.join(folderDest, profileFileName));
    this.fs.unlinkSync(from);
  }

  public updateUsedProfile(profile: Profile): void {
    const lockFile = this.path.join(profile.folder, lockFileName);
    if (!this.fs.existsSync(lockFile)) {
      this.fs.closeSync(this.fs.openSync(lockFile, 'w'));
    }
    const time = moment().format('YYYY-MM-DD HH:mm:ss');
    this.fs.writeFileSync(lockFile, time, 'utf8');
  }

  public checkIsProfileLocked(profile: Profile): boolean {
    const lockFile = this.path.join(profile.folder, lockFileName);
    if (!this.fs.existsSync(lockFile)) {
      return false;
    }
    try {
      const data = this.fs.readFileSync(lockFile, 'utf8');
      let difference = moment(data).diff(moment(), 'seconds');
      if (difference < 0) {
        difference *= -1;
      }
      return difference <= 60;
    } catch (e) {
      return false;
    }
  }

  public async removeLockFile(folder: string): Promise<void> {
    return new Promise((resolve) => {
      const lockFile = this.path.join(folder, lockFileName);
      if (this.fs.existsSync(lockFile)) {
        this.fs.unlinkSync(lockFile);
        resolve();
      } else {
        resolve();
      }
    });
  }

  public updateFolders(profile: Profile): Profile {
    profile.folder = profile.folder.replace(/\\/g, '/');
    profile.mobFolder = profile.mobFolder.replace(/\\/g, '/');
    profile.mobFolder = profile.mobFolder.replace(profile.folder, '');
    profile.itemFolder = profile.itemFolder.replace(/\\/g, '/');
    profile.itemFolder = profile.itemFolder.replace(profile.folder, '');
    profile.buildObjectFolder = profile.buildObjectFolder.replace(/\\/g, '/');
    profile.buildObjectFolder = profile.buildObjectFolder.replace(profile.folder, '');
    profile.coordFolder = profile.coordFolder.replace(/\\/g, '/');
    profile.coordFolder = profile.coordFolder.replace(profile.folder, '');
    profile.syncFolder = profile.syncFolder.replace(/\\/g, '/');
    profile.syncFolder = profile.syncFolder.replace(profile.folder, '');
    return profile;
  }

  private async parseList(profiles: Partial<Profile>[]): Promise<Partial<Profile>[]> {
    const list = [];
    for (const profile of profiles) {
      const previousFileName = this.getProfileFile(profile, profile.id + '.xml');
      const currentFileName = this.getProfileFile(profile, profileFileName);
      if (!this.fs.existsSync(currentFileName) && this.fs.existsSync(previousFileName)) {
        this.fs.copyFileSync(previousFileName, currentFileName);
        list.push(profile);
      } else if (this.fs.existsSync(currentFileName) && !this.fs.existsSync(previousFileName)) {
        this.fs.copyFileSync(currentFileName, previousFileName);
        list.push(profile);
      } else if (this.fs.existsSync(currentFileName) && this.fs.existsSync(previousFileName)) {
        const checkedProfile = await this.readProfileFile(profile);
        if (checkedProfile && checkedProfile.id !== profile.id) {
          this.fs.unlinkSync(previousFileName);
        } else if (checkedProfile && checkedProfile.id === profile.id) {
          const currentFileInfo = this.fs.statSync(currentFileName);
          const previousFileInfo = this.fs.statSync(previousFileName);
          const difference = moment(currentFileInfo.mtime).diff(moment(previousFileInfo.mtime), 'seconds');
          if (difference < 60) {
            this.fs.copyFileSync(previousFileName, currentFileName);
          } else if (difference > 60) {
            this.fs.copyFileSync(currentFileName, previousFileName);
          }
          list.push(profile);
        }
      }else{
        profile.notFound = true;
        list.push(profile);
      }
    }
    return list;
  }

  private setDefaults(profile: Profile): Profile {
    profile.limit = +profile.limit;
    profile.created = this.getTimestampNow();
    profile.updated = this.getTimestampNow();
    profile.lastUsed = '';
    profile.lastUsedVersion = '';
    return profile;
  }

  private saveProfileFile(profile: Profile): void {
    const currentProfileFile = this.getProfileFile(profile, profileFileName);
    const prevProfileFile = this.getProfileFile(profile, profile.id + '.xml');
    try {
      const parser = new j2xParser({});
      this.fs.writeFileSync(currentProfileFile, parser.parse(profile), 'utf8');
      this.fs.writeFileSync(prevProfileFile, parser.parse(profile), 'utf8');
    } catch (e) {
      if (this.fs.existsSync(currentProfileFile)) {
        this.fs.unlinkSync(currentProfileFile);
      }
      if (this.fs.existsSync(prevProfileFile)) {
        this.fs.unlinkSync(prevProfileFile);
      }
    }
  }

  private removeProfileFile(profile: Partial<Profile>): void {
    const currentProfileFile = this.getProfileFile(profile, profileFileName);
    const prevProfileFile = this.getProfileFile(profile, profile.id + '.xml');
    if (this.fs.existsSync(currentProfileFile)) {
      this.fs.unlinkSync(currentProfileFile);
    }
    if (this.fs.existsSync(prevProfileFile)) {
      this.fs.unlinkSync(prevProfileFile);
    }
  }

  private getProfileFile(profile: Partial<Profile>, fileName: string): string {
    const lastChar = (profile.folder as string)[(profile.folder as string).length - 1];
    let profileFile = profile.folder + '/' + fileName;
    if (lastChar === '/') {
      profileFile = (profile.folder as string) + fileName;
    }
    return profileFile;
  }

  private updateProfiles(): void {
    this.list = this.list.filter((profile) => !profile.deleted);
    const listObj: {list: Partial<Profile>[]} = {list: []};
    this.list.forEach((item: Partial<Profile>) => {
      listObj.list.push({
        id: item.id,
        name: item.name,
        type: item.type,
        folder: item.folder,
        lastUsedVersion: item.lastUsedVersion,
        lastUsed: item.lastUsed,
        created: item.created,
        updated: item.updated,
      });
    });
    try {
      const parser = new j2xParser({});
      const xml = parser.parse(listObj);
      this.fs.writeFileSync(this.profilesFile, xml, 'utf8');
      this.profilesStream.next([...this.list]);
    } catch (e) {
      if (this.fs.existsSync(this.profilesFile)) {
        this.fs.unlinkSync(this.profilesFile);
        this.profilesStream.next([]);
      }
    }
  }

  private getTimestampNow(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }
}
