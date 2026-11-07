#!/usr/bin/env python3
"""Beta wave 3 — competent browser match driver (Playwright, real input only).

Drives the REAL game at game/index.html over a local http server:
menu clicks, canvas taps (tile -> screen via the minimap-centre camera
formula), tray/panel button clicks, WASD + mouse twin-stick hero driving.
No game file is edited; no DOM state is forged — the driver only reads
#status / panels / buttons and clicks what a player can click.

Competent loop (mirrors the sim competent style, UI edition):
  - hero phase: Drop Back In, drive east with aim + held fire, release
  - attack cycle every ~2 s: Select All -> Attack-Move -> tap red core
  - production every ~10 cycles: tap own core, queue cheapest affordable
    unit while the queue holds fewer than 3 items
  - salvage window every ~15 cycles: Select All -> Salvage -> tap one
    rotating mid-map corridor tile, then 5 attack-free cycles so the
    salvage trip is not immediately cancelled by a re-attack
A run ends when #victory-panel appears (title + stats read from the
REAL panel) or the timeout expires.

Usage:
  python3 scripts/beta-wave3-driver.py competent --map first --diff normal
      --hero on --timeout 420 --shots game/beta-wave3 --tag first-normal
  python3 scripts/beta-wave3-driver.py herodeath --shots game/beta-wave3
  python3 scripts/beta-wave3-driver.py hprefresh --shots game/beta-wave3
Run from ~/workspace/surface-wars. Screenshots are named for what they
actually show (title text is read before naming, never assumed).
"""
import argparse, json, re, subprocess, sys, time, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
PORT = 8931

def parse_status(text):
    d = {}
    for key, pat in [("scrap", r"Scrap: (\d+)"), ("blue", r"Iron Eden units: (\d+)"),
                     ("red", r"Xandria units: (\d+)"), ("wrecks", r"Wrecks: (\d+)"),
                     ("tick", r"Tick: (\d+)"), ("selected", r"Selected: (\d+)"),
                     ("zoom", r"Zoom: ([\d.]+)"), ("mode", r"Mode: (\w+)")]:
        m = re.search(pat, text or "")
        if m: d[key] = m.group(1)
    return d

