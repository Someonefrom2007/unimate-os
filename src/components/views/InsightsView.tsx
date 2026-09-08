/**
 * InsightsView — live academic analytics powered by InsightsEngine.
 * Reads directly from domain stores.
 */
import { useMemo, useEffect } from 'react';
import { TrendingUp, Clock, AlertTriangle, Sparkles, BarChart3 } from 'lucide-react';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useTaskStore } from '@/core/store/useTaskStore';
import { useExamStore } from '@/core/store/useExamStore';
import { useGradeStore } from '@/core/store/useGradeStore';
import { useFocusStore } from '@/core/store/useFocusStore';
import { useHabitStore } from '@/core/store/useHabitStore';
import { useGoalStore } from '@/core/store/useGoalStore';
import { computeInsightReport, type InsightReport } from '@/core/engines/insightsEngine';

/** Mini sparkline for grade trend. */
function Sparkline({ data, color, w = 140, h = 36 }: { data: { value: number }[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const vals = data.map((d) => d.value);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="opacity-80" />
      <circle cx={w} cy={h - ((vals[vals.length - 1] - mn) / rng) * (h - 4) - 2} r="3" fill={color} />
    </svg>
  );
}

export function InsightsView() {
  const { data: courses, initialized: cInit, load: loadC } = useCourseStore();
  const { data: tasks, initialized: tInit, load: loadT } = useTaskStore();
  const { data: exams, initialized: eInit, load: loadE } = useExamStore();
  const { data: grades, initialized: gInit, load: loadG } = useGradeStore();
  const { data: sessions, initialized: sInit, load: loadS } = useFocusStore();
  const { data: habits, initialized: hInit, load: loadH } = useHabitStore();
  const { data: goals, initialized: goInit, load: loadGo } = useGoalStore();

  useEffect(() => {
    if (!cInit) void loadC();
    if (!tInit) void loadT();
    if (!eInit) void loadE();
    if (!gInit) void loadG();
    if (!sInit) void loadS();
    if (!hInit) void loadH();
    if (!goInit) void loadGo();
  }, [cInit, tInit, eInit, gInit, sInit, hInit, goInit, loadC, loadT, loadE, loadG, loadS, loadH, loadGo]);

  const report: InsightReport = useMemo(
    () => computeInsightReport(tasks, courses, exams, grades, sessions, habits, goals),
    [tasks, courses, exams, grades, sessions, habits, goals],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10"><Sparkles className="h-5 w-5 text-secondary" strokeWidth={2} /></div>
        <div>
          <h2 className="font-headline-md text-[17px] font-semibold text-on-background">Insights</h2>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">Performance analytics & recommendations</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><TrendingUp className="h-[18px] w-[18px] text-primary" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Avg Grade</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{report.velocity.averageGrade}/10</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10"><Clock className="h-[18px] w-[18px] text-secondary" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Focus Hours</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-secondary">{report.focus.totalHoursThisWeek.toFixed(1)}h</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{Math.round(report.focus.completionRatio * 100)}% completion</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary/10"><BarChart3 className="h-[18px] w-[18px] text-tertiary" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Task Velocity</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-tertiary">{Math.round(report.velocity.overallCompletion * 100)}%</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">tasks completed</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10"><AlertTriangle className="h-[18px] w-[18px] text-error" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Overdue</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-error">{report.overdueTaskCount}</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">tasks overdue</p>
        </div>
      </div>

      {/* Grade Trend Sparkline */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <p className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">Grade Trend</p>
        <div className="flex items-center gap-4">
          <p className="font-headline-lg text-[28px] font-bold text-on-background">{report.velocity.averageGrade}<span className="ml-1 text-[16px] text-on-surface-variant/40">/10</span></p>
          <Sparkline data={report.gradeTrend} color="#ffc880" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {report.gradeTrend.slice(-5).map((pt, i) => (
            <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 font-label-mono-xs text-[10px] text-primary/80">{pt.label}: {pt.value}</span>
          ))}
        </div>
      </div>

      {/* Habits & Exam Readiness */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">Habit Consistency</p>
          <div className="flex items-center gap-3">
            <p className="font-headline-lg text-[28px] font-bold text-on-background">{Math.round(report.habitConsistency * 100)}%</p>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-tertiary to-secondary transition-all" style={{ width: `${report.habitConsistency * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">Exam Readiness</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-headline-lg text-[22px] font-bold text-error">{report.examReadiness.withinWeek}</p>
              <p className="font-label-mono-xs text-[10px] text-on-surface-variant/50">This week</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg text-[22px] font-bold text-primary">{report.examReadiness.within30Days}</p>
              <p className="font-label-mono-xs text-[10px] text-on-surface-variant/50">This month</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg text-[22px] font-bold text-on-surface-variant/60">{report.examReadiness.total}</p>
              <p className="font-label-mono-xs text-[10px] text-on-surface-variant/50">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages / Insights */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <p className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">AI Insights</p>
        <div className="space-y-2">
          {report.messages.map((m, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/3 px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <p className="font-body-md text-[13px] text-on-surface-variant">{m}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course Velocity */}
      {report.velocity.courses.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">Course Progress</p>
          <div className="space-y-3">
            {report.velocity.courses.map((c) => (
              <div key={c.courseCode} className="flex items-center gap-3">
                <span className="min-w-[60px] font-label-mono-xs text-[11px] font-bold text-on-surface-variant/60">{c.courseCode}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${c.completionRatio * 100}%` }} />
                  </div>
                </div>
                <span className="font-label-mono-xs text-[11px] text-on-surface-variant/60">{Math.round(c.completionRatio * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
