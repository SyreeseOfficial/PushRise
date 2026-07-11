# PushRise — Updated PRD

> Last revised: 2026-07-08

---

## The Bet

An alarm app where push-ups are the only snooze button. The pain point is validated (Pushy: 10k+ downloads, 4.5 stars). The opportunity is in Pushy's failure: bad detection, immediate paywall, no social, no rewards. PushRise wins by fixing all four.

**This app lives or dies on two things:**
1. The alarm actually going off (Android is hostile to background processes)
2. The camera detection being good enough that users don't bounce

Both are unvalidated. Both must be proven in Week 1 before anything else is built.

---

## Target User

- **Who:** Undisciplined males, ~15–25, beginner fitness level
- **Pain:** Hits snooze repeatedly, wants to get in shape but lacks structure
- **Motivation:** Needs something extreme and external to override their own laziness
- **Fitness level:** Can do roughly 5–10 push-ups. Default rep count: **10**
- **Device reality:** Likely a mid-range or budget Android phone, potentially in low light

> Hypothesis. Validate with real users before locking in marketing spend.

---

## MVP Scope

**In:**
- Alarm (one-time + recurring)
- Camera-based push-up detection with manual fallback
- Adjustable volume + device sounds + custom file sounds
- Outside-alarm push-up logging (camera or manual; all reps count toward bank)
- Reward banking (honor system, alarm reps + outside reps both count)
- Streak tracking (goal-completion only — not "open the app" streaks)
- Full onboarding flow (20 screens — see below)
- Paywall + free trial + downsell

**Out (post-launch):**
- Social features, leaderboards, friend challenges
- Accounts / backend
- Achievement share cards
- Family plans
- Referral program (needs backend + accounts — deferred, see `todo.md`)

---

## Core Mechanic — Alarm Flow

1. Alarm fires → full-screen takeover (`FLAG_SHOW_WHEN_LOCKED` + `FLAG_TURN_SCREEN_ON`), loud sound
2. User sees **"I'm Ready"** button — intentional tap required, no auto-camera
3. Camera activates, rep counter overlays camera view
4. Reps accumulate; **partial reps do not count** (full range of motion required)
5. If user stops mid-set, count pauses and resumes when they restart — no penalty, no reset
6. Alarm dismisses when rep target is hit
7. All reps from the alarm session are added to the push-up bank

**Alarm sound behavior:** User-configurable — alarm can stop when camera opens, or continue until push-ups are complete. Default: stops when camera opens.

---

## Outside-Alarm Push-up Logging

Users can log push-ups anytime, not just during alarms. All reps count toward the push-up bank.

- Accessible from the Progress tab (floating action button or dedicated "Log Push-ups" button)
- Options: camera-based counting (same MediaPipe detection) or manual entry
- Manual entry has no friction — it's the honor system. A user who logs fake reps is only cheating themselves.

---

## Push-up Detection

**Primary:** Camera-based (MediaPipe)

**Known risk:** Cheap Android hardware + bad lighting + varied body sizes = unreliable detection. Must be tested Week 1.

**Fallback (Manual):** Hold-button-per-rep. More friction than camera to preserve intent — but still available. Retention safety valve.

**Anti-cheat:** Cannot be enforced. Honor system. Messaging handles it.

---

## Android Alarm Reliability — Existential Risk

OEM battery optimization (Xiaomi, Samsung, Huawei, OnePlus) will silently kill background apps.

