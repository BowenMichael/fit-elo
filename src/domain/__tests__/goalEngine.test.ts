import {
  calculateWeeklyGoalProgress,
  CURATED_GOAL_BLUEPRINTS,
  DEFAULT_10K_EXERCISES,
  generateQueueForGoal
} from '../goalEngine';
import { CompletedWorkoutRecord, FitnessGoal, WorkoutItem } from '../types';

describe('Goals Engine & Goal Creation Wizard', () => {
  const customGoalWithExercises: FitnessGoal = {
    id: 'goal-wizard-custom',
    title: 'Custom 4-Week Hybrid Ramp',
    description: '4-Week progression with 3 customized weekly sessions',
    category: 'running',
    targetMetric: 'miles',
    targetValue: 5.0,
    targetElo: 1400,
    totalWeeks: 4,
    weeklySessionsTarget: 3,
    weeklyVolumeTarget: 9.5,
    progressiveOverloadRate: 0.10, // +10% per week
    exerciseTemplates: [
      {
        id: 'ex-1',
        title: 'Morning Interval Repeats',
        category: 'running',
        metric: 'miles',
        baseTargetValue: 2.0,
        daysFromPrevious: 0
      },
      {
        id: 'ex-2',
        title: 'Midweek Tempo Run',
        category: 'running',
        metric: 'miles',
        baseTargetValue: 3.0,
        daysFromPrevious: 2
      },
      {
        id: 'ex-3',
        title: 'Weekend Long Endurance Anchor',
        category: 'running',
        metric: 'miles',
        baseTargetValue: 4.5,
        daysFromPrevious: 2
      }
    ],
    createdAt: '2026-09-01T00:00:00Z',
    isCompleted: false
  };

  it('has curated goal blueprints with complete exercise templates', () => {
    expect(CURATED_GOAL_BLUEPRINTS.length).toBeGreaterThanOrEqual(4);
    const tenK = CURATED_GOAL_BLUEPRINTS.find((g) => g.id === 'goal-10k-race-mastery');
    expect(tenK).toBeDefined();
    expect(tenK?.exerciseTemplates?.length).toBe(4);
  });

  it('generates a multi-week queue directly from custom exercise templates with overload rate', () => {
    const fixedBase = new Date('2026-09-01T12:00:00Z');
    const queue = generateQueueForGoal(customGoalWithExercises, fixedBase);

    // 4 weeks * 3 exercises = 12 sessions
    expect(queue.length).toBe(12);

    // Week 1 Session 1
    expect(queue[0].title).toBe('Week 1: Morning Interval Repeats');
    expect(queue[0].targetValue).toBe(2.0); // Base value
    expect(queue[0].weekNumber).toBe(1);

    // Week 2 Session 1 (Overloaded by +10% -> 2.0 * 1.1 = 2.2)
    expect(queue[3].title).toBe('Week 2: Morning Interval Repeats');
    expect(queue[3].targetValue).toBe(2.2);
    expect(queue[3].weekNumber).toBe(2);

    // Week 4 Final Session (Pinnacle Goal Run!)
    const finalSession = queue[queue.length - 1];
    expect(finalSession.weekNumber).toBe(4);
    expect(finalSession.targetValue).toBe(5.0); // Pinnacle target value
    expect(finalSession.category).toBe('race');
  });

  it('calculates weekly goal progress accurately from history', () => {
    const queue: WorkoutItem[] = [
      {
        id: 'w-1',
        title: 'Week 1: Midweek Tempo Run',
        metric: 'miles',
        targetValue: 3.0,
        daysOffset: 2,
        daysFromPrevious: 2,
        difficultyElo: 1150,
        status: 'PENDING',
        graceDaysElapsed: 0,
        weekNumber: 1
      }
    ];

    const history: CompletedWorkoutRecord[] = [
      {
        id: 'rec-1',
        workoutId: 'w-0',
        title: 'Week 1: Morning Interval Repeats',
        metric: 'miles',
        targetValue: 2.0,
        actualValue: 2.2,
        durationMinutes: 20,
        rpe: 4,
        eloDelta: 24,
        userEloAfter: 1174,
        completedAt: '2026-09-01T12:00:00Z',
        savedStreakInGrace: false,
        graceDaysElapsedAtCompletion: 0,
        weekNumber: 1
      }
    ];

    const progress = calculateWeeklyGoalProgress(customGoalWithExercises, queue, history);
    expect(progress.currentWeekNumber).toBe(1);
    expect(progress.totalWeeks).toBe(4);
    expect(progress.completedSessionsThisWeek).toBe(1);
    expect(progress.targetSessionsThisWeek).toBe(3);
    expect(progress.completedVolumeThisWeek).toBe(2.2);
    expect(progress.targetVolumeThisWeek).toBe(9.5);
    expect(progress.weekStatus).toBe('ON_TRACK');
  });
});
