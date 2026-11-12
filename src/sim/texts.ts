import type { ChipGrade, DoorState } from './machine';
import type { EngineMode } from './motor';
import type { TruckLoad } from './reported';
import type { AlarmKey, PresetId, ScenarioId, ZoneId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit. Every figure from the model carries † or *; reported figures carry no mark. `texts.test.ts` reads the figures back against the runs, and forbids research references, any wording that promises safety, any imperative, any size of the hot parts, any time in a room.
// « This is a model » for the room is said once, in `ROOM_NOTE`. The warning itself, research §A.4, and the line on what to do in a poisoning are the lab's, not the simulation's: they stand on the lab's way in, written by the author, and are not repeated here.

export type Pair = readonly [string, string];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  engineShort: {
    text: ['Le moteur ne donne pas la puissance demandée', 'The engine cannot give the power asked'],
    severe: false,
  },
  gasTooPoor: {
    text: ['Gaz sous les 4,2 MJ/m³ que demandent les moteurs', 'Gas below the 4.2 MJ/m³ engines ask for'],
    severe: false,
  },
  moistureAboveLimit: {
    text: ['Plaquettes au-delà de la limite de 30 % de l’institut', 'Chips past the institute’s limit of 30 %'],
    severe: false,
  },
  moistureNoBurn: {
    text: [
      'Au-delà d’environ 40 %, selon le rapport, le gaz ne brûle plus',
      'Past about 40 %, the report says, the gas no longer burns',
    ],
    severe: true,
  },
  filterWet: {
    text: [
      'Gaz sous son point de rosée : toile mouillée, résistance multipliée par six',
      'Gas below its dew point: fabric wet, resistance six times over',
    ],
    severe: false,
  },
  filterHot: {
    text: ['Filtre au-delà des 300 °C que tient la toile de verre', 'Filter past the 300 °C the glass cloth takes'],
    severe: true,
  },
  filterAged: {
    text: ['La poussière a doublé la résistance du filtre', 'Dust has doubled the filter’s resistance'],
    severe: false,
  },
  airLeak: {
    text: ['De l’air atteint le gaz chaud : il le brûle', 'Air is reaching the hot gas: it burns it'],
    severe: true,
  },
  vesselOverfull: {
    text: [
      'Bac du refroidisseur trop plein : la seule panne grave de ce moteur est venue de là, probablement',
      'The cooler’s vessel overfull: this engine’s one serious failure probably came this way',
    ],
    severe: true,
  },
  gasOutAfterStop: {
    text: [
      'Moteur arrêté : plus d’aspiration, le gaz continue de se former et sort de l’appareil',
      'Engine stopped: no more suction, the gas goes on forming and leaves the unit',
    ],
    severe: true,
  },
  lidLeak: {
    text: [
      'Couvercle non étanche : l’appareil peut brûler comme un poêle et lâcher son gaz bien plus longtemps',
      'A lid that does not seal: the unit can burn like a stove and let its gas go for far longer',
    ],
    severe: true,
  },
  fanOut: {
    text: [
      'Ventilateur de démarrage : environ 200 L de monoxyde par minute',
      'Starting fan: about 200 L of carbon monoxide a minute',
    ],
    severe: true,
  },
  exhaustIndoors: {
    text: [
      'Moteur tournant dans un local : le livre suédois lit 5 à 8 % de monoxyde à l’échappement au ralenti, sur des moteurs de la guerre',
      'Engine running indoors: the Swedish book reads 5 to 8 % carbon monoxide in idling exhaust, on wartime engines',
    ],
    severe: true,
  },
  coWorkLimit: {
    text: [
      'Au-delà de la valeur limite d’exposition professionnelle de la fiche INRS sur 8 h, 20 ppm : les limites diffèrent d’un pays à l’autre',
      'Past the occupational exposure limit value in the INRS sheet (France) over 8 h, 20 ppm: limits differ from country to country',
    ],
    severe: true,
  },
  coShortLimit: {
    text: [
      'Au-delà de la valeur limite d’exposition professionnelle de la fiche INRS sur de courtes périodes, 100 ppm',
      'Past the occupational exposure limit value in the INRS sheet (France), short term, 100 ppm',
    ],
    severe: true,
  },
  coLadder: {
    text: ['Dans l’échelle des symptômes publiés', 'Inside the ladder of published symptoms'],
    severe: true,
  },
  coRoomAbove: {
    text: ['Le monoxyde a atteint la pièce du dessus', 'The carbon monoxide has reached the room above'],
    severe: true,
  },
  coDoorOpen: {
    text: [
      'Porte ouverte : le chiffre de cette boîte baisse. Les Suédois ont jugé très insuffisant de lancer le ventilateur ou le moteur portes de garage ouvertes',
      'Door open: this box’s number falls. The Swedes found it far from satisfactory to fan or start with the garage doors open',
    ],
    severe: true,
  },
  coNoAllClear: {
    text: [
      'Ce chiffre bas ne dit rien d’une vraie pièce, ni du moment où le gaz en serait parti',
      'This low number says nothing of a real room, nor of when the gas would be gone from it',
    ],
    severe: true,
  },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  'mf-1100': ['Tracteur Massey Ferguson 1100, gazogène F-5', 'Massey Ferguson 1100 tractor, F-5 gasifier'],
  'scania-l8050': ['Camion Scania L8050, le même système', 'Scania L8050 truck, the same system'],
};

