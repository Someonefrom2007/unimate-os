import { FileText, FileCode, ChevronRight } from 'lucide-react';
import type { Note } from '@/lib/types';
import { accentText, accentSoftBg } from '@/lib/accent';

interface NotesAccessProps {
  notes: Note[];
  onViewAll?: () => void;
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

export function NotesAccess({ notes, onViewAll }: NotesAccessProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Quick Notes
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Recent documents & resources
          </p>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 font-label-mono-sm text-[11px] text-primary/80 transition-all duration-200 hover:text-primary">
          All notes
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {notes.map((note) => {
          const Icon = getIcon(note.icon);
          return (
            <button
              key={note.id}
              className="group flex w-full items-center gap-3 rounded-lg border border-white/5 bg-surface-container/40 p-3 text-left transition-all duration-200 hover:border-white/10 hover:bg-surface-container/70"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentSoftBg(note.accent)}`}>
                <Icon className={`h-[18px] w-[18px] ${accentText(note.accent)}`} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-label-mono-sm text-[12px] font-medium text-on-background">
                  {note.title}
                </p>
                <p className="font-label-mono-xs text-on-surface-variant/50">
                  {note.timestamp_label}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-on-surface-variant/30 transition-transform group-hover:translate-x-0.5 group-hover:text-on-surface-variant/60" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
