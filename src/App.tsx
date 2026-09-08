import { useCallback, useEffect, useState } from 'react';
import {
  supabase
} from '@/lib/supabase';
import type {
  AppNotification,
  Assessment,
  Course,
  FocusSession,
  Goal,
  GradeEntry,
  Habit,
  Note,
  Profile,
  QuickThought,
  Resource,
  ScheduleEntry,
  Task,
  ViewKey,
} from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileDrawer } from '@/components/MobileDrawer';
import { SearchModal } from '@/components/SearchModal';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { CreateModal, type CreateKind } from '@/components/CreateModal';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CoursesView } from '@/components/views/CoursesView';
import { TasksView } from '@/components/views/TasksView';
import { ScheduleView } from '@/components/views/ScheduleView';
import { AssessmentsView } from '@/components/views/AssessmentsView';
import { GradesView } from '@/components/views/GradesView';
import { NotesView } from '@/components/views/NotesView';
import { ResourcesView } from '@/components/views/ResourcesView';
import { FocusView } from '@/components/views/FocusView';
import { GoalsView } from '@/components/views/GoalsView';
import { HabitsView } from '@/components/views/HabitsView';
import { WorkloadView } from '@/components/views/WorkloadView';
import { InsightsView } from '@/components/views/InsightsView';
import { AIAssistantView } from '@/components/views/AIAssistantView';
import { ProfileView } from '@/components/views/ProfileView';
import { SettingsView } from '@/components/views/SettingsView';
import { PlansView } from '@/components/views/PlansView';

