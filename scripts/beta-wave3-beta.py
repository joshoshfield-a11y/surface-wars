#!/usr/bin/env python3
"""Beta wave 3 — full beta checklist pass (Playwright, real input only).
Sections: menu+difficulty, tutorial (7 steps by doing), maps, twin-stick
desktop, hero standalone cycle, hero death->redeploy, rally/zoom/pause,
corruption, mobile viewports, touch-stick phone landscape, throw-match
defeat -> loss progression arc. No game file is edited. Screenshots are
named for what they actually show. Run from ~/workspace/surface-wars:
  python3 scripts/beta-wave3-beta.py --shots game/beta-wave3
"""
import argparse, json, re, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
PORT = 8932
SHOTS = None

def parse_status(text):
    d = {}
    for key, pat in [("scrap", r"Scrap: (\d+)"), ("blue", r"Iron Eden units: (\d+)"),
                     ("red", r"Xandria units: (\d+)"), ("wrecks", r"Wrecks: (\d+)"),
                     ("tick", r"Tick: (\d+)"), ("selected", r"Selected: (\d+)"),
                     ("zoom", r"Zoom: ([\d.]+)"), ("mode", r"Mode: (\w+)")]:
        m = re.search(pat, text or "")
        if m: d[key] = m.group(1)
    return d

class D:
    def __init__(self, page):
        self.p = page; self.cam = (0.0, 14.0); self.zoom = 1.0; self.checks = []
    def check(self, name, ok, detail=""):
        self.checks.append({"name": name, "ok": bool(ok), "detail": detail})
        print(("PASS " if ok else "FAIL ") + name + (f" :: {detail}" if detail else ""), flush=True)
    def status(self):
        try: return parse_status(self.p.inner_text("#status"))
        except Exception: return {}
    def shot(self, name):
        path = str(SHOTS / name); self.p.screenshot(path=path); return path
    def panel_on(self, pid):
        try: return self.p.evaluate(f"document.getElementById('{pid}').style.display") not in ("", "none")
        except Exception: return False
    def btn_text(self, bid):
        try: return (self.p.inner_text(f"#{bid}") or "").strip()
        except Exception: return ""
    def click(self, sel):
        self.p.click(sel); time.sleep(0.35)
    def centre_on(self, tx, ty, map_w=80, map_h=50):
        box = self.p.locator("#view").bounding_box(); st = self.status()
        try: self.zoom = float(st.get("zoom", 1.0))
        except Exception: pass
        vtx = box["width"] / 32.0 / self.zoom; vty = box["height"] / 32.0 / self.zoom
        self.cam = (max(0.0, min(map_w - vtx, tx - vtx / 2.0)) if map_w - vtx > 0 else 0.0,
                    max(0.0, min(map_h - vty, ty - vty / 2.0)) if map_h - vty > 0 else 0.0)
        mb = self.p.locator("#minimap").bounding_box()
        self.p.mouse.click(mb["x"] + tx / map_w * mb["width"], mb["y"] + ty / map_h * mb["height"])
        time.sleep(0.4)
    def tap(self, tx, ty):
        box = self.p.locator("#view").bounding_box()
        self.p.mouse.click(box["x"] + (tx - self.cam[0]) * 32.0 * self.zoom,
                           box["y"] + (ty - self.cam[1]) * 32.0 * self.zoom)
        time.sleep(0.35)
    def tut_text(self):
        try: return self.p.inner_text("#tutorial-text").strip()
        except Exception: return ""

def section_menu(d):
    d.shot("beta3-01-main-menu.png")
    d.check("menu visible", d.panel_on("main-menu"))
    seen = {}
    for lv in ["easy", "normal", "hard"]:
        d.click(f"#mm-diff-{lv}"); time.sleep(0.3)
        seen[lv] = d.btn_text("mm-diff-status")
    d.check("difficulty E/N/H status lines", all(seen[lv].startswith(f"Difficulty: {lv.capitalize()}") for lv in seen), json.dumps(seen))
    d.click("#mm-diff-normal")

