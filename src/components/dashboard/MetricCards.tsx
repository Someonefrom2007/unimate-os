import { Clock, CheckCircle2, GraduationCap, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  pendingTasks: number;
  completedTasks: number;
  activeCourses: number;
  avgGrade: number;
}

export function MetricCards({
  pendingTasks,
  completedTasks,
  activeCourses,
  avgGrade,
}: MetricCardsProps) {
  const metrics = [
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
      trend: '+2 vs last week',
      trendColor: 'text-primary/70',
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      accent: 'text-tertiary',
      bgAccent: 'bg-tertiary/10',
      trend: 'On track',
      trendColor: 'text-tertiary/70',
    },
    {
      label: 'Active Courses',
      value: activeCourses,
      icon: GraduationCap,
      accent: 'text-secondary',
      bgAccent: 'bg-secondary/10',
      trend: '27.5 ECTS',
      trendColor: 'text-secondary/70',
    },
    {
      label: 'Avg Grade',
      value: avgGrade.toFixed(1),
      icon: TrendingUp,
      accent: 'text-primary',
      bgAccent: 'bg-primary/10',
      trend: '+0.3 this term',
      trendColor: 'text-primary/70',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="apple-card group rounded-3xl p-4 transition-all duration-200 ease-out hover:translate-y-[-1px] sm:p-5"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.bgAccent}`}>
                <Icon className={`h-[18px] w-[18px] ${m.accent}`} strokeWidth={2} />
              </div>
            </div>
            <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">
              {m.label}
            </p>
            <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background sm:text-[30px]">
              {m.value}
            </p>
            <p className={`mt-1 font-label-mono-xs ${m.trendColor}`}>{m.trend}</p>
          </div>
        );
      })}
    </div>
  );
}
