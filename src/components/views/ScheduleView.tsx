import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Video, Users, FlaskConical, Coffee, BookOpen, Award,
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin,
  Plus, Trash2, Pencil,
} from 'lucide-react';
import type { ScheduleEntry, AccentColor as UiAccent } from '@/lib/types';
import { useScheduleStore } from '@/core/store/useScheduleStore';
import { useCourseStore } from '@/core/store/useCourseStore';
import { toUiScheduleEntry, fromUiScheduleEntry } from './scheduleUiAdapter';
import { AddEditEventModal } from './AddEditEventModal';
import type { CalendarEvent } from '@/core/domain/model/CalendarEvent';
import { accentHex } from '@/lib/accent';

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

/** Resolve an event's accent to a tailwind-compatible key, mapping the full course palette onto the 3 brand accents for static classes. */
function extractAccentKey(_entry: ScheduleEntry, courseAccent?: UiAccent): AccentColorKey {
  if (courseAccent && courseAccent !== 'primary' && courseAccent !== 'secondary' && courseAccent !== 'tertiary') {
    // New palette colors (gold/emerald/cyan/rose/indigo/amber/slate/violet) fall back
    // to a vivid brand key so text/bg classes stay static; the exact hex is applied inline.
    return 'secondary';
  }
  if (courseAccent) return courseAccent;
  switch (_entry.session_type?.toLowerCase()) {
    case 'seminar': return 'secondary';
    case 'practical': case 'lab': return 'tertiary';
    default: return 'primary';
  }
}

