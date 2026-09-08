/** An individual graded assessment entry linked to a course. */
export interface Grade {
  id: string;
  courseId: string | null;
  courseCode: string;
  assessmentName: string;
  weight: number;
  grade: number;
  maxGrade: number;
  dateLabel: string;
  sortOrder: number;
}