import { useEffect, useMemo, useState } from 'react';
import { FileText, FileCode, Plus, Search } from 'lucide-react';
import { useNoteStore } from '@/core/store/useNoteStore';
import { searchNotes, sortNotes } from '@/core/engines/noteEngine';
import { accentText, accentSoftBg } from '@/lib/accent';
import { toUiNote } from './noteUiAdapter';

interface NotesViewProps {
  onCreate: () => void;
}

function getIcon(iconName: string) {
  switch (iconName) {
    case 'picture_as_pdf':
      return FileText;
    case 'code':
      return FileCode;
    default:
      return FileText;
  }
}

export function NotesView({ onCreate }: NotesViewProps) {
  const { data, loading, error, initialized, load } = useNoteStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const domainNotes = useMemo(() => sortNotes(data), [data]);

  // Search over title (pure engine search), then map to UI shape.
  const notes = useMemo(() => {
    const matched = searchNotes(domainNotes, query);
    return matched.map(toUiNote);
  }, [domainNotes, query]);

  if (loading && !initialized) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading notes…</p>
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
      <div className="flex items-center justify-between gap-3">
        <p className="font-label-mono-sm text-on-surface-variant/60">
          {notes.length} document{notes.length !== 1 ? 's' : ''} · Sorted by recent
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-44 rounded-lg border border-white/10 bg-surface-container/60 py-2 pl-9 pr-3 font-body-md text-[13px] text-on-background focus:border-primary/40 focus:outline-none"
            />
          </div>
          <button onClick={onCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => {
          const Icon = getIcon(note.icon);
          return (
            <div
              key={note.id}
              className="glass-card group rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] hover:border-white/10"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentSoftBg(note.accent)}`}>
                  <Icon className={`h-6 w-6 ${accentText(note.accent)}`} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-mono-sm text-[13px] font-medium text-on-background">
                    {note.title}
                  </p>
                  <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">
                    {note.timestamp_label}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => window.alert('Note: ' + note.title)}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 font-label-mono-xs text-primary transition-all hover:bg-primary/20"
                >
                  Open
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(note.title).then(() => alert('Copied: ' + note.title))}
                  className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 font-label-mono-xs text-on-surface-variant transition-all hover:bg-white/10"
                >
                  Share
                </button>
              </div>
            </div>
          );
        })}
        {notes.length === 0 && (
          <div className="glass-card col-span-full rounded-3xl p-10 text-center">
            <p className="font-label-mono-sm text-on-surface-variant/50">No notes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}