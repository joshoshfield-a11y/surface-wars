#!/usr/bin/env python3
"""WAVE 4 (CURRENCY-12H): headless-Chromium playthrough with REAL CLICKS.

Serves game/ over localhost (localStorage needs a real origin) and
drives the store through the same buttons a player taps. Run with
the ml-stack venv python (playwright lives there):
  ~/workspace/venvs/ml-stack/bin/python scripts/currency12h-browser.py

What this proves (each step asserts, any failure exits nonzero):
  Phase 1 (level-1 hero, seeded 800 Credits):
    balance shown -> buy Ember Line -> duplicate buy impossible
    (button becomes Equip) -> equip refused at level 1 with the
    tier-gate reason -> buy + equip Bulwark March -> refund Ember
    (never used, full price back) -> PAGE RELOAD persists balance
    AND equipped pack -> loadout panel summary shows the pack's
    primary (Breacher-12) -> garbled wallet -> reset notice +
    usable menu + hero record intact.
  Phase 2 (seeded VALID level-4 hero record, seeded 350 Credits):
    buy + equip Ember Line via clicks -> reload persists the
    equipped pack -> start a real First Map match -> Drop Back In
    -> the control strip shows the Ember pack's field stats
    (HP 253 from level-4 + Plated Hull I, weapon range 5 from the
    Ember Repeater), proving the equipped pack loadout is the one
    on the field. Default at level 4 would read 230 / range 6.

What this does NOT prove (stated honestly, never claimed):
  a live match-end CREDIT GRANT in the browser — that would need a
  full match played to victory/defeat in real time. The grant is
  proven by the unit tests (grant formula, all results), by the
  Node harness Part A (earn -> spend -> equip -> use), and by the
  grant sitting in the same showVictory block as the XP write.
  Balances here are seeded through localStorage before the store
  steps, so the browser run proves persist/spend/equip/match, not
  the earning itself. Phase 2 seeds a level-4 hero record because
  grinding 600 XP in the browser is not a feasible playthrough
  step; every store action in both phases is a real click.
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME_URL = None  # set in main() once the server port is known

WALLET_KEY = "surfacewars.wallet.v1"
HERO_KEY = "surfacewars.hero.v1"
RESET_NOTICE = "Wallet could not be read, so it was reset to 0."
PROGRESS = "/tmp/currency12h-progress.log"


def log(msg):
    # Progress goes to a FILE as well as stdout: exec output for a
    # backgrounded run is only delivered on completion, so the file
    # is the only way to see where a stuck run actually is.
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


def wait_text(page, selector, needle, timeout=15000):
    # Playwright passes arg as ONE JS value: pack sel + needle into
    # a single object (a two-element list arg is NOT spread into
    # two parameters — passing one broke querySelector outright).
    page.wait_for_function(
        "(a) => { const el = document.querySelector(a.sel); "
        "return el && el.textContent.includes(a.needle); }",
        arg={"sel": selector, "needle": needle}, timeout=timeout)
    return text_of(page, selector)


def main():
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        # -u is LOAD-BEARING: without it the server's startup banner
        # sits in a block buffer, readline() below waits forever
        # (no request can arrive before the port is known), and the
        # run silently never launches a browser. That deadlock ate
        # three runs before it was diagnosed.
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

            def seed_wallet(obj):
                # Playwright passes arg as ONE JS value: destructure
                # the array in the function (a (k, v) signature with
                # a list arg silently stringifies the key instead).
                val = obj if isinstance(obj, str) else json.dumps(obj)
                page.evaluate(
                    "([k, v]) => localStorage.setItem(k, v)",
                    [WALLET_KEY, val])
                back = page.evaluate(
                    "([k]) => localStorage.getItem(k)", [WALLET_KEY])
                if back != val:
                    raise AssertionError(
                        "seed_wallet did not land: %r" % (back,))

            def seed_hero(obj):
                val = json.dumps(obj)
                page.evaluate(
                    "([k, v]) => localStorage.setItem(k, v)",
                    [HERO_KEY, val])
                back = page.evaluate(
                    "([k]) => localStorage.getItem(k)", [HERO_KEY])
                if back != val:
                    raise AssertionError(
                        "seed_hero did not land: %r" % (back,))

            # ---------- Phase 1 ----------
            log("step: goto " + base)
            page.goto(base)
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            seed_wallet({"schema": 1, "balance": 800, "owned": [],
                         "used": [], "equipped": None})
            page.reload()
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            check("p1-balance-shown",
                  "Salvage Credits: 800" in text_of(page, "#mm-wallet-status"),
                  text_of(page, "#mm-wallet-status"))
            page.click("#mm-store")
            page.wait_for_selector("#store-panel", state="visible", timeout=10000)
            check("p1-store-balance",
                  "800" in text_of(page, "#store-balance"),
                  text_of(page, "#store-balance"))
            body = page.locator("body").inner_text()
            check("p1-real-money-note",
                  "Real-money purchases: not live" in body)
            check("p1-no-checkout-button",
                  page.evaluate(
                      "() => [...document.querySelectorAll('#store-panel button')]"
                      ".every(b => !b.textContent.includes('Checkout'))"),
                  "store buttons must be Buy/Equip/Refund/Back only")
            page.screenshot(path=str(ROOT / "game" / "currency12h-store.png"))
            page.click("#store-buy-pack_ember_line")
            wait_text(page, "#store-balance", "450")
            check("p1-buy-ember-balance",
                  "450" in text_of(page, "#store-balance"))
            check("p1-duplicate-buy-impossible",
                  page.locator("#store-buy-pack_ember_line").count() == 0
                  and page.locator("#store-equip-pack_ember_line").count() == 1,
                  "buy button must become Equip, never a second charge")
            page.click("#store-equip-pack_ember_line")
            wait_text(page, "#store-notice", "needs hero level 4")
            check("p1-tier-gate-on-equip",
                  "needs hero level 4" in text_of(page, "#store-notice"),
                  text_of(page, "#store-notice"))
            page.click("#store-buy-pack_bulwark_march")
            wait_text(page, "#store-balance", "150")
            page.click("#store-equip-pack_bulwark_march")
            wait_text(page, "#store-packs", "Owned — equipped.")
            check("p1-equip-bulwark",
                  "Owned — equipped." in text_of(page, "#store-packs"))
            # Balance is now 150; Storm Cell costs 600: the buy must
            # refuse with a reason and leave the balance untouched.
            page.click("#store-buy-pack_storm_cell")
            wait_text(page, "#store-notice", "Not enough")
            check("p1-insufficient-funds",
                  "Not enough Salvage Credits" in text_of(page, "#store-notice")
                  and "150" in text_of(page, "#store-balance"),
                  text_of(page, "#store-notice") + " | " + text_of(page, "#store-balance"))
            page.click("#store-refund-pack_ember_line")
            wait_text(page, "#store-balance", "500")
            check("p1-refund-unused-full-price",
                  "500" in text_of(page, "#store-balance")
                  and page.locator("#store-buy-pack_ember_line").count() == 1,
                  "150 + 350 refunded, buy button returns")
            page.click("#store-close")
            page.reload()
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            status = text_of(page, "#mm-wallet-status")
            check("p1-persist-across-reload",
                  "Salvage Credits: 500" in status
                  and "Equipped pack: Bulwark March" in status, status)
            page.click("#mm-loadout")
            page.wait_for_selector("#lo-summary", state="visible", timeout=10000)
            summary = text_of(page, "#lo-summary")
            check("p1-loadout-changed-to-pack",
                  "Breacher-12" in summary, summary)
            page.click("#lo-close")
            # Corruption playthrough: garbled wallet, menu must survive.
            seed_wallet("{garbled")
            page.reload()
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            notice = text_of(page, "#mm-wallet-notice")
            hero_status = text_of(page, "#mm-hero-status")
            check("p1-corruption-reset-notice",
                  notice == RESET_NOTICE, notice)
            check("p1-corruption-hero-intact",
                  "Level 1" in hero_status, hero_status)
            page.click("#mm-store")
            page.wait_for_selector("#store-panel", state="visible", timeout=10000)
            check("p1-corruption-menu-usable",
                  "0" in text_of(page, "#store-balance"),
                  text_of(page, "#store-balance"))
            page.click("#store-close")

            # ---------- Phase 2: premium pack on the field ----------
            log("step: phase 2 seed")
            seed_hero({"schema": 1, "level": 4, "xp": 600, "skillPoints": 3,
                       "skills": [], "loadout": {
                           "primary": "nw_twin_bore_autogun", "secondary": None,
                           "armor": None, "mobility": None, "reactor": None,
                           "sensor": None, "ability": None},
                       "heroEnabled": True, "matchesPlayed": 0, "wins": 0,
                       "masteryClaimed": 0})
            seed_wallet({"schema": 1, "balance": 350, "owned": [],
                         "used": [], "equipped": None})
            page.reload()
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            check("p2-level4-hero",
                  "Level 4" in text_of(page, "#mm-hero-status"),
                  text_of(page, "#mm-hero-status"))
            page.click("#mm-store")
            page.wait_for_selector("#store-panel", state="visible", timeout=10000)
            page.click("#store-buy-pack_ember_line")
            wait_text(page, "#store-balance", "0")
            page.click("#store-equip-pack_ember_line")
            wait_text(page, "#store-packs", "Owned — equipped.")
            page.click("#store-close")
            page.reload()
            page.wait_for_selector("#mm-store", state="visible", timeout=20000)
            check("p2-equipped-persists",
                  "Equipped pack: Ember Line" in text_of(page, "#mm-wallet-status"),
                  text_of(page, "#mm-wallet-status"))
            page.click("#mm-play-first")
            page.wait_for_selector("#btn-drop-back", state="visible", timeout=20000)
            page.click("#btn-drop-back")
            ctl = wait_text(page, "#ctl-hp", "HP:", timeout=60000)
            check("p2-premium-loadout-on-field",
                  "/ 253" in ctl and "Weapon range: 5 tiles" in ctl, ctl)
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
