import {Provider} from '@angular/core';
import {NotificationService} from './notification.service';

export class NotificationServiceMock {}

export const NotificationServiceMockProvider: Provider = {
  provide: NotificationService,
  useClass: NotificationServiceMock,
};
