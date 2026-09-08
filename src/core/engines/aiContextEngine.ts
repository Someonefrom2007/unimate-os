/**
 * AIContextEngine — pure domain formatters that serialise the current
 * student state into structured markdown context for an AI assistant.
 * No React, no persistence.
 */
import type { Course } from '../domain/model/Course';
import type { Task } from '../domain/model/Task';
import type { Exam } from '../domain/model/Exam';
import type { Grade } from '../domain/model/Grade';
import type { StudySession } from '../domain/model/StudySession';
import { TaskPriority, TaskStatus } from '../domain/enums';

/** The structured context block fed to the AI assistant. */
export interface AIContext {
  /** Markdown-formatted system context block. */
  markdown: string;
  /** Structured data for programmatic use. */
  summary: {
    averageGrade: number;
    totalEcts: number;
    pendingTaskCount: number;
    overdueTaskCount: number;
    examCount: number;
    examsWithinWeek: number;
    weeklyFocusHours: number;
    courseCount: number;
  };
}

// ─── helpers ──────────────────────────────────────────────────────────

function gradeDisplay(avgGrade: number): string {
  return `${avgGrade.toFixed(1)} / 10`;
}

// ─── public API ──────────────────────────────────────────────────────

export function buildAIContext(
  courses: Course[],
  tasks: Task[],
  exams: Exam[],
  grades: Grade[],
  sessions: StudySession[],
): AIContext {
  const pendingTasks = tasks.filter((t) => t.status !== TaskStatus.Completed);
  const overdueTasks = pendingTasks.filter((t) => /overdue|yesterday/i.test(t.dueLabel));
  const highPriorityPending = pendingTasks.filter((t) => t.priority === TaskPriority.High);

  const tw = grades.reduce((s, g) => s + g.weight, 0);
  const averageGrade = tw > 0
    ? grades.reduce((s, g) => s + (g.grade / g.maxGrade) * 10 * g.weight, 0) / tw
    : courses.length > 0
      ? courses.reduce((s, c) => s + c.avgGrade, 0) / courses.length
      : 0;

  const totalEcts = courses.reduce((s, c) => s + c.ects, 0);

  const weeklyFocusMinutes = sessions.reduce((s, f) => s + (f.completed ? f.durationMinutes : 0), 0);
  const weeklyFocusHours = Math.round(weeklyFocusMinutes / 60 * 10) / 10;

  const examsWithinWeek = exams.filter((e) => {
    const n = parseInt(e.daysUntilLabel, 10);
    return !isNaN(n) && n >= 0 && n <= 7;
  });

  // ── build markdown ──────────────────────────────────────────────

  const lines: string[] = [];
  lines.push('# Student Academic Context');
  lines.push('');
  lines.push(`**Average Grade:** ${gradeDisplay(averageGrade)}`);
  lines.push(`**Active Courses:** ${courses.length} (${totalEcts} ECTS)`);
  lines.push(`**Pending Tasks:** ${pendingTasks.length}${overdueTasks.length > 0 ? ` (${overdueTasks.length} overdue!)` : ''}`);
  lines.push(`**Weekly Focus:** ${weeklyFocusHours}h`);
  lines.push('');

  // Courses
  if (courses.length > 0) {
    lines.push('## Courses');
    for (const c of courses) {
      lines.push(`- **${c.code}** ${c.name} — Avg: ${c.avgGrade.toFixed(1)}/10, Progress: ${c.syllabusProgress}%`);
    }
    lines.push('');
  }

  // Overdue tasks
  if (overdueTasks.length > 0) {
    lines.push('## ⚠️ Overdue Tasks');
    for (const t of overdueTasks.slice(0, 5)) {
      lines.push(`- "${t.title}" (${t.courseCode}) — ${t.dueLabel}`);
    }
    lines.push('');
  }

  // High priority pending
  if (highPriorityPending.length > 0) {
    lines.push('## High-Priority Tasks');
    for (const t of highPriorityPending.slice(0, 5)) {
      lines.push(`- "${t.title}" (${t.courseCode}) — Due: ${t.dueLabel}, Est: ${t.estimatedHours}h`);
    }
    lines.push('');
  }

  // Upcoming exams
  if (examsWithinWeek.length > 0) {
    lines.push('## 📝 Exams This Week');
    for (const e of examsWithinWeek) {
      lines.push(`- **${e.title}** (${e.codeLabel}) — ${e.daysUntilLabel}, Weight: ${e.weightLabel}`);
    }
    lines.push('');
  }

  // All exams
  if (exams.length > 0) {
    lines.push('## All Upcoming Exams');
    for (const e of exams.slice(0, 6)) {
      lines.push(`- ${e.title} (${e.codeLabel}) — ${e.daysUntilLabel}`);
    }
    lines.push('');
  }

  // Focus stats
  lines.push('## Focus');
  lines.push(`- Total this week: ${weeklyFocusHours}h (${sessions.length} sessions)`);
  const completedSessions = sessions.filter((s) => s.completed);
  if (completedSessions.length > 0) {
    const avgDur = completedSessions.reduce((s, f) => s + f.durationMinutes, 0) / completedSessions.length;
    lines.push(`- Avg session: ${Math.round(avgDur)} min`);
  }
  lines.push('');
  lines.push('---');
  lines.push('Answer the student\'s questions based on this context. Be concise and actionable.');

  return {
    markdown: lines.join('\n'),
    summary: {
      averageGrade: Math.round(averageGrade * 10) / 10,
      totalEcts,
      pendingTaskCount: pendingTasks.length,
      overdueTaskCount: overdueTasks.length,
      examCount: exams.length,
      examsWithinWeek: examsWithinWeek.length,
      weeklyFocusHours,
      courseCount: courses.length,
    },
  };
}

/** Convenience: generate a short system prompt preamble from context. */
export function systemPromptFromContext(ctx: AIContext): string {
  const s = ctx.summary;
  return [
    `You are the UNI·MATE academic AI assistant.`,
    `The student has ${s.courseCount} active courses (avg grade ${s.averageGrade}/10, ${s.totalEcts} ECTS).`,
    `They have ${s.pendingTaskCount} pending tasks${s.overdueTaskCount > 0 ? ` (${s.overdueTaskCount} overdue)` : ''}.`,
    `There are ${s.examCount} upcoming exams${s.examsWithinWeek > 0 ? ` (${s.examsWithinWeek} this week)` : ''}.`,
    `Weekly focus time: ${s.weeklyFocusHours}h.`,
    '',
    ctx.markdown,
  ].join('\n');
}
