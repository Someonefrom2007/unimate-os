import { AccentColor, ExamType } from '../enums';

/** An assessment / exam milestone linked to a course. */
export interface Exam {
  id: string;
  courseId: string | null;
  codeLabel: string;
  title: string;
  weightLabel: string;
  targetGrade: string;
  daysUntilLabel: string;
  type: ExamType;
  accent: AccentColor;
  sortOrder: number;
}