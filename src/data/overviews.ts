// The text of the side panel while nothing is selected in a world: `{ title, text }` per world, for the lead to wire in src/lab.ts (`scenes[i].overview = { ...OVERVIEWS.farm, actions: [...] }`; the actions use the `go…` strings of src/i18n/ui.ts). Bold on part names, what to look at, how to start;
// a blank line is a paragraph break. Each says what the world is and what to look at; the marks and the setting are told once in `farm`, the zones’ order in `gasifier`, the cyclone’s place in `gas-train`, and the warning of the garage, in full, once, in `garage` (research §A.4, Q5). No « this is a model » is
// said twice, and no refusal is repeated: they are the Sources panel’s and the guides’ (research §A.2).
import { type L } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

export const WORLD_IDS = ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'] as const;
export type WorldId = (typeof WORLD_IDS)[number];

/** One plain line, in the first world, on what this machine makes: the first screen must not stay silent on it (the full warning is the Sources panel’s). */
export const GAS_LINE = {
  fr: 'Un gazogène fabrique du monoxyde de carbone : c’est sa raison d’être. Ce gaz ne se voit pas et ne se sent pas, et il a tué des gens attentifs.',
  en: 'A gasifier makes carbon monoxide: that is what it is for. The gas cannot be seen or smelt, and it has killed people who were being careful.',
} as const;

