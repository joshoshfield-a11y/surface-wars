/* UPGRADES-12H Wave 3: hero-upgrade match harness.
   Same stand-in as scripts/weapons12h-match.js and
   scripts/hero-match.js (scripted blue attack-move + mirrored blue
   economy, no blue salvage; the hero fights under RTS orders like
   every other blue unit) so results differ ONLY by the hero's
   level/skills/gear. The harness cannot twin-stick, and the hero
   does NOT redeploy on death here (Drop Back In is a shell button;
   the sim has no redeploy). So this measures the loadout/skill
   swing, NOT twin-stick skill and NOT reserve play.
   Each entry runs on First Map and Twin Bridges (second map) at
   the fixed seed 20261030, the same seed the Wave 1 harness uses.
   Concussive Pulse is script-activated after each step whenever
   an enemy is within 3 tiles and the cooldown is ready — the
   closest the harness can come to a player pressing the ability.
   A SWEEP is a new entry winning every map the default loadout
   loses; per the freeze rule a sweep means the new entry must be
   retuned DOWN, never the opponent buffed. Exit code 1 on sweep,
   or if the L10-mastery row diverges from the L10 row (mastery
   has no sim input, so any divergence would mean mastery leaked
   into stats — a bug, not a balance question).
   Usage: node scripts/upgrades12h-match.js
   Output: one JSON row per match, then a JSON summary line. */
const catalog = require('../game/catalog.js');
const Sim = require('../game/sim.js');
const Maps = require('../game/maps.js');
const Weapons = require('../game/weapons.js');
const Prog = require('../game/progression.js');
const Hero = require('../game/hero.js');

const MAX_TICKS = 15000; // 750 sim seconds, same cap as hero-match.js
const SEED = 20261030;
const HERO_BASE = { hp: 200, armor: 'Medium', speed: 6.0, vision: 8, radius: 0.55, movementClass: 'ground' };

function baseLoadout() {
  return { primary: null, secondary: null, armor: null, mobility: null,
    reactor: null, sensor: null, ability: null };
}
function lo(over) {
  const l = Object.assign(baseLoadout(), Weapons.cloneLoadout(Weapons.DEFAULT_LOADOUT));
  return Object.assign(l, over || {});
}
// Level-appropriate entries. Skill sets are point-legal at their
// level (points = level - 1, mastery 0 unless noted); the on/off
// pairs differ by exactly one item so the comparison isolates it.
const ENTRIES = [
  { name: 'default-L1', level: 1, skills: [], loadout: Weapons.DEFAULT_LOADOUT },
  { name: 'no-hero', level: 1, skills: [], loadout: null }, // hero-off: roster lancer stays
  { name: 'weave-L1', level: 1, skills: [], loadout: lo({ armor: 'gear_armor_1b' }) },
  { name: 'rapid-on-L3', level: 3, skills: ['dash', 'rapid_servos'], loadout: Weapons.DEFAULT_LOADOUT },
  { name: 'rapid-off-L3', level: 3, skills: ['dash'], loadout: Weapons.DEFAULT_LOADOUT },
  { name: 'ablative-L4', level: 4, skills: [], loadout: lo({ armor: 'gear_armor_2b' }) },
  { name: 'plated-L4', level: 4, skills: [], loadout: lo({ armor: 'gear_armor_2' }) },
  { name: 'servos-L4', level: 4, skills: [], loadout: lo({ mobility: 'gear_mobility_2b' }) },
  { name: 'longeye-L4', level: 4, skills: [], loadout: lo({ sensor: 'gear_sensor_2b' }) },
  { name: 'concussive-on-L9', level: 9,
    skills: ['dash', 'overdrive', 'field_repair', 'shockwave_slam', 'concussive_pulse'],
    loadout: lo({ ability: 'concussive_pulse' }), scriptSkill: 'concussive_pulse' },
  { name: 'concussive-off-L9', level: 9,
    skills: ['dash', 'overdrive', 'field_repair', 'shockwave_slam'],
    loadout: Weapons.DEFAULT_LOADOUT },
  { name: 'L10-norapid', level: 10,
    skills: ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer',
      'shockwave_slam', 'reinforced_frame', 'rally_signal'],
    loadout: lo({ armor: 'gear_armor_3', mobility: 'gear_mobility_3', sensor: 'gear_sensor_3' }) },
  { name: 'L10', level: 10,
    skills: ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer',
      'shockwave_slam', 'reinforced_frame', 'rally_signal', 'rapid_servos'],
    loadout: lo({ armor: 'gear_armor_3', mobility: 'gear_mobility_3', sensor: 'gear_sensor_3' }) },
  { name: 'L10-mastery5', level: 10, masteryClaimed: 5,
    skills: ['dash', 'salvage_sense', 'overdrive', 'field_repair', 'targeting_computer',
      'shockwave_slam', 'reinforced_frame', 'rally_signal', 'rapid_servos'],
    loadout: lo({ armor: 'gear_armor_3', mobility: 'gear_mobility_3', sensor: 'gear_sensor_3' }) },
];

