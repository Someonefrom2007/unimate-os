/**
 * CourseEngine — pure domain logic for course vertical-slice calculations.
 * No React, no persistence; operates purely on domain models.
 */
import { CourseStatus } from '../domain/enums';
import type { Course } from '../domain/model/Course';
import type { Exam } from '../domain/model/Exam';
import type { Grade } from '../domain/model/Grade';
import type { Task } from '../domain/model/Task';

/** Aggregate stats for one semester. */
export interface SemesterEctsSummary {
  semesterId: string;
  totalEcts: number;
  courseCount: number;
  completedEcts: number;
}

/** Courses grouped by semester id (null = unassigned). */
export type SemesterGrouping = Record<string, Course[]>;

/** Reason a course is considered completed. */
export type CompletionReason = 'grade' | 'syllabus' | 'manual';

/** Derived status evaluation for a single course. */
export interface CourseStatusEvaluation {
  courseId: string;
  status: CourseStatus;
  reason: CompletionReason | 'in-progress' | 'archived-manual';
}

/** Result of predicting the cascade when a course is deleted. */
export interface CourseDeleteCascade {
  courseId: string;
  /** Task ids that will be detached (courseId -> null). */
  detachedTasks: string[];
  /** Exam ids that will be detached. */
  detachedExams: string[];
  /** Grade ids that will be detached. */
  detachedGrades: string[];
  /** Count of affected children records. */
  affectedCount: number;
}

/** Result of predicting the cascade when a course code/name changes. */
export interface CourseUpdateCascade {
  courseId: string;
  /** Task ids that must be updated with the new course code. */
  tasksToUpdate: string[];
  /** Grade ids that must be updated with the new course code. */
  gradesToUpdate: string[];
  /** Resource ids (by courseCode) affected — returned when resources provided. */
  resourcesToUpdate: string[];
  affectedCount: number;
}

export const MIN_COMPLETED_GRADE = 5.5;
export const COMPLETION_SYLLABUS_THRESHOLD = 100;
export const ARCHIVED_SYLLABUS_THRESHOLD = 0;
export const MAX_ECTS = 30;
export const MIN_ECTS = 0;

/**
 * Groups courses by semesterId and computes per-semester ECTS totals.
 * Courses without a semester are grouped under the empty-string key.
 */
export function groupCoursesBySemester(courses: Course[]): SemesterGrouping {
  const grouped: SemesterGrouping = {};
  for (const course of courses) {
    const key = course.semesterId ?? '';
    (grouped[key] ??= []).push(course);
  }
  return grouped;
}

/** Per-semester ECTS summary for every semester that appears in the data. */
export function summarizeSemesterEcts(courses: Course[]): SemesterEctsSummary[] {
  const grouped = groupCoursesBySemester(courses);
  return Object.entries(grouped).map(([semesterId, semesterCourses]) => ({
    semesterId,
    totalEcts: semesterCourses.reduce((sum, course) => sum + course.ects, 0),
    courseCount: semesterCourses.length,
    completedEcts: semesterCourses
      .filter((course) => deriveCourseStatus(course).status === CourseStatus.Completed)
      .reduce((sum, course) => sum + course.ects, 0),
  }));
}

/** Total ECTS across ALL courses (unassigned included). */
export function totalEctsAcrossAll(courses: Course[]): number {
  return courses.reduce((sum, course) => sum + course.ects, 0);
}

/**
 * Derives a course's intended status.
 * Priority: manual override > grade >= passing > syllabus 100% > otherwise active.
 * A zero-progress course with no grades yields 'archived' only if manually set;
 * otherwise stays active so users aren't surprised.
 */
export function deriveCourseStatus(course: Course): CourseStatusEvaluation {
  const hasPassingGrade = course.avgGrade >= MIN_COMPLETED_GRADE;
  const syllabusComplete = course.syllabusProgress >= COMPLETION_SYLLABUS_THRESHOLD;

  if (course.status === CourseStatus.Archived) {
    return { courseId: course.id, status: CourseStatus.Archived, reason: 'archived-manual' };
  }

  if (course.status === CourseStatus.Completed) {
    return { courseId: course.id, status: CourseStatus.Completed, reason: 'manual' };
  }

  if (hasPassingGrade && syllabusComplete) {
    return { courseId: course.id, status: CourseStatus.Completed, reason: 'grade' };
  }
  if (syllabusComplete) {
    return { courseId: course.id, status: CourseStatus.Completed, reason: 'syllabus' };
  }
  if (hasPassingGrade) {
    return { courseId: course.id, status: CourseStatus.Completed, reason: 'grade' };
  }

  return { courseId: course.id, status: CourseStatus.Active, reason: 'in-progress' };
}

/** Convenience: derive only the status enum. */
export function deriveCourseStatusEnum(course: Course): CourseStatus {
  return deriveCourseStatus(course).status;
}

/**
 * Predicts the cascade when a course is deleted:
 * tasks/exams/grades with `courseId === course.id` get detached (courseId -> null).
 */
export function predictCourseDeleteCascade(
  course: Course,
  tasks: Task[],
  exams: Exam[],
  grades: Grade[],
): CourseDeleteCascade {
  const detachedTasks = tasks.filter((task) => task.courseId === course.id).map((task) => task.id);
  const detachedExams = exams.filter((exam) => exam.courseId === course.id).map((exam) => exam.id);
  const detachedGrades = grades.filter((grade) => grade.courseId === course.id).map((grade) => grade.id);

  return {
    courseId: course.id,
    detachedTasks,
    detachedExams,
    detachedGrades,
    affectedCount: detachedTasks.length + detachedExams.length + detachedGrades.length,
  };
}

/**
 * Predicts the cascade when a course's code (and optionally name) changes:
 * children that carry the old course code must be re-keyed to the new one.
 */
export function predictCourseUpdateCascade(
  course: Course,
  nextCourseCode: string,
  tasks: Task[],
  grades: Grade[],
  resources: { id: string; courseCode: string }[] = [],
): CourseUpdateCascade {
  const tasksToUpdate = tasks
    .filter((task) => task.courseId === course.id || task.courseCode === course.code)
    .map((task) => task.id);
  const gradesToUpdate = grades
    .filter((grade) => grade.courseId === course.id || grade.courseCode === course.code)
    .map((grade) => grade.id);
  const resourcesToUpdate =
    course.code === nextCourseCode
      ? []
      : resources.filter((resource) => resource.courseCode === course.code).map((resource) => resource.id);

  return {
    courseId: course.id,
    tasksToUpdate,
    gradesToUpdate,
    resourcesToUpdate,
    affectedCount: tasksToUpdate.length + gradesToUpdate.length + resourcesToUpdate.length,
  };
}

/** Validates ECTS weight for course totals (0..30 typical range). */
export function isValidEcts(ects: number): boolean {
  return Number.isFinite(ects) && ects >= MIN_ECTS && ects <= MAX_ECTS;
}

/** Ratio of syllabus covered for a course. */
export function syllabusCoverage(progress: number): number {
  return Math.min(Math.max(progress, 0), 100) / 100;
}