import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createMMKV} from 'react-native-mmkv';
import {scheduleAlarm, cancelAlarm} from '../utils/notifee';

const storage = createMMKV();
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  reps: number;
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun..6=Sat, empty = one-time
  volume: number; // 0–1
  sound: string;  // bundled filename, e.g. 'alarm.mp3'
}

interface AlarmStore {
  alarms: Alarm[];
  addAlarm: (data: Omit<Alarm, 'id' | 'enabled'>) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
}

export const useAlarmStore = create<AlarmStore>()(persist((set, get) => ({
  alarms: [],

  addAlarm: async data => {
    const alarm: Alarm = {
      volume: 1.0,
      sound: 'alarm.mp3',
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
}), {name: 'alarms', storage: mmkvStorage}));
