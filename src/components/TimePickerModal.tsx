import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CheckIcon, ClockIcon, CloseIcon } from './AppIcons';
import { useAppTheme } from '../store/useThemeStore';
import { Haptics } from '../utils/haptics';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string; // "07:00" in HH:mm (24h)
  onClose: () => void;
  onSave: (formatted24h: string) => void;
}

const PRESET_TIMES = [
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

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime = '07:00',
  onClose,
  onSave
}) => {
  const { theme } = useAppTheme();

  // Parse initial HH:mm to 12h hour, minute, am/pm
  const parseTime = (timeStr: string) => {
    const [hStr, mStr] = (timeStr || '07:00').split(':');
    let h = parseInt(hStr, 10) || 7;
    const m = parseInt(mStr, 10) || 0;
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { hour: h, minute: m, period };
  };

  const initial = parseTime(initialTime);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initial.period);

  React.useEffect(() => {
    if (visible) {
      const parsed = parseTime(initialTime);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [visible, initialTime]);

  const format24h = (h: number, m: number, p: 'AM' | 'PM') => {
    let hour24 = h;
    if (p === 'AM' && h === 12) hour24 = 0;
    else if (p === 'PM' && h !== 12) hour24 += 12;
    const hh = hour24.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSave = () => {
    Haptics.notification('success');
    const result24h = format24h(selectedHour, selectedMinute, selectedPeriod);
    onSave(result24h);
    onClose();
  };

  const handleSelectPreset = (presetVal: string) => {
    Haptics.selection();
    const parsed = parseTime(presetVal);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  };

  const display12h = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;
  const display24h = format24h(selectedHour, selectedMinute, selectedPeriod);

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
                Preferred Workout Time
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                Set your daily training time for reminders
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Big Time Display Hero */}
            <View
              style={[
                styles.timeHero,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.primary,
                  ...theme.shadows.glowPrimary
                }
              ]}
            >
              <ClockIcon size={28} color={theme.colors.primary} />
              <Text style={[styles.timeHeroText, { color: theme.colors.textPrimary }]}>
                {display12h}
              </Text>
              <Text style={[styles.timeHeroSub, { color: theme.colors.textMuted }]}>
                ({display24h} Military)
              </Text>
            </View>

            {/* Interactive Selectors: Hour, Minute, AM/PM */}
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              SELECT HOUR
            </Text>
            <View style={styles.pickerRow}>
              {[5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4].map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.numberPill,
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
                      setSelectedHour(h);
                    }}
                  >
                    <Text
                      style={[
                        styles.numberPillText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Minute Selector */}
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              SELECT MINUTE
            </Text>
            <View style={styles.pickerRow}>
              {[0, 15, 30, 45].map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.minutePill,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.surfaceSubtle,
                        borderColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.border
                      }
                    ]}
                    onPress={() => {
                      Haptics.selection();
                      setSelectedMinute(m);
                    }}
                  >
                    <Text
                      style={[
                        styles.numberPillText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      :{m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* AM / PM Toggle */}
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              PERIOD
            </Text>
            <View style={styles.periodRow}>
              {(['AM', 'PM'] as const).map((p) => {
                const isSelected = selectedPeriod === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodBtn,
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
                      setSelectedPeriod(p);
                    }}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary }
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Presets */}
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              QUICK ATHLETIC PRESETS
            </Text>
            <View style={styles.presetsRow}>
              {PRESET_TIMES.map((preset) => {
                const isCurrent = display24h === preset.val;
                return (
                  <TouchableOpacity
                    key={preset.val}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isCurrent
                          ? theme.colors.primarySubtle
                          : theme.colors.surfaceSubtle,
                        borderColor: isCurrent ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => handleSelectPreset(preset.val)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isCurrent ? theme.colors.primary : theme.colors.textSecondary }
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: theme.colors.primary,
                  ...theme.shadows.glowPrimary
                }
              ]}
              onPress={handleSave}
            >
              <CheckIcon size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Confirm Workout Time ({display12h})</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '90%'
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
    marginBottom: 14
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
  timeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16
  },
  timeHeroText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  timeHeroSub: {
    fontSize: 12
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  numberPill: {
    width: 48,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  minutePill: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  numberPillText: {
    fontSize: 14,
    fontWeight: '700'
  },
  periodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14
  },
  periodBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '800'
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600'
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
