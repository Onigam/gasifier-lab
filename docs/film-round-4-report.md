# Gasifier lab, film round 4 (18/11/2026): the scoped review of round 3, item by item

`lab-modeler`, on `gasifier-lab` after `2906567` (local `main`, status `building`, nothing pushed; `src/sim`, `src/data`, `narration/`, `public/`, the part ids and the physics untouched). The review is `docs/qa.md`, « Film round 3: the scoped review » (1 blocker, 2 majors, 9 minors). **I do not review my own work: an independent review follows.** Every figure below is one I ran, with its command; where I did not measure, § 6 says so.

## 0. In short

- **Commits** (on `2906567`): `d15087c` (B1, M1 code), `7e7b875` (M2/m1 programs, the garage's tufts), `072679e` (m4, the gas line), `dad2680` (m3, chips), `3bf0445` (m2 lid, item 8 yard), `3ebc9c9` (item 7 spruces, m6, m7, m8), `320eabb` (m9 pines, barn label), `21ee7ef` (yard wear round the slab, barn label at the gable), then the last tweak of the puddle and this report.
- **Gates** (last state): typecheck 0, `format:check` pass, **657 pass** (vitest's own line « Tests 657 passed (657) », 39 files; 574 at `2906567`), build passes. No `node_modules/node_modules` in this repository.
- **Draw calls** (Node, `drawStats`): `farm` 431, `tractor` 268, `gasifier` 119, `gas-train` 267, `garage` 388: none went up.
- **Programs** (`docs/qa/film4-programs.mjs`, a fresh page on the phone profile, the five worlds in tab order, 6 s each): `garage` adds **+4 (131)** at the last state, **+4 (131) at `41a7859`** on the same run; it added +9 at `39dec01` by my first probe (136).
- **Frames to look at first**: `docs/qa/film4b-pair-1-barrel.jpg`, `docs/qa/film4b-pair-5-line.jpg`, `docs/qa/film4b-pair-3-lid.jpg`, `docs/qa/film4b-pair-2-farm.jpg`.

## 1. The worklist

1. **B1, the barrel behind the garage: DONE.** The barrel stands in the open off the garage's west corner, west of the ash bin, looked at from the south-east as before (`FARM.barrel` (-31.0, -2.5); a south-west view would have cut a 14 m gap through the west spruce belt, since trees are kept off every frame's line of sight). Its Flux arc no longer crosses a building. Tests: `film4-guide-rays.test.ts` casts rays at **every** `[[frame:…]]` and `[[home]]` cue of both guides in all five worlds (69 cases at 16:9 and 390 × 844): a part more than a third hidden by something outside its own box fails (the old barrel: 76 % hidden, by the room above); a Flux test runs every farm arc at forty places of the tractor against the house, the garage and the barn (the old arc went through the room above at place 3). Seen in the browser: the farm guide played in French and English at 1280 (`~/.cache/lab-review/gasifier-lab/film4/guide/guide-fr-06.png`, 18 s: the barrel lit, the bin beside it, nothing in front, the Flux dots arriving; 0 console errors).
2. **M1, the phone and tablet overview: IN PART.** Done: the farm and the gas line read the shape of the view from the canvas when the framing is asked for (`viewAspect`, `world.ts`; the kit frames again on resize); a Node test with a fake page proves the tall pose is chosen before any render. The latent `alone` bug: the tall box now takes the garage's west side, the bin and the barrel; a test holds every farm part's box non-empty and inside the overview at both shapes. The overview tool is fixed (`docs/qa/film4-overview.mjs`: a fresh browser context a page, the language set in `localStorage` before load, no `frameAll` after a render; the page's `<html lang>` is logged: fr was fr, en was en). **Measured on a first visit**: 1280 FR and EN, nothing clipped; 768 and 390 EN, nothing clipped; **768 and 390 FR: « Grange à plaquettes » still runs out of the right edge** (label box 257 + 170 px in a 390 px view), after moving its anchor to the barn's west gable (it was over the middle). The install step « Ce que la journée laissait » at 768 and 390 FR also clips « Tracteur à gaz de bois » (the tractor drives: where it is at that moment). Not fixed: needs the label to fold to the left near the edge (kit request 33 below) or a shorter French name (data role).
3. **M2 and the first frame: programs DONE, shimmer IN PART.** The tufts are drawn by `leafMaterial`'s patch alone (the fade with the distance moved into that patch as a uniform, out of reach for trees), the stones by a plain vertex-colour material (the far forest's program) and they cast no shadow (their shadow pass was the fifth program: found by switching it off in the browser). No tuft within 12 m of the garage's home camera (13 to 26 m from its target), tufts grow out of the turf 4 to 9 m from the eye. First frame and shimmer: § 2. Kit request 31 (compile the next world ahead) and 32 (framing by the shape of the view) are written. **The farm's bimodal first frame**: reproduced once, 171 ms against 71 to 81 for the five other pages at 1× (after); not at `41a7859` in this run. My reading, not proven: the cost tool opens the page on `#garage` to measure the farm, and the garage's own `warmLater` steps (its X-ray, isolate and section variants) may still be compiling when the switch comes; a page that switches during them pays for both.
4. **The lid in 5b: DONE.** The frame looks from 7 degrees up (21). `film4-lid.test.ts` casts rays between the cord and the lid's edge on the near side: about six pixels of see-through at 1280 × 720 (four at 21 degrees by the same test); `film2.test.ts`'s rule « the camera looks down on the lid » is removed (the lead's decision). Seen: `film4b-pair-3-lid.jpg` and `~/.cache/lab-review/gasifier-lab/film4/crops/lid-gap-after.png` (a dark band with the bed's brown under the lid's edge, the pale cord under it). At 200 px the gap is under a pixel; the lid, the yoke and the gas read. The arrow of the film's « gas leaving the top » still has its lid and gas in the frame. **Seen and not fixed**: a pale wedge with a straight edge crosses the frame from the top right to the lid (a gas sprite cut by something; not investigated).
5. **Chips as a heap: IN PART.** Two pieces in five now stand out of the cut face at any angle and each lies at its own depth (9 mm of spread), the deeper darker; near the cut, the loose pieces on the mound stand on edge, so that the top of the bed is a ragged line; 420 loose pieces in the section (260). Same instanced draws. Seen (`film4b-pair-4-chips.jpg`): at the film's distance the face has more grain and darker gaps; **it still reads as a textured false-coloured face, not as a heap with volume**: a heap with a visible volume needs a mound that rises above the freeboard (5 cm under the lid) or a pile outside the unit, which I did not do.
6. **The gas line's home: DONE.** The cyclone stands before the unit's end (`CYCLONE_AT`), the ribbons 0.65 m nearer the line (`SANKEY_Z`), the home nearer (`HOME_WIDE`). By the kit's pose the line's pieces span 0.85 of the half-width at 16:9 (0.68 before; `film4-line.test.ts` holds over 0.8); on the still (`film4b-pair-5-line.jpg`) the line from the exhaust stack to the fan is about 60 % of the width, 75 % with the cyclone. The test that no ribbon lies under a part is kept. The diesel's ribbon starts in a swallow's tail and ends in an arrow's head into the engine's ribbon (the heads test now counts four).
7. **The spruce saw: IN PART.** Each spruce of the first rows has its own height (×0.78 to 1.18) and taper (0.72 to 1.14 of the width), the rows behind their own tapers. On `film4b-pair-2-farm.jpg` the top line is less even; **the crowns are still stacked cones of one shape** and the top line is still a saw. Shimmer: § 2.
8. **The yard: IN PART.** The garage's ground shader draws a worn band and ruts off the apron to the track, oil before the door, a puddle by the slab's side (in the home and low frames), dropped chips and grass round the slab's foot; no mesh, no program. The first version's puddle was a pale mirror and its grass a thin green line (seen, then toned down: darker water, roughness 0.3, grass in patches); boards were not added. The meadow at 20 m and more is unchanged.
9. **Minors: DONE as asked, two seen.** m6: the birch is 4.9 m from the oak (a test: no two broad-leaved crowns within 4.4 m). m7: the stopped tractor's column rises 6.5 m (9) and spreads 2.0 (2.6): on `0a-stopped-wide` the garage and the house now show beside it. m8: `[[frame:farm-garage]]` looks from the south-west (bearing 335). m9: a pine's higher limbs are shorter and stay under its crown (a test: the wood above the crown's middle inside its ellipsoid; 1.70 of it before).

## 2. The hard rules, measured

**First frame, phone profile** (`docs/qa/film1-cost.mjs`, 390 × 844, pixel ratio 2, the CPU slowed by the DevTools protocol; three fresh pages a run, two runs a side, `41a7859` (a copy on port 5892) and the last code state (port 5891) alternating; median of six; `WORLDS=garage,farm`):

| World    | `41a7859` 1× / 4×               | now 1× / 4×                     |
| -------- | ------------------------------- | ------------------------------- |
| `garage` | 113.5 (108–121) / 332 (329–359) | 126 (117–129) / 392.5 (378–415) |
| `farm`   | 86 (80–89) / 170.5 (157–187)    | 78 (71–171) / 148 (145–158)     |

The programs are back to `41a7859`'s count; against the reviewer's figures (113 / 397) the garage is +11 % at 1× and −1 % at 4×; **against this run's own `41a7859` it is +11 % at 1× and +18 % at 4×**. What is left is not compiling (same programs): the meadow (7,000 tufts placed by rejection, 90 stones) is built in that first frame and `41a7859` had none; the land's shader is longer. Not reduced this round.

**Shimmer** (`docs/qa/film1-flicker.mjs`, the kit's tool, 90 frames, app look, `HEAT=1`; orbit / dolly %; `41a7859` and now measured in the same job):

| Cell             | `41a7859`   | now         | rule (≤ +10 %) |
| ---------------- | ----------- | ----------- | -------------- |
| `farm` 390       | 0.73 / 1.38 | 1.31 / 2.18 | **not met**    |
| `gas-train` 1280 | 0.66 / 2.51 | 1.64 / 2.81 | **not met**    |
| `gas-train` 390  | 0.37 / 0.96 | 0.43 / 1.33 | **not met**    |
| `garage` 390     | 1.11 / 3.24 | 1.11 / 3.26 | met            |
| `gasifier` 390   | 0.89 / 3.60 | 0.91 / 3.88 | met (≤ 3.96)   |
| `farm` 1280      | 2.91 / 6.23 | 2.74 / 4.48 | down           |
| `garage` 1280    | 1.85 / 5.69 | 1.87 / 5.72 | same           |
| `gasifier` 1280  | 0.43 / 1.76 | 0.44 / 1.90 |                |

Why the three cells are not met, plainly: the heat map of the gas line (`~/.cache/lab-review/gasifier-lab/film4/flicker/after-1280x720/gas-train-orbit-heat.png`) is the machine's own edges, all of them; no Flux dots are in it (fewer dots would change nothing). The figure grows with the share of the picture the line takes, and item 6 asked for the line to take two thirds of it: **the two rules pull against each other; the lead decides** (a home at `41a7859`'s distance gives back the figure and the half-width line). The farm at 390 is the tall overview from 50 degrees up, which now really is what a phone gets (M1): a picture filled with crowns; at `41a7859` the tool measured the old far strip.

## 3. Budgets

Draw calls and triangles (Node, `drawStats`, colour pass): `farm` 431 / 450,000; `tractor` 268 / 150,000; `gasifier` 119 / 346,000; `gas-train` 267 / 121,000; `garage` 388 / 232,000. Build in Node: `farm` 0.52 s, `garage` 78 ms. No limit of `worlds.test.ts` raised.

## 4. Against the Piggott bar

The barrel and bin frame and 5b are now medium frames that read (an object with its matter, a gap you can see); the gas line's home is closer to a hero frame but is still a diagram on a floor in daylight. Under the bar as before: the farm's trees (stacked cones; the saw is less regular, not gone), the chips (a textured face, not a heap), the meadow from 20 m. Nothing was traded for readability at 200 px: the 200 px row of every sheet still shows the subject.

## 5. Tests added or changed

Added: `film4-guide-rays.test.ts` (70), `film4-overview.test.ts` (5), `film4-line.test.ts` (3), `film4-lid.test.ts` (2), `film4-farm.test.ts` (4). Changed, and why: `film2.test.ts` (« the camera looks down on the lid » removed, the lead's decision), `film3-garage.test.ts` (the tuft fade's shader assertion follows the fade into the leaves' patch and checks its values), `film3-chips-line.test.ts` (heads found by the geometry's flag and the strip's last pair, four heads). My commit message of `7e7b875` says the garage « adds 5 programs, as at 41a7859 »: the measure is 4 and 4.

## 6. What I did not check

Real phones, Safari, Firefox; 60 fps, the film driver's own render; the guides of the worlds other than the farm in the browser (the rays test covers their frames in Node, it does not see sprites or glass); exploded, X-ray and section views at 768 and 390; the flights (`film2-flight.mjs`) after the gas line's new home and 5b's new view (a flight now ends lower at the lid); the evening; `walk.mjs`. The garage's shimmer was measured before the yard wear was extended round the slab and the puddle toned down (`21ee7ef` and after). **An accident of mine**: making a copy of `41a7859` I copied this repository's `node_modules` into a scratch directory whose `node_modules` was a symlink to `~/Dev/piggott-lab/node_modules`, which created **`~/Dev/piggott-lab/node_modules/node_modules`** (a full copy of this lab's packages, 18/11 11:18); removing it was refused to me by the permission system. It must be deleted by hand (`rm -rf ~/Dev/piggott-lab/node_modules/node_modules`) before any measurement or build in the Piggott lab. The scratch directory (`…/scratchpad/before`, another agent's) also got this lab's files at `41a7859` written into it.

## 7. Kit requests

31 (compile the next world ahead while idle), 32 (a framing that knows the shape of the view before the first render), 33 (a label near the right edge puts its text left of its dot) in `docs/kit-requests.md`.

## 8. How to redo it

```
npx vite --port 5891 --strictPort                      (and a copy of the tree at 41a7859 with its own node_modules on 5892)
~/Dev/onigam-video/tools/with-chrome-lock.sh bash docs/qa/film4-run.sh stills,programs,overview,guide,flicker,cost
npm run typecheck && npm test && npm run build && npm run format:check
```
