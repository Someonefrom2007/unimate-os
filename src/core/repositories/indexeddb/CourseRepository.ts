import type { Course } from '../../domain/model/Course';
import type { ICourseRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBCourseRepository extends IndexedDBRepository<Course> implements ICourseRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.course);
  }

  listBySemester(semesterId: string): Promise<Course[]> {
    return this.getByIndex('by-semester', semesterId);
  }
}