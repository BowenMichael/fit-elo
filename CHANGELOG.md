# 📝 Adaptive Workout & Streak Tracker — Changelog

## [1.0.0] - Adaptive Running, Dynamic ELO, and Relative Sequence Engine

### 🌟 Features Implemented

1. **Flexible Universal Metric Model**:
   - Universal workout structure allowing user-defined workouts with custom metrics (`miles`, `km`, `minutes`, `seconds`, `reps`, `sets`).
   - Add, edit, reorder, or delete custom workouts in the queue.

2. **Sequential Relative Day Offsets (`daysFromToday`)**:
   - Workouts are organized as relative day offsets (`daysOffset: 0` = Today / Due Now, `daysOffset: 2` = In 2 days, etc.) rather than rigid timestamps.
   - Completing today's workout archives the session and shifts all subsequent workouts in the sequence forward by losing a relative day.

3. **Smart Rolling Grace Period & Downgrade Engine (Default: 3 Days)**:
   - If today's workout is missed, it enters Grace Mode (`graceDaysElapsed: 1, 2, 3...`) holding the front of the queue (`daysOffset: 0`).
   - Upcoming workouts remain pushed back proportionally, and your streak remains protected.
   - If the grace period expires (past Day 3), the workout target is automatically downgraded by 25–30% to an easier baseline, user ELO drops, and subsequent workouts scale down safely.

4. **Fitness ELO (MMR) Rating System**:
   - Mathematical rating algorithm with dynamic difficulty ratings per workout.
   - Performance calculated using actual value vs target and subjective RPE (Rate of Perceived Exertion 1–10).
   - Gamified rank tiers: Bronze, Silver, Gold, Platinum, Diamond, and Apex Legend with animated progress bars.

5. **10K Progressive Overload Preset Generator**:
   - Auto-generates a 4-week training plan ramping from a 2.5-mile baseline to a 6.21-mile (10K) race goal with 3–4 sessions per week.

6. **1-Hour Pre-Workout Push Alerts & Simulator**:
   - Schedules reminders 1 hour before your preferred workout time.
   - Escalating reminder notifications during active grace periods ("Grace Day 1/3", "Final Day of Grace").
   - Integrated iOS-style drop-down notification banner simulator with tap-to-dismiss.

7. **iPhone / iOS Native UI & Haptics**:
   - High-contrast dark cyber-athletic theme (`#0E1015`, `#161822`).
   - Haptic engine (`expo-haptics`) integration across buttons, completion modals, day advances, and grace warnings.
   - iOS presentation bottom sheets with drag handles.
   - Built-in Day Sequence Simulator on the Dashboard to test day transitions, grace rolls, and downgrades live.

---

## 🚀 How to Launch as a Web App

```bash
npm run web
```
This launches Metro with the Web target and opens the application at `http://localhost:8081`.

---

## 🧪 Running Automated Unit Tests

```bash
npx jest --testPathPattern=domain|store
```
