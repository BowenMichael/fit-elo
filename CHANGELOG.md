# 📝 FitElo — Changelog

## [0.1.0] — 2026-08-31 (Beta: Foundation & Goal Architecture)

### ✨ New Features

1. **Goal Creation Wizard (3-Step)**:
   - Step 1: Objective — name, category, target metric (miles / km / minutes / **lbs / kg**), pinnacle target value, total weeks, app-determined Target MMR.
   - Step 2: Weekly Schedule — dual-mode Mon–Sun horizontal slider **with task count badges** and dedicated daily task section; or Custom Queue with sequential gap chains.
   - Step 3: Week-Over-Week Overload Rate — preset ramps (0%, +5%, +8%, +10%), custom uniform %, or variable per-week % transitions (W1→W2, W2→W3, etc.).
   - Add Task form appears **above** the task list for immediate visibility.

2. **Goal Editing**:
   - ✏️ Edit button on both the Active Goal hero card and every Goal Blueprint card.
   - Wizard re-opens pre-filled with all existing goal data.
   - Saving updates the goal in-place and regenerates the active task queue if editing the current goal.

3. **Strength / Gym Weight Goals**:
   - New `lbs` and `kg` workout metrics support targeting a specific lift weight (e.g. "315 lbs Bench Press").
   - The ELO engine and queue generator handle weight-based metrics correctly.

4. **Week-Over-Week Overload Engine** ([`goalEngine.ts`](src/domain/goalEngine.ts)):
   - `calculateWeekMultiplier(week, rate, variableRates?)` — compounds WoW % increases correctly.
   - **Custom uniform** mode: single % applied consistently every week.
   - **Variable step** mode: define distinct % increases per weekly transition.
   - Live overload matrix preview shows actual session targets and WoW delta badges per week.

5. **Horizontal Mon–Sun Day Slider with Task Count Badges**:
   - Each day pill shows a live badge with the count of scheduled sessions (0 = rest, 1, 2, etc.).
   - Tapping a day shows a dedicated task section below with full task cards, target metrics, notes, and delete buttons.

6. **5-Tab Navigation**:
   - Dashboard · Goals · Queue · History · Settings tabs in the bottom navigation bar.

7. **App-Determined Goal MMR**:
   - MMR is automatically calculated from pinnacle target + weekly volume (no user input needed).
   - Displayed live in the wizard as you adjust target values.

8. **Traditional / Classic Themes**:
   - Dark (Classic Athletic), Light (Classic Sport), Alternative (Varsity Track) — all premium quality.

9. **Integrated Notification Settings**:
   - Lead-time selector (Off, 30m, 1h, 2h, 3h, 6h, 12h) in Settings; no separate modal needed.

10. **ELO Comeback & Logarithmic Diminishing Returns**:
    - Large comeback swings when significantly behind daily targets.
    - Logarithmic returns as performance exceeds the adjusted goal (disincentivizing reckless overexertion).

### 🧱 Architecture

- [`src/domain/types.ts`](src/domain/types.ts) — `WorkoutMetric` now includes `lbs` and `kg`; `FitnessGoal` has `customWeeklyOverloads?: number[]`.
- [`src/domain/goalEngine.ts`](src/domain/goalEngine.ts) — `calculateGoalTargetElo`, `calculateWeekMultiplier`, `generateQueueForGoal`, `calculateWeeklyGoalProgress`.
- [`src/store/useWorkoutStore.ts`](src/store/useWorkoutStore.ts) — `createCustomGoal`, `updateGoal`, `deleteGoal`, `setActiveGoal`.
- [`src/components/GoalWizardModal.tsx`](src/components/GoalWizardModal.tsx) — 3-step wizard with edit mode, 5 metrics, variable WoW overloads.
- [`src/screens/GoalsScreen.tsx`](src/screens/GoalsScreen.tsx) — hero card, edit buttons, blueprints list from `savedGoals`.

### 🧪 Tests
- 6 Jest test suites, 32 tests passing.
- TypeScript `tsc --noEmit` passes with 0 errors.

---

## [Legacy] — [1.0.0] — Adaptive Running, Dynamic ELO, and Relative Sequence Engine

1. **Flexible Universal Metric Model**: `miles`, `km`, `minutes`, `seconds`, `reps`, `sets`.
2. **Sequential Relative Day Offsets** (`daysFromToday`).
3. **Smart Rolling Grace Period & Downgrade Engine** (Default: 3 Days).
4. **Fitness ELO (MMR) Rating System** with Bronze → Apex Legend tiers.
5. **10K Progressive Overload Preset Generator**.
6. **1-Hour Pre-Workout Push Alerts & Simulator**.
7. **iPhone / iOS Native UI & Haptics**.

---

## 🚀 Running Locally

```bash
npm run web
```

Launches Metro at `http://localhost:8081`.

## 🍎 Building for TestFlight

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Configure your project (first time)
eas build:configure

# Submit an iOS build for TestFlight
eas build --platform ios --profile production
```

Then submit via `eas submit --platform ios` or upload the `.ipa` in App Store Connect.

## 🧪 Automated Tests

```bash
npm test
```
