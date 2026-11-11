# Drawings of the Gasifier Lab

Ten A3 sheets (`src/drawings/`, two over the bar of eight). Every length is read from `src/three/dims.ts`, every model result from `src/sim` or `src/data/figures.ts`, through `mL`, `mmL`, `numL` and `fig` in `draw.ts`, never typed. **They explain: overall sizes only, no plan.** The numbers run group by group, because the kit lists the sheets group by group (`PLAN_GROUPS`).

| Sheet  | id                    | Group     | World       | What it shows                                                                                                                                                     | Scale       |
| ------ | --------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| PL-G01 | `general-arrangement` | `machine` | `tractor`   | the tractor and its system, left view and plan, the reported heights, the eye, the wheelbase; the sources' figures in two tables                                  | 1:25, 1:40  |
| PL-G02 | `gas-path`            | `machine` | `gas-train` | the schematic of the report's figure redrawn from our parts, the model's temperature and pressure at each stage; no pipe has a size                               | none        |
| PL-G03 | `gasifier-section`    | `machine` | `gasifier`  | the unit in section, **not to scale, zones in order, equal heights**; 20 balloons and a table; the false colours of the 3D                                        | none        |
| PL-G04 | `a-working-day`       | `machine` | `gasifier`  | the eight-hour day as a calendar; every job and every part's life on one logarithmic axis in hours; the 15 to 25 minutes against the tables' 12 to 19             | none        |
| PL-G05 | `reaction-zones`      | `model`   | `gasifier`  | the chip's temperature, the gas, the water, the mass and the tar against the cursor; the report's bands in red beside the model; the dry gas at the outlet        | none        |
| PL-G06 | `energy-balance`      | `model`   | `gas-train` | two Sankeys on one scale (the bench's table, the model); the three loads side by side; the table's two misprints shown as printed and recomputed                  | none        |
| PL-G07 | `engine-power`        | `model`   | `gas-train` | the powers of 14 engines on diesel and on wood gas, two converted diesels, the mixture's energy; the model's engine on the MF 1100's bar and why it is little     | none        |
| PL-G08 | `co-ladder`           | `danger`  | `garage`    | carbon monoxide from 10 ppm to a million, logarithmic: each rung with its source, none a side to stand on; the model's two rooms beside it                        | logarithmic |
| PL-G09 | `the-stop`            | `danger`  | `garage`    | the stop (pressure for about 20 min, the gas out, particularly at the primary-air intake), then the model's room: 50 m³, 1,000 m³ and the room above, three hours | logarithmic |
| PL-G10 | `war-and-fires`       | `danger`  | `tractor`   | Sweden's vehicles, fires and people from S3 and S2: totals only                                                                                                   | none        |

## Marks

No mark: given by a source. `†`: computed from published figures, or the model where this machine was measured. `*`: an estimate, or the model where it was not (past 20 % moisture, in a fault, on another engine, the garage and the farm). The legend is on every sheet that prints a figure. **A model result sits under or beside a red box that says MODEL RESULT, not a measurement** (PL-G05, G06, G07, G09; PL-G02 carries it at its foot, PL-G03 over the false colours). PL-G08's two red marks are labelled « modèle » with their star.

« Not for construction » is said once, by the title block (`configureDrawings` in `src/drawings/index.ts`); « educational reconstruction » is said in the Sources panel and on no sheet (a test checks both). The title block's scale cell holds `none` or `logarithmic`: the sheets that have no length scale say so.

## What is left out, on purpose

- **No size of the hot parts, in any form.** The throat, the nozzles, the firebox, the zones' heights, the plenum and the lower casing are drawn to scale in the 3D and printed nowhere. PL-G03 is a diagram, equal-height zones, no dimension of a hot part; PL-G05's cursor is the simulation's, zones in order and not to scale. `src/drawings/drawings.test.ts` holds the printed forms of every refused length off every rendered text, and `src/data/refusals.test.ts` holds that no module of `src/drawings` reads `HOT`, `HEARTH`, `ZONES`, `NOT_PRINTED` or the lower casing.
- **The ladder's sentences keep their times on the sheet, and only there.** PL-G08 prints what S1 and S4 say, with their durations; the line beside the room's figure in the Simulation panel says the same rung with no time (`Rung.plain` in `src/sim/ladder.ts`). The first two rungs say « French binding limit (2019) and EU value (2017) »: INRS gives the EU's with no status.
- **No threshold across time.** PL-G09 draws no line of the ladder through its curves and computes no time to a level, for a room or for a person (research R5). PL-G08 leaves out S1's row « 50 ppm: no significant effects » on purpose, against the legal 20 ppm.
- **No curve that was not read.** PL-G10 does not draw the fires per 1,000 vehicles by half-year: the research read it from a scanned table whose title says « per year » and marks the page to check. Its two end values, about 20 and about 3.4, are in words on the sheet, and the question is open (`docs/data.md`).
- **The model's gas, wet and dry.** PL-G05's curves are the model's wet gas (steam included); its table is dry gas, like the report's bands, and the sheet says so.
- **A sheet that says what the model does not find.** PL-G05: the flame is 1,076 °C* with the wall, 1,235 °C* on the balance alone, and the report's band is 1,200 to 1,500 °C. PL-G06: the model's wood is 34 kg an hour against 41. PL-G07: 55 kW against 51 is luck.

## Departures from the research (§0.6)

- Sheet 7 is `a-working-day` as planned; **the numbers run group by group**, so the order is not the research's: `a-working-day` is PL-G04 (group `machine`), `the-stop` and `war-and-fires` close the `danger` group.
- Sheet 4 draws against the journey's cursor, not against a height (R2).
- Sheet 6 has two converted diesels and the Ford 5000 for « spark », and the 14 engines of S1's Tables 3.10 and 3.11 as the physicist read them from images.
- Sheet 10 is totals only (above).

## Scope

`index.ts` holds `SHEETS` and `PLAN_GROUPS` for `plans` in `src/lab.ts`. `draw.ts` (helpers, `chart`, `modelTag`, `marksLegend`) and `test-dom.ts` (a stand-in DOM that the tests walk) are shared in spirit with the other labs. `pl05` and `pl09` run the simulation once and cache it.

## Tests

`src/drawings/drawings.test.ts` (23): the contract (ten ids in order, numbers running group by group, parts of the sheet's world, titles and descriptions in both languages), a render in French and English with no NaN and no French left in English, no text off the sheet or over another or on the title block, the same numbers in both languages, every printed number from a table of the reports, the figures or the simulation, or marked, the marks and tags, no size of the hot parts, no word that promises safety, the ladder with no side and no time, and the sheets' model results against the figures of the texts (the flame, the dry gas, both Sankeys closing, the fleet's losses, the room at half an hour, the war's sums).
