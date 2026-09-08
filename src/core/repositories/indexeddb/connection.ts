/**
 * Single shared IndexedDB connection for the whole app.
 * Opening one connection avoids upgrade/transaction conflicts.
 */
import { DB_NAME, DB_VERSION, migrateSchema } from './schema';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(dbName: string = DB_NAME, version: number = DB_VERSION): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onupgradeneeded = () => {
        const db = request.result;
        migrateSchema(db);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`Database upgrade blocked for ${dbName}. Close other tabs.`));
    });
  }
  return dbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

export async function deleteDatabase(dbName: string = DB_NAME): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(); // never block in tests after close
  });
}