/**
 * ResourceEngine unit tests — URL type detection, URL validation, filtering.
 */
import { describe, expect, it } from 'vitest';
import {
  categorizeResourceType,
  filterResources,
  isValidResourceUrl,
  sortResources,
  toggleFavorite,
} from './resourceEngine';
import { ResourceType } from '../domain/enums';
import type { Resource } from '../domain/model/Resource';

function makeResource(overrides: Partial<Resource> & { id: string }): Resource {
  return {
    courseCode: 'CS301',
    title: 'Untitled',
    type: ResourceType.Pdf,
    url: '/docs/untitled.pdf',
    sizeLabel: '1 MB',
    timestampLabel: 'Today',
    favorite: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe('categorizeResourceType', () => {
  it('detects PDF files', () => {
    expect(categorizeResourceType('report.pdf')).toBe(ResourceType.Pdf);
    expect(categorizeResourceType('https://example.com/paper.pdf')).toBe(ResourceType.Pdf);
  });

  it('detects document files', () => {
    expect(categorizeResourceType('notes.docx')).toBe(ResourceType.Document);
    expect(categorizeResourceType('readme.md')).toBe(ResourceType.Document);
    expect(categorizeResourceType('todo.txt')).toBe(ResourceType.Document);
  });

  it('detects video files', () => {
    expect(categorizeResourceType('lecture.mp4')).toBe(ResourceType.Video);
    expect(categorizeResourceType('recording.webm')).toBe(ResourceType.Video);
  });

  it('detects video links from YouTube', () => {
    expect(categorizeResourceType('https://youtube.com/watch?v=abc')).toBe(ResourceType.Video);
    expect(categorizeResourceType('https://youtu.be/abc')).toBe(ResourceType.Video);
    expect(categorizeResourceType('https://vimeo.com/12345')).toBe(ResourceType.Video);
  });

  it('detects code files', () => {
    expect(categorizeResourceType('main.py')).toBe(ResourceType.Code);
    expect(categorizeResourceType('app.js')).toBe(ResourceType.Code);
    expect(categorizeResourceType('algo.ipynb')).toBe(ResourceType.Code);
  });

  it('detects slides', () => {
    expect(categorizeResourceType('lecture.pptx')).toBe(ResourceType.Slides);
    expect(categorizeResourceType('keynote.key')).toBe(ResourceType.Slides);
  });

  it('detects plain links', () => {
    expect(categorizeResourceType('https://docs.python.org/')).toBe(ResourceType.Link);
    expect(categorizeResourceType('http://wiki.example.com/page')).toBe(ResourceType.Link);
  });

  it('returns Link for empty/unknown', () => {
    expect(categorizeResourceType('')).toBe(ResourceType.Link);
    expect(categorizeResourceType('noextension')).toBe(ResourceType.Link);
  });
});

describe('isValidResourceUrl', () => {
  it('accepts valid http URLs', () => {
    expect(isValidResourceUrl('https://example.com/doc.pdf')).toBe(true);
    expect(isValidResourceUrl('http://localhost:3000/app')).toBe(true);
  });

  it('accepts local paths', () => {
    expect(isValidResourceUrl('./relative/path.txt')).toBe(true);
    expect(isValidResourceUrl('/absolute/path.txt')).toBe(true);
    expect(isValidResourceUrl('../parent/file.pdf')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidResourceUrl('')).toBe(false);
    expect(isValidResourceUrl('   ')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isValidResourceUrl('not a url')).toBe(false);
    expect(isValidResourceUrl('ftp://')).toBe(false);
  });
});

describe('filterResources', () => {
  const resources = [
    makeResource({ id: 'r1', courseCode: 'CS301', type: ResourceType.Pdf, favorite: true }),
    makeResource({ id: 'r2', courseCode: 'CS302', type: ResourceType.Document, favorite: false }),
    makeResource({ id: 'r3', courseCode: 'CS301', type: ResourceType.Video, favorite: true }),
    makeResource({ id: 'r4', courseCode: 'MATH201', type: ResourceType.Code, favorite: false }),
  ];

  it('returns all for no filters', () => {
    expect(filterResources(resources)).toHaveLength(4);
  });

  it('filters by course code', () => {
    expect(filterResources(resources, { courseCode: 'CS301' })).toHaveLength(2);
  });

  it('filters by type', () => {
    expect(filterResources(resources, { type: ResourceType.Pdf })).toHaveLength(1);
  });

  it('filters by course code + type', () => {
    expect(filterResources(resources, { courseCode: 'CS301', type: ResourceType.Video })).toHaveLength(1);
  });

  it('filters favorites only', () => {
    expect(filterResources(resources, { onlyFavorites: true })).toHaveLength(2);
  });

  it('returns empty when no match', () => {
    expect(filterResources(resources, { courseCode: 'PHY101' })).toHaveLength(0);
  });
});

describe('sortResources', () => {
  it('sorts favorites first', () => {
    const res = [
      makeResource({ id: 'r1', favorite: false, sortOrder: 1 }),
      makeResource({ id: 'r2', favorite: true, sortOrder: 5 }),
      makeResource({ id: 'r3', favorite: false, sortOrder: 2 }),
    ];
    const sorted = sortResources(res);
    expect(sorted.map((r) => r.id)).toEqual(['r2', 'r1', 'r3']);
  });
});

describe('toggleFavorite', () => {
  it('toggles from false to true', () => {
    const res = makeResource({ id: 'r1', favorite: false });
    expect(toggleFavorite(res).favorite).toBe(true);
  });

  it('toggles from true to false', () => {
    const res = makeResource({ id: 'r1', favorite: true });
    expect(toggleFavorite(res).favorite).toBe(false);
  });

  it('does not mutate original', () => {
    const res = makeResource({ id: 'r1', favorite: false });
    toggleFavorite(res);
    expect(res.favorite).toBe(false);
  });
});