import { useMemo, useState, useCallback } from 'react';
import {
  Video, Users, FlaskConical, Coffee, BookOpen, Award, Calendar,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { ScheduleEntry } from '@/lib/types';

interface WeeklyTimetableProps {
  entries: ScheduleEntry[];
}

function getSessionIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'lecture':
      return BookOpen;
    case 'seminar':
      return Users;
    case 'practical':
    case 'lab':
      return FlaskConical;
    case 'graded':
      return Award;
    case 'social':
      return Coffee;
    case 'optional':
      return Video;
    default:
      return BookOpen;
  }
}

function sessionAccent(type: string): { bg: string; pill: string; text: string; ring: string } {
  switch (type.toLowerCase()) {
    case 'lecture':   return { bg: 'bg-primary/8',   pill: 'bg-primary/15 text-primary/80',     text: 'text-primary',    ring: 'ring-primary/25' };
    case 'seminar':   return { bg: 'bg-secondary/8', pill: 'bg-secondary/15 text-secondary/80', text: 'text-secondary',  ring: 'ring-secondary/25' };
    case 'practical':
    case 'lab':       return { bg: 'bg-tertiary/8',  pill: 'bg-tertiary/15 text-tertiary/80',   text: 'text-tertiary',   ring: 'ring-tertiary/25' };
    case 'graded':    return { bg: 'bg-error/8',     pill: 'bg-error/15 text-error/80',         text: 'text-error',      ring: 'ring-error/25' };
    default:          return { bg: 'bg-white/4',     pill: 'bg-white/6 text-on-surface-variant/60', text: 'text-on-surface-variant/50', ring: 'ring-white/10' };
  }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function WeeklyTimetable({ entries }: WeeklyTimetableProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  /** Monday of the offset week, computed from system time. */
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + 6);
    return d;
  }, [weekStart]);

  const rangeLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const s = weekStart.toLocaleDateString('en', opts);
    const e = weekEnd.toLocaleDateString('en', { ...opts, year: 'numeric' });
    return `${s} – ${e}`;
  }, [weekStart, weekEnd]);

  const dayMap = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    DAYS.forEach((d) => map.set(d, []));
    entries.forEach((e) => {
      const list = map.get(e.day_label);
      if (list) list.push(e);
    });
    return map;
  }, [entries]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const handleToday = useCallback(() => setWeekOffset(0), []);

  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Weekly Timetable</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/50">{rangeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToday}
            className="rounded-lg bg-white/5 px-2.5 py-1.5 font-label-mono-sm text-[11px] text-on-surface-variant/70 transition-all duration-200 hover:bg-white/8 hover:text-on-surface-variant"
          >
            Today
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/8">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="px-2.5 py-1.5 font-label-mono-sm text-[11px] text-on-surface-variant/70 transition-colors hover:bg-white/5"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="px-2.5 py-1.5 font-label-mono-sm text-[11px] text-on-surface-variant/70 transition-colors hover:bg-white/5"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {DAYS.map((day) => {
          const dayEntries = dayMap.get(day) || [];
          const dayIndex = DAYS.indexOf(day);
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + dayIndex);
          const isRealToday = dayDate.toISOString().slice(0, 10) === todayStr;

          return (
            <div
              key={day}
              className={`flex flex-col rounded-2xl p-2.5 transition-all duration-200 ${
                isRealToday
                  ? 'bg-primary/6 border border-primary/15'
                  : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05]'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className={`font-headline-sm text-[13px] font-semibold ${isRealToday ? 'text-primary' : 'text-on-background'}`}>
                    {day.slice(0, 3)}
                  </p>
                  <p className="font-label-mono-xs text-on-surface-variant/45">{dayDate.getDate()}</p>
                </div>
                {isRealToday && (
                  <span className="rounded-full bg-primary/12 px-1.5 py-0.5 font-label-mono-xs text-[9px] text-primary">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {dayEntries.length === 0 && (
                  <p className="py-3 text-center font-label-mono-xs text-on-surface-variant/20">—</p>
                )}
                {dayEntries.slice(0, 3).map((entry) => {
                  const Icon = getSessionIcon(entry.session_type);
                  const ac = sessionAccent(entry.session_type);
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl px-2 py-1.5 ${ac.bg} ${entry.is_next ? `ring-1 ${ac.ring}` : ''} transition-colors`}
                    >
                      <div className="flex items-center gap-1">
                        <Icon className={`h-2.5 w-2.5 shrink-0 ${ac.text}`} strokeWidth={2} />
                        <span className="font-label-mono-xs text-[9px] text-on-surface-variant/60">{entry.time_label}</span>
                      </div>
                      <p className="mt-0.5 truncate font-body-md text-[11px] font-medium leading-tight text-on-background">
                        {entry.course_name}
                      </p>
                    </div>
                  );
                })}
                {dayEntries.length > 3 && (
                  <p className="pl-1 font-label-mono-xs text-[9px] text-on-surface-variant/30">
                    +{dayEntries.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
