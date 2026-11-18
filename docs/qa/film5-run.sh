#!/bin/bash
# Film round 5's browser work under the Mac's lock: stills (after: the working tree on 5891; before: a clone of 4599d15 = ecd18fc's code on 5892), the first-visit label count (the reviewer's `m1b.mjs`, copied into the scratch tools),
# the programs a visit compiles, the flicker tool, the first-frame cost.
#   ~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film5-run.sh [stills,m1b,programs,flicker,cost]
set -u
cd "$HOME/Dev/gasifier-lab"
OUT="$HOME/.cache/lab-review/lab-modeler/gasifier-lab/film5"
TOOLS="$OUT/tools"
WHAT=${1:-stills,m1b,programs,flicker,cost}
mkdir -p "$OUT/log" "$OUT/flicker" "$OUT/cost"
has() { [[ ",$WHAT," == *",$1,"* ]]; }
A=http://localhost:5891/
B=http://localhost:5892/
if has stills; then
  for s in frames frames-390 frames-900; do
    URL=$A node docs/qa/film1-stills.mjs docs/qa/film5-specs/$s.json > "$OUT/log/stills-$s-after.log" 2>&1
    if [ -n "${BEFORE:-}" ]; then
      sed 's#film5/after#film5/stills-before#; s#"tag": "a"#"tag": "b"#' docs/qa/film5-specs/$s.json > "$OUT/$s-before.json"
      URL=$B node docs/qa/film1-stills.mjs "$OUT/$s-before.json" > "$OUT/log/stills-$s-before.log" 2>&1
    fi
  done
fi
if has m1b; then
  URL=$A OUT="$OUT/m1b" MODES=0 node "$TOOLS/m1b.mjs" > "$OUT/log/m1b-after.log" 2>&1
fi
if has programs; then
  URL=$A OUT="$OUT/programs-after.json" node docs/qa/film4-programs.mjs > "$OUT/log/programs-after.log" 2>&1
  URL=$B OUT="$OUT/programs-before.json" node docs/qa/film4-programs.mjs > "$OUT/log/programs-before.log" 2>&1
fi
if has flicker; then
  for size in 1280x720 390x844; do
    W=${size%x*}; H=${size#*x}
    for s in after:5891 before:5892; do
      name=${s%:*}; port=${s#*:}
      HEAT=1 URL=http://localhost:$port/ OUT="$OUT/flicker/$name-$size" WIDTH=$W HEIGHT=$H FRAMES=90 SCENES=${SCENES:-farm,gasifier,gas-train,garage} node docs/qa/film1-flicker.mjs > "$OUT/flicker/$name-$size.log" 2>&1
    done
  done
fi
if has cost; then
  # every world after (the budget is per world); the garage against ecd18fc's code (5892) and 41a7859 (5893, a clone in the scratch directory), alternating
  for run in 1 2; do
    WORLDS=garage URL=http://localhost:5893/ OUT="$OUT/cost/base-$run.json" node docs/qa/film1-cost.mjs > "$OUT/log/cost-base-$run.log" 2>&1
    WORLDS=garage URL=$B OUT="$OUT/cost/before-$run.json" node docs/qa/film1-cost.mjs > "$OUT/log/cost-before-$run.log" 2>&1
    URL=$A OUT="$OUT/cost/after-$run.json" node docs/qa/film1-cost.mjs > "$OUT/log/cost-after-$run.log" 2>&1
  done
fi
echo done
