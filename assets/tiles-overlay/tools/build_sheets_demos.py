#!/usr/bin/env python3
"""Contact sheets + autotile demo maps for tiles-overlay.
Autotile: mask per cell from neighbours in the SAME family; variant by mask.
Mask bits N=1,E=2,S=4,W=8. Variant lookup is the inverse of the mask table
in build_overlays.py, with T named by the direction it does NOT go."""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.expanduser("~/workspace/surface-wars/assets/tiles-overlay")
BASE = os.path.join(ROOT, "base")
OVER = os.path.join(ROOT, "overlays")
DEMOS = os.path.join(ROOT, "demos")

MASK_TO_VARIANT = {
    5: "straight_ns", 10: "straight_ew",
    3: "corner_ne", 9: "corner_nw", 6: "corner_se", 12: "corner_sw",
    14: "t_north", 11: "t_south", 13: "t_east", 7: "t_west",
    15: "cross", 1: "end_north", 4: "end_south", 2: "end_east", 8: "end_west",
}
DIRS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
BITS = {"N": 1, "E": 2, "S": 4, "W": 8}

def font(sz=20):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sz)
    except Exception:
        return ImageFont.load_default()

def sheet(family, variants, out, cell=256):
    cols = 4
    rows = (len(variants) + cols - 1) // cols
    W, H = cols * cell, rows * (cell + 26)
    img = Image.new("RGB", (W, H), (20, 20, 20))
    d = ImageDraw.Draw(img)
    for i, v in enumerate(variants):
        x, y = (i % cols) * cell, (i // cols) * (cell + 26)
        p = os.path.join(OVER, family, v + "-512.png")
        tile = Image.open(p).resize((cell, cell), Image.LANCZOS)
        img.paste(tile, (x, y), tile)
        d.text((x + 6, y + cell + 4), v, fill=(255, 255, 255), font=font(16))
    img.save(out)
    print(out, img.size)

BASE_FILES = {"grass": "grass", "dirt": "dirt", "wasteland": "open_wasteland",
              "water": "water_plain", "rock": "rocky_ground", "sand": "desert_sand"}

def base_tile(kind, size=256, x=0, y=0):
    """Real AI base tile. Variant chosen by cell hash, never the same
    variant in a block: (x*7 + y*13) % 3 + 1."""
    stem = BASE_FILES.get(kind, "grass")
    v = (x * 7 + y * 13) % 3 + 1
    p = os.path.join(BASE, f"{stem}_v{v}-512.png")
    return Image.open(p).resize((size, size), Image.LANCZOS).convert("RGB")

def render(grid_base, placements, out, cell=128):
    """grid_base: list of rows of base kinds. placements: dict (x,y)->[families]."""
    h, w = len(grid_base), len(grid_base[0])
    img = Image.new("RGB", (w * cell, h * cell), (0, 0, 0))
    for y in range(h):
        for x in range(w):
            img.paste(base_tile(grid_base[y][x], cell, x, y), (x * cell, y * cell))
    for (x, y), fams in placements.items():
        for fam in fams:
            mask = 0
            for dname, (dx, dy) in DIRS.items():
                if (x + dx, y + dy) in placements and fam in placements[(x + dx, y + dy)]:
                    mask |= BITS[dname]
            if mask == 0:
                continue  # isolated tile: no overlay, never a cross
            var = MASK_TO_VARIANT[mask]
            ov = Image.open(os.path.join(OVER, fam, var + "-512.png")).resize((cell, cell), Image.LANCZOS)
            img.paste(ov, (x * cell, y * cell), ov)
    img.save(out)
    print(out, img.size)

def main():
    os.makedirs(DEMOS, exist_ok=True)
    fams = ["train_tracks", "road", "dirt_path", "stepping_stones",
            "cracks", "wires_cables", "pipes", "bridge_deck"]
    for fam in fams:
        variants = ["straight_ns", "straight_ew", "corner_ne", "corner_nw", "corner_se",
                    "corner_sw", "t_north", "t_south", "t_east", "t_west", "cross",
                    "end_north", "end_south", "end_east", "end_west"]
        if fam == "cracks":
            variants += ["scatter_1", "scatter_2", "scatter_3"]
        sheet(fam, variants, os.path.join(OVER, fam, fam + "-sheet.png"))
    # Demo A: train track straight, two 90deg corners, end
    base = [["grass"] * 9 for _ in range(6)]
    track = {}
    for x in range(1, 6): track[(x, 2)] = ["train_tracks"]
    for y in range(2, 5): track[(5, y)] = ["train_tracks"]
    for x in range(5, 8): track[(x, 4)] = ["train_tracks"]
    render(base, track, os.path.join(DEMOS, "demo_a_train_track.png"))
    # Demo B: road across grass/dirt/wasteland + dirt path T into it
    base = []
    for y in range(7):
        row = []
        for x in range(9):
            row.append("grass" if x < 3 else "dirt" if x < 6 else "wasteland")
        base.append(row)
    pl = {}
    for x in range(9): pl[(x, 3)] = ["road"]
    for y in range(0, 4): pl[(4, y)] = pl.get((4, y), []) + ["dirt_path"]
    render(base, pl, os.path.join(DEMOS, "demo_b_road_path.png"))
    # Demo C: stepping stones across water, bridge deck straight, cracks over rock
    base = [["rock"] * 4 + ["water"] * 4 + ["rock"] * 4 for _ in range(3)] + \
           [["rock"] * 4 + ["water"] * 4 + ["rock"] * 4 for _ in range(3)] + \
           [["rock"] * 12 for _ in range(3)]
    # Water is a vertical channel, cols 4-7, rows 0-5. Both crossings run
    # west-east ACROSS it: stepping stones at row 4 (cols 4-7 only),
    # bridge deck at row 2 (cols 2-9, with rock-bank approaches).
    pl = {}
    for x in range(4, 8): pl[(x, 4)] = ["stepping_stones"]
    for x in range(2, 10): pl[(x, 2)] = ["bridge_deck"]
    # cracks over rock: a line east, then a 90-degree turn south
    for x, y in [(1, 7), (2, 7), (3, 7), (3, 8)]: pl[(x, y)] = ["cracks"]
    render(base, pl, os.path.join(DEMOS, "demo_c_water_bridge_cracks.png"))

if __name__ == "__main__":
    main()
