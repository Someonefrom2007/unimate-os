import { useMemo } from 'react';
import { TrendingUp, Clock, AlertTriangle, BookOpen, Sparkles, BarChart3 } from 'lucide-react';
import type { Task, Course, Assessment, FocusSession, Habit, Goal } from '@/lib/types';
import { accentText, accentSoftBg } from '@/lib/accent';

interface InsightsViewProps {
  tasks: Task[];
  courses: Course[];
  assessments: Assessment[];
  sessions: FocusSession[];
  habits: Habit[];
  goals: Goal[];
}

interface Insight {
  id: string;
  category: string;
  icon: typeof TrendingUp;
  accent: 'primary' | 'secondary' | 'tertiary' | 'error';
  title: string;
  body: string;
}

export function InsightsView({ tasks, courses, assessments, sessions, habits, goals }: InsightsViewProps) {
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const totalHours = useMemo(() => pendingTasks.reduce((s, t) => s + t.estimated_hours, 0), [pendingTasks]);

  const courseTaskMap = useMemo(() => courses.map((c) => ({
    course: c,
    count: pendingTasks.filter((t) => t.course_code === c.code).length,
    hours: pendingTasks.filter((t) => t.course_code === c.code).reduce((s, t) => s + t.estimated_hours, 0),
  })).filter((c) => c.count > 0).sort((a, b) => b.hours - a.hours), [courses, pendingTasks]);

  const topCourse = courseTaskMap[0];
  const focusMinutes = useMemo(() => sessions.reduce((s, sess) => s + sess.duration_minutes, 0), [sessions]);
  const bestHabit = useMemo(() => habits.reduce((best, h) => (h.progress_percent > (best?.progress_percent || 0) ? h : best), habits[0] || null), [habits]);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const goalsProgress = activeGoals.length > 0
    ? activeGoals.reduce((s, g) => s + Math.min(100, (g.current_value / g.target_value) * 100), 0) / activeGoals.length
    : 0;

  // Compute peak study time from focus sessions
  const peakStudyTime = useMemo(() => {
    if (sessions.length === 0) return 'No sessions yet';
    const hourCounts = new Map<number, number>();
    sessions.forEach((s) => {
      const match = s.time_label.match(/^(\d{1,2}):/);
      if (match) {
        const h = parseInt(match[1], 10);
        hourCounts.set(h, (hourCounts.get(h) || 0) + s.duration_minutes);
      }
    });
    if (hourCounts.size === 0) return 'Evening';
    let bestHour = 18;
    let bestMinutes = 0;
    hourCounts.forEach((minutes, hour) => {
      if (minutes > bestMinutes) {
        bestMinutes = minutes;
        bestHour = hour;
      }
    });
    const start = bestHour;
    const end = bestHour + 2;
    return `${String(start).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`;
  }, [sessions]);

  const insights = useMemo<Insight[]>(() => [
    {
      id: '1',
      category: 'Workload',
      icon: BarChart3,
      accent: 'primary' as const,
      title: `${pendingTasks.length} deadline${pendingTasks.length !== 1 ? 's' : ''} this week`,
      body: `You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? 's' : ''} totaling ${totalHours.toFixed(1)}h of estimated work.${pendingTasks.length > 5 ? ' Consider prioritizing high-impact items.' : ''}`,
    },
    ...(topCourse ? [{
      id: '2',
      category: 'Course Performance',
      icon: BookOpen,
      accent: 'secondary' as const,
      title: `Most workload from ${topCourse.course.code}`,
      body: `${topCourse.course.name} accounts for ${topCourse.hours.toFixed(1)}h (${Math.round((topCourse.hours / totalHours) * 100)}%) of pending work. Consider prioritizing this course.`,
    }] : []),
    {
      id: '3',
      category: 'Study Pattern',
      icon: Clock,
      accent: 'tertiary' as const,
      title: `Peak productivity: ${peakStudyTime}`,
      body: `Your focus sessions show best output ${peakStudyTime}. You've logged ${focusMinutes} minutes of deep work this week across ${sessions.length} session${sessions.length !== 1 ? 's' : ''}.`,
    },
    ...(bestHabit ? [{
      id: '4',
      category: 'Habits',
      icon: Sparkles,
      accent: 'tertiary' as const,
      title: `${bestHabit.name} is your strongest habit`,
      body: `You're at ${bestHabit.progress_percent}% consistency${bestHabit.streak_label ? ` with a ${bestHabit.streak_label} streak` : ''}. Keep it going!`,
    }] : []),
    {
      id: '5',
      category: 'Goals',
      icon: TrendingUp,
      accent: 'primary' as const,
      title: `${Math.round(goalsProgress)}% toward your goals`,
      body: `Across ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}, you're making ${goalsProgress >= 75 ? 'excellent' : goalsProgress >= 50 ? 'steady' : 'early'} progress.`,
    },
    ...(assessments.length > 0 ? [{
      id: '6',
      category: 'Assessments',
      icon: AlertTriangle,
      accent: 'error' as const,
      title: `${assessments.length} upcoming assessment${assessments.length !== 1 ? 's' : ''}`,
      body: assessments.map((a) => `${a.code_label}: ${a.days_until_label}`).join(' · '),
    }] : []),
  ], [pendingTasks, totalHours, topCourse, focusMinutes, sessions.length, bestHabit, activeGoals.length, goalsProgress, assessments, peakStudyTime]);

  const accentClasses = {
    primary: { text: 'text-primary', bg: 'bg-primary/10' },
    secondary: { text: 'text-secondary', bg: 'bg-secondary/10' },
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10' },
    error: { text: 'text-error', bg: 'bg-error/10' },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* AI Insight Banner */}
      <div className="apple-surface rounded-3xl border border-white/10 p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 gold-glow">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-headline-lg text-[20px] font-semibold text-on-background">Your Academic Insights</h2>
            <p className="mt-1 font-body-lg text-[14px] text-on-surface-variant/80">
              Generated from your real activity data — tasks, focus sessions, grades, and habits.
            </p>
          </div>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.map((insight) => {
          const Icon = insight.icon;
          const ac = accentClasses[insight.accent];
          return (
            <div key={insight.id} className="apple-card rounded-3xl p-5 transition-all duration-200 hover:translate-y-[-2px]">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ac.bg}`}>
                  <Icon className={`h-5 w-5 ${ac.text}`} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-label-mono-xs uppercase tracking-wider ${ac.text}`}>{insight.category}</p>
                  <h3 className="mt-0.5 font-headline-md text-[15px] font-semibold text-on-background">{insight.title}</h3>
                  <p className="mt-1.5 font-body-md text-[13px] leading-relaxed text-on-surface-variant/70">{insight.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Performance Summary */}
      <div className="apple-card rounded-3xl p-5">
        <h3 className="mb-4 font-headline-md text-[16px] font-semibold text-on-background">Course Performance Overview</h3>
        <div className="space-y-2.5">
          {courses.map((course) => {
            const courseTasks = pendingTasks.filter((t) => t.course_code === course.code);
            return (
              <div key={course.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3 apple-card hover:bg-white/5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentSoftBg(course.accent)}`}>
                  <span className={`font-label-mono-sm font-bold ${accentText(course.accent)}`}>
                    {course.code.slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body-md text-[13px] font-medium text-on-background">{course.name}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">
                    {course.syllabus_progress}% syllabus · {courseTasks.length} pending
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-headline-md text-[16px] font-bold ${accentText(course.accent)}`}>{course.avg_grade.toFixed(1)}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">{course.grade_label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
