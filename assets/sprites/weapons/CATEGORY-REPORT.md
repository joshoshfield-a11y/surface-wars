# Weapons — Category Report (spec §8 families)

Style: strict 90° top-down pixel art, industrial scrap-metal sci-fi, dark gunmetal
steel with rust and hazard-yellow accents, small blue team-colour accents.
Original art only; no text, letters, numbers, UI, or watermarks in any sprite.
No game code touched; no commits, pushes, or publishing.

## Source
- Grid raw: `weapons/raw/grid-blue.png` (1920×1280), prompt in `weapons/raw/prompt.txt`
- Sliced with `key_and_sheet.py slice` (4×3) into `weapons/raw/cells/`
- Keyed with flood-fill from borders (dark interior survives), soft falloff,
  trimmed and re-centred on a transparent square canvas; each sprite written
  full-size plus a 512×512 LANCZOS `-512` copy.
- Red variants via `key_and_sheet.py recolor-blue-red` (R/B swap on
  blue-dominant pixels only), plus a 512×512 LANCZOS `-512` copy of the red.
- Contact sheet: `weapons/weapons-sheet.png` — 24 items (blue + red, labelled,
  dark backdrop, 4 columns), built from the `-512` copies and visually inspected.

## Sprites (12 blue + 12 red = 24 files, each also in -512 form)

| # | Slug | Blue (full / 512) | Red (full / 512) | Notes |
|---|------|-------------------|------------------|-------|
| 1 | autocannon | `autocannon.png` / `autocannon-512.png` | `autocannon-red.png` / `autocannon-red-512.png` | Twin-barrel turret, clean |
| 2 | heavy_cannon | `heavy_cannon.png` / `heavy_cannon-512.png` | `heavy_cannon-red.png` / `heavy_cannon-red-512.png` | Single huge barrel turret, clean |
| 3 | missile_launcher | `missile_launcher.png` / `missile_launcher-512.png` | `missile_launcher-red.png` / `missile_launcher-red-512.png` | Box pod with tubes, clean |
| 4 | rocket_artillery | `rocket_artillery.png` / `rocket_artillery-512.png` | `rocket_artillery-red.png` / `rocket_artillery-red-512.png` | Multi-rocket rack, clean |
| 5 | railgun | `railgun.png` / `railgun-512.png` | `railgun-red.png` / `railgun-red-512.png` | Long twin-rail barrel, clean; diagonal layout, not strictly vertical |
| 6 | mortar | `mortar.png` / `mortar-512.png` | `mortar-red.png` / `mortar-red-512.png` | REGENERATED — see below |
| 7 | flamethrower | `flamethrower.png` / `flamethrower-512.png` | `flamethrower-red.png` / `flamethrower-red-512.png` | Nozzle + fuel tank, clean; red variant is subtle (only 79 blue-dominant px in the original) |
| 8 | anti_air_cannon | `anti_air_cannon.png` / `anti_air_cannon-512.png` | `anti_air_cannon-red.png` / `anti_air_cannon-red-512.png` | Multi-barrel sky turret, clean |
| 9 | laser | `laser.png` / `laser-512.png` | `laser-red.png` / `laser-red-512.png` | Sleek emitter + glowing crystal, clean; crystal swaps blue→red clearly |
| 10 | siege_cannon | `siege_cannon.png` / `siege_cannon-512.png` | `siege_cannon-red.png` / `siege_cannon-red-512.png` | Massive long siege barrel on carriage, clean — BUT see gap below |
| 11 | melee_weapon | `melee_weapon.png` / `melee_weapon-512.png` | `melee_weapon-red.png` / `melee_weapon-red-512.png` | Mech blade/saw arm, clean |
| 12 | ew_module | `ew_module.png` / `ew_module-512.png` | `ew_module-red.png` / `ew_module-red-512.png` | Antenna/dish jammer array, clean |

All paths are under `~/workspace/surface-wars/assets/sprites/weapons/`.

## Flawed / regenerated classes
- **mortar — contaminated, regenerated once (second pass = last automatic one).**
  The grid slice for mortar (`raw/cells/cell-r1c1.png`) bled in the tip of the
  laser sprite from the row below, appearing as a detached grey fragment under
  the mortar base on the first contact sheet. That raw cell was moved to
  `weapons/raw-flawed/mortar-cell-r1c1.png`.
  Regenerated once with a simplified single-sprite prompt
  (`weapons/raw/mortar-regen.png`, prompt in `weapons/raw/mortar-regen-prompt.txt`).
  Outcome: clean. The second pass renders the mortar as a true top-down
  circular muzzle on a square base rather than the grid's side-ish tube-on-base,
  so it reads slightly differently from the other 11 (which are angled/top-down
  mounted views), but it is a single clean silhouette, has a small blue accent
  that swaps to red, and its dark muzzle interior survived keying because it
  is enclosed, not border-connected. No further regeneration was attempted.
- No other class was regenerated. No class contained text, characters, or UI.
  Media calls used: 2 of 4 allowed (1 grid + 1 mortar regen).

## Honest gaps / caveats
- **siege_cannon-red is visually identical to siege_cannon.** The recolor script
  found 0 blue-dominant pixels in the blue siege cannon (its accents are
  hazard-yellow/gunmetal only), so the red file exists but carries no team-colour
  change. If team distinction matters for this module, it needs a manual red
  accent added — the script alone cannot create one.
- **flamethrower-red is subtle:** only 79 blue-dominant pixels swapped, so the
  red variant differs from blue in just a few small accents.
- **View angle:** the grid's turrets/launchers are rendered as mounted top-down
  views with some foreshortening (railgun and rocket artillery are diagonal),
  not a perfectly flat plan view for every module. Silhouettes are all distinct
  and readable at 512 px and at sheet size.
- **Mortar style mismatch:** see above — the regenerated mortar is more strictly
  top-down than its 11 grid siblings.
- Nothing else is missing: all 12 spec §8 families are present in blue and red,
  full-size and 512, with a labelled contact sheet.
