import type { Habit } from '@/core/domain/model/Habit';
import type { AccentColor as UiAccent } from '@/lib/types';

/** Legacy snake_case UI shape for the Habits view. */
export interface UiHabit {
  id: string;
  name: string;
  streak_label: string;
  progress_percent: number;
  detail_label: string;
  accent: UiAccent;
  sort_order: number;
}

export function toUiHabit(habit: Habit): UiHabit {
  return {
    id: habit.id,
    name: habit.name,
    streak_label: habit.streakLabel,
    progress_percent: habit.progressPercent,
    detail_label: habit.detailLabel,
    accent: habit.accent as UiAccent,
    sort_order: habit.sortOrder,
  };
}

export function fromUiHabit(habit: UiHabit): Habit {
  return {
    id: habit.id,
    name: habit.name,
    streakLabel: habit.streak_label,
    progressPercent: habit.progress_percent,
    detailLabel: habit.detail_label,
    accent: habit.accent as Habit['accent'],
    sortOrder: habit.sort_order,
  };
}