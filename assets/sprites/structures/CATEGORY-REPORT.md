# Structures — Category Report (spec §10)

- Source grid: `structures/raw/grid-blue.png` (1600×1600, 4×4), prompt in `structures/raw/prompt.txt`
- Slicing: `structures/raw/cells/cell-r{R}c{C}.png` via `tools/key_and_sheet.py slice` (4, 4) — clean, no sprite crossed a cell border.
- Keying: flood-fill from borders (near-black < 48), soft falloff, trim + re-center on transparent square with padding, full size + 512×512 LANCZOS `-512` copy.
- Red variants: `recolor-blue-red` (R/B swap on blue-dominant pixels only) on the full-size file, plus a 512×512 LANCZOS `-512` copy. Note: swapped accents read orange-red rather than pure red, because the swap preserves brightness.
- Contact sheet: `structures/structures-sheet.png` (32 items: blue + red for each class, labeled, dark #141414 backdrop, 4 columns), rebuilt after the second pass.
- No game code was edited, no other sprite category was touched, nothing was committed, pushed, or published.
- Media calls used: 2 of 4 (1 grid + 1 single-sprite regeneration).

## Sprites (16 classes × blue + red = 32 files + 32 game-size copies)

All paths are under `~/workspace/surface-wars/assets/sprites/structures/`:

| # | Slug | Blue (full / -512) | Red (full / -512) | QC note |
|---|---|---|---|---|
| 1 | command_core | `command_core.png` / `command_core-512.png` | `command_core-red.png` / `command_core-red-512.png` | Clean. Large HQ footprint, central dome, blue accents. |
| 2 | scrap_extractor | `scrap_extractor.png` / `scrap_extractor-512.png` | `scrap_extractor-red.png` / `scrap_extractor-red-512.png` | Clean. Radial drill rig over a pit. |
| 3 | power_plant | `power_plant.png` / `power_plant-512.png` | `power_plant-red.png` / `power_plant-red-512.png` | Clean. Reactor block with 4 corner cooling towers. |
| 4 | vehicle_factory | `vehicle_factory.png` / `vehicle_factory-512.png` | `vehicle_factory-red.png` / `vehicle_factory-red-512.png` | Clean. Large bay building with doors. |
| 5 | mech_assembly_bay | `mech_assembly_bay.png` / `mech_assembly_bay-512.png` | `mech_assembly_bay-red.png` / `mech_assembly_bay-red-512.png` | REGENERATED (see below). Second pass is solid and readable. |
| 6 | aircraft_hangar | `aircraft_hangar.png` / `aircraft_hangar-512.png` | `aircraft_hangar-red.png` / `aircraft_hangar-red-512.png` | Acceptable, weaker than spec: reads mainly as a runway strip with only a small end block for the hangar itself. Distinct at game size; not regenerated (second pass reserved for the hollow class). |
| 7 | research_laboratory | `research_laboratory.png` / `research_laboratory-512.png` | `research_laboratory-red.png` / `research_laboratory-red-512.png` | Clean. Lab block with antenna; no text. |
| 8 | radar_station | `radar_station.png` / `radar_station-512.png` | `radar_station-red.png` / `radar_station-red-512.png` | Clean. Three-dish array; dishes are slightly angled rather than perfectly flat top-down, but still read as a top-down array. |
| 9 | light_turret | `light_turret.png` / `light_turret-512.png` | `light_turret-red.png` / `light_turret-red-512.png` | Clean. Small circular turret, single barrel. |
| 10 | heavy_cannon_turret | `heavy_cannon_turret.png` / `heavy_cannon_turret-512.png` | `heavy_cannon_turret-red.png` / `heavy_cannon_turret-red-512.png` | Clean. Large twin-barrel circular turret. |
| 11 | anti_air_turret | `anti_air_turret.png` / `anti_air_turret-512.png` | `anti_air_turret-red.png` / `anti_air_turret-red-512.png` | Clean. Multi-barrel circular turret. |
| 12 | missile_turret | `missile_turret.png` / `missile_turret-512.png` | `missile_turret-red.png` / `missile_turret-red-512.png` | Clean. Launcher-pod circular turret. |
| 13 | bunker | `bunker.png` / `bunker-512.png` | `bunker-red.png` / `bunker-red-512.png` | Clean. Low concrete pillbox ring. |
| 14 | wall_segment | `wall_segment.png` / `wall_segment-512.png` | `wall_segment-red.png` / `wall_segment-red-512.png` | Clean. Short fortified wall bar, as specified. |
| 15 | shield_generator | `shield_generator.png` / `shield_generator-512.png` | `shield_generator-red.png` / `shield_generator-red-512.png` | Clean. Pylon ring with central emitter. |
| 16 | repair_depot | `repair_depot.png` / `repair_depot-512.png` | `repair_depot-red.png` / `repair_depot-red-512.png` | Clean. Workshop bay with crane bar. |

## Flawed / regenerated classes

- **mech_assembly_bay — flawed in pass 1, regenerated once, PASS on pass 2.**
  - Pass 1 flaw: the berth interior keyed out to transparency, leaving only a thin blue outline of a mech shape inside the gantry frame — hollow and near-invisible at game size.
  - Flawed raw moved to `structures/raw-flawed/mech_assembly_bay-cell-r1c0.png` before regeneration.
  - Pass 2: single-sprite simplified prompt (`structures/raw/mech_assembly_bay-single.png`, prompt in `structures/raw/mech_assembly_bay-single-prompt.txt`) — solid gantry frame with four corner posts and a solid filled dark-steel mech body in the berth. Keyed, recolored, and verified at 512: solid, readable, no text. This was the last automatic pass for this class, per the skill.
  - Note: the pass-2 full-size file is 1413×1413 (the single image was 1600×1600, vs ~260–450 px for grid-sliced classes); its `-512` game-size copy is the same size as the others.
- **No other class was regenerated.** No text, letters, numbers, UI, or watermarks were found on any sprite on the final sheet. No cell bled into a neighbour.

## Honest gaps

- Aircraft hangar is runway-dominant (see table); a future pass could bulk up the hangar building, but it was not spent here because the single regeneration budget was used on the hollow mech bay.
- Radar dishes and some turret barrels carry a slight angled/perspective rendering rather than mathematically flat top-down; they still read as top-down game sprites and were not treated as failures.
- Red variants are algorithmic recolors, not separately generated art: only blue-dominant pixels swap, so grey/rust/hazard areas are identical to blue and accents read orange-red.
- Nothing was playtested in-game; QC was visual only, on the dark-backdrop contact sheet and the individual 512 file.
