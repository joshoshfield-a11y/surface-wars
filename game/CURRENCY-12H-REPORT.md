# WAVE 4 (12H) — Earnable Currency + Premium Store

Status: complete, full suite green. No APK. No commit, push, merge,
or publish. No real money anywhere: no payment provider, no
real-currency price, no checkout button, no credentials, no test
charges, no store submission.

## 1. Currency

- **Name: Salvage Credits.** Distinct from match scrap in code and
  UI: separate record, separate key, separate balance, never
  converted, never added together, never shown as one number.
  Match scrap is spent inside a match and vanishes with it;
  Salvage Credits are earned at match end and spent between
  matches in the Premium Store.
- **Wallet key: `surfacewars.wallet.v1`, schema 1.** A SEPARATE
  record from the hero record (`surfacewars.hero.v1`). The hero
  key and schema are untouched — a wallet reset can never wipe
  hero progress and vice versa. Schema version lives in the
  record, never in `catalog.json` (which is untouched).
- **Earn formula (one auditable function,
  `grantForMatch` in `game/currency.js`):**
  base by result — win 120, draw 60, loss 30 (win > draw > loss,
  all > 0) — PLUS one milestone component from ONE source only:
  hero killing blows (`state.heroXp.kills`) at +10 Credits per
  kill, capped at 10 kills (+100 max). Examples: win + 4 kills =
  160; win + 10 kills = 220; loss + 0 kills = 30.
- **Timing: match end only.** The grant sits in the same
  `showVictory` block as the hero XP write, behind the same
  `matchXpWritten` once-only guard. Quitting mid-match earns
  nothing (quit never reaches `showVictory`). Matches with the
  hero toggled off earn no Credits — the grant shares the XP
  write's `heroMatch` gate. Written at match end and on
  purchase/refund/equip — never every tick, never mid-match.
- **Corruption rule (same pattern as hero progress):** missing
  record = fresh wallet (balance 0, no notice); unreadable or
  failing-validation record (bad JSON, wrong schema, negative or
  non-integer balance, unknown/duplicate pack ids, used-but-not-
  owned, equipped-but-not-owned) = reset to balance 0, owned
  empty, equipped cleared, WITH the plain notice: "Wallet could
  not be read, so it was reset to 0." Never a crash, never a
  blocked menu. The shell shows the notice; the module only
  reports it (`parseWallet`).
- **Edge, stated not hidden:** a wallet reset clears pack
  ownership but does NOT touch the hero record — so a hero
  loadout that still holds a premium row from before the reset
  stays selected in the loadout screen but cannot Save until it
  is replaced (the validator refuses it with the store reason),
  and `newGame` falls back to the default loadout for a match.
  A refunded pack's premium row can never stay equipped: refund
  resets the hero loadout to default when it was the pack's
  loadout or still carries the pack's premium row.

## 2. Premium Store (main menu, no dead buttons)

Button "Premium Store — Salvage Credits" on the main menu, plus a
wallet balance line ("Salvage Credits: N | Equipped pack: …")
and the wallet reset notice line. The panel shows, for every
pack: contents (resolved weapon/gear names), price, trade-off,
owned/equipped/used state, gated items with the level each
needs, and the note: "Real-money purchases: not live. There is
no checkout, no real-currency price, and no payment provider in
this build."

Rules, all enforced in pure code (`currency.js`) and in the UI
(`game.js` store panel):
- Prices in Salvage Credits ONLY. Buying an owned pack is
  impossible (the button becomes Equip — duplicate-purchase
  guard, tested). Insufficient balance blocks with a plain reason
  ("Not enough Salvage Credits: … costs … and you have …").
  Balances never go negative (exact-funds purchase allowed,
  floor 0).
- Refund: a pack NEVER used in a match refunds in full (price
  back, ownership removed, equipped cleared, loadout falls back
  to default if it was equipped). A pack USED in a match cannot
  be refunded (reason stated). "Used" = a match STARTED with
  that pack's loadout equipped (`newGame` marks it, comparing
  against the post-fallback loadout, so a loadout that fell back
  to default never marks a pack used it did not play). Merely
  owning or equipping without playing does not count.
