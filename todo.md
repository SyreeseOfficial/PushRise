# PushRise — Todo

Tracks everything that needs to happen. Grouped by phase. Check off as done.

---

## My Ideas (Not by AI)
- Manufactured urgency
- Limited-time reward slots: "Pizza reward available for the next 48 hours" (you set it, the app surfaces it urgently)
- "Power hour" window each morning where reps count double

Notification artillery
- "Your friend just did 30 push-ups" (even if they don't have friends in-app, fake this with bot accounts in early versions)
- Re-engagement: "You haven't opened PushRise in 2 days. Your muscles are getting cold."
- Celebratory "confetti" notification when hitting milestones — dopamine hit from the OS itself

Reward scarcity / gatekeeping
- Rewards locked behind rep thresholds that feel achievable but take real grinding (e.g., "500 reps to unlock custom sounds")
- Premium rewards slot that refreshes weekly — you have to check back

The number that never goes down (except streaks)
- Total lifetime reps counter is permanent and keeps growing. People don't want to feel like quitters on a big number.
- Streak is the only number that can go down — so you protect the growing ones and panic over the fragile one

## My Todos
- [ ] When the alarm itself goes off, it doesnt match the apps style/design/colors. Make it uniform with the rest of the app.
It should also change based on dark mode, light mode, system mode.
- [ ] Whenever the user is on any of these tabs: progress, rewards, settings, the icon for the alarms tab turns into a question mark.
But when the user is on the alarms tab, the icon for alarms is the actual alarm clock icon.
- [ ] When creating custom rewards, some of the background colors for the emojis are different colors like orange. The background color
behind the emoji should always be the subtle grey. Same thing for dark mode. The background color should be the grey thats on the dark mode.
I think the correct grey is the grey that ships with the default rewards.
- [ ] In the settings menu, some of the icons have a different background color as well like orange or black. I also want the background colors
for the icons to be the same grey color.
- [ ] Currently, when the user tries to redeem a reward, a popup message opens up asking the user if they want to redeem their reward.
It seems like the styling is like the phone's native OS styling. Is there a way to change it to match our custom styling to be uniform
with the rest of the app?

--- 

## Before Coding Starts

- [x] Fill out `pre-build.md` completely — DONE (screens, copy, voice, rewards, badges)
- [ ] Decide: Xiaomi/Samsung testing — borrow a device or use BrowserStack (real device cloud)
- [ ] Set up RevenueCat account and create products (monthly + lifetime) in Google Play Console
- [ ] Set up bare React Native project scaffold

---

## Week 1 — Validation Gate (do not proceed past here without passing both)

- [ ] Alarm fires reliably on personal Android phone (foreground service + `setAlarmClock`)
- [ ] Alarm fires reliably on personal Android tablet
- [ ] MediaPipe detects push-ups acceptably on personal Android phone in real conditions (dim light, floor level)
- [ ] Decision made on camera fallback path if detection is unacceptable

---

## MVP Build

- [ ] Alarm — one-time + recurring, volume control, device sounds + custom file sounds
- [ ] Full-screen alarm takeover when alarm fires (`FLAG_SHOW_WHEN_LOCKED` + `FLAG_TURN_SCREEN_ON`)
- [ ] Camera push-up detection (MediaPipe)
- [ ] Manual fallback mode (hold-button-per-rep, adds friction vs. camera)
- [ ] **Outside-alarm push-up logging** — dedicated log button in Progress tab; camera or manual entry; all reps (alarm + outside) count toward push-up bank
- [ ] Battery optimization onboarding screen (OEM-specific instructions, framed as "make your alarm bulletproof")
- [ ] Notification permission onboarding screen (preceded by branded pre-warning screen)
- [ ] Full onboarding flow (see `pre-build.md` and `updated-prd.md` for all 20 screens + copy)
- [ ] Reward banking — default rewards pre-loaded + user-created custom rewards; alarm push-ups + outside push-ups both count toward bank
- [ ] Streak tracking (goal-completion only, grace day mechanic)
- [ ] RevenueCat paywall integration (7-day trial → monthly or lifetime)
- [ ] Trial warning notifications (Day 5, Day 7)
- [ ] Post-trial state: push-up mechanic locked, alarm still fires (user sees what they're missing)
- [ ] Downsell screen 1: discounted price + real 15-min countdown timer
- [ ] Downsell screen 2: 3-day trial extension (one-time, non-repeatable)
- [ ] Review prompt — fires after first alarm successfully dismissed with push-ups (NOT during onboarding)

---

## Play Store Submission (Week 5)

- [ ] App icon (512×512 PNG)
- [ ] Feature graphic (1024×500)
- [ ] Screenshots (min. 2, aim for 6–8, phone + tablet)
- [ ] Store listing copy (title, short description, full description)
- [ ] Privacy policy — write and host at a real URL (replace placeholder links currently in app)
- [ ] Camera permission justification statement for Play Store review
- [ ] Subscription terms clearly displayed in-app (Play Store requirement)
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
