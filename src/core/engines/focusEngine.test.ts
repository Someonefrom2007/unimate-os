/**
 * FocusEngine unit tests — focus time aggregation, course breakdown, break recommendations.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateFocusByCourse,
  calculateTotalFocusTime,
  countCompletedSessions,
  getRecommendedBreak,
  sessionTypeDistribution,
} from './focusEngine';
import { SessionType } from '../domain/enums';
import type { StudySession } from '../domain/model/StudySession';

function makeSession(overrides: Partial<StudySession> & { id: string }): StudySession {
  return {
    courseCode: 'CS301',
    taskLabel: 'Algorithms',
    durationMinutes: 50,
    sessionType: SessionType.Pomodoro,
    dateLabel: new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }),
    timeLabel: '14:00',
    completed: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe('calculateTotalFocusTime', () => {
  it('returns total minutes for today', () => {
    const today = new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    const sessions = [
      makeSession({ id: 's1', durationMinutes: 25, dateLabel: today, completed: true }),
      makeSession({ id: 's2', durationMinutes: 50, dateLabel: today, completed: true }),
    ];
    expect(calculateTotalFocusTime(sessions, 'today')).toBe(75);
  });

  it('excludes non-completed sessions', () => {
    const today = new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    const sessions = [
      makeSession({ id: 's1', durationMinutes: 25, dateLabel: today, completed: false }),
      makeSession({ id: 's2', durationMinutes: 50, dateLabel: today, completed: true }),
    ];
    expect(calculateTotalFocusTime(sessions, 'today')).toBe(50);
  });

  it('returns 0 for empty sessions', () => {
    expect(calculateTotalFocusTime([], 'today')).toBe(0);
  });
});

describe('calculateFocusByCourse', () => {
  it('groups by course code', () => {
    const sessions = [
      makeSession({ id: 's1', courseCode: 'CS301', durationMinutes: 50, completed: true }),
      makeSession({ id: 's2', courseCode: 'CS302', durationMinutes: 30, completed: true }),
      makeSession({ id: 's3', courseCode: 'CS301', durationMinutes: 25, completed: true }),
    ];
    const breakdown = calculateFocusByCourse(sessions);
    expect(breakdown).toEqual({ CS301: 75, CS302: 30 });
  });

  it('excludes non-completed', () => {
    const sessions = [
      makeSession({ id: 's1', courseCode: 'CS301', durationMinutes: 50, completed: false }),
    ];
    expect(calculateFocusByCourse(sessions)).toEqual({});
  });

  it('uses "unassigned" for empty course code', () => {
    const sessions = [
      makeSession({ id: 's1', courseCode: '', durationMinutes: 30, completed: true }),
    ];
    expect(calculateFocusByCourse(sessions)).toEqual({ unassigned: 30 });
  });

  it('returns empty for empty input', () => {
    expect(calculateFocusByCourse([])).toEqual({});
  });
});

describe('getRecommendedBreak', () => {
  it('25min → 5min', () => {
    expect(getRecommendedBreak(25)).toBe(5);
  });

  it('50min → 10min', () => {
    expect(getRecommendedBreak(50)).toBe(10);
  });

  it('clamps minimum to 5', () => {
    expect(getRecommendedBreak(5)).toBe(5);
  });

  it('clamps maximum to 25', () => {
    expect(getRecommendedBreak(200)).toBe(25);
  });

  it('returns 5 for 0', () => {
    expect(getRecommendedBreak(0)).toBe(5);
  });
});

describe('countCompletedSessions', () => {
  it('counts completed', () => {
    const sessions = [
      makeSession({ id: 's1', completed: true }),
      makeSession({ id: 's2', completed: false }),
      makeSession({ id: 's3', completed: true }),
    ];
    expect(countCompletedSessions(sessions)).toBe(2);
  });

  it('returns 0 for empty', () => {
    expect(countCompletedSessions([])).toBe(0);
  });
});

describe('sessionTypeDistribution', () => {
  it('counts by type', () => {
    const sessions = [
      makeSession({ id: 's1', sessionType: SessionType.Pomodoro, completed: true }),
      makeSession({ id: 's2', sessionType: SessionType.Pomodoro, completed: true }),
      makeSession({ id: 's3', sessionType: SessionType.DeepWork, completed: true }),
      makeSession({ id: 's4', sessionType: SessionType.Review, completed: false }),
    ];
    const dist = sessionTypeDistribution(sessions);
    expect(dist).toEqual({ [SessionType.Pomodoro]: 2, [SessionType.DeepWork]: 1, [SessionType.Review]: 0 });
  });

  it('returns zeros for empty', () => {
    expect(sessionTypeDistribution([])).toEqual({ [SessionType.Pomodoro]: 0, [SessionType.DeepWork]: 0, [SessionType.Review]: 0 });
  });
});