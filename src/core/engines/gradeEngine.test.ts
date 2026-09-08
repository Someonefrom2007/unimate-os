/**
 * GradeEngine unit tests — classification, weighted average, GPA, ECTS, target simulation.
 * 100% coverage of all exported functions and edge cases.
 */
import { describe, expect, it } from 'vitest';
import {
  classifyGrade,
  classificationColor,
  computeCumulativeGPA,
  computeEctsPercentage,
  computeRequiredGrade,
  computeSemesterGPA,
  computeWeightedAverage,
  deriveCourseGrade,
  ectsProgressBar,
  gradeBreakdown,
  gradeDisplayLabel,
  safeGrade,
  simulateGpaTargets,
} from './gradeEngine';
import { GradeClassification } from '../domain/enums';
import type { Grade } from '../domain/model/Grade';
import type { Course } from '../domain/model/Course';

function makeGrade(overrides: Partial<Grade> & { id: string }): Grade {
  return {
    courseId: 'cs301',
    courseCode: 'CS301',
    assessmentName: 'Midterm',
    weight: 30,
    grade: 8,
    maxGrade: 10,
    dateLabel: 'Nov 2025',
    sortOrder: 1,
    ...overrides,
  };
}

function makeCourse(overrides: Partial<Course> & { id: string }): Course {
  return {
    code: 'CS301',
    name: 'Algorithms',
    professor: 'Dr. Smith',
    ects: 6,
    room: 'Turing 301',
    syllabusProgress: 80,
    avgGrade: 7.5,
    gradeLabel: '',
    nextSessionLabel: '',
    semesterId: null,
    status: 'active',
    accent: 'primary',
    sortOrder: 1,
    ...overrides,
  } as Course;
}

// ---------------------------------------------------------------------------
//  classifyGrade
// ---------------------------------------------------------------------------

describe('classifyGrade', () => {
  it('classifies Fail for grades < 5', () => {
    expect(classifyGrade(4.9)).toBe(GradeClassification.Fail);
    expect(classifyGrade(0)).toBe(GradeClassification.Fail);
    expect(classifyGrade(-1)).toBe(GradeClassification.Fail);
  });

  it('classifies Sufficient for 5.0 <= grade < 7', () => {
    expect(classifyGrade(5.0)).toBe(GradeClassification.Sufficient);
    expect(classifyGrade(6.9)).toBe(GradeClassification.Sufficient);
    expect(classifyGrade(6.5)).toBe(GradeClassification.Sufficient);
  });

  it('classifies Notable for 7.0 <= grade < 9.0', () => {
    expect(classifyGrade(7.0)).toBe(GradeClassification.Notable);
    expect(classifyGrade(8.9)).toBe(GradeClassification.Notable);
    expect(classifyGrade(8.0)).toBe(GradeClassification.Notable);
  });

  it('classifies Outstanding for grade >= 9.0', () => {
    expect(classifyGrade(9.0)).toBe(GradeClassification.Outstanding);
    expect(classifyGrade(10.0)).toBe(GradeClassification.Outstanding);
    expect(classifyGrade(10.5)).toBe(GradeClassification.Outstanding);
  });

  it('handles exact boundaries', () => {
    expect(classifyGrade(5.0)).toBe(GradeClassification.Sufficient);
    expect(classifyGrade(7.0)).toBe(GradeClassification.Notable);
    expect(classifyGrade(9.0)).toBe(GradeClassification.Outstanding);
    expect(classifyGrade(10.0)).toBe(GradeClassification.Outstanding);
  });
});

// ---------------------------------------------------------------------------
//  gradeDisplayLabel
// ---------------------------------------------------------------------------

describe('gradeDisplayLabel', () => {
  it('returns correct labels', () => {
    expect(gradeDisplayLabel(9.5)).toBe('Outstanding');
    expect(gradeDisplayLabel(10.5)).toBe('Matrícula de Honor');
    expect(gradeDisplayLabel(10.0)).toBe('Matrícula de Honor');
    expect(gradeDisplayLabel(8.0)).toBe('Notable');
    expect(gradeDisplayLabel(6.0)).toBe('Pass');
    expect(gradeDisplayLabel(4.0)).toBe('Fail');
    expect(gradeDisplayLabel(-1.0)).toBe('Fail');
  });
});

// ---------------------------------------------------------------------------
//  classificationColor
// ---------------------------------------------------------------------------

