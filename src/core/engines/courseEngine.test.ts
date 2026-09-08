/**
 * CourseEngine unit tests — ECTS sums, status derivation, cascade handling.
 */
import { describe, expect, it } from 'vitest';
import {
  COMPLETION_SYLLABUS_THRESHOLD,
  MAX_ECTS,
  MIN_COMPLETED_GRADE,
  deriveCourseStatus,
  deriveCourseStatusEnum,
  groupCoursesBySemester,
  isValidEcts,
  predictCourseDeleteCascade,
  predictCourseUpdateCascade,
  summarizeSemesterEcts,
  syllabusCoverage,
  totalEctsAcrossAll,
} from './courseEngine';
import { AccentColor, CourseStatus, ExamType, TaskPriority, TaskStatus } from '../domain/enums';
import type { Course } from '../domain/model/Course';
import type { Exam } from '../domain/model/Exam';
import type { Grade } from '../domain/model/Grade';
import type { Task } from '../domain/model/Task';

function makeCourse(overrides: Partial<Course> & { id: string }): Course {
  return {
    semesterId: null,
    code: 'CS301',
    name: 'Advanced Operating Systems',
    professor: 'Dr. Mercer',
    ects: 6,
    room: 'Turing 302',
    syllabusProgress: 50,
    avgGrade: 0,
    gradeLabel: '',
    nextSessionLabel: '',
    status: CourseStatus.Active,
    accent: AccentColor.Primary,
    sortOrder: 1,
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    courseId: null,
    courseCode: 'CS301',
    title: 'Homework',
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    estimatedHours: 2,
    subtaskSummary: '',
    dueLabel: '',
    completed: false,
    sortOrder: 1,
    ...overrides,
  };
}

function makeExam(overrides: Partial<Exam> & { id: string }): Exam {
  return {
    courseId: null,
    codeLabel: 'CS301 MIDTERM',
    title: 'Midterm',
    weightLabel: '35%',
    targetGrade: '>8',
    daysUntilLabel: 'In 6 days',
    type: ExamType.Midterm,
    accent: AccentColor.Primary,
    sortOrder: 1,
    ...overrides,
  };
}

function makeGrade(overrides: Partial<Grade> & { id: string }): Grade {
  return {
    courseId: null,
    courseCode: 'CS301',
    assessmentName: 'Quiz 1',
    weight: 20,
    grade: 8,
    maxGrade: 10,
    dateLabel: '',
    sortOrder: 1,
    ...overrides,
  };
}

describe('CourseEngine — semester ECTS computation', () => {
  it('computes per-semester totals', () => {
    const courses = [
      makeCourse({ id: 'c1', semesterId: 'sem-1', ects: 6 }),
      makeCourse({ id: 'c2', semesterId: 'sem-1', ects: 5 }),
      makeCourse({ id: 'c3', semesterId: 'sem-2', ects: 4 }),
    ];
    const summaries = summarizeSemesterEcts(courses);
    expect(summaries).toHaveLength(2);
    const sem1 = summaries.find((s) => s.semesterId === 'sem-1');
    const sem2 = summaries.find((s) => s.semesterId === 'sem-2');
    expect(sem1?.totalEcts).toBe(11);
    expect(sem1?.courseCount).toBe(2);
    expect(sem2?.totalEcts).toBe(4);
  });

  it('groups unassigned courses under the empty key', () => {
    const courses = [makeCourse({ id: 'c1' }), makeCourse({ id: 'c2', semesterId: 'sem-1' })];
    const grouped = groupCoursesBySemester(courses);
    expect(grouped['']).toHaveLength(1);
    expect(grouped['sem-1']).toHaveLength(1);
  });

  it('sums completed ECTS only for derived-completed courses', () => {
    const courses = [
      makeCourse({ id: 'c1', semesterId: 'sem-1', ects: 6, avgGrade: 8, syllabusProgress: COMPLETION_SYLLABUS_THRESHOLD }),
      makeCourse({ id: 'c2', semesterId: 'sem-1', ects: 5, avgGrade: 0, syllabusProgress: 10 }),
    ];
    const summaries = summarizeSemesterEcts(courses);
    expect(summaries[0].completedEcts).toBe(6);
  });

  it('totals ECTS across all courses', () => {
    const total = totalEctsAcrossAll([
      makeCourse({ id: 'c1', ects: 6 }),
      makeCourse({ id: 'c2', ects: 5 }),
      makeCourse({ id: 'c3', ects: 4 }),
    ]);
    expect(total).toBe(15);
  });
});

