import { useEffect, useMemo, useState } from 'react';
import { Search, X, BookOpen, CheckSquare, GraduationCap, FileText, CalendarDays, Timer, ArrowUpRight } from 'lucide-react';
import type { Course, Task, Assessment, Note, ScheduleEntry, Resource, ViewKey } from '@/lib/types';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewKey) => void;
  courses: Course[];
  tasks: Task[];
  assessments: Assessment[];
  notes: Note[];
  schedule: ScheduleEntry[];
  resources: Resource[];
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  view: ViewKey;
}

const typeIcon: Record<string, typeof BookOpen> = {
  Course: BookOpen,
  Task: CheckSquare,
  Exam: GraduationCap,
  Note: FileText,
  Event: CalendarDays,
  Resource: FileText,
};

export function SearchModal({ open, onClose, onNavigate, courses, tasks, assessments, notes, schedule, resources }: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const all: SearchResult[] = [
      ...courses.map((item) => ({ id: item.id, title: item.name, subtitle: `${item.code} · ${item.professor}`, type: 'Course', view: 'courses' as ViewKey })),
      ...tasks.map((item) => ({ id: item.id, title: item.title, subtitle: `${item.course_code} · ${item.due_label || 'No deadline'}`, type: 'Task', view: 'tasks' as ViewKey })),
      ...assessments.map((item) => ({ id: item.id, title: item.title, subtitle: `${item.code_label} · ${item.days_until_label}`, type: 'Exam', view: 'assessments' as ViewKey })),
      ...notes.map((item) => ({ id: item.id, title: item.title, subtitle: item.timestamp_label, type: 'Note', view: 'notes' as ViewKey })),
      ...schedule.map((item) => ({ id: item.id, title: item.course_name, subtitle: `${item.day_label} · ${item.time_label}`, type: 'Event', view: 'schedule' as ViewKey })),
      ...resources.map((item) => ({ id: item.id, title: item.title, subtitle: `${item.course_code} · ${item.type}`, type: 'Resource', view: 'resources' as ViewKey })),
    ];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return all.slice(0, 8);
    return all.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(normalized)).slice(0, 12);
  }, [query, courses, tasks, assessments, notes, schedule, resources]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
          <Search className="h-5 w-5 text-primary" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses, tasks, exams, notes…" className="flex-1 bg-transparent font-body-lg text-[15px] text-on-background placeholder:text-on-surface-variant/40 focus:outline-none" />
          <kbd className="hidden rounded border border-white/10 px-2 py-1 font-label-mono-xs text-on-surface-variant/50 sm:block">ESC</kbd>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-background"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length > 0 ? results.map((result) => {
            const Icon = typeIcon[result.type] || FileText;
            return (
              <button key={`${result.type}-${result.id}`} onClick={() => { onNavigate(result.view); onClose(); }} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-body-md text-[13px] font-medium text-on-background">{result.title}</p><p className="truncate font-label-mono-xs text-on-surface-variant/50">{result.type} · {result.subtitle}</p></div>
                <ArrowUpRight className="h-4 w-4 text-on-surface-variant/30 group-hover:text-primary" />
              </button>
            );
          }) : <p className="px-3 py-8 text-center font-body-md text-on-surface-variant/60">No matches found.</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-white/8 px-4 py-3 font-label-mono-xs text-on-surface-variant/50"><Timer className="h-3.5 w-3.5" /> Press <kbd className="rounded border border-white/10 px-1">⌘K</kbd> anytime to search your workspace</div>
      </div>
    </div>
  );
}
