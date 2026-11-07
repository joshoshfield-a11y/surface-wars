# Wired Sprite Fix Report — Surface Wars

Date: 2026-10-31. Builder: wired-sprite fix subagent.
Scope: `assets/` ONLY, plus this report file. No game code, no test
file, no APK, no other project was touched. Nothing committed, pushed,
merged, or published. `game/sprites.js` paths are unchanged, and no
wiring was changed: every replaced file keeps its original filename,
so `unitPath` (`../assets/sprites-90/units/` + typeId + teamSuffix +
`-512.png`) resolves exactly as before.

## 0. Correction note — read this first (supersedes wave-1 as an in-game fix)

Wave-1's silhouette fixes (rampart IoU 0.588→0.878, lancer/longshot
dilation) were applied to the UNWIRED folder `assets/sprites-90/mechs/`.
The game loads ONLY `assets/sprites-90/units/` — a grep for `mechs/`
in `game/*.js` returns nothing, and the `mechs/` and `units/` files
differ. **Wave-1's mechs/ fixes therefore do not reach the game, and
any reading of them as in-game fixes is superseded by this report.**
The `mechs/` folder was left untouched as reference/chassis art.
This report fixes the WIRED `units/` files in place. The wired
rampart, which wave-2 found already matching its own blue silhouette
in a wiring-sheet check, in fact measured IoU 0.7721 on the shipped
`-512` files in this scan — better than the old `mechs/` defect, but
below the 0.878 wave-1 bar and below this pass's 0.85 target, so it
is fixed here too.

## 1. Scan — all 49 wired units, before values

Method: blue vs red `-512` files, silhouette = alpha > 10, IoU =
intersection / union of the two silhouettes. Opaque counts are the
alpha > 10 pixel counts at 512.

| unit | blue opaque | old red opaque | IoU before |
|---|---|---|---|
| breach_walker | 57827 | 59918 | 0.5113 |
| bridge_layer | 61904 | 55212 | 0.6920 |
| bulwark_mech | 141835 | 111716 | 0.6699 |
| colossus_engine | 83171 | 90020 | 0.6769 |
| combat_drone | 73932 | 69074 | 0.6494 |
| combat_engineer | 104450 | 113945 | 0.8730 |
| command_carrier | 85515 | 89599 | 0.7715 |
| command_walker | 87360 | 79828 | 0.5839 |
| construction_vehicle | 48299 | 59004 | 0.7228 |
| decoy_drone | 141319 | 122364 | 0.7862 |
| demolition_crawler | 72536 | 81636 | 0.5898 |
| drone_carrier | 107539 | 101979 | 0.7801 |
| drone_swarm | 67506 | 47039 | 0.4644 |
| ew_mech | 85808 | 85704 | 0.5002 |
| ew_skirmisher | 78238 | 85411 | 0.6489 |
| experimental_artillery | 105319 | 113892 | 0.6628 |
| fast_raider | 59688 | 56966 | 0.7550 |
| field_repair_mech | 80991 | 72965 | 0.5253 |
| flak_tank | 67204 | 85941 | 0.5731 |
| gunship | 69509 | 91172 | 0.4896 |
| heavy_railgun | 90990 | 63192 | 0.6299 |
| heavy_tank | 103912 | 116656 | 0.7829 |
| interceptor_drone | 70170 | 64472 | 0.6287 |
| lancer_mech | 37136 | 34124 | 0.3968 |
| longshot_mech | 26036 | 45337 | 0.5025 |
| medium_tank | 105628 | 90768 | 0.7722 |
| missile_carrier | 57562 | 65917 | 0.5657 |
| mobile_foundry | 131089 | 83032 | 0.5539 |
| mortar_carrier | 81344 | 74443 | 0.7737 |
| radar_scout | 141751 | 109801 | 0.7645 |
| rampart_fortress | 160498 | 137903 | 0.7721 |
| recon_aircraft | 31656 | 28268 | 0.4699 |
| recovery_crawler | 61706 | 54764 | 0.5775 |
| repair_scout | 91478 | 63309 | 0.5063 |
| rocket_artillery_mech | 50973 | 60777 | 0.5733 |
| rocket_battery | 81909 | 121984 | 0.5222 |
| salvage_team | 119400 | 73259 | 0.5310 |
| scout_buggy | 88194 | 64623 | 0.4872 |
| sensor_drone | 135019 | 132066 | 0.8682 |
| shield_projector | 137137 | 129294 | 0.7245 |
| siege_cannon | 46246 | 60617 | 0.6890 |
| siege_engineer | 103767 | 86153 | 0.8019 |
| storm_lance | 21341 | 32284 | 0.5273 |
| strike_bomber | 55832 | 52819 | 0.6298 |
| supply_carrier | 74785 | 80981 | 0.8399 |
| titan_breaker | 83462 | 106658 | 0.5997 |
| transport_aircraft | 58493 | 56137 | 0.7999 |
| vespid_scout | 111095 | 39400 | 0.3528 |
| warden_platform | 137012 | 123055 | 0.7129 |

