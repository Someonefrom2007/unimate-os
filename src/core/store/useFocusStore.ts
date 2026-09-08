/**
 * Focus (StudySession) domain store — hydrates from IFocusRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { StudySession } from '../domain/model/StudySession';

export type FocusStore = AsyncStore<StudySession>;

export const useFocusStore = createAsyncStore<StudySession>('focus', () => getRepositories().focus);

export default useFocusStore;