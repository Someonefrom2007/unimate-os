/**
 * ExamEngine unit tests — countdown, weight validation, readiness scoring.
 */
import { describe, expect, it } from 'vitest';
import {
  computeAllCountdowns,
  computeCountdown,
  computeReadiness,
  overdueExams,
  parseDaysUntil,
  parseWeight,
  sortExams,
  upcomingExams,
  validateWeightDistribution,
} from './examEngine';
import { AccentColor, ExamType, SessionType, TaskPriority, TaskStatus } from '../domain/enums';
import type { Exam } from '../domain/model/Exam';
import type { Task } from '../domain/model/Task';
import type { StudySession } from '../domain/model/StudySession';

function makeExam(overrides: Partial<Exam> & { id: string }): Exam {
  return {
    courseId: 'cs301',
    codeLabel: 'CS301 MIDTERM',
    title: 'Midterm',
    weightLabel: '35%',
    targetGrade: '8.5',
    daysUntilLabel: 'In 6 Days',
    type: ExamType.Midterm,
    accent: AccentColor.Primary,
    sortOrder: 1,
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    courseId: 'cs301',
    courseCode: 'CS301',
    title: 'Review Ch 1-3',
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    estimatedHours: 2,
    subtaskSummary: '2/3',
    dueLabel: 'Mon Dec 16 (2d)',
    completed: false,
    sortOrder: 1,
    ...overrides,
  };
}

function makeSession(overrides: Partial<StudySession> & { id: string }): StudySession {
  return {
    courseCode: 'CS301',
    taskLabel: 'Midterm prep',
    durationMinutes: 50,
    sessionType: SessionType.Pomodoro,
    dateLabel: 'Jan 3, 2025',
    timeLabel: '18:00',
    completed: true,
    sortOrder: 1,
    ...overrides,
  };
}

describe('parseWeight', () => {
  it('parses "35%"', () => expect(parseWeight('35%')).toBe(35));
  it('parses "  30  "', () => expect(parseWeight('  30  ')).toBe(30));
  it('parses "50 pts"', () => expect(parseWeight('50 pts')).toBe(50));
  it('clamps at 100', () => expect(parseWeight('150%')).toBe(100));
  it('returns 0 for invalid', () => expect(parseWeight('')).toBe(0));
});

describe('parseDaysUntil', () => {
  it('parses "In 6 Days"', () => expect(parseDaysUntil('In 6 Days')).toBe(6));
  it('parses "3d"', () => expect(parseDaysUntil('3d')).toBe(3));
  it('returns null for unparseable', () => expect(parseDaysUntil('TBA')).toBeNull());
});

describe('computeCountdown', () => {
  const now = new Date(2025, 0, 15, 12); // Jan 15, 2025 noon

  it('returns positive days for future exam', () => {
    const exam = makeExam({ id: 'e1', daysUntilLabel: 'In 6 Days' });
    const c = computeCountdown(exam, now);
    expect(c.daysUntil).toBe(6);
    expect(c.overdue).toBe(false);
    expect(c.today).toBe(false);
  });

  it('flags overdue', () => {
    const exam = makeExam({ id: 'e1', daysUntilLabel: '2d overdue' });
    const c = computeCountdown(exam, now);
    expect(c.overdue).toBe(true);
    expect(c.daysUntil).toBe(-2);
    expect(c.label).toBe('2d overdue');
  });

  it('flags today', () => {
    const exam = makeExam({ id: 'e1', daysUntilLabel: 'Today' });
    const c = computeCountdown(exam, now);
    expect(c.today).toBe(true);
    expect(c.daysUntil).toBe(0);
  });

  it('returns Infinity for unparseable', () => {
    const exam = makeExam({ id: 'e1', daysUntilLabel: 'TBA' });
    const c = computeCountdown(exam, now);
    expect(c.daysUntil).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('computeAllCountdowns', () => {
  it('sorts by daysUntil ascending', () => {
    const exams = [
      makeExam({ id: 'e1', daysUntilLabel: '10d' }),
      makeExam({ id: 'e2', daysUntilLabel: '2d' }),
      makeExam({ id: 'e3', daysUntilLabel: '5d' }),
    ];
    const counts = computeAllCountdowns(exams);
    expect(counts.map((c) => c.examId)).toEqual(['e2', 'e3', 'e1']);
  });
});

describe('overdueExams', () => {
  it('filters only overdue', () => {
    const exams = [
      makeExam({ id: 'e1', daysUntilLabel: 'In 5 Days' }),
      makeExam({ id: 'e2', daysUntilLabel: '3d overdue' }),
    ];
    expect(overdueExams(exams)).toHaveLength(1);
    expect(overdueExams(exams)[0].id).toBe('e2');
  });
});

describe('upcomingExams', () => {
  it('filters only future, non-today', () => {
    const exams = [
      makeExam({ id: 'e1', daysUntilLabel: 'Today' }),
      makeExam({ id: 'e2', daysUntilLabel: 'In 3 Days' }),
      makeExam({ id: 'e3', daysUntilLabel: '2d overdue' }),
    ];
    const upcoming = upcomingExams(exams);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].id).toBe('e2');
  });
});

describe('validateWeightDistribution', () => {
  it('valid when total <= 100', () => {
    const exams = [
      makeExam({ id: 'e1', weightLabel: '35%' }),
      makeExam({ id: 'e2', weightLabel: '65%' }),
    ];
    const result = validateWeightDistribution(exams);
    expect(result.totalWeight).toBe(100);
    expect(result.violations).toHaveLength(0);
  });

  it('detects violation > 100%', () => {
    const exams = [
      makeExam({ id: 'e1', weightLabel: '80%' }),
      makeExam({ id: 'e2', weightLabel: '30%' }),
    ];
    const result = validateWeightDistribution(exams);
    expect(result.totalWeight).toBe(110);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].totalWeight).toBe(110);
  });

  it('tracks per-course weights', () => {
    const exams = [
      makeExam({ id: 'e1', courseId: 'cs301', weightLabel: '40%' }),
      makeExam({ id: 'e2', courseId: 'cs301', weightLabel: '30%' }),
      makeExam({ id: 'e3', courseId: 'cs302', weightLabel: '50%' }),
    ];
    const result = validateWeightDistribution(exams);
    expect(result.byCourse.cs301).toBe(70);
    expect(result.byCourse.cs302).toBe(50);
  });

  it('detects per-course violation', () => {
    const exams = [
      makeExam({ id: 'e1', courseId: 'cs301', weightLabel: '60%' }),
      makeExam({ id: 'e2', courseId: 'cs301', weightLabel: '50%' }),
    ];
    const result = validateWeightDistribution(exams);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].courseId).toBe('cs301');
  });
});

