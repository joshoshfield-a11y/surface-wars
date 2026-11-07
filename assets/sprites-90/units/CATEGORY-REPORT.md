# Units — sprites-90 category report

Folder: `~/workspace/surface-wars/assets/sprites-90/units/`
Sheet: `units-sheet.png` (98 sprites, built from the -512 copies on a dark
#141414 backdrop, labels blue then red per class, visually inspected)
Method: sprite-batch-QC skill — black-background generation in grids of 6
(3x2) plus single-sprite generations, sliced with
`tools/key_and_sheet.py` (a copy of the old set's tool; the old folder was
not modified), flood-fill keyed from the borders (near-black < 48, dark
interior detail survives), soft alpha falloff, trimmed and re-centered on a
transparent square canvas with even padding, full size + 512x512 LANCZOS
copy with `-512` suffix. Red variants were generated separately with
explicit red trim/stripes/lights — NO R/B channel swap.

## Totals

- 49 catalog units, blue + red = **98 distinct sprites, 196 files**
  (98 full-size + 98 `-512` copies), plus `units-sheet.png`.
- Every class has all four files: `<slug>.png`, `<slug>-512.png`,
  `<slug>-red.png`, `<slug>-red-512.png`. Verified: no missing files, all
  `-512` files are exactly 512x512, corner alpha is 0 on every keyed file.
- Red distinctness verified numerically: every red file carries thousands
  of red-dominant opaque pixels (lowest: vespid_scout-red 3,394;
  salvage_team-red 3,577), and every red was inspected side-by-side with
  its blue on the sheet. No red is indistinguishable from its blue.
- Old set untouched: nothing was read from, copied from, or written to
  `~/workspace/surface-wars/assets/sprites/`. No game code was edited.
  Nothing was committed, pushed, published, or packaged.

## All 49 units (each in blue and red)

scout_buggy, vespid_scout, combat_drone, radar_scout, salvage_team,
repair_scout, sensor_drone, ew_skirmisher, fast_raider, decoy_drone,
medium_tank, heavy_tank, bulwark_mech, lancer_mech, siege_cannon,
longshot_mech, rocket_battery, breach_walker, mortar_carrier, heavy_railgun,
rocket_artillery_mech, siege_engineer, demolition_crawler,
experimental_artillery, interceptor_drone, flak_tank, missile_carrier,
gunship, strike_bomber, transport_aircraft, drone_carrier, recon_aircraft,
construction_vehicle, field_repair_mech, recovery_crawler, supply_carrier,
shield_projector, ew_mech, command_walker, bridge_layer, combat_engineer,
rampart_fortress, titan_breaker, storm_lance, warden_platform,
mobile_foundry, colossus_engine, command_carrier, drone_swarm.

## Rejected / regenerated — all 5 PASS on second pass

Grid-boundary bleed (a neighbour's tip crossing into the next cell) was
found on visual sheet inspection, not by the component count (many sprites
legitimately have detached wheels, legs, rotors, and drone discs). Flawed
grid cells were copied to `raw-flawed/` and regenerated individually with a
simplified flat prompt; the second pass is the final state for these:

- bulwark_mech (blue) — small detached barrel-tip fragment below the hull.
  PASS: clean flat mech, central turret pointing straight up.
- bulwark_mech-red — small detached square below the hull. PASS: clean
  flat mech, red trim and center stripe.
- recon_aircraft (blue) — thin vertical neighbour fragment at the left
  cell edge (from drone_carrier's side bay). PASS: clean slim jet, nose
  straight up. (recon_aircraft-red was clean in the grid and was kept.)
- combat_engineer (blue) — small vertical neighbour fragment at the left
  cell edge (from bridge_layer). PASS: clean boxy vehicle, tool boxes,
  turret straight up.
- combat_engineer-red — red neighbour fragments at the left cell edge.
  PASS: clean boxy vehicle, red trim and center stripe.

No class was rejected twice, and no class was shipped with a diagonal,
side-on, front-facing, or 3/4 view. FAILED/MISSING: none — 0 of 49 skipped.

## Honest gaps and caveats

- Regenerated bulwark_mech and combat_engineer are simpler and squarer
  than their grid siblings (single-sprite simplified prompts); they read
  clean at game size but are visibly less detailed than, e.g., titan_breaker.
- Plan-view rotation vs camera angle: several sprites have parts angled
  IN the plan view — salvage_team's blue crane arm points diagonally,
  gunship rotor blades form an X, EW antennae fan outward, mobile_foundry's
  crane is diagonal. These are rotations of parts seen from directly
  overhead, not a tilted camera, and were retained; the red salvage_team
  crane points straight up, so the blue/red pair differs slightly in pose.
- `-512` files do not preserve relative class scale (a decoy_drone is
  512px just like colossus_engine); in-game scaling must come from game
  data (catalog `size`), as with the old set.
- No animation, damage, or wreck frames; no Salvage Clans / Directorate
  skins (blue/red only, per the brief); sprites are not wired into the
  game (game code untouched); no in-game playtest — QC was contact-sheet
  visual plus the numeric checks above.
- Drone_swarm is a single composite of seven discs, not seven separate
  sprites; gunship's rotor ring encloses a dark disc (keying keeps
  enclosed black), which reads as the rotor hub on a dark backdrop.
- Raw grids, sliced cells, per-generation JSON sidecars, and
  `raw/PROMPTS.md` (full grid mapping and style lock) are kept in `raw/`;
  flawed cells are in `raw-flawed/`; the keying/sheeting tool copy is in
  `tools/key_and_sheet.py`.
