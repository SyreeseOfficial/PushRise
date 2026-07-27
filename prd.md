# PushRise — Updated PRD

> Last revised: 2026-07-22

---

## The Bet

An alarm app where push-ups are the only snooze button. The pain point is validated (Pushy: 10k+ downloads, 4.5 stars). The opportunity is in Pushy's failure: bad detection, immediate paywall, no social, no rewards. PushRise wins by fixing all four.

**This app lives or dies on two things:**
1. The alarm actually going off (Android is hostile to background processes)
2. The camera detection being good enough that users don't bounce

Both have been partially validated. Alarm reliability is proven (setAlarmClock + foreground service works). Camera detection remains unvalidated on budget hardware—must monitor closely post-launch.

---

## Brand Identity

**Minimal, confident, premium.** Nike's boldness + Apple Fitness's polish. The "cool older brother" who actually works out — no hype, no fluff, just gets it done.

- **Primary color:** `#FF5500` (orange-red) + gradients to `#FF2D00`
- **Aesthetic:** Geometric sans-serif, clean edges, bold headlines. Pure white and pure black surfaces, subtle sunrise ambient glow (backgrounds only).
- **UI system:** Google Material Design 3 (M3) via react-native-paper. Dark/light/system theme modes.
- **Icon language:** MaterialCommunityIcons. Solid, geometric, confident.

### Asset Generation Prompts

**Logo / App Icon**
> Minimalist app icon, solid flat geometric mark. A circle (clock face) where the clock hands are positioned at 4:40 — the two hands angle downward like human arms pressing into the floor in a push-up position. Clean vector style, single color, white icon on deep black background. No text, no gradients, no shadows. The silhouette must instantly read as both a clock and a push-up. Inspired by Aaron Draplin, Pentagram minimalism. The mark is the only element.

**Feature Graphic (Play Store banner, 1024×500)**
> Apple Fitness-style premium 3D product render. A sleek glassy smartphone showing a clean white fitness app UI with bold orange typography. Background is pure white with an extremely subtle warm sunrise glow radiating from the bottom-left corner in muted amber tones. The phone is angled at 15 degrees, casting a soft shadow. The PushRise wordmark sits to the left in bold geometric sans-serif, deep charcoal color. Tagline below: "Wake up. Push up. Rise." Ultra clean, no clutter, premium editorial feel. Shot as if by Apple's product photography team.

