/**
 * TaskEngine unit tests — overdue, urgency, sorting, subtask progress, filtering.
 */
import { describe, expect, it } from 'vitest';
import {
  TaskUrgency,
  computeOverdue,
  daysUntil,
  deriveTaskStatus,
  deriveTaskUrgency,
  filterTasks,
  isActionable,
  parseDueLabel,
  parseSubtaskProgress,
  partitionTasks,
  sortTasks,
} from './taskEngine';
import { TaskPriority, TaskStatus } from '../domain/enums';
import type { Task } from '../domain/model/Task';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    courseId: null,
    courseCode: 'CS301',
    title: 'Submit homework',
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    estimatedHours: 2,
    subtaskSummary: '0/3',
    dueLabel: 'Mon Dec 16 (2d)',
    completed: false,
    sortOrder: 1,
    ...overrides,
  };
}

function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

describe('parseDueLabel', () => {
  it('parses relative (Nd) form', () => {
    const { date: result, daysUntil } = parseDueLabel('(3d)', date(2025, 10, 10));
    expect(daysUntil).toBe(3);
    expect(result?.getDate()).toBe(13);
  });

  it('parses "(Nd overdue)" form as negative (past)', () => {
    const { daysUntil, date: result } = parseDueLabel('(1d overdue)', date(2025, 12, 16));
    expect(daysUntil).toBe(-1);
    expect(result?.getDate()).toBe(15);
  });

  it('parses ISO date form', () => {
    const { date: result, daysUntil } = parseDueLabel('2025-12-20', date(2025, 12, 17));
    expect(daysUntil).toBe(3);
    expect(result?.getFullYear()).toBe(2025);
  });

  it('parses day-name form to next occurrence', () => {
    const ref = date(2025, 12, 15); // Monday
    const { daysUntil } = parseDueLabel('Wed', ref);
    expect(daysUntil).toBe(2);
  });

  it('returns null for empty label', () => {
    expect(parseDueLabel('')).toEqual({ date: null, daysUntil: null });
    expect(parseDueLabel('  ')).toEqual({ date: null, daysUntil: null });
  });

  it('returns null for unparseable label', () => {
    expect(parseDueLabel('xyzzy')).toEqual({ date: null, daysUntil: null });
  });
});

describe('daysUntil', () => {
  it('positive for future date', () => {
    expect(daysUntil(date(2025, 12, 20), date(2025, 12, 17))).toBe(3);
  });

  it('negative for past date', () => {
    expect(daysUntil(date(2025, 12, 14), date(2025, 12, 17))).toBe(-3);
  });

  it('zero for same day', () => {
    expect(daysUntil(date(2025, 12, 17), date(2025, 12, 17))).toBe(0);
  });
});

describe('computeOverdue', () => {
  const ref = date(2025, 12, 15);

  it('flags overdue task', () => {
    const task = makeTask({ id: 't1', dueLabel: '(2d overdue)' });
    const result = computeOverdue(task, ref);
    expect(result.overdue).toBe(true);
    expect(result.daysOverdue).toBe(2);
  });

  it('does not flag completed tasks as overdue', () => {
    const task = makeTask({ id: 't2', dueLabel: '(2d overdue)', completed: true });
    const result = computeOverdue(task, ref);
    expect(result.overdue).toBe(false);
  });

  it('detects due-today', () => {
    const task = makeTask({ id: 't3', dueLabel: 'Mon Dec 15 (0d)' });
    const result = computeOverdue(task, ref);
    expect(result.dueToday).toBe(true);
    expect(result.overdue).toBe(false);
  });

  it('returns safe defaults for unparseable labels', () => {
    const task = makeTask({ id: 't4', dueLabel: '' });
    expect(computeOverdue(task, ref).overdue).toBe(false);
  });
});

