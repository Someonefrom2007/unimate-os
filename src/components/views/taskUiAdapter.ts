import type { Task as DomainTask } from '@/core/domain/model/Task';
import type { TaskPriority, TaskStatus } from '@/core/domain/enums';

/** Legacy snake_case UI shape for the Tasks view (keeps card layout frozen). */
export interface UiTask {
  id: string;
  course_id: string | null;
  course_code: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  estimated_hours: number;
  subtask_summary: string;
  due_label: string;
  completed: boolean;
  sort_order: number;
}

export function toUiTask(task: DomainTask): UiTask {
  return {
    id: task.id,
    course_id: task.courseId,
    course_code: task.courseCode,
    title: task.title,
    priority: task.priority as 'high' | 'medium' | 'low',
    status: task.status,
    estimated_hours: task.estimatedHours,
    subtask_summary: task.subtaskSummary,
    due_label: task.dueLabel,
    completed: task.completed,
    sort_order: task.sortOrder,
  };
}

export function fromUiTask(task: UiTask): DomainTask {
  return {
    id: task.id,
    courseId: task.course_id,
    courseCode: task.course_code,
    title: task.title,
    priority: task.priority as TaskPriority,
    status: task.status,
    estimatedHours: task.estimated_hours,
    subtaskSummary: task.subtask_summary,
    dueLabel: task.due_label,
    completed: task.completed,
    sortOrder: task.sort_order,
  };
}