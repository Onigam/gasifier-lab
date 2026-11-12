// Parts of the `tractor` world (13): the machine on paper, a Massey Ferguson 1100 with its whole system bolted on. The base tractor's dimensions are third-party (a data site, no maker's brochure: research §3); the changes the institute made are reported, and the
// parts under the bonnet are drawn from its description, their sizes estimates. The model's engine is said to read high where it does: that is said on `diesel-engine`, once. Nothing here is a setting or a procedure (research §A.2, R3, R4).
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const TRACTOR_PARTS: PartInfo[] = [
  {
    id: 'tractor-chassis',
    scene: 'tractor',
    category: 'structure',
    name: l('Châssis', 'Tractor chassis'),
    short: l(
      'Le tracteur sous le système : un engin de 5 t, dont 450 kg de système.',
      'The tractor under the system: a 5-tonne machine, 450 kg of which is the system.',
    ),
    description: lf(
      'Sans son gazogène, c’est un Massey Ferguson 1100 de série. Un site tiers lui donne un empattement de 2,59 m, 4,09 m de long, 2,70 m de large (cette largeur ressemble à la voie maximale : à vérifier) et 0,43 m de garde au sol. Aucune notice de constructeur n’a été trouvée. Le système de 450 kg fait partie des 5 090 kg du tracteur en version gaz, soit {systemShare} de sa masse. L’institut a retiré les masses avant pour faire place au refroidisseur, déplacé les phares, tourné le filtre à air. Dans le dessin du lab, le moteur, la boîte et le pont arrière forment le cadre, sans longerons : c’est une lecture, pas une cote.',
      'Without its gasifier it is a stock Massey Ferguson 1100. A third-party site gives it a wheelbase of 2.59 m, a length of 4.09 m, a width of 2.70 m (that width looks like the maximum tread: to be checked) and 0.43 m of ground clearance. No maker’s brochure was found. The 450 kg system is part of the gas version’s 5,090 kg, which is {systemShare} of its mass. The institute removed the front weights to make room for the cooler, moved the headlights, turned the air filter round. In the lab’s drawing the engine, the gearbox and the rear axle housing form the frame, with no side members: that is a reading, not a dimension.',
    ),
    material: l('Fonte et acier, blocs porteurs', 'Cast iron and steel, load-bearing castings'),
    specs: [
      sp('Masse, version à gaz', 'Mass, gas version', '5 090 kg'),
      sp('Système ajouté', 'System added', '450 kg'),
      sp('Part du système', 'Share of the system', v('{systemShare}')),
      sp(
        'Origine des cotes',
        'Origin of the dimensions',
        l('un site tiers, sans notice de constructeur', 'a third-party site, no maker’s brochure'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Aucune panne de châssis n’est rapportée en plus de 2 500 heures. Ce qui a cassé ou grippé était dans le système : la pompe d’injection, le bac de condensats, la pièce de foyer.',
        check:
          'Le poids : 450 kg ajoutés, surtout sur le flanc gauche, et les masses avant retirées. Les sources ne disent pas comment la direction l’a pris.',
        care: 'Le rapport ne décrit aucun entretien du tracteur lui-même, seulement celui du système.',
      },
      {
        failure:
          'No chassis failure is reported over more than 2,500 hours. What broke or seized was in the system: the injection pump, the condensate vessel, the hearth part.',
        check:
          'The weight: 450 kg added, mostly on the left flank, and the front weights taken off. The sources do not say how the steering took it.',
        care: 'The report describes no care of the tractor itself, only that of the system.',
      },
    ),
    tip: l(
      'Dans « Éclaté », le châssis reste en place : tout le reste le quitte le long de sa ligne.',
      'In “Explode”, the chassis stays where it is: everything else leaves it along its own line.',
    ),
    design: l(
      'Les cotes viennent d’un site tiers, et le lab les garde pour l’échelle, pas pour la précision. Ce qui est vraiment de l’institut tient en trois lignes : 5 090 kg, 450 kg, et la liste de ce qu’il a changé sur le tracteur.',
      'The dimensions come from a third-party site, and the lab keeps them for scale, not for precision. What is really the institute’s fits in three lines: 5,090 kg, 450 kg, and the list of what it changed on the tractor.',
    ),
  },
  {
    id: 'cab',
    scene: 'tractor',
    category: 'structure',
    name: l('Cabine', 'Cab'),
    short: l(
      'Là où l’on conduit : le gazogène monte presque à hauteur d’œil, et masque en partie la vue vers l’avant gauche.',
      'Where you drive: the gasifier rises almost to eye level, and partly blocks the view forward on the left.',
    ),
    description: lf(
      'La cabine monte à 2,88 m (cote d’un site tiers). Plus bas, le sommet du gazogène est à 2,22 m, juste sous l’œil du conducteur, à 2,25 à 2,40 m : {unitBelowEye} d’écart. Le rapport note que la vue vers l’avant gauche est en partie masquée. À gauche, à côté du siège, passent les tuyaux d’un gaz dont environ un cinquième est du monoxyde de carbone, qui ne se voit pas et ne se sent pas. Aucune source ne mesure l’air de la cabine : ce chiffre-là manque, et le lab ne le remplace pas.',
      'The cab rises to 2.88 m (a third-party figure). Lower down, the top of the gasifier is at 2.22 m, just under the driver’s eye, at 2.25 to 2.40 m: a gap of {unitBelowEye}. The report notes that the view forward on the left is partly blocked. To the left, beside the seat, run the pipes of a gas about a fifth of which is carbon monoxide, which cannot be seen or smelt. No source measures the air in the cab: that figure is missing, and the lab does not replace it.',
    ),
    material: l('Tôle, vitres', 'Sheet steel, glass'),
    specs: [
      sp('Sommet de la cabine', 'Top of the cab', '2,88 m'),
      sp('Œil du conducteur', 'Driver’s eye', l('2,25 à 2,40 m', '2.25 to 2.40 m')),
      sp('Sommet du gazogène', 'Top of the gasifier', '2,22 m'),
      sp('Écart, œil moins sommet', 'Gap, eye less top', v('{unitBelowEye}')),
      sp('Air de la cabine', 'Cab air', l('jamais mesuré', 'never measured')),
    ],
    maintenance: maint(
      {
        failure: 'Une vue masquée vers l’avant gauche : c’est la seule gêne que le rapport note pour la cabine.',
        check:
          'L’œil ne dit rien du gaz. Le gaz de la cabine ne se juge ni à la vue, ni à l’odeur, et aucun instrument de la source n’en parle.',
        care: 'Sur le toit, le rapport ne note que le déplacement des phares ; la galerie se voit sur sa photographie.',
      },
      {
        failure: 'A blocked view forward on the left: it is the only trouble the report notes for the cab.',
        check:
          'The eye says nothing of the gas. The cab’s gas cannot be judged by sight or by smell, and no instrument in the source speaks of it.',
        care: 'On the roof, the report notes only the move of the headlights; the rack can be seen in its photograph.',
      },
    ),
    tip: l(
      'Activez « Transparence » : la cabine s’efface, et le sommet du gazogène se lit contre l’œil du conducteur.',
      'Switch on “X-ray”: the cab fades, and the top of the gasifier reads against the driver’s eye.',
    ),
    design: l(
      'Les trois cotes de hauteur, 2,22 m, 2,25 m et 2,40 m, sont celles du rapport : le sommet du gazogène arrive tout près de l’œil du conducteur. Le dessin de la cabine, lui, est une estimation d’après la photographie.',
      'The three heights, 2.22 m, 2.25 m and 2.40 m, are the report’s: the top of the gasifier comes very close to the driver’s eye. The drawing of the cab is an estimate from the photograph.',
    ),
  },
  {
    id: 'roof-rack',
    scene: 'tractor',
    category: 'structure',
    name: l('Galerie', 'Roof rack'),
    short: l(
      'Les plaquettes d’un poste de travail, sur le toit de la cabine.',
      'The chips for a working shift, on the cab roof.',
    ),
    description: lf(
      'La soute du gazogène ne tient que 40 à 50 minutes de plaquettes. Le reste voyage sur le toit : le rapport dit que de grandes quantités y étaient portées. Un poste de huit heures demande de {shiftKg}, et le modèle en brûle {chipsShiftModel} sur sa journée. La galerie se voit sur la photographie du rapport, sa taille est une estimation, et les sacs dessinés dessus sont du lab. Les plaquettes pèsent 152 kg le mètre cube : ce qu’on y porte se compte en centaines de kilos sur la journée, au-dessus de la cabine.',
      'The gasifier’s bunker holds only 40 to 50 minutes of chips. The rest travels on the roof: the report says large amounts were carried there. A shift of eight hours takes {shiftKg}, and the model burns {chipsShiftModel} over its day. The rack can be seen in the report’s photograph, its size is an estimate, and the sacks drawn on it are the lab’s. The chips weigh 152 kg a cubic metre: what is carried there is counted in hundreds of kilos over the day, above the cab.',
    ),
    material: l('Cadre d’acier, sacs de plaquettes', 'Steel frame, sacks of chips'),
    specs: [
      sp('Plaquettes d’un poste de 8 h', 'Chips for an 8-hour shift', v('{shiftKg}')),
      sp('Le modèle, sur sa journée', 'The model, over its day', v('{chipsShiftModel}')),
      sp('Masse volumique', 'Bulk density', '152 kg/m³'),
      sp(
        'Taille de la galerie',
        'Size of the rack',
        l('estimation d’après la photographie', 'estimate from the photograph'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Aucune panne de galerie n’est rapportée. Le sujet du rapport est le temps passé : la préparation de 30 à 45 minutes par jour comprenait ce chargement.',
        check: 'Le poids au-dessus de la cabine : aucune source ne chiffre ce qu’il faisait à l’équilibre.',
        care: 'Le lab ne montre ni le chargement, ni le déchargement : seul le trajet des plaquettes, de la grange à la galerie, dans « Flux ».',
      },
      {
        failure:
          'No rack failure is reported. The report’s subject is time spent: the 30 to 45 minutes of daily preparation included this loading.',
        check: 'The weight above the cab: no source puts a figure on what it did to the balance.',
        care: 'The lab shows neither the loading nor the unloading: only the chips’ route, from the barn to the rack, in “Flows”.',
      },
    ),
    tip: l(
      'Dans « Éclaté », la galerie monte avec la cabine ; dans « Ferme », elle roule avec le tracteur.',
      'In “Explode”, the rack goes up with the cab; in “Farm”, it rolls with the tractor.',
    ),
    design: l(
      'Mettre le combustible du jour au-dessus du conducteur est un choix qui se lit dans le rapport sans y être expliqué. Le lab ne dit pas que c’était un bon choix : il montre que c’était nécessaire, parce que la soute ne tient que 40 à 50 minutes.',
      'Putting the day’s fuel above the driver is a choice that can be read in the report without being explained in it. The lab does not say it was a good choice: it shows it was necessary, because the bunker lasts only 40 to 50 minutes.',
    ),
  },
  {
    id: 'roof-headlights',
    scene: 'tractor',
    category: 'electrical',
    name: l('Phares de toit', 'Roof headlights'),
    short: l(
      'L’institut les a montés sur le toit : selon le rapport, le phare de gauche aurait été caché par le gazogène.',
      'The institute moved them to the roof: according to the report, the left headlight would otherwise have been hidden by the gasifier.',
    ),
    description: l(
      'Parmi les changements du tracteur, le rapport note que les phares ont été déplacés sur le toit, et en donne la raison : le phare de gauche aurait sinon été caché par le gazogène. Les deux lampes dessinées sont une estimation d’après la photographie, et l’électricité du tracteur n’est pas ce que le lab explique : il ne montre aucune ligne, aucun fusible, aucune batterie.',
      'Among the tractor’s changes, the report notes that the headlights were moved to the roof, and gives the reason: the left headlight would otherwise have been hidden by the gasifier. The two lamps drawn are an estimate from the photograph, and the tractor’s electrics are not what the lab explains: it shows no wire, no fuse, no battery.',
    ),
    material: l('Phares du tracteur, montés sur la galerie', 'The tractor’s headlights, mounted on the rack'),
    specs: [
      sp('Changement', 'Change', l('déplacés sur le toit', 'moved to the roof')),
      sp(
        'Raison',
        'Reason',
        l(
          'selon le rapport, le phare de gauche aurait été caché par le gazogène',
          'according to the report, the left headlight would have been hidden by the gasifier',
        ),
      ),
      sp(
        'Forme et place dessinées',
        'Shape and place as drawn',
        l('estimation d’après la photographie', 'estimate from the photograph'),
      ),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de phare n’est rapportée.',
        check:
          'Le rapport ne dit pas la hauteur ni l’orientation : une lampe de toit éclaire autrement une route et un champ.',
        care: 'Aucun entretien n’est décrit pour cette pièce.',
      },
      {
        failure: 'No headlight failure is reported.',
        check:
          'The report does not say the height or the angle: a lamp on the roof lights a road and a field differently.',
        care: 'No care is described for this part.',
      },
    ),
    tip: l(
      'Cliquez un phare : la fiche s’ouvre, et la caméra le cadre sur le toit.',
      'Click a headlight: the sheet opens, and the camera frames it on the roof.',
    ),
    design: l(
      'Une pièce toute petite pour dire qu’un tracteur se modifie vraiment : l’institut a changé les phares, le filtre à air, les masses, le régulateur, le refroidissement de l’injecteur. Chaque modification est une ligne du rapport, et aucune n’est un plan.',
      'A very small part, to say that a tractor really is modified: the institute changed the headlights, the air filter, the weights, the governor, the injector’s cooling. Each modification is a line of the report, and none is a plan.',
    ),
  },
  {
    id: 'rear-wheels',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Roues arrière', 'Rear wheels'),
    short: l(
      'De grosses roues de la classe 18.4-38 : celles qui poussent la machine et son poids.',
      'Big wheels of the 18.4-38 class: the ones that push the machine and its weight.',
    ),
    description: lf(
      'Les pneus arrière sont de la classe 18.4-38 : 18,4 pouces de large, soit {rearW}, sur une jante de 38 pouces. Un site tiers en donne la liste, et la photographie du rapport suggère de grandes roues arrière : c’est un choix, pas une cote. Le rayon dessiné est une estimation, {rearDiam} de diamètre. Au pas de travail du modèle, ils font {rearTurns}. La 3D les fait tourner à ce rythme, dans le sens où le tracteur avance : c’est assez lent pour que l’œil ne les voie pas tourner à l’envers.',
      'The rear tyres are of the 18.4-38 class: 18.4 inches wide, which is {rearW}, on a 38-inch rim. A third-party site lists them, and the report’s photograph suggests large rear wheels: that is a choice, not a dimension. The radius drawn is an estimate, {rearDiam} in diameter. At the model’s working pace they turn {rearTurns}. The 3D turns them at that rate, in the direction the tractor moves: it is slow enough that the eye does not see them turn backwards.',
    ),
    material: l('Caoutchouc à crampons en chevrons, jante d’acier', 'Rubber with chevron lugs, steel rim'),
    specs: [
      sp('Classe de pneu', 'Tyre class', '18.4-38'),
      sp('Largeur', 'Width', v('{rearW}')),
      sp('Diamètre dessiné', 'Diameter as drawn', v('{rearDiam}')),
      sp('Tours par seconde, au pas de travail', 'Turns a second, at working pace', v('{rearTurns}')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de roue n’est rapportée en plus de 2 500 heures de travail du sol.',
        check: 'Le rapport ne dit pas le lestage des roues, ni la pression des pneus : ces chiffres manquent.',
        care: 'Aucun entretien n’est décrit pour les roues dans le rapport.',
      },
      {
        failure: 'No wheel failure is reported over more than 2,500 hours of soil work.',
        check: 'The report does not give the wheels’ ballast or the tyre pressures: those figures are missing.',
        care: 'No care is described for the wheels in the report.',
      },
    ),
    tip: l(
      'Dans « Éclaté », les roues sortent le long de leur essieu : elles se détachent sur le côté, jamais à travers le sol.',
      'In “Explode”, the wheels go out along their axle: they come away sideways, never through the ground.',
    ),
    design: l(
      'La classe 18.4-38 est un choix du lab d’après la photographie, parmi celles que le site tiers liste. Elle donne la place où poser le poids, et le rythme de la roue. Sa précision n’ajouterait rien à ce qu’explique la machine.',
      'The 18.4-38 class is the lab’s pick from the photograph, among those the third-party site lists. It gives the place to carry the weight, and the wheel’s rhythm. More precision would add nothing to what the machine explains.',
    ),
  },
  {
    id: 'front-wheels',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Roues avant', 'Front wheels'),
    short: l(
      'Plus petites, et allégées : l’institut a retiré les masses avant pour faire place au refroidisseur.',
      'Smaller, and lightened: the institute removed the front weights to make room for the cooler.',
    ),
    description: lf(
      'Les pneus avant sont de la classe 7.50-18 : 7,5 pouces de large, soit {frontW}. Leur diamètre dessiné, {frontDiam}, est une estimation. Le rapport note que les masses avant ont été retirées : le refroidisseur du gaz se tient devant le radiateur, là où elles pendaient. Le tracteur gagne 450 kg de système, surtout sur le flanc gauche, et perd les masses de l’avant : comment la direction en a pris les effets, aucune source ne le dit. La 3D les fait rouler à {frontTurns}.',
      'The front tyres are of the 7.50-18 class: 7.5 inches wide, which is {frontW}. Their diameter as drawn, {frontDiam}, is an estimate. The report notes that the front weights were removed: the gas cooler stands in front of the radiator, where they hung. The tractor gains 450 kg of system, mostly on its left flank, and loses the front weights: how the steering took the effects, no source says. The 3D rolls them at {frontTurns}.',
    ),
    material: l('Caoutchouc à nervures, jante d’acier', 'Ribbed rubber, steel rim'),
    specs: [
      sp('Classe de pneu', 'Tyre class', '7.50-18'),
      sp('Largeur', 'Width', v('{frontW}')),
      sp('Diamètre dessiné', 'Diameter as drawn', v('{frontDiam}')),
      sp('Changement', 'Change', l('masses avant retirées', 'front weights removed')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de roue avant n’est rapportée.',
        check: 'Le comportement de la direction sans les masses : le rapport n’en dit rien.',
        care: 'Aucun entretien n’est décrit pour ces roues.',
      },
      {
        failure: 'No front wheel failure is reported.',
        check: 'The steering’s behaviour without the weights: the report says nothing of it.',
        care: 'No care is described for these wheels.',
      },
    ),
    tip: l(
      'Lancez « Le moteur s’arrête » : dès que le moteur est coupé, les roues cessent de rouler et le tracteur s’immobilise.',
      'Run “The engine stops”: as soon as the engine is cut, the wheels stop rolling and the tractor stands still.',
    ),
    design: l(
      'Retirer les masses avant, c’est un échange : de la place pour le refroidisseur contre de l’adhérence et de la stabilité. Le rapport n’en chiffre pas le prix, et le lab non plus.',
      'Removing the front weights is a trade: room for the cooler against grip and stability. The report puts no figure on the price, and the lab does not either.',
    ),
  },
  {
    id: 'diesel-engine',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Moteur diesel', 'Diesel engine'),
    short: l(
      'Un six-cylindres de 5,8 L : 64 kW au gazole, 51 kW au gaz avec un filet de gazole.',
      'A 5.8 L six-cylinder: 64 kW on diesel, 51 kW on gas with a thread of diesel.',
    ),
    description: lf(
      'Le moteur est un diesel Perkins à six cylindres et injection directe, de 5,8 litres. Au gazole seul, il donne 64 kW. Au gaz avec un filet de gazole, 51 kW, soit 79 %, vers 2 170 tr/min : le modèle en trouve {powerModel}, et cet accord vaut peu, car le même modèle lit environ {fleetHigh} trop haut les autres moteurs du même livre. Pourquoi moins ? Un mètre cube de gaz et d’air contient environ 2 500 kJ, contre 3 800 pour l’essence et l’air : un tiers de moins avant tout le reste. Et le gaz brûle lentement : il n’est guère question de dépasser 2 500 tr/min. Les deux chiffres du banc, 40 kW à 1 855 tr/min et 51 kW à 2 170, sont deux essais, que le rapport ne réconcilie pas.',
      'The engine is a Perkins six-cylinder diesel with direct injection, of 5.8 litres. On diesel alone it gives 64 kW. On gas with a thread of diesel, 51 kW, which is 79%, at about 2,170 rpm: the model finds {powerModel}, and that agreement is worth little, because the same model reads about {fleetHigh} high on the other engines of the same book. Why less? A cubic metre of gas and air holds about 2,500 kJ, against 3,800 for petrol and air: a third less before anything else. And the gas burns slowly: there is hardly any question of going beyond 2,500 rpm. The bench’s two figures, 40 kW at 1,855 rpm and 51 kW at 2,170, are two tests, which the report does not reconcile.',
    ),
    material: l('Fonte, diesel à injection directe', 'Cast iron, direct-injection diesel'),
    specs: [
      sp('Cylindrée', 'Swept volume', '5,8 L'),
      sp('Cylindres', 'Cylinders', '6'),
      sp('Au gazole seul', 'On diesel alone', '64 kW'),
      sp('Au gaz avec un filet de gazole', 'On gas with a thread of diesel', l('51 kW (79 %)', '51 kW (79%)')),
      sp('Selon le modèle', 'By the model', v('{powerModel}')),
      sp(
        'Mélange gaz et air, contre essence et air',
        'Gas-air mixture, against petrol-air',
        l('2 500 contre 3 800 kJ/m³', '2,500 against 3,800 kJ/m³'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La puissance perdue : la règle du rapport donne 15 à 20 % en injection directe, et ses mesures sont plus dures, 21 % pour ce tracteur, 29 % pour le camion, de 10 à 38 % sur l’ensemble. Le modèle suit la règle, pas les mesures.',
        check:
          'L’usure des cylindres, mesurée : 0,007 à 0,019 mm pour 1 000 heures avec un filtre à toile, 0,05 à 0,06 avec un lavage à l’eau, 0,005 à 0,031 au gazole seul.',
        care: 'L’huile se chargeait en insolubles : de 0,54 à 1,97 % avec le lavage, 0,12 % avec la toile, contre 0,2 à 0,3 % au gazole.',
      },
      {
        failure:
          'The power lost: the report’s rule gives 15 to 20% for direct injection, and its measures are harsher, 21% for this tractor, 29% for the truck, 10 to 38% across the fleet. The model follows the rule, not the measures.',
        check:
          'Cylinder wear, measured: 0.007 to 0.019 mm per 1,000 hours with a fabric filter, 0.05 to 0.06 with a water wash, 0.005 to 0.031 on diesel alone.',
        care: 'The oil filled with insolubles: 0.54 to 1.97% with the wash, 0.12% with the cloth, against 0.2 to 0.3% on diesel.',
      },
    ),
    tip: l(
      'Lancez « Gaz et gazole, gazole seul, gaz seul » : le même moteur, trois modes publiés, et la puissance qui change.',
      'Run “Gas with diesel, diesel alone, gas alone”: the same engine, three published modes, and the power that changes.',
    ),
    design: lf(
      'Le moteur lui-même transforme en travail environ {engineEff} de ce qu’on lui donne, au banc : le reste du rendement de 18 % se perd avant lui, dans le gazogène. Aucun réglage du moteur n’est offert ici : tout ce qui touche à l’injection ou à l’allumage tient dans trois rendements du modèle, tous des estimations, et pas dans des boutons.',
      'The engine itself turns about {engineEff} of what it is given into work, on the bench: the rest of the 18% efficiency is lost before it, in the gasifier. No engine setting is offered here: everything that touches injection or ignition sits in three efficiencies of the model, all estimates, and not in knobs.',
    ),
  },
  {
    id: 'injection-pump',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Pompe d’injection', 'Injection pump'),
    short: l(
      'Elle dose le filet de gazole : elle a grippé à 25 heures, faute de refroidissement et de graissage, dit le rapport.',
      'It meters the thread of diesel: it seized at 25 hours, for want of cooling and lubrication, says the report.',
    ),
    description: l(
      'Même au gaz, le diesel garde sa pompe : c’est elle qui envoie le filet de gazole dont la flamme a besoin pour allumer le mélange. Au banc, ce filet a pesé 2,2 kg à l’heure à pleine charge, 1,9 à charge partielle et 1,2 au ralenti. La pompe est sous le capot, à gauche, près du gazogène, qui est chaud. À 25 heures, elle a grippé : le rapport attribue le grippage à un refroidissement et un graissage insuffisants. L’institut a ensuite ajouté un écran de rayonnement, qui protège la pompe et le filtre à gazole de la chaleur du gazogène. Ce lab ne donne aucun réglage de cette pompe : ni quantité par coup, ni calage.',
      'Even on gas the diesel keeps its pump: it sends the thread of diesel the flame needs to light the mixture. On the bench that thread weighed 2.2 kg an hour at full load, 1.9 at part load and 1.2 at idle. The pump is under the bonnet, on the left, near the gasifier, which is hot. At 25 hours it seized: the report attributes the seizure to insufficient cooling and lubrication. The institute then added a radiation shield, which protects the pump and the diesel filter from the gasifier’s heat. This lab gives no setting for this pump: no quantity per stroke, no timing.',
    ),
    material: l('Pompe en ligne, fonte et acier', 'In-line pump, cast iron and steel'),
    specs: [
      sp('Gazole, pleine charge', 'Diesel, full load', '2,2 kg/h'),
      sp('Gazole, charge partielle', 'Diesel, part load', '1,9 kg/h'),
      sp('Gazole, ralenti', 'Diesel, idle', '1,2 kg/h'),
      sp('Grippage', 'Seizure', l('après 25 heures de service', 'after 25 hours of service')),
    ],
    maintenance: maint(
      {
        failure:
          'Le grippage à 25 heures, que le rapport attribue à un refroidissement et un graissage insuffisants : des changements ont suivi, dont un écran contre la chaleur du gazogène.',
        check:
          'La température autour de la pompe : le rapport ne donne pas la valeur, seulement le remède. Dans le modèle, la tôle du gazogène est à environ {casingModel}.',
        care: 'Aucune opération n’est décrite ici : ni réglage, ni purge, ni calage.',
      },
      {
        failure:
          'The seizure at 25 hours, which the report attributes to insufficient cooling and lubrication: changes followed, among them a shield against the gasifier’s heat.',
        check:
          'The temperature around the pump: the report does not give the value, only the remedy. In the model the gasifier’s casing is at about {casingModel}.',
        care: 'No operation is described here: no adjusting, no bleeding, no timing.',
      },
    ),
    tip: l(
      'Sélectionnez la pompe : le moteur et la ligne de gaz passent en transparence, et elle se lit enfin.',
      'Select the pump: the engine and the gas line fade, so that the pump can be read.',
    ),
    design: l(
      'Le point de cette pièce n’est pas la pompe : c’est qu’un tracteur transformé fait apparaître ses pannes à côté de ce qu’on y a ajouté. L’institut a vu la pompe gripper, a attribué la panne à un refroidissement et un graissage insuffisants, et a ajouté un écran contre la chaleur du gazogène : c’est toute la leçon.',
      'The point of this part is not the pump: it is that a converted tractor shows its failures next to what was added to it. The institute saw the pump seize, attributed it to insufficient cooling and lubrication, and added a shield against the gasifier’s heat: that is the whole lesson.',
    ),
  },
  {
    id: 'heat-shield',
    scene: 'tractor',
    category: 'structure',
    name: l('Écran thermique', 'Heat shield'),
    short: l(
      'Entre le gazogène chaud et la pompe : une plaque de rayonnement, ajoutée après un grippage.',
      'Between the hot gasifier and the pump: a radiation plate, added after a seizure.',
    ),
    description: lf(
      'L’institut a ajouté un écran de rayonnement pour la pompe d’injection et le filtre à gazole, après que la pompe a grippé à 25 heures. L’enveloppe du gazogène est chaude, ce qui compte pour un tracteur qui travaille dans les champs : dans le modèle, la tôle est à environ {casingModel} à pleine charge. Le rapport ne dit ni la matière ni la taille de l’écran : le lab le dessine comme une plaque, à partir de l’arrangement de la photographie, et c’est une lecture.',
      'The institute added a radiation shield for the injection pump and the diesel filter, after the pump seized at 25 hours. The gasifier’s casing is hot, which matters for a tractor working in fields: in the model, the plate is at about {casingModel} at full load. The report gives neither the material nor the size of the shield: the lab draws it as a plate, from the photograph’s arrangement, and that is a reading.',
    ),
    material: l('Plaque métallique, matière non dite', 'A metal plate, material not given'),
    specs: [
      sp('Ajouté après', 'Added after', l('un grippage de la pompe à 25 h', 'a pump seizure at 25 h')),
      sp('Protège', 'Protects', l('la pompe et le filtre à gazole', 'the pump and the diesel filter')),
      sp('Tôle du gazogène, modèle', 'Gasifier casing, model', v('{casingModel}')),
      sp('Matière, taille', 'Material, size', l('non dites : lecture du lab', 'not given: the lab’s reading')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de l’écran n’est rapportée. Ce que le rapport rapporte, c’est ce qui arrive sans lui.',
        check: 'La chaleur qui passe : le rapport ne la mesure pas, et le lab ne l’invente pas.',
        care: 'Aucun entretien décrit pour cet écran.',
      },
      {
        failure: 'No failure of the shield is reported. What the report reports is what happens without it.',
        check: 'The heat that gets through: the report does not measure it, and the lab does not invent it.',
        care: 'No care described for this shield.',
      },
    ),
    tip: l(
      'Activez « Transparence » : le capot s’efface et l’on voit l’écran entre le gazogène et la pompe.',
      'Switch on “X-ray”: the bonnet fades and the shield shows between the gasifier and the pump.',
    ),
    design: l(
      'Une plaque d’acier ne fait pas de bruit, et c’est pour cela qu’elle montre bien ce que dit l’histoire de ce tracteur : on n’ajoute un écran qu’après avoir vu quelque chose griller. Rien dans le rapport ne dit s’il suffisait.',
      'A steel plate makes no noise, and that is why it shows so well what this tractor’s story says: a shield is only added after something has been seen to fry. Nothing in the report says whether it was enough.',
    ),
  },
  {
    id: 'extra-governor',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Régulateur ajouté', 'Extra governor'),
    short: l(
      'Une courroie en V depuis l’arbre du ventilateur : un deuxième régulateur de vitesse, sur le papillon de gaz.',
      'A V-belt running from the fan shaft: a second speed governor, working on the gas throttle.',
    ),
    description: l(
      'Ce que dit le rapport : un régulateur de vitesse de plus, sur le papillon de gaz, entraîné par une courroie en V depuis l’arbre du ventilateur. Pourquoi, il ne le dit pas. Notre lecture : un diesel tient sa vitesse par un régulateur qui agit sur le gazole, et quand l’essentiel de l’énergie vient du gaz, il lui faut un second régulateur qui agisse sur le gaz. Le régulateur dessiné, sa poulie et sa courroie sont des estimations : ils tournent en 3D comme le ventilateur, sous un disque flou au-delà de trois tours par seconde, pour ne jamais sembler aller à l’envers.',
      'What the report says: one more speed governor, on the gas throttle, driven by a V-belt from the fan shaft. Why, it does not say. Our reading: a diesel keeps its speed by a governor that acts on the diesel, and when most of the energy comes from gas it needs a second governor that acts on the gas. The governor drawn, its pulley and its belt are estimates: they turn in the 3D like the fan, under a blur disc beyond three turns a second, so that they never seem to go backwards.',
    ),
    material: l('Régulateur centrifuge, poulie et courroie en V', 'Centrifugal governor, pulley and V-belt'),
    specs: [
      sp(
        'Changement',
        'Change',
        l('un régulateur de plus, sur le papillon de gaz', 'one more governor, on the gas throttle'),
      ),
      sp('Entraînement', 'Drive', l('courroie en V depuis l’arbre du ventilateur', 'V-belt from the fan shaft')),
      sp('Raison', 'Reason', l('non dite dans le rapport ; notre lecture', 'not given in the report; our reading')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne du régulateur n’est rapportée.',
        check: 'La tension de la courroie, pour tout système à courroie : le rapport ne la donne pas.',
        care: 'Aucun entretien décrit, et aucun réglage donné : c’est un réglage de plus que le lab ne donne pas.',
      },
      {
        failure: 'No failure of the governor is reported.',
        check: 'The belt’s tension, as for any belt system: the report does not give it.',
        care: 'No care described, and no setting given: it is one more setting the lab does not give.',
      },
    ),
    tip: l(
      'Cette pièce est sous le capot. Sélectionnez-la : le capot s’ouvre en transparence, et la courroie se lit.',
      'This part is under the bonnet. Select it: the bonnet opens as a ghost, and the belt can be read.',
    ),
    design: l(
      'C’est un signe que brancher un gazogène sur un tracteur touche aussi à ses commandes : l’institut a ajouté un régulateur, et la raison est notre lecture. Une courroie en V, un second régulateur : le rapport n’en dit pas plus.',
      'It is a sign that plugging a gasifier into a tractor touches its controls too: the institute added a governor, and the reason is our reading. A V-belt, a second governor: the report says no more.',
    ),
  },
  {
    id: 'left-consoles',
    scene: 'tractor',
    category: 'structure',
    name: l('Consoles', 'Left consoles'),
    short: l(
      'Ce qui porte le gazogène et le filtre sur le flanc gauche : un système de 450 kg, à 0,50 m du sol.',
      'What carries the gasifier and the filter on the left flank: a system of 450 kg, 0.50 m off the ground.',
    ),
    description: l(
      'Le gazogène et le filtre sont montés sur des consoles boulonnées au côté gauche du tracteur, le gazogène à 0,50 m du sol. Le système entier pèse 450 kg, avec le refroidisseur, les tuyaux et les accessoires : aucune source ne dit ce qui repose sur les consoles seules. Le lab les dessine d’après les figures du rapport : un plateau sous la base du gazogène, des poutres, une étagère pour le ventilateur, des bras pour le filtre. Ce sont des estimations. Ce qui compte est qu’aucune pièce ne flotte : le gazogène repose sur son plateau, le filtre sur ses bras.',
      'The gasifier and the filter are mounted on consoles bolted to the left side of the tractor, the gasifier 0.50 m off the ground. The whole system weighs 450 kg, with the cooler, the pipes and the fittings: no source says what rests on the consoles alone. The lab draws them from the report’s figures: a pad under the gasifier’s base, beams, a shelf for the fan, arms for the filter. They are estimates. What counts is that no part floats: the gasifier rests on its pad, the filter on its arms.',
    ),
    material: l('Poutres et plateau d’acier boulonnés au tracteur', 'Steel beams and pad bolted to the tractor'),
    specs: [
      sp('Système, au total', 'System, in all', '450 kg'),
      sp('Gazogène au-dessus du sol', 'Gasifier above the ground', '0,50 m'),
      sp('Côté', 'Side', l('gauche', 'left')),
      sp(
        'Forme des consoles',
        'Shape of the consoles',
        l('estimation d’après les figures', 'estimate from the figures'),
      ),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de console n’est rapportée en plus de 2 500 heures.',
        check: 'Le poids du filtre : un caisson de 4,9 m² de toile avec ses manches, plus la poussière qu’il retient.',
        care: 'Rien n’est décrit dans le rapport pour ces pièces.',
      },
      {
        failure: 'No console failure is reported over more than 2,500 hours.',
        check: 'The filter’s weight: a box of 4.9 m² of cloth with its bags, plus the dust it holds.',
        care: 'Nothing is described in the report for these parts.',
      },
    ),
    tip: l(
      'Dans « Éclaté », les consoles sortent du côté gauche : tout ce qu’elles portent monte, puis elles les suivent.',
      'In “Explode”, the consoles move out to the left: everything they carry goes up, and they follow.',
    ),
    design: l(
      'Mettre 450 kg sur un seul flanc est un déséquilibre : le rapport ne dit pas comment l’institut l’a pris, et le lab ne le devine pas. Il dit seulement que le tracteur l’a porté plus de 2 500 heures.',
      'Putting 450 kg on one flank is an imbalance: the report does not say how the institute took it, and the lab does not guess. It only says that the tractor carried it for more than 2,500 hours.',
    ),
  },
  {
    id: 'gasifier-unit',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Gazogène', 'Gasifier unit'),
    short: l(
      'Le cœur de la machine, 2,22 m de haut : il fabrique le gaz. Il ouvre le monde où on le voit en coupe.',
      'The heart of the machine, 2.22 m high: it makes the gas. It opens the world where it is seen in section.',
    ),
    description: lf(
      'Voici l’appareil, de type F-5 : une soute de 0,2 m³ au-dessus, un foyer dessous, et à 2,22 m du sol son sommet, à 0,50 m son pied. Des plaquettes y descendent, sèchent, brûlent en partie faute d’air, et sortent en gaz : au banc 5,60 MJ/Nm³, et le modèle trouve {gasModel}. Le gaz froid contient 71 % de l’énergie du bois au banc ; le modèle trouve {cgeModel}. Il sort vers {outletModel}, une valeur que le modèle tient dans la bande du rapport par une estimation : ce n’est pas un résultat. Le goudron à la sortie était de 0,13 g/Nm³ à pleine charge. Cliquez le gazogène : le monde « Gazogène » s’ouvre, en coupe.',
      'Here is the apparatus, of type F-5: a 0.2 m³ bunker above, a hearth below, and its top at 2.22 m from the ground, its foot at 0.50 m. Chips go down into it, dry, burn in part for want of air, and leave as gas: 5.60 MJ/Nm³ on the bench, and the model finds {gasModel}. The cold gas holds 71% of the wood’s energy on the bench; the model finds {cgeModel}. It leaves at about {outletModel}, a value the model holds in the report’s band by an estimate: it is not a result. The tar at the outlet was 0.13 g/Nm³ at full load. Click the gasifier: the “Gasifier” world opens, in section.',
    ),
    material: l('Tôle d’acier en deux corps, boulonnée', 'Sheet steel in two casings, bolted'),
    specs: [
      sp('Type', 'Type', l('F-5', 'F-5')),
      sp('Soute', 'Bunker', '0,2 m³'),
      sp('Sommet, pied, au-dessus du sol', 'Top, foot, above the ground', '2,22 m · 0,50 m'),
      sp('Gaz, au banc', 'Gas, on the bench', '5,60 MJ/Nm³'),
      sp('Gaz, selon le modèle', 'Gas, by the model', v('{gasModel}')),
      sp('Goudron à la sortie, à pleine charge', 'Tar at the outlet, at full load', '0,13 g/Nm³'),
    ],
    maintenance: maint(
      {
        failure:
          'L’enveloppe du bas qui rouille, de 2 000 à 4 000 heures. Le foyer fissure de 600 à 1 000 heures, l’anneau de gorge tient environ 700 heures, la grille de 400 à 700.',
        check:
          'La température du gaz : au-delà d’environ 300 °C, la toile du filtre ne la tient plus. L’alarme de la Simulation s’allume alors.',
        care: 'Le cendrier était sorti toutes les 8 à 15 heures, et le condensat de la chemise toutes les 8 à 10 heures. Ce sont des durées, pas des gestes.',
      },
      {
        failure:
          'The lower casing rusts, at 2,000 to 4,000 hours. The firebox cracks at 600 to 1,000 hours, the throat ring lasts about 700 hours, the grate 400 to 700.',
        check:
          'The gas temperature: past about 300 °C the filter cloth no longer takes it. The Simulation’s alarm lights then.',
        care: 'The ash pit was emptied every 8 to 15 hours, and the jacket’s condensate every 8 to 10 hours. Those are durations, not gestures.',
      },
    ),
    tip: l(
      'Ouvrez le monde « Gazogène » et déplacez le curseur du voyage : une plaquette y descend à travers quatre zones.',
      'Open the “Gasifier” world and move the journey slider: a chip goes down through four zones.',
    ),
    design: l(
      'Le gazogène est fait de deux corps : le haut garde le combustible, le bas garde le feu, et un verrou les tient ensemble. Sa soute de 0,2 m³ fixe le rythme de toute la journée : 40 à 50 minutes entre deux pleins.',
      'The gasifier is made of two casings: the upper one keeps the fuel, the lower one keeps the fire, and a lock holds them together. Its 0.2 m³ bunker sets the rhythm of the whole day: 40 to 50 minutes between two fillings.',
    ),
  },
  {
    id: 'gas-line-run',
    scene: 'tractor',
    category: 'mechanical',
    name: l('Ligne de gaz', 'Gas line run'),
    short: l(
      'Du gazogène jusqu’au moteur : le chemin que parcourt le gaz, tuyaux, filtre, refroidisseur. Elle ouvre le monde à plat.',
      'From the gasifier to the engine: the path the gas takes, pipes, filter, cooler. It opens the world laid out flat.',
    ),
    description: lf(
      'Le gaz ne va pas droit du gazogène au moteur. Il passe par un tuyau chaud, une vanne, un filtre, un refroidisseur, un mélangeur avec de l’air, une tubulure : c’est l’arrangement du schéma du rapport, que le lab redessine d’après ses pièces. Les dimensions des tuyaux, des vannes et du mélangeur ne sont pas dans ce que nous avons lu. Seules les surfaces le sont : 4,9 m² de toile au filtre, 5,8 m² au refroidisseur. Sur tout le trajet, le moteur aspire : l’ensemble est en dépression, et la perte, gazogène compris, atteint environ {trainModel} au maximum. Cliquez la ligne : le monde « Ligne de gaz » s’ouvre, à plat.',
      'The gas does not go straight from the gasifier to the engine. It passes a hot pipe, a valve, a filter, a cooler, a mixer with air, a manifold: that is the arrangement of the report’s schematic, which the lab redraws from its parts. The dimensions of the pipes, the valves and the mixer are not in what we read. Only the areas are: 4.9 m² of cloth in the filter, 5.8 m² in the cooler. All along the way the engine sucks: the whole is under suction, and the loss, gasifier included, reaches about {trainModel} at the maximum. Click the line: the “Gas line” world opens, laid out flat.',
    ),
    material: l('Tuyaux d’acier, filtre, refroidisseur', 'Steel pipes, filter, cooler'),
    specs: [
      sp('Surface de toile du filtre', 'Filter cloth area', '4,9 m²'),
      sp('Surface du refroidisseur', 'Cooler surface', '5,8 m²'),
      sp(
        'Dimensions des tuyaux',
        'Pipe dimensions',
        l('inconnues, estimées pour le modèle', 'unknown, estimated for the model'),
      ),
      sp('Dépression totale, au maximum, modèle', 'Total suction, at the maximum, model', v('{trainModel}')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau dans le moteur : la seule panne grave de ce tracteur est probablement venue d’un bac de condensats trop plein, sur cette ligne.',
        check:
          'La résistance du filtre, au manomètre à eau : sur le camion, elle doublait après environ 3 000 km, et elle est plus que sextuplée si la toile se mouille.',
        care: 'Le filtre était nettoyé toutes les 25 à 100 heures, pendant 30 à 60 minutes ; le refroidisseur et les joints, vers 500 heures.',
      },
      {
        failure:
          'Water in the engine: this tractor’s one serious failure probably came from an overfull condensate vessel, on this line.',
        check:
          'The filter’s resistance, on the water gauge: on the truck it doubled after about 3,000 km, and it is more than sixfold if the cloth gets wet.',
        care: 'The filter was cleaned every 25 to 100 hours, for 30 to 60 minutes; the cooler and the gaskets, at about 500 hours.',
      },
    ),
    tip: l(
      'Activez « Flux » : les points suivent le gaz du gazogène jusqu’au mélangeur, et changent de couleur en refroidissant.',
      'Switch on “Flows”: the dots follow the gas from the gasifier to the mixer, and change colour as it cools.',
    ),
    design: l(
      'Cette ligne se voit deux fois : sur le tracteur, à sa place, et à plat dans son monde. C’est la même construction déplacée, jamais redessinée plus simple.',
      'This line can be seen twice: on the tractor, in its place, and laid flat in its own world. It is the same construction moved, never redrawn simpler.',
    ),
  },
];
