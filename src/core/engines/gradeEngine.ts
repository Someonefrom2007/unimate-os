/**
 * GradeEngine — high-precision academic math for the grades vertical slice.
 * Uses integer-centesimal math (×10000) to avoid floating-point rounding errors.
 * Covers weighted averages, classification, GPA, ECTS progression, target simulation.
 */
import { GradeClassification } from '../domain/enums';
import type { Grade } from '../domain/model/Grade';
import type { Course } from '../domain/model/Course';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const SCALE = 10_000;

const CLASSIFICATION_BANDS: { min: number; label: GradeClassification; display: string }[] = [
  { min: 10, label: GradeClassification.Outstanding, display: 'Matrícula de Honor' },
  { min: 9,  label: GradeClassification.Outstanding, display: 'Outstanding' },
  { min: 7,  label: GradeClassification.Notable,     display: 'Notable' },
  { min: 5,  label: GradeClassification.Sufficient,  display: 'Pass' },
  { min: 0,  label: GradeClassification.Fail,        display: 'Fail' },
];

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

/** Round a float to 4 decimal places using integer-centesimal math. */
function round4(n: number): number {
  return Math.round(n * SCALE) / SCALE;
}

// ---------------------------------------------------------------------------
//  Grade classification
// ---------------------------------------------------------------------------

/** Map a raw grade (0–10 scale) to its GradeClassification band. */
export function classifyGrade(grade: number): GradeClassification {
  if (grade >= 10) return GradeClassification.Outstanding;
  if (grade >= 9)  return GradeClassification.Outstanding;
  if (grade >= 7)  return GradeClassification.Notable;
  if (grade >= 5)  return GradeClassification.Sufficient;
  return GradeClassification.Fail;
}

/** Human-readable display label for a grade value. */
export function gradeDisplayLabel(grade: number): string {
  for (const band of CLASSIFICATION_BANDS) {
    if (grade >= band.min) return band.display;
  }
  return 'Fail';
}

/** Map a classification to a CSS tailwind color class. */
export function classificationColor(classification: GradeClassification): string {
  switch (classification) {
    case GradeClassification.Outstanding: return 'text-tertiary';
    case GradeClassification.Notable:     return 'text-primary';
    case GradeClassification.Sufficient:  return 'text-on-surface-variant';
    case GradeClassification.Fail:        return 'text-error';
    default:                              return 'text-on-surface-variant';
  }
}

// ---------------------------------------------------------------------------
//  Weighted average (single course / flat list)
// ---------------------------------------------------------------------------

/** Compute weighted average across assessments, normalising to the 0–10 scale. */
export function computeWeightedAverage(grades: Grade[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const g of grades) {
    if (g.maxGrade <= 0) continue;
    const normalisedGrade = (g.grade / g.maxGrade) * 10;
    weightedSum += normalisedGrade * g.weight;
    totalWeight += g.weight;
  }
  return totalWeight > 0 ? round4(weightedSum / totalWeight) : 0;
}

// ---------------------------------------------------------------------------
//  Course grade
// ---------------------------------------------------------------------------

/** Derive the final grade for a single course, falling back to its avgGrade field. */
export function deriveCourseGrade(course: Course, grades: Grade[]): number {
  const courseGrades = grades.filter((g) => g.courseId === course.id);
  if (courseGrades.length === 0) return course.avgGrade;
  return computeWeightedAverage(courseGrades);
}

// ---------------------------------------------------------------------------
//  GPA — semester vs cumulative
// ---------------------------------------------------------------------------

/** Semester GPA = Σ(courseGrade × ects) / Σ(ects) for the given courses. */
export function computeSemesterGPA(courses: Course[], grades: Grade[]): number {
  let totalWeighted = 0;
  let totalEcts = 0;
  for (const course of courses) {
    const grade = deriveCourseGrade(course, grades);
    totalWeighted += grade * course.ects;
    totalEcts += course.ects;
  }
  return totalEcts > 0 ? round4(totalWeighted / totalEcts) : 0;
}

