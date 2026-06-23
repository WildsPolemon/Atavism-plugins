import {NodeComponent, NodeService} from 'vasko-retejs-angular-render-plugin';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {actionTypes} from '../../dialogue.data';
import {Control} from 'rete';
import {FuseConfirmDialogComponent} from '@fuse/components/confirm-dialog/confirm-dialog.component';
import {DialogConfig} from '../../../../models/configs';
import {DialogType} from '../../../../models/types';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';

@Component({
  templateUrl: './custom-node.component.html',
  styleUrls: ['./custom-node.component.scss'],
  providers: [NodeService],
})
export class CustomNodeComponent extends NodeComponent implements OnInit {
  public actionTypes = actionTypes;
  private confirmDialogRef: DialogType<FuseConfirmDialogComponent>;

  constructor(
    protected service: NodeService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly matDialog: MatDialog,
    private readonly translate: TranslateService,
  ) {
    super(service, changeDetectorRef);
  }

  public async ngOnInit() {
    super.ngOnInit();
  }

  public removeOutput(control: Control): void {
    this.confirmDialogRef = this.matDialog.open(FuseConfirmDialogComponent, {
      panelClass: DialogConfig.confirmDialogOverlay,
      disableClose: false,
    });
    this.confirmDialogRef.componentInstance.confirmMessage = this.translate.instant('CONFIRM.REMOVE_ACTION');
    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const actionNumber = control.key.replace('text_', '');
        const outputKey = 'action_' + actionNumber;
        const output = this.node.outputs.get(outputKey);
        if (output) {
          const connection = output.connections[0];
          if (connection) {
            this.editor.removeConnection(connection);
            connection.remove();
          }
        }
        this.node.outputs.delete(outputKey);
        this.node.controls.delete('text_' + actionNumber);
        this.node.update();
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
