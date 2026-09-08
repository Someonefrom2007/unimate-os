/**
 * IndexedDB schema migration engine.
 *
 * Owns the object-store layout, index registrations and upgrade paths.
 * Version bumps are additive and idempotent so refreshes never destroy data.
 */
import { STORE_NAMES } from '../types';

export const DB_NAME = 'unimate-db';
export const DB_VERSION = 2;

export interface StoreIndex {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}

export interface StoreDefinition {
  name: string;
  keyPath: string;
  indexes: StoreIndex[];
}

const byCourseIndex: StoreIndex = { name: 'by-course', keyPath: 'courseId' };
const byCourseCodeIndex: StoreIndex = { name: 'by-course-code', keyPath: 'courseCode' };
const bySemesterIndex: StoreIndex = { name: 'by-semester', keyPath: 'semesterId' };
const byPriorityIndex: StoreIndex = { name: 'by-priority', keyPath: 'priority' };
const byStatusIndex: StoreIndex = { name: 'by-status', keyPath: 'status' };
const byDateIndex: StoreIndex = { name: 'by-date', keyPath: 'dateLabel' };
const byDayIndex: StoreIndex = { name: 'by-day', keyPath: 'dayOfWeek' };
const byTypeIndex: StoreIndex = { name: 'by-type', keyPath: 'type' };
const byFavoriteIndex: StoreIndex = { name: 'by-favorite', keyPath: 'favorite' };
const sortIndex: StoreIndex = { name: 'by-sort', keyPath: 'sortOrder' };

/** All object stores + their searchable indexes. */
export const STORE_DEFINITIONS: Record<string, StoreDefinition> = {
  [STORE_NAMES.profile]: { name: STORE_NAMES.profile, keyPath: 'id', indexes: [] },
  [STORE_NAMES.course]: {
    name: STORE_NAMES.course,
    keyPath: 'id',
    indexes: [bySemesterIndex, sortIndex],
  },
  [STORE_NAMES.task]: {
    name: STORE_NAMES.task,
    keyPath: 'id',
    indexes: [byCourseIndex, byPriorityIndex, byStatusIndex, byDateIndex, sortIndex],
  },
  [STORE_NAMES.exam]: {
    name: STORE_NAMES.exam,
    keyPath: 'id',
    indexes: [byCourseIndex, byTypeIndex, byDateIndex, sortIndex],
  },
  [STORE_NAMES.grade]: {
    name: STORE_NAMES.grade,
    keyPath: 'id',
    indexes: [byCourseIndex, byCourseCodeIndex, byDateIndex, sortIndex],
  },
  [STORE_NAMES.schedule]: {
    name: STORE_NAMES.schedule,
    keyPath: 'id',
    indexes: [byCourseIndex, byDayIndex, sortIndex],
  },
  [STORE_NAMES.note]: { name: STORE_NAMES.note, keyPath: 'id', indexes: [sortIndex] },
  [STORE_NAMES.resource]: {
    name: STORE_NAMES.resource,
    keyPath: 'id',
    indexes: [byCourseCodeIndex, byTypeIndex, byFavoriteIndex, sortIndex],
  },
  [STORE_NAMES.focus]: {
    name: STORE_NAMES.focus,
    keyPath: 'id',
    indexes: [byCourseCodeIndex, byDateIndex, sortIndex],
  },
  [STORE_NAMES.goal]: {
    name: STORE_NAMES.goal,
    keyPath: 'id',
    indexes: [byStatusIndex, sortIndex],
  },
  [STORE_NAMES.habit]: { name: STORE_NAMES.habit, keyPath: 'id', indexes: [sortIndex] },
  [STORE_NAMES.settings]: { name: STORE_NAMES.settings, keyPath: 'id', indexes: [] },
};

export const STORE_KEYS = Object.keys(STORE_DEFINITIONS);

const META_STORE = '__unimate_meta';

/** Bootstrap tokens stored in the special meta store. */
export interface MigrationMeta {
  version: number;
  migratedAt: string;
}

function createStore(db: IDBDatabase, def: StoreDefinition): void {
  if (db.objectStoreNames.contains(def.name)) return;
  const store = db.createObjectStore(def.name, { keyPath: def.keyPath });
  for (const index of def.indexes) {
    if (!store.indexNames.contains(index.name)) {
      store.createIndex(index.name, index.keyPath, index.options);
    }
  }
}

/**
 * Idempotent migration applied inside `onupgradeneeded`.
 * v1 creates every store required by the app + the meta store.
 * Future versions (v2+) only add stores/indexes that do not exist yet.
 */
export function migrateSchema(db: IDBDatabase): void {
  // Always materialize the full desired schema. Missing stores are created,
  // existing ones are left untouched (additive, data-safe).
  for (const def of Object.values(STORE_DEFINITIONS)) {
    createStore(db, def);
  }
  if (!db.objectStoreNames.contains(META_STORE)) {
    db.createObjectStore(META_STORE, { keyPath: 'key' });
  }
}

/** Returns the persisted migration version from the meta store. */
export async function readMigrationMeta(db: IDBDatabase): Promise<MigrationMeta | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get('migration') as IDBRequest<MigrationMeta | undefined>;
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Persists a migration version marker after a successful upgrade. */
export async function writeMigrationMeta(db: IDBDatabase, version: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key: 'migration', version, migratedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}