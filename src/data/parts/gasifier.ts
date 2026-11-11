// Parts of the `gasifier` world (20): the unit in section, « the journey of a chip ». The hot parts of this world (the throat ring, the air nozzles, the fire box, the grate and the three zones around them) are drawn to scale in the 3D, and their sizes are printed on no sheet, no spec and no
// drawing: no dimension, no count, no ratio, no hint of one (research §A.2, R2; `GASIFIER_REFUSED` in src/three; src/data/refusals.test.ts holds it). What a sheet may say of them is what they do, what the Swedish institute reported of their lives, temperatures, and what the model finds. No gesture of use is described (R3).
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const GASIFIER_PARTS: PartInfo[] = [
  {
    id: 'spring-lid',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Couvercle à ressort', 'Spring lid'),
    short: l(
      'Un couvercle tenu par un ressort : il se soulève sous la poussée du gaz, et s’il ne ferme pas, la machine brûle comme un poêle.',
      'A lid held by a spring: it lifts under the gas’s push, and if it does not seal, the machine burns like a stove.',
    ),
    description: lf(
      'Le couvercle ferme la soute, et un ressort le tient. Quand la pression monte à l’intérieur, il se soulève : c’est un couvercle de décharge, il ne rend rien acceptable. Après l’arrêt du moteur, l’aspiration cesse, le gaz continue de se former et pousse : le couvercle de la 3D se lève de {lidLift}, une estimation, car la course réelle du ressort est inconnue. S’il ne ferme pas, l’air entre par le haut et le livre suédois dit qu’un gazogène garé se met à brûler comme un poêle. Le modèle l’essaie sur trois fuites, {leak3}, {leakMid} et {leak30} : à la plus petite, le feu s’éteint en une heure et demie environ ; à la plus grande, il dure tant qu’il reste du bois, soit environ {leakHours}. Aucune source ne dit la taille d’une telle fuite.',
      'The lid closes the bunker, and a spring holds it. When pressure builds up inside, it lifts: it is a relief lid, and it makes nothing acceptable. After the engine stops, suction ends, the gas goes on forming and pushes: the 3D’s lid rises by {lidLift}, an estimate, because the spring’s real travel is unknown. If it does not seal, air comes in at the top, and the Swedish book says a parked gasifier starts burning like a stove. The model tries three leaks, {leak3}, {leakMid} and {leak30}: at the smallest, the fire fades in about an hour and a half; at the largest, it lasts as long as there is wood, about {leakHours}. No source gives the size of such a leak.',
    ),
    material: l('Tôle emboutie, ressort d’acier', 'Pressed steel plate, steel spring'),
    specs: [
      sp('Rôle', 'Role', l('couvercle de décharge', 'relief lid')),
      sp('Soulèvement dans la 3D', 'Lift in the 3D', v('{lidLift}')),
      sp('Fuites essayées par le modèle', 'Leaks tried by the model', v('{leak3} · {leakMid} · {leak30}')),
      sp('À la plus grande, le feu dure', 'At the largest, the fire lasts', v('{leakHours}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un couvercle qui ne ferme pas : l’appareil peut brûler comme un poêle et lâcher son gaz bien plus longtemps. Air et gaz se rencontrent là : c’est l’un des endroits où une explosion peut naître.',
        check:
          'Sur 230 véhicules contrôlés après des rapports de police, au premier semestre de 1945, 155 avaient un gazogène défectueux. La source suédoise ne dit pas quel défaut.',
        care: 'Aucune opération n’est décrite pour le couvercle.',
      },
      {
        failure:
          'A lid that does not seal: the unit can burn like a stove and let its gas go for far longer. Air and gas meet there: it is one of the places where an explosion can start.',
        check:
          'Of 230 vehicles checked after police reports in the first half of 1945, 155 had a faulty gasifier. The Swedish source does not say which fault.',
        care: 'No operation is described for the lid.',
      },
    ),
    tip: l(
      'Dans « Garage », juste après l’arrêt, regardez le couvercle de près : il se soulève de quelques millimètres, au rythme du gaz qui pousse.',
      'In “Garage”, just after the stop, look at the lid up close: it lifts a few millimetres, at the rhythm of the gas pushing.',
    ),
    design: l(
      'Un ressort et une plaque : c’est la pièce la plus simple de la machine, et celle dont le défaut est le plus lourd. Le livre suédois a consacré une dizaine de pages à expliquer qu’une machine réputée étanche n’en est pas pour autant hors de cause : ce lab le prend au mot, et ne donne ici aucune règle.',
      'A spring and a plate: the simplest part of the machine, and the one whose fault weighs most. The Swedish book spent a dozen pages explaining that a machine reputed tight is not thereby beyond question: this lab takes it at its word, and gives no rule here.',
    ),
  },
  {
    id: 'fuel-casing',
    scene: 'gasifier',
    category: 'structure',
    name: l('Corps à combustible', 'Fuel casing'),
    short: l(
      'La soute : 0,2 m³ de plaquettes, de quoi tenir 40 à 50 minutes. Des gens sont morts dedans.',
      'The bunker: 0.2 m³ of chips, enough for 40 to 50 minutes. People have died inside one.',
    ),
    description: lf(
      'La soute est le haut du gazogène, un cylindre d’acier qui garde le combustible : 0,2 m³, soit {bunkerKg} de plaquettes à 152 kg le mètre cube. À pleine charge, elle se vide en 40 à 50 minutes. Au bas, un manchon perforé et un espace derrière lui laissent la vapeur du séchage rejoindre la paroi. Elle est ouverte au sommet par le couvercle. Deux chercheurs d’une université du Midwest américain sont morts du monoxyde de carbone après être descendus dans la soute d’un gazogène. La source ne donne ni leurs noms, ni la date.',
      'The bunker is the top of the gasifier, a steel cylinder that keeps the fuel: 0.2 m³, which is {bunkerKg} of chips at 152 kg a cubic metre. At full load it empties in 40 to 50 minutes. At the bottom, a perforated sleeve and a space behind it let the drying vapour reach the wall. It is opened at the top by the lid. Two researchers at a university in the American Midwest died of carbon monoxide after climbing into the bunker of a gasifier. The source gives neither their names nor the date.',
    ),
    material: l('Tôle d’acier, rouleau de bord', 'Sheet steel, rolled rim'),
    specs: [
      sp('Volume', 'Volume', '0,2 m³'),
      sp('Combustible à pleine soute', 'Fuel at a full bunker', v('{bunkerKg}')),
      sp('Autonomie, selon le rapport', 'Duration, by the report', l('40 à 50 min', '40 to 50 min')),
      sp('Densité des plaquettes', 'Chip bulk density', '152 kg/m³'),
    ],
    maintenance: maint(
      {
        failure:
          'Rien n’est rapporté sur la soute elle-même en plus de 2 500 heures. Le seul accident cité est celui des deux chercheurs, dans une autre machine.',
        check: 'Le monoxyde de carbone n’a ni couleur ni odeur : l’œil et le nez ne jugent pas l’air d’une soute.',
        care: 'La soute se remplissait toutes les 40 à 50 minutes, en moins de 5 minutes. C’est une durée de l’institut, pas un geste décrit.',
      },
      {
        failure:
          'Nothing is reported of the bunker itself over more than 2,500 hours. The only accident cited is the two researchers’, in another machine.',
        check: 'Carbon monoxide has neither colour nor smell: eye and nose cannot judge the air of a bunker.',
        care: 'The bunker was filled every 40 to 50 minutes, in under 5 minutes. That is an institute’s duration, not a gesture described.',
      },
    ),
    tip: l(
      'Le niveau des plaquettes descend dans la 3D, avec le modèle : lancez « L’heure mesurée » et regardez le haut du lit.',
      'The chips’ level goes down in the 3D, with the model: run “The measured hour” and watch the top of the bed.',
    ),
    design: l(
      'La soute fixe le rythme de la journée : on la remplit parce qu’elle se vide, environ tous les trois quarts d’heure. Le chiffre de 0,2 m³ est l’une des rares tailles de cette machine que le lab imprime, parce que c’est une taille d’ensemble, pas celle d’une pièce de feu.',
      'The bunker sets the rhythm of the day: it is filled because it empties, every three quarters of an hour. The figure of 0.2 m³ is one of the few sizes of this machine the lab prints, because it is an overall size, not that of a part of the fire.',
    ),
  },
  {
    id: 'chip-column',
    scene: 'gasifier',
    category: 'site',
    name: l('Colonne de plaquettes', 'Chip column'),
    short: lf(
      '{bunkerKg} de plaquettes qui descendent à raison de {fall} : une heure de voyage, jusqu’au feu.',
      '{bunkerKg} of chips going down at {fall}: an hour’s journey, to the fire.',
    ),
    description: lf(
      'La colonne est le combustible tel qu’il se tient dans la soute : {bunkerKg} de plaquettes, à pleine soute. À pleine charge, elle descend d’environ {fall}, et la soute se vide en 40 à 50 minutes. Une plaquette met environ {fallHours} pour aller du couvercle à la grille : elle sèche, se carbonise, brûle en partie, puis son charbon finit en gaz. Le gaz, lui, traverse le même lit en {gasTime}. Voilà les deux vitesses de cette machine : le bois à l’allure d’un escargot, le gaz d’un trait, et c’est ce rapport qui fait de l’énergie.',
      'The column is the fuel as it stands in the bunker: {bunkerKg} of chips, at a full bunker. At full load it goes down about {fall}, and the bunker empties in 40 to 50 minutes. A chip takes about {fallHours} to go from the lid to the grate: it dries, chars, burns in part, and then its char ends as gas. The gas crosses the same bed in {gasTime}. These are the machine’s two speeds: the wood at a snail’s pace, the gas in a flash, and it is that ratio that makes the energy.',
    ),
    material: l(
      'Plaquettes de bois, 15 à 30 mm pour l’essentiel (répartition type)',
      'Wood chips, mostly 15 to 30 mm (typical distribution)',
    ),
    specs: [
      sp('Plaquettes à pleine soute', 'Chips at a full bunker', v('{bunkerKg}')),
      sp('Descente à pleine charge', 'Fall at full load', v('{fall}')),
      sp('Selon le modèle', 'By the model', v('{fallModel}')),
      sp('Une plaquette, du haut au bas', 'One chip, top to bottom', v('{fallHours}')),
      sp('Le gaz, à travers le même lit', 'The gas, through the same bed', v('{gasTime}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une colonne qui se voûte ou qui s’ouvre en canal : aucune source ne la mesure ici, et le modèle ne la contient pas, ni voûte, ni canal.',
        check:
          'Le niveau du lit, au sommet : dans la 3D, il suit le modèle, et le dôme de plaquettes descend avec lui.',
        care: 'Les plaquettes étaient criblées avant d’être chargées : sans fines, la colonne laisse passer le gaz. C’est ce que montre le crible de la ferme.',
      },
      {
        failure:
          'A column that bridges or opens into a channel: no source measures it here, and the model does not contain it, no bridge, no channel.',
        check: 'The bed’s level, at the top: in the 3D it follows the model, and the dome of chips goes down with it.',
        care: 'The chips were sieved before they were loaded: with no fines, the column lets the gas through. That is what the farm’s sieve shows.',
      },
    ),
    tip: l(
      'Faites glisser le curseur du voyage : un curseur suit une plaquette du couvercle au cendrier, et un analyseur lit le gaz autour d’elle.',
      'Drag the journey slider: a cursor follows one chip from the lid to the ash pit, and an analyser reads the gas around it.',
    ),
    design: l(
      'Le temps de la plaquette est trop lent pour se voir : l’horloge de la simulation court, et le lab dit de combien.',
      'The chip’s time is too slow to watch: the simulation’s clock runs fast, and the lab says by how much.',
    ),
  },
  {
    id: 'drying-zone',
    scene: 'gasifier',
    category: 'site',
    name: l('Zone de séchage', 'Drying zone'),
    short: l(
      'Là où l’eau quitte le bois : un bois trop mouillé refroidit le feu, et au-delà d’environ 40 % le gaz ne brûle plus.',
      'Where the water leaves the wood: wood that is too wet cools the fire, and past about 40% the gas no longer burns.',
    ),
    description: lf(
      'En haut de la colonne, la chaleur du feu remonte et chasse l’eau du bois : vers {dryT}, elle part en vapeur. Cette vapeur traverse le manchon perforé, va se condenser contre la paroi froide, et coule jusqu’à la purge : on pouvait drainer ainsi de 60 à 80 % de l’eau du bois. Le rapport donne ses limites en base humide : 8 % pour l’essai du bilan, de 10 à 20 % pour ses plaquettes d’essai, 30 % au plus, et au-delà d’environ 40 % le gaz ne brûle plus. Le modèle voit le gaz tomber aux 4,2 MJ/m³ que demandent les moteurs vers {wetLimit}, si la chemise draine son eau, vers {wetNoDrain} sinon. Sa flamme, elle, ne s’éteint jamais : ce qui arrête un vrai foyer n’y est pas.',
      'At the top of the column, the fire’s heat rises and drives the water from the wood: at about {dryT}, it leaves as vapour. That vapour crosses the perforated sleeve, condenses on the cold wall, and runs down to the drain: 60 to 80% of the wood’s water could be drained that way. The report gives its limits on the wet basis: 8% for the balance test, 10 to 20% for its test chips, 30% at the most, and past about 40% the gas no longer burns. The model sees the gas fall to the 4.2 MJ/m³ engines ask for near {wetLimit}, if the jacket drains its water, near {wetNoDrain} if not. Its flame never goes out: what stops a real hearth is not in it.',
    ),
    material: l('Plaquettes de bois, vapeur d’eau', 'Wood chips, water vapour'),
    specs: [
      sp('Humidité des essais', 'Tests’ moisture', l('8 % (base humide)', '8% (wet basis)')),
      sp(
        'Limite du rapport',
        'Report’s limit',
        l('30 % ; plus de 40 % : ne brûle plus', '30%; past 40%: no longer burns'),
      ),
      sp('Eau drainée à la chemise', 'Water drained at the jacket', l('60 à 80 %', '60 to 80%')),
      sp('Température, selon le modèle', 'Temperature, by the model', v('{dryT}')),
      sp('Gaz sous 4,2 MJ/m³, avec drain', 'Gas under 4.2 MJ/m³, with drain', v('{wetLimit}')),
      sp('Gaz sous 4,2 MJ/m³, sans drain', 'Gas under 4.2 MJ/m³, no drain', v('{wetNoDrain}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bois trop humide : le feu refroidit, le gaz s’appauvrit, et la même puissance demande plus de bois. À 40 % d’humidité, le modèle brûle {chipsWet40} contre {chipsModel} à 8 %.',
        check:
          'La base : un bois à 20 % en base humide vaut 25 % en base sèche. Le rapport mêle les deux, et chaque chiffre du lab dit laquelle.',
        care: 'Un bois à 20–25 % d’humidité en base sèche vaut de 13 à 15 MJ/kg, quand les plaquettes d’essai valent {woodMJ}.',
      },
      {
        failure:
          'Wood that is too wet: the fire cools, the gas thins, and the same power takes more wood. At 40% moisture, the model burns {chipsWet40} against {chipsModel} at 8%.',
        check:
          'The basis: wood at 20% on the wet basis is 25% on the dry basis. The report mixes the two, and each figure of the lab says which.',
        care: 'Wood at 20–25% moisture on the dry basis is worth 13 to 15 MJ/kg, when the test chips are worth {woodMJ}.',
      },
    ),
    tip: lf(
      'Lancez « Des plaquettes humides » : à 40 % d’humidité, la température de la flamme du modèle passe de {oxModel} à environ {oxWet40}.',
      'Run “Wet chips”: at 40% moisture, the model’s flame temperature goes from {oxModel} to about {oxWet40}.',
    ),
    design: l(
      'Sécher coûte de l’énergie, et le feu la paie là-haut. Dans le modèle, l’eau tirée à la chemise ne rejoint jamais le feu, mais sa chaleur latente est payée quand même : c’est pourquoi le gaz s’appauvrit à mesure que le bois est humide, jusqu’à ce que l’alarme de la Simulation s’allume.',
      'Drying costs energy, and the fire pays it up there. In the model, the water drawn at the jacket never reaches the fire, but its latent heat is paid all the same: that is why the gas thins as the wood is wetter, until the Simulation’s alarm lights.',
    ),
  },
  {
    id: 'pyrolysis-zone',
    scene: 'gasifier',
    category: 'site',
    name: l('Zone de pyrolyse', 'Pyrolysis zone'),
    short: l(
      'À partir d’environ 250 °C, le bois se défait : il laisse du charbon, et des vapeurs qui sont des goudrons.',
      'From about 250 °C the wood comes apart: it leaves charcoal, and vapours that are tars.',
    ),
    description: lf(
      'Plus bas, le bois devient autre chose. À partir d’environ 250 °C, il se défait : il laisse du charbon, et des vapeurs faites de gaz et de goudrons. Le modèle suppose que cela finit vers {pyroEnd}, et que le charbon pèse {char} de la masse sèche : deux estimations, car la source ne les donne pas. Il met la zone à environ {pyroT}. Ces vapeurs sont le vrai problème du gazogène : des goudrons qui, intacts, collent tout sur leur passage. Il leur reste à traverser la flamme, juste dessous. Le goudron lui-même, le lab ne le prédit pas : il porte la bande mesurée, 0,13 g/Nm³ à pleine charge, 0,04 à charge partielle, 0,17 au ralenti.',
      'Lower down, the wood becomes something else. From about 250 °C it comes apart: it leaves charcoal, and vapours made of gas and tars. The model assumes this ends near {pyroEnd}, and that the char weighs {char} of the dry mass: two estimates, because the source does not give them. It puts the zone at about {pyroT}. Those vapours are the gasifier’s real problem: tars that, left intact, stick to everything in their way. They still have to cross the flame, just below. The tar itself, the lab does not predict: it carries the measured band, 0.13 g/Nm³ at full load, 0.04 at part load, 0.17 at idle.',
    ),
    material: l('Plaquettes en train de se décomposer', 'Chips in the middle of coming apart'),
    specs: [
      sp('Début de la pyrolyse', 'Start of pyrolysis', l('environ 250 °C', 'about 250 °C')),
      sp('Fin, selon le modèle', 'End, by the model', v('{pyroEnd}')),
      sp('Charbon, selon le modèle', 'Char, by the model', lf('{char} de la masse sèche', '{char} of the dry mass')),
      sp('Température de la zone, modèle', 'Zone temperature, model', v('{pyroT}')),
      sp('Goudron mesuré, pleine charge', 'Tar measured, full load', '0,13 g/Nm³'),
    ],
    maintenance: maint(
      {
        failure:
          'Des goudrons qui passent la flamme sans brûler : c’est ce qui encrasse un filtre et un moteur. Au banc, 0,04 g/Nm³ à charge partielle, 0,13 à pleine charge, 0,17 au ralenti.',
        check:
          'Le goudron ne se lit pas à l’œil, et le modèle ne le prédit pas : la barre « goudron » de l’analyseur n’est pas une concentration.',
        care: 'Aucune opération n’est décrite pour cette zone : elle se trouve dans le lit, et le lab n’en montre aucun geste.',
      },
      {
        failure:
          'Tars that cross the flame unburnt: that is what fouls a filter and an engine. On the bench, 0.04 g/Nm³ at part load, 0.13 at full load, 0.17 at idle.',
        check:
          'Tar cannot be read by eye, and the model does not predict it: the analyser’s “tar” bar is not a concentration.',
        care: 'No operation is described for this zone: it lies inside the bed, and the lab shows no gesture of it.',
      },
    ),
    tip: l(
      'Déplacez le curseur du voyage au tiers du chemin : la plaquette noircit, et l’analyseur lit une vapeur sans air.',
      'Move the journey slider to a third of the way: the chip blackens, and the analyser reads a vapour with no air.',
    ),
    design: l(
      'Cette zone est la raison du gazogène à courant descendant : les vapeurs y naissent au-dessus du feu et doivent le traverser. Dans un appareil où elles montent, elles sortent avec le gaz, et il en restait de 5 à 20 % du bois : un manuel américain le chiffre pour ce type-là.',
      'This zone is the reason for the downdraught gasifier: the vapours are born above the fire and must cross it. In an apparatus where they rise, they leave with the gas, and 5 to 20% of the wood was left: an American handbook puts that figure on that type.',
    ),
  },
  {
    id: 'oxidation-zone',
    scene: 'gasifier',
    category: 'site',
    name: l('Zone d’oxydation', 'Oxidation zone'),
    short: l(
      'Là où brûle une part du bois : de 1 200 à 1 500 °C, le rapport l’écrit, et c’est là que les goudrons disparaissent.',
      'Where part of the wood burns: 1,200 to 1,500 °C, the report writes, and that is where the tars vanish.',
    ),
    description: lf(
      'Voici le feu, au niveau des tuyères : de 1 200 à 1 500 °C, selon le rapport. Seulement environ 30 % du bois y brûle, avec un rapport d’équivalence d’environ 0,25 selon un manuel : c’est un feu qui manque d’air, à dessein. Le bilan du modèle y trouve {oxBalance}, dans la bande, mais quand il compte aussi la chaleur perdue par la paroi, il tombe à {oxModel}, sous elle. Les vapeurs de la pyrolyse doivent traverser cette flamme. Un gazogène à courant montant, où elles sortent telles quelles, en laisse de 5 à 20 % du bois. Ici, presque aucun goudron n’en sort : celui de 0,13 g/Nm³ à la sortie fait {tarShare} du bois, au banc. Ce rapport au bois est de l’arithmétique, pas un résultat du modèle.',
      'Here is the fire, at the nozzles: 1,200 to 1,500 °C, by the report. Only about 30% of the wood burns there, with an equivalence ratio of about 0.25 by one handbook: it is a fire short of air, on purpose. The model’s balance finds {oxBalance} there, inside the band, but when it also counts the heat lost through the wall it falls to {oxModel}, under it. The pyrolysis vapours must cross this flame. An updraught gasifier, where they come out as they are, leaves 5 to 20% of the wood. Here, almost no tar comes out: the 0.13 g/Nm³ at the outlet is {tarShare} of the wood, on the bench. That ratio to the wood is arithmetic, not a result of the model.',
    ),
    material: l('Charbon incandescent et flammes', 'Glowing char and flames'),
    specs: [
      sp('Bande du rapport', 'Report’s band', l('1 200 à 1 500 °C', '1,200 to 1,500 °C')),
      sp('Selon le bilan du modèle', 'By the model’s balance', v('{oxBalance}')),
      sp('Avec la chaleur de la paroi', 'With the wall’s heat counted', v('{oxModel}')),
      sp('Part du bois qui brûle', 'Share of the wood that burns', l('environ 30 %', 'about 30%')),
      sp(
        'Rapport d’équivalence',
        'Equivalence ratio',
        lf('0,25 (manuel) · {er} (modèle)', '0.25 (handbook) · {er} (model)'),
      ),
      sp('Goudron à la sortie, part du bois', 'Tar at the outlet, share of the wood', v('{tarShare}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un feu qui refroidit : avec 40 % d’humidité, le modèle tombe à {oxWet40}, et le gaz s’appauvrit. À l’inverse, de l’air entré sous la grille brûle le gaz fini : plus chaud, plus faible.',
        check:
          'La bande du rapport est le seul repère, et le modèle ne la tient que par une estimation, celle de la part de charbon : de {oxCharLow} à {oxCharHigh} quand cette part double.',
        care: 'C’est là que le métal brûle : l’anneau de gorge tenait environ 700 heures, le foyer de 600 à 1 000.',
      },
      {
        failure:
          'A fire that cools: at 40% moisture the model falls to {oxWet40}, and the gas thins. Conversely, air that gets in below the grate burns the finished gas: hotter, weaker.',
        check:
          'The report’s band is the only landmark, and the model holds it only by an estimate, the share of char: from {oxCharLow} to {oxCharHigh} when that share doubles.',
        care: 'It is here that the metal burns: the throat ring lasted about 700 hours, the firebox 600 to 1,000.',
      },
    ),
    tip: l(
      'Déplacez le curseur du voyage au milieu : la plaquette passe sous le feu, et la fausse couleur de la coupe devient rouge.',
      'Move the journey slider to the middle: the chip goes under the fire, and the section’s false colour turns red.',
    ),
    design: l(
      'Un feu qui manque d’air fait du gaz, quand un feu avec assez d’air ne laisse que des cendres. Tout le gazogène tient dans cette phrase. La température dépend de la part de charbon que le modèle suppose, et de vitesses de réaction que son auteur a prises de mémoire : le lab le dit parce qu’aucune source n’a mesuré la flamme de cette machine.',
      'A fire short of air makes gas, when a fire with enough air leaves only ash. The whole gasifier fits in that sentence. The temperature depends on the share of char the model assumes, and on reaction rates its author took from memory: the lab says so because no source measured this machine’s flame.',
    ),
  },
  {
    id: 'reduction-zone',
    scene: 'gasifier',
    category: 'site',
    name: l('Zone de réduction', 'Reduction zone'),
    short: l(
      'Sous la flamme, un lit de charbon rouge : le gaz s’y refroidit, et c’est là qu’il devient combustible.',
      'Below the flame, a bed of red char: the gas cools there, and that is where it becomes fuel.',
    ),
    description: lf(
      'Sous la flamme, le gaz chaud traverse un lit de charbon rougeoyant. Le CO₂ y reprend du carbone et devient deux molécules de CO ; la vapeur d’eau devient de l’hydrogène. Ces réactions prennent de la chaleur, {reactEnth} pour la première d’après les pouvoirs calorifiques du rapport : le gaz se refroidit, de {redFrom} à {redTo} environ, soit {coolK}, et c’est là qu’il gagne son énergie. Au-dessous d’environ 700 °C, l’équilibre de l’eau se fige : le gaz ne change plus. Il sort avec, selon le modèle, CO {gasCO}, H₂ {gasH2}, CH₄ {gasCH4}, CO₂ {gasCO2}, N₂ {gasN2}, dans les bandes du rapport pour l’essentiel.',
      'Below the flame, the hot gas crosses a bed of glowing char. The CO₂ takes carbon back and becomes two molecules of CO; the water vapour becomes hydrogen. These reactions take heat, {reactEnth} for the first by the report’s heating values: the gas cools, from {redFrom} to {redTo} or so, that is {coolK}, and that is where it gains its energy. Below about 700 °C, the water’s equilibrium freezes: the gas no longer changes. It leaves with, by the model, CO {gasCO}, H₂ {gasH2}, CH₄ {gasCH4}, CO₂ {gasCO2}, N₂ {gasN2}, inside the report’s bands for the most part.',
    ),
    material: l('Lit de charbon de bois incandescent', 'A bed of glowing charcoal'),
    specs: [
      sp('Réaction principale', 'Main reaction', lf('C + CO₂ → 2 CO, {reactEnth}', 'C + CO₂ → 2 CO, {reactEnth}')),
      sp('Chaleur prise, au maximum, modèle', 'Heat taken, at the maximum, model', v('{reductionKw}')),
      sp('Refroidissement du gaz, modèle', 'Cooling of the gas, model', v('{coolK}')),
      sp('Chaleur prise par kilo de bois sec', 'Heat taken per kilo of dry wood', v('{coolMJ}')),
      sp(
        'Gaz, bandes du rapport',
        'Gas, the report’s bands',
        l(
          'CO 17–22 · H₂ 12–20 · CO₂ 9–15 · CH₄ 2–3 · N₂ 50–54 %',
          'CO 17–22 · H₂ 12–20 · CO₂ 9–15 · CH₄ 2–3 · N₂ 50–54%',
        ),
      ),
      sp(
        'Gaz, modèle',
        'Gas, model',
        lf(
          'CO {gasCO} · H₂ {gasH2} · CO₂ {gasCO2} · N₂ {gasN2}',
          'CO {gasCO} · H₂ {gasH2} · CO₂ {gasCO2} · N₂ {gasN2}',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un lit qui ne réduit plus : à un long ralenti, le foyer du modèle tombe à {idleHearth}, là où aucune réduction ne marcherait, alors que le gaz du banc reste aussi riche qu’au travail. Le modèle et la table ne se recoupent pas là.',
        check: 'Le gaz : 5,60 MJ/Nm³ au banc, et le modèle trouve {gasModel}, soit {gasGap} de moins.',
        care: 'Le lit n’est pas entretenu : il se refait à chaque descente de plaquettes. L’institut ne décrit aucune opération pour cette zone.',
      },
      {
        failure:
          'A bed that no longer reduces: at a long idle, the model’s hearth falls to {idleHearth}, where no reduction would run, while the bench’s gas stays as rich as at work. The model and the table do not agree there.',
        check: 'The gas: 5.60 MJ/Nm³ on the bench, and the model finds {gasModel}, which is {gasGap} less.',
        care: 'The bed is not looked after: it is remade at each fall of chips. The institute describes no operation for this zone.',
      },
    ),
    tip: l(
      'Mettez le curseur du voyage aux trois quarts : le gaz se refroidit sur l’analyseur, et le monoxyde monte pendant que la température baisse.',
      'Put the journey slider at three quarters: the gas cools on the analyser, and the carbon monoxide rises as the temperature falls.',
    ),
    design: lf(
      'Le refroidissement n’est pas une perte : c’est la chaleur qui devient du combustible. Le bilan du modèle le trouve de lui-même, et la valeur de {reactEnth} vient des pouvoirs calorifiques du rapport. C’est le point de la machine qu’on ne devine pas en la regardant : le lab suit une seule plaquette pour le montrer.',
      'The cooling is not a loss: it is heat becoming fuel. The model’s balance finds it by itself, and the {reactEnth} comes from the report’s heating values. It is the point of the machine one does not guess by looking at it: the lab follows a single chip to show it.',
    ),
  },
  {
    id: 'fuel-baffle',
    scene: 'gasifier',
    category: 'structure',
    name: l('Déflecteur', 'Fuel baffle'),
    short: l(
      'Une pièce qui tient les plaquettes loin de la paroi où les goudrons collent : notre lecture de la figure du rapport.',
      'A part that keeps chips off the wall where tars stick: our reading of the report’s figure.',
    ),
    description: l(
      'Le rapport montre un déflecteur dans la soute, sans texte pour dire à quoi il sert. Notre lecture : la paroi froide est celle où l’eau et les goudrons se condensent, et ces dépôts collent. Des plaquettes laissées contre elle s’y accrocheraient, et la colonne ne descendrait plus droit. Le déflecteur les tiendrait à distance. Des plaquettes, qui s’empilent moins bien qu’un charbon de bois, auraient besoin d’une telle pièce : c’est une raison possible de leur réussite ici, pas un fait du rapport. Aucune dimension de cette pièce n’est dans ce que nous avons lu.',
      'The report shows a baffle in the bunker, with no text saying what it is for. Our reading: the cold wall is the one where water and tars condense, and those deposits stick. Chips left against it would cling there, and the column would no longer go down straight. The baffle would keep them away. Chips, which stack less well than charcoal, would need such a part: it is a possible reason for their success here, not a fact of the report. No dimension of this part is in what we read.',
    ),
    material: l('Tôle d’acier', 'Sheet steel'),
    specs: [
      sp(
        'Rôle',
        'Role',
        l('tenir les plaquettes à distance de la paroi froide', 'keep the chips away from the cold wall'),
      ),
      sp(
        'Source',
        'Source',
        l('la figure du rapport ; aucun texte ne l’explique', 'the report’s figure; no text explains it'),
      ),
      sp('Dimensions', 'Dimensions', l('aucune dans ce que nous avons lu', 'none in what we read')),
    ],
    maintenance: maint(
      {
        failure:
          'Des plaquettes qui s’accrochent à la paroi : aucune source ne le rapporte ici, et la voûte et le canal ne sont pas dans le modèle.',
        check: 'La colonne : si elle descend en bloc, dans la 3D, c’est que le modèle ne sait pas faire autrement.',
        care: 'Aucune opération n’est décrite pour cette pièce.',
      },
      {
        failure:
          'Chips that cling to the wall: no source reports it here, and bridging and channelling are not in the model.',
        check: 'The column: if it goes down as a block in the 3D, it is because the model knows no other way.',
        care: 'No operation is described for this part.',
      },
    ),
    tip: l(
      'Dans « Éclaté », le déflecteur monte avec le haut du gazogène : il se lit contre le manchon.',
      'In “Explode”, the baffle goes up with the top of the gasifier: it reads against the sleeve.',
    ),
    design: l(
      'Voici une pièce que le lab dessine sans pouvoir la citer : sa fonction est une lecture, et elle est dite comme telle. Les autres fiches de ce monde s’appuient sur une ligne du rapport ; celle-ci seulement sur une figure.',
      'Here is a part the lab draws without being able to cite it: its function is a reading, and it is said as such. The other sheets in this world lean on a line of the report; this one only on a figure.',
    ),
  },
  {
    id: 'condensate-sleeve',
    scene: 'gasifier',
    category: 'hydraulic',
    name: l('Manchon de condensation', 'Condensate sleeve'),
    short: l(
      'Eau et goudrons du bois se condensent sur la paroi froide : de 60 à 80 % de l’eau part par là.',
      'The wood’s water and tars condense on the cold wall: 60 to 80% of the water leaves that way.',
    ),
    description: l(
      'Dans la soute, un manchon perforé tient le combustible, et derrière lui il y a un espace, puis la paroi extérieure, froide. La vapeur chassée du bois par la chaleur traverse les perforations, touche la paroi, et s’y condense avec une part des goudrons. Cela coule jusqu’à une gouttière, au pied de l’espace, puis à la purge. C’est ainsi qu’on pouvait tirer de 60 à 80 % de l’eau du bois avant qu’elle atteigne le feu. Ce que cette eau contient, le fût de la ferme le dit.',
      'In the bunker, a perforated sleeve holds the fuel, and behind it there is a space, then the outer wall, cold. The vapour driven out of the wood by the heat crosses the perforations, touches the wall, and condenses there with a share of the tars. It runs down to a gutter at the foot of the space, then to the drain. That is how 60 to 80% of the wood’s water could be drawn off before it reached the fire. What that water contains, the farm’s barrel says.',
    ),
    material: l('Tôle d’acier perforée, paroi extérieure', 'Perforated sheet steel, outer wall'),
    specs: [
      sp('Eau tirée du bois', 'Water drawn from the wood', l('60 à 80 % de son humidité', '60 to 80% of its moisture')),
      sp('Le modèle compte', 'The model counts', v('{drainShare}')),
      sp('Gouttière', 'Gutter', l('au pied de l’espace, vers la purge', 'at the foot of the space, towards the drain')),
      sp(
        'Intervalle de l’institut, chemise',
        'The institute’s interval, jacket',
        l('75 à 135 h, pour 1 à 2 h de travail', '75 to 135 h, for 1 to 2 h of work'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un encrassement de la chemise : les relevés de l’institut comptent un nettoyage toutes les 75 à 135 heures.',
        check:
          'La quantité d’eau tirée : le modèle compte {jacket8} à 8 % d’humidité, et le rapport dit que le bois en cède de 60 à 80 %.',
        care: 'Les relevés de l’institut notent ce nettoyage, 1 à 2 heures chaque fois. La source ne décrit pas le geste, et le lab non plus.',
      },
      {
        failure: 'A fouling of the jacket: the institute’s records count a cleaning every 75 to 135 hours.',
        check:
          'The quantity of water drawn: the model counts {jacket8} at 8% moisture, and the report says the wood gives up 60 to 80%.',
        care: 'The institute’s records note that cleaning, 1 to 2 hours each time. The source does not describe the gesture, and neither does the lab.',
      },
    ),
    tip: l(
      'Activez « Flux » : des points de vapeur traversent les perforations, vont à la paroi, et redescendent vers la purge.',
      'Switch on “Flows”: dots of vapour cross the perforations, go to the wall, and run back down towards the drain.',
    ),
    design: l(
      'C’est une astuce de bon sens : au lieu de laisser l’eau du bois descendre dans le feu et le refroidir, on la fait se condenser ailleurs. On en tire un gaz moins mouillé, et un liquide noir dont le rapport ne dit pas ce qu’il devenait.',
      'It is a trick of good sense: instead of letting the wood’s water go down into the fire and cool it, it is made to condense elsewhere. From it comes a less wet gas, and a black liquid whose fate the report does not tell.',
    ),
  },
  {
    id: 'condensate-drain',
    scene: 'gasifier',
    category: 'hydraulic',
    name: l('Purge', 'Condensate drain'),
    short: l(
      'La sortie de l’eau noire de la chemise vers un bac : sans elle, cette eau mouille le lit de charbon après l’arrêt.',
      'The outlet of the jacket’s black water to a vessel: without it, that water wets the charcoal bed after a stop.',
    ),
    description: lf(
      'Au pied de la chemise, une gouttière recueille ce qui s’y est condensé et le mène à une purge, puis à un bac. Le rapport écrit que, sans bac, cette eau reviendrait mouiller le lit de charbon après un arrêt. Combien ? Le modèle compte {jacket8} à 8 % d’humidité et {jacket20} à 20 % ; à la main, au même régime, {jacketHand8} et {jacketHand20}, une arithmétique sur le débit de plaquettes. La taille du bac, aucune source ne la donne. La 3D en dessine un, avec un niveau qui suit le modèle : sa taille est une estimation.',
      'At the foot of the jacket, a gutter collects what has condensed there and leads it to a drain, then to a vessel. The report writes that, with no vessel, that water would come back and wet the charcoal bed after a stop. How much? The model counts {jacket8} at 8% moisture and {jacket20} at 20%; by hand, at the same rate, {jacketHand8} and {jacketHand20}, arithmetic on the chip flow. The vessel’s size, no source gives. The 3D draws one, with a level that follows the model: its size is an estimate.',
    ),
    material: l('Tube d’acier, bocal de recueil', 'Steel tube, collecting jar'),
    specs: [
      sp(
        'Eau de la chemise, modèle',
        'Jacket water, model',
        lf('{jacket8} à 8 % · {jacket20} à 20 %', '{jacket8} at 8% · {jacket20} at 20%'),
      ),
      sp(
        'Eau de la chemise, à la main',
        'Jacket water, by hand',
        lf('{jacketHand8} à 8 % · {jacketHand20} à 20 %', '{jacketHand8} at 8% · {jacketHand20} at 20%'),
      ),
      sp('Intervalle de l’institut', 'The institute’s interval', l('8 à 10 h', '8 to 10 h')),
      sp('Taille du bac', 'Vessel size', l('inconnue', 'unknown')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bac qui déborde : de l’eau noire revient vers le lit après un arrêt. La seule panne grave de ce tracteur est venue, probablement, de l’autre bac, celui du refroidisseur.',
        check: 'Le niveau du bocal, dans la 3D : il suit les litres que compte le modèle.',
        care: 'Les relevés de l’institut notent la vidange de la chemise toutes les 8 à 10 heures. Ce n’est pas un geste décrit, et le lab ne dit pas où va le liquide.',
      },
      {
        failure:
          'A vessel that overflows: black water comes back to the bed after a stop. This tractor’s one serious failure probably came from the other vessel, the cooler’s.',
        check: 'The jar’s level, in the 3D: it follows the litres the model counts.',
        care: 'The institute’s records note the jacket’s emptying every 8 to 10 hours. It is not a gesture described, and the lab does not say where the liquid goes.',
      },
    ),
    tip: l(
      'Le bocal sous la purge se remplit dans la 3D, au rythme du modèle : mettez l’humidité à 30 %, et il monte plus vite.',
      'The jar under the drain fills in the 3D, at the model’s pace: put the moisture at 30%, and it rises faster.',
    ),
    design: l(
      'Une pièce toute petite, qui montre que l’eau du bois doit aller quelque part. Où va le contenu du bocal, le lab ne le dit pas.',
      'A very small part, showing that the wood’s water has to go somewhere. Where the jar’s contents go, the lab does not say.',
    ),
  },
  {
    id: 'eccentric-lock',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Verrou à came', 'Eccentric lock'),
    short: l(
      'Il tient le corps du haut contre celui du bas : un joint de plus, et un endroit où l’air peut entrer.',
      'It holds the upper casing against the lower one: one more joint, and one more place air can get in.',
    ),
    description: l(
      'Le gazogène est fait de deux corps : le haut garde le combustible, le bas garde le feu. Une bande les tient ensemble, et un verrou à came serre cette bande. Le rapport le montre sur sa figure, et aucun texte ne l’explique : notre lecture est qu’il permet de séparer les deux corps pour atteindre le bas. Sous aspiration, chaque joint est un endroit où l’air peut entrer. De l’air entré près de la grille brûle le gaz fini, qui devient plus chaud et plus faible : la direction est rapportée, la taille d’une telle fuite ne l’est pas.',
      'The gasifier is made of two casings: the upper one keeps the fuel, the lower one keeps the fire. A band holds them together, and an eccentric lock tightens the band. The report shows it in its figure, and no text explains it: our reading is that it lets the two casings be parted to reach the lower one. Under suction, every joint is a place where air can get in. Air that gets in near the grate burns the finished gas, which becomes hotter and weaker: the direction is reported, the size of such a leak is not.',
    ),
    material: l('Bande d’acier, verrou à came', 'Steel band, eccentric lock'),
    specs: [
      sp(
        'Rôle',
        'Role',
        l('il serre la bande entre le haut et le bas', 'it tightens the band between upper and lower'),
      ),
      sp('Source', 'Source', l('la figure du rapport ; notre lecture', 'the report’s figure; our reading')),
      sp(
        'Effet d’une fuite près de la grille',
        'Effect of a leak near the grate',
        lf('gaz de {gasModel} à {leakGasMJ}', 'gas from {gasModel} to {leakGasMJ}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un joint qui fuit : de l’air entre, et le modèle, avec {leakShare} du volume de gaz, brûle le monoxyde et l’hydrogène, la sortie passe de {outletModel} à {leakOutT}, et la toile du filtre dépasse ses 300 °C.',
        check:
          'La température de sortie : la direction est celle du rapport, la taille de la fuite est une supposition.',
        care: 'Des joints étaient refaits vers 500 heures, selon les relevés de l’institut : la source ne dit pas lesquels, et le lab ne décrit aucun geste.',
      },
      {
        failure:
          'A joint that leaks: air gets in, and the model, with {leakShare} of the gas volume, burns the carbon monoxide and the hydrogen, the outlet goes from {outletModel} to {leakOutT}, and the filter cloth passes its 300 °C.',
        check: 'The outlet temperature: the direction is the report’s, the size of the leak is a guess.',
        care: 'Gaskets were redone at about 500 hours, by the institute’s records: the source does not say which, and the lab describes no gesture.',
      },
    ),
    tip: lf(
      'Lancez « De l’air sous la grille » : le gaz tombe de {gasModel} à {leakGasMJ}, et la sortie monte à {leakOutT}.',
      'Run “Air under the grate”: the gas falls from {gasModel} to {leakGasMJ}, and the outlet climbs to {leakOutT}.',
    ),
    design: l(
      'Un verrou est là pour qu’on puisse ouvrir : c’est aussi, par nature, un joint de plus. Le lab ne décrit pas son usage : seulement ce qu’il laisse passer quand il est mal serré.',
      'A lock is there so that the machine can be opened: it is also, by nature, one more joint. The lab does not describe its use: only what it lets through when badly tightened.',
    ),
  },
  {
    id: 'outer-casing',
    scene: 'gasifier',
    category: 'structure',
    name: l('Enveloppe', 'Outer casing'),
    short: l(
      'La tôle chaude du gazogène : elle rouille en 2 000 à 4 000 heures, et brûle qui la touche.',
      'The gasifier’s hot sheet: it corrodes in 2,000 to 4,000 hours, and burns whoever touches it.',
    ),
    description: lf(
      'L’enveloppe est la tôle du corps du bas, autour du foyer. Elle est chaude : une source américaine la compare à un pot catalytique et prévient de l’herbe sèche. Dans le modèle, elle est à {casingModel} à pleine charge. Elle rouille, de 2 000 à 4 000 heures, d’après le rapport : c’est la partie la plus durable. Le modèle compte, d’après sa surface, environ {casingSurfKw} perdus à pleine charge, et la condition du calcul du rapport, 15 % de l’énergie, en donne {casingCalcKw} : les deux ne se recoupent pas, et aucun n’est mesuré. Le reste serait la chemise, le goudron et la suie.',
      'The casing is the sheet of the lower body, around the hearth. It is hot: an American source compares it to a catalytic converter and warns of dry grass. In the model it is at {casingModel} at full load. It corrodes, in 2,000 to 4,000 hours, by the report: it is the longest-lived part. The model counts, from its surface, about {casingSurfKw} lost at full load, and the condition of the report’s own calculation, 15% of the energy, gives {casingCalcKw}: the two do not agree, and neither is measured. The rest would be the jacket, tar and soot.',
    ),
    material: l('Tôle d’acier, rouille et goudron', 'Sheet steel, rust and tar'),
    specs: [
      sp('Vie, corrosion', 'Life, corrosion', l('2 000 à 4 000 h', '2,000 to 4,000 h')),
      sp('Température, modèle', 'Temperature, model', v('{casingModel}')),
      sp('Perdu par la surface, modèle', 'Lost from the surface, model', v('{casingSurfKw}')),
      sp('Condition du calcul du rapport', 'Condition of the report’s calculation', v('{casingCalcKw}')),
    ],
    maintenance: maint(
      {
        failure: 'La corrosion, de 2 000 à 4 000 heures : c’est la plus lente des pannes du gazogène.',
        check:
          'Une brûlure, à qui touche : la tôle est comme un pot catalytique. Une herbe sèche dessous peut prendre feu.',
        care: 'Aucune opération n’est décrite pour l’enveloppe. Son poids sur le tracteur est une partie des 450 kg du système.',
      },
      {
        failure: 'Corrosion, at 2,000 to 4,000 hours: it is the slowest of the gasifier’s failures.',
        check:
          'A burn, for whoever touches it: the sheet is like a catalytic converter. Dry grass under it can catch fire.',
        care: 'No operation is described for the casing. Its weight on the tractor is part of the system’s 450 kg.',
      },
    ),
    tip: l(
      'Activez « Transparence » : le corps du haut s’efface, et l’on voit le feu briller dans la tôle du bas, à travers la fausse couleur.',
      'Switch on “X-ray”: the upper casing fades, and the fire can be seen glowing inside the lower sheet, through the false colour.',
    ),
    design: l(
      'Le lab laisse visibles les deux comptes, qui ne se recoupent pas, au lieu de choisir celui qui arrange. Une mesure de la perte de la tôle, sur la machine, changerait plus de chiffres du modèle qu’aucune autre : c’est celle qui manque le plus.',
      'The lab leaves both counts in view, which do not agree, instead of choosing the one that suits. A measurement of the sheet’s loss, on the machine, would change more figures of the model than any other: it is the one that is missing most.',
    ),
  },
  {
    id: 'air-intake',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Prise d’air', 'Air intake'),
    short: l(
      'Par ici entre l’air du feu, aspiré par le moteur : et par ici est sorti du gaz blanc ou jaune, après un arrêt.',
      'Here the fire’s air comes in, drawn by the engine: and here white or yellow gas came out, after a stop.',
    ),
    description: l(
      'L’air qui nourrit le feu entre par cette prise, sur le côté du gazogène, et suit le plénum jusqu’aux tuyères. Ce qui l’y tire est le moteur : toute la ligne est en dépression. Quand le moteur s’arrête, l’aspiration cesse, le gaz continue de se former, et le sens s’inverse. Le livre suédois a vu, après un arrêt, du gaz blanc ou jaune sortir de la prise d’air des gazogènes à bois, et que le gaz d’un gazogène à charbon de bois ne se voyait pas. La pression après un arrêt, aucune source ne la donne : le modèle dit dans quel sens, jamais combien.',
      'The air that feeds the fire comes in through this intake, on the side of the gasifier, and follows the plenum to the nozzles. What draws it in is the engine: the whole line is under suction. When the engine stops, suction ends, the gas goes on forming, and the direction reverses. The Swedish book saw white or yellow gas come out of the air intake of wood gasifiers after a stop, and that the gas of a charcoal gasifier could not be seen. The pressure after a stop, no source gives: the model says which way, never how much.',
    ),
    material: l('Tube d’acier, plénum d’air', 'Steel tube, air plenum'),
    specs: [
      sp(
        'Sens en marche',
        'Direction when running',
        l('de l’air vers le feu, sous aspiration', 'air towards the fire, under suction'),
      ),
      sp('Sens après l’arrêt', 'Direction after a stop', l('du gaz vers l’extérieur', 'gas towards the outside')),
      sp('Couleur du gaz du bois', 'Colour of wood gas', l('blanc ou jaune', 'white or yellow')),
      sp('Pression après l’arrêt', 'Pressure after a stop', l('aucune source', 'no source')),
    ],
    maintenance: maint(
      {
        failure: 'Du gaz qui sort après un arrêt, même d’un appareil étanche : le livre suédois le dit.',
        check:
          'Le gaz du charbon de bois ne se voyait pas, celui du bois était blanc ou jaune : mais l’œil ne juge pas le monoxyde.',
        care: 'Aucune opération n’est décrite pour cette prise.',
      },
      {
        failure: 'Gas coming out after a stop, even from a tight apparatus: the Swedish book says so.',
        check:
          'Charcoal gas could not be seen, wood gas was white or yellow: but the eye does not judge carbon monoxide.',
        care: 'No operation is described for this intake.',
      },
    ),
    tip: l(
      'Dans « Garage », après l’arrêt, c’est ici que le panache sort : suivez-le jusqu’au plafond.',
      'In “Garage”, after the stop, this is where the plume comes out: follow it up to the ceiling.',
    ),
    design: l(
      'Une même ouverture entre l’air en marche et laisse sortir le gaz à l’arrêt : voilà toute l’affaire du garage. Le sens suit la dépression, et celle-ci suit le moteur.',
      'One and the same opening lets air in when running and lets gas out when stopped: that is the whole business of the garage. The direction follows the suction, and the suction follows the engine.',
    ),
  },
  {
    id: 'air-nozzles',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Tuyères', 'Air nozzles'),
    short: l(
      'Des tuyères en anneau amènent l’air dans le feu : sans elles, pas de flamme, et trop d’air brûlerait tout le bois.',
      'A ring of nozzles lets air into the fire: without them, no flame, and too much air would burn all the wood.',
    ),
    description: lf(
      'L’air du feu entre par les tuyères. Elles forment un anneau autour du foyer, nourri par un plénum, et chacune souffle vers le centre. Ce n’est pas la pression qui pousse cet air : c’est le moteur qui l’aspire. Un bilan d’azote, fait à la main, en trouve {airPerKg} par kilo de bois. Avec trop d’air, le bois brûlerait en entier et ne laisserait plus de gaz ; sans air, plus de flamme. Dans la 3D, les langues de feu des tuyères sont allumées tant que le moteur tire, et leur taille suit le débit du modèle.',
      'The fire’s air enters through the nozzles. They form a ring round the hearth, fed by a plenum, and each blows towards the centre. It is not pressure that pushes that air: it is the engine that sucks it. A nitrogen balance, done by hand, finds {airPerKg} per kilo of wood. With too much air, the wood would burn whole and leave no gas; with none, no flame. In the 3D, the nozzles’ tongues of fire are lit as long as the engine draws, and their size follows the model’s flow.',
    ),
    material: l('Tuyères d’acier, plénum', 'Steel nozzles, plenum'),
    specs: [
      sp('Air par kilo de bois, à la main', 'Air per kilo of wood, by hand', v('{airPerKg}')),
      sp('Rapport d’équivalence, modèle', 'Equivalence ratio, model', v('{er}')),
      sp('Rapport d’équivalence, manuel', 'Equivalence ratio, handbook', 'environ 0,25'),
      sp('Durée de vie', 'Life', l('non rapportée', 'not reported')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune durée de vie n’est rapportée pour les tuyères, au contraire du foyer et de l’anneau de gorge.',
        check:
          'Une fuite d’air plus bas, sous la grille, a l’effet contraire : le gaz brûle, plus chaud et plus faible, sa sortie passe de {outletModel} à {leakOutT}.',
        care: 'Aucune opération n’est décrite pour les tuyères.',
      },
      {
        failure: 'No life is reported for the nozzles, unlike the firebox and the throat ring.',
        check:
          'An air leak lower down, under the grate, has the opposite effect: the gas burns, hotter and weaker, its outlet going from {outletModel} to {leakOutT}.',
        care: 'No operation is described for the nozzles.',
      },
    ),
    tip: l(
      'Activez « Flux » : l’air, en bleu pâle, entre par la prise, fait le tour du plénum, et se répartit entre toutes les tuyères.',
      'Switch on “Flows”: the air, in pale blue, comes in at the intake, goes round the plenum, and divides between all the nozzles.',
    ),
    design: l(
      'Les tuyères sont à l’échelle dans la 3D, parce qu’un modèle faux ne répondrait à rien. Ce qu’elles ont d’intéressant tient en un mot : elles ne soufflent pas, elles laissent entrer.',
      'The nozzles are to scale in the 3D, because a false model would answer nothing. What is interesting about them fits in one word: they do not blow, they let in.',
    ),
  },
  {
    id: 'fire-box',
    scene: 'gasifier',
    category: 'structure',
    name: l('Foyer', 'Fire box'),
    short: l(
      'Le pot qui contient le feu : la pièce la plus éprouvée, qui se fissure entre 600 et 1 000 heures.',
      'The pot that holds the fire: the hardest-worked part, which cracks between 600 and 1,000 hours.',
    ),
    description: l(
      'Le foyer est le pot où se tient le feu, au milieu du corps du bas. L’air passe entre lui et l’enveloppe, puis entre dans le feu par les tuyères, et, dans le dessin du lab, un capot joint son bord à la paroi. Selon l’expérience cumulée de plusieurs véhicules du programme, il se fissure entre 600 et 1 000 heures : avec la grille et l’anneau de gorge, il compte parmi les pièces qui s’usent le plus vite. Sa matière n’est pas dite dans ce que nous avons lu : le lab le dessine en acier, une estimation.',
      'The fire box is the pot where the fire stands, in the middle of the lower body. Air passes between it and the casing, then enters the fire through the nozzles, and, in the lab’s drawing, a hood joins its rim to the wall. By the accumulated experience of several of the programme’s vehicles, it cracks between 600 and 1,000 hours: with the grate and the throat ring, it is among the parts that wear fastest. Its material is not given in what we read: the lab draws it in steel, an estimate.',
    ),
    material: l('Acier, matière non dite (estimation)', 'Steel, material not given (estimate)'),
    specs: [
      sp('Vie, avant fissures', 'Life, before cracks', l('600 à 1 000 h', '600 to 1,000 h')),
      sp('Matière', 'Material', l('non dite ; acier dessiné', 'not given; steel as drawn')),
      sp('Température de la flamme, modèle', 'Flame temperature, model', v('{oxModel}')),
    ],
    maintenance: maint(
      {
        failure: 'Des fissures, de 600 à 1 000 heures. Le rapport ne dit pas comment on s’en apercevait.',
        check:
          'Le rapport ne dit pas comment une fissure se voyait. Dans le modèle, la seule panne de ce genre est de l’air entré sous la grille : le gaz brûle, plus chaud et plus faible.',
        care: 'Aucune opération n’est décrite pour le foyer.',
      },
      {
        failure: 'Cracks, at 600 to 1,000 hours. The report does not say how they were noticed.',
        check:
          'The report does not say how a crack was noticed. In the model, the only failure of that kind is air getting in under the grate: the gas burns, hotter and weaker.',
        care: 'No operation is described for the fire box.',
      },
    ),
    tip: l(
      'Dans « Éclaté », le foyer et l’enveloppe restent en place : l’anneau de gorge monte un peu, et tout le reste s’écarte autour d’eux.',
      'In “Explode”, the fire box and the casing stay in place: the throat ring rises a little, and everything else moves away around them.',
    ),
    design: l(
      'Un pot qui fissure, et qu’on remplace : c’est une pièce d’usure, pas d’éternité. Cette honnêteté de l’institut, qui note la vie de chaque pièce, est une des raisons de le croire.',
      'A pot that cracks, and is replaced: a wearing part, not an eternal one. That honesty of the institute, which notes each part’s life, is one of the reasons to believe it.',
    ),
  },
  {
    id: 'throat-ring',
    scene: 'gasifier',
    category: 'structure',
    name: l('Anneau de gorge', 'Throat ring'),
    short: l(
      'L’étranglement par où passe tout le gaz du feu, au point le plus chaud : environ 700 heures de vie.',
      'The narrowing where all the fire’s gas passes, at the hottest point: about 700 hours of life.',
    ),
    description: l(
      'L’anneau de gorge est un pot posé dans le foyer, qui l’étrangle : tout le gaz du feu doit passer par son ouverture. Voici pourquoi on y tient. Les vapeurs et les goudrons descendent avec le bois ; s’ils pouvaient contourner la flamme par les bords, ils sortiraient tels quels. L’étranglement les force à traverser le point le plus chaud. Il tient environ 700 heures, d’après le rapport, puis se remplace. Sa taille est la chose dont un constructeur aurait le plus besoin, et ce lab la dessine à l’échelle, parce qu’un modèle faux ne répondrait à rien, mais ne l’imprime nulle part : voyez les Sources.',
      'The throat ring is a pot set into the fire box, narrowing it: all the fire’s gas must pass through its opening. Here is why one is kept. Vapours and tars go down with the wood; if they could slip past the flame by the edges, they would come out as they are. The narrowing forces them through the hottest point. It lasts about 700 hours, by the report, then is replaced. Its size is the thing a builder would need most, and this lab draws it to scale, because a false model would answer nothing, but prints it nowhere: see the Sources.',
    ),
    material: l('Pot réfractaire ou d’acier, posé dans le foyer', 'A pot, refractory or steel, set in the fire box'),
    specs: [
      sp('Vie', 'Life', l('environ 700 h', 'about 700 h')),
      sp('Rôle', 'Role', l('tout le gaz du feu passe par là', 'all the fire’s gas passes there')),
      sp('Température du gaz, modèle', 'Gas temperature, model', v('{oxModel}')),
    ],
    maintenance: maint(
      {
        failure: 'L’usure, environ 700 heures, à la température la plus haute de la machine.',
        check:
          'Le goudron à la sortie : au banc, 0,13 g/Nm³ à pleine charge et 0,04 à charge partielle. Le rapport ne relie pas ces valeurs à l’usure de l’anneau.',
        care: 'Elle est posée dans le foyer, et se remplace : le rapport donne sa vie, pas le geste.',
      },
      {
        failure: 'Wear, about 700 hours, at the machine’s highest temperature.',
        check:
          'The tar at the outlet: on the bench, 0.13 g/Nm³ at full load and 0.04 at part load. The report does not tie those values to the ring’s wear.',
        care: 'It is set into the fire box, and replaced: the report gives its life, not the gesture.',
      },
    ),
    tip: l(
      'Dans la coupe, la fausse couleur est la plus vive à cette hauteur : c’est la zone la plus chaude du lit, sur une échelle de 20 à 1 400 °C.',
      'In the section, the false colour is brightest at this height: it is the hottest zone of the bed, on a scale from 20 to 1,400 °C.',
    ),
    design: l(
      'Aucune règle ne va, dans ce lab, d’un moteur à une gorge : ni tableau, ni rapport, ni curseur. Ce lab explique ce que fait cette pièce, pas comment la faire.',
      'No rule goes, in this lab, from an engine to a throat: no table, no ratio, no slider. This lab explains what this part does, not how to make it.',
    ),
  },
  {
    id: 'grate',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Grille', 'Grate'),
    short: l(
      'Elle porte le lit de charbon et laisse passer cendre et gaz : elle bouge, car une grille fixe se bouchait en moins d’une heure.',
      'It carries the bed of charcoal and lets ash and gas through: it moves, because a fixed grate clogged in under an hour.',
    ),
    description: l(
      'Sous la zone de réduction, la grille porte le lit de charbon et laisse passer la cendre et le gaz. Elle bouge : d’après le rapport, les plaquettes bouchaient une grille fixe en moins d’une heure. Celle de l’institut bougeait ; le rapport lui donne 400 à 700 heures de vie, d’après l’expérience cumulée de plusieurs véhicules, la plus courte du foyer avec l’anneau de gorge. Dans la 3D, elle se balance avec sa manivelle, tant que le modèle dit qu’on la fait bouger.',
      'Under the reduction zone, the grate carries the bed of charcoal and lets the ash and the gas through. It moves: by the report, chips clogged a fixed grate in under an hour. The institute’s moved; the report gives it 400 to 700 hours of life, from the accumulated experience of several vehicles, the shortest in the hearth with the throat ring. In the 3D it rocks with its crank, as long as the model says it is being moved.',
    ),
    material: l('Barres d’acier', 'Steel bars'),
    specs: [
      sp('Vie', 'Life', l('400 à 700 h', '400 to 700 h')),
      sp('Une grille fixe', 'A fixed grate', l('se bouchait en moins d’une heure', 'clogged in under an hour')),
      sp('Température du lit de réduction, modèle', 'Reduction bed temperature, model', v('{reductionT}')),
    ],
    maintenance: maint(
      {
        failure: 'Le bouchage par les plaquettes, pour une grille qui ne bouge pas : en moins d’une heure.',
        check: 'La perte de pression du gazogène, mesurée : de 0,08 à 0,18 bar selon le calibre des plaquettes.',
        care: 'La grille s’use la première, 400 à 700 heures : le rapport la note, d’après l’expérience cumulée de plusieurs véhicules, avec les autres pièces du foyer.',
      },
      {
        failure: 'Clogging by the chips, for a grate that does not move: in under an hour.',
        check: 'The gasifier’s pressure loss, measured: 0.08 to 0.18 bar by chip grade.',
        care: 'The grate wears first, 400 to 700 hours: the report notes it, from the accumulated experience of several vehicles, with the other parts of the hearth.',
      },
    ),
    tip: l(
      'Dans « Gazogène », la grille et sa manivelle se balancent ensemble : l’axe va de l’une à l’autre, à travers la paroi.',
      'In “Gasifier”, the grate and its crank rock together: the shaft runs from one to the other, through the wall.',
    ),
    design: l(
      'Aucune règle de mouvement n’est donnée ici : ni fréquence, ni amplitude, ni durée. La 3D balance la grille à un rythme qui est celui de l’image. Ce que dit la fiche tient à une phrase de l’institut : une grille fixe ne dure pas.',
      'No rule of movement is given here: no frequency, no amplitude, no duration. The 3D rocks the grate at a rhythm that is the picture’s. What the sheet says fits in a sentence of the institute’s: a fixed grate does not last.',
    ),
  },
  {
    id: 'grate-linkage',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Commande de grille', 'Grate linkage'),
    short: l(
      'Un arbre et une manivelle qui traversent la paroi : la grille se commande de l’extérieur du corps.',
      'A shaft and a crank that go through the wall: the grate is worked from outside the casing.',
    ),
    description: l(
      'La grille est dans le feu, et la manivelle dehors : un arbre traverse la paroi, du côté du gaz, en bas. C’est ce qu’on lit sur la figure du rapport : la grille se commande de l’extérieur, sans ouvrir le corps. Dans la 3D, la manivelle et la grille tournent sur un même axe : une manivelle qui ne tient à rien flotterait. Un passage de paroi est aussi un endroit où l’air peut entrer, en marche, et d’où le gaz peut sortir, à l’arrêt.',
      'The grate is in the fire, and the crank outside: a shaft goes through the wall, on the gas side, low down. That is what can be read from the report’s figure: the grate is worked from outside, without opening the casing. In the 3D, the crank and the grate turn on one axis: a crank that holds to nothing would float. A wall passage is also a place where air can get in, when running, and where gas can get out, when stopped.',
    ),
    material: l('Arbre d’acier, manivelle', 'Steel shaft, crank'),
    specs: [
      sp('Lien', 'Link', l('arbre à travers la paroi, du côté du gaz', 'shaft through the wall, on the gas side')),
      sp('Source', 'Source', l('la figure du rapport', 'the report’s figure')),
      sp('Dans la 3D', 'In the 3D', l('manivelle et grille sur un même axe', 'crank and grate on one axis')),
    ],
    maintenance: maint(
      {
        failure: 'Un passage de paroi qui fuit : à l’aspiration, de l’air entre ; à l’arrêt, du gaz sort.',
        check: 'Aucune mesure n’est rapportée pour ce passage.',
        care: 'Aucune opération n’est décrite, ni aucune fréquence de manœuvre.',
      },
      {
        failure: 'A wall passage that leaks: under suction, air gets in; at a stop, gas gets out.',
        check: 'No measurement is reported for this passage.',
        care: 'No operation is described, and no frequency of movement.',
      },
    ),
    tip: l(
      'Sélectionnez la manivelle : la grille bouge avec elle, et le rythme se lit sans qu’on ait à deviner le lien.',
      'Select the crank: the grate moves with it, and the rhythm can be read without having to guess the link.',
    ),
    design: l(
      'Le lien entre ce qu’on voit dehors et ce qu’on ne voit pas dedans, c’est tout ce que cette pièce fait. Une 3D qui montre une manivelle sans arbre mentirait sur l’essentiel.',
      'The link between what is seen outside and what is not seen inside is all this part does. A 3D that showed a crank with no shaft would lie about the essentials.',
    ),
  },
  {
    id: 'ash-pit',
    scene: 'gasifier',
    category: 'structure',
    name: l('Cendrier', 'Ash pit'),
    short: l(
      'Le creux sous la grille : jusqu’à 3,5 % du combustible y tombe, et environ 5 % de la puissance avec lui.',
      'The hollow under the grate: up to 3.5% of the fuel falls in, and about 5% of the power with it.',
    ),
    description: lf(
      'Sous la grille, un creux reçoit ce qui n’a pas brûlé : de la cendre, et du charbon qui n’a pas fini sa route. Au cendrier, il reste jusqu’à 3,5 % du combustible, et ce résidu vaut environ 5 % de la puissance à plein régime, soit, dans le modèle, {residueKw} d’énergie à pleine charge. Le modèle en compte {ashKgH}. La porte du cendrier est du côté gauche du tracteur, en bas, en demi-lune : c’est un dessin, une estimation. Ce qui reste là est chaud : une source américaine range la cendre chaude parmi les risques d’incendie.',
      'Under the grate, a hollow receives what has not burned: ash, and charcoal that has not finished its journey. In the ash pit there is up to 3.5% of the fuel, and this residue is worth about 5% of the power at full load, which is, in the model, {residueKw} of energy at full load. The model counts {ashKgH}. The ash pit’s door is on the left side of the tractor, low down, in a half-moon: it is a drawing, an estimate. What lies there is hot: an American source lists hot ash among the fire risks.',
    ),
    material: l('Tôle d’acier, porte en demi-lune', 'Sheet steel, half-moon door'),
    specs: [
      sp('Résidu', 'Residue', l('jusqu’à 3,5 % du combustible', 'up to 3.5% of the fuel')),
      sp('Part de la puissance', 'Share of the power', l('environ 5 % à plein régime', 'about 5% at full load')),
      sp('Énergie du résidu, pleine charge, modèle', 'Residue’s energy, full load, model', v('{residueKw}')),
      sp('Rythme de l’institut', 'The institute’s rhythm', l('8 à 15 h, 15 à 30 min', '8 to 15 h, 15 to 30 min')),
    ],
    maintenance: maint(
      {
        failure:
          'Un cendrier qui se remplit : la cendre monte vers la grille, et la 3D en montre la hauteur, qui suit le modèle.',
        check:
          'La chaleur : une cendre qui a l’air morte ne l’est pas toujours, et une source américaine la range parmi les risques d’incendie.',
        care: 'La cendre était sortie toutes les 8 à 15 heures, 15 à 30 minutes de travail : une durée de l’institut, pas un geste décrit.',
      },
      {
        failure:
          'An ash pit that fills: the ash rises towards the grate, and the 3D shows its height, which follows the model.',
        check: 'The heat: ash that looks dead is not always so, and an American source lists it among the fire risks.',
        care: 'The ash was taken out every 8 to 15 hours, 15 to 30 minutes of work: an institute’s duration, not a gesture described.',
      },
    ),
    tip: l(
      'Dans « Gazogène », le tas de cendre monte dans le creux au fil du temps de la simulation, au rythme du modèle.',
      'In “Gasifier”, the heap of ash rises in the hollow as simulated time goes by, at the model’s pace.',
    ),
    design: l(
      'Cinq pour cent de la puissance au fond d’un creux : c’est ce qu’un rendement de 18 % ne montre pas à lui seul. Le lab compte ce résidu parmi les pertes du gazogène, avec la chaleur de la tôle et celle du gaz.',
      'Five percent of the power at the bottom of a hollow: it is what an efficiency of 18% does not show. The lab counts that residue among the gasifier’s losses, with the sheet’s heat and the gas’s.',
    ),
  },
  {
    id: 'gas-outlet',
    scene: 'gasifier',
    category: 'mechanical',
    name: l('Sortie de gaz', 'Gas outlet'),
    short: lf(
      'Là où le gaz quitte le gazogène : encore chaud, vers {outletModel}, au niveau du feu.',
      'Where the gas leaves the gasifier: still hot, about {outletModel}, at the level of the fire.',
    ),
    description: lf(
      'Le gaz quitte l’appareil par le côté, au niveau de la gorge, d’après le rapport. Dans la 3D, il descend à travers la gorge et le lit, passe sous la grille, remonte entre le foyer et l’enveloppe, et sort ici : un gaz à environ {outletModel}, selon le modèle. Cette température est tenue dans la bande du rapport par une estimation : ce n’est pas un résultat. Elle doit rester assez haute pour que le gaz ne se condense pas dans le filtre, et assez basse pour que sa toile ne brûle pas. Le modèle trouve un point de rosée de {dew8} à 8 % d’humidité, {dew40} à 40 %.',
      'The gas leaves the apparatus by the side, at the level of the throat, according to the report. In the 3D it goes down through the throat and the bed, passes under the grate, rises between the fire box and the casing, and leaves here: a gas at about {outletModel}, by the model. That temperature is held in the report’s band by an estimate: it is not a result. It must stay high enough that the gas does not condense in the filter, and low enough that its cloth does not burn. The model finds a dew point of {dew8} at 8% moisture, {dew40} at 40%.',
    ),
    material: l('Bride d’acier, tuyau', 'Steel flange, pipe'),
    specs: [
      sp('Température de sortie, modèle', 'Outlet temperature, model', v('{outletModel}')),
      sp('Limite de la toile du filtre', 'Filter cloth’s limit', l('environ 300 °C', 'about 300 °C')),
      sp(
        'Point de rosée, selon le modèle',
        'Dew point, by the model',
        lf('{dew8} à 8 % · {dew40} à 40 %', '{dew8} at 8% · {dew40} at 40%'),
      ),
      sp(
        'Point de rosée, rapport, bois à 20–35 % d’humidité',
        'Dew point, report, wood at 20–35% moisture',
        l('45 à 60 °C', '45 to 60 °C'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un gaz trop chaud, au-delà de 300 °C : la toile du filtre ne tient plus. Le modèle y arrive avec de l’air sous la grille.',
        check:
          'Le point de rosée : le rapport donne de 45 à 60 °C à 20–35 % d’humidité, et le modèle, sans drain, {dewNoDrain}. Avec le drain, {dewDrain} : les deux ne se recoupent pas.',
        care: 'Aucune opération n’est décrite pour la sortie.',
      },
      {
        failure:
          'A gas too hot, past 300 °C: the filter cloth no longer takes it. The model gets there with air under the grate.',
        check:
          'The dew point: the report gives 45 to 60 °C at 20–35% moisture, and the model, with no drain, {dewNoDrain}. With the drain, {dewDrain}: the two do not agree.',
        care: 'No operation is described for the outlet.',
      },
    ),
    tip: l(
      'Activez « Flux » : le gaz descend dans le lit, passe sous la grille, remonte le long de la tôle, et sort par ici.',
      'Switch on “Flows”: the gas goes down in the bed, passes under the grate, rises along the sheet, and leaves here.',
    ),
    design: l(
      'La température de sortie est un réglage du modèle plus qu’un résultat, et le lab le dit à côté du chiffre. C’est la seule température de la machine dont une source donne la bande, et la bande décide du filtre.',
      'The outlet temperature is more a setting of the model than a result, and the lab says so beside the figure. It is the only temperature of the machine whose band a source gives, and the band decides the filter.',
    ),
  },
];
