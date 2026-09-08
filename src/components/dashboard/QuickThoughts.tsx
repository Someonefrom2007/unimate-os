import { Check, Plus, Lightbulb } from 'lucide-react';
import type { QuickThought } from '@/lib/types';

interface QuickThoughtsProps {
  thoughts: QuickThought[];
  onToggle: (id: string, completed: boolean) => void;
  onAdd: (text: string) => void;
}

export function QuickThoughts({ thoughts, onToggle, onAdd }: QuickThoughtsProps) {
  return (
    <div className="apple-card rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <h3 className="font-headline-md text-[16px] font-semibold text-on-background">
            Quick Thoughts
          </h3>
          <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
            Scratchpad & reminders
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {thoughts.map((t) => (
          <button
            key={t.id}
            onClick={() => onToggle(t.id, !t.completed)}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                t.completed
                  ? 'border-tertiary bg-tertiary/20'
                  : 'border-white/20 group-hover:border-white/40'
              }`}
            >
              {t.completed && <Check className="h-3 w-3 text-tertiary" strokeWidth={3} />}
            </span>
            <span
              className={`font-body-md text-[13px] ${
                t.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-surface-variant'
              }`}
            >
              {t.text}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          const text = prompt('Add a quick thought:');
          if (text) onAdd(text);
        }}
        className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2.5 font-label-mono-sm text-[11px] text-on-surface-variant/50 transition-colors hover:border-white/20 hover:text-on-surface-variant/80"
      >
        <Plus className="h-3.5 w-3.5" />
        Add a thought
      </button>
    </div>
  );
}
