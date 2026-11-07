# Surface Wars — Part 2 (Animation Wiring) + Part 3 (First Map) Report

Date: 2026-10-30. Scope: render layer and map data only. **`game/sim.js` was not
edited — no sim rules, stats, balance, pathfinding, damage, or demo opponent
changed.** Nothing was committed, pushed, published, or packaged as an APK.
`assets/` (all four sprite dirs) and `~/workspace/scrap-dungeon/` were not touched.

## Part 2 — what was wired

All animation is derived from EXISTING sim state only, timed from `state.time`
(sim seconds). **Animation freezes exactly when the game is paused** — no
wall-clock time is used anywhere in `render.js` or `game/animation.js`.

New file: `game/animation.js` (DOM-free, Node-exportable as `SWAnim`).
Changed: `game/sprites.js` (paths + canopy + generic autotile), `game/render.js`
(drawScene gains an optional 7th `anim` argument, backwards-compatible),
`game/game.js` (render-layer animation state only), `game/index.html` (map buttons).

### Animation states

| Sim state | Visual |
|---|---|
| Ground unit moving, mech chassis | Alternating step-bob, ±0.04 tiles |
| Ground unit moving, vehicle chassis | Smooth bob, `sin(t·10) · 0.03` tiles |
| Air unit, moving or idle | Hover-bob, `sin(t·3) · 0.05` tiles |
| Ground unit idle | Still (no bob) |
| Gunship / drones (6 ids) | Code-drawn translucent rotor disc + rotating line. No invented sprite file. Fixed-wing aircraft get hover-bob only, no rotor |
| Unit attacking | Recoil 2 px back along turret facing for 0.12 s + muzzle flash at barrel tip (unit pos + facing · radius · 1.3) |
| Unit with travelling weapon | Projectile sprite rotated along travel (`atan2 + π/2`, nose-up convention), size 0.6 tiles; fallback is the old `#ffe066` dot if the sprite is not ready |
| Ground unit moving | Dust puff at most once per 0.5 sim seconds |
| HP < 50% | Light smoke (`smoke_1` cycling to `smoke_2`, 1 frame per sim second) |
| HP < 25% | Heavy smoke (`smoke_3` cycling from `smoke_2`) |
| Unit dies | Explosion FX (4 frames / 0.6 s) + brief fire FX, then wreck sprite |
| Command core idle | Subtle pulse (scale `1 + 0.03·sin(t·2.2)`) + pulsing light dot. Footprint and sim behaviour untouched |
| Water tiles | Slow shimmer: base variant cycles v1 → v2 → v3, one step per 1.5 sim seconds. Zero extra draw calls — the same `drawImage` per visible water tile, just a different cached variant. No full-terrain redraw beyond what render already does per frame for the visible window |

Transient FX durations: explosion 4 frames / 0.6 s; muzzle 3 frames / 0.18 s;
dust 2 frames / 0.5 s; fire 3 frames looping / 1.2 s.

### Projectile mapping (`projectileForWeapon`, weapon family first, damage type fallback)

| Weapon(s) | Projectile sprite |
|---|---|
| Missile Launcher, Rocket Artillery | `missile` |
| Mortar | `kinetic_tracer` (lobbed shell; tracer, no fins at this scale) |
| Autocannon, Heavy Cannon, Anti-air Cannon, Siege Cannon | `kinetic_tracer` |
| Railgun | `energy_bolt` |
| Flamethrower | `flame` |
| Laser, Melee, EW weapons | None — instant in sim, muzzle flash only (`projectileSpeed === 0` → `null`) |
| Damage-type fallback | Energy → `energy_bolt`; Thermal → `flame`; Explosive → `missile`; Kinetic / Siege / Disruption → `kinetic_tracer` |

### Wreck persistence model — read this before assuming anything

- On a unit death, `game.js` pushes a wreck `{typeId, x, y, radius, rot}` into a
  render-layer list and spawns explosion + fire FX. Structure deaths get
  explosion + fire only (no structure wreck art exists).
