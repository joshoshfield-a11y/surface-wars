#!/bin/bash
# Surface Wars APK build — direct SDK tools, no Gradle.
# Run from ~/workspace/surface-wars/apk after the landscape report lands.
set -euo pipefail
export _JAVA_OPTIONS="-Djava.net.preferIPv4Stack=true"
SDK=~/android-sdk
BT=$SDK/build-tools/35.0.0
PLATFORM=$SDK/platforms/android-35/android.jar
JAVA_HOME=~/jdk17
export PATH="$JAVA_HOME/bin:$PATH"
JAVAC=$JAVA_HOME/bin/javac
KEYTOOL=$JAVA_HOME/bin/keytool
ROOT=~/workspace/surface-wars
APKDIR=$ROOT/apk
OUT=$APKDIR/out
rm -rf "$OUT" "$APKDIR/assets"
mkdir -p "$OUT" "$APKDIR/assets"

# --- 1. Snapshot game code (html/js/css only) ---
mkdir -p "$APKDIR/assets/game"
# Explicit list: only files index.html actually loads (14). The old glob
# would also bundle game/_wave2-harness.html, a QA harness, not a game file.
# Wave-5 fix: currency.js (Wave 4 Premium Store, loaded by index.html)
# was missing from the old 13-file list, which verify_refs.py flagged.
cp "$ROOT"/game/index.html "$ROOT"/game/style.css \
   "$ROOT"/game/catalog.js "$ROOT"/game/sim.js "$ROOT"/game/sprites.js \
   "$ROOT"/game/view.js "$ROOT"/game/animation.js "$ROOT"/game/maps.js \
   "$ROOT"/game/render.js "$ROOT"/game/weapons.js "$ROOT"/game/hero.js \
   "$ROOT"/game/progression.js "$ROOT"/game/currency.js "$ROOT"/game/game.js "$APKDIR/assets/game/"

# --- 2. Asset subsets (-512 only) ---
A=$ROOT/assets
mkdir -p "$APKDIR/assets/assets/sprites-90/units" "$APKDIR/assets/assets/sprites-90/structures"
mkdir -p "$APKDIR/assets/assets/tiles-overlay/base" "$APKDIR/assets/assets/tiles-overlay/overlays"
mkdir -p "$APKDIR/assets/assets/animation/wrecks" "$APKDIR/assets/assets/animation/fx" \
         "$APKDIR/assets/assets/animation/projectiles" "$APKDIR/assets/assets/animation/canopy"
cp "$A"/sprites-90/units/*-512.png "$APKDIR/assets/assets/sprites-90/units/"
# Wave-5: the 8 expansion mechs live in sprites-90/mechs-expansion/<class>/
# (see sprites.js EXPANSION_SPRITES), not in units/. Stage exactly the
# 16 referenced -512 files (blue + red per mech) — never the whole
# mechs-expansion tree, which holds ~63 chassis including spares/raw.
for cls in bulwark vespid longshot striker; do
  mkdir -p "$APKDIR/assets/assets/sprites-90/mechs-expansion/$cls"
done
cp "$A"/sprites-90/mechs-expansion/bulwark/bastion-512.png "$A"/sprites-90/mechs-expansion/bulwark/bastion-red-512.png \
   "$A"/sprites-90/mechs-expansion/bulwark/gatekeeper-512.png "$A"/sprites-90/mechs-expansion/bulwark/gatekeeper-red-512.png \
   "$APKDIR/assets/assets/sprites-90/mechs-expansion/bulwark/"
cp "$A"/sprites-90/mechs-expansion/vespid/needlewing-512.png "$A"/sprites-90/mechs-expansion/vespid/needlewing-red-512.png \
   "$A"/sprites-90/mechs-expansion/vespid/longsight-512.png "$A"/sprites-90/mechs-expansion/vespid/longsight-red-512.png \
   "$APKDIR/assets/assets/sprites-90/mechs-expansion/vespid/"
cp "$A"/sprites-90/mechs-expansion/longshot/deadeye-512.png "$A"/sprites-90/mechs-expansion/longshot/deadeye-red-512.png \
   "$A"/sprites-90/mechs-expansion/longshot/mortarjack-512.png "$A"/sprites-90/mechs-expansion/longshot/mortarjack-red-512.png \
   "$APKDIR/assets/assets/sprites-90/mechs-expansion/longshot/"
cp "$A"/sprites-90/mechs-expansion/striker/javelin-512.png "$A"/sprites-90/mechs-expansion/striker/javelin-red-512.png \
   "$A"/sprites-90/mechs-expansion/striker/raptor-512.png "$A"/sprites-90/mechs-expansion/striker/raptor-red-512.png \
   "$APKDIR/assets/assets/sprites-90/mechs-expansion/striker/"
cp "$A"/sprites-90/structures/*-512.png "$APKDIR/assets/assets/sprites-90/structures/"
cp "$A"/tiles-overlay/base/*-512.png "$APKDIR/assets/assets/tiles-overlay/base/"
for d in "$A"/tiles-overlay/overlays/*/; do
  n=$(basename "$d")
  mkdir -p "$APKDIR/assets/assets/tiles-overlay/overlays/$n"
  cp "$d"*-512.png "$APKDIR/assets/assets/tiles-overlay/overlays/$n/" 2>/dev/null || true