const viewMeta: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your academic command center' },
  courses: { title: 'Courses', subtitle: 'Active enrollments & syllabus tracking' },
  schedule: { title: 'Schedule', subtitle: 'Weekly timetable overview' },
  tasks: { title: 'Tasks', subtitle: 'Weekly deliverables & deadlines' },
  assessments: { title: 'Exams', subtitle: 'Upcoming assessments & milestones' },
  grades: { title: 'Grades', subtitle: 'Gradebook, GPA & simulator' },
  notes: { title: 'Notes', subtitle: 'Documents & resources' },
  resources: { title: 'Resources', subtitle: 'Your university material library' },
  focus: { title: 'Focus', subtitle: 'Study sessions & deep work' },
  goals: { title: 'Goals', subtitle: 'Academic and personal progress' },
  habits: { title: 'Habits', subtitle: 'Study consistency & streaks' },
  workload: { title: 'Workload', subtitle: 'Understand your university load' },
  insights: { title: 'Insights', subtitle: 'Useful patterns from your activity' },
  'ai-assistant': { title: 'AI Assistant', subtitle: 'Ask about your academic life' },
  profile: { title: 'Profile', subtitle: 'Your student identity & academic stats' },
  settings: { title: 'Settings', subtitle: 'Preferences, integrations & data' },
  plans: { title: 'Plans', subtitle: 'Choose how UNI·MATE grows with you' },
};

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind>('task');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks] = useState<Task[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [notes, setNotes] = useState<Note[]>([]);
  const [, setThoughts] = useState<QuickThought[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [goals, setGoals] = useState<Goal[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadAll = useCallback(async (tables?: string[]) => {
    setLoading(true);
    setLoadError('');
    const tableQueries: { name: string; query: PromiseLike<{ data: unknown; error: { message: string } | null }> }[] = [
      { name: 'courses', query: supabase.from('courses').select('*').order('sort_order') },
      { name: 'assessments', query: supabase.from('assessments').select('*').order('sort_order') },
      { name: 'schedule_entries', query: supabase.from('schedule_entries').select('*').order('sort_order') },
      { name: 'habits', query: supabase.from('habits').select('*').order('sort_order') },
      { name: 'notes', query: supabase.from('notes').select('*').order('sort_order') },
      { name: 'quick_thoughts', query: supabase.from('quick_thoughts').select('*').order('sort_order') },
      { name: 'grade_entries', query: supabase.from('grade_entries').select('*').order('sort_order') },
      { name: 'focus_sessions', query: supabase.from('focus_sessions').select('*').order('sort_order') },
      { name: 'goals', query: supabase.from('goals').select('*').order('sort_order') },
      { name: 'resources', query: supabase.from('resources').select('*').order('sort_order') },
      { name: 'notifications', query: supabase.from('notifications').select('*').order('sort_order') },
      { name: 'profile', query: supabase.from('profile').select('*').limit(1).maybeSingle() },
    ];
    const selected = tables && tables.length > 0
      ? tableQueries.filter((q) => tables.includes(q.name))
      : tableQueries;
    const results = await Promise.all(selected.map((q) => q.query));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setLoadError('Some workspace data could not be loaded. Please refresh and try again.');
    }
    selected.forEach((q, idx) => {
      const data = results[idx].data;
      switch (q.name) {
        case 'courses': setCourses((data as Course[]) || []); break;
        case 'assessments': setAssessments((data as Assessment[]) || []); break;
        case 'schedule_entries': setSchedule((data as ScheduleEntry[]) || []); break;
        case 'habits': setHabits((data as Habit[]) || []); break;
        case 'notes': setNotes((data as Note[]) || []); break;
        case 'quick_thoughts': setThoughts((data as QuickThought[]) || []); break;
        case 'grade_entries': setGrades((data as GradeEntry[]) || []); break;
        case 'focus_sessions': setSessions((data as FocusSession[]) || []); break;
        case 'goals': setGoals((data as Goal[]) || []); break;
        case 'resources': setResources((data as Resource[]) || []); break;
        case 'notifications': setNotifications((data as AppNotification[]) || []); break;
        case 'profile': setProfile((data as Profile | null) || null); break;
        default: break;
      }
    });
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleMutationError = useCallback((message: string) => setActionError(message), []);

  const openCreate = useCallback((kind: CreateKind) => {
    setCreateKind(kind);
    setQuickAddOpen(true);
  }, []);

  const handleCreateTask = useCallback(async (input: { title: string; course_code: string; priority: 'high' | 'medium' | 'low'; estimated_hours: number; due_label: string }) => {
    const { error } = await supabase.from('tasks').insert({ ...input, sort_order: tasks.length, completed: false });
    if (error) { handleMutationError('That task could not be created.'); return; }
    void loadAll(['tasks']);
  }, [handleMutationError, tasks.length, loadAll]);

  const handleCreateNote = useCallback(async (input: { title: string; icon: string }) => {
    const { error } = await supabase.from('notes').insert({ ...input, timestamp_label: 'Just now', sort_order: notes.length });
    if (error) { handleMutationError('That note could not be created.'); return; }
    void loadAll(['notes']);
  }, [handleMutationError, notes.length, loadAll]);

  const handleCreateGoal = useCallback(async (input: { name: string; description: string; category: 'academic' | 'study' | 'personal' | 'health'; target_value: number; unit: string; deadline_label: string }) => {
    const { error } = await supabase.from('goals').insert({ ...input, current_value: 0, status: 'active', sort_order: goals.length });
    if (error) { handleMutationError('That goal could not be created.'); return; }
    void loadAll(['goals']);
  }, [handleMutationError, goals.length, loadAll]);

  const handleCreateResource = useCallback(async (input: { course_code: string; title: string; type: 'pdf' | 'document' | 'code' | 'slides' | 'link' | 'video'; url: string }) => {
    const { error } = await supabase.from('resources').insert({ ...input, favorite: false, size_label: '', timestamp_label: 'Just now', sort_order: resources.length });
    if (error) { handleMutationError('That resource could not be created.'); return; }
    void loadAll(['resources']);
  }, [handleMutationError, resources.length, loadAll]);

  const handleCreateProfile = useCallback(async (input: Omit<Profile, 'id' | 'initials' | 'semester_label' | 'accent'>) => {
    const initials = input.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const { data, error } = await supabase.from('profile').insert({ ...input, initials, semester_label: 'Fall Semester', accent: 'primary' }).select().maybeSingle();
    if (error || !data) { handleMutationError('Your profile could not be created.'); return; }
    setProfile(data as Profile);
  }, [handleMutationError]);

  const renderView = () => {
    if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="font-label-mono-sm text-on-surface-variant/60">Loading your workspace…</p></div></div>;
    if (loadError) return <div className="glass-card rounded-xl p-8 text-center"><p className="font-body-lg text-error">{loadError}</p><button onClick={() => void loadAll()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button></div>;
    switch (activeView) {
      case 'dashboard': return <DashboardView onNavigate={setActiveView} />;
      case 'courses': return <CoursesView />;
      case 'schedule': return <ScheduleView entries={schedule} />;
      case 'tasks': return <TasksView />;
      case 'assessments': return <AssessmentsView />;
      case 'grades': return <GradesView />;
      case 'notes': return <NotesView onCreate={() => openCreate('note')} />;
      case 'resources': return <ResourcesView onCreate={() => openCreate('resource')} />;
      case 'focus': return <FocusView />;
      case 'goals': return <GoalsView onCreate={() => openCreate('goal')} />;
      case 'habits': return <HabitsView />;
      case 'workload': return <WorkloadView />;
      case 'insights': return <InsightsView />;
      case 'ai-assistant': return <AIAssistantView />;
      case 'profile': return <ProfileView profile={profile} courses={courses} grades={grades} onCreateProfile={handleCreateProfile} />;
      case 'settings': return <SettingsView />;
      case 'plans': return <PlansView />;
      default: return null;
    }
  };

  const meta = viewMeta[activeView];
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar activeView={activeView} onNavigate={setActiveView} profile={profile} courses={courses} />
      <MobileDrawer open={drawerOpen} activeView={activeView} onNavigate={setActiveView} onClose={() => setDrawerOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={setActiveView} courses={courses} tasks={tasks} assessments={assessments} notes={notes} schedule={schedule} resources={resources} />
      <NotificationsPanel open={notificationsOpen} notifications={notifications} onClose={() => setNotificationsOpen(false)} onUpdate={setNotifications} />
      <CreateModal
        open={quickAddOpen}
        kind={createKind}
        courses={courses}
        onCreateTask={handleCreateTask}
        onCreateNote={handleCreateNote}
        onCreateGoal={handleCreateGoal}
        onCreateResource={handleCreateResource}
        onClose={() => setQuickAddOpen(false)}
      />
      <div className="lg:pl-[260px]">
        <Header title={meta.title} subtitle={meta.subtitle} unreadNotifications={unreadNotifications} onMenuClick={() => setDrawerOpen(true)} onSearchClick={() => setSearchOpen(true)} onNotificationsClick={() => setNotificationsOpen(true)} onQuickAdd={() => openCreate('task')} />
        {actionError && <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-error/20 bg-error/10 px-4 py-3 font-body-md text-[13px] text-error sm:mx-6 lg:mx-8"><span>{actionError}</span><button onClick={() => setActionError('')} className="font-label-mono-xs uppercase">Dismiss</button></div>}
        <main className="px-4 py-5 sm:px-6 lg:px-8"><div className="mx-auto max-w-container-max animate-fade-in">{renderView()}</div></main>
      </div>
    </div>
  );
}

export default App;
