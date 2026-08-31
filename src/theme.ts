export type ThemeId = 'dark' | 'light' | 'alternative';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primarySubtle: string;
  accent: string;
  accentSubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  flame: string;
  flameSubtle: string;
  purple: string;
  purpleSubtle: string;
  pink: string;
  gold: string;
  goldSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  icon: string;
  colors: ThemeColors;
  typography: typeof BASE_TYPOGRAPHY;
  spacing: typeof BASE_SPACING;
  borderRadius: typeof BASE_BORDER_RADIUS;
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    glowPrimary: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    glowFlame: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const BASE_TYPOGRAPHY = {
  fontFamily: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const
  }
};

const BASE_SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

const BASE_BORDER_RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999
};

export const THEME_PRESETS: Record<ThemeId, ThemeDefinition> = {
  // 1. Dark Theme (Classic Athletic Charcoal & Slate Navy)
  dark: {
    id: 'dark',
    name: 'Dark (Classic Athletic)',
    description: 'Clean slate navy athletic dark mode with royal blue and active orange',
    icon: '🌙',
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSubtle: '#273449',
      surfaceElevated: '#334155',
      surfaceGlass: 'rgba(30, 41, 59, 0.94)',
      border: '#334155',
      borderLight: '#475569',
      borderFocus: '#3B82F6',
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      primaryLight: '#60A5FA',
      primarySubtle: 'rgba(59, 130, 246, 0.15)',
      accent: '#0EA5E9',
      accentSubtle: 'rgba(14, 165, 233, 0.15)',
      success: '#10B981',
      successSubtle: 'rgba(16, 185, 129, 0.15)',
      warning: '#F59E0B',
      warningSubtle: 'rgba(245, 158, 11, 0.15)',
      danger: '#EF4444',
      dangerSubtle: 'rgba(239, 68, 68, 0.15)',
      flame: '#EA580C',
      flameSubtle: 'rgba(234, 88, 12, 0.18)',
      purple: '#8B5CF6',
      purpleSubtle: 'rgba(139, 92, 246, 0.15)',
      pink: '#EC4899',
      gold: '#F59E0B',
      goldSubtle: 'rgba(245, 158, 11, 0.15)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textInverse: '#0F172A'
    },
    typography: BASE_TYPOGRAPHY,
    spacing: BASE_SPACING,
    borderRadius: BASE_BORDER_RADIUS,
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
        elevation: 2
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4
      },
      glowPrimary: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
        elevation: 4
      },
      glowFlame: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
        elevation: 4
      }
    }
  },

  // 2. Light Theme (Classic Clean Sport & Apple Health)
  light: {
    id: 'light',
    name: 'Light (Classic Sport)',
    description: 'Crisp porcelain white with classic athletic navy, cobalt, and energetic orange',
    icon: '☀️',
    colors: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceSubtle: '#F1F5F9',
      surfaceElevated: '#E2E8F0',
      surfaceGlass: 'rgba(255, 255, 255, 0.94)',
      border: '#E2E8F0',
      borderLight: '#CBD5E1',
      borderFocus: '#2563EB',
      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      primaryLight: '#3B82F6',
      primarySubtle: 'rgba(37, 99, 235, 0.10)',
      accent: '#0284C7',
      accentSubtle: 'rgba(2, 132, 199, 0.10)',
      success: '#059669',
      successSubtle: 'rgba(5, 150, 105, 0.12)',
      warning: '#D97706',
      warningSubtle: 'rgba(217, 119, 6, 0.12)',
      danger: '#DC2626',
      dangerSubtle: 'rgba(220, 38, 38, 0.12)',
      flame: '#EA580C',
      flameSubtle: 'rgba(234, 88, 12, 0.15)',
      purple: '#7C3AED',
      purpleSubtle: 'rgba(124, 58, 237, 0.10)',
      pink: '#DB2777',
      gold: '#D97706',
      goldSubtle: 'rgba(217, 119, 6, 0.12)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      textInverse: '#FFFFFF'
    },
    typography: BASE_TYPOGRAPHY,
    spacing: BASE_SPACING,
    borderRadius: BASE_BORDER_RADIUS,
    shadows: {
      sm: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 1
      },
      md: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3
      },
      glowPrimary: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 3
      },
      glowFlame: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 6,
        elevation: 3
      }
    }
  },

  // 3. Alternative Theme (Classic Varsity Track & Field)
  alternative: {
    id: 'alternative',
    name: 'Alternative (Varsity Track)',
    description: 'Collegiate track & field palette featuring rich Oxford navy, varsity crimson, and gold',
    icon: '🏃',
    colors: {
      background: '#0B132B',
      surface: '#1C2541',
      surfaceSubtle: '#263359',
      surfaceElevated: '#344473',
      surfaceGlass: 'rgba(28, 37, 65, 0.94)',
      border: '#263359',
      borderLight: '#3A4C80',
      borderFocus: '#E63946',
      primary: '#E63946',
      primaryHover: '#D62828',
      primaryLight: '#F26A76',
      primarySubtle: 'rgba(230, 57, 70, 0.15)',
      accent: '#48CAE4',
      accentSubtle: 'rgba(72, 202, 228, 0.15)',
      success: '#2A9D8F',
      successSubtle: 'rgba(42, 157, 143, 0.15)',
      warning: '#F4A261',
      warningSubtle: 'rgba(244, 162, 97, 0.15)',
      danger: '#E63946',
      dangerSubtle: 'rgba(230, 57, 70, 0.15)',
      flame: '#E76F51',
      flameSubtle: 'rgba(231, 111, 81, 0.18)',
      purple: '#8D99AE',
      purpleSubtle: 'rgba(141, 153, 174, 0.15)',
      pink: '#E63946',
      gold: '#E9C46A',
      goldSubtle: 'rgba(233, 196, 106, 0.18)',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#8D99AE',
      textInverse: '#0B132B'
    },
    typography: BASE_TYPOGRAPHY,
    spacing: BASE_SPACING,
    borderRadius: BASE_BORDER_RADIUS,
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.32,
        shadowRadius: 8,
        elevation: 4
      },
      glowPrimary: {
        shadowColor: '#E63946',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
        elevation: 4
      },
      glowFlame: {
        shadowColor: '#E76F51',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
        elevation: 4
      }
    }
  }
};

export const DEFAULT_THEME_ID: ThemeId = 'dark';
export const Theme = THEME_PRESETS[DEFAULT_THEME_ID];
