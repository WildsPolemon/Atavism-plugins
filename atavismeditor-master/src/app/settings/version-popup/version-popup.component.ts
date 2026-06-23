import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {ElectronService} from '../../services/electron.service';
import {FuseConfigService} from '../../../@fuse/services/config.service';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {Utils} from '../../directives/utils';
import {FuseConfig} from '@fuse/types';
import {Subject} from 'rxjs';
import {fuseConfig} from '../../fuse-config';

@Component({
  selector: 'atv-version-popup',
  templateUrl: './version-popup.component.html',
  styleUrls: ['./version-popup.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionPopupComponent implements OnInit, OnDestroy {
  version: string;
  autoCheckForUpdate = false;
  private destroyer = new Subject<void>();
  private fuseConfig: FuseConfig = fuseConfig;
  constructor(
    private readonly electronService: ElectronService,
    private readonly _fuseConfigService: FuseConfigService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.version = this.electronService.settings.version;
    this._fuseConfigService.config
      .pipe(
        distinctUntilChanged((x, y) => Utils.equals(x, y)),
        takeUntil(this.destroyer),
      )
      .subscribe((config: FuseConfig) => {
        this.fuseConfig = config;
        this.autoCheckForUpdate = config.autoCheckForUpdate;
        this.changeDetectorRef.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }

  public updateAutoCheck(): void {
    this._fuseConfigService.config = {...this.fuseConfig, autoCheckForUpdate: !this.autoCheckForUpdate};
  }
}
