# Additional Families — PART A Category Report (16 chassis)

- Scope: PART A ONLY — the 16 chassis listed below, under
  `~/workspace/surface-wars/assets/sprites-90/mechs-expansion/additional/`
  (flat files directly in `additional/`, NOT in a part-a subfolder).
  Nothing else was touched: no `sprites/`, `sprites-90/mechs/`,
  `sprites-90/units/`, `sprites-90/weapons/`, `tiles-overlay/`, no other
  mechs-expansion subfolder, no game code, nothing committed, pushed,
  published, or packaged. Sibling files already present in `additional/`
  (a second builder's chassis, e.g. bastille, coilrunner) were not
  modified, overwritten, or renamed; this part's files use distinct slugs.
  `expansion_warden` is a separate slug and file set; the original
  `warden` in `sprites-90/mechs/` was not touched.
- Method (same as `sprites-90/mechs/CATEGORY-REPORT.md`): four 4×2 grid
  images on pure black (blue-a, blue-b, red-a, red-b), sliced (4, 2) with
  a copy of the mechs keying tool kept in this folder
  (`key_and_sheet.py` — the original was not modified), flood-fill keyed
  from the borders through near-black (max < 48), soft alpha falloff,
  trimmed and re-centred on a transparent square canvas with even
  padding, full size + 512×512 LANCZOS `-512` copy.
- Media calls used: 4 (2 blue grids + 2 red grids). No regeneration
  calls were needed — see Rejected / regenerated below.
- Raws + prompt records: `raw-a/grid-{blue,red}-{a,b}.png` (converted
  from the media tool's original `.webp` files, also kept in `raw-a/`
  with their `.json` records), `raw-a/prompt-{blue,red}-{a,b}.txt`,
  sliced cells in `raw-a/cells-{blue,red}-{a,b}/`. Raws were never
  edited in place.
- Contact sheet: `additional-sheet-a.png` (32 labeled items, blue + red
  for all 16, dark #141414 backdrop, built from the `-512` copies,
  4 columns). Visually inspected by the builder: clean transparency on
  the dark backdrop, no text/characters/UI/watermarks on the sprites,
  silhouettes readable at game size, consistent industrial scrap-steel
  family style, strict top-down throughout, reds visibly distinct from
  blues side by side.
- RED VARIANTS ARE SEPARATELY GENERATED, NOT CHANNEL SWAPS. Every red
  was generated as its own grid with large red centre markings and/or
  red trim and lights. No R/B swap was used on any sprite.
  Honest numeric caveat: mean R-minus-B over opaque pixels on the
  `-512` copies is +2 to +30 on reds (blues are −11 to −24), because
  most pixels are dark steel in both teams; the team read comes from
  the large red markings, which are unmistakable on the sheet at game
  size, not from a whole-hull tint. Weakest numeric reds: corsair-red
  (+2) and spiderframe-red (+3) — both still carry visible red trim,
  red lights, and (corsair) red hull edging; strongest: magwalker-red
  (+30, big red coil disc).

## Sprites (all paths under `.../mechs-expansion/additional/`)

| Slug | Description | Blue | Blue 512 | Red | Red 512 |
|---|---|---|---|---|---|
| forgeback | Forge/workshop mech — broad rectangular hull, round furnace dome, anvil-like side blocks, vertical barrel | `forgeback.png` | `forgeback-512.png` | `forgeback-red.png` | `forgeback-red-512.png` |
| scavenger | Salvage collector — compact hull, round magnet dish, claw arms folded flat, vertical barrel | `scavenger.png` | `scavenger-512.png` | `scavenger-red.png` | `scavenger-red-512.png` |
| undertaker | Wreck-hauler — long flat hull, rear tow cradle, winch drum, vertical barrel | `undertaker.png` | `undertaker-512.png` | `undertaker-red.png` | `undertaker-red-512.png` |
| bastard_king | Ramshackle warlord — bulky asymmetrical bolted-plate hull, spiked crown ring around central dome | `bastard_king.png` | `bastard_king-512.png` | `bastard_king-red.png` | `bastard_king-red-512.png` |
| expansion_warden | Autonomous warden variant — flat hexagonal hull, large central sensor dome (NOT the original warden) | `expansion_warden.png` | `expansion_warden-512.png` | `expansion_warden-red.png` | `expansion_warden-red-512.png` |
| spiderframe | Multi-legged spider mech — small round central body, eight thin legs radiating in plan view | `spiderframe.png` | `spiderframe-512.png` | `spiderframe-red.png` | `spiderframe-red-512.png` |
| burrower | Drilling mech — oval hull, large round drill disc at front, tread tracks both sides | `burrower.png` | `burrower-512.png` | `burrower-red.png` | `burrower-red-512.png` |
| amphibian | Amphibious mech — smooth rounded hull, pontoons both sides, small vertical snorkel mast | `amphibian.png` | `amphibian-512.png` | `amphibian-red.png` | `amphibian-red-512.png` |
| magwalker | Magnetic walker — compact hull, horseshoe magnet blocks at corners, central coil disc | `magwalker.png` | `magwalker-512.png` | `magwalker-red.png` | `magwalker-red-512.png` |
| skyhook | Crane/skyhook mech — long narrow hull, tall crane jib extending straight up, hook block at end | `skyhook.png` | `skyhook-512.png` | `skyhook-red.png` | `skyhook-red-512.png` |
| juggernaut | Colossal brute — huge massive round armoured hull, twin short barrels pointing straight up | `juggernaut.png` | `juggernaut-512.png` | `juggernaut-red.png` | `juggernaut-red-512.png` |
| artificer | Artificer/crafter mech — neat rectangular hull, tool arms folded flat, workbench plate on top | `artificer.png` | `artificer-512.png` | `artificer-red.png` | `artificer-red-512.png` |
| scrapper | Scrap brawler — jagged angular bolted-plate hull, spiked knuckle block | `scrapper.png` | `scrapper-512.png` | `scrapper-red.png` | `scrapper-red-512.png` |
| revenant | Resurrected wreck mech — battered patched hull, mismatched plates, dim glowing core | `revenant.png` | `revenant-512.png` | `revenant-red.png` | `revenant-red-512.png` |
| mimic | Deceptive shapeshifter mech — smooth featureless oval hull, shifting panel seams, false sensor eye | `mimic.png` | `mimic-512.png` | `mimic-red.png` | `mimic-red-512.png` |
| corsair | Pirate raider mech — lean hull, skull sensor plate, cutlass side fin, small cannon pointing straight up | `corsair.png` | `corsair-512.png` | `corsair-red.png` | `corsair-red-512.png` |

Count: 16 chassis × 2 teams = 32 distinct sprites (64 files counting
full-size + `-512`), plus `additional-sheet-a.png`.

## Rejected / regenerated classes

NONE. No class was rejected and no regeneration pass was run.

- All four grids, first pass: every cell is strict flat 90° top-down —
  no bipeds, no side/front/3/4 views, no diagonal barrels, no
  cell-border bleed, no text. Spider legs radiate diagonally in plan
  view by design (legs, not barrels) and were not treated as a
  violation. Scrapper's hull is angular/jagged but still a flat
  plan-view shape.
- `raw-flawed-a/` exists but is empty: no flawed raws were moved there,
  because there were no flawed classes to record.

## Honest gaps / notes

- **Red silhouettes diverge from blue silhouettes.** Because the reds
  were generated separately (deliberately, to avoid an identical-swap
  failure), each red shares its class's silhouette language, not an
  exact outline — e.g. red magwalker carries a long vertical mast the
  blue lacks, and red artificer is a different rectangular layout.
  Both teams read unambiguously as their class and team.
- **Relative size is not preserved across classes.** Every sprite is
  centred on its own square canvas and the `-512` copy is always
  512×512, so Juggernaut and Mimic end up the same pixel size in the
  `-512` files; in-game scaling must come from game data, not these
  files.
- **Mimic-red is the subtlest red** (mean R−B +2 on the `-512` copy):
  its red read comes from red rim trim and a red sensor dot rather
  than a large disc. Still distinguishable from blue mimic side by
  side on the sheet, but it is the weakest team signal in this batch.
- **Skyhook and magwalker-red are very tall/narrow** (long vertical
  crane/mast). They keyed cleanly with no edge clipping, but in-game
  they will read taller than other chassis at equal scale.
- **No animation, damage, or wreck frames; no faction skins beyond
  blue/red.** Single stills only, as specified.
- **No real-browser/phone playtest.** QC is visual inspection of the
  four grids and the contact sheet, plus alpha/dimension checks (all
  64 sprite files have non-empty alpha bboxes; all `-512` copies are
  exactly 512×512; full-size files are square transparent canvases).
- **FAILED / MISSING: none.** All 16 chassis × 2 teams delivered.
