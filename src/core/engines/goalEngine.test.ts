/**
 * GoalEngine unit tests — status derivation, progress, deadline, sorting.
 */
import { describe, expect, it } from 'vitest';
import {
  aggregateGoalProgress,
  calculateGoalProgress,
  deriveGoalStatus,
  filterGoalsByCategory,
  filterGoalsByStatus,
  incrementGoalProgress,
  isGoalOverdue,
  setGoalProgress,
  sortGoals,
} from './goalEngine';
import { GoalCategory, GoalStatus } from '../domain/enums';
import type { Goal } from '../domain/model/Goal';

function makeGoal(overrides: Partial<Goal> & { id: string }): Goal {
  return {
    name: 'Test Goal',
    description: 'Test',
    category: GoalCategory.Academic,
    targetValue: 100,
    currentValue: 0,
    unit: 'points',
    deadlineLabel: 'Dec 31, 2025',
    status: GoalStatus.Active,
    sortOrder: 1,
    ...overrides,
  };
}

describe('deriveGoalStatus', () => {
  it('returns Active for new goal', () => {
    expect(deriveGoalStatus(makeGoal({ id: 'g1' }))).toBe(GoalStatus.Active);
  });

  it('returns Completed when current >= target', () => {
    expect(deriveGoalStatus(makeGoal({ id: 'g1', currentValue: 100, targetValue: 100 }))).toBe(GoalStatus.Completed);
  });

  it('returns Completed when already marked', () => {
    expect(deriveGoalStatus(makeGoal({ id: 'g1', status: GoalStatus.Completed }))).toBe(GoalStatus.Completed);
  });
});

describe('calculateGoalProgress', () => {
  it('returns percentage', () => {
    expect(calculateGoalProgress(makeGoal({ id: 'g1', currentValue: 50, targetValue: 100 }))).toBe(50);
  });

  it('clamps at 100%', () => {
    expect(calculateGoalProgress(makeGoal({ id: 'g1', currentValue: 150, targetValue: 100 }))).toBe(100);
  });

  it('returns 0 for zero target', () => {
    expect(calculateGoalProgress(makeGoal({ id: 'g1', targetValue: 0 }))).toBe(0);
  });
});

describe('isGoalOverdue', () => {
  const past = new Date('2020-01-01');
  const future = new Date('2030-01-01');

  it('returns false for future deadline', () => {
    expect(isGoalOverdue(makeGoal({ id: 'g1', deadlineLabel: '2030-01-01' }), future)).toBe(false);
  });

  it('returns true for past deadline', () => {
    expect(isGoalOverdue(makeGoal({ id: 'g1', deadlineLabel: 'Jan 1, 2020' }), past)).toBe(true);
  });

  it('returns false for completed goal', () => {
    expect(isGoalOverdue(makeGoal({ id: 'g1', deadlineLabel: '2020-01-01', status: GoalStatus.Completed }), past)).toBe(false);
  });

  it('handles unparseable dates', () => {
    expect(isGoalOverdue(makeGoal({ id: 'g1', deadlineLabel: 'someday' }), past)).toBe(false);
  });
});

describe('filterGoalsByStatus', () => {
  const goals = [
    makeGoal({ id: 'g1', status: GoalStatus.Active }),
    makeGoal({ id: 'g2', status: GoalStatus.Completed }),
    makeGoal({ id: 'g3', status: GoalStatus.Active }),
  ];

  it('filters active', () => {
    expect(filterGoalsByStatus(goals, GoalStatus.Active)).toHaveLength(2);
  });

  it('filters completed', () => {
    expect(filterGoalsByStatus(goals, GoalStatus.Completed)).toHaveLength(1);
  });

  it('returns all for "all"', () => {
    expect(filterGoalsByStatus(goals, 'all')).toHaveLength(3);
  });
});

describe('filterGoalsByCategory', () => {
  const goals = [
    makeGoal({ id: 'g1', category: GoalCategory.Academic }),
    makeGoal({ id: 'g2', category: GoalCategory.Health }),
    makeGoal({ id: 'g3', category: GoalCategory.Academic }),
  ];

  it('filters by category', () => {
    expect(filterGoalsByCategory(goals, GoalCategory.Academic)).toHaveLength(2);
  });
});

describe('sortGoals', () => {
  it('puts overdue first', () => {
    const past = new Date('2020-01-01');
    const goals = [
      makeGoal({ id: 'g1', deadlineLabel: 'Dec 31, 2025' }),
      makeGoal({ id: 'g2', deadlineLabel: 'Jan 1, 2020' }),
    ];
    const sorted = sortGoals(goals);
    expect(sorted[0].id).toBe('g2');
  });

  it('puts completed last', () => {
    const goals = [
      makeGoal({ id: 'g1', status: GoalStatus.Completed, deadlineLabel: 'Dec 31, 2025' }),
      makeGoal({ id: 'g2', status: GoalStatus.Active, deadlineLabel: 'Jan 1, 2030' }),
    ];
    const sorted = sortGoals(goals);
    expect(sorted[0].id).toBe('g2');
  });
});

describe('aggregateGoalProgress', () => {
  it('computes stats correctly', () => {
    const goals = [
      makeGoal({ id: 'g1', status: GoalStatus.Active }),
      makeGoal({ id: 'g2', status: GoalStatus.Completed }),
      makeGoal({ id: 'g3', status: GoalStatus.Active }),
    ];
    const agg = aggregateGoalProgress(goals);
    expect(agg).toEqual({ total: 3, completed: 1, percent: 33 });
  });

  it('handles empty', () => {
    expect(aggregateGoalProgress([])).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});

describe('incrementGoalProgress', () => {
  it('increments and completes at target', () => {
    const goal = makeGoal({ id: 'g1', currentValue: 99, targetValue: 100 });
    const next = incrementGoalProgress(goal);
    expect(next.currentValue).toBe(100);
    expect(next.status).toBe(GoalStatus.Completed);
  });

  it('clamps at target', () => {
    const goal = makeGoal({ id: 'g1', currentValue: 100, targetValue: 100 });
    const next = incrementGoalProgress(goal);
    expect(next.currentValue).toBe(100);
  });
});

describe('setGoalProgress', () => {
  it('sets exact value', () => {
    const goal = makeGoal({ id: 'g1', targetValue: 100 });
    const updated = setGoalProgress(goal, 42);
    expect(updated.currentValue).toBe(42);
    expect(updated.status).toBe(GoalStatus.Active);
  });

  it('completes at target', () => {
    const goal = makeGoal({ id: 'g1', targetValue: 100 });
    const updated = setGoalProgress(goal, 100);
    expect(updated.currentValue).toBe(100);
    expect(updated.status).toBe(GoalStatus.Completed);
  });

  it('clamps negative to 0', () => {
    const goal = makeGoal({ id: 'g1', targetValue: 100 });
    const updated = setGoalProgress(goal, -10);
    expect(updated.currentValue).toBe(0);
  });

  it('clamps above target to target', () => {
    const goal = makeGoal({ id: 'g1', targetValue: 100 });
    const updated = setGoalProgress(goal, 150);
    expect(updated.currentValue).toBe(100);
    expect(updated.status).toBe(GoalStatus.Completed);
  });
});