export const MODE_TEXTS: Record<EngineMode, Pair> = {
  diesel: ['Gazole seul', 'Diesel alone'],
  dual: ['Gaz et filet de gazole', 'Gas with a thread of diesel'],
  spark: ['Gaz seul, à bougies', 'Gas alone, by spark'],
};

export const GRADE_TEXTS: Record<ChipGrade, Pair> = {
  unsieved: ['Non criblées', 'Unsieved'],
  '5-40': ['Criblées 5–40 mm', 'Sieved 5–40 mm'],
  '10-40': ['Criblées 10–40 mm', 'Sieved 10–40 mm'],
  '15-40': ['Criblées 15–40 mm', 'Sieved 15–40 mm'],
};

export const DOOR_TEXTS: Record<DoorState, Pair> = {
  shut: ['Porte fermée', 'Door shut'],
  ajar: ['Porte entrouverte', 'Door ajar'],
  open: ['Porte ouverte', 'Door open'],
};

export const TRUCK_TEXTS: Record<TruckLoad, Pair> = {
  empty: ['À vide', 'Empty'],
  'load-5t': ['5 t de charge', '5 t of load'],
  'load-8t': ['8 t de charge', '8 t of load'],
};

export const ZONE_TEXTS: Record<ZoneId, Pair> = {
  drying: ['Séchage', 'Drying'],
  pyrolysis: ['Pyrolyse', 'Pyrolysis'],
  oxidation: ['Oxydation', 'Oxidation'],
  reduction: ['Réduction', 'Reduction'],
  ash: ['Cendrier', 'Ash pit'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'measured-hour': {
    name: ['L’heure mesurée', 'The measured hour'],
    lesson: [
      'On donne au modèle la puissance et le régime du banc, 40 kW à 1 855 tr/min. Il trouve 34 kg † de plaquettes par heure, 5,3 MJ/Nm³ † contre 5,6 mesurés, et 21 % †. Le banc, lui, a pris à ce tracteur 41 kg de plaquettes et 2,2 kg de gazole en une heure : 221 kW † en entrée, 18 % à l’arbre. Le moteur du modèle brûle mieux que celui du banc, à peu près comme les autres moteurs du même livre, et son gazogène aussi : il n’atteint pas la table, et on ne l’y pousse pas.',
      'The model is given the bench’s power and speed, 40 kW at 1,855 rpm. It finds 34 kg † of chips an hour, 5.3 MJ/Nm³ † against 5.6 measured, and 21 % †. The bench took 41 kg of chips and 2.2 kg of diesel an hour from this tractor: 221 kW † going in, 18 % at the shaft. The model’s engine burns better than the bench’s, about as the other engines of the same book do, and so does its gasifier: it does not reach the table, and is not pushed there.',
    ],
  },
  'part-load': {
    name: ['La charge partielle', 'Part load'],
    lesson: [
      '29 kW à 1 440 tr/min. La courbe de l’institut a ici son meilleur point, environ 19 %. Le modèle place le sien au même endroit, entre 70 et 80 % de la charge, à 22 % †. La table imprime 5,3 % pour cette ligne : sa courbe montre 19, et 29 kW sur 151 kW † font 19 %. Une coquille, ou un autre essai.',
      '29 kW at 1,440 rpm. The institute’s curve has its best point here, about 19 %. The model puts its own at the same place, between 70 and 80 % of load, at 22 % †. The table prints 5.3 % for this line: its curve shows 19, and 29 kW out of 151 kW † makes 19 %. A misprint, or another test.',
    ],
  },
  idling: {
    name: ['Le ralenti', 'Idling'],
    lesson: [
      'Rien à l’arbre, et 8,5 kg de plaquettes avec 1,2 kg de gazole par heure : 55 kW † pour rien. Le frottement et le papillon en demandent 9 kW * environ. Le modèle en conclut que le reste traverse le moteur sans brûler : le livre suédois lit 5 à 8 % de monoxyde dans l’échappement au ralenti, sur d’autres moteurs, soit les deux tiers * de celui du gaz. Avec ce seul chiffre, le modèle trouve 7 kg * de plaquettes.',
      'Nothing at the shaft, and 8.5 kg of chips with 1.2 kg of diesel an hour: 55 kW † for nothing. Friction and the throttle ask about 9 kW *. The model concludes that the rest goes through the engine unburnt: the Swedish book reads 5 to 8 % carbon monoxide in idling exhaust, on other engines, which is two thirds * of what the gas held. With that one figure, the model finds 7 kg * of chips.',
    ],
  },
  'wet-chips': {
    name: ['Des plaquettes humides', 'Wet chips'],
    lesson: [
      'Les 8 % des essais, puis 20, 30, 40 % d’humidité. Le gaz perd sa valeur, 5,3, 5,0, 4,7, 4,4 MJ/Nm³ *, et les mêmes 40 kW demandent 57 kg * de plaquettes. L’institut s’arrêtait à 30 %, et disait qu’au-delà d’environ 40 % le gaz ne brûle plus. Le modèle descend aux 4,2 MJ/m³ que demandent les moteurs vers 45 % * si la chemise draine son eau, vers 40 % * sinon. Sa flamme ne s’éteint jamais : ce qui arrête un vrai foyer n’est pas dans ce modèle.',
      'The tests’ 8 %, then 20, 30, 40 % moisture. The gas loses its worth, 5.3, 5.0, 4.7, 4.4 MJ/Nm³ *, and it takes 57 kg * of chips for the same 40 kW. The institute stopped at 30 %, and said that past about 40 % the gas no longer burns. The model reaches the 4.2 MJ/m³ engines ask for near 45 % * if the jacket drains its water, near 40 % * if not. Its flame never goes out: what stops a real hearth is not in this model.',
    ],
  },
  fines: {
    name: ['Les fines', 'Fines'],
    lesson: [
      'Du crible le plus sévère aux plaquettes non criblées, à pleins gaz : la perte de pression du gazogène, mesurée, va de 0,08 à 0,18 bar. Sur un autre tracteur, la puissance était passée de 21 à 16,8 kW. Le modèle perd 10 % † sur ce tracteur-ci : il n’a que la pression. Le rapport dit que moins de la moitié du gain venait de la pression, et que le reste semblait venir de la qualité du gaz. Le modèle est d’accord sur la première moitié et muet sur la seconde.',
      'From the strictest sieve to unsieved chips, at full throttle: the gasifier’s pressure loss, measured, goes from 0.08 to 0.18 bar. On another tractor, the power went from 21 to 16.8 kW. The model loses 10 % † on this tractor: it has only the pressure. The report says less than half the gain came from pressure, and the rest seemed to come from the gas’s quality. The model agrees on the first half and is silent on the second.',
    ],
  },
  'filter-ageing': {
    name: ['Le filtre s’encrasse', 'The filter clogs'],
    lesson: [
      'Sur 3 000 km, soit 50 h à 60 km/h, la poussière double la résistance de la toile, comme sur le camion mesuré. Le moteur n’y perd que 3 % † : la toile pèse peu dans sa charge. Puis la toile se mouille : six fois plus de résistance d’un coup, 14 % * de puissance en moins par rapport au filtre neuf. Le gaz reste au-dessus de son point de rosée dans le filtre, et froid au moteur : chacun a sa raison.',
      'Over 3,000 km, 50 h at 60 km/h, dust doubles the cloth’s resistance, as on the truck measured. The engine loses only 3 % † for it: the cloth weighs little in its charge. Then the cloth gets wet: six times the resistance at once, 14 % * less power than on a new filter. The gas stays above its dew point in the filter, and cold at the engine: each has its reason.',
    ],
  },
  'three-engines': {
    name: ['Gaz et gazole, gazole seul, gaz seul', 'Gas with diesel, diesel alone, gas alone'],
    lesson: [
      'Le même moteur de 5,8 litres. Au gaz avec un filet de gazole, 51 kW mesurés, 55 kW † au modèle. Au gazole seul, 64 kW, mesurés. Au gaz seul, à bougies, le modèle trouve environ 31 kW * : personne n’a mesuré celui-ci, mais deux autres diesels convertis sont passés de 71 à 34 kW et de 42 à 19,6 kW. Un mètre cube de gaz et d’air ne contient que 2,5 MJ †, contre 3,8 pour l’essence et l’air : un tiers de perdu avant tout le reste, et le frottement ne diminue pas.',
      'The same 5.8-litre engine. On gas with a thread of diesel, 51 kW measured, 55 kW † by the model. On diesel alone, 64 kW, measured. On gas alone, by spark, the model finds about 31 kW *: nobody measured this one, but two other converted diesels went from 71 to 34 kW and from 42 to 19.6 kW. A cubic metre of gas and air holds only 2.5 MJ †, against 3.8 for petrol and air: a third gone before anything else, and friction does not shrink.',
    ],
  },
  'air-leak': {
    name: ['De l’air sous la grille', 'Air under the grate'],
    lesson: [
      'De l’air entre sous la zone de réduction et brûle ce qu’il rencontre. Le gaz tombe de 5,3 à 4,2 MJ/Nm³ *, et sa sortie passe de 240 à 470 °C * : le filtre dépasse les 300 °C que tient sa toile. La taille de cette fuite est une supposition. La direction ne l’est pas : plus chaud, plus faible.',
      'Air comes in below the reduction zone and burns what it meets. The gas falls from 5.3 to 4.2 MJ/Nm³ *, and its outlet goes from 240 to 470 °C *: the filter passes the 300 °C its cloth takes. The size of this leak is a guess. The direction is not: hotter, weaker.',
    ],
  },
  'working-shift': {
    name: ['Une journée de travail', 'A working day'],
    lesson: [
      'Huit heures à pleine charge : 274 kg * de plaquettes, une bonne partie portée sur le toit, neuf * arrêts pour remplir, de la cendre, de l’eau noire. Les durées des tableaux de l’institut font environ 13 minutes * de service par heure de travail. Le rapport l’estime à 15 à 25. Ses conducteurs habituels n’en ont pas voulu : ce sont des élèves de l’école d’agriculture qui ont conduit ce tracteur.',
      'Eight hours at full load: 274 kg * of chips, much of it carried on the roof, nine * stops to fill up, ash, black water. The durations of the institute’s tables come to about 13 minutes * of service per working hour. The report estimates 15 to 25. Its regular drivers would not have it: agricultural students drove this tractor.',
    ],
  },
  'engine-stops': {
    name: ['Le moteur s’arrête', 'The engine stops'],
    lesson: [
      'En marche, tout le système est en dépression : une fuite aspire de l’air. Le moteur s’arrête, l’aspiration finit, et le gaz continue de se former. La pression monte, environ 20 minutes selon le livre suédois, parfois des heures selon un autre, et le gaz sort, même d’un appareil étanche, à 23 à 27 % de monoxyde. Sur le bois, on l’a vu blanc ou jaune à la prise d’air. Personne n’a mesuré son volume sur cette machine : le mètre cube * d’ici vient d’un exemple du livre sur une concentration dans l’air, et rien de plus.',
      'Running, the whole system is under suction: a leak draws air in. The engine stops, the suction ends, and the gas goes on forming. The pressure rises, for about 20 minutes by the Swedish book, sometimes for hours by another, and the gas comes out, even from a tight unit, at 23 to 27 % carbon monoxide. On wood it has been seen white or yellow at the air intake. Nobody measured its volume on this machine: the cubic metre * here comes from the book’s example of a concentration in air, and no more.',
    ],
  },
  'closed-garage': {
    name: ['Le garage fermé', 'The closed garage'],
    lesson: [
      'Un mètre cube * de ce gaz dans un garage fermé de 50 m³ : la boîte monte à environ 3 500 ppm *, là où le gaz des tuyaux en compte 200 000. Dans 1 000 m³, environ 200 ppm *. Au-dessus, une pièce en reçoit par le plancher, sur une fuite supposée : elle monte à environ 670 ppm *, plus d’une heure après le plus haut du garage. Un couvercle qui ne ferme pas garde le gaz sortant tant qu’il y a du bois : deux heures après l’arrêt, de 5 000 à 50 000 ppm *, selon une fuite que personne n’a mesurée. Le livre suédois dit que certains des pires accidents du pays sont venus d’une voiture au couvercle qui fuyait, garée dans un garage sous une pièce à vivre. Une porte ouverte baisse le chiffre de la boîte ; les Suédois ont jugé très insuffisant de lancer le ventilateur ou le moteur portes ouvertes.',
      'A cubic metre * of this gas in a closed garage of 50 m³: the box climbs to about 3,500 ppm *, where the gas in the pipes holds 200,000. In 1,000 m³, about 200 ppm *. Above it, a room takes some through the floor, on a supposed leak: it climbs to about 670 ppm *, more than an hour after the garage’s own highest. A lid that does not seal keeps the gas coming while there is wood: two hours after the stop, from 5,000 to 50,000 ppm *, by a leak nobody measured. The Swedish book says some of the country’s worst accidents came from a car with a leaking lid, parked in a garage under a living room. An open door lowers the box’s number; the Swedes found it far from satisfactory to fan or start with the doors open.',
    ],
  },
  truck: {
    name: ['Le camion', 'The truck'],
    lesson: [
      'Le même système sur un camion de 8 t, à 60 km/h de moyenne. Mesuré : 7,8 kg de plaquettes et 0,55 kg de gazole pour 10 km, là où le gazole seul en demandait 2,87. Le modèle trouve 9,4 kg * et 0,51 kg *, et 81 % * de gazole économisé pour 81 % mesurés. Il est trop haut ici et trop bas sur le tracteur, parce que ces deux véhicules ne s’accordent pas : ce camion brûlait autant d’énergie au gaz qu’au gazole, à 4 % † près, le tracteur au banc environ un tiers * de plus.',
      'The same system on a truck carrying 8 t, at 60 km/h on average. Measured: 7.8 kg of chips and 0.55 kg of diesel per 10 km, where diesel alone asked 2.87. The model finds 9.4 kg * and 0.51 kg *, and 81 % * of the diesel saved against 81 % measured. It is high here and low on the tractor, because the two vehicles do not agree: this truck burned as much energy on gas as on diesel, to within 4 % †, the tractor on the bench about a third * more.',
    ],
  },
};

/** Said once, in the panel, beside the two marks. */
export const TAG_NOTE: Pair = [
  '† résultat du modèle ou calcul sur des chiffres publiés, là où cette machine a été mesurée. * estimation, ou le même modèle là où elle ne l’a pas été : au-delà de 20 % d’humidité, en panne, sur un autre moteur, et tout ce qui concerne le garage. Sans marque : publié.',
  '† a model result or a sum on published figures, where this machine was measured. * an estimate, or the same model where it was not: past 20 % moisture, in a fault, on another engine, and everything about the garage. No mark: published.',
];

/** Said once, at the room. */
export const ROOM_NOTE: Pair = [
  'Ceci est une boîte bien mélangée, pas un garage. Le livre suédois dit qu’un garage garde le monoxyde en couches, à des concentrations bien plus fortes : la boîte ne les voit pas, et une vraie pièce peut être pire que son chiffre. Sa fourchette ne porte que sur l’aération supposée. Personne n’a mesuré cette machine dans une pièce. La boîte ne dit jamais qu’une pièce convient, ni à partir de quand.',
  'This is a well-mixed box, not a garage. The Swedish book says a garage holds carbon monoxide in layers, at far stronger concentrations: the box does not see them, and a real room can be worse than its number. Its span covers only the supposed ventilation. Nobody measured this machine in a room. The box never says that a room is fit, nor from when.',
];

/** Beside the ladder, when the box stands under its first rung. */
export const BELOW_LADDER: Pair = [
  'Sous le premier barreau de cette échelle, dans cette boîte. Cela ne dit rien d’une vraie pièce.',
  'Under the first rung of this ladder, in this box. That says nothing of a real room.',
];

/** Beside the outlet's figure, once. */
export const OUTLET_NOTE: Pair = [
  'La température de sortie est tenue dans la bande du rapport par une estimation : ce n’est pas un résultat.',
  'The outlet temperature is held in the report’s band by an estimate: it is not a result.',
];
