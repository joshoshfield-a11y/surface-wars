/* Surface Wars — Twin-Stick Phase B: hero reserve presence model.
   DOM-free: the browser shell (game.js) and node tests share this file.
   The Command Mech (placeholder name only — the final name is an open
   decision, never invented here) is OFF-MAP IN RESERVE by default. It
   is on the field ONLY while the player actively controls it in
   twin-stick mode, and it is NEVER a hidden or invulnerable unit left
   in the sim's field lists: reserve means it is not a sim entity at
   all, and dropping re-adds it (sim.addCustomUnit) while withdrawal
   removes it (sim.withdrawUnit, no wreck, no scrap).
   States: reserve -> dropping (telegraph) -> field -> reserve, or
   field -> dead (wreck) -> dropping -> field. Death never leads to
   reserve. Match ending during a telegraph cancels the drop.
   All cooldowns/costs below are PROPOSED numbers from the twin-stick
   spec (reserve amendment §4.2), not user decisions: voluntary
   redeploy free after 10 s (200 ticks); death redeploy 200 scrap +
   30 s (600 ticks), waiting if broke (timer does not reset, debt
   does not grow); drop telegraph 2 s (40 ticks); no automatic
   respawn — the player must press Drop Back In. A dead core blocks
   both paths. */
(function (global) {
  'use strict';
  var DROP_TELEGRAPH_TICKS = 40; // 2 s at 20 ticks/s (PROPOSED)
  var VOLUNTARY_COOLDOWN_TICKS = 200; // 10 s (PROPOSED)
  var DEATH_COOLDOWN_TICKS = 600; // 30 s (PROPOSED)
  var DEATH_COST_SCRAP = 200; // (PROPOSED)
  var HERO_TYPE_ID = 'lancer_mech'; // the hero REPLACES this roster entry
  var HERO_FACTION = 'iron_eden';

  function startMatch(loadout) {
    return { loadout: loadout, status: 'reserve', hp: null, unitId: 0,
      withdrawTick: -1, deathTick: 0, preDropStatus: null,
      dropTile: null, dropLandingTick: 0, dropCost: 0 };
  }
  // Remove the west roster's lancer_mech entry from a freshly spawned
  // scenario, so the opening field count is 9v10 with the hero in
  // reserve — not 10v10 on the field. Returns the removed unit id (0
  // when no such unit exists, e.g. a scenario that never had one).
  function applyRoster(state) {
    for (var i = 0; i < state.units.length; i++) {
      var u = state.units[i];
      if (u.faction === HERO_FACTION && u.typeId === HERO_TYPE_ID) {
        state.units.splice(i, 1);
        return { replaced: true, removedId: u.id };
      }
    }
    return { replaced: false, removedId: 0 };
  }
  function ceilSeconds(ticks) { return Math.ceil(ticks / 20); }
  // Can Drop Back In be pressed now? facts: {coreAlive, scrap, tick,
  // dropTile} where dropTile is null when no passable tile exists near
  // the core. Every failure carries a REASON string for the button
  // title — never a silent disable. kind: 'ok' | 'field' | 'dropping'
  // | 'core' | 'notile' | 'cooldown' | 'scrap'.
  function canDrop(hero, facts) {
    if (hero.status === 'field' || hero.unitId) return { ok: false, kind: 'field', reason: 'Command Mech already on the field.' };
    if (hero.status === 'dropping') return { ok: false, kind: 'dropping', reason: 'Command Mech already dropping in.' };
    if (!facts.coreAlive) return { ok: false, kind: 'core', reason: 'Command Core destroyed — no redeploy.' };
    if (!facts.dropTile) return { ok: false, kind: 'notile', reason: 'No drop tile near the Command Core.' };
    if (hero.status === 'dead') {
      var waited = facts.tick - hero.deathTick;
      if (waited < DEATH_COOLDOWN_TICKS) return { ok: false, kind: 'cooldown', reason: 'Drop ready in ' + ceilSeconds(DEATH_COOLDOWN_TICKS - waited) + 's.', waitTicks: DEATH_COOLDOWN_TICKS - waited };
      if (facts.scrap < DEATH_COST_SCRAP) return { ok: false, kind: 'scrap', reason: 'Drop needs 200 scrap (you have ' + facts.scrap + ').', cost: DEATH_COST_SCRAP };
      return { ok: true, kind: 'ok', reason: '', cost: DEATH_COST_SCRAP };
    }
    // Reserve: a voluntary withdrawal cools down; a fresh match (never
    // withdrawn) has withdrawTick -1 and drops immediately. The -1
    // sentinel matters: a withdrawal at tick 0 is real (canDrop must
    // cool it down), and the old `> 0` gate treated tick 0 as "never
    // withdrawn" (beta wave-1 BUG-LOW-1).
    if (hero.withdrawTick >= 0) {
      var since = facts.tick - hero.withdrawTick;
      if (since < VOLUNTARY_COOLDOWN_TICKS) return { ok: false, kind: 'cooldown', reason: 'Drop ready in ' + ceilSeconds(VOLUNTARY_COOLDOWN_TICKS - since) + 's.', waitTicks: VOLUNTARY_COOLDOWN_TICKS - since };
    }
    return { ok: true, kind: 'ok', reason: '', cost: 0 };
  }
  function startDrop(hero, tile, tick, cost) {
    hero.preDropStatus = hero.status;
    hero.status = 'dropping';
    hero.dropTile = tile;
    hero.dropLandingTick = tick + DROP_TELEGRAPH_TICKS;
    hero.dropCost = cost;
  }
  function cancelDrop(hero) {
    // Only a telegraph in progress can be cancelled. A dead hero must
    // never return to reserve through this path (the shell only calls
    // it while status is 'dropping', but the helper must not resurrect
    // on its own if called from anywhere else).
    if (hero.status !== 'dropping') return;
    hero.status = hero.preDropStatus || 'reserve';
    hero.preDropStatus = null;
    hero.dropTile = null; hero.dropLandingTick = 0; hero.dropCost = 0;
  }
  function landDrop(hero, unitId) {
    hero.status = 'field';
    hero.unitId = unitId;
    hero.preDropStatus = null;
    hero.dropTile = null; hero.dropLandingTick = 0; hero.dropCost = 0;
  }
  // Voluntary withdrawal: exact HP is kept for the next drop in this
  // match. It is NOT a heal, and it creates no wreck, no scrap, no XP.
  function withdraw(hero, hp, tick) {
    hero.status = 'reserve';
    hero.hp = hp;
    hero.unitId = 0;
    hero.withdrawTick = tick;
    hero.dropTile = null; hero.dropLandingTick = 0; hero.dropCost = 0;
  }
  function die(hero, tick) {
    hero.status = 'dead';
    hero.hp = 0;
    hero.unitId = 0;
    hero.deathTick = tick;
    hero.dropTile = null; hero.dropLandingTick = 0; hero.dropCost = 0;
  }

  var api = { DROP_TELEGRAPH_TICKS: DROP_TELEGRAPH_TICKS,
    VOLUNTARY_COOLDOWN_TICKS: VOLUNTARY_COOLDOWN_TICKS,
    DEATH_COOLDOWN_TICKS: DEATH_COOLDOWN_TICKS,
    DEATH_COST_SCRAP: DEATH_COST_SCRAP,
    HERO_TYPE_ID: HERO_TYPE_ID, HERO_FACTION: HERO_FACTION,
    startMatch: startMatch, applyRoster: applyRoster, canDrop: canDrop,
    startDrop: startDrop, cancelDrop: cancelDrop, landDrop: landDrop,
    withdraw: withdraw, die: die };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWHero = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
