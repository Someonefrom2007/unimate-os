-- Seed data for UNI·MATE 2.0
-- Run after the main schema migrations to populate all tables with realistic starter data

/* =================================================================== */
/*  1. PROFILE (single row)                                            */
/* =================================================================== */
INSERT INTO profile (
  name, university, degree, year_label, semester_label, target_gpa, total_ects, completed_ects, accent, email
) VALUES (
  'Alex Karimi',
  'TU Delft',
  'BSc Computer Science',
  'Year 3',
  'Fall 2025',
  8.0,
  180,
  120,
  'primary',
  'alex.karimi@student.tudelft.nl'
) ON CONFLICT DO NOTHING;

/* =================================================================== */
/*  2. COURSES                                                         */
/* =================================================================== */
INSERT INTO courses (id, code, name, professor, ects, room, syllabus_progress, avg_grade, grade_label, next_session_label, accent, sort_order) VALUES
  (gen_random_uuid(), 'CS301', 'Advanced Operating Systems', 'Dr. Elena Mercer', 6, 'Turing 302', 72, 8.4, 'Notable', 'Mon 09:00 – 11:30', 'primary', 1),
  (gen_random_uuid(), 'CS340', 'Distributed Systems', 'Prof. Chen Wei', 6, 'Turing 302', 58, 8.1, 'Notable', 'Wed 14:00 – 16:30', 'primary', 2),
  (gen_random_uuid(), 'ECO210', 'Applied Microeconomics', 'Dr. Sarah Nash', 5, 'Nash Wing 101', 45, 7.8, 'Notable', 'Fri 10:00 – 11:30', 'secondary', 3),
  (gen_random_uuid(), 'PHY280', 'Quantum Computing Lab', 'Prof. Max Planck', 4, 'Planck Lab 3', 30, 9.2, 'Outstanding', 'Tue 09:00 – 12:00', 'tertiary', 4);

/* =================================================================== */
/*  3. TASKS                                                           */
/* =================================================================== */
INSERT INTO tasks (id, course_id, course_code, title, priority, estimated_hours, subtask_summary, due_label, completed, sort_order) VALUES
  (gen_random_uuid(), NULL, 'CS301', 'Implement virtual memory manager', 'high', 4, '3 subtasks', 'Mon Dec 16 (2d)', false, 1),
  (gen_random_uuid(), NULL, 'CS301', 'Review Ch. 4–6 for midterm', 'high', 3, '2 subtasks', 'Wed Dec 18 (4d)', false, 2),
  (gen_random_uuid(), NULL, 'CS340', 'Finish lab: Raft consensus', 'medium', 3.5, '4 subtasks', 'Tue Dec 17 (3d)', false, 3),
  (gen_random_uuid(), NULL, 'CS340', 'Write summary: Byzantine fault tolerance', 'medium', 2, '1 subtask', 'Fri Dec 20 (6d)', false, 4),
  (gen_random_uuid(), NULL, 'ECO210', 'Problem set 7: Monetary policy', 'medium', 2.5, '3 subtasks', 'Thu Dec 19 (5d)', false, 5),
  (gen_random_uuid(), NULL, 'ECO210', 'Prepare presentation: Game theory', 'low', 2, '2 subtasks', 'Mon Dec 23 (10d)', false, 6),
  (gen_random_uuid(), NULL, 'PHY280', 'Complete lab report: Qubit gates', 'high', 3, '2 subtasks', 'Wed Dec 18 (4d)', false, 7),
  (gen_random_uuid(), NULL, 'PHY280', 'Study for quiz: Error correction', 'medium', 1.5, '1 subtask', 'Fri Dec 20 (6d)', false, 8);

