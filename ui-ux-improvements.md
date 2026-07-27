# PushRise — UI/UX Improvements

**Audit:** 2026-07-26 | **5 Critical** | **11 High** | **19 Low** | **Status:** L1–L19 ✅ | H1–H11 ✅ fixed 2026-07-27 (H4 skipped — kept separate cards)

---

## 🔴 CRITICAL (core flow / data loss)

| ID | Issue | File | Fix | Effort |
|----|-------|------|-----|--------|
| **C1** | Onboarding alarm/reward/name discarded after purchase | `OnboardingScreen.tsx` | `handlePurchase()` should call `handleComplete()` instead of duplicating logic | Low |
| **C2** | Skip/bypass too prominent on alarm screen | `AlarmFiringScreen.tsx` | Move "Skip" and "Emergency bypass" to small ghost text at bottom | Low |
| **C3** | No indicator when pose detection is running | `AlarmFiringScreen.tsx`, `BankCameraScreen.tsx` | Add pulsing dot or "Detecting…" text under rep count; toggle color on valid pose | Medium |
| **C4** | Settings only reachable from Alarms tab | `AlarmListScreen.tsx`, `CustomTabBar.tsx` | Add gear icon to all three screen headers OR add Settings as 4th tab | Medium |
| **C5** | Onboarding alarm created as one-time, not recurring | `OnboardingScreen.tsx:316` | Change `days: []` to `days: [0,1,2,3,4,5,6]` | Trivial |

---

## 🟠 HIGH (polish & consistency)

| ID | Issue | File | Fix | Effort |
|----|-------|------|-----|--------|
| ~~**H1**~~ | ~~Paywall says "7-day free trial" but PRD says "no trial"~~ | ~~`OnboardingScreen.tsx`~~ | ~~Removed trial copy, button now "Get Started →"~~ | ✅ |
| ~~**H2**~~ | ~~"Upgrade to Pro" shown to paid users~~ | ~~`SettingsScreen.tsx`~~ | ~~Conditionally shows "Manage Subscription" when subscribed~~ | ✅ |
| ~~**H3**~~ | ~~Inconsistent delete UX: double-tap alarms vs long-press rewards~~ | ~~`AlarmListScreen.tsx`, `RewardsScreen.tsx`~~ | ~~Rewards now use double-tap (matches alarms)~~ | ✅ |
| **H4** | Progress screen has 12+ stacked cards | `ProgressScreen.tsx` | Collapse 4 engagement modes (boss/leaderboard/community/ghost) into SegmentedButtons card | **Skipped — kept separate** |
| ~~**H5**~~ | ~~No hint that long-press edits/deletes rewards~~ | ~~`RewardsScreen.tsx`~~ | ~~"Double-tap to edit or delete" in empty state~~ | ✅ |
| ~~**H6**~~ | ~~Redundant pencil edit icon on alarm cards~~ | ~~`AlarmListScreen.tsx`~~ | ~~Removed pencil IconButton~~ | ✅ |
| ~~**H7**~~ | ~~Boss battle loss shown in red error color~~ | ~~`ProgressScreen.tsx`~~ | ~~Changed to brand orange (`c.primary`) + `c.surfaceVariant` bg~~ | ✅ |
| ~~**H8**~~ | ~~No cancel/back affordance on camera screen~~ | ~~`BankCameraScreen.tsx`~~ | ~~Added "← Cancel" text button top-left~~ | ✅ |
| ~~**H9**~~ | ~~Redeem dialog doesn't warn one-time rewards vanish~~ | ~~`RewardsScreen.tsx`~~ | ~~Added red warning text for `oneTime` rewards~~ | ✅ |
| ~~**H10**~~ | ~~No way to request camera permission from error state~~ | ~~`BankCameraScreen.tsx`~~ | ~~`useCameraPermission` hook; requests on mount, "Grant Camera Access" button if denied~~ | ✅ |
| ~~**H11**~~ | ~~Snooze exhaustion is silent (buttons just vanish)~~ | ~~`AlarmFiringScreen.tsx`~~ | ~~Shows "No snoozes left" when `snoozeCount >= 3`~~ | ✅ |

---

## 🟡 LOW (polish, typos, minor friction)

