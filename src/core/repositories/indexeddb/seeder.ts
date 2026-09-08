/**
 * Database Seeder — populates IndexedDB with realistic student data.
 * Uses the RepositorySet interface so it's decoupled from specific storage backends.
 */
import {
  AccentColor,
  CourseStatus,
  ExamType,
  GoalCategory,
  GoalStatus,
  ResourceType,
  SessionType,
  TaskPriority,
  TaskStatus,
  WeekDay,
} from '../../domain/enums';
import type { Course } from '../../domain/model/Course';
import type { Task } from '../../domain/model/Task';
import type { Exam } from '../../domain/model/Exam';
import type { Grade } from '../../domain/model/Grade';
import type { Note } from '../../domain/model/Note';
import type { Profile } from '../../domain/model/Profile';
import type { Resource } from '../../domain/model/Resource';
import type { Goal } from '../../domain/model/Goal';
import type { Habit } from '../../domain/model/Habit';
import type { StudySession } from '../../domain/model/StudySession';
import type { CalendarEvent } from '../../domain/model/CalendarEvent';
import type { RepositorySet } from '../interfaces';

/* ------------------------------------------------------------------ */
/*  Deterministic IDs for seed data (stable across runs)               */
/* ------------------------------------------------------------------ */

const SID = {
  // Semester
  sem1: 'seed-semester-fall-2025',
  // Courses
  cs301: 'seed-course-cs301',
  cs302: 'seed-course-cs302',
  math201: 'seed-course-math201',
  phy101: 'seed-course-phy101',
  eng101: 'seed-course-eng101',
  // Tasks
  t1: 'seed-task-1', t2: 'seed-task-2', t3: 'seed-task-3', t4: 'seed-task-4', t5: 'seed-task-5',
  // Exams
  e1: 'seed-exam-1', e2: 'seed-exam-2', e3: 'seed-exam-3', e4: 'seed-exam-4', e5: 'seed-exam-5',
  // Grades
  g1: 'seed-grade-1', g2: 'seed-grade-2', g3: 'seed-grade-3', g4: 'seed-grade-4', g5: 'seed-grade-5',
  g6: 'seed-grade-6', g7: 'seed-grade-7', g8: 'seed-grade-8', g9: 'seed-grade-9', g10: 'seed-grade-10',
  // Notes
  n1: 'seed-note-1', n2: 'seed-note-2', n3: 'seed-note-3',
  // Focus sessions
  f1: 'seed-focus-1', f2: 'seed-focus-2', f3: 'seed-focus-3', f4: 'seed-focus-4',
  // Goals
  gl1: 'seed-goal-1', gl2: 'seed-goal-2', gl3: 'seed-goal-3',
  // Habits
  h1: 'seed-habit-1', h2: 'seed-habit-2', h3: 'seed-habit-3',
  // Profile
  profile: 'seed-profile-alejandra',
  // Resources
  r1: 'seed-resource-1', r2: 'seed-resource-2', r3: 'seed-resource-3',
  // Calendar events
  ce1: 'seed-cal-1', ce2: 'seed-cal-2', ce3: 'seed-cal-3', ce4: 'seed-cal-4', ce5: 'seed-cal-5',
} as const;

/* ------------------------------------------------------------------ */
/*  Seed data factories                                                */
/* ------------------------------------------------------------------ */

function seedProfile(): Profile {
  return {
    id: SID.profile,
    name: 'Alejandra Vega',
    initials: 'AV',
    email: 'a.vega@universidad.es',
    university: 'Universitat Politècnica de Catalunya',
    degree: 'Computer Science',
    yearLabel: 'Year 3',
    semesterLabel: 'Fall 2025',
    targetGpa: 8.0,
    totalEcts: 180,
    completedEcts: 120,
    accent: AccentColor.Primary,
  };
}

