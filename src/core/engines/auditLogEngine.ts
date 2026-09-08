/**
 * AuditLogEngine — internal action-logging engine that records system
 * events with high-resolution timestamps. Pure domain logic; persists
 * to localStorage (local-first).
 */

export type AuditDomain = 'grade' | 'task' | 'focus' | 'schedule' | 'course' | 'exam' | 'habit' | 'goal' | 'note' | 'resource' | 'settings' | 'migration' | 'backup' | 'system';

export interface AuditEntry {
  id: string;
  timestamp: number; // ms since epoch
  domain: AuditDomain;
  action: string;
  detail: string;
  meta?: Record<string, unknown>;
}

export interface AuditQuery {
  domain?: AuditDomain;
  from?: number; // timestamp ms
  to?: number;
  limit?: number;
}

const STORAGE_KEY = 'unimate.auditLog';
const MAX_ENTRIES = 5000;
const DEFAULT_RETENTION_DAYS = 30;

// ─── persistence ─────────────────────────────────────────────────────

function loadLog(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLog(entries: AuditEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── public API ──────────────────────────────────────────────────────

/** Append an audit entry. */
export function logEvent(domain: AuditDomain, action: string, detail: string, meta?: Record<string, unknown>): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    domain,
    action,
    detail,
    meta,
  };
  const log = loadLog();
  log.push(entry);

  // Prune if over limit
  while (log.length > MAX_ENTRIES) log.shift();

  saveLog(log);
  return entry;
}

/** Query the audit log with filters. */
export function queryLog(query: AuditQuery = {}): AuditEntry[] {
  let log = loadLog();

  if (query.domain) {
    log = log.filter((e) => e.domain === query.domain);
  }
  if (query.from !== undefined) {
    log = log.filter((e) => e.timestamp >= query.from!);
  }
  if (query.to !== undefined) {
    log = log.filter((e) => e.timestamp <= query.to!);
  }

  // Sort newest first
  log.sort((a, b) => b.timestamp - a.timestamp);

  if (query.limit && query.limit > 0) {
    log = log.slice(0, query.limit);
  }

  return log;
}

/** Prune entries older than N days. */
export function pruneOldLogs(retentionDays: number = DEFAULT_RETENTION_DAYS): number {
  const cutoff = Date.now() - retentionDays * 86400000;
  const log = loadLog();
  const before = log.length;
  const pruned = log.filter((e) => e.timestamp >= cutoff);
  saveLog(pruned);
  return before - pruned.length;
}

/** Get total count. */
export function logCount(): number {
  return loadLog().length;
}

/** Clear all logs. */
export function clearLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Get recent entries for a domain. */
export function recentByDomain(domain: AuditDomain, limit: number = 10): AuditEntry[] {
  return queryLog({ domain, limit });
}
