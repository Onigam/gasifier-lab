# Gasifier lab, film round 3 (18/11/2026): the six items of the scoped review of round 2

`lab-modeler`, on `gasifier-lab` after `41a7859` (local `main`, status `building`, nothing pushed, `src/sim`, `src/data`, `narration/`, `status` and `public/` untouched). The review is `docs/qa.md`, « Film round 2: the scoped review » (0 blocker, 2 major, 5 minor), and its list for this round has six items, done here in its order. The film is `film-wood-gas-full` (« Sweden, 1943: 70,000 vehicles on wood or charcoal gas. Why did the gas not stop with the engine? »); the bar is the Piggott lab's 3D after its film round.

**No film was rendered and nobody has watched the lab at speed.** Every picture here is a still of a headless Chrome for Testing on Metal, clocks pinned at 30 frames a second, at 1280 × 720 with the kit's film look (eight samples a frame, the occlusion pass) and at 200 px wide; every figure « in motion » is the kit's flicker tool or a ray count in Node. **I do not review my own work: § 6 says what I did not check.** An independent review follows.

## 0. In short

- **Commits**: `1087032` (item 1), `90ad8fa` (2), `523e7f3` (3), `1c904fa` (4), `da5ab41` (5), `82ffa9a` (6), then the commit of this report, on top of `41a7859`, one an item and one for this report.
- **Gates**: typecheck 0, prettier pass, **574 tests pass** (553 before; 21 added, one adapted and said in § 6), the build passes.
- **Draw calls** (colour pass, Node): `farm` **495 → 431** (the limit stays 500; a new test holds 450), `garage` 404 → 388.
- **Shimmer** (§ 3): `farm` at 1280 2.91 / 6.23 → 2.55 / 4.36 % (orbit / dolly), in a frame that is nearer than it was; the other worlds in the table. **Some figures are higher than before, and § 3 says which and why.**
- **The three frames to look at first**: `docs/qa/film3-pair-1-farm.jpg` (the home view, the birches from above), `docs/qa/film3-pair-3-lid.jpg` (5b), `docs/qa/film3-pair-6-overview.jpg` (the farm as a visitor meets it at 1280, 768 and 390).

## 1. The six items, one by one

Each sheet: before (`41a7859`) | after, a row a pose, the 200 px version under each.

### 1a. The birch crowns' leaf cards: fixed (`film3-pair-1-farm.jpg`)

The four rectangles were not a mip level passing as solid: each was **one spray alone on a twig that stood out of the top of the crown** (the limbs' ends carried a spray each, and the highest limbs ended above the crown's ellipsoid), a card whose leaves filled its square. Three changes: a limb is shortened until its end is inside the crown; the spray on a limb's end is drawn in; and a spray is a lobed blob of leaves, so that the corners of every card are clear at every level of its mip chain and a card alone can no longer be a rectangle. Looked at from 15, 25, 32, 40 and 55 degrees at 110 m from the south (and 140 m from the north) and at round 1's own home pose: no rectangle, no card on a stick. **Left**: the birch crowns are rounder and denser than a birch's (a mass, less airy); the pines' crowns are still dark.

### 1b. The spruce band, the grass at the fence, the shimmer: in part (§ 3)

Measured first, by hiding things (§ 3): the 47 spruces of the first rows were a fifth of a point; the broad-leaved crowns and the pines were about half of the farm's figure. Done: the belt has depth (about 220 spruces in rows behind, drawn as one soft mass: shorter, lit nearly evenly, in nearly one green), so that the first row stands on dark and not on sky between its trees; a crown's leaves go to the crown's mean green between 26 and 75 m from the eye; the rushes of the ditch go down into the bank between 28 and 52 m and are never thinner than two pixels. Tried and taken out: the rows behind drawn like the first rows (they cost 0.8 point). **Left**: the saw of spruce tops against the sky is still the hottest part of the heat map (§ 3). **0a should stay a static frame or a very slow push.**

### 2. The two flights: fixed (`film3-pair-2-flights.jpg`)

