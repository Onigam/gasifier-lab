#!/bin/bash
# The film round's measurements, one Chrome job at a time under the Mac's lock (every agent shares it):
#   the stills at the film's poses (the code of the working tree, port 5883), the kit's flicker tool (docs/qa/film1-flicker.mjs: the kit's own, the entry notice switched off) for the same worlds before (a copy of the tree before the round, port 5884) and after,
#   and the first-frame and CPU x4 costs of both.   ~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film1-run-all.sh
set -u
cd "$HOME/Dev/gasifier-lab"
OUT="$HOME/.cache/lab-review/gasifier-lab/film1"
mkdir -p "$OUT/flicker"; rm -f "$OUT/run-all.done"
SCENES=farm,tractor,gasifier,gas-train,garage
if [ "${ONLY:-all}" = "all" ]; then URL=http://localhost:5883/ node docs/qa/film1-stills.mjs docs/qa/film1-specs/after.json > "$OUT/after-stills.log" 2>&1; fi
for size in 1280x720 390x844; do
  W=${size%x*}; H=${size#*x}
  for side in before:5884 after:5883; do
    name=${side%:*}; port=${side#*:}
    URL=http://localhost:$port/ OUT="$OUT/flicker/$name-$size" WIDTH=$W HEIGHT=$H FRAMES=90 SCENES=$SCENES node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-$size.log" 2>&1
  done
done
# the same, drawn as a film capture draws (eight samples a frame, the occlusion pass): the picture the film is made of
for side in before:5884 after:5883; do
  name=${side%:*}; port=${side#*:}
  FILM=1 URL=http://localhost:$port/ OUT="$OUT/flicker/$name-film-1280x720" WIDTH=1280 HEIGHT=720 FRAMES=60 SCENES=$SCENES node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-film-1280x720.log" 2>&1
done
for side in before:5884 after:5883; do
  [ "${ONLY:-all}" = "flicker" ] && break
  name=${side%:*}; port=${side#*:}
  URL=http://localhost:$port/ OUT="$OUT/cost-$name.json" node docs/qa/film1-cost.mjs > "$OUT/cost-$name.log" 2>&1
done
echo done > "$OUT/run-all.done"
