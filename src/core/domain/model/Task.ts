import { TaskPriority, TaskStatus } from '../enums';

/** A deliverable / to-do linked to a course. */
export interface Task {
  id: string;
  courseId: string | null;
  courseCode: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  subtaskSummary: string;
  dueLabel: string;
  completed: boolean;
  sortOrder: number;
}