def section_tutorial(d):
    d.click("#mm-tutorial"); time.sleep(1.0)
    d.check("tutorial step 1 Look", "Look" in d.tut_text(), d.tut_text())
    d.click("#btn-zoom-in"); time.sleep(0.8)
    d.check("tutorial step 2 Select (zoom advanced it)", "Select" in d.tut_text(), d.tut_text())
    d.centre_on(10, 21)
    sel = False
    for (tx, ty) in [(10, 21), (8, 22), (12, 23), (6, 25), (9, 20)]:
        d.tap(tx, ty); time.sleep(0.4)
        if d.status().get("selected") == "1": sel = True; break
    d.check("tutorial select taps a blue unit", sel, f"status={d.status()}")
    d.check("tutorial step 3 Move", "Move" in d.tut_text(), d.tut_text())
    d.centre_on(18, 22); d.tap(18, 22); time.sleep(0.8)
    d.check("tutorial step 4 Attack", "Attack" in d.tut_text(), d.tut_text())
    d.centre_on(28, 25); d.tap(28, 25); time.sleep(1.0)
    d.check("tutorial step 5 Build", "Build" in d.tut_text(), d.tut_text())
    d.centre_on(6, 25); d.tap(6, 25); time.sleep(0.7)
    ok = d.panel_on("build-panel")
    d.check("tutorial build panel opens on core tap", ok)
    if ok:
        # Click the Scout Buggy build button (panel guard: 350 ms after canvas tap — waited 700 ms).
        clicked = d.p.evaluate("""() => {
            const b = [...document.querySelectorAll('.build-btn')].find(x => x.textContent.includes('Scout Buggy'));
            if (b && !b.disabled) { b.click(); return true; } return false; }""")
        d.check("tutorial Scout Buggy queued", clicked)
        d.shot("beta3-02-tut-build-panel.png")
        for _ in range(30):
            time.sleep(1.0)
            if "Salvage" in d.tut_text(): break
        d.check("tutorial step 6 Salvage (build completed)", "Salvage" in d.tut_text(), d.tut_text())
    # Salvage step: wreck at (18,28). Select a unit first, then tap the wreck.
    d.centre_on(10, 21)
    for (tx, ty) in [(10, 21), (8, 22), (12, 23)]:
        d.tap(tx, ty); time.sleep(0.4)
        if d.status().get("selected") == "1": break
    before = d.status().get("scrap")
    d.centre_on(18, 28); d.tap(18, 28)
    # Wave-3 coordinator fix (beta harness bug, not a game bug): the
    # salvager needs ~7.8 tiles of travel, so a fixed 1.5 s wait read
    # scrap before collection (420->420). Poll up to 10 s instead.
    after = before
    for _ in range(10):
        time.sleep(1.0)
        after = d.status().get("scrap")
        if after and before and int(after) > int(before): break
    d.check("tutorial salvage gains scrap", after and before and int(after) > int(before), f"{before} -> {after}")
    d.shot("beta3-03-tut-wreck-panel.png")
    d.check("tutorial step 7 How to win", d.panel_on("tutorial-end"), d.tut_text())
    d.shot("beta3-04-tut-step6-wreck-panel.png")
    d.click("#tut-play"); time.sleep(1.0)
    d.check("tutorial Play a real game starts First Map", "First Map" in d.p.inner_text("#status"), d.status())

def section_maps(d):
    # From the real game started by the tutorial: pause menu -> switch maps.
    for name, btn, expect in [("second", "#pm-second", "Twin Bridges"), ("third", "#pm-third", "Forest Belt")]:
        d.click("#btn-pause"); time.sleep(0.6)
        d.click(btn); time.sleep(1.0)
        st = d.p.inner_text("#status")
        d.check(f"map {name} starts", expect in st, st[:120])
        d.shot(f"beta3-05-map-{name}.png")

