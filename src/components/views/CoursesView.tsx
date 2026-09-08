import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MapPin, Clock, User, BookOpen, Plus, Trash2, AlertTriangle, X,
  FileText, Target, CheckSquare, StickyNote, Palette, Pencil,
} from 'lucide-react';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useTaskStore } from '@/core/store/useTaskStore';
import { useExamStore } from '@/core/store/useExamStore';
import { useNoteStore } from '@/core/store/useNoteStore';
import { useResourceStore } from '@/core/store/useResourceStore';
import { useGradeStore } from '@/core/store/useGradeStore';
import type { Course as DomainCourse } from '@/core/domain/model/Course';
import type { Task as DomainTask } from '@/core/domain/model/Task';
import type { Note as DomainNote } from '@/core/domain/model/Note';
import { AccentColor, CourseStatus, TaskPriority, TaskStatus } from '@/core/domain/enums';
import { createId } from '@/core/domain/ids';
import { predictCourseDeleteCascade } from '@/core/engines/courseEngine';
import { accentHex } from '@/lib/accent';
import { toUiCourse, type UiCourse } from './courseUiAdapter';
import { toUiTask } from './taskUiAdapter';
import { toUiResource } from './resourceUiAdapter';

/* ------------------------------------------------------------------ */
/*  Course Accent Palette                                               */
/* ------------------------------------------------------------------ */

const COURSE_PALETTE: { key: AccentColor; label: string; hex: string }[] = [
  { key: AccentColor.Gold,    label: 'Gold',    hex: '#f59e0b' },
  { key: AccentColor.Emerald, label: 'Emerald', hex: '#34d399' },
  { key: AccentColor.Cyan,    label: 'Cyan',    hex: '#22d3ee' },
  { key: AccentColor.Rose,    label: 'Rose',    hex: '#fb7185' },
  { key: AccentColor.Indigo,  label: 'Indigo',  hex: '#818cf8' },
  { key: AccentColor.Amber,   label: 'Amber',   hex: '#fbbf24' },
  { key: AccentColor.Slate,   label: 'Slate',   hex: '#94a3b8' },
  { key: AccentColor.Violet,  label: 'Violet',  hex: '#a78bfa' },
  { key: AccentColor.Primary,    label: 'Primary',    hex: '#ffc880' },
  { key: AccentColor.Secondary,  label: 'Secondary',  hex: '#b4b7ff' },
  { key: AccentColor.Tertiary,   label: 'Tertiary',   hex: '#5beaad' },
];

