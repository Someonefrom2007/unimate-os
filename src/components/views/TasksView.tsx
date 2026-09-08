import { useEffect, useMemo, useState } from 'react';
import {
  Clock3, Check, Plus, Trash2, X, AlertTriangle,
} from 'lucide-react';
import { useTaskStore } from '@/core/store/useTaskStore';
import type { Task as DomainTask } from '@/core/domain/model/Task';
import { TaskPriority, TaskStatus } from '@/core/domain/enums';
import { createId } from '@/core/domain/ids';
import {
  parseSubtaskProgress,
  sortTasks,
  computeOverdue,
} from '@/core/engines/taskEngine';
import type { UiTask } from './taskUiAdapter';
import { toUiTask, fromUiTask } from './taskUiAdapter';

const priorityConfig = {
  high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'URGENT', pill: 'bg-error/15 text-error/80' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'HIGH', pill: 'bg-primary/15 text-primary/80' },
  low: { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', label: 'MEDIUM', pill: 'bg-tertiary/15 text-tertiary/80' },
};

type FilterKind = 'all' | 'active' | 'completed' | TaskPriority;

/** Column definitions for the Kanban board. */
const KANBAN_COLUMNS: { key: TaskStatus; label: string; accent: string; dot: string }[] = [
  { key: TaskStatus.Pending, label: 'TODO', accent: 'bg-neutral-900/40 border-neutral-800/60', dot: 'bg-on-surface-variant/40' },
  { key: TaskStatus.InProgress, label: 'IN PROGRESS', accent: 'bg-neutral-900/40 border-primary/30', dot: 'bg-primary' },
  { key: TaskStatus.Completed, label: 'DONE', accent: 'bg-neutral-900/40 border-tertiary/30', dot: 'bg-tertiary' },
];

