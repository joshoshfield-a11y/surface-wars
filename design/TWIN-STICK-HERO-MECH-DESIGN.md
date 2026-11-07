# Twin-Stick Control + Hero Mech — Design Spec (Surface Wars)

**Status:** DESIGN SPEC ONLY. No game code has been changed to implement this
document, and no game file is to be edited on the authority of this document
alone. Implementation happens in the phased plan in §6, one phase at a time,
each frozen before the next starts. This document was drafted while a
separate builder worked on game code for Generation Cycle 3 (endgame
deadlock handling); that cycle has since frozen (2026-10-31 ~05:01 PDT,
tests 116/116, `game/GEN-CYCLE-3-REPORT.md`), and §4.4's draw-XP rule was
re-checked against its frozen rule before this spec was delivered:
deadlock grace 600 ticks (30 sim seconds), `state.winner = 'draw'`,
elimination takes precedence, a core-alive air-only position never draws,
tutorial games excluded. Nothing here edits or overrides that cycle.

**AMENDMENT 2026-10-31 — hero presence model (reserve by default).**
At the user's word, the hero's presence model changed from "field unit
from match start" to "off-map reserve, on the field only while the
player actively controls it in twin-stick mode, redeployed with a
Drop Back In button." This amendment replaces every part of the
original spec it contradicts; where the two disagree, this amendment
wins. Sections changed, and what each supersedes:

- **§3.2 (rewritten in full):** the hero no longer "spawns in place of
  one starting unit" on the field. It replaces the west roster's
  `lancer_mech` entry but **starts the match in reserve**, off-map;
  the opening field count is **9v10**, not 10v10 on the field. The
  original lancer spawn coordinates are NOT the drop location —
  Drop Back In uses the core-adjacent production spawn logic (§3.2).
- **§3.1:** the hero is a sim unit **only while on the field**; in
  reserve it is not a sim entity at all, never fights autonomously,
  and never takes RTS orders. The original sentence "it is a unit in
  the sim" is qualified, not deleted.
- **§1.1, §1.2, §1.3, §1.5:** twin-stick entry/exit, control-strip
  layout, and pause/menu behaviour now cover the hero's reserve
  transitions: Drop Back In enters hero control; Release Control,
  Esc, entering RTS command mode, or taking control of another unit
  withdraws the hero to reserve; controlling another unit while the
  hero is on the field withdraws the hero at the same moment control
  transfers (the player never has both a controlled unit and a field
  hero). The original "hero is controlled alone or not at all"
  rule (§4.1) now means this withdrawal, not a disabled button.
- **§4.2 (respawn unified):** death still creates the normal wreck
  and the existing respawn terms (30 s + 200 scrap, waits if broke)
  still apply — but they are now reached through the **same**
  Drop Back In button, in its paid-after-timer state, instead of
  through a separate automatic respawn. There is one redeploy
  button with two states (free-after-cooldown for voluntary
  withdrawal, paid-after-timer for death), not two mechanisms.
- **§4.1, §4.4:** elimination and Cycle 3 deadlock detection count
  **field entities only**; a healthy hero in reserve neither prevents
  defeat nor causes or prevents a draw, and the red AI cannot target
  or count it. The original §4.4 statement that "a hero alive while
  its core lives does not prevent a draw" is unchanged in effect
  and now follows from the reserve model (a reserve hero is not a
  field entity).
- **§3.6:** withdrawal HP persistence is **within-match only** — the
  hero keeps its exact HP on withdrawal, but the progression record
  has no HP field, so the next match starts at full HP from
  level/gear, as before.
- **§6 Phase B (spec sentence, in-scope list, freeze gate):** the
  phase now builds the reserve model and Drop Back In, and its
  hero-on vs hero-off comparison is run with the hero in reserve
  at start and dropped in on demand, not spawned on the field.
- **§7:** four new open decisions added (§7.8–§7.11): voluntary
  redeploy cooldown, drop telegraph duration, voluntary redeploy
  scrap cost, drop-marker visibility to the red side. All values
  proposed in §3.2 are PROPOSED, not decisions.
- **§0, §3.3, §5, Appendix:** conforming wording only (opening
  field count, level-1 anchor context, "no autonomous hero" in the
  exclusions, a traceability row marking the reserve model as a
  user rule with no prior game source).

Unchanged by this amendment: loadout between matches only (§2.6),
the seven slots (§3.4), gear tier bands (§3.5), the 8 skills
(§3.5), XP sources and curve (§3.5), stat caps (§4.1),
device-local persistence (§3.6), and the red AI never reading hero
state (§4.4).

**Language note:** this spec is written in plain product language. It
contains no religious framing of any kind.

**What this feature is, in one paragraph:** alongside the existing
large-troop RTS controls (select, move, attack-move, hold, patrol, guard,
rally, formations, groups, queued orders — all unchanged), the player may
take direct manual control of one selected unit in a twin-stick shooter
mode, drive and aim it by hand, and release it back to RTS orders at any
time. Separately, the player gets a default starting mech — placeholder
name **"Command Mech"** (final name is an open decision, §7) — with its
own loadout, gear, skills, and level, which persist across matches on the
same device. By default the Command Mech is **held in reserve off-map**
and is on the field only while the player actively controls it in
twin-stick mode; it is redeployed with a **Drop Back In** button (§3.2). The weapon system for both is a single reusable template
(§2), so the named weapons from the original design document become data
rows over family templates instead of 123 hand-tuned stat blocks.

**How to read the numbers in this document:** numbers marked
**PROPOSED** are starting values for balance testing, not tuned finals.
Numbers marked **VERIFIED** were read from the current game files or the
design document on the day this spec was written; §8 traces every one of
them to its source. Where this spec proposes a number and the user has
not decided it, the decision is listed in §7 and the proposal is not
presented as settled.

---

## 0. What already exists (the ground this spec builds on)

These facts were checked against the game files, not assumed. Anything
the build contradicts must be resolved in favour of the game files, and
this spec amended.

- **Player faction:** Iron Eden (blue). Opponent: Xandria (red), driven
  by the sim-side AI from Generation Cycle 2 (defend / gather / attack /
  fall-back squads, same scrap economy as the player, no free units or
  scrap) plus the Prototype 03 economy (production + salvage).
  (VERIFIED: `game/game.js` header, `game/sim.js` `runAiCombat` /
  `runAiEconomy`.)
- **Economy (VERIFIED: `game/sim.js`):** both factions start at **500
  scrap**. Production costs and build times come from the catalog.
  Deaths create sim wrecks worth **40%** of the dead unit's catalog scrap
  cost, decaying linearly to **0 over 120 seconds (2,400 ticks)**, then
  expiring. Salvage range is **1.5 tiles**. Wrecks never block movement
  and are not combat units. Structures do not leave wrecks.
- **Sim timing (VERIFIED: `game/sim.js`):** fixed timestep, **20 ticks
  per second**. Red AI thinks once per second (every 20 ticks).
  Projectile pool is pre-allocated at **2,048** slots; no per-tick
  allocation for projectiles.
- **Victory today (VERIFIED: `game/sim.js` `step()`):** a faction with
  no units and no structures left loses; the other faction is declared
  winner (`state.winner`). Generation Cycle 3 (frozen 2026-10-31
  ~05:01 PDT) added a deadlock draw: when at least two factions are
  alive, nobody can produce (living Command Core only) and nobody can
  damage anybody (structural capability, not range/LOS), the counter
  advances per tick and at `DEADLOCK_GRACE_TICKS = 600` (30 sim
  seconds) the sim sets `state.winner = 'draw'`. Elimination takes
  precedence; a core-alive air-only position never draws; tutorial
  games are excluded. §4.4 states how hero progression treats a draw.
- **Units and weapons (VERIFIED: `data/catalog.json`):** **49 units**
  (39 ground, 10 air), **23 structures**, **8 chassis** (Scout, Lancer,
  Bulwark, Longshot, Rampart, Vespid, Scrapjack, Warden), **12 weapon
  families**, **6 armour classes** (Unarmored, Light, Medium, Heavy,
  Fortified, Structure), **6 damage types** (Kinetic, Explosive, Energy,
  Thermal, Siege, Disruption), and a full 6×6 armour matrix.
  The catalog also contains **19 weapons**. Those 19 are the
  Prototype 01 catalog's own family modules — they are NOT a design
  document count and must never be quoted as one. The design document
  scope is §2 of this spec.
- **Chassis slots (VERIFIED: `data/catalog.json` + design doc §7):**
  every chassis carries the same seven slots: **primary, secondary,
  armor, mobility, reactor, sensor, ability**. The design doc adds the
  rule this spec keeps: *not every chassis supports every slot's full
  range* — a universal optimal build must not replace unit variety.
- **Controls today (VERIFIED: `game/game.js`, `game/CONTROLS.md`):**
  tap = select/order (pointer movement **≤ 8 px**); mouse drag =
  selection rectangle (or pan in Pan mode); touch drag = pan;
  double-tap/double-click selects all visible units of that type;
  minimap click centres, minimap drag pans; order modes are move,
  attack-move, hold, patrol, salvage, guard; on-screen groups 1–9,
  Queue toggle (touch Shift), Pan/Select toggle, Add-to-Selection
  toggle. Buttons are **≥ 44 px** tall. Zoom is **0.4×–3×**.
  Tile size is **32 px**.
- **Layout today (VERIFIED: `game/CONTROLS.md`, `game/index.html`):**
  landscape is primary: map canvas on the left, a **300 px** scrollable
  side panel on the right holding the order row (always visible),
  groups, maps, zoom, paths, and the minimap (**192×120 px** in
  landscape, 132×83 px in portrait). Portrait keeps the bottom tray.
  The web build does not lock orientation; the APK locks to landscape.
- **Menus and freezing (VERIFIED: `game/game.js`):** the sim runs only
  when no menu is open and no winner is declared. Pause, Settings, How
  to Play, main menu, and the victory panel all freeze the sim. The
  tutorial holds the red side (no red economy or combat) and is a
  separate game mode.
- **Storage today (VERIFIED: APK reports):** the APK WebView runs with
  JavaScript and **DOM storage on**. The web build runs in a normal
  browser. There is **no save/load system** for skirmish matches, no
  account, and no cloud store anywhere in the game today.
- **Maps today (VERIFIED: `game/maps.js`):** First Map and Second Map
  ("Twin Bridges") are both **80×50**, both cores at **(6,25)** Iron
  Eden and **(73,25)** Xandria, both with the same 10v10 starting
  scenario shape (the west roster includes one `lancer_mech` — see
  §3.2 for why that entry matters: the hero replaces that entry but
  starts the match in reserve, so the opening field count is 9v10).

---

## 1. Twin-stick mode

### 1.1 Entering and exiting — one clear action each way

**Entering.** The player selects exactly **one** player unit, then taps
the **"Take Control"** button. That button lives in the unit info panel
(next to the unit's name, HP, and weapon — the panel the game already
shows for a selection) and is also available in the twin-stick section
of the side panel while a single unit is selected.

- If **zero** units or **more than one** unit is selected, "Take Control"
  is shown disabled with the hint: *"Select one unit to take control."*
  It never silently takes control of the first unit of a group — taking
  control of the wrong unit in a firefight is the failure this rule
  prevents.
