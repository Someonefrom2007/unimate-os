/**
 * ExportEngine unit tests — backup creation, validation, checksum, rollback.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  createBackup,
  validateBackup,
  computeChecksum,
  parseBackupFile,
  snapshotForRollback,
  getLatestRollback,
  BACKUP_SCHEMA_VERSION,
  ENTITY_TABLES,
} from './exportEngine';

describe('computeChecksum', () => {
  it('returns a hex string', () => {
    const cs = computeChecksum({ courses: [] });
    expect(cs).toMatch(/^[0-9a-f]{8}$/);
  });
  it('same data produces same checksum', () => {
    const data = { courses: [{ id: '1' }], tasks: [{ id: '2' }] };
    expect(computeChecksum(data)).toBe(computeChecksum({ ...data }));
  });
  it('different data produces different checksum', () => {
    expect(computeChecksum({ a: [1] })).not.toBe(computeChecksum({ a: [2] }));
  });
});

describe('createBackup', () => {
  it('creates a valid payload', () => {
    const payload = createBackup({ courses: [{ id: 'c1' }], tasks: [] });
    expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(payload.appVersion).toBe('2.0.0');
    expect(payload.createdAt).toBeTruthy();
    expect(payload.checksum).toBeTruthy();
    expect(payload.tables.courses).toHaveLength(1);
  });
});

describe('validateBackup', () => {
  it('rejects non-object', () => {
    const r = validateBackup('not json');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects missing schemaVersion', () => {
    const r = validateBackup({ createdAt: '2025-01-01', tables: {}, checksum: 'abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('schemaVersion'))).toBe(true);
  });

  it('rejects unknown tables', () => {
    const r = validateBackup({ schemaVersion: 1, createdAt: '2025-01-01', tables: { fakeTable: [] }, checksum: 'abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('fakeTable'))).toBe(true);
  });

  it('rejects non-array table values', () => {
    const r = validateBackup({ schemaVersion: 1, createdAt: '2025-01-01', tables: { courses: 'not-array' }, checksum: 'abc' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('not an array'))).toBe(true);
  });

  it('detects checksum mismatch', () => {
    const payload = createBackup({ courses: [] });
    // Tamper with tables
    payload.tables.courses = [{ id: 'tampered' }];
    const r = validateBackup(payload);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('Checksum mismatch'))).toBe(true);
  });

  it('validates a correct backup', () => {
    const payload = createBackup({ courses: [], tasks: [] });
    const r = validateBackup(payload);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});

describe('parseBackupFile', () => {
  it('rejects invalid JSON', () => {
    const r = parseBackupFile('{bad json');
    expect(r.payload).toBeNull();
    expect(r.validation.valid).toBe(false);
  });

  it('rejects invalid structure', () => {
    const r = parseBackupFile(JSON.stringify({ not: 'valid' }));
    expect(r.payload).toBeNull();
    expect(r.validation.valid).toBe(false);
  });

  it('parses a valid backup', () => {
    const payload = createBackup({ courses: [] });
    const r = parseBackupFile(JSON.stringify(payload));
    expect(r.payload).not.toBeNull();
    expect(r.validation.valid).toBe(true);
  });
});

describe('snapshotForRollback', () => {
  beforeEach(() => { installLocalStorageMock(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('creates a rollback snapshot', () => {
    localStorage.setItem('unimate.test', 'value');
    const key = snapshotForRollback({ courses: [{ id: '1' }] });
    expect(key).toMatch(/^unimate\.rollback\.\d+$/);
    expect(localStorage.getItem(key)).toBeTruthy();
  });

  it('retrieves the latest rollback', () => {
    snapshotForRollback({ courses: [] });
    const r = getLatestRollback();
    expect(r).not.toBeNull();
    expect(r!.tables.courses).toEqual([]);
  });

  it('keeps only 3 rollback snapshots', () => {
    for (let i = 0; i < 5; i++) snapshotForRollback({ courses: [{ id: String(i) }] });
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('unimate.rollback.'));
    expect(keys.length).toBeLessThanOrEqual(3);
  });
});

describe('ENTITY_TABLES', () => {
  it('contains common entity names', () => {
    expect(ENTITY_TABLES).toContain('courses');
    expect(ENTITY_TABLES).toContain('tasks');
    expect(ENTITY_TABLES).toContain('notes');
    expect(ENTITY_TABLES).toContain('profile');
  });
});
