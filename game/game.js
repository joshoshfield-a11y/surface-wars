/* Surface Wars — browser shell: input, camera, menus, fixed-timestep loop.
   Player faction is Iron Eden. Xandria (red) is driven entirely by
   the sim-side AI in sim.js: Generation Cycle 2 combat decisions
   (defend / gather / attack / fall-back squads, see Sim.runAiCombat)
   plus the Prototype 03 economy (production + salvage, same rules as
   the player, see Sim.runAiEconomy). There is no browser combat
   driver: the old periodic attack-move trickle was removed in
   Cycle 2, so headless tests and the browser run the same AI. */
(function () {
  'use strict';
  var Sim = window.SWSim, Render = window.SWRender, catalog = window.SWCatalog;
  var Anim = window.SWAnim, Assets = window.SWAssets, Maps = window.SWMaps;
  var View = window.SWView || null;
  var Weapons = window.SWWeapons || null, Hero = window.SWHero || null, Prog = window.SWProgression || null;
  var Curr = window.SWCurrency || null;
  var PLAYER = 'iron_eden';
  var canvas = document.getElementById('view');
  var ctx = canvas.getContext('2d');
  var mini = document.getElementById('minimap');
  var mctx = mini.getContext('2d');
  var statusEl = document.getElementById('status');
  var bannerEl = document.getElementById('banner');
  var feedbackEl = document.getElementById('feedback');
  var camera = { x: 0, y: 0, zoom: 1, targetZoom: 1, viewTilesX: 20, viewTilesY: 12 };
  // Wave-2 DPR sizing: the canvas backing store is CSS size x DPR
  // (capped at 2) while ALL game logic (camera, taps, stick zones,
  // viewTiles) keeps working in CSS pixels. viewCssW/H are the CSS
  // sizes; viewDpr is the applied scale. drawScene is called with CSS
  // sizes under a ctx transform of viewDpr, so one draw call paints
  // the full backing store crisply.
  var viewCssW = 0, viewCssH = 0, viewDpr = 1;
  var structureWrecks = []; // render-layer only: persistent structure
  // wrecks for this match (mirrors the sim unit-wreck pattern, but
  // lives here, not in sim state). Cleared on newGame; never a sim
  // entity, never blocks movement, never selectable.
  var zoomAnim = null;
  var selected = []; // unit + structure ids (player side only)
  var selectedWreckId = null; // sim wreck id, independent of unit selection
  var groups = View ? View.createGroups() : {};
  var mode = 'move'; // move | attackMove | hold | patrol | salvage | guard
  var pendingPatrol = null; // {x,y} first patrol point, awaiting the second tap
  // Prototype 03: on-screen group buttons + rally mode.
  var groupAssignMode = false; // Assign toggle on: next group-button tap assigns, then switches off
  var rallyMode = false, rallyCoreId = 0; // Set Rally clicked: next ground tap sets that core's rally
  var panMode = false; // Pan/Select toggle: when on, mouse drag pans instead of selecting
  var addMode = false; // Add-to-Selection: touch/mouse unit taps add instead of replacing
  // v1.8: Select mode is the touch mirror of Pan mode. When on, a
  // touch drag draws a selection rectangle instead of panning.
  // Default stays pan-on-drag, so existing behaviour is unchanged
  // unless the player opts in. Persists across matches like Pan/Add
  // (newGame deliberately does not reset it).
  var selectMode = false;
  // Mobile-first finish: Queue mode is the touch equivalent of Shift+click.
  // Unlike Shift it STAYS ON until tapped again, so several waypoints can
  // be queued in a row on touch. See View.queueAppend (pure, tested).
  var queueMode = false;
  var showPaths = true, showFX = true, showShadows = true, showMinimap = true;
  var pathFlashUntil = 0;
  var state = null;
  var currentMap = 'first';
  var overlayMap = null;
  var effects = [];
  var lastMuzzle = {}, lastDust = {};
  // Menu state: exactly one overlay family is open at a time. The sim
  // runs ONLY when no menu is open and no winner has been declared.
  var mainMenuOpen = true, pauseMenuOpen = false, settingsOpen = false,
      howtoOpen = false, victoryShown = false, settingsReturn = 'pause'; // 'pause' | 'main'
  // Tutorial: null in normal games; an object while a tutorial runs.
  // The red side is HELD in a tutorial game (see setupTutorialScenario):
  // state.tutorial gates the sim AI economy AND the sim AI combat, so
  // no red production, salvage, or combat order ever runs.
  var tutorial = null, tutorialEndOpen = false, lastTutText = '';
  // Tutorial II (Wave-5): a SEPARATE object from `tutorial` on purpose.
  // Tier 1 hides Take Control (view.js takeControlState, and the
  // enterControl / pressDropBackIn / syncDropButtons gates, all read
  // `tutorial`), and tier 2 exists to teach exactly those controls —
  // so tier 2 must leave `tutorial` null and carry its own flag.
  // The sim-side hold still works: setupTutorial2Scenario sets
  // state.tutorial = true, which gates the sim AI economy + combat
  // (sim.js), exactly like tier 1. The two tutorials never run
  // together: startTutorial clears tutorial2, startTutorial2 clears
  // tutorial, and Skip / Back-to-menu / Play-a-real-game clear
  // whichever one is running (openMainMenu / startMap hooks below).
  var tutorial2 = null, lastTut2Text = '';
  var lastPanelSig = '';
  // Mobile-first finish: tap fall-through guard. A tap that OPENS a panel
  // (e.g. tapping the Command Core) can otherwise trigger a button in
  // that panel: the browser's mouse-compatibility click for the same tap
  // lands after the panel renders under the tap point (found in mobile
  // emulation: a core tap queued a Vespid Scout it never meant to buy).
  // Panel buttons therefore ignore clicks within 350 ms of the panel
  // first appearing; a real second tap is always later than that.
  var panelShownAt = 0, wasInfoShown = false, wasBuildShown = false;
  // The fall-through click follows a CANVAS tap, and the panel may
  // already have been open (re-selection does not reset panelShownAt),
  // so the guard also covers any canvas tap within 350 ms. A genuine
  // panel tap is always a separate, later tap.
  var lastCanvasTapAt = 0;
  function panelClickGuard() {
    var now = Date.now();
    return (now - panelShownAt < 350) || (now - lastCanvasTapAt < 350);
  }

  // ---- Twin-Stick Phase A: manual control (shell state only) ----
  // controlUnitId is 0 when not controlling. The control flag itself
  // lives in the sim (Sim.setManualControl) and is NEVER read by the
  // red AI — the AI iterates xandria units only, and a controlled
  // unit is always an iron_eden unit, so it is treated as an
  // ordinary enemy unit. Sticks are tracked by pointer id: two
  // thumbs plus a button tap are three simultaneous pointers.
  var controlUnitId = 0;
  var controlSticks = new Map(); // pointerId -> {zone, ox, oy, dx, dy, mag, active}
  var controlKeys = {}; // 'w'/'a'/'s'/'d' held (desktop)
  var mouseAim = { x: 0, y: 0, firing: false, seen: false };
  var lastControlStripText = '';
  // ---- Twin-Stick Phase C: hero progression record ----
  // (Phase B: hero (Command Mech, placeholder name) with a
  // session-only loadout. Phase C replaces that with the persistent
  // record below; the reserve model itself is unchanged.)
  // heroEnabled is the Settings toggle, default ON (PROPOSED). It
  // applies at the NEXT match start only — toggling mid-match never
  // removes or adds a hero to the match in progress. heroRecord is
  // the single versioned record (key surfacewars.hero.v1, schema 1)
  // in localStorage on web / DOM storage in the APK WebView; it is
  // read at the main menu before a new match and written at match
  // end, when skill points are spent or respec'd, and when the
  // loadout is saved — NEVER every tick, NEVER mid-match for XP.
  // Quitting mid-match earns no XP. heroLoadout mirrors the
  // record's loadout for the next match. hero is the per-match
  // SWHero state, or null when the hero is off, the map is the Test
  // Map, or the game is a tutorial. HERO_BASE is verified against
  // data/catalog.json: the lancer_mech row is HP 200, Medium,
  // speed 6.0, vision 8 — NOT the spec's proposed vision 10, which
  // was unconfirmed and is not used. The hero's wreck basis is its
  // 380 catalog scrap cost. A missing record is a fresh level-1
  // hero (no notice); a present-but-unreadable or failing-
  // validation record resets to level 1 WITH the plain notice on
  // the main menu, never a crash, never a blocked menu, never a
  // silently kept half-valid record. A storage access error is
  // treated like an unreadable record (reset + notice).
  var heroRecord = null, heroRecordReset = false, heroLevel = 1;
  var heroMatch = false, matchXpWritten = false;
  function loadHeroRecord() {
    if (!Prog || !Weapons) return null;
    var raw = null, readFailed = false;
    try {
      raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(Prog.RECORD_KEY) : null;
    } catch (e) { readFailed = true; }
    if (raw === null && !readFailed) return Prog.defaultRecord();
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    var v = parsed ? Prog.validateRecord(parsed, Weapons) : { ok: false, reasons: ['Record is not readable.'] };
    if (v.ok) return Prog.cloneRecord(parsed);
    heroRecordReset = true;
    return Prog.defaultRecord();
  }
  function saveHeroRecord() {
    if (!heroRecord || !Prog) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(Prog.RECORD_KEY, JSON.stringify(heroRecord));
    } catch (e) { /* storage unavailable: progress lives in memory this session; never crash */ }
    heroRecordReset = false;
  }
  // ---- WAVE 4 (CURRENCY-12H): Salvage Credits wallet ----
  // A SEPARATE versioned record (key surfacewars.wallet.v1) from
  // the hero record: same corruption pattern (missing = fresh, no
  // notice; unreadable/invalid = reset to 0 with a plain notice,
  // never a crash, never a blocked menu), same write discipline
  // (match end + purchase/refund/equip only, never every tick,
  // never mid-match). The hero record key/schema are untouched.
  var wallet = null, walletReset = false;
  function loadWallet() {
    if (!Curr) return null;
    var raw = null, readFailed = false;
    try {
      raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(Curr.WALLET_KEY) : null;
    } catch (e) { readFailed = true; }
    if (raw === null && !readFailed) return Curr.defaultWallet();
    var parsed = Curr.parseWallet(readFailed ? '{corrupt' : raw);
    walletReset = parsed.reset;
    return parsed.wallet;
  }
  function saveWallet() {
    if (!wallet || !Curr) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(Curr.WALLET_KEY, JSON.stringify(wallet));
    } catch (e) { /* storage unavailable: wallet lives in memory this session; never crash */ }
    walletReset = false;
  }
  // Premium weapon ids the wallet currently owns (through its owned
  // packs). Used as validateLoadout's premiumOwnedIds so the free
  // loadout screen cannot bypass the store.
  function ownedPremiumIds() {
    if (!Curr || !wallet || !Weapons || !Weapons.PREMIUM_ROW_IDS) return [];
    var ids = [];
    wallet.owned.forEach(function (pid) {
      var p = Curr.packById(pid);
      if (!p) return;
      Curr.packWeaponIds(p).forEach(function (wid) {
        if (Weapons.PREMIUM_ROW_IDS.indexOf(wid) !== -1 && ids.indexOf(wid) === -1) ids.push(wid);
      });
    });
    return ids;
  }
  function walletTierOf(id) {
    if (!Weapons) return null;
    var r = Weapons.rowById(id);
    if (r) return r.tier;
    var g = Weapons.gearById(id);
    return g ? g.tier : null;
  }
  function syncMainMenuHero() {
    var st = $('mm-hero-status'), no = $('mm-hero-notice');
    if (st && heroRecord) {
      var pts = heroRecord.skillPoints === 1 ? '1 skill point unspent' : heroRecord.skillPoints + ' skill points unspent';
      st.textContent = 'Command Mech — Level ' + heroRecord.level + ' | ' + heroRecord.xp + ' XP | ' +
        pts + ' | ' + heroRecord.matchesPlayed + ' matches, ' + heroRecord.wins + ' wins' +
        (heroRecord.heroEnabled ? '' : ' | Hero off (original 10v10)');
    }
    if (no) no.textContent = heroRecordReset ? 'Hero progress could not be read, so it was reset to level 1.' : '';
    var ws = $('mm-wallet-status'), wn = $('mm-wallet-notice');
    if (ws && wallet && Curr) {
      ws.textContent = Curr.CURRENCY_NAME + ': ' + wallet.balance +
        (wallet.equipped && Curr.packById(wallet.equipped) ? ' | Equipped pack: ' + Curr.packById(wallet.equipped).name : '');
    }
    if (wn) wn.textContent = walletReset ? Curr.RESET_NOTICE : '';
  }
  heroRecord = loadHeroRecord();
  wallet = loadWallet();
  var heroEnabled = heroRecord ? heroRecord.heroEnabled : true;
  var heroLoadout = (Weapons && heroRecord) ? Weapons.cloneLoadout(heroRecord.loadout) : (Weapons ? Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT) : null);
  if (heroRecord) heroLevel = heroRecord.level;
  var hero = null;
  var tutorialStarting = false;
  var tutorial2Starting = false;
  // WAVE 6 (BETA-12H): tutorial2Starting mirrors tutorialStarting
  // for tier 2. Tier 2 NEEDS the hero branch (the hero in reserve
  // is what step 5 teaches), so it must NOT skip hero setup the
  // way tier 1 does — but it must still never mark a pack used
  // or grant currency/XP (see the newGame mark-used block and the
  // showVictory grant block). It is set only around startTutorial2's
  // newGame call; a Restart inside tier 2 is covered separately by
  // the tutorial2-non-null check in the mark-used block.
  // Gameplay Completion: difficulty, SESSION MEMORY ONLY — no new
  // persistence store (the hero record is the only stored game
  // state, and difficulty deliberately does not join it: it resets
  // to Normal on page reload). 'easy' | 'normal' | 'hard', default
  // 'normal' = shipped AI behaviour exactly. Applies at the NEXT
  // match start only (newGame copies the param set onto the fresh
  // state); changing it mid-match never touches the match in
  // progress. Tutorial games always get Normal (newGame forces it
  // — and the tutorial AI gate would hold the red side anyway).
  var difficulty = 'normal';
  function setDifficulty(level) {
    if (level !== 'easy' && level !== 'normal' && level !== 'hard') return;
    difficulty = level;
    syncDifficultyUI();
  }
  function syncDifficultyUI() {
    var st = $('mm-diff-status');
    if (st) st.textContent = 'Difficulty: ' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1) +
      ' (red AI behaviour only — same costs, same economy, same unit stats; applies at the next match start)';
    ['easy', 'normal', 'hard'].forEach(function (lv) {
      var b = $('mm-diff-' + lv);
      if (b) b.classList.toggle('active', difficulty === lv);
    });
  }
  var loadoutOpen = false;
  var lastDropSig = '';
  var HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
  var HERO_COST_SCRAP = 380;
  function controlledUnit() {
    if (!state || !controlUnitId) return null;
    var u = state.units.filter(function (x) { return x.id === controlUnitId; })[0];
    return (u && u.alive) ? u : null;
  }
  function resetControlUI() {
    controlUnitId = 0; controlSticks.clear(); controlKeys = {};
    mouseAim = { x: 0, y: 0, firing: false, seen: false };
    document.body.classList.remove('controlling');
    bannerEl.textContent = '';
    lastPanelSig = ''; lastControlStripText = '';
  }
  function enterControl() {
    if (!state || tutorial) return;
    if (controlUnitId) {
      // Twin-Stick Phase B, hero transfer: taking control of another
      // unit while the hero is controlled withdraws the hero to
      // reserve AT THE SAME MOMENT control transfers — never both a
      // controlled unit and a field hero. Any other controlled unit
      // blocks entry, as in Phase A.
      if (hero && hero.unitId === controlUnitId) withdrawHero();
      else return;
    }
    if (selected.length !== 1) return;
    var u = state.units.filter(function (x) { return x.id === selected[0]; })[0];
    if (!u || u.faction !== PLAYER || !u.weapons.length) return;
    if (!Sim.setManualControl(state, u.id).ok) return;
    controlUnitId = u.id; controlSticks.clear(); controlKeys = {};
    mouseAim = { x: 0, y: 0, firing: false, seen: false };
    document.body.classList.add('controlling');
    bannerEl.textContent = 'Manual control — left stick moves, right stick aims and fires. Release Control returns to RTS orders.';
    lastPanelSig = '';
  }
  // Release: the unit takes a HOLD order at its current position, its
  // path and order queue are cleared (Sim.clearManualControl does
  // both), the selection is preserved, and no pre-mode order resumes
  // silently — the old order was cleared on entry and is gone.
  // Twin-Stick Phase B difference (reserve model, not a Phase A
  // change): releasing the HERO does not give it a hold order — it
  // withdraws to reserve, keeping its exact HP, with no wreck and no
  // scrap for either side. That branch is withdrawHero, below.
  function releaseControl() {
    if (!controlUnitId) return;
    if (hero && hero.unitId === controlUnitId) { withdrawHero(); return; }
    var u = state.units.filter(function (x) { return x.id === controlUnitId; })[0];
    if (u && u.alive) Sim.clearManualControl(state, u.id);
    resetControlUI();
  }
  // Twin-Stick Phase B: withdraw the field hero to reserve. The unit
  // leaves the sim's field lists entirely (Sim.withdrawUnit, no
  // wreck), so the red AI cannot target it, the elimination check
  // cannot count it, and the deadlock detector cannot see it — the
  // reserve model is an absence, never a hidden invulnerable unit.
  function withdrawHero() {
    if (!hero || !hero.unitId) return;
    var u = state.units.filter(function (x) { return x.id === hero.unitId; })[0];
    var hp = (u && u.alive) ? u.hp : (hero.hp !== null ? hero.hp : HERO_BASE.hp);
    if (u && u.alive) Sim.withdrawUnit(state, hero.unitId);
    Hero.withdraw(hero, hp, state.tick);
    resetControlUI();
    sayFeedback('Command Mech withdrawn to reserve. Drop Back In when ready.');
  }
  function heroCore() {
    if (!state) return null;
    var cores = state.structures.filter(function (s) { return s.faction === PLAYER && s.typeId === 'command_core' && s.alive; });
    return cores[0] || null;
  }
  function heroDropFacts() {
    var core = heroCore();
    var tile = null;
    if (core) { var pos = Sim.spawnPosition(state, core, 'ground'); if (pos) tile = pos; }
    return { coreAlive: !!core, scrap: Sim.scrapOf(state, PLAYER), tick: state.tick, dropTile: tile };
  }
  // Twin-Stick Phase B: Drop Back In, the hero's ONLY entry (it has no
  // Take Control path — it is not on the field to select). Pressing
  // it while controlling a non-hero unit releases that unit to a hold
  // order first, then drops the hero in its place. The drop location
  // is the nearest passable tile to the player's own Command Core via
  // the existing production spawn search — the player never chooses
  // the tile, so the hero cannot teleport past the First Map bridge
  // or the Twin Bridges lake. Cost is paid at press (death path);
  // a match ending during the telegraph refunds it and cancels.
  function pressDropBackIn() {
    if (!state || !hero || tutorial) return;
    // Check first, release second: a failed drop (cooldown, scrap,
    // no tile) must not release the unit the player is controlling.
    var facts = heroDropFacts();
    var res = Hero.canDrop(hero, facts);
    if (!res.ok) { sayFeedback(res.reason); return; }
    if (controlUnitId && !(hero.unitId === controlUnitId)) releaseControl();
    if (hero.status === 'dead') hero.hp = null; // a redeployed hero is a fresh deployment at full HP
    if (res.cost > 0) state.scrap[PLAYER] = Sim.scrapOf(state, PLAYER) - res.cost;
    Hero.startDrop(hero, facts.dropTile, state.tick, res.cost);
    sayFeedback('Command Mech dropping in near your Command Core.');
  }
  // Drop button sync (tray + control strip), DOM touched only when
  // the displayed state changes. Tray button: always visible while a
  // hero match runs, disabled WITH A REASON. Strip button: only while
  // controlling a non-hero unit (the hero's own strip has no drop
  // button — it is already on the field). Hidden entirely in
  // tutorials and hero-off / Test Map games (hero is null there).
  function syncDropButtons() {
    var tray = $('btn-drop-back'), strip = $('btn-ctl-drop');
    if (!tray && !strip) return;
    if (!state || !hero || tutorial) {
      if (tray) tray.style.display = 'none';
      if (strip) strip.style.display = 'none';
      lastDropSig = '';
      return;
    }
    var res = Hero.canDrop(hero, heroDropFacts());
    var waitSec = res.kind === 'cooldown' ? Math.ceil((res.waitTicks || 0) / 20) : 0;
    var sig = hero.status + '|' + res.kind + '|' + waitSec + '|' + (res.kind === 'scrap' ? Sim.scrapOf(state, PLAYER) : '') + '|' + (controlUnitId || 0);
    if (sig === lastDropSig) return;
    lastDropSig = sig;
    // The disabled reason is the button LABEL, not just a title
    // tooltip: phones have no hover, so a tooltip-only reason would
    // be invisible exactly where it matters. Enabled: 'Drop Back In'.
    // Label swaps must preserve the prepended order icon (addOrderIcons):
    // textContent assignment destroys child nodes, so re-attach it.
    function setDropLabel(btn, label) {
      var icon = btn.querySelector('.cmd-icon');
      btn.textContent = label;
      if (icon) btn.insertBefore(icon, btn.firstChild);
    }
    if (tray) {
      tray.style.display = '';
      tray.disabled = !res.ok;
      tray.title = res.reason;
      setDropLabel(tray, res.ok ? 'Drop Back In' : res.reason.replace(/\.$/, ''));
    }
    if (strip) {
      var showStrip = !!controlUnitId && hero.unitId !== controlUnitId;
      strip.style.display = showStrip ? '' : 'none';
      strip.disabled = !res.ok;
      strip.title = res.reason;
      setDropLabel(strip, res.ok ? 'Drop Back In' : res.reason.replace(/\.$/, ''));
    }
  }
  // Twin-Stick Phase C: equipped active ability (Ability 1).
  // The button lives on the control strip and is shown ONLY for a
  // controlled hero: non-hero controlled units keep it hidden, as
  // in Phase A. A hero with no equipped active skill gets a
  // DISABLED button whose label IS the reason ("No ability
  // equipped") — never a dead button, never a hidden mystery.
  // Cooldowns are visible in the label (seconds remaining, or
  // Ready). Desktop: Q or 1 while controlling the hero fires it;
  // there is no second ability control because the ability slot
  // holds exactly one equipped active skill (E/2 do nothing).
  var lastAbilityText = '';
  function equippedAbility() {
    if (!hero || !hero.loadout) return null;
    return hero.loadout.ability || null;
  }
  function pressAbility() {
    if (!controlUnitId || !hero || hero.unitId !== controlUnitId) return;
    var ab = equippedAbility();
    if (!ab) { sayFeedback('No ability equipped — equip one in the Hero Loadout screen between matches.'); return; }
    var res = Sim.activateSkill(state, controlUnitId, ab, state.tick);
    sayFeedback(res.ok ? (Prog.skillById(ab).name + ' used.') : res.reason);
    lastAbilityText = '';
  }
  function syncAbilityButton() {
    var btn = $('btn-ctl-ability'); if (!btn) return;
    var isHeroControlled = !!(controlUnitId && hero && hero.unitId === controlUnitId);
    if (!isHeroControlled) { btn.style.display = 'none'; lastAbilityText = ''; return; }
    btn.style.display = '';
    var ab = equippedAbility();
    var text;
    if (!ab) text = 'No ability equipped';
    else {
      var rem = Sim.skillCooldownRemaining(state, controlUnitId, ab);
      var nm = Prog ? Prog.skillById(ab).name : ab;
      text = rem > 0 ? nm + ' (' + Math.ceil(rem / 20) + 's)' : nm + ' — Ready';
    }
    if (text !== lastAbilityText) {
      lastAbilityText = text;
      btn.textContent = text;
      btn.disabled = !ab || (ab && Sim.skillCooldownRemaining(state, controlUnitId, ab) > 0);
      btn.title = ab ? text : 'No ability equipped — equip one in the Hero Loadout screen between matches.';
    }
  }
  // Silent exit (death, victory panel, quit, new game): same state
  // reset, but no feedback text and no hold order for a unit that is
  // already gone. Callers that need the selection cleared (death) do
  // that themselves.
  function exitControlSilent() {
    if (controlUnitId) {
      var u = state.units.filter(function (x) { return x.id === controlUnitId; })[0];
      if (u && u.alive) Sim.clearManualControl(state, u.id);
    }
    resetControlUI();
  }
  function syncTakeControlButton() {
    var btn = $('btn-take-control');
    if (!btn) return;
    if (tutorial || controlUnitId) { btn.style.display = 'none'; return; }
    btn.style.display = '';
    var isStructure = false, hasWeapon = false;
    if (selected.length === 1) {
      var ent = state.units.filter(function (x) { return x.id === selected[0]; })[0];
      if (ent) hasWeapon = ent.weapons.length > 0;
      else isStructure = !!state.structures.filter(function (x) { return x.id === selected[0]; })[0];
    }
    var st = View ? View.takeControlState(selected.length, isStructure, hasWeapon, !!tutorial)
      : { ok: selected.length === 1 && !isStructure && hasWeapon, reason: '' };
    btn.disabled = !st.ok;
    btn.title = st.reason;
  }
  function computeControlInput(u) {
    var move = { x: 0, y: 0 };
    controlSticks.forEach(function (st) {
      if (st.zone === 'left' && st.active) { move.x = st.dx; move.y = st.dy; }
    });
    var kx = 0, ky = 0;
    if (controlKeys['a']) kx -= 1;
    if (controlKeys['d']) kx += 1;
    if (controlKeys['w']) ky -= 1;
    if (controlKeys['s']) ky += 1;
    if (kx || ky) { var kl = Math.hypot(kx, ky); move.x = kx / kl; move.y = ky / kl; }
    var aimAngle = null, firing = false, aimFound = false;
    controlSticks.forEach(function (st) {
      if (st.zone === 'right' && st.active) { aimAngle = Math.atan2(st.dy, st.dx); firing = true; aimFound = true; }
    });
    if (!aimFound && mouseAim.seen) {
      var mw = screenToWorld(mouseAim.x, mouseAim.y);
      aimAngle = Math.atan2(mw.y - u.y, mw.x - u.x);
      firing = mouseAim.firing;
    }
    return { move: move, aimAngle: aimAngle, firing: firing };
  }

  function $(id) { return document.getElementById(id); }
  function showOverlay(id, on) { var el = $(id); if (el) el.style.display = on ? 'flex' : 'none'; }
  function simRunning() {
    return state && !mainMenuOpen && !pauseMenuOpen && !settingsOpen && !howtoOpen && !victoryShown && !tutorialEndOpen && !state.winner;
  }
  function hideTutorialUI() {
    var bar = $('tutorial-bar'); if (bar) bar.style.display = 'none';
    showOverlay('tutorial-end', false);
  }
  function exitTutorial() {
    // Leaves the tutorial game behind entirely: the flag on the old
    // state is cleared too, so a stale tutorial state can never be
    // resumed into a normal game.
    if (state) state.tutorial = false;
    tutorial = null; tutorialEndOpen = false;
    hideTutorialUI(); bannerEl.textContent = '';
  }
  function openMainMenu() {
    // Quit to menu cancels twin-stick mode entirely (no hold order
    // survives into a fresh game; the state is replaced anyway).
    // Quitting mid-match earns NO hero XP: the record is written
    // at match end only (showVictory), never here.
    // Skip / Back-to-menu clear EITHER tutorial (tier 1 via
    // exitTutorial, tier 2 via exitTutorial2) — see the tier-2
    // cleanup contract in the Tutorial II block.
    if (controlUnitId) resetControlUI();
    exitTutorial(); exitTutorial2();
    syncMainMenuHero();
    syncDifficultyUI();
    mainMenuOpen = true; pauseMenuOpen = false; settingsOpen = false; howtoOpen = false;
    showOverlay('main-menu', true); showOverlay('pause-menu', false);
    showOverlay('settings-panel', false); showOverlay('howto-panel', false);
    showOverlay('victory-panel', false); showOverlay('store-panel', false);
  }
  function openPauseMenu() {
    if (mainMenuOpen || victoryShown) return;
    pauseMenuOpen = true; settingsOpen = false; howtoOpen = false;
    showOverlay('pause-menu', true); showOverlay('settings-panel', false); showOverlay('howto-panel', false);
  }
  function resumeGame() {
    pauseMenuOpen = false; settingsOpen = false; howtoOpen = false;
    showOverlay('pause-menu', false); showOverlay('settings-panel', false); showOverlay('howto-panel', false);
  }
  function openSettings(ret) {
    settingsReturn = ret || 'pause'; settingsOpen = true;
    showOverlay('settings-panel', true); syncSettingsUI();
  }
  function closeSettings() {
    settingsOpen = false; showOverlay('settings-panel', false);
    if (settingsReturn === 'main' && mainMenuOpen) showOverlay('main-menu', true);
    else if (!mainMenuOpen && !victoryShown) { pauseMenuOpen = true; showOverlay('pause-menu', true); }
  }
  // ---- Twin-Stick Phase C: hero loadout + skills screen (main menu only) ----
  // Between matches only: the loadout is read at the next newGame and
  // fixed for that match. Tier options above the hero's level band
  // (tier 1 at levels 1-3, tier 2 at 4-6, tier 3 at 7+) are listed
  // but disabled with the level they need — never silently hidden.
  // Skill buys and respec write the record IMMEDIATELY (the spec's
  // "written when skill points are spent"); loadout selects and the
  // equipped ability commit on Save. Pressing Back discards
  // un-saved loadout selects, never an already-spent skill point.
  var draftSkills = [], draftPoints = 0;
  function heroTierCap() { return (Prog && heroRecord) ? Prog.tierBand(heroRecord.level) : 1; }
  function ownedActiveIds() {
    if (!Prog || !heroRecord) return [];
    return heroRecord.skills.filter(function (id) { var s = Prog.skillById(id); return s && s.type === 'active'; });
  }
  function loSetOptions(id, rows, current, nullLabel, cap) {
    var el = $(id); if (!el) return;
    el.innerHTML = '';
    if (nullLabel) {
      var no = document.createElement('option');
      no.value = ''; no.textContent = nullLabel; el.appendChild(no);
    }
    rows.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.id;
      var locked = cap !== undefined && r.tier > cap;
      o.textContent = r.name + ' (tier ' + r.tier + ')' + (locked ? ' — needs hero level ' + (Prog ? Prog.tierMinLevel(r.tier) : r.tier) : '');
      if (locked) o.disabled = true;
      el.appendChild(o);
    });
    el.value = current || '';
  }
  function renderLoSkills() {
    var box = $('lo-skills'); if (!box || !Prog || !heroRecord) return;
    box.innerHTML = '';
    Prog.SKILLS.forEach(function (s) {
      var row = document.createElement('p');
      var unlocked = draftSkills.indexOf(s.id) !== -1;
      var txt = s.name + ' (' + s.type + ', needs level ' + s.gate + ') — ' + s.desc + ' ';
      if (unlocked) txt += '[Unlocked]';
      else if (s.gate > heroRecord.level) txt += '[Locked: needs hero level ' + s.gate + ']';
      else if (draftPoints < 1) txt += '[No unspent skill points]';
      else txt += '[1 point to unlock]';
      row.textContent = txt;
      box.appendChild(row);
      if (!unlocked && s.gate <= heroRecord.level && draftPoints >= 1) {
        var b = document.createElement('button');
        b.textContent = 'Unlock ' + s.name + ' (1 point)';
        (function (sid) { b.addEventListener('click', function () { buyLoSkill(sid); }); })(s.id);
        box.appendChild(b);
      }
    });
    var pts = document.createElement('p');
    // WAVE 3: mastery rank is display-only here — it changes no
    // stats and no gating; the rank is derived from XP, the
    // claimed count from the record. The skill list, ability
    // dropdown, and gear selects above are data-driven over
    // Prog.SKILLS / Weapons.GEAR_ROWS, so the new Wave 3 skills
    // and gear appear with no further screen changes, and the
    // ability strip stays single-slot (a newly unlocked active
    // simply becomes equippable like any other).
    var mRank = (Prog.masteryRankForXp ? Prog.masteryRankForXp(heroRecord.xp) : 0);
    pts.textContent = 'Unspent skill points: ' + draftPoints + ' | Level ' + heroRecord.level + ' | ' + heroRecord.xp + ' XP' +
      (mRank > 0 ? ' | Mastery ' + mRank + ' (' + (heroRecord.masteryClaimed || 0) + ' rank(s) claimed, points only — no stat growth)' : '');
    box.appendChild(pts);
    renderLoAbility();
  }
  function renderLoAbility() {
    var el = $('lo-ability'); if (!el) return;
    var cur = el.value;
    el.innerHTML = '';
    var no = document.createElement('option');
    no.value = ''; no.textContent = 'None (no equipped ability)'; el.appendChild(no);
    draftSkills.forEach(function (id) {
      var s = Prog.skillById(id);
      if (s && s.type === 'active') {
        var o = document.createElement('option');
        o.value = id; o.textContent = s.name; el.appendChild(o);
      }
    });
    // Keep the player's pick when it is still available; otherwise
    // fall back to the record's equipped ability, else None.
    el.value = (cur && draftSkills.indexOf(cur) !== -1) ? cur : ((heroRecord && heroRecord.loadout.ability && draftSkills.indexOf(heroRecord.loadout.ability) !== -1) ? heroRecord.loadout.ability : '');
  }
  function buyLoSkill(skillId) {
    if (!Prog || !heroRecord) return;
    var tmp = Prog.cloneRecord(heroRecord);
    tmp.skills = draftSkills.slice(); tmp.skillPoints = draftPoints;
    var res = Prog.buySkill(tmp, skillId);
    if (!res.ok) { var er = $('lo-errors'); if (er) er.textContent = res.reason; return; }
    heroRecord.skills = res.record.skills; heroRecord.skillPoints = res.record.skillPoints;
    draftSkills = heroRecord.skills.slice(); draftPoints = heroRecord.skillPoints;
    saveHeroRecord(); // skill points spent: written immediately, per spec
    renderLoSkills(); updateLoSummary();
  }
  function respecLoSkills() {
    if (!Prog || !heroRecord) return;
    heroRecord = Prog.respec(heroRecord);
    draftSkills = []; draftPoints = heroRecord.skillPoints;
    saveHeroRecord(); // respec is a spend action: written immediately
    renderLoSkills(); updateLoSummary();
  }
  function openLoadout() {
    if (!Weapons || !heroLoadout || !heroRecord) return;
    loadoutOpen = true;
    draftSkills = heroRecord.skills.slice(); draftPoints = heroRecord.skillPoints;
    showOverlay('main-menu', false); showOverlay('loadout-panel', true);
    var cap = heroTierCap();
    loSetOptions('lo-primary', Weapons.NAMED_WEAPONS.filter(function (w) { return w.slot === 'primary'; }), heroLoadout.primary, null, cap);
    loSetOptions('lo-secondary', Weapons.NAMED_WEAPONS.filter(function (w) { return w.slot === 'secondary'; }), heroLoadout.secondary, 'None (no secondary)', cap);
    // WAVE 4: premium rows the wallet does not own are listed but
    // disabled with their store source — never silently hidden,
    // never selectable without ownership. (A loadout that already
    // holds an unowned premium row — e.g. after a wallet reset —
    // stays selected but cannot Save until it is replaced; the
    // validator above refuses it with the store reason.)
    if (Weapons.PREMIUM_ROW_IDS) {
      var ownedPrem = ownedPremiumIds();
      ['lo-primary', 'lo-secondary'].forEach(function (sid) {
        var sel = $(sid); if (!sel) return;
        Array.prototype.forEach.call(sel.options, function (o) {
          if (Weapons.PREMIUM_ROW_IDS.indexOf(o.value) !== -1 && ownedPrem.indexOf(o.value) === -1) {
            o.disabled = true;
            if (o.textContent.indexOf('Premium Store') === -1) o.textContent += ' — Premium Store';
          }
        });
      });
    }
    ['armor', 'mobility', 'reactor', 'sensor'].forEach(function (slot) {
      loSetOptions('lo-' + slot, Weapons.GEAR_ROWS.filter(function (g) { return g.slot === slot; }), heroLoadout[slot], 'Standard (no bonus)', cap);
    });
    renderLoSkills();
    updateLoSummary();
  }
  function readLoLoadout() {
    function val(id) { var el = $(id); return el && el.value ? el.value : null; }
    return { primary: val('lo-primary'), secondary: val('lo-secondary'), armor: val('lo-armor'),
      mobility: val('lo-mobility'), reactor: val('lo-reactor'), sensor: val('lo-sensor'), ability: val('lo-ability') };
  }
  function updateLoSummary() {
    if (!Weapons) return { ok: false, reasons: ['Weapon data unavailable.'] };
    var l = readLoLoadout();
    var v = Weapons.validateLoadout(l, { chassis: 'Lancer', movementClass: 'ground',
      phaseTierCap: heroTierCap(), levelBand: true, allowAbility: true, ownedAbilityIds: ownedActiveIds(),
      premiumOwnedIds: ownedPremiumIds() });
    var errEl = $('lo-errors'), sumEl = $('lo-summary');
    if (errEl) errEl.textContent = v.ok ? '' : v.reasons.join(' ');
    if (sumEl) {
      if (!v.ok) sumEl.textContent = '';
      else {
        var st = Weapons.heroStats(l, HERO_BASE, { level: heroRecord ? heroRecord.level : 1, skills: draftSkills });
        sumEl.textContent = 'Level ' + (heroRecord ? heroRecord.level : 1) + ' | HP ' + st.maxHp + ' | Speed ' + st.speed + ' | Vision ' + st.vision +
          ' | Weapons: ' + (st.weapons.map(function (w) { return w.name; }).join(', ') || 'none');
      }
    }
    return v;
  }
  function closeLoadout() {
    loadoutOpen = false;
    showOverlay('loadout-panel', false); showOverlay('main-menu', true);
    syncMainMenuHero();
  }
  function saveLoadout() {
    var v = updateLoSummary();
    if (!v.ok) return; // reasons stay visible in the panel; nothing saved
    heroLoadout = readLoLoadout();
    if (heroRecord) {
      heroRecord.loadout = Weapons.cloneLoadout(heroLoadout);
      saveHeroRecord(); // loadout changed: written immediately, per spec
    }
    closeLoadout();
  }
  // ---- WAVE 4: Premium Store panel (main menu only) ----
  // Between matches only, like the loadout screen. Every button
  // does something or says why it cannot: Buy refuses when owned
  // (button becomes Equip instead) or when funds are short;
  // Equip refuses when tier-gated, naming the gated items and
  // the level each needs; Refund exists only for owned, never-
  // used packs and pays the full price back. No button leads to
  // real money: the panel states "Real-money purchases: not
  // live" and there is no checkout, no real-currency price, and
  // no payment provider anywhere in this build.
  var storeOpen = false;
  function packContentsText(pack) {
    if (!Weapons) return '';
    var parts = [];
    function wname(id) { var r = Weapons.rowById(id); return r ? r.name : id; }
    function gname(id) { var g = Weapons.gearById(id); return g ? g.name : id; }
    var l = pack.loadout;
    if (l.primary) parts.push('Primary: ' + wname(l.primary));
    if (l.secondary) parts.push('Secondary: ' + wname(l.secondary));
    if (l.armor) parts.push('Armor: ' + gname(l.armor));
    if (l.mobility) parts.push('Mobility: ' + gname(l.mobility));
    if (l.reactor) parts.push('Reactor: ' + gname(l.reactor));
    if (l.sensor) parts.push('Sensor: ' + gname(l.sensor));
    return parts.join(' | ');
  }
  function renderStore() {
    if (!Curr || !wallet) return;
    var bal = $('store-balance');
    if (bal) bal.textContent = Curr.CURRENCY_NAME + ' balance: ' + wallet.balance;
    var box = $('store-packs'); if (!box) return;
    box.innerHTML = '';
    var cap = heroTierCap();
    Curr.PACKS.forEach(function (pack) {
      var owned = wallet.owned.indexOf(pack.id) !== -1;
      var equipped = wallet.equipped === pack.id;
      var used = wallet.used.indexOf(pack.id) !== -1;
      var div = document.createElement('div');
      var h = document.createElement('h3'); h.textContent = pack.name + ' — ' + pack.price + ' ' + Curr.CURRENCY_NAME;
      div.appendChild(h);
      var c = document.createElement('p'); c.textContent = packContentsText(pack); div.appendChild(c);
      var t = document.createElement('p'); t.className = 'dim'; t.textContent = 'Trade-off: ' + pack.tradeoff; div.appendChild(t);
      var gated = Curr.gatedPackItems(pack, cap, walletTierOf);
      if (gated.length) {
        var g = document.createElement('p'); g.className = 'dim';
        g.textContent = 'Gated at your hero level ' + (heroRecord ? heroRecord.level : 1) + ': ' +
          gated.map(function (it) { var r = Weapons.rowById(it.id) || Weapons.gearById(it.id); return (r ? r.name : it.id) + ' (tier ' + it.tier + ', needs hero level ' + it.needLevel + ')'; }).join(', ') +
          ' — owning a pack never bypasses level gates.';
        div.appendChild(g);
      }
      var s = document.createElement('p'); s.className = 'dim';
      s.textContent = owned ? (equipped ? 'Owned — equipped.' : (used ? 'Owned — used in a match (cannot be refunded).' : 'Owned — never used in a match (refundable for the full price).')) : 'Not owned.';
      div.appendChild(s);
      if (!owned) {
        var b = document.createElement('button');
        b.textContent = 'Buy ' + pack.name + ' (' + pack.price + ' ' + Curr.CURRENCY_NAME + ')';
        b.id = 'store-buy-' + pack.id;
        (function (pid) { b.addEventListener('click', function () { storeBuy(pid); }); })(pack.id);
        div.appendChild(b);
      } else {
        if (!equipped) {
          var e = document.createElement('button');
          e.textContent = 'Equip ' + pack.name;
          e.id = 'store-equip-' + pack.id;
          (function (pid) { e.addEventListener('click', function () { storeEquip(pid); }); })(pack.id);
          div.appendChild(e);
        } else {
          var eq = document.createElement('p'); eq.textContent = 'Equipped — this is the hero loadout for the next match.';
          div.appendChild(eq);
        }
        if (!used) {
          var r = document.createElement('button');
          r.textContent = 'Refund ' + pack.name + ' (full price: ' + pack.price + ' ' + Curr.CURRENCY_NAME + ')';
          r.id = 'store-refund-' + pack.id;
          (function (pid) { r.addEventListener('click', function () { storeRefund(pid); }); })(pack.id);
          div.appendChild(r);
        }
      }
      box.appendChild(div);
    });
  }
  function storeNote(text) { var el = $('store-notice'); if (el) el.textContent = text || ''; }
  function storeBuy(packId) {
    if (!Curr || !wallet) return;
    var res = Curr.buyPack(wallet, packId);
    if (!res.ok) { storeNote(res.reason); renderStore(); return; }
    wallet = res.wallet; saveWallet(); storeNote(''); renderStore(); syncMainMenuHero();
  }
  function storeEquip(packId) {
    if (!Curr || !wallet || !Weapons) return;
    var pack = Curr.packById(packId);
    if (!pack) return;
    var gated = Curr.gatedPackItems(pack, heroTierCap(), walletTierOf);
    if (gated.length) {
      storeNote(pack.name + ' cannot be equipped yet: ' +
        gated.map(function (it) { var r = Weapons.rowById(it.id) || Weapons.gearById(it.id); return (r ? r.name : it.id) + ' needs hero level ' + it.needLevel; }).join(', ') +
        '. Level gates apply even to owned packs.');
      renderStore(); return;
    }
    var v = Weapons.validateLoadout(pack.loadout, { chassis: 'Lancer', movementClass: 'ground',
      phaseTierCap: heroTierCap(), levelBand: true, allowAbility: true,
      ownedAbilityIds: ownedActiveIds(), premiumOwnedIds: ownedPremiumIds() });
    if (!v.ok) { storeNote(v.reasons.join(' ')); renderStore(); return; }
    var eq = Curr.equipPack(wallet, packId);
    if (!eq.ok) { storeNote(eq.reason); renderStore(); return; }
    wallet = eq.wallet;
    heroLoadout = Weapons.cloneLoadout(eq.loadout);
    if (heroRecord) { heroRecord.loadout = Weapons.cloneLoadout(heroLoadout); saveHeroRecord(); }
    saveWallet(); storeNote(''); renderStore(); syncMainMenuHero();
  }
  function storeRefund(packId) {
    if (!Curr || !wallet) return;
    var pack = Curr.packById(packId);
    var res = Curr.refundPack(wallet, packId);
    if (!res.ok) { storeNote(res.reason); renderStore(); return; }
    wallet = res.wallet;
    // Fallback: if the hero loadout was this pack's loadout, or
    // still carries one of its premium rows, it falls back to the
    // default — a refunded pack's premium weapon must never stay
    // equipped. (Equipping a different loadout by hand after
    // equipping the pack leaves that loadout untouched, unless it
    // carries the refunded pack's premium row.)
    if (heroLoadout && pack) {
      var wasPack = Curr.loadoutEquals(heroLoadout, pack.loadout);
      var premiumIds = (Weapons && Weapons.PREMIUM_ROW_IDS) || [];
      var carriesPremium = Curr.packWeaponIds(pack).some(function (wid) {
        return premiumIds.indexOf(wid) !== -1 && (heroLoadout.primary === wid || heroLoadout.secondary === wid);
      });
      if (wasPack || carriesPremium) {
        heroLoadout = Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT);
        if (heroRecord) { heroRecord.loadout = Weapons.cloneLoadout(heroLoadout); saveHeroRecord(); }
      }
    }
    saveWallet(); storeNote(''); renderStore(); syncMainMenuHero();
  }
  function openStore() {
    if (!Curr || !wallet) return;
    storeOpen = true;
    showOverlay('main-menu', false); showOverlay('store-panel', true);
    storeNote(''); renderStore();
  }
  function closeStore() {
    storeOpen = false;
    showOverlay('store-panel', false); showOverlay('main-menu', true);
    syncMainMenuHero();
    // Tutorial II store step: viewing the store was the action, so
    // closing it completes the tutorial — back to the main menu
    // with the tutorial flag cleared (openMainMenu also resets the
    // mainMenuOpen flag, which the store panel alone does not set).
    if (tutorial2 && tutorial2.storeViewed) { openMainMenu(); }
  }
  function showVictory() {
    if (!state || !state.winner || victoryShown) return;
    var stats = Sim.victoryStats(state);
    victoryShown = true; pauseMenuOpen = false;
    showOverlay('pause-menu', false);
    if (stats.winner === 'draw') {
      // Generation Cycle 3: a declared draw is its own result, not a
      // win for either side. Both sides' survivors are shown, since
      // "winning units remaining" has no meaning in a draw.
      $('victory-title').textContent = 'Draw — neither side can win.';
      $('victory-stats').textContent = 'Ticks elapsed: ' + stats.tick + '  |  ' +
        'Sim time: ' + stats.time.toFixed(1) + 's  |  ' +
        'Iron Eden units remaining: ' + stats.ironRemaining + '  |  ' +
        'Xandria units remaining: ' + stats.xandriaRemaining + '  |  ' +
        'Wrecks created: ' + stats.wrecksCreated + '  |  ' +
        'Wrecks still on the field: ' + stats.wrecksRemaining;
    } else {
      $('victory-title').textContent = stats.winner === 'iron_eden' ? 'Victory — Iron Eden wins!' : 'Defeat — Xandria wins.';
      $('victory-stats').textContent = 'Ticks elapsed: ' + stats.tick + '  |  ' +
        'Sim time: ' + stats.time.toFixed(1) + 's  |  ' +
        'Winning units remaining: ' + stats.unitsRemaining + '  |  ' +
        'Wrecks created: ' + stats.wrecksCreated + '  |  ' +
        'Wrecks still on the field: ' + stats.wrecksRemaining;
    }
    bannerEl.textContent = '';
    // Twin-Stick Phase C: match end is the ONE moment match XP is
    // written. Win +100, draw +0 bonus, loss +25 (all PROPOSED),
    // plus the sim's accumulated hero kill/salvage XP for this
    // match. Level-up and skill-point grants happen here, never
    // mid-match. Quitting mid-match never reaches this function,
    // so it earns nothing. Written once (victoryShown guards the
    // panel; matchXpWritten guards the write itself).
    // WAVE 6 (BETA-12H): tutorial games grant NOTHING — no XP, no
    // Salvage Credits. Tier 1 already has heroMatch false, but tier
    // 2 runs the hero branch (step 5 teaches Drop Back In), so the
    // state.tutorial gate is the explicit exemption: a tutorial
    // game reaching a terminal panel (e.g. a driven hero killing
    // the held red core) must not pay out. Normal matches have
    // state.tutorial falsy, so their grant is unaffected.
    if (heroMatch && !matchXpWritten && state && !state.tutorial && heroRecord && Prog && state.heroXp) {
      matchXpWritten = true;
      var result = stats.winner === 'draw' ? 'draw' : (stats.winner === 'iron_eden' ? 'win' : 'loss');
      var applied = Prog.applyMatchResult(heroRecord, result, state.heroXp);
      heroRecord = applied.record;
      heroLevel = heroRecord.level;
      heroEnabled = heroRecord.heroEnabled;
      saveHeroRecord();
      $('victory-stats').textContent += ' | Hero XP +' + applied.xpGained +
        ' (level ' + applied.levelBefore + ' -> ' + applied.levelAfter + ')';
      // WAVE 4: Salvage Credits grant, same block, same timing as
      // the XP write (match end only; quit mid-match never reaches
      // here, so it earns nothing). Milestone source: hero killing
      // blows this match (state.heroXp.kills). Written once, with
      // the XP write, never mid-match, never per tick.
      if (Curr && wallet) {
        var grant = Curr.applyGrant(wallet, result, (state.heroXp.kills || 0));
        wallet = grant.wallet; saveWallet();
        $('victory-stats').textContent += ' | ' + Curr.CURRENCY_NAME + ' +' + grant.grant.total +
          ' (' + grant.grant.base + ' base + ' + grant.grant.milestone + ' hero-kill bonus)';
      }
    }
    // Victory / defeat / draw panel supersedes twin-stick mode: the
    // mode exits when the panel shows (the sim is frozen either way).
    if (controlUnitId) exitControlSilent();
    showOverlay('victory-panel', true);
  }

  function newGame(mapName) {
    if (controlUnitId) resetControlUI();
    if (mapName) currentMap = mapName;
    var map, isFirst = currentMap !== 'test', isSecond = currentMap === 'second', isThird = currentMap === 'third';
    if (isThird && Maps) map = Maps.createThirdMap();
    else if (isSecond && Maps) map = Maps.createSecondMap();
    else if (isFirst && Maps) map = Maps.createFirstMap();
    else map = Sim.createTestMap();
    state = Sim.createGame({ catalog: catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
    // Difficulty wiring (Gameplay Completion): the menu setting
    // becomes the sim's aiCombatParams seam for this match only.
    // Tutorial games are forced to Normal — the sim's tutorial
    // gate holds the red AI anyway, so this is belt-and-braces,
    // not the mechanism that holds it.
    if (Sim.DIFFICULTY_PARAMS) {
      var diffLevel = (tutorial || tutorialStarting) ? 'normal' : difficulty;
      state.aiCombatParams = Sim.DIFFICULTY_PARAMS[diffLevel];
    }
    if (isThird && Maps) Maps.spawnThirdMapScenario(Sim, state);
    else if (isSecond && Maps) Maps.spawnSecondMapScenario(Sim, state);
    else if (isFirst && Maps) Maps.spawnFirstMapScenario(Sim, state);
    else Sim.spawnScenario(state);
    // Twin-Stick Phase B: the hero REPLACES the west roster's
    // lancer_mech entry and STARTS IN RESERVE — opening field count
    // is 9v10, not 10v10 on the field. Never on the Test Map, never
    // in a tutorial game, never when toggled off. An invalid
    // loadout falls back to the default rather than breaking the
    // match (the loadout screen only ever saves valid loadouts, and
    // the record is validated at load, so this is unreachable in
    // practice). Phase C: the hero starts at the record's level,
    // skills, and loadout, at full HP for that level and gear; the
    // sim's heroSkills are set from the record for Salvage Sense,
    // and match XP tracking starts at 0 for this match only.
    heroMatch = false; matchXpWritten = false;
    if (!tutorial && !tutorialStarting && heroEnabled && currentMap !== 'test' && Hero && Weapons && heroLoadout && heroRecord) {
      var lv = Weapons.validateLoadout(heroLoadout, { chassis: 'Lancer', movementClass: 'ground',
        phaseTierCap: heroTierCap(), levelBand: true, allowAbility: true, ownedAbilityIds: ownedActiveIds(),
        premiumOwnedIds: ownedPremiumIds() });
      if (!lv.ok) heroLoadout = Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT);
      hero = Hero.startMatch(Weapons.cloneLoadout(heroLoadout));
      heroLevel = heroRecord.level;
      state.heroSkills = heroRecord.skills.slice();
      heroMatch = true;
      Hero.applyRoster(state);
    } else hero = null;
    // WAVE 4: a match STARTING with a pack's loadout equipped marks
    // that pack used — from here on it cannot be refunded. The
    // comparison uses the post-fallback heroLoadout, so a loadout
    // that fell back to default (invalid, unowned premium, or
    // tier-gated) never marks a pack used it did not play.
    // WAVE 6 (BETA-12H): tutorial games are EXEMPT from used-marking.
    // Tier 1 never reaches here (heroMatch false), but tier 2 runs
    // the hero branch, so starting Tutorial II with a pack equipped
    // used to mark it used (Wave 5 note) and block its later refund
    // even though no real match was played. tutorial2Starting
    // covers startTutorial2's newGame call; tutorial2-non-null
    // covers a Restart inside tier 2. A real match started after
    // the tutorial clears tutorial2 first, so its marking is
    // unaffected.
    if (heroMatch && !tutorial2Starting && !tutorial2 && Curr && wallet && wallet.equipped) {
      var equippedPack = Curr.packById(wallet.equipped);
      if (equippedPack && Curr.loadoutEquals(heroLoadout, equippedPack.loadout)) {
        wallet = Curr.markPackUsed(wallet, equippedPack.id); saveWallet();
      }
    }
    lastDropSig = '';
    selected = []; selectedWreckId = null; pendingPatrol = null;
    groupAssignMode = false; rallyMode = false; rallyCoreId = 0; queueMode = false;
    var ga = $('btn-group-assign'); if (ga) { ga.textContent = 'Assign Group: Off'; ga.classList.remove('active'); }
    var qb = $('btn-queue'); if (qb) { qb.textContent = 'Queue: Off'; qb.classList.remove('active'); }
    if (View) groups = View.createGroups();
    bannerEl.textContent = ''; syncFeedback(); // new match: hint for the current mode/selection, never blank
    effects = []; lastMuzzle = {}; lastDust = {};
    structureWrecks = []; // render-layer structure wrecks reset per match
    overlayMap = (isThird && Maps && Assets)
      ? Assets.overlayMapForSets(Maps.thirdMapOverlaySets())
      : (isSecond && Maps && Assets)
      ? Assets.overlayMapForSets(Maps.secondMapOverlaySets())
      : (isFirst && Maps && Assets)
      ? Assets.overlayMapForSets(Maps.firstMapOverlaySets())
      : (Assets ? Assets.demoOverlayMap() : null);
    camera.x = 0; camera.y = isFirst ? 14 : 8; camera.zoom = 1; camera.targetZoom = 1; zoomAnim = null;
    // Wave-3 fix (real bug, found by the beta twin-stick failure):
    // newGame resets zoom to 1 but viewTilesX/Y are only recomputed
    // in updateViewTiles, which the frame loop calls solely while
    // zoom is animating — after a zoom change (e.g. tutorial zoom
    // to 1.25) followed by a map switch, viewTiles stayed stale at
    // the old zoom (24.5/19.1 instead of 30.625/23.875 at desktop),
    // so minimap centring landed ~2.4 tiles off and driver taps
    // selected the wrong entities (core instead of scout). Refresh
    // here so every new game starts with viewTiles matching zoom 1.
    updateViewTiles();
    victoryShown = false; showOverlay('victory-panel', false);
    lastPanelSig = '';
    // Restarting (Reset / Restart) inside a tutorial restarts the
    // tutorial from step 1 with a fresh held-red scenario, rather
    // than silently dropping the player into a live game. Same for
    // tier 2: the fresh state gets a hero in reserve again (the hero
    // branch above ran with `tutorial` null), then the tier-2
    // scenario re-adds the held target and restarts at step 1.
    if (tutorial) { setupTutorialScenario(); enterTutorialStep(0); }
    if (tutorial2) { setupTutorial2Scenario(); enterTutorial2Step(0); }
  }
  function startMap(mapName) {
    tutorial = null; tutorialEndOpen = false; hideTutorialUI();
    // Play-a-real-game clears EITHER tutorial, including tier 2's
    // end-overlay Play button (which already called exitTutorial2;
    // this is belt-and-braces for the pause-menu map buttons).
    tutorial2 = null; hideTutorial2UI();
    newGame(mapName);
    mainMenuOpen = false; pauseMenuOpen = false; settingsOpen = false; howtoOpen = false;
    showOverlay('main-menu', false); showOverlay('pause-menu', false);
    showOverlay('settings-panel', false); showOverlay('howto-panel', false);
  }
  // ---- Tutorial scenario (First Map layout, red side HELD) ----
  // The east red army stays on the map but never acts: state.tutorial
  // gates the sim AI economy and sim AI combat (sim.js), so the player
  // is never attacked while learning. The
  // attack target is an UNARMED salvage_team (catalog weapons: none),
  // so it truly cannot shoot back — it just holds its ground. It sits
  // at (28,25), deliberately OUT of every blue base unit's auto-engage
  // range (the first placement at (20,25) was shot dead by the blue
  // heavy tank and longshot before the player could tap it — hold
  // units auto-fire on enemies in weapon range, so "held" alone does
  // not protect a target). The tutorial wreck uses exactly the sim
  // wreck fields (same as createWreck in sim.js: 40% of a Scout
  // Buggy's 80 scrap = 32).
  function setupTutorialScenario() {
    if (!state) return;
    state.tutorial = true;
    var tgt = Sim.addUnit(state, 'salvage_team', 'xandria', 28, 25);
    var wk = { id: state.nextWreckId++, typeId: 'scout_buggy', faction: 'xandria',
      x: 18, y: 28, radius: 0.4, baseValue: 32, value: 32,
      createdTick: state.tick, expiresTick: state.tick + 2400 };
    state.wrecks.push(wk);
    tutorial.targetId = tgt.id; tutorial.wreckId = wk.id;
    setMode('move');
  }
  function startTutorial() {
    tutorial = null; tutorialEndOpen = false; hideTutorialUI();
    // Tier 1 and tier 2 never run together (see Tutorial II block).
    tutorial2 = null; hideTutorial2UI();
    // tutorialStarting guards newGame's hero setup: the tutorial game
    // is built on the First Map layout but must never get a hero.
    tutorialStarting = true;
    newGame('first');
    tutorialStarting = false;
    tutorial = { step: 0, targetId: 0, wreckId: 0, snap: {} };
    setupTutorialScenario();
    mainMenuOpen = false; pauseMenuOpen = false; settingsOpen = false; howtoOpen = false;
    showOverlay('main-menu', false); showOverlay('pause-menu', false);
    showOverlay('settings-panel', false); showOverlay('howto-panel', false);
    enterTutorialStep(0);
  }
  function tutorialSnap() {
    return {
      camX: camera.x, camY: camera.y, zoom: camera.zoom,
      selectedUnits: selectedUnitIds().length,
      moveOrdered: false, attackOrdered: false,
      scoutCount: state ? state.units.filter(function (u) { return u.faction === PLAYER && u.typeId === 'scout_buggy'; }).length : 0,
      scrap: state ? Sim.scrapOf(state, PLAYER) : 0
    };
  }
  function tutorialNow() {
    var s = tutorialSnap();
    s.moveOrdered = tutorial.snap.moveOrdered; s.attackOrdered = tutorial.snap.attackOrdered;
    return s;
  }
  function frameTutorialCamera(step) {
    // Put the step's highlighted point on screen: at phone zoom 1 the
    // view is only ~12 tiles wide, so a target at x=20 would otherwise
    // be off-screen and the highlight invisible. The point sits at
    // 30% of the view height, NOT the centre — the info panel covers
    // the bottom of the canvas, and a centred point lands underneath
    // it, invisible and untappable (found by the verification run).
    var pt = step === 2 ? { x: 18, y: 22 } : step === 3 ? { x: 28, y: 25 } : step === 4 ? { x: 6, y: 25 } : step === 5 ? { x: 18, y: 28 } : null;
    if (!pt || !View) return;
    updateViewTiles();
    var cam = View.clampCamera({ x: pt.x - camera.viewTilesX / 2, y: pt.y - camera.viewTilesY * 0.30, zoom: camera.zoom },
      state.width, state.height, viewCssW, viewCssH);
    camera.x = cam.x; camera.y = cam.y;
  }
  function enterTutorialStep(i) {
    if (!tutorial) return;
    tutorial.step = i;
    tutorial.snap = tutorialSnap();
    // Entering the salvage step clears the selection, which closes the
    // build panel left open by the build step — otherwise it covers the
    // map the player is told to tap. Salvage needs a fresh unit
    // selection anyway, and the banner already says so.
    if (i === 5) {
      selected = []; selectedWreckId = null; lastPanelSig = '';
      // Wave-2 decision (beta wave-1 gap): the tutorial wreck decays
      // over 120 s from match start, so a slow player reaching the
      // salvage step late found it expired and the by-doing path
      // broken (Next still rescued them, but that is not the lesson).
      // Entering the salvage step refreshes the wreck to full value
      // and a full 120 s, so the step is always completable by doing.
      var tw = state ? Sim.findWreck(state, tutorial.wreckId) : null;
      if (tw) { tw.createdTick = state.tick; tw.expiresTick = state.tick + Sim.WRECK_LIFETIME_TICKS; tw.value = tw.baseValue; }
    }
    frameTutorialCamera(i);
    if (i >= 6) {
      // Step 7 is a screen, not a sim step: freeze the sim and show it.
      tutorialEndOpen = true;
      var bar = $('tutorial-bar'); if (bar) bar.style.display = 'none';
      showOverlay('tutorial-end', true);
      return;
    }
    tutorialEndOpen = false; showOverlay('tutorial-end', false);
    updateTutorialBar();
  }
  function updateTutorialBar() {
    var bar = $('tutorial-bar'), txt = $('tutorial-text');
    if (!tutorial || !bar || !txt) return;
    if (tutorial.step >= 6) { bar.style.display = 'none'; return; }
    var step = View ? View.TUTORIAL_STEPS[tutorial.step] : null;
    if (!step) return;
    var extra = '';
    if ((tutorial.step === 2 || tutorial.step === 5) && !selectedUnitIds().length) {
      extra = ' (No unit selected — tap a blue unit first.)';
    } else if (tutorial.step === 4) {
      var coreSel = state.structures.some(function (s) { return s.faction === PLAYER && s.typeId === 'command_core' && selected.indexOf(s.id) !== -1; });
      if (!coreSel) extra = ' (Tap the pulsing Command Core.)';
    }
    var line = 'Tutorial ' + (tutorial.step + 1) + ' of 7 — ' + step.title + ': ' + step.instruction + ' ' + step.tapHint + extra;
    if (line !== lastTutText) { txt.textContent = line; lastTutText = line; }
    bar.style.display = 'flex';
  }
  function tutorialHighlight() {
    if (!tutorial || !state || tutorial.step >= 6) return null;
    if (tutorial.step === 1) {
      var u = state.units.filter(function (x) { return x.faction === PLAYER; })[0];
      return u ? { x: u.x, y: u.y } : null;
    }
    if (tutorial.step === 2) return { x: 18, y: 22 };
    if (tutorial.step === 3) {
      var t = Sim.findEntity(state, tutorial.targetId);
      return t && t.alive ? { x: t.x, y: t.y } : { x: 28, y: 25 };
    }
    if (tutorial.step === 4) {
      var c = state.structures.filter(function (s) { return s.faction === PLAYER && s.typeId === 'command_core'; })[0];
      return c ? { x: c.x, y: c.y } : null;
    }
    if (tutorial.step === 5) {
      var wk = Sim.findWreck(state, tutorial.wreckId);
      return wk ? { x: wk.x, y: wk.y } : null;
    }
    return null;
  }
  function checkTutorialAdvance() {
    if (!tutorial || !state || tutorial.step >= 6 || !View) return;
    var step = View.TUTORIAL_STEPS[tutorial.step];
    if (step && View.tutorialAdvance(step.id, tutorial.snap, tutorialNow())) {
      enterTutorialStep(tutorial.step + 1);
    }
  }
  // ---- Tutorial II — Twin-Stick & Hero (Wave-5) ----
  // Same contract as tier 1 (First Map, red side HELD, Skip + Next on
  // every in-match step, advance by doing the action), different
  // subject: manual control and the hero. The step table lives here,
  // not in view.js: view.js is shared pure UI data, and tier 2's
  // advance conditions (controlled-unit displacement, release
  // transition, hero field status) are shell state, not camera data.
  // Hero starts in reserve (9v10 opening) exactly as in normal hero
  // play: startTutorial2 does NOT set tutorialStarting, so newGame's
  // hero branch runs and Hero.applyRoster removes the lancer entry.
  // WAVE 6 (BETA-12H): the hero branch running does NOT mean the
  // economy runs — tutorial games are exempt from pack-used
  // marking (tutorial2Starting / tutorial2 guards in newGame) and
  // from XP/Credit grants (state.tutorial gate in showVictory), so
  // a teaching game can neither spend a refund nor pay out.
  // The held target reuses tier 1's proven placement (28,25): 19
  // tiles from the blue longshot (range 18) and 14 from the nearest
  // other blue unit (range 7), so no non-controlled blue unit can
  // auto-engage it — only the controlled unit's manual fire can
  // kill it, which is what makes step 3's advance proof honest.
  // Step 6 (store) is a screen, like tier 1's step 7: its action is
  // the Open Premium Store button, its Next-equivalent is Finish,
  // and closing the store after viewing returns to the main menu
  // with the tutorial cleared (closeStore hook). Viewing only: no
  // step ever requires a purchase, and the store's real-money note
  // stays "not live".
  var TUTORIAL2_STEPS = [
    { id: 'takecontrol', title: 'Take Control', instruction: 'Tap a blue unit to select it, then tap Take Control.', tapHint: 'Next tap: tap a blue unit, then Take Control.' },
    { id: 'drive', title: 'Drive', instruction: 'Drive with the left stick, or WASD on desktop.', tapHint: 'Next tap: hold the left stick, or a WASD key.' },
    { id: 'aimfire', title: 'Aim and fire', instruction: 'Aim at the pulsing red target and hold fire until it is destroyed. It cannot shoot back.', tapHint: 'Next tap: aim at the red target and hold fire.' },
    { id: 'release', title: 'Release Control', instruction: 'Tap Release Control. Your unit takes a hold order where it stands, and stays selected.', tapHint: 'Next tap: tap Release Control.' },
    { id: 'dropback', title: 'Drop Back In', instruction: 'Your Command Mech waits in reserve. Tap Drop Back In: it drops in near your Command Core, and you are controlling it.', tapHint: 'Next tap: tap Drop Back In.' },
    { id: 'store', title: 'Premium Store', instruction: 'Open the Premium Store and look at a pack. Viewing only — nothing here needs a purchase.', tapHint: 'Next tap: tap Open Premium Store.' }
  ];
  function setupTutorial2Scenario() {
    if (!state) return;
    state.tutorial = true;
    var tgt = Sim.addUnit(state, 'salvage_team', 'xandria', 28, 25);
    tutorial2.targetId = tgt.id;
    setMode('move');
  }
  function startTutorial2() {
    exitTutorial();
    tutorial2 = null; tutorialEndOpen = false; hideTutorial2UI();
    // WAVE 6 (BETA-12H): tutorial2Starting guards newGame's
    // pack-used marking (see the mark-used block): tier 2 starts
    // with the hero branch running, so without this flag an
    // equipped pack would be marked used by a teaching game.
    tutorial2Starting = true;
    newGame('first');
    tutorial2Starting = false;
    tutorial2 = { step: 0, targetId: 0, snap: {}, storeViewed: false, lastControlId: 0, lastControlPos: null };
    setupTutorial2Scenario();
    mainMenuOpen = false; pauseMenuOpen = false; settingsOpen = false; howtoOpen = false;
    showOverlay('main-menu', false); showOverlay('pause-menu', false);
    showOverlay('settings-panel', false); showOverlay('howto-panel', false);
    enterTutorial2Step(0);
  }
  function hideTutorial2UI() {
    var bar = $('tutorial-bar'); if (bar) bar.style.display = 'none';
    showOverlay('tutorial2-end', false);
  }
  function exitTutorial2() {
    // Mirrors exitTutorial: the flag on the old state is cleared too,
    // so a stale tutorial2 state can never be resumed into a normal
    // game, and the end overlay never lingers over the menu.
    if (state) state.tutorial = false;
    tutorial2 = null; tutorialEndOpen = false;
    hideTutorial2UI(); bannerEl.textContent = '';
  }
  function frameTutorial2Camera(step) {
    // Same 30%-of-view-height framing as tier 1 (the info panel
    // covers the bottom of the canvas on phones). Steps 1 and 3 need
    // no framing: while controlling, the frame loop centres the
    // camera on the controlled unit every frame.
    var pt = null;
    if (step === 0) {
      var u = state.units.filter(function (x) { return x.faction === PLAYER && x.typeId === 'longshot_mech'; })[0];
      if (u) pt = { x: u.x, y: u.y };
    } else if (step === 2) pt = { x: 28, y: 25 };
    else if (step === 4) {
      var c = state.structures.filter(function (s) { return s.faction === PLAYER && s.typeId === 'command_core'; })[0];
      if (c) pt = { x: c.x, y: c.y };
    }
    if (!pt || !View) return;
    updateViewTiles();
    var cam = View.clampCamera({ x: pt.x - camera.viewTilesX / 2, y: pt.y - camera.viewTilesY * 0.30, zoom: camera.zoom },
      state.width, state.height, viewCssW, viewCssH);
    camera.x = cam.x; camera.y = cam.y;
  }
  function enterTutorial2Step(i) {
    if (!tutorial2) return;
    tutorial2.step = i;
    tutorial2.snap = { startX: null, startY: null, maxDist: 0, prevControl: controlUnitId };
    frameTutorial2Camera(i);
    if (i >= 5) {
      // Step 6 is a screen, not a sim step: freeze the sim (via the
      // same tutorialEndOpen flag tier 1's end screen uses) and show
      // the store-step overlay. The bar hides; the overlay carries
      // the action (Open Premium Store) and the Next-equivalent
      // (Finish).
      tutorialEndOpen = true;
      var bar = $('tutorial-bar'); if (bar) bar.style.display = 'none';
      showOverlay('tutorial2-end', true);
      return;
    }
    tutorialEndOpen = false; showOverlay('tutorial2-end', false);
    updateTutorial2Bar();
  }
  function updateTutorial2Bar() {
    var bar = $('tutorial-bar'), txt = $('tutorial-text');
    if (!tutorial2 || !bar || !txt) return;
    if (tutorial2.step >= 5) { bar.style.display = 'none'; return; }
    var step = TUTORIAL2_STEPS[tutorial2.step];
    if (!step) return;
    var extra = '';
    if (tutorial2.step === 0) {
      var sel = selectedUnitIds();
      if (!sel.length) extra = ' (No unit selected — tap a blue unit first.)';
      else {
        var su = state.units.filter(function (x) { return x.id === sel[0]; })[0];
        if (!su || !su.weapons.length) extra = ' (That unit has no weapon — tap an armed blue unit.)';
      }
    } else if (tutorial2.step === 1 && !controlUnitId) {
      extra = ' (You are not controlling a unit — tap a blue unit, then Take Control.)';
    } else if (tutorial2.step === 2) {
      if (!controlUnitId) extra = ' (You are not controlling a unit — take control again, then aim and fire.)';
      else {
        var cu = controlledUnit(), tgt = Sim.findEntity(state, tutorial2.targetId);
        if (cu && tgt && tgt.alive) {
          var mr = 0, mn = 0;
          cu.weapons.forEach(function (w) { if (w.range > mr) mr = w.range; if (!mn || w.minRange < mn) mn = w.minRange; });
          var d = Math.hypot(tgt.x - cu.x, tgt.y - cu.y);
          if (d > mr) extra = ' (Drive closer — the target is out of weapon range.)';
          else if (d < mn) extra = ' (Too close — back off so your weapon can reach.)';
        }
      }
    } else if (tutorial2.step === 4) {
      if (hero && hero.status === 'reserve') extra = ' (Your Command Mech is in reserve — tap Drop Back In.)';
      else if (hero && hero.status === 'dropping') extra = ' (Wait for the drop telegraph.)';
      else if (hero && hero.status === 'field' && controlUnitId !== hero.unitId) extra = ' (Tap the Command Mech, then Take Control.)';
    }
    var line = 'Tutorial II ' + (tutorial2.step + 1) + ' of 6 — ' + step.title + ': ' + step.instruction + ' ' + step.tapHint + extra;
    if (line !== lastTut2Text) { txt.textContent = line; lastTut2Text = line; }
    bar.style.display = 'flex';
  }
  function tutorial2Highlight() {
    if (!tutorial2 || !state || tutorial2.step >= 5) return null;
    if (tutorial2.step === 0) {
      var u = state.units.filter(function (x) { return x.faction === PLAYER && x.typeId === 'longshot_mech'; })[0]
        || state.units.filter(function (x) { return x.faction === PLAYER; })[0];
      return u ? { x: u.x, y: u.y } : null;
    }
    if (tutorial2.step === 1) {
      var cu = controlledUnit();
      return cu ? { x: cu.x, y: cu.y } : (tutorial2.lastControlPos || null);
    }
    if (tutorial2.step === 2) {
      var t = Sim.findEntity(state, tutorial2.targetId);
      return t && t.alive ? { x: t.x, y: t.y } : { x: 28, y: 25 };
    }
    if (tutorial2.step === 3) return tutorial2.lastControlPos || null;
    if (tutorial2.step === 4) {
      if (hero && hero.status === 'dropping' && hero.dropTile) return { x: hero.dropTile.x, y: hero.dropTile.y };
      if (hero && hero.unitId) {
        var hu = state.units.filter(function (x) { return x.id === hero.unitId; })[0];
        if (hu) return { x: hu.x, y: hu.y };
      }
      var c = state.structures.filter(function (s) { return s.faction === PLAYER && s.typeId === 'command_core'; })[0];
      return c ? { x: c.x, y: c.y } : null;
    }
    return null;
  }
  function checkTutorial2Advance() {
    if (!tutorial2 || !state || tutorial2.step >= 5) return;
    var s = tutorial2.snap;
    if (tutorial2.step === 0) {
      if (controlUnitId) { enterTutorial2Step(1); return; }
    } else if (tutorial2.step === 1) {
      var cu = controlledUnit();
      if (cu) {
        // Next-press entry: a player who skipped into this step is
        // not controlling yet, so the start point is set on the
        // first controlled frame, not at step entry.
        if (s.startX === null || s.startX === undefined) { s.startX = cu.x; s.startY = cu.y; }
        var d = Math.hypot(cu.x - s.startX, cu.y - s.startY);
        if (d > s.maxDist) s.maxDist = d;
        if (s.maxDist > 1.5) { enterTutorial2Step(2); return; }
      }
    } else if (tutorial2.step === 2) {
      var t = Sim.findEntity(state, tutorial2.targetId);
      if (!t || !t.alive) { enterTutorial2Step(3); return; }
    } else if (tutorial2.step === 3) {
      // Release is a TRANSITION, not a state: the previous frame was
      // controlling this unit, this frame is not, the selection still
      // holds it, and the sim gave it a hold order (clearManualControl
      // does exactly that). Selection alone, or a hold order issued
      // any other way, does not advance this step.
      if (s.prevControl && !controlUnitId && selected.indexOf(s.prevControl) !== -1) {
        var ru = state.units.filter(function (x) { return x.id === s.prevControl; })[0];
        if (ru && ru.order && ru.order.kind === 'hold') { enterTutorial2Step(4); return; }
      }
    } else if (tutorial2.step === 4) {
      // Drop Back In lands already-controlled (frame-loop landing
      // code), so "controlling the hero" IS the reserve -> telegraph
      // -> controlling proof; a mere drop press is not enough.
      if (hero && hero.status === 'field' && controlUnitId === hero.unitId) { enterTutorial2Step(5); return; }
    }
    // Per-frame control tracking: the release transition above, and
    // the highlight anchor for the drive/release steps.
    if (controlUnitId) {
      var cu2 = controlledUnit();
      if (cu2) { tutorial2.lastControlId = cu2.id; tutorial2.lastControlPos = { x: cu2.x, y: cu2.y }; }
    }
    s.prevControl = controlUnitId;
  }
  function updateViewTiles() {
    camera.viewTilesX = viewCssW / Render.TILE / camera.zoom;
    camera.viewTilesY = viewCssH / Render.TILE / camera.zoom;
  }
  // Mobile-first finish: the canvas fills the stage element (the flex
  // space left by the top bar, banner, and command tray), not a hardcoded
  // window-height-minus-96. This is what keeps the map on-screen at
  // phone width instead of pushing the tray off the viewport.
  function resize() {
    var stage = document.getElementById('stage');
    var w = stage ? stage.clientWidth : window.innerWidth;
    var h = stage ? stage.clientHeight : window.innerHeight - 96;
    viewDpr = (Render && Render.dprFor) ? Render.dprFor(window.devicePixelRatio || 1)
      : Math.min(2, window.devicePixelRatio || 1);
    if (w > 0) { viewCssW = w; canvas.width = Math.round(w * viewDpr); canvas.style.width = w + 'px'; }
    if (h > 0) { viewCssH = h; canvas.height = Math.round(h * viewDpr); canvas.style.height = h + 'px'; }
    updateViewTiles();
  }
  function setZoomTarget(newZoom, anchor) {
    if (!View) return;
    camera.targetZoom = View.clampZoom(newZoom);
    zoomAnim = anchor ? { anchor: anchor } : null;
  }
  function centreAnchor() {
    return { worldX: camera.x + camera.viewTilesX / 2, worldY: camera.y + camera.viewTilesY / 2,
      offsetX: viewCssW / 2, offsetY: viewCssH / 2 };
  }
  function zoomToSelection() {
    if (!View || !state || !selected.length) return;
    var units = state.units.filter(function (u) { return selected.indexOf(u.id) !== -1; });
    var structs = state.structures.filter(function (s) { return selected.indexOf(s.id) !== -1; });
    var all = units.concat(structs);
    var bounds = View.selectionBounds(all);
    if (!bounds) return;
    var frame = View.frameSelection(bounds, state.width, state.height, viewCssW, viewCssH);
    camera.targetZoom = frame.zoom;
    zoomAnim = { targetX: frame.x, targetY: frame.y };
  }
  function togglePaths() {
    showPaths = !showPaths;
    var el = $('btn-paths'); if (el) el.textContent = showPaths ? 'Paths: On' : 'Paths: Off';
    syncSettingsUI();
  }
  function syncSettingsUI() {
    var map = { 'set-paths': showPaths, 'set-fx': showFX, 'set-shadows': showShadows, 'set-minimap': showMinimap };
    Object.keys(map).forEach(function (id) { var el = $(id); if (el) el.checked = map[id]; });
    var he = $('set-hero'); if (he) he.checked = heroEnabled;
    var el = $('btn-paths'); if (el) el.textContent = showPaths ? 'Paths: On' : 'Paths: Off';
    var mm = $('btn-minimap'); if (mm) mm.textContent = showMinimap ? 'Minimap: On' : 'Minimap: Off';
    if (mini) mini.style.display = showMinimap ? 'block' : 'none';
  }
  function toggleMinimap() { showMinimap = !showMinimap; syncSettingsUI(); }
  function syncCmdMore() {
    var c = $('commands'), m = $('btn-cmd-more');
    if (c && m) m.textContent = c.classList.contains('expanded') ? 'Fewer commands ▲' : 'More commands ▼';
  }
  function resetSettings() {
    showPaths = true; showFX = true; showShadows = true; showMinimap = true;
    heroEnabled = true; // hero toggle default ON (PROPOSED); applies at the next match
    if (heroRecord && heroRecord.heroEnabled !== true) { heroRecord.heroEnabled = true; saveHeroRecord(); }
    difficulty = 'normal'; syncDifficultyUI(); // difficulty default is Normal, like the other toggles
    syncSettingsUI();
  }
  window.addEventListener('resize', resize);
  // Landscape-first: orientation changes re-flow the shell (column in
  // portrait, row in landscape), so the stage size changes and the
  // canvas backing size must follow — the stale-canvas bug from the
  // mobile-first finish, which stretched the map and misaligned taps.
  // 'resize' alone is not trusted here: on phones the orientationchange
  // event can fire before the viewport dimensions settle, so resize()
  // is re-run after a short delay. The tray class is also synced on
  // orientation change only (never inside resize(), or collapsing the
  // tray in landscape would immediately re-expand it): landscape
  // forces the tray expanded (side panel, order row always visible);
  // portrait at phone width restores the collapsed tray.
  function onOrientationChange() {
    setTimeout(function () {
      var c = $('commands');
      if (c) {
        if (window.innerWidth > window.innerHeight) c.classList.add('expanded');
        else if (window.innerWidth <= 640) c.classList.remove('expanded');
      }
      syncCmdMore();
      resize();
    }, 80);
  }
  window.addEventListener('orientationchange', onOrientationChange);

  function screenToWorld(cx, cy) {
    var r = canvas.getBoundingClientRect();
    return { x: camera.x + (cx - r.left) / camera.zoom / Render.TILE, y: camera.y + (cy - r.top) / camera.zoom / Render.TILE };
  }
  function entityAt(wx, wy) {
    var best = null, bestD = 1.2;
    state.units.forEach(function (u) { var d = Math.hypot(u.x - wx, u.y - wy); if (d < bestD) { best = u; bestD = d; } });
    state.structures.forEach(function (s) { var d = Math.hypot(s.x - wx, s.y - wy); if (d < bestD + s.radius) { best = s; bestD = d; } });
    return best;
  }
  function wreckAt(wx, wy) {
    var best = null, bestD = 1.2;
    state.wrecks.forEach(function (w) { var d = Math.hypot(w.x - wx, w.y - wy); if (d < bestD) { best = w; bestD = d; } });
    return best;
  }
  function selectedUnitIds() {
    return selected.filter(function (id) { return state.units.some(function (u) { return u.id === id; }); });
  }
  function orderSelected(kind, wx, wy, target, append) {
    // Twin-Stick Phase A: the controlled unit ignores orders until
    // released — other selected units still obey. If it is the only
    // selected unit, the order goes nowhere.
    var unitIds = selectedUnitIds().filter(function (id) { return id !== controlUnitId; });
    if (!unitIds.length) return;
    // Tutorial auto-advance detection: the action itself is the proof.
    if (tutorial && tutorial.snap) {
      if (tutorial.step === 2 && (kind === 'move' || kind === 'attackMove')) tutorial.snap.moveOrdered = true;
      if (tutorial.step === 3 && target && target.id === tutorial.targetId) tutorial.snap.attackOrdered = true;
    }
    var opts = { append: !!append };
    if (target && target.faction !== PLAYER) {
      Sim.issueOrder(state, unitIds, { kind: 'attack', targetId: target.id }, opts);
    } else if (kind === 'guard') {
      // Guard point is shared (units cluster around it; separation
      // keeps them apart) — formation offsets would give each unit a
      // different guard point, which is not what Guard means.
      Sim.issueOrder(state, unitIds, { kind: 'guard', x: wx, y: wy }, opts);
    } else if (unitIds.length > 1 && (kind === 'move' || kind === 'attackMove')) {
      Sim.issueFormationOrder(state, unitIds, { kind: kind, x: wx, y: wy }, opts);
    } else {
      Sim.issueOrder(state, unitIds, { kind: kind, x: wx, y: wy }, opts);
    }
    if (state) pathFlashUntil = state.time + 1.5;
  }
  function orderSalvage(wreckId, append) {
    var unitIds = selectedUnitIds().filter(function (id) { return id !== controlUnitId; });
    if (!unitIds.length || !wreckId) return;
    Sim.issueOrder(state, unitIds, { kind: 'salvage', wreckId: wreckId }, { append: !!append });
    if (state) pathFlashUntil = state.time + 1.5;
  }
  function setMode(m) {
    mode = m; pendingPatrol = null;
    ['btn-move', 'btn-attackmove', 'btn-hold', 'btn-patrol', 'btn-salvage', 'btn-guard'].forEach(function (id) {
      var el = $(id); if (el) el.classList.remove('active');
    });
    var map = { move: 'btn-move', attackMove: 'btn-attackmove', hold: 'btn-hold', patrol: 'btn-patrol', salvage: 'btn-salvage', guard: 'btn-guard' };
    var el = $(map[m]); if (el) el.classList.add('active');
    if (m === 'patrol') bannerEl.textContent = 'Patrol: tap the first patrol point, then the second. Units loop between them and engage enemies en route.';
    else if (m === 'salvage') bannerEl.textContent = 'Salvage: tap a wreck to send selected units to salvage it. (Tapping a wreck salvages in any mode when units are selected.)';
    // Banner is a single 28px line (style.css) — keep this to one short
    // line. The full Guard-vs-Hold explanation lives in CONTROLS.md.
    else if (m === 'guard') bannerEl.textContent = 'Guard: tap ground for a guard point, or tap a friendly unit/structure to guard it.';
    else bannerEl.textContent = '';
    syncFeedback();
  }
  // ---- v1.8 feedback line: always state what the next tap will do ----
  // The feedback line is the player's standing guide: syncFeedback
  // writes the current-mode hint (View.nextTapHint) into it, and
  // sayFeedback shows a one-off message for 3 s before the hint
  // returns — so transient news never leaves the line blank or
  // stale, and the mode hint is never more than one action out of
  // date. Callers that change mode/selection/toggles call
  // syncFeedback; callers that report an event call sayFeedback.
  var feedbackTimer = null;
  function syncFeedback() {
    if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
    if (feedbackEl && View && View.nextTapHint) {
      feedbackEl.textContent = View.nextTapHint({
        mode: mode, selected: selectedUnitIds().length,
        panMode: panMode, selectMode: selectMode, addMode: addMode,
        queueMode: queueMode, pendingPatrol: !!pendingPatrol,
        rallyMode: rallyMode, controlling: !!controlUnitId
      });
    }
  }
  function sayFeedback(text) {
    if (!feedbackEl) return;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackEl.textContent = text;
    feedbackTimer = setTimeout(syncFeedback, 3000);
  }
  // Prototype 03: group-button tap handler (shared with the on-screen
  // buttons; keyboard groups keep their own path, unchanged).
  function groupButtonTap(key) {
    if (!View) return;
    // Twin-Stick Phase A: group recall/assign cannot move the
    // controlled unit while it is controlled; the buttons are hidden
    // with the command tray anyway, so this is belt-and-braces.
    if (controlUnitId) return;
    var res = View.groupButtonAction(groups, key, selected.slice(), groupAssignMode);
    groupAssignMode = res.assignMode;
    var ga = $('btn-group-assign');
    if (ga) { ga.textContent = groupAssignMode ? 'Assign Group: On' : 'Assign Group: Off'; ga.classList.toggle('active', groupAssignMode); }
    if (res.assigned) {
      sayFeedback('Group ' + res.assigned + ' assigned (' + res.selected.length + ' selected).');
    } else {
      var recalled = res.selected.filter(function (id) {
        return state.units.some(function (u) { return u.id === id; }) ||
               state.structures.some(function (s) { return s.id === id; });
      });
      if (recalled.length) { selected = recalled; selectedWreckId = null; syncFeedback(); }
      else sayFeedback('Group ' + key + ' is empty.');
    }
    lastPanelSig = '';
  }

  // ---- Panels (rebuilt only when their signature changes) ----
  function unitDefById(typeId) {
    for (var i = 0; i < catalog.units.length; i++) if (catalog.units[i].id === typeId) return catalog.units[i];
    return null;
  }
  function structDefById(typeId) {
    for (var i = 0; i < catalog.structures.length; i++) if (catalog.structures[i].id === typeId) return catalog.structures[i];
    return null;
  }
  function groupNamesFor(id) {
    var names = [];
    Object.keys(groups).forEach(function (k) { if (groups[k].indexOf(id) !== -1) names.push(k); });
    return names;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function updatePanels() {
    if (!state) return;
    var q = Sim.productionQueue(state, PLAYER);
    // Wave-2 fix (beta wave-1 BUG-LOW-2): the old signature never
    // covered the selected entity's HP or a wreck's current value /
    // expiry, so info/wreck panels froze while the fight and the
    // decay ran on. Including them makes panels rebuild when the
    // numbers they display change (build-queue progress already did
    // this via remainingTicks, which is why it alone stayed live).
    var sigEnt = null;
    if (selected.length === 1) {
      sigEnt = state.units.filter(function (u) { return u.id === selected[0]; })[0] ||
               state.structures.filter(function (s) { return s.id === selected[0]; })[0];
    }
    var sigWk = selectedWreckId ? Sim.findWreck(state, selectedWreckId) : null;
    var sig = selected.join(',') + '|' + (selectedWreckId || '') + '|' + Sim.scrapOf(state, PLAYER) + '|' +
      'hp:' + (sigEnt ? Math.ceil(sigEnt.hp) : 'none') + '|' +
      'wk:' + (sigWk ? sigWk.value + ':' + sigWk.expiresTick : 'nowreck') + '|' +
      q.items.map(function (it) { return it.typeId + ':' + it.remainingTicks; }).join(',') + '|' + mode + '|' +
      // Prototype 03: a rally change must refresh the build panel even
      // when scrap/queue/selection did not change.
      (function () {
        var coreSel = null;
        if (selected.length === 1) {
          var s0 = state.structures.filter(function (s) { return s.id === selected[0]; })[0];
          if (s0 && s0.typeId === 'command_core') coreSel = s0;
        }
        return coreSel && coreSel.rally ? coreSel.rally.x.toFixed(1) + ',' + coreSel.rally.y.toFixed(1) : 'norally';
      })() + '|ctl:' + (controlUnitId || 0) + '|tut:' + (tutorial ? 1 : 0);
    if (sig === lastPanelSig) return;
    lastPanelSig = sig;
    // Twin-Stick Phase A: the side-panel Take Control button follows
    // the same gate as the info-panel button below (single armed
    // unit, never a structure, hidden in tutorial / while controlling).
    syncTakeControlButton();
    // Twin-Stick Phase A: while controlling, the info and build
    // panels are suppressed entirely — the control strip carries the
    // HP/range note instead. Otherwise the bottom-anchored info
    // panel would sit on top of the left stick zone (and the edge of
    // the right one) and swallow stick touches. The panels return
    // on release, when the signature changes again.
    if (controlUnitId) {
      var ip = $('info-panel'), bp = $('build-panel');
      if (ip) ip.style.display = 'none';
      if (bp) bp.style.display = 'none';
      return;
    }
    var info = $('info-panel'), build = $('build-panel');
    var html = '';
    if (selectedWreckId) {
      var wk = Sim.findWreck(state, selectedWreckId);
      if (!wk) { selectedWreckId = null; }
      else {
        var wdef = unitDefById(wk.typeId);
        var secsLeft = Math.max(0, Math.ceil((wk.expiresTick - state.tick) / 20));
        html = '<strong>Wreck: ' + esc(wdef ? wdef.name : wk.typeId) + '</strong><br>' +
          'Faction: ' + esc(wk.faction) + '<br>' +
          'Salvage value now: <strong>' + wk.value + ' scrap</strong> (started at ' + wk.baseValue + ', decays to 0 over 120s)<br>' +
          'Time left: ' + secsLeft + 's<br>' +
          'Wrecks do not block movement and cannot fight.<br>';
        if (selectedUnitIds().length) html += '<button id="info-salvage">Salvage this wreck</button>';
        else html += '<span class="dim">Select one of your units, then tap this wreck to salvage it.</span>';
      }
    }
    if (!html && selected.length === 1) {
      var ent = state.units.filter(function (u) { return u.id === selected[0]; })[0] ||
                state.structures.filter(function (s) { return s.id === selected[0]; })[0];
      if (ent && ent.kind === 'unit') {
        var def = unitDefById(ent.typeId);
        var wnames = ent.weapons.map(function (w) { return w.name; }).join(', ') || 'Unarmed';
        var gn = groupNamesFor(ent.id);
        html = '<strong>' + esc(def.name) + '</strong> (' + esc(ent.faction) + ')<br>' +
          'HP: ' + Math.ceil(ent.hp) + ' / ' + ent.maxHp + ' &nbsp; Armour: ' + esc(ent.armor) + '<br>' +
          'Weapon: ' + esc(wnames) + '<br>' +
          'Cost: ' + def.cost.scrap + ' scrap' + (gn.length ? '<br>Group: ' + gn.join(', ') : '');
        // Twin-Stick Phase A: Take Control in the info panel for a
        // single player unit. Hidden in tutorial games and while
        // already controlling; disabled with the reason for unarmed
        // units. Enemy units never get the button (selection is
        // player-side only, but the faction check is explicit).
        if (!tutorial && !controlUnitId && ent.faction === PLAYER) {
          if (ent.weapons.length) html += '<br><button id="info-take-control">Take Control</button>';
          else html += '<br><span class="dim">This unit has no weapon.</span>';
        }
      } else if (ent) {
        var sdef = structDefById(ent.typeId);
        // Prototype 03: the catalog description for the Command Core
        // still says "elimination in Prototype 01". The catalog itself
        // is not edited; the panel strips stale version references so
        // no stale version string reaches the player.
        var roleText = View ? View.stripVersionRef(sdef.description) : sdef.description;
        html = '<strong>' + esc(sdef.name) + '</strong> (' + esc(ent.faction) + ')<br>' +
          'HP: ' + Math.ceil(ent.hp) + ' / ' + ent.maxHp + ' &nbsp; Armour: ' + esc(ent.armor) + '<br>' +
          'Role: ' + esc(roleText);
      }
    }
    if (!html && selected.length > 1) {
      var counts = {};
      selected.forEach(function (id) {
        var u = state.units.filter(function (x) { return x.id === id; })[0];
        if (u) { var d = unitDefById(u.typeId); counts[d.name] = (counts[d.name] || 0) + 1; }
      });
      html = '<strong>' + selected.length + ' selected</strong><br>' +
        Object.keys(counts).map(function (k) { return esc(k) + ' ×' + counts[k]; }).join('<br>');
    }
    // Tutorial: while a step has a map target, the info panel collapses
    // to name + HP + Close. On a phone the full panel covers ~70% of
    // the short canvas and sits on top of the very point the step asks
    // the player to tap — verification proved taps hit the panel, not
    // the map. Wreck panels are left alone (their salvage button and
    // hint stay). Normal games keep the full panel.
    if (tutorial && tutorial.step >= 1 && tutorial.step <= 5 && html && html.indexOf('<strong>Wreck:') !== 0) {
      html = html.split('<br>').slice(0, 2).join('<br>');
    }
    // Tutorial II, same rule on its map-target steps (select the
    // unit, aim at the target, find the core): the full panel would
    // otherwise sit on the tap point on phones. Drive/release steps
    // need no collapse — panels are suppressed while controlling.
    if (tutorial2 && (tutorial2.step === 0 || tutorial2.step === 2 || tutorial2.step === 4) && html && html.indexOf('<strong>Wreck:') !== 0) {
      html = html.split('<br>').slice(0, 2).join('<br>');
    }
    // Mobile-first finish: every panel is dismissible with a visible
    // Close button (deselects everything, which also closes the build
    // panel, since it only shows for a selected core).
    if (html) html += '<br><button id="info-close" class="close-btn">Close panel</button>';
    info.innerHTML = html;
    info.style.display = html ? 'block' : 'none';
    if (html && !wasInfoShown) panelShownAt = Date.now();
    wasInfoShown = !!html;
    var salBtn = $('info-salvage');
    if (salBtn) salBtn.addEventListener('click', function () { if (panelClickGuard()) return; orderSalvage(selectedWreckId, queueMode); });
    var takeBtn = $('info-take-control');
    if (takeBtn) takeBtn.addEventListener('click', function () { if (panelClickGuard()) return; enterControl(); });
    var closeBtn = $('info-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { if (panelClickGuard()) return; selected = []; selectedWreckId = null; lastPanelSig = ''; });
    // Build panel: only when exactly the player's Command Core is selected.
    var core = null;
    if (selected.length === 1) {
      var s0 = state.structures.filter(function (s) { return s.id === selected[0]; })[0];
      if (s0 && s0.faction === PLAYER && s0.typeId === 'command_core') core = s0;
    }
    if (!core) { build.style.display = 'none'; build.innerHTML = ''; wasBuildShown = false; return; }
    // Twin-Stick Phase A: new production cannot be ordered while
    // controlling — the build panel is replaced by the twin-stick
    // HUD. Queues already running keep advancing in the sim; only
    // ordering is unavailable. (The controlled unit is never a core,
    // so this is belt-and-braces: the panel cannot be reached while
    // controlling, because canvas taps are sticks, not selections.)
    if (controlUnitId) { build.style.display = 'none'; build.innerHTML = ''; wasBuildShown = false; return; }
    var prod = Sim.producibleUnits(state, PLAYER);
    var scrap = Sim.scrapOf(state, PLAYER);
    var bhtml = '<strong>Command Core — Production</strong> <button id="build-close" class="close-btn">Close panel</button><br>' +
      '<span class="dim">Only units with zero Power and zero Components cost are producible until those layers exist.</span><br>' +
      // Prototype 03: rally point row + Set Rally button.
      '<span class="dim">Rally: ' + (core.rally
        ? ' (' + core.rally.x.toFixed(1) + ', ' + core.rally.y.toFixed(1) + ') — new units move there on spawn.'
        : ' none — new units idle next to the core.') + '</span><br>' +
      '<button class="rally-btn" data-core="' + core.id + '">Set Rally</button><br>';
    // Queue FIRST so progress/cancel is visible immediately after queueing,
    // even when the producible list scrolls.
    if (q.items.length) {
      bhtml += '<div class="queue"><strong>Queue:</strong><br>';
      q.items.forEach(function (it, idx) {
        var d = unitDefById(it.typeId);
        var pct = Math.round((1 - it.remainingTicks / it.totalTicks) * 100);
        bhtml += esc(d.name) + ' — ' + pct + '% (' + Math.ceil(it.remainingTicks / 20) + 's left) ' +
          '<button class="cancel-btn" data-idx="' + idx + '">Cancel (refund ' + it.cost + ')</button><br>';
      });
      bhtml += '</div>';
    } else {
      bhtml += '<div class="queue dim">Queue is empty.</div>';
    }
    prod.forEach(function (def) {
      var afford = scrap >= def.cost.scrap;
      bhtml += '<button class="build-btn" data-type="' + def.id + '"' + (afford ? '' : ' disabled title="Not enough scrap"') + '>' +
        esc(def.name) + ' — ' + def.cost.scrap + ' scrap — ' + def.buildTime + 's</button>';
    });
    build.innerHTML = bhtml;
    build.style.display = 'block';
    if (!wasBuildShown) panelShownAt = Date.now();
    wasBuildShown = true;
    var buildClose = $('build-close');
    if (buildClose) buildClose.addEventListener('click', function () { if (panelClickGuard()) return; selected = []; selectedWreckId = null; lastPanelSig = ''; });
    Array.prototype.forEach.call(build.querySelectorAll('.rally-btn'), function (btn) {
      btn.addEventListener('click', function () {
        if (panelClickGuard()) return;
        // Rally mode: keep the core selected, next ground tap sets its
        // rally point (see pointerup). Only the player's core has this
        // button, so the red core can never get a UI rally.
        rallyMode = true; rallyCoreId = Number(btn.getAttribute('data-core'));
        syncFeedback(); // rally hint: tap ground to set the rally point
      });
    });
    Array.prototype.forEach.call(build.querySelectorAll('.build-btn'), function (btn) {
      btn.addEventListener('click', function () {
        if (panelClickGuard()) return;
        var res = Sim.queueProduction(state, PLAYER, core.id, btn.getAttribute('data-type'));
        if (!res.ok) {
          sayFeedback(res.reason === 'insufficient-scrap'
            ? 'Not enough scrap to build that unit.'
            : 'Cannot build that unit (' + res.reason + ').');
        } else syncFeedback();
        lastPanelSig = ''; // force panel refresh (scrap/queue changed)
      });
    });
    Array.prototype.forEach.call(build.querySelectorAll('.cancel-btn'), function (btn) {
      btn.addEventListener('click', function () {
        if (panelClickGuard()) return;
        Sim.cancelProduction(state, PLAYER, Number(btn.getAttribute('data-idx')));
        lastPanelSig = '';
      });
    });
  }

  // ---- Pointer handling ----
  // Mouse drag = selection rectangle (or pan in Pan mode); touch drag
  // = pan (or a selection rectangle in Select mode, v1.8). A drag
  // rectangle is only ever opened when View.wantsPan is false, for
  // either pointer type — the pointerup rect-select below keys on
  // dragRect alone, so the two stay in lockstep by construction.
  // Tap = select/order (<= 8 px). Double-tap/click on a player unit selects
  // all player units of that type. Shift+tap appends to the order queue.
  var pointers = new Map(), downPos = null, downMoved = false, pinchDist = 0, panStart = null;
  var lastTap = null; // {id, time}
  var dragRect = null;
  canvas.addEventListener('pointerdown', function (e) {
    // Twin-Stick Phase A: while controlling, canvas input IS the
    // sticks — never pan, pinch, selection, or an RTS order. A tap
    // outside both stick zones does nothing (it does not select,
    // move, or attack). Two touch pointers are two sticks, not a
    // pinch: pinch handling below is skipped entirely in this mode.
    if (controlUnitId) {
      var cr = canvas.getBoundingClientRect();
      var rx = e.clientX - cr.left, ry = e.clientY - cr.top;
      if (e.pointerType === 'mouse') {
        mouseAim.x = e.clientX; mouseAim.y = e.clientY; mouseAim.seen = true;
        mouseAim.firing = (e.buttons & 1) !== 0 || e.button === 0;
        return;
      }
      var zone = View ? View.stickZoneAt(viewCssW, viewCssH, rx, ry) : null;
      if (!zone) return;
      var taken = false;
      controlSticks.forEach(function (st) { if (st.zone === zone) taken = true; });
      if (taken) return;
      canvas.setPointerCapture(e.pointerId);
      controlSticks.set(e.pointerId, { zone: zone, ox: rx, oy: ry, dx: 0, dy: 0, mag: 0, active: false });
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      dragRect = null; // a second finger turns the gesture into a pinch, not a select-drag
      return;
    }
    zoomAnim = null;
    downPos = { x: e.clientX, y: e.clientY }; downMoved = false;
    panStart = { camX: camera.x, camY: camera.y, x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', function (e) {
    if (controlUnitId) {
      if (e.pointerType === 'mouse') {
        mouseAim.x = e.clientX; mouseAim.y = e.clientY; mouseAim.seen = true;
        mouseAim.firing = (e.buttons & 1) !== 0;
        return;
      }
      var st = controlSticks.get(e.pointerId);
      if (!st || !View) return;
      var mr = canvas.getBoundingClientRect();
      var v = View.stickVector(st.ox, st.oy, e.clientX - mr.left, e.clientY - mr.top, View.STICK_RADIUS, View.STICK_DEADZONE);
      st.dx = v.dx; st.dy = v.dy; st.mag = v.mag; st.active = v.active;
      return;
    }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDist > 0 && View) {
        var midX = (pts[0].x + pts[1].x) / 2, midY = (pts[0].y + pts[1].y) / 2;
        var r = canvas.getBoundingClientRect();
        var mw = screenToWorld(midX, midY);
        setZoomTarget(camera.targetZoom * d / pinchDist, { worldX: mw.x, worldY: mw.y, offsetX: midX - r.left, offsetY: midY - r.top });
      }
      pinchDist = d; downMoved = true;
      return;
    }
    if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) downMoved = true;
    var wantPan = View ? View.wantsPan(e.pointerType, panMode, selectMode) : (e.pointerType === 'touch' || panMode);
    if (downMoved && wantPan && panStart) {
      camera.x = Math.max(0, Math.min(state.width - camera.viewTilesX, panStart.camX - (e.clientX - panStart.x) / camera.zoom / Render.TILE));
      camera.y = Math.max(0, Math.min(state.height - camera.viewTilesY, panStart.camY - (e.clientY - panStart.y) / camera.zoom / Render.TILE));
    }
    if (downMoved && !wantPan) {
      dragRect = { x0: downPos.x, y0: downPos.y, x1: e.clientX, y1: e.clientY };
    }
  });
  canvas.addEventListener('pointerup', function (e) {
    if (controlUnitId) {
      controlSticks.delete(e.pointerId);
      if (e.pointerType === 'mouse') mouseAim.firing = false;
      return;
    }
    pointers.delete(e.pointerId);
    if (pointers.size === 0) pinchDist = 0;
    if (pointers.size === 1) {
      var rem = Array.from(pointers.values())[0];
      downPos = { x: rem.x, y: rem.y }; downMoved = false;
      panStart = { camX: camera.x, camY: camera.y, x: rem.x, y: rem.y };
      dragRect = null;
      return;
    }
    if (!downMoved) lastCanvasTapAt = Date.now();
    var w = screenToWorld(e.clientX, e.clientY);
    // Queue mode (button) is the touch equivalent of Shift: either one
    // appends instead of replacing. Pure helper in View, unit-tested.
    var append = View ? View.queueAppend(e.shiftKey, queueMode) : (!!e.shiftKey || queueMode);
    if (!downMoved) {
      // Prototype 03 rally mode: the next tap anywhere sets the
      // selected core's rally point at that world point and exits
      // rally mode (it does not select or order anything else).
      if (rallyMode && rallyCoreId) {
        var rr = Sim.setRally(state, PLAYER, rallyCoreId, w.x, w.y);
        rallyMode = false; rallyCoreId = 0;
        sayFeedback(rr.ok
          ? 'Rally set at (' + rr.rally.x.toFixed(1) + ', ' + rr.rally.y.toFixed(1) + '). New units will move there on spawn.'
          : 'Rally not set (core lost).');
        lastPanelSig = '';
        return;
      }
      var hit = entityAt(w.x, w.y);
      if (hit && hit.faction === PLAYER && hit.kind === 'unit' && mode === 'guard' && selectedUnitIds().length && selectedUnitIds().indexOf(hit.id) === -1) {
        // Guard mode + tap on a friendly unit (not one of the selected
        // guards) = guard THAT unit; the guard point follows it.
        pendingPatrol = null;
        Sim.issueOrder(state, selectedUnitIds(), { kind: 'guard', guardTargetId: hit.id, x: hit.x, y: hit.y }, { append: append });
        if (state) pathFlashUntil = state.time + 1.5;
      } else if (hit && hit.faction === PLAYER && hit.kind === 'unit') {
        var now = performance.now();
        var isDouble = lastTap && lastTap.id === hit.id && (now - lastTap.time) < 350;
        lastTap = isDouble ? null : { id: hit.id, time: now };
        pendingPatrol = null;
        var sameType = state.units.filter(function (u) { return u.faction === PLAYER && u.typeId === hit.typeId; }).map(function (u) { return u.id; });
        if (isDouble) {
          selected = addMode ? Array.from(new Set(selected.concat(sameType))) : sameType;
        } else if (addMode) {
          if (selected.indexOf(hit.id) === -1) selected.push(hit.id);
        } else {
          selected = [hit.id];
        }
        selectedWreckId = null;
      } else if (hit && hit.faction === PLAYER && hit.kind === 'structure' && mode === 'guard' && selectedUnitIds().length && selected.indexOf(hit.id) === -1) {
        // Guard mode + tap on a friendly structure = guard it.
        pendingPatrol = null;
        Sim.issueOrder(state, selectedUnitIds(), { kind: 'guard', guardTargetId: hit.id, x: hit.x, y: hit.y }, { append: append });
        if (state) pathFlashUntil = state.time + 1.5;
      } else if (hit && hit.faction === PLAYER && hit.kind === 'structure') {
        pendingPatrol = null; lastTap = null;
        selected = addMode && selected.indexOf(hit.id) === -1 ? selected.concat([hit.id]) : [hit.id];
        selectedWreckId = null;
      } else if (hit && hit.faction !== PLAYER) {
        // Enemy unit or structure: attack (never selected).
        pendingPatrol = null;
        orderSelected('attack', w.x, w.y, hit, append);
      } else {
        var wk = wreckAt(w.x, w.y);
        if (wk) {
          if (selectedUnitIds().length) {
            // Tap-on-wreck with units selected = salvage order (any mode).
            orderSalvage(wk.id, append);
            selectedWreckId = wk.id;
          } else {
            selectedWreckId = wk.id;
          }
          pendingPatrol = null;
        } else if (mode === 'patrol') {
          if (!selectedUnitIds().length) { /* nothing to patrol with */ }
          else if (!pendingPatrol) {
            pendingPatrol = { x: w.x, y: w.y };
            bannerEl.textContent = 'Patrol: first point set — tap the second point.';
          } else {
            var pts = [pendingPatrol, { x: w.x, y: w.y }];
            Sim.issueOrder(state, selectedUnitIds(), { kind: 'patrol', points: pts }, { append: append });
            pendingPatrol = null;
            bannerEl.textContent = '';
            if (state) pathFlashUntil = state.time + 1.5;
          }
        } else {
          orderSelected(mode === 'hold' ? 'move' : mode, w.x, w.y, null, append);
        }
      }
      lastPanelSig = '';
    } else if (dragRect) {
      // Rect-select: dragRect is only ever set for a select-drag
      // (mouse with Pan off, touch with Select on), so no pointer-type
      // check is needed here — pan gestures never open one.
      var w0 = screenToWorld(dragRect.x0, dragRect.y0), w1 = screenToWorld(dragRect.x1, dragRect.y1);
      var minX = Math.min(w0.x, w1.x), maxX = Math.max(w0.x, w1.x);
      var minY = Math.min(w0.y, w1.y), maxY = Math.max(w0.y, w1.y);
      var inRect = state.units.filter(function (u) { return u.faction === PLAYER && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY; }).map(function (u) { return u.id; });
      selected = addMode ? Array.from(new Set(selected.concat(inRect))) : inRect;
      selectedWreckId = null;
      dragRect = null;
      lastPanelSig = '';
    }
    // v1.8: selection/mode/patrol may all have changed above — the
    // feedback line must track, not lag one action behind.
    syncFeedback();
    downPos = null; panStart = null;
  });
  canvas.addEventListener('pointercancel', function (e) {
    if (controlUnitId) { controlSticks.delete(e.pointerId); return; }
    pointers.delete(e.pointerId);
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var before = screenToWorld(e.clientX, e.clientY);
    var r = canvas.getBoundingClientRect();
    setZoomTarget(camera.targetZoom * (e.deltaY < 0 ? 1.15 : 0.87), { worldX: before.x, worldY: before.y, offsetX: e.clientX - r.left, offsetY: e.clientY - r.top });
  }, { passive: false });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  // Minimap: click centres; drag pans continuously.
  var miniDragging = false;
  function miniPan(e) {
    // Twin-Stick Phase A: minimap taps do not move the camera while
    // controlling — the camera is locked to the controlled unit.
    if (controlUnitId) return;
    zoomAnim = null;
    var r = mini.getBoundingClientRect();
    var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    camera.x = Math.max(0, Math.min(state.width - camera.viewTilesX, fx * state.width - camera.viewTilesX / 2));
    camera.y = Math.max(0, Math.min(state.height - camera.viewTilesY, fy * state.height - camera.viewTilesY / 2));
  }
  mini.addEventListener('pointerdown', function (e) { miniDragging = true; mini.setPointerCapture(e.pointerId); miniPan(e); });
  mini.addEventListener('pointermove', function (e) { if (miniDragging) miniPan(e); });
  mini.addEventListener('pointerup', function () { miniDragging = false; });
  mini.addEventListener('pointercancel', function () { miniDragging = false; });

  function bindBtn(id, fn) { var el = $(id); if (el) el.addEventListener('click', fn); }
  bindBtn('btn-move', function () { setMode('move'); });
  bindBtn('btn-attackmove', function () { setMode('attackMove'); });
  bindBtn('btn-hold', function () { setMode('hold'); if (selectedUnitIds().length) Sim.issueOrder(state, selectedUnitIds(), { kind: 'hold' }); });
  bindBtn('btn-patrol', function () { setMode('patrol'); });
  bindBtn('btn-salvage', function () { setMode('salvage'); });
  bindBtn('btn-guard', function () { setMode('guard'); });
  // Mobile-first finish: Queue toggle (touch Shift) + command-tray toggle.
  // Twin-Stick Phase A: Take Control (side panel) + Release Control
  // (control strip). The side button is guard-free — it is a
  // persistent button, never newly rendered under a tap — while the
  // info-panel button keeps the panel fall-through guard.
  bindBtn('btn-take-control', function () { enterControl(); });
  bindBtn('btn-drop-back', function () { pressDropBackIn(); });
  bindBtn('btn-ctl-drop', function () { pressDropBackIn(); });
  bindBtn('btn-ctl-ability', function () { pressAbility(); });
  bindBtn('lo-respec', function () { respecLoSkills(); });
  bindBtn('btn-release-control', function () { releaseControl(); });
  // The tray's Pause button is hidden while controlling (the tray is
  // replaced by this strip), so the strip carries its own Pause
  // button: pause must stay reachable by tap, and resume preserves
  // the mode (resumeGame never touches control state).
  bindBtn('btn-ctl-pause', function () { if (pauseMenuOpen) resumeGame(); else openPauseMenu(); });
  bindBtn('btn-queue', function () {
    queueMode = !queueMode;
    var qb = $('btn-queue');
    if (qb) { qb.textContent = queueMode ? 'Queue: On' : 'Queue: Off'; qb.classList.toggle('active', queueMode); }
    sayFeedback(queueMode
      ? 'Queue mode on: taps append orders to the queue. Tap Queue again to turn it off.'
      : 'Queue mode off: taps replace the current order.');
  });
  bindBtn('btn-cmd-more', function () {
    var c = $('commands');
    if (c) c.classList.toggle('expanded');
    syncCmdMore();
    // The tray changing height changes the stage height, so the canvas
    // backing size must follow — otherwise the drawn map stretches and
    // tap coordinates no longer match what is drawn.
    resize();
  });
  bindBtn('btn-minimap', function () { toggleMinimap(); });
  // Prototype 03 on-screen group buttons 1–9 + Assign toggle.
  bindBtn('btn-group-assign', function () {
    groupAssignMode = !groupAssignMode;
    var ga = $('btn-group-assign');
    if (ga) { ga.textContent = groupAssignMode ? 'Assign Group: On' : 'Assign Group: Off'; ga.classList.toggle('active', groupAssignMode); }
    sayFeedback(groupAssignMode
      ? 'Assign mode: tap a group button (1–9) to assign the current selection, then it switches off.'
      : 'Assign mode off.');
  });
  for (var gk = 1; gk <= 9; gk++) {
    (function (key) { bindBtn('btn-group-' + key, function () { groupButtonTap(key); }); })(gk);
  }
  bindBtn('btn-stop', function () { if (selectedUnitIds().length) Sim.issueOrder(state, selectedUnitIds(), { kind: 'hold' }); selected = []; selectedWreckId = null; lastPanelSig = ''; syncFeedback(); });
  bindBtn('btn-all', function () { selected = state.units.filter(function (u) { return u.faction === PLAYER; }).map(function (u) { return u.id; }); lastPanelSig = ''; syncFeedback(); });
  bindBtn('btn-panmode', function () {
    panMode = !panMode;
    $('btn-panmode').textContent = panMode ? 'Pan: On' : 'Pan: Off';
    $('btn-panmode').classList.toggle('active', panMode);
    syncFeedback();
  });
  bindBtn('btn-addmode', function () {
    addMode = !addMode;
    $('btn-addmode').textContent = addMode ? 'Add Select: On' : 'Add Select: Off';
    $('btn-addmode').classList.toggle('active', addMode);
    syncFeedback();
  });
  // v1.8: touch Select mode — the touch mirror of Pan mode. When on,
  // a touch drag draws a selection rectangle instead of panning
  // (mouse drag-select is unchanged). Default stays pan-on-drag.
  bindBtn('btn-selectmode', function () {
    selectMode = !selectMode;
    $('btn-selectmode').textContent = selectMode ? 'Select: On' : 'Select: Off';
    $('btn-selectmode').classList.toggle('active', selectMode);
    syncFeedback();
  });
  bindBtn('btn-reset', function () { newGame(); });
  bindBtn('btn-map-first', function () { startMap('first'); });
  bindBtn('btn-map-second', function () { startMap('second'); });
  bindBtn('btn-map-third', function () { startMap('third'); });
  bindBtn('btn-map-test', function () { startMap('test'); });
  bindBtn('btn-pause', function () { if (pauseMenuOpen) resumeGame(); else openPauseMenu(); });
  bindBtn('btn-menu', function () { openPauseMenu(); });
  bindBtn('btn-zoom-05', function () { setZoomTarget(0.5, centreAnchor()); });
  bindBtn('btn-zoom-1', function () { setZoomTarget(1, centreAnchor()); });
  bindBtn('btn-zoom-2', function () { setZoomTarget(2, centreAnchor()); });
  bindBtn('btn-zoom-in', function () { setZoomTarget(camera.targetZoom * 1.25, centreAnchor()); });
  bindBtn('btn-zoom-out', function () { setZoomTarget(camera.targetZoom / 1.25, centreAnchor()); });
  bindBtn('btn-zoom-sel', function () { zoomToSelection(); });
  bindBtn('btn-paths', function () { togglePaths(); });
  // Main menu
  bindBtn('mm-play-first', function () { startMap('first'); });
  bindBtn('mm-play-second', function () { startMap('second'); });
  bindBtn('mm-play-third', function () { startMap('third'); });
  bindBtn('mm-play-test', function () { startMap('test'); });
  bindBtn('mm-diff-easy', function () { setDifficulty('easy'); });
  bindBtn('mm-diff-normal', function () { setDifficulty('normal'); });
  bindBtn('mm-diff-hard', function () { setDifficulty('hard'); });
  bindBtn('mm-loadout', function () { openLoadout(); });
  bindBtn('mm-store', function () { openStore(); });
  bindBtn('store-close', function () { closeStore(); });
  bindBtn('lo-save', function () { if (panelClickGuard()) return; saveLoadout(); });
  bindBtn('lo-close', function () { closeLoadout(); });
  ['lo-primary', 'lo-secondary', 'lo-armor', 'lo-mobility', 'lo-reactor', 'lo-sensor'].forEach(function (id) {
    var el = $(id); if (el) el.addEventListener('change', updateLoSummary);
  });
  bindBtn('mm-tutorial', function () { startTutorial(); });
  bindBtn('mm-howto', function () { howtoOpen = true; showOverlay('howto-panel', true); });
  bindBtn('howto-tutorial', function () { howtoOpen = false; showOverlay('howto-panel', false); startTutorial(); });
  bindBtn('howto-tutorial2', function () { howtoOpen = false; showOverlay('howto-panel', false); startTutorial2(); });
  // Tutorial bar: Skip exits to the main menu, Next advances without
  // doing the action — no step ever traps the player.
  bindBtn('tut-skip', function () { openMainMenu(); });
  bindBtn('tut-next', function () {
    // Next advances without doing the action, in either tutorial.
    // Tier 2's final step is a screen (its Next-equivalent is the
    // Finish button on the tier-2 end overlay), so Next here caps
    // at step 5 and never skips past the store screen itself.
    if (tutorial2) { enterTutorial2Step(Math.min(5, tutorial2.step + 1)); return; }
    if (!tutorial) return;
    enterTutorialStep(Math.min(6, tutorial.step + 1));
  });
  bindBtn('tut-play', function () { exitTutorial(); startMap('first'); });
  bindBtn('tut-menu', function () { openMainMenu(); });
  // Tutorial II: its own main-menu button (mm-tutorial2, next to
  // mm-tutorial), and its end-overlay buttons. Skip is shared: the
  // tutorial bar's Skip exits to the main menu, and openMainMenu
  // clears tier 2 too.
  bindBtn('mm-tutorial2', function () { startTutorial2(); });
  bindBtn('tut2-store', function () {
    if (!tutorial2) return;
    tutorial2.storeViewed = true;
    openStore();
  });
  bindBtn('tut2-finish', function () { openMainMenu(); });
  bindBtn('tut2-play', function () { exitTutorial2(); startMap('first'); });
  bindBtn('mm-settings', function () { openSettings('main'); });
  bindBtn('howto-close', function () { howtoOpen = false; showOverlay('howto-panel', false); });
  // Pause menu
  bindBtn('pm-resume', function () { resumeGame(); });
  bindBtn('pm-restart', function () { newGame(); resumeGame(); });
  bindBtn('pm-first', function () { startMap('first'); });
  bindBtn('pm-second', function () { startMap('second'); });
  bindBtn('pm-third', function () { startMap('third'); });
  bindBtn('pm-test', function () { startMap('test'); });
  bindBtn('pm-settings', function () { showOverlay('pause-menu', false); openSettings('pause'); });
  bindBtn('pm-quit', function () { openMainMenu(); });
  // Settings panel
  bindBtn('set-close', function () { closeSettings(); });
  bindBtn('set-reset', function () { resetSettings(); });
  ['set-paths', 'set-fx', 'set-shadows', 'set-minimap', 'set-hero'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('change', function () {
      showPaths = $('set-paths').checked; showFX = $('set-fx').checked;
      showShadows = $('set-shadows').checked; showMinimap = $('set-minimap').checked;
      // Hero toggle applies at the next match start only; the match
      // in progress (if any) keeps whatever hero state it started with.
      // Phase C: the toggle is part of the record, so changing it
      // writes the record (same category as a loadout change).
      if ($('set-hero')) heroEnabled = $('set-hero').checked;
      if (heroRecord && heroRecord.heroEnabled !== heroEnabled) { heroRecord.heroEnabled = heroEnabled; saveHeroRecord(); }
      syncSettingsUI();
    });
  });
  // Victory panel
  bindBtn('vic-restart', function () { newGame(); resumeGame(); });
  bindBtn('vic-menu', function () { openMainMenu(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (settingsOpen) closeSettings();
      else if (howtoOpen) { howtoOpen = false; showOverlay('howto-panel', false); }
      else if (pauseMenuOpen) resumeGame();
      // Twin-Stick Phase A: first Esc releases control; a second Esc
      // (now not controlling) opens pause via the branch below. A
      // paused game resumes on Esc as before — pause preserves mode.
      else if (controlUnitId) releaseControl();
      else if (!mainMenuOpen && !victoryShown) openPauseMenu();
      pendingPatrol = null;
      return;
    }
    if (e.key === ' ') {
      if (pauseMenuOpen) resumeGame();
      else if (!mainMenuOpen && !victoryShown && !settingsOpen && !howtoOpen) openPauseMenu();
      e.preventDefault();
      return;
    }
    if (pauseMenuOpen || settingsOpen || howtoOpen || mainMenuOpen || victoryShown) return;
    // Twin-Stick Phase A: WASD moves (desktop). Group recall is
    // ignored while controlling — the controlled unit ignores group
    // orders until released. Zoom/path keys below still work.
    if (controlUnitId) {
      var wk = e.key.toLowerCase();
      if (wk === 'w' || wk === 'a' || wk === 's' || wk === 'd') { controlKeys[wk] = true; return; }
      // Phase C: Q or 1 fires the hero's equipped active ability
      // (Ability 1). For non-hero controlled units pressAbility is
      // a no-op, and group recall stays ignored while controlling.
      if (wk === 'q' || e.key === '1') { pressAbility(); return; }
      if (e.key >= '1' && e.key <= '9') return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
      if (View) View.assignGroup(groups, e.key, selected.slice());
      sayFeedback('Group ' + e.key + ' assigned (' + selected.length + ' selected).');
      e.preventDefault();
      return;
    }
    if (e.key >= '1' && e.key <= '9' && View) {
      var recalled = View.recallGroup(groups, e.key);
      // Prune dead ids against the live sim.
      recalled = recalled.filter(function (id) {
        return state.units.some(function (u) { return u.id === id; }) ||
               state.structures.some(function (s) { return s.id === id; });
      });
      if (recalled.length) { selected = recalled; lastPanelSig = ''; }
      return;
    }
    if (e.key === '+' || e.key === '=') { setZoomTarget(camera.targetZoom * 1.25, centreAnchor()); }
    else if (e.key === '-') { setZoomTarget(camera.targetZoom / 1.25, centreAnchor()); }
    else if (e.key === '0') { setZoomTarget(1, centreAnchor()); }
    else if (e.key === 'f' || e.key === 'F') { zoomToSelection(); }
    else if (e.key === 'p' || e.key === 'P') { togglePaths(); }
  });

  document.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (controlKeys[k]) delete controlKeys[k];
  });

  function snapshotEntities() {
    var snap = { units: {}, structs: {} };
    state.units.forEach(function (u) {
      snap.units[u.id] = { typeId: u.typeId, x: u.x, y: u.y, cooldowns: u.cooldowns.slice(), radius: u.radius };
    });
    state.structures.forEach(function (s) {
      snap.structs[s.id] = { typeId: s.typeId, x: s.x, y: s.y };
    });
    return snap;
  }

  var last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.25, (now - last) / 1000); last = now;
    var preSnap = state ? snapshotEntities() : null;
    if (simRunning()) {
      // Twin-Stick Phase A: manual input is fed to the sim before
      // each step batch, so every tick in the batch moves/fires on
      // the latest stick/key/mouse state — never on a stale vector.
      if (controlUnitId) {
        var cu0 = controlledUnit();
        if (cu0) {
          var inp0 = computeControlInput(cu0);
          Sim.setManualInput(state, cu0.id, inp0.move.x, inp0.move.y, inp0.aimAngle, inp0.firing);
        }
      }
      acc += dt;
      while (acc >= Sim.TICK_DT) {
        // Red combat + economy both run inside Sim.step (sim.js),
        // gated on state.tutorial there. The browser issues no red
        // orders of its own — Cycle 2 removed the old trickle-driver.
        Sim.step(state); acc -= Sim.TICK_DT;
      }
    }
    if (state) {
      if (camera.targetZoom !== undefined && Math.abs(camera.targetZoom - camera.zoom) > 0.001) {
        var k = Math.min(1, dt * 10);
        camera.zoom += (camera.targetZoom - camera.zoom) * k;
        updateViewTiles();
        if (zoomAnim && zoomAnim.anchor) {
          var an = zoomAnim.anchor;
          camera.x = an.worldX - an.offsetX / Render.TILE / camera.zoom;
          camera.y = an.worldY - an.offsetY / Render.TILE / camera.zoom;
        } else if (zoomAnim && zoomAnim.targetX !== undefined) {
          camera.x += (zoomAnim.targetX - camera.x) * k;
          camera.y += (zoomAnim.targetY - camera.y) * k;
        }
        if (View) {
          var clamped = View.clampCamera(camera, state.width, state.height, viewCssW, viewCssH);
          camera.x = clamped.x; camera.y = clamped.y;
        }
        if (Math.abs(camera.targetZoom - camera.zoom) <= 0.005) {
          camera.zoom = camera.targetZoom; updateViewTiles();
          if (!zoomAnim || !zoomAnim.targetX) zoomAnim = null;
          else if (Math.abs(zoomAnim.targetX - camera.x) <= 0.02 && Math.abs(zoomAnim.targetY - camera.y) <= 0.02) {
            camera.x = zoomAnim.targetX; camera.y = zoomAnim.targetY; zoomAnim = null;
          }
        }
      }
      // Prune dead selections (units AND structures).
      selected = selected.filter(function (id) {
        return state.units.some(function (u) { return u.id === id; }) ||
               state.structures.some(function (s) { return s.id === id; });
      });
      if (selectedWreckId && !Sim.findWreck(state, selectedWreckId)) selectedWreckId = null;
      // Twin-Stick Phase A, after the sim steps:
      // - Death: mode exits immediately, camera stays on the death
      //   tile (it does not snap to the core), selection cleared,
      //   normal wreck rules already applied by the sim.
      // - Camera: follows and centres on the controlled unit, clamped
      //   to the map; panning is disabled in this mode (pointer and
      //   minimap handlers both return early while controlling).
      // Twin-Stick Phase B: hero drop telegraph resolves on sim ticks
      // (frozen while a menu is open, since ticks freeze too). Match
      // ending cancels the drop and refunds a death-path payment;
      // otherwise the hero lands at the telegraph tile and is
      // immediately controlled via the Phase A path — Drop Back In is
      // its only entry, and it never idles under RTS orders.
      if (hero && hero.status === 'dropping' && Weapons) {
        if (state.winner) {
          if (hero.dropCost > 0) state.scrap[PLAYER] = Sim.scrapOf(state, PLAYER) + hero.dropCost;
          Hero.cancelDrop(hero);
        } else if (state.tick >= hero.dropLandingTick) {
          // Phase C: the drop uses the record's level and skills
          // (level-scaled HP/damage, Reinforced Frame, Targeting
          // Computer) — a level-1 hero with no skills resolves
          // exactly as in Phase B.
          var hStats = Weapons.heroStats(hero.loadout, HERO_BASE, { level: heroLevel, skills: state.heroSkills || [] });
          var hTile = hero.dropTile;
          var hu = Sim.addCustomUnit(state, { typeId: 'lancer_mech', faction: PLAYER,
            x: hTile.x, y: hTile.y, hp: (hero.hp !== null && hero.hp !== undefined) ? hero.hp : hStats.maxHp,
            maxHp: hStats.maxHp, armor: hStats.armor, speed: hStats.speed, vision: hStats.vision,
            radius: hStats.radius, movementClass: 'ground', weapons: hStats.weapons,
            isHero: true, costScrap: HERO_COST_SCRAP });
          Hero.landDrop(hero, hu.id);
          if (Sim.setManualControl(state, hu.id).ok) {
            controlUnitId = hu.id; controlSticks.clear(); controlKeys = {};
            mouseAim = { x: 0, y: 0, firing: false, seen: false };
            document.body.classList.add('controlling');
            bannerEl.textContent = 'Command Mech on the field — left stick moves, right stick aims and fires. Release Control withdraws it to reserve.';
            lastPanelSig = '';
            selected = [hu.id];
          }
        }
      }
      syncDropButtons();
      if (controlUnitId) {
        var cu1 = controlledUnit();
        if (!cu1) {
          // Twin-Stick Phase B: a controlled hero's death is a hero
          // death (wreck + redeploy terms), not a withdrawal.
          if (hero && hero.unitId === controlUnitId) Hero.die(hero, state.tick);
          resetControlUI();
          selected = [];
          sayFeedback('Controlled unit destroyed.');
        } else if (View) {
          updateViewTiles();
          var follow = View.clampCamera({ x: cu1.x - camera.viewTilesX / 2, y: cu1.y - camera.viewTilesY / 2, zoom: camera.zoom },
            state.width, state.height, viewCssW, viewCssH);
          camera.x = follow.x; camera.y = follow.y;
          // Control strip: HP + weapon range note, updated only when
          // the text actually changes (this runs every frame).
          var maxRange = 0;
          cu1.weapons.forEach(function (w) { if (w.range > maxRange) maxRange = w.range; });
          var stripText = 'HP: ' + Math.ceil(cu1.hp) + ' / ' + cu1.maxHp + '  |  Weapon range: ' + maxRange + ' tiles';
          if (stripText !== lastControlStripText) {
            lastControlStripText = stripText;
            var hpEl = $('ctl-hp'); if (hpEl) hpEl.textContent = stripText;
          }
          syncAbilityButton(); // Phase C: cooldown countdown ticks with the strip
        }
      }
      // Render-layer animation events, from the pre/post diff. Sim
      // wrecks are now the source of truth: visual wrecks are derived
      // from state.wrecks (so they decay/expire with the sim records),
      // and the diff only feeds explosion/fire FX.
      var unitAnim = {};
      var wrecks = state.wrecks.map(function (w) {
        return { id: w.id, typeId: w.typeId, x: w.x, y: w.y, radius: w.radius, rot: ((w.id * 37) % 360) * Math.PI / 180 };
      });
      if (Anim && preSnap) {
        var t = state.time;
        Object.keys(preSnap.units).forEach(function (id) {
          if (!state.units.some(function (u) { return u.id === Number(id); })) {
            var dead = preSnap.units[id];
            effects.push({ kind: 'explosion', x: dead.x, y: dead.y, start: t, sizeTiles: 2 });
            effects.push({ kind: 'fire', x: dead.x, y: dead.y, start: t, sizeTiles: 1.6 });
          }
        });
        Object.keys(preSnap.structs).forEach(function (id) {
          if (!state.structures.some(function (s) { return s.id === Number(id); })) {
            var ds = preSnap.structs[id];
            effects.push({ kind: 'explosion', x: ds.x, y: ds.y, start: t, sizeTiles: 3 });
            effects.push({ kind: 'fire', x: ds.x, y: ds.y, start: t, sizeTiles: 2.4 });
            // Wave-2 persistent structure wreck (render-layer only):
            // radius from the catalog footprint, like sim structures.
            var sdef = null;
            if (catalog && catalog.structures) {
              for (var di = 0; di < catalog.structures.length; di++) {
                if (catalog.structures[di].id === ds.typeId) { sdef = catalog.structures[di]; break; }
              }
            }
            structureWrecks.push({ id: Number(id), typeId: ds.typeId, x: ds.x, y: ds.y,
              radius: sdef ? sdef.footprint / 2 : 1, rot: ((Number(id) * 53) % 360) * Math.PI / 180 });
          }
        });
        state.units.forEach(function (u) {
          var prev = preSnap.units[u.id];
          var moved = false;
          if (prev) {
            moved = Math.hypot(u.x - prev.x, u.y - prev.y) > 0.01;
            for (var wi = 0; wi < u.cooldowns.length; wi++) {
              if (prev.cooldowns[wi] <= 0 && u.cooldowns[wi] > 0.05) {
                lastMuzzle[u.id] = t;
                var bx = u.x + Math.cos(u.turretFacing) * u.radius * 1.3;
                var by = u.y + Math.sin(u.turretFacing) * u.radius * 1.3;
                effects.push({ kind: 'muzzle', x: bx, y: by, angle: u.turretFacing, start: t, sizeTiles: 0.9 });
                break;
              }
            }
          } else {
            moved = u.path.length > 0;
          }
          if (u.order.kind === 'move' || u.order.kind === 'attackMove' || u.order.kind === 'patrol' || u.order.kind === 'salvage') moved = moved || u.path.length > 0;
          if (moved && u.movementClass === 'ground' && (!lastDust[u.id] || t - lastDust[u.id] >= 0.5)) {
            lastDust[u.id] = t;
            effects.push({ kind: 'dust', x: u.x, y: u.y, start: t, sizeTiles: 0.8 });
          }
          unitAnim[u.id] = {
            bobTiles: showFX ? Anim.bobFor(u, unitDefById(u.typeId), t, moved) : 0,
            recoilPx: (showFX && lastMuzzle[u.id] !== undefined && t - lastMuzzle[u.id] < 0.12) ? 2 : 0
          };
        });
        effects = effects.filter(function (e) { return t - e.start < Anim.EFFECT_DURATIONS[e.kind]; });
        // Fixed-pool behaviour for transient FX: cap the live list and
        // steal from the oldest first, so a long battle cannot grow
        // the per-frame FX list without bound. FX are pre-rendered
        // sprites (plus the cached glow sprites in render.js) — the
        // cap bounds list work, not allocations per particle.
        if (effects.length > 96) effects.splice(0, effects.length - 96);
      }
      var anim = { time: state.time, wrecks: wrecks, effects: effects, unitAnim: unitAnim, overlayMap: overlayMap,
        structureWrecks: structureWrecks,
        showPaths: showPaths, pathFlashUntil: pathFlashUntil,
        selectedWreckId: selectedWreckId, showFX: showFX, showShadows: showShadows };
      // DPR transform: drawScene works in CSS pixels; the transform
      // scales it onto the DPR-capped backing store.
      ctx.setTransform(viewDpr, 0, 0, viewDpr, 0, 0);
      Render.drawScene(ctx, state, camera, selected, viewCssW, viewCssH, anim);
      // v1.8: draw the drag-selection rectangle (mouse, and touch in
      // Select mode). Before this, a drag-select drew NOTHING — the
      // player dragged blind. Client px convert to canvas CSS px via
      // the canvas rect, in the same DPR transform drawScene uses.
      if (dragRect) {
        var dr = canvas.getBoundingClientRect();
        var dx0 = Math.min(dragRect.x0, dragRect.x1) - dr.left, dy0 = Math.min(dragRect.y0, dragRect.y1) - dr.top;
        var dw = Math.abs(dragRect.x1 - dragRect.x0), dh = Math.abs(dragRect.y1 - dragRect.y0);
        ctx.save();
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
        ctx.fillStyle = 'rgba(255, 224, 102, 0.12)';
        ctx.fillRect(dx0, dy0, dw, dh); ctx.strokeRect(dx0, dy0, dw, dh);
        ctx.restore();
      }
      // Twin-Stick Phase A overlay (shell-drawn, so render.js stays
      // mode-free): the controlled unit's weapon range ring, and the
      // live stick bases/knobs for any active touch stick.
      if (controlUnitId) {
        var cu2 = controlledUnit();
        if (cu2) {
          var ux = (cu2.x - camera.x) * Render.TILE * camera.zoom;
          var uy = (cu2.y - camera.y) * Render.TILE * camera.zoom;
          var mr2 = 0;
          cu2.weapons.forEach(function (w) { if (w.range > mr2) mr2 = w.range; });
          if (mr2 > 0) {
            ctx.save();
            ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.globalAlpha = 0.7;
            ctx.beginPath(); ctx.arc(ux, uy, mr2 * Render.TILE * camera.zoom, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          }
          controlSticks.forEach(function (st) {
            if (!st.active) return;
            ctx.save();
            ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(st.ox, st.oy, 48, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(st.ox + st.dx * 40, st.oy + st.dy * 40, 18, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          });
        }
      }
      // Twin-Stick Phase B overlay (shell-drawn, so render.js stays
      // mode-free): the drop telegraph marker, and a gold badge on
      // the field hero so a player facing it sees it is the hero.
      if (hero && hero.status === 'dropping' && hero.dropTile) {
        var dx0 = (hero.dropTile.x - camera.x) * Render.TILE * camera.zoom;
        var dy0 = (hero.dropTile.y - camera.y) * Render.TILE * camera.zoom;
        var dr = Math.max(12, 1.1 * Render.TILE * camera.zoom);
        ctx.save();
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3;
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin(state.time * 5);
        ctx.beginPath(); ctx.arc(dx0, dy0, dr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      if (hero && hero.unitId) {
        var hu2 = state.units.filter(function (x) { return x.id === hero.unitId; })[0];
        if (hu2) {
          var hx2 = (hu2.x - camera.x) * Render.TILE * camera.zoom;
          var hy2 = (hu2.y - camera.y) * Render.TILE * camera.zoom;
          ctx.save();
          ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(hx2, hy2, Math.max(10, 1.0 * Render.TILE * camera.zoom), 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ffe066'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          // Phase C level badge: a player facing the hero sees its
          // level (CMD 9), not just that it is the hero.
          ctx.fillText('CMD ' + heroLevel, hx2, hy2 - Math.max(12, 1.1 * Render.TILE * camera.zoom));
          ctx.restore();
        }
      }
      // Tutorial highlight: a pulsing yellow ring on the thing to tap
      // next (unit, ground point, target, core, or wreck). Drawn by
      // the shell, not the renderer, so render.js stays tutorial-free.
      var hl = tutorialHighlight() || tutorial2Highlight();
      if (hl) {
        var hx = (hl.x - camera.x) * Render.TILE * camera.zoom;
        var hy = (hl.y - camera.y) * Render.TILE * camera.zoom;
        var hr = Math.max(10, 1.3 * Render.TILE * camera.zoom);
        ctx.save();
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3;
        ctx.globalAlpha = 0.65 + 0.35 * Math.sin(state.time * 5);
        ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffe066'; ctx.fill();
        ctx.restore();
      }
      checkTutorialAdvance();
      updateTutorialBar();
      checkTutorial2Advance();
      updateTutorial2Bar();
      if (showMinimap) Render.drawMinimap(mctx, state, camera, mini.width, mini.height, wrecks);
      var blue = state.units.filter(function (u) { return u.faction === 'iron_eden'; }).length;
      var red = state.units.filter(function (u) { return u.faction === 'xandria'; }).length;
      // Mobile-first finish: on phone width the status bar condenses to
      // the numbers that matter (scrap, both armies, tick, zoom); the
      // full line (map, wrecks, selection, mode) stays on desktop.
      if (window.innerWidth <= 640) {
        // Normal-game clarity: the current mode is now visible on the
        // phone top bar too (short name, so it fits). Before this, a
        // phone player could not see which mode a tap would act in.
        var shortMode = View ? View.modeShort(mode) : mode;
        statusEl.textContent = 'Scrap: ' + Sim.scrapOf(state, PLAYER) + '  |  Blue: ' + blue + '  |  Red: ' + red +
          '  |  Tick: ' + state.tick + '  |  Zoom: ' + camera.zoom.toFixed(2) + '  |  ' + shortMode +
          (queueMode ? ' (Queue)' : '') + (selectMode ? ' (Sel)' : '');
      } else {
        statusEl.textContent = 'Map: ' + (currentMap === 'test' ? 'Test Map 64x40' : currentMap === 'third' ? 'Third Map — Forest Belt 80x50' : currentMap === 'second' ? 'Second Map — Twin Bridges 80x50' : 'First Map 80x50') + '  |  Scrap: ' + Sim.scrapOf(state, PLAYER) +
          '  |  Iron Eden units: ' + blue + '  |  Xandria units: ' + red + '  |  Wrecks: ' + state.wrecks.length +
          '  |  Tick: ' + state.tick + '  |  Selected: ' + selected.length + '  |  Mode: ' + mode +
          (panMode ? ' (Pan)' : '') + (selectMode ? ' (Select)' : '') + (addMode ? ' (Add)' : '') + (queueMode ? ' (Queue)' : '') + '  |  Zoom: ' + camera.zoom.toFixed(2);
      }
      if (state.winner) showVictory();
      updatePanels();
    }
  }

  // Wave-2 UI icons: generated icons SUPPLEMENT the order-button text
  // labels (text stays for clarity/accessibility). Wired here in the
  // shell so index.html needs no structural change; a missing icon
  // file simply leaves the text button as it was.
  function addOrderIcons() {
    if (!Assets) return;
    var map = { 'btn-move': 'move', 'btn-attackmove': 'attack-move',
      'btn-hold': 'hold', 'btn-patrol': 'patrol', 'btn-salvage': 'salvage',
      'btn-guard': 'guard', 'btn-drop-back': 'drop-back-in',
      'btn-ctl-drop': 'drop-back-in' };
    Object.keys(map).forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn || btn.querySelector('.cmd-icon')) return;
      var img = document.createElement('img');
      img.className = 'cmd-icon';
      img.alt = '';
      img.src = Assets.iconPath(map[id]);
      btn.insertBefore(img, btn.firstChild);
    });
  }
  newGame(); resize(); syncSettingsUI(); addOrderIcons(); openMainMenu();
  // Mobile-first finish: on phone width the command tray starts
  // collapsed (order row + More button visible); on desktop it starts
  // expanded. The toggle always overrides this initial state.
  (function () {
    var c = $('commands');
    if (c && window.innerWidth <= 640) c.classList.remove('expanded');
    syncCmdMore();
    // Collapsing the tray on phone grows the stage: re-run resize so
    // the canvas backing size matches its displayed size (see cmd-more).
    resize();
  })();
  // Rotate hint (portrait only, non-blocking): the pill itself ignores
  // pointer events (CSS), only its dismiss button takes them, so it
  // can never block a map tap. Dismissal is remembered for the session
  // (sessionStorage, guarded for file:// contexts where storage may
  // throw) and the pill never reappears after dismissal in that
  // session. The web build never locks orientation — the Screen
  // Orientation API cannot lock reliably outside fullscreen/installed
  // contexts, so no lock is attempted here; the APK manifest lock is
  // documented in LANDSCAPE-REPORT.md instead.
  (function () {
    var hint = $('rotate-hint');
    if (!hint) return;
    try {
      if (window.sessionStorage && sessionStorage.getItem('sw-rotate-dismissed')) {
        hint.classList.add('rotate-hidden');
      }
    } catch (e) { /* storage unavailable: hint stays dismissible per load */ }
    var dismiss = $('btn-rotate-dismiss');
    if (dismiss) dismiss.addEventListener('click', function () {
      try {
        if (window.sessionStorage) sessionStorage.setItem('sw-rotate-dismissed', '1');
      } catch (e) { /* ignore */ }
      hint.classList.add('rotate-hidden');
    });
  })();
  // Layout can still shift after first paint (fonts, overlay boxes), so
  // re-sync the canvas once the page has fully loaded.
  window.addEventListener('load', resize);
  requestAnimationFrame(frame);
})();
