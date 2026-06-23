import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Notification, NotificationType} from '../models/notification';
import {getProfilePipe} from '../directives/utils';
import {ProfilesService} from '../settings/profiles/profiles.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private subject = new Subject<Notification>();
  private defaultTime = 25;
  private destroyer: Subject<void> = new Subject<void>();

  constructor(private readonly profilesService: ProfilesService) {
    this.profilesService.profile.pipe(getProfilePipe(this.destroyer)).subscribe((profile) => {
      this.defaultTime = profile.notificationDelay || this.defaultTime;
    });
  }

  public getNotification(): Observable<any> {
    return this.subject.asObservable();
  }

  public success(message: string, time: number = this.defaultTime): void {
    this.notification(NotificationType.Success, message, time);
  }

  public error(message: string, time: number = this.defaultTime): void {
    this.notification(NotificationType.Error, message, time);
  }

  public info(message: string, time: number = this.defaultTime): void {
    this.notification(NotificationType.Info, message, time);
  }

  public warn(message: string, time: number = this.defaultTime): void {
    this.notification(NotificationType.Warning, message, time);
  }

  private notification(type: NotificationType, message: string, time: number): void {
    if (!time || time < 0) {
      time = this.defaultTime;
    }
    this.subject.next({type, message, time, width: '100%'} as Notification);
  }

  public clear(): void {
    this.subject.next(void 0);
  }
}
