import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CloseIcon, PlusIcon } from './AppIcons';
import { WorkoutCategory, WorkoutMetric } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: WorkoutCategory }[] = [
  { label: 'Running', value: 'running' },
  { label: 'Recovery', value: 'recovery' },
  { label: 'Strength', value: 'strength' },
  { label: 'HIIT', value: 'hiit' },
  { label: 'Race', value: 'race' }
];

const METRICS: { label: string; value: WorkoutMetric }[] = [
  { label: 'Miles', value: 'miles' },
  { label: 'Kilometers', value: 'km' },
  { label: 'Minutes', value: 'minutes' },
  { label: 'Reps', value: 'reps' },
  { label: 'Sets', value: 'sets' }
];

export const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({
  visible,
  onClose
}) => {
  const { theme } = useAppTheme();
  const addWorkout = useWorkoutStore((state) => state.addWorkout);
  const profile = useWorkoutStore((state) => state.profile);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WorkoutCategory>('running');
  const [metric, setMetric] = useState<WorkoutMetric>(profile.activeMetric || 'miles');
  const [targetValueStr, setTargetValueStr] = useState('3.0');
  const [daysFromPreviousStr, setDaysFromPreviousStr] = useState('2');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;

    const targetValue = parseFloat(targetValueStr) || 3.0;
    const daysFromPrevious = parseInt(daysFromPreviousStr, 10) || 2;

    Haptics.notification('success');
    addWorkout({
      title: title.trim(),
      category,
      metric,
      targetValue,
      daysFromPrevious,
      daysOffset: daysFromPrevious,
      notes: notes.trim() || undefined
    });

    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
              Add Custom Workout
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impact('light');
                onClose();
              }}
              style={styles.closeBtn}
            >
              <CloseIcon size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Workout Title
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Hill Sprint Intervals"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Workout Category
              </Text>
              <View style={styles.pillRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.pillBtn,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceSubtle,
                          borderColor: isSelected
                            ? theme.colors.primaryLight
                            : theme.colors.border
                        }
                      ]}
                      onPress={() => {
                        Haptics.selection();
                        setCategory(cat.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.pillBtnText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Metric Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Primary Metric
              </Text>
              <View style={styles.pillRow}>
                {METRICS.map((m) => {
                  const isSelected = metric === m.value;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.pillBtn,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceSubtle,
                          borderColor: isSelected
                            ? theme.colors.primaryLight
                            : theme.colors.border
                        }
                      ]}
                      onPress={() => {
                        Haptics.selection();
                        setMetric(m.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.pillBtnText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Target Value & Relative Gap Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Target ({metric})
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }
                  ]}
                  keyboardType="decimal-pad"
                  value={targetValueStr}
                  onChangeText={setTargetValueStr}
                  placeholder="3.0"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Days After Prior Session
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }
                  ]}
                  keyboardType="number-pad"
                  value={daysFromPreviousStr}
                  onChangeText={setDaysFromPreviousStr}
                  placeholder="2"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Notes & Instructions (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.notesInput,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }
                ]}
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
                placeholder="Warm up with 5 mins easy jog, focus on high cadence..."
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.colors.primary,
                  ...theme.shadows.glowPrimary
                },
                !title.trim() && styles.submitBtnDisabled
              ]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <PlusIcon size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Add to Sequence Queue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '90%'
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 4
  },
  scrollArea: {
    marginBottom: 16
  },
  formGroup: {
    marginBottom: 16
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top'
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4
  },
  submitBtnDisabled: {
    opacity: 0.5
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4
  }
});
