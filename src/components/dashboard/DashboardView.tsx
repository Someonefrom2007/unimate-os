import type {
  Course,
  Task,
  Assessment,
  ScheduleEntry,
  Habit,
  Note,
  QuickThought,
  Profile,
  GradeEntry,
  FocusSession,
  ViewKey,
} from '@/lib/types';
import { DashboardBanner } from './DashboardBanner';
import { MetricCards } from './MetricCards';
import { CourseProgressList } from './CourseProgressList';
import { TaskQueue } from './TaskQueue';
import { AssessmentMilestones } from './AssessmentMilestones';
import { HabitTracker } from './HabitTracker';
import { NotesAccess } from './NotesAccess';
import { QuickThoughts } from './QuickThoughts';
import { WeeklyTimetable } from './WeeklyTimetable';
import { computeGPA } from '@/lib/grades';

interface DashboardViewProps {
  courses: Course[];
  tasks: Task[];
  assessments: Assessment[];
  schedule: ScheduleEntry[];
  habits: Habit[];
  notes: Note[];
  thoughts: QuickThought[];
  profile: Profile | null;
  grades: GradeEntry[];
  sessions: FocusSession[];
  onToggleTask: (id: string, completed: boolean) => void;
  onToggleThought: (id: string, completed: boolean) => void;
  onAddThought: (text: string) => void;
  onNavigate: (view: ViewKey) => void;
}

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView({
  courses,
  tasks,
  assessments,
  schedule,
  habits,
  notes,
  thoughts,
  profile,
  grades,
  sessions,
  onToggleTask,
  onToggleThought,
  onAddThought,
  onNavigate,
}: DashboardViewProps) {
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeCourses = courses.length;
  const avgGrade = courses.reduce((sum, c) => sum + c.avg_grade, 0) / (courses.length || 1);
  const gpa = computeGPA(courses, grades);
  const nextEntry = schedule.find((entry) => entry.is_next) || schedule.find((entry) => entry.is_today && !entry.is_next);
  const nextSessionLabel = nextEntry
    ? `Next: ${nextEntry.course_name} at ${nextEntry.time_label}`
    : '';
  const streakDays = new Set(sessions.map((s) => s.date_label)).size;
  const semesterLabel = profile?.semester_label || 'This Semester';
  const userName = profile?.name || 'there';
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="flex flex-col gap-5">
      <DashboardBanner
        userName={userName}
        nextSessionLabel={nextSessionLabel}
        taskCount={pendingTasks}
        assessmentCount={assessments.length}
        streakDays={streakDays}
        gpa={gpa}
        greeting={greeting}
        semesterLabel={semesterLabel}
        onStartFocus={() => onNavigate('focus')}
        onViewPlan={() => onNavigate('schedule')}
      />

      <MetricCards
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        activeCourses={activeCourses}
        avgGrade={avgGrade}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5">
          <CourseProgressList courses={courses} onViewAll={() => onNavigate('courses')} />
          <HabitTracker habits={habits} onViewAll={() => onNavigate('habits')} />
        </div>
        <div className="flex flex-col gap-5">
          <TaskQueue tasks={tasks} onToggle={onToggleTask} />
          <AssessmentMilestones assessments={assessments} onViewAll={() => onNavigate('assessments')} />
        </div>
        <div className="flex flex-col gap-5">
          <NotesAccess notes={notes} onViewAll={() => onNavigate('notes')} />
          <QuickThoughts
            thoughts={thoughts}
            onToggle={onToggleThought}
            onAdd={onAddThought}
          />
        </div>
      </div>

      <WeeklyTimetable entries={schedule} />
    </div>
  );
}