| ID | Issue | File | Fix | Effort |
|----|-------|------|-----|--------|
| ~~**L1**~~ | ~~Share card says "iOS & Android" (Android-only at launch)~~ | ~~`ProgressScreen.tsx`~~ | ~~Change to "Android"~~ | ✅ |
| ~~**L2**~~ | ~~Calendar missing "today" indicator~~ | ~~`MonthlyCalendar.tsx`~~ | ~~Subtle outline or background for current day~~ | ✅ |
| ~~**L3**~~ | ~~Calendar typo: "pushups" (should be "push-ups")~~ | ~~`MonthlyCalendar.tsx:210`~~ | ~~Hyphenate~~ | ✅ |
| ~~**L4**~~ | ~~Calendar day headers: T, T (Tuesday/Thursday both "T")~~ | ~~`MonthlyCalendar.tsx`~~ | ~~Use "Tu", "Th"~~ | ✅ |
| ~~**L5**~~ | ~~No "next alarm in X hours" indicator~~ | ~~`AlarmListScreen.tsx`~~ | ~~Add line like "Next: 6:30 AM, in 7h 22m" near header~~ | ✅ |
| ~~**L6**~~ | ~~Manual counter button has no tap feedback~~ | ~~`AlarmFiringScreen.tsx`~~ | ~~Reuse existing `btnScale` spring animation on tap~~ | ✅ |
| ~~**L7**~~ | ~~Slots directly below bank CTA (loss churn risk)~~ | ~~`ProgressScreen.tsx`~~ | ~~Move to Rewards screen or behind secondary action~~ | ✅ |
| ~~**L8**~~ | ~~Q1 snooze step auto-advances after 5s (misclassifies readers)~~ | ~~`OnboardingScreen.tsx`~~ | ~~Remove auto-advance or extend to 10-15s~~ | ✅ |
| ~~**L9**~~ | ~~BankCameraScreen calls `setDebugAngle` in prod~~ | ~~`BankCameraScreen.tsx:58`~~ | ~~Wrap with `if (__DEV__)` like AlarmFiringScreen does~~ | ✅ |
| ~~**L10**~~ | ~~Onboarding alarm rep input is plain TextInput (AddAlarm uses stepper)~~ | ~~`OnboardingScreen.tsx`~~ | ~~Use ± stepper for consistency~~ | ✅ |
| ~~**L11**~~ | ~~Commitment step placeholder too generic~~ | ~~`OnboardingScreen.tsx`~~ | ~~Change to "e.g. Wake up with energy, prove I can commit"~~ | ✅ |
| ~~**L12**~~ | ~~Manual rep entry sheet missing bank balance~~ | ~~`ProgressScreen.tsx`~~ | ~~Add `<Text>Bank: {totalReps.toLocaleString()} reps</Text>` above input~~ | ✅ |
| ~~**L13**~~ | ~~Manual rep input shows no validation error~~ | ~~`ProgressScreen.tsx`~~ | ~~Add error text when input is non-numeric~~ | ✅ |
| ~~**L14**~~ | ~~Alarm save has no confirmation (no haptic/toast)~~ | ~~`AddAlarmScreen.tsx:76-94`~~ | ~~Add `Vibration.vibrate(50)` before `navigation.goBack()`~~ | ✅ |
| ~~**L15**~~ | ~~Reward long-press dialog doesn't show cost~~ | ~~`RewardsScreen.tsx:476-487`~~ | ~~Add cost subtitle in dialog title~~ | ✅ |
| ~~**L16**~~ | ~~Uncompleted calendar days look like padding cells~~ | ~~`MonthlyCalendar.tsx:119`~~ | ~~Add faint border to active days, keep padding cells empty~~ | ✅ |
| ~~**L17**~~ | ~~Emergency bypass cost hidden when toggle is off~~ | ~~`SettingsScreen.tsx:225`~~ | ~~Always render cost row; dim (`opacity: 0.4`) when off~~ | ✅ |
| ~~**L18**~~ | ~~GhostCard silently absent for day-1 users~~ | ~~`ProgressScreen.tsx:38`~~ | ~~Show placeholder: "Ghost mode activates tomorrow — race your past self"~~ | ✅ |
| ~~**L19**~~ | ~~Reward title can wrap to 2 lines (compresses layout)~~ | ~~`RewardsScreen.tsx:278`~~ | ~~Add `numberOfLines={1}` and `ellipsizeMode="tail"`~~ | ✅ |

---

## Quick Stats

**By Effort:**
- **Trivial (1 line):** 14 issues → ~20 min total
- **Low (1-2 files):** 13 issues → ~2–3 hours
- **Medium (multi-screen):** 3 issues → ~4–6 hours
- **Total:** 30 issues, ~7–10 hours to completion

**By Risk (if ignored):**
- **Critical (C1–C5):** Users lose data, can't reach settings, don't know if app is working
- **High (H1–H11):** Confusing UX, broken edge cases, brand inconsistency
- **Low (L1–L19):** Polish, discoverability, minor friction

---

## How to Use

1. **For a sprint:** Sort by effort; knock out Trivial batch first (20 min), then Low (2–3 hours)
2. **For a hotfix:** C1, C3, C4 block core flows — tackle first
3. **For a polish pass:** H1–H11 touch all major surfaces — pick 2–3 highest-friction items (H2, H4, H8, H10)
