import { SemesterType } from '../enums';

/** An academic term / semester. Groups courses belonging together. */
export interface Semester {
  id: string;
  name: string;
  type: SemesterType;
  startDateLabel: string;
  endDateLabel: string;
  isActive: boolean;
  sortOrder: number;
}