/**
 * SettingsView — wired to ThemeEngine, StorageEngine, ExportEngine.
 * Local-first settings with backup/restore, theme customization, and storage stats.
 */
import { useState, useEffect } from 'react';
import { Moon, Palette, Bell, Database, Download, Upload, Trash2, Globe, HardDrive } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  loadThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  ACCENT_PRESETS,
  FONT_SIZE_PRESETS,
  DENSITY_PRESETS,
  applyTheme,
  type ThemeSettings,
} from '@/core/engines/themeEngine';
import {
  createBackup,
  parseBackupFile,
  downloadBackup,
  ENTITY_TABLES,
} from '@/core/engines/exportEngine';
import {
  computeStorageMetrics,
  clearCacheKeys,
  clearAllStorage,
  type StorageMetric,
} from '@/core/engines/storageEngine';

export function SettingsView() {
  const [theme, setTheme] = useState<ThemeSettings>(loadThemeSettings);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetric[]>([]);
  const [language, setLanguage] = useState(() => localStorage.getItem('unimate.language') || 'English');
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('unimate.notifications') || '{}'); }
    catch { return { exam: true, deadline: true, class: true, streak: false, goal: true, workload: true }; }
  });
  const [studyReminder, setStudyReminder] = useState(() => localStorage.getItem('unimate.studyReminder') === 'true');
  const [quietHours, setQuietHours] = useState(() => localStorage.getItem('unimate.quietHours') === 'true');

  useEffect(() => {
    applyTheme(theme);
    saveThemeSettings(theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('unimate.language', language); }, [language]);
  useEffect(() => { localStorage.setItem('unimate.notifications', JSON.stringify(notificationPrefs)); }, [notificationPrefs]);
  useEffect(() => { localStorage.setItem('unimate.studyReminder', String(studyReminder)); }, [studyReminder]);
  useEffect(() => { localStorage.setItem('unimate.quietHours', String(quietHours)); }, [quietHours]);

  // Load storage metrics
  useEffect(() => {
    setStorageMetrics(computeStorageMetrics());
  }, []);

  const toggleTheme = () => setTheme((t) => ({ ...t, darkMode: !t.darkMode }));
  const setAccent = (hex: string) => setTheme((t) => ({ ...t, accentHex: hex }));
  const setFontSize = (v: number) => setTheme((t) => ({ ...t, fontSize: v }));
  const setDensity = (d: ThemeSettings['density']) => setTheme((t) => ({ ...t, density: d }));
  const toggleReducedMotion = () => setTheme((t) => ({ ...t, reducedMotion: !t.reducedMotion }));
  const toggleCompactCards = () => setTheme((t) => ({ ...t, compactCards: !t.compactCards }));
  const resetTheme = () => { const s = resetThemeSettings(); setTheme(s); applyTheme(s); };

  const handleExport = async () => {
    const tables: Record<string, unknown[]> = {};
    for (const t of ENTITY_TABLES) {
      const { data } = await supabase.from(t).select('*').order('sort_order');
      tables[t] = data || [];
    }
    const backup = createBackup(tables);
    downloadBackup(backup);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const { payload, validation } = parseBackupFile(text);
    if (!payload || !validation.valid) {
      alert(`Import failed: ${validation.errors.join(', ')}`);
      return;
    }
    for (const [table, rows] of Object.entries(payload.tables)) {
      if (Array.isArray(rows)) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (rows.length > 0) await supabase.from(table).insert(rows);
      }
    }
    window.location.reload();
  };

  const handleReset = async () => {
    if (!confirm('This will delete ALL your data permanently. Are you sure?')) return;
    if (!confirm('Type "DELETE" to confirm')) return;
    for (const t of ENTITY_TABLES) {
      await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    clearAllStorage();
    window.location.reload();
  };

  const handleClearCache = () => {
    const n = clearCacheKeys();
    setStorageMetrics([]);
    setStorageMetrics(computeStorageMetrics());
    alert(`Cleared ${n} cache entries.`);
  };

  const toggleNotification = (type: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Appearance ── */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Palette className="h-4 w-4 text-primary" /></div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Appearance</h3>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
          <div className="flex items-center gap-2.5"><Moon className="h-4 w-4 text-secondary" /><span className="font-body-md text-[13px] text-on-background">Dark Mode</span></div>
          <button onClick={toggleTheme} className={`relative h-6 w-11 rounded-full transition-colors ${theme.darkMode ? 'bg-tertiary' : 'bg-white/10'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${theme.darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Accent colors */}
        <p className="mt-4 mb-2 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Accent Color</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <button key={preset.hex} onClick={() => setAccent(preset.hex)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${theme.accentHex === preset.hex ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: preset.hex }} title={preset.name} />
          ))}
        </div>

        {/* Font size */}
        <p className="mt-4 mb-2 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Font Size</p>
        <div className="flex gap-2">
          {FONT_SIZE_PRESETS.map((f) => (
            <button key={f.value} onClick={() => setFontSize(f.value)}
              className={`rounded-lg border px-3 py-1.5 font-label-mono-xs transition-colors ${theme.fontSize === f.value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant/60 hover:bg-white/5'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Density */}
        <p className="mt-4 mb-2 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Density</p>
        <div className="flex gap-2">
          {DENSITY_PRESETS.map((d) => (
            <button key={d.value} onClick={() => setDensity(d.value)}
              className={`flex-1 rounded-lg border p-2 text-center transition-colors ${theme.density === d.value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant/60 hover:bg-white/5'}`}>
              <p className="font-body-md text-[12px] font-medium">{d.label}</p>
              <p className="font-label-mono-xs text-[10px] text-on-surface-variant/40">{d.desc}</p>
            </button>
          ))}
        </div>

        {/* Extra toggles */}
        <div className="mt-4 space-y-2">
          {[
            { on: theme.reducedMotion, toggle: toggleReducedMotion, label: 'Reduced Motion', desc: 'Minimize animations' },
            { on: theme.compactCards, toggle: toggleCompactCards, label: 'Compact Cards', desc: 'Smaller card padding' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
              <div><p className="font-body-md text-[13px] font-medium text-on-background">{item.label}</p><p className="font-label-mono-xs text-on-surface-variant/50">{item.desc}</p></div>
              <button onClick={item.toggle} className={`relative h-6 w-11 rounded-full transition-colors ${item.on ? 'bg-tertiary' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={resetTheme} className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 font-label-mono-xs text-on-surface-variant/60 hover:bg-white/5">Reset to Defaults</button>
      </div>

      {/* ── Language ── */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/10"><Globe className="h-4 w-4 text-tertiary" /></div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Language</h3>
        </div>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background focus:outline-none">
          <option value="English">English</option>
          <option value="Español">Español</option>
          <option value="Català">Català</option>
        </select>
      </div>

      {/* ── Notifications ── */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary/10"><Bell className="h-4 w-4 text-tertiary" /></div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Notifications</h3>
        </div>
        <div className="space-y-2">
          {[
            { key: 'exam', label: 'Exam reminders' },
            { key: 'deadline', label: 'Task deadlines' },
            { key: 'class', label: 'Class reminders' },
            { key: 'streak', label: 'Habit reminders' },
            { key: 'workload', label: 'Workload warnings' },
            { key: 'goal', label: 'Goal progress' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
              <span className="font-body-md text-[13px] text-on-background">{item.label}</span>
              <button onClick={() => toggleNotification(item.key)} className={`relative h-6 w-11 rounded-full transition-colors ${notificationPrefs[item.key] ? 'bg-tertiary' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${notificationPrefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {[
            { on: studyReminder, toggle: () => setStudyReminder(!studyReminder), label: 'Study reminders' },
            { on: quietHours, toggle: () => setQuietHours(!quietHours), label: 'Quiet hours (22:00–08:00)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-3">
              <span className="font-body-md text-[13px] text-on-background">{item.label}</span>
              <button onClick={item.toggle} className={`relative h-6 w-11 rounded-full transition-colors ${item.on ? 'bg-tertiary' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Storage & Data ── */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><HardDrive className="h-4 w-4 text-primary" /></div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Storage</h3>
        </div>
        {storageMetrics.length > 0 ? (
          <div className="space-y-2">
            {storageMetrics.filter((m) => m.itemCount > 0).map((m) => (
              <div key={m.entity} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 p-2.5">
                <span className="font-body-md text-[12px] text-on-background">{m.entity}</span>
                <span className="font-label-mono-xs text-[11px] text-on-surface-variant/50">{m.itemCount} items · {m.kbApprox} KB</span>
              </div>
            ))}
            <button onClick={handleClearCache} className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-label-mono-xs text-on-surface-variant/60 hover:bg-white/5">
              <Trash2 className="h-3 w-3" /> Clear Cache
            </button>
          </div>
        ) : <p className="font-body-sm text-[12px] text-on-surface-variant/40">Loading storage stats…</p>}
      </div>

      {/* ── Backup / Export / Import ── */}
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Database className="h-4 w-4 text-primary" /></div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Data Management</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={handleExport} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3 text-left transition-colors hover:bg-surface-container/60">
            <Download className="h-4 w-4 text-tertiary" />
            <div><p className="font-body-md text-[13px] font-medium text-on-background">Export Backup</p><p className="font-label-mono-xs text-on-surface-variant/50">Validated JSON with checksum</p></div>
          </button>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3 text-left transition-colors hover:bg-surface-container/60">
            <Upload className="h-4 w-4 text-primary" />
            <div><p className="font-body-md text-[13px] font-medium text-on-background">Import Backup</p><p className="font-label-mono-xs text-on-surface-variant/50">Schema-validated restore</p></div>
            <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
          </label>
        </div>
        <button onClick={handleReset} className="mt-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 font-label-mono-xs text-error/70 transition-colors hover:bg-error/10">
          <Trash2 className="h-3 w-3" /> Reset All Data
        </button>
      </div>
    </div>
  );
}