- If the selected unit has **no weapon** (for example the salvage team,
  which has an empty weapons list in the catalog), "Take Control" is
  disabled with: *"This unit has no weapon."* Unarmed units cannot
  enter twin-stick combat mode. (Movement-only control for unarmed
  units is explicitly out of scope — see §6, Phase A.)
- Structures can never be controlled. Tapping "Take Control" with a
  structure selected does nothing; the button is not shown for
  structures.
- Entering is **not available in the tutorial**. The tutorial holds the
  red side and teaches RTS orders; twin-stick is a post-tutorial
  feature. The button is hidden (not disabled with a lecture) in
  tutorial games.
- **The hero does not enter through "Take Control".** The Command
  Mech is not on the field to select, so it has no Take Control path.
  Its only entry is **Drop Back In** (§3.2), which drops it onto the
  field already under twin-stick control. Conversely, taking control
  of any non-hero unit while the hero is on the field withdraws the
  hero to reserve at the same moment control transfers — the player
  never has both a controlled unit and a field hero (§3.2 state
  table).

**Exiting.** While controlling a unit, the twin-stick HUD always shows
a **"Release Control"** button (≥ 44 px, top of the control strip —
§1.3). Tapping it releases the unit. In addition:

- **Esc** releases control first; a second Esc opens the pause menu.
  (Today Esc opens pause; in twin-stick mode the first press is
  reserved for release, so a player can never be trapped in twin-stick
  mode by muscle memory.)
- **Pause** (button or menu) freezes the sim and preserves twin-stick
  state; resuming returns to twin-stick mode on the same unit.
- **Quit to main menu** cancels twin-stick mode entirely.
- **Victory / defeat / draw panel** supersedes twin-stick mode: the
  mode exits when the panel shows, and the panel's buttons behave as
  today.

**What "release" does to the hero is different from any other unit.**
Releasing a non-hero unit gives it a hold order (§1.1, below). Releasing
the Command Mech **removes it from the field back to reserve** (§3.2):
no hold order, no field position, no idle presence. The same withdrawal
happens on Esc (first press), on entering RTS command mode, on taking
control of another unit, and on quitting to the main menu — any exit
from hero control is a withdrawal, not a parking. Voluntary withdrawal
creates **no wreck, grants no scrap to either side, and gains or loses
no XP** (§3.2). Only death leaves a wreck (§1.2, §4.2).

**What "release" does to the unit (the no-stuck-orders rule).** On
release, the unit is issued a **hold order at its current position**:
its movement stops, its path is cleared, its order queue is cleared,
and its auto-engage behaviour returns to the standard rule for a
holding unit (engage valid targets in range, do not chase). The
previous RTS selection is preserved, so the player can immediately
issue orders to the same unit or to the group. No order from before
twin-stick mode resumes silently, and no twin-stick input leaks into
RTS orders after release. This is a freeze-gate test in Phase A
(§6): enter, drive, fire, release, then verify the unit holds and
accepts a fresh move order.

**What happens to the rest of the army while one unit is controlled.**

- The rest of the player's army **keeps its existing orders** and
  keeps auto-engaging under those orders. Nothing is paused, frozen,
  or handed to an AI — the sim keeps running at 20 ticks/second.
- The controlled unit **ignores group orders until released.** If the
  player recalls a group that contains the controlled unit, or issues
  a formation order to a selection that includes it, the controlled
  unit does not move; the other units obey. On release, the unit
  rejoins normal ordering immediately.
- The controlled unit **ignores guard, rally, and patrol orders**
  while controlled, for the same reason. A guard point or rally point
  set before entering is remembered but not acted on until release,
  at which point the unit takes a hold order (not the old guard/rally
  order — see the release rule above).
- **Production continues** for queues already running, but **new
  production cannot be ordered while controlling**, because the build
  panel is replaced by the twin-stick HUD (§1.3). To build, release
  control, use the core panel as today, and re-enter. This is
  deliberate: twin-stick mode trades army management for direct
  control, and the trade must be visible.
- The red AI is unaffected except through the normal sim: it sees the
  controlled unit as an ordinary enemy unit (§4.4).

### 1.2 What twin-stick control actually does in the sim

Twin-stick mode changes **input only**. It does not change the sim's
damage model, economy, or victory rules, and it must not introduce a
second movement or combat system.

- **Movement (left stick / WASD):** the stick direction is the unit's
  velocity direction; the unit moves at its **catalog speed** (the
  same `speed` value the RTS path follower uses — for example 6.0 for
  a lancer mech, 8.5 for a vespid scout). Speed is a cap, not a
  bonus: twin-stick driving is never faster than RTS movement for the
  same unit. Movement is blocked by the same terrain rules as RTS
  movement (ground units cannot enter water or rock tiles; air units
  ignore ground blocking, exactly as `isPassable` already defines).
  The unit's position is clamped to the map. There is no new
  unit-to-unit collision system: controlled units pass through other
  units exactly as RTS units do today. Adding collision is out of
  scope for every phase in §6.
- **Aim and fire (right stick / mouse):** the aim direction sets the
  unit's facing/turret direction. While the right stick is deflected
  past a **0.35 deadzone** (PROPOSED), the unit fires its equipped
  weapons at valid targets in the aim direction, using each weapon's
  existing **cooldown, range, minimum range, line of sight (rock
  blocks), target classes, accuracy, damage type, and armour matrix**.
  A weapon that cannot hit a target class (for example a ground-only
  flamethrower against an air unit) does not fire at that target.
  A weapon inside its minimum range does not fire; the HUD shows the
  unit's weapon range ring while controlling, so "why isn't it
  firing" is answerable at a glance.
- **Which weapons fire:** all equipped weapons that can engage in the
  aim direction fire on their own cooldowns, exactly as a holding unit
  with the same weapons would. Twin-stick mode does not add a fire
  rate bonus, a damage bonus, or a second weapon set.
- **Firing feedback:** muzzle flashes, projectiles, and hit effects
  reuse the existing animation and projectile systems (including the
  2,048-slot projectile pool). Twin-stick firing must not allocate a
  new projectile object per shot; it must take a pooled slot or not
  fire. This is a Phase A implementation constraint, stated here so
  it is tested, not discovered on a phone.
- **Camera:** while controlling, the camera **follows the controlled
  unit and stays centred on it** (clamped to the map edges as today).
  Panning is disabled in this mode — the camera belongs to the unit.
  Zoom buttons still work. Minimap taps do **not** move the camera
  while controlling (the camera is locked to the unit); the minimap
  remains visible as a situational display. On release, the camera
  stays where it is; the player pans from there as today.
- **When the controlled unit dies:** twin-stick mode exits
  immediately. The camera stays centred on the death tile (it does
  not snap to the core), the selection is cleared, and the death is
  handled by the existing rules: the unit leaves a wreck worth 40% of
  its catalog scrap cost, decaying over 120 seconds. For the hero
  mech, §3.5 and §4.2 add a respawn rule on top of this, but the exit
  behaviour is the same — with one critical distinction: **death is
  the only field exit that leaves a wreck.** A voluntary withdrawal
  (§3.2) leaves nothing behind: no wreck, no scrap, no salvage
  opportunity for either side. A player who withdraws a damaged hero
  denies the enemy a salvage, but also loses the hero's field
  presence until the redeploy cooldown clears — that trade is the
  point of the cooldown (§3.2).

### 1.3 Phone layout (landscape primary) — where the sticks live

Landscape is the game's primary layout, and twin-stick mode must fit
it without fighting the side panel.

- **Stick zones are drawn over the map canvas only, never over the
  side panel.** The side panel is 300 px wide on the right; the canvas
  is everything left of it. Left-stick zone: the left 40% of the
  **canvas** width, bottom 60% of canvas height. Right-stick zone:
  the right 40% of the **canvas** width, bottom 60% of canvas height.
  The middle 20% of the canvas stays stick-free, so a thumb resting
  mid-screen does not steer or fire by accident.
- **Sticks use a dynamic origin:** the stick appears where the thumb
  lands inside its zone (within a ~60 px radius, PROPOSED), rather
  than demanding the thumb find a fixed circle. Fixed sticks fail on
  phones because thumbs do not land in the same place twice; dynamic
  origin is the standard fix and is specified here deliberately.
- **Deadzone 0.35** (PROPOSED) on both sticks: small thumb tremor
  produces no movement and no fire.
- **While controlling, the side panel collapses to a control strip:**
  the order row, groups, maps, and zoom rows are replaced by, in
  order: **Release Control**, **Ability 1**, **Ability 2** (hero
  skills in Phase C; for non-hero units these buttons are hidden,
  not disabled placeholders), the controlled unit's **HP bar and
  weapon range note**, and the minimap (display only, taps disabled
  per §1.2). Every button stays ≥ 44 px. The strip scrolls if the
  landscape height demands it, as panels do today.
- **Drop Back In also lives in the control strip** while the player
  controls a non-hero unit (§3.2): pressing it releases that unit
  (hold order, §1.1) and drops the hero into twin-stick control in
  its place. The strip therefore always offers exactly one way back
  to the hero, from either mode, without hunting through a menu.
- **Portrait fallback:** twin-stick mode works in portrait, but the
  layout is degraded by design: sticks overlay the canvas as above
  (canvas-relative zones), and commands collapse to a bottom strip
  holding Release Control and abilities. The portrait rotate hint is
  suppressed while controlling (it would sit on a stick zone).
  Landscape remains the recommended mode; portrait is supported, not
  preferred.
- **Multi-touch requirement:** the implementation must track each
  pointer by its pointer id (the existing shell already uses
  `setPointerCapture` per pointer id for canvas input). Two thumbs
  plus a button tap are three simultaneous pointers; a design that
  assumes one pointer at a time will break the moment a player moves,
  aims, and taps an ability together. This is a Phase A freeze-gate
  test, not a footnote.
- **Tap conflicts, stated plainly:** while controlling, canvas taps
  are **not** RTS orders. A tap inside a stick zone steers or aims.
  A tap outside both zones does nothing (it does not select, move,
  or attack). This is the single biggest behaviour change in the
  mode, and the HUD must say so: the twin-stick banner reads
  *"Manual control — left stick moves, right stick aims and fires.
  Release Control returns to RTS orders."* while the mode is active.

### 1.4 Desktop equivalents — one scheme, justified

**Desktop scheme: WASD to move, mouse to aim, hold left mouse button
to fire, Q and E (or on-screen buttons 1 and 2) for abilities, Esc to
release (first press) and open pause (second press).**

Justification: this is the established twin-stick shooter scheme on
desktop, and mouse aim is strictly more precise than emulating a
second stick with keys — a key-aim scheme (for example arrow keys)
would make the desktop version of the same feature measurably worse
than the phone version for no benefit. Space is **not** reassigned:
today Space pauses (with Esc), and keeping it as pause avoids
retraining every existing player. Right mouse button is reserved
(it is not used for orders today, and context-menu is already
suppressed on the canvas); it is not assigned in Phase A, so a later
phase can use it without breaking habits formed here.

### 1.5 Pause and menu behaviour in twin-stick mode (summary)

