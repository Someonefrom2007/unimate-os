/** Store names used by the IndexedDB object stores (mirrors the DB tables). */
export const STORE_NAMES = {
  profile: 'profile',
  course: 'courses',
  task: 'tasks',
  exam: 'assessments',
  grade: 'grade_entries',
  schedule: 'schedule_entries',
  note: 'notes',
  resource: 'resources',
  focus: 'focus_sessions',
  goal: 'goals',
  habit: 'habits',
  settings: 'settings',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];