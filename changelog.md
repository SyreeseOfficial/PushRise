# PushRise Changelog

This file tracks every major decision, change, or milestone made on PushRise — product, technical, and strategic. If an AI assistant loses context mid-session or a new session starts cold, **read this file first**. It is the source of truth for what has been done, what was decided, and why.

Format: newest entries at the top.

---

## 2026-07-27 — Code Audit Fixes (P0–P3)

Completed all items from `CODE_AUDIT.md`. File deleted.

### P0 — Snapshot files never deleted (memory leak on disk)
- **Fix:** Added `file.delete()` calls in `PoseDetectionModule.kt` on both success and failure paths of `detectFromFile()`. One line of Kotlin, no new JS dependency. JPEG snapshots are now deleted immediately after ML Kit processes them.

### P1 — Alarm clock display frozen
- **Fix:** Added `clockTime` state + 30s `setInterval` in `AlarmFiringScreen`. The displayed time now updates live.

### P1 — Modal queue collision in ProgressScreen
- **Fix:** Cascaded modal fire order — `showFreezeEarned` only fires if `pendingCelebration` is absent. `dismissCelebration()` now chains into `setShowFreezeEarned(true)` if a freeze was earned. Modals no longer stack invisibly.

### P1 — `nextAlarmLabel` goes stale across minute boundaries
- **Fix:** Added `tick` state + 60s `setInterval` in `AlarmListScreen`. `useMemo` now depends on `[alarms, tick]`, recomputing every minute.

### P1 — Paywall bypass possible
- **Verified safe.** `handleComplete()` is only called after a successful `purchasePackage()` or `restorePurchases()`. No skip path reaches it.

### P2 — `cleanup()` in AlarmFiringScreen doesn't guarantee navigation
- **Fix:** Wrapped alarm reschedule/cancel in `try/catch`. `navigation.goBack()` is now always reached even if `scheduleAlarm()` throws.

### P2 — Shared MMKV storage ID
- **Fix:** `alarmStore` uses `makeMMKVStorage('pushrise-alarms')`, `bankStore` uses `makeMMKVStorage('pushrise-bank')`. Each store now has its own MMKV instance.

### P2 — `dailyHistory` prune mutates inside IIFE
- **Fix:** Replaced `Object.keys(h).forEach(delete)` with `Object.fromEntries(Object.entries(h).filter(...))`.

### P2 — Community goal interval runs off-screen
- **Fix:** Moved 30s `setInterval` from `useEffect` to `useFocusEffect` in `ProgressScreen`. Interval only runs when the Progress tab is focused.

### P2 — Unnecessary `<>` fragment in idle mode
- **Fix:** Removed dead `<>` / `</>` wrappers from the idle mode block in `AlarmFiringScreen`.

### P3 — `alarmParamsFromData` duplicated in App.tsx and notifee.ts
- **Fix:** Moved `alarmParamsFromData` into `notifee.ts` as a named export. `App.tsx` now imports it. `setupForegroundHandler` uses it too.

### Files changed
- `android/app/src/main/java/com/pushrise/PoseDetectionModule.kt` — P0 snapshot cleanup
- `src/screens/alarms/AlarmFiringScreen.tsx` — P1 live clock, P2 cleanup guard, P2 dead fragment
- `src/screens/alarms/AlarmListScreen.tsx` — P1 stale nextAlarmLabel
- `src/screens/progress/ProgressScreen.tsx` — P1 modal cascade, P2 off-screen interval
- `src/store/alarmStore.ts` — P2 named MMKV ID
- `src/store/bankStore.ts` — P2 named MMKV ID, P2 mutation fix
- `src/utils/notifee.ts` — P3 shared alarmParamsFromData
- `App.tsx` — P3 use shared alarmParamsFromData
- `CODE_AUDIT.md` — deleted (all items resolved)

---


This file tracks every major decision, change, or milestone made on PushRise — product, technical, and strategic. If an AI assistant loses context mid-session or a new session starts cold, **read this file first**. It is the source of truth for what has been done, what was decided, and why.

Format: newest entries at the top.

---

## 2026-07-27 — Full UI/UX Audit Complete (C1–C5, H1–H11, L1–L19)

### Overview
Completed a full UI/UX audit (`ui-ux-improvements.md`, 2026-07-26). 35 issues identified and fixed across Critical, High, and Low tiers. H4 intentionally skipped (collapsed Progress engagement cards rejected — kept separate). File deleted on completion.

