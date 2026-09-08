/**
 * Domain store barrel + global hydration helper.
 * Call `hydrateAllStores()` once at bootstrap after `setRepositories(...)`.
 */
import { useCourseStore } from './useCourseStore';
import { useExamStore } from './useExamStore';
import { useFocusStore } from './useFocusStore';
import { useGoalStore } from './useGoalStore';
import { useGradeStore } from './useGradeStore';
import { useHabitStore } from './useHabitStore';
import { useNoteStore } from './useNoteStore';
import { useProfileStore } from './useProfileStore';
import { useResourceStore } from './useResourceStore';
import { useScheduleStore } from './useScheduleStore';
import { useSettingsStore } from './useSettingsStore';
import { useTaskStore } from './useTaskStore';

export * from './types';
export * from './registry';
export * from './createAsyncStore';
export type { ProfileStore, SettingsStore } from './createSingleRowStore';
export * from './useCourseStore';
export * from './useTaskStore';
export * from './useExamStore';
export * from './useGradeStore';
export * from './useScheduleStore';
export * from './useNoteStore';
export * from './useResourceStore';
export * from './useFocusStore';
export * from './useGoalStore';
export * from './useHabitStore';
export * from './useProfileStore';
export * from './useSettingsStore';

/** All domain stores used during hydration. */
export const ALL_STORES = {
  profile: useProfileStore,
  course: useCourseStore,
  task: useTaskStore,
  exam: useExamStore,
  grade: useGradeStore,
  schedule: useScheduleStore,
  note: useNoteStore,
  resource: useResourceStore,
  focus: useFocusStore,
  goal: useGoalStore,
  habit: useHabitStore,
  settings: useSettingsStore,
} as const;

/**
 * Hydrates (loads) every domain store from its repository.
 * Resolves when all loads complete; individual store failures are swallowed
 * so one broken store never blocks the UI (each store exposes its own error).
 */
export async function hydrateAllStores(): Promise<void> {
  const loads = Object.values(ALL_STORES).map(async (store) => {
    try {
      await store.getState().load();
    } catch {
      // Store-level error state is set by the store itself.
    }
  });
  await Promise.all(loads);
}

export default ALL_STORES;