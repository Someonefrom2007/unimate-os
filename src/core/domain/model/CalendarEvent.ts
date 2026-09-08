import { WeekDay } from '../enums';

/** A calendar event / schedule entry (class, lab, social, office hours). */
export interface CalendarEvent {
  id: string;
  courseId: string | null;
  courseName: string;
  dayOfWeek: WeekDay;
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  timeLabel: string;
  room: string;
  sessionType: string;
  isNext: boolean;
  sortOrder: number;
}