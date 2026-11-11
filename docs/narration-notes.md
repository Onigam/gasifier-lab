# Notes of the narrator for the lead (2026-11-11)

Found while writing the spoken guide from the sheets. None of these is for the narrator to settle: the sheets and the lessons are not the narrator's to edit, and the voice says none of them as a number it could not stand behind.

## A size that equals a refused one, printed on a sheet

The spec « Diamètre × hauteur de la soute » of `fuel-casing` prints the bunker's diameter. It is a reported overall size (S1 Table 3.2), and the sheet is right to give it. But the number is, to the centimetre, `2 × UNIT.lowerR`, the lower casing's outer diameter, which `GASIFIER_REFUSED` withholds and `src/data/refusals.test.ts` lists among the refused lengths. The guard lets it through only because the printed form is « a × b m », with another number between the first and the unit: a reader who sees that the two casings are drawn about as wide as each other has the lower casing's width from the bunker's. The voice does not say it (it says the bunker's volume in litres and the chips' mass). The lead may want to decide whether the sheet keeps the diameter. The number is not written here: R2 reaches this file too.

## Disposal wording on two sheets

`condensate-barrel` (« Ce liquide ne doit rejoindre ni le sol, ni un égout, ni l'eau ») and `field-ditch` (« les condensats ne doivent atteindre ni le sol, ni les égouts, ni l'eau ») say where the black water must not go, which `docs/data.md` calls disposal advice that the lab does not give (« what they contain, and ask your local authority »). The lint `OPERATING_*` cannot see it: it is not an imperative of an operating verb. The voice says what the water holds, the ratio to the wartime sewer limit, and « voyez votre autorité locale », and on neither part where it must not go: `field-ditch` is told as a question (« où allait l'eau noire ? ») that no source answers.

## Read in summary only, and left out of the voice

The sheets print them; the voice does not say them, because they stand on the sources `docs/data.md` lists as read in summary and the fact-check has not read yet. If the fact-check confirms them, they can be added at the cost of about 200 characters.

- The nine deaths in pellet stores (`chip-barn`): the voice says only that stored wood gives off carbon monoxide.
- The French and European limits of 20 and 100 ppm and the alarms of 25 and 50 ppm (`co-indicator`).
- The 17 deaths of 1939 to 1941 and the 155 defective gasifiers of 230 (`farm-garage`, `spring-lid`): the voice says the fire count (2,865) and the first quarter of 1942, which the tables' sums confirm.
- « Sometimes for hours » (`post-gas-plume`): the voice says « parfois des heures selon un autre manuel » and no source's name.

## What the voice leaves to the sheets

- No emergency number and no first-aid line: they are the entry notice's, the Sources panel's and the garage overview's (`docs/data.md`, « Said once »).
- The two losses of the casing (12,5 and 24 kW): the voice says that the two accounts « ne se recoupent pas » and that the lab keeps both.
- The door's ajar row (2,100 ppm) and the model's 3,500 ppm for the shut door are said once, at `garage-door`, each time with the Swedes' verdict before the open-door figure.
- The sizes of the hot parts: not said, not hinted. The narration is held by the same guards as the sheets: `src/data/docs-guard.test.ts` and `src/data/refusals.test.ts` read the scripts' number words back as digits (`src/data/spoken.ts`).
