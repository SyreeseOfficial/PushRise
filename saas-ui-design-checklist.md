# SaaS UI & Design Checklist

Reference notes for improving PushRise's UI/UX. Not project-specific yet — use as a checklist when reviewing screens.

## Core Philosophy
- Goal: guide users down the path to getting results, don't try to excite them with complex design.
- Problem: 88% of users abandon apps and don't pay after one poor experience. AI tools generate repetitive "vibe-coded slop" — default colors, icons, layouts.
- Rule: users aren't tourists wandering an interface, they only care about getting a job done. Hold their hand, reduce visual noise.

## 1. Fix AI Defaults (quickest fixes)
- **Kill emojis** as decorations or icons. Use a real, consistent icon package (Lucide, Phosphor, Feather) so sizing/shapes/colors stay uniform.
- **Control colors**
  - Avoid AI defaults (saturated blues/purples with clashing accents).
  - Use a restrained base, muted palette (Stripe, Attio style), grayscale/white space to build trust.
  - Reserve color *only* for data that matters (charts, statuses, scores, key actions) — not random buttons or decoration.
- **Fix layouts & repetition**
  - No duplicate KPI cards across different pages.
  - Every page answers one single question / serves one specific intent.
- **Compress cards**
  - Reduce dense, repeated components.
  - Collapse rows of buttons into a triple-dot menu.
  - Turn text chips into icons, push important metrics to the right.

## 2. Universal Design Principles
- **Less is more** — keep removing elements until nothing else can be taken away while the user can still complete the task.
- **Strict consistency**
  - Never use different verbs for the same action across screens (pick "Delete", not remove/delete/trash mixed).
  - Uniform font sizes, weights, button radii, spacing.
  - Give the AI a strict markdown style guide defining exact design rules.
- **Establish hierarchy** — treat every screen like a sentence with a clear subject; use size/weight/color/spacing so users don't have to read everything to find what they need.
- **Start with intent** — never design based on available white space. Ask what the user arrived to do, only add functionality when actual intent expands.
- **Design for ugly data** — don't rely on tidy demo data. Test with real, messy data: truncate long strings (e.g. ellipsis after 15 chars), proactively design empty states, loading states, error messages.

## 3. Onboarding, Speed & Feedback
- **Speed as an aesthetic**
  - A 1-second delay costs 7% of conversions. Show immediate visual response (spinner, skeleton bars) instead of a blank screen.
  - Skeleton loaders, progress bars for actions over 1s, playful animation for longer jobs (e.g. Posthog's hedgehog).
- **Progressive & gamified onboarding**
  - Celebrate milestones (confetti, success emails on first connected account).
  - Show value in numbers right away (scoreboard: hours saved, tasks automated, leads found, revenue generated).
  - Avoid forced tours — use progressive onboarding where steps unlock sequentially.

## 4. Friction, Safety & Motion
- **Ethical friction (Zeigarnik effect)**
  - Never let destructive actions (delete, expensive changes) happen instantly without confirmation — users need certainty and a clear completion state (tick, thumbs-up).
  - Require typing the exact item name for dangerous actions (databases, servers). Give a 5-second undo window on deletes.
- **Purposeful motion**
  - No random animations, scroll-jacking, parallax.
  - Motion only for skeleton loaders, completion states, or when it directly informs the user.
  - "Load More" buttons instead of infinite scroll — keeps user control and footer access.

## 5. Landing Pages & Conversion
- **Structure & layout**
  - Kill alternating layouts (text-left/image-right repeating down the page).
  - Stack the hero, let it breathe, replace stock photos with actual product screenshots.
  - Keep CTA phrasing identical everywhere (e.g. always "Start for free").
- **Advanced polish**
  - Zoom in: crop into the specific part that proves the point instead of showing the whole dashboard.
  - Bento grids instead of rows of identical cards — size content appropriately.
  - Trust builders: small badges, customer logo rows, mega menus.
  - Outcome-focused copy: shift from features ("collect and analyze data quickly") to outcomes ("turn your data into decisions").
- **Shortcut**: build a folder of reference screenshots (Dribbble, Mobbin) and feed them to AI tools (Cursor, Lovable, Bolt) with instructions to replicate the style.

## Action Items for PushRise
- [ ] Audit current screens for emoji-as-icon usage, swap to a consistent icon set.
- [ ] Review color usage — is color reserved for meaningful data/status only?
- [ ] Check for duplicate KPI/stat cards across pages.
- [ ] Verify destructive actions (delete workout, delete account, etc.) have confirmation + undo.
- [ ] Test key screens with messy/real data, not clean demo data.
- [ ] Review loading states — do slow actions show skeletons/progress instead of blank screens?
