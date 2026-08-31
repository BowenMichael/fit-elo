import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  AlertIcon,
  BellIcon,
  CheckIcon,
  ClockIcon,
  RefreshIcon,
  RunnerIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  TrophyIcon,
  ZapIcon
} from '../components/AppIcons';
import { ThemeSelector } from '../components/ThemeSelector';
import { WorkoutMetric } from '../domain/types';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

const LEAD_TIME_OPTIONS = [
  { label: 'Off', val: 0 },
  { label: '30m', val: 0.5 },
  { label: '1h', val: 1 },
  { label: '2h', val: 2 },
  { label: '3h', val: 3 },
  { label: '6h', val: 6 },
  { label: '12h', val: 12 }
];

const PRESET_WORKOUT_TIMES = [
  { label: '6:00 AM', val: '06:00' },
  { label: '6:30 AM', val: '06:30' },
  { label: '7:00 AM', val: '07:00' },
  { label: '7:30 AM', val: '07:30' },
  { label: '8:00 AM', val: '08:00' },
  { label: '12:00 PM', val: '12:00' },
  { label: '5:30 PM', val: '17:30' },
  { label: '6:30 PM', val: '18:30' },
  { label: '7:00 PM', val: '19:00' }
];

export const SettingsScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const profile = useWorkoutStore((state) => state.profile);
  const updateProfile = useWorkoutStore((state) => state.updateProfile);
  const resetAllData = useWorkoutStore((state) => state.resetAllData);
  const triggerPreWorkoutReminder = useWorkoutStore((state) => state.triggerPreWorkoutReminder);

  // Parse preferredWorkoutTime into 12h components for inline picker
  const parseTime = (timeStr: string) => {
    const [hStr, mStr] = (timeStr || '07:00').split(':');
    let h = parseInt(hStr, 10) || 7;
    const m = parseInt(mStr, 10) || 0;
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { hour: h, minute: m, period };
  };

  const initialParsed = parseTime(profile.preferredWorkoutTime || '07:00');
  const [inlineHour, setInlineHour] = useState<number>(initialParsed.hour);
  const [inlineMinute, setInlineMinute] = useState<number>(initialParsed.minute);
  const [inlinePeriod, setInlinePeriod] = useState<'AM' | 'PM'>(initialParsed.period);
  const [isTimePickerExpanded, setIsTimePickerExpanded] = useState<boolean>(true);

  // Sync state if external profile changes
  React.useEffect(() => {
    const parsed = parseTime(profile.preferredWorkoutTime || '07:00');
    setInlineHour(parsed.hour);
    setInlineMinute(parsed.minute);
    setInlinePeriod(parsed.period);
  }, [profile.preferredWorkoutTime]);

  const format24h = (h: number, m: number, p: 'AM' | 'PM') => {
    let hour24 = h;
    if (p === 'AM' && h === 12) hour24 = 0;
    else if (p === 'PM' && h !== 12) hour24 += 12;
    const hh = hour24.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const updateTimeInline = (h: number, m: number, p: 'AM' | 'PM') => {
    setInlineHour(h);
    setInlineMinute(m);
    setInlinePeriod(p);
    const new24h = format24h(h, m, p);
    updateProfile({ preferredWorkoutTime: new24h });
  };

  const handleGraceChange = (days: number) => {
    Haptics.selection();
    updateProfile({ gracePeriodDays: days });
  };

  const handleMetricChange = (metric: WorkoutMetric) => {
    Haptics.selection();
    updateProfile({ activeMetric: metric });
  };

  const handleLeadTimeChange = (leadVal: number) => {
    Haptics.selection();
    updateProfile({
      notifyLeadTime: leadVal,
      notifyOneHourBefore: leadVal > 0
    });
  };

  // Calculate live preview of when the alert fires
  const calculateAlertTriggerTime = () => {
    if (profile.notifyLeadTime === 0) return null;
    const [hStr, mStr] = (profile.preferredWorkoutTime || '07:00').split(':');
    const totalMinutes = (parseInt(hStr, 10) || 7) * 60 + (parseInt(mStr, 10) || 0);
    const leadMinutes = (profile.notifyLeadTime || 1) * 60;
    let alertMinutes = totalMinutes - leadMinutes;
    if (alertMinutes < 0) alertMinutes += 24 * 60;

    let alertHour = Math.floor(alertMinutes / 60);
    const alertMin = alertMinutes % 60;
    const alertPeriod = alertHour >= 12 ? 'PM' : 'AM';
    if (alertHour === 0) alertHour = 12;
    else if (alertHour > 12) alertHour -= 12;

    return `${alertHour}:${alertMin.toString().padStart(2, '0')} ${alertPeriod}`;
  };

  const alertTriggerTime = calculateAlertTriggerTime();
  const current12hDisplay = `${inlineHour}:${inlineMinute.toString().padStart(2, '0')} ${inlinePeriod}`;

  const handleResetData = () => {
    Haptics.notification('warning');
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all workout history, queue, and fitness rating back to initial defaults?')) {
        resetAllData();
      }
    } else {
      Alert.alert(
        'Reset All Data',
        'This will reset your workout sequence, MMR rating, and completed history back to initial defaults.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => resetAllData()
          }
        ]
      );
    }
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
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Personalize Notifications, Adaptive Engine & Aesthetics
          </Text>
        </View>

        {/* 1. Integrated Notification & Reminder Hub */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <BellIcon size={20} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Integrated Notification Experience
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Configure your training schedule, pre-workout alert lead times, and test push notifications seamlessly.
          </Text>

          {/* Integrated Dynamic Status Callout */}
          <View
            style={[
              styles.statusCallout,
              {
                backgroundColor: profile.notifyLeadTime > 0 ? theme.colors.primarySubtle : theme.colors.surfaceSubtle,
                borderColor: profile.notifyLeadTime > 0 ? theme.colors.primary : theme.colors.border
              }
            ]}
          >
            <ClockIcon size={18} color={profile.notifyLeadTime > 0 ? theme.colors.primary : theme.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.statusCalloutTitle,
                  { color: profile.notifyLeadTime > 0 ? theme.colors.primary : theme.colors.textSecondary }
                ]}
              >
                {profile.notifyLeadTime > 0
                  ? `Daily Workout at ${current12hDisplay}`
                  : 'Pre-Workout Alerts Disabled'}
              </Text>
              <Text style={[styles.statusCalloutSub, { color: theme.colors.textMuted }]}>
                {profile.notifyLeadTime > 0
                  ? `Push alert scheduled at ${alertTriggerTime} (${profile.notifyLeadTime}h before workout)`
                  : 'Select a lead time below to enable automatic pre-workout notifications.'}
              </Text>
            </View>
          </View>

          {/* Section: Alert Lead-Time Selector */}
          <Text style={[styles.subHeading, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            PRE-WORKOUT ALERT LEAD TIME
          </Text>
          <View style={styles.leadTimeGrid}>
            {LEAD_TIME_OPTIONS.map((opt) => {
              const isSelected = (profile.notifyLeadTime ?? 1) === opt.val;
              return (
                <TouchableOpacity
                  key={opt.val}
                  style={[
                    styles.leadTimePill,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surfaceSubtle,
                      borderColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.border
                    }
                  ]}
                  onPress={() => handleLeadTimeChange(opt.val)}
                >
                  <Text
                    style={[
                      styles.leadTimeText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section: Inline Integrated Time Picker */}
          <View style={[styles.inlinePickerContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}>
            <View style={styles.inlinePickerHeader}>
              <View style={styles.inlinePickerTitleRow}>
                <ClockIcon size={16} color={theme.colors.primary} />
                <Text style={[styles.inlinePickerTitle, { color: theme.colors.textPrimary }]}>
                  Preferred Workout Time: <Text style={{ color: theme.colors.primary }}>{current12hDisplay}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleExpandBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  Haptics.impact('light');
                  setIsTimePickerExpanded(!isTimePickerExpanded);
                }}
              >
                <Text style={[styles.toggleExpandBtnText, { color: theme.colors.textSecondary }]}>
                  {isTimePickerExpanded ? 'Collapse' : 'Adjust Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {isTimePickerExpanded && (
              <View style={styles.pickerBody}>
                {/* 1. Hour Row */}
                <Text style={[styles.pickerFieldLabel, { color: theme.colors.textMuted }]}>
                  HOUR
                </Text>
                <View style={styles.pickerRowWrap}>
                  {[5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4].map((h) => {
                    const isSelected = inlineHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.hourPill,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.surface,
                            borderColor: isSelected
                              ? theme.colors.primaryLight
                              : theme.colors.border
                          }
                        ]}
                        onPress={() => {
                          Haptics.selection();
                          updateTimeInline(h, inlineMinute, inlinePeriod);
                        }}
                      >
                        <Text
                          style={[
                            styles.hourPillText,
                            { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                          ]}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Minute & Period Row */}
                <View style={styles.minAndPeriodRow}>
                  {/* Minutes */}
                  <View style={{ flex: 1.6 }}>
                    <Text style={[styles.pickerFieldLabel, { color: theme.colors.textMuted }]}>
                      MINUTE
                    </Text>
                    <View style={styles.minutePillsWrap}>
                      {[0, 15, 30, 45].map((m) => {
                        const isSelected = inlineMinute === m;
                        return (
                          <TouchableOpacity
                            key={m}
                            style={[
                              styles.minutePill,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.accent
                                  : theme.colors.surface,
                                borderColor: isSelected
                                  ? theme.colors.accent
                                  : theme.colors.border
                              }
                            ]}
                            onPress={() => {
                              Haptics.selection();
                              updateTimeInline(inlineHour, m, inlinePeriod);
                            }}
                          >
                            <Text
                              style={[
                                styles.minutePillText,
                                { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                              ]}
                            >
                              :{m.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* AM / PM */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerFieldLabel, { color: theme.colors.textMuted }]}>
                      PERIOD
                    </Text>
                    <View style={styles.periodPillsWrap}>
                      {(['AM', 'PM'] as const).map((p) => {
                        const isSelected = inlinePeriod === p;
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.periodPill,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.surface,
                                borderColor: isSelected
                                  ? theme.colors.primaryLight
                                  : theme.colors.border
                              }
                            ]}
                            onPress={() => {
                              Haptics.selection();
                              updateTimeInline(inlineHour, inlineMinute, p);
                            }}
                          >
                            <Text
                              style={[
                                styles.periodPillText,
                                { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                              ]}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* 3. Quick Athletic Presets */}
                <Text style={[styles.pickerFieldLabel, { color: theme.colors.textMuted, marginTop: 10 }]}>
                  QUICK PRESETS
                </Text>
                <View style={styles.presetsWrap}>
                  {PRESET_WORKOUT_TIMES.map((preset) => {
                    const isSelected = format24h(inlineHour, inlineMinute, inlinePeriod) === preset.val;
                    return (
                      <TouchableOpacity
                        key={preset.val}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primarySubtle
                              : theme.colors.surface,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => {
                          Haptics.selection();
                          const parsed = parseTime(preset.val);
                          updateTimeInline(parsed.hour, parsed.minute, parsed.period);
                        }}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Test Notification Trigger Button */}
          <TouchableOpacity
            style={[
              styles.testAlertBtn,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.accent
              }
            ]}
            onPress={() => {
              Haptics.notification('success');
              triggerPreWorkoutReminder();
            }}
          >
            <BellIcon size={16} color={theme.colors.accent} />
            <Text style={[styles.testAlertBtnText, { color: theme.colors.accent }]}>
              Trigger Push Alert Test Banner
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Visual Theme Engine (Dark, Light, Alternative) */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <SparklesIcon size={20} color={theme.colors.gold} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Visual Theme Engine
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Select your preferred athletic palette. All screens, cards, and charts update in real time.
          </Text>

          <ThemeSelector />
        </View>

        {/* 3. Smart Rolling Grace Period */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <ShieldIcon size={20} color={theme.colors.warning} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Smart Rolling Grace Period
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            If you miss a scheduled session, it holds at Day 0 for this duration without breaking
            your streak. After this window expires, the workout target is automatically downgraded by
            25–30% to safely resume training.
          </Text>

          <View style={styles.gracePillsRow}>
            {[1, 2, 3, 4, 5, 7].map((days) => {
              const isSelected = profile.gracePeriodDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.gracePill,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                      borderColor: isSelected ? theme.colors.primaryLight : theme.colors.border
                    }
                  ]}
                  onPress={() => handleGraceChange(days)}
                >
                  <Text
                    style={[
                      styles.gracePillText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                    ]}
                  >
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Default Training Metric */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <RunnerIcon size={20} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Default Training Metric
            </Text>
          </View>

          <View style={styles.gracePillsRow}>
            {(['miles', 'km', 'minutes'] as WorkoutMetric[]).map((m) => {
              const isSelected = profile.activeMetric === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.gracePill,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                      borderColor: isSelected ? theme.colors.primaryLight : theme.colors.border
                    }
                  ]}
                  onPress={() => handleMetricChange(m)}
                >
                  <Text
                    style={[
                      styles.gracePillText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <TrashIcon size={20} color={theme.colors.danger} />
            <Text style={[styles.cardTitle, { color: theme.colors.danger }]}>
              Data Reset & Re-Calibration
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Clear all logged sessions, reset streak counters, and restore the initial 10K training
            preset schedule.
          </Text>

          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: theme.colors.danger }]}
            onPress={handleResetData}
          >
            <RefreshIcon size={16} color="#FFFFFF" />
            <Text style={styles.resetBtnText}>Reset All Data to Factory Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12
  },
  statusCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12
  },
  statusCalloutTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  statusCalloutSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15
  },
  subHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  leadTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  leadTimePill: {
    flex: 1,
    minWidth: 40,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  leadTimeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  inlinePickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12
  },
  inlinePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inlinePickerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1
  },
  inlinePickerTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  toggleExpandBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  toggleExpandBtnText: {
    fontSize: 11,
    fontWeight: '600'
  },
  pickerBody: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  pickerFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  pickerRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  hourPill: {
    width: 38,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hourPillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  minAndPeriodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4
  },
  minutePillsWrap: {
    flexDirection: 'row',
    gap: 6
  },
  minutePill: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  minutePillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  periodPillsWrap: {
    flexDirection: 'row',
    gap: 6
  },
  periodPill: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '800'
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600'
  },
  testAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10
  },
  testAlertBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  gracePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  gracePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  gracePillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 4
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
