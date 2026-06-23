import {Injectable} from '@angular/core';
import {ElectronService} from './electron.service';

export enum StorageKeys {
  storageProfilesKey = 'storage_profiles_key',
  storageTabsKey = 'storage_tabs_key',
  storageTranslationKey = 'storage_translations_key',
  storageMetaFilteredFilesKey = 'storage_meta_filtered_files_key',
  storageThemeKey = 'storage_theme_key',
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private store: any;
  private readonly usingLocal: boolean;

  /**
   * Storage for electron production not work for localhost,
   * so we have two different storage handling
   */
  constructor(private readonly electronService: ElectronService) {
    try {
      const Store = this.electronService.remote.require('electron-store');
      this.store = new Store();
      this.usingLocal = false;
    } catch (e) {
      this.store = localStorage;
      this.usingLocal = true;
    }
  }

  public set<T>(key: string, value: T): void {
    if (this.usingLocal) {
      this.store.setItem(key, JSON.stringify(value));
    } else {
      this.store.set(key, value);
    }
  }

  public get<T>(key: string): T {
    if (this.usingLocal) {
      return JSON.parse(this.store.getItem(key));
    } else {
      return this.store.get(key);
    }
  }

  public remove(key: string): void {
    if (this.usingLocal) {
      this.store.removeItem(key);
    } else {
      this.store.delete(key);
    }
  }

  public cleanUp(): void {
    if (this.usingLocal) {
      this.store.clear();
    } else {
      this.store.clear();
    }
  }
}
