import { Flag, Clock3, Check, Circle } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskQueueProps {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => void;
}

const priorityConfig = {
  high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'High' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Med' },
  low: { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', label: 'Low' },
};

export function TaskQueue({ tasks, onToggle }: TaskQueueProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Task Queue
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Weekly deliverables & deadlines
          </p>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-label-mono-xs text-primary/90">
          {tasks.filter((t) => !t.completed).length} active
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const prio = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className={`group flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 ${
                task.completed
                  ? 'border-white/5 bg-surface-container/20 opacity-60'
                  : 'border-white/5 bg-surface-container/40 hover:border-white/10 hover:bg-surface-container/70'
              }`}
            >
              <button
                onClick={() => onToggle(task.id, !task.completed)}
                className="mt-0.5 shrink-0 transition-transform hover:scale-110"
              >
                {task.completed ? (
                  <Check className="h-5 w-5 text-tertiary" strokeWidth={2.5} />
                ) : (
                  <Circle className={`h-5 w-5 ${prio.color} hover:fill-current`} strokeWidth={2} />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`font-body-md text-[13px] font-medium ${
                      task.completed ? 'text-on-surface-variant line-through' : 'text-on-background'
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className={`shrink-0 rounded border ${prio.border} ${prio.bg} px-1.5 py-0.5 font-label-mono-xs ${prio.color}`}>
                    {prio.label}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 font-label-mono-xs text-on-surface-variant/50">
                  <span className="font-semibold text-on-surface-variant/80">{task.course_code}</span>
                  {task.subtask_summary && (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {task.subtask_summary}
                    </span>
                  )}
                  {task.estimated_hours > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      ~{task.estimated_hours}h
                    </span>
                  )}
                  {task.due_label && (
                    <span className="flex items-center gap-1 text-primary/70">
                      <Flag className="h-3 w-3" />
                      {task.due_label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
