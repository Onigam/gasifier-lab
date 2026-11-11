# Physics of the Gasifier lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models the machine of research §0.1, accepted by the owner on 2026-11-03: the Swedish institute's F-5 gasifier on a Massey Ferguson 1100 tractor, as FAO Forestry Paper 72, ch. 3 reports it.

**Safety bounds what is modelled, research §A.2, R1 to R10.** This model is not a design tool. Its inputs are one published machine and a narrow set of conditions: a load, a moisture, a chip grade, a filter's age, a fault, a room. It takes no power and gives no size. It has no slider of any size, of an air-to-gas ratio, of a heat loss, of a pilot, of a timing or a compression. It computes no dose, no blood level, no time to a rung of the ladder and no time left in a room. **Not a plan:** nothing here shows that a build or a run would be acceptable or allowed.

**Nothing is tuned to a reported figure.** The inputs were set before the comparison. What moved during the work is in §7.3, each with its reason. The pins of `src/sim/figures.test.ts` record what the model gives; a pin is not a target.

Words used for a number: **reported** (a source of `docs/research.md`, K or S number), **derived** (computed from reported figures, the computation beside it), **estimate** (the sources are silent: a choice with its reason), **assumption** (a choice of how to run it), **model** (an output of this simulation). In the data shown to a visitor `†` marks a model result or a sum on published figures where this machine was measured, `*` an estimate, or the same model where it was not. `STATE_TAGS` in `src/sim/tags.ts` gives every key of the state its word.

## What the model finds: the short version

| Question                               | Answer of the model                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is the gas made of?               | **Inside FAO's bands, on the method FAO credits.** CO 20.9, H₂ 16.5, CH₄ 2.3, CO₂ 11.3, N₂ 48.9 % (just under its 50–54). **5.27 MJ/Nm³** against 5.60 measured, −6 %. The same method, run on FAO's own conditions, reads its calculated Figs. 2.4–2.6 by eye to about two points (`gas.test.ts`)                                                                                                                                                                                             |
| Why does the bed crack its tars?       | **Arithmetic first:** 0.13 g/Nm³ × 2.17 Nm³/kg is 0.03 % of the wood, against S2's 5–20 % for an updraft: over 99 % gone. **The mechanism, on rates from memory:** the vapours must cross the flame, 1,076 to 1,235 °C \*, where a first-order cracking leaves nothing in hundredths of a second, and half of it at idle's 750 °C \*. The tar itself is not predicted: the state carries the measured band                                                                                     |
| Why does reduction cool the gas?       | **The balance finds it.** About 370 K \* lost between the flame and the reduction's end, for 1.5 MJ per kg of dry wood. C + CO₂ → 2CO comes out at 165 kJ/mol from FAO's heating values, its own printed figure                                                                                                                                                                                                                                                                                |
| What can it do in an engine?           | **Mixture 2.49 MJ/m³ † against petrol's 3.8.** Dual fuel at the highest speed, **54.6 kW** against 51 measured, +7 %, on an efficiency of no one's bench. **That agreement is worth little:** the efficiencies in the book move it from 47 to 60 kW (§5), and the same model reads 30 % high across the rest of the fleet, because the MF 1100 was the fleet's best per litre (§3.3)                                                                                                           |
| The load?                              | **The shape is found.** The best total efficiency falls between 70 and 80 % of load, where FAO's curve has it at about 72 %, and the curve's fall is right. Its height is 3 points high: 21.6 % against 19 %                                                                                                                                                                                                                                                                                   |
| The wood?                              | **34.3 kg/h** against 41 at 40 kW. **Not retrieved,** −16 %. This tractor's engine burned about a third more energy than a good diesel would for the same work; the truck beside it burned about the same as on its diesel. No one efficiency does both (§3.3)                                                                                                                                                                                                                                 |
| The fuel's moisture?                   | **The gas falls to the 4.2 MJ/m³ engines ask for at 45 %** wet with the jacket draining, **at 40 %** without, against FAO's « not combustible above about 40 % ». Every step goes the right way: poorer gas, more chips, a cooler fire. But **the model's flame never goes out:** what stops a real hearth is not in it                                                                                                                                                                        |
| How fast does CO fill a closed garage? | **Fast, and the number depends on what nobody measured.** One m³ \* of this gas, S3's own illustration, in an even box of 50 m³: about **3,500 ppm** \* within half an hour, 200 ppm \* in 1,000 m³. The room above reaches about 670 ppm \* more than an hour after the garage's highest. A lid that does not seal: 5,000 to 50,000 ppm \* after two hours, by the size of a leak. **No figure here says when anything ends or that any room is fit.** S3 says a real garage is worse: layers |

**The first sentence the owner should weigh:** the machine's balance is off by 16 to 19 % on the wood, and the reason is in the sources themselves, whose two vehicles disagree by about a third on what an engine burns. **The garage rests on a source term that no source gives.** The model says so where it matters; the lab should not lead with its numbers as if they were measured.

## 1. The model

All SI inside: m, Pa, W, Nm³/s, mol, temperatures in °C. The state speaks the sources' units. Files: `machine.ts` (every number, with its word), `reported.ts` (what the sources print, for the tests and the docs), `gas/` (the chemistry and the room, shaped for the kit), `motor.ts`, `train.ts`, `plant.ts` (the machine in time), `journey.ts`, `ladder.ts`, `runs.ts`, `presets.ts`, `types.ts`, `tags.ts`, `strip.ts`, `texts.ts`, `engine.ts` (`GasifierSim implements LabSim`). `demo.ts`, the template's flywheel, was removed by the lead on wiring (`src/lab.ts` takes `GasifierSim`); the simulation panel is `src/panels/sim.ts`.

### 1.1 The gas: one equilibrium, four balances (`gas/equilibrium.ts`)

The method FAO §2.2.1 credits to Tobler and Schläpfer. Wood CH₁.₄O₀.₆ (S2 Table 4-1), per kg of dry fuel:

```text
C:  CO + CO₂ + CH₄ + C_residue = n_wood
H:  2H₂ + 2H₂O + 4CH₄ = 1.4·n_wood + 2·w_fire
O:  CO + 2CO₂ + H₂O = 0.6·n_wood + w_fire + 2y
N:  N₂ = 3.76·y
K_we(T_frozen) = CO·H₂O / (CO₂·H₂)                  FAO Table 2.2, frozen at 700 °C (FAO: « below 700 °C »)
E:  LHV_dry − L·w = CO·283.66 + H₂·241.3 + CH₄·801.5 + C_res·401.9 + sensible(T_out) + h·(LHV_dry − L·w)     kJ/mol, FAO Table 2.1 and §2.2
```

The air, `y`, is not chosen: it is what closes the energy balance, by bisection. For a given `y` the water comes from one quadratic. Elements and energy close to rounding at any fuel (tested).

