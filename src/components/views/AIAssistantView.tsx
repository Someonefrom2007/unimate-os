import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import type { Task, Course, Assessment, FocusSession } from '@/lib/types';

interface AIAssistantViewProps {
  tasks: Task[];
  courses: Course[];
  assessments: Assessment[];
  sessions: FocusSession[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AIAssistantView({ tasks, courses, assessments, sessions }: AIAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Hi Alex! I'm your UNI·MATE AI assistant. I can see your courses, tasks, schedule, grades, and more. Ask me anything about your academic life — what should I help you with?",
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();
    const pendingTasks = tasks.filter((t) => !t.completed);
    const totalHours = pendingTasks.reduce((s, t) => s + t.estimated_hours, 0);
    const focusMinutes = sessions.reduce((s, sess) => s + sess.duration_minutes, 0);

    if (q.includes('study') && (q.includes('today') || q.includes('should'))) {
      const topTask = pendingTasks[0];
      return topTask
        ? `Based on your current workload, I'd recommend starting with "${topTask.title}" (${topTask.course_code}). It's your highest-priority pending task with an estimated ${topTask.estimated_hours}h of work. You've been most productive during evening focus sessions — consider scheduling a 50-minute deep work block at 18:00.`
        : "You have no pending tasks right now. This is a great time to review notes or get ahead on upcoming material!";
    }

    if (q.includes('exam')) {
      if (assessments.length === 0) return "You have no upcoming exams logged. Enjoy the calm before the storm!";
      const list = assessments.map((a) => `${a.code_label}: ${a.title} — ${a.days_until_label}`).join('\n');
      return `You have ${assessments.length} upcoming assessments:\n\n${list}\n\nI'd recommend starting your preparation at least 5 days before each exam. Your strongest study pattern is evening focus sessions.`;
    }

    if (q.includes('semester') || q.includes('doing') || q.includes('how am i')) {
      const avgGrade = courses.reduce((s, c) => s + c.avg_grade, 0) / courses.length;
      return `You're doing well this semester! Your current average across ${courses.length} courses is ${avgGrade.toFixed(1)}, which puts you in the "Notable" classification. You're 0.4 above your GPA target of 8.0. Your strongest course is ${courses.reduce((best, c) => (c.avg_grade > best.avg_grade ? c : best), courses[0]).name}.`;
    }

    if (q.includes('grade') && q.includes('need')) {
      return `To calculate exactly what grade you need on a final, head to the Grades page and use the Grade Simulator. Just pick a course and your target grade — it'll compute the needed score on remaining assessments automatically.`;
    }

    if (q.includes('prioritiz')) {
      const sorted = [...pendingTasks].sort((a, b) => {
        const prioRank = { high: 0, medium: 1, low: 2 };
        return prioRank[a.priority] - prioRank[b.priority];
      });
      const top3 = sorted.slice(0, 3).map((t, i) => `${i + 1}. ${t.title} (${t.course_code}) — ${t.priority} priority, ${t.estimated_hours}h`);
      return `Here's what I'd prioritize:\n\n${top3.join('\n')}\n\nFocus on the high-priority items first, then work through the medium-priority tasks.`;
    }

    if (q.includes('workload')) {
      return `Your current workload is ${totalHours}h across ${pendingTasks.length} pending tasks. That's 34% higher than last week. The heaviest course right now is ${pendingTasks[0]?.course_code || 'N/A'}. Consider redistributing or scheduling extra focus sessions.`;
    }

    if (q.includes('focus') || q.includes('session')) {
      return `You've logged ${focusMinutes} minutes of focused study time across ${sessions.length} sessions. Your most productive time appears to be between 18:00–20:00. Your current streak is 14 days — keep it going!`;
    }

    if (q.includes('summar') || q.includes('note')) {
      return `I can see you have notes for ${courses.length} courses. For AI-powered note summarization, flashcard generation, and quiz creation, upgrade to UNI·MATE PRO when it launches. For now, your notes are fully searchable and organized by course.`;
    }

    if (q.includes('plan')) {
      return `Here's a suggested study plan for today:\n\n1. 18:00–18:50: Deep work on "${pendingTasks[0]?.title || 'your top task'}"\n2. 18:50–18:55: Short break\n3. 18:55–19:45: Continue or switch to "${pendingTasks[1]?.title || 'next task'}"\n4. 19:45–20:00: Review notes and organize\n\nThis matches your peak productivity window. Want me to create focus sessions for this?`;
    }

    return `I can help with study planning, exam preparation, workload analysis, grade calculations, and more. Try asking:\n\n• "What should I study today?"\n• "What exams do I have?"\n• "How am I doing this semester?"\n• "What should I prioritize?"\n• "Make me a study plan"`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now() + 'u', role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const response = generateResponse(input);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now() + 'a', role: 'assistant', text: response }]);
    }, 600);
  };

  const suggestions = [
    'What should I study today?',
    'What exams do I have?',
    'How am I doing this semester?',
    'What should I prioritize?',
    'Make me a study plan',
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-5">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 gold-glow">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-headline-md text-[17px] font-semibold text-on-background">UNI·MATE AI Assistant</h2>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">
              Connected to your courses, tasks, grades, schedule & habits
            </p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="glass-card flex flex-col rounded-3xl p-5" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user' ? 'bg-gradient-to-br from-secondary to-secondary-fixed-dim' : 'bg-primary/10'
              }`}>
                {msg.role === 'user' ? (
                  <span className="text-[12px] font-bold text-surface">AK</span>
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-3.5 ${
                msg.role === 'user'
                  ? 'bg-secondary/10 text-on-background'
                  : 'bg-surface-container/60 text-on-background'
              }`}>
                <p className="whitespace-pre-line font-body-md text-[13px] leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-container/40 px-3 py-1.5 font-label-mono-xs text-on-surface-variant/70 transition-colors hover:bg-white/10 hover:text-on-background"
              >
                <Sparkles className="h-3 w-3 text-primary/60" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Ask me anything about your studies…"
            className="flex-1 rounded-lg border border-white/10 bg-surface-container/40 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-container text-surface transition-transform hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
