export const BONUS_CHANCE = 0.15;

export function getBonus(): number {
  if (Math.random() >= BONUS_CHANCE) return 0;
  return Math.ceil(Math.random() * 5); // 1–5
}

export const MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

export const MILESTONE_MESSAGES: Record<number, {title: string; body: string}> = {
  100:   {title: 'First 100! 💯', body: "You've done 100 push-ups since joining. Don't break the habit now."},
  250:   {title: '250 Push-ups!', body: "You're in the top tier of people who actually follow through."},
  500:   {title: '500 Push-ups! 🔥', body: 'Half a thousand. Most people quit before they ever get here.'},
  1000:  {title: '1,000 Push-ups!', body: "Four digits. You've earned the Iron Riser title."},
  2500:  {title: '2,500 Push-ups!', body: "You've done 2,500 push-ups since joining. That's commitment."},
  5000:  {title: '5,000 Push-ups! 💪', body: "Five thousand. You're not grinding anymore — you're built different."},
  10000: {title: '10,000 Push-ups!', body: 'Ten thousand push-ups. This is who you are now.'},
  25000: {title: '25,000 Push-ups! 🦾', body: 'Quarter million incoming. Absolute machine.'},
  50000: {title: '50,000 Push-ups!', body: 'Fifty thousand. Unmatched.'},
};

export function checkMilestone(prevTotal: number, newTotal: number, seen: number[]): number | null {
  for (const m of MILESTONES) {
    if (prevTotal < m && newTotal >= m && !seen.includes(m)) return m;
  }
  return null;
}

const TITLES = [
  {label: '5AM Club',       check: (_r: number, s: number) => s >= 14},
  {label: 'Legend',         check: (r: number) => r >= 10000},
  {label: 'Iron Machine',   check: (r: number) => r >= 5000},
  {label: 'The Grinder',    check: (r: number) => r >= 1000},
  {label: 'Iron Riser',     check: (r: number) => r >= 500},
  {label: 'Getting Warmed Up', check: (r: number) => r >= 100},
  {label: 'Newcomer',       check: () => true},
];

export function getTitle(totalReps: number, streak: number): string {
  return TITLES.find(t => t.check(totalReps, streak))?.label ?? 'Newcomer';
}

// Each level has a placeholder emoji — user will add real images later
export const AVATAR_LEVELS = [
  {minReps: 10000, emoji: '🦾', label: 'Cyborg',      level: 6},
  {minReps: 5000,  emoji: '💪🏽', label: 'Beast Mode',  level: 5},
  {minReps: 1000,  emoji: '🔥', label: 'On Fire',      level: 4},
  {minReps: 500,   emoji: '⚡', label: 'Charged',      level: 3},
  {minReps: 100,   emoji: '💧', label: 'Warming Up',   level: 2},
  {minReps: 0,     emoji: '🌱', label: 'Seedling',     level: 1},
];

export function getAvatarLevel(totalReps: number) {
  return AVATAR_LEVELS.find(a => totalReps >= a.minReps) ?? AVATAR_LEVELS[AVATAR_LEVELS.length - 1];
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// FNV-1a hash seeded PRNG — deterministic per seed string
function seededRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5; h >>>= 0;
    return h / 0x100000000;
  };
}

const FAKE_NAMES = [
  'Marcus T.', 'Jordan B.', 'Alex R.', 'Sam K.', 'Riley P.',
  'Casey M.', 'Taylor W.', 'Morgan S.', 'Drew K.', 'Quinn R.',
  'Avery L.', 'Blake H.', 'Skyler N.', 'Devon C.', 'Remi F.',
  'Jamie O.', 'Rowan E.', 'Finley B.', 'Harley J.', 'Sage V.',
];

export interface LeaderboardEntry {
  name: string;
  weekReps: number;
  isUser: boolean;
  rank: number;
}

