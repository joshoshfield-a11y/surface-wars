/* Surface Wars — Twin-Stick Phase B: named-weapon data rows, family
   baselines, gear rows, loadout validation, hero stat resolution.
   DOM-free: the browser shell (game.js) and node tests share this file.
   Source of the 123 names: the Expansion Content Master List §1
   (ballistic 32, energy/plasma 30, melee/industrial 34, biological /
   chemical / corrosive 12, experimental / rare 15). Names are verbatim
   from that list; families, slots, and tiers are Phase B assignments,
   NOT document values — the document gives names and one-line
   descriptors only, never stats. Only the 12 family baselines below
   are tuned numbers, and they are the catalog's own canonical rows
   for each family (verified against data/catalog.json), so a named
   weapon resolves to baseline + at most two multipliers + at most one
   special, per the twin-stick spec. If a weapon cannot be expressed
   that way, the family assignment is wrong — never add a third
   multiplier. scrapCost is recorded per row but Phase B uses level
   gating (Phase C), not a second currency; powerCost is reserved and
   always 0 until a Power economy layer exists.
   Special effects (overheat / pierce / burn / stun) are implemented in
   sim.js, not here: this file only carries the closed-list value.
   Compatibility is computed, not stored per row: the chassis -> family
   tables below ARE the template's compatibleChassis lists (a family
   not listed for a chassis is compatible with none of its units), so
   there is one source of truth instead of 123 duplicated lists. */
