import {Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {FormControl} from '@angular/forms';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';
import {FusePerfectScrollbarDirective} from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import {FuseSidebarService} from '@fuse/components/sidebar/sidebar.service';
import {FuseSidebarComponent} from '@fuse/components/sidebar/sidebar.component';
import {Subject} from 'rxjs';
import {delay, distinctUntilChanged, filter, startWith, take, takeUntil} from 'rxjs/operators';
import {fuseConfig} from '../../../../fuse-config';

@Component({
  selector: 'navbar-vertical-style-1',
  templateUrl: './style-1.component.html',
  styleUrls: ['./style-1.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NavbarVerticalStyle1Component implements OnInit, OnDestroy {
  public fuseConfig = fuseConfig;
  public searchMenuBar = new FormControl('');
  private _fusePerfectScrollbar!: FusePerfectScrollbarDirective;
  private destroyer = new Subject();

  constructor(
    private readonly fuseNavigationService: FuseNavigationService,
    private readonly _fuseSidebarService: FuseSidebarService,
    private readonly _router: Router
  ) {}

  @ViewChild(FusePerfectScrollbarDirective, {static: true})
  set directive(theDirective: FusePerfectScrollbarDirective) {
    if (!theDirective) {
      return;
    }
    this._fusePerfectScrollbar = theDirective;
    this.fuseNavigationService.onItemCollapseToggled
      .pipe(delay(500), takeUntil(this.destroyer))
      .subscribe(() => this._fusePerfectScrollbar.update());

    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => setTimeout(() => this._fusePerfectScrollbar.scrollToElement('navbar .nav-link.active', -120)));
  }

  ngOnInit(): void {
    this.searchMenuBar.valueChanges.pipe(startWith(''), distinctUntilChanged()).subscribe((query) => {
      this.fuseNavigationService.buildNavigation(query);
    });

    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroyer)
      )
      .subscribe(() => {
        if (this._fuseSidebarService.getSidebar('navbar')) {
          (this._fuseSidebarService.getSidebar('navbar') as FuseSidebarComponent).close();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public toggleSidebarOpened(): void {
    (this._fuseSidebarService.getSidebar('navbar') as FuseSidebarComponent).toggleOpen();
  }

  public toggleSidebarFolded(): void {
    (this._fuseSidebarService.getSidebar('navbar') as FuseSidebarComponent).toggleFold();
  }
}
