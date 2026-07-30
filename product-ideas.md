# PushRise — Product & Retention Ideas

> Written 2026-07-28. Senior dev + marketer lens. No gimmicks. Prioritized by impact × effort.

---

## Do This First: Add Analytics

### 1. You Are Flying Blind

The PRD lists success metrics but there is no analytics SDK in the codebase. You cannot improve retention without knowing where users drop. Before any feature work, wire **PostHog** (free, self-hostable, open source) or **Mixpanel free tier**.

**Minimum events to track:**
- `onboarding_step_completed` — which step do people drop at?
- `paywall_viewed` / `paywall_converted` / `paywall_dismissed`
- `alarm_fired` / `alarm_dismissed_camera` / `alarm_dismissed_manual` / `alarm_snoozed`
- `camera_detection_started` / `first_rep_counted` / `session_completed`
- `session_d1` / `session_d3` / `session_d7` — retention cohorts

Every week without analytics is a week of learning lost. A/B testing anything is meaningless without baseline data.

---

## Bugs Found in the Code

These are real issues found by reading the implementation, not hypothetical risks.

### 2. Trial Warning Notifications Fire for Paying Users

`App.tsx` calls `scheduleTrialWarnings(trialStartedAt)` whenever `trialStartedAt` is set. `startTrial()` is called at the end of onboarding for every purchaser. Since there is no free trial, every subscriber receives day-5 and day-7 "your trial is ending" notifications after they've already paid.

A user who gets "your trial ends in 2 days" after purchasing will panic, contact support, or uninstall.

**Fix:** Remove `scheduleTrialWarnings` from `App.tsx` and delete the two notification schedules from `notifee.ts`. There is no trial. These are dead code.

### 3. Daily Nudge Doesn't Repeat Without App Open

The daily nudge (`NUDGE_NOTIF_ID`) is a one-shot `TIMESTAMP` trigger. After it fires, it's gone. It only reschedules when the user opens the app and the `[nudgeEnabled, nudgeHour, nudgeMinute, todayReps]` effect re-runs.

Active daily users are fine. But lapsed users — the ones who most need a nudge — won't get one after day 1 unless they open the app.

**Fix:** On every app open in `App.tsx`, call `scheduleNudge()` unconditionally after the existing guard logic. One extra call costs nothing; missing the reschedule costs the user.

### 4. Onboarding Progress Lost on Exit

`onboardingStore` only tracks `hasCompletedOnboarding: boolean`. If a user exits mid-flow — phone call, battery dies, Android kills the app — they restart from screen 1 of 18. A user who invested 10 minutes and reached alarm creation is dropped back to the beginning.

**Fix:** Persist the current step index to `onboardingStore`. On re-open, resume from where they left off. One field, prevents a non-trivial conversion drop.

### 5. "Rate PushRise" Row Is Visible Pre-Launch

The changelog says this row is hidden, but the code in `SettingsScreen.tsx` shows it's still live, linking to the Play Store with a fallback alert ("The app is not on the Play Store yet."). A user who taps it before launch sees a dead link followed by a confusing error.

**Fix:** Comment out or hide the row until the app is live and has reviews to show. Do not show it with a broken fallback.

### 6. No Confirmation After Saving an Alarm

`AddAlarmScreen.tsx` saves an alarm and navigates back with only a 50ms haptic vibration. There is no toast, no banner, no "Alarm set for 7:00 AM, Mon–Fri." The user has to trust it worked. If the phone is on silent or the vibration is subtle, there is zero feedback.

**Fix:** Show a toast after save: "Alarm set for [time]." Reuse the `TopToast` component already in the codebase. One call, eight words.

### 7. Duplicate Alarms Can Be Created Without Warning

`AddAlarmScreen.tsx` has no check for existing alarms at the same hour and minute. A user can create two alarms at 7:00 AM on the same days — both will fire simultaneously: two alarm screens stacked, sound playing twice, behavior undefined.

**Fix:** Before saving, check if any enabled alarm shares the same hour, minute, and at least one overlapping day. Show a warning: "You already have an alarm at 7:00 AM on these days." One guard.

---

## Real Retention Mechanics

### 8. Show Fitness Progression, Not Just Rep Counts

