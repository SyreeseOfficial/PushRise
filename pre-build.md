# PushRise — Pre-Build Planning

Source of truth for screen inventory, copy, and design specs. All detailed copy now lives in `updated-prd.md` — this file is the working spec.

---

## Screen Inventory

### Onboarding (20 screens)

| # | Screen | Notes |
|---|---|---|
| 1 | Welcome | "The snooze button is making you weak." Full copy in PRD. |
| 2 | Founder's note | Digital handwritten-style note, cursive font signature, placeholder selfie |
| 3 | Social proof | 3 testimonial cards. Replace with real reviews post-launch. |
| 4 | Quiz intro | "Let's be honest with each other." |
| 5 | Q1: Snooze severity | Single select, 4 options |
| 6 | Q1 reflection | "You're not lazy. You're untrained." Auto-advance after 2–3s |
| 7 | Q2: Fitness level | Single select, 3 options |
| 8 | Q3: Real goal | Single select, 3 options |
| 9 | Q4: Push-up count | Single select, 4 options |
| 10 | Q5 + Q6: Wake time + reward | Time picker + multi-select |
| 11 | Fake "analyzing" loading | Progress bar, cycling subtext, 3–4 seconds |
| 12 | Persona reveal | 3 possible types based on quiz answers — see PRD for copy |
| 13 | Dream outcome | Chart + stats. "In 30 days, you'll be a different person." |
| 14 | Journey summary | Reflects answers back: wake time, reps, goal, reward |
| 15 | Create first alarm | Embedded alarm creation UI. IKEA effect. |
| 16 | Commitment screen | "How committed are you?" — psychological lock-in |
| 17 | Permission pre-warning | Branded screen explaining what's coming and why |
| 18 | Notification permission | System prompt |
| 19 | Battery optimization | Step-by-step guide to disable battery optimization |
| 20 | Price comparison → Paywall | Coffee vs. PushRise comparison, then trial/paywall screen |

---

### Main App (3 tabs)

**Tab 1: Alarms**
- Alarm list (shows existing alarms)
- Empty state for first-time users (nudge to add first alarm)
- Add alarm button
- Alarm detail / edit screen
- Alarm toggle (on/off)

**Tab 2: Progress**
- Push-up stats (total banked, today, this week, streak)
- Chart showing push-ups over time
- Streak display with grace day indicator
- Badge / achievement section
- "Log Push-ups" button (floating action or dedicated button) — opens outside-alarm logging flow
  - Option A: camera detection
  - Option B: manual number entry

**Tab 3: Rewards**
- Default rewards pre-loaded
- User-created rewards
- Add reward button (paywalled for custom — free trial gets defaults only)
- Edit / delete rewards
- Push-up cost display per reward
- Redeem button per reward (honor system — marks as redeemed)

---

### Alarm Flow (fires when alarm triggers)

- Full-screen takeover (shows over lock screen)
- Alarm sound playing
- Rep count display (large, centered)
- "I'm Ready" button → activates camera
- Camera view with overlay: rep counter, progress bar toward goal
- Auto-dismiss when target hit
- Celebration moment / rep confirmation
- Reps automatically added to bank

---

### Settings Screen

- Dark mode / light mode toggle
- Alarm sound picker (device sounds + custom file)
- Play sound during push-ups (on/off)
- Permissions health check (shows status of all required permissions)
- Support email
- About app
- Privacy policy (placeholder link → real URL before launch)
- Reset app / clear data

---

### Paywall Screens

- Main paywall (end of onboarding) — see PRD for full copy
- Post-trial paywall (when trial expires) — see PRD for copy
- Downsell 1: discounted price + 15-min timer
- Downsell 2: 3-day trial extension

---

## UI References

- Duolingo — playful, fast, never feels like work
- Apple Fitness — clean stats display, satisfying ring animations
- Material Design M3 — component quality and layout rhythm
- Direction: minimalist, modern, futuristic (2040, not 2026), dark-primary with warm accent

---

## Color Palette

- **Dark mode:** primary (default), light mode also supported
- **Accent color:** warm orange / amber — energy, urgency, action, fits male 15–25 demo
- Exact hex TBD during build — start with something in the `#FF6B00`–`#FF9500` range

---

## App Tone / Voice

