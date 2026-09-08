# 🚀 DETAILED MASTER ROADMAP EXECUTION TRACKER (M006 - M015)

> **PROGRESS: M006 ✓ · M007 ✓ · M008 ✓ · M009 ✓ · M010 ✓ · M011 ✓ · M012 ✓ · M013 ✓ · M014 ✓ · M015 ✓ · UI REFINEMENT ✓ · UI POLISH ✓** — 320/320 tests passing, `tsc` + lint clean, build passing. See `EXECUTION_LOG.md` for per-mission reports.

---

### UI POLISH & Course Color Picker Refinement — 2026-09-08T13:08

**STATUS**: ✅ COMPLETE

**DELIVERABLES**:

1. **Accent Color System Expansion** (`src/lib/types.ts`, `src/lib/accent.ts`, `src/core/domain/enums.ts`)
   - Extended `AccentColor` from 3 values → 11 values (added Gold, Emerald, Cyan, Rose, Indigo, Amber, Slate, Violet)
   - New `accentHex()` utility returns raw hex for inline styles (swatches, progress bars, borders)
   - All accent utilities (text, bg, border, glow, softBg, progress) now handle 11 colors

2. **Course Color Picker** (`src/components/views/CoursesView.tsx`)
   - `AccentColorPicker` component: 11 swatches (8 new + 3 legacy) with ring highlight
   - **CreateCourseModal**: includes accent color picker during course creation
   - **CourseDetailModal**: full color picker section + quick-cycle palette button on header icon
   - **Course cards**: inline palette button (appears on hover) cycles through all 11 colors
   - All course elements (card border, icon tint, grade number, syllabus progress bar) update immediately on color change via `handleRecolor` → `useCourseStore.upsert()`

3. **Schedule View Glass Polish** (`src/components/views/ScheduleView.tsx`)
   - Month/Week/Day views: translucent glass backgrounds (`bg-neutral-900/60 backdrop-blur-md`)
   - Refined borders: `border-neutral-800/80 rounded-2xl` for container cards
   - Event cards: vertical accent border-left (`border-l-[3px] border-l-primary`) matching session type
   - Session type pills: `rounded-full px-2.5 py-0.5 text-xs font-medium` with accent-tinted backgrounds
   - Modals: `bg-neutral-900/80 backdrop-blur-md` glass backgrounds

4. **Tasks Kanban Polish** (`src/components/views/TasksView.tsx`)
   - Column containers: `bg-neutral-900/40 border-neutral-800/60 rounded-2xl p-4`
   - Task cards: `border-neutral-800/60 bg-neutral-900/40` with smooth hover → `hover:bg-neutral-900/60 hover:border-neutral-700/80`
   - Priority badges: pill style `rounded-full px-2.5 py-0.5 text-xs font-medium` (URGENT/HIGH/MEDIUM)
   - Subtask progress bar: `bg-neutral-800/60` track background
   - Separator lines: `border-neutral-800/60`

**VALIDATION**: 320/320 tests · `tsc --noEmit` clean · ESLint 0 errors · `vite build` passes

---

### UI REFINEMENT: Schedule, Tasks, Courses Views — 2026-09-08T12:36

**STATUS**: ✅ COMPLETE

**DELIVERABLES**:
1. **TasksView → Kanban Board** (`src/components/views/TasksView.tsx`)
   - 3-column layout: TODO → IN PROGRESS → DONE
   - Task cards show priority badges (High/Medium/Low), due date with overdue indicator, subtask progress bars
   - Quick action buttons: Start, Done, Reopen, Edit, Delete
   - Full CRUD modals: CreateTaskModal, EditTaskModal, DeleteTaskModal
   - Filters retained: status filter, priority filter, course filter, count badges

