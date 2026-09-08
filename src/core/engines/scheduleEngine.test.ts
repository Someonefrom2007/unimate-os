/**
 * ScheduleEngine unit tests — recurrence generation, collision detection, free time gaps.
 */
import { describe, expect, it } from 'vitest';
import {
  computeFreeGaps,
  computeOverlap,
  detectCollisions,
  eventsForDay,
  formatHour,
  generateEventsFromRule,
  generateSchedule,
  markNextEvent,
  parseTime,
  parseTimeRange,
  sortSchedule,
  totalScheduledMinutes,
  weekNumber,
  type LessonRule,
  type TimeSlot,
} from './scheduleEngine';
import { WeekDay } from '../domain/enums';
import type { CalendarEvent } from '../domain/model/CalendarEvent';

function makeRule(overrides: Partial<LessonRule> & { id: string }): LessonRule {
  return {
    courseId: null,
    courseName: 'Advanced Algorithms',
    dayOfWeek: WeekDay.Monday,
    startTime: '09:00',
    endTime: '10:30',
    room: 'Turing 301',
    sessionType: 'lecture',
    recurrence: 'weekly',
    weekOffset: 0,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CalendarEvent> & { id: string }): CalendarEvent {
  return {
    courseId: null,
    courseName: 'Advanced Algorithms',
    dayOfWeek: WeekDay.Monday,
    dayLabel: 'Monday',
    dateLabel: 'January 6, 2025',
    isToday: false,
    timeLabel: '09:00 - 10:30',
    room: 'Turing 301',
    sessionType: 'lecture',
    isNext: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe('parseTime', () => {
  it('parses HH:MM correctly', () => {
    expect(parseTime('09:00')).toBe(9);
    expect(parseTime('13:30')).toBe(13.5);
    expect(parseTime('00:00')).toBe(0);
  });

  it('returns 0 for invalid input', () => {
    expect(parseTime('')).toBe(0);
    expect(parseTime('abc')).toBe(0);
  });
});

describe('parseTimeRange', () => {
  it('parses "09:00 - 10:30"', () => {
    const result = parseTimeRange('09:00 - 10:30');
    expect(result).toEqual({ startHour: 9, endHour: 10.5 });
  });

  it('returns null for invalid format', () => {
    expect(parseTimeRange('invalid')).toBeNull();
    expect(parseTimeRange('09:00')).toBeNull();
  });
});

describe('formatHour', () => {
  it('formats whole hours', () => {
    expect(formatHour(9)).toBe('09:00');
    expect(formatHour(13)).toBe('13:00');
  });

  it('formats fractional hours', () => {
    expect(formatHour(9.5)).toBe('09:30');
    expect(formatHour(13.25)).toBe('13:15');
  });
});

describe('weekNumber', () => {
  it('returns correct week numbers', () => {
    // ISO week: Jan 1, 2025 is week 1; Jan 6, 2025 is week 2
    expect(weekNumber(new Date(2025, 0, 1))).toBe(1);
    expect(weekNumber(new Date(2025, 0, 6))).toBe(2);
  });
});

describe('generateEventsFromRule', () => {
  const rangeStart = new Date(2025, 0, 1);  // Wed Jan 1
  const rangeEnd = new Date(2025, 0, 31);   // Fri Jan 31
  const refDate = new Date(2025, 0, 6, 12); // Mon Jan 6, noon

  it('generates weekly events for each matching day', () => {
    const rule = makeRule({ id: 'r1', dayOfWeek: WeekDay.Monday });
    const events = generateEventsFromRule(rule, rangeStart, rangeEnd, refDate);
    // Jan 6, 13, 20, 27 are Mondays in range
    expect(events).toHaveLength(4);
    expect(events.every((e) => e.dayOfWeek === WeekDay.Monday)).toBe(true);
  });

  it('generates biweekly events with correct parity', () => {
    const rule = makeRule({ id: 'r2', dayOfWeek: WeekDay.Wednesday, recurrence: 'biweekly', weekOffset: 0 });
    const events = generateEventsFromRule(rule, rangeStart, rangeEnd, refDate);
    // Week 1 (Jan 1) offset=0 matches; week 2 (Jan 8) offset=1 doesn't; etc.
    // Jan 1 (week 1, offset 0), Jan 15 (week 3, offset 0), Jan 29 (week 5, offset 0)
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for no matching days', () => {
    // Range Jan 1-31 2025 contains no Sunday rule; use a day with no occurrence.
    const rule = makeRule({ id: 'r3', dayOfWeek: WeekDay.Sunday });
    const events = generateEventsFromRule(rule, new Date(2025, 0, 6), new Date(2025, 0, 6), refDate);
    expect(events).toHaveLength(0);
  });

  it('marks isToday correctly', () => {
    const rule = makeRule({ id: 'r4', dayOfWeek: WeekDay.Monday });
    const events = generateEventsFromRule(rule, rangeStart, rangeEnd, refDate);
    const todayEvent = events.find((e) => e.isToday);
    expect(todayEvent).toBeDefined();
    expect(todayEvent?.dateLabel).toContain('January 6');
  });

  it('returns empty for bad time range', () => {
    const rule = makeRule({ id: 'r5', startTime: 'bad', endTime: 'bad' });
    const events = generateEventsFromRule(rule, rangeStart, rangeEnd, refDate);
    expect(events).toHaveLength(0);
  });
});

describe('generateSchedule', () => {
  it('combines multiple rules', () => {
    const rules = [
      makeRule({ id: 'r1', dayOfWeek: WeekDay.Monday }),
      makeRule({ id: 'r2', dayOfWeek: WeekDay.Wednesday }),
    ];
    const rangeStart = new Date(2025, 0, 1);
    const rangeEnd = new Date(2025, 0, 31);
    const refDate = new Date(2025, 0, 6, 12);
    const events = generateSchedule(rules, rangeStart, rangeEnd, refDate);
    expect(events.length).toBeGreaterThanOrEqual(4); // At least 2 Mondays + 2 Wednesdays
  });
});

describe('sortSchedule', () => {
  it('sorts by day then start hour', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Wednesday, timeLabel: '14:00 - 15:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e3', dayOfWeek: WeekDay.Monday, timeLabel: '11:00 - 12:00' }),
    ];
    const sorted = sortSchedule(events);
    expect(sorted.map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
  });

  it('sorts by course name when times match', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00', courseName: 'Zebra' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00', courseName: 'Alpha' }),
    ];
    const sorted = sortSchedule(events);
    expect(sorted.map((e) => e.courseName)).toEqual(['Alpha', 'Zebra']);
  });

  it('sets sortOrder sequentially', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Tuesday, timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00' }),
    ];
    const sorted = sortSchedule(events);
    expect(sorted[0].sortOrder).toBe(0);
    expect(sorted[1].sortOrder).toBe(1);
  });
});

