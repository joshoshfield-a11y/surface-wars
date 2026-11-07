# Surface Wars — Graphics Upgrade + Zoom + Controls + Path Drawing Report

Date: 2026-10-30. Scope: `game/` only, plus a canopy retint under
`assets/animation/canopy/` (originals backed up in
`assets/animation/canopy/original-backup/`). **`game/sim.js` was not
edited — no sim rules, stats, balance, pathfinding, damage, or demo
opponent changed** (sim.js mtime still the 05:12 PDT prototype build).
`assets/sprites/`, `assets/sprites-90/`, `assets/tiles-overlay/` bases,
and `~/workspace/scrap-dungeon/` were not touched. Nothing was
committed, pushed, published, or packaged as an APK.

## 1. Graphics upgrade (render-layer only)

New file: `game/view.js` (pure zoom/path math, Node-exportable).
Changed: `game/render.js`, `game/game.js`, `game/index.html`
(buttons + help text), new `game/CONTROLS.md`.

- **Canopy fix:** all 6 canopy tiles retinted darker and less
  saturated (mean green 134 → 96, mean red 61 → 55) with alpha edges
  softened (Gaussian blur 1.2 on the alpha channel only). In render,
  canopy also blends at far zoom (alpha 0.78 below 0.6×, 0.88 below
  0.8×). Result in `zoom-05.png`: clusters read as dark forest, not
  neon grid, and forest never reverts to bare dark ground.
- **Crisp scaling:** `imageSmoothingEnabled = zoom < 1` (off at high
  zoom for sharp pixel art, on with high quality at low zoom to avoid
  shimmering). Visible in `zoom-2.png`: sprites stay sharp, not blurry.
- **Scale-aware UI:** HP bars 3–6 px by zoom (was fixed 4 px),
  selection rings 2–4 px (was fixed 2 px), path lines 1.5–3 px minimum
  — all readable from 0.4× to 3×.
- **Drop shadows:** soft drawn ellipses (offset 2–3 px, alpha 0.25,
  no shadowBlur cost) under every unit and structure.
- **Terrain edge shading:** where a tile's east or south neighbour is
  a different terrain type, a soft dark edge (alpha 0.18) marks the
  boundary — drawn, never baked into tiles.
- **Far-zoom simplification:** below 0.6× zoom, dust FX, damage smoke,
  and the smallest units' HP bars are hidden. Selection rings, team
  colours, paths, and destination markers are never hidden.
- Strict 90° top-down kept; team colours unchanged; no new sim state.

## 2. Zoom functions

- **Smooth zoom:** every zoom change animates to its target over
  ~150–250 ms (lerp factor dt×10 in the frame loop), interruptible by
  any new zoom, pan, or minimap click. Zoom is render-time, so it
  animates even while paused.
- **Zoom to cursor / midpoint:** wheel zooms to the cursor, pinch
  zooms to the pinch midpoint — the anchored world point stays under
  the same screen offset throughout the animation (pure function
  `SWView.zoomToCursor`, tested).
- **Presets/buttons/keys:** buttons Zoom 0.5× / 1× / 2×, Zoom + / −,
  Zoom to Selection; keys `+`/`=` in, `-` out, `0` reset to 1×,
  `F` zoom to selection, `P` toggle paths, Space pause (unchanged).
  Presets and keys anchor on the viewport centre.
- **Zoom to selection:** `SWView.frameSelection` picks the smallest
  in-range zoom that fits the selection bounds with 2-tile padding,
  centred; the camera lerps to it. A single unit frames at the 3× cap
  (see `zoom-selection.png`: unit centred, status `Zoom: 3.00`).
- **Limits:** 0.4×–3× enforced on every route (wheel, pinch, buttons,
  keys, framing). Status-bar zoom readout shows the live animated
  zoom. Minimap viewport rectangle tracks pan and zoom (visible in
  `zoom-2.png`: small rect over the bridge area actually in view).
- **Touch ambiguity fixes:** tap = pointer moving ≤ 8 px (select/order,
  never pans); drag = > 8 px (mouse = selection rectangle, touch =
  pan — touch has no drag-select by design, so a drag can never also
  fire a selection rectangle). After a pinch ends, the remaining
  finger is re-anchored so its next move does not jump the camera.
  Also cleaned: the old drag-select code carried a dead recomputation
  (`void a`) — removed, behaviour unchanged.

## 3. Control logic — written out

