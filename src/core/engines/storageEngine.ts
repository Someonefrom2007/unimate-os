/**
 * StorageEngine — pure domain utilities to inspect IndexedDB and
 * localStorage sizes, item counts, and memory footprints per entity type.
 */

export interface StorageMetric {
  entity: string;
  key: string;
  itemCount: number;
  bytesApprox: number;
  kbApprox: number;
}

export interface StorageReport {
  localStorage: StorageMetric[];
  totalLocalBytes: number;
  totalLocalKb: number;
  totalItems: number;
  quotaUsed: number; // percentage
  quotaBytes: number;
}

const ENTITY_KEYS: { entity: string; pattern: string }[] = [
  { entity: 'Courses', pattern: 'courses' },
  { entity: 'Tasks', pattern: 'tasks' },
  { entity: 'Exams', pattern: 'assessments' },
  { entity: 'Notes', pattern: 'notes' },
  { entity: 'Resources', pattern: 'resources' },
  { entity: 'Schedule', pattern: 'schedule_entries' },
  { entity: 'Grades', pattern: 'grade_entries' },
  { entity: 'Habits', pattern: 'habits' },
  { entity: 'Goals', pattern: 'goals' },
  { entity: 'Focus Sessions', pattern: 'focus_sessions' },
  { entity: 'Settings', pattern: 'unimate.' },
  { entity: 'Notifications', pattern: 'notifications' },
];

/** Estimate bytes of a string. */
function byteSize(s: string): number {
  return new TextEncoder().encode(s).byteLength;
}

/** Measure a single localStorage entry. */
function measureEntry(key: string): number {
  try {
    return byteSize(localStorage.getItem(key) || '');
  } catch {
    return 0;
  }
}

/** Build storage metrics for all entity groups. */
export function computeStorageMetrics(): StorageMetric[] {
  return ENTITY_KEYS.map(({ entity, pattern }) => {
    let itemCount = 0;
    let bytesApprox = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes(pattern)) {
        itemCount++;
        bytesApprox += byteSize(k);
        bytesApprox += measureEntry(k);
      }
    }
    return { entity, key: pattern, itemCount, bytesApprox, kbApprox: Math.round(bytesApprox / 1024 * 10) / 10 };
  });
}

/** Estimate browser quota usage. */
async function estimateQuota(): Promise<{ usage: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage || 0, quota: est.quota || 5 * 1024 * 1024 * 1024 };
  }
  return { usage: 0, quota: 5 * 1024 * 1024 * 1024 };
}

/** Full storage report. */
export async function computeStorageReport(): Promise<StorageReport> {
  const localStorage_ = computeStorageMetrics();
  const totalLocalBytes = localStorage_.reduce((s, m) => s + m.bytesApprox, 0);
  const totalItems = localStorage_.reduce((s, m) => s + m.itemCount, 0);
  const { usage, quota } = await estimateQuota();
  return {
    localStorage: localStorage_,
    totalLocalBytes,
    totalLocalKb: Math.round(totalLocalBytes / 1024 * 10) / 10,
    totalItems,
    quotaUsed: quota > 0 ? Math.round(usage / quota * 10000) / 100 : 0,
    quotaBytes: quota,
  };
}

/** Clear cache keys (settings, themes, rollback, migration) but keep entity data. */
export function clearCacheKeys(): number {
  let cleared = 0;
  const preservePrefixes = ['unimate.rollback.', 'unimate.migration.'];
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && !preservePrefixes.some((p) => k.startsWith(p))) {
      // Keep entity data, clear settings-like caches
      if (k.includes('.cache') || k.includes('.temp') || k.includes('_version')) {
        keysToRemove.push(k);
      }
    }
  }
  for (const k of keysToRemove) {
    localStorage.removeItem(k);
    cleared++;
  }
  return cleared;
}

/** Clear ALL localStorage. */
export function clearAllStorage(): void {
  localStorage.clear();
}

/** Get a human-readable summary. */
export function formatStorageSummary(report: StorageReport): string {
  return [
    `Total: ${report.totalLocalKb} KB (${report.totalItems} items)`,
    `Quota: ${report.quotaUsed}% used`,
    ...report.localStorage.filter((m) => m.itemCount > 0).map((m) => `  ${m.entity}: ${m.itemCount} items, ${m.kbApprox} KB`),
  ].join('\n');
}
