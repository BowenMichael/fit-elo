import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarIcon, ChartIcon, FlameIcon, SettingsIcon, TrophyIcon } from './AppIcons';
import { useAppTheme } from '../store/useThemeStore';
import { Haptics } from '../utils/haptics';

export type TabScreen = 'dashboard' | 'goals' | 'queue' | 'history' | 'settings';

interface TabBarProps {
  activeTab: TabScreen;
  onTabChange: (tab: TabScreen) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useAppTheme();

  const tabs: { key: TabScreen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: (active) => (
        <FlameIcon
          size={21}
          color={active ? theme.colors.flame : theme.colors.textMuted}
        />
      )
    },
    {
      key: 'goals',
      label: 'Goals',
      icon: (active) => (
        <TrophyIcon
          size={21}
          color={active ? theme.colors.gold : theme.colors.textMuted}
        />
      )
    },
    {
      key: 'queue',
      label: 'Queue',
      icon: (active) => (
        <CalendarIcon
          size={21}
          color={active ? theme.colors.primary : theme.colors.textMuted}
        />
      )
    },
    {
      key: 'history',
      label: 'History',
      icon: (active) => (
        <ChartIcon
          size={21}
          color={active ? theme.colors.accent : theme.colors.textMuted}
        />
      )
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: (active) => (
        <SettingsIcon
          size={21}
          color={active ? theme.colors.primary : theme.colors.textMuted}
        />
      )
    }
  ];

  return (
    <View style={styles.tabContainer}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surfaceGlass,
            borderColor: theme.colors.border,
            ...theme.shadows.md
          }
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => {
                Haptics.selection();
                onTabChange(tab.key);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>{tab.icon(isActive)}</View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? tab.key === 'dashboard'
                        ? theme.colors.flame
                        : tab.key === 'goals'
                        ? theme.colors.gold
                        : theme.colors.primaryLight
                      : theme.colors.textMuted,
                    fontWeight: isActive ? '700' : '600'
                  }
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeDot,
                    {
                      backgroundColor:
                        tab.key === 'dashboard'
                          ? theme.colors.flame
                          : tab.key === 'goals'
                          ? theme.colors.gold
                          : theme.colors.primary
                    }
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16
  },
  tabBar: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  iconWrap: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 10
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  }
});