- **Wrecks PERSIST for the rest of the match. They are render-layer visuals
  only: NOT sim entities, NOT blocking movement or pathfinding, NOT selectable,
  and NOT salvageable. No salvage economy exists yet.** This limit is stated
  here, in the `game.js` comment, and in the in-game help text.
- A failed/missing wreck image simply leaves terrain visible (there is no live
  unit to fall back to). Live units keep the still-sprite fallback rule.

### Fallbacks

Any missing/failed animation image falls back to the existing still sprite,
never a blank. Projectiles fall back to the old dot. Water shimmer falls back
to the base variant. Canopy: a forest tile whose canopy image fails to load
shows its `forest_floor` base (dark ground) — the pre-existing behaviour.

## Part 3 — First Map (default on load)

New file: `game/maps.js` (DOM-free, Node-exportable as `SWMaps`; builds terrain
+ spawn list only, changes no sim rules). Size **80×50** — no justification for
another size was needed; existing camera/minimap code handles it.

- **Bases:** Iron Eden command core (6,25) on grass; Xandria command core
  (73,25) on dirt. Spawn is the same 10v10 shape as `sim.spawnScenario`,
  re-based to the new cores.
- **River:** columns x=39–42, full height, WATER.
- **Single bridge:** x=39–42, y=23–26, BRIDGE — exactly 16 tiles, the only
  ground crossing. Verified by test (see below).
- **Zones:** grass west of the river, dirt east, with dirt patches west
  (20–26, 40–44) and (4–8, 32–34), grass patches east (60–64, 22–24) and
  (48–52, 36–38).
- **Forest clusters** (11 blobs, ≥40 tiles) with canopy overlays: canopy tiles
  are drawn over every FOREST tile from live terrain neighbours (base →
  overlay → units layer order). Variant rule: all 4 forest neighbours →
  `canopy_dense`; exactly 3 neighbours → the edge tile named for the half that
  IS foliage; 0–2 neighbours → `canopy_single` (a lone crown, no false edge).
  This fixes "forest reads as dark ground".
- **Rock clusters:** 8 blobs, ≥10 tiles, none on the bridge or in the bridge
  approach corridor (x 35–48, y 20–29, kept clear of forest and rock).
- **Cosmetic overlay lines** (NOT terrain; drawn by render from these lists via
  autotile mask logic N=1, E=2, S=4, W=8; change no gameplay): train track
  (`train_tracks`) row y=6, x=4–34, turning south at x=34 to y=15; road (`road`)
  row y=43, x=48–75, spur north at x=70, y=37–42.
- **STEPPING-STONE FORD — VISUAL ONLY. Ground units CANNOT cross water there.**
  Stepping stones (`stepping_stones`) at y=12, x=38–43 (grass bank 38, water
  39–42, dirt bank 43). The tiles underneath remain WATER, so ground paths
  between the ford banks route via the bridge (test-proven). This is stated
  in the `maps.js` header comment, in the in-game help text, and here.
- **Map switcher:** "First Map" / "Test Map" buttons in the top bar; First Map
  is the default on load. The old 64×40 test map is unchanged and still
  available (bridge rows 18–21, river columns 30–33).

## Camera bug found and fixed (render layer only, not sim)

Prototype 01 shipped a unit mismatch: `game.js` (pan, wheel, `screenToWorld`)
and the minimap treat camera as TILES, but `render.js` `drawScene` subtracted
that tile-valued camera from pixel coordinates, pinning the view near the
origin — panning and zooming barely moved anything. This was found because
zoomed screenshots repeatedly framed the wrong terrain, and confirmed by
measuring the minimap viewport rect against rendered landmarks. Fixed in
`render.js` (`(tile − camera) · TILE · zoom` everywhere, plus the visible-tile
range computation); the minimap, pan, wheel, and selection code were already
correct and were not changed. No sim code was involved.

## Tests — 39/39 pass

Run as (explicit file list; `node --test tests/` directory form fails on
Node v24.22.1 as a runner invocation issue, not a code failure):

```
node --test tests/sim.test.js tests/catalog.test.js tests/sprites.test.js \
             tests/animation.test.js tests/firstmap.test.js
```