The most emotionally resonant thing for a beginner isn't their total rep count — it's seeing that they've gotten stronger. You already store daily history in `bankStore`. You can compute this now, no backend needed.

**The card:**
> "Week 1 average: 10 reps/alarm. This week: 16 reps/alarm. **+60% stronger.**"

This is the moment the app earns long-term loyalty. Implementation: `dailyHistory` in bankStore keyed by date. Compare `weekAvg(weeks[0])` vs `weekAvg(weeks[-3])`. One function, one card on the Progress tab.

### 9. Fix the Rep Target Stagnation Problem

Onboarding sets a rep target. The app never suggests increasing it. Users who plateau at 10 reps/alarm feel no growth after week 2.

**Add a "level up your morning" prompt** at day 7, 14, and 30 milestones: *"You've completed 10 reps every morning for 2 weeks. Ready to try 12?"* One tap to update.

This directly addresses a likely churn cause: early adopters who feel the app has nothing left to offer.

### 10. Show the User's Goal on the Alarm Firing Screen

Onboarding captures `grindingFor` (stored in `settingsStore`). This is never shown again.

During the alarm, when the user is still half-asleep and tempted to dismiss manually, showing **"Remember: you said you wanted to [wake up with energy / prove I can commit / etc.]"** is a more powerful motivator than any gamification. It's the commitment device they already agreed to.

One line of text, zero new features. High impact on alarm completion rate for days 1–14.

### 11. Google Fit / Health Connect Integration

Write each rep session to Android Health Connect. Zero incremental effort for the user. Makes PushRise part of their health ecosystem alongside Samsung Health and Fitbit.

Apps embedded in the health ecosystem have significantly lower churn. Users who see their PushRise reps in their overall activity history have a second reason to open the app. Health Connect is the Android standard as of Android 14+.

### 12. Android Home Screen Widget

"Today: 16/20 reps | 🔥 14 days" on the home screen is passive retention. No notification needed, no app open required. The user sees the streak every time they unlock their phone.

Widget users churn at dramatically lower rates across all habit apps (Duolingo, Headspace, Streaks). Android widgets in React Native require a small Kotlin side — worth the native investment.

---

## UI/UX Issues Found in the Code

These are specific interface problems found by reading the screens.

### 13. No "Switch to Manual" Escape During Camera Session

In `CameraCounter`, the only exit is "Skip (no push-ups)". If camera detection is failing — which is a real risk on budget hardware — the user's only option is to forfeit the session entirely. There is no way to switch to manual counting mid-session.

A user who can't get detection to work and hits "Skip" doesn't just fail today's alarm — they lose confidence in the app and are likely to use manual mode (or stop entirely) from that point forward.

**Fix:** Add a "Switch to manual" option in `CameraCounter`. Tap it → transition to `ManualCounter` preserving the current rep count. One navigation change, significant fallback improvement.

### 14. Alarm Label Not Shown on the Firing Screen

The alarm has a `label` field (e.g., "Morning Workout", "Pre-gym rise"). The `alarm` object is fetched from the store in `AlarmFiringScreen` and the label is available, but the firing screen subtitle always reads the generic "Time to wake up."

At 6am, seeing the alarm's own label is more grounding than a generic message — it reminds the user what this alarm is for.

**Fix:** Replace or augment "Time to wake up." with `alarm?.label` when non-empty. One line.

### 15. Snooze Button Copy Is Cryptic at 6am

The snooze row shows three buttons: `5m +5`, `10m +10`, `15m +15`. The "+5" means "+5 reps added as a penalty" — but a half-awake user at 6am will not parse this. They may think "+5 min" is being shown twice, or that tapping adds minutes, not reps.

The small caption "Snooze ({count} left) — adds reps" is 70% opacity and easy to miss.

**Fix:** Change button labels to `5m` / `10m` / `15m` and change the caption to "Each snooze adds reps to your count." Clearer stakes, no ambiguity.

### 16. AddAlarm: No "Next Fire" Preview

When configuring an alarm (time + days), the user has no indication of when it will actually fire next. If I set 7:00 AM Mon–Fri on a Tuesday afternoon, will it fire tomorrow or next Monday? The app doesn't say.

The `getNextAlarmTime` function already exists in `AlarmListScreen.tsx` and handles this calculation correctly.