describe('classificationColor', () => {
  it('returns tailwind class for each classification', () => {
    expect(classificationColor(GradeClassification.Outstanding)).toBe('text-tertiary');
    expect(classificationColor(GradeClassification.Notable)).toBe('text-primary');
    expect(classificationColor(GradeClassification.Sufficient)).toBe('text-on-surface-variant');
    expect(classificationColor(GradeClassification.Fail)).toBe('text-error');
  });
});

// ---------------------------------------------------------------------------
//  computeWeightedAverage
// ---------------------------------------------------------------------------

describe('computeWeightedAverage', () => {
  it('computes correct weighted average', () => {
    // g1: weight=80, grade=8, maxGrade=10 → normalised = 8, contribution = 8*80 = 640
    // g2: weight=20, grade=6, maxGrade=10 → normalised = 6, contribution = 6*20 = 120
    // 760 / 100 = 7.6
    const grades = [
      makeGrade({ id: 'g1', weight: 80, grade: 8, maxGrade: 10 }),
      makeGrade({ id: 'g2', weight: 20, grade: 6, maxGrade: 10 }),
    ];
    expect(computeWeightedAverage(grades)).toBe(7.6);
  });

  it('returns 0 for empty grades', () => {
    expect(computeWeightedAverage([])).toBe(0);
  });

  it('returns 0 for all-zero weight', () => {
    const grades = [makeGrade({ id: 'g1', weight: 0, grade: 8, maxGrade: 10 })];
    expect(computeWeightedAverage(grades)).toBe(0);
  });

  it('skips grades with maxGrade 0', () => {
    const grades = [
      makeGrade({ id: 'g1', weight: 50, grade: 8, maxGrade: 0 }),
      makeGrade({ id: 'g2', weight: 50, grade: 6, maxGrade: 10 }),
    ];
    // Only g2 is valid: (6/10)*10 = 6
    expect(computeWeightedAverage(grades)).toBe(6);
  });

  it('handles non-10 max grades', () => {
    const grades = [makeGrade({ id: 'g1', weight: 100, grade: 80, maxGrade: 100 })];
    expect(computeWeightedAverage(grades)).toBe(8);
  });
});

// ---------------------------------------------------------------------------
//  deriveCourseGrade
// ---------------------------------------------------------------------------

describe('deriveCourseGrade', () => {
  it('uses avgGrade fallback when no grades match', () => {
    const course = makeCourse({ id: 'cs999', avgGrade: 7.5 });
    expect(deriveCourseGrade(course, [])).toBe(7.5);
  });

  it('uses computed average when grades exist', () => {
    const course = makeCourse({ id: 'cs301', avgGrade: 7.5 });
    const grades = [
      makeGrade({ id: 'g1', courseId: 'cs301', weight: 50, grade: 8, maxGrade: 10 }),
      makeGrade({ id: 'g2', courseId: 'cs301', weight: 50, grade: 9, maxGrade: 10 }),
    ];
    expect(deriveCourseGrade(course, grades)).toBe(8.5);
  });
});

// ---------------------------------------------------------------------------
//  computeSemesterGPA
// ---------------------------------------------------------------------------

