/**
 * Repository factory — the single entry point for obtaining a fresh
 * IndexedDB-backed repository set. Swapping to Supabase / REST means
 * implementing the same `RepositorySet` interface elsewhere.
 */
import { closeDatabase, openDatabase } from './connection';
import type { RepositorySet } from '../interfaces';
import { IndexedDBCourseRepository } from './CourseRepository';
import { IndexedDBExamRepository } from './ExamRepository';
import { IndexedDBFocusRepository } from './FocusRepository';
import { IndexedDBGoalRepository } from './GoalRepository';
import { IndexedDBGradeRepository } from './GradeRepository';
import { IndexedDBHabitRepository } from './HabitRepository';
import { IndexedDBNoteRepository } from './NoteRepository';
import { IndexedDBProfileRepository } from './ProfileRepository';
import { IndexedDBResourceRepository } from './ResourceRepository';
import { IndexedDBScheduleRepository } from './ScheduleRepository';
import { IndexedDBSettingsRepository } from './SettingsRepository';
import { IndexedDBTaskRepository } from './TaskRepository';

export interface IndexedDbRepositorySet extends RepositorySet {
  /** Releases the shared connection. */
  destroy(): Promise<void>;
}

export type { RepositorySet } from '../interfaces';
export { IndexedDBRepository } from './IndexedDBRepository';
export { IndexedDBCourseRepository } from './CourseRepository';
export { IndexedDBExamRepository } from './ExamRepository';
export { IndexedDBFocusRepository } from './FocusRepository';
export { IndexedDBGoalRepository } from './GoalRepository';
export { IndexedDBGradeRepository } from './GradeRepository';
export { IndexedDBHabitRepository } from './HabitRepository';
export { IndexedDBNoteRepository } from './NoteRepository';
export { IndexedDBProfileRepository } from './ProfileRepository';
export { IndexedDBResourceRepository } from './ResourceRepository';
export { IndexedDBScheduleRepository } from './ScheduleRepository';
export { IndexedDBSettingsRepository } from './SettingsRepository';
export { IndexedDBTaskRepository } from './TaskRepository';
export { openDatabase, closeDatabase, deleteDatabase } from './connection';
export {
  DB_NAME,
  DB_VERSION,
  STORE_DEFINITIONS,
  STORE_KEYS,
  migrateSchema,
  readMigrationMeta,
  writeMigrationMeta,
} from './schema';
export { STORE_NAMES, type StoreName } from '../types';

/**
 * Builds the concrete IndexedDB repositories over one shared connection.
 * Call once at app bootstrap; pass the RepositorySet into stores.
 */
export async function createIndexedDbRepositories(): Promise<IndexedDbRepositorySet> {
  const dbPromise = openDatabase();

  const repositories = {
    profile: new IndexedDBProfileRepository(dbPromise),
    course: new IndexedDBCourseRepository(dbPromise),
    task: new IndexedDBTaskRepository(dbPromise),
    exam: new IndexedDBExamRepository(dbPromise),
    grade: new IndexedDBGradeRepository(dbPromise),
    schedule: new IndexedDBScheduleRepository(dbPromise),
    note: new IndexedDBNoteRepository(dbPromise),
    resource: new IndexedDBResourceRepository(dbPromise),
    focus: new IndexedDBFocusRepository(dbPromise),
    goal: new IndexedDBGoalRepository(dbPromise),
    habit: new IndexedDBHabitRepository(dbPromise),
    settings: new IndexedDBSettingsRepository(dbPromise),
  };

  // Ensure the DB is connected before handing back (fails fast on upgrade issues).
  await dbPromise;

  return {
    ...repositories,
    async destroy() {
      await closeDatabase();
    },
  };
}