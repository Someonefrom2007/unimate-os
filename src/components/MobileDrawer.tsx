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
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ViewKey } from '@/lib/types';

interface MobileDrawerProps {
  open: boolean;
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onClose: () => void;
}

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
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

export function MobileDrawer({ open, activeView, onNavigate, onClose }: MobileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[280px] overflow-y-auto border-r border-white/8 bg-surface-container-lowest p-4 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container gold-glow">
              <GraduationCap className="h-5 w-5 text-surface" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-headline-lg text-[17px] font-bold text-on-background">UNI·MATE</span>
              <p className="font-label-mono-xs text-primary/80">Academic OS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav>
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
                        onClick={() => {
                          onNavigate(item.key);
                          onClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface-variant hover:bg-white/5 hover:text-on-background'
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