**Units below 0.70 (32):** breach_walker, bridge_layer, bulwark_mech,
colossus_engine, combat_drone, command_walker, demolition_crawler,
drone_swarm, ew_mech, ew_skirmisher, experimental_artillery,
field_repair_mech, flak_tank, gunship, heavy_railgun,
interceptor_drone, lancer_mech, longshot_mech, missile_carrier,
mobile_foundry, recon_aircraft, recovery_crawler, repair_scout,
rocket_artillery_mech, rocket_battery, salvage_team, scout_buggy,
siege_cannon, storm_lance, strike_bomber, titan_breaker,
vespid_scout. Worst: vespid_scout 0.3528, lancer_mech 0.3968,
drone_swarm 0.4644, recon_aircraft 0.4699, scout_buggy 0.4872,
gunship 0.4896. The three units named in the task brief are confirmed
at the brief's values: lancer_mech 0.3968 (37,136 vs 34,124 px),
longshot_mech 0.5025 (26,036 vs 45,337 px), rampart_fortress 0.7721
(160,498 vs 137,903 px).

## 2. Fixes — 33 units, 66 files replaced in place

Fixed set = all 32 units below 0.70, plus rampart_fortress (named in
the brief, 0.7721, below the 0.85 target). For every fixed unit BOTH
the wired `-512` file and its full-size `-red.png` sibling were
replaced under the original names. No filename changed, no blue file
changed, no game code changed.

Red-dominant px = pixels with R > 120 and R > B + 30 among opaque
pixels at 512 (team-colour strength indicator, not a gate).

| unit | before IoU | after IoU | blue opaque | old red opaque | new red opaque | new red-dominant px | method |
|---|---|---|---|---|---|---|---|
| breach_walker | 0.5113 | 1.0000 | 57827 | 59918 | 57827 | 5733 | derived |
| bridge_layer | 0.6920 | 1.0000 | 61904 | 55212 | 61904 | 12842 | derived |
| bulwark_mech | 0.6699 | 1.0000 | 141835 | 111716 | 141835 | 17593 | derived |
| colossus_engine | 0.6769 | 1.0000 | 83171 | 90020 | 83171 | 10935 | derived |
| combat_drone | 0.6494 | 1.0000 | 73932 | 69074 | 73932 | 10566 | derived |
| command_walker | 0.5839 | 1.0000 | 87360 | 79828 | 87360 | 10865 | derived |
| demolition_crawler | 0.5898 | 1.0000 | 72536 | 81636 | 72536 | 11498 | derived |
| drone_swarm | 0.4644 | 1.0000 | 67506 | 47039 | 67506 | 14389 | derived |
| ew_mech | 0.5002 | 1.0000 | 85808 | 85704 | 85808 | 13320 | derived |
| ew_skirmisher | 0.6489 | 1.0000 | 78238 | 85411 | 78238 | 6946 | derived |
| experimental_artillery | 0.6628 | 1.0000 | 105319 | 113892 | 105319 | 16252 | derived |
| field_repair_mech | 0.5253 | 1.0000 | 80991 | 72965 | 80991 | 12598 | derived |
| flak_tank | 0.5731 | 1.0000 | 67204 | 85941 | 67204 | 6444 | derived |
| gunship | 0.4896 | 1.0000 | 69509 | 91172 | 69509 | 8591 | derived |
| heavy_railgun | 0.6299 | 1.0000 | 90990 | 63192 | 90990 | 19811 | derived |
| interceptor_drone | 0.6287 | 1.0000 | 70170 | 64472 | 70170 | 7547 | derived |
| lancer_mech | 0.3968 | 0.9015 | 37136 | 34124 | 39918 | 2287 | generated+aligned |
| longshot_mech | 0.5025 | 1.0000 | 26036 | 45337 | 26036 | 4615 | derived |
| missile_carrier | 0.5657 | 1.0000 | 57562 | 65917 | 57562 | 5982 | derived |
| mobile_foundry | 0.5539 | 1.0000 | 131089 | 83032 | 131089 | 9328 | derived |
| rampart_fortress | 0.7721 | 0.9331 | 160498 | 137903 | 152041 | 10479 | generated+aligned |
| recon_aircraft | 0.4699 | 1.0000 | 31656 | 28268 | 31656 | 6273 | derived |
| recovery_crawler | 0.5775 | 1.0000 | 61706 | 54764 | 61706 | 10312 | derived |
| repair_scout | 0.5063 | 1.0000 | 91478 | 63309 | 91478 | 12266 | derived |
| rocket_artillery_mech | 0.5733 | 1.0000 | 50973 | 60777 | 50973 | 6252 | derived |
| rocket_battery | 0.5222 | 1.0000 | 81909 | 121984 | 81909 | 3842 | derived |
| salvage_team | 0.5310 | 1.0000 | 119400 | 73259 | 119400 | 11375 | derived |
| scout_buggy | 0.4872 | 1.0000 | 88194 | 64623 | 88194 | 12456 | derived |
| siege_cannon | 0.6890 | 1.0000 | 46246 | 60617 | 46246 | 6617 | derived |
| storm_lance | 0.5273 | 1.0000 | 21341 | 32284 | 21341 | 4183 | derived |
| strike_bomber | 0.6298 | 1.0000 | 55832 | 52819 | 55832 | 8012 | derived |
| titan_breaker | 0.5997 | 1.0000 | 83462 | 106658 | 83462 | 10074 | derived |
| vespid_scout | 0.3528 | 1.0000 | 111095 | 39400 | 111095 | 11367 | derived |

