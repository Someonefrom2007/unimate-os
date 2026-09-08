import { Check, Sparkles, Zap, Cloud, Brain, Upload, BarChart3, Users } from 'lucide-react';

const freeFeatures = [
  'Dashboard', 'Courses', 'Schedule', 'Tasks', 'Exams', 'Grades', 'Notes',
  'Resources', 'Focus Timer', 'Goals', 'Habits', 'Workload', 'Insights', 'Global Search',
];

const proFeatures = [
  'Advanced AI assistant', 'Syllabus parsing', 'PDF parsing', '.ics parsing',
  'Advanced grade simulations', 'Predictive workload', 'Smart planning', 'Advanced analytics',
];

const ultimateFeatures = [
  'Everything in PRO', 'Advanced cloud sync', 'Shared course repositories',
  'Collaboration', 'University integrations', 'Advanced personalization',
];

interface PlanCardProps {
  name: string;
  tagline: string;
  description: string;
  features: string[];
  icon: typeof Sparkles;
  accent: 'primary' | 'secondary' | 'tertiary';
  current?: boolean;
}

function PlanCard({ name, tagline, description, features, icon: Icon, accent, current }: PlanCardProps) {
  const color = accent === 'primary' ? 'text-primary' : accent === 'secondary' ? 'text-secondary' : 'text-tertiary';
  const bg = accent === 'primary' ? 'bg-primary/10' : accent === 'secondary' ? 'bg-secondary/10' : 'bg-tertiary/10';
  const border = accent === 'primary' ? 'border-primary/30' : accent === 'secondary' ? 'border-secondary/20' : 'border-tertiary/20';
  return (
    <div className={`glass-card relative rounded-2xl border ${border} p-6 transition-all duration-300 hover:translate-y-[-3px] ${current ? 'gold-glow' : ''}`}>
      {current && <span className="absolute right-5 top-5 rounded-full bg-primary/20 px-2.5 py-1 font-label-mono-xs text-primary">Current Plan</span>}
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <p className={`mt-4 font-label-mono-xs uppercase tracking-wider ${color}`}>{tagline}</p>
      <h3 className="mt-1 font-display-hero text-[28px] font-bold text-on-background">{name}</h3>
      <p className="mt-2 font-body-md text-[13px] leading-relaxed text-on-surface-variant/70">{description}</p>
      <div className="my-5 h-px bg-white/8" />
      <ul className="space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 font-body-md text-[13px] text-on-surface-variant">
            <Check className={`h-4 w-4 shrink-0 ${color}`} />
            {feature}
          </li>
        ))}
      </ul>
      <button className={`mt-6 w-full rounded-lg border px-4 py-2.5 font-body-md text-[13px] font-semibold transition-all ${
        current ? 'border-primary/30 bg-primary/10 text-primary' : `border-white/10 bg-white/5 ${color} hover:bg-white/10`
      }`}>
        {current ? 'You are here' : 'Coming Soon'}
      </button>
    </div>
  );
}

export function PlansView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 font-display-hero text-[30px] font-bold text-on-background">Choose your UNI·MATE</h2>
        <p className="mx-auto mt-2 max-w-lg font-body-lg text-[14px] text-on-surface-variant/70">
          Start organizing for free. Upgrade when you want UNI·MATE to understand and connect your whole academic life.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <PlanCard
          name="Free"
          tagline="Organize"
          description="Complete core university management for every student."
          features={freeFeatures}
          icon={Zap}
          accent="primary"
          current
        />
        <PlanCard
          name="PRO"
          tagline="Understand"
          description="Advanced intelligence that turns your data into a smarter study plan."
          features={proFeatures}
          icon={Brain}
          accent="secondary"
        />
        <PlanCard
          name="ULTIMATE"
          tagline="Connect"
          description="Your complete connected academic ecosystem, built for ambitious students."
          features={ultimateFeatures}
          icon={Cloud}
          accent="tertiary"
        />
      </div>
      <div className="glass-card rounded-3xl p-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 font-label-mono-sm text-on-surface-variant/60">
          <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Import your data</span>
          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-tertiary" /> Own your data</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-secondary" /> Built around you</span>
        </div>
      </div>
    </div>
  );
}
