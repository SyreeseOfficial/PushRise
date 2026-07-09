import {createMMKV} from 'react-native-mmkv';
import {create} from 'zustand';

const storage = createMMKV({id: 'pushrise-settings'});

export const useSettingsStore = create<{
  defaultReps: number;
  setDefaultReps: (n: number) => void;
}>(set => ({
  defaultReps: parseInt(storage.getString('defaultReps') ?? '10', 10),
  setDefaultReps: n => {
    storage.set('defaultReps', String(n));
    set({defaultReps: n});
  },
}));
