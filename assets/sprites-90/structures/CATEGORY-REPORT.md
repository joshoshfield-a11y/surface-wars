# STRUCTURES — sprites-90 category report

Scope: ALL 23 catalog structures from `~/workspace/surface-wars/data/catalog.json`,
blue + red = 46 distinct sprites, 92 sprite files + 1 contact sheet.
Nothing else touched: no game code, no `assets/sprites/` (old set untouched,
nothing copied from it), no commit/push/publish/package.

## Files

Folder: `~/workspace/surface-wars/assets/sprites-90/structures/`
Per class `<slug>`: `<slug>.png` (full-size keyed, transparent square, padded),
`<slug>-512.png` (512×512 LANCZOS), `<slug>-red.png`, `<slug>-red-512.png`.
All 46 `-512` files verified 512×512. Raws (unedited) + prompt record in `raw/`
(`<slug>.png` copies plus the original `media-generation-*` outputs and
`raw/PROMPTS.md`). Keying: flood-fill from borders through near-black
(max RGB < 48), soft alpha falloff, trim + re-center on a transparent square
with even padding, via a local copy of the old folder's `key_and_sheet.py`
(the old folder's tool itself was not modified). Red builder:
`make_reds.py` in this folder.

Contact sheet: `structures-sheet.png` (1592×2344, 46 items, dark backdrop,
built from the `-512` copies, labels are the sheet's own labels only).
Inspected by the builder: clean transparency on the dark backdrop, no stray
text/characters inside sprites, silhouettes readable at game size, consistent
grey-industrial family style, strict top-down throughout, every blue/red
pair visibly distinct.

## All 23 classes — PASS, first generation, no regeneration needed

| slug | catalog name | blue | red | notes |
|---|---|---|---|---|
| command_core | Command Core | PASS | PASS | Red body picks up a brownish-red tint (its slate panels are blue-tinted); ring + trim are bright red. Changed-opaque 77.3%, mean abs diff 19.4. |
| scrap_extractor | Scrap Extractor | PASS | PASS | 14.7% / 10.9 |
| power_plant | Power Plant | PASS | PASS | Side circles connect via pipes, so keying keeps them. 23.9% / 10.0 |
| advanced_reactor | Advanced Reactor | PASS | PASS | Octagon + concentric rings, flat. 70.5% / 21.8 |
| light_factory | Light Factory | PASS | PASS | Dark lower bay is enclosed interior black, kept opaque by flood-fill (not keyed away). Scrap piles at edges kept. 22.5% / 14.0 |
| vehicle_factory | Vehicle Factory | PASS | PASS | Two flat assembly lanes, black courtyard enclosed. 54.3% / 21.0 |
| mech_bay | Mech Assembly Bay | PASS | PASS | 15.0% / 6.3 — smallest blue/red mean diff, but blue trim lines flip to red lines and read clearly on the sheet. |
| aircraft_hangar | Aircraft Hangar | PASS | PASS | Curved wall is a footprint shape, not a perspective view; aircraft is flat top-down. Dark bay enclosed. 14.3% / 7.8 |
| heavy_plant | Heavy Industry Plant | PASS | PASS | Stack tops are flat circles. 39.5% / 13.7 |
| research_lab | Research Laboratory | PASS | PASS | Dishes are flat circles. 39.3% / 16.1 |
| salvage_processor | Salvage Processor | PASS | PASS | 18.5% / 10.2 |
| repair_depot | Repair Depot | PASS | PASS | 15.5% / 6.6 — blue edge dots + bay frames flip to red; reads on the sheet. |
| radar_station | Radar Station | PASS | PASS | Dish is a true flat circle, not an ellipse — the gate case for this category. 43.9% / 17.8 |
| ammo_depot | Ammunition Depot | PASS | PASS | Fenced yard: interior black keys transparent, so fence + crates survive as islands inside the full trim bbox; terrain will show through the yard, which is correct for a yard. 21.6% / 9.8 |
| logistics_hub | Logistics Hub | PASS | PASS | Sprawling composition: central building + dock + turning pad + scattered side crate groups (islands after keying, layout preserved by bbox). Small at sheet size but red trim is visible. 40.5% / 23.7 |
| experimental_facility | Experimental Assembly Facility | PASS | PASS | Dark building, bright blue ring flips to bright red ring. 81.9% / 20.7 |
| light_turret | Light Turret | PASS | PASS | Barrel vertical, straight up. 24.4% / 10.3 |
| heavy_turret | Heavy Cannon Turret | PASS | PASS | Barrel vertical, straight up; muzzle cap is a small flat ring at the barrel tip, not a diagonal view. 28.3% / 8.2 |
| aa_turret | Anti-Air Turret | PASS | PASS | Twin barrels vertical, parallel. 28.8% / 15.2 |
| missile_turret | Missile Turret | PASS | PASS | Four tubes as a flat grid, no diagonal tubes. 16.1% / 10.0 |
| bunker | Bunker | PASS | PASS | Red body picks up a reddish-brown tint from its blue-grey concrete; trim + slit are bright red. 86.3% / 31.3 |
| wall | Wall Segment | PASS | PASS | Horizontal bar; 9 cyan dots flip to 9 red dots. Smallest changed fraction (4.8% / 6.1) but the dots are the whole team marking and are visible on the sheet at game size. |
| shield_generator | Shield Generator | PASS | PASS | Concentric rings flip blue→red completely. 46.1% / 49.0 (largest mean diff). |

Changed-opaque fraction / mean absolute RGB difference are measured
blue-vs-red over opaque pixels of the full-size keyed sprites.

## Rejected / regenerated

None. Zero classes rejected on the top-down gate, zero regenerations.
Every first-generation raw passed: rectangular/octagonal buildings and
circular pads/dishes are naturally plan-view, and the turret/radar prompts
locked barrels vertical and dishes to flat circles. The skill's "one
simplified regeneration pass" was therefore not consumed. No class was
shipped with a "slightly diagonal" note, and no class is FAILED/MISSING.

## Red-variant honesty

Reds are NOT separate generations and NOT the old set's R/B channel swap
(which made siege_cannon-red identical to blue). They are HSV hue remaps of
the keyed blue sprites (blue/cyan/violet pixels → hue 0, saturation/value
preserved; grey metal, rust, olive and concrete untouched). Consequence to
know: on sprites whose body panels are themselves blue-tinted slate
(command_core, bunker, and to a lesser degree experimental_facility), the
whole body shifts toward reddish-brown, not just the trim — the result is
still unambiguously red vs blue on the sheet, but it is a team-tinted body,
not an accent-only recolor. If the parent wants accent-only reds for those
three, the fix is to regenerate them as separate red generations, not to
re-tune the remap (the remap threshold is already what keeps wall at 4.8%
while keeping every other class above 14%).

## Honest gaps

- No animation, damage, wreck, or construction frames; no Salvage Clans /
  Directorate skins — blue (Iron Eden) and red (Xandria) only, per task.
- `-512` copies do not preserve relative class scale (all are square 512);
  footprint differences (e.g. wall is a thin bar, heavy_plant is a large
  complex) survive only as aspect inside the square, as in the old set.
- Ammo depot / logistics hub yards key transparent between their parts;
  they rely on the game's terrain backdrop showing through, which is
  correct for a yard but different from the solid buildings.
- Light factory's scrap piles and logistics hub's side crates are loose
  islands after keying; they hold their positions only because trimming
  uses the whole alpha bbox.
- Sprites are NOT wired into the game (game code untouched, per task).
- Not verified on a phone or in a real browser; QC was the contact sheet
  plus full-size raw inspection in this sandbox.
