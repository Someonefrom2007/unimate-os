import type { Note } from '../../domain/model/Note';
import type { INoteRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBNoteRepository extends IndexedDBRepository<Note> implements INoteRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.note);
  }
}