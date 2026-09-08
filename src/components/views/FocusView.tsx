import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Timer, Coffee, RotateCcw, Flame, Clock } from 'lucide-react';
import { useFocusStore } from '@/core/store/useFocusStore';
import { createId } from '@/core/domain/ids';
import { SessionType } from '@/core/domain/enums';
import type { StudySession } from '@/core/domain/model/StudySession';
import { toUiFocusSession } from './focusUiAdapter';

type TimerMode = 'focus' | 'break';
type TimerPreset = { label: string; focus: number; brk: number };

const presets: TimerPreset[] = [
  { label: 'Pomodoro 25/5', focus: 25, brk: 5 },
  { label: 'Deep Work 50/10', focus: 50, brk: 10 },
  { label: 'Short 15/3', focus: 15, brk: 3 },
];

export function FocusView() {
  const { data: domainSessions, initialized, load, upsert } = useFocusStore();
  const [presetIdx, setPresetIdx] = useState(0);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(presets[0].focus * 60);
  const [running, setRunning] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [taskLabel, setTaskLabel] = useState('');
  const [completedRounds, setCompletedRounds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionRef = useRef<{ mode: TimerMode; presetIdx: number; courseCode: string; taskLabel: string; focus: number; brk: number } | null>(null);

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const sessions = domainSessions.map(toUiFocusSession);

  const preset = presets[presetIdx];
  const totalSeconds = mode === 'focus' ? preset.focus * 60 : preset.brk * 60;

  const todaySessions = sessions.filter((s) => s.date_label === 'Today');
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const weekMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  const streakDays = (() => {
    const toKey = (d: Date) => { const t = new Date(d); t.setHours(0, 0, 0, 0); return t.getTime(); };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const completedDates = new Set<number>();
    for (const s of sessions) {
      if (!s.completed) continue;
      const d = new Date(s.date_label);
      if (!isNaN(d.getTime())) completedDates.add(toKey(d));
    }
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (completedDates.has(toKey(d))) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  })();

  const buildSession = useCallback((durationMinutes: number): StudySession => ({
    id: createId(),
    courseCode: courseCode || 'General',
    taskLabel: taskLabel || 'Focus Session',
    durationMinutes,
    sessionType: SessionType.Pomodoro,
    dateLabel: new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }),
    timeLabel: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    completed: true,
    sortOrder: 0,
  }), [courseCode, taskLabel]);

  const toggleRunning = useCallback(() => {
    if (!running) {
      completionRef.current = { mode, presetIdx, courseCode, taskLabel, focus: preset.focus, brk: preset.brk };
    } else {
      completionRef.current = null;
    }
    setRunning((prev) => !prev);
  }, [running, mode, presetIdx, courseCode, taskLabel, preset.focus, preset.brk]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    const pending = completionRef.current;
    if (!pending) return;

    completionRef.current = null;
    setRunning(false);

    if (pending.mode === 'focus') {
      const elapsed = Math.round((pending.focus * 60 - 0) / 60);
      if (elapsed > 0) {
        void upsert(buildSession(elapsed));
      }
      setCompletedRounds((r) => r + 1);
      setMode('break');
      setSecondsLeft(pending.brk * 60);
      completionRef.current = { ...pending, mode: 'break' };
      setRunning(true);
    } else {
      setMode('focus');
      setSecondsLeft(pending.focus * 60);
    }
  }, [running, secondsLeft, upsert]);

  const handlePresetChange = useCallback((idx: number) => {
    setPresetIdx(idx);
    setMode('focus');
    setSecondsLeft(presets[idx].focus * 60);
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setMode('focus');
    setSecondsLeft(preset.focus * 60);
  }, [preset.focus]);

  const handleStop = useCallback(() => {
    if (mode === 'focus' && secondsLeft < totalSeconds) {
      const elapsed = Math.round((totalSeconds - secondsLeft) / 60);
      if (elapsed > 0) {
        void upsert(buildSession(elapsed));
      }
    }
    setRunning(false);
    setMode('focus');
    setSecondsLeft(preset.focus * 60);
  }, [mode, secondsLeft, totalSeconds, upsert]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Timer Panel */}
      <div className="glass-card flex flex-col items-center rounded-3xl p-6 lg:col-span-2">
        <div className="mb-6 flex gap-2">
          {presets.map((p, idx) => (
            <button
              key={p.label}
              onClick={() => handlePresetChange(idx)}
              className={`rounded-lg border px-3 py-2 font-label-mono-sm text-[11px] transition-all ${
                presetIdx === idx
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-white/10 bg-surface-container/40 text-on-surface-variant hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative flex h-[280px] w-[280px] items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke={mode === 'focus' ? '#f5a623' : '#5beaad'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${mode === 'focus' ? 'bg-primary/10' : 'bg-tertiary/10'}`}>
              {mode === 'focus' ? <Timer className={`h-3.5 w-3.5 ${mode === 'focus' ? 'text-primary' : 'text-tertiary'}`} /> : <Coffee className="h-3.5 w-3.5 text-tertiary" />}
              <span className={`font-label-mono-xs uppercase tracking-wider ${mode === 'focus' ? 'text-primary' : 'text-tertiary'}`}>
                {mode === 'focus' ? 'Focus' : 'Break'}
              </span>
            </div>
            <p className="mt-2 font-display-hero text-[48px] font-bold tabular-nums text-on-background">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <p className="font-label-mono-xs text-on-surface-variant/50">
              Round {completedRounds + 1} · {preset.label}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={toggleRunning}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-surface transition-transform hover:scale-105"
          >
            {running ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6 ml-0.5" fill="currentColor" />}
          </button>
          <button
            onClick={handleReset}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-container/60 text-on-surface-variant transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleStop}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-container/60 text-on-surface-variant transition-colors hover:bg-white/10"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 w-full max-w-md space-y-3">
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            placeholder="Course code (e.g. CS301)"
            className="w-full rounded-lg border border-white/10 bg-surface-container/40 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
          />
          <input
            type="text"
            value={taskLabel}
            onChange={(e) => setTaskLabel(e.target.value)}
            placeholder="What are you working on?"
            className="w-full rounded-lg border border-white/10 bg-surface-container/40 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats & History */}
      <div className="flex flex-col gap-4">
        <div className="glass-card rounded-3xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-[18px] w-[18px] text-primary" />
              </div>
              <p className="mt-2 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Today</p>
              <p className="mt-1 font-headline-lg text-[24px] font-bold text-on-background">{todayMinutes}m</p>
            </div>
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary/10">
                <Flame className="h-[18px] w-[18px] text-tertiary" />
              </div>
              <p className="mt-2 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">This Week</p>
              <p className="mt-1 font-headline-lg text-[24px] font-bold text-on-background">{weekMinutes}m</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-tertiary/20 bg-tertiary/5 p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-tertiary" />
              <p className="font-body-md text-[13px] font-semibold text-on-background">{streakDays}-day streak</p>
            </div>
            <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">Keep it going!</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h3 className="mb-3 font-headline-md text-[15px] font-semibold text-on-background">Session History</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.date_label === 'Today' ? 'bg-primary/10' : 'bg-white/5'}`}>
                  <Timer className={`h-4 w-4 ${s.date_label === 'Today' ? 'text-primary' : 'text-on-surface-variant/60'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body-md text-[13px] font-medium text-on-background">{s.task_label}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">
                    {s.course_code} · {s.date_label} {s.time_label}
                  </p>
                </div>
                <span className="shrink-0 font-label-mono-sm font-bold text-primary">{s.duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}