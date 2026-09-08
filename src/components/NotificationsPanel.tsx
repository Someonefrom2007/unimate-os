import { Bell, X, GraduationCap, Flag, CalendarDays, Flame, Target, BarChart3, Check } from 'lucide-react';
import type { AppNotification } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface NotificationsPanelProps {
  open: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onUpdate: (notifications: AppNotification[]) => void;
}

function iconForType(type: string) {
  switch (type) {
    case 'exam': return GraduationCap;
    case 'deadline': return Flag;
    case 'class': return CalendarDays;
    case 'streak': return Flame;
    case 'goal': return Target;
    case 'workload': return BarChart3;
    default: return Bell;
  }
}

export function NotificationsPanel({ open, notifications, onClose, onUpdate }: NotificationsPanelProps) {
  if (!open) return null;
  const unread = notifications.filter((notification) => !notification.read);
  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    onUpdate(notifications.map((notification) => ({ ...notification, read: true })));
  };

  return (
    <div className="fixed inset-0 z-[55]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-surface-container-lowest p-5 shadow-2xl animate-fade-in" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/8 pb-4"><div><h2 className="font-headline-lg text-[20px] font-semibold text-on-background">Notifications</h2><p className="font-label-mono-xs text-on-surface-variant/50">{unread.length} unread updates</p></div><button onClick={onClose} className="text-on-surface-variant hover:text-on-background"><X className="h-5 w-5" /></button></div>
        <div className="flex items-center justify-between py-3"><p className="font-label-mono-sm uppercase tracking-wider text-on-surface-variant/50">Recent</p>{unread.length > 0 && <button onClick={markAllRead} className="flex items-center gap-1 font-label-mono-xs text-primary hover:text-primary/80"><Check className="h-3.5 w-3.5" /> Mark all read</button>}</div>
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>{notifications.map((notification) => { const Icon = iconForType(notification.type); return <div key={notification.id} className={`rounded-xl border p-3 ${notification.read ? 'border-white/5 bg-surface-container/20' : 'border-primary/20 bg-primary/5'}`}><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"><Icon className={`h-4 w-4 ${notification.read ? 'text-on-surface-variant/60' : 'text-primary'}`} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-body-md text-[13px] font-semibold text-on-background">{notification.title}</p>{!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}</div><p className="mt-1 font-body-md text-[12px] leading-relaxed text-on-surface-variant/70">{notification.body}</p><p className="mt-2 font-label-mono-xs text-on-surface-variant/40">{notification.timestamp_label}</p></div></div></div>; })}</div>
      </aside>
    </div>
  );
}
