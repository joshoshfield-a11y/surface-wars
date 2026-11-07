/* Beta wave 3 — balance investigation driver (Node sim, NOT the browser).
   Compares three blue play styles on identical seeds so the ONLY
   differences are the play elements, never the map or the red AI:
     before: attack-move every 40 ticks to idle units + mirrored blue
             production (cheapest-first, queue cap 3, per-type cap 3)
             — the ai-match.js stand-in, NO salvage, NO hero.
     competent: before + player-style blue salvage every 20 ticks
             (red-AI idle rule + a capped 2-unit detachment to the
             highest-value wreck) + combat-only attack-move
             (weaponless units are never attack-moved).
     reserve: competent attack/production/salvage but the hero left
             in reserve the whole match (9v10 field, never dropped)
             — the cost of never pressing Drop Back In.
     hero: competent + the hero as an RTS field unit from match start
             (hero-match.js approximation: applyRoster + spawn at the
             core; the sim has no Drop Back In / redeploy, and the
             browser hero is reserve + twin-stick driven, so this is
             an upper-bound proxy for hero presence, NOT the browser
             hero — stated in the wave-3 report, never hidden).
   Maps: first / second / third. Difficulties: easy / normal / hard
   via Sim.DIFFICULTY_PARAMS (red AI behaviour only).
   Usage: node scripts/beta-wave3-balance.js
   Output: one JSON row per (style, map, difficulty). */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Hero = require('../game/hero.js');

const MAX_TICKS = 15000;
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };
const MAPS = {
  first: [Maps.createFirstMap, Maps.spawnFirstMapScenario],
  second: [Maps.createSecondMap, Maps.spawnSecondMapScenario],
  third: [Maps.createThirdMap, Maps.spawnThirdMapScenario],
};

function blueEconomy(s) {
  const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core' && st.alive);
  if (!core) return;
  if (Sim.productionQueue(s, 'iron_eden').items.length >= 3) return;
  const prod = Sim.producibleUnits(s, 'iron_eden').slice().sort((a, b) => a.cost.scrap - b.cost.scrap);
  for (const def of prod) {
    const count = s.units.filter((u) => u.faction === 'iron_eden' && u.typeId === def.id).length
      + Sim.productionQueue(s, 'iron_eden').items.filter((it) => it.typeId === def.id).length;
    if (count >= 3) continue;
    if (Sim.scrapOf(s, 'iron_eden') < def.cost.scrap) continue;
    if (Sim.queueProduction(s, 'iron_eden', core.id, def.id).ok) break;
  }
}

function blueSalvage(s, stats) {
  // Player-style salvage, in two parts (v2: the v1 idle-only pass never
  // fired — an attacking army has no hold units near the front, so it
  // collapsed to the before style exactly; see the wave-3 report):
  // (i) the red-AI rule verbatim: idle (hold, empty queue) units take
  //     the nearest unclaimed wreck within 15 tiles. This fires for
  //     weaponless units the attack pass leaves alone (below).
  // (ii) a player detachment: while fewer than 2 blue units are
  //     salvaging, the nearest non-salvaging blue unit within 25
  //     tiles of the highest-value unclaimed wreck is sent to it —
  //     this is what a player tapping a wreck with nearby units does,
  //     and it is what the idle-only rule cannot express.
  const targeted = {};
  let salvaging = 0;
  for (const u of s.units) {
    if (u.faction !== 'iron_eden' || !u.alive) continue;
    if (u.order && u.order.kind === 'salvage' && u.order.wreckId) { targeted[u.order.wreckId] = true; salvaging++; }
  }
  for (const u of s.units) {
    if (u.faction !== 'iron_eden' || !u.alive) continue;
    if (u.order.kind !== 'hold' || (u.orderQueue && u.orderQueue.length)) continue;
    let best = null, bestD = 15;
    for (const wk of s.wrecks) {
      if (targeted[wk.id] || wk.value <= 0) continue;
      const d = Math.hypot(wk.x - u.x, wk.y - u.y);
      if (d < bestD) { best = wk; bestD = d; }
    }
    if (best) { Sim.issueOrder(s, [u.id], { kind: 'salvage', wreckId: best.id }); targeted[best.id] = true; salvaging++; stats.issued++; }
  }
  if (salvaging < 2) {
    let wkBest = null;
    for (const wk of s.wrecks) {
      if (targeted[wk.id] || wk.value <= 0) continue;
      if (!wkBest || wk.value > wkBest.value) wkBest = wk;
    }
    if (wkBest) {
      let uBest = null, uBestD = 25;
      for (const u of s.units) {
        if (u.faction !== 'iron_eden' || !u.alive) continue;
        if (u.order && u.order.kind === 'salvage') continue;
        const d = Math.hypot(wkBest.x - u.x, wkBest.y - u.y);
        if (d < uBestD) { uBest = u; uBestD = d; }
      }
      if (uBest) { Sim.issueOrder(s, [uBest.id], { kind: 'salvage', wreckId: wkBest.id }); stats.issued++; stats.detached++; }
    }
  }
}

