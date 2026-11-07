# Longshot-class — 90° Category Report (expansion chassis)

- Scope: LONGSHOT CLASS ONLY, under
  `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/longshot/`.
  Nothing else was touched: not `sprites/`, not `sprites-90/mechs/`, not
  `sprites-90/units/`, not `sprites-90/weapons/`, not `tiles-overlay/`, not
  any other `mechs-expansion/` subfolder, no game code, nothing committed,
  pushed, published, or packaged.
- These are NEW chassis, distinct from the existing `longshot` in
  `sprites-90/mechs/` — that file was not overwritten or copied.
- Method (same as the `sprites-90/mechs/` set, whose report was read first):
  two 4×2 grid images on pure black, one blue and one red, sliced with a
  standalone copy of the keying tool kept in this folder
  (`key_and_sheet.py` — the original was not modified), flood-fill keyed
  from the borders through near-black (max < 48, so dark interior detail
  survives), soft alpha falloff, trimmed and re-centred on a transparent
  square canvas with even padding, full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 2 (1 blue grid + 1 red grid). No chassis regeneration
  calls were needed — see Rejected / regenerated below.
- Raws + prompt records: `raw/grid-blue.png`, `raw/grid-red.png`,
  `raw/prompt-blue.txt`, `raw/prompt-red.txt`, sliced cells in
  `raw/cells-blue/` (flawed first-pass slices, see below),
  `raw/cells-blue2/` (corrected slices actually shipped),
  `raw/cells-red/`, plus the media tool's original files/JSON in `raw/`.
  Raws were never edited in place.
- Contact sheet: `longshot-sheet.png` (16 labeled items, blue + red for
  all 8, dark #141414 backdrop, built from the `-512` copies, 4 columns).
  Visually inspected by the builder: clean transparency on the dark
  backdrop, no text/characters/UI/watermarks on the sprites themselves,
  silhouettes readable at game size, consistent industrial scrap-steel
  family style, strict top-down throughout, reds visibly distinct from
  blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red
  carries a large red centre disc and/or red trim and lights. No R/B swap
  was used on any sprite.

## Sprites (all paths under `.../mechs-expansion/longshot/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| deadeye | Precision sniper — slim compact hull, one very long thin sniper barrel pointing straight up, blue centre lights | `deadeye.png` | `deadeye-512.png` | `deadeye-red.png` | `deadeye-red-512.png` |
| siegeback | Siege carrier — bulky wide armoured hull, one thick short siege cannon barrel pointing straight up, blue centre cross | `siegeback.png` | `siegeback-512.png` | `siegeback-red.png` | `siegeback-red-512.png` |
| thunderhead | Storm cannon — rounded hull with arc coils and lightning glow, one heavy cannon barrel pointing straight up, blue centre dome | `thunderhead.png` | `thunderhead-512.png` | `thunderhead-red.png` | `thunderhead-red-512.png` |
| mortarjack | Mortar mech — squat round hull, one short wide mortar tube pointing straight up, blue ring lights | `mortarjack.png` | `mortarjack-512.png` | `mortarjack-red.png` | `mortarjack-red-512.png` |
| railwarden | Railgun mech — angular hull with twin rail fins, one long railgun barrel pointing straight up, blue centre stripe | `railwarden.png` | `railwarden-512.png` | `railwarden-red.png` | `railwarden-red-512.png` |
| firestorm | Incendiary artillery — hull with flame vents, one broad incendiary cannon barrel pointing straight up, blue vent glow | `firestorm.png` | `firestorm-512.png` | `firestorm-red.png` | `firestorm-red-512.png` |
| horizon | Extreme-range gun — long narrow hull, one extremely long slender gun barrel pointing straight up, fully inside its cell, blue centre stripe | `horizon.png` | `horizon-512.png` | `horizon-red.png` | `horizon-red-512.png` |
| avalanche | Heavy bombardment — massive wide plated hull, one huge bombardment cannon barrel pointing straight up, blue centre block | `avalanche.png` | `avalanche-512.png` | `avalanche-red.png` | `avalanche-red-512.png` |

Count: 8 blue + 8 red = 16 distinct sprites (32 files counting full-size + `-512`).

## Rejected / regenerated

- NO CHASSIS WAS REJECTED AND NO REGENERATION CALL WAS MADE. Both grids
  passed first pass on content: all 8 cells per grid are strict flat 90°
  top-down, no bipeds, no side/front/3/4 views, no diagonal barrels, no
  cell-border bleed of the mechs themselves, no text.
- ONE PIPELINE DEFECT WAS FOUND AND FIXED WITHOUT REGENERATION: the blue
  grid was drawn with ~15 px grey cell dividers straddling the nominal
  cell boundaries (vertical dividers at x 548–562, 1113–1126, 1677–1691;
  horizontal divider at y 545–559). The standard 2% slice inset (11 px)
  left divider fragments inside the blue cells, which survived keying
  (grey > 48) and showed as faint frame lines on the first contact sheet;
  keyed blue alpha bboxes spanned the whole sliced cell, which exposed
  it. Fix: blue cells were re-sliced with a 24 px inset
  (`raw/cells-blue2/`), re-keyed, and the sheet rebuilt — bboxes are now
  properly mech-shaped and the sheet is clean. The flawed first-pass
  slices are preserved in `raw-flawed/` (copies of `raw/cells-blue/`).
  The red grid had no dividers (clean black gaps), so red sprites were
  unaffected and were not re-keyed.

## Honest gaps / notes

- **Red silhouettes diverge from blue silhouettes.** Because the reds were
  generated separately (deliberately, to avoid an identical-swap failure),
  red variants share the class silhouette language, not an exact outline
  (e.g. red siegeback is squarer than blue siegeback; red thunderhead's
  coils are ringed rather than open). Both teams read unambiguously as
  their class and team.
- **Relative size is not preserved across classes.** Every sprite is
  centred on its own square canvas and the `-512` copy is always
  512×512, so deadeye/horizon (slim) and avalanche (massive) end up the
  same pixel size in the `-512` files; in-game scaling must come from
  game data, not these files.
- **Thunderhead-red has a small vertical tick below the hull** (a short
  centre-line protrusion, vertical, not diagonal). It reads top-down and
  was not rejected; flagged here rather than hidden.
- **Mortarjack-red shows a tiny grey sliver below the hull on the sheet.**
  Minor; same treatment — flagged, not hidden.
- **No animation, damage, or wreck frames; no additional faction skins.**
  Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the
  contact sheet plus the alpha/dimension checks above (all 16 `-512`
  copies are 512×512, full-size files are square transparent canvases
  with non-empty alpha bboxes).
- **FAILED / MISSING: none.** All 8 chassis × 2 teams delivered.
