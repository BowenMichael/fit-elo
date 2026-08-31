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
import {
  CalendarIcon,
  CheckCircleIcon,
  CloseIcon,
  DumbbellIcon,
  PlusIcon,
  RunnerIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon,
  ZapIcon
} from './AppIcons';
import {
  DEFAULT_10K_EXERCISES,
  DEFAULT_5K_EXERCISES,
  DEFAULT_HABIT_EXERCISES,
  DEFAULT_HALF_MARATHON_EXERCISES
} from '../domain/goalEngine';
import { calculateWorkoutDifficulty, getRankTierInfo } from '../domain/eloEngine';
import {
  FitnessGoal,
  GoalExerciseTemplate,
  WorkoutCategory,
  WorkoutMetric
} from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { Haptics } from '../utils/haptics';

interface GoalWizardModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveGoal: (
    goalData: Omit<FitnessGoal, 'id' | 'createdAt' | 'isCompleted'>
  ) => void;
}

const CATEGORIES: { label: string; value: WorkoutCategory }[] = [
  { label: 'Running', value: 'running' },
  { label: 'Recovery', value: 'recovery' },
  { label: 'Strength', value: 'strength' },
  { label: 'HIIT', value: 'hiit' },
  { label: 'Race Event', value: 'race' }
];

const METRICS: { label: string; value: WorkoutMetric }[] = [
  { label: 'Miles', value: 'miles' },
  { label: 'Kilometers', value: 'km' },
  { label: 'Minutes', value: 'minutes' }
];