**Fix:** Add a label below the time picker in `AddAlarmScreen`: "First alarm: Tomorrow (Wed), 7:00 AM." Reuse `getNextAlarmTime`. One line of text.

### 17. "Detecting…" Label Doesn't Respond to Pose State

In `CameraCounter`, a pulsing "Detecting…" label is shown below the rep count at all times, regardless of whether a pose has been found. When `poseActive` is true, the count number changes color, but the label stays the same.

Better feedback: when `poseActive`, show "Pose found — do your reps." When not, show "Get into position…". This helps users understand whether the camera sees them at all, which is the #1 confusion point for new users.

**Fix:** Conditionally render the label based on `poseActive`. Two string constants, one conditional.

### 18. Camera Gives No Guidance When Detection Is Stuck

Items 13 and 17 address what happens once detection starts working. But when it never starts — wrong angle, too dark, phone flat on a table — the user just sees "Detecting…" forever. There is no timeout, no hint, no indication that the camera doesn't see them at all. A new user at 6am in the dark has no idea what to do.

**Fix:** After 6 seconds with no pose detected, show a dismissible hint: "Not detecting you. Try better lighting or move closer." Track with a `useRef` timeout, dismiss when `poseActive` becomes true. One timeout, one conditional string.

### 19. Streak Freeze Count Has No Context on When the Next Is Earned

`AvatarCard` shows "❄️ 2/3 freezes" but gives no information on when the next freeze is earned. Freezes are milestone-based (earned at streak day 14, 21, 28) but nothing in the UI tells the user this. A user at a 13-day streak has no idea they're one day away from earning one.

**Fix:** Add below the freeze count: "Earn next at day [next_threshold]." One line of computed text. High retention value at the exact moment users are most at risk of missing a day and watching their streak die.

---

## The Fake Social Data Problem

### 20. The Fake Data Problem Has Four Surfaces, Not Two

Each one has a different detection risk and a different type of deception:

**Leaderboard** — User is always rank #3. The two people above them are always higher regardless of how many reps the user actually did (`getLeaderboard` in `engagement.ts` always places the user third, with fake names seeded above them). A user who does 500 reps in a week should be beating fake rivals who only have 50 — but they're still shown as #3. Detected quickly by any user who improves fast.

**Boss Battle** — Boss accumulates reps at a fixed daily rate seeded by the week. They always lose on a predictable schedule. A user who checks back multiple weeks in a row will notice the boss always falls on the same day pattern.

**Activity Ticker** — The Alarm List screen (`AlarmListScreen.tsx`) shows a scrolling feed: *"Marcus T. just did 40 push-ups 💪"*, *"Yuki S. just hit a 9-day streak 🔥"*. This is generated from `getTickerMessages()` in `engagement.ts`, seeded by the current hour. It changes hourly but repeats within the hour. A user who opens the app twice in 20 minutes sees identical "live" activity. This is the fake data surface most likely to be noticed first — it's on the main screen.

**Daily Challenge Accepted Count** — The Progress tab shows *"[X] people accepted"* for today's challenge. This is seeded with a random number between 800 and 2,499, recalculated deterministically per day. It doesn't change while the user watches, which makes it feel real — until a user compares it tomorrow and notices the logic.

**The fix:**
- Kill the leaderboard and boss battle until you have real backend data
- Kill or reframe the Activity Ticker: either remove it or label it as "Community Highlights" from a real feed, not fake names
- Remove the "accepted" count from Daily Challenge. "Try today's challenge" needs no fake social proof to work
- Keep Ghost Mode and Community Challenge (community goal only — the aggregate is plausible without names)
- **Ghost Mode is your strongest card.** Self-competition is authentic and requires no backend. Make it richer: show weekly trend, best-ever day comparison, not just yesterday.
- If you want a leaderboard before real data: reframe it as a benchmark. "Based on PushRise users in your region, you're in the top 40%." A regional average can be seeded without implying named people are competing with you.

---

## Monetization & Paywall

### 21. The Hard Paywall Will Suppress Word-of-Mouth

The PRD explicitly flagged the hard paywall conversion rate as an open question. The problem isn't just conversion — it's discovery. An app with a hard paywall gets no organic word-of-mouth from non-paying users who experienced the core loop.

