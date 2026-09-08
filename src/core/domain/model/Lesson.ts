/** A scheduled teaching session (lecture / practical / seminar) within a course. */
export interface Lesson {
  id: string;
  courseId: string;
  dayOfWeek: number;
  timeLabel: string;
  courseName: string;
  room: string;
  sessionType: string;
  sortOrder: number;
}