### Critical (C1–C5)
- **C1 — Onboarding data discarded after purchase:** `handlePurchase()` duplicated only 3 of `handleComplete()`'s 5 side effects — alarm, reward, and `userName` were never saved on the purchase path. Fixed by replacing the inline block with `await handleComplete()`.
- **C2 — Skip/bypass too prominent:** Both "Skip" and "Emergency bypass" removed from the centered idle block in `AlarmFiringScreen`. Re-rendered as ghost text (`fontSize: 12`, `opacity: 0.4–0.5`) absolutely anchored to `bottom: 40` — visually separated from the primary action.
- **C3 — No pose detection indicator:** Pulsing "Detecting…" label added below the rep count in `CameraCounter` (AlarmFiringScreen) and `BankCameraScreen`. Rep counter switches from brand orange to white while a pose frame is actively landing; reverts after 600ms of no frame.
- **C4 — Settings only reachable from Alarms tab:** Gear icon (`IconButton cog-outline`) added to Progress and Rewards screen headers. `RewardsScreen` got new `useNavigation` + `IconButton` imports.
- **C5 — Onboarding alarm one-time instead of recurring:** `days: []` → `days: [0,1,2,3,4,5,6]` in `handleComplete()`.

### High (H1–H11, H4 skipped)
- **H1:** Paywall "7-day free trial" copy removed (no trial per PRD); CTA changed to "Get Started →"
- **H2:** Settings shows "Manage Subscription" instead of "Upgrade to Pro" for subscribed users
- **H3:** Rewards delete UX unified — double-tap to match alarm cards (was long-press)
- **H5:** "Double-tap to edit or delete" hint in empty rewards state
- **H6:** Pencil edit icon removed from alarm cards (card body tap already navigates to edit)
- **H7:** Boss battle loss color changed from `c.error` (red) to `c.primary` (brand orange) on `c.surfaceVariant`
- **H8:** "← Cancel" text button added to `BankCameraScreen` top-left
- **H9:** One-time reward redemption dialog warns the reward will be removed on use
- **H10:** Camera permission flow wired in `BankCameraScreen` — requests on mount, "Grant Camera Access" button on denial
- **H11:** "No snoozes left" label shown when `snoozeCount >= 3` (snooze buttons previously vanished silently)

### Low (L1–L19)
- L1: Share card copy "iOS & Android" → "Android"
- L2: Today's calendar day gets a subtle background indicator
- L3: "pushups" → "push-ups" in calendar tooltip
- L4: Calendar day headers "T/T" → "Tu/Th" (Tuesday vs Thursday)
- L5: "Next: 6:30 AM, in 7h 22m" shown in Alarms header when an alarm is enabled
- L6: Manual counter tap button uses `btnScale` spring animation (matches camera counter)
- L7: Slots card moved off Progress screen (was directly below Bank CTA, churn risk)
- L8: Q1 snooze step auto-advance timer extended to 10s (was 5s — misclassified users who paused to read)
- L9: `setDebugAngle` in `BankCameraScreen` now guarded with `__DEV__`
- L10: Onboarding alarm rep input switched to ± stepper (was plain TextInput; AddAlarm uses stepper)
- L11: Commitment step placeholder updated to "e.g. Wake up with energy, prove I can commit"
- L12: Bank balance shown above manual rep entry input on Progress sheet
- L13: Non-numeric manual rep input now shows inline validation error
- L14: Alarm save triggers `Vibration.vibrate(50)` before `navigation.goBack()`
- L15: Reward action dialog subtitle shows cost in reps
- L16: Active calendar days get a faint border; padding cells stay blank
- L17: Emergency bypass cost row always rendered, dimmed (`opacity: 0.4`) when toggle is off
- L18: Ghost mode placeholder shown for day-1 users ("Ghost mode activates tomorrow — race your past self")
- L19: Reward card title capped to 1 line with `ellipsizeMode="tail"`

### Files changed
- `src/screens/onboarding/OnboardingScreen.tsx` — C1, C5, H1, L8, L10, L11
- `src/screens/alarms/AlarmFiringScreen.tsx` — C2, C3, H11, L6
- `src/screens/progress/BankCameraScreen.tsx` — C3, H8, H10, L9
- `src/screens/alarms/AlarmListScreen.tsx` — H6, L5
- `src/screens/progress/ProgressScreen.tsx` — C4, H7, L1, L7, L12, L13, L18
- `src/screens/rewards/RewardsScreen.tsx` — C4, H3, H5, H9, L15, L19
- `src/screens/settings/SettingsScreen.tsx` — H2, L17
- `src/components/MonthlyCalendar.tsx` — L2, L3, L4, L16
- `src/screens/alarms/AddAlarmScreen.tsx` — L14
- `ui-ux-improvements.md` — deleted (all items resolved)