function blueEconomy(s) {
  const faction = 'iron_eden';
  const core = s.structures.find((st) => st.faction === faction && st.typeId === 'command_core' && st.alive);
  if (!core) return;
  const q = Sim.productionQueue(s, faction);
  if (q.items.length >= 3) return;
  const prod = Sim.producibleUnits(s, faction).slice().sort((a, b) => a.cost.scrap - b.cost.scrap);
  for (const def of prod) {
    const count = s.units.filter((u) => u.faction === faction && u.typeId === def.id).length
      + q.items.filter((it) => it.typeId === def.id).length;
    if (count >= 3) continue;
    if (Sim.scrapOf(s, faction) < def.cost.scrap) continue;
    if (Sim.queueProduction(s, faction, core.id, def.id).ok) break;
  }
}

function runMatch(mapName, entry) {
  const map = mapName === 'second' ? Maps.createSecondMap() : Maps.createFirstMap();
  const s = Sim.createGame({ catalog, width: map.width, height: map.height, terrain: map.terrain, seed: SEED });
  if (mapName === 'second') Maps.spawnSecondMapScenario(Sim, s);
  else Maps.spawnFirstMapScenario(Sim, s);
  let heroId = 0, heroAlive = true, heroDeaths = 0, pulses = 0;
  if (entry.loadout) {
    const owned = entry.skills.filter((id) => { const sk = Prog.skillById(id); return sk && sk.type === 'active'; });
    const v = Weapons.validateLoadout(entry.loadout,
      { chassis: 'Lancer', movementClass: 'ground', phaseTierCap: Prog.tierBand(entry.level),
        levelBand: true, allowAbility: true, ownedAbilityIds: owned });
    if (!v.ok) throw new Error('invalid 12h loadout ' + entry.name + ': ' + v.reasons.join(' '));
    Hero.applyRoster(s);
    const core = s.structures.find((st) => st.faction === 'iron_eden' && st.typeId === 'command_core');
    const pos = Sim.spawnPosition(s, core, 'ground');
    const st = Weapons.heroStats(entry.loadout, HERO_BASE, { level: entry.level, skills: entry.skills });
    const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
      x: pos.x, y: pos.y, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
      vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
      isHero: true, costScrap: 380 });
    heroId = hu.id;
    s.heroSkills = entry.skills.slice();
  }
  const redCore = s.structures.find((st2) => st2.faction === 'xandria');
  for (let t = 0; t < MAX_TICKS && !s.winner; t++) {
    Sim.step(s);
    if (heroId) {
      if (heroAlive && !s.units.some((u) => u.id === heroId)) { heroAlive = false; heroDeaths++; }
      // Scripted Concussive Pulse: fire when an enemy is in range.
      if (entry.scriptSkill && heroAlive) {
        const hu = s.units.find((u) => u.id === heroId);
        if (hu) {
          const near = s.units.some((u) => u.faction === 'xandria' && u.alive &&
            (u.x - hu.x) * (u.x - hu.x) + (u.y - hu.y) * (u.y - hu.y) <= 9);
          if (near && Sim.activateSkill(s, heroId, entry.scriptSkill).ok) pulses++;
        }
      }
    }
    if (s.tick % 20 === 0) blueEconomy(s);
    if (s.tick % 40 === 0) {
      const idle = s.units.filter((u) => u.faction === 'iron_eden' && u.order.kind === 'hold').map((u) => u.id);
      if (idle.length) Sim.issueOrder(s, idle, { kind: 'attackMove', x: redCore.x, y: redCore.y });
    }
  }
  const redLeft = s.units.filter((u) => u.faction === 'xandria').length
    + s.structures.filter((st2) => st2.faction === 'xandria').length;
  const blueLeft = s.units.filter((u) => u.faction === 'iron_eden').length
    + s.structures.filter((st2) => st2.faction === 'iron_eden').length;
  return { entry: entry.name, map: mapName, winner: s.winner || 'STALLED',
    ticks: s.tick, redLeft, blueLeft, heroSurvived: entry.loadout ? heroAlive : null,
    heroDeaths, pulses, wrecksCreated: s.wrecksCreated };
}

