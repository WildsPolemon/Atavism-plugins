import {StorageKeys, StorageService} from './storage.service';
import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {Tab, tabs} from '../tabs/tabs.data';
import {ProfilesService} from '../settings/profiles/profiles.service';
import {Profile} from '../settings/profiles/profile';
import {TablesService} from './tables.service';

@Injectable({
  providedIn: 'root',
})
export class TabsService {
  private tabsStream = new ReplaySubject<Tab[]>(1);
  public tabs = this.tabsStream.asObservable();
  private listTabs: Tab[] = [];
  private profile: Profile | undefined = undefined;

  constructor(
    private readonly storageService: StorageService,
    private readonly profilesService: ProfilesService,
    private readonly tablesService: TablesService,
  ) {}

  public init(): void {
    this.profilesService.profile.subscribe((profile) => {
      this.listTabs = [];
      this.profile = profile;
      if (profile) {
        const savedTabs = this.storageService.get<Tab[]>(StorageKeys.storageTabsKey + '_' + profile.id);
        if (savedTabs) {
          savedTabs.forEach((item) => {
            const tab = tabs.find((t) => t.id === item.id);
            if (tab) {
              tab.active = item.active;
              this.listTabs.push(tab);
            }
          });
        }
      }
      this.updateActive();
      this.tabsStream.next(this.listTabs);
    });
  }

  public addTab(tab: Tab): void {
    let itemTab = this.listTabs.find((item) => item.id === tab.id) as Tab;
    if (!itemTab) {
      itemTab = tab;
      this.listTabs.push(tab);
    }
    this.listTabs.forEach((item) => (item.active = item.id === itemTab.id));
    this.tabsStream.next(this.listTabs);
    this.updateActive();
    this.saveToStorage();
  }

  public removeTab(tab: Tab): void {
    if (this.listTabs.indexOf(tab) !== -1) {
      this.listTabs.splice(this.listTabs.indexOf(tab), 1);
      this.tabsStream.next(this.listTabs);
      this.updateActive();
      this.saveToStorage();
    }
  }

  public closeAllTabs(): void {
    this.listTabs = [];
    this.tabsStream.next(this.listTabs);
    this.updateActive();
    this.saveToStorage();
  }

  public closeOtherTabs(tab: Tab): void {
    this.listTabs = [tab];
    this.tabsStream.next(this.listTabs);
    this.updateActive();
    this.saveToStorage();
  }

  public tabById(id: string): Tab {
    return tabs.find((tab: Tab) => tab.id === id) as Tab;
  }

  public updateSelectedTab(index: number): void {
    this.listTabs.forEach((item) => (item.active = false));
    if (this.listTabs[index]) {
      this.listTabs[index].active = true;
    }
    this.updateActive();
    this.saveToStorage();
  }

  public updateActive(): void {
    this.tablesService.activeTabStream.next(this.listTabs.find((item) => item.active));
  }

  private saveToStorage() {
    if (this.profile) {
      this.storageService.set(
        StorageKeys.storageTabsKey + '_' + this.profile.id,
        this.listTabs.map((tab) => ({id: tab.id, active: tab.active})),
      );
    }
  }
}
