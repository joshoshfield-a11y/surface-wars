# Structures — generation prompt record (sprites-90)

Every prompt began with the hard lock, verbatim in spirit:
"Flat plan view game sprite, camera directly overhead looking straight down
at 90 degrees, no perspective, no 3/4 view, no side profile, no isometric
view, no diagonal view, no tilted camera, no angled shading."
plus: "Centered alone on a pure black background, no ground, no sideways
shadow, no text, no letters, no watermark. Original pixel RTS game sprite
style, readable silhouette." and "blue glowing team lights and blue trim,
grey industrial metal" (with per-class material tweaks noted below).

- command_core: large command HQ, rectangular armored base, central circular
  command dome as a flat circle, antenna mast as a small dot.
- scrap_extractor: small square base, flat circular drill pad, conveyor strip,
  rusted grey/brown scrap metal.
- power_plant: rectangular building, two round cooling towers as flat circles,
  blue energy core markings, pipes as flat lines.
- advanced_reactor: octagonal base, large central circular reactor dome with
  concentric circles, blue glowing ring.
- light_factory: large rectangular hall, flat roof panels, one wide assembly
  bay opening as a flat rectangle on one side.
- vehicle_factory: large rectangular hall, two flat assembly lanes as parallel
  rectangles, vehicle chassis outlines flat on the floor.
- mech_bay: large rectangular hall, central flat circular assembly pad,
  crane rails as straight flat lines.
- aircraft_hangar: wide rectangular building, curved flat roof outline, flat
  runway apron rectangle, small aircraft silhouette flat from above, wings
  horizontal.
- heavy_plant: very large rectangular complex, smokestack tops as flat
  circles, foundry halls as flat rectangles, crane rails as straight lines.
- research_lab: clean rectangular building, central flat circular lab dome,
  small flat antenna dishes as circles, light grey/white panels.
- salvage_processor: rectangular yard, flat conveyor lines, scrap piles as
  flat grey shapes, flat circular crusher pad.
- repair_depot: rectangular workshop, two flat open repair bays as rectangles,
  tool racks as flat lines, orange-brown rust accents.
- radar_station: square pad, ONE large radar dish as a perfectly round flat
  circle with concentric rings, mast as a small center dot only, NO ellipse
  dish, small equipment shed rectangle.
- ammo_depot: rectangular fenced yard, rows of flat ammunition crates as
  rectangles, one small bunker rectangle, olive metal.
- logistics_hub: rectangular warehouse, flat loading dock rectangle, rows of
  flat supply crates, flat circular turning pad.
- experimental_facility: large rectangular high-tech complex, central flat
  circular test chamber, glowing blue energy ring.
- light_turret: small square base, circular turret ring, ONE short barrel
  pointing straight up to the top of the image, vertical only, NO diagonal
  barrel.
- heavy_turret: large octagonal base, circular ring, ONE thick barrel
  pointing straight up, vertical only.
- aa_turret: square base, circular ring, TWO thin parallel barrels pointing
  straight up, vertical only.
- missile_turret: square base, circular ring, rectangular rack of four
  missile tubes in a flat grid, flat rectangles only.
- bunker: low rectangular concrete bunker, flat roof, one narrow horizontal
  firing slit as a straight flat rectangle, small entrance rectangle.
- wall: ONE long straight horizontal concrete/metal wall bar, flat top
  surface with panel lines, small blue lights along its length.
- shield_generator: square base, central flat circular emitter dish with
  concentric blue glowing rings, four small corner pylons as squares.

Red variants: NOT generated separately and NOT an R/B channel swap. Built
from the keyed blue sprites by `make_reds.py`: HSV hue remap of blue/cyan/
violet-band pixels (hue 150–290°, saturation > 0.20, or blue-dominant) to
hue 0 (true red), saturation/value preserved. Per-sprite changed-opaque-
pixel fractions and mean absolute differences are in CATEGORY-REPORT.md.
