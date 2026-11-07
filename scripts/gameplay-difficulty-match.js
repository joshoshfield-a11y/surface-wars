/* Headless match per difficulty (Gameplay Completion verification).
   Runs the First Map scenario under Easy / Normal / Hard and
   reports the first tick the red AI enters attack mode, plus
   no-cheat indicators: starting scrap, catalog stats intact, and
   blue scrap/army untouched by the red AI.
   Usage: node scripts/gameplay-difficulty-match.js
   Observed shape in the reference run (production is sequential
   and mode changes wait out the hysteresis window, so the Easy
   number is later than a naive build-time sum):
   Hard and Normal attack at the first AI think (tick 20) because
   10 starting combat units already clear their gather thresholds
   (5 and 8); Easy gathers until its 12th combat unit is fielded
   and the mode-change wait expires (tick 820 in the reference
   run). The script asserts only that Easy differs from the
   others, not the exact tick, so production-timing drift cannot
   false-fail it. */
'use strict';
const Maps = require('../game/maps.js');
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

function run(level) {
  const map = Maps.createFirstMap();
  const state = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: 20261030 });
  state.aiCombatParams = Sim.DIFFICULTY_PARAMS[level];
  Maps.spawnFirstMapScenario(Sim, state);
  const startScrap = { blue: Sim.scrapOf(state, 'iron_eden'), red: Sim.scrapOf(state, 'xandria') };
  let firstAttackTick = null;
  for (let t = 0; t < 1200; t++) {
    Sim.step(state);
    if (state.aiCombat && state.aiCombat.mode === 'attack' && firstAttackTick === null) firstAttackTick = state.tick;
    if (firstAttackTick !== null) break;
  }
  const redCombat = state.units.filter((u) => u.faction === 'xandria' && u.weapons && u.weapons.length).length;
  let statsOk = true;
  for (const u of state.units) {
    const def = catalog.units.find((d) => d.id === u.typeId);
    if (!def || u.maxHp !== def.hp || u.speed !== def.speed) statsOk = false;
  }
  return {
    level,
    firstAttackTick,
    redCombatUnitsAtAttack: redCombat,
    startScrap,
    blueScrapAtAttack: Sim.scrapOf(state, 'iron_eden'),
    blueUnitsAtAttack: state.units.filter((u) => u.faction === 'iron_eden').length,
    catalogStatsIntact: statsOk,
  };
}

const results = ['easy', 'normal', 'hard'].map(run);
for (const r of results) console.log(JSON.stringify(r));
const byLevel = Object.fromEntries(results.map((r) => [r.level, r]));
const behaviourDiffers = byLevel.easy.firstAttackTick !== byLevel.normal.firstAttackTick ||
  byLevel.easy.firstAttackTick !== byLevel.hard.firstAttackTick;
const noCheat = results.every((r) => r.startScrap.blue === 500 && r.startScrap.red === 500 &&
  r.blueScrapAtAttack === 500 && r.blueUnitsAtAttack >= 10 && r.catalogStatsIntact);
console.log(JSON.stringify({ behaviourDiffers, noCheat }));
if (!behaviourDiffers || !noCheat) process.exit(1);
