import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  PlusIcon,
  RunnerIcon,
  ShieldIcon,
  SparklesIcon,
  TrophyIcon,
  ZapIcon
} from '../components/AppIcons';
import { GoalWizardModal } from '../components/GoalWizardModal';
import { CURATED_GOAL_BLUEPRINTS } from '../domain/goalEngine';
import { getRankTierInfo } from '../domain/eloEngine';
import { FitnessGoal, WorkoutCategory } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

// Pencil edit icon
const PencilIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#FFF' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size * 0.85, color }}>✏️</Text>
  </View>
);

export const GoalsScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const profile = useWorkoutStore((state) => state.profile);
  const activeGoal = useWorkoutStore((state) => state.activeGoal);
  const savedGoals = useWorkoutStore((state) => state.savedGoals);
  const setActiveGoal = useWorkoutStore((state) => state.setActiveGoal);
  const createCustomGoal = useWorkoutStore((state) => state.createCustomGoal);
  const updateGoal = useWorkoutStore((state) => state.updateGoal);
  const getWeeklyGoalProgress = useWorkoutStore((state) => state.getWeeklyGoalProgress);

  const [isWizardVisible, setIsWizardVisible] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);

  const editGoal = editGoalId
    ? savedGoals.find((g) => g.id === editGoalId)
    : undefined;

  const weeklyProgress = getWeeklyGoalProgress();
  const currentRank = getRankTierInfo(profile.eloRating);
  const targetRank = getRankTierInfo(activeGoal?.targetElo || 1470);

  const handleSelectGoal = (goal: FitnessGoal) => {
    Haptics.notification('success');
    setActiveGoal(goal, true);
  };

  const handleEditGoal = (goal: FitnessGoal) => {
    Haptics.impact('medium');
    setEditGoalId(goal.id);
    setIsWizardVisible(true);
  };

  const handleCreateNew = () => {
    Haptics.impact('medium');
    setEditGoalId(null);
    setIsWizardVisible(true);
  };

  const getCategoryIcon = (cat: WorkoutCategory) => {
    switch (cat) {
      case 'race':
        return <TrophyIcon size={18} color={theme.colors.flame} />;
      case 'recovery':
        return <ShieldIcon size={18} color={theme.colors.success} />;
      case 'strength':
      case 'hiit':
        return <DumbbellIcon size={18} color={theme.colors.purple} />;
      case 'running':
      default:
        return <RunnerIcon size={18} color={theme.colors.accent} />;
    }
  };

  const mmrProgressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((profile.eloRating - 800) / Math.max(1, (activeGoal?.targetElo || 1470) - 800)) * 100
      )
    )
  );

  const wizardCloseHandler = () => {
    setIsWizardVisible(false);
    setEditGoalId(null);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Athletic Goals</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Define Goals, Mon–Sun Schedules & Custom Overload Trajectories
          </Text>
        </View>

        {/* 1. Active Goal Hero Card */}
        {activeGoal && (
          <View
            style={[
              styles.activeGoalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
                ...theme.shadows.glowPrimary
              }
            ]}
          >
            <View style={styles.goalHeaderRow}>
              <View style={styles.goalIconTitleWrap}>
                <View style={[styles.goalIconWrap, { backgroundColor: theme.colors.surfaceSubtle }]}>
                  {getCategoryIcon(activeGoal.category)}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.goalBadgeRow}>
                    <Text style={[styles.activeGoalBadge, { color: theme.colors.primary }]}>
                      ACTIVE MACRO GOAL
                    </Text>
                    <View
                      style={[
                        styles.modeBadge,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: theme.colors.border
                        }
                      ]}
                    >
                      <Text style={[styles.modeBadgeText, { color: theme.colors.textSecondary }]}>
                        {activeGoal.scheduleMode === 'weekly' ? '📅 Mon–Sun Schedule' : '⛓️ Custom Queue'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.activeGoalTitle, { color: theme.colors.textPrimary }]}>
                    {activeGoal.title}
                  </Text>
                </View>
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                style={[styles.editGoalBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                onPress={() => handleEditGoal(activeGoal)}
              >
                <Text style={{ fontSize: 13 }}>✏️</Text>
                <Text style={[styles.editGoalBtnText, { color: theme.colors.textSecondary }]}>Edit</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.goalDescText, { color: theme.colors.textSecondary }]}>
              {activeGoal.description}
            </Text>

            {/* Target MMR Progression Track (App-Determined) */}
            <View
              style={[
                styles.mmrTrackContainer,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <View style={styles.mmrTrackHeader}>
                <View style={styles.mmrPoint}>
                  <Text style={[styles.mmrLabel, { color: theme.colors.textMuted }]}>CURRENT RATING</Text>
                  <Text style={[styles.mmrVal, { color: currentRank.color }]}>
                    {profile.eloRating} ({currentRank.name})
                  </Text>
                </View>
                <View style={[styles.mmrPoint, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.mmrLabel, { color: theme.colors.textMuted }]}>APP-CALCULATED GOAL MMR</Text>
                  <Text style={[styles.mmrVal, { color: targetRank.color }]}>
                    {activeGoal.targetElo} ({targetRank.name})
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.mmrBarBg, { backgroundColor: theme.colors.surface }]}>
                <View
                  style={[
                    styles.mmrBarFill,
                    {
                      width: `${mmrProgressPercent}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]}
                />
              </View>
            </View>

            {/* Weekly Task Context Card */}
            <View
              style={[
                styles.weeklyContextBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <View style={styles.weeklyContextHead}>
                <Text style={[styles.weekTitle, { color: theme.colors.textPrimary }]}>
                  Week {weeklyProgress.currentWeekNumber} of {weeklyProgress.totalWeeks} Goal Target
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        weeklyProgress.weekStatus === 'COMPLETED'
                          ? theme.colors.successSubtle
                          : weeklyProgress.weekStatus === 'BEHIND'
                          ? theme.colors.warningSubtle
                          : theme.colors.primarySubtle,
                      borderColor:
                        weeklyProgress.weekStatus === 'COMPLETED'
                          ? theme.colors.success
                          : weeklyProgress.weekStatus === 'BEHIND'
                          ? theme.colors.warning
                          : theme.colors.primary
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          weeklyProgress.weekStatus === 'COMPLETED'
                            ? theme.colors.success
                            : weeklyProgress.weekStatus === 'BEHIND'
                            ? theme.colors.warning
                            : theme.colors.primary
                      }
                    ]}
                  >
                    {weeklyProgress.weekStatus.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.weeklyMetricsRow}>
                <View style={styles.weeklyMetricBox}>
                  <Text style={[styles.weeklyMetricVal, { color: theme.colors.textPrimary }]}>
                    {weeklyProgress.completedSessionsThisWeek} / {weeklyProgress.targetSessionsThisWeek}
                  </Text>
                  <Text style={[styles.weeklyMetricLabel, { color: theme.colors.textMuted }]}>
                    Sessions Done
                  </Text>
                </View>
                <View style={styles.weeklyMetricBox}>
                  <Text style={[styles.weeklyMetricVal, { color: theme.colors.textPrimary }]}>
                    {weeklyProgress.completedVolumeThisWeek} / {weeklyProgress.targetVolumeThisWeek} {activeGoal.targetMetric}
                  </Text>
                  <Text style={[styles.weeklyMetricLabel, { color: theme.colors.textMuted }]}>
                    Weekly Volume
                  </Text>
                </View>
              </View>

              {/* Defined Exercise Blueprints for this Goal */}
              {activeGoal.exerciseTemplates && activeGoal.exerciseTemplates.length > 0 && (
                <View style={styles.activeExercisesWrap}>
                  <Text style={[styles.activeExercisesTitle, { color: theme.colors.textMuted }]}>
                    WEEKLY ROUTINE BLUEPRINT ({activeGoal.exerciseTemplates.length} SESSIONS)
                  </Text>
                  {activeGoal.exerciseTemplates.map((ex, i) => (
                    <View key={ex.id || i} style={styles.activeExRow}>
                      <Text style={[styles.activeExTitle, { color: theme.colors.textPrimary }]}>
                        {ex.dayOfWeek ? `[${ex.dayOfWeek}] ` : `S${i + 1}: `}{ex.title}
                      </Text>
                      <Text style={[styles.activeExVal, { color: theme.colors.accent }]}>
                        {ex.baseTargetValue} {ex.metric}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action: Open Goal Creation Wizard */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.wizardLauncherCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
              ...theme.shadows.glowPrimary
            }
          ]}
          onPress={handleCreateNew}
        >
          <View style={styles.wizardLauncherLeft}>
            <View style={[styles.wizardIconWrap, { backgroundColor: theme.colors.primarySubtle }]}>
              <SparklesIcon size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.wizardLauncherTitle, { color: theme.colors.textPrimary }]}>
                Goal Creation Wizard
              </Text>
              <Text style={[styles.wizardLauncherSub, { color: theme.colors.textSecondary }]}>
                Objective $\rightarrow$ Mon–Sun Weekly Schedule $\rightarrow$ Custom Overload
              </Text>
            </View>
          </View>
          <View style={[styles.wizardPill, { backgroundColor: theme.colors.primary }]}>
            <PlusIcon size={14} color="#FFFFFF" />
            <Text style={styles.wizardPillText}>Build Goal</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Curated Athletic Goal Blueprints */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            CURATED GOAL BLUEPRINTS
          </Text>
        </View>

        <View style={styles.blueprintsGrid}>
          {savedGoals.map((blueprint) => {
            const isCurrentActive = activeGoal?.id === blueprint.id;
            const rank = getRankTierInfo(blueprint.targetElo);

            return (
              <TouchableOpacity
                key={blueprint.id}
                activeOpacity={0.88}
                style={[
                  styles.blueprintCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isCurrentActive ? theme.colors.primary : theme.colors.border
                  },
                  isCurrentActive && {
                    borderWidth: 2,
                    ...theme.shadows.glowPrimary
                  }
                ]}
                onPress={() => handleSelectGoal(blueprint)}
              >
                <View style={styles.blueprintHeader}>
                  <View style={styles.blueprintTitleRow}>
                    <Text style={styles.blueprintIcon}>{rank.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.blueprintTitle, { color: theme.colors.textPrimary }]}>
                        {blueprint.title}
                      </Text>
                      <Text style={[styles.blueprintSub, { color: rank.color }]}>
                        Calculated {blueprint.targetElo} MMR • {blueprint.totalWeeks} Weeks
                      </Text>
                    </View>
                  </View>

                  <View style={styles.blueprintActions}>
                    {isCurrentActive && (
                      <View
                        style={[
                          styles.activeCheckBadge,
                          { backgroundColor: theme.colors.primary }
                        ]}
                      >
                        <CheckIcon size={14} color="#FFFFFF" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.editBlueprintBtn, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditGoal(blueprint);
                      }}
                    >
                      <Text style={{ fontSize: 11 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.blueprintDesc, { color: theme.colors.textSecondary }]}>
                  {blueprint.description}
                </Text>

                <View style={[styles.blueprintStatsRow, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.blueprintStat, { color: theme.colors.textMuted }]}>
                    Weekly: {blueprint.weeklySessionsTarget} sessions • {blueprint.weeklyVolumeTarget} {blueprint.targetMetric}
                    {blueprint.progressiveOverloadRate ? ` (+${Math.round(blueprint.progressiveOverloadRate * 100)}%/wk)` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Goal Wizard Modal — create new or edit existing */}
      <GoalWizardModal
        visible={isWizardVisible}
        onClose={wizardCloseHandler}
        onSaveGoal={(goalData) => createCustomGoal(goalData)}
        editGoal={editGoal}
        onUpdateGoal={(goalId, goalData) => updateGoal(goalId, goalData)}
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
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  activeGoalCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  goalIconTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  goalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  goalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  activeGoalBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '700'
  },
  activeGoalTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  goalDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  mmrTrackContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12
  },
  mmrTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  mmrPoint: {},
  mmrLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  mmrVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  mmrBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  mmrBarFill: {
    height: '100%',
    borderRadius: 4
  },
  weeklyContextBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  weeklyContextHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  weekTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  weeklyMetricsRow: {
    flexDirection: 'row',
    gap: 12
  },
  weeklyMetricBox: {
    flex: 1
  },
  weeklyMetricVal: {
    fontSize: 16,
    fontWeight: '800'
  },
  weeklyMetricLabel: {
    fontSize: 11,
    marginTop: 1
  },
  activeExercisesWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  activeExercisesTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  activeExRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  activeExTitle: {
    fontSize: 11
  },
  activeExVal: {
    fontSize: 11,
    fontWeight: '700'
  },
  wizardLauncherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20
  },
  wizardLauncherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10
  },
  wizardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wizardLauncherTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  wizardLauncherSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15
  },
  wizardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  wizardPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  sectionHeaderRow: {
    marginTop: 4,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  blueprintsGrid: {
    gap: 12,
    marginBottom: 12
  },
  blueprintCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14
  },
  blueprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  blueprintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  blueprintIcon: {
    fontSize: 22
  },
  blueprintTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  blueprintSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  activeCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  blueprintActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  editBlueprintBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  editGoalBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  blueprintDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8
  },
  blueprintStatsRow: {
    borderTopWidth: 1,
    paddingTop: 8
  },
  blueprintStat: {
    fontSize: 11
  }
});
