/**
 * WorkloadEngine unit tests — daily load, overload warnings, classification.
 */
import { describe, expect, it } from 'vitest';
import {
  computeWorkloadReport,
  classifyLoad,
  taskEstimateHours,
  DEFAULT_THRESHOLDS,
} from './workloadEngine';
import { TaskPriority, TaskStatus } from '../domain/enums';
import type { Task } from '../domain/model/Task';
import type { Exam } from '../domain/model/Exam';
import type { StudySession } from '../domain/model/StudySession';

function makeTask(overrides: Partial<Task> & { title: string }): Task {
  return {
    courseId: null,
    courseCode: 'CS301',
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    estimatedHours: 2,
    subtaskSummary: '0/3',
    dueLabel: 'Mon (2d)',
    completed: false,
    sortOrder: 1,
    ...overrides,
  };
}

function makeExam(overrides: Partial<Exam> & { title: string }): Exam {
  return {
    id: 'ex1',
    codeLabel: 'CS301',
    weightLabel: '40%',
    targetGrade: '8',
    daysUntilLabel: '3',
    accent: 'primary',
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

describe('taskEstimateHours', () => {
  it('returns explicit estimatedHours when > 0', () => {
    const t = makeTask({ title: 'HW', estimatedHours: 5 });
    expect(taskEstimateHours(t)).toBe(5);
  });
  it('returns priority fallback when estimatedHours = 0', () => {
    const t = makeTask({ title: 'HW', estimatedHours: 0, priority: TaskPriority.High });
    expect(taskEstimateHours(t)).toBe(3);
  });
  it('returns 0 for completed tasks', () => {
    const t = makeTask({ title: 'HW', status: TaskStatus.Completed });
    expect(taskEstimateHours(t)).toBe(0);
  });
});

describe('classifyLoad', () => {
  it('returns none for low hours', () => {
    expect(classifyLoad(3)).toBe('none');
  });
  it('returns moderate for medium hours', () => {
    expect(classifyLoad(10)).toBe('moderate');
  });
  it('returns high for high hours', () => {
    expect(classifyLoad(20)).toBe('high');
  });
});

describe('computeWorkloadReport', () => {
  it('returns all zero with empty data', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0); // Wed Oct 15
    const report = computeWorkloadReport([], [], [], now);
    expect(report.days).toHaveLength(7);
    expect(report.totalHours).toBe(0);
    expect(report.level).toBe('none');
    expect(report.peakDay).toBeNull();
  });

  it('classifies high load when tasks exceed threshold', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0);
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ title: `Task ${i}`, estimatedHours: 2, dueLabel: '(0d)' }),
    );
    const report = computeWorkloadReport(tasks, [], [], now);
    expect(report.level).toBe('high');
    expect(report.totalHours).toBeGreaterThan(DEFAULT_THRESHOLDS.high);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('includes exam spike hours on due day', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0);
    const exams = [makeExam({ title: 'Midterm', daysUntilLabel: '2' })];
    const report = computeWorkloadReport([], exams, [], now);
    // Exam spike (4h) lands on day index 2
    expect(report.days[2].hours).toBeGreaterThanOrEqual(4);
    expect(report.days[2].deadlineCount).toBe(1);
  });

  it('adds study session hours to the matching day', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0); // Wed Oct 15
    const sessions = [makeSession({ durationMinutes: 60, dateLabel: '2025-10-15' })];
    const report = computeWorkloadReport([], [], sessions, now);
    // The session should add ~1h to some day
    expect(report.totalHours).toBeGreaterThan(0);
  });
});
