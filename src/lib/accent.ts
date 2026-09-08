import type { AccentColor } from './types';

const COURSE_COLORS: Record<string, { hsl: string; text: string; bg: string; bgSoft: string; border: string; progress: string; glow: string; swatch: string }> = {
  gold:    { hsl: '#f59e0b', text: 'text-amber-400',     bg: 'bg-amber-500/10',   bgSoft: 'bg-amber-500/10',   border: 'border-amber-500/30',   progress: 'from-amber-400 to-amber-500',   glow: 'shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)]', swatch: '#f59e0b' },
  emerald: { hsl: '#34d399', text: 'text-emerald-400',   bg: 'bg-emerald-500/10', bgSoft: 'bg-emerald-500/10', border: 'border-emerald-500/30', progress: 'from-emerald-400 to-emerald-500', glow: 'shadow-[0_0_20px_-4px_rgba(52,211,153,0.4)]', swatch: '#34d399' },
  cyan:    { hsl: '#22d3ee', text: 'text-cyan-400',      bg: 'bg-cyan-500/10',    bgSoft: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    progress: 'from-cyan-400 to-cyan-500',    glow: 'shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)]', swatch: '#22d3ee' },
  rose:    { hsl: '#fb7185', text: 'text-rose-400',      bg: 'bg-rose-500/10',    bgSoft: 'bg-rose-500/10',    border: 'border-rose-500/30',    progress: 'from-rose-400 to-rose-500',    glow: 'shadow-[0_0_20px_-4px_rgba(251,113,133,0.4)]', swatch: '#fb7185' },
  indigo:  { hsl: '#818cf8', text: 'text-indigo-400',    bg: 'bg-indigo-500/10',  bgSoft: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  progress: 'from-indigo-400 to-indigo-500',  glow: 'shadow-[0_0_20px_-4px_rgba(129,140,248,0.4)]', swatch: '#818cf8' },
  amber:   { hsl: '#fbbf24', text: 'text-amber-300',     bg: 'bg-amber-400/10',   bgSoft: 'bg-amber-400/10',   border: 'border-amber-400/30',   progress: 'from-amber-300 to-amber-400',   glow: 'shadow-[0_0_20px_-4px_rgba(251,191,36,0.4)]', swatch: '#fbbf24' },
  slate:   { hsl: '#94a3b8', text: 'text-slate-400',     bg: 'bg-slate-500/10',   bgSoft: 'bg-slate-500/10',   border: 'border-slate-500/30',   progress: 'from-slate-400 to-slate-500',   glow: 'shadow-[0_0_20px_-4px_rgba(148,163,184,0.4)]', swatch: '#94a3b8' },
  violet:  { hsl: '#a78bfa', text: 'text-violet-400',    bg: 'bg-violet-500/10',  bgSoft: 'bg-violet-500/10',  border: 'border-violet-500/30',  progress: 'from-violet-400 to-violet-500',  glow: 'shadow-[0_0_20px_-4px_rgba(167,139,250,0.4)]', swatch: '#a78bfa' },
  primary:   { hsl: '#ffc880', text: 'text-primary',         bg: 'bg-primary/10',        bgSoft: 'bg-primary/10',        border: 'border-primary/30',     progress: 'from-primary/80 to-primary',        glow: 'shadow-[0_0_20px_-4px_rgba(255,200,128,0.4)]', swatch: '#ffc880' },
  secondary: { hsl: '#b4b7ff', text: 'text-secondary',       bg: 'bg-secondary/10',      bgSoft: 'bg-secondary/10',      border: 'border-secondary/30',   progress: 'from-secondary/80 to-secondary',    glow: 'shadow-[0_0_20px_-4px_rgba(180,183,255,0.4)]', swatch: '#b4b7ff' },
  tertiary:  { hsl: '#5beaad', text: 'text-tertiary',        bg: 'bg-tertiary/10',       bgSoft: 'bg-tertiary/10',       border: 'border-tertiary/30',    progress: 'from-tertiary/80 to-tertiary',      glow: 'shadow-[0_0_20px_-4px_rgba(91,234,173,0.4)]', swatch: '#5beaad' },
};

/** Return raw hex for inline styles (used by accent swatches). */
export function accentHex(accent: AccentColor): string {
  return COURSE_COLORS[accent]?.swatch ?? '#ffc880';
}

export function accentText(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return COURSE_COLORS[accent].text;
  switch (accent) {
    case 'primary':   return 'text-primary';
    case 'secondary': return 'text-secondary';
    case 'tertiary':  return 'text-tertiary';
    default:          return 'text-primary';
  }
}

export function accentBg(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return COURSE_COLORS[accent].bg;
  switch (accent) {
    case 'primary':   return 'bg-primary';
    case 'secondary': return 'bg-secondary';
    case 'tertiary':  return 'bg-tertiary';
    default:          return 'bg-primary';
  }
}

export function accentBorder(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return COURSE_COLORS[accent].border;
  switch (accent) {
    case 'primary':   return 'border-primary/30';
    case 'secondary': return 'border-secondary/30';
    case 'tertiary':  return 'border-tertiary/30';
    default:          return 'border-primary/30';
  }
}

export function accentGlow(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return COURSE_COLORS[accent].glow;
  switch (accent) {
    case 'primary':   return 'shadow-[0_0_20px_-4px_rgba(245,166,35,0.4)]';
    case 'secondary': return 'shadow-[0_0_20px_-4px_rgba(180,183,255,0.4)]';
    case 'tertiary':  return 'shadow-[0_0_20px_-4px_rgba(91,234,173,0.4)]';
    default:          return 'shadow-[0_0_20px_-4px_rgba(245,166,35,0.4)]';
  }
}

export function accentSoftBg(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return COURSE_COLORS[accent].bgSoft;
  switch (accent) {
    case 'primary':   return 'bg-primary/10';
    case 'secondary': return 'bg-secondary/10';
    case 'tertiary':  return 'bg-tertiary/10';
    default:          return 'bg-primary/10';
  }
}

export function accentProgress(accent: AccentColor): string {
  if (COURSE_COLORS[accent]) return `bg-gradient-to-r ${COURSE_COLORS[accent].progress}`;
  switch (accent) {
    case 'primary':   return 'from-primary/80 to-primary';
    case 'secondary': return 'from-secondary/80 to-secondary';
    case 'tertiary':  return 'from-tertiary/80 to-tertiary';
    default:          return 'from-primary/80 to-primary';
  }
}
