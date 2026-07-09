import {MD3DarkTheme, MD3LightTheme} from 'react-native-paper';

// Clean modern palette — pure white/black backgrounds, vibrant orange accent
const lightColors = {
  primary: '#FF5500',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFE8DC',
  onPrimaryContainer: '#2D1100',
  secondary: '#FF7A30',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFE8DC',
  onSecondaryContainer: '#2D1100',
  tertiary: '#6750A4',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#EADDFF',
  onTertiaryContainer: '#21005D',
  error: '#FF3B30',
  onError: '#FFFFFF',
  errorContainer: '#FFEDE9',
  onErrorContainer: '#410002',
  background: '#FFFFFF',
  onBackground: '#111111',
  surface: '#FFFFFF',
  onSurface: '#111111',
  surfaceVariant: '#F5F5F5',
  onSurfaceVariant: '#757575',
  outline: '#E0E0E0',
  outlineVariant: '#EBEBEB',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#111111',
  inverseOnSurface: '#F5F5F5',
  inversePrimary: '#FF7A30',
  surfaceDisabled: 'rgba(17,17,17,0.12)',
  onSurfaceDisabled: 'rgba(17,17,17,0.38)',
  backdrop: 'rgba(0,0,0,0.55)',
};

const darkColors = {
  primary: '#FF7040',
  onPrimary: '#000000',
  primaryContainer: '#3D1800',
  onPrimaryContainer: '#FF9A6C',
  secondary: '#FF9A6C',
  onSecondary: '#000000',
  secondaryContainer: '#2D1100',
  onSecondaryContainer: '#FF9A6C',
  tertiary: '#CFBCFF',
  onTertiary: '#21005D',
  tertiaryContainer: '#381E72',
  onTertiaryContainer: '#EADDFF',
  error: '#FF453A',
  onError: '#000000',
  errorContainer: '#3D0000',
  onErrorContainer: '#FF9289',
  background: '#000000',
  onBackground: '#FFFFFF',
  surface: '#1C1C1E',
  onSurface: '#FFFFFF',
  surfaceVariant: '#2C2C2E',
  onSurfaceVariant: '#AEAEB2',
  outline: '#3A3A3C',
  outlineVariant: '#2C2C2E',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#111111',
  inversePrimary: '#FF5500',
  surfaceDisabled: 'rgba(255,255,255,0.12)',
  onSurfaceDisabled: 'rgba(255,255,255,0.38)',
  backdrop: 'rgba(0,0,0,0.75)',
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: {...MD3LightTheme.colors, ...lightColors},
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {...MD3DarkTheme.colors, ...darkColors},
};

// Brand gradient used on hero cards, FABs, and CTAs
export const BRAND_GRADIENT = {
  colors: ['#FF6B00', '#FF2D00'] as string[],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
};

// Card shadow utility — use in light mode for floating effect
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: {width: 0, height: 4},
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 3,
};

export type AppTheme = typeof LightTheme;
