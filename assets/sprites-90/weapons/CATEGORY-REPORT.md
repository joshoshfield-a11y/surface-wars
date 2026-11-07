# Weapons — sprites-90 (CATEGORY REPORT)

## Scope correction, stated explicitly

**19 is NOT the spec count.** 19 was only the Prototype 01 catalog's weapon
count (`data/catalog.json`). The full spec lists RTS §8 as 12 weapon
FAMILIES only, plus Expansion Master List §1 with **123 NAMED weapons**.
This category therefore delivers **123 named + 12 families = 135 weapon
templates**, each blue + red = 270 sprites (540 files: full size + `-512`
copy each). The 19 catalog weapons do NOT count as spec coverage; the
only catalog-derived files kept here are the 12 family modules promoted
from the earlier catalog grids, and the non-family catalog cells were
NOT shipped as separate sprites.

## Totals

- 135 templates × blue + red = 270 sprites, 540 files
  (`<slug>.png`, `<slug>-512.png`, `<slug>-red.png`, `<slug>-red-512.png`)
- 0 FAILED / MISSING. Every one of the 135 templates shipped.
- Contact sheets (dark backdrop, from `-512` copies, blue/red paired
  side-by-side): `weapons-sheet.png` (all 270, cols 10) plus per-group
  paired sheets `weapons-sheet-ballistic-pairs.png`,
  `weapons-sheet-energy-pairs.png`, `weapons-sheet-melee-pairs.png`,
  `weapons-sheet-bio-exp-pairs.png`, `weapons-sheet-families-pairs.png`,
  and blue-only group sheets `sheet-ballistic.png`, `sheet-energy.png`,
  `sheet-melee.png`, `sheet-bio-exp.png`, `sheet-families.png`,
  `sheet-regen.png` (the 7 regenerations).
- QC checks run: every sprite viewed on a contact sheet; corner alpha = 0
  on all 270 game-size files; no text, letters, UI, or watermarks seen.
- Raw generations + prompt record: `raw/` (grid webp files, sliced cells,
  `raw/named-blue/`, `raw/families-blue/`, `prompts.txt`). Flawed grid
  cells preserved in `raw-flawed/`. Keying/sheeting tool copied (not
  modified in place) as `key_and_sheet.py` in this folder.
- Nothing else touched: no game code edited, no files written outside
  `~/workspace/surface-wars/assets/sprites-90/weapons/`, the old
  `assets/sprites/` set untouched, nothing committed/pushed/published.

## Method

Per the sprite-batch-QC skill: generated on pure black in small 3×2
batches (never 135 in one grid), sliced, flood-fill keyed from the
borders through near-black pixels (dark interior detail survives, e.g.
mortar/siege muzzle interiors stay black), soft alpha falloff, trimmed
and re-centered on a transparent square canvas with even padding, full
size + 512×512 LANCZOS `-512` copy. Hard style gate in every prompt:
flat plan view, camera directly overhead at 90°, no perspective, no
3/4, no side profile, no diagonal/isometric view; long weapons point
straight up.

Red variants: NOT an R/B channel swap (the old set's swap made
siege_cannon-red identical to blue). Blues' blue/cyan accent pixels were
hue-shifted to red in HSV (hue 110–195 → 0, saturation/value preserved)
on the keyed sprite. Measured shift per sprite: minimum 2,268 pixels
(rustfang), so every red is visibly distinct; verified side-by-side on
the paired sheets — including siege_cannon-red and flamethrower-red,
the two failures of the old set.

## The 12 family modules

autocannon, heavy_cannon, missile_launcher, rocket_artillery, railgun,
mortar, flamethrower, anti_air_cannon, laser, siege_cannon, melee_weapon,
ew_module — all PASS. siege_cannon was rotated 180° from its grid cell so
its muzzle points up like the others.

## The 123 named weapons

Ballistic (32): scrapstorm_rotary_gun, ratchet_smg, rivet_cannon,
twin_bore_autogun, widowmaker_lmg, brass_knuckle_cannon,
sawtooth_repeater, hailstorm_minigun, coil_feed_carbine,
salvagers_nailgun, breacher_12, door_kicker, furnace_shotgun,
scatterjack, double_feed, slugger_cannon, shredder_8,
backblast_shotgun, bonecrusher, maglock_shotgun,
mule_40_grenade_lobber, burrower_rocket_pod, cratermaker, scrap_mortar,
clusterbug_launcher, breach_missile, siege_nail_driver,
thunderclap_autocannon, hopper_mine_dispenser,
atlas_shoulder_howitzer, furnace_bombard, ricochet_cannon.

