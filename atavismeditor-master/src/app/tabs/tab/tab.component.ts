import {Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {TabDirective} from './tab.directive';
import {Tab} from '../tabs.data';

@Component({
  selector: 'atv-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TabComponent implements OnInit {
  // @ts-ignore
  @Input() tab: Tab;
  // @ts-ignore
  @ViewChild(TabDirective, {static: true}) tabHost: TabDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  public ngOnInit(): void {
    if (this.tab) {
      this.loadTab();
    }
  }

  public loadTab(): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.tab.component);
    const viewContainerRef = this.tabHost.viewContainerRef;
    viewContainerRef.clear();
    viewContainerRef.createComponent(componentFactory);
  }
}
