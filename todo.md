# PushRise — Todo

Tracks everything that needs to happen. Grouped by phase. Check off as done.

---

## My Ideas (Not by AI)
- Limited-time reward slots: "Pizza reward available for the next 48 hours" (you set it, the app surfaces it urgently)
- "Power hour" window each morning where reps count double
- ~~"Your friend just did 30 push-ups"~~ → **SHIPPED** as Anonymous Rival: fake push notification 30-90min after completing an alarm ("Marcus T. just passed you. You're now #4.")
- ~~Re-engagement: "You haven't opened PushRise in 2 days."~~ → **SHIPPED** as Daily Nudge: configurable time, auto-cancels when reps logged
- Rewards locked behind rep thresholds that feel achievable but take real grinding (e.g., "500 reps to unlock custom sounds")
- Premium rewards slot that refreshes weekly — you have to check back
- Rep multiplier that grows with your streak (1x day 1 → 1.5x day 3 → 2x day 7). Miss a day? It resets to 1x. Watching a 2x multiplier die is devastating.
- ~~Daily challenge: "Today: 75 push-ups before 2pm. 1,247 people accepted." (fake number, new challenge every day)~~ → **SHIPPED**: seeded daily card in Progress tab + 8am push notification
- "Viral moment": when you hit a milestone the app says "This won't be shown again — screenshot now." Makes the moment feel scarce.
- Morning unlock ritual: until you bank 10 reps, a subtle "not warmed up yet" indicator shows on your avatar. Compulsion to clear it before the day starts.
- ~~After banking reps: "Add 5 more to hit a round 50?" People hate odd numbers. Biggest ROI of the whole list.~~ → **SHIPPED**: snackbar with [Add] action fires whenever todayReps lands 1–4 below a multiple of 5
- ~~Late-night notification: "23 PushRisers are grinding right now. The gym is quiet — perfect time to train"~~ → **SHIPPED**: configurable time (default 10pm), auto-cancels when reps logged that day, toggle in Notifications settings

--- 

## Before Coding Starts

- [x] Fill out `pre-build.md` completely — DONE (screens, copy, voice, rewards, badges)
- [ ] Decide: Xiaomi/Samsung testing — borrow a device or use BrowserStack (real device cloud)
- [x] Set up RevenueCat account and create products (monthly + lifetime) in Google Play Console
  - [x] RevenueCat account created
  - [x] Entitlement created: `PushRise Pro`
  - [x] Packages created: `monthly` and `lifetime`
  - [x] **Google Play identity verification complete**
  - [x] Play Console app created (PushRise, Free, App)
  - [x] Store listing filled out
  - [ ] Upload first signed AAB to internal testing track ← **required before products can be created**
  - [ ] Create subscription product in Play Console: ID `monthly`, price $2.99/mo, base plan ID `monthly-base`
    - [ ] Create one-time product in Play Console: ID `lifetime`, price $14.99
    - [ ] Create discounted subscription: ID `monthly-discounted`, price $1.49/mo, base plan ID `monthly-discounted-base`
    - [ ] Import all 3 products into RevenueCat (Product catalog → Products → + New product)
    - [ ] Attach `monthly` and `lifetime` to `PushRise Pro` entitlement (already set up)
    - [ ] Attach `monthly-discounted` to `PushRise Pro` entitlement
    - [ ] In RevenueCat Offerings: create `default` offering with `$rc_monthly` (→ monthly) and `$rc_lifetime` (→ lifetime) packages; mark as Default
    - [ ] In RevenueCat Offerings: create `downsell` offering with `$rc_monthly` (→ monthly-discounted) package
    - [ ] Rename "Test Store" app to "PushRise" in RevenueCat (Project settings → Apps)
    - [ ] Wire `Downsell1Screen.handleBuy` to purchase `downsell` offering (see code comment in that file)
- [x] Set up bare React Native project scaffold

---

## Week 1 — Validation Gate (do not proceed past here without passing both)

- [x] Alarm fires reliably on personal Android phone (foreground service + `setAlarmClock`)
- [ ] Alarm fires reliably on personal Android tablet
- [x] ML Kit detects push-ups acceptably on personal Android phone in real conditions (switched from MediaPipe — snapshot-based, works in airplane mode)
- [x] Decision made on camera fallback path — manual hold-button mode built and shipped

---

## MVP Build