class Driver:
    def __init__(self, page, shots, tag):
        self.p = page; self.shots = Path(shots); self.tag = tag
        self.shots.mkdir(parents=True, exist_ok=True)
        self.cam = (0.0, 14.0); self.zoom = 1.0
        self.log = []
    def note(self, msg):
        self.log.append(msg); print(msg, flush=True)
    def status(self):
        try: return parse_status(self.p.inner_text("#status"))
        except Exception: return {}
    def shot(self, name):
        path = str(self.shots / name)
        self.p.screenshot(path=path); return path
    def panel_on(self, pid):
        try: return self.p.evaluate(f"document.getElementById('{pid}').style.display") not in ("", "none")
        except Exception: return False
    def btn_text(self, bid):
        try: return (self.p.inner_text(f"#{bid}") or "").strip()
        except Exception: return ""
    def canvas_box(self):
        b = self.p.locator("#view").bounding_box(); return b
    def centre_on(self, tx, ty, map_w=80, map_h=50):
        box = self.canvas_box(); st = self.status()
        try: self.zoom = float(st.get("zoom", 1.0))
        except Exception: pass
        vtx = box["width"] / 32.0 / self.zoom; vty = box["height"] / 32.0 / self.zoom
        self.cam = (max(0.0, min(map_w - vtx, tx - vtx / 2.0)) if map_w - vtx > 0 else 0.0,
                    max(0.0, min(map_h - vty, ty - vty / 2.0)) if map_h - vty > 0 else 0.0)
        mb = self.p.locator("#minimap").bounding_box()
        self.p.mouse.click(mb["x"] + tx / map_w * mb["width"], mb["y"] + ty / map_h * mb["height"])
        time.sleep(0.4)
    def tap_world(self, wx, wy):
        box = self.canvas_box()
        x = box["x"] + (wx - self.cam[0]) * 32.0 * self.zoom
        y = box["y"] + (wy - self.cam[1]) * 32.0 * self.zoom
        self.p.mouse.click(x, y); time.sleep(0.3)
    def tap_tile(self, tx, ty):
        self.tap_world(float(tx), float(ty))
    def click(self, selector, timeout=3000):
        # Short timeout on purpose: a 30 s default click once burned
        # ~600 ticks while a match played out unattended (wave-3 run 1).
        self.p.click(selector, timeout=timeout); time.sleep(0.3)
    def controlling(self):
        try: return self.p.evaluate("document.body.classList.contains('controlling')")
        except Exception: return False
    def start_match(self, map_name, diff, hero_on=True):
        mm = {"first": "mm-play-first", "second": "mm-play-second", "third": "mm-play-third"}[map_name]
        if diff != "normal":
            self.click(f"#mm-diff-{diff}")
        st = self.btn_text("mm-diff-status")
        self.note(f"difficulty status: {st}")
        if not hero_on:
            # Settings -> hero checkbox off -> Back -> menu. Settings from
            # main menu returns to main menu on Back.
            self.click("#mm-settings"); time.sleep(0.5)
            self.p.evaluate("document.getElementById('set-hero').click()")
            time.sleep(0.3); self.click("#set-close"); time.sleep(0.5)
        self.click(f"#{mm}"); time.sleep(1.0)
        self.cam = (0.0, 14.0); self.zoom = 1.0
        self.note(f"match started: {map_name}/{diff}/hero={'on' if hero_on else 'off'} status={self.status()}")
    def terminal(self):
        if not self.panel_on("victory-panel"): return None
        title = self.p.inner_text("#victory-title").strip()
        stats = self.p.inner_text("#victory-stats").strip()
        return {"title": title, "stats": stats}
    def close_build(self):
        # Evaluate-click: the build panel re-renders after queueing,
        # detaching the node Playwright located, so a locator click
        # times out (v3 run). A fresh getElementById each time is
        # immune; if the panel already closed this is a no-op.
        try: self.p.evaluate("document.getElementById('build-close')?.click()")
        except Exception: pass
        time.sleep(0.3)
    def production(self):
        """Tap own core, fill the build queue to 3 with the most
        expensive affordable unit (v10). Returns queued types or ''. v9: v8 queued
        only ONE unit per production call, so the core sat idle
        between calls while 1300+ scrap banked — the sim stand-in
        keeps 3 queued continuously, so the driver must too."""
        try:
            self.click("#btn-move")
            self.centre_on(6, 25); self.tap_tile(6, 25); time.sleep(0.6)
            if not self.panel_on("build-panel"):
                self.note("production: build panel did not open after core tap"); return ""
            queued = []
            for _ in range(3):
                info = self.p.evaluate("""() => {
                    const bp = document.getElementById('build-panel');
                    const btns = [...bp.querySelectorAll('.build-btn')].map(b => ({
                        type: b.getAttribute('data-type'), disabled: b.disabled, text: b.textContent }));
                    return { queue: (bp.textContent.match(/Cancel \\(refund/g) || []).length, btns };
                }""")
                if info["queue"] >= 3: break
                afford = []
                for b in info["btns"]:
                    m = re.search(r"(\d+) scrap", b["text"])
                    if not b["disabled"] and m: afford.append((int(m.group(1)), b["type"]))
                if not afford: break
                # v10b: MOST expensive affordable among GROUND-CAPABLE
                # types. v10's unfiltered pick bought a flak_tank
                # (340, AA-only) + interceptor_drone (150, air-only)
                # — neither can hit a ground army. Blocklist from
                # catalog targetClasses: air-only (flak_tank,
                # interceptor_drone, missile_carrier, drone_carrier,
                # drone_swarm) and weaponless support (salvage_team,
                # sensor_drone, decoy_drone, transport_aircraft,
                # recon_aircraft, construction_vehicle,
                # recovery_crawler, supply_carrier, bridge_layer,
                # mobile_foundry). Fall back to cheapest overall if
                # the filtered list is empty.
                BLOCKED = {"flak_tank", "interceptor_drone", "missile_carrier", "drone_carrier", "drone_swarm",
                           "salvage_team", "sensor_drone", "decoy_drone", "transport_aircraft", "recon_aircraft",
                           "construction_vehicle", "recovery_crawler", "supply_carrier", "bridge_layer", "mobile_foundry"}
                ground = [a for a in afford if a[1] not in BLOCKED]
                pool = ground if ground else afford
                pool.sort(reverse=True); cost, typ = pool[0]
                # Evaluate-click, not a locator click: the build
                # panel re-renders (queue progress) and detaches
                # its buttons mid-click, which burned a 30 s
                # locator timeout in v4.
                self.p.evaluate(f"document.querySelector(\".build-btn[data-type='{typ}']\")?.click()")
                time.sleep(0.4)
                queued.append(f"{typ} ({cost})")
            self.close_build()
            return ", ".join(queued)
        except Exception as e:
            self.note(f"production: error {e}"); return ""
    def attack_cycle(self):
        # v8: tap EMPTY ground (71,23), NOT the red core (73,25).
        # game.js orderSelected converts ANY tap on an enemy entity
        # into an 'attack' order on that entity, regardless of tray
        # mode — and sim.js gives 'attack' units NO auto-acquire
        # (line 1386 covers hold/attackMove/patrol/guard only), so
        # v1-v7 armies beelined the core taking unanswered fire
        # instead of fighting en route. (71,23) is empty on First
        # Map: core hit radius is 1.2 + 1.0 = 2.2, and (71,23) is
        # 2.83 from the core, 2.24 from the nearest red spawn
        # (longshot at (70,25)) — so this tap is a true attackMove
        # (formation order for the group), engaging en route like
        # the sim stand-in. Same cores on all three maps.
        if self.terminal(): raise RuntimeError("terminal")
        self.click("#btn-all"); self.click("#btn-attackmove")
        self.centre_on(71, 23); self.tap_tile(71, 23)
    def salvage_cycle(self, px):
        if self.terminal(): raise RuntimeError("terminal")
        self.click("#btn-all"); self.click("#btn-salvage")
        self.centre_on(px, 25); self.tap_tile(px, 25)
    def salvage_hunt(self):
        """Panel-confirmed wreck hunt (v7). Blind corridor taps gained
        0 scrap in v5/v6: a tap only salvages when a wreck is within
        1.2 tiles, and the driver cannot see wrecks from #status.
        So: select all, set salvage mode, walk a battle-line grid;
        a tap that opens a 'Wreck:' info panel proves a wreck is
        under the tap, and the tap itself already ordered the
        salvage. Scrap delta proves collection. Returns gain."""
        grid = [(40, 24), (41, 24), (42, 24), (40, 25), (41, 25), (42, 25), (40, 26), (41, 26), (42, 26),
                (44, 25), (46, 25), (48, 25), (50, 25), (52, 25), (54, 25), (56, 25), (58, 25), (60, 25),
                (62, 25), (64, 25), (66, 25), (68, 25), (70, 25), (36, 25), (34, 25), (32, 25), (30, 25)]
        before = int(self.status().get("scrap") or 0)
        self.click("#btn-all"); self.click("#btn-salvage")
        for (tx, ty) in grid:
            if self.terminal(): break
            box = self.canvas_box()
            vtx = box["width"] / 32.0 / self.zoom; vty = box["height"] / 32.0 / self.zoom
            if not (self.cam[0] <= tx <= self.cam[0] + vtx and self.cam[1] <= ty <= self.cam[1] + vty):
                self.centre_on(tx, ty)
            self.tap_tile(tx, ty); time.sleep(0.5)
            if not self.panel_on("info-panel"): continue
            try: txt = self.p.inner_text("#info-panel")
            except Exception: continue
            if "Wreck:" not in txt:
                try: self.p.evaluate("document.getElementById('info-close')?.click()")
                except Exception: pass
                time.sleep(0.2); continue
            self.note(f"salvage hunt: wreck panel at ({tx},{ty}): {txt.splitlines()[0] if txt else ''}")
            try: self.p.evaluate("document.getElementById('info-salvage')?.click()")
            except Exception: pass
            for _ in range(6):
                time.sleep(2.0)
                if self.terminal(): break
                now = int(self.status().get("scrap") or 0)
                if now > before:
                    self.note(f"salvage hunt: collected at ({tx},{ty}), scrap {before} -> {now}")
                    return now - before
            before = int(self.status().get("scrap") or 0)
        return 0
    def hero_drive(self, seconds):
        """Drop, drive east firing, release. Death-aware: if the hero
        dies mid-drive the control strip vanishes, so the release
        click is skipped (clicking a hidden button burned 30 s in
        wave-3 run 1). Returns dict of observations."""
        obs = {}
        try:
            if self.terminal(): raise RuntimeError("terminal")
            self.click("#btn-drop-back"); time.sleep(0.5)
            obs["drop_feedback"] = self.p.inner_text("#feedback").strip()
            ok = False
            for _ in range(20):
                if self.controlling(): ok = True; break
                time.sleep(0.3)
            obs["controlling"] = ok
            if not ok: return obs
            box = self.canvas_box()
            self.p.mouse.move(box["x"] + box["width"] / 2 + 160, box["y"] + box["height"] / 2)
            self.p.mouse.down(); self.p.keyboard.down("d")
            t0 = time.time(); hps = []; died = False
            while time.time() - t0 < seconds:
                if not self.controlling(): died = True; break
                try: hps.append(self.p.inner_text("#ctl-hp").strip())
                except Exception: pass
                time.sleep(2.0)
            obs["strip_samples"] = hps; obs["died_mid_drive"] = died
            try: self.p.mouse.up()
            except Exception: pass
            try: self.p.keyboard.up("d")
            except Exception: pass
            time.sleep(0.3)
            if self.controlling():
                self.click("#btn-release-control"); time.sleep(0.6)
                obs["drop_after_release"] = self.btn_text("btn-drop-back")
                obs["release_feedback"] = self.p.inner_text("#feedback").strip()
            else:
                obs["drop_after_release"] = self.btn_text("btn-drop-back")
                obs["release_feedback"] = self.p.inner_text("#feedback").strip()
            return obs
        except Exception as e:
            obs["error"] = str(e); return obs

