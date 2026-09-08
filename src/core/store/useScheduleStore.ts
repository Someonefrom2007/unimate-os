/**
 * Schedule (CalendarEvent) domain store — hydrates from IScheduleRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { CalendarEvent } from '../domain/model/CalendarEvent';

export type ScheduleStore = AsyncStore<CalendarEvent>;

export const useScheduleStore = createAsyncStore<CalendarEvent>('schedule', () => getRepositories().schedule);

export default useScheduleStore;