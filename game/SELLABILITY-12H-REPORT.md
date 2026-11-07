# SELLABILITY-12H — Wave 5 report (v1.7 content: APK gate fixes + Tutorial II + sellability polish)

Status: COMPLETE, all three parts landed. No APK built in this wave (packaging
inputs only; the docs/APK wave builds it). Nothing committed, pushed, merged,
or published — marketing drafts are staged in `surface-wars/marketing/` only.
Full suite: **297/297 pass** (289 baseline + 8 new), 0 fail, 0 old tests changed.

## 1. APK gate fixes — PROOF

### verify_refs.py: 0 missing (was 25 in this session's first run)

First run of this wave reported **25 missing**, not the 24 in the task brief:
the 24 sprite entries (16 expansion unit files + 8 wreck files) plus
`game/currency.js` — Wave 4's Premium Store file, loaded by `index.html`
line 236, missing from `build.sh`'s old 13-file snapshot list.

After the fixes, run from `~/workspace/surface-wars`:

```
$ python3 apk/verify_refs.py
units=57 structures=23
verify_refs: all referenced files present
(exit 0)
```

### What changed in the checker and the staging script

- `apk/verify_refs.py`: the units loop now parses the `sprites.js`
  `EXPANSION_SPRITES` mapping with a regex (id → path pairs) instead of
  a second hardcoded copy. Expansion ids check
  `sprites-90/mechs-expansion/<class>/<id>[-red]-512.png`; all other
  units keep `sprites-90/units/<id>[-red]-512.png`; the wreck check is
  unchanged (`animation/wrecks/<id>_wreck-512.png`). No wiring edit was
  needed in `sprites.js`: `wreckPath(typeId)` is already generic
  (`'../assets/animation/wrecks/' + typeId + '_wreck-512.png'`), so the
  8 new wrecks resolve with no mapping change at all.
- `apk/build.sh` sections 1–2 only (no build steps run):
  - Game snapshot list 13 → 14 files: added `game/currency.js`.
    DISCLOSED EXCEPTION: this is outside a strict "staging lines for
    the new art ONLY" reading of this wave's file ownership, but it is
    required for the stated 0-missing gate, is a one-line staging fix
    in an owned file, and is flagged here so the coordinator can
    keep or revert it. It is NOT presented as silently within scope.
  - Explicit expansion staging: creates
    `apk/assets/assets/sprites-90/mechs-expansion/{bulwark,vespid,longshot,striker}/`
    and copies exactly the 16 referenced `-512` files (blue + red per
    mech). The whole ~63-chassis expansion tree is never globbed or
    copied.
  - The 8 Wave-5 wrecks ride the existing `animation/wrecks/*-512.png`
    glob, because the wrecks dir IS the referenced set (one `-512`
    per unit id); `verify_refs.py` checks each id individually.

### Staging dry-run proof (sections 1–3 of build.sh only — no compile/link/dex/align/sign)

Re-run after ALL Wave-5 edits, so the staged tree matches current sources:

- 16 expansion files present (4 per class folder, blue + red).
- 8 new `*_wreck-512.png` files present.
- `cmp game/game.js apk/assets/game/game.js` and `cmp game/index.html
  apk/assets/game/index.html`: byte-identical — the staged tree is current.
- Section-3 `verify_refs.py`: `all referenced files present`, exit 0.

### Wreck art — 8 files, generated first, keyed, QC'd

Renderer expectation verified BEFORE generating: 512×512 RGBA,
transparent background, wreck filling a large central area
(e.g. lancer wreck bbox 63,37–448,475). Reference images viewed:
`assets/sprites-90/mechs-expansion/bulwark/bastion-512.png` and
`assets/animation/wrecks/bulwark_mech_wreck-512.png`.

