# Core units — category report (spec section 6)

Style: strict 90-degree top-down pixel art, industrial scrap-metal sci-fi,
dark steel with rust and hazard-yellow accents, blue team-colour lights.
All original art. No text, letters, numbers, UI, or watermarks in any sprite.
Grid generation: 1 media call for the 5x4 grid + 3 single-sprite second-pass
calls = 4 total, the task maximum.

## Files

- Raw grid: `units/raw/grid-blue.png` (1760x1408), prompt in
  `units/raw/prompt.txt`, grid cells in `units/raw/cells/` (the 20th cell was
  verified pure black and discarded).
- Second-pass raws: `units/raw/missile_carrier-regen.png`,
  `units/raw/mobile_supply_carrier-regen.png`,
  `units/raw/recovery_crawler-regen.png`; prompts in
  `units/raw/regen-prompts.txt`.
- Flawed originals: `units/raw-flawed/` (3 grid cells, see below).
- Contact sheet (38 labeled sprites, blue + red, dark backdrop, 6 cols):
  `units/units-sheet.png`
- Per sprite: `units/<slug>.png` (full size, transparent square, padded),
  `units/<slug>-512.png` (512x512 LANCZOS), `units/<slug>-red.png` and
  `units/<slug>-red-512.png` (red team variant via the shared
  `recolor-blue-red` script, which swaps R/B on blue-dominant pixels only).

## Sprites (19 blue + 19 red = 38 files at game size, 76 total incl. full size)

| # | Slug | Blue | Red |
|---|------|------|-----|
| 1 | scout_buggy | scout_buggy.png / scout_buggy-512.png | scout_buggy-red.png / scout_buggy-red-512.png |
| 2 | combat_drone | combat_drone.png / combat_drone-512.png | combat_drone-red.png / combat_drone-red-512.png |
| 3 | radar_scout | radar_scout.png / radar_scout-512.png | radar_scout-red.png / radar_scout-red-512.png |
| 4 | medium_tank | medium_tank.png / medium_tank-512.png | medium_tank-red.png / medium_tank-red-512.png |
| 5 | heavy_tank | heavy_tank.png / heavy_tank-512.png | heavy_tank-red.png / heavy_tank-red-512.png |
| 6 | siege_cannon | siege_cannon.png / siege_cannon-512.png | siege_cannon-red.png / siege_cannon-red-512.png |
| 7 | rocket_battery | rocket_battery.png / rocket_battery-512.png | rocket_battery-red.png / rocket_battery-red-512.png |
| 8 | breach_walker | breach_walker.png / breach_walker-512.png | breach_walker-red.png / breach_walker-red-512.png |
| 9 | interceptor_drone | interceptor_drone.png / interceptor_drone-512.png | interceptor_drone-red.png / interceptor_drone-red-512.png |
| 10 | flak_tank | flak_tank.png / flak_tank-512.png | flak_tank-red.png / flak_tank-red-512.png |
| 11 | missile_carrier | missile_carrier.png / missile_carrier-512.png | missile_carrier-red.png / missile_carrier-red-512.png |
| 12 | gunship | gunship.png / gunship-512.png | gunship-red.png / gunship-red-512.png |
| 13 | strike_bomber | strike_bomber.png / strike_bomber-512.png | strike_bomber-red.png / strike_bomber-red-512.png |
| 14 | construction_vehicle | construction_vehicle.png / construction_vehicle-512.png | construction_vehicle-red.png / construction_vehicle-red-512.png |
| 15 | field_repair_mech | field_repair_mech.png / field_repair_mech-512.png | field_repair_mech-red.png / field_repair_mech-red-512.png |
| 16 | recovery_crawler | recovery_crawler.png / recovery_crawler-512.png | recovery_crawler-red.png / recovery_crawler-red-512.png |
| 17 | mobile_supply_carrier | mobile_supply_carrier.png / mobile_supply_carrier-512.png | mobile_supply_carrier-red.png / mobile_supply_carrier-red-512.png |
| 18 | shield_projector | shield_projector.png / shield_projector-512.png | shield_projector-red.png / shield_projector-red-512.png |
| 19 | command_walker | command_walker.png / command_walker-512.png | command_walker-red.png / command_walker-red-512.png |

All paths are under `~/workspace/surface-wars/assets/sprites/units/`.

## QC

- Grid slicing: clean — no sprite crossed a cell border; the 2% slice inset
  was enough and every cell keyed to a single unit.
- Transparency: flood-fill key from the borders, soft falloff, trim +
  re-center on a transparent square. Spot-checked: corner alpha 0 on all
  38 game-size files; sheet inspected visually on the dark backdrop, no
  halos, no stray text, no bleeding.
- Silhouettes: all 19 read at game size. Family style is consistent
  (dark steel / rust / hazard stripes / coloured lights).

## Flawed / regenerated classes (second pass = last automatic pass)

The grid's first pass rendered three truck-class units as SIDE-profile
views, violating the strict top-down lock. Their original cells were moved
to `units/raw-flawed/` and each was regenerated once with a simplified
single-sprite top-down prompt:

- missile_carrier — PASS. Regen is a true top-down truck: long hull, cab
  at one end, wheels at the sides, missile tubes laid flat on the deck.
  (It is a wide horizontal sprite, so it sits thinner in its square cell
  than the vertical units — honest aspect, still readable.)
- mobile_supply_carrier — PASS. Regen is a true top-down truck: cab plus
  a rectangular cargo box with a crate grid on top.
- recovery_crawler — PASS. Regen is a true top-down tracked hull with a
  crane arm and claw on top.

No other class was regenerated; the remaining 16 grid cells were used as-is.

## Honest gaps / caveats

- Red variants are derived by swapping blue-dominant pixels only, so red
  differentiation is strong where a sprite has blue lights (combat_drone,
  shield_projector, radar_scout) and weak where it has almost none:
  breach_walker-red (53 px swapped in the grid version), strike_bomber-red
  and construction_vehicle-red are close to their blue originals at a
  glance and rely on small lights/flames for team identity. The three
  regenerated trucks have strong red variants (3,871–7,169 px swapped).
- field_repair_mech reads as a spider-like legged mech from above; its
  tool arm is the long lower appendage. Acceptable, but it is the least
  instantly legible of the set.
- missile_carrier's horizontal orientation differs from the mostly
  vertical grid units; the game will need to rotate it like any other
  unit sprite.
- Nothing was generated beyond the 19 spec units; no animation frames,
  no damaged/wreck variants, no other categories touched, no game code
  edited, nothing committed, pushed, or published.
