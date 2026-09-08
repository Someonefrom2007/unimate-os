/**
 * InsightsEngine — pure domain logic for focus efficiency ratios,
 * habit consistency scores, academic velocity, and grade trend analysis.
 * No React, no persistence.
 */
import type { Task } from '../domain/model/Task';
import type { Course } from '../domain/model/Course';
import type { Exam } from '../domain/model/Exam';
import type { Grade } from '../domain/model/Grade';
import type { StudySession } from '../domain/model/StudySession';
import type { Goal } from '../domain/model/Goal';
import type { Habit } from '../domain/model/Habit';
import { TaskStatus } from '../domain/enums';

/** Normalised ratio 0..1 describing focus efficiency. */
export interface FocusEfficiency {
  /** Completed focus sessions / total sessions. */
  completionRatio: number;
  /** Average duration (minutes) of completed sessions. */
  averageDurationMin: number;
  /** Total focus hours this week. */
  totalHoursThisWeek: number;
}

/** A single course's velocity metric. */
export interface CourseVelocity {
  courseCode: string;
  courseName: string;
  /** Tasks completed / total tasks for this course. */
  completionRatio: number;
  /** Average hours per completed task. */
  hoursPerTask: number;
  /** Number of pending tasks. */
  pendingTasks: number;
}

/** Overall academic velocity summary. */
export interface AcademicVelocity {
  /** Total tasks completed / total tasks across all courses. */
  overallCompletion: number;
  /** Average grade across all graded courses (0..10 EU scale). */
  averageGrade: number;
  /** ECTS enrolled. */
  totalEcts: number;
  /** Per-course velocity metrics. */
  courses: CourseVelocity[];
}

/** Grade trend data point for sparkline rendering. */
export interface GradeTrendPoint {
  label: string;
  value: number;
}

/** Full insight report. */
export interface InsightReport {
  focus: FocusEfficiency;
  velocity: AcademicVelocity;
  gradeTrend: GradeTrendPoint[];
  habitConsistency: number; // 0..1
  examReadiness: { total: number; withinWeek: number; within30Days: number };
  overdueTaskCount: number;
  messages: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────



// ─── focus efficiency ────────────────────────────────────────────────

export function computeFocusEfficiency(sessions: StudySession[]): FocusEfficiency {
  if (sessions.length === 0) return { completionRatio: 0, averageDurationMin: 0, totalHoursThisWeek: 0 };
  const completed = sessions.filter((s) => s.completed);
  const totalMinutes = completed.reduce((s, x) => s + x.durationMinutes, 0);
  return {
    completionRatio: completed.length / sessions.length,
    averageDurationMin: completed.length > 0 ? totalMinutes / completed.length : 0,
    totalHoursThisWeek: totalMinutes / 60,
  };
}

// ─── grade trend (running weighted mean) ──────────────────────────────

export function computeGradeTrend(grades: Grade[], courses: Course[]): GradeTrendPoint[] {
  if (grades.length === 0 && courses.length > 0) {
    // Return course-based averages as trend points.
    return courses.map((c) => ({ label: c.code, value: c.avgGrade }));
  }
  const sorted = [...grades].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  const running: GradeTrendPoint[] = [];
  let wSum = 0, wTotal = 0;
  for (const g of sorted) {
    const norm = g.maxGrade > 0 ? (g.grade / g.maxGrade) * 10 : g.grade;
    wSum += norm * g.weight;
    wTotal += g.weight;
    running.push({ label: g.assessmentName, value: wTotal > 0 ? Math.round((wSum / wTotal) * 10) / 10 : 0 });
  }
  return running.slice(-10);
}

// ─── academic velocity ───────────────────────────────────────────────

export function computeAcademicVelocity(
  tasks: Task[],
  courses: Course[],
  grades: Grade[],
): AcademicVelocity {
  const completed = tasks.filter((t) => t.status === TaskStatus.Completed);
  const overallCompletion = tasks.length > 0 ? completed.length / tasks.length : 0;

  const tw = grades.reduce((s, g) => s + g.weight, 0);
  const averageGrade = tw > 0
    ? Math.round(grades.reduce((s, g) => s + (g.grade / g.maxGrade) * 10 * g.weight, 0) / tw * 10) / 10
    : courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + c.avgGrade, 0) / courses.length * 10) / 10
      : 0;

  const totalEcts = courses.reduce((s, c) => s + c.ects, 0);

  const courseVelocity: CourseVelocity[] = courses.map((c) => {
    const ct = tasks.filter((t) => t.courseCode === c.code);
    const ctCompleted = ct.filter((t) => t.status === TaskStatus.Completed);
    const totalH = ctCompleted.reduce((s, t) => s + t.estimatedHours, 0);
    return {
      courseCode: c.code,
      courseName: c.name,
      completionRatio: ct.length > 0 ? ctCompleted.length / ct.length : 0,
      hoursPerTask: ctCompleted.length > 0 ? totalH / ctCompleted.length : 0,
      pendingTasks: ct.length - ctCompleted.length,
    };
  });

  return { overallCompletion, averageGrade, totalEcts, courses: courseVelocity };
}