**The bet to consider:** A 3-day free trial (full app, alarm fires, detection works) converts at higher rates because users experience the emotional peak — the first successful alarm completion — before the ask. The PRD identified this as the right moment for the review prompt. It's also the right moment for the paywall.

**Suggested flow:** Full app for 3 days → paywall on day 4. Trigger review on first successful completion (day 1 or 2). By day 4, the user has already told their friends, left a review, and experienced the habit forming. The weekly tier at $3.99 is designed for exactly this window.

### 22. Lifetime Tier Framing

$39.99 lifetime is correct pricing. But the framing matters. "Pay once, keep forever" misses the real job-to-be-done for a lifetime buyer: **elimination of decision fatigue and subscription guilt**.

A stronger frame: **"Own it. Never think about it again."**

Also: the 90% savings claim on annual ($19.99 vs $3.99/wk) is mathematically accurate but the number is so extreme it may trigger disbelief. Show it as a crossed-out "$3.99/wk" rather than just the percentage.

---

## Technical Reliability

### 23. Camera Detection Is Still the #1 Churn Risk

The PRD is clear: camera accuracy on ultra-budget phones is still an open question. If detection is bad, a user who wakes up, can't get the camera to count their push-ups, and must use manual fallback on day 1 has already lost faith. They'll churn within 2 weeks.

**Instrumentation to add (with analytics above):**
- `camera_first_rep_latency_ms` — time from camera open to first rep counted
- `camera_fallback_rate` — % of sessions where user switches to manual mid-session
- `camera_quit_rate` — % of sessions where user closes without completing, by mode

If `camera_fallback_rate > 20%`, detection quality is a real problem that needs to be prioritized over any new feature.

**One specific improvement:** The current 200ms snapshot loop is constant. Make it adaptive: 400ms when no pose detected (save CPU), 150ms when pose is active. Reduces battery drain on budget hardware and may improve detection quality by reducing frame overlap noise.

### 24. Alarm Reliability: Add "Did It Fire?" Monitoring

You have no signal when alarms fail to fire. Users who miss an alarm due to OEM battery optimization will either blame themselves, blame the app, or churn silently.

**Fix:** On first app open after a scheduled alarm time that passed, check if the alarm fired via `notifee` foreground event logs. If no record of firing, prompt: *"Did your alarm go off this morning?"* → No → route to battery optimization guide. Turns a silent failure into a support moment.

---

## Missed Personalization Opportunities

### 25. Personalize the Alarm Notification Body

Every alarm fires with: *"Time to wake up. Do 10 push-ups to dismiss."*

The alarm has a `label` field. The user has a `userName` and a `grindingFor` goal. None of these are in the notification body.

*"Time to rise, Syreese. 10 push-ups — you said you wanted to wake up with energy."* is a meaningfully different message at 6am. Implementation: pass `grindingFor` as notification data when scheduling in `notifee.ts:scheduleAlarm()`. Include it in the body template when non-empty.

### 26. Nudge Messages Don't Reference the User's Goal

The four daily nudge messages (`NUDGE_MESSAGES` in `notifee.ts`) are generic. They're effective, but they miss the personalization hook the user already gave you.

*"Still 0 push-ups today. You said you wanted to wake up with energy — this is how."* is more motivating than the generic version.

`grindingFor` is in `settingsStore`. Pass it through `scheduleNudge()` and append it to the message template when non-empty.

### 27. Personal Best Streaks Are Silent

`bankStore.longestStreak` is tracked but never surfaced. When a user surpasses their personal best streak, nothing happens. This is the most meaningful milestone in a streak app — more so than a 7-day calendar badge — and it goes completely uncelebrated.

**Fix:** When `newStreak > longestStreak` in `computeStreak()`, set a `pendingPersonalBest: true` flag (same pattern as `pendingCelebration`). Show a toast: *"New personal best — [X] days. Beat that."* One field, one check, potentially the most motivating moment in the app.

---

## Things to Kill Before Launch