`game/CONTROLS.md` is the authoritative control document, and the
in-game help text in `index.html` was rewritten to match it exactly
(same buttons, keys, thresholds, and limits). It covers: camera (pan,
zoom, presets, zoom-to-selection, minimap), selection (tap, mouse
drag-select, Select All, deselect), orders (Move / Attack-Move / Hold
/ Stop, with the shipped Hold-mode tap fallback documented as
behaviour, not a bug), path drawing, touch vs mouse vs keyboard
tables, the First Map layout, rendering notes, and known limits.

NOT IMPLEMENTED (marked as such in the doc, not faked): queued
orders, unit groups (Ctrl+number), rally/patrol/guard, formation
movement, double-tap select-all-of-type, multi-select by tap on
touch, structure selection, wreck selection/salvage, mouse-drag pan.

## 4. Unit path drawing (display only)

- For every SELECTED alive unit with a non-empty `unit.path`, render
  draws its remaining path from `SWView.pathPolyline`: unit centre →
  each waypoint tile centre → destination, as a team-coloured dashed
  line, with turn dots where direction changes and a destination ring
  + dot at the final waypoint. Drawn under units, over terrain.
- Paths come from the sim's existing `unit.path` — render.js runs no
  pathfinder, so a drawn path always matches the route the unit will
  take, including bridge routing (see `path-bridge.png`: one blue
  dashed line from the selected west unit, straight across the bridge
  deck, to the destination ring at (60,25)).
- Paths shorten as waypoints are consumed, and vanish on stop, death,
  or deselection. Unselected units draw NO path, ever. Several
  selected units each draw their own path — never merged.
- Order flash: for 1.5 sim seconds after an order, selected paths draw
  thicker (×1.6) and fully opaque.
- Toggle: "Paths: On/Off" button or `P`, default On. `path-off.png`
  proves it: same selection, button reading "Paths: Off", no line.
- Bug found by a test and fixed in this pass: `pathTurns` compared
  raw step lengths, so a longer straight step counted as a turn. It
  now compares direction signs only (A* paths are axis-aligned, so
  this is exact).

## Tests — 46/46 pass

Run as (explicit file list; `node --test tests/` directory form fails
on this Node version, a runner invocation issue, not a code failure):

```
node --test tests/sim.test.js tests/catalog.test.js tests/sprites.test.js \
             tests/animation.test.js tests/firstmap.test.js tests/view.test.js
```

- Old 39 tests still pass untouched.
- New `tests/view.test.js` (7): zoom clamp + presets in range;
  zoom-to-cursor anchor invariant (world point stays under the same
  screen offset); clampCamera (on-map, and parks at 0 when view >
  map); zoom-to-selection framing (fits padded bounds, centred, in
  limits); path polyline (centre + waypoint centres, destination
  last, turn dots only at corners); empty/unselected/missing → no
  path; straight path → no turn dots.

## Proof — screenshots (headless Chromium via Playwright, local server)

All viewed and checked against predicted landmarks, not just eyeballed:

- `zoom-05.png` — full First Map at 0.5×, status `Zoom: 0.50`,
  retinted canopy, full-map minimap rect, track/road/ford visible.
- `zoom-1.png` — 1× view.
- `zoom-2.png` — 2× bridge battle: crisp sprites, drop shadows,
  readable HP bars, minimap rect over the bridge area in view.
- `zoom-2-westbase.png` — 2× west base after reset.
- `path-bridge.png` — selected unit (Selected: 1) with its blue
  dashed path across the bridge to the destination ring at (60,25).
- `path-off.png` — same selection with paths toggled off: no line.
- `zoom-selection.png` — `F` framing: selected unit centred at
  3.00×, selection ring crisp.

One capture failure was caught and fixed during the run: the first
bridge-path screenshot clicked a destination at x=1920 px, outside
the 1280 px viewport, so no order was issued and no path appeared.
Re-captured at 0.5× (whole map in view) with in-viewport clicks, and
the path verified as above. The failed shot was overwritten, not kept.

## Honest gaps

- No phone playtest yet — screenshots are desktop-viewport headless
  captures; pinch behaviour is code-reviewed, not finger-tested.
- Grass base tiles still show mirror symmetry at high zoom (tile-art
  property, unchanged by this pass).
- Bob animation is still ~1 px at zoom 1; muzzle flashes,
  projectiles, dust, and wrecks remain the most legible motion.
- Zoom-to-selection for a single unit hits the 3× cap and shows a
  small area — correct per the framing rule, but it is a close crop,
  not a battlefield overview.
- Minimap is click-to-centre only; minimap drag is NOT IMPLEMENTED.
- `sim.js` untouched-ness rests on mtime + edit history, not a git
  diff: no git repo exists in `~/workspace/surface-wars/`.
