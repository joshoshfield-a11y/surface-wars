#!/usr/bin/env python3
"""Verify every game-referenced asset exists in the APK asset staging tree.

Staging layout (mirrors the web tree under assets/):
  assets/game/index.html  ->  ../assets/... resolves to assets/assets/...
  assets/assets/<sprite dirs>
Reads unit/structure ids from game/catalog.js via node, plus the hardcoded
name lists from game/sprites.js (fx, projectiles, canopy, overlay variants).
Exits non-zero listing every missing file; prints counts on success.
"""
import json, os, re, subprocess, sys

ROOT = os.path.expanduser("~/workspace/surface-wars")
STAGE = os.path.join(ROOT, "apk", "assets", "assets")  # assets/assets/...
GAME = os.path.join(ROOT, "game")

js = ("const c=require(process.argv[1]);"
      "console.log(JSON.stringify({units: c.units.map(u=>u.id),"
      " structures: c.structures.map(s=>s.id)}));")
r = subprocess.run(["node", "-e", js, os.path.join(GAME, "catalog.js")],
                    capture_output=True, text=True)
if r.returncode != 0:
    print("catalog extract failed:", r.stderr); sys.exit(2)
ids = json.loads(r.stdout)
missing = []
def check(rel):
    p = os.path.join(STAGE, rel)
    if not os.path.isfile(p) or os.path.getsize(p) == 0:
        missing.append(rel)

# Wave-5: the 8 expansion mechs do NOT live in units/ — sprites.js
# EXPANSION_SPRITES maps them to sprites-90/mechs-expansion/<class>/.
# Parse that mapping (never a second hardcoded copy) so the checker
# resolves exactly the path the game loads; every other unit keeps
# the units/ convention. Wreck paths are generic (<id>_wreck-512.png)
# for all units, expansion included.
import re as _re
_sprites_src = open(os.path.join(GAME, "sprites.js")).read()
_m = _re.search(r"var EXPANSION_SPRITES = \{(.*?)\};", _sprites_src, _re.S)
expansion = dict(_re.findall(r"(\w+):\s*'([^']+)'", _m.group(1))) if _m else {}
for uid in ids["units"]:
    if uid in expansion:
        for suf in ("", "-red"):
            check(f"sprites-90/mechs-expansion/{expansion[uid]}{suf}-512.png")
    else:
        for suf in ("", "-red"):
            check(f"sprites-90/units/{uid}{suf}-512.png")
    check(f"animation/wrecks/{uid}_wreck-512.png")
for sid in ids["structures"]:
    for suf in ("", "-red"):
        check(f"sprites-90/structures/{sid}{suf}-512.png")
for base in ("grass", "dirt", "water_plain", "forest_floor", "rocky_ground"):
    for v in (1, 2, 3):
        check(f"tiles-overlay/base/{base}_v{v}-512.png")
variants = ["straight_ns", "straight_ew", "corner_ne", "corner_nw", "corner_se",
            "corner_sw", "t_north", "t_south", "t_east", "t_west", "cross",
            "end_north", "end_south", "end_east", "end_west"]
for fam in ("bridge_deck", "train_tracks", "road", "stepping_stones",
            "dirt_path", "cracks", "wires_cables", "pipes"):
    for var in variants:
        check(f"tiles-overlay/overlays/{fam}/{var}-512.png")
for name in ["smoke_1", "smoke_2", "smoke_3", "fire_1", "fire_2", "fire_3",
             "muzzle_1", "muzzle_2", "muzzle_3", "explosion_1", "explosion_2",
             "explosion_3", "explosion_4", "dust_1", "dust_2",
             "damage_light", "damage_heavy"]:
    check(f"animation/fx/{name}-512.png")
# Wave-2: structure wrecks (v1.5 addition — v1.4 bundled none of these)
# Wave-3: all 23 types now dedicated (v1.5 left 8 on generic rubble).
for stem in ["command_core_wreck", "turret_wreck", "bunker_wreck",
             "wall_wreck", "light_factory_wreck", "scrap_extractor_wreck",
             "power_plant_wreck", "research_lab_wreck", "repair_depot_wreck",
             "radar_station_wreck", "ammo_depot_wreck", "shield_generator_wreck",
             "advanced_reactor_wreck", "vehicle_factory_wreck",
             "mech_bay_wreck", "aircraft_hangar_wreck", "heavy_plant_wreck",
             "salvage_processor_wreck", "logistics_hub_wreck",
             "experimental_facility_wreck", "rubble"]:
    check(f"animation/structure-wrecks/{stem}-512.png")
# Wave-2: UI icons (plain .png, referenced without -512 suffix)
for name in ["move", "attack-move", "hold", "patrol", "salvage", "guard",
             "drop-back-in"]:
    check(f"ui-icons/{name}.png")
for name in ["kinetic_tracer", "missile", "energy_bolt", "flame"]:
    check(f"animation/projectiles/{name}-512.png")
for name in ["canopy_single", "canopy_dense", "canopy_edge_n", "canopy_edge_s",
             "canopy_edge_e", "canopy_edge_w"]:
    check(f"animation/canopy/{name}-512.png")
# Game code itself
# _wave2-harness.html is a QA harness, not loaded by index.html — excluded
# from the bundle by design (v1.5 build.sh explicit file list).
for f in os.listdir(GAME):
    if f == "_wave2-harness.html":
        continue
    if f.endswith((".html", ".js", ".css")):
        p = os.path.join(ROOT, "apk", "assets", "game", f)
        if not os.path.isfile(p):
            missing.append("game/" + f)

print(f"units={len(ids['units'])} structures={len(ids['structures'])}")
if missing:
    print(f"MISSING {len(missing)}:")
    for m in missing:
        print("  " + m)
    sys.exit(1)
print("verify_refs: all referenced files present")