const rows = [];
for (const entry of ENTRIES) {
  rows.push(runMatch('first', entry));
  rows.push(runMatch('second', entry));
}
for (const r of rows) console.log(JSON.stringify(r));
// Sweep analysis: a NEW skill/gear combination sweeps if it wins
// every map the default loadout loses (draws and stalls count as
// not-wins). The L10 rows are NOT sweep candidates: level 10 is
// pre-existing Phase C progression (level growth + T3 gear + old
// skills), and the L10-norapid control exists precisely to show
// whether a sweep there is a level effect rather than a new-item
// effect — retuning L10 down would violate the frozen ceilings.
const NEW_NAMES = ['weave-L1', 'rapid-on-L3', 'ablative-L4', 'servos-L4', 'longeye-L4', 'concussive-on-L9'];
const byEntry = {};
for (const r of rows) { (byEntry[r.entry] = byEntry[r.entry] || {})[r.map] = r.winner; }
const defLossMaps = ['first', 'second'].filter((m) => byEntry['default-L1'][m] !== 'iron_eden');
const sweeps = ENTRIES.filter((e) => NEW_NAMES.indexOf(e.name) !== -1 &&
  defLossMaps.length > 0 && defLossMaps.every((m) => byEntry[e.name][m] === 'iron_eden')).map((e) => e.name);
// Mastery determinism: identical sim inputs must give identical
// full rows (winner, ticks, survivors, deaths, pulses, wrecks).
const strip = (r) => { const c = Object.assign({}, r); delete c.entry; return JSON.stringify(c); };
const masteryDiverges = ['first', 'second'].some((m) =>
  strip(rows.find((r) => r.entry === 'L10' && r.map === m)) !==
  strip(rows.find((r) => r.entry === 'L10-mastery5' && r.map === m)));
console.log(JSON.stringify({ summary: true, defaultLossMaps: defLossMaps, sweeps: sweeps,
  masteryDiverges: masteryDiverges }));
if (sweeps.length > 0 || masteryDiverges) process.exit(1);

// ---- Close-contact arena: the full-match harness cannot prove
// Concussive Pulse, because RTS-order heroes hold firing range and
// die at range before any enemy closes inside 3 tiles (measured:
// min enemy distance 3.14, hero dead at tick 255 on First Map).
// The arena forces the contact the skill is designed for: three
// weaponless red scouts march onto the hero's tile from 10 tiles
// out while the hero holds and fires. Pulse-on fires the skill
// whenever an enemy is within 3 tiles; pulse-off is the identical
// build without the skill. Metrics: first-contact tick (any red
// within 1.5 tiles), red HP remaining at tick 300, reds killed.
// A working pulse delays contact and leaves reds weaker.
function runArena(withPulse) {
  const tmap = Sim.createTestMap();
  const s = Sim.createGame({ catalog, width: tmap.width, height: tmap.height, terrain: tmap.terrain, seed: SEED });
  const skills = withPulse
    ? ['dash', 'overdrive', 'field_repair', 'shockwave_slam', 'concussive_pulse']
    : ['dash', 'overdrive', 'field_repair', 'shockwave_slam'];
  const st = Weapons.heroStats(Weapons.DEFAULT_LOADOUT, HERO_BASE, { level: 9, skills: skills });
  const hu = Sim.addCustomUnit(s, { typeId: 'lancer_mech', faction: 'iron_eden',
    x: 20, y: 20, hp: st.maxHp, maxHp: st.maxHp, armor: st.armor, speed: st.speed,
    vision: st.vision, radius: st.radius, movementClass: 'ground', weapons: st.weapons,
    isHero: true, costScrap: 380 });
  const reds = [[20, 30], [22, 30], [18, 30]].map(([x, y]) => {
    const u = Sim.addUnit(s, 'scout_buggy', 'xandria', x, y);
    u.weapons = []; // march only: isolates movement from return fire
    return u;
  });
  Sim.issueOrder(s, reds.map((u) => u.id), { kind: 'move', x: 20, y: 20 });
  let contactTick = -1, pulses = 0;
  for (let t = 0; t < 300; t++) {
    Sim.step(s);
    const h = s.units.find((u) => u.id === hu.id);
    if (!h) break;
    if (contactTick < 0 && reds.some((u) => u.alive &&
      (u.x - h.x) * (u.x - h.x) + (u.y - h.y) * (u.y - h.y) <= 2.25)) contactTick = s.tick;
    if (withPulse) {
      const near = reds.some((u) => u.alive &&
        (u.x - h.x) * (u.x - h.x) + (u.y - h.y) * (u.y - h.y) <= 9);
      if (near && Sim.activateSkill(s, hu.id, 'concussive_pulse').ok) pulses++;
    }
  }
  const hero = s.units.find((u) => u.id === hu.id);
  return { arena: withPulse ? 'concussive-on' : 'concussive-off', contactTick: contactTick,
    pulses: pulses, heroHp: hero ? hero.hp : 0,
    redHpLeft: reds.reduce((a, u) => a + (u.alive ? u.hp : 0), 0),
    redKilled: reds.filter((u) => !u.alive).length };
}
const arenaOn = runArena(true), arenaOff = runArena(false);
console.log(JSON.stringify(arenaOn));
console.log(JSON.stringify(arenaOff));
