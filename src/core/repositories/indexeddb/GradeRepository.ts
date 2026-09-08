import type { Grade } from '../../domain/model/Grade';
import type { IGradeRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBGradeRepository extends IndexedDBRepository<Grade> implements IGradeRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.grade);
  }

  listByCourse(courseId: string): Promise<Grade[]> {
    return this.getByIndex('by-course', courseId);
  }
}