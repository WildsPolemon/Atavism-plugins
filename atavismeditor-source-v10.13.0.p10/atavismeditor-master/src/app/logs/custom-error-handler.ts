import {ErrorHandler, Inject, Injectable} from '@angular/core';
import {NotificationService} from '../services/notification.service';
import {LoadingService} from '../components/loading/loading.service';
import {LogService} from './log.service';

interface CustomError {
  message: string;
  stack: string;
}

@Injectable()
export class CustomErrorHandler implements ErrorHandler {
  constructor(
    @Inject(NotificationService) private notificationService: NotificationService,
    @Inject(LoadingService) private loadingService: LoadingService,
    @Inject(LogService) private logs: LogService,
  ) {}

  handleError(error: CustomError): void {
    this.showErrorInConsole(error);
    setTimeout(() => {
      console.error(error);
      this.notificationService.error(error.message);
    });
  }

  private showErrorInConsole(error: CustomError): void {
    this.loadingService.hide();
    this.logs.error('[ErrorHandler]', error.message, error.stack);
  }
}
