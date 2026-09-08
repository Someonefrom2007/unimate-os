import { GoalCategory, GoalStatus } from '../enums';

/** A tracked academic or personal goal. */
export interface Goal {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadlineLabel: string;
  status: GoalStatus;
  sortOrder: number;
}