| Situation | Behaviour |
|---|---|
| Pause button / Esc (2nd press) / Settings / How to Play | Sim freezes as today; twin-stick state preserved; resume returns to the same unit in twin-stick mode. |
| Quit to main menu | Twin-stick mode cancelled; no state carried into the next match except hero progression (§3.6), which is written at match end, not at quit. |
| Victory / defeat / draw panel | Mode exits; panel behaves as today; hero XP is written at this point (§3.4). |
| Controlled unit dies | Mode exits immediately (§1.2); camera stays on the death tile. |
| Match restarted from pause | New match starts in RTS mode, not twin-stick mode. The player must take control again. |
| Tutorial | Twin-stick entry is hidden; the tutorial teaches RTS orders only. |
| Drop Back In pressed (RTS mode, hero in reserve) | Hero drops at the core-adjacent tile (§3.2) and twin-stick control starts on landing; the mode banner shows the hero's name, level, and HP. |
| Drop Back In pressed (controlling a non-hero unit) | That unit is released (hold order, §1.1) and the hero drops in its place under twin-stick control. The player never controls two units at once. |
| Hero control released (Release Control, Esc, or Take Control of another unit) | Hero withdraws to reserve (§3.2): off the field entirely, exact HP kept, no wreck, no scrap, no XP change. RTS command mode resumes. |
| Hero dies while controlled | Mode exits; hero wreck created (152 scrap at full value, 120 s decay, §4.2); Drop Back In becomes the paid-after-timer redeploy (§3.2), not an instant return. |

---

## 2. Weapon compatibility and loadout — one seed, not 123 stat blocks

### 2.1 The count, stated correctly

The original design document's Expansion Content Master List §1 lists
**123 named weapons**: ballistic **32**, energy/plasma **30**,
melee/industrial **34**, biological/chemical/corrosive **12**
(numbered 19–30 in the document), experimental/rare **15** (numbered
31–45). The RTS spec §8 lists **12 weapon families** (no individual
weapon names). The catalog's 19 weapons are family modules from
Prototype 01, not a design document count (§0).

The user's phrase "several hundred weapons" does not match the
document: there are 123 named weapons. This spec does not invent
further named weapons to reach "several hundred". What the seed
system *does* multiply is **combinations**: 123 named weapons ×
tiers × compatible chassis is far more than 123 builds, and that
multiplication is honest only if it is described as combinations,
never as named weapons. Any future copy that says "hundreds of
weapons" must say "hundreds of loadout combinations" or not say it.

### 2.2 The weapon template (the seed)

Every weapon in the game — catalog weapons today, named weapons in
Phase B, hero weapons in Phase C — is one row over this template.
No weapon may carry a stat that is not in this template, and no
weapon may bypass the compatibility fields.

| Field | Meaning | Source / rule |
|---|---|---|
| `id` | Stable string id, e.g. `w_scrapstorm_rotary`. Never renamed after shipping a phase; renames break saved loadouts (§3.6). | New in Phase B. |
| `name` | Display name, verbatim from the design document for named weapons. | Design doc §1. |
| `family` | One of the 12 RTS §8 families: Autocannon, Heavy Cannon, Missile Launcher, Rocket Artillery, Railgun, Mortar, Flamethrower, Anti-air Cannon, Laser, Siege Cannon, Melee Weapon, Electronic Warfare. | Design doc §8. |
| `damageType` | One of the 6 catalog damage types: Kinetic, Explosive, Energy, Thermal, Siege, Disruption. | Catalog. |
| `damage` | Damage per hit, before the armour matrix. | Family baseline ± variant modifier (§2.3). |
| `range` / `minRange` | Tiles. `minRange` 0 unless the family needs it (artillery, siege, railgun). | Catalog fields. |
| `interval` | Seconds between shots. Fire rate is `1 / interval`; the spec always writes both, so a reader never has to derive it. | Catalog field. |
| `projectileSpeed` | Tiles/second, or `instant` for beam/melee/EW behaviour as the sim already distinguishes them in animation mapping. | Catalog field. |
| `splashRadius` / `falloff` | Area damage radius and falloff, exactly as `computeDamage` already applies them. | Catalog fields. |
| `accuracy` | Hit probability, 0–1, as the catalog uses it. | Catalog field. |
| `targetClasses` | Subset of `ground`, `air`, `structure`. A weapon never hits a class outside this list. | Catalog field. |
| `slot` | `primary`, `secondary`, or `utility`. Utility is EW and sensor weapons only. | Catalog chassis slots, §0. |
| `compatibleChassis` | List of chassis ids that may equip it. Empty means "none" — never "all". | §2.4. |
| `tier` | 1, 2, or 3. Tier gates both power and hero level (§3.5). | New in Phase B. |
| `scrapCost` | Cost to unlock/equip in the loadout system. Match scrap is separate: this cost is paid in the loadout screen, not from in-match scrap, unless a later phase adds a refit rule (§2.5). In Phase B, `scrapCost` is recorded but the loadout screen uses level gating (§3.5), not a second currency — see §3.5 for why no second currency is introduced. | New in Phase B. |
| `powerCost` | Reserved, always **0** until the Power economy layer exists. The game has no Power layer today (catalog power costs exist in data but no power system runs); a weapon must not pretend to consume power it does not consume. When Power lands, this field activates without a data migration. | Design doc §8 required properties; catalog reality. |
| `special` | Optional, from a closed list defined once (see below). No free-text specials: a special the code does not implement is a lie in the loadout screen. | New in Phase B. |

**Derived value (for balance review, never a separate stat):**
`DPS ≈ damage × accuracy / interval`, splash excluded. Every named
weapon row must show its DPS in review, so a tier-3 weapon that is
weaker than a tier-1 weapon in the same family is caught before it
ships.

