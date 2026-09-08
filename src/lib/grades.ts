import type { GradeEntry, Course } from './types';

export function classifyGrade(grade: number): { label: string; color: string } {
  if (grade < 5.0) return { label: 'Fail', color: 'text-error' };
  if (grade < 7.0) return { label: 'Pass', color: 'text-on-surface-variant' };
  if (grade < 9.0) return { label: 'Notable', color: 'text-primary' };
  if (grade < 10.0) return { label: 'Outstanding', color: 'text-tertiary' };
  return { label: 'Honors', color: 'text-secondary' };
}

export function computeWeightedAverage(grades: GradeEntry[]): number {
  const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = grades.reduce((sum, g) => sum + (g.grade / g.max_grade) * 10 * g.weight, 0);
  return weightedSum / totalWeight;
}

export function computeCourseGrade(course: Course, grades: GradeEntry[]): number {
  const courseGrades = grades.filter((g) => g.course_code === course.code);
  if (courseGrades.length === 0) return course.avg_grade;
  return computeWeightedAverage(courseGrades);
}

export function computeGPA(courses: Course[], grades: GradeEntry[]): number {
  let totalWeighted = 0;
  let totalEcts = 0;
  for (const course of courses) {
    const grade = computeCourseGrade(course, grades);
    totalWeighted += grade * course.ects;
    totalEcts += course.ects;
  }
  return totalEcts > 0 ? totalWeighted / totalEcts : 0;
}

export function computeEctsProgress(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function computeNeededGrade(
  currentGrade: number,
  currentWeightPct: number,
  remainingWeightPct: number,
  targetGrade: number
): number {
  if (remainingWeightPct === 0) return 0;
  const needed = (targetGrade - currentGrade * (currentWeightPct / 100)) / (remainingWeightPct / 100);
  return Math.max(0, Math.min(10, needed));
}