The straight flight from the whole building to the 1940s set came down from 22 degrees of elevation and crossed the height of the slab between the storeys a hand from its edge. The building is now looked at from 12 degrees: the flight goes in under the slab, clear of it. The water gauge is looked at from 30 degrees up and not 12: the flight from the cylinder's view passes over the cylinder. Held in Node by a count of rays (no frame of the film's flights in `garage` and `gas-train` has a third of its rays on a surface at arm's length; on the old poses the same count gives 78 % of the frame on the slab and 60 % on the cylinder's pipe). The kit's flight tool: closed garage to the 1940s set, worst local ratio 1.73 → 1.20 and luma change at the worst frame 49 → 29; cylinder to water gauge, 1.85 → 1.14 and 66 → 25 (a pop is a ratio over 2; the two ratios over 2 that the tool still prints, 2.43 and 2.53, are at frames 75 and 77, after the arrival, the same as before and as in round 2). **Left**: with the engine stopped the flight to the set passes through the model's own gas at the intake (a white veil over half of two or three frames: gas, not a wall). The closed-garage frame is lower and tighter than it was (the building takes about a third of the width, it was a fifth): **a frame the film had has changed**.

### 3. 5b, the lid: in part (`film3-pair-3-lid.jpg`)

The lid is a pale steel plate with a bright rolled edge, under its dark yoke, spring and handle (it was as dark as the yoke); it closes on a pale cord on a seat welded round the casing's rim; with `lidLeak` it stands open by its whole lift while the gas pushes. The frame is a medium one (the lid a sixth of the picture's width, the filter box, the cab and the near wheel beside it), from 21 degrees up; the intake's gas is a fifth of itself and half a metre high: the wheel and the cab's foot are clear. **Left, plainly**: the gap is a finger's width and at this frame it is three or four pixels on the near side: it is there, it is not what the eye reads first. What reads is « a lid on a drum, with its yoke, gas round it ». A frame from the side would show the gap better and was not done: an existing test (`film2.test.ts`) holds that the camera looks down on the lid, and I kept it. The lid has no part id in `garage` (the data role's): the frame is still asked for through `[[frame:post-gas-plume]]` with `lidleak` on. The model's gas is untouched.

### 4a. The chips as wood: in part (`film3-pair-4-chips-line.jpg`)

