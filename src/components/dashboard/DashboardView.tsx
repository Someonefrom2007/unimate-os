import { useMemo, useEffect } from 'react';
import {
  BookOpen, Clock, MapPin, Users, FlaskConical,
  Search, Plus, Bell, Calendar,
  TrendingUp, ChevronRight, AlertTriangle,
  Timer, Rocket, Lightbulb, ArrowUpRight,
} from 'lucide-react';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useTaskStore } from '@/core/store/useTaskStore';
import { useScheduleStore } from '@/core/store/useScheduleStore';
import { useGradeStore } from '@/core/store/useGradeStore';
import { useExamStore } from '@/core/store/useExamStore';
import { useFocusStore } from '@/core/store/useFocusStore';
import type { Course as DomainCourse } from '@/core/domain/model/Course';
import { accentHex } from '@/lib/accent';
import type { AccentColor, ViewKey } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DashboardViewProps {
  onNavigate: (view: ViewKey) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOTIVATIONAL = [
  "You're surprisingly on top of things.",
  "Consistency is your superpower.",
  "Keep the momentum going.",
  "Another productive day ahead.",
];

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function greetingForHour(h: number): string {
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function parseStartMinute(label: string): number | null {
  const m = label.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const low = label.toLowerCase();
  if (low.includes('pm') && h < 12) h += 12;
  if (low.includes('am') && h === 12) h = 0;
  return h * 60 + min;
}

function minsUntil(target: number): number {
  const now = new Date();
  return Math.max(0, target - (now.getHours() * 60 + now.getMinutes()));
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function dateLong(d: Date): string {
  return d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
}

function courseHex(c: DomainCourse): string {
  return accentHex(c.accent as AccentColor);
}

/* ------------------------------------------------------------------ */
/*  Tiny SVG helpers                                                   */
/* ------------------------------------------------------------------ */

function Ring({ frac, size = 52, sw = 4, color }: { frac: number; size?: number; sw?: number; color: string }) {
  const r = (size - sw) / 2;
  const C = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, frac)))} className="transition-all duration-1000" />
    </svg>
  );
}

function Spark({ data, color, w = 90, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="opacity-70" />
      <circle cx={w} cy={h - ((data[data.length - 1] - mn) / rng) * (h - 4) - 2} r="2.5" fill={color} className="drop-shadow-[0_0_4px_rgba(255,200,128,0.5)]" />
    </svg>
  );
}

