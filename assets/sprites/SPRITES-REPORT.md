# Surface Wars — Sprite Templates Report

All sprites are ORIGINAL, generated for the new standalone RTS in
`~/workspace/surface-wars/`. No game code was edited, nothing was committed,
pushed, or published. The user's RTS reference screenshot was style
inspiration in words only — never passed as an image input to every call,
never copied — and no Rusted Warfare sprite, asset, or code was copied.

Style lock: strict 90-degree top-down pixel art, industrial scrap-metal
sci-fi, readable silhouettes at zoom-out, blue team colour with script-derived
red team variants (R/B channel swap on blue-dominant pixels only).

Method (sprite-batch-QC skill): one grid generation per category on a pure
black background, sliced with `tools/key_and_sheet.py`, flood-fill keyed from
the borders (dark interior detail survives), soft alpha falloff, trimmed and
re-centered on a transparent square canvas with even padding, full size plus
a 512x512 LANCZOS copy with a `-512` suffix. Terrain tiles are full-bleed and
were NOT keyed. One labeled contact sheet per category was built from the
`-512` copies on a dark backdrop and inspected visually. Contaminated classes
were moved to `raw-flawed/` and regenerated once with a simplified prompt;
the second pass was the last automatic one.

Totals: 124 distinct game sprites (248 files counting full-size + `-512`
copies), across 5 categories, plus 5 contact sheets.

