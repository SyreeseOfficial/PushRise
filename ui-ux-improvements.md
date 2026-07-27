# PushRise — UI/UX Improvements

> Generated: 2026-07-26 — full codebase audit

---

## 🔴 Critical (core loop / data loss)

### C1 · Onboarding alarm & reward are never saved on normal purchase
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — `handlePurchase()` vs `handleComplete()`

`handlePurchase()` (the path every new paying user takes) calls only `startTrial()` + `completeOnboarding()`. It does **not** call `addAlarm()`, `addReward()`, or save `userName` to settings.

`handleComplete()` does all three — but it's only wired to the **Restore Purchases** button.

**Result:** Every new user who pays goes through onboarding, sets an alarm, creates a reward, types their name, pays — and arrives in the main app with no alarm, no reward, and no name. The entire IKEA-effect onboarding investment is silently discarded.

**Fix:** Call `handleComplete()` from `handlePurchase()` instead of duplicating `startTrial()` + `completeOnboarding()` inline.

---

### C2 · AlarmFiringScreen: skip/dismiss too accessible for a half-awake user
**File:** `src/screens/alarms/AlarmFiringScreen.tsx` — idle mode render

The idle state presents 6-7 tappable actions with a flat visual hierarchy: "I'm Ready" → manual mode → snooze buttons → emergency bypass → "Skip (no push-ups)". A groggy user's eyes will wander. "Skip" and "Emergency bypass" should be near-invisible — tiny ghost links at the very bottom, not visual peers to the primary CTA.

**Fix:** Make "Skip" a small `mode="text"` with `c.outline` color at the bottom of the screen. Keep emergency bypass hidden behind a "⚙" icon or collapsed. The screen should feel like there's only one real option.

---

### C3 · Camera counter: zero indication detection is working
**File:** `src/screens/alarms/AlarmFiringScreen.tsx` + `src/screens/progress/BankCameraScreen.tsx`

When camera mode is active, there's no visual indicator that pose detection is running. A user doing push-ups while the count stays at 0 has no way to know if detection started, is processing, or failed. This is the #1 likely user frustration and drop-off point.

