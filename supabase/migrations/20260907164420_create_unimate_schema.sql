/*
# UNI·MATE 2.0 — Academic OS Schema

## Overview
Creates the full data model for a single-tenant academic dashboard app (no auth).
All tables are intentionally shared/public since there is no sign-in screen.

## New Tables
1. `courses` — Active university courses with syllabus progress and grades.
2. `tasks` — Weekly deliverables and deadlines linked to courses.
3. `assessments` — Upcoming exam and assessment milestones.
4. `schedule_entries` — Weekly timetable grid entries (Mon–Fri).
5. `notes` — Quick-access document and resource links.
6. `habits` — Academic habit trackers with streaks and progress.
7. `quick_thoughts` — Scratchpad checklist items.

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in — data is intentionally public.
*/

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  professor text NOT NULL,
  ects numeric NOT NULL DEFAULT 0,
  room text NOT NULL DEFAULT '',
  syllabus_progress integer NOT NULL DEFAULT 0 CHECK (syllabus_progress >= 0 AND syllabus_progress <= 100),
  avg_grade numeric NOT NULL DEFAULT 0,
  grade_label text NOT NULL DEFAULT '',
  next_session_label text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE
  TO anon, authenticated USING (true);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  course_code text NOT NULL DEFAULT '',
  title text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  estimated_hours numeric NOT NULL DEFAULT 0,
  subtask_summary text NOT NULL DEFAULT '',
  due_label text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  code_label text NOT NULL,
  title text NOT NULL,
  weight_label text NOT NULL DEFAULT '',
  target_grade text NOT NULL DEFAULT '',
  days_until_label text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assessments" ON assessments;
CREATE POLICY "anon_select_assessments" ON assessments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assessments" ON assessments;
CREATE POLICY "anon_insert_assessments" ON assessments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assessments" ON assessments;
CREATE POLICY "anon_update_assessments" ON assessments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assessments" ON assessments;
CREATE POLICY "anon_delete_assessments" ON assessments FOR DELETE
  TO anon, authenticated USING (true);

-- Schedule entries
CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_label text NOT NULL,
  date_label text NOT NULL DEFAULT '',
  is_today boolean NOT NULL DEFAULT false,
  time_label text NOT NULL,
  course_name text NOT NULL,
  room text NOT NULL DEFAULT '',
  session_type text NOT NULL DEFAULT '',
  is_next boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedule" ON schedule_entries;
CREATE POLICY "anon_select_schedule" ON schedule_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_schedule" ON schedule_entries;
CREATE POLICY "anon_insert_schedule" ON schedule_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_schedule" ON schedule_entries;
CREATE POLICY "anon_update_schedule" ON schedule_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_schedule" ON schedule_entries;
CREATE POLICY "anon_delete_schedule" ON schedule_entries FOR DELETE
  TO anon, authenticated USING (true);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'description',
  timestamp_label text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE
  TO anon, authenticated USING (true);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  streak_label text NOT NULL DEFAULT '',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  detail_label text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_habits" ON habits;
CREATE POLICY "anon_select_habits" ON habits FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_habits" ON habits;
CREATE POLICY "anon_insert_habits" ON habits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_habits" ON habits;
CREATE POLICY "anon_update_habits" ON habits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_habits" ON habits;
CREATE POLICY "anon_delete_habits" ON habits FOR DELETE
  TO anon, authenticated USING (true);

-- Quick thoughts (scratchpad)
CREATE TABLE IF NOT EXISTS quick_thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE quick_thoughts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_thoughts" ON quick_thoughts;
CREATE POLICY "anon_select_thoughts" ON quick_thoughts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_thoughts" ON quick_thoughts;
CREATE POLICY "anon_insert_thoughts" ON quick_thoughts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_thoughts" ON quick_thoughts;
CREATE POLICY "anon_update_thoughts" ON quick_thoughts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_thoughts" ON quick_thoughts;
CREATE POLICY "anon_delete_thoughts" ON quick_thoughts FOR DELETE
  TO anon, authenticated USING (true);
