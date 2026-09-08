import type { Grade } from '@/core/domain/model/Grade';
import type { Profile as DomainProfile } from '@/core/domain/model/Profile';
import type { AccentColor as UiAccent } from '@/lib/types';

/** Legacy snake_case UI shape for the Grades view. */
export interface UiGradeEntry {
  id: string;
  course_id: string | null;
  course_code: string;
  assessment_name: string;
  weight: number;
  grade: number;
  max_grade: number;
  date_label: string;
  sort_order: number;
}

export function toUiGrade(grade: Grade): UiGradeEntry {
  return {
    id: grade.id,
    course_id: grade.courseId,
    course_code: grade.courseCode,
    assessment_name: grade.assessmentName,
    weight: grade.weight,
    grade: grade.grade,
    max_grade: grade.maxGrade,
    date_label: grade.dateLabel,
    sort_order: grade.sortOrder,
  };
}

export function fromUiGrade(grade: UiGradeEntry): Grade {
  return {
    id: grade.id,
    courseId: grade.course_id,
    courseCode: grade.course_code,
    assessmentName: grade.assessment_name,
    weight: grade.weight,
    grade: grade.grade,
    maxGrade: grade.max_grade,
    dateLabel: grade.date_label,
    sortOrder: grade.sort_order,
  };
}

/** Legacy Profile shape used by the Grades view. */
export interface UiProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  university: string;
  degree: string;
  year_label: string;
  semester_label: string;
  target_gpa: number;
  total_ects: number;
  completed_ects: number;
  accent: UiAccent;
}

export function toUiProfile(profile: DomainProfile): UiProfile {
  return {
    id: profile.id,
    name: profile.name,
    initials: profile.initials,
    email: profile.email,
    university: profile.university,
    degree: profile.degree,
    year_label: profile.yearLabel,
    semester_label: profile.semesterLabel,
    target_gpa: profile.targetGpa,
    total_ects: profile.totalEcts,
    completed_ects: profile.completedEcts,
    accent: profile.accent as UiAccent,
  };
}