2. **ScheduleView → Inline CRUD + Accent Colors** (`src/components/views/ScheduleView.tsx`)
   - "Add Event" button opens EventModal for creating new CalendarEvents
   - Hover-reveal Edit/Delete buttons on every EventCard in Day/Week/Month views
   - Accent color selector (Blue/Teal/Purple) in the create/edit modal
   - Day/Week/Month views all support inline CRUD
   - Event creation persists through `useScheduleStore.upsert()`

3. **CoursesView → Interactive Detail Modal** (`src/components/views/CoursesView.tsx`)
   - Clicking any course card opens CourseDetailModal
   - Detail modal shows: Professor, Location, Syllabus Progress bar
   - Filtered pending Tasks for the course (from `useTaskStore`)
   - Filtered Exams/Assessments for the course (from `useExamStore`)
   - Filtered Notes (search by course code)
   - Filtered Resources for the course (from `useResourceStore`)
   - Quick-action buttons: "Add Task" → creates a task bound to the course
   - DeleteCourseModal now shows full cascade prediction (tasks + exams + grades)

**VALIDATION**: 320/320 tests pass · `tsc --noEmit` clean · ESLint 0 errors · `vite build` passes

---

### MISSION #006: Task Vertical Slice — Task Engine & UI Store Wiring

**OBJECTIVE**:
Build `taskEngine.ts` and wire `TasksView.tsx` directly to `useTaskStore` and `ITaskRepository` for real local-first persistence.

**ENGINE SPEC (`src/core/engines/taskEngine.ts`)**:
- `isOverdue(task: Task, currentDate: Date): boolean`: Returns true if `task.deadline < currentDate` and status is not `COMPLETED` or `ARCHIVED`.
- `calculateSubtaskProgress(subtasks: Subtask[]): number`: Calculates exact percentage ($0 - 100$) of completed subtasks.
- `deriveTaskStatus(subtasks: Subtask[], currentStatus: TaskStatus): TaskStatus`: Auto-promotes status from `TODO` to `IN_PROGRESS` if $\ge 1$ subtask is completed.
- `sortTasks(tasks: Task[]): Task[]`: Sorts by priority (`URGENT` > `HIGH` > `MEDIUM` > `LOW`), then by deadline ascending.

**STORE & UI WIRING**:
- Connect `TasksView.tsx` to `useTaskStore`.
- Implement full CRUD: Create task, edit title/deadline/priority, toggle subtasks, change status, delete task.
- Filter views: All, Today, Upcoming, Overdue, By Course.

**TESTING (`src/core/engines/taskEngine.test.ts`)**:
- Test overdue math across timezone boundaries.
- Test subtask progress percentage calculations ($0\%$, $50\%$, $100\%$, empty array).
- Test priority and deadline sorting algorithm.

---

### MISSION #007: Schedule Engine & Recurrence System

**OBJECTIVE**:
Build `scheduleEngine.ts` to handle daily/weekly class recurrence, time-slot collision detection, and free time calculations.

**ENGINE SPEC (`src/core/engines/scheduleEngine.ts`)**:
- `generateOccurrences(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): EventInstance[]`: Expands recurring rules (`WEEKLY`, `BIWEEKLY`) into concrete instances.
- `detectCollisions(events: EventInstance[]): CollisionReport[]`: Identifies overlapping time slots ($\text{Start}_A < \text{End}_B \land \text{End}_A > \text{Start}_B$) and returns conflicting event IDs.
- `calculateFreeGaps(events: EventInstance[], dayStart: string, dayEnd: string): TimeSlot[]`: Returns open study windows between classes.

**STORE & UI WIRING**:
- Connect `ScheduleView.tsx` to `useScheduleStore`.
- Render day/week view with collision indicators.
- Enable CRUD for classes, study sessions, and exams.

**TESTING (`src/core/engines/scheduleEngine.test.ts`)**:
- Test weekly and biweekly recurrence expansion across month boundaries.
- Test edge cases for collision detection (exact end/start time adjacency vs. true overlap).

---

