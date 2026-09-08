/**
 * HabitEngine — pure domain logic for the habits vertical slice.
 * Streak calculation, progress tracking, completion toggling.
 */
import type { Habit } from '../domain/model/Habit';

/** Parse a streak label like "12-day streak" or "7d" into an integer. */
export function parseStreakLabel(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Format a streak count back into a human label. */
export function formatStreakLabel(count: number): string {
  return `${count}-day streak`;
}

/** Calculate streak from a history of completion dates (ISO dates).
 *  Counts consecutive days *including today* if completed, then backwards.
 *  If today is missing, starts from yesterday. */
export function calculateStreak(
  completionHistory: string[],
  currentDate: Date = new Date(),
): number {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const dates = new Set(
    completionHistory.map((d) => new Date(d).setHours(0, 0, 0, 0)),
  );

  let streak = 0;
  const check = new Date(today);
  // If today is not completed, start from yesterday
  if (!dates.has(check.getTime())) {
    check.setDate(check.getDate() - 1);
  }
  // Now count consecutive completed days backwards
  for (let i = 0; i < 365; i++) {
    if (dates.has(check.getTime())) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  // If today was completed, it was counted. If not, streak is complete-past-days.
  return streak;
}

/** Calculate next streak if user completes today. */
export function nextStreakIfCompleted(
  completionHistory: string[],
  currentDate: Date = new Date(),
): number {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const dates = new Set(
    completionHistory.map((d) => new Date(d).setHours(0, 0, 0, 0)),
  );

  if (dates.has(today.getTime())) {
    // Already counted today
    return calculateStreak(completionHistory, currentDate);
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dates.has(yesterday.getTime())) {
    // Extends streak
    return calculateStreak(completionHistory, currentDate) + 1;
  }

  // Breaks streak → starts at 1
  return 1;
}

/** Calculate habit progress percentage (capped at 100). */
export function calculateHabitProgress(
  current: number,
  target: number,
): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/** Toggle a habit's completion for today. */
export function toggleHabitToday(
  habit: Habit,
): Habit {
  // Note: the current Habit model uses streakLabel as a string, not a date set.
  // In a real app, we'd store a history array. For now, we simulate by bumping
  // streak and progress when toggling.
  const isCompleted = habit.progressPercent >= 100;
  if (isCompleted) {
    // Undo completion
    const newStreak = Math.max(0, parseStreakLabel(habit.streakLabel) - 1);
    return {
      ...habit,
      progressPercent: Math.max(0, habit.progressPercent - Math.round(100 / 7)),
      streakLabel: formatStreakLabel(newStreak),
    };
  }

  // Mark completed
  const newStreak = parseStreakLabel(habit.streakLabel) + 1;
  const newProgress = Math.min(100, habit.progressPercent + Math.round(100 / 7));
  return {
    ...habit,
    progressPercent: newProgress,
    streakLabel: formatStreakLabel(newStreak),
    detailLabel: `${newStreak}/7 this week`,
  };
}

/** Sort habits: active (incomplete) first, then by streak descending. */
export function sortHabits(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => {
    const aDone = a.progressPercent >= 100;
    const bDone = b.progressPercent >= 100;
    if (aDone !== bDone) return aDone ? 1 : -1;
    return parseStreakLabel(b.streakLabel) - parseStreakLabel(a.streakLabel);
  });
}

/** Aggregate habit stats. */
export function aggregateHabitStats(habits: Habit[]) {
  const active = habits.filter((h) => h.progressPercent < 100);
  const completed = habits.filter((h) => h.progressPercent >= 100);
  const totalStreak = active.reduce((sum, h) => sum + parseStreakLabel(h.streakLabel), 0);
  const avgProgress = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.progressPercent, 0) / habits.length
    : 0;
  return { total: habits.length, active: active.length, completed: completed.length, totalStreak, avgProgress: Math.round(avgProgress) };
}