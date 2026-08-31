import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateEloDelta,
  calculateWorkoutDifficulty,
  DEFAULT_INITIAL_ELO,
  getRankTierInfo
} from '../domain/eloEngine';
import {
  calculateWeeklyGoalProgress,
  CURATED_GOAL_BLUEPRINTS,
  DEFAULT_ACTIVE_GOAL,
  generateQueueForGoal
} from '../domain/goalEngine';
import {
  createPreWorkoutReminder,
  createRankUpAlert,
  createStreakMilestoneAlert
} from '../domain/notificationEngine';
import { generate10KPlan } from '../domain/planGenerator';
import { processDayAdvancement, shiftQueueOnCompletion } from '../domain/sequenceManager';
import {
  CompletedWorkoutRecord,
  FitnessGoal,
  NotificationAlert,
  RankTierInfo,
  UserFitnessProfile,
  WeeklyGoalProgress,
  WorkoutItem
} from '../domain/types';

const STORAGE_KEY = '@adaptive_workout_tracker_state_v3';

export const INITIAL_USER_PROFILE: UserFitnessProfile = {
  eloRating: DEFAULT_INITIAL_ELO, // 1150 (Silver II)
  currentStreak: 0,
  bestStreak: 0,
  gracePeriodDays: 3,
  preferredWorkoutTime: '07:00',
  notifyLeadTime: 1.0,           // 1 hour before
  notifyOneHourBefore: true,
  activeMetric: 'miles',
  totalWorkoutsCompleted: 0,
  totalMilesLogged: 0,
  streakProtectedInGrace: false
};

