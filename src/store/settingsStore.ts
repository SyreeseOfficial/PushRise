import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage('pushrise-settings');

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
  grindingFor: '',
  userName: '',
  nudgeEnabled: true,
  nudgeHour: 21,
  nudgeMinute: 0,
  lateNightEnabled: true,
  lateNightHour: 22,
  lateNightMinute: 0,
  rivalEnabled: true,
  dailyChallengeEnabled: true,
  dailyChallengeHour: 8,
  dailyChallengeMinute: 0,
  emergencyBypassEnabled: false,
  emergencyBypassCost: 50,
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