function AccentColorPicker({
  value,
  onChange,
  size = 'md',
}: {
  value: string;
  onChange: (color: AccentColor) => void;
  size?: 'sm' | 'md';
}) {
  const sz = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const ring = size === 'sm' ? 'ring-2 ring-offset-1 ring-offset-surface-container' : 'ring-2 ring-offset-2 ring-offset-surface-container';

  return (
    <div className="flex flex-wrap gap-2">
      {COURSE_PALETTE.map((c) => (
        <button
          key={c.key}
          title={c.label}
          onClick={() => onChange(c.key)}
          className={`${sz} rounded-full transition-all duration-150 hover:scale-110 ${
            value === c.key ? `${ring} ring-current` : 'ring-1 ring-white/10 hover:ring-white/30'
          }`}
          style={{ backgroundColor: c.hex }}
          aria-label={`${c.label} accent`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Course Detail Modal                                                */
/* ------------------------------------------------------------------ */

function CourseDetailModal({
  course,
  onClose,
  onAddTask,
  onAddNote,
  onRecolor,
}: {
  course: UiCourse;
  onClose: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
  onRecolor: (color: AccentColor) => void;
}) {
  const { data: allTasks } = useTaskStore();
  const { data: allExams } = useExamStore();
  const { data: allNotes } = useNoteStore();
  const { data: allResources } = useResourceStore();

  const courseTasks = useMemo(
    () => allTasks.filter((t) => t.courseCode === course.code).map(toUiTask),
    [allTasks, course.code],
  );

  const courseExams = useMemo(
    () => allExams.filter((e) => e.codeLabel === course.code),
    [allExams, course.code],
  );

  const courseNotes = useMemo(
    () => allNotes.filter((n) => n.title.toLowerCase().includes(course.code.toLowerCase())),
    [allNotes, course.code],
  );

  const courseResources = useMemo(
    () => allResources.filter((r) => r.courseCode === course.code).map(toUiResource),
    [allResources, course.code],
  );

  const activeTasks = courseTasks.filter((t) => !t.completed);
  const doneTasks = courseTasks.filter((t) => t.completed);
  const hex = accentHex(course.accent);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/8 px-6 py-5">
          <div className="relative">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${hex}15` }}
            >
              <BookOpen className="h-7 w-7" style={{ color: hex }} strokeWidth={2} />
            </div>
            {/* Inline color picker on header icon */}
            <button
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high border border-white/10 text-on-surface-variant/60 hover:text-on-background transition-colors"
              title="Change color"
              onClick={(e) => {
                e.stopPropagation();
                const idx = COURSE_PALETTE.findIndex((c) => c.key === course.accent);
                const next = COURSE_PALETTE[(idx + 1) % COURSE_PALETTE.length];
                onRecolor(next.key);
              }}
            >
              <Palette className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-headline-lg text-[20px] font-bold text-on-background">{course.name}</h2>
            <p className="font-label-mono-sm text-on-surface-variant/60">{course.code} · {course.ects} ECTS</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-headline-lg text-[28px] font-bold" style={{ color: hex }}>{course.avg_grade.toFixed(1)}</p>
            <p className="font-label-mono-xs text-on-surface-variant/50">{course.grade_label || 'No grade'}</p>
          </div>
          <button onClick={onClose} className="ml-2 rounded-lg p-2 text-on-surface-variant/60 hover:bg-white/5 hover:text-on-background">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="max-h-[calc(85vh-90px)] overflow-y-auto px-6 py-5">
          {/* Quick info */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/8 bg-neutral-900/40 p-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-on-surface-variant/50" />
                <span className="font-label-mono-xs text-on-surface-variant/50">Professor</span>
              </div>
              <p className="mt-1 font-body-md text-[13px] font-medium text-on-background">{course.professor}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-neutral-900/40 p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-on-surface-variant/50" />
                <span className="font-label-mono-xs text-on-surface-variant/50">Location</span>
              </div>
              <p className="mt-1 font-body-md text-[13px] font-medium text-on-background">{course.room || 'TBA'}</p>
            </div>
          </div>

          {/* Accent color picker row */}
          <div className="mb-5 rounded-xl border border-white/8 bg-neutral-900/40 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-label-mono-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Course Color</p>
              <span className="font-label-mono-xs" style={{ color: hex }}>{course.accent}</span>
            </div>
            <AccentColorPicker value={course.accent} onChange={onRecolor} />
          </div>

          {/* Syllabus progress */}
          <div className="mb-5 rounded-xl border border-white/8 bg-neutral-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-label-mono-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Syllabus Progress</p>
              <p className="font-label-mono-sm font-bold text-on-background">{course.syllabus_progress}%</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                style={{ width: `${course.syllabus_progress}%`, background: `linear-gradient(90deg, ${hex}99, ${hex})` }}
              />
            </div>
          </div>

          {/* Pending Tasks */}
          <SectionHeader
            icon={<CheckSquare className="h-4 w-4" style={{ color: hex }} />}
            title={`Tasks (${activeTasks.length} pending, ${doneTasks.length} done)`}
            action={<QuickAction label="Add Task" onClick={onAddTask} />}
          >
            {activeTasks.length === 0 && doneTasks.length === 0 && (
              <EmptyState text="No tasks for this course yet." />
            )}
            {activeTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-neutral-900/40 px-3 py-2.5 transition-colors hover:bg-white/5">
                <div className={`h-2 w-2 rounded-full ${t.priority === 'high' ? 'bg-error' : t.priority === 'medium' ? 'bg-primary' : 'bg-tertiary'}`} />
                <p className="min-w-0 flex-1 truncate font-body-md text-[13px] text-on-background">{t.title}</p>
                <span className="font-label-mono-xs text-on-surface-variant/50">{t.due_label}</span>
              </div>
            ))}
            {doneTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-neutral-900/20 px-3 py-2 opacity-60">
                <CheckSquare className="h-3.5 w-3.5 text-tertiary" />
                <p className="min-w-0 flex-1 truncate font-body-md text-[13px] text-on-surface-variant line-through">{t.title}</p>
              </div>
            ))}
          </SectionHeader>

          {/* Exams / Assessments */}
          <SectionHeader icon={<Target className="h-4 w-4 text-secondary" />} title={`Assessments (${courseExams.length})`}>
            {courseExams.length === 0 && <EmptyState text="No exams scheduled." />}
            {courseExams.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-neutral-900/40 px-3 py-2.5 transition-colors hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <Target className="h-4 w-4 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body-md text-[13px] font-medium text-on-background">{ex.title}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">{ex.type} · {ex.daysUntilLabel}</p>
                </div>
                <span className="shrink-0 font-label-mono-xs text-primary font-bold">{ex.weightLabel}</span>
              </div>
            ))}
          </SectionHeader>

          {/* Notes */}
          <SectionHeader
            icon={<StickyNote className="h-4 w-4 text-tertiary" />}
            title={`Notes (${courseNotes.length})`}
            action={<QuickAction label="Add Note" onClick={onAddNote} />}
          >
            {courseNotes.length === 0 && <EmptyState text="No notes yet." />}
            {courseNotes.map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-neutral-900/40 px-3 py-2.5 transition-colors hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tertiary/10">
                  <StickyNote className="h-4 w-4 text-tertiary" />
                </div>
                <p className="min-w-0 flex-1 truncate font-body-md text-[13px] text-on-background">{n.title}</p>
              </div>
            ))}
          </SectionHeader>

          {/* Resources */}
          <SectionHeader icon={<FileText className="h-4 w-4 text-error" />} title={`Resources (${courseResources.length})`}>
            {courseResources.length === 0 && <EmptyState text="No resources yet." />}
            {courseResources.map((r) => (
              <div
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-neutral-900/40 px-3 py-2.5 transition-colors hover:bg-white/5"
                onClick={() => window.open(r.url, '_blank')}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error/10">
                  <FileText className="h-4 w-4 text-error" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body-md text-[13px] text-on-background">{r.title}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">{r.type} · {r.size_label}</p>
                </div>
              </div>
            ))}
          </SectionHeader>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">{icon}<p className="font-label-mono-xs font-bold uppercase tracking-wider text-on-surface-variant/60">{title}</p></div>
        {action}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 font-label-mono-xs font-semibold text-primary transition-all hover:bg-primary/10">
      <Plus className="h-3 w-3" strokeWidth={2.5} />{label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-white/8 py-4 text-center font-label-mono-xs text-on-surface-variant/40">{text}</p>;
}

/* ------------------------------------------------------------------ */
/*  Main Courses View                                                  */
/* ------------------------------------------------------------------ */

export function CoursesView() {
  const { data, loading, error, initialized, load, upsert, remove } = useCourseStore();
  const { data: allTasks, upsert: upsertTask } = useTaskStore();
  const [confirmDelete, setConfirmDelete] = useState<UiCourse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<UiCourse | null>(null);
  const [formError, setFormError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<UiCourse | null>(null);

  useEffect(() => {
    if (!initialized) void load();
  }, [initialized, load]);

  const courses = data.map(toUiCourse);

  const handleCreate = async (input: { code: string; name: string; professor: string; ects: number; room: string; accent: AccentColor }) => {
    setCreating(true);
    setFormError('');
    try {
      const course: DomainCourse = {
        id: createId(),
        semesterId: null,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        professor: input.professor.trim(),
        ects: input.ects,
        room: input.room.trim(),
        syllabusProgress: 0,
        avgGrade: 0,
        gradeLabel: '',
        nextSessionLabel: '',
        status: CourseStatus.Active,
        accent: input.accent,
        sortOrder: courses.length + 1,
      };
      await upsert(course);
      setShowCreate(false);
    } catch {
      setFormError('That course could not be saved.');
    } finally {
      setCreating(false);
    }
  };

  const handleRecolor = useCallback(async (courseId: string, accent: AccentColor) => {
    const domain = data.find((c) => c.id === courseId);
    if (!domain) return;
    try {
      await upsert({ ...domain, accent });
    } catch {
      console.error('Failed to update accent');
    }
  }, [data, upsert]);

  const handleEdit = useCallback(async (course: UiCourse, input: { name: string; professor: string; ects: number; room: string; accent: AccentColor }) => {
    const domain = data.find((c) => c.id === course.id);
    if (!domain) return;
    const updated: DomainCourse = {
      ...domain,
      name: input.name.trim(),
      professor: input.professor.trim(),
      ects: Math.max(0, input.ects),
      room: input.room.trim(),
      accent: input.accent,
    };
    await upsert(updated);
    setEditingCourse(null);
    setSelectedCourse((sel) => (sel && sel.id === course.id ? { ...sel, name: updated.name, professor: updated.professor, ects: updated.ects, room: updated.room, accent: updated.accent } : sel));
  }, [data, upsert]);

  const handleDelete = async (course: UiCourse) => {
    setFormError('');
    setConfirmDelete(null);
    try { await remove(course.id); } catch { setFormError('That course could not be deleted.'); }
  };

  const handleAddTaskForCourse = useCallback(async (course: UiCourse) => {
    const task: DomainTask = {
      id: createId(), courseId: null, courseCode: course.code, title: `New task for ${course.code}`,
      priority: TaskPriority.Medium, status: TaskStatus.Pending, estimatedHours: 1,
      subtaskSummary: '', dueLabel: 'No deadline', completed: false, sortOrder: allTasks.length + 1,
    };
    await upsertTask(task);
  }, [allTasks.length, upsertTask]);

  const handleAddNoteForCourse = useCallback(async (_course: UiCourse) => {
    const note: DomainNote = { id: createId(), title: `Notes for ${_course.code}`, icon: '📝', timestampLabel: new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }), accent: AccentColor.Primary, sortOrder: 0 };
    console.info('Add note for', _course.code, note);
  }, []);

  /* ---- Loading / error / empty states ---- */
  let body: React.ReactNode = null;
  if (loading && !initialized) {
    body = (<div className="flex h-[40vh] items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="font-label-mono-sm text-on-surface-variant/60">Loading courses…</p></div></div>);
  } else if (error && !initialized) {
    body = (<div className="glass-card rounded-3xl p-8 text-center"><p className="font-body-lg text-error">{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button></div>);
  } else if (initialized && courses.length === 0) {
    body = (
      <div className="glass-card rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><BookOpen className="h-6 w-6 text-primary" /></div>
        <h3 className="mt-4 font-headline-md text-[16px] font-semibold text-on-background">No courses yet</h3>
        <p className="mt-1 font-label-mono-sm text-on-surface-variant/60">Add your first course to start tracking syllabus & grades.</p>
        <button onClick={() => setShowCreate(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface"><Plus className="h-4 w-4" /> Add Course</button>
      </div>
    );
  } else {
    body = (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-label-mono-sm text-on-surface-variant/60">{courses.length} course{courses.length === 1 ? '' : 's'} · {courses.reduce((sum, c) => sum + c.ects, 0)} ECTS</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-body-md text-[13px] font-semibold text-primary transition-all hover:bg-primary/20"><Plus className="h-4 w-4" /> Add Course</button>
        </div>
        {formError && <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 font-body-md text-[13px] text-error">{formError}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const courseCount = allTasks.filter((t) => t.courseCode === course.code).length;
            const hex = accentHex(course.accent);
            return (
              <div
                key={course.id}
                className="group relative glass-card rounded-3xl p-5 transition-all duration-300 hover:translate-y-[-2px] cursor-pointer"
                onClick={() => setSelectedCourse(course)}
                style={{ borderLeft: `3px solid ${hex}` }}
              >
                {/* Inline recolor button (top-right corner) */}
                <button
                  className="absolute right-9 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-neutral-900/60 text-on-surface-variant/40 opacity-0 transition-all group-hover:opacity-100 hover:text-on-background hover:border-white/20"
                  title="Edit course"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCourse(course);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-neutral-900/60 text-on-surface-variant/40 opacity-0 transition-all group-hover:opacity-100 hover:text-on-background hover:border-white/20"
                  title="Change course color"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = COURSE_PALETTE.findIndex((c) => c.key === course.accent);
                    const next = COURSE_PALETTE[(idx + 1) % COURSE_PALETTE.length];
                    handleRecolor(course.id, next.key);
                  }}
                >
                  <Palette className="h-3 w-3" />
                </button>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${hex}15` }}>
                      <BookOpen className="h-5 w-5" style={{ color: hex }} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-label-mono-sm text-[12px] font-bold uppercase tracking-wider text-on-surface-variant/50">{course.code}</p>
                      <p className="font-label-mono-xs text-on-surface-variant/50">{course.ects} ECTS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="font-headline-lg text-[24px] font-bold" style={{ color: hex }}>{course.avg_grade.toFixed(1)}</p>
                      <p className="font-label-mono-xs text-on-surface-variant/50">{course.grade_label}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(course); }} className="mt-1 opacity-0 transition-opacity group-hover:opacity-100" aria-label={`Delete ${course.code}`}>
                      <Trash2 className="h-4 w-4 text-on-surface-variant/50 hover:text-error" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 font-headline-md text-[16px] font-semibold text-on-background">{course.name}</h3>

                <div className="mt-3 space-y-1.5 font-label-mono-sm text-[11px] text-on-surface-variant/60">
                  <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{course.professor}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{course.room}</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{course.next_session_label}</p>
                </div>

                {courseCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                    <CheckSquare className="h-3 w-3 text-on-surface-variant/50" />
                    <span className="font-label-mono-xs text-on-surface-variant/60">{courseCount} task{courseCount !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-label-mono-xs text-on-surface-variant/50">Syllabus</span>
                    <span className="font-label-mono-xs font-bold text-on-background">{course.syllabus_progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r transition-all duration-500" style={{ width: `${course.syllabus_progress}%`, background: `linear-gradient(90deg, ${hex}99, ${hex})` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10"><BookOpen className="h-5 w-5 text-primary" strokeWidth={2} /></div>
        <div>
          <h2 className="font-headline-md text-[17px] font-semibold text-on-background">Courses</h2>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">{courses.length} active course{courses.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      {body}
      {showCreate && <CreateCourseModal onCancel={() => setShowCreate(false)} onConfirm={(input) => void handleCreate(input)} busy={creating} error={formError} />}
      {editingCourse && <EditCourseModal course={editingCourse} onCancel={() => setEditingCourse(null)} onConfirm={(input) => void handleEdit(editingCourse, input)} />}
      {confirmDelete && <DeleteCourseModal course={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={(c) => void handleDelete(c)} />}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onAddTask={() => void handleAddTaskForCourse(selectedCourse)}
          onAddNote={() => void handleAddNoteForCourse(selectedCourse)}
          onRecolor={(color) => { handleRecolor(selectedCourse.id, color); setSelectedCourse({ ...selectedCourse, accent: color }); }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Course Modal                                                  */
/* ------------------------------------------------------------------ */

function EditCourseModal({ course, onCancel, onConfirm }: { course: UiCourse; onCancel: () => void; onConfirm: (input: { name: string; professor: string; ects: number; room: string; accent: AccentColor }) => void }) {
  const [name, setName] = useState(course.name);
  const [professor, setProfessor] = useState(course.professor);
  const [ects, setEcts] = useState(course.ects);
  const [room, setRoom] = useState(course.room);
  const [accent, setAccent] = useState<AccentColor>(course.accent as AccentColor);
  const [localError, setLocalError] = useState('');
  const hex = accentHex(accent);

  const submit = () => {
    if (!name.trim()) { setLocalError('Course name is required.'); return; }
    setLocalError('');
    onConfirm({ name: name.trim(), professor: professor.trim() || 'TBA', ects: Math.max(0, ects), room: room.trim(), accent });
  };

  const inputCls = 'w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none';
  const labelCls = 'mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50';

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onCancel}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${hex}15` }}><BookOpen className="h-5 w-5" style={{ color: hex }} /></div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Edit Course</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">{course.code} · {course.ects} ECTS → updates across Cards, Schedule &amp; Tasks</p>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-background" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {localError && <p className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-body-md text-[13px] text-error">{localError}</p>}
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Advanced Algorithms" />
          </div>
          <div>
            <label className={labelCls}>Professor</label>
            <input className={inputCls} value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Dr. Smith" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>ECTS</label><input className={inputCls} type="number" value={ects} onChange={(e) => setEcts(Number(e.target.value))} /></div>
            <div><label className={labelCls}>Room</label><input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Turing 301" /></div>
          </div>
          <div>
            <label className={labelCls}>Course Color</label>
            <AccentColorPicker value={accent} onChange={setAccent} />
            <p className="mt-2 font-label-mono-xs" style={{ color: hex }}>Preview: <span className="text-on-surface-variant/60">cards, schedule blocks &amp; task tags in Courses, Schedule and Tasks views</span></p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/8 px-5 py-4">
          <button onClick={onCancel} className="rounded-lg border border-white/10 bg-white/4 px-4 py-2 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">Cancel</button>
          <button onClick={submit} className="rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2 font-body-md text-[13px] font-semibold text-surface transition-all hover:scale-[1.02]">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Course Modal                                                */
/* ------------------------------------------------------------------ */

function CreateCourseModal({ onCancel, onConfirm, busy, error }: { onCancel: () => void; onConfirm: (input: { code: string; name: string; professor: string; ects: number; room: string; accent: AccentColor }) => void; busy: boolean; error: string }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [ects, setEcts] = useState(6);
  const [room, setRoom] = useState('');
  const [accent, setAccent] = useState<AccentColor>(AccentColor.Gold);
  const [localError, setLocalError] = useState('');

  const submit = () => {
    if (!code.trim() || !name.trim()) { setLocalError('Code and name are required.'); return; }
    setLocalError('');
    onConfirm({ code: code.trim(), name: name.trim(), professor: professor.trim() || 'TBA', ects: Math.max(0, ects), room: room.trim(), accent });
  };

  const inputCls = 'w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none';
  const labelCls = 'mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50';

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onCancel}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">New Course</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">Enroll in a new course</p>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-background" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {(localError || error) && <p className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 font-body-md text-[13px] text-error">{localError || error}</p>}
          <div>
            <label className={labelCls}>Course Code</label>
            <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS301" />
          </div>
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Advanced Algorithms" />
          </div>
          <div>
            <label className={labelCls}>Professor</label>
            <input className={inputCls} value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Dr. Smith" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>ECTS</label><input className={inputCls} type="number" value={ects} onChange={(e) => setEcts(Number(e.target.value))} /></div>
            <div><label className={labelCls}>Room</label><input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Turing 301" /></div>
          </div>
          <div>
            <label className={labelCls}>Course Color</label>
            <AccentColorPicker value={accent} onChange={setAccent} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/8 px-5 py-4">
          <button onClick={onCancel} className="rounded-lg border border-white/10 bg-white/4 px-4 py-2 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg bg-gradient-to-r from-primary to-primary-container px-4 py-2 font-body-md text-[13px] font-semibold text-surface transition-all hover:scale-[1.02] disabled:opacity-50">{busy ? 'Saving…' : 'Add Course'}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Course Modal                                                */
/* ------------------------------------------------------------------ */

function DeleteCourseModal({ course, onCancel, onConfirm }: { course: UiCourse; onCancel: () => void; onConfirm: (course: UiCourse) => void }) {
  const { data: allTasks } = useTaskStore();
  const { data: allExams } = useExamStore();
  const { data: allGrades } = useGradeStore();
  const cascade = predictCourseDeleteCascade(
    { id: course.id, code: course.code, name: course.name, professor: course.professor, ects: course.ects, room: course.room, semesterId: null, syllabusProgress: course.syllabus_progress, avgGrade: course.avg_grade, gradeLabel: course.grade_label, nextSessionLabel: course.next_session_label, status: CourseStatus.Active, accent: course.accent as AccentColor, sortOrder: course.sort_order },
    allTasks, allExams, allGrades,
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onCancel}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10"><AlertTriangle className="h-5 w-5 text-error" /></div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Delete Course</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">This action cannot be undone</p>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-background" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4">
          <p className="font-body-md text-[13px] text-on-background">Are you sure you want to delete <span className="font-semibold">{course.code} – {course.name}</span>?</p>
          {cascade.affectedCount > 0 && <p className="mt-2 font-body-md text-[13px] text-on-surface-variant/70">This will also remove {cascade.affectedCount} linked task{cascade.affectedCount !== 1 ? 's' : ''}.</p>}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/8 px-5 py-4">
          <button onClick={onCancel} className="rounded-lg border border-white/10 bg-white/4 px-4 py-2 font-body-md text-[13px] text-on-surface-variant transition-colors hover:bg-white/8">Cancel</button>
          <button onClick={() => onConfirm(course)} className="rounded-lg bg-error px-4 py-2 font-body-md text-[13px] font-semibold text-white">{cascade.affectedCount > 0 ? `Delete course & ${cascade.affectedCount} task${cascade.affectedCount !== 1 ? 's' : ''}` : 'Delete course'}</button>
        </div>
      </div>
    </div>
  );
}
