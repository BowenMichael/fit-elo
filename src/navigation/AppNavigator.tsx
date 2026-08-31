import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NotificationSimulator } from '../components/NotificationSimulator';
import { TabBar, TabScreen } from '../components/TabBar';
import { DashboardScreen } from '../screens/DashboardScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WorkoutQueueScreen } from '../screens/WorkoutQueueScreen';
import { useAppTheme, useThemeStore } from '../store/useThemeStore';
import { useWorkoutStore } from '../store/useWorkoutStore';

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabScreen>('dashboard');
  const { theme } = useAppTheme();
  const hydrateWorkout = useWorkoutStore((state) => state.hydrate);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

  useEffect(() => {
    hydrateWorkout();
    hydrateTheme();
  }, [hydrateWorkout, hydrateTheme]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'goals':
        return <GoalsScreen />;
      case 'queue':
        return <WorkoutQueueScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Active Screen View */}
      {renderActiveScreen()}

      {/* Floating Push Notification Banner Simulator */}
      <NotificationSimulator />

      {/* Glassmorphic Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