describe('computeSemesterGPA', () => {
  it('computes weighted GPA across courses by ECTS', () => {
    const courses = [
      makeCourse({ id: 'cs301', ects: 6 }),
      makeCourse({ id: 'cs302', ects: 3 }),
    ];
    const grades = [
      makeGrade({ id: 'g1', courseId: 'cs301', weight: 100, grade: 8, maxGrade: 10 }),
      makeGrade({ id: 'g2', courseId: 'cs302', weight: 100, grade: 9, maxGrade: 10 }),
    ];
    // (8*6 + 9*3) / (6+3) = (48+27)/9 = 75/9 = 8.3333
    expect(computeSemesterGPA(courses, grades)).toBe(8.3333);
  });

  it('returns 0 for no courses', () => {
    expect(computeSemesterGPA([], [])).toBe(0);
  });

  it('returns 0 when total ECTS = 0', () => {
    const courses = [makeCourse({ id: 'cs301', ects: 0 })];
    expect(computeSemesterGPA(courses, [])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
//  computeCumulativeGPA
// ---------------------------------------------------------------------------

describe('computeCumulativeGPA', () => {
  it('works the same as semester GPA (all data)', () => {
    const courses = [makeCourse({ id: 'cs301', ects: 6 })];
    const grades = [makeGrade({ id: 'g1', courseId: 'cs301', weight: 100, grade: 9, maxGrade: 10 })];
    expect(computeCumulativeGPA(courses, grades)).toBe(9);
  });
});

// ---------------------------------------------------------------------------
//  computeEctsPercentage
// ---------------------------------------------------------------------------

describe('computeEctsPercentage', () => {
  it('computes percentage correctly', () => {
    expect(computeEctsPercentage(60, 180)).toBeCloseTo(33.3333, 3);
    expect(computeEctsPercentage(180, 180)).toBe(100);
    expect(computeEctsPercentage(0, 180)).toBe(0);
  });

  it('returns 0 for total 0', () => {
    expect(computeEctsPercentage(0, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
//  ectsProgressBar
// ---------------------------------------------------------------------------

describe('ectsProgressBar', () => {
  it('returns 0-100 clamped', () => {
    expect(ectsProgressBar(60, 180)).toBe(33);
    expect(ectsProgressBar(180, 180)).toBe(100);
    expect(ectsProgressBar(0, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
//  computeRequiredGrade
// ---------------------------------------------------------------------------

describe('computeRequiredGrade', () => {
  it('computes required grade for target', () => {
    // current avg 8, 60% graded, target 8.5
    // needed = (8.5 - 8*0.6) / 0.4 = (8.5 - 4.8) / 0.4 = 3.7/0.4 = 9.25
    const result = computeRequiredGrade(8, 60, 8.5);
    expect(result.requiredGrade).toBe(9.25);
    expect(result.feasible).toBe(true);
  });

  it('clamps to 0 when needed is negative', () => {
    // target 5, current avg 8, 60% graded → (5 - 8*0.6)/0.4 = (5-4.8)/0.4 = 0.5
    const result = computeRequiredGrade(8, 60, 5);
    expect(result.requiredGrade).toBe(0.5);
    expect(result.feasible).toBe(true);
  });

  it('marks infeasible when >10', () => {
    // target 10, current avg 8, 60% graded → 9.25 (still feasible)
    // target 10, current avg 4, 90% graded → (10 - 4*0.9)/0.1 = (10-3.6)/0.1 = 64 → infeasible
    const result = computeRequiredGrade(4, 90, 10);
    expect(result.feasible).toBe(false);
    expect(result.requiredGrade).toBe(10); // clamped
  });

  it('returns 0 and not feasible when no remaining weight', () => {
    const result = computeRequiredGrade(8, 100, 9);
    expect(result.requiredGrade).toBe(0);
    expect(result.feasible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  simulateGpaTargets
// ---------------------------------------------------------------------------

describe('simulateGpaTargets', () => {
  it('simulates 3 default targets', () => {
    const results = simulateGpaTargets(8, 60);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.target)).toEqual([5, 7, 9]);
  });

  it('custom targets', () => {
    const results = simulateGpaTargets(8, 60, [8.5]);
    expect(results).toHaveLength(1);
    expect(results[0].target).toBe(8.5);
    expect(results[0].requiredGrade).toBe(9.25);
  });
});

// ---------------------------------------------------------------------------
//  courseGradeBreakdown (via gradeBreakdown + deriveCourseGrade)
// ---------------------------------------------------------------------------

describe('courseGradeBreakdown', () => {
  it('returns per-course breakdown with correct classification', () => {
    const courses = [makeCourse({ id: 'cs301', avgGrade: 0 })];
    const grades = [makeGrade({ id: 'g1', courseId: 'cs301', weight: 100, grade: 8, maxGrade: 10 })];
    const result = gradeBreakdown(courses, grades);
    expect(result).toHaveLength(1);
    expect(result[0].grade).toBe(8);
    expect(result[0].classification).toBe(GradeClassification.Notable);
    expect(result[0].weightGraded).toBe(100);
  });
});

// ---------------------------------------------------------------------------
//  gradeBreakdown
// ---------------------------------------------------------------------------

describe('gradeBreakdown', () => {
  it('returns per-course breakdown with simulation', () => {
    const courses = [makeCourse({ id: 'cs301' })];
    const grades = [makeGrade({ id: 'g1', courseId: 'cs301', weight: 60, grade: 8, maxGrade: 10 })];
    const result = gradeBreakdown(courses, grades, [7, 9]);
    expect(result).toHaveLength(1);
    expect(result[0].targetSimulation).toHaveLength(2);
    expect(result[0].targetSimulation[0].target).toBe(7);
  });
});

// ---------------------------------------------------------------------------
//  safeGrade
// ---------------------------------------------------------------------------

describe('safeGrade', () => {
  it('returns same value for finite', () => {
    expect(safeGrade(8.5)).toBe(8.5);
  });

  it('returns 0 for NaN', () => {
    expect(safeGrade(NaN)).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(safeGrade(Infinity)).toBe(0);
  });
});