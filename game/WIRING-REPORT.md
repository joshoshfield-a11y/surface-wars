# Wiring Report — Sprites + Overlay Tiles into Prototype 01

Working tree only, in `game/` only. `sprites-90/`, `mechs-expansion/`,
`tiles-overlay/` were read, never edited. `sim.js` was not touched: no sim
rules, stats, balance, movement, pathfinding, damage, or demo-opponent
change. Nothing committed, pushed, published, or packaged as an APK.

## What changed

- `game/sprites.js` (new) — mapping tables + browser image loader.
  Paths are relative to `game/index.html` (`../assets/...`).
  Images load on demand and are cached; any image not yet loaded or
  failed falls back to the old canvas placeholder, so the game never
  goes blank. Priority set (scenario units, command_core, all terrain
  bases, bridge/track/road overlays) is preloaded on script load; all
  other catalog sprites load on first demand.
- `game/render.js` — terrain, structures, and units now draw real
  sprites; minimap unchanged (flat colours, readable and cheap).
- `game/index.html` — loads `sprites.js` before `render.js`; topbar
  note updated from "placeholder only" to wired art + fallback.
- `tests/sprites.test.js` (new) — mapping test (see below).

## Team mapping (confirmed from game.js + catalog factions)

Player faction is Iron Eden; demo opponent is Xandria. Confirmed, not
swapped: **iron_eden -> blue sprite (no suffix), xandria -> red sprite
(`-red`)**. Catalog colours agree: iron_eden `#3a86ff`, xandria `#e63946`.

## Unit mapping

`assets/sprites-90/units/<catalog-unit-id>[-red]-512.png`, all 49
catalog units, blue and red. Draw size = `2 * unit.radius * TILE * zoom`
(radius is the catalog `size`, 0.3–1.2 tiles), centred on the entity,
rotated to body facing + 90° (sprite barrels point straight up in the
file, so this points them along facing, exactly as the old placeholder
hull did). The turret is part of the sprite, so no separate barrel is
drawn over it anymore. Scenario units in the test map: scout_buggy,
medium_tank, heavy_tank, bulwark_mech, lancer_mech, longshot_mech,
flak_tank — all 7 verified loading in the screenshot.

## Structure mapping

`assets/sprites-90/structures/<structure-id>[-red]-512.png`, all 23
catalog structures, blue and red. Draw size = footprint in tiles
(`2 * radius`, radius = footprint/2), unrotated. Scenario structure:
command_core (footprint 2, 64 px at zoom 1) — blue west, red east,
both visible in the screenshot.

## Terrain mapping (sim id -> tiles-overlay base)

| Sim id | Sim name | Base file | Notes |
|---|---|---|---|
| 0 | GRASS | `base/grass_v{1,2,3}-512.png` | west open ground |
| 1 | DIRT | `base/dirt_v{1,2,3}-512.png` | east broken ground |
| 2 | BRIDGE | `base/water_plain_v{1,2,3}-512.png` + bridge_deck overlay | bridge sits over water |
| 3 | FOREST | `base/forest_floor_v{1,2,3}-512.png` | own base; see gap below |
| 4 | WATER | `base/water_plain_v{1,2,3}-512.png` | river |
| 5 | ROCK | `base/rocky_ground_v{1,2,3}-512.png` | cliffs / LOS blockers |

Base variant per tile: `(x * 7 + y * 13) % 3 + 1` from TILING-SPEC.md,
so large areas do not repeat identically.

## Overlays (cosmetic only — no gameplay effect)

Layer order: base -> overlay -> units/structures, per TILING-SPEC.md.
Neighbour bitmask N=1/E=2/S=4/W=8; T_<dir> opens to <dir> (that arm
missing); mask 0 draws nothing; cross only at mask 15.

- **Bridge deck:** every BRIDGE tile (the 4x4 block, rows 18–21,
  columns 30–33) draws `bridge_deck/straight_ew-512.png`. Deliberate
  deviation from a per-tile mask, documented here: the prototype
  bridge is a 4-tile-wide crossing block, not a 1-tile line, so
  straight_ew tiles join into one solid deck. Mask-derived corner/T
  variants would carve notches out of the block's corners and leave
  water showing under units standing on bridge terrain. The old baked
  cross-junction tile from `sprites-90/terrain/` is NOT used anywhere.
