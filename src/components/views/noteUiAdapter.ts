import type { Note } from '@/core/domain/model/Note';
import type { AccentColor as UiAccent } from '@/lib/types';

/** Legacy snake_case UI shape for the Notes view. */
export interface UiNote {
  id: string;
  title: string;
  icon: string;
  timestamp_label: string;
  accent: UiAccent;
  sort_order: number;
}

export function toUiNote(note: Note): UiNote {
  return {
    id: note.id,
    title: note.title,
    icon: note.icon,
    timestamp_label: note.timestampLabel,
    accent: note.accent as UiAccent,
    sort_order: note.sortOrder,
  };
}

export function fromUiNote(note: UiNote): Note {
  return {
    id: note.id,
    title: note.title,
    icon: note.icon,
    timestampLabel: note.timestamp_label,
    accent: note.accent as Note['accent'],
    sortOrder: note.sort_order,
  };
}