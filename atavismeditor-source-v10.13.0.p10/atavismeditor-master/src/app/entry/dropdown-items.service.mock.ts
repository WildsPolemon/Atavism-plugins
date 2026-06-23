import {Provider} from '@angular/core';
import {DropdownItemsService} from './dropdown-items.service';

export class DropdownItemsServiceMock {}

export const DropdownItemsServiceMockProvider: Provider = {
  provide: DropdownItemsService,
  useClass: DropdownItemsServiceMock,
};
