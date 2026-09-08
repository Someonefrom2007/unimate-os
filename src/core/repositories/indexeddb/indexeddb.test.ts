/**
 * Repository CRUD + query tests against fake-indexeddb.
 * Verifies Create / Read / Update / Delete + index queries and schema init.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import {
  createIndexedDbRepositories,
  deleteDatabase,
  DB_NAME,
  DB_VERSION,
  STORE_DEFINITIONS,
} from './index';
import type { Course } from '../../domain/model/Course';
import type { Task } from '../../domain/model/Task';
import type { Profile } from '../../domain/model/Profile';
import type { CalendarEvent } from '../../domain/model/CalendarEvent';
import {
  AccentColor,
  CourseStatus,
  SessionType,
  TaskPriority,
  TaskStatus,
  WeekDay,
} from '../../domain/enums';

describe('IndexedDB schema initialization', () => {
  it('creates every store with the expected name', async () => {
    const repos = await createIndexedDbRepositories();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    for (const def of Object.values(STORE_DEFINITIONS)) {
      expect(db.objectStoreNames.contains(def.name)).toBe(true);
    }
    db.close();
    await repos.destroy();
  }, 15000);

  it('runs migrations idempotently across reopen', async () => {
    const first = await createIndexedDbRepositories();
    await first.profile.save(mockProfile());
    await first.destroy();

    const second = await createIndexedDbRepositories();
    const profile = await second.profile.getActive();
    expect(profile?.name).toBe('Alex Karimi');
    await second.destroy();
  }, 15000);
});

describe('Profile repository CRUD', () => {
  let repos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    repos = await createIndexedDbRepositories();
  });
  afterEach(async () => {
    await repos.destroy();
    await deleteDatabase();
  });

  it('creates and reads a profile', async () => {
    const profile = mockProfile();
    await repos.profile.save(profile);
    const active = await repos.profile.getActive();
    expect(active?.email).toBe('alex@student.tudelft.nl');
    expect(active?.targetGpa).toBe(8);
  });

  it('updates a profile in place', async () => {
    const profile = mockProfile();
    await repos.profile.save(profile);
    await repos.profile.save({ ...profile, targetGpa: 9.1 });
    const updated = await repos.profile.getActive();
    expect(updated?.targetGpa).toBe(9.1);
    const all = await repos.profile.list();
    expect(all).toHaveLength(1);
  });

  it('deletes a profile', async () => {
    await repos.profile.save(mockProfile());
    await repos.profile.delete('p1');
    expect(await repos.profile.getActive()).toBeNull();
  });
});

describe('Course repository CRUD + index query', () => {
  let repos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    repos = await createIndexedDbRepositories();
  });
  afterEach(async () => {
    await repos.destroy();
    await deleteDatabase();
  });

  it('persists courses and lists them sorted by sortOrder', async () => {
    const c1 = mockCourse('c1', 2);
    const c2 = mockCourse('c2', 1);
    await repos.course.saveMany([c1, c2]);
    const rows = await repos.course.list();
    expect(rows.map((c) => c.id)).toEqual(['c2', 'c1']);
  });

  it('filters courses by semester via by-semester index', async () => {
    await repos.course.save(mockCourse('c1'));
    await repos.course.save({ ...mockCourse('c2'), semesterId: 'sem-X' });
    const inSemA = await repos.course.listBySemester('sem-A');
    expect(inSemA.map((c) => c.id)).toEqual(['c1']);
  });

  it('updates a course and reads it back', async () => {
    await repos.course.save(mockCourse('c1'));
    await repos.course.save({ ...mockCourse('c1'), syllabusProgress: 95 });
    const updated = await repos.course.get('c1');
    expect(updated?.syllabusProgress).toBe(95);
  });

  it('deletes a course', async () => {
    await repos.course.save(mockCourse('c1'));
    expect(await repos.course.delete('c1')).toBe(true);
    expect(await repos.course.get('c1')).toBeNull();
  });
});

describe('Task repository CRUD + by-course filter', () => {
  let repos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    repos = await createIndexedDbRepositories();
  });
  afterEach(async () => {
    await repos.destroy();
    await deleteDatabase();
  });

  it('saves and lists tasks', async () => {
    await repos.task.saveMany([mockTask('t1'), mockTask('t2')]);
    const rows = await repos.task.list();
    expect(rows).toHaveLength(2);
  });

  it('filters by courseId via by-course index', async () => {
    await repos.task.save(mockTask('t1'));
    await repos.task.save({ ...mockTask('t2'), courseId: 'c-other' });
    const courseTasks = await repos.task.listByCourse('c1');
    expect(courseTasks.map((t) => t.id)).toEqual(['t1']);
  });

  it('clears the store', async () => {
    await repos.task.saveMany([mockTask('t1'), mockTask('t2')]);
    await repos.task.clear();
    expect(await repos.task.list()).toHaveLength(0);
  });
});

describe('Schedule repository by-day query', () => {
  let repos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    repos = await createIndexedDbRepositories();
  });
  afterEach(async () => {
    await repos.destroy();
    await deleteDatabase();
  });

  it('lists events for a specific day', async () => {
    const monday = mockEvent('e1', WeekDay.Monday);
    const tuesday = mockEvent('e2', WeekDay.Tuesday);
    await repos.schedule.saveMany([monday, tuesday]);
    const mondays = await repos.schedule.listByDay(WeekDay.Monday);
    expect(mondays.map((e) => e.id)).toEqual(['e1']);
  });

  it('filters by course', async () => {
    await repos.schedule.save(mockEvent('e1', WeekDay.Monday));
    await repos.schedule.save({ ...mockEvent('e2', WeekDay.Tuesday), courseId: 'other' });
    const courseEvents = await repos.schedule.listByCourse('c1');
    expect(courseEvents).toHaveLength(1);
  });
});

/* ------------------------------ fixtures ------------------------------ */

