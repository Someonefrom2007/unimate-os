/**
 * AIContextEngine unit tests — context generation and system prompt.
 */
import { describe, expect, it } from 'vitest';
import { buildAIContext, systemPromptFromContext } from './aiContextEngine';
import type { Course } from '../domain/model/Course';
import type { Task } from '../domain/model/Task';
import type { Grade } from '../domain/model/Grade';
import type { StudySession } from '../domain/model/StudySession';
import { TaskPriority, TaskStatus } from '../domain/enums';

function makeCourse(overrides: Partial<Course> & { code: string; name: string }): Course {
  return { id: 'c1', ects: 6, professor: 'Dr. Smith', syllabusProgress: 50, accent: 'primary', status: 'active', avgGrade: 7.5, semesterType: 'fall', year: 2025, ...overrides };
}

function makeTask(overrides: Partial<Task> & { title: string }): Task {
  return { courseId: null, courseCode: 'CS301', priority: TaskPriority.Medium, status: TaskStatus.Pending, estimatedHours: 2, subtaskSummary: '', dueLabel: 'Mon', completed: false, sortOrder: 1, ...overrides };
}

function makeGrade(overrides: Partial<Grade> & { assessmentName: string }): Grade {
  return { id: 'g1', courseId: null, courseCode: 'CS301', weight: 20, grade: 8, maxGrade: 10, dateLabel: '2025-10-01', sortOrder: 0, ...overrides };
}

function makeSession(overrides: Partial<StudySession>): StudySession {
  return { id: 'fs1', courseCode: 'CS301', taskLabel: 'Study', durationMinutes: 50, sessionType: 'deep_work' as never, dateLabel: '', timeLabel: '', completed: true, sortOrder: 0, ...overrides };
}

describe('buildAIContext', () => {
  it('generates markdown with all sections', () => {
    const ctx = buildAIContext(
      [makeCourse({ code: 'CS301', name: 'Algorithms', avgGrade: 8.0 })],
      [
        makeTask({ title: 'Overdue HW', dueLabel: 'Mon (2d overdue)', priority: TaskPriority.High }),
        makeTask({ title: 'Normal task', id: 't2', dueLabel: 'Wed' }),
      ],
      [{ id: 'e1', codeLabel: 'CS301', title: 'Midterm', weightLabel: '30%', targetGrade: '8', daysUntilLabel: '5', accent: 'primary' }],
      [makeGrade({ assessmentName: 'HW1', grade: 8, maxGrade: 10, weight: 20 })],
      [makeSession({ completed: true, durationMinutes: 60 })],
    );
    expect(ctx.markdown).toContain('# Student Academic Context');
    expect(ctx.markdown).toContain('Average Grade');
    expect(ctx.markdown).toContain('Algorithms');
    expect(ctx.markdown).toContain('Overdue');
    expect(ctx.markdown).toContain('Midterm');
    expect(ctx.summary.averageGrade).toBeGreaterThan(0);
    expect(ctx.summary.pendingTaskCount).toBe(2);
    expect(ctx.summary.overdueTaskCount).toBe(1);
  });

  it('handles empty data gracefully', () => {
    const ctx = buildAIContext([], [], [], [], []);
    expect(ctx.markdown).toContain('Average Grade');
    expect(ctx.summary.courseCount).toBe(0);
    expect(ctx.summary.pendingTaskCount).toBe(0);
    expect(ctx.summary.overdueTaskCount).toBe(0);
  });

  it('computes weighted average grade from grades', () => {
    const grades = [
      makeGrade({ assessmentName: 'A', grade: 7, maxGrade: 10, weight: 10, id: 'g1' }),
      makeGrade({ assessmentName: 'B', grade: 9, maxGrade: 10, weight: 30, id: 'g2' }),
    ];
    const ctx = buildAIContext([], [], [], grades, []);
    // (7*10 + 9*30) / 40 = (70+270)/40 = 8.5
    expect(ctx.summary.averageGrade).toBe(8.5);
  });

  it('counts exams within week', () => {
    const exams = [
      { id: 'e1', codeLabel: 'CS', title: 'Quiz 1', weightLabel: '10%', targetGrade: '8', daysUntilLabel: '3', accent: 'primary' },
      { id: 'e2', codeLabel: 'CS', title: 'Final', weightLabel: '40%', targetGrade: '8', daysUntilLabel: '20', accent: 'secondary' },
    ];
    const ctx = buildAIContext([], [], exams, [], []);
    expect(ctx.summary.examsWithinWeek).toBe(1);
    expect(ctx.summary.examCount).toBe(2);
  });

  it('calculates focus hours', () => {
    const sessions = [
      makeSession({ completed: true, durationMinutes: 60 }),
      makeSession({ completed: true, durationMinutes: 90, id: 'fs2' }),
      makeSession({ completed: false, durationMinutes: 30, id: 'fs3' }),
    ];
    const ctx = buildAIContext([], [], [], [], sessions);
    // Only completed: 150 min = 2.5h
    expect(ctx.summary.weeklyFocusHours).toBe(2.5);
  });
});

describe('systemPromptFromContext', () => {
  it('contains key summary values', () => {
    const ctx = buildAIContext(
      [makeCourse({ code: 'CS301', name: 'Algo', avgGrade: 8.0 })],
      [makeTask({ title: 'Task 1' })],
      [], [], [],
    );
    const prompt = systemPromptFromContext(ctx);
    expect(prompt).toContain('UNI·MATE');
    expect(prompt).toContain('1 active courses');
    expect(prompt).toContain('1 pending tasks');
    expect(prompt).toContain('Student Academic Context');
  });
});
