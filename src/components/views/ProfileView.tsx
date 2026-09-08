import { useState } from 'react';
import { User, Mail, GraduationCap, Target, Award, MapPin, Calendar, Save, UserPlus } from 'lucide-react';
import type { Profile, Course, GradeEntry } from '@/lib/types';
import { computeGPA, computeEctsProgress } from '@/lib/grades';

interface ProfileViewProps {
  profile: Profile | null;
  courses: Course[];
  grades: GradeEntry[];
  onCreateProfile: (input: Omit<Profile, 'id' | 'initials' | 'semester_label' | 'accent'>) => void;
}

function ProfileSetupCard({ onCreateProfile }: { onCreateProfile: ProfileViewProps['onCreateProfile'] }) {
  const [name, setName] = useState('');
  const [degree, setDegree] = useState('BSc Computer Science');
  const [university, setUniversity] = useState('');
  const [targetGpa, setTargetGpa] = useState(8.0);
  const [totalEcts, setTotalEcts] = useState(180);
  const [completedEcts, setCompletedEcts] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    const gpaClamped = Math.min(10, Math.max(5, targetGpa));
    const completed = Math.min(totalEcts, Math.max(0, completedEcts));
    onCreateProfile({
      name: name.trim(),
      email: '',
      university: university.trim() || 'Your University',
      degree: degree.trim() || 'BSc Computer Science',
      year_label: 'Year 1',
      target_gpa: gpaClamped,
      total_ects: totalEcts,
      completed_ects: completed,
    });
  };

  const inputCls = 'w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none';
  const labelCls = 'mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50';

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container gold-glow">
            <UserPlus className="h-8 w-8 text-surface" />
          </div>
          <div className="flex-1">
            <h2 className="font-display-hero text-[26px] font-bold text-on-background sm:text-[30px]">Welcome — let&apos;s set up your profile</h2>
            <p className="mt-1 font-body-md text-[13px] text-on-surface-variant/70">
              Your profile powers your dashboard identity, GPA targets, and ECTS progress. Fill this in once and it can be edited later.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Karimi" />
          </div>
          <div>
            <label className={labelCls}>Degree</label>
            <input className={inputCls} value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. BSc Computer Science" />
          </div>
          <div>
            <label className={labelCls}>University</label>
            <input className={inputCls} value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. TU Delft" />
          </div>
          <div>
            <label className={labelCls}>Target GPA (5 – 10)</label>
            <input
              type="number" min={5} max={10} step={0.1}
              className={inputCls} value={targetGpa}
              onChange={(e) => setTargetGpa(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Total ECTS</label>
            <input
              type="number" min={0} max={600}
              className={inputCls} value={totalEcts}
              onChange={(e) => setTotalEcts(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Completed ECTS</label>
            <input
              type="number" min={0} max={totalEcts}
              className={inputCls} value={completedEcts}
              onChange={(e) => setCompletedEcts(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="mt-3 font-body-md text-[13px] text-error">{error}</p>}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 font-body-md text-[13px] font-semibold text-surface transition-transform hover:scale-[1.02]"
          >
            <Save className="h-4 w-4" strokeWidth={2.5} />
            Create My Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileView({ profile, courses, grades, onCreateProfile }: ProfileViewProps) {
  const gpa = computeGPA(courses, grades);
  const ectsProgress = profile ? computeEctsProgress(profile.completed_ects, profile.total_ects) : 0;

  if (!profile) {
    return <ProfileSetupCard onCreateProfile={onCreateProfile} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary-fixed-dim text-[28px] font-bold text-surface">
            {profile.initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display-hero text-[28px] font-bold text-on-background sm:text-[32px]">{profile.name}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-surface-container/60 px-3 py-1 font-label-mono-sm text-on-surface-variant/80">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                {profile.degree}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-surface-container/60 px-3 py-1 font-label-mono-sm text-on-surface-variant/80">
                <MapPin className="h-3.5 w-3.5 text-tertiary" />
                {profile.university}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-surface-container/60 px-3 py-1 font-label-mono-sm text-on-surface-variant/80">
                <Calendar className="h-3.5 w-3.5 text-secondary" />
                {profile.year_label} · {profile.semester_label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-[18px] w-[18px] text-primary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Current GPA</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{gpa.toFixed(2)}</p>
          <p className="mt-1 font-label-mono-xs text-tertiary">Above target ({profile.target_gpa})</p>
        </div>
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary/10">
            <Target className="h-[18px] w-[18px] text-tertiary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">ECTS Progress</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{profile.completed_ects}/{profile.total_ects}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-tertiary transition-all duration-500" style={{ width: `${ectsProgress}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
            <GraduationCap className="h-[18px] w-[18px] text-secondary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Active Courses</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{courses.length}</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">{courses.reduce((s, c) => s + c.ects, 0)} ECTS this term</p>
        </div>
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-[18px] w-[18px] text-primary" />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Grades Logged</p>
          <p className="mt-1 font-headline-lg text-[26px] font-bold text-on-background">{grades.length}</p>
          <p className="mt-1 font-label-mono-xs text-on-surface-variant/50">Across all courses</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="glass-card rounded-3xl p-5">
        <h3 className="mb-4 font-headline-md text-[16px] font-semibold text-on-background">Academic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
              <User className="h-4 w-4 text-on-surface-variant/60" />
            </div>
            <div>
              <p className="font-label-mono-xs text-on-surface-variant/50">Full Name</p>
              <p className="font-body-md text-[13px] font-semibold text-on-background">{profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
              <Mail className="h-4 w-4 text-on-surface-variant/60" />
            </div>
            <div>
              <p className="font-label-mono-xs text-on-surface-variant/50">Email</p>
              <p className="font-body-md text-[13px] font-semibold text-on-background">{profile.email || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
              <GraduationCap className="h-4 w-4 text-on-surface-variant/60" />
            </div>
            <div>
              <p className="font-label-mono-xs text-on-surface-variant/50">University</p>
              <p className="font-body-md text-[13px] font-semibold text-on-background">{profile.university}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
              <Target className="h-4 w-4 text-on-surface-variant/60" />
            </div>
            <div>
              <p className="font-label-mono-xs text-on-surface-variant/50">Academic Goal</p>
              <p className="font-body-md text-[13px] font-semibold text-on-background">Finish with {profile.target_gpa}+ GPA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
