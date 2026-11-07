# Surface Wars — Sprite Templates, Strict 90° Set (sprites-90)

Date: 2026-10-30. This is a NEW, complete replacement set. It does NOT
overwrite the earlier set in `~/workspace/surface-wars/assets/sprites/`
(that set is preserved untouched). Everything below lives ONLY under
`~/workspace/surface-wars/assets/sprites-90/`. No game code was edited,
nothing was committed, pushed, published, or packaged.

## Scope statement — 19 is NOT the spec count

19 was only the Prototype 01 catalog's invented weapon count
(`data/catalog.json`). It is NOT the spec. The full uploaded spec gives:

- RTS §8: 12 weapon FAMILIES only (no individual weapon names there).
- Expansion Master List §1: 123 NAMED weapons.

Weapons delivered here are therefore **123 named + 12 families = 135
templates**, each blue + red. The 19 catalog weapons map onto family
modules and do not count as spec coverage; non-family catalog cells were
not shipped as spec weapons.

## Hard style gate

Every sprite is a flat plan view: camera directly overhead, looking
straight down, no perspective, no 3/4 view, no side profile, no
front-facing biped, no diagonal/isometric view, no angled shading
implying a tilted camera. Barrels, turrets, hulls, and dishes read as
seen from directly above. That lock was in every generation prompt.

QC rule applied in every category: a diagonal, side-on, front-facing,
or 3/4 sprite was REJECTED and regenerated with a simplified, flatter
prompt — never shipped with a note saying "slightly diagonal". Any class
that still failed would have shipped NO file and been listed
FAILED/MISSING. **Result: 0 FAILED / MISSING in any category.**

Red variants: NOT the old R/B channel swap (which made
siege_cannon-red identical to blue in the old set). Reds were separately
generated (mechs, units) or hue-shifted on the keyed sprite with
saturation/value preserved (structures, weapons), and every red was
verified side-by-side with its blue on a dark-backdrop contact sheet.
No red in this set is indistinguishable from its blue, including
siege_cannon-red and flamethrower-red.

Method (sprite-batch-QC skill): generate on pure black (terrain
full-bleed, no keying), flood-fill key from the borders so dark interior
detail survives, soft edge falloff, trim and re-center on a transparent
square canvas, full size plus a 512×512 LANCZOS `-512` copy. Raws and
prompt records are preserved in each category's `raw/` folder; flawed
cells are in `raw-flawed/`. One labeled contact sheet per category was
built from the `-512` copies on a dark backdrop and visually inspected.

## Totals — parent-verified on disk

