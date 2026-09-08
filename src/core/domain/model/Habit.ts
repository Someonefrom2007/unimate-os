import { AccentColor } from '../enums';

/** A recurring academic habit tracker. */
export interface Habit {
  id: string;
  name: string;
  streakLabel: string;
  progressPercent: number;
  detailLabel: string;
  accent: AccentColor;
  sortOrder: number;
}