### MISSION #008: Exams & Assessment Preparation Slice

**OBJECTIVE**:
Build `examEngine.ts` for assessment countdowns, weight distribution validation, and preparation readiness scoring.

**ENGINE SPEC (`src/core/engines/examEngine.ts`)**:
- `getDaysRemaining(examDate: Date, currentDate: Date): number`: Exact countdown calculation.
- `validateCourseWeights(exams: Exam[], newExamWeight: number): { valid: boolean; totalWeight: number }`: Ensures total course assessment weight does not exceed $100\%$.
- `calculateReadinessScore(linkedTasks: Task[], linkedSessions: StudySession[]): number`: Derives readiness score ($0 - 100\%$) based on completed preparation tasks and total focus hours logged.

**STORE & UI WIRING**:
- Connect `ExamsView.tsx` to `useExamStore`.
- Display exam countdown cards with linked tasks and resources.

**TESTING (`src/core/engines/examEngine.test.ts`)**:
- Test weight validator with valid ($80\% + 20\%$) and invalid ($80\% + 30\%$) inputs.
- Test readiness algorithm when linked tasks are empty or fully completed.

---

### MISSION #009: Grades Engine — High-Precision Academic Math & Simulations

**OBJECTIVE**:
Build deterministic, zero-rounding-error `gradeEngine.ts` for weighted GPA, ECTS progression, and target grade simulations.

**ENGINE SPEC (`src/core/engines/gradeEngine.ts`)**:
- `calculateWeightedGPA(courses: Course[], grades: Grade[]): number`:
  $$\text{GPA} = \frac{\sum (\text{Grade}_i \times \text{ECTS}_i)}{\sum \text{ECTS}_i}$$
- `classifyGrade(score: number): GradeClassification`:
  - $< 5.0 \rightarrow \text{Fail}$
  - $5.0 - 6.9 \rightarrow \text{Pass}$
  - $7.0 - 8.9 \rightarrow \text{Notable}$
  - $9.0 - 9.9 \rightarrow \text{Outstanding}$
  - $10.0 \rightarrow \text{Matrícula de Honor}$
- `simulateRequiredGrade(currentGrades: Grade[], remainingWeight: number, targetGPA: number): number`: Calculates exact grade required on remaining assessments to reach `targetGPA`.

**STORE & UI WIRING**:
- Connect `GradesView.tsx` to `useGradeStore`.
- Provide live target simulator input controls.

**TESTING (`src/core/engines/gradeEngine.test.ts`)**:
- 100% test coverage target.
- Test floating-point precision scenarios (e.g., $6.999$ classification, 0 ECTS courses).
- Test impossible target grade simulations (e.g., requiring $> 10.0$).

---

### MISSION #010: Database Seeder & Demo Hydration Engine

**OBJECTIVE**:
Build `seeder.ts` to hydrate IndexedDB with realistic student data upon request or clean boot.

**SPECIFICATION (`src/core/repositories/indexeddb/seeder.ts`)**:
- `seedDatabase(db: IDBDatabase): Promise<void>`:
  - Hydrates 1 active Semester ("Fall 2026").
  - 5 realistic Courses (e.g., Quantum Mechanics, Digital Design, Marketing, Software Architecture, Linear Algebra).
  - 15+ Tasks across courses with varied priorities and deadlines.
  - 5 Exams with weighted assessments.
  - Initial Grades, Notes, Resources, and Focus sessions.
- `clearDatabase(db: IDBDatabase): Promise<void>`: Wipes all object stores safely.

**TESTING**:
- Test `seedDatabase` on empty IndexedDB.
- Test `clearDatabase` reset flow.

---

### MISSION #011: Notes Slice — Engine & Store Wiring

**OBJECTIVE**:
Implement full-text searching, tag parsing, and course relationships in `noteEngine.ts`.

