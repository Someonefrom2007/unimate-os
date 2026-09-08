/**
 * AIAssistantView — chat interface powered by AIContextEngine.
 * Reads from domain stores; provides a structured context for the mock AI.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useTaskStore } from '@/core/store/useTaskStore';
import { useExamStore } from '@/core/store/useExamStore';
import { useGradeStore } from '@/core/store/useGradeStore';
import { useFocusStore } from '@/core/store/useFocusStore';
import { buildAIContext } from '@/core/engines/aiContextEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AIAssistantView() {
  const { data: courses, initialized: cInit, load: loadC } = useCourseStore();
  const { data: tasks, initialized: tInit, load: loadT } = useTaskStore();
  const { data: exams, initialized: eInit, load: loadE } = useExamStore();
  const { data: grades, initialized: gInit, load: loadG } = useGradeStore();
  const { data: sessions, initialized: sInit, load: loadS } = useFocusStore();

  useEffect(() => {
    if (!cInit) void loadC();
    if (!tInit) void loadT();
    if (!eInit) void loadE();
    if (!gInit) void loadG();
    if (!sInit) void loadS();
  }, [cInit, tInit, eInit, gInit, sInit, loadC, loadT, loadE, loadG, loadS]);

  const ctx = useMemo(() => buildAIContext(courses, tasks, exams, grades, sessions), [courses, tasks, exams, grades, sessions]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: `Hi! I'm your UNI·MATE AI assistant. Here's what I know about you:\n\n• **${ctx.summary.courseCount}** active courses (avg grade: **${ctx.summary.averageGrade}/10**, ${ctx.summary.totalEcts} ECTS)\n• **${ctx.summary.pendingTaskCount}** pending tasks${ctx.summary.overdueTaskCount > 0 ? ` (${ctx.summary.overdueTaskCount} overdue!)` : ''}\n• **${ctx.summary.examCount}** upcoming exams${ctx.summary.examsWithinWeek > 0 ? ` (${ctx.summary.examsWithinWeek} this week)` : ''}\n• **${ctx.summary.weeklyFocusHours}h** focus time this week\n\nAsk me anything about your studies!`,
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();
    const pending = tasks.filter((t) => !t.completed);
    const s = ctx.summary;

    if (q.includes('study') && (q.includes('today') || q.includes('should'))) {
      const top = pending[0];
      return top
        ? `Based on your workload, start with **"${top.title}"** (${top.courseCode}). It's your highest-priority pending task (est. ${top.estimatedHours}h). ${s.weeklyFocusHours > 10 ? 'You have strong focus momentum this week.' : 'Consider a 25-min pomodoro block.'}`
        : 'You have no pending tasks right now. Great time to review notes or get ahead!';
    }
    if (q.includes('exam')) {
      return s.examsWithinWeek > 0
        ? `You have **${s.examsWithinWeek} exam(s) within 7 days**. Prioritise revision for those. Your average grade is ${s.averageGrade}/10 — you're well-prepared.`
        : `No exams in the next 7 days. ${s.examCount > 0 ? `You have ${s.examCount} total upcoming — use this time to get ahead.` : 'Enjoy the breathing room!'}`;
    }
    if (q.includes('grade') || q.includes('gpa') || q.includes('average')) {
      return `Your weighted average grade is **${s.averageGrade}/10** across ${s.courseCount} courses (${s.totalEcts} ECTS). ${s.averageGrade >= 8 ? 'Outstanding performance!' : s.averageGrade >= 6 ? 'Solid work — keep pushing upward.' : 'There\'s room for improvement. Consider focusing on your weakest course.'}`;
    }
    if (q.includes('overdue') || q.includes('late')) {
      return s.overdueTaskCount > 0
        ? `You have **${s.overdueTaskCount} overdue task(s)**. I'd recommend addressing those first — they may be affecting your grades.`
        : 'No overdue tasks — you\'re on track!';
    }
    if (q.includes('focus') || q.includes('study time')) {
      return `You've logged **${s.weeklyFocusHours}h** of focus time this week. ${s.weeklyFocusHours > 15 ? 'Impressive deep work!' : s.weeklyFocusHours > 5 ? 'Good balance — try to maintain it.' : 'Consider blocking out more dedicated study time.'}`;
    }
    if (q.includes('workload') || q.includes('busy')) {
      return `You have **${s.pendingTaskCount}** pending tasks${s.examsWithinWeek > 0 ? ` and ${s.examsWithinWeek} exams this week` : ''}. ${s.pendingTaskCount > 10 ? 'That\'s a lot — consider prioritising or delegating.' : 'Your workload looks manageable.'}`;
    }
    return `Great question! Based on your context: you have ${s.courseCount} courses with an average grade of ${s.averageGrade}/10, ${s.pendingTaskCount} pending tasks, and ${s.weeklyFocusHours}h of focus this week. Could you be more specific about what you'd like to know?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: generateResponse(input.trim()) };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10"><Bot className="h-5 w-5 text-secondary" strokeWidth={2} /></div>
        <div>
          <h2 className="font-headline-md text-[17px] font-semibold text-on-background">AI Assistant</h2>
          <p className="font-body-sm text-[11px] text-on-surface-variant/50">Ask about your courses, tasks, schedule, or grades</p>
        </div>
      </div>

      {/* Context summary pill */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `${ctx.summary.averageGrade}/10 avg`, color: 'bg-primary/12 text-primary' },
          { label: `${ctx.summary.pendingTaskCount} tasks`, color: 'bg-secondary/12 text-secondary' },
          { label: `${ctx.summary.weeklyFocusHours}h focus`, color: 'bg-tertiary/12 text-tertiary' },
          { label: `${ctx.summary.examCount} exams`, color: 'bg-error/12 text-error' },
        ].map((p) => (
          <span key={p.label} className={`rounded-full px-3 py-1 font-label-mono-xs text-[11px] font-bold ${p.color}`}>{p.label}</span>
        ))}
      </div>

      {/* Chat */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <div ref={scrollRef} className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 font-body-md text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-primary/15 text-on-background' : 'bg-white/5 text-on-surface-variant'}`}>
                {m.role === 'assistant' && <span className="mb-1 flex items-center gap-1 font-label-mono-xs text-[10px] text-secondary/60"><Sparkles className="h-3 w-3" /> AI Assistant</span>}
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your academic life..."
            className="flex-1 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/30 focus:border-primary/30 focus:outline-none"
          />
          <button onClick={handleSend} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-all hover:bg-primary/25"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
