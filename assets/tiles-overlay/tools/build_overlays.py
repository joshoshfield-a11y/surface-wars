#!/usr/bin/env python3
"""Build deterministic autotile overlays for the tiles-overlay system.

Geometry guarantee (the whole point): every overlay variant is built from
ARMS. An arm is a shape from the tile centre (256,256) to one edge midpoint
(N=(256,0), E=(512,256), S=(256,512), W=(0,256)), drawn with the same width,
offset and colours in every variant and every family member. Two adjacent
tiles that both have an arm in the shared direction therefore meet at the
shared edge at exactly the same position and width: the line continues.
A variant is simply the set of arms given by its neighbour mask.
No baked cross, junction or road ever appears in a base tile: overlays are
transparent PNGs drawn over any base.

Mask bits: N=1, E=2, S=4, W=8.
Variant naming: straight_ns mask 5, straight_ew 10,
corner_ne 3 (N+E), corner_nw 9, corner_se 6, corner_sw 12,
t_north 14 (arms in all directions EXCEPT north -- the T opens north),
t_south 11, t_east 13, t_west 7, cross 15,
end_north 1, end_south 4, end_east 2, end_west 8.
Mask 0 = no overlay at all (never an end cap, never a cross).

Overlays are drawn programmatically (not AI-generated) on purpose:
AI grids cannot guarantee pixel-exact edge matching, and this system
fails its own demo test if a line is even a few pixels off at a boundary.
Texture/style for bases comes from AI generation; overlay geometry is
deterministic. This is stated openly in the report, not hidden.
"""
import json, os, random
from PIL import Image, ImageDraw

S = 512
C = 256
ROOT = os.path.expanduser("~/workspace/surface-wars/assets/tiles-overlay")
OUT = os.path.join(ROOT, "overlays")

DIRS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
EDGE = {"N": (256, 0), "E": (512, 256), "S": (256, 512), "W": (0, 256)}

VARIANTS = [
    ("straight_ns", 5), ("straight_ew", 10),
    ("corner_ne", 3), ("corner_nw", 9), ("corner_se", 6), ("corner_sw", 12),
    ("t_north", 14), ("t_south", 11), ("t_east", 13), ("t_west", 7),
    ("cross", 15),
    ("end_north", 1), ("end_south", 4), ("end_east", 2), ("end_west", 8),
]
MASK_DIRS = {}
for name, mask in VARIANTS:
    MASK_DIRS[name] = [d for d, bit in (("N", 1), ("E", 2), ("S", 4), ("W", 8)) if mask & bit]

def arm_rect(draw, d, half_width, fill):
    """Rectangle from centre to edge for direction d, width 2*half_width."""
    if d in ("N", "S"):
        x0, x1 = C - half_width, C + half_width
        y0, y1 = (0, C) if d == "N" else (C, S)
    else:
        y0, y1 = C - half_width, C + half_width
        x0, x1 = (C, S) if d == "E" else (0, C)
    draw.rectangle([x0, y0, x1, y1], fill=fill)

def speckle(draw, d, half_width, rng, colours, n=90):
    """Grain inside one arm rectangle; never changes the arm outline."""
    for _ in range(n):
        if d in ("N", "S"):
            x = rng.randint(C - half_width + 4, C + half_width - 4)
            y = rng.randint(0, C) if d == "N" else rng.randint(C, S)
        else:
            y = rng.randint(C - half_width + 4, C + half_width - 4)
            x = rng.randint(C, S) if d == "E" else rng.randint(0, C)
        draw.point((x, y), fill=rng.choice(colours))