**Must solve before launch:**
- `AlarmManager.setAlarmClock()` — bypasses Doze, shown in status bar
- `SCHEDULE_EXACT_ALARM` permission (Android 12+)
- Foreground service to survive OEM kill behavior
- Onboarding screen guiding users through disabling battery optimization manually
- Reference: [dontkillmyapp.com](https://dontkillmyapp.com)
- Test on Samsung + Xiaomi (worst offenders)

---

## Onboarding Flow — Full Sequence (20 Screens)

**Goal:** Duolingo model — user sets their first alarm and experiences the core loop before the paywall. 15+ minutes of investment before they're asked to pay. Sunk cost creates conversion.

**Conversion psychology applied throughout:** identity destruction + reconstruction, loss framing, loaded questions, progressive commitment, sunk cost exploitation, contrast pricing.

---

### Phase 1 — Hook (Screens 1–3)

**Screen 1: Welcome**
> *"The snooze button is making you weak."*
> *"Every morning you give in, you train yourself to quit. It's time to train yourself to win."*
> **[I'm ready to change →]**

**Screen 2: Founder's Note**
Digital handwritten-style note (cursive font), placeholder selfie image.
> *"Hey [Name],*
> *I built PushRise because I was you.*
> *Six alarms. Snoozed every single one. Then spent the rest of the day feeling behind before it even started.*
> *The problem wasn't my alarm. It was me.*
> *I needed something that wouldn't let me off the hook. So I built it.*
> *Now I wake up every morning knowing I already won.*
> *You can too.*
> *— Syreese"*
> [Cursive digital signature] [Placeholder founder photo]

**Screen 3: Social Proof**
Three early user testimonials (replace with real reviews post-launch):
> ★★★★★ *"I've tried every alarm app. This is the only one I actually respect. It doesn't let me lie to myself."* — Marcus, 22
> ★★★★★ *"Day 14. Never made it past day 3 with anything else. The push-ups are brutal at 6am — that's the point."* — Jordan, 19
> ★★★★★ *"My roommate started using it after he saw me wake up on time for two weeks straight. Now we compete."* — Tyler, 24

---

### Phase 2 — Quiz / Personalization (Screens 4–10)

**Screen 4: Quiz Intro**
> *"Let's be honest with each other."*
> *"A few questions so we can build your plan."*

**Screen 5: Q1 — Snooze severity**
> *"How bad is the snooze problem — really?"*
- "I wake up fine most days"
- "I hit snooze once or twice"
- "I hit snooze until I'm almost late"
- "I've actually been late because of it"

**Screen 6: Q1 Reflection** *(shows after answering Q1)*
> *"You're not lazy. You're untrained. There's a difference — and it's fixable."*

**Screen 7: Q2 — Fitness level**
> *"What does your body look like right now? Be honest."*
- "I never really work out"
- "I work out here and there"
- "I'm pretty consistent"

**Screen 8: Q3 — Real goal**
> *"Why did you really download this?"*
*(Every answer confirms the need for PushRise — loaded by design)*
- "I just need to wake up on time"
- "I want to get stronger"
- "I need a complete reset — both"

**Screen 9: Q4 — Push-up count**
> *"No ego. How many push-ups can you actually do right now?"*
- "5 or fewer"
- "Around 10"
- "15–20"
- "More than 20"

**Screen 10: Q5 — Wake time + Q6 — Reward**
> *"When do you need to wake up?"* [Time picker]
> *"What would make waking up worth it?"* [Multi-select]
- More time before my day starts
- A stronger body
- Actually hitting my goals
- Feeling proud of myself
- Just not being late anymore

---

### Phase 3 — The Plan (Screens 11–14)

**Screen 11: Fake "Analyzing" Loading Screen**
Progress bar, 3–4 seconds. Cycling subtext:
- "Analyzing your wake-up patterns..."
- "Calculating your push-up baseline..."
- "Designing your reward system..."
- "Building your personalized plan..."

**Screen 12: Persona Reveal**
Based on quiz answers, one of three types:

*Severe snoozer + beginner:*
**"The Sleeper"**
> *"You know you should be doing more. You're tired of feeling behind before the day starts. PushRise was literally built for you — the people who need this most are the ones who keep hitting snooze. That stops today."*

*Moderate snoozer + some fitness:*
**"The Inconsistent"**
> *"You have the drive — you just can't get it started in the morning. Your push-ups are going to fix that. Every morning you do them is a morning you win before the day begins."*

*Light snoozer + consistent:*
**"The Optimizer"**
> *"You're already disciplined. PushRise gives you a system to turn that discipline into real results. Track everything. Bank every rep. Earn what you spend."*

**Screen 13: Dream Outcome**
Chart showing push-ups per week climbing over 30 days.
> *"In 30 days, you'll be a different person."*
> *"Users who complete 7 days don't quit. The first morning is the hardest. After that, it becomes who you are."*
> *(Small print: "Results depend on consistency. The app makes it non-optional.")*

**Screen 14: Journey Summary**
> *"Here's your plan, [Name]."*
- Wake time: [their answer]
- Starting reps: [based on their count]
- Goal: [their stated goal]
- Reward: [what they said]
> *"In 7 days, this won't feel like a choice. It'll feel like who you are."*
> **[Set Your First Alarm →]**

---

### Phase 4 — Investment (Screen 15)

**Screen 15: Create First Alarm**
Embedded alarm creation UI inside onboarding — time picker + rep count. They invest before they sign up (IKEA effect).
> *"Now set it. Don't overthink — just pick a time you actually need to wake up."*

---

### Phase 5 — Close (Screens 16–20)

**Screen 16: Commitment Screen**
> *"Before we go any further."*
> *"How committed are you to actually doing this?"*
- "Fully committed. No more excuses." ← most pick this
- "I'm ready to try"
- "I'm still figuring it out"

If anything other than "Fully committed":
> *"That's honest. The fact that you made it this far means you're ready. Let's go."*
*(Same CTA regardless — commitment screen is psychological lock-in, not a gate)*

**Screen 17: Permission Pre-Warning**
> *"Before we finish setup..."*
> *"We need a couple permissions to make sure your alarm never fails. Here's what we'll ask for and why:"*
> 🔋 Battery access — so your alarm fires even when your phone tries to save power
> 🔔 Notifications — so we warn you before your trial ends
> **[Got it →]**

**Screen 18: Notification Permission**
System prompt, preceded by Screen 17 framing.

**Screen 19: Battery Optimization**
Step-by-step guide (OEM-specific where possible) to disable battery optimization for PushRise.
> *"This is the most important step. Skip it and your alarm might not go off."*

**Screen 20: Price Comparison → Trial → Paywall**
Price comparison card:
> ☕ *"One coffee: $5–7. Lasts 20 minutes."*
> 💪 *"PushRise: $2.99/month. Lasts forever."*
> *"Or own it for life for $14.99 — less than three coffees."*
> *"You spend more on things that make you feel worse."*

Then the paywall:
> **"Start Free. Stay Because It Works."**
> *"7 days. Full access. No credit card required. We'll remind you before it ends."*

| Plan | Price |
|---|---|
| 🏆 Monthly (Most Popular) | $2.99/month |
| Lifetime | $14.99 one-time |

> *"No charge today. No charge until Day 8. Cancel before then and pay nothing."*

Trust signals: ✓ Camera push-up detection ✓ Reward banking ✓ Streak tracking ✓ No ads

---

## Post-Trial Paywall

Shown when trial expires. Lock push-up mechanic, alarm still fires.

> **"The old you would quit here."**
> *"You've built [X] days of momentum. [X] push-ups banked. Don't let that die for less than a coffee a week."*

[Same pricing display as onboarding paywall]

---

## Downsell Flow

If user declines paywall:

**Downsell 1:**
> *"Wait. One more thing."*
> *"We don't want to lose you. Here's a deal we don't offer twice:"*
> $1.99/month or $9.99 lifetime
> Real 15-minute countdown timer.
> **[Claim Offer]** / [No thanks]

**Downsell 2** (if they decline Downsell 1):
> *"Get 3 more days free. On us."*
> **[Extend My Trial]** / [No thanks, I'll miss out]

Note: "No thanks, I'll miss out" is intentional loss-aversion copy. Standard dark pattern, TOS-compliant.

---

## Reward Banking

- Default rewards pre-loaded (TV time, restaurant money, video game time, dessert)
- Users can add/delete/edit rewards and costs
- All push-ups count: alarm sessions + outside logging
- Redemption is honor system — user marks as redeemed
- Custom rewards paywalled (trial users get defaults only)

---

## Streak Tracking

Earned by dismissing an alarm with push-ups — not by opening the app.

**Grace day:** one missed day per week doesn't break the streak. Reduces churn from streak anxiety.

---

## Review Prompt

**Not during onboarding.** Fires after the first alarm is successfully dismissed with push-ups. That's the emotional peak — the first real win. That's when you ask.

---

## Monetization

| Option | Price |
|---|---|
| Monthly | $2.99/month |
| Lifetime | $14.99 one-time |

- 7-day free trial, no credit card
- Warning notifications: Day 5 and Day 7
- Post-trial: push-up mechanic locked, alarm still fires
- Downsell: discounted price + 15-min timer, then 3-day extension offer

### Revenue Math

5,000 downloads × 5% conversion = 250 paying users
- 150 monthly × $2.99 = **$449/month recurring**
- 100 lifetime × $14.99 = **$1,499 one-time**

Month 1: ~$1,950 | Month 2+ (80% retention): ~$360/month recurring

Bottleneck is top-of-funnel downloads, not conversion rate.

---

## Marketing

**Phase 1:** r/fitness, r/bodyweightfitness, fitness Discords, college dorm groups. Personal founder posts. Authentic > polished.

**Phase 2:** Micro-influencers (fitness TikTok, under 100k). Send the app, let them react.

**Phase 3:** Paid ads, retargeting, larger influencers. Only after Phase 1 proves product-market fit.

---

## Social Features (Post-Launch Roadmap)

- Friend challenges (1-day or 1-week push-up duels)
- Hyper-local leaderboards (city/school level — achievable competition)
- Achievement share cards (Instagram/TikTok — organic growth engine)
- Referral program (invite a friend, earn bank bonus)

All require accounts + Supabase backend. Build after launch.

---

## Design System

All UI follows **Google Material Design 3 (M3)**. Every design decision — color, typography, spacing, shape, components — must conform to M3 spec.

### Color
- Seed color: `#FF6B00` (orange) — generates the full M3 tonal palette
- Light and dark schemes both derived from the same seed via M3 HCT color system
- User can choose Light / Dark / Follow System in app settings (gear icon, Alarms tab)
- Never use hardcoded hex in screens — always reference `theme.colors.*` from `react-native-paper`'s `useTheme()`
- Exception: AlarmFiringScreen and BankCameraScreen always force dark theme (camera/alarm context)

### Typography
- Use Paper's `Text` component with `variant` prop for all text: `displaySmall`, `headlineMedium`, `titleLarge`, `bodyLarge`, `labelMedium`, etc.
- No custom font sizes unless a specific display element requires it (e.g., large clock face in alarm screens)

### Shape
- Cards / surfaces: `borderRadius: 16` (M3 "large") by default
- Bottom sheets: `borderTopLeftRadius: 28, borderTopRightRadius: 28` (M3 "extra large")
- FABs: `borderRadius: 16` (M3 "large")
- Chips: `borderRadius: 8` (M3 "small")

### Components
- `react-native-paper` v5 for all M3 components: `Appbar.Header`, `FAB`, `Button`, `Card`, `Surface`, `TextInput`, `Switch`, `Chip`, `SegmentedButtons`, `RadioButton`, `Dialog`, `ProgressBar`, `Divider`, `TouchableRipple`
- All buttons use Paper's `Button` with `mode="contained"` (filled), `mode="contained-tonal"` (tonal), `mode="outlined"`, or `mode="text"`
- FABs use Paper's `FAB` with `variant="primary"`
- Tab bar icons: `MaterialCommunityIcons` from `react-native-vector-icons`

### Elevation
- Use Paper's `Surface elevation={n}` for elevated containers (M3 tonal surface elevation)
- Navigation bar: `elevation: 3`

## Tech Stack

| Piece | Choice | Notes |
|---|---|---|
| Framework | Bare React Native | Expo can't access AlarmManager or foreground services |
| Push-up detection | MediaPipe | Unvalidated — test Week 1 |
| Alarm | `AlarmManager.setAlarmClock()` + foreground service | Required for OEM reliability |
| Billing | RevenueCat | Handles Android + eventual iOS, anonymous users, free tier |
| UI library | react-native-paper v5 | Full M3 implementation for React Native |
| Icons | react-native-vector-icons (MaterialCommunityIcons) | Required by react-native-paper |
| Backend | Supabase | Post-MVP only — when social ships |
| Auth | Google Sign-In | Post-MVP only — when accounts are required |
| Accent color | Warm orange / amber (`#FF6B00` seed) | Energy, urgency, action |
| Privacy policy | Placeholder URL | Replace with real hosted URL before Play Store submission |

**Test devices:** Personal Android phone + tablet. No Xiaomi/Samsung — source or use BrowserStack.

---

## Timeline

| Week | Goal |
|---|---|
| **1** | Prove the two existential risks: alarm fires reliably on 3+ devices; camera detects push-ups in real conditions. Gate — do not proceed without passing both. |
| **2** | Full alarm feature set: one-time + recurring, volume, sounds, manual fallback, outside push-up logging |
| **3** | Onboarding flow, reward banking, streak tracking |
| **4** | Paywall + RevenueCat, trial logic, downsell screens |
| **5** | Polish, Play Store submission prep |

---

## Open Questions

- [ ] Founder selfie placeholder — what image to use until real photo is ready?
- [ ] Persona logic — what quiz answer combinations map to which persona?
- [ ] Downsell timer: real countdown that fires once per user, or reset on re-open?
