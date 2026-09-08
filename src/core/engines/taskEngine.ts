/**
 * TaskEngine — pure domain logic for the task vertical slice.
 * No React, no persistence; operates purely on domain models + dates.
 */
import { TaskPriority, TaskStatus } from '../domain/enums';
import type { Task } from '../domain/model/Task';

/** Task urgency band used for sorting. */
export enum TaskUrgency {
  Urgent = 'urgent',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

/** Result of a due-date analysis for a single task. */
export interface OverdueResult {
  taskId: string;
  overdue: boolean;
  dueToday: boolean;
  daysOverdue: number;
}

/** Parsed relative due label -> absolute date. */
export interface DueDateParse {
  date: Date | null;
  daysUntil: number | null;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.High]: 3,
  [TaskPriority.Medium]: 2,
  [TaskPriority.Low]: 1,
};

/**
 * Parses the compact "due_label" convention back into a date.
 * Supports absolute dates ("Mon Dec 16"), relative "(Nd)" suffixes,
 * ISO dates, and "(overdue)" markers.
 */
export function parseDueLabel(label: string, now: Date = new Date()): DueDateParse {
  const trimmed = label.trim();
  if (!trimmed) return { date: null, daysUntil: null };

  // Relative form: "(2d)" or "(2d overdue)" inside the label.
  // "(Nd overdue)" means the due date was N days in the PAST -> negative.
  const relMatch = trimmed.match(/\((\d+)d(?:\s*overdue)?\)/i);
  if (relMatch) {
    const isOverdue = /overdue/i.test(trimmed);
    const days = Number(relMatch[1]) * (isOverdue ? -1 : 1);
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(12, 0, 0, 0);
    return { date, daysUntil: days };
  }

  // ISO date form.
  const iso = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    const date = new Date(`${iso[1]}T12:00:00`);
    if (Number.isNaN(date.getTime())) return { date: null, daysUntil: null };
    return { date, daysUntil: daysUntil(date, now) };
  }

  // Day-name form: "Mon", "Tue"... -> next occurrence.
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayMatch = trimmed.match(/^(mon|tue|wed|thu|fri|sat|sun)/i);
  if (dayMatch) {
    const target = dayNames.indexOf(dayMatch[1].toLowerCase());
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    let advance = (target - date.getDay() + 7) % 7;
    if (advance === 0) advance = 7; // next week's occurrence
    date.setDate(date.getDate() + advance);
    return { date, daysUntil: daysUntil(date, now) };
  }

  return { date: null, daysUntil: null };
}

/** Whole-day difference: date B minus date A (calendar days). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Computes overdue status for a task given a reference "now". */
export function computeOverdue(task: Task, now: Date = new Date()): OverdueResult {
  const { date, daysUntil: days } = parseDueLabel(task.dueLabel, now);

  if (!date || days === null) {
    return { taskId: task.id, overdue: false, dueToday: false, daysOverdue: 0 };
  }

  const overdue = !task.completed && days < 0;
  const dueToday = !task.completed && days === 0;

  return {
    taskId: task.id,
    overdue,
    dueToday,
    daysOverdue: overdue ? Math.abs(days) : 0,
  };
}

/**
 * Derives the urgency band for a task:
 * - URGENT: high priority AND (overdue OR due today)
 * - HIGH: high priority, or overdue/medium...
 * - MEDIUM / LOW by priority.
 */
export function deriveTaskUrgency(task: Task, now: Date = new Date()): TaskUrgency {
  const { overdue, dueToday } = computeOverdue(task, now);
  const highPriority = task.priority === TaskPriority.High;

  if (highPriority && (overdue || dueToday)) return TaskUrgency.Urgent;
  if (highPriority) return TaskUrgency.High;
  if (task.priority === TaskPriority.Medium && overdue) return TaskUrgency.High;
  if (task.priority === TaskPriority.Low && overdue) return TaskUrgency.Medium;
  return task.priority === TaskPriority.Medium ? TaskUrgency.Medium : TaskUrgency.Low;
}

const URGENCY_RANK: Record<TaskUrgency, number> = {
  [TaskUrgency.Urgent]: 4,
  [TaskUrgency.High]: 3,
  [TaskUrgency.Medium]: 2,
  [TaskUrgency.Low]: 1,
};

/**
 * Sorts tasks by urgency band, then priority, then due date (soonest first).
 * Completed tasks are always pushed to the bottom.
 */
export function sortTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const urgencyDiff = URGENCY_RANK[deriveTaskUrgency(b, now)] - URGENCY_RANK[deriveTaskUrgency(a, now)];
    if (urgencyDiff !== 0) return urgencyDiff;

    const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const dueA = parseDueLabel(a.dueLabel, now).daysUntil ?? Infinity;
    const dueB = parseDueLabel(b.dueLabel, now).daysUntil ?? Infinity;
    if (dueA !== dueB) return dueA - dueB;

    return a.title.localeCompare(b.title);
  });
}

/** Splits a full task set into pending (active) and completed buckets. */
export function partitionTasks(tasks: Task[]): { active: Task[]; completed: Task[] } {
  return {
    active: tasks.filter((t) => !t.completed),
    completed: tasks.filter((t) => t.completed),
  };
}

/** Estimates subtask completion percentage from a summary string. */
export function parseSubtaskProgress(summary: string): { completed: number; total: number; percent: number } {
  const match = summary.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { completed: 0, total: 0, percent: 0 };
  const completed = Number(match[1]);
  const total = Number(match[2]);
  if (total <= 0) return { completed: 0, total: 0, percent: 0 };
  return {
    completed,
    total,
    percent: Math.max(0, Math.min(100, Math.round((completed / total) * 100))),
  };
}

/**
 * Derives the lifecycle status from completion state + subtask progress.
 * TODO -> IN_PROGRESS when partially done (0% < p < 100%) or explicitly started;
 * COMPLETED when fully done or completion flag is set.
 */
export function deriveTaskStatus(task: Task): TaskStatus {
  if (task.completed) return TaskStatus.Completed;

  const { percent } = parseSubtaskProgress(task.subtaskSummary);
  if (task.status === TaskStatus.InProgress || (percent > 0 && percent < 100)) {
    return TaskStatus.InProgress;
  }
  if (percent >= 100) return TaskStatus.Completed;
  return TaskStatus.Pending;
}

/** Convenience: does this task need attention right now? */
export function isActionable(task: Task, now: Date = new Date()): boolean {
  return !task.completed && (deriveTaskUrgency(task, now) === TaskUrgency.Urgent);
}

/** Convenience: returns true if the task is overdue (due date in the past and not completed). */
export function isOverdue(task: Task, currentDate: Date = new Date()): boolean {
  return computeOverdue(task, currentDate).overdue;
}

/** Filter helper for view-level status/course/priority filtering. */
export function filterTasks(
  tasks: Task[],
  filters: {
    status?: TaskStatus | 'active' | 'all';
    courseCode?: string;
    priority?: TaskPriority;
    query?: string;
  } = {},
): Task[] {
  const { status = 'active', courseCode, priority, query } = filters;
  return tasks.filter((task) => {
    if (status === 'all') {
      // no-op
    } else if (status === 'active') {
      if (task.completed) return false;
    } else if (status === TaskStatus.Completed) {
      if (!task.completed) return false;
    } else if (status === TaskStatus.InProgress || status === TaskStatus.Pending) {
      if (task.completed) return false;
      if (deriveTaskStatus(task) !== status) return false;
    }
    if (courseCode && task.courseCode !== courseCode) return false;
    if (priority && task.priority !== priority) return false;
    if (query && !task.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
}