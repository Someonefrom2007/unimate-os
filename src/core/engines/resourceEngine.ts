/**
 * ResourceEngine — pure domain logic for the resources vertical slice.
 * Categorizes content type from URL/path, validates URLs, filters resources.
 */
import { ResourceType } from '../domain/enums';
import type { Resource } from '../domain/model/Resource';

/** Detect a resource type from a URL or file path by extension / scheme. */
export function categorizeResourceType(urlOrPath: string): ResourceType {
  const value = urlOrPath.trim().toLowerCase();

  // Prefer explicit web scheme detection first.
  if (/^https?:\/\//.test(value)) {
    // Video hosts
    if (/(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/.test(value)) {
      return ResourceType.Video;
    }
    // Generic web link with no known file extension → Link
    const ext = extractExtension(value);
    if (ext) return extensionToType(ext);
    return ResourceType.Link;
  }

  if (value.startsWith('ftp://') || value.startsWith('mailto:')) {
    return ResourceType.Link;
  }

  const ext = extractExtension(value);
  if (ext) return extensionToType(ext);

  return ResourceType.Link;
}

function extractExtension(value: string): string | null {
  // Strip query string / hash
  const clean = value.split(/[?#]/)[0];
  const match = clean.match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

function extensionToType(ext: string): ResourceType {
  switch (ext) {
    case 'pdf':
      return ResourceType.Pdf;
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
    case 'rtf':
    case 'pages':
    case 'odt':
      return ResourceType.Document;
    case 'ppt':
    case 'pptx':
    case 'key':
    case 'odp':
      return ResourceType.Slides;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'webm':
    case 'mkv':
    case 'wmv':
    case 'mp3':
      return ResourceType.Video;
    case 'js':
    case 'ts':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'go':
    case 'rs':
    case 'html':
    case 'css':
    case 'json':
    case 'ipynb':
      return ResourceType.Code;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return ResourceType.Link;
    default:
      return ResourceType.Link;
  }
}

/** Validate a URL or local path string crudely. */
export function isValidResourceUrl(urlOrPath: string): boolean {
  const value = urlOrPath.trim();
  if (!value) return false;
  if (/^(https?|ftp):\/\/\/?/.test(value)) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  // Local paths (./, /, ../) are allowed
  return /^[./~]/.test(value) || /^[A-Za-z]:[\\/]/.test(value);
}

/** Filter a list of resources by optional course code and/or type. */
export function filterResources(
  resources: Resource[],
  opts: { courseCode?: string; type?: ResourceType; onlyFavorites?: boolean } = {},
): Resource[] {
  return resources.filter((r) => {
    if (opts.courseCode && r.courseCode !== opts.courseCode) return false;
    if (opts.type && r.type !== opts.type) return false;
    if (opts.onlyFavorites && !r.favorite) return false;
    return true;
  });
}

/** Sort resources by favorite first, then sort order. */
export function sortResources(resources: Resource[]): Resource[] {
  return [...resources].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

/** Toggle the favorite flag on a resource copy. */
export function toggleFavorite(resource: Resource): Resource {
  return { ...resource, favorite: !resource.favorite };
}
