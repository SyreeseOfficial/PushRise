import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {scheduleAlarm, cancelAlarm} from '../utils/notifee';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage();

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
  updateAlarm: (id: string, data: Omit<Alarm, 'id' | 'enabled'>) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  reorderAlarmToIndex: (id: string, toIndex: number) => void;
  reset: () => Promise<void>;
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

  updateAlarm: async (id, data) => {
    const existing = get().alarms.find(a => a.id === id);
    if (!existing) return;
    const alarm = {...existing, ...data};
    set(s => ({alarms: s.alarms.map(a => a.id === id ? alarm : a)}));
    await cancelAlarm(id);
    if (alarm.enabled) await scheduleAlarm(alarm);
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

  reorderAlarmToIndex: (id, toIndex) => {
    const alarms = [...get().alarms];
    const from = alarms.findIndex(a => a.id === id);
    if (from === -1) return;
    const [item] = alarms.splice(from, 1);
    alarms.splice(toIndex, 0, item);
    set({alarms});
  },

  reset: async () => {
    const {alarms} = get();
    await Promise.all(alarms.map(a => cancelAlarm(a.id)));
    set({alarms: []});
  },
}), {name: 'alarms', storage: mmkvStorage}));
