import type { Settings } from '../../domain/model/Settings';
import type { ISettingsRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBSettingsRepository extends IndexedDBRepository<Settings> implements ISettingsRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.settings);
  }

  async getActive(): Promise<Settings | null> {
    const rows = await this.list();
    return rows.length > 0 ? rows[0] : null;
  }
}