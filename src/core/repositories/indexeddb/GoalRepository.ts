import type { Goal } from '../../domain/model/Goal';
import type { IGoalRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBGoalRepository extends IndexedDBRepository<Goal> implements IGoalRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.goal);
  }
}