/* =================================================================== */
/*  4. ASSESSMENTS                                                     */
/* =================================================================== */
INSERT INTO assessments (id, course_id, code_label, title, weight_label, target_grade, days_until_label, accent, sort_order) VALUES
  (gen_random_uuid(), NULL, 'CS301 MIDTERM', 'Distributed Systems Exam', '35% of Final', '>8.5', 'In 6 Days', 'primary', 1),
  (gen_random_uuid(), NULL, 'ECO210 CAPSTONE', 'Monetary Policy Term Paper', '40% of Final', '>9.0', 'In 12 Days', 'secondary', 2),
  (gen_random_uuid(), NULL, 'PHY280 LAB EXAM', 'Quantum Circuit Practical', '30% of Final', '>9.0', 'In 9 Days', 'tertiary', 3),
  (gen_random_uuid(), NULL, 'CS340 FINAL', 'Raft & Consensus Final', '50% of Final', '>8.0', 'In 18 Days', 'primary', 4);

/* =================================================================== */
/*  5. SCHEDULE ENTRIES                                                */
/* =================================================================== */
-- Monday
INSERT INTO schedule_entries (id, day_of_week, day_label, date_label, is_today, time_label, course_name, room, session_type, is_next, sort_order) VALUES
  (gen_random_uuid(), 1, 'Monday', 'Sep 7, 2026', true, '09:00 – 11:30', 'Advanced Operating Systems', 'Turing 302', 'lecture', false, 1),
  (gen_random_uuid(), 1, 'Monday', 'Sep 7, 2026', true, '14:00 – 16:00', 'Applied Microeconomics', 'Nash Wing 101', 'lecture', false, 2);

-- Tuesday
INSERT INTO schedule_entries (id, day_of_week, day_label, date_label, is_today, time_label, course_name, room, session_type, is_next, sort_order) VALUES
  (gen_random_uuid(), 2, 'Tuesday', 'Sep 8, 2026', false, '14:00 – 16:30', 'Advanced Operating Systems', 'Turing 302', 'lecture', false, 3),
  (gen_random_uuid(), 2, 'Tuesday', 'Sep 8, 2026', false, '17:00 – 18:30', 'Calculus Office Hours', 'Room 412', 'optional', false, 4);

-- Wednesday
INSERT INTO schedule_entries (id, day_of_week, day_label, date_label, is_today, time_label, course_name, room, session_type, is_next, sort_order) VALUES
  (gen_random_uuid(), 3, 'Wednesday', 'Sep 9, 2026', false, '09:00 – 12:00', 'Quantum Computing Lab', 'Planck Lab 3', 'practical', false, 5),
  (gen_random_uuid(), 3, 'Wednesday', 'Sep 9, 2026', false, '13:30 – 15:00', 'Algorithm Complexity', 'Auditorium B', 'seminar', false, 6);

-- Thursday
INSERT INTO schedule_entries (id, day_of_week, day_label, date_label, is_today, time_label, course_name, room, session_type, is_next, sort_order) VALUES
  (gen_random_uuid(), 4, 'Thursday', 'Sep 10, 2026', false, '10:00 – 12:30', 'Adv. OS Lab Workshop', 'Unix Lab 2', 'graded', true, 7),
  (gen_random_uuid(), 4, 'Thursday', 'Sep 10, 2026', false, '14:00 – 17:00', 'Game Theory Colloquium', 'Nash Wing 204', 'seminar', false, 8);

-- Friday
INSERT INTO schedule_entries (id, day_of_week, day_label, date_label, is_today, time_label, course_name, room, session_type, is_next, sort_order) VALUES
  (gen_random_uuid(), 5, 'Friday', 'Sep 11, 2026', false, '10:00 – 11:30', 'Applied Microeconomics', 'Nash Wing 101', 'lecture', false, 9),
  (gen_random_uuid(), 5, 'Friday', 'Sep 11, 2026', false, '13:00 – 14:00', 'CS Department Mixer', 'Faculty Lounge', 'social', false, 10);

