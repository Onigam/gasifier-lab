#!/usr/bin/env python3
"""Before and after side by side, with the 200 px version of each under it: python3 film1-pair.py <before dir> <after dir> <out.jpg> name1 name2 ...
The pictures are <dir>/b-<name>.png and <dir>/a-<name>.png (and the -200px ones); the tags are BEFORE_TAG and AFTER_TAG in the environment (film round 2: `b` and `c`)."""
import sys, os
BT = os.environ.get('BEFORE_TAG', 'b')
AT = os.environ.get('AFTER_TAG', 'a')
from PIL import Image, ImageDraw
bd, ad, out = sys.argv[1:4]
names = sys.argv[4:]
W = 640
rows = []
for n in names:
    cells = []
    for d, p in ((bd, BT), (ad, AT)):
        f = os.path.join(d, f'{p}-{n}.png')
        if not os.path.exists(f):
            cells.append(None); continue
        im = Image.open(f).convert('RGB')
        im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        s = os.path.join(d, f'{p}-{n}-200px.png')
        sm = Image.open(s).convert('RGB') if os.path.exists(s) else None
        cells.append((im, sm))
    rows.append((n, cells))
h = max(c[0].height for _, cs in rows for c in cs if c) + 112 + 18
sheet = Image.new('RGB', (2 * W, h * len(rows)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for r, (n, cells) in enumerate(rows):
    y = r * h
    dr.text((4, y + 3), f'{n}   (before | after, then the same at 200 px)', fill=(255, 255, 255))
    for k, c in enumerate(cells):
        if not c: continue
        im, sm = c
        sheet.paste(im, (k * W, y + 18))
        if sm:
            sm2 = sm.resize((200, round(sm.height * 200 / sm.width)))
            sheet.paste(sm2, (k * W + 4, y + 18 + im.height + 4))
sheet.save(out, quality=88)
print(out, sheet.size)
