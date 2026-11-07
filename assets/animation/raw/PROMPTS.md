# Animation set — generation prompts (record)

Method: same as sprites-90 (sprite-batch-QC): generate on pure black,
flood-fill key from borders (near-black < 48, dark interior detail survives),
soft alpha falloff, trim + re-centre on a transparent square canvas,
full size + 512x512 LANCZOS `-512` copy. Wreck full-size canvases are
additionally rescaled to a target side of `320 + catalog_size*380` so the
catalog size class is visible in the full-size files (scout 0.3–0.4 →
434–472px, colossus 1.2 → 776px); `-512` copies normalise as in sprites-90.

Common style lock in every prompt: pixel-art game sprite, strict flat
top-down plan view, camera directly overhead, no perspective, no 3/4 view,
no side view, no diagonal camera angle, pure solid black background,
no ground, no text, no labels, no grid lines.

## Wrecks (grids 01–08, 3x2, row-major; + 1 single)

Team-neutral scrap lock in every wreck prompt: burnt, blackened, twisted
metal, broken hulls, scattered debris, dull rust-grey and charred black
with faint orange rust patches, no bright team colours, no intact turret,
no intact barrel pointing up, no flames, no smoke.

- grid-01: scout_buggy (small 4-wheel buggy, crumpled frame, wheel detached),
  vespid_scout, combat_drone (tiny cracked disc), radar_scout (snapped dish),
  salvage_team (bent crane arm flat), repair_scout (broken tool boxes).
- grid-02: sensor_drone, ew_skirmisher (snapped antennae), fast_raider,
  decoy_drone, medium_tank (broken tracks, turret shattered), heavy_tank.
- grid-03: bulwark_mech (legs splayed flat, torso cracked), lancer_mech,
  siege_cannon (barrel snapped in half), longshot_mech, rocket_battery
  (tubes cracked/askew), breach_walker.
- grid-04: mortar_carrier (tube bent), heavy_railgun (rails snapped/twisted),
  rocket_artillery_mech (pods split), siege_engineer, demolition_crawler,
  experimental_artillery (oversized gun housing cracked).
- grid-05: interceptor_drone, flak_tank (twin barrels snapped),
  missile_carrier, gunship (plan view, rotors snapped/splayed),
  strike_bomber (plan view, wings cracked), transport_aircraft (plan view).
- grid-06: drone_carrier (deck cracked), recon_aircraft (plan view, slim),
  construction_vehicle (crane arm flat), field_repair_mech,
  recovery_crawler (tow arm bent), supply_carrier (crates scattered).
- grid-07: shield_projector (dish cracked), ew_mech (antenna array snapped),
  command_walker, bridge_layer (bridge sections broken/askew),
  combat_engineer, rampart_fortress (massive base cracked).
- grid-08: titan_breaker, storm_lance (lance snapped), warden_platform,
  mobile_foundry (smelter housing cracked), colossus_engine (twin housings
  split, barrels snapped), command_carrier.
- single drone_swarm: scattered cluster of many tiny broken drone discs.

## FX

- grid-a (3x2): smoke_1 (thin light wisp) → smoke_2 (medium puff) →
  smoke_3 (heavy billowing dark cloud); fire_1 (small burst) → fire_2
  (medium, yellow core) → fire_3 (large, yellow core, orange/red tongues).
- grid-b (3x2): muzzle_1 (small starburst) → muzzle_2 (medium) →
  muzzle_3 (large, white core, long spikes); explosion_1 (small fireball)
  → explosion_2 (medium, smoke at rim) → explosion_3 (large, orange/red,
  shrinking yellow core).
- singles: explosion_4 (final frame: dispersing dark smoke, few dying
  embers); dust_1 (small tan puff); dust_2 (larger spreading tan puff).

## Projectiles (one 2x2 grid, all nose-up)

kinetic_tracer (thin bright cyan-white bolt), missile (small grey rocket,
red tip, fins, exhaust glow), energy_bolt (blue-white orb + trail below),
flame (teardrop fireball, point up).

## Canopy (one 3x2 grid, row-major)

canopy_single (one small cluster of 3–4 crowns), canopy_dense (full tile
of overlapping crowns), canopy_edge_n (foliage top half only),
canopy_edge_s (bottom half only), canopy_edge_e (right half only),
canopy_edge_w (left half only). Overhead crowns only, no side-view trees.
Processing note: the generator laid the grid out as a free arrangement
rather than strict equal cells, but each tile's foliage fell inside its
equal 3x2 cell; canopy cells were sliced at 0% inset (edge foliage must
not be clipped) and each tile's foliage was re-anchored flush to its
named edge on a 640px square canvas (single centred, dense full-cell).
