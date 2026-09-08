import { useState, useEffect } from 'react';
import { Moon, Palette, Bell, Database, Link2, Shield, Download, Upload, Trash2, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function SettingsView() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimate.darkMode') !== 'false';
    }
    return true;
  });
  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimate.accentColor') || '#f5a623';
    }
    return '#f5a623';
  });
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimate.language') || 'English';
    }
    return 'English';
  });
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('unimate.notifications') || '{}');
      } catch {
        return { exam: true, deadline: true, class: true, streak: false, goal: true, workload: true };
      }
    }
    return { exam: true, deadline: true, class: true, streak: false, goal: true, workload: true };
  });
  const [studyReminder, setStudyReminder] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimate.studyReminder') === 'true';
    }
    return false;
  });
  const [quietHours, setQuietHours] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimate.quietHours') === 'true';
    }
    return false;
  });

  useEffect(() => { localStorage.setItem('unimate.darkMode', String(darkMode)); document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => { localStorage.setItem('unimate.accentColor', accentColor); document.documentElement.style.setProperty('--unimate-accent', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('unimate.language', language); }, [language]);
  useEffect(() => { localStorage.setItem('unimate.notifications', JSON.stringify(notificationPrefs)); }, [notificationPrefs]);
  useEffect(() => { localStorage.setItem('unimate.studyReminder', String(studyReminder)); }, [studyReminder]);
  useEffect(() => { localStorage.setItem('unimate.quietHours', String(quietHours)); }, [quietHours]);

  const accentOptions = ['#f5a623', '#5beaad', '#b4b7ff', '#ff6e6e'];

  const handleExport = async () => {
    const tables = ['courses', 'tasks', 'assessments', 'schedule_entries', 'habits', 'notes', 'quick_thoughts', 'grade_entries', 'goals', 'focus_sessions', 'resources', 'notifications', 'profile'];
    const exportData: Record<string, unknown[]> = {};
    for (const t of tables) {
      const { data: rows } = await supabase.from(t).select('*').order('sort_order');
      exportData[t] = rows || [];
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unimate-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const [table, rows] of Object.entries(data)) {
        if (Array.isArray(rows)) {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (rows.length > 0) {
            await supabase.from(table).insert(rows);
          }
        }
      }
      window.location.reload();
    } catch {
      alert('Import failed: invalid JSON format');
    }
  };

  const handleReset = async () => {
    if (!confirm('This will delete ALL your data permanently. Are you sure?')) return;
    if (!confirm('Type "DELETE" to confirm')) return;
    const tables = ['courses', 'tasks', 'assessments', 'schedule_entries', 'habits', 'notes', 'quick_thoughts', 'grade_entries', 'goals', 'focus_sessions', 'resources', 'notifications', 'profile'];
    for (const t of tables) {
      await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    localStorage.clear();
    window.location.reload();
  };

  const toggleNotification = (type: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Appearance */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Appearance</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-body-md text-[13px] font-medium text-on-background">Dark Mode</p>
                <p className="font-label-mono-xs text-on-surface-variant/50">{darkMode ? 'Currently active' : 'Light mode active'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDarkMode(true)} className={`rounded-lg border px-3 py-1.5 font-label-mono-xs transition-all ${darkMode ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant/60 hover:bg-white/5'}`}>Dark</button>
              <button onClick={() => setDarkMode(false)} className={`rounded-lg border px-3 py-1.5 font-label-mono-xs transition-all ${!darkMode ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant/60 hover:bg-white/5'}`}>Light</button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-body-md text-[13px] font-medium text-on-background">Accent Color</p>
                <p className="font-label-mono-xs text-on-surface-variant/50">{accentColor === '#f5a623' ? 'Gold' : accentColor === '#5beaad' ? 'Emerald' : accentColor === '#b4b7ff' ? 'Lavender' : 'Rose'}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {accentOptions.map((c) => (
                <button key={c} onClick={() => setAccentColor(c)} className={`h-6 w-6 rounded-full transition-all ${accentColor === c ? 'ring-2 ring-white/40 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-on-surface-variant/60" />
              <div>
                <p className="font-body-md text-[13px] font-medium text-on-background">Language</p>
                <p className="font-label-mono-xs text-on-surface-variant/50">English</p>
              </div>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-white/10 bg-surface-container/60 px-3 py-1.5 font-label-mono-sm text-on-surface-variant focus:outline-none">
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Català">Català</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/10">
            <Bell className="h-4 w-4 text-tertiary" />
          </div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Notifications</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'exam', label: 'Exam reminders', desc: 'Get notified before exams' },
            { key: 'deadline', label: 'Task deadlines', desc: 'Alerts for upcoming and overdue tasks' },
            { key: 'class', label: 'Class reminders', desc: 'Next class notifications' },
            { key: 'streak', label: 'Habit reminders', desc: 'Daily habit check-ins' },
            { key: 'workload', label: 'Workload warnings', desc: 'Alert when workload is high' },
            { key: 'goal', label: 'Goal progress', desc: 'Updates on goal completion' },
          ].map((item) => {
            const isOn = notificationPrefs[item.key] ?? false;
            return (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
                <div>
                  <p className="font-body-md text-[13px] font-medium text-on-background">{item.label}</p>
                  <p className="font-label-mono-xs text-on-surface-variant/50">{item.desc}</p>
                </div>
                <button onClick={() => toggleNotification(item.key)} className={`relative h-6 w-11 rounded-full transition-colors ${isOn ? 'bg-tertiary' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Preferences</h3>
        </div>
        <div className="space-y-3">
          {[
            { on: studyReminder, onToggle: () => setStudyReminder(!studyReminder), label: 'Study reminders', desc: 'Get gentle nudges to focus' },
            { on: quietHours, onToggle: () => setQuietHours(!quietHours), label: 'Quiet hours', desc: 'No notifications 22:00–08:00' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
              <div>
                <p className="font-body-md text-[13px] font-medium text-on-background">{item.label}</p>
                <p className="font-label-mono-xs text-on-surface-variant/50">{item.desc}</p>
              </div>
              <button onClick={item.onToggle} className={`relative h-6 w-11 rounded-full transition-colors ${item.on ? 'bg-tertiary' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
            <Link2 className="h-4 w-4 text-secondary" />
          </div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Integrations</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div>
              <p className="font-body-md text-[13px] font-medium text-on-background">Google Calendar</p>
              <p className="font-label-mono-xs text-on-surface-variant/50">Sync your timetable</p>
            </div>
            <button className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 font-label-mono-xs text-secondary">Connect</button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div>
              <p className="font-body-md text-[13px] font-medium text-on-background">Google Drive</p>
              <p className="font-label-mono-xs text-on-surface-variant/50">Link your resources</p>
            </div>
            <button className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 font-label-mono-xs text-secondary">Connect</button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Data Management</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={handleExport} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3 text-left transition-colors hover:bg-surface-container/60">
            <Download className="h-4 w-4 text-tertiary" />
            <div>
              <p className="font-body-md text-[13px] font-medium text-on-background">Export Data</p>
              <p className="font-label-mono-xs text-on-surface-variant/50">Download all tables as JSON</p>
            </div>
          </button>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3 text-left transition-colors hover:bg-surface-container/60">
            <Upload className="h-4 w-4 text-primary" />
            <div>
              <p className="font-body-md text-[13px] font-medium text-on-background">Import Data</p>
              <p className="font-label-mono-xs text-on-surface-variant/50">Restore from a JSON backup</p>
            </div>
            <input type="file" accept="application/json" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3 text-left transition-colors hover:bg-surface-container/60">
            <Shield className="h-4 w-4 text-secondary" />
            <div>
              <p className="font-body-md text-[13px] font-medium text-on-background">Backup</p>
              <p className="font-label-mono-xs text-on-surface-variant/50">Create a full backup</p>
            </div>
          </button>
          <button onClick={handleReset} className="flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 p-3 text-left transition-colors hover:bg-error/10">
            <Trash2 className="h-4 w-4 text-error" />
            <div>
              <p className="font-body-md text-[13px] font-medium text-error">Delete All Data</p>
              <p className="font-label-mono-xs text-error/60">This cannot be undone</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
