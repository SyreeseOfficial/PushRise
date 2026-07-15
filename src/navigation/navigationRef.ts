import {createNavigationContainerRef} from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  AlarmFiring: {alarmId: string; reps: number; sound: string; volume: number};
  AddAlarm: {alarmId?: string} | undefined;
  BankCamera: undefined;
  Permissions: undefined;
  Paywall: undefined;
  Downsell1: undefined;
  Downsell2: undefined;
  Settings: undefined;
};

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
    return;
  }
  // Nav not ready yet (cold launch) — wait for it
  const interval = setInterval(() => {
    if (navigationRef.isReady()) {
      clearInterval(interval);
      navigationRef.navigate(name as any, params);
    }
  }, 100);
}