**Closed `special` list (Phase B ships only these; anything else is a
later phase's proposal, not a row value):**

- `none` — no special behaviour.
- `overheat` — after 4 seconds of continuous fire, a 1.5-second
  forced cooldown (PROPOSED values). Used for high-fire-rate weapons
  whose design-document descriptor implies ammunition/heat pressure.
- `pierce` — the projectile passes through its first valid target
  and continues at 50% damage (PROPOSED). Used for penetration
  descriptors.
- `burn` — impact leaves a burning zone for 3 seconds dealing the
  weapon's damage × 0.25 per second to units standing in it
  (PROPOSED). Used for incendiary descriptors.
- `stun` — on hit, the target's speed is halved for 1.5 seconds
  (PROPOSED). Used for disruption/stun descriptors. This is a
  slow, not a freeze: a frozen unit in an RTS is a different,
  stronger effect and is not in this list.
- `splash` is not a special: it is `splashRadius`/`falloff`, already
  in the template.

### 2.3 How the 123 named weapons map onto the template

**Rule:** a named weapon is a data row, not a stat block. Each row
states: `name` (verbatim), `family` (assigned by the row author from
the weapon's descriptor and group — ballistic names map to
ballistic families, energy names to energy families, and so on),
`tier` (1–3, from the descriptor's implied power), `slot`, and a
**variant modifier**: at most two multipliers applied to the family
baseline (for example `damage ×1.15, interval ×0.9`), plus at most
one `special` from §2.2. The family baseline carries the tuned
numbers (range, projectile speed, splash, accuracy, target classes);
the row carries only the name, the family, the tier, and its small
deviation. If a named weapon cannot be expressed as a family baseline
plus at most two multipliers and one special, it is not ready to
ship: either the family baseline is wrong (fix the baseline) or the
weapon is misassigned (reassign the family). Do not add a third
multiplier to force it to fit.

**Family baselines (Phase B ships 12, one per family):** each baseline
is tuned to sit inside the catalog's existing ranges (for example
Autocannon baseline near the catalog Autocannon: damage ~12, range 6,
interval 0.5, Kinetic, ground+structure) and is validated by the
schema test in §6 — every named row must resolve to a family, every
family must have at least one row, and no row may reference a family
that has no baseline.

**What Phase B actually ships:** all 123 names as data rows (name,
family, tier, slot, modifier, special), but only the 12 family
baselines are tuned numbers. This is the honest version of "using
the several hundred weapons": every named weapon exists and is
equippable where compatible, without pretending 123 weapons were
individually balance-tested. Individually tuned named weapons, if
ever wanted, are a later phase's work, listed as such — not implied
by Phase B.

### 2.4 Three worked examples (different families)

All numbers below are PROPOSED starting values for balance testing,
derived as §2.3 describes. Descriptors are quoted from the design
document.

**Example 1 — Scrapstorm Rotary Gun (Autocannon).**
Design-document descriptor: *"high fire rate, heavy ammunition
consumption."* Family: Autocannon. Damage type: Kinetic. Target
classes: ground, structure. Baseline: Autocannon (damage 12, range 6,
interval 0.5). Variant modifiers: interval ×0.5 (fire rate 4 shots/
second), damage ×0.85 (damage 10). Special: `overheat` (4 seconds
continuous fire, then 1.5 seconds forced cooldown — the template's
expression of "heavy ammunition consumption", since the game has no
ammunition system and inventing one for a single weapon would be a
second economy). DPS ≈ 10 × 0.85 / 0.25 = 34. Slot: primary. Tier: 2.
Compatible: Scout, Lancer, Vespid, Scrapjack (light/medium chassis
that can carry a rotary mount; not Bulwark/Rampart, which use
heavier primaries, and not Longshot, whose primary slot is reserved
for long-range families — see §2.5).

**Example 2 — Cratermaker (Siege Cannon).**
Design-document descriptor: *"slow-firing siege cannon."* Family:
Siege Cannon. Damage type: Siege. Target classes: ground, structure.
Baseline: the catalog Siege Cannon (damage 55, range 18, minRange 5,
interval 4.0, splash 2.5, falloff as catalog). Variant modifiers:
none — this row is the baseline, which is the point: not every named
weapon needs a deviation. DPS ≈ 55 × 0.8 / 4.0 = 11 before splash.
Slot: primary. Tier: 3. Compatible: Bulwark, Rampart only.
Incompatible with Scout, Vespid, Lancer, Longshot, Scrapjack, and
Warden: a siege cannon's weight and minimum range make it unusable
on a fast or light chassis, and a Longshot already carries its own
long-range primary — giving it a siege cannon as well would collapse
the distinction between the two chassis. Air units cannot equip it
at all (a ground/structure siege weapon has no air mounting in this
system).

**Example 3 — Railspike (Railgun).**
Design-document descriptor: *"magnetic accelerator with extreme
penetration."* Family: Railgun. Damage type: Energy. Target classes:
ground, structure. Baseline: the catalog Railgun (damage 40, range
20, minRange 6, interval 3.5). Variant modifiers: damage ×1.0,
interval ×1.0 — again the baseline, with the penetration expressed
as the special, not as inflated damage. Special: `pierce` (passes
through the first valid target, continues at 50% damage).
DPS ≈ 40 × 0.8 / 3.5 = 9.1 single-target, higher against lined-up
targets (which is exactly what "extreme penetration" should reward).
Slot: primary. Tier: 3. Compatible: Longshot, Lancer only.
Incompatible with Scout, Vespid (too light for the accelerator),
Bulwark, Rampart (their primaries are siege/heavy families),
Scrapjack (generalist cap: tier 3 railguns excluded — see §2.5),
and all air units.

### 2.5 Compatibility rules (the whole table, in words)

Compatibility is decided by **chassis + slot + movement class +
tier**, never by faction. A weapon that is compatible for Iron Eden
is compatible for Xandria if Xandria fielded the same chassis; the
hero is Iron Eden only because the player is Iron Eden (§3), not
because weapons are faction-locked.

- **Primary slot:** one weapon, from the chassis's primary family
  list (below). The primary defines the unit's role; a unit with a
  siege primary is a siege unit, whatever its chassis name says.
- **Secondary slot:** one weapon, only from lighter families
  (Autocannon, Missile Launcher, Flamethrower, Anti-air Cannon,
  Melee Weapon) and only at tier ≤ the primary's tier. A secondary
  must never out-tier the primary: a scout with a tier-3 secondary
  and a tier-1 primary is a misbuild the validator must reject.
- **Utility slot:** Electronic Warfare weapons and sensor packages
  only. EW weapons deal Disruption damage, low direct damage, and
  target ground+air (as the catalog EW Disruptor does). No chassis
  may put a damage primary in the utility slot.
- **Movement class:** air units may only equip weapons whose
  target classes include `air` or that are explicitly air-mountable
  (Missile Launcher, Anti-air Cannon, Laser, Autocannon variants
  with air targets). Ground-only families (Flamethrower, Melee
  Weapon, Siege Cannon, Mortar) are incompatible with air units.
  Ground units may equip Anti-air Cannon (the flak role already
  exists in the catalog).
- **Chassis primary family lists (PROPOSED, Phase B validates):**
  - Scout: Autocannon, Missile Launcher, Laser (tier ≤ 2).
  - Lancer: Autocannon, Heavy Cannon, Missile Launcher, Laser,
    Railgun (tier ≤ 2), Melee Weapon.
  - Bulwark: Heavy Cannon, Siege Cannon, Flamethrower, Mortar.
  - Longshot: Railgun, Siege Cannon, Rocket Artillery, Mortar.
  - Rampart: Siege Cannon, Heavy Cannon, Rocket Artillery, Mortar.
  - Vespid: Autocannon, Laser, Missile Launcher (tier ≤ 2),
    Electronic Warfare (utility only).
  - Scrapjack (generalist): Autocannon, Heavy Cannon, Missile
    Launcher, Flamethrower, Melee Weapon — but **tier capped at 2**.
    The generalist's price for fitting everything is never fitting
    the best of anything. This is the design document's §7 rule
    ("not every chassis should support every slot") expressed as a
    number.
  - Warden: Autocannon, Missile Launcher, Laser, Electronic
    Warfare, Heavy Cannon (tier ≤ 2). Warden is not a playable
    faction's chassis today (Directorate only, not in skirmish);
    its list is recorded so the template does not need a second
    pass when that faction arrives.
- **Explicitly incompatible, and why (examples that must be in the
  validator's rejection messages, so a player is told a reason, not
  just "invalid"):**
  - Siege Cannon on Scout/Vespid: weight and minimum range.
  - Flamethrower or Melee on any air unit: no ground mounting.
  - Tier-3 weapons on Scrapjack: generalist tier cap.
  - Any primary in the utility slot, any EW weapon in the primary
    slot: slot discipline.
  - Secondary tier above primary tier: role discipline.
  - A weapon whose target classes exclude every target the unit can
    reach: for example an air-only weapon on a ground unit that
    cannot engage air — it would be a dead slot, so it is rejected
    at loadout time rather than discovered in battle.

### 2.6 When loadouts change — the rule, and why

**PROPOSED RULE (decision open, §7): loadouts change only between
matches.** There are two loadout moments, and no others:

1. **Hero loadout screen** (Phase B/C): before a match, from the
   main menu, the player edits the Command Mech's 7 slots from
   unlocked weapons and gear. The match then starts with that
   loadout, fixed for the match.
2. **Unit production variants** (Phase B): when a unit is produced
   from the core, its variant is the catalog default. Named-weapon
   variants for non-hero units are **not** chosen per-unit in Phase
   B; a later phase may add a production-variant picker, but Phase
   B deliberately does not, because per-unit loadout picking would
   turn every production click into a loadout screen and break the
   RTS pacing the game has spent ten passes building.

**No mid-match loadout changes.** No refit at the core, no weapon
pickup from wrecks, no swapping a primary mid-battle. Justification:
mid-match refit lets one unit become every counter in turn, which
breaks the counter system (a siege unit that refits to anti-air the
moment aircraft appear has no counter) and breaks the scrap economy
(refitting is cheaper than building the counter unit, so production
stops mattering). The design document's §7 rule supports this:
"configurations are selected before deployment or at eligible
production facilities" — before deployment is the stricter, safer
reading, and this spec takes it. If the user decides mid-match
refit is wanted (§7), it must arrive with a price (scrap cost +
time at the core + the unit out of action while refitting), never
as a free swap — that price is a later phase's design, not a Phase
B omission to be filled silently.

---

## 3. The hero mech — "Command Mech" (placeholder name)

The final name is an **open decision** (§7). Everywhere in code,
data, and UI until that decision, the mech is `command_mech` /
"Command Mech". Do not invent a final name in a build, a sprite
filename, or a loadout row: renaming later costs more than waiting
now, and a placeholder that looks final is how a placeholder ships.

### 3.1 What the hero is

The Command Mech is the player's default starting mech: an Iron Eden
mech the player owns across matches, with its own loadout, gear,
skills, and level. **While on the field, it is a unit in the sim**,
not a separate game mode: it moves, fires, takes damage, leaves a
wreck, and is salvaged by the same rules as every other unit.
**While in reserve, it is not a sim entity at all** — it has no
field position, no HP bar on the map, no orders, and no presence
the enemy can interact with (§3.2). Its persistence lives
**outside** the sim (§3.6); inside a match, while on the field, it
is an ordinary unit with a loadout and a level applied to its stats.

Base chassis: **Lancer** (mobile assault). Rationale: a hero that
will be twin-stick driven needs speed and responsiveness (Lancer
speed 6.0, Medium armour) more than it needs siege range or
Bulwark durability, and Lancer's primary family list is the widest
of the non-generalist chassis (§2.5), which suits a mech the player
customises. A Bulwark hero would be a slow twin-stick experience;
a Longshot hero would be a sniper the player drives into melee by
accident. Lancer is the middle that twin-stick play wants.

### 3.2 Hero presence model — reserve by default, Drop Back In to deploy

**Default state (the rule this section exists to state).** The
Command Mech is **off-map in reserve, not a field unit, whenever
the player is in RTS command mode or controlling any non-hero
unit.** It is on the field **only while the player is actively
controlling the hero in twin-stick mode.** It never fights
autonomously, never idles on the field under RTS orders, and never
follows group, guard, rally, or patrol orders. There is no
"parked hero" state: the hero is either being driven by the
player, in reserve, or dead (wreck on the field + redeploy path
below). This replaces the original spec's "spawns in place of one
starting unit" field presence — see the amendment changelog at the
top of this document.

**Match start and roster (exact).** In First Map and Second Map
skirmishes, the Command Mech still **replaces the west roster's
`lancer_mech` entry** — same faction (Iron Eden), same economy —
but it **starts the match in reserve**, not on the field. The
opening field count is therefore **9 field units versus 10 Xandria
units**, with the hero available on demand through Drop Back In.
The hero does **not** cost scrap, does **not** consume a production
queue slot, and does **not** change either side's starting scrap
(500 each, unchanged). The Test Map is excluded from hero play in
every phase (it is a 64×40 test scenario, not a skirmish map);
hero play is First Map and Second Map only.

Why replacement, not addition, still holds under the reserve
model: adding a free 11th field unit would give the player an
11v10 start and a free ~380 scrap of value (the lancer mech's
catalog cost) every match, which is an asymmetry the red AI was
never tuned for. Replacement keeps the roster count, economy, and
starting scrap symmetric, and the hero's level-1 stats mirror the
replaced unit (§3.3), so a level-1 hero match starts as close to
the current game as possible — with the hero's field presence
gated behind the player's decision to drop it in, not granted for
free at match start.

**Presence state table (the whole model in one place).**

| State | Where the hero is | What it can do | What ends the state |
|---|---|---|---|
| Reserve (default) | Off-map; not a sim entity, not in the field entity lists | Nothing on the field. Loadout/level/skills/HP are held as shell state, not as a unit. | Drop Back In pressed (and available) → Dropping. |
| Dropping (telegraph) | Marker at the drop tile; not yet a sim entity | Nothing — cannot act, cannot be damaged (see telegraph rule below). | Telegraph completes → Controlling (hero). |
| Controlling (hero) | On the field, twin-stick controlled by the player | Drive, aim, fire, use hero abilities (§1.2, §3.5). | Release Control / Esc / entering RTS command mode / taking control of another unit → Reserve. Death → Dead (wreck). |
| Dead (wreck) | Wreck on the field at the death tile; hero record held as shell state | Nothing until redeployed; wreck is salvageable by either side under normal wreck rules. | Drop Back In pressed once the respawn terms are met (§4.2) → Dropping → Controlling (hero). |

**Transitions, stated explicitly (no ambiguous edges).**

- **Match start → Reserve.** Every skirmish with the hero enabled
  starts with the hero in reserve, at full HP for its level/gear.
- **Drop Back In → Controlling (hero).** Pressing Drop Back In
  (when available, below) starts the drop telegraph at the drop
  tile; on landing, twin-stick control begins immediately. The
  player does not need a second action to take control after
  landing.
- **Release Control / Esc / entering RTS command mode → Reserve.**
  Any exit from hero control withdraws the hero to reserve. The
  hero's exact HP, loadout, skills, and level are kept (§3.2, HP
  rule below); no wreck is created, no scrap is granted to either
  side, no XP is gained or lost.
- **Taking control of another unit → Reserve, at the same moment.**
  If the hero is on the field and the player takes control of a
  non-hero unit (via Take Control, §1.1), the hero withdraws to
  reserve in the same action that transfers control. The player
  cannot have both a controlled unit and a field hero. Pressing
  Drop Back In while controlling a non-hero unit releases that
  unit (hold order, §1.1) and drops the hero in its place.
- **Hero death while controlled → Dead (wreck), NOT reserve.**
  Death is the only field exit that leaves a wreck and the only
  exit that does not return the hero to reserve. The hero returns
  only through the paid-after-timer redeploy (§4.2).
- **Quit to main menu / match restart → Reserve at next match
  start.** Quitting mid-match earns no XP for that match (§3.6);
  the next match starts with the hero in reserve at full HP.

**Drop Back In button — placement, availability, disabled reasons.**

- **Placement (both, always):** the button lives in the **RTS
  command tray** (the order row area of the side panel in
  landscape, the bottom tray in portrait) **and** in the
  **twin-stick control strip** while the player controls a
  non-hero unit (§1.3). It is ≥ 44 px in both places, always
  visible in skirmish matches with the hero enabled, and disabled
  with a reason when unavailable — never silently absent, so the
  player can always see why they cannot drop.
- **Disabled reasons (exact list; the button shows the reason):**
  - Hero already on the field (controlling the hero): *"Hero is
    already in the field."* In practice the button is hidden
    behind Release Control in this state, not offered as a second
    drop — but if shown, it is disabled, never a duplicate drop.
  - Hero dead and respawn terms not yet met: *"Hero respawning —
    Xs remaining"* or *"Hero respawn needs 200 scrap"* (whichever
    is the binding constraint; §4.2).
  - Own Command Core dead: *"Command Core destroyed — no
    redeploy."* If the core is dead, no redeploy is possible by
    either path (voluntary or death), because the drop anchors on
    the core (below) and production is gone.
  - Voluntary redeploy cooldown active: *"Drop ready in Xs"*
    (cooldown below).
  - Tutorial: the button is **hidden**, not disabled — twin-stick
    entry is hidden in the tutorial (§1.1), and Drop Back In is a
    twin-stick entry.
  - Hero toggled off (§7.6): the button is **hidden** and the
    roster is the original 10v10.