export function TasksView() {
  const { data, loading, error, initialized, load, upsert, remove } = useTaskStore();
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState<FilterKind>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UiTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UiTask | null>(null);

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const tasks: UiTask[] = useMemo(() => {
    return data
      .map(toUiTask)
      .filter((t) => {
        if (filter === 'active') return !t.completed;
        if (filter === 'completed') return t.completed;
        if (filter === 'high' || filter === 'medium' || filter === 'low') return t.priority === filter;
        return true;
      })
      .filter((t) => courseFilter === 'all' || t.course_code === courseFilter)
      .sort((a, b) => sortTasks([fromUiTask(a), fromUiTask(b)].map((x) => x))[0] === fromUiTask(a) ? -1 : 1);
  }, [data, filter, courseFilter]);

  const courseOptions = useMemo(() => {
    const codes = new Set(data.map((t) => t.courseCode).filter(Boolean));
    return [...codes].sort();
  }, [data]);

  const activeCount = data.filter((t) => !t.completed).length;
  const doneCount = data.filter((t) => t.completed).length;

  /* ----- Kanban grouping ----- */
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      items: tasks
        .filter((t) => t.status === col.key)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [tasks]);

  /* ----- Mutations ----- */
  const persist = async (task: UiTask) => {
    try {
      await upsert(fromUiTask(task));
    } catch {
      setActionError('That task could not be updated.');
    }
  };

  const handleMove = async (task: UiTask, status: TaskStatus) => {
    const next: UiTask = {
      ...task,
      status,
      completed: status === TaskStatus.Completed,
    };
    await persist(next);
  };

  const toggleComplete = async (task: UiTask) => {
    await handleMove(task, task.completed ? TaskStatus.Pending : TaskStatus.Completed);
  };

  const handleDelete = async (task: UiTask) => {
    try {
      await remove(task.id);
      setActionError('');
    } catch {
      setActionError('That task could not be deleted.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCreate = async (input: { title: string; course_code: string; priority: TaskPriority }) => {
    setCreating(true);
    setActionError('');
    try {
      const task: DomainTask = {
        id: createId(),
        courseId: null,
        courseCode: input.course_code,
        title: input.title.trim(),
        priority: input.priority,
        status: TaskStatus.Pending,
        estimatedHours: 1,
        subtaskSummary: '',
        dueLabel: 'No deadline',
        completed: false,
        sortOrder: data.length + 1,
      };
      await upsert(task);
      setShowCreate(false);
    } catch {
      setActionError('That task could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (task: UiTask) => {
    try {
      await upsert(fromUiTask(task));
      setEditing(null);
    } catch {
      setActionError('That task could not be saved.');
    }
  };

  /* ----- Render states ----- */
  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading tasks…</p>
        </div>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="font-body-lg text-error">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Task
          </button>
          <div className="flex gap-2">
            {([['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] as [FilterKind, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg border px-3 py-1.5 font-label-mono-sm text-[11px] font-semibold transition-all ${
                  filter === key
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/8 bg-surface-container/40 text-on-surface-variant/60 hover:text-on-background'
                }`}
              >
                {label}
              </button>
            ))}
            {courseOptions.length > 1 && (
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-lg border border-white/8 bg-surface-container/60 px-3 py-1.5 font-label-mono-sm text-[11px] font-semibold text-on-surface-variant focus:border-primary/40 focus:outline-none"
              >
                <option value="all">All courses</option>
                {courseOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border border-white/8 bg-surface-container/60 px-4 py-2">
            <p className="font-label-mono-xs text-on-surface-variant/50">Active</p>
            <p className="font-headline-md text-[18px] font-bold text-primary">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-surface-container/60 px-4 py-2">
            <p className="font-label-mono-xs text-on-surface-variant/50">Done</p>
            <p className="font-headline-md text-[18px] font-bold text-tertiary">{doneCount}</p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 font-body-md text-[13px] text-error">
          {actionError}
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`rounded-2xl border p-4 ${col.accent}`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <p className="font-label-mono-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
                  {col.label}
                </p>
              </div>
              <span className="rounded-full bg-white/6 px-2 py-0.5 font-label-mono-xs text-on-surface-variant/60">
                {col.items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={(status) => void handleMove(task, status)}
                  onToggleComplete={() => void toggleComplete(task)}
                  onEdit={() => setEditing(task)}
                  onDelete={() => setConfirmDelete(task)}
                />
              ))}
              {col.items.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/8 p-4 text-center">
                  <p className="font-label-mono-xs text-on-surface-variant/30">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task modal */}
      {showCreate && (
        <CreateTaskModal
          courses={courseOptions.map((c) => ({ code: c }))}
          onCancel={() => setShowCreate(false)}
          onConfirm={(input) => void handleCreate(input)}
          busy={creating}
        />
      )}

      {/* Edit Task modal */}
      {editing && (
        <EditTaskModal
          task={editing}
          onCancel={() => setEditing(null)}
          onConfirm={(updated) => void handleEdit(updated)}
        />
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <DeleteTaskModal
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task Card                                                          */
/* ------------------------------------------------------------------ */

function TaskCard({
  task,
  onMove,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: UiTask;
  onMove: (status: TaskStatus) => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = computeOverdue(fromUiTask(task)).overdue;
  const subtask = parseSubtaskProgress(task.subtask_summary);
  const pct = subtask.percent;
  const prio = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      className="group rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-3.5 transition-all duration-200 hover:border-neutral-700/80 hover:bg-neutral-900/60 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggleComplete}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
            task.completed ? 'border-tertiary bg-tertiary' : 'border-on-surface-variant/40 hover:border-primary'
          }`}
          aria-label="Toggle complete"
        >
          {task.completed && <Check className="h-3 w-3 text-surface" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`font-body-md text-[13px] font-medium leading-snug ${task.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-background'}`}>
            {task.title}
          </p>
          {task.course_code && (
            <p className="mt-0.5 font-label-mono-xs text-on-surface-variant/50">
              {task.course_code}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1 text-on-surface-variant/40 opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Metadata + subtask progress */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${prio.pill}`}>
          {prio.label}
        </span>
        <span className={`flex items-center gap-1 font-label-mono-xs ${overdue ? 'text-error' : 'text-on-surface-variant/50'}`}>
          <Clock3 className="h-3 w-3" />
          {task.due_label}
        </span>
        {overdue && <AlertTriangle className="h-3 w-3 text-error" />}
      </div>

      {pct > 0 && (
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-label-mono-xs text-on-surface-variant/50">Subtasks</span>
            <span className="font-label-mono-xs font-bold text-on-surface-variant/70">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick move actions */}
      <div className="mt-3 flex items-center gap-1 border-t border-neutral-800/60 pt-2">
        <button
          onClick={() => task.status === TaskStatus.Pending ? onMove(TaskStatus.InProgress) : onMove(TaskStatus.Pending)}
          className="rounded-lg bg-white/4 px-2 py-1 font-label-mono-xs text-on-surface-variant/60 transition-colors hover:bg-white/8 hover:text-on-background"
        >
          {task.status === TaskStatus.Pending ? '→ Start' : '← Back'}
        </button>
        {task.status === TaskStatus.Completed ? (
          <button onClick={() => onMove(TaskStatus.Pending)} className="rounded-lg bg-white/4 px-2 py-1 font-label-mono-xs text-on-surface-variant/60 transition-colors hover:bg-white/8 hover:text-on-background">
            Reopen
          </button>
        ) : (
          <button onClick={() => onMove(TaskStatus.Completed)} className="rounded-lg bg-white/4 px-2 py-1 font-label-mono-xs text-on-surface-variant/60 transition-colors hover:bg-white/8 hover:text-on-background">
            Done
          </button>
        )}
        <button onClick={onEdit} className="ml-auto rounded-lg bg-white/4 px-2 py-1 font-label-mono-xs text-on-surface-variant/60 transition-colors hover:bg-white/8 hover:text-on-background">
          Edit
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modals                                                             */
/* ------------------------------------------------------------------ */

function CreateTaskModal({
  courses,
  onCancel,
  onConfirm,
  busy,
}: {
  courses: { code: string }[];
  onCancel: () => void;
  onConfirm: (input: { title: string; course_code: string; priority: TaskPriority }) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code || '');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setLocalError('A task title is required.');
      return;
    }
    onConfirm({ title, course_code: courseCode, priority });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-container p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">New Task</h3>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-on-surface-variant/60 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement A* pathfinding"
              className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Course</label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background focus:border-primary/40 focus:outline-none"
            >
              <option value="">General</option>
              {courses.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Priority</label>
            <div className="flex gap-2">
              {([['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] as [TaskPriority, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key as TaskPriority)}
                  className={`flex-1 rounded-lg border px-3 py-2 font-label-mono-sm text-[11px] font-semibold transition-all ${
                    priority === key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-white/8 bg-surface-container/40 text-on-surface-variant/50 hover:text-on-background'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {localError && (
            <p className="flex items-center gap-1 rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-label-mono-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5" /> {localError}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTaskModal({
  task,
  onCancel,
  onConfirm,
}: {
  task: UiTask;
  onCancel: () => void;
  onConfirm: (task: UiTask) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority as TaskPriority);
  const [dueLabel, setDueLabel] = useState(task.due_label);
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setLocalError('A task title is required.');
      return;
    }
    onConfirm({
      ...task,
      title: title.trim(),
      priority,
      due_label: dueLabel.trim() || 'No deadline',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-container p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Edit Task</h3>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-on-surface-variant/60 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Due label</label>
            <input
              value={dueLabel}
              onChange={(e) => setDueLabel(e.target.value)}
              placeholder="e.g. Fri Dec 20 (4d)"
              className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-mono-xs text-on-surface-variant/60">Priority</label>
            <div className="flex gap-2">
              {([['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] as [TaskPriority, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key as TaskPriority)}
                  className={`flex-1 rounded-lg border px-3 py-2 font-label-mono-sm text-[11px] font-semibold transition-all ${
                    priority === key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-white/8 bg-surface-container/40 text-on-surface-variant/50 hover:text-on-background'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {localError && (
            <p className="flex items-center gap-1 rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-label-mono-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5" /> {localError}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteTaskModal({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface-container p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
            <Trash2 className="h-5 w-5 text-error" />
          </div>
          <h3 className="mt-3 font-headline-md text-[16px] font-semibold text-on-background">Delete task?</h3>
          <p className="mt-1 font-body-md text-[13px] text-on-surface-variant/60">
            “{title}” will be permanently removed.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-error px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}