import {Inject, Injectable, InjectionToken} from '@angular/core';
import {Platform} from '@angular/cdk/platform';
import {BehaviorSubject, Observable} from 'rxjs';
// @ts-ignore
import * as _ from 'lodash';
import {StorageKeys, StorageService} from '../../app/services/storage.service';
import {FuseConfig} from '../types';

export const FUSE_CONFIG = new InjectionToken('fuseCustomConfig');

@Injectable({
  providedIn: 'root',
})
export class FuseConfigService {
  private _configSubject = new BehaviorSubject<FuseConfig | undefined>(undefined);
  private readonly _defaultConfig: any;

  constructor(
    private readonly _platform: Platform,
    private readonly storageService: StorageService,
    @Inject(FUSE_CONFIG) _config: FuseConfig,
  ) {
    this._defaultConfig = _config;
    this._init();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public set config(value: any) {
    let config = this._configSubject.getValue();
    config = _.merge({}, config, value);
    this.storageService.set(StorageKeys.storageThemeKey, config);
    this._configSubject.next(config);
  }

  public get config(): any | Observable<FuseConfig> {
    return this._configSubject.asObservable();
  }

  private _init(): void {
    let storageConfig = this.storageService.get<any>(StorageKeys.storageThemeKey);
    if (storageConfig) {
      if (this._platform.ANDROID || this._platform.IOS) {
        storageConfig.customScrollbars = false;
      }
      storageConfig = _.merge({}, this._defaultConfig, storageConfig);
      this._configSubject = new BehaviorSubject(_.cloneDeep(storageConfig));
    } else {
      if (this._platform.ANDROID || this._platform.IOS) {
        this._defaultConfig.customScrollbars = false;
      }
      this.storageService.set(StorageKeys.storageThemeKey, this._defaultConfig);
      this._configSubject = new BehaviorSubject(_.cloneDeep(this._defaultConfig));
    }
  }
}
