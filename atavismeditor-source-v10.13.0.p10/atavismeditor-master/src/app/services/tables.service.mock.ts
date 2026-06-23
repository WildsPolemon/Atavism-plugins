import {Provider} from '@angular/core';
import {TablesService} from './tables.service';

export class TablesServiceMock {
  public async openDialog<T>(): Promise<T> {
    return new Promise<T>((resolve) => {
      resolve({} as T);
    });
  }
}

export const TablesServiceMockProvider: Provider = {provide: TablesService, useClass: TablesServiceMock};