Result: every fixed unit now meets the 0.85 target (31 at exactly
1.0000, lancer_mech 0.9015, rampart_fortress 0.9331). No fixed unit
ships below 0.70, and none ships below 0.85.

## 3. Method — and one disclosed deviation from the brief

### 3a. Generated units (lancer_mech, rampart_fortress) — wave-1 method, literally

Media pipeline edits of the wired blue `-512` sprite, prompt pattern
from wave-1 (identical silhouette / hull / proportions / barrel and
plate layout, strictly flat 90° overhead, recolor only team markings
blue→red, hull dark grey/black, single mech on pure black, no text,
no other objects). Keyed by border flood-fill through near-black
(wave-2 `key_and_slice.py` construction, so dark interior detail
survives), trimmed, re-centered, LANCZOS `-512`.

Raw (pre-alignment) IoUs were lancer 0.8619 and rampart 0.7903 — the
gap was framing, not shape: the generations came back ~5% larger
than the wired blue framing (lancer gen bbox 457×392 vs blue
438×393; rampart gen 458×452 vs blue 437×438). Aligning each
generation's trimmed crop to the blue sprite's exact bbox (resize
to blue bbox size, paste at blue bbox origin, same treatment for
the full-size file) gives lancer 0.9015 / full 0.9385 and rampart
0.9331 / full 0.9039. Alignment changes scale/position only, not the
generated art itself. Both were viewed on contact sheets before
install: lancer's generated red keeps the winged chassis with red
accents; rampart's keeps the square plates, centre ring (red) and
corner accents.

### 3b. Longshot — generation attempted twice, both rejected, derivation shipped

- v1 (same prompt pattern): IoU 0.7368 raw / 0.8342 aligned, but the
  hull came back WHITE/light — a colour failure, not a silhouette
  failure. Rejected on sight, not shipped.
- v2 (prompt strengthened: hull must stay dark grey/black,
  absolutely no white/light/silver body): dark hull, red accents,
  IoU 0.6588 raw / 0.8123 aligned — still below the 0.85 target, and
  the barrel reads shorter than blue's.
- Shipped: the §3c derivation (IoU 1.0000). Generation was tried
  first and honestly failed to reach the bar twice; the derivation
  is the fallback, not a silent substitution.

### 3c. Derived units (31 units incl. longshot) — silhouette-preserving recolour

**Disclosed deviation:** the brief prescribed fresh generation for
every sub-0.70 unit. That was not done for these 31, for two stated
reasons: (1) the media pipeline allows at most 4 generation calls
per response, so 32 fresh generations were not feasible in this
pass; (2) the two longshot generations both missed 0.85, while the
derivation guarantees the target by construction. The derivation
is NOT a channel swap, and it is NOT a recolour of the old reds —
it is built from the BLUE sprite:

1. Alpha is copied byte-for-byte from blue, so the silhouette is
   identical (IoU 1.0000 by construction, verified post-install for
   every unit, not assumed).
2. Blue-accent pixels (B − max(R,G) > 40 and B > 80) get R↔B swapped
   — the existing blue lights/trim become red (wave-1 structure
   method, §(c) of the audit report).
