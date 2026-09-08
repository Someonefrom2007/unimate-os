import type { CalendarEvent } from '@/core/domain/model/CalendarEvent';

/** Legacy snake_case UI shape for the Schedule view. */
export interface UiScheduleEntry {
  id: string;
  day_of_week: number;
  day_label: string;
  date_label: string;
  is_today: boolean;
  time_label: string;
  course_name: string;
  room: string;
  session_type: string;
  is_next: boolean;
  sort_order: number;
}

export function toUiScheduleEntry(event: CalendarEvent): UiScheduleEntry {
  return {
    id: event.id,
    day_of_week: event.dayOfWeek,
    day_label: event.dayLabel,
    date_label: event.dateLabel,
    is_today: event.isToday,
    time_label: event.timeLabel,
    course_name: event.courseName,
    room: event.room,
    session_type: event.sessionType,
    is_next: event.isNext,
    sort_order: event.sortOrder,
  };
}

export function fromUiScheduleEntry(entry: UiScheduleEntry): CalendarEvent {
  return {
    id: entry.id,
    courseId: null,
    courseName: entry.course_name,
    dayOfWeek: entry.day_of_week as CalendarEvent['dayOfWeek'],
    dayLabel: entry.day_label,
    dateLabel: entry.date_label,
    isToday: entry.is_today,
    timeLabel: entry.time_label,
    room: entry.room,
    sessionType: entry.session_type,
    isNext: entry.is_next,
    sortOrder: entry.sort_order,
  };
}