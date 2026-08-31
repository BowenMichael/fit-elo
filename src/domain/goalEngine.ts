import { calculateWorkoutDifficulty } from './eloEngine';
import { formatDateOffset, generate10KPlan } from './planGenerator';
import {
  CompletedWorkoutRecord,
  DayOfWeek,
  FitnessGoal,
  GoalExerciseTemplate,
  WeeklyGoalProgress,
  WorkoutItem,
  WorkoutMetric
} from './types';

export const DAYS_OF_WEEK_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6
};

/**
 * Automatically calculates the App-Determined Target MMR for a goal based on
 * its pinnacle target value, metric, and weekly training volume.
 */
export function calculateGoalTargetElo(
  metric: WorkoutMetric,
  pinnacleValue: number,
  weeklyVolume: number
): number {
  if (pinnacleValue <= 0) return 1150;

  // Base difficulty from the pinnacle single-session target
  const pinnacleDifficulty = calculateWorkoutDifficulty(metric, pinnacleValue);

  // Volume factor contribution: reward higher sustained weekly capacity
  let volumeBonus = 0;
  if (metric === 'miles') {
    volumeBonus = Math.min(350, Math.max(0, (weeklyVolume - 5) * 14));
  } else if (metric === 'km') {
    volumeBonus = Math.min(350, Math.max(0, (weeklyVolume - 8) * 8.7));
  } else if (metric === 'minutes') {
    volumeBonus = Math.min(350, Math.max(0, (weeklyVolume - 40) * 2.0));
  }

  const finalElo = Math.round(pinnacleDifficulty * 0.70 + (1150 + volumeBonus) * 0.30);
  return Math.max(900, Math.min(2400, finalElo));
}

/**
 * Computes the cumulative week multiplier based on week-over-week % increases.
 */
export function calculateWeekMultiplier(
  weekNumber: number,
  overloadRate: number = 0.05,
  customWeeklyOverloads?: number[]
): number {
  if (weekNumber <= 1) return 1.0;

  if (customWeeklyOverloads && customWeeklyOverloads.length > 0) {
    let multiplier = 1.0;
    for (let w = 1; w < weekNumber; w++) {
      const stepRate = customWeeklyOverloads[w - 1] ?? overloadRate;
      multiplier *= (1.0 + stepRate);
    }
    return multiplier;
  }

  return 1.0 + (weekNumber - 1) * overloadRate;
}

export const DEFAULT_10K_EXERCISES: GoalExerciseTemplate[] = [
  {
    id: 'ex-10k-1',
    title: 'Aerobic Base Calibration Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.5,
    daysFromPrevious: 0,
    dayOfWeek: 'Mon',
    notes: 'Comfortable Zone 2 aerobic pace. Establish breathing rhythm.'
  },
  {
    id: 'ex-10k-2',
    title: 'Interval Cadence & Speed Repeats',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.3,
    daysFromPrevious: 2,
    dayOfWeek: 'Wed',
    notes: 'Snappy cadence repeats with 90s recovery intervals.'
  },
  {
    id: 'ex-10k-3',
    title: 'Active Aerobic Shakeout',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 2.0,
    daysFromPrevious: 2,
    dayOfWeek: 'Fri',
    notes: 'Gentle recovery jog to promote muscle elasticity.'
  },
  {
    id: 'ex-10k-4',
    title: 'Long Endurance Volume Anchor',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 3.2,
    daysFromPrevious: 1,
    dayOfWeek: 'Sat',
    notes: 'Sustained endurance builder at steady tempo.'
  }
];

export const DEFAULT_5K_EXERCISES: GoalExerciseTemplate[] = [
  {
    id: 'ex-5k-1',
    title: '5K Threshold Progression',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.0,
    daysFromPrevious: 0,
    dayOfWeek: 'Tue',
    notes: 'Progression run finishing at goal 5K pace.'
  },
  {
    id: 'ex-5k-2',
    title: 'Lactate Speed Repeats',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.2,
    daysFromPrevious: 2,
    dayOfWeek: 'Thu',
    notes: '400m / 800m repeats with active recovery.'
  },
  {
    id: 'ex-5k-3',
    title: 'Weekend 5K Endurance Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.8,
    daysFromPrevious: 2,
    dayOfWeek: 'Sat',
    notes: 'Comfortable aerobic distance over goal target.'
  }
];