- Equip: sets the hero loadout to the pack's loadout, but
  ownership NEVER bypasses level gates. A gated pack refuses to
  equip and names each gated item and the level it needs (tier 2
  needs level 4, tier 3 needs level 7). The free loadout screen
  enforces the same ownership: unowned premium rows are listed
  but disabled with a "Premium Store" label, never silently
  hidden, never selectable without ownership
  (`validateLoadout`'s `premiumOwnedIds` option; callers that
  omit it — hero-record validation, generic tests — skip the
  ownership check, so no old record fails on ownership alone).

### Packs (all loadouts validate at tier band 3, Lancer chassis)

| Pack | Price | Contents | Trade-off |
|---|---|---|---|
| Ember Line | 350 | Ember Repeater (premium, T2) + Plated Hull I + Servo Legs I | Rapid-fire Autocannon sidegrade: +10% DPS over the Twin-Bore Autogun, but shorter range (5 vs 6 tiles) and overheat. |
| Gilded Reach | 450 | Gilded Lance (premium, T2) + Reactive Weave I + Targeting Array I | Piercing Laser BELOW family baseline damage (12.8 vs 16) at baseline range (8 tiles) — pierce + speed + vision bought with raw damage. Retuned down twice (see §4). |
| Bulwark March | 300 | Breacher-12 (T1) + Rustfang (T1) + Plated Hull I + Servo Legs I | No premium weapon — the cheap all-tier-1 starter bundle, equippable at level 1. Close-range shotgun + melee: strong up close, no ranged secondary, no sensor reach. |
| Storm Cell | 600 | Hailstorm Minigun (T3) + Phase Cutter (T3) + Overclocked Reactor II + Targeting Array II | High-end bundle, whole pack gated to level 7. Overheat primary + melee-range secondary; power bought with a level wait, not Credits alone. |

### Premium-only rows (new in `weapons.js`, 2 rows)

| Row | Family / slot / tier | Resolved | DPS vs family baseline (1.5x cap) | Trade-off |
|---|---|---|---|---|
| Ember Repeater | Autocannon / primary / T2 | 13.2 dmg, range 5, interval 0.5, overheat | 22.44 vs 20.40 baseline (cap 30.60) | +10% DPS, shorter range + overheat |
| Gilded Lance | Laser / primary / T2 | 12.8 dmg, range 8, interval 0.7, pierce | 16.46 vs 20.57 baseline (cap 30.86) — BELOW baseline | Pierce at below-baseline damage |

Both are Lancer primary families (chassis rule unchanged), ≤2
multipliers, closed-list specials. L1 anchor (default loadout =
200 HP / 6.0 speed / 8 vision) and L10 ceilings (+45% HP / +18%
damage effective) unchanged. Nothing removed: no skill, gear,
weapon, unit, map, mode, or mechanic deleted or dumbed down.

## 3. Files

- NEW `game/currency.js` — DOM-free wallet logic + validator +
  pack definitions + grant formula (shared by shell and tests).
- NEW `tests/currency12h.test.js` — 20 tests (see §5).
- NEW `scripts/currency12h-match.js` — Node harness: Part A
  earn → spend → equip → use → refund-blocked, plus Part B sim
  balance matches (see §4).
- NEW `scripts/currency12h-browser.py` — headless-Chromium
  playthrough with real clicks (see §6).
- NEW `game/CURRENCY-12H-REPORT.md` — this file.
- NEW `game/currency12h-store.png` — store panel screenshot from
  the browser playthrough.
- EDITED `game/weapons.js` — 2 premium rows + `PREMIUM_ROW_IDS`
  export + optional `premiumOwnedIds` check in `validateLoadout`
  (Wave 1 multipliers, baselines, and existing rows untouched).
- EDITED `game/game.js` — wallet load/save, match-end grant in
  `showVictory`, store panel + buy/equip/refund, pack-used
  marking in `newGame`, ownership + tier gating in the loadout
  screen and match start. Nothing else.
- EDITED `game/index.html` — main-menu store button + wallet
  status/notice lines, store panel overlay, `currency.js`
  script tag (before `game.js`).
- EDITED `game/style.css` — store pack cards + notice styling
  (same overlay language as the loadout screen).
- NOT touched: `data/catalog.json`, `game/catalog.js`,
  `scripts/gen-catalog.py`, `game/sim.js`, `game/hero.js`,
  `game/maps.js`, `apk/` files, hero record key/schema.

## 4. Balance proof (sim matches, Wave 1 conditions)

