#!/bin/bash
# The film round 2's measurements, one Chrome job at a time under the Mac's lock (every agent shares it):
#   the stills at the film's poses before (a copy of the tree at 046da61, port 5886) and after (the working tree, port 5885), the garage's and the farm's flights,
#   the kit's flicker tool three times a side and size (docs/qa/film1-flicker.mjs), once more as a film capture draws, and the first-frame and CPU x4 costs twice a side.
#   ~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film2-run.sh        (ONLY=stills|stopped|flight|flicker|cost to run one part)
set -u
cd "$HOME/Dev/gasifier-lab"
OUT="$HOME/.cache/lab-review/gasifier-lab/film2"
mkdir -p "$OUT/flicker" "$OUT/cost"
rm -f "$OUT/run.done"
ONLY=${ONLY:-all}
want() { [ "$ONLY" = all ] || [ "$ONLY" = "$1" ]; }
SCENES=farm,tractor,gasifier,gas-train,garage
if want stills; then
  sed 's#film2/after#film2/before#; s#"tag": "c"#"tag": "b"#' docs/qa/film2-specs/after.json > "$OUT/before.json"
  URL=http://localhost:5885/ node docs/qa/film1-stills.mjs docs/qa/film2-specs/after.json > "$OUT/after-stills.log" 2>&1
  URL=http://localhost:5886/ node docs/qa/film1-stills.mjs "$OUT/before.json" > "$OUT/before-stills.log" 2>&1
fi
if want stopped; then
  # the stopped tractor while the model's gas share is high (0.88, 0.61, 0.47 at 5, 20 and 30 model minutes after the stop: the clock of the lab's default runs at 60 s a second)
  sed 's#stopped-after#stopped-before#; s#"tag": "c"#"tag": "b"#' docs/qa/film2-specs/stopped.json > "$OUT/stopped-before.json"
  URL=http://localhost:5885/ node docs/qa/film1-stills.mjs docs/qa/film2-specs/stopped.json > "$OUT/stopped-after.log" 2>&1
  URL=http://localhost:5886/ node docs/qa/film1-stills.mjs "$OUT/stopped-before.json" > "$OUT/stopped-before.log" 2>&1
fi
if want flight; then
  for side in before:5886 after:5885; do
    name=${side%:*}; port=${side#*:}
    URL=http://localhost:$port/ OUT="$OUT/flight-$name.json" SCENES=garage,farm node docs/qa/film2-flight.mjs > "$OUT/flight-$name.log" 2>&1
  done
fi
if want flicker; then
  for run in 1 2 3; do
    for size in 1280x720 390x844; do
      W=${size%x*}; H=${size#*x}
      for side in before:5886 after:5885; do
        name=${side%:*}; port=${side#*:}
        URL=http://localhost:$port/ OUT="$OUT/flicker/$name-$size-run$run" WIDTH=$W HEIGHT=$H FRAMES=90 SCENES=$SCENES node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-$size-run$run.log" 2>&1
      done
    done
  done
  for side in before:5886 after:5885; do
    name=${side%:*}; port=${side#*:}
    FILM=1 URL=http://localhost:$port/ OUT="$OUT/flicker/$name-film-1280x720" WIDTH=1280 HEIGHT=720 FRAMES=60 SCENES=$SCENES node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-film-1280x720.log" 2>&1
  done
fi
if want cost; then
  for run in 1 2; do
    for side in before:5886 after:5885; do
      name=${side%:*}; port=${side#*:}
      URL=http://localhost:$port/ OUT="$OUT/cost/$name-run$run.json" node docs/qa/film1-cost.mjs > "$OUT/cost/$name-run$run.log" 2>&1
    done
  done
fi
echo done > "$OUT/run.done"
