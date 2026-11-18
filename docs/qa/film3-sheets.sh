#!/bin/bash
# The before | after sheets of the film round 3, from the stills of docs/qa/film3-run.sh (before: the tree at 41a7859, after: the working tree), each row with its 200 px version; and the farm's overview at the three widths.
set -u
cd "$HOME/Dev/gasifier-lab"
R="$HOME/.cache/lab-review/gasifier-lab/film3"
pair() { BEFORE_TAG=b AFTER_TAG=c python3 docs/qa/film1-pair.py "$R/before" "$R/after" "docs/qa/$1" "${@:2}"; }
pair film3-pair-1-farm.jpg farm-0a-home farm-aerial-32 farm-aerial-40 farm-aerial-55
pair film3-pair-2-flights.jpg garage-path-t87 garage-1-closed-garage train-path-t80 train-3-gauge
pair film3-pair-3-lid.jpg garage-5b-lid garage-5b-lid-late
pair film3-pair-4-chips-line.jpg gasifier-chips-close gasifier-2-pyrolysis train-3-home
pair film3-pair-5-garage.jpg farm-0b-house-garage garage-1-home garage-5c-door garage-lawn-low
python3 - <<'PY'
import os
from PIL import Image, ImageDraw
R = os.path.expanduser('~/.cache/lab-review/gasifier-lab/film3')
H = 520
cells = []
for w in (1280, 768, 390):
    for side in ('before', 'after'):
        im = Image.open(f'{R}/overview-{side}/farm-{w}-fr.png').convert('RGB')
        im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
        cells.append((f'{w} px, {side}', im))
W = sum(im.width for _, im in cells) + 8 * (len(cells) - 1)
sheet = Image.new('RGB', (W, H + 18), (30, 30, 30))
d = ImageDraw.Draw(sheet)
x = 0
for label, im in cells:
    d.text((x + 4, 3), label, fill=(255, 255, 255))
    sheet.paste(im, (x, 18))
    x += im.width + 8
sheet.save('docs/qa/film3-pair-6-overview.jpg', quality=86)
print('docs/qa/film3-pair-6-overview.jpg', sheet.size)
PY
