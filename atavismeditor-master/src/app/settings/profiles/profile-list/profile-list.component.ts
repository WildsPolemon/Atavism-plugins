import {Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation} from '@angular/core';
import {FormControl} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {MatTableDataSource} from '@angular/material/table';
import {fuseAnimations} from '@fuse/animations';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {ProfilesService} from '../profiles.service';
import {FormType, Profile} from '../profile';
import {DialogConfig} from '../../../models/configs';
import {combineLatest, fromEvent, Subject, Subscription} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '../../../services/notification.service';
import {distinctUntilChanged, filter, startWith, take, takeUntil} from 'rxjs/operators';
import {TemplatePortal} from '@angular/cdk/portal';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {DialogType} from '../../../models/types';
import {LogService} from '../../../logs/log.service';
import {ProfileFormService} from '../../../services/profile-form.service';

@Component({
  selector: 'atv-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class ProfileListComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: TemplateRef<any>;
  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort!: MatSort;
  public profiles = new MatTableDataSource<Profile>([]);
  public displayedColumns = [
    'profileId',
    'name',
    'type',
    'lastUsedVersion',
    'lastUsed',
    'actions',
  ];
  public searchInput = new FormControl('');
  public overlayRef: OverlayRef | undefined;
  private destroyer = new Subject();
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;
  private sub!: Subscription;

  constructor(
    private readonly overlay: Overlay,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly profilesService: ProfilesService,
    private readonly profileFormService: ProfileFormService,
    private readonly _matDialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
    public dialogListRef: MatDialogRef<ProfileListComponent>,
    private readonly logs: LogService,
  ) {
    combineLatest([
      this.profilesService.profiles,
      this.searchInput.valueChanges.pipe(startWith(''), distinctUntilChanged()),
    ])
      .pipe(takeUntil(this.destroyer))
      .subscribe(([profiles, query]: [Partial<Profile>[], string]) => {
        let list: Profile[] = profiles.filter((profile) => !profile.deleted) as Profile[];
        if (query) {
          list = list.filter((profile) => profile.name.toLowerCase().includes(query.toLowerCase()));
        }
        list = list.map((item) => ({...item, ...{profileId: item.id.slice(0, 8)}}));
        this.profiles = new MatTableDataSource<Profile>(list);
        this.initTable();
      });
  }

  public async ngOnInit(): Promise<void> {
    await this.profilesService.getList();
    this.initTable();
  }

  public onRightClick({x, y}: MouseEvent, element: unknown): void {
    this.close();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({x, y})
      .withPositions([{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    this.overlayRef.attach(new TemplatePortal(this.contextMenu, this.viewContainerRef, {$implicit: element}));
    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1),
      )
      .subscribe(() => this.close());
  }

  public close(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  public async selectProfile(profile: Profile): Promise<void> {
    if (profile.notFound) return;
    this.close();
    const result = await this.profileFormService.selectProfile(profile);
    if (result === 'profile_selected') {
      this.dialogListRef.close();
    }
  }

  public removeProfile(profile: Profile): void {
    this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.profilesService.removeProfile(profile);
        this.notification.success(this.translate.instant('PROFILES.REMOVE_SUCCESS'));
      }
      this.confirmDialogRef = undefined;
    });
  }

  public async editProfile(item: Partial<Profile>): Promise<void> {
    const profile = await this.profilesService.readProfileFile(item);
    if (!profile) {
      this.notification.error(this.translate.instant('PROFILES.PROFILE_FILE_MISSING'));
      return;
    }
    const result = await this.profileFormService.openProfileWindow(FormType.edit, profile);
    if (result) {
      this.notification.success(this.translate.instant('PROFILES.UPDATE_SUCCESS'));
    }
  }

  public async duplicate(item: Profile): Promise<void> {
    const profile = await this.profilesService.readProfileFile(item);
    if (!profile) {
      this.notification.error(this.translate.instant('PROFILES.PROFILE_FILE_MISSING'));
      return;
    }
    this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.CONFIRM_DUPLICATE');
    const result = await this.confirmDialogRef.afterClosed().toPromise();
    if (result) {
      const newProfile = this.profilesService.duplicate(profile);
      newProfile.folder = '';
      const profileResult = await this.profileFormService.openProfileWindow(FormType.duplicate, newProfile);
      if (profileResult) {
        this.notification.success(this.translate.instant('PROFILES.DUPLICATE_SUCCESS'));
      }
    }
    this.confirmDialogRef = undefined;
  }

  public async addProfile(): Promise<void> {
    const result = await this.profileFormService.openProfileWindow(FormType.new);
    if (result) {
      this.notification.success(this.translate.instant('PROFILES.ADD_SUCCESS'));
    }
  }

  public openLogs(profile: Profile): void {
    this.logs.openLogsFolder(profile);
  }

  public clearLogs(profile: Profile): void {
    this.logs.clearLogsFolder(profile);
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  private initTable() {
    this.profiles.paginator = this.paginator;
    if (this.sort) {
      this.sort.direction = 'desc';
      this.sort.active = 'lastUsed';
      this.profiles.sort = this.sort;
    }
  }
}
