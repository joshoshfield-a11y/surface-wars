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
cp "$ROOT"/game/*.html "$ROOT"/game/*.js "$ROOT"/game/*.css "$APKDIR/assets/game/"

# --- 2. Asset subsets (-512 only) ---
A=$ROOT/assets
mkdir -p "$APKDIR/assets/assets/sprites-90/units" "$APKDIR/assets/assets/sprites-90/structures"
mkdir -p "$APKDIR/assets/assets/tiles-overlay/base" "$APKDIR/assets/assets/tiles-overlay/overlays"
mkdir -p "$APKDIR/assets/assets/animation/wrecks" "$APKDIR/assets/assets/animation/fx" \
         "$APKDIR/assets/assets/animation/projectiles" "$APKDIR/assets/assets/animation/canopy"
cp "$A"/sprites-90/units/*-512.png "$APKDIR/assets/assets/sprites-90/units/"
cp "$A"/sprites-90/structures/*-512.png "$APKDIR/assets/assets/sprites-90/structures/"
cp "$A"/tiles-overlay/base/*-512.png "$APKDIR/assets/assets/tiles-overlay/base/"
for d in "$A"/tiles-overlay/overlays/*/; do
  n=$(basename "$d")
  mkdir -p "$APKDIR/assets/assets/tiles-overlay/overlays/$n"
  cp "$d"*-512.png "$APKDIR/assets/assets/tiles-overlay/overlays/$n/" 2>/dev/null || true
done
cp "$A"/animation/wrecks/*-512.png "$APKDIR/assets/assets/animation/wrecks/"
cp "$A"/animation/fx/*-512.png "$APKDIR/assets/assets/animation/fx/"
cp "$A"/animation/projectiles/*-512.png "$APKDIR/assets/assets/animation/projectiles/"
cp "$A"/animation/canopy/*-512.png "$APKDIR/assets/assets/animation/canopy/"

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
  --version-code 4 --version-name 1.3
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
  --key-pass pass:android --out "$OUT/Surface_Wars_v1.3.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/Surface_Wars_v1.3.apk"
"$BT/zipalign" -c 4 "$OUT/Surface_Wars_v1.3.apk"
"$BT/aapt2" dump badging "$OUT/Surface_Wars_v1.3.apk"
cp "$OUT/Surface_Wars_v1.3.apk" ~/workspace/your_files/Surface_Wars_v1.3.apk
echo "APK: $(stat -c%s ~/workspace/your_files/Surface_Wars_v1.3.apk) bytes"
sha256sum ~/workspace/your_files/Surface_Wars_v1.3.apk
