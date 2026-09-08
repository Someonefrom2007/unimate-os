/**
 * Seeder unit tests — verifies demo-data seeding, reset, and idempotency.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { createIndexedDbRepositories, deleteDatabase } from './index';
import {
  isDatabaseSeeded,
  resetDatabase,
  reseedDatabase,
  seedDatabase,
  seedIfEmpty,
} from './seeder';
import { DB_NAME } from './index';

describe('Database Seeder', () => {
  let repos: Awaited<ReturnType<typeof createIndexedDbRepositories>>;

  beforeEach(async () => {
    repos = await createIndexedDbRepositories();
  });

  afterEach(async () => {
    await repos.destroy();
    await deleteDatabase(DB_NAME);
  });

  it('detects an unseeded database', async () => {
    expect(await isDatabaseSeeded(repos)).toBe(false);
  });

  it('seeds the full dataset', async () => {
    await seedDatabase(repos);

    const profile = await repos.profile.getActive();
    expect(profile?.name).toBe('Alejandra Vega');
    expect(profile?.targetGpa).toBe(8.0);

    const courses = await repos.course.list();
    expect(courses).toHaveLength(5);

    const tasks = await repos.task.list();
    expect(tasks).toHaveLength(5);
    expect(tasks.some((t) => t.title === 'Implement A* pathfinding')).toBe(true);

    const exams = await repos.exam.list();
    expect(exams).toHaveLength(5);

    const grades = await repos.grade.list();
    expect(grades).toHaveLength(10);

    const notes = await repos.note.list();
    expect(notes).toHaveLength(3);

    const sessions = await repos.focus.list();
    expect(sessions).toHaveLength(4);

    const goals = await repos.goal.list();
    expect(goals).toHaveLength(3);

    const habits = await repos.habit.list();
    expect(habits).toHaveLength(3);

    const events = await repos.schedule.list();
    expect(events).toHaveLength(5);

    expect(await isDatabaseSeeded(repos)).toBe(true);
  });

  it('is idempotent — reseeding replaces records without duplicates', async () => {
    await seedDatabase(repos);
    await seedDatabase(repos);

    expect(await repos.course.list()).toHaveLength(5);
    expect(await repos.task.list()).toHaveLength(5);
    expect(await repos.goal.list()).toHaveLength(3);
  });

  it('resets the database to empty', async () => {
    await seedDatabase(repos);
    await resetDatabase(repos);

    expect(await repos.profile.getActive()).toBeNull();
    expect(await repos.course.list()).toHaveLength(0);
    expect(await repos.task.list()).toHaveLength(0);
    expect(await repos.exam.list()).toHaveLength(0);
    expect(await repos.grade.list()).toHaveLength(0);
    expect(await repos.schedule.list()).toHaveLength(0);
    expect(await isDatabaseSeeded(repos)).toBe(false);
  });

  it('reseed wipes and repopulates', async () => {
    await seedDatabase(repos);
    await reseedDatabase(repos);

    expect(await repos.course.list()).toHaveLength(5);
    expect(await repos.profile.getActive()).not.toBeNull();
  });

  it('seedIfEmpty seeds only when empty', async () => {
    // First call seeds
    expect(await seedIfEmpty(repos)).toBe(true);
    expect(await repos.course.list()).toHaveLength(5);

    // Second call does not reseed (already seeded)
    expect(await seedIfEmpty(repos)).toBe(false);
    expect(await repos.course.list()).toHaveLength(5);
  });
});