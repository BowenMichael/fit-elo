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
  calculateGoalTargetElo,
  DAYS_OF_WEEK_ORDER,
  DEFAULT_10K_EXERCISES,
  DEFAULT_5K_EXERCISES,
  DEFAULT_HABIT_EXERCISES,
  DEFAULT_HALF_MARATHON_EXERCISES
} from '../domain/goalEngine';
import { getRankTierInfo } from '../domain/eloEngine';
import {
  DayOfWeek,
  FitnessGoal,
  GoalExerciseTemplate,
  GoalScheduleMode,
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
  const [totalWeeksStr, setTotalWeeksStr] = useState('4');

  // Step 2: Scheduling Mode & Exercises Definition
  const [scheduleMode, setScheduleMode] = useState<GoalScheduleMode>('weekly');
  const [exerciseTemplates, setExerciseTemplates] = useState<GoalExerciseTemplate[]>([
    ...DEFAULT_10K_EXERCISES
  ]);

  // Inline exercise builder state
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExDay, setNewExDay] = useState<DayOfWeek>('Mon');
  const [newExTitle, setNewExTitle] = useState('');
  const [newExCategory, setNewExCategory] = useState<WorkoutCategory>('running');
  const [newExValStr, setNewExValStr] = useState('3.0');
  const [newExGapStr, setNewExGapStr] = useState('2');
  const [newExNotes, setNewExNotes] = useState('');

  // Step 3: Progressive Overload & Custom Weekly Targets
  const [overloadRate, setOverloadRate] = useState<number>(0.05); // 5% per week
  const [isCustomWeeklyTargets, setIsCustomWeeklyTargets] = useState<boolean>(false);
  const [customWeeklyTargets, setCustomWeeklyTargets] = useState<string[]>(['10.0', '11.5', '13.0', '15.0']);

  const totalWeeks = parseInt(totalWeeksStr, 10) || 4;
  const targetValue = parseFloat(targetValueStr) || 6.21;

  // Base Weekly Volume from templates
  const baseWeeklyVolume = exerciseTemplates.reduce((sum, ex) => sum + ex.baseTargetValue, 0);

  // App-Determined Target MMR
  const appDeterminedElo = calculateGoalTargetElo(
    targetMetric,
    targetValue,
    baseWeeklyVolume
  );
  const rankInfo = getRankTierInfo(appDeterminedElo);

  // Initialize / update custom weekly targets when total weeks changes
  React.useEffect(() => {
    const updated = Array.from({ length: totalWeeks }, (_, i) => {
      const mult = 1.0 + i * overloadRate;
      return (Math.round(baseWeeklyVolume * mult * 10) / 10).toString();
    });
    setCustomWeeklyTargets(updated);
  }, [totalWeeks, overloadRate, baseWeeklyVolume]);

  const handleOpenAddForDay = (day: DayOfWeek) => {
    Haptics.impact('light');
    setNewExDay(day);
    setNewExTitle('');
    setNewExValStr('2.5');
    setIsAddingExercise(true);
  };

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
      dayOfWeek: scheduleMode === 'weekly' ? newExDay : undefined,
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
    const parsedCustomTargets = isCustomWeeklyTargets
      ? customWeeklyTargets.map((t) => parseFloat(t) || baseWeeklyVolume)
      : undefined;

    onSaveGoal({
      title: title.trim(),
      description: description.trim() || `${totalWeeks}-week progression toward ${targetValue} ${targetMetric}.`,
      category,
      targetMetric,
      targetValue,
      targetElo: appDeterminedElo,
      totalWeeks,
      weeklySessionsTarget: exerciseTemplates.length,
      weeklyVolumeTarget: Math.round(baseWeeklyVolume * 10) / 10,
      progressiveOverloadRate: overloadRate,
      customWeeklyTargets: parsedCustomTargets,
      scheduleMode,
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
                Step {currentStep} of 3 • {currentStep === 1 ? 'Objective & App-Determined MMR' : currentStep === 2 ? 'Weekly Activity Schedule' : 'Overload & Target Matrix'}
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
            {/* ================= STEP 1: OBJECTIVE & APP-DETERMINED MMR ================= */}
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

                {/* Target Value & Weeks Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.formGroup, { flex: 1.5 }]}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                      Pinnacle Goal Target ({targetMetric})
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
                      Total Weeks
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

                {/* App-Determined Target MMR Banner */}
                <View
                  style={[
                    styles.appEloCard,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: rankInfo.color
                    }
                  ]}
                >
                  <View style={styles.appEloLeft}>
                    <ZapIcon size={20} color={rankInfo.color} />
                    <View>
                      <Text style={[styles.appEloTitle, { color: theme.colors.textPrimary }]}>
                        App-Determined Target Rating
                      </Text>
                      <Text style={[styles.appEloSub, { color: theme.colors.textMuted }]}>
                        Calculated from pinnacle {targetValue} {targetMetric} + weekly training volume
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appEloRight}>
                    <Text style={[styles.appEloScore, { color: rankInfo.color }]}>
                      {appDeterminedElo} MMR
                    </Text>
                    <Text style={[styles.appEloTier, { color: theme.colors.textSecondary }]}>
                      {rankInfo.name} {rankInfo.icon}
                    </Text>
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

            {/* ================= STEP 2: DUAL MODE WEEKLY ACTIVITIES ================= */}
            {currentStep === 2 && (
              <View style={styles.stepContent}>
                {/* Mode Selector */}
                <View style={styles.modeSwitchContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeTabBtn,
                      {
                        backgroundColor:
                          scheduleMode === 'weekly' ? theme.colors.primary : theme.colors.surfaceSubtle,
                        borderColor:
                          scheduleMode === 'weekly' ? theme.colors.primaryLight : theme.colors.border
                      }
                    ]}
                    onPress={() => {
                      Haptics.selection();
                      setScheduleMode('weekly');
                    }}
                  >
                    <CalendarIcon size={14} color={scheduleMode === 'weekly' ? '#FFFFFF' : theme.colors.textSecondary} />
                    <Text
                      style={[
                        styles.modeTabBtnText,
                        { color: scheduleMode === 'weekly' ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Weekly (Mon–Sun)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeTabBtn,
                      {
                        backgroundColor:
                          scheduleMode === 'custom_queue' ? theme.colors.primary : theme.colors.surfaceSubtle,
                        borderColor:
                          scheduleMode === 'custom_queue' ? theme.colors.primaryLight : theme.colors.border
                      }
                    ]}
                    onPress={() => {
                      Haptics.selection();
                      setScheduleMode('custom_queue');
                    }}
                  >
                    <RunnerIcon size={14} color={scheduleMode === 'custom_queue' ? '#FFFFFF' : theme.colors.textSecondary} />
                    <Text
                      style={[
                        styles.modeTabBtnText,
                        { color: scheduleMode === 'custom_queue' ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Custom Queue
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Presets */}
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

                {/* MODE A: WEEKLY MONDAY–SUNDAY SCHEDULE VIEW */}
                {scheduleMode === 'weekly' ? (
                  <View style={styles.weeklyScheduleContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                      Monday through Sunday Schedule
                    </Text>
                    <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>
                      Assign exercise queues to each day of the week. Multiple workouts per day are permitted.
                    </Text>

                    {DAYS_OF_WEEK_ORDER.map((day) => {
                      const dayExercises = exerciseTemplates.filter((ex) => ex.dayOfWeek === day);

                      return (
                        <View
                          key={day}
                          style={[
                            styles.dayCard,
                            {
                              backgroundColor: theme.colors.surfaceSubtle,
                              borderColor: dayExercises.length > 0 ? theme.colors.borderLight : theme.colors.border
                            }
                          ]}
                        >
                          <View style={styles.dayCardHeader}>
                            <View style={styles.dayBadge}>
                              <Text style={[styles.dayBadgeText, { color: theme.colors.primary }]}>{day}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.addDayBtn}
                              onPress={() => handleOpenAddForDay(day)}
                            >
                              <PlusIcon size={12} color={theme.colors.primary} />
                              <Text style={[styles.addDayBtnText, { color: theme.colors.primary }]}>
                                Add to {day}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {dayExercises.length > 0 ? (
                            <View style={styles.dayExercisesList}>
                              {dayExercises.map((ex) => (
                                <View
                                  key={ex.id}
                                  style={[
                                    styles.dayExItem,
                                    {
                                      backgroundColor: theme.colors.surface,
                                      borderColor: theme.colors.border
                                    }
                                  ]}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.dayExTitle, { color: theme.colors.textPrimary }]}>
                                      {ex.title}
                                    </Text>
                                    <Text style={[styles.dayExSub, { color: theme.colors.accent }]}>
                                      {ex.baseTargetValue} {ex.metric}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.deleteExBtn}
                                    onPress={() => handleRemoveExercise(ex.id)}
                                  >
                                    <TrashIcon size={14} color={theme.colors.danger} />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text style={[styles.restDayText, { color: theme.colors.textMuted }]}>
                              Rest / Recovery Day
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  /* MODE B: CUSTOM QUEUE VIEW */
                  <View style={styles.customQueueContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                      Sequential Custom Queue ({exerciseTemplates.length} Sessions)
                    </Text>

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
                                  {ex.baseTargetValue} {ex.metric} • +{ex.daysFromPrevious}d gap
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
                        </View>
                      ))}
                    </View>

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
                        Add Custom Queue Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Inline Add Exercise Form (Shared) */}
                {isAddingExercise && (
                  <View
                    style={[
                      styles.newExFormCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.primary
                      }
                    ]}
                  >
                    <Text style={[styles.formSubTitle, { color: theme.colors.textPrimary }]}>
                      Add Session {scheduleMode === 'weekly' ? `to ${newExDay}` : ''}
                    </Text>

                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
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
                          Target ({targetMetric})
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
                          value={newExValStr}
                          onChangeText={setNewExValStr}
                          placeholder="3.0"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>

                      {scheduleMode === 'custom_queue' && (
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                            Gap Days
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
                            value={newExGapStr}
                            onChangeText={setNewExGapStr}
                            placeholder="2"
                            placeholderTextColor={theme.colors.textMuted}
                          />
                        </View>
                      )}
                    </View>

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
                        <Text style={styles.confirmAddExText}>Save Session</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ================= STEP 3: CUSTOM PROGRESSIVE OVERLOAD & PREVIEW ================= */}
            {currentStep === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Progressive Overload Configuration
                </Text>
                <Text style={[styles.sectionSub, { color: theme.colors.textSecondary }]}>
                  Choose standard overload rates or define custom progressive targets per week.
                </Text>

                {/* Overload Mode Selector */}
                <View style={styles.modeSwitchContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeTabBtn,
                      {
                        backgroundColor:
                          !isCustomWeeklyTargets ? theme.colors.primary : theme.colors.surfaceSubtle,
                        borderColor:
                          !isCustomWeeklyTargets ? theme.colors.primaryLight : theme.colors.border
                      }
                    ]}
                    onPress={() => setIsCustomWeeklyTargets(false)}
                  >
                    <Text
                      style={[
                        styles.modeTabBtnText,
                        { color: !isCustomWeeklyTargets ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Preset % Ramp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeTabBtn,
                      {
                        backgroundColor:
                          isCustomWeeklyTargets ? theme.colors.primary : theme.colors.surfaceSubtle,
                        borderColor:
                          isCustomWeeklyTargets ? theme.colors.primaryLight : theme.colors.border
                      }
                    ]}
                    onPress={() => setIsCustomWeeklyTargets(true)}
                  >
                    <Text
                      style={[
                        styles.modeTabBtnText,
                        { color: isCustomWeeklyTargets ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      Custom Per-Week Targets
                    </Text>
                  </TouchableOpacity>
                </View>

                {!isCustomWeeklyTargets ? (
                  /* Standard % Overload Options */
                  <View style={styles.overloadPillsRow}>
                    {[
                      { label: 'Flat (0% Steady)', val: 0 },
                      { label: '+5% / Week (Recommended Aerobic)', val: 0.05 },
                      { label: '+8% / Week (Aggressive Ramp)', val: 0.08 },
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
                ) : (
                  /* Custom Per-Week Target Editor */
                  <View style={styles.customWeekTargetsGrid}>
                    <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
                      ENTER TARGET VOLUME FOR EACH WEEK ({targetMetric})
                    </Text>
                    <View style={styles.customWeekInputsRow}>
                      {Array.from({ length: totalWeeks }, (_, idx) => idx + 1).map((weekNum) => (
                        <View key={weekNum} style={styles.customWeekCol}>
                          <Text style={[styles.customWeekColLabel, { color: theme.colors.textSecondary }]}>
                            W{weekNum}
                          </Text>
                          <TextInput
                            style={[
                              styles.textInput,
                              {
                                backgroundColor: theme.colors.surfaceSubtle,
                                borderColor: theme.colors.border,
                                color: theme.colors.textPrimary,
                                textAlign: 'center'
                              }
                            ]}
                            keyboardType="decimal-pad"
                            value={customWeeklyTargets[weekNum - 1] || ''}
                            onChangeText={(val) => {
                              const updated = [...customWeeklyTargets];
                              updated[weekNum - 1] = val;
                              setCustomWeeklyTargets(updated);
                            }}
                            placeholder="12.0"
                            placeholderTextColor={theme.colors.textMuted}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Multi-Week Task Progression Matrix Preview */}
                <Text style={[styles.fieldHint, { color: theme.colors.textMuted, marginTop: 16 }]}>
                  MULTI-WEEK TARGET MATRIX ({totalWeeks} WEEKS • {totalWeeks * exerciseTemplates.length} TOTAL SESSIONS)
                </Text>

                <View style={styles.previewWeeksContainer}>
                  {Array.from({ length: totalWeeks }, (_, idx) => idx + 1).map((weekNum) => {
                    let weekVolumeTotal = 0;
                    if (isCustomWeeklyTargets && customWeeklyTargets[weekNum - 1]) {
                      weekVolumeTotal = parseFloat(customWeeklyTargets[weekNum - 1]) || 0;
                    } else {
                      const mult = 1.0 + (weekNum - 1) * overloadRate;
                      weekVolumeTotal = Math.round(baseWeeklyVolume * mult * 10) / 10;
                    }

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
                            {weekVolumeTotal} {targetMetric} goal
                          </Text>
                        </View>

                        {exerciseTemplates.map((ex, sIdx) => {
                          const isPinnacle = weekNum === totalWeeks && sIdx === exerciseTemplates.length - 1;
                          const mult = isCustomWeeklyTargets && baseWeeklyVolume > 0
                            ? (parseFloat(customWeeklyTargets[weekNum - 1]) || baseWeeklyVolume) / baseWeeklyVolume
                            : 1.0 + (weekNum - 1) * overloadRate;
                          const scaledVal = isPinnacle ? targetValue : Math.round(ex.baseTargetValue * mult * 10) / 10;
                          const dayTag = ex.dayOfWeek ? `[${ex.dayOfWeek}] ` : '';

                          return (
                            <View key={ex.id} style={styles.weekSessionRow}>
                              <Text style={[styles.weekSessionTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                {dayTag}{ex.title}
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
    maxHeight: 540
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
  appEloCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 14
  },
  appEloLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8
  },
  appEloTitle: {
    fontSize: 12,
    fontWeight: '700'
  },
  appEloSub: {
    fontSize: 10,
    marginTop: 2
  },
  appEloRight: {
    alignItems: 'flex-end'
  },
  appEloScore: {
    fontSize: 16,
    fontWeight: '800'
  },
  appEloTier: {
    fontSize: 10,
    fontWeight: '700'
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9
  },
  modeTabBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800'
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10
  },
  packsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
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
  weeklyScheduleContainer: {
    gap: 8,
    marginBottom: 12
  },
  dayCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4
  },
  addDayBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  dayExercisesList: {
    gap: 6
  },
  dayExItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  dayExTitle: {
    fontSize: 12,
    fontWeight: '600'
  },
  dayExSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1
  },
  restDayText: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingLeft: 4
  },
  customQueueContainer: {
    marginBottom: 12
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
    marginTop: 8,
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
  customWeekTargetsGrid: {
    marginBottom: 12
  },
  fieldHint: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  customWeekInputsRow: {
    flexDirection: 'row',
    gap: 8
  },
  customWeekCol: {
    flex: 1,
    alignItems: 'center'
  },
  customWeekColLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4
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
