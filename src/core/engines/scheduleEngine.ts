/**
 * ScheduleEngine — pure domain logic for the schedule vertical slice.
 * Recurrence generation, collision detection, free time gap computation.
 */
import { WeekDay } from '../domain/enums';
import type { CalendarEvent } from '../domain/model/CalendarEvent';

/** A rule describing a recurring lesson slot. */
export interface LessonRule {
  id: string;
  courseId: string | null;
  courseName: string;
  dayOfWeek: WeekDay;
  startTime: string;       // "09:00"
  endTime: string;         // "10:30"
  room: string;
  sessionType: string;
  recurrence: 'weekly' | 'biweekly';
  weekOffset: number;      // 0 = normal week, 1 = alternate week
}

/** A time range in hours from midnight (e.g. 9.5 = 9:30). */
export interface TimeSlot {
  startHour: number;
  endHour: number;
}

/** Collision between two overlapping schedule entries. */
export interface ScheduleCollision {
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
}

/** A free-time gap between consecutive events on a given day. */
export interface FreeGap {
  dayLabel: string;
  startHour: number;
  endHour: number;
  durationMinutes: number;
}

// ---------------------------------------------------------------------------
//  Parsing helpers
// ---------------------------------------------------------------------------

const DAY_LABELS: Record<WeekDay, string> = {
  [WeekDay.Monday]: 'Monday',
  [WeekDay.Tuesday]: 'Tuesday',
  [WeekDay.Wednesday]: 'Wednesday',
  [WeekDay.Thursday]: 'Thursday',
  [WeekDay.Friday]: 'Friday',
  [WeekDay.Saturday]: 'Saturday',
  [WeekDay.Sunday]: 'Sunday',
};

/** Parse "HH:MM" into hours-from-midnight. */
export function parseTime(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) + Number(match[2]) / 60;
}

/** Parse "09:00 - 10:30" into a TimeSlot. */
export function parseTimeRange(label: string): TimeSlot | null {
  const match = label.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { startHour: parseTime(match[1]), endHour: parseTime(match[2]) };
}

/** Format hour float back to "HH:MM". */
export function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Get the ISO 8601 week number for a Date. */
export function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO: the week containing the year's first Thursday has week number 1.
  const dayNum = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // move to Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// ---------------------------------------------------------------------------
//  Recurrence generation
// ---------------------------------------------------------------------------

/**
 * Generate CalendarEvent instances for a given rule across a date range.
 * The range is defined by a start/end Date and the engine creates events for
 * every matching week based on the recurrence pattern.
 */
