export type AccentColor = 'primary' | 'secondary' | 'tertiary' | 'gold' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'amber' | 'slate' | 'violet';

export interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  ects: number;
  room: string;
  syllabus_progress: number;
  avg_grade: number;
  grade_label: string;
  next_session_label: string;
  accent: AccentColor;
  sort_order: number;
}

export interface Task {
  id: string;
  course_id: string | null;
  course_code: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  estimated_hours: number;
  subtask_summary: string;
  due_label: string;
  completed: boolean;
  sort_order: number;
}

export interface Assessment {
  id: string;
  course_id: string | null;
  code_label: string;
  title: string;
  weight_label: string;
  target_grade: string;
  days_until_label: string;
  accent: AccentColor;
  sort_order: number;
}

export interface ScheduleEntry {
  id: string;
  day_of_week: number;
  day_label: string;
  date_label: string;
  is_today: boolean;
  time_label: string;
  course_name: string;
  room: string;
  session_type: string;
  is_next: boolean;
  sort_order: number;
}

export interface Note {
  id: string;
  title: string;
  icon: string;
  timestamp_label: string;
  accent: AccentColor;
  sort_order: number;
}

export interface Habit {
  id: string;
  name: string;
  streak_label: string;
  progress_percent: number;
  detail_label: string;
  accent: AccentColor;
  sort_order: number;
}

export interface QuickThought {
  id: string;
  text: string;
  completed: boolean;
  sort_order: number;
}

export interface GradeEntry {
  id: string;
  course_id: string | null;
  course_code: string;
  assessment_name: string;
  weight: number;
  grade: number;
  max_grade: number;
  date_label: string;
  sort_order: number;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'study' | 'personal' | 'health';
  target_value: number;
  current_value: number;
  unit: string;
  deadline_label: string;
  status: 'active' | 'completed';
  sort_order: number;
}

export interface FocusSession {
  id: string;
  course_code: string;
  task_label: string;
  duration_minutes: number;
  session_type: string;
  date_label: string;
  time_label: string;
  completed: boolean;
  sort_order: number;
}

export interface Resource {
  id: string;
  course_code: string;
  title: string;
  type: 'pdf' | 'document' | 'code' | 'slides' | 'link' | 'video';
  url: string;
  size_label: string;
  timestamp_label: string;
  favorite: boolean;
  sort_order: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp_label: string;
  read: boolean;
  accent: AccentColor;
  sort_order: number;
}

export interface Profile {
  id: string;
  name: string;
  initials: string;
  email: string;
  university: string;
  degree: string;
  year_label: string;
  semester_label: string;
  target_gpa: number;
  total_ects: number;
  completed_ects: number;
  accent: AccentColor;
}

export type ViewKey =
  | 'dashboard'
  | 'courses'
  | 'schedule'
  | 'tasks'
  | 'assessments'
  | 'grades'
  | 'notes'
  | 'resources'
  | 'focus'
  | 'goals'
  | 'habits'
  | 'workload'
  | 'insights'
  | 'ai-assistant'
  | 'profile'
  | 'settings'
  | 'plans';
