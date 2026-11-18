# Gasifier lab, film round 5 (18/11/2026): the scoped review of round 4, item by item

`lab-modeler`, on `gasifier-lab` after `4599d15` (local `main`, status `building`, nothing pushed; `src/sim`, `src/data`, `narration/`, `public/`, the part ids and the physics untouched). The review is `docs/qa.md`, « Film round 4: the scoped review » (0 blockers, 4 majors, 11 minors). **I do not review my own work: an independent review follows.** Every figure below is one I ran in this round, with its command; what I did not measure is in § 6.

## 0. In short

- **Commits** (on `4599d15`): `70661e2` (N3, the cyclone's ring), `cacf62b` (N2, the 5b wedge, the comment), `f8410f5` (N1, M1, the drum, the gas column, the trees in the rays test), then the notes, the tools and this report.
- **Gates**: typecheck 0, `format:check` pass, the runner's line **« Tests 693 passed (693) »** (« Test Files 43 passed (43) »; 657 at `4599d15`), build passes (one chunk 1,575.25 kB, 481.65 kB gzip, the > 1500 kB warning as before). Each of the three code commits checked out alone in a scratch clone: typecheck 0 and 664, 668, 693 tests passed. No `node_modules/node_modules` in this repository.
- **Draw calls** (Node, `drawStats`; triangles): `farm` **430** (449,181), `tractor` 268 (150,078), `gasifier` 119 (346,042), `gas-train` 267 (120,529), `garage` 388 (232,064). The farm lost one (the drum is one mesh fewer than the cask); nothing went up.
- **Programs, first frame, shimmer**: § 2.
- **Frames to look at first**: `docs/qa/film5-pair-2-farm-garage.jpg`, `docs/qa/film5-pair-1-line.jpg` (the app at 1280 with its panel), `docs/qa/film5-pair-3-yard.jpg`, `docs/qa/film5-pair-4-lid.jpg`, `docs/qa/film5-pair-6-farm.jpg`.

## 1. The worklist

1. **N3, the gas line's home with the panel open: DONE.** The cause was not an inset (the kit's insets are top and bottom only): with the panel open at 1280 the canvas itself is narrower (about 5:4), and the kit fits a wide view by its height, so the line kept the film's distance and lost its sides, the cyclone first; at 1280 × 800 with the panel closed (1.6) the cyclone's ring was already cut. `homePaddingFor` (`gastrain/scene.ts`) stands back in proportion below 16:9 so that across the view holds what the film's frame holds; **the film's 16:9 home is unchanged** (same eye, same 55 % / 66 % frame the reviewer measured). Seen: the app at 1280 FR with its panel open shows the cyclone and its ring inside the free view, by the panel's edge (`docs/qa/film5-pair-1-line.jpg`, row 1; before: only the ring's edge); at 900 × 720 (5:4, the stills tool) the whole line, the ribbons and the cyclone (row 2: before, the cyclone and the ribbons' end were cut); 16:9 and 390 unchanged (rows 3–4). **The ring under the fan's stand: DONE**: the cyclone stands 0.3 m further out (`CYCLONE_AT` (-1.0, -1.35)) and its ring is 0.46 m in radius (`CYCLONE_RING`), 0.43 m clear of the fan's stand. Test: `film5-line.test.ts` plays the kit's fit at 16:9, 1.6, 1.25, 1.1 and 1.0 (the cyclone, its ring, the exhaust and the stack inside 0.97 of the picture; 4 of these fail with round 4's padding), and holds the ring 0.3 m clear of the stand.
2. **N1, `[[frame:farm-garage]]` and film 0b: DONE.** The frame looks from the south-west, bearing 310, 14 degrees up, on the garage's ground floor (a `PartFraming.frame` box round its walls and the door, 4 m high): the camera stands 18.5 m out (28.6 before). On the still (`docs/qa/film5-pair-2-farm-garage.jpg`) the garage and its red door lead the left half, the house steps back on the right, the barrel and the bin stand in front of the garage's corner; no crown in the foreground, the barn whole. Three birches stood where the frame now looks from or across ((-37, -1), (-35.5, -8.5), (-45, 5)): they grow further out, behind the garage ((-40, -12), (-36, -19.5), (-50, -6)); the ditch's own frame looks from due north (from 190 the linden by the barn stood 25 m from the eye in a 54 m view). **Tests**: `film4-guide-rays.test.ts` now counts instanced meshes (trees, tufts, chips) among what can hide a part (all 70 cases still pass); `film5-farm-crowns.test.ts` shoots every farm part's frame (the ten click and cue frames, so every farm `[[frame:…]]` cue) at 16:9 and 390 × 844 with rays against the trees: no single tree before the part takes a tenth of the picture, no crown nearer the eye than half the way to the part. **Round 4's pose fails it** (a birch covers 20 % of the picture: checked in a clone of `4599d15`). **The pose the film should use for 0b: `[[frame:farm-garage]]` itself.** At 390 the garage leads too, over a strip of wall and meadow (row 2).
3. **N2, the yard in film 5c and the guide's door frame: DONE, and a cause the review did not name.** The grass « at the slab's foot » and the chips were computed round the yard's first plan of the slab (x ±5.2 m), while the garage lays its apron out again at the room's width (±3.1 m for the small garage): the band grew two metres off the concrete, which is the straight green L. The slab's plan is now a uniform (`uYardSlab`) that `fitSlab` sets. Chips: slivers of many sizes (about 1 to 4 cm), turned every way, in drifts, paler and darker, **none on the water or its wet rim** (`× (1 − yardWet) × (1 − wetRim)`); grass in clumps whose reach (0.3 to 1.4 m) and whose edge against the driven band are broken by noise; the puddle 2.5 m further out (9.2, -3.2), out of the door's frame at 16:9 and 390 by the kit's pose (on the phone's home it is still there). **Same program**: the garage is 131 programs as before. Seen: `docs/qa/film5-pair-3-yard.jpg` (5c: no puddle, no dots, no L; the low yard view: slivers along the apron and green clumps at its edge). Test: `film5-garage.test.ts` (the uniform matches the laid-out slab, the chip and foot terms, the puddle out of the door's frame; the puddle test fails with round 4's place).
4. **M1, labels on a first visit: DONE at the overview, IN PART in the install steps.** The 3D label is a separate field (`HotspotDef` in `farm/scene.ts`, mine; the sheets read `src/data` and `part-ids.ts`, untouched): « Grange » and « Tracteur gazogène » in French; the English names were already short. The step « Ce que la journée laissait » now frames the bin, the barrel and the ditch's stretch south of them (`WorldRegistry.stretch`: the ditch framed with other parts is its 4 m stretch there; a click on the ditch alone, its sheet's box and the overview are unchanged); the bin and the barrel are small but in the middle, and the tractor is out of the frame (`docs/qa/film5-pair-5-labels.jpg`). Kit request 34 asks for a step's own (minor) parts to be named during the step; the registry cannot do it. **Counts** (the reviewer's `m1b.mjs`, fresh context a page, language set before load, no reframing; clipped labels):

   | Width | Overview FR (before) | Overview EN | Install FR (before) | Install EN (before) |
   | ----- | -------------------- | ----------- | ------------------- | ------------------- |
   | 1280  | 0 (0)                | 0 (0)       | 3 (3)               | 5 (4)               |
   | 768   | **0 (1)**            | 0 (0)       | 7 (9)               | 6 (5)               |
   | 390   | **0 (1)**            | 0 (0)       | 5 (7)               | 6 (5)               |

   **Target met at the overview (0 everywhere).** Step 8: the tractor's name is gone at every width and language; what is clipped there now is the house's name at the frame's right edge (« Maison » +78 px of 80 at 768 and 390 FR; « Farmhouse » +99 / +98 of 100 and « Farm garage » +9 / +4 at 768 / 390 EN): a name almost wholly outside, the edge case of kit request 33. Unchanged and older: « Ligne de gaz / Gas line run » (step 3, +74 / +97 px), « Colonne de plaquettes » (+16 to +24 px), and at 1280 step 4 (« Tracteur gazogène » +163 of 170 FR, the moving tractor). The English install counts went up by one at 768 and 390: the house's and the garage's names at step 8's new frame.

