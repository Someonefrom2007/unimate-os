/**
 * DiagnosticsEngine — self-testing diagnostic engine that checks store
 * integrity, orphan detection, and storage availability.
 * Generates a comprehensive System Health Report.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface HealthReport {
  timestamp: string;
  overallStatus: CheckStatus;
  checks: HealthCheck[];
  orphanCount: number;
  storageAvailable: boolean;
  entityCounts: Record<string, number>;
  recommendations: string[];
}

// ─── individual checks ───────────────────────────────────────────────

function checkStorageAvailable(): HealthCheck {
  try {
    localStorage.setItem('_diagnostic_test', '1');
    localStorage.removeItem('_diagnostic_test');
    return { name: 'LocalStorage Available', status: 'pass', detail: 'Read/write access confirmed.' };
  } catch {
    return { name: 'LocalStorage Available', status: 'fail', detail: 'localStorage is not accessible.' };
  }
}

function checkStorageQuota(): HealthCheck {
  const totalKeys = localStorage.length;
  if (totalKeys > 4000) {
    return { name: 'Storage Quota', status: 'warn', detail: `${totalKeys} keys stored — consider pruning.` };
  }
  return { name: 'Storage Quota', status: 'pass', detail: `${totalKeys} keys stored.` };
}

function checkSchemaVersion(): HealthCheck {
  try {
    const v = parseInt(localStorage.getItem('unimate.schemaVersion') || '1', 10);
    return { name: 'Schema Version', status: 'pass', detail: `Version ${v}.` };
  } catch {
    return { name: 'Schema Version', status: 'warn', detail: 'Could not read schema version.' };
  }
}

/** Detect orphan tasks (task.courseCode not matching any course.code). */
function checkOrphanTasks(): HealthCheck {
  try {
    const coursesRaw = localStorage.getItem('courses');
    const tasksRaw = localStorage.getItem('tasks');
    const courses: { code?: string }[] = coursesRaw ? JSON.parse(coursesRaw) : [];
    const tasks: { courseCode?: string }[] = tasksRaw ? JSON.parse(tasksRaw) : [];
    const courseCodes = new Set(courses.map((c) => c.code).filter(Boolean));
    const orphans = tasks.filter((t) => t.courseCode && !courseCodes.has(t.courseCode));
    if (orphans.length > 0) {
      return { name: 'Orphan Tasks', status: 'warn', detail: `${orphans.length} task(s) reference non-existent courses.` };
    }
    return { name: 'Orphan Tasks', status: 'pass', detail: 'No orphan tasks found.' };
  } catch {
    return { name: 'Orphan Tasks', status: 'pass', detail: 'Could not check (data not loaded).' };
  }
}

/** Check for grade entries pointing to missing courses. */
function checkOrphanGrades(): HealthCheck {
  try {
    const coursesRaw = localStorage.getItem('courses');
    const gradesRaw = localStorage.getItem('grade_entries');
    const courses: { code?: string }[] = coursesRaw ? JSON.parse(coursesRaw) : [];
    const grades: { courseCode?: string }[] = gradesRaw ? JSON.parse(gradesRaw) : [];
    const courseCodes = new Set(courses.map((c) => c.code).filter(Boolean));
    const orphans = grades.filter((g) => g.courseCode && !courseCodes.has(g.courseCode));
    if (orphans.length > 0) {
      return { name: 'Orphan Grades', status: 'warn', detail: `${orphans.length} grade(s) reference non-existent courses.` };
    }
    return { name: 'Orphan Grades', status: 'pass', detail: 'No orphan grades found.' };
  } catch {
    return { name: 'Orphan Grades', status: 'pass', detail: 'Could not check.' };
  }
}

// ─── entity counting ─────────────────────────────────────────────────