def section_twinstick(d):
    # Fresh first map via pause menu switch.
    d.click("#btn-pause"); time.sleep(0.6); d.click("#pm-first"); time.sleep(1.0)
    d.centre_on(10, 21)
    # Wave-3 coordinator fix (beta harness bug, not a game bug): (6, 25)
    # is the Command Core tile; falling through to it made the script
    # test a structure panel for Take Control. Fail closed instead:
    # no unit selected means the check fails honestly.
    for (tx, ty) in [(10, 21), (8, 22), (12, 23)]:
        d.tap(tx, ty); time.sleep(0.4)
        if d.status().get("selected") == "1": break
    info = d.p.inner_text("#info-panel") if d.panel_on("info-panel") else ""
    has_tc = "Take Control" in info
    d.check("twin-stick info panel offers Take Control for armed unit", has_tc, info[:100])
    if has_tc:
        d.click("#info-take-control"); time.sleep(0.6)
        controlling = d.p.evaluate("document.body.classList.contains('controlling')")
        d.check("twin-stick control entered", controlling)
        # Wave-3 coordinator fix (check design, not a game bug): the
        # old east drive ('d', 3 s, mouse held = firing) drove the
        # fragile scout into red attackers and it legitimately died
        # at ~2.5 s ("Controlled unit destroyed"), which also left
        # the pause menu open after Esc and crashed the next
        # section's #btn-pause click. Drive WEST ('a') toward the
        # own core instead — control, driving, and release are what
        # this check proves, not scout survivability in enemy fire.
        box = d.p.locator("#view").bounding_box()
        d.p.mouse.move(box["x"] + box["width"] / 2 - 150, box["y"] + box["height"] / 2)
        d.p.mouse.down(); d.p.keyboard.down("a"); time.sleep(2.0)
        still = d.p.evaluate("document.body.classList.contains('controlling')")
        d.p.mouse.up(); d.p.keyboard.up("a")
        d.check("twin-stick driving holds control", still)
        d.shot("beta3-06-twinstick-driving.png")
        d.p.keyboard.press("Escape"); time.sleep(0.6)
        released = not d.p.evaluate("document.body.classList.contains('controlling')")
        sel = d.status().get("selected")
        d.check("twin-stick Esc releases, selection preserved", released and sel == "1", f"selected={sel}")
    # Structure rule: select core, no Take Control button.
    d.centre_on(6, 25); d.tap(6, 25); time.sleep(0.6)
    info2 = d.p.inner_text("#info-panel") if d.panel_on("info-panel") else ""
    d.check("structure shows no Take Control", "Take Control" not in info2, info2[:100])