done
# Wave-5: the 8 new wreck sprites (bastion/gatekeeper/deadeye/
# mortarjack/needlewing/longsight/javelin/raptor) ride this glob —
# the wrecks dir IS the referenced set (one -512 per unit id), so
# no explicit list is needed here; verify_refs.py checks each id.
cp "$A"/animation/wrecks/*-512.png "$APKDIR/assets/assets/animation/wrecks/"
cp "$A"/animation/fx/*-512.png "$APKDIR/assets/assets/animation/fx/"
cp "$A"/animation/projectiles/*-512.png "$APKDIR/assets/assets/animation/projectiles/"
cp "$A"/animation/canopy/*-512.png "$APKDIR/assets/assets/animation/canopy/"
mkdir -p "$APKDIR/assets/assets/animation/structure-wrecks" "$APKDIR/assets/assets/ui-icons"
cp "$A"/animation/structure-wrecks/*-512.png "$APKDIR/assets/assets/animation/structure-wrecks/"
cp "$A"/ui-icons/*.png "$APKDIR/assets/assets/ui-icons/"

# --- 3. Verify every referenced asset path exists in the tree ---
# The game loads via sprites.js: it builds paths as 'assets/<dir>/<slug>-512.png'
# for dirs listed there, plus render.js water_plain_v<N> and tiles-overlay overlays.
# We check by listing the game-referenced filename patterns from sprites.js/render.js
# and confirming coverage per directory; a full per-file check runs in verify_refs.py.
python3 "$APKDIR/verify_refs.py"

# --- 4. Compile, link, dex, package ---
mkdir -p "$OUT/classes" "$OUT/gen"
"$JAVAC" -source 8 -target 8 -bootclasspath "$PLATFORM" \
  -d "$OUT/classes" "$APKDIR/src/com/skit/surfacewars/MainActivity.java"
"$BT/aapt2" compile --dir "$APKDIR/res" -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/unsigned.apk" -I "$PLATFORM" \
  --manifest "$APKDIR/AndroidManifest.xml" "$OUT/res.zip" \
  -A "$APKDIR/assets" --auto-add-overlay --java "$OUT/gen" \
  --min-sdk-version 28 --target-sdk-version 35 \
  --version-code 7 --version-name 1.6
"$BT/d8" --lib "$PLATFORM" --output "$OUT" "$OUT/classes/com/skit/surfacewars/MainActivity.class"
cp "$OUT/unsigned.apk" "$OUT/packaged.apk"
# Add dex by relative name from inside $OUT: aapt stores the path as given,
# and an absolute path would land in the APK as /home/.../classes.dex (unloadable).
(cd "$OUT" && "$BT/aapt" add packaged.apk classes.dex >/dev/null)

# --- 5. Align + sign (fresh debug keystore) ---
if [ ! -f "$APKDIR/debug.keystore" ]; then
  "$KEYTOOL" -genkeypair -v -keystore "$APKDIR/debug.keystore" -storepass android \
    -keypass android -alias surfacewars -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Surface Wars Debug, OU=Debug, O=Skit, C=US" >/dev/null
fi
"$BT/zipalign" -f 4 "$OUT/packaged.apk" "$OUT/aligned.apk"
"$BT/apksigner" sign --ks "$APKDIR/debug.keystore" --ks-pass pass:android \
  --key-pass pass:android --out "$OUT/Surface_Wars_v1.6.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/Surface_Wars_v1.6.apk"
"$BT/zipalign" -c 4 "$OUT/Surface_Wars_v1.6.apk"
"$BT/aapt2" dump badging "$OUT/Surface_Wars_v1.6.apk"
cp "$OUT/Surface_Wars_v1.6.apk" ~/workspace/your_files/Surface_Wars_v1.6.apk
echo "APK: $(stat -c%s ~/workspace/your_files/Surface_Wars_v1.6.apk) bytes"
sha256sum ~/workspace/your_files/Surface_Wars_v1.6.apk
