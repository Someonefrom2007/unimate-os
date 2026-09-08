/**
 * Task domain store — hydrates from ITaskRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Task } from '../domain/model/Task';

export type TaskStore = AsyncStore<Task>;

export const useTaskStore = createAsyncStore<Task>('task', () => getRepositories().task);

export default useTaskStore;