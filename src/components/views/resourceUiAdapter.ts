import type { Resource } from '@/core/domain/model/Resource';

/** Legacy snake_case UI shape for the Resources view. */
export interface UiResource {
  id: string;
  course_code: string;
  title: string;
  type: 'pdf' | 'document' | 'code' | 'slides' | 'link' | 'video';
  url: string;
  size_label: string;
  timestamp_label: string;
  favorite: boolean;
  sort_order: number;
}

export function toUiResource(resource: Resource): UiResource {
  return {
    id: resource.id,
    course_code: resource.courseCode,
    title: resource.title,
    type: resource.type as UiResource['type'],
    url: resource.url,
    size_label: resource.sizeLabel,
    timestamp_label: resource.timestampLabel,
    favorite: resource.favorite,
    sort_order: resource.sortOrder,
  };
}

export function fromUiResource(resource: UiResource): Resource {
  return {
    id: resource.id,
    courseCode: resource.course_code,
    title: resource.title,
    type: resource.type as Resource['type'],
    url: resource.url,
    sizeLabel: resource.size_label,
    timestampLabel: resource.timestamp_label,
    favorite: resource.favorite,
    sortOrder: resource.sort_order,
  };
}