def section_hero_cycle(d):
    # Guard: if an earlier section left the pause menu open, #btn-pause
    # sits behind the overlay and Playwright times out on it. Esc
    # resumes (closes the menu) in that state.
    if d.panel_on("pause-menu"):
        d.p.keyboard.press("Escape"); time.sleep(0.6)
    d.click("#btn-pause"); time.sleep(0.6); d.click("#pm-first"); time.sleep(1.0)
    loadout = d.p.evaluate("""() => {
        // Main-menu loadout summary is only on the menu; in-match we use the drop button + strip.
        return document.getElementById('btn-drop-back') ? document.getElementById('btn-drop-back').textContent : ''; }""")
    d.check("hero Drop Back In visible at match start", "Drop Back In" in loadout, loadout)
    d.click("#btn-drop-back"); time.sleep(0.6)
    for _ in range(20):
        if d.p.evaluate("document.body.classList.contains('controlling')"): break
        time.sleep(0.3)
    d.check("hero drop lands controlled", d.p.evaluate("document.body.classList.contains('controlling')"))
    # Wave-3 coordinator fix (check design, not a game bug): the old
    # east drive ('d', 4 s, firing) put the hero under concentrated
    # fire, where HP swings tens per second in bursts (probed:
    # 161 -> 128 stored across the read/release window; another run
    # 38 -> dead in 0.2 s). The panel read vs stored value then
    # disagreed through combat, not through a preservation bug —
    # the code spawns with hero.hp exactly (probed: spawn == stored,
    # stable with zero decay in a quiet drop zone). Drive WEST
    # ('a', 2 s) toward the own core instead, so the read/release
    # window is quiet and the comparison actually tests preservation.
    box = d.p.locator("#view").bounding_box()
    d.p.mouse.move(box["x"] + box["width"] / 2 - 150, box["y"] + box["height"] / 2)
    d.p.mouse.down(); d.p.keyboard.down("a"); time.sleep(2.0)
    d.p.mouse.up(); d.p.keyboard.up("a")
    # Preservation means re-drop HP == HP at release, NOT the
    # pristine 200: the drive may cost HP (an earlier competent run
    # proved 150 -> 150 across a release/re-drop). Read it before release.
    hp_rel = d.p.inner_text("#ctl-hp").strip()
    d.click("#btn-release-control"); time.sleep(0.6)
    lbl = d.btn_text("btn-drop-back")
    d.check("hero release -> 10s cooldown label", "Drop ready in 10s" in lbl or "Drop ready in 9s" in lbl, lbl)
    d.shot("beta3-07-hero-released.png")
    for _ in range(30):
        time.sleep(1.0)
        if d.btn_text("btn-drop-back") == "Drop Back In": break
    d.check("hero re-drop ready after cooldown", d.btn_text("btn-drop-back") == "Drop Back In", d.btn_text("btn-drop-back"))
    d.click("#btn-drop-back"); time.sleep(0.6)
    # Wave-3 coordinator fix (harness race, not a game bug): the old
    # code read HP after the controlling poll loop, by which time
    # the live hero can already have taken combat damage at the
    # drop zone (red AI spends the 30 s cooldown advancing on an
    # idle west base — earlier runs showed 111 -> 10 and 172 ->
    # 147). Preservation is proven by the HP at the instant control
    # lands; a later read is also recorded to show combat damage.
    hp1 = ""; hp1_later = ""
    for _ in range(20):
        if d.p.evaluate("document.body.classList.contains('controlling')"):
            hp1 = d.p.inner_text("#ctl-hp").strip(); break
        time.sleep(0.3)
    time.sleep(1.0)
    try: hp1_later = d.p.inner_text("#ctl-hp").strip()
    except Exception: hp1_later = ""
    d.check("hero re-drop preserves HP (release HP == re-drop HP)", hp_rel == hp1, f"{hp_rel} vs {hp1} (1s later: {hp1_later})")
    d.shot("beta3-08-hero-redropped.png")
    d.click("#btn-release-control"); time.sleep(0.5)

def section_hero_death_redeploy(d):
    d.click("#btn-pause"); time.sleep(0.6); d.click("#pm-first"); time.sleep(1.0)
    before = d.status().get("wrecks")
    d.click("#btn-drop-back"); time.sleep(0.6)
    for _ in range(20):
        if d.p.evaluate("document.body.classList.contains('controlling')"): break
        time.sleep(0.3)
    box = d.p.locator("#view").bounding_box()
    d.p.mouse.move(box["x"] + box["width"] / 2 + 150, box["y"] + box["height"] / 2)
    d.p.keyboard.down("d")  # drive, no fire
    dead = False
    for _ in range(75):
        time.sleep(2.0)
        fb = d.p.inner_text("#feedback").strip()
        if "Controlled unit destroyed" in fb or not d.p.evaluate("document.body.classList.contains('controlling')"):
            dead = True; break
    d.p.keyboard.up("d")
    after = d.status().get("wrecks")
    d.check("hero death observed", dead, f"wrecks {before} -> {after}")
    d.shot("beta3-09-hero-dead.png")
    lbl = d.btn_text("btn-drop-back")
    d.check("hero death -> 30s-class cooldown label", "Drop ready in 2" in lbl or "Drop ready in 3" in lbl, lbl)
    # Wait out the 30 s + ensure scrap, then redeploy at full HP.
    for _ in range(45):
        time.sleep(1.0)
        if d.btn_text("btn-drop-back") == "Drop Back In": break
    ready = d.btn_text("btn-drop-back") == "Drop Back In"
    d.check("hero redeploy ready after death cooldown", ready, d.btn_text("btn-drop-back"))
    if ready:
        d.click("#btn-drop-back"); time.sleep(0.6)
        for _ in range(20):
            if d.p.evaluate("document.body.classList.contains('controlling')"): break
            time.sleep(0.3)
        hp = d.p.inner_text("#ctl-hp").strip()
        d.check("hero redeploy lands at full HP 200/200", hp.startswith("HP: 200 / 200"), hp)
        d.shot("beta3-10-hero-redeployed.png")
        d.click("#btn-release-control"); time.sleep(0.5)