function seedCourses(): Course[] {
  return [
    {
      id: SID.cs301, semesterId: SID.sem1, code: 'CS301', name: 'Advanced Algorithms',
      professor: 'Dr. Laura Fernández', ects: 6, room: 'Turing 301',
      syllabusProgress: 72, avgGrade: 8.5, gradeLabel: 'Notable',
      nextSessionLabel: 'Mon 09:00', status: CourseStatus.Active, accent: AccentColor.Primary, sortOrder: 0,
    },
    {
      id: SID.cs302, semesterId: SID.sem1, code: 'CS302', name: 'Operating Systems',
      professor: 'Dr. Marc Oliveras', ects: 6, room: 'Turing 302',
      syllabusProgress: 58, avgGrade: 7.2, gradeLabel: 'Notable',
      nextSessionLabel: 'Tue 11:00', status: CourseStatus.Active, accent: AccentColor.Secondary, sortOrder: 1,
    },
    {
      id: SID.math201, semesterId: SID.sem1, code: 'MATH201', name: 'Linear Algebra',
      professor: 'Dr. Jordi Pujol', ects: 6, room: 'Euler 204',
      syllabusProgress: 80, avgGrade: 9.1, gradeLabel: 'Outstanding',
      nextSessionLabel: 'Wed 08:30', status: CourseStatus.Active, accent: AccentColor.Tertiary, sortOrder: 2,
    },
    {
      id: SID.phy101, semesterId: SID.sem1, code: 'PHY101', name: 'Quantum Mechanics',
      professor: 'Dr. Núria Serra', ects: 6, room: 'Hawking Lab',
      syllabusProgress: 45, avgGrade: 6.8, gradeLabel: 'Sufficient',
      nextSessionLabel: 'Thu 14:00', status: CourseStatus.Active, accent: AccentColor.Primary, sortOrder: 3,
    },
    {
      id: SID.eng101, semesterId: SID.sem1, code: 'ENG101', name: 'Technical Writing',
      professor: 'Dr. Emily Harper', ects: 3, room: 'Seminar A',
      syllabusProgress: 90, avgGrade: 8.9, gradeLabel: 'Notable',
      nextSessionLabel: 'Fri 10:00', status: CourseStatus.Active, accent: AccentColor.Secondary, sortOrder: 4,
    },
  ];
}

function seedTasks(): Task[] {
  return [
    { id: SID.t1, courseId: SID.cs301, courseCode: 'CS301', title: 'Implement A* pathfinding', priority: TaskPriority.High, status: TaskStatus.InProgress, estimatedHours: 5, subtaskSummary: '2/3', dueLabel: 'Wed Dec 18 (2d)', completed: false, sortOrder: 0 },
    { id: SID.t2, courseId: SID.cs302, courseCode: 'CS302', title: 'Write process scheduler report', priority: TaskPriority.Medium, status: TaskStatus.Pending, estimatedHours: 8, subtaskSummary: '0/4', dueLabel: 'Fri Dec 20 (4d)', completed: false, sortOrder: 1 },
    { id: SID.t3, courseId: SID.math201, courseCode: 'MATH201', title: 'Eigenvalue problem set', priority: TaskPriority.High, status: TaskStatus.Pending, estimatedHours: 3, subtaskSummary: '', dueLabel: 'Tue Dec 17 (1d)', completed: false, sortOrder: 2 },
    { id: SID.t4, courseId: SID.phy101, courseCode: 'PHY101', title: 'Schrödinger equation HW', priority: TaskPriority.Low, status: TaskStatus.Pending, estimatedHours: 4, subtaskSummary: '0/5', dueLabel: 'Thu Dec 19 (3d)', completed: false, sortOrder: 3 },
    { id: SID.t5, courseId: SID.eng101, courseCode: 'ENG101', title: 'Proofread thesis abstract', priority: TaskPriority.Medium, status: TaskStatus.Completed, estimatedHours: 1, subtaskSummary: '2/2', dueLabel: 'Mon Dec 16 (0d)', completed: true, sortOrder: 4 },
  ];
}

