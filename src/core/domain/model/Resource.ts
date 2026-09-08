import { ResourceType } from '../enums';

/** A university resource (PDF, link, code, video). */
export interface Resource {
  id: string;
  courseCode: string;
  title: string;
  type: ResourceType;
  url: string;
  sizeLabel: string;
  timestampLabel: string;
  favorite: boolean;
  sortOrder: number;
}