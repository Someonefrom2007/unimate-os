/**
 * Single-row store factory (Profile / Settings).
 * Manages exactly one active record with the same async-state semantics.
 */
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { IProfileRepository } from '../repositories/interfaces';
import type { Profile } from '../domain/model/Profile';
import type { Settings } from '../domain/model/Settings';

export interface SingleRowState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  load(): Promise<void>;
  save(record: T): Promise<T>;
}

const initial = <T>(): Omit<SingleRowState<T>, 'load' | 'save'> => ({
  data: null,
  loading: false,
  error: null,
  initialized: false,
});

export function createSingleRowStore<T extends { id: string }>(
  loader: () => Promise<T | null>,
  saver: (record: T) => Promise<T>,
): UseBoundStore<StoreApi<SingleRowState<T>>> {
  return create<SingleRowState<T>>()((set, get) => ({
    ...initial<T>(),

    async load() {
      const { loading } = get();
      if (loading) return;
      set({ loading: true, error: null });
      try {
        const data = await loader();
        set({ data, loading: false, initialized: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ loading: false, error: message, initialized: true });
      }
    },

    async save(record) {
      try {
        const saved = await saver(record);
        set({ data: saved, error: null });
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message });
        throw error;
      }
    },
  }));
}

export type ProfileStore = SingleRowState<Profile>;
export type SettingsStore = SingleRowState<Settings>;

export function createProfileStore(repo: () => IProfileRepository) {
  return createSingleRowStore<Profile>(
    () => repo().getActive(),
    (record) => repo().save(record),
  );
}

export function createSettingsStore(repo: () => { getActive(): Promise<Settings | null>; save(r: Settings): Promise<Settings> }) {
  return createSingleRowStore<Settings>(
    () => repo().getActive(),
    (record) => repo().save(record),
  );
}