function seedExams(): Exam[] {
  return [
    { id: SID.e1, courseId: SID.cs301, codeLabel: 'CS301', title: 'Algorithms Final', weightLabel: '40%', targetGrade: '8.5', daysUntilLabel: 'In 8 Days', type: ExamType.Final, accent: AccentColor.Primary, sortOrder: 0 },
    { id: SID.e2, courseId: SID.cs302, codeLabel: 'CS302', title: 'OS Project Demo', weightLabel: '35%', targetGrade: '7.5', daysUntilLabel: 'In 12 Days', type: ExamType.Practical, accent: AccentColor.Secondary, sortOrder: 1 },
    { id: SID.e3, courseId: SID.math201, codeLabel: 'MATH201', title: 'Linear Algebra Final', weightLabel: '50%', targetGrade: '9.0', daysUntilLabel: 'In 15 Days', type: ExamType.Final, accent: AccentColor.Tertiary, sortOrder: 2 },
    { id: SID.e4, courseId: SID.phy101, codeLabel: 'PHY101', title: 'Quantum Midterm', weightLabel: '30%', targetGrade: '6.0', daysUntilLabel: '5d overdue', type: ExamType.Midterm, accent: AccentColor.Primary, sortOrder: 3 },
    { id: SID.e5, courseId: SID.eng101, codeLabel: 'ENG101', title: 'Portfolio Submission', weightLabel: '60%', targetGrade: '8.0', daysUntilLabel: 'Today', type: ExamType.Capstone, accent: AccentColor.Secondary, sortOrder: 4 },
  ];
}

function seedGrades(): Grade[] {
  return [
    { id: SID.g1, courseId: SID.cs301, courseCode: 'CS301', assessmentName: 'Assignment 1', weight: 20, grade: 8.5, maxGrade: 10, dateLabel: 'Oct 15', sortOrder: 0 },
    { id: SID.g2, courseId: SID.cs301, courseCode: 'CS301', assessmentName: 'Midterm', weight: 30, grade: 9.0, maxGrade: 10, dateLabel: 'Nov 10', sortOrder: 1 },
    { id: SID.g3, courseId: SID.cs302, courseCode: 'CS302', assessmentName: 'Lab 1', weight: 15, grade: 7.0, maxGrade: 10, dateLabel: 'Oct 20', sortOrder: 2 },
    { id: SID.g4, courseId: SID.cs302, courseCode: 'CS302', assessmentName: 'Midterm', weight: 35, grade: 7.5, maxGrade: 10, dateLabel: 'Nov 12', sortOrder: 3 },
    { id: SID.g5, courseId: SID.math201, courseCode: 'MATH201', assessmentName: 'Problem Set 1', weight: 25, grade: 9.5, maxGrade: 10, dateLabel: 'Oct 8', sortOrder: 4 },
    { id: SID.g6, courseId: SID.math201, courseCode: 'MATH201', assessmentName: 'Midterm', weight: 30, grade: 8.8, maxGrade: 10, dateLabel: 'Nov 5', sortOrder: 5 },
    { id: SID.g7, courseId: SID.phy101, courseCode: 'PHY101', assessmentName: 'Lab Report 1', weight: 20, grade: 6.5, maxGrade: 10, dateLabel: 'Oct 25', sortOrder: 6 },
    { id: SID.g8, courseId: SID.phy101, courseCode: 'PHY101', assessmentName: 'Quiz 1', weight: 15, grade: 7.0, maxGrade: 10, dateLabel: 'Nov 8', sortOrder: 7 },
    { id: SID.g9, courseId: SID.eng101, courseCode: 'ENG101', assessmentName: 'Essay 1', weight: 40, grade: 9.2, maxGrade: 10, dateLabel: 'Oct 30', sortOrder: 8 },
    { id: SID.g10, courseId: SID.eng101, courseCode: 'ENG101', assessmentName: 'Peer Review', weight: 20, grade: 8.5, maxGrade: 10, dateLabel: 'Nov 15', sortOrder: 9 },
  ];
}