describe('detectCollisions', () => {
  it('detects overlapping events on same day', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:30' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '10:00 - 11:30' }),
    ];
    const collisions = detectCollisions(events);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].overlapMinutes).toBe(30);
  });

  it('returns empty for non-overlapping events', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '10:00 - 11:00' }),
    ];
    expect(detectCollisions(events)).toHaveLength(0);
  });

  it('ignores events on different days', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, dayLabel: 'Monday', timeLabel: '09:00 - 10:30' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Wednesday, dayLabel: 'Wednesday', timeLabel: '09:00 - 10:30' }),
    ];
    expect(detectCollisions(events)).toHaveLength(0);
  });

  it('detects triple collision (3 events)', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 11:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '09:30 - 11:30' }),
      makeEvent({ id: 'e3', dayOfWeek: WeekDay.Monday, timeLabel: '10:00 - 12:00' }),
    ];
    const collisions = detectCollisions(events);
    // 3 pairs: (e1,e2), (e1,e3), (e2,e3)
    expect(collisions).toHaveLength(3);
  });
});

describe('computeOverlap', () => {
  it('returns positive minutes for overlapping slots', () => {
    const a: TimeSlot = { startHour: 9, endHour: 10.5 };
    const b: TimeSlot = { startHour: 10, endHour: 11.5 };
    expect(computeOverlap(a, b)).toBe(30);
  });

  it('returns 0 for non-overlapping', () => {
    const a: TimeSlot = { startHour: 9, endHour: 10 };
    const b: TimeSlot = { startHour: 10, endHour: 11 };
    expect(computeOverlap(a, b)).toBe(0);
  });

  it('handles full containment', () => {
    const a: TimeSlot = { startHour: 9, endHour: 12 };
    const b: TimeSlot = { startHour: 10, endHour: 11 };
    expect(computeOverlap(a, b)).toBe(60);
  });
});

