/* WAVE 6 (BETA-12H): full beta pass + open-item closure regression tests.
   - No-depth checklist against the v1.6 baseline, counted in code.
   - Wave 1 secondary finding: secondaries DO fire when the hero is
     in melee range (the Wave 1 zero was range-gating, not a bug:
     an RTS hero stops at primary range and never closes to 1.2).
   - Red-AI fielding mechanism: saturation queues needlewing first.
   - Tutorial economy guards in game.js (tier 1 + tier 2 exempt
     from pack-used marking and from XP/Credit grants).
   - Gilded Reach still a pierce sidegrade below family baseline.
   No old test is changed here. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');
const Curr = require('../game/currency.js');
const View = require('../game/view.js');

const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };

test('beta12h: no-depth checklist — v1.6 baseline counts all still present or grown', () => {
  assert.equal(catalog.units.length, 57, 'units 49 -> 57 (Wave 2)');
  assert.equal(Weapons.NAMED_WEAPONS.length, 125, 'named weapon rows 123 -> 125 (Wave 4 premium rows)');
  assert.equal(Weapons.GEAR_ROWS.length, 16, 'gear rows 12 -> 16 (Wave 3 trade-offs)');
  assert.equal(Prog.SKILLS.length, 10, 'skills 8 -> 10 (Wave 3)');
  assert.equal(Prog.MAX_MASTERY, 5, 'mastery ranks 0 -> 5 (Wave 3)');
  assert.deepEqual(Prog.MASTERY_CURVE, [5500, 6800, 8300, 10000, 11900]);
  assert.equal(Curr.PACKS.length, 4, 'store packs 0 -> 4 (Wave 4)');
  assert.equal(Curr.CURRENCY_NAME, 'Salvage Credits', 'currency 0 -> 1 (Wave 4)');
  assert.equal(typeof Maps.createFirstMap, 'function');
  assert.equal(typeof Maps.createSecondMap, 'function');
  assert.equal(typeof Maps.createThirdMap, 'function');
  assert.equal(View.TUTORIAL_STEPS.length, 7, 'tier-1 tutorial steps unchanged');
  // v1.6 features still present (spot pins, not a re-audit of every suite):
  assert.equal(Sim.DIFFICULTY_PARAMS.normal.gatherCount, 8);
  assert.equal(Sim.AI_QUEUE_CAP, 3);
  assert.equal(Sim.AI_PER_TYPE_CAP, 3);
  assert.equal(Sim.WRECK_LIFETIME_TICKS, 2400);
  assert.equal(Prog.MAX_LEVEL, 10);
});

test('beta12h: tier-2 tutorial exists in game.js with 6 steps in order', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'game', 'game.js'), 'utf8');
  const ids = ['takecontrol', 'drive', 'aimfire', 'release', 'dropback', 'store'];
  let last = -1;
  for (const id of ids) {
    const i = src.indexOf("id: '" + id + "'");
    assert.ok(i > last, 'tutorial2 step ' + id + ' present in order');
    last = i;
  }
  assert.ok(src.includes('function startTutorial2'), 'startTutorial2 present');
  assert.ok(src.includes('function startTutorial'), 'tier-1 startTutorial present');
});

function arena(primary, secondary, dist, ticks) {
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 42 });
  const lo = { primary, secondary, armor: null, mobility: null, reactor: null, sensor: null, ability: null };
  const st = Weapons.heroStats(lo, HERO_BASE);
  const hero = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
    x: 20, y: 25, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
    vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
    isHero: true, costScrap: 380 });
  const foe = Sim.addUnit(s, 'bulwark_mech', 'xandria', 20 + dist, 25);
  Sim.issueOrder(s, [hero.id], { kind: 'hold' });
  Sim.issueOrder(s, [foe.id], { kind: 'hold' });
  const hp0 = foe.hp;
  for (let t = 0; t < ticks; t++) { Sim.step(s); if (!foe.alive || !hero || !s.units.some((u) => u.id === hero.id)) break; }
  return { foeHp0: hp0, foeHp: foe.alive ? foe.hp : 0, foeAlive: foe.alive,
    heroAlive: s.units.some((u) => u.id === hero.id) };
}

test('beta12h: secondaries fire when the hero is driven into melee range', () => {
  // Twin-Bore Autogun (range 6) + Plasma Machete (range 1.5), both
  // on hold, foe on hold, 100 ticks. At 1.0 tile both weapons are in
  // range; at 5.0 tiles only the primary is.
  const closeSingle = arena('nw_twin_bore_autogun', null, 1.0, 100);
  const closeDual = arena('nw_twin_bore_autogun', 'nw_plasma_machete', 1.0, 100);
  assert.ok(closeDual.foeAlive && closeSingle.foeAlive, 'both foes alive at 100 ticks for a clean comparison');
  assert.ok(closeDual.foeHp < closeSingle.foeHp,
    'melee secondary adds damage at 1 tile: dual foe HP ' + closeDual.foeHp + ' vs single ' + closeSingle.foeHp);
  const farSingle = arena('nw_twin_bore_autogun', null, 5.0, 100);
  const farDual = arena('nw_twin_bore_autogun', 'nw_plasma_machete', 5.0, 100);
  assert.equal(farDual.foeHp, farSingle.foeHp,
    'melee secondary adds exactly nothing at 5 tiles (out of its 1.5 range): ' + farDual.foeHp + ' vs ' + farSingle.foeHp);
});

test('beta12h: red AI queues needlewing first once every cheaper type is capped', () => {
  // Mechanism behind the Wave 2 exclusion: cheapest-first below the
  // per-type cap of 3. Cheaper Xandria producibles, in cost order:
  // scout_buggy 80, sensor_drone 80, combat_drone 90, radar_scout
  // 110, vespid_scout 120, fast_raider 140 (same tier as needlewing,
  // first in catalog order). Saturation = 3 live of each.
  const map = Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  Maps.spawnFirstMapScenario(Sim, s);
  s.units = s.units.filter((u) => u.faction !== 'xandria');
  const spots = [];
  for (let x = 60; x < 78; x += 2) for (let y = 10; y < 42; y += 2) spots.push([x, y]);
  let si = 0;
  for (const typeId of ['scout_buggy', 'sensor_drone', 'combat_drone', 'radar_scout', 'vespid_scout', 'fast_raider'])
    for (let k = 0; k < 3; k++) { const [x, y] = spots[si++]; Sim.addUnit(s, typeId, 'xandria', x, y); }
  s.scrap['xandria'] = 5000;
  for (let t = 0; t < 200 && !s.winner; t++) Sim.step(s);
  const q = Sim.productionQueue(s, 'xandria').items.map((i) => i.typeId);
  assert.ok(q.indexOf('needlewing') !== -1, 'saturated AI queues needlewing, queue=' + JSON.stringify(q));
  // And the ordering fact itself, straight from the producible list:
  const prod = Sim.producibleUnits(s, 'xandria').slice().sort((a, b) => a.cost.scrap - b.cost.scrap);
  const idx = {};
  prod.forEach((u, i) => { idx[u.id] = i; });
  assert.ok(idx['fast_raider'] < idx['needlewing'], 'fast_raider precedes needlewing within the 140 tier');
  assert.ok(idx['needlewing'] < idx['javelin'] && idx['needlewing'] < idx['raptor'],
    '140-tier new types precede the 300/320-tier new types');
});

test('beta12h: tutorial games are exempt from pack-used marking and grants (game.js guards)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'game', 'game.js'), 'utf8');
  assert.ok(src.includes('if (heroMatch && !tutorial2Starting && !tutorial2 && Curr && wallet && wallet.equipped)'),
    'mark-used block skips tier-2 starts (tutorial2Starting) and tier-2 restarts (tutorial2)');
  assert.ok(src.includes('if (heroMatch && !matchXpWritten && state && !state.tutorial && heroRecord && Prog && state.heroXp)'),
    'showVictory grant block skips tutorial games via state.tutorial');
  assert.ok(src.includes('tutorial2Starting = true;') && src.includes('tutorial2Starting = false;'),
    'startTutorial2 sets and clears tutorial2Starting around newGame');
  assert.ok(src.includes('var tutorial2Starting = false;'),
    'BETA-12H REGRESSION: the flag must be DECLARED beside tutorialStarting — the first Wave 6 edit shipped only the comment, so every newGame read threw ReferenceError and the main menu never rendered (caught by the Wave 6 browser pass, not by the guard-string test)');
  assert.ok(src.includes('tutorialStarting = true;'),
    'tier-1 tutorialStarting guard still present (hero branch skipped, so tier 1 never marks or grants)');
});

test('beta12h: Gilded Reach is still a pierce sidegrade below family baseline', () => {
  const row = Weapons.rowById('nw_gilded_lance');
  assert.ok(row, 'premium row present');
  const resolved = Weapons.resolveWeapon(row);
  assert.equal(resolved.special, 'pierce');
  assert.equal(resolved.range, 8, 'Wave 4 second retune (range bonus removed) still holds');
  const dps = resolved.damage * resolved.accuracy / resolved.interval;
  const baseline = Weapons.FAMILY_BASELINES ? Weapons.FAMILY_BASELINES['Laser'] : null;
  if (baseline) {
    const baseDps = baseline.damage * baseline.accuracy / baseline.interval;
    assert.ok(dps < baseDps, 'Gilded DPS ' + dps.toFixed(2) + ' below Laser baseline ' + baseDps.toFixed(2));
    assert.ok(dps <= 1.5 * baseDps, 'within the 1.5x family bound');
  }
  const pack = Curr.packById('pack_gilded_reach');
  assert.equal(pack.price, 450, 'price never raised as a balance substitute');
});
