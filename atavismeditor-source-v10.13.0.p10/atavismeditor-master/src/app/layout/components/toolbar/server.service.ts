import {Injectable} from '@angular/core';
import {DatabaseService} from '../../../services/database.service';
import {ProfilesService} from '../../../settings/profiles/profiles.service';
import {distinctUntilChanged} from 'rxjs/operators';
import {Utils} from '../../../directives/utils';
import {DataBaseProfile, DataBaseType} from '../../../settings/profiles/profile';
import {ReplaySubject} from 'rxjs';

export enum ServerStatus {
  Stop = 'stop',
  StartRestart = 'restart',
}

export enum Server {
  auth = 'auth',
  world = 'world',
}

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  public dbProfile: DataBaseProfile | undefined;
  public dbAtavismProfile: DataBaseProfile | undefined;
  public serverTable = 'server';
  public serverStatusTable = 'server_status';
  public serverVersionTable = 'server_version';
  public pluginStatusTable = 'plugin_status';
  private readonly authServerStatusStream = new ReplaySubject<boolean>(1);
  private readonly worldServerStatusStream = new ReplaySubject<boolean>(1);
  private readonly restartServerStatusStream = new ReplaySubject<boolean>(1);
  private readonly dbVersionStatusStream = new ReplaySubject<string>(1);
  private readonly serverVersionStatusStream = new ReplaySubject<string>(1);
  public authServerStatus = this.authServerStatusStream.asObservable();
  public worldServerStatus = this.worldServerStatusStream.asObservable();
  public restartServerStatus = this.restartServerStatusStream.asObservable();
  public dbVersionStatus = this.dbVersionStatusStream.asObservable();
  public serverVersionStatus = this.serverVersionStatusStream.asObservable();

  constructor(private readonly databaseService: DatabaseService, private readonly profilesService: ProfilesService) {
    this.profilesService.profile.pipe(distinctUntilChanged((x, y) => Utils.equals(x, y))).subscribe((profile) => {
      if (profile) {
        const latestProfile = profile.databases.find((dbProfile) => dbProfile.type === DataBaseType.admin);
        if (!Utils.equals(latestProfile, this.dbProfile)) {
          this.dbProfile = latestProfile as DataBaseProfile;
        }
        this.dbAtavismProfile = profile.databases.find(
          (dbProfile) => dbProfile.type === DataBaseType.atavism,
        ) as DataBaseProfile;
      } else {
        this.dbProfile = undefined;
      }
    });
  }

  public async addServerStatus(status: ServerStatus): Promise<void> {
    if (this.dbProfile) {
      this.restartServerStatusStream.next(true);
      await this.databaseService.insert(this.dbProfile, this.serverTable, {action: status}, false);
    }
  }

  public async checkServerStatus(): Promise<void> {
    if (this.dbProfile) {
      const statusRes = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT count(*) as rowsCount FROM ${this.serverTable}`,
      );
      if (+statusRes[0].rowsCount === 0) {
        this.restartServerStatusStream.next(false);
      }
      const authRes = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT server, status FROM ${this.serverStatusTable} WHERE server = 'auth'`,
      );
      const worldRes = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT server, status FROM ${this.serverStatusTable} WHERE server = 'world'`,
      );
      const versionRes = await this.databaseService.customQuery(
        this.dbProfile,
        `SELECT server_version, installation_type FROM ${this.serverVersionTable} `,
      );
      const atVersionRes = await this.databaseService.customQuery(
        this.dbAtavismProfile,
        `SELECT info FROM ${this.pluginStatusTable} WHERE plugin_type = 'Prefab'`,
      );
      if (atVersionRes.length > 0) {
        const inf = atVersionRes[0].info.split(',');
        const ver = (inf[2] as string).split('=');
        this.dbVersionStatusStream.next(versionRes[0].server_version + ' ' + versionRes[0].installation_type + ' ');
        this.serverVersionStatusStream.next(ver[1] as string);
      } else {
        this.dbVersionStatusStream.next(versionRes[0].server_version + ' ' + versionRes[0].installation_type + ' ');
        this.serverVersionStatusStream.next('');
      }
      this.authServerStatusStream.next(!!(authRes && authRes[0] && authRes[0].status));
      this.worldServerStatusStream.next(!!(worldRes && worldRes[0] && worldRes[0].status));
    }
  }
}
