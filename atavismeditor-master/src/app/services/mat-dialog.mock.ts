import {Provider} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {of} from 'rxjs';

export class MatDialogMock {
  // When the component calls this.dialog.open(...) we'll return an object
  // with an afterClosed method that allows to subscribe to the dialog result observable.
  public open(): unknown {
    return {
      afterClosed: () => of({action: true}),
    };
  }
}

export const MatDialogMockProvider: Provider = {provide: MatDialog, useClass: MatDialogMock};
