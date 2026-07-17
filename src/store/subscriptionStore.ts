import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {makeMMKVStorage} from './mmkvStorage';

const mmkvStorage = makeMMKVStorage('pushrise-subscription');

const TRIAL_DAYS = 7;

interface SubscriptionStore {
  trialStartedAt: number | null;
  isSubscribed: boolean;
  startTrial: () => void;
  setSubscribed: (v: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(persist(
  (set) => ({
    trialStartedAt: null,
    isSubscribed: false,
    startTrial: () => set(s => ({trialStartedAt: s.trialStartedAt ?? Date.now()})),
    setSubscribed: (v) => set({isSubscribed: v}),
  }),
  {name: 'subscription-v1', storage: mmkvStorage},
));
