/**
 * AuditLogEngine unit tests — logging, querying, pruning.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  logEvent,
  queryLog,
  pruneOldLogs,
  logCount,
  clearLog,
  recentByDomain,
} from './auditLogEngine';

describe('logEvent', () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => uninstallLocalStorageMock());

  it('creates an entry with timestamp', () => {
    const entry = logEvent('task', 'completed', 'Finished homework');
    expect(entry.id).toMatch(/^audit_/);
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.domain).toBe('task');
    expect(entry.action).toBe('completed');
    expect(entry.detail).toBe('Finished homework');
  });

  it('persists to storage', () => {
    logEvent('grade', 'updated', 'Grade changed to 8');
    expect(logCount()).toBe(1);
  });
});

describe('queryLog', () => {
  beforeEach(() => {
    installLocalStorageMock();
    logEvent('task', 'completed', 'Task 1');
    logEvent('grade', 'updated', 'Grade 1');
    logEvent('task', 'created', 'Task 2');
  });
  afterEach(() => uninstallLocalStorageMock());

  it('returns all entries without filter', () => {
    const results = queryLog();
    expect(results.length).toBe(3);
  });

  it('filters by domain', () => {
    const results = queryLog({ domain: 'task' });
    expect(results.length).toBe(2);
    expect(results.every((e) => e.domain === 'task')).toBe(true);
  });

  it('respects limit', () => {
    const results = queryLog({ limit: 1 });
    expect(results.length).toBe(1);
  });

  it('returns newest first', () => {
    const results = queryLog();
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].timestamp).toBeGreaterThanOrEqual(results[i].timestamp);
    }
  });

  it('filters by date range', () => {
    const now = Date.now();
    const results = queryLog({ from: now - 1000, to: now + 1000 });
    expect(results.length).toBe(3);
  });
});

describe('pruneOldLogs', () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => uninstallLocalStorageMock());

  it('removes old entries', () => {
    const oldEntry = JSON.stringify([{ id: 'old', timestamp: Date.now() - 60 * 86400000, domain: 'system', action: 'test', detail: '' }]);
    localStorage.setItem('unimate.auditLog', oldEntry);
    const pruned = pruneOldLogs(30);
    expect(pruned).toBe(1);
  });

  it('keeps recent entries', () => {
    logEvent('task', 'completed', 'Recent');
    const pruned = pruneOldLogs(30);
    expect(pruned).toBe(0);
    expect(logCount()).toBe(1);
  });
});

describe('recentByDomain', () => {
  beforeEach(() => {
    installLocalStorageMock();
    logEvent('focus', 'started', 'Session 1');
    logEvent('focus', 'ended', 'Session 2');
    logEvent('task', 'completed', 'Task 1');
  });
  afterEach(() => uninstallLocalStorageMock());

  it('returns recent entries for a domain', () => {
    const results = recentByDomain('focus', 5);
    expect(results.length).toBe(2);
  });
});

describe('clearLog', () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => uninstallLocalStorageMock());

  it('removes all log entries', () => {
    logEvent('system', 'test', 'entry');
    clearLog();
    expect(logCount()).toBe(0);
  });
});