/** Cumulative GPA across all semesters — uses all provided courses and grades. */
export function computeCumulativeGPA(
  allCourses: Course[],
  allGrades: Grade[],
): number {
  return computeSemesterGPA(allCourses, allGrades);
}

// ---------------------------------------------------------------------------
//  ECTS progression
// ---------------------------------------------------------------------------

/** Percentage of ECTS earned vs total target. */
export function computeEctsPercentage(completedEcts: number, totalEcts: number): number {
  if (totalEcts <= 0) return 0;
  return round4((completedEcts / totalEcts) * 100);
}

/** Normalised progress bar value (0-100). */
export function ectsProgressBar(completedEcts: number, totalEcts: number): number {
  return Math.round(Math.min(100, Math.max(0, computeEctsPercentage(completedEcts, totalEcts))));
}

// ---------------------------------------------------------------------------
//  Target grade simulator
// ---------------------------------------------------------------------------

/**
 * Given a course's current weighted average from already-graded assessments,
 * the percentage of course weight already graded, and the target final course
 * grade, compute the required grade on the remaining assessments.
 *
 * Formula:
 *   targetFinal = (currentAvg × gradedPct + needed × remainingPct) / 100
 *   → needed = (targetFinal − currentAvg × gradedPct/100) / (remainingPct/100)
 */
export function computeRequiredGrade(
  currentAvg: number,       // weighted avg of graded assessments (0–10)
  gradedWeightPct: number,  // % of course weight already graded (0–100)
  targetFinal: number,      // desired final course grade (0–10)
): { requiredGrade: number; feasible: boolean } {
  const remainingPct = 100 - gradedWeightPct;
  if (remainingPct <= 0) {
    return { requiredGrade: 0, feasible: false };
  }

  const required = (targetFinal - currentAvg * (gradedWeightPct / 100)) / (remainingPct / 100);
  const clamped = round4(Math.max(0, Math.min(10, required)));
  return {
    requiredGrade: clamped,
    feasible: required <= 10 && required >= 0,
  };
}

/**
 * Simulate multiple target GPAs for a course.
 * Returns an array of {targetGpa, requiredGrade, feasible}.
 */
export function simulateGpaTargets(
  currentAvg: number,
  gradedWeightPct: number,
  targets: number[] = [5.0, 7.0, 9.0],
): { target: number; requiredGrade: number; feasible: boolean }[] {
  return targets.map((target) => {
    const { requiredGrade, feasible } = computeRequiredGrade(currentAvg, gradedWeightPct, target);
    return { target, requiredGrade, feasible };
  });
}

// ---------------------------------------------------------------------------
//  Grade breakdown per course
// ---------------------------------------------------------------------------

export interface CourseGradeEntry {
  courseId: string;
  courseCode: string;
  courseName: string;
  ects: number;
  grade: number;
  classification: GradeClassification;
  displayLabel: string;
  weightGraded: number;   // 0-100 % of weight already graded
  targetSimulation: { target: number; requiredGrade: number; feasible: boolean }[];
}

/** Produce a detailed grade breakdown for each course. */
export function gradeBreakdown(
  courses: Course[],
  grades: Grade[],
  gpaTargets: number[] = [5.0, 7.0, 9.0],
): CourseGradeEntry[] {
  return courses.map((course) => {
    const courseGrades = grades.filter((g) => g.courseId === course.id);
    const grade = computeWeightedAverage(courseGrades);
    const weightGraded = courseGrades.reduce((sum, g) => sum + g.weight, 0);
    const targetSimulation = simulateGpaTargets(grade, Math.min(100, weightGraded), gpaTargets);

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      ects: course.ects,
      grade,
      classification: classifyGrade(grade),
      displayLabel: gradeDisplayLabel(grade),
      weightGraded: Math.min(100, round4(weightGraded)),
      targetSimulation,
    };
  });
}

// ---------------------------------------------------------------------------
//  Edge-case safety
// ---------------------------------------------------------------------------

/** Guard: returns a safe grade for display. Returns 0 for NaN/Infinity. */
export function safeGrade(grade: number): number {
  if (!Number.isFinite(grade)) return 0;
  return round4(grade);
}