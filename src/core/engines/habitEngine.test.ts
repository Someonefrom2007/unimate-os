/**
 * HabitEngine unit tests — streak calculation, progress, toggling, sorting.
 */
import { describe, expect, it } from 'vitest';
import {
  aggregateHabitStats,
  calculateHabitProgress,
  calculateStreak,
  formatStreakLabel,
  nextStreakIfCompleted,
  parseStreakLabel,
  sortHabits,
  toggleHabitToday,
} from './habitEngine';
import { AccentColor } from '../domain/enums';
import type { Habit } from '../domain/model/Habit';

function makeHabit(overrides: Partial<Habit> & { id: string }): Habit {
  return {
    name: 'Test Habit',
    streakLabel: '5-day streak',
    progressPercent: 50,
    detailLabel: '5/7 this week',
    accent: AccentColor.Primary,
    sortOrder: 1,
    ...overrides,
  };
}

describe('parseStreakLabel', () => {
  it('parses "7-day streak"', () => {
    expect(parseStreakLabel('7-day streak')).toBe(7);
  });

  it('parses "3d"', () => {
    expect(parseStreakLabel('3d')).toBe(3);
  });

  it('returns 0 for empty', () => {
    expect(parseStreakLabel('')).toBe(0);
  });
});

describe('formatStreakLabel', () => {
  it('formats correctly', () => {
    expect(formatStreakLabel(7)).toBe('7-day streak');
    expect(formatStreakLabel(1)).toBe('1-day streak');
  });
});

describe('calculateStreak', () => {
  it('counts consecutive days including today', () => {
    const today = new Date('2025-12-15');
    const history = ['2025-12-15', '2025-12-14', '2025-12-13'];
    expect(calculateStreak(history, today)).toBe(3);
  });

  it('returns 0 for empty history', () => {
    expect(calculateStreak([], new Date())).toBe(0);
  });

  it('stops at first gap', () => {
    const today = new Date('2025-12-15');
    const history = ['2025-12-15', '2025-12-12']; // gap on 13th, 14th
    expect(calculateStreak(history, today)).toBe(1);
  });

  it('ignores future dates', () => {
    const today = new Date('2025-12-15');
    const history = ['2025-12-16', '2025-12-15']; // future + today
    expect(calculateStreak(history, today)).toBe(1); // today counts
  });
});

describe('nextStreakIfCompleted', () => {
  it('extends streak when yesterday completed', () => {
    const history = ['2025-12-14', '2025-12-13'];
    expect(nextStreakIfCompleted(history, new Date('2025-12-15'))).toBe(3);
  });

  it('starts new streak if yesterday missed', () => {
    const history = ['2025-12-13'];
    expect(nextStreakIfCompleted(history, new Date('2025-12-15'))).toBe(1);
  });

  it('starts at 1 if today already done', () => {
    const today = new Date('2025-12-15');
    const history = ['2025-12-15'];
    expect(nextStreakIfCompleted(history, today)).toBe(1);
  });
});

describe('calculateHabitProgress', () => {
  it('returns percentage', () => {
    expect(calculateHabitProgress(50, 100)).toBe(50);
  });

  it('clamps at 100', () => {
    expect(calculateHabitProgress(150, 100)).toBe(100);
  });

  it('returns 0 for zero target', () => {
    expect(calculateHabitProgress(50, 0)).toBe(0);
  });
});

describe('toggleHabitToday', () => {
  it('marks completed and increments streak', () => {
    const habit = makeHabit({ id: 'h1', streakLabel: '3-day streak', progressPercent: 40 });
    const next = toggleHabitToday(habit);
    expect(next.progressPercent).toBeGreaterThan(40);
    expect(parseStreakLabel(next.streakLabel)).toBe(4);
  });

  it('undoes completion when already at 100%', () => {
    const habit = makeHabit({ id: 'h1', streakLabel: '7-day streak', progressPercent: 100 });
    const next = toggleHabitToday(habit);
    expect(next.progressPercent).toBeLessThan(100);
  });
});

describe('sortHabits', () => {
  it('puts incomplete first', () => {
    const habits = [
      makeHabit({ id: 'h1', progressPercent: 100 }),
      makeHabit({ id: 'h2', progressPercent: 50 }),
    ];
    expect(sortHabits(habits)[0].id).toBe('h2');
  });

  it('sorts by streak descending', () => {
    const habits = [
      makeHabit({ id: 'h1', streakLabel: '5-day streak' }),
      makeHabit({ id: 'h2', streakLabel: '10-day streak' }),
    ];
    expect(sortHabits(habits)[0].id).toBe('h2');
  });
});

describe('aggregateHabitStats', () => {
  it('computes stats', () => {
    const habits = [
      makeHabit({ id: 'h1', progressPercent: 100 }),
      makeHabit({ id: 'h2', progressPercent: 50, streakLabel: '5-day streak' }),
    ];
    const stats = aggregateHabitStats(habits);
    expect(stats).toEqual({
      total: 2,
      active: 1,
      completed: 1,
      totalStreak: 5,
      avgProgress: 75,
    });
  });
});