export const DEFAULT_HALF_MARATHON_EXERCISES: GoalExerciseTemplate[] = [
  {
    id: 'ex-hm-1',
    title: 'Aerobic Base Step-Up',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 4.0,
    daysFromPrevious: 0,
    dayOfWeek: 'Mon',
    notes: 'Steady Zone 2 aerobic pacing.'
  },
  {
    id: 'ex-hm-2',
    title: 'Half-Marathon Tempo Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 4.5,
    daysFromPrevious: 2,
    dayOfWeek: 'Wed',
    notes: 'Sustained tempo at lactate threshold.'
  },
  {
    id: 'ex-hm-3',
    title: 'Flush & Recovery Jog',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 3.0,
    daysFromPrevious: 2,
    dayOfWeek: 'Fri',
    notes: 'Easy shakeout run.'
  },
  {
    id: 'ex-hm-4',
    title: 'Long Endurance Pyramid Anchor',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 6.5,
    daysFromPrevious: 1,
    dayOfWeek: 'Sat',
    notes: 'Progressive weekly long run anchor.'
  }
];

export const DEFAULT_HABIT_EXERCISES: GoalExerciseTemplate[] = [
  {
    id: 'ex-hab-1',
    title: 'Morning Easy Jog',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 1.8,
    daysFromPrevious: 0,
    dayOfWeek: 'Mon',
    notes: 'Start the week with an easy aerobic run.'
  },
  {
    id: 'ex-hab-2',
    title: 'Midweek Shakeout & Strides',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 1.5,
    daysFromPrevious: 2,
    dayOfWeek: 'Wed',
    notes: 'Gentle recovery with short light strides.'
  },
  {
    id: 'ex-hab-3',
    title: 'Weekend Habit Long Jog',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.2,
    daysFromPrevious: 3,
    dayOfWeek: 'Sat',
    notes: 'Enjoyable weekend endurance run.'
  }
];

export const CURATED_GOAL_BLUEPRINTS: FitnessGoal[] = [
  {
    id: 'goal-10k-race-mastery',
    title: '10K Race Benchmark',
    description: '4-Week progressive overload building aerobic endurance, lactate threshold, and a 6.21-mile race finish.',
    category: 'running',
    targetMetric: 'miles',
    targetValue: 6.21,
    targetElo: calculateGoalTargetElo('miles', 6.21, 13.5),
    totalWeeks: 4,
    weeklySessionsTarget: 4,
    weeklyVolumeTarget: 13.5,
    progressiveOverloadRate: 0.08,
    scheduleMode: 'weekly',
    exerciseTemplates: DEFAULT_10K_EXERCISES,
    createdAt: new Date().toISOString(),
    targetDate: '2026-09-28',
    isCompleted: false
  },
  {
    id: 'goal-5k-speed-mastery',
    title: '5K Speed & Threshold Mastery',
    description: '4-Week high-velocity pacing ramp focusing on VO2 max intervals and 3.1-mile race execution.',
    category: 'running',
    targetMetric: 'miles',
    targetValue: 3.1,
    targetElo: calculateGoalTargetElo('miles', 3.1, 9.0),
    totalWeeks: 4,
    weeklySessionsTarget: 3,
    weeklyVolumeTarget: 9.0,
    progressiveOverloadRate: 0.06,
    scheduleMode: 'weekly',
    exerciseTemplates: DEFAULT_5K_EXERCISES,
    createdAt: new Date().toISOString(),
    targetDate: '2026-09-28',
    isCompleted: false
  },
  {
    id: 'goal-half-marathon-base',
    title: 'Half Marathon Endurance Anchor',
    description: '8-Week volume pyramid culminating in a 13.1-mile long-distance performance at Silver/Gold tier.',
    category: 'running',
    targetMetric: 'miles',
    targetValue: 13.1,
    targetElo: calculateGoalTargetElo('miles', 13.1, 22.0),
    totalWeeks: 8,
    weeklySessionsTarget: 4,
    weeklyVolumeTarget: 22.0,
    progressiveOverloadRate: 0.07,
    scheduleMode: 'weekly',
    exerciseTemplates: DEFAULT_HALF_MARATHON_EXERCISES,
    createdAt: new Date().toISOString(),
    targetDate: '2026-10-26',
    isCompleted: false
  },
  {
    id: 'goal-aerobic-habit-builder',
    title: 'Aerobic Habit & Base Builder',
    description: '3-Week easy-pace consistency builder for establishing a strong daily workout habit without burnout.',
    category: 'recovery',
    targetMetric: 'miles',
    targetValue: 2.5,
    targetElo: calculateGoalTargetElo('miles', 2.5, 7.0),
    totalWeeks: 3,
    weeklySessionsTarget: 3,
    weeklyVolumeTarget: 7.0,
    progressiveOverloadRate: 0.05,
    scheduleMode: 'weekly',
    exerciseTemplates: DEFAULT_HABIT_EXERCISES,
    createdAt: new Date().toISOString(),
    targetDate: '2026-09-21',
    isCompleted: false
  }
];