def run_competent(args):
    from playwright.sync_api import sync_playwright
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=str(ROOT),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    result = {"tag": args.tag, "map": args.map, "diff": args.diff, "hero": args.hero}
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            pg = b.new_page(viewport={"width": 1280, "height": 800})
            errs = []; notfound = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            def _resp(r):
                try:
                    if r.status == 404 and r.url not in notfound: notfound.append(r.url)
                except Exception: pass
            pg.on("response", _resp)
            pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
            d = Driver(pg, args.shots, args.tag)
            d.shot(f"{args.tag}-menu.png")
            d.start_match(args.map, args.diff, hero_on=(args.hero == "on"))
            # Army FIRST (wave-3 run 1 lesson): a 20 s hero phase with
            # an idle army let the red AI overrun the base (9 -> 1
            # blue units by tick 1134, scrap still 500 unspent).
            d.attack_cycle()
            q0 = d.production()
            d.note(f"opening: attack issued, queued {q0}, status={d.status()}")
            drives = 0; hero_phases = []
            if args.hero == "on":
                # First drop deferred to cycle 4 (army engaged): a
                # match-start drop drove the hero alone into the red
                # army and it died twice (v2 run: defeat, 1571 ticks).
                pass
            corridor = [41, 55, 68, 50, 60]
            t0 = time.time(); cycle = 0; salv_windows = []; just_salvaged = False; need_attack_refresh = False
            while time.time() - t0 < args.timeout:
                if d.terminal(): break
                try:
                    if cycle % 4 == 2:
                        # v8: NO army salvage hunt. v7 hunts gained 0
                        # scrap AND cost matches (blue 7 -> 1 / 9 -> 3
                        # during the hunt, orders replaced by holds).
                        # Salvage in v8 comes from hero drives (the
                        # controlled hero auto-collects wrecks it
                        # passes; v5 hero income was ~275 scrap).
                        d.note(f"cycle {cycle}: no hunt (v8); status={d.status()}")
                        just_salvaged = False
                    else:
                        # v11: attack-move EVERY cycle. The v4
                        # refresh-only rule rested on v2/v3's early
                        # bleed — now explained by the v8 finding
                        # (core taps issued beeline 'attack' orders,
                        # not attackMove), so the v4 objection is
                        # obsolete. Per-cycle refresh matches the sim
                        # stand-in's 40-tick idle-tasking: fresh
                        # spawns get orders within ~1 cycle instead
                        # of sitting idle at the core for minutes
                        # while red pushes the base, and arrived
                        # units re-engage instead of holding.
                        d.attack_cycle(); just_salvaged = False; need_attack_refresh = False
                        if cycle % 2 == 1:
                            q = d.production()
                            if q:
                                d.note(f"cycle {cycle}: queued {q}")
                                # Fresh spawns arrive with no order; the
                                # sim stand-in tasks idle units every
                                # 40 ticks, so refresh attack next cycle.
                                need_attack_refresh = True
                        if args.hero == "on" and drives < 12 and d.btn_text("btn-drop-back") == "Drop Back In" and cycle >= 3:
                            # v9: 12 s drives. v8's 8 s drives never
                            # took damage (200 flat x4): from the blue
                            # core at speed 6, 8 s reaches only x~56,
                            # short of the late fight. 12 s reaches
                            # the fight; v2's 10 s -> 157 HP bounds
                            # the risk, and the army is engaged.
                            obs = d.hero_drive(12); drives += 1; hero_phases.append(obs)
                            d.note(f"hero phase {drives}: {json.dumps(obs)}")
                            if drives == 1 and not d.terminal(): d.shot(f"{args.tag}-hero-driving.png")
                except RuntimeError:
                    break
                except Exception as e:
                    d.note(f"cycle {cycle}: action error (terminal? {bool(d.terminal())}): {e}")
                    if d.terminal(): break
                cycle += 1
                if cycle % 10 == 0:
                    d.note(f"cycle {cycle}: status={d.status()}")
                time.sleep(2.0)
            result["hero_phases"] = hero_phases
            term = d.terminal()
            result["cycles"] = cycle; result["terminal"] = term
            if term and term["title"].startswith("Victory") and args.arc:
                try:
                    d.click("#vic-menu"); time.sleep(1.0)
                    menu_status = d.btn_text("mm-hero-status")
                    d.note(f"arc: menu after win: {menu_status}")
                    d.click("#mm-loadout"); time.sleep(1.0)
                    skills_before = pg.inner_text("#lo-skills").strip()
                    d.note(f"arc: loadout skills before spend: {skills_before!r}")
                    pg.evaluate("""() => {
                        const btns = [...document.querySelectorAll('#lo-skills button')];
                        const dash = btns.find(b => b.textContent.includes('Dash'));
                        if (dash) dash.click();
                    }""")
                    time.sleep(0.8)
                    skills_after = pg.inner_text("#lo-skills").strip()
                    d.note(f"arc: loadout skills after spend: {skills_after!r}")
                    d.click("#lo-save"); time.sleep(0.8)
                    d.shot(f"{args.tag}-arc-loadout-spent.png")
                    d.click("#mm-play-first"); time.sleep(1.5)
                    m2 = d.status()
                    d.note(f"arc: match 2 started: {m2}")
                    d.shot(f"{args.tag}-arc-match2-start.png")
                    result["arc"] = {"menu_after_win": menu_status, "skills_before": skills_before,
                                     "skills_after": skills_after, "match2_status": m2}
                except Exception as e:
                    d.note(f"arc: error {e}"); result["arc_error"] = str(e)
            result["final_status"] = d.status(); result["salvage_windows"] = salv_windows
            result["console_errors"] = errs[:5]; result["console_error_count"] = len(errs)
            result["notfound_urls"] = notfound
            d.note(f"404 unique urls ({len(notfound)}): {notfound}")
            (Path(args.shots) / f"{args.tag}.log").write_text("\n".join(d.log) + "\n")
            if term:
                kind = "victory" if term["title"].startswith("Victory") else "defeat" if term["title"].startswith("Defeat") else "draw"
                d.shot(f"{args.tag}-{kind}-panel.png")
                d.note(f"TERMINAL {kind}: {term}")
            else:
                d.shot(f"{args.tag}-no-terminal-timeout.png")
                d.note("no terminal panel within timeout")
            d.note(json.dumps(result, indent=1))
            (Path(args.shots) / f"{args.tag}.log").write_text("\n".join(d.log) + "\n")
            b.close()
    finally:
        srv.terminate()
    print("RESULT " + json.dumps(result))