**Fix:** Add a pulsing dot or "Detecting…" text under the rep count. Could toggle color when a valid pose is detected (green = good angle, grey = can't see you).

---

### C4 · Settings only reachable from the Alarms tab header
**File:** `src/navigation/CustomTabBar.tsx`, `src/screens/alarms/AlarmListScreen.tsx`

The gear icon for Settings lives only in the AlarmListScreen header. From Progress or Rewards, there's no path to Settings without first switching tabs. Goals, daily target, "grinding for" — all in Settings — are things users want to adjust from the Progress screen.

**Fix:** Either add Settings to the bottom tab bar (4th tab), or add the gear icon to all three screen headers.

---

## 🟠 High (polish and consistency)

### H1 · Paywall copy contradicts PRD: "7-day free trial. No charge today."
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — `case 'paywall'`

The paywall button says "Start My Free Trial →" and the subtext reads "7-day free trial. No charge today. Cancel anytime." The PRD explicitly states: **"Hard gate: No Trial."** One of these is wrong. If a trial was re-added to the implementation, update the PRD. If not, fix the copy before launch or RevenueCat will show confusing behavior.

---

### H2 · "Upgrade to Pro" in Settings for a user who already paid
**File:** `src/screens/settings/SettingsScreen.tsx` — Subscription card

Hard paywall → every user who reaches the main app is a subscriber. The "Upgrade to Pro" row navigates to the Paywall screen for a user who already paid. This is broken UX. Replace with "Restore Purchase" (calls `RevenueCatUI.presentCustomerCenter()` already does this) or remove the row entirely.

---

### H3 · Delete pattern inconsistent: double-tap on alarms vs long-press on rewards
**File:** `src/screens/alarms/AlarmListScreen.tsx` `AlarmCard`, `src/screens/rewards/RewardsScreen.tsx`

Rewards use long-press → action dialog. Alarm cards use a double-tap on the trash icon with a shake animation. The shake is clever but non-obvious. Users who learn the long-press pattern on Rewards will be confused by alarms and vice versa. Pick one pattern.

---

### H4 · Progress screen card density — 12+ cards in one scroll
**File:** `src/screens/progress/ProgressScreen.tsx`

The Progress screen stacks: streak warning, avatar, bank CTA, slots, stats row, daily goal, grinding for, community challenge, boss battle, ghost mode, leaderboard, calendar. For the target demo (15-25, low attention span), this is a wall of cards on every visit.

**Fix:** Collapse the four engagement modes (boss, leaderboard, community, ghost) into a single card with M3 `SegmentedButtons` tabs — that component is already installed and used elsewhere. Saves 3 card heights.

---

### H5 · Long-press on reward cards is not discoverable
**File:** `src/screens/rewards/RewardsScreen.tsx`

There's no visual hint that long-press opens an edit/delete menu on reward cards. Users who never discover this have no way to edit or delete rewards they created. A subtle "Hold to edit" hint in the empty state, or an overflow `⋮` icon on cards, would fix this.

---

### H6 · Redundant edit pencil icon on alarm cards
**File:** `src/screens/alarms/AlarmListScreen.tsx` — `AlarmCard`

Each alarm card has both a pencil `IconButton` and the entire card body as a `Pressable` that both navigate to `AddAlarm`. The pencil icon adds visual noise for no added function. Remove it.

---

### H7 · Boss battle loss shown in red error colors — off-brand
**File:** `src/screens/progress/ProgressScreen.tsx` — `LeaderboardCard` / boss section

"You're X reps behind" is rendered in `c.errorContainer` / `c.error`. Red means "something went wrong." The brand wants motivational, not punitive. Replace with the brand orange or a neutral surface color.

---

### H8 · BankCameraScreen: no cancel/back affordance
**File:** `src/screens/progress/BankCameraScreen.tsx`

The camera screen has a "Done" button (which safely does nothing if count=0) but no "Cancel" or back arrow. Users who accidentally open camera have no obvious escape. The `StatusBar` is hidden so there's no system UI cue. Add a "← Cancel" text button at the top-left.

---

## 🟡 Lower (polish, typos, minor friction)

### L1 · Share card says "IOS & ANDROID" — app is Android-only at launch
**File:** `src/screens/progress/ProgressScreen.tsx` — `ShareCardModal`

Line: `PUSHRISE - IOS & ANDROID`. iOS is v2. This looks unfinished on a shared screenshot.

---

### L2 · MonthlyCalendar: no "today" indicator
**File:** `src/components/MonthlyCalendar.tsx`

Completed days get an orange circle. There's no visual marker for today's date, so the calendar has no temporal anchor. A subtle outline or different background for the current day would orient the user immediately.

---

### L3 · MonthlyCalendar: "pushups" typo
**File:** `src/components/MonthlyCalendar.tsx` — line 210

The popup says `"pushups completed"`. The rest of the app consistently uses `"push-ups"` (hyphenated).

---

### L4 · MonthlyCalendar: ambiguous day headers (T, T)
**File:** `src/components/MonthlyCalendar.tsx`

`['S', 'M', 'T', 'W', 'T', 'F', 'S']` — Tuesday and Thursday both show as "T". Standard is "Tu" / "Th".

---

### L5 · AlarmList: no "next alarm fires in X hours" indicator
**File:** `src/screens/alarms/AlarmListScreen.tsx`

Every stock clock app shows this. A single line like "Next: 6:30 AM, in 7h 22m" near the header is high value, low effort, and tells the user the app is working.

---

### L6 · Manual counter: no tap feedback animation
**File:** `src/screens/alarms/AlarmFiringScreen.tsx` — `ManualCounter`

The 180×180 circular button shows no visual feedback when a rep is tapped beyond the number incrementing. A brief scale pulse (the `btnScale` spring animation is already in `AlarmFiringScreen`, used on other buttons in the same file) would confirm the rep registered.

---

### L7 · Rep slots placement is retention-risky
**File:** `src/screens/progress/ProgressScreen.tsx`

Slots sit directly below the "Bank Push-ups" CTA. A user who just woke up, did push-ups, and banked reps sees an immediate offer to gamble them all away. Losing reps right after the first win is a churn moment for the target age group. Consider moving slots to the Rewards screen or behind a secondary action.

---

### L8 · Q1 snooze timer may misclassify users who are just reading
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — `case 'q1'`

The Q1 step auto-advances after 5 seconds with `snoozeCount=0`, which maps to "I wake up fine most days." Users who are simply reading the screen before tapping will be incorrectly classified as non-snoozers and get the "Optimizer" persona. The progress bar timer is subtle and easy to miss.

**Fix:** Remove the auto-advance or extend the timer to 10-15 seconds. The interactive snooze gimmick is the point — give users time to engage with it.

---

### L9 · BankCameraScreen calls `setDebugAngle` unconditionally in prod
**File:** `src/screens/progress/BankCameraScreen.tsx` — line 58

`AlarmFiringScreen` guards `setDebugAngle` with `if (__DEV__)` before calling it. `BankCameraScreen` does not — it calls `setDebugAngle(Math.round(angle))` on every frame in production, triggering a React state update 5x/second even though the angle is never displayed in prod. Wrap with `if (__DEV__)` to match the other camera screen.

---

### L10 · Onboarding alarm rep input uses TextInput instead of stepper
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — `case 'create-alarm'`

The alarm creation in onboarding uses a plain `TextInput` for rep count. The `AddAlarmScreen` uses a ± stepper. Minor inconsistency, but the stepper is better UX for a number that only goes up by 5s.

---

---

### C5 · Onboarding alarm created as one-time, not recurring
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — line 316

`handleComplete()` creates the alarm with `days: []`. Per `alarmStore.ts`, `days: []` means one-time. Every new user's alarm fires once and is gone. The `AddAlarmScreen` defaults to `recurring: false` (same issue), but there a toggle exists; in onboarding there's no toggle at all — users assume they set a repeating morning alarm.

**Fix:** Change `days: []` to `days: [0,1,2,3,4,5,6]` in `handleComplete()`.

---

### H9 · Redeem dialog doesn't warn that one-time rewards disappear
**File:** `src/screens/rewards/RewardsScreen.tsx` — line 456

The redeem dialog reads "This will use X push-ups from your bank." It says nothing about one-time rewards being permanently deleted after redemption. A user who treats a hard-earned reward as a repeatable milestone will be surprised to find it gone.

**Fix:** Add a conditional line inside the dialog: `{redeemTarget.oneTime && <Text style={{color: c.error, fontSize: 12}}>This reward will be removed after redemption.</Text>}`

---

### H10 · BankCameraScreen shows no path to grant camera permission
**File:** `src/screens/progress/BankCameraScreen.tsx` — line 88–99

When `device` is null (no camera permission), the screen shows "Camera not available" and a "Go Back" button — no way to actually request permission from here. `AlarmFiringScreen` handles this correctly by calling `Camera.requestCameraPermission()`. Users who denied permission by accident have no recovery path.

**Fix:** Mirror `AlarmFiringScreen`'s permission-request flow: call `Camera.requestCameraPermission()` on mount when device is null, and show a "Grant Camera Access" button if it's still denied.

---

### L11 · Onboarding commitment placeholder too generic
**File:** `src/screens/onboarding/OnboardingScreen.tsx` — commitment step

Placeholder is `"Write your reason here..."` with no hint of what format or depth is expected. Users stall on blank inputs.

**Fix:** Change to `"e.g. Wake up with energy, prove I can commit to something"`.

---

### L12 · Manual rep entry sheet missing bank balance
**File:** `src/screens/progress/ProgressScreen.tsx` — manual bank sheet

The slots wager sheet shows the user's current bank balance. The manual entry sheet (where users add reps by count) does not, so users have no reference for how much they're adding relative to what they have.

**Fix:** Add `<Text style={{color: c.onSurfaceVariant, fontSize: 13}}>Bank: {totalReps.toLocaleString()} reps</Text>` above the input.

---

### L13 · Manual rep input shows no validation error
**File:** `src/screens/progress/ProgressScreen.tsx` — manual bank sheet

The TextInput accepts any string; the submit button is disabled on non-numeric input, but there's no error message. A user who types letters sees the button grey out with no explanation.

**Fix:** Add `{manualInput.length > 0 && !parseInt(manualInput, 10) && <HelperText type="error">Enter a number</HelperText>}`.

---

### L14 · AddAlarmScreen: no save feedback on check button
**File:** `src/screens/alarms/AddAlarmScreen.tsx` — line 76–94

Pressing the checkmark header button saves the alarm and navigates back silently. No haptic, no toast. Compare: reward creation triggers confetti. A first-time user pressing save has no confirmation the alarm was created.

**Fix:** `Vibration.vibrate(50)` before `navigation.goBack()` in the save handler.

---

### L15 · Rewards long-press dialog doesn't show the reward's cost
**File:** `src/screens/rewards/RewardsScreen.tsx` — line 476–487

The action dialog title shows `actionTarget?.title` but omits the cost. When a user chooses "Delete", they can't confirm which reward (by cost) they're removing without reading the card behind the modal.

**Fix:** Add `<Dialog.Content><Text variant="bodySmall" style={{color: c.onSurfaceVariant}}>{actionTarget?.cost.toLocaleString()} push-ups</Text></Dialog.Content>` below the title.

---

---

### H11 · AlarmFiringScreen: snooze exhaustion is silent
**File:** `src/screens/alarms/AlarmFiringScreen.tsx` — line 318

When `alarm.snoozeEnabled` is true but `snoozeCount >= 3`, the entire snooze section conditionally disappears (`{alarm?.snoozeEnabled && snoozeCount < 3 && ...}`). The user sees their snooze buttons gone with no explanation — indistinguishable from snooze being disabled. A groggy user's first read: "the app broke."

**Fix:** Add a sibling block `{alarm?.snoozeEnabled && snoozeCount >= 3 && <Text ...>No snoozes left</Text>}` so the absence is explained.

---

### L16 · MonthlyCalendar: uncompleted days visually identical to padding
**File:** `src/components/MonthlyCalendar.tsx` — line 119

Completed days get `backgroundColor: c.primary`. Uncompleted days get `backgroundColor: 'transparent'`, same as the null-padding cells before day 1 and after month end. A user viewing February can't tell if day 3 happened to have 0 reps or doesn't exist in the calendar grid.

**Fix:** Give uncompleted active days a faint border (`borderWidth: 1, borderColor: c.outlineVariant`) while keeping null cells as empty `View`s.

---

### L17 · Emergency bypass cost hidden when toggle is off
**File:** `src/screens/settings/SettingsScreen.tsx` — line 225

The bypass cost row is conditionally rendered only when `emergencyBypassEnabled` is true. Users who want to review or pre-set the cost before enabling the feature can't see it. Users who disable bypass lose sight of what cost they had configured.

**Fix:** Always render the cost row; dim it (`opacity: 0.4`) when bypass is off.

---

### L18 · GhostCard silently absent for day-1 users
**File:** `src/screens/progress/ProgressScreen.tsx` — line 38

`GhostCard` returns `null` when `ghostReps === 0` (no prior-day data). New users on their first day see a gap in the card stack where ghost mode would be, with no explanation of what ghost mode is or when it appears.

**Fix:** Render a placeholder card: "Ghost mode activates tomorrow — you'll race your past self" when `ghostReps === 0`.

---

### L19 · Reward card title has no truncation limit
**File:** `src/screens/rewards/RewardsScreen.tsx` — line 278

Reward title input allows up to 40 characters (`maxLength={40}`), but the card renders with no `numberOfLines` cap. A 40-character title wraps to two lines and compresses the emoji and action button row.

**Fix:** Add `numberOfLines={1}` and `ellipsizeMode="tail"` to the title `<Text>`.

---

## Summary table

| ID | Area | Severity | File | Effort |
|----|------|----------|------|--------|
| C1 | Onboarding | 🔴 Bug | `OnboardingScreen.tsx` | Low |
| C2 | AlarmFiring | 🔴 Critical | `AlarmFiringScreen.tsx` | Low |
| C3 | Camera | 🔴 Critical | `AlarmFiringScreen.tsx`, `BankCameraScreen.tsx` | Medium |
| C4 | Navigation | 🔴 Critical | `AlarmListScreen.tsx`, `CustomTabBar.tsx` | Medium |
| C5 | Onboarding | 🔴 Bug | `OnboardingScreen.tsx` | Trivial |
| H1 | Onboarding | 🟠 High | `OnboardingScreen.tsx` | Trivial |
| H2 | Settings | 🟠 High | `SettingsScreen.tsx` | Trivial |
| H3 | Alarms/Rewards | 🟠 High | `AlarmListScreen.tsx` | Low |
| H4 | Progress | 🟠 High | `ProgressScreen.tsx` | Medium |
| H5 | Rewards | 🟠 High | `RewardsScreen.tsx` | Low |
| H6 | Alarms | 🟠 High | `AlarmListScreen.tsx` | Trivial |
| H7 | Progress | 🟠 High | `ProgressScreen.tsx` | Trivial |
| H8 | BankCamera | 🟠 High | `BankCameraScreen.tsx` | Low |
| H9 | Rewards | 🟠 High | `RewardsScreen.tsx` | Low |
| H10 | BankCamera | 🟠 High | `BankCameraScreen.tsx` | Low |
| H11 | AlarmFiring | 🟠 High | `AlarmFiringScreen.tsx` | Trivial |
| L1 | Progress | 🟡 Low | `ProgressScreen.tsx` | Trivial |
| L2 | Calendar | 🟡 Low | `MonthlyCalendar.tsx` | Low |
| L3 | Calendar | 🟡 Low | `MonthlyCalendar.tsx` | Trivial |
| L4 | Calendar | 🟡 Low | `MonthlyCalendar.tsx` | Trivial |
| L5 | Alarms | 🟡 Low | `AlarmListScreen.tsx` | Low |
| L6 | AlarmFiring | 🟡 Low | `AlarmFiringScreen.tsx` | Trivial |
| L7 | Progress | 🟡 Low | `ProgressScreen.tsx` | Low |
| L8 | Onboarding | 🟡 Low | `OnboardingScreen.tsx` | Low |
| L9 | BankCamera | 🟡 Low | `BankCameraScreen.tsx` | Trivial |
| L10 | Onboarding | 🟡 Low | `OnboardingScreen.tsx` | Low |
| L11 | Onboarding | 🟡 Low | `OnboardingScreen.tsx` | Trivial |
| L12 | Progress | 🟡 Low | `ProgressScreen.tsx` | Trivial |
| L13 | Progress | 🟡 Low | `ProgressScreen.tsx` | Trivial |
| L14 | Alarms | 🟡 Low | `AddAlarmScreen.tsx` | Trivial |
| L15 | Rewards | 🟡 Low | `RewardsScreen.tsx` | Trivial |
| L16 | Calendar | 🟡 Low | `MonthlyCalendar.tsx` | Trivial |
| L17 | Settings | 🟡 Low | `SettingsScreen.tsx` | Trivial |
| L18 | Progress | 🟡 Low | `ProgressScreen.tsx` | Low |
| L19 | Rewards | 🟡 Low | `RewardsScreen.tsx` | Trivial |
