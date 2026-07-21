# PushRise App Improvements — Task Tracker

## Tier 1 — Broken Features (Trust Killers)

- [x] **1a. Wire `autoCompleteAlarm`**  
  File: `src/screens/alarms/AlarmFiringScreen.tsx`  
  After `setMode('done')`, check `settings.autoCompleteAlarm` — if true, call `cleanup(true)` with 800ms delay.

- [x] **1b. Wire `audioCueOnRep`**  
  Files: `src/screens/alarms/AlarmFiringScreen.tsx`, `src/screens/progress/BankCameraScreen.tsx`  
  Load short beep sound via `react-native-sound` (already installed). Play on each rep if `settings.audioCueOnRep` is enabled.

- [x] **1c. Guard debug angle with `__DEV__`**  
  Files: `src/screens/alarms/AlarmFiringScreen.tsx`, `src/screens/progress/BankCameraScreen.tsx`  
  Wrap `debugAngle` text render with `{__DEV__ && ...}` to hide from production.

- [x] **1d. Battery optimization: add deep link button**  
  Files: `src/screens/onboarding/OnboardingScreen.tsx` (`battery` step), `src/screens/settings/PermissionsScreen.tsx`  
  Add "Open Battery Settings →" button using `Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS')`.

---

## Tier 2 — Engagement Wins (High Dopamine ROI)

- [x] **2a. Goal crushed → confetti**  
  File: `src/screens/progress/ProgressScreen.tsx`  
  Add `ConfettiCannon` ref. Fire when `todayReps` first crosses `dailyGoal`. Gate with session-scoped ref to fire once per day.

- [x] **2b. Alarm done screen → add confetti + streak line**  
  File: `src/screens/alarms/AlarmFiringScreen.tsx`  
  Fire confetti when `mode === 'done'`. Add streak status line: "Day N in a row 🔥" (if streak > 1) or "Streak started! 🔥" (if streak = 1).

- [ ] **2c. Native share sheet for ShareCardModal**  
  File: `src/screens/progress/ProgressScreen.tsx`  
  Install `react-native-view-shot`. Wrap share card in `ViewShot` ref. Replace screenshot instruction with "Share →" button that captures + opens native share sheet.  
  _Skipped: requires new native dep. Screenshot instruction still works._

- [x] **2d. Post-onboarding welcome moment**  
  Files: `src/screens/alarms/AlarmListScreen.tsx`, `src/store/onboardingStore.ts`  
  Add `isFirstLaunch` flag to `onboardingStore`. On first Alarms tab view, show `TopToast`: "You're in. Tomorrow starts here. 💪" (one-time).

- [x] **2e. Show daily goal progress inside banking sessions**  
  Files: `src/screens/alarms/AlarmFiringScreen.tsx`, `src/screens/progress/BankCameraScreen.tsx`  
  If `dailyGoal > 0`, show progress line at bottom of counter: "Today: N / G" or "X more to hit today's goal."

- [x] **2f. Next title in N reps progress indicator**  
  File: `src/screens/progress/ProgressScreen.tsx` (AvatarCard)  
  Add text below level bar: "🏷️ 47 reps from [Next Title Name]". Compute from `TITLES` array by finding first locked title.

---

## Tier 3 — Onboarding Polish

- [x] **3a. Fix silent 3-char minimum on commitment contract**  
  File: `src/screens/onboarding/OnboardingScreen.tsx` (`commitment` step)  
  Show helper text below input: "Type at least a few words to lock it in." (only when `grindingFor.length > 0 && grindingFor.trim().length <= 2`).

- [x] **3b. Pending celebration badge on Progress tab**  
  File: `src/navigation/CustomTabBar.tsx`  
  Read `bankStore.pendingCelebration`. If set, show small orange dot badge on Progress tab icon.

---

## Tier 4 — UI Polish

- [ ] **4a. FAB bottom position uses safe area insets**  
  Files: `src/screens/alarms/AlarmListScreen.tsx`, `src/screens/rewards/RewardsScreen.tsx`  
  Use `useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` + `insets.bottom` instead of hardcoded `bottom: 100`.

- [ ] **4b. Monthly calendar: add swipe arrows**  
  File: `src/components/MonthlyCalendar.tsx`  
  Add `‹` / `›` `IconButton`s to month header. Reuse existing swipe handlers.

- [ ] **4c. Streak at-risk nudge**  
  File: `src/screens/progress/ProgressScreen.tsx`  
  Show yellow banner if `currentStreak > 0 && todayReps === 0 && hour >= 20`: "⚠️ Log reps before midnight to keep your N-day streak."

---

## Summary

**Total tasks:** 14  
**New dependencies:** 1 (`react-native-view-shot` for native share)  
**Estimated effort:** Small (most are 10–30 min changes)  
**ROI:** High (fixes broken features + adds key retention hooks)
