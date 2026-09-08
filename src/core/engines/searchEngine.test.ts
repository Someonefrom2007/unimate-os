/**
 * SearchEngine unit tests — fuzzy matching, multi-entity, ranking.
 */
import { describe, expect, it } from 'vitest';
import { searchAll, type SearchInput } from './searchEngine';
import type { Course } from '../domain/model/Course';
import type { Task } from '../domain/model/Task';
import type { Note } from '../domain/model/Note';
import type { Resource } from '../domain/model/Resource';
import type { CalendarEvent } from '../domain/model/CalendarEvent'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { TaskPriority, TaskStatus } from '../domain/enums';

function empty(): SearchInput {
  return { query: '', courses: [], tasks: [], exams: [], notes: [], resources: [], events: [], goals: [] };
}

function makeCourse(overrides: Partial<Course> & { code: string; name: string }): Course {
  return { id: 'c1', semesterId: null, ects: 6, professor: 'Dr. Smith', syllabusProgress: 50, accent: 'primary', status: 'active', avgGrade: 7, room: '', gradeLabel: '', nextSessionLabel: '', sortOrder: 0, ...overrides };
}

function makeTask(overrides: Partial<Task> & { title: string }): Task {
  return { courseId: null, courseCode: 'CS301', priority: TaskPriority.Medium, status: TaskStatus.Pending, estimatedHours: 2, subtaskSummary: '', dueLabel: 'Mon', completed: false, sortOrder: 1, ...overrides };
}

function makeNote(overrides: Partial<Note> & { id: string; title: string }): Note {
  return { icon: '', timestampLabel: '', accent: 'primary', sortOrder: 0, ...overrides };
}

function makeResource(overrides: Partial<Resource> & { id: string; title: string }): Resource {
  return { courseCode: 'CS301', type: 'pdf', url: '', sizeLabel: '', timestampLabel: '', favorite: false, sortOrder: 0, ...overrides };
}

describe('searchAll', () => {
  it('returns empty for blank query', () => {
    const result = searchAll({ ...empty(), query: '' });
    expect(result).toEqual([]);
  });

  it('matches courses by name', () => {
    const result = searchAll({ ...empty(), query: 'algorithms', courses: [makeCourse({ code: 'CS301', name: 'Advanced Algorithms' })] });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Course');
    expect(result[0].view).toBe('courses');
  });

  it('matches tasks by title and course code', () => {
    const result = searchAll({
      ...empty(), query: 'homework',
      tasks: [
        makeTask({ title: 'Homework 3', courseCode: 'CS301' }),
        makeTask({ title: 'Report', id: 't2', courseCode: 'MATH' }),
      ],
    });
    expect(result.some((r) => r.title === 'Homework 3')).toBe(true);
  });

  it('matches notes by title', () => {
    const result = searchAll({
      ...empty(), query: 'threading',
      notes: [makeNote({ id: 'n1', title: 'OS Threading Notes', body: '' })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].view).toBe('notes');
  });

  it('matches resources by title', () => {
    const result = searchAll({
      ...empty(), query: 'quantum',
      resources: [makeResource({ id: 'r1', title: 'Quantum Mechanics Slides' })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].view).toBe('resources');
  });

  it('matches schedule events by course name', () => {
    const result = searchAll({
      ...empty(), query: 'operating',
      events: [{ id: 'ev1', courseId: null, courseName: 'Operating Systems', dayOfWeek: 1, dayLabel: 'Monday', dateLabel: '', isToday: false, timeLabel: '10:00', room: 'B101', sessionType: 'lecture', isNext: false, sortOrder: 0 }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].view).toBe('schedule');
  });

  it('matches exams by title', () => {
    const result = searchAll({
      ...empty(), query: 'midterm',
      exams: [{ id: 'e1', codeLabel: 'CS301', title: 'CS301 Midterm', weightLabel: '30%', targetGrade: '8', daysUntilLabel: '5', accent: 'primary' }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].view).toBe('assessments');
  });

  it('returns results ranked by score (best first)', () => {
    const result = searchAll({
      ...empty(), query: 'advanced algo',
      courses: [
        makeCourse({ code: 'CS302', name: 'Advanced AI', id: 'c2', professor: 'Dr. Adams' }),
        makeCourse({ code: 'CS301', name: 'Advanced Algorithms' }),
      ],
    });
    expect(result[0].title).toContain('Algorithms');
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it('limits results to 20', () => {
    const courses = Array.from({ length: 25 }, (_, i) =>
      makeCourse({ code: `C${i}`, name: `Course ${i}`, id: `c${i}` }),
    );
    const result = searchAll({ ...empty(), query: 'course', courses });
    expect(result.length).toBeLessThanOrEqual(20);
  });
});
