import {Provider} from '@angular/core';
import {DatabaseService} from './database.service';

export class DatabaseServiceMock {
  public getTimestampNow(): string {
    return '1111-11-11 11:11:11';
  }

  public insert(): Promise<number> {
    return new Promise<number>((resolve) => {
      resolve(1);
    });
  }
}

export const DatabaseServiceMockProvider: Provider = {provide: DatabaseService, useClass: DatabaseServiceMock};
