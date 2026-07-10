import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage();

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  hasPromptedReview: boolean;
  completeOnboarding: () => void;
  markReviewPrompted: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(persist(set => ({
  hasCompletedOnboarding: false,
  hasPromptedReview: false,
  completeOnboarding: () => set({hasCompletedOnboarding: true}),
  markReviewPrompted: () => set({hasPromptedReview: true}),
}), {name: 'onboarding', storage: mmkvStorage}));
