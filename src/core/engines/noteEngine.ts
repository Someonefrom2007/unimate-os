/**
 * NoteEngine — pure domain logic for the notes vertical slice.
 * Searches titles, extracts #tags, and filters notes.
 */
import type { Note } from '../domain/model/Note';

/** Search notes by a case-insensitive query across title. */
export function searchNotes(notes: Note[], query: string): Note[] {
  if (!query.trim()) return notes;
  const q = query.toLowerCase().trim();
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q),
  );
}

/** Extract #tag tokens from a markdown string. */
export function extractTags(content: string): string[] {
  const regex = /#([A-Za-z0-9_-]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return [...new Set(tags)];
}

/** Filter notes that contain any of the given tags in their title. */
export function filterByTags(notes: Note[], tags: string[]): Note[] {
  if (tags.length === 0) return notes;
  const lower = tags.map((t) => t.toLowerCase());
  return notes.filter((n) => {
    const titleLower = n.title.toLowerCase();
    return lower.some((tag) => titleLower.includes(tag));
  });
}

/** Sort notes by sort order, with pinned notes first. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Count notes. */
export function noteCount(notes: Note[]): number {
  return notes.length;
}
