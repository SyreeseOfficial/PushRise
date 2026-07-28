# PushRise — Product & Retention Ideas

> Written 2026-07-28. Senior dev + marketer lens. No gimmicks. Prioritized by impact × effort.

---

## P0 — Ship Before Anything Else

### 1. Add Analytics (You Are Flying Blind)

The PRD lists success metrics but there is no analytics SDK in the codebase. You cannot improve retention without knowing where users drop. Before any feature work, wire **PostHog** (free, self-hostable, open source) or **Mixpanel free tier**.

**Minimum events to track:**
- `onboarding_step_completed` (which step do people drop at?)
- `paywall_viewed` / `paywall_converted` / `paywall_dismissed` (conversion rate)
- `alarm_fired` / `alarm_dismissed_camera` / `alarm_dismissed_manual` / `alarm_snoozed`
- `camera_detection_started` / `first_rep_counted` / `session_completed` (camera quality proxy)
- `session_d1` / `session_d3` / `session_d7` (retention cohorts)

**Why now:** Every week without this is a week of learning lost. A/B testing anything (paywall, onboarding copy, rep targets) is meaningless without baseline data.

---

## Real Retention Mechanics

### 2. Show Fitness Progression, Not Just Rep Counts

The most emotionally resonant thing for a beginner isn't their total rep count — it's seeing that they've gotten stronger. You already store daily history in `bankStore`. You can compute this now, no backend needed.

**The card:**
> "Week 1 average: 10 reps/alarm. This week: 16 reps/alarm. **+60% stronger.**"

This is the moment the app earns long-term loyalty. The user feels the app is working. No competitor does this. It's real data you already have.

Implementation: `dailyHistory` in bankStore keyed by date. Compare `weekAvg(weeks[0])` vs `weekAvg(weeks[-3])`. One function, one card on Progress tab.

### 3. Fix the Rep Target Stagnation Problem

Onboarding sets a rep target. The app never suggests increasing it. Users who plateau at 10 reps/alarm feel no growth after week 2.

**Add a "level up your morning" prompt** at day 7, 14, and 30 milestones: *"You've completed 10 reps every morning for 2 weeks. Ready to try 12?"* One tap to update. This is the habit loop upgrade that makes the app compound.

This also directly addresses a likely churn cause: early adopters who feel the app has nothing left to offer.

### 4. Show the User's Goal on the Alarm Firing Screen

Onboarding captures `grindingFor` (stored in settingsStore). This is never shown again.

During the alarm, when the user is still half-asleep and tempted to dismiss manually, showing **"Remember: you said you wanted to [wake up with energy / prove I can commit / etc.]"** is a more powerful motivator than any gamification. It's the commitment device they already agreed to.

One line of text, zero new features. High impact on alarm completion rate for days 1-14 (the critical window).

### 5. Google Fit / Health Connect Integration

Write each rep session to Android Health Connect (formerly Google Fit). Zero incremental effort for the user. Makes PushRise part of their health ecosystem, alongside apps like Samsung Health and Fitbit.

**Why retention:** Apps embedded in the health ecosystem have significantly lower churn. Users who can see their PushRise reps in their overall activity history have a second reason to open the app and a social surface ("I did 45 push-ups this morning" visible in Health).

Health Connect is the Android standard as of Android 14+. It's a one-time native integration.

### 6. Android Home Screen Widget

"Today: 16/20 reps | 🔥 14 days" on the home screen is passive retention. No notification needed, no app open required. The user sees the streak every time they unlock their phone.

**Why now:** Widget users churn at dramatically lower rates across all habit apps (Duolingo, Headspace, Streaks). This is one of the highest-leverage retention mechanics that apps consistently ship too late.

Android widgets in React Native require a small Kotlin side — not complex. Worth the native investment.

---

## The Fake Social Data Problem

### 7. The Leaderboard and Boss Battle Are a Time Bomb

