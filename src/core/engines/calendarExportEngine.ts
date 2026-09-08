/**
 * CalendarExportEngine — iCalendar (.ics) generator for schedule items,
 * recurring classes, and upcoming exams in RFC 5545 format.
 */

export interface CalendarEvent {
  uid: string;
  summary: string;
  location: string;
  dtStart: Date;
  dtEnd: Date;
  description: string;
  recurrence?: string; // RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO,WE"
  color?: string; // non-standard X-APPLE-CALENDAR-COLOR
}

export type ExportWindow = 'week' | 'month' | 'semester';

const DAY_ABBREV = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Pad a number to 2 digits. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a Date as iCal DTSTART: YYYYMMDDTHHmmss */
function icalDate(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

/** Fold long lines per RFC 5545 (max 75 octets). */
function foldLine(line: string): string {
  const buf: string[] = [];
  while (line.length > 75) {
    buf.push(line.slice(0, 75));
    line = ' ' + line.slice(75);
  }
  buf.push(line);
  return buf.join('\r\n');
}

/** Build an RRULE for weekly recurrence. */
export function buildWeeklyRRule(daysOfWeek: number[], until?: Date): string {
  const days = daysOfWeek.map((d) => DAY_ABBREV[d]).join(',');
  let rule = `FREQ=WEEKLY;BYDAY=${days}`;
  if (until) rule += `;UNTIL=${icalDate(until)}`;
  return rule;
}

/** Parse a time label like "09:00 - 10:30" into start/end minutes. */
function parseTimeLabel(label: string): { startMin: number; endMin: number } | null {
  const m = label.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const sh = parseInt(m[1], 10);
  const sm = parseInt(m[2], 10);
  const eh = parseInt(m[3], 10);
  const em = parseInt(m[4], 10);
  return { startMin: sh * 60 + sm, endMin: eh * 60 + em };
}

/** Determine the date for a weekday in the current week. */
function dateForWeekday(dayIndex: number, now: Date = new Date()): Date {
  const currentDow = now.getDay(); // 0=Sun
  const diff = (dayIndex - currentDow + 7) % 7;
  const d = new Date(now);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Convert schedule entries to CalendarEvent[] for ICS generation. */
export function scheduleToEvents(
  entries: { courseName: string; room: string; sessionType: string; dayOfWeek: number; timeLabel: string }[],
  now: Date = new Date(),
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const e of entries) {
    const times = parseTimeLabel(e.timeLabel);
    if (!times) continue;
    const baseDate = dateForWeekday(e.dayOfWeek, now);
    const dtStart = new Date(baseDate);
    dtStart.setMinutes(times.startMin);
    const dtEnd = new Date(baseDate);
    dtEnd.setMinutes(times.endMin);

    events.push({
      uid: `${e.courseName}-${e.dayOfWeek}@unimate`,
      summary: `${e.courseName} (${e.sessionType})`,
      location: e.room || '',
      dtStart,
      dtEnd,
      description: `${e.sessionType} — ${e.courseName}\nRoom: ${e.room}`,
      recurrence: buildWeeklyRRule([e.dayOfWeek]),
    });
  }
  return events;
}

/** Convert exam records to CalendarEvent[] (single-day events). */
export function examsToEvents(
  exams: { title: string; codeLabel: string; daysUntilLabel: string; weightLabel: string }[],
  now: Date = new Date(),
): CalendarEvent[] {
  return exams.map((e) => {
    const n = parseInt(e.daysUntilLabel, 10);
    const dt = new Date(now);
    if (!isNaN(n)) dt.setDate(dt.getDate() + n);
    dt.setHours(9, 0, 0, 0);
    const dtEnd = new Date(dt);
    dtEnd.setHours(11, 0, 0, 0);
    return {
      uid: `${e.codeLabel}-${e.title}@unimate`,
      summary: `📝 ${e.title} (${e.codeLabel})`,
      location: '',
      dtStart: dt,
      dtEnd,
      description: `${e.title}\nWeight: ${e.weightLabel}\nCourse: ${e.codeLabel}`,
    };
  });
}

/** Generate the full .ics file content. */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNI-MATE//Academic OS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const e of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${e.uid}`));
    lines.push(`DTSTART:${icalDate(e.dtStart)}`);
    lines.push(`DTEND:${icalDate(e.dtEnd)}`);
    lines.push(foldLine(`SUMMARY:${e.summary}`));
    if (e.location) lines.push(foldLine(`LOCATION:${e.location}`));
    if (e.description) lines.push(foldLine(`DESCRIPTION:${e.description.replace(/\n/g, '\\n')}`));
    if (e.recurrence) lines.push(foldLine(`RRULE:${e.recurrence}`));
    if (e.color) lines.push(foldLine(`X-APPLE-CALENDAR-COLOR:${e.color}`));
    lines.push(`DTSTAMP:${icalDate(new Date())}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Trigger download of an .ics file. */
export function downloadICS(content: string, filename: string = 'unimate-schedule.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Get events within an export window. */
export function filterByWindow(events: CalendarEvent[], window: ExportWindow, now: Date = new Date()): CalendarEvent[] {
  const end = new Date(now);
  switch (window) {
    case 'week':
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'semester':
      end.setMonth(end.getMonth() + 5);
      break;
  }
  return events.filter((e) => e.dtStart >= now && e.dtStart <= end);
}
