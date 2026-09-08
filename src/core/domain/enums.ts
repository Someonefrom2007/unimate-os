/**
 * Core domain enums used across all UNI·MATE entities.
 * Strict, stable string literals — never rely on raw strings in the domain layer.
 */

/** Priority level of a task or coursework item. */
export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

/** Lifecycle status of a task. */
export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
}

/** Classification of an exam / assessment milestone. */
export enum ExamType {
  Midterm = 'midterm',
  Final = 'final',
  Quiz = 'quiz',
  Capstone = 'capstone',
  Practical = 'practical',
}

/** Grade classification banding (EU 10-point scale). */
export enum GradeClassification {
  Outstanding = 'Outstanding',
  Notable = 'Notable',
  Sufficient = 'Sufficient',
  Fail = 'Fail',
}

/** Course lifecycle state. */
export enum CourseStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

/** Semester / term a course belongs to. */
export enum SemesterType {
  Fall = 'fall',
  Spring = 'spring',
  Summer = 'summer',
}

/** Category of a study goal. */
export enum GoalCategory {
  Academic = 'academic',
  Study = 'study',
  Personal = 'personal',
  Health = 'health',
}

/** Goal progress lifecycle. */
export enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
}

/** Type/category of a study session. */
export enum SessionType {
  Pomodoro = 'pomodoro',
  DeepWork = 'deep_work',
  Review = 'review',
}

/** Notification category. */
export enum NotificationType {
  Exam = 'exam',
  Deadline = 'deadline',
  Class = 'class',
  Streak = 'streak',
  Goal = 'goal',
  Workload = 'workload',
}

/** Resource content type. */
export enum ResourceType {
  Pdf = 'pdf',
  Document = 'document',
  Code = 'code',
  Slides = 'slides',
  Link = 'link',
  Video = 'video',
}

/** Day of week used by calendar events and schedule (0 = Sunday .. 6 = Saturday). */
export enum WeekDay {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

/** Accent brand tint for visual variety across entities. */
export enum AccentColor {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  Gold = 'gold',
  Emerald = 'emerald',
  Cyan = 'cyan',
  Rose = 'rose',
  Indigo = 'indigo',
  Amber = 'amber',
  Slate = 'slate',
  Violet = 'violet',
}