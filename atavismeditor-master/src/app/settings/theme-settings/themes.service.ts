import {Injectable} from '@angular/core';
import * as moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {fuseConfig} from '../../fuse-config';
import {FuseConfigService} from '../../../@fuse/services/config.service';
import {LoadingService} from '../../components/loading/loading.service';
import {ElectronService} from '../../services/electron.service';
import * as fs from 'fs';
import {distinctUntilChanged} from 'rxjs/operators';
import {Utils} from '../../directives/utils';
import {FuseConfig} from '../../../@fuse/types';

export interface Theme {
  id: string;
  name: string;
  size: string;
  tooltipSize: string;
  colorTheme: string;
  selected: boolean;
  mainColor: string;
  secondaryColor: string;
  textColor: string;
  textSecondaryColor: string;
  primaryColor: string;
  accentColor: string;
  warnColor: string;
  lastUsed: string;
  created: string;
  updated: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemesService {
  private readonly themesStream = new ReplaySubject<Theme[]>(1);
  public themes = this.themesStream.asObservable();
  private readonly themeStream = new BehaviorSubject<Theme | undefined>(undefined);
  public theme = this.themeStream.asObservable();
  public fuseConfig = fuseConfig;
  private list: Theme[] = [];
  private readonly fs: typeof fs;
  private readonly userData: string = '';
  private readonly profileFile: string;

  constructor(
    private readonly electronService: ElectronService,
    private readonly _fuseConfigService: FuseConfigService,
    private readonly loadingService: LoadingService,
  ) {
    this.userData = '';
    if (this.electronService.isElectron) {
      this.fs = this.electronService.fs;
      this.profileFile = this.electronService.settings.userDataPath + '/atavism-themes.json';
    }
    this._fuseConfigService.config
      .pipe(distinctUntilChanged((x, y) => Utils.equals(x, y)))
      .subscribe((config: FuseConfig) => {
        this.fuseConfig = config;
        this.getList();
        this.parseSelected();
      });
  }

  public getList(): void {
    if (this.profileFile) {
      if (this.fs.existsSync(this.profileFile)) {
        const profilesJson = this.fs.readFileSync(this.profileFile, 'utf8');
        try {
          this.list = JSON.parse(profilesJson);
        } catch (_) {
          this.list = [];
        }
        this.themesStream.next([...this.list]);
      } else {
        this.themesStream.next([]);
      }
    } else {
      this.themesStream.next([]);
    }
  }

  public set(theme: Theme): void {
    const saved = this.list.find((item) => item.id === theme.id) as Theme;
    this.list.forEach((item) => (item.selected = false));
    theme.lastUsed = this.getTimestampNow();
    theme.selected = true;
    this.list[this.list.indexOf(saved)] = theme;
    this.updateThemes();
  }

  public update(id: string, theme: Theme): void {
    const saved = this.list.find((item) => item.id === id);
    theme.id = id;
    theme.updated = this.getTimestampNow();
    if (saved) {
      this.list[this.list.indexOf(saved)] = theme;
    } else {
      this.list.push(theme);
    }
    this.updateThemes();
  }

  public duplicate(theme: Theme): void {
    let newTheme = {...theme};
    newTheme.id = uuidv4();
    newTheme.name = newTheme.name + ' Copy';
    newTheme.selected = false;
    newTheme = this.setDefaults(newTheme);
    this.list.push(newTheme);
    this.updateThemes();
  }

  public add(theme: Theme): void {
    theme.id = uuidv4();
    theme.selected = false;
    theme = this.setDefaults(theme);
    this.list.push(theme);
    this.updateThemes();
  }

  private setDefaults(theme: Theme): Theme {
    theme.created = this.getTimestampNow();
    theme.updated = this.getTimestampNow();
    return theme;
  }

  public remove(theme: Theme): void {
    this.list.splice(this.list.indexOf(theme), 1);
    if (theme.selected && this.list.length > 0) {
      this.list[0].selected = true;
    }
    this.updateThemes();
  }

  private updateThemes(): void {
    this.parseSelected();
    this.fs.writeFileSync(this.profileFile, JSON.stringify([...this.list]), 'utf8');
    this.themesStream.next([...this.list]);
  }

  private getTimestampNow(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }

  private parseSelected(): void {
    const theme = this.list.find((item) => item.selected);
    if (theme) {
      this.themeStream.next(theme);
      this.fuseConfig.colorTheme = theme.colorTheme;
      this.fuseConfig.fontSize = theme.size;
      this.fuseConfig.tooltipFontSize = theme.tooltipSize;
      if (theme.colorTheme === 'theme-custom') {
        this.fuseConfig.customColors = {
          mainColor: theme.mainColor,
          secondaryColor: theme.secondaryColor,
          textColor: theme.textColor,
          textSecondaryColor: theme.textSecondaryColor,
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          warnColor: theme.warnColor,
        };
      }
    }
    this._fuseConfigService.config = this.fuseConfig;
    setTimeout(() => {
      this.loadingService.hide();
    }, 200);
  }
}
