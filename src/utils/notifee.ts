import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AlarmType,
  EventType,
} from '@notifee/react-native';
import type {TimestampTrigger} from '@notifee/react-native';
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
  if (Platform.OS === 'android' && Platform.Version >= 34) {
    const settings = await notifee.getNotificationSettings();
    if (!settings.android.fullScreenIntent) {
      Linking.openSettings();
    }
  }
}

function nextOccurrence(hour: number, minute: number, days: number[]): Date {
  const now = new Date();
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    if (candidate > now && (days.length === 0 || days.includes(candidate.getDay()))) {
      return candidate;
    }
  }
  // fallback: same time next week (shouldn't happen for valid recurring config)
  const fallback = new Date(now);
  fallback.setDate(now.getDate() + 7);
  fallback.setHours(hour, minute, 0, 0);
  return fallback;
}

export async function scheduleAlarm(alarm: {
  id: string;
  hour: number;
  minute: number;
  reps: number;
  label: string;
  days: number[];
  volume: number;
  sound: string;
}) {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextOccurrence(alarm.hour, alarm.minute, alarm.days).getTime(),
    alarmManager: {type: AlarmType.SET_ALARM_CLOCK},
  };

  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: 'Time to wake up.',
      body: `Do ${alarm.reps} push-ups to dismiss`,
      data: {
        reps: String(alarm.reps),
        sound: alarm.sound,
        volume: String(alarm.volume),
      },
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

// Use this for recurring alarms after rescheduling — cancelAlarm would kill the new trigger
export async function dismissFiredAlarm(id: string) {
  await notifee.cancelNotification(id);
}

export function setupForegroundHandler(
  onAlarmFired: (alarmId: string, reps: number, sound: string, volume: number) => void,
) {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const id = detail.notification?.id;
      const data = detail.notification?.data ?? {};
      const reps = parseInt(String(data.reps ?? '10'), 10);
      const sound = String(data.sound ?? 'alarm.mp3');
      const volume = parseFloat(String(data.volume ?? '1.0'));
      if (id) onAlarmFired(id, reps, sound, volume);
    }
  });
}
