import type { CalendarEvent } from '../../domain/model/CalendarEvent';
import type { IScheduleRepository } from '../interfaces';
import { IndexedDBRepository } from './IndexedDBRepository';
import { STORE_NAMES } from '../types';

export class IndexedDBScheduleRepository extends IndexedDBRepository<CalendarEvent> implements IScheduleRepository {
  constructor(dbPromise: Promise<IDBDatabase>) {
    super(dbPromise, STORE_NAMES.schedule);
  }

  listByCourse(courseId: string): Promise<CalendarEvent[]> {
    return this.getByIndex('by-course', courseId);
  }

  listByDay(dayOfWeek: number): Promise<CalendarEvent[]> {
    return this.getByIndex('by-day', dayOfWeek);
  }
}