- Old 22 tests still pass untouched (sim 9, catalog 6, sprites 7).
- New 17 tests: `tests/animation.test.js` (10) — every catalog unit maps to an
  existing wreck file (both `-512` and base); every FX frame exists; all 6
  canopy tiles exist; projectile mapping (every travelling weapon → existing
  sprite, every instant weapon → `null`, spot-checks missile / kinetic_tracer /
  energy_bolt / flame / mortar); canopy variant logic (dense, single, all four
  inward edges, two corner cases → single); damage-smoke thresholds; bob
  (air hovers idle, ground idle still, mech step-bob alternates); rotor set
  (gunship + 5 drones yes; fixed-wing + tanks no); FX frame timing; water
  shimmer (variant always 1–3 and changes over time).
- `tests/firstmap.test.js` (7) — 80×50; river; exactly one 4×4 bridge block and
  no bridge tile outside it; ground path (10,25)→(69,25) crosses the bridge,
  never water; **ford-bank path (36,12)→(45,12) routes via the bridge, never
  water, while ford river tiles are WATER**; both cores at (6,25)/(73,25), all
  spawns on non-blocking terrain, 10 units per side; forest ≥40 tiles, every
  forest tile has a canopy variant + existing file; track/road/ford overlay
  sets autotile cleanly with all variant files existing; rocks ≥10, none on
  bridge or in approach corridor; old test map still 64×40 with bridge
  rows 18–21.
- One failure occurred and was fixed during the run: a rock blob spilled into
  the approach corridor at (36,29); its centre moved (36,30)→(36,31) and the
  suite went 38/39 → 39/39.

## Proof — screenshots and GIF (all under `game/`)

Captured with local headless Chromium via Playwright against a local HTTP
server — NOT the user's live browser. Every shot was viewed and verified
against predicted landmarks (command core, bridge, forest clusters), not just
eyeballed at full-frame scale.

- `firstmap-full.png` — full 80×50 map: river, bridge, ford line, track, road,
  forest canopy clusters, rocks, both bases, battle in progress at the bridge
  with visible muzzle flashes.
- `firstmap-base.png` — zoomed west base: command core with pulse light,
  surrounding real unit sprites (tanks, mechs, long-barrel longshot mech),
  health bars.
- `firstmap-bridge-forest.png` — zoomed bridge with a unit fighting on it,
  river, rocks, and a forest canopy cluster in frame.
- `firstmap-forest.png` — canopy closeup on cluster (11,9): dense bright-green
  centres, half-foliage edge tiles, dark forest-floor bases.
- `firstmap-wreck.png` — bridge battle in progress with a wreck on the
  bridge approach.
- `firstmap-wreckfield.png` — a whole field of persistent wreck sprites west
  of the bridge after a full demo battle.
- `animation-sequence.gif` — 9 frames, 400 ms apart, captured from real ticks
  during a bridge battle (units moving/firing, water shimmer). Frame-to-frame
  pixel diffs confirm motion in the bridge region for frames 1–8; the
  sequence was trimmed there because the battle ended (victory) and later
  frames were byte-identical — the game stops advancing `state.time` on
  victory, which is also why the GIF does not loop into a static tail.

## Honest gaps

- **No per-unit multi-frame walk cycles.** Animation is transform (bob /
  recoil) + FX on single stills, except wrecks / FX / canopy, which are new art.
- **No salvage economy yet.** Wrecks are visual only (see model above).
- **No structure wreck art.** Structure deaths get explosion + fire only.
- **Water shimmer is base-variant cycling, not a true ripple simulation.**
- **No phone playtest yet.** Screenshots are desktop-viewport headless captures.
- **Bob at zoom 1 is subtle (~1 px).** Muzzle flashes, projectile sprites,
  dust, and wrecks are the most legible motion at that scale; the GIF is framed
  zoomed into the bridge for exactly that reason.
- `sim.js` untouched-ness rests on this session's own edit history, not on a
  git diff: no git repo was found in `~/workspace/surface-wars/`.