5. **The 5b wedge: DONE, and the cause is not the plume's sprites.** Hiding each plume's sprites one by one, and all of them, in the film look left the wedge; switching the film look's ambient occlusion off took it away (`~/.cache/lab-review/lab-modeler/gasifier-lab/film5/probe5b-before/looks.png`). The plume's click volume (a transparent ellipsoid at opacity 0) was drawn as a solid by the kit's GTAO normal pass, which draws every mesh that writes colour; its occlusion was the pale straight-edged wedge. The volume now writes no colour (`colorWrite: false`), which that pass leaves out; a click still finds it. Seen: `docs/qa/film5-pair-4-lid.jpg` (no wedge; the gas over the lid and at the intake still reads as gas at 200 px). Test: `film5-garage.test.ts`. Kit request 35. (The reviewer's « hiding all plume dots removes it » was most likely the group with its volumes.)
6. **The first-frame budget and kit request 31: DONE (written down, measured); the garage NOT brought back within +10 % of `41a7859`.** The budget is in `docs/3d.md`, « First frame after a switch », with this round's figures for the five worlds (§ 2). Kit request 31 has the measurements (a switch of about 150 ms falling to about 20 ms after 8 s idle, the review's; the garage this round). The garage is flat against round 4 and +12.7 % at 4× against `41a7859`; the reason is written down (the programs are `41a7859`'s; the meadow and yard are built in the switch's frame, about 6 ms of the garage's 60 ms build in Node). I did not move the meadow's build out of that frame (a world that grows its tufts a frame later, and tests that would have to step twice): the cure is request 31.
7. **Minors.**
   - `GARAGE_HOME` and `WALL_CLEARANCE`'s comment: **DONE**.
   - **The barrel: DONE, the 3D now matches the sheet.** `docs/research.md` gives no material for it (§3, `condensate-barrel`: « black water, phenols »); its sheet (data role) says « a sheet-metal drum on two battens », and a steel drum is what a farm of 1970 kept black, phenolic water in (a wooden cask soaks it up and leaks). The barrel is a 200-litre steel drum (`FARM.drum`, estimate: Ø 586 mm over the chimes, 880 mm), chimes, two rolling hoops, two bungs in their flanges, a faded red paint gone to rust (a dark blue drum was a black cylinder in the yard's shade at 200 px), the black run down from the filling bung, on its two battens; the « Flux » arc ends a hand over its head. **No finding left for the data role.**
   - **The 0a gas column: IN PART.** A plume from a mouth now fills its cone (on its surface alone a column seen from the side was a hollow cone, dense at its edges), the stopped tractor's gas and the chimney's smoke lean with a light wind and thin as they rise, the intake's column is narrower (spread 1.5, puffs 1.9 m), the lid's share a low puff at its foot. The column is smaller and leans (`docs/qa/film5-pair-6-farm.jpg`, row 2); **its top still has a shallow notch** at 1280: not two columns side by side (the lid's puff is low now), cause not found.
   - **Chips as a heap: NOT DONE** (the film has no chip close-up; the gasifier is at 119 draw calls, its limit).
   - **The spruce saw: NOT DONE.** A second spruce shape costs draw calls (the farm is at 430 of 431) and a shader variation of the crowns a program; neither was allowed this round.

## 2. The hard rules, measured

- **Programs** (`docs/qa/film4-programs.mjs`, phone profile, fresh page, tab order): after 91 / 99 / 120 / 127 / **131**, before (`4599d15`'s code on 5892, same job) 91 / 99 / 120 / 127 / 131. No program added.
- **Draw calls**: § 0 (farm 430, the others unchanged).
- **First frame** (`docs/qa/film1-cost.mjs`, 390 × 844, pixel ratio 2; two runs of three fresh pages, `41a7859` (a clone on 5893), `4599d15` (5892) and this tree (5891) alternating; median (range) of six, ms):

  | World       | after 1×        | after 4×        | before 1× / 4×                | `41a7859` 1× / 4×             |
  | ----------- | --------------- | --------------- | ----------------------------- | ----------------------------- |
  | `garage`    | 124.5 (120–129) | 381 (375–389)   | 125 (119–132) / 382 (374–411) | 106 (104–139) / 338 (333–348) |
  | `farm`      | 77.5 (73–84)    | 147 (143–157)   | not run                       | not run                       |
  | `tractor`   | 84 (80–96)      | 268.5 (257–276) |                               |                               |
  | `gasifier`  | 118.5 (107–126) | 226.5 (219–255) |                               |                               |
  | `gas-train` | 97.5 (90–107)   | 240 (234–275)   |                               |                               |

  Every world is under the written budget's absolute limits (≤ 150 / ≤ 450). The garage: −0.3 % at 4× against round 4, +12.7 % against `41a7859` (the review measured 118.5 / 401 for `ecd18fc` and 111.5 / 344 for `41a7859`: this run's garage figures are lower at 4× for both). The farm's pages landed in its fast mode (see the budget's note).

- **Shimmer** (`docs/qa/film1-flicker.mjs`, the kit's tool, 90 frames, `HEAT=1`, this tree and `4599d15` in one job; orbit / dolly %; largest spike 1.49, no pop):

  | Cell             | after       | before (`4599d15`) |
  | ---------------- | ----------- | ------------------ |
  | `farm` 390       | 1.30 / 2.16 | 1.31 / 2.17        |
  | `gas-train` 1280 | 1.64 / 2.86 | 1.64 / 2.81        |
  | `gas-train` 390  | 0.43 / 1.31 | 0.43 / 1.33        |
  | `garage` 390     | 1.11 / 3.36 | 1.11 / 3.40        |
  | `gasifier` 390   | 0.91 / 3.88 | 0.91 / 3.88        |
  | `farm` 1280      | 2.70 / 4.20 | 2.73 / 4.45        |
  | `garage` 1280    | 1.87 / 5.72 | 1.87 / 5.74        |

  Nothing moved by more than 6 % (the farm's 1280 dolly went down). The film's poses are not the tool's: the new 0b frame was not put through the flicker tool.

- **Console**: 0 page errors in every stills run and every `m1b` page (1280, 768, 390, FR and EN).

## 3. Against the Piggott bar

Closer than round 4 on the frames I changed: 0b is now a site shot with one subject (the garage and its door) and its context, at or near Piggott's site shot; 5b lost its artefact; 5c is a clean yard with the door as subject; the drum is a real object (chimes, hoops, bungs, rust) at the barrel frame's distance. Still under the bar: the gas line's home (a diagram on a sunlit slab), the farm's spruces (stacked cones), the chips (not a heap), the 0a gas column (better, not yet a thin veil). Nothing traded for readability: every 200 px row of the sheets still shows its subject (the garage at 0b, the line with its cyclone, the door at 5c, the drum).

## 4. Tests added or changed

Added: `film5-line.test.ts` (7: N3 at five shapes of view, the 16:9 frame kept, the ring clear of the stand), `film5-farm-crowns.test.ts` (21: every farm frame at two shapes, against the trees), `film5-farm-labels.test.ts` (4: short labels, full names kept, the residues' step frame, the ditch alone and the overview unchanged), `film5-garage.test.ts` (4: the slab uniform, the chip and foot terms, the puddle out of 5c, the plume's volume). Changed: `film4-guide-rays.test.ts` (instanced meshes now count as what can hide a part: stricter, all 70 cases pass). No test weakened. 693 tests (657 before).

## 5. Kit requests

31 refreshed with the measurements (compile and build the next world ahead while idle). New: **34** (a guide step names its own parts, even minor ones) and **35** (the occlusion pass should leave out a mesh at an opacity of 0; the wedge of 5b). 33 (fold a label to the left near the edge) stays the owner's and is what step 8's « Maison » now needs. No request was needed for the short labels: the 3D label is already a field of its own.

## 6. What I did not check

Real phones, Safari, Firefox; 60 fps and the film driver's own render; the guides played with the voice (the frames were checked by the stills tool and by the Node rays tests, not by playing the farm guide); the flights into and out of the new 0b pose (`film2-flight.mjs` not run); exploded, X-ray and section views at 768 and 390 after this round's changes (`m1b` ran with `MODES=0`); the evening (`?hour=`) on the new frames; the flicker tool on the new 0b pose; the gas column's notch (cause not found); the intermediate commits' build and format (typecheck and tests were run on each in a clone; build and format on the last state). The farm's first frame in its slow mode (a full compile) was not measured this round.

## 7. How to redo it

```
npx vite --port 5891 --strictPort          (this tree)
(a clone of 4599d15 with its own npm ci on 5892, a clone of 41a7859 on 5893, in ~/.cache/lab-review/lab-modeler/gasifier-lab/film5/)
~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film5-run.sh stills,m1b,programs,flicker,cost
npm run typecheck && npm test && npm run build && npm run format:check
```
