#!/usr/bin/env python3
"""A contact sheet of the stills of a run: python3 film1-sheet.py <dir> <prefix> <out.jpg> [cols] [width] name1 name2 ...
Names are the shots' names; each cell is the picture and its 200 px version beside it."""
import sys, os
from PIL import Image, ImageDraw
d, prefix, out = sys.argv[1:4]
cols = int(sys.argv[4]); cw = int(sys.argv[5]); names = sys.argv[6:]
cells = []
for n in names:
    p = os.path.join(d, f"{prefix}-{n}.png")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB")
    h = round(im.height * cw / im.width)
    cells.append((n, im.resize((cw, h), Image.LANCZOS)))
if not cells: sys.exit("nothing")
ch = max(c[1].height for c in cells) + 18
rows = (len(cells) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw, rows * ch), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(cells):
    x, y = (i % cols) * cw, (i // cols) * ch
    sheet.paste(im, (x, y + 18)); dr.text((x + 4, y + 3), n, fill=(255, 255, 255))
sheet.save(out, quality=88)
print(out, sheet.size)