(function (global) {
  'use strict';
  var SPECIALS = ['none', 'overheat', 'pierce', 'burn', 'stun'];
  // Family baselines: the catalog's canonical row per family.
  // (w_autocannon, w_heavy_cannon, w_missile, w_rocket_artillery,
  // w_railgun, w_mortar, w_flamethrower, w_aa_cannon, w_laser,
  // w_siege_cannon, w_melee, w_ew — values copied from catalog.json.)
  var FAMILY_BASELINES = {
    'Autocannon':       { damage: 12, range: 6,  minRange: 0, interval: 0.5, projectileSpeed: 24, splashRadius: 0,   falloff: 0,   accuracy: 0.85, damageType: 'Kinetic',    targetClasses: ['ground', 'structure'] },
    'Heavy Cannon':     { damage: 28, range: 7,  minRange: 0, interval: 1.2, projectileSpeed: 20, splashRadius: 0,   falloff: 0,   accuracy: 0.80, damageType: 'Kinetic',    targetClasses: ['ground', 'structure'] },
    'Missile Launcher': { damage: 22, range: 9,  minRange: 0, interval: 1.4, projectileSpeed: 18, splashRadius: 1.5, falloff: 0.5, accuracy: 0.85, damageType: 'Explosive',  targetClasses: ['ground', 'air', 'structure'] },
    'Rocket Artillery': { damage: 30, range: 16, minRange: 4, interval: 3.0, projectileSpeed: 14, splashRadius: 3.0, falloff: 0.6, accuracy: 0.80, damageType: 'Explosive',  targetClasses: ['ground', 'structure'] },
    'Railgun':          { damage: 40, range: 20, minRange: 6, interval: 3.5, projectileSpeed: 60, splashRadius: 0,   falloff: 0,   accuracy: 0.95, damageType: 'Energy',     targetClasses: ['ground', 'structure'] },
    'Mortar':           { damage: 20, range: 12, minRange: 3, interval: 2.0, projectileSpeed: 10, splashRadius: 2.0, falloff: 0.5, accuracy: 0.80, damageType: 'Explosive',  targetClasses: ['ground', 'structure'] },
    'Flamethrower':     { damage: 9,  range: 3,  minRange: 0, interval: 0.3, projectileSpeed: 8,  splashRadius: 1.5, falloff: 0.4, accuracy: 0.90, damageType: 'Thermal',    targetClasses: ['ground'] },
    'Anti-air Cannon':  { damage: 10, range: 7,  minRange: 0, interval: 0.4, projectileSpeed: 36, splashRadius: 0,   falloff: 0,   accuracy: 0.85, damageType: 'Kinetic',    targetClasses: ['air'] },
    'Laser':            { damage: 16, range: 8,  minRange: 0, interval: 0.7, projectileSpeed: 0,  splashRadius: 0,   falloff: 0,   accuracy: 0.90, damageType: 'Energy',     targetClasses: ['ground', 'air', 'structure'] },
    'Siege Cannon':     { damage: 55, range: 18, minRange: 5, interval: 4.0, projectileSpeed: 12, splashRadius: 2.5, falloff: 0.5, accuracy: 0.80, damageType: 'Siege',      targetClasses: ['ground', 'structure'] },
    'Melee Weapon':     { damage: 25, range: 1.2, minRange: 0, interval: 0.8, projectileSpeed: 0, splashRadius: 0,   falloff: 0,   accuracy: 0.95, damageType: 'Kinetic',    targetClasses: ['ground', 'structure'] },
    'Electronic Warfare': { damage: 6, range: 7, minRange: 0, interval: 2.0, projectileSpeed: 0, splashRadius: 0,   falloff: 0,   accuracy: 0.90, damageType: 'Disruption', targetClasses: ['ground', 'air'] }
  };
  // Chassis -> primary families. A primary weapon must come from the
  // chassis's list; a family absent here is compatible with none.
  var CHASSIS_PRIMARY_FAMILIES = {
    'Scout':    ['Autocannon', 'Missile Launcher', 'Laser'],
    'Lancer':   ['Autocannon', 'Heavy Cannon', 'Missile Launcher', 'Laser', 'Railgun', 'Flamethrower'],
    'Bulwark':  ['Autocannon', 'Heavy Cannon', 'Mortar', 'Rocket Artillery', 'Siege Cannon'],
    'Longshot': ['Railgun', 'Siege Cannon', 'Rocket Artillery', 'Laser', 'Missile Launcher'],
    'Rampart':  ['Heavy Cannon', 'Mortar', 'Rocket Artillery', 'Siege Cannon'],
    'Vespid':   ['Autocannon', 'Laser', 'Missile Launcher'],
    'Scrapjack': ['Autocannon', 'Heavy Cannon', 'Missile Launcher', 'Flamethrower', 'Melee Weapon'],
    'Warden':   ['Laser', 'Railgun', 'Electronic Warfare', 'Missile Launcher']
  };
  // Secondary slot: lighter families only, tier <= primary tier (spec).
  var LIGHTER_FAMILIES = ['Autocannon', 'Missile Launcher', 'Flamethrower', 'Anti-air Cannon', 'Melee Weapon'];
  // Air mounts may never carry these families (spec; encoded for future
  // air heroes even though the Phase B hero is ground).
  var AIR_BANNED_FAMILIES = ['Flamethrower', 'Melee Weapon', 'Siege Cannon', 'Mortar'];

  function W(id, name, family, slot, tier, mult, special) {
    return { id: id, name: name, family: family, slot: slot, tier: tier,
      mult: mult || {}, special: special || 'none',
      scrapCost: tier * 60, powerCost: 0 };
  }
  // Order below is the document's order: ballistic (G1/G2/G3), energy
  // (G13/G14/G15), melee (G16/G17/G18), biological (19-30),
  // experimental (31-45). Family assignments follow the subgroup the
  // document itself puts the weapon in, with named exceptions where
  // the descriptor demands another family (incendiary shotguns ->
  // Flamethrower, EMP gear -> Electronic Warfare, cloud lobbers ->
  // Mortar). Tiers are Phase B starting tiers, not document values.
  var NAMED_WEAPONS = [
    // Ballistic G1: machine guns and automatic weapons -> Autocannon.
    W('nw_scrapstorm_rotary_gun', "Scrapstorm Rotary Gun", 'Autocannon', 'primary', 2, { dmg: 0.9, int: 0.65 }, 'overheat'),
    W('nw_ratchet_smg', 'Ratchet SMG', 'Autocannon', 'primary', 1),
    W('nw_rivet_cannon', 'Rivet Cannon', 'Autocannon', 'primary', 1),
    W('nw_twin_bore_autogun', 'Twin-Bore Autogun', 'Autocannon', 'primary', 1),
    W('nw_widowmaker_lmg', 'Widowmaker LMG', 'Autocannon', 'primary', 2, { dmg: 1.2, int: 1.3 }),
    W('nw_brass_knuckle_cannon', 'Brass Knuckle Cannon', 'Autocannon', 'primary', 1),
    W('nw_sawtooth_repeater', 'Sawtooth Repeater', 'Autocannon', 'primary', 2, { dmg: 0.8, int: 0.7 }),
    W('nw_hailstorm_minigun', 'Hailstorm Minigun', 'Autocannon', 'primary', 3, { int: 0.7, range: 0.83 }, 'overheat'),
    W('nw_coil_feed_carbine', 'Coil-Feed Carbine', 'Autocannon', 'primary', 1),
    W('nw_salvagers_nailgun', "Salvager's Nailgun", 'Autocannon', 'primary', 1),
    // Ballistic G2: shotguns -> Heavy Cannon, except the incendiary one.
    W('nw_breacher_12', 'Breacher-12', 'Heavy Cannon', 'primary', 1),
    W('nw_door_kicker', 'Door-Kicker', 'Heavy Cannon', 'primary', 1),
    W('nw_furnace_shotgun', 'Furnace Shotgun', 'Flamethrower', 'primary', 2, { dmg: 1.2, int: 1.3 }, 'burn'),
    W('nw_scatterjack', 'Scatterjack', 'Heavy Cannon', 'primary', 1),
    W('nw_double_feed', 'Double-Feed', 'Heavy Cannon', 'primary', 2, { dmg: 1.15, int: 1.25 }),
    W('nw_slugger_cannon', 'Slugger Cannon', 'Heavy Cannon', 'primary', 2, { dmg: 0.9, range: 1.14 }, 'pierce'),
    W('nw_shredder_8', 'Shredder-8', 'Heavy Cannon', 'primary', 1),
    W('nw_backblast_shotgun', 'Backblast Shotgun', 'Heavy Cannon', 'primary', 1),
    W('nw_bonecrusher', 'Bonecrusher', 'Heavy Cannon', 'primary', 2, { dmg: 1.3, int: 1.4 }),
    W('nw_maglock_shotgun', 'Maglock Shotgun', 'Heavy Cannon', 'primary', 2),
    // Ballistic G3: cannons, launchers, heavy ballistic.
    W('nw_mule_40_grenade_lobber', 'MULE-40 Grenade Lobber', 'Mortar', 'primary', 2),
    W('nw_burrower_rocket_pod', 'Burrower Rocket Pod', 'Rocket Artillery', 'primary', 2),
    W('nw_cratermaker', 'Cratermaker', 'Siege Cannon', 'primary', 3),
    W('nw_scrap_mortar', 'Scrap Mortar', 'Mortar', 'primary', 1),
    W('nw_clusterbug_launcher', 'Clusterbug Launcher', 'Rocket Artillery', 'primary', 2),
    W('nw_breach_missile', 'Breach Missile', 'Missile Launcher', 'primary', 2),
    W('nw_siege_nail_driver', 'Siege Nail Driver', 'Siege Cannon', 'primary', 3, {}, 'pierce'),
    W('nw_thunderclap_autocannon', 'Thunderclap Autocannon', 'Autocannon', 'primary', 2, { dmg: 0.85, range: 1.17 }),
    W('nw_hopper_mine_dispenser', 'Hopper Mine Dispenser', 'Mortar', 'primary', 2),
    W('nw_atlas_shoulder_howitzer', 'Atlas Shoulder Howitzer', 'Siege Cannon', 'primary', 3),
    W('nw_furnace_bombard', 'Furnace Bombard', 'Mortar', 'primary', 3, {}, 'burn'),
    W('nw_ricochet_cannon', 'Ricochet Cannon', 'Heavy Cannon', 'primary', 2),
    // Energy G13: plasma -> Laser.
    W('nw_plasma_spitter', 'Plasma Spitter', 'Laser', 'primary', 1),
    W('nw_blueglass_rifle', 'Blueglass Rifle', 'Laser', 'primary', 2),
    W('nw_arc_furnace', 'Arc Furnace', 'Laser', 'primary', 2, {}, 'overheat'),
    W('nw_sunspot_blaster', 'Sunspot Blaster', 'Laser', 'primary', 2),
    W('nw_ion_needle', 'Ion Needle', 'Laser', 'primary', 2, {}, 'pierce'),
    W('nw_meltdown_cannon', 'Meltdown Cannon', 'Laser', 'primary', 3, { dmg: 0.9, range: 0.75 }),
    W('nw_plasma_saw', 'Plasma Saw', 'Laser', 'primary', 2),
    W('nw_ghostlight_projector', 'Ghostlight Projector', 'Laser', 'primary', 3, {}, 'pierce'),
    W('nw_cindercoil', 'Cindercoil', 'Laser', 'primary', 2, {}, 'burn'),
    W('nw_starved_reactor', 'Starved Reactor', 'Laser', 'primary', 3),
    // Energy G14: electrical / magnetic.
    W('nw_arc_thrower', 'Arc Thrower', 'Railgun', 'primary', 2, { dmg: 1.2, int: 1.25 }),
    W('nw_magnetar_cannon', 'Magnetar Cannon', 'Railgun', 'primary', 2),
    W('nw_emp_carbine', 'EMP Carbine', 'Electronic Warfare', 'utility', 2, {}, 'stun'),
    W('nw_tesla_fork', 'Tesla Fork', 'Railgun', 'primary', 2),
    W('nw_static_harpoon', 'Static Harpoon', 'Railgun', 'primary', 1),
    W('nw_railspike', 'Railspike', 'Railgun', 'primary', 3, {}, 'pierce'),
    W('nw_storm_cage', 'Storm Cage', 'Electronic Warfare', 'utility', 3, {}, 'stun'),
    W('nw_flux_hammer', 'Flux Hammer', 'Railgun', 'primary', 2),
    W('nw_capacitor_rifle', 'Capacitor Rifle', 'Railgun', 'primary', 2, { dmg: 0.75, int: 0.7 }),
    W('nw_blackout_emitter', 'Blackout Emitter', 'Electronic Warfare', 'utility', 2, {}, 'stun'),
    // Energy G15: lasers and exotic energy -> Laser.
    W('nw_redline_laser', 'Redline Laser', 'Laser', 'primary', 2, {}, 'burn'),
    W('nw_prism_rifle', 'Prism Rifle', 'Laser', 'primary', 2),
    W('nw_phase_lance', 'Phase Lance', 'Laser', 'primary', 3, {}, 'pierce'),
    W('nw_mirrorbeam', 'Mirrorbeam', 'Laser', 'primary', 2),
    W('nw_null_ray', 'Null Ray', 'Laser', 'primary', 1),
    W('nw_helios_projector', 'Helios Projector', 'Laser', 'primary', 3, { dmg: 0.85, range: 1.25 }),
    W('nw_photon_scatterer', 'Photon Scatterer', 'Laser', 'primary', 1),
    W('nw_afterimage_emitter', 'Afterimage Emitter', 'Laser', 'primary', 2),
    W('nw_horizon_cutter', 'Horizon Cutter', 'Laser', 'primary', 3, { dmg: 0.8, int: 0.65 }),
    W('nw_eventide_cannon', 'Eventide Cannon', 'Laser', 'primary', 3),
    // Melee G16: blades -> Melee Weapon, secondary slot.
    W('nw_rustfang', 'Rustfang', 'Melee Weapon', 'secondary', 1),
    W('nw_arc_cleaver', 'Arc Cleaver', 'Melee Weapon', 'secondary', 1),
    W('nw_plasma_machete', 'Plasma Machete', 'Melee Weapon', 'secondary', 2, { range: 1.25 }),
    W('nw_monorail_blade', 'Monorail Blade', 'Melee Weapon', 'secondary', 2),
    W('nw_rotary_sawarm', 'Rotary Sawarm', 'Melee Weapon', 'secondary', 2),
    W('nw_chain_glaive', 'Chain Glaive', 'Melee Weapon', 'secondary', 2),
    W('nw_guillotine_arm', 'Guillotine Arm', 'Melee Weapon', 'secondary', 3, { dmg: 1.4, int: 1.5 }),
    W('nw_vibroknife', 'Vibroknife', 'Melee Weapon', 'secondary', 1),
    W('nw_glass_edge', 'Glass Edge', 'Melee Weapon', 'secondary', 2),
    W('nw_furnace_sword', 'Furnace Sword', 'Melee Weapon', 'secondary', 2, {}, 'burn'),
    W('nw_splitter_axe', 'Splitter Axe', 'Melee Weapon', 'secondary', 2),
    W('nw_phase_cutter', 'Phase Cutter', 'Melee Weapon', 'secondary', 3, { dmg: 0.8, int: 0.7 }, 'pierce'),
    // Melee G17: hammers -> Melee Weapon, secondary slot.
    W('nw_pile_driver_fist', 'Pile-Driver Fist', 'Melee Weapon', 'secondary', 1),
    W('nw_wrecking_maul', 'Wrecking Maul', 'Melee Weapon', 'secondary', 1),
    W('nw_seismic_hammer', 'Seismic Hammer', 'Melee Weapon', 'secondary', 2),
    W('nw_anchor_fist', 'Anchor Fist', 'Melee Weapon', 'secondary', 1),
    W('nw_hydraulic_crusher', 'Hydraulic Crusher', 'Melee Weapon', 'secondary', 2),
    W('nw_bellringer', 'Bellringer', 'Melee Weapon', 'secondary', 2, { dmg: 1.2, int: 1.3 }, 'stun'),
    W('nw_corebreaker', 'Corebreaker', 'Melee Weapon', 'secondary', 2),
    W('nw_gravity_mallet', 'Gravity Mallet', 'Melee Weapon', 'secondary', 2),
    W('nw_demolition_ram', 'Demolition Ram', 'Melee Weapon', 'secondary', 2),
    W('nw_foundry_sledge', 'Foundry Sledge', 'Melee Weapon', 'secondary', 2),
    // Melee G18: improvised and bizarre.
    W('nw_rebar_bowcaster', 'Rebar Bowcaster', 'Missile Launcher', 'primary', 1),
    W('nw_toaster_turret', 'Toaster Turret', 'Autocannon', 'primary', 1),
    W('nw_forklift_forks', 'Forklift Forks', 'Melee Weapon', 'secondary', 1),
    W('nw_industrial_stapler', 'Industrial Stapler', 'Melee Weapon', 'secondary', 1),
    W('nw_propane_lance', 'Propane Lance', 'Flamethrower', 'secondary', 1, {}, 'burn'),
    W('nw_compressed_junk_cannon', 'Compressed Junk Cannon', 'Heavy Cannon', 'primary', 1),
    W('nw_microwave_emitter', 'Microwave Emitter', 'Laser', 'primary', 2),
    W('nw_emergency_flare_gun', 'Emergency Flare Gun', 'Flamethrower', 'secondary', 1, {}, 'burn'),
    W('nw_concrete_mixer', 'Concrete Mixer', 'Flamethrower', 'secondary', 2),
    W('nw_the_negotiator', 'The Negotiator', 'Melee Weapon', 'secondary', 2),
    W('nw_cursed_office_printer', 'Cursed Office Printer', 'Rocket Artillery', 'primary', 2),
    W('nw_breakroom_special', 'Breakroom Special', 'Laser', 'primary', 2),
    // Biological / chemical / corrosive (document items 19-30).
    W('nw_acid_sprayer', 'Acid Sprayer', 'Flamethrower', 'secondary', 2),
    W('nw_corrosion_needle', 'Corrosion Needle', 'Flamethrower', 'secondary', 2),
    W('nw_spore_mortar', 'Spore Mortar', 'Mortar', 'primary', 2),
    W('nw_leech_harpoon', 'Leech Harpoon', 'Railgun', 'secondary', 2),
    W('nw_rust_cloud_projector', 'Rust Cloud Projector', 'Mortar', 'primary', 2),
    W('nw_caustic_foam_gun', 'Caustic Foam Gun', 'Flamethrower', 'secondary', 2, {}, 'stun'),
    W('nw_furnace_gel_launcher', 'Furnace Gel Launcher', 'Mortar', 'primary', 3, {}, 'burn'),
    W('nw_cryogenic_mist_cannon', 'Cryogenic Mist Cannon', 'Flamethrower', 'secondary', 2, {}, 'stun'),
    W('nw_cryo_piercer', 'Cryo-Piercer', 'Railgun', 'primary', 2, {}, 'pierce'),
    W('nw_toxic_dart_array', 'Toxic Dart Array', 'Autocannon', 'secondary', 1, { dmg: 0.6, int: 0.6 }),
    W('nw_nanite_swarm_injector', 'Nanite Swarm Injector', 'Mortar', 'primary', 3),
    W('nw_biomass_reclaimer', 'Biomass Reclaimer', 'Electronic Warfare', 'utility', 2),
    // Experimental / rare (document items 31-45).
    W('nw_probability_engine', 'Probability Engine', 'Laser', 'primary', 3),
    W('nw_echo_rifle', 'Echo Rifle', 'Laser', 'primary', 2),
    W('nw_chrono_spike', 'Chrono Spike', 'Railgun', 'primary', 3, {}, 'stun'),
    W('nw_phase_shear_cannon', 'Phase-Shear Cannon', 'Railgun', 'primary', 3, {}, 'pierce'),
    W('nw_blackbox_launcher', 'Blackbox Launcher', 'Missile Launcher', 'primary', 3),
    W('nw_singularity_projector', 'Singularity Projector', 'Siege Cannon', 'primary', 3),
    W('nw_faultline_driver', 'Faultline Driver', 'Siege Cannon', 'primary', 3),
    W('nw_mimic_gun', 'Mimic Gun', 'Laser', 'primary', 3),
    W('nw_entropy_cannon', 'Entropy Cannon', 'Heavy Cannon', 'primary', 3),
    W('nw_ghost_battery', 'Ghost Battery', 'Railgun', 'primary', 3, {}, 'overheat'),
    W('nw_redshift_rifle', 'Redshift Rifle', 'Railgun', 'primary', 2),
    W('nw_dead_channel', 'Dead Channel', 'Electronic Warfare', 'utility', 2, {}, 'stun'),
    W('nw_mirror_core', 'Mirror Core', 'Electronic Warfare', 'utility', 3),
    W('nw_scrap_singularity', 'Scrap Singularity', 'Electronic Warfare', 'utility', 3),
    W('nw_the_last_argument', 'The Last Argument', 'Siege Cannon', 'primary', 3),
    // WAVE 4 (CURRENCY-12H) premium-only rows: sold ONLY as part of
    // Premium Store packs (currency.js), never in the free loadout
    // list without ownership (see validateLoadout's premiumOwnedIds
    // option and the shell's store wiring). Both are sidegrades,
    // not stat piles: each resolves to <=1.5x its family baseline
    // DPS with a stated trade-off. Ember Repeater (Autocannon T2):
    // 13.2 dmg, range 5, interval 0.5, overheat — DPS 22.44 vs the
    // 20.4 baseline (+10%) bought with shorter range (5 vs 6) and
    // overheat. Gilded Lance (Laser T2): 14.4 dmg, range 10, pierce
    // — DPS 16.46 after the Wave 4 freeze-rule retune (see below),
    // BELOW the 20.57 baseline, reach + pierce bought with raw
    // damage. Both are Lancer primary families, so the hero
    // chassis rule is unchanged.
    // FREEZE-RULE RETUNES (currency12h-match.js runs 1-2): Gilded
    // Reach swept — it won both maps the default loadout failed
    // to win (first: loss, second: draw). Per the freeze rule the
    // pack was retuned DOWN, never the opponent buffed, never the
    // price raised as a substitute. Run 1 cut damage 0.9 -> 0.8
    // (14.4 -> 12.8, DPS 18.51 -> 16.46) and the pack STILL swept
    // (the hero survived both matches — the driver was range, not
    // DPS), so run 2 removed the range bonus as well (10 -> 8
    // tiles, the family baseline range). What remains is a
    // below-baseline-damage Laser with pierce: the pack's identity
    // is now pierce + the Reactive Weave / sensor bundle, not
    // stand-off range.
    W('nw_ember_repeater', 'Ember Repeater', 'Autocannon', 'primary', 2, { dmg: 1.1, range: 0.83 }, 'overheat'),
    W('nw_gilded_lance', 'Gilded Lance', 'Laser', 'primary', 2, { dmg: 0.8 }, 'pierce')
  ];
  // WAVE 4: weapon ids that exist ONLY behind Premium Store packs.
  // validateLoadout enforces ownership only when the caller passes
  // premiumOwnedIds (the store/equip path); callers that omit it
  // (hero-record validation, generic tests) skip the check, so an
  // old record or a test loadout never fails on ownership alone.
  var PREMIUM_ROW_IDS = ['nw_ember_repeater', 'nw_gilded_lance'];
  // Gear rows. Tier bands in the spec are written by hero level
  // (1-3 / 4-6 / 7+); Phase B has no levels, so only tier 1 is
  // equippable here and tiers 2-3 are data-complete but locked until
  // Phase C levels (see the Phase B report for the resolution).
  // The ability slot has NO gear rows in Phase B: it holds skills,
  // which are Phase C, so ability must stay null in this phase.
  function G(id, name, slot, tier, effect) {
    return { id: id, name: name, slot: slot, tier: tier, effect: effect };
  }
  var GEAR_ROWS = [
    G('gear_armor_1', 'Plated Hull I', 'armor', 1, { maxHpMult: 1.10 }),
    G('gear_armor_2', 'Plated Hull II', 'armor', 2, { maxHpMult: 1.20 }),
    G('gear_armor_3', 'Plated Hull III', 'armor', 3, { maxHpMult: 1.30, armorStep: true }),
    G('gear_mobility_1', 'Servo Legs I', 'mobility', 1, { speedAdd: 0.5 }),
    G('gear_mobility_2', 'Servo Legs II', 'mobility', 2, { speedAdd: 1.0 }),
    G('gear_mobility_3', 'Servo Legs III', 'mobility', 3, { speedAdd: 1.5 }),
    G('gear_reactor_1', 'Overclocked Reactor I', 'reactor', 1, { energyFireRateMult: 1.05 }),
    G('gear_reactor_2', 'Overclocked Reactor II', 'reactor', 2, { energyFireRateMult: 1.10 }),
    G('gear_reactor_3', 'Overclocked Reactor III', 'reactor', 3, { energyFireRateMult: 1.15 }),
    G('gear_sensor_1', 'Targeting Array I', 'sensor', 1, { visionAdd: 1 }),
    G('gear_sensor_2', 'Targeting Array II', 'sensor', 2, { visionAdd: 2 }),
    G('gear_sensor_3', 'Targeting Array III', 'sensor', 3, { visionAdd: 3, rangeAdd: 1 }),
    // WAVE 3 (UPGRADES-12H) trade-off rows: a second choice inside a
    // slot/tier, never a pure upgrade over the same-tier row it
    // sits beside. Armor T1 Reactive Weave trades HP for speed
    // (1.05 vs Plated I 1.10, +0.5 speed); armor T2 Ablative Hull
    // trades speed for HP (1.26 vs Plated II 1.20, -0.5 speed);
    // mobility T2 Overdrive Servos trade HP for speed (+1.5 vs
    // Servo II +1.0, HP x0.95); sensor T2 Long-Eye trades vision
    // for range (vision +1 vs Targeting II +2, range +1). heroStats
    // applies maxHpMult/speedAdd generically over ALL equipped gear
    // (previously only the armor row carried maxHpMult and only
    // mobility carried speedAdd), so existing rows resolve to
    // exactly their old values — the generic path is provably
    // identical on the 12 original rows.
    G('gear_armor_1b', 'Reactive Weave I', 'armor', 1, { maxHpMult: 1.05, speedAdd: 0.5 }),
    G('gear_armor_2b', 'Ablative Hull II', 'armor', 2, { maxHpMult: 1.26, speedAdd: -0.5 }),
    G('gear_mobility_2b', 'Overdrive Servos II', 'mobility', 2, { speedAdd: 1.5, maxHpMult: 0.95 }),
    G('gear_sensor_2b', 'Long-Eye Array II', 'sensor', 2, { visionAdd: 1, rangeAdd: 1 })
  ];
  var DEFAULT_LOADOUT = { primary: 'nw_twin_bore_autogun', secondary: null,
    armor: null, mobility: null, reactor: null, sensor: null, ability: null };

  function rowById(id) {
    for (var i = 0; i < NAMED_WEAPONS.length; i++) if (NAMED_WEAPONS[i].id === id) return NAMED_WEAPONS[i];
    return null;
  }
  function gearById(id) {
    if (!id) return null;
    for (var i = 0; i < GEAR_ROWS.length; i++) if (GEAR_ROWS[i].id === id) return GEAR_ROWS[i];
    return null;
  }
  function round1(x) { return Math.round(x * 10) / 10; }
  function round2(x) { return Math.round(x * 100) / 100; }
  // Resolve a named row to a sim weapon object (fresh object, never a
  // shared baseline reference — gear and multipliers mutate it).
  function resolveWeapon(row) {
    var b = FAMILY_BASELINES[row.family];
    if (!b) throw new Error('unknown family: ' + row.family);
    var m = row.mult || {};
    return { id: row.id, name: row.name, family: row.family,
      damage: round1(b.damage * (m.dmg !== undefined ? m.dmg : 1)),
      range: round1(b.range * (m.range !== undefined ? m.range : 1)),
      minRange: b.minRange,
      interval: round2(b.interval * (m.int !== undefined ? m.int : 1)),
      projectileSpeed: b.projectileSpeed, splashRadius: b.splashRadius,
      falloff: b.falloff, accuracy: b.accuracy, damageType: b.damageType,
      targetClasses: b.targetClasses.slice(), special: row.special };
  }
  // Validate a loadout. opts: {chassis, movementClass, phaseTierCap,
  // levelBand, allowAbility, ownedAbilityIds}. Every failure carries
  // a REASON string — the loadout screen shows it, never a silent
  // rejection. phaseTierCap is the tier band (Phase B: 1, the level-1
  // band only; Phase C: tierBand(level) from progression.js; tests
  // pass a higher cap to exercise the slot rules in isolation from
  // the band). When levelBand is true, tier rejections name the
  // hero level that unlocks the tier instead of the Phase B
  // "unlocks in Phase C" wording; the default wording is unchanged
  // so Phase B tests keep passing. Ability: by default (Phase B)
  // any ability is rejected; with allowAbility, it must be one of
  // ownedAbilityIds (unlocked active skills) or it is rejected with
  // a reason.
  function validateLoadout(loadout, opts) {
    opts = opts || {};
    var chassis = opts.chassis || 'Lancer';
    var movementClass = opts.movementClass || 'ground';
    var cap = opts.phaseTierCap !== undefined ? opts.phaseTierCap : 1;
    function tierReason(row) {
      if (opts.levelBand) {
        var need = row.tier >= 3 ? 7 : 4;
        return row.name + ' is tier ' + row.tier + ' and needs hero level ' + need + ' (your band allows tier ' + cap + ').';
      }
      return row.name + ' is tier ' + row.tier + ' and unlocks in Phase C (Phase B allows tier ' + cap + ').';
    }
    var reasons = [];
    var primary = loadout.primary ? rowById(loadout.primary) : null;
    if (!loadout.primary) reasons.push('Primary weapon required.');
    else if (!primary) reasons.push('Unknown primary weapon: ' + loadout.primary + '.');
    else {
      if (primary.slot !== 'primary') reasons.push(primary.name + ' is a ' + primary.slot + ' weapon, not a primary weapon.');
      var famList = CHASSIS_PRIMARY_FAMILIES[chassis] || [];
      if (famList.indexOf(primary.family) === -1) reasons.push(primary.name + ' (' + primary.family + ') is not a primary family for the ' + chassis + ' chassis.');
      if (primary.tier > cap) reasons.push(tierReason(primary));
      if (movementClass === 'air' && AIR_BANNED_FAMILIES.indexOf(primary.family) !== -1) reasons.push(primary.name + ' (' + primary.family + ') cannot mount on air units.');
    }
    var secondary = loadout.secondary ? rowById(loadout.secondary) : null;
    // WAVE 4: premium ownership. Only when the caller passes
    // premiumOwnedIds (an array of owned premium weapon ids) does
    // an unowned premium row fail, with a store reason. Omitted
    // (undefined) means "no ownership check", never a failure.
    if (opts.premiumOwnedIds && primary && PREMIUM_ROW_IDS.indexOf(primary.id) !== -1 &&
        opts.premiumOwnedIds.indexOf(primary.id) === -1)
      reasons.push(primary.name + ' is a Premium Store weapon — buy its pack in the Premium Store first.');
    if (loadout.secondary) {
      if (!secondary) reasons.push('Unknown secondary weapon: ' + loadout.secondary + '.');
      else {
        if (opts.premiumOwnedIds && PREMIUM_ROW_IDS.indexOf(secondary.id) !== -1 &&
            opts.premiumOwnedIds.indexOf(secondary.id) === -1)
          reasons.push(secondary.name + ' is a Premium Store weapon — buy its pack in the Premium Store first.');
        if (secondary.slot !== 'secondary') reasons.push(secondary.name + ' is a ' + secondary.slot + ' weapon, not a secondary weapon.');
        if (LIGHTER_FAMILIES.indexOf(secondary.family) === -1) reasons.push(secondary.name + ' (' + secondary.family + ') is not a lighter secondary family.');
        if (primary && secondary.tier > primary.tier) reasons.push(secondary.name + ' is tier ' + secondary.tier + ', above the primary tier ' + primary.tier + ' (secondary tier must not exceed primary tier).');
        if (secondary.tier > cap) reasons.push(tierReason(secondary));
        if (movementClass === 'air' && AIR_BANNED_FAMILIES.indexOf(secondary.family) !== -1) reasons.push(secondary.name + ' (' + secondary.family + ') cannot mount on air units.');
      }
    }
    if (loadout.utility) reasons.push('Electronic warfare weapons fit the utility slot, which the hero does not carry in Phase B.');
    ['armor', 'mobility', 'reactor', 'sensor'].forEach(function (slot) {
      var gid = loadout[slot];
      if (!gid) return;
      var g = gearById(gid);
      if (!g) reasons.push('Unknown ' + slot + ' gear: ' + gid + '.');
      else {
        if (g.slot !== slot) reasons.push(g.name + ' is ' + g.slot + ' gear, not ' + slot + ' gear.');
        if (g.tier > cap) reasons.push(tierReason(g));
      }
    });
    if (loadout.ability) {
      if (opts.allowAbility) {
        var owned = opts.ownedAbilityIds || [];
        if (owned.indexOf(loadout.ability) === -1) reasons.push('Ability ' + loadout.ability + ' is not an unlocked active skill.');
      } else reasons.push('Skills arrive in Phase C — the ability slot stays empty in Phase B.');
    }
    // Scrapjack generalist cap (template rule, independent of the band).
    if (chassis === 'Scrapjack') {
      [primary, secondary].forEach(function (r) {
        if (r && r.tier > 2) reasons.push(r.name + ' is tier ' + r.tier + ' — the Scrapjack generalist cap is tier 2.');
      });
    }
    return { ok: reasons.length === 0, reasons: reasons };
  }
  // Hero stats from a loadout over a chassis base. base:
  // {hp, armor, speed, vision, radius, movementClass}. Gear effects
  // are the spec's proposed tier effects. opts: {level, skills} —
  // both default to the Phase B case (level 1, no skills), and with
  // those defaults the result is IDENTICAL to Phase B (proven by a
  // Phase C test comparing heroStats with and without opts).
  // Reactor fire-rate applies to ENERGY weapons only; sensor tier-3
  // range applies to all hero weapons. Phase C level effects:
  // max HP = base.hp x (1 + 0.05 x (level-1) + 0.15 if Reinforced
  // Frame) x gear maxHpMult — Reinforced Frame combines ADDITIVELY
  // on base HP with the level bonus (see progression.js, which
  // records the resolution); damage = weapon damage x (1 + 0.02 x
  // (level-1)). The +50% HP / +20% damage caps in the spec are
  // non-binding ceilings: (level-1) increments reach +45% / +18%
  // at level 10, and the level-1 anchor is never broken to make
  // the caps bind. Targeting Computer: primary weapon only,
  // accuracy +0.10 (capped at 1) and range +1. WAVE 3: gear
  // maxHpMult/speedAdd apply generically over all equipped gear
  // (identical results on the original 12 rows), and the Rapid
  // Servos passive adds +0.5 speed. Mastery never reaches this
  // function: level stays capped at 10, so mastery cannot move
  // HP or damage. Invalid rows are
  // skipped defensively (the loadout screen only ever saves valid
  // loadouts; newGame falls back to the default on an invalid
  // stored loadout).
  function heroStats(loadout, base, opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var skills = opts.skills || [];
    var weapons = [];
    var primary = loadout.primary ? rowById(loadout.primary) : null;
    var secondary = loadout.secondary ? rowById(loadout.secondary) : null;
    if (primary) weapons.push(resolveWeapon(primary));
    if (secondary) weapons.push(resolveWeapon(secondary));
    var armor = gearById(loadout.armor), mobility = gearById(loadout.mobility),
        reactor = gearById(loadout.reactor), sensor = gearById(loadout.sensor);
    var hpMult = 1 + 0.05 * (level - 1) + (skills.indexOf('reinforced_frame') !== -1 ? 0.15 : 0);
    // WAVE 3: maxHpMult and speedAdd apply generically over every
    // equipped gear row (the original 12 rows carry maxHpMult only
    // on armor and speedAdd only on mobility, so their values are
    // unchanged). armorStep stays armor-slot-only, as before.
    var hpProd = 1, speedBonus = 0;
    [armor, mobility, reactor, sensor].forEach(function (g) {
      if (!g) return;
      if (g.effect.maxHpMult) hpProd *= g.effect.maxHpMult;
      if (g.effect.speedAdd) speedBonus += g.effect.speedAdd;
    });
    var maxHp = Math.round(base.hp * hpMult * hpProd);
    var speed = speedBonus ? round1(base.speed + speedBonus) : base.speed;
    var vision = base.vision, armorClass = base.armor;
    if (armor && armor.effect.armorStep) armorClass = 'Heavy';
    if (sensor) vision = base.vision + sensor.effect.visionAdd;
    // WAVE 3 passive: Rapid Servos adds +0.5 hero speed, stacking
    // with mobility gear. It touches neither HP nor damage, so the
    // level-1 anchor and the level-10 ceilings are unaffected.
    if (skills.indexOf('rapid_servos') !== -1) speed = round1(speed + 0.5);
    var dmgMult = 1 + 0.02 * (level - 1);
    weapons.forEach(function (w) {
      w.damage = round1(w.damage * dmgMult);
      if (reactor && w.damageType === 'Energy') w.interval = round2(w.interval / reactor.effect.energyFireRateMult);
      if (sensor && sensor.effect.rangeAdd) w.range = round1(w.range + sensor.effect.rangeAdd);
    });
    if (skills.indexOf('targeting_computer') !== -1 && weapons.length) {
      weapons[0].accuracy = Math.min(1, round2(weapons[0].accuracy + 0.10));
      weapons[0].range = round1(weapons[0].range + 1);
    }
    return { maxHp: maxHp, armor: armorClass, speed: speed, vision: vision,
      radius: base.radius, movementClass: base.movementClass, weapons: weapons };
  }
  function cloneLoadout(l) {
    return { primary: l.primary, secondary: l.secondary, armor: l.armor,
      mobility: l.mobility, reactor: l.reactor, sensor: l.sensor, ability: l.ability };
  }

  var api = { SPECIALS: SPECIALS, FAMILY_BASELINES: FAMILY_BASELINES,
    CHASSIS_PRIMARY_FAMILIES: CHASSIS_PRIMARY_FAMILIES,
    LIGHTER_FAMILIES: LIGHTER_FAMILIES, AIR_BANNED_FAMILIES: AIR_BANNED_FAMILIES,
    NAMED_WEAPONS: NAMED_WEAPONS, PREMIUM_ROW_IDS: PREMIUM_ROW_IDS, GEAR_ROWS: GEAR_ROWS,
    DEFAULT_LOADOUT: DEFAULT_LOADOUT,
    rowById: rowById, gearById: gearById, resolveWeapon: resolveWeapon,
    validateLoadout: validateLoadout, heroStats: heroStats, cloneLoadout: cloneLoadout };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SWWeapons = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
