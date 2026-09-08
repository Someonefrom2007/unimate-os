Please execute Missions M016 through M020 to wire up the System Intelligence engines and connect all Dashboard interactive triggers across the OS.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. Maintain strict domain-layer separation (`src/core/engines/`). Pure analytics calculations must live in isolated functions.
2. All existing tests MUST continue passing (`npm test`). Add unit tests for each new engine.
3. Strict 100% TypeScript type safety (`npx tsc --noEmit`).

### SCOPE OF WORK:

1. **Mission #016: WorkloadEngine & WorkloadView (`src/core/engines/workloadEngine.ts`)**:
   - Build pure functions to compute weekly cognitive load distribution, daily study pressure scores, and academic overload warnings from tasks/schedule/exams.
   - Wire the "WORKLOAD THIS WEEK" dashboard widget and `WorkloadView.tsx` to display dynamic study hours and peak workload alerts.

2. **Mission #017: InsightsEngine & InsightsView (`src/core/engines/insightsEngine.ts`)**:
   - Build domain logic to calculate focus efficiency ratios, habit consistency scores, and academic velocity.
   - Wire `InsightsView.tsx` and the Dashboard "ACADEMIC SNAPSHOT" sparkline to reflect live historical performance.

3. **Mission #018: Global Command Palette (`Cmd+K`) (`src/core/engines/searchEngine.ts`)**:
   - Implement fuzzy multi-entity search across Courses, Tasks, Exams, Notes, and Resources.
   - Connect the central search pill (`Search anything... (⌘K)`) on the Dashboard and header to trigger a global command palette modal (`Cmd+K` keyboard shortcut listener).

4. **Mission #019: AI Assistant Context Engine (`src/core/engines/aiContextEngine.ts`)**:
   - Build pure domain formatters that serialize current student state (Average Grade, upcoming exams, overdue tasks, weekly workload) into structured markdown context.
   - Connect the Dashboard "AI Assistant" card ("Ask Assistant" button) to navigate to `AiAssistantView.tsx` pre-loaded with active context.

5. **Mission #020: Full Dashboard Navigation Wiring**:
   - Wire all "View details", "View full schedule", "View all deadlines", and "Your Courses" cards on the Dashboard so clicking them invokes `onNavigate` to instantly switch to the relevant view.

Upon completion, run `npm test` and `npx tsc --noEmit` to verify 0 regressions.