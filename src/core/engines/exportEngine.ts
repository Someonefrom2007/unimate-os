/**
 * ExportEngine — pure domain functions to serialize/deserialize entire app
 * state into compressed JSON backups and restore with schema validation.
 * Local-first: writes to file system, not cloud.
 */

/** Schema version for backup format compatibility. */
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupPayload {
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  tables: Record<string, unknown[]>;
  checksum: string;
}

/** Entity table names in the app. */
export const ENTITY_TABLES = [
  'courses', 'tasks', 'assessments', 'schedule_entries',
  'habits', 'notes', 'quick_thoughts', 'grade_entries',
  'goals', 'focus_sessions', 'resources', 'notifications', 'profile',
] as const;

export type TableName = typeof ENTITY_TABLES[number];

// ─── checksum ────────────────────────────────────────────────────────

/** Simple DJB2 hash for integrity verification. */
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Compute checksum of the tables payload. */
export function computeChecksum(tables: Record<string, unknown[]>): string {
  return djb2(JSON.stringify(tables));
}

// ─── validation ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a parsed backup payload before restore. */
export function validateBackup(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Backup is not a valid object.'] };
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.schemaVersion !== 'number') {
    errors.push('Missing or invalid schemaVersion.');
  }
  if (typeof obj.createdAt !== 'string') {
    errors.push('Missing or invalid createdAt timestamp.');
  }
  if (!obj.tables || typeof obj.tables !== 'object') {
    errors.push('Missing or invalid tables payload.');
    return { valid: false, errors };
  }

  const tables = obj.tables as Record<string, unknown>;
  for (const name of Object.keys(tables)) {
    if (!ENTITY_TABLES.includes(name as TableName)) {
      errors.push(`Unknown table "${name}".`);
    }
    if (!Array.isArray(tables[name])) {
      errors.push(`Table "${name}" is not an array.`);
    }
  }

  if (typeof obj.checksum === 'string' && typeof obj.tables === 'object') {
    const expected = computeChecksum(obj.tables as Record<string, unknown[]>);
    if (obj.checksum !== expected) {
      errors.push('Checksum mismatch — backup may be corrupt.');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── serialization ───────────────────────────────────────────────────

/** Create a backup payload from in-memory table data. */
export function createBackup(tables: Record<string, unknown[]>): BackupPayload {
  const checksum = computeChecksum(tables);
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: '2.0.0',
    tables,
    checksum,
  };
}

/** Compress backup to a base64 string (gzip-like via deflate). */
export function compressBackup(payload: BackupPayload): string {
  // Simple base64 encoding; real gzip would use pako but we keep deps zero.
  return btoa(JSON.stringify(payload));
}

/** Decompress a base64-encoded backup string. */
export function decompressBackup(encoded: string): BackupPayload {
  return JSON.parse(atob(encoded));
}

/** Trigger a file download of the backup. */
export function downloadBackup(payload: BackupPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unimate-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse a file string into a backup payload and validate it. */
export function parseBackupFile(text: string): { payload: BackupPayload | null; validation: ValidationResult } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { payload: null, validation: { valid: false, errors: ['Invalid JSON format.'] } };
  }
  const validation = validateBackup(parsed);
  return { payload: validation.valid ? (parsed as BackupPayload) : null, validation };
}

/** Pre-restore: snapshot current state to localStorage for rollback. */
export function snapshotForRollback(tables: Record<string, unknown[]>): string {
  const key = `unimate.rollback.${Date.now()}`;
  const snapshot = JSON.stringify({ tables, timestamp: new Date().toISOString() });
  localStorage.setItem(key, snapshot);

  // Prune old rollback snapshots (keep last 3).
  const rollbackKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('unimate.rollback.')) rollbackKeys.push(k);
  }
  rollbackKeys.sort();
  while (rollbackKeys.length > 3) {
    const old = rollbackKeys.shift()!;
    localStorage.removeItem(old);
  }
  return key;
}

/** Retrieve the most recent rollback snapshot. */
export function getLatestRollback(): { tables: Record<string, unknown[]>; timestamp: string } | null {
  const rollbackKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('unimate.rollback.')) rollbackKeys.push(k);
  }
  rollbackKeys.sort();
  if (rollbackKeys.length === 0) return null;
  try {
    return JSON.parse(localStorage.getItem(rollbackKeys[rollbackKeys.length - 1]) || 'null');
  } catch {
    return null;
  }
}