/* =================================================================== */
/*  6. HABITS                                                          */
/* =================================================================== */
INSERT INTO habits (id, name, streak_label, progress_percent, detail_label, accent, sort_order) VALUES
  (gen_random_uuid(), 'Daily coding practice', '7d', 85, '5/7 days this week', 'primary', 1),
  (gen_random_uuid(), 'Evening review session', '14d', 92, '6/7 days this week', 'secondary', 2),
  (gen_random_uuid(), 'Focus timer sessions', '21d', 78, '4/7 days this week', 'tertiary', 3);

/* =================================================================== */
/*  7. NOTES                                                           */
/* =================================================================== */
INSERT INTO notes (id, title, icon, timestamp_label, accent, sort_order) VALUES
  (gen_random_uuid(), 'Kernel Virtual Memory', 'picture_as_pdf', '2h ago', 'primary', 1),
  (gen_random_uuid(), 'Eigenvalues & Spectral Theorem', 'code', 'Yesterday', 'secondary', 2),
  (gen_random_uuid(), 'POSIX Thread Pool Implementation', 'code', 'Dec 14', 'tertiary', 3),
  (gen_random_uuid(), 'Raft Consensus Notes', 'picture_as_pdf', 'Dec 12', 'primary', 4);

/* =================================================================== */
/*  8. QUICK THOUGHTS                                                  */
/* =================================================================== */
INSERT INTO quick_thoughts (id, text, completed, sort_order) VALUES
  (gen_random_uuid(), 'Review Theorem 4.2 proof for Calculus', false, 1),
  (gen_random_uuid(), 'Pick up Quantum Physics lab manual from desk 4', false, 2),
  (gen_random_uuid(), 'Email Prof. Mercer re: Thread Pool Scheduler bug', false, 3);

/* =================================================================== */
/*  9. RESOURCES                                                       */
/* =================================================================== */
INSERT INTO resources (id, course_code, title, type, url, size_label, timestamp_label, favorite, sort_order) VALUES
  (gen_random_uuid(), 'CS301', 'OS Concepts Ch. 9–12', 'pdf', '/resources/os_ch9-12.pdf', '2.4 MB', 'Dec 10', true, 1),
  (gen_random_uuid(), 'CS340', 'Raft Paper (Ongaro)', 'pdf', '/resources/raft.pdf', '1.1 MB', 'Dec 8', false, 2),
  (gen_random_uuid(), 'ECO210', 'Microeconomics Lecture Slides', 'slides', '/resources/eco_slides.pdf', '8.7 MB', 'Dec 12', true, 3),
  (gen_random_uuid(), 'PHY280', 'Qiskit Tutorial', 'link', 'https://qiskit.org/textbook', '—', 'Dec 5', false, 4),
  (gen_random_uuid(), 'CS301', 'Virtual Memory Simulator', 'code', '/resources/vm_sim.py', '45 KB', 'Dec 3', false, 5);

/* =================================================================== */
/*  10. GOALS                                                          */
/* =================================================================== */
INSERT INTO goals (id, name, description, category, target_value, current_value, unit, deadline_label, status, sort_order) VALUES
  (gen_random_uuid(), 'Maintain 8.5+ GPA', 'Keep semester GPA above 8.5 for scholarship', 'academic', 8.5, 8.4, 'GPA', 'End of semester', 'active', 1),
  (gen_random_uuid(), 'Complete 120 study hours', 'Log 120 hours of focused study this term', 'study', 120, 72, 'hours', 'End of semester', 'active', 2),
  (gen_random_uuid(), 'Run 3x per week', 'Build cardio habit alongside studies', 'health', 36, 18, 'sessions', 'End of semester', 'active', 3),
  (gen_random_uuid(), 'Finish distributed systems project', 'Complete Raft implementation by Dec 20', 'academic', 100, 65, '%', 'Dec 20, 2025', 'active', 4);