The seeded fake leaderboard and boss battle work on day 1. By day 14, a returning user notices:
- The same relative leaderboard position (always #3)
- The boss always loses on the same day of the week
- Community progress "ticks up" in a suspiciously regular pattern

When this illusion breaks, it doesn't just feel gimmicky — it feels dishonest. Users who feel deceived churn and leave 1-star reviews.

**The fix:**
- **Kill the leaderboard and boss battle** until you have real backend data. Ship them with fake data only once before you have real users, then migrate.
- **Keep Ghost Mode and Community Challenge.** Ghost Mode is self-competition — it can never be fake. Community Challenge is vague enough to feel real (community rep counts are hard to verify).
- **Ghost Mode is your strongest card.** Self-competition is authentic, motivating, and requires no backend. Invest in making it richer — show weekly trend, best-ever day comparison, not just yesterday.

Alternatively: **reframe the leaderboard as a benchmark.** "Based on PushRise users in your region, you're in the top 40%." A regional average can be legitimately seeded without requiring live user data and doesn't imply named people are competing with you.

---

## Monetization & Paywall

### 8. The Hard Paywall Will Suppress Word-of-Mouth

The PRD explicitly flagged the hard paywall conversion rate as an open question. The problem isn't just conversion rate — it's discovery. An app with a hard paywall gets no organic word-of-mouth from non-paying users who experienced the core loop. "You have to pay but it's worth it" is a much weaker referral than "I use this app every morning."

**The bet to consider:** A 3-day free trial (full app, alarm fires, push-up detection works) converts at higher rates because users experience the emotional peak — the first successful alarm completion — before the ask. The PRD identified this peak as the right moment for the review prompt. It's also the right moment for the paywall.

**Suggested flow:** Full app for 3 days, paywall on day 4. Trigger review on first successful completion (day 1 or 2). By day 4, the user has already told their friends, left a review, and experienced the habit forming.

The weekly tier at $3.99 is designed for exactly this — people who want to try before committing to annual.

### 9. Lifetime Tier Is Underpriced for the Wrong Reason

$39.99 lifetime is correct (PRD history shows it was $14.99 initially, raised to $39.99). But the framing matters. Right now it's presented as "pay once, keep forever."

A stronger frame: **"Own it. Never worry about it again."** The emotional job-to-be-done for a lifetime buyer isn't savings — it's elimination of decision fatigue and subscription guilt. Position it as the premium, not the discount.

Also: the 90% savings claim on annual ($19.99 vs $3.99/wk) is mathematically accurate ($207.48/yr vs $19.99) but the number is so extreme it may trigger disbelief. Consider showing it as "vs. $3.99/wk" with a crossed-out price rather than just the percentage.

---

## Technical Reliability

### 10. Camera Detection Is Still the #1 Churn Risk

The PRD is clear: "Camera accuracy on ultra-budget phones (sub-$100 Android): acceptable for launch or gate to manual-only?" This question is still open.

**The fallout if detection is bad:** A user who wakes up, can't get the camera to count their push-ups, and has to use manual fallback on day 1 has already lost faith. They'll use manual mode going forward, which removes the core accountability mechanic. They'll churn within 2 weeks.

**Instrumentation to add (with analytics above):**
- `camera_first_rep_latency_ms` — time from camera open to first rep counted
- `camera_fallback_rate` — % of sessions where user switches to manual mid-session
- `camera_quit_rate` — % of sessions where user closes without completing, by mode

If `camera_fallback_rate > 20%`, the detection quality problem is real and needs to be prioritized over any new feature.

**One specific detection improvement:** The current 200ms snapshot loop is constant. Make it adaptive: 400ms when no pose detected (save CPU), 150ms when pose is active. This reduces battery drain on budget hardware and may improve detection quality by reducing frame overlap noise.

### 11. Alarm Reliability: Add "Did It Fire?" Monitoring

You have no signal when alarms fail to fire. Users who miss an alarm due to OEM battery optimization will either blame themselves, blame the app, or churn silently. You can't fix what you can't see.

**Simple fix:** On first app open after a scheduled alarm time that passed, check if the alarm fired (the `notifee` foreground event logs this). If no record of firing, prompt: *"Did your alarm go off this morning?"* → No → route to battery optimization guide. This catches OEM kill issues and turns a silent failure into a support moment.

---

## Bugs Found in the Code

These are real issues found by reading the implementation, not hypothetical risks.

### 12. Trial Warning Notifications Fire for Paying Users (Bug)

`App.tsx` calls `scheduleTrialWarnings(trialStartedAt)` whenever `trialStartedAt` is set. `startTrial()` is called at the end of onboarding for every user who purchases. Since there's no free trial (hard paywall), every subscriber will receive day-5 and day-7 "your trial is ending" notifications after they've already paid.

This is confusing at best. At worst, a user thinks their access is being revoked, panics, and contacts support — or just uninstalls.

**Fix:** Remove `scheduleTrialWarnings` from `App.tsx` and delete the two notification schedules from `notifee.ts`. There is no trial. These are dead code.

### 13. Daily Nudge Doesn't Repeat Without App Open

The daily nudge (`NUDGE_NOTIF_ID`) is a one-shot `TIMESTAMP` trigger. After it fires, it's gone. It only reschedules when the user opens the app and the `[nudgeEnabled, nudgeHour, nudgeMinute, todayReps]` effect re-runs. Active daily users are fine — the app opens, `todayReps` resets at midnight, the effect fires, nudge is rescheduled. But lapsed users (the ones who most need a nudge) won't get one after day 1 unless they open the app.

**Fix:** On every app open in `App.tsx`, call `scheduleNudge()` unconditionally (after the existing guard logic). One extra call costs nothing; missing the reschedule costs the user.

### 14. Onboarding Progress Lost on Exit

`onboardingStore` only tracks `hasCompletedOnboarding: boolean`. If a user exits mid-flow — phone call, battery dies, Android kills the app — they restart from screen 1 of 18. A user who invested 10 minutes and got to alarm creation is dropped back to "You keep hitting snooze."

**Fix:** Persist the current step index to `onboardingStore`. On re-open, resume from where they left off. One field, prevents a non-trivial conversion drop.

---

## The Slots Gambling Mechanic

### 15. `RepSlotsModal` Is a Liability

There is a fully-implemented slot machine in the app (`RepSlotsModal.tsx`) where users wager their rep balance for randomized multipliers (2%–37% win rate). This is a real concern on several levels:

**App store risk:** Google Play's gambling policy is ambiguous about in-app currency slot machines. The safe harbor is that virtual currency can't be exchanged for real money — but the mechanic is still a slot machine and can be flagged during review. Apple has historically been stricter. This is a rejection risk before launch.

**Target demographic risk:** The stated target includes 15-year-olds. Simulated gambling directed at minors draws extra regulatory scrutiny in the EU, UK, and increasingly the US. Even if the current review passes, it's a future liability.

**Core value prop tension:** Users earn reps by waking up and physically completing push-ups. The slots let them gamble those reps away. A user who loses 200 reps (representing 20 morning alarms) to a slot machine does not feel motivated. The pain they were supposed to feel from *not* completing push-ups is now felt from a random outcome they can't control. That's a churn trigger.

**The odds:** The house wins 63% of the time. Worse than most real slot machines.

**Recommendation:** Remove it before launch. If you want a "lucky spin" mechanic, the bonus rep system (15% chance of 1-5 bonus reps per session) already scratches that itch without the slot machine risk.

---

## Missed Personalization Opportunities

### 16. Alarm Notification Body Is Generic

Every alarm fires with: *"Time to wake up. Do 10 push-ups to dismiss."*

The alarm has a `label` field. The user has a `userName` (stored in settingsStore). The user has a `grindingFor` goal. None of these are in the notification body.

*"Time to rise, Syreese. 10 push-ups — you said you wanted to wake up with energy."* is a meaningfully different message at 6am than the generic version. It's the commitment device in the user's own words, delivered at exactly the moment they're tempted to dismiss.

Implementation: pass `grindingFor` as notification data when scheduling in `notifee.ts:scheduleAlarm()`. Include it in the body template if non-empty.

### 17. Nudge Messages Don't Reference the User's Goal

The four daily nudge messages (`NUDGE_MESSAGES` in `notifee.ts`) are generic shame. They're effective, but they miss the personalization hook the user already gave you: their `grindingFor` goal.

*"Still 0 push-ups today. You said you wanted to wake up with energy — this is how."* is more motivating than *"Zero reps so far. Tomorrow-you will judge today-you."*

`grindingFor` is in settingsStore. Pass it through `scheduleNudge()` and append it to the message template when non-empty.

### 18. Personal Best Streaks Are Silent

`bankStore.longestStreak` is tracked but never surfaced. When a user surpasses their personal best streak, nothing happens. This is the most meaningful milestone in a streak app — more meaningful than a 7-day calendar badge — and it goes completely uncelebrated.

When `newStreak > longestStreak` in `computeStreak()`, set a `pendingPersonalBest: true` flag (same pattern as `pendingCelebration`). Show a toast or modal: *"New personal best — [X] days. Beat that."* One field, one check, potentially the most motivating moment in the app.

---

## Things to Kill

- **Rate PushRise row in Settings** is already hidden (per changelog). Leave it hidden until you have Play Store reviews to show for it.
- **The boss battle** — ship it with real backend or not at all. Fake named competitors who lose on schedule will be noticed.
- **"✦ SCREENSHOT TO SHARE ✦" hint on LevelUpModal** — the share card feature was deferred (requires react-native-view-shot install). Either ship the feature or remove the hint. Dangling CTAs that do nothing erode trust.
- **`scheduleTrialWarnings`** — dead code, no trial exists. Remove before launch.
- **`RepSlotsModal`** — slot machine gambling for an audience that includes 15-year-olds. Remove or defer until you have legal clearance and a backend to monitor abuse.

---

## Sequencing Recommendation

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Fix trial warning bug (bug) | Trivial | Prevents confused/churned subscribers |
| 2 | Add analytics (PostHog/Mixpanel) | Low | Critical — all other decisions depend on this |
| 3 | Remove slots modal | Trivial | Reduces app store rejection risk |
| 4 | Show `grindingFor` on alarm screen | Trivial | High — days 1–14 alarm completion |
| 5 | Personalize alarm notification body | Trivial | High — same window |
| 6 | Personal best streak celebration | Low | High — most meaningful milestone |
| 7 | Fix nudge reschedule (bug) | Trivial | Lapsed-user re-engagement |
| 8 | Fitness progression card | Low | High — long-term loyalty |
| 9 | Rep target upgrade prompt | Low | High — prevents stagnation churn |
| 10 | Persist onboarding step | Low | Recovers mid-funnel drop |
| 11 | Kill boss battle (defer to backend) | Trivial | Reduces deception churn |
| 12 | Consider 3-day trial | Medium | High (top-of-funnel word-of-mouth) |
| 13 | Health Connect integration | Medium | Medium (ecosystem stickiness) |
| 14 | Camera adaptive frame rate | Low | Medium (battery/quality on budget hardware) |
| 15 | Android widget | High | High (long-term passive retention) |
| 16 | Alarm fire monitoring | Low | Medium (silent failure detection) |

Items 1, 3, 4, 5, 7, 11 are all under an hour each. Do them before submission.
