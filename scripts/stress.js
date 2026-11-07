#!/usr/bin/env node
// Headless sim stress test. Sandbox results only — NOT a phone FPS claim.
// Spawns N units (half per faction) in two blobs, attack-moves them at each
// other, and reports simulation tick time honestly.
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');

function run(count, ticks) {
  const width = 64, height = 40;
  const terrain = new Uint8Array(width * height); // all grass
  const s = Sim.createGame({ catalog, width, height, terrain, seed: 99 });
  const perSide = Math.floor(count / 2);
  const idsA = [], idsB = [];
  for (let i = 0; i < perSide; i++) {
    const x = 8 + (i % 20) * 1.0, y = 5 + Math.floor(i / 20) * 1.0;
    idsA.push(Sim.addUnit(s, 'medium_tank', 'iron_eden', x, y).id);
    const x2 = 55 - (i % 20) * 1.0, y2 = 5 + Math.floor(i / 20) * 1.0;
    idsB.push(Sim.addUnit(s, 'medium_tank', 'xandria', x2, y2).id);
  }
  Sim.issueOrder(s, idsA, { kind: 'attackMove', x: 55, y: 20 });
  Sim.issueOrder(s, idsB, { kind: 'attackMove', x: 8, y: 20 });
  const times = [];
  for (let t = 0; t < ticks; t++) {
    const start = process.hrtime.bigint();
    Sim.step(s);
    times.push(Number(process.hrtime.bigint() - start) / 1e6);
    if (s.winner) break;
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    requested: count, spawned: perSide * 2, ticksRun: times.length,
    avgMsPerTick: +avg.toFixed(3), p95MsPerTick: +times[Math.floor(times.length * 0.95)].toFixed(3),
    maxMsPerTick: +times[times.length - 1].toFixed(3),
    aliveAtEnd: s.units.length, projectilesActive: s.projectileActive, winner: s.winner,
  };
}

const results = [100, 300, 500].map((n) => run(n, 300));
for (const r of results) {
  console.log(`units=${r.requested} spawned=${r.spawned} ticks=${r.ticksRun} avg=${r.avgMsPerTick}ms/tick p95=${r.p95MsPerTick}ms max=${r.maxMsPerTick}ms alive=${r.aliveAtEnd} projectiles=${r.projectilesActive} winner=${r.winner}`);
}
console.log(JSON.stringify(results, null, 2));
