import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {Notification, NotificationType} from '../../models/notification';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'atv-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NotificationComponent implements OnInit, OnDestroy {
  public notifications: Notification[] = [];
  private destroyer: Subject<void> = new Subject<void>();

  constructor(private readonly notificationService: NotificationService) {}

  public ngOnInit(): void {
    this.notificationService
      .getNotification()
      .pipe(takeUntil(this.destroyer))
      .subscribe((notification: Notification) => {
        if (!notification) {
          this.notifications = [];
          return;
        }
        this.notifications.push(notification);
      });
  }

  public removeNotification(notification: Notification): void {
    this.notifications = this.notifications.filter((x) => x !== notification);
  }

  public calcWidth(notification: Notification): string {
    if (!notification.noteInterval && notification.time > 0) {
      const step = 100 / notification.time;
      notification.noteInterval = setInterval(() => {
        notification.time -= 0.1;
        notification.width = notification.time * step + '%';
        if (notification.time <= 0) {
          clearInterval(notification.noteInterval);
          this.removeNotification(notification);
        }
      }, 100);
      if (notification.time <= 0) {
        clearInterval(notification.noteInterval);
        this.removeNotification(notification);
      }
    }
    return notification.width;
  }

  public cssClass(notification: Notification): string {
    if (!notification) {
      return '';
    }
    switch (notification.type) {
      case NotificationType.Success:
        return 'alert alert-success';
      case NotificationType.Error:
        return 'alert alert-danger';
      case NotificationType.Info:
        return 'alert alert-info';
      case NotificationType.Warning:
        return 'alert alert-warning';
    }
  }

  public ngOnDestroy(): void {
    this.destroyer.next(void 0);
    this.destroyer.complete();
  }
}
