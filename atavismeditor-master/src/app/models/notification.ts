export enum NotificationType {
  Success,
  Error,
  Info,
  Warning,
}

export interface Notification {
  type: NotificationType;
  message: string;
  time: number;
  width: string;
  noteInterval?: any;
}
