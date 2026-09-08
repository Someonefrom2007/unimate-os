import { useEffect } from 'react';
import { Target, Award, Calendar } from 'lucide-react';
import { useExamStore } from '@/core/store/useExamStore';
import { accentText, accentSoftBg, accentBorder } from '@/lib/accent';
import { toUiExam } from './examUiAdapter';

export function AssessmentsView() {
  const { data, loading, error, initialized, load } = useExamStore();

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading exams…</p>
        </div>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="font-body-lg text-error">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">
          Retry
        </button>
      </div>
    );
  }

  const assessments = data.map(toUiExam);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {assessments.map((a) => (
        <div
          key={a.id}
          className={`glass-card rounded-3xl border-l-2 ${accentBorder(a.accent)} p-6 transition-all duration-300 hover:translate-y-[-2px]`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentSoftBg(a.accent)}`}>
                <Target className={`h-6 w-6 ${accentText(a.accent)}`} strokeWidth={2} />
              </div>
              <div>
                <p className={`font-label-mono-sm font-bold ${accentText(a.accent)}`}>
                  {a.code_label}
                </p>
                <p className="font-label-mono-xs text-on-surface-variant/50">
                  Assessment Milestone
                </p>
              </div>
            </div>
            <span className={`font-headline-lg text-[22px] font-bold ${accentText(a.accent)}`}>
              {a.days_until_label}
            </span>
          </div>

          <h3 className="mt-5 font-headline-md text-[18px] font-semibold text-on-background">
            {a.title}
          </h3>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface-container/40 px-3 py-2">
              <Award className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-label-mono-xs text-on-surface-variant/50">Weight</p>
                <p className="font-body-md text-[13px] font-semibold text-on-background">
                  {a.weight_label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface-container/40 px-3 py-2">
              <Target className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-label-mono-xs text-on-surface-variant/50">Target</p>
                <p className="font-body-md text-[13px] font-semibold text-on-background">
                  {a.target_grade}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface-container/40 px-3 py-2">
              <Calendar className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-label-mono-xs text-on-surface-variant/50">Timeline</p>
                <p className="font-body-md text-[13px] font-semibold text-on-background">
                  {a.days_until_label}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
