/**
 * MigrationEngine unit tests — version management, migration execution, rollback.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  getSchemaVersion,
  setSchemaVersion,
  CURRENT_SCHEMA_VERSION,
  MIGRATIONS,
  runMigrations,
  needsMigration,
  rollbackMigration,
} from './migrationEngine';

describe('schema version', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('defaults to 1 when not set', () => {
    expect(getSchemaVersion()).toBe(1);
  });

  it('persists version', () => {
    setSchemaVersion(5);
    expect(getSchemaVersion()).toBe(5);
  });
});

describe('needsMigration', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('returns true when version < CURRENT', () => {
    setSchemaVersion(1);
    expect(needsMigration()).toBe(true);
  });

  it('returns false when version >= CURRENT', () => {
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
    expect(needsMigration()).toBe(false);
  });
});

describe('MIGRATIONS', () => {
  it('is sorted by fromVersion ascending', () => {
    for (let i = 1; i < MIGRATIONS.length; i++) {
      expect(MIGRATIONS[i].fromVersion).toBeGreaterThanOrEqual(MIGRATIONS[i - 1].fromVersion);
    }
  });

  it('each migration has fromVersion < toVersion', () => {
    for (const m of MIGRATIONS) {
      expect(m.fromVersion).toBeLessThan(m.toVersion);
    }
  });
});

describe('runMigrations', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('returns ok with no migrations when already at current version', () => {
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
    const r = runMigrations();
    expect(r.ok).toBe(true);
    expect(r.applied).toHaveLength(0);
  });

  it('runs pending migrations starting from version 1', () => {
    setSchemaVersion(1);
    const r = runMigrations();
    expect(r.ok).toBe(true);
    expect(r.applied.length).toBeGreaterThan(0);
    expect(getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('applies v1→v2 migration to course data', () => {
    setSchemaVersion(1);
    // Seed v1-style course data (no accent)
    localStorage.setItem('courses', JSON.stringify([{ id: 'c1', name: 'Test' }]));
    const r = runMigrations();
    expect(r.ok).toBe(true);
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    expect(courses[0].accent).toBe('primary');
  });
});

describe('rollbackMigration', () => {
  beforeEach(() => { installLocalStorageMock(); localStorage.clear(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('returns false for non-existent key', () => {
    expect(rollbackMigration('nonexistent')).toBe(false);
  });
});
