import { useEffect, useMemo } from 'react';
import { Target, Plus, Check, Calendar } from 'lucide-react';
import { useGoalStore } from '@/core/store/useGoalStore';
import { calculateGoalProgress, sortGoals } from '@/core/engines/goalEngine';
import { GoalStatus } from '@/core/domain/enums';
import type { Goal } from '@/core/domain/model/Goal';
import { toUiGoal, fromUiGoal, type UiGoal } from './goalUiAdapter';

interface GoalsViewProps {
  onCreate: () => void;
}

const categoryConfig = {
  academic: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Academic' },
  study: { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', label: 'Study' },
  personal: { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20', label: 'Personal' },
  health: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Health' },
};

export function GoalsView({ onCreate }: GoalsViewProps) {
  const { data, loading, error, initialized, load, upsert } = useGoalStore();

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const goals = useMemo(() => sortGoals(data).map(toUiGoal), [data]);
  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  const handleComplete = async (goal: UiGoal) => {
    try {
      await upsert(fromUiGoal({ ...goal, status: 'completed', current_value: goal.target_value }));
    } catch (e) {
      console.error('Failed to complete goal', e);
    }
  };

  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading goals…</p>
        </div>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="font-body-lg text-error">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg border border-white/8 bg-surface-container/60 px-4 py-2">
            <p className="font-label-mono-xs text-on-surface-variant/50">Active</p>
            <p className="font-headline-md text-[18px] font-bold text-primary">{active.length}</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-surface-container/60 px-4 py-2">
            <p className="font-label-mono-xs text-on-surface-variant/50">Completed</p>
            <p className="font-headline-md text-[18px] font-bold text-tertiary">{completed.length}</p>
          </div>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Goal
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {active.map((goal) => {
          const cat = categoryConfig[goal.category] || categoryConfig.academic;
          const pct = calculateGoalProgress({ ...goal, id: goal.id, name: goal.name, description: goal.description, category: goal.category as Goal['category'], targetValue: goal.target_value, currentValue: goal.current_value, unit: goal.unit, deadlineLabel: goal.deadline_label, status: goal.status as GoalStatus, sortOrder: goal.sort_order });
          return (
            <div key={goal.id} className={`glass-card rounded-3xl p-5 border ${cat.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.bg}`}>
                    <Target className={`h-5 w-5 ${cat.color}`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] font-semibold text-on-background">{goal.name}</p>
                    <p className="font-label-mono-xs text-on-surface-variant/50">{cat.label} · {goal.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline-md text-[20px] font-bold text-on-background">{pct}%</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">{goal.current_value}/{goal.target_value}</p>
                </div>
              </div>

              <div className="mt-4 mb-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color.replace('text-', 'from-')} to-white/20 transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-on-surface-variant/40" />
                  <span className="font-label-mono-xs text-on-surface-variant/50">{goal.deadline_label}</span>
                </div>
                <button
                  onClick={() => void handleComplete(goal)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 font-label-mono-xs text-on-surface-variant transition-all hover:bg-white/10"
                >
                  <Check className="h-3.5 w-3.5" />
                  Complete
                </button>
              </div>
            </div>
          );
        })}
        {active.length === 0 && (
          <div className="glass-card rounded-3xl p-10 text-center">
            <p className="font-label-mono-sm text-on-surface-variant/50">No active goals yet.</p>
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div className="glass-card rounded-3xl p-5">
          <h3 className="mb-3 font-headline-md text-[15px] font-semibold text-on-surface-variant">Completed Goals</h3>
          <div className="space-y-2">
            {completed.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/20 p-3 opacity-60">
                <Check className="h-5 w-5 text-tertiary" strokeWidth={2.5} />
                <p className="font-body-md text-[13px] text-on-surface-variant line-through">{goal.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}