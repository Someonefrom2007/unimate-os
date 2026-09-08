/**
 * SearchEngine — pure fuzzy multi-entity search across Courses, Tasks, Exams,
 * Notes, Resources, ScheduleEntries, and Goals. No React, no persistence.
 */
import type { Course } from '../domain/model/Course';
import type { Task } from '../domain/model/Task';
import type { Exam } from '../domain/model/Exam';
import type { Note } from '../domain/model/Note';
import type { Resource } from '../domain/model/Resource';
import type { CalendarEvent } from '../domain/model/CalendarEvent';
import type { Goal } from '../domain/model/Goal';
import { TaskPriority, TaskStatus } from '../domain/enums';

/** The view key each entity maps to when navigated. */
export type EntityView = 'courses' | 'tasks' | 'assessments' | 'notes' | 'resources' | 'schedule' | 'goals';

/** A single search result item. */
export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  view: EntityView;
  /** 0-1 relevance score (higher = better match). */
  score: number;
}

/** Normalised text used for matching (lower-case, collapsed whitespace). */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Simple fuzzy token match: every word in `query` must appear (as a substring) in `target`. */
function fuzzyMatch(query: string, target: string): number {
  const q = norm(query);
  const t = norm(target);
  if (!q) return 1; // empty query matches everything equally
  const tokens = q.split(' ');
  if (tokens.length === 0) return 1;
  let matched = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) matched++;
  }
  const ratio = matched / tokens.length;
  // Boost: exact prefix match or full match.
  if (t.startsWith(q)) return 1.0 + ratio * 0.1;
  return ratio;
}

/** Minimum threshold to include in results. */
const MIN_SCORE = 0.3;

// ─── entity-specific formatters ──────────────────────────────────────

function courseResult(c: Course, query: string): SearchResult | null {
  const score = Math.max(fuzzyMatch(query, c.name), fuzzyMatch(query, c.code), fuzzyMatch(query, c.professor));
  if (score < MIN_SCORE) return null;
  return { id: c.id, title: `${c.code} · ${c.name}`, subtitle: `${c.professor} · ${c.ects} ECTS`, type: 'Course', view: 'courses', score };
}

function taskResult(t: Task, query: string): SearchResult | null {
  const score = Math.max(fuzzyMatch(query, t.title), fuzzyMatch(query, t.courseCode), fuzzyMatch(query, t.dueLabel));
  if (score < MIN_SCORE) return null;
  const statusLabel = t.status === TaskStatus.Completed ? '✓ Done' : t.priority === TaskPriority.High ? '⚠ High' : t.dueLabel || '';
  return { id: t.courseCode + t.title, title: t.title, subtitle: `${t.courseCode} · ${statusLabel}`, type: 'Task', view: 'tasks', score };
}

function examResult(e: Exam, query: string): SearchResult | null {
  const score = Math.max(fuzzyMatch(query, e.title), fuzzyMatch(query, e.codeLabel));
  if (score < MIN_SCORE) return null;
  return { id: e.id, title: e.title, subtitle: `${e.codeLabel} · ${e.daysUntilLabel}`, type: 'Exam', view: 'assessments', score };
}

function noteResult(n: Note, query: string): SearchResult | null {
  const score = fuzzyMatch(query, n.title);
  if (score < MIN_SCORE) return null;
  return { id: n.id, title: n.title, subtitle: n.timestampLabel || 'Note', type: 'Note', view: 'notes', score };
}

function resourceResult(r: Resource, query: string): SearchResult | null {
  const score = Math.max(fuzzyMatch(query, r.title), fuzzyMatch(query, r.courseCode || ''));
  if (score < MIN_SCORE) return null;
  return { id: r.id, title: r.title, subtitle: `${r.type} · ${r.courseCode || ''}`, type: 'Resource', view: 'resources', score };
}

function eventResult(e: CalendarEvent, query: string): SearchResult | null {
  const score = Math.max(fuzzyMatch(query, e.courseName), fuzzyMatch(query, e.room), fuzzyMatch(query, e.sessionType));
  if (score < MIN_SCORE) return null;
  return { id: e.id, title: e.courseName, subtitle: `${e.dayLabel} · ${e.timeLabel}`, type: 'Schedule', view: 'schedule', score };
}

function goalResult(g: Goal, query: string): SearchResult | null {
  const score = fuzzyMatch(query, g.name);
  if (score < MIN_SCORE) return null;
  return { id: g.id, title: g.name, subtitle: g.category || 'Goal', type: 'Goal', view: 'goals', score };
}

// ─── main search ─────────────────────────────────────────────────────

export interface SearchInput {
  query: string;
  courses: Course[];
  tasks: Task[];
  exams: Exam[];
  notes: Note[];
  resources: Resource[];
  events: CalendarEvent[];
  goals: Goal[];
}

/** Run a fuzzy search across all entity types and return ranked results. */
export function searchAll(input: SearchInput): SearchResult[] {
  const { query } = input;
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const c of input.courses) { const r = courseResult(c, query); if (r) results.push(r); }
  for (const t of input.tasks) { const r = taskResult(t, query); if (r) results.push(r); }
  for (const e of input.exams) { const r = examResult(e, query); if (r) results.push(r); }
  for (const n of input.notes) { const r = noteResult(n, query); if (r) results.push(r); }
  for (const r of input.resources) { const rs = resourceResult(r, query); if (rs) results.push(rs); }
  for (const ev of input.events) { const r = eventResult(ev, query); if (r) results.push(r); }
  for (const g of input.goals) { const r = goalResult(g, query); if (r) results.push(r); }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