**Drop location rule (PROPOSED, justified).** The hero drops on the
**nearest passable tile to the player's own Command Core**, found
by the same ring-search production spawn logic the sim already uses
(`spawnPosition` in `game/sim.js`: expanding rings around the core,
first tile passable for the hero's movement class, ground — so
never water or rock). The player does **not** choose the drop tile.
Justification: a player-chosen drop would make the hero a teleport
ambush unit — dropped behind enemy lines, onto a bridge, or into
an undefended base — which is a mobility power no other unit has
and which would break the map's terrain logic (the First Map's
single bridge, the Twin Bridges lake) by letting the hero bypass
it at will. Core-adjacent dropping keeps the hero a field unit
that must travel to the fight like every other unit, while still
feeling like a reinforcement arriving where the player's base is.
If no passable tile exists within the spawn search (core fully
surrounded by impassable tiles), Drop Back In is disabled with
*"No drop tile near the Command Core."* — it never drops the hero
onto water, rock, or an occupied tile by fallback.

**Drop-in telegraph (PROPOSED).** On Drop Back In, a landing marker
is drawn at the drop tile for **2 seconds (40 ticks, PROPOSED)**
before the hero becomes a field unit, reusing existing dust /
explosion FX frames for the landing burst on arrival. During the
telegraph:

- The hero **cannot act** (no movement, no fire, no abilities).
- The hero **cannot be damaged**: it is not yet a sim entity
  until landing completes, so no weapon, splash, or effect can hit
  it. Making a not-yet-landed unit damageable would let the enemy
  kill a hero the player cannot yet control or move, which is
  punishment without counterplay.
- The marker **is visible to both sides** (PROPOSED, §7.11): the
  game has no fog of war, so hiding the marker from the red side
  would be hidden information in a no-fog game, and the red AI
  treats the marker as a non-target (it is not an entity, so the
  AI's targeting, which iterates entities, cannot select it
  anyway). The marker is fair warning, not a target.
- If the match ends (victory, defeat, or draw panel) during the
  telegraph, the drop is cancelled and the hero stays in reserve
  for progression purposes (no XP change from the cancelled drop).

**HP and state across withdrawal (exact).** The hero keeps its
**exact HP, loadout, skills, and level** when it withdraws.
Damage persists: a hero withdrawn at 40 HP drops back in at 40 HP
(within the same match). Withdrawal is **not** a heal, not a
repair, and not a reset — Field Repair (§3.5) and the normal
between-match full-HP start are the only ways HP recovers. The
progression record (§3.6) has no HP field, so this persistence is
**within-match only**: the next match starts with the hero at full
HP for its level and gear, as before. No wreck is created on
voluntary withdrawal, no scrap is granted to either side, and no
XP is gained or lost on withdrawal (§3.5 sources are kills,
salvage, and match result only).

**Cooldowns and costs — one button, two states (all numbers
PROPOSED, open decisions §7.8–§7.10).**

| Redeploy path | Cost | Wait | Button state |
|---|---|---|---|
| Voluntary withdrawal → redeploy | **Free (PROPOSED, §7.10).** No scrap cost. The cost of withdrawing is field absence plus the cooldown, not scrap: charging scrap for a voluntary withdrawal would double-charge a player who already paid by losing the hero's presence, and would make withdrawal a rich-player-only escape. | **10 seconds (200 ticks, PROPOSED, §7.8)** from the moment of withdrawal. Rationale: short enough that dropping back in feels responsive (a player who withdrew by mistake is not locked out of a fight), long enough that withdrawing to escape a bad fight costs real field presence — 10 seconds is roughly a third of the hero respawn timer, so escape-by-withdrawal is cheaper than death but never free. | "Drop Back In" enabled once the cooldown clears; disabled with "Drop ready in Xs" while it runs. |
| Death → redeploy | **200 scrap (existing §4.2 respawn cost, unchanged).** | **30 seconds (existing §4.2 respawn timer, unchanged)**, waiting until affordable if scrap is short (timer does not reset, debt does not grow). | "Drop Back In" disabled with the binding reason (time or scrap) until both terms are met, then enabled. This **replaces** automatic respawn: the hero does not reappear on its own after 30 seconds — the player must press Drop Back In. |
| Core dead (either path) | — | — | Disabled: "Command Core destroyed — no redeploy." No redeploy is possible by either path once the core is gone. |

There is **one** redeploy button with two states, not two
mechanisms: the button's label, disabled reason, and cost display
change with the hero's state (reserve-after-withdrawal vs dead),
but the player learns one control, in one place, for both paths.

**Elimination / defeat interaction (critical — not ambiguous).**
A hero in reserve **does not count as a field unit, does not
prevent defeat, and does not keep a match alive.** If the player's
Command Core is dead and all other field units and structures are
gone, the match ends in **defeat even with a healthy hero in
reserve** — the reserve hero cannot be dropped back in to rescue a
lost match, because the core is dead and redeploy requires a
living core (above). Conversely, a hero in reserve is **not an
elimination target**: the red AI cannot target, damage, or count
it, because it is not in the field entity lists. Implementation
note: reserve = shell/sim flag with the hero **removed from the
field entities** (`state.units` for the hero) while in reserve and
re-added on drop — it must not be a "hidden" or "invulnerable"
unit left in the entity list, or every field-entity iteration
(targeting, damage, victory, deadlock) would need a special case
for it.

**Cycle 3 deadlock detector interaction (explicit).** Cycle 3's
detector (`checkDeadlock` in `game/sim.js`) counts **field
entities only**: it iterates the field unit and structure lists
for distinct factions, production (living Command Core), and
damage capability (structural weapon-vs-target-class capability).
A reserve hero is absent from those lists, so it **cannot prevent
a draw** (it contributes no damage capability while in reserve)
and **cannot cause a draw** (it is not a faction presence — a
side with only a reserve hero and no field entities is already
eliminated, not deadlocked). A hero on the field counts exactly
like any other field unit in the detector. No change to Cycle 3's
rule, grace (600 ticks), or elimination precedence is needed or
made by this model — but Phase B must test the reserve
interactions explicitly (hero in reserve + deadlocked field →
draw still fires; hero in reserve + otherwise eliminated side →
defeat, not a prolonged match).

