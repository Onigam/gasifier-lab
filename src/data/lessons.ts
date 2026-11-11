// The seven lessons of the lab, in the order of docs/research.md §0.6: 1 the match, 2 the gas that kills, 3 the journey of a chip, 4 what the engine gets, 5 dirty gas, 6 where the energy goes, 7 what a day costs. Each opens a world, a part and one of the simulation's twelve scenarios, and names the others it
// needs by the name the panel gives them, so that all twelve are reachable from a lesson (lessons.test.ts checks it).
// Shape: four paragraphs of at most 95 words, fourteen questions in all, three choices of about the same length, the longest right about one time in three (lessons.test.ts), a wrong choice for each misconception the text names.
// Numbers: no mark, reported by a source; † computed, from published figures or by the model where this machine was measured; * an estimate, or the same model where it was not. What docs/physics.md says not to write is not written: that the model retrieves the machine (the wood is 34 kg an hour against 41,
// and it is said), that a door or a volume helps, that 20 minutes is when it ends, that the tar is predicted. The throat is explained and not sized; no lesson says how to build, light, run or make safe any part of it.
import type { Lesson, Spec } from '@onigam/lab-kit/content';
import { getLang, l, type L } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

/** A formula that carries words is read in the language of the moment: the kit shows `formula` as a plain string, read each time a lesson opens. */
const words = (fr: string, en: string): string => (getLang() === 'fr' ? fr : en);

