# Surface Wars — Controls (authoritative, mobile-first finish + tutorial)

## Tutorial (new — first tap from the main menu)

**Tutorial** on the main menu (and a "Start the Tutorial" button at the
bottom of How to Play) runs the First Map with the red side HELD: the
red AI combat and the red AI economy are both gated on
a tutorial flag that exists only in tutorial games, so the player is
never attacked while learning. Seven steps, each one sentence, each
with a pulsing yellow ring on the thing to tap, each auto-advancing on
the correct action, each with visible **Skip** (back to main menu) and
**Next** (advance without doing the action) — no step traps the
player. While it runs, a persistent banner states the step AND what
the next tap will do in plain words ("Next tap: tap a blue unit").
Steps: 1 Look around (pan or zoom) · 2 Select (tap a blue unit) ·
3 Move (tap open ground, path draws) · 4 Attack (tap the held red
target near the player's base — an unarmed salvage_team that cannot
shoot back, placed out of every blue base unit's auto-engage range so
it survives until tapped) · 5 Build (tap the Command Core, queue a
Scout Buggy, watch it spawn) · 6 Salvage (a wreck placed near the
player's base at tutorial start, 32 scrap decaying over 120 s; select
a unit, tap the wreck, scrap gained) · 7 How to win (screen with Play
a real game / Back to menu). Two tutorial-only presentation rules:
the info panel collapses to name + HP + Close while a step has a map
target (the full panel covers ~70% of the short phone canvas and used
to sit on top of the tap point — see TUTORIAL-REPORT.md), and entering
the salvage step clears the selection so the build panel closes.
Entering the salvage step also refreshes the tutorial wreck to full
value and a full 120 s (wave-2 fix of a beta wave-1 gap: the wreck
decayed from match start, so a slow player reaching the step late
found it expired and the by-doing path broken). Info and wreck
panels refresh live as HP, wreck value, and time left change
(wave-2 fix of beta wave-1 BUG-LOW-2: they used to freeze at the
values they opened with).
Normal games are unaffected: the flag is set only by the Tutorial
button, cleared by Skip / Back to menu / Play a real game, and
Restart inside a tutorial restarts the tutorial, not a live game.

## Tutorial II — Twin-Stick & Hero (new — second tutorial, main menu)