---

## 2026-07-21 — Level-Up Celebration Modal

### Feature
Added a cinematic full-screen celebration when the user hits a new avatar level (10 levels total, Seedling → Legend).

### Implementation
- **Detection:** `addReps()` in `bankStore.ts` now compares `getAvatarLevel(s.totalReps)` (before) vs `getAvatarLevel(newTotal)` (after) on every rep submission. On a level change, sets `pendingLevelUp: { fromLevel, fromEmoji, toLevel, toEmoji, toLabel }` — same pattern as `pendingCelebration`.
- **Component:** `src/components/LevelUpModal.tsx` — full-screen black overlay with a sequenced animation: old emoji fades/shrinks out → new emoji springs in → level number + brand gradient title pill slides up → "Let's gooo 💪" button appears → confetti cannon fires (140 particles). "✦ SCREENSHOT TO SHARE ✦" hint below the button.
- **Global mount:** `<LevelUpModal />` added to `App.tsx` inside `PaperProvider`, so it fires regardless of which screen triggered the rep submission (camera screen, manual entry, etc.).

### Files changed
- `src/store/bankStore.ts` — added `LevelUp` interface, `pendingLevelUp` state to `BankStore` + `BANK_DEFAULTS`, level-up detection in `addReps()`, `clearLevelUp()` reducer
- `src/components/LevelUpModal.tsx` — new file
- `App.tsx` — imports and renders `<LevelUpModal />`

---

## 2026-07-21 — Google Play Console Setup

- Play Console app created: PushRise, Free, App type
- Store listing completed
- Attempted to create subscription products — blocked. Play Console requires at least one AAB uploaded to a testing track before the Monetize tab unlocks product creation
- Next step: build signed release AAB, upload to internal testing track, then create products

---

## 2026-07-20 — UI Polish Tiers 1–4 Complete

### Tier 1 — Broken Feature Fixes
- **autoCompleteAlarm:** `useEffect` now auto-dismisses the alarm 800ms after reps are done (was wired but never triggered)
- **audioCueOnRep:** `beep.mp3` plays on each rep in ManualCounter, CameraCounter, and BankCameraScreen (requires `beep.mp3` in `res/raw/`)
- **Debug angle overlay:** guarded with `__DEV__` in `AlarmFiringScreen` and `BankCameraScreen` — no longer visible in release builds
- **Battery optimization deep link:** "Open Battery Settings →" button added to onboarding battery step; opens system battery settings directly

### Tier 2 — Engagement Wins
- **Daily goal confetti:** fires in `ProgressScreen` the first time the daily goal is crossed
- **Alarm completion confetti + streak line:** added to `AlarmFiringScreen` done mode
- **Daily goal progress in counters:** shown live in ManualCounter, CameraCounter, and BankCameraScreen during a session
- **First-launch welcome toast:** `isFirstLaunch` flag added to `onboardingStore`; welcome toast fires on first `AlarmListScreen` view
- **Next title progress hint:** `AvatarCard` shows how many reps until the next rep-based title
- Skipped: share card (2c) — requires `react-native-view-shot` native install; deferred

### Tier 3 — Onboarding Polish
- **Commitment step helper text:** added to the `grinding-for` onboarding step
- **Celebration badge:** added to onboarding completion
- **CustomTabBar:** animation/style refinements

### Tier 4 — UI Polish
- **FAB safe area:** `AlarmListScreen` and `RewardsScreen` FABs now use `useBottomTabBarHeight()` instead of hardcoded `bottom: 100`
- **Calendar navigation arrows:** `MonthlyCalendar` header gets ‹ › `IconButton`s wired to the existing `changeMonth` handler
- **Streak-at-risk banner:** `ProgressScreen` shows an amber warning after 8pm when streak > 0 and no reps logged today
- Deleted `IMPROVEMENTS.md` — all four tiers complete

### Status
All improvement tiers shipped. App is in final pre-submission state.

---

## 2026-07-16 — Onboarding Micro-Polish: Haptics & Emoji Consistency

### Haptic Feedback
- **Snooze button:** Added `Vibration.vibrate(50)` to `handleSnooze` in OnboardingScreen. Single short vibration on each snooze tap for tactile feedback.
- Used native `Vibration` API (already imported); no new dependencies.

### Emoji Skin Tone Consistency
- **Q3 "Why did you really download this?" screen:** Updated "Get stronger" card emoji from `💪` to `💪🏽` (medium skin tone) to match Q2 "Fitness level" card
- **Daily goal screen:** Updated 50-rep "Committed" tier emoji from `💪` to `💪🏽` to match theme
- All bicep emojis now use consistent medium skin tone across onboarding flow

