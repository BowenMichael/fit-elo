import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CheckCircleIcon, CloseIcon, SparklesIcon, ZapIcon } from './AppIcons';
import { calculateEloDelta, getRankTierInfo } from '../domain/eloEngine';
import { WorkoutItem } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

interface WorkoutLoggerModalProps {
  workout: WorkoutItem | null;
  visible: boolean;
  onClose: () => void;
}

export const WorkoutLoggerModal: React.FC<WorkoutLoggerModalProps> = ({
  workout,
  visible,
  onClose
}) => {
  const { theme } = useAppTheme();
  const profile = useWorkoutStore((state) => state.profile);
  const completeWorkout = useWorkoutStore((state) => state.completeWorkout);

  const [actualValueStr, setActualValueStr] = useState('');
  const [durationStr, setDurationStr] = useState('25');
  const [rpe, setRpe] = useState<number>(4);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (workout) {
      setActualValueStr(workout.targetValue.toString());
      setDurationStr('25');
      setRpe(4);
      setNotes('');
    }
  }, [workout]);

  const actualValue = parseFloat(actualValueStr) || (workout?.targetValue ?? 0);
  const duration = parseInt(durationStr, 10) || 20;

  const preview = useMemo(() => {
    if (!workout) return null;
    return calculateEloDelta(
      profile.eloRating,
      workout.difficultyElo,
      actualValue,
      workout.targetValue,
      rpe,
      workout.graceDaysElapsed || 0,
      workout.originalTargetValue
    );
  }, [profile.eloRating, workout, actualValue, rpe]);

  if (!workout) return null;

  const currentRank = getRankTierInfo(profile.eloRating);
  const nextRank = preview ? getRankTierInfo(preview.newElo) : currentRank;

  const handleComplete = () => {
    Haptics.notification('success');
    // Close the logger first so it slides out before the ELO modal appears
    onClose();
    setTimeout(() => {
      completeWorkout(workout.id, actualValue, duration, rpe, notes.trim() || undefined);
    }, 320);
  };

  const getRpeDescription = (val: number) => {
    if (val <= 4) return 'Effortless / Zone 2 Aerobic (+0.15 MMR bonus)';
    if (val <= 6) return 'Moderate / Steady Tempo (+0.08 MMR bonus)';
    if (val <= 8) return 'Hard / Lactate Threshold (Neutral MMR)';
    return 'Max Exhaustion / Pacing Breakdown (-0.10 MMR penalty)';
  };

  const getRpeColor = (val: number) => {
    if (val <= 4) return theme.colors.success;
    if (val <= 6) return theme.colors.accent;
    if (val <= 8) return theme.colors.warning;
    return theme.colors.danger;
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

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
                Log Workout Session
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                {workout.title}
              </Text>
            </View>
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
            {/* Live Projected MMR Preview */}
            {preview && (
              <View
                style={[
                  styles.previewBanner,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: preview.isComeback ? theme.colors.flame : theme.colors.primary
                  }
                ]}
              >
                <View style={styles.previewLeft}>
                  {preview.isComeback ? (
                    <ZapIcon size={20} color={theme.colors.flame} />
                  ) : (
                    <SparklesIcon size={18} color={theme.colors.gold} />
                  )}
                  <View>
                    <Text style={[styles.previewLabel, { color: theme.colors.textPrimary }]}>
                      {preview.isComeback ? 'Comeback MMR Surge' : 'Projected MMR Rating'}
                    </Text>
                    {preview.logarithmicBonus > 0 && (
                      <Text style={[styles.previewSubLabel, { color: theme.colors.textMuted }]}>
                        Logarithmic returns curve applied (+{preview.logarithmicBonus})
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.previewRight}>
                  <Text
                    style={[
                      styles.deltaText,
                      { color: preview.delta >= 0 ? theme.colors.success : theme.colors.danger }
                    ]}
                  >
                    {preview.delta >= 0 ? `+${preview.delta}` : `${preview.delta}`} MMR
                  </Text>
                  <Text style={[styles.newEloText, { color: theme.colors.textMuted }]}>
                    ({preview.newElo} • {nextRank.name})
                  </Text>
                </View>
              </View>
            )}

            {/* Target vs Actual Metric Input */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Completed Distance / Target ({workout.metric})
                </Text>
                <Text style={[styles.targetHint, { color: theme.colors.textMuted }]}>
                  Target: {workout.targetValue} {workout.metric}
                  {workout.originalTargetValue && workout.originalTargetValue !== workout.targetValue && (
                    ` (Original: ${workout.originalTargetValue})`
                  )}
                </Text>
              </View>
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
                value={actualValueStr}
                onChangeText={setActualValueStr}
                placeholder="3.0"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* Duration Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Duration (Minutes)
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
                value={durationStr}
                onChangeText={setDurationStr}
                placeholder="25"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* RPE Exertion Selector (1 to 10) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Rate of Perceived Exertion (RPE)
                </Text>
                <Text style={[styles.rpeValueTag, { color: getRpeColor(rpe) }]}>
                  RPE {rpe}/10
                </Text>
              </View>
              <Text style={[styles.rpeDescText, { color: getRpeColor(rpe) }]}>
                {getRpeDescription(rpe)}
              </Text>

              <View style={styles.rpeButtonsGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                  const isSelected = rpe === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.rpeBtn,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: isSelected ? getRpeColor(val) : theme.colors.border
                        },
                        isSelected && {
                          backgroundColor: getRpeColor(val)
                        }
                      ]}
                      onPress={() => {
                        Haptics.selection();
                        setRpe(val);
                      }}
                    >
                      <Text
                        style={[
                          styles.rpeBtnText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Optional Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Session Notes (Optional)
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
                placeholder="Felt smooth on the uphill segments, good cadence..."
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.colors.success,
                  ...theme.shadows.md
                }
              ]}
              onPress={handleComplete}
            >
              <CheckCircleIcon size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Complete & Record Session</Text>
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
    alignItems: 'flex-start',
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800'
  },
  sheetSubtitle: {
    fontSize: 14,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  scrollArea: {
    marginBottom: 16
  },
  previewBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '700'
  },
  previewSubLabel: {
    fontSize: 10,
    marginTop: 1
  },
  previewRight: {
    alignItems: 'flex-end'
  },
  deltaText: {
    fontSize: 16,
    fontWeight: '800'
  },
  newEloText: {
    fontSize: 11
  },
  formGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  targetHint: {
    fontSize: 12
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
  rpeValueTag: {
    fontSize: 12,
    fontWeight: '700'
  },
  rpeDescText: {
    fontSize: 11,
    marginBottom: 8
  },
  rpeButtonsGrid: {
    flexDirection: 'row',
    gap: 6
  },
  rpeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rpeBtnText: {
    fontSize: 13,
    fontWeight: '700'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4
  }
});
