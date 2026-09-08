/**
 * Note domain store — hydrates from INoteRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Note } from '../domain/model/Note';

export type NoteStore = AsyncStore<Note>;

export const useNoteStore = createAsyncStore<Note>('note', () => getRepositories().note);

export default useNoteStore;