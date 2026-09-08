import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Video, Users, FlaskConical, Coffee, BookOpen, Award,
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin,
  Plus, Trash2, X, Pencil,
} from 'lucide-react';
import type { ScheduleEntry } from '@/lib/types';
import { useScheduleStore } from '@/core/store/useScheduleStore';
import { toUiScheduleEntry, fromUiScheduleEntry } from './scheduleUiAdapter';
import type { CalendarEvent } from '@/core/domain/model/CalendarEvent';
import { WeekDay } from '@/core/domain/enums';
import { createId } from '@/core/domain/ids';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = 'day' | 'week' | 'month';

interface ScheduleViewProps { entries?: ScheduleEntry[] }

type AccentColorKey = 'primary' | 'secondary' | 'tertiary';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ACCENT_OPTIONS: { key: AccentColorKey; label: string; dot: string }[] = [
  { key: 'primary', label: 'Blue', dot: 'bg-primary' },
  { key: 'secondary', label: 'Teal', dot: 'bg-secondary' },
  { key: 'tertiary', label: 'Purple', dot: 'bg-tertiary' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getSessionIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'lecture':   return BookOpen;
    case 'seminar':   return Users;
    case 'practical': case 'lab': return FlaskConical;
    case 'graded':    return Award;
    case 'social':    return Coffee;
    case 'optional':  return Video;
    default:          return BookOpen;
  }
}

function sessionAccent(type: string, accentKey: AccentColorKey = 'primary') {
  const base = {
    primary:   { ring: 'ring-primary/30',   bg: 'bg-primary/8',  text: 'text-primary',     pill: 'bg-primary/15 text-primary/80',      dot: 'bg-primary',     borderL: 'border-l-primary' },
    secondary: { ring: 'ring-secondary/30', bg: 'bg-secondary/8', text: 'text-secondary',   pill: 'bg-secondary/15 text-secondary/80',  dot: 'bg-secondary',   borderL: 'border-l-secondary' },
    tertiary:  { ring: 'ring-tertiary/30',  bg: 'bg-tertiary/8', text: 'text-tertiary',    pill: 'bg-tertiary/15 text-tertiary/80',    dot: 'bg-tertiary',    borderL: 'border-l-tertiary' },
  }[accentKey];
  switch (type.toLowerCase()) {
    case 'practical': case 'lab': return { ...base, ring: 'ring-tertiary/30', bg: 'bg-tertiary/8', text: 'text-tertiary', pill: 'bg-tertiary/15 text-tertiary/80', dot: 'bg-tertiary', borderL: 'border-l-tertiary' };
    default: return base;
  }
}

function parseStartHour(timeLabel: string): number | null {
  const m = timeLabel.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (timeLabel.toLowerCase().includes('pm') && h < 12) h += 12;
  if (timeLabel.toLowerCase().includes('am') && h === 12) h = 0;
  return h;
}

function parseEndTime(timeLabel: string): number | null {
  const rangeMatch = timeLabel.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    const m = rangeMatch[2].match(/(\d{1,2}):(\d{2})/);
    if (m) {
      let h = parseInt(m[1], 10);
      const suffix = timeLabel.slice(timeLabel.indexOf(rangeMatch[2]) + rangeMatch[2].length);
      if (suffix.toLowerCase().includes('pm') && h < 12) h += 12;
      if (suffix.toLowerCase().includes('am') && h === 12) h = 0;
      return h + parseInt(m[2], 10) / 60;
    }
  }
  const m = timeLabel.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (timeLabel.toLowerCase().includes('pm') && h < 12) h += 12;
  if (timeLabel.toLowerCase().includes('am') && h === 12) h = 0;
  return h + 1;
}

