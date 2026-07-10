import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage('pushrise-subscription');

const TRIAL_DAYS = 7;
const EXTENSION_DAYS = 3;

interface SubscriptionStore {
  trialStartedAt: number | null;
  isSubscribed: boolean;
  downsell1SeenAt: number | null;
  hasUsedExtension: boolean;
  startTrial: () => void;
  setSubscribed: (v: boolean) => void;
  markDownsell1Seen: () => void;
  applyExtension: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(persist(
  (set) => ({
    trialStartedAt: null,
    isSubscribed: false,
    downsell1SeenAt: null,
    hasUsedExtension: false,
    startTrial: () => set(s => ({trialStartedAt: s.trialStartedAt ?? Date.now()})),
    setSubscribed: (v) => set({isSubscribed: v}),
    markDownsell1Seen: () => set(s => ({downsell1SeenAt: s.downsell1SeenAt ?? Date.now()})),
    applyExtension: () => set(s => {
      if (s.hasUsedExtension || !s.trialStartedAt) return {};
      return {
        hasUsedExtension: true,
        trialStartedAt: s.trialStartedAt + EXTENSION_DAYS * 86_400_000,
      };
    }),
  }),
  {name: 'subscription-v1', storage: mmkvStorage},
));

export function isTrialExpired(trialStartedAt: number | null): boolean {
  if (!trialStartedAt) return false;
  return Date.now() - trialStartedAt >= TRIAL_DAYS * 86_400_000;
}
