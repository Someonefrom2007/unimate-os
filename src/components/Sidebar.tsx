import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  Award,
  FileText,
  FolderOpen,
  Timer,
  Target,
  Flame,
  BarChart3,
  TrendingUp,
  Bot,
  Settings,
  User,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import type { ViewKey, Profile, Course } from '@/lib/types';

interface SidebarProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  profile: Profile | null;
  courses: Course[];
}

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Academics',
    items: [
      { key: 'courses', label: 'Courses', icon: BookOpen },
      { key: 'schedule', label: 'Schedule', icon: CalendarDays },
      { key: 'tasks', label: 'Tasks', icon: CheckSquare },
      { key: 'assessments', label: 'Exams', icon: GraduationCap },
      { key: 'grades', label: 'Grades', icon: Award },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { key: 'notes', label: 'Notes', icon: FileText },
      { key: 'resources', label: 'Resources', icon: FolderOpen },
      { key: 'focus', label: 'Focus', icon: Timer },
      { key: 'goals', label: 'Goals', icon: Target },
      { key: 'habits', label: 'Habits', icon: Flame },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'workload', label: 'Workload', icon: BarChart3 },
      { key: 'insights', label: 'Insights', icon: TrendingUp },
      { key: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    label: 'Account',
    items: [
      { key: 'profile', label: 'Profile', icon: User },
      { key: 'settings', label: 'Settings', icon: Settings },
      { key: 'plans', label: 'Plans', icon: CreditCard },
    ],
  },
];

export function Sidebar({ activeView, onNavigate, profile, courses }: SidebarProps) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[260px] flex-col border-r border-white/5 bg-surface-container-lowest/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container gold-glow">
          <GraduationCap className="h-5 w-5 text-surface" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-lg text-[17px] font-bold tracking-tight text-on-background">
            UNI·MATE
          </span>
          <span className="font-label-mono-xs text-[10px] uppercase tracking-[0.15em] text-primary/80">
            Academic OS
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 py-1.5 font-label-mono-xs uppercase tracking-[0.1em] text-on-surface-variant/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onNavigate(item.key)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-background'
                      }`}
                    >
                      <Icon
                        className={`h-[17px] w-[17px] transition-colors ${
                          isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-background'
                        }`}
                        strokeWidth={2}
                      />
                      {item.label}
                      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-3 py-4">
        <button
          onClick={() => onNavigate('profile')}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary-fixed-dim text-[13px] font-bold text-surface">
            {profile ? profile.initials.slice(0, 2).toUpperCase() : '?'}
          </div>
          <div className="flex min-w-0 flex-col text-left">
            <span className="truncate text-[12px] font-semibold text-on-background">
              {profile?.name || 'Set up your profile'}
            </span>
            <span className="truncate font-label-mono-xs text-on-surface-variant/60">
              {profile
                ? `${profile.degree.replace('BSc ', 'BSc ').split(' ').slice(0, 2).join(' ')} · ${profile.year_label}`
                : `${courses.length} course${courses.length !== 1 ? 's' : ''} loaded`}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
