import { AccentColor, CourseStatus } from '../enums';

/** A university course enrollment. Relates to `Semester`, `Task`, `Exam`, `Grade`. */
export interface Course {
  id: string;
  semesterId: string | null;
  code: string;
  name: string;
  professor: string;
  ects: number;
  room: string;
  syllabusProgress: number;
  avgGrade: number;
  gradeLabel: string;
  nextSessionLabel: string;
  status: CourseStatus;
  accent: AccentColor;
  sortOrder: number;
}