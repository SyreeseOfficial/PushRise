const BONUS_CHANCE = 0.15;

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

export const TITLES = [
  {label: 'No Days Off',     unlock: '30-day streak',    check: (_r: number, s: number) => s >= 30},
  {label: 'Ghost Mode',      unlock: '21-day streak',    check: (_r: number, s: number) => s >= 21},
  {label: 'Relentless',      unlock: '10,000 reps',      check: (r: number) => r >= 10000},
  {label: '5AM Club',        unlock: '14-day streak',    check: (_r: number, s: number) => s >= 14},
  {label: 'Legend',          unlock: '6,000 reps',       check: (r: number) => r >= 6000},
  {label: 'Machine',         unlock: '4,000 reps',       check: (r: number) => r >= 4000},
  {label: 'Iron Riser',      unlock: '3,000 reps',       check: (r: number) => r >= 3000},
  {label: 'Built Different', unlock: '1,500 reps',       check: (r: number) => r >= 1500},
  {label: 'The Grinder',     unlock: '750 reps',         check: (r: number) => r >= 750},
  {label: 'Obsessed',        unlock: '500 reps',         check: (r: number) => r >= 500},
  {label: 'Locked In',       unlock: '200 reps',         check: (r: number) => r >= 200},
  {label: 'Consistent',      unlock: '100 reps',         check: (r: number) => r >= 100},
  {label: 'Untouchable',     unlock: '7-day streak',     check: (_r: number, s: number) => s >= 7},
  {label: 'Early Riser',     unlock: '20 reps',          check: (r: number) => r >= 20},
  {label: 'Newcomer',        unlock: 'Always available', check: () => true},
];

export function getTitle(totalReps: number, streak: number): string {
  return TITLES.find(t => t.check(totalReps, streak))?.label ?? 'Newcomer';
}

export function getUnlockedTitles(totalReps: number, streak: number) {
  return TITLES.filter(t => t.check(totalReps, streak));
}

export const AVATAR_LEVELS = [
  {minReps: 6000,  emoji: '👑', label: 'Legend',          level: 10},
  {minReps: 3000,  emoji: '🦾', label: 'Iron Riser',      level: 9},
  {minReps: 1500,  emoji: '🦁', label: 'Built Different', level: 8},
  {minReps: 750,   emoji: '💪', label: 'The Grinder',     level: 7},
  {minReps: 400,   emoji: '🔥', label: 'On Fire',         level: 6},
  {minReps: 200,   emoji: '⚡', label: 'Locked In',       level: 5},
  {minReps: 100,   emoji: '💧', label: 'In The Habit',    level: 4},
  {minReps: 50,    emoji: '🌊', label: 'Finding Rhythm',  level: 3},
  {minReps: 20,    emoji: '☀️', label: 'Early Riser',     level: 2},
  {minReps: 0,     emoji: '🌱', label: 'Seedling',        level: 1},
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
  // American
  'Marcus T.', 'Jordan B.', 'Alex R.', 'Sam K.', 'Riley P.',
  'Casey M.', 'Taylor W.', 'Morgan S.', 'Drew K.', 'Quinn R.',
  // East Asian
  'Wei L.', 'Yuki S.', 'Min J.', 'Ji-ho K.', 'Ren T.',
  'Hana M.', 'Soo Y.', 'Daiki N.', 'Mei C.', 'Junho P.',
  // South Asian
  'Arjun K.', 'Priya S.', 'Ravi M.', 'Ananya B.', 'Dev P.',
  'Aisha R.', 'Riya G.', 'Kiran N.', 'Dhruv S.', 'Pooja V.',
  // European
  'Luca R.', 'Sofia M.', 'Mateo G.', 'Isabelle D.', 'Nico B.',
  'Elena V.', 'Felix H.', 'Zara K.', 'Tomás M.', 'Ingrid L.',
  // African / Middle Eastern
  'Amara D.', 'Kofi A.', 'Zainab H.', 'Emeka O.', 'Fatima A.',
  // Latin American
  'Camila R.', 'Diego F.', 'Valeria M.', 'Javier T.', 'Lucia C.',
];

interface LeaderboardEntry {
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

interface Boss {
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
  const goal = 10_000;
  const weekStart = getWeekStart();
  const rand = seededRng(weekStart);

  // Base for this week — community is always close but not done
  const weeklyBase = Math.round(rand() * 1500 + 7500); // 7500–9000

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
