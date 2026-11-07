/* Surface Wars — Twin-Stick Phase C: hero progression (persistence,
   XP, levels, skills, gear tiers). DOM-free: the browser shell
   (game.js) and node tests share this file. The record itself lives
   in the shell (localStorage on web, DOM storage in the APK WebView);
   this module only defines its shape, validation, and the pure
   transitions — it never touches storage, the sim, or the DOM.

   Record key (PROPOSED in the spec): 'surfacewars.hero.v1'. The v1
   is the schema version: a later shape ships as v2 with a migration
   that reads v1 and writes v2, never by silently reinterpreting old
   fields. There is no migration in Phase C because no record existed
   before it (Phase B loadouts lived in session memory only).

   XP sources (all PROPOSED numbers from the spec, implemented
   exactly): hero killing blow floor(0.10 x victim catalog scrap
   cost), minimum 10, and only when the victim cost is above 0 (a
   0-cost structure grants 0, never the minimum — the minimum is a
   floor on a real cost, not a reward for killing free things);
   hero salvage 10 XP per wreck; match win +100; match draw +0 bonus
   (kill/salvage XP still count); match loss +25; hero death 0 XP
   lost (never de-levels). Army kills feed 0 hero XP — the sim
   attributes a killing blow to the hero unit specifically (see
   sim.js applyDamage), and this module never sees army kills.

   XP curve (PROPOSED, cumulative): L1 0, L2 100, L3 300, L4 600,
   L5 1000, L6 1500, L7 2100, L8 2800, L9 3600, L10 4500. Level-up
   happens at MATCH END only, when cumulative XP crosses a
   threshold — a hero never levels up mid-battle. One skill point
   per level gained from level 2, so 9 points by level 10.

   WAVE 3 (UPGRADES-12H): the skill set grows from 8 to 10, so the
   old 1 spare point becomes a real choice — at level 10 the player
   holds 9 points for 10 skills and must leave one unpicked. The
   two new skills are Rapid Servos (passive, gate 3: +0.5 hero
   speed, resolved in weapons.js heroStats) and Concussive Pulse
   (active, gate 9: enemies within 3 tiles slowed for 5s, no
   damage, implemented in sim.js activateSkill). Gate 9 also gives
   level 9 its first new unlock (previously a level-9 point had
   nothing new to buy) and gate 3 makes the early game a real
   3-skills-for-2-points choice (Dash, Salvage Sense, Rapid
   Servos).

   WAVE 3 MASTERY TRACK (post-level-10, points only, NO stat
   growth): level stays capped at 10 and masteryRankForXp never
   enters heroStats, so the level-10 ceilings (+45% HP / +18%
   damage effective) cannot move. Mastery ranks M1-M5 at cumulative
   XP 5500, 6800, 8300, 10000, 11900 (steps of 1000, 1300, 1500,
   1700, 1900 past 4500) each grant +1 skill point at match end.
   M1 supplies the 10th point that completes the 10-skill set;
   M2-M5 points bank for future skills and mark prestige — they
   grant no stats, no gear, and no second ability, by design.
   masteryClaimed counts ranks already paid out. Old records have
   no masteryClaimed field: validation treats a missing field as
   0 (the old balance rule), so they load intact, and the next
   match-end transition pays any earned ranks as catch-up — never
   a wipe, never a silent reinterpretation of level or XP.

   Stat caps — RESOLVED DISCREPANCY (see the Phase C report): the
   spec states +5% max HP and +2% damage per level, capped at +50%
   HP and +20% damage at level 10. (level-1) increments give +45%
   HP and +18% damage at level 10, which sit UNDER the stated caps.
   The level-1 anchor is not broken to make the caps bind, so the
   caps are non-binding ceilings and the effective level-10 values
   are +45% HP / +18% damage. Reinforced Frame's +15% max HP
   combines ADDITIVELY on base HP with the level bonus: effective
   HP multiplier = 1 + 0.05*(level-1) + 0.15 (if Reinforced Frame
   unlocked), before gear multipliers. The combination is applied
   in weapons.js heroStats, which takes {level, skills} options.

   Gear tier bands by hero level: tier 1 at levels 1-3, tier 2 at
   4-6, tier 3 at 7+. Phase B's tier-1-only lock is lifted by level
   here — the validator's phaseTierCap becomes tierBand(level).

   Corruption rule: a missing, unreadable, or failing-validation
   record resets to a level-1 hero with the starting loadout and a
   plain notice. Validation is strict on purpose: level must equal
   levelForXp(xp) (level is derived from cumulative XP at write
   time, never stored independently of it), skillPoints + unlocked
   skills must equal level-1 plus masteryClaimed (one point earned
   per level gained and per mastery rank claimed, one point spent
   per skill, respec returns all points), every
   skill id must be known and at or above its gate... precisely:
   every unlocked skill's gate must be <= level (a level-3 record
   cannot hold a gate-8 skill), the equipped ability (if any) must
   be an unlocked ACTIVE skill, and the loadout must validate
   under the level's tier band. A record failing any of these is
   reset, never silently kept half-valid. The shell shows the
   notice; this module only reports the failure. */
