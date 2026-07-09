import {createMMKV} from 'react-native-mmkv';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

const storage = createMMKV({id: 'pushrise-settings'});
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

export const SETTINGS_DEFAULTS = {
  defaultReps: 10,
  autoCompleteAlarm: true,
  muteAudioDuringPushups: false,
  vibrateOnAlarm: true,
  hapticOnRep: true,
  audioCueOnRep: false,
  keepScreenOn: true,
  preferFrontCamera: true,
  dailyGoal: 0,
};

type SettingsData = typeof SETTINGS_DEFAULTS;

interface SettingsStore extends SettingsData {
  update: (patch: Partial<SettingsData>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(persist(
  (set) => ({
    ...SETTINGS_DEFAULTS,
    update: (patch) => set(patch),
    reset: () => set(SETTINGS_DEFAULTS),
  }),
  {name: 'settings-v2', storage: mmkvStorage},
));