- **Cosmetic demo, track:** `train_tracks` L on empty west grass —
  horizontal row y=5, x=4..20, turning south at x=20 down to y=10.
  Variants are mask-derived (straight_ew, corner, end_east/end_west/
  end_south as neighbours dictate). No unit, structure, forest, or
  rock sits on any of these tiles.
- **Cosmetic demo, road:** `road` straight line on empty east dirt —
  row y=35, x=40..55, mask-derived straight_ew + end caps.
- Both demo lines are drawn purely from the list in `sprites.js`
  (`demoOverlayMap()`); they do not touch `state.terrain`, movement,
  collision, LOS, or combat.

## Minimap choice

Minimap keeps the old flat terrain colours (plus faction-coloured
unit/structure dots). Rationale: at 192x120 it must stay readable at a
glance, and drawing 512 px base textures down to ~3 px per tile buys
nothing. Documented, not an oversight.

## Tests

Run: `node --test tests/sim.test.js tests/catalog.test.js tests/sprites.test.js`
(note: `node --test tests/` alone does not resolve the directory in
this Node version; explicit file list is the working invocation.)

**Result: 22/22 pass — 15 pre-existing + 7 new mapping tests.**

New tests assert: every catalog unit (49) and structure (23) maps to
blue and red `-512` files that exist on disk; team mapping
(iron_eden blue, xandria red); every sim terrain id maps to all 3 base
variants on disk; the autotile table covers all 15 non-zero masks and
mask 0 draws nothing; every overlay variant referenced (bridge_deck,
train_tracks, road) exists on disk; every cosmetic demo tile has a
neighbour-derived variant and exists on disk.

## Screenshots (headless Chromium via Playwright, local http server)

- [wiring-screenshot.png](wiring-screenshot.png) — full map, 2048x1400:
  textured grass/dirt/water bases, bridge deck across the river with
  units on it, track L (top left), road line (bottom right), blue
  west base and red east command core, both sides' units as real
  sprites with HP bars. Tick 136 in the shot (demo opponent already
  moving, so some units are mid-bridge — that is the demo driver, not
  a wiring artefact).
- [wiring-screenshot-zoom.png](wiring-screenshot-zoom.png) — zoom 2.14
  over the track/forest area: track rails continuous across tile
  boundaries, forest_floor blocks, grass texture.
- [wiring-screenshot-units-crop.png](wiring-screenshot-units-crop.png) —
  crop of the west base from the full-map shot, enlarged: command_core
  with blue ring, tanks with blue trim, scout buggies at smaller scale
  — sprites upright, correctly team-coloured, not stretched.

Also checked: `file://` loading works in Chromium launched with
`--allow-file-access-from-files` (centre pixel sampled as grass, not
black). Without that flag, Chromium's file-origin policy may block
`../assets` loads; a local static server is the reliable route, and
that is how the screenshots were taken.

## Honest gaps

- **Forest reads as dark ground, not trees.** `forest_floor` is a dark
  soil base; no tree-canopy sprite exists in the overlay set, so
  forest clusters currently look like dark blocks. A canopy overlay
  (or tree sprites) would be needed to fix this properly; no fake
  canopy was drawn over it.
- **Grass base mirror symmetry** is visible at zoom (known from the
  tiles-overlay report; v2/v3 are rotations/flips of v1).
- **Turret no longer rotates independently.** The old placeholder drew
  a separate barrel at `turretFacing`; the sprite's turret is baked
  in, so only body facing rotates. Firing direction is therefore
  shown by body facing, not by an independent turret.
- **Small units are small.** At zoom 1 a size-0.3 drone is ~10 px; that
  is the catalog scale, not a wiring bug. Zoom to 2x+ for detail.
- **Non-scenario catalog sprites** (the other 42 units / 22 structures)
  load on first demand; their first frame may show the placeholder
  until the image arrives. All 49/23 files were verified to exist by
  the mapping test, so this is load timing only.
- **Not in this pass, by design:** expansion mechs (63, not in the
  prototype catalog — future catalog work, listed here, not spawned
  in game); weapon-module sprites as standalone entities (weapons are
  unit modules in Prototype 01); animation / damage / wreck frames
  (do not exist); economy / AI / fog / campaign (Milestone 02+);
  phone / touch playtest (headless desktop Chromium only).
- **No sprite failed to load in the browser run.** Every scenario
  unit, both command cores, all terrain bases, bridge deck, track,
  and road overlays are visible in the screenshots; nothing is left
  showing a placeholder in the scenario view.