export const DEFAULT_ACTIVE_GOAL = CURATED_GOAL_BLUEPRINTS[0];

/**
 * Generates an adaptive task queue customized for a specific Fitness Goal.
 * Supports both:
 * 1. Weekly Schedule Mode (Monday through Sunday mapping with multi-workouts per day)
 * 2. Custom Queue Mode (Sequential relative gap chains)
 */
export function generateQueueForGoal(
  goal: FitnessGoal,
  baseDate: Date = new Date()
): WorkoutItem[] {
  const templates = goal.exerciseTemplates || DEFAULT_10K_EXERCISES;
  const queue: WorkoutItem[] = [];
  const overloadRate = goal.progressiveOverloadRate ?? 0.05;

  // Mode A: Weekly Monday–Sunday Schedule
  if (goal.scheduleMode === 'weekly') {
    // Sort templates according to Monday -> Sunday
    const sortedTemplates = [...templates].sort((a, b) => {
      const idxA = a.dayOfWeek ? DAY_INDEX_MAP[a.dayOfWeek] : 0;
      const idxB = b.dayOfWeek ? DAY_INDEX_MAP[b.dayOfWeek] : 0;
      return idxA - idxB;
    });

    let previousAbsoluteDay = 0;

    for (let week = 1; week <= goal.totalWeeks; week++) {
      const weekMultiplier = calculateWeekMultiplier(
        week,
        overloadRate,
        goal.customWeeklyOverloads
      );

      sortedTemplates.forEach((template, sessionIndex) => {
        const isFinalSession = week === goal.totalWeeks && sessionIndex === sortedTemplates.length - 1;
        const dayOffsetInWeek = template.dayOfWeek ? DAY_INDEX_MAP[template.dayOfWeek] : sessionIndex * 2;
        const absoluteDay = (week - 1) * 7 + dayOffsetInWeek;

        let gapFromPrevious = queue.length === 0 ? 0 : Math.max(0, absoluteDay - previousAbsoluteDay);
        previousAbsoluteDay = absoluteDay;

        let sessionTarget: number;
        let sessionTitle: string;
        let category = template.category;

        if (isFinalSession) {
          sessionTarget = goal.targetValue;
          sessionTitle = `🏆 ${goal.title} — Pinnacle Goal Session!`;
          category = 'race';
        } else {
          sessionTarget = Math.round(template.baseTargetValue * weekMultiplier * 10) / 10;
          const dayLabel = template.dayOfWeek ? ` (${template.dayOfWeek})` : '';
          sessionTitle = `Week ${week}${dayLabel}: ${template.title}`;
        }

        const difficultyElo = calculateWorkoutDifficulty(template.metric, sessionTarget);

        queue.push({
          id: `goal-${goal.id}-w${week}-s${sessionIndex + 1}-${queue.length}`,
          title: sessionTitle,
          metric: template.metric,
          targetValue: sessionTarget,
          originalTargetValue: sessionTarget,
          daysFromPrevious: gapFromPrevious,
          daysOffset: absoluteDay,
          dayOfWeek: template.dayOfWeek,
          targetDate: formatDateOffset(baseDate, absoluteDay),
          difficultyElo,
          status: 'PENDING',
          graceDaysElapsed: 0,
          notes: template.notes,
          category,
          weekNumber: week,
          sessionNumber: sessionIndex + 1,
          goalId: goal.id
        });
      });
    }

    return queue;
  }

  // Mode B: Custom Queue Mode (Sequential relative gaps)
  let cumulativeDays = 0;
  for (let week = 1; week <= goal.totalWeeks; week++) {
    const weekMultiplier = calculateWeekMultiplier(
      week,
      overloadRate,
      goal.customWeeklyOverloads
    );

    templates.forEach((template, sessionIndex) => {
      const isFinalSession = week === goal.totalWeeks && sessionIndex === templates.length - 1;

      let sessionTarget: number;
      let sessionTitle: string;
      let category = template.category;

      if (isFinalSession) {
        sessionTarget = goal.targetValue;
        sessionTitle = `🏆 ${goal.title} — Pinnacle Goal Session!`;
        category = 'race';
      } else {
        sessionTarget = Math.round(template.baseTargetValue * weekMultiplier * 10) / 10;
        sessionTitle = `Week ${week}: ${template.title}`;
      }

      const difficultyElo = calculateWorkoutDifficulty(template.metric, sessionTarget);
      const gapFromPrev = queue.length === 0 ? 0 : template.daysFromPrevious;
      cumulativeDays += gapFromPrev;

      queue.push({
        id: `goal-${goal.id}-w${week}-s${sessionIndex + 1}-${queue.length}`,
        title: sessionTitle,
        metric: template.metric,
        targetValue: sessionTarget,
        originalTargetValue: sessionTarget,
        daysFromPrevious: gapFromPrev,
        daysOffset: cumulativeDays,
        targetDate: formatDateOffset(baseDate, cumulativeDays),
        difficultyElo,
        status: 'PENDING',
        graceDaysElapsed: 0,
        notes: template.notes,
        category,
        weekNumber: week,
        sessionNumber: sessionIndex + 1,
        goalId: goal.id
      });
    });
  }

  return queue;
}

