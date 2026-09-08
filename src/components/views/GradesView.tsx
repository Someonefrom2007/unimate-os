import { useEffect, useMemo, useState } from 'react';
import { Award, TrendingUp, Calculator, Target } from 'lucide-react';
import { useGradeStore } from '@/core/store/useGradeStore';
import { useCourseStore } from '@/core/store/useCourseStore';
import { useProfileStore } from '@/core/store/useProfileStore';
import {
  classifyGrade,
  computeSemesterGPA,
  simulateGpaTargets,
  gradeDisplayLabel,
  classificationColor,
} from '@/core/engines/gradeEngine';
import { GradeClassification } from '@/core/domain/enums';
import { toUiGrade, toUiProfile, type UiGradeEntry } from './gradeUiAdapter';
import { toUiCourse } from './courseUiAdapter';
import { accentText, accentSoftBg } from '@/lib/accent';

/** Display classification banding for the scale card. */
const SCALE_BANDS = [
  { range: '< 5.0', label: 'Fail', color: 'text-error', bg: 'bg-error/10' },
  { range: '5.0–6.9', label: 'Pass', color: 'text-on-surface-variant', bg: 'bg-white/5' },
  { range: '7.0–8.9', label: 'Notable', color: 'text-primary', bg: 'bg-primary/10' },
  { range: '9.0–9.9', label: 'Outstanding', color: 'text-tertiary', bg: 'bg-tertiary/10' },
  { range: '10.0', label: 'Honors', color: 'text-secondary', bg: 'bg-secondary/10' },
];

