import type { Exam } from '../../domain/model/Exam';
import type { IExamRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBExamRepository extends IndexedDBRepository<Exam> implements IExamRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.exam);
  }

  listByCourse(courseId: string): Promise<Exam[]> {
    return this.getByIndex('by-course', courseId);
  }
}