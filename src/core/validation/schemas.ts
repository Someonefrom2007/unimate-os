/**
 * Zod runtime validation schemas for UNI·MATE domain entities.
 * Each schema guarantees shape + relational integrity at the runtime boundary.
 */
import { z } from 'zod';
import {
  AccentColor,
  CourseStatus,
  ExamType,
  GoalCategory,
  GoalStatus,
  NotificationType,
  ResourceType,
  SessionType,
  SemesterType,
  TaskPriority,
  TaskStatus,
  WeekDay,
} from '../domain/index';

/** Branded stable id. */
const id = z.string().min(1);
const nullableId = id.nullable();
const sortOrder = z.number().int().nonnegative();
const accent = z.enum([AccentColor.Primary, AccentColor.Secondary, AccentColor.Tertiary]);
const label = z.string().min(1, 'Label cannot be empty');

export const profileSchema = z.object({
  id,
  name: z.string().min(1),
  initials: z.string().length(2).optional(),
  email: z.string().email().or(z.literal('')),
  university: z.string().min(1),
  degree: z.string().min(1),
  yearLabel: label,
  semesterLabel: label,
  targetGpa: z.number().min(0).max(10),
  totalEcts: z.number().nonnegative(),
  completedEcts: z.number().nonnegative(),
  accent,
});
export type ProfilePayload = z.infer<typeof profileSchema>;

export const semesterSchema = z.object({
  id,
  name: z.string().min(1),
  type: z.enum([SemesterType.Fall, SemesterType.Spring, SemesterType.Summer]),
  startDateLabel: z.string().min(1),
  endDateLabel: z.string().min(1),
  isActive: z.boolean(),
  sortOrder,
});
export type SemesterPayload = z.infer<typeof semesterSchema>;

export const courseSchema = z.object({
  id,
  semesterId: nullableId,
  code: z.string().min(1),
  name: z.string().min(1),
  professor: z.string().min(1),
  ects: z.number().nonnegative(),
  room: z.string(),
  syllabusProgress: z.number().int().min(0).max(100),
  avgGrade: z.number().min(0).max(10),
  gradeLabel: z.string(),
  nextSessionLabel: z.string(),
  status: z.enum([CourseStatus.Active, CourseStatus.Completed, CourseStatus.Archived]),
  accent,
  sortOrder,
});
export type CoursePayload = z.infer<typeof courseSchema>;

export const lessonSchema = z.object({
  id,
  courseId: id,
  dayOfWeek: z.number().int().min(0).max(6),
  timeLabel: z.string().min(1),
  courseName: z.string().min(1),
  room: z.string(),
  sessionType: z.string(),
  sortOrder,
});
export type LessonPayload = z.infer<typeof lessonSchema>;

export const taskSchema = z.object({
  id,
  courseId: nullableId,
  courseCode: z.string(),
  title: z.string().min(1),
  priority: z.enum([TaskPriority.High, TaskPriority.Medium, TaskPriority.Low]),
  status: z.enum([TaskStatus.Pending, TaskStatus.InProgress, TaskStatus.Completed]),
  estimatedHours: z.number().nonnegative(),
  subtaskSummary: z.string(),
  dueLabel: z.string(),
  completed: z.boolean(),
  sortOrder,
});
export type TaskPayload = z.infer<typeof taskSchema>;

export const examSchema = z.object({
  id,
  courseId: nullableId,
  codeLabel: z.string().min(1),
  title: z.string().min(1),
  weightLabel: z.string(),
  targetGrade: z.string(),
  daysUntilLabel: z.string(),
  type: z.enum([ExamType.Midterm, ExamType.Final, ExamType.Quiz, ExamType.Capstone, ExamType.Practical]),
  accent,
  sortOrder,
});
export type ExamPayload = z.infer<typeof examSchema>;

export const gradeSchema = z.object({
  id,
  courseId: nullableId,
  courseCode: z.string(),
  assessmentName: z.string().min(1),
  weight: z.number().min(0).max(100),
  grade: z.number().min(0).max(10),
  maxGrade: z.number().min(0).max(10),
  dateLabel: z.string(),
  sortOrder,
});
export type GradePayload = z.infer<typeof gradeSchema>;

