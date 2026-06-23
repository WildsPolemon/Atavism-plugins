import {ChangeDetectionStrategy, Component, HostListener} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'fuse-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuseConfirmDialogComponent {
  public confirmTitle: string = this.translate.instant('CONFIRM.REMOVE_TITLE');
  public confirmMessage: string = this.translate.instant('CONFIRM.REMOVE');
  public confirmAcceptButton: string = this.translate.instant('ACTIONS.CONFIRM');
  public confirmCancelButton: string = this.translate.instant('ACTIONS.CANCEL');
  public showCancelButton = true;

  constructor(
    public dialogRef: MatDialogRef<FuseConfirmDialogComponent>,
    private readonly translate: TranslateService,
  ) {}

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'enter') {
      this.dialogRef.close(true);
    }
  }
}