function blueTarget(s) {
  const redCore = s.structures.find((st) => st.faction === 'xandria' && st.typeId === 'command_core' && st.alive);
  if (redCore) return { x: redCore.x, y: redCore.y };
  const reds = s.units.filter((u) => u.faction === 'xandria' && u.alive);
  if (!reds.length) return { x: 73, y: 25 };
  return { x: reds.reduce((a, u) => a + u.x, 0) / reds.length, y: reds.reduce((a, u) => a + u.y, 0) / reds.length };
}

function runMatch(style, mapName, diff) {
  const [mk, spawn] = MAPS[mapName];
  const map = mk();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  spawn(Sim, s);
  s.aiCombatParams = Sim.DIFFICULTY_PARAMS[diff];
  if (style === 'hero') {
    Hero.applyRoster(s);
    const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
    const pos = Sim.spawnPosition(s, core, 'ground');
    const st = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE);
    Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
      x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
      vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
      isHero: true, costScrap: 380 });
  }
  let maxBlue = 0, maxRed = 0;
  const stats = { issued: 0, detached: 0 };
  if (style === 'reserve') Hero.applyRoster(s);
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (s.tick % 20 === 0) {
      blueEconomy(s);
      if (style === 'competent' || style === 'reserve' || style === 'hero') blueSalvage(s, stats);
    }
    if (s.tick % 40 === 0) {
      const tgt = blueTarget(s);
      // Competent attack: COMBAT units only. The v1 stand-in also
      // attack-moved weaponless sensor drones to the enemy core,
      // which no player does and which strips the salvage pool.
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold'
        && (style === 'before' || (u.weapons && u.weapons.length))).map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: tgt.x, y: tgt.y });
    }
    const nb = s.units.filter((u) => u.faction === 'iron_eden').length;
    const nr = s.units.filter((u) => u.faction === 'xandria').length;
    if (nb > maxBlue) maxBlue = nb;
    if (nr > maxRed) maxRed = nr;
  }
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st) => st.faction === 'iron_eden').length;
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st) => st.faction === 'xandria').length;
  return { style, map: mapName, difficulty: diff, winner: s.winner || 'STALLED',
    ticks: s.tick, blueLeft, redLeft, maxBlue, maxRed,
    blueScrap: Sim.scrapOf(s, 'iron_eden'), redScrap: Sim.scrapOf(s, 'xandria'),
    wrecksCreated: s.wrecksCreated, wrecksRemaining: s.wrecks.length,
    salvageIssued: stats.issued, salvageDetached: stats.detached };
}

for (const style of ['before', 'competent', 'reserve', 'hero']) {
  for (const mapName of ['first', 'second', 'third']) {
    for (const diff of ['easy', 'normal', 'hard']) {
      console.log(JSON.stringify(runMatch(style, mapName, diff)));
    }
  }
}
