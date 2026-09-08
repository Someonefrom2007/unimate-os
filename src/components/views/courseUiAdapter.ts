import type { Course as DomainCourse } from '@/core/domain/model/Course';
import type { AccentColor as UiAccent } from '@/lib/types';

/**
 * Maps the core domain Course (camelCase) to the legacy UI shape (snake_case)
 * without touching visual output. The domain model is the single source of
 * truth; this adapter only renames fields for the existing card layout.
 */
export interface UiCourse {
  id: string;
  code: string;
  name: string;
  professor: string;
  ects: number;
  room: string;
  syllabus_progress: number;
  avg_grade: number;
  grade_label: string;
  next_session_label: string;
  accent: UiAccent;
  sort_order: number;
}

export function toUiCourse(course: DomainCourse): UiCourse {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    professor: course.professor,
    ects: course.ects,
    room: course.room,
    syllabus_progress: course.syllabusProgress,
    avg_grade: course.avgGrade,
    grade_label: course.gradeLabel,
    next_session_label: course.nextSessionLabel,
    accent: course.accent as UiAccent,
    sort_order: course.sortOrder,
  };
}