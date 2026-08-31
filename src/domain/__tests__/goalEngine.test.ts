import {
  calculateGoalTargetElo,
  calculateWeeklyGoalProgress,
  CURATED_GOAL_BLUEPRINTS,
  generateQueueForGoal
} from '../goalEngine';
import { CompletedWorkoutRecord, FitnessGoal, WorkoutItem } from '../types';

describe('Goals Engine: App-Determined MMR, Mon-Sun Schedule & Custom Overload', () => {
  it('automatically calculates Goal MMR based on pinnacle value and weekly volume', () => {
    const elo10k = calculateGoalTargetElo('miles', 6.21, 13.5);
    expect(elo10k).toBeGreaterThanOrEqual(1350);
    expect(elo10k).toBeLessThanOrEqual(1550);

    const elo5k = calculateGoalTargetElo('miles', 3.1, 9.0);
    expect(elo5k).toBeGreaterThanOrEqual(1150);
    expect(elo5k).toBeLessThan(elo10k);

    const eloHalf = calculateGoalTargetElo('miles', 13.1, 22.0);
    expect(eloHalf).toBeGreaterThanOrEqual(1600);
  });

  it('generates a multi-week task queue from a Monday-through-Sunday weekly schedule', () => {
    const weeklyGoal: FitnessGoal = {
      id: 'goal-mon-sun-test',
      title: 'Mon-Sun Marathon Ramp',
      description: '4-week schedule with workouts on Mon, Wed, and Sat (2x on Sat)',
      category: 'running',
      targetMetric: 'miles',
      targetValue: 6.0,
      targetElo: 1450,
      totalWeeks: 3,
      weeklySessionsTarget: 4,
      weeklyVolumeTarget: 12.0,
      scheduleMode: 'weekly',
      progressiveOverloadRate: 0.05,
      exerciseTemplates: [
        {
          id: 'ex-mon',
          title: 'Monday Zone 2 Run',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 3.0,
          daysFromPrevious: 0,
          dayOfWeek: 'Mon'
        },
        {
          id: 'ex-wed',
          title: 'Wednesday Speed Repeats',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 2.5,
          daysFromPrevious: 2,
          dayOfWeek: 'Wed'
        },
        {
          id: 'ex-sat-morning',
          title: 'Saturday Long Run',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 5.0,
          daysFromPrevious: 3,
          dayOfWeek: 'Sat'
        },
        {
          id: 'ex-sat-evening',
          title: 'Saturday Shakeout Run',
          category: 'recovery',
          metric: 'miles',
          baseTargetValue: 1.5,
          daysFromPrevious: 0,
          dayOfWeek: 'Sat' // Multi-workout day!
        }
      ],
      createdAt: '2026-09-01T00:00:00Z',
      isCompleted: false
    };

    const fixedBase = new Date('2026-09-01T12:00:00Z');
    const queue = generateQueueForGoal(weeklyGoal, fixedBase);

    // 3 weeks * 4 sessions = 12 sessions
    expect(queue.length).toBe(12);

    // Week 1 Mon (Offset 0)
    expect(queue[0].title).toContain('Week 1 (Mon): Monday Zone 2 Run');
    expect(queue[0].daysOffset).toBe(0);
    expect(queue[0].dayOfWeek).toBe('Mon');

    // Week 1 Wed (Offset 2)
    expect(queue[1].title).toContain('Week 1 (Wed): Wednesday Speed Repeats');
    expect(queue[1].daysOffset).toBe(2);
    expect(queue[1].dayOfWeek).toBe('Wed');

    // Week 1 Sat Morning (Offset 5)
    expect(queue[2].title).toContain('Week 1 (Sat): Saturday Long Run');
    expect(queue[2].daysOffset).toBe(5);

    // Week 1 Sat Evening (Same day -> Offset 5, gap 0 from morning)
    expect(queue[3].title).toContain('Week 1 (Sat): Saturday Shakeout Run');
    expect(queue[3].daysOffset).toBe(5);
    expect(queue[3].daysFromPrevious).toBe(0);

    // Week 2 Mon (Offset 7 = (2-1)*7 + 0)
    expect(queue[4].title).toContain('Week 2 (Mon): Monday Zone 2 Run');
    expect(queue[4].daysOffset).toBe(7);
  });

  it('supports custom per-week volume target scaling', () => {
    const customTargetGoal: FitnessGoal = {
      id: 'goal-custom-targets',
      title: 'Custom Per-Week Ramp',
      description: 'Custom targets for each week',
      category: 'running',
      targetMetric: 'miles',
      targetValue: 6.0,
      targetElo: 1400,
      totalWeeks: 3,
      weeklySessionsTarget: 2,
      weeklyVolumeTarget: 6.0,
      scheduleMode: 'weekly',
      customWeeklyTargets: [6.0, 9.0, 12.0], // Doubling volume by week 3!
      exerciseTemplates: [
        {
          id: 'ex-1',
          title: 'Midweek Run',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 3.0,
          daysFromPrevious: 0,
          dayOfWeek: 'Tue'
        },
        {
          id: 'ex-2',
          title: 'Weekend Run',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 3.0,
          daysFromPrevious: 4,
          dayOfWeek: 'Sat'
        }
      ],
      createdAt: '2026-09-01T00:00:00Z',
      isCompleted: false
    };

    const queue = generateQueueForGoal(customTargetGoal);

    // Week 1 base volume is 6.0 -> 3.0 mi per run
    expect(queue[0].targetValue).toBe(3.0);
    expect(queue[1].targetValue).toBe(3.0);

    // Week 2 target is 9.0 (1.5x) -> 4.5 mi per run
    expect(queue[2].targetValue).toBe(4.5);
    expect(queue[3].targetValue).toBe(4.5);

    // Week 3 target is 12.0 (2.0x) -> 6.0 mi
    expect(queue[4].targetValue).toBe(6.0);
  });
});
