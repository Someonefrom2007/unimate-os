import { AccentColor } from '../enums';

/** A quick-access note / document reference. */
export interface Note {
  id: string;
  title: string;
  icon: string;
  timestampLabel: string;
  accent: AccentColor;
  sortOrder: number;
}