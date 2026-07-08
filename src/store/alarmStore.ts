import {create} from 'zustand';
import {scheduleAlarm, cancelAlarm} from '../utils/notifee';

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  reps: number;
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun..6=Sat, empty = one-time
}

interface AlarmStore {
  alarms: Alarm[];
  addAlarm: (data: Omit<Alarm, 'id' | 'enabled'>) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
}

// ponytail: no persistence — OS AlarmManager keeps alarms alive; add MMKV back once Nitro links cleanly
export const useAlarmStore = create<AlarmStore>()((set, get) => ({
  alarms: [],

  addAlarm: async data => {
    const alarm: Alarm = {
      ...data,
      id: Date.now().toString(),
      enabled: true,
    };
    set(s => ({alarms: [...s.alarms, alarm]}));
    await scheduleAlarm(alarm);
  },

  toggleAlarm: async id => {
    const alarm = get().alarms.find(a => a.id === id);
    if (!alarm) return;
    const enabled = !alarm.enabled;
    set(s => ({
      alarms: s.alarms.map(a => (a.id === id ? {...a, enabled} : a)),
    }));
    if (enabled) {
      await scheduleAlarm(alarm);
    } else {
      await cancelAlarm(id);
    }
  },

  deleteAlarm: async id => {
    await cancelAlarm(id);
    set(s => ({alarms: s.alarms.filter(a => a.id !== id)}));
  },
}));