function seedNotes(): Note[] {
  return [
    { id: SID.n1, title: 'Dijkstra Algorithm Notes', icon: '📄', timestampLabel: '2h ago', accent: AccentColor.Primary, sortOrder: 0 },
    { id: SID.n2, title: 'OS Thread Scheduling', icon: '🗂', timestampLabel: 'Yesterday', accent: AccentColor.Secondary, sortOrder: 1 },
    { id: SID.n3, title: 'Eigenvalue Cheat Sheet', icon: '📐', timestampLabel: '3 days ago', accent: AccentColor.Tertiary, sortOrder: 2 },
  ];
}

function seedResources(): Resource[] {
  return [
    { id: SID.r1, courseCode: 'CS301', title: 'Algorithms.pdf', type: ResourceType.Pdf, url: '/docs/algorithms.pdf', sizeLabel: '2.3 MB', timestampLabel: 'Oct 10', favorite: true, sortOrder: 0 },
    { id: SID.r2, courseCode: 'CS302', title: 'OS Kernel Notes', type: ResourceType.Document, url: '/docs/os-notes.docx', sizeLabel: '1.1 MB', timestampLabel: 'Nov 5', favorite: false, sortOrder: 1 },
    { id: SID.r3, courseCode: 'MATH201', title: 'Eigenvalue Tutorial', type: ResourceType.Video, url: 'https://youtu.be/example', sizeLabel: '—', timestampLabel: 'Nov 12', favorite: true, sortOrder: 2 },
  ];
}

function seedFocusSessions(): StudySession[] {
  return [
    { id: SID.f1, courseCode: 'CS301', taskLabel: 'A* implementation', durationMinutes: 50, sessionType: SessionType.DeepWork, dateLabel: 'Dec 12, 2025', timeLabel: '18:00', completed: true, sortOrder: 0 },
    { id: SID.f2, courseCode: 'CS302', taskLabel: 'Scheduling report', durationMinutes: 25, sessionType: SessionType.Pomodoro, dateLabel: 'Dec 13, 2025', timeLabel: '14:30', completed: true, sortOrder: 1 },
    { id: SID.f3, courseCode: 'MATH201', taskLabel: 'Eigenvalue problems', durationMinutes: 40, sessionType: SessionType.Review, dateLabel: 'Dec 14, 2025', timeLabel: '20:00', completed: true, sortOrder: 2 },
    { id: SID.f4, courseCode: 'PHY101', taskLabel: 'Quantum lecture review', durationMinutes: 30, sessionType: SessionType.Pomodoro, dateLabel: 'Dec 15, 2025', timeLabel: '09:00', completed: true, sortOrder: 3 },
  ];
}

function seedGoals(): Goal[] {
  return [
    { id: SID.gl1, name: 'GPA above 8.5', description: 'Maintain a GPA ≥ 8.5 this semester', category: GoalCategory.Academic, targetValue: 8.5, currentValue: 8.0, unit: 'GPA', deadlineLabel: 'Dec 2025', status: GoalStatus.Active, sortOrder: 0 },
    { id: SID.gl2, name: 'Complete 30 pomodoros', description: 'Study consistency challenge', category: GoalCategory.Study, targetValue: 30, currentValue: 18, unit: 'sessions', deadlineLabel: 'Dec 2025', status: GoalStatus.Active, sortOrder: 1 },
    { id: SID.gl3, name: 'Run 3x/week', description: 'Health habit tracking', category: GoalCategory.Health, targetValue: 12, currentValue: 8, unit: 'runs', deadlineLabel: 'Dec 2025', status: GoalStatus.Active, sortOrder: 2 },
  ];
}

function seedHabits(): Habit[] {
  return [
    { id: SID.h1, name: 'Daily Review', streakLabel: '12-day streak', progressPercent: 85, detailLabel: '6/7 this week', accent: AccentColor.Primary, sortOrder: 0 },
    { id: SID.h2, name: 'Morning Reading', streakLabel: '5-day streak', progressPercent: 71, detailLabel: '5/7 this week', accent: AccentColor.Secondary, sortOrder: 1 },
    { id: SID.h3, name: 'Code Practice', streakLabel: '8-day streak', progressPercent: 100, detailLabel: '7/7 this week', accent: AccentColor.Tertiary, sortOrder: 2 },
  ];
}

