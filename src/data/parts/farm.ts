// Parts of the `farm` world (10): the setting, a large farm in southern Sweden around 1970, where the tractor worked. No source gives the farm: its buildings and its land are estimates, and each sheet says so where it prints a size. What the sources do give is
// what the farm did with the machine (a 4 m clod crusher, beets and grain, 2,500 hours in six years) and what came out of it besides power: ash, black water, and the question of where it went. History in the past tense, never a gesture (research §A.2, R3, R7).
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const FARM_PARTS: PartInfo[] = [
  {
    id: 'wood-gas-tractor',
    scene: 'farm',
    category: 'mechanical',
    name: l('Tracteur à gaz de bois', 'Wood-gas tractor'),
    short: l(
      'Un tracteur de 5 t qui brûle des plaquettes de bois : un gazogène sur le flanc, un filet de gazole pour allumer le gaz.',
      'A 5-tonne tractor that burns wood chips: a gasifier on its flank, a thread of diesel to light the gas.',
    ),
    description: lf(
      'Voici la machine entière. Un tracteur Massey Ferguson 1100, inscrit sous 1968, pèse 5 090 kg dans sa version à gaz, avec 450 kg de système ajouté. Dans le programme d’un institut suédois d’essais de machines agricoles, il a travaillé plus de 2 500 heures en six ans, dans deux grandes fermes du sud du pays : brise-mottes, herse, disques, rouleau, betteraves, céréales, engrais. À 40 kW à l’arbre, le modèle trouve {chipsModel} de plaquettes ; le banc de l’institut en a mesuré 41, avec 2,2 kg de gazole : {kwIn} en entrée pour 40 en sortie, soit 18 %. Le bois seul ne suffit pas : un diesel garde un filet de gazole pour allumer le gaz, de 15 à 20 % de ce qu’il aurait brûlé. Cliquez la machine : elle ouvre son propre monde.',
      'Here is the whole machine. A Massey Ferguson 1100 tractor, listed under 1968, weighs 5,090 kg in its gas version, with 450 kg of system added. In the programme of a Swedish institute for testing farm machinery, it worked more than 2,500 hours over six years, on two large farms in the south of the country: clod crusher, harrow, discs, roller, beets, grain, fertiliser. At 40 kW at the shaft, the model finds {chipsModel} of chips; the institute’s bench measured 41, with 2.2 kg of diesel: {kwIn} going in for 40 coming out, which is 18%. Wood alone is not enough: a diesel keeps a thread of its own fuel to light the gas, 15 to 20% of what it would have burned. Click the machine: it opens its own world.',
    ),
    material: l('Acier et fonte, 5 090 kg avec le système', 'Steel and cast iron, 5,090 kg with the system'),
    specs: [
      sp(
        'Tracteur',
        'Tractor',
        l('Massey Ferguson 1100, inscrit sous 1968', 'Massey Ferguson 1100, listed under 1968'),
      ),
      sp('Masse, version à gaz', 'Mass, gas version', '5 090 kg'),
      sp('Système ajouté', 'System added', '450 kg'),
      sp(
        'Au banc de l’institut',
        'On the institute’s bench',
        l(
          '40 kW, 41 kg de plaquettes et 2,2 kg de gazole à l’heure',
          '40 kW, 41 kg of chips and 2.2 kg of diesel an hour',
        ),
      ),
      sp(
        'Rendement total, au banc',
        'Total efficiency, on the bench',
        lf('18 % ({kwIn} en entrée)', '18% ({kwIn} going in)'),
      ),
      sp('Service', 'Service', l('plus de 2 500 h en six ans, deux fermes', 'over 2,500 h in six years, two farms')),
    ],
    maintenance: maint(
      {
        failure:
          'La pompe d’injection a grippé après 25 heures, et l’institut a ajouté un écran de rayonnement. Un moteur est mort : probablement de l’eau aspirée d’un bac de condensats trop plein.',
        check:
          'L’institut tenait le compte : de 15 à 25 minutes de service par heure de travail, selon son rapport. Les durées de ses propres tableaux n’y arrivent pas tout à fait.',
        care: 'La préparation de la machine prenait de 30 à 45 minutes chaque jour, et la soute à plaquettes se remplissait toutes les 40 à 50 minutes, en moins de 5 minutes.',
      },
      {
        failure:
          'The injection pump seized after 25 hours, and the institute added a radiation shield. One engine died: probably from water sucked from an overfull condensate vessel.',
        check:
          'The institute kept the count: 15 to 25 minutes of service per hour of work, by its report. The durations in its own tables do not quite reach that.',
        care: 'Preparing the machine took 30 to 45 minutes each day, and the fuel bunker was filled every 40 to 50 minutes, in under 5 minutes.',
      },
    ),
    tip: l(
      'Cliquez le tracteur : le monde « Tracteur » s’ouvre. Dans « Flux », les plaquettes suivent leur chemin, de la déchiqueteuse à la galerie du toit.',
      'Click the tractor: the “Tractor” world opens. In “Flows”, the chips follow their way, from the chipper to the roof rack.',
    ),
    design: lf(
      'Les conducteurs habituels n’en voulaient pas : c’était long, sale et lourd. Ce sont des élèves de l’école d’agriculture qui l’ont conduit, après une à deux semaines d’apprentissage. Le modèle lit ce tracteur autrement que le banc. Au banc, ce tracteur a brûlé environ {thirdMore} d’énergie de plus qu’un bon diesel pour le même travail, et le moteur du modèle ne l’imite pas : c’est la raison de l’écart sur les plaquettes. Le lab ne cache pas cet écart : il le montre.',
      'The regular drivers did not want it: it was time-consuming, dirty and heavy. Agricultural students drove it, after one to two weeks of training. The model reads this tractor differently from the bench. On the bench, this tractor burned about {thirdMore} more energy than a good diesel for the same work, and the model’s engine does not imitate it: that is the reason for the gap on the chips. The lab does not hide the gap: it shows it.',
    ),
  },
  {
    id: 'chip-barn',
    scene: 'farm',
    category: 'structure',
    name: l('Grange à plaquettes', 'Chip barn'),
    short: l(
      'La réserve de plaquettes sèches : un poste de travail en demande plus d’un mètre cube, et le bois stocké fait lui-même du monoxyde.',
      'The store of dry chips: one working shift takes more than a cubic metre, and stored wood gives off carbon monoxide itself.',
    ),
    description: lf(
      'Tout part d’ici, au sec. Les plaquettes d’essai de l’institut tenaient 8 % d’humidité, et pesaient 152 kg le mètre cube. Un poste de huit heures, à 27 à 41 kg l’heure, en demande de {shiftKg}, soit {shiftM3}. C’est beaucoup de volume pour un seul tracteur, et la galerie du toit n’en porte qu’une partie. L’humidité compte autant que la quantité : l’institut s’arrêtait à 30 % pour ses plaquettes, et disait qu’au-delà d’environ 40 % le gaz ne brûle plus. Ces pourcentages se comptent sur le bois humide. Un bois qui attend dans un tas fermé n’est pas inerte : le bois stocké dégage du monoxyde de carbone, et une alerte britannique compte au moins neuf morts dans des stockages de granulés en Europe depuis 2002.',
      'Everything starts here, dry. The institute’s test chips held 8% moisture, and weighed 152 kg a cubic metre. A shift of eight hours, at 27 to 41 kg an hour, takes {shiftKg}, which is {shiftM3}. That is a lot of volume for one tractor, and the roof rack carries only part of it. Moisture counts as much as quantity: the institute stopped at 30% for its chips, and said that past about 40% the gas no longer burns. Those percentages are counted on the wet wood. Wood waiting in a closed heap is not inert: stored wood gives off carbon monoxide, and a British safety alert counts at least nine deaths in pellet stores in Europe since 2002.',
    ),
    material: l('Bardage et toit, à l’échelle d’une grande ferme', 'Boards and a roof, at the scale of a large farm'),
    specs: [
      sp('Humidité des plaquettes d’essai', 'Test chips’ moisture', l('8 % (base humide)', '8% (wet basis)')),
      sp('Masse volumique', 'Bulk density', '152 kg/m³'),
      sp('Plaquettes pour un poste de 8 h', 'Chips for an 8-hour shift', v('{shiftKg} · {shiftM3}')),
      sp(
        'Limite d’humidité',
        'Moisture limit',
        l('30 % ; au-delà d’environ 40 %, le gaz ne brûle plus', '30%; past about 40%, the gas no longer burns'),
      ),
      sp('Bâtiment dessiné', 'Building as drawn', v('{barnSize}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des plaquettes mouillées. À 20, 30, 40 % d’humidité le gaz perd sa valeur et le même travail demande plus de bois : dans le modèle, {chipsWet40} à 40 %, contre {chipsModel} à 8 %.',
        check:
          'L’humidité, avant tout autre chiffre : elle se compte en base humide, et un bois à 20 % en base humide vaut 25 % en base sèche.',
        care: 'Sur la ferme du lab, la grange est ouverte et se vide au fil du poste ; aucune source ne décrit celle de l’institut.',
      },
      {
        failure:
          'Wet chips. At 20, 30, 40% moisture the gas loses its worth and the same work takes more wood: in the model, {chipsWet40} at 40%, against {chipsModel} at 8%.',
        check:
          'The moisture, before any other figure: it is counted on the wet basis, and wood at 20% on the wet basis is 25% on the dry basis.',
        care: 'On the lab’s farm the barn is open and empties as the shift goes; no source describes the institute’s.',
      },
    ),
    tip: l(
      'Mettez le curseur d’humidité à 40 % dans la Simulation : la grange ne change pas, mais le tas descend plus vite.',
      'Set the moisture slider to 40% in the Simulation: the barn does not change, but the heap goes down faster.',
    ),
    design: l(
      'La grange, la ferme et le garage n’ont aucune source : ils sont dessinés pour donner l’échelle d’un tracteur de cinq tonnes sur plusieurs centaines d’hectares. Seuls comptent ici le volume des plaquettes et leur humidité. Le chiffre de neuf morts vient d’une source lue en résumé, à relire avant d’être cité ailleurs.',
      'The barn, the farm and the garage have no source: they are drawn to give the scale of a five-tonne tractor over several hundred hectares. Only the volume of the chips and their moisture count here. The figure of nine deaths comes from a source read in summary, to be re-read before it is quoted elsewhere.',
    ),
  },
  {
    id: 'drum-chipper',
    scene: 'farm',
    category: 'mechanical',
    name: l('Déchiqueteuse', 'Drum chipper'),
    short: l(
      'Là où le combustible naît : un tambour à couteaux qui coupe le bois en plaquettes de la taille d’un bout de doigt.',
      'Where the fuel begins: a drum with knives that cuts wood into chips the size of a fingertip.',
    ),
    description: l(
      'Un tracteur à gaz de bois ne brûle pas des bûches. Il brûle des plaquettes, et celles-ci se font ici : un tambour garni de couteaux, sur une remorque, qui tourne vite et coupe le bois en morceaux. Les plaquettes du programme de l’institut avaient pour l’essentiel une taille de 15 à 30 mm, et c’est cette taille qui compte pour le gazogène : des morceaux qui laissent passer le gaz entre eux, ni de la poussière, ni des éclats trop longs. Aucune source ne décrit la déchiqueteuse de cette ferme. Celle du lab est dessinée d’après l’usage courant des fermes de ce temps.',
      'A wood-gas tractor does not burn logs. It burns chips, and they are made here: a drum fitted with knives, on a trailer, that spins fast and cuts wood into pieces. The institute’s chips were mostly 15 to 30 mm in size, and that size matters to the gasifier: pieces that let the gas pass between them, neither dust nor splinters too long. No source describes this farm’s chipper. The lab’s is drawn from the usual practice of farms of the day.',
    ),
    material: l('Acier, tambour à couteaux', 'Steel, a drum with knives'),
    specs: [
      sp(
        'Taille de plaquette la plus fréquente',
        'Most frequent chip size',
        l('15 à 30 mm (l’essentiel de la masse)', '15 to 30 mm (most of the mass)'),
      ),
      sp(
        'Origine de cette machine',
        'Origin of this machine',
        l('usage courant, aucune source pour la ferme', 'usual practice, no source for the farm'),
      ),
      sp(
        'Pourquoi la taille compte',
        'Why size matters',
        l(
          'le gaz passe entre les plaquettes : trop de fines, il peine',
          'the gas passes between the chips: too many fines, and it struggles',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Des couteaux usés donnent des plaquettes déchirées et plus de fines. Le rapport de l’institut ne parle pas de cette machine : c’est l’usage courant, pas une mesure.',
        check:
          'Ce qui sort, avant de savoir ce qui est entré : la part de poussière, la longueur des éclats. Le crible juge le reste.',
        care: 'Le tambour tourne vite et coupe tout ce qu’on lui donne : le lab n’en montre aucun geste.',
      },
      {
        failure:
          'Worn knives make torn chips and more fines. The institute’s report says nothing of this machine: it is usual practice, not a measurement.',
        check:
          'What comes out, before knowing what went in: the share of dust, the length of the splinters. The sieve judges the rest.',
        care: 'The drum spins fast and cuts whatever it is given: the lab shows no gesture of it.',
      },
    ),
    tip: l(
      'Activez « Flux » : les points partent des grumes, passent par la déchiqueteuse, puis vont au tas et au crible.',
      'Switch on “Flows”: the dots start at the logs, pass through the chipper, then go to the heap and the sieve.',
    ),
    design: l(
      'La forme de la remorque, du tambour et de sa goulotte est une lecture, pas un plan : le lab n’explique ni comment on la règle ni comment on la nourrit. Ce qu’il garde, c’est ce que le gazogène attend d’elle.',
      'The shape of the trailer, the drum and its chute is a reading, not a plan: the lab explains neither how it is adjusted nor how it is fed. What it keeps is what the gasifier expects of it.',
    ),
  },
  {
    id: 'chip-sieve',
    scene: 'farm',
    category: 'mechanical',
    name: l('Crible', 'Chip sieve'),
    short: l(
      'Un tamis qui retire les fines : criblées, les plaquettes ont donné un quart de puissance de plus.',
      'A sieve that takes out the fines: sieved, the chips gave a quarter more power.',
    ),
    description: lf(
      'Les fines, ce sont les petits éclats et la poussière : elles bouchent les passages du gaz. Sur un tracteur de la même famille, à 1 800 tr/min, les plaquettes non criblées ont donné 16,8 kW. Criblées de 10 à 40 mm, elles en ont donné 21,1 : {sieveGain}. Le prix est dans le tas jeté, 14 % des plaquettes pour ce calibre et 34 % pour le plus sévère. Le modèle trouve {sieveModel} de gain sur ce tracteur-ci, par la seule perte de pression. Le rapport dit que moins de la moitié du gain venait de la pression, et que le reste semblait venir de la qualité du gaz. Le modèle est d’accord sur la première moitié, et muet sur la seconde.',
      'Fines are the small splinters and the dust: they block the gas’s way. On a tractor of the same family, at 1,800 rpm, unsieved chips gave 16.8 kW. Sieved to 10–40 mm, they gave 21.1: {sieveGain}. The price is in the heap thrown away, 14% of the chips for that grade and 34% for the strictest. The model finds {sieveModel} of gain on this tractor, from the pressure loss alone. The report says less than half the gain came from pressure, and that the rest seemed to come from the gas’s quality. The model agrees on the first half, and is silent on the second.',
    ),
    material: l('Tambour de toile métallique sur galets', 'A drum of wire mesh on rollers'),
    specs: [
      sp('Non criblées', 'Unsieved', l('16,8 kW · 0,18 bar · 0 % jeté', '16.8 kW · 0.18 bar · 0% thrown away')),
      sp(
        'Criblées 5–40 mm',
        'Sieved 5–40 mm',
        l('18,1 kW · 0,13 bar · 3 % jeté', '18.1 kW · 0.13 bar · 3% thrown away'),
      ),
      sp(
        'Criblées 10–40 mm',
        'Sieved 10–40 mm',
        l('21,1 kW · 0,09 bar · 14 % jeté', '21.1 kW · 0.09 bar · 14% thrown away'),
      ),
      sp(
        'Criblées 15–40 mm',
        'Sieved 15–40 mm',
        l('21,0 kW · 0,08 bar · 34 % jeté', '21.0 kW · 0.08 bar · 34% thrown away'),
      ),
      sp('Gain, selon le modèle', 'Gain, by the model', v('{sieveModel}')),
    ],
    maintenance: maint(
      {
        failure:
          'Aucune source ne parle de cette machine. Les cribles à tambour, d’usage courant, se colmatent quand le bois est humide : c’est une lecture, pas une mesure.',
        check:
          'Le tas jeté, plus que le tas gardé : à 34 %, un tiers du bois part et la puissance ne monte plus, 21,0 kW contre 21,1.',
        care: 'Pour le gazogène de l’institut, les plaquettes étaient criblées avant d’être montées sur la galerie ; le lab ne décrit pas le geste.',
      },
      {
        failure:
          'No source speaks of this machine. Drum sieves, in common use, clog when the wood is damp: that is a reading, not a measurement.',
        check:
          'The heap thrown away, more than the heap kept: at 34%, a third of the wood goes and the power no longer rises, 21.0 kW against 21.1.',
        care: 'For the institute’s gasifier the chips were sieved before they were loaded on the rack; the lab does not describe the gesture.',
      },
    ),
    tip: l(
      'Lancez « Les fines » : la perte de pression du gazogène va de 0,08 à 0,18 bar selon le calibre.',
      'Run “Fines”: the gasifier’s pressure loss goes from 0.08 to 0.18 bar by grade.',
    ),
    design: l(
      'Un quart de puissance de plus pour 14 % de bois jeté : c’est le marché que l’institut a fait. Le tableau ne dit pas de quel tracteur il vient, seulement « un F5 monté sur un tracteur ». Le lab le garde pour ce qu’il apprend, pas pour ce tracteur-ci.',
      'A quarter more power for 14% of the wood thrown away: that is the bargain the institute struck. The table does not say which tractor it comes from, only “an F5 mounted on a tractor”. The lab keeps it for what it teaches, not for this tractor.',
    ),
  },
  {
    id: 'clod-crusher',
    scene: 'farm',
    category: 'mechanical',
    name: l('Brise-mottes', 'Clod crusher'),
    short: l(
      'Quatre mètres de large : le travail pour lequel on a tout monté, derrière le tracteur.',
      'Four metres wide: the work the whole thing was built for, behind the tractor.',
    ),
    description: lf(
      'C’est la raison d’être de la machine. Le tracteur traînait un brise-mottes de 4 m de large, une herse de 5 m, des disques de 2 m, un rouleau de 6 à 10 m, sur des betteraves, des céréales, de l’engrais. Du travail du sol, des journées entières : plus de 2 500 heures en six ans. Le modèle le prend à environ {groundKmh}, une estimation : l’institut ne donne pas l’allure. Le brise-mottes de la ferme avance à ce pas dans le monde « Ferme », et ses anneaux roulent comme les roues. Quand on sélectionne le tracteur ou lui, ils s’arrêtent : la caméra n’a pas à courir après.',
      'This is the reason for the machine. The tractor pulled a clod crusher 4 m wide, a harrow of 5 m, discs of 2 m, a roller of 6 to 10 m, over beets, grain and fertiliser. Soil work, whole days of it: more than 2,500 hours in six years. The model takes it at about {groundKmh}, an estimate: the institute does not give the pace. The farm’s crusher goes at that pace in the “Farm” world, and its rings roll as the wheels do. When the tractor or the crusher is selected, they stand still: the camera does not have to chase them.',
    ),
    material: l('Acier, anneaux sur essieu', 'Steel, rings on an axle'),
    specs: [
      sp('Largeur', 'Width', '4 m'),
      sp(
        'Autres outils',
        'Other tools',
        l('herse de 5 m, disques de 2 m, rouleau de 6 à 10 m', '5 m harrow, 2 m discs, 6 to 10 m roller'),
      ),
      sp('Cultures', 'Crops', l('betteraves, céréales, engrais', 'beets, grain, fertiliser')),
      sp('Allure du modèle', 'Model’s pace', v('{groundKmh}')),
    ],
    maintenance: maint(
      {
        failure:
          'La pompe d’injection a grippé à 25 heures, près du gazogène chaud, et l’institut a ajouté un écran de rayonnement pour elle et pour le filtre à gazole.',
        check:
          'Les heures de travail, plus que les kilomètres : 2 500 heures en six ans, et 2 830 heures dans le tableau des essais.',
        care: 'Aucune source ne décrit l’entretien de l’outil lui-même : ce n’est pas ce que le lab explique.',
      },
      {
        failure:
          'The injection pump seized at 25 hours, near the hot gasifier, and the institute added a radiation shield for it and for the diesel filter.',
        check: 'The hours of work, more than the miles: 2,500 hours in six years, and 2,830 hours in the tests’ table.',
        care: 'No source describes the care of the tool itself: it is not what the lab explains.',
      },
    ),
    tip: l(
      'Dans « Ferme », sélectionnez le brise-mottes : le tracteur s’arrête pour que la caméra le cadre là où il est.',
      'In “Farm”, select the crusher: the tractor stands still so the camera can frame it where it is.',
    ),
    design: l(
      'Un outil de quatre mètres ne dit rien de la puissance dont le tracteur avait besoin : aucune source ne donne l’effort de traction. Il dit seulement que cette machine travaillait vraiment, loin du banc d’essai.',
      'A four-metre tool says nothing of the power the tractor needed: no source gives the draught. It only says that this machine really worked, far from the test bench.',
    ),
  },
  {
    id: 'farmhouse',
    scene: 'farm',
    category: 'structure',
    name: l('Ferme', 'Farmhouse'),
    short: l(
      'La maison de la ferme : l’échelle de tout le reste, et les gens qui dorment à côté du garage.',
      'The farmhouse: the scale of everything else, and the people who sleep beside the garage.',
    ),
    description: lf(
      'Aucune source ne décrit la ferme : ce qui est dessiné ici est une estimation, deux étages de planches peintes en rouge, à peu près {houseSize}, avec un toit gris et une cheminée de brique. Elle est là pour une raison. Le livre suédois range parmi les pires accidents du pays ceux d’un arrêt de moteur : la voiture est au garage, par exemple sous une pièce à vivre, et le gaz continue de sortir. Le garage de la ferme touche donc la maison, et la chambre qui le surmonte est cette pièce-là. Personne n’y est dessiné.',
      'No source describes the farm: what is drawn here is an estimate, two storeys of red-painted boards, about {houseSize}, with a grey roof and a brick chimney. It is here for a reason. The Swedish book ranks among the country’s worst accidents those that followed an engine stopping: the car is in the garage, for instance under a living room, and the gas goes on coming out. So the farm’s garage touches the house, and the bedroom over it is that room. Nobody is drawn in it.',
    ),
    material: l('Planches rouges, toit de tôle', 'Red boards, sheet roof'),
    specs: [
      sp('Plan et hauteur dessinés', 'Plan and height as drawn', v('{houseSize}')),
      sp('Égout du toit', 'Eaves', v('{houseEave}')),
      sp('Source', 'Source', l('aucune : tout est estimé', 'none: all of it is estimated')),
      sp(
        'Rôle dans le lab',
        'Role in the lab',
        l('donner l’échelle, et porter la chambre du dessus', 'give the scale, and carry the room above'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Rien dans la maison elle-même : c’est le gaz qui s’y glisse, par un plancher ou un joint, depuis un garage où une machine s’est arrêtée.',
        check: 'Le monoxyde ne se voit pas et ne se sent pas : aucune pièce ne se juge à l’œil, ni à l’odeur.',
        care: 'Aucun : la maison n’est pas une pièce de la machine.',
      },
      {
        failure:
          'Nothing in the house itself: it is the gas that slips into it, through a floor or a joint, from a garage where a machine has stopped.',
        check: 'Carbon monoxide cannot be seen or smelt: no room can be judged by eye, or by nose.',
        care: 'None: the house is not a part of the machine.',
      },
    ),
    tip: l(
      'Cliquez le garage, collé au pignon : c’est là que s’ouvre le monde où le gaz sort, une fois le moteur arrêté.',
      'Click the garage, attached to the gable: that is where the world opens in which the gas comes out once the engine has stopped.',
    ),
    design: l(
      'La ferme est suédoise, vers 1970, parce que la machine y a travaillé, et non pour sa couleur locale. Dans tout le lab, un seul endroit abrite quelqu’un qui dort : la chambre au-dessus du garage, et c’est tout le sujet du dernier monde.',
      'The farm is Swedish, around 1970, because the machine worked there, not for local colour. In the whole lab only one place shelters someone asleep: the bedroom over the garage, and it is the whole subject of the last world.',
    ),
  },
  {
    id: 'farm-garage',
    scene: 'farm',
    category: 'structure',
    name: l('Garage', 'Farm garage'),
    short: l(
      'Où le tracteur dormait : un garage collé à la maison, avec une chambre au-dessus.',
      'Where the tractor slept: a garage against the house, with a bedroom over it.',
    ),
    description: lf(
      'En Suède, 2 865 véhicules à gazogène ont pris feu entre octobre 1939 et septembre 1944, beaucoup la nuit, dans des garages. Au seul premier trimestre de 1942, environ 350 incendies, dont 120 dans des garages : presque quatre par jour. C’est pour cette raison que ce garage existe. Les deux tailles de la source sont 50 et 1 000 m³ ; le garage dessiné ajoute à l’air libre le volume que le tracteur déplace, {machineM3}, ce qui fait {grossRoom} pour la petite pièce. Un couvercle qui ne ferme pas laisse un gazogène garé brûler comme un poêle. Cliquez le garage : le monde « Garage » s’ouvre.',
      'In Sweden, 2,865 gasifier vehicles caught fire between October 1939 and September 1944, many of them at night, in garages. In the first quarter of 1942 alone, about 350 fires, 120 of them in garages: almost four a day. That is why this garage exists. The source’s two sizes are 50 and 1,000 m³; the garage as drawn adds to the free air the volume the tractor displaces, {machineM3}, which makes {grossRoom} for the small room. A lid that does not seal lets a parked gasifier burn like a stove. Click the garage: the “Garage” world opens.',
    ),
    material: l('Murs enduits, portes en planches', 'Rendered walls, board doors'),
    specs: [
      sp(
        'Les deux tailles de la source',
        'The source’s two sizes',
        l('50 m³ et 1 000 m³ d’air', '50 m³ and 1,000 m³ of air'),
      ),
      sp('Volume déplacé par le tracteur', 'Volume the tractor displaces', v('{machineM3}')),
      sp('Pièce dessinée, petite', 'Room as drawn, small', v('{grossRoom}')),
      sp(
        'Incendies suédois',
        'Swedish fires',
        l('2 865, octobre 1939 à septembre 1944', '2,865, October 1939 to September 1944'),
      ),
      sp(
        'Premier trimestre de 1942',
        'First quarter of 1942',
        l('environ 350, dont 120 en garage', 'about 350, 120 of them in garages'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un feu de nuit, un couvercle qui ne ferme pas, une machine chaude rentrée trop vite : les Suédois ont compté ces cas par milliers, et leurs inspecteurs ont trouvé 155 gazogènes défectueux sur 230 contrôlés au premier semestre de 1945.',
        check:
          'Le livre suédois note que ni la porte ouverte, ni un tuyau passé par la fenêtre, ni un hangar ouvert sous un toit n’ont suffi.',
        care: 'Ce lab ne décrit aucune règle de garage : aucune ne rendrait la machine acceptable.',
      },
      {
        failure:
          'A fire at night, a lid that does not seal, a hot machine brought in too soon: the Swedes counted such cases in thousands, and their inspectors found 155 gasifiers faulty out of 230 checked in the first half of 1945.',
        check:
          'The Swedish book notes that neither the open door, nor a hose passed through a window, nor an open shed under a roof was enough.',
        care: 'This lab describes no rule for a garage: none would make the machine acceptable.',
      },
    ),
    tip: l(
      'Passez à « Garage » : le même tracteur y est garé, nez dedans, et les murs s’écartent pour laisser voir la pièce.',
      'Go to “Garage”: the same tractor is parked there, nose in, and the walls step aside to show the room.',
    ),
    design: l(
      'Le garage est une estimation, mais deux de ses chiffres viennent du livre suédois : les volumes de 50 et 1 000 m³. L’air libre plus le volume du tracteur donne la pièce dessinée, pour que la boîte du modèle et la 3D disent la même chose.',
      'The garage is an estimate, but two of its figures come from the Swedish book: the volumes of 50 and 1,000 m³. The free air plus the tractor’s volume gives the room as drawn, so that the model’s box and the 3D say the same thing.',
    ),
  },
  {
    id: 'ash-bin',
    scene: 'farm',
    category: 'site',
    name: l('Bac à cendres', 'Ash bin'),
    short: l(
      'Ce que la machine laisse : jusqu’à 3,5 % du combustible, et encore chaud.',
      'What the machine leaves: up to 3.5% of the fuel, and still hot.',
    ),
    description: lf(
      'Le gazogène ne laisse pas que du gaz. Au cendrier, il reste jusqu’à 3,5 % du combustible, et ce résidu vaut environ 5 % de la puissance à plein régime : de la cendre, mais aussi du charbon qui n’a pas fini sa route. Le modèle compte {ashKgH} de résidu au maximum. Selon le journal de l’institut, la cendre était sortie toutes les 8 à 15 heures, pour 15 à 30 minutes de travail. Elle est chaude, et le livre suédois compte la cendre chaude parmi les risques d’incendie. Ce que devient cette cendre ensuite n’est pas l’affaire du lab : voyez votre autorité locale.',
      'The gasifier leaves more than gas. In the ash pit there is up to 3.5% of the fuel, and this residue is worth about 5% of the power at full load: ash, but also charcoal that has not finished its journey. The model counts {ashKgH} of residue at the maximum. By the institute’s log, the ash was taken out every 8 to 15 hours, for 15 to 30 minutes of work. It is hot, and the Swedish book counts hot ash among the fire hazards. What becomes of that ash afterwards is not the lab’s business: ask your local authority.',
    ),
    material: l('Bac d’acier sur dalle, couvercle entrouvert', 'Steel bin on a slab, lid ajar'),
    specs: [
      sp('Résidu du cendrier', 'Ash pit residue', l('jusqu’à 3,5 % du combustible', 'up to 3.5% of the fuel')),
      sp('Part de la puissance', 'Share of the power', l('environ 5 % à plein régime', 'about 5% at full load')),
      sp('Au maximum, modèle', 'At the maximum, model', v('{ashKgH}')),
      sp(
        'Rythme de l’institut',
        'The institute’s rhythm',
        l('toutes les 8 à 15 h, 15 à 30 min de travail', 'every 8 to 15 h, 15 to 30 min of work'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une cendre encore chaude dans un bac : le livre suédois la range parmi les causes d’incendie, avec la machine elle-même.',
        check: 'La hauteur du tas, dans la 3D : elle suit le modèle, et monte au fil de la journée.',
        care: 'La cendre est chaude : l’institut ne décrit aucun geste, et le lab non plus.',
      },
      {
        failure: 'Ash still hot in a bin: the Swedish book ranks it among the causes of fire, with the machine itself.',
        check: 'The height of the heap, in the 3D: it follows the model, and rises through the day.',
        care: 'The ash is hot: the institute describes no gesture, and the lab does not either.',
      },
    ),
    tip: l(
      'Activez « Flux » dans « Ferme » : un point de cendre part de la machine vers ce bac, au rythme du modèle.',
      'Switch on “Flows” in “Farm”: a dot of ash leaves the machine for this bin, at the model’s pace.',
    ),
    design: l(
      'Le chiffre qui compte est le 5 % de puissance : un résidu qui vaut du combustible, c’est du rendement qui s’en va. Ce que le lab ne dit pas, c’est comment s’en débarrasser : aucune source ne le chiffre, et un conseil serait celui du lab, pas de l’institut.',
      'The figure that matters is the 5% of power: a residue that is worth fuel is efficiency going away. What the lab does not say is how to get rid of it: no source gives a figure, and advice would be the lab’s, not the institute’s.',
    ),
  },
  {
    id: 'condensate-barrel',
    scene: 'farm',
    category: 'hydraulic',
    name: l('Fût de condensats', 'Condensate barrel'),
    short: l(
      'L’eau noire qui sort du gaz : des centaines de fois la limite d’égout de la Suède en guerre.',
      'The black water that comes out of the gas: hundreds of times Sweden’s wartime sewer limit.',
    ),
    description: lf(
      'Le gaz traîne l’eau du bois et ses goudrons. En refroidissant, tout cela se condense dans la chemise du gazogène, le refroidisseur et les tuyaux : de l’eau noire. Elle contient de 1 500 à 3 000 mg de phénols par litre, quand la limite pour les égouts, dans la Suède de la guerre, était de 10 mg/L : soit {phenolRatio} cette limite. Certains goudrons sont cancérigènes. Ce liquide ne doit rejoindre ni le sol, ni un égout, ni l’eau. Le modèle tire de la chemise {jacket8} à 8 % d’humidité, et {jacket20} à 20 %. Les goudrons et les huiles pèsent moins de 0,1 % de ce qui entre, et la source principale dit n’avoir aucune donnée dure sur leur sort. Voyez votre autorité locale.',
      'The gas drags the wood’s water and its tars. Cooling, all of it condenses in the gasifier’s jacket, the cooler and the pipes: black water. It holds 1,500 to 3,000 mg of phenols per litre, when the limit for sewers in wartime Sweden was 10 mg/L: that is {phenolRatio} the limit. Some tars cause cancer. This liquid must reach neither the ground, nor a sewer, nor water. The model draws {jacket8} from the jacket at 8% moisture, and {jacket20} at 20%. Tars and oils weigh less than 0.1% of what goes in, and the main source says it has no hard data on what became of them. Ask your local authority.',
    ),
    material: l('Fût de tôle sur deux liteaux', 'A sheet-metal drum on two battens'),
    specs: [
      sp('Phénols', 'Phenols', l('1 500 à 3 000 mg/L', '1,500 to 3,000 mg/L')),
      sp('Limite d’égout, Suède en guerre', 'Sewer limit, wartime Sweden', '10 mg/L'),
      sp('Rapport', 'Ratio', v('{phenolRatio}')),
      sp(
        'Eau tirée de la chemise, modèle',
        'Water drawn from the jacket, model',
        lf('{jacket8} à 8 % · {jacket20} à 20 %', '{jacket8} at 8% · {jacket20} at 20%'),
      ),
      sp('Goudrons et huiles', 'Tars and oils', l('moins de 0,1 % de l’entrée', 'under 0.1% of the input')),
    ],
    maintenance: maint(
      {
        failure:
          'Un fût trop plein, ou un bac de refroidisseur qui déborde : la seule panne grave de ce moteur est probablement venue d’une eau aspirée par là.',
        check:
          'Le niveau, dans la 3D : le bac du refroidisseur monte entre deux vidanges, toutes les 2 à 3 heures dans le journal de l’institut, celui de la chemise attendait de 8 à 10 heures.',
        care: 'Le travail était sale et fréquent. Le lab n’en décrit aucun geste, et ne donne aucun conseil sur le sort de ce liquide.',
      },
      {
        failure:
          'An overfull barrel, or a cooler vessel that runs over: this engine’s one serious failure probably came from water sucked through there.',
        check:
          'The level, in the 3D: the cooler’s vessel climbs between two emptyings, every 2 to 3 hours in the institute’s log, the jacket’s waited 8 to 10 hours.',
        care: 'The work was dirty and frequent. The lab describes no gesture of it, and gives no advice on what becomes of this liquid.',
      },
    ),
    tip: l(
      'Dans « Ferme », « Flux » mène l’eau noire jusqu’à ce fût, et pas plus loin : aucun point ne le quitte.',
      'In “Farm”, “Flows” leads the black water to this barrel, and no further: no dot leaves it.',
    ),
    design: l(
      'Le fût ne dit pas où va le liquide : le lab ne le montre pas, par choix. Aucun chiffre de ce que devenait l’eau noire dans les fermes de l’institut n’existe dans ce qu’il a lu.',
      'The barrel does not say where the liquid goes: the lab does not show it, by choice. No figure for what became of the black water on the institute’s farms exists in what it read.',
    ),
  },
  {
    id: 'field-ditch',
    scene: 'farm',
    category: 'site',
    name: l('Fossé', 'Field ditch'),
    short: l(
      'Le fossé de drainage entre la cour et le champ : l’endroit où l’eau noire ne doit pas aller.',
      'The drainage ditch between the yard and the field: the place the black water must not go.',
    ),
    description: lf(
      'Un fossé borde presque toute ferme de plaine : il draine le champ vers un cours d’eau. Il est ici pour dire où l’eau noire ne doit pas aller : les condensats ne doivent atteindre ni le sol, ni les égouts, ni l’eau, dit le manuel de référence. Rien du lab ne coule dedans, ni point de condensat, ni flèche. Le fossé dessiné est une estimation : {ditchW} au fond, {ditchD} de profondeur, des berges en pente, et un filet d’eau qui n’est pas celui du modèle. Ce que devenait vraiment l’eau noire dans les deux fermes de l’institut n’est dit nulle part dans ce que nous avons lu.',
      'A ditch borders almost every farm on flat land: it drains the field towards a stream. It is here to say where the black water must not go: condensates must reach neither the ground, nor the sewers, nor water, says the reference handbook. Nothing from the lab runs into it, no dot of condensate, no arrow. The ditch as drawn is an estimate: {ditchW} wide at the bottom, {ditchD} deep, with sloping banks, and a trickle of water that is not the model’s. What became of the black water on the institute’s two farms is not said anywhere in what we read.',
    ),
    material: l('Terre, berges herbeuses', 'Earth, grassy banks'),
    specs: [
      sp('Source', 'Source', l('aucune : le fossé est une estimation', 'none: the ditch is an estimate')),
      sp('Largeur au fond', 'Width at the bottom', v('{ditchW}')),
      sp('Profondeur', 'Depth', v('{ditchD}')),
      sp('Ce qui y coule dans le lab', 'What runs into it in the lab', l('rien', 'nothing')),
    ],
    maintenance: maint(
      {
        failure:
          'Un fossé qui reçoit ce qu’il ne devrait pas : c’est ce que la source craint, sans pouvoir le chiffrer.',
        check:
          'Les sources parlent de phénols de 1 500 à 3 000 mg/L dans l’eau noire ; elles ne disent pas ce qu’un fossé en fait.',
        care: 'Rien : ce n’est pas un sujet de maintenance, mais de ce qu’on laisse y arriver.',
      },
      {
        failure:
          'A ditch that receives what it should not: that is what the source fears, without being able to put a figure to it.',
        check:
          'The sources speak of phenols at 1,500 to 3,000 mg/L in the black water; they do not say what a ditch makes of them.',
        care: 'Nothing: it is not a subject of maintenance, but of what is allowed to reach it.',
      },
    ),
    tip: l(
      'Le fossé se regarde de la cour, d’en haut : sélectionnez-le, et la caméra se place de ce côté.',
      'The ditch is looked at from the yard, from above: select it, and the camera takes that side.',
    ),
    design: l(
      'C’est une pièce qui ne fait rien, exprès : une machine qui laisse de l’eau noire doit montrer où cette eau ne doit pas aller, et aucun chiffre ne dit où elle allait.',
      'It is a part that does nothing, on purpose: a machine that leaves black water has to show where that water must not go, and no figure says where it went.',
    ),
  },
];
