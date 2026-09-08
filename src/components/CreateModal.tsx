import { useState, useEffect } from 'react';
import { X, CheckSquare, FileText, Target, FolderOpen, Plus } from 'lucide-react';
import type { Course } from '@/lib/types';

export type CreateKind = 'task' | 'note' | 'goal' | 'resource';

interface CreateModalProps {
  open: boolean;
  kind: CreateKind;
  courses: Course[];
  onCreateTask: (input: { title: string; course_code: string; priority: 'high' | 'medium' | 'low'; estimated_hours: number; due_label: string }) => void;
  onCreateNote: (input: { title: string; icon: string }) => void;
  onCreateGoal: (input: { name: string; description: string; category: 'academic' | 'study' | 'personal' | 'health'; target_value: number; unit: string; deadline_label: string }) => void;
  onCreateResource: (input: { course_code: string; title: string; type: 'pdf' | 'document' | 'code' | 'slides' | 'link' | 'video'; url: string }) => void;
  onClose: () => void;
}

const kindMeta: Record<CreateKind, { title: string; subtitle: string; icon: typeof CheckSquare }> = {
  task: { title: 'New Task', subtitle: 'Add a weekly deliverable or deadline', icon: CheckSquare },
  note: { title: 'New Note', subtitle: 'Create a quick document entry', icon: FileText },
  goal: { title: 'New Goal', subtitle: 'Set an academic or personal target', icon: Target },
  resource: { title: 'Add Resource', subtitle: 'Link a PDF, doc, slides, or URL', icon: FolderOpen },
};

const inputCls = 'w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none';
const labelCls = 'mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50';
const pillCls = (active: boolean) =>
  `flex-1 rounded-lg border px-2 py-2 font-label-mono-sm text-[11px] font-semibold transition-all ${
    active
      ? 'border-primary/40 bg-primary/10 text-primary'
      : 'border-white/10 bg-surface-container/40 text-on-surface-variant hover:bg-white/5'
  }`;

export function CreateModal({
  open,
  kind,
  courses,
  onCreateTask,
  onCreateNote,
  onCreateGoal,
  onCreateResource,
  onClose,
}: CreateModalProps) {
  // Task
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [dueLabel, setDueLabel] = useState('');
  // Note
  const [icon, setIcon] = useState('description');
  // Goal
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'academic' | 'study' | 'personal' | 'health'>('academic');
  const [targetValue, setTargetValue] = useState(100);
  const [unit, setUnit] = useState('');
  const [deadlineLabel, setDeadlineLabel] = useState('');
  // Resource
  const [type, setType] = useState<'pdf' | 'document' | 'code' | 'slides' | 'link' | 'video'>('pdf');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(''); setCourseCode(''); setPriority('medium'); setEstimatedHours(0); setDueLabel('');
    setIcon('description'); setDescription(''); setCategory('academic'); setTargetValue(100);
    setUnit(''); setDeadlineLabel(''); setType('pdf'); setUrl(''); setError('');
  }, [open, kind]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    setError('');
    const chosenTitle = title.trim();
    if (!chosenTitle) { setError('Please give it a title.'); return; }

    if (kind === 'task') {
      onCreateTask({
        title: chosenTitle,
        course_code: courseCode || courses[0]?.code || '',
        priority,
        estimated_hours: Math.max(0, estimatedHours),
        due_label: dueLabel.trim(),
      });
    } else if (kind === 'note') {
      onCreateNote({ title: chosenTitle, icon });
    } else if (kind === 'goal') {
      onCreateGoal({
        name: chosenTitle,
        description: description.trim(),
        category,
        target_value: Math.max(1, targetValue),
        unit: unit.trim(),
        deadline_label: deadlineLabel.trim(),
      });
    } else {
      onCreateResource({
        course_code: courseCode || courses[0]?.code || '',
        title: chosenTitle,
        type,
        url: url.trim(),
      });
    }
    handleClose();
  };

  const Meta = kindMeta[kind];
  const Icon = Meta.icon;

  return open ? (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={handleClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">{Meta.title}</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">{Meta.subtitle}</p>
          </div>
          <button onClick={handleClose} className="text-on-surface-variant hover:text-on-background">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className={labelCls}>
              {kind === 'goal' ? 'Name' : kind === 'resource' ? 'Title' : kind === 'note' ? 'Title' : 'Task Title'}
            </label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === 'goal' ? 'e.g. Finish OS project' :
                kind === 'resource' ? 'e.g. Lecture 7 slides' :
                kind === 'note' ? 'e.g. Algorithms summary' : 'e.g. Submit lab 3 report'
              }
              autoFocus
            />
          </div>

          {(kind === 'task' || kind === 'resource') && (
            <div>
              <label className={labelCls}>Course</label>
              <select className={inputCls} value={courseCode} onChange={(e) => setCourseCode(e.target.value)}>
                <option value="">No course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {kind === 'task' && (
            <>
              <div>
                <label className={labelCls}>Priority</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button key={p} onClick={() => setPriority(p)} className={`${pillCls(priority === p)} capitalize`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Estimated Hours</label>
                  <input
                    type="number" min={0} max={80} step={0.5}
                    className={inputCls} value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Due Label</label>
                  <input
                    className={inputCls} value={dueLabel}
                    onChange={(e) => setDueLabel(e.target.value)}
                    placeholder="e.g. Fri 18:00"
                  />
                </div>
              </div>
            </>
          )}

          {kind === 'note' && (
            <div>
              <label className={labelCls}>Icon</label>
              <div className="flex gap-2">
                {['description', 'picture_as_pdf', 'code', 'event_note'].map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`rounded-lg border px-3 py-2 font-label-mono-sm text-[11px] ${
                      icon === ic
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-white/10 bg-surface-container/40 text-on-surface-variant hover:bg-white/5'
                    }`}
                  >
                    {ic.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {kind === 'goal' && (
            <>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  className={`${inputCls} resize-none`} rows={2} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context…"
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <div className="flex gap-2">
                  {(['academic', 'study', 'personal', 'health'] as const).map((c) => (
                    <button key={c} onClick={() => setCategory(c)} className={`${pillCls(category === c)} capitalize`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Target Value</label>
                  <input
                    type="number" min={1} step={1}
                    className={inputCls} value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <input
                    className={inputCls} value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. hours / % / tasks"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Deadline Label</label>
                <input
                  className={inputCls} value={deadlineLabel}
                  onChange={(e) => setDeadlineLabel(e.target.value)}
                  placeholder="e.g. End of semester"
                />
              </div>
            </>
          )}

          {kind === 'resource' && (
            <>
              <div>
                <label className={labelCls}>Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['pdf', 'document', 'code', 'slides', 'link', 'video'] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)} className={pillCls(type === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>URL</label>
                <input
                  className={inputCls} value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://… or /path/to/file.pdf"
                />
              </div>
            </>
          )}

          {error && <p className="font-body-md text-[13px] text-error">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-4">
          <button onClick={handleClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-body-md text-[13px] text-on-surface-variant hover:bg-white/10">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create
          </button>
        </div>
      </div>
    </div>
  ) : null;
}