# Surface Wars — ALL-SPRITES-INDEX

Every individual sprite across all sets, by path. Older sets are indexed, not copied: nothing under `assets/sprites-90/` or `assets/tiles-overlay/` was moved or duplicated into `assets/animation/`. Paths are relative to `~/workspace/surface-wars/`. Each distinct sprite has a full-size file and a `-512` copy (512x512); blue/red sets additionally have `-red` and `-red-512` files.

## Totals
| Set | Base sprites | Variants each | Files (incl. -512) |
|---|---:|---:|---:|
| Catalog units (sprites-90/units) | 49 | 2 | 196 |
| Spec chassis (sprites-90/mechs) | 8 | 2 | 32 |
| Expansion chassis (sprites-90/mechs-expansion) | 63 | 2 | 252 |
| Weapons (sprites-90/weapons) | 135 | 2 | 540 |
| Structures (sprites-90/structures) | 23 | 2 | 92 |
| Terrain tiles (sprites-90/terrain) | 20 | 1 | 40 |
| Overlay base tiles (tiles-overlay/base) | 42 | 1 | 84 |
| Overlay tiles (tiles-overlay/overlays) | 123 | 1 | 246 |
| Wrecks (animation/wrecks) | 49 | 1 | 98 |
| FX (animation/fx) | 15 | 1 | 30 |
| Projectiles (animation/projectiles) | 4 | 1 | 8 |
| Forest canopy (animation/canopy) | 6 | 1 | 12 |
| **Total (base sprites)** | **537** | | **1630** |

Counting blue and red as separate variants, the variant-distinct total is 815 (556 blue/red variants + 259 single-variant sprites); file total 1630 counts every full-size file, every `-512` copy, and every `-red`/`-red-512` file. Contact sheets are extra and not counted in the file total.

