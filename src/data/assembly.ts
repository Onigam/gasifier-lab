// Assembly guide: HOW THE INSTITUTE'S SYSTEM WENT TOGETHER, 20 steps (docs/research.md §0.5, §4.6). The visitor is not meant to build this machine, and the lab gives no plan: the guide tells, in the past tense, what each part is FOR and what it sits on, in the order a reading of the institute's
// Figs. 3.2a and 3.8 suggests. FAO gives no sequence: the order is OUR READING, and each step ends on its origin (reported, usual practice, our reading: `step` in part-helpers.ts; data.test.ts checks it).
//   - said once, in the first step: this is a reading of published work, not a procedure, and nothing here shows that a build would be acceptable or allowed (research §A.2, R1, R3, R8, R9);
//   - no tool, no torque, no duration, no material, no weld, no gasket, no tolerance, no dimension of the hot parts: `tools`, `torque` and `duration` stay empty (R1, R2);
//   - no imperative: a lint (data.test.ts) rejects one in French and in English;
//   - warnings where the gesture would be risky, once each: a closed space (8), air meeting gas at the lid (11), carbon monoxide at the fan (14), heat (19).
// Every id of `gasifier` and `gas-train` is installed in exactly one step; the base tractor and the farm are not parts that go together, and appear by themselves. A kit step plays in one world, so the unit's eleven steps are told in `gasifier`, the line's six in `gas-train`, the three on
// the tractor in `tractor`.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { step } from './part-helpers';

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'casing',
    scene: 'gasifier',
    title: l('Le corps du bas', 'The lower body'),
    text: step(
      'reading',
      'Ce guide raconte comment un système comme celui de l’institut suédois a pu s’assembler : **c’est une lecture de travaux publiés, pas une procédure**, et rien ici ne montre qu’en construire un serait acceptable ou permis. Tout part de l’**enveloppe**, le corps du bas, autour duquel le reste s’organise. C’est la pièce la plus durable du gazogène, de 2 000 à 4 000 heures avant la rouille, et elle est chaude.',
      'This guide tells how a system like the Swedish institute’s may have gone together: **it is a reading of published work, not a procedure**, and nothing here shows that building one would be acceptable or allowed. Everything starts from the **outer casing**, the lower body round which the rest is organised. It is the gasifier’s longest-lived part, 2,000 to 4,000 hours before rust, and it is hot.',
      ['d’après la figure du rapport', 'from the report’s figure'],
    ),
    parts: ['outer-casing'],
  },
  {
    id: 'ash-grate',
    scene: 'gasifier',
    title: l('Du cendrier à la grille', 'From the ash pit to the grate'),
    text: step(
      'reading',
      'Au fond, le **cendrier** reçoit la cendre et le charbon qui n’ont pas fini leur route : jusqu’à 3,5 % du combustible. Au-dessus, la **grille** porte le lit, et sa **commande** la relie à l’extérieur par un arbre qui traverse la paroi. Une grille fixe se bouchait en moins d’une heure, et celle de l’institut bougeait : la grille s’use la première, de 400 à 700 heures.',
      'At the bottom, the **ash pit** receives the ash and the charcoal that have not finished their journey: up to 3.5% of the fuel. Above it, the **grate** carries the bed, and its **linkage** joins it to the outside by a shaft that goes through the wall. A fixed grate clogged in under an hour, and the institute’s moved: the grate wears first, 400 to 700 hours.',
    ),
    parts: ['ash-pit', 'grate', 'grate-linkage'],
  },
  {
    id: 'fire-box',
    scene: 'gasifier',
    title: l('Le pot du feu', 'The pot of the fire'),
    text: step(
      'reading',
      'Sur la grille, le **foyer** : le pot où tient le feu. L’air passe entre lui et l’enveloppe avant d’entrer dans le feu. Il se fissurait entre 600 et 1 000 heures, selon l’expérience cumulée de plusieurs véhicules du programme : c’est une pièce d’usure. La matière du foyer n’est pas dite dans ce que nous avons lu.',
      'On the grate, the **fire box**: the pot where the fire stands. Air passes between it and the casing before entering the fire. It cracked between 600 and 1,000 hours, by the accumulated experience of several of the programme’s vehicles: it is a wearing part. The fire box’s material is not given in what we read.',
      ['pour sa vie ; sa place est notre lecture', 'for its life; its place is our reading'],
    ),
    parts: ['fire-box'],
  },
  {
    id: 'throat',
    scene: 'gasifier',
    title: l('L’étranglement', 'The narrowing'),
    text: step(
      'reading',
      'Dans le foyer, comme un pot dans un pot, l’**anneau de gorge**. Tout le gaz du feu doit passer par lui : c’est ce qui force les vapeurs et les goudrons à traverser le point le plus chaud, au lieu de contourner la flamme. Il tenait environ 700 heures. Ce guide ne dit rien de sa taille, parce que ce lab ne la donne nulle part.',
      'In the fire box, like a pot in a pot, the **throat ring**. All the fire’s gas must pass through it: that is what forces the vapours and tars through the hottest point, instead of slipping past the flame. It lasted about 700 hours. This guide says nothing of its size, because this lab gives it nowhere.',
      ['pour son rôle ; sa vie est rapportée', 'for its role; its life is reported'],
    ),
    parts: ['throat-ring'],
  },
  {
    id: 'air',
    scene: 'gasifier',
    title: l('L’air du feu', 'The fire’s air'),
    text: step(
      'reading',
      'L’air a été amené par la **prise d’air**, sur le côté, qui le conduit autour du foyer jusqu’aux **tuyères** : elles le répartissent dans le feu. C’est le moteur qui l’aspire, et c’est la même ouverture qui, à l’arrêt, laisse sortir le gaz. Ce guide ne donne ni nombre ni diamètre de tuyères : ce lab ne les imprime pas.',
      'Air was brought in through the **air intake**, on the side, which leads it round the fire box to the **nozzles**: they divide it into the fire. It is the engine that sucks it, and it is the same opening that, at a stop, lets the gas out. This guide gives neither a number nor a bore of nozzles: this lab does not print them.',
    ),
    parts: ['air-intake', 'air-nozzles'],
  },
  {
    id: 'outlet',
    scene: 'gasifier',
    title: l('Par où le gaz s’en va', 'Where the gas leaves'),
    text: step(
      'reported',
      'La **sortie de gaz** a été placée sur le côté, au niveau du feu. Le gaz y arrive encore chaud : le modèle l’estime vers {outletModel}, une valeur tenue dans la bande du rapport par une estimation. Il doit rester assez chaud pour ne pas se condenser plus loin, et assez froid pour ne pas brûler la toile du filtre, qui ne tient pas plus de 300 °C.',
      'The **gas outlet** was placed on the side, at the level of the fire. The gas reaches it still hot: the model puts it at about {outletModel}, a value held in the report’s band by an estimate. It has to stay hot enough not to condense farther on, and cool enough not to burn the filter’s cloth, which takes no more than 300 °C.',
      ['pour la place ; la température est une estimation', 'for the place; the temperature is an estimate'],
    ),
    parts: ['gas-outlet'],
  },
  {
    id: 'sleeve',
    scene: 'gasifier',
    title: l('Où l’eau du bois se condense', 'Where the wood’s water condenses'),
    text: step(
      'reported',
      'Autour de la soute, un **manchon** perforé et un espace derrière lui : la vapeur chassée du bois le traverse, se condense sur la paroi froide, et coule jusqu’à la **purge** qui la mène à un bac. De 60 à 80 % de l’eau du bois pouvait être tirée ainsi avant d’atteindre le feu. La chemise était nettoyée toutes les 75 à 135 heures, pendant 1 à 2 heures : ce guide ne dit pas comment.',
      'Round the bunker, a perforated **sleeve** and a space behind it: the vapour driven from the wood crosses it, condenses on the cold wall, and runs to the **drain** that leads it to a vessel. 60 to 80% of the wood’s water could be drawn off that way before it reached the fire. The jacket was cleaned every 75 to 135 hours, for 1 to 2 hours: this guide does not say how.',
    ),
    parts: ['condensate-sleeve', 'condensate-drain'],
  },
  {
    id: 'bunker',
    scene: 'gasifier',
    title: l('La soute et son verrou', 'The bunker and its lock'),
    text: step(
      'reading',
      'Le **corps à combustible** est venu au-dessus du corps du bas : la soute de 0,2 m³, qui tient 40 à 50 minutes de plaquettes. Un **verrou à came** serre la bande qui joint les deux corps, et c’est un joint de plus, donc un endroit où l’air peut entrer. Le rapport montre le verrou sur sa figure sans le décrire.',
      'The **fuel casing** came above the lower body: the 0.2 m³ bunker, which holds 40 to 50 minutes of chips. An **eccentric lock** tightens the band that joins the two casings, and it is one more joint, so one more place where air can get in. The report shows the lock in its figure without describing it.',
    ),
    parts: ['fuel-casing', 'eccentric-lock'],
    warning: l(
      'Deux chercheurs d’une université du Midwest américain sont morts du monoxyde de carbone après être descendus dans la soute d’un gazogène.',
      'Two researchers at a Midwestern university died of carbon monoxide after climbing into a gasifier’s bunker.',
    ),
  },
  {
    id: 'baffle',
    scene: 'gasifier',
    title: l('Loin de la paroi qui colle', 'Away from the wall that sticks'),
    text: step(
      'reported',
      'Dans la soute, le **déflecteur**. Le combustible collait à la paroi, dans la zone de pyrolyse, là où une partie des goudrons se condensait, et formait des voûtes. Selon le rapport, un déflecteur qui supprime le contact avec la paroi a ramené ce problème à un niveau jugé acceptable.',
      'In the bunker, the **baffle**. The fuel stuck to the wall, in the pyrolysis zone, where some of the tars condensed, and bridged. According to the report, a baffle that removes the contact with the wall brought that problem down to what was judged acceptable.',
    ),
    parts: ['fuel-baffle'],
  },
  {
    id: 'contents',
    scene: 'gasifier',
    title: l('Ce que la machine contient', 'What the machine holds'),
    text: step(
      'reading',
      'Une fois l’appareil fait, il contient une **colonne de plaquettes**, {bunkerKg} à pleine soute, et quatre zones dans cette colonne : le **séchage**, la **pyrolyse**, l’**oxydation** et la **réduction**. Ce ne sont pas des pièces qu’on assemble : ce sont ce que la machine tient. Une plaquette met environ {fallHours} pour les traverser, quand le gaz les traverse en {gasTime}.',
      'Once the apparatus is made, it holds a **column of chips**, {bunkerKg} at a full bunker, and four zones in that column: **drying**, **pyrolysis**, **oxidation** and **reduction**. They are not parts that are assembled: they are what the machine holds. A chip takes about {fallHours} to cross them, when the gas crosses them in {gasTime}.',
    ),
    parts: ['chip-column', 'drying-zone', 'pyrolysis-zone', 'oxidation-zone', 'reduction-zone'],
  },
  {
    id: 'lid',
    scene: 'gasifier',
    title: l('Le couvercle qui se soulève', 'The lid that lifts'),
    text: step(
      'reported',
      'Le **couvercle à ressort** a fermé la soute. Quand la pression monte, il se soulève : c’est un couvercle de décharge, et il ne rend rien acceptable. Un couvercle qui ne ferme pas laisse un gazogène garé brûler comme un poêle, et la soute se remplissait toutes les 40 à 50 minutes, en moins de 5 minutes : c’est une durée, ce guide ne décrit aucun geste.',
      'The **spring lid** closed the bunker. When the pressure rises, it lifts: it is a relief lid, and it makes nothing acceptable. A lid that does not seal lets a parked gasifier burn like a stove, and the bunker was filled every 40 to 50 minutes, in under 5 minutes: that is a duration, this guide describes no gesture.',
    ),
    parts: ['spring-lid'],
    warning: l(
      'C’est ici que l’air rencontre le gaz : l’un des endroits où une explosion peut naître.',
      'It is here that air meets gas: one of the places where an explosion can start.',
    ),
  },
  {
    id: 'consoles',
    scene: 'tractor',
    title: l('Sur le flanc du tracteur', 'On the tractor’s flank'),
    text: step(
      'reported',
      'L’appareil a été monté sur des **consoles** boulonnées au côté gauche du tracteur, le pied à 0,50 m du sol et le sommet à 2,22 m. Le système entier, avec le filtre, le refroidisseur et les tuyaux, pèse 450 kg. Le rapport ne dit pas quelle part de ces 450 kg reposait sur les consoles, ni comment la direction l’a pris.',
      'The apparatus was mounted on **consoles** bolted to the tractor’s left side, its foot 0.50 m off the ground and its top at 2.22 m. The whole system, with the filter, the cooler and the pipes, weighs 450 kg. The report does not say what share of those 450 kg rested on the consoles, or how the steering took it.',
    ),
    parts: ['left-consoles', 'gasifier-unit'],
  },
  {
    id: 'hot-pipe',
    scene: 'gas-train',
    title: l('Du gazogène vers le filtre', 'From the gasifier towards the filter'),
    text: step(
      'reading',
      'Le **tuyau de gaz chaud** a pris le gaz à la sortie, avec une courte montée jusqu’à un té, et la **vanne d’arrêt** se tient entre ce té et le filtre sur le schéma du rapport. Aucune dimension de ce tuyau n’est dans ce que nous avons lu. Le rapport ne dit pas à quoi servait la vanne, et ce guide ne décrit aucun usage : ce serait une consigne d’arrêt.',
      'The **hot gas pipe** took the gas at the outlet, with a short rise to a tee, and the **stop valve** stands between that tee and the filter on the report’s schematic. No dimension of this pipe is in what we read. The report does not say what the valve was for, and this guide describes no use of it: it would be an instruction for stopping.',
    ),
    parts: ['hot-gas-pipe', 'stop-valve'],
  },
  {
    id: 'fan',
    scene: 'gas-train',
    title: l('Le ventilateur et sa cheminée', 'The fan and its stack'),
    text: step(
      'reported',
      'Au té, un **ventilateur de démarrage** remplaçait le moteur tant qu’il ne tirait pas encore, sur un trajet d’air qui passe par la **vanne d’air primaire**, et rejetait son gaz par une **cheminée**. Ce gaz est celui du gazogène : le livre suédois compte environ 200 L de monoxyde de carbone à la minute. Ce guide ne dit ni quand ni combien de temps le ventilateur tournait.',
      'At the tee, a **starting fan** took the engine’s place while it was not yet drawing, on an air path that passes the **primary-air valve**, and threw out its gas through a **stack**. That gas is the gasifier’s: the Swedish book counts about 200 L of carbon monoxide a minute. This guide says neither when nor for how long the fan ran.',
    ),
    parts: ['starting-fan', 'primary-air-valve', 'fan-stack'],
    warning: l(
      'Le monoxyde de carbone ne se voit pas et ne se sent pas : le livre suédois juge ce ventilateur dangereux même dans un garage de 1 000 m³.',
      'Carbon monoxide cannot be seen or smelt: the Swedish book judges this fan dangerous even in a 1,000 m³ garage.',
    ),
  },
  {
    id: 'filter',
    scene: 'gas-train',
    title: l('La poussière s’arrête ici', 'The dust stops here'),
    text: step(
      'reading',
      'Le gaz entre ensuite dans un **caisson de filtre**, de 4,9 m² de toile en **manches**, agrandi depuis 2,5 m² quand un nettoyage toutes les 20 heures a paru inacceptable. Un **cyclone** est dessiné à l’écart : il est sur la figure d’un autre système du programme, pas sur le schéma de ce tracteur, et la question est ouverte. Le caisson est chaud, et sa toile ne tient pas plus de 300 °C.',
      'The gas then enters a **filter box**, with 4.9 m² of cloth in **bags**, enlarged from 2.5 m² when cleaning every 20 hours proved unacceptable. A **cyclone** is drawn apart: it is on the figure of another system of the programme, not on this tractor’s schematic, and the question is open. The box is hot, and its cloth takes no more than 300 °C.',
      ['pour les surfaces ; le cyclone est une question ouverte', 'for the areas; the cyclone is an open question'],
    ),
    parts: ['cyclone', 'filter-box', 'filter-bags'],
  },
  {
    id: 'cooler',
    scene: 'gas-train',
    title: l('Refroidir pour remplir le cylindre', 'Cooling to fill the cylinder'),
    text: step(
      'reported',
      'Le **refroidisseur**, devant le radiateur, a pris le gaz après le filtre : 5,8 m² de tubes, par lesquels le gaz monte puis redescend. Un gaz plus froid est plus dense, donc plus d’énergie entre dans le cylindre, et l’eau qui s’y condense tombe dans un **bac** qui, sur plusieurs véhicules de l’institut, se vidait toutes les 2 à 3 heures. Un moteur est mort, probablement d’avoir aspiré l’eau d’un bac trop plein.',
      'The **cooler**, in front of the radiator, took the gas after the filter: 5.8 m² of tubes, up which the gas goes and down again. A colder gas is denser, so more energy enters the cylinder, and the water that condenses falls into a **vessel** that, on several of the institute’s vehicles, was emptied every 2 to 3 hours. One engine died, probably from sucking up the water of an overfull vessel.',
    ),
    parts: ['gas-cooler', 'cooler-condensate-vessel'],
  },
  {
    id: 'mixer',
    scene: 'gas-train',
    title: l('Le gaz rencontre l’air du moteur', 'The gas meets the engine’s air'),
    text: step(
      'reading',
      'Au **mélangeur**, le gaz rencontre l’air du filtre à air du tracteur, à peu près volume pour volume. Le **papillon de gaz** dit combien de gaz entre, et c’est lui que commande le pied du conducteur. Un **papillon d’air** règle l’air ajouté ; sur le camion du programme, dit le rapport, il se manœuvrait à la main : c’est un réglage que ce lab ne donne pas.',
      'At the **mixer**, the gas meets the air from the tractor’s air cleaner, about volume for volume. The **gas throttle** says how much gas enters, and it is what the driver’s foot works. A **secondary-air throttle** sets the air added; on the programme’s truck, says the report, it was worked by hand: it is a setting this lab does not give.',
      ['pour la place ; la proportion est rapportée', 'for the place; the proportion is reported'],
    ),
    parts: ['gas-air-mixer', 'gas-throttle', 'secondary-air-throttle'],
  },
  {
    id: 'engine-end',
    scene: 'gas-train',
    title: l('Le bout de la ligne', 'The end of the line'),
    text: step(
      'reading',
      'Un **injecteur pilote** envoie le filet de gazole qui allume le gaz dans le **cylindre**, ici coupé pour qu’on voie le piston et les soupapes. Au bout, l’**échappement**, et devant les yeux du conducteur un **manomètre à eau** qui dit, en millimètres d’eau, combien le filtre résiste. Ce guide ne donne ni quantité de gazole, ni réglage, ni calage.',
      'A **pilot injector** sends the thread of diesel that lights the gas in the **cylinder**, cut here so that the piston and the valves can be seen. At the end, the **exhaust**, and in front of the driver’s eyes a **water gauge** that says, in millimetres of water, how much the filter resists. This guide gives no quantity of diesel, no setting, no timing.',
    ),
    parts: ['pilot-injector', 'cylinder-cutaway', 'exhaust-pipe', 'water-gauge'],
  },
  {
    id: 'engine-bay',
    scene: 'tractor',
    title: l('Ce qu’il a fallu changer sous le capot', 'What had to change under the bonnet'),
    text: step(
      'reported',
      'Sous le capot, trois changements que le rapport note : un **régulateur** de plus, sur le papillon de gaz, par une courroie en V ; la **pompe d’injection**, qui a grippé à 25 heures, faute de refroidissement et de graissage selon le rapport ; et un **écran thermique** ajouté pour elle et pour le filtre à gazole, contre la chaleur du gazogène. Le refroidissement de l’injecteur a été changé aussi. Aucun réglage de la pompe n’est donné ici.',
      'Under the bonnet, three changes the report notes: one more **governor**, on the gas throttle, by a V-belt; the **injection pump**, which seized at 25 hours, for want of cooling and lubrication according to the report; and a **heat shield** added for it and for the diesel filter, against the gasifier’s heat. The injector’s cooling was changed too. No setting of the pump is given here.',
    ),
    parts: ['extra-governor', 'injection-pump', 'heat-shield'],
    warning: l(
      'L’enveloppe du gazogène est chaude, comparée à un pot catalytique par une source américaine, qui prévient aussi de l’herbe sèche.',
      'The gasifier’s casing is hot, compared to a catalytic converter by an American source, which also warns of dry grass.',
    ),
  },
  {
    id: 'roof',
    scene: 'tractor',
    title: l('Le toit et la ligne qui relie tout', 'The roof, and the line that joins it all'),
    text: step(
      'reported',
      'Les **phares** ont été déplacés sur le toit, parce que celui de gauche aurait sinon été caché par le gazogène ; la **galerie** y a porté les plaquettes du poste, de grandes quantités selon le rapport, et la **ligne de gaz** a relié le tout, du gazogène au moteur. Le tracteur avait gagné 450 kg, perdu ses masses avant, et son sommet frôlait l’œil du conducteur. Le rapport ne dit pas comment la machine se conduisait.',
      'The **headlights** were moved to the roof, because the left one would otherwise have been hidden by the gasifier; the **rack** carried the shift’s chips there, large amounts by the report, and the **gas line** joined the whole, from the gasifier to the engine. The tractor had gained 450 kg, lost its front weights, and its top came close to the driver’s eye. The report does not say how the machine handled.',
    ),
    parts: ['gas-line-run', 'roof-rack', 'roof-headlights'],
  },
];