function mockProfile(): Profile {
  return {
    id: 'p1',
    name: 'Alex Karimi',
    initials: 'AK',
    email: 'alex@student.tudelft.nl',
    university: 'TU Delft',
    degree: 'BSc Computer Science',
    yearLabel: 'Year 3',
    semesterLabel: 'Fall 2025',
    targetGpa: 8,
    totalEcts: 180,
    completedEcts: 120,
    accent: AccentColor.Primary,
  };
}

function mockCourse(id: string, sortOrder = 1): Course {
  return {
    id,
    semesterId: 'sem-A',
    code: 'CS301',
    name: 'Advanced Operating Systems',
    professor: 'Dr. Elena Mercer',
    ects: 6,
    room: 'Turing 302',
    syllabusProgress: 72,
    avgGrade: 8.4,
    gradeLabel: 'Notable',
    nextSessionLabel: 'Mon 09:00',
    status: CourseStatus.Active,
    accent: AccentColor.Primary,
    sortOrder,
  };
}

function mockTask(id: string): Task {
  return {
    id,
    courseId: 'c1',
    courseCode: 'CS301',
    title: 'Implement virtual memory manager',
    priority: TaskPriority.High,
    status: TaskStatus.Pending,
    estimatedHours: 4,
    subtaskSummary: '3 subtasks',
    dueLabel: 'Mon Dec 16 (2d)',
    completed: false,
    sortOrder: 1,
  };
}

function mockEvent(id: string, dayOfWeek: WeekDay): CalendarEvent {
  return {
    id,
    courseId: 'c1',
    courseName: 'Advanced Operating Systems',
    dayOfWeek,
    dayLabel: 'Monday',
    dateLabel: 'Sep 7, 2026',
    isToday: true,
    timeLabel: '09:00 – 11:30',
    room: 'Turing 302',
    sessionType: SessionType.Pomodoro,
    isNext: false,
    sortOrder: 1,
  };
}