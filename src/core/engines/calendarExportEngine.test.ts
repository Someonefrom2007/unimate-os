/**
 * CalendarExportEngine unit tests — ICS generation, event conversion, windowing.
 */
import { describe, expect, it } from 'vitest';
import {
  buildWeeklyRRule,
  scheduleToEvents,
  examsToEvents,
  generateICS,
  filterByWindow,
  type CalendarEvent,
} from './calendarExportEngine';

describe('buildWeeklyRRule', () => {
  it('builds a weekly rule for Monday and Wednesday', () => {
    const rule = buildWeeklyRRule([1, 3]);
    expect(rule).toBe('FREQ=WEEKLY;BYDAY=MO,WE');
  });

  it('includes UNTIL when provided', () => {
    const until = new Date(2025, 11, 31, 23, 59, 59);
    const rule = buildWeeklyRRule([2], until);
    expect(rule).toContain('UNTIL=');
    expect(rule).toContain('FREQ=WEEKLY');
  });
});

describe('scheduleToEvents', () => {
  it('converts schedule entries to calendar events', () => {
    const entries = [{
      courseName: 'Algorithms',
      room: 'B101',
      sessionType: 'lecture',
      dayOfWeek: 1, // Monday
      timeLabel: '09:00 - 10:30',
    }];
    const now = new Date(2025, 8, 15, 12, 0, 0); // Monday Sep 15
    const events = scheduleToEvents(entries, now);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toContain('Algorithms');
    expect(events[0].location).toBe('B101');
    expect(events[0].recurrence).toContain('MO');
  });

  it('skips entries with unparseable time labels', () => {
    const entries = [{
      courseName: 'Test',
      room: '',
      sessionType: 'lecture',
      dayOfWeek: 1,
      timeLabel: 'invalid',
    }];
    const events = scheduleToEvents(entries);
    expect(events).toHaveLength(0);
  });
});

describe('examsToEvents', () => {
  it('creates single-day events from exam data', () => {
    const now = new Date(2025, 8, 15);
    const exams = [{ title: 'Midterm', codeLabel: 'CS301', daysUntilLabel: '5', weightLabel: '40%' }];
    const events = examsToEvents(exams, now);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toContain('Midterm');
    expect(events[0].summary).toContain('📝');
  });

  it('handles NaN days gracefully', () => {
    const exams = [{ title: 'Final', codeLabel: 'CS301', daysUntilLabel: 'soon', weightLabel: '50%' }];
    const events = examsToEvents(exams, new Date(2025, 8, 15));
    expect(events).toHaveLength(1);
    // Falls back to today
    expect(events[0].dtStart.getDate()).toBe(15);
  });
});

describe('generateICS', () => {
  it('produces valid iCalendar content', () => {
    const events: CalendarEvent[] = [{
      uid: 'test-1@unimate',
      summary: 'Test Event',
      location: 'Room 101',
      dtStart: new Date(2025, 8, 15, 9, 0),
      dtEnd: new Date(2025, 8, 15, 10, 0),
      description: 'A test event',
      recurrence: 'FREQ=WEEKLY;BYDAY=MO',
    }];
    const ics = generateICS(events);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:test-1@unimate');
    expect(ics).toContain('SUMMARY:Test Event');
    expect(ics).toContain('LOCATION:Room 101');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO');
  });
});

describe('filterByWindow', () => {
  const now = new Date(2025, 8, 15);
  const events: CalendarEvent[] = [
    { uid: '1', summary: 'This week', location: '', dtStart: new Date(2025, 8, 16), dtEnd: new Date(2025, 8, 16, 1), description: '' },
    { uid: '2', summary: 'Next month', location: '', dtStart: new Date(2025, 9, 1), dtEnd: new Date(2025, 9, 1, 1), description: '' },
    { uid: '3', summary: 'Semester end', location: '', dtStart: new Date(2026, 0, 15), dtEnd: new Date(2026, 0, 15, 1), description: '' },
  ];

  it('week window shows only this week', () => {
    const filtered = filterByWindow(events, 'week', now);
    expect(filtered.length).toBe(1);
    expect(filtered[0].summary).toBe('This week');
  });

  it('month window shows this week + next month', () => {
    const filtered = filterByWindow(events, 'month', now);
    expect(filtered.length).toBe(2);
  });

  it('semester window shows all', () => {
    const filtered = filterByWindow(events, 'semester', now);
    expect(filtered.length).toBe(3);
  });
});