| Category | Templates / tiles | Distinct variants (blue+red) | Sprite files (full + -512) | Contact sheet |
|---|---:|---:|---:|---|
| Mechs | 8 chassis | 16 | 32 | [mechs-sheet.png](sandbox://workspace/surface-wars/assets/sprites-90/mechs/mechs-sheet.png) |
| Units | 49 catalog units | 98 | 196 | [units-sheet.png](sandbox://workspace/surface-wars/assets/sprites-90/units/units-sheet.png) |
| Weapons | 135 (123 named + 12 families) | 270 | 540 | [weapons-sheet.png](sandbox://workspace/surface-wars/assets/sprites-90/weapons/weapons-sheet.png) |
| Terrain | 20 tiles | 20 | 40 | [terrain-sheet.png](sandbox://workspace/surface-wars/assets/sprites-90/terrain/terrain-sheet.png) |
| Structures | 23 catalog structures | 46 | 92 | [structures-sheet.png](sandbox://workspace/surface-wars/assets/sprites-90/structures/structures-sheet.png) |
| **Total** | | **450** | **900** | **5 main sheets** |

Parent verification: counted files and distinct variants per folder on
disk (weapons: 135 base slugs, exactly matching the 123 named + 12
families, zero extra, zero missing; all sampled `-512` files are exactly
512×512 RGBA). The 11 extra PNGs first counted in the weapons folder
are additional group/pair sheets, not sprites.

### 1. Mechs — 16/16, 0 failed
Folder: `mechs/` · Report: `mechs/CATEGORY-REPORT.md`
scout, lancer, bulwark, longshot, rampart, vespid, scrapjack, warden —
each blue and red. Reds separately generated, each with a large red
centre marking and/or red trim/lights.
Rejected/regenerated: NONE. Both grids passed first pass; all barrels
point straight up, no bipeds, no cell-border bleed.

### 2. Units — 98/98, 0 failed
Folder: `units/` · Report: `units/CATEGORY-REPORT.md`
All 49 catalog units: scout_buggy, vespid_scout, combat_drone,
radar_scout, salvage_team, repair_scout, sensor_drone, ew_skirmisher,
fast_raider, decoy_drone, medium_tank, heavy_tank, bulwark_mech,
lancer_mech, siege_cannon, longshot_mech, rocket_battery, breach_walker,
mortar_carrier, heavy_railgun, rocket_artillery_mech, siege_engineer,
demolition_crawler, experimental_artillery, interceptor_drone, flak_tank,
missile_carrier, gunship, strike_bomber, transport_aircraft,
drone_carrier, recon_aircraft, construction_vehicle, field_repair_mech,
recovery_crawler, supply_carrier, shield_projector, ew_mech,
command_walker, bridge_layer, combat_engineer, rampart_fortress,
titan_breaker, storm_lance, warden_platform, mobile_foundry,
colossus_engine, command_carrier, drone_swarm — each blue and red.
Reds separately generated and verified numerically (lowest:
vespid_scout-red, 3,394 red-dominant pixels).
Rejected/regenerated (all PASS on a simplified single-sprite pass):
bulwark_mech (blue + red, detached neighbour fragment),
recon_aircraft (blue only, neighbour fragment; red was clean and kept),
combat_engineer (blue + red, neighbour fragments).

### 3. Weapons — 270/270, 0 failed
Folder: `weapons/` · Report: `weapons/CATEGORY-REPORT.md`
Main sheet: `weapons-sheet.png` (all 270, blue/red paired); plus
per-group paired sheets (ballistic, energy, melee, bio-exp, families)
and blue-only group sheets.
- Ballistic (32): Scrapstorm Rotary Gun, Ratchet SMG, Rivet Cannon,
  Twin-Bore Autogun, Widowmaker LMG, Brass Knuckle Cannon, Sawtooth
  Repeater, Hailstorm Minigun, Coil-Feed Carbine, Salvager's Nailgun,
  Breacher-12, Door-Kicker, Furnace Shotgun, Scatterjack, Double-Feed,
  Slugger Cannon, Shredder-8, Backblast Shotgun, Bonecrusher, Maglock
  Shotgun, MULE-40 Grenade Lobber, Burrower Rocket Pod, Cratermaker,
  Scrap Mortar, Clusterbug Launcher, Breach Missile, Siege Nail Driver,
  Thunderclap Autocannon, Hopper Mine Dispenser, Atlas Shoulder
  Howitzer, Furnace Bombard, Ricochet Cannon.
- Energy/plasma (30): Plasma Spitter, Blueglass Rifle, Arc Furnace,
  Sunspot Blaster, Ion Needle, Meltdown Cannon, Plasma Saw, Ghostlight
  Projector, Cindercoil, Starved Reactor, Arc Thrower, Magnetar Cannon,
  EMP Carbine, Tesla Fork, Static Harpoon, Railspike, Storm Cage, Flux
  Hammer, Capacitor Rifle, Blackout Emitter, Redline Laser, Prism Rifle,
  Phase Lance, Mirrorbeam, Null Ray, Helios Projector, Photon Scatterer,
  Afterimage Emitter, Horizon Cutter, Eventide Cannon.
- Melee/industrial (34): Rustfang, Arc Cleaver, Plasma Machete, Monorail
  Blade, Rotary Sawarm, Chain Glaive, Guillotine Arm, Vibroknife, Glass
  Edge, Furnace Sword, Splitter Axe, Phase Cutter, Pile-Driver Fist,
  Wrecking Maul, Seismic Hammer, Anchor Fist, Hydraulic Crusher,
  Bellringer, Corebreaker, Gravity Mallet, Demolition Ram, Foundry
  Sledge, Rebar Bowcaster, Toaster Turret, Forklift Forks, Industrial
  Stapler, Propane Lance, Compressed Junk Cannon, Microwave Emitter,
  Emergency Flare Gun, Concrete Mixer, The Negotiator, Cursed Office
  Printer, Breakroom Special.
- Biological/chemical/corrosive (12): Acid Sprayer, Corrosion Needle,
  Spore Mortar, Leech Harpoon, Rust Cloud Projector, Caustic Foam Gun,
  Furnace Gel Launcher, Cryogenic Mist Cannon, Cryo-Piercer, Toxic Dart
  Array, Nanite Swarm Injector, Biomass Reclaimer.
- Experimental/rare (15): Probability Engine, Echo Rifle, Chrono Spike,
  Phase-Shear Cannon, Blackbox Launcher, Singularity Projector,
  Faultline Driver, Mimic Gun, Entropy Cannon, Ghost Battery, Redshift
  Rifle, Dead Channel, Mirror Core, Scrap Singularity, The Last
  Argument.
- Families (12): autocannon, heavy_cannon, missile_launcher,
  rocket_artillery, railgun, mortar, flamethrower, anti_air_cannon,
  laser, siege_cannon, melee_weapon, ew_module.
Rejected/regenerated (all PASS on one simplified pass): scatterjack
(barrels fanned diagonally → parallel vertical quad-barrel), ion_needle,
null_ray, monorail_blade (near-invisible hairlines → thick readable
bodies), dead_channel (near-invisible dark → thick rifle with blue
lights), coil_feed_carbine (neighbour-bleed line + detached coil →
single connected rifle), door_kicker (neighbour-bleed line → single
connected shotgun). Reds hue-shifted, minimum 2,268 shifted pixels per
sprite (rustfang); siege_cannon-red and flamethrower-red are now
unmistakably red.

### 4. Terrain — 20/20, 0 failed
Folder: `terrain/` · Report: `terrain/CATEGORY-REPORT.md`
14 spec biome tiles (open_wasteland, broken_asphalt_road, urban_ruins,
industrial_complex, rocky_highlands, canyon_ravine,
marsh_contaminated_pool, frozen_irradiated_zone, desert_flats_dunes,
forested_overgrown_ruins, abandoned_military_base,
underground_facility_entrance, river_water_shallow_crossing,
crater_field) plus 6 catalog gameplay types (grass, dirt, bridge,
forest, water, rock). Full-bleed, no keying, no team variants.
Rejected/regenerated (both PASS): canyon_ravine (first pass read as a
tilted cliff face → flat cracked earth with one thin winding crack),
forested_overgrown_ruins (first pass came out as plain sand dunes →
flat round canopies from directly above plus broken stone wall lines).

### 5. Structures — 46/46, 0 failed
Folder: `structures/` · Report: `structures/CATEGORY-REPORT.md`
All 23 catalog structures: command_core, scrap_extractor, power_plant,
advanced_reactor, light_factory, vehicle_factory, mech_bay,
aircraft_hangar, heavy_plant, research_lab, salvage_processor,
repair_depot, radar_station, ammo_depot, logistics_hub,
experimental_facility, light_turret, heavy_turret, aa_turret,
missile_turret, bunker, wall, shield_generator — each blue and red.
Rejected/regenerated: NONE. Radar dish is a true flat circle, all four
turret barrels point straight up.

## Honest gaps — what is still not right or not done

- **Scale:** `-512` files do not preserve relative class scale (a Scout
  and a Rampart are both 512×512). In-game scale must come from game
  data, not the sprite files.
- **Terrain tiling NOT verified:** grid-sliced tiles were not generated
  as wrap-around textures; edge/seam work is needed before repeating
  use. `bridge` is a flat cross-junction of two spans, not a
  single-direction span; `river_water_shallow_crossing` ford is a
  symmetrical cross, not a single natural line. Regenerated terrain
  tiles are 1076×1076 vs 338×338 for main-grid tiles (the `-512` copies
  are uniform, so game-size use is unaffected).
- **Reds with caveats:** structures command_core and bunker shift
  whole-body reddish-brown rather than trim-only (still unambiguously
  red; accent-only reds for those two would need separate red
  generations); wall-red is minimal (9 cyan dots → 9 red dots, 4.8%
  changed-opaque fraction).
- **Mechs:** red Rampart's silhouette diverges from blue Rampart
  (round-plated vs square-plated) — a consequence of separately
  generating reds; both read as a massive siege mech and are
  unambiguously team-coloured, but they are not the same drawing.
  Warden-red has a small vertical protrusion at its bottom edge;
  Vespid's hull ends in pointed prongs. Both still flat top-down.
- **Units:** regenerated bulwark_mech and combat_engineer are simpler
  than their grid siblings. Some parts rotate *within* the plan view
  (salvage_team blue crane arm diagonal, gunship rotor X, EW antenna
  fans) — rotations from overhead, not a tilted camera, retained and
  flagged.
- **Structures:** ammo_depot / logistics_hub yards key transparent
  between parts (terrain shows through — correct for a yard, different
  from solid buildings); light_factory scrap piles and logistics side
  crates are loose islands held only by the whole-alpha bounding box.
- **Weapons:** thin-by-nature weapons (corrosion_needle, leech_harpoon,
  the_negotiator) were kept slim rather than thickened into different
  weapons.
- **Not generated:** no animation frames, damage states, wreck variants,
  projectile/FX frames, or UI icons; no Salvage Clans / Directorate
  skins (blue/red only).
- **Not verified in game:** QC was contact-sheet visual inspection
  only. Sprites are NOT yet wired into the prototype, and there has
  been no phone or real-browser playtest of them in game.
- **No category was silently skipped, and no diagonal sprite was
  shipped.** Every rejected class above is listed with its final PASS
  state; every category totals to its full scope.