def section_rally_zoom_pause(d):
    d.click("#btn-pause"); time.sleep(0.6); d.click("#pm-first"); time.sleep(1.0)
    d.click("#btn-move")
    d.centre_on(6, 25); d.tap(6, 25); time.sleep(0.7)
    rallied = False
    if d.panel_on("build-panel"):
        clicked = d.p.evaluate("""() => {
            const b = document.querySelector('.rally-btn'); if (b) { b.click(); return true; } return false; }""")
        if clicked:
            d.centre_on(15, 25); d.tap(15, 25); time.sleep(0.8)
            fb = d.p.inner_text("#feedback").strip()
            rallied = "Rally set at (15.0, 25.0)" in fb
            d.check("rally set with feedback", rallied, fb)
    d.click("#btn-zoom-out"); time.sleep(0.3)
    for _ in range(10): d.click("#btn-zoom-out")
    time.sleep(0.8)
    z = d.status().get("zoom")
    d.check("zoom out clamps at 0.40", z == "0.40", f"zoom={z}")
    d.click("#btn-zoom-1"); time.sleep(0.8)
    d.check("zoom 1x resets to 1.00", d.status().get("zoom") == "1.00", d.status().get("zoom"))
    d.click("#btn-pause"); time.sleep(0.6)
    t0 = d.status().get("tick"); time.sleep(3.0); t1 = d.status().get("tick")
    d.check("pause freezes sim", t0 == t1, f"{t0} -> {t1}")
    d.click("#pm-resume"); time.sleep(1.0)
    t2 = d.status().get("tick")
    d.check("resume advances sim", t2 and t0 and int(t2) > int(t0), f"{t0} -> {t2}")

def section_corruption(d):
    d.click("#btn-pause"); time.sleep(0.6); d.click("#pm-quit"); time.sleep(1.0)
    d.p.evaluate("localStorage.setItem('surfacewars.hero.v1', 'garbage{{{')")
    d.p.reload(); time.sleep(1.5)
    notice = d.btn_text("mm-hero-notice")
    d.check("corruption notice shown", "could not be read" in notice, notice)
    d.shot("beta3-11-corruption-menu.png")
    # Clean up so later sections start from a level-1 record.
    d.p.evaluate("localStorage.removeItem('surfacewars.hero.v1')")
    d.p.reload(); time.sleep(1.0)

def section_mobile(d, pw):
    results = {}
    for (w, h, name) in [(390, 844, "portrait-390"), (844, 390, "land-844"), (932, 430, "land-932")]:
        pg = pw.chromium.launch().new_page(viewport={"width": w, "height": h}) if False else None
        # Use a fresh page in the same browser via new_page on the context below (handled by caller).
        results[name] = (w, h)
    return results