function FocusGauge({ min, total, color }: { min: number; total: number; color: string }) {
  const r = 34;
  const C = 2 * Math.PI * r;
  const frac = total > 0 ? min / total : 0;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={88} height={88} className="rotate-[-90deg]">
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-headline-md text-[18px] font-bold text-on-background">{min}</span>
        <span className="font-label-mono-xs text-[9px] text-on-surface-variant/50">min left</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardView                                                      */
/* ------------------------------------------------------------------ */

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const quote = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];

  /* ---- stores ---- */
  const { data: domainCourses, initialized: cInit, load: loadC } = useCourseStore();
  const { data: domainTasks, initialized: tInit, load: loadT } = useTaskStore();
  const { data: domainSchedule, initialized: sInit, load: loadS } = useScheduleStore();
  const { data: domainGrades, initialized: gInit, load: loadG } = useGradeStore();
  const { data: domainExams, initialized: eInit, load: loadE } = useExamStore();
  const { data: domainFocus, initialized: fInit, load: loadF } = useFocusStore();

  useEffect(() => {
    if (!cInit) void loadC();
    if (!tInit) void loadT();
    if (!sInit) void loadS();
    if (!gInit) void loadG();
    if (!eInit) void loadE();
    if (!fInit) void loadF();
  }, [cInit, tInit, sInit, gInit, eInit, fInit, loadC, loadT, loadS, loadG, loadE, loadF]);

  /* ---- derived data ---- */
  const todayEntries = useMemo(() => domainSchedule.filter((e) => e.isToday), [domainSchedule]);
  const nextEntry = useMemo(() => domainSchedule.find((e) => e.isNext) || domainSchedule.find((e) => e.isToday && !e.isNext) || null, [domainSchedule]);
  const nextStartMin = useMemo(() => nextEntry ? parseStartMinute(nextEntry.timeLabel) : null, [nextEntry]);
  const minsLeft = useMemo(() => nextStartMin !== null ? minsUntil(nextStartMin) : null, [nextStartMin]);

  const totalEcts = useMemo(() => domainCourses.reduce((s, c) => s + c.ects, 0), [domainCourses]);

  const avgGrade = useMemo(() => {
    if (domainGrades.length > 0) {
      const tw = domainGrades.reduce((s, g) => s + g.weight, 0);
      if (tw > 0) return domainGrades.reduce((s, g) => s + (g.grade / g.maxGrade) * 10 * g.weight, 0) / tw;
    }
    return domainCourses.length > 0 ? domainCourses.reduce((s, c) => s + c.avgGrade, 0) / domainCourses.length : 0;
  }, [domainCourses, domainGrades]);

  const gradeSpark = useMemo(() => {
    if (domainGrades.length === 0) return [6.5, 7.0, 6.8, 7.5, 7.8, 8.0];
    const sorted = [...domainGrades].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
    const running: number[] = [];
    let ws = 0, wt = 0;
    for (const g of sorted) { ws += (g.grade / g.maxGrade) * 10 * g.weight; wt += g.weight; running.push(wt > 0 ? ws / wt : 0); }
    return running.slice(-8);
  }, [domainGrades]);

  const pending = useMemo(() => domainTasks.filter((t) => !t.completed), [domainTasks]);
  const overdue = useMemo(() => pending.filter((t) => t.dueLabel && (t.dueLabel.toLowerCase().includes('overdue') || t.dueLabel.toLowerCase().includes('yesterday'))), [pending]);
  const deadlinesWeek = useMemo(() => pending.filter((t) => t.dueLabel && (t.dueLabel.toLowerCase().includes('today') || t.dueLabel.toLowerCase().includes('tomorrow') || t.dueLabel.toLowerCase().includes('this week'))), [pending]);
  const examsNext7 = useMemo(() => domainExams.filter((e) => { const n = parseInt(e.daysUntilLabel, 10); return !isNaN(n) && n >= 0 && n <= 7; }), [domainExams]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalFocusToday = useMemo(() => domainFocus.filter((f) => f.dateLabel?.startsWith(todayStr)).reduce((s, f) => s + (f.durationMinutes * 60 || 0), 0), [domainFocus, todayStr]);
  const focusLeft = useMemo(() => Math.max(0, (nextStartMin ?? 120) - (new Date().getHours() * 60 + new Date().getMinutes()) - Math.floor(totalFocusToday / 60)), [nextStartMin, totalFocusToday]);

  const streakDays = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (domainFocus.some((f) => f.dateLabel?.startsWith(ds))) count++;
      else if (i > 0) break;
    }
    return count;
  }, [domainFocus]);

  const dailyHours = useMemo(() => {
    const res = Array(7).fill(0);
    const today = new Date();
    const mondayOff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    // Academic load: sum estimated hours for pending tasks, distributed across weekdays
    const pendingHours = domainTasks
      .filter((t) => !t.completed)
      .reduce((s, t) => s + (typeof t.estimatedHours === 'number' ? t.estimatedHours : 0), 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + mondayOff + i);
      const dow = d.getDay();
      // Mon–Fri get task load; weekends get 0
      const taskH = (dow >= 1 && dow <= 5) ? pendingHours / 5 : 0;
      const ds = d.toISOString().slice(0, 10);
      const focusH = domainFocus.filter((f) => f.dateLabel?.startsWith(ds)).reduce((s, f) => s + (f.durationMinutes * 60 || 0), 0) / 3600;
      res[i] = Math.round((taskH + focusH) * 10) / 10;
    }
    return res;
  }, [domainTasks, domainFocus]);
  const totalWeeklyH = useMemo(() => { const s = dailyHours.reduce((a, b) => a + b, 0); return `${Math.floor(s)}h ${String(Math.round((s - Math.floor(s)) * 60)).padStart(2, '0')}m`; }, [dailyHours]);
  const avgDaily = useMemo(() => dailyHours.reduce((a, b) => a + b, 0) / 7, [dailyHours]);

  function sessIcon(type: string) {
    switch (type?.toLowerCase()) { case 'lecture': return BookOpen; case 'seminar': return Users; case 'practical': case 'lab': return FlaskConical; default: return BookOpen; }
  }

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-[20px] font-bold text-on-background">{greeting}, <span className="gold-gradient-text">Miquel</span> 👋</h2>
          <p className="font-body-md text-[13px] text-on-surface-variant/60">{quote}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container/40 px-4 py-2 text-on-surface-variant/50 transition-colors hover:border-white/20 hover:text-on-background">
            <Search className="h-3.5 w-3.5" />
            <span className="font-label-mono-xs text-[11px]">Search…</span>
            <kbd className="ml-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-label-mono-xs text-[9px] text-on-surface-variant/40">⌘K</kbd>
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary transition-all hover:bg-primary/25"><Plus className="h-4 w-4" strokeWidth={2.5} /></button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant/60 transition-colors hover:text-on-background">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white">3</span>
          </button>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/8 bg-surface-container/40 px-3 py-2 lg:flex">
            <Calendar className="h-3.5 w-3.5 text-on-surface-variant/50" />
            <span className="font-label-mono-xs text-[11px] text-on-surface-variant/70">{dateLong(new Date())}</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/8 bg-surface-container/40 px-3 py-2 lg:flex">
            <span className="text-[14px]">☀️</span>
            <span className="font-label-mono-xs text-[11px] text-on-surface-variant/70">24°C Barcelona</span>
          </div>
        </div>
      </div>

      {/* ── TOP ROW: 4 cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* NEXT CLASS */}
        <div className="glass-card group relative overflow-hidden rounded-2xl border border-white/8 p-5 transition-all hover:border-white/12">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/8 blur-2xl transition-all group-hover:bg-primary/14" />
          <div className="mb-4 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Next Class</span>
            {minsLeft !== null && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-label-mono-xs font-bold text-primary">{minsLeft} min</span>}
          </div>
          {nextEntry ? (
            <div className="relative flex items-start gap-3">
              <div className="relative">
                <Ring frac={minsLeft !== null ? Math.min(1, minsLeft / 120) : 0} color={courseHex(domainCourses.find((c) => c.name === nextEntry.courseName) || domainCourses[0])} />
                <div className="absolute inset-0 flex items-center justify-center">{(() => { const I = sessIcon(nextEntry.sessionType); return <I className="h-4 w-4 text-on-surface-variant/70" strokeWidth={2} />; })()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-md text-[14px] font-semibold text-on-background">{nextEntry.courseName}</p>
                <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant/50"><Clock className="h-3 w-3" /><span className="font-label-mono-xs text-[11px]">{nextEntry.timeLabel}</span></div>
                {nextEntry.room && <div className="mt-0.5 flex items-center gap-1.5 text-on-surface-variant/50"><MapPin className="h-3 w-3" /><span className="font-label-mono-xs text-[11px]">{nextEntry.room}</span></div>}
                <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 font-label-mono-xs text-[10px] font-semibold" style={{ backgroundColor: `${courseHex(domainCourses.find((c) => c.name === nextEntry.courseName) || domainCourses[0])}22`, color: courseHex(domainCourses.find((c) => c.name === nextEntry.courseName) || domainCourses[0]) }}>{nextEntry.sessionType}</span>
              </div>
            </div>
          ) : <p className="font-body-sm text-[13px] text-on-surface-variant/40">No upcoming classes</p>}
        </div>

        {/* TODAY TIMELINE */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Today</span>
            <span className="font-label-mono-xs text-[11px] text-on-surface-variant/40">{todayEntries.length} event{todayEntries.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="relative max-h-[160px] space-y-0 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {todayEntries.length === 0 && <p className="py-6 text-center font-label-mono-xs text-on-surface-variant/30">Nothing today 🎉</p>}
            {todayEntries.map((e) => {
              const hx = courseHex(domainCourses.find((c) => c.name === e.courseName) || domainCourses[0]);
              return (
                <div key={e.id} className="relative flex items-start gap-3 py-2">
                  <div className="relative z-10 mt-1.5 flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hx, boxShadow: `0 0 8px ${hx}66` }} />
                    <span className="mt-0.5 h-full w-px bg-white/8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body-md text-[12px] font-semibold text-on-background">{e.courseName}</p>
                    <p className="font-label-mono-xs text-[10px] text-on-surface-variant/50">{e.timeLabel}</p>
                  </div>
                  {e.isNext && <span className="mt-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 font-label-mono-xs text-[9px] font-bold text-primary">NEXT</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ACADEMIC SNAPSHOT */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Academic Snapshot</span>
            <span className="rounded-full bg-tertiary/15 px-2 py-0.5 font-label-mono-xs font-bold text-tertiary">{streakDays}d 🔥</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/40">Average Grade</p>
              <p className="mt-0.5 font-headline-lg text-[28px] font-bold text-on-background">{avgGrade.toFixed(1)}<span className="ml-0.5 text-[16px] text-on-surface-variant/40">/10</span></p>
            </div>
            <Spark data={gradeSpark} color="#ffc880" />
          </div>
          <div className="mt-3 rounded-lg border border-white/6 bg-white/3 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-label-mono-xs text-[10px] text-on-surface-variant/50">ECTS Progress</span>
              <span className="font-label-mono-xs text-[11px] font-bold text-on-surface-variant/70">{totalEcts} / 240</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-500" style={{ width: `${Math.min(100, (totalEcts / 240) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* FOCUS TIME */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Focus Time</span>
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 font-label-mono-xs font-bold text-secondary">Today</span>
          </div>
          <div className="flex items-center gap-4">
            <FocusGauge min={Math.floor(totalFocusToday / 60)} total={Math.max(focusLeft + Math.floor(totalFocusToday / 60), 120)} color="#b4b7ff" />
            <div className="min-w-0 flex-1">
              <p className="font-headline-md text-[16px] font-bold text-on-background">{fmtDuration(totalFocusToday)}</p>
              <p className="mt-0.5 font-label-mono-xs text-[10px] text-on-surface-variant/50">{focusLeft > 0 ? `${focusLeft} min until next class` : 'Next class is now'}</p>
              <div className="mt-2 flex gap-1">
                {[...Array(6)].map((_, i) => <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i < Math.ceil(totalFocusToday / 900) ? '#b4b7ff' : 'rgba(255,255,255,0.08)' }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: 3 cards ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* KPI STATS */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <span className="mb-4 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">This Week</span>
          <div className="space-y-3">
            {[
              { label: 'Deadlines This Week', sub: 'Papers & reports due', count: deadlinesWeek.length, icon: AlertTriangle, color: '#ffc880', bg: 'bg-primary/12' },
              { label: 'Exams Next 7 Days', sub: 'Midterms & finals', count: examsNext7.length, icon: TrendingUp, color: '#b4b7ff', bg: 'bg-secondary/12' },
              { label: 'Overdue Tasks', sub: 'Need attention', count: overdue.length, icon: Timer, color: '#ff5252', bg: 'bg-error/12' },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 px-4 py-3 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}><kpi.icon className="h-4 w-4" style={{ color: kpi.color }} /></div>
                  <div>
                    <p className="font-body-md text-[12px] font-semibold text-on-background">{kpi.label}</p>
                    <p className="font-label-mono-xs text-[10px] text-on-surface-variant/40">{kpi.sub}</p>
                  </div>
                </div>
                <span className="font-headline-md text-[18px] font-bold" style={{ color: kpi.color }}>{kpi.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WORKLOAD */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Workload This Week</span>
              <p className="mt-1 font-headline-md text-[18px] font-bold text-on-background">{totalWeeklyH}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-tertiary/12 px-2.5 py-1">
              <TrendingUp className="h-3 w-3 text-tertiary" />
              <span className="font-label-mono-xs text-[10px] font-bold text-tertiary">avg {avgDaily.toFixed(1)}h/day</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 80 }}>
            {dailyHours.map((h, i) => {
              const pct = Math.max(4, (h / Math.max(...dailyHours, 1)) * 100);
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary/30 transition-all duration-300" style={{ height: `${pct}%` }}>
                    {h > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-label-mono-xs text-[9px] text-on-surface-variant/50">{h}h</span>}
                  </div>
                  <span className="font-label-mono-xs text-[9px] text-on-surface-variant/40">{DAY_LETTERS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPCOMING DEADLINES */}
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Upcoming Deadlines</span>
            <button onClick={() => onNavigate('tasks')} className="flex items-center gap-1 font-label-mono-xs text-[11px] text-primary/70 transition-colors hover:text-primary">View all <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 4).map((t) => {
              const pc = t.priority === 'high' ? '#ff5252' : t.priority === 'medium' ? '#ffc880' : '#5beaad';
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 transition-colors hover:border-white/10 hover:bg-white/5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: pc }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body-md text-[12px] font-medium text-on-background">{t.title}</p>
                    {t.courseCode && <span className="font-label-mono-xs text-[10px] text-on-surface-variant/40">{t.courseCode}</span>}
                  </div>
                  {t.dueLabel && <span className="shrink-0 rounded-full bg-white/6 px-2 py-0.5 font-label-mono-xs text-[10px] text-on-surface-variant/50">{t.dueLabel}</span>}
                </div>
              );
            })}
            {pending.length === 0 && <p className="py-6 text-center font-label-mono-xs text-on-surface-variant/30">All clear! 🎉</p>}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: 2 cards ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* YOUR COURSES (2 cols) */}
        <div className="glass-card rounded-2xl border border-white/8 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Your Courses</span>
            <button onClick={() => onNavigate('courses')} className="flex items-center gap-1 font-label-mono-xs text-[11px] text-primary/70 transition-colors hover:text-primary">View all <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {domainCourses.map((c) => {
              const hx = courseHex(c);
              return (
                <div key={c.id} className="group min-w-[180px] shrink-0 rounded-xl border border-white/6 bg-white/3 p-3.5 transition-all hover:border-white/12 hover:bg-white/5">
                  <span className="mb-2 inline-block rounded-full px-2 py-0.5 font-label-mono-xs text-[10px] font-bold" style={{ backgroundColor: `${hx}22`, color: hx }}>{c.code}</span>
                  <p className="mt-1 truncate font-body-md text-[13px] font-semibold text-on-background">{c.name}</p>
                  <p className="mt-0.5 font-label-mono-xs text-[10px] text-on-surface-variant/40">{c.professor}</p>
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-xs text-[9px] text-on-surface-variant/40">Syllabus</span>
                      <span className="font-label-mono-xs text-[10px] font-bold" style={{ color: hx }}>{c.syllabusProgress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.syllabusProgress}%`, backgroundColor: hx }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {domainCourses.length === 0 && <p className="py-8 text-center font-label-mono-xs text-on-surface-variant/30">No courses enrolled yet</p>}
          </div>
        </div>

        {/* AI ASSISTANT */}
        <div className="glass-card group relative overflow-hidden rounded-2xl border border-white/8 p-5 transition-all hover:border-secondary/25">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/8 blur-3xl transition-all group-hover:bg-secondary/16" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 ring-2 ring-secondary/30 ring-offset-2 ring-offset-surface">
                <Rocket className="h-6 w-6 text-secondary" strokeWidth={2} />
              </div>
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-surface bg-tertiary" />
            </div>
            <p className="font-headline-md text-[15px] font-semibold text-on-background">AI Assistant</p>
            <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant/50">Ask anything about your studies</p>
            <button onClick={() => onNavigate('ai-assistant')} className="mt-3 flex items-center gap-1.5 rounded-full border border-secondary/25 bg-secondary/10 px-4 py-2 font-label-mono-xs text-[11px] font-semibold text-secondary transition-all hover:bg-secondary/20">
              <Lightbulb className="h-3 w-3" /> Ask Assistant <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
