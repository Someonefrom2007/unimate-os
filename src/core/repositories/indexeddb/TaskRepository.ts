import type { Task } from '../../domain/model/Task';
import type { ITaskRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBTaskRepository extends IndexedDBRepository<Task> implements ITaskRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.task);
  }

  listByCourse(courseId: string): Promise<Task[]> {
    return this.getByIndex('by-course', courseId);
  }
}