describe('CourseEngine — status derivation', () => {
  it('marks active when in progress', () => {
    const result = deriveCourseStatus(makeCourse({ id: 'c1' }));
    expect(result.status).toBe(CourseStatus.Active);
    expect(result.reason).toBe('in-progress');
  });

  it('marks completed when the syllabus reaches 100%', () => {
    const result = deriveCourseStatus(makeCourse({ id: 'c1', syllabusProgress: COMPLETION_SYLLABUS_THRESHOLD }));
    expect(result.status).toBe(CourseStatus.Completed);
    expect(result.reason).toBe('syllabus');
  });

  it('marks completed when the average grade passes the threshold', () => {
    const result = deriveCourseStatus(makeCourse({ id: 'c1', avgGrade: MIN_COMPLETED_GRADE }));
    expect(result.status).toBe(CourseStatus.Completed);
    expect(result.reason).toBe('grade');
  });

  it('honors a manual completed override', () => {
    const result = deriveCourseStatus(
      makeCourse({ id: 'c1', status: CourseStatus.Completed, syllabusProgress: 10, avgGrade: 4 }),
    );
    expect(result.status).toBe(CourseStatus.Completed);
    expect(result.reason).toBe('manual');
  });

  it('honors an archived override regardless of grades', () => {
    const result = deriveCourseStatus(
      makeCourse({ id: 'c1', status: CourseStatus.Archived, avgGrade: 9, syllabusProgress: 90 }),
    );
    expect(result.status).toBe(CourseStatus.Archived);
    expect(result.reason).toBe('archived-manual');
  });

  it('deriveCourseStatusEnum returns just the enum', () => {
    expect(deriveCourseStatusEnum(makeCourse({ id: 'c1' }))).toBe(CourseStatus.Active);
  });
});

describe('CourseEngine — delete cascade', () => {
  it('detaches every child linked to the course', () => {
    const course = makeCourse({ id: 'c1' });
    const tasks = [
      makeTask({ id: 't1', courseId: 'c1' }),
      makeTask({ id: 't2', courseId: 'other' }),
    ];
    const exams = [
      makeExam({ id: 'e1', courseId: 'c1' }),
      makeExam({ id: 'e2', courseId: 'other' }),
    ];
    const grades = [
      makeGrade({ id: 'g1', courseId: 'c1' }),
      makeGrade({ id: 'g2', courseId: null }),
    ];
    const cascade = predictCourseDeleteCascade(course, tasks, exams, grades);
    expect(cascade.detachedTasks).toEqual(['t1']);
    expect(cascade.detachedExams).toEqual(['e1']);
    expect(cascade.detachedGrades).toEqual(['g1']);
    expect(cascade.affectedCount).toBe(3);
  });

  it('returns a zero cascade when no children exist', () => {
    const cascade = predictCourseDeleteCascade(makeCourse({ id: 'c1' }), [], [], []);
    expect(cascade.affectedCount).toBe(0);
    expect(cascade.detachedTasks).toHaveLength(0);
    expect(cascade.detachedExams).toHaveLength(0);
    expect(cascade.detachedGrades).toHaveLength(0);
  });
});

describe('CourseEngine — update cascade', () => {
  it('re-keys children that carry the old course code', () => {
    const course = makeCourse({ id: 'c1', code: 'OLD' });
    const tasks = [
      makeTask({ id: 't1', courseId: 'c1', courseCode: 'OLD' }),
      makeTask({ id: 't2', courseId: 'other', courseCode: 'OTHER' }),
    ];
    const grades = [
      makeGrade({ id: 'g1', courseId: 'c1', courseCode: 'OLD' }),
      makeGrade({ id: 'g2', courseId: null, courseCode: 'OLD' }),
    ];
    const resources = [
      { id: 'r1', courseCode: 'OLD' },
      { id: 'r2', courseCode: 'OTHER' },
    ];
    const cascade = predictCourseUpdateCascade(course, 'NEW', tasks, grades, resources);
    expect(cascade.tasksToUpdate).toEqual(['t1']);
    expect(cascade.gradesToUpdate).toEqual(['g1', 'g2']);
    expect(cascade.resourcesToUpdate).toEqual(['r1']);
    expect(cascade.affectedCount).toBe(4);
  });

  it('leaves resources untouched when the code is unchanged', () => {
    const course = makeCourse({ id: 'c1', code: 'SAME' });
    const cascade = predictCourseUpdateCascade(course, 'SAME', [], [], [{ id: 'r1', courseCode: 'SAME' }]);
    expect(cascade.resourcesToUpdate).toEqual([]);
    expect(cascade.affectedCount).toBe(0);
  });
});

describe('CourseEngine — ECTS validation & syllabus helpers', () => {
  it('validates ECTS bounds', () => {
    expect(isValidEcts(0)).toBe(true);
    expect(isValidEcts(MAX_ECTS)).toBe(true);
    expect(isValidEcts(MAX_ECTS + 1)).toBe(false);
    expect(isValidEcts(-1)).toBe(false);
    expect(isValidEcts(Number.NaN)).toBe(false);
  });

  it('clamps syllabus coverage into 0..1', () => {
    expect(syllabusCoverage(50)).toBe(0.5);
    expect(syllabusCoverage(-10)).toBe(0);
    expect(syllabusCoverage(150)).toBe(1);
  });
});