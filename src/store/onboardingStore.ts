import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage();

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  hasPromptedReview: boolean;
  isFirstLaunch: boolean;
  completeOnboarding: () => void;
  markReviewPrompted: () => void;
  markFirstLaunchSeen: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(persist(set => ({
  hasCompletedOnboarding: false,
  hasPromptedReview: false,
  isFirstLaunch: true,
  completeOnboarding: () => set({hasCompletedOnboarding: true}),
  markReviewPrompted: () => set({hasPromptedReview: true}),
  markFirstLaunchSeen: () => set({isFirstLaunch: false}),
}), {name: 'onboarding', storage: mmkvStorage}));