## 1. Mechs — 8 chassis, blue + red = 16 sprites (32 files)
Folder: `mechs/` · Sheet: [mechs-sheet.png](sandbox://workspace/surface-wars/assets/sprites/mechs/mechs-sheet.png) · Report: `mechs/CATEGORY-REPORT.md`

scout, lancer, bulwark, longshot, rampart, vespid, scrapjack, warden —
each as `<slug>.png`, `<slug>-512.png`, `<slug>-red.png`, `<slug>-red-512.png`.
Raw grid: `mechs/raw/grid-blue.png` (+ `raw/prompt.txt`).

Flawed / second pass (all 3 passed):
- warden — detached barrel tip from Longshot crossing the grid boundary; regen clean, large central sensor dome.
- scout — grid version was front-facing bipedal, not top-down; regen is a flat oval top-down hull with central sensor circle.
- scrapjack — grid version was also front-facing bipedal; regen is a flat top-down hull of mismatched patched plates.

Gaps: Longshot's barrel may be marginally shorter than the grid original (it was the border-crosser, not regenerated); Lancer/Longshot are tall/narrow in their square 512 canvases; red variants are recolors only, so some reds have only small accents; `-512` files do not preserve relative size between classes (Scout = Rampart at 512px) — in-game scaling must come from game data.

## 2. Core units — 19 units, blue + red = 38 sprites (76 files)
Folder: `units/` · Sheet: [units-sheet.png](sandbox://workspace/surface-wars/assets/sprites/units/units-sheet.png) · Report: `units/CATEGORY-REPORT.md`

scout_buggy, combat_drone, radar_scout, medium_tank, heavy_tank, siege_cannon,
rocket_battery, breach_walker, interceptor_drone, flak_tank, missile_carrier,
gunship, strike_bomber, construction_vehicle, field_repair_mech,
recovery_crawler, mobile_supply_carrier, shield_projector, command_walker —
each in blue and red, full size + `-512`.
Raw grid: `units/raw/grid-blue.png` (+ `raw/prompt.txt`); the 20th grid cell verified pure black and was discarded. Corner alpha is 0 on all 38 game-size files; no text, UI, or watermarks.

Flawed / second pass (all 3 passed):
- missile_carrier — side-profile truck in grid; regen is a true top-down truck with missile tubes flat on the deck (wide, so thinner in its square cell, still readable).
- mobile_supply_carrier — side-profile truck in grid; regen is a true top-down truck with a crate-grid cargo box.
- recovery_crawler — side-profile in grid; regen is a true top-down tracked hull with crane arm and claw.

Gaps: red strength varies (strong on combat_drone, shield_projector, radar_scout and the three regen trucks, 3,871–7,169 px swapped; weak on breach_walker-red at 53 px, strike_bomber-red, construction_vehicle-red, which stay close to blue and rely on small lights); field_repair_mech is the least instantly legible (spider-like legged mech from above); no animation frames, damaged/wreck variants, or units beyond these 19.

## 3. Weapons — 12 families, blue + red = 24 sprites (48 files)
Folder: `weapons/` · Sheet: [weapons-sheet.png](sandbox://workspace/surface-wars/assets/sprites/weapons/weapons-sheet.png) · Report: `weapons/CATEGORY-REPORT.md`

autocannon, heavy_cannon, missile_launcher, rocket_artillery, railgun, mortar,
flamethrower, anti_air_cannon, laser, siege_cannon, melee_weapon, ew_module —
each in blue and red, full size + `-512`.
Raw grid: `weapons/raw/grid-blue.png` (+ `raw/prompt.txt`).

Flawed / second pass (passed):
- mortar — grid slice bled in the tip of the laser sprite from the row below, a detached fragment under the mortar base; cell moved to `raw-flawed/`, regen is a clean top-down circular muzzle on a square base. Honest caveat: it reads slightly more strictly top-down than the 11 grid siblings.

Gaps: siege_cannon-red is visually identical to blue (recolor found 0 blue-dominant pixels — yellow/gunmetal only, needs a manual red accent); flamethrower-red is subtle (79 px swapped); railgun/rocket_artillery are diagonal mounted views, not perfectly flat plan views; all silhouettes are distinct and readable at game size, no text/UI/watermarks.

## 4. Terrain — 14 tiles, no team variants = 14 sprites (28 files)
Folder: `terrain/` · Sheet: [terrain-sheet.png](sandbox://workspace/surface-wars/assets/sprites/terrain/terrain-sheet.png) · Report: `terrain/CATEGORY-REPORT.md`

open_wasteland, broken_asphalt_road, urban_ruins, industrial_complex,
rocky_highlands, canyon_ravine, marsh_contaminated_pool,
frozen_irradiated_zone, desert_flats_dunes, forested_overgrown_ruins,
abandoned_military_base, underground_facility_entrance,
river_water_shallow_crossing, crater_field —
each as `<slug>.png` + `<slug>-512.png`, full-bleed, NO keying.
Raw grid: `terrain/raw/grid.png` (+ `raw/prompt.txt`); the last 2 grid cells came out solid black and were discarded.

Flawed / second pass: NONE. All 14 passed QC — no text, characters, UI, watermarks, or neighbour bleed.

Gaps: grid-sliced tiles may NOT tile seamlessly edge-to-edge (generated as one picture, not wrap-around textures, and the slicer's 2% inset trim breaks edge continuity) — edge cleanup is needed before use as repeating tiles. No terrain transitions/variants. Minor notes: river ford is a fairly symmetrical cross shape; canyon shading leans slightly cliff-face; desert is the lowest-detail tile. Readability judged on the contact sheet only, not in-game.

## 5. Structures — 16 structures, blue + red = 32 sprites (64 files)
Folder: `structures/` · Sheet: [structures-sheet.png](sandbox://workspace/surface-wars/assets/sprites/structures/structures-sheet.png) · Report: `structures/CATEGORY-REPORT.md`

command_core, scrap_extractor, power_plant, vehicle_factory,
mech_assembly_bay, aircraft_hangar, research_laboratory, radar_station,
light_turret, heavy_cannon_turret, anti_air_turret, missile_turret, bunker,
wall_segment, shield_generator, repair_depot —
each in blue and red, full size + `-512`.
Raw grid: `structures/raw/grid-blue.png` (+ `raw/prompt.txt`); no sprite crossed a cell border.

Flawed / second pass (passed):
- mech_assembly_bay — first keyed version was hollow, just a thin blue mech outline, near-invisible at game size; cell moved to `raw-flawed/`, regen is a solid gantry frame with a filled dark-steel mech in the berth (full-size file 1413x1413 vs ~260–450 px for grid classes, since it came from a single image; its `-512` copy matches the others).

Gaps: aircraft_hangar reads mainly as a runway strip with only a small hangar end-block (not regenerated — the second pass went to the hollow mech bay); radar dishes/turret barrels are slightly angled rather than perfectly flat top-down; red variants are algorithmic recolors, so accents read orange-red and grey/rust areas are identical to blue. QC was visual on the sheet only, no in-game playtest.

## What reads clean
All five contact sheets read clean on a dark backdrop: no text, UI, or
watermarks anywhere; silhouettes are distinct per class and readable at
game size; transparency corners are clean on the keyed categories.

## What is still missing (honest)
- No animation frames, damage states, or wreck variants for any unit/mech.
- No in-game playtest on a phone or in the prototype — QC was contact-sheet
  visual only; relative in-game scale must come from game data, not the
  512px files.
- Terrain tiles need edge cleanup before seamless repeating use, and there
  are no transition tiles.
- Weak red team variants needing a manual accent pass: weapons
  siege_cannon-red (identical to blue), flamethrower-red (subtle); units
  breach_walker-red, strike_bomber-red, construction_vehicle-red (subtle).
- Slightly angled/diagonal views remaining: weapons railgun and
  rocket_artillery; structures radar dishes/turret barrels; terrain canyon
  shading.
- Aircraft_hangar composition (runway strip + small hangar block) and
  field_repair_mech legibility are flagged for a future pass.
- Categories beyond these five (FX/projectiles, UI icons, faction-specific
  structure skins, Salvage Clans / Directorate content) were not generated.