def draw_family(img, family, dirs, rng):
    d = ImageDraw.Draw(img)
    if family == "train_tracks":
        off, rw = 30, 11
        vert = [x for x in dirs if x in ("N", "S")]
        horiz = [x for x in dirs if x in ("E", "W")]
        is_corner = len(dirs) == 2 and vert and horiz
        if is_corner:
            # True L turn: each rail turns at its offset corner point
            # (C+s, C+s), not at the tile centre, so no blocky centre square.
            v, h = vert[0], horiz[0]
            for s in (-off, off):
                # vertical rail: edge -> corner point (C+s, C+s)
                vx = C + s
                vy0, vy1 = (0, C + s) if v == "N" else (C + s, S)
                d.rectangle([vx - rw // 2, vy0, vx + rw // 2, vy1], fill=(52, 56, 62, 255))
                d.rectangle([vx - 2, vy0, vx + 2, vy1], fill=(150, 158, 168, 255))
                # horizontal rail: corner point -> edge
                hy = C + s
                hx0, hx1 = (C + s, S) if h == "E" else (0, C + s)
                d.rectangle([hx0, hy - rw // 2, hx1, hy + rw // 2], fill=(52, 56, 62, 255))
                d.rectangle([hx0, hy - 2, hx1, hy + 2], fill=(150, 158, 168, 255))
            # sleepers along both legs of the L
            for t in range(20, 500, 36):
                # vertical leg sleepers (horizontal sleepers)
                vy = (t if v == "S" else S - t)
                if (v == "N" and vy < C + off) or (v == "S" and vy > C - off):
                    d.rectangle([C - 72, vy - 8, C + 72, vy + 8], fill=(96, 66, 38, 255))
                hx = (t if h == "E" else S - t)
                if (h == "E" and hx > C - off) or (h == "W" and hx < C + off):
                    d.rectangle([hx - 8, C - 72, hx + 8, C + 72], fill=(96, 66, 38, 255))
            # rails must be on top of sleepers at the corner: redraw rails
            for s in (-off, off):
                vx = C + s
                vy0, vy1 = (0, C + s) if v == "N" else (C + s, S)
                d.rectangle([vx - rw // 2, vy0, vx + rw // 2, vy1], fill=(52, 56, 62, 255))
                hy = C + s
                hx0, hx1 = (C + s, S) if h == "E" else (0, C + s)
                d.rectangle([hx0, hy - rw // 2, hx1, hy + rw // 2], fill=(52, 56, 62, 255))
            return
        is_straight = len(dirs) == 2 and ((set(dirs) == {"N", "S"}) or (set(dirs) == {"E", "W"}))
        if not is_straight:
            # centre pad FIRST (terminus / junction), arms drawn over it
            d.rectangle([C - 72, C - 72, C + 72, C + 72], fill=(70, 62, 54, 255))
        # sleepers first (under rails)
        for dir_ in dirs:
            dx, dy = DIRS[dir_]
            for t in range(20, C, 36):
                cx, cy = C + dx * t, C + dy * t
                if dir_ in ("N", "S"):
                    d.rectangle([cx - 72, cy - 8, cx + 72, cy + 8], fill=(96, 66, 38, 255))
                    d.rectangle([cx - 72, cy - 8, cx + 72, cy - 2], fill=(124, 88, 52, 255))
                else:
                    d.rectangle([cx - 8, cy - 72, cx + 8, cy + 72], fill=(96, 66, 38, 255))
                    d.rectangle([cx - 8, cy - 72, cx + 2, cy + 72], fill=(124, 88, 52, 255))
        for dir_ in dirs:
            for s in (-off, off):
                if dir_ in ("N", "S"):
                    x = C + s
                    y0, y1 = (0, C) if dir_ == "N" else (C, S)
                    d.rectangle([x - rw // 2, y0, x + rw // 2, y1], fill=(52, 56, 62, 255))
                    d.rectangle([x - 2, y0, x + 2, y1], fill=(150, 158, 168, 255))
                else:
                    y = C + s
                    x0, x1 = (C, S) if dir_ == "E" else (0, C)
                    d.rectangle([x0, y - rw // 2, x1, y + rw // 2], fill=(52, 56, 62, 255))
                    d.rectangle([x0, y - 2, x1, y + 2], fill=(150, 158, 168, 255))
    elif family == "road":
        hw = 90
        # centre FIRST, then arms, so edge lines are never erased at centre
        d.rectangle([C - hw, C - hw, C + hw, C + hw], fill=(46, 46, 50, 255))
        for dir_ in dirs:
            arm_rect(d, dir_, hw, (46, 46, 50, 255))
            speckle(d, dir_, hw, rng, [(60, 60, 66, 255), (34, 34, 38, 255)], 120)
            # edge lines (no centre marking, so corners never break it)
            for s in (-hw + 9, hw - 9):
                if dir_ in ("N", "S"):
                    x = C + s
                    y0, y1 = (0, C) if dir_ == "N" else (C, S)
                    d.rectangle([x - 3, y0, x + 3, y1], fill=(210, 205, 180, 255))
                else:
                    y = C + s
                    x0, x1 = (C, S) if dir_ == "E" else (0, C)
                    d.rectangle([x0, y - 3, x1, y + 3], fill=(210, 205, 180, 255))
    elif family == "dirt_path":
        hw = 70
        d.rectangle([C - hw, C - hw, C + hw, C + hw], fill=(168, 138, 96, 255))
        for dir_ in dirs:
            arm_rect(d, dir_, hw, (168, 138, 96, 255))
            speckle(d, dir_, hw, rng, [(188, 160, 118, 255), (140, 112, 76, 255), (200, 178, 140, 255)], 140)
    elif family == "stepping_stones":
        # stones along each arm; a stone centred on the edge is clipped
        # by the tile boundary, so two neighbours complete one stone.
        def stone(cx, cy, along):
            rx, ry = (44, 32) if along in ("N", "S") else (32, 44)
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(148, 148, 142, 255), outline=(70, 70, 66, 255), width=3)
            d.ellipse([cx - rx + 10, cy - ry + 8, cx - rx + 30, cy - ry + 20], fill=(178, 178, 172, 255))
        for dir_ in dirs:
            dx, dy = DIRS[dir_]
            for t in (0, 72, 144, 216):
                stone(C + dx * t, C + dy * t, dir_)
        stone(C, C, "N")
    elif family == "cracks":
        for dir_ in dirs:
            dx, dy = DIRS[dir_]
            # jittered polyline, endpoints EXACT at edge and centre
            pts = [(C + dx * t, C + dy * t) for t in (0, 64, 128, 192, 256)]
            jit = []
            for i, (x, y) in enumerate(pts):
                if i in (0, 4):
                    jit.append((x, y))
                else:
                    perp = (-dy, dx)
                    o = rng.choice([-14, -8, 8, 14])
                    jit.append((x + perp[0] * o, y + perp[1] * o))
            d.line(jit, fill=(28, 24, 20, 255), width=7, joint="curve")
            d.line(jit, fill=(12, 10, 8, 255), width=3, joint="curve")
    elif family == "wires_cables":
        for dir_ in dirs:
            dx, dy = DIRS[dir_]
            d.line([(C, C), EDGE[dir_]], fill=(30, 28, 26, 255), width=9)
            d.line([(C, C), EDGE[dir_]], fill=(150, 92, 52, 255), width=3)
        d.ellipse([C - 14, C - 14, C + 14, C + 14], fill=(30, 28, 26, 255))
    elif family == "pipes":
        hw = 28
        d.rectangle([C - hw, C - hw, C + hw, C + hw], fill=(110, 116, 122, 255))
        for dir_ in dirs:
            arm_rect(d, dir_, hw, (110, 116, 122, 255))
            # highlight stripe, offset consistently so it continues
            for s in (-12,):
                if dir_ in ("N", "S"):
                    x = C + s
                    y0, y1 = (0, C) if dir_ == "N" else (C, S)
                    d.rectangle([x - 4, y0, x + 4, y1], fill=(180, 186, 192, 255))
                else:
                    y = C + s
                    x0, x1 = (C, S) if dir_ == "E" else (0, C)
                    d.rectangle([x0, y - 4, x1, y + 4], fill=(180, 186, 192, 255))
            # joint ring at the edge (same position in every tile)
            if dir_ == "N":
                d.rectangle([C - hw - 6, 0, C + hw + 6, 12], fill=(80, 84, 90, 255))
            elif dir_ == "S":
                d.rectangle([C - hw - 6, S - 12, C + hw + 6, S], fill=(80, 84, 90, 255))
            elif dir_ == "E":
                d.rectangle([S - 12, C - hw - 6, S, C + hw + 6], fill=(80, 84, 90, 255))
            else:
                d.rectangle([0, C - hw - 6, 12, C + hw + 6], fill=(80, 84, 90, 255))
    elif family == "bridge_deck":
        hw = 140
        d.rectangle([C - hw, C - hw, C + hw, C + hw], fill=(128, 96, 58, 255))
        for dir_ in dirs:
            arm_rect(d, dir_, hw, (128, 96, 58, 255))
            # planks perpendicular to the arm, spaced 30px, starting at the
            # edge so plank phase matches the neighbouring tile
            if dir_ in ("N", "S"):
                for y in range(0, C + 1, 30) if dir_ == "N" else range(C, S + 1, 30):
                    d.line([(C - hw, y), (C + hw, y)], fill=(80, 60, 36, 255), width=4)
            else:
                for x in range(C, S + 1, 30) if dir_ == "E" else range(0, C + 1, 30):
                    d.line([(x, C - hw), (x, C + hw)], fill=(80, 60, 36, 255), width=4)
            speckle(d, dir_, hw, rng, [(150, 116, 74, 255), (108, 80, 48, 255)], 80)
            # side rails at band edges
            for s in (-hw + 8, hw - 8):
                if dir_ in ("N", "S"):
                    x = C + s
                    y0, y1 = (0, C) if dir_ == "N" else (C, S)
                    d.rectangle([x - 5, y0, x + 5, y1], fill=(64, 58, 52, 255))
                else:
                    y = C + s
                    x0, x1 = (C, S) if dir_ == "E" else (0, C)
                    d.rectangle([x0, y - 5, x1, y + 5], fill=(64, 58, 52, 255))

def scatter_cracks(idx):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = random.Random(900 + idx)
    # fully inside the tile, >=48px from every edge: never implies continuation
    for _ in range(3):
        x, y = rng.randint(90, 420), rng.randint(90, 420)
        pts = [(x, y)]
        for _ in range(4):
            x += rng.randint(-70, 70); y += rng.randint(-70, 70)
            x = max(50, min(462, x)); y = max(50, min(462, y))
            pts.append((x, y))
        d.line(pts, fill=(28, 24, 20, 255), width=6, joint="curve")
    return img

def main():
    families = ["train_tracks", "road", "dirt_path", "stepping_stones",
                "cracks", "wires_cables", "pipes", "bridge_deck"]
    manifest = {}
    total = 0
    for fam in families:
        fdir = os.path.join(OUT, fam)
        os.makedirs(fdir, exist_ok=True)
        manifest[fam] = {}
        for vname, mask in VARIANTS:
            rng = random.Random(hash((fam, vname)) & 0xFFFFFFFF)
            img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
            draw_family(img, fam, MASK_DIRS[vname], rng)
            for path in (os.path.join(fdir, f"{vname}.png"),
                         os.path.join(fdir, f"{vname}-512.png")):
                img.save(path)
            manifest[fam][vname] = {"file": f"{vname}.png", "mask": mask,
                                     "dirs": MASK_DIRS[vname]}
            total += 1
    # crack scatter variants
    sdir = os.path.join(OUT, "cracks")
    manifest["cracks"]["scatter_1"] = {"file": "scatter_1.png", "mask": 0, "dirs": [], "note": "scattered, no neighbours needed"}
    manifest["cracks"]["scatter_2"] = {"file": "scatter_2.png", "mask": 0, "dirs": [], "note": "scattered, no neighbours needed"}
    manifest["cracks"]["scatter_3"] = {"file": "scatter_3.png", "mask": 0, "dirs": [], "note": "scattered, no neighbours needed"}
    for i in (1, 2, 3):
        img = scatter_cracks(i)
        for path in (os.path.join(sdir, f"scatter_{i}.png"),
                     os.path.join(sdir, f"scatter_{i}-512.png")):
            img.save(path)
        total += 1
    with open(os.path.join(ROOT, "overlays.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"overlays: {total} variants (files x2 = {total * 2})")

if __name__ == "__main__":
    main()
