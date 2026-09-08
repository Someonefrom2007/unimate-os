import { Flame, ChevronRight } from 'lucide-react';
import type { Habit } from '@/lib/types';
import { accentText, accentProgress, accentSoftBg } from '@/lib/accent';

interface HabitTrackerProps {
  habits: Habit[];
  onViewAll?: () => void;
}

export function HabitTracker({ habits, onViewAll }: HabitTrackerProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Habit Tracker
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Weekly consistency
          </p>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 font-label-mono-sm text-[11px] text-primary/80 transition-all duration-200 hover:text-primary">
          Details
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="rounded-lg border border-white/5 bg-surface-container/40 p-3.5 transition-all duration-200 hover:border-white/10"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentSoftBg(habit.accent)}`}>
                  <Flame className={`h-4 w-4 ${accentText(habit.accent)}`} strokeWidth={2} />
                </div>
                <p className="font-body-md text-[13px] font-medium text-on-background">
                  {habit.name}
                </p>
              </div>
              {habit.streak_label ? (
                <span className={`font-label-mono-sm font-bold ${accentText(habit.accent)}`}>
                  {habit.streak_label}
                </span>
              ) : habit.detail_label ? (
                <span className="font-label-mono-xs text-on-surface-variant/60">
                  {habit.detail_label}
                </span>
              ) : null}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${accentProgress(habit.accent)} transition-all duration-500`}
                  style={{ width: `${habit.progress_percent}%` }}
                />
              </div>
              <span className="font-label-mono-xs text-on-surface-variant/60">
                {habit.progress_percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
