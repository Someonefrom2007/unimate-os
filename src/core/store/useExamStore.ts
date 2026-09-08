/**
 * Exam domain store — hydrates from IExamRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Exam } from '../domain/model/Exam';

export type ExamStore = AsyncStore<Exam>;

export const useExamStore = createAsyncStore<Exam>('exam', () => getRepositories().exam);

export default useExamStore;