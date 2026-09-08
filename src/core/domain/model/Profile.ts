import { AccentColor } from '../enums';

/** Student identity. Single-row entity. */
export interface Profile {
  id: string;
  name: string;
  initials: string;
  email: string;
  university: string;
  degree: string;
  yearLabel: string;
  semesterLabel: string;
  targetGpa: number;
  totalEcts: number;
  completedEcts: number;
  accent: AccentColor;
}