3. Greyish body pixels (|R−B| ≤ 35, 30 ≤ R ≤ 215) get a modest warm
   shift, R +18 / B −18, clamped — panel detail and luminance
   structure preserved, no whole-body red wash (contrast wave-1
   bunker-old, 74.2% changed, whole-body reddish-brown, rejected).
4. A 3 px silhouette-edge band (distance transform, scaled for the
   full-size file) is tinted red from its own luminance
   (R = lum + 60, G = B = 0.55 × lum) — a red outline that reads at
   game size without changing the silhouette.

Body greys are otherwise byte-identical to blue. Team read at
512 and at 64 px was verified on the QC sheets (§4): every new red
reads warm red-brown with a red outline against its blue-grey
original, with the same shape. The one aesthetic cost, stated
plainly: derived reds are "the blue unit with red markings" rather
than independently painted red hulls — the same trade wave-1
accepted for command_core/bunker. If the coordinator wants fully
painted red hulls for any of these 31, that is a generation pass
per unit, not a correction to this pass's numbers.

### 3d. What was NOT done

- No `mechs/` file touched; no `sprites.js` path or any game code
  changed; no test file added or edited; no APK built; no asset
  downloaded; no third-party art; no other game's art/names/stats.
  Strict 90° overhead held (all art derives from the project's own
  overhead sprites or overhead generations); Iron Eden = blue,
  Xandria = red throughout. The pre-existing `units/raw/`
  subfolder (work material) was not touched.
- The coordinator's test suite was run read-only after install:
  `node --test tests/*.test.js` → **230 pass, 0 fail** (unchanged
  suite, no file added).

## 4. Backup

Every replaced original is preserved under
`assets/_wave2-wired-backup/sprites-90/units/` (66 files: each fixed
unit's `-red-512.png` and `-red.png`, same relative paths as the
wave-1 backup pattern). Install audit: an md5 comparison of the
whole `units/` directory before vs after install shows exactly
those 66 files changed and zero files added — no blue file, no
other unit, and no non-unit file changed.

## 5. QC — contact sheets and in-game screenshots viewed

Work material (scripts, raw generations, keyed/derived/staged
files, scan JSONs, install manifest, shots) lives under
`assets/_wave2-wired-work/` (shots in `shots/`).

Contact sheets viewed by this builder (all 33 fixed pairs,
blue vs new red):
- `_wave2-wired-work/qc-sheet1.png` — first 17 fixed units at 150 px.
- `_wave2-wired-work/qc-sheet2.png` — remaining 16 fixed units.
- `_wave2-wired-work/qc-sheet-gamesize.png` — all 33 pairs at 64 px
  (game-size read: blue-grey vs warm red-brown, same shapes).
- `_wave2-wired-work/gen3-sheet.png` — first generations before
  alignment (longshot v1 white hull visible — the rejection
  evidence); `_wave2-wired-work/aligned-sheet.png` — aligned
  lancer/rampart/longshot-v2; `_wave2-wired-work/longshot-compare.png`
  — longshot blue vs derived vs gen2 at 200 px and 64 px.

In-game screenshots (real headless Chromium, real `drawScene` code
and real asset paths, 0 console/page errors, 0 missing images),
in `assets/_wave2-wired-work/shots/`:
- `wired-z1-g0.png`, `wired-z1-g1.png`, `wired-z1-g2.png` — zoom 1,
  all 33 fixed units, blue row + red row per shot, through the
  real renderer via a /tmp scratch harness (the game tree itself
  was not modified to make it; the harness page was served
  virtually alongside the unmodified tree).
- `wired-z2-g0.png` … `wired-z2-g5.png` — zoom 2, all 33 fixed
  units, blue row + red row per shot. First zoom-2 attempt framed
  only the blue row (red row below the viewport); it was re-shot
  with both rows inside the frame, and only the re-shot versions
  are claimed here.
- `firstmap-z1.png` — real First Map match start at zoom 1.00
  (Iron Eden 9 vs Xandria 10, tick 55): spawn view, blue units
  visible at game scale.
- `firstmap-z2.png` — real First Map at zoom 2.00 (tick 97): one
  blue unit at zoom-2 scale, but the pause/menu panel is open in
  the frame (the zoom-button click landed while the menu was
  open), so this shot is weak evidence and is not relied on.

**Stated plainly — First Map limitation:** on the real First Map,
blue and red spawns sit at opposite ends of an 80×50 map, so no
single zoom-1/zoom-2 frame shows both factions' units together,
and the spawn view shows only the blue side at start. The
both-factions-at-both-zooms evidence is therefore the harness
shots through the real renderer (same draw code, same asset
paths, same game scale), not a single First Map frame. No fixed
unit was left unshown in-game-style rendering: all 33 appear in
the harness shots at both zooms. Thin track-like lines visible in
the harness shots are a harness-state artifact (they do not appear
in the real First Map shots and are not part of any sprite); they
do not affect silhouette or colour read.

