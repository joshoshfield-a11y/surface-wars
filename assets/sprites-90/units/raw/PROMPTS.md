# Units — prompt record (sprites-90)

Style lock used in EVERY generation prompt, verbatim in intent:
"STRICT 90 DEGREE TOP-DOWN PLAN VIEW ONLY: camera directly overhead looking
straight down, flat plan view, no perspective, no 3/4 view, no side profile,
no front-facing biped, no diagonal or isometric view, no angled shading
implying a tilted camera."
Plus, per call: one grid (3 columns x 2 rows, 6 sprites) or one single sprite,
each centered alone in its cell on a pure black background, no text, no labels,
no UI, no watermark, no grid lines, industrial scrap-metal sci-fi style,
gunmetal/dark-steel hulls, blue team accents (blue grids) or bright red trim /
red center stripes / red lights / red markings on every sprite (red grids).
Red variants were generated separately — NO R/B channel swap was used.

Grid mapping (row-major, left to right, top row then bottom row):
- grid-blue-01 / grid-red-01: scout_buggy, vespid_scout, combat_drone,
  radar_scout, salvage_team, repair_scout
- grid-blue-02 / grid-red-02: sensor_drone, ew_skirmisher, fast_raider,
  decoy_drone, medium_tank, heavy_tank
- grid-blue-03 / grid-red-03: bulwark_mech, lancer_mech, siege_cannon,
  longshot_mech, rocket_battery, breach_walker
- grid-blue-04 / grid-red-04: mortar_carrier, heavy_railgun,
  rocket_artillery_mech, siege_engineer, demolition_crawler,
  experimental_artillery
- grid-blue-05 / grid-red-05: interceptor_drone, flak_tank, missile_carrier,
  gunship, strike_bomber, transport_aircraft
- grid-blue-06 / grid-red-06: drone_carrier, recon_aircraft,
  construction_vehicle, field_repair_mech, recovery_crawler, supply_carrier
- grid-blue-07 / grid-red-07: shield_projector, ew_mech, command_walker,
  bridge_layer, combat_engineer, rampart_fortress
- grid-blue-08 / grid-red-08: titan_breaker, storm_lance, warden_platform,
  mobile_foundry, colossus_engine, command_carrier
- single drone_swarm-blue / drone_swarm-red: one cluster of seven small flat
  disc drones in a hexagon around a larger central drone.

Regenerations (simplified single-sprite prompts, same style lock, wide empty
black margins, one object only, no fragments):
- regen-bulwark-blue, regen-bulwark-red: bulky flat mech, central cannon
  turret pointing straight up.
- regen-recon-blue: small slim recon jet flat from above, nose straight up.
- regen-combat-eng-blue, regen-combat-eng-red: small boxy engineer vehicle,
  tool boxes flat on deck, small turret pointing straight up.

Processing: grids sliced 3x2 with tools/key_and_sheet.py (2% inset trim);
cells and singles flood-fill keyed from borders through near-black
(max RGB < 48), soft alpha falloff (Gaussian radius 1.0), trimmed to alpha
bbox, re-centered on a transparent square canvas with even padding, written
full-size plus a 512x512 LANCZOS copy (-512 suffix). Raws were never edited
in place; flawed grid cells were copied to raw-flawed/ before regeneration.
The media tool's per-generation JSON sidecars sit beside the grid PNGs in raw/.
