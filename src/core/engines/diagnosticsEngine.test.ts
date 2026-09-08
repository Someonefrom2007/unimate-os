/**
 * DiagnosticsEngine unit tests — health reports, repair routines.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  generateHealthReport,
  repairOrphanTasks,
  repairOrphanGrades,
  runRepairs,
} from './diagnosticsEngine';

describe('generateHealthReport', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('returns a complete health report', () => {
    const report = generateHealthReport();
    expect(report.timestamp).toBeTruthy();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.entityCounts).toBeDefined();
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it('marks storage as available when it works', () => {
    const report = generateHealthReport();
    expect(report.storageAvailable).toBe(true);
  });

  it('overall status is pass or warn (never fail in clean env)', () => {
    const report = generateHealthReport();
    expect(['pass', 'warn']).toContain(report.overallStatus);
  });

  it('checks orphan tasks with clean data', () => {
    localStorage.setItem('courses', JSON.stringify([{ code: 'CS301' }]));
    localStorage.setItem('tasks', JSON.stringify([{ courseCode: 'CS301', title: 'HW' }]));
    const report = generateHealthReport();
    const taskCheck = report.checks.find((c) => c.name === 'Orphan Tasks');
    expect(taskCheck?.status).toBe('pass');
  });
});

describe('repairOrphanTasks', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('removes orphan tasks', () => {
    localStorage.setItem('courses', JSON.stringify([{ code: 'CS301' }]));
    localStorage.setItem('tasks', JSON.stringify([
      { courseCode: 'CS301', title: 'Valid' },
      { courseCode: 'PHY999', title: 'Orphan' },
    ]));
    const result = repairOrphanTasks();
    expect(result.orphansRemoved).toBe(1);
    expect(result.details.length).toBe(1);
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Valid');
  });

  it('does nothing when no orphans', () => {
    localStorage.setItem('courses', JSON.stringify([{ code: 'CS301' }]));
    localStorage.setItem('tasks', JSON.stringify([{ courseCode: 'CS301', title: 'HW' }]));
    const result = repairOrphanTasks();
    expect(result.orphansRemoved).toBe(0);
  });
});

describe('repairOrphanGrades', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('removes orphan grades', () => {
    localStorage.setItem('courses', JSON.stringify([{ code: 'CS301' }]));
    localStorage.setItem('grade_entries', JSON.stringify([
      { courseCode: 'CS301', grade: 8 },
      { courseCode: 'DELETED', grade: 9 },
    ]));
    const result = repairOrphanGrades();
    expect(result.orphansRemoved).toBe(1);
    const grades = JSON.parse(localStorage.getItem('grade_entries') || '[]');
    expect(grades.length).toBe(1);
  });
});

describe('runRepairs', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('repairs both orphans', () => {
    localStorage.setItem('courses', JSON.stringify([{ code: 'CS301' }]));
    localStorage.setItem('tasks', JSON.stringify([{ courseCode: 'GHOST', title: 'Orphan Task' }]));
    localStorage.setItem('grade_entries', JSON.stringify([{ courseCode: 'GHOST', grade: 5 }]));
    const result = runRepairs();
    expect(result.orphansRemoved).toBe(2);
    expect(result.details.length).toBe(2);
  });
});
