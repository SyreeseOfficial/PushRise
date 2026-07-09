import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createMMKV} from 'react-native-mmkv';
import {getBonus, checkMilestone, getWeekStart} from '../utils/engagement';

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
  oneTime?: boolean;
}

export interface Celebration {
  bonus: number;
  milestone: number | null;
}

interface BankStore {
  totalReps: number;
  todayReps: number;
  todayDate: string;
  weekReps: number;
  weekStartDate: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  graceUsedAt: string | null;
  hasSeenBankIntro: boolean;
  seenMilestones: number[];
  pendingCelebration: Celebration | null;
  bossDefeatedWeek: string | null;
  rewards: Reward[];
  addReps: (n: number) => void;
  clearCelebration: () => void;
  defeatBoss: (weekStart: string) => void;
  markIntroSeen: () => void;
  addReward: (data: Omit<Reward, 'id'>) => void;
  editReward: (id: string, data: Omit<Reward, 'id'>) => void;
  deleteReward: (id: string) => void;
  redeemReward: (id: string) => void;
  reset: () => void;
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

  if (diff === 0) return {};

  if (diff === 1) {
    const next = s.currentStreak + 1;
    return {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today};
  }

  if (diff === 2) {
    const graceAvailable = !s.graceUsedAt || daysBetween(s.graceUsedAt, today) >= 7;
    if (graceAvailable) {
      const next = s.currentStreak + 1;
      return {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today, graceUsedAt: today};
    }
  }

  return {currentStreak: 1, lastCompletedDate: today, graceUsedAt: null};
}

const BANK_DEFAULTS = {
  totalReps: 0,
  todayReps: 0,
  todayDate: '',
  weekReps: 0,
  weekStartDate: '',
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null as string | null,
  graceUsedAt: null as string | null,
  hasSeenBankIntro: false,
  seenMilestones: [] as number[],
  pendingCelebration: null as Celebration | null,
  bossDefeatedWeek: null as string | null,
  rewards: DEFAULT_REWARDS,
};

export const useBankStore = create<BankStore>()(persist((set, get) => ({
  ...BANK_DEFAULTS,

  addReps: (n) => {
    if (n <= 0) return;
    const s = get();
    const today = toDateStr(new Date());
    const weekStart = getWeekStart();

    const bonus = getBonus();
    const totalAdded = n + bonus;

    const newTotal = s.totalReps + totalAdded;
    const milestone = checkMilestone(s.totalReps, newTotal, s.seenMilestones);

    const isNewDay = s.todayDate !== today;
    const isNewWeek = s.weekStartDate !== weekStart;

    const celebration: Celebration | null =
      bonus > 0 || milestone !== null ? {bonus, milestone} : null;

    set({
      totalReps: newTotal,
      todayReps: (isNewDay ? 0 : s.todayReps) + totalAdded,
      todayDate: today,
      weekReps: (isNewWeek ? 0 : s.weekReps) + totalAdded,
      weekStartDate: weekStart,
      seenMilestones: milestone ? [...s.seenMilestones, milestone] : s.seenMilestones,
      pendingCelebration: celebration,
      ...computeStreak(s, today),
    });
  },

  clearCelebration: () => set({pendingCelebration: null}),
  defeatBoss: (weekStart) => set({bossDefeatedWeek: weekStart}),

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
    set({
      totalReps: totalReps - reward.cost,
      rewards: reward.oneTime ? rewards.filter(r => r.id !== id) : rewards,
    });
  },

  reset: () => set({...BANK_DEFAULTS, rewards: DEFAULT_REWARDS}),
}), {name: 'bank', storage: mmkvStorage}));
