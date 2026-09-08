/**
 * FocusEngine — pure domain logic for the focus / pomodoro vertical slice.
 * Aggregates study time, course distribution, and break recommendations.
 */
import { SessionType } from '../domain/enums';
import type { StudySession } from '../domain/model/StudySession';

/** Parse a dateLabel like "Dec 12, 2025" into a Date (best-effort). */
function parseDateLabel(label: string): Date {
  const d = new Date(label);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/** Total focus minutes for completed sessions inside a given period. */
export function calculateTotalFocusTime(
  sessions: StudySession[],
  period: 'today' | 'week' | 'month',
): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let rangeStart: Date;
  if (period === 'today') {
    rangeStart = startOfDay;
  } else if (period === 'week') {
    // ISO week start (Monday)
    const day = (startOfDay.getDay() + 6) % 7; // Mon=0
    rangeStart = new Date(startOfDay);
    rangeStart.setDate(startOfDay.getDate() - day);
  } else {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const rangeEnd = now; // inclusive up to now

  return sessions
    .filter((s) => s.completed)
    .filter((s) => {
      const d = parseDateLabel(s.dateLabel);
      d.setHours(0, 0, 0, 0);
      rangeStart.setHours(0, 0, 0, 0);
      return d >= rangeStart && d <= rangeEnd;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

/** Focus time breakdown by course code. */
export function calculateFocusByCourse(
  sessions: StudySession[],
): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const s of sessions) {
    if (!s.completed) continue;
    const key = s.courseCode || 'unassigned';
    breakdown[key] = (breakdown[key] ?? 0) + s.durationMinutes;
  }
  return breakdown;
}

/** Recommended break duration for a given focus block (rounded to nearest 5m, clamped). */
export function getRecommendedBreak(focusDurationMinutes: number): number {
  // Classic pomodoro: 25 → 5, 50 → 10.
  const raw = Math.max(0, Math.round((focusDurationMinutes / 25) * 5));
  // Clamp between 5 and 25 minutes.
  return Math.min(25, Math.max(5, raw));
}

/** Count completed sessions. */
export function countCompletedSessions(sessions: StudySession[]): number {
  return sessions.filter((s) => s.completed).length;
}

/** Session type distribution. */
export function sessionTypeDistribution(
  sessions: StudySession[],
): Record<SessionType, number> {
  const dist: Record<SessionType, number> = {
    [SessionType.Pomodoro]: 0,
    [SessionType.DeepWork]: 0,
    [SessionType.Review]: 0,
  };
  for (const s of sessions) {
    if (!s.completed) continue;
    if (s.sessionType in dist) dist[s.sessionType] += 1;
  }
  return dist;
}