Energy/plasma (30): plasma_spitter, blueglass_rifle, arc_furnace,
sunspot_blaster, ion_needle, meltdown_cannon, plasma_saw,
ghostlight_projector, cindercoil, starved_reactor, arc_thrower,
magnetar_cannon, emp_carbine, tesla_fork, static_harpoon, railspike,
storm_cage, flux_hammer, capacitor_rifle, blackout_emitter,
redline_laser, prism_rifle, phase_lance, mirrorbeam, null_ray,
helios_projector, photon_scatterer, afterimage_emitter,
horizon_cutter, eventide_cannon.

Melee/industrial (34): rustfang, arc_cleaver, plasma_machete,
monorail_blade, rotary_sawarm, chain_glaive, guillotine_arm,
vibroknife, glass_edge, furnace_sword, splitter_axe, phase_cutter,
pile_driver_fist, wrecking_maul, seismic_hammer, anchor_fist,
hydraulic_crusher, bellringer, corebreaker, gravity_mallet,
demolition_ram, foundry_sledge, rebar_bowcaster, toaster_turret,
forklift_forks, industrial_stapler, propane_lance,
compressed_junk_cannon, microwave_emitter, emergency_flare_gun,
concrete_mixer, the_negotiator, cursed_office_printer,
breakroom_special.

Biological/chemical/corrosive (12): acid_sprayer, corrosion_needle,
spore_mortar, leech_harpoon, rust_cloud_projector, caustic_foam_gun,
furnace_gel_launcher, cryogenic_mist_cannon, cryo_piercer,
toxic_dart_array, nanite_swarm_injector, biomass_reclaimer.

Experimental/rare (15): probability_engine, echo_rifle, chrono_spike,
phase_shear_cannon, blackbox_launcher, singularity_projector,
faultline_driver, mimic_gun, entropy_cannon, ghost_battery,
redshift_rifle, dead_channel, mirror_core, scrap_singularity,
the_last_argument.

## Rejected / regenerated (all 7 PASS on the single second pass)

- scatterjack — grid version fanned its barrels diagonally outward.
  Regen: square quad-barrel device, all barrels parallel and vertical.
- ion_needle — grid version was a near-invisible hairline. Regen: thick
  body with base block and a short needle barrel.
- null_ray — grid version was a near-invisible hairline. Regen: thick
  dark rifle body with blue lights.
- monorail_blade — grid version was a near-invisible hairline. Regen:
  thick vertical rail blade with handle block and blue lights.
- dead_channel — grid version was very dark and near-invisible. Regen:
  thick dark rifle with bright blue lights.
- coil_feed_carbine — grid cell contained a stray vertical line (neighbour
  bleed) and a coil detached from the rifle. Regen: one single connected
  rifle with coil loop attached, no stray lines.
- door_kicker — grid cell contained a stray vertical line (neighbour
  bleed). Regen: one single connected shotgun, no stray lines.

Per the skill, the second pass was the last automatic one; all 7 passed
it, so no class was left FAILED/MISSING.

## Honest gaps / caveats

- Guns lying flat viewed from above necessarily show a gun-shaped
  silhouette; that is the flat plan view of a lying weapon, not a
  side-profile camera view. Rebar_bowcaster's bow limbs curve sideways
  in the plane (a bow's plan shape), likewise not a tilted camera.
- Thin-by-nature weapons (corrosion_needle, leech_harpoon,
  the_negotiator, cryo_piercer) are slim but legible; they were kept
  rather than thickened into a different weapon.
- Seismic_hammer / gravity_mallet carry large flat shockwave/gravity
  rings, and afterimage_emitter carries overlapping ghost rings; these
  are flat-plane effect marks, not perspective.
- `-512` files do not preserve relative scale between templates (a
  needle and a siege cannon are both 512 px); in-game scale must come
  from game data, as with the old set.
- No animation, damage, wreck, projectile, or FX frames; no
  Salvage Clans / Directorate skins (blue/red team variants only).
- QC was contact-sheet visual only; no in-game playtest, and sprites
  are NOT wired into the prototype.
- Reds are painted (hue-shifted accents) rather than separately
  generated images; this is the task's permitted alternative, and the
  pixel counts + paired sheets prove the distinction is real.