**Screenshot Frame Style**
> App screenshot marketing frame. Pure white background. Phone mockup (Pixel-style Android, no bezels) displaying the app UI in light mode. Bold headline text above the phone in deep charcoal (#111111), geometric sans-serif, 80pt. A single thin orange accent line or dot as the only decoration. No gradients in the frame itself. Minimal, Nike-catalog confidence. The UI screenshot is the hero.

| Asset | Tool |
|---|---|
| Logo | Ideogram or Logoai |
| Feature graphic | Midjourney `--ar 2:1 --style raw` or Adobe Firefly |
| Screenshot frames | Figma (paste real UI screenshots — no AI needed) |

---

## Target User

- **Who:** Undisciplined males, ~15–25, beginner fitness level
- **Pain:** Hits snooze repeatedly, wants to get in shape but lacks structure
- **Motivation:** Needs something extreme and external to override their own laziness
- **Fitness level:** Can do roughly 5–10 push-ups. Default rep count: **10**
- **Device reality:** Likely a mid-range or budget Android phone, potentially in low light

> Hypothesis. Validate with real users post-launch. Adjust messaging / features if needed.

---

## MVP Scope (Shipped)

**Core Mechanics:**
- Alarm (one-time + recurring) with full-screen takeover
- Camera-based push-up detection (MediaPipe) + manual fallback
- Adjustable volume, device sounds, custom file sounds
- Outside-alarm push-up logging (camera or manual; all reps count toward bank)
- Reward banking (honor system, alarm reps + outside reps both count)
- Streak tracking (goal-completion only, one grace day per week)
- **Streak freezes:** earn 1 per 7-day milestone (max 3), auto-used to save streaks
- **Customizable titles:** unlock via streaks, equip to profile
- **Celebration modals:** cinematic level-up screens on major milestones
- **Daily goal tracking:** progress card on home screen
- **Engagement modes:** Leaderboard, Boss Battle, Community Challenge, Ghost Mode (compete with anonymous rivals)
- **Anonymous rival notifications:** 30–90min delay, fake persona, pseudo-social pressure
- Full onboarding flow (18 steps: hook, quiz, persona, alarm setup, rewards, commitment, permissions, paywall)
- Theme system (light/dark/system) configurable in settings
- Micro-interactions: haptic feedback, audio cues, confetti, toast notifications
- M3 design system throughout (cards, buttons, surfaces, typography, elevation)

**Out (post-launch):**
- Accounts / backend (MVP uses local-only state)
- Real leaderboards (currently fake seeded data)
- Hyper-local leaderboards (city/school level — requires backend)
- Social features, friend challenges
- Achievement share cards (Instagram/TikTok export)
- Family plans
- Referral program

---

## Core Mechanic — Alarm Flow

1. Alarm fires → full-screen takeover (`FLAG_SHOW_WHEN_LOCKED` + `FLAG_TURN_SCREEN_ON`), loud sound, Doze-bypass via `setAlarmClock()`
2. User sees **"I'm Ready"** button — intentional tap required, no auto-camera
3. Camera activates, rep counter overlays camera view
4. Reps accumulate in real-time; **partial reps do not count** (full range of motion required)
5. If user stops mid-set, counter pauses and resumes when they restart — no penalty, no reset
6. **Celebration modal** pops on alarm completion: cinematic animation, confetti, encouragement copy
7. Alarm dismisses when rep target is hit
8. All reps banked, streak updated, title progress tracked

**Alarm sound behavior:** User-configurable — alarm can stop when camera opens, or continue until push-ups are complete. Default: stops when camera opens. Configurable via SettingsScreen.

---

## Outside-Alarm Push-up Logging

Users can log push-ups anytime, not just during alarms. All reps count toward the push-up bank and daily goals.

- Accessible from Progress tab via FAB
- Options: camera-based counting (same MediaPipe detection) or manual entry
- Manual entry has no friction — it's the honor system
- Reps immediately visible on daily progress card
- Counts toward daily goal and streak

---

## Push-up Detection

**Primary:** Camera-based (MediaPipe pose detection + custom ROM angle logic)

**Known risk:** Cheap Android hardware + bad lighting + varied body sizes = imperfect detection. Acceptable for MVP — users understand detection is approximate and can fallback to manual if frustrated.

**Fallback (Manual):** Tap-per-rep button. More friction than camera to preserve intent — but always available as retention valve.

**Anti-cheat:** Cannot be enforced. Honor system. Onboarding and messaging reinforce that cheating only hurts the user. Celebration copy emphasizes authenticity ("The only person you're competing with is yourself").

---

## Reward Banking

Default pre-loaded rewards (TV time, gaming time, dessert, money, sleep-in hours, etc.). Users can add, delete, edit rewards and costs.

- All push-ups count: alarm sessions + outside logging
- Redemption is honor system — user marks as redeemed
- **No cosmetic/paywall restriction:** all reward features available to paid users post-onboarding

---

## Streak Tracking

Earned by dismissing an alarm with push-ups — not by opening the app or passive activity.

**Grace day:** One missed day per week doesn't break the streak. Reduces churn from streak anxiety.

**Streak freezes:** Earned 1 per 7-day milestone. Visible on ProgressScreen, auto-used when streak breaks (after grace expended). Max 3 freezes accumulated.

---

## Customizable Titles

Users unlock titles by hitting streak milestones (Day 7, Day 14, Day 30, etc.). Titles have unlock descriptions ("The Consistent," "The Unstoppable," etc.). Users can equip a single title to their avatar card. If a user un-earns a title (streak breaks past frozen point), title becomes locked again.

All titles available to paid users post-onboarding.

---

## Engagement Modes

Available on ProgressScreen alongside daily goal and streak tracking. All modes are **fake data for MVP** — designed for retention, social proof, and competition psychology.

### Leaderboard
Seeded fake leaderboard showing 10 top local users by total reps. Rank system (Bronze → Silver → Gold → Platinum → Diamond). User's position visible. Updates weekly to create "progress" illusion.

### Boss Battle
Single weekly opponent with escalating rep count. User competes against a fake persona. Win → reward points + badge.

### Community Challenge
Weekly group challenge (e.g., "1000 total reps this week"). Shows progress bar, % of community completion, user contribution. Creates group cohesion.

### Ghost Mode
User competes against a past-version snapshot of themselves (7 days ago). Shows daily comparison. Designed for self-competition, not external pressure.

All modes reinforce daily alarm completion. No backend required (all data seeded locally).

---

## Android Alarm Reliability

OEM battery optimization (Xiaomi, Samsung, Huawei, OnePlus) will silently kill background apps if not whitelisted.

**Implemented:**
- `AlarmManager.setAlarmClock()` — bypasses Doze, shown in status bar
- `SCHEDULE_EXACT_ALARM` permission (Android 12+)
- Foreground service with notification during alarm window
- Onboarding `battery` step: OEM-specific deep-link guide to disable battery optimization
- Reference: [dontkillmyapp.com](https://dontkillmyapp.com)

**Testing:** Validated on at least one OEM phone (personal device recommended; BrowserStack for additional OEMs).

---

## Onboarding Flow — Full Sequence (18 Steps)

**Goal:** Duolingo model — user sets their first alarm and experiences the core loop before hitting paywall. ~12–15 minutes of investment (quiz + alarm creation + reward setup) before payment gate. Sunk cost + momentum creates conversion.

**Conversion psychology applied throughout:** identity destruction + reconstruction ("You keep hitting snooze" → "You become someone who doesn't"), loss framing, loaded questions, progressive commitment, sunk cost, pain contrast.

---

### Phase 1 — Hook (Screens 1–3)

**Screen 1: Welcome**
> *"You keep hitting snooze."*
> *"Every snooze is a small loss. It adds up. Let's stop it."*
> **[Let's fix it →]**

**Screen 2: Founder's Note**
Digital handwritten-style note (cursive font), small profile image.
> *"Hey [Name],*
> *I built PushRise because I was you.*
> *Six alarms. Snoozed every single one.*
> *Then spent the rest of the day feeling behind before it even started.*
> *I needed something that wouldn't let me off the hook. So I built it.*
> *Now I wake up every morning knowing I already won.*
> *You can too.*
> *— Syreese"*

**Screen 3: Social Proof**
Two testimonials (real reviews post-launch, or representative personas):
> ★★★★★ *"Day 14. Never made it past day 3 with anything else. The push-ups are brutal at 6am — that's the point."* — Jordan, 19
> ★★★★★ *"I've tried every app. This one works because you can't skip it."* — Marcus, 22

---

### Phase 2 — Quiz / Personalization (Screens 4–10)

**Screen 4: Quiz Intro**
> *"Let's be honest with each other."*
> *"A few questions so we can build your plan."*

**Screen 5: Q1 — Snooze Severity**
> *"How bad is the snooze problem — really?"*
- "I wake up fine most days"
- "I hit snooze once or twice"
- "I hit snooze until I'm almost late"
- "I've actually been late because of it"

**Screen 6: Q1 Reflection** *(shows after answering Q1)*
> *"You're not lazy. You're untrained. There's a difference — and it's fixable."*

**Screen 7: Q2 — Fitness Level**
Card-based selection with emojis:
- 🛋️ "Starting from zero"
- 🏃 "Occasionally moving"
- 💪 "Pretty consistent"

**Screen 8: Q3 — Real Goal**
Card-based selection (every answer confirms need):
- ⏰ "My mornings are a mess"
- 💪 "I need to get my body back"
- 🔥 "Full reset. I'm done coasting"

**Screen 9: Q4 — Push-up Baseline**
> *"No ego. How many push-ups can you actually do right now?"*
- "5 or fewer"
- "Around 10"
- "15–20"
- "More than 20"

**Screen 10: Q5 — Reward Motivation**
Multi-select (checkboxes):
- More time before my day starts
- A stronger body
- Actually hitting my goals
- Feeling proud of myself
- Stop being late

---

### Phase 3 — The Plan (Screens 11–14)

**Screen 11: Fake "Analyzing" Loading**
Progress bar, 3–4 seconds. Cycling subtext:
- "Analyzing your wake-up patterns..."
- "Calculating your baseline..."
- "Designing your reward system..."
- "Building your personalized plan..."

**Screen 12: Persona Reveal**
Based on quiz answers, one of three types (localized copy):

*Severe snoozer + beginner:*
**"😴 The Sleeper"**
> *"You keep saying 'tomorrow.' Tomorrow never comes. PushRise was built for this."*

*Moderate snoozer + some fitness:*
**"⚡ The Restarter"**
> *"You start strong, then stop. You're not lazy — you just need real stakes. Now you have them."*

*Light snoozer + consistent:*
**"🎯 The Optimizer"**
> *"You're already doing well. You know there's another level. PushRise gets you there."*

**Screen 13: Dream Outcome**
Chart showing push-ups per week climbing over 30 days (staggered stat reveal animation).
> *"In 30 days, you'll be a different person."*
> *"Users who complete 7 days don't quit. The first morning is the hardest. After that, it becomes who you are."*

**Screen 14: Journey Summary**
> *"Here's your plan, [Name]."*
- Wake time: [their answer]
- Starting reps: [based on their count]
- Goal: [their stated goal]
- Reward: [what they're grinding for]
> *"In 7 days, this won't feel like a choice. It'll feel like who you are."*
> **[Set Your First Alarm →]**

---

### Phase 4 — Investment (Screen 15)

**Screen 15: Create First Alarm**
Embedded alarm creation UI inside onboarding — time picker + rep count.
> *"Now set it. Don't overthink — just pick a time you actually need to wake up."*

IKEA effect in action: they invest before payment, commitment hardens.

---

### Phase 5 — Close (Screens 16–18)

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
> 🔔 Notifications — streak reminders + trial warnings
> 🔋 Battery access — so your alarm fires even when your phone tries to save power
> **[Got it →]**

**Screen 18: Paywall — Hard Gate (No Trial)**
> **"Wake up a different person."**
>
> *"Willpower doesn't work. Reminders don't stick. Nothing worked because nothing had real stakes. PushRise makes skipping impossible."*

Three plan options:

| Plan | Price | Subtext |
|---|---|---|
| 📅 **Weekly** | $3.99/week | Try it out |
| 📆 **Annual** | $19.99/year | **Save 90%** — best value |
| 🏆 **Lifetime** | $39.99 | Pay once, keep forever |

Copy below paywall:
> *"All plans include:"*
> ✓ Unlimited alarms  
> ✓ Camera + manual rep logging  
> ✓ Reward banking  
> ✓ Streak tracking & freezes  
> ✓ Customizable titles  
> ✓ Engagement modes (leaderboard, boss battle, challenges)  
> ✓ Dark/light/system themes

**[Purchase →]** (button text changes based on selected plan: "Start Weekly," "Start Annual," "Own Lifetime")

No "Skip" or "Continue Free" option. **Hard gate:** users must purchase one of the three tiers to proceed to the main app.

Purchase triggers: start trial marker (for notification scheduling, eventual backend), complete onboarding, navigate to MainTabs.

---

## Monetization

| Option | Price |
|---|---|
| Weekly | $3.99/week |
| Annual | $19.99/year |
| Lifetime | $39.99 |

**Model:** Hard paywall at end of onboarding. No free trial, no freemium features. One-time purchase unlocks all features forever (lifetime tier) or recurring subscription (weekly/annual).

**Billing:** RevenueCat handles all payments. Anonymous users supported (no accounts required).

**Post-payment:** User has immediate access to all features. No gating. No "trial expired" walls.

### Revenue Math (Provisional)

5,000 downloads × 8% conversion rate (hard wall) = 400 paying users
- 250 annual tier × $19.99 = **$4,997 one-time**
- 100 lifetime × $39.99 = **$3,999 one-time**
- 50 weekly × $3.99 × 52 = **$10,374 annual recurring**

Month 1: ~$8,996 (annual + lifetime split) | Month 2+: ~$865/month (weekly recurring)

Bottleneck is top-of-funnel conversions. Hard paywall will reduce download volume but increase per-user revenue and retention (users who pay are invested).

---

## Review Prompt

**Not during onboarding.** Fires after first alarm is successfully dismissed with push-ups. That's the emotional peak — the first real win. That's when you ask for a review.

Native Android in-app review API (Google Play review library).

---

## Notifications

**Trial/payment reminders:** (Deferred with backend if needed; local notification scheduling works fine for MVP)
- Day 5: "You've got 2 days left" (informational, not pushy)
- Day 7: "Last chance today before trial expires" (if trial system ever re-added)

**Streak reminder:** Daily at user-configurable time (default 9pm). Toggleable in SettingsScreen.
> *"You're on a [X]-day streak. Tomorrow's the day to keep it alive."*

**Anonymous rival notifications:** 30–90min delay after user completes an alarm.
> *"Marcus crushed 15 reps this morning. You did 10. Match him tomorrow?"*

Fake persona, seeded data, designed for social proof + motivation.

---

## Design System

All UI follows **Google Material Design 3 (M3)**. Every design decision — color, typography, spacing, shape, components — conforms to M3 spec.

### Color
- **Seed color:** `#FF5500` (orange-red) — generates full M3 tonal palette via HCT color system
- **Light and dark schemes:** Both auto-derived from seed
- **Theme modes:** Light / Dark / Follow System (user selectable in SettingsScreen)
- **Exceptions:** AlarmFiringScreen and BankCameraScreen always force dark theme (camera overlay context)
- **Never hardcode hex:** Always use `theme.colors.*` from react-native-paper's `useTheme()`

### Typography
- Paper's `Text` component with `variant` prop: `displaySmall`, `headlineMedium`, `titleLarge`, `bodyLarge`, `labelMedium`, etc.
- No custom font sizes unless required (e.g., large clock face in alarm screens)

### Shape
- **Cards/surfaces:** `borderRadius: 16` (M3 "large")
- **Bottom sheets:** `borderTopLeftRadius: 28, borderTopRightRadius: 28` (M3 "extra large")
- **FABs:** `borderRadius: 16` (M3 "large")
- **Chips:** `borderRadius: 8` (M3 "small")

### Components
- **Library:** react-native-paper v5 for all M3 components (`Appbar.Header`, `FAB`, `Button`, `Card`, `Surface`, `TextInput`, `Switch`, `Chip`, `SegmentedButtons`, `RadioButton`, `Dialog`, `ProgressBar`, `Divider`, `TouchableRipple`)
- **Buttons:** `mode="contained"` (filled), `mode="contained-tonal"` (tonal), `mode="outlined"`, or `mode="text"`
- **FABs:** `variant="primary"`
- **Icons:** MaterialCommunityIcons via react-native-vector-icons

### Elevation
- Paper's `Surface elevation={n}` for elevated containers (M3 tonal surface elevation)
- Navigation bar: `elevation: 3`

---

## Tech Stack

| Piece | Choice | Notes |
|---|---|---|
| Framework | Bare React Native | Expo cannot access AlarmManager or foreground services |
| Push-up detection | MediaPipe (custom ROM angle logic) | Validated Week 1, acceptable accuracy on budget hardware |
| Alarm | `AlarmManager.setAlarmClock()` + foreground service | Required for OEM reliability, Doze bypass |
| Billing | RevenueCat | Handles Android, anonymous users, subscription management |
| UI library | react-native-paper v5 | Full M3 implementation for React Native |
| Icons | react-native-vector-icons (MaterialCommunityIcons) | Required by react-native-paper, ~600 icons |
| State management | Zustand + MMKV | Local-only MVP (no backend) |
| Notifications | Notifee | Streak reminders, rival notifications, trial warnings |
| Animations | React Native Animated, Lottie | Confetti (react-native-confetti-cannon), staggered reveals, celebration modals |
| Camera | react-native-vision-camera | Hardware camera access for pose detection |
| Themes | react-native-paper + custom M3 theme | Dark/light/system modes, seed color derivation |
| Backend | None (MVP) | Supabase deferred for post-launch social features |
| Auth | None (MVP) | Google Sign-In deferred when accounts needed |

---

## Current App State

Launched screens:
- **Alarms:** Create, list, fire, manual/camera dismiss, snooze
- **Progress:** Daily goal tracker, streak display, freeze counter, engagement modes (leaderboard, boss battle, community challenge, ghost mode), replay of past wins
- **Rewards:** List, redeem, create, delete, edit, emojis
- **Settings:** Theme (light/dark/system), permissions, streak reminder time, volume, sound selection, haptic/audio cue toggles, keep-screen-on toggle, camera preference (front/back)
- **Onboarding:** Full 18-step flow with quiz, persona, alarm setup, rewards, commitment, permissions, paywall
- **Celebration:** Cinematic modals on alarm completion, streak milestones, freeze earn, title unlock

---

## Timeline

| Phase | Goal |
|---|---|
| **MVP (Shipped)** | Alarm, detection, rewards, streaks, onboarding, paywall, engagement modes, M3 design |
| **Post-Launch v1.1** | Backend (Supabase), accounts (Google Sign-In), real leaderboards (seeded initially), hyper-local competition |
| **v1.2–1.5** | Social features (friend challenges), achievement cards, referral program, premium cosmetics (optional) |
| **v2** | Accounts, social graph, real backend infrastructure, potential iOS port |

---

## Open Questions / Deferred

- [ ] Hard paywall conversion rate: will 8% survive user testing, or do we need trial?
- [ ] Camera accuracy on ultra-budget phones (sub-$100 Android): acceptable for launch or gate to manual-only?
- [ ] Anonymous rival personas: should names/avatars be randomized more, or locked per session?
- [ ] Leaderboard refresh: weekly is good, or should it update daily?
- [ ] Streak freeze: should users be able to manually redeem one, or only auto-use on break?
- [ ] Post-payment: add "settings" link to RevenueCat Manage Subscriptions, or build custom flow?

---

## Success Metrics

**Post-launch tracking (via analytics SDK):**
- **Day 1 Retention:** % of users who return and complete 2nd alarm
- **Day 7 Retention:** % of users with active 7-day streak
- **Paywall Conversion:** % of users who complete onboarding and purchase
- **Alarm Firing:** % of scheduled alarms that fire within 2-minute window (reliability metric)
- **Camera Accuracy:** % of reps counted vs. manual verification (detection quality)
- **Engagement Modes:** % of users who visit leaderboard/boss battle/challenges (retention hook)
- **Purchase Tier Distribution:** % opting for weekly vs. annual vs. lifetime (LTV composition)

