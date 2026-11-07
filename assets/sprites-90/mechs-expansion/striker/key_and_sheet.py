#!/usr/bin/env python3
"""Mechs 90deg QC pipeline (adapted for sprites-90/mechs, standalone copy).
key: flood-fill from borders through near-black (max<48), soft alpha falloff,
trim to bbox, re-center on transparent square with even padding, full + 512 LANCZOS.
slice: equal grid cells with 2% inset. sheet: labeled sheet on dark backdrop.
paint_red: paint clear red team accents onto a keyed sprite (center disc + edge
lights) — used ONLY as a fallback if a generated red is indistinguishable; the
primary reds in this batch are separately generated, not swaps.
"""
import sys, os
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
NEAR = 48

def load_rgba(p): return Image.open(p).convert("RGBA")

def key_image(im):
    import numpy as np
    arr = np.array(im); h, w = arr.shape[:2]
    near = arr[:, :, :3].max(axis=2) < NEAR
    visited = np.zeros((h, w), dtype=bool); q = deque()
    for x in range(w):
        for y in (0, h-1):
            if near[y, x] and not visited[y, x]: visited[y, x]=True; q.append((x, y))
    for y in range(h):
        for x in (0, w-1):
            if near[y, x] and not visited[y, x]: visited[y, x]=True; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and near[ny, nx] and not visited[ny, nx]:
                visited[ny, nx]=True; q.append((nx, ny))
    alpha = arr[:, :, 3].copy(); alpha[visited]=0
    out = arr.copy(); out[:, :, 3]=alpha
    img = Image.fromarray(out, "RGBA")
    a = img.split()[3].filter(ImageFilter.GaussianBlur(1.0)); img.putalpha(a)
    return img

def square_pad(im, pad_frac=0.08):
    bbox = im.getchannel("A").getbbox()
    if not bbox: return im
    cropped = im.crop(bbox); w, h = cropped.size
    side = int(max(w, h)*(1+2*pad_frac))+2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side-w)//2, (side-h)//2)); return canvas

def write_both(im, out_base):
    im.save(out_base); im.resize((512, 512), Image.LANCZOS).save(out_base.replace(".png", "-512.png"))
    print(f"wrote {out_base} ({im.size}) + -512")

def do_key(raw, out_base): write_both(square_pad(key_image(load_rgba(raw))), out_base)

def do_slice(grid, cols, rows, outdir, prefix):
    im = load_rgba(grid); W, H = im.size; cw, ch = W//cols, H//rows
    os.makedirs(outdir, exist_ok=True)
    for r in range(rows):
        for c in range(cols):
            x0=c*cw+int(cw*0.02); y0=r*ch+int(ch*0.02); x1=(c+1)*cw-int(cw*0.02); y1=(r+1)*ch-int(ch*0.02)
            im.crop((x0, y0, x1, y1)).save(os.path.join(outdir, f"{prefix}-r{r}c{c}.png"))
    print(f"sliced {grid} into {cols}x{rows} cells in {outdir}")

def do_sheet(spec, outp, cols=4):
    items=[]
    for part in spec.split(","):
        label, path = part.split(":", 1); items.append((label, path))
    cell=256; label_h=28; pad=8; rows=(len(items)+cols-1)//cols
    W=cols*(cell+pad)+pad; H=rows*(cell+label_h+pad)+pad
    sheet=Image.new("RGB", (W, H), (20, 20, 20)); d=ImageDraw.Draw(sheet)
    for i,(label, path) in enumerate(items):
        cx=pad+(i%cols)*(cell+pad); cy=pad+(i//cols)*(cell+label_h+pad)
        im=load_rgba(path).resize((cell, cell), Image.LANCZOS)
        sheet.paste(im, (cx, cy), im); d.text((cx+4, cy+cell+4), label, fill=(240,240,240))
    sheet.save(outp); print(f"sheet {outp} ({W}x{H}, {len(items)} items)")

if __name__ == "__main__":
    cmd=sys.argv[1]
    if cmd=="key": do_key(sys.argv[2], sys.argv[3])
    elif cmd=="sheet":
        cols=4; args=sys.argv[2:]
        if "--cols" in args:
            i=args.index("--cols"); cols=int(args[i+1]); args=args[:i]
        do_sheet(args[0], args[1], cols)
    elif cmd=="slice": do_slice(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[6])
    else: raise SystemExit(f"unknown cmd {cmd}")