/* =================================================================== */
/*  11. GRADE ENTRIES                                                  */
/* =================================================================== */
INSERT INTO grade_entries (id, course_id, course_code, assessment_name, weight, grade, max_grade, date_label, sort_order) VALUES
  -- CS301
  (gen_random_uuid(), NULL, 'CS301', 'Midterm 1', 20, 8.2, 10, 'Oct 15, 2025', 1),
  (gen_random_uuid(), NULL, 'CS301', 'Lab 1: Scheduling', 15, 8.5, 10, 'Nov 5, 2025', 2),
  (gen_random_uuid(), NULL, 'CS301', 'Project 1: Memory', 25, 8.8, 10, 'Nov 28, 2025', 3),
  -- CS340
  (gen_random_uuid(), NULL, 'CS340', 'Midterm', 30, 7.9, 10, 'Oct 20, 2025', 4),
  (gen_random_uuid(), NULL, 'CS340', 'Lab: Consensus', 20, 8.2, 10, 'Nov 10, 2025', 5),
  -- ECO210
  (gen_random_uuid(), NULL, 'ECO210', 'Problem Set 1–5', 25, 7.6, 10, 'Oct 25, 2025', 6),
  (gen_random_uuid(), NULL, 'ECO210', 'Essay: Market Failure', 35, 8.0, 10, 'Nov 20, 2025', 7),
  -- PHY280
  (gen_random_uuid(), NULL, 'PHY280', 'Lab 1: Superposition', 20, 9.0, 10, 'Nov 2, 2025', 8),
  (gen_random_uuid(), NULL, 'PHY280', 'Quiz: Gates', 10, 9.5, 10, 'Nov 15, 2025', 9);

/* =================================================================== */
/*  12. FOCUS SESSIONS                                                 */
/* =================================================================== */
INSERT INTO focus_sessions (id, course_code, task_label, duration_minutes, session_type, date_label, time_label, completed, sort_order) VALUES
  (gen_random_uuid(), 'CS301', 'Virtual memory implementation', 50, 'pomodoro', 'Sep 7, 2026', '18:00', true, 1),
  (gen_random_uuid(), 'CS340', 'Raft lab work', 45, 'pomodoro', 'Sep 6, 2026', '19:00', true, 2),
  (gen_random_uuid(), 'ECO210', 'Problem set 7', 25, 'pomodoro', 'Sep 6, 2026', '17:30', true, 3),
  (gen_random_uuid(), 'PHY280', 'Lab report', 50, 'pomodoro', 'Sep 5, 2026', '20:00', true, 4),
  (gen_random_uuid(), 'CS301', 'Midterm review', 50, 'pomodoro', 'Sep 4, 2026', '18:00', true, 5),
  (gen_random_uuid(), 'CS340', 'Reading: Byzantine', 25, 'pomodoro', 'Sep 3, 2026', '19:30', true, 6),
  (gen_random_uuid(), 'ECO210', 'Essay outline', 25, 'pomodoro', 'Sep 2, 2026', '17:00', true, 7);

/* =================================================================== */
/*  13. NOTIFICATIONS                                                  */
/* =================================================================== */
INSERT INTO notifications (id, type, title, body, timestamp_label, read, accent, sort_order) VALUES
  (gen_random_uuid(), 'exam', 'CS301 Midterm in 6 days', 'Your Distributed Systems exam is coming up. Start reviewing Ch. 1–6.', '2h ago', false, 'primary', 1),
  (gen_random_uuid(), 'deadline', 'Virtual memory task due in 2 days', 'Implement virtual memory manager — 4h estimated.', '4h ago', false, 'error', 2),
  (gen_random_uuid(), 'streak', '14-day study streak!', 'You''ve been consistent for two weeks straight. Keep it up!', '1d ago', true, 'tertiary', 3),
  (gen_random_uuid(), 'goal', 'Study hours goal 60% complete', '72 of 120 hours logged this term.', '3d ago', true, 'secondary', 4);