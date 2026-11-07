#!/usr/bin/env python3
"""Generate data/catalog.json from compact definitions. Source of truth for the
Prototype 01 content catalog. Run: python3 scripts/gen-catalog.py"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "catalog.json"

def W(id, name, family, damage, range_, min_range, speed, splash, falloff, acc, dtype, targets, interval):
    return {"id": id, "name": name, "family": family, "damage": damage,
            "range": range_, "minRange": min_range, "projectileSpeed": speed,
            "splashRadius": splash, "falloff": falloff, "accuracy": acc,
            "damageType": dtype, "targetClasses": targets, "interval": interval}

weapons = [
    W("w_scout_gun","Scout Autocannon","Autocannon",8,5,0,24,0,0,0.85,"Kinetic",["ground","structure"],0.45),
    W("w_autocannon","Autocannon","Autocannon",12,6,0,24,0,0,0.85,"Kinetic",["ground","structure"],0.5),
    W("w_heavy_cannon","Heavy Cannon","Heavy Cannon",28,7,0,20,0,0,0.80,"Kinetic",["ground","structure"],1.2),
    W("w_light_cannon","Light Cannon","Heavy Cannon",14,6,0,22,0,0,0.85,"Kinetic",["ground","structure"],0.8),
    W("w_missile","Missile Launcher","Missile Launcher",22,9,0,18,1.5,0.5,0.85,"Explosive",["ground","air","structure"],1.4),
    W("w_aa_missile","AA Missile","Missile Launcher",18,8,0,30,0,0,0.90,"Explosive",["air"],1.0),
    W("w_aa_cannon","Anti-Air Cannon","Anti-air Cannon",10,7,0,36,0,0,0.85,"Kinetic",["air"],0.4),
    W("w_interceptor_gun","Interceptor Gun","Autocannon",9,6,0,30,0,0,0.88,"Kinetic",["air"],0.35),
    W("w_rocket_artillery","Rocket Artillery","Rocket Artillery",30,16,4,14,3.0,0.6,0.80,"Explosive",["ground","structure"],3.0),
    W("w_siege_cannon","Siege Cannon","Siege Cannon",55,18,5,12,2.5,0.5,0.80,"Siege",["ground","structure"],4.0),
    W("w_mortar","Mortar","Mortar",20,12,3,10,2.0,0.5,0.80,"Explosive",["ground","structure"],2.0),
    W("w_railgun","Railgun","Railgun",40,20,6,60,0,0,0.95,"Energy",["ground","structure"],3.5),
    W("w_light_railgun","Light Railgun","Railgun",24,14,3,50,0,0,0.92,"Energy",["ground","structure"],2.2),
    W("w_laser","Laser","Laser",16,8,0,0,0,0,0.90,"Energy",["ground","air","structure"],0.7),
    W("w_flamethrower","Flamethrower","Flamethrower",9,3,0,8,1.5,0.4,0.90,"Thermal",["ground"],0.3),
    W("w_melee","Melee Weapon","Melee Weapon",25,1.2,0,0,0,0,0.95,"Kinetic",["ground","structure"],0.8),
    W("w_ew","EW Disruptor","Electronic Warfare",6,7,0,0,0,0,0.90,"Disruption",["ground","air"],2.0),
    W("w_bomb","Bomb Load","Rocket Artillery",45,4,0,0,3.5,0.5,0.85,"Explosive",["ground","structure"],2.5),
    W("w_plasma_laser","Plasma Laser","Laser",22,9,0,0,1.0,0.3,0.88,"Energy",["ground","structure"],1.0),
]

def U(id, name, cat, chassis, move, speed, hp, armor, vision, size, weapons, scrap, power, comp, build, desc):
    return {"id": id, "name": name, "category": cat, "chassis": chassis, "movementClass": move,
            "speed": speed, "hp": hp, "armor": armor, "vision": vision, "size": size,
            "weapons": weapons, "cost": {"scrap": scrap, "power": power, "components": comp},
            "buildTime": build, "description": desc}

units = [
    # recon / light
    U("scout_buggy","Scout Buggy","recon","Scout","ground",7.0,60,"Light",10,0.4,["w_scout_gun"],80,0,0,8,"Fast vision unit. Cheap, fragile."),
    U("vespid_scout","Vespid Scout","recon","Vespid","ground",8.5,70,"Light",11,0.4,["w_scout_gun"],120,0,0,10,"Fast mech with strong vision and a disengagement advantage."),
    U("combat_drone","Combat Drone","recon","Scout","air",7.5,45,"Light",8,0.35,["w_scout_gun"],90,0,0,8,"Low-cost harassment and screening platform."),
    U("radar_scout","Radar Scout","recon","Scout","ground",6.0,55,"Light",13,0.4,["w_scout_gun"],110,0,0,10,"Detects distant movement. Weak in direct combat."),
    U("salvage_team","Salvage Team","recon","Scrapjack","ground",5.0,50,"Unarmored",7,0.35,[],60,0,0,6,"Infantry-scale salvage team (no weapon in prototype data; recovery is milestone 02)."),
    U("repair_scout","Repair Scout","recon","Scout","ground",6.5,55,"Light",8,0.4,["w_scout_gun"],100,0,0,9,"Light scout with repair tools (repair is milestone 02)."),
    U("sensor_drone","Sensor Drone","recon","Scout","air",7.0,40,"Light",12,0.3,[],80,0,0,8,"Unarmed sensor platform with wide vision."),
    U("ew_skirmisher","EW Skirmisher","recon","Vespid","ground",7.5,60,"Light",9,0.4,["w_ew"],130,0,1,12,"Disrupts targeting and sensors at range."),
    U("fast_raider","Fast Raider","recon","Lancer","ground",9.0,65,"Light",8,0.4,["w_autocannon"],140,0,0,11,"Fast anti-structure raider."),
    U("decoy_drone","Decoy Drone","recon","Scout","air",8.0,30,"Light",7,0.3,[],50,0,0,5,"Disposable decoy. Draws fire, deals none."),
    # main battle
    U("medium_tank","Medium Tank","main_battle","Bulwark","ground",4.5,220,"Medium",7,0.6,["w_heavy_cannon"],300,0,0,20,"Reliable frontline unit."),
    U("heavy_tank","Heavy Tank","main_battle","Bulwark","ground",3.5,380,"Heavy",7,0.7,["w_heavy_cannon"],520,0,1,30,"High durability, strong direct fire, slow."),
    U("bulwark_mech","Bulwark Mech","main_battle","Bulwark","ground",4.0,320,"Heavy",7,0.65,["w_heavy_cannon"],460,0,1,28,"Frontline armored mech that shields support units."),
    U("lancer_mech","Lancer Mech","main_battle","Lancer","ground",6.0,200,"Medium",8,0.55,["w_autocannon","w_melee"],380,0,1,24,"Mobile assault platform for flanking and pursuit."),
    # artillery / siege
    U("siege_cannon","Siege Cannon","artillery","Longshot","ground",3.0,180,"Medium",8,0.6,["w_siege_cannon"],600,1,1,35,"Long-range bombardment against static defenses."),
    U("longshot_mech","Longshot Artillery Mech","artillery","Longshot","ground",3.5,210,"Medium",9,0.6,["w_siege_cannon"],700,1,2,40,"Slow, expensive, long-range mech. Needs spotters."),
    U("rocket_battery","Rocket Battery","artillery","Longshot","ground",4.0,170,"Medium",8,0.6,["w_rocket_artillery"],520,1,1,32,"Area saturation and formation disruption."),
    U("breach_walker","Breach Walker","artillery","Rampart","ground",3.5,300,"Heavy",7,0.7,["w_siege_cannon"],650,1,1,38,"Shorter-range siege platform built to survive return fire."),
    U("mortar_carrier","Mortar Carrier","artillery","Scout","ground",5.0,140,"Light",8,0.55,["w_mortar"],320,0,0,22,"Mobile indirect fire over obstacles."),
    U("heavy_railgun","Heavy Railgun Platform","artillery","Longshot","ground",3.0,230,"Heavy",10,0.7,["w_railgun"],800,2,2,45,"Long-range precision siege platform."),
    U("rocket_artillery_mech","Rocket Artillery Mech","artillery","Longshot","ground",4.5,190,"Medium",8,0.6,["w_rocket_artillery"],580,1,1,34,"Mech-mounted rocket artillery."),
    U("siege_engineer","Siege Engineer","artillery","Scrapjack","ground",4.5,120,"Medium",7,0.5,["w_mortar"],280,0,0,20,"Engineer vehicle for siege support."),
    U("demolition_crawler","Demolition Crawler","artillery","Rampart","ground",3.5,260,"Heavy",6,0.65,["w_melee"],420,0,1,26,"Anti-bunker demolition crawler."),
    U("experimental_artillery","Experimental Artillery","artillery","Longshot","ground",2.5,280,"Heavy",11,0.8,["w_railgun"],1100,3,3,60,"Extremely expensive siege platform."),
    # anti-air / air
    U("interceptor_drone","Interceptor Drone","anti_air","Vespid","air",10.0,60,"Light",9,0.35,["w_interceptor_gun"],150,0,0,12,"Fast response against aircraft and flying drones."),
    U("flak_tank","Flak Tank","anti_air","Bulwark","ground",4.5,200,"Medium",8,0.6,["w_aa_cannon"],340,0,0,22,"Area defense against light aircraft."),
    U("missile_carrier","Missile Carrier","anti_air","Scout","ground",5.0,170,"Medium",9,0.55,["w_aa_missile"],400,0,1,26,"Mobile long-range anti-air platform."),
    U("gunship","Gunship","anti_air","Lancer","air",8.0,180,"Medium",8,0.55,["w_autocannon"],420,0,1,26,"Close-support aircraft vs lightly armored targets."),
    U("strike_bomber","Strike Bomber","anti_air","Lancer","air",7.5,220,"Medium",7,0.6,["w_bomb"],560,0,1,30,"High damage vs static structures and heavy targets."),
    U("transport_aircraft","Transport Aircraft","anti_air","Scout","air",8.5,200,"Light",8,0.6,[],380,0,0,24,"Moves eligible units between landing zones (transport is milestone 02)."),
    U("drone_carrier","Drone Carrier","anti_air","Warden","air",6.0,320,"Heavy",9,0.8,["w_aa_cannon"],700,1,2,40,"Deploys and supports small aircraft."),
    U("recon_aircraft","Recon Aircraft","anti_air","Vespid","air",11.0,70,"Light",13,0.4,[],180,0,0,14,"Broad vision, minimal offense."),
    # support / engineering
    U("construction_vehicle","Construction Vehicle","support","Scrapjack","ground",4.5,160,"Medium",7,0.55,[],240,0,0,18,"Builds structures (construction is milestone 02)."),
    U("field_repair_mech","Field Repair Mech","support","Scrapjack","ground",5.0,170,"Medium",7,0.55,["w_scout_gun"],260,0,0,18,"Restores allied health and armor (repair is milestone 02)."),
    U("recovery_crawler","Recovery Crawler","support","Scrapjack","ground",4.5,150,"Medium",7,0.55,[],220,0,0,16,"Collects salvage from wrecks (salvage is milestone 02)."),
    U("supply_carrier","Supply Carrier","support","Scout","ground",5.5,140,"Light",7,0.5,[],200,0,0,15,"Transports resources and support supplies."),
    U("shield_projector","Shield Projector","support","Warden","ground",4.0,190,"Medium",7,0.6,["w_ew"],360,1,1,24,"Protects nearby units with a limited defensive field."),
    U("ew_mech","Electronic Warfare Mech","support","Vespid","ground",6.0,150,"Light",10,0.5,["w_ew"],340,0,1,22,"Disrupts radar, targeting, and autonomous systems."),
    U("command_walker","Command Walker","support","Warden","ground",4.5,260,"Heavy",9,0.65,["w_autocannon"],480,1,1,28,"Tactical support bonuses within a radius (bonuses are milestone 02)."),
    U("bridge_layer","Bridge Layer","support","Scrapjack","ground",4.0,180,"Medium",7,0.55,[],300,0,0,20,"Creates temporary crossings (milestone 02)."),
    U("combat_engineer","Combat Engineer","support","Scrapjack","ground",5.0,110,"Light",7,0.45,["w_scout_gun"],180,0,0,14,"Constructs temporary defenses and demolition objectives."),
    # experimental / super-heavy
    U("rampart_fortress","Rampart Siege Fortress","experimental","Rampart","ground",2.0,900,"Fortified",8,1.1,["w_siege_cannon","w_autocannon"],1800,3,4,90,"Heavily armored walking platform with multiple mounts."),
    U("titan_breaker","Titan Breaker","experimental","Bulwark","ground",3.0,700,"Heavy",8,0.9,["w_heavy_cannon","w_railgun"],1500,2,3,80,"Specialized anti-heavy-mech platform."),
    U("storm_lance","Storm Lance","experimental","Lancer","ground",7.5,320,"Medium",9,0.6,["w_light_railgun"],900,1,2,50,"High-speed experimental assault mech."),
    U("warden_platform","Warden Platform","experimental","Warden","ground",3.5,650,"Heavy",10,0.95,["w_plasma_laser","w_aa_missile"],1400,2,3,75,"Autonomous heavy combat system."),
    U("mobile_foundry","Mobile Foundry","experimental","Scrapjack","ground",2.5,500,"Heavy",7,0.9,[],1200,2,2,70,"Slow production vehicle (production is milestone 02)."),
    U("colossus_engine","Colossus Artillery Engine","experimental","Rampart","ground",1.8,1000,"Fortified",9,1.2,["w_siege_cannon","w_rocket_artillery"],2200,4,5,110,"Extremely expensive siege platform."),
    U("command_carrier","Command Carrier","experimental","Warden","ground",3.0,600,"Heavy",9,0.95,["w_autocannon"],1300,2,2,70,"Mobile command infrastructure."),
    U("drone_swarm","Strategic Drone Swarm","experimental","Vespid","air",8.5,140,"Light",9,0.5,["w_interceptor_gun"],500,1,1,35,"Coordinated disposable units with limited endurance."),
    # Wave MECHS-12H (2026-11-01): 8 expansion chassis brought into the
    # catalog, all power 0 / components 0 so the Prototype 03 producible
    # filter admits them. Single-weapon rows only; weapons are existing
    # catalog family rows (w_*), no new weapon rows. Chassis uses the
    # catalog chassis vocabulary: expansion bulwark -> Bulwark,
    # vespid -> Vespid, longshot -> Longshot, striker -> Lancer
    # (mobile assault). Each description names its counter unit type;
    # counters were verified by scripted duels in scripts/mechs12h-match.js.
    U("bastion","Bastion","main_battle","Bulwark","ground",3.8,340,"Heavy",7,0.65,["w_heavy_cannon"],480,0,0,28,"Heavy frontline anchor. Holds ground against direct fire. Counter: Demolition Crawler, whose close melee out-damages its cannon cycle."),
    U("gatekeeper","Gatekeeper","main_battle","Bulwark","ground",4.2,240,"Medium",8,0.6,["w_laser"],380,0,0,24,"Laser skirmisher that engages ground and air targets alike. Counter: Heavy Tank, whose armour absorbs laser fire while its cannon wins the exchange."),
    U("deadeye","Deadeye","artillery","Longshot","ground",4.0,190,"Medium",10,0.6,["w_light_railgun"],460,0,0,26,"Precision fire support. Long reach, blind inside 3 tiles and blind to aircraft. Counter: Medium Tank, which out-trades its railgun at direct-fire range. (Fast Raider was the first counter guess and FAILED duels 0/6: a raider stops at autocannon range and loses the gun trade, so the claim was rewritten to the verified counter.)"),
    U("mortarjack","Mortarjack","artillery","Longshot","ground",4.5,150,"Light",8,0.55,["w_mortar"],340,0,0,22,"Mobile indirect fire over obstacles. Counter: Lancer Mech, which closes the gap and out-damages it at close range."),
    U("needlewing","Needlewing","recon","Vespid","ground",9.0,80,"Light",11,0.4,["w_scout_gun"],140,0,0,10,"Fast scout-striker with strong vision. Counter: Medium Tank, whose cannon removes it in a few hits."),
    U("longsight","Longsight","recon","Vespid","ground",8.0,60,"Light",13,0.4,["w_scout_gun"],140,0,0,10,"Long-vision spotter for fire support. Fragile in any direct fight. Counter: Fast Raider, which runs it down before it can escape."),
    U("javelin","Javelin","main_battle","Lancer","ground",6.5,180,"Medium",8,0.55,["w_autocannon"],320,0,0,22,"Mobile assault mech for flanking and pursuit. Counter: Heavy Tank, which it cannot crack before its cannon answers."),
    U("raptor","Raptor","main_battle","Lancer","ground",7.5,170,"Medium",8,0.55,["w_melee"],300,0,0,20,"Close assault mech built to tear into targets at melee range. Counter: Lancer Mech, which matches it in melee and adds autocannon fire on top."),
]

chassis = [
    {"id":"Scout","role":"Recon and harassment","strength":"Speed and vision","weakness":"Fragile","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Lancer","role":"Mobile assault","strength":"Flanking and pursuit","weakness":"Limited sustained defense","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Bulwark","role":"Frontline defense","strength":"Armor and protection","weakness":"Slow","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Longshot","role":"Artillery","strength":"Extreme range","weakness":"Vulnerable up close","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Rampart","role":"Heavy siege","strength":"Durability and structure damage","weakness":"High cost","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Vespid","role":"Fast skirmishing","strength":"Evasion and rapid movement","weakness":"Low durability","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Scrapjack","role":"Modular generalist","strength":"Salvage-based adaptability","weakness":"Lower specialized performance","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
    {"id":"Warden","role":"Autonomous heavy","strength":"Reliable targeting and coordination","weakness":"Vulnerable to disruption","slots":["primary","secondary","armor","mobility","reactor","sensor","ability"]},
]

core = ["scout_buggy","vespid_scout","combat_drone","medium_tank","heavy_tank","bulwark_mech","lancer_mech",
        "siege_cannon","longshot_mech","rocket_battery","flak_tank","interceptor_drone","missile_carrier",
        "construction_vehicle","field_repair_mech","recovery_crawler","combat_engineer"]
factions = [
    {"id":"iron_eden","name":"Iron Eden","doctrine":"Heavy industry, armor, siege warfare. Durable machines, defensive positions, overwhelming firepower.","strength":"Strong frontal armor and dependable long-range fire.","weakness":"Expensive units and slow repositioning.","color":"#3a86ff","signatureUnit":"longshot_mech",
     "roster": sorted(set(core + ["breach_walker","heavy_railgun","rampart_fortress","titan_breaker","colossus_engine","mortar_carrier","bastion","gatekeeper","deadeye","mortarjack"]))},
    {"id":"xandria","name":"Xandria","doctrine":"Mobility, reconnaissance, precision strikes. Find weaknesses, control movement, destroy vulnerable targets first.","strength":"Strong reconnaissance and flanking potential.","weakness":"Lower durability and weaker static defenses.","color":"#e63946","signatureUnit":"vespid_scout",
     "roster": sorted(set(core + ["radar_scout","sensor_drone","fast_raider","storm_lance","gunship","recon_aircraft","ew_mech","needlewing","longsight","javelin","raptor"]))},
    {"id":"salvage_clans","name":"The Salvage Clans","doctrine":"Improvisation, wreck recovery, swarm tactics. Turn every battlefield into a resource pool.","strength":"Better salvage recovery and field repairs.","weakness":"Less reliable armor, lower baseline accuracy, weaker high-end technology.","color":"#f4a261","signatureUnit":"recovery_crawler",
     "roster": sorted(set(core + ["salvage_team","repair_scout","supply_carrier","demolition_crawler","drone_swarm","mobile_foundry","shield_projector"]))},
    {"id":"directorate","name":"The Directorate","doctrine":"Automation, production efficiency, networked warfare. Coordinated machines, reliable production.","strength":"Efficient production and coordinated weapon systems.","weakness":"Vulnerable to disruption, infrastructure loss, and countermeasures.","color":"#9b5de5","signatureUnit":"warden_platform",
     "roster": sorted(set(core + ["ew_skirmisher","decoy_drone","drone_carrier","strike_bomber","transport_aircraft","warden_platform","command_carrier","command_walker","bridge_layer","experimental_artillery","rocket_artillery_mech","siege_engineer"]))},
]

def S(id, name, footprint, hp, armor, scrap, power, comp, desc):
    return {"id": id, "name": name, "footprint": footprint, "hp": hp, "armor": armor,
            "cost": {"scrap": scrap, "power": power, "components": comp}, "description": desc}
structures = [
    S("command_core","Command Core",2,800,"Fortified",0,0,0,"Faction command structure. Losing it is elimination in Prototype 01."),
    S("scrap_extractor","Scrap Extractor",1,220,"Structure",200,0,0,"Extracts scrap from resource points (milestone 02)."),
    S("power_plant","Power Plant",1,260,"Structure",250,0,0,"Generates power capacity (milestone 02)."),
    S("advanced_reactor","Advanced Reactor",1,320,"Structure",500,0,1,"Advanced power generation (milestone 02)."),
    S("light_factory","Light-Unit Factory",2,400,"Structure",400,1,0,"Produces light units (milestone 02)."),
    S("vehicle_factory","Vehicle Factory",2,450,"Structure",500,1,0,"Produces vehicles (milestone 02)."),
    S("mech_bay","Mech Assembly Bay",2,500,"Structure",600,1,1,"Produces mechs (milestone 02)."),
    S("aircraft_hangar","Aircraft Hangar",2,450,"Structure",550,1,1,"Produces aircraft (milestone 02)."),
    S("heavy_plant","Heavy Industry Plant",3,650,"Structure",900,2,2,"Produces heavy and experimental units (milestone 02)."),
    S("research_lab","Research Laboratory",1,300,"Structure",450,1,1,"Research (milestone 02)."),
    S("salvage_processor","Salvage Processor",1,280,"Structure",350,0,0,"Processes wrecks into resources (milestone 02)."),
    S("repair_depot","Repair Depot",1,280,"Structure",300,0,0,"Repairs nearby units (milestone 02)."),
    S("radar_station","Radar Station",1,200,"Structure",280,1,0,"Detection (milestone 02)."),
    S("ammo_depot","Ammunition Depot",1,200,"Structure",200,0,0,"Logistics (milestone 02)."),
    S("logistics_hub","Logistics Hub",1,240,"Structure",320,0,0,"Logistics (milestone 02)."),
    S("experimental_facility","Experimental Assembly Facility",2,550,"Structure",1000,2,3,"Experimental production (milestone 02)."),
    S("light_turret","Light Turret",1,180,"Structure",150,0,0,"Light defensive turret (milestone 02)."),
    S("heavy_turret","Heavy Cannon Turret",1,320,"Structure",350,1,0,"Heavy defensive turret (milestone 02)."),
    S("aa_turret","Anti-Air Turret",1,240,"Structure",300,0,0,"Anti-air defensive turret (milestone 02)."),
    S("missile_turret","Missile Turret",1,280,"Structure",380,0,1,"Missile defensive turret (milestone 02)."),
    S("bunker","Bunker",1,300,"Fortified",250,0,0,"Fortified infantry position (milestone 02)."),
    S("wall","Wall Segment",1,200,"Fortified",80,0,0,"Blocks movement and fire lanes (milestone 02)."),
    S("shield_generator","Shield Generator",1,260,"Structure",420,1,1,"Defensive field generator (milestone 02)."),
]

armor_matrix = {
    "Kinetic":    {"Unarmored":1.20,"Light":1.00,"Medium":0.90,"Heavy":0.70,"Fortified":0.50,"Structure":0.80},
    "Explosive":  {"Unarmored":1.10,"Light":1.10,"Medium":1.00,"Heavy":0.80,"Fortified":0.60,"Structure":1.20},
    "Energy":     {"Unarmored":1.00,"Light":1.00,"Medium":1.00,"Heavy":0.90,"Fortified":0.70,"Structure":0.90},
    "Thermal":    {"Unarmored":1.20,"Light":1.10,"Medium":0.90,"Heavy":0.80,"Fortified":0.60,"Structure":0.70},
    "Siege":      {"Unarmored":1.00,"Light":0.90,"Medium":1.00,"Heavy":1.10,"Fortified":1.30,"Structure":1.40},
    "Disruption": {"Unarmored":1.00,"Light":1.00,"Medium":1.00,"Heavy":1.00,"Fortified":1.00,"Structure":0.50},
}

catalog = {
    "version": "prototype01",
    "note": "Data catalog only. Units/structures marked milestone 02 in their description have no gameplay system in Prototype 01; their data is validated, not simulated.",
    "armorClasses": ["Unarmored","Light","Medium","Heavy","Fortified","Structure"],
    "damageTypes": ["Kinetic","Explosive","Energy","Thermal","Siege","Disruption"],
    "armorMatrix": armor_matrix,
    "weaponFamilies": ["Autocannon","Heavy Cannon","Missile Launcher","Rocket Artillery","Railgun","Mortar","Flamethrower","Anti-air Cannon","Laser","Siege Cannon","Melee Weapon","Electronic Warfare"],
    "weapons": weapons,
    "units": units,
    "chassis": chassis,
    "factions": factions,
    "structures": structures,
    "terrain": [
        {"id":"grass","name":"Open wasteland / grass","movementCost":{"ground":1,"hover":1,"air":1},"blocksMovement":{"ground":False,"hover":False,"air":False},"blocksLOS":False},
        {"id":"dirt","name":"Broken ground","movementCost":{"ground":1,"hover":1,"air":1},"blocksMovement":{"ground":False,"hover":False,"air":False},"blocksLOS":False},
        {"id":"bridge","name":"Bridge","movementCost":{"ground":1,"hover":1,"air":1},"blocksMovement":{"ground":False,"hover":False,"air":False},"blocksLOS":False},
        {"id":"forest","name":"Overgrown ruins / forest","movementCost":{"ground":2,"hover":1,"air":1},"blocksMovement":{"ground":False,"hover":False,"air":False},"blocksLOS":False},
        {"id":"water","name":"River / water","movementCost":{"ground":None,"hover":1,"air":1},"blocksMovement":{"ground":True,"hover":False,"air":False},"blocksLOS":False},
        {"id":"rock","name":"Cliff / rock","movementCost":{"ground":None,"hover":None,"air":1},"blocksMovement":{"ground":True,"hover":True,"air":False},"blocksLOS":True},
    ],
}
OUT.write_text(json.dumps(catalog, indent=2) + "\n")
print(f"wrote {OUT}: {len(units)} units, {len(weapons)} weapons, {len(factions)} factions, {len(structures)} structures")