**Wreck and salvage treatment (unchanged from the original
spec).** For wreck value, the Command Mech counts as **380 scrap**
(the replaced lancer mech's catalog cost), so its wreck is worth
**152 scrap** at full value (40%), decaying over 120 seconds like
any wreck, and salvageable by any unit of either faction under the
existing rules. Dying in the hero must fund the enemy if the enemy
salvages it — that is a balance guardrail, not an oversight
(§4.2). Voluntary withdrawal creates no wreck at all (above), so
only death funds the enemy.

**If the hero is toggled off** (see §7, mandatory vs optional): the
starting roster reverts to the original 10v10, including the
standard `lancer_mech`, Drop Back In is hidden, and no hero
progression is earned in that match. The toggle is a Settings
option, default **ON** (PROPOSED), because "default starting mech"
is the feature as requested — but the toggle exists so a player
who wants a pure skirmish can have one, and so balance testing can
compare hero-on vs hero-off matches directly.

### 3.3 Starting loadout and level-1 stats (the anti-trivialisation anchor)

**Level-1 hero = a standard unit.** This is the single most
important balance sentence in this section. A level-1 Command Mech
must be, within a small margin, a lancer mech with a customisable
name:

| Stat | Level-1 Command Mech | Source |
|---|---|---|
| HP | 200 | Lancer mech catalog HP (VERIFIED). |
| Armour | Medium | Lancer mech catalog armour (VERIFIED). |
| Speed | 6.0 | Lancer mech catalog speed (VERIFIED). |
| Vision | 10 | Lancer mech catalog vision is not separately listed in the excerpt used for this spec; 10 is PROPOSED, matching the scout-class vision band, and must be confirmed against the catalog row before Phase B freezes. |
| Primary | PROPOSED: **Twin-Bore Autogun** (Autocannon family, "paired barrels, alternating shots") — final starting weapon is an open decision (§7); this is the proposal, not the lock. | Design doc §1 (verbatim name). |
| Secondary | None at level 1. Unlocks at level 3 (PROPOSED). | §3.5. |
| Armor / Mobility / Reactor / Sensor / Ability | Standard (catalog-equivalent) packages: no bonus at level 1. | §3.5. |

If a level-1 hero is stronger than the unit it replaces, the hero
is not a progression feature — it is a starting advantage, and
every later level only widens it. The freeze gate for Phase B must
include a hero-on vs hero-off comparison match (see §6) that
fails the phase if the level-1 hero's presence alone swings the
result beyond the normal variance of the stand-in matches. Under
the reserve model (§3.2), that comparison runs with the hero in
reserve at match start and dropped in on demand — a hero that
starts on the field would be testing the superseded model, not
this one.

### 3.4 Gear slots

The hero uses the **same seven slots** as every chassis (§0):
**primary, secondary, armor, mobility, reactor, sensor, ability**.
No hero-only eighth slot is introduced: a second slot system would
mean a second compatibility table, a second loadout screen, and a
second set of balance questions, for no benefit the seven slots do
not already provide. Gear in each slot is a data row over the same
template idea as weapons (a baseline package plus modifiers), but
gear rows are **not** weapons and must never be equipped in a
weapon slot.

| Slot | What it changes (examples, PROPOSED) | Tier gating |
|---|---|---|
| Primary | Weapon row (§2). | Tier = hero tier (§3.5). |
| Secondary | Weapon row, lighter families only (§2.5). | Tier ≤ primary tier. |
| Armor | Max HP modifier (+10% / +20% / +30% by tier) and/or armour class step at tier 3 only (Medium → Heavy, PROPOSED, tier 3 only — an armour step at tier 1 would break the level-1 anchor). | Tier 1: levels 1–3, Tier 2: 4–6, Tier 3: 7+. |
| Mobility | Speed modifier (+0.5 / +1.0 / +1.5 tiles/s, PROPOSED) and/or forest movement cost reduction at tier 2+. | Same tier bands. |
| Reactor | Fire-rate modifier for energy weapons only (+5% / +10% / +15%, PROPOSED) — a reactor that boosted every weapon would be a mandatory pick, which is the universal-optimal-build failure §2.5 exists to prevent. | Same tier bands. |
| Sensor | Vision modifier (+1 / +2 / +3 tiles, PROPOSED) and weapon range +0 at tier 1–2, +1 at tier 3 (PROPOSED). | Same tier bands. |
| Ability | One skill from §3.5 equipped as the active ability, plus passive skill effects that are always on once unlocked. The ability slot holds the *equipped active*; passives do not consume it. | Skill level gates (§3.5). |

### 3.5 Skills, XP, levels, and upgrade paths

**Skills — a seed set of 8, not a hundred.** Each skill costs **1
skill point**. The player earns **1 skill point per level gained**
(starting at level 2). Each skill is single-rank (no rank trees in
Phase C — rank trees multiply the balance surface by the number of
ranks and are a later phase's proposal, not Phase C's). Level gates
are PROPOSED and are part of the tuning the freeze gate reviews.

| # | Skill | Type | Effect (PROPOSED) | Level gate |
|---|---|---|---|---|
| 1 | Dash | Active (Ability 1 by default) | Burst of speed: move at 2× speed for 0.4 s, cooldown 8 s. No invulnerability: dashing through fire still takes damage. | 2 |
| 2 | Salvage Sense | Passive | Wrecks the hero salvages are worth +25% (applied to the hero's salvage collection only, not the whole army's). | 3 |
| 3 | Overdrive | Active | +25% fire rate for 5 s, cooldown 20 s. | 4 |
| 4 | Field Repair | Active | Restore 60 HP to the hero, cooldown 30 s. Cannot exceed max HP. | 5 |
| 5 | Targeting Computer | Passive | +10% accuracy and +1 range on the primary weapon only. | 5 |
| 6 | Shockwave Slam | Active | Damage in a 2-tile radius around the hero (damage = primary damage × 1.5, PROPOSED), cooldown 25 s. Cannot damage structures (it is a melee shock, not siege). | 6 |
| 7 | Reinforced Frame | Passive | +15% max HP. Applied at match start from the hero's level/gear, not mid-match. | 7 |
| 8 | Rally Signal | Active | Allied units within 8 tiles gain +10% speed for 8 s, cooldown 30 s. It does not issue orders and does not override the red AI or player orders — it is a speed modifier only, so it cannot break the order system. | 8 |

By level 10 the player has 9 skill points (levels 2–10), enough for
all 8 skills with 1 point spare — the spare is intentional, so a
player who skips a skill is not punished by an unspendable point
and a player who takes all 8 is not forced into a "correct" build.

**XP sources (PROPOSED, final numbers open — §7).**

| Source | XP (PROPOSED) | Rule |
|---|---|---|
| Kill (hero lands the killing blow) | `floor(0.10 × victim's catalog scrap cost)`, minimum 10 | Only kills by the hero count. Army kills do not feed hero XP, or the hero would level by standing near a battle. |
| Salvage collected by the hero | 10 XP per wreck | Only wrecks the hero itself salvages. |
| Match win | +100 | Win bonus only, not per kill. |
| Match draw (Cycle 3 draw result) | +0 bonus | Kill and salvage XP from the match still count; the draw grants no win bonus. Confirmed consistent with the frozen Cycle 3 rule (draw is a declared result with its own panel, not a win or a loss). |
| Match loss | +25 | Participation, not punishment: losing a long match still progresses slightly. |
| Hero death | 0 XP lost | Death costs time and scrap via respawn (§4.2), never levels. De-levelling punishes the exact players who need progression most. |

**XP curve (PROPOSED table, final numbers open — §7).** Cumulative
XP required to reach each level. Increments grow by 100 per level,
which keeps the curve readable and the early levels fast enough to
feel rewarding without making level 10 a weekend's work or a year's.

| Level | Cumulative XP | XP since previous level | Illustrative pace* |
|---|---|---|---|
| 1 | 0 | — | Starting level. |
| 2 | 100 | 100 | ~1 short match. |
| 3 | 300 | 200 | ~1–2 matches. |
| 4 | 600 | 300 | ~2–3 matches. |
| 5 | 1,000 | 400 | ~3–4 matches. |
| 6 | 1,500 | 500 | ~5 matches. |
| 7 | 2,100 | 600 | ~7 matches. |
| 8 | 2,800 | 700 | ~9 matches. |
| 9 | 3,600 | 800 | ~11 matches. |
| 10 | 4,500 | 900 | ~14 matches. |

\*Illustrative pace assumes ~8 hero kills per match at ~28 XP average
(10% of a ~280-scrap average victim) ≈ 224 XP, plus salvage and the
win/loss bonus — roughly 300 XP per match. This pace is a sanity
check, not a promise: actual pace is measured in Phase C
playtesting and the curve is retuned there, not defended here.

**Upgrade paths — three, and only three, in Phase C:**

1. **Stats by level:** +5% max HP and +2% damage per level gained,
   **capped at +50% HP and +20% damage at level 10** (the cap is the
   guardrail; without it, level 10 is a different game from level
   1). Applied at match start from the stored level, never
   mid-match.
2. **Skills by skill points:** §3.5 table. Points are spent in the
   between-match loadout screen; spending is free to respec
   between matches (respec costs nothing in Phase C — charging for
   respec would punish experimentation, and there is no second
   currency to charge with, by design).
3. **Gear tiers by level:** Tier 1 gear at levels 1–3, Tier 2 at
   4–6, Tier 3 at 7+. Gear is unlocked by level alone — there is
   **no second currency** (no tokens, no shards, no premium
   currency) in Phase C. Level is the only persistent currency.
   This is deliberate: a second currency would need an economy,
   a store, and an anti-exploit story, none of which this feature
   needs to be good.

### 3.6 Persistence — where progression lives, and what it does not do

**Store:** a single versioned record in the browser's local storage
on the web build, and in the WebView's DOM storage in the APK
(DOM storage is already on in the APK — §0). Record key (PROPOSED):
`surfacewars.hero.v1`. The `v1` is the schema version: if a later
phase changes the record shape, it ships as `v2` with a migration
that reads `v1` and writes `v2`, never by silently reinterpreting
old fields.

**Record shape (Phase C):**

```
{
  "schema": 1,
  "level": <int 1..10>,
  "xp": <int, cumulative>,
  "skillPoints": <int unspent>,
  "skills": [<skill ids unlocked>],
  "loadout": { "primary": <weapon id>, "secondary": <weapon id or null>,
               "armor": <gear id>, "mobility": <gear id>,
               "reactor": <gear id>, "sensor": <gear id>,
               "ability": <skill id or null> },
  "heroEnabled": <true/false>,
  "matchesPlayed": <int>, "wins": <int>
}
```

**When it is written:** at match end (victory, defeat, or draw
panel shown), when skill points are spent, and when the loadout is
changed. **Never every tick, never mid-match for XP** — mid-match
writes would make a crashed or quit match half-progressed, which is
worse than losing that match's XP cleanly. Quitting to the main
menu mid-match earns **no** XP for that match; this is stated here
so it is a rule, not a bug report later.

**When it is read:** at the main menu, before a new match starts.
The hero starts the match in reserve (§3.2) with the stored level,
skills, and loadout applied, at full HP for that level and gear.
Changing the loadout mid-match is impossible (§2.6), so the stored
record cannot go stale during a match. Reserve/withdrawal state
itself is **match-session state, not stored state**: it is not
written to the record, and a hero withdrawn at low HP in one match
does not start the next match wounded — the next match starts in
reserve at full HP, because the record carries level, XP, skills,
and loadout, and no HP field.

**Corruption rule:** if the record is missing, unreadable, or fails
validation (unknown weapon/skill id, level outside 1–10, negative
XP), the game **resets to a level-1 hero with the starting loadout
and shows a plain notice** ("Hero progress could not be read, so it
was reset to level 1."). It never crashes, never blocks the main
menu, and never silently keeps a half-valid record.

**Limits, stated plainly (these are part of the design, not fine
print):**

- **Device-local only. No cloud sync, no account, no server.**
  Progress on the phone does not appear on the laptop, and vice
  versa. A player who switches devices starts at level 1 there.
- **Clearing app data (APK) or browser storage (web) loses hero
  progress permanently.** There is no recovery path in Phase C.
  The loadout screen must say this in one line, where the player
  can see it before investing ten matches — not buried in a help
  page.
- **No match save/load system is built here.** Skirmish matches
  remain save-free: only hero progression persists. A match that
  ends is over; its battlefield, scrap, and queues are never
  restored. Conflating "hero persists" with "matches save" would
  be a second feature wearing this feature's name, and it is
  explicitly excluded from every phase in §6.
- **Progression is never stored in `catalog.json`, game code, or
  sprite data.** It is player data in storage, separate from game
  data, so a game update never wipes it by replacing a file
  (within the same schema version) and a player-data reset never
  touches game data.

---

## 4. Balance guardrails

### 4.1 Caps that keep one persistent mech from trivialising skirmishes

1. **Level-1 anchor (§3.3):** a level-1 hero equals the unit it
   replaces. Any phase whose level-1 hero beats that anchor fails
   its freeze gate.
2. **Stat caps (§3.5):** +50% HP, +20% damage at level 10, hard
   caps, not curves that keep growing. A level-10 hero is a strong
   unit, not a second core.
3. **Gear tier bands (§3.5):** tier follows hero level, not match
   length. A long match does not unlock tier-3 gear; only levels do.
4. **One hero per match, one hero per player.** No second hero, no
   hero production from the core, no hero duplication via rally or
   groups. Under the reserve model (§3.2) the hero cannot be
   selected with a group at all while in reserve, and while it is
   on the field it is controlled alone: taking control of another
   unit withdraws the hero to reserve at the same moment (§1.1).
   The hero is controlled alone or not at all — enforced by
   withdrawal, not by a disabled button.
5. **Hero power is visible:** the hero's level badge is drawn on
   its sprite/HP bar (implementation detail for Phase B, but the
   requirement is here: a player facing a level-9 hero must be able
   to see that it is level 9, not discover it by dying to it).
6. **Freeze-gate comparison:** Phase B and Phase C each require a
   hero-on vs hero-off comparison over headless matches (same
   stand-in opponent, same maps) and report the swing. If hero-on
   wins every match the stand-in wins none of, the phase does not
   freeze — it retunes (starting point: lower the stat caps, not
   raise the opponent's stats, because raising the opponent
   punishes non-hero play too).

### 4.2 Hero death — the rule, and why

**Rule: hero death is NOT match loss.** Match loss remains what it
is today: losing all units and structures (in practice, losing the
Command Core and the army). The hero is a unit, not the core, and
making it the core would turn every hero death into a game over,
which would make players never risk the hero — the opposite of
what a twin-stick hero is for.

**Respawn rule (PROPOSED, unified with Drop Back In — §3.2):**
after death, the hero does **not** respawn automatically. It
becomes redeployable through the **Drop Back In** button once
**30 seconds** have passed and the player can pay **200 scrap**:
if the player has less than 200 scrap when the timer ends,
redeploy waits until the player can afford it (the timer does not
reset; the debt does not grow). Pressing Drop Back In then drops
the hero at the core-adjacent tile (§3.2) under twin-stick
control. The redeployed hero keeps its level, skills, and loadout
— death in one match never de-levels the hero (§3.5). While dead,
the hero's wreck remains on the field under the normal wreck
rules (152 scrap at full value, 120-second decay, salvageable by
either side). If the Command Core is dead, no redeploy is possible
at all (§3.2).

Why a cost and a timer, not free instant respawn: free instant
respawn would make the hero disposable (drive it into the enemy
base, die, repeat, with no consequence), and free respawn would
also make the wreck rule meaningless (why salvage a wreck when the
unit returns for free?). The 30-second timer plus 200 scrap is
roughly the cost of a medium unit's production time and a
significant fraction of starting scrap, so death hurts without
ending the match.

### 4.3 Twin-stick control vs the rest of the army — balance notes

- A manually controlled unit is **not stronger** than the same
  unit under RTS orders, except for the player's judgement: same
  speed, same weapons, same cooldowns, same damage (§1.2). Any
  twin-stick advantage comes from aiming and positioning, not from
  hidden multipliers. If playtesting shows twin-stick units
  systematically outperforming RTS units with the same loadout,
  the fix is to check for an input bug (for example firing while
  out of range or ignoring minimum range), not to add a twin-stick
  damage penalty — a penalty would make the mode feel broken.
- While the player drives one unit, the rest of the army is
  unmanaged (§1.1). That opportunity cost is the mode's real
  balance: a player who twin-sticks through an entire match will
  lose the production and positioning game to an opponent who
  manages their army. Twin-stick mode is a tool for a moment (a
  duel, a bridge defence, a hero push), not a replacement for RTS
  play, and the spec keeps it that way by removing production
  access while controlling (§1.1).

### 4.4 Interaction with the red combat AI (Cycle 2) and with Cycle 3

- **The red AI treats a manually controlled unit as a normal unit.**
  Its targeting (nearest, weakest, core-first, as implemented in
  `runAiCombat`) does not check whether a unit is player-controlled,
  does not focus fire on controlled units, and does not avoid
  them. The control flag is shell-side state; the sim AI must
  never read it. If a future AI change needs to know about control
  state, that is a new design decision, not an implementation
  detail — it would be the AI cheating by another name (knowing
  which unit has a human behind it).
- **The red AI does not get hero information beyond normal sim
  data.** It sees the hero's weapons, HP, and position exactly as
  it sees any unit's (the sim already exposes those fields to
  targeting). It does not read the hero's level, skills, loadout
  record, or XP. A level-9 hero is dangerous to the AI because its
  stats are higher, not because the AI is told to fear it.
- **Cycle 3 draw result:** if a match ends in a draw under Cycle
  3's deadlock rule, hero progression follows §3.5: kill and
  salvage XP from the match count, no win bonus, no loss bonus.
  The hero record is still written at the draw panel (§3.6).
  Nothing in this spec depends on Cycle 3's grace-period length or
  detection thresholds, and Cycle 3's rule (elimination stays
  win/loss; a core-alive air-only position never draws) is
  unchanged by hero play: a hero alive while its core lives does
  not prevent a draw, and a hero dead does not cause one.
