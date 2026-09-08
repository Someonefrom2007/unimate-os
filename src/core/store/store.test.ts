/**
 * Store integration tests — prove the Store → Repository → IndexedDB → Store
 * round-trip, loading/error/initialized/empty states, and hydration.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import {
  createIndexedDbRepositories,
  deleteDatabase,
} from '../repositories/indexeddb';
import { setRepositories } from './registry';
import { useCourseStore, hydrateAllStores } from './index';
import { useTaskStore } from './useTaskStore';
import { useProfileStore } from './useProfileStore';
import type { Course } from '../domain/model/Course';
import type { Task } from '../domain/model/Task';
import { AccentColor, CourseStatus, TaskPriority, TaskStatus } from '../domain/enums';

describe('Zustand domain stores — Store → Repository → IndexedDB → Store', () => {
  let currentRepos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    currentRepos = await createIndexedDbRepositories();
    setRepositories(currentRepos);
  });

  afterEach(async () => {
    // Always re-create a real repository set (a test may have stubbed it).
    currentRepos = await createIndexedDbRepositories();
    setRepositories(currentRepos);
    useCourseStore.getState().reset();
    useTaskStore.getState().reset();
    await deleteDatabase();
  });

  it('round-trips a course through the store into IndexedDB', async () => {
    await useCourseStore.getState().load();
    expect(useCourseStore.getState().initialized).toBe(true);

    await useCourseStore.getState().upsert(makeCourse('c1'));
    expect(useCourseStore.getState().data).toHaveLength(1);
    expect(useCourseStore.getState().data[0].name).toBe('Advanced Operating Systems');
    expect(useCourseStore.getState().error).toBeNull();
  });

  it('persists across a simulated re-open (new repository set)', async () => {
    await useCourseStore.getState().upsert(makeCourse('c1'));
    await useCourseStore.getState().upsert(makeCourse('c2'));

    // Simulate page reload: fresh repo set + fresh store data.
    const freshRepos = await createIndexedDbRepositories();
    setRepositories(freshRepos);
    useCourseStore.setState({ data: [], initialized: false });
    await useCourseStore.getState().load();

    const names = useCourseStore.getState().data.map((c) => c.code).sort();
    expect(names).toEqual(['CS301', 'CS301']);
    expect(useCourseStore.getState().initialized).toBe(true);
    expect(useCourseStore.getState().loading).toBe(false);
  });

  it('updates an existing record rather than duplicating it', async () => {
    await useCourseStore.getState().upsert(makeCourse('c1'));
    await useCourseStore.getState().upsert({ ...makeCourse('c1'), syllabusProgress: 90 });
    const data = useCourseStore.getState().data;
    expect(data).toHaveLength(1);
    expect(data[0].syllabusProgress).toBe(90);
  });

  it('removes a record through the store and repository', async () => {
    await useCourseStore.getState().upsert(makeCourse('c1'));
    const removed = await useCourseStore.getState().remove('c1');
    expect(removed).toBe(true);
    expect(useCourseStore.getState().data).toHaveLength(0);

    const freshRepos = await createIndexedDbRepositories();
    setRepositories(freshRepos);
    const reloaded = await useCourseStore.getState().load();
    void reloaded;
    expect(useCourseStore.getState().data).toHaveLength(0);
  });

  it('hydrates all stores from IndexedDB at bootstrap', async () => {
    await useProfileStore.getState().save({
      id: 'p1',
      name: 'Alex',
      initials: 'AK',
      email: 'a@b.co',
      university: 'TU Delft',
      degree: 'BSc',
      yearLabel: 'Y3',
      semesterLabel: 'Fall 2025',
      targetGpa: 8,
      totalEcts: 180,
      completedEcts: 120,
      accent: AccentColor.Primary,
    });
    await useTaskStore.getState().upsert(makeTask('t1'));

    useProfileStore.setState({ data: null, initialized: false });
    useTaskStore.setState({ data: [], initialized: false });

    await hydrateAllStores();

    expect(useProfileStore.getState().initialized).toBe(true);
    expect(useProfileStore.getState().data?.email).toBe('a@b.co');
    expect(useTaskStore.getState().initialized).toBe(true);
    expect(useTaskStore.getState().data).toHaveLength(1);
  });

  it('surfaces an error state when the repository fails', async () => {
    // Replace only the course repo with one that rejects.
    const failingRepo = {
      list: async (): Promise<Course[]> => {
        throw new Error('quota exceeded');
      },
    };
    setRepositories({
      course: failingRepo as never,
    } as never);

    await useCourseStore.getState().load();
    expect(useCourseStore.getState().error).toContain('quota exceeded');
    expect(useCourseStore.getState().loading).toBe(false);
    expect(useCourseStore.getState().initialized).toBe(true);
    expect(useCourseStore.getState().data).toHaveLength(0);
  });
});

function makeCourse(id: string): Course {
  return {
    id,
    semesterId: null,
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
    sortOrder: 1,
  };
}

function makeTask(id: string): Task {
  return {
    id,
    courseId: null,
    courseCode: 'CS301',
    title: 'Implement VM manager',
    priority: TaskPriority.High,
    status: TaskStatus.Pending,
    estimatedHours: 4,
    subtaskSummary: '3 subtasks',
    dueLabel: 'Mon Dec 16',
    completed: false,
    sortOrder: 1,
  };
}