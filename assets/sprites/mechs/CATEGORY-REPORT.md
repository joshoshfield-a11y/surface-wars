# Mechs — Category Report (spec §7 chassis)

- Method: one 4×2 grid image on pure black, sliced with
  `~/workspace/surface-wars/assets/sprites/tools/key_and_sheet.py` (slice, 4, 2),
  flood-fill keyed from the borders, soft edge falloff, trimmed and re-centred
  on a transparent square canvas, full size + 512×512 LANCZOS `-512` copy.
  Red variants via the script's `recolor-blue-red` (blue-dominant pixels only),
  plus a 512 LANCZOS copy of the red full-size file.
- Contact sheet: `mechs-sheet.png` — 16 labeled items (blue + red for all 8),
  dark backdrop, built from the `-512` copies, `--cols 4`.
- No game code was edited. Nothing committed, pushed, or published.
- Media calls used: 4 of 4 allowed (1 grid + 3 single-sprite regenerations).
- Raw grid: `raw/grid-blue.png`, prompt: `raw/prompt.txt`.
  Regeneration raws + prompts: `raw/<slug>-regen.png`,
  `raw/<slug>-regen-prompt.txt`.

## Sprites (all paths under `~/workspace/surface-wars/assets/sprites/mechs/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| scout | Small fast recon mech — oval top-down hull, central blue sensor circle (regenerated) | `scout.png` | `scout-512.png` | `scout-red.png` | `scout-red-512.png` |
| lancer | Lean mobile assault mech — narrow vertical top-down hull, forward barrel | `lancer.png` | `lancer-512.png` | `lancer-red.png` | `lancer-red-512.png` |
| bulwark | Heavy frontline armoured mech — broad circular top-down plated hull | `bulwark.png` | `bulwark-512.png` | `bulwark-red.png` | `bulwark-red-512.png` |
| longshot | Long-barrel artillery mech — tall top-down hull, very long cannon | `longshot.png` | `longshot-512.png` | `longshot-red.png` | `longshot-red-512.png` |
| rampart | Massive siege mech — huge wide top-down armoured hull | `rampart.png` | `rampart-512.png` | `rampart-red.png` | `rampart-red-512.png` |
| vespid | Agile skirmisher mech — light angular top-down hull, twin small guns | `vespid.png` | `vespid-512.png` | `vespid-red.png` | `vespid-red-512.png` |
| scrapjack | Modular patched-together salvage mech — flat top-down hull of mismatched plates (regenerated) | `scrapjack.png` | `scrapjack-512.png` | `scrapjack-red.png` | `scrapjack-red-512.png` |
| warden | Autonomous heavy mech — flat top-down hull, large central sensor dome (regenerated) | `warden.png` | `warden-512.png` | `warden-red.png` | `warden-red-512.png` |

Count: 8 blue + 8 red = 16 sprites (32 files counting full-size + `-512`).

## Flawed / regenerated classes (second pass = last automatic pass)

1. **warden — contaminated, regenerated successfully.** Longshot's cannon
   barrel crossed the grid row boundary, so a detached barrel tip appeared
   floating above Warden in its sliced cell (`raw-flawed/warden-cell.png`).
   Regenerated as a single sprite with a simplified top-down prompt.
   Outcome: clean — large central sensor dome, no detached parts, no bleed.
2. **scout — wrong view, regenerated successfully.** The grid's Scout was a
   front-facing bipedal robot, not strict 90° top-down
   (`raw-flawed/scout-cell.png`). Regenerated as a flat top-down hull.
   Outcome: clean — oval hull, central sensor circle, readable at game size.
3. **scrapjack — wrong view, regenerated successfully.** The grid's Scrapjack
   was a front-facing bipedal robot (`raw-flawed/scrapjack-cell.png`).
   Regenerated as a flat top-down hull of mismatched plates.
   Outcome: clean — patched plates, hazard stripes, central blue core.

No other class was regenerated. The final sheet was re-read visually after
the second pass: all 16 sprites show clean transparency on the dark
backdrop, no text/characters/UI/watermarks, and readable silhouettes.

## Honest gaps / notes

- **Longshot's barrel crossed a cell border in the grid** (the cause of the
  Warden contamination). Longshot's own keyed sprite still reads as a
  complete long-barrel mech on the final sheet, so it was not regenerated;
  its barrel may be marginally shorter than the grid original. Flagged, not
  hidden.
- **Lancer and Longshot are tall and narrow** in their square `-512`
  canvases (aspect preserved by the QC script, not stretched). They read
  clearly on the sheet but will look slimmer than the wide hulls in game.
- **Red variants are recolors, not re-draws.** Only blue-dominant pixels
  swap to red, so Lancer/Longshot reds carry only small red accents (they
  had few blue pixels to begin with), while Scout/Scrapjack/Warden reds
  read strongly red. Rust and hazard-yellow accents are unchanged in both
  teams, by design of the script.
- **Relative size is not preserved across classes.** The QC script centres
  every sprite on its own square canvas and the `-512` copy is always
  512×512, so Scout (small recon) and Rampart (massive siege) end up the
  same pixel size in the `-512` files; in-game scaling must come from the
  game data, not these files.
- **No real-browser/phone playtest** was done in this task; QC is visual
  inspection of the contact sheet only.
