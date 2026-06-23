import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {MatTabChangeEvent, MatTabGroup} from '@angular/material/tabs';
import {fromEvent, Subject, Subscription} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {Tab} from './tabs.data';
import {TabsService} from '../services/tabs.service';
import {LoadingService} from '../components/loading/loading.service';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';

@Component({
  selector: 'atv-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements OnInit, OnDestroy {
  @ViewChild('contextNewMenu') contextNewMenu!: TemplateRef<any>;
  // @ts-ignore
  @ViewChild(MatTabGroup, {static: true}) tabGroup: MatTabGroup;
  public tabs: Tab[] = [];
  public selectedTab = 0;
  public overlayRef?: OverlayRef;
  private sub!: Subscription;
  private destroyer = new Subject();

  constructor(
    private readonly overlay: Overlay,
    private readonly tabsService: TabsService,
    private readonly loadingService: LoadingService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.tabsService.init();
    this.tabsService.tabs.pipe(takeUntil(this.destroyer)).subscribe((tabs: Tab[]) => {
      this.tabs = tabs;
      const tab = tabs.find((item) => item.active);
      this.selectedTab = tab ? tabs.indexOf(tab) : 0;
      this.tabGroup.selectedIndex = this.selectedTab;
      this.changeDetectorRef.detectChanges();
      this.loadingService.hide();
    });
  }

  public updateSelectedTabIndex(tab: MatTabChangeEvent): void {
    this.tabsService.updateSelectedTab(tab.index);
    this.changeDetectorRef.markForCheck();
  }

  public removeTab(tab: Tab): void {
    this.tabsService.removeTab(tab);
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public onRight2Click($event: MouseEvent, tab: Tab): void {
    $event.preventDefault();
    this.closeContextMenu();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({x: $event.x, y: $event.y})
      .withPositions([{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    this.overlayRef.attach(new TemplatePortal(this.contextNewMenu, this.viewContainerRef, {$implicit: tab}));
    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1),
      )
      .subscribe(() => this.closeContextMenu());
  }

  public closeContextMenu(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  public closeAll() {
    this.closeContextMenu();
    this.tabsService.closeAllTabs();
  }

  public closeOther(tab: Tab) {
    this.closeContextMenu();
    this.tabsService.closeOtherTabs(tab);
  }
}
