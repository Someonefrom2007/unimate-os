/**
 * Resource domain store — hydrates from IResourceRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Resource } from '../domain/model/Resource';

export type ResourceStore = AsyncStore<Resource>;

export const useResourceStore = createAsyncStore<Resource>('resource', () => getRepositories().resource);

export default useResourceStore;