No chip is a rectangle any more: one blank, shaped piece by piece in the vertex shader (the knife's slant at both ends, a ragged end, edges that are not parallel, a thick end and a feathered one, a bow), lit by its own faces, sizes from a half to the whole, about twice as many, the tones wider. **Left**: in the film's frames (two to three metres from the cut) a chip is a few pixels, in the key's false colours, lying flat on the cut face: it reads as irregular flakes, not yet as a heap of wood chips with thickness. The grain shows only from under a metre. The shadow pass draws the blank, not the shaped chip (a few millimetres of difference in a shadow).

### 4b. The gas line's home frame: in part (`film3-pair-4-chips-line.jpg`)

The camera aims low and forward of the line from 22 degrees up, a little from the unit's end; the ribbons lie 45 cm nearer the line, are deeper in colour than the slab, end in arrow heads and carry a pale chevron with a dark one behind it. **Left**: the line takes about half of the picture's width, not more: the ribbons lie in front of it and must be whole in the frame, and the cyclone stands between them and the line (a test holds that no ribbon lies under a part). To do better the cyclone or the ribbons must move: a decision for the lead.

### 5. The house's side: fixed; the garage's ground: in part (`film3-pair-5-garage.jpg`)

**The side, by moving the farm's garage** to the house's west gable. The unit is on the tractor's left and the tractor is parked nose in, so the unit's side of the garage is the side the `garage` world is cut open on; in the farm that side was the house's. Now the house is away from the unit in both worlds, on the same hand seen from the door, and at the same place to 20 cm. The ash bin, the barrel and three birches moved with it. **The ground**: a meadow with relief round the yard (7,000 tufts in patches, 90 stones, a worn track of two wheel lines from the lane to the apron), and a deeper green for the meadow of the four open worlds, with clover, dry turf and daisies near the eye. **Left**: from the film's frames the yard itself is still packed gravel with little on it, and the meadow at 20 m and more reads as green with darker patches and dots of tufts: better than the lawn, under the farm's field.

### 6a. The farm's app overview at 1280, 768 and 390: fixed (`film3-pair-6-overview.jpg`)

The kit framed the union of every part's box (80 m of ditch, the gas over the tractor): the overview is now the yard's box alone, from the south and low in a wide view, from 50 degrees up in a view taller than wide. Measured on the page (`docs/qa/film3-overview.mjs`, FR and EN): no label clipped at any of the three widths; the tractor at 0.24, 0.33 and 0.33 of the free view's width from its left edge at 1280, 768 and 390 (0.15, 0.34, 0.34 before: at 1280 it stood at the edge); the yard's buildings across 0.91, 0.80 and 0.77 of the free width (0.77, 0.47, 0.45 before) and 0.29, 0.20 and 0.31 of its height (0.26, 0.06, 0.10). « Clipped » is counted against the 3D view's own rectangle (none, before or after); that the barn's name is clear of the side panel at 768 was looked at on the screenshots. **The film's `[[home]]` of the farm is this camera too: 0a is nearer than it was** (sheet 1, first row).

### 6b. The farm's draw calls: fixed (§ 4)

495 → 431: the farm's garage is one mesh a material (68 calls → 41), the panes of the house are one mesh (19 → 1), and `merge.ts` knows two clones of one map laid the same way as one material. No limit was raised; a new test holds the farm at 450 at the most.

## 2. What I looked at in the browser

The stills of `docs/qa/film3-specs/item1.json` to `item5.json` (38 poses, before and after), each at full size for the after side: the farm's home and its evening; the farm from 110 m at 15, 25, 32, 40 and 55 degrees, with crops of the birches at 32, 40 and 55; the garage's flight at seven points and the gas line's at four; the whole building, the set, the gauge; 5b at 25 and at 76 model minutes, the plume without the leak, the lid in `gasifier`, the tractor at home; the section at home, at the column, the pyrolysis and the oxidation, and from half a metre; the gas line at home and at the filter; the farm's house and garage, the garage at home, from its door, closed, and from the height of a man in the yard. The farm's overview with the interface on, at 1280 × 800, 768 × 1024 and 390 × 844, in French and in English. The heat maps of the flicker tool (which pixels were counted).

## 3. Shimmer, measured

The kit's flicker tool (`docs/qa/film1-flicker.mjs`, 90 frames, a 5° orbit and a 20 % dolly at each world's home, orbit / dolly, the share of pixels whose change from frame to frame is not smooth), `41a7859` on one port → the working tree on the other, one run a side (the tool is deterministic on pinned clocks: the before column is round 2's « after » to the last digit). Largest spike 1.47 at 1280, 1.41 at 390 (a pop is over 2).

| World       | 1280 × 720                  | 390 × 844                   |
| ----------- | --------------------------- | --------------------------- |
| `farm`      | 2.91 / 6.23 → 2.55 / 4.36 % | 0.73 / 1.38 → 1.27 / 2.29 % |
| `tractor`   | 1.14 / 2.73 → 1.14 / 2.74 % | 0.67 / 2.06 → 0.68 / 2.07 % |
| `gasifier`  | 0.43 / 1.75 → 0.44 / 1.82 % | 0.89 / 3.60 → 0.90 / 3.72 % |
| `gas-train` | 0.66 / 2.51 → 1.60 / 2.36 % | 0.37 / 0.96 → 0.49 / 1.33 % |
| `garage`    | 1.85 / 5.69 → 1.87 / 5.72 % | 1.11 / 3.24 → 1.84 / 3.50 % |

**The home views are not the same pictures as before in `farm` (all widths) and `gas-train` (wide): both are nearer, on purpose (items 4 and 6), and the tool measures at home. A nearer subject has more edges on the screen.** World by world:

- **`farm`, 1280**: down on both moves, in a nearer frame. What is still counted (heat map): the saw of spruce tops against the sky, the boards of the house and the barn, the fence, and the tractor, which moves (a quarter of a point is its motion).
- **`farm`, 390: higher than before (0.73 / 1.38 → 1.27 / 2.29), and it is not the same picture.** Before, the farm was under half of the frame's width in a strip between a field and a sky; now it is seen from 50 degrees up and its trees and buildings fill the width. More of the frame is trees. I did not find a way to fill the frame and keep the old figure.
- **`tractor`: unchanged** (nothing of its picture changed but the meadow's green). The heat map says what is counted: the machine's own edges (the cab's bars, the rack, the lugs, the pipes: they sweep on an orbit), the gravel under the eye in the bottom third of the frame, the wheels that turn and the ground that runs (the engine runs at home: motion), the clusters at the horizon. It cannot be lower without taking detail or contrast off the machine, or stopping it.
- **`gasifier`: unchanged within a tenth of a point** (twice as many chips cost 0.06 on the dolly at 1280 and 0.12 at 390).
- **`gas-train`, 1280: the orbit is up (0.66 → 1.60), the dolly a little down.** The home is nearer on purpose (the box of the line's pieces is about one and a half times larger on the screen), and the heat map is the line's own edges. Softer chevrons on the ribbons changed nothing (1.60 with them at 0.46 of white, 1.60 at 0.36): it is not the ribbons. At 390: 0.37 / 0.96 → 0.50 / 1.33 (the ribbons are nearer the line, deeper in colour, with arrow heads).
- **`garage`, 1280: unchanged** (the boards of the house, of the door and of the lining: lines a few pixels apart that sweep). **At 390 the orbit is up (1.11 → 1.84)**: the heat map shows the tufts of the meadow in the foreground at the bottom of the tall frame (at 390 the camera stands back, in the meadow): near things that cross the picture on an orbit, which the tool counts as it counts any motion. Fewer tufts that fade nearer the eye (7,000 gone by 34 m instead of 9,000 by 46 m) did not lower it (1.72 → 1.84).
- Against the 1.6 % orbit of the ram-pump site (the kit's reference) at 1280: under it `tractor` and `gasifier`; at it `gas-train`; over it `garage` (1.87) and `farm` (2.55).

**What the farm's diagnosis said** (the tool with objects hidden, 1280, the new home view): everything, with the rows behind drawn like the first rows, 3.46 / 5.23; without the rows behind 2.64 / 4.72; without any spruce 2.47 / 4.35; without any tree 0.90 / 2.76; without the tractor and its crusher (which move: motion, not shimmer) 3.21 / 4.72. So the first rows of spruce are 0.2 point, the broad-leaved crowns and the pines about 1.6, the rest of the picture (the buildings' boards, the fence, the walls, the tractor) 0.9.

## 4. Budgets and cost

Colour pass in Node (`drawStats`), `41a7859` → now:

| World       | Draw calls | Triangles         | Build in Node |
| ----------- | ---------- | ----------------- | ------------- |
| `farm`      | 495 → 431  | 373,000 → 450,000 | 0.48 → 0.46 s |
| `tractor`   | 268 → 268  | 126,000 → 150,000 | 50 → 47 ms    |
| `gasifier`  | 119 → 119  | 64,000 → 337,000  | 12 → 14 ms    |
| `gas-train` | 267 → 267  | 97,000 → 121,000  | 27 → 29 ms    |
| `garage`    | 404 → 388  | 153,000 → 232,000 | 55 → 60 ms    |

The limits of `worlds.test.ts` are unchanged. **Triangles rose**: the chips of the section are shaped blanks (56 triangles a chip, about 5,100 chips: the `gasifier` world's count is five times what it was, under its limit of 400,000), the loose chips on the column in every world that draws the unit, the rows of spruce behind the belt (80,000), the tufts and stones of the garage's meadow (60,000).

Cost on the phone profile (headless Chrome on Metal at 390 × 844, pixel ratio 2, the CPU slowed 4 times by the DevTools protocol; a proxy, the GPU is not slowed; `docs/qa/film1-cost.mjs`; the median of 6 fresh pages a world, two runs of 3), first frame after the switch 1× / 4×, mean of the next 40 frames 1× / 4×, before → after:

| World       | First frame (ms)      | Mean frame (ms)       |
| ----------- | --------------------- | --------------------- |
| `farm`      | 90 / 170 → 90 / 156   | 2.2 / 8.6 → 1.7 / 5.5 |
| `tractor`   | 84 / 265 → 86 / 276   | 1.9 / 6.9 → 1.9 / 6.5 |
| `gasifier`  | 117 / 222 → 120 / 226 | 0.8 / 3.5 → 0.8 / 3.5 |
| `gas-train` | 94 / 240 → 98 / 242   | 2.0 / 6.8 → 1.9 / 6.2 |
| `garage`    | 114 / 334 → 138 / 402 | 2.8 / 9.8 → 2.5 / 9.8 |

The frame's cost is the same or lower in every world (the farm's is a third lower at 4×: 64 draw calls fewer). The first frame is within noise in four worlds. **The garage's first frame is a fifth slower (114 / 334 → 138 / 402 ms): not neutral.** The meadow's two new materials are compiled there and its tufts are placed. After this measure the placing of the tufts was made cheaper (the noise that says where the rough grass is thick is read once on a grid: the garage's build in Node went from about 68 ms to about 60, for 55 before the round); **that last state was not measured again in the browser** (the Mac's Chrome lock was held by a long render). **Not measured: a real phone, Safari, Firefox.**

## 5. Against the Piggott bar, per world, honestly

The reference: `onigam-video/renders/piggott-lab/2026-11-16-short-1-c/qa/` (a hero object that fills a graded dark set, grain on the blades, the hub's nuts). Beside it: `docs/qa/film3-piggott-compare.jpg` (a Piggott frame, then our 5b, our farm at home, our gas line at home and our section from half a metre).

| World       | Where it stands after this round                                                                                                                                           | Under the bar                                                                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `farm`      | Was the lowest. The home view fills the frame with the yard under a belt of forest, the tractor a tenth of the width with its column of gas; no rectangle from any height  | **Still the lowest.** The trees are stacked cones and blobs of leaf cards, the walls board maps without relief, the field a painted surface under saw-toothed shadows. Piggott's frame is one object with its matter; ours is forty toy trees. It reads; it has not the polish |
| `tractor`   | Unchanged but for the lid and the meadow's green                                                                                                                           | As round 2: no rivets on the cab, plain hoses, a gravel map                                                                                                                                                                                                                    |
| `gasifier`  | The bed is flakes of many shapes and sizes, lit by their faces                                                                                                             | The chips are false-coloured flakes on a flat face, not a heap; the frame is a machine on a slab in daylight, no graded set                                                                                                                                                    |
| `gas-train` | The home frame is the line and its ribbons, with arrow heads that read at 200 px                                                                                           | The line is half the width, not a hero; the ribbons are a diagram on a floor                                                                                                                                                                                                   |
| `garage`    | The nearest to the bar: the door (5c), the lid's medium frame with its cord, its plate and its yoke, the house on the right side; the meadow has tufts, stones and a track | The gap under the lid is a few pixels; the gas is sprites; the yard's gravel is bare; the meadow is green with patches from 20 m                                                                                                                                               |

## 6. NOT done, NOT checked, said plainly

1. **Not rendered, not watched at speed**: no frame of the film's own driver, no 60 frames a second, no real phone, no Safari, no Firefox.
2. **The farm's shimmer** (§ 3): the saw of spruce tops against the sky is still there; 0a static or a very slow push.
3. **The gap under the lid** is small in the frame (item 3); a side view was not done.
4. **The chips** are irregular flakes, not a heap of wood with thickness (item 4a).
5. **The gas line at home** is half the width (item 4b).
6. **The yard's gravel** in `garage` has no relief; only the meadow has (item 5).
7. **Not looked at**: the worlds other than the farm at 768 and 390 with the interface (the gas line's tall overview is given its own box: not seen in a browser); the labels of the minor parts in the farm after the garage, the bin and the barrel moved (only the four main names were counted: none clipped, none on another by eye); the spoken guide played against the new places (its text names no side: read, not played); the explode and X-ray of every world after the lid's and the chips' changes, beyond the tests; the farm's « Flux » dots to the bin and the barrel at their new places, beyond the tests; the evening (`?hour=20`) beyond one still; the walk of every part of every world (`walk.mjs`) was not run again.
8. **The flight test is a count of rays in Node**, with the kit's pose arithmetic copied (kit request 27): it does not see the gas, the transparent things, or what the film's driver does differently.
9. **The meadow's deeper green changes every open world's ground** (`tractor`, `gasifier`, `gas-train`, `garage`): seen on the stills of this round, not compared with round 2's for every pose.
10. **A test of an earlier round was adapted** (`dims.test.ts`: « the farm sits on the research's plan » held the garage beyond the house's east gable; it now holds it beyond the west one): the design it held changed on purpose (item 5; the research gives no plan of the farm). No other existing test was touched.
11. **The commits were cut from one working tree**: the Mac's Chrome lock was held for forty minutes at a time by other jobs, so the six items were developed side by side and the commits made at the end, one an item, each state rebuilt in a clean copy and passing typecheck, prettier and the whole suite before its commit (561, 563, 565, 570, 572, 574 tests). The browser measurements are of the last state only.
12. **Requests 7 and 9 of round 1** (the analyser's end point, the showcase card) are not mine and are as they were.

## 7. What I found that the review did not

- The rectangles over the birches were sprays alone on twigs, not a mip level (round 2's own chain is right and is kept; it was not the cause of these four).
- The kit frames the union of every part's box: the farm's overview box had never been what was framed (it only ever made the union larger). Kit request 28.
- `mergeStatic` told two materials apart by the uuid of their maps, and `tiled()` clones the map for every mesh: materials that draw the same pixels were never merged (five hoops of one barrel were five calls).
- The gas line is seen from the front with the unit on the right: the gas flows from right to left on the screen, and so do the ribbons. Not changed (every part's view and the ribbons' place follow from it); said for the film.
- The Mac's Chrome lock starves its waiters (kit request 30).

## 8. How to redo it

```
npm run dev -- --port 5887 --strictPort                        (and a copy of the tree at 41a7859 on 5888)
~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film3-run.sh item1      (item1 … item5: the stills, after and before; or: flicker, flight, overview, cost)
bash docs/qa/film3-sheets.sh                                    (the before | after sheets of docs/qa/)
npm run typecheck && npm test && npm run build && npm run format:check
```
