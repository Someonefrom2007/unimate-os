/**
 * Habit domain store — hydrates from IHabitRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Habit } from '../domain/model/Habit';

export type HabitStore = AsyncStore<Habit>;

export const useHabitStore = createAsyncStore<Habit>('habit', () => getRepositories().habit);

export default useHabitStore;