/**
 * Generic async collection store factory.
 * Produces a Zustand store bound to one entity repository while keeping
 * loading / error / initialized / empty semantics explicit.
 */
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { IRepository } from '../repositories/interfaces';
import { initialAsyncState, type AsyncState } from './types';

export interface AsyncStore<T extends { id: string; sortOrder: number }> extends AsyncState<T> {
  /** Loads all records (idempotent; skips reload while loading). */
  load(): Promise<void>;
  /** Inserts/updates one record through the repository then refreshes state. */
  upsert(record: T): Promise<T>;
  /** Bulk insert through the repository. */
  upsertMany(records: T[]): Promise<T[]>;
  /** Removes a record; returns false if the row did not exist. */
  remove(id: string): Promise<boolean>;
  /** Clears the entity store. */
  reset(): Promise<void>;
}

/**
 * Builds a Zustand store for an entity given its repository.
 * State mutations happen ONLY after the repository resolves, so the store
 * always mirrors durable storage (no optimistic divergence).
 */
export function createAsyncStore<T extends { id: string; sortOrder: number }>(
  _label: string,
  repository: () => IRepository<T>,
): UseBoundStore<StoreApi<AsyncStore<T>>> {
  return create<AsyncStore<T>>()((set, get) => ({
    ...initialAsyncState<T>(),

    async load() {
      const { loading } = get();
      if (loading) return;
      set({ loading: true, error: null });
      try {
        const data = await repository().list();
        set({ data, loading: false, initialized: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, initialized: true });
      }
    },

    async upsert(record) {
      try {
        const saved = await repository().save(record);
        const current = get().data;
        const exists = current.some((r) => r.id === record.id);
        set({
          data: exists
            ? current.map((r) => (r.id === record.id ? saved : r))
            : [...current, saved].sort((a, b) => a.sortOrder - b.sortOrder),
          error: null,
        });
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message });
        throw error;
      }
    },

    async upsertMany(records) {
      try {
        const saved = await repository().saveMany(records);
        const ids = new Set(saved.map((r) => r.id));
        set({
          data: [...get().data.filter((r) => !ids.has(r.id)), ...saved].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          ),
          error: null,
        });
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message });
        throw error;
      }
    },

    async remove(id) {
      try {
        const removed = await repository().delete(id);
        if (removed) {
          set({ data: get().data.filter((r) => r.id !== id) });
        }
        return removed;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message });
        throw error;
      }
    },

    async reset() {
      try {
        await repository().clear();
        set({ data: [], initialized: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message });
        throw error;
      }
    },
  }));
}