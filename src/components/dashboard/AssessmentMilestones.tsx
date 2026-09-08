import { Target, ChevronRight } from 'lucide-react';
import type { Assessment } from '@/lib/types';
import { accentText, accentSoftBg, accentBorder } from '@/lib/accent';

interface AssessmentMilestonesProps {
  assessments: Assessment[];
  onViewAll?: () => void;
}

export function AssessmentMilestones({ assessments, onViewAll }: AssessmentMilestonesProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Assessment Milestones
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Upcoming exams & papers
          </p>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 font-label-mono-sm text-[11px] text-primary/80 transition-all duration-200 hover:text-primary">
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {assessments.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border ${accentBorder(a.accent)} bg-surface-container/40 p-4 transition-all duration-200 hover:bg-surface-container/70`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentSoftBg(a.accent)}`}>
                  <Target className={`h-[18px] w-[18px] ${accentText(a.accent)}`} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">
                    {a.code_label}
                  </p>
                  <p className="font-body-md text-[13px] font-semibold text-on-background">
                    {a.title}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 font-headline-md text-[15px] font-bold ${accentText(a.accent)}`}>
                {a.days_until_label}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 pl-12 font-label-mono-xs text-on-surface-variant/50">
              <span>{a.weight_label}</span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Target: {a.target_grade}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
