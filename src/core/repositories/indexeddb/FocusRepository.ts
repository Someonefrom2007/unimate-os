import type { StudySession } from '../../domain/model/StudySession';
import type { IFocusRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBFocusRepository extends IndexedDBRepository<StudySession> implements IFocusRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.focus);
  }
}