import type { Resource } from '../../domain/model/Resource';
import type { IResourceRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBResourceRepository extends IndexedDBRepository<Resource> implements IResourceRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.resource);
  }

  listByCourseCode(courseCode: string): Promise<Resource[]> {
    return this.getByIndex('by-course-code', courseCode);
  }
}