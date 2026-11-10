# The setting of the worlds

**Sweden, around 1970, a large farm in the south, in late June.** No source gives any of it (research §3: « farm, garage, room above: no source »): the buildings, the land and the day are estimates, drawn at the scale of a farm that could run a 5-tonne tractor on beets and grain over some hundreds of hectares (K38). Sizes that matter are in `src/three/dims.ts` (`FARM`, `GARAGE`), tagged. No texture file: every map is procedural (`src/three/textures.ts`), no text anywhere, because films are captured with no interface. Nothing here is a plan to build: the machine's own geometry is `docs/3d.md`'s.

## `farm`, the setting

A gravel yard under a low sun: the red farmhouse with its white corners and its porch, the garage and the bedroom over it on its east gable, the chip barn with its doors open on a heap of dry chips, the drum chipper and the sieve where the fuel begins, the woodpile along the barn's end, the ash bin and the barrel of black water by the garage's corner. South of the yard a drainage ditch, a track on a fill across it, and the big ploughed field where a tractor goes round with its crusher at the model's speed.

| Thing                                         | What it reads                                                | Kind                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| The sun                                       | `state.hour` from 06:30, day 170, 56° N                      | geometry; at a clock over ×600 it holds at 15:24 (a day would strobe past)                                                                  |
| The tractor on its loop of 46 m by 14 m       | `groundSpeedMs`, `engineOn`; the part selected               | the model's speed; it stands while the engine is stopped and while it or its crusher is the selected part (the camera frames it where it is) |
| The crusher's rings                           | the same speed                                               | they roll at the ground's pace; the pole is a rod drawn every frame between the tractor's pin and the crusher's hitch                       |
| The heap of chips at the chipper, the barn's  | `chipsUsedKg`                                                | follow the model: they go down by up to a third and a half of their size as the day burns 500 kg                                             |
| The ash in the bin                            | `ashKg`                                                      | follows the model                                                                                                                            |
| The garage door                               | `door`                                                       | shut, ajar, open: the same as in the `garage` world                                                                                          |
| The chimney's smoke, the ditch's water        | nothing                                                      | decoration (`docs/water.md`)                                                                                                                 |

**The land.** One mesh on a tensor grid of about 100,000 vertices: 2.5 m near the yard, 0.4 m across the ditch, to hundreds of metres at the horizon. The ditch is cut into the land (a flat bottom, banks of 1.7 m run to the metre); a track crosses it on a fill. The surface is computed per pixel from the position: gravel with ruts, ploughed soil with furrows along the field and a paler headland, meadow, wet dark banks. Every building stands on land that is flat to 0.3 m under it (tested), with its plinth sunk in the ground.

**The trees (instanced, all from unit geometries; nothing is a ball).**

| Species | Count | Note                                                                                                                                                                                 |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Birch   | 12    | a slender white trunk with dark marks, limbs that rise and fork, a narrow airy crown of small light leaves that droop                                                                |
| Oak     | 4     | a stout trunk, wide limbs, a broad dense crown                                                                                                                                       |
| Linden  | 2     | a rounded crown of broad leaves near the house                                                                                                                                       |
| Apple   | 5     | short, a round crown, in a row behind the house                                                                                                                                      |
| Pine    | 6     | a long bare trunk with orange bark, a flat crown at the top, at the edges                                                                                                            |
| Spruce  | 50    | trunk, whorls of drooping boughs with a dark keel, in a shelterbelt along the north and west and by the lane's end                                                                   |
| Far     | ~250  | two stacked cones, in dark groves round the clearing, kept off the field                                                                                                             |

A crown is made of leaf cards (alpha-tested sprays of leaves on a transparent ground) on the limbs' ends and through an ellipsoid, each spray lit by the crown's own normal, so that a tree reads from every side. Every tree stands on `terrainHeight` and keeps off the buildings and the field.

**The buildings.** The farmhouse: stone plinth, red boards with white corner boards and a belt between the floors, windows of white frame with a cross of mullions, curtains behind dark panes, window boxes with flowers, a porch on four posts with stone steps, a bench, a brick chimney with its cap, a grey sheet roof with its barge boards. The garage is the building of the `garage` world, roofed (`garage/building.ts`): rendered walls, a pair of board doors with iron straps, the bedroom over it. The chip barn: stone plinth, red boards, white trim, a loft hatch under a hoist beam with its pulley, a lean-to on posts, doors that slide on a track and stand open, a roof of clay tile with a ridge vent.

**The yard's props, each from its own function.** The chipper: a trailer chassis with its wheels and fenders, a towbar and its eye, a housing round a drum with knives (the drum is a part that turns), a feed trough with two spiked rollers at its mouth, a chute that throws, a PTO shaft with its guard, logs by the trough and one halfway in. The sieve: a drum of wire mesh on rollers in an angle-iron frame, an infeed hopper, a hopper under with its spout and a sack of fines, a chute for what stays in, a motor and its belt. The crusher: two gangs of 24 rings on an axle across a frame, a scraper, an A-frame pole. The ash bin on its slab, its lid ajar; the barrel of black water on two battens, its staves, three hoops, a bung and the black that has run from it. The woodpile: 600 logs in three stacks under a roof of boards. A drystone wall, post-and-rail fences, a wheelbarrow, a ladder on the barn, bales, pallets, tyres, a clothesline with its washing, a letter box. None of them shows a person or a gesture of use.

## `tractor`, `gasifier`, `gas-train`, the paper

The machine worlds stand on the labs' paper (`world.ts`, `PAPER_STUDIO`): a warm studio, a floor of paper with its grid that fades into the page, no fog. `tractor` rolls the machine on the spot: the grid runs under the wheels at the ground speed of the model.

## `garage`, the room

The same garage as the farm's, cut open: the walls between the eye and the room step aside by themselves, the roof is left off, the bedroom stands on the ceiling slab. In the garage: the tractor, nose in; a workbench with a vice, a can, a hammer, a spanner, a shelf of jars, a pegboard; two jerrycans and a pail; a bare lamp on its cord; a window high in the back wall; the ceiling's gaps, a hatch and a stove pipe through it (where gas could climb: the model's floor exchange is an estimate). On the left wall the 1940s rescue set on its board; on the back wall the CO indicator. In the bedroom: a made bed, a night table with a lamp, a wardrobe, a rug, a chair, a window with curtains, a picture. **Nobody is in the picture** (R5): the bed is made, nothing is worn, no hand is drawn.

| Thing                                   | What it reads                          | Kind                                                          |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| The room's size                         | `garageVolume`                         | the model's: free air plus the machine's 18 m³ (an estimate)  |
| The walls that step aside               | the camera's side of each wall         | geometry, in `scene.onBeforeRender`                           |
| The door                                | `door`                                 | the model's                                                   |
| The plume, the CO, the needle, the lamp | see `docs/water.md`                    | the model's quantities; the shapes are ours                   |
