import { ExamType } from '@/core/domain/enums';
import type { Exam } from '@/core/domain/model/Exam';

/** Legacy snake_case UI shape for the Assessments/Exams view. */
export interface UiExam {
  id: string;
  course_id: string | null;
  code_label: string;
  title: string;
  weight_label: string;
  target_grade: string;
  days_until_label: string;
  accent: 'primary' | 'secondary' | 'tertiary';
  sort_order: number;
}

export function toUiExam(exam: Exam): UiExam {
  return {
    id: exam.id,
    course_id: exam.courseId,
    code_label: exam.codeLabel,
    title: exam.title,
    weight_label: exam.weightLabel,
    target_grade: exam.targetGrade,
    days_until_label: exam.daysUntilLabel,
    accent: exam.accent as 'primary' | 'secondary' | 'tertiary',
    sort_order: exam.sortOrder,
  };
}

export function fromUiExam(exam: UiExam): Exam {
  return {
    id: exam.id,
    courseId: exam.course_id,
    codeLabel: exam.code_label,
    title: exam.title,
    weightLabel: exam.weight_label,
    targetGrade: exam.target_grade,
    daysUntilLabel: exam.days_until_label,
    type: ExamType.Midterm,
    accent: exam.accent as Exam['accent'],
    sortOrder: exam.sort_order,
  };
}