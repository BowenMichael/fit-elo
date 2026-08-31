import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AlertIcon,
  CalendarIcon,
  ClockIcon,
  DumbbellIcon,
  PlayIcon,
  RunnerIcon,
  ShieldIcon,
  TrashIcon,
  ZapIcon
} from './AppIcons';
import { WorkoutItem } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { Haptics } from '../utils/haptics';

interface WorkoutCardProps {
  workout: WorkoutItem;
  onLogPress?: (workout: WorkoutItem) => void;
  onDeletePress?: (workoutId: string) => void;
  isFeatured?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onLogPress,
  onDeletePress,
  isFeatured = false
}) => {
  const { theme } = useAppTheme();

  const isDueToday = workout.daysOffset === 0;
  const isInGrace = workout.status === 'IN_GRACE';
  const isDowngraded = workout.status === 'DOWNGRADED';

  const formatTargetDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDayOffsetBadge = () => {
    if (isInGrace) {
      return (
        <View
          style={[
            styles.offsetBadge,
            {
              backgroundColor: theme.colors.warningSubtle,
              borderColor: theme.colors.warning
            }
          ]}
        >
          <AlertIcon size={12} color={theme.colors.warning} />
          <Text style={[styles.offsetBadgeText, { color: theme.colors.warning }]}>
            GRACE DAY {workout.graceDaysElapsed} / 3
          </Text>
        </View>
      );
    }

    if (isDowngraded) {
      return (
        <View
          style={[
            styles.offsetBadge,
            {
              backgroundColor: theme.colors.dangerSubtle,
              borderColor: theme.colors.danger
            }
          ]}
        >
          <ZapIcon size={12} color={theme.colors.danger} />
          <Text style={[styles.offsetBadgeText, { color: theme.colors.danger }]}>
            DOWNGRADED RECOVERY
          </Text>
        </View>
      );
    }

    if (workout.daysOffset === 0) {
      return (
        <View
          style={[
            styles.offsetBadge,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primaryLight
            }
          ]}
        >
          <ClockIcon size={12} color="#FFFFFF" />
          <Text style={[styles.offsetBadgeText, { color: '#FFFFFF' }]}>TODAY (DUE NOW)</Text>
        </View>
      );
    }

    if (workout.daysOffset === 1) {
      return (
        <View
          style={[
            styles.offsetBadge,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.border
            }
          ]}
        >
          <Text style={[styles.offsetBadgeText, { color: theme.colors.textSecondary }]}>
            TOMORROW
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.offsetBadge,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border
          }
        ]}
      >
        <Text style={[styles.offsetBadgeText, { color: theme.colors.textSecondary }]}>
          IN {workout.daysOffset} DAYS
        </Text>
      </View>
    );
  };

  const getCategoryIcon = () => {
    switch (workout.category) {
      case 'recovery':
        return <ShieldIcon size={16} color={theme.colors.success} />;
      case 'race':
        return <ZapIcon size={16} color={theme.colors.flame} />;
      case 'strength':
      case 'hiit':
        return <DumbbellIcon size={16} color={theme.colors.purple} />;
      case 'running':
      default:
        return <RunnerIcon size={16} color={theme.colors.accent} />;
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isFeatured
            ? theme.colors.primary
            : isInGrace
            ? theme.colors.warning
            : isDowngraded
            ? theme.colors.danger
            : theme.colors.border
        },
        isFeatured && theme.shadows.glowPrimary
      ]}
    >
      {/* Header Row: Date & Relative Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeLeftGroup}>
          {getDayOffsetBadge()}
          {workout.targetDate ? (
            <View style={styles.dateTag}>
              <CalendarIcon size={12} color={theme.colors.textMuted} />
              <Text style={[styles.dateTagText, { color: theme.colors.textMuted }]}>
                {formatTargetDate(workout.targetDate)}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.eloBadge,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderLight
            }
          ]}
        >
          <Text style={[styles.eloText, { color: theme.colors.accent }]}>
            MMR {workout.difficultyElo}
          </Text>
        </View>
      </View>

      {/* Title & Target */}
      <View style={styles.mainContent}>
        <View style={styles.titleRow}>
          <View style={[styles.categoryIconWrap, { backgroundColor: theme.colors.surfaceSubtle }]}>
            {getCategoryIcon()}
          </View>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {workout.title}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.targetNumber, { color: theme.colors.textPrimary }]}>
            {workout.targetValue}
          </Text>
          <Text style={[styles.metricUnit, { color: theme.colors.accent }]}>
            {workout.metric.toUpperCase()}
          </Text>
          {workout.originalTargetValue && workout.originalTargetValue !== workout.targetValue && (
            <Text style={[styles.originalTargetText, { color: theme.colors.textMuted }]}>
              (was {workout.originalTargetValue} {workout.metric})
            </Text>
          )}

          {workout.daysFromPrevious && workout.daysFromPrevious > 0 && !isDueToday ? (
            <Text style={[styles.gapHintText, { color: theme.colors.textMuted }]}>
              (+{workout.daysFromPrevious}d gap)
            </Text>
          ) : null}
        </View>

        {workout.notes && (
          <Text
            style={[styles.notesText, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {workout.notes}
          </Text>
        )}
      </View>

      {/* Action Footer */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        {onLogPress ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.logButton,
              {
                backgroundColor: isDueToday
                  ? isInGrace
                    ? theme.colors.warning
                    : isDowngraded
                    ? theme.colors.danger
                    : theme.colors.primary
                  : theme.colors.surfaceSubtle,
                borderColor: isDueToday ? 'transparent' : theme.colors.border,
                borderWidth: isDueToday ? 0 : 1
              },
              isDueToday && theme.shadows.glowPrimary
            ]}
            onPress={() => {
              Haptics.impact('medium');
              onLogPress(workout);
            }}
          >
            <PlayIcon size={14} color={isDueToday ? '#FFFFFF' : theme.colors.textPrimary} />
            <Text
              style={[
                styles.logButtonText,
                { color: isDueToday ? '#FFFFFF' : theme.colors.textPrimary }
              ]}
            >
              {isDueToday
                ? isInGrace
                  ? 'Log & Protect Streak'
                  : isDowngraded
                  ? 'Log Recovery Run'
                  : 'Log Workout Session'
                : `Log Early (${workout.daysOffset}d Ahead)`}
            </Text>
          </TouchableOpacity>
        ) : null}

        {onDeletePress && !workout.id.startsWith('plan-10k') && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Haptics.impact('light');
              onDeletePress(workout.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <TrashIcon size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badgeLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  offsetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1
  },
  offsetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateTagText: {
    fontSize: 11,
    fontWeight: '500'
  },
  eloBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  eloText: {
    fontSize: 11,
    fontWeight: '700'
  },
  mainContent: {
    marginVertical: 4
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700'
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4
  },
  targetNumber: {
    fontSize: 26,
    fontWeight: '800'
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  originalTargetText: {
    fontSize: 12,
    textDecorationLine: 'line-through'
  },
  gapHintText: {
    fontSize: 11,
    fontWeight: '500'
  },
  notesText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1
  },
  logButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10
  },
  logButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 8
  }
});
