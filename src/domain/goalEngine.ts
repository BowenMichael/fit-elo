import { calculateWorkoutDifficulty } from './eloEngine';
import { formatDateOffset, generate10KPlan } from './planGenerator';
import {
  CompletedWorkoutRecord,
  FitnessGoal,
  GoalExerciseTemplate,
  WeeklyGoalProgress,
  WorkoutItem
} from './types';

export const DEFAULT_10K_EXERCISES: GoalExerciseTemplate[] = [
  {
    id: 'ex-10k-1',
    title: 'Aerobic Base Calibration Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.5,
    daysFromPrevious: 0,
    notes: 'Comfortable Zone 2 aerobic pace. Establish breathing rhythm.'
  },
  {
    id: 'ex-10k-2',
    title: 'Interval Cadence & Speed',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.3,
    daysFromPrevious: 2,
    notes: 'Snappy cadence repeats with 90s recovery intervals.'
  },
  {
    id: 'ex-10k-3',
    title: 'Active Aerobic Shakeout',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 2.0,
    daysFromPrevious: 2,
    notes: 'Gentle recovery jog to promote muscle elasticity.'
  },
  {
    id: 'ex-10k-4',
    title: 'Long Endurance Volume Anchor',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 3.2,
    daysFromPrevious: 2,
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
    notes: 'Progression run finishing at goal 5K pace.'
  },
  {
    id: 'ex-5k-2',
    title: 'Lactate Speed Repeats',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.2,
    daysFromPrevious: 2,
    notes: '400m / 800m repeats with active recovery.'
  },
  {
    id: 'ex-5k-3',
    title: 'Weekend 5K Endurance Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.8,
    daysFromPrevious: 2,
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
    notes: 'Steady Zone 2 aerobic pacing.'
  },
  {
    id: 'ex-hm-2',
    title: 'Half-Marathon Tempo Run',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 4.5,
    daysFromPrevious: 2,
    notes: 'Sustained tempo at lactate threshold.'
  },
  {
    id: 'ex-hm-3',
    title: 'Flush & Recovery Jog',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 3.0,
    daysFromPrevious: 2,
    notes: 'Easy shakeout run.'
  },
  {
    id: 'ex-hm-4',
    title: 'Long Endurance Pyramid Anchor',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 6.5,
    daysFromPrevious: 2,
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
    notes: 'Start the week with an easy aerobic run.'
  },
  {
    id: 'ex-hab-2',
    title: 'Midweek Shakeout & Strides',
    category: 'recovery',
    metric: 'miles',
    baseTargetValue: 1.5,
    daysFromPrevious: 2,
    notes: 'Gentle recovery with short light strides.'
  },
  {
    id: 'ex-hab-3',
    title: 'Weekend Habit Long Jog',
    category: 'running',
    metric: 'miles',
    baseTargetValue: 2.2,
    daysFromPrevious: 2,
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
    targetElo: 1470,
    totalWeeks: 4,
    weeklySessionsTarget: 4,
    weeklyVolumeTarget: 13.5,
    progressiveOverloadRate: 0.08,
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
    targetElo: 1350,
    totalWeeks: 4,
    weeklySessionsTarget: 3,
    weeklyVolumeTarget: 9.0,
    progressiveOverloadRate: 0.06,
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
    targetElo: 1650,
    totalWeeks: 8,
    weeklySessionsTarget: 4,
    weeklyVolumeTarget: 22.0,
    progressiveOverloadRate: 0.07,
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
    targetElo: 1200,
    totalWeeks: 3,
    weeklySessionsTarget: 3,
    weeklyVolumeTarget: 7.0,
    progressiveOverloadRate: 0.05,
    exerciseTemplates: DEFAULT_HABIT_EXERCISES,
    createdAt: new Date().toISOString(),
    targetDate: '2026-09-21',
    isCompleted: false
  }
];

export const DEFAULT_ACTIVE_GOAL = CURATED_GOAL_BLUEPRINTS[0];

/**
 * Generates an adaptive task queue customized for a specific Fitness Goal and its exercise templates.
 */
export function generateQueueForGoal(
  goal: FitnessGoal,
  baseDate: Date = new Date()
): WorkoutItem[] {
  // If the goal provides custom exercise templates, build the queue directly from them
  if (goal.exerciseTemplates && goal.exerciseTemplates.length > 0) {
    const queue: WorkoutItem[] = [];
    let cumulativeDays = 0;
    const overloadRate = goal.progressiveOverloadRate ?? 0.05;

    for (let week = 1; week <= goal.totalWeeks; week++) {
      const weekMultiplier = 1.0 + (week - 1) * overloadRate;

      goal.exerciseTemplates.forEach((template, sessionIndex) => {
        const isFinalSession = week === goal.totalWeeks && sessionIndex === goal.exerciseTemplates!.length - 1;

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

  // Fallback to standard 10K plan
  return generate10KPlan(goal.targetMetric, baseDate).map((w) => ({
    ...w,
    goalId: goal.id
  }));
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

  const targetVolumeThisWeek = activeGoal.weeklyVolumeTarget || 12.0;

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