def mobile_checks(browser, d_main):
    out = []
    for (w, h, name) in [(390, 844, "portrait-390"), (844, 390, "land-844"), (932, 430, "land-932")]:
        ctx = browser.new_context(viewport={"width": w, "height": h})
        pg = ctx.new_page()
        pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
        pg.click("#mm-play-first"); pg.wait_for_timeout(1200)
        # Dismiss rotate hint in portrait if present.
        try:
            if pg.is_visible("#btn-rotate-dismiss"): pg.click("#btn-rotate-dismiss"); pg.wait_for_timeout(400)
        except Exception: pass
        m = pg.evaluate("""() => {
            const cv = document.getElementById('view'), st = document.getElementById('stage');
            const btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent && getComputedStyle(b).display !== 'none');
            const heights = btns.map(b => b.getBoundingClientRect().height);
            return { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                     canvas: [Math.round(cv.getBoundingClientRect().width), Math.round(cv.getBoundingClientRect().height)],
                     stage: [Math.round(st.getBoundingClientRect().width), Math.round(st.getBoundingClientRect().height)],
                     minBtn: heights.length ? Math.min(...heights) : -1, nBtn: btns.length }; }""")
        ok = m["canvas"] == m["stage"] and m["overflowX"] == 0 and m["minBtn"] >= 44
        d_main.check(f"mobile {name}: canvas==stage, no overflow, buttons>=44px", ok, json.dumps(m))
        pg.screenshot(path=str(SHOTS / f"beta3-12-{name}-ingame.png"))
        if w == 390:
            # Tray toggle flips expanded and canvas still equals stage.
            before = pg.evaluate("document.getElementById('commands').classList.contains('expanded')")
            try:
                pg.click("#btn-cmd-more"); pg.wait_for_timeout(600)
                after = pg.evaluate("document.getElementById('commands').classList.contains('expanded')")
                m2 = pg.evaluate("""() => { const cv = document.getElementById('view'), st = document.getElementById('stage');
                    return [Math.round(cv.getBoundingClientRect().width), Math.round(cv.getBoundingClientRect().height),
                            Math.round(st.getBoundingClientRect().width), Math.round(st.getBoundingClientRect().height)]; }""")
                d_main.check("portrait tray toggle keeps canvas==stage", before != after and m2[0] == m2[2] and m2[1] == m2[3], f"{before}->{after} {m2}")
                pg.screenshot(path=str(SHOTS / "beta3-13-portrait-tray-toggled.png"))
            except Exception as e:
                d_main.check("portrait tray toggle", False, str(e))
        ctx.close()
    return out

def section_touch(browser, d_main):
    # Phone-landscape twin-stick via CDP multi-touch (emulated touch, not a real phone).
    ctx = browser.new_context(viewport={"width": 844, "height": 390}, has_touch=True)
    pg = ctx.new_page()
    pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
    pg.click("#mm-play-first"); pg.wait_for_timeout(1200)
    d = D(pg); d.cam = (0.0, 14.0)
    d.centre_on(10, 21)
    for (tx, ty) in [(10, 21), (8, 22), (12, 23)]:
        d.tap(tx, ty); time.sleep(0.4)
        if d.status().get("selected") == "1": break
    try:
        pg.evaluate("document.querySelector('#info-take-control').click()"); time.sleep(0.6)
    except Exception as e:
        d_main.check("touch-stick control entry", False, str(e)); ctx.close(); return
    controlling = pg.evaluate("document.body.classList.contains('controlling')")
    if not controlling:
        d_main.check("touch-stick control entry", False, "not controlling"); ctx.close(); return
    try:
        cdp = ctx.new_cdp_session(pg)
        box = pg.locator("#view").bounding_box()
        lx, ly = box["x"] + box["width"] * 0.2, box["y"] + box["height"] * 0.7
        rx, ry = box["x"] + box["width"] * 0.8, box["y"] + box["height"] * 0.7
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [
            {"x": lx, "y": ly, "radiusX": 20, "radiusY": 20, "id": 1},
            {"x": rx, "y": ry, "radiusX": 20, "radiusY": 20, "id": 2}]})
        time.sleep(0.3)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [
            {"x": lx + 60, "y": ly, "radiusX": 20, "radiusY": 20, "id": 1},
            {"x": rx + 60, "y": ry, "radiusX": 20, "radiusY": 20, "id": 2}]})
        time.sleep(1.0)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        time.sleep(0.5)
        still = pg.evaluate("document.body.classList.contains('controlling')")
        d_main.check("touch-stick two simultaneous points, still controlling", still)
        pg.screenshot(path=str(SHOTS / "beta3-14-touch-stick.png"))
    except Exception as e:
        d_main.check("touch-stick two simultaneous points", False, f"CDP error: {e}")
    ctx.close()

