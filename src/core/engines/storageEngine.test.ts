/**
 * StorageEngine unit tests — metrics, entity counting, cache clearing.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  computeStorageMetrics,
  computeStorageReport,
  clearCacheKeys,
  clearAllStorage,
  formatStorageSummary,
} from './storageEngine';

describe('computeStorageMetrics', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.setItem('courses', JSON.stringify([{ id: '1' }, { id: '2' }]));
    localStorage.setItem('tasks', JSON.stringify([{ id: 't1' }]));
  });
  afterEach(() => uninstallLocalStorageMock());

  it('returns an array of metrics', () => {
    const metrics = computeStorageMetrics();
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('counts courses correctly', () => {
    const metrics = computeStorageMetrics();
    const courses = metrics.find((m) => m.entity === 'Courses');
    expect(courses).toBeDefined();
    expect(courses!.itemCount).toBe(1);
    expect(courses!.bytesApprox).toBeGreaterThan(0);
  });

  it('counts tasks correctly', () => {
    const metrics = computeStorageMetrics();
    const tasks = metrics.find((m) => m.entity === 'Tasks');
    expect(tasks).toBeDefined();
    expect(tasks!.itemCount).toBe(1);
  });

  it('returns 0 for empty entities', () => {
    const metrics = computeStorageMetrics();
    const exams = metrics.find((m) => m.entity === 'Exams');
    expect(exams).toBeDefined();
    expect(exams!.itemCount).toBe(0);
  });
});

describe('computeStorageReport', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.setItem('courses', JSON.stringify([{ id: '1' }]));
  });
  afterEach(() => uninstallLocalStorageMock());

  it('returns a valid report', async () => {
    const report = await computeStorageReport();
    expect(report.totalLocalBytes).toBeGreaterThan(0);
    expect(report.totalItems).toBeGreaterThan(0);
    expect(report.quotaBytes).toBeGreaterThan(0);
    expect(report.localStorage.length).toBeGreaterThan(0);
  });
});

describe('clearCacheKeys', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.setItem('courses', JSON.stringify([{ id: '1' }]));
    localStorage.setItem('theme.cache', '{}');
    localStorage.setItem('app.temp', '{}');
  });
  afterEach(() => uninstallLocalStorageMock());

  it('clears cache and temp keys', () => {
    const cleared = clearCacheKeys();
    expect(cleared).toBe(2);
    expect(localStorage.getItem('courses')).toBeTruthy();
    expect(localStorage.getItem('theme.cache')).toBeNull();
  });
});

describe('clearAllStorage', () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => uninstallLocalStorageMock());

  it('removes everything', () => {
    localStorage.setItem('courses', JSON.stringify([]));
    clearAllStorage();
    expect(localStorage.length).toBe(0);
  });
});

describe('formatStorageSummary', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.setItem('courses', JSON.stringify([{ id: '1' }]));
  });
  afterEach(() => uninstallLocalStorageMock());

  it('returns a string with KB info', async () => {
    const report = await computeStorageReport();
    const summary = formatStorageSummary(report);
    expect(summary).toContain('KB');
    expect(summary).toContain('Quota');
  });
});