/**
 * Computes current weekly progress against the active goal.
 */
export function calculateWeeklyGoalProgress(
  activeGoal: FitnessGoal,
  queue: WorkoutItem[],
  history: CompletedWorkoutRecord[]
): WeeklyGoalProgress {
  const activeWorkout = queue.length > 0 ? queue[0] : null;
  const currentWeekNumber = activeWorkout?.weekNumber || 1;

  const completedThisWeek = history.filter((r) => r.weekNumber === currentWeekNumber);

  const completedSessionsThisWeek = completedThisWeek.length;
  const targetSessionsThisWeek = activeGoal.weeklySessionsTarget || 4;

  const completedVolumeThisWeek = completedThisWeek.reduce((sum, r) => {
    let vol = r.actualValue;
    if (r.metric !== activeGoal.targetMetric) {
      if (r.metric === 'km' && activeGoal.targetMetric === 'miles') vol *= 0.621371;
      else if (r.metric === 'miles' && activeGoal.targetMetric === 'km') vol *= 1.60934;
    }
    return sum + vol;
  }, 0);

  // Compute current week's target volume using week-over-week multiplier
  const overloadRate = activeGoal.progressiveOverloadRate ?? 0.05;
  const weekMultiplier = calculateWeekMultiplier(
    currentWeekNumber,
    overloadRate,
    activeGoal.customWeeklyOverloads
  );

  const targetVolumeThisWeek = Math.round(
    (activeGoal.weeklyVolumeTarget || 12.0) * weekMultiplier * 10
  ) / 10;

  let weekStatus: WeeklyGoalProgress['weekStatus'] = 'ON_TRACK';
  if (completedSessionsThisWeek >= targetSessionsThisWeek && completedVolumeThisWeek >= targetVolumeThisWeek) {
    weekStatus = 'COMPLETED';
  } else if (activeWorkout?.status === 'IN_GRACE' || activeWorkout?.status === 'DOWNGRADED') {
    weekStatus = 'BEHIND';
  }

  return {
    currentWeekNumber,
    totalWeeks: activeGoal.totalWeeks || 4,
    completedSessionsThisWeek,
    targetSessionsThisWeek,
    completedVolumeThisWeek: Math.round(completedVolumeThisWeek * 10) / 10,
    targetVolumeThisWeek,
    weekStatus
  };
}
