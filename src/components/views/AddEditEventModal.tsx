import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, X, BookOpen } from 'lucide-react';
import type { CalendarEvent } from '@/core/domain/model/CalendarEvent';
import type { Course } from '@/core/domain/model/Course';
import { WeekDay } from '@/core/domain/enums';
import { createId } from '@/core/domain/ids';
import { accentHex } from '@/lib/accent';
import type { AccentColor } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const MERIDIEMS = ['AM', 'PM'] as const;
type Meridiem = 'AM' | 'PM';

const SESSION_TYPES: { key: string; label: string }[] = [
  { key: 'lecture', label: 'Lecture' },
  { key: 'seminar', label: 'Seminar' },
  { key: 'lab', label: 'Lab' },
  { key: 'graded', label: 'Exam' },
];

type AccentKey = 'primary' | 'secondary' | 'tertiary';

const FALLBACK_ACCENT: Record<AccentKey, string> = {
  primary: '#ffc880',
  secondary: '#b4b7ff',
  tertiary: '#5beaad',
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AddEditEventInitial {
  id?: string;
  courseName: string;
  timeLabel: string;
  room: string;
  sessionType: string;
  dayLabel: string;
  dateLabel?: string;
}

interface Clock {
  h12: number;
  min: number;
  ampm: Meridiem;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const pad2 = (n: number) => String(n).padStart(2, '0');

function parseClock(timeLabel: string, pick: 'first' | 'last'): Clock {
  const matches = timeLabel.match(/(\d{1,2}):(\d{2})/g) ?? [];
  const raw = pick === 'first' ? matches[0] : matches[matches.length - 1];
  const m = raw?.match(/(\d{1,2}):(\d{2})/);
  if (!m) return { h12: 9, min: 0, ampm: 'AM' };
  let h24 = parseInt(m[1], 10);
  const min = letMinute(parseInt(m[2], 10));
  const lower = timeLabel.toLowerCase();
  const isPM = lower.includes('pm');
  const isAM = lower.includes('am');
  const ampm: Meridiem = isPM ? 'PM' : isAM ? 'AM' : h24 < 12 ? 'AM' : 'PM';
  if (isPM && h24 < 12) h24 += 12;
  if (isAM && h24 === 12) h24 = 0;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, min, ampm };
}

function letMinute(min: number): number {
  const rounded = Math.round(min / 5) * 5;
  return Math.min(55, Math.max(0, rounded));
}

function toTimeLabel(start: Clock, end: Clock): string {
  return `${pad2(start.h12)}:${pad2(start.min)} ${start.ampm} - ${pad2(end.h12)}:${pad2(end.min)} ${end.ampm}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function resolvedAccent(courseAccent: AccentColor | undefined, sessionType: string): { hex: string; key: AccentKey } {
  if (courseAccent) {
    const hex = accentHex(courseAccent);
    if (courseAccent === 'primary' || courseAccent === 'secondary' || courseAccent === 'tertiary') {
      return { hex, key: courseAccent };
    }
    return { hex, key: sessionType === 'lab' ? 'tertiary' : sessionType === 'seminar' ? 'secondary' : 'primary' };
  }
  const key: AccentKey = sessionType === 'lab' ? 'tertiary' : sessionType === 'seminar' ? 'secondary' : 'primary';
  return { hex: FALLBACK_ACCENT[key], key };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Apple-style scrollable column picker. */
function TimeColumn({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const idx = options.indexOf(value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ top: Math.max(0, idx * 36 - 18), behavior: 'auto' });
    }
  }, [options, value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-label-mono-xs text-on-surface-variant/50">{label}</span>
      <div
        ref={ref}
        className="h-36 w-16 overflow-y-auto rounded-xl border border-white/10 bg-surface-container/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="h-[54px]" />
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex h-9 w-full items-center justify-center font-label-mono-sm transition-colors ${
              value === opt ? 'bg-primary/15 font-bold text-primary' : 'text-on-surface-variant/60 hover:bg-white/5 hover:text-on-background'
            }`}
          >
            {opt}
          </button>
        ))}
        <div className="h-[54px]" />
      </div>
    </div>
  );
}

