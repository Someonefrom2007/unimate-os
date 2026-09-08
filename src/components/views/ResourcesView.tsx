import { useEffect } from 'react';
import { FileText, FileCode, File, Link as LinkIcon, Video, Star, Plus, FolderOpen } from 'lucide-react';
import { useResourceStore } from '@/core/store/useResourceStore';
import { sortResources } from '@/core/engines/resourceEngine';
import { toUiResource, fromUiResource, type UiResource } from './resourceUiAdapter';

interface ResourcesViewProps {
  onCreate: () => void;
}

function getIcon(type: string) {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'code':
      return FileCode;
    case 'slides':
      return File;
    case 'link':
      return LinkIcon;
    case 'video':
      return Video;
    default:
      return File;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'pdf':
      return 'text-error bg-error/10';
    case 'code':
      return 'text-tertiary bg-tertiary/10';
    case 'slides':
      return 'text-primary bg-primary/10';
    case 'link':
      return 'text-secondary bg-secondary/10';
    case 'video':
      return 'text-primary bg-primary/10';
    default:
      return 'text-on-surface-variant bg-white/5';
  }
}

export function ResourcesView({ onCreate }: ResourcesViewProps) {
  const { data, loading, error, initialized, load, upsert } = useResourceStore();

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const resources: UiResource[] = sortResources(data).map(toUiResource);
  const favorites = resources.filter((r) => r.favorite);
  const recent = resources.filter((r) => !r.favorite);

  const handleToggleFavorite = async (resource: UiResource) => {
    try {
      await upsert(fromUiResource({ ...resource, favorite: !resource.favorite }));
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  const renderRow = (r: UiResource) => {
    const Icon = getIcon(r.type);
    return (
      <div key={r.id} className="group flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/40 p-3 transition-all duration-200 hover:border-white/10 hover:bg-surface-container/70">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getTypeColor(r.type)}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-mono-sm text-[12px] font-medium text-on-background">{r.title}</p>
          <p className="font-label-mono-xs text-on-surface-variant/50">
            {r.course_code} · {r.size_label} · {r.timestamp_label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open(r.url, '_blank')}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 font-label-mono-xs text-primary transition-all hover:bg-primary/20"
          >
            <FolderOpen className="h-3 w-3" />
            Open
          </button>
          <button
            onClick={() => void handleToggleFavorite(r)}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          >
            <Star className={`h-3.5 w-3.5 ${r.favorite ? 'text-amber-400' : 'text-on-surface-variant/40'}`} />
          </button>
        </div>
      </div>
    );
  };

  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading resources…</p>
        </div>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="font-body-lg text-error">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-label-mono-sm text-on-surface-variant/60">
          {resources.length} resources · {favorites.length} favorites
        </p>
        <button onClick={onCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add Resource
        </button>
      </div>

      {favorites.length > 0 && (
        <div className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" strokeWidth={2.5} />
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Favorites</h3>
          </div>
          <div className="flex flex-col gap-2">
            {favorites.map(renderRow)}
          </div>
        </div>
      )}

      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-on-surface-variant/50" strokeWidth={2.5} />
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Recent</h3>
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center font-label-mono-sm text-on-surface-variant/40">No resources yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map(renderRow)}
          </div>
        )}
      </div>
    </div>
  );
}