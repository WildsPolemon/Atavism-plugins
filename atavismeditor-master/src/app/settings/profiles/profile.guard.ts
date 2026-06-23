import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {merge, Observable} from 'rxjs';
import {ProfilesService} from './profiles.service';
import {filter, mapTo, switchMap, tap} from 'rxjs/operators';
import {NotificationService} from '../../services/notification.service';
import {TranslateService} from '@ngx-translate/core';
import {DatabaseService} from '../../services/database.service';
import {Profile} from './profile';

@Injectable({
  providedIn: 'root',
})
export class ProfileGuard implements CanActivate {
  private connectionResultTable = '';
  private connectionResult = true;

  constructor(
    private readonly router: Router,
    private readonly profilesService: ProfilesService,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly databaseService: DatabaseService
  ) {}

  canActivate(): Observable<boolean> {
    this.connectionResult = true;
    return merge(
      this.profilesService.profile.pipe(
        filter((profile) => !profile),
        tap(() => this.redirectToHome()),
        mapTo(false)
      ),
      this.profilesService.profile.pipe(
        filter((profile) => !!profile),
        switchMap(async (profile) => {
          await this.checkDabataseConnection(profile as Profile);
          return profile;
        }),
        filter(() => {
          if (!this.connectionResult) {
            this.notification.error(this.translate.instant('ERROR.PROFILE_CONNECTION_ERROR', {database: this.connectionResultTable}));
            this.redirectToHome();
            return false;
          }
          return this.connectionResult;
        }),
        mapTo(true)
      )
    );
  }

  private async checkDabataseConnection(profile: Profile) {
    for (const item of profile.databases) {
      if (this.connectionResult) {
        const result = await this.databaseService.testConnection(item);
        if (!result.status) {
          this.connectionResultTable = item.type;
        }
        this.connectionResult = result.status;
      }
    }
  }

  private redirectToHome() {
    void this.router.navigate(['home']);
  }
}