/** Interactive mini month-grid calendar. */
function MiniMonthGrid({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
    return list;
  }, [visibleMonth]);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-container/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body-md text-[13px] font-semibold text-on-background">
          {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/60 transition-colors hover:bg-white/10 hover:text-on-background"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/60 transition-colors hover:bg-white/10 hover:text-on-background"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_LETTERS.map((l, i) => (
          <div key={`${l}-${i}`} className="py-1 text-center font-label-mono-xs text-on-surface-variant/40">{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          if (!d) return <div key={`pad-${idx}`} />;
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toDateString()} className="flex justify-center py-0.5">
              <button
                type="button"
                onClick={() => onSelect(d)}
                className={`flex h-9 w-9 items-center justify-center rounded-full font-body-md text-[13px] transition-all ${
                  isSelected
                    ? 'bg-primary/20 font-bold text-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container'
                    : isToday
                      ? 'font-semibold text-primary hover:bg-white/10'
                      : 'text-on-background hover:bg-white/10'
                }`}
              >
                {d.getDate()}
                {isToday && !isSelected && <span className="absolute mt-6 h-1 w-1 rounded-full bg-primary" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

export function AddEditEventModal({ mode, initial, courses, onCancel, onConfirm }: {
  mode: 'create' | 'edit';
  initial: AddEditEventInitial;
  courses: Course[];
  onCancel: () => void;
  onConfirm: (event: CalendarEvent) => void;
}) {
  const initialDate = useMemo(() => {
    if (initial.dateLabel) {
      const d = new Date(initial.dateLabel);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [initial.dateLabel]);

  const [courseName, setCourseName] = useState(initial.courseName);
  const [room, setRoom] = useState(initial.room);
  const [sessionType, setSessionType] = useState(initial.sessionType || 'lecture');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const [start, setStart] = useState<Clock>(() => parseClock(initial.timeLabel, 'first'));
  const [end, setEnd] = useState<Clock>(() => {
    const parsed = parseClock(initial.timeLabel, 'last');
    const first = parseClock(initial.timeLabel, 'first');
    if (initial.timeLabel && !initial.timeLabel.includes('-') && !initial.timeLabel.includes('–')) {
      const minutesLater = first.h12 * 60 + first.min + 60;
      const eh = minutesLater % 720 === 0 ? 12 : Math.ceil(((minutesLater % 720) || 720) / 60);
      return { h12: eh, min: first.min, ampm: first.ampm };
    }
    return parsed;
  });
  const [localError, setLocalError] = useState('');

  const selectedCourse = courses.find((c) => c.name === courseName);
  const accentHexFor = resolvedAccent(selectedCourse?.accent, sessionType).hex;
  const accentKey = resolvedAccent(selectedCourse?.accent, sessionType).key;

  const dayLabel = selectedDate.toLocaleDateString('en', { weekday: 'long' });
  const dayOfWeek = selectedDate.getDay() as WeekDay;
  const dateLabel = selectedDate.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
  const isToday = isSameDay(selectedDate, new Date());

  const handleCoursePick = (c: Course) => {
    setCourseName(c.name);
    setRoom((r) => r || c.room);
  };

  const submit = () => {
    if (!courseName.trim()) { setLocalError('Course name is required.'); return; }
    setLocalError('');
    onConfirm({
      id: initial.id || createId(),
      courseId: selectedCourse?.id ?? null,
      courseName: courseName.trim(),
      dayOfWeek,
      dayLabel,
      dateLabel,
      isToday,
      timeLabel: toTimeLabel(start, end),
      room: room.trim(),
      sessionType,
      isNext: false,
      sortOrder: 0,
    });
  };

  const inputCls = 'w-full rounded-xl border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none';
  const labelCls = 'mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-6 py-4">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentHexFor}18` }}>
              <BookOpen className="h-5 w-5" style={{ color: accentHexFor }} strokeWidth={2} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-neutral-900" style={{ backgroundColor: accentHexFor }} />
          </div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">{mode === 'create' ? 'Add Event' : 'Edit Event'}</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">{mode === 'create' ? 'Schedule a new class session' : 'Update this class session'}</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-on-surface-variant/60 hover:bg-white/5 hover:text-on-background" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {localError && <p className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-body-md text-[13px] text-error">{localError}</p>}

          {/* Course + accent swatches */}
          {courses.length > 0 && (
            <div>
              <label className={labelCls}>Course</label>
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => {
                  const hx = accentHex(c.accent as AccentColor);
                  const active = courseName === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCoursePick(c)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-label-mono-xs transition-all ${
                        active ? 'border-white/30 bg-white/10 text-on-background' : 'border-white/10 bg-white/5 text-on-surface-variant/70 hover:border-white/20 hover:text-on-background'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hx }} />
                      {c.code} · {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Course name + room */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className={labelCls}>Course Name</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Advanced Algorithms"
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="col-span-1">
              <label className={labelCls}>Room</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/40" />
                <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Turing 301" className={`${inputCls} pl-8`} />
              </div>
            </div>
          </div>

          {/* Interactive date picker */}
          <div>
            <label className={labelCls}>Date</label>
            <MiniMonthGrid selectedDate={selectedDate} onSelect={setSelectedDate} />
            <p className="mt-1.5 font-label-mono-xs text-on-surface-variant/50">{dayLabel} · {dateLabel}</p>
          </div>

          {/* Apple-style time pickers */}
          <div>
            <label className={labelCls}>Time</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-surface-container/40 p-2.5">
                <span className="text-center font-label-mono-xs text-on-surface-variant/50">Start</span>
                <div className="flex justify-center gap-1">
                  <TimeColumn label="Hr" options={HOURS} value={pad2(start.h12)} onChange={(v) => setStart((s) => ({ ...s, h12: parseInt(v, 10) }))} />
                  <TimeColumn label="Min" options={MINUTES} value={pad2(start.min)} onChange={(v) => setStart((s) => ({ ...s, min: parseInt(v, 10) }))} />
                  <TimeColumn label="" options={[...MERIDIEMS]} value={start.ampm} onChange={(v) => setStart((s) => ({ ...s, ampm: v as Meridiem }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-surface-container/40 p-2.5">
                <span className="text-center font-label-mono-xs text-on-surface-variant/50">End</span>
                <div className="flex justify-center gap-1">
                  <TimeColumn label="Hr" options={HOURS} value={pad2(end.h12)} onChange={(v) => setEnd((s) => ({ ...s, h12: parseInt(v, 10) }))} />
                  <TimeColumn label="Min" options={MINUTES} value={pad2(end.min)} onChange={(v) => setEnd((s) => ({ ...s, min: parseInt(v, 10) }))} />
                  <TimeColumn label="" options={[...MERIDIEMS]} value={end.ampm} onChange={(v) => setEnd((s) => ({ ...s, ampm: v as Meridiem }))} />
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-center font-label-mono-xs" style={{ color: accentHexFor }}>{toTimeLabel(start, end)}</p>
          </div>

          {/* Session category pills */}
          <div>
            <label className={labelCls}>Session Type</label>
            <div className="flex gap-2">
              {SESSION_TYPES.map((t) => {
                const active = sessionType === t.key;
                const tint = active ? { backgroundColor: `${accentHexFor}22`, borderColor: `${accentHexFor}66`, color: accentHexFor } : undefined;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSessionType(t.key)}
                    className={`flex-1 rounded-xl border px-2 py-2 font-label-mono-sm text-[11px] font-semibold transition-all ${
                      active ? '' : 'border-white/8 bg-surface-container/40 text-on-surface-variant/50 hover:border-white/20 hover:text-on-background'
                    }`}
                    style={tint}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent preview */}
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: accentHexFor, boxShadow: `0 0 14px ${accentHexFor}66` }} />
            <p className="font-label-mono-xs text-on-surface-variant/60">
              Accent · <span style={{ color: accentHexFor }}>{selectedCourse?.accent ?? accentKey}</span> — syncs with Courses, Schedule blocks &amp; Tasks
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-white/8 px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-xl px-4 py-2.5 font-body-md text-[13px] font-semibold text-neutral-950 transition-transform hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${accentHexFor}, ${accentHexFor}bb)` }}
          >
            {mode === 'create' ? 'Add Event' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}