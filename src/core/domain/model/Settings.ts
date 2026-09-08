import { AccentColor } from '../enums';

/** User preferences + notification flag map. Flexible JSON-free settings store. */
export interface NotificationPrefs {
  exam: boolean;
  deadline: boolean;
  class: boolean;
  streak: boolean;
  goal: boolean;
  workload: boolean;
}

/** App-wide persisted preferences. */
export interface Settings {
  id: string;
  darkMode: boolean;
  accentColor: string;
  language: string;
  notificationPrefs: NotificationPrefs;
  studyReminder: boolean;
  quietHours: boolean;
  defaultAccent: AccentColor;
}