| Item | Reason |
|------|--------|
| `scheduleTrialWarnings` in `App.tsx` | Dead code. No trial exists. Will confuse paying users. |
| Boss battle | Fake named competitors who lose on schedule will be noticed. Ship with real backend or not at all. |
| Leaderboard | Same as above. User is always rank #3 regardless of actual reps. |
| Activity Ticker on Alarm List | Fake "live" community feed seeded hourly. Opens twice in 20 minutes? Same names, same events. First fake-data surface most users will notice. |
| Daily challenge "accepted" count | Seeded fake number (800–2,499). Remove the count — the challenge works without fake social proof. |
| `RepSlotsModal` | Slot machine gambling for an audience that includes 15-year-olds. App store rejection risk. Real churn risk when users gamble away hard-earned reps. The bonus rep system (15% chance of 1–5 reps) already covers the "lucky spin" need without the liability. |
| "✦ SCREENSHOT TO SHARE ✦" hint on `LevelUpModal` | The share feature was deferred. Dangling CTAs that do nothing erode trust. Either ship it or remove the hint. |
| "Rate PushRise" row in Settings | Pre-launch, it dead-ends in an error. Hide it until you have Play Store reviews to show. |

---

## The Slots Gambling Mechanic (Expanded)

`RepSlotsModal.tsx` is a fully implemented slot machine where users wager their rep balance for randomized multipliers (2%–37% win rate, house wins 63% of the time — worse than most real slot machines).

**App store risk:** Google Play's gambling policy is ambiguous about in-app currency slot machines. The safe harbor is that virtual currency can't be exchanged for real money — but the mechanic is still a slot machine and can be flagged during review.

**Target demographic risk:** The stated target includes 15-year-olds. Simulated gambling directed at minors draws extra regulatory scrutiny in the EU, UK, and increasingly the US.

**Core value prop tension:** Users earn reps by waking up and physically completing push-ups. The slots let them gamble those reps away. A user who loses 200 reps (representing 20 morning alarms) to a slot machine does not feel motivated — they feel cheated by randomness. That's a churn trigger.

Remove it before launch.

---

## Sequencing Recommendation

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Fix trial warning bug | Trivial | Prevents confused/churned subscribers |
| 2 | Hide "Rate PushRise" pre-launch | Trivial | Removes broken dead-end |
| 3 | Remove slots modal | Trivial | Reduces app store rejection risk |
| 4 | Kill leaderboard, boss battle, activity ticker, fake accepted count | Trivial | Removes all fake social data surfaces at once |
| 5 | Show alarm label on firing screen | Trivial | Personalization at the moment that matters |
| 6 | Fix snooze copy ("5m +5") | Trivial | Removes sleep-groggy confusion |
| 7 | Add save confirmation toast in AddAlarm | Trivial | Users know the alarm was actually set |
| 8 | Add duplicate alarm warning | Trivial | Prevents double-firing alarms |
| 9 | Add "Switch to manual" in camera mode | Low | Prevents session abandonment on detection failure |
| 10 | Add analytics (PostHog/Mixpanel) | Low | Critical — all other decisions depend on this |
| 11 | Show `grindingFor` on alarm screen | Trivial | High — days 1–14 alarm completion |
| 12 | Personalize alarm notification body | Trivial | High — same window |
| 13 | Fix nudge reschedule bug | Trivial | Lapsed-user re-engagement |
| 14 | Add next-fire preview in AddAlarm | Trivial | Reduces alarm setup confusion |
| 15 | Fix "Detecting…" label feedback | Trivial | Helps users understand camera state |
| 16 | Add camera timeout hint (6s with no pose) | Trivial | Helps new users in bad lighting conditions |
| 17 | Add streak freeze "earn next at day X" label | Trivial | High — retention value at the exact moment users might quit |
| 18 | Personal best streak celebration | Low | High — most meaningful milestone |
| 19 | Fix onboarding progress on exit | Low | Recovers mid-funnel drop |
| 20 | Fitness progression card | Low | High — long-term loyalty |
| 21 | Rep target upgrade prompt | Low | High — prevents stagnation churn |
| 22 | Camera adaptive frame rate | Low | Medium — battery/quality on budget hardware |
| 23 | Consider 3-day free trial | Medium | High — top-of-funnel word-of-mouth |
| 24 | Health Connect integration | Medium | Medium — ecosystem stickiness |
| 25 | Alarm fire monitoring | Low | Medium — silent failure detection |
| 26 | Android home screen widget | High | High — long-term passive retention |

Items 1–8 and 11–17 are all under an hour each. Do them before submission.