Generation: 8 images via media image generation, two batches of 4,
each prompt a destroyed wreck version of that unit's live sprite,
strictly directly above at 90° top-down, pure black background,
shattered/burnt-out hull with a unit-specific broken part (bastion
broken cannon barrel, deadeye bent long railgun barrel, mortarjack
collapsed mortar tube, longsight broken sensor mast, raptor broken
melee claw), same broken-scrap style as the bulwark wreck reference,
team-neutral grey/dark rust/blackened metal only, no blue/red lights,
no faction markings, no text, no ground, no shadow. Raws in
`assets/animation/raw-wave5/` (webp + JSON sidecars). Keyed with the
existing pipeline `assets/animation/tools_key_and_sheet.py` (flood-fill
from borders through near-black max<48, soft alpha falloff, trim,
re-centre on transparent square, full size + 512 LANCZOS `-512` copy).

Final files in `assets/animation/wrecks/` (full size ~1558–1667 px square + `-512`):

| mech | `-512` bytes |
|---|---|
| bastion_wreck | 309,380 |
| gatekeeper_wreck | 226,022 |
| deadeye_wreck | 255,396 |
| mortarjack_wreck | 253,077 |
| needlewing_wreck | 219,133 |
| longsight_wreck | 264,540 |
| javelin_wreck | 270,593 |
| raptor_wreck | 239,282 |

Contact sheet: `assets/animation/wrecks-wave5-sheet.png` (1064×592, 8 items).

QC method (reproducible; also encoded in `tests/sellability12h.test.js`,
which decodes PNG pixels in pure Node via `node:zlib` — no image
dependency): for each shipped `-512` file — 512×512 RGBA, all four
corners transparent, opaque content > 50,000 px, opaque bbox wider
and taller than 300 px, transparent fraction 67.3–75.6%.

Team-neutral numbers, CORRECTED from the first-pass note: the
first-pass claim of "0 blue-dominant pixels" was alpha-blind. The
reproducible numbers are:

- Shipped `-512` files: **0 VISIBLE blue-dominant pixels** (alpha ≥ 128,
  b>120, b>r+40, b>g+40) for all 8. They also carry 7–20
  near-transparent fringe pixels each (alpha ≤ 4, LANCZOS/keying edge
  residue, invisible over any background) that trip an alpha-blind
  threshold — documented here, not counted as contamination.
- Full-size gatekeeper source (not the shipped file): 1 pixel passes
  the crude blue threshold, inside a 5×5 patch of muted blue-grey
  steel (r≈92, g≈105, b≈146) — desaturated steel tone, not faction
  blue. The shipped `-512` downscale averages it out (0 visible).
  The art was NOT patched: a threshold artifact on a steel patch is
  not contamination, and the shipped file is clean.
- Rust-tone pixels (crude red threshold 269–754 per file) are orange/
  rust tones on visual inspection, not faction red; the test asserts
  on visible blue only and documents this, rather than asserting a
  false 0 for red-ish pixels.

Honest caveat (unchanged from first pass): the 8 share a strong
family look (the generator leaned on the bulwark wreck reference —
X-shaped scattered plates), distinguishable mainly by central
barrel/mast details. They are NOT contaminated (no text, no faction
colour, no stray characters), so the first pass was accepted under
the sprite-batch skill's one-regeneration rule rather than burning
regenerations. They are genuine generated art, not coded primitives,
so no placeholder labelling is needed.

## 2. Tutorial II — Twin-Stick & Hero — PROOF

Separate tutorial, own main-menu button (`#mm-tutorial2`, next to
`#mm-tutorial`), never replacing or reordering tier 1 (tier 1's 7
steps in `view.js` untouched, asserted by test). First Map, red side
HELD exactly like tier 1 (`state.tutorial = true` gates the sim AI
economy + combat in `sim.js`). Hero starts in reserve, 9v10 opening,
exactly as in normal hero play.

Design decision future editors must know: tier 2 uses its OWN
`tutorial2` object, NOT the tier-1 `tutorial` flag — because tier 1's
flag hides Take Control and the drop buttons (view.js
`takeControlState`, and the `enterControl` / `pressDropBackIn` /
`syncDropButtons` gates), which are exactly what tier 2 teaches.
With `tutorial` null, Take Control and Drop Back In stay visible,
while `state.tutorial = true` still holds the red side. The two
tutorials never run together: each start function clears the other.

