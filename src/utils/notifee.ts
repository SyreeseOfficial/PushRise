import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AlarmType,
  EventType,
} from '@notifee/react-native';
import type {TimestampTrigger} from '@notifee/react-native';
import {getDailyChallenge} from './engagement';

export const ALARM_CHANNEL_ID = 'pushrise-alarm';

export function alarmParamsFromData(id: string, data?: Record<string, string>) {
  return {
    alarmId: id,
    reps: parseInt(String(data?.reps ?? '10'), 10),
    sound: String(data?.sound ?? 'alarm.mp3'),
    volume: parseFloat(String(data?.volume ?? '1.0')),
    snoozeCount: parseInt(String(data?.snoozeCount ?? '0'), 10),
  };
}
const NUDGE_CHANNEL_ID = 'pushrise-nudge';
export const NUDGE_NOTIF_ID = 'daily-nudge';
export const RIVAL_NOTIF_ID = 'rival-notif';
export const DAILY_CHALLENGE_NOTIF_ID = 'daily-challenge';

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
  await notifee.createChannel({
    id: NUDGE_CHANNEL_ID,
    name: 'Reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission() {
  await notifee.requestPermission();
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
  onAlarmFired: (alarmId: string, reps: number, sound: string, volume: number, snoozeCount: number) => void,
) {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.DELIVERED || type === EventType.PRESS) {
      const n = detail.notification;
      if (n?.android?.channelId !== ALARM_CHANNEL_ID) return;
      const id = n?.id;
      if (!id) return;
      const p = alarmParamsFromData(id, n.data as Record<string, string>);
      onAlarmFired(p.alarmId, p.reps, p.sound, p.volume, p.snoozeCount);
    }
  });
}

export async function scheduleSnoozeAlarm(
  alarmId: string, reps: number, sound: string, volume: number, snoozeCount: number, minutes: number,
) {
  await notifee.cancelNotification(alarmId);
  await notifee.createTriggerNotification(
    {
      id: alarmId,
      title: 'Time to wake up.',
      body: `Do ${reps} push-ups to dismiss`,
      data: {reps: String(reps), sound, volume: String(volume), snoozeCount: String(snoozeCount)},
      android: {
        channelId: ALARM_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {id: 'default'},
        vibrationPattern: [500, 500],
        ongoing: true,
        autoCancel: false,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + minutes * 60 * 1000,
      alarmManager: {type: AlarmType.SET_ALARM_CLOCK},
    } as TimestampTrigger,
  );
}

// ─── Daily Nudge ─────────────────────────────────────────────────────────────

const NUDGE_MESSAGES = [
  "Still 0 push-ups today. Your streak is waiting.",
  "Zero reps so far. Tomorrow-you will judge today-you.",
  "No push-ups yet. The alarm fires whether you're ready or not.",
  "You haven't done a single push-up today. Come on.",
];

export async function scheduleNudge(hour: number, minute: number) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const body = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
  await notifee.cancelTriggerNotification(NUDGE_NOTIF_ID);
  await notifee.createTriggerNotification(
    {
      id: NUDGE_NOTIF_ID,
      title: 'PushRise',
      body,
      android: {channelId: NUDGE_CHANNEL_ID},
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: target.getTime(),
      alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE},
    } as TimestampTrigger,
  );
}

export async function cancelNudge() {
  await notifee.cancelTriggerNotification(NUDGE_NOTIF_ID);
  await notifee.cancelNotification(NUDGE_NOTIF_ID);
}

// ─── Trial Warning Notifications ─────────────────────────────────────────────

export async function scheduleTrialWarnings(trialStartedAt: number) {
  const warnings = [
    {id: 'trial-warn-5', daysOffset: 5, title: '2 days left on your trial.', body: 'Keep dismissing alarms with push-ups — upgrade to lock it in.'},
    {id: 'trial-warn-7', daysOffset: 7, title: 'Your trial ends today.', body: 'Upgrade now to keep the push-up mechanic.'},
  ] as const;

  for (const {id, daysOffset, title, body} of warnings) {
    const target = new Date(trialStartedAt + daysOffset * 86_400_000);
    target.setHours(9, 0, 0, 0);
    if (target.getTime() <= Date.now()) continue;

    await notifee.cancelTriggerNotification(id);
    await notifee.createTriggerNotification(
      {id, title, body, android: {channelId: NUDGE_CHANNEL_ID}},
      {type: TriggerType.TIMESTAMP, timestamp: target.getTime(), alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE}} as TimestampTrigger,
    );
  }
}

export async function cancelTrialWarnings() {
  await notifee.cancelTriggerNotification('trial-warn-5');
  await notifee.cancelTriggerNotification('trial-warn-7');
}

// ─── Anonymous Rival ─────────────────────────────────────────────────────────

const RIVAL_NAMES = [
  'Marcus T.', 'Jordan B.', 'Wei L.', 'Arjun K.', 'Sofia M.',
  'Camila R.', 'Diego F.', 'Priya S.', 'Luca R.', 'Kofi A.',
];

// ─── Daily Challenge ─────────────────────────────────────────────────────────

export async function scheduleDailyChallengeNotif() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const {target, deadlineHour, accepted} = getDailyChallenge(tomorrowStr);

  const h = deadlineHour;
  const deadlineStr = h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`;

  const fireAt = new Date(`${tomorrowStr}T08:00:00`);

  await notifee.cancelTriggerNotification(DAILY_CHALLENGE_NOTIF_ID);
  await notifee.createTriggerNotification(
    {
      id: DAILY_CHALLENGE_NOTIF_ID,
      title: "Today's Challenge 🎯",
      body: `${target} push-ups before ${deadlineStr}. ${accepted.toLocaleString()} people accepted.`,
      android: {channelId: NUDGE_CHANNEL_ID},
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt.getTime(),
      alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE},
    } as TimestampTrigger,
  );
}

export async function scheduleRivalNotif(userReps: number) {
  const rivalReps = userReps + Math.floor(Math.random() * 8 + 1);
  const name = RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)];
  const delayMs = (Math.floor(Math.random() * 60) + 30) * 60 * 1000; // 30–90 min

  const messages = [
    `${name} just passed you with ${rivalReps} reps. You're now #4. 👀`,
    `Leaderboard update: ${name} is ahead of you by ${rivalReps - userReps} rep${rivalReps - userReps > 1 ? 's' : ''}.`,
    `${name} just overtook you. You've dropped to #4.`,
    `You've been passed. ${name} is now #3 with ${rivalReps} reps.`,
  ];
  const body = messages[Math.floor(Math.random() * messages.length)];

  await notifee.cancelTriggerNotification(RIVAL_NOTIF_ID);
  await notifee.createTriggerNotification(
    {
      id: RIVAL_NOTIF_ID,
      title: 'Leaderboard Update',
      body,
      android: {channelId: NUDGE_CHANNEL_ID},
    },
    {type: TriggerType.TIMESTAMP, timestamp: Date.now() + delayMs},
  );
}

