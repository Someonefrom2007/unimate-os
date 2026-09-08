import { Clock, MapPin, ChevronRight } from 'lucide-react';
import type { Course } from '@/lib/types';
import { accentText, accentProgress, accentSoftBg } from '@/lib/accent';

interface CourseProgressListProps {
  courses: Course[];
  onViewAll?: () => void;
}

export function CourseProgressList({ courses, onViewAll }: CourseProgressListProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Course Progress
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Syllabus coverage & grades
          </p>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 font-label-mono-sm text-[11px] text-primary/80 transition-all duration-200 hover:text-primary">
          All courses
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {courses.map((course) => (
          <div
            key={course.id}
            className="group flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/40 p-3 transition-all duration-200 hover:border-white/10 hover:bg-surface-container/70"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentSoftBg(course.accent)}`}>
              <span className={`font-label-mono-sm text-[11px] font-bold ${accentText(course.accent)}`}>
                {course.code.slice(0, 2)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-body-md text-[13px] font-semibold text-on-background">
                  {course.name}
                </p>
                <span className={`shrink-0 font-label-mono-sm font-bold ${accentText(course.accent)}`}>
                  {course.avg_grade.toFixed(1)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accentProgress(course.accent)} transition-all duration-500`}
                    style={{ width: `${course.syllabus_progress}%` }}
                  />
                </div>
                <span className="font-label-mono-xs text-on-surface-variant/60">
                  {course.syllabus_progress}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 font-label-mono-xs text-on-surface-variant/50">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {course.room}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.next_session_label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