Steps (each with Skip + Next, each auto-advancing on the real action):

1. **Take Control** — tap a blue unit, then Take Control. Advances
   when `controlUnitId` becomes nonzero.
2. **Drive** — left stick / WASD. Advances when the controlled unit
   has moved > 1.5 tiles from the step's start point (start point
   set on the first controlled frame, so a Next-press entry still
   measures real driving).
3. **Aim and fire** — aim at the held red target and hold fire until
   it is destroyed. Target: unarmed `salvage_team` at (28,25), tier 1's
   proven placement — 19 tiles from the blue longshot (range 18),
   14 from the nearest other blue unit (range 7) — so no
   non-controlled blue unit can auto-engage it; only the controlled
   unit's manual fire can kill it, which makes the advance proof
   honest. Advances when the target record is gone/dead.
4. **Release Control** — advances ONLY on the real release
   transition: controlled last frame, not controlled this frame,
   still selected, and holding a hold order (the sim's release
   order). Selection alone, or a hold order issued any other way,
   does not advance it.
5. **Drop Back In** — reserve → 2-second (40-tick) telegraph →
   landing already-controlled. Advances only when the player is
   controlling the field hero, not on the drop press alone.
6. **Premium Store** — screen (like tier 1's step 7): Open Premium
   Store opens the store panel for VIEWING ONLY — no step ever
   requires a purchase; Finish is the Next-equivalent; Play a real
   game starts a normal First Map match. Closing the store after
   viewing returns to the main menu with the tutorial cleared
   (`closeStore` hook: the store panel alone does not set
   `mainMenuOpen`, so without the hook the sim would resume behind
   the menu overlay).

Cleanup mirrors tier 1 exactly: Skip / Back to menu / Play a real
game clear the tier-2 flag and the held-red flag (`openMainMenu` and
`startMap` both clear tier 2); Restart inside tier 2 (pause Restart
or Reset Map) restarts tier 2 from step 1 with a fresh held-red
scenario and a hero back in reserve (`newGame` trailing block).

Dynamic bar hints (tier-2 bar reuses the shared `#tutorial-bar`):
no-selection / unarmed-unit hints on step 1, not-controlling hints
on steps 2–3, weapon-range / too-close hints on step 3 (computed
from the controlled unit's actual weapon ranges vs target distance),
reserve / telegraph / field-but-not-controlled hints on step 5.
Info panel collapses to name + HP on tier-2 map-target steps
(1, 3, 5), mirroring tier 1; drive/release steps need no collapse
because panels are suppressed entirely while controlling.

### Browser proof — `scripts/sellability12h-browser.py` (Playwright, ml-stack venv, localhost server)

Server pattern copied from `scripts/currency12h-browser.py` (`-u` is
load-bearing for the port readline; `wait_for_function` takes a
single object arg). Desktop viewport 1280×800. Result: **PASS**,
all three runs, every check ok:

- **By-doing run (primary proof):** Tutorial II opens at step 1 →
  tap longshot + Take Control → bar "Tutorial II 2 of 6" (by action)
  → hold D ~3 s → bar "Tutorial II 3 of 6" (by driving) → aim sweep
  east from canvas centre, holding fire → bar "Tutorial II 4 of 6"
  (target destroyed by manual fire) → Release Control click → bar
  "Tutorial II 5 of 6" (release transition) → Drop Back In click,
  telegraph, auto-control landing → bar hides, `#tutorial2-end`
  appears (by drop) → Open Premium Store → store panel shows packs
  + "Real-money purchases: not live", balance STILL 0 ("Salvage
  Credits balance: 0", viewing only, no purchase) → Close store →
  main menu, tutorial bar + end overlay hidden → Play First Map →
  normal game, no tutorial bar, Drop Back In visible (flag cleared).
  NO step in this run advanced via Next.
- **Next-fallback run:** fresh Tutorial II, 5 Next presses →
  `#tutorial2-end` appears, Finish → main menu. (Proof Next works;
  never a substitute for the by-doing run.)
- **Skip/Restart run:** Skip mid-tutorial → main menu, tutorial UI
  hidden; fresh Tutorial II, Reset Map → bar back at "Tutorial II
  1 of 6" (restart restarts tier 2); Skip → Play First Map → normal
  game, no tutorial bar.

### Proof incident worth recording (fixed in the proof, not the game)

The first by-doing attempt failed at step 1: the tap at canvas
centre-x / 30% height hit empty ground, and Take Control stayed
disabled. Root cause: `View.clampCamera` pins the camera at ≥ 0, so
on a 980-px-wide canvas the step-0 camera parks at x=0 and the
longshot (9,25) renders at (9−0)×32 px from the canvas left — NOT
at centre-x. The probe run confirmed the tap point hit the canvas
element but selected nothing (world x≈15.3, empty ground). The game
code is correct (the framed point is on screen, just not centred);
the PROOF was fixed to compute the tap from the clamped camera
(`camX = max(0, min(80−viewTilesX, 9−viewTilesX/2))`, same for Y,
zoom 1, map 80×50). Tier 1's framing has the same property; its
proof evidently tapped rendered positions, not ideal ones.

### Known limits / caveats for the docs wave

- **Phone-size aim window (owed, not proven):** while controlling,
  the camera follows the unit and panning is disabled. At phone
  zoom 1 (~12 tiles wide), the target becomes visible only within
  ~6 tiles, while the siege cannon's minRange is 5 — a narrow 5–6
  tile visible-and-shootable window on phones. Desktop proof is
  comfortable; a real-phone pass of the aim step is still owed (same
  standing-limit class as tier 1's drag-pan/pinch notes).
- **Difficulty in tier 2:** `newGame` uses the player's difficulty
  setting in tier 2 (unlike tier 1, which forces normal via
  `tutorialStarting`), but the red side is held by `state.tutorial`
  regardless, so difficulty has no effect in tier 2. Not a bug —
  but do not describe tier 2 as "Normal difficulty".
- **Pack-used marking on Tutorial II start:** `newGame`'s Wave-4
  block marks an equipped pack used when a match STARTS with its
  loadout equipped. Tier 2 is a match start with the hero branch
  running, so starting Tutorial II with a pack equipped marks it
  used (blocking later refund) under the documented "match STARTED"
  rule. Tier 1 does not do this because `tutorialStarting` skips the
  hero branch. Flagged for the docs wave: either document it, or a
  later wave exempts tutorials from the used-marking. No change made
  here (ownership: the marking code is in `newGame`, and changing
  the rule is a behaviour change, not a tutorial wiring change).

## 3. Sellability polish

### In-game How to Play (`game/index.html` `#howto-panel`, expanded)

New sections, existing sections untouched: New units (Iron Eden:
Bastion, Gatekeeper, Deadeye, Mortarjack; Xandria: Needlewing,
Longsight, Javelin, Raptor; one-line roles; built from Command Core
like other units); Twin-stick control and the hero (Take Control,
drive, aim/fire, release to hold with selection kept, hero reserve
9v10, Drop Back In, withdraw on release, death redeploy cost);
Hero mastery (level cap 10; M1–M5 at 5500/6800/8300/10000/11900 XP;
each +1 skill point at match end; no stats); Salvage Credits and
the Premium Store (earn at match end only: win 120 / draw 60 /
loss 30 + 10 per hero kill max 10; hero off earns none; quitting
earns nothing; main-menu store; Credits only; real-money not live;
owned buy impossible; refund full if never used in a match,
impossible after use; equip never bypasses level tier gates);
Tutorial II (second tutorial on main menu, 6 steps, red held, hero
in reserve). Intro line now points to both tutorials. The existing
"Not in this slice" list is kept accurate (it already describes
difficulty correctly in `index.html`; no "no difficulty" claim was
reintroduced). No multiplayer, campaign, fog of war, research, or
real-money purchase claims anywhere.

Ownership reading, disclosed: task part 3(a) explicitly requires
the IN-GAME How to Play (`#howto-panel`) to be expanded, so the
`index.html` ownership note ("tutorial-II button/panel + menu
polish ONLY") is read to include the How to Play panel expansion
that 3(a) demands — otherwise 3(a) would be unimplementable in-game
(`CONTROLS.md` is a doc, not in-game).

### Menu presentation

- Main menu: `#mm-tutorial2` button ("Tutorial II — Twin-Stick &
  Hero") after `#mm-tutorial`, plus a "New in this version" line:
  "New in this version: Tutorial II (twin-stick and hero), 8 new
  mechs, hero mastery ranks, and the Premium Store." Content
  additions only, no hype labels, no fake counts (asserted by test).
- `#tutorial2-end` overlay (reuses the existing `.overlay` styling;
  **no `style.css` change was needed** — recorded explicitly so the
  coordinator does not go looking for one).
- How to Play bottom gains a "Start Tutorial II" button
  (`#howto-tutorial2`, bound in `game.js`).

### CONTROLS.md (new-content sections ONLY)

Added "Tutorial II — Twin-Stick & Hero" section (separate tutorial,
own menu button, First Map held-red, hero in reserve 9v10, 6 steps
with by-doing advance + Skip/Next, store viewing-only, cleanup
identical to tier 1, Restart restarts tier 2, the `tutorial2`-vs-
`tutorial` implementation note, the phone aim-window caveat) and a
"New in this version — 8 mechs, mastery, Salvage Credits store"
section (mechs by faction with costs, wreck art for all 8, mastery
thresholds + points-only rule, Credits earn/store/refund rules +
real-money-not-live, menu line). Existing sections untouched. The
"Still NOT IMPLEMENTED" list was checked and is accurate as-is
(no stale claim found there — difficulty already has its own
section).

### Marketing drafts (STAGED ONLY — nothing posted, submitted, or published)

- `marketing/listing-draft.md` (v1.7): added Tutorial II bullet,
  three-maps bullet, 8-new-mechs bullet, twin-stick bullet, hero
  bullet, mastery, Salvage Credits + store rules bullet, difficulty
  bullet. REMOVED the stale "No difficulty settings" line (difficulty
  now exists). Honest limits kept and extended: real-money not live
  (no checkout, no real-currency price, no payment provider),
  Tutorial II not played on a real phone (desktop-Chromium proof
  only, narrower phone aim window), pinch untested, no performance
  claim for any phone, not benchmarked on a real device. Free
  taster, single next step ("Try the free taster"), and all open
  decisions (price, guarantee/refund terms, offer terms, publish
  permission, independent tester) UNCHANGED — nothing invented.
- `marketing/headline.md`: headline UNCHANGED ("Top-down RTS battles
  where every wreck is worth scrap.") with a recorded Wave-5
  re-check: the 8 new mechs leave wrecks under the same 40%-over-
  120-seconds rule (49 → 57 unit types, no rule change), nothing in
  v1.7 competes for the top line, no new claim smuggled in. The
  "does NOT promise" section now says three maps (was two) and
  explicitly says no real-money purchases.
- `marketing/audience-openings.md`: opening (b) mobile gamers
  UPDATED ("two tutorials that teach you by playing — core moves,
  then twin-stick control and the hero") with the reason recorded in
  the file — the old "a 7-step tutorial" line is now incomplete.
  Openings (a) RTS players and (c) large-scale players LEFT ALONE,
  with reasons recorded in the file (their hooks — economy/map
  control, scale/terrain — are still true and untouched by v1.7).
  Shared facts updated (both tutorials, 8 mechs, store on Credits
  only, real-money not live).
- `marketing/sharp-advantage.md`: sentence UNCHANGED, with a Wave-5
  note recorded: same mechanism, coverage 49 → 57, no new advantage
  claimed on top of it.
- No religious language in any file (pre-existing faction name
  "Iron Eden" excepted; asserted by test for all four drafts).

## 4. Tests

- New: `tests/sellability12h.test.js` (8 tests, all pass):
  wreck files exist via the actual `sprites.js` `wreckPath` (not a
  second pattern), 512×512 RGBA, corners transparent, substantial
  opaque content, large central bbox, 0 visible blue-dominant
  pixels; expansion staging explicit per-file with no whole-tree
  glob; `verify_refs.py` resolves the expansion mapping + game
  snapshot; Tutorial II structure (6 step ids in order, all 8
  functions, own `tutorial2` variable, cleanup hooks, menu + overlay
  ids, viewing-only store step, no buy reference); tier 1 untouched
  (7 steps in order, buttons + overlay remain); How to Play + menu
  line coverage + honesty guards; CONTROLS.md sections; marketing
  honesty + staged-only guards.
- Full suite: `node --test tests/*.test.js` → **tests 297, pass 297,
  fail 0** (289 baseline + 8 new).
- **Old-test changes: NONE.** No existing test file was edited.
- Browser proof: `scripts/sellability12h-browser.py` → PASS (see §2).
  The probe script used during debugging (`/tmp/tut2-probe.py`) is
  ephemeral scratch, not a deliverable.

## 5. Files changed (owned paths only)

Modified: `game/game.js` (tutorial tier-2 wiring + menu presentation
sections only), `game/index.html` (tutorial-II button/panel, menu
line, How to Play expansion), `game/CONTROLS.md` (new-content
sections only), `apk/build.sh` (staging lines + the disclosed
`currency.js` exception), `apk/verify_refs.py` (checker updates),
`marketing/listing-draft.md`, `marketing/headline.md`,
`marketing/audience-openings.md`, `marketing/sharp-advantage.md`
(staged drafts only).
New: 16 wreck files (8 full + 8 `-512`) in
`assets/animation/wrecks/`, 8 raws + sidecars in
`assets/animation/raw-wave5/`, `assets/animation/wrecks-wave5-sheet.png`,
`tests/sellability12h.test.js`, `scripts/sellability12h-browser.py`,
this report.
NOT changed (explicitly): `game/style.css` (no change needed),
`game/view.js`, `game/weapons.js`, `game/progression.js`,
`game/currency.js`, `game/sim.js`, `game/hero.js`,
`data/catalog.json`, `game/catalog.js`, `scripts/gen-catalog.py`,
`game/maps.js`. The project dir is not a git checkout (`git status`
reports "not a git repository"), so "uncommitted" is by
construction: no commit, push, merge, or publish command was run.

## 6. Gates waived: NONE

No gate was waived, silently or otherwise. Every task proof ran and
passed: verify 0 missing, staging 16 + 8, by-doing browser proof for
all 6 tutorial steps, full suite green. The only items carried
forward are the documented caveats above (phone aim window,
pack-used marking on Tutorial II start, difficulty wording), none
of which is a waived gate — they are disclosed limits and a
docs-wave decision.

## 7. Blockers / notes for the docs/APK wave

1. **No hard blocker.** The docs/APK wave can build: verify is 0,
   staging is complete and current, Tutorial II is proven in
   headless Chromium, tests are green.
2. Decide keep/revert on the `build.sh` `currency.js` exception (§1)
   — keeping it is recommended (it is a real gap: `index.html`
   loads the file, the old list did not stage it).
3. `apk/build.sh` sections 4–5 still stamp version 1.6 / version-code
   7 — the version bump to 1.7 belongs to the docs/APK wave (not
   touched here, by ownership).
4. Document or exempt the Tutorial II pack-used marking (§2 caveat)
   before the docs wave writes the store rules into user-facing docs.
5. Do NOT present the staging dry-run as a built APK, and do NOT
   present the desktop-Chromium tutorial proof as a real-phone
   pass — both limits are stated in this report and in the drafts.