const ENTITY_TABLES: Record<string, string> = {
  courses: 'Courses',
  tasks: 'Tasks',
  assessments: 'Exams',
  notes: 'Notes',
  resources: 'Resources',
  schedule_entries: 'Schedule',
  grade_entries: 'Grades',
  habits: 'Habits',
  goals: 'Goals',
  focus_sessions: 'Focus Sessions',
};

function countEntities(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, label] of Object.entries(ENTITY_TABLES)) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      counts[label] = Array.isArray(arr) ? arr.length : 0;
    } catch {
      counts[label] = 0;
    }
  }
  return counts;
}

// ─── auto-repair ─────────────────────────────────────────────────────

export interface RepairResult {
  orphansRemoved: number;
  details: string[];
}

/** Remove orphan tasks whose courseCode doesn't match any existing course. */
export function repairOrphanTasks(): RepairResult {
  const details: string[] = [];
  let orphansRemoved = 0;
  try {
    const coursesRaw = localStorage.getItem('courses');
    const tasksRaw = localStorage.getItem('tasks');
    const courses: { code?: string }[] = coursesRaw ? JSON.parse(coursesRaw) : [];
    const tasks: { courseCode?: string }[] = tasksRaw ? JSON.parse(tasksRaw) : [];
    const courseCodes = new Set(courses.map((c) => c.code).filter(Boolean));
    const cleaned = tasks.filter((t) => {
      if (t.courseCode && !courseCodes.has(t.courseCode)) {
        orphansRemoved++;
        details.push(`Removed orphan task: "${(t as Record<string, unknown>).title}" (course: ${t.courseCode})`);
        return false;
      }
      return true;
    });
    if (orphansRemoved > 0) {
      localStorage.setItem('tasks', JSON.stringify(cleaned));
    }
  } catch (e) {
    details.push(`Repair failed: ${e}`);
  }
  return { orphansRemoved, details };
}

/** Remove orphan grade entries. */
export function repairOrphanGrades(): RepairResult {
  const details: string[] = [];
  let orphansRemoved = 0;
  try {
    const coursesRaw = localStorage.getItem('courses');
    const gradesRaw = localStorage.getItem('grade_entries');
    const courses: { code?: string }[] = coursesRaw ? JSON.parse(coursesRaw) : [];
    const grades: { courseCode?: string }[] = gradesRaw ? JSON.parse(gradesRaw) : [];
    const courseCodes = new Set(courses.map((c) => c.code).filter(Boolean));
    const cleaned = grades.filter((g) => {
      if (g.courseCode && !courseCodes.has(g.courseCode)) {
        orphansRemoved++;
        details.push(`Removed orphan grade: course ${g.courseCode}`);
        return false;
      }
      return true;
    });
    if (orphansRemoved > 0) {
      localStorage.setItem('grade_entries', JSON.stringify(cleaned));
    }
  } catch (e) {
    details.push(`Repair failed: ${e}`);
  }
  return { orphansRemoved, details };
}

/** Run all repairs. */
export function runRepairs(): RepairResult {
  const t = repairOrphanTasks();
  const g = repairOrphanGrades();
  return {
    orphansRemoved: t.orphansRemoved + g.orphansRemoved,
    details: [...t.details, ...g.details],
  };
}

// ─── full health report ──────────────────────────────────────────────

export function generateHealthReport(): HealthReport {
  const checks: HealthCheck[] = [
    checkStorageAvailable(),
    checkStorageQuota(),
    checkSchemaVersion(),
    checkOrphanTasks(),
    checkOrphanGrades(),
  ];

  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');
  const overallStatus: CheckStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';

  const orphanCount = checks.filter((c) => c.name.includes('Orphan') && c.status === 'warn').length;

  const recommendations: string[] = [];
  if (hasWarn) recommendations.push('Review warnings below and consider running auto-repair.');
  if (localStorage.length > 3000) recommendations.push('Storage is getting large — prune old backups and rollback snapshots.');

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    orphanCount,
    storageAvailable: checks[0].status === 'pass',
    entityCounts: countEntities(),
    recommendations,
  };
}