describe('computeReadiness', () => {
  it('score 0 when no linked tasks/sessions', () => {
    const exam = makeExam({ id: 'e1' });
    const score = computeReadiness(exam, [], []);
    expect(score.score).toBe(0);
    expect(score.completedTasks).toBe(0);
    expect(score.totalTasks).toBe(0);
  });

  it('calculates task component from completed ratio', () => {
    const exam = makeExam({ id: 'e1' });
    const tasks = [
      makeTask({ id: 't1', courseId: 'cs301', completed: true }),
      makeTask({ id: 't2', courseId: 'cs301', completed: false }),
    ];
    const score = computeReadiness(exam, tasks, []);
    // 50% * 70 = 35
    expect(score.score).toBe(35);
    expect(score.completedTasks).toBe(1);
    expect(score.totalTasks).toBe(2);
  });

  it('adds session component (capped at 30)', () => {
    const exam = makeExam({ id: 'e1' });
    const tasks = [makeTask({ id: 't1', courseId: 'cs301', completed: true })];
    const sessions = [
      makeSession({ id: 's1', courseCode: 'CS301' }),
      makeSession({ id: 's2', courseCode: 'CS301' }),
      makeSession({ id: 's3', courseCode: 'CS301' }),
      makeSession({ id: 's4', courseCode: 'CS301' }), // 4 sessions → 30 cap
    ];
    const score = computeReadiness(exam, tasks, sessions);
    // task: 1/1 = 70, sessions: 4*10=40→30 cap = 100
    expect(score.score).toBe(100);
    expect(score.studySessionCount).toBe(4);
  });

  it('respects session cap at 30', () => {
    const exam = makeExam({ id: 'e1' });
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ id: `s${i}` }));
    const score = computeReadiness(exam, [], sessions);
    expect(score.score).toBe(30);
  });
});

describe('sortExams', () => {
  const now = new Date(2025, 0, 15, 12);

  it('puts overdue exams last', () => {
    const exams = [
      makeExam({ id: 'e1', daysUntilLabel: '3d' }),
      makeExam({ id: 'e2', daysUntilLabel: '2d overdue' }),
    ];
    const sorted = sortExams(exams, now);
    expect(sorted[0].id).toBe('e1');
    expect(sorted[1].id).toBe('e2');
  });

  it('sorts upcoming by daysUntil ascending', () => {
    const exams = [
      makeExam({ id: 'e1', daysUntilLabel: '10d' }),
      makeExam({ id: 'e2', daysUntilLabel: '2d' }),
      makeExam({ id: 'e3', daysUntilLabel: '5d' }),
    ];
    const sorted = sortExams(exams, now);
    expect(sorted.map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
  });
});