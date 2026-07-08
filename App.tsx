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

function alarmParamsFromData(id: string, data?: Record<string, string>) {
  return {
    alarmId: id,
    reps: parseInt(String(data?.reps ?? '10'), 10),
    sound: String(data?.sound ?? 'alarm.mp3'),
    volume: parseFloat(String(data?.volume ?? '1.0')),
  };
}

async function checkForActiveAlarm() {
  const displayed = await notifee.getDisplayedNotifications();
  if (displayed.length > 0 && displayed[0].notification.id) {
    const n = displayed[0].notification;
    navigate('AlarmFiring', alarmParamsFromData(n.id!, n.data as Record<string, string>));
  }
}

export default function App() {
  useEffect(() => {
    setupNotifee();
    requestNotificationPermission();

    // Case 1: app killed → launched by fullScreenAction
    notifee.getInitialNotification().then(initial => {
      if (initial?.notification?.id) {
        const n = initial.notification;
        navigate('AlarmFiring', alarmParamsFromData(n.id!, n.data as Record<string, string>));
      }
    });

    // Case 2: app backgrounded → fullScreenAction brings it to foreground
    checkForActiveAlarm();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkForActiveAlarm();
    });

    // Case 3: app already in foreground when alarm fires
    const unsub = setupForegroundHandler((alarmId, reps, sound, volume) => {
      navigate('AlarmFiring', {alarmId, reps, sound, volume});
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
