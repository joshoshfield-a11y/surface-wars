#!/usr/bin/env python3
"""Build red team variants from keyed blue sprites (NOT an R/B channel swap).

Method: HSV hue remap. Pixels whose hue is in the blue/cyan/violet band
(150-290 deg) with saturation > 0.20, or that are blue-dominant (B > R+15),
get hue forced to 0 (true red) with saturation/value preserved. Grey metal,
rust, olive and concrete are untouched, so the red sprite keeps the blue
sprite's shading and silhouette and only its team colour changes.
Guarantee: if the changed-opaque-pixel fraction is < 3%, the saturation
threshold is lowered in steps (0.20 -> 0.12 -> 0.08) and bluish greys
(B >= R) are included, so every red is measurably different from its blue.
Stats are printed per sprite; anything still < 3% is flagged, not shipped
silently.
"""
import sys, colorsys
from PIL import Image
import numpy as np

def make_red(src, dst):
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.float32) / 255.0
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    opaque = alpha > 0.05
    # vectorised HSV via colorsys is slow; use numpy hue computation
    mx = rgb.max(axis=2); mn = rgb.min(axis=2); diff = mx - mn
    sat = np.where(mx > 0, diff / np.maximum(mx, 1e-6), 0)
    # hue in degrees
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    hue = np.zeros_like(mx)
    mask = diff > 1e-6
    idx = mask & (mx == r); hue[idx] = (60 * ((g[idx] - b[idx]) / diff[idx]) + 360) % 360
    idx = mask & (mx == g); hue[idx] = 60 * ((b[idx] - r[idx]) / diff[idx]) + 120
    idx = mask & (mx == b); hue[idx] = 60 * ((r[idx] - g[idx]) / diff[idx]) + 240
    out = rgb.copy()
    for s_thresh, bluish in ((0.20, False), (0.12, False), (0.08, True)):
        sel = opaque & (sat > s_thresh) & (((hue >= 150) & (hue <= 290)) | ((b > r + 0.06)))
        if bluish:
            sel = sel | (opaque & (sat > s_thresh) & (b >= r))
        if sel.sum() == 0:
            continue
        # HSV -> force hue 0, keep S and V
        v = mx[sel]; s = sat[sel]
        # hue 0: R=V, G=V*(1-S), B=V*(1-S)
        out[sel, 0] = v
        out[sel, 1] = v * (1 - s)
        out[sel, 2] = v * (1 - s)
        frac = sel.sum() / max(opaque.sum(), 1)
        if frac >= 0.03:
            break
    else:
        frac = 0.0
    res = Image.fromarray((np.dstack([out, alpha]) * 255).astype(np.uint8), "RGBA")
    res.save(dst)
    # difference stats vs source
    orig = np.array(im).astype(int)
    new = np.array(res).astype(int)
    mad = np.abs(orig[:, :, :3] - new[:, :, :3])[opaque].mean() if opaque.any() else 0
    print(f"{dst}: changed_frac={frac:.3f} mean_abs_diff_opaque={mad:.1f} opaque={int(opaque.sum())}")
    return frac, mad

if __name__ == "__main__":
    for slug in sys.argv[1:]:
        f, m = make_red(f"{slug}.png", f"{slug}-red.png")
        im = Image.open(f"{slug}-red.png")
        im.resize((512, 512), Image.LANCZOS).save(f"{slug}-red-512.png")
        if f < 0.03:
            print(f"  WARNING {slug}: red change fraction below 3% - needs manual review")