### Reward Creation Screen Copy
- Header: "Pick your reward" → "Create your first reward."
- Placeholder text: "Reward name (e.g. TV Time, New Sneakers)" → "New shoes, TV Time, etc"
- Tone: more directional, friendlier placeholder

### Status
All MVP screens polished. Ready for Play Store submission.

---

## 2026-07-15 — UI Polish: Nav Bar, Micro-interactions, Onboarding, Alarm UX

### Navigation Bar
- Full custom `CustomTabBar.tsx` built — replaced default RN Paper tab bar
- Light mode: frosted white bar, orange active pill; Dark mode: surface-colored bar with subtle border (visible against pure black)
- Tab icons spring-scale on press, haptic tap, active-tab pop animation

### Micro-interactions (across the app)
- **Alarm list:** staggered slide-in on mount, swipe-to-delete, toggle haptic + scale pulse, shake + double-tap delete confirm, animated rep counter, top toast on alarm toggle
- **Tab bar:** icon bounce + haptic on every tap
- **Alarm firing:** press-in scale on primary buttons
- **Progress:** spring-animated goal bar, bank sheet spring overshoot
- **Bank camera:** white flash on each counted rep
- **Rewards:** shimmer on unaffordable cards, bounce on unlock
- **Onboarding:** slide transition between steps
- New `TopToast.tsx` component for transient in-app feedback

### Onboarding Polish
- Analyzing screen: rotating text replaced with staggered stat reveal — Snooze severity / Fitness level / Goal bars build in one by one, then persona name types in character by character, then CTA appears
- Alarm goal stepper: slider replaced with +/− stepper buttons (cleaner, less error-prone)
- Founder letter: "Yo," opening, condensed to one paragraph
- Analyzing screen: 3.6s → 5.4s with guaranteed 100% progress bar before transition
- Testimonials: shorter copy, no em dashes, cleaner attribution
- Persona types: matching emojis added (Sleeper / Inconsistent / Optimizer)
- Free trial screen: wall-of-text stripped down to 4-item icon list + short CTA
- Paywall + free-trial footer text: `outline` → `onSurfaceVariant` for readable contrast in light mode

### Alarm UX
- Alarm cards: pencil icon opens pre-populated edit screen
- Volume control: 5-button `SegmentedButtons` → continuous `Slider` (0–100%, live % label); added `@react-native-community/slider`
- Drag-and-drop reorder: long-press up/down arrows replaced with drag handle; ghost card floats under finger, blue drop-indicator line shows insertion point; `FlatList` → `ScrollView` to prevent scroll conflicts during drag
- `alarmStore`: `reorderAlarm(id, dir)` replaced with `reorderAlarmToIndex(id, n)`
- Push-up completion: always shows celebration screen before dismissing alarm

### Engagement Utils
- 7 new titles added: No Days Off, Ghost Mode, Relentless, Machine, Obsessed, Consistent, Untouchable
- Contact Support: shows email text in Alert instead of launching mailto

### Status
All MVP screens feature-complete. Remaining work: app icon, store assets, Play Store submission.

---

## 2026-07-15 — Ringer Character Removed

### Changes
- Removed `src/components/Ringer.tsx` component
- Deleted all Ringer image assets from `src/assets/images/ringer/`
- Removed Ringer references from `AlarmFiringScreen.tsx`:
  - Idle screen (cocky state)
  - Manual counter (point-at-you, arms-crossed, hype states)
  - Camera counter (aggressive, tired states)
  - Done screen (celebrating state)
  - Trial expired screen (disappointed state)
- Deleted `ringer-prompts.md`

### Status
Ringer character completely removed. App icon and onboarding may need updates if they referenced Ringer.

---

## 2026-07-12 — App Icon Design Decision + Prompt

### Decision
- **Use Ringer's face as app icon** (like Duolingo's Duo)
- Crop to extreme close-up: character fills entire frame, minimal background
- Idle/Cocky state (confident smirk, one eyebrow raised)
- Works at 48px+ for home screen, instantly recognizable

### Prompt Generated
AI image-to-image prompt created to transform reference Ringer image into tight-cropped icon-ready asset. Prompt emphasizes extreme zoom, character filling frame, and consistent design (thick outlines, flat colors, Cuphead style).

### Next steps
- Feed reference Ringer + prompt to AI image generator (DALL-E, Midjourney, etc.)
- Export 512×512 PNG for Play Store submission
- Add to android/app/src/main/res/mipmap/

### Status
Design locked. Asset generation pending.

---

## 2026-07-12 — Android Signing Key Generated & Configured

