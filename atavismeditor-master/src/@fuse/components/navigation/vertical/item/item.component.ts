import {Component, HostBinding, Input, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {FuseNavigationItem} from '@fuse/types';
import {TabsService} from '../../../../../app/services/tabs.service';
import {FuseSidebarService} from '../../../sidebar/sidebar.service';
import {ProfilesService} from '../../../../../app/settings/profiles/profiles.service';
import {NotificationService} from '../../../../../app/services/notification.service';
import {TranslateService} from '@ngx-translate/core';
import {Profile} from '../../../../../app/settings/profiles/profile';
import {LoadingService} from '../../../../../app/components/loading/loading.service';
import {Utils} from '../../../../../app/directives/utils';
import {FuseSidebarComponent} from '../../../sidebar/sidebar.component';

@Component({
  selector: 'fuse-nav-vertical-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
})
export class FuseNavVerticalItemComponent implements OnInit, OnDestroy {
  @HostBinding('class') public classes = 'nav-item';

  @Input() public item!: FuseNavigationItem;

  private profile!: Profile;
  private _unsubscribeAll = new Subject();

  constructor(
    private readonly _fuseSidebarService: FuseSidebarService,
    private readonly tabsService: TabsService,
    private readonly router: Router,
    private readonly profilesService: ProfilesService,
    private readonly notificationService: NotificationService,
    private readonly translate: TranslateService,
    private readonly loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.profilesService.profile
      .pipe(
        filter((profile: any) => !!profile),
        map((profile: Profile) => profile),
        distinctUntilChanged((x, y) => Utils.equals(x, y)),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((profile) => {
        this.profile = profile;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(void 0);
    this._unsubscribeAll.complete();
  }

  public openComponent(item: FuseNavigationItem): void {
    if (item.locked) {
      return;
    }
    this.loadingService.show();
    if (!this.profile) {
      this.notificationService.error(this.translate.instant('ERROR.PROFILE_EMPTY'));
      (this._fuseSidebarService.getSidebar('navbar') as FuseSidebarComponent).toggleOpen();
      this.router.navigate(['/home']).then(() => {
        this.loadingService.hide();
      });
      return;
    }
    setTimeout(() => {
      if (this.router.url === '/translation' || this.router.url === '/home' || this.router.url === '/theme-settings') {
        this.router.navigate(['']).then(() => {
          const selectedTab = this.tabsService.tabById(item.id);
          this.tabsService.addTab({
            id: item.id,
            icon: item.icon as string,
            title: item.title,
            type: selectedTab.type,
            locked: selectedTab.locked,
            active: true,
            component: selectedTab.component,
          });
          this.loadingService.hide();
        });
      } else {
        const selectedTab = this.tabsService.tabById(item.id);
        this.tabsService.addTab({
          id: item.id,
          icon: item.icon as string,
          title: item.title,
          type: selectedTab.type,
          locked: selectedTab.locked,
          active: true,
          component: selectedTab.component,
        });
        this.loadingService.hide();
      }
      (this._fuseSidebarService.getSidebar('navbar') as FuseSidebarComponent).toggleOpen();
    });
  }
}
