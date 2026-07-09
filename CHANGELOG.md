# Changelog

## [Unreleased]

### Added
- Alarm persistence via MMKV (Zustand persist middleware)
- Reward banking system — bankStore, RewardsScreen, BankCameraScreen
- Outside push-up logging with camera and manual entry from Progress tab
- Bank Push-ups CTA with one-time intro bottom sheet
- Bank total 🔥 pill on Alarms tab header
- Alarm reps credited to bank on successful completion (not on skip)
- Recurring alarm scheduling via nextOccurrence() helper
- Volume control — 5-level segmented control stored on Alarm
- Sound picker — bundled preset list with preview-on-tap
- Streak tracking with 1 grace day per 7-day rolling window
- Streak earned from both alarm completions and manual banking
- Onboarding flow — 20 screens across 5 phases

### Fixed
- MMKV v4 API (createMMKV() instead of new MMKV())
- Push-up bottom threshold loosened (DOWN_ANGLE 125→140, UP_ANGLE 150→160)
- Recurring alarms: use dismissFiredAlarm() after rescheduling to avoid cancelling new trigger
- AddAlarmScreen time picker frozen on Android — replaced inline spinner with tap-to-open dialog
