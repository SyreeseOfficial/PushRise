import {MD3DarkTheme, MD3LightTheme} from 'react-native-paper';

// M3 color scheme generated from #FF6B00 (orange) seed
const darkColors = {
  primary: '#FFB68D',
  onPrimary: '#4E1B00',
  primaryContainer: '#6E2900',
  onPrimaryContainer: '#FFDBCC',
  secondary: '#E7BEAA',
  onSecondary: '#432A1B',
  secondaryContainer: '#5C3F2E',
  onSecondaryContainer: '#FFDBCC',
  tertiary: '#C5C94A',
  onTertiary: '#2E3200',
  tertiaryContainer: '#444800',
  onTertiaryContainer: '#E1E559',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1A1110',
  onBackground: '#EDE0DB',
  surface: '#1A1110',
  onSurface: '#EDE0DB',
  surfaceVariant: '#53443D',
  onSurfaceVariant: '#D8C2BA',
  outline: '#A08D86',
  outlineVariant: '#53443D',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#EDE0DB',
  inverseOnSurface: '#342E2B',
  inversePrimary: '#8A3500',
  surfaceDisabled: 'rgba(237,224,219,0.12)',
  onSurfaceDisabled: 'rgba(237,224,219,0.38)',
  backdrop: 'rgba(47,31,26,0.5)',
};

const lightColors = {
  primary: '#8A3500',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDBCC',
  onPrimaryContainer: '#300D00',
  secondary: '#755848',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDBCC',
  onSecondaryContainer: '#2C1708',
  tertiary: '#5B6000',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#E1E559',
  onTertiaryContainer: '#191D00',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFFBFF',
  onBackground: '#1F1B18',
  surface: '#FFFBFF',
  onSurface: '#1F1B18',
  surfaceVariant: '#F5DED5',
  onSurfaceVariant: '#53443D',
  outline: '#85736D',
  outlineVariant: '#D8C2BA',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#342E2B',
  inverseOnSurface: '#FAEEE8',
  inversePrimary: '#FFB68D',
  surfaceDisabled: 'rgba(31,27,24,0.12)',
  onSurfaceDisabled: 'rgba(31,27,24,0.38)',
  backdrop: 'rgba(62,44,37,0.5)',
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {...MD3DarkTheme.colors, ...darkColors},
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: {...MD3LightTheme.colors, ...lightColors},
};

export type AppTheme = typeof LightTheme;
