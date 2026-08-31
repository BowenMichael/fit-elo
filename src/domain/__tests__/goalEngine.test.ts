import {
  calculateGoalTargetElo,
  calculateWeeklyGoalProgress,
  calculateWeekMultiplier,
  CURATED_GOAL_BLUEPRINTS,
  generateQueueForGoal
} from '../goalEngine';
import { CompletedWorkoutRecord, FitnessGoal, WorkoutItem } from '../types';

describe('Goals Engine: App-Determined MMR, Mon-Sun Schedule & Custom WoW Overload', () => {
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

  it('calculates custom week-over-week overload multipliers', () => {
    // Uniform 8% WoW rate
    expect(calculateWeekMultiplier(1, 0.08)).toBe(1.0);
    expect(calculateWeekMultiplier(2, 0.08)).toBeCloseTo(1.08, 2);
    expect(calculateWeekMultiplier(3, 0.08)).toBeCloseTo(1.16, 2);

    // Variable WoW rates: Step 1 = +5%, Step 2 = +10%
    const variableRates = [0.05, 0.10];
    expect(calculateWeekMultiplier(1, 0.05, variableRates)).toBe(1.0);
    expect(calculateWeekMultiplier(2, 0.05, variableRates)).toBeCloseTo(1.05, 2);
    expect(calculateWeekMultiplier(3, 0.05, variableRates)).toBeCloseTo(1.05 * 1.10, 2);
  });

  it('generates a multi-week task queue with custom week-over-week % increases', () => {
    const customWoWGoal: FitnessGoal = {
      id: 'goal-custom-wow-test',
      title: 'Custom WoW Ramp',
      description: '3-Week schedule with +10% WoW increase',
      category: 'running',
      targetMetric: 'miles',
      targetValue: 5.0,
      targetElo: 1350,
      totalWeeks: 3,
      weeklySessionsTarget: 2,
      weeklyVolumeTarget: 6.0,
      scheduleMode: 'weekly',
      progressiveOverloadRate: 0.10, // +10% WoW
      exerciseTemplates: [
        {
          id: 'ex-1',
          title: 'Tuesday Run',
          category: 'running',
          metric: 'miles',
          baseTargetValue: 3.0,
          daysFromPrevious: 0,
          dayOfWeek: 'Tue'
        },
        {
          id: 'ex-2',
          title: 'Saturday Run',
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

    const queue = generateQueueForGoal(customWoWGoal);

    // Week 1 base targets: 3.0 mi
    expect(queue[0].targetValue).toBe(3.0);
    expect(queue[1].targetValue).toBe(3.0);

    // Week 2 (+10% WoW): 3.3 mi
    expect(queue[2].targetValue).toBe(3.3);
    expect(queue[3].targetValue).toBe(3.3);

    // Week 3 Final Session is Pinnacle (5.0 mi)
    expect(queue[queue.length - 1].targetValue).toBe(5.0);
  });
});
