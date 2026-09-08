import { describe, it, expect } from 'vitest';
import {
  profileSchema,
  courseSchema,
  taskSchema,
  examSchema,
  gradeSchema,
  settingsSchema,
} from '../validation/schemas';
import {
  AccentColor,
  CourseStatus,
  ExamType,
  TaskPriority,
  TaskStatus,
} from '../../core/domain/enums';

describe('profileSchema', () => {
  it('accepts a valid profile payload', () => {
    const result = profileSchema.safeParse({
      id: 'p1',
      name: 'Alex Karimi',
      initials: 'AK',
      email: 'alex@student.tudelft.nl',
      university: 'TU Delft',
      degree: 'BSc CS',
      yearLabel: 'Year 3',
      semesterLabel: 'Fall 2025',
      targetGpa: 8,
      totalEcts: 180,
      completedEcts: 120,
      accent: AccentColor.Primary,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = profileSchema.safeParse({
      id: 'p1',
      name: 'Alex',
      email: 'not-an-email',
      university: 'U',
      degree: 'B',
      yearLabel: 'Y',
      semesterLabel: 'S',
      targetGpa: 8,
      totalEcts: 1,
      completedEcts: 1,
      accent: AccentColor.Primary,
    });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range GPA', () => {
    const result = profileSchema.safeParse({
      id: 'p1',
      name: 'Alex',
      email: 'a@b.co',
      university: 'U',
      degree: 'B',
      yearLabel: 'Y',
      semesterLabel: 'S',
      targetGpa: 11,
      totalEcts: 1,
      completedEcts: 1,
      accent: AccentColor.Primary,
    });
    expect(result.success).toBe(false);
  });
});

describe('courseSchema', () => {
  const valid = {
    id: 'c1',
    semesterId: null,
    code: 'CS301',
    name: 'Advanced OS',
    professor: 'Dr. Mercer',
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

  it('accepts a valid course', () => {
    expect(courseSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects out-of-range syllabus progress', () => {
    expect(courseSchema.safeParse({ ...valid, syllabusProgress: 101 }).success).toBe(false);
    expect(courseSchema.safeParse({ ...valid, syllabusProgress: -1 }).success).toBe(false);
  });

  it('rejects an invalid status', () => {
    expect(courseSchema.safeParse({ ...valid, status: 'bogus' }).success).toBe(false);
  });

  it('accepts a nullable semesterId (no semester assigned)', () => {
    expect(courseSchema.safeParse({ ...valid, semesterId: null }).success).toBe(true);
  });
});

describe('taskSchema', () => {
  const valid = {
    id: 't1',
    courseId: 'c1',
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

  it('accepts a valid task', () => {
    expect(taskSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty title', () => {
    expect(taskSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects negative estimated hours', () => {
    expect(taskSchema.safeParse({ ...valid, estimatedHours: -2 }).success).toBe(false);
  });

  it('rejects invalid priority', () => {
    expect(taskSchema.safeParse({ ...valid, priority: 'urgent' }).success).toBe(false);
  });
});

describe('examSchema', () => {
  const valid = {
    id: 'e1',
    courseId: null,
    codeLabel: 'CS301 MIDTERM',
    title: 'Distributed Systems Exam',
    weightLabel: '35% of Final',
    targetGrade: '>8.5',
    daysUntilLabel: 'In 6 Days',
    type: ExamType.Midterm,
    accent: AccentColor.Primary,
    sortOrder: 1,
  };

  it('accepts a valid exam', () => {
    expect(examSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched exam type', () => {
    expect(examSchema.safeParse({ ...valid, type: 'semifinal' }).success).toBe(false);
  });

  it('rejects empty code label', () => {
    expect(examSchema.safeParse({ ...valid, codeLabel: '' }).success).toBe(false);
  });
});

describe('gradeSchema', () => {
  const valid = {
    id: 'g1',
    courseId: null,
    courseCode: 'CS301',
    assessmentName: 'Midterm 1',
    weight: 20,
    grade: 8.2,
    maxGrade: 10,
    dateLabel: 'Oct 15, 2025',
    sortOrder: 1,
  };

  it('accepts a valid grade', () => {
    expect(gradeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects grade above max', () => {
    expect(gradeSchema.safeParse({ ...valid, grade: 11 }).success).toBe(false);
  });

  it('rejects weight > 100', () => {
    expect(gradeSchema.safeParse({ ...valid, weight: 101 }).success).toBe(false);
  });
});

describe('settingsSchema', () => {
  const valid = {
    id: 's1',
    darkMode: true,
    accentColor: '#f5a623',
    language: 'English',
    notificationPrefs: {
      exam: true,
      deadline: true,
      class: true,
      streak: false,
      goal: true,
      workload: true,
    },
    studyReminder: false,
    quietHours: false,
    defaultAccent: AccentColor.Primary,
  };

  it('accepts a valid settings payload', () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid hex accent color', () => {
    expect(settingsSchema.safeParse({ ...valid, accentColor: 'blue' }).success).toBe(false);
  });
});