(function (global) {
  'use strict';
  var RECORD_KEY = 'surfacewars.hero.v1';
  var XP_CURVE = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  var MAX_LEVEL = 10;
  // Skill ids are stable strings; never renamed after Phase C ships,
  // or saved records would reference dead ids (which validation
  // treats as corruption and resets — the safe failure, not a crash).
  var SKILLS = [
    { id: 'dash', name: 'Dash', type: 'active', gate: 2,
      desc: 'Burst of speed: 2x speed for 0.4s, cooldown 8s. No invulnerability. (PROPOSED)' },
    { id: 'salvage_sense', name: 'Salvage Sense', type: 'passive', gate: 3,
      desc: "Wrecks the hero salvages are worth +25% scrap (hero's salvages only). (PROPOSED)" },
    { id: 'overdrive', name: 'Overdrive', type: 'active', gate: 4,
      desc: 'Fire rate +25% for 5s, cooldown 20s. (PROPOSED)' },
    { id: 'field_repair', name: 'Field Repair', type: 'active', gate: 5,
      desc: 'Restore 60 HP to the hero, cooldown 30s. Cannot exceed max HP. (PROPOSED)' },
    { id: 'targeting_computer', name: 'Targeting Computer', type: 'passive', gate: 5,
      desc: 'Primary weapon +10% accuracy and +1 range, primary only. (PROPOSED)' },
    { id: 'shockwave_slam', name: 'Shockwave Slam', type: 'active', gate: 6,
      desc: 'Damage in a 2-tile radius = primary damage x1.5, cooldown 25s. Cannot damage structures. (PROPOSED)' },
    { id: 'reinforced_frame', name: 'Reinforced Frame', type: 'passive', gate: 7,
      desc: 'Max HP +15% at match start (additive on base HP with the level bonus). (PROPOSED)' },
    { id: 'rally_signal', name: 'Rally Signal', type: 'active', gate: 8,
      desc: 'Allied units within 8 tiles gain +10% speed for 8s, cooldown 30s. Issues no orders. (PROPOSED)' },
    { id: 'rapid_servos', name: 'Rapid Servos', type: 'passive', gate: 3,
      desc: 'Hero speed +0.5 at match start (stacks with mobility gear). (WAVE 3)' },
    { id: 'concussive_pulse', name: 'Concussive Pulse', type: 'active', gate: 9,
      desc: 'Enemies within 3 tiles are slowed (half speed) for 5s, cooldown 25s. No damage, no effect on structures. (WAVE 3)' }
  ];
  // Mastery curve (WAVE 3): cumulative-XP thresholds past level 10.
  // Rank is derived from XP, never stored independently of it, the
  // same discipline as level (see validateRecord).
  var MASTERY_CURVE = [5500, 6800, 8300, 10000, 11900];
  var MAX_MASTERY = 5;
  var XP_WIN = 100, XP_DRAW = 0, XP_LOSS = 25, XP_SALVAGE = 10;

  function skillById(id) {
    for (var i = 0; i < SKILLS.length; i++) if (SKILLS[i].id === id) return SKILLS[i];
    return null;
  }
  function levelForXp(xp) {
    var level = 1;
    for (var i = 0; i < XP_CURVE.length; i++) if (xp >= XP_CURVE[i]) level = i + 1;
    return level;
  }
  function tierBand(level) {
    if (level >= 7) return 3;
    if (level >= 4) return 2;
    return 1;
  }
  function tierMinLevel(tier) {
    if (tier >= 3) return 7;
    if (tier === 2) return 4;
    return 1;
  }
  function masteryRankForXp(xp) {
    var rank = 0;
    for (var i = 0; i < MASTERY_CURVE.length; i++) if (xp >= MASTERY_CURVE[i]) rank = i + 1;
    return rank;
  }
  function defaultLoadout() {
    return { primary: 'nw_twin_bore_autogun', secondary: null,
      armor: null, mobility: null, reactor: null, sensor: null, ability: null };
  }
  function defaultRecord() {
    return { schema: 1, level: 1, xp: 0, skillPoints: 0, skills: [],
      loadout: defaultLoadout(), heroEnabled: true, matchesPlayed: 0, wins: 0, masteryClaimed: 0 };
  }
  function cloneRecord(r) {
    return { schema: r.schema, level: r.level, xp: r.xp, skillPoints: r.skillPoints,
      masteryClaimed: r.masteryClaimed || 0,
      skills: r.skills.slice(),
      loadout: { primary: r.loadout.primary, secondary: r.loadout.secondary,
        armor: r.loadout.armor, mobility: r.loadout.mobility,
        reactor: r.loadout.reactor, sensor: r.loadout.sensor, ability: r.loadout.ability },
      heroEnabled: r.heroEnabled, matchesPlayed: r.matchesPlayed, wins: r.wins };
  }
  // Validate a parsed record. Weapons is injected (SWWeapons) so
  // this module stays free of the weapon tables; without it, only
  // the structural checks run and the loadout check is skipped by
  // the caller passing null — the shell always passes Weapons.
  // Returns {ok, reasons}. Every failure carries a reason string.
  function validateRecord(r, Weapons) {
    var reasons = [];
    if (!r || typeof r !== 'object') return { ok: false, reasons: ['Record is not an object.'] };
    if (r.schema !== 1) reasons.push('Unknown schema version: ' + r.schema + '.');
    if (!Number.isInteger(r.level) || r.level < 1 || r.level > MAX_LEVEL) reasons.push('Level outside 1-10: ' + r.level + '.');
    if (!Number.isInteger(r.xp) || r.xp < 0) reasons.push('Negative or non-integer XP: ' + r.xp + '.');
    if (Number.isInteger(r.level) && Number.isInteger(r.xp) && r.level >= 1 && r.level <= MAX_LEVEL) {
      if (levelForXp(r.xp) !== r.level) reasons.push('Level ' + r.level + ' does not match XP ' + r.xp + ' (level for that XP is ' + levelForXp(r.xp) + ').');
    }
    // WAVE 3 mastery: a missing field is an old record (claimed 0),
    // never corruption — the old shape loads intact. A present
    // field must be an integer within the earned rank, or the
    // record fails like any other inconsistency.
    var claimed = (r.masteryClaimed === undefined || r.masteryClaimed === null) ? 0 : r.masteryClaimed;
    if (r.masteryClaimed !== undefined && r.masteryClaimed !== null) {
      if (!Number.isInteger(r.masteryClaimed) || r.masteryClaimed < 0 || r.masteryClaimed > MAX_MASTERY)
        reasons.push('Mastery claimed outside 0-' + MAX_MASTERY + ': ' + r.masteryClaimed + '.');
      else if (Number.isInteger(r.xp) && r.xp >= 0 && r.masteryClaimed > masteryRankForXp(r.xp))
        reasons.push('Mastery claimed ' + r.masteryClaimed + ' exceeds the rank earned at XP ' + r.xp + ' (' + masteryRankForXp(r.xp) + ').');
    }
    if (!Number.isInteger(r.skillPoints) || r.skillPoints < 0) reasons.push('Negative or non-integer skill points: ' + r.skillPoints + '.');
    if (!Array.isArray(r.skills)) reasons.push('Skills is not a list.');
    else {
      var seen = {};
      r.skills.forEach(function (id) {
        var s = skillById(id);
        if (!s) reasons.push('Unknown skill id: ' + id + '.');
        else if (seen[id]) reasons.push('Duplicate skill id: ' + id + '.');
        else {
          seen[id] = true;
          if (Number.isInteger(r.level) && s.gate > r.level) reasons.push(s.name + ' requires hero level ' + s.gate + ' (record level ' + r.level + ').');
        }
      });
      if (Number.isInteger(r.level) && Number.isInteger(r.skillPoints) && Array.isArray(r.skills)) {
        if (r.skills.length + r.skillPoints !== r.level - 1 + claimed) reasons.push('Skill points do not balance: ' + r.skills.length + ' unlocked + ' + r.skillPoints + ' unspent != ' + (r.level - 1 + claimed) + ' earned by level ' + r.level + ' plus ' + claimed + ' mastery.');
      }
    }
    if (!r.loadout || typeof r.loadout !== 'object') reasons.push('Loadout is missing.');
    else {
      if (r.loadout.ability) {
        var ab = skillById(r.loadout.ability);
        if (!ab) reasons.push('Unknown ability skill id: ' + r.loadout.ability + '.');
        else if (ab.type !== 'active') reasons.push(ab.name + ' is a passive skill and cannot be equipped as the active ability.');
        else if (!Array.isArray(r.skills) || r.skills.indexOf(r.loadout.ability) === -1) reasons.push(ab.name + ' is equipped as the ability but is not unlocked.');
      }
      if (Weapons && Number.isInteger(r.level)) {
        var v = Weapons.validateLoadout(r.loadout, { chassis: 'Lancer', movementClass: 'ground',
          phaseTierCap: tierBand(r.level), levelBand: true,
          allowAbility: true, ownedAbilityIds: (r.skills || []).filter(function (id) { var s = skillById(id); return s && s.type === 'active'; }) });
        if (!v.ok) reasons = reasons.concat(v.reasons);
      }
    }
    if (typeof r.heroEnabled !== 'boolean') reasons.push('heroEnabled is not true/false.');
    if (!Number.isInteger(r.matchesPlayed) || r.matchesPlayed < 0) reasons.push('Negative or non-integer matchesPlayed.');
    if (!Number.isInteger(r.wins) || r.wins < 0 || (Number.isInteger(r.matchesPlayed) && r.wins > r.matchesPlayed)) reasons.push('Wins out of range: ' + r.wins + '.');
    return { ok: reasons.length === 0, reasons: reasons };
  }
  // Pure match-end transition. result: 'win' | 'draw' | 'loss'.
  // events: {killXp, salvageXp} accumulated by the sim during the
  // match (0 when the hero never fought). Returns a NEW record;
  // the input is never mutated. Level-up and skill-point grants
  // happen here, at match end, never mid-match.
  function applyMatchResult(record, result, events) {
    var out = cloneRecord(record);
    var bonus = result === 'win' ? XP_WIN : (result === 'draw' ? XP_DRAW : XP_LOSS);
    var gained = (events ? (events.killXp || 0) : 0) + (events ? (events.salvageXp || 0) : 0) + bonus;
    out.xp = record.xp + gained;
    var newLevel = levelForXp(out.xp);
    // WAVE 3 mastery: pay every rank earned up to now that has not
    // been claimed yet — this is the catch-up for old records,
    // whose missing field clones to 0.
    var oldClaimed = record.masteryClaimed || 0;
    var newClaimed = Math.max(oldClaimed, masteryRankForXp(out.xp));
    out.skillPoints = record.skillPoints + (newLevel - record.level) + (newClaimed - oldClaimed);
    out.masteryClaimed = newClaimed;
    out.level = newLevel;
    out.matchesPlayed = record.matchesPlayed + 1;
    if (result === 'win') out.wins = record.wins + 1;
    return { record: out, xpGained: gained, bonus: bonus, levelBefore: record.level, levelAfter: newLevel,
      masteryBefore: oldClaimed, masteryAfter: newClaimed };
  }
  // Buy one skill point's worth of skill. Returns {ok, record, reason}.
  function buySkill(record, skillId) {
    var s = skillById(skillId);
    if (!s) return { ok: false, reason: 'Unknown skill: ' + skillId + '.' };
    if (record.skills.indexOf(skillId) !== -1) return { ok: false, reason: s.name + ' is already unlocked.' };
    if (s.gate > record.level) return { ok: false, reason: s.name + ' requires hero level ' + s.gate + ' (you are level ' + record.level + ').' };
    if (record.skillPoints < 1) return { ok: false, reason: 'No unspent skill points (you have 0).' };
    var out = cloneRecord(record);
    out.skills.push(skillId);
    out.skillPoints -= 1;
    return { ok: true, record: out, reason: '' };
  }
  // Free respec, between matches only (the shell only offers it on
  // the loadout screen, never mid-match): all spent points return
  // to the pool, skills clear, equipped ability clears, XP and level
  // never change. Returns a NEW record.
  function respec(record) {
    var out = cloneRecord(record);
    out.skillPoints = record.level - 1 + (record.masteryClaimed || 0);
    out.skills = [];
    out.loadout.ability = null;
    return out;
  }

  var api = { RECORD_KEY: RECORD_KEY, XP_CURVE: XP_CURVE, MAX_LEVEL: MAX_LEVEL,
    MASTERY_CURVE: MASTERY_CURVE, MAX_MASTERY: MAX_MASTERY,
    SKILLS: SKILLS, XP_WIN: XP_WIN, XP_DRAW: XP_DRAW, XP_LOSS: XP_LOSS, XP_SALVAGE: XP_SALVAGE,
    skillById: skillById, levelForXp: levelForXp, masteryRankForXp: masteryRankForXp,
    tierBand: tierBand, tierMinLevel: tierMinLevel,
    defaultRecord: defaultRecord, defaultLoadout: defaultLoadout, cloneRecord: cloneRecord,
    validateRecord: validateRecord, applyMatchResult: applyMatchResult,
    buySkill: buySkill, respec: respec };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWProgression = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
