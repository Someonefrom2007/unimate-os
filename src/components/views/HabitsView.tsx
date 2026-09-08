import { useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useHabitStore } from '@/core/store/useHabitStore';
import { toUiHabit } from './habitUiAdapter';
import { accentText, accentProgress, accentSoftBg } from '@/lib/accent';

export function HabitsView() {
  const { data, loading, error, initialized, load } = useHabitStore();

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const habits = useMemo(() => data.map(toUiHabit), [data]);

  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading habits…</p>
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="glass-card rounded-3xl p-5 transition-all duration-300 hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentSoftBg(habit.accent)}`}>
                <Flame className={`h-5 w-5 ${accentText(habit.accent)}`} strokeWidth={2} />
              </div>
              <p className="font-body-md text-[14px] font-semibold text-on-background">
                {habit.name}
              </p>
            </div>
            {habit.streak_label ? (
              <span className={`font-headline-lg text-[24px] font-bold ${accentText(habit.accent)}`}>
                {habit.streak_label}
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-label-mono-xs text-on-surface-variant/50">
                {habit.detail_label || 'Weekly progress'}
              </span>
              <span className={`font-label-mono-sm font-bold ${accentText(habit.accent)}`}>
                {habit.progress_percent}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accentProgress(habit.accent)} transition-all duration-500`}
                style={{ width: `${habit.progress_percent}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      {habits.length === 0 && (
        <div className="col-span-full glass-card rounded-3xl p-10 text-center">
          <p className="font-label-mono-sm text-on-surface-variant/50">No habits yet.</p>
        </div>
      )}
    </div>
  );
}