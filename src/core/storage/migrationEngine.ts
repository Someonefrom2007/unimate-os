/**
 * MigrationEngine — version-gated database migration system to safely
 * upgrade state schemas when app data models evolve.
 * Local-first: all state changes commit to IndexedDB/localStorage first.
 */

/** Current schema version. Bump when breaking changes occur. */
export const CURRENT_SCHEMA_VERSION = 2;

const VERSION_KEY = 'unimate.schemaVersion';

export interface Migration {
  fromVersion: number;
  toVersion: number;
  label: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

export interface MigrationResult {
  ok: boolean;
  fromVersion: number;
  toVersion: number;
  applied: string[];
  errors: string[];
  rollbackKey: string | null;
}

// ─── version management ──────────────────────────────────────────────

/** Get the stored schema version (defaults to 1 for first-run). */
export function getSchemaVersion(): number {
  try {
    return parseInt(localStorage.getItem(VERSION_KEY) || '1', 10);
  } catch {
    return 1;
  }
}

/** Set the schema version. */
export function setSchemaVersion(v: number): void {
  localStorage.setItem(VERSION_KEY, String(v));
}

// ─── migration registry ──────────────────────────────────────────────

/**
 * Registered migrations. Add new ones at the bottom; never reorder.
 */
export const MIGRATIONS: Migration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    label: 'v1→v2: Add accent field to courses, normalize grade weights',
    migrate(data) {
      // Add accent field to courses that lack it
      if (Array.isArray(data.courses)) {
        data.courses = data.courses.map((c: Record<string, unknown>) => ({
          ...c,
          accent: c.accent || 'primary',
        }));
      }
      // Normalize grade maxGrade to 10 if missing
      if (Array.isArray(data.grade_entries)) {
        data.grade_entries = data.grade_entries.map((g: Record<string, unknown>) => ({
          ...g,
          maxGrade: g.maxGrade ?? g.max_grade ?? 10,
        }));
      }
      return data;
    },
  },
  // Future: { fromVersion: 2, toVersion: 3, label: '...', migrate(data) { ... } }
];

// ─── core migration logic ────────────────────────────────────────────

/** Pre-migration: snapshot for rollback. */
function snapshotPreMigration(label: string): string {
  const key = `unimate.migration.rollback.${Date.now()}`;
  try {
    const snapshot: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('unimate.') || k === VERSION_KEY)) {
        snapshot[k] = localStorage.getItem(k);
      }
    }
    snapshot._migrationLabel = label;
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch { /* best effort */ }
  return key;
}

/** Rollback from a snapshot key. */
export function rollbackMigration(rollbackKey: string): boolean {
  try {
    const raw = localStorage.getItem(rollbackKey);
    if (!raw) return false;
    const snapshot = JSON.parse(raw);
    // Restore only unimate.* keys
    for (const [k, v] of Object.entries(snapshot)) {
      if (k.startsWith('unimate.') || k === VERSION_KEY) {
        localStorage.setItem(k, v as string);
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Run all pending migrations in order. */
export function runMigrations(): MigrationResult {
  let currentVersion = getSchemaVersion();
  const applied: string[] = [];
  const errors: string[] = [];
  let rollbackKey: string | null = null;

  const pending = MIGRATIONS.filter((m) => m.fromVersion >= currentVersion && m.toVersion > currentVersion);

  if (pending.length === 0) {
    return { ok: true, fromVersion: currentVersion, toVersion: currentVersion, applied: [], errors: [], rollbackKey: null };
  }

  // Snapshot before first migration
  rollbackKey = snapshotPreMigration(pending[0].label);

  // Build a mutable data object from all localStorage keys
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) {
      try {
        data[k] = JSON.parse(localStorage.getItem(k) || 'null');
      } catch {
        data[k] = localStorage.getItem(k);
      }
    }
  }

  for (const migration of pending) {
    if (migration.fromVersion !== currentVersion) {
      errors.push(`Skipped migration v${migration.fromVersion}→v${migration.toVersion}: expected v${currentVersion}.`);
      continue;
    }
    try {
      const result = migration.migrate(data);
      Object.assign(data, result);
      currentVersion = migration.toVersion;
      applied.push(migration.label);
    } catch (e) {
      errors.push(`Migration v${migration.fromVersion}→v${migration.toVersion} failed: ${e}`);
      // Attempt rollback
      if (rollbackKey) rollbackMigration(rollbackKey);
      return { ok: false, fromVersion: migration.fromVersion, toVersion: currentVersion, applied, errors, rollbackKey };
    }
  }

  // Persist migrated data back to localStorage
  try {
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    setSchemaVersion(currentVersion);
  } catch (e) {
    errors.push(`Persist failed after migration: ${e}`);
    if (rollbackKey) rollbackMigration(rollbackKey);
    return { ok: false, fromVersion: currentVersion, toVersion: currentVersion, applied, errors, rollbackKey };
  }

  return { ok: errors.length === 0, fromVersion: getSchemaVersion(), toVersion: currentVersion, applied, errors, rollbackKey };
}

/** Check if migrations are needed. */
export function needsMigration(): boolean {
  return getSchemaVersion() < CURRENT_SCHEMA_VERSION;
}
