import { calculateWorkoutDifficulty } from './eloEngine';
import { formatDateOffset } from './planGenerator';
import { CompletedWorkoutRecord, NotificationAlert, UserFitnessProfile, WorkoutItem } from './types';

/**
 * Recalculates daysOffset and targetDate for all items in the queue based on their relative gaps.
 * @param queue The workout sequence
 * @param headOffset The offset in days for the first item (e.g. 0 for today, or daysFromPrevious for upcoming)
 * @param baseDate Today's reference date
 */
export function recomputeQueueChain(
  queue: WorkoutItem[],
  headOffset: number = 0,
  baseDate: Date = new Date()
): WorkoutItem[] {
  if (queue.length === 0) return [];

  let currentOffset = headOffset;

  return queue.map((item, index) => {
    if (index === 0) {
      currentOffset = headOffset;
    } else {
      currentOffset += item.daysFromPrevious ?? 2;
    }

    return {
      ...item,
      daysOffset: currentOffset,
      targetDate: formatDateOffset(baseDate, currentOffset)
    };
  });
}

/**
 * Shifts the queue forward upon completing a workout.
 * The next upcoming workout is scheduled for its natural interval (daysFromPrevious, e.g. in 2 days),
 * while subsequent workouts maintain their relative gaps after it.
 */
export function shiftQueueOnCompletion(
  queue: WorkoutItem[],
  completedWorkoutId: string,
  actualValue: number,
  rpe: number,
  baseDate: Date = new Date()
): {
  updatedQueue: WorkoutItem[];
  scaledUp: boolean;
} {
  const completedIndex = queue.findIndex((w) => w.id === completedWorkoutId);
  if (completedIndex === -1) {
    return { updatedQueue: [...queue], scaledUp: false };
  }

  const completed = queue[completedIndex];
  const remaining = queue.filter((_, idx) => idx !== completedIndex);

  if (remaining.length === 0) {
    return { updatedQueue: [], scaledUp: false };
  }

  // Progressive Overload: Scale future targets up (+5%) if completed easily (RPE <= 5)
  const targetMet = actualValue >= completed.targetValue;
  const shouldScaleUp = targetMet && rpe <= 5;

  // New head workout is scheduled `daysFromPrevious` days from today (default 2)
  const newHead = remaining[0];
  const newHeadOffset = newHead.daysFromPrevious > 0 ? newHead.daysFromPrevious : 2;

  let currentOffset = newHeadOffset;

  const updatedQueue = remaining.map((w, index) => {
    if (index === 0) {
      currentOffset = newHeadOffset;
    } else {
      currentOffset += w.daysFromPrevious ?? 2;
    }

    let newTarget = w.targetValue;
    if (shouldScaleUp && w.status === 'PENDING') {
      if (w.metric === 'miles' || w.metric === 'km') {
        newTarget = Math.round(w.targetValue * 1.05 * 10) / 10;
      } else {
        newTarget = Math.round(w.targetValue * 1.05);
      }
    }

    const newElo = calculateWorkoutDifficulty(w.metric, newTarget);

    return {
      ...w,
      daysOffset: currentOffset,
      targetDate: formatDateOffset(baseDate, currentOffset),
      targetValue: newTarget,
      difficultyElo: newElo,
      status: 'PENDING' as const,
      graceDaysElapsed: 0
    };
  });

  return {
    updatedQueue,
    scaledUp: shouldScaleUp
  };
}

/**
 * Handles day advancement simulation (or real calendar day tick).
 * Manages countdown to due date, rolling grace periods, streak protection, and auto-downgrades.
 */
