import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckIcon } from './AppIcons';
import { useAppTheme } from '../store/useThemeStore';
import { THEME_PRESETS, ThemeId } from '../theme';
import { Haptics } from '../utils/haptics';

export const ThemeSelector: React.FC = () => {
  const { theme: currentTheme, themeId: currentThemeId, setTheme } = useAppTheme();

  const themesList = Object.values(THEME_PRESETS);

  return (
    <View style={styles.container}>
      {themesList.map((item) => {
        const isSelected = currentThemeId === item.id;
        const colors = item.colors;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            style={[
              styles.themeCard,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.border
              },
              isSelected && {
                borderWidth: 2,
                ...currentTheme.shadows.glowPrimary
              }
            ]}
            onPress={() => {
              Haptics.impact('medium');
              setTheme(item.id);
            }}
          >
            {/* Header: Icon, Name, Active Check */}
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.iconText}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.themeName,
                      { color: isSelected ? currentTheme.colors.textPrimary : currentTheme.colors.textSecondary }
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.themeDesc, { color: currentTheme.colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: currentTheme.colors.primary }
                  ]}
                >
                  <CheckIcon size={14} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Color Swatches Palette Preview */}
            <View
              style={[
                styles.swatchesContainer,
                {
                  backgroundColor: currentTheme.colors.surfaceSubtle,
                  borderColor: currentTheme.colors.border
                }
              ]}
            >
              <View style={styles.swatchItem}>
                <View style={[styles.swatchCircle, { backgroundColor: colors.background }]} />
                <Text style={[styles.swatchLabel, { color: currentTheme.colors.textMuted }]}>Bg</Text>
              </View>
              <View style={styles.swatchItem}>
                <View style={[styles.swatchCircle, { backgroundColor: colors.surface }]} />
                <Text style={[styles.swatchLabel, { color: currentTheme.colors.textMuted }]}>Surface</Text>
              </View>
              <View style={styles.swatchItem}>
                <View style={[styles.swatchCircle, { backgroundColor: colors.primary }]} />
                <Text style={[styles.swatchLabel, { color: currentTheme.colors.textMuted }]}>Primary</Text>
              </View>
              <View style={styles.swatchItem}>
                <View style={[styles.swatchCircle, { backgroundColor: colors.accent }]} />
                <Text style={[styles.swatchLabel, { color: currentTheme.colors.textMuted }]}>Accent</Text>
              </View>
              <View style={styles.swatchItem}>
                <View style={[styles.swatchCircle, { backgroundColor: colors.flame }]} />
                <Text style={[styles.swatchLabel, { color: currentTheme.colors.textMuted }]}>Flame</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 6
  },
  themeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 8
  },
  iconText: {
    fontSize: 22,
    marginTop: 2
  },
  themeName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2
  },
  themeDesc: {
    fontSize: 11,
    lineHeight: 15
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  swatchesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  swatchItem: {
    alignItems: 'center',
    gap: 4
  },
  swatchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  swatchLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase'
  }
});
