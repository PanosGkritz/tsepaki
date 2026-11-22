export type ThemeMode = 'system' | 'dark' | 'light';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentBright: string;
  warning: string;
  danger: string;
  neutral: string;
  onAccent: string;
};

export const darkColors: ThemeColors = {
  background: '#0E0F12',
  surface: '#17191E',
  surfaceRaised: '#1F2228',
  border: '#2A2D34',
  text: '#F2F2F0',
  textMuted: '#A0A3AB',
  accent: '#1F6F54',
  accentBright: '#4CC38A',
  warning: '#F5A35C',
  danger: '#E5484D',
  neutral: '#5B5F68',
  onAccent: '#FFFFFF',
};

export const lightColors: ThemeColors = {
  background: '#F6F6F3',
  surface: '#FFFFFF',
  surfaceRaised: '#EEEEEA',
  border: '#E2E2DD',
  text: '#141516',
  textMuted: '#6B6E76',
  accent: '#1F6F54',
  accentBright: '#17784F',
  warning: '#B4500B',
  danger: '#D93D42',
  neutral: '#8E9097',
  onAccent: '#FFFFFF',
};

// Παλιό όνομα: μένει μέχρι να περάσουν όλες οι οθόνες στο useTheme().
export const colors = darkColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 12, md: 20, lg: 28, full: 999 } as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;