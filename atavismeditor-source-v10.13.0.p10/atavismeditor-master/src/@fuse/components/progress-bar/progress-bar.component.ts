import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {combineLatest, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {FuseProgressBarService, ProgressBarMode} from '@fuse/components/progress-bar/progress-bar.service';

@Component({
  selector: 'fuse-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FuseProgressBarComponent implements OnInit, OnDestroy {
  public bufferValue!: number;
  public mode!: ProgressBarMode;
  public value!: number;
  public visible!: boolean;
  private _unsubscribeAll = new Subject();

  constructor(private _fuseProgressBarService: FuseProgressBarService) {}

  ngOnInit(): void {
    combineLatest([
      this._fuseProgressBarService.bufferValue,
      this._fuseProgressBarService.mode,
      this._fuseProgressBarService.value,
      this._fuseProgressBarService.visible,
    ])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([bufferValue, mode, value, visible]) => {
        this.bufferValue = bufferValue;
        this.mode = mode;
        this.value = value;
        this.visible = visible;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(void 0);
    this._unsubscribeAll.complete();
  }
}