export function processDayAdvancement(
  queue: WorkoutItem[],
  userProfile: UserFitnessProfile,
  baseDate: Date = new Date()
): {
  updatedQueue: WorkoutItem[];
  updatedProfile: UserFitnessProfile;
  alert: NotificationAlert | null;
  downgraded: boolean;
} {
  if (queue.length === 0) {
    return {
      updatedQueue: [],
      updatedProfile: { ...userProfile, streakProtectedInGrace: false },
      alert: null,
      downgraded: false
    };
  }

  const activeWorkout = queue[0];
  const graceLimit = userProfile.gracePeriodDays || 3;

  // Case 1: Active workout is due today (daysOffset === 0)
  if (activeWorkout.daysOffset === 0) {
    const nextGraceElapsed = (activeWorkout.graceDaysElapsed || 0) + 1;

    // Sub-case A: Still within grace period
    if (nextGraceElapsed <= graceLimit) {
      const remainingDays = graceLimit - nextGraceElapsed;
      const updatedQueue = queue.map((item, idx) => {
        if (idx === 0) {
          return {
            ...item,
            status: 'IN_GRACE' as const,
            graceDaysElapsed: nextGraceElapsed
          };
        }
        return item;
      });

      const updatedProfile: UserFitnessProfile = {
        ...userProfile,
        streakProtectedInGrace: true
      };

      const alert: NotificationAlert = {
        id: `grace-${Date.now()}`,
        type: 'grace_warning',
        title: `⚠️ Grace Period: Day ${nextGraceElapsed} of ${graceLimit}`,
        message:
          remainingDays === 0
            ? `Final day of grace! Complete "${activeWorkout.title}" today to protect your ${userProfile.currentStreak}-day streak.`
            : `Your session "${activeWorkout.title}" is held at Day 0. ${remainingDays} grace day${remainingDays > 1 ? 's' : ''} remaining.`,
        timestamp: new Date().toISOString()
      };

      return {
        updatedQueue,
        updatedProfile,
        alert,
        downgraded: false
      };
    }

    // Sub-case B: Grace expired (past Day 3)! Auto-downgrade by 25-30%
    const originalTarget = activeWorkout.originalTargetValue || activeWorkout.targetValue;
    let downgradedTarget: number;
    if (activeWorkout.metric === 'miles' || activeWorkout.metric === 'km') {
      downgradedTarget = Math.max(1.0, Math.round(originalTarget * 0.72 * 10) / 10);
    } else {
      downgradedTarget = Math.max(10, Math.round(originalTarget * 0.72));
    }

    const downgradedElo = calculateWorkoutDifficulty(activeWorkout.metric, downgradedTarget);

    // Downgrade active workout and scale future pending workouts by 10%
    const updatedQueue: WorkoutItem[] = queue.map((item, idx) => {
      if (idx === 0) {
        return {
          ...item,
          status: 'DOWNGRADED' as const,
          originalTargetValue: originalTarget,
          targetValue: downgradedTarget,
          difficultyElo: downgradedElo,
          graceDaysElapsed: 0,
          notes: `[Auto-Downgraded Recovery Run] Scaled down from ${originalTarget} ${item.metric} after grace window expired.`
        };
      }

      // Scale future workouts down by 10%
      const scaledTarget =
        item.metric === 'miles' || item.metric === 'km'
          ? Math.round(item.targetValue * 0.9 * 10) / 10
          : Math.round(item.targetValue * 0.9);
      const scaledElo = calculateWorkoutDifficulty(item.metric, scaledTarget);

      return {
        ...item,
        targetValue: scaledTarget,
        difficultyElo: scaledElo
      };
    });

    const eloPenalty = 28;
    const newElo = Math.max(800, userProfile.eloRating - eloPenalty);

    const updatedProfile: UserFitnessProfile = {
      ...userProfile,
      eloRating: newElo,
      currentStreak: 0,
      streakProtectedInGrace: false
    };

    const alert: NotificationAlert = {
      id: `downgrade-${Date.now()}`,
      type: 'grace_expired',
      title: '🚨 Grace Period Expired — Workout Downgraded',
      message: `"${activeWorkout.title}" scaled down to ${downgradedTarget} ${activeWorkout.metric}. Rating adjusted (-${eloPenalty} ELO).`,
      timestamp: new Date().toISOString()
    };

    return {
      updatedQueue,
      updatedProfile,
      alert,
      downgraded: true
    };
  }

  // Case 2: Active workout is scheduled in the future (daysOffset > 0)
  // Decrement daysOffset by 1 and update targetDate
  const newHeadOffset = Math.max(0, activeWorkout.daysOffset - 1);
  const updatedQueue = recomputeQueueChain(queue, newHeadOffset, baseDate);

  return {
    updatedQueue,
    updatedProfile: { ...userProfile, streakProtectedInGrace: false },
    alert: null,
    downgraded: false
  };
}
