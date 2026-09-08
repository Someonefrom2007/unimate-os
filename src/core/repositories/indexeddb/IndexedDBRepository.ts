/**
 * Generic IndexedDB-backed repository implementing IRepository<T>.
 * Storage details stay here; entity-specific repositories only add filters.
 */
import type { IRepository } from '../interfaces';

type IDBValidKeyPath = string | string[];

export interface IdbQueryOptions {
  index?: string;
  range?: IDBKeyRange | string | number | null;
  direction?: IDBCursorDirection;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Sorts by `sortOrder` if present else stable by id. */
function bySortOrder<T extends { id: string }>(a: T, b: T): number {
  const sa = (a as Record<string, unknown>).sortOrder as number | undefined;
  const sb = (b as Record<string, unknown>).sortOrder as number | undefined;
  if (typeof sa === 'number' && typeof sb === 'number' && sa !== sb) return sa - sb;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export class IndexedDBRepository<T extends { id: string }> implements IRepository<T> {
  protected dbPromise: Promise<IDBDatabase>;
  protected readonly storeName: string;
  protected readonly keyPath: IDBValidKeyPath;

  constructor(dbPromise: Promise<IDBDatabase>, storeName: string, keyPath: IDBValidKeyPath = 'id') {
    this.dbPromise = dbPromise;
    this.storeName = storeName;
    this.keyPath = keyPath;
  }

  protected async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  /** Read everything in the store (optionally via an index range). */
  protected async getAll(query: IdbQueryOptions = {}): Promise<T[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const source = query.index ? store.index(query.index) : store;
    const req = query.index
      ? source.getAll(query.range ?? null, undefined)
      : source.getAll(query.range ?? null, undefined);
    const rows = await requestToPromise(req as IDBRequest<T[]>);
    return rows.sort(bySortOrder);
  }

  async list(): Promise<T[]> {
    return this.getAll();
  }

  async get(id: string): Promise<T | null> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readonly');
    const req = tx.objectStore(this.storeName).get(id) as IDBRequest<T | undefined>;
    return (await requestToPromise(req)) ?? null;
  }

  async save(record: T): Promise<T> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).put(record);
    await txDone(tx);
    return record;
  }

  async saveMany(records: T[]): Promise<T[]> {
    if (records.length === 0) return [];
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    for (const record of records) store.put(record);
    await txDone(tx);
    return records;
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    store.delete(id);
    await txDone(tx);
    return true;
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).clear();
    await txDone(tx);
  }

  /** Query by an index key value. */
  protected async getByIndex(index: string, value: unknown): Promise<T[]> {
    return this.getAll({ index, range: value as string | number });
  }
}