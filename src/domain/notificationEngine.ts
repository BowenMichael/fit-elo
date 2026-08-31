import { NotificationAlert, UserFitnessProfile, WorkoutItem } from './types';

/**
 * Builds a 1-hour pre-workout notification for the active due session
 */
export function createPreWorkoutReminder(
  workout: WorkoutItem,
  preferredTime: string = '07:00'
): NotificationAlert {
  return {
    id: `reminder-${Date.now()}`,
    type: 'reminder',
    title: '⏰ Workout Due in 1 Hour!',
    message: `Scheduled for ${preferredTime}: "${workout.title}" (${workout.targetValue} ${workout.metric}). Get ready to conquer today's target!`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Builds a streak milestone celebration notification
 */
export function createStreakMilestoneAlert(streak: number): NotificationAlert {
  return {
    id: `milestone-${Date.now()}`,
    type: 'streak_milestone',
    title: `🔥 Streak Milestone: ${streak} Days Active!`,
    message: `Incredible consistency! You've kept your adaptive momentum burning for ${streak} consecutive sessions.`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Builds a rank up celebration alert
 */
export function createRankUpAlert(oldTier: string, newTier: string): NotificationAlert {
  return {
    id: `rankup-${Date.now()}`,
    type: 'rank_up',
    title: `🏆 Rank Up: Promoted to ${newTier}!`,
    message: `Your athletic performance and RPE consistency elevated your MMR from ${oldTier} to ${newTier}!`,
    timestamp: new Date().toISOString()
  };
}
