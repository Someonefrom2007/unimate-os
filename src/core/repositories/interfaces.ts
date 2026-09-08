import type { Course } from '../domain/model/Course';
import type { Exam } from '../domain/model/Exam';
import type { Grade } from '../domain/model/Grade';
import type { Habit } from '../domain/model/Habit';
import type { Note } from '../domain/model/Note';
import type { Profile } from '../domain/model/Profile';
import type { Resource } from '../domain/model/Resource';
import type { Settings } from '../domain/model/Settings';
import type { StudySession } from '../domain/model/StudySession';
import type { Task } from '../domain/model/Task';
import type { Goal } from '../domain/model/Goal';
import type { CalendarEvent } from '../domain/model/CalendarEvent';

/** Generic repository contract all entity repositories share. */
export interface IRepository<T extends { id: string }> {
  /** Return every record ordered by `sortOrder` ascending. */
  list(): Promise<T[]>;
  /** Return a single record by id, or null. */
  get(id: string): Promise<T | null>;
  /** Persist a record (create or replace). */
  save(record: T): Promise<T>;
  /** Insert several records at once. */
  saveMany(records: T[]): Promise<T[]>;
  /** Remove a record by id. Returns true when a row was deleted. */
  delete(id: string): Promise<boolean>;
  /** Remove every record in the store. */
  clear(): Promise<void>;
}

/** Supports querying children of a course. */
export interface ICourseChildrenRepository<T extends { id: string; courseId: string | null }> {
  /** All records linked to a course id. */
  listByCourse(courseId: string): Promise<T[]>;
}

export interface IProfileRepository extends IRepository<Profile> {
  /** Fetch the first profile row (single-tenant). */
  getActive(): Promise<Profile | null>;
}

export interface ICourseRepository extends IRepository<Course> {
  /** Courses belonging to a semester. */
  listBySemester(semesterId: string): Promise<Course[]>;
}

export interface ITaskRepository extends IRepository<Task>, ICourseChildrenRepository<Task> {}

export interface IExamRepository extends IRepository<Exam>, ICourseChildrenRepository<Exam> {}

export interface IGradeRepository extends IRepository<Grade>, ICourseChildrenRepository<Grade> {}

export interface IScheduleRepository extends IRepository<CalendarEvent>, ICourseChildrenRepository<CalendarEvent> {
  /** Events on a given day of week (0=Sun .. 6=Sat). */
  listByDay(dayOfWeek: number): Promise<CalendarEvent[]>;
}

export type INoteRepository = IRepository<Note>;

export type IResourceRepository = IRepository<Resource> & {
  /** Resources matching a course code. */
  listByCourseCode(courseCode: string): Promise<Resource[]>;
};

export type IFocusRepository = IRepository<StudySession>;

export type IGoalRepository = IRepository<Goal>;

export type IHabitRepository = IRepository<Habit>;

export type ISettingsRepository = IRepository<Settings> & {
  /** Fetch the (single) settings row. */
  getActive(): Promise<Settings | null>;
};

/** Aggregate of every repository a data source must provide. */
export interface RepositorySet {
  profile: IProfileRepository;
  course: ICourseRepository;
  task: ITaskRepository;
  exam: IExamRepository;
  grade: IGradeRepository;
  schedule: IScheduleRepository;
  note: INoteRepository;
  resource: IResourceRepository;
  focus: IFocusRepository;
  goal: IGoalRepository;
  habit: IHabitRepository;
  settings: ISettingsRepository;
}