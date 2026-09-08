/*
# UNI·MATE 2.0 — Extended Schema

## Overview
Adds tables for grades, goals, focus sessions, resources, notifications,
and student profile to support the full UNI·MATE spec. Single-tenant, no auth.

## New Tables
1. `grade_entries` — Individual assessment grades linked to courses.
2. `goals` — Academic and personal goals with progress tracking.
3. `focus_sessions` — Pomodoro/study session history.
4. `resources` — University materials (PDFs, links, docs).
5. `notifications` — In-app notification feed.
6. `profile` — Student identity (single row).

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in.
*/

-- Grade entries
CREATE TABLE IF NOT EXISTS grade_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  course_code text NOT NULL DEFAULT '',
  assessment_name text NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  grade numeric NOT NULL DEFAULT 0,
  max_grade numeric NOT NULL DEFAULT 10,
  date_label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE grade_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_grades" ON grade_entries;
CREATE POLICY "anon_select_grades" ON grade_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_grades" ON grade_entries;
CREATE POLICY "anon_insert_grades" ON grade_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_grades" ON grade_entries;
CREATE POLICY "anon_update_grades" ON grade_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_grades" ON grade_entries;
CREATE POLICY "anon_delete_grades" ON grade_entries FOR DELETE
  TO anon, authenticated USING (true);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'academic',
  target_value numeric NOT NULL DEFAULT 100,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  deadline_label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_goals" ON goals;
CREATE POLICY "anon_select_goals" ON goals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
CREATE POLICY "anon_insert_goals" ON goals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_goals" ON goals;
CREATE POLICY "anon_update_goals" ON goals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "anon_delete_goals" ON goals FOR DELETE
  TO anon, authenticated USING (true);

-- Focus sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL DEFAULT '',
  task_label text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 25,
  session_type text NOT NULL DEFAULT 'pomodoro',
  date_label text NOT NULL DEFAULT '',
  time_label text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_focus" ON focus_sessions;
CREATE POLICY "anon_select_focus" ON focus_sessions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_focus" ON focus_sessions;
CREATE POLICY "anon_insert_focus" ON focus_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_focus" ON focus_sessions;
CREATE POLICY "anon_update_focus" ON focus_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_focus" ON focus_sessions;
CREATE POLICY "anon_delete_focus" ON focus_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL DEFAULT '',
  title text NOT NULL,
  type text NOT NULL DEFAULT 'pdf',
  url text NOT NULL DEFAULT '',
  size_label text NOT NULL DEFAULT '',
  timestamp_label text NOT NULL DEFAULT '',
  favorite boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_resources" ON resources;
CREATE POLICY "anon_select_resources" ON resources FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_resources" ON resources;
CREATE POLICY "anon_insert_resources" ON resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_resources" ON resources;
CREATE POLICY "anon_update_resources" ON resources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_resources" ON resources;
CREATE POLICY "anon_delete_resources" ON resources FOR DELETE
  TO anon, authenticated USING (true);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  timestamp_label text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  accent text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Profile (single row)
CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Alex Karimi',
  initials text NOT NULL DEFAULT 'AK',
  university text NOT NULL DEFAULT 'TU Delft',
  degree text NOT NULL DEFAULT 'BSc Computer Science',
  year_label text NOT NULL DEFAULT 'Year 3',
  semester_label text NOT NULL DEFAULT 'Fall 2025',
  target_gpa numeric NOT NULL DEFAULT 8.0,
  total_ects numeric NOT NULL DEFAULT 180,
  completed_ects numeric NOT NULL DEFAULT 120,
  accent text NOT NULL DEFAULT 'primary'
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profile" ON profile;
CREATE POLICY "anon_select_profile" ON profile FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
CREATE POLICY "anon_insert_profile" ON profile FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profile" ON profile;
CREATE POLICY "anon_update_profile" ON profile FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profile" ON profile;
CREATE POLICY "anon_delete_profile" ON profile FOR DELETE
  TO anon, authenticated USING (true);
