import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { CalendarIcon, PlusIcon, RefreshIcon } from '../components/AppIcons';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutLoggerModal } from '../components/WorkoutLoggerModal';
import { WorkoutItem } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

export const WorkoutQueueScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const queue = useWorkoutStore((state) => state.queue);
  const deleteWorkout = useWorkoutStore((state) => state.deleteWorkout);
  const loadPreset10K = useWorkoutStore((state) => state.loadPreset10K);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedWorkoutForLog, setSelectedWorkoutForLog] = useState<WorkoutItem | null>(null);

  const filteredQueue = queue.filter((w) => {
    if (activeCategoryFilter === 'all') return true;
    return w.category === activeCategoryFilter;
  });

  const categories = [
    { label: 'All Workouts', value: 'all' },
    { label: '🏃 Running', value: 'running' },
    { label: '🛡️ Recovery', value: 'recovery' },
    { label: '🏆 Race Target', value: 'race' }
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Sequence Queue</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Relative Days Timeline ({queue.length} scheduled)
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: theme.colors.primary,
              ...theme.shadows.glowPrimary
            }
          ]}
          onPress={() => {
            Haptics.impact('light');
            setIsAddModalVisible(true);
          }}
        >
          <PlusIcon size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Tools */}
      <View style={styles.quickToolsRow}>
        <TouchableOpacity
          style={[
            styles.presetReloadBtn,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.accent
            }
          ]}
          onPress={() => {
            Haptics.notification('success');
            loadPreset10K();
          }}
        >
          <RefreshIcon size={14} color={theme.colors.accent} />
          <Text style={[styles.presetReloadText, { color: theme.colors.accent }]}>
            Load 10K Progressive Preset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.filterPillsRow}>
        {categories.map((c) => {
          const isSelected = activeCategoryFilter === c.value;
          return (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                  borderColor: isSelected ? theme.colors.primaryLight : theme.colors.border
                }
              ]}
              onPress={() => {
                Haptics.selection();
                setActiveCategoryFilter(c.value);
              }}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Queue List */}
      <FlatList
        data={filteredQueue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            isFeatured={item.daysOffset === 0}
            onLogPress={(w) => setSelectedWorkoutForLog(w)}
            onDeletePress={(id) => deleteWorkout(id)}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <CalendarIcon size={36} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No Workouts in Queue
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Add custom sessions or reload the calibrated 10K ramp schedule.
            </Text>
          </View>
        }
      />

      {/* Modals */}
      <AddWorkoutModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
      />

      <WorkoutLoggerModal
        workout={selectedWorkoutForLog}
        visible={!!selectedWorkoutForLog}
        onClose={() => setSelectedWorkoutForLog(null)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  quickToolsRow: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  presetReloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  presetReloadText: {
    fontSize: 12,
    fontWeight: '700'
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110
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
