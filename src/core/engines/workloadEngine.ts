/**
 * WorkloadEngine — pure domain logic for weekly cognitive load, daily study
 * pressure, and academic overload warnings. No React, no persistence.
 */
import { TaskPriority, TaskStatus } from '../domain/enums';
import type { Task } from '../domain/model/Task';
import type { Exam } from '../domain/model/Exam';
import type { StudySession } from '../domain/model/StudySession';

/** Weight (hours) applied per task priority when estimating load. */
const PRIORITY_HOURS: Record<TaskPriority, number> = {
  [TaskPriority.High]: 3,
  [TaskPriority.Medium]: 2,
  [TaskPriority.Low]: 1,
};

/** Weight applied to an exam on its due day (large spike). */
const EXAM_SPIKE_HOURS = 4;

/** Thresholds for overload classification. */
export interface OverloadThresholds {
  /** Total weekly hours above which the load is considered high. */
  high: number;
  /** Total weekly hours above which the load is considered moderate. */
  medium: number;
}

export const DEFAULT_THRESHOLDS: OverloadThresholds = { high: 15, medium: 8 };

/** Classification of an overload warning. */
export type OverloadLevel = 'none' | 'moderate' | 'high';

/** A single day's cognitive load summary. */
export interface DailyLoad {
  day: number; // 0..6 where 0 = Monday (ISO)
  dateLabel: string;
  /** Raw estimated hours from tasks + exams for that day. */
  hours: number;
  /** Pressure score on a 0..100 scale. */
  pressure: number;
  /** Number of deadlines/exams landing that day. */
  deadlineCount: number;
}

/** Structured workload output. */
export interface WorkloadReport {
  days: DailyLoad[];
  totalHours: number;
  averageDailyHours: number;
  peakDay: DailyLoad | null;
  level: OverloadLevel;
  warnings: string[];
}

/** Parses a relative due label into a day offset (0 = today). */
function daysUntilDue(dueLabel: string, now: Date): number | null {
  const relMatch = dueLabel.match(/\((\d+)d(?:\s*overdue)?\)/i);
  if (relMatch) {
    const isOverdue = /overdue/i.test(dueLabel);
    const days = Number(relMatch[1]) * (isOverdue ? -1 : 1);
    return days;
  }
  const isoMatch = dueLabel.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((d.getTime() - startOfToday.getTime()) / 86400000);
  }
  return null;
}

/** Returns the ISO weekday index for a Date (0 = Monday). */
function isoDay(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Compute priority hours for a task. */
export function taskEstimateHours(task: Task): number {
  if (task.status === TaskStatus.Completed) return 0;
  return task.estimatedHours > 0 ? task.estimatedHours : PRIORITY_HOURS[task.priority] ?? 2;
}

/**
 * Build a full weekly load report for the 7 days starting from `now`.
 * Pulls tasks (by due label), exams (by daysUntilLabel), and scheduled study
 * sessions (by dateLabel) together into daily hour buckets + pressure scores.
 */
export function computeWorkloadReport(
  tasks: Task[],
  exams: Exam[],
  sessions: StudySession[],
  now: Date = new Date(),
): WorkloadReport {
  const days: DailyLoad[] = [];
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  weekStart.setDate(weekStart.getDate() - isoDay(now));

  // Seed buckets for the 7-day window.
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push({
      day: i,
      dateLabel: d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      hours: 0,
      pressure: 0,
      deadlineCount: 0,
    });
  }

  // Distribute task hours by due date (clamp into window).
  for (const t of tasks) {
    const offset = daysUntilDue(t.dueLabel, now);
    if (offset === null) continue;
    for (let i = 0; i < 7; i++) {
      if (offset === i) {
        days[i].hours += taskEstimateHours(t);
        days[i].deadlineCount += 1;
      }
    }
  }

  // Distribute exam spikes.
  for (const e of exams) {
    const n = parseInt(e.daysUntilLabel, 10);
    if (isNaN(n)) continue;
    // Clamp: exams landing in the upcoming 7-day window (0..6 = this week).
    if (n >= 0 && n <= 6) {
      // Map absolute day-until onto this week's window index.
      days[Math.min(n, 6)].hours += EXAM_SPIKE_HOURS;
      days[Math.min(n, 6)].deadlineCount += 1;
    }
  }

  // Add recorded study sessions (durationMinutes) matched by ISO date label.
  for (const s of sessions) {
    const label = s.dateLabel;
    if (!label) continue;
    // Normalise both to YYYY-MM-DD for comparison.
    const iso = label.length >= 10 ? label.slice(0, 10) : label;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (iso === dayISO) {
        days[i].hours += s.durationMinutes / 60;
        break;
      }
    }
  }

  // Compute pressure score (0..100) — proportional to hours, with spike bonus.
  const totalHours = days.reduce((s, d) => s + d.hours, 0);
  const averageDailyHours = totalHours / 7;
  for (const d of days) {
    const base = Math.min(100, (d.hours / (averageDailyHours || 1)) * 50);
    d.pressure = Math.min(100, Math.round(base + d.deadlineCount * 8));
  }

  const peakDay = days.filter((d) => d.hours > 0).reduce<DailyLoad | null>((peak, d) => (peak === null || d.hours > peak.hours ? d : peak), null);

  let level: OverloadLevel = 'none';
  if (totalHours >= DEFAULT_THRESHOLDS.high) level = 'high';
  else if (totalHours >= DEFAULT_THRESHOLDS.medium) level = 'moderate';

  const warnings: string[] = [];
  if (level === 'high') warnings.push('Your weekly load exceeds 15h — consider spreading tasks.');
  if (level === 'moderate') warnings.push('Moderate load this week — keep momentum but watch deadlines.');
  const overloadedDay = days.find((d) => d.pressure >= 80);
  if (overloadedDay) warnings.push(`${overloadedDay.dateLabel} is a peak-pressure day (${overloadedDay.hours.toFixed(1)}h).`);
  if (totalHours === 0) warnings.push('No tracked load this week.');

  return { days, totalHours, averageDailyHours, peakDay, level, warnings };
}

/** Convenience classification of a total weekly hour count. */
export function classifyLoad(totalHours: number): OverloadLevel {
  if (totalHours >= DEFAULT_THRESHOLDS.high) return 'high';
  if (totalHours >= DEFAULT_THRESHOLDS.medium) return 'moderate';
  return 'none';
}