export const GoalWizardModal: React.FC<GoalWizardModalProps> = ({
  visible,
  onClose,
  onSaveGoal
}) => {
  const { theme } = useAppTheme();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Goal Objective
  const [title, setTitle] = useState('Sub-45 10K Endurance');
  const [description, setDescription] = useState('Build aerobic capacity and threshold speed over 4 weeks.');
  const [category, setCategory] = useState<WorkoutCategory>('running');
  const [targetMetric, setTargetMetric] = useState<WorkoutMetric>('miles');
  const [targetValueStr, setTargetValueStr] = useState('6.21');
  const [targetEloStr, setTargetEloStr] = useState('1470');
  const [totalWeeksStr, setTotalWeeksStr] = useState('4');

  // Step 2: Exercises Definition
  const [exerciseTemplates, setExerciseTemplates] = useState<GoalExerciseTemplate[]>([
    ...DEFAULT_10K_EXERCISES
  ]);

  // New exercise inline form
  const [newExTitle, setNewExTitle] = useState('');
  const [newExCategory, setNewExCategory] = useState<WorkoutCategory>('running');
  const [newExValStr, setNewExValStr] = useState('3.0');
  const [newExGapStr, setNewExGapStr] = useState('2');
  const [newExNotes, setNewExNotes] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  // Step 3: Progressive Overload
  const [overloadRate, setOverloadRate] = useState<number>(0.05); // 5% per week

  const totalWeeks = parseInt(totalWeeksStr, 10) || 4;
  const targetValue = parseFloat(targetValueStr) || 6.21;
  const targetElo = parseInt(targetEloStr, 10) || 1470;
  const targetRank = getRankTierInfo(targetElo);

  // Computed weekly volume from defined exercises
  const weeklyVolume = exerciseTemplates.reduce((sum, ex) => sum + ex.baseTargetValue, 0);

  const handleAddExercise = () => {
    if (!newExTitle.trim()) return;
    const baseTargetValue = parseFloat(newExValStr) || 2.5;
    const daysFromPrevious = parseInt(newExGapStr, 10) || 2;

    Haptics.selection();
    const newEx: GoalExerciseTemplate = {
      id: `ex-${Date.now()}`,
      title: newExTitle.trim(),
      category: newExCategory,
      metric: targetMetric,
      baseTargetValue,
      daysFromPrevious,
      notes: newExNotes.trim() || undefined
    };

    setExerciseTemplates([...exerciseTemplates, newEx]);
    setNewExTitle('');
    setNewExNotes('');
    setIsAddingExercise(false);
  };

  const handleRemoveExercise = (id: string) => {
    Haptics.impact('light');
    setExerciseTemplates(exerciseTemplates.filter((ex) => ex.id !== id));
  };

  const handleLoadExercisePack = (pack: '10k' | '5k' | 'half' | 'habit') => {
    Haptics.selection();
    if (pack === '10k') setExerciseTemplates([...DEFAULT_10K_EXERCISES]);
    else if (pack === '5k') setExerciseTemplates([...DEFAULT_5K_EXERCISES]);
    else if (pack === 'half') setExerciseTemplates([...DEFAULT_HALF_MARATHON_EXERCISES]);
    else if (pack === 'habit') setExerciseTemplates([...DEFAULT_HABIT_EXERCISES]);
  };

  const handleFinishWizard = () => {
    if (!title.trim() || exerciseTemplates.length === 0) return;

    Haptics.notification('success');
    onSaveGoal({
      title: title.trim(),
      description: description.trim() || `${totalWeeks}-week progression toward ${targetValue} ${targetMetric}.`,
      category,
      targetMetric,
      targetValue,
      targetElo,
      totalWeeks,
      weeklySessionsTarget: exerciseTemplates.length,
      weeklyVolumeTarget: Math.round(weeklyVolume * 10) / 10,
      progressiveOverloadRate: overloadRate,
      exerciseTemplates
    });

    onClose();
    setCurrentStep(1);
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
                Goal Creation Wizard
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                Step {currentStep} of 3 • {currentStep === 1 ? 'Objective & Target MMR' : currentStep === 2 ? 'Define Weekly Exercises' : 'Overload & Task Preview'}
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

          {/* Step Progress Bar */}
          <View style={styles.stepProgressContainer}>
            {[1, 2, 3].map((stepNum) => (
              <View
                key={stepNum}
                style={[
                  styles.stepBar,
                  {
                    backgroundColor:
                      currentStep >= stepNum ? theme.colors.primary : theme.colors.surfaceSubtle
                  }
                ]}
              />
            ))}
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* ================= STEP 1: OBJECTIVE & MMR ================= */}
            {currentStep === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Goal Title
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
                    placeholder="e.g. Sub-45 10K Race Finish"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                {/* Category */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Category
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

                {/* Metric */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Primary Metric
                  </Text>
                  <View style={styles.pillRow}>
                    {METRICS.map((m) => {
                      const isSelected = targetMetric === m.value;
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
                            setTargetMetric(m.value);
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

                {/* Target Value, MMR, Weeks Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                      Pinnacle Target ({targetMetric})
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
                      placeholder="6.21"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                      Target MMR ({targetRank.name})
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
                      value={targetEloStr}
                      onChangeText={setTargetEloStr}
                      placeholder="1470"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 0.8 }]}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                      Weeks
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
                      value={totalWeeksStr}
                      onChangeText={setTotalWeeksStr}
                      placeholder="4"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Goal Description
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
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Focus on Zone 2 aerobic base building and cadence repeats..."
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </View>
            )}

            {/* ================= STEP 2: DEFINE WEEKLY EXERCISES ================= */}
            {currentStep === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.exercisePackHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    Weekly Routine ({exerciseTemplates.length} Sessions • {Math.round(weeklyVolume * 10) / 10} {targetMetric}/wk)
                  </Text>
                  <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>
                    Define the specific workouts that repeat and overload weekly.
                  </Text>
                </View>

                {/* Quick Presets */}
                <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
                  QUICK EXERCISE PACKS
                </Text>
                <View style={styles.packsRow}>
                  <TouchableOpacity
                    style={[styles.packChip, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                    onPress={() => handleLoadExercisePack('10k')}
                  >
                    <Text style={[styles.packChipText, { color: theme.colors.textPrimary }]}>4-Day 10K Pack</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.packChip, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                    onPress={() => handleLoadExercisePack('5k')}
                  >
                    <Text style={[styles.packChipText, { color: theme.colors.textPrimary }]}>3-Day 5K Speed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.packChip, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border }]}
                    onPress={() => handleLoadExercisePack('half')}
                  >
                    <Text style={[styles.packChipText, { color: theme.colors.textPrimary }]}>4-Day Half Marathon</Text>
                  </TouchableOpacity>
                </View>

                {/* Exercises List */}
                <View style={styles.exerciseList}>
                  {exerciseTemplates.map((ex, index) => (
                    <View
                      key={ex.id}
                      style={[
                        styles.exerciseItemCard,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: theme.colors.border
                        }
                      ]}
                    >
                      <View style={styles.exerciseItemHeader}>
                        <View style={styles.exerciseTitleWrap}>
                          <View
                            style={[
                              styles.sessionNumberBadge,
                              { backgroundColor: theme.colors.primary }
                            ]}
                          >
                            <Text style={styles.sessionNumberText}>S{index + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.exerciseItemTitle, { color: theme.colors.textPrimary }]}>
                              {ex.title}
                            </Text>
                            <Text style={[styles.exerciseItemSub, { color: theme.colors.textMuted }]}>
                              Target: {ex.baseTargetValue} {ex.metric} • {ex.daysFromPrevious === 0 ? 'Same Day' : `+${ex.daysFromPrevious}d gap`}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteExBtn}
                          onPress={() => handleRemoveExercise(ex.id)}
                        >
                          <TrashIcon size={16} color={theme.colors.danger} />
                        </TouchableOpacity>
                      </View>

                      {ex.notes && (
                        <Text style={[styles.exerciseNotes, { color: theme.colors.textSecondary }]}>
                          {ex.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Add Custom Exercise Form */}
                {!isAddingExercise ? (
                  <TouchableOpacity
                    style={[
                      styles.addExBtn,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.primary
                      }
                    ]}
                    onPress={() => {
                      Haptics.impact('light');
                      setIsAddingExercise(true);
                    }}
                  >
                    <PlusIcon size={16} color={theme.colors.primary} />
                    <Text style={[styles.addExBtnText, { color: theme.colors.primary }]}>
                      Add Custom Exercise to Weekly Cycle
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.newExFormCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.primary
                      }
                    ]}
                  >
                    <Text style={[styles.formSubTitle, { color: theme.colors.textPrimary }]}>
                      New Weekly Workout Exercise
                    </Text>

                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                          marginBottom: 10
                        }
                      ]}
                      value={newExTitle}
                      onChangeText={setNewExTitle}
                      placeholder="e.g. Hill Sprint Intervals"
                      placeholderTextColor={theme.colors.textMuted}
                    />

                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                          Starting Target ({targetMetric})
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              color: theme.colors.textPrimary
                            }
                          ]}
                          keyboardType="decimal-pad"
                          value={newExValStr}
                          onChangeText={setNewExValStr}
                          placeholder="3.0"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                          Day Gap (Days After Prior)
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              color: theme.colors.textPrimary
                            }
                          ]}
                          keyboardType="number-pad"
                          value={newExGapStr}
                          onChangeText={setNewExGapStr}
                          placeholder="2"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>

                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                          marginTop: 10,
                          marginBottom: 10
                        }
                      ]}
                      value={newExNotes}
                      onChangeText={setNewExNotes}
                      placeholder="Focus instructions, tempo pacing, recovery cues..."
                      placeholderTextColor={theme.colors.textMuted}
                    />

                    <View style={styles.builderActionsRow}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                        onPress={() => setIsAddingExercise(false)}
                      >
                        <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmAddExBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleAddExercise}
                      >
                        <Text style={styles.confirmAddExText}>Add Session</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ================= STEP 3: OVERLOAD & PREVIEW ================= */}
            {currentStep === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Weekly Progressive Overload
                </Text>
                <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>
                  Choose how your exercises scale in volume each subsequent week.
                </Text>

                {/* Overload Rate Selector */}
                <View style={styles.overloadPillsRow}>
                  {[
                    { label: 'Flat (0%)', val: 0 },
                    { label: '+5% / Week (Recommended)', val: 0.05 },
                    { label: '+8% / Week (Aggressive)', val: 0.08 },
                    { label: '+10% / Week (Peak Overload)', val: 0.10 }
                  ].map((rate) => {
                    const isSelected = overloadRate === rate.val;
                    return (
                      <TouchableOpacity
                        key={rate.val}
                        style={[
                          styles.overloadPill,
                          {
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                            borderColor: isSelected ? theme.colors.primaryLight : theme.colors.border
                          }
                        ]}
                        onPress={() => {
                          Haptics.selection();
                          setOverloadRate(rate.val);
                        }}
                      >
                        <Text
                          style={[
                            styles.overloadPillText,
                            { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                          ]}
                        >
                          {rate.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Multi-Week Task Progression Preview */}
                <Text style={[styles.fieldHint, { color: theme.colors.textMuted, marginTop: 14 }]}>
                  MULTI-WEEK TASK QUEUE PREVIEW ({totalWeeks} WEEKS • {totalWeeks * exerciseTemplates.length} TOTAL SESSIONS)
                </Text>

                <View style={styles.previewWeeksContainer}>
                  {Array.from({ length: totalWeeks }, (_, idx) => idx + 1).map((weekNum) => {
                    const weekMultiplier = 1.0 + (weekNum - 1) * overloadRate;
                    const weekVolumeTotal = exerciseTemplates.reduce(
                      (sum, ex) => sum + Math.round(ex.baseTargetValue * weekMultiplier * 10) / 10,
                      0
                    );

                    return (
                      <View
                        key={weekNum}
                        style={[
                          styles.weekPreviewCard,
                          {
                            backgroundColor: theme.colors.surfaceSubtle,
                            borderColor: theme.colors.border
                          }
                        ]}
                      >
                        <View style={styles.weekPreviewHeader}>
                          <Text style={[styles.weekPreviewTitle, { color: theme.colors.textPrimary }]}>
                            WEEK {weekNum}
                          </Text>
                          <Text style={[styles.weekPreviewVol, { color: theme.colors.accent }]}>
                            ~{Math.round(weekVolumeTotal * 10) / 10} {targetMetric} total
                          </Text>
                        </View>

                        {exerciseTemplates.map((ex, sIdx) => {
                          const isPinnacle = weekNum === totalWeeks && sIdx === exerciseTemplates.length - 1;
                          const scaledVal = isPinnacle ? targetValue : Math.round(ex.baseTargetValue * weekMultiplier * 10) / 10;

                          return (
                            <View key={ex.id} style={styles.weekSessionRow}>
                              <Text style={[styles.weekSessionTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                S{sIdx + 1}: {ex.title}
                              </Text>
                              <Text style={[styles.weekSessionTarget, { color: isPinnacle ? theme.colors.flame : theme.colors.textPrimary }]}>
                                {scaledVal} {ex.metric} {isPinnacle && '🏆'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Wizard Navigation Footer */}
          <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
            {currentStep > 1 ? (
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}
                onPress={() => {
                  Haptics.impact('light');
                  setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
                }}
              >
                <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}
                onPress={onClose}
              >
                <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            )}

            {currentStep < 3 ? (
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  Haptics.impact('light');
                  setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
              >
                <Text style={styles.nextBtnText}>Next Step</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.finishBtn,
                  {
                    backgroundColor: theme.colors.success,
                    ...theme.shadows.md
                  }
                ]}
                onPress={handleFinishWizard}
              >
                <CheckCircleIcon size={18} color="#FFFFFF" />
                <Text style={styles.finishBtnText}>Activate Goal & Generate Tasks</Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '92%'
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  stepProgressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2
  },
  scrollArea: {
    maxHeight: 520
  },
  stepContent: {
    paddingBottom: 10
  },
  formGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14
  },
  notesInput: {
    minHeight: 54,
    textAlignVertical: 'top'
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '600'
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10
  },
  exercisePackHeader: {
    marginBottom: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10
  },
  fieldHint: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  packsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  packChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  packChipText: {
    fontSize: 11,
    fontWeight: '600'
  },
  exerciseList: {
    gap: 8,
    marginBottom: 12
  },
  exerciseItemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  exerciseTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  sessionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sessionNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  exerciseItemTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  exerciseItemSub: {
    fontSize: 11,
    marginTop: 1
  },
  exerciseNotes: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic'
  },
  deleteExBtn: {
    padding: 4
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11
  },
  addExBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  newExFormCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12
  },
  formSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  builderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600'
  },
  confirmAddExBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8
  },
  confirmAddExText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  overloadPillsRow: {
    gap: 8,
    marginBottom: 12
  },
  overloadPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  overloadPillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  previewWeeksContainer: {
    gap: 8
  },
  weekPreviewCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10
  },
  weekPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  weekPreviewTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  weekPreviewVol: {
    fontSize: 11,
    fontWeight: '700'
  },
  weekSessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  weekSessionTitle: {
    fontSize: 11,
    flex: 1,
    paddingRight: 8
  },
  weekSessionTarget: {
    fontSize: 11,
    fontWeight: '700'
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1
  },
  backBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600'
  },
  nextBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  finishBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