export const noteSchema = z.object({
  id,
  title: z.string().min(1),
  icon: z.string(),
  timestampLabel: z.string(),
  accent,
  sortOrder,
});
export type NotePayload = z.infer<typeof noteSchema>;

export const resourceSchema = z.object({
  id,
  courseCode: z.string(),
  title: z.string().min(1),
  type: z.enum([ResourceType.Pdf, ResourceType.Document, ResourceType.Code, ResourceType.Slides, ResourceType.Link, ResourceType.Video]),
  url: z.string().min(1),
  sizeLabel: z.string(),
  timestampLabel: z.string(),
  favorite: z.boolean(),
  sortOrder,
});
export type ResourcePayload = z.infer<typeof resourceSchema>;

export const studySessionSchema = z.object({
  id,
  courseCode: z.string(),
  taskLabel: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  sessionType: z.enum([SessionType.Pomodoro, SessionType.DeepWork, SessionType.Review]),
  dateLabel: z.string(),
  timeLabel: z.string(),
  completed: z.boolean(),
  sortOrder,
});
export type StudySessionPayload = z.infer<typeof studySessionSchema>;

export const goalSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string(),
  category: z.enum([GoalCategory.Academic, GoalCategory.Study, GoalCategory.Personal, GoalCategory.Health]),
  targetValue: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  unit: z.string(),
  deadlineLabel: z.string(),
  status: z.enum([GoalStatus.Active, GoalStatus.Completed]),
  sortOrder,
});
export type GoalPayload = z.infer<typeof goalSchema>;

export const habitSchema = z.object({
  id,
  name: z.string().min(1),
  streakLabel: z.string(),
  progressPercent: z.number().int().min(0).max(100),
  detailLabel: z.string(),
  accent,
  sortOrder,
});
export type HabitPayload = z.infer<typeof habitSchema>;

export const notificationSchema = z.object({
  id,
  type: z.enum([NotificationType.Exam, NotificationType.Deadline, NotificationType.Class, NotificationType.Streak, NotificationType.Goal, NotificationType.Workload]),
  title: z.string().min(1),
  body: z.string(),
  timestampLabel: z.string(),
  read: z.boolean(),
  accent,
  sortOrder,
});
export type NotificationPayload = z.infer<typeof notificationSchema>;

export const calendarEventSchema = z.object({
  id,
  courseId: nullableId,
  courseName: z.string().min(1),
  dayOfWeek: z.number().int().min(WeekDay.Sunday).max(WeekDay.Saturday),
  dayLabel: z.string(),
  dateLabel: z.string(),
  isToday: z.boolean(),
  timeLabel: z.string().min(1),
  room: z.string(),
  sessionType: z.string(),
  isNext: z.boolean(),
  sortOrder,
});
export type CalendarEventPayload = z.infer<typeof calendarEventSchema>;

export const notificationPrefsSchema = z.object({
  exam: z.boolean(),
  deadline: z.boolean(),
  class: z.boolean(),
  streak: z.boolean(),
  goal: z.boolean(),
  workload: z.boolean(),
});

export const settingsSchema = z.object({
  id,
  darkMode: z.boolean(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  language: z.string().min(1),
  notificationPrefs: notificationPrefsSchema,
  studyReminder: z.boolean(),
  quietHours: z.boolean(),
  defaultAccent: accent,
});
export type SettingsPayload = z.infer<typeof settingsSchema>;

export const domainSchemas = {
  profile: profileSchema,
  semester: semesterSchema,
  course: courseSchema,
  lesson: lessonSchema,
  task: taskSchema,
  exam: examSchema,
  grade: gradeSchema,
  note: noteSchema,
  resource: resourceSchema,
  studySession: studySessionSchema,
  goal: goalSchema,
  habit: habitSchema,
  notification: notificationSchema,
  calendarEvent: calendarEventSchema,
  settings: settingsSchema,
} as const;