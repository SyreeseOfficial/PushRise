# Changelog

## [Unreleased]

### Added
- Daily nudge notification — fires at user-set time if 0 push-ups logged; auto-cancels on first rep; toggle + time picker in Settings
- Ghost Mode — `GhostCard` on Progress tab shows delta vs yesterday-you at same hour of day (▲ AHEAD / ▼ BEHIND)
- Anonymous rival — fake push notification 30–90min after completing alarm ("X just passed you. You're now #4.")
- 10-level avatar system with flat early curve (Seedling → Legend); progress bar to next level
- Milestone celebration modals (100 / 250 / 500 / 1k / 2.5k / 5k / 10k / 25k / 50k reps)
- Bonus reps mechanic (15% chance, 1–5 bonus reps per alarm completion)
- Community Challenge card — fake weekly goal (10k), live-ticking, refreshes every 30s
- Boss Battle card — weekly fake rival; win state + celebration modal; new rival each week
- Weekly Leaderboard card — 5 entries, user always #3, seeded daily
- Activity Ticker on Alarms tab — animated fake activity feed seeded hourly
- Share card modal — gradient stat card for screenshots
- Settings: haptic per rep, keep screen on, vibrate on alarm, mute during session, audio cue, camera toggle
- Settings: daily push-up goal with progress bar, "What are you grinding for?" commitment card
- Settings: theme picker (light / dark / system), both reset options, Rate PushRise (accent orange icon)
- Onboarding: daily-goal step, grinding-for commitment step
- 50 international fake names (American, East Asian, South Asian, European, African/Middle Eastern, Latin American)
- Alarm persistence via MMKV (Zustand persist middleware)
- Reward banking system — bankStore, RewardsScreen, BankCameraScreen
- Outside push-up logging with camera and manual entry from Progress tab
- Bank Push-ups CTA with one-time intro bottom sheet
- Bank total pill on Alarms tab header
- Alarm reps credited to bank on successful completion (not on skip)
- Recurring alarm scheduling via nextOccurrence() helper
- Volume control — 5-level segmented control stored on Alarm
- Sound picker — bundled preset list with preview-on-tap
- Streak tracking with 1 grace day per 7-day rolling window
- Streak earned from both alarm completions and manual banking

### Fixed
- Level progress bar always showing "10k to next level" — threshold array was descending, `find()` always matched highest first
- Emoji backgrounds orange on affordable rewards — was `primaryContainer`; now always `surfaceVariant`
- Hardcoded "1,000,000" in community challenge text; now uses `communityGoal.goal`
- `checkForActiveAlarm` now filters by alarm channel — previously would navigate to AlarmFiring on any notification
- `alarm-outline` icon replaced with `alarm` (outline variant missing from MaterialCommunityIcons)
- MMKV v4 API (createMMKV() instead of new MMKV())
- Push-up bottom threshold loosened (DOWN_ANGLE 125→140, UP_ANGLE 150→160)
- Recurring alarms: use dismissFiredAlarm() after rescheduling to avoid cancelling new trigger
- AddAlarmScreen time picker frozen on Android — replaced inline spinner with tap-to-open dialog

### Changed
- Full visual redesign: pure white/black theme, #FF5500 orange primary, gradient hero cards
- Material Design 3 via react-native-paper v5 — all colors via `useTheme()`, no hardcoded values
- Community goal reduced from 1,000,000 → 10,000 (realistic for new app)
- AlarmFiringScreen: fixed hardcoded DarkTheme colors → `useTheme()` in each sub-component