describe('deriveTaskUrgency', () => {
  const ref = date(2025, 12, 15);

  it('URGENT = high priority + overdue', () => {
    const task = makeTask({ id: 't1', priority: TaskPriority.High, dueLabel: '(1d overdue)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.Urgent);
  });

  it('URGENT = high priority + due today', () => {
    const task = makeTask({ id: 't2', priority: TaskPriority.High, dueLabel: '(0d)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.Urgent);
  });

  it('HIGH = high priority, not urgent', () => {
    const task = makeTask({ id: 't3', priority: TaskPriority.High, dueLabel: '(5d)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.High);
  });

  it('MEDIUM = medium priority', () => {
    const task = makeTask({ id: 't4', priority: TaskPriority.Medium, dueLabel: '(3d)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.Medium);
  });

  it('LOW = low priority', () => {
    const task = makeTask({ id: 't5', priority: TaskPriority.Low, dueLabel: '(3d)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.Low);
  });

  it('overdue medium is promoted to HIGH urgency', () => {
    const task = makeTask({ id: 't6', priority: TaskPriority.Medium, dueLabel: '(2d overdue)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.High);
  });

  it('overdue low is promoted to MEDIUM urgency', () => {
    const task = makeTask({ id: 't7', priority: TaskPriority.Low, dueLabel: '(3d overdue)' });
    expect(deriveTaskUrgency(task, ref)).toBe(TaskUrgency.Medium);
  });
});

describe('sortTasks', () => {
  const ref = date(2025, 12, 15);

  it('puts completed tasks last', () => {
    const tasks = [
      makeTask({ id: 't1', completed: true }),
      makeTask({ id: 't2', completed: false }),
    ];
    const sorted = sortTasks(tasks, ref);
    expect(sorted.map((t) => t.id)).toEqual(['t2', 't1']);
  });

  it('sorts urgent tasks before non-urgent', () => {
    const tasks = [
      makeTask({ id: 't1', priority: TaskPriority.High, dueLabel: '(5d)' }),
      makeTask({ id: 't2', priority: TaskPriority.High, dueLabel: '(0d)' }),
    ];
    const sorted = sortTasks(tasks, ref);
    expect(sorted[0].id).toBe('t2');
  });

  it('falls back to alphabetical on same urgency + priority', () => {
    const tasks = [
      makeTask({ id: 't1', priority: TaskPriority.Medium, title: 'Zebra', dueLabel: '(5d)' }),
      makeTask({ id: 't2', priority: TaskPriority.Medium, title: 'Alpha', dueLabel: '(5d)' }),
    ];
    const sorted = sortTasks(tasks, ref);
    expect(sorted.map((t) => t.title)).toEqual(['Alpha', 'Zebra']);
  });

  it('respects due-date when urgency is tied', () => {
    const tasks = [
      makeTask({ id: 't1', priority: TaskPriority.Medium, dueLabel: 'Wed Dec 17 (2d)' }),
      makeTask({ id: 't2', priority: TaskPriority.Medium, dueLabel: 'Wed Dec 16 (1d)' }),
    ];
    const sorted = sortTasks(tasks, ref);
    expect(sorted[0].id).toBe('t2');
  });
});

describe('parseSubtaskProgress', () => {
  it('parses "2/5" form', () => {
    expect(parseSubtaskProgress('2/5')).toEqual({ completed: 2, total: 5, percent: 40 });
  });

  it('parses "0/3"', () => {
    expect(parseSubtaskProgress('0/3')).toEqual({ completed: 0, total: 3, percent: 0 });
  });

  it('parses "3/3" = 100%', () => {
    expect(parseSubtaskProgress('3/3')).toEqual({ completed: 3, total: 3, percent: 100 });
  });

  it('returns 0 for non-matching string', () => {
    expect(parseSubtaskProgress('no subtasks')).toEqual({ completed: 0, total: 0, percent: 0 });
  });

  it('handles "0/0"', () => {
    expect(parseSubtaskProgress('0/0')).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});

describe('deriveTaskStatus', () => {
  it('returns Completed when completed flag is true', () => {
    expect(deriveTaskStatus(makeTask({ id: 't1', completed: true }))).toBe(TaskStatus.Completed);
  });

  it('returns Completed when subtask 100%', () => {
    expect(deriveTaskStatus(makeTask({ id: 't2', subtaskSummary: '3/3' }))).toBe(TaskStatus.Completed);
  });

  it('returns InProgress when partially done', () => {
    expect(deriveTaskStatus(makeTask({ id: 't3', subtaskSummary: '1/3' }))).toBe(TaskStatus.InProgress);
  });

  it('returns InProgress when explicitly InProgress status', () => {
    expect(deriveTaskStatus(makeTask({ id: 't4', status: TaskStatus.InProgress, subtaskSummary: '0/5' }))).toBe(TaskStatus.InProgress);
  });

  it('returns Pending for untouched task', () => {
    expect(deriveTaskStatus(makeTask({ id: 't5', status: TaskStatus.Pending, subtaskSummary: '0/3' }))).toBe(TaskStatus.Pending);
  });
});

describe('isActionable', () => {
  it('true for urgent active task', () => {
    const task = makeTask({ id: 't1', priority: TaskPriority.High, dueLabel: '(0d)' });
    expect(isActionable(task, date(2025, 12, 15))).toBe(true);
  });

  it('false for completed task', () => {
    const task = makeTask({ id: 't2', priority: TaskPriority.High, dueLabel: '(0d)', completed: true });
    expect(isActionable(task, date(2025, 12, 15))).toBe(false);
  });

  it('false for low priority not overdue', () => {
    const task = makeTask({ id: 't3', priority: TaskPriority.Low, dueLabel: '(5d)' });
    expect(isActionable(task, date(2025, 12, 15))).toBe(false);
  });
});

describe('partitionTasks', () => {
  it('splits active and completed', () => {
    const tasks = [
      makeTask({ id: 't1', completed: false }),
      makeTask({ id: 't2', completed: true }),
      makeTask({ id: 't3', completed: false }),
    ];
    const { active, completed } = partitionTasks(tasks);
    expect(active).toHaveLength(2);
    expect(completed).toHaveLength(1);
  });
});

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 't1', priority: TaskPriority.High, courseCode: 'CS301', completed: false }),
    makeTask({ id: 't2', priority: TaskPriority.Low, courseCode: 'CS302', completed: true }),
    makeTask({ id: 't3', priority: TaskPriority.Medium, courseCode: 'CS301', completed: false, title: 'Review slides' }),
  ];

  it('defaults to active only', () => {
    expect(filterTasks(tasks)).toHaveLength(2);
  });

  it('filter status=all returns all', () => {
    expect(filterTasks(tasks, { status: 'all' })).toHaveLength(3);
  });

  it('filter by course code', () => {
    expect(filterTasks(tasks, { courseCode: 'CS302', status: 'all' })).toHaveLength(1);
  });

  it('filter by priority', () => {
    expect(filterTasks(tasks, { priority: TaskPriority.High })).toHaveLength(1);
  });

  it('filter by query', () => {
    expect(filterTasks(tasks, { query: 'review' })).toHaveLength(1);
  });

  it('filter by status=pending', () => {
    expect(filterTasks(tasks, { status: TaskStatus.Pending })).toHaveLength(2);
  });
});