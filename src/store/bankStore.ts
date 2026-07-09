import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createMMKV} from 'react-native-mmkv';

const storage = createMMKV();
const mmkvStorage = createJSONStorage(() => ({
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}));

export interface Reward {
  id: string;
  emoji: string;
  title: string;
  cost: number;
}

interface BankStore {
  totalReps: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
  graceUsedAt: string | null;       // 'YYYY-MM-DD' — resets when streak resets
  hasSeenBankIntro: boolean;
  rewards: Reward[];
  addReps: (n: number) => void;
  markIntroSeen: () => void;
  addReward: (data: Omit<Reward, 'id'>) => void;
  editReward: (id: string, data: Omit<Reward, 'id'>) => void;
  deleteReward: (id: string) => void;
  redeemReward: (id: string) => void;
}

const DEFAULT_REWARDS: Reward[] = [
  {id: 'd1', emoji: '📺', title: 'TV Time', cost: 50},
  {id: 'd2', emoji: '🎮', title: 'Video Games', cost: 75},
  {id: 'd3', emoji: '🍕', title: 'Treat Yourself', cost: 30},
  {id: 'd4', emoji: '👕', title: 'New Fit', cost: 200},
  {id: 'd5', emoji: '💵', title: '$10 Spending Money', cost: 150},
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function computeStreak(s: BankStore, today: string): Partial<BankStore> {
  if (!s.lastCompletedDate) {
    return {currentStreak: 1, longestStreak: Math.max(1, s.longestStreak), lastCompletedDate: today};
  }

  const diff = daysBetween(s.lastCompletedDate, today);

  if (diff === 0) return {}; // already counted today

  if (diff === 1) {
    const next = s.currentStreak + 1;
    return {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today};
  }

  if (diff === 2) {
    // one missed day — grace day available once per 7-day rolling window
    const graceAvailable = !s.graceUsedAt || daysBetween(s.graceUsedAt, today) >= 7;
    if (graceAvailable) {
      const next = s.currentStreak + 1;
      return {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today, graceUsedAt: today};
    }
  }

  // streak broken
  return {currentStreak: 1, lastCompletedDate: today, graceUsedAt: null};
}

export const useBankStore = create<BankStore>()(persist((set, get) => ({
  totalReps: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  graceUsedAt: null,
  hasSeenBankIntro: false,
  rewards: DEFAULT_REWARDS,

  addReps: (n) => {
    if (n <= 0) return;
    set(s => ({
      totalReps: s.totalReps + n,
      ...computeStreak(s, toDateStr(new Date())),
    }));
  },

  markIntroSeen: () => set({hasSeenBankIntro: true}),

  addReward: (data) => set(s => ({
    rewards: [...s.rewards, {...data, id: Date.now().toString()}],
  })),

  editReward: (id, data) => set(s => ({
    rewards: s.rewards.map(r => r.id === id ? {...data, id} : r),
  })),

  deleteReward: (id) => set(s => ({
    rewards: s.rewards.filter(r => r.id !== id),
  })),

  redeemReward: (id) => {
    const {rewards, totalReps} = get();
    const reward = rewards.find(r => r.id === id);
    if (!reward || totalReps < reward.cost) return;
    set({totalReps: totalReps - reward.cost});
  },
}), {name: 'bank', storage: mmkvStorage}));