**Tutorial II — Twin-Stick & Hero** on the main menu (and a "Start
Tutorial II" button at the bottom of How to Play) is a second,
separate tutorial: it never replaces or reorders tier 1. It runs the
First Map with the red side HELD exactly like tier 1 (the same
`state.tutorial` sim gate holds the red AI economy and combat), but
the hero starts in reserve (9v10 opening) exactly as in normal hero
play — tier 1 never gets a hero, tier 2 always does. Six steps, each
with visible **Skip** (back to main menu) and **Next** (advance
without doing the action) on every in-match step, each
auto-advancing on the real action, each with a pulsing yellow ring
on the thing to tap next. Steps: 1 Take Control (tap a blue unit,
then Take Control) · 2 Drive (left stick, or WASD on desktop;
advances when the controlled unit has moved more than 1.5 tiles
from where the step started) · 3 Aim and fire (aim at the held red
target and hold fire until it is destroyed — the target is an
unarmed salvage_team at (28,25), the same proven placement as tier
1: 19 tiles from the blue longshot, range 18, and 14 from the
nearest other blue unit, range 7, so no non-controlled blue unit
can auto-engage it and only the controlled unit's manual fire can
kill it) · 4 Release Control (advances only on the real release
transition: the unit was controlled last frame, is not controlled
this frame, is still selected, and holds a hold order — the sim's
release order) · 5 Drop Back In (reserve → 2-second telegraph →
landing already-controlled; advances only when the player is
controlling the field hero, not on the drop press alone) · 6
Premium Store (screen: Open Premium Store opens the store panel
for viewing only — no step ever requires a purchase — Finish is
the Next-equivalent, Play a real game starts a normal First Map
match). Cleanup mirrors tier 1 exactly: Skip / Back to menu / Play
a real game clear the tier-2 flag and the held-red flag, and
Restart inside tier 2 restarts tier 2 from step 1 with a fresh
held-red scenario and a hero back in reserve. Implementation note
for future editors: tier 2 deliberately uses its own `tutorial2`
object, not the tier-1 `tutorial` flag, because tier 1's flag hides
Take Control and the drop buttons — reusing it would hide the very
controls tier 2 teaches. While controlling, the camera follows the
controlled unit and panels are suppressed (same as normal
twin-stick play); on phones the aim step has a narrow window, since
the target only becomes visible once it is within the phone view
width while still outside the weapon's minimum range — desktop
proof is comfortable, a real-phone pass of the aim step is still
owed (same standing limit as tier 1's drag-pan note).

## New in this version — 8 mechs, mastery, Salvage Credits store (new)

Iron Eden (blue, the player's side) gains four producible mechs,
built from the Command Core like any other unit: Bastion (heavy
frontline anchor, 480 scrap), Gatekeeper (laser skirmisher, ground
and air, 380), Deadeye (precision fire support, range 14 with a
3-tile blind zone and no air targeting, 460), Mortarjack (mobile
indirect fire over obstacles, 340). Xandria (red) gains four:
Needlewing (fast scout-striker, 140), Longsight (vision-13
spotter, 140), Javelin (mobile assault, 320), Raptor (close
assault, melee range 1.2, 300). Every new mech's counter is in its
unit description. Wreck art exists for all 8 now (team-neutral
scrap, same convention as the other 49 unit wrecks), so a destroyed
new mech leaves a salvageable wreck instead of drawing nothing.
Hero mastery: level still caps at 10; past 10, mastery ranks M1–M5
at 5500 / 6800 / 8300 / 10000 / 11900 total XP each grant one skill
point at match end, and grant no stats, gear, or second ability.
Salvage Credits (Premium Store, main menu only): earned at match
end only — win 120, draw 60, loss 30, plus 10 per hero killing blow
up to 10 kills; quitting mid-match earns nothing, and a match with
the hero toggled off earns nothing. Packs cost Salvage Credits
only. Real-money purchases: not live — no checkout, no
real-currency price, no payment provider. A pack never used in a
match refunds in full; a pack used in a match (a match started
with its loadout equipped) cannot be refunded; equipping never
bypasses hero level tier gates. Tutorial games are exempt from
both sides of that rule: starting either tutorial with a pack
equipped never marks it used, and a tutorial game reaching a
terminal panel grants no hero XP and no Salvage Credits (Wave 6
fix of the Wave 5 note — tier 2 used to mark a pack used, because
it runs the hero branch to teach Drop Back In). The main menu carries a "New in
this version" line listing exactly these content additions.

## New in v1.8 — grouped menus, touch Select mode, next-tap feedback line (UI/input only)

No mechanic, balance, AI, map, cost, stat, or save-format change. Everything
below is menu grouping, input, or wording:

- **Main menu is sectioned, same screen, same taps.** Play (all four maps),
  Difficulty (Easy / Normal / Hard + status line), Learn (Tutorial,
  Tutorial II, How to Play), Customize (Hero Loadout + hero status lines),
  Store (Premium Store + wallet lines), Settings. Every pre-existing entry
  is still on the same screen — grouping adds headings, not navigation.
- **Pause menu is sectioned the same way.** Match (Resume, Restart Map),
  Switch map (all four maps), Options (Settings, Quit to Main Menu).
  Every action kept, sim still frozen while open.
- **Command tray gains a "View & selection" overflow row.** Paths, Minimap,
  Pan, Select, Add Select live there, always visible — never behind the
  More commands toggle. The primary order row (Move, Attack-Move, Hold,
  Patrol, Salvage, Guard, Take Control, Drop Back In, Queue, Stop /
  Deselect, Select All, Pause / Menu, Menu) is unchanged and always
  visible; groups, map buttons, and zooms stay in the More row.
- **Touch Select mode (new toggle, default OFF).** The touch mirror of
  mouse Pan mode: when Select is ON, a touch drag draws a selection
  rectangle instead of panning. Default stays pan-on-drag, so nothing
  changes unless the player opts in. The drag rectangle is now DRAWN
  (dashed yellow + translucent fill) for mouse and touch — before v1.8
  a drag-select drew nothing and the player dragged blind.
- **Feedback line always states what the next tap will do.** The line
  under the map now shows one plain sentence for the current mode,
  selection, and toggles (same pattern as the tutorial banner) — e.g.
  Hold states its tap-falls-back-to-Move behaviour in words, Patrol
  states first/second point, Rally states the rally tap. Transient
  messages (group assigned, rally set, ability used) still show for
  3 s, then the hint returns. Modes themselves are unchanged — only
  what the UI tells the player.
- **Tap fall-through fix.** The panels strip no longer eats map taps:
  the strip itself passes pointer events through to the canvas and only
  the panels take them. Before v1.8 the 18 px feedback strip at the
  bottom-left sat over the canvas (and inside the left twin-stick zone)
  and swallowed every tap/stick touch that landed on it.

## Landscape-first layout (new — landscape is the primary layout)

Landscape is now the primary layout; portrait still works exactly as
before and is never blocked. The shell is a flex column filling the
viewport (100dvh): compact top bar, then a layout row/column. In
landscape (width > height) the layout is a row: the map canvas takes
the large left area and the command panel is a vertical, scrollable
side panel on the right (300 px wide). The order row (Move,
Attack-Move, Hold, Patrol, Salvage, Guard, Queue, Stop / Deselect,
Select All, Pan, Add Select, Pause / Menu, Menu) sits at the top of
that panel and is always visible — it is never buried behind the More
commands toggle, which is hidden in landscape and whose extra row
(Groups, maps, zoom, Paths, Minimap) is forced visible. The minimap
grows to 192 × 120 px in landscape (from 132 × 83 px in portrait) and
still taps to centre and drags to pan. The top bar stays compact in
landscape (the sprite note is hidden there; it lives in How to Play),
so the stage keeps its height. Tutorial banner, info/build panels,
menus, and settings all fit the short landscape height (~390 px on a
phone): panels scroll within the viewport (max 64 vh in landscape)
and stay dismissible with a visible Close panel button; overlays
scroll within 92 dvh.

Canvas resize on orientation change: the canvas backing size is set
from the stage element (never a hardcoded size), and re-set on window
resize, on tray toggle, on page load, and — new in this pass — on
`orientationchange` after a short delay, because that event can fire
before the viewport dimensions settle on phones. The tray class is
synced on orientation change only (landscape forces it expanded,
phone-width portrait restores it collapsed); it is deliberately NOT
synced inside `resize()`, or collapsing the tray in landscape would
immediately re-expand it. The stale-canvas bug from the mobile-first
finish (backing size not following the stage, map stretched, taps
misaligned) does not return: this pass verified canvas backing ==
stage size in portrait, landscape, and portrait again on the same
page. Pure layout helpers in `view.js` (`isLandscape`,
`layoutFor`) encode this contract and are unit-tested; a square
viewport counts as portrait (the bottom-tray fallback).

Portrait fallback: the portrait layout is unchanged (bottom tray,
tray starts collapsed at phone width, More commands toggle visible).
In portrait only, a small pill at the top-left of the stage says
"Rotate for the full battlefield view" with a "Continue in portrait"
button. It is non-blocking by construction: the pill itself ignores
pointer events (only its dismiss button takes them), so it can never
block a map tap; dismissing it hides it for the rest of the session
(sessionStorage), and it never reappears after dismissal in that
session. It never gates playing in portrait, never blanks the screen,
and never forces rotation. The web build does NOT lock orientation:
the Screen Orientation API cannot lock reliably outside
fullscreen/installed contexts, so no lock is attempted — the installed
app's lock is an APK manifest change, documented in
LANDSCAPE-REPORT.md, and is a separate build step.

## Mobile-first layout (portrait; see Landscape-first above for landscape)

The shell is a flex column filling the viewport: compact top bar, the
map canvas taking exactly the remaining height (its backing size is
set from the stage element, and re-set whenever the command tray
expands or collapses — a stale canvas size used to stretch the map and
misalign taps with what was drawn), and a bottom command tray.

- **Command tray:** the order row (Move, Attack-Move, Hold, Patrol,
  Salvage, Guard, **Queue**, Stop / Deselect, Select All, Pan, Add
  Select, Pause / Menu) is always visible. **More commands** expands or
  collapses the second row (Groups 1–9 + Assign, Reset Map, First/Test
  Map, Zoom presets and +/−, Zoom to Selection, Paths, Minimap). On
  phone width (≤ 640 px) the tray starts collapsed; on desktop it
  starts expanded. The toggle is always visible, so nothing essential
  is hidden without an affordance.
- **Touch targets:** every button is at least **44 px tall** (group
  number buttons are 44 × 44 px). Settings checkboxes are 22 px.
- **Top bar on phone:** the title shortens to "Surface Wars", the
  sprite note is hidden (it lives in How to Play), and the status bar
  condenses to `Scrap | Blue | Red | Tick | Zoom | Mode` (plus
  `(Queue)` when Queue mode is on) — the current mode is now visible
  on the phone top bar too (short name: Move, Atk-Move, Hold, Patrol,
  Salvage, Guard), so a tap's meaning is never invisible. The full
  status line stays on desktop.
- **Minimap on phone:** 132 × 83 px, tap to centre, drag to pan, and a
  **Minimap** button (also in Settings) hides or shows it.
- **Panels on phone:** info and build panels scroll within the
  viewport (max 46 vh) and each has a visible **Close panel** button
  (deselects everything, which also closes the build panel). Menus
  and How to Play scroll within 92 dvh and have Back/Resume buttons.
- **Panels cover map:** info/build panels sit over the lower map, so
  a map point under an open panel cannot be tapped until the panel is
  closed (Close panel, or Stop / Deselect). That is the documented
  flow, not a bug — but it is why the verification script closes the
  panel before tapping the core.

## Keyboard controls and their on-screen equivalents

No control is keyboard-only silently. Every key has a button, or is
marked desktop-only with a reason.

| Key | Does | On-screen equivalent |
|---|---|---|
| `Esc` | Close settings/howto, resume pause, or open pause | Pause / Menu button, Menu button, Back/Resume buttons |
| `Space` | Open/resume pause menu | Pause / Menu button |
| `Ctrl+1..9` | Assign group | Assign Group toggle + number button 1–9 |
| `1..9` | Recall group | Number button 1–9 |
| `+` / `=` | Zoom in | Zoom + button |
| `-` | Zoom out | Zoom − button |
| `0` | Reset zoom to 1× | Zoom 1× button |
| `F` | Zoom to selection | Zoom to Selection button |
| `P` | Toggle paths | Paths button |
| `Shift+tap` | Append order to queue | **Queue button** (see below) |
| Wheel | Zoom to cursor | Pinch on touch; Zoom +/− and presets on screen. Wheel itself is desktop-only by nature (no wheel on a phone) — it is not a hidden control, it is a mouse gesture, and it was verified working at desktop viewport in this finish |
| Pinch | Zoom to pinch midpoint | Zoom +/− and presets on screen. Pinch is touch-only by nature; its two-pointer handler is unchanged from Prototype 03 and could NOT be driven in this sandbox emulation (see Known limits) |

## Queue mode (touch Shift)

**Queue button** (order row, or `Shift+tap` on desktop) appends orders
instead of replacing them. Unlike a held Shift key, Queue mode **stays
on until tapped again**, so several waypoints can be queued in a row on
touch. The status bar shows `(Queue)` while it is on, the button shows
its active state, and the feedback line explains it on toggle. It uses
the same sim append logic as Shift (`View.queueAppend`, unit-tested):
either Shift or Queue mode appends, neither replaces. Queued paths
draw as one connected line, as before.

**Tap fall-through guard (found in this finish, fixed):** a tap that
opens a panel could trigger a button inside that panel — the browser's
mouse-compatibility click for the same tap lands after the panel
renders under the tap point. In emulation this queued a Vespid Scout
nobody ordered. Panel buttons now ignore clicks within 350 ms of a
canvas tap or of the panel first appearing. A genuine second tap is
always later than that, so real taps are unaffected; the verification
run after the fix shows an empty queue at panel open and a Scout
Buggy queued only by its own tap (scrap 500 → 420).

This document is the authoritative control reference for Surface Wars.
The in-game help text in `index.html` and the How to Play panel match
this document. Anything marked NOT IMPLEMENTED is not in the game — it
is listed so nobody assumes it works.

You play Iron Eden (blue). Xandria (red) fights with a real combat AI
doctrine (Generation Cycle 2, see Economy) and the same scrap economy
you have: starting scrap, Command Core production, and salvage.
Prototype 02 added the first real economy player-side only;
Prototype 03 extends it to the red side sim-side, and Cycle 2 replaces
the old browser attack-move trickle-driver with sim-side combat
decisions, so the game is playable against an opponent that defends,
groups up, attacks, rebuilds, and falls damaged units back.

## Menus

| Menu | How to reach | What it does |
|---|---|---|
| Main menu | On load; Quit to Main Menu from pause/victory | Sectioned on one screen (v1.8): Play (First, Second — Twin Bridges, Third — Forest Belt, Test), Difficulty (Easy / Normal / Hard, see below), Learn (Tutorial, Tutorial II, How to Play), Customize (Hero Loadout), Store (Premium Store), Settings. The sim does not run behind it (tick stays 0) |
| Pause menu | Pause button, Menu button, Esc, or Space | Sectioned (v1.8): Match (Resume, Restart Map), Switch map (First, Second, Third, Test), Options (Settings, Quit to Main Menu). Opening it FREEZES the sim; Resume restarts it |
| Command tray | Always visible in a match | Primary order row always visible; "View & selection" overflow row (v1.8, always visible, never behind More): Paths, Minimap, Pan, Select, Add Select. More row (Groups, map buttons, zooms) behind the More toggle, except landscape forces it expanded |
| Settings | Pause menu → Settings, or main menu → Settings | Only toggles that actually work: Paths, FX/Animation, Shadows, Minimap, plus Reset to defaults. There is NO sound toggle — the game has no audio |
| Victory / Defeat / Draw | Automatic when the sim declares a winner or a draw | Win/loss shows the result, ticks elapsed, sim time, winning units remaining, wrecks created, wrecks still on the field, plus Restart and Main Menu. A draw shows both sides' units remaining instead of a winner's count. The game does not keep running behind it |
| Build menu | Select your Command Core | Lists producible units (name, catalog scrap cost, catalog build time), the build queue with progress, and per-item Cancel (full refund). Buttons disable visibly when scrap is insufficient |
| Info panel | Select a unit, structure, or wreck | Unit: name, HP, weapon(s), armour class, scrap cost. Structure: name, HP, armour, role. Wreck: current scrap value, starting value, time left. Multi-select: counts by type. Group membership shows in single-unit info |

## Camera

| Action | Mouse / keyboard | Touch |
|---|---|---|
| Pan | Drag empty ground ONLY in Pan mode (see below); otherwise mouse drag selects | Drag empty ground (or any ground) — the view follows the finger, unless Select mode is ON (see below), in which case the drag selects |
| Pan mode toggle | "Pan: Off/On" button. When ON, mouse drag pans instead of drawing a selection rectangle. Taps still select/order. This is the documented answer to the old mouse-drag-pan gap: mouse drag is selection by default, so pan needed its own mode | Touch already pans on drag; the toggle does not change touch behaviour |
| Select mode toggle (v1.8) | Touch mirror of Pan mode: "Select: Off/On" button in the View & selection row. When ON, a touch drag draws a selection rectangle instead of panning. Default OFF, so existing behaviour is unchanged unless the player opts in. The drag rectangle is drawn (dashed yellow + translucent fill) for mouse and touch | Same button; this IS the touch behaviour change: Select ON = drag-select, Select OFF = drag-pan |
| Zoom, smooth | Mouse wheel: zooms toward/away from the cursor. `+`/`=` zoom in, `-` zoom out, `0` reset to 1×. Buttons: Zoom 0.5× / 1× / 2×, Zoom + / Zoom − | Pinch: zooms toward the pinch midpoint |
| Zoom limits | 0.4× – 3×, enforced on every zoom route (wheel, pinch, buttons, keys, presets). The status bar shows the current zoom, e.g. `Zoom: 1.00` | Same limits |
| Zoom animation | Every zoom change animates to its target over ~150–250 ms (lerp, dt×10 in the frame loop) and is interruptible: a new zoom, a pan, or a minimap click replaces the in-flight animation. Zoom animates even while paused (it is render-time, not sim-time) | Same |
| Zoom to selection | Button "Zoom to Selection" or `F`: frames all selected units/structures with padding, at the smallest zoom in range that fits them | Button "Zoom to Selection" (no key on touch) |
| Minimap | Click to centre. DRAG on the minimap pans the camera continuously (Prototype 02 — Prototype 01 was click-to-centre only). The white rectangle is the current viewport and tracks pan and zoom | Tap to centre; drag to pan. **Minimap button** (command tray, or Settings) hides/shows it; on phone it is 132 × 83 px |
| Reset view | "Reset Map" restarts the current map and parks the camera over the west (player) base at 1× | Same |

Camera clamping: the view never leaves the map. If the view is larger
than the map (very low zoom on the small test map), the camera parks
at the map's top-left.

## Selection

| Action | How |
|---|---|
| Select one unit | Tap / click a blue (Iron Eden) unit. Only your own units can be selected |
| Drag-select | Mouse: press and drag a rectangle (only when Pan mode is OFF); every blue unit inside it is selected. Touch (v1.8): same, but only when Select mode is ON — otherwise a touch drag pans. The rectangle is drawn while dragging (dashed yellow + translucent fill) |
| Add to selection | "Add Select: Off/On" button. When ON, tapping a blue unit ADDS it to the selection instead of replacing it, and drag-select ADDS the rectangle's units (mouse, or touch in Select mode). This was the touch multi-select route before v1.8; drag-select in Select mode is the faster one now |
| Select all | "Select All" button: selects every live blue unit on the map |
| Deselect | "Stop / Deselect" (also issues Hold to the selection first, then clears it), or select a different unit, or start a new game |
| Structures | SELECTABLE (Prototype 02). Clicking your Command Core opens its info + production panel. Clicking an enemy structure issues an attack order to the current selection instead |
| Wrecks | SELECTABLE for info (Prototype 02). Tap a wreck with NO units selected to inspect it (scrap value, time left). Tap a wreck WITH units selected to order those units to salvage it (see Salvage). Wrecks are not combat units and do NOT block movement |
| Double-tap / select-all-of-type | Double-tap / double-click a blue unit (second tap within 350 ms) selects ALL visible blue units of that type. In Add mode it ADDS all of that type to the selection |
| Unit groups | `Ctrl+1..9` assigns the current selection to that group; `1..9` recalls it (pruned against live units/structures). Group membership shows in the single-unit info panel. On-screen buttons do the same without a keyboard (Prototype 03): turn **Assign Group** on, tap a number button (1–9) to assign the current selection — Assign switches itself off after one tap — then tap the number again to recall. Keyboard groups are unchanged |

## Feedback line (v1.8)

The line under the map always states, in plain words, what the next tap
will do for the current mode, selection, and toggles. It is the standing
guide, not a status readout: it updates on every mode change, toggle,
selection change, and order, so it is never more than one action out of
date. Transient messages (group assigned, rally set, ability used, drop
news) still show for 3 s, then the hint returns — the line is never left
blank or stale.

| Situation | What the line says (paraphrase) |
|---|---|
| Nothing selected | "Tap a blue unit to select it" — plus "or drag to select several" when Select mode is ON |
| Move mode, units selected | "Tap open ground to move your N units, or tap a red unit to attack" |
| Attack-Move | "Tap open ground to attack-move … (they fight anything they meet on the way), or tap a red unit to attack" |
| Hold | "Hold mode: tap ground to move … — tap Hold again to hold them where they stand" (states the shipped tap-falls-back-to-Move behaviour; Hold itself is unchanged) |
| Patrol, none selected | "Select units first, then tap ground to set the first patrol point" |
| Patrol, units selected | "Tap ground to set the first patrol point"; after the first point, "tap a second point" |
| Salvage / Guard | "Tap a wreck to salvage it … (or tap ground to move)" / "Tap ground to guard that point …, or tap a friendly unit to guard it" |
| Rally mode | "Tap a point on the ground — new units will move there on spawn" |
| Manual control | "Left stick moves, right stick aims and fires. Release Control to return to orders" |
| Toggles on | Suffixes ride on the mode hint: "Orders will queue." / "Taps add to your selection." / "Drag pans the camera." / "Drag draws a selection box." |

## Orders

First choose an order mode with the buttons, then tap/click the target.
Tapping a red unit attacks it in ANY mode. Tapping a wreck with units
selected salvages it in ANY mode.

| Mode / button | Tap ground | Tap a red unit | Tap a blue unit |
|---|---|---|---|
| Move (default) | Units move there (formation offsets for groups, below) | Units attack that unit | Selects that unit instead (or adds it, in Add mode) |
| Attack-Move | Units move there, engaging enemies on the way | Units attack that unit | Selects that unit instead |
| Hold | Units hold position (tap ground = move in Hold mode, per the tap rule: Hold mode taps fall back to Move — see note) | Units attack that unit | Selects that unit instead |
| Patrol | First tap sets patrol point A (banner confirms); second tap sets point B and the unit loops A↔B, engaging enemies en route, until given another order | Units attack that unit (and the pending patrol point is cancelled) | Selects that unit instead (pending patrol point cancelled) |
| Guard | Units move to the tapped point, then hold there, engage enemies in range, and RETURN to the point after a fight (see Guard below) | Units attack that unit | If the tapped blue unit/structure is NOT one of the selected guards, the guards guard IT (the point follows it); otherwise selects that unit instead |
| Salvage | Falls back to Move (salvage needs a wreck target) | Units attack that unit | Selects that unit instead |
| Stop / Deselect | — | — | Issues Hold to the selection, then deselects |

Note on Hold mode: the "Hold" button issues a Hold order immediately
to the current selection. After that, tapping ground while still in
Hold mode issues a Move order (the tap handler maps Hold → Move);
use the Hold button again to hold. This is the shipped behaviour, not
a bug report — it is documented here so it is not mistaken for one.

| Feature | Status |
|---|---|
| Queued orders (Shift+click/tap) | IMPLEMENTED (Prototype 02, keys; mobile-first finish adds the Queue button). Shift+tap OR Queue mode appends the order to the queue instead of replacing the current order. A unit runs its queue in order; an unshifted order replaces the current order AND clears the queue. Queued path draws as ONE connected line: current path waypoints, then each queued destination |
| Unit groups (Ctrl+number) | IMPLEMENTED (Prototype 02, desktop keys; Prototype 03 adds on-screen buttons 1–9 + Assign toggle, same behaviour) |
| Patrol | IMPLEMENTED (Prototype 02, two-point loop, engages en route) |
| Guard | IMPLEMENTED (Prototype 03, see below) |
| Rally points | IMPLEMENTED (Prototype 03, see below) |
| Formation movement | IMPLEMENTED (Prototype 02). A group move/attack-move gives each unit its own destination: a centred grid, 2 tiles apart, around the target point, clamped to the map. A unit whose offset tile is unreachable holds instead of stacking |
| Attack-move through the ford | The ford is visual only: ground units cannot cross water there, and their paths route via the bridge (see Map below) |

## Guard (Prototype 03)

Guard is a position order with a memory. Select units, tap **Guard**,
then tap ground: the units move to that point, hold there, and engage
enemies in weapon range. If they are displaced (separation, a fight
that pushes them off the point), they move BACK to the point when the
fight ends. Tap a friendly unit or structure in Guard mode (one that
is not itself selected) to guard IT instead: the guard point follows
that unit/structure while it lives, and freezes at its last position
if it dies. A selected guard's guard point draws as a yellow ring +
dashed line from the unit to the point (unselected units draw no guard
marker, like paths).

**Guard vs Hold, the distinction that matters:** Hold (the Hold
button) stops units where they stand — they engage enemies in range
but never move to a point and never return if displaced. Guard moves
TO a point, defends it, and returns to it. Hold is "stay"; Guard is
"stay HERE, and come back here".

## Rally points (Prototype 03)

Select your Command Core, tap **Set Rally** in its production panel,
then tap a point on the ground. Newly produced units move to the rally
point on spawn instead of idling next to the core. The rally point
draws as a ring + dashed line from the core (for both factions' cores
— a rally point is a visible order, not hidden information), and the
production panel shows the current rally coordinates. The rally point
is clamped to the map but is NOT checked for passability: a ground
unit rallied into water holds next to the core, exactly like an
unreachable move order. Only the player's core has a Set Rally button;
the red AI never sets a rally point (its produced units idle next to
its core). Rally mode ends after one tap; tapping a point while no
core is selected does nothing.

## Economy (Prototype 02 player-side, Prototype 03 both factions)

- **Starting scrap: 500** (both factions in Prototype 03; the status
  bar shows the player's scrap). Justification: 500 buys a Medium Tank
  (300) plus a Scout Buggy (80) or several cheap recon units, but NOT
  a Heavy Tank (520) — so the opening build is a real choice, and the
  rest of the economy must come from salvage. Prototype 02 gave Xandria
  0 and no economy; Prototype 03 starts it at 500 with the AI rules
  below. That change is the ONE Prototype 02 test expectation updated
  in Prototype 03.
- **Red AI economy (Prototype 03, sim-side — works in headless tests,
  not browser-only).** The AI gets the SAME rules as the player: same
  starting scrap, same catalog costs/times, same producible filter,
  same salvage fraction/decay. It gets NO free scrap, NO free units,
  and NO extra vision. Production + salvage decisions run once per
  sim second (every 20 ticks), only while its Command Core is alive:
  - Production: if its queue holds fewer than **3** items, queue the
    CHEAPEST affordable producible unit whose live + already-queued
    count is below **3** of that type. Cheapest-first + per-type cap
    keeps it from spamming one unit and from snowballing behind a queue.
  - Salvage: each idle (Hold, empty-queue) red unit may be sent to at
    most one wreck, each wreck gets at most one salvager, only within
    **15 tiles** of that unit, and only while the wreck is still worth
    something (value > 0). Units already salvaging, moving, or fighting
    are never retargeted by the salvage pass.
  - Interaction note, stated plainly: combat orders (below) never
    interrupt a salvage in progress, and a unit that finishes
    salvaging may be combat-ordered at the next AI think tick.
  - New Xandria types and the AI (Wave 6 finding, exclusion
    FINAL): cheapest-first + per-type cap means the red AI queues
    Needlewing, Longsight, Javelin, or Raptor only once every
    cheaper producible type is already at its cap of 3 live +
    queued — 18 cheap units alive before the first Needlewing is
    even queued (fast_raider shares the 140 tier and comes first
    in catalog order). Wave 6 measured 0 new-type spawns in 14
    shipped-rule matches across all 3 maps, all 3 difficulties,
    rich-bank (5,000 scrap) and passive-blue variants; the most
    favourable probe peaked at 16 red units alive, still short of
    saturation, and a saturated test state does queue Needlewing
    ×3, proving the rule reaches them in principle. No AI
    ordering change is shipped: any change that fields them in
    normal matches must displace cheap production, which is a
    doctrine change, not a bounded fix — so the new types stay
    player-producible and AI-absent in shipped matches, by
    decision, not by oversight.
- **Red AI combat (Generation Cycle 2, sim-side — the browser issues
  no red orders).** One squad state machine, reused across unit
  types and both maps, thinking once per sim second after the
  economy, never in a tutorial game. No free scrap, no free units,
  no stat changes, no vision beyond this no-fog game, and it never
  touches player units. The economy stops when the core dies, but
  combat does not: survivors fight on in last-stand attack mode
  (see below), so a dead core never freezes the army in place:
  - **Defend:** when 3+ blue units are within 25 tiles of the red
    core, or the nearest blue unit is within 14 tiles, combat units
    guard a ring (radius 6) around the core. Entering defend is
    immediate; other mode changes wait 100 ticks, so the AI does
    not flip-flop.
  - **Gather:** with fewer than 8 combat units, units guard a
    staging ring toward the enemy (6 tiles from the core, toward
    the blue core) instead of trickling in one by one. Attack needs
    8 combat units to start and only drops out below 5.
  - **Attack:** squads attack-move to a chosen target — the blue
    Command Core while it lives, else the weakest blue structure,
    else the centroid of blue units. Squads split three ways: one
    direct, one via a point 14 tiles north of the target, one via
    14 tiles south, so a two-crossing map is not attacked down one
    bridge only. Every destination is snapped to the nearest
    passable tile for that unit, and routes use the existing A*
    pathfinding — a ground unit is never ordered into water.
  - **Fall-back:** a combat unit below 35% HP with an enemy within
    12 tiles, more than 8 tiles from its core, is sent to guard the
    core ring and is never sent attacking again (there is no repair
    in this slice). Weaponless units (salvage teams, sensor and
    decoy drones) are never given combat orders.
  - **Reinforcement batching:** a unit that spawns during an attack
    does not go out alone — it guards a staging ring near the core
    until 3 staged units are ready, then the batch attacks together.
  - **Last stand:** after the red core dies, the AI stops producing
    and salvaging, but every surviving combat unit attacks the
    chosen blue target (fallen-back units included — there is no
    core left for them to defend). This branch only activates if a
    core was present at an earlier AI think; a game that never had
    a core keeps the old behaviour of the AI doing nothing, so
    unit-only setups are not changed by this cycle.
  - The old browser driver that issued attack-move to every idle
    red unit every 40 ticks was removed in Cycle 2; headless tests
    and the browser now run the same AI.
  - **Fixed in Cycle 3 (was a known limit from Cycle 2):** if the
    only survivors on both sides are air units whose guns only hit
    ground/structure, no order can make them damage each other.
    That is a weapon target-class limitation in the catalog, not an
    AI stall — the AI keeps issuing attack orders. Cycle 3 resolves
    it as an endgame draw instead of changing any weapon: when
    neither side can damage the other AND neither side has a living
    Command Core (so neither side can produce), a counter advances
    once per tick and the match ends in a declared Draw after 600
    ticks (30 seconds). Elimination still takes precedence — a side
    with nothing left loses, never draws — and a core still alive
    anywhere resets the counter, so a transient air-only moment
    never draws. No weapon damage, range, or target class was
    changed to achieve this.
- **Production:** select your Command Core. Producible units are your
  catalog roster restricted to zero Power AND zero Components cost
  (those two layers do not exist yet, so units needing them are listed
  nowhere and cannot be queued — no second cost system is invented).
  Cost = catalog `cost.scrap`, build time = catalog `buildTime`
  seconds, one unit at a time, head of queue first. Scrap is deducted
  WHEN QUEUED. Cancel refunds the FULL cost, including cancelling the
  in-progress item. A finished unit spawns next to the core on the
  first passable tile spiralling out (rings 1–5); if no tile is free it
  waits at 0 ticks and retries — a paid unit is never silently dropped.
  If the core dies mid-queue, the whole queue is refunded
  IMMEDIATELY, in the tick the death is processed (wave-2 fix of
  beta wave-1 OBS-1: the old code refunded only when the head
  item's timer expired, leaving scrap unavailable for up to a
  full build time after the producer died).
- **Wrecks:** every dead UNIT leaves a real sim wreck (structures do
  not — their destruction is explosion/fire only, as in Prototype 01).
  Base value = `floor(0.4 × catalog scrap cost)` — never full value.
  Value decays LINEARLY to 0 over **120 seconds** (2400 ticks), then
  the wreck expires and vanishes. The old render-only persistent
  wrecks are gone: what you see is the sim record, so wrecks now decay
  and expire instead of lasting forever.
- **Salvage:** any of your units can salvage (not just a recovery
  unit — a Prototype 02 simplification, stated plainly). Salvage mode
  + tap a wreck, or tap a wreck with units selected in any mode, or
  the Salvage button in the wreck info panel (enabled only when units
  are selected). The unit travels to the wreck; on arrival (within
  1.5 tiles) it collects the wreck's CURRENT (decayed) value, the
  wreck is removed, and the unit holds (or runs its next queued order).
  Wrecks never block movement and cannot fight.

## Unit paths (display only)

Selected alive units with a non-empty sim path show their remaining
path: a dashed team-coloured line from the unit through each waypoint
tile centre to the destination, turn dots where the path changes
direction, and a destination ring + dot at the final waypoint. With a
queue, the line continues through each queued destination, so the
whole queued route reads as one connected path.

- Paths come from the sim's existing `unit.path` array plus the sim's
  `unit.orderQueue` — the renderer never computes a path of its own.
- As the unit moves, waypoints drop off the front of the path and the
  drawn line shortens. When the unit stops, dies, or is deselected, its
  path vanishes.
- When an order is issued to selected units, their new paths flash
  thicker and brighter for 1.5 sim seconds.
- If several units are selected, each unit's own path is drawn — paths
  are never merged into one fake group path (formation offsets mean
  each unit genuinely has its own destination).
- Unselected units draw NO path, ever.
- Toggle: "Paths: On/Off" button, `P`, or Settings. Default is On.
- Guard and rally markers (Prototype 03) follow the same display-only
  rule: guard markers draw only for SELECTED guards (yellow ring +
  dashed line to the guard point, or to the guarded entity's current
  position); rally markers draw for every Command Core with a rally
  point (team-coloured ring + dashed line from the core). Neither
  marker affects movement, collision, or targeting.
- At low zoom the line keeps a minimum width (1.5 px) so it stays
  readable; at high zoom it is capped at 3 px (4.8 px while flashing).

## Touch vs mouse vs keyboard — gesture thresholds

- Tap vs drag: a pointer that moves **≤ 8 px** is a tap (select or
  order, and it never pans). A pointer that moves **> 8 px** is a drag:
  mouse drag = selection rectangle (or pan in Pan mode), touch drag = pan.
- Touch has no drag-select by design: to select many units on touch,
  use "Select All", or turn on Add-to-Selection and tap units one at a
  time.
- After a pinch ends, the remaining finger is re-anchored, so its next
  move does not jump the camera from the pre-pinch pan position.
- Pinch and wheel both zoom to an anchor (pinch midpoint / cursor);
  preset buttons and keys zoom to the viewport centre.

## Map (First Map, default)

80×50. Iron Eden base west (command core 6,25), Xandria base east
(73,25). A north–south river (x=39–42) runs the full height. The
**single bridge (x=39–42, y=23–26) is the only ground crossing**.
The stepping-stone ford at y=12 is VISUAL ONLY — the tiles under it
are water, so ground units cannot cross there; any ground path between
the ford banks routes via the bridge. Air units ignore ground terrain.
The old 64×40 test map is still available via the "Test Map" button
(bridge rows 18–21, river columns 30–33).

## Second Map — Twin Bridges (Generation Cycle 1)

80×50, same cores (6,25 / 73,25) and same 10v10 scenario shape. A
central lake (x=33–47, y=10–39) is crossed by **two bridges**: upper
(y=16–17) and lower (y=32–33), with open land corridors around the
lake's north and south ends. The terrain problem is therefore two
crossings plus flanks to watch, instead of one choke to hold.
Selectable from the main menu, the pause menu, and the command bar
("Second Map" button). Track and road overlay lines are cosmetic
only, as on the First Map.

## Third Map — Forest Belt (Gameplay Completion)

80×50, same cores (6,25 / 73,25) and same 10v10 scenario shape.
There is no spanning water barrier and no bridge choke at all:
a dense forest belt (x=30–49, y=4–45) covers the middle of the
map, cut by three clear lanes (y=14–16, y=24–26, y=34–36).
Forest slows ground units (movement cost 2, vs 1 on open ground)
and rock clusters inside the belt block line of sight, so the
terrain problem is lane choice and ambush, not choke holding —
the fast lanes are open and exposed, while pushing through the
trees is slow. Three scattered ponds (small water blobs, never
spanning) are circumventable on land, so no bridge is needed
anywhere on this map. Selectable from the main menu, the pause
menu, and the command bar ("Third Map" button). Track and road
overlay lines are cosmetic only, as on the other maps. The First
Map and Twin Bridges are unchanged.

## Difficulty settings (Gameplay Completion)

The main menu carries three buttons — Easy, Normal, Hard — with
a status line stating the current setting. The setting changes
ONLY red AI behaviour parameters, through the sim's existing
`aiCombatParams` seam: defend range/count, core-danger range,
gather count (units needed before attacking), attack floor
(units below which an attack drops out), retreat HP/range, mode
hysteresis, and reinforcement staging batch size. Normal is
exactly the shipped behaviour (every Normal value equals its
shipped constant, proven by test). Easy is cautious and slow to
commit (needs 12 combat units before attacking, drops out below
8, falls damaged units back at 50% HP, stages reinforcements in
batches of 5); Hard is aggressive and stubborn (attacks with 5,
holds attacks down to 3, falls back only below 20% HP, stages in
batches of 2). Same costs, same economy, same unit stats, no
free scrap or units, no vision change, no stat change on any
difficulty. The setting lives in session memory only — there is
no new persistence store, it resets to Normal on page reload,
and Settings → Reset to defaults also resets it to Normal. It
applies at the next match start only; changing it mid-match
never touches the match in progress. Tutorial games always use
Normal behaviour — and the tutorial red side is held anyway, so
no tutorial game ever runs the AI at all.

## Twin-stick manual control (Phase A)

Take direct control of one of your own units and drive it yourself,
alongside the RTS army — the rest of your force keeps its orders and
auto-engage, and production keeps running (you just cannot order new
production while controlling; the build panel is replaced by the
control strip).

- **Entry:** select exactly one of your own units that has a weapon,
  then tap **Take Control** — in the command row, or in the unit's
  info panel. The button is disabled with a reason for zero or
  multiple selections ("Select one unit to take control."), for an
  unarmed unit ("This unit has no weapon."), and for structures
  ("Structures cannot be controlled."). It is hidden in tutorial
  games and while already controlling.
- **Phone (landscape recommended):** stick zones cover the MAP CANVAS
  ONLY, never the side panel — left stick is the left 40% of canvas
  width, bottom 60% of height; right stick is the right 40%, bottom
  60%; the middle 20% is stick-free. Left stick moves, right stick
  aims and auto-fires while held. Sticks have a dynamic origin
  (~60 px radius) and a 0.35 deadzone, so small tremors are not input
  and pushing past the edge never exceeds the unit's catalog speed.
  Two thumbs plus a button tap are tracked by pointer id, so both
  sticks work at once. While controlling, the side panel collapses
  to a control strip: **Release Control**, **Pause / Menu**, an HP
  bar, and a weapon-range note; the minimap stays visible but taps
  on it do not move the camera; the info and build panels are hidden
  so they cannot sit on top of a stick zone. Portrait works with the
  same canvas-relative zones and a bottom strip, but landscape is
  recommended — the strip says so.
- **Desktop:** WASD moves, the mouse aims, hold the left mouse button
  to fire. Esc first press releases control, second press opens
  pause. Space still pauses (and resumes). Right mouse is reserved
  and does nothing in this phase. Zoom and path keys still work
  while controlling; group recall is ignored until release.
- **Aim rule:** while firing, the unit shoots at the NEAREST enemy
  that passes every normal firing gate — weapon range, minimum
  range, line of sight (rock blocks), target class, cooldown,
  accuracy, damage type, and the armour matrix — AND lies within a
  **30° half-angle cone** of the aim-stick / mouse-aim direction.
  Aiming away from a target, or at one out of range, inside minimum
  range, of the wrong class, or behind rock, fires nothing. Shots use
  the existing pooled projectile pool (2,048 slots, no per-shot
  allocation). Driving well gives no hidden bonus: same speed,
  weapons, cooldowns, and damage as RTS orders. If twin-stick ever
  systematically outperforms RTS orders with the same loadout, that
  is an input bug, not a damage bonus.
- **Movement:** the unit's catalog speed is the cap, scaled by the
  terrain it is on; ground units cannot be driven into water or
  rock (a diagonal drive into a corner slides along the passable
  axis instead of sticking); air units ignore ground blocking. No
  new unit-to-unit collision was added. While controlled, the unit
  ignores group, guard, rally, and patrol orders — they were cleared
  on entry, not queued.
- **Camera:** follows and centres on the controlled unit, clamped to
  the map. Panning is disabled while controlling (canvas drags are
  sticks, minimap taps do nothing). Zoom buttons still work, and the
  controlled unit's weapon range draws as a dashed ring around it.
- **Exit:** tap **Release Control** (always visible, in the strip),
  or press Esc. The unit takes a HOLD order at its current position,
  its path and order queue are cleared, the selection is preserved,
  and no pre-mode order resumes silently — the old order is gone.
  Pause preserves the mode (pause, resume, still controlling); quit
  to menu cancels it; the victory / defeat / draw panel supersedes
  it.
- **Death:** if the controlled unit dies, the mode exits immediately,
  the camera stays on the death tile, the selection is cleared, and
  normal wreck rules apply (40% of catalog scrap, 120 s decay).
- **Limits of this phase:** pinch / zoom gestures while controlling
  are via the zoom buttons only (pinch was never finger-tested
  anywhere in the game); sustained-fire phone performance under a
  full battle is unmeasured from the sandbox; thumb ergonomics are
  headless-emulation only until a real phone playtest. Levels, XP,
  skills, and persistence are later phases — none of them exist in
  this build. The hero mech, loadout, and gear shipped in Phase B
  (next section).

## Hero mech and Drop Back In (Phase B)

The player's default starting mech is the **Command Mech**
(placeholder name — no final name has been decided). It is an Iron
Eden **Lancer** chassis: HP 200, Medium armour, speed 6.0, vision 8
(catalog values, verified — the design spec's proposed vision 10
was unconfirmed and is NOT used), size 0.55, ground movement,
catalog scrap cost 380. It replaces the west roster's `lancer_mech`
entry, but it starts **in reserve, off the map** — the opening field
count is **9v10**, not 10v10. It has no Take Control path: it is not
on the field to select, and **Drop Back In is its only entry**.

- **Presence model (the amendment wins over the original spec
  wherever they disagree):** Reserve (default, off-map, NOT a sim
  entity — loadout and HP held as shell state) → Dropping
  (telegraph, PROPOSED 2 seconds / 40 ticks, marker visible to both
  sides, cannot act, cannot be damaged, not yet an entity; a match
  ending during the telegraph cancels the drop and refunds a
  death-path payment) → Controlling (the field hero, driven via the
  Phase A twin-stick path) → Reserve on Release Control, Esc,
  entering RTS command mode, or taking control of another unit (at
  the same moment control transfers — never both a controlled unit
  and a field hero) — or Dead (wreck) on death, never reserve on
  death. Pressing Drop Back In while controlling a non-hero unit
  releases that unit to a hold order and drops the hero in its
  place. Voluntary withdrawal keeps the hero's EXACT HP within the
  match (withdraw at 40 HP, drop again at 40 HP) — it is not a
  heal, and it creates no wreck, no scrap for either side, and no
  XP change (there is no XP in this phase). Death creates the
  normal wreck: 152 scrap at full value (40% of 380), 120 s decay,
  salvageable by either side.
- **Drop Back In button:** in the RTS command tray (side-panel
  order row in landscape, bottom tray in portrait) AND in the
  twin-stick control strip while controlling a non-hero unit,
  ≥44 px, always visible while a hero match runs. Disabled WITH A
  VISIBLE REASON (the reason is the button label, not a hover
  tooltip — phones have no hover): hero already on field; hero dead
  with redeploy terms unmet (time or scrap, whichever binds); own
  Command Core dead ("Command Core destroyed — no redeploy",
  blocks both paths); voluntary cooldown active ("Drop ready in
  Xs"); no passable tile near the core ("No drop tile near the
  Command Core."). Hidden, not disabled, in tutorials and when the
  hero toggle is off. Drop location: the nearest passable tile to
  the player's own Command Core via the existing production spawn
  search — never water or rock, and the player does NOT choose the
  tile (a player-chosen drop would be a teleport ambush that
  bypasses the First Map bridge and the Twin Bridges lake).
- **Cooldowns and costs (all PROPOSED numbers from the design spec
  — implemented, not user decisions):** voluntary withdrawal →
  redeploy FREE after 10 seconds (200 ticks); death → redeploy
  200 scrap + 30 seconds (600 ticks), waiting if broke (the timer
  does not reset, the debt does not grow), VIA Drop Back In — there
  is NO automatic respawn, the player must press the button; core
  dead blocks both paths. The death cost is paid when the button is
  pressed, and refunded if the match ends during the telegraph.
  A redeploy after death lands at FULL HP; a redeploy after
  voluntary withdrawal lands at the withdrawn HP.
- **Elimination and defeat:** a hero in reserve does NOT prevent
  defeat and does NOT keep a match alive — core dead plus all other
  field units and structures gone is defeat even with a healthy
  hero in reserve (redeploy needs a living core). It is NOT an
  elimination target: the red AI cannot target, damage, or count it,
  because it is not in the field entity lists at all — never a
  hidden invulnerable unit. The Cycle 3 deadlock detector iterates
  field entities only, so a reserve hero neither prevents nor
  causes a draw, a reserve-only side is eliminated not deadlocked,
  and a field hero counts like any other field unit. The 600-tick
  grace and elimination precedence are unchanged.
- **Hero toggle:** Settings has a "Command Mech hero on/off"
  checkbox, default ON (PROPOSED). Hero off restores the original
  10v10, hides Drop Back In, and earns nothing persistent — because
  persistence does not exist yet in any match. The toggle applies at
  the next match start only; toggling mid-match never adds or
  removes the in-progress hero. The Test Map never gets a hero.
- **Loadout (between matches ONLY, fixed for the match):** **Hero
  Loadout — Command Mech** on the main menu opens the loadout
  screen: primary, secondary, armor, mobility, reactor, sensor
  selects, and — in Phase B — the ability slot shown as a locked
  note (superseded in Phase C: the ability slot now holds one
  equipped active skill, see the Phase C section). The loadout is
  validated live with REASONS,
  never silent rejection: primary must come from the Lancer's
  primary family list; secondary must be a lighter family
  (Autocannon, Missile Launcher, Flamethrower, Anti-air Cannon,
  Melee) at or below the primary's tier; utility (EW/sensor) rows
  are data rows, not equippable hero slots; air-mount bans
  (Flamethrower, Melee, Siege Cannon, Mortar) are encoded in the
  template even though the hero is ground; Scrapjack is tier-capped
  at 2 as a template rule. **Tier-band resolution (Phase B has no
  levels, so the spec's level bands cannot apply literally):
  Phase B ships tier-1 weapons AND tier-1 gear only** — the level-1
  band — with tier 2/3 rows data-complete but locked in the UI and
  rejected by the validator with Phase C reasons. The secondary
  slot IS usable in Phase B (tier-1, lighter families, tier ≤
  primary tier). **Phase B session-only warning (superseded in
  Phase C, stated here as history): in Phase B, loadout edits lived
  in session memory only and reset on page reload; there was NO
  persistence in that phase — no localStorage, no stored hero state
  of any kind. Phase C replaced that notice with the device-local
  data-loss line (see the Phase C section); the session-only notice
  is REMOVED, not left alongside it.**
## Hero progression: persistence, XP, skills, upgrades (Phase C)

- **Persistence (device-local ONLY, no cloud, no account, no
  server):** the hero record lives under key
  `surfacewars.hero.v1` (schema version in the key; a later shape
  ships as `v2` with a migration, never by silently reinterpreting
  old fields). Shape: `{schema: 1, level (1..10), xp (cumulative),
  skillPoints (unspent), skills: [ids], loadout: {primary, secondary
  (or null), armor, mobility, reactor, sensor, ability}, heroEnabled,
  matchesPlayed, wins}`. Web build: localStorage; APK WebView: DOM
  storage. Written at match end (victory, defeat, OR draw panel),
  when skill points are spent, and when the loadout changes —
  NEVER every tick, NEVER mid-match for XP. **Quitting mid-match
  earns NO XP.** Read at the main menu before a new match. The main
  menu shows the status line: `Command Mech — Level X | Y XP | Z
  skill point(s) unspent | W matches, V wins` (plus `| Hero off
  (original 10v10)` when disabled).
- **Data-loss warning (stated on the loadout screen, one visible
  line, replacing Phase B's session-only notice — the old notice is
  GONE, not left alongside):** "Hero progress is stored only on
  this device — clearing app data (APK) or browser storage (web)
  loses it permanently, with no recovery. Progress on the phone
  does not appear on the laptop, and vice versa." Phone progress
  does not appear on laptop and vice versa. **NO match save/load
  system exists** — skirmish matches remain save-free; only hero
  progression persists. Progression is never stored in
  `catalog.json`, game code, or sprite data.
- **Corruption rule:** a missing, unreadable, or
  failing-validation record resets to a level-1 hero with the
  starting loadout and a plain notice: "Hero progress could not be
  read, so it was reset to level 1." It never crashes, never blocks
  the menu, never silently keeps a half-valid record. Storage
  failures on write never crash either — progress then lives in
  memory for the session only.
- **XP sources (all numbers PROPOSED):** hero killing blow =
  `floor(0.10 × victim's catalog scrap cost)`, minimum 10 — army
  kills feed 0 hero XP (the sim attributes the killing blow to the
  hero unit specifically, through instant, projectile, splash,
  pierce, and burn-zone paths). A 0-cost victim (e.g. a Command
  Core at cost 0) grants 0, never the minimum — the minimum is a
  floor on a real cost, not a reward for killing free things. Hero
  salvage = 10 XP per wreck (the hero unit performing the salvage,
  not any unit). Match win +100, match draw +0 bonus (kill/salvage
  XP still count), match loss +25, hero death = 0 XP lost (never
  de-levels). `matchesPlayed` increments on every completed match
  (win/loss/draw panel); `wins` increments on wins only.
  **Level-up happens at match end only** — a hero does not level
  up mid-battle. Skill points: 1 per level from level 2; 9 points
  by level 10 for 8 skills, 1 spare by design.
- **XP curve (PROPOSED, cumulative):** L1 0; L2 100; L3 300; L4 600;
  L5 1000; L6 1500; L7 2100; L8 2800; L9 3600; L10 4500 (increments
  grow by 100 per level). Illustrative pace only: ~300 XP/match →
  level 2 in ~1 short match, level 5 in ~3–4 matches, level 10 in
  ~14 matches; actual pace is measured and retuned in a later
  cycle, not asserted here.
- **Hero salvage, and why it auto-collects:** the hero is on the
  field ONLY while manually controlled, so it can never be issued
  an RTS salvage order (release withdraws it). Its spec XP source
  "hero salvage" therefore fires as an auto-collect: a manually
  driven hero that ends a tick within 1.5 tiles of a wreck collects
  it — scrap (with Salvage Sense when unlocked) and 10 hero XP.
  Army units are untouched by this path.
- **Skills (seed set of 8, single-rank each, 1 skill point each,
  all numbers PROPOSED):** 1 Dash (active, 2× speed 0.4 s, cooldown
  8 s, no invulnerability; gate level 2); 2 Salvage Sense (passive,
  hero's salvages +25%; gate 3); 3 Overdrive (active, +25% fire rate
  5 s, cooldown 20 s; gate 4); 4 Field Repair (active, restore 60
  HP, cooldown 30 s; gate 5); 5 Targeting Computer (passive, +10%
  accuracy and +1 range on the PRIMARY weapon only; gate 5); 6
  Shockwave Slam (active, 2-tile radius damage = primary ×1.5,
  cannot damage structures, cooldown 25 s; gate 6); 7 Reinforced
  Frame (passive, +15% max HP at match start; gate 7); 8 Rally
  Signal (active, allies within 8 tiles +10% speed 8 s, cooldown
  30 s, issues no orders; gate 8). Skill gates are level gates: a
  skill cannot be bought below its gate level, and buying shows
  the reason when gated. **Free respec between matches only** (from
  the loadout/hero screen, never mid-match): returns all spent
  points to the unspent pool, no XP loss, clears the equipped
  ability. The ability slot holds ONE equipped active skill
  (equipped between matches); passives are always on once
  unlocked.
- **Ability control:** the control strip shows the equipped active
  skill as Ability 1 — for the hero only; non-hero controlled units
  keep it hidden, as in Phase A. Desktop: Q or 1 fires it (E/2 do
  nothing — there is no second ability control because the slot
  holds exactly one active skill). A hero with no equipped active
  skill gets a DISABLED button whose label IS the reason ("No
  ability equipped") — never a dead button. Cooldowns are visible
  in the button label (seconds remaining, or Ready).
- **Upgrade paths — three, and only three:** (1) stats by level:
  +5% max HP and +2% damage per level, capped at +50% HP and +20%
  damage at level 10 — see the cap resolution below; (2) skills by
  skill points, free respec between matches; (3) gear tiers by
  level: Tier 1 at levels 1–3, Tier 2 at 4–6, Tier 3 at 7+ (Phase B's
  tier-1-only lock is lifted by level; the validator allows tiers
  up to the hero's level band and rejects higher tiers with a
  level reason, e.g. "needs hero level 4"). No second currency —
  level is the only persistent currency.
- **Stat-cap resolution (recorded, not fudged):** (level−1)×5% =
  +45% HP at level 10 and (level−1)×2% = +18% damage at level 10,
  which sit UNDER the spec's stated caps of +50%/+20%. The level-1
  anchor is NOT broken to make the caps bind: a level-1 hero
  equals a lancer with no bonus, exactly as in Phase B (proven by
  test). The +50%/+20% figures are therefore non-binding ceilings,
  and the effective level-10 values are **+45% HP (200 → 290) and
  +18% damage (12 → 14.2)**. Reinforced Frame's +15% max HP
  combines ADDITIVELY with the level HP bonus on base HP, before
  gear multipliers: level-10 + Reinforced Frame = 200 × (1 + 0.45 +
  0.15) = 320; level-7 + Reinforced Frame + tier-3 armor = 200 ×
  (1 + 0.30 + 0.15) × 1.30 = 377.
- **Level badge:** the field hero's badge reads `CMD N` (e.g. CMD
  9) — a player facing a level-9 hero sees it is level 9.
- **Phase B preservation (all still true):** reserve model, Drop
  Back In (both states, cooldowns, costs, core-dead block,
  telegraph), 9v10 opening field, loadout between matches only, no
  mid-match refit, hero toggle (now persisted in the record), Test
  Map exclusion. A level-1 hero in Phase C plays identically to
  the Phase B hero (same stats, same loadout options at tier 1).
- **What Phase C deliberately does NOT add:** anything that syncs,
  charges, or saves a match (no cloud, no account, no server, no
  match save/load, no paid unlocks); any skill beyond the 8 seed
  skills; any second currency; mid-match refit; hero production
  from the core; hero duplication via groups; new units/weapons/art
  beyond the Phase B data rows (tier 2/3 rows already existed as
  data — unlocking them is this phase, creating new weapons is
  not); any balance/economy/AI change beyond hero progression,
  skills, and gear tiers. No APK, publishing, commit, or push came
  with this phase.

- **Weapons data (not new tuned weapons):** all 123 named weapons
  from the design doc ship as data rows (name verbatim, family 1 of
  12, slot, tier, compatibility, at most two multipliers, at most
  one special from the closed list none / overheat / pierce / burn
  / stun) with ONLY the 12 family baselines as tuned numbers.
  Worked examples resolve as specified: Scrapstorm Rotary Gun =
  Autocannon 12 × 0.85 damage, 0.5 × 0.5 interval, overheat;
  Railspike = Railgun baseline + pierce; Cratermaker = Siege Cannon
  baseline unchanged. Specials: overheat (4 s continuous fire →
  forced 1.5 s cooldown), stun (speed halved 30 ticks), pierce
  (APPROXIMATION, stated honestly: one additional enemy within 2
  tiles of the impact takes 50% damage — not true line
  penetration), burn (3 s zone, 1.5 tile radius, 25% of weapon
  damage per second, armour matrix applied, zones capped at 64).
  Catalog weapons carry no special field, so every special path is
  a no-op for non-hero units — existing combat is unchanged.
  Gear tier-1 effects: armor +10% max HP, mobility +0.5 tiles/s,
  reactor +5% fire rate on ENERGY weapons only, sensor +1 vision
  (weapon range +1 arrives at gear tier 3, which is Phase C).
- **What Phase B deliberately does NOT add:** XP, levels, skills
  (no skill buttons, points, or effects), persistence storage,
  second currency, mid-match refit (no refit at the core, no weapon
  pickup from wrecks, no mid-battle swap — the loadout is fixed for
  the match), hero production from the core, hero duplication via
  groups (hero controlled alone or not at all), new units or art
  beyond the 123 data rows and 12 baselines, and any balance,
  economy, or AI change beyond the hero / reserve / drop systems.
  No APK, publishing, commit, or push came with this phase.

## Rendering notes (what the zoom levels do)

- Sprites are drawn crisp at zoom ≥ 1× (smoothing off) and smoothed
  at low zoom to avoid shimmering.
- HP bars are 3–6 px thick by zoom and selection rings are 2–4 px, so
  both stay readable from 0.4× to 3×.
- Units and structures get a soft drawn drop shadow (off when the
  Settings shadows toggle is off).
- Terrain edges are shaded where two terrain types meet (drawn, never
  baked into tiles).
- Below 0.6× zoom, dust FX, damage smoke, and the smallest units' HP
  bars are hidden (far-zoom simplification). Selection rings, team
  colours, paths, and destination markers are never hidden.
- Canopy tiles were retinted darker and less saturated (mean green
  134 → 96) with softened alpha edges, and blend slightly at far zoom
  (alpha 0.78 below 0.6×, 0.88 below 0.8×), so forest reads as forest
  without the bright grid-like look at full-map zoom. Forest never
  reverts to bare dark ground.
- FX/Animation off (Settings) hides muzzle flashes, dust, damage
  smoke, bob, and recoil. It does not hide units, paths, or wrecks.

## Known limits (not controls, but do not mistake them for bugs)

- The opponent's COMBAT is the documented sim-side AI above
  (defend / gather / attack / fall-back squads); its ECONOMY is the
  documented sim-side AI above (production + salvage, same rules as
  the player).
- No REAL phone playtest yet. What exists now is mobile EMULATION
  (headless Chromium, 390 × 844, touch events, device scale 2 — see
  MOBILE-FIRST-REPORT.md): tap-select, Select All, Queue-mode move
  order with formation paths, Zoom + button, build-panel queue, pause
  and resume, tray and minimap toggles, all driven and screenshot at
  phone size. Pinch and wheel did NOT move the zoom in that mobile
  emulation (wheel verified working at desktop viewport in the same
  run, 1.00 → 1.15 → 1.32, so the handler is fine and the gap is the
  mobile emulation's gesture dispatch, not the game code) — pinch
  remains code-only, never finger-tested. A real S25 playtest and an
  APK are still outstanding (APK is a separate, authorized step, not
  part of this finish).
- Grass base tiles still show mirror symmetry at high zoom (a tile-art
  property, not a control issue).
- Bob animation is ~1 px at zoom 1; muzzle flashes, projectiles,
  dust, and wrecks are the most legible motion at that scale.
- Pausing (pause menu, Esc, Space) freezes sim time and therefore all
  sim-timed animation; zoom animation still works while paused.
- The catalog description for the Command Core still says
  "elimination in Prototype 01" in `data/catalog.json` (the catalog was
  deliberately not edited, so its generated mirror stays in sync); the
  info panel strips stale "Prototype NN" references before display, so
  no stale version string reaches the player. The generated
  `game/catalog.js` header still says version "prototype01" — that is
  a data-version string, not player-facing text, and is unchanged.

## Still NOT IMPLEMENTED (never faked)

Research/tech tree, fog of war, campaign, save/load, multiplayer,
placing new structures, Power/Components/Supplies economy layers,
Salvage Clans/Directorate factions, transport, and repair. Twin-
stick manual control shipped in Phase A (see above); the hero mech,
loadout, and gear shipped in Phase B (see above); hero persistence,
XP, skills, and gear-tier unlocks shipped in Phase C (see above).
The red combat
AI shipped in Generation Cycle 2 and was moved out of this list with
its tests. Anything here that later ships gets moved out of this list
with its test — never silently.

## Autonomous loop (pointer, added 2026-10-31)

The autonomous completion loop log lives in
`~/workspace/surface-wars/AUTONOMOUS-LOOP.md` (loop entries, scope
decisions, and hard constraints). Wipe-recovery material lives in
`~/workspace/surface-wars/autonomous-backup/`:
`baseline-v1.4/` (v1.4 game code + docs snapshot with SHA-256
manifest), `RESEARCH.md` (wave-2 graphics methods + free-asset
sources with applicability notes), and `RESUME.md` (current state,
last verified checkpoint, and the exact APK rebuild pipeline).
Nothing in this section changes any control, mechanic, or rule
above; it only points at where the loop is recorded.

## Wave-2 graphics upgrade + wired-sprite fix (final state, v1.5)

These change how the game looks, not how it plays. No stat,
economy, AI, or rule change rides with them.

- Canvas backing is capped at device pixel ratio 2 (was uncapped):
  same look on a phone, far less backing memory on high-DPR screens.
  Static ground is baked once per map/zoom instead of re-drawn per
  frame; glow is baked sprites, shadows are drawn ellipses (no
  shadow blur, no per-frame image reads).
- Damaged units show damage decals: light scorch at 50% HP or
  below, heavy scorch at 25% or below (thresholds tested, not
  eyeballed). Destroyed structures leave persistent wreck art on
  the field: 15 of 23 structure types have a dedicated wreck sprite
  (the 4 turret types share one), the other 8 use generic rubble.
- Order buttons in the command tray carry small icons (move,
  attack-move, hold, patrol, salvage, guard, Drop Back In) next to
  their text labels, which are unchanged.
- HP bars and the hero badge (CMD N) have minimum on-screen sizes
  at all zooms; the smallest units' HP bars are still hidden below
  0.6x zoom by the intact far-zoom rule.
- Thin-chassis treatment: at zoom 1 and below, the thinnest units
  (lancer, longshot) render with a contrast underlay so they read
  against ground texture. This is a rendering aid, not sprite art.
- Wired blue-vs-red silhouettes: all 49 wired units now match at
  IoU 0.85 or better (lancer 0.9015, rampart 0.9331, the rest
  1.0000 by derivation from the blue sprite). Derived reds are the
  blue unit with red markings (accent swap + warm body tint + red
  edge band), not independently painted red hulls — see
  `game/WIRED-SPRITE-FIX-REPORT.md`. The wave-1 `mechs/` fixes do
  NOT reach the game (the game loads only `sprites-90/units/`);
  that folder is unwired reference.
- Known visual limits, stated not hidden: structure wreck art
  carries a slight relief angle, not pixel-perfect flat 90-degree;
  wall-red dots do not read as dots in-game because the renderer
  draws walls square by radius while the wall asset is a wide
  strip (pre-existing aspect mismatch); order icons have solid
  backgrounds; no real-phone visual verification exists yet.

Third Map — Forest Belt and Easy/Normal/Hard difficulty (above)
ship in the same v1.5 build. APK v1.5 (versionCode 6) is the final
build of this loop. v1.4 on the phone already carried Cycle 3 and
Twin-Stick Phases A/B/C; v1.5 adds the third map, difficulty, the
graphics upgrade, the wired-sprite fix, and the beta wave-2 fixes
on top of all of that.

Wave-3 graphics + beta (final state, v1.6)
- Structure sprites finally display: the v1.5 renderer drew each
  structure sprite then covered it with an opaque team-colour
  block. In wave 3 the block is fallback-only (used when a sprite
  is missing) and ready sprites get a thin team frame instead —
  no aspect change anywhere (wall strip scales uniformly).
- Structure wrecks: all 23 types now have dedicated wreck art
  (was 15 dedicated + 8 generic rubble in v1.5); flatter
  turret/bunker/wall wrecks installed. The command_core wreck
  stays angled — a flat version read as faction colour, so the
  old angled wreck is kept deliberately, not by oversight.
- UI icons: all 7 order icons are now keyed to transparency
  (same filenames and wiring as v1.5).
- Painted reds, narrowed not closed: combat_drone-red and
  vespid_scout-red are now fully painted generated hulls.
  43 derived reds remain (16 generation attempts failed the
  IoU 0.85 gate, 27 not attempted) — derived reds are blue units
  with red markings, disclosed in game/GRAPHICS-WAVE3-REPORT.md.
- Old notes closed: warden-red bottom protrusion fixed (8 px
  speck removed); vespid prongs and transparent structure yards
  confirmed non-defects; light_factory specks closed.
- Known visual limits, stated not hidden: 43 derived reds (above);
  8 old command-core-family wrecks angled for identity; wall
  dots sub-pixel at zoom 1 by geometry; no real-phone visual
  verification exists yet.
- Browser proof, wave 3: hero-death wreck count and info-panel
  HP live refresh both proven in the browser; victory and draw
  panels rendered through the shipped showVictory function in a
  seeded-terminal-state browser run (match 1 victory itself
  seeded; everything after it is real UI flow — win arc to
  level 2, Dash equipped, second match started and drawn);
  an unseeded played victory is still unproven by any driver.
  Balance: no tune in wave 3 — scripted competent play wins;
  browser losses trace to driver play, not a proven imbalance
  (see game/BETA-REPORT-WAVE3.md).
- APK v1.6 (versionCode 7) is the wave-3 build: same package and
  debug keystore as v1.5, so it installs over v1.5 in place.
- Minimap centring bug, fixed in wave 3 (game/game.js newGame):
  after the tutorial zoomed to 1.25 and a new map was started,
  camera.viewTilesX/Y stayed at the 1.25 values (24.5/19.1 for a
  980x764 stage) because updateViewTiles() only ran while zoom
  animated, on resize, or at one tutorial call site. Minimap
  centring (miniPan) and the minimap viewport rectangle use
  viewTiles, so taps centred ~2.4 tiles south of the intended
  tile. newGame now calls updateViewTiles() right after its zoom
  reset; finger/mouse taps were never affected (screenToWorld
  uses camera.zoom, not viewTiles). Full beta 44/44 green after
  this fix plus two harness-only check fixes (west drives for
  twin-stick and hero-cycle, which previously drove fragile
  units east into enemy fire and measured combat damage as if
  it were a control/preservation failure).

12-hour improvement cycle (final state, v1.7)
- What the cycle adds on top of v1.6, with nothing removed:
  tuned hero weapons (named rows 123 → 125, the 2 new rows being
  Wave 4 premium rows; 12 family baselines unchanged; L1 anchor
  and L10 ceilings unchanged); 8 new mechs (units 49 → 57:
  bastion, gatekeeper, deadeye, mortarjack for Iron Eden;
  needlewing, longsight, javelin, raptor for Xandria; all
  producible under the existing Prototype 03 filter); hero
  upgrades (skills 8 → 10: Rapid Servos and Concussive Pulse;
  gear rows 12 → 16 with trade-off choices inside a slot/tier;
  mastery ranks M1–M5 past level 10, points only, no stat
  growth); one earnable currency, Salvage Credits
  (wallet key surfacewars.wallet.v1, separate from the hero
  record; win 120 / draw 60 / loss 30 plus up to +100 from hero
  killing blows; match end only); a 4-pack Premium Store
  (Ember Line 350, Gilded Reach 450, Bulwark March 300,
  Storm Cell 600; full refund before first use, no refund
  after use; level gates never bypassed by ownership).
  Real-money purchases are NOT live: there is no checkout, no
  real-currency price, and no payment provider in this build.
- Tutorial II — Twin-Stick & Hero: a second tutorial with its
  own main-menu button. First Map, red side held, hero in
  reserve (9v10 opening, as in a real match). 6 steps: Take
  Control, Drive, Aim and fire, Release Control, Drop Back In,
  Premium Store (viewing only — no purchase is required or
  made). Restart restarts tier 2 from step 1; Next is a
  fallback, and the by-doing path advances by action.
- Tutorial economy rule (Wave 6 fix of a Wave 5 note): tutorials
  grant neither hero XP nor Salvage Credits, and starting a
  tutorial with a pack equipped never marks the pack used — so
  a refund stays available after a tutorial. A real match
  started with a pack equipped still marks it used, and
  refund-after-use stays blocked. Both directions were proven
  in the browser in Wave 6.
- Red AI and the new mechs: the red AI never fields the 8 new
  types in shipped matches, by decision, not oversight (Wave 6
  measured 0 new-type spawns in 14 shipped-rule matches; the
  rule only reaches new types past 18 live cheap units). New
  types stay player-producible. No AI change ships with this.
- Balance, honestly stated: no retune ships in this cycle.
  Under the Wave 1 sweep rule (a loadout sweeps only if it
  wins every map the default fails to win), the Wave 6
  multi-seed follow-up (3 seeds x 2 maps x 10 loadouts)
  found NO every-seed sweep. Helios is the strongest open
  signal (5/6 wins) but its mechanism is unpinned: a bounded
  range retune (10 → 9 tiles) re-ran byte-identical and was
  reverted as a placebo. Gilded Reach, retuned down twice in
  Wave 4, was left as-is by Wave 6 (price still 450).
- APK v1.7 (versionCode 8) is the cycle's final build: same
  package and debug keystore as v1.6, so it installs over
  v1.6 in place. Bundle re-derived: 14 game files (currency.js
  included — the file Wave 5 had to add to the staging list)
  + 437 asset files (430 -512 sprites + 7 UI icons).
- Still open, stated not hidden: real-phone verification of
  every kind (launch, touch, pinch, performance, twin-stick
  feel, hero persistence across the update install); an
  unseeded played browser victory (victory and draw panels
  share showVictory() with the repeatedly rendered defeat
  panel, and Wave 3 rendered the victory panel through the
  shipped function in a seeded-terminal-state run); Helios
  mechanism unpinned; 43 derived reds; 8 angled
  command-core-family wrecks; wall dots sub-pixel at zoom 1;
  release signing and any store step.