### Setup Complete
- Generated release keystore: `my-release-key.keystore` (stored in `android/app/`)
- Configured `android/app/build.gradle` with release signing config
- Updated `release` buildType to use release key (was incorrectly using debug key)
- Added `android/app/.gitignore` to prevent keystore from being committed

### Next steps
- Complete RevenueCat products setup in Google Play Console (verification now complete)
- Wire subscription terms copy into paywall UI
- Test full purchase flow end-to-end

### Status
Ready to build release APK when needed. Still in active development; release build not required until pre-submission testing phase.

---

## 2026-07-11 — Ringer Character Integration Complete

### Implementation
- Wired all 8 visible Ringer states into `AlarmFiringScreen.tsx`
- **Idle screen:** cocky (ready to start) + disappointed (trial expired)
- **Manual counter:** point-at-you (greeting) → arms-crossed (during counting) → hype (last rep)
- **Camera counter:** aggressive (start) → tired (75%+ progress)
- **Done screen:** celebrating (completion)
- Dynamic state changes per narrative moment (no animation library needed)

### Testing
- APK rebuilt with `--reset-cache` to ensure images bundle
- Images verified in `/src/assets/images/ringer/` (9 PNGs total)
- User can now see Ringer cycle through emotional states by triggering an alarm and progressing through push-up modes

### Status
- MVP feature complete. "Default" image unused (serves as Ringer component fallback). All 8 narrative states in use.

---

## 2026-07-11 — Ringer Character Assets

### Ringer Images Generated
- 9 PNG character states created: idle/cocky, hype, disappointed, aggressive, arms-crossed, pointing-at-you, tired, celebrating, + base
- All images have transparent backgrounds (no contextual backgrounds)
- Consistent with Cuphead/Fleischer Studios retro cartoon style (thick outlines, flat colors)
- Art direction locked in `ringer-prompts.md`

### Asset Integration Decision
- **Transparent backgrounds chosen** — fits M3 light/dark theme system without variant backgrounds
- Ringer is narrative/aesthetic (not interactive), so he works on any app background
- One asset set, maximum reuse, no maintenance burden

### Next step
- Wire images into app: import PNGs from `/ringer-images/` into screens/components per narrative moments
- Reference `ringer-prompts.md` for which state to use in each context

---

## 2026-07-09 — Engagement & Addiction Features, Visual Redesign, Notifications

