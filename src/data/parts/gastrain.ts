// Parts of the `gas-train` world (17): where the energy goes, laid out flat in the order the gas flows (the institute's schematic of the tractor). Every size of a pipe, a valve, the fan, the mixer and the filter's box is unknown (research §3) and drawn as an estimate; what the sources give
// are areas, temperatures, drops of pressure and lives. The starting fan and the stop valve are parts of a procedure the lab does not give: they say what they are, what they release, and nothing of how they were used (research §A.2, R3). The engine's settings are not given (R4).
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const GAS_TRAIN_PARTS: PartInfo[] = [
  {
    id: 'hot-gas-pipe',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Conduite de gaz chaud', 'Hot gas pipe'),
    short: l(
      'Le tuyau qui mène le gaz du gazogène au filtre : il doit rester au-dessus du point de rosée.',
      'The pipe that leads the gas from the gasifier to the filter: it must stay above the dew point.',
    ),
    description: lf(
      'Le gaz sort du gazogène vers {outletModel} et entre dans ce tuyau : une courte sortie, une montée jusqu’au té où part la cheminée du ventilateur, puis la vanne d’arrêt, et le filtre. Il doit rester au-dessus de son point de rosée. En dessous, l’eau et les goudrons s’y condensent, la toile du filtre se mouille, et sa résistance est multipliée par plus de six. Aucune dimension de ce tuyau n’est dans ce que nous avons lu. Le modèle le remplace par un seul tuyau équivalent, de {pipeD} de diamètre et de {pipeL} de long, qui perd environ {pipeMbar} de pression : trois estimations, pas des cotes.',
      'The gas leaves the gasifier at about {outletModel} and enters this pipe: a short leg, a rise to the tee where the fan’s stack leaves, then the stop valve, and the filter. It must stay above its dew point. Below it, water and tars condense there, the filter’s cloth gets wet, and its resistance rises more than sixfold. No dimension of this pipe is in what we read. The model replaces it by a single equivalent pipe, {pipeD} across and {pipeL} long, that loses about {pipeMbar} of pressure: three estimates, not dimensions.',
    ),
    material: l('Tuyau d’acier, brides', 'Steel pipe, flanges'),
    specs: [
      sp('Température d’entrée, modèle', 'Inlet temperature, model', v('{outletModel}')),
      sp(
        'Point de rosée, rapport, bois à 20–35 % d’humidité',
        'Dew point, report, wood at 20–35% moisture',
        l('45 à 60 °C', '45 to 60 °C'),
      ),
      sp('Dimensions réelles', 'Real dimensions', l('inconnues', 'unknown')),
      sp('Tuyau équivalent du modèle', 'The model’s equivalent pipe', lf('{pipeD} × {pipeL}', '{pipeD} × {pipeL}')),
      sp('Perte du modèle', 'The model’s loss', v('{pipeMbar}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un gaz qui passe sous son point de rosée : la toile du filtre se mouille, et la perte de charge fait plus de six fois ce qu’elle faisait.',
        check: 'Le point de rosée est de 45 à 60 °C pour un bois de 20 à 35 % d’humidité, selon le rapport.',
        care: 'Aucune opération n’est décrite pour ce tuyau. Le modèle lui compte une perte à l’air de {pipeLossWK}, une estimation.',
      },
      {
        failure:
          'A gas that falls below its dew point: the filter’s cloth gets wet, and the pressure drop is more than six times what it was.',
        check: 'The dew point is 45 to 60 °C for wood at 20 to 35% moisture, by the report.',
        care: 'No operation is described for this pipe. The model counts a loss to the air of {pipeLossWK} for it, an estimate.',
      },
    ),
    tip: l(
      'Activez « Flux » : les points prennent la couleur de la température du gaz, de 20 à 400 °C, et la perdent à mesure qu’il avance.',
      'Switch on “Flows”: the dots take the colour of the gas’s temperature, from 20 to 400 °C, and lose it as it goes.',
    ),
    design: l(
      'Le tuyau est chaud pour une raison de physique, pas de confort : le même gaz, froid trop tôt, mouille le filtre. À l’autre bout de la ligne il faudra au contraire qu’il soit froid. Tout le trajet est un compromis entre les deux.',
      'The pipe is hot for a reason of physics, not comfort: the same gas, cooled too soon, wets the filter. At the other end of the line it will on the contrary need to be cold. The whole route is a compromise between the two.',
    ),
  },
  {
    id: 'stop-valve',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Vanne d’arrêt', 'Stop valve'),
    short: l(
      'Une vanne entre le gazogène et le filtre, sur le schéma du rapport : le lab n’en décrit aucun usage.',
      'A valve between the gasifier and the filter, on the report’s schematic: the lab describes no use of it.',
    ),
    description: l(
      'Le schéma du rapport place une vanne d’arrêt sur le tuyau chaud, entre le té de la cheminée du ventilateur et le filtre. Ce à quoi elle servait, et comment, n’est pas dit dans ce que nous avons lu, et ce lab ne le décrit pas : ce serait une consigne d’arrêt. Notre lecture, seulement : une vanne sur le trajet du gaz ne change rien à ce qui se forme dans l’appareil. Après l’arrêt du moteur, c’est le lit chaud qui continue, et le gaz sort par où il peut. Le lab dessine la vanne à sa place, d’après le schéma, et sa taille est une estimation.',
      'The report’s schematic puts a stop valve on the hot pipe, between the tee of the fan’s stack and the filter. What it was for, and how, is not said in what we read, and this lab does not describe it: it would be an instruction for stopping. Our reading, only: a valve on the gas’s route changes nothing about what forms in the apparatus. After the engine stops, it is the hot bed that carries on, and the gas comes out wherever it can. The lab draws the valve in its place, from the schematic, and its size is an estimate.',
    ),
    material: l('Vanne à brides, acier', 'Flanged valve, steel'),
    specs: [
      sp('Place', 'Place', l('entre le té du ventilateur et le filtre', 'between the fan’s tee and the filter')),
      sp('Source', 'Source', l('le schéma du rapport', 'the report’s schematic')),
      sp('Usage', 'Use', l('non dit, non décrit', 'not said, not described')),
      sp('Taille', 'Size', l('inconnue, estimée pour le dessin', 'unknown, estimated for the drawing')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de vanne n’est rapportée.',
        check:
          'Le sens du gaz après l’arrêt : le modèle dit seulement s’il pousse ou s’il aspire, jamais avec quelle pression.',
        care: 'Aucune opération n’est décrite, et aucune consigne n’est donnée pour cette vanne.',
      },
      {
        failure: 'No valve failure is reported.',
        check:
          'The direction of the gas after the stop: the model says only whether it pushes or sucks, never at what pressure.',
        care: 'No operation is described, and no instruction is given for this valve.',
      },
    ),
    tip: l(
      'Dans « Éclaté », la ligne s’écarte autour de son milieu, et les tuyaux s’étirent entre leurs ports : la vanne se lit entre le té et le filtre.',
      'In “Explode”, the line spreads about its middle, and the pipes stretch between their ports: the valve reads between the tee and the filter.',
    ),
    design: l(
      'Une vanne sur un tuyau de gaz donne une impression de maîtrise. Ce lab garde la vanne dans le dessin, et le geste hors du lab.',
      'A valve on a gas pipe gives an impression of control. This lab keeps the valve in the drawing, and the gesture out of the lab.',
    ),
  },
  {
    id: 'starting-fan',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Ventilateur de démarrage', 'Starting fan'),
    short: l(
      'Un ventilateur qui aspire de l’air à travers l’appareil quand le moteur ne tire pas encore : il rejette 200 L de monoxyde à la minute.',
      'A fan that draws air through the apparatus when the engine is not yet drawing: it releases 200 L of carbon monoxide a minute.',
    ),
    description: lf(
      'Quand le moteur ne tire pas encore, un ventilateur le remplace : il aspire de l’air à travers l’appareil, et rejette son gaz par une cheminée. Ce gaz est celui du gazogène : le livre suédois compte environ 200 L de monoxyde de carbone à la minute, et juge cela dangereux même dans un garage de 1 000 m³ ; par arithmétique, c’est {fanPpm} de plus dans 1 000 m³ d’air parfaitement mélangé. À Stockholm, les grands nuages de fumée du ventilateur étaient un problème. Le lab ne dit ni quand, ni comment, ni combien de temps il tournait : le modèle le prend comme une source de gaz, jamais comme un geste.',
      'When the engine is not yet drawing, a fan takes its place: it draws air through the apparatus and throws out its gas through a stack. That gas is the gasifier’s: the Swedish book counts about 200 L of carbon monoxide a minute, and judges that dangerous even in a 1,000 m³ garage; by arithmetic, that is {fanPpm} more in 1,000 m³ of perfectly mixed air. In Stockholm, the fan’s great clouds of smoke were a problem. The lab says neither when, nor how, nor for how long it ran: the model takes it as a source of gas, never as a gesture.',
    ),
    material: l('Ventilateur centrifuge, volute d’acier', 'Centrifugal fan, steel scroll'),
    specs: [
      sp('Monoxyde de carbone rejeté', 'Carbon monoxide released', '200 L/min'),
      sp('Dans 1 000 m³, par arithmétique', 'In 1,000 m³, by arithmetic', v('{fanPpm}')),
      sp('Description d’un usage', 'Description of a use', l('aucune', 'none')),
      sp('Dans le modèle', 'In the model', l('une source de gaz, pas un geste', 'a source of gas, not a gesture')),
    ],
    maintenance: maint(
      {
        failure:
          'Un nuage de fumée : à Stockholm, ceux du ventilateur ont posé problème. Ce n’était pas que de la fumée : c’était le gaz du gazogène.',
        check: 'Le monoxyde de carbone ne se voit pas : un nuage de fumée n’en mesure pas la part.',
        care: 'Aucune opération n’est décrite pour ce ventilateur, et aucune durée de marche.',
      },
      {
        failure:
          'A cloud of smoke: in Stockholm, the fan’s clouds were a problem. It was not only smoke: it was the gasifier’s gas.',
        check: 'Carbon monoxide cannot be seen: a cloud of smoke does not measure its share.',
        care: 'No operation is described for this fan, and no running time.',
      },
    ),
    tip: l(
      'Dans « Garage », quand le modèle prend le ventilateur comme source, sa roue tourne dans la 3D, sous un disque flou, et les ppm montent.',
      'In “Garage”, when the model takes the fan as a source, its impeller turns in the 3D, under a blur disc, and the ppm rise.',
    ),
    design: l(
      'Le ventilateur est la preuve qu’un gazogène a besoin d’une étape avant d’être un gazogène, et que cette étape fait du monoxyde. Le lab en garde la trace, pas la marche à suivre.',
      'The fan is the proof that a gasifier needs a stage before it is a gasifier, and that this stage makes carbon monoxide. The lab keeps the trace of it, not the way to go about it.',
    ),
  },
  {
    id: 'fan-stack',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Cheminée du ventilateur', 'Fan stack'),
    short: l(
      'Elle emmène le gaz du ventilateur vers le haut : elle déplace le nuage, pas le danger.',
      'It carries the fan’s gas upwards: it moves the cloud, not the hazard.',
    ),
    description: lf(
      'La cheminée part du té du tuyau chaud et monte à environ {stackTop} du sol dans le dessin du lab, un peu au-dessus du sommet du gazogène. Elle emmène vers le haut le gaz que le ventilateur rejette. Une cheminée ne change pas la nature de ce gaz : environ un cinquième est du monoxyde de carbone. Ce lab ne dit d’aucun arrangement, cheminée comprise, qu’il rend la machine acceptable.',
      'The stack leaves from the tee of the hot pipe and rises to about {stackTop} above the ground in the lab’s drawing, a little above the top of the gasifier. It carries upwards the gas the fan throws out. A stack does not change the nature of that gas: about a fifth of it is carbon monoxide. This lab says of no arrangement, a stack included, that it makes the machine acceptable.',
    ),
    material: l('Tube d’acier', 'Steel tube'),
    specs: [
      sp('Hauteur dessinée', 'Height as drawn', v('{stackTop}')),
      sp('Part de monoxyde du gaz', 'Share of carbon monoxide in the gas', l('environ un cinquième', 'about a fifth')),
      sp('Source', 'Source', l('le schéma du rapport ; hauteur estimée', 'the report’s schematic; height estimated')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de cheminée n’est rapportée.',
        check:
          'Le gaz qui monte par la cheminée reste du monoxyde pour un cinquième : aucun instrument de la source ne mesure ce que devient le nuage plus haut.',
        care: 'Aucune opération n’est décrite.',
      },
      {
        failure: 'No stack failure is reported.',
        check:
          'The gas rising through the stack remains a fifth carbon monoxide: no instrument in the source measures what becomes of the cloud higher up.',
        care: 'No operation is described.',
      },
    ),
    tip: l(
      'Dans « Ligne de gaz », sélectionnez la cheminée : la caméra la cadre par le côté, avec le té d’où elle part.',
      'In “Gas line”, select the stack: the camera frames it from the side, with the tee it leaves from.',
    ),
    design: l(
      'Faire monter un gaz ne le rend pas plus léger de ce qu’il porte. Le lab dessine la cheminée pour dire où le gaz va, et pour dire qu’aller en haut n’est pas une réponse.',
      'Making a gas rise does not make it lighter of what it carries. The lab draws the stack to say where the gas goes, and to say that going up is not an answer.',
    ),
  },
  {
    id: 'primary-air-valve',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Vanne d’air primaire', 'Primary-air valve'),
    short: l(
      'Sur la prise d’air du gazogène : l’air entre par là, et, à l’arrêt, le gaz sort par là.',
      'On the gasifier’s air intake: air comes in there, and, at a stop, gas comes out there.',
    ),
    description: l(
      'L’air primaire, celui qui nourrit le feu, passe par cette vanne avant d’entrer dans le gazogène. Dans la 3D, le chemin va de l’œil du ventilateur à la vanne, puis à la prise d’air : c’est l’arrangement du schéma du rapport, que le lab suit. En marche, le moteur aspire cet air : tout le système est en dépression. À l’arrêt, rien ne l’aspire plus, et la même ouverture devient la sortie du gaz. Le lab ne donne ni position, ni réglage de cette vanne, ni sa taille : le rapport n’en publie pas, et ce serait un réglage de plus.',
      'The primary air, the one that feeds the fire, passes this valve before entering the gasifier. In the 3D, the path goes from the fan’s eye to the valve, then to the air intake: it is the arrangement of the report’s schematic, which the lab follows. When running, the engine draws this air: the whole system is under suction. At a stop, nothing draws it any more, and the same opening becomes the gas’s outlet. The lab gives neither a position nor a setting for this valve, nor its size: the report publishes none, and it would be one more setting.',
    ),
    material: l('Vanne d’acier', 'Steel valve'),
    specs: [
      sp('Place', 'Place', l('sur la prise d’air du gazogène', 'on the gasifier’s air intake')),
      sp('En marche', 'When running', l('l’air entre, sous aspiration', 'air comes in, under suction')),
      sp(
        'À l’arrêt',
        'At a stop',
        l('le gaz peut sortir par la même ouverture', 'gas can come out through the same opening'),
      ),
      sp('Réglage', 'Setting', l('aucun donné', 'none given')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de vanne d’air n’est rapportée.',
        check: 'Ce que montre la 3D : le sens des points d’air en marche, et le panache du garage à l’arrêt.',
        care: 'Aucune opération n’est décrite pour cette vanne.',
      },
      {
        failure: 'No air valve failure is reported.',
        check: 'What the 3D shows: the direction of the air dots when running, and the garage’s plume at a stop.',
        care: 'No operation is described for this valve.',
      },
    ),
    tip: l(
      'Activez « Flux » : le trajet de l’air part de l’œil du ventilateur, passe par la vanne et entre au gazogène.',
      'Switch on “Flows”: the air’s route starts at the fan’s eye, passes the valve and enters the gasifier.',
    ),
    design: l(
      'L’air et le gaz passent par la même porte, dans deux sens, à deux moments. C’est ce qui rend l’arrêt si différent de la marche, et tout le dernier monde en dépend.',
      'Air and gas pass through the same door, in two directions, at two moments. That is what makes the stop so different from running, and the whole last world depends on it.',
    ),
  },
  {
    id: 'cyclone',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Cyclone', 'Cyclone'),
    short: l(
      'Il prend 60 à 70 % de la poussière : mais il est sur le schéma d’un autre système du programme, pas sur celui de ce tracteur.',
      'It takes 60 to 70% of the dust: but it is on the schematic of another system of the programme, not on this tractor’s.',
    ),
    description: l(
      'Un cyclone fait tourner le gaz pour jeter la poussière contre ses parois, avant le filtre : il en prend de 60 à 70 %. Mais il est sur la figure du système à filtre à toile du programme, pas sur le schéma de ce tracteur. Le texte du rapport dit que la chemise se vide dans un bac, et le schéma n’en montre pas : le schéma simplifie, ou le tracteur n’en avait pas. La photographie ne tranche pas. Le lab le dessine à l’écart de la ligne, dans le monde « Ligne de gaz », et le dit : la place d’un cyclone, ici, est une question ouverte.',
      'A cyclone spins the gas to throw the dust against its walls, before the filter: it takes 60 to 70% of it. But it is on the figure of the programme’s fabric-filter system, not on this tractor’s schematic. The report’s text says the jacket empties into a vessel, and the schematic shows none: the schematic simplifies, or the tractor had no such thing. The photograph does not settle it. The lab draws it apart from the line, in the “Gas line” world, and says so: a cyclone’s place, here, is an open question.',
    ),
    material: l('Tôle d’acier, corps et cône', 'Sheet steel, body and cone'),
    specs: [
      sp('Poussière retenue', 'Dust caught', l('60 à 70 %', '60 to 70%')),
      sp('Sur le schéma de ce tracteur', 'On this tractor’s schematic', l('non', 'no')),
      sp('Sur le système à filtre à toile du programme', 'On the programme’s fabric-filter system', l('oui', 'yes')),
      sp('Dans le modèle', 'In the model', l('aucun cyclone', 'no cyclone')),
    ],
    maintenance: maint(
      {
        failure: 'Rien n’est rapporté pour un cyclone sur ce tracteur : on ne sait pas s’il y en avait un.',
        check:
          'Le rapport ne dit pas si ce tracteur en avait un : la part de 60 à 70 % est celle du système à filtre à toile du programme.',
        care: 'Aucune opération n’est décrite.',
      },
      {
        failure: 'Nothing is reported of a cyclone on this tractor: it is not known whether there was one.',
        check:
          'The report does not say whether this tractor had one: the share of 60 to 70% is that of the programme’s fabric-filter system.',
        care: 'No operation is described.',
      },
    ),
    tip: l(
      'Dans « Ligne de gaz », le cyclone est à part, d’un côté : il ne fait pas partie de la ligne qui va au moteur, et les points de « Flux » ne le traversent pas.',
      'In “Gas line”, the cyclone is apart, to one side: it is not part of the line that goes to the engine, and the “Flows” dots do not pass through it.',
    ),
    design: l(
      'C’est la seule pièce du lab dont la présence est une incertitude, et la fiche le dit au lieu de choisir. Le programme de l’institut avait plusieurs systèmes, et le rapport en mêle les figures.',
      'It is the only part of the lab whose very presence is an uncertainty, and the sheet says so instead of choosing. The institute’s programme had several systems, and the report mixes their figures.',
    ),
  },
  {
    id: 'filter-box',
    scene: 'gas-train',
    category: 'structure',
    name: l('Caisson de filtre', 'Filter box'),
    short: l(
      'Le caisson de 4,9 m² de toile : chaud, et un endroit où l’air peut rencontrer du gaz.',
      'The 4.9 m² box of cloth: hot, and a place where air can meet gas.',
    ),
    description: lf(
      'Le caisson loge la toile qui arrête la poussière : 4,9 m², agrandi depuis 2,5 m² quand un nettoyage toutes les 20 heures a paru inacceptable. Avec la surface d’origine, le modèle double la perte de pression. Le gaz y entre à environ {filterInT}, la toile est à {filterT}, selon le modèle, et la toile ne tient pas plus de 300 °C. C’est aussi un endroit où l’air peut rencontrer du gaz : un retour de flamme dans le filtre peut être violent, surtout dans un filtre qui garde encore de l’air. Les dimensions du caisson de ce tracteur sont inconnues ; le lab le dessine d’après la figure du rapport et la photographie.',
      'The box houses the cloth that stops the dust: 4.9 m², enlarged from 2.5 m² when cleaning every 20 hours proved unacceptable. With the original area, the model doubles the pressure drop. The gas enters at about {filterInT}, the cloth is at {filterT}, by the model, and the cloth does not take more than 300 °C. It is also a place where air can meet gas: a backfire into the filter can be violent, above all in a filter still holding air. The dimensions of this tractor’s box are unknown; the lab draws it from the report’s figure and the photograph.',
    ),
    material: l('Caisson calorifugé, tôle sur laine minérale', 'Insulated box, sheet steel over mineral wool'),
    specs: [
      sp('Surface de toile', 'Cloth area', '4,9 m²'),
      sp('Surface d’origine', 'Original area', '2,5 m²'),
      sp('Gaz à l’entrée, modèle', 'Gas at the inlet, model', v('{filterInT}')),
      sp('Toile, modèle', 'Cloth, model', v('{filterT}')),
      sp('Limite de la toile', 'Cloth’s limit', l('environ 300 °C', 'about 300 °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Un nettoyage trop fréquent : c’est ce qui a fait passer la surface de 2,5 à 4,9 m². Un gaz trop chaud brûle la toile ; un gaz trop froid la mouille.',
        check:
          'La résistance, lue au manomètre à eau : sur le camion, elle doublait après environ 3 000 km, et elle est plus que sextuplée si la toile se mouille.',
        care: 'Le filtre était nettoyé toutes les 25 à 100 heures, pendant 30 à 60 minutes : une durée de l’institut, pas un geste décrit.',
      },
      {
        failure:
          'Cleaning too often: that is what took the area from 2.5 to 4.9 m². A gas too hot burns the cloth; a gas too cold wets it.',
        check:
          'The resistance, read on the water gauge: on the truck it doubled after about 3,000 km, and it is more than sixfold if the cloth gets wet.',
        care: 'The filter was cleaned every 25 to 100 hours, for 30 to 60 minutes: an institute’s duration, not a gesture described.',
      },
    ),
    tip: l(
      'Dans « Transparence », le caisson s’ouvre : les manches se lisent à l’intérieur, avec leur couleur qui fonce à mesure que la poussière s’y dépose.',
      'In “X-ray”, the box opens: the bags can be read inside, their colour darkening as dust settles in them.',
    ),
    design: l(
      'Le chiffre qui change tout ici est la surface : doubler la toile a divisé par deux la résistance du filtre, et a fait passer le nettoyage de toutes les 20 heures à une fois par 25 à 100. Le caisson du lab est dessiné d’après la figure du rapport : sa taille est une lecture.',
      'The figure that changes everything here is the area: doubling the cloth halved the filter’s resistance, and took the cleaning from every 20 hours to once in 25 to 100. The lab’s box is drawn from the report’s figure: its size is a reading.',
    ),
  },
  {
    id: 'filter-bags',
    scene: 'gas-train',
    category: 'structure',
    name: l('Manches', 'Filter bags'),
    short: l(
      'La toile qui arrête la poussière : 0,3 mg/m³ en sortie, et six fois plus de résistance quand elle est mouillée.',
      'The cloth that stops the dust: 0.3 mg/m³ at the outlet, and six times the resistance when wet.',
    ),
    description: lf(
      'La toile est montée en manches plates sur des cadres : le gaz passe à travers, la poussière reste. Après le filtre à toile, il ne reste que 0,3 mg/m³ de poussière ; après le train à lavage de la guerre, de 200 à 400. Mais la toile se paie : sur le camion, sa résistance partait de 150 à 200 mm d’eau, montait de 60 à 75 mm par 1 000 km, et doublait vers 3 000 km. Mouillée, elle dépasse six fois la valeur sèche. Le lab dessine {bagCount} manches plates, qui donnent les 4,9 m² du rapport : leur nombre et leur taille sont à nous.',
      'The cloth is mounted in flat bags on frames: the gas passes through, the dust stays. After the fabric filter, only 0.3 mg/m³ of dust is left; after the wartime washing train, 200 to 400. But the cloth has its price: on the truck, its resistance started at 150 to 200 mm of water, rose 60 to 75 mm per 1,000 km, and doubled near 3,000 km. Wet, it exceeds six times the dry value. The lab draws {bagCount} flat bags, which give the report’s 4.9 m²: their number and size are ours.',
    ),
    material: l('Toile sur cadres, manches plates', 'Cloth on frames, flat bags'),
    specs: [
      sp('Surface, au total', 'Area, in all', '4,9 m²'),
      sp('Poussière après la toile', 'Dust after the cloth', '0,3 mg/m³'),
      sp(
        'Résistance du camion, neuve',
        'The truck’s resistance, new',
        l('150 à 200 mm d’eau', '150 to 200 mm of water'),
      ),
      sp('Hausse', 'Rise', l('60 à 75 mm d’eau par 1 000 km', '60 to 75 mm of water per 1,000 km')),
      sp('Toile mouillée', 'Wet cloth', l('plus de 6 fois', 'over 6 times')),
      sp('Vie des manches', 'Bags’ life', l('500 à 1 000 h', '500 to 1,000 h')),
    ],
    maintenance: maint(
      {
        failure:
          'Une toile mouillée : la résistance multipliée par six d’un coup, et dans le modèle {filterWetLoss} de puissance en moins qu’avec un filtre neuf.',
        check:
          'Sur 3 000 km, soit 50 heures à 60 km/h, le modèle double la résistance de la toile, comme sur le camion : le moteur n’y perd que {filterAgeLoss}.',
        care: 'Les manches tenaient de 500 à 1 000 heures, d’après l’expérience cumulée de plusieurs véhicules du programme.',
      },
      {
        failure:
          'Wet cloth: the resistance multiplied by six at once, and in the model {filterWetLoss} less power than with a new filter.',
        check:
          'Over 3,000 km, which is 50 hours at 60 km/h, the model doubles the cloth’s resistance, as on the truck: the engine loses only {filterAgeLoss} for it.',
        care: 'The bags lasted 500 to 1,000 hours, by the accumulated experience of several of the programme’s vehicles.',
      },
    ),
    tip: l(
      'Lancez « Le filtre s’encrasse » : la toile fonce dans la 3D, la colonne de gauche du manomètre à eau monte, puis la toile se mouille d’un coup.',
      'Run “The filter clogs”: the cloth darkens in the 3D, the water gauge’s column rises, then the cloth gets wet all at once.',
    ),
    design: l(
      'La toile se paie en résistance, et le moteur la paie en puissance : mais pas beaucoup, tant qu’elle est sèche. Ce qui coûte, c’est qu’elle soit mouillée. Le gaz reste donc chaud dans le filtre, au-dessus de son point de rosée, et froid au moteur : chacun a sa raison.',
      'The cloth is paid for in resistance, and the engine pays in power: but not much, as long as it is dry. What costs is its being wet. So the gas stays hot in the filter, above its dew point, and cold at the engine: each has its reason.',
    ),
  },
  {
    id: 'gas-cooler',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Refroidisseur', 'Gas cooler'),
    short: l(
      'Un faisceau de tubes devant le radiateur, 5,8 m² : un gaz plus froid est plus dense, donc plus de gaz dans le cylindre.',
      'A tube bank in front of the radiator, 5.8 m²: a colder gas is denser, so more gas in the cylinder.',
    ),
    description: lf(
      'Après le filtre, le gaz est encore chaud : il monte par la moitié des tubes, traverse un collecteur, et redescend par l’autre moitié, sous le souffle du radiateur. Surface annoncée : 5,8 m², pour un refroidisseur de type D. Le lab le dessine avec {coolerTubes}, un décompte à nous, qui donne cette surface. À la sortie, le modèle a un gaz à environ {coolerOut}. Pourquoi refroidir ? Un gaz plus froid est plus dense, donc plus d’énergie entre dans le cylindre. Au passage, le gaz tombe sous son point de rosée : de l’eau sort, {coolerLph} dans le modèle.',
      'After the filter, the gas is still hot: it goes up half the tubes, crosses a header, and comes down the other half, under the radiator’s draught. The area given is 5.8 m², for a type D cooler. The lab draws it with {coolerTubes}, a count of ours, which gives that area. At the outlet, the model has a gas at about {coolerOut}. Why cool? A colder gas is denser, so more energy enters the cylinder. On the way, the gas falls below its dew point: water comes out, {coolerLph} in the model.',
    ),
    material: l('Tubes d’acier, collecteur, devant le radiateur', 'Steel tubes, header, in front of the radiator'),
    specs: [
      sp('Surface', 'Area', '5,8 m²'),
      sp('Tubes dessinés', 'Tubes as drawn', v('{coolerTubes}')),
      sp('Gaz à la sortie, modèle', 'Gas at the outlet, model', v('{coolerOut}')),
      sp('Valeur du refroidissement', 'Worth of the cooling', v('{coolRule}')),
      sp('Eau condensée, modèle', 'Water condensed, model', v('{coolerLph}')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau condensée : elle s’accumule dans le bac, et la seule panne grave de ce tracteur est probablement venue d’un bac trop plein.',
        check:
          'Ce que vaut le refroidissement n’est pas dit pareil partout : presque 2 % de puissance pour une baisse de 10 % de la température selon le rapport, en général, 1 % par 10 °F selon le manuel américain, et par la densité seule {coolRule}, ce que trouve aussi le modèle.',
        care: 'Le refroidisseur était nettoyé et ses joints refaits vers 500 heures, une à deux heures de travail.',
      },
      {
        failure:
          'Condensed water: it builds up in the vessel, and this tractor’s one serious failure probably came from an overfull vessel.',
        check:
          'What cooling is worth is not said the same everywhere: almost 2% of power for a 10% drop in temperature by the report, in general, 1% per 10 °F by the American handbook, and by density alone {coolRule}, which the model also finds.',
        care: 'The cooler was cleaned and its gaskets redone at about 500 hours, one to two hours of work.',
      },
    ),
    tip: l(
      'Dans « Flux », les points changent de couleur dans le refroidisseur : du rouge au bleu, à mesure que le gaz perd sa chaleur.',
      'In “Flows”, the dots change colour in the cooler: from red to blue, as the gas loses its heat.',
    ),
    design: lf(
      'Chauffer le gaz au début de la ligne et le refroidir à la fin : voilà le compromis du filtre et du moteur, dit en deux pièces. Le coefficient d’échange du refroidisseur est une estimation, {coolerU}, faute de mesure.',
      'Keeping the gas hot at the start of the line and cooling it at the end: that is the filter’s and the engine’s compromise, said in two parts. The cooler’s heat-transfer coefficient is an estimate, {coolerU}, for want of a measurement.',
    ),
  },
  {
    id: 'cooler-condensate-vessel',
    scene: 'gas-train',
    category: 'hydraulic',
    name: l('Bac de condensats', 'Condensate vessel'),
    short: l(
      'Le bac d’eau noire du refroidisseur : trop plein, il a probablement noyé un moteur, la seule panne grave de ce tracteur.',
      'The cooler’s vessel of black water: overfull, it probably drowned an engine, this tractor’s one serious failure.',
    ),
    description: lf(
      'L’eau que le refroidisseur tire du gaz tombe dans un bac. Le rapport donne, pour plusieurs véhicules de l’institut, un bac de ce genre vidé toutes les 2 à 3 heures, et dit que la seule panne grave de ce moteur est probablement venue d’une eau aspirée d’un bac trop plein : elle est entrée dans le moteur avec le gaz. La taille du bac n’est dans aucune source. Le modèle compte {coolerLph} d’eau à pleine charge, un bac vidé toutes les {vesselHours}, et allume une alarme quand l’intervalle est dépassé. La 3D dessine un bocal dont le niveau suit le modèle : sa taille est une estimation, et le lab ne la donne pas comme une cote.',
      'The water the cooler draws from the gas falls into a vessel. The report gives, for several of the institute’s vehicles, a vessel of this kind emptied every 2 to 3 hours, and says that this engine’s one serious failure probably came from water sucked from an overfull vessel: it went into the engine with the gas. The vessel’s size is in no source. The model counts {coolerLph} of water at full load, a vessel emptied every {vesselHours}, and raises an alarm when the interval is passed. The 3D draws a jar whose level follows the model: its size is an estimate, and the lab does not give it as a dimension.',
    ),
    material: l('Bac d’acier, niveau visible', 'Steel vessel, level in view'),
    specs: [
      sp(
        'Intervalle, plusieurs véhicules de l’institut',
        'Interval, several of the institute’s vehicles',
        l('2 à 3 h', '2 to 3 h'),
      ),
      sp('Eau, modèle, pleine charge', 'Water, model, full load', v('{coolerLph}')),
      sp('Intervalle du modèle', 'The model’s interval', v('{vesselHours}')),
      sp('Taille du bac', 'Vessel size', l('inconnue', 'unknown')),
      sp('Panne', 'Failure', l('un moteur, probablement par cette eau', 'one engine, probably by this water')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bac trop plein : de l’eau passe dans le moteur avec le gaz. Le rapport écrit « probablement » : la cause n’a pas été vue.',
        check:
          'Le niveau dans la 3D : il monte jusqu’à l’intervalle, puis dépasse le bord, et l’alarme de la Simulation s’allume.',
        care: 'Sur plusieurs véhicules de l’institut, un bac de ce genre était vidé toutes les 2 à 3 heures : une durée relevée, pas un geste décrit.',
      },
      {
        failure:
          'An overfull vessel: water goes into the engine with the gas. The report writes “probably”: the cause was not seen.',
        check:
          'The level in the 3D: it climbs to the interval, then goes over the rim, and the Simulation’s alarm lights.',
        care: 'On several of the institute’s vehicles, a vessel of this kind was emptied every 2 to 3 hours: a recorded interval, not a gesture described.',
      },
    ),
    tip: l(
      'Le niveau du bac monte entre deux vidanges, dans la 3D. Quand la Simulation ne le vide pas, il passe le bord, et l’alarme s’allume.',
      'The vessel’s level rises between two emptyings, in the 3D. When the Simulation does not empty it, it goes over the rim, and the alarm lights.',
    ),
    design: l(
      'Le bac est la seule pièce de cette ligne dont la panne a probablement tué un moteur. Il tient à un détail : un niveau à regarder toutes les deux ou trois heures. C’est la forme même du travail, long, sale et lourd, dont parlaient les conducteurs.',
      'The vessel is the only part of this line whose failure probably killed an engine. It hangs on a detail: a level to be looked at every two or three hours. It is the very shape of the time-consuming, dirty and heavy work the drivers spoke of.',
    ),
  },
  {
    id: 'gas-air-mixer',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Mélangeur', 'Gas-air mixer'),
    short: l(
      'Là où le gaz rencontre l’air du moteur : à peu près autant de l’un que de l’autre.',
      'Where the gas meets the engine’s air: about as much of one as of the other.',
    ),
    description: lf(
      'Au mélangeur, le gaz du refroidisseur rencontre l’air du filtre à air du tracteur. Il y entre à peu près autant de l’un que de l’autre : de 1 à 1,1 volume d’air pour un de gaz, selon un manuel américain. Par arithmétique sur la composition du rapport, on trouve {mixAir} ; le modèle, sur son propre gaz, {mixAirModel}. Le mélange contient environ {mixMJ} par mètre cube, quand le même volume d’essence et d’air en contient 3,8 : un tiers de moins avant tout le reste. Le mélangeur est sur le dessus du capot dans le dessin du lab, au-dessus du moteur, d’après le schéma, et son gabarit est une estimation.',
      'At the mixer, the gas from the cooler meets the air from the tractor’s air cleaner. About as much of one as of the other goes in: 1 to 1.1 volumes of air for one of gas, by an American handbook. By arithmetic on the report’s composition, it comes to {mixAir}; the model, on its own gas, {mixAirModel}. The mixture holds about {mixMJ} per cubic metre, when the same volume of petrol and air holds 3.8: a third less before anything else. The mixer stands on the top of the bonnet in the lab’s drawing, above the engine, from the schematic, and its size is an estimate.',
    ),
    material: l('Corps métallique, deux entrées', 'Metal body, two inlets'),
    specs: [
      sp('Air pour un de gaz, manuel', 'Air for one of gas, handbook', l('1 à 1,1', '1 to 1.1')),
      sp('Air pour un de gaz, à la main', 'Air for one of gas, by hand', v('{mixAir}')),
      sp('Air pour un de gaz, modèle', 'Air for one of gas, model', v('{mixAirModel}')),
      sp('Énergie du mélange, à la main', 'Mixture’s energy, by hand', v('{mixMJ}')),
      sp('Essence et air', 'Petrol and air', '3,8 MJ/m³'),
    ],
    maintenance: maint(
      {
        failure:
          'Un mélange trop riche ou trop pauvre : le rapport montre une chute de puissance de chaque côté de l’optimum.',
        check: 'La température du mélange : le modèle trouve {mixT} à pleine charge.',
        care: 'Aucune opération n’est décrite, et aucun réglage n’est donné.',
      },
      {
        failure: 'A mixture too rich or too lean: the report shows a fall in power on each side of the optimum.',
        check: 'The mixture’s temperature: the model finds {mixT} at full load.',
        care: 'No operation is described, and no setting is given.',
      },
    ),
    tip: l(
      'Dans « Flux », le gaz arrive du refroidisseur, l’air du filtre à air, et un seul flot repart vers la tubulure.',
      'In “Flows”, the gas arrives from the cooler, the air from the air cleaner, and a single stream leaves for the manifold.',
    ),
    design: l(
      'Il n’y a pas de curseur pour cette proportion dans le lab : un rapport qui a un optimum est un réglage, et ce lab n’en donne aucun. La proportion est un fait du gaz que le modèle lit, pas un bouton.',
      'There is no slider for this proportion in the lab: a ratio that has an optimum is a setting, and this lab gives none. The proportion is a fact of the gas that the model reads, not a knob.',
    ),
  },
  {
    id: 'gas-throttle',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Papillon de gaz', 'Gas throttle'),
    short: l(
      'Ce que commande le pied du conducteur : plus le papillon est ouvert, plus il passe de gaz, et plus la puissance monte.',
      'What the driver’s foot works: the more the throttle is open, the more gas passes, and the more the power rises.',
    ),
    description: lf(
      'Dans un diesel ordinaire, le pied du conducteur règle le gazole. Ici, il règle le gaz : le papillon de gaz est sur le trajet, près du mélangeur, et c’est lui qui dit combien de gaz entre. Dans la 3D, son levier s’ouvre avec la charge que donne le modèle. Un papillon a un coût : il étrangle l’admission. Au ralenti, le frottement et le papillon demandent environ {idleFriction} pour rien, sur les {idleIn} d’énergie qui entrent. Le régulateur ajouté tient la vitesse sur ce même papillon.',
      'In an ordinary diesel, the driver’s foot sets the diesel. Here, it sets the gas: the gas throttle is on the route, near the mixer, and it is what says how much gas enters. In the 3D its lever opens with the load the model gives. A throttle has a cost: it chokes the intake. At idle, friction and the throttle ask about {idleFriction} for nothing, out of the {idleIn} of energy going in. The added governor holds the speed on this same throttle.',
    ),
    material: l('Papillon d’acier sur arbre, levier', 'Steel butterfly on a shaft, lever'),
    specs: [
      sp(
        'Commandé par',
        'Worked by',
        l('le pied du conducteur, et le régulateur ajouté', 'the driver’s foot, and the added governor'),
      ),
      sp('Frottement et papillon au ralenti', 'Friction and throttle at idle', v('{idleFriction}')),
      sp('Énergie qui entre au ralenti', 'Energy going in at idle', v('{idleIn}')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de papillon n’est rapportée.',
        check: 'Le levier, dans la 3D : il s’ouvre avec la puissance que donne le modèle.',
        care: 'Aucune opération n’est décrite, et aucun réglage n’est donné.',
      },
      {
        failure: 'No throttle failure is reported.',
        check: 'The lever, in the 3D: it opens with the power the model gives.',
        care: 'No operation is described, and no setting is given.',
      },
    ),
    tip: lf(
      'Lancez « Le ralenti » : le levier se ferme presque, et {idleIn} d’énergie entrent pour rien à l’arbre.',
      'Run “Idling”: the lever almost closes, and {idleIn} of energy go in for nothing at the shaft.',
    ),
    design: l(
      'C’est la pièce qui fait de la pédale du conducteur une commande de gaz, et non plus de gazole : le carburant principal ne passe plus que par elle.',
      'This is the part that makes the driver’s pedal a gas control, and no longer a diesel one: the main fuel now passes only through it.',
    ),
  },
  {
    id: 'secondary-air-throttle',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Papillon d’air', 'Secondary-air throttle'),
    short: l(
      'Sur l’air qu’on ajoute au gaz, à côté du papillon de gaz : un deuxième papillon, et un réglage que ce lab ne donne pas.',
      'On the air added to the gas, beside the gas throttle: a second butterfly, and a setting this lab does not give.',
    ),
    description: l(
      'L’air secondaire est celui que le mélangeur ajoute au gaz, par opposition à l’air primaire du feu. Un papillon sur ce trajet règle la proportion ; sur le camion du programme, dit le rapport, il se manœuvrait à la main, depuis la cabine. C’est un réglage qui a un optimum, et que le lab ne donne pas : ni curseur, ni position de ce papillon. La proportion qui en résulte est celle du mélangeur, dite à sa fiche. Ce que le lab dit, c’est ce que le rapport montre : l’énergie du mélange tombe de chaque côté de la bonne proportion, et le gaz seul, sans air, ne brûle pas. La 3D dessine le papillon, avec son levier, sur la tubulure du moteur.',
      'Secondary air is the air the mixer adds to the gas, as against the fire’s primary air. A throttle on that route sets the proportion; on the programme’s truck, says the report, it was worked by hand, from the cabin. It is a setting with an optimum, and the lab does not give it: no slider, no position of this throttle. The resulting proportion is the mixer’s, said on its sheet. What the lab says is what the report shows: the mixture’s energy falls on each side of the right proportion, and the gas alone, with no air, does not burn. The 3D draws the throttle, with its lever, on the engine’s manifold.',
    ),
    material: l('Papillon d’acier sur arbre, levier', 'Steel butterfly on a shaft, lever'),
    specs: [
      sp('Rôle', 'Role', l('régler l’air ajouté au gaz', 'set the air added to the gas')),
      sp('Réglage donné', 'Setting given', l('aucun', 'none')),
      sp(
        'Effet',
        'Effect',
        l(
          'l’énergie du mélange tombe de chaque côté de l’optimum',
          'the mixture’s energy falls on each side of the optimum',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure: 'Aucune panne de papillon d’air n’est rapportée.',
        check: 'La puissance et la fumée : un mélange trop riche ou trop pauvre se lit au banc, pas à l’œil.',
        care: 'Aucune opération n’est décrite, et aucun réglage n’est donné.',
      },
      {
        failure: 'No air throttle failure is reported.',
        check: 'The power and the smoke: a mixture too rich or too lean is read on the bench, not by eye.',
        care: 'No operation is described, and no setting is given.',
      },
    ),
    tip: l(
      'Dans « Éclaté », les deux papillons montent ensemble avec le mélangeur : on les lit côte à côte, chacun sur son trajet.',
      'In “Explode”, the two throttles rise together with the mixer: they read side by side, each on its own route.',
    ),
    design: l(
      'Sur le camion du programme, ce papillon se manœuvrait à la main, depuis la cabine, dans une machine qui vit de proportions : le rapport donne ce geste comme normal, et le lab ne le reprend pas. Pour le tracteur, le rapport n’en dit rien. Ce qu’il laisse, c’est le fait : le moteur ne marche bien que dans une bande étroite.',
      'On the programme’s truck this throttle was worked by hand, from the cabin, in a machine that lives on proportions: the report gives that gesture as normal, and the lab does not repeat it. For the tractor, the report says nothing of it. What it leaves is the fact: the engine runs well only in a narrow band.',
    ),
  },
  {
    id: 'pilot-injector',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Injecteur pilote', 'Pilot injector'),
    short: l(
      'Un filet de gazole qui allume le gaz : sans lui, un diesel ne brûle pas son mélange.',
      'A thread of diesel that lights the gas: without it, a diesel does not burn its mixture.',
    ),
    description: lf(
      'Un diesel n’a pas de bougie : il allume sa charge en la comprimant, puis en y injectant du gazole. Le gaz et l’air ne s’allument pas ainsi, mais le filet de gazole, si. C’est le pilote : un diesel a encore besoin d’un filet de gazole, et le moteur donne ainsi 79 % de sa puissance. Au banc, il compte {dieselShareMax} de l’énergie qui entre à pleine charge, 15 % à charge partielle, 26 % au ralenti. Le tableau du rapport imprime 18,9 % pour la première ligne, mais ses propres chiffres ne le portent pas : une coquille probable. Le lab ne donne ni quantité par coup, ni réglage.',
      'A diesel has no spark plug: it lights its charge by compressing it, then injecting diesel into it. Gas and air do not light that way, but the thread of diesel does. It is the pilot: a diesel still needs a thread of diesel, and the engine gives 79% of its power that way. On the bench it counts for {dieselShareMax} of the energy going in at full load, 15% at part load, 26% at idle. The report’s table prints 18.9% for the first line, but its own figures do not bear it out: a probable misprint. The lab gives no quantity per stroke, and no setting.',
    ),
    material: l('Injecteur de diesel, un jet fin', 'Diesel injector, a fine jet'),
    specs: [
      sp(
        'Gazole',
        'Diesel',
        l('un filet reste nécessaire pour allumer le gaz', 'a thread is still needed to light the gas'),
      ),
      sp('Part de l’énergie, pleine charge', 'Share of energy, full load', v('{dieselShareMax}')),
      sp('Part de l’énergie, charge partielle', 'Share of energy, part load', l('15 %', '15%')),
      sp('Part de l’énergie, ralenti', 'Share of energy, idle', l('26 %', '26%')),
      sp('Gazole, au banc, à pleine charge', 'Diesel, on the bench, at full load', '2,2 kg/h'),
    ],
    maintenance: maint(
      {
        failure:
          'Le refroidissement de l’injecteur a été changé par l’institut : les injecteurs chauffaient et s’encrassaient de dépôts de coke dans les trous de buse, ce que le rapport attribue au faible débit d’injection en double carburant et à la façon dont ils sont montés.',
        check:
          'Le gazole, au banc : 2,2 kg/h à pleine charge, 1,9 à charge partielle, 1,2 au ralenti. Ce sont des résultats d’essai, pas un réglage.',
        care: 'Aucune opération n’est décrite, et aucun réglage n’est donné.',
      },
      {
        failure:
          'The injector’s cooling was changed by the institute: the injectors ran hot and coked up in the nozzle holes, which the report attributes to the low injection flow in dual-fuel mode and to the way the injectors are mounted.',
        check:
          'The diesel, on the bench: 2.2 kg/h at full load, 1.9 at part load, 1.2 at idle. Those are test results, not a setting.',
        care: 'No operation is described, and no setting is given.',
      },
    ),
    tip: l(
      'Dans « Ligne de gaz », sélectionnez l’injecteur : il se lit au sommet du cylindre ouvert, avec son filet qui se déclenche au bon moment du cycle.',
      'In “Gas line”, select the injector: it can be read at the top of the opened cylinder, with its thread triggering at the right moment of the cycle.',
    ),
    design: l(
      'Le rapport mesure en kg par heure ce que le lab montre en kg par heure : c’est tout ce qu’il faut de ce filet pour comprendre la machine. Un gazogène sur un diesel ne se passe pas de gazole, et la réponse honnête à « le bois suffit-il ? » est non.',
      'The report measures in kg per hour what the lab shows in kg per hour: that is all that is needed of this thread to understand the machine. A gasifier on a diesel does not do without diesel, and the honest answer to “is wood enough?” is no.',
    ),
  },
  {
    id: 'cylinder-cutaway',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Cylindre en coupe', 'Cylinder cutaway'),
    short: l(
      'Un cylindre ouvert : piston, bielle, soupapes, et un mélange qui ne contient que 2 500 kJ par mètre cube.',
      'A cylinder cut open: piston, rod, valves, and a mixture that holds only 2,500 kJ per cubic metre.',
    ),
    description: lf(
      'Voici où l’énergie finit en travail : un cylindre coupé en deux, avec son piston, sa bielle, ses soupapes et son pilote. Le cycle y est vu pour de vrai, dans l’ordre : admission, compression, combustion, échappement. À 1 855 tr/min, le vrai moteur tourne à {trueTurns} : l’œil ne verrait rien. Le cylindre de la 3D tourne à {cylSpeed} du vrai, jamais plus de {cylCap}. Le mélange, lui, n’emplit que {chargeModel} du volume balayé au maximum, quand le rapport donne de 0,65 à 0,8 du théorique après les pertes, un rendement volumétrique de 0,7 à 0,9. Selon le rapport, en général, la vitesse d’un moteur au gaz est limitée à environ 2 500 tr/min par la flamme lente du gaz ; le modèle trouve environ {rpmModel}, par une autre cause, le frottement : il n’a pas de flamme.',
      'Here is where energy ends as work: a cylinder cut in two, with its piston, its rod, its valves and its pilot. The cycle is seen for real, in order: intake, compression, combustion, exhaust. At 1,855 rpm the real engine turns at {trueTurns}: the eye would see nothing. The 3D’s cylinder turns at {cylSpeed} of the real, never more than {cylCap}. The mixture fills only {chargeModel} of the swept volume at the maximum, when the report gives 0.65 to 0.8 of the theoretical after losses, a volumetric efficiency of 0.7 to 0.9. By the report, in general, the speed of a gas engine is limited to about 2,500 rpm by the gas’s slow flame; the model finds about {rpmModel}, by another cause, friction: it has no flame.',
    ),
    material: l('Fonte, piston et bielle d’acier, coupe franche', 'Cast iron, steel piston and rod, a clean cut'),
    specs: [
      sp(
        'Énergie du mélange',
        'Mixture energy',
        l('2 500 kJ/m³, contre 3 800 pour l’essence', '2,500 kJ/m³, against 3,800 for petrol'),
      ),
      sp(
        'Charge, selon le rapport',
        'Charge, by the report',
        l('0,65 à 0,8 du théorique', '0.65 to 0.8 of the theoretical'),
      ),
      sp('Charge, modèle, au maximum', 'Charge, model, at the maximum', v('{chargeModel}')),
      sp('Vitesse limite, rapport', 'Speed limit, report', l('environ 2 500 tr/min', 'about 2,500 rpm')),
      sp(
        'Vitesse du cylindre de la 3D',
        'Speed of the 3D’s cylinder',
        lf('{cylSpeed}, au plus {cylCap}', '{cylSpeed}, at most {cylCap}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'L’usure des cylindres : 0,007 à 0,019 mm pour 1 000 heures avec un filtre à toile, de 0,05 à 0,06 avec un lavage à l’eau.',
        check:
          'Le cycle, dans la 3D : le piston ne touche jamais la culasse, et chaque soupape ne s’ouvre que dans sa course.',
        care: 'Aucune opération n’est décrite, et aucun réglage du moteur n’est donné.',
      },
      {
        failure:
          'Cylinder wear: 0.007 to 0.019 mm per 1,000 hours with a fabric filter, 0.05 to 0.06 with a water wash.',
        check: 'The cycle, in the 3D: the piston never touches the head, and each valve opens only in its stroke.',
        care: 'No operation is described, and no engine setting is given.',
      },
    ),
    tip: l(
      'Ce cylindre est coupé en tout temps : il n’y a pas d’outil à presser, et c’est le seul de la ligne qui le soit.',
      'This cylinder is cut at all times: there is no tool to press, and it is the only one on the line that is.',
    ),
    design: l(
      'Le mélange gaz-air ne contient qu’un tiers de moins d’énergie que l’essence, et le frottement ne diminue pas : c’est toute l’explication de la puissance perdue. Le lab ne montre aucun taux de compression ni aucune avance : ce sont des réglages de moteur.',
      'The gas-air mixture holds only a third less energy than petrol, and friction does not shrink: that is the whole explanation of the power lost. The lab shows no compression ratio and no timing: they are engine settings.',
    ),
  },
  {
    id: 'exhaust-pipe',
    scene: 'gas-train',
    category: 'mechanical',
    name: l('Échappement', 'Exhaust pipe'),
    short: l(
      'Au ralenti, l’échappement des moteurs à gaz de bois de la guerre contient de 5 à 8 % de monoxyde de carbone.',
      'At idle, the exhaust of wartime wood-gas engines holds 5 to 8% carbon monoxide.',
    ),
    description: lf(
      'À la sortie du moteur, au travail, il ne passe que très peu de monoxyde : le modèle compte {exhaustWork}. Mais au ralenti, le livre suédois a lu de 5 à 8 % de monoxyde de carbone dans l’échappement, sur les moteurs de la guerre, et le juge bien plus dangereux que celui d’un moteur à essence. Le modèle en tire qu’au ralenti l’essentiel du gaz traverse le moteur sans brûler, {twoThirds} : une valeur qu’il règle sur ce chiffre, donc pas une preuve. Aucun chiffre d’échappement moderne n’est donné ici.',
      'At the engine’s outlet, at work, very little carbon monoxide passes: the model counts {exhaustWork}. But at idle, the Swedish book read 5 to 8% carbon monoxide in the exhaust, on wartime engines, and judges it far more dangerous than a petrol engine’s. The model takes from it that at idle most of the gas goes through the engine unburnt, {twoThirds}: a value it sets on that figure, so not a proof. No modern exhaust figure is given here.',
    ),
    material: l('Tuyau d’acier, collecteur', 'Steel pipe, manifold'),
    specs: [
      sp('Monoxyde à l’échappement, au ralenti', 'Carbon monoxide in the exhaust, at idle', l('5 à 8 %', '5 to 8%')),
      sp('Au travail, modèle', 'At work, model', v('{exhaustWork}')),
      sp(
        'Part du gaz qui passe sans brûler, au ralenti',
        'Share of the gas passing unburnt, at idle',
        v('{twoThirds}'),
      ),
      sp('Chiffre moderne', 'Modern figure', l('aucun', 'none')),
    ],
    maintenance: maint(
      {
        failure:
          'Un moteur qui tourne au ralenti dans un local : le livre suédois lit de 5 à 8 % de monoxyde à l’échappement des moteurs de la guerre.',
        check: 'Le monoxyde ne se voit pas : le nuage gris de l’échappement n’en dit pas la part.',
        care: 'Aucune opération n’est décrite pour cet échappement.',
      },
      {
        failure:
          'An engine idling in a room: the Swedish book reads 5 to 8% carbon monoxide in the exhaust of wartime engines.',
        check: 'Carbon monoxide cannot be seen: the grey cloud of the exhaust does not say its share.',
        care: 'No operation is described for this exhaust.',
      },
    ),
    tip: l(
      'Dans « Garage », avec le moteur en marche, la 3D montre le panache gris de l’échappement : il est à part de celui, blanc, de l’arrêt.',
      'In “Garage”, with the engine running, the 3D shows the exhaust’s grey plume: it is apart from the stop’s white one.',
    ),
    design: lf(
      'L’échappement est le seul endroit de cette ligne où le gaz sort pour de bon. Dans le modèle, un moteur qui brûle mal au ralenti le rejette presque tel quel : c’est une des raisons pour lesquelles le ralenti, dans ce lab, brûle {idleIn} pour rien.',
      'The exhaust is the only place on this line where the gas really leaves. In the model, an engine that burns badly at idle throws it out almost as it is: it is one of the reasons why idling, in this lab, burns {idleIn} for nothing.',
    ),
  },
  {
    id: 'water-gauge',
    scene: 'gas-train',
    category: 'hydraulic',
    name: l('Manomètre à eau', 'Water gauge'),
    short: l(
      'Un tube en U rempli d’eau, devant les yeux du conducteur : la mesure d’un filtre qui s’encrasse, en millimètres d’eau.',
      'A U-tube of water in front of the driver’s eyes: the measure of a clogging filter, in millimetres of water.',
    ),
    description: lf(
      'Un tube en U contient de l’eau, et la différence des deux niveaux dit la dépression. Le rapport donne ses chiffres en mm d’eau : un filtre neuf de camion, de 150 à 200, qui monte de 60 à 75 par 1 000 km, double vers 3 000 km, et dépasse six fois sa valeur si la toile se mouille. Le modèle lit {dropModel} à pleine charge. Sur le tracteur, le manomètre est devant l’œil du conducteur, relié au mélangeur par un tuyau : la place est celle du lab, et aucun chiffre n’est écrit sur le verre.',
      'A U-tube holds water, and the difference of the two levels says the suction. The report gives its figures in mm of water: a truck’s new filter, 150 to 200, rising 60 to 75 per 1,000 km, doubling near 3,000 km, and exceeding six times its value if the cloth gets wet. The model reads {dropModel} at full load. On the tractor the gauge is in front of the driver’s eye, joined to the mixer by a hose: the place is the lab’s, and no figure is written on the glass.',
    ),
    material: l('Tube en U, eau, échelle de traits', 'U-tube, water, a scale of ticks'),
    specs: [
      sp('Filtre neuf du camion', 'The truck’s new filter', l('150 à 200 mm d’eau', '150 to 200 mm of water')),
      sp('Hausse', 'Rise', l('60 à 75 mm d’eau par 1 000 km', '60 to 75 mm of water per 1,000 km')),
      sp('Selon le modèle, pleine charge', 'By the model, full load', v('{dropModel}')),
      sp('Toile mouillée', 'Wet cloth', l('plus de 6 fois', 'over 6 times')),
    ],
    maintenance: maint(
      {
        failure: 'Une toile mouillée : la hausse brutale, six fois la valeur sèche, se lit d’un coup sur l’échelle.',
        check:
          'Les deux colonnes de la 3D montent et descendent chacune de la moitié de la perte du modèle, et la différence est la mesure.',
        care: 'Aucune opération n’est décrite pour le manomètre.',
      },
      {
        failure: 'A wet cloth: the sudden rise, six times the dry value, reads at once on the scale.',
        check: 'The 3D’s two columns each rise and fall by half the model’s drop, and the difference is the measure.',
        care: 'No operation is described for the gauge.',
      },
    ),
    tip: l(
      'Lancez « Le filtre s’encrasse » : l’écart des deux colonnes grandit, puis saute quand la toile se mouille.',
      'Run “The filter clogs”: the gap between the two columns grows, then jumps when the cloth gets wet.',
    ),
    design: l(
      'Un manomètre à eau ne dit rien du gaz : seulement que le filtre résiste. C’est un instrument d’une honnêteté rare, qui ne promet pas ce qu’il ne mesure pas. Le lab le place devant les yeux du conducteur, par lecture du schéma, et non d’une photographie.',
      'A water gauge says nothing of the gas: only that the filter resists. It is an instrument of rare honesty, which does not promise what it does not measure. The lab puts it in front of the driver’s eyes, from a reading of the schematic, not of a photograph.',
    ),
  },
];
