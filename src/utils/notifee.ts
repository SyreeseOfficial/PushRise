import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AlarmType,
  EventType,
} from '@notifee/react-native';
import type { TimestampTrigger } from '@notifee/react-native';
import {Linking, Platform} from 'react-native';

export const ALARM_CHANNEL_ID = 'pushrise-alarm';

export async function setupNotifee() {
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: 'Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    vibrationPattern: [500, 500],
    bypassDnd: true,
    lights: true,
  });
}

export async function requestNotificationPermission() {
  await notifee.requestPermission();
  // Android 14+ requires explicit USE_FULL_SCREEN_INTENT grant via Settings
  if (Platform.OS === 'android' && Platform.Version >= 34) {
    const settings = await notifee.getNotificationSettings();
    if (!settings.android.fullScreenIntent) {
      Linking.openSettings();
    }
  }
}

export async function scheduleAlarm(alarm: {
  id: string;
  hour: number;
  minute: number;
  reps: number;
  label: string;
}) {
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(alarm.hour, alarm.minute, 0, 0);

  // If time is in the past, schedule for tomorrow
  if (alarmTime.getTime() <= now.getTime()) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: alarmTime.getTime(),
    alarmManager: {
      type: AlarmType.SET_ALARM_CLOCK,
    },
  };

  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: 'Time to wake up.',
      body: `Do ${alarm.reps} push-ups to dismiss`,
      data: {reps: String(alarm.reps)},
      android: {
        channelId: ALARM_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {id: 'default'},
        vibrationPattern: [500, 500],
        ongoing: true,
        autoCancel: false,
      },
    },
    trigger,
  );
}

export async function cancelAlarm(id: string) {
  await notifee.cancelTriggerNotification(id);
  await notifee.cancelNotification(id);
}

export function setupForegroundHandler(
  onAlarmFired: (alarmId: string, reps: number) => void,
) {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const id = detail.notification?.id;
      const reps = parseInt(String(detail.notification?.data?.reps ?? '10'), 10);
      if (id) onAlarmFired(id, reps);
    }
  });
}