Harness: `node scripts/currency12h-match.js` — First Map and
Twin Bridges, seed 20261030, 15000-tick cap, same stand-in as
`weapons12h-match.js` (AI red vs scripted blue attack-move +
mirrored blue economy, hero under RTS orders, no redeploy, so
this measures loadout swing, NOT twin-stick skill). Pack heroes
run at the level that first unlocks the pack (Bulwark 1, Ember /
Gilded 4, Storm 7); default runs at level 1. "Lost" for the sweep
rule follows Wave 1: any map the default does not WIN (loss OR
draw) counts as lost; a pack sweeps if it wins every such map.

Final run (after retunes, exit 0, no sweep):

| Loadout | First Map | Second Map | Hero kills (F / S) | Credits earned (F / S) |
|---|---|---|---|---|
| Default (L1) | loss (2560 ticks) | draw (3403) | 0 / 1 | 30 / 70 |
| Ember Line (L4) | win (1036) | STALLED (15000) | 0 / 0 | 120 / 30 |
| Gilded Reach (L4) | win (1159) | STALLED (15000) | 1 / 0 | 130 / 30 |
| Bulwark March (L1) | STALLED (15000) | STALLED (15000) | 1 / 1 | 40 / 40 |
| Storm Cell (L7) | loss (2556) | STALLED (15000) | 1 / 1 | 40 / 40 |
| Hero off (10v10) | win (1068) | draw (4819) | — | — |

Wins: default 0, Ember 1, Gilded 1, Bulwark 0, Storm 0,
hero-off 1. No pack sweeps. Hero-on vs hero-off: hero-off won
the First Map while default hero-on lost it — the single-seed
harness is chaotic (roster change alone swings outcomes), so
"no sweep" is a statement about this seed and these conditions,
not a general balance proof, and the harness hero (RTS orders,
no redeploy) is not twin-stick play. That caveat applies to
Wave 1's data the same way.

### Freeze-rule retunes (Gilded Reach swept twice — retuned DOWN)

- Run 1: Gilded won both maps the default failed to win
  (first: loss, second: draw) → sweep. Retuned DOWN: Gilded Lance
  damage 0.9 → 0.8 (14.4 → 12.8, DPS 18.51 → 16.46). No opponent
  buff, no price change (price stayed 450).
- Run 2: Gilded STILL swept (hero survived both matches — the
  driver was range, not DPS). Retuned DOWN again: range bonus
  removed (10 → 8 tiles, the family baseline range). What remains
  is a below-baseline-damage Laser with pierce.
- Run 3 (final, above): Gilded wins First, STALLS Second — sweep
  cleared. Price was never raised as a substitute for a balance
  fix, and the opponent was never buffed.

## 5. Tests

Full suite: **289/289 pass** (269 baseline + 20 new).
New file `tests/currency12h.test.js` (20 tests): currency
identity + separate wallet key; grant formula incl. milestone
cap, negative-kill clamp, unknown-result throw; grant purity;
corruption (missing = fresh, no notice; garbled/wrong-schema/
negative/non-integer/unknown-pack/used-not-owned/equipped-not-
owned/duplicate-owned = reset + notice); wallet reset never
touches the hero shape; duplicate-purchase block; insufficient-
funds block + exact-funds floor 0; unknown pack ids fail closed;
refund before use (full price, equipped cleared); refund after
use blocked; refund of unowned blocked; mark-used no-op/idempotent;
equip of unowned blocked; equip sets pack loadout; tier-gate
listing with need levels (band 1/4/7); ownership never bypasses
level gates in `validateLoadout`; premium-row DPS bounds +
exact resolved values; four packs, prices, trade-offs, band-3
validity, ≥2 packs with a premium row; pack heroStats at band
levels + L1 anchor unchanged; end-to-end earn → spend → equip →
used → refund blocked; and earn → spend → equip → refund
before any match restores everything.

Old-test changes (explicit, justified, nothing silent):
- `tests/herophaseb.test.js`: 123 → 125 rows, 82 → 84 primaries.
  Justification: Wave 4 APPENDS exactly the 2 premium rows after
  the document's 123 (never interleaved); the original 123 names
  are still present verbatim and in order. The test name still
  says "123 named weapons" (the audit list) — the count lines
  carry the WAVE 4 comment.
- `tests/weapons12h.test.js` ("nothing removed"): 123 → 125, same
  justification. All other Wave 1 assertions (≤2 multipliers,
  closed specials, 1.5x DPS bounds, baselines, L1 anchor) pass
  unchanged and now also cover the 2 new rows.

