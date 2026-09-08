import { SessionType } from '../enums';

/** A completed focus / study session. */
export interface StudySession {
  id: string;
  courseCode: string;
  taskLabel: string;
  durationMinutes: number;
  sessionType: SessionType;
  dateLabel: string;
  timeLabel: string;
  completed: boolean;
  sortOrder: number;
}