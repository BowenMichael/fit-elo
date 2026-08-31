# 🏃 Adaptive Workout & Streak Tracker — Architecture & Plan Document

## 1. Vision & Core Value Proposition

This application is an adaptive workout and streak tracking system engineered for mobile (iOS / iPhone) and web. It helps athletes and runners build and sustain habits through three interconnected pillars:

1. **Fitness ELO Rating System (MMR)**: Workouts and athletes are assigned dynamic ratings. Performance, completion accuracy, and Rate of Perceived Exertion (RPE 1–10) adjust your rating up or down.
2. **Relative Day Sequence Queue (`daysFromToday`)**: Workouts are not anchored to rigid dates; they exist in a relative sequence (`daysOffset: 0` = Today, `daysOffset: 2` = In 2 days). Completing today's session advances the entire sequence by losing a relative day.
3. **Smart Rolling Grace Period (Default: 3 Days)**: If a workout is missed, it holds at `daysOffset: 0` with escalating 1-hour pre-workout reminders while protecting the active streak. If the grace period expires (past Day 3), the workout automatically downgrades by 25–30% to an easier baseline recovery run, user ELO drops, and future workouts scale down to prevent overtraining and injury.

---

## 2. Core Mathematical & Sequencing Systems

### A. Fitness ELO / MMR Math Engine

The ELO model calculates expected vs actual performance:

- **Workout Difficulty Target ($R_w$)**: Dynamically computed from target metric value and user baseline:
  - Running Miles: Baseline 2.5 mi = 1100 ELO; 6.21 mi (10K) = ~1470 ELO.
  - Minutes / Duration: 25 mins = 1100 ELO; 60 mins = 1350 ELO.
  - Repetitions: 50 reps = 1100 ELO; 100 reps = 1300 ELO.

- **Expected Performance ($E$)**:
  $$E = \frac{1}{1 + 10^{(R_w - R_u) / 400}}$$

- **Actual Score ($S \in [0.0, 1.3]$)**:
  - **Completion Ratio ($PR$)**: $\text{actualValue} / \text{targetValue}$
  - If $PR \ge 1.0$: $S = 1.0 + \min(0.25, (PR - 1.0) \times 0.5)$
  - If $PR < 1.0$: $S = \max(0.1, PR \times 0.85)$
  - **RPE Exertion Modifier**:
    - RPE 1–4 (Effortless aerobic): $+0.15$
    - RPE 5–6 (Moderate solid): $+0.08$
    - RPE 7–8 (Hard / Lactate threshold): $+0.00$
    - RPE 9–10 (Maximum exhaustion): $-0.10$
  - **Grace Period Decay**: $-0.03$ per elapsed grace day.
  - **Uncompleted Grace Expiration**: $S = 0.0$

- **Rating Delta**:
  $$\Delta R = K \cdot (S - E), \quad K = 32$$

- **Rank Tiers**:
  - 🥉 **Bronze (800–1099)**: Divisions III, II, I
  - 🥈 **Silver (1100–1299)**: Divisions III, II, I (Starting Tier)
  - 🥇 **Gold (1300–1499)**: Divisions III, II, I
  - 💎 **Platinum (1500–1699)**: Divisions III, II, I
  - 🔮 **Diamond (1700–1899)**: Divisions III, II, I
  - 👑 **Apex Legend (1900+)**

---

### B. Relative Day Sequence Queue Engine

Workouts are stored as relative day offsets:
```
Queue:
[0] "Baseline Calibration Run" (2.5 mi) -> daysOffset: 0 (TODAY)
[1] "Pacing & Rhythm Run"       (2.3 mi) -> daysOffset: 2 (IN 2 DAYS)
[2] "Active Recovery Jog"       (2.0 mi) -> daysOffset: 4 (IN 4 DAYS)
[3] "Week 1 Long Run"           (3.1 mi) -> daysOffset: 6 (IN 6 DAYS)
```

**Lifecycle Rules**:
1. **On Completion of Workout [0]**:
   - Workout [0] is archived into `CompletedWorkoutRecord` history with actual performance, duration, RPE, and ELO delta.
   - All remaining workouts shift: `[1]` becomes `daysOffset: 0` (Today), `[2]` becomes `daysOffset: 2`, etc.
   - User streak increments (+1).
   - If user performed with ease (RPE $\le$ 5 and met target), future targets scale up (+5%).

2. **On Day Advancement (Missed Workout)**:
   - Workout [0] remains at `daysOffset: 0`, and enters `graceDaysElapsed: 1` (`IN_GRACE`).
   - Upcoming workouts remain pushed back.
   - Streak remains **Protected in Grace**.
   - Push reminder triggers for the next day.

3. **On Grace Expiration (Missed past Day 3)**:
   - Status switches to `DOWNGRADED`.
   - Target metric is scaled down by 25–30% (e.g. 2.5 mi $\to$ 1.9 mi recovery run).
   - User ELO receives a penalty.
   - Future queued workouts scale down by 10% to prevent overtraining.
   - Streak resets to 0.

---

### C. 10K Progressive Overload Preset Generator