export function GradesView() {
  const gradeStore = useGradeStore();
  const courseStore = useCourseStore();
  const profileStore = useProfileStore();

  const { data: gradeDomain, loading: gradeLoading, error: gradeError, initialized: gradesInit, load: loadGrades } = gradeStore;
  const { data: courseDomain, loading: courseLoading, error: courseError, initialized: coursesInit, load: loadCourses } = courseStore;
  const { data: profileDomain, load: loadProfile, initialized: profileInit } = profileStore;

  useEffect(() => {
    if (!gradesInit) void loadGrades();
    if (!coursesInit) void loadCourses();
    if (!profileInit) void loadProfile();
  }, [gradesInit, coursesInit, profileInit, loadGrades, loadCourses, loadProfile]);

  const courses = useMemo(() => (courseDomain || []).map(toUiCourse), [courseDomain]);
  const grades: UiGradeEntry[] = useMemo(() => (gradeDomain || []).map(toUiGrade), [gradeDomain]);
  const profile = useMemo(() => (profileDomain ? toUiProfile(profileDomain) : null), [profileDomain]);

  const [simCourse, setSimCourse] = useState(courses[0]?.code || '');
  const [simTarget, setSimTarget] = useState(profile?.target_gpa ?? 8.0);

  const gpa = computeSemesterGPA(courseDomain || [], gradeDomain || []);
  const gpaClass = classifyGrade(gpa);

  const simCourseObj = courses.find((c) => c.code === simCourse);
  const simGrades = (gradeDomain || []).filter((g) => g.courseCode === simCourse);
  const currentWeight = simGrades.reduce((s, g) => s + g.weight, 0);
  const currentAvg = simGrades.length > 0
    ? simGrades.reduce((sum, g) => sum + (g.grade / g.maxGrade) * 10 * g.weight, 0) / Math.max(1, currentWeight)
    : 0;
  const sim = simulateGpaTargets(currentAvg, Math.min(100, currentWeight), [simTarget]);
  const neededGrade = sim[0]?.requiredGrade ?? 0;

  const groupedGrades = courses.map((course) => ({
    course,
    entries: grades.filter((g) => g.course_code === course.code),
  }));
  const targetGpa = profile?.target_gpa ?? 8.0;
  const totalEcts = profile?.total_ects ?? 180;
  const completedEcts = profile?.completed_ects ?? 120;
  const ectsPct = totalEcts > 0 ? Math.round((completedEcts / totalEcts) * 100) : 0;

  const loading = (gradeLoading && !gradesInit) || (courseLoading && !coursesInit);
  const error = gradeError || courseError;

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-label-mono-sm text-on-surface-variant/60">Loading grades…</p>
        </div>
      </div>
    );
  }

  if (error && !gradesInit) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="font-body-lg text-error">{error}</p>
        <button onClick={() => void loadGrades()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-body-md font-semibold text-surface">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* GPA Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Semester GPA</p>
          <p className={`mt-1 font-headline-lg text-[28px] font-bold ${gpaClass === GradeClassification.Fail ? 'text-error' : classificationColor(gpaClass)}`}>
            {gpa.toFixed(2)}
          </p>
          <p className="font-label-mono-xs text-on-surface-variant/50">{gradeDisplayLabel(gpa)}</p>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
            <Target className="h-[18px] w-[18px] text-secondary" strokeWidth={2} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Target GPA</p>
          <p className="mt-1 font-headline-lg text-[28px] font-bold text-on-background">{targetGpa.toFixed(1)}</p>
          <p className="font-label-mono-xs text-on-surface-variant/50">Personal goal</p>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary/10">
            <TrendingUp className="h-[18px] w-[18px] text-tertiary" strokeWidth={2} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">ECTS Progress</p>
          <p className="mt-1 font-headline-lg text-[28px] font-bold text-on-background">{ectsPct}%</p>
          <p className="font-label-mono-xs text-on-surface-variant/50">{completedEcts} / {totalEcts} ECTS</p>
        </div>

        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10">
            <Calculator className="h-[18px] w-[18px] text-error" strokeWidth={2} />
          </div>
          <p className="mt-3 font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Courses Tracked</p>
          <p className="mt-1 font-headline-lg text-[28px] font-bold text-on-background">{courses.length}</p>
          <p className="font-label-mono-xs text-on-surface-variant/50">Active enrollments</p>
        </div>
      </div>

      {/* Grade Simulator */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-headline-md text-[16px] font-semibold text-on-background">Grade Simulator</h3>
            <p className="font-label-mono-sm text-[11px] text-on-surface-variant/60">What grade do I need on the final?</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Course</label>
            <select
              value={simCourse}
              onChange={(e) => setSimCourse(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-surface-container/60 px-3 py-2.5 font-body-md text-[13px] text-on-background focus:border-primary/40 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Target Grade</label>
            <div className="flex gap-2">
              {[5.0, 7.0, 8.0, 9.0, 10.0].map((g) => (
                <button
                  key={g}
                  onClick={() => setSimTarget(g)}
                  className={`flex-1 rounded-lg border px-2 py-2 font-label-mono-sm font-bold transition-all ${
                    simTarget === g
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-white/10 bg-surface-container/40 text-on-surface-variant hover:bg-white/5'
                  }`}
                >
                  {g.toFixed(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {simCourseObj && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Current Average</p>
                <p className="font-headline-md text-[20px] font-bold text-primary">{isFinite(currentAvg) ? currentAvg.toFixed(2) : '—'}</p>
              </div>
              <div>
                <p className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Weight Graded</p>
                <p className="font-headline-md text-[20px] font-bold text-on-background">{Math.round(currentWeight)}%</p>
              </div>
              <div className="text-right">
                <p className="font-label-mono-xs uppercase tracking-wider text-on-surface-variant/60">Needed on Final</p>
                <p className={`font-headline-md text-[20px] font-bold ${sim[0]?.feasible ? 'text-tertiary' : 'text-error'}`}>
                  {sim[0]?.feasible ? `${neededGrade.toFixed(2)}` : '—'}
                </p>
                {!sim[0]?.feasible && <p className="font-label-mono-xs text-error">Target out of reach</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Breakdown */}
      <div className="flex flex-col gap-4">
        {groupedGrades.map(({ course, entries }) => {
          const avg = entries.length > 0
            ? entries.reduce((sum, g) => sum + (g.grade / g.max_grade) * 10 * g.weight, 0) / Math.max(1, entries.reduce((s, g) => s + g.weight, 0))
            : course.avg_grade;
          const cls = classifyGrade(avg);
          return (
            <div key={course.id} className="glass-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentSoftBg(course.accent)}`}>
                    <span className={`font-label-mono-sm font-bold ${accentText(course.accent)}`}>
                      {course.code.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-body-md text-[13px] font-semibold text-on-background">{course.code}</p>
                    <p className="font-label-mono-xs text-on-surface-variant/50">{course.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-headline-md text-[18px] font-bold ${classificationColor(cls)}`}>{isFinite(avg) ? avg.toFixed(2) : '—'}</p>
                  <p className={`font-label-mono-xs ${classificationColor(cls)}`}>{gradeDisplayLabel(avg)}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-surface-container/30">
                      <th className="px-3 py-2 text-left font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Assessment</th>
                      <th className="px-3 py-2 text-right font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Weight</th>
                      <th className="px-3 py-2 text-right font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50">Grade</th>
                      <th className="hidden px-3 py-2 text-right font-label-mono-xs uppercase tracking-wider text-on-surface-variant/50 sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const ecls = classifyGrade(entry.grade);
                      return (
                        <tr key={entry.id} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-2.5 font-body-md text-[13px] text-on-background">{entry.assessment_name}</td>
                          <td className="px-3 py-2.5 text-right font-label-mono-sm text-on-surface-variant/70">{entry.weight}%</td>
                          <td className={`px-3 py-2.5 text-right font-label-mono-sm font-semibold ${classificationColor(ecls)}`}>
                            {entry.grade.toFixed(2)}
                          </td>
                          <td className="hidden px-3 py-2.5 text-right font-label-mono-sm text-on-surface-variant/60 sm:table-cell">{entry.date_label}</td>
                        </tr>
                      );
                    })}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center font-label-mono-sm text-on-surface-variant/40">
                          No grades recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {groupedGrades.length === 0 && (
          <div className="glass-card rounded-3xl p-10 text-center">
            <p className="font-label-mono-sm text-on-surface-variant/50">No courses or grades yet.</p>
          </div>
        )}
      </div>

      {/* Classification Scale */}
      <div className="glass-card rounded-3xl p-5">
        <h3 className="mb-3 font-headline-md text-[16px] font-semibold text-on-background">Academic Classification</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SCALE_BANDS.map((cls) => (
            <div key={cls.label} className={`rounded-lg ${cls.bg} p-3 text-center`}>
              <p className="font-label-mono-xs text-on-surface-variant/60">{cls.range}</p>
              <p className={`mt-1 font-body-md text-[13px] font-semibold ${cls.color}`}>{cls.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}