/**
 * NoteEngine unit tests — search, tag extraction, filtering.
 */
import { describe, expect, it } from 'vitest';
import { extractTags, filterByTags, noteCount, searchNotes, sortNotes } from './noteEngine';
import { AccentColor } from '../domain/enums';
import type { Note } from '../domain/model/Note';

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: 'Untitled Note',
    icon: '📄',
    timestampLabel: 'Today',
    accent: AccentColor.Primary,
    sortOrder: 0,
    ...overrides,
  };
}

describe('searchNotes', () => {
  const notes = [
    makeNote({ id: 'n1', title: 'Dijkstra Algorithm Notes' }),
    makeNote({ id: 'n2', title: 'OS Thread Scheduling' }),
    makeNote({ id: 'n3', title: 'Eigenvalue Cheat Sheet' }),
  ];

  it('returns all notes for empty query', () => {
    expect(searchNotes(notes, '')).toHaveLength(3);
  });

  it('returns all notes for whitespace query', () => {
    expect(searchNotes(notes, '   ')).toHaveLength(3);
  });

  it('matches case-insensitively', () => {
    expect(searchNotes(notes, 'dijkstra')).toHaveLength(1);
    expect(searchNotes(notes, 'DIJKSTRA')).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    expect(searchNotes(notes, 'quantum')).toHaveLength(0);
  });

  it('matches partial strings', () => {
    expect(searchNotes(notes, 'thread')).toHaveLength(1);
    expect(searchNotes(notes, 'algo')).toHaveLength(1);
  });
});

describe('extractTags', () => {
  it('extracts hashtags from markdown', () => {
    expect(extractTags('This is #webdev and #javascript')).toEqual(['webdev', 'javascript']);
  });

  it('handles tags with hyphens and underscores', () => {
    expect(extractTags('#my-tag and #my_tag')).toEqual(['my-tag', 'my_tag']);
  });

  it('returns empty array for no tags', () => {
    expect(extractTags('No tags here')).toEqual([]);
  });

  it('deduplicates repeated tags', () => {
    expect(extractTags('#a and #a again')).toEqual(['a']);
  });

  it('does not treat markdown headings as tags', () => {
    expect(extractTags('# Heading\nSome #tag1 and #tag2')).toEqual(['tag1', 'tag2']);
  });

  it('handles empty string', () => {
    expect(extractTags('')).toEqual([]);
  });
});

describe('filterByTags', () => {
  const notes = [
    makeNote({ id: 'n1', title: 'Dijkstra Algorithm #algorithms' }),
    makeNote({ id: 'n2', title: 'OS Thread Scheduling #os' }),
    makeNote({ id: 'n3', title: 'Eigenvalue Cheat Sheet #math' }),
  ];

  it('returns all notes for empty tags', () => {
    expect(filterByTags(notes, [])).toHaveLength(3);
  });

  it('filters by matching tag in title', () => {
    expect(filterByTags(notes, ['algorithms'])).toHaveLength(1);
    expect(filterByTags(notes, ['algorithms'])[0].id).toBe('n1');
  });

  it('filters with OR logic for multiple tags', () => {
    expect(filterByTags(notes, ['algorithms', 'math'])).toHaveLength(2);
  });

  it('returns empty when no matches', () => {
    expect(filterByTags(notes, ['physics'])).toHaveLength(0);
  });

  it('matches case-insensitively', () => {
    expect(filterByTags(notes, ['ALGORITHMS'])).toHaveLength(1);
  });
});

describe('sortNotes', () => {
  it('sorts by sortOrder ascending', () => {
    const notes = [
      makeNote({ id: 'n1', sortOrder: 5 }),
      makeNote({ id: 'n2', sortOrder: 1 }),
      makeNote({ id: 'n3', sortOrder: 3 }),
    ];
    const sorted = sortNotes(notes);
    expect(sorted.map((n) => n.id)).toEqual(['n2', 'n3', 'n1']);
  });

  it('preserves order for equal sortOrder', () => {
    const notes = [
      makeNote({ id: 'n1', sortOrder: 1 }),
      makeNote({ id: 'n2', sortOrder: 1 }),
    ];
    const sorted = sortNotes(notes);
    expect(sorted[0].id).toBe('n1');
    expect(sorted[1].id).toBe('n2');
  });
});

describe('noteCount', () => {
  it('returns 0 for empty', () => {
    expect(noteCount([])).toBe(0);
  });

  it('returns count', () => {
    expect(noteCount([makeNote({ id: 'n1' }), makeNote({ id: 'n2' })])).toBe(2);
  });
});