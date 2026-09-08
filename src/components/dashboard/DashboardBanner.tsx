import { Sparkles, ArrowUpRight } from 'lucide-react';

interface DashboardBannerProps {
  userName: string;
  nextSessionLabel: string;
  taskCount: number;
  assessmentCount: number;
  streakDays: number;
  gpa: number;
  greeting: string;
  semesterLabel: string;
  onStartFocus?: () => void;
  onViewPlan?: () => void;
}

export function DashboardBanner({
  userName,
  nextSessionLabel,
  taskCount,
  assessmentCount,
  streakDays,
  gpa,
  greeting,
  semesterLabel,
  onStartFocus,
  onViewPlan,
}: DashboardBannerProps) {
  const firstName = userName?.split(' ')[0] || 'there';
  const nextClassLabel = nextSessionLabel || 'No classes scheduled yet';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-6 sm:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-tertiary/8 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 font-label-mono-xs uppercase tracking-[0.08em] text-primary/90">
              <Sparkles className="h-3 w-3" />
              {semesterLabel}
            </span>
            <span className="font-label-mono-xs uppercase tracking-[0.08em] text-on-surface-variant/50">
              {nextClassLabel}
            </span>
          </div>

          <h2 className="font-display-hero text-[28px] font-bold leading-[1.15] tracking-tight text-on-background sm:text-[36px]">
            {greeting}, <span className="gold-gradient-text">{firstName}</span>
          </h2>
          <p className="mt-2 max-w-lg font-body-lg text-[14px] leading-relaxed text-on-surface-variant">
            {taskCount > 0 && assessmentCount > 0 ? (
              <>
                You have <span className="font-semibold text-primary">{taskCount} task{taskCount !== 1 ? 's' : ''}</span> due this week and{' '}
                <span className="font-semibold text-tertiary">{assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}</span> on the horizon.
                Keep the momentum going.
              </>
            ) : taskCount > 0 ? (
              <>
                You have <span className="font-semibold text-primary">{taskCount} task{taskCount !== 1 ? 's' : ''}</span> due this week.
                Keep the momentum going.
              </>
            ) : assessmentCount > 0 ? (
              <>
                You have <span className="font-semibold text-tertiary">{assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}</span> on the horizon.
                Keep the momentum going.
              </>
            ) : (
              <>
                Your workspace is all clear — no pending tasks or assessments right now.
                Add a task or start a focus session to get things rolling.
              </>
            )}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartFocus}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-all duration-200 ease-out hover:scale-[1.02]"
            >
              Start Focus Session
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={onViewPlan}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 font-body-md text-[13px] font-medium text-on-background transition-all duration-200 ease-out hover:bg-white/10"
            >
              View Weekly Plan
            </button>
          </div>
        </div>

        <div className="flex gap-3 sm:flex-col">
          <div className="flex flex-col items-center rounded-xl border border-white/8 bg-surface-container/60 px-5 py-4">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">
              GPA
            </span>
            {gpa > 0 ? (
              <span className="font-headline-lg text-[28px] font-bold text-primary">{gpa.toFixed(1)}</span>
            ) : (
              <span className="font-headline-lg text-[28px] font-bold text-on-surface-variant/40">—</span>
            )}
          </div>
          <div className="flex flex-col items-center rounded-xl border border-white/8 bg-surface-container/60 px-5 py-4">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">
              Streak
            </span>
            {streakDays > 0 ? (
              <span className="font-headline-lg text-[28px] font-bold text-tertiary">{streakDays}d</span>
            ) : (
              <span className="font-headline-lg text-[28px] font-bold text-on-surface-variant/40">0d</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