Animation contact sheets: [wrecks-sheet.png](sandbox://workspace/surface-wars/assets/animation/wrecks-sheet.png), [fx-sheet.png](sandbox://workspace/surface-wars/assets/animation/fx-sheet.png), [projectiles-sheet.png](sandbox://workspace/surface-wars/assets/animation/projectiles-sheet.png), [canopy-sheet.png](sandbox://workspace/surface-wars/assets/animation/canopy-sheet.png). Animation manifest: `assets/animation/ANIMATION-MANIFEST.json`. Animation report: `assets/animation/ANIMATION-SPRITES-REPORT.md`.

## Catalog units — 49 x blue/red

- `breach_walker`: `assets/sprites-90/units/breach_walker.png`, `assets/sprites-90/units/breach_walker-512.png`, `assets/sprites-90/units/breach_walker-red.png`, `assets/sprites-90/units/breach_walker-red-512.png`
- `bridge_layer`: `assets/sprites-90/units/bridge_layer.png`, `assets/sprites-90/units/bridge_layer-512.png`, `assets/sprites-90/units/bridge_layer-red.png`, `assets/sprites-90/units/bridge_layer-red-512.png`
- `bulwark_mech`: `assets/sprites-90/units/bulwark_mech.png`, `assets/sprites-90/units/bulwark_mech-512.png`, `assets/sprites-90/units/bulwark_mech-red.png`, `assets/sprites-90/units/bulwark_mech-red-512.png`
- `colossus_engine`: `assets/sprites-90/units/colossus_engine.png`, `assets/sprites-90/units/colossus_engine-512.png`, `assets/sprites-90/units/colossus_engine-red.png`, `assets/sprites-90/units/colossus_engine-red-512.png`
- `combat_drone`: `assets/sprites-90/units/combat_drone.png`, `assets/sprites-90/units/combat_drone-512.png`, `assets/sprites-90/units/combat_drone-red.png`, `assets/sprites-90/units/combat_drone-red-512.png`
- `combat_engineer`: `assets/sprites-90/units/combat_engineer.png`, `assets/sprites-90/units/combat_engineer-512.png`, `assets/sprites-90/units/combat_engineer-red.png`, `assets/sprites-90/units/combat_engineer-red-512.png`
- `command_carrier`: `assets/sprites-90/units/command_carrier.png`, `assets/sprites-90/units/command_carrier-512.png`, `assets/sprites-90/units/command_carrier-red.png`, `assets/sprites-90/units/command_carrier-red-512.png`
- `command_walker`: `assets/sprites-90/units/command_walker.png`, `assets/sprites-90/units/command_walker-512.png`, `assets/sprites-90/units/command_walker-red.png`, `assets/sprites-90/units/command_walker-red-512.png`
- `construction_vehicle`: `assets/sprites-90/units/construction_vehicle.png`, `assets/sprites-90/units/construction_vehicle-512.png`, `assets/sprites-90/units/construction_vehicle-red.png`, `assets/sprites-90/units/construction_vehicle-red-512.png`
- `decoy_drone`: `assets/sprites-90/units/decoy_drone.png`, `assets/sprites-90/units/decoy_drone-512.png`, `assets/sprites-90/units/decoy_drone-red.png`, `assets/sprites-90/units/decoy_drone-red-512.png`
- `demolition_crawler`: `assets/sprites-90/units/demolition_crawler.png`, `assets/sprites-90/units/demolition_crawler-512.png`, `assets/sprites-90/units/demolition_crawler-red.png`, `assets/sprites-90/units/demolition_crawler-red-512.png`
- `drone_carrier`: `assets/sprites-90/units/drone_carrier.png`, `assets/sprites-90/units/drone_carrier-512.png`, `assets/sprites-90/units/drone_carrier-red.png`, `assets/sprites-90/units/drone_carrier-red-512.png`
- `drone_swarm`: `assets/sprites-90/units/drone_swarm.png`, `assets/sprites-90/units/drone_swarm-512.png`, `assets/sprites-90/units/drone_swarm-red.png`, `assets/sprites-90/units/drone_swarm-red-512.png`
- `ew_mech`: `assets/sprites-90/units/ew_mech.png`, `assets/sprites-90/units/ew_mech-512.png`, `assets/sprites-90/units/ew_mech-red.png`, `assets/sprites-90/units/ew_mech-red-512.png`
- `ew_skirmisher`: `assets/sprites-90/units/ew_skirmisher.png`, `assets/sprites-90/units/ew_skirmisher-512.png`, `assets/sprites-90/units/ew_skirmisher-red.png`, `assets/sprites-90/units/ew_skirmisher-red-512.png`
- `experimental_artillery`: `assets/sprites-90/units/experimental_artillery.png`, `assets/sprites-90/units/experimental_artillery-512.png`, `assets/sprites-90/units/experimental_artillery-red.png`, `assets/sprites-90/units/experimental_artillery-red-512.png`
- `fast_raider`: `assets/sprites-90/units/fast_raider.png`, `assets/sprites-90/units/fast_raider-512.png`, `assets/sprites-90/units/fast_raider-red.png`, `assets/sprites-90/units/fast_raider-red-512.png`
- `field_repair_mech`: `assets/sprites-90/units/field_repair_mech.png`, `assets/sprites-90/units/field_repair_mech-512.png`, `assets/sprites-90/units/field_repair_mech-red.png`, `assets/sprites-90/units/field_repair_mech-red-512.png`
- `flak_tank`: `assets/sprites-90/units/flak_tank.png`, `assets/sprites-90/units/flak_tank-512.png`, `assets/sprites-90/units/flak_tank-red.png`, `assets/sprites-90/units/flak_tank-red-512.png`
- `gunship`: `assets/sprites-90/units/gunship.png`, `assets/sprites-90/units/gunship-512.png`, `assets/sprites-90/units/gunship-red.png`, `assets/sprites-90/units/gunship-red-512.png`
- `heavy_railgun`: `assets/sprites-90/units/heavy_railgun.png`, `assets/sprites-90/units/heavy_railgun-512.png`, `assets/sprites-90/units/heavy_railgun-red.png`, `assets/sprites-90/units/heavy_railgun-red-512.png`
- `heavy_tank`: `assets/sprites-90/units/heavy_tank.png`, `assets/sprites-90/units/heavy_tank-512.png`, `assets/sprites-90/units/heavy_tank-red.png`, `assets/sprites-90/units/heavy_tank-red-512.png`
- `interceptor_drone`: `assets/sprites-90/units/interceptor_drone.png`, `assets/sprites-90/units/interceptor_drone-512.png`, `assets/sprites-90/units/interceptor_drone-red.png`, `assets/sprites-90/units/interceptor_drone-red-512.png`
- `lancer_mech`: `assets/sprites-90/units/lancer_mech.png`, `assets/sprites-90/units/lancer_mech-512.png`, `assets/sprites-90/units/lancer_mech-red.png`, `assets/sprites-90/units/lancer_mech-red-512.png`
- `longshot_mech`: `assets/sprites-90/units/longshot_mech.png`, `assets/sprites-90/units/longshot_mech-512.png`, `assets/sprites-90/units/longshot_mech-red.png`, `assets/sprites-90/units/longshot_mech-red-512.png`
- `medium_tank`: `assets/sprites-90/units/medium_tank.png`, `assets/sprites-90/units/medium_tank-512.png`, `assets/sprites-90/units/medium_tank-red.png`, `assets/sprites-90/units/medium_tank-red-512.png`
- `missile_carrier`: `assets/sprites-90/units/missile_carrier.png`, `assets/sprites-90/units/missile_carrier-512.png`, `assets/sprites-90/units/missile_carrier-red.png`, `assets/sprites-90/units/missile_carrier-red-512.png`
- `mobile_foundry`: `assets/sprites-90/units/mobile_foundry.png`, `assets/sprites-90/units/mobile_foundry-512.png`, `assets/sprites-90/units/mobile_foundry-red.png`, `assets/sprites-90/units/mobile_foundry-red-512.png`
- `mortar_carrier`: `assets/sprites-90/units/mortar_carrier.png`, `assets/sprites-90/units/mortar_carrier-512.png`, `assets/sprites-90/units/mortar_carrier-red.png`, `assets/sprites-90/units/mortar_carrier-red-512.png`
- `radar_scout`: `assets/sprites-90/units/radar_scout.png`, `assets/sprites-90/units/radar_scout-512.png`, `assets/sprites-90/units/radar_scout-red.png`, `assets/sprites-90/units/radar_scout-red-512.png`
- `rampart_fortress`: `assets/sprites-90/units/rampart_fortress.png`, `assets/sprites-90/units/rampart_fortress-512.png`, `assets/sprites-90/units/rampart_fortress-red.png`, `assets/sprites-90/units/rampart_fortress-red-512.png`
- `recon_aircraft`: `assets/sprites-90/units/recon_aircraft.png`, `assets/sprites-90/units/recon_aircraft-512.png`, `assets/sprites-90/units/recon_aircraft-red.png`, `assets/sprites-90/units/recon_aircraft-red-512.png`
- `recovery_crawler`: `assets/sprites-90/units/recovery_crawler.png`, `assets/sprites-90/units/recovery_crawler-512.png`, `assets/sprites-90/units/recovery_crawler-red.png`, `assets/sprites-90/units/recovery_crawler-red-512.png`
- `repair_scout`: `assets/sprites-90/units/repair_scout.png`, `assets/sprites-90/units/repair_scout-512.png`, `assets/sprites-90/units/repair_scout-red.png`, `assets/sprites-90/units/repair_scout-red-512.png`
- `rocket_artillery_mech`: `assets/sprites-90/units/rocket_artillery_mech.png`, `assets/sprites-90/units/rocket_artillery_mech-512.png`, `assets/sprites-90/units/rocket_artillery_mech-red.png`, `assets/sprites-90/units/rocket_artillery_mech-red-512.png`
- `rocket_battery`: `assets/sprites-90/units/rocket_battery.png`, `assets/sprites-90/units/rocket_battery-512.png`, `assets/sprites-90/units/rocket_battery-red.png`, `assets/sprites-90/units/rocket_battery-red-512.png`
- `salvage_team`: `assets/sprites-90/units/salvage_team.png`, `assets/sprites-90/units/salvage_team-512.png`, `assets/sprites-90/units/salvage_team-red.png`, `assets/sprites-90/units/salvage_team-red-512.png`
- `scout_buggy`: `assets/sprites-90/units/scout_buggy.png`, `assets/sprites-90/units/scout_buggy-512.png`, `assets/sprites-90/units/scout_buggy-red.png`, `assets/sprites-90/units/scout_buggy-red-512.png`
- `sensor_drone`: `assets/sprites-90/units/sensor_drone.png`, `assets/sprites-90/units/sensor_drone-512.png`, `assets/sprites-90/units/sensor_drone-red.png`, `assets/sprites-90/units/sensor_drone-red-512.png`
- `shield_projector`: `assets/sprites-90/units/shield_projector.png`, `assets/sprites-90/units/shield_projector-512.png`, `assets/sprites-90/units/shield_projector-red.png`, `assets/sprites-90/units/shield_projector-red-512.png`
- `siege_cannon`: `assets/sprites-90/units/siege_cannon.png`, `assets/sprites-90/units/siege_cannon-512.png`, `assets/sprites-90/units/siege_cannon-red.png`, `assets/sprites-90/units/siege_cannon-red-512.png`
- `siege_engineer`: `assets/sprites-90/units/siege_engineer.png`, `assets/sprites-90/units/siege_engineer-512.png`, `assets/sprites-90/units/siege_engineer-red.png`, `assets/sprites-90/units/siege_engineer-red-512.png`
- `storm_lance`: `assets/sprites-90/units/storm_lance.png`, `assets/sprites-90/units/storm_lance-512.png`, `assets/sprites-90/units/storm_lance-red.png`, `assets/sprites-90/units/storm_lance-red-512.png`
- `strike_bomber`: `assets/sprites-90/units/strike_bomber.png`, `assets/sprites-90/units/strike_bomber-512.png`, `assets/sprites-90/units/strike_bomber-red.png`, `assets/sprites-90/units/strike_bomber-red-512.png`
- `supply_carrier`: `assets/sprites-90/units/supply_carrier.png`, `assets/sprites-90/units/supply_carrier-512.png`, `assets/sprites-90/units/supply_carrier-red.png`, `assets/sprites-90/units/supply_carrier-red-512.png`
- `titan_breaker`: `assets/sprites-90/units/titan_breaker.png`, `assets/sprites-90/units/titan_breaker-512.png`, `assets/sprites-90/units/titan_breaker-red.png`, `assets/sprites-90/units/titan_breaker-red-512.png`
- `transport_aircraft`: `assets/sprites-90/units/transport_aircraft.png`, `assets/sprites-90/units/transport_aircraft-512.png`, `assets/sprites-90/units/transport_aircraft-red.png`, `assets/sprites-90/units/transport_aircraft-red-512.png`
- `vespid_scout`: `assets/sprites-90/units/vespid_scout.png`, `assets/sprites-90/units/vespid_scout-512.png`, `assets/sprites-90/units/vespid_scout-red.png`, `assets/sprites-90/units/vespid_scout-red-512.png`
- `warden_platform`: `assets/sprites-90/units/warden_platform.png`, `assets/sprites-90/units/warden_platform-512.png`, `assets/sprites-90/units/warden_platform-red.png`, `assets/sprites-90/units/warden_platform-red-512.png`

## Spec chassis — 8 x blue/red

- `bulwark`: `assets/sprites-90/mechs/bulwark.png`, `assets/sprites-90/mechs/bulwark-512.png`, `assets/sprites-90/mechs/bulwark-red.png`, `assets/sprites-90/mechs/bulwark-red-512.png`
- `lancer`: `assets/sprites-90/mechs/lancer.png`, `assets/sprites-90/mechs/lancer-512.png`, `assets/sprites-90/mechs/lancer-red.png`, `assets/sprites-90/mechs/lancer-red-512.png`
- `longshot`: `assets/sprites-90/mechs/longshot.png`, `assets/sprites-90/mechs/longshot-512.png`, `assets/sprites-90/mechs/longshot-red.png`, `assets/sprites-90/mechs/longshot-red-512.png`
- `rampart`: `assets/sprites-90/mechs/rampart.png`, `assets/sprites-90/mechs/rampart-512.png`, `assets/sprites-90/mechs/rampart-red.png`, `assets/sprites-90/mechs/rampart-red-512.png`
- `scout`: `assets/sprites-90/mechs/scout.png`, `assets/sprites-90/mechs/scout-512.png`, `assets/sprites-90/mechs/scout-red.png`, `assets/sprites-90/mechs/scout-red-512.png`
- `scrapjack`: `assets/sprites-90/mechs/scrapjack.png`, `assets/sprites-90/mechs/scrapjack-512.png`, `assets/sprites-90/mechs/scrapjack-red.png`, `assets/sprites-90/mechs/scrapjack-red-512.png`
- `vespid`: `assets/sprites-90/mechs/vespid.png`, `assets/sprites-90/mechs/vespid-512.png`, `assets/sprites-90/mechs/vespid-red.png`, `assets/sprites-90/mechs/vespid-red-512.png`
- `warden`: `assets/sprites-90/mechs/warden.png`, `assets/sprites-90/mechs/warden-512.png`, `assets/sprites-90/mechs/warden-red.png`, `assets/sprites-90/mechs/warden-red-512.png`

## Expansion chassis — 63 x blue/red

- `amphibian`: `assets/sprites-90/mechs-expansion/additional/amphibian.png`, `assets/sprites-90/mechs-expansion/additional/amphibian-512.png`, `assets/sprites-90/mechs-expansion/additional/amphibian-red.png`, `assets/sprites-90/mechs-expansion/additional/amphibian-red-512.png`
- `artificer`: `assets/sprites-90/mechs-expansion/additional/artificer.png`, `assets/sprites-90/mechs-expansion/additional/artificer-512.png`, `assets/sprites-90/mechs-expansion/additional/artificer-red.png`, `assets/sprites-90/mechs-expansion/additional/artificer-red-512.png`
- `bastard_king`: `assets/sprites-90/mechs-expansion/additional/bastard_king.png`, `assets/sprites-90/mechs-expansion/additional/bastard_king-512.png`, `assets/sprites-90/mechs-expansion/additional/bastard_king-red.png`, `assets/sprites-90/mechs-expansion/additional/bastard_king-red-512.png`
- `bastille`: `assets/sprites-90/mechs-expansion/additional/bastille.png`, `assets/sprites-90/mechs-expansion/additional/bastille-512.png`, `assets/sprites-90/mechs-expansion/additional/bastille-red.png`, `assets/sprites-90/mechs-expansion/additional/bastille-red-512.png`
- `burrower`: `assets/sprites-90/mechs-expansion/additional/burrower.png`, `assets/sprites-90/mechs-expansion/additional/burrower-512.png`, `assets/sprites-90/mechs-expansion/additional/burrower-red.png`, `assets/sprites-90/mechs-expansion/additional/burrower-red-512.png`
- `chronomancer`: `assets/sprites-90/mechs-expansion/additional/chronomancer.png`, `assets/sprites-90/mechs-expansion/additional/chronomancer-512.png`, `assets/sprites-90/mechs-expansion/additional/chronomancer-red.png`, `assets/sprites-90/mechs-expansion/additional/chronomancer-red-512.png`
- `coilrunner`: `assets/sprites-90/mechs-expansion/additional/coilrunner.png`, `assets/sprites-90/mechs-expansion/additional/coilrunner-512.png`, `assets/sprites-90/mechs-expansion/additional/coilrunner-red.png`, `assets/sprites-90/mechs-expansion/additional/coilrunner-red-512.png`
- `corsair`: `assets/sprites-90/mechs-expansion/additional/corsair.png`, `assets/sprites-90/mechs-expansion/additional/corsair-512.png`, `assets/sprites-90/mechs-expansion/additional/corsair-red.png`, `assets/sprites-90/mechs-expansion/additional/corsair-red-512.png`
- `dronewright`: `assets/sprites-90/mechs-expansion/additional/dronewright.png`, `assets/sprites-90/mechs-expansion/additional/dronewright-512.png`, `assets/sprites-90/mechs-expansion/additional/dronewright-red.png`, `assets/sprites-90/mechs-expansion/additional/dronewright-red-512.png`
- `expansion_colossus`: `assets/sprites-90/mechs-expansion/additional/expansion_colossus.png`, `assets/sprites-90/mechs-expansion/additional/expansion_colossus-512.png`, `assets/sprites-90/mechs-expansion/additional/expansion_colossus-red.png`, `assets/sprites-90/mechs-expansion/additional/expansion_colossus-red-512.png`
- `expansion_warden`: `assets/sprites-90/mechs-expansion/additional/expansion_warden.png`, `assets/sprites-90/mechs-expansion/additional/expansion_warden-512.png`, `assets/sprites-90/mechs-expansion/additional/expansion_warden-red.png`, `assets/sprites-90/mechs-expansion/additional/expansion_warden-red-512.png`
- `forgeback`: `assets/sprites-90/mechs-expansion/additional/forgeback.png`, `assets/sprites-90/mechs-expansion/additional/forgeback-512.png`, `assets/sprites-90/mechs-expansion/additional/forgeback-red.png`, `assets/sprites-90/mechs-expansion/additional/forgeback-red-512.png`
- `furnace_knight`: `assets/sprites-90/mechs-expansion/additional/furnace_knight.png`, `assets/sprites-90/mechs-expansion/additional/furnace_knight-512.png`, `assets/sprites-90/mechs-expansion/additional/furnace_knight-red.png`, `assets/sprites-90/mechs-expansion/additional/furnace_knight-red-512.png`
- `glass_cannon`: `assets/sprites-90/mechs-expansion/additional/glass_cannon.png`, `assets/sprites-90/mechs-expansion/additional/glass_cannon-512.png`, `assets/sprites-90/mechs-expansion/additional/glass_cannon-red.png`, `assets/sprites-90/mechs-expansion/additional/glass_cannon-red-512.png`
- `graveyard`: `assets/sprites-90/mechs-expansion/additional/graveyard.png`, `assets/sprites-90/mechs-expansion/additional/graveyard-512.png`, `assets/sprites-90/mechs-expansion/additional/graveyard-red.png`, `assets/sprites-90/mechs-expansion/additional/graveyard-red-512.png`
- `juggernaut`: `assets/sprites-90/mechs-expansion/additional/juggernaut.png`, `assets/sprites-90/mechs-expansion/additional/juggernaut-512.png`, `assets/sprites-90/mechs-expansion/additional/juggernaut-red.png`, `assets/sprites-90/mechs-expansion/additional/juggernaut-red-512.png`
- `magwalker`: `assets/sprites-90/mechs-expansion/additional/magwalker.png`, `assets/sprites-90/mechs-expansion/additional/magwalker-512.png`, `assets/sprites-90/mechs-expansion/additional/magwalker-red.png`, `assets/sprites-90/mechs-expansion/additional/magwalker-red-512.png`
- `mimic`: `assets/sprites-90/mechs-expansion/additional/mimic.png`, `assets/sprites-90/mechs-expansion/additional/mimic-512.png`, `assets/sprites-90/mechs-expansion/additional/mimic-red.png`, `assets/sprites-90/mechs-expansion/additional/mimic-red-512.png`
- `plague_engine`: `assets/sprites-90/mechs-expansion/additional/plague_engine.png`, `assets/sprites-90/mechs-expansion/additional/plague_engine-512.png`, `assets/sprites-90/mechs-expansion/additional/plague_engine-red.png`, `assets/sprites-90/mechs-expansion/additional/plague_engine-red-512.png`
- `revenant`: `assets/sprites-90/mechs-expansion/additional/revenant.png`, `assets/sprites-90/mechs-expansion/additional/revenant-512.png`, `assets/sprites-90/mechs-expansion/additional/revenant-red.png`, `assets/sprites-90/mechs-expansion/additional/revenant-red-512.png`
- `salvage_titan`: `assets/sprites-90/mechs-expansion/additional/salvage_titan.png`, `assets/sprites-90/mechs-expansion/additional/salvage_titan-512.png`, `assets/sprites-90/mechs-expansion/additional/salvage_titan-red.png`, `assets/sprites-90/mechs-expansion/additional/salvage_titan-red-512.png`
- `scavenger`: `assets/sprites-90/mechs-expansion/additional/scavenger.png`, `assets/sprites-90/mechs-expansion/additional/scavenger-512.png`, `assets/sprites-90/mechs-expansion/additional/scavenger-red.png`, `assets/sprites-90/mechs-expansion/additional/scavenger-red-512.png`
- `scrap_saint`: `assets/sprites-90/mechs-expansion/additional/scrap_saint.png`, `assets/sprites-90/mechs-expansion/additional/scrap_saint-512.png`, `assets/sprites-90/mechs-expansion/additional/scrap_saint-red.png`, `assets/sprites-90/mechs-expansion/additional/scrap_saint-red-512.png`
- `scrapper`: `assets/sprites-90/mechs-expansion/additional/scrapper.png`, `assets/sprites-90/mechs-expansion/additional/scrapper-512.png`, `assets/sprites-90/mechs-expansion/additional/scrapper-red.png`, `assets/sprites-90/mechs-expansion/additional/scrapper-red-512.png`
- `siege_walker`: `assets/sprites-90/mechs-expansion/additional/siege_walker.png`, `assets/sprites-90/mechs-expansion/additional/siege_walker-512.png`, `assets/sprites-90/mechs-expansion/additional/siege_walker-red.png`, `assets/sprites-90/mechs-expansion/additional/siege_walker-red-512.png`
- `signal_ghost`: `assets/sprites-90/mechs-expansion/additional/signal_ghost.png`, `assets/sprites-90/mechs-expansion/additional/signal_ghost-512.png`, `assets/sprites-90/mechs-expansion/additional/signal_ghost-red.png`, `assets/sprites-90/mechs-expansion/additional/signal_ghost-red-512.png`
- `skyhook`: `assets/sprites-90/mechs-expansion/additional/skyhook.png`, `assets/sprites-90/mechs-expansion/additional/skyhook-512.png`, `assets/sprites-90/mechs-expansion/additional/skyhook-red.png`, `assets/sprites-90/mechs-expansion/additional/skyhook-red-512.png`
- `spiderframe`: `assets/sprites-90/mechs-expansion/additional/spiderframe.png`, `assets/sprites-90/mechs-expansion/additional/spiderframe-512.png`, `assets/sprites-90/mechs-expansion/additional/spiderframe-red.png`, `assets/sprites-90/mechs-expansion/additional/spiderframe-red-512.png`
- `stormcaller`: `assets/sprites-90/mechs-expansion/additional/stormcaller.png`, `assets/sprites-90/mechs-expansion/additional/stormcaller-512.png`, `assets/sprites-90/mechs-expansion/additional/stormcaller-red.png`, `assets/sprites-90/mechs-expansion/additional/stormcaller-red-512.png`
- `tunnelfox`: `assets/sprites-90/mechs-expansion/additional/tunnelfox.png`, `assets/sprites-90/mechs-expansion/additional/tunnelfox-512.png`, `assets/sprites-90/mechs-expansion/additional/tunnelfox-red.png`, `assets/sprites-90/mechs-expansion/additional/tunnelfox-red-512.png`
- `undertaker`: `assets/sprites-90/mechs-expansion/additional/undertaker.png`, `assets/sprites-90/mechs-expansion/additional/undertaker-512.png`, `assets/sprites-90/mechs-expansion/additional/undertaker-red.png`, `assets/sprites-90/mechs-expansion/additional/undertaker-red-512.png`
- `bastion`: `assets/sprites-90/mechs-expansion/bulwark/bastion.png`, `assets/sprites-90/mechs-expansion/bulwark/bastion-512.png`, `assets/sprites-90/mechs-expansion/bulwark/bastion-red.png`, `assets/sprites-90/mechs-expansion/bulwark/bastion-red-512.png`
- `breakwater`: `assets/sprites-90/mechs-expansion/bulwark/breakwater.png`, `assets/sprites-90/mechs-expansion/bulwark/breakwater-512.png`, `assets/sprites-90/mechs-expansion/bulwark/breakwater-red.png`, `assets/sprites-90/mechs-expansion/bulwark/breakwater-red-512.png`
- `dreadnought`: `assets/sprites-90/mechs-expansion/bulwark/dreadnought.png`, `assets/sprites-90/mechs-expansion/bulwark/dreadnought-512.png`, `assets/sprites-90/mechs-expansion/bulwark/dreadnought-red.png`, `assets/sprites-90/mechs-expansion/bulwark/dreadnought-red-512.png`
- `gatekeeper`: `assets/sprites-90/mechs-expansion/bulwark/gatekeeper.png`, `assets/sprites-90/mechs-expansion/bulwark/gatekeeper-512.png`, `assets/sprites-90/mechs-expansion/bulwark/gatekeeper-red.png`, `assets/sprites-90/mechs-expansion/bulwark/gatekeeper-red-512.png`
- `goliath`: `assets/sprites-90/mechs-expansion/bulwark/goliath.png`, `assets/sprites-90/mechs-expansion/bulwark/goliath-512.png`, `assets/sprites-90/mechs-expansion/bulwark/goliath-red.png`, `assets/sprites-90/mechs-expansion/bulwark/goliath-red-512.png`
- `ironclad`: `assets/sprites-90/mechs-expansion/bulwark/ironclad.png`, `assets/sprites-90/mechs-expansion/bulwark/ironclad-512.png`, `assets/sprites-90/mechs-expansion/bulwark/ironclad-red.png`, `assets/sprites-90/mechs-expansion/bulwark/ironclad-red-512.png`
- `rampart_mk2`: `assets/sprites-90/mechs-expansion/bulwark/rampart_mk2.png`, `assets/sprites-90/mechs-expansion/bulwark/rampart_mk2-512.png`, `assets/sprites-90/mechs-expansion/bulwark/rampart_mk2-red.png`, `assets/sprites-90/mechs-expansion/bulwark/rampart_mk2-red-512.png`
- `redoubt`: `assets/sprites-90/mechs-expansion/bulwark/redoubt.png`, `assets/sprites-90/mechs-expansion/bulwark/redoubt-512.png`, `assets/sprites-90/mechs-expansion/bulwark/redoubt-red.png`, `assets/sprites-90/mechs-expansion/bulwark/redoubt-red-512.png`
- `avalanche`: `assets/sprites-90/mechs-expansion/longshot/avalanche.png`, `assets/sprites-90/mechs-expansion/longshot/avalanche-512.png`, `assets/sprites-90/mechs-expansion/longshot/avalanche-red.png`, `assets/sprites-90/mechs-expansion/longshot/avalanche-red-512.png`
- `deadeye`: `assets/sprites-90/mechs-expansion/longshot/deadeye.png`, `assets/sprites-90/mechs-expansion/longshot/deadeye-512.png`, `assets/sprites-90/mechs-expansion/longshot/deadeye-red.png`, `assets/sprites-90/mechs-expansion/longshot/deadeye-red-512.png`
- `firestorm`: `assets/sprites-90/mechs-expansion/longshot/firestorm.png`, `assets/sprites-90/mechs-expansion/longshot/firestorm-512.png`, `assets/sprites-90/mechs-expansion/longshot/firestorm-red.png`, `assets/sprites-90/mechs-expansion/longshot/firestorm-red-512.png`
- `horizon`: `assets/sprites-90/mechs-expansion/longshot/horizon.png`, `assets/sprites-90/mechs-expansion/longshot/horizon-512.png`, `assets/sprites-90/mechs-expansion/longshot/horizon-red.png`, `assets/sprites-90/mechs-expansion/longshot/horizon-red-512.png`
- `mortarjack`: `assets/sprites-90/mechs-expansion/longshot/mortarjack.png`, `assets/sprites-90/mechs-expansion/longshot/mortarjack-512.png`, `assets/sprites-90/mechs-expansion/longshot/mortarjack-red.png`, `assets/sprites-90/mechs-expansion/longshot/mortarjack-red-512.png`
- `railwarden`: `assets/sprites-90/mechs-expansion/longshot/railwarden.png`, `assets/sprites-90/mechs-expansion/longshot/railwarden-512.png`, `assets/sprites-90/mechs-expansion/longshot/railwarden-red.png`, `assets/sprites-90/mechs-expansion/longshot/railwarden-red-512.png`
- `siegeback`: `assets/sprites-90/mechs-expansion/longshot/siegeback.png`, `assets/sprites-90/mechs-expansion/longshot/siegeback-512.png`, `assets/sprites-90/mechs-expansion/longshot/siegeback-red.png`, `assets/sprites-90/mechs-expansion/longshot/siegeback-red-512.png`
- `thunderhead`: `assets/sprites-90/mechs-expansion/longshot/thunderhead.png`, `assets/sprites-90/mechs-expansion/longshot/thunderhead-512.png`, `assets/sprites-90/mechs-expansion/longshot/thunderhead-red.png`, `assets/sprites-90/mechs-expansion/longshot/thunderhead-red-512.png`
- `breakneck`: `assets/sprites-90/mechs-expansion/striker/breakneck.png`, `assets/sprites-90/mechs-expansion/striker/breakneck-512.png`, `assets/sprites-90/mechs-expansion/striker/breakneck-red.png`, `assets/sprites-90/mechs-expansion/striker/breakneck-red-512.png`
- `hellhound`: `assets/sprites-90/mechs-expansion/striker/hellhound.png`, `assets/sprites-90/mechs-expansion/striker/hellhound-512.png`, `assets/sprites-90/mechs-expansion/striker/hellhound-red.png`, `assets/sprites-90/mechs-expansion/striker/hellhound-red-512.png`
- `iron_jackal`: `assets/sprites-90/mechs-expansion/striker/iron_jackal.png`, `assets/sprites-90/mechs-expansion/striker/iron_jackal-512.png`, `assets/sprites-90/mechs-expansion/striker/iron_jackal-red.png`, `assets/sprites-90/mechs-expansion/striker/iron_jackal-red-512.png`
- `javelin`: `assets/sprites-90/mechs-expansion/striker/javelin.png`, `assets/sprites-90/mechs-expansion/striker/javelin-512.png`, `assets/sprites-90/mechs-expansion/striker/javelin-red.png`, `assets/sprites-90/mechs-expansion/striker/javelin-red-512.png`
- `pitbull`: `assets/sprites-90/mechs-expansion/striker/pitbull.png`, `assets/sprites-90/mechs-expansion/striker/pitbull-512.png`, `assets/sprites-90/mechs-expansion/striker/pitbull-red.png`, `assets/sprites-90/mechs-expansion/striker/pitbull-red-512.png`
- `raptor`: `assets/sprites-90/mechs-expansion/striker/raptor.png`, `assets/sprites-90/mechs-expansion/striker/raptor-512.png`, `assets/sprites-90/mechs-expansion/striker/raptor-red.png`, `assets/sprites-90/mechs-expansion/striker/raptor-red-512.png`
- `reaver`: `assets/sprites-90/mechs-expansion/striker/reaver.png`, `assets/sprites-90/mechs-expansion/striker/reaver-512.png`, `assets/sprites-90/mechs-expansion/striker/reaver-red.png`, `assets/sprites-90/mechs-expansion/striker/reaver-red-512.png`
- `riotbreaker`: `assets/sprites-90/mechs-expansion/striker/riotbreaker.png`, `assets/sprites-90/mechs-expansion/striker/riotbreaker-512.png`, `assets/sprites-90/mechs-expansion/striker/riotbreaker-red.png`, `assets/sprites-90/mechs-expansion/striker/riotbreaker-red-512.png`
- `flicker`: `assets/sprites-90/mechs-expansion/vespid/flicker.png`, `assets/sprites-90/mechs-expansion/vespid/flicker-512.png`, `assets/sprites-90/mechs-expansion/vespid/flicker-red.png`, `assets/sprites-90/mechs-expansion/vespid/flicker-red-512.png`
- `ghoststep`: `assets/sprites-90/mechs-expansion/vespid/ghoststep.png`, `assets/sprites-90/mechs-expansion/vespid/ghoststep-512.png`, `assets/sprites-90/mechs-expansion/vespid/ghoststep-red.png`, `assets/sprites-90/mechs-expansion/vespid/ghoststep-red-512.png`
- `jackrabbit`: `assets/sprites-90/mechs-expansion/vespid/jackrabbit.png`, `assets/sprites-90/mechs-expansion/vespid/jackrabbit-512.png`, `assets/sprites-90/mechs-expansion/vespid/jackrabbit-red.png`, `assets/sprites-90/mechs-expansion/vespid/jackrabbit-red-512.png`
- `longsight`: `assets/sprites-90/mechs-expansion/vespid/longsight.png`, `assets/sprites-90/mechs-expansion/vespid/longsight-512.png`, `assets/sprites-90/mechs-expansion/vespid/longsight-red.png`, `assets/sprites-90/mechs-expansion/vespid/longsight-red-512.png`
- `needlewing`: `assets/sprites-90/mechs-expansion/vespid/needlewing.png`, `assets/sprites-90/mechs-expansion/vespid/needlewing-512.png`, `assets/sprites-90/mechs-expansion/vespid/needlewing-red.png`, `assets/sprites-90/mechs-expansion/vespid/needlewing-red-512.png`
- `nightglass`: `assets/sprites-90/mechs-expansion/vespid/nightglass.png`, `assets/sprites-90/mechs-expansion/vespid/nightglass-512.png`, `assets/sprites-90/mechs-expansion/vespid/nightglass-red.png`, `assets/sprites-90/mechs-expansion/vespid/nightglass-red-512.png`
- `threadrunner`: `assets/sprites-90/mechs-expansion/vespid/threadrunner.png`, `assets/sprites-90/mechs-expansion/vespid/threadrunner-512.png`, `assets/sprites-90/mechs-expansion/vespid/threadrunner-red.png`, `assets/sprites-90/mechs-expansion/vespid/threadrunner-red-512.png`
- `wraithrunner`: `assets/sprites-90/mechs-expansion/vespid/wraithrunner.png`, `assets/sprites-90/mechs-expansion/vespid/wraithrunner-512.png`, `assets/sprites-90/mechs-expansion/vespid/wraithrunner-red.png`, `assets/sprites-90/mechs-expansion/vespid/wraithrunner-red-512.png`

## Weapons — 135 x blue/red

- `acid_sprayer`: `assets/sprites-90/weapons/acid_sprayer.png`, `assets/sprites-90/weapons/acid_sprayer-512.png`, `assets/sprites-90/weapons/acid_sprayer-red.png`, `assets/sprites-90/weapons/acid_sprayer-red-512.png`
- `afterimage_emitter`: `assets/sprites-90/weapons/afterimage_emitter.png`, `assets/sprites-90/weapons/afterimage_emitter-512.png`, `assets/sprites-90/weapons/afterimage_emitter-red.png`, `assets/sprites-90/weapons/afterimage_emitter-red-512.png`
- `anchor_fist`: `assets/sprites-90/weapons/anchor_fist.png`, `assets/sprites-90/weapons/anchor_fist-512.png`, `assets/sprites-90/weapons/anchor_fist-red.png`, `assets/sprites-90/weapons/anchor_fist-red-512.png`
- `anti_air_cannon`: `assets/sprites-90/weapons/anti_air_cannon.png`, `assets/sprites-90/weapons/anti_air_cannon-512.png`, `assets/sprites-90/weapons/anti_air_cannon-red.png`, `assets/sprites-90/weapons/anti_air_cannon-red-512.png`
- `arc_cleaver`: `assets/sprites-90/weapons/arc_cleaver.png`, `assets/sprites-90/weapons/arc_cleaver-512.png`, `assets/sprites-90/weapons/arc_cleaver-red.png`, `assets/sprites-90/weapons/arc_cleaver-red-512.png`
- `arc_furnace`: `assets/sprites-90/weapons/arc_furnace.png`, `assets/sprites-90/weapons/arc_furnace-512.png`, `assets/sprites-90/weapons/arc_furnace-red.png`, `assets/sprites-90/weapons/arc_furnace-red-512.png`
- `arc_thrower`: `assets/sprites-90/weapons/arc_thrower.png`, `assets/sprites-90/weapons/arc_thrower-512.png`, `assets/sprites-90/weapons/arc_thrower-red.png`, `assets/sprites-90/weapons/arc_thrower-red-512.png`
- `atlas_shoulder_howitzer`: `assets/sprites-90/weapons/atlas_shoulder_howitzer.png`, `assets/sprites-90/weapons/atlas_shoulder_howitzer-512.png`, `assets/sprites-90/weapons/atlas_shoulder_howitzer-red.png`, `assets/sprites-90/weapons/atlas_shoulder_howitzer-red-512.png`
- `autocannon`: `assets/sprites-90/weapons/autocannon.png`, `assets/sprites-90/weapons/autocannon-512.png`, `assets/sprites-90/weapons/autocannon-red.png`, `assets/sprites-90/weapons/autocannon-red-512.png`
- `backblast_shotgun`: `assets/sprites-90/weapons/backblast_shotgun.png`, `assets/sprites-90/weapons/backblast_shotgun-512.png`, `assets/sprites-90/weapons/backblast_shotgun-red.png`, `assets/sprites-90/weapons/backblast_shotgun-red-512.png`
- `bellringer`: `assets/sprites-90/weapons/bellringer.png`, `assets/sprites-90/weapons/bellringer-512.png`, `assets/sprites-90/weapons/bellringer-red.png`, `assets/sprites-90/weapons/bellringer-red-512.png`
- `biomass_reclaimer`: `assets/sprites-90/weapons/biomass_reclaimer.png`, `assets/sprites-90/weapons/biomass_reclaimer-512.png`, `assets/sprites-90/weapons/biomass_reclaimer-red.png`, `assets/sprites-90/weapons/biomass_reclaimer-red-512.png`
- `blackbox_launcher`: `assets/sprites-90/weapons/blackbox_launcher.png`, `assets/sprites-90/weapons/blackbox_launcher-512.png`, `assets/sprites-90/weapons/blackbox_launcher-red.png`, `assets/sprites-90/weapons/blackbox_launcher-red-512.png`
- `blackout_emitter`: `assets/sprites-90/weapons/blackout_emitter.png`, `assets/sprites-90/weapons/blackout_emitter-512.png`, `assets/sprites-90/weapons/blackout_emitter-red.png`, `assets/sprites-90/weapons/blackout_emitter-red-512.png`
- `blueglass_rifle`: `assets/sprites-90/weapons/blueglass_rifle.png`, `assets/sprites-90/weapons/blueglass_rifle-512.png`, `assets/sprites-90/weapons/blueglass_rifle-red.png`, `assets/sprites-90/weapons/blueglass_rifle-red-512.png`
- `bonecrusher`: `assets/sprites-90/weapons/bonecrusher.png`, `assets/sprites-90/weapons/bonecrusher-512.png`, `assets/sprites-90/weapons/bonecrusher-red.png`, `assets/sprites-90/weapons/bonecrusher-red-512.png`
- `brass_knuckle_cannon`: `assets/sprites-90/weapons/brass_knuckle_cannon.png`, `assets/sprites-90/weapons/brass_knuckle_cannon-512.png`, `assets/sprites-90/weapons/brass_knuckle_cannon-red.png`, `assets/sprites-90/weapons/brass_knuckle_cannon-red-512.png`
- `breach_missile`: `assets/sprites-90/weapons/breach_missile.png`, `assets/sprites-90/weapons/breach_missile-512.png`, `assets/sprites-90/weapons/breach_missile-red.png`, `assets/sprites-90/weapons/breach_missile-red-512.png`
- `breacher_12`: `assets/sprites-90/weapons/breacher_12.png`, `assets/sprites-90/weapons/breacher_12-512.png`, `assets/sprites-90/weapons/breacher_12-red.png`, `assets/sprites-90/weapons/breacher_12-red-512.png`
- `breakroom_special`: `assets/sprites-90/weapons/breakroom_special.png`, `assets/sprites-90/weapons/breakroom_special-512.png`, `assets/sprites-90/weapons/breakroom_special-red.png`, `assets/sprites-90/weapons/breakroom_special-red-512.png`
- `burrower_rocket_pod`: `assets/sprites-90/weapons/burrower_rocket_pod.png`, `assets/sprites-90/weapons/burrower_rocket_pod-512.png`, `assets/sprites-90/weapons/burrower_rocket_pod-red.png`, `assets/sprites-90/weapons/burrower_rocket_pod-red-512.png`
- `capacitor_rifle`: `assets/sprites-90/weapons/capacitor_rifle.png`, `assets/sprites-90/weapons/capacitor_rifle-512.png`, `assets/sprites-90/weapons/capacitor_rifle-red.png`, `assets/sprites-90/weapons/capacitor_rifle-red-512.png`
- `caustic_foam_gun`: `assets/sprites-90/weapons/caustic_foam_gun.png`, `assets/sprites-90/weapons/caustic_foam_gun-512.png`, `assets/sprites-90/weapons/caustic_foam_gun-red.png`, `assets/sprites-90/weapons/caustic_foam_gun-red-512.png`
- `chain_glaive`: `assets/sprites-90/weapons/chain_glaive.png`, `assets/sprites-90/weapons/chain_glaive-512.png`, `assets/sprites-90/weapons/chain_glaive-red.png`, `assets/sprites-90/weapons/chain_glaive-red-512.png`
- `chrono_spike`: `assets/sprites-90/weapons/chrono_spike.png`, `assets/sprites-90/weapons/chrono_spike-512.png`, `assets/sprites-90/weapons/chrono_spike-red.png`, `assets/sprites-90/weapons/chrono_spike-red-512.png`
- `cindercoil`: `assets/sprites-90/weapons/cindercoil.png`, `assets/sprites-90/weapons/cindercoil-512.png`, `assets/sprites-90/weapons/cindercoil-red.png`, `assets/sprites-90/weapons/cindercoil-red-512.png`
- `clusterbug_launcher`: `assets/sprites-90/weapons/clusterbug_launcher.png`, `assets/sprites-90/weapons/clusterbug_launcher-512.png`, `assets/sprites-90/weapons/clusterbug_launcher-red.png`, `assets/sprites-90/weapons/clusterbug_launcher-red-512.png`
- `coil_feed_carbine`: `assets/sprites-90/weapons/coil_feed_carbine.png`, `assets/sprites-90/weapons/coil_feed_carbine-512.png`, `assets/sprites-90/weapons/coil_feed_carbine-red.png`, `assets/sprites-90/weapons/coil_feed_carbine-red-512.png`
- `compressed_junk_cannon`: `assets/sprites-90/weapons/compressed_junk_cannon.png`, `assets/sprites-90/weapons/compressed_junk_cannon-512.png`, `assets/sprites-90/weapons/compressed_junk_cannon-red.png`, `assets/sprites-90/weapons/compressed_junk_cannon-red-512.png`
- `concrete_mixer`: `assets/sprites-90/weapons/concrete_mixer.png`, `assets/sprites-90/weapons/concrete_mixer-512.png`, `assets/sprites-90/weapons/concrete_mixer-red.png`, `assets/sprites-90/weapons/concrete_mixer-red-512.png`
- `corebreaker`: `assets/sprites-90/weapons/corebreaker.png`, `assets/sprites-90/weapons/corebreaker-512.png`, `assets/sprites-90/weapons/corebreaker-red.png`, `assets/sprites-90/weapons/corebreaker-red-512.png`
- `corrosion_needle`: `assets/sprites-90/weapons/corrosion_needle.png`, `assets/sprites-90/weapons/corrosion_needle-512.png`, `assets/sprites-90/weapons/corrosion_needle-red.png`, `assets/sprites-90/weapons/corrosion_needle-red-512.png`
- `cratermaker`: `assets/sprites-90/weapons/cratermaker.png`, `assets/sprites-90/weapons/cratermaker-512.png`, `assets/sprites-90/weapons/cratermaker-red.png`, `assets/sprites-90/weapons/cratermaker-red-512.png`
- `cryo_piercer`: `assets/sprites-90/weapons/cryo_piercer.png`, `assets/sprites-90/weapons/cryo_piercer-512.png`, `assets/sprites-90/weapons/cryo_piercer-red.png`, `assets/sprites-90/weapons/cryo_piercer-red-512.png`
- `cryogenic_mist_cannon`: `assets/sprites-90/weapons/cryogenic_mist_cannon.png`, `assets/sprites-90/weapons/cryogenic_mist_cannon-512.png`, `assets/sprites-90/weapons/cryogenic_mist_cannon-red.png`, `assets/sprites-90/weapons/cryogenic_mist_cannon-red-512.png`
- `cursed_office_printer`: `assets/sprites-90/weapons/cursed_office_printer.png`, `assets/sprites-90/weapons/cursed_office_printer-512.png`, `assets/sprites-90/weapons/cursed_office_printer-red.png`, `assets/sprites-90/weapons/cursed_office_printer-red-512.png`
- `dead_channel`: `assets/sprites-90/weapons/dead_channel.png`, `assets/sprites-90/weapons/dead_channel-512.png`, `assets/sprites-90/weapons/dead_channel-red.png`, `assets/sprites-90/weapons/dead_channel-red-512.png`
- `demolition_ram`: `assets/sprites-90/weapons/demolition_ram.png`, `assets/sprites-90/weapons/demolition_ram-512.png`, `assets/sprites-90/weapons/demolition_ram-red.png`, `assets/sprites-90/weapons/demolition_ram-red-512.png`
- `door_kicker`: `assets/sprites-90/weapons/door_kicker.png`, `assets/sprites-90/weapons/door_kicker-512.png`, `assets/sprites-90/weapons/door_kicker-red.png`, `assets/sprites-90/weapons/door_kicker-red-512.png`
- `double_feed`: `assets/sprites-90/weapons/double_feed.png`, `assets/sprites-90/weapons/double_feed-512.png`, `assets/sprites-90/weapons/double_feed-red.png`, `assets/sprites-90/weapons/double_feed-red-512.png`
- `echo_rifle`: `assets/sprites-90/weapons/echo_rifle.png`, `assets/sprites-90/weapons/echo_rifle-512.png`, `assets/sprites-90/weapons/echo_rifle-red.png`, `assets/sprites-90/weapons/echo_rifle-red-512.png`
- `emergency_flare_gun`: `assets/sprites-90/weapons/emergency_flare_gun.png`, `assets/sprites-90/weapons/emergency_flare_gun-512.png`, `assets/sprites-90/weapons/emergency_flare_gun-red.png`, `assets/sprites-90/weapons/emergency_flare_gun-red-512.png`
- `emp_carbine`: `assets/sprites-90/weapons/emp_carbine.png`, `assets/sprites-90/weapons/emp_carbine-512.png`, `assets/sprites-90/weapons/emp_carbine-red.png`, `assets/sprites-90/weapons/emp_carbine-red-512.png`
- `entropy_cannon`: `assets/sprites-90/weapons/entropy_cannon.png`, `assets/sprites-90/weapons/entropy_cannon-512.png`, `assets/sprites-90/weapons/entropy_cannon-red.png`, `assets/sprites-90/weapons/entropy_cannon-red-512.png`
- `eventide_cannon`: `assets/sprites-90/weapons/eventide_cannon.png`, `assets/sprites-90/weapons/eventide_cannon-512.png`, `assets/sprites-90/weapons/eventide_cannon-red.png`, `assets/sprites-90/weapons/eventide_cannon-red-512.png`
- `ew_module`: `assets/sprites-90/weapons/ew_module.png`, `assets/sprites-90/weapons/ew_module-512.png`, `assets/sprites-90/weapons/ew_module-red.png`, `assets/sprites-90/weapons/ew_module-red-512.png`
- `faultline_driver`: `assets/sprites-90/weapons/faultline_driver.png`, `assets/sprites-90/weapons/faultline_driver-512.png`, `assets/sprites-90/weapons/faultline_driver-red.png`, `assets/sprites-90/weapons/faultline_driver-red-512.png`
- `flamethrower`: `assets/sprites-90/weapons/flamethrower.png`, `assets/sprites-90/weapons/flamethrower-512.png`, `assets/sprites-90/weapons/flamethrower-red.png`, `assets/sprites-90/weapons/flamethrower-red-512.png`
- `flux_hammer`: `assets/sprites-90/weapons/flux_hammer.png`, `assets/sprites-90/weapons/flux_hammer-512.png`, `assets/sprites-90/weapons/flux_hammer-red.png`, `assets/sprites-90/weapons/flux_hammer-red-512.png`
- `forklift_forks`: `assets/sprites-90/weapons/forklift_forks.png`, `assets/sprites-90/weapons/forklift_forks-512.png`, `assets/sprites-90/weapons/forklift_forks-red.png`, `assets/sprites-90/weapons/forklift_forks-red-512.png`
- `foundry_sledge`: `assets/sprites-90/weapons/foundry_sledge.png`, `assets/sprites-90/weapons/foundry_sledge-512.png`, `assets/sprites-90/weapons/foundry_sledge-red.png`, `assets/sprites-90/weapons/foundry_sledge-red-512.png`
- `furnace_bombard`: `assets/sprites-90/weapons/furnace_bombard.png`, `assets/sprites-90/weapons/furnace_bombard-512.png`, `assets/sprites-90/weapons/furnace_bombard-red.png`, `assets/sprites-90/weapons/furnace_bombard-red-512.png`
- `furnace_gel_launcher`: `assets/sprites-90/weapons/furnace_gel_launcher.png`, `assets/sprites-90/weapons/furnace_gel_launcher-512.png`, `assets/sprites-90/weapons/furnace_gel_launcher-red.png`, `assets/sprites-90/weapons/furnace_gel_launcher-red-512.png`
- `furnace_shotgun`: `assets/sprites-90/weapons/furnace_shotgun.png`, `assets/sprites-90/weapons/furnace_shotgun-512.png`, `assets/sprites-90/weapons/furnace_shotgun-red.png`, `assets/sprites-90/weapons/furnace_shotgun-red-512.png`
- `furnace_sword`: `assets/sprites-90/weapons/furnace_sword.png`, `assets/sprites-90/weapons/furnace_sword-512.png`, `assets/sprites-90/weapons/furnace_sword-red.png`, `assets/sprites-90/weapons/furnace_sword-red-512.png`
- `ghost_battery`: `assets/sprites-90/weapons/ghost_battery.png`, `assets/sprites-90/weapons/ghost_battery-512.png`, `assets/sprites-90/weapons/ghost_battery-red.png`, `assets/sprites-90/weapons/ghost_battery-red-512.png`
- `ghostlight_projector`: `assets/sprites-90/weapons/ghostlight_projector.png`, `assets/sprites-90/weapons/ghostlight_projector-512.png`, `assets/sprites-90/weapons/ghostlight_projector-red.png`, `assets/sprites-90/weapons/ghostlight_projector-red-512.png`
- `glass_edge`: `assets/sprites-90/weapons/glass_edge.png`, `assets/sprites-90/weapons/glass_edge-512.png`, `assets/sprites-90/weapons/glass_edge-red.png`, `assets/sprites-90/weapons/glass_edge-red-512.png`
- `gravity_mallet`: `assets/sprites-90/weapons/gravity_mallet.png`, `assets/sprites-90/weapons/gravity_mallet-512.png`, `assets/sprites-90/weapons/gravity_mallet-red.png`, `assets/sprites-90/weapons/gravity_mallet-red-512.png`
- `guillotine_arm`: `assets/sprites-90/weapons/guillotine_arm.png`, `assets/sprites-90/weapons/guillotine_arm-512.png`, `assets/sprites-90/weapons/guillotine_arm-red.png`, `assets/sprites-90/weapons/guillotine_arm-red-512.png`
- `hailstorm_minigun`: `assets/sprites-90/weapons/hailstorm_minigun.png`, `assets/sprites-90/weapons/hailstorm_minigun-512.png`, `assets/sprites-90/weapons/hailstorm_minigun-red.png`, `assets/sprites-90/weapons/hailstorm_minigun-red-512.png`
- `heavy_cannon`: `assets/sprites-90/weapons/heavy_cannon.png`, `assets/sprites-90/weapons/heavy_cannon-512.png`, `assets/sprites-90/weapons/heavy_cannon-red.png`, `assets/sprites-90/weapons/heavy_cannon-red-512.png`
- `helios_projector`: `assets/sprites-90/weapons/helios_projector.png`, `assets/sprites-90/weapons/helios_projector-512.png`, `assets/sprites-90/weapons/helios_projector-red.png`, `assets/sprites-90/weapons/helios_projector-red-512.png`
- `hopper_mine_dispenser`: `assets/sprites-90/weapons/hopper_mine_dispenser.png`, `assets/sprites-90/weapons/hopper_mine_dispenser-512.png`, `assets/sprites-90/weapons/hopper_mine_dispenser-red.png`, `assets/sprites-90/weapons/hopper_mine_dispenser-red-512.png`
- `horizon_cutter`: `assets/sprites-90/weapons/horizon_cutter.png`, `assets/sprites-90/weapons/horizon_cutter-512.png`, `assets/sprites-90/weapons/horizon_cutter-red.png`, `assets/sprites-90/weapons/horizon_cutter-red-512.png`
- `hydraulic_crusher`: `assets/sprites-90/weapons/hydraulic_crusher.png`, `assets/sprites-90/weapons/hydraulic_crusher-512.png`, `assets/sprites-90/weapons/hydraulic_crusher-red.png`, `assets/sprites-90/weapons/hydraulic_crusher-red-512.png`
- `industrial_stapler`: `assets/sprites-90/weapons/industrial_stapler.png`, `assets/sprites-90/weapons/industrial_stapler-512.png`, `assets/sprites-90/weapons/industrial_stapler-red.png`, `assets/sprites-90/weapons/industrial_stapler-red-512.png`
- `ion_needle`: `assets/sprites-90/weapons/ion_needle.png`, `assets/sprites-90/weapons/ion_needle-512.png`, `assets/sprites-90/weapons/ion_needle-red.png`, `assets/sprites-90/weapons/ion_needle-red-512.png`
- `laser`: `assets/sprites-90/weapons/laser.png`, `assets/sprites-90/weapons/laser-512.png`, `assets/sprites-90/weapons/laser-red.png`, `assets/sprites-90/weapons/laser-red-512.png`
- `leech_harpoon`: `assets/sprites-90/weapons/leech_harpoon.png`, `assets/sprites-90/weapons/leech_harpoon-512.png`, `assets/sprites-90/weapons/leech_harpoon-red.png`, `assets/sprites-90/weapons/leech_harpoon-red-512.png`
- `maglock_shotgun`: `assets/sprites-90/weapons/maglock_shotgun.png`, `assets/sprites-90/weapons/maglock_shotgun-512.png`, `assets/sprites-90/weapons/maglock_shotgun-red.png`, `assets/sprites-90/weapons/maglock_shotgun-red-512.png`
- `magnetar_cannon`: `assets/sprites-90/weapons/magnetar_cannon.png`, `assets/sprites-90/weapons/magnetar_cannon-512.png`, `assets/sprites-90/weapons/magnetar_cannon-red.png`, `assets/sprites-90/weapons/magnetar_cannon-red-512.png`
- `melee_weapon`: `assets/sprites-90/weapons/melee_weapon.png`, `assets/sprites-90/weapons/melee_weapon-512.png`, `assets/sprites-90/weapons/melee_weapon-red.png`, `assets/sprites-90/weapons/melee_weapon-red-512.png`
- `meltdown_cannon`: `assets/sprites-90/weapons/meltdown_cannon.png`, `assets/sprites-90/weapons/meltdown_cannon-512.png`, `assets/sprites-90/weapons/meltdown_cannon-red.png`, `assets/sprites-90/weapons/meltdown_cannon-red-512.png`
- `microwave_emitter`: `assets/sprites-90/weapons/microwave_emitter.png`, `assets/sprites-90/weapons/microwave_emitter-512.png`, `assets/sprites-90/weapons/microwave_emitter-red.png`, `assets/sprites-90/weapons/microwave_emitter-red-512.png`
- `mimic_gun`: `assets/sprites-90/weapons/mimic_gun.png`, `assets/sprites-90/weapons/mimic_gun-512.png`, `assets/sprites-90/weapons/mimic_gun-red.png`, `assets/sprites-90/weapons/mimic_gun-red-512.png`
- `mirror_core`: `assets/sprites-90/weapons/mirror_core.png`, `assets/sprites-90/weapons/mirror_core-512.png`, `assets/sprites-90/weapons/mirror_core-red.png`, `assets/sprites-90/weapons/mirror_core-red-512.png`
- `mirrorbeam`: `assets/sprites-90/weapons/mirrorbeam.png`, `assets/sprites-90/weapons/mirrorbeam-512.png`, `assets/sprites-90/weapons/mirrorbeam-red.png`, `assets/sprites-90/weapons/mirrorbeam-red-512.png`
- `missile_launcher`: `assets/sprites-90/weapons/missile_launcher.png`, `assets/sprites-90/weapons/missile_launcher-512.png`, `assets/sprites-90/weapons/missile_launcher-red.png`, `assets/sprites-90/weapons/missile_launcher-red-512.png`
- `monorail_blade`: `assets/sprites-90/weapons/monorail_blade.png`, `assets/sprites-90/weapons/monorail_blade-512.png`, `assets/sprites-90/weapons/monorail_blade-red.png`, `assets/sprites-90/weapons/monorail_blade-red-512.png`
- `mortar`: `assets/sprites-90/weapons/mortar.png`, `assets/sprites-90/weapons/mortar-512.png`, `assets/sprites-90/weapons/mortar-red.png`, `assets/sprites-90/weapons/mortar-red-512.png`
- `mule_40_grenade_lobber`: `assets/sprites-90/weapons/mule_40_grenade_lobber.png`, `assets/sprites-90/weapons/mule_40_grenade_lobber-512.png`, `assets/sprites-90/weapons/mule_40_grenade_lobber-red.png`, `assets/sprites-90/weapons/mule_40_grenade_lobber-red-512.png`
- `nanite_swarm_injector`: `assets/sprites-90/weapons/nanite_swarm_injector.png`, `assets/sprites-90/weapons/nanite_swarm_injector-512.png`, `assets/sprites-90/weapons/nanite_swarm_injector-red.png`, `assets/sprites-90/weapons/nanite_swarm_injector-red-512.png`
- `null_ray`: `assets/sprites-90/weapons/null_ray.png`, `assets/sprites-90/weapons/null_ray-512.png`, `assets/sprites-90/weapons/null_ray-red.png`, `assets/sprites-90/weapons/null_ray-red-512.png`
- `phase_cutter`: `assets/sprites-90/weapons/phase_cutter.png`, `assets/sprites-90/weapons/phase_cutter-512.png`, `assets/sprites-90/weapons/phase_cutter-red.png`, `assets/sprites-90/weapons/phase_cutter-red-512.png`
- `phase_lance`: `assets/sprites-90/weapons/phase_lance.png`, `assets/sprites-90/weapons/phase_lance-512.png`, `assets/sprites-90/weapons/phase_lance-red.png`, `assets/sprites-90/weapons/phase_lance-red-512.png`
- `phase_shear_cannon`: `assets/sprites-90/weapons/phase_shear_cannon.png`, `assets/sprites-90/weapons/phase_shear_cannon-512.png`, `assets/sprites-90/weapons/phase_shear_cannon-red.png`, `assets/sprites-90/weapons/phase_shear_cannon-red-512.png`
- `photon_scatterer`: `assets/sprites-90/weapons/photon_scatterer.png`, `assets/sprites-90/weapons/photon_scatterer-512.png`, `assets/sprites-90/weapons/photon_scatterer-red.png`, `assets/sprites-90/weapons/photon_scatterer-red-512.png`
- `pile_driver_fist`: `assets/sprites-90/weapons/pile_driver_fist.png`, `assets/sprites-90/weapons/pile_driver_fist-512.png`, `assets/sprites-90/weapons/pile_driver_fist-red.png`, `assets/sprites-90/weapons/pile_driver_fist-red-512.png`
- `plasma_machete`: `assets/sprites-90/weapons/plasma_machete.png`, `assets/sprites-90/weapons/plasma_machete-512.png`, `assets/sprites-90/weapons/plasma_machete-red.png`, `assets/sprites-90/weapons/plasma_machete-red-512.png`
- `plasma_saw`: `assets/sprites-90/weapons/plasma_saw.png`, `assets/sprites-90/weapons/plasma_saw-512.png`, `assets/sprites-90/weapons/plasma_saw-red.png`, `assets/sprites-90/weapons/plasma_saw-red-512.png`
- `plasma_spitter`: `assets/sprites-90/weapons/plasma_spitter.png`, `assets/sprites-90/weapons/plasma_spitter-512.png`, `assets/sprites-90/weapons/plasma_spitter-red.png`, `assets/sprites-90/weapons/plasma_spitter-red-512.png`
- `prism_rifle`: `assets/sprites-90/weapons/prism_rifle.png`, `assets/sprites-90/weapons/prism_rifle-512.png`, `assets/sprites-90/weapons/prism_rifle-red.png`, `assets/sprites-90/weapons/prism_rifle-red-512.png`
- `probability_engine`: `assets/sprites-90/weapons/probability_engine.png`, `assets/sprites-90/weapons/probability_engine-512.png`, `assets/sprites-90/weapons/probability_engine-red.png`, `assets/sprites-90/weapons/probability_engine-red-512.png`
- `propane_lance`: `assets/sprites-90/weapons/propane_lance.png`, `assets/sprites-90/weapons/propane_lance-512.png`, `assets/sprites-90/weapons/propane_lance-red.png`, `assets/sprites-90/weapons/propane_lance-red-512.png`
- `railgun`: `assets/sprites-90/weapons/railgun.png`, `assets/sprites-90/weapons/railgun-512.png`, `assets/sprites-90/weapons/railgun-red.png`, `assets/sprites-90/weapons/railgun-red-512.png`
- `railspike`: `assets/sprites-90/weapons/railspike.png`, `assets/sprites-90/weapons/railspike-512.png`, `assets/sprites-90/weapons/railspike-red.png`, `assets/sprites-90/weapons/railspike-red-512.png`
- `ratchet_smg`: `assets/sprites-90/weapons/ratchet_smg.png`, `assets/sprites-90/weapons/ratchet_smg-512.png`, `assets/sprites-90/weapons/ratchet_smg-red.png`, `assets/sprites-90/weapons/ratchet_smg-red-512.png`
- `rebar_bowcaster`: `assets/sprites-90/weapons/rebar_bowcaster.png`, `assets/sprites-90/weapons/rebar_bowcaster-512.png`, `assets/sprites-90/weapons/rebar_bowcaster-red.png`, `assets/sprites-90/weapons/rebar_bowcaster-red-512.png`
- `redline_laser`: `assets/sprites-90/weapons/redline_laser.png`, `assets/sprites-90/weapons/redline_laser-512.png`, `assets/sprites-90/weapons/redline_laser-red.png`, `assets/sprites-90/weapons/redline_laser-red-512.png`
- `redshift_rifle`: `assets/sprites-90/weapons/redshift_rifle.png`, `assets/sprites-90/weapons/redshift_rifle-512.png`, `assets/sprites-90/weapons/redshift_rifle-red.png`, `assets/sprites-90/weapons/redshift_rifle-red-512.png`
- `ricochet_cannon`: `assets/sprites-90/weapons/ricochet_cannon.png`, `assets/sprites-90/weapons/ricochet_cannon-512.png`, `assets/sprites-90/weapons/ricochet_cannon-red.png`, `assets/sprites-90/weapons/ricochet_cannon-red-512.png`
- `rivet_cannon`: `assets/sprites-90/weapons/rivet_cannon.png`, `assets/sprites-90/weapons/rivet_cannon-512.png`, `assets/sprites-90/weapons/rivet_cannon-red.png`, `assets/sprites-90/weapons/rivet_cannon-red-512.png`
- `rocket_artillery`: `assets/sprites-90/weapons/rocket_artillery.png`, `assets/sprites-90/weapons/rocket_artillery-512.png`, `assets/sprites-90/weapons/rocket_artillery-red.png`, `assets/sprites-90/weapons/rocket_artillery-red-512.png`
- `rotary_sawarm`: `assets/sprites-90/weapons/rotary_sawarm.png`, `assets/sprites-90/weapons/rotary_sawarm-512.png`, `assets/sprites-90/weapons/rotary_sawarm-red.png`, `assets/sprites-90/weapons/rotary_sawarm-red-512.png`
- `rust_cloud_projector`: `assets/sprites-90/weapons/rust_cloud_projector.png`, `assets/sprites-90/weapons/rust_cloud_projector-512.png`, `assets/sprites-90/weapons/rust_cloud_projector-red.png`, `assets/sprites-90/weapons/rust_cloud_projector-red-512.png`
- `rustfang`: `assets/sprites-90/weapons/rustfang.png`, `assets/sprites-90/weapons/rustfang-512.png`, `assets/sprites-90/weapons/rustfang-red.png`, `assets/sprites-90/weapons/rustfang-red-512.png`
- `salvagers_nailgun`: `assets/sprites-90/weapons/salvagers_nailgun.png`, `assets/sprites-90/weapons/salvagers_nailgun-512.png`, `assets/sprites-90/weapons/salvagers_nailgun-red.png`, `assets/sprites-90/weapons/salvagers_nailgun-red-512.png`
- `sawtooth_repeater`: `assets/sprites-90/weapons/sawtooth_repeater.png`, `assets/sprites-90/weapons/sawtooth_repeater-512.png`, `assets/sprites-90/weapons/sawtooth_repeater-red.png`, `assets/sprites-90/weapons/sawtooth_repeater-red-512.png`
- `scatterjack`: `assets/sprites-90/weapons/scatterjack.png`, `assets/sprites-90/weapons/scatterjack-512.png`, `assets/sprites-90/weapons/scatterjack-red.png`, `assets/sprites-90/weapons/scatterjack-red-512.png`
- `scrap_mortar`: `assets/sprites-90/weapons/scrap_mortar.png`, `assets/sprites-90/weapons/scrap_mortar-512.png`, `assets/sprites-90/weapons/scrap_mortar-red.png`, `assets/sprites-90/weapons/scrap_mortar-red-512.png`
- `scrap_singularity`: `assets/sprites-90/weapons/scrap_singularity.png`, `assets/sprites-90/weapons/scrap_singularity-512.png`, `assets/sprites-90/weapons/scrap_singularity-red.png`, `assets/sprites-90/weapons/scrap_singularity-red-512.png`
- `scrapstorm_rotary_gun`: `assets/sprites-90/weapons/scrapstorm_rotary_gun.png`, `assets/sprites-90/weapons/scrapstorm_rotary_gun-512.png`, `assets/sprites-90/weapons/scrapstorm_rotary_gun-red.png`, `assets/sprites-90/weapons/scrapstorm_rotary_gun-red-512.png`
- `seismic_hammer`: `assets/sprites-90/weapons/seismic_hammer.png`, `assets/sprites-90/weapons/seismic_hammer-512.png`, `assets/sprites-90/weapons/seismic_hammer-red.png`, `assets/sprites-90/weapons/seismic_hammer-red-512.png`
- `shredder_8`: `assets/sprites-90/weapons/shredder_8.png`, `assets/sprites-90/weapons/shredder_8-512.png`, `assets/sprites-90/weapons/shredder_8-red.png`, `assets/sprites-90/weapons/shredder_8-red-512.png`
- `siege_cannon`: `assets/sprites-90/weapons/siege_cannon.png`, `assets/sprites-90/weapons/siege_cannon-512.png`, `assets/sprites-90/weapons/siege_cannon-red.png`, `assets/sprites-90/weapons/siege_cannon-red-512.png`
- `siege_nail_driver`: `assets/sprites-90/weapons/siege_nail_driver.png`, `assets/sprites-90/weapons/siege_nail_driver-512.png`, `assets/sprites-90/weapons/siege_nail_driver-red.png`, `assets/sprites-90/weapons/siege_nail_driver-red-512.png`
- `singularity_projector`: `assets/sprites-90/weapons/singularity_projector.png`, `assets/sprites-90/weapons/singularity_projector-512.png`, `assets/sprites-90/weapons/singularity_projector-red.png`, `assets/sprites-90/weapons/singularity_projector-red-512.png`
- `slugger_cannon`: `assets/sprites-90/weapons/slugger_cannon.png`, `assets/sprites-90/weapons/slugger_cannon-512.png`, `assets/sprites-90/weapons/slugger_cannon-red.png`, `assets/sprites-90/weapons/slugger_cannon-red-512.png`
- `splitter_axe`: `assets/sprites-90/weapons/splitter_axe.png`, `assets/sprites-90/weapons/splitter_axe-512.png`, `assets/sprites-90/weapons/splitter_axe-red.png`, `assets/sprites-90/weapons/splitter_axe-red-512.png`
- `spore_mortar`: `assets/sprites-90/weapons/spore_mortar.png`, `assets/sprites-90/weapons/spore_mortar-512.png`, `assets/sprites-90/weapons/spore_mortar-red.png`, `assets/sprites-90/weapons/spore_mortar-red-512.png`
- `starved_reactor`: `assets/sprites-90/weapons/starved_reactor.png`, `assets/sprites-90/weapons/starved_reactor-512.png`, `assets/sprites-90/weapons/starved_reactor-red.png`, `assets/sprites-90/weapons/starved_reactor-red-512.png`
- `static_harpoon`: `assets/sprites-90/weapons/static_harpoon.png`, `assets/sprites-90/weapons/static_harpoon-512.png`, `assets/sprites-90/weapons/static_harpoon-red.png`, `assets/sprites-90/weapons/static_harpoon-red-512.png`
- `storm_cage`: `assets/sprites-90/weapons/storm_cage.png`, `assets/sprites-90/weapons/storm_cage-512.png`, `assets/sprites-90/weapons/storm_cage-red.png`, `assets/sprites-90/weapons/storm_cage-red-512.png`
- `sunspot_blaster`: `assets/sprites-90/weapons/sunspot_blaster.png`, `assets/sprites-90/weapons/sunspot_blaster-512.png`, `assets/sprites-90/weapons/sunspot_blaster-red.png`, `assets/sprites-90/weapons/sunspot_blaster-red-512.png`
- `tesla_fork`: `assets/sprites-90/weapons/tesla_fork.png`, `assets/sprites-90/weapons/tesla_fork-512.png`, `assets/sprites-90/weapons/tesla_fork-red.png`, `assets/sprites-90/weapons/tesla_fork-red-512.png`
- `the_last_argument`: `assets/sprites-90/weapons/the_last_argument.png`, `assets/sprites-90/weapons/the_last_argument-512.png`, `assets/sprites-90/weapons/the_last_argument-red.png`, `assets/sprites-90/weapons/the_last_argument-red-512.png`
- `the_negotiator`: `assets/sprites-90/weapons/the_negotiator.png`, `assets/sprites-90/weapons/the_negotiator-512.png`, `assets/sprites-90/weapons/the_negotiator-red.png`, `assets/sprites-90/weapons/the_negotiator-red-512.png`
- `thunderclap_autocannon`: `assets/sprites-90/weapons/thunderclap_autocannon.png`, `assets/sprites-90/weapons/thunderclap_autocannon-512.png`, `assets/sprites-90/weapons/thunderclap_autocannon-red.png`, `assets/sprites-90/weapons/thunderclap_autocannon-red-512.png`
- `toaster_turret`: `assets/sprites-90/weapons/toaster_turret.png`, `assets/sprites-90/weapons/toaster_turret-512.png`, `assets/sprites-90/weapons/toaster_turret-red.png`, `assets/sprites-90/weapons/toaster_turret-red-512.png`
- `toxic_dart_array`: `assets/sprites-90/weapons/toxic_dart_array.png`, `assets/sprites-90/weapons/toxic_dart_array-512.png`, `assets/sprites-90/weapons/toxic_dart_array-red.png`, `assets/sprites-90/weapons/toxic_dart_array-red-512.png`
- `twin_bore_autogun`: `assets/sprites-90/weapons/twin_bore_autogun.png`, `assets/sprites-90/weapons/twin_bore_autogun-512.png`, `assets/sprites-90/weapons/twin_bore_autogun-red.png`, `assets/sprites-90/weapons/twin_bore_autogun-red-512.png`
- `vibroknife`: `assets/sprites-90/weapons/vibroknife.png`, `assets/sprites-90/weapons/vibroknife-512.png`, `assets/sprites-90/weapons/vibroknife-red.png`, `assets/sprites-90/weapons/vibroknife-red-512.png`
- `widowmaker_lmg`: `assets/sprites-90/weapons/widowmaker_lmg.png`, `assets/sprites-90/weapons/widowmaker_lmg-512.png`, `assets/sprites-90/weapons/widowmaker_lmg-red.png`, `assets/sprites-90/weapons/widowmaker_lmg-red-512.png`
- `wrecking_maul`: `assets/sprites-90/weapons/wrecking_maul.png`, `assets/sprites-90/weapons/wrecking_maul-512.png`, `assets/sprites-90/weapons/wrecking_maul-red.png`, `assets/sprites-90/weapons/wrecking_maul-red-512.png`

## Structures — 23 x blue/red

- `aa_turret`: `assets/sprites-90/structures/aa_turret.png`, `assets/sprites-90/structures/aa_turret-512.png`, `assets/sprites-90/structures/aa_turret-red.png`, `assets/sprites-90/structures/aa_turret-red-512.png`
- `advanced_reactor`: `assets/sprites-90/structures/advanced_reactor.png`, `assets/sprites-90/structures/advanced_reactor-512.png`, `assets/sprites-90/structures/advanced_reactor-red.png`, `assets/sprites-90/structures/advanced_reactor-red-512.png`
- `aircraft_hangar`: `assets/sprites-90/structures/aircraft_hangar.png`, `assets/sprites-90/structures/aircraft_hangar-512.png`, `assets/sprites-90/structures/aircraft_hangar-red.png`, `assets/sprites-90/structures/aircraft_hangar-red-512.png`
- `ammo_depot`: `assets/sprites-90/structures/ammo_depot.png`, `assets/sprites-90/structures/ammo_depot-512.png`, `assets/sprites-90/structures/ammo_depot-red.png`, `assets/sprites-90/structures/ammo_depot-red-512.png`
- `bunker`: `assets/sprites-90/structures/bunker.png`, `assets/sprites-90/structures/bunker-512.png`, `assets/sprites-90/structures/bunker-red.png`, `assets/sprites-90/structures/bunker-red-512.png`
- `command_core`: `assets/sprites-90/structures/command_core.png`, `assets/sprites-90/structures/command_core-512.png`, `assets/sprites-90/structures/command_core-red.png`, `assets/sprites-90/structures/command_core-red-512.png`
- `experimental_facility`: `assets/sprites-90/structures/experimental_facility.png`, `assets/sprites-90/structures/experimental_facility-512.png`, `assets/sprites-90/structures/experimental_facility-red.png`, `assets/sprites-90/structures/experimental_facility-red-512.png`
- `heavy_plant`: `assets/sprites-90/structures/heavy_plant.png`, `assets/sprites-90/structures/heavy_plant-512.png`, `assets/sprites-90/structures/heavy_plant-red.png`, `assets/sprites-90/structures/heavy_plant-red-512.png`
- `heavy_turret`: `assets/sprites-90/structures/heavy_turret.png`, `assets/sprites-90/structures/heavy_turret-512.png`, `assets/sprites-90/structures/heavy_turret-red.png`, `assets/sprites-90/structures/heavy_turret-red-512.png`
- `light_factory`: `assets/sprites-90/structures/light_factory.png`, `assets/sprites-90/structures/light_factory-512.png`, `assets/sprites-90/structures/light_factory-red.png`, `assets/sprites-90/structures/light_factory-red-512.png`
- `light_turret`: `assets/sprites-90/structures/light_turret.png`, `assets/sprites-90/structures/light_turret-512.png`, `assets/sprites-90/structures/light_turret-red.png`, `assets/sprites-90/structures/light_turret-red-512.png`
- `logistics_hub`: `assets/sprites-90/structures/logistics_hub.png`, `assets/sprites-90/structures/logistics_hub-512.png`, `assets/sprites-90/structures/logistics_hub-red.png`, `assets/sprites-90/structures/logistics_hub-red-512.png`
- `mech_bay`: `assets/sprites-90/structures/mech_bay.png`, `assets/sprites-90/structures/mech_bay-512.png`, `assets/sprites-90/structures/mech_bay-red.png`, `assets/sprites-90/structures/mech_bay-red-512.png`
- `missile_turret`: `assets/sprites-90/structures/missile_turret.png`, `assets/sprites-90/structures/missile_turret-512.png`, `assets/sprites-90/structures/missile_turret-red.png`, `assets/sprites-90/structures/missile_turret-red-512.png`
- `power_plant`: `assets/sprites-90/structures/power_plant.png`, `assets/sprites-90/structures/power_plant-512.png`, `assets/sprites-90/structures/power_plant-red.png`, `assets/sprites-90/structures/power_plant-red-512.png`
- `radar_station`: `assets/sprites-90/structures/radar_station.png`, `assets/sprites-90/structures/radar_station-512.png`, `assets/sprites-90/structures/radar_station-red.png`, `assets/sprites-90/structures/radar_station-red-512.png`
- `repair_depot`: `assets/sprites-90/structures/repair_depot.png`, `assets/sprites-90/structures/repair_depot-512.png`, `assets/sprites-90/structures/repair_depot-red.png`, `assets/sprites-90/structures/repair_depot-red-512.png`
- `research_lab`: `assets/sprites-90/structures/research_lab.png`, `assets/sprites-90/structures/research_lab-512.png`, `assets/sprites-90/structures/research_lab-red.png`, `assets/sprites-90/structures/research_lab-red-512.png`
- `salvage_processor`: `assets/sprites-90/structures/salvage_processor.png`, `assets/sprites-90/structures/salvage_processor-512.png`, `assets/sprites-90/structures/salvage_processor-red.png`, `assets/sprites-90/structures/salvage_processor-red-512.png`
- `scrap_extractor`: `assets/sprites-90/structures/scrap_extractor.png`, `assets/sprites-90/structures/scrap_extractor-512.png`, `assets/sprites-90/structures/scrap_extractor-red.png`, `assets/sprites-90/structures/scrap_extractor-red-512.png`
- `shield_generator`: `assets/sprites-90/structures/shield_generator.png`, `assets/sprites-90/structures/shield_generator-512.png`, `assets/sprites-90/structures/shield_generator-red.png`, `assets/sprites-90/structures/shield_generator-red-512.png`
- `vehicle_factory`: `assets/sprites-90/structures/vehicle_factory.png`, `assets/sprites-90/structures/vehicle_factory-512.png`, `assets/sprites-90/structures/vehicle_factory-red.png`, `assets/sprites-90/structures/vehicle_factory-red-512.png`
- `wall`: `assets/sprites-90/structures/wall.png`, `assets/sprites-90/structures/wall-512.png`, `assets/sprites-90/structures/wall-red.png`, `assets/sprites-90/structures/wall-red-512.png`

## Terrain tiles — 20

- `abandoned_military_base`: `assets/sprites-90/terrain/abandoned_military_base.png`, `assets/sprites-90/terrain/abandoned_military_base-512.png`
- `bridge`: `assets/sprites-90/terrain/bridge.png`, `assets/sprites-90/terrain/bridge-512.png`
- `broken_asphalt_road`: `assets/sprites-90/terrain/broken_asphalt_road.png`, `assets/sprites-90/terrain/broken_asphalt_road-512.png`
- `canyon_ravine`: `assets/sprites-90/terrain/canyon_ravine.png`, `assets/sprites-90/terrain/canyon_ravine-512.png`
- `crater_field`: `assets/sprites-90/terrain/crater_field.png`, `assets/sprites-90/terrain/crater_field-512.png`
- `desert_flats_dunes`: `assets/sprites-90/terrain/desert_flats_dunes.png`, `assets/sprites-90/terrain/desert_flats_dunes-512.png`
- `dirt`: `assets/sprites-90/terrain/dirt.png`, `assets/sprites-90/terrain/dirt-512.png`
- `forest`: `assets/sprites-90/terrain/forest.png`, `assets/sprites-90/terrain/forest-512.png`
- `forested_overgrown_ruins`: `assets/sprites-90/terrain/forested_overgrown_ruins.png`, `assets/sprites-90/terrain/forested_overgrown_ruins-512.png`
- `frozen_irradiated_zone`: `assets/sprites-90/terrain/frozen_irradiated_zone.png`, `assets/sprites-90/terrain/frozen_irradiated_zone-512.png`
- `grass`: `assets/sprites-90/terrain/grass.png`, `assets/sprites-90/terrain/grass-512.png`
- `industrial_complex`: `assets/sprites-90/terrain/industrial_complex.png`, `assets/sprites-90/terrain/industrial_complex-512.png`
- `marsh_contaminated_pool`: `assets/sprites-90/terrain/marsh_contaminated_pool.png`, `assets/sprites-90/terrain/marsh_contaminated_pool-512.png`
- `open_wasteland`: `assets/sprites-90/terrain/open_wasteland.png`, `assets/sprites-90/terrain/open_wasteland-512.png`
- `river_water_shallow_crossing`: `assets/sprites-90/terrain/river_water_shallow_crossing.png`, `assets/sprites-90/terrain/river_water_shallow_crossing-512.png`
- `rock`: `assets/sprites-90/terrain/rock.png`, `assets/sprites-90/terrain/rock-512.png`
- `rocky_highlands`: `assets/sprites-90/terrain/rocky_highlands.png`, `assets/sprites-90/terrain/rocky_highlands-512.png`
- `underground_facility_entrance`: `assets/sprites-90/terrain/underground_facility_entrance.png`, `assets/sprites-90/terrain/underground_facility_entrance-512.png`
- `urban_ruins`: `assets/sprites-90/terrain/urban_ruins.png`, `assets/sprites-90/terrain/urban_ruins-512.png`
- `water`: `assets/sprites-90/terrain/water.png`, `assets/sprites-90/terrain/water-512.png`

## Overlay base tiles — 42

- `broken_asphalt_plain_v1`: `assets/tiles-overlay/base/broken_asphalt_plain_v1.png`, `assets/tiles-overlay/base/broken_asphalt_plain_v1-512.png`
- `broken_asphalt_plain_v2`: `assets/tiles-overlay/base/broken_asphalt_plain_v2.png`, `assets/tiles-overlay/base/broken_asphalt_plain_v2-512.png`
- `broken_asphalt_plain_v3`: `assets/tiles-overlay/base/broken_asphalt_plain_v3.png`, `assets/tiles-overlay/base/broken_asphalt_plain_v3-512.png`
- `crater_ground_v1`: `assets/tiles-overlay/base/crater_ground_v1.png`, `assets/tiles-overlay/base/crater_ground_v1-512.png`
- `crater_ground_v2`: `assets/tiles-overlay/base/crater_ground_v2.png`, `assets/tiles-overlay/base/crater_ground_v2-512.png`
- `crater_ground_v3`: `assets/tiles-overlay/base/crater_ground_v3.png`, `assets/tiles-overlay/base/crater_ground_v3-512.png`
- `desert_sand_v1`: `assets/tiles-overlay/base/desert_sand_v1.png`, `assets/tiles-overlay/base/desert_sand_v1-512.png`
- `desert_sand_v2`: `assets/tiles-overlay/base/desert_sand_v2.png`, `assets/tiles-overlay/base/desert_sand_v2-512.png`
- `desert_sand_v3`: `assets/tiles-overlay/base/desert_sand_v3.png`, `assets/tiles-overlay/base/desert_sand_v3-512.png`
- `dirt_v1`: `assets/tiles-overlay/base/dirt_v1.png`, `assets/tiles-overlay/base/dirt_v1-512.png`
- `dirt_v2`: `assets/tiles-overlay/base/dirt_v2.png`, `assets/tiles-overlay/base/dirt_v2-512.png`
- `dirt_v3`: `assets/tiles-overlay/base/dirt_v3.png`, `assets/tiles-overlay/base/dirt_v3-512.png`
- `forest_floor_v1`: `assets/tiles-overlay/base/forest_floor_v1.png`, `assets/tiles-overlay/base/forest_floor_v1-512.png`
- `forest_floor_v2`: `assets/tiles-overlay/base/forest_floor_v2.png`, `assets/tiles-overlay/base/forest_floor_v2-512.png`
- `forest_floor_v3`: `assets/tiles-overlay/base/forest_floor_v3.png`, `assets/tiles-overlay/base/forest_floor_v3-512.png`
- `frozen_ground_v1`: `assets/tiles-overlay/base/frozen_ground_v1.png`, `assets/tiles-overlay/base/frozen_ground_v1-512.png`
- `frozen_ground_v2`: `assets/tiles-overlay/base/frozen_ground_v2.png`, `assets/tiles-overlay/base/frozen_ground_v2-512.png`
- `frozen_ground_v3`: `assets/tiles-overlay/base/frozen_ground_v3.png`, `assets/tiles-overlay/base/frozen_ground_v3-512.png`
- `grass_v1`: `assets/tiles-overlay/base/grass_v1.png`, `assets/tiles-overlay/base/grass_v1-512.png`
- `grass_v2`: `assets/tiles-overlay/base/grass_v2.png`, `assets/tiles-overlay/base/grass_v2-512.png`
- `grass_v3`: `assets/tiles-overlay/base/grass_v3.png`, `assets/tiles-overlay/base/grass_v3-512.png`
- `industrial_floor_v1`: `assets/tiles-overlay/base/industrial_floor_v1.png`, `assets/tiles-overlay/base/industrial_floor_v1-512.png`
- `industrial_floor_v2`: `assets/tiles-overlay/base/industrial_floor_v2.png`, `assets/tiles-overlay/base/industrial_floor_v2-512.png`
- `industrial_floor_v3`: `assets/tiles-overlay/base/industrial_floor_v3.png`, `assets/tiles-overlay/base/industrial_floor_v3-512.png`
- `marsh_ground_v1`: `assets/tiles-overlay/base/marsh_ground_v1.png`, `assets/tiles-overlay/base/marsh_ground_v1-512.png`
- `marsh_ground_v2`: `assets/tiles-overlay/base/marsh_ground_v2.png`, `assets/tiles-overlay/base/marsh_ground_v2-512.png`
- `marsh_ground_v3`: `assets/tiles-overlay/base/marsh_ground_v3.png`, `assets/tiles-overlay/base/marsh_ground_v3-512.png`
- `open_wasteland_v1`: `assets/tiles-overlay/base/open_wasteland_v1.png`, `assets/tiles-overlay/base/open_wasteland_v1-512.png`
- `open_wasteland_v2`: `assets/tiles-overlay/base/open_wasteland_v2.png`, `assets/tiles-overlay/base/open_wasteland_v2-512.png`
- `open_wasteland_v3`: `assets/tiles-overlay/base/open_wasteland_v3.png`, `assets/tiles-overlay/base/open_wasteland_v3-512.png`
- `river_bank_ground_v1`: `assets/tiles-overlay/base/river_bank_ground_v1.png`, `assets/tiles-overlay/base/river_bank_ground_v1-512.png`
- `river_bank_ground_v2`: `assets/tiles-overlay/base/river_bank_ground_v2.png`, `assets/tiles-overlay/base/river_bank_ground_v2-512.png`
- `river_bank_ground_v3`: `assets/tiles-overlay/base/river_bank_ground_v3.png`, `assets/tiles-overlay/base/river_bank_ground_v3-512.png`
- `rocky_ground_v1`: `assets/tiles-overlay/base/rocky_ground_v1.png`, `assets/tiles-overlay/base/rocky_ground_v1-512.png`
- `rocky_ground_v2`: `assets/tiles-overlay/base/rocky_ground_v2.png`, `assets/tiles-overlay/base/rocky_ground_v2-512.png`
- `rocky_ground_v3`: `assets/tiles-overlay/base/rocky_ground_v3.png`, `assets/tiles-overlay/base/rocky_ground_v3-512.png`
- `urban_ground_v1`: `assets/tiles-overlay/base/urban_ground_v1.png`, `assets/tiles-overlay/base/urban_ground_v1-512.png`
- `urban_ground_v2`: `assets/tiles-overlay/base/urban_ground_v2.png`, `assets/tiles-overlay/base/urban_ground_v2-512.png`
- `urban_ground_v3`: `assets/tiles-overlay/base/urban_ground_v3.png`, `assets/tiles-overlay/base/urban_ground_v3-512.png`
- `water_plain_v1`: `assets/tiles-overlay/base/water_plain_v1.png`, `assets/tiles-overlay/base/water_plain_v1-512.png`
- `water_plain_v2`: `assets/tiles-overlay/base/water_plain_v2.png`, `assets/tiles-overlay/base/water_plain_v2-512.png`
- `water_plain_v3`: `assets/tiles-overlay/base/water_plain_v3.png`, `assets/tiles-overlay/base/water_plain_v3-512.png`

## Overlay tiles — 123

- `corner_ne`: `assets/tiles-overlay/overlays/bridge_deck/corner_ne.png`, `assets/tiles-overlay/overlays/bridge_deck/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/bridge_deck/corner_nw.png`, `assets/tiles-overlay/overlays/bridge_deck/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/bridge_deck/corner_se.png`, `assets/tiles-overlay/overlays/bridge_deck/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/bridge_deck/corner_sw.png`, `assets/tiles-overlay/overlays/bridge_deck/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/bridge_deck/cross.png`, `assets/tiles-overlay/overlays/bridge_deck/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/bridge_deck/end_east.png`, `assets/tiles-overlay/overlays/bridge_deck/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/bridge_deck/end_north.png`, `assets/tiles-overlay/overlays/bridge_deck/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/bridge_deck/end_south.png`, `assets/tiles-overlay/overlays/bridge_deck/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/bridge_deck/end_west.png`, `assets/tiles-overlay/overlays/bridge_deck/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/bridge_deck/straight_ew.png`, `assets/tiles-overlay/overlays/bridge_deck/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/bridge_deck/straight_ns.png`, `assets/tiles-overlay/overlays/bridge_deck/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/bridge_deck/t_east.png`, `assets/tiles-overlay/overlays/bridge_deck/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/bridge_deck/t_north.png`, `assets/tiles-overlay/overlays/bridge_deck/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/bridge_deck/t_south.png`, `assets/tiles-overlay/overlays/bridge_deck/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/bridge_deck/t_west.png`, `assets/tiles-overlay/overlays/bridge_deck/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/cracks/corner_ne.png`, `assets/tiles-overlay/overlays/cracks/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/cracks/corner_nw.png`, `assets/tiles-overlay/overlays/cracks/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/cracks/corner_se.png`, `assets/tiles-overlay/overlays/cracks/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/cracks/corner_sw.png`, `assets/tiles-overlay/overlays/cracks/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/cracks/cross.png`, `assets/tiles-overlay/overlays/cracks/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/cracks/end_east.png`, `assets/tiles-overlay/overlays/cracks/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/cracks/end_north.png`, `assets/tiles-overlay/overlays/cracks/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/cracks/end_south.png`, `assets/tiles-overlay/overlays/cracks/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/cracks/end_west.png`, `assets/tiles-overlay/overlays/cracks/end_west-512.png`
- `scatter_1`: `assets/tiles-overlay/overlays/cracks/scatter_1.png`, `assets/tiles-overlay/overlays/cracks/scatter_1-512.png`
- `scatter_2`: `assets/tiles-overlay/overlays/cracks/scatter_2.png`, `assets/tiles-overlay/overlays/cracks/scatter_2-512.png`
- `scatter_3`: `assets/tiles-overlay/overlays/cracks/scatter_3.png`, `assets/tiles-overlay/overlays/cracks/scatter_3-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/cracks/straight_ew.png`, `assets/tiles-overlay/overlays/cracks/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/cracks/straight_ns.png`, `assets/tiles-overlay/overlays/cracks/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/cracks/t_east.png`, `assets/tiles-overlay/overlays/cracks/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/cracks/t_north.png`, `assets/tiles-overlay/overlays/cracks/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/cracks/t_south.png`, `assets/tiles-overlay/overlays/cracks/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/cracks/t_west.png`, `assets/tiles-overlay/overlays/cracks/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/dirt_path/corner_ne.png`, `assets/tiles-overlay/overlays/dirt_path/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/dirt_path/corner_nw.png`, `assets/tiles-overlay/overlays/dirt_path/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/dirt_path/corner_se.png`, `assets/tiles-overlay/overlays/dirt_path/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/dirt_path/corner_sw.png`, `assets/tiles-overlay/overlays/dirt_path/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/dirt_path/cross.png`, `assets/tiles-overlay/overlays/dirt_path/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/dirt_path/end_east.png`, `assets/tiles-overlay/overlays/dirt_path/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/dirt_path/end_north.png`, `assets/tiles-overlay/overlays/dirt_path/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/dirt_path/end_south.png`, `assets/tiles-overlay/overlays/dirt_path/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/dirt_path/end_west.png`, `assets/tiles-overlay/overlays/dirt_path/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/dirt_path/straight_ew.png`, `assets/tiles-overlay/overlays/dirt_path/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/dirt_path/straight_ns.png`, `assets/tiles-overlay/overlays/dirt_path/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/dirt_path/t_east.png`, `assets/tiles-overlay/overlays/dirt_path/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/dirt_path/t_north.png`, `assets/tiles-overlay/overlays/dirt_path/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/dirt_path/t_south.png`, `assets/tiles-overlay/overlays/dirt_path/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/dirt_path/t_west.png`, `assets/tiles-overlay/overlays/dirt_path/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/pipes/corner_ne.png`, `assets/tiles-overlay/overlays/pipes/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/pipes/corner_nw.png`, `assets/tiles-overlay/overlays/pipes/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/pipes/corner_se.png`, `assets/tiles-overlay/overlays/pipes/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/pipes/corner_sw.png`, `assets/tiles-overlay/overlays/pipes/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/pipes/cross.png`, `assets/tiles-overlay/overlays/pipes/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/pipes/end_east.png`, `assets/tiles-overlay/overlays/pipes/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/pipes/end_north.png`, `assets/tiles-overlay/overlays/pipes/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/pipes/end_south.png`, `assets/tiles-overlay/overlays/pipes/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/pipes/end_west.png`, `assets/tiles-overlay/overlays/pipes/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/pipes/straight_ew.png`, `assets/tiles-overlay/overlays/pipes/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/pipes/straight_ns.png`, `assets/tiles-overlay/overlays/pipes/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/pipes/t_east.png`, `assets/tiles-overlay/overlays/pipes/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/pipes/t_north.png`, `assets/tiles-overlay/overlays/pipes/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/pipes/t_south.png`, `assets/tiles-overlay/overlays/pipes/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/pipes/t_west.png`, `assets/tiles-overlay/overlays/pipes/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/road/corner_ne.png`, `assets/tiles-overlay/overlays/road/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/road/corner_nw.png`, `assets/tiles-overlay/overlays/road/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/road/corner_se.png`, `assets/tiles-overlay/overlays/road/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/road/corner_sw.png`, `assets/tiles-overlay/overlays/road/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/road/cross.png`, `assets/tiles-overlay/overlays/road/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/road/end_east.png`, `assets/tiles-overlay/overlays/road/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/road/end_north.png`, `assets/tiles-overlay/overlays/road/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/road/end_south.png`, `assets/tiles-overlay/overlays/road/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/road/end_west.png`, `assets/tiles-overlay/overlays/road/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/road/straight_ew.png`, `assets/tiles-overlay/overlays/road/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/road/straight_ns.png`, `assets/tiles-overlay/overlays/road/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/road/t_east.png`, `assets/tiles-overlay/overlays/road/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/road/t_north.png`, `assets/tiles-overlay/overlays/road/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/road/t_south.png`, `assets/tiles-overlay/overlays/road/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/road/t_west.png`, `assets/tiles-overlay/overlays/road/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/stepping_stones/corner_ne.png`, `assets/tiles-overlay/overlays/stepping_stones/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/stepping_stones/corner_nw.png`, `assets/tiles-overlay/overlays/stepping_stones/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/stepping_stones/corner_se.png`, `assets/tiles-overlay/overlays/stepping_stones/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/stepping_stones/corner_sw.png`, `assets/tiles-overlay/overlays/stepping_stones/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/stepping_stones/cross.png`, `assets/tiles-overlay/overlays/stepping_stones/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/stepping_stones/end_east.png`, `assets/tiles-overlay/overlays/stepping_stones/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/stepping_stones/end_north.png`, `assets/tiles-overlay/overlays/stepping_stones/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/stepping_stones/end_south.png`, `assets/tiles-overlay/overlays/stepping_stones/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/stepping_stones/end_west.png`, `assets/tiles-overlay/overlays/stepping_stones/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/stepping_stones/straight_ew.png`, `assets/tiles-overlay/overlays/stepping_stones/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/stepping_stones/straight_ns.png`, `assets/tiles-overlay/overlays/stepping_stones/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/stepping_stones/t_east.png`, `assets/tiles-overlay/overlays/stepping_stones/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/stepping_stones/t_north.png`, `assets/tiles-overlay/overlays/stepping_stones/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/stepping_stones/t_south.png`, `assets/tiles-overlay/overlays/stepping_stones/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/stepping_stones/t_west.png`, `assets/tiles-overlay/overlays/stepping_stones/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/train_tracks/corner_ne.png`, `assets/tiles-overlay/overlays/train_tracks/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/train_tracks/corner_nw.png`, `assets/tiles-overlay/overlays/train_tracks/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/train_tracks/corner_se.png`, `assets/tiles-overlay/overlays/train_tracks/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/train_tracks/corner_sw.png`, `assets/tiles-overlay/overlays/train_tracks/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/train_tracks/cross.png`, `assets/tiles-overlay/overlays/train_tracks/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/train_tracks/end_east.png`, `assets/tiles-overlay/overlays/train_tracks/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/train_tracks/end_north.png`, `assets/tiles-overlay/overlays/train_tracks/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/train_tracks/end_south.png`, `assets/tiles-overlay/overlays/train_tracks/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/train_tracks/end_west.png`, `assets/tiles-overlay/overlays/train_tracks/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/train_tracks/straight_ew.png`, `assets/tiles-overlay/overlays/train_tracks/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/train_tracks/straight_ns.png`, `assets/tiles-overlay/overlays/train_tracks/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/train_tracks/t_east.png`, `assets/tiles-overlay/overlays/train_tracks/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/train_tracks/t_north.png`, `assets/tiles-overlay/overlays/train_tracks/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/train_tracks/t_south.png`, `assets/tiles-overlay/overlays/train_tracks/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/train_tracks/t_west.png`, `assets/tiles-overlay/overlays/train_tracks/t_west-512.png`
- `corner_ne`: `assets/tiles-overlay/overlays/wires_cables/corner_ne.png`, `assets/tiles-overlay/overlays/wires_cables/corner_ne-512.png`
- `corner_nw`: `assets/tiles-overlay/overlays/wires_cables/corner_nw.png`, `assets/tiles-overlay/overlays/wires_cables/corner_nw-512.png`
- `corner_se`: `assets/tiles-overlay/overlays/wires_cables/corner_se.png`, `assets/tiles-overlay/overlays/wires_cables/corner_se-512.png`
- `corner_sw`: `assets/tiles-overlay/overlays/wires_cables/corner_sw.png`, `assets/tiles-overlay/overlays/wires_cables/corner_sw-512.png`
- `cross`: `assets/tiles-overlay/overlays/wires_cables/cross.png`, `assets/tiles-overlay/overlays/wires_cables/cross-512.png`
- `end_east`: `assets/tiles-overlay/overlays/wires_cables/end_east.png`, `assets/tiles-overlay/overlays/wires_cables/end_east-512.png`
- `end_north`: `assets/tiles-overlay/overlays/wires_cables/end_north.png`, `assets/tiles-overlay/overlays/wires_cables/end_north-512.png`
- `end_south`: `assets/tiles-overlay/overlays/wires_cables/end_south.png`, `assets/tiles-overlay/overlays/wires_cables/end_south-512.png`
- `end_west`: `assets/tiles-overlay/overlays/wires_cables/end_west.png`, `assets/tiles-overlay/overlays/wires_cables/end_west-512.png`
- `straight_ew`: `assets/tiles-overlay/overlays/wires_cables/straight_ew.png`, `assets/tiles-overlay/overlays/wires_cables/straight_ew-512.png`
- `straight_ns`: `assets/tiles-overlay/overlays/wires_cables/straight_ns.png`, `assets/tiles-overlay/overlays/wires_cables/straight_ns-512.png`
- `t_east`: `assets/tiles-overlay/overlays/wires_cables/t_east.png`, `assets/tiles-overlay/overlays/wires_cables/t_east-512.png`
- `t_north`: `assets/tiles-overlay/overlays/wires_cables/t_north.png`, `assets/tiles-overlay/overlays/wires_cables/t_north-512.png`
- `t_south`: `assets/tiles-overlay/overlays/wires_cables/t_south.png`, `assets/tiles-overlay/overlays/wires_cables/t_south-512.png`
- `t_west`: `assets/tiles-overlay/overlays/wires_cables/t_west.png`, `assets/tiles-overlay/overlays/wires_cables/t_west-512.png`

## Wrecks — 49, team-neutral (animation/wrecks)

- `scout_buggy_wreck` (Scout Buggy, catalog size 0.4): `assets/animation/wrecks/scout_buggy_wreck.png`, `assets/animation/wrecks/scout_buggy_wreck-512.png`
- `vespid_scout_wreck` (Vespid Scout, catalog size 0.4): `assets/animation/wrecks/vespid_scout_wreck.png`, `assets/animation/wrecks/vespid_scout_wreck-512.png`
- `combat_drone_wreck` (Combat Drone, catalog size 0.35): `assets/animation/wrecks/combat_drone_wreck.png`, `assets/animation/wrecks/combat_drone_wreck-512.png`
- `radar_scout_wreck` (Radar Scout, catalog size 0.4): `assets/animation/wrecks/radar_scout_wreck.png`, `assets/animation/wrecks/radar_scout_wreck-512.png`
- `salvage_team_wreck` (Salvage Team, catalog size 0.35): `assets/animation/wrecks/salvage_team_wreck.png`, `assets/animation/wrecks/salvage_team_wreck-512.png`
- `repair_scout_wreck` (Repair Scout, catalog size 0.4): `assets/animation/wrecks/repair_scout_wreck.png`, `assets/animation/wrecks/repair_scout_wreck-512.png`
- `sensor_drone_wreck` (Sensor Drone, catalog size 0.3): `assets/animation/wrecks/sensor_drone_wreck.png`, `assets/animation/wrecks/sensor_drone_wreck-512.png`
- `ew_skirmisher_wreck` (EW Skirmisher, catalog size 0.4): `assets/animation/wrecks/ew_skirmisher_wreck.png`, `assets/animation/wrecks/ew_skirmisher_wreck-512.png`
- `fast_raider_wreck` (Fast Raider, catalog size 0.4): `assets/animation/wrecks/fast_raider_wreck.png`, `assets/animation/wrecks/fast_raider_wreck-512.png`
- `decoy_drone_wreck` (Decoy Drone, catalog size 0.3): `assets/animation/wrecks/decoy_drone_wreck.png`, `assets/animation/wrecks/decoy_drone_wreck-512.png`
- `medium_tank_wreck` (Medium Tank, catalog size 0.6): `assets/animation/wrecks/medium_tank_wreck.png`, `assets/animation/wrecks/medium_tank_wreck-512.png`
- `heavy_tank_wreck` (Heavy Tank, catalog size 0.7): `assets/animation/wrecks/heavy_tank_wreck.png`, `assets/animation/wrecks/heavy_tank_wreck-512.png`
- `bulwark_mech_wreck` (Bulwark Mech, catalog size 0.65): `assets/animation/wrecks/bulwark_mech_wreck.png`, `assets/animation/wrecks/bulwark_mech_wreck-512.png`
- `lancer_mech_wreck` (Lancer Mech, catalog size 0.55): `assets/animation/wrecks/lancer_mech_wreck.png`, `assets/animation/wrecks/lancer_mech_wreck-512.png`
- `siege_cannon_wreck` (Siege Cannon, catalog size 0.6): `assets/animation/wrecks/siege_cannon_wreck.png`, `assets/animation/wrecks/siege_cannon_wreck-512.png`
- `longshot_mech_wreck` (Longshot Artillery Mech, catalog size 0.6): `assets/animation/wrecks/longshot_mech_wreck.png`, `assets/animation/wrecks/longshot_mech_wreck-512.png`
- `rocket_battery_wreck` (Rocket Battery, catalog size 0.6): `assets/animation/wrecks/rocket_battery_wreck.png`, `assets/animation/wrecks/rocket_battery_wreck-512.png`
- `breach_walker_wreck` (Breach Walker, catalog size 0.7): `assets/animation/wrecks/breach_walker_wreck.png`, `assets/animation/wrecks/breach_walker_wreck-512.png`
- `mortar_carrier_wreck` (Mortar Carrier, catalog size 0.55): `assets/animation/wrecks/mortar_carrier_wreck.png`, `assets/animation/wrecks/mortar_carrier_wreck-512.png`
- `heavy_railgun_wreck` (Heavy Railgun Platform, catalog size 0.7): `assets/animation/wrecks/heavy_railgun_wreck.png`, `assets/animation/wrecks/heavy_railgun_wreck-512.png`
- `rocket_artillery_mech_wreck` (Rocket Artillery Mech, catalog size 0.6): `assets/animation/wrecks/rocket_artillery_mech_wreck.png`, `assets/animation/wrecks/rocket_artillery_mech_wreck-512.png`
- `siege_engineer_wreck` (Siege Engineer, catalog size 0.5): `assets/animation/wrecks/siege_engineer_wreck.png`, `assets/animation/wrecks/siege_engineer_wreck-512.png`
- `demolition_crawler_wreck` (Demolition Crawler, catalog size 0.65): `assets/animation/wrecks/demolition_crawler_wreck.png`, `assets/animation/wrecks/demolition_crawler_wreck-512.png`
- `experimental_artillery_wreck` (Experimental Artillery, catalog size 0.8): `assets/animation/wrecks/experimental_artillery_wreck.png`, `assets/animation/wrecks/experimental_artillery_wreck-512.png`
- `interceptor_drone_wreck` (Interceptor Drone, catalog size 0.35): `assets/animation/wrecks/interceptor_drone_wreck.png`, `assets/animation/wrecks/interceptor_drone_wreck-512.png`
- `flak_tank_wreck` (Flak Tank, catalog size 0.6): `assets/animation/wrecks/flak_tank_wreck.png`, `assets/animation/wrecks/flak_tank_wreck-512.png`
- `missile_carrier_wreck` (Missile Carrier, catalog size 0.55): `assets/animation/wrecks/missile_carrier_wreck.png`, `assets/animation/wrecks/missile_carrier_wreck-512.png`
- `gunship_wreck` (Gunship, catalog size 0.55): `assets/animation/wrecks/gunship_wreck.png`, `assets/animation/wrecks/gunship_wreck-512.png`
- `strike_bomber_wreck` (Strike Bomber, catalog size 0.6): `assets/animation/wrecks/strike_bomber_wreck.png`, `assets/animation/wrecks/strike_bomber_wreck-512.png`
- `transport_aircraft_wreck` (Transport Aircraft, catalog size 0.6): `assets/animation/wrecks/transport_aircraft_wreck.png`, `assets/animation/wrecks/transport_aircraft_wreck-512.png`
- `drone_carrier_wreck` (Drone Carrier, catalog size 0.8): `assets/animation/wrecks/drone_carrier_wreck.png`, `assets/animation/wrecks/drone_carrier_wreck-512.png`
- `recon_aircraft_wreck` (Recon Aircraft, catalog size 0.4): `assets/animation/wrecks/recon_aircraft_wreck.png`, `assets/animation/wrecks/recon_aircraft_wreck-512.png`
- `construction_vehicle_wreck` (Construction Vehicle, catalog size 0.55): `assets/animation/wrecks/construction_vehicle_wreck.png`, `assets/animation/wrecks/construction_vehicle_wreck-512.png`
- `field_repair_mech_wreck` (Field Repair Mech, catalog size 0.55): `assets/animation/wrecks/field_repair_mech_wreck.png`, `assets/animation/wrecks/field_repair_mech_wreck-512.png`
- `recovery_crawler_wreck` (Recovery Crawler, catalog size 0.55): `assets/animation/wrecks/recovery_crawler_wreck.png`, `assets/animation/wrecks/recovery_crawler_wreck-512.png`
- `supply_carrier_wreck` (Supply Carrier, catalog size 0.5): `assets/animation/wrecks/supply_carrier_wreck.png`, `assets/animation/wrecks/supply_carrier_wreck-512.png`
- `shield_projector_wreck` (Shield Projector, catalog size 0.6): `assets/animation/wrecks/shield_projector_wreck.png`, `assets/animation/wrecks/shield_projector_wreck-512.png`
- `ew_mech_wreck` (Electronic Warfare Mech, catalog size 0.5): `assets/animation/wrecks/ew_mech_wreck.png`, `assets/animation/wrecks/ew_mech_wreck-512.png`
- `command_walker_wreck` (Command Walker, catalog size 0.65): `assets/animation/wrecks/command_walker_wreck.png`, `assets/animation/wrecks/command_walker_wreck-512.png`
- `bridge_layer_wreck` (Bridge Layer, catalog size 0.55): `assets/animation/wrecks/bridge_layer_wreck.png`, `assets/animation/wrecks/bridge_layer_wreck-512.png`
- `combat_engineer_wreck` (Combat Engineer, catalog size 0.45): `assets/animation/wrecks/combat_engineer_wreck.png`, `assets/animation/wrecks/combat_engineer_wreck-512.png`
- `rampart_fortress_wreck` (Rampart Siege Fortress, catalog size 1.1): `assets/animation/wrecks/rampart_fortress_wreck.png`, `assets/animation/wrecks/rampart_fortress_wreck-512.png`
- `titan_breaker_wreck` (Titan Breaker, catalog size 0.9): `assets/animation/wrecks/titan_breaker_wreck.png`, `assets/animation/wrecks/titan_breaker_wreck-512.png`
- `storm_lance_wreck` (Storm Lance, catalog size 0.6): `assets/animation/wrecks/storm_lance_wreck.png`, `assets/animation/wrecks/storm_lance_wreck-512.png`
- `warden_platform_wreck` (Warden Platform, catalog size 0.95): `assets/animation/wrecks/warden_platform_wreck.png`, `assets/animation/wrecks/warden_platform_wreck-512.png`
- `mobile_foundry_wreck` (Mobile Foundry, catalog size 0.9): `assets/animation/wrecks/mobile_foundry_wreck.png`, `assets/animation/wrecks/mobile_foundry_wreck-512.png`
- `colossus_engine_wreck` (Colossus Artillery Engine, catalog size 1.2): `assets/animation/wrecks/colossus_engine_wreck.png`, `assets/animation/wrecks/colossus_engine_wreck-512.png`
- `command_carrier_wreck` (Command Carrier, catalog size 0.95): `assets/animation/wrecks/command_carrier_wreck.png`, `assets/animation/wrecks/command_carrier_wreck-512.png`
- `drone_swarm_wreck` (Strategic Drone Swarm, catalog size 0.5): `assets/animation/wrecks/drone_swarm_wreck.png`, `assets/animation/wrecks/drone_swarm_wreck-512.png`

## FX — 15 (animation/fx)

- smoke: `smoke_1` (`assets/animation/fx/smoke_1.png`, `assets/animation/fx/smoke_1-512.png`), `smoke_2` (`assets/animation/fx/smoke_2.png`, `assets/animation/fx/smoke_2-512.png`), `smoke_3` (`assets/animation/fx/smoke_3.png`, `assets/animation/fx/smoke_3-512.png`)
- fire: `fire_1` (`assets/animation/fx/fire_1.png`, `assets/animation/fx/fire_1-512.png`), `fire_2` (`assets/animation/fx/fire_2.png`, `assets/animation/fx/fire_2-512.png`), `fire_3` (`assets/animation/fx/fire_3.png`, `assets/animation/fx/fire_3-512.png`)
- muzzle: `muzzle_1` (`assets/animation/fx/muzzle_1.png`, `assets/animation/fx/muzzle_1-512.png`), `muzzle_2` (`assets/animation/fx/muzzle_2.png`, `assets/animation/fx/muzzle_2-512.png`), `muzzle_3` (`assets/animation/fx/muzzle_3.png`, `assets/animation/fx/muzzle_3-512.png`)
- explosion: `explosion_1` (`assets/animation/fx/explosion_1.png`, `assets/animation/fx/explosion_1-512.png`), `explosion_2` (`assets/animation/fx/explosion_2.png`, `assets/animation/fx/explosion_2-512.png`), `explosion_3` (`assets/animation/fx/explosion_3.png`, `assets/animation/fx/explosion_3-512.png`), `explosion_4` (`assets/animation/fx/explosion_4.png`, `assets/animation/fx/explosion_4-512.png`)
- dust: `dust_1` (`assets/animation/fx/dust_1.png`, `assets/animation/fx/dust_1-512.png`), `dust_2` (`assets/animation/fx/dust_2.png`, `assets/animation/fx/dust_2-512.png`)

## Projectiles — 4, nose-up (animation/projectiles)

- `kinetic_tracer`: `assets/animation/projectiles/kinetic_tracer.png`, `assets/animation/projectiles/kinetic_tracer-512.png`
- `missile`: `assets/animation/projectiles/missile.png`, `assets/animation/projectiles/missile-512.png`
- `energy_bolt`: `assets/animation/projectiles/energy_bolt.png`, `assets/animation/projectiles/energy_bolt-512.png`
- `flame`: `assets/animation/projectiles/flame.png`, `assets/animation/projectiles/flame-512.png`

## Forest canopy — 6 (animation/canopy, sit over forest_floor bases)

- `canopy_single`: `assets/animation/canopy/canopy_single.png`, `assets/animation/canopy/canopy_single-512.png`
- `canopy_dense`: `assets/animation/canopy/canopy_dense.png`, `assets/animation/canopy/canopy_dense-512.png`
- `canopy_edge_n`: `assets/animation/canopy/canopy_edge_n.png`, `assets/animation/canopy/canopy_edge_n-512.png`
- `canopy_edge_s`: `assets/animation/canopy/canopy_edge_s.png`, `assets/animation/canopy/canopy_edge_s-512.png`
- `canopy_edge_e`: `assets/animation/canopy/canopy_edge_e.png`, `assets/animation/canopy/canopy_edge_e-512.png`
- `canopy_edge_w`: `assets/animation/canopy/canopy_edge_w.png`, `assets/animation/canopy/canopy_edge_w-512.png`
