import { AccentColor, NotificationType } from '../enums';

/** In-app notification feed item. */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestampLabel: string;
  read: boolean;
  accent: AccentColor;
  sortOrder: number;
}