export const OVERVIEWS: Record<WorldId, { title: L; text: L }> = {
  farm: {
    title: lf(
      'Un tracteur qui brûlait du bois, dans le sud de la Suède',
      'A tractor that burned wood, in the south of Sweden',
    ),
    text: lf(
      `Une grande ferme du sud de la Suède, vers 1970, un soir de juin : le **tracteur** et son **brise-mottes**, la **grange** à plaquettes, la **déchiqueteuse** et le **crible**, la **ferme** et son **garage**, le **bac à cendres**, le **fût** d’eau noire et le **fossé**. **${GAS_LINE.fr}**\n\n**La ferme n’a aucune source** : sa terre, ses bâtiments, son garage et sa chambre sont des estimations, dessinées à l’échelle d’un tracteur de cinq tonnes. Ce qui est réel, c’est ce que la machine y a fait : plus de 2 500 heures en six ans. **Pour commencer** : cliquez le tracteur, puis activez **Flux** pour suivre le bois, de la grume au toit, et ce qu’il laisse, la cendre et l’eau noire.\n\n**Les chiffres** : sans marque, publiés ; † calculés sur des chiffres publiés, ou par le modèle là où cette machine a été mesurée ; * estimés faute de source, ou le modèle ailleurs.`,
      `A large farm in the south of Sweden, around 1970, a June evening: the **tractor** and its **clod crusher**, the chip **barn**, the **chipper** and the **sieve**, the **farmhouse** and its **garage**, the **ash bin**, the **barrel** of black water and the **ditch**. **${GAS_LINE.en}**\n\n**The farm has no source**: its land, its buildings, its garage and its bedroom are estimates, drawn at the scale of a five-tonne tractor. What is real is what the machine did there: more than 2,500 hours in six years. **To start**: click the tractor, then switch on **Flows** to follow the wood, from the log to the roof, and what it leaves, ash and black water.\n\n**The figures**: no mark, published; † computed on published figures, or by the model where this machine was measured; * estimated for want of a source, or the model elsewhere.`,
    ),
  },
  tractor: {
    title: lf('Quatre cent cinquante kilos de plus sur un tracteur', 'Four hundred and fifty kilos more on a tractor'),
    text: lf(
      'La machine, sur le papier, qui roule sur place : le **tracteur**, son **moteur diesel**, le **gazogène** sur le flanc gauche porté par ses **consoles**, la **ligne de gaz** avec le filtre et le refroidisseur, la **galerie** sur la cabine. Le système ajoute 450 kg à un tracteur de 5 090 kg, et son sommet, à 2,22 m, arrive presque à l’œil du conducteur.\n\n**À regarder** : **Éclaté** écarte chaque pièce le long de sa ligne, **Transparence** ouvre la cabine et le capot, et **Flux** montre le gaz, du gazogène au mélangeur. Les pièces sous le capot, la pompe, l’écran et le régulateur, sont dessinées d’après la description du rapport : leurs tailles sont des estimations. **Cliquez le gazogène** pour l’ouvrir en coupe, la **ligne de gaz** pour la voir à plat.',
      'The machine, on paper, rolling on the spot: the **tractor**, its **diesel engine**, the **gasifier** on the left flank carried by its **consoles**, the **gas line** with the filter and the cooler, the **rack** on the cab. The system adds 450 kg to a tractor of 5,090 kg, and its top, at 2.22 m, almost reaches the driver’s eye.\n\n**What to look at**: **Explode** moves each part along its line, **X-ray** opens the cab and the bonnet, and **Flows** shows the gas, from the gasifier to the mixer. The parts under the bonnet, the pump, the shield and the governor, are drawn from the report’s description: their sizes are estimates. **Click the gasifier** to open it in section, the **gas line** to see it laid flat.',
    ),
  },
  gasifier: {
    title: lf('Le voyage d’une plaquette de bois', 'The journey of a wood chip'),
    text: lf(
      'L’appareil **toujours en coupe** : la **soute** et son **couvercle**, la **colonne de plaquettes**, les quatre zones, **séchage**, **pyrolyse**, **oxydation**, **réduction**, le **foyer**, la **grille** et le **cendrier**. La fausse couleur va de 20 à 1 400 °C, et c’est le modèle qui la donne : une plaquette y tombe en une heure environ, et le gaz traverse le même lit en quelques centièmes de seconde.\n\n**À essayer** : faites glisser le **curseur du voyage**. Un curseur suit une plaquette du couvercle au cendrier, et un analyseur lit le gaz autour d’elle. Les zones y sont dans l’ordre et pas à l’échelle, exprès : ce lab n’imprime pas les tailles du foyer. Regardez la réduction : le gaz s’y **refroidit**, et c’est là qu’il devient combustible.\n\n**Éclaté** écarte les pièces vers le haut et le côté ouvert, **Flux** suit le gaz et l’air.',
      'The apparatus **always in section**: the **bunker** and its **lid**, the **column of chips**, the four zones, **drying**, **pyrolysis**, **oxidation**, **reduction**, the **fire box**, the **grate** and the **ash pit**. The false colour goes from 20 to 1,400 °C, and it is the model that gives it: a chip falls there in about an hour, and the gas crosses the same bed in hundredths of a second.\n\n**To try**: drag the **journey slider**. A cursor follows one chip from the lid to the ash pit, and an analyser reads the gas around it. The zones are in order and not to scale, on purpose: this lab does not print the sizes of the hearth. Watch the reduction: the gas **cools** there, and that is where it becomes fuel.\n\n**Explode** moves the parts up and to the open side, **Flows** follows the gas and the air.',
    ),
  },
  'gas-train': {
    title: lf('Là où va l’énergie', 'Where the energy goes'),
    text: lf(
      'Dans l’ordre du gaz, à plat : le **gazogène** et sa **sortie**, le **tuyau chaud**, la **vanne d’arrêt**, le **ventilateur** et sa **cheminée**, le **filtre**, le **refroidisseur**, le **mélangeur** et les **papillons**, l’**injecteur pilote**, un **cylindre** ouvert, l’**échappement**. À l’écart, le **cyclone** du système à filtre à toile du programme : il n’est pas sur le schéma de ce tracteur.\n\n**À regarder** : sur le sol, les **rubans** de l’énergie, 1 cm pour 2 kW, sans un chiffre : le bois qui entre, le gaz, le gazole qui s’y joint, le travail à l’arbre, et en gris les pertes. Au banc, {kwIn} entrent pour 40 kW à l’arbre, soit 18 %. Le gaz est chaud au filtre, au-dessus de son point de rosée, et froid au moteur : chacun a sa raison. Le cylindre est le seul coupé, à tout moment.',
      'In the order of the gas, laid flat: the **gasifier** and its **outlet**, the **hot pipe**, the **stop valve**, the **fan** and its **stack**, the **filter**, the **cooler**, the **mixer** and the **throttles**, the **pilot injector**, an opened **cylinder**, the **exhaust**. Apart, the **cyclone** of the programme’s fabric-filter system: it is not on this tractor’s schematic.\n\n**What to look at**: on the floor, the energy’s **ribbons**, 1 cm for 2 kW, with no figure: the wood going in, the gas, the diesel that joins it, the work at the shaft, and in grey the losses. On the bench, {kwIn} go in for 40 kW at the shaft, which is 18%. The gas is hot at the filter, above its dew point, and cold at the engine: each has its reason. The cylinder is the only one cut, at all times.',
    ),
  },
  garage: {
    title: lf('Ce qu’elle fait quand on s’arrête', 'What it does when you stop'),
    text: lf(
      '**Un gazogène fabrique du monoxyde de carbone, c’est sa raison d’être. Environ un cinquième du gaz dans ces tuyaux en est fait : il ne se voit pas, il ne se sent pas, et il a tué des gens qui faisaient attention.** Ce lab explique une machine de l’histoire : ce n’est ni un plan, ni une procédure, ni un conseil. En cas de doute sur une intoxication : à l’air libre, on ne retourne pas à l’intérieur, on appelle le 112 (le 15 en France, le 144 en Suisse).\n\nLe même **tracteur**, garé dans le **garage** de la ferme, sous une **chambre**. Le moteur s’arrête : l’aspiration cesse, le gaz continue de se former, et le **panache** sort, même d’une machine étanche. Rien ne dit quand cela finit. Personne n’est dessiné. **À regarder** : l’**indicateur** au mur, dont la lampe ne s’éteint plus, et la **porte**, avec le chiffre qui tombe quand elle s’ouvre. **Pour le lancer** : la **Simulation**, « Le garage fermé ».\n\nLes ppm sont ceux d’une boîte, pas d’un garage : la note de la Simulation dit pourquoi.',
      '**A gasifier makes carbon monoxide: that is what it is for. About a fifth of the gas in these pipes is made of it: it cannot be seen, it cannot be smelt, and it has killed people who were being careful.** This lab explains a machine from history: it is not a plan, a procedure or advice. If you suspect poisoning: get into the open air, do not go back in, call 112 (15 in France, 144 in Switzerland).\n\nThe same **tractor**, parked in the farm’s **garage**, under a **bedroom**. The engine stops: suction ends, the gas goes on forming, and the **plume** comes out, even from a machine that looked sealed. Nothing says when it ends. Nobody is drawn. **What to look at**: the **indicator** on the wall, whose lamp never goes out again, and the **door**, with the figure that falls when it opens. **To run it**: the **Simulation**, “The closed garage”.\n\nThe ppm are those of a box, not of a garage: the Simulation’s note says why.',
    ),
  },
};