def run_herodeath(args):
    """Isolate the hero-death wreck: fresh match, drop hero, drive east
    WITHOUT firing (mouse up), let red fire kill it, then read the
    Wrecks count delta from #status and tap the death site for the
    wreck panel value (hero wreck = 152 at full value)."""
    from playwright.sync_api import sync_playwright
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=str(ROOT),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    result = {}
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            pg = b.new_page(viewport={"width": 1280, "height": 800})
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
            d = Driver(pg, args.shots, "herodeath")
            d.start_match("first", "normal", hero_on=True)
            before = d.status(); d.note(f"before drop: {before}")
            d.click("#btn-drop-back"); time.sleep(0.5)
            for _ in range(20):
                if pg.evaluate("document.body.classList.contains('controlling')"): break
                time.sleep(0.3)
            box = d.canvas_box()
            pg.mouse.move(box["x"] + box["width"] / 2 + 160, box["y"] + box["height"] / 2)
            pg.keyboard.down("d")  # drive only, NO mouse down = no firing
            dead = None
            for _ in range(90):
                time.sleep(2.0)
                fb = pg.inner_text("#feedback").strip()
                st = d.status()
                if "Controlled unit destroyed" in fb or not pg.evaluate("document.body.classList.contains('controlling')"):
                    dead = {"feedback": fb, "status": st}; break
            pg.keyboard.up("d")
            d.note(f"hero death observation: {json.dumps(dead)}")
            result["death"] = dead
            result["wrecks_before"] = before.get("wrecks"); result["wrecks_after"] = (dead or {}).get("status", {}).get("wrecks")
            if dead:
                d.shot("herodeath-dead.png")
                # Camera stays on the death tile: tap canvas centre with
                # nothing selected -> wreck info panel (if a wreck is there).
                time.sleep(0.5)
                pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                time.sleep(0.8)
                info = pg.inner_text("#info-panel").strip() if d.panel_on("info-panel") else ""
                d.note(f"death-site info panel: {info!r}")
                result["death_site_panel"] = info
                d.shot("herodeath-wreck-panel.png")
            result["console_errors"] = errs
            d.note(json.dumps(result, indent=1))
            b.close()
    finally:
        srv.terminate()
    print("RESULT " + json.dumps(result))

