#!/usr/bin/env python3
"""Sprite QC pipeline for surface-wars (sprite-batch-QC skill).

Usage:
  key:   python3 key_and_sheet.py key <raw.png> <out_base.png>
         -> <out_base>.png (full-size, transparent, square, padded)
            <out_base>-512.png (512x512 LANCZOS)
  recolor: python3 key_and_sheet.py recolor-blue-red <in.png> <out.png>
         -> swaps R/B channels on blue-dominant pixels only (team variant)
  sheet: python3 key_and_sheet.py sheet <label:file,...> <out.png> [--cols N]
         -> labeled contact sheet on dark backdrop (#141414)
  tile:  python3 key_and_sheet.py tile <raw.png> <out_base.png>
         -> full-bleed tile copied untouched + 512 copy (no keying)
  slice: python3 key_and_sheet.py slice <grid.png> <cols> <rows> <outdir> <prefix>
         -> equal grid cells, each trimmed of a 2% inset, saved as raw cells
            (cells are then keyed individually; slicing never edits the raw grid)

Keying: flood-fill from the image borders through near-black pixels only,
so dark interior detail survives. Near-black = max(R,G,B) < 48.
Soft falloff: alpha channel blurred with radius 1.0 after keying.
"""
import sys, os
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

NEAR = 48

def load_rgba(p):
    return Image.open(p).convert("RGBA")

def key_image(im):
    """Flood-fill key: returns RGBA with border-connected near-black -> transparent."""
    import numpy as np
    arr = np.array(im)  # H x W x 4
    h, w = arr.shape[:2]
    near = arr[:, :, :3].max(axis=2) < NEAR
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not visited[y, x]:
                visited[y, x] = True; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not visited[y, x]:
                visited[y, x] = True; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and near[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True; q.append((nx, ny))
    alpha = arr[:, :, 3].copy()
    alpha[visited] = 0
    out = arr.copy(); out[:, :, 3] = alpha
    img = Image.fromarray(out, "RGBA")
    # soft falloff on alpha only
    a = img.split()[3].filter(ImageFilter.GaussianBlur(1.0))
    img.putalpha(a)
    return img

def square_pad(im, pad_frac=0.08):
    """Trim to alpha bbox, re-center on transparent square with even padding."""
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    cropped = im.crop(bbox)
    w, h = cropped.size
    side = int(max(w, h) * (1 + 2 * pad_frac)) + 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - w) // 2, (side - h) // 2))
    return canvas

def write_both(im, out_base):
    im.save(out_base)
    im.resize((512, 512), Image.LANCZOS).save(out_base.replace(".png", "-512.png"))
    print(f"wrote {out_base} ({im.size}) + -512")

def do_key(raw, out_base):
    write_both(square_pad(key_image(load_rgba(raw))), out_base)

def do_tile(raw, out_base):
    im = load_rgba(raw)
    # full-bleed: no keying, square-crop centre if needed, then full + 512
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s)//2, (h - s)//2, (w + s)//2, (h + s)//2))
    write_both(im, out_base)

def do_recolor(inp, outp):
    import numpy as np
    arr = np.array(load_rgba(inp)).astype(int)
    rgb = arr[:, :, :3]
    blue = (rgb[:, :, 2] > rgb[:, :, 0] + 30) & (rgb[:, :, 2] > rgb[:, :, 1] + 10)
    # swap R and B on blue-dominant pixels: bright blue -> bright red, shading preserved
    r = rgb[:, :, 0].copy(); b = rgb[:, :, 2].copy()
    rgb[:, :, 0][blue] = b[blue]
    rgb[:, :, 2][blue] = r[blue]
    arr[:, :, :3] = rgb
    Image.fromarray(arr.astype("uint8"), "RGBA").save(outp)
    print(f"recolored {inp} -> {outp} ({int(blue.sum())} blue-dominant px swapped)")

def do_sheet(spec, outp, cols=4):
    items = []
    for part in spec.split(","):
        label, path = part.split(":", 1)
        items.append((label, path))
    cell = 256; label_h = 28; pad = 8
    rows = (len(items) + cols - 1) // cols
    W = cols * (cell + pad) + pad; H = rows * (cell + label_h + pad) + pad
    sheet = Image.new("RGB", (W, H), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for i, (label, path) in enumerate(items):
        cx = pad + (i % cols) * (cell + pad); cy = pad + (i // cols) * (cell + label_h + pad)
        im = load_rgba(path).resize((cell, cell), Image.LANCZOS)
        sheet.paste(im, (cx, cy), im)
        d.text((cx + 4, cy + cell + 4), label, fill=(240, 240, 240))
    sheet.save(outp); print(f"sheet {outp} ({W}x{H}, {len(items)} items)")

def do_slice(grid, cols, rows, outdir, prefix):
    im = load_rgba(grid); W, H = im.size
    cw, ch = W // cols, H // rows
    os.makedirs(outdir, exist_ok=True)
    for r in range(rows):
        for c in range(cols):
            x0 = c * cw + int(cw * 0.02); y0 = r * ch + int(ch * 0.02)
            x1 = (c + 1) * cw - int(cw * 0.02); y1 = (r + 1) * ch - int(ch * 0.02)
            cell = im.crop((x0, y0, x1, y1))
            cell.save(os.path.join(outdir, f"{prefix}-{r*c+cols and r}_{c}.png")) if False else None
            cell.save(os.path.join(outdir, f"{prefix}-r{r}c{c}.png"))
    print(f"sliced {grid} into {cols}x{rows} cells in {outdir}")

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "key": do_key(sys.argv[2], sys.argv[3])
    elif cmd == "tile": do_tile(sys.argv[2], sys.argv[3])
    elif cmd == "recolor-blue-red": do_recolor(sys.argv[2], sys.argv[3])
    elif cmd == "sheet":
        cols = 4
        args = sys.argv[2:]
        if "--cols" in args:
            i = args.index("--cols"); cols = int(args[i+1]); args = args[:i]
        do_sheet(args[0], args[1], cols)
    elif cmd == "slice": do_slice(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[6])
    else: raise SystemExit(f"unknown cmd {cmd}")
