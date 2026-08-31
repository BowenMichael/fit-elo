import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  ChartIcon,
  CheckCircleIcon,
  ShieldIcon
} from '../components/AppIcons';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';

export const HistoryScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const history = useWorkoutStore((state) => state.history);
  const profile = useWorkoutStore((state) => state.profile);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 4) return theme.colors.success;
    if (rpe <= 6) return theme.colors.accent;
    if (rpe <= 8) return theme.colors.warning;
    return theme.colors.danger;
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Activity History</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {history.length} completed session{history.length === 1 ? '' : 's'} logged
        </Text>
      </View>

      {/* Summary Matrix */}
      <View
        style={[
          styles.summaryMatrix,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {profile.totalWorkoutsCompleted}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Workouts</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {profile.totalMilesLogged}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
            Total {profile.activeMetric}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {profile.eloRating}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Current MMR</Text>
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isPositiveElo = item.eloDelta >= 0;
          return (
            <View
              style={[
                styles.historyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <CheckCircleIcon size={18} color={theme.colors.success} />
                  <Text
                    style={[styles.workoutTitle, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                  {formatDate(item.completedAt)}
                </Text>
              </View>

              {/* Stats Row */}
              <View
                style={[
                  styles.metricsRow,
                  { backgroundColor: theme.colors.surfaceSubtle }
                ]}
              >
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
                    {item.actualValue}{' '}
                    <Text style={[styles.metricSub, { color: theme.colors.accent }]}>
                      {item.metric}
                    </Text>
                  </Text>
                  <Text style={[styles.metricTarget, { color: theme.colors.textMuted }]}>
                    Target: {item.targetValue}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
                    {item.durationMinutes}m
                  </Text>
                  <Text style={[styles.metricTarget, { color: theme.colors.textMuted }]}>
                    Duration
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: getRpeColor(item.rpe) }]}>
                    RPE {item.rpe}
                  </Text>
                  <Text style={[styles.metricTarget, { color: theme.colors.textMuted }]}>
                    Exertion
                  </Text>
                </View>

                {/* ELO Delta Tag */}
                <View
                  style={[
                    styles.eloDeltaTag,
                    {
                      backgroundColor: isPositiveElo
                        ? theme.colors.successSubtle
                        : theme.colors.dangerSubtle
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.eloDeltaText,
                      { color: isPositiveElo ? theme.colors.success : theme.colors.danger }
                    ]}
                  >
                    {isPositiveElo ? `+${item.eloDelta}` : `${item.eloDelta}`} MMR
                  </Text>
                </View>
              </View>

              {/* Grace Protection Badge */}
              {item.savedStreakInGrace && (
                <View
                  style={[
                    styles.graceSavedBadge,
                    { backgroundColor: theme.colors.warningSubtle }
                  ]}
                >
                  <ShieldIcon size={12} color={theme.colors.warning} />
                  <Text style={[styles.graceSavedText, { color: theme.colors.warning }]}>
                    Streak Saved in Grace (Day {item.graceDaysElapsedAtCompletion} /{' '}
                    {profile.gracePeriodDays})
                  </Text>
                </View>
              )}

              {/* Notes */}
              {item.notes && (
                <View
                  style={[
                    styles.notesBox,
                    { backgroundColor: theme.colors.surfaceSubtle }
                  ]}
                >
                  <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
                    "{item.notes}"
                  </Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <ChartIcon size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No Activity Recorded Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Log your scheduled sessions to track performance, RPE, and ELO MMR progression.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 44
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  summaryMatrix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    borderWidth: 1
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800'
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  divider: {
    width: 1,
    height: 28
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  dateText: {
    fontSize: 11
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 8,
    marginTop: 4
  },
  metricItem: {
    alignItems: 'center'
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700'
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '400'
  },
  metricTarget: {
    fontSize: 9,
    marginTop: 1
  },
  eloDeltaTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  eloDeltaText: {
    fontSize: 12,
    fontWeight: '800'
  },
  graceSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  graceSavedText: {
    fontSize: 10,
    fontWeight: '700'
  },
  notesBox: {
    borderRadius: 6,
    padding: 8,
    marginTop: 8
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginTop: 24
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  }
});