def run_hprefrsh(args):
    """Isolate info-panel HP live refresh: select one tank, attack-move
    it at the red army, and read the SAME open info panel's HP at two
    times without re-tapping it."""
    from playwright.sync_api import sync_playwright
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=str(ROOT),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    result = {}
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            pg = b.new_page(viewport={"width": 1280, "height": 800})
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
            d = Driver(pg, args.shots, "hprefresh")
            d.start_match("first", "normal", hero_on=True)
            # Select one blue unit near the west base: centre west, tap
            # a spawn tile. Spawn tiles cluster around (6,25); try taps
            # until Selected: 1 shows.
            d.centre_on(10, 25)
            sel = None
            for (tx, ty) in [(8, 25), (10, 25), (6, 22), (9, 27), (12, 24)]:
                d.tap_tile(tx, ty); time.sleep(0.5)
                st = d.status()
                if st.get("selected") == "1":
                    sel = (tx, ty); break
            d.note(f"selected unit at {sel}, status={d.status()}")
            result["selected_at"] = sel
            if sel:
                info0 = pg.inner_text("#info-panel").strip() if d.panel_on("info-panel") else ""
                d.note(f"info panel t0: {info0!r}")
                d.click("#btn-attackmove"); d.centre_on(73, 25); d.tap_tile(73, 25)
                # Re-select the same unit after it moves? No: the panel
                # follows the selection; the attack order does not clear
                # it. But the panel may close if selection pruned — the
                # unit stays selected, so re-read the panel text live.
                samples = []
                for _ in range(12):
                    time.sleep(5.0)
                    txt = pg.inner_text("#info-panel").strip() if d.panel_on("info-panel") else "(panel closed)"
                    samples.append(txt)
                    if "HP:" in txt and txt != info0: break
                d.note(f"info panel samples: {samples}")
                result["info_t0"] = info0; result["info_samples"] = samples
                d.shot("hprefresh-panel.png")
            result["console_errors"] = errs
            d.note(json.dumps(result, indent=1))
            b.close()
    finally:
        srv.terminate()
    print("RESULT " + json.dumps(result))

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("competent"); c.add_argument("--map", default="first"); c.add_argument("--diff", default="normal")
    c.add_argument("--hero", default="on"); c.add_argument("--timeout", type=int, default=420)
    c.add_argument("--shots", default="game/beta-wave3"); c.add_argument("--tag", default="run")
    c.add_argument("--arc", action="store_true", help="on victory, continue in-session: menu status, spend 1 skill point, start match 2")
    h = sub.add_parser("herodeath"); h.add_argument("--shots", default="game/beta-wave3")
    r = sub.add_parser("hprefresh"); r.add_argument("--shots", default="game/beta-wave3")
    args = ap.parse_args()
    if args.cmd == "competent": run_competent(args)
    elif args.cmd == "herodeath": run_herodeath(args)
    else: run_hprefrsh(args)
