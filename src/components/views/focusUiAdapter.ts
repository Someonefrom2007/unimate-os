import type { StudySession } from '@/core/domain/model/StudySession';
import type { SessionType } from '@/core/domain/enums';

/** Legacy snake_case UI shape for the Focus view. */
export interface UiFocusSession {
  id: string;
  course_code: string;
  task_label: string;
  duration_minutes: number;
  session_type: 'pomodoro' | 'deep_work' | 'review';
  date_label: string;
  time_label: string;
  completed: boolean;
  sort_order: number;
}

export function toUiFocusSession(session: StudySession): UiFocusSession {
  return {
    id: session.id,
    course_code: session.courseCode,
    task_label: session.taskLabel,
    duration_minutes: session.durationMinutes,
    session_type: session.sessionType as UiFocusSession['session_type'],
    date_label: session.dateLabel,
    time_label: session.timeLabel,
    completed: session.completed,
    sort_order: session.sortOrder,
  };
}

export function fromUiFocusSession(session: UiFocusSession): StudySession {
  return {
    id: session.id,
    courseCode: session.course_code,
    taskLabel: session.task_label,
    durationMinutes: session.duration_minutes,
    sessionType: session.session_type as SessionType,
    dateLabel: session.date_label,
    timeLabel: session.time_label,
    completed: session.completed,
    sortOrder: session.sort_order,
  };
}