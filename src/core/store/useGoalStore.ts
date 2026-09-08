/**
 * Goal domain store — hydrates from IGoalRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Goal } from '../domain/model/Goal';

export type GoalStore = AsyncStore<Goal>;

export const useGoalStore = createAsyncStore<Goal>('goal', () => getRepositories().goal);

export default useGoalStore;