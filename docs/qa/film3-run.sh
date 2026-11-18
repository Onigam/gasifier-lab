#!/bin/bash
# The film round 3's measurements, one Chrome job at a time under the Mac's lock (every agent shares it; the queue can be long):
#   the stills of an item's poses (docs/qa/film3-specs/itemN.json) after (the working tree, port 5887) and before (a copy of the tree at 41a7859, port 5888),
#   the kit's flicker tool with its heat maps (docs/qa/film1-flicker.mjs, HEAT=1), the flights (docs/qa/film2-flight.mjs), the app's overview by width (docs/qa/film3-overview.mjs), the costs (docs/qa/film1-cost.mjs).
#   ~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film3-run.sh item1 [after|before|both]     (or: flicker, flight, overview, cost)
set -u
cd "$HOME/Dev/gasifier-lab"
OUT="$HOME/.cache/lab-review/gasifier-lab/film3"
WHAT=${1:-item1}
SIDES=${2:-both}
mkdir -p "$OUT/flicker" "$OUT/cost" "$OUT/log"
side() { [ "$SIDES" = both ] || [ "$SIDES" = "$1" ]; }
case "$WHAT" in
  item*)
    if side after; then URL=http://localhost:5887/ node docs/qa/film1-stills.mjs "docs/qa/film3-specs/$WHAT.json" > "$OUT/log/$WHAT-after.log" 2>&1; fi
    if side before; then
      sed 's#film3/after#film3/before#; s#"tag": "c"#"tag": "b"#' "docs/qa/film3-specs/$WHAT.json" > "$OUT/$WHAT-before.json"
      URL=http://localhost:5888/ node docs/qa/film1-stills.mjs "$OUT/$WHAT-before.json" > "$OUT/log/$WHAT-before.log" 2>&1
    fi ;;
  flicker)
    for size in 1280x720 390x844; do
      W=${size%x*}; H=${size#*x}
      for s in after:5887 before:5888; do
        name=${s%:*}; port=${s#*:}
        side "$name" || continue
        HEAT=1 URL=http://localhost:$port/ OUT="$OUT/flicker/$name-$size" WIDTH=$W HEIGHT=$H FRAMES=90 SCENES=${SCENES:-farm,tractor,gasifier,gas-train,garage} node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-$size.log" 2>&1
      done
    done ;;
  flight)
    for s in after:5887 before:5888; do
      name=${s%:*}; port=${s#*:}
      side "$name" || continue
      URL=http://localhost:$port/ OUT="$OUT/flight-$name.json" SCENES=garage,gas-train node docs/qa/film2-flight.mjs > "$OUT/log/flight-$name.log" 2>&1
    done ;;
  overview)
    for s in after:5887 before:5888; do
      name=${s%:*}; port=${s#*:}
      side "$name" || continue
      URL=http://localhost:$port/ OUT="$OUT/overview-$name" node docs/qa/film3-overview.mjs > "$OUT/log/overview-$name.log" 2>&1
    done ;;
  cost)
    for run in 1 2; do
      for s in before:5888 after:5887; do
        name=${s%:*}; port=${s#*:}
        side "$name" || continue
        URL=http://localhost:$port/ OUT="$OUT/cost/$name-run$run.json" node docs/qa/film1-cost.mjs > "$OUT/cost/$name-run$run.log" 2>&1
      done
    done ;;
esac
echo "$WHAT $SIDES done" >> "$OUT/log/runs.log"
