import React, {useEffect} from 'react';
import {AppState, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import notifee from '@notifee/react-native';
import Purchases from 'react-native-purchases';
import {
  setupNotifee,
  setupForegroundHandler,
  requestNotificationPermission,
  scheduleNudge,
  cancelNudge,
  scheduleTrialWarnings,
  cancelTrialWarnings,
  ALARM_CHANNEL_ID,
  alarmParamsFromData,
} from './src/utils/notifee';
import {initializePurchases, isPro} from './src/utils/revenuecat';
import {useSubscriptionStore} from './src/store/subscriptionStore';
import {navigate} from './src/navigation/navigationRef';
import RootNavigator from './src/navigation';
import {useThemeStore} from './src/store/themeStore';
import {DarkTheme, LightTheme} from './src/theme';
import {useBankStore} from './src/store/bankStore';
import {useSettingsStore} from './src/store/settingsStore';
import {shallow} from 'zustand/shallow';
import LevelUpModal from './src/components/LevelUpModal';


async function checkForActiveAlarm() {
  const displayed = await notifee.getDisplayedNotifications();
  const alarm = displayed.find(n => n.notification.android?.channelId === ALARM_CHANNEL_ID);
  if (alarm?.notification.id) {
    const n = alarm.notification;
    navigate('AlarmFiring', alarmParamsFromData(n.id!, n.data as Record<string, string>));
  }
}

export default function App() {
  const systemScheme = useColorScheme();
  const {mode} = useThemeStore();
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const todayReps = useBankStore(s => s.todayReps);
  const {nudgeEnabled, nudgeHour, nudgeMinute} = useSettingsStore(
    s => ({nudgeEnabled: s.nudgeEnabled, nudgeHour: s.nudgeHour, nudgeMinute: s.nudgeMinute}),
    shallow,
  );
  const {trialStartedAt, isSubscribed, setSubscribed} = useSubscriptionStore();

  useEffect(() => {
    if (!nudgeEnabled || todayReps > 0) {
      cancelNudge();
    } else {
      scheduleNudge(nudgeHour, nudgeMinute);
    }
  }, [nudgeEnabled, nudgeHour, nudgeMinute, todayReps]);

  useEffect(() => {
    if (trialStartedAt) {
      scheduleTrialWarnings(trialStartedAt);
    } else {
      cancelTrialWarnings();
    }
  }, [trialStartedAt]);

  useEffect(() => {
    initializePurchases();
    const onUpdate = (info: any) => setSubscribed(isPro(info));
    Purchases.addCustomerInfoUpdateListener(onUpdate);
    return () => Purchases.removeCustomerInfoUpdateListener(onUpdate);
  }, []);

  useEffect(() => {
    setupNotifee();
    requestNotificationPermission();

    notifee.getInitialNotification().then(initial => {
      if (initial?.notification?.id) {
        const n = initial.notification;
        navigate('AlarmFiring', alarmParamsFromData(n.id!, n.data as Record<string, string>));
      }
    });

    checkForActiveAlarm();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkForActiveAlarm();
    });

    const unsub = setupForegroundHandler((alarmId, reps, sound, volume, snoozeCount) => {
      navigate('AlarmFiring', {alarmId, reps, sound, volume, snoozeCount});
    });

    return () => {
      sub.remove();
      unsub();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <RootNavigator />
        <LevelUpModal />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
