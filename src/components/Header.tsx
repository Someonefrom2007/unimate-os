import { Search, Bell, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  unreadNotifications: number;
  onMenuClick?: () => void;
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  onQuickAdd?: () => void;
}

export function Header({ title, subtitle, unreadNotifications, onMenuClick, onSearchClick, onNotificationsClick, onQuickAdd }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/5 bg-surface/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3"><button onClick={onMenuClick} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/5 lg:hidden"><Menu className="h-5 w-5" /></button><div><h1 className="font-headline-lg text-[20px] font-semibold tracking-tight text-on-background sm:text-[24px]">{title}</h1><p className="font-label-mono-sm text-[11px] text-on-surface-variant/70">{subtitle}</p></div></div>
      <div className="flex items-center gap-2 sm:gap-3"><button onClick={onSearchClick} className="hidden items-center gap-2 rounded-lg border border-white/8 bg-surface-container/60 px-3 py-2 text-left md:flex"><Search className="h-4 w-4 text-on-surface-variant/60" /><span className="w-40 font-body-md text-[13px] text-on-surface-variant/50 lg:w-52">Search courses, tasks…</span><kbd className="rounded border border-white/10 px-1.5 py-0.5 font-label-mono-xs text-[9px] text-on-surface-variant/50">⌘K</kbd></button><button onClick={onSearchClick} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/5 md:hidden"><Search className="h-[18px] w-[18px]" /></button><button onClick={onNotificationsClick} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5"><Bell className="h-[18px] w-[18px]" />{unreadNotifications > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-label-mono-xs text-[9px] font-bold text-surface">{unreadNotifications}</span>}</button><button onClick={onQuickAdd} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-3 py-2 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02] sm:px-4"><Plus className="h-4 w-4" strokeWidth={2.5} /><span className="hidden sm:inline">Quick Add</span></button></div>
    </header>
  );
}
