# PushRise — UI/UX Improvements

**Audit:** 2026-07-26 | **5 Critical** | **11 High** | **19 Low** | **Status:** L1–L19 fixed 2026-07-27

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
| **H1** | Paywall says "7-day free trial" but PRD says "no trial" | `OnboardingScreen.tsx` | Remove trial copy or update PRD before launch | Trivial |
| **H2** | "Upgrade to Pro" shown to paid users | `SettingsScreen.tsx` | Replace with "Manage Subscription" or remove row | Trivial |
| **H3** | Inconsistent delete UX: double-tap alarms vs long-press rewards | `AlarmListScreen.tsx`, `RewardsScreen.tsx` | Pick one pattern (recommend long-press everywhere) | Low |
| **H4** | Progress screen has 12+ stacked cards | `ProgressScreen.tsx` | Collapse 4 engagement modes (boss/leaderboard/community/ghost) into SegmentedButtons card | Medium |
| **H5** | No hint that long-press edits/deletes rewards | `RewardsScreen.tsx` | Add "Hold to edit" hint in empty state or ⋮ overflow icon on cards | Low |
| **H6** | Redundant pencil edit icon on alarm cards | `AlarmListScreen.tsx` | Remove icon (card already tappable for edit) | Trivial |
| **H7** | Boss battle loss shown in red error color | `ProgressScreen.tsx` | Use brand orange or neutral surface instead of error red | Trivial |
| **H8** | No cancel/back affordance on camera screen | `BankCameraScreen.tsx` | Add "← Cancel" text button top-left (StatusBar is hidden) | Low |
| **H9** | Redeem dialog doesn't warn one-time rewards vanish | `RewardsScreen.tsx:456` | Add conditional error text: "This reward will be removed after redemption." | Low |
| **H10** | No way to request camera permission from error state | `BankCameraScreen.tsx:88-99` | Mirror `AlarmFiringScreen`: call `requestCameraPermission()` on mount, show grant button if still denied | Low |
| **H11** | Snooze exhaustion is silent (buttons just vanish) | `AlarmFiringScreen.tsx:318` | Add sibling block: `{snoozeCount >= 3 && <Text>No snoozes left</Text>}` | Trivial |

---

## 🟡 LOW (polish, typos, minor friction)

| ID | Issue | File | Fix | Effort |
|----|-------|------|-----|--------|
| **L1** | Share card says "iOS & Android" (Android-only at launch) | `ProgressScreen.tsx` | Change to "Android" | Trivial |
| **L2** | Calendar missing "today" indicator | `MonthlyCalendar.tsx` | Subtle outline or background for current day | Low |
| **L3** | Calendar typo: "pushups" (should be "push-ups") | `MonthlyCalendar.tsx:210` | Hyphenate | Trivial |
| **L4** | Calendar day headers: T, T (Tuesday/Thursday both "T") | `MonthlyCalendar.tsx` | Use "Tu", "Th" | Trivial |
| **L5** | No "next alarm in X hours" indicator | `AlarmListScreen.tsx` | Add line like "Next: 6:30 AM, in 7h 22m" near header | Low |
| **L6** | Manual counter button has no tap feedback | `AlarmFiringScreen.tsx` | Reuse existing `btnScale` spring animation on tap | Trivial |
| **L7** | Slots directly below bank CTA (loss churn risk) | `ProgressScreen.tsx` | Move to Rewards screen or behind secondary action | Low |
| **L8** | Q1 snooze step auto-advances after 5s (misclassifies readers) | `OnboardingScreen.tsx` | Remove auto-advance or extend to 10-15s | Low |
| **L9** | BankCameraScreen calls `setDebugAngle` in prod | `BankCameraScreen.tsx:58` | Wrap with `if (__DEV__)` like AlarmFiringScreen does | Trivial |
| **L10** | Onboarding alarm rep input is plain TextInput (AddAlarm uses stepper) | `OnboardingScreen.tsx` | Use ± stepper for consistency | Low |
| **L11** | Commitment step placeholder too generic | `OnboardingScreen.tsx` | Change to "e.g. Wake up with energy, prove I can commit" | Trivial |
| **L12** | Manual rep entry sheet missing bank balance | `ProgressScreen.tsx` | Add `<Text>Bank: {totalReps.toLocaleString()} reps</Text>` above input | Trivial |
| **L13** | Manual rep input shows no validation error | `ProgressScreen.tsx` | Add error text when input is non-numeric | Trivial |
| **L14** | Alarm save has no confirmation (no haptic/toast) | `AddAlarmScreen.tsx:76-94` | Add `Vibration.vibrate(50)` before `navigation.goBack()` | Trivial |
| **L15** | Reward long-press dialog doesn't show cost | `RewardsScreen.tsx:476-487` | Add cost subtitle in dialog title | Trivial |
| **L16** | Uncompleted calendar days look like padding cells | `MonthlyCalendar.tsx:119` | Add faint border to active days, keep padding cells empty | Low |
| **L17** | Emergency bypass cost hidden when toggle is off | `SettingsScreen.tsx:225` | Always render cost row; dim (`opacity: 0.4`) when off | Trivial |
| **L18** | GhostCard silently absent for day-1 users | `ProgressScreen.tsx:38` | Show placeholder: "Ghost mode activates tomorrow — race your past self" | Low |
| **L19** | Reward title can wrap to 2 lines (compresses layout) | `RewardsScreen.tsx:278` | Add `numberOfLines={1}` and `ellipsizeMode="tail"` | Trivial |

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