export function generateEventsFromRule(
  rule: LessonRule,
  rangeStart: Date,
  rangeEnd: Date,
  referenceDate: Date = new Date(),
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const slot = parseTimeRange(`${rule.startTime} - ${rule.endTime}`);
  if (!slot) return events;

  // Iterate every day in the range.
  const current = new Date(rangeStart);
  current.setHours(12, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(12, 0, 0, 0);

  while (current <= end) {
    if (current.getDay() === dayOfWeekToJs(rule.dayOfWeek)) {
      // Check week parity for biweekly.
      if (rule.recurrence === 'biweekly') {
        const weekNum = weekNumber(current);
        if (weekNum % 2 !== rule.weekOffset % 2) {
          current.setDate(current.getDate() + 1);
          continue;
        }
      }

      const dateLabel = `${current.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      const dayLabel = DAY_LABELS[rule.dayOfWeek];

      events.push({
        id: `${rule.id}-${current.toISOString().slice(0, 10)}`,
        courseId: rule.courseId,
        courseName: rule.courseName,
        dayOfWeek: rule.dayOfWeek,
        dayLabel,
        dateLabel,
        isToday: sameDay(current, referenceDate),
        timeLabel: `${rule.startTime} - ${rule.endTime}`,
        room: rule.room,
        sessionType: rule.sessionType,
        isNext: false,
        sortOrder: 0,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return events;
}

/** Generate all events from multiple rules for a date range. */
export function generateSchedule(
  rules: LessonRule[],
  rangeStart: Date,
  rangeEnd: Date,
  referenceDate: Date = new Date(),
): CalendarEvent[] {
  const events = rules.flatMap((rule) =>
    generateEventsFromRule(rule, rangeStart, rangeEnd, referenceDate),
  );
  return sortSchedule(events);
}

/** Sort schedule by day then start hour then course name. */
export function sortSchedule(events: CalendarEvent[]): CalendarEvent[] {
  const dayOrder: Record<WeekDay, number> = {
    [WeekDay.Monday]: 1,
    [WeekDay.Tuesday]: 2,
    [WeekDay.Wednesday]: 3,
    [WeekDay.Thursday]: 4,
    [WeekDay.Friday]: 5,
    [WeekDay.Saturday]: 6,
    [WeekDay.Sunday]: 7,
  };
  return [...events].sort((a, b) => {
    const dayDiff = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
    if (dayDiff !== 0) return dayDiff;
    const hourA = parseTime(a.timeLabel.split(' - ')[0]);
    const hourB = parseTime(b.timeLabel.split(' - ')[0]);
    if (hourA !== hourB) return hourA - hourB;
    return a.courseName.localeCompare(b.courseName);
  }).map((e, i) => ({ ...e, sortOrder: i }));
}

// ---------------------------------------------------------------------------
//  Collision detection
// ---------------------------------------------------------------------------

/** Detect all time-slot collisions among a set of events. */
export function detectCollisions(events: CalendarEvent[]): ScheduleCollision[] {
  const byDay = groupByDay(events);
  const collisions: ScheduleCollision[] = [];

  for (const dayEvents of Object.values(byDay)) {
    const parsed = dayEvents
      .map((e) => ({ event: e, slot: parseTimeRange(e.timeLabel) }))
      .filter((e) => e.slot !== null) as { event: CalendarEvent; slot: TimeSlot }[];

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const a = parsed[i];
        const b = parsed[j];
        const overlap = computeOverlap(a.slot, b.slot);
        if (overlap > 0) {
          collisions.push({
            eventA: a.event,
            eventB: b.event,
            overlapMinutes: overlap,
          });
        }
      }
    }
  }

  return collisions;
}

/** Compute overlap in minutes between two time slots. */
export function computeOverlap(a: TimeSlot, b: TimeSlot): number {
  const overlapStart = Math.max(a.startHour, b.startHour);
  const overlapEnd = Math.min(a.endHour, b.endHour);
  return Math.max(0, Math.round((overlapEnd - overlapStart) * 60));
}

// ---------------------------------------------------------------------------
//  Free time gaps
// ---------------------------------------------------------------------------

/** Compute free-time gaps between events on each day. */
export function computeFreeGaps(
  events: CalendarEvent[],
  dayStart: number = 8,
  dayEnd: number = 18,
): FreeGap[] {
  const byDay = groupByDay(events);
  const days = Object.keys(byDay);
  const gaps: FreeGap[] = [];

  // If no events at all, return a single gap spanning the full day.
  if (days.length === 0) {
    gaps.push({
      dayLabel: 'All Day',
      startHour: dayStart,
      endHour: dayEnd,
      durationMinutes: (dayEnd - dayStart) * 60,
    });
    return gaps;
  }

  for (const dayLabel of days) {
    const dayEvents = byDay[dayLabel];
    const parsed = dayEvents
      .map((e) => parseTimeRange(e.timeLabel))
      .filter((s): s is TimeSlot => s !== null)
      .sort((a, b) => a.startHour - b.startHour);

    if (parsed.length === 0) {
      gaps.push({
        dayLabel,
        startHour: dayStart,
        endHour: dayEnd,
        durationMinutes: (dayEnd - dayStart) * 60,
      });
      continue;
    }

    let cursor = dayStart;
    for (const slot of parsed) {
      if (slot.startHour > cursor) {
        const gapEnd = slot.startHour;
        gaps.push({
          dayLabel,
          startHour: cursor,
          endHour: gapEnd,
          durationMinutes: Math.round((gapEnd - cursor) * 60),
        });
      }
      cursor = Math.max(cursor, slot.endHour);
    }

    if (cursor < dayEnd) {
      gaps.push({
        dayLabel,
        startHour: cursor,
        endHour: dayEnd,
        durationMinutes: Math.round((dayEnd - cursor) * 60),
      });
    }
  }

  return gaps;
}

/** Filter events to only those on a given day label. */
export function eventsForDay(events: CalendarEvent[], dayLabel: string): CalendarEvent[] {
  return events
    .filter((e) => e.dayLabel === dayLabel)
    .sort((a, b) => parseTime(a.timeLabel.split(' - ')[0]) - parseTime(b.timeLabel.split(' - ')[0]));
}

/** Total scheduled minutes for a given set of events. */
export function totalScheduledMinutes(events: CalendarEvent[]): number {
  return events.reduce((sum, e) => {
    const slot = parseTimeRange(e.timeLabel);
    if (!slot) return sum;
    return sum + Math.round((slot.endHour - slot.startHour) * 60);
  }, 0);
}

/** Mark the "next" event relative to a reference time. */
export function markNextEvent(
  events: CalendarEvent[],
  now: Date = new Date(),
): CalendarEvent[] {
  const currentDayIndex = now.getDay(); // 0=Sun
  const jsToWeekDay: Record<number, WeekDay> = {
    0: WeekDay.Sunday,
    1: WeekDay.Monday,
    2: WeekDay.Tuesday,
    3: WeekDay.Wednesday,
    4: WeekDay.Thursday,
    5: WeekDay.Friday,
    6: WeekDay.Saturday,
  };
  const currentWeekDay = jsToWeekDay[currentDayIndex];
  const nowHour = now.getHours() + now.getMinutes() / 60;

  const sorted = sortSchedule(events);
  for (const event of sorted) {
    if (event.dayOfWeek !== currentWeekDay) continue;
    const slot = parseTimeRange(event.timeLabel);
    if (slot && slot.startHour >= nowHour) {
      return sorted.map((e) => ({ ...e, isNext: e.id === event.id }));
    }
  }
  return sorted;
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function dayOfWeekToJs(day: WeekDay): number {
  const map: Record<WeekDay, number> = {
    [WeekDay.Sunday]: 0,
    [WeekDay.Monday]: 1,
    [WeekDay.Tuesday]: 2,
    [WeekDay.Wednesday]: 3,
    [WeekDay.Thursday]: 4,
    [WeekDay.Friday]: 5,
    [WeekDay.Saturday]: 6,
  };
  return map[day] ?? 0;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    (grouped[event.dayLabel] ??= []).push(event);
  }
  return grouped;
}