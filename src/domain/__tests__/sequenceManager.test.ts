import { processDayAdvancement, shiftQueueOnCompletion } from '../sequenceManager';
import { UserFitnessProfile, WorkoutItem } from '../types';

describe('Sequence Manager & Relative Gap Engine', () => {
  const baseProfile: UserFitnessProfile = {
    eloRating: 1150,
    currentStreak: 3,
    bestStreak: 5,
    gracePeriodDays: 3,
    preferredWorkoutTime: '07:00',
    notifyLeadTime: 1.0,
    notifyOneHourBefore: true,
    activeMetric: 'miles',
    totalWorkoutsCompleted: 3,
    totalMilesLogged: 7.5,
    streakProtectedInGrace: false
  };

  const sampleQueue: WorkoutItem[] = [
    {
      id: 'w-1',
      title: 'Baseline Run',
      metric: 'miles',
      targetValue: 2.5,
      daysFromPrevious: 0,
      daysOffset: 0,
      targetDate: '2026-09-01',
      difficultyElo: 1100,
      status: 'PENDING',
      graceDaysElapsed: 0
    },
    {
      id: 'w-2',
      title: 'Intervals',
      metric: 'miles',
      targetValue: 2.3,
      daysFromPrevious: 2,
      daysOffset: 2,
      targetDate: '2026-09-03',
      difficultyElo: 1080,
      status: 'PENDING',
      graceDaysElapsed: 0
    },
    {
      id: 'w-3',
      title: 'Recovery',
      metric: 'miles',
      targetValue: 2.0,
      daysFromPrevious: 2,
      daysOffset: 4,
      targetDate: '2026-09-05',
      difficultyElo: 1050,
      status: 'PENDING',
      graceDaysElapsed: 0
    }
  ];

  describe('shiftQueueOnCompletion', () => {
    it('schedules next workout 2 days in future and maintains relative gaps', () => {
      const fixedBase = new Date('2026-09-01T12:00:00Z');
      const { updatedQueue } = shiftQueueOnCompletion(sampleQueue, 'w-1', 2.5, 6, fixedBase);

      expect(updatedQueue.length).toBe(2);
      // w-2 is now the upcoming task, scheduled 2 days away (daysFromPrevious: 2)
      expect(updatedQueue[0].id).toBe('w-2');
      expect(updatedQueue[0].daysOffset).toBe(2);
      expect(updatedQueue[0].targetDate).toBe('2026-09-03');

      // w-3 is 2 days after w-2 -> 4 days from today
      expect(updatedQueue[1].id).toBe('w-3');
      expect(updatedQueue[1].daysOffset).toBe(4);
      expect(updatedQueue[1].targetDate).toBe('2026-09-05');
    });

    it('scales up future workouts by 5% when user finishes easily (RPE <= 5)', () => {
      const { updatedQueue, scaledUp } = shiftQueueOnCompletion(sampleQueue, 'w-1', 2.5, 4);
      expect(scaledUp).toBe(true);
      expect(updatedQueue[0].targetValue).toBe(2.4);
    });
  });

  describe('processDayAdvancement (Grace Period & Downgrade Engine)', () => {
    it('advances grace count and protects streak when due today (Day 1)', () => {
      const result = processDayAdvancement(sampleQueue, baseProfile);
      expect(result.downgraded).toBe(false);
      expect(result.updatedQueue[0].status).toBe('IN_GRACE');
      expect(result.updatedQueue[0].graceDaysElapsed).toBe(1);
      expect(result.updatedQueue[0].daysOffset).toBe(0);
      expect(result.updatedProfile.streakProtectedInGrace).toBe(true);
      expect(result.alert?.type).toBe('grace_warning');
    });

    it('decrements countdown by 1 day when active workout is scheduled in the future', () => {
      const futureQueue: WorkoutItem[] = [
        { ...sampleQueue[1], daysOffset: 2 },
        { ...sampleQueue[2], daysOffset: 4 }
      ];

      const result = processDayAdvancement(futureQueue, baseProfile);
      expect(result.updatedQueue[0].daysOffset).toBe(1);
      expect(result.updatedQueue[1].daysOffset).toBe(3);
    });

    it('triggers auto-downgrade and resets streak when grace expires (past Day 3)', () => {
      const queueGraceExpired: WorkoutItem[] = [
        {
          ...sampleQueue[0],
          status: 'IN_GRACE',
          graceDaysElapsed: 3
        },
        sampleQueue[1],
        sampleQueue[2]
      ];

      const result = processDayAdvancement(queueGraceExpired, baseProfile);
      expect(result.downgraded).toBe(true);
      expect(result.updatedQueue[0].status).toBe('DOWNGRADED');
      expect(result.updatedQueue[0].targetValue).toBe(1.8);
      expect(result.updatedProfile.currentStreak).toBe(0);
      expect(result.alert?.type).toBe('grace_expired');
    });
  });
});
