import type { Profile } from '../../domain/model/Profile';
import type { IProfileRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBProfileRepository extends IndexedDBRepository<Profile> implements IProfileRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.profile);
  }

  async getActive(): Promise<Profile | null> {
    const rows = await this.list();
    return rows.length > 0 ? rows[0] : null;
  }
}