def section_throw_defeat(browser, d_main):
    # Attack-only throw match (no production, no salvage, no hero drop):
    # the wave-2 shape that loses. Ends at a defeat panel + loss arc menu.
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
    d = D(pg)
    d.click("#mm-play-first"); time.sleep(1.0)
    term = None; t0 = time.time()
    while time.time() - t0 < 300:
        if d.panel_on("victory-panel"):
            term = {"title": pg.inner_text("#victory-title").strip(), "stats": pg.inner_text("#victory-stats").strip()}; break
        try:
            d.click("#btn-all"); d.click("#btn-attackmove"); d.centre_on(73, 25); d.tap(73, 25)
        except Exception: pass
        time.sleep(2.0)
    d_main.check("throw match reaches a terminal panel", term is not None, json.dumps(term))
    if term:
        kind = "victory" if term["title"].startswith("Victory") else "defeat" if term["title"].startswith("Defeat") else "draw"
        pg.screenshot(path=str(SHOTS / f"beta3-15-throw-{kind}-panel.png"))
        d_main.check("throw match ends in defeat (expected shape)", kind == "defeat", term["title"])
        d.click("#vic-menu"); time.sleep(1.0)
        menu = d.btn_text("mm-hero-status")
        d_main.check("loss arc menu: Level 1, 25 XP, 0 wins", "Level 1" in menu and "25 XP" in menu and "0 wins" in menu, menu)
        pg.screenshot(path=str(SHOTS / "beta3-16-menu-after-loss.png"))
    ctx.close()
    return term

def main():
    global SHOTS
    ap = argparse.ArgumentParser(); ap.add_argument("--shots", default="game/beta-wave3")
    args = ap.parse_args(); SHOTS = Path(args.shots); SHOTS.mkdir(parents=True, exist_ok=True)
    from playwright.sync_api import sync_playwright
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=str(ROOT),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    all_checks = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            pg = browser.new_page(viewport={"width": 1280, "height": 800})
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:{PORT}/game/index.html"); pg.wait_for_timeout(1500)
            d = D(pg)
            print("SECTION menu", flush=True); section_menu(d); print("SECTION tutorial", flush=True); section_tutorial(d); print("SECTION maps", flush=True); section_maps(d); print("SECTION twinstick", flush=True); section_twinstick(d)
            print("SECTION hero_cycle", flush=True); section_hero_cycle(d); print("SECTION hero_death", flush=True); section_hero_death_redeploy(d); print("SECTION rally_zoom_pause", flush=True); section_rally_zoom_pause(d)
            print("SECTION corruption", flush=True); section_corruption(d)
            all_checks += d.checks
            d2 = D(pg)
            mobile_checks(browser, d2); all_checks += d2.checks
            d3 = D(pg)
            section_touch(browser, d3); all_checks += d3.checks
            d4 = D(pg)
            section_throw_defeat(browser, d4); all_checks += d4.checks
            print("CONSOLE_ERRORS " + json.dumps(errs))
            print("CHECKS " + json.dumps(all_checks, indent=1))
            (SHOTS / "beta3-checks.json").write_text(json.dumps(all_checks, indent=1))
            fails = [c for c in all_checks if not c["ok"]]
            print(f"TOTAL {len(all_checks)} checks, {len(fails)} FAIL")
            browser.close()
    finally:
        srv.terminate()

if __name__ == "__main__":
    main()
