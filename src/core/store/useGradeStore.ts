/**
 * Grade domain store — hydrates from IGradeRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Grade } from '../domain/model/Grade';

export type GradeStore = AsyncStore<Grade>;

export const useGradeStore = createAsyncStore<Grade>('grade', () => getRepositories().grade);

export default useGradeStore;