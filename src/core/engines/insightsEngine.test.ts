/**
 * InsightsEngine unit tests — focus efficiency, velocity, grade trend, habit consistency.
 */
import { describe, expect, it } from 'vitest';
import {
  computeFocusEfficiency,
  computeAcademicVelocity,
  computeGradeTrend,
  computeHabitConsistency,
  computeExamReadiness,
  computeInsightReport,
} from './insightsEngine';
import { TaskPriority, TaskStatus } from '../domain/enums';
import type { Task } from '../domain/model/Task';
import type { Course } from '../domain/model/Course';
import type { Grade } from '../domain/model/Grade';
import type { StudySession } from '../domain/model/StudySession';
import type { Habit } from '../domain/model/Habit';
import type { Exam } from '../domain/model/Exam';


function makeTask(overrides: Partial<Task> & { title: string }): Task {
  return {
    courseId: null,
    courseCode: 'CS301',
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    estimatedHours: 2,
    subtaskSummary: '0/3',
    dueLabel: 'Mon',
    completed: false,
    sortOrder: 1,
    ...overrides,
  };
}

function makeCourse(overrides: Partial<Course> & { code: string; name: string }): Course {
  return {
    id: 'c1',
    semesterId: null,
    ects: 6,
    professor: 'Dr. Smith',
    syllabusProgress: 50,
    accent: 'primary',
    status: 'active',
    avgGrade: 7.5,
    room: 'B101',
    gradeLabel: '',
    nextSessionLabel: '',
    sortOrder: 0,
    ...overrides,
  };
}

function makeGrade(overrides: Partial<Grade> & { assessmentName: string }): Grade {
  return {
    id: 'g1',
    courseId: null,
    courseCode: 'CS301',
    weight: 20,
    grade: 8,
    maxGrade: 10,
    dateLabel: '2025-10-01',
    sortOrder: 0,
    ...overrides,
  };
}

function makeSession(overrides: Partial<StudySession>): StudySession {
  return {
    id: 'fs1',
    courseCode: 'CS301',
    taskLabel: 'Study',
    durationMinutes: 50,
    sessionType: 'deep_work' as never,
    dateLabel: '',
    timeLabel: '',
    completed: true,
    sortOrder: 0,
    ...overrides,
  };
}

function makeHabit(overrides: Partial<Habit> & { name: string }): Habit {
  return {
    id: 'h1',
    accent: 'primary',
    streakLabel: '5d',
    progressPercent: 80,
    detailLabel: '',
    sortOrder: 0,
    ...overrides,
  };
}

describe('computeFocusEfficiency', () => {
  it('returns zeros when no sessions', () => {
    const result = computeFocusEfficiency([]);
    expect(result.completionRatio).toBe(0);
    expect(result.averageDurationMin).toBe(0);
  });
  it('calculates correctly for mixed sessions', () => {
    const sessions = [
      makeSession({ completed: true, durationMinutes: 30 }),
      makeSession({ completed: false, durationMinutes: 10, id: 'fs2' }),
      makeSession({ completed: true, durationMinutes: 60, id: 'fs3' }),
    ];
    const result = computeFocusEfficiency(sessions);
    expect(result.completionRatio).toBeCloseTo(2 / 3, 4);
    expect(result.averageDurationMin).toBe(45);
  });
});

describe('computeGradeTrend', () => {
  it('returns course averages when no grades', () => {
    const courses = [makeCourse({ code: 'CS301', name: 'Algorithms', avgGrade: 8.0 }), makeCourse({ code: 'MATH', name: 'Linear Algebra', avgGrade: 7.0, id: 'c2' })];
    const result = computeGradeTrend([], courses);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(8.0);
  });
  it('builds running weighted mean from grades', () => {
    const grades = [
      makeGrade({ assessmentName: 'HW1', grade: 7, maxGrade: 10, weight: 10, dateLabel: '2025-09-01' }),
      makeGrade({ assessmentName: 'HW2', grade: 9, maxGrade: 10, weight: 20, dateLabel: '2025-10-01', id: 'g2' }),
    ];
    const result = computeGradeTrend(grades, []);
    expect(result.length).toBe(2);
    expect(result[0].value).toBe(7.0); // first alone = 7.0
    // Second: (7*10 + 9*20) / 30 = 250/30 = 8.33
    expect(result[1].value).toBeCloseTo(8.3, 1);
  });
});

