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

export const useBankStore = create<BankStore>()(persist((set, get) => ({
  totalReps: 0,
  hasSeenBankIntro: false,
  rewards: DEFAULT_REWARDS,

  addReps: (n) => set(s => ({totalReps: s.totalReps + n})),
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