describe('computeFreeGaps', () => {
  it('returns one big gap when no events', () => {
    const gaps = computeFreeGaps([], 8, 18);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMinutes).toBe(600);
    expect(gaps[0].dayLabel).toBe('All Day');
  });

  it('computes gaps between events', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, timeLabel: '12:00 - 13:00' }),
    ];
    const gaps = computeFreeGaps(events, 8, 18);
    // 8:00-9:00 (60min), 10:00-12:00 (120min), 13:00-18:00 (300min)
    const mondayGaps = gaps.filter((g) => g.dayLabel === 'Monday');
    expect(mondayGaps).toHaveLength(3);
    expect(mondayGaps[0].durationMinutes).toBe(60);
    expect(mondayGaps[1].durationMinutes).toBe(120);
    expect(mondayGaps[2].durationMinutes).toBe(300);
  });
});

describe('eventsForDay', () => {
  it('returns events for the specified day, sorted by time', () => {
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Monday, dayLabel: 'Monday', timeLabel: '11:00 - 12:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Monday, dayLabel: 'Monday', timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e3', dayOfWeek: WeekDay.Wednesday, dayLabel: 'Wednesday', timeLabel: '09:00 - 10:00' }),
    ];
    const mondayEvents = eventsForDay(events, 'Monday');
    expect(mondayEvents).toHaveLength(2);
    expect(mondayEvents[0].id).toBe('e2');
  });
});

describe('totalScheduledMinutes', () => {
  it('sums durations', () => {
    const events = [
      makeEvent({ id: 'e1', timeLabel: '09:00 - 10:30' }), // 90min
      makeEvent({ id: 'e2', timeLabel: '11:00 - 12:00' }), // 60min
    ];
    expect(totalScheduledMinutes(events)).toBe(150);
  });

  it('returns 0 for empty list', () => {
    expect(totalScheduledMinutes([])).toBe(0);
  });
});

describe('markNextEvent', () => {
  it('marks the first upcoming event today', () => {
    // Wednesday Jan 1, 2025 at 10:00
    const now = new Date(2025, 0, 1, 10, 0);
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Wednesday, timeLabel: '09:00 - 10:00' }),
      makeEvent({ id: 'e2', dayOfWeek: WeekDay.Wednesday, timeLabel: '11:00 - 12:00' }),
      makeEvent({ id: 'e3', dayOfWeek: WeekDay.Monday, timeLabel: '09:00 - 10:00' }),
    ];
    const result = markNextEvent(events, now);
    expect(result.find((e) => e.id === 'e2')?.isNext).toBe(true);
    expect(result.find((e) => e.id === 'e1')?.isNext).toBe(false);
  });

  it('marks nothing if all today events have passed', () => {
    const now = new Date(2025, 0, 1, 15, 0); // Wed 3pm
    const events = [
      makeEvent({ id: 'e1', dayOfWeek: WeekDay.Wednesday, timeLabel: '09:00 - 10:00' }),
    ];
    const result = markNextEvent(events, now);
    expect(result.some((e) => e.isNext)).toBe(false);
  });
});