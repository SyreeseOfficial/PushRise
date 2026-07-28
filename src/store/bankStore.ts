import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {getBonus, checkMilestone, getWeekStart, getAvatarLevel} from '../utils/engagement';
import {makeMMKVStorage} from './mmkvStorage';
import {cancelNudge, cancelLateNightNotif} from '../utils/notifee';

const mmkvStorage = makeMMKVStorage('pushrise-bank');

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

export interface LevelUp {
  fromLevel: number;
  fromEmoji: string;
  toLevel: number;
  toEmoji: string;
  toLabel: string;
}

interface BankStore {
  totalReps: number;
  todayReps: number;
  todayDate: string;
  todayHourlyReps: number[];
  yesterdayHourlyReps: number[];
  weekReps: number;
  weekStartDate: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  graceUsedAt: string | null;
  freezeCount: number;
  pendingFreezeEarned: boolean;
  pendingFreezeUsed: boolean;
  equippedTitle: string | null;
  hasSeenBankIntro: boolean;
  seenMilestones: number[];
  pendingCelebration: Celebration | null;
  pendingLevelUp: LevelUp | null;
  pendingRoundNudge: {target: number; gap: number} | null;
  bossDefeatedWeek: string | null;
  dailyHistory: Record<string, number>;
  rewards: Reward[];
  addReps: (n: number) => void;
  spendReps: (n: number) => void;
  clearCelebration: () => void;
  clearLevelUp: () => void;
  clearRoundNudge: () => void;
  clearFreezeEarned: () => void;
  clearFreezeUsed: () => void;
  setEquippedTitle: (t: string | null) => void;
  defeatBoss: (weekStart: string) => void;
  markIntroSeen: () => void;
  gamblingResult: (wager: number, payout: number) => void;
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

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function computeStreak(s: BankStore, today: string): {update: Partial<BankStore>; freezeUsed: boolean} {
  if (!s.lastCompletedDate) {
    return {update: {currentStreak: 1, longestStreak: Math.max(1, s.longestStreak), lastCompletedDate: today}, freezeUsed: false};
  }

  const diff = daysBetween(s.lastCompletedDate, today);

  if (diff === 0) return {update: {}, freezeUsed: false};

  if (diff === 1) {
    const next = s.currentStreak + 1;
    return {update: {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today}, freezeUsed: false};
  }

  if (diff === 2) {
    const graceAvailable = !s.graceUsedAt || daysBetween(s.graceUsedAt, today) >= 7;
    if (graceAvailable) {
      const next = s.currentStreak + 1;
      return {update: {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today, graceUsedAt: today}, freezeUsed: false};
    }
    if (s.freezeCount > 0) {
      const next = s.currentStreak + 1;
      return {update: {currentStreak: next, longestStreak: Math.max(next, s.longestStreak), lastCompletedDate: today}, freezeUsed: true};
    }
  }

  return {update: {currentStreak: 1, lastCompletedDate: today, graceUsedAt: null}, freezeUsed: false};
}

const BANK_DEFAULTS = {
  totalReps: 0,
  todayReps: 0,
  todayDate: '',
  todayHourlyReps: new Array(24).fill(0) as number[],
  yesterdayHourlyReps: new Array(24).fill(0) as number[],
  weekReps: 0,
  weekStartDate: '',
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null as string | null,
  graceUsedAt: null as string | null,
  freezeCount: 0,
  pendingFreezeEarned: false,
  pendingFreezeUsed: false,
  equippedTitle: null as string | null,
  hasSeenBankIntro: false,
  seenMilestones: [] as number[],
  pendingCelebration: null as Celebration | null,
  pendingLevelUp: null as LevelUp | null,
  pendingRoundNudge: null as {target: number; gap: number} | null,
  bossDefeatedWeek: null as string | null,
  dailyHistory: {} as Record<string, number>,
  rewards: DEFAULT_REWARDS,
};

export const useBankStore = create<BankStore>()(persist((set, get) => ({
  ...BANK_DEFAULTS,

  addReps: (n) => {
    if (n <= 0) return;
    const s = get();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = getWeekStart();
    const hour = now.getHours();

    const bonus = getBonus();
    const totalAdded = n + bonus;

    const newTotal = s.totalReps + totalAdded;
    const milestone = checkMilestone(s.totalReps, newTotal, s.seenMilestones);

    const oldAvatarLevel = getAvatarLevel(s.totalReps);
    const newAvatarLevel = getAvatarLevel(newTotal);
    const levelUp: LevelUp | null = newAvatarLevel.level > oldAvatarLevel.level
      ? {fromLevel: oldAvatarLevel.level, fromEmoji: oldAvatarLevel.emoji, toLevel: newAvatarLevel.level, toEmoji: newAvatarLevel.emoji, toLabel: newAvatarLevel.label}
      : null;

    const isNewDay = s.todayDate !== today;
    const isNewWeek = s.weekStartDate !== weekStart;

    const celebration: Celebration | null =
      bonus > 0 || milestone !== null ? {bonus, milestone} : null;

    const newTodayReps = (isNewDay ? 0 : s.todayReps) + totalAdded;
    const rem = newTodayReps % 5;
    const pendingRoundNudge = rem >= 1 && rem <= 4
      ? {target: newTodayReps + (5 - rem), gap: 5 - rem}
      : null;
    const newHourlyReps = isNewDay ? new Array(24).fill(0) : [...s.todayHourlyReps];
    newHourlyReps[hour] = newTodayReps;

    const {update: streakUpdate, freezeUsed} = computeStreak(s, today);
    const newStreak = streakUpdate.currentStreak ?? s.currentStreak;

    // Award a freeze at each new 7-day milestone (never when using one)
    const awardFreeze = !freezeUsed &&
      Math.floor(newStreak / 7) > Math.floor(s.currentStreak / 7) &&
      s.freezeCount < 3;
    const newFreezeCount = freezeUsed
      ? s.freezeCount - 1
      : awardFreeze ? s.freezeCount + 1 : s.freezeCount;

    set({
      totalReps: newTotal,
      todayReps: newTodayReps,
      todayDate: today,
      todayHourlyReps: newHourlyReps,
      yesterdayHourlyReps: isNewDay ? s.todayHourlyReps : s.yesterdayHourlyReps,
      weekReps: (isNewWeek ? 0 : s.weekReps) + totalAdded,
      weekStartDate: weekStart,
      seenMilestones: milestone ? [...s.seenMilestones, milestone] : s.seenMilestones,
      pendingCelebration: celebration,
      pendingLevelUp: levelUp ?? s.pendingLevelUp,
      pendingRoundNudge,
      dailyHistory: (() => {
        const h = isNewDay
          ? {...s.dailyHistory, ...(s.todayDate ? {[s.todayDate]: s.todayReps} : {}), [today]: newTodayReps}
          : {...s.dailyHistory, [today]: newTodayReps};
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
        const cutKey = cutoff.toISOString().slice(0, 10);
        return Object.fromEntries(Object.entries(h).filter(([k]) => k >= cutKey));
      })(),
      ...streakUpdate,
      freezeCount: newFreezeCount,
      pendingFreezeEarned: awardFreeze || s.pendingFreezeEarned,
      pendingFreezeUsed: freezeUsed || s.pendingFreezeUsed,
    });

    // Cancel today's engagement nudges now that reps are banked
    cancelNudge().catch(() => {});
    cancelLateNightNotif().catch(() => {});
  },

  spendReps: (n) => set(s => ({totalReps: Math.max(0, s.totalReps - n)})),

  clearCelebration: () => set({pendingCelebration: null}),
  clearLevelUp: () => set({pendingLevelUp: null}),
  clearRoundNudge: () => set({pendingRoundNudge: null}),
  clearFreezeEarned: () => set({pendingFreezeEarned: false}),
  clearFreezeUsed: () => set({pendingFreezeUsed: false}),
  setEquippedTitle: (t) => set({equippedTitle: t}),
  defeatBoss: (weekStart) => set({bossDefeatedWeek: weekStart}),

  markIntroSeen: () => set({hasSeenBankIntro: true}),

  // ponytail: pure balance swap for gambling — no streak/daily/milestone side effects
  gamblingResult: (wager, payout) => set(s => ({totalReps: Math.max(0, s.totalReps - wager + payout)})),

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
