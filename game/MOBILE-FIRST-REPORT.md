# Mobile-first finish — report

Scope: game code only (`game/index.html`, `game/style.css`, `game/game.js`,
`game/view.js`, `game/CONTROLS.md`, `tests/mobile.test.js`, this report).
No sim rules, stats, balance, pathfinding, damage, economy numbers, or AI
behaviour were changed — this is a mobile UI/controls finish. Sprites,
tiles-overlay, animation art, and `~/workspace/scrap-dungeon/` were not
touched. Nothing was committed, pushed, published, or packaged as an APK
(APK is a separate step on the user's word, not part of this finish).

## 1. Layout decisions

- Shell is a flex column filling `100dvh`: compact top bar, stage (canvas)
  taking the remaining height, command tray at the bottom. The canvas
  backing size is set from the stage element in `game.js` `resize()`, not
  from a hardcoded window-height-minus-96, and re-set whenever the tray
  expands/collapses and on page load.
- **Command tray pattern (the one pattern, documented):** the order row
  is always visible; **More commands** expands/collapses a second row
  (groups, map, zoom, paths, minimap). On phone width (≤ 640 px) the tray
  starts collapsed; on desktop it starts expanded; the toggle is always
  visible, so nothing is hidden without an affordance.
- **Touch targets:** every button ≥ 44 px tall (measured, see §4);
  group number buttons 44 × 44 px; settings checkboxes 22 px.
- **Top bar on phone:** title shortens to "Surface Wars", the sprite
  note hides (it lives in How to Play), and the status bar condenses to
  `Scrap | Blue | Red | Tick | Zoom` (+ `(Queue)` when Queue mode is
  on). Full status line stays on desktop.
- **Minimap on phone:** 132 × 83 px, tap to centre, drag to pan,
  **Minimap** button (tray, or Settings) hides/shows it, default visible.
- **Panels:** info/build panels scroll within the viewport (max 46 vh)
  and each has a visible **Close panel** button (deselects everything,
  which also closes the build panel). Overlays scroll within 92 dvh and
  have Back/Resume buttons. Panels sit over the lower map, so a map
  point under an open panel cannot be tapped until the panel is closed
  (Close panel, or Stop / Deselect) — documented flow, not a bug.
- **Help text** above the tray is hidden on phone; the full text lives
  in the How to Play panel, which gained a Mobile layout section.

## 2. Touch equivalents (no silent keyboard-only controls)

| Keyboard / gesture | Touch / on-screen equivalent |
|---|---|
| `Shift+tap` (queue) | **Queue button** — stays ON until tapped again, so several waypoints can be queued in a row; same sim append logic (`View.queueAppend`, unit-tested); status shows `(Queue)` |
| `Esc`, `Space` | Pause / Menu button, Menu button, Back/Resume buttons |
| `Ctrl+1..9` / `1..9` | Assign Group toggle + number buttons 1–9 |
| `+`/`=`, `-`, `0`, `F`, `P` | Zoom +, Zoom −, Zoom 1×, Zoom to Selection, Paths buttons |
| Wheel (zoom to cursor) | Desktop-only by nature; verified working at desktop viewport in this run (1.00 → 1.15 → 1.32). Pinch on touch; Zoom buttons on screen |
| Pinch | Touch-only by nature; two-pointer handler unchanged from Prototype 03 — see §5, it could not be driven in this emulation |
| Tap, drag pan, double-tap type select, minimap drag, group buttons, add-to-selection | Unchanged and re-verified at phone size in §4 |

## 3. Bugs found by verification and fixed in this pass

1. **Stale canvas size (real bug).** Collapsing the tray on phone grew
   the stage, but the canvas backing size was set once at init, so the
   map stretched vertically (backing 377 px vs displayed 461 px) and tap
   coordinates no longer matched what was drawn. Fixed: `resize()` runs
   after tray toggle, after the phone initial collapse, and on load;
   canvas now always equals stage (390 × 461 collapsed, 390 × 358
   expanded at 390 px wide).
2. **Tap fall-through into panels (real bug).** A tap that opens a
   panel could trigger a button inside it: the browser's
   mouse-compatibility click for the same tap lands after the panel
   renders under the tap point. In emulation this queued a Vespid Scout
   nobody ordered. Fixed: panel buttons ignore clicks within 350 ms of
   a canvas tap or of the panel first appearing. The final run shows
   an empty queue at panel open and a Scout Buggy queued only by its
   own tap (scrap 500 → 420).
3. **Script-side (not game) traps, documented so they are not mistaken
   for game bugs:** the west Command Core sits exactly at the first
   tap-scan point (tile 6,25 → canvas 192,352), so a scan tap selects
   the core, not a unit — the final run uses Select All instead; and
   the multi-select info panel covers the lower map, so the core tap
   must follow a Stop / Deselect (or Close panel) first.

## 4. Mobile emulation verification (NOT a real S25 playtest)

Headless Chromium, 390 × 844 viewport, touch events, device scale 2,
driven with real taps (Playwright touchscreen + locator taps), served
locally from this folder. All screenshots below were viewed by me.

- **Overflow:** none — `scrollWidth == clientWidth == 390` on menu and
  in-game screens.
- **Smallest button:** 44 px tall, 0 buttons below 44 px, 14 visible
  command buttons in the collapsed tray (13 order-row buttons + More).
- **Flow driven:** main menu → Play First Map → Select All → Queue mode
  ON → tap-order a move (formation paths with destination rings drawn)
  → Zoom + button (Zoom 1.00 → 1.25) → Zoom 1× → close panel → tap core
  → build panel → tap Scout Buggy (scrap 500 → 420, queue shows it) →
  Pause menu → Resume → tray expand → Minimap toggle off.
- **Sim/render at phone viewport:** game runs, map renders fully,
  canvas equals stage in both tray states, battle progresses
  (units/wrecks change over the run). No phone FPS is claimed — these
  are sandbox numbers only.

Screenshots (390 px, viewed): [mobile-main-menu.png](mobile-main-menu.png),
[mobile-ingame.png](mobile-ingame.png),
[mobile-path.png](mobile-path.png) (10 selected, formation paths),
[mobile-zoom.png](mobile-zoom.png),
[mobile-build.png](mobile-build.png) (queue empty at open, Close panel,
Set Rally, producible list),
[mobile-queue.png](mobile-queue.png) (Scout Buggy queued),
[mobile-pause.png](mobile-pause.png).

## 5. Honest gaps

- **Pinch not finger-tested.** In this mobile emulation, neither
  Playwright mouse-wheel nor a CDP `synthesizePinchGesture` moved the
  zoom (stayed 1.25), while the same wheel handler at desktop viewport
  moved it 1.00 → 1.15 → 1.32 — so the gap is the emulation's gesture
  dispatch, not the handler, but pinch remains unverified until a real
  finger (or a real S25) tries it. Zoom buttons are the verified phone
  zoom route.
- **No real S25 playtest, no APK in this pass.** Emulation is the
  closest the sandbox gets; APK packaging is a separate authorized
  step and was not done here.
- **No dead buttons:** all 55 button/checkbox ids in `index.html` are
  accounted for — every command button has a `bindBtn` handler (group
  numbers bind via the 1–9 loop), settings checkboxes have change
  handlers, and panel-generated buttons (info-salvage, info-close,
  build-close, rally, build, cancel) all have handlers.
- **Tests:** `node --test tests/*.test.js` → **83/83 pass** (80 old +
  3 new in `tests/mobile.test.js`: queue-append truth table, layout
  constants, zoom/path regression). No UI test fakes pixels — pixel
  checks are the emulation measurements above.

## 6. FINISH note — finished vs remaining

**Finished in this pass:** mobile-first layout at 390 px (compact top
bar, collapsible command tray, 44 px targets, scrollable/dismissible
panels, usable minimap, condensed phone status), touch equivalents for
every control (Queue button chief among them), the canvas-resize and
panel fall-through fixes, mobile emulation verification with phone-size
screenshots, CONTROLS.md + in-game help updated to match, no dead
buttons, 83/83 tests.

**Still remaining (later phases, not this pass):** fog of war,
research/tech tree, campaign, multiplayer, structure placement,
Power/Components/Supplies layers, Salvage Clans + Directorate factions,
transport, repair, difficulty tiers, a real red combat AI (combat is
still the demo attack-move script), a real S25 playtest, and an APK.

## Changed files

- `game/index.html` — grouped command tray + More toggle, Queue and
  Minimap buttons, short title, updated help, How to Play mobile section
- `game/style.css` — mobile-first flex shell, 44 px buttons, phone
  media queries, scrollable panels/overlays
- `game/game.js` — queue mode + `View.queueAppend`, stage-based resize
  (+ tray/load re-resize), condensed phone status, panel close buttons,
  Minimap toggle, 350 ms panel fall-through guard
- `game/view.js` — `queueAppend`, `MOBILE_BREAKPOINT` (640),
  `MIN_TOUCH_TARGET` (44), exported for tests
- `game/CONTROLS.md` — mobile-first layout, keyboard→button table,
  Queue mode, fall-through guard, updated known limits
- `tests/mobile.test.js` — 3 new tests
- `game/mobile-*.png` — phone-size verification screenshots
