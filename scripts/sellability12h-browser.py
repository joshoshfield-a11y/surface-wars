#!/usr/bin/env python3
"""WAVE 5 (SELLABILITY-12H): Tutorial II headless-Chromium proof with REAL INPUT.

Serves game/ over localhost (localStorage needs a real origin) and drives
Tutorial II through the same taps, keys, and buttons a player uses. Run with
the ml-stack venv python (playwright lives there):
  ~/workspace/venvs/ml-stack/bin/python scripts/sellability12h-browser.py

Server pattern copied from scripts/currency12h-browser.py: -u is
LOAD-BEARING (without it the startup banner block-buffers and the port
readline deadlocks), and wait_for_function takes a SINGLE object arg
(a two-element list arg is NOT spread into two parameters).

Three runs, in order, each on a fresh page:
  1. BY-DOING (the primary proof): every step advances by doing the
     action, never by pressing Next:
       step 1 Take Control: tap the blue longshot, then tap Take
         Control. Bar must read "Tutorial II 2 of 6". The tap point
         is computed from the CLAMPED camera, not the ideal framing:
         frameTutorial2Camera centres the longshot (9,25) at
         centre-x / 30%-height, but View.clampCamera pins the camera
         at >= 0, so on a 980-px-wide canvas the camera parks at
         x=0 and the longshot renders at (9-0)*32 px from the canvas
         left — NOT at centre-x. Tapping centre-x hits empty ground
         at world x~15 (found by the probe run, then fixed here).
       step 2 Drive: hold D ~3s. Bar must read "Tutorial II 3 of 6"
         (controlled unit moved > 1.5 tiles).
       step 3 Aim and fire: sweep aim east from canvas centre
         (camera follows the controlled unit, so the unit IS the
         centre) at +192/+288/+384/+480 px, holding the mouse down
         several seconds each, until the bar reads "Tutorial II
         4 of 6" (held target destroyed by manual fire only).
       step 4 Release: tap Release Control. Bar must read
         "Tutorial II 5 of 6" (release transition: was controlling,
         now not, still selected, hold order).
       step 5 Drop Back In: tap Drop Back In, wait through the
         40-tick (2 s) telegraph for the auto-control landing. Bar
         must hide and the #tutorial2-end overlay must appear
         (hero field + controlling — not the drop press alone).
       step 6 Store: tap Open Premium Store. Store panel must show
         packs + "Real-money purchases: not live", balance must
         STILL be 0 (viewing only, no purchase). Close store ->
         main menu, tutorial bar hidden, end overlay hidden.
         Then Play First Map -> normal game (bar hidden, Drop
         Back In visible: the tutorial flag is cleared).
  2. NEXT-FALLBACK (proof Next works, never a substitute for 1):
     fresh page, press Next 5 times -> #tutorial2-end appears,
     Finish -> main menu.
  3. SKIP + RESTART (cleanup contract):
     fresh page, Skip mid-tutorial -> main menu, bar + overlay
     hidden; fresh Tutorial II, Reset Map -> bar back at
     "Tutorial II 1 of 6" (restart restarts tier 2); then Skip
     again -> menu, Play First Map -> normal game.

What this does NOT prove (stated honestly, never claimed):
  the aim step on a real phone (narrow visible-and-shootable window
  at phone zoom — see game/SELLABILITY-12H-REPORT.md), or a full
  phone-size playthrough. Desktop viewport here is 1280x800.
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WALLET_KEY = "surfacewars.wallet.v1"
PROGRESS = "/tmp/sellability12h-progress.log"


def log(msg):
    line = msg + "\n"
    with open(PROGRESS, "a") as fh:
        fh.write(line)
    print(line, end="", flush=True)


def check(name, cond, detail=""):
    log(json.dumps({"check": name, "ok": bool(cond), "detail": detail}))
    if not cond:
        raise AssertionError(name + " :: " + detail)


def text_of(page, selector):
    return page.locator(selector).inner_text(timeout=10000)


def wait_text(page, selector, needle, timeout=30000):
    page.wait_for_function(
        "(a) => { const el = document.querySelector(a.sel); "
        "return el && el.textContent.includes(a.needle); }",
        arg={"sel": selector, "needle": needle}, timeout=timeout)
    return text_of(page, selector)


def bar_text(page):
    return text_of(page, "#tutorial-text")


def start_tutorial2(page, base):
    page.goto(base)
    page.wait_for_selector("#mm-tutorial2", state="visible", timeout=20000)
    # Fresh wallet, balance 0: the store step must leave it at 0.
    page.evaluate(
        "([k, v]) => localStorage.setItem(k, v)",
        [WALLET_KEY, json.dumps({"schema": 1, "balance": 0, "owned": [],
                                 "used": [], "equipped": None})])
    page.reload()
    page.wait_for_selector("#mm-tutorial2", state="visible", timeout=20000)
    page.click("#mm-tutorial2")
    wait_text(page, "#tutorial-text", "Tutorial II 1 of 6", timeout=20000)
    check("tut2-opens-step1", "Tutorial II 1 of 6" in bar_text(page),
          bar_text(page))


def canvas_box(page):
    box = page.locator("#view").bounding_box()
    assert box, "canvas #view has no bounding box"
    return box


def main():
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-u", "-m", "http.server", "0", "--bind", "127.0.0.1"],
        cwd=str(ROOT), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        line = server.stdout.readline()
        m = re.search(r"port (\d+)", line)
        if not m:
            raise RuntimeError("could not read http.server port from: " + line)
        base = "http://127.0.0.1:%s/game/index.html" % m.group(1)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.on("pageerror", lambda err: print(json.dumps(
                {"pageerror": str(err)})))

            # ---------- Run 1: BY-DOING ----------
            log("run: by-doing")
            start_tutorial2(page, base)
            box = canvas_box(page)
            # Step 1: tap the longshot at its RENDERED position, then
            # Take Control. Rendered position = framed point minus
            # the CLAMPED camera (View.clampCamera pins at >= 0, so
            # the longshot at x=9 renders at (9-camX)*32, not at
            # centre-x, on any canvas wider than 18 tiles). Retry a
            # small grid if the first tap missed — a missed tap must
            # not silently become a Next-press advance.
            vtx, vty = box["width"] / 32.0, box["height"] / 32.0
            cam_x = max(0.0, min(80 - vtx, 9 - vtx / 2))
            cam_y = max(0.0, min(50 - vty, 25 - vty * 0.30))
            lx = box["x"] + (9 - cam_x) * 32.0
            ly = box["y"] + (25 - cam_y) * 32.0
            took_control = False
            for dx, dy in [(0, 0), (-40, 0), (40, 0), (0, -40), (0, 40),
                           (-80, 0), (80, 0)]:
                page.mouse.click(lx + dx, ly + dy)
                time.sleep(0.5)
                if page.locator("#btn-take-control").is_visible():
                    page.click("#btn-take-control")
                    try:
                        wait_text(page, "#tutorial-text",
                                  "Tutorial II 2 of 6", timeout=8000)
                        took_control = True
                        break
                    except Exception:
                        pass
            check("tut2-step1-by-doing", took_control,
                  "bar after Take Control: " + bar_text(page))
            # Step 2: hold D to drive east (~3 s at 3.5 tiles/s).
            page.keyboard.down("d")
            try:
                wait_text(page, "#tutorial-text", "Tutorial II 3 of 6",
                          timeout=20000)
            finally:
                page.keyboard.up("d")
            check("tut2-step2-by-doing",
                  "Tutorial II 3 of 6" in bar_text(page), bar_text(page))
            # Step 3: sweep aim east from canvas centre (the camera
            # follows the controlled unit, so the unit is the centre;
            # the target sits due east at the same y). One siege hit
            # threatens the 50-HP target; allow several shots.
            box = canvas_box(page)
            cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            killed = False
            for off in (192, 288, 384, 480, 240, 336, 432):
                page.mouse.move(cx + off, cy)
                page.mouse.down()
                try:
                    wait_text(page, "#tutorial-text", "Tutorial II 4 of 6",
                              timeout=9000)
                    killed = True
                    break
                except Exception:
                    pass
                finally:
                    page.mouse.up()
                time.sleep(0.5)
            check("tut2-step3-by-doing", killed,
                  "bar after aim sweep: " + bar_text(page))
            # Step 4: Release Control (control strip button).
            page.wait_for_selector("#btn-release-control", state="visible",
                                   timeout=10000)
            page.click("#btn-release-control")
            wait_text(page, "#tutorial-text", "Tutorial II 5 of 6",
                      timeout=15000)
            check("tut2-step4-by-doing",
                  "Tutorial II 5 of 6" in bar_text(page), bar_text(page))
            # Step 5: Drop Back In; landing auto-controls the hero.
            page.wait_for_selector("#btn-drop-back", state="visible",
                                   timeout=10000)
            page.click("#btn-drop-back")
            page.wait_for_selector("#tutorial2-end", state="visible",
                                   timeout=30000)
            check("tut2-step5-by-doing",
                  page.locator("#tutorial-bar").is_hidden(),
                  "bar must hide once the store screen appears")
            # Step 6: open the store, view only, balance stays 0.
            page.click("#tut2-store")
            page.wait_for_selector("#store-panel", state="visible",
                                   timeout=10000)
            body = page.locator("body").inner_text()
            check("tut2-store-panel",
                  "Real-money purchases: not live" in body)
            check("tut2-store-viewing-only",
                  "0" in text_of(page, "#store-balance")
                  and page.locator("#store-packs").count() == 1,
                  text_of(page, "#store-balance"))
            page.click("#store-close")
            page.wait_for_selector("#main-menu", state="visible",
                                   timeout=10000)
            check("tut2-store-close-to-menu",
                  page.locator("#tutorial-bar").is_hidden()
                  and page.locator("#tutorial2-end").is_hidden(),
                  "tutorial UI must be gone after store close")
            # Flag cleared: a real First Map game has no tutorial bar
            # and shows Drop Back In (hidden while any tutorial runs).
            page.click("#mm-play-first")
            page.wait_for_selector("#btn-drop-back", state="visible",
                                   timeout=20000)
            check("tut2-cleanup-real-game",
                  page.locator("#tutorial-bar").is_hidden(),
                  "no tutorial bar in a real game")

            # ---------- Run 2: NEXT-FALLBACK ----------
            log("run: next-fallback")
            start_tutorial2(page, base)
            for _ in range(5):
                page.click("#tut-next")
                time.sleep(0.5)
            page.wait_for_selector("#tutorial2-end", state="visible",
                                   timeout=15000)
            check("tut2-next-reaches-store-screen", True)
            page.click("#tut2-finish")
            page.wait_for_selector("#main-menu", state="visible",
                                   timeout=10000)
            check("tut2-next-finish-to-menu",
                  page.locator("#tutorial2-end").is_hidden())

            # ---------- Run 3: SKIP + RESTART ----------
            log("run: skip-restart")
            start_tutorial2(page, base)
            page.click("#tut-skip")
            page.wait_for_selector("#main-menu", state="visible",
                                   timeout=10000)
            check("tut2-skip-to-menu",
                  page.locator("#tutorial-bar").is_hidden()
                  and page.locator("#tutorial2-end").is_hidden())
            start_tutorial2(page, base)
            page.click("#btn-reset")
            wait_text(page, "#tutorial-text", "Tutorial II 1 of 6",
                      timeout=15000)
            check("tut2-restart-restarts",
                  "Tutorial II 1 of 6" in bar_text(page), bar_text(page))
            page.click("#tut-skip")
            page.wait_for_selector("#main-menu", state="visible",
                                   timeout=10000)
            page.click("#mm-play-first")
            page.wait_for_selector("#btn-drop-back", state="visible",
                                   timeout=20000)
            check("tut2-skip-then-real-game",
                  page.locator("#tutorial-bar").is_hidden())

            print(json.dumps({"browser-playthrough": "PASS"}))
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except Exception:
            server.kill()


if __name__ == "__main__":
    import traceback
    try:
        main()
    except Exception:
        log("TRACEBACK:\n" + traceback.format_exc())
        raise