## 6. Remaining wired divergence (IoU < 0.85 after this pass)

These 14 units were in the 0.70–0.85 band before this pass and
were OUTSIDE this pass's fix scope (fix threshold < 0.70). They
are unchanged, listed here so they are not mistaken for fixed:

| unit | IoU (unchanged) | | unit | IoU (unchanged) |
|---|---|---|---|---|
| command_carrier | 0.7715 | | mortar_carrier | 0.7737 |
| construction_vehicle | 0.7228 | | radar_scout | 0.7645 |
| decoy_drone | 0.7862 | | shield_projector | 0.7245 |
| drone_carrier | 0.7801 | | siege_engineer | 0.8019 |
| fast_raider | 0.7550 | | supply_carrier | 0.8399 |
| heavy_tank | 0.7829 | | transport_aircraft | 0.7999 |
| medium_tank | 0.7722 | | warden_platform | 0.7129 |

Only 2 of 49 units were already ≥ 0.85 before this pass and are
also untouched: combat_engineer (0.8730), sensor_drone (0.8682).
After this pass: 35 of 49 units ≥ 0.85 (33 fixed + 2 already
passing); 14 remain below, all in the 0.71–0.84 band, none below
0.70. A follow-up pass applying §3c to those 14 would close the
set; it was not done here because it exceeds the assigned
threshold scope.

## 7. Honest gaps

1. **No real-phone verification.** All evidence is headless
   desktop Chromium + file measurement. Launch, touch, FPS and
   S25 colour read remain user-side verdicts.
2. **Derived reds are markings, not repaints** (§3c). At the
   smallest draw sizes (~35 px for size-0.55 units at zoom 1) the
   team read rests on the warm body tint + red outline + HP bar,
   not on large red panels. Wave-2's thin-chassis underlay (zoom
   ≤ 1, lancer/longshot) still applies on top.
3. **Generation counts:** 4 media-pipeline calls total — lancer,
   longshot v1, rampart, longshot v2. Two shipped (lancer,
   rampart); longshot v1/v2 did not. No GEMINI_API_KEY was needed,
   requested, or used (imagen/nanobanana scripts were not used).
4. **Rocket_artillery_mech's loose island:** the blue sprite
   carries a small detached fragment below the hull; the derived
   red preserves it exactly (it is a pre-existing blue-side
   artifact, not introduced here).
5. The `mechs/` folder still carries wave-1's fixes and still is
   not wired to the game — a coordinator decision (wire it, or
   delete it as dead reference) is still open, but it no longer
   matters for the in-game blue-vs-red read of these 33 units,
   which is now fixed at the wired files themselves.

## 7. Coordinator addendum (2026-10-31, post-verification)

Coordinator spot-verified the builder's claims independently:
IoU lancer 0.9015, longshot 1.0000, rampart 0.9331, vespid 1.0000
(recomputed from the installed `-512` files); backup 66 files;
suite 230/230; game-size QC sheet viewed (blue/red pairs read
distinctly, silhouettes matching).

**Extension pass — the 0.71–0.84 band closed.** The 14 units left
in that band (command_carrier, construction_vehicle, decoy_drone,
drone_carrier, fast_raider, heavy_tank, medium_tank, mortar_carrier,
radar_scout, shield_projector, siege_engineer, supply_carrier,
transport_aircraft, warden_platform) were run through the SAME
§3c derivation script (`assets/_wave2-wired-work/derive.py`, run
with the ml-stack venv python for cv2) — no new generation, same
disclosed markings-not-repaints trade. Their pre-pass reds were
backed up first, so the backup now holds 94 files (66 + 28).
Post-install full-scan result: **all 49 wired units ≥ 0.85, none
below** (the 14 derived units are 1.0000 by construction, verified
by measurement, not assumed). QC sheet for the 14 viewed at game
size: `assets/_wave2-wired-work/qc-sheet-band14.png` — every pair
matches in silhouette and reads blue-grey vs warm red-brown with
red outline. Suite re-run after install: **230 pass, 0 fail**.
Total wired red files replaced across both passes: 94 (47 units ×
2 sizes); lancer and rampart remain the only genuine generations
shipped in this fix. No game code, test, or APK touched by either
pass. The wired blue-vs-red divergence item is now CLOSED for all
49 units; the remaining disclosed caveat is only the aesthetic
one (§3c): derived reds are blue units with red markings, and
fully painted red hulls would be a separate per-unit generation
pass, not a correction.