describe('computeAcademicVelocity', () => {
  it('returns 0 for empty data', () => {
    const result = computeAcademicVelocity([], [], []);
    expect(result.overallCompletion).toBe(0);
    expect(result.averageGrade).toBe(0);
  });
  it('computes completion ratio', () => {
    const tasks = [
      makeTask({ title: 'A', status: TaskStatus.Completed }),
      makeTask({ title: 'B', id: 't2' }),
    ];
    const result = computeAcademicVelocity(tasks, [], []);
    expect(result.overallCompletion).toBe(0.5);
  });
  it('computes per-course velocity', () => {
    const course = makeCourse({ code: 'CS301', name: 'Algorithms' });
    const tasks = [
      makeTask({ title: 'A', status: TaskStatus.Completed, estimatedHours: 4 }),
      makeTask({ title: 'B', id: 't2', status: TaskStatus.Pending, estimatedHours: 2 }),
    ];
    const result = computeAcademicVelocity(tasks, [course], []);
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].completionRatio).toBe(0.5);
    expect(result.courses[0].pendingTasks).toBe(1);
  });
});

describe('computeHabitConsistency', () => {
  it('returns 0 for empty', () => {
    expect(computeHabitConsistency([])).toBe(0);
  });
  it('returns average / 100', () => {
    const habits = [
      makeHabit({ name: 'A', progressPercent: 100 }),
      makeHabit({ name: 'B', progressPercent: 60, id: 'h2' }),
    ];
    expect(computeHabitConsistency(habits)).toBeCloseTo(0.8, 2);
  });
});

describe('computeExamReadiness', () => {
  it('counts exams within timeframes', () => {
    const exams: Exam[] = [
      { id: 'e1', codeLabel: 'CS301', title: 'Midterm', weightLabel: '30%', targetGrade: '8', daysUntilLabel: '5', accent: 'primary' },
      { id: 'e2', codeLabel: 'MATH', title: 'Final', weightLabel: '40%', targetGrade: '7', daysUntilLabel: '20', accent: 'secondary' },
      { id: 'e3', codeLabel: 'PHY', title: 'Quiz', weightLabel: '10%', targetGrade: '9', daysUntilLabel: '3', accent: 'tertiary' },
    ];
    const result = computeExamReadiness(exams);
    expect(result.total).toBe(3);
    expect(result.withinWeek).toBe(2);
    expect(result.within30Days).toBe(3);
  });
});

describe('computeInsightReport', () => {
  it('produces a valid report from mixed data', () => {
    const report = computeInsightReport(
      [makeTask({ title: 'A', status: TaskStatus.Completed }), makeTask({ title: 'B', id: 't2' })],
      [makeCourse({ code: 'CS301', name: 'Algo' })],
      [{ id: 'e1', codeLabel: 'CS301', title: 'Midterm', weightLabel: '30%', targetGrade: '8', daysUntilLabel: '5', accent: 'primary' }],
      [makeGrade({ assessmentName: 'HW1', dateLabel: '2025-10-01' })],
      [makeSession({ completed: true })],
      [makeHabit({ name: 'Read' })],
      [],
    );
    expect(report.focus.completionRatio).toBe(1);
    expect(report.velocity.overallCompletion).toBe(0.5);
    expect(report.gradeTrend.length).toBeGreaterThan(0);
    expect(report.messages.length).toBeGreaterThan(0);
    expect(report.examReadiness.withinWeek).toBe(1);
  });
});