Generates a 4-week ramp from a 2.5-mile baseline to a 6.21-mile (10K) race goal with 3–4 sessions per week:

| Week | Focus | Session 1 | Session 2 (Speed/Tempo) | Session 3 (Recovery) | Session 4 (Long Run) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Week 1** | Baseline Calibration | 2.5 mi (Easy) | 2.3 mi (Intervals) | 2.0 mi (Recovery) | 3.1 mi (Long Run) |
| **Week 2** | Volume Step-Up | 2.8 mi (Easy) | 2.6 mi (Tempo) | 2.2 mi (Recovery) | 4.1 mi (Long Run) |
| **Week 3** | Peak Endurance | 3.1 mi (Easy) | 3.0 mi (Intervals) | 2.4 mi (Recovery) | 5.2 mi (Peak Long Run) |
| **Week 4** | Taper & Race Event | 2.5 mi (Shakeout) | 2.0 mi (Strides) | 1.6 mi (Recovery) | **6.21 mi (10K GOAL RUN!)** |

---

## 3. Data Schema Definitions

```typescript
export type WorkoutMetric = 'miles' | 'km' | 'minutes' | 'seconds' | 'reps' | 'sets';
export type WorkoutStatus = 'PENDING' | 'IN_GRACE' | 'COMPLETED' | 'DOWNGRADED';

export interface WorkoutItem {
  id: string;
  title: string;
  metric: WorkoutMetric;
  targetValue: number;
  daysOffset: number; // 0 = Today (Due now), 2 = in 2 days, etc.
  difficultyElo: number;
  status: WorkoutStatus;
  graceDaysElapsed: number; // 0, 1, 2, 3...
  notes?: string;
  originalTargetValue?: number;
  category?: 'running' | 'strength' | 'hiit' | 'general';
}

export interface CompletedWorkoutRecord {
  id: string;
  workoutId: string;
  title: string;
  metric: WorkoutMetric;
  targetValue: number;
  actualValue: number;
  durationMinutes: number;
  rpe: number; // 1 to 10
  eloDelta: number;
  userEloAfter: number;
  completedAt: string; // ISO timestamp
  savedStreakInGrace: boolean;
  graceDaysElapsedAtCompletion: number;
}

export interface UserFitnessProfile {
  eloRating: number;             // Default: 1150 (Silver II)
  currentStreak: number;         // e.g. 4
  bestStreak: number;            // e.g. 7
  gracePeriodDays: number;       // Default: 3 (1-7 days)
  preferredWorkoutTime: string;  // "07:00" (HH:mm)
  notifyOneHourBefore: boolean;  // Default: true
  activeMetric: WorkoutMetric;   // Default: 'miles'
  totalWorkoutsCompleted: number;
  totalMilesLogged: number;
}
```

---

## 4. Directory Structure

```
├── docs/
│   └── ADAPTIVE_WORKOUT_PLAN.md  # Comprehensive architecture & plan specification
├── src/
│   ├── domain/
│   │   ├── types.ts              # Universal TypeScript data interfaces
│   │   ├── eloEngine.ts          # ELO MMR math, RPE modifiers, rank tiers
│   │   ├── sequenceManager.ts    # Relative days queue, shift, grace roll, downgrade
│   │   ├── planGenerator.ts      # 10K progressive overload preset builder
│   │   ├── notificationEngine.ts # 1-hour pre-workout alerts & grace warnings
│   │   └── __tests__/            # Automated Jest unit test suite
│   ├── store/
│   │   ├── useWorkoutStore.ts    # Persistent Zustand store with AsyncStorage
│   │   └── __tests__/            # Store lifecycle test suite
│   ├── components/
│   │   ├── AppIcons.tsx          # Custom SVG icons (Flame, Trophy, Calendar, etc.)
│   │   ├── WorkoutCard.tsx       # iOS workout card with status & grace pill
│   │   ├── WorkoutLoggerModal.tsx# iOS completion sheet with RPE slider & ELO preview
│   │   ├── AddWorkoutModal.tsx   # Custom workout creator / editor sheet
│   │   ├── NotificationSimulator.tsx # iOS drop-down banner simulator
│   │   └── TabBar.tsx            # iOS glassmorphic bottom navigation tab bar
│   ├── screens/
│   │   ├── DashboardScreen.tsx   # Streak flame, ELO rank, Due workout, Day Simulator
│   │   ├── WorkoutQueueScreen.tsx# Sequence manager & 10K preset generator
│   │   ├── HistoryScreen.tsx     # Completed activity logs with ELO deltas
│   │   └── SettingsScreen.tsx    # Grace period (1-7d), preferred time, default metric
│   └── navigation/
│       └── AppNavigator.tsx      # Tab router & global notification simulator
├── App.tsx                       # Root container with dark theme & status bar
└── CHANGELOG.md                  # Release notes & launch instructions
```

---

## 5. Development & Launch Commands

```bash
# Launch as Web App in browser (http://localhost:8081)
npm run web

# Launch Metro interactive terminal (w: Web, i: iOS, a: Android)
npm start

# Run all unit tests
npx jest --testPathPattern=domain|store
```
