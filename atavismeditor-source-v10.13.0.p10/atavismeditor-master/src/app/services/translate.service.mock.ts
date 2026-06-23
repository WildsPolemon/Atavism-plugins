import {Provider} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

export class TranslateServiceMock {
  public instant = (key: string): string => key;
}

export const TranslateServiceMockProvider: Provider = {provide: TranslateService, useClass: TranslateServiceMock};
