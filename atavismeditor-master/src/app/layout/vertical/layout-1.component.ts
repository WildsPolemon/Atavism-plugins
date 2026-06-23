import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {FuseConfigService} from '@fuse/services/config.service';
import {fuseConfig} from '../../fuse-config';
import {FuseConfig} from '../../../@fuse/types';

@Component({
  selector: 'vertical-layout-1',
  templateUrl: './layout-1.component.html',
  styleUrls: ['./layout-1.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VerticalLayout1Component implements OnInit, OnDestroy {
  public fuseConfig = fuseConfig;
  private _unsubscribeAll = new Subject();

  constructor(private _fuseConfigService: FuseConfigService) {}

  public ngOnInit(): void {
    this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: FuseConfig) => {
      this.fuseConfig = config;
    });
  }

  public ngOnDestroy(): void {
    this._unsubscribeAll.next(void 0);
    this._unsubscribeAll.complete();
  }
}