- **Reserve hero and the red AI / detector (see §3.2 for the full
  rule):** a hero in reserve is not a field entity, so the red AI
  cannot target, damage, or count it, and Cycle 3's deadlock
  detector — which iterates field entities only — is unaffected
  by it: a reserve hero neither prevents a draw nor causes one,
  and a side with only a reserve hero and no field entities is
  eliminated, not deadlocked. A hero on the field counts exactly
  like any other field unit to both the AI and the detector.

---

## 5. What this spec deliberately does not include

- No new RTS movement system. Formations, groups, queues, patrol,
  guard, and rally already exist; twin-stick is an additional
  control layer for one unit, not a replacement movement model.
  (The request's phrase "larger troop movement abilities" is
  treated as context for the existing RTS layer, which twin-stick
  sits alongside — not as a second feature to design here.)
- No weapon pickup from wrecks, no mid-match refit, no per-unit
  loadout picker at production (Phase B scope, §2.6).
- No second currency, no store, no cloud sync, no accounts, no
  match saving (§3.5, §3.6).
- No new art in the spec phases: twin-stick and hero units reuse
  existing sprites-90 art (the hero reuses its chassis art; a
  distinct hero sprite, if wanted, is a later art pass, not a
  Phase A/B/C requirement — the spec must not block on art that
  does not exist yet).
- No tutorial for twin-stick mode in Phase A. A twin-stick tutorial
  step is a later addition once the mode itself is proven; Phase
  A explicitly hides twin-stick entry in the tutorial (§1.1).
- No multiplayer, campaign, fog of war, research, or structure
  placement changes. Those are separate features with their own
  specs; this document does not smuggle them in through the hero.
- No hero for the red AI in any phase. The red AI commands its
  army as today; a red hero would be a mirror feature with its own
  balance questions, not a free symmetry.
- No autonomous hero in any phase. The hero never fights, idles,
  or follows orders on the field without the player driving it
  (§3.2): it is in reserve, under twin-stick control, or dead.
  An "AI-driven hero" would be a second AI feature wearing this
  feature's name, and it is explicitly excluded.

---

## 6. Phased build plan (generation loop, per phase)

Each phase follows the same loop used by Generation Cycles 1 and 2:
inventory → specify (one testable sentence) → separate (in/out of
scope, with at least one liked item excluded) → seed (one reusable
primitive, proven) → govern (written end condition) → populate →
steward (stable names, tests, and a real counterpart: the test
suite plus a headless playthrough) → freeze (stop at the end
condition, review against the spec sentence, lock a baseline with
a changelog entry, defer everything else to the next phase's
inventory). A phase that misses its spec sentence does not freeze
by rewording the sentence after the fact; it retunes or it does
not ship.

### Phase A — Twin-stick control for any selected unit

- **Spec sentence:** "Any selected player unit with a weapon can
  be taken over with twin sticks and released back to RTS orders
  without stuck orders, on phone landscape and desktop."
- **In scope:** twin-stick entry/exit (§1.1), phone stick zones and
  control strip (§1.3), desktop WASD + mouse scheme (§1.4),
  camera follow and minimap lock (§1.2), death exit (§1.2),
  pause/menu behaviour (§1.5), multi-touch pointer handling
  (§1.3), CONTROLS.md update, headless playthrough.
- **Out of scope (including liked items):** hero mech, loadout
  changes, gear, skills, XP, persistence, new weapons, new art,
  tutorial changes (entry hidden in tutorial), mid-match refit,
  unit-to-unit collision, ammunition system.
- **Seed:** the control-state machine (enter → control →
  release/death) plus the stick-to-velocity/aim mapping. The same
  seed serves the hero in Phase B and every unit in Phase A; if
  the seed only works for one unit type, it is not a seed.
- **Freeze gate:** tests for enter (single unit / multi-select
  disabled / unarmed disabled / structure excluded), exit (hold
  order, cleared path and queue, fresh order accepted), death
  exit (camera on death tile, wreck created), pause preservation,
  terrain blocking (ground cannot enter water/rock), weapon
  cooldown/range/minimum-range/line-of-sight reuse, multi-touch
  (two sticks + ability tap simultaneously); a headless
  playthrough that drives a unit, fires, releases, and re-orders
  it; CONTROLS.md updated; changelog entry written. All existing
  tests still pass.
- **Must NOT be built in this phase:** anything with the word
  "hero", "level", "XP", "skill", "loadout", or "persist" in it,
  except the sentence in CONTROLS.md saying those are later
  phases.

### Phase B — Hero mech + loadout + gear

- **Spec sentence:** "The player's default starting mech starts in
  reserve in place of one starting unit and drops back into the
  field on demand with Drop Back In, with a between-match loadout
  over the seven catalog slots, using the twelve family templates
  and the named-weapon data rows."
- **In scope:** Command Mech reserve model and Drop Back In button
  (§3.2: presence state table, drop location, telegraph,
  cooldowns, both redeploy paths, elimination/detector rules),
  hero toggle in Settings (default ON, PROPOSED), loadout screen
  (main menu, between matches only), the 12 family baselines +
  123 named rows (§2), compatibility validator with reasons
  (§2.5), gear rows for armor/mobility/reactor/sensor slots
  (§3.4), hero level badge display, hero wreck value (152 scrap
  at full value), hero redeploy rule (§4.2, via Drop Back In) at
  level-1 stats, headless hero-on vs hero-off comparison (hero in
  reserve at start, dropped in on demand), CONTROLS.md + tracker
  update.
- **Out of scope (including liked items):** XP, levels above 1,
  skills, persistence (the hero is level 1 with the chosen loadout
  every match in Phase B — progression is Phase C, and Phase B
  must not half-build it by storing a level it never changes),
  mid-match refit, per-unit production loadout picker, cloud,
  match saving, distinct hero art (reuse chassis art).
- **Seed:** the weapon template (§2.2) plus the loadout data file
  (families + named rows + gear rows). The seed is proven when a
  new named row can be added by writing one row (name, family,
  tier, modifier, special) and passing validation, without touching
  sim code.
- **Freeze gate:** tests for roster replacement (opening field
  count 9v10 with hero in reserve, scrap unchanged), reserve
  state (hero absent from field entities; no field presence in
  RTS mode or while controlling another unit), Drop Back In
  (button in both placements, every §3.2 disabled reason,
  core-adjacent drop location via production spawn logic, 2 s
  telegraph with no action and no damage during it, marker
  visible), withdrawal (exact HP kept, no wreck, no scrap, no
  XP), voluntary redeploy cooldown (10 s PROPOSED), death
  redeploy (30 s + 200 scrap + wait-if-broke, via Drop Back In,
  no automatic respawn), core-dead blocks both redeploy paths,
  defeat with a healthy hero in reserve (match still ends),
  deadlock detector unaffected by a reserve hero (draw still
  fires on a deadlocked field; reserve-only side is eliminated,
  not deadlocked), slot validation (every §2.5 rejection, with
  reasons), tier bands, secondary-tier rule, hero toggle off
  (original roster restored, no hero, Drop Back In hidden),
  wreck value, hero-on vs hero-off comparison reported (hero in
  reserve at start, dropped in on demand — not hidden if it is
  close); headless playthrough that edits a loadout, starts a
  match, drops the hero in, controls it, withdraws it, drops it
  again, dies, and redeploys via Drop Back In; changelog entry.
  All existing tests still pass.
- **Must NOT be built in this phase:** XP/levels/skills,
  persistence storage, a second currency, mid-match refit.

### Phase C — Progression persistence + skills + upgrades

- **Spec sentence:** "Hero level, XP, skills, and gear unlocks
  persist across matches on the same device and survive app
  restarts, with no match save/load and no cloud."
- **In scope:** versioned progression record (§3.6), XP sources
  and curve (§3.5), the 8-skill seed set with level gates and
  skill-point spending (§3.5), gear tier unlocking by level
  (§3.5), stat caps (§4.1), corruption reset with notice (§3.6),
  device-local-only notice in the loadout screen (§3.6),
  loadout-screen respec (free, between matches), headless
  two-match playthrough (earn XP in match one, verify level/skills
  applied in match two), CONTROLS.md + tracker update.
- **Out of scope (including liked items):** cloud sync, accounts,
  second currency, paid progression, match saving, skill rank
  trees, hero for the red AI, distinct hero art, twin-stick
  tutorial (still a later addition).
- **Seed:** the progression record plus pure XP/level functions
  (XP for a kill/salvage/win, level from cumulative XP, skill
  gating from level + points). Pure functions are testable
  without a browser or storage, which is why they are the seed
  and the storage adapter is not.
- **Freeze gate:** tests for every XP source (including minimum
  10 XP, draw = no win bonus, quit mid-match = no XP), the full
  curve table (levels 1–10), skill gates and point spending,
  tier bands, stat caps, corruption reset (invalid record →
  level 1 + notice, game still loads), restart persistence
  (write, reload from storage, verify — via a storage mock in
  tests and a real restart in the playthrough); a two-match
  headless playthrough; changelog entry. All existing tests
  still pass.
- **Must NOT be built in this phase:** anything that syncs,
  charges, or saves a match. If a proposal needs a server, an
  account, or a payment, it belongs to a later phase with its own
  spec and its own user decision — not to Phase C.

