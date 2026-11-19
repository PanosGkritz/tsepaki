import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import type { ThemeColors } from '../constants/theme';
import { useTheme } from '../providers/PreferencesProvider';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const createStyles =
  <T extends NamedStyles<T>>(factory: (colors: ThemeColors) => T) =>
  () => {
    const colors = useTheme();
    return useMemo(() => factory(colors), [colors]);
  };