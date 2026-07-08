# Camera Detection Learnings

Running log of what we've tried to improve push-up detection accuracy. Updated as experiments are run.

---

## What's working (current implementation)

| Component | Decision | Why |
|---|---|---|
| Library | ML Kit Pose Detection (bundled, `STREAM_MODE`) | Ships inside APK — no network needed, works in airplane mode. Frame processor approach crashed (Tasks.await() held reference to recycled Image). Snapshot-based approach is stable. |
| Capture | `takeSnapshot()` every 200ms, JPEG quality 60 | `processingRef` prevents concurrent calls, so effective rate is 200ms + ML Kit latency. Quality 60 is enough for landmark detection. |
| Landmarks | Shoulder/elbow/wrist angle, both arms averaged | Falls back to single arm if only one side visible. Averaging both reduces noise from asymmetric form. |
| Thresholds | DOWN < 125°, UP > 150° | Calibrated from real device: user's bottom range was 90–120°, top was ~176°. 25° gap between thresholds gives clean hysteresis. |
| Confidence filter | `inFrameLikelihood >= 0.5` in Kotlin before returning landmarks | Filters out landmarks ML Kit isn't confident about. Garbage-in prevention — blurry/occluded frames skip the angle calc entirely. |
| Debounce | 2 consecutive frames must agree before phase commits | Prevents a single noisy mid-rep frame from triggering a phantom count. Adds 400ms of lag maximum — acceptable at 1–2 sec/rep pace. |

---

## What didn't work

### SINGLE_IMAGE_MODE (reverted 2026-07-08)
**What it was:** Switched `PoseDetectorOptions.STREAM_MODE` → `SINGLE_IMAGE_MODE`, reasoning that since we're doing snapshots (not a live stream), single-image mode might be more accurate.

**What happened:** Detection got noticeably worse. User couldn't get 10/10.

**Why it failed:** STREAM_MODE isn't just for video — it uses temporal context from prior frames to predict where landmarks will be in the next frame. Even though we're taking snapshots, we're feeding sequential images of the same person. STREAM_MODE's motion prediction smooths landmark positions across frames; SINGLE_IMAGE_MODE treats each frame in isolation, so landmark positions are jitterier frame-to-frame.

**Verdict:** Keep STREAM_MODE for sequential snapshots. SINGLE_IMAGE_MODE is only better for truly unrelated single images (like a photo library scan).

---

### 3-frame angle rolling average (reverted 2026-07-08)
**What it was:** Maintained a rolling array of the last 3 angle readings and averaged them before threshold comparison.

**What happened:** Detection got worse — reps missed.

**Why it failed:** Added 400ms of smoothing lag on top of the 400ms debounce. Combined effective lag = 800ms before a rep could register. At normal push-up pace (1–2 sec/rep), this pushed the detection window too close to the end of each rep, causing misses. Also: ML Kit + STREAM_MODE already provides some temporal smoothing internally, so the extra averaging was double-smoothing.

**Verdict:** Don't add client-side angle smoothing. Trust ML Kit's internal temporal state.

---

### 600ms minimum rep interval (reverted 2026-07-08)
**What it was:** `Date.now()` check gating counted reps to no faster than 600ms apart.

**What happened:** Made things worse (alongside the other changes — hard to isolate).

**Why it was removed:** The 2-frame debounce already handles phantom double-counts. A 600ms gate adds failure cases (fast reps, missed count at high cadence) without adding much protection beyond what debounce already provides. Removed as redundant.

**Verdict:** Debounce is the right tool. Time-based gate is redundant.

---

### Stale Metro cache (debugging trap, 2026-07-08)
**What it was:** After reverting the bad JS changes and rebuilding, detection still felt wrong across multiple installs. Code was correct, APK was correct, but app behaved as if old code was still running.

**Root cause:** Metro was serving a cached bundle built from the bad files. `adb reverse tcp:8081 tcp:8081` points the phone to Metro, but Metro's in-memory bundle still had rolling average + min interval code from before the revert.

**Fix:** `npx react-native start --reset-cache`. Always run this after reverting JS changes.

---

## What to try next

These haven't been implemented yet. Ordered by estimated impact.

### 1. Hip-horizontal check
Add hip landmarks to the Kotlin return. In JS, verify that hip Y ≈ shoulder Y (within some tolerance) before accepting an angle reading. This would filter out false positives from arm movements while standing or sitting. Requires Kotlin change (add `leftHipPosition`, `rightHipPosition` to result) + JS threshold logic.

### 2. "Move phone closer" / tracking lost UI
Count consecutive frames where no landmarks above confidence threshold are returned. After ~1 second (5 frames at 200ms), show a hint: "Move phone closer or improve lighting." Already scaffolded once (reverted with the bad batch) — reintroduce it cleanly, separated from the other changes.

### 3. Confidence threshold tuning
Current threshold is 0.5. Could experiment with 0.6 or 0.65 for stricter filtering. Risk: in low light, this might reject too many frames and cause tracking-lost false positives. Test in a dim room before raising it.

### 4. Adaptive thresholds (long-term)
First 5 reps of a session could be a calibration phase — record the user's actual top and bottom angles and set thresholds dynamically. Eliminates the need for manual threshold calibration and would handle different body types and phone placements. Significant UX change, probably post-MVP.
