# Landscape-first — report

Scope: game code only (`game/index.html`, `game/style.css`,
`game/game.js`, `game/view.js`, `game/CONTROLS.md`,
`tests/landscape.test.js`, this report, `game/land-*.png`).
No sim rules, stats, balance, pathfinding, damage, economy numbers,
or AI behaviour were changed — this is a layout pass. Sprites,
tiles-overlay, animation art, and `~/workspace/scrap-dungeon/` were
not touched. Nothing was committed, pushed, published, or packaged
as an APK (APK is a separate step on the user's word — see §5).

## 1. Layout decisions

The shell is now `topbar` + `#layout`, where `#layout` wraps the
stage and a new `#side` div holding the banner, tutorial bar, and
command tray (previously those three were direct children of `body`
in a column). That one DOM change is what makes the landscape row
possible without duplicating the command markup:

- **Portrait (unchanged):** `#layout` is a column — stage on top,
  command tray at the bottom, tray starts collapsed at phone width,
  More commands toggle visible. Every portrait screenshot and flow
  from the mobile-first finish still applies.
- **Landscape (new, primary):** `#layout` is a row — stage flexes on
  the left, `#side` is a fixed 300 px scrollable panel on the right.
  The order row sits at the top of the side panel and is always
  visible; the More commands button is hidden in landscape and the
  extra row (Groups 1–9 + Assign, Reset Map, First/Test Map, Zoom
  presets and +/−, Zoom to Selection, Paths, Minimap) is forced
  visible by a higher-specificity CSS rule
  (`#side #commands:not(.expanded) .cmd-extra`), so a collapsed tray
  can never hide it in landscape. Buttons stay ≥ 44 px tall (the
  global rule is unchanged); the side panel scrolls as a whole, so
  buttons below the fold are reachable, never cut off.
- **Top bar in landscape:** compact — the sprite note is hidden
  (it lives in How to Play) and the bar font drops to 12 px. This
  recovered ~27 px of stage height at 844×390 (stage 284 px → 311 px
  in the verification runs) instead of losing a third of the short
  landscape height to a wrapped top bar.
- **Minimap in landscape:** 192 × 120 px (from 132 × 83 px in
  portrait), still tap-to-centre and drag-to-pan, top-right of the
  stage as before.
- **Panels in landscape:** info/build panels keep their max-width
  (340 px in landscape) and scroll within the viewport (max 64 vh in
  landscape, ~250 px at 390 px height — inside the ~311 px stage),
  each with a visible Close panel button. Overlays (menus, settings,
  How to Play, victory, tutorial-end) scroll within 92 dvh and have
  Back/Resume buttons. The tutorial banner lives at the top of the
  side panel in landscape, so the step text and Skip/Next are beside
  the map, not stacked on top of it.
- **Rotate hint (portrait only):** a pill at the top-left of the
  stage, clear of the top-right minimap: "Rotate for the full
  battlefield view" + "Continue in portrait". Non-blocking by
  construction — the pill has `pointer-events: none` and only its
  dismiss button takes pointer events, so it can never block a map
  tap. Dismissal is stored in `sessionStorage`
  (`sw-rotate-dismissed`, try/catch-guarded for file:// contexts
  where storage may throw) and the pill never reappears after
  dismissal in that session. It is hidden by CSS in landscape
  (`@media (orientation: portrait)` gates its display), never gates
  playing in portrait, never blanks the screen, and never forces
  rotation. No Screen Orientation API lock is attempted in the web
  build: it cannot lock reliably outside fullscreen/installed
  contexts.

## 2. Canvas resize and the stale-canvas bug (not regressed)

`resize()` still sets the canvas backing size from the stage
element, and still runs on window resize, tray toggle, and page
load. New in this pass: an `orientationchange` listener that
re-runs `resize()` after an 80 ms delay, because that event can
fire before viewport dimensions settle on phones, and syncs the
tray class on orientation change only — landscape forces the tray
expanded, phone-width portrait restores it collapsed — followed by
`syncCmdMore()` and another `resize()`. The tray class is
deliberately NOT synced inside `resize()`: collapsing the tray in
landscape calls `resize()`, and syncing there would immediately
re-expand it. The mobile-first stale-canvas bug (backing size not
following the stage, map stretched, taps misaligned) was re-proven
absent in §4: canvas backing == stage size in every orientation
step, including a portrait → landscape → portrait round trip on
the same page.

## 3. Pure layout helpers (tested, not pixel-faked)

`view.js` gained `isLandscape(w, h)` (strictly width > height; a
square viewport counts as portrait, the safe bottom-tray fallback)
and `layoutFor(w, h)`, which returns the contract the CSS
implements: landscape → `{ orientation: 'landscape', trayMode:
'side', trayForcedExpanded: true, rotateHint: false, minimap:
{ w: 192, h: 120 } }`; portrait → `{ orientation: 'portrait',
trayMode: 'bottom', trayForcedExpanded: false, rotateHint: true,
minimap: { w: 132, h: 83 } }`. Pixel checks are the emulation
measurements in §4, not unit tests.

## 4. Verification (headless Chromium, NOT a real S25 playtest)

Headless Chromium, touch viewport, device scale 1, served locally
from `~/workspace/surface-wars`, driven with real taps/clicks.
All screenshots below were viewed by the builder.

- **Tests: 93/93 pass** (`node --test tests/*.test.js`, explicit
  file list): 88 pre-existing untouched + 5 new in
  `tests/landscape.test.js` (landscape detection, square-as-
  portrait, both `layoutFor` contracts, larger-landscape contract).
- **Landscape 844×390, in game:** stage 544 × 311 px, canvas
  backing exactly 544 × 311, side panel 300 px wide, More button
  hidden (`display: none`), group button 1 visible, minimap
  192 × 120, rotate hint hidden, horizontal overflow 0.
  [land-ingame.png](land-ingame.png) — side panel with the order
  row on top, wide map, minimap top-right.
- **Landscape 932×430, in game:** stage 632 × 370 px, canvas
  backing exactly 632 × 370, side panel 300 px, status fits one
  line. [land-ingame-932.png](land-ingame-932.png).
- **Build panel in landscape:** core tapped at 0.5× zoom (info
  panel confirms "Command Core (iron_eden), HP 800/800, Fortified");
  the production panel (Close panel, Set Rally, "Queue is empty")
  fits the landscape height and scrolls within the viewport.
  [land-build.png](land-build.png). Note, honestly: at 1× zoom the
  core sits below the initial landscape view, so the panel was
  captured at 0.5× — that is a camera-starting-position fact, not a
  landscape-panel failure; the panel itself fits and scrolls.
- **Tutorial step 3 in landscape:** entered the tutorial, pressed
  Next past step 1, then tapped the pulsing-ring unit for real —
  banner advanced to "Tutorial 3 of 7 — Move" with the ring on the
  ground point, Skip/Next beside the banner text, order row below,
  collapsed info panel with Close. The banner fits the landscape
  height inside the side panel.
  [land-tut-step3.png](land-tut-step3.png).
- **Portrait 390×844, rotate hint:** pill visible top-left
  ("Rotate for the full battlefield view" + "Continue in
  portrait"), clear of the minimap, bottom tray intact, game
  playable behind it. [land-portrait-hint.png](land-portrait-hint.png).
  After tapping "Continue in portrait" the pill is gone
  (`display: none`) and Select All still works (status: Blue 10,
  mode Move). [land-portrait-after-dismiss.png](land-portrait-after-dismiss.png).
- **Orientation-change sequence, same page:** portrait
  (390×495 stage, canvas matches) → landscape (544×284 stage,
  canvas matches) → portrait again (390×495, canvas matches).
  No stretching, no tap misalignment by construction (backing ==
  displayed size at every step). The 284 px landscape stage in this
  run predates the top-bar tightening in §1; after it, the same
  landscape stage measured 311 px. Viewport resizes drive the
  shell `resize()`; the `orientationchange` handler was additionally
  dispatched in the run, since Playwright viewport changes do not
  themselves fire that event.

## 5. APK manifest note (for the future rebuild — NOT done here)

The installed app can actually lock to landscape, which the web
build cannot. For the next APK rebuild, change exactly one thing in
`~/workspace/surface-wars/apk/AndroidManifest.xml`: add
`android:screenOrientation="landscape"` to the existing activity
element, which already carries
`android:configChanges="orientation|screenSize|keyboardHidden"`
(verified in the current manifest — keep that attribute as-is; it
is the correct companion to the lock). The resulting element
should read:

```xml
<activity android:name=".MainActivity" android:exported="true"
    android:screenOrientation="landscape"
    android:configChanges="orientation|screenSize|keyboardHidden">
```

Do not add a second activity, do not change the package, version,
or signing for this note alone, and do not claim the lock until an
APK built with it is verified by dumping its packaged manifest
(`aapt2 dump xmltree`) and installing it. The APK rebuild itself
is a separate step on the user's word and was not done in this
pass.

## 6. Honest gaps

- **Pinch still never finger-tested** (standing limit from every
  prior pass; Zoom buttons are the verified zoom route).
- **No real S25 playtest of landscape** — all screenshots are
  headless Chromium at phone size; real-finger drag-pan and the
  side-panel scroll feel on a real phone are unverified until the
  user installs the landscape APK and reports back.
- **Desktop layout changed too:** desktop is landscape, so it now
  gets the side panel instead of the bottom tray. That is the
  intended consequence of "landscape first", not a regression —
  but a desktop player used to the bottom tray will notice it.
- **Side panel scroll:** at 844×390 the full command list does not
  fit without scrolling the side panel (that is by design — the
  panel scrolls), so groups/zoom buttons below the fold need one
  scroll in landscape. The order row itself is always visible at
  the top and never needs scrolling.
- **Top bar still wraps to two lines at 844 px wide** (title +
  full status line); it is compact (no sprite note), but a
  single-line bar would need the condensed phone status at this
  width too, which was not done — the stage height gained (311 px)
  was judged enough.

## Changed files

- `game/index.html` — `#layout` wrapper + `#side` div (banner,
  tutorial bar, commands moved inside, no command markup
  duplicated), rotate-hint pill in the stage, landscape-first
  wording in the in-game help and the How to Play Camera section
- `game/style.css` — `#layout`/`#side` flex shell, landscape
  media query (row, 300 px side panel, forced extra row, hidden
  More button, 192×120 minimap, 64 vh panels, compact top bar),
  portrait-only rotate-hint styles (pointer-events none except
  the dismiss button)
- `game/game.js` — `orientationchange` handler (delayed resize +
  tray sync, never inside `resize()`), rotate-hint session
  dismissal (sessionStorage, guarded)
- `game/view.js` — `isLandscape`, `layoutFor`, exported via
  `SWView`
- `game/CONTROLS.md` — new Landscape-first layout section,
  portrait-fallback + hint rules, resize/orientation-change rules
- `tests/landscape.test.js` — 5 new tests
- `game/land-*.png` — verification screenshots listed in §4
