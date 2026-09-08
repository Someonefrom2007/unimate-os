/**
 * Shared store slice types + helpers for all domain stores.
 * Every store tracks its own loading / error / initialized / empty state.
 */
import type { RepositorySet } from '../repositories/interfaces';

/** Generic state slice all domain stores share. */
export interface AsyncState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const initialAsyncState = <T>(): AsyncState<T> => ({
  data: [],
  loading: false,
  error: null,
  initialized: false,
});

/** Convenience accessor: is the collection empty after hydration? */
export function isEmpty<T>(state: AsyncState<T>): boolean {
  return state.initialized && !state.loading && state.data.length === 0;
}

export type { RepositorySet };