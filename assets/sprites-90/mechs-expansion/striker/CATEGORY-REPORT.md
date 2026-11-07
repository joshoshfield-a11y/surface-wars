# Striker-class — 90° Category Report (Expansion §2)

- Scope: STRIKER ONLY, under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/striker/` only. Nothing else was touched: no `sprites/`, `sprites-90/mechs/`, `sprites-90/units/`, `sprites-90/weapons/`, `tiles-overlay/`, no other `mechs-expansion/` subfolder, no game code, nothing committed, pushed, published, or packaged.
- These are NEW chassis, not in `sprites-90/mechs/` — nothing there was overwritten. The slug `striker` here is the class folder name; no individual sprite is named `striker`.
- Method (same as `sprites-90/mechs/CATEGORY-REPORT.md`): two 4×2 grid images on pure black, one blue and one red, sliced (4, 2) with a standalone copy of the keying tool kept in this folder (`key_and_sheet.py` — the original in `sprites-90/mechs/` was not modified), flood-fill keyed from the borders through near-black (max < 48, so dark interior detail survives), soft alpha falloff, trimmed and re-centred on a transparent square canvas with even padding, full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 2 (1 blue grid + 1 red grid). No regeneration calls were needed — see Rejected / regenerated below.
- Raws + prompt records: `raw/grid-blue.png` / `raw/grid-blue.webp` (media original) / `raw/prompt-blue.txt`, `raw/grid-red.png` / `raw/grid-red.webp` (media original) / `raw/prompt-red.txt`, sliced cells in `raw/cells-blue/` and `raw/cells-red/`, plus the media tool's original files/JSON in `raw/`. Raws were never edited in place.
- Contact sheet: `striker-sheet.png` (16 labeled items, blue + red for all 8, dark #141414 backdrop, built from the `-512` copies, 4 columns). Visually inspected by the builder: clean transparency on the dark backdrop, no text/characters/UI/watermarks on the sprites themselves, silhouettes readable at game size, consistent industrial scrap-steel family style, strict top-down throughout, reds visibly distinct from blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red carries a large red centre disc plus red trim/lights (javelin-red, raptor-red, hellhound-red, reaver-red, breakneck-red, pitbull-red, iron_jackal-red, riotbreaker-red all have a large red centre disc). No R/B swap was used on any sprite.

## Sprites (all paths under `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/striker/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| javelin | Fast spear-gun striker — lean narrow hull, one very long spear-gun barrel pointing straight up | `javelin.png` | `javelin-512.png` | `javelin-red.png` | `javelin-red-512.png` |
| raptor | Bird-of-prey assault — angular swept-wing hull, central turret disc | `raptor.png` | `raptor-512.png` | `raptor-red.png` | `raptor-red-512.png` |
| hellhound | Aggressive hound mech — low wide predatory hull, twin small guns pointing straight up | `hellhound.png` | `hellhound-512.png` | `hellhound-red.png` | `hellhound-red-512.png` |
| reaver | Raider mech — jagged spiked angular hull, central turret disc | `reaver.png` | `reaver-512.png` | `reaver-red.png` | `reaver-red-512.png` |
| breakneck | Reckless speed mech — very sleek narrow dart hull, blue centre stripe | `breakneck.png` | `breakneck-512.png` | `breakneck-red.png` | `breakneck-red-512.png` |
| pitbull | Stocky brawler — short broad square bulldog hull, blue corner plates, hazard stripe | `pitbull.png` | `pitbull-512.png` | `pitbull-red.png` | `pitbull-red-512.png` |
| iron_jackal | Jackal assault — lean angular hull with pointed snout nose, blue flank trim | `iron_jackal.png` | `iron_jackal-512.png` | `iron_jackal-red.png` | `iron_jackal-red-512.png` |
| riotbreaker | Crowd-breaking assault — broad shield-front hull with wide flat nose plate, blue top trim, hazard stripe | `riotbreaker.png` | `riotbreaker-512.png` | `riotbreaker-red.png` | `riotbreaker-red-512.png` |

Count: 8 blue + 8 red = 16 distinct sprites (32 files counting full-size + `-512`), plus `striker-sheet.png`.

## Rejected / regenerated classes

NONE. No class was rejected and no regeneration pass was run.

- Blue grid, first pass: all 8 cells are strict flat 90° top-down — no bipeds, no side/front/3/4 views, no diagonal barrels (every barrel points straight up), no cell-border bleed, no text. Passed as-is.
- Red grid, first pass: all 8 cells are likewise strict top-down with vertical barrels and no bleed, and every red is visibly distinct from its blue counterpart on the final sheet (large red centre disc on every red). Passed as-is.
- `raw-flawed/` exists but is empty: no flawed raws were moved there, because there were no flawed classes to record.

## Honest gaps / notes

- **Red silhouettes diverge from blue silhouettes.** Because the reds were generated separately (deliberately, to avoid the old set's identical-swap failure), red variants share the class silhouette language, not an exact outline — most noticeably hellhound-red (rounder, more enclosed hull) vs hellhound-blue (open, twin-turret predatory hull), and raptor-red (narrower, taller wings) vs raptor-blue (broad swept wings). Both teams read unambiguously as the same class and team, but they are not the same drawing.
- **Relative size is not preserved across classes.** Every sprite is centred on its own square canvas and the `-512` copy is always 512×512, so Javelin and Pitbull end up the same pixel size in the `-512` files; in-game scaling must come from game data, not these files.
- **Tall hulls run close to their cell edges in the raw grids.** Javelin (both teams) and Breakneck (both teams) are very tall, narrow hulls whose barrel tips / tail tips sit within a few pixels of the sliced-cell edge after the 2% slice inset — but the full tips are present in the grid images and in the keyed outputs (alpha bboxes confirm non-empty margins on the square canvases), so nothing was clipped. Flagged because a future re-slice with a larger inset could clip them.
- **Raptor's swept wings are hull outline, not a diagonal view.** The wings angle outward as part of the flat top-down plan shape; the hull itself is flat, with a round central turret seen from above. Same reading applies to Reaver's spiked outline.
- **No animation, damage, or wreck frames; no other faction skins.** Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the contact sheet only, plus the alpha/dimension checks above (all 16 `-512` copies are 512×512, full-size files are square transparent canvases with non-empty alpha bboxes).
- **FAILED / MISSING: none.** All 8 chassis × 2 teams delivered.
