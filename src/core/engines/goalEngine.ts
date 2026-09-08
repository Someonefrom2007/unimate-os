/**
 * GoalEngine — pure domain logic for the goals vertical slice.
 * Progress calculation, deadline awareness, status derivation.
 */
import { GoalCategory, GoalStatus } from '../domain/enums';
import type { Goal } from '../domain/model/Goal';

/** Derive a goal's status from its progress vs target. */
export function deriveGoalStatus(goal: Goal): GoalStatus {
  if (goal.status === GoalStatus.Completed) return GoalStatus.Completed;
  if (goal.targetValue <= 0) return GoalStatus.Active;
  if (goal.currentValue >= goal.targetValue) return GoalStatus.Completed;
  return GoalStatus.Active;
}

/** Progress percentage (0–100). */
export function calculateGoalProgress(goal: Goal): number {
  if (goal.targetValue <= 0) return 0;
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
}

/** Check if a goal is overdue (deadline passed, not completed). */
export function isGoalOverdue(goal: Goal, now: Date = new Date()): boolean {
  // Simple heuristic: parse deadline_label like "Dec 20, 2025"
  const d = new Date(goal.deadlineLabel);
  if (isNaN(d.getTime())) return false;
  return d < now && goal.status !== GoalStatus.Completed;
}

/** Filter goals by status. */
export function filterGoalsByStatus(goals: Goal[], status: GoalStatus | 'all'): Goal[] {
  if (status === 'all') return goals;
  return goals.filter((g) => g.status === status);
}

/** Filter goals by category. */
export function filterGoalsByCategory(goals: Goal[], category: GoalCategory): Goal[] {
  return goals.filter((g) => g.category === category);
}

/** Sort goals: overdue first, then by deadline ascending, then active before completed. */
export function sortGoals(goals: Goal[]): Goal[] {
  const now = new Date();
  return [...goals].sort((a, b) => {
    const aOverdue = isGoalOverdue(a, now);
    const bOverdue = isGoalOverdue(b, now);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    const aCompleted = a.status === GoalStatus.Completed;
    const bCompleted = b.status === GoalStatus.Completed;
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

    const ad = new Date(a.deadlineLabel);
    const bd = new Date(b.deadlineLabel);
    return ad.getTime() - bd.getTime();
  });
}

/** Aggregate progress across all goals. */
export function aggregateGoalProgress(goals: Goal[]): { total: number; completed: number; percent: number } {
  const completed = goals.filter((g) => g.status === GoalStatus.Completed).length;
  return { total: goals.length, completed, percent: goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0 };
}

/** Increment a goal's current value by 1 (clamped at target). */
export function incrementGoalProgress(goal: Goal): Goal {
  const next = Math.min(goal.targetValue, goal.currentValue + 1);
  return { ...goal, currentValue: next, status: next >= goal.targetValue ? GoalStatus.Completed : GoalStatus.Active };
}

/** Set goal progress directly (clamped). */
export function setGoalProgress(goal: Goal, value: number): Goal {
  const clamped = Math.max(0, Math.min(goal.targetValue, value));
  return { ...goal, currentValue: clamped, status: clamped >= goal.targetValue ? GoalStatus.Completed : GoalStatus.Active };
}