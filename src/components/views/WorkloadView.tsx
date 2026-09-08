/**
 * WorkloadView — live study-pressure dashboard powered by WorkloadEngine.
 * Reads directly from domain stores; no props needed.
 */
import { useMemo, useEffect } from 'react';
import { BarChart3, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useTaskStore } from '@/core/store/useTaskStore';
import { useExamStore } from '@/core/store/useExamStore';
import { useFocusStore } from '@/core/store/useFocusStore';
import { useScheduleStore } from '@/core/store/useScheduleStore';
import { computeWorkloadReport } from '@/core/engines/workloadEngine';

export function WorkloadView() {
  const { data: courses, initialized: cInit, load: loadC } = useCourseStore();
  const { data: tasks, initialized: tInit, load: loadT } = useTaskStore();
  const { data: exams, initialized: eInit, load: loadE } = useExamStore();
  const { data: sessions, initialized: sInit, load: loadS } = useFocusStore();
  const { data: schedule, initialized: scInit, load: loadSc } = useScheduleStore();

  useEffect(() => {
    if (!cInit) void loadC();
    if (!tInit) void loadT();
    if (!eInit) void loadE();
    if (!sInit) void loadS();
    if (!scInit) void loadSc();
  }, [cInit, tInit, eInit, sInit, scInit, loadC, loadT, loadE, loadS, loadSc]);

  const report = useMemo(() => computeWorkloadReport(tasks, exams, sessions), [tasks, exams, sessions]);

  const levelColor = report.level === 'high' ? 'text-error' : report.level === 'moderate' ? 'text-primary' : 'text-tertiary';
  const levelBg = report.level === 'high' ? 'bg-error/10' : report.level === 'moderate' ? 'bg-primary/10' : 'bg-tertiary/10';

  const courseWorkload = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed);
    return courses
      .map((c) => ({
        course: c,
        count: pending.filter((t) => t.courseCode === c.code).length,
        hours: pending.filter((t) => t.courseCode === c.code).reduce((s, t) => s + t.estimatedHours, 0),
      }))
      .filter((c) => c.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [courses, tasks]);

  const maxHours = Math.max(...courseWorkload.map((c) => c.hours), 1);

  const today = new Date();
  const todayEntry = schedule.find((e) => e.isToday);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" strokeWidth={2} /></div>
        <div>
          <h2 className="font-headline-md text-[17px] font-semibold text-on-background">Workload</h2>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">Weekly cognitive load analysis</p>
        </div>
      </div>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
          {report.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-on-surface-variant/70"><AlertTriangle className="h-4 w-4 shrink-0 text-primary/70" /><span className="font-body-sm text-[13px]">{w}</span></div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Clock className="h-[18px] w-[18px] text-primary" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Today</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{report.days[new Date((today.getDay() + 6) % 7)]?.hours.toFixed(1) || '0.0'}h</p>
          <p className="mt-1 font-label-mono-xs text-primary/70">{todayEntry ? todayEntry.courseName : 'No class today'}</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${levelBg}`}>
            <BarChart3 className={`h-[18px] w-[18px] ${levelColor}`} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">This Week</p>
          <p className={`mt-1 font-headline-lg text-[26px] font-bold ${levelColor}`}>{report.totalHours.toFixed(1)}h</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{tasks.filter((t) => !t.completed).length} tasks</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10"><TrendingUp className="h-[18px] w-[18px] text-secondary" /></div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Peak Day</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-secondary">{report.peakDay ? report.peakDay.hours.toFixed(1) + 'h' : '—'}</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{report.peakDay ? report.peakDay.dateLabel : 'No peak'}</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${levelBg}`}>
            <AlertTriangle className={`h-[18px] w-[18px] ${levelColor}`} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Load Level</p>
          <p className={`mt-1 font-headline-lg text-[26px] font-bold capitalize ${levelColor}`}>{report.level === 'none' ? 'Light' : report.level}</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">avg {report.averageDailyHours.toFixed(1)}h/day</p>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <p className="mb-4 font-headline-md text-[15px] font-semibold text-on-background">Daily Load Distribution</p>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {report.days.map((d, i) => {
            const pct = Math.max(4, report.totalHours > 0 ? (d.hours / (report.totalHours / 3)) * 100 : 4);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full rounded-t-md transition-all duration-300" style={{ height: `${Math.min(100, pct)}%`, backgroundColor: d.pressure >= 80 ? '#ff525280' : d.pressure >= 40 ? '#ffc88080' : '#b4b7ff40' }}>
                  {d.hours > 0 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-label-mono-xs text-[9px] text-on-surface-variant/50">{d.hours.toFixed(1)}h</span>}
                </div>
                <span className="font-label-mono-xs text-[9px] text-on-surface-variant/40">{d.dateLabel.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course Breakdown */}
      {courseWorkload.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="mb-4 font-headline-md text-[15px] font-semibold text-on-background">Course Breakdown</p>
          <div className="space-y-3">
            {courseWorkload.map((c) => (
              <div key={c.course.id} className="flex items-center gap-3">
                <span className="min-w-[70px] font-label-mono-xs text-[11px] font-bold text-on-surface-variant/60">{c.course.code}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all" style={{ width: `${(c.hours / maxHours) * 100}%` }} />
                  </div>
                </div>
                <span className="font-label-mono-xs text-[11px] text-on-surface-variant/60">{c.hours}h · {c.count} tasks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
