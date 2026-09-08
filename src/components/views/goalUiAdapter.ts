import type { Goal } from '@/core/domain/model/Goal';
import type { AccentColor as UiAccent } from '@/lib/types';

/** Legacy snake_case UI shape for the Goals view. */
export interface UiGoal {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'study' | 'personal' | 'health';
  target_value: number;
  current_value: number;
  unit: string;
  deadline_label: string;
  status: 'active' | 'completed';
  sort_order: number;
}

export function toUiGoal(goal: Goal): UiGoal {
  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    category: goal.category as UiGoal['category'],
    target_value: goal.targetValue,
    current_value: goal.currentValue,
    unit: goal.unit,
    deadline_label: goal.deadlineLabel,
    status: goal.status as UiGoal['status'],
    sort_order: goal.sortOrder,
  };
}

export function fromUiGoal(goal: UiGoal): Goal {
  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    category: goal.category as Goal['category'],
    targetValue: goal.target_value,
    currentValue: goal.current_value,
    unit: goal.unit,
    deadlineLabel: goal.deadline_label,
    status: goal.status as Goal['status'],
    sortOrder: goal.sort_order,
  };
}