## 6. End-to-end proof (browser playthrough)

Script: `scripts/currency12h-browser.py` (Playwright + local
headless Chromium, game served over localhost, REAL CLICKS —
no DOM poking to buy/equip). Screenshot:
`game/currency12h-store.png`. Result: **18/18 checks pass,
exit 0, ~40 s.** What the run proved, in order:

Phase 1 (level-1 hero, seeded 800 Credits — seeding is
localStorage setup, see the limit below):
- Main menu shows "Salvage Credits: 800"; store panel shows
  balance 800, the "Real-money purchases: not live" note, and
  Buy/Equip/Refund/Back buttons only (no checkout button).
- Buy Ember Line (350) → balance 450; the buy button becomes
  Equip (duplicate purchase impossible in the UI).
- Equip Ember Line at level 1 → REFUSED with "Ember Line
  cannot be equipped yet: Ember Repeater needs hero level 4.
  Level gates apply even to owned packs."
- Buy + equip Bulwark March (300) → balance 150, state
  "Owned — equipped."
- Buy Storm Cell (600) at balance 150 → REFUSED with "Not
  enough Salvage Credits: Storm Cell costs 600 and you have
  150." Balance stays 150.
- Refund Ember Line (never used) → balance 500 (150 + 350
  full price back), buy button returns.
- PAGE RELOAD → "Salvage Credits: 500 | Equipped pack:
  Bulwark March" (balance AND equipped pack persist).
- Loadout panel summary → "Level 1 | HP 220 | Speed 6.5 |
  Vision 8 | Weapons: Breacher-12, Rustfang" (the pack's
  loadout is the hero loadout).
- Corruption: wallet overwritten with garbled text, reload →
  "Wallet could not be read, so it was reset to 0.", hero
  status still "Command Mech — Level 1 | 0 XP …", store opens
  with balance 0 (menu usable, hero record intact).

Phase 2 (seeded VALID level-4 hero record — 600 XP, 3 points,
no skills — plus 350 Credits):
- Buy + equip Ember Line via clicks → reload persists
  "Equipped pack: Ember Line".
- Real First Map match → Drop Back In → control strip reads
  "HP: 253 / 253 | Weapon range: 5 tiles" — exactly the Ember
  pack's field stats (level-4 200×1.15×1.10 Plated Hull I = 253;
  Ember Repeater range 5). A level-4 default loadout would read
  230 / range 6. The equipped premium loadout is the one on
  the field.

Exactly what the browser run did NOT prove (never claimed):
- A live match-end credit grant in the browser — that needs a
  full match played to a result in real time. The grant is
  proven by the unit tests (formula, all results, milestone
  cap), by Node harness Part A (earn → spend → equip → use),
  and by the grant sitting in the `showVictory` block beside
  the XP write. Balances in the browser run were seeded through
  localStorage before the store steps, so the browser run
  proves persist / spend / equip / refund / gating / match
  appearance, not the earning itself.
- Phase 2's level-4 hero record was seeded (a valid record —
  level matches XP, points balance) because grinding 600 XP
  in the browser is not a feasible playthrough step. Every
  store action in both phases was a real click; only the
  starting level and starting balances were seeded.

Diagnosis note (kept for the next wave): the first three
browser runs never launched a browser at all — the embedded
`http.server` was started without `-u`, so its banner sat in a
block buffer and `readline()` deadlocked waiting for a port
that no request could arrive to reveal. The script now passes
`-u` (commented as load-bearing). A second real bug found the
same way: Playwright passes `evaluate`/`wait_for_function`
args as ONE JS value, so list args must be destructured
(`([k, v]) => …`), never written as two parameters.

## 7. Gates waived

None silently. Two honest limits (also stated in §6):
- The browser run does not prove a live match-end credit grant
  (that needs a full match played to a result in real time);
  the grant is proven by unit tests, the Node harness Part A,
  and its position in the `showVictory` block beside the XP
  write.
- Balance data is single-seed (20261030) harness data, not a
  general balance proof (see §4 caveat).

## 8. What the coordinator still owns

- Verifying this report + the store panel on a real phone
  (Wave 4, like Waves 1–3, is NOT proven on a real S25).
- Whether the Gilded Reach identity (now pierce-only, no range
  bonus) is acceptable, or whether it wants a third retune
  direction from the parent (any further retune stays a retune
  down or a sidegrade change, never a price hike).