/** Resolve dynamic hex (new palette) or undefined (legacy brand colors → static classes). */
function resolveAccentHex(entry: ScheduleEntry, courseAccent?: UiAccent): string | undefined {
  if (courseAccent && courseAccent !== 'primary' && courseAccent !== 'secondary' && courseAccent !== 'tertiary') {
    return accentHex(courseAccent);
  }
  void entry;
  return undefined;
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

function EventCard({ entry, positionStyle, accentKey, accentHexOverride, compact, onEdit, onDelete }: {
  entry: ScheduleEntry; positionStyle?: React.CSSProperties; accentKey: AccentColorKey; accentHexOverride?: string; compact?: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const Icon = getSessionIcon(entry.session_type);
  const hex = accentHexOverride || (accentKey === 'primary' ? '#ffc880' : accentKey === 'secondary' ? '#b4b7ff' : '#5beaad');

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 transition-all duration-200 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-black/20 ${compact ? '' : 'w-full'}`}
      style={{ ...positionStyle }}
    >
      {/* Left vertical accent bar */}
      <span className="absolute left-0 top-0 h-full w-1.5 rounded-full" style={{ backgroundColor: hex, boxShadow: `0 0 12px ${hex}55` }} />
      <div className="pl-4 pr-2 py-2.5">
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-md bg-white/10 p-1 text-on-surface-variant/60 hover:bg-white/20 hover:text-on-background" aria-label="Edit event"><Pencil className="h-3 w-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-md bg-white/10 p-1 text-on-surface-variant/60 hover:bg-error/20 hover:text-error" aria-label="Delete event"><Trash2 className="h-3 w-3" /></button>
        </div>
        <div className="flex items-start gap-2.5 pr-12">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${hex}16` }}>
            <Icon className="h-4 w-4" style={{ color: hex }} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body-md text-[13px] font-semibold text-on-background">{entry.course_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {entry.room && <span className="flex items-center gap-1 font-label-mono-xs text-on-surface-variant/50"><MapPin className="h-3 w-3" />{entry.room}</span>}
              <span className="flex items-center gap-1 font-label-mono-xs text-on-surface-variant/50"><Clock className="h-3 w-3" />{entry.time_label}</span>
            </div>
            {!compact && (
              <span
                className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${hex}22`, color: hex }}
              >
                {entry.session_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Day View                                                           */
/* ------------------------------------------------------------------ */

function DayView({ entries, todayDate, courseAccentMap, onEdit, onDelete, onAddEvent }: { entries: ScheduleEntry[]; todayDate: Date; courseAccentMap: Map<string, UiAccent>; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void; onAddEvent: () => void }) {
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
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><CalendarDays className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="font-headline-md text-[15px] font-semibold text-on-background">{todayDate.toLocaleDateString('en', { weekday: 'long' })}</p>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">{todayDate.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        {positioned.length > 0 && <span className="ml-auto rounded-full bg-primary/12 px-3 py-1 font-label-mono-xs text-primary/80">{positioned.length} event{positioned.length !== 1 ? 's' : ''}</span>}
        <button onClick={onAddEvent} className="ml-2 flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-3 py-1.5 font-label-mono-xs font-semibold text-surface transition-transform hover:scale-[1.02]"><Plus className="h-3 w-3" strokeWidth={2.5} /> Add</button>
      </div>
      <div className="relative h-[600px] overflow-hidden rounded-xl border border-neutral-800/60">
        {hours.map((h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-neutral-800/50 transition-colors hover:bg-white/[0.02]" style={{ top: `${((h - 8) / 13) * 100}%` }}>
            <span className="absolute -top-2 left-2 rounded bg-neutral-900/80 px-1 font-label-mono-xs text-on-surface-variant/50 backdrop-blur-sm">
              {h === 12 ? '12:00 PM' : h > 12 ? `${String(h - 12).padStart(2, '0')}:00 PM` : `${String(h).padStart(2, '0')}:00 AM`}
            </span>
          </div>
        ))}
        {positioned.map((entry) => {
          const courseAccent = courseAccentMap.get(entry.course_name);
          return (
            <EventCard
              key={entry.id}
              entry={entry}
              accentKey={extractAccentKey(entry, courseAccent)}
              accentHexOverride={resolveAccentHex(entry, courseAccent)}
              positionStyle={{ position: 'absolute', top: `${entry.top}%`, height: `${entry.height}%`, left: 48, right: 0, zIndex: 1 }}
              onEdit={() => onEdit(entry)}
              onDelete={() => onDelete(entry)}
            />
          );
        })}
        {positioned.length === 0 && <div className="flex h-full items-center justify-center"><p className="font-label-mono-sm text-on-surface-variant/30">No events scheduled</p></div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Week View                                                          */
/* ------------------------------------------------------------------ */

function WeekView({ entries, weekStart, courseAccentMap, onEdit, onDelete, onAddEvent }: { entries: ScheduleEntry[]; weekStart: Date; courseAccentMap: Map<string, UiAccent>; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void; onAddEvent: () => void }) {
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
        {days.map((day) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          return (
            <div key={day.name} className="min-h-[140px] rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-1.5 transition-colors hover:bg-neutral-900/60">
              <div className={`mb-1.5 rounded-lg px-2 py-1 text-center ${isToday ? 'bg-primary/15 text-primary' : 'bg-white/3 text-on-surface-variant/60'}`}>
                <p className="font-label-mono-xs font-bold">{day.date.toLocaleDateString('en', { weekday: 'short' })}</p>
                <p className="font-headline-sm text-[15px] font-bold">{day.date.getDate()}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {day.entries.map((entry) => {
                  const courseAccent = courseAccentMap.get(entry.course_name);
                  return (
                    <EventCard
                      key={entry.id}
                      entry={entry}
                      accentKey={extractAccentKey(entry, courseAccent)}
                      accentHexOverride={resolveAccentHex(entry, courseAccent)}
                      compact
                      onEdit={() => onEdit(entry)}
                      onDelete={() => onDelete(entry)}
                    />
                  );
                })}
                {day.entries.length === 0 && <p className="py-3 text-center font-label-mono-xs text-on-surface-variant/25">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Month View                                                         */
/* ------------------------------------------------------------------ */

function MonthView({ entries, year, month, courseAccentMap, onEdit, onDelete }: { entries: ScheduleEntry[]; year: number; month: number; courseAccentMap: Map<string, UiAccent>; onEdit: (e: ScheduleEntry) => void; onDelete: (e: ScheduleEntry) => void }) {
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
            <div key={cell.date} className={`min-h-[76px] rounded-xl border p-1.5 transition-all ${isToday ? 'border-primary/40 bg-primary/5 shadow-[0_0_16px_-6px_rgba(255,200,128,0.4)]' : cell.isCurrentMonth ? 'border-neutral-800/60 bg-neutral-900/40 hover:border-neutral-700/80 hover:bg-neutral-900/60' : 'border-transparent bg-transparent opacity-30'}`}>
              <p className={`mb-1 text-right font-label-mono-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant/60'}`}>{cell.day}</p>
              <div className="flex flex-col gap-1">
                {cell.entries.slice(0, 2).map((e) => {
                  const courseAccent = courseAccentMap.get(e.course_name);
                  const hex = resolveAccentHex(e, courseAccent) || (extractAccentKey(e, courseAccent) === 'primary' ? '#ffc880' : extractAccentKey(e, courseAccent) === 'secondary' ? '#b4b7ff' : '#5beaad');
                  return (
                    <div
                      key={e.id}
                      className="group/ev relative cursor-pointer truncate rounded-full px-2 py-0.5 font-label-mono-xs text-[9px] font-medium transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${hex}1f`, color: hex }}
                      onClick={() => onEdit(e)}
                    >
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: hex }} />
                      {e.course_name}
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
  const { data: courseData } = useCourseStore();
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

  /** Map of course name → course accent, so schedule blocks inherit course colors. */
  const courseAccentMap = useMemo(() => {
    const map = new Map<string, UiAccent>();
    for (const c of courseData) map.set(c.name, c.accent as UiAccent);
    return map;
  }, [courseData]);

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
      {viewMode === 'day' && <DayView entries={dayEntries} todayDate={now} courseAccentMap={courseAccentMap} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} onAddEvent={() => setShowCreate(true)} />}
      {viewMode === 'week' && <WeekView entries={entries} weekStart={weekStart} courseAccentMap={courseAccentMap} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} onAddEvent={() => setShowCreate(true)} />}
      {viewMode === 'month' && <MonthView entries={entries} year={currentMonth.getFullYear()} month={currentMonth.getMonth()} courseAccentMap={courseAccentMap} onEdit={(e) => setEditing(e)} onDelete={(e) => setConfirmDelete(e)} />}
      {showCreate && (
        <AddEditEventModal
          mode="create"
          initial={{ courseName: '', timeLabel: '', room: '', sessionType: 'lecture', dayLabel: '' }}
          courses={courseData}
          onCancel={() => setShowCreate(false)}
          onConfirm={handleCreate}
        />
      )}
      {editing && (
        <AddEditEventModal
          mode="edit"
          initial={{ id: editing.id, courseName: editing.course_name, timeLabel: editing.time_label, room: editing.room, sessionType: editing.session_type, dayLabel: editing.day_label, dateLabel: editing.date_label }}
          courses={courseData}
          onCancel={() => setEditing(null)}
          onConfirm={handleUpdate}
        />
      )}
      {confirmDelete && <DeleteConfirmModal name={confirmDelete.course_name} onCancel={() => setConfirmDelete(null)} onConfirm={() => void handleDelete(confirmDelete)} />}
    </div>
  );
}