// ─── habit consistency ───────────────────────────────────────────────

export function computeHabitConsistency(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  return habits.reduce((s, h) => s + (h.progressPercent ?? 0), 0) / habits.length / 100;
}

// ─── exam readiness ──────────────────────────────────────────────────

export function computeExamReadiness(exams: Exam[]): { total: number; withinWeek: number; within30Days: number } {
  const parseDays = (label: string): number | null => {
    const n = parseInt(label, 10);
    return isNaN(n) ? null : n;
  };
  let withinWeek = 0, within30Days = 0;
  for (const e of exams) {
    const n = parseDays(e.daysUntilLabel);
    if (n !== null) {
      if (n <= 7 && n >= 0) withinWeek++;
      if (n <= 30 && n >= 0) within30Days++;
    }
  }
  return { total: exams.length, withinWeek, within30Days };
}

// ─── full report ─────────────────────────────────────────────────────

export function computeInsightReport(
  tasks: Task[],
  courses: Course[],
  exams: Exam[],
  grades: Grade[],
  sessions: StudySession[],
  habits: Habit[],
  _goals: Goal[], // eslint-disable-line @typescript-eslint/no-unused-vars
): InsightReport {
  const focus = computeFocusEfficiency(sessions);
  const velocity = computeAcademicVelocity(tasks, courses, grades);
  const gradeTrend = computeGradeTrend(grades, courses);
  const habitConsistency = computeHabitConsistency(habits);
  const examReadiness = computeExamReadiness(exams);
  const overdueTaskCount = tasks.filter((t) => t.status !== TaskStatus.Completed && /overdue|yesterday/i.test(t.dueLabel)).length;

  const messages: string[] = [];
  if (velocity.overallCompletion >= 0.8) messages.push('Strong task completion rate — keep it up!');
  if (velocity.overallCompletion < 0.3 && tasks.length > 3) messages.push('Consider prioritising your task queue.');
  if (focus.completionRatio < 0.6 && sessions.length > 0) messages.push('Focus session completion is low — try shorter pomodoros.');
  if (examReadiness.withinWeek > 0) messages.push(`${examReadiness.withinWeek} exam(s) within the next week — review now.`);
  if (overdueTaskCount > 0) messages.push(`${overdueTaskCount} overdue task(s) need attention.`);
  if (habitConsistency > 0.8) messages.push('Excellent habit streak — discipline pays off!');
  if (velocity.averageGrade >= 8.5) messages.push('Your average grade is outstanding!');
  if (messages.length === 0) messages.push('You are on track — keep the momentum going.');

  return { focus, velocity, gradeTrend, habitConsistency, examReadiness, overdueTaskCount, messages };
}
