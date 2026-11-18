#!/bin/bash
# Film round 4's browser work in one job under the Mac's lock: stills (after: the working tree on 5891; before: a copy of 41a7859 on 5892), the programs a visit compiles, the overview on a first visit, the farm's spoken guide, the flicker tool with
# heat maps, the first-frame cost (the garage and the farm, three pages a run, two runs a side, before and after alternating).
#   ~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film4-run.sh [stills,programs,overview,guide,flicker,cost]
set -u
cd "$HOME/Dev/gasifier-lab"
OUT="$HOME/.cache/lab-review/gasifier-lab/film4"
WHAT=${1:-stills,programs,overview,guide,flicker,cost}
mkdir -p "$OUT/log" "$OUT/flicker" "$OUT/cost"
has() { [[ ",$WHAT," == *",$1,"* ]]; }
A=http://localhost:5891/
B=http://localhost:5892/
if has stills; then
  URL=$A node docs/qa/film1-stills.mjs docs/qa/film4-specs/frames.json > "$OUT/log/stills-after.log" 2>&1
  sed 's#film4/after#film4/before#; s#"tag": "c"#"tag": "b"#' docs/qa/film4-specs/frames.json > "$OUT/frames-before.json"
  URL=$B node docs/qa/film1-stills.mjs "$OUT/frames-before.json" > "$OUT/log/stills-before.log" 2>&1
fi
if has programs; then
  URL=$A OUT="$OUT/programs-after.json" node docs/qa/film4-programs.mjs > "$OUT/log/programs-after.log" 2>&1
  URL=$B OUT="$OUT/programs-before.json" node docs/qa/film4-programs.mjs > "$OUT/log/programs-before.log" 2>&1
fi
if has overview; then URL=$A OUT="$OUT/overview" node docs/qa/film4-overview.mjs > "$OUT/log/overview.log" 2>&1; fi
if has guide; then
  for l in fr en; do URL=$A OUT="$OUT/guide" LANG_=$l node docs/qa/film4-guide.mjs >> "$OUT/log/guide.log" 2>&1; done
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
  for run in 1 2; do
    WORLDS=garage,farm URL=$B OUT="$OUT/cost/before-$run.json" node docs/qa/film1-cost.mjs > "$OUT/log/cost-before-$run.log" 2>&1
    WORLDS=garage,farm URL=$A OUT="$OUT/cost/after-$run.json" node docs/qa/film1-cost.mjs > "$OUT/log/cost-after-$run.log" 2>&1
  done
fi
echo done
