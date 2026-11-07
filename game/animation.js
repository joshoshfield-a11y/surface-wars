/* Surface Wars — render-layer animation logic (no sim rules here).
   Pure functions over EXISTING sim state only: unit state is derived
   from position/order/movementClass/hp/cooldowns, never invented. All
   timing is driven by state.time (sim seconds), so animation freezes
   exactly when the game is paused — the render loop only advances
   state.time while stepping. No per-unit multi-frame walk cycles exist:
   unit animation is transform (bob/recoil) + FX sprites on top of the
   single still sprite, except wrecks / FX / canopy which are new art.
   In Node this module exports only pure logic; no DOM access. */
(function (global) {
  'use strict';

  // ---- Projectile sprite mapping ----
  // Mapped from the weapon FAMILY first (the visible delivery system),
  // falling back to damage type. Instant weapons (projectileSpeed 0:
  // Laser, Melee, EW, Bomb) have no travelling projectile in the sim,
  // so they map to null and show a muzzle flash only.
  var PROJECTILE_BY_FAMILY = {
    'Missile Launcher': 'missile',
    'Rocket Artillery': 'missile',
    'Mortar': 'kinetic_tracer', // lobbed shell: tracer, no fins at this scale
    'Autocannon': 'kinetic_tracer',
    'Heavy Cannon': 'kinetic_tracer',
    'Anti-air Cannon': 'kinetic_tracer',
    'Siege Cannon': 'kinetic_tracer',
    'Railgun': 'energy_bolt',
    'Laser': 'energy_bolt',
    'Flamethrower': 'flame'
  };
  var PROJECTILE_BY_DAMAGE = {
    'Energy': 'energy_bolt',
    'Thermal': 'flame',
    'Explosive': 'missile',
    'Kinetic': 'kinetic_tracer',
    'Siege': 'kinetic_tracer',
    'Disruption': 'kinetic_tracer'
  };
  function projectileForWeapon(weapon) {
    if (!weapon || !weapon.projectileSpeed) return null;
    if (PROJECTILE_BY_FAMILY[weapon.family]) return PROJECTILE_BY_FAMILY[weapon.family];
    return PROJECTILE_BY_DAMAGE[weapon.damageType] || 'kinetic_tracer';
  }

  // ---- Rotor blur (code-drawn disc, no new sprite file) ----
  // Gunship + drone units only: any unit whose id is 'gunship' or ends
  // in '_drone', plus the drone_swarm. Fixed-wing aircraft (strike
  // bomber, transport, recon, drone carrier) get hover-bob but no rotor.
  var ROTOR_UNIT_IDS = ['gunship', 'combat_drone', 'sensor_drone',
    'interceptor_drone', 'decoy_drone', 'drone_swarm'];
  function hasRotor(unit) {
    if (!unit) return false;
    return ROTOR_UNIT_IDS.indexOf(unit.typeId) !== -1;
  }

  // ---- Bob ----
  // Mech chassis step (alternating, square-ish): Bulwark, Lancer,
  // Longshot, Rampart, Vespid, Warden. Wheeled/vehicle chassis (Scout,
  // Scrapjack) bob smoothly. Air units hover-bob whether moving or not.
  // Returns a vertical offset in TILES (render multiplies by TILE*zoom).
  var MECH_CHASSIS = ['Bulwark', 'Lancer', 'Longshot', 'Rampart', 'Vespid', 'Warden'];
  function isMechChassis(chassis) { return MECH_CHASSIS.indexOf(chassis) !== -1; }
  function bobPhase(unit) { return ((unit.id * 1.7) % (Math.PI * 2)); }
  function bobFor(unit, def, time, isMoving) {
    if (!unit) return 0;
    if (unit.movementClass === 'air') {
      return Math.sin(time * 3 + bobPhase(unit)) * 0.05;
    }
    if (!isMoving) return 0;
    if (def && isMechChassis(def.chassis)) {
      // Step-bob: alternating up/down plateaus, not a smooth sine.
      return (Math.sin(time * 6 + bobPhase(unit)) >= 0 ? 1 : -1) * 0.04;
    }
    return Math.sin(time * 10 + bobPhase(unit)) * 0.03;
  }

  // ---- Damage smoke ----
  // HP >= 50%: none. 25-50%: light smoke (smoke_1, cycling to smoke_2).
  // Below 25%: heavy smoke (smoke_3, cycling from smoke_2). The cycle
  // is slow (1 frame per second of sim time) so it reads as drifting.
  function damageSmoke(unit, time) {
    if (!unit || !unit.maxHp) return null;
    var frac = unit.hp / unit.maxHp;
    if (frac >= 0.5) return null;
    var slow = Math.floor(time) % 2 === 0;
    if (frac < 0.25) return slow ? 'smoke_3' : 'smoke_2';
    return slow ? 'smoke_1' : 'smoke_2';
  }

  // ---- Transient FX ----
  // kind: 'explosion' (4 frames, 0.6s), 'muzzle' (3 frames, 0.18s),
  // 'dust' (2 frames, 0.5s), 'fire' (3 frames looping, 1.2s: the brief
  // burn on a fresh wreck). effectFrame returns { frame, done }.
  var EFFECT_DURATIONS = { explosion: 0.6, muzzle: 0.18, dust: 0.5, fire: 1.2 };
  var EFFECT_FRAMES = {
    explosion: ['explosion_1', 'explosion_2', 'explosion_3', 'explosion_4'],
    muzzle: ['muzzle_1', 'muzzle_2', 'muzzle_3'],
    dust: ['dust_1', 'dust_2'],
    fire: ['fire_1', 'fire_2', 'fire_3']
  };
  function effectFrame(kind, elapsed) {
    var frames = EFFECT_FRAMES[kind];
    var dur = EFFECT_DURATIONS[kind];
    if (!frames || dur === undefined) return { frame: null, done: true };
    if (elapsed >= dur) return { frame: frames[frames.length - 1], done: true };
    var idx = Math.min(frames.length - 1, Math.floor(elapsed / dur * frames.length));
    return { frame: frames[idx], done: false };
  }

  // ---- Water shimmer ----
  // Phase advances once per 1.5 sim seconds; water tiles cycle their
  // base variant (v1->v2->v3) with that phase. Cost: zero extra draw
  // calls — the same drawImage per visible water tile, just a different
  // cached variant. No full-terrain redraw beyond what render already
  // does per frame for the visible window.
  function waterVariant(tx, ty, time) {
    var phase = Math.floor(time / 1.5) % 3;
    return ((tx * 7 + ty * 13 + phase) % 3) + 1;
  }

  // ---- Damage tiers + decals (Wave-2 graphics) ----
  // Same boundaries as damageSmoke (the smoke tiers are unchanged):
  // HP >= 50%: none. 25-50%: light. Below 25%: heavy. Boundaries are
  // exact: 50% reads undamaged, 25% reads light, not heavy.
  // Decals are GENERATED art (assets/animation/fx/damage_light.png,
  // damage_heavy.png), drawn over the unit sprite in render.js —
  // never coded shapes shipped as damage art. The smoke tiers stay
  // as the second, animated damage read.
  function damageTier(unit) {
    if (!unit || !unit.maxHp) return 'none';
    var frac = unit.hp / unit.maxHp;
    if (frac >= 0.5) return 'none';
    if (frac >= 0.25) return 'light';
    return 'heavy';
  }
  function damageDecal(unit) {
    var t = damageTier(unit);
    if (t === 'light') return 'damage_light';
    if (t === 'heavy') return 'damage_heavy';
    return null;
  }

  // ---- Thin-chassis render treatment (Wave-2 graphics) ----
  // Lancer / Longshot are the thin chassis (the hero's base chassis
  // is lancer_mech). The treatment itself lives in render.js and is a
  // RENDERING aid (team-tinted underlay disc + darker outline ring
  // beneath the sprite, draw size unchanged, sim scale untouched) —
  // NOT sprite art. It is active only at zoom <= 1, where the chassis
  // reads faint; at zoom > 1 the sprite alone carries it.
  var THIN_CHASSIS_TYPES = ['lancer_mech', 'longshot_mech'];
  function thinChassisTreatment(typeId, zoom) {
    return THIN_CHASSIS_TYPES.indexOf(typeId) !== -1 && zoom <= 1;
  }

  var api = {
    PROJECTILE_BY_FAMILY: PROJECTILE_BY_FAMILY,
    projectileForWeapon: projectileForWeapon,
    ROTOR_UNIT_IDS: ROTOR_UNIT_IDS, hasRotor: hasRotor,
    MECH_CHASSIS: MECH_CHASSIS, isMechChassis: isMechChassis,
    bobFor: bobFor, damageSmoke: damageSmoke,
    EFFECT_DURATIONS: EFFECT_DURATIONS, EFFECT_FRAMES: EFFECT_FRAMES,
    effectFrame: effectFrame, waterVariant: waterVariant,
    damageTier: damageTier, damageDecal: damageDecal,
    THIN_CHASSIS_TYPES: THIN_CHASSIS_TYPES,
    thinChassisTreatment: thinChassisTreatment
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWAnim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
