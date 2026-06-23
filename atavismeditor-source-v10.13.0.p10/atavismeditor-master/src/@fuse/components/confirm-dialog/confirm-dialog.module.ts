import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule} from '@angular/material/dialog';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [FuseConfirmDialogComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  providers: [{provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {disableClose: true, hasBackdrop: true}}],
  entryComponents: [FuseConfirmDialogComponent],
})
export class FuseConfirmDialogModule {}
