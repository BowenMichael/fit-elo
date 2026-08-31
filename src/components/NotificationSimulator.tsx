import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertIcon, BellIcon, CloseIcon, FlameIcon, TrophyIcon, ZapIcon } from './AppIcons';
import { useAppTheme } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Haptics } from '../utils/haptics';

export const NotificationSimulator: React.FC = () => {
  const { theme } = useAppTheme();
  const activeNotification = useWorkoutStore((state) => state.activeNotification);
  const dismissNotification = useWorkoutStore((state) => state.dismissNotification);

  useEffect(() => {
    if (activeNotification) {
      Haptics.notification('warning');
      const timer = setTimeout(() => {
        dismissNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  if (!activeNotification) return null;

  const getNotificationIcon = () => {
    switch (activeNotification.type) {
      case 'grace_warning':
        return <AlertIcon size={22} color={theme.colors.warning} />;
      case 'grace_expired':
        return <ZapIcon size={22} color={theme.colors.danger} />;
      case 'streak_milestone':
        return <FlameIcon size={22} color={theme.colors.flame} />;
      case 'rank_up':
        return <TrophyIcon size={22} color={theme.colors.gold} />;
      case 'reminder':
      default:
        return <BellIcon size={22} color={theme.colors.accent} />;
    }
  };

  const getBorderColor = () => {
    switch (activeNotification.type) {
      case 'grace_warning':
        return theme.colors.warning;
      case 'grace_expired':
        return theme.colors.danger;
      case 'streak_milestone':
        return theme.colors.flame;
      case 'rank_up':
        return theme.colors.gold;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.floatingContainer}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.surfaceGlass,
            borderColor: getBorderColor(),
            ...theme.shadows.md
          }
        ]}
        onPress={() => {
          Haptics.impact('light');
          dismissNotification();
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceSubtle }]}>
          {getNotificationIcon()}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.simulatorTag, { color: theme.colors.accent }]}>
              iOS PUSH SIMULATOR
            </Text>
            <Text style={[styles.timeTag, { color: theme.colors.textMuted }]}>Now</Text>
          </View>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {activeNotification.title}
          </Text>
          <Text
            style={[styles.message, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {activeNotification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            Haptics.impact('light');
            dismissNotification();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center'
  },
  banner: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  content: {
    flex: 1,
    paddingRight: 4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  simulatorTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  timeTag: {
    fontSize: 10
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  message: {
    fontSize: 12,
    lineHeight: 16
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4
  }
});
