import React, {useEffect} from 'react';
import {AppState} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';
import {
  setupNotifee,
  setupForegroundHandler,
  requestNotificationPermission,
} from './src/utils/notifee';
import {navigate} from './src/navigation/navigationRef';
import RootNavigator from './src/navigation';

async function checkForActiveAlarm() {
  const displayed = await notifee.getDisplayedNotifications();
  if (displayed.length > 0 && displayed[0].notification.id) {
    const n = displayed[0].notification;
    const reps = parseInt(String(n.data?.reps ?? '10'), 10);
    navigate('AlarmFiring', {alarmId: n.id!, reps});
  }
}

export default function App() {
  useEffect(() => {
    setupNotifee();
    requestNotificationPermission();

    // Case 1: app killed → launched by fullScreenAction
    notifee.getInitialNotification().then(initial => {
      if (initial?.notification?.id) {
        const reps = parseInt(String(initial.notification.data?.reps ?? '10'), 10);
        navigate('AlarmFiring', {alarmId: initial.notification.id, reps});
      }
    });

    // Case 2: app backgrounded → fullScreenAction brings it to foreground
    checkForActiveAlarm();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkForActiveAlarm();
    });

    // Case 3: app already in foreground when alarm fires
    const unsub = setupForegroundHandler((alarmId, reps) => {
      navigate('AlarmFiring', {alarmId, reps});
    });

    return () => {
      sub.remove();
      unsub();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
