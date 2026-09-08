import { useMemo } from 'react';
import { BarChart3, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Task, Course, Assessment } from '@/lib/types';
import { accentText, accentSoftBg } from '@/lib/accent';

interface WorkloadViewProps {
  tasks: Task[];
  courses: Course[];
  assessments: Assessment[];
}

export function WorkloadView({ tasks, courses, assessments }: WorkloadViewProps) {
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const totalEstimatedHours = useMemo(
    () => pendingTasks.reduce((sum, t) => sum + t.estimated_hours, 0),
    [pendingTasks]
  );

  const courseWorkload = useMemo(() => {
    return courses
      .map((course) => {
        const courseTasks = pendingTasks.filter((t) => t.course_code === course.code);
        const hours = courseTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
        return { course, tasks: courseTasks.length, hours };
      })
      .filter((c) => c.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [courses, pendingTasks]);

  const maxHours = useMemo(() => Math.max(...courseWorkload.map((c) => c.hours), 1), [courseWorkload]);

  // Compute today's hours from schedule (would come from schedule entries in a real app)
  // For now, approximate: tasks with "today" in due_label or first 2 pending tasks
  const todayTaskCount = useMemo(
    () => pendingTasks.filter((t) => t.due_label.toLowerCase().includes('today') || t.due_label.includes('(0d)') || t.due_label.includes('(1d)')).length,
    [pendingTasks]
  );
  const todayHours = useMemo(
    () => pendingTasks.slice(0, todayTaskCount || 2).reduce((sum, t) => sum + t.estimated_hours, 0),
    [pendingTasks, todayTaskCount]
  );

  const weekHours = totalEstimatedHours;
  const nextWeekHours = weekHours * 0.6;

  // Compute deadline density from assessment days_until + task due dates
  const densityData = useMemo(() => {
    const now = new Date();
    const days = 14;
    const result: { day: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayStr = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
      let count = 0;
      assessments.forEach((a) => {
        if (a.days_until_label.includes(dayStr) || a.days_until_label.includes(`${i} day`)) count++;
      });
      pendingTasks.forEach((t) => {
        if (t.due_label.includes(dayStr) || t.due_label.includes(`${i} day`)) count++;
      });
      result.push({ day: i + 1, count });
    }
    return result;
  }, [assessments, pendingTasks]);

  const maxDensity = Math.max(...densityData.map((d) => d.count), 1);

  const workloadLevel = weekHours > 15 ? 'high' : weekHours > 8 ? 'medium' : 'low';
  const workloadColor = workloadLevel === 'high' ? 'text-error' : workloadLevel === 'medium' ? 'text-primary' : 'text-tertiary';
  const workloadBg = workloadLevel === 'high' ? 'bg-error/10' : workloadLevel === 'medium' ? 'bg-primary/10' : 'bg-tertiary/10';

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="apple-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-[18px] w-[18px] text-primary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Today</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{todayHours > 0 ? todayHours.toFixed(1) : '—'}h</p>
          <p className="mt-1 font-label-mono-xs text-primary/70">{todayTaskCount} task{todayTaskCount !== 1 ? 's' : ''} pending</p>
        </div>
        <div className="apple-card rounded-3xl p-4 sm:p-5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${workloadBg}`}>
            <BarChart3 className={`h-[18px] w-[18px] ${workloadColor}`} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">This Week</p>
          <p className={`mt-1 font-headline-lg text-[26px] font-bold ${workloadColor}`}>{weekHours.toFixed(1)}h</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{pendingTasks.length} tasks</p>
        </div>
        <div className="apple-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10">
            <TrendingUp className="h-[18px] w-[18px] text-secondary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Next Week</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{nextWeekHours.toFixed(1)}h</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">Estimated</p>
        </div>
        <div className="apple-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10">
            <AlertTriangle className="h-[18px] w-[18px] text-error" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Assessments</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{assessments.length}</p>
          <p className="mt-1 font-label-mono-xs text-error/70">Upcoming</p>
        </div>
      </div>

      {/* Course Distribution */}
      <div className="apple-card rounded-3xl p-5">
        <h3 className="mb-4 font-headline-md text-[16px] font-semibold text-on-background">Workload by Course</h3>
        <div className="space-y-3">
          {courseWorkload.length === 0 ? (
            <p className="text-center font-body-md text-[13px] text-on-surface-variant/50 py-4">No pending coursework</p>
          ) : (
            courseWorkload.map(({ course, tasks: taskCount, hours }) => (
              <div key={course.id} className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentSoftBg(course.accent)}`}>
                  <span className={`font-label-mono-sm font-bold ${accentText(course.accent)}`}>
                    {course.code.slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-body-md text-[13px] font-medium text-on-background">{course.name}</p>
                    <span className="shrink-0 font-label-mono-sm font-bold text-on-background">{hours.toFixed(1)}h</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        course.accent === 'primary' ? 'from-primary/80 to-primary' :
                        course.accent === 'secondary' ? 'from-secondary/80 to-secondary' :
                        'from-tertiary/80 to-tertiary'
                      } transition-all duration-500`}
                      style={{ width: `${(hours / maxHours) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{taskCount} pending task{taskCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deadline Density Heatmap */}
      <div className="apple-card rounded-3xl p-5">
        <h3 className="mb-4 font-headline-md text-[16px] font-semibold text-on-background">Deadline Density</h3>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
          {densityData.map((d) => {
            const intensity = Math.min(3, Math.floor((d.count / maxDensity) * 3));
            const bgClass =
              intensity === 3 ? 'bg-error/60' :
              intensity === 2 ? 'bg-primary/40' :
              intensity === 1 ? 'bg-primary/15' :
              'bg-white/5';
            return (
              <div key={d.day} className={`h-10 rounded-xl ${bgClass} flex items-center justify-center transition-colors`}>
                <span className="font-label-mono-xs text-on-surface-variant/40">{d.day}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 font-label-mono-xs text-on-surface-variant/50">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white/5" /> Light</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/15" /> Moderate</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/40" /> Heavy</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-error/60" /> Critical</span>
        </div>
      </div>

      {/* Workload Warning */}
      {workloadLevel === 'high' && (
        <div className="apple-card rounded-3xl border-l-2 border-error/40 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <div>
              <h3 className="font-headline-md text-[15px] font-semibold text-on-background">High Workload Warning</h3>
              <p className="mt-1 font-body-md text-[13px] text-on-surface-variant/70">
                Your workload this week is <span className="font-semibold text-error">{weekHours.toFixed(1)}h</span> across {pendingTasks.length} tasks.
                Consider redistributing tasks or scheduling additional focus sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
