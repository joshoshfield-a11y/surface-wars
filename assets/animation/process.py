#!/usr/bin/env python3
"""Slice + key the animation raw grids into final sprites (sprites-90 QC method).

- key: flood-fill from borders through near-black (<48), soft alpha falloff
- wrecks/fx/projectiles: trim to alpha bbox, re-centre on transparent square
  with even padding, full size + 512x512 LANCZOS -512 copy
- wrecks: full-size canvas rescaled to a target side from the catalog size
  (320 + size*380) so a scout wreck is small and a colossus wreck is large
- canopy: tiles keep tile-square semantics -- foliage is re-anchored flush
  to the named edge (or centred for single, full-cell for dense) on a
  640px square canvas, then a -512 copy
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tools_key_and_sheet import key_image, square_pad
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")

def load(p):
    return Image.open(p).convert("RGBA")

def write_both(im, out_base):
    im.save(out_base)
    im.resize((512, 512), Image.LANCZOS).save(out_base.replace(".png", "-512.png"))
    print(f"wrote {out_base} {im.size} + -512")

def slice_grid(path, cols, rows, inset_frac):
    im = load(path); W, H = im.size; cw, ch = W // cols, H // rows
    cells = []
    for r in range(rows):
        for c in range(cols):
            x0 = c * cw + int(cw * inset_frac); y0 = r * ch + int(ch * inset_frac)
            x1 = (c + 1) * cw - int(cw * inset_frac); y1 = (r + 1) * ch - int(ch * inset_frac)
            cells.append(im.crop((x0, y0, x1, y1)))
    return cells, cw, ch

def process_trimmed(cell, out_base, target_side=None):
    im = square_pad(key_image(cell))
    if target_side:
        im = im.resize((target_side, target_side), Image.LANCZOS)
    write_both(im, out_base)

def find_raw(fragment):
    hits = [p for p in os.listdir(RAW) if fragment in p and p.endswith(".png")]
    assert len(hits) == 1, (fragment, hits)
    return os.path.join(RAW, hits[0])

def main():
    cat = json.load(open(os.path.join(BASE, "raw", "catalog-units.json")))
    sizes = {u[0]: u[2] for u in cat}

    wreck_grids = [
        ("wrecks-grid-01", ["scout_buggy", "vespid_scout", "combat_drone",
                            "radar_scout", "salvage_team", "repair_scout"]),
        ("wrecks-grid-02", ["sensor_drone", "ew_skirmisher", "fast_raider",
                            "decoy_drone", "medium_tank", "heavy_tank"]),
        ("wrecks-grid-03", ["bulwark_mech", "lancer_mech", "siege_cannon",
                            "longshot_mech", "rocket_battery", "breach_walker"]),
        ("wrecks-grid-04", ["mortar_carrier", "heavy_railgun", "rocket_artillery_mech",
                            "siege_engineer", "demolition_crawler", "experimental_artillery"]),
        ("wrecks-grid-05", ["interceptor_drone", "flak_tank", "missile_carrier",
                            "gunship", "strike_bomber", "transport_aircraft"]),
        ("wrecks-grid-06", ["drone_carrier", "recon_aircraft", "construction_vehicle",
                            "field_repair_mech", "recovery_crawler", "supply_carrier"]),
        ("wrecks-grid-07", ["shield_projector", "ew_mech", "command_walker",
                            "bridge_layer", "combat_engineer", "rampart_fortress"]),
        ("wrecks-grid-08", ["titan_breaker", "storm_lance", "warden_platform",
                            "mobile_foundry", "colossus_engine", "command_carrier"]),
    ]
    for frag, ids in wreck_grids:
        cells, _, _ = slice_grid(find_raw(frag), 3, 2, 0.02)
        for uid, cell in zip(ids, cells):
            target = round(320 + sizes[uid] * 380)
            process_trimmed(cell, os.path.join(BASE, "wrecks", f"{uid}_wreck.png"), target)
    process_trimmed(load(find_raw("wrecks-drone-swarm")),
                    os.path.join(BASE, "wrecks", "drone_swarm_wreck.png"),
                    round(320 + sizes["drone_swarm"] * 380))

    fx_a = ["smoke_1", "smoke_2", "smoke_3", "fire_1", "fire_2", "fire_3"]
    cells, _, _ = slice_grid(find_raw("fx-grid-a"), 3, 2, 0.02)
    for name, cell in zip(fx_a, cells):
        process_trimmed(cell, os.path.join(BASE, "fx", f"{name}.png"))
    fx_b = ["muzzle_1", "muzzle_2", "muzzle_3", "explosion_1", "explosion_2", "explosion_3"]
    cells, _, _ = slice_grid(find_raw("fx-grid-b"), 3, 2, 0.02)
    for name, cell in zip(fx_b, cells):
        process_trimmed(cell, os.path.join(BASE, "fx", f"{name}.png"))
    for frag, name in [("fx-explosion-4", "explosion_4"),
                       ("fx-dust-1", "dust_1"), ("fx-dust-2", "dust_2")]:
        process_trimmed(load(find_raw(frag)), os.path.join(BASE, "fx", f"{name}.png"))

    proj = ["kinetic_tracer", "missile", "energy_bolt", "flame"]
    cells, _, _ = slice_grid(find_raw("projectiles-grid"), 2, 2, 0.02)
    for name, cell in zip(proj, cells):
        process_trimmed(cell, os.path.join(BASE, "projectiles", f"{name}.png"))

    # canopy: 0% inset so edge foliage is not clipped; re-anchor per tile
    cells, cw, ch = slice_grid(find_raw("canopy-grid"), 3, 2, 0.0)
    names = ["canopy_single", "canopy_dense", "canopy_edge_n",
             "canopy_edge_s", "canopy_edge_e", "canopy_edge_w"]
    side = cw  # 640, square cells
    for name, cell in zip(names, cells):
        keyed = key_image(cell)
        if name == "canopy_dense":
            out = keyed
        else:
            bbox = keyed.getchannel("A").getbbox()
            assert bbox, name
            crop = keyed.crop(bbox)
            out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            if name == "canopy_single":
                out.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
            elif name == "canopy_edge_n":
                out.paste(crop, ((side - crop.size[0]) // 2, 0))
            elif name == "canopy_edge_s":
                out.paste(crop, ((side - crop.size[0]) // 2, side - crop.size[1]))
            elif name == "canopy_edge_e":
                out.paste(crop, (side - crop.size[0], (side - crop.size[1]) // 2))
            elif name == "canopy_edge_w":
                out.paste(crop, (0, (side - crop.size[1]) // 2))
        write_both(out, os.path.join(BASE, "canopy", f"{name}.png"))

if __name__ == "__main__":
    main()
