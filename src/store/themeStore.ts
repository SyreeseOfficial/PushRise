import {createMMKV} from 'react-native-mmkv';
import {create} from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

const storage = createMMKV({id: 'pushrise-theme'});

export const useThemeStore = create<{
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}>(set => ({
  mode: (storage.getString('mode') as ThemeMode) ?? 'system',
  setMode: mode => {
    storage.set('mode', mode);
    set({mode});
  },
}));
