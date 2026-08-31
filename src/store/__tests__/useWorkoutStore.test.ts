import { useWorkoutStore } from '../useWorkoutStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null)
}));

describe('useWorkoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetAllData();
  });

  it('initializes with default user profile and 10K preset queue', () => {
    const state = useWorkoutStore.getState();
    expect(state.profile.eloRating).toBe(1150);
    expect(state.profile.currentStreak).toBe(0);
    expect(state.queue.length).toBe(16);
    expect(state.queue[0].title).toBe('Baseline Calibration Run');
  });

  it('completes a workout, increments streak, logs history, and schedules next workout', () => {
    const initialQueueLength = useWorkoutStore.getState().queue.length;
    const firstWorkout = useWorkoutStore.getState().queue[0];

    useWorkoutStore.getState().completeWorkout(firstWorkout.id, 2.5, 24, 4);

    const state = useWorkoutStore.getState();
    expect(state.profile.currentStreak).toBe(1);
    expect(state.profile.bestStreak).toBe(1);
    expect(state.profile.totalWorkoutsCompleted).toBe(1);
    expect(state.history.length).toBe(1);
    expect(state.history[0].workoutId).toBe(firstWorkout.id);
    expect(state.queue.length).toBe(initialQueueLength - 1);
    // Next workout is scheduled for its natural relative gap (2 days away)
    expect(state.queue[0].daysOffset).toBe(2);
  });

  it('simulates day advancement and enters grace period when due today', () => {
    // First session is due today (offset: 0)
    useWorkoutStore.getState().advanceDaySimulation();

    const state = useWorkoutStore.getState();
    expect(state.queue[0].status).toBe('IN_GRACE');
    expect(state.queue[0].graceDaysElapsed).toBe(1);
    expect(state.profile.streakProtectedInGrace).toBe(true);
    expect(state.activeNotification).not.toBeNull();
    expect(state.activeNotification?.type).toBe('grace_warning');
  });

  it('adds and deletes custom workouts with relative gaps', () => {
    useWorkoutStore.getState().addWorkout({
      title: 'Custom Tempo Run',
      metric: 'miles',
      targetValue: 3.5,
      daysFromPrevious: 1,
      daysOffset: 1,
      category: 'running'
    });

    let state = useWorkoutStore.getState();
    const custom = state.queue.find((w) => w.title === 'Custom Tempo Run');
    expect(custom).toBeDefined();
    expect(custom?.difficultyElo).toBeGreaterThan(1150);

    useWorkoutStore.getState().deleteWorkout(custom!.id);
    state = useWorkoutStore.getState();
    expect(state.queue.find((w) => w.title === 'Custom Tempo Run')).toBeUndefined();
  });
});
