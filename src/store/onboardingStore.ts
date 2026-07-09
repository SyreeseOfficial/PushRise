import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createMMKV} from 'react-native-mmkv';

const storage = createMMKV();
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(persist(set => ({
  hasCompletedOnboarding: false,
  completeOnboarding: () => set({hasCompletedOnboarding: true}),
}), {name: 'onboarding', storage: mmkvStorage}));