### Visual Redesign (Apple Health-inspired)
- Full UI overhaul: pure white light bg (#FFFFFF), pure black dark bg (#000000), #FF5500 orange primary
- `BRAND_GRADIENT` linear gradient hero cards (`#FF6B00` → `#FF2D00`) on Bank Push-ups CTA and FAB
- `cardShadow` utility for floating cards in light mode
- Custom large title headers (34px/800 weight) on all 4 tabs
- Floating alarm cards with 52px bold time display, gradient FAB
- react-native-paper v5 (Material Design 3) with `useTheme()` throughout; no hardcoded colors

### Settings Expansion
- Haptic feedback per rep (Vibration.vibrate(40))
- Keep screen on during push-up session (FLAG_KEEP_SCREEN_ON via PoseDetectionModule.kt)
- Vibrate on alarm
- Mute alarm during push-up session
- Audio cue per rep
- Front/rear camera toggle
- Daily push-up goal with gradient progress bar on Progress tab
- "What are you grinding for?" commitment contract (Settings + onboarding step)
- Theme picker (light / dark / follow system) via themeStore + MMKV
- Rate PushRise row with accent orange icon
- Both reset options (settings only, or all data)

### Progress Tab: Engagement Features
- **AvatarCard**: level emoji + progress bar to next level; 10-level system with flat early curve (Seedling → Early Riser → Finding Rhythm → In The Habit → Locked In → On Fire → The Grinder → Built Different → Iron Riser → Legend)
- **Milestone celebrations**: modal fires on 100 / 250 / 500 / 1k / 2.5k / 5k / 10k / 25k / 50k total reps; bonus rep confetti (15% chance, 1-5 bonus reps)
- **Community Challenge card**: fake weekly goal (10k reps), live-ticking progress seeded per week, refreshes every 30s
- **Boss Battle card**: weekly fake rival seeded per weekStart; win state + celebration modal; new rival next week
- **Weekly Leaderboard card**: 5 fake entries, user always #3, seeded daily
- **Activity Ticker on Alarms tab**: animated slide-in/out messages, orange live dot, 30 fake activity messages seeded hourly
- **Share card modal**: shareable stat card with gradient design

### Fake Social Proof Infrastructure (`src/utils/engagement.ts`)
- `seededRng(seed)`: FNV-1a hash PRNG for deterministic fake data
- 50 international fake names (American, East Asian, South Asian, European, African/Middle Eastern, Latin American)
- `getLeaderboard()`, `getBoss()`, `getCommunityGoal()`, `getTickerMessages()`, `getTitle()`, `getAvatarLevel()`

### Bug Fixes
- Level display bug: `next` threshold array was descending — `find()` always returned 10000 regardless of rep count. Fixed to ascending.
- Emoji backgrounds orange in RewardCard: was `c.primaryContainer` when affordable. Fixed to always `c.surfaceVariant`.
- Hardcoded "1,000,000" in community challenge text replaced with `communityGoal.goal.toLocaleString()`
- `checkForActiveAlarm` now filters by `ALARM_CHANNEL_ID` — was navigating to AlarmFiring on any displayed notification (would have triggered on nudge/rival notifications)
- `setupForegroundHandler` now filters by channel ID too
- `alarm-outline` icon replaced with `alarm` (outline variant not in MaterialCommunityIcons set)

### Onboarding Updates
- Added `daily-goal` step
- Added `grinding-for` commitment step (replaced old commitment screen)
- `grindingFor` persisted to settingsStore; displayed as commitment card on Progress tab

### Notifications (3 new features)
- **Daily Nudge**: notifee trigger at user-set time (default 8PM); auto-cancels when `todayReps > 0`; reschedules on settings change via App.tsx useEffect; 4 rotating message variants. Toggle + time picker in Settings → Notifications.
- **Ghost Mode**: `bankStore` tracks `todayHourlyReps[hour]` and `yesterdayHourlyReps` (snapshotted at midnight rollover). `GhostCard` on Progress tab shows delta vs same point yesterday — ▲ AHEAD or ▼ BEHIND.
- **Anonymous Rival**: after every completed alarm, schedules a fake push notification 30-90min later — "{name} just passed you with X reps. You're now #4." Uses separate `Reminders` notification channel.

### Store Changes
- `bankStore`: added `weekReps`, `weekStartDate`, `seenMilestones`, `pendingCelebration`, `bossDefeatedWeek`, `todayHourlyReps`, `yesterdayHourlyReps`
- `settingsStore`: added `grindingFor`, `nudgeEnabled`, `nudgeHour`, `nudgeMinute`

---

## 2026-07-08 — Metro Cache Bug (Root Cause of Phantom Regressions)

### What happened
After reverting bad detection changes, detection still felt broken across multiple reinstalls. Root cause: Metro was serving a stale cached JS bundle from the bad build. Native Kotlin was correct but Metro's in-memory bundle still had rolling average + min rep interval code.

**Fix:** `npx react-native start --reset-cache`. Always run this when reverting JS changes — without it the app runs old code even though the files are correct.

---

## 2026-07-08 — Camera Detection Improvements (Confidence Filter + Debounce)

### What was added
- **Landmark confidence filter** (`inFrameLikelihood >= 0.5` in Kotlin) — landmarks ML Kit isn't confident about are omitted before the angle calc. Prevents garbage angles from blurry/occluded frames.
- **2-frame phase debounce** — phase only commits after 2 consecutive frames agree. Prevents a single noisy mid-rep frame from triggering a phantom count.

### What was tried and reverted (made things worse)
- `SINGLE_IMAGE_MODE` — loses STREAM_MODE's temporal context between sequential frames; jitterier, slower.
- 3-frame angle rolling average — added 400ms lag on top of 400ms debounce = 800ms total, reps missed.
- 600ms minimum rep interval — redundant with debounce, added failure cases at fast cadence.

See `camera-detection-learnings.md` for full notes on each.

---

## 2026-07-08 — Camera Detection Working (10/10 reps)

### What happened
Built the full alarm → push-up detection → dismiss flow end-to-end on a real device (Android 16).

### Technical decisions
- **Library:** ML Kit Pose Detection (`com.google.mlkit:pose-detection:18.0.0-beta5`) via a custom Kotlin native module — not MediaPipe. ML Kit bundled model ships inside the APK, no network call, works in Airplane mode.
- **Frame processor abandoned:** react-native-vision-camera frame processors crash on Android because `Tasks.await()` holds a reference to an already-recycled `Image` object. Switched to snapshot-based approach: `takeSnapshot()` every 200ms → write JPEG to disk → pass file path to Kotlin → ML Kit decodes and detects.
- **Landmark used:** shoulder/elbow/wrist angle (both arms averaged if both visible, falls back to single arm). Thresholds calibrated on real device: DOWN < 125°, UP > 150°.
- **Screen stays on:** `FLAG_KEEP_SCREEN_ON` added unconditionally in `MainActivity.onCreate()` — was previously in `else` branch only (old Android), causing screen to dim during push-ups.
- **SYSTEM_ALERT_WINDOW removed** from merged manifest (ML Kit auto-merges it, blocks Android 16 install) via `tools:node="remove"` in AndroidManifest.xml.
- **install method:** `adb push` → `adb shell pm install` (no `-g` flag). `adb install -g` causes `INSTALL_FAILED_ABORTED` on special permissions.

### Files created/changed
- `android/app/src/main/java/com/pushrise/PoseDetectionModule.kt` — Kotlin native module wrapping ML Kit, snapshot → landmark positions
- `android/app/src/main/java/com/pushrise/PoseDetectionPackage.kt` — registers the module
- `android/app/src/main/java/com/pushrise/MainApplication.kt` — adds `PoseDetectionPackage()`
- `android/app/src/main/java/com/pushrise/MainActivity.kt` — `FLAG_KEEP_SCREEN_ON` always set
- `android/app/build.gradle` — ML Kit dependency + `work-runtime` resolution strategy
- `android/app/src/main/AndroidManifest.xml` — removes `SYSTEM_ALERT_WINDOW`
- `src/utils/pushUpCounter.ts` — elbow angle math, phase state machine (DOWN/UP thresholds)
- `src/screens/alarms/AlarmFiringScreen.tsx` — 200ms snapshot loop, debug angle overlay, camera + manual fallback modes
- `android/app/src/main/res/raw/alarm.mp3` — generated via ffmpeg (two-tone beep, loops)

---

## 2026-07-08 — Onboarding Design, Copy, and Feature Decisions

### Decisions made
- **Onboarding expanded to 20 screens** — Duolingo model (alarm created before paywall), ~15 min investment before ask. Sunk cost drives conversion. Validated by Prayer Lock case study (3% → 15% conversion with longer onboarding).
- **Full copy written** for all onboarding screens, paywall, post-trial paywall, and downsell. Tone: tough love. Conversion psychology: identity destruction + reconstruction, loss framing, loaded quiz questions, progressive commitment, sunk cost, contrast pricing.
- **Review prompt moved** — was in onboarding (wrong), now fires after first alarm is successfully dismissed with push-ups. Emotional peak = higher rating, fewer 1-star responses.
- **Fake user count removed** — "join 184,829 people" replaced with copy that doesn't require a number ("People who used to hit snooze. Now they don't." + testimonials).
- **Outside-alarm push-up logging added to MVP** — users can log push-ups anytime, not just during alarms. Camera or manual. All reps count toward bank.
- **Alarm push-ups count toward bank** — separating them would punish core behavior.
- **Accounts removed from MVP** — RevenueCat handles anonymous users. No sign-up screen in v1. Auth added post-MVP when social requires it.
- **Referral program deferred to post-MVP** — needs backend + accounts; RevenueCat doesn't handle it natively. Tracked in `todo.md`.
- **Accent color decided** — warm orange/amber (~`#FF6B00`–`#FF9500` range). Energy, urgency, fits male 15–25 demographic.
- **Alarm sounds** — both device sounds + custom file picker ship on day 1.
- **Persona reveal added** — 3 types (The Sleeper, The Inconsistent, The Optimizer) based on quiz answers. Reflects answers back, makes app feel custom-built.
- **New onboarding screens added:** commitment screen, price comparison screen, journey summary screen, founder's note (digital, cursive font, placeholder selfie).
- **Downsell confirmed** — Downsell 1: discounted price + real 15-min timer. Downsell 2: 3-day extension. Decline copy: "No thanks, I'll miss out." (loss aversion).

### Files changed
- `updated-prd.md` — major update: full 20-screen onboarding sequence with all copy, outside push-up logging, resolved open questions, removed accounts from MVP
- `pre-build.md` — complete: all screens inventoried, full copy referenced, persona logic table, rewards list, badge list, founder note placeholder
- `todo.md` — updated: referral + accounts moved to post-MVP with notes, outside push-up logging added to MVP, custom sounds added to MVP, review prompt timing corrected
- `PRD.md` — **deleted** (superseded by `updated-prd.md`)

---

## 2026-07-08 — Pre-Build Decisions + File Setup

### Decisions made
- **Framework:** Bare React Native (Expo can't access `AlarmManager` or foreground services — would need to eject anyway)
- **Billing:** RevenueCat (abstracts Google Play Billing complexity, handles iOS later, free tier)
- **Backend:** Supabase, but **post-MVP only** — no backend needed until social features ship
- **Auth:** Google Sign-In, **post-MVP only** — no accounts until social requires them
- **Privacy policy:** Placeholder URL in-app for now; real hosted policy required before Play Store submission
- **Test devices:** Personal Android phone + Android tablet available. No Xiaomi/Samsung — OEM alarm testing needs a plan (borrow, BrowserStack, or find a tester)

### Files created
- `todo.md` — full task list organized by phase (pre-build, MVP, Play Store, post-MVP roadmap)
- `pre-build.md` — planning template for founder to fill in before coding starts (screens, UI refs, tone, copy, rewards, badges, alarm sounds)
- `updated-prd.md` — tech stack table updated to reflect above decisions

---

## 2026-07-08 — Technical Feasibility Research

### What happened
Researched both existential risks (camera detection + alarm reliability) before committing to a build approach.

### Camera Detection (MediaPipe)
- **Proven concept:** [RepDetect](https://github.com/giaongo/RepDetect) is an open-source Android app in Kotlin that already does exactly this with MediaPipe. The use case is validated.
- **Low light is a documented weak spot:** Benchmarks show 45.2mm mean position error and 36.2° angle error in poor lighting. 6am dark bedroom is exactly this condition.
- **Out-of-frame instability:** If any body part exits the camera frame, landmark tracking degrades and miscounts. Developers building this add extra filtering logic to ignore erratic coordinate jumps.
- **Verdict:** Works in decent conditions. Needs extra engineering to handle real-world 6am conditions. Can't just drop in the library.

### Alarm Reliability
- **`setAlarmClock()` bypasses Android Doze** at the OS level — correct API to use.
- **OEM layer is the real problem** — sits entirely on top of Android's standard system:
  - **Xiaomi/MIUI:** Aggressively kills background services. Resets autostart permissions silently after OTA updates.
  - **Huawei/Honor:** PowerGenie throttles apps that call `setAlarmClock()` more than ~3x/day. Also kills processes holding wakelocks longer than 60 minutes.
  - **Samsung:** App Power Monitor kicks in after 3 days of no use — less aggressive but still a risk.
- **Fix exists:** Foreground service + `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` + onboarding screen walking users through disabling battery optimization manually.
- **Reference:** [dontkillmyapp.com](https://dontkillmyapp.com) — developer-maintained database of every OEM's kill behavior. Use this during implementation.
- **Verdict:** Solvable. Requires OEM-specific handling and real device testing on Samsung + Xiaomi hardware.

### Overall risk rating
| Risk | Likelihood | Solvable |
|---|---|---|
| Camera detection in good light | Low | Yes — proven |
| Camera detection in low light / bad angle | High | Yes — extra engineering needed |
| Alarm on stock Android | Low | Yes — `setAlarmClock()` handles it |
| Alarm on Xiaomi/Huawei | High | Yes — foreground service + onboarding |
| Alarm on Samsung | Medium | Yes — needs testing |

Neither risk kills the app. Both require real effort. Week 1 validation gate stands.

---

## 2026-07-08 — Initial PRD + Founder Interview

### What happened
- Cleaned up and reformatted `PRD.md`, `gamification.md`, and `addiction.md` into structured markdown
- Conducted a 30-question founder interview covering core mechanic, target user, monetization, onboarding, social features, and technical risks
- Produced `updated-prd.md` as the canonical product document going forward

### Key decisions made
- **Social features cut from MVP.** Leaderboards, friend challenges, and accounts require a backend and a user base to be useful. Shipping without them.
- **Lifetime price set to $14.99** (up from original $4.99). At $4.99 a user beats it in two months of subscribing — hurts LTV.
- **Post-trial behavior:** lock the push-up mechanic, not the alarm itself. Killing the alarm entirely after trial = one-star reviews.
- **Manual fallback included** despite breaking the accountability promise — a user who bounces because detection fails is worse than one who uses manual mode.
- **Streak logic:** tied to completing the push-up goal, not opening the app.

### Existential risks identified (must validate Week 1)
1. **Android alarm reliability** — Battery optimization on Samsung, Xiaomi, Huawei will silently kill background processes. Solution path: `AlarmManager.setAlarmClock()` + foreground service + guide users through disabling battery optimization during onboarding.
2. **Camera detection quality** — MediaPipe on a budget Android in low light is unproven. Pushy's #1 complaint is bad detection. Must be tested on real hardware before any other feature is built.

### Files changed
- `PRD.md` — reformatted (no content removed, structure cleaned)
- `gamification.md` — reformatted
- `addiction.md` — reformatted
- `updated-prd.md` — created (new canonical PRD)
- `changelog.md` — created (this file)