export function getLeaderboard(userWeekReps: number): LeaderboardEntry[] {
  const rand = seededRng(new Date().toDateString()); // changes daily

  const shuffled = [...FAKE_NAMES].sort(() => rand() - 0.5);
  const [n1, n2, n3, n4] = shuffled;

  const base = Math.max(userWeekReps, 20);
  const above1 = Math.round(base + rand() * 40 + 15);
  const above2 = Math.round(above1 + rand() * 30 + 10);
  const below1 = Math.max(0, Math.round(base - rand() * 20 - 5));
  const below2 = Math.max(0, Math.round(below1 - rand() * 20 - 5));

  return [
    {name: n1, weekReps: above2, isUser: false, rank: 1},
    {name: n2, weekReps: above1, isUser: false, rank: 2},
    {name: 'You',  weekReps: userWeekReps, isUser: true,  rank: 3},
    {name: n3, weekReps: below1, isUser: false, rank: 4},
    {name: n4, weekReps: below2, isUser: false, rank: 5},
  ];
}

// ─── Boss Battle ───────────────────────────────────────────────────────────

export interface Boss {
  name: string;
  weekReps: number; // their fixed rep count for the week, grows day by day
  isDefeated: boolean;
}

export function getBoss(userWeekReps: number, weekStart: string, bossDefeatedWeek: string | null): Boss {
  const rand = seededRng(weekStart);
  const name = FAKE_NAMES[Math.floor(rand() * FAKE_NAMES.length)];

  // Boss has a fixed daily pace seeded by the week — user only sees them gaining over time
  const dailyRate = Math.round(rand() * 25 + 20); // 20–45 reps/day
  const weekStartMs = new Date(weekStart + 'T00:00:00').getTime();
  const daysElapsed = Math.max(0, Math.floor((Date.now() - weekStartMs) / 86400000));
  const weekReps = Math.round(dailyRate * (daysElapsed + 1));

  return {name, weekReps, isDefeated: bossDefeatedWeek === weekStart};
}

// ─── Community Goal ─────────────────────────────────────────────────────────

export function getCommunityGoal(): {repsToGo: number; total: number; goal: number} {
  const goal = 1_000_000;
  const weekStart = getWeekStart();
  const rand = seededRng(weekStart);

  // Base for this week — community is always close but not done
  const weeklyBase = Math.round(rand() * 60000 + 910000); // 910k–970k

  // Ticks up ~3–7 reps every 2 minutes, live-ish
  const now = new Date();
  const minsElapsed = Math.floor((now.getTime() - new Date(weekStart + 'T00:00:00').getTime()) / 60000);
  const liveRate = Math.round(rand() * 4 + 3); // 3–7 per tick
  const liveGrowth = Math.floor(minsElapsed / 2) * liveRate;

  const total = Math.min(weeklyBase + liveGrowth, goal - 200);
  return {repsToGo: goal - total, total, goal};
}

// ─── Ticker ─────────────────────────────────────────────────────────────────

type TickerFn = (name: string, rand: () => number) => string;

const TICKER_TEMPLATES: TickerFn[] = [
  (n, r) => `${n} just did ${Math.round(r() * 45 + 10)} push-ups 💪`,
  (n, r) => `${n} just hit Level ${Math.ceil(r() * 5) + 1} ⚡`,
  (n, r) => `${n} just hit a ${Math.round(r() * 12 + 3)}-day streak 🔥`,
  (n)    => `${n} just unlocked Iron Riser 🏆`,
  (n)    => `${n} just redeemed 📺 TV Time`,
  (n)    => `${n} just redeemed 🎮 Video Games`,
  (n)    => `${n} just crushed their daily goal 🎯`,
  (n)    => `${n} just earned the 5AM Club title ☀️`,
  (n, r) => `${n} just banked ${Math.round(r() * 80 + 20)} reps 💰`,
  (n)    => `${n} just unlocked The Grinder 🔥`,
  (n, r) => `${n} is on a roll — ${Math.round(r() * 30 + 20)} reps today`,
  (n)    => `${n} just hit Legend status 🦾`,
  (n)    => `${n} just redeemed 🍕 Treat Yourself`,
  (n, r) => `${n} woke up and did ${Math.round(r() * 25 + 5)} push-ups 🌅`,
  (n)    => `${n} just completed their morning alarm 💥`,
];

export function getTickerMessages(): string[] {
  const rand = seededRng(new Date().toISOString().slice(0, 13)); // changes hourly
  const names = [...FAKE_NAMES].sort(() => rand() - 0.5);
  return Array.from({length: 30}, (_, i) => {
    const fn = TICKER_TEMPLATES[Math.floor(rand() * TICKER_TEMPLATES.length)];
    return fn(names[i % names.length], rand);
  });
}
