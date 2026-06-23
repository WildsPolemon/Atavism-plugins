import {Injectable} from '@angular/core';
import {ProfileListComponent} from '../settings/profiles/profile-list/profile-list.component';
import {DialogConfig} from '../models/configs';
import {MatDialog} from '@angular/material/dialog';
import {LoadingService} from '../components/loading/loading.service';
import {Router} from '@angular/router';
import {DialogType} from '../models/types';
import {FuseSplashScreenService} from '@fuse/services/splash-screen.service';
import {DatabaseService} from './database.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileSelectService {
  private dialogRef: DialogType<ProfileListComponent>;

  constructor(
    private readonly matDialog: MatDialog,
    private readonly loadingService: LoadingService,
    private readonly router: Router,
    private readonly splashScreenService: FuseSplashScreenService,
    private readonly databaseService: DatabaseService,
  ) {}

  public showList(): void {
    this.splashScreenService.hide();
    this.dialogRef = this.matDialog.open(ProfileListComponent, {
      panelClass: [DialogConfig.fullDialogOverlay, 'mat-dialog-profiles'],
    });
    this.databaseService.clearPool();
    this.dialogRef
      .afterClosed()
      .toPromise()
      .then(() => {
        if (this.router.url === '/home') {
          void this.router.navigateByUrl('/');
        }
        this.loadingService.hide();
        this.dialogRef = undefined;
      });
  }
}