interface WorkoutStoreState {
  profile: UserFitnessProfile;
  activeGoal: FitnessGoal;
  savedGoals: FitnessGoal[];
  queue: WorkoutItem[];
  history: CompletedWorkoutRecord[];
  activeNotification: NotificationAlert | null;
  rankChangeEvent: { from: RankTierInfo; to: RankTierInfo; eloDelta: number } | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  completeWorkout: (
    workoutId: string,
    actualValue: number,
    durationMinutes: number,
    rpe: number,
    notes?: string
  ) => void;
  advanceDaySimulation: () => void;
  triggerPreWorkoutReminder: () => void;
  loadPreset10K: () => void;
  setActiveGoal: (goal: FitnessGoal, regenerateQueue?: boolean) => void;
  createCustomGoal: (
    goal: Omit<FitnessGoal, 'id' | 'createdAt' | 'isCompleted'>
  ) => void;
  updateGoal: (
    goalId: string,
    updates: Omit<FitnessGoal, 'id' | 'createdAt' | 'isCompleted'>
  ) => void;
  deleteGoal: (goalId: string) => void;
  getWeeklyGoalProgress: () => WeeklyGoalProgress;
  addWorkout: (
    workout: Omit<WorkoutItem, 'id' | 'difficultyElo' | 'status' | 'graceDaysElapsed'>
  ) => void;
  updateWorkout: (id: string, updates: Partial<WorkoutItem>) => void;
  deleteWorkout: (id: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  updateProfile: (updates: Partial<UserFitnessProfile>) => void;
  dismissNotification: () => void;
  showNotification: (alert: NotificationAlert) => void;
  clearRankChangeEvent: () => void;
  resetAllData: () => void;
}

// Helper to persist state to AsyncStorage
async function persistState(
  profile: UserFitnessProfile,
  activeGoal: FitnessGoal,
  savedGoals: FitnessGoal[],
  queue: WorkoutItem[],
  history: CompletedWorkoutRecord[]
) {
  try {
    const payload = JSON.stringify({ profile, activeGoal, savedGoals, queue, history });
    await AsyncStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Failed to persist workout store state:', error);
  }
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  profile: INITIAL_USER_PROFILE,
  activeGoal: DEFAULT_ACTIVE_GOAL,
  savedGoals: CURATED_GOAL_BLUEPRINTS,
  queue: generate10KPlan('miles'),
  history: [],
  activeNotification: null,
  rankChangeEvent: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          profile: parsed.profile ? { ...INITIAL_USER_PROFILE, ...parsed.profile } : INITIAL_USER_PROFILE,
          activeGoal: parsed.activeGoal || DEFAULT_ACTIVE_GOAL,
          savedGoals: parsed.savedGoals && parsed.savedGoals.length > 0 ? parsed.savedGoals : CURATED_GOAL_BLUEPRINTS,
          queue: parsed.queue && parsed.queue.length > 0 ? parsed.queue : generate10KPlan('miles'),
          history: parsed.history || [],
          isHydrated: true
        });
        return;
      }
    } catch (e) {
      console.warn('Error hydrating workout store:', e);
    }
    set({ isHydrated: true });
  },

  completeWorkout: (
    workoutId: string,
    actualValue: number,
    durationMinutes: number,
    rpe: number,
    notes?: string
  ) => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const workout = queue.find((w) => w.id === workoutId);
    if (!workout) return;

    const oldTierInfo = getRankTierInfo(profile.eloRating);
    const { delta, newElo } = calculateEloDelta(
      profile.eloRating,
      workout.difficultyElo,
      actualValue,
      workout.targetValue,
      rpe,
      workout.graceDaysElapsed || 0,
      workout.originalTargetValue
    );

    const isStreakSavedInGrace = workout.status === 'IN_GRACE' || workout.graceDaysElapsed > 0;
    const newStreak = profile.currentStreak + 1;
    const newBestStreak = Math.max(profile.bestStreak, newStreak);
    const milesAdded =
      workout.metric === 'miles'
        ? actualValue
        : workout.metric === 'km'
        ? actualValue * 0.621371
        : 0;

    const newRecord: CompletedWorkoutRecord = {
      id: `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workoutId: workout.id,
      title: workout.title,
      metric: workout.metric,
      targetValue: workout.targetValue,
      actualValue,
      durationMinutes,
      rpe,
      eloDelta: delta,
      userEloAfter: newElo,
      completedAt: new Date().toISOString(),
      savedStreakInGrace: isStreakSavedInGrace,
      graceDaysElapsedAtCompletion: workout.graceDaysElapsed || 0,
      weekNumber: workout.weekNumber,
      goalId: workout.goalId,
      notes
    };

    const newTierInfo = getRankTierInfo(newElo);
    let notification: NotificationAlert | null = null;

    if (newTierInfo.tier !== oldTierInfo.tier || newTierInfo.division !== oldTierInfo.division) {
      notification = createRankUpAlert(oldTierInfo.name, newTierInfo.name);
    } else if ([3, 5, 7, 10, 14, 21, 30].includes(newStreak)) {
      notification = createStreakMilestoneAlert(newStreak);
    }

    // Always fire the ELO change modal after every workout
    const rankChangeEvent = { from: oldTierInfo, to: newTierInfo, eloDelta: delta };

    const { updatedQueue } = shiftQueueOnCompletion(queue, workoutId, actualValue, rpe);

    const updatedProfile: UserFitnessProfile = {
      ...profile,
      eloRating: newElo,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      totalWorkoutsCompleted: profile.totalWorkoutsCompleted + 1,
      totalMilesLogged: Math.round((profile.totalMilesLogged + milesAdded) * 10) / 10,
      streakProtectedInGrace: false
    };

    const updatedHistory = [newRecord, ...history];

    set({
      queue: updatedQueue,
      profile: updatedProfile,
      history: updatedHistory,
      activeNotification: notification || get().activeNotification,
      rankChangeEvent: rankChangeEvent || get().rankChangeEvent
    });

    persistState(updatedProfile, activeGoal, savedGoals, updatedQueue, updatedHistory);
  },

  advanceDaySimulation: () => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const result = processDayAdvancement(queue, profile);

    set({
      queue: result.updatedQueue,
      profile: result.updatedProfile,
      activeNotification: result.alert || get().activeNotification
    });

    persistState(result.updatedProfile, activeGoal, savedGoals, result.updatedQueue, history);
  },

  triggerPreWorkoutReminder: () => {
    const { queue, profile } = get();
    if (queue.length > 0) {
      const workout = queue[0];
      const leadLabel =
        profile.notifyLeadTime === 0.5
          ? '30 Minutes'
          : profile.notifyLeadTime === 1
          ? '1 Hour'
          : `${profile.notifyLeadTime || 1} Hours`;

      const alert: NotificationAlert = {
        id: `reminder-${Date.now()}`,
        type: 'reminder',
        title: `⏰ Workout Alert (${leadLabel} Before)`,
        message: `Scheduled for ${profile.preferredWorkoutTime}: "${workout.title}" (${workout.targetValue} ${workout.metric}). Get geared up!`,
        timestamp: new Date().toISOString()
      };
      set({ activeNotification: alert });
    }
  },

  setActiveGoal: (goal: FitnessGoal, regenerateQueue = true) => {
    const { profile, history, savedGoals } = get();
    const newQueue = regenerateQueue ? generateQueueForGoal(goal) : get().queue;
    set({
      activeGoal: goal,
      queue: newQueue
    });
    persistState(profile, goal, savedGoals, newQueue, history);
  },

  createCustomGoal: (goalData) => {
    const { savedGoals, profile, history } = get();
    const newGoal: FitnessGoal = {
      ...goalData,
      id: `goal-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isCompleted: false
    };

    const updatedGoals = [newGoal, ...savedGoals];
    const newQueue = generateQueueForGoal(newGoal);

    set({
      savedGoals: updatedGoals,
      activeGoal: newGoal,
      queue: newQueue
    });

    persistState(profile, newGoal, updatedGoals, newQueue, history);
  },

  updateGoal: (goalId: string, updates: Omit<FitnessGoal, 'id' | 'createdAt' | 'isCompleted'>) => {
    const { savedGoals, activeGoal, profile, queue, history } = get();
    const now = new Date().toISOString();
    const updatedGoal: FitnessGoal = {
      ...updates,
      id: goalId,
      createdAt: savedGoals.find((g) => g.id === goalId)?.createdAt || now,
      isCompleted: savedGoals.find((g) => g.id === goalId)?.isCompleted || false
    };
    const updatedGoals = savedGoals.map((g) => g.id === goalId ? updatedGoal : g);
    const isActive = activeGoal.id === goalId;
    const newQueue = isActive ? generateQueueForGoal(updatedGoal) : queue;
    set({
      savedGoals: updatedGoals,
      activeGoal: isActive ? updatedGoal : activeGoal,
      queue: isActive ? newQueue : queue
    });
    persistState(profile, isActive ? updatedGoal : activeGoal, updatedGoals, isActive ? newQueue : queue, history);
  },

  deleteGoal: (goalId: string) => {
    const { savedGoals, activeGoal, profile, queue, history } = get();
    const updatedGoals = savedGoals.filter((g) => g.id !== goalId);
    let nextActive = activeGoal;
    if (activeGoal.id === goalId && updatedGoals.length > 0) {
      nextActive = updatedGoals[0];
    }
    set({
      savedGoals: updatedGoals,
      activeGoal: nextActive
    });
    persistState(profile, nextActive, updatedGoals, queue, history);
  },

  getWeeklyGoalProgress: () => {
    const { activeGoal, queue, history } = get();
    return calculateWeeklyGoalProgress(activeGoal, queue, history);
  },

  loadPreset10K: () => {
    const { profile, history, activeGoal, savedGoals } = get();
    const newQueue = generate10KPlan(profile.activeMetric);
    set({ queue: newQueue });
    persistState(profile, activeGoal, savedGoals, newQueue, history);
  },

  addWorkout: (item) => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const difficultyElo = calculateWorkoutDifficulty(item.metric, item.targetValue);
    const newWorkout: WorkoutItem = {
      ...item,
      id: `custom-workout-${Date.now()}`,
      difficultyElo,
      status: 'PENDING',
      graceDaysElapsed: 0,
      daysFromPrevious: item.daysFromPrevious ?? 2,
      originalTargetValue: item.targetValue,
      goalId: activeGoal.id
    };

    const updatedQueue = [...queue, newWorkout].sort((a, b) => a.daysOffset - b.daysOffset);
    set({ queue: updatedQueue });
    persistState(profile, activeGoal, savedGoals, updatedQueue, history);
  },

  updateWorkout: (id: string, updates: Partial<WorkoutItem>) => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const updatedQueue = queue.map((item) => {
      if (item.id === id) {
        const merged = { ...item, ...updates };
        if (updates.metric || updates.targetValue !== undefined) {
          merged.difficultyElo = calculateWorkoutDifficulty(
            merged.metric,
            merged.targetValue
          );
        }
        return merged;
      }
      return item;
    });

    set({ queue: updatedQueue });
    persistState(profile, activeGoal, savedGoals, updatedQueue, history);
  },

  deleteWorkout: (id: string) => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const updatedQueue = queue.filter((item) => item.id !== id);
    set({ queue: updatedQueue });
    persistState(profile, activeGoal, savedGoals, updatedQueue, history);
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    const { queue, profile, history, activeGoal, savedGoals } = get();
    const updated = [...queue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set({ queue: updated });
    persistState(profile, activeGoal, savedGoals, updated, history);
  },

  updateProfile: (updates: Partial<UserFitnessProfile>) => {
    const { profile, queue, history, activeGoal, savedGoals } = get();
    const updatedProfile = { ...profile, ...updates };
    set({ profile: updatedProfile });
    persistState(updatedProfile, activeGoal, savedGoals, queue, history);
  },

  dismissNotification: () => {
    set({ activeNotification: null });
  },

  showNotification: (alert: NotificationAlert) => {
    set({ activeNotification: alert });
  },

  clearRankChangeEvent: () => {
    set({ rankChangeEvent: null });
  },

  resetAllData: () => {
    const newProfile = { ...INITIAL_USER_PROFILE };
    const newActiveGoal = DEFAULT_ACTIVE_GOAL;
    const newSavedGoals = CURATED_GOAL_BLUEPRINTS;
    const newQueue = generate10KPlan('miles');
    const newHistory: CompletedWorkoutRecord[] = [];

    set({
      profile: newProfile,
      activeGoal: newActiveGoal,
      savedGoals: newSavedGoals,
      queue: newQueue,
      history: newHistory,
      activeNotification: null
    });

    persistState(newProfile, newActiveGoal, newSavedGoals, newQueue, newHistory);
  }
}));
