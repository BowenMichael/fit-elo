export type WorkoutMetric = 'miles' | 'km' | 'minutes' | 'seconds' | 'reps' | 'sets' | 'lbs' | 'kg';

export type WorkoutStatus = 'PENDING' | 'IN_GRACE' | 'COMPLETED' | 'DOWNGRADED';

export type WorkoutCategory = 'running' | 'strength' | 'hiit' | 'general' | 'recovery' | 'race';

export type GoalScheduleMode = 'weekly' | 'custom_queue';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface GoalExerciseTemplate {
  id: string;
  title: string;
  category: WorkoutCategory;
  metric: WorkoutMetric;
  baseTargetValue: number;
  daysFromPrevious: number; // 0 for same-day workout, 1-3 for days after prior
  dayOfWeek?: DayOfWeek;    // Specific day of the week for weekly mode (Mon..Sun)
  notes?: string;
}

export interface FitnessGoal {
  id: string;
  title: string;
  description: string;
  category: WorkoutCategory;
  targetMetric: WorkoutMetric;
  targetValue: number;          // Pinnacle target e.g. 315 lbs, 6.21 miles, or 13.1 miles
  targetElo: number;            // App-determined Target MMR (e.g. 1610 for 315 lb bench, 1471 for 10K)
  totalWeeks: number;           // Total duration in weeks (e.g. 4, 6, 8, 12)
  weeklySessionsTarget: number; // e.g. 4 sessions/week
  weeklyVolumeTarget: number;   // e.g. 12.0 miles/week or 2400 lbs total working volume
  progressiveOverloadRate?: number; // Custom week-over-week % increase (e.g. 0.05 for +5%/wk)
  customWeeklyOverloads?: number[]; // Optional per-step week-over-week % increases [0.05, 0.08, 0.10]
  scheduleMode?: GoalScheduleMode;  // 'weekly' (Mon-Sun schedule) vs 'custom_queue' (relative gaps)
  exerciseTemplates?: GoalExerciseTemplate[];
  createdAt: string;            // ISO date
  targetDate?: string;          // Target completion date (e.g. "2026-10-01")
  isCompleted: boolean;
}

export interface WeeklyGoalProgress {
  currentWeekNumber: number;
  totalWeeks: number;
  completedSessionsThisWeek: number;
  targetSessionsThisWeek: number;
  completedVolumeThisWeek: number;
  targetVolumeThisWeek: number;
  weekStatus: 'ON_TRACK' | 'BEHIND' | 'COMPLETED';
}

export interface WorkoutItem {
  id: string;
  title: string;
  metric: WorkoutMetric;
  targetValue: number;
  daysOffset: number;          // 0 = Today (Due now), 2 = In 2 days, etc. (Can have multiple workouts on same day!)
  daysFromPrevious: number;    // Relative gap in days from the previous workout session (e.g. 2, or 0 for same-day)
  dayOfWeek?: DayOfWeek;       // Day of the week in weekly schedule (Mon..Sun)
  targetDate?: string;         // Formatted scheduled target date string (e.g. "2026-09-02")
  difficultyElo: number;
  status: WorkoutStatus;
  graceDaysElapsed: number;    // 0, 1, 2, 3...
  notes?: string;
  originalTargetValue?: number;
  category?: WorkoutCategory;
  weekNumber?: number;         // Training block week (1, 2, 3, 4...)
  sessionNumber?: number;      // Session within week (1, 2, 3, 4...)
  goalId?: string;             // Associated goal ID
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
  weekNumber?: number;
  goalId?: string;
  notes?: string;
}

export interface UserFitnessProfile {
  eloRating: number;             // Default: 1150 (Silver II)
  currentStreak: number;         // e.g. 4
  bestStreak: number;            // e.g. 7
  gracePeriodDays: number;       // Default: 3 (1-7 days)
  preferredWorkoutTime: string;  // "07:00" (HH:mm)
  notifyLeadTime: number;        // Lead hours before workout: 0 = off, 0.5 = 30m, 1 = 1h, 2 = 2h, 3 = 3h, 6 = 6h, 12 = 12h
  notifyOneHourBefore: boolean;  // Backward compatibility flag
  activeMetric: WorkoutMetric;   // Default: 'miles'
  totalWorkoutsCompleted: number;
  totalMilesLogged: number;
  streakProtectedInGrace: boolean;
}

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Apex Legend';

export interface RankTierInfo {
  tier: RankTier;
  division: 'III' | 'II' | 'I' | '';
  name: string; // e.g. "Silver II" or "Apex Legend"
  minElo: number;
  maxElo: number;
  color: string;
  badgeBg: string;
  icon: string;
  progressPercent: number; // 0 to 100 within current tier
}

export type NotificationType = 'reminder' | 'grace_warning' | 'grace_expired' | 'streak_milestone' | 'rank_up';

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}
