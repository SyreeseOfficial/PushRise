import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage();

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(persist(set => ({
  hasCompletedOnboarding: false,
  completeOnboarding: () => set({hasCompletedOnboarding: true}),
}), {name: 'onboarding', storage: mmkvStorage}));