- [x] Alarm — one-time + recurring, volume control (continuous slider 0–100%), 3 bundled sounds with preview
- [x] Full-screen alarm takeover when alarm fires (notifee fullScreenAction + `FLAG_SHOW_WHEN_LOCKED`)
- [x] Camera push-up detection (ML Kit, not MediaPipe — snapshot-based, no network needed)
- [x] Manual fallback mode (hold-button-per-rep)
- [x] **Outside-alarm push-up logging** — Progress tab Bank Push-ups CTA; camera or manual; all reps count toward bank
- [x] Battery optimization onboarding screen (OEM-specific instructions framed as "make your alarm bulletproof") — Samsung and Xiaomi extra steps shown only on matching devices
- [x] Notification permission onboarding screen (Permissions screen in settings + onboarding)
- [x] Onboarding flow — 5 steps: welcome, create-alarm, daily-goal, grinding-for commitment, complete; analyzing screen has staggered stat reveal + persona type-in animation; stepper replaces slider for goal input; battery step has direct "Open Battery Settings →" deep link
- [x] Reward banking — 5 default rewards pre-loaded; user-created custom rewards; emoji picker; Paper Dialog redemption; confetti on redeem
- [x] Streak tracking (goal-completion only, 1 grace day per 7-day rolling window)
- [x] RevenueCat paywall integration (7-day trial → monthly or lifetime)
- [x] Trial warning notifications (Day 5, Day 7)
- [x] Post-trial state: push-up mechanic locked, alarm still fires (user sees what they're missing)
- [x] Downsell screen 1: discounted price + real 15-min countdown timer
- [x] Downsell screen 2: 3-day trial extension (one-time, non-repeatable)
- [x] Review prompt — fires after first alarm successfully dismissed with push-ups (NOT during onboarding)
- [x] Level-up celebration modal — cinematic evolution animation (old emoji → new emoji) + confetti + brand gradient title pill; fires globally from any screen when `addReps()` crosses a level threshold

---

## Play Store Submission (Week 5)

- [x] UI/UX audit (2026-07-26) — 35 issues resolved: C1–C5 critical data/flow, H1–H11 polish, L1–L19 minor friction (H4 skipped intentionally)
- [x] App icon (512×512 PNG) — uploaded to Play Console
- [x] Add `beep.wav` to `android/app/src/main/res/raw/` (required for audioCueOnRep feature)
- [x] Feature graphic (1024×500) — uploaded to Play Console
- [x] Screenshots — uploaded to Play Console
- [x] Store listing copy — uploaded to Play Console
- [x] Privacy policy — live at syreese.com/pushrise/privacy-policy
- [ ] Camera permission justification statement for Play Store review
- [x] Subscription terms copy — saved in `subscription-terms.md` (**delete file before submission**); still needs to be wired into the paywall UI near the purchase buttons
- [ ] Test full purchase flow end-to-end on a real device with a test account

---

## Post-MVP Roadmap

Do not build until MVP is live and has real users.

- [ ] **Backend** — Supabase. Required before any social feature ships.
- [ ] **Accounts / Auth** — Google Sign-In. Required for social. RevenueCat handles anonymous users fine until then.
- [ ] **Social: Friend challenges** — challenge a friend to a push-up duel (1 day or 1 week)
- [ ] **Social: Hyper-local leaderboards** — city/school level, not global
- [ ] **Social: Achievement share cards** — Instagram/TikTok stat cards; organic growth engine; design this carefully
- [ ] **Referral program** — "Invite a friend, earn push-up bank bonus." Deferred because it requires backend + accounts (both post-MVP) and RevenueCat doesn't handle it natively. Revisit after social ships.
- [ ] **iOS port** — 2–3 weeks after Android is stable
- [ ] **Family plan** — post-social

---

## UI/UX Polish — Audit Findings (2026-07-23)

Findings from a full codebase audit. Grouped by effort. Fix the XS/S items before Play Store submission — they affect first impressions.

---

### Touch Feedback (broken or missing)

- [x] **[XS] Wire the dead `Pressable` on alarm cards** — `AlarmListScreen.tsx:231`: `<Pressable style={{flex: 1}}>` has no `onPress` and blocks ripple from children. Wire it to `navigation.navigate('AddAlarm', {alarmId: alarm.id})` so tapping the card body opens edit (same as the pencil icon).
- [x] **[S] Replace `TouchableOpacity` with `TouchableRipple` in all Settings rows** — `SettingsScreen.tsx:113,135,157`: `TapRow`, `SwitchRow`, `DangerRow` all use `TouchableOpacity activeOpacity={0.6}`. On a white card this is invisible. Swap all three to `TouchableRipple` from `react-native-paper`.
- [x] **[S] Replace `TouchableOpacity` with `TouchableRipple` on the two Progress hero cards** — `ProgressScreen.tsx:619` ("Bank Push-ups") and `643` ("Feeling lucky?"). These are the two primary actions on the tab; they deserve visible tap feedback.
- [x] **[S] Same for mode-sheet option rows (Camera / Manual)** — `ProgressScreen.tsx:845,859`. Both use `TouchableOpacity activeOpacity={0.8}` over a card background. Swap to `TouchableRipple`.
- [x] **[M] FABs on Alarms and Rewards use `TouchableOpacity` over a gradient** — `AlarmListScreen.tsx:522`, `RewardsScreen.tsx:411`. Wrap the `LinearGradient` in a `Pressable` with `android_ripple` or use `TouchableRipple borderless` for native Android feel.

---

### Visual Bugs

- [x] **[XS] Clamp community challenge progress bar to 100%** — `ProgressScreen.tsx:747`: `width: \`${(communityGoal.total / communityGoal.goal) * 100}%\`` overflows if total > goal. Fix: `Math.min((communityGoal.total / communityGoal.goal) * 100, 100)`.

---

### Micro-interactions & Polish

- [x] **[S] Cross-fade between AlarmFiringScreen mode states** — `AlarmFiringScreen.tsx:300,343,355,367`: `idle → camera/manual → done` swaps are instant. Add a fade via `Animated.timing` on opacity wrapping each mode's view. This is the most emotionally loaded moment in the app — it should feel smooth. Pattern: fade out (120ms) → swap mode → fade in (200ms).
- [x] **[S] Animate disabled alarm card opacity** — `AlarmListScreen.tsx:221`: `opacity: enabled ? 1 : 0.45` is a raw style, so toggling an alarm snaps the card opacity instantly. Convert to an `Animated.Value`, drive it with `Animated.timing 200ms` inside `handleToggle`.
- [x] **[XS] Spring entrance for the "done" state emoji on AlarmFiringScreen** — `AlarmFiringScreen.tsx:367`: The 💪 + success text appear instantly. Add a `scale` spring from 0→1 on the completion view to give the moment physical weight.
- [x] **[XS] Add 300ms delay on focus-triggered celebration modals** — `ProgressScreen.tsx:499–505`: `useFocusEffect` fires before the first paint, so returning from camera immediately pops a modal before the user sees the screen. Wrap in `setTimeout(..., 300)`.
- [x] **[M] Prevent alarm card slide-in animation re-firing on reorder** — `AlarmListScreen.tsx:150–157`: `useEffect([], [])` fires on every `AlarmCard` mount. After a drag-reorder, re-mounted cards slide in from the right again — jarring. Fix: wrap `AlarmCard` in `React.memo` or track a `hasMounted` ref inside the card.
- [x] **[XS] Extract `AnimatedCounter` and use it on the camera counter in AlarmFiringScreen** — `AlarmFiringScreen.tsx:58,136`: The rep count displayed during camera/manual counting jumps instantly. The `AnimatedCounter` component already exists in `AlarmListScreen.tsx:23–32` — move it to a shared file and use it on both counters.
- [x] **[XS] Reduce slots-to-modal delay from 350ms to 200ms** — `RewardsScreen.tsx`: `setTimeout(() => setShowSlots(true), 350)` after closing the wager sheet feels like a dead pause. The slots modal entrance is animated anyway; 200ms is enough.

---

### Information Architecture & Clarity

- [x] **[S] Add section headers to the Progress scroll** — added "This Week" before Community Challenge and "History" before Monthly Calendar.
- [x] **[S] Move "Feeling Lucky?" slots below the stat cards** — feature was already relocated to RewardsScreen and AlarmFiringScreen in a prior session; no longer in ProgressScreen.
- [x] **[XS] Add a `⋮` hint icon to RewardCards** — added `Icon source="dots-vertical"` at top-right of each RewardCard with `pointerEvents="none"`.
- [x] **[XS] Replace Contact Support Alert with `mailto:` link** — now uses `Linking.openURL('mailto:syreeseofficial@gmail.com')`.
- [x] **[XS] Hide or fix the "Rate PushRise" Play Store link** — row removed from Settings until app is live on Play Store.
- [x] **[XS] Show a "Tap again to confirm" label on pending-delete alarm** — "Tap again" text appears below trash icon when `pendingDelete === true`.
- [x] **[S] Add an inline CTA to the empty alarm state** — "Create Alarm" button added below instructional text.
- [x] **[S] Increase snooze button touch targets** — removed `compact`, added `contentStyle={{paddingVertical: 8}}` to all three snooze buttons.

---

## Known Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Framework | Bare React Native | Expo can't access AlarmManager |
| Billing | RevenueCat | Abstracts Play Billing, handles anonymous users, iOS-ready |
| Backend | Supabase (post-MVP) | No backend needed for MVP |
| Auth / Accounts | Post-MVP only | Not needed until social features require it |
| Social | Post-launch | Needs user base to be useful |
| Lifetime price | $14.99 | $4.99 makes monthly LTV worse |
| Post-trial behavior | Lock push-up mechanic, not alarm | Killing alarm = 1-star reviews |
| Streaks | Goal-completion only | Opening-app streaks cause burnout |
| Alarm push-ups → bank | Yes, count toward bank | Separating them punishes core behavior |
| Outside push-up logging | MVP feature | Users need to bank push-ups beyond alarms |
| Referral program | Post-MVP | Needs backend + accounts; complex |
| Review ask | After first alarm dismissed | In-onboarding ask = 1-star risk |
| Social proof number | Removed | No fake numbers; use copy instead |
| Accent color | Warm — orange/amber | Energy, urgency, action; fits male 15–25 demo |
| Alarm sounds | Device sounds + custom file | Ship both on day 1 |
| Privacy policy | Placeholder URL → real before launch | Play Store requirement |
