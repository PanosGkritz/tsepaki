export const colors = {
  background: '#0E0F12',
  surface: '#17191E',
  surfaceRaised: '#1F2228',
  border: '#2A2D34',
  text: '#F2F2F0',
  textMuted: '#A0A3AB',
  accent: '#1F6F54',
  accentBright: '#4CC38A',
  warning: '#F5A35C',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 12, md: 20, lg: 28, full: 999 } as const;
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;