**Tough love.** Blunt. No excuses. But not cruel — there's belief underneath the bluntness.

Examples:
- "The snooze button is making you weak." (not "wake up better")
- "The old you would quit here." (not "keep going!")
- "No thanks, I'll miss out." (button copy on downsell decline — user has to say it out loud)

---

## Questionnaire — Full Copy

| Question | Options |
|---|---|
| "How bad is the snooze problem — really?" | "I wake up fine most days" / "I hit snooze once or twice" / "I hit snooze until I'm almost late" / "I've actually been late because of it" |
| "What does your body look like right now? Be honest." | "I never really work out" / "I work out here and there" / "I'm pretty consistent" |
| "Why did you really download this?" | "I just need to wake up on time" / "I want to get stronger" / "I need a complete reset — both" |
| "No ego. How many push-ups can you actually do right now?" | "5 or fewer" / "Around 10" / "15–20" / "More than 20" |
| "When do you need to wake up?" | [Time picker] |
| "What would make waking up worth it?" | Multi-select: "More time before my day starts" / "A stronger body" / "Actually hitting my goals" / "Feeling proud of myself" / "Just not being late anymore" |

**Post-Q1 reflection screen:** "You're not lazy. You're untrained. There's a difference — and it's fixable."

---

## Persona Logic

| Snooze severity | Fitness level | Persona |
|---|---|---|
| "Almost late" or "Actually late" | "Never" or "Here and there" | **The Sleeper** |
| "Once or twice" | "Here and there" or "Consistent" | **The Inconsistent** |
| "Fine most days" | Any | **The Optimizer** |
| Any | "Consistent" | **The Optimizer** |

*(Exact logic can be tuned during build — this is a starting point)*

---

## Key Copy — All Screens

All detailed copy lives in `updated-prd.md` under "Onboarding Flow — Full Sequence." Summary:

| Screen | Headline |
|---|---|
| Welcome | "The snooze button is making you weak." |
| Dream outcome | "In 30 days, you'll be a different person." |
| Commitment | "How committed are you to actually doing this?" |
| Price comparison | "Less than one coffee a week." |
| Main paywall | "Start Free. Stay Because It Works." |
| Post-trial paywall | "The old you would quit here." |
| Downsell 1 | "We don't want to lose you. Here's a deal we don't offer twice." |
| Downsell 2 | "Get 3 more days free. On us." |
| Decline copy | "No thanks, I'll miss out." |

---

## Default Rewards List

| Reward | Push-up cost |
|---|---|
| 30 min TV time | 50 |
| Dessert | 75 |
| Video game session | 100 |
| Restaurant meal | 150 |
| $5 to spend | 200 |

*(User can add, edit, delete any of these)*

---

## Badges / Achievements

| Badge | Trigger |
|---|---|
| First Win | First alarm dismissed with push-ups |
| 3-Day Streak | 3 consecutive alarm dismissals |
| 7-Day Streak | 7 consecutive |
| 30-Day Streak | 30 consecutive |
| Century | 100 total push-ups banked |
| 500 Club | 500 total |
| Thousand | 1,000 total |
| First Reward | First reward redeemed |

*(Grace day doesn't break streak — see PRD)*

---

## Alarm Sounds

- **Device sounds:** Android `RingtoneManager` — lets user pick from their device's ringtones
- **Custom file:** `READ_MEDIA_AUDIO` permission, file picker, user selects audio from storage
- Both options available on day 1
- Ship with no built-in sounds (device + custom covers it)

---

## Founder's Note — Placeholder

Render as a card with slightly off-white background, subtle paper texture, cursive font for body, and a cursive digital signature line.

```
Hey [Name],

I built PushRise because I was you.

Six alarms. Snoozed every single one. Then spent the rest
of the day feeling behind before it even started.

The problem wasn't my alarm. It was me.

I needed something that wouldn't let me off the hook.
So I built it.

Now I wake up every morning knowing I already won.

You can too.

— Syreese
```

[Placeholder: grey square avatar image until real photo is ready]

---

## Still Needed

- [ ] Real founder photo for Screen 2
- [ ] Exact hex for warm orange/amber accent — decide during build
- [ ] Persona logic edge cases (see table above — tune during build)
- [ ] Downsell timer behavior: fires once per user, does not reset on re-open