const chip = (fr: string, en: string, value: L | string): Spec => ({ label: l(fr, en), value });

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ 1
  {
    id: 'the-match',
    title: l('La flamme qui ne touche pas le bois', 'The flame that does not touch the wood'),
    summary: l(
      'Un gazogène, c’est le petit vide entre une flamme et son bois, rendu plus grand : un feu qui manque d’air à dessein.',
      'A gasifier is the small gap between a flame and its wood, made bigger: a fire short of air on purpose.',
    ),
    body: [
      l(
        'La flamme d’une allumette ne touche pas le bois. Entre elle et lui, il y a un petit vide : du gaz qui s’échappe du bois chauffé, et c’est lui qui brûle. Un gazogène, c’est ce petit vide rendu plus grand. On chauffe le bois sans lui donner assez d’air pour qu’il brûle tout entier, et ce qui s’en échappe est un gaz. Le feu est gardé en réserve, jusqu’au moteur.',
        'A match’s flame does not touch the wood. Between them there is a small gap: gas escaping from the heated wood, and it is that gas that burns. A gasifier is that small gap made bigger. The wood is heated without enough air to burn it whole, and what escapes it is a gas. The fire is kept in reserve, until the engine.',
      ),
      l(
        'Tout tient au manque d’air. Dans le feu, environ 30 % du bois brûle, avec un rapport d’équivalence d’environ 0,25 selon un manuel : un feu qui manque d’air, à dessein. Le reste, chauffé par ce feu, devient charbon et vapeurs, puis un gaz dont le monoxyde de carbone fait de 17 à 22 %, avec de l’hydrogène, un peu de méthane, et surtout l’azote de l’air.',
        'It all comes down to the lack of air. In the fire, about 30% of the wood burns, with an equivalence ratio of about 0.25 by one handbook: a fire short of air, on purpose. The rest, heated by that fire, becomes char and vapours, then a gas whose carbon monoxide makes up 17 to 22%, with hydrogen, a little methane, and above all the nitrogen of the air.',
      ),
      lf(
        'Lancez « L’heure mesurée ». À 40 kW à l’arbre, le modèle trouve {chipsModel} de plaquettes, un gaz de {gasModel} et un rendement de {effModel}. Le banc a mesuré 41 kg, 5,60 MJ/Nm³ et 18 %. Le moteur du modèle brûle mieux que celui du banc, comme les autres moteurs du même livre, et son gazogène aussi : il n’atteint pas la table, et on ne l’y pousse pas.',
        'Run “The measured hour”. At 40 kW at the shaft, the model finds {chipsModel} of chips, a gas of {gasModel} and an efficiency of {effModel}. The bench measured 41 kg, 5.60 MJ/Nm³ and 18%. The model’s engine burns better than the bench’s did, as do the other engines of the same book, and so does its gasifier: it does not reach the table, and is not pushed there.',
      ),
      l(
        'C’est pourquoi cette machine mérite une leçon sur le gaz, pas sur le feu. Elle ne brûle pas le bois : elle le fait parler. En quatre zones, la plaquette sèche, se défait, brûle un peu, puis donne son énergie au gaz. Chaque zone a sa fiche, et le curseur du voyage les traverse dans l’ordre.',
        'That is why this machine deserves a lesson on gas, not on fire. It does not burn the wood: it makes it speak. In four zones, the chip dries, comes apart, burns a little, then gives its energy to the gas. Each zone has its sheet, and the journey slider crosses them in order.',
      ),
    ],
    get formula() {
      return words('bois + peu d’air → CO + H₂ + CH₄ + CO₂ + N₂', 'wood + little air → CO + H₂ + CH₄ + CO₂ + N₂');
    },
    figures: [
      chip('Part du bois qui brûle', 'Share of the wood that burns', l('environ 30 %', 'about 30%')),
      chip('Monoxyde du gaz', 'Carbon monoxide of the gas', l('17 à 22 %', '17 to 22%')),
      chip(
        'Plaquettes à 40 kW, modèle puis banc',
        'Chips at 40 kW, model then bench',
        lf('{chipsModel} · 41 kg/h', '{chipsModel} · 41 kg/h'),
      ),
    ],
    focus: { scene: 'gasifier', part: 'oxidation-zone', scenario: 'measured-hour' },
    quiz: [
      {
        q: l('Dans une flamme de bois, ce qui brûle, c’est…', 'In a wood flame, what burns is…'),
        choices: [
          l('le bois lui-même, tel quel', 'the wood itself, as it is'),
          l('la poussière qui se détache du bois', 'the dust that comes off the wood'),
          l('le gaz que le bois chauffé laisse échapper', 'the gas the heated wood lets escape'),
        ],
        answer: 2,
        explain: l(
          '**Le gaz.** Entre la flamme et le bois, le petit vide est rempli de gaz qui s’échappe du bois chauffé : c’est lui qui brûle, et un gazogène le garde pour le moteur.',
          '**The gas.** Between the flame and the wood, the small gap is filled with gas escaping from the heated wood: it is what burns, and a gasifier keeps it for the engine.',
        ),
      },
      {
        q: l('Pourquoi un gazogène manque-t-il d’air à dessein ?', 'Why is a gasifier short of air on purpose?'),
        choices: [
          l(
            'Pour que le bois laisse un gaz et ne brûle pas entier',
            'So the wood leaves a gas and does not burn whole',
          ),
          l(
            'Pour refroidir la tôle du foyer, qui chauffe beaucoup au travail',
            'To cool the fire box’s sheet, which gets very hot at work',
          ),
          l(
            'Pour économiser les plaquettes et allonger l’autonomie de la soute',
            'To save chips and make the bunker last longer between fillings',
          ),
        ],
        answer: 0,
        explain: l(
          '**Pour garder un gaz.** Avec assez d’air, le bois brûlerait en entier et ne laisserait que des cendres : c’est le manque d’air, environ 30 % du bois qui brûle, qui fait du gaz.',
          '**To keep a gas.** With enough air, the wood would burn whole and leave only ash: it is the lack of air, about 30% of the wood burning, that makes gas.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 2
  {
    id: 'the-gas-that-kills',
    title: l('Le gaz qui tue', 'The gas that kills'),
    summary: l(
      'Le monoxyde ne se voit pas ; et le moment le plus dangereux de la machine est celui où elle s’arrête.',
      'Carbon monoxide cannot be seen; and the machine’s most dangerous moment is the one when it stops.',
    ),
    body: [
      l(
        'Le monoxyde de carbone n’a ni couleur ni odeur. Dans le sang, il prend la place de l’oxygène et s’y accroche environ 250 fois plus volontiers : on ne le sent pas, et ses premiers signes se prennent pour autre chose : une intoxication alimentaire, une ivresse. Parfois, un syndrome tardif apparaît après une rémission de 7 à 21 jours ; des séquelles sont possibles. Un cinquième du gaz de ces tuyaux en est fait.',
        'Carbon monoxide has neither colour nor smell. In the blood, it takes the place of oxygen and clings to it about 250 times more readily: it cannot be smelt, and its first signs are easily taken for something else: food poisoning, drunkenness. Sometimes a delayed syndrome appears after a symptom-free interval of 7 to 21 days; after-effects are possible. A fifth of the gas in these pipes is made of it.',
      ),
      l(
        'En marche, tout le système est en dépression : une fuite aspire de l’air. Le moteur s’arrête, l’aspiration finit, et le gaz continue de se former dans le lit chaud. La pression monte pendant environ 20 minutes selon le livre suédois, parfois des heures selon un autre manuel, et le gaz sort, même d’un appareil étanche, à 23 à 27 % de monoxyde. Lancez « Le moteur s’arrête ».',
        'When running, the whole system is under suction: a leak draws air in. The engine stops, suction ends, and the gas goes on forming in the hot bed. The pressure rises for about 20 minutes by the Swedish book, sometimes for hours by another handbook, and the gas comes out, even from a tight apparatus, at 23 to 27% carbon monoxide. Run “The engine stops”.',
      ),
      lf(
        'Un mètre cube de ce gaz, {postGas}, dans un garage fermé de 50 m³ : la boîte monte à environ {ppm50} en une demi-heure, quand le gaz des tuyaux en compte 200 000 ppm. Dans 1 000 m³, environ {ppm1000}. Lancez « Le garage fermé » : une porte ouverte baisse le chiffre ; les Suédois ont jugé très insuffisant de lancer le ventilateur ou le moteur portes ouvertes. Les sources ne s’accordent pas sur la durée : aucune ne dit à partir de quand une pièce n’en garde plus.',
        'A cubic metre of this gas, {postGas}, in a closed garage of 50 m³: the model’s box climbs to about {ppm50} in half an hour, when the gas in the pipes holds 200,000 ppm. In 1,000 m³, about {ppm1000}. Run “The closed garage”: an open door lowers the figure; the Swedes found it far from satisfactory to fan or start with the doors open. The sources do not agree on how long it lasts: none says from when a room holds none of it.',
      ),
      l(
        'Un manuel américain, citant un ouvrage de 1983, compte 17 morts en Suède de décembre 1939 à mars 1941, par négligence dans la conduite des gazogènes. Environ 10 000 cas chroniques ont été enregistrés de 1941 à 1945, et 2 865 incendies de véhicules de 1939 à 1944. Au premier semestre de 1945, 155 des 230 véhicules contrôlés après des signalements de la police avaient un gazogène défectueux. C’est la raison de ce lab : il explique cette machine, il ne dit ni comment la faire, ni comment la conduire.',
        'An American handbook, citing a 1983 work, counts 17 deaths in Sweden from December 1939 to March 1941, from careless operation of gasifiers. About 10,000 chronic cases were recorded from 1941 to 1945, and 2,865 vehicle fires from 1939 to 1944. In the first half of 1945, 155 of the 230 vehicles checked after police reports had a faulty gasifier. That is the reason for this lab: it explains this machine, it does not say how to make it, or how to run it.',
      ),
    ],
    get formula() {
      return words(
        'Hb + CO → HbCO, 250 fois plus avidement que Hb + O₂',
        'Hb + CO → HbCO, 250 times more readily than Hb + O₂',
      );
    },
    figures: [
      chip('Monoxyde du gaz après l’arrêt', 'Carbon monoxide of the gas after a stop', l('23 à 27 %', '23 to 27%')),
      chip(
        'Poussée du gaz, selon les livres',
        'The gas’s push, by the books',
        l('environ 20 min, parfois des heures', 'about 20 min, sometimes hours'),
      ),
      chip(
        'Suède, 1941 à 1945',
        'Sweden, 1941 to 1945',
        l('environ 10 000 cas chroniques', 'about 10,000 chronic cases'),
      ),
    ],
    focus: { scene: 'garage', part: 'post-gas-plume', scenario: 'engine-stops' },
    quiz: [
      {
        q: l('Après l’arrêt du moteur, le gaz du gazogène…', 'After the engine stops, the gasifier’s gas…'),
        choices: [
          l('cesse de se former, faute d’aspiration', 'stops forming, for want of suction'),
          l('ne sort que si le couvercle est ouvert', 'comes out only if the lid is open'),
          l(
            'continue de se former et sort, même d’un appareil étanche',
            'goes on forming and comes out, even from a tight apparatus',
          ),
        ],
        answer: 2,
        explain: l(
          '**Il continue.** Le lit chaud forme du gaz sans que le moteur le tire, la pression monte pendant environ 20 minutes, parfois des heures, et le gaz sort par où il peut, même d’un appareil étanche.',
          '**It goes on.** The hot bed forms gas with no engine drawing it, the pressure rises for about 20 minutes, sometimes hours, and the gas comes out wherever it can, even from a tight apparatus.',
        ),
      },
      {
        q: l(
          'Une porte ouverte fait tomber le chiffre de la boîte. Qu’en retient-on ?',
          'An open door makes the box’s figure fall. What is made of it?',
        ),
        choices: [
          l(
            'Que le chiffre de la boîte s’applique tel quel à une vraie pièce',
            'That the box’s figure applies as it stands to a real room',
          ),
          l(
            'Que les Suédois l’ont jugée très insuffisante au démarrage',
            'That the Swedes found it far from satisfactory for starting',
          ),
          l(
            'Que la porte compte moins que la taille du garage',
            'That the door counts for less than the garage’s size',
          ),
        ],
        answer: 1,
        explain: l(
          '**Très insuffisante.** La boîte est faite pour dire que le chiffre tombe ; le livre suédois juge très insuffisant de lancer le ventilateur ou le moteur portes ouvertes, et une vraie pièce garde le monoxyde en couches, et peut être pire.',
          '**Far from satisfactory.** The box is made to say that the figure falls; the Swedish book finds it far from satisfactory to fan or start with the doors open, and a real room holds carbon monoxide in layers, and can be worse.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 3
  {
    id: 'journey-of-a-chip',
    title: l('Le voyage d’une plaquette', 'The journey of a chip'),
    summary: l(
      'Quatre zones, un analyseur, et un gaz qui se refroidit pour devenir combustible.',
      'Four zones, an analyser, and a gas that cools to become fuel.',
    ),
    body: [
      lf(
        'Suivons une plaquette. En haut, la chaleur du feu chasse son eau : le séchage. Plus bas, à partir d’environ 250 °C, elle se défait en charbon et en vapeurs : la pyrolyse. Plus bas encore, une part du bois brûle, de 1 200 à 1 500 °C selon le rapport, et les vapeurs doivent traverser cette flamme : l’oxydation. Puis la réduction. La plaquette met environ {fallHours} à tout traverser.',
        'Let us follow a chip. At the top, the fire’s heat drives off its water: drying. Lower down, from about 250 °C, it comes apart into char and vapours: pyrolysis. Lower still, part of the wood burns, at 1,200 to 1,500 °C by the report, and the vapours must cross that flame: oxidation. Then reduction. The chip takes about {fallHours} to cross it all.',
      ),
      lf(
        'Dans la réduction, le gaz chaud traverse du charbon rouge. Le CO₂ y reprend du carbone et devient du CO, la vapeur d’eau devient de l’hydrogène. Ces réactions prennent de la chaleur : le gaz se refroidit d’environ {coolK}, et c’est là qu’il gagne son énergie. Le refroidissement n’est pas une perte : c’est de la chaleur qui devient du combustible.',
        'In reduction, the hot gas crosses red char. The CO₂ takes carbon back and becomes CO, the water vapour becomes hydrogen. These reactions take heat: the gas cools by about {coolK}, and that is where it gains its energy. The cooling is not a loss: it is heat becoming fuel.',
      ),
      lf(
        'Pourquoi un étranglement ? Les vapeurs descendent avec le bois, et si elles pouvaient contourner la flamme par les bords, elles sortiraient telles quelles, avec leurs goudrons. L’étranglement les force à traverser le point le plus chaud. Le gaz, lui, traverse le même lit en {gasTime}. Ce lab ne donne aucune taille de cette pièce : il explique ce qu’elle fait.',
        'Why a narrowing? The vapours go down with the wood, and if they could slip past the flame by the edges, they would come out as they are, with their tars. The narrowing forces them through the hottest point. The gas crosses the same bed in {gasTime}. This lab gives no size for that part: it explains what it does.',
      ),
      lf(
        'Lancez « Des plaquettes humides ». À 8, 20, 30 puis 40 % d’humidité, le gaz du modèle perd sa valeur : {gasModel}, {gasWet20}, {gasWet30} puis {gasWet40}, et les mêmes 40 kW demandent {chipsWet40}. Il atteint les 4,2 MJ/m³ que demandent les moteurs vers {wetLimit}. Mais sa flamme ne s’éteint jamais : ce qui arrête un vrai foyer n’est pas dans ce modèle.',
        'Run “Wet chips”. At 8, 20, 30 then 40% moisture, the model’s gas loses its worth: {gasModel}, {gasWet20}, {gasWet30} then {gasWet40}, and the same 40 kW take {chipsWet40}. It reaches the 4.2 MJ/m³ engines ask for near {wetLimit}. But its flame never goes out: what stops a real hearth is not in this model.',
      ),
    ],
    formula: 'C + CO₂ → 2 CO',
    figures: [
      chip('Début de la pyrolyse', 'Start of pyrolysis', l('environ 250 °C', 'about 250 °C')),
      chip('Oxydation, selon le rapport', 'Oxidation, by the report', l('1 200 à 1 500 °C', '1,200 to 1,500 °C')),
      chip('Refroidissement du gaz dans la réduction', 'Cooling of the gas in reduction', lf('{coolK}', '{coolK}')),
    ],
    focus: { scene: 'gasifier', part: 'reduction-zone', scenario: 'wet-chips' },
    quiz: [
      {
        q: l('Dans la zone de réduction, le gaz chaud…', 'In the reduction zone, the hot gas…'),
        choices: [
          l('se refroidit, car les réactions prennent de la chaleur', 'cools, because the reactions take heat'),
          l(
            'se réchauffe encore, car il y brûle toujours un peu de bois',
            'warms up further, because a little wood still burns there',
          ),
          l('garde sa température, car rien ne s’y passe', 'keeps its temperature, because nothing happens there'),
        ],
        answer: 0,
        explain: l(
          '**Il se refroidit.** C + CO₂ → 2 CO prend de la chaleur, comme la réaction de l’eau : le gaz perd de la température et gagne de l’énergie chimique. C’est là qu’il devient combustible.',
          '**It cools.** C + CO₂ → 2 CO takes heat, as the water reaction does: the gas loses temperature and gains chemical energy. It is there that it becomes fuel.',
        ),
      },
      {
        q: l('À quoi sert l’étranglement du foyer ?', 'What is the fire box’s narrowing for?'),
        choices: [
          l('À accélérer la descente du bois', 'To speed the wood’s descent'),
          l('À refroidir le gaz avant la grille', 'To cool the gas before the grate'),
          l(
            'À forcer les vapeurs à traverser le point le plus chaud',
            'To force the vapours through the hottest point',
          ),
        ],
        answer: 2,
        explain: l(
          '**Il force les vapeurs.** Sans lui, une part des vapeurs contournerait la flamme et sortirait avec ses goudrons. Ce lab n’en donne aucune taille : il explique ce qu’il fait.',
          '**It forces the vapours.** Without it, part of the vapours would slip past the flame and leave with their tars. This lab gives no size for it: it explains what it does.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 4
  {
    id: 'what-the-engine-gets',
    title: l('Ce que reçoit le moteur', 'What the engine gets'),
    summary: l(
      'Un tiers d’énergie en moins dans le mélange, et un diesel qui garde un filet de gazole.',
      'A third less energy in the mixture, and a diesel that keeps a thread of diesel.',
    ),
    body: [
      l(
        'Un mètre cube de gaz et d’air contient environ 2 500 kJ, quand le même volume d’essence et d’air en contient 3 800 : un tiers de moins, avant que le frottement, qui ne diminue pas, ne prenne sa part. C’est la première raison pour laquelle un moteur perd de la puissance au gaz. Le gaz brûle aussi lentement, et le rapport voit une limite vers 2 500 tr/min.',
        'A cubic metre of gas and air holds about 2,500 kJ, when the same volume of petrol and air holds 3,800: a third less, before friction, which does not shrink, takes its share. That is the first reason an engine loses power on gas. The gas also burns slowly, and the report sees a limit near 2,500 rpm.',
      ),
      l(
        'Un diesel n’a pas de bougie. Le gaz et l’air ne s’allument pas d’eux-mêmes, mais un filet de gazole, si : c’est le pilote. Le moteur garde un filet de gazole, et donne 51 kW au lieu de 64, soit 79 %. Le bois seul ne suffit donc pas : c’est la réponse honnête à la question de savoir si un moteur peut rouler au bois.',
        'A diesel has no spark plug. Gas and air do not light by themselves, but a thread of diesel does: that is the pilot. The engine keeps a thread of diesel, and gives 51 kW instead of 64, which is 79%. Wood alone is not enough: it is the honest answer to whether an engine can run on wood.',
      ),
      lf(
        'Lancez « Gaz et gazole, gazole seul, gaz seul ». Au gaz avec un filet de gazole, le modèle donne {powerModel} contre 51 kW mesurés : cet accord vaut peu, car le même modèle lit environ {fleetHigh} trop haut les autres moteurs du livre. Au gaz seul, à bougies, il trouve environ {sparkModel} : personne n’a mesuré ce moteur, mais deux diesels convertis sont passés de 71 à 34 kW, et de 42 à 19,6 kW.',
        'Run “Gas with diesel, diesel alone, gas alone”. On gas with a thread of diesel, the model gives {powerModel} against 51 kW measured: that agreement is worth little, because the same model reads about {fleetHigh} high on the book’s other engines. On gas alone, by spark, it finds about {sparkModel}: nobody measured this engine, but two converted diesels went from 71 to 34 kW, and from 42 to 19.6 kW.',
      ),
      lf(
        'Un moteur à bougies roule au gaz seul, à peu près à moitié de sa puissance : un Ford de 3,8 L est passé de 42 à 23 kW. Un diesel ne peut pas, il lui faut son filet. Dans la 3D, le cylindre coupé montre le cycle à {cylSpeed} de sa vraie vitesse, parce qu’à {trueTurns} l’œil ne verrait rien.',
        'A spark engine runs on gas alone, at about half its power: a 3.8 L Ford went from 42 to 23 kW. A diesel cannot, it needs its thread. In the 3D, the opened cylinder shows the cycle at {cylSpeed} of its true speed, because at {trueTurns} the eye would see nothing.',
      ),
    ],
    formula: 'P = ½ · n · V · η_v · H_m · η',
    figures: [
      chip(
        'Mélange, gaz contre essence',
        'Mixture, gas against petrol',
        l('2 500 contre 3 800 kJ/m³', '2,500 against 3,800 kJ/m³'),
      ),
      chip('Tracteur, au gazole puis au gaz', 'Tractor, on diesel then gas', l('64 puis 51 kW', '64 then 51 kW')),
      chip('Ford à bougies, avant puis après', 'Spark Ford, before then after', l('42 puis 23 kW', '42 then 23 kW')),
    ],
    focus: { scene: 'gas-train', part: 'cylinder-cutaway', scenario: 'three-engines' },
    quiz: [
      {
        q: l(
          'Pourquoi un diesel au gaz garde-t-il un filet de gazole ?',
          'Why does a diesel on gas keep a thread of diesel?',
        ),
        choices: [
          l(
            'Pour lubrifier les cylindres et les segments du piston',
            'To lubricate the cylinders and the piston rings',
          ),
          l('Pour allumer le mélange de gaz et d’air', 'To light the mixture of gas and air'),
          l('Pour refroidir le gaz avant le cylindre', 'To cool the gas before the cylinder'),
        ],
        answer: 1,
        explain: l(
          '**Pour l’allumer.** Le gaz et l’air ne s’enflamment pas d’eux-mêmes dans un diesel : le filet de gazole joue le rôle de la bougie, et un diesel en a encore besoin.',
          '**To light it.** Gas and air do not ignite by themselves in a diesel: the thread of diesel plays the spark plug’s part, and a diesel still needs it.',
        ),
      },
      {
        q: l(
          'Comparé à l’essence et l’air, un mètre cube de gaz et d’air contient…',
          'Compared with petrol and air, a cubic metre of gas and air holds…',
        ),
        choices: [
          l('environ un tiers d’énergie de moins', 'about a third less energy'),
          l('environ la même énergie', 'about the same energy'),
          l('environ deux fois plus d’énergie', 'about twice the energy'),
        ],
        answer: 0,
        explain: l(
          '**Un tiers de moins.** 2 500 kJ contre 3 800 : c’est la première perte de puissance, avant le frottement, le papillon et le reste.',
          '**A third less.** 2,500 kJ against 3,800: it is the first loss of power, before friction, the throttle and the rest.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 5
  {
    id: 'dirty-gas',
    title: l('Un gaz sale', 'A dirty gas'),
    summary: l(
      'Poussière, goudron, eau : chaud dans le filtre, froid au moteur, et une toile qui se mouille.',
      'Dust, tar, water: hot in the filter, cold at the engine, and a cloth that gets wet.',
    ),
    body: [
      l(
        'Le gaz sort sale : de la poussière, des goudrons, de l’eau. Une toile arrête la poussière : après le filtre à toile, il n’en reste que 0,3 mg/m³, contre 200 à 400 après le train à lavage de la guerre. Le moteur le dit : l’usure des cylindres, mesurée, va de 0,007 à 0,019 mm pour 1 000 heures avec la toile, et de 0,05 à 0,06 avec le lavage.',
        'The gas leaves dirty: dust, tars, water. A cloth stops the dust: after the fabric filter only 0.3 mg/m³ is left, against 200 to 400 after the wartime washing train. The engine says so: cylinder wear, measured, goes from 0.007 to 0.019 mm per 1,000 hours with the cloth, and from 0.05 to 0.06 with the wash.',
      ),
      lf(
        'Mais la toile se paie. Sur le camion, sa résistance partait de 150 à 200 mm d’eau, montait de 60 à 75 par 1 000 km, et doublait vers 3 000 km. Lancez « Le filtre s’encrasse » : sur 50 heures, le modèle double la résistance, et le moteur n’y perd que {filterAgeLoss}. Puis la toile se mouille : plus de six fois la résistance d’un coup, et {filterWetLoss} de puissance en moins.',
        'But the cloth has its price. On the truck, its resistance started at 150 to 200 mm of water, rose 60 to 75 per 1,000 km, and doubled near 3,000 km. Run “The filter clogs”: over 50 hours, the model doubles the resistance, and the engine loses only {filterAgeLoss} for it. Then the cloth gets wet: more than six times the resistance at once, and {filterWetLoss} less power.',
      ),
      lf(
        'D’où la logique de la ligne : le gaz reste chaud dans le filtre, au-dessus de son point de rosée, de 45 à 60 °C selon le rapport pour un bois à 20–35 % d’humidité, et froid au moteur, où un gaz plus dense remplit mieux le cylindre. Dans le modèle, la toile est à environ {filterT} et le gaz sort du refroidisseur à {coolerOut}. Chaque température a sa raison.',
        'Hence the logic of the line: the gas stays hot in the filter, above its dew point, 45 to 60 °C by the report for wood at 20–35% moisture, and cold at the engine, where a denser gas fills the cylinder better. In the model, the cloth is at about {filterT} and the gas leaves the cooler at {coolerOut}. Each temperature has its reason.',
      ),
      lf(
        'Le reste suit. Des plaquettes non criblées, trop de fines : 16,8 kW au lieu de 21,1, c’est « Les fines ». De l’air entré sous la grille brûle le gaz : « De l’air sous la grille » le fait passer de {gasModel} à {leakGasMJ}, et le filtre dépasse les 300 °C que sa toile tient. L’eau noire est une autre affaire : voyez le fût de la ferme.',
        'The rest follows. Unsieved chips, too many fines: 16.8 kW instead of 21.1, that is “Fines”. Air getting in under the grate burns the gas: “Air under the grate” takes it from {gasModel} to {leakGasMJ}, and the filter passes the 300 °C its cloth takes. The black water is another matter: see the farm’s barrel.',
      ),
    ],
    get formula() {
      return words(
        'perte du filtre = 150 à 200 mm d’eau + 60 à 75 mm par 1 000 km',
        'filter loss = 150 to 200 mm of water + 60 to 75 mm per 1,000 km',
      );
    },
    figures: [
      chip('Poussière après la toile', 'Dust after the cloth', l('0,3 mg/m³', '0.3 mg/m³')),
      chip('Toile mouillée', 'Wet cloth', l('plus de 6 fois la résistance', 'over 6 times the resistance')),
      chip(
        'Usure des cylindres, avec la toile',
        'Cylinder wear, with the cloth',
        l('0,007 à 0,019 mm / 1 000 h', '0.007 to 0.019 mm / 1,000 h'),
      ),
    ],
    focus: { scene: 'gas-train', part: 'filter-bags', scenario: 'filter-ageing' },
    quiz: [
      {
        q: l('Pourquoi le gaz doit-il rester chaud dans le filtre ?', 'Why must the gas stay hot in the filter?'),
        choices: [
          l(
            'Pour brûler jusqu’au dernier grain toute la poussière qu’il porte vers le moteur',
            'To burn up every last grain of the dust it carries towards the engine',
          ),
          l('Pour chauffer le caisson et la cabine du tracteur', 'To heat the box and the cab of the tractor'),
          l(
            'Pour ne pas passer sous son point de rosée et mouiller la toile',
            'To avoid falling below its dew point and wetting the cloth',
          ),
        ],
        answer: 2,
        explain: l(
          '**Pour garder la toile sèche.** Sous son point de rosée, le gaz condense, la toile se mouille, et sa résistance est multipliée par plus de six. Au moteur, c’est l’inverse : froid, il remplit mieux le cylindre.',
          '**To keep the cloth dry.** Below its dew point, the gas condenses, the cloth gets wet, and its resistance is multiplied by more than six. At the engine, it is the opposite: cold, it fills the cylinder better.',
        ),
      },
      {
        q: l('Après environ 3 000 km, la résistance de la toile…', 'After about 3,000 km, the cloth’s resistance…'),
        choices: [
          l('est divisée par deux', 'is halved'),
          l('double à peu près', 'about doubles'),
          l('reste la même', 'stays the same'),
        ],
        answer: 1,
        explain: l(
          '**Elle double.** Sur le camion, de 150 à 200 mm d’eau à neuf, plus 60 à 75 par 1 000 km : la poussière fait le reste. Le modèle retrouve ce doublement, et le moteur n’y perd presque rien tant que la toile reste sèche.',
          '**It doubles.** On the truck, 150 to 200 mm of water when new, plus 60 to 75 per 1,000 km: the dust does the rest. The model finds that doubling, and the engine loses almost nothing for it as long as the cloth stays dry.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 6
  {
    id: 'where-the-energy-goes',
    title: l('Où va l’énergie', 'Where the energy goes'),
    summary: l(
      'Plus de deux cents kilowatts en entrée, quarante à l’arbre : le reste chauffe l’air, la tôle, et ne fait rien.',
      'More than two hundred kilowatts going in, forty at the shaft: the rest heats the air, the sheet, and does nothing.',
    ),
    body: [
      lf(
        'Le banc a mesuré 40 kW à l’arbre. Pour les produire, il est entré {kwIn} : 41 kg de plaquettes à l’heure et 2,2 kg de gazole. C’est 18 % de rendement, et {lost82} de l’énergie se perd en chemin : 56 kW dans le gazogène, le reste dans le moteur et son échappement. Le modèle trouve moins de bois, {chipsModel} : son moteur brûle mieux que celui du banc, et son gazogène aussi.',
        'The bench measured 40 kW at the shaft. To make them, {kwIn} went in: 41 kg of chips an hour and 2.2 kg of diesel. That is 18% efficiency, and {lost82} of the energy is lost on the way: 56 kW in the gasifier, the rest in the engine and its exhaust. The model finds less wood, {chipsModel}: its engine burns better than the bench’s did, and so does its gasifier.',
      ),
      lf(
        'Lancez « Le ralenti ». Rien à l’arbre, mais 8,5 kg de plaquettes et 1,2 kg de gazole à l’heure : {idleIn} pour rien. Le frottement et le papillon en demandent environ {idleFriction} ; le modèle en conclut que le reste traverse le moteur sans brûler, et règle le ralenti sur le chiffre que le livre suédois lit à l’échappement, de 5 à 8 % de monoxyde. Avec ce seul chiffre, le modèle trouve {idleChips} de plaquettes à l’heure.',
        'Run “Idling”. Nothing at the shaft, but 8.5 kg of chips and 1.2 kg of diesel an hour: {idleIn} for nothing. Friction and the throttle ask about {idleFriction}; the model concludes that the rest goes through the engine unburnt, and sets the idle on the figure the Swedish book reads in the exhaust, 5 to 8% carbon monoxide. With that one figure, the model finds {idleChips} of chips an hour.',
      ),
      lf(
        'Lancez « La charge partielle ». La table imprime 5,3 % de rendement pour ce régime, mais sa propre courbe montre environ 19 %, et 29 kW sur {partIn} font {partEff}. Une coquille, ou un autre essai : le lab prend la courbe, et le dit. Le modèle place son meilleur point entre 70 et 80 % de la charge.',
        'Run “Part load”. The table prints 5.3% efficiency for this speed, but its own curve shows about 19%, and 29 kW out of {partIn} makes {partEff}. A misprint, or another test: the lab takes the curve, and says so. The model puts its best point between 70 and 80% of the load.',
      ),
      lf(
        'Lancez « Le camion ». Le même système sur 8 t : le rapport mesure 7,8 kg de plaquettes et 0,55 kg de gazole pour 10 km, soit environ 3,6 kg de plaquettes par kilo de gazole économisé. Le modèle est trop haut ici, {truckChips}, et trop bas sur le tracteur : ce camion brûlait à peu près autant d’énergie au gaz qu’au gazole, le tracteur au banc un tiers de plus. Aucun rendement ne fait les deux.',
        'Run “The truck”. The same system at 8 t: the report measures 7.8 kg of chips and 0.55 kg of diesel per 10 km, about 3.6 kg of chips per kilo of diesel saved. The model is too high here, {truckChips}, and too low on the tractor: this truck burned about as much energy on gas as on diesel, the tractor on the bench a third more. No single efficiency does both.',
      ),
    ],
    get formula() {
      return words(
        'rendement = travail à l’arbre ÷ (énergie du bois + énergie du gazole)',
        'efficiency = work at the shaft ÷ (energy of the wood + energy of the diesel)',
      );
    },
    figures: [
      chip('Entrée, sortie, au banc', 'In, out, on the bench', lf('{kwIn} · 40 kW', '{kwIn} · 40 kW')),
      chip('Part de l’énergie perdue', 'Share of the energy lost', lf('{lost82}', '{lost82}')),
      chip(
        'Plaquettes par kilo de gazole, camion',
        'Chips per kilo of diesel, truck',
        l('environ 3,6 kg', 'about 3.6 kg'),
      ),
    ],
    focus: { scene: 'gas-train', part: 'gas-throttle', scenario: 'idling' },
    quiz: [
      {
        q: l(
          'Sur le banc, à pleine charge, quelle part de l’énergie qui entre arrive à l’arbre ?',
          'On the bench, at full load, what share of the energy going in reaches the shaft?',
        ),
        choices: [
          l('environ 18 % seulement', 'only about 18% of it'),
          l('environ la moitié, comme un bon moteur', 'about half of it, like a good engine'),
          l('plus des trois quarts', 'over three quarters'),
        ],
        answer: 0,
        explain: lf(
          '**Environ 18 %.** 40 kW à l’arbre pour {kwIn} en entrée : le reste chauffe la tôle, le gaz, l’échappement, et se perd. C’est un tracteur qui travaille, pas un moteur qui brille.',
          '**About 18%.** 40 kW at the shaft for {kwIn} going in: the rest heats the sheet, the gas, the exhaust, and is lost. It is a tractor at work, not an engine to boast of.',
        ),
      },
      {
        q: l(
          'La table imprime 5,3 % de rendement à charge partielle. Que fait le lab ?',
          'The table prints 5.3% efficiency at part load. What does the lab do?',
        ),
        choices: [
          l(
            'Il l’utilise telle quelle pour tracer sa courbe de rendement',
            'It uses it as it stands to draw its efficiency curve',
          ),
          l(
            'Il note que la courbe donne 19 %, et y voit une coquille',
            'It notes the curve gives 19%, and sees a misprint',
          ),
          l(
            'Il l’écarte sans le dire, car elle le gêne dans sa courbe',
            'It drops it without saying so, because it is awkward for the curve',
          ),
        ],
        answer: 1,
        explain: lf(
          '**Il montre l’écart.** La courbe du même rapport, et 29 kW sur {partIn}, donnent {partEff} : le chiffre imprimé est une coquille ou un autre essai. Le lab ne règle rien pour le faire disparaître.',
          '**It shows the gap.** The same report’s curve, and 29 kW out of {partIn}, give {partEff}: the printed figure is a misprint or another test. The lab tunes nothing to make it vanish.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 7
  {
    id: 'what-a-day-costs',
    title: l('Ce que coûte une journée', 'What a day costs'),
    summary: l(
      'Des arrêts, un toit chargé, de l’eau noire, et des conducteurs qui n’en voulaient pas.',
      'Stops, a loaded roof, black water, and drivers who did not want it.',
    ),
    body: [
      lf(
        'Une journée de huit heures à pleine charge, dans le modèle : {chipsShiftModel} de plaquettes, dont beaucoup portées sur le toit, {fills} arrêts pour remplir la soute, de la cendre, de l’eau noire. L’institut comptait de 15 à 25 minutes de service par heure de travail ; les durées de ses propres tableaux n’en donnent que {serviceModel} dans le modèle. Lancez « Une journée de travail ».',
        'A day of eight hours at full load, in the model: {chipsShiftModel} of chips, much of it carried on the roof, {fills} stops to fill the bunker, ash, black water. The institute counted 15 to 25 minutes of service per hour of work; the durations of its own tables give only {serviceModel} in the model. Run “A working day”.',
      ),
      l(
        'Préparer la machine prenait de 30 à 45 minutes par jour, et la soute demandait un arrêt toutes les 40 à 50 minutes. Les conducteurs habituels n’en voulaient pas : c’était long, sale et lourd. Des élèves de l’école d’agriculture l’ont conduite, après une à deux semaines d’apprentissage. Voilà ce que coûtait une machine qui marchait.',
        'Preparing the machine took 30 to 45 minutes a day, and the bunker asked for a stop every 40 to 50 minutes. The regular drivers did not want it: it was time-consuming, dirty and heavy. Students from the agricultural school drove it, after one to two weeks of training. That is what a machine that worked cost.',
      ),
      l(
        'Elle marchait : plus de 2 500 heures en six ans, dans deux fermes du sud de la Suède, avec un brise-mottes de 4 m. Mais pas au bois seul : un filet de gazole, un cinquième de puissance en moins, 18 % d’énergie rendue, et un tracteur dont le sommet frôle l’œil du conducteur. La réponse honnête est : pas seul, et, selon le calcul du rapport pour la Suède, à perte.',
        'It worked: more than 2,500 hours in six years, on two farms in the south of Sweden, with a 4 m clod crusher. But not on wood alone: a thread of diesel, a fifth less power, 18% of the energy returned, and a tractor whose top brushes the driver’s eye. The honest answer is: not alone, and, in the report’s costing for Sweden, at a loss.',
      ),
      l(
        'Pourquoi la Suède la gardait-elle alors ? Parce que le gaz de bois était son plan officiel si le pétrole venait à manquer. En 1986 encore, son conseil de défense économique y voyait la seule option réaliste pour les tracteurs, camions et voitures. C’était une assurance, payée en travail : le lab la raconte, il ne la vend pas.',
        'Why did Sweden keep it, then? Because wood gas was its official plan if oil ran short. As late as 1986, its board for economic defence still saw it as the only realistic option for tractors, lorries and cars. It was an insurance, paid in work: the lab tells it, it does not sell it.',
      ),
    ],
    get formula() {
      return words('service = de 15 à 25 minutes par heure de travail', 'service = 15 to 25 minutes per working hour');
    },
    figures: [
      chip('Préparation, par jour', 'Preparation, per day', l('30 à 45 min', '30 to 45 min')),
      chip('Service, par heure de travail', 'Service, per hour of work', l('15 à 25 min', '15 to 25 min')),
      chip('Au champ', 'In the field', l('plus de 2 500 h en six ans', 'over 2,500 h in six years')),
    ],
    focus: { scene: 'farm', part: 'wood-gas-tractor', scenario: 'working-shift' },
    quiz: [
      {
        q: l('Pourquoi les conducteurs habituels n’en voulaient-ils pas ?', 'Why did the regular drivers not want it?'),
        choices: [
          l('Il coûtait plus cher en gazole que le diesel seul', 'It cost more in diesel than a diesel alone'),
          l('Le travail était long, sale et lourd', 'The work was time-consuming, dirty and heavy'),
          l('Il ne pouvait pas travailler dans un champ', 'It could not work in a field'),
        ],
        answer: 1,
        explain: l(
          '**Long, sale et lourd.** C’est ce que dit le rapport, et ce sont donc des élèves de l’école d’agriculture qui l’ont conduit, après une à deux semaines d’apprentissage.',
          '**Time-consuming, dirty and heavy.** That is what the report says, and so it was students of the agricultural school who drove it, after one to two weeks of training.',
        ),
      },
      {
        q: l('Ce tracteur roulait-il au bois seul ?', 'Did this tractor run on wood alone?'),
        choices: [
          l('Oui : le bois seul faisait tourner le moteur', 'Yes: wood alone ran the whole engine'),
          l(
            'Non : le gazole faisait l’essentiel du travail, le bois peu',
            'No: diesel did most of the work, wood little',
          ),
          l(
            'Non : un filet de gazole restait, et un cinquième de puissance manquait',
            'No: a thread of diesel remained, and a fifth of the power was missing',
          ),
        ],
        answer: 2,
        explain: l(
          '**Pas au bois seul.** Un diesel garde un filet de gazole pour allumer le gaz, et passe de 64 à 51 kW : c’est la réponse honnête de ce lab à « peut-il rouler au bois ? ».',
          '**Not on wood alone.** A diesel keeps a thread of diesel to light the gas, and goes from 64 to 51 kW: it is this lab’s honest answer to “can it run on wood?”.',
        ),
      },
    ],
  },
];
