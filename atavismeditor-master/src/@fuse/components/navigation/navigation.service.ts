import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {FuseNavigation, FuseNavigationItem} from '@fuse/types';
import {tabs, TabType} from '../../../app/tabs/tabs.data';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class FuseNavigationService {
  public onItemCollapsed = new Subject<FuseNavigation>();
  public onItemCollapseToggled = new Subject<any>();
  private navigationStream = new ReplaySubject<FuseNavigation[]>(1);
  public navigation = this.navigationStream.asObservable();

  constructor(private readonly translateService: TranslateService) {
    this.buildNavigation();
  }

  public buildNavigation(query = ''): void {
    const navigation: FuseNavigation[] = [];
    Object.keys(TabType).forEach((item) => {
      let children = [];
      if (query) {
        children = tabs.filter((nav) => {
          const title = this.translateService.instant(nav.title);
          return nav.type === item && title.toLowerCase().includes(query);
        });
      } else {
        children = tabs.filter((nav) => nav.type === item);
      }
      const navigationParent: FuseNavigation = {
        id: item,
        icon: item.toLowerCase() + '_category.png',
        title: 'NAV.SECTION.' + item.toLocaleUpperCase(),
        type: 'collapsable',
        children: children.map((nav) => ({
            id: nav.id,
            icon: nav.icon,
            title: nav.title,
            type: 'item',
            component: nav.component,
          })),
      };
      if ((navigationParent.children as FuseNavigationItem[]).length > 0) {
        navigation.push(navigationParent);
      }
    });
    this.navigationStream.next(navigation);
  }
}