**Phase order is a dependency, not a preference.** Phase B needs
Phase A's control seed (the hero is twin-stick driven). Phase C
needs Phase B's loadout and gear (progression applies to a loadout
that exists). Skipping Phase A to "just build the hero" would mean
building the hero's control twice, and skipping Phase B to "just
add levels" would mean levelling a loadout that does not exist.
If a phase is cut, the phases after it are cut with it, and the
spec says so rather than pretending otherwise.

---

## 7. Open decisions for the user (NOT invented here)

These are decisions only the user can make. The spec proposes
where a proposal is useful, but a proposal is not a decision, and
a build must not treat it as one.

1. **Hero mech final name.** Placeholder "Command Mech" is used
   everywhere until decided. Proposal: none — naming is the
   user's call, and a placeholder that looks final is how a
   placeholder ships.
2. **Starting weapon.** PROPOSED: Twin-Bore Autogun (Autocannon).
   Alternatives from the same family that fit a starter: Scrap
   Salvager's Nailgun (cheap, flavourful for a salvage game) or
   Coil-Feed Carbine (accurate bursts). The decision also sets the
   hero's early feel; it is not a cosmetic choice.
3. **XP curve numbers.** PROPOSED: §3.5 table (100 / 300 / 600 /
   1,000 / 1,500 / 2,100 / 2,800 / 3,600 / 4,500 cumulative) with
   kill XP at 10% of victim scrap cost. Faster or slower curves
   are both defensible; the freeze gate in Phase C measures
   actual pace and retunes, but the target pace ("about how many
   matches to level 10?") is the user's call.
4. **Mid-match loadout changes.** PROPOSED RULE: no (§2.6), with
   the price for changing that rule stated (scrap cost + time at
   the core + unit out of action). If the user wants refit, Phase
   B's freeze gate must be re-scoped before building, not patched
   after.
5. **Persistence store.** PROPOSED: device-local only (§3.6).
   Cloud sync later would need an account/store decision, a
   conflict-resolution rule (which device wins), and a privacy
   note — none of which are designed here, deliberately.
6. **Hero mandatory vs optional.** PROPOSED: default ON with a
   Settings toggle (hero off = original 10v10, no hero XP that
   match). If the user wants the hero mandatory, the toggle is
   deleted from the spec before Phase B — not left in as a dead
   option.
7. **(Consequence of 5) Data-loss notice wording.** The loadout
   screen must warn that clearing app data loses progress. The
   exact wording is a user decision if the user wants softer or
   stronger language; the existence of the warning is not
   optional.
8. **Voluntary redeploy cooldown value.** PROPOSED: 10 seconds
   (200 ticks) from withdrawal (§3.2). Shorter makes withdrawal
   nearly free (escape any bad fight, drop straight back in);
   longer makes a mistaken withdrawal punish a whole engagement.
   The number is a feel question for playtesting, not a tuned
   final.
9. **Drop telegraph duration.** PROPOSED: 2 seconds (40 ticks)
   (§3.2). Longer gives the enemy more warning but also more
   dead time for the player; shorter makes the drop feel instant
   and the marker pointless. The duration is a feel question for
   playtesting.
10. **Voluntary redeploy scrap cost.** PROPOSED: free (§3.2).
    Rationale: the cost of withdrawing is field absence plus the
    cooldown, not scrap; charging scrap would double-charge a
    player who already paid by losing the hero's presence, and
    would make withdrawal a rich-player-only escape. Death
    redeploy keeps the 200 scrap cost (§4.2) — the two paths are
    deliberately priced differently, because death already cost
    a wreck to the enemy.
11. **Drop-marker visibility to the red side.** PROPOSED: yes, the
    marker is visible to both sides (§3.2). Rationale: the game
    has no fog of war, so a hidden marker would be hidden
    information in a no-fog game, and the marker is not a target
    in any case (the hero is not an entity during the telegraph).
    If the user wants the marker hidden from the red AI's
    display (not its targeting, which cannot select a
    non-entity), that is a rendering decision for Phase B, not a
    targeting one.

---

## 8. Risks, honestly stated

1. **Stick zones vs side panel vs minimap (the top risk).**
   Landscape gives the game a 300 px side panel and a 192×120
   minimap inside it; twin-stick mode needs two large thumb zones
   plus buttons. The mitigations in §1.3 (canvas-only zones,
   collapsed control strip, minimap input disabled while
   controlling, ≥ 44 px buttons, dynamic origin, deadzone) are
   specified, but they are untested on a real phone — headless
   emulation cannot prove thumb ergonomics. Phase A must be
   played on a real device before it freezes, and if the zones
   collide with the panel in practice, the phase retunes the
   zones (for example narrowing the control strip while
   controlling) rather than shipping a collision.
2. **Portrait degradation.** Twin-stick in portrait squeezes the
   map between stick zones and a bottom strip. The spec supports
   portrait (§1.3) but recommends landscape; a player who only
   plays portrait will have a worse twin-stick experience, and
   that must be visible in the mode's description, not discovered
   by frustration.
3. **Persistence loss.** Device-local storage means clearing app
   data, uninstalling, or switching devices loses hero progress
   with no recovery (§3.6). This will generate the exact support
   complaint the notice is meant to pre-empt; the notice reduces
   it, it does not eliminate it. Cloud sync would fix it and
   would cost an account system — that trade is the user's
   decision (§7.5), not an engineering afterthought.
4. **Hero power creep vs the RTS economy.** A persistent mech
   that grows across matches fights an economy tuned for
   symmetric 500-scrap starts. The guardrails (§4.1: level-1
   anchor, stat caps, tier bands, respawn cost, wreck value,
   hero-on vs hero-off comparison) are the defence, but they are
   only as good as the comparison matches. If Phase B or C
   playtesting shows hero-on matches skewing heavily, the honest
   response is to lower the caps — not to buff the red AI, which
   would punish players who toggle the hero off.
5. **Twin-stick skill gap.** A player who drives well will beat
   the same loadout driven by RTS orders, because aiming and
   positioning are skill. That is intended (§4.3), but it means
   twin-stick balance cannot be judged from AI-vs-AI matches
   alone: Phase A needs human playtesting (the user's own
   playtesting, on a phone, is the counterpart the loop requires
   for this feature in a way it did not for maps or AI).
6. **Scope creep through the weapon list.** 123 named weapons
   invite 123 special cases. The template (§2.2) and the closed
   special list exist to stop that: any named weapon that needs a
   new special, a new damage type, or a new target class is a
   scope decision, not a data row. If the list grows beyond 123
   in a later phase, it grows by adding rows to a validated file,
   not by hand-editing sim code per weapon.
7. **Two parallel tracks — now resolved.** This spec was written
   while Cycle 3 changed endgame rules. That cycle has since frozen
   (2026-10-31 ~05:01 PDT) and §4.4's draw-XP rule was re-checked
   against the frozen rule before delivery: draw = +0 bonus, kill
   and salvage XP still count, record written at the draw panel.
   Phase C builds on the frozen rule, not on the pre-freeze brief.
8. **Performance on the phone.** Twin-stick firing at high fire
   rates (for example the Scrapstorm example at 4 shots/second)
   plus a full RTS battle must not allocate per shot (§1.2) or
   the phone will pay for it in garbage collection. The pooled
   projectile constraint is in the spec for this reason; Phase A
   testing must include a sustained-fire frame check, not just a
   correctness check.

---

## Appendix: traceability

| Claim in this spec | Source |
|---|---|
| 12 weapon families, no individual names in RTS §8 | Design doc §8 table (Autocannon, Heavy Cannon, Missile Launcher, Rocket Artillery, Railgun, Mortar, Flamethrower, Anti-air Cannon, Laser, Siege Cannon, Melee Weapon, Electronic Warfare). |
| 123 named weapons: 32 + 30 + 34 + 12 + 15 | Design doc Expansion §1: ballistic groups 10 + 10 + 12 = 32; energy groups 10 + 10 + 10 = 30; melee list 34 names; biological/chemical numbered 19–30 = 12; experimental numbered 31–45 = 15. Total 123. |
| 63 named expansion mech chassis | Design doc Expansion §2: Bulwark-class 8 + Vespid-class 8 + Longshot-class 8 + Striker-class 8 + additional families 31 = 63. (Recorded for context; the hero uses an RTS §7 chassis, not an expansion chassis, in this spec.) |
| 8 core chassis + 7 slots each | Design doc §7 (Scout, Lancer, Bulwark, Longshot, Rampart, Vespid, Scrapjack, Warden; primary, secondary, armor, mobility, reactor, sensor, ability) and `data/catalog.json` chassis entries. |
| Weapon required properties | Design doc §8 (damage, range/min-range, projectile speed, interval/burst, accuracy, damage type, splash/falloff, reload/ammo, power/heat, target classes, line of sight, terrain collision, feedback, AI preferences). The template in §2.2 is that list, trimmed to fields the current sim actually uses plus `powerCost` reserved. |
| Catalog: 49 units, 23 structures, 19 weapons, 6 armour classes, 6 damage types | `data/catalog.json` (counted programmatically). The 19 weapons are Prototype 01 family modules, not a design-document count — see §0. |
| Starting scrap 500 both factions; salvage 40%, 120 s, 1.5 tiles; 20 ticks/s; AI think 20 ticks; queue cap 3; per-type cap 3; AI salvage range 15 | `game/sim.js` constants. |
| Tap ≤ 8 px; mouse drag selects, touch drag pans; minimap click/drag; buttons ≥ 44 px; zoom 0.4×–3×; tile 32 px | `game/game.js`, `game/view.js`, `game/CONTROLS.md`. |
| Landscape side panel 300 px; minimap 192×120 landscape, 132×83 portrait; panels scroll, max 64 vh landscape | `game/CONTROLS.md` (landscape-first section), `game/index.html`. |
| Maps 80×50; cores (6,25) / (73,25); 10v10; west roster includes `lancer_mech` | `game/maps.js` (`spawnFirstMapScenario`, `spawnSecondMapScenario`). |
| Sim runs only with no menu open and no winner; tutorial holds red | `game/game.js` (`simRunning`, tutorial flag). |
| APK WebView: JavaScript + DOM storage on; landscape locked | APK reports (`apk/APK-REPORT-1.3.md` and predecessors). |
| Red AI: defend/gather/attack/fall-back, same economy, no free units/scrap | `game/sim.js` `runAiCombat` / `runAiEconomy`, Generation Cycle 2 report. |
| Cycle 3 (frozen 2026-10-31 ~05:01 PDT): deadlock detection + draw result; no weapon changes; elimination stays win/loss; core-alive air-only never draws; grace 600 ticks; tutorial excluded | `game/GEN-CYCLE-3-REPORT.md` (tests 116/116). Re-checked against this spec's §4.4 draw-XP rule before delivery — consistent. |
| Hero presence model (amendment 2026-10-31): reserve by default, Drop Back In redeploy, field entities only for elimination/detector | User rule, stated verbatim in the amendment task; no prior game source — this is new behaviour, not a reading of existing code. Its consistency anchors (field-entity iteration in `checkDeadlock` and elimination, `spawnPosition` ring search around the core) were verified in `game/sim.js` before writing §3.2. |

*End of spec. No game code, no publishing, no APK action was taken or
is authorised by this document. Implementation requires a separate
build authorisation per phase in §6.*
