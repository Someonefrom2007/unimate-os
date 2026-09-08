/**
 * ExamEngine — pure domain logic for the exams/assessments vertical slice.
 * Countdown calculation, weight distribution validation, preparation readiness.
 */
import type { Exam } from '../domain/model/Exam';
import type { Task } from '../domain/model/Task';
import type { StudySession } from '../domain/model/StudySession';

/** Countdown breakdown relative to a reference timestamp. */
export interface ExamCountdown {
  examId: string;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
  overdue: boolean;
  today: boolean;
  label: string; // "3d", "5h", "2d overdue", etc.
}

/** Weight distribution summary for a set of course-linked assessments. */
export interface WeightSummary {
  totalWeight: number;
  remaining: number;
  byCourse: Record<string, number>; // courseId -> total weight
  violations: { courseId: string; totalWeight: number; message: string }[];
}

/** Preparation readiness score for a given exam. */
export interface ReadinessScore {
  examId: string;
  score: number; // 0-100
  completedTasks: number;
  totalTasks: number;
  studySessionCount: number;
  estimatedProgress: number; // 0-100
}

/** Parse an exam weight label (e.g. "30%", "30", "30 pts") into a numeric percent. */
export function parseWeight(label: string): number {
  const match = label.trim().match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Math.min(100, Math.max(0, Number(match[1])));
}

/** Extract the days-until value from an exam's weight/daysUntil label. */
export function parseDaysUntil(label: string): number | null {
  const match = label.match(/(\d+)\s*d/i);
  if (!match) return null;
  return Number(match[1]);
}

/**
 * Compute a countdown for a single exam relative to a reference timestamp.
 * Uses `exam.daysUntilLabel` (e.g. "5d", "Today") or tries to derive from scheduled date.
 */
export function computeCountdown(
  exam: Exam,
  now: Date = new Date(),
): ExamCountdown {
  void now; // reserved for future date-comparison logic
  const overdue = exam.daysUntilLabel.toLowerCase().includes('overdue');
  const label = exam.daysUntilLabel.trim();
  const isTodayLabel = /^today$/i.test(label);

  // Handle "Today" label
  if (isTodayLabel) {
    return {
      examId: exam.id,
      daysUntil: 0,
      hoursUntil: 0,
      minutesUntil: 0,
      overdue: false,
      today: true,
      label: 'Today',
    };
  }

  const daysUntil = parseDaysUntil(label);

  if (daysUntil === null && !overdue) {
    // No parseable countdown — days-until unknown
    return {
      examId: exam.id,
      daysUntil: Number.POSITIVE_INFINITY,
      hoursUntil: Number.POSITIVE_INFINITY,
      minutesUntil: Number.POSITIVE_INFINITY,
      overdue: false,
      today: false,
      label,
    };
  }

  const daysAbs = daysUntil ?? 0;
  const effectiveDays = overdue ? -daysAbs : daysAbs;
  const hoursUntil = effectiveDays * 24;
  const minutesUntil = hoursUntil * 60;
  const overdueFlag = effectiveDays < 0;

  return {
    examId: exam.id,
    daysUntil: effectiveDays,
    hoursUntil,
    minutesUntil,
    overdue: overdueFlag,
    today: false,
    label: overdueFlag ? `${Math.abs(effectiveDays)}d overdue` : label,
  };
}

/** Compute countdowns for all exams relative to `now`, sorted soonest-first. */
export function computeAllCountdowns(exams: Exam[], now: Date = new Date()): ExamCountdown[] {
  return exams
    .map((exam) => computeCountdown(exam, now))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Return only overdue exams (past due-date, not yet archived). */
export function overdueExams(exams: Exam[], now: Date = new Date()): Exam[] {
  return exams.filter((exam) => computeCountdown(exam, now).overdue);
}

/** Return only upcoming exams (future date, not overdue). */
export function upcomingExams(exams: Exam[], now: Date = new Date()): Exam[] {
  return exams.filter((exam) => {
    const countdown = computeCountdown(exam, now);
    return !countdown.overdue && countdown.today === false;
  });
}

/**
 * Validate that the sum of assessment weights for each course does not exceed 100%.
 * Returns per-course totals and any violations.
 */
export function validateWeightDistribution(exams: Exam[]): WeightSummary {
  const byCourse: Record<string, number> = {};
  const violations: { courseId: string; totalWeight: number; message: string }[] = [];

  for (const exam of exams) {
    const weight = parseWeight(exam.weightLabel);
    const key = exam.courseId ?? '__unlinked';
    byCourse[key] = (byCourse[key] ?? 0) + weight;
  }

  let totalWeight = 0;
  for (const weight of Object.values(byCourse)) {
    totalWeight += weight;
  }

  for (const [courseId, weight] of Object.entries(byCourse)) {
    if (weight > 100.01) {
      violations.push({
        courseId,
        totalWeight: weight,
        message: `Course "${courseId}" exceeds 100%: ${weight}%`,
      });
    }
  }

  return {
    totalWeight,
    remaining: Math.max(0, 100 - totalWeight),
    byCourse,
    violations,
  };
}

/**
 * Derive a preparation readiness score for an exam from linked tasks/sessions.
 * Score = weighted blend of completed-linked-tasks and study-session count.
 */
export function computeReadiness(
  exam: Exam,
  allTasks: Task[] = [],
  allSessions: StudySession[] = [],
): ReadinessScore {
  // Tasks are linked via courseId.
  const linkedTasks = allTasks.filter((t) => t.courseId === exam.courseId);
  const completedTasks = linkedTasks.filter((t) => t.completed).length;
  const totalTasks = linkedTasks.length;

  // Study sessions are linked via courseCode — derive the course code from the exam's
  // code label prefix (e.g. "CS301 MIDTERM" -> "CS301").
  const derivedCourseCode = exam.codeLabel.trim().split(/\s+/)[0];
  const linkedSessions = allSessions.filter((s) => {
    if (derivedCourseCode) return s.courseCode === derivedCourseCode;
    return false;
  });
  const studySessionCount = linkedSessions.length;

  // Blend components.
  const taskComponent = totalTasks > 0 ? (completedTasks / totalTasks) * 70 : 0;
  const sessionComponent = Math.min(studySessionCount * 10, 30); // capped at 3 sessions = 30pts
  const rawScore = taskComponent + sessionComponent;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Estimated progress from study sessions (average progress field if present).
  const sessionProgress =
    linkedSessions.length > 0
      ? linkedSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) / linkedSessions.length
      : 0;
  const estimatedProgress = Math.round(Math.min(100, sessionProgress / 6)); // ~60 min avg = 10%

  return {
    examId: exam.id,
    score,
    completedTasks,
    totalTasks,
    studySessionCount,
    estimatedProgress,
  };
}

/** Sort exams by countdown (overdue last, then soonest-first). */
export function sortExams(exams: Exam[], now: Date = new Date()): Exam[] {
  return [...exams].sort((a, b) => {
    const ca = computeCountdown(a, now);
    const cb = computeCountdown(b, now);
    // Overdue exams go behind upcoming
    if (ca.overdue !== cb.overdue) return ca.overdue ? 1 : -1;
    return ca.daysUntil - cb.daysUntil;
  });
}