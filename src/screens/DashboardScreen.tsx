import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  BellIcon,
  FlameIcon,
  RefreshIcon,
  RunnerIcon,
  ShieldIcon,
  SparklesIcon,
  TrophyIcon,
  ZapIcon
} from '../components/AppIcons';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutLoggerModal } from '../components/WorkoutLoggerModal';
import { RankChangeModal } from '../components/RankChangeModal';
import { getRankTierInfo } from '../domain/eloEngine';
import { WorkoutItem } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { THEME_PRESETS, ThemeId } from '../theme';
import { Haptics } from '../utils/haptics';

export const DashboardScreen: React.FC = () => {
  const { theme, themeId, setTheme } = useAppTheme();
  const profile = useWorkoutStore((state) => state.profile);
  const queue = useWorkoutStore((state) => state.queue);
  const advanceDaySimulation = useWorkoutStore((state) => state.advanceDaySimulation);
  const triggerPreWorkoutReminder = useWorkoutStore((state) => state.triggerPreWorkoutReminder);
  const loadPreset10K = useWorkoutStore((state) => state.loadPreset10K);

  const activeGoal = useWorkoutStore((state) => state.activeGoal);
  const getWeeklyGoalProgress = useWorkoutStore((state) => state.getWeeklyGoalProgress);
  const rankChangeEvent = useWorkoutStore((state) => state.rankChangeEvent);
  const clearRankChangeEvent = useWorkoutStore((state) => state.clearRankChangeEvent);

  const [selectedWorkoutForLog, setSelectedWorkoutForLog] = useState<WorkoutItem | null>(null);

  const rankInfo = getRankTierInfo(profile.eloRating);
  const weeklyProgress = getWeeklyGoalProgress();
  const dueWorkout = queue.length > 0 ? queue[0] : null;
  const isDueToday = dueWorkout && dueWorkout.daysOffset === 0;

  // Cycle between 3 themes: Dark -> Light -> Alternative
  const themeIds: ThemeId[] = ['dark', 'light', 'alternative'];
  const cycleTheme = () => {
    Haptics.impact('light');
    const currentIndex = themeIds.indexOf(themeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    setTheme(themeIds[nextIndex]);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.appTitle, { color: theme.colors.textPrimary }]}>ADAPTIVE STREAK</Text>
            <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
              MMR Habit & Progression Engine
            </Text>
          </View>

          {/* Quick Theme Switcher (3 Themes) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.themeTogglePill,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border
              }
            ]}
            onPress={cycleTheme}
          >
            <Text style={styles.themeIcon}>{theme.icon}</Text>
            <Text style={[styles.themeLabel, { color: theme.colors.textPrimary }]}>
              {theme.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Streak Card */}
        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.flame,
              ...theme.shadows.glowFlame
            }
          ]}
        >
          <View style={styles.streakHeader}>
            <View style={[styles.streakFlameWrap, { backgroundColor: theme.colors.flameSubtle }]}>
              <FlameIcon size={34} color={theme.colors.flame} />
            </View>
            <View style={styles.streakTextWrap}>
              <View style={styles.streakCountRow}>
                <Text style={[styles.streakCount, { color: theme.colors.textPrimary }]}>
                  {profile.currentStreak}
                </Text>
                <Text style={[styles.streakUnit, { color: theme.colors.flame }]}>DAYS ACTIVE</Text>
              </View>
              <Text style={[styles.bestStreakText, { color: theme.colors.textMuted }]}>
                Personal Best: {profile.bestStreak} days
              </Text>
            </View>
          </View>

          {profile.streakProtectedInGrace && (
            <View
              style={[
                styles.graceProtectionBanner,
                {
                  backgroundColor: theme.colors.warningSubtle,
                  borderColor: theme.colors.warning
                }
              ]}
            >
              <ShieldIcon size={14} color={theme.colors.warning} />
              <Text style={[styles.graceProtectionText, { color: theme.colors.warning }]}>
                STREAK PROTECTED IN GRACE WINDOW (DAY {dueWorkout?.graceDaysElapsed || 1} /{' '}
                {profile.gracePeriodDays})
              </Text>
            </View>
          )}
        </View>

        {/* Rank Tier MMR Card */}
        <View
          style={[
            styles.rankCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}
        >
          <View style={styles.rankHeader}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>{rankInfo.icon}</Text>
              <View>
                <Text style={[styles.rankTitle, { color: rankInfo.color }]}>{rankInfo.name}</Text>
                <Text style={[styles.rankSub, { color: theme.colors.textMuted }]}>
                  Fitness Rating Tier
                </Text>
              </View>
            </View>
            <View style={styles.mmrScoreWrap}>
              <Text style={[styles.mmrScore, { color: theme.colors.textPrimary }]}>
                {profile.eloRating}
              </Text>
              <Text style={[styles.mmrLabel, { color: theme.colors.textMuted }]}>MMR</Text>
            </View>
          </View>

          {/* Tier Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${rankInfo.progressPercent}%`,
                    backgroundColor: rankInfo.color
                  }
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressBoundText, { color: theme.colors.textMuted }]}>
                {rankInfo.minElo} MMR
              </Text>
              <Text style={[styles.progressPercentText, { color: theme.colors.textSecondary }]}>
                {rankInfo.progressPercent}% to next rank
              </Text>
              <Text style={[styles.progressBoundText, { color: theme.colors.textMuted }]}>
                {rankInfo.maxElo} MMR
              </Text>
            </View>
          </View>
        </View>

        {/* Active Macro Goal & Weekly Context Card */}
        {activeGoal && (
          <View
            style={[
              styles.goalSummaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <View style={styles.goalSummaryHeader}>
              <View style={styles.goalSummaryLeft}>
                <TrophyIcon size={16} color={theme.colors.gold} />
                <Text style={[styles.goalSummaryLabel, { color: theme.colors.textMuted }]}>
                  GOAL • {activeGoal.title}
                </Text>
              </View>
              <View
                style={[
                  styles.weekPill,
                  {
                    backgroundColor:
                      weeklyProgress.weekStatus === 'COMPLETED'
                        ? theme.colors.successSubtle
                        : theme.colors.primarySubtle,
                    borderColor:
                      weeklyProgress.weekStatus === 'COMPLETED'
                        ? theme.colors.success
                        : theme.colors.primary
                  }
                ]}
              >
                <Text
                  style={[
                    styles.weekPillText,
                    {
                      color:
                        weeklyProgress.weekStatus === 'COMPLETED'
                          ? theme.colors.success
                          : theme.colors.primary
                    }
                  ]}
                >
                  Week {weeklyProgress.currentWeekNumber}/{weeklyProgress.totalWeeks} ({weeklyProgress.weekStatus.replace('_', ' ')})
                </Text>
              </View>
            </View>

            <View style={styles.goalSummaryMetricsRow}>
              <Text style={[styles.goalSummaryMetricText, { color: theme.colors.textPrimary }]}>
                🎯 Target MMR: <Text style={{ color: theme.colors.gold, fontWeight: '800' }}>{activeGoal.targetElo}</Text>
              </Text>
              <Text style={[styles.goalSummaryMetricText, { color: theme.colors.textSecondary }]}>
                🏃 Week Vol: <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{weeklyProgress.completedVolumeThisWeek}/{weeklyProgress.targetVolumeThisWeek} {activeGoal.targetMetric}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Today's Due Workout Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {isDueToday ? "TODAY'S DUE WORKOUT" : 'UPCOMING SCHEDULED SESSION'}
          </Text>
          <Text style={[styles.queueCountBadge, { color: theme.colors.accent }]}>
            {queue.length} in Queue
          </Text>
        </View>

        {dueWorkout ? (
          <WorkoutCard
            workout={dueWorkout}
            isFeatured={!!isDueToday}
            onLogPress={(w) => setSelectedWorkoutForLog(w)}
          />
        ) : (
          <View
            style={[
              styles.emptyQueueCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <SparklesIcon size={32} color={theme.colors.accent} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              Queue Completed!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              You have completed all scheduled workouts in this ramp.
            </Text>
            <TouchableOpacity
              style={[
                styles.reloadPlanBtn,
                {
                  backgroundColor: theme.colors.primary,
                  ...theme.shadows.glowPrimary
                }
              ]}
              onPress={() => {
                Haptics.notification('success');
                loadPreset10K();
              }}
            >
              <RefreshIcon size={16} color="#FFFFFF" />
              <Text style={styles.reloadPlanBtnText}>Load 10K Progressive Preset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Day Sequence Simulator */}
        <View
          style={[
            styles.simulatorCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight
            }
          ]}
        >
          <View style={styles.simulatorHeader}>
            <ZapIcon size={18} color={theme.colors.warning} />
            <Text style={[styles.simulatorTitle, { color: theme.colors.textPrimary }]}>
              Relative Day & Grace Simulator
            </Text>
          </View>
          <Text style={[styles.simulatorDesc, { color: theme.colors.textSecondary }]}>
            Simulate day transitions without waiting 24 hours. Test rolling grace periods, streak
            protection, and auto-downgrades on expiration.
          </Text>

          <View style={styles.simActionsRow}>
            <TouchableOpacity
              style={[
                styles.simBtn,
                {
                  backgroundColor: theme.colors.warningSubtle,
                  borderColor: theme.colors.warning
                }
              ]}
              onPress={() => {
                Haptics.impact('medium');
                advanceDaySimulation();
              }}
            >
              <ZapIcon size={14} color={theme.colors.warning} />
              <Text style={[styles.simBtnText, { color: theme.colors.warning }]}>
                Advance Day (+1 Grace)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.simBtn,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.accent
                }
              ]}
              onPress={() => {
                Haptics.impact('light');
                triggerPreWorkoutReminder();
              }}
            >
              <BellIcon size={14} color={theme.colors.accent} />
              <Text style={[styles.simBtnTextSecondary, { color: theme.colors.accent }]}>
                Test Push Alert
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lifetime Stats Matrix */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <RunnerIcon size={20} color={theme.colors.accent} />
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profile.totalWorkoutsCompleted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Completed</Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <SparklesIcon size={20} color={theme.colors.gold} />
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profile.totalMilesLogged}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
              Total {profile.activeMetric}
            </Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <TrophyIcon size={20} color={theme.colors.flame} />
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profile.bestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Best Streak</Text>
          </View>
        </View>
      </ScrollView>

      {/* Workout Logger Modal */}
      <WorkoutLoggerModal
        workout={selectedWorkoutForLog}
        visible={!!selectedWorkoutForLog}
        onClose={() => setSelectedWorkoutForLog(null)}
      />

      {/* Rank Change Cinematic Modal */}
      <RankChangeModal
        visible={!!rankChangeEvent}
        fromRank={rankChangeEvent?.from || null}
        toRank={rankChangeEvent?.to || null}
        eloDelta={rankChangeEvent?.eloDelta || 0}
        onDismiss={clearRankChangeEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 110
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  themeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1
  },
  themeIcon: {
    fontSize: 14
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '700'
  },
  streakCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  streakFlameWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  streakTextWrap: {
    flex: 1
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8
  },
  streakCount: {
    fontSize: 34,
    fontWeight: '800'
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  bestStreakText: {
    fontSize: 12,
    marginTop: 2
  },
  graceProtectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8
  },
  graceProtectionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  rankCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  rankIcon: {
    fontSize: 28
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  rankSub: {
    fontSize: 11
  },
  mmrScoreWrap: {
    alignItems: 'flex-end'
  },
  mmrScore: {
    fontSize: 22,
    fontWeight: '800'
  },
  mmrLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  progressContainer: {
    marginTop: 4
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  progressBoundText: {
    fontSize: 10
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  queueCountBadge: {
    fontSize: 11,
    fontWeight: '700'
  },
  emptyQueueCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  reloadPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10
  },
  reloadPlanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  simulatorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  simulatorTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  simulatorDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8
  },
  simActionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 10
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  simBtnTextSecondary: {
    fontSize: 11,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  goalSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16
  },
  goalSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  goalSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  goalSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  weekPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  weekPillText: {
    fontSize: 10,
    fontWeight: '700'
  },
  goalSummaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  goalSummaryMetricText: {
    fontSize: 12
  }
});
