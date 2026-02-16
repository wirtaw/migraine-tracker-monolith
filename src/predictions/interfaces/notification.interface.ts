import { NotificationTypeEnum } from '../enums/notification-type.enum';

export interface INotification {
  id?: string;
  userId: string;
  type: NotificationTypeEnum;
  message: string;
  isRead: boolean;
  createdAt?: Date;
  ruleId?: string;
}
