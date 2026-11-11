// Parts of the `garage` world (7): what the machine does when you stop. The lab's most important minute: suction ends, gas goes on forming and pushes out, even from a tight machine. Every figure of the room is an estimate (research §2.11: nobody measured this machine in a room), and nothing here is a time
// a person has, a dose, a level to stay under or a way to make the room fit (research §A.2, R5, R6). Nobody is in the picture. The model's box and the line on poisoning are said once, in the overview and the warning of the Sources; the sheets say what each part is.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const GARAGE_PARTS: PartInfo[] = [
  {
    id: 'closed-garage',
    scene: 'garage',
    category: 'structure',
    name: l('Garage fermé', 'Closed garage'),
    short: l(
      'Une pièce de 50 ou de 1 000 m³ d’air : le monoxyde y monte vite, et un garage garde ce gaz en couches.',
      'A room of 50 or 1,000 m³ of air: carbon monoxide climbs fast, and a garage holds this gas in layers.',
    ),
    description: lf(
      'Voici la pièce où la machine dort. Le livre suédois donne deux tailles de garage, 50 et 1 000 m³ d’air. Le modèle y met un mètre cube de gaz après l’arrêt, pris d’un exemple de ce livre sur une concentration dans l’air, et non d’une mesure : il monte à environ {ppm50} dans 50 m³ en une demi-heure, et à environ {ppm1000} dans 1 000 m³. Le gaz des tuyaux en compte 200 000 ppm. Le livre suédois ajoute que, dans un garage, le monoxyde n’est pas bien mélangé à l’air : il se tient en couches ou en zones bien plus concentrées. La boîte du modèle, elle, est bien mélangée, et ne voit pas ces zones. Le garage dessiné ajoute au volume d’air celui que le tracteur déplace, {machineM3}.',
      'Here is the room where the machine sleeps. The Swedish book gives two sizes of garage, 50 and 1,000 m³ of air. The model puts a cubic metre of gas in it after the stop, taken from that book’s example of a concentration in air and not from a measurement: it climbs to about {ppm50} in 50 m³ in half an hour, and to about {ppm1000} in 1,000 m³. The gas in the pipes holds 200,000 ppm. The Swedish book adds that, in a garage, carbon monoxide is not well mixed with the air: it sits in layers or in zones of far higher concentration. The model’s box is well mixed, and does not see those zones. The garage as drawn adds to the air’s volume the volume the tractor displaces, {machineM3}.',
    ),
    material: l('Murs enduits, portes en planches, plafond d’une dalle', 'Rendered walls, board doors, a slab ceiling'),
    specs: [
      sp('Tailles de la source', 'The source’s sizes', l('50 m³ et 1 000 m³ d’air', '50 m³ and 1,000 m³ of air')),
      sp(
        'Gaz des tuyaux',
        'Gas in the pipes',
        l('environ 200 000 ppm de monoxyde', 'about 200,000 ppm carbon monoxide'),
      ),
      sp('Un mètre cube après l’arrêt, 50 m³, 30 min', 'One cubic metre after a stop, 50 m³, 30 min', v('{ppm50}')),
      sp('Le même, 1 000 m³, 30 min', 'The same, 1,000 m³, 30 min', v('{ppm1000}')),
      sp('Volume déplacé par le tracteur', 'Volume displaced by the tractor', v('{machineM3}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un couvercle de remplissage qui fuit, une voiture garée dans un garage sous une pièce où l’on vit : le livre suédois dit que certains des pires accidents d’intoxication de Suède sont venus de ces circonstances.',
        check:
          'Une vraie pièce n’est jamais une boîte : les couches, les coins, un escalier, un plancher qui laisse passer le gaz, le modèle ne les a pas.',
        care: 'Ce lab ne décrit aucun arrangement de garage, et aucun ne rendrait la machine acceptable.',
      },
      {
        failure:
          'A filling lid that leaks, a car put into a garage under a living room: the Swedish book says that some of Sweden’s worst poisoning accidents came from such circumstances.',
        check:
          'A real room is never a box: the layers, the corners, a stair, a floor that lets the gas through, the model has none of them.',
        care: 'This lab describes no arrangement of a garage, and none would make the machine acceptable.',
      },
    ),
    tip: l(
      'Faites glisser le curseur du volume de gaz dans la Simulation : de 0,2 à 5 m³, le chiffre de la boîte change du tout au tout.',
      'Drag the gas volume slider in the Simulation: from 0.2 to 5 m³, the box’s figure changes entirely.',
    ),
    design: l(
      'Le garage est de ce lab, mais ses deux tailles sont du livre suédois. Rien d’autre n’a été mesuré : ni le volume de gaz après un arrêt, ni son rythme, ni l’air que laisse passer une porte. Le lab met ces trois inconnues en curseurs, et dit que ce sont des inconnues.',
      'The garage is the lab’s, but its two sizes are the Swedish book’s. Nothing else was measured: not the volume of gas after a stop, not its pace, not the air a door lets through. The lab puts those three unknowns on sliders, and says that they are unknowns.',
    ),
  },
  {
    id: 'garage-door',
    scene: 'garage',
    category: 'structure',
    name: l('Porte', 'Garage door'),
    short: l(
      'La porte fermée, entrouverte ou ouverte : le chiffre du modèle baisse, mais une porte ouverte n’est pas une réponse.',
      'The door shut, ajar or open: the model’s figure falls, but an open door is not an answer.',
    ),
    description: lf(
      'La porte a trois états. Dans le modèle, l’air qu’elle laisse passer est une hypothèse large : {achShut} porte fermée, {achAjar} entrouverte, {achOpen} ouverte. À 50 m³, au bout d’une demi-heure, le modèle compte environ {shut30} porte fermée, {ajar30} entrouverte, {open30} ouverte. Le chiffre baisse vite, car c’est ce qu’une boîte bien mélangée est faite pour dire. Les Suédois ont jugé très insuffisant de lancer le ventilateur ou le moteur portes de garage ouvertes : ce n’est pas une mesure de ce modèle, mais, dans la Simulation et sur les planches, le lab ne montre jamais la ligne de la porte ouverte sans cette phrase, et l’alarme de la Simulation la porte aussi.',
      'The door has three states. In the model, the air it lets through is a wide assumption: {achShut} with the door shut, {achAjar} ajar, {achOpen} open. At 50 m³, after half an hour, the model counts about {shut30} with the door shut, {ajar30} ajar, {open30} open. The figure falls fast, because that is what a well-mixed box is made to say. The Swedes found it far from satisfactory to fan or start with the garage doors open: that is not a measurement of this model, but in the Simulation and on the sheets the lab never shows the open door’s line without that sentence, and the Simulation’s alarm carries it too.',
    ),
    material: l('Deux battants de planches, ferrures de fer', 'Two board leaves, iron straps'),
    specs: [
      sp('Porte fermée, air par heure', 'Door shut, air changes per hour', v('{achShut}')),
      sp('Porte entrouverte, air par heure', 'Door ajar, air changes per hour', v('{achAjar}')),
      sp('Porte ouverte, air par heure', 'Door open, air changes per hour', v('{achOpen}')),
      sp(
        'À 50 m³, 30 min, porte fermée, entrouverte, ouverte',
        'At 50 m³, 30 min, door shut, ajar, open',
        lf('{shut30} · {ajar30} · {open30}', '{shut30} · {ajar30} · {open30}'),
      ),
    ],
    maintenance: maint(
      {
        failure: 'Se fier à une porte ouverte. Le lab ne donne aucune consigne d’aération.',
        check:
          'L’air qu’une porte laisse passer n’a été mesuré par personne : le modèle donne le bas, le milieu et le haut.',
        care: 'Aucune opération n’est décrite pour la porte.',
      },
      {
        failure: 'Relying on an open door. The lab gives no instruction about ventilating.',
        check: 'The air a door lets through was measured by no one: the model gives the low, the middle and the high.',
        care: 'No operation is described for the door.',
      },
    ),
    tip: l(
      'Passez la porte de fermée à ouverte dans la Simulation : le chiffre de la boîte tombe, et la mention du livre suédois reste affichée à côté.',
      'Change the door from shut to open in the Simulation: the box’s figure falls, and the Swedish book’s remark stays shown beside it.',
    ),
    design: l(
      'Une porte ouverte est ce qu’on essaie d’abord, et le chiffre de la boîte tombe : c’est ce qui rend la tentation forte. Le lab garde le chiffre et la phrase ensemble, pour que l’un ne se lise pas sans l’autre.',
      'An open door is what one tries first, and the box’s figure falls: that is what makes the temptation strong. The lab keeps the figure and the sentence together, so that one is not read without the other.',
    ),
  },
  {
    id: 'room-above',
    scene: 'garage',
    category: 'structure',
    name: l('Chambre au-dessus', 'Room above'),
    short: l(
      'La pièce que le livre suédois nomme : « par exemple sous une pièce à vivre ». Elle reçoit du gaz par le plancher, plus tard.',
      'The room the Swedish book names: “for instance under a living room”. It receives gas through the floor, later.',
    ),
    description: lf(
      'Au-dessus du garage, une chambre : un lit fait, une table de nuit, une fenêtre. Le livre suédois ne la décrit pas : il écrit seulement que certains des pires accidents du pays sont venus d’une voiture au couvercle qui fuyait, garée dans un garage sous une pièce à vivre. Le modèle lui donne {aboveM3}, un air renouvelé {aboveAch}, et un plancher qui laisse passer le gaz à un rythme que personne n’a mesuré, de {floorEx}. Dans le garage de 50 m³ porte fermée, elle monte à environ {abovePeak}, plus d’une heure après le plus haut du garage. Personne n’est dessiné dans cette chambre.',
      'Above the garage, a bedroom: a made bed, a bedside table, a window. The Swedish book does not describe it: it only writes that some of the country’s worst accidents came from a car with a leaking lid, parked in a garage under a living room. The model gives it {aboveM3}, air renewed {aboveAch}, and a floor that lets the gas through at a rate no one measured, {floorEx}. With the 50 m³ garage shut, it climbs to about {abovePeak}, more than an hour after the garage’s own highest. Nobody is drawn in this bedroom.',
    ),
    material: l('Dalle de plafond, lit, fenêtre', 'Ceiling slab, bed, window'),
    specs: [
      sp('Volume', 'Volume', v('{aboveM3}')),
      sp('Air renouvelé', 'Air renewed', v('{aboveAch}')),
      sp('Échange par le plancher', 'Exchange through the floor', v('{floorEx}')),
      sp('Plus haut, garage de 50 m³ fermé', 'Highest, 50 m³ garage shut', v('{abovePeak}')),
    ],
    maintenance: maint(
      {
        failure:
          'Du gaz qui monte par un plancher, un trou de plafond, une trappe : le livre suédois ne dit pas par où, et le modèle ne le sait pas.',
        check: 'Le monoxyde ne se voit pas et ne se sent pas, et une chambre où l’on dort n’a personne pour le sentir.',
        care: 'Aucune opération n’est décrite pour cette pièce.',
      },
      {
        failure:
          'Gas that climbs through a floor, a hole in a ceiling, a hatch: the Swedish book does not say where, and the model does not know.',
        check: 'Carbon monoxide cannot be seen or smelt, and a room where someone sleeps has no one awake to notice.',
        care: 'No operation is described for this room.',
      },
    ),
    tip: l(
      'Dans « Garage », la chambre monte en ppm après le garage, avec un retard : regardez les deux courbes de la Simulation.',
      'In “Garage”, the bedroom rises in ppm after the garage, with a delay: look at the Simulation’s two curves.',
    ),
    design: l(
      'La chambre est là pour dire que le danger du garage n’est pas que dans le garage. C’est la seule pièce du lab où quelqu’un dormirait, si le lab dessinait des gens.',
      'The bedroom is here to say that the garage’s danger is not only in the garage. It is the only room in the lab where someone would be asleep, if the lab drew people.',
    ),
  },
  {
    id: 'post-gas-plume',
    scene: 'garage',
    category: 'site',
    name: l('Panache après l’arrêt', 'Post-gas plume'),
    short: l(
      'Le moteur s’arrête, et la machine qui avait l’air étanche continue de pousser son gaz dehors : 23 à 27 % de monoxyde.',
      'The engine stops, and the machine that looked sealed goes on pushing its gas out: 23 to 27% carbon monoxide.',
    ),
    description: lf(
      'Le moteur s’arrête. En marche, tout le système était en dépression : une fuite aspirait de l’air. Maintenant, plus rien n’aspire, et le gaz continue de se former dans le lit chaud. La pression monte pendant environ 20 minutes selon le livre suédois, parfois des heures selon un autre manuel, et le gaz sort, même d’un appareil étanche. C’est du gaz de gazogène, de 23 à 27 % de monoxyde. Sur le bois, on l’a vu blanc ou jaune ; sur le charbon de bois, on ne le voyait pas. Personne n’a mesuré son volume sur cette machine : le modèle part de {postGas}, pris d’un exemple du livre suédois sur une concentration dans l’air, avec un curseur de 0,2 à 5 m³. Dans le modèle, la poussée s’affaiblit sans s’arrêter : c’est un choix du modèle, pas une mesure.',
      'The engine stops. When running, the whole system was under suction: a leak drew air in. Now nothing draws, and the gas goes on forming in the hot bed. The pressure rises for about 20 minutes by the Swedish book, sometimes for hours by another handbook, and the gas comes out, even from a tight apparatus. It is gasifier gas, 23 to 27% carbon monoxide. On wood it was seen white or yellow; on charcoal it could not be seen. No one measured its volume on this machine: the model starts from {postGas}, taken from the Swedish book’s example of a concentration in air, with a slider from 0.2 to 5 m³. In the model the push weakens without stopping: that is the model’s choice, not a measurement.',
    ),
    material: l('Gaz chaud, 23 à 27 % de monoxyde', 'Hot gas, 23 to 27% carbon monoxide'),
    specs: [
      sp('Monoxyde du gaz après l’arrêt', 'Carbon monoxide of the gas after a stop', l('23 à 27 %', '23 to 27%')),
      sp(
        'Durée de la poussée',
        'Duration of the push',
        l('environ 20 min ; parfois des heures', 'about 20 min; sometimes hours'),
      ),
      sp('Volume du modèle', 'The model’s volume', lf('{postGas}, de 0,2 à 5 m³', '{postGas}, from 0.2 to 5 m³')),
      sp('Pression après l’arrêt', 'Pressure after a stop', l('aucune source', 'no source')),
      sp('Couleur, sur le bois', 'Colour, on wood', l('blanc ou jaune', 'white or yellow')),
    ],
    maintenance: maint(
      {
        failure:
          'Le gaz de l’arrêt, avec un couvercle qui fuyait, dans un garage sous une pièce à vivre : le livre suédois range parmi les pires accidents du pays ceux qui en sont venus.',
        check:
          'Le monoxyde est incolore et sans odeur ; sa densité, 0,97 contre l’air, est presque celle de l’air : il se mêle à l’air de la pièce, et un garage le garde en couches (livre suédois). Aucun œil et aucun nez ne le jugent.',
        care: 'Aucune consigne, aucun délai. Les sources ne s’accordent pas sur la durée (une vingtaine de minutes, parfois des heures) : aucune ne dit à partir de quand une pièce n’en garde plus.',
      },
      {
        failure:
          'The gas of the stop, with a leaking lid, in a garage under a living room: the Swedish book ranks among the country’s worst accidents those that came from it.',
        check:
          'Carbon monoxide is colourless and odourless; its density, 0.97 against air, is almost air’s: it mixes into the room’s air, and a garage holds it in layers (Swedish book). No eye and no nose judges it.',
        care: 'No instruction, no delay. The sources do not agree on how long it lasts (about twenty minutes, sometimes hours): none says from when a room holds none of it.',
      },
    ),
    tip: l(
      'Lancez « Le moteur s’arrête » : en haut du gazogène et à la prise d’air, le gaz sort, et le couvercle se soulève de quelques millimètres.',
      'Run “The engine stops”: at the top of the gasifier and at the air intake, the gas comes out, and the lid lifts a few millimetres.',
    ),
    design: l(
      'Le panache est dessiné d’après le modèle : sa quantité suit le débit, sa couleur est celle du livre suédois pour le bois, sa forme est du lab. Le dessin dit combien sort, jamais comment cela se déplace. Les sources ne s’accordent pas sur la durée, et aucune ne dit quand une pièce n’en garde plus : c’est la phrase que ce lab ne peut pas écrire.',
      'The plume is drawn from the model: its quantity follows the flow, its colour is the Swedish book’s for wood, its shape is the lab’s. The drawing says how much comes out, never how it moves. The sources disagree on how long, and none says when a room holds none of it: that is the sentence this lab cannot write.',
    ),
  },
  {
    id: 'exhaust-plume',
    scene: 'garage',
    category: 'site',
    name: l('Gaz d’échappement', 'Exhaust plume'),
    short: l(
      'Un moteur de la guerre qui tourne dans un garage : au ralenti, 5 à 8 % de monoxyde sort par son échappement.',
      'A wartime engine running in a garage: at idle, 5 to 8% carbon monoxide comes out of its exhaust.',
    ),
    description: l(
      'Le moteur peut tourner dans le garage, et son échappement y entre. Au ralenti, le livre suédois a lu de 5 à 8 % de monoxyde de carbone dans l’échappement des moteurs de la guerre, soit 50 000 à 80 000 ppm : l’avant-dernier barreau de l’échelle publiée, juste sous le gaz des tuyaux. Le panache gris de la 3D n’existe que pendant que le moteur tourne, et il est à part de celui, blanc, de l’arrêt. Ce que le modèle ne sait pas dire, c’est ce qu’un vrai moteur de ce tracteur rejetait : il n’y a aucune mesure sur cette machine.',
      'The engine can run in the garage, and its exhaust enters it. At idle, the Swedish book read 5 to 8% carbon monoxide in the exhaust of wartime engines, that is 50,000 to 80,000 ppm: the second-to-last rung of the published ladder, just under the gas in the pipes. The 3D’s grey plume exists only while the engine runs, and it is apart from the white one of the stop. What the model cannot say is what a real engine of this tractor threw out: there is no measurement on this machine.',
    ),
    material: l('Gaz d’échappement', 'Exhaust gas'),
    specs: [
      sp('Monoxyde à l’échappement, au ralenti', 'Carbon monoxide in the exhaust, at idle', l('5 à 8 %', '5 to 8%')),
      sp('Le même en ppm', 'The same in ppm', l('50 000 à 80 000 ppm', '50,000 to 80,000 ppm')),
      sp('Mesure sur cette machine', 'Measurement on this machine', l('aucune', 'none')),
      sp('Dans la 3D', 'In the 3D', l('seulement quand le moteur tourne', 'only while the engine runs')),
    ],
    maintenance: maint(
      {
        failure: 'Un moteur qui tourne dans un local : c’est ce que dit une alarme de la Simulation.',
        check: 'La couleur d’un échappement ne dit rien du monoxyde : le nuage gris de la 3D n’en est pas la mesure.',
        care: 'Aucune opération n’est décrite pour l’échappement.',
      },
      {
        failure: 'An engine running in a room: it is what one of the Simulation’s alarms says.',
        check: 'An exhaust’s colour says nothing of carbon monoxide: the 3D’s grey cloud is not its measure.',
        care: 'No operation is described for the exhaust.',
      },
    ),
    tip: l(
      'Dans « Garage », le panache gris sort de l’échappement tant que le moteur tourne, puis s’éteint : c’est le blanc du gaz qui prend le relais.',
      'In “Garage”, the grey plume leaves the exhaust as long as the engine runs, then goes out: it is the white of the gas that takes over.',
    ),
    design: l(
      'Le livre suédois juge l’échappement d’un gazogène au ralenti bien plus dangereux que celui d’un moteur à essence. Le lab garde la seule chose que cette phrase permet de dessiner : un panache, et un ordre de grandeur.',
      'The Swedish book judges the exhaust of a gasifier at idle far more dangerous than that of a petrol engine. The lab keeps the only thing that sentence lets it draw: a plume, and an order of magnitude.',
    ),
  },
  {
    id: 'co-indicator',
    scene: 'garage',
    category: 'electrical',
    name: l('Indicateur de CO', 'CO indicator'),
    short: l(
      'Un cadran au mur : il prévient ceux qui sont là, il ne protège pas, et sa lampe, ici, ne s’éteint plus.',
      'A dial on the wall: it warns whoever is there, it does not protect, and its lamp, here, never goes out again.',
    ),
    description: l(
      'Sur le mur du fond, un indicateur à cadran : son aiguille suit le monoxyde de la boîte du modèle, sur une échelle logarithmique sans aucun chiffre, et sa lampe s’allume dès que le monoxyde a été dans la pièce. Dans ce lab, elle ne s’éteint plus : il n’y a pas de retour à la normale, parce que le chiffre bas d’une boîte ne dit rien d’une vraie pièce. Le livre suédois décrit des indicateurs de l’époque, à combustion catalytique, dont un modèle fixe servant d’alarme dans les garages ; le cadran dessiné ici est de nous et n’imite aucun d’eux. Un détecteur, ancien ou récent, prévient ceux qui sont là : il ne rend pas une machine acceptable, et il ne remplace rien.',
      'On the back wall, a dial indicator: its needle follows the carbon monoxide of the model’s box, on a logarithmic scale with no figures at all, and its lamp lights as soon as carbon monoxide has been in the room. In this lab it never goes out again: there is no return to normal, because the low figure of a box says nothing of a real room. The Swedish book describes indicators of the period, of the catalytic type, one of them a fixed model used as an alarm in garages; the dial drawn here is ours and copies none of them. A detector, old or new, warns whoever is there: it does not make a machine acceptable, and it replaces nothing.',
    ),
    material: l('Boîtier, cadran et lampe', 'Case, dial and lamp'),
    specs: [
      sp(
        'Valeur limite d’exposition professionnelle (fiche toxicologique de référence, France), sur 8 h, au travail',
        'Occupational exposure limit value (reference toxicological sheet, France), over 8 h, at work',
        '20 ppm',
      ),
      sp(
        'Même fiche, valeur limite sur de courtes périodes, au travail',
        'Same sheet, limit value over short periods, at work',
        '100 ppm',
      ),
      sp(
        'Alarmes conseillées dans les locaux de gazogènes professionnels',
        'Alarms advised in professional gasifier rooms',
        l('environ 25 et 50 ppm', 'about 25 and 50 ppm'),
      ),
      sp(
        'Lampe',
        'Lamp',
        l('allumée à vie une fois le monoxyde passé', 'lit for good once carbon monoxide has been there'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le cadran de ce lab n’imite aucun des indicateurs de l’époque que décrit le livre suédois (à combustion catalytique, dont un modèle fixe servant d’alarme dans les garages) : il ne dit rien de leur précision.',
        check:
          'La valeur limite de 20 ppm sur 8 heures, celle de la fiche toxicologique de référence, est faite pour un lieu de travail, et pas pour une chambre où l’on dort ; les limites diffèrent d’un pays à l’autre.',
        care: 'Aucune opération n’est décrite pour l’instrument.',
      },
      {
        failure:
          'This lab’s dial copies none of the indicators of the period that the Swedish book describes (of the catalytic type, one of them a fixed model used as an alarm in garages): it says nothing of their accuracy.',
        check:
          'The limit value of 20 ppm over 8 hours, the reference toxicological sheet’s, is made for a workplace, and not for a bedroom; limits differ from country to country.',
        care: 'No operation is described for the instrument.',
      },
    ),
    tip: l(
      'Dans « Garage », lancez « Le garage fermé » : l’aiguille monte, la lampe s’allume, et même quand l’aiguille retombe, elle reste allumée.',
      'In “Garage”, run “The closed garage”: the needle rises, the lamp lights, and even when the needle falls back, it stays lit.',
    ),
    design: l(
      'Aucune ligne de l’échelle publiée n’est un côté sur lequel se tenir : la plus basse est une limite de travail, pas une frontière pour le corps. Le cadran du lab n’a donc pas de zone verte, et sa lampe pas de retour : il montre ce que le modèle sait, et rien de ce qu’il ne sait pas.',
      'No line of the published ladder is a side to stand on: the lowest is a limit for work, not a border for the body. So the lab’s dial has no green zone, and its lamp no return: it shows what the model knows, and nothing of what it does not.',
    ),
  },
  {
    id: 'old-rescue-set',
    scene: 'garage',
    category: 'site',
    name: l('Appareil des années 1940', '1940s rescue set'),
    short: l(
      'Un appareil de secours de l’époque, au mur : de l’histoire, pas un conseil.',
      'A rescue set of the period, on the wall: history, not advice.',
    ),
    description: l(
      'À gauche, sur sa planche, un appareil de secours des années 1940. Les médecins suédois de l’époque soignaient les intoxiqués avec des méthodes qui s’appelaient Karbogen ou lobéline ; le livre suédois en parle dans son chapitre médical. Ce lab ne les décrit pas, et ne les recommande pas : ce sont des traitements des années 1940, pas des gestes d’aujourd’hui. Ce qu’il garde, c’est l’échelle de l’affaire : environ 10 000 cas chroniques enregistrés en Suède de 1941 à 1945, des cliniques ouvertes pour eux, dès 1941, à Sabbatsberg et ailleurs. L’appareil dessiné est une image de l’époque, sans mode d’emploi.',
      'On the left, on its board, a 1940s rescue set. The Swedish doctors of the day treated the poisoned with methods called Karbogen or lobeline; the Swedish book speaks of them in its medical chapter. This lab does not describe them, and does not recommend them: they are 1940s treatments, not gestures for today. What it keeps is the scale of the affair: about 10,000 chronic cases recorded in Sweden from 1941 to 1945, clinics opened for them, from 1941, at Sabbatsberg and elsewhere. The set drawn is a picture of the period, with no instructions.',
    ),
    material: l('Boîtier de bois et de métal, notre dessin', 'Wooden and metal case, our drawing'),
    specs: [
      sp('Traitements de l’époque', 'Treatments of the day', l('Karbogen, lobéline', 'Karbogen, lobeline')),
      sp(
        'Cas chroniques enregistrés',
        'Chronic cases recorded',
        l('environ 10 000, de 1941 à 1945', 'about 10,000, from 1941 to 1945'),
      ),
      sp('Cliniques', 'Clinics', l('Sabbatsberg, dès 1941, et d’autres', 'Sabbatsberg, from 1941, and others')),
      sp('Mode d’emploi', 'Instructions', l('aucun', 'none')),
    ],
    maintenance: maint(
      {
        failure: 'Rien n’est rapporté sur l’appareil lui-même dans ce que nous avons lu.',
        check:
          'Ce que disent les chiffres de l’époque : des milliers de cas enregistrés, et un petit nombre de troubles mentaux durables, d’après le livre suédois.',
        care: 'Aucun protocole : un traitement des années 1940 n’est pas un conseil. Ce qu’on fait aujourd’hui est dit une fois, dans l’avertissement des Sources.',
      },
      {
        failure: 'Nothing is reported of the set itself in what we read.',
        check:
          'What the figures of the day say: thousands of cases recorded, and a small number of lasting mental disorders, by the Swedish book.',
        care: 'No protocol: a 1940s treatment is not advice. What is done today is said once, in the Sources’ warning.',
      },
    ),
    tip: l(
      'La planche est au mur de gauche, derrière le tracteur : sélectionnez-la, et la caméra se place dans la pièce pour la lire de face.',
      'The board is on the left wall, behind the tractor: select it, and the camera moves into the room to read it face on.',
    ),
    design: l(
      'Ce lab garde l’appareil comme un document : il montre qu’on soignait, et ne dit rien de comment.',
      'This lab keeps the set as a document: it shows that people were treated, and says nothing of how.',
    ),
  },
];
