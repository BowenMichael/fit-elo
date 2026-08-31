import { useThemeStore } from '../useThemeStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null)
}));

describe('useThemeStore (3 Traditional Themes: Dark, Light, Alternative)', () => {
  beforeEach(() => {
    useThemeStore.getState().setTheme('dark');
  });

  it('initializes with Dark (Classic Athletic) default theme', () => {
    const state = useThemeStore.getState();
    expect(state.themeId).toBe('dark');
    expect(state.theme.name).toContain('Dark');
    expect(state.theme.colors.background).toBe('#0F172A');
    expect(state.theme.colors.primary).toBe('#3B82F6');
  });

  it('switches to Light (Classic Sport) theme with clean porcelain and athletic blue', () => {
    useThemeStore.getState().setTheme('light');
    const state = useThemeStore.getState();
    expect(state.themeId).toBe('light');
    expect(state.theme.name).toContain('Light');
    expect(state.theme.colors.background).toBe('#F8FAFC');
    expect(state.theme.colors.primary).toBe('#2563EB');
  });

  it('switches to Alternative (Varsity Track) theme with collegiate Oxford navy & crimson', () => {
    useThemeStore.getState().setTheme('alternative');
    const state = useThemeStore.getState();
    expect(state.themeId).toBe('alternative');
    expect(state.theme.name).toContain('Alternative');
    expect(state.theme.colors.background).toBe('#0B132B');
    expect(state.theme.colors.primary).toBe('#E63946');
  });
});