| Input              | Value                     | Word                                                                                                                                             |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| LHV of dry wood    | 18.8 MJ/kg                | **derived**, from 17.1 MJ/kg at 8 % (K18 ÷ (1 − K14) over K11, research §2.10). So K14 and K18 are not independent of it at the test maximum     |
| Heat lost, `h`     | 15 % of the fuel's energy | **reported as the condition of FAO's own calculation** (Fig. 2.4's caption), **not a measurement of this machine**. The largest single lever: §5 |
| Frozen temperature | 700 °C                    | reported, FAO §2.2. Hardly matters: §5                                                                                                           |
| Methane            | 2.79 mol/kg dry           | derived: K46's 2.5 % of FAO's about 2.5 Nm³/kg dry. FAO: « constant » per kg of dry fuel                                                         |
| Residue            | 2.31 mol C/kg dry         | derived: K21's « about 5 % of the power at full load », as carbon; the rest of K21's 3.5 % is ash                                                |
| Jacket's drain     | 70 % of the moisture      | reported, K64's middle. The water never reaches the fire; its latent heat is still paid. S1 says the water « can be » drained                    |
| Outlet             | from §1.2                 | estimate, near FAO's band                                                                                                                        |

**Heat.** Wood's drying and warming are paid at the top of the fire, upward; they are not carried past the throat (§7.3). The gas leaves the reduction zone holding what it still hands on: `S(T_b) = S(T_out) + h·LHV`. Before that, the volatiles alone, with no char yet (char: 20 % of the dry mass at 85 % carbon, **estimate**), took the same oxygen, by the same method. The difference in chemical energy less the char's is the heat the reduction takes; the flame stands above `T_b` by that heat. So **the oxidation's temperature rests on the char's share** (940 to 1,263 °C from 10 to 20 mol C/kg): it is an estimate of a mechanism and is tagged so.

**A leak** (a fault, `airLeak`): air, 5 % of the gas's volume (**estimate**, no source sizes one), burns CO and H₂ as it meets them. The heat goes into the outlet's temperature. Direction reported (S1 §2.8.3), size not.

### 1.2 Three thermal masses (`plant.ts`, the kit's RC network)

Hearth, casing, filter box, on `createNetwork`, `stepNetwork`, `radiationConductance`, `naturalFilm`. For the 3D's colours, for the cooling after a stop, for what the filter does at idle. The chemistry reads only the outlet.

```text
hearth:  C_gas·(T_b − T_h) − G_w·(T_h − T_c)          42 kJ/K; G_w 12 W/K, estimates
casing:  25·(½(T_h + T_out) − T_c) − loss(T_c)        62 kJ/K, 3.4 m², ε 0.8: kit's radiation and film
filter:  C_gas·(T_in − T_F) − 2.9·A·(T_F − T_air)     from the box's 65.5 kg per 3 m² (S1 §3.1.3), and an insulated wall's film
outlet:  T_out = T_c + (T_h − T_c)·exp(−97/C_gas)     estimate: the 97 W/K holds it in FAO's band. So the outlet is NOT a find
```

**A check that does not close.** The casing's own surface loses about 12.5 kW \* at the test maximum, 8 % of the wood's energy, by the kit's radiation and film on estimated areas. The chemistry's `h` says 15 %, 24 kW. The rest would be the jacket, tar and soot. Neither is measured.

### 1.3 The engine (`motor.ts`)

S1 §2.1.2's law with the pilot as an energy flow, and friction, which that law leaves out:

```text
P = η_i·(η_burn·G·H + ṁ_d·LHV_d) − P_friction − P_throttle
G·(1 + r)·(T_mix/T₀) = (V·n/120)·η_v·(p₀ − Δp_train(G))/p₀         at full throttle
FMEP = 0.137 bar + p_max/200 + 0.162 bar·s/m × piston speed          Chen and Flynn's form, from memory
```

The governor's line is K9 and K10: asked power and speed go together, as the table has them. So K9 and K10 are inputs, and K11 onwards are finds. Full throttle at 2,170 rpm is the highest power, K22.

| Input                   | Value                      | Word                                                                                                                                                                                                 |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| η_v                     | 0.8                        | reported: K27's middle, and FAO's Appendix 1 at 1,500 rpm                                                                                                                                            |
| η_i, dual fuel          | 0.40                       | **estimate.** 0.7 of a fuel-air cycle gives 0.396. S1 Table 3.6's L5150 and Fordson, through the friction above, imply 0.415–0.43. **This tractor's own balance implies 0.36–0.39, and is not used** |
| η_i, diesel             | 0.46                       | estimate: gives 243 g/kWh at the rating                                                                                                                                                              |
| η_i, spark              | 0.33                       | estimate: the same 0.7 at the conversions' lower compression, which no state and no slider holds                                                                                                     |
| Diesel per revolution   | K12's 2.2 kg/h ÷ speed     | **input.** S1 §3.1.4: constant per stroke. So K12's maximum is not a find. Never shown (R4)                                                                                                          |
| Gas burnt at work       | 97 %                       | estimate                                                                                                                                                                                             |
| Gas burnt at idle       | about 36 %                 | **from S3:** 5–8 % CO in idling exhaust, on wartime engines, read back as a burn. So the idle's wood is found from one figure of another book                                                        |
| Burn's recovery         | full by half load          | estimate: dual-fuel engines burn poorly below that                                                                                                                                                   |
| Straight diesel's limit | K22's 64 kW, K33's 70.5 kW | **input.** The smoke limit decides it, and the model has no smoke                                                                                                                                    |

### 1.4 The train (`train.ts`)

| Part     | Law                                                                                                                                                                                                            | Word                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Gasifier | K60's measured drop by chip grade, on the square of the flow, read at about the most this gasifier passed on each machine                                                                                      | reported drops, **assumption** for the flow and the exponent                         |
| Filter   | Table 3.4, straight between its rows, **on normal cubic metres** (§7.2). K63's age: flat to 625 km, then 67.5 mm of water per 1,000 km on 175. ×6 wet (K62), and wet when the box is below the gas's dew point | measured. The age is a truck's, and hours turn to km as S1 does it: 3,000 km is 50 h |
| Pipes    | The kit's `tubeFlow` and `tubePressureDrop`, one equivalent pipe                                                                                                                                               | estimate. About 1 mbar: dimensions unknown, research §3                              |
| Cooler   | The kit's `effectiveness`, cross-flow, on K4's 5.8 m², U = 20 W/m²·K                                                                                                                                           | reported area, estimated U                                                           |
| Water    | Jacket: K64's share. Cooler: what the gas gives up cooling below its dew point                                                                                                                                 | derived                                                                              |

### 1.5 The chip's journey (`journey.ts`)

A cursor from the top of the bunker to under the grate. **The zones are in order and not to scale, on purpose:** heights would be the hot parts' sizes in disguise (R2). The end points are the model's: the gas after the oxidation zone and the gas leaving. Between them, smooth estimates. The research offered first-order kinetics for the reduction: it had read no rates, and they would add nothing a visitor can see, so this interpolates. Drying's and pyrolysis's gas are **estimates**. Tar is a share against its peak, not a concentration.

### 1.6 The room (`gas/room.ts`, `Plant`)

```text
d(C·V)/dt = S_CO − (Q + S_total)·C − q·(C − C_above)
```

Two well-mixed boxes, implicit in the losses, stable at any step, against the closed form (tested). **Reported:** the two volumes, 50 and 1,000 m³ (K50); CO at 25 % after a stop (K48's middle), about 200 L of CO a minute at the fan and 5–8 % in idling exhaust (K50). **Estimates, wide on purpose, no source:**

| Quantity                    | Value                                                                   | Reason                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Volume of gas after a stop  | 1 m³, slider 0.2–5                                                      | S3's own « 1 m³ generator gas in 1000 m³ air », an illustration. Hand reasoning: below                                                                  |
| Its time                    | exponential, constant half of 20 min, **no end**; slider to 3 h         | S3 p. 309: pressure for « approximately 20 minutes ». S2: « sometimes for hours »                                                                       |
| Door's air changes per hour | shut 0.1 / 0.5 / 1.5; ajar 0.5 / 2 / 5; open 2 / 6 / 20                 | usual for old buildings. **The state gives the low and high beside the middle**                                                                         |
| Room above                  | 60 m³, 0.5 per hour, floor exchange 0.05 / 0.3 / 1 per hour of the room | S3 names such a room, and gives nothing else                                                                                                            |
| A lid that does not seal    | 10 cm², on the kit's `stackDraft` through the hot column                | about 0.6 mm on a seal 1.6 m round. **3 cm² fades in 1.5 h; 30 cm² holds until the bunker is empty, about 6 h, which is S3's « burning like a stove »** |

**Where 1 m³ stands, by hand.** The hot bed holds about 10–30 MJ. Driving off the column's lower chips takes 1–2 MJ per kg of dry wood and gives 0.3–0.7 Nm³ of gas per kg. So 0.2 to 5 m³ is the plausible range, and the slider covers it. **No part of this is measured on any machine.**

**One line said once:** a real room is uneven and can be worse than this box. The panel has it as `ROOM_NOTE`. **There is no all-clear:** once carbon monoxide has been in the room, an alarm stands whatever the number does (tested over 13 h), and it says that a low number says nothing of a real room.

### 1.7 The clock

`step(dt)`: the simulation on `dt × timeScale`, in fixed steps of a second, at most 1,200 a frame. Same inputs, same state (tested). No wall clock, nothing random. The operating point is solved again every 10 simulated seconds or on a change: about 31 µs here. A step costs about 4 µs with that counted, a frame at ×60 about 6 µs, opening a run about 4 ms (this Mac, under load, test in `engine.test.ts`). A run opens warm: 80 × 2 minutes of the thermal masses at its load, because **this lab has no start** (R3). A scenario that opens stopped is warmed running, then stopped.

## 2. The parameters

| Parameter                   | Default     | Range                       | Word                                    |
| --------------------------- | ----------- | --------------------------- | --------------------------------------- |
| `load`                      | 100 %       | 0–100 of the test maximum   | K10. The speed follows the table's line |
| `fullPower`                 | off         | the point of K22            | reported                                |
| `moistureWet`               | 8 %         | 8–45 %                      | K8, K59. Wet basis always               |
| `chipGrade`                 | 10–40 mm    | four grades                 | K60                                     |
| `filterHours`, `filterAges` | 0, off      | 0–100 h                     | K41, K63                                |
| `filterWetFault`, `airLeak` | off         | faults                      | K62; S1 §2.8.3, size estimated          |
| `vesselNeglected`           | off         | a fault                     | K44                                     |
| `engineMode`                | dual        | diesel, dual, spark         | K22–K24. Modes of published engines     |
| `machine`                   | MF 1100     | MF 1100, Scania L8050       | K32. The truck is numbers only          |
| `truckLoad`                 | empty       | empty, 5 t, 8 t             | K35                                     |
| `ambientT`                  | 15 °C       | −10–30 °C                   | assumption                              |
| `place`                     | field       | field, garage               | Q7                                      |
| `garageVolume`, `door`      | 50 m³, shut | 50, 1,000; shut, ajar, open | K50; assumption                         |
| `postGasVolume`             | 1 m³        | 0.2–5                       | **estimate**                            |
| `postGasMinutes`            | 20 min      | 5–180                       | K49, conflict 9                         |
| `lidLeak`, `fanSource`      | off         | sources                     | S3. **A source, no gesture**            |
| `journey`                   | 0.62        | 0–1                         | not to scale                            |

**Left out on purpose,** though research §5.5 lists them. Each would tune a build (the lead's rule, R1, R2, R4):

- **The air-to-gas slider, 0.7–1.5.** It is the secondary-air throttle's setting, with an optimum on it. The state gives `airToGas`, the stoichiometric ratio, as a fact of the gas.
- **The heat-loss slider, 5–25 %.** It is the quality of a build. §5 shows its effect; it moves by `PlantOptions` for a test.
- **A throat, a nozzle, a firebox, a reduction height.** Never inputs. The model does not read them.
- **Compression, timing, pilot.** Never inputs. They are inside three efficiencies.

Also not modelled, by refusal: a dose, a carboxyhaemoglobin, K66's blood. K66 stays a lesson's words.

## 3. The key figures, retrieved and not retrieved

**Exact:** arithmetic on the sources' numbers, `toBeCloseTo` the source. **Retrieved:** the model's own value, within about 10 %. **Not retrieved:** further off: §3.3. **Input:** the model is given it. **Find:** no target. **Context:** the model has nothing to say. A compare is not a validation: this is one table of one machine, through FAO's summary of a report nobody here has read.

### 3.1 The research's hand checks (§2.10)

All **exact**, each in `figures.test.ts`. The stars: the balance and the throat close to three figures on all three lines (in that test only, R2). 30.4 kg ÷ 41 kg/h = **44.5 min**. **2.44 MJ/m³** and **1.08** on the composition's middle. **200–300, 200, 4,000 ppm** in the room. Also 17.1 MJ/kg, 180.9 and 54.6 kW, **19.2 %** at part load, 3.5 kg/kg, 2,865 fires, 73,853 vehicles, 67 %.

### 3.2 The figures

| K   | Reported                                              | Model                                                                                                                             | Status, and why                                                                                                                                                               |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | MF 1100, 5,090 kg                                     | constant                                                                                                                          | Exact                                                                                                                                                                         |
| K2  | 5.8 dm³                                               | constant. The ratio is not in the model                                                                                           | Exact. R4                                                                                                                                                                     |
| K3  | F-5, 0.2 m³                                           | constant. Its throat and nozzles are in `NOT_PRINTED`, read by nothing but a test                                                 | Exact. R2                                                                                                                                                                     |
| K4  | 4.9, 5.8 m²                                           | constants; 2.5 m² doubles the drop                                                                                                | Exact, and explains K4's change                                                                                                                                               |
| K5  | 450 kg                                                | constant                                                                                                                          | Exact                                                                                                                                                                         |
| K6  | 2.22, 0.50, 2.25–2.40 m                               | constants; lower casing [withheld: R2]                                                                                            | Exact                                                                                                                                                                         |
| K7  | changes to the tractor                                | —                                                                                                                                 | Context, for the 3D and sheets                                                                                                                                                |
| K8  | 8 %, 152 kg/m³                                        | inputs; 30.4 kg in the bunker                                                                                                     | Input                                                                                                                                                                         |
| K9  | 1,855, 1,440, 1,015 rpm                               | input: the line                                                                                                                   | Input                                                                                                                                                                         |
| K10 | 40, 29, 0 kW                                          | input. Full throttle there gives 52 and 45 kW                                                                                     | Input. **Conflict 2: the model says the 40 kW test was not at the limit at that speed**                                                                                       |
| K11 | 41, 27, 8.5 kg/h                                      | **34.3 kg/h**, 23.9, 6.9                                                                                                          | **Not retrieved,** −16, −12, −19 %, §3.3                                                                                                                                      |
| K12 | 2.2, 1.9, 1.2 kg/h                                    | 2.2, 1.71, 1.20                                                                                                                   | First input; part −10 %; idle retrieved                                                                                                                                       |
| K13 | 5.60, 5.56, 5.54 MJ/Nm³                               | **5.27 MJ/Nm³**, 5.37, 5.55                                                                                                       | Retrieved, −6, −4, 0 %. Rises towards idle where the table is flat: a cooler outlet, §3.3                                                                                     |
| K14 | 71.1, 66.5, 73.1 %                                    | 75.5, 76.3, 77.9 %                                                                                                                | Retrieved at the ends, +4 to +5 points. Part load +10: the table's dip is not in the model. About flat, as K61 says                                                           |
| K15 | 18.9 †, 15.0, 26.2 %                                  | sum 11.8, 14.9, 26.1. Model 13.8, 15.2, 30.3                                                                                      | Exact on the sum: **conflict 4, the misprint holds.** Model follows K11                                                                                                       |
| K16 | 18.0, 5.3 †, 0 %                                      | sum 18.1, 19.2, 0. Model 21.2, 21.7, 0. **Best between 70 and 80 %**                                                              | Exact on the sum: **conflict 3 holds.** Height +3 points; **the shape retrieved**                                                                                             |
| K17 | 181.5, 143.3 †, 54.8 kW                               | sum 180.9, 121.8, 54.6. Model 149, 105, 47                                                                                        | Exact on the sum. Model follows K11                                                                                                                                           |
| K18 | 56.3, 43.0, 10.1 kW                                   | 39.9, 26.8, 7.3 kW                                                                                                                | **Not retrieved,** −29, −38, −28 %. K11 and K14 together                                                                                                                      |
| K19 | 0.13, 0.04, 0.17 g/Nm³                                | carried by load, not predicted                                                                                                    | Input to `tarG`                                                                                                                                                               |
| K20 | 80–85 %                                               | 78.5, 76.3 %, 81 at full power                                                                                                    | Retrieved near its low end                                                                                                                                                    |
| K21 | residue up to 3.5 %, about 5 % of the power           | input                                                                                                                             | Input                                                                                                                                                                         |
| K22 | 64 → 51 kW                                            | 64 input, **54.6 kW**. Derating 15 % against 20                                                                                   | Retrieved, +7 %. **Worth little: §5**                                                                                                                                         |
| K23 | Ford 5000: 42 → 23 kW                                 | 22.3 kW, at an assumed 2,200 rpm                                                                                                  | Retrieved, −3 %, on two estimates                                                                                                                                             |
| K24 | 71 → 34, 42 → 19.6 kW                                 | 28.4, 22.0 kW, at their own speeds and strokes. MF, nobody ran it: 31 kW \*                                                       | −16, +12 %: about half a diesel's power, retrieved. FAO's own note calls the second engine's numbers odd                                                                      |
| K25 | two tables                                            | +30 % on average across 13 compression-ignition engines, at an assumed 2,170 rpm, from +7 to +49 %                                | **Not retrieved as a fleet.** §3.3                                                                                                                                            |
| K26 | about 2,500 and 3,800 kJ/m³, about 35 %               | 2.44 MJ/m³ on the middle, 36 %. Model's gas 2.49. Isooctane by hand gives 3.8                                                     | Exact                                                                                                                                                                         |
| K27 | 0.65–0.8, 0.7–0.9                                     | input 0.8. The mixture is 0.55 of the swept volume at the test maximum, research's 0.57                                           | Input, retrieved. **Research said below FAO's reading: it is inside the product, 0.46–0.72**                                                                                  |
| K28 | about 2,500 rpm, by the slow flame                    | brake power tops at about **2,800 rpm**, by friction and the train                                                                | Find. **Another cause.** The model has no flame speed                                                                                                                         |
| K29 | dual 15–20 %, spark about 30 %                        | dual 15 %. Spark against a diesel 51 %                                                                                            | The rule, as the rule. Conflict 15: measured 21 and 29 %. The model sits on the rule, not on the measures                                                                     |
| K30 | wear                                                  | —                                                                                                                                 | Context                                                                                                                                                                       |
| K31 | 1:1 to 1.1:1                                          | 1.08 on the middle, 1.115 on the model's gas                                                                                      | Retrieved. No slider                                                                                                                                                          |
| K32 | Scania, all                                           | constants                                                                                                                         | Exact. Its bunker's misprint: conflict 6. An assumed 304 dm³                                                                                                                  |
| K33 | 70.5 → 49.8 kW                                        | 70.5 input, **70.8 kW**                                                                                                           | **Not retrieved,** +42 %, §3.3                                                                                                                                                |
| K34 | 91,500 km                                             | —                                                                                                                                 | Context                                                                                                                                                                       |
| K35 | 7.2, 7.6, 7.8 kg; 0.50–0.55 kg; 80–81 %; 69, 71, 76 % | **8.34, 8.97, 9.44 kg**; 0.51 kg; 79–81 %                                                                                         | Chips **not retrieved,** +16 to +21 %. Diesel and substitution retrieved. At 8 t the diesel's average power (72 kW) is past this engine's full throttle (68 kW): `powerShort` |
| K36 | 3.6 kg/kg                                             | by hand 3.5; model 4.2–4.3                                                                                                        | Hand exact. Model +19 %, with K35                                                                                                                                             |
| K37 | drivers, smoke                                        | —                                                                                                                                 | Context                                                                                                                                                                       |
| K38 | 2,500 h                                               | —                                                                                                                                 | Context. The table's line reads 2,830                                                                                                                                         |
| K39 | who drove it                                          | —                                                                                                                                 | Context, in a lesson's words                                                                                                                                                  |
| K40 | 30–45 min, every 40–50 min                            | 44.5 by hand; **53 min** on the model's chips                                                                                     | Exact by hand. The model's follows K11                                                                                                                                        |
| K41 | intervals                                             | inputs of the ledger                                                                                                              | Input                                                                                                                                                                         |
| K42 | 15–25 min per hour                                    | the table's times add to 11.8–18.6; a live day 13.3                                                                               | **Not retrieved at its top.** The table's own durations do not reach FAO's 25. Its footnotes put several jobs inside the fill and the preparation                             |
| K43 | lives                                                 | —                                                                                                                                 | Context, sheet 7                                                                                                                                                              |
| K44 | water sucked from a full vessel, « probably »         | `vesselOverfull`, by time: the vessel's size is unknown                                                                           | Alarm, no procedure                                                                                                                                                           |
| K45 | the programme                                         | —                                                                                                                                 | Context. 644,200 km adds up: conflict 21                                                                                                                                      |
| K46 | N₂ 50–54, CO 17–22, CO₂ 9–15, H₂ 12–20, CH₄ 2–3       | 48.9, 20.9, 11.3, 16.5, 2.3 at 8 %. 49.5, 18.8, 12.7, 16.8, 2.1 at 20 %                                                           | Retrieved; nitrogen 1 point under. Table 2.3 is at 20 %: 5.0 MJ/m³, its bottom                                                                                                |
| K47 | 1,200–1,500 °C; 0.25; K_we                            | Balance 1,235 °C, inside. With the wall **1,076 °C**, under. ER 0.34 against S2's ideal 0.25. K_we the table                      | Retrieved on the balance, 10 % under with the wall. Rests on the char. The hearth at 710 °C, near where the equilibrium freezes: by no choice of ours                         |
| K48 | over 20 %, 23–27 %                                    | 20.9 % at work. 25 % input after a stop                                                                                           | Retrieved; input                                                                                                                                                              |
| K49 | about 20 min; hours; layers                           | slider. No end. `gaugeMbar` null: **no source gives the pressure**                                                                | Input, **with its unknown in the state**                                                                                                                                      |
| K50 | 0.02–0.03 %; 200 L/min; 5–8 %; under a minute         | 200–300, 200, 4,000 ppm. The idling engine passes 300 ppm in a 50 m³ box in under 30 s                                            | Exact. **Retrieved.** **New conflict: §7.2**                                                                                                                                  |
| K51 | four symptoms                                         | the ladder, unchanged                                                                                                             | Carried. FAO's « 50 ppm, no significant effects » is left out: §9                                                                                                             |
| K52 | 17 dead                                               | —                                                                                                                                 | Context                                                                                                                                                                       |
| K53 | 10,000 cases                                          | —                                                                                                                                 | Context                                                                                                                                                                       |
| K54 | 155 of 230                                            | 67 %                                                                                                                              | Exact                                                                                                                                                                         |
| K55 | phenols                                               | how much water, nothing of what is in it                                                                                          | Context                                                                                                                                                                       |
| K56 | 2,865 fires                                           | the sum                                                                                                                           | Exact. No fire in the model                                                                                                                                                   |
| K57 | 10.9–76 %                                             | the box stays under it. **No explosive range is computed anywhere**                                                               | Context                                                                                                                                                                       |
| K58 | the fleet                                             | the sum; 26,800                                                                                                                   | Exact                                                                                                                                                                         |
| K59 | 30 %, about 40 %; 4,200 kJ/m³; 13–15 MJ/kg            | **45 %** wet with the drain, 40 % without, at 4.2 MJ/m³. 15.3 and 14.6 MJ/kg                                                      | Retrieved. A heating value is not a flame: §6. FAO also says the oxidation zone cools with moisture: **it does here, 1,076 → 926 °C** \*                                      |
| K60 | 0.18–0.08 bar; 16.8–21.1 kW                           | drops input. 12 % gain against 25 % on a 3.6 L engine at 1,800 rpm; 10 % on this tractor                                          | **It explains under half the gain, and the report says so:** « less than 50 percent ». The rest is the gas's quality, not in the model                                        |
| K61 | dust, tar, about 70 % flat                            | tar carried; cold gas flat within 3 points                                                                                        | Retrieved                                                                                                                                                                     |
| K62 | 0.3 mg; 300 °C; 45–60 °C; ×6                          | 0.3, 300, ×6 inputs. Filter 156 °C, 214 °C at full power. Dew 38–44 °C with the drain, **47–57 °C without**. Drop 216 mm of water | Retrieved without the drain. **K62 and K64 do not sit together:** §7.2                                                                                                        |
| K63 | 150–200 mm; 60–75 per 1,000 km; double by 3,000 km    | 1.92 times at 3,000 km. 195 mm on the truck's reported chips and the L8050's cloth                                                | Retrieved                                                                                                                                                                     |
| K64 | 60–80 %                                               | input 70 %; 1.9 L/h at 8 %, 5.7 L/h at 20 %                                                                                       | Input. By hand at 41 kg/h, 2–2.6 L/h, research's                                                                                                                              |
| K65 | 20, 100 ppm; 25/50                                    | the ladder's first two                                                                                                            | Carried                                                                                                                                                                       |
| K66 | the blood                                             | **not computed in `src/sim`**                                                                                                     | Refused, R5. A lesson's words                                                                                                                                                 |
| K67 | about a million                                       | —                                                                                                                                 | Context                                                                                                                                                                       |
| K68 | Sweden's policy                                       | —                                                                                                                                 | Context                                                                                                                                                                       |

### 3.3 Not retrieved: cause, range, what would change it

**K11, the wood: 34.3 kg/h against 41.** Two causes that add. The model's engine turns 26.8 % of what it gets into shaft work, against 24.3 % derived from the table. Its gas holds 75.5 % of the wood against 71.1 %. **The engine is the one to weigh.** S1 Table 3.6's L5150 reaches 30.5–36 % at full power, and its Fordson 32.5 % at the same kind of load; §3.1.4 says « about 35 percent ». The model at 0.40 sits **below those** (27.5–32.5 %, a Fordson's 27.5 % against 30.8 %) **and above this tractor.** At η_i 0.36 it finds 38.5 kg/h and 19 % total, at 0.43, 31.6 kg/h. **So 0.36 would print this table, and it would be a fit.** And this tractor burned 164.6 kW for what a good diesel would do on about 121 kW \*, about a third more. **Plausible: 31 to 41 kg/h.**

**K35, the truck's chips: +16 to +21 %, the other way from K11.** On the road this truck's gas and pilot held the same energy as its diesel alone, to within 4 % †. On the bench the tractor's held a third more. **No one efficiency can do both.** The tractor's bench and the truck's road are one chapter, one institute, a few years apart. Road figures also average stops and hills, so the two are not the same kind of number. The model sits between them, and the lesson says so.

**K33, the truck's power: 70.8 kW against 49.8.** And K25: 30 % high on average, from +7 % (the MF 1100) to +49 %. Specific power on gas across the fleet is 6.2 to 8.8 kW/L; the model's 7.5 to 10.2. **Speeds are unknown** except where given, and strokes too: a lower speed would close much of it. The tests with the mixers (Fig. 3.14) and with this truck's lowered compression (Table 3.15) show what such details cost, and none is in the model, by refusal as well as by choice. **So K22's +7 % is partly luck:** the MF 1100 is the fleet's best per litre, and the model reads every engine by one law. **Plausible for this truck: 50 to 70 kW.**

**K18, K14, and the gas that does not close.** Table 3.13 gives 5.60 MJ/Nm³ and, with the hearth load, 2.17 Nm³/kg, 71 %. K46's middle gives 5.09 MJ/Nm³. Research takes N₂ at 50–54 % from it. **No balance closes all of these on CH₁.₄O₀.₆.** At 2.17 Nm³/kg and K46's middle, 13 % of the carbon is not in the gas (tested). 5.6 MJ/Nm³ asks more methane than K46 allows at that nitrogen, or less nitrogen than it prints. The model's own gas is thinner and more plentiful: 2.45 Nm³/kg at 5.27 MJ/Nm³. **Moving the 15 % of loss cannot do it:** 5.6 MJ/Nm³ needs about 13 %, and then 78 % efficiency; 71 % needs about 18 %, and then 4.8 MJ/Nm³. Tar and soot, a richer pyrolysis, or a flow meter's offset could each be part of it. **Not settled.**

**K13's trend.** The model's gas rises towards idle as the outlet cools, by Fig. 2.6's own effect. The table is flat. And **the model's hearth at a long idle reads 370 °C, where no reduction would run,** while the table's gas at idle is as rich as at work. So the idle test was short and the bed still hot, or the wall's 12 W/K is too much. The chemistry is not moved by the hearth.

**K42's top.** The table's own durations do not reach FAO's 25 min per hour. It says: « assuming that the vehicle is used eight hours per day ». Footnotes put the cooler's condensate into the fill, and ash and gasifier condensate into preparation. Failures are in the other table, and repairs may be in FAO's figure. Not settled.

## 4. What the model finds with no target

### 4.1 The load

Total efficiency, %, and chips, kg/h, against load:

| Load, % | 0   | 10  | 20   | 30   | 40   | 50   | 60   | 70   | 80   | 90   | 100  |
| ------- | --- | --- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| Total   | 0   | 6.8 | 11.8 | 15.6 | 18.3 | 19.9 | 20.8 | 21.5 | 21.6 | 21.4 | 21.2 |
| Chips   | 6.9 | 9.1 | 10.9 | 12.7 | 14.7 | 17.3 | 20.2 | 23.1 | 26.6 | 30.4 | 34.3 |

FAO's Fig. 3.11 has the same shape, by eye: 10 at 20 %, 15.5 at 40 %, 18 at 60 %, 19 at 72 %, 18 at 100 %. **Friction and the throttle make the fall, not the gas:** the gas is about flat.

### 4.2 The moisture

At 40 kW, jacket draining 70 %, starred above 20 %:

| Wet, %      | 8    | 12   | 16   | 20   | 24   | 28   | 32   | 36   | 40   | 44   |
| ----------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| MJ/Nm³      | 5.27 | 5.19 | 5.10 | 5.00 | 4.90 | 4.79 | 4.67 | 4.54 | 4.40 | 4.25 |
| CO, %       | 20.9 | 20.2 | 19.5 | 18.8 | 18.0 | 17.2 | 16.3 | 15.4 | 14.4 | 13.4 |
| Chips, kg/h | 34.3 | 36.1 | 38.1 | 40.4 | 42.9 | 45.8 | 49.0 | 52.8 | 57.2 | 62.5 |
| Flame, °C   | 1076 | 1061 | 1046 | 1029 | 1011 | 992  | 972  | 950  | 926  | 900  |
| Dew, °C     | 34   | 35   | 37   | 38   | 40   | 41   | 43   | 44   | 46   | 48   |
| Jacket, L/h | 1.9  | 3.0  | 4.3  | 5.7  | 7.2  | 9.0  | 11.0 | 13.3 | 16.0 | 19.2 |

**The drain carries a lot here,** and it is one reported sentence about another test. Without it the gas reaches 4.2 MJ/m³ at 40 %.

### 4.3 The room

A stop in an even box, default 1 m³ \*: ppm, middle [low..high by the door's assumed air]. **Every number here is an estimate, and none is a line.**

| Garage, door   | At 10 min            | At 30 min            | At 2 h             | Room above at 2 h | Its highest, when |
| -------------- | -------------------- | -------------------- | ------------------ | ----------------- | ----------------- |
| 50 m³, shut    | 2,891 [2,632..3,004] | 3,498 [2,495..4,021] | 1,232 [239..2,461] | 629 [75..1,275]   | 670, about 88 min |
| 50 m³, ajar    | 2,514 [1,929..2,891] | 2,121 [883..3,498]   | 114 [7..1,232]     | 219 [20..885]     | 353, about 55 min |
| 50 m³, open    | 1,775 [696..2,514]   | 687 [105..2,121]     | 4 [0..114]         | 64 [5..308]       | 160, about 37 min |
| 1,000 m³, shut | 150 [137..156]       | 197 [140..227]       | 98 [16..202]       | 41 [4..131]       | 42, about 104 min |

**The source term decides it.** The same room, shut, at 30 min: 0.2 m³, 705 ppm; 5 m³, 16,879 ppm. Spread over three hours, 1,140 ppm, and at 2 h 1,549 ppm. **A lid that does not seal:** 19,756 ppm at 2 h on 10 cm², 5,367 on 3 cm², 49,116 on 30 cm². The fan alone: 200 ppm a minute in 1,000 m³, by arithmetic. The idling engine in 50 m³: 769 ppm at one minute.

**On the open door.** The box says it falls quickly. That is what the box is built to say. S3, having had this experience: « far from satisfactory ». **The lab must never show this row without that sentence,** and the alarm `coDoorOpen` says it.

### 4.4 The filter at idle

Idling 15 °C air: the box settles at 35 °C against a dew point of 33 °C. At −5 °C air, 16.5 °C: the fabric wets, by this model. **A find, on estimated walls:** a machine left at idle in the cold chills its filter below the gas's dew point. S3 says the hazards are greatest in winter, for other reasons.

### 4.5 What cooling is worth

Full throttle, mixture from 20 to 50 °C: −0.36 % of brake power per K, against −0.31 % of charge: friction amplifies it. So **about 1 % per 3 K**, density's own figure with a little more. Conflict 18: FAO's « 10 % → almost 2 % » and S4's 1 % per 10 °F are both under this.

## 5. How little a match proves

Each row moves one thing. **Bold** rows are the levers; the rest move little.

| Row                        | Chips, max, part, idle | MJ/Nm³     | Cold gas, % | Total, %   | Full power, kW | Flame, °C    | N₂, %      | Wet at 4.2 MJ/m³, % |
| -------------------------- | ---------------------- | ---------- | ----------- | ---------- | -------------- | ------------ | ---------- | ------------------- |
| **Base**                   | **34.3, 23.9, 6.9**    | 5.27       | 75.5        | 21.2       | 54.6           | 1,076        | 48.9       | 45                  |
| **Heat loss 5, 10 %**      | 29.8, 31.9             | 6.96, 6.06 | 88.3, 82.0  | 23.9, 22.5 | 67.7, 61.1     | 764, 929     | 39.4, 44.4 | 63, 56              |
| **Heat loss 20, 25 %**     | 37.2, 40.9             | 4.54, 3.84 | 68.9, 61.7  | 19.7, 18.2 | 48.1, 41.5     | 1,213, 1,345 | 53.1, 57.1 | 25, below 8         |
| **η_i 0.36, 0.43**         | 38.5, 31.6             | 5.22, 5.30 | 75.1, 75.8  | 19.1, 22.7 | 46.9, 60.3     | 1,098, 1,060 |            | 44, 46              |
| **η_v 0.7, 0.9**           | 33.7, 34.8             |            |             | 21.5, 20.9 | 49.0, 59.5     |              |            |                     |
| Burn at work 90, 100 %     | 36.7, 33.4             |            |             | 20.0, 21.7 | 49.9, 56.6     |              |            |                     |
| Frozen at 600, 1,000 °C    | 34.3, 34.4             | 5.22, 5.38 | 75.5, 75.6  | 21.2, 21.1 | 54.1, 55.7     |              |            | 44, 48              |
| Methane 1.8, 3.6 mol/kg    | 34.3, 34.3             | 5.10, 5.41 | 75.4, 75.7  | 21.1, 21.2 | 53.6, 55.4     |              |            | 42, 48              |
| Friction's peak 50, 90 bar | 33.7, 34.9             |            |             | 21.5, 20.8 | 55.6, 53.5     |              |            |                     |
| No residue                 | 32.2                   | 5.38       | 80.5        | 22.3       | 55.6           | 1,119        |            | 48                  |
| No drain                   | 34.3                   | 5.21       | 75.4        | 21.2       | 54.0           | 1,047        |            | 40                  |
| Char 10, 20 mol C/kg       |                        |            |             |            |                | 940, 1,263   |            |                     |

**The heat loss moves everything,** and it is a condition of FAO's calculation. **The frozen temperature moves almost nothing,** so the composition's agreement is not evidence for it. **K22 sits on η_i and η_v,** both from a range. **What most needs a measurement:** the casing's and jacket's real losses, then this engine's real indicated efficiency, then, for the garage, the volume after a stop.

## 6. Limits

- **The chemistry's end is fixed:** one frozen temperature at every load. Reduction is never incomplete, the gas at a long idle is as good as at work, and the air is what the balance asks. Channelling, bridging and slag are not in it.
- **No flame goes out.** At any moisture and any load the model has a fire. FAO's « not combustible » is carried as an alarm, not found. K59's agreement is on a heating value.
- **The tar is not predicted,** and its plug-flow estimate uses rates from memory and a time the state never holds. **No dust, tar or acid changes the power, the wear or the filter's law.**
- **The engine has no flame speed, no knock, no timing, no compression, no pilot's effect** beyond its energy. All of those, by refusal as well as simplicity. So it cannot see what made its engines differ.
- **One equivalent pipe,** an estimated cooler, an estimated outlet.
- **A fine's power** is only its pressure: FAO says half or more is the gas's quality.
- **The diesel's power** is an input, with no smoke.
- **The room is well mixed.** S3: « in a garage, carbon monoxide is not evenly mixed with the air but occurs in layers or areas with considerably higher concentrations ». **A real room can be worse than this box's high figure.** Nothing here has hot gas rising, cold gas sinking, a plume, a corner or a stair. It does not know the door's real air. It does not know how gas gets through a floor. **It computes no explosive range, no fire, no person.**
- **Nothing was measured on this machine in a room,** by anyone read (research §2.11).
- **A fault's size** is a guess, each said.
- **There is no start.** A machine stopped for hours and set running just runs, with its filter cold and wet if it has cooled below the gas's dew point: no lighting, no fan, no warm-up exists in the model (R3).
- **Not a plan.** Nothing here shows that a build or a run would be acceptable or allowed.

## 7. What was read beyond the research, and what it changes

### 7.1 What was read and what only the research reports

**The research's cache held no gasifier folder:** `~/.cache/lab-review/research/` has none, and FAO's chapter is in no folder there. **So FAO's pages and S3 were fetched again, once each, on 2026-11-03. No site refused,** so no question of going around one arose. They are in the session's scratchpad, not in the repository.

**Read here, line by line or as images, 2026-11-03.** S1: §2.1 and Table 2.1; §2.2, Tables 2.2, 2.3 and Figs. 2.4–2.6; §2.4.2–2.4.3 and Table 2.4; §2.8.1 and Table 2.9; §3.1 and Tables 3.3–3.8; §3.2, Tables 3.10–3.18 and Fig. 3.11; §3.6; Appendix 1. S3: pp. 308–312 and p. 260. **Compared with the research, and the same to the digit:** K1–K30, K32–K44, K46's Table 2.3, K47's K_we and 700 °C, K48–K50, K51's Table 2.9, K53's 10,000, K54, K59–K64.

**Only the research reports, not read here.** S1 §2.5 (K47's oxidation band of 1,200–1,500 °C, the start of pyrolysis at 250 °C: a design section, not asked for, R2), Table 3.2, Figs. 3.2–3.4 and 3.8 (sizes and layout). S2 (CH₁.₄O₀.₆, ER 0.25, K52, K55, « sometimes for hours »). S3's other pages (850–900 °C, K56, K58, Table 6). S4 (K31's ratio, its Table 3-2). S5 (K57, K65's limits). S6, S7, S8, S10, S11, S12, S13: all of it, so the MF's stroke, the 5.8 L's bore. **Before a visitor reads the ladder's limits or S2's phrase, the fact-checker should read S5 and S2.**

### 7.2 For the research role and the lead: please absorb

1. **Table 3.4 reads on normal cubic metres.** S1's Table 2.1 notes that a gas volume is normal « unless otherwise specified, throughout the publication », and the table specifies nothing. Research §2.10 read it at 200 °C and found about 400 mm of water, 39 mbar at the test maximum. **On normal metres it is 216 mm in this model, about 21 mbar.** The model's choice, on that footnote. A truck's reported chips at 60 km/h on 6 m² then give 195 mm, inside K63's 150–200: **this also agrees, and it was not the reason.** The other reading is possible. It moves full power by about 2 kW.
2. **K27:** research says its 0.57 stands below FAO's reading. FAO's product is 0.46–0.72: it is inside.
3. **A new conflict, 23.** S3 p. 310 says 0.02–0.03 % is « equivalent to 1 m³ generator gas in 1000 m³ air, and 1 m³ exhaust gases from a generator gas car during idling in 5000 m³ air ». At S3's own 5–8 %, that exhaust makes **10–16 ppm,** not 200–300. A misprint in the translation (500? 250?) or the OCR. Research quotes the first half only. Do not quote the second.
4. **K62 against K64.** The dew point 45–60 °C at 20–35 % moisture is what the model gives with **no** drain, 47–57 °C. With K64's 70 % drained it gives 38–44 °C. Either the dew point was measured or computed without the jacket, or the drain is less at those moistures. FAO does not say. New.
5. **K25's table** gives each engine's volume; research's list leaves them out. In `reported.ts`.
6. **S1 Table 3.6 carries a part-load series** on a Fordson Power Major, and a full-power series on a Scania L5150, with efficiencies. Research cites its range. In `reported.ts`, and they are the best evidence here on engine efficiency.
7. **S1 Table 2.9 has a first row, « 50 ppm, no significant effects ».** Research's K51 leaves it out, rightly: against the legal 20 ppm, and a line to stay under. **Sheet 8 must not bring it back.**
8. **S3 p. 260 gives a ventilation, four air changes an hour, for starting indoors.** It also says « preferably on the ground floor », and S3 p. 309 says the unit « should be allowed to cool for at least 20 minutes before the car is driven into the garage ». **The model does not use these, and no text should repeat them:** a ventilation, a wait and a place are an operating procedure and read as a way to make it acceptable (R3, R5, §A.1). The model's door estimates are not from there.

### 7.3 What moved during this work, and why

1. **Where the wood's heat is paid.** First the gas carried the drying past the throat: the flame then rose with moisture, which FAO §2.4.3 and any stove deny, and the hearth read 860 °C. Moved on the energy's path, not on a target: the flame now falls with moisture. **It moved K47 away from the band (1,217 → 1,076 °C) and K59 away from 40 % (38 → 45 %),** and K13 from 5.17 to 5.27.
2. **η_v from 0.85 to 0.8,** on reading FAO's Appendix 1 and its middle, before any full-power run.
3. **η_i from 0.396 to 0.40,** on reading Table 3.6: it says more, this tractor says less. That moved K22 by about 1 kW.
4. **15 % of loss:** research's range was 5–25 %. FAO's caption gives the figure. The model's first runs were on it.
5. **The filter on normal metres.** §7.2.
6. **The lid's leak, 3 to 10 cm²: the one input an outcome moved.** At 3 cm² the fire fades in about 1.5 h, and S3 describes a unit that goes on « like a stove ». 10 cm² is what about 0.6 mm on the seal gives, and the state's figures are spanned in the lesson from 3 to 30. It touches nothing but this fault.
7. **An early room reported a pair at the low and high ends of the door and the floor together,** whose « high » could fall under the middle. They are separate now.

## 8. Assumptions that drive the results, for the owner

1. **The 15 % of heat loss.** FAO's calculating condition, and the lever on everything (§5). Nobody's measurement here. The casing's own surface sum finds about 8 %.
2. **η_i at 0.40,** between this tractor (0.36–0.39) and the book's other engines (0.415–0.43). **At 0.36 the table prints; that would be a fit.** It is the reason K11 is off. Tell me if you would rather lead with this tractor's own bench, which is what a visitor might expect.
3. **A cubic metre after a stop.** The garage's whole height rests on it, and it is S3's illustration. **I would show the slider beside the number, as the biodigester shows its Ea.**
4. **The door's and floor's air,** wide, and spanned in the state.
5. **The jacket's 70 %.** It carries K59's 45 %.
6. **Table 3.4 on normal metres.**

## 9. For the 3D, the data role and the film

**Dimensions.** `MF_1100`, `SCANIA_L8050`, `LAYOUT`, `lowerCasingHeight` and `NOT_PRINTED` in `src/sim/machine.ts`: `src/three/dims.ts` imports from there, as the biodigester's does. **`NOT_PRINTED` is geometry. It is not to be retyped into a sheet, a spec, a lesson or a voice.**

**State, read every frame, flat.** `GasState` in `src/sim/types.ts`, each key's word in `tags.ts`.

- **`farm`:** `workedHours`, `chipsUsedKg`, `dieselUsedKg`, `ashKg`, `condensateL`, `fillCount`, `serviceMinutes`, `serviceMinPerHour`, `groundSpeedMs`, `hour`.
- **`tractor`:** `engineOn`, `engineRpm`, `powerKw`, `casingT`, `gasFlowShare`, `groundSpeedMs`, `bunkerShare`, `exhaustCO`.
- **`gasifier`:** `analyser` (written in place, `{zone, chipT, chipWater, chipMass, gasT, xCO, xH2, xCH4, xCO2, xH2O, xN2, xO2, tarShare}`; the cursor is `params.journey`, not to scale), `zoneDryingT`, `zonePyrolysisT`, `zoneOxidationT`, `zoneReductionT`, `outletT`, `casingT`, `bunkerShare`, `bunkerKg`, `bunkerMinutesLeft`, `chipFallCmMin`, `chipFallHours`, `grateMoving`, `equivalenceRatio`, `airPerKg`, `reductionKw`, `tarCrackedShare`, `tarG`, `condensateJacketLph`.
- **`gas-train`:** `hearthDropMbar`, `filterDropMbar`, `filterDropMmWg`, `pipeDropMbar`, `trainDropMbar`, `filterInT`, `filterT`, `filterWet`, `filterHours`, `filterAgeKm`, `coolerOutT`, `mixT`, `dustMg`, `condensateCoolerLph`, `coolerVesselShare`, `gasMJ`, `gasCO`, `gasH2`, `gasCH4`, `gasCO2`, `gasN2`, `gasH2O`, `dewPointC`, `mixtureMJ`, `petrolMixtureMJ`, `deratingVsPetrol`, `airToGas`, `chargeShare`, and the Sankey: `woodKw`, `dieselKw`, `gasKw`, `gasifierLossKw` (of which `lossHotGasKw`, `lossResidueKw`, `lossCasingKw`), `shaftKw`, `engineLossKw`, `totalLossKw`, `totalEff`, `dieselShare`.
- **`garage`:** `place`, `door`, `garageVolume`, `garageCoPpm`, `garageCoPpmLow`, `garageCoPpmHigh`, `roomAboveCoPpm`, `roomAboveCoPpmLow`, `roomAboveCoPpmHigh`, `ladderRung`, `coLatched`, `minutesSinceStop`, `pressureSign` ('suction', 'pressure', 'none'), `gaugeMbar` (**null after a stop**), `plumeLpm`, `plumeCoLpm`, `plumeShare` (0–1, for the 3D), `plumeTotalM3`, `plumeVisible` (white or yellow is what S3 reports, for wood, not measured here).

**Never displayed, and why.** `NEVER_DISPLAYED` in `tags.ts`, a test holds the names:

| What                                                                                                 | Why                                                                                           | Where it lives                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Throat, nozzles, firebox, reduction height, their ratios                                             | R2                                                                                            | `NOT_PRINTED`, geometry for the 3D. The model does not read them                                                    |
| Hearth load                                                                                          | R2: the first number of any sizing                                                            | Computed in `figures.test.ts`, nowhere else                                                                         |
| `hearthRefFlow`, a machine's scale for K60's pressure drop                                           | R2: read with the throat, it is a hearth load                                                 | `machine.ts`, internal                                                                                              |
| Speed and time of the gas in the hot zone                                                            | R2, the same rule in another unit. The lesson may say « hundredths of a second » with no size | `FLAME_ZONE_TIME` in `plant.ts`, internal                                                                           |
| The filter's load in m³/h·m², its face speed                                                         | R2: Table 3.4's axis                                                                          | Inside `filterDrop`. Sheets give areas and drops                                                                    |
| Pilot per stroke or revolution, injection timing, compression                                        | R4                                                                                            | `pilotPerRev`, internal. The state gives kg/h, as the table does. FAO's cubic millimetres are not in the repository |
| A dose, a blood level, a time to a rung, a time left                                                 | R5                                                                                            | Nowhere. S3's « less than a minute » for the idling engine is in a test                                             |
| FAO's « 50 ppm, no significant effects »; S3's 20 minutes of cooling, four air changes, ground floor | R3, R5, §A.1                                                                                  | Nowhere                                                                                                             |

**For the data role.** Scenarios and alarms in `texts.ts`, tested against the runs, and against a list of wordings no text may use. **The lessons should not say:** that the model retrieves the machine (§3.3); that a door or a volume helps; that 20 minutes is when it ends; that `tarCrackedShare` predicts tar. **`ROOM_NOTE` is said once, at the room.** The warning of research §A.4 and the line on poisoning (R6) are the lab's: they are not in `src/sim`.

**Film contract.** `LabSim`, flat keys, `applyPreset`, `applyScenario`, `reset`, `set({ engineOn: false })` for the stop, `set({ load })`, `set({ moistureWet })`, `set({ door })`, `set({ garageVolume })`. No gesture of use exists. Moments as numbers: `fillCount`, `stoppedOnce`, `minutesSinceStop`. No random number, no wall clock. One clock: `timeScale`. The column falls about 1.2 cm a minute in the model, 1.5 by the table's chips.

**Say to the writer.** Dual fuel 51 kW measured; the model 54.6 kW, and it is high across the fleet. 221 kW in, 40 out, on a bench whose engine burned a third more than a good diesel. The gas falls to what engines want near 40 %, as FAO says, but the model has no flame. A closed garage: an estimate whose number depends on a volume nobody measured, and the real room is worse. Not one figure says when it ends.