**ENGINE SPEC (`src/core/engines/noteEngine.ts`)**:
- `searchNotes(notes: Note[], query: string): Note[]`: Case-insensitive search across title, body content, and tags.
- `extractTags(markdownContent: string): string[]`: Parses `#tag` tokens out of markdown text.
- `filterNotesByCourse(notes: Note[], courseId: string): Note[]`.

**STORE & UI WIRING**:
- Connect `NotesView.tsx` to `useNoteStore`.
- Pin, archive, and course-associate notes with local IndexedDB sync.

**TESTING (`src/core/engines/noteEngine.test.ts`)**:
- Test tag extraction regex against complex markdown bodies.
- Test fuzzy search term matching.

---

### MISSION #012: Resources Slice — Engine & Metadata Store

**OBJECTIVE**:
Implement resource metadata categorization, URL validation, and course linking in `resourceEngine.ts`.

**ENGINE SPEC (`src/core/engines/resourceEngine.ts`)**:
- `categorizeResourceType(urlOrPath: string): ResourceType`: Detects PDF, Link, Document, Video, or Image.
- `filterResources(resources: Resource[], courseId?: string, type?: ResourceType): Resource[]`.

**STORE & UI WIRING**:
- Connect `ResourcesView.tsx` to `useResourceStore`.
- Add, tag, and view attachments locally.

**TESTING (`src/core/engines/resourceEngine.test.ts`)**:
- Test file type detection against various file extensions and URLs.

---

### MISSION #013: Focus & Pomodoro Engine

**OBJECTIVE**:
Build study session calculations, course time distribution, and session history aggregation in `focusEngine.ts`.

**ENGINE SPEC (`src/core/engines/focusEngine.ts`)**:
- `calculateTotalFocusTime(sessions: StudySession[], period: 'today' | 'week' | 'month'): number`: Total minutes focused.
- `calculateFocusByCourse(sessions: StudySession[]): Record<string, number>`: Focus time breakdown indexed by course ID.
- `getRecommendedBreak(focusDurationMinutes: number): number`: Calculates rest period (e.g., 25m $\rightarrow$ 5m, 50m $\rightarrow$ 10m).

**STORE & UI WIRING**:
- Connect `FocusView.tsx` to `useFocusStore`.
- Persist completed study sessions to IndexedDB.

**TESTING (`src/core/engines/focusEngine.test.ts`)**:
- Test session time aggregation across date ranges.

---

### MISSION #014: Goals & Habits Engine

**OBJECTIVE**:
Implement daily habit streak calculation and goal progress tracking in `habitEngine.ts`.

**ENGINE SPEC (`src/core/engines/habitEngine.ts`)**:
- `calculateStreak(completionHistory: string[], currentDate: Date): number`: Calculates consecutive days completed.
- `calculateGoalProgress(currentValue: number, targetValue: number): number`: Returns completion percentage ($0 - 100\%$).

**STORE & UI WIRING**:
- Connect `GoalsView.tsx` and `HabitsView.tsx` to their respective stores.
- Toggle habit completions and update streaks live.

**TESTING (`src/core/engines/habitEngine.test.ts`)**:
- Test streak resets when a day is skipped.
- Test streak continuation when toggled for current day.

---

### MISSION #015: Personalized Onboarding Flow Engine

**OBJECTIVE**:
Build multi-step onboarding validation and profile initialization state engine in `onboardingEngine.ts`.

**ENGINE SPEC (`src/core/engines/onboardingEngine.ts`)**:
- `validateProfileStep(step: number, payload: Partial<Profile>): { valid: boolean; errors: string[] }`.
- `completeOnboarding(profile: Profile): Promise<void>`: Persists profile and sets `onboarding_completed: true` in settings store.

**STORE & UI WIRING**:
- Connect onboarding view flow.
- Ensure route redirection checks `onboarding_completed`.

**TESTING (`src/core/engines/onboardingEngine.test.ts`)**:
- Test step-by-step schema validation.