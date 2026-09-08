import type { Habit } from '../../domain/model/Habit';
import type { IHabitRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBHabitRepository extends IndexedDBRepository<Habit> implements IHabitRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.habit);
  }
}