function seedCalendarEvents(): CalendarEvent[] {
  return [
    { id: SID.ce1, courseId: SID.cs301, courseName: 'Advanced Algorithms', dayOfWeek: WeekDay.Monday, dayLabel: 'Monday', dateLabel: 'December 15, 2025', isToday: true, timeLabel: '09:00 - 10:30', room: 'Turing 301', sessionType: 'lecture', isNext: true, sortOrder: 0 },
    { id: SID.ce2, courseId: SID.cs302, courseName: 'Operating Systems', dayOfWeek: WeekDay.Tuesday, dayLabel: 'Tuesday', dateLabel: 'December 16, 2025', isToday: false, timeLabel: '11:00 - 12:30', room: 'Turing 302', sessionType: 'lecture', isNext: false, sortOrder: 1 },
    { id: SID.ce3, courseId: SID.math201, courseName: 'Linear Algebra', dayOfWeek: WeekDay.Wednesday, dayLabel: 'Wednesday', dateLabel: 'December 17, 2025', isToday: false, timeLabel: '08:30 - 10:00', room: 'Euler 204', sessionType: 'lecture', isNext: false, sortOrder: 2 },
    { id: SID.ce4, courseId: SID.phy101, courseName: 'Quantum Mechanics', dayOfWeek: WeekDay.Thursday, dayLabel: 'Thursday', dateLabel: 'December 18, 2025', isToday: false, timeLabel: '14:00 - 16:00', room: 'Hawking Lab', sessionType: 'practical', isNext: false, sortOrder: 3 },
    { id: SID.ce5, courseId: SID.eng101, courseName: 'Technical Writing', dayOfWeek: WeekDay.Friday, dayLabel: 'Friday', dateLabel: 'December 19, 2025', isToday: false, timeLabel: '10:00 - 11:30', room: 'Seminar A', sessionType: 'seminar', isNext: false, sortOrder: 4 },
  ];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Check if the database already contains seed data. */
export async function isDatabaseSeeded(repos: RepositorySet): Promise<boolean> {
  const profile = await repos.profile.getActive();
  return profile !== null;
}

/** Populate all repositories with realistic demo data. */
export async function seedDatabase(repos: RepositorySet): Promise<void> {
  // Profile (single row — upsert)
  await repos.profile.save(seedProfile());

  // Multi-row stores — saveMany for efficiency
  await repos.course.saveMany(seedCourses());
  await repos.task.saveMany(seedTasks());
  await repos.exam.saveMany(seedExams());
  await repos.grade.saveMany(seedGrades());
  await repos.note.saveMany(seedNotes());
  await repos.resource.saveMany(seedResources());
  await repos.focus.saveMany(seedFocusSessions());
  await repos.goal.saveMany(seedGoals());
  await repos.habit.saveMany(seedHabits());
  await repos.schedule.saveMany(seedCalendarEvents());
}

/** Wipe every store completely — returns app to clean slate. */
export async function resetDatabase(repos: RepositorySet): Promise<void> {
  await repos.profile.clear();
  await repos.course.clear();
  await repos.task.clear();
  await repos.exam.clear();
  await repos.grade.clear();
  await repos.note.clear();
  await repos.resource.clear();
  await repos.focus.clear();
  await repos.goal.clear();
  await repos.habit.clear();
  await repos.schedule.clear();
}

/** Full reseed: wipe first, then seed fresh demo data. */
export async function reseedDatabase(repos: RepositorySet): Promise<void> {
  await resetDatabase(repos);
  await seedDatabase(repos);
}

/** Seed only if database is currently empty. */
export async function seedIfEmpty(repos: RepositorySet): Promise<boolean> {
  const seeded = await isDatabaseSeeded(repos);
  if (!seeded) {
    await seedDatabase(repos);
    return true;
  }
  return false;
}