function extractAccentKey(_entry: ScheduleEntry): AccentColorKey {
  switch (_entry.session_type?.toLowerCase()) {
    case 'seminar': return 'secondary';
    case 'practical': case 'lab': return 'tertiary';
    default: return 'primary';
  }
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function DateNav({ rangeLabel, onPrev, onNext, onToday }: { rangeLabel: string; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        <button onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant/50 transition-all duration-200 hover:bg-white/6 hover:text-on-surface-variant"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant/50 transition-all duration-200 hover:bg-white/6 hover:text-on-surface-variant"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <button onClick={onToday} className="rounded-lg border border-white/8 bg-surface-container/40 px-3 py-1.5 font-label-mono-xs text-on-surface-variant/60 transition-all hover:text-on-background">Today</button>
      <span className="font-headline-sm text-[15px] font-semibold text-on-background">{rangeLabel}</span>
    </div>
  );
}

function SegmentedMode({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex rounded-lg border border-white/8 bg-surface-container/40 p-0.5">
      {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
        <button key={m} onClick={() => onChange(m)} className={`rounded-md px-3 py-1.5 font-label-mono-sm text-[11px] font-semibold transition-all ${mode === m ? 'bg-primary/15 text-primary' : 'text-on-surface-variant/50 hover:text-on-background'}`}>
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event Card — Glass polished with vertical accent border            */
/* ------------------------------------------------------------------ */

function EventCard({ entry, positionStyle, accentKey, compact, onEdit, onDelete }: {
  entry: ScheduleEntry; positionStyle?: React.CSSProperties; accentKey: AccentColorKey; compact?: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const ac = sessionAccent(entry.session_type, accentKey);
  const Icon = getSessionIcon(entry.session_type);

  const card = (
    <div
      className={`group relative rounded-xl border-l-[3px] ${ac.borderL} bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 p-3 transition-all duration-200 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-black/20 ${compact ? '' : 'w-full'}`}
      style={positionStyle}
    >
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-md bg-white/10 p-1 text-on-surface-variant/60 hover:bg-white/20 hover:text-on-background" aria-label="Edit event"><Pencil className="h-3 w-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-md bg-white/10 p-1 text-on-surface-variant/60 hover:bg-error/20 hover:text-error" aria-label="Delete event"><Trash2 className="h-3 w-3" /></button>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <Icon className="h-4 w-4 text-on-surface-variant" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body-md text-[13px] font-semibold text-on-background">{entry.course_name}</p>
          {entry.room && <div className="mt-0.5 flex items-center gap-1 text-on-surface-variant/50"><MapPin className="h-3 w-3" /><span className="font-label-mono-xs">{entry.room}</span></div>}
          <div className="mt-1 flex items-center gap-1 text-on-surface-variant/50"><Clock className="h-3 w-3" /><span className="font-label-mono-xs">{entry.time_label}</span></div>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ac.pill}`}>{entry.session_type}</span>
        </div>
      </div>
    </div>
  );
  return card;
}

/* ------------------------------------------------------------------ */
/*  Day View                                                           */
/* ------------------------------------------------------------------ */

function DayView({ entries, todayDate, onEdit, onDelete, onAddEvent }: { entries: ScheduleEntry[]; todayDate: Date; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void; onAddEvent: () => void }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const positioned = useMemo(() => {
    return entries.map((e) => {
      const startH = parseStartHour(e.time_label);
      const endH = parseEndTime(e.time_label);
      if (startH === null || endH === null) return null;
      const top = ((startH - 8) / 13) * 100;
      const height = Math.max(((endH - startH) / 13) * 100, 5);
      return { ...e, top, height };
    }).filter(Boolean) as (ScheduleEntry & { top: number; height: number })[];
  }, [entries]);

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><CalendarDays className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="font-headline-md text-[15px] font-semibold text-on-background">{todayDate.toLocaleDateString('en', { weekday: 'long' })}</p>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">{todayDate.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        {positioned.length > 0 && <span className="ml-auto rounded-full bg-primary/12 px-3 py-1 font-label-mono-xs text-primary/80">{positioned.length} event{positioned.length !== 1 ? 's' : ''}</span>}
        <button onClick={onAddEvent} className="ml-2 flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-3 py-1.5 font-label-mono-xs font-semibold text-surface transition-transform hover:scale-[1.02]"><Plus className="h-3 w-3" strokeWidth={2.5} /> Add</button>
      </div>
      <div className="relative h-[600px]">
        {hours.map((h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-neutral-800/60" style={{ top: `${((h - 8) / 13) * 100}%` }}>
            <span className="absolute -top-3 left-0 font-label-mono-xs text-on-surface-variant/40">{h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}</span>
          </div>
        ))}
        {positioned.map((entry) => (
          <EventCard key={entry.id} entry={entry} accentKey={extractAccentKey(entry)} positionStyle={{ position: 'absolute', top: `${entry.top}%`, height: `${entry.height}%`, left: 48, right: 0, zIndex: 1 }} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />
        ))}
        {positioned.length === 0 && <div className="flex h-full items-center justify-center"><p className="font-label-mono-sm text-on-surface-variant/30">No events scheduled</p></div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Week View                                                          */
/* ------------------------------------------------------------------ */

function WeekView({ entries, weekStart, onEdit, onDelete, onAddEvent }: { entries: ScheduleEntry[]; weekStart: Date; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void; onAddEvent: () => void }) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const name = d.toLocaleDateString('en', { weekday: 'long' });
      return { date: d, name, entries: entries.filter((e) => e.day_label === name) };
    });
  }, [entries, weekStart]);

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-headline-md text-[15px] font-semibold text-on-background">Week View</p>
        <button onClick={onAddEvent} className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-3 py-1.5 font-label-mono-xs font-semibold text-surface transition-transform hover:scale-[1.02]"><Plus className="h-3 w-3" strokeWidth={2.5} /> Add</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.name} className="min-h-[120px]">
            <div className={`mb-2 rounded-lg px-2 py-1 text-center ${day.date.toDateString() === new Date().toDateString() ? 'bg-primary/15 text-primary' : 'bg-white/3 text-on-surface-variant/60'}`}>
              <p className="font-label-mono-xs font-bold">{day.date.toLocaleDateString('en', { weekday: 'short' })}</p>
              <p className="font-headline-sm text-[16px] font-bold">{day.date.getDate()}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {day.entries.map((entry) => (
                <EventCard key={entry.id} entry={entry} accentKey={extractAccentKey(entry)} compact onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Month View                                                         */
/* ------------------------------------------------------------------ */

function MonthView({ entries, year, month, onEdit, onDelete }: { entries: ScheduleEntry[]; year: number; month: number; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void }) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = useMemo(() => {
    const result: { day: number; date: string; isCurrentMonth: boolean; entries: ScheduleEntry[] }[] = [];
    for (let i = 0; i < startDayOfWeek; i++) { const d = new Date(year, month, -(startDayOfWeek - 1 - i)); result.push({ day: d.getDate(), date: d.toISOString().slice(0, 10), isCurrentMonth: false, entries: [] }); }
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en', { weekday: 'long' });
      result.push({ day, date: dateStr, isCurrentMonth: true, entries: entries.filter((e) => e.day_label === dayName) });
    }
    const remaining = 7 - (result.length % 7);
    if (remaining < 7) { for (let i = 1; i <= remaining; i++) { const d = new Date(year, month + 1, i); result.push({ day: i, date: d.toISOString().slice(0, 10), isCurrentMonth: false, entries: [] }); } }
    return result;
  }, [startDayOfWeek, totalDays, year, month, entries]);

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md p-6">
      <div className="mb-4 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center font-label-mono-xs font-bold text-on-surface-variant/50">{d.slice(0, 3)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isToday = cell.date === todayStr;
          return (
            <div key={cell.date} className={`min-h-[72px] rounded-xl border p-1.5 transition-all ${isToday ? 'border-primary/30 bg-primary/5' : cell.isCurrentMonth ? 'border-neutral-800/60 bg-neutral-900/40 hover:bg-neutral-900/60' : 'border-transparent bg-transparent opacity-30'}`}>
              <p className={`mb-1 text-right font-label-mono-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant/60'}`}>{cell.day}</p>
              <div className="flex flex-col gap-0.5">
                {cell.entries.slice(0, 2).map((e) => {
                  const ac = sessionAccent(e.session_type, extractAccentKey(e));
                  return (
                    <div key={e.id} className="group/ev relative cursor-pointer rounded px-1 py-0.5 border-l-2 border-l-current" onClick={() => onEdit(e)}>
                      <div className={`h-1.5 w-full rounded-full ${ac.dot}`} />
                      <p className="font-label-mono-xs text-[8px] text-on-surface-variant/60 truncate">{e.course_name}</p>
                      <button onClick={(ev) => { ev.stopPropagation(); onDelete(e); }} className="absolute -right-0.5 -top-0.5 hidden rounded bg-white/10 p-0.5 text-error/60 hover:text-error group-hover/ev:block"><Trash2 className="h-2 w-2" /></button>
                    </div>
                  );
                })}
                {cell.entries.length > 2 && <p className="font-label-mono-xs text-[8px] text-on-surface-variant/40">+{cell.entries.length - 2} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */

function EventModal({ mode, initial, onCancel, onConfirm }: {
  mode: 'create' | 'edit';
  initial: Partial<CalendarEvent> & { courseName: string; timeLabel: string; room: string; sessionType: string; dayLabel: string };
  onCancel: () => void;
  onConfirm: (event: CalendarEvent) => void;
}) {
  const [courseName, setCourseName] = useState(initial.courseName);
  const [room, setRoom] = useState(initial.room);
  const [timeLabel, setTimeLabel] = useState(initial.timeLabel);
  const [sessionType, setSessionType] = useState(initial.sessionType || 'lecture');
  const [dayLabel, setDayLabel] = useState(initial.dayLabel || DAY_NAMES[0]);
  const [accentKey, setAccentKey] = useState<AccentColorKey>(extractAccentKey(initial as unknown as ScheduleEntry));
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!courseName.trim()) { setLocalError('Course name is required.'); return; }
    if (!timeLabel.trim()) { setLocalError('Time is required.'); return; }
    const dayOfWeek = DAY_NAMES.indexOf(dayLabel) as WeekDay;
    onConfirm({
      id: initial.id || createId(), courseId: null, courseName: courseName.trim(), dayOfWeek: dayOfWeek as WeekDay, dayLabel,
      dateLabel: new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }),
      isToday: dayOfWeek === new Date().getDay() - 1, timeLabel: timeLabel.trim(), room: room.trim(), sessionType, isNext: false, sortOrder: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">{mode === 'create' ? 'Add Event' : 'Edit Event'}</h3>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-on-surface-variant/60 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Course Name</label><input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Advanced Algorithms" className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Day</label><select value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background focus:border-primary/40 focus:outline-none">{DAY_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Time</label><input value={timeLabel} onChange={(e) => setTimeLabel(e.target.value)} placeholder="e.g. 09:00 - 10:30" className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none" /></div>
          </div>
          <div><label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Room</label><input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Turing 301" className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none" /></div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Session Type</label>
            <div className="flex gap-2">
              {['lecture', 'seminar', 'lab', 'graded'].map((t) => (
                <button key={t} onClick={() => setSessionType(t)} className={`flex-1 rounded-lg border px-2 py-2 font-label-mono-sm text-[11px] font-semibold transition-all ${sessionType === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/8 bg-surface-container/40 text-on-surface-variant/50 hover:text-on-background'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Accent Color</label>
            <div className="flex gap-3">
              {ACCENT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setAccentKey(opt.key)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${accentKey === opt.key ? 'border-primary/40 bg-primary/10' : 'border-white/8 bg-surface-container/40 hover:bg-white/5'}`}>
                  <span className={`h-3 w-3 rounded-full ${opt.dot}`} /><span className="font-label-mono-xs text-on-surface-variant/70">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          {localError && <p className="flex items-center gap-1 rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-label-mono-xs text-error">{localError}</p>}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">{mode === 'create' ? 'Add Event' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl border border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10"><Trash2 className="h-5 w-5 text-error" /></div>
          <h3 className="mt-3 font-headline-md text-[16px] font-semibold text-on-background">Delete event?</h3>
          <p className="mt-1 font-body-md text-[13px] text-on-surface-variant/60">"{name}" will be permanently removed.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-error px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Schedule View                                                 */
/* ------------------------------------------------------------------ */

export function ScheduleView({ entries: propEntries }: ScheduleViewProps) {
  const now = useMemo(() => new Date(), []);
  const { data, loading, error, initialized, load, upsert, remove } = useScheduleStore();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ScheduleEntry | null>(null);

  useEffect(() => { if (!initialized) void load(); }, [initialized, load]);

  const entries: ScheduleEntry[] = useMemo(() => {
    if (data.length > 0) return data.map(toUiScheduleEntry);
    if (propEntries && propEntries.length > 0) return propEntries;
    return [];
  }, [data, propEntries]);

  const weekStart = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() + weekOffset * 7); const day = d.getDay(); const diff = (day === 0 ? -6 : 1) - day; d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0); return d; }, [now, weekOffset]);
  const weekEnd = useMemo(() => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + 6); return d; }, [weekStart]);
  const currentMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1), [now, monthOffset]);

  const handlePrev = useCallback(() => { if (viewMode === 'week') setWeekOffset((o) => o - 1); else if (viewMode === 'month') setMonthOffset((o) => o - 1); }, [viewMode]);
  const handleNext = useCallback(() => { if (viewMode === 'week') setWeekOffset((o) => o + 1); else if (viewMode === 'month') setMonthOffset((o) => o + 1); }, [viewMode]);
  const handleToday = useCallback(() => { setWeekOffset(0); setMonthOffset(0); }, []);

  const rangeLabel = useMemo(() => {
    if (viewMode === 'day') return now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (viewMode === 'week') return `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  }, [viewMode, now, weekStart, weekEnd, currentMonth]);

  const dayEntries = useMemo(() => viewMode === 'day' ? entries.filter((e) => e.is_today) : entries, [viewMode, entries]);

  const handleCreate = async (event: CalendarEvent) => { try { await upsert(event); setShowCreate(false); } catch (e) { console.error('Failed to create event', e); } };
  const handleUpdate = async (event: CalendarEvent) => { if (!editing) return; try { await upsert(fromUiScheduleEntry({ ...editing, ...event })); setEditing(null); } catch (e) { console.error('Failed to update event', e); } };
  const handleDelete = async (entry: ScheduleEntry) => { try { await remove(entry.id); setConfirmDelete(null); } catch (e) { console.error('Failed to delete event', e); } };

  if (loading && !initialized && entries.length === 0) {
    return (<div className="flex h-[40vh] items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="font-label-mono-sm text-on-surface-variant/60">Loading schedule…</p></div></div>);
  }
  if (error && !initialized && entries.length === 0) {
    return (<div className="glass-card rounded-3xl p-8 text-center"><p className="font-body-lg text-error">{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button></div>);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" strokeWidth={2} /></div>
          <div>
            <h2 className="font-headline-md text-[17px] font-semibold text-on-background">Schedule</h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant/50">{entries.length} event{entries.length !== 1 ? 's' : ''} this week</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <DateNav rangeLabel={rangeLabel} onPrev={handlePrev} onNext={handleNext} onToday={handleToday} />
          <SegmentedMode mode={viewMode} onChange={setViewMode} />
        </div>
        <button onClick={() => setShowCreate(true)} className="ml-auto flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Add Event
        </button>
      </div>
      {viewMode === 'day' && <DayView entries={dayEntries} todayDate={now} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} onAddEvent={() => setShowCreate(true)} />}
      {viewMode === 'week' && <WeekView entries={entries} weekStart={weekStart} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} onAddEvent={() => setShowCreate(true)} />}
      {viewMode === 'month' && <MonthView entries={entries} year={currentMonth.getFullYear()} month={currentMonth.getMonth()} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} />}
      {showCreate && <EventModal mode="create" initial={{ courseName: '', timeLabel: '', room: '', sessionType: 'lecture', dayLabel: DAY_NAMES[now.getDay() === 0 ? 6 : now.getDay() - 1] }} onCancel={() => setShowCreate(false)} onConfirm={handleCreate} />}
      {editing && <EventModal mode="edit" initial={{ id: editing.id, courseName: editing.course_name, timeLabel: editing.time_label, room: editing.room, sessionType: editing.session_type, dayLabel: editing.day_label }} onCancel={() => setEditing(null)} onConfirm={handleUpdate} />}
      {confirmDelete && <DeleteConfirmModal name={confirmDelete.course_name} onCancel={() => setConfirmDelete(null)} onConfirm={() => void handleDelete(confirmDelete)} />}
    </div>
  );
}
