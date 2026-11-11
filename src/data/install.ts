// Installation guide: FROM THE CHIP HEAP TO THE END OF A WORKING DAY, 10 steps (docs/research.md §0.5, §4.6), what the institute reported of how the tractor was put to work on a farm: the chips, the store, the roof, the 30 to 45 minutes of preparation as a length of time and nothing else, the training,
// the field, the stop every 40 to 50 minutes, the residues, a season's failures, and the stop at the end of the day. The same honesty as the assembly guide: said once in the first step (a reading of published work, not a procedure; nothing here shows that a use would be acceptable or allowed), every step
// ending on its origin, no gesture, no setting, no duration but the institute's own (research §A.2, R3, R7, R9). No instruction: lighting, fanning, refuelling, emptying, shutting down and restarting are never described. Each step plays in one world, and names the parts that appear in it.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { step } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'chips',
    scene: 'farm',
    title: l('Les plaquettes, coupées puis criblées', 'The chips, cut then sieved'),
    text: step(
      'reported',
      'Ce guide raconte comment l’institut a mis ce tracteur au travail, d’une réserve de bois à la fin d’une journée : **c’est une lecture de travaux publiés, pas une procédure**, et rien ici ne montre qu’un tel usage serait acceptable ou permis. Tout commence à la **déchiqueteuse** et au **crible**. Des plaquettes convenables faisaient pour l’essentiel de 15 à 30 mm, selon une répartition type du rapport, et criblées de 10 à 40 mm, elles donnaient 21,1 kW contre 16,8 sans crible, au prix de 14 % de bois jeté.',
      'This guide tells how the institute put this tractor to work, from a store of wood to the end of a day: **it is a reading of published work, not a procedure**, and nothing here shows that such a use would be acceptable or allowed. Everything starts at the **chipper** and the **sieve**. Suitable chips were mostly 15 to 30 mm, by a typical distribution in the report, and sieved to 10–40 mm, they gave 21.1 kW against 16.8 unsieved, at the price of 14% of the wood thrown away.',
    ),
    parts: ['drum-chipper', 'chip-sieve'],
  },
  {
    id: 'store',
    scene: 'farm',
    title: l('Au sec, pour un poste entier', 'Dry, for a whole shift'),
    text: step(
      'reading',
      'Les plaquettes attendaient dans la **grange**, au sec : 8 % d’humidité pour l’essai du bilan, 30 % comme limite haute, et au-delà d’environ 40 % le gaz ne brûle plus. Un poste de huit heures en demandait {shiftKg}. Le bois stocké peut dégager du monoxyde de carbone : une alerte britannique de 2012 compte au moins neuf morts, depuis 2002, après l’entrée dans des stockages fermés de granulés en Europe.',
      'The chips waited in the **barn**, dry: 8% moisture for the balance test, 30% as the upper limit, and past about 40% the gas no longer burns. A shift of eight hours took {shiftKg}. Stored wood can give off carbon monoxide: a British safety alert of 2012 counts at least nine deaths since 2002 after entry into closed wood-pellet stores in Europe.',
      ['pour la grange ; les chiffres sont rapportés', 'for the barn; the figures are reported'],
    ),
    parts: ['chip-barn'],
  },
  {
    id: 'rack',
    scene: 'tractor',
    title: l('Sur le toit', 'On the roof'),
    text: step(
      'reported',
      'La soute ne tient que 40 à 50 minutes : de grandes quantités de plaquettes étaient donc portées sur le toit, sur la **galerie** de la cabine. Le modèle brûle {chipsShiftModel} sur une journée de huit heures. Le rapport ne dit pas comment on les y montait, ni ce que ce poids faisait à l’équilibre du tracteur, et ce lab ne le décrit pas.',
      'The bunker holds only 40 to 50 minutes: large amounts of chips were therefore carried on the roof, on the cab’s **rack**. The model burns {chipsShiftModel} over a day of eight hours. The report does not say how they were got up there, or what that weight did to the tractor’s balance, and this lab does not describe it.',
    ),
    parts: ['roof-rack'],
  },
  {
    id: 'preparation',
    scene: 'farm',
    title: l('Trente à quarante-cinq minutes, chaque jour', 'Thirty to forty-five minutes, every day'),
    text: step(
      'reported',
      'La préparation du **tracteur** prenait de 30 à 45 minutes chaque jour. C’est tout ce que dit le rapport : une durée, pas un contenu. Ce lab n’y met rien d’autre, parce que décrire cette préparation serait décrire comment allumer un gazogène, et il ne le fait pas.',
      'Preparing the **tractor** took 30 to 45 minutes each day. That is all the report says: a length of time, not a content. This lab puts nothing else there, because describing that preparation would be describing how to light a gasifier, and it does not.',
    ),
    parts: ['wood-gas-tractor'],
  },
  {
    id: 'driver',
    scene: 'tractor',
    title: l('Des élèves à la place des conducteurs', 'Students in the drivers’ place'),
    text: step(
      'reported',
      'À la **cabine**, d’abord des élèves de l’école d’agriculture : les conducteurs habituels n’en voulaient pas, parce que c’était long, sale et lourd. Il fallait de une à deux semaines pour apprendre. Le sommet du gazogène arrivait tout près de l’œil du conducteur, la vue vers l’avant gauche était en partie cachée, et la conduite en ville n’était pas aimée.',
      'In the **cab**, at first students from the agricultural school: the regular drivers did not want it, because it was time-consuming, dirty and heavy. It took one to two weeks to learn. The top of the gasifier came very close to the driver’s eye, the view forward on the left was partly blocked, and city driving was disliked.',
    ),
    parts: ['cab'],
  },
  {
    id: 'field',
    scene: 'farm',
    title: l('Le travail du sol', 'Soil work'),
    text: step(
      'reported',
      'Le travail, c’était le sol : un **brise-mottes** de 4 m, une herse de 5 m, des disques, un rouleau de 6 à 10 m, sur des betteraves, des céréales, de l’engrais. Plus de 2 500 heures de service en six ans, transports compris, dans deux grandes fermes du sud de la Suède, et 2 830 heures dans le tableau des essais. À 40 kW à l’arbre, le modèle trouve {chipsModel} de plaquettes ; le banc en avait mesuré 41.',
      'The work was the soil: a 4 m **clod crusher**, a 5 m harrow, discs, a roller of 6 to 10 m, over beets, grain and fertiliser. More than 2,500 hours of service in six years, transport included, on two large farms in the south of Sweden, and 2,830 hours in the tests’ table. At 40 kW at the shaft, the model finds {chipsModel} of chips; the bench had measured 41.',
    ),
    parts: ['clod-crusher'],
  },
  {
    id: 'refill',
    scene: 'gasifier',
    title: l('Un arrêt tous les trois quarts d’heure', 'A stop every three quarters of an hour'),
    text: step(
      'reported',
      'La **colonne** de plaquettes se vidait en 40 à 50 minutes, et l’institut remplissait donc la soute toutes les 40 à 50 minutes, en moins de 5 minutes. À la main, avec 41 kg de plaquettes à l’heure, on trouve {bunkerHand} ; le modèle, avec ses propres 34 kg, en trouve {bunkerMin}. Le rapport ne décrit pas le geste, et ce lab non plus.',
      'The **column** of chips emptied in 40 to 50 minutes, and the institute therefore filled the bunker every 40 to 50 minutes, in under 5 minutes. By hand, with 41 kg of chips an hour, it comes to {bunkerHand}; the model, with its own 34 kg, finds {bunkerMin}. The report does not describe the gesture, and neither does this lab.',
    ),
    parts: ['chip-column'],
  },
  {
    id: 'residues',
    scene: 'farm',
    title: l('Ce que la journée laissait', 'What the day left'),
    text: step(
      'reported',
      'La cendre, jusqu’à 3,5 % du combustible, allait au **bac à cendres** toutes les 8 à 15 heures. L’eau noire, des condensats de refroidisseur, de chemise et de tuyaux, allait au **fût**, toutes les 2 à 3 heures pour le refroidisseur. Ce que ces résidus devenaient ensuite, le **fossé** y compris, n’est dit nulle part dans ce que nous avons lu.',
      'The ash, up to 3.5% of the fuel, went to the **ash bin** every 8 to 15 hours. The black water, condensates from the cooler, the jacket and the pipes, went to the **barrel**, every 2 to 3 hours for the cooler. What those residues became afterwards, the **ditch** included, is not said anywhere in what we read.',
    ),
    parts: ['ash-bin', 'condensate-barrel', 'field-ditch'],
  },
  {
    id: 'season',
    scene: 'gasifier',
    title: l('Les pannes d’une saison', 'A season’s failures'),
    text: step(
      'reported',
      'D’après l’expérience cumulée de plusieurs véhicules du programme, les pièces s’usaient dans cet ordre : la **grille** de 400 à 700 heures, l’**anneau de gorge** vers 700, le **foyer** de 600 à 1 000, et l’**enveloppe**, de 2 000 à 4 000 heures, rouillait. Les manches du filtre tenaient de 500 à 1 000 heures. La seule panne grave de ce tracteur, un moteur, est probablement venue de l’eau d’un bac de refroidisseur trop plein.',
      'By the accumulated experience of several of the programme’s vehicles, the parts wore in this order: the **grate** at 400 to 700 hours, the **throat ring** near 700, the **fire box** at 600 to 1,000, and the **outer casing**, at 2,000 to 4,000 hours, corroded. The filter’s bags lasted 500 to 1,000 hours. This tractor’s one serious failure, an engine, probably came from the water of an overfull cooler vessel.',
    ),
    parts: ['grate', 'throat-ring', 'fire-box', 'outer-casing'],
  },
  {
    id: 'stop',
    scene: 'garage',
    title: l('La fin de la journée', 'The end of the day'),
    text: step(
      'reading',
      'À la fin du travail, le tracteur pouvait rentrer au garage. Le livre suédois range parmi les pires accidents du pays ceux de voitures au couvercle non étanche garées dans un garage sous une pièce où l’on vit : le moteur s’arrête, l’aspiration cesse, et le **panache** de gaz sort. Les sources ne s’accordent pas sur la durée (une vingtaine de minutes, parfois des heures) : aucune ne dit à partir de quand une pièce n’en garde plus. Aucune consigne n’est donnée ici : ni délai, ni aération.',
      'At the end of the work, the tractor could go into the garage. The Swedish book ranks among the country’s worst accidents those of cars with a lid that did not seal, parked in a garage under a living room: the engine stops, suction ends, and the **plume** of gas comes out. The sources do not agree on how long it lasts (about twenty minutes, sometimes hours): none says from when a room holds none of it. No instruction is given here: no delay, no ventilation.',
    ),
    parts: ['closed-garage', 'post-gas-plume'],
    warning: l(
      'Le monoxyde de carbone ne se voit pas et ne se sent pas, et ce garage est une estimation : une vraie pièce peut être pire que la boîte du modèle.',
      'Carbon monoxide cannot be seen or smelt, and this garage is an estimate: a real room can be worse than the model’s box.',
    ),
  },
];
