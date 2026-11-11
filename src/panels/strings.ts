import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import {
  ALARM_TEXTS,
  DOOR_TEXTS,
  GRADE_TEXTS,
  MODE_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  TRUCK_TEXTS,
  ZONE_TEXTS,
  type Pair,
} from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. The alarms, the scenarios and the names of the machine, the engine modes, the sieves, the doors and the zones are the simulation's (src/sim/texts.ts), read here by `sx`.
// What is said once stays where it is said: the marks in `TAG_NOTE` (the panel's first lines), the box that is not a garage in `ROOM_NOTE` (the room's section). The warning, the refusals and « not a plan » are not repeated here: they are the entry notice's, the Sources panel's and the guides'.
// Nothing here is a size of the hot parts, a hearth load, a pilot or a timing, a dose or a time left for a person; `src/panels/sim.test.ts` holds the words of the panel, in both languages, against the same lists as the sheets.

export const PANEL = {
  simHeading: ['Simulation', 'Simulation'],
  simIntro: [
    'La machine de l’institut suédois qui travaille : le gaz, le moteur, le filtre, et ce que devient une pièce quand elle s’arrête. Le modèle n’est réglé sur aucun chiffre : là où il s’écarte des mesures, le scénario ou la fiche le dit. Ici, on change des conditions de marche, jamais une pièce.',
    'The Swedish institute’s machine at work: the gas, the engine, the filter, and what becomes of a room when it stops. The model is set to no figure: where it differs from the measurements, the scenario or the sheet says so. Here you change working conditions, never a part.',
  ],
  preset: ['Machine', 'Machine'],
  presetMf: ['Tracteur MF 1100', 'MF 1100 tractor'],
  presetScania: ['Camion Scania L8050', 'Scania L8050 truck'],
  custom: ['Autres réglages', 'Other settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chaque scénario raconte une chose : choisissez-en un, puis changez ce que vous voulez.',
    'Each scenario tells one thing: pick one, then change whatever you like.',
  ],
  speedHint: [
    'L’horloge s’ouvre à une minute par seconde : une soute de plaquettes se vide en trois quarts de minute environ, et les vingt minutes qui suivent un arrêt passent en vingt secondes. La barre du bas change la vitesse.',
    'The clock opens at a minute a second: a bunker of chips empties in about three quarters of a minute, and the twenty minutes after a stop pass in twenty seconds. The bottom bar changes the speed.',
  ],

  // ---- the status line, under the scenario
  statusRunning: [
    'En marche : le moteur tourne et tout le système est en dépression, une fuite aspirerait de l’air.',
    'Running: the engine turns and the whole system is under suction, a leak would draw air in.',
  ],
  statusDiesel: [
    'Gazole seul : le moteur n’emploie pas le gazogène, qui ne fournit rien.',
    'Diesel alone: the engine does not use the gasifier, which supplies nothing.',
  ],
  statusStopped: [
    'Moteur arrêté : l’aspiration a cessé, le gaz continue de se former et sort de l’appareil, même étanche. Le modèle ne dit pas quand cela finit.',
    'Engine stopped: suction has ended, the gas goes on forming and comes out of the unit, even a tight one. The model does not say when it ends.',
  ],

  // ---- the live figures
  moreTitle: ['Plus de chiffres', 'More figures'],
  moreWood: ['Bois qui entre', 'Wood going in'],
  moreDiesel: ['Gazole qui entre', 'Diesel going in'],
  moreShaft: ['Travail à l’arbre', 'Work at the shaft'],
  moreLoss: ['Pertes en tout', 'Losses in all'],
  moreColdGas: ['Rendement du gazogène, gaz froid', 'Gasifier efficiency, cold gas'],
  moreGasFlow: ['Gaz produit', 'Gas made'],
  moreCO2: ['CO₂ dans le gaz', 'CO₂ in the gas'],
  moreH2: ['H₂ dans le gaz', 'H₂ in the gas'],
  moreCH4: ['CH₄ dans le gaz', 'CH₄ in the gas'],
  moreDew: ['Point de rosée du gaz', 'Dew point of the gas'],
  moreFilterT: ['Gaz au filtre', 'Gas at the filter'],
  moreCoolerT: ['Gaz après le refroidisseur', 'Gas after the cooler'],
  moreCasing: ['Enveloppe du gazogène', 'Gasifier casing'],
  moreBunker: ['Soute pleine', 'Bunker full'],
  moreBunkerMin: ['Autonomie de la soute', 'The bunker lasts'],
  moreTar: ['Goudron mesuré à cette charge', 'Tar measured at this load'],
  moreMixture: ['Énergie du mélange', 'Energy of the mixture'],
  moreVsPetrol: ['Perdu contre l’essence', 'Lost against petrol'],

  // ---- the conditions
  secConditions: ['Conditions de marche', 'Working conditions'],
  load: ['Charge', 'Load'],
  loadUnit: ['% du maximum de l’essai', '% of the test maximum'],
  fullPower: [
    'Pleins gaz, au régime de la puissance mesurée la plus haute',
    'Full throttle, at the speed of the highest power measured',
  ],
  engineMode: ['Moteur', 'Engine'],
  engineOn: ['Moteur en marche', 'Engine running'],
  moisture: ['Humidité des plaquettes', 'Chip moisture'],
  chipGrade: ['Criblage des plaquettes', 'Sieving of the chips'],
  ambient: ['Température de l’air', 'Air temperature'],
  truckLoad: ['Charge du camion', 'Truck load'],
  conditionsHint: [
    'Une humidité au-delà de 20 % sort de ce qu’on a mesuré sur cette machine : le modèle y continue, et ses chiffres y prennent une étoile.',
    'A moisture past 20 % leaves what was measured on this machine: the model goes on, and its figures take a star.',
  ],

  // ---- the faults
  secFaults: ['Le filtre et les pannes', 'The filter and the faults'],
  filterHours: ['Heures depuis le nettoyage du filtre', 'Hours since the filter was cleaned'],
  filterAges: ['Le filtre vieillit tout seul', 'The filter ages by itself'],
  filterWetFault: ['Toile mouillée (une panne)', 'Wet cloth (a fault)'],
  airLeak: ['Air sous la grille (une panne)', 'Air under the grate (a fault)'],
  vesselNeglected: [
    'Bac de condensats du refroidisseur jamais vidé (une panne)',
    'Cooler condensate vessel never emptied (a fault)',
  ],
  faultsHint: [
    'Chaque panne est un cas que le rapport décrit : la direction vient de lui, la taille de la fuite est une supposition.',
    'Each fault is a case the report describes: the direction comes from it, the size of the leak is a guess.',
  ],

  // ---- the journey of a chip
  secJourney: ['Le voyage d’une plaquette', 'The journey of a chip'],
  journeyLabel: ['Position du curseur', 'Cursor position'],
  journeyHint: [
    'Le curseur suit une plaquette et un analyseur lit le gaz autour d’elle. Le curseur range les zones dans l’ordre, pas à l’échelle, exprès ; la coupe du monde « Gazogène », elle, est à l’échelle. La température et le gaz de chaque point sont des estimations, sauf aux deux bouts.',
    'The cursor follows one chip and an analyser reads the gas around it. The cursor puts the zones in order, not to scale, on purpose; the section in the “Gasifier” world is to scale. The temperature and gas at each point are estimates, except at the two ends.',
  ],
  seeInGasifier: ['Voir dans le gazogène', 'See it in the gasifier'],
  anZone: ['Zone', 'Zone'],
  anChipT: ['Plaquette', 'Chip'],
  anWater: ['Eau qui lui reste', 'Water it still holds'],
  anMass: ['Matière sèche qui lui reste', 'Dry matter it still holds'],
  anGasT: ['Gaz autour', 'Gas around it'],
  anCO: ['CO', 'CO'],
  anH2: ['H₂', 'H₂'],
  anCH4: ['CH₄', 'CH₄'],
  anCO2: ['CO₂', 'CO₂'],
  anH2O: ['Vapeur d’eau', 'Water vapour'],
  anN2: ['N₂', 'N₂'],
  anO2: ['O₂', 'O₂'],
  anTar: ['Vapeurs de goudron, contre leur pic', 'Tar vapour, against its peak'],

  // ---- the room
  secRoom: ['Le garage et la pièce au-dessus', 'The garage and the room above'],
  place: ['Où est la machine', 'Where the machine is'],
  placeField: ['Aux champs', 'In the fields'],
  placeGarage: ['Au garage', 'In the garage'],
  garageVolume: ['Volume du garage', 'Garage volume'],
  door: ['Porte', 'Door'],
  postGasVolume: ['Gaz qui sort après l’arrêt', 'Gas that comes out after the stop'],
  postGasMinutes: ['Durée de cette sortie', 'Duration of that outflow'],
  lidLeak: ['Couvercle qui ne ferme pas (une panne)', 'Lid that does not seal (a fault)'],
  fanSource: ['Le ventilateur de démarrage comme source', 'The starting fan as a source'],
  roomHint: [
    'La pièce ne reçoit du gaz que si la machine y est : choisissez « Au garage », ou le scénario du garage fermé. Le mètre cube que l’arrêt laisse sortir n’est pas une mesure, il vient d’un exemple de livre : bougez-le et regardez ce que devient le chiffre. La sortie dure de l’ordre de 20 minutes d’après un livre, parfois des heures d’après un autre : aucune source ne dit à partir de quand une pièce n’en garde plus, et, dans le modèle, la poussée s’affaiblit sans s’arrêter : c’est un choix du modèle.',
    'The room gets gas only if the machine is in it: choose “In the garage”, or the closed garage scenario. The cubic metre the stop lets out is no measurement, it comes from a book’s example: move it and watch what becomes of the figure. The outflow lasts about 20 minutes by one book and sometimes hours by another: no source says from when a room holds none of it, and in the model the push weakens without stopping: that is the model’s choice.',
  ],
  roomCoGarage: ['CO dans la boîte « garage »', 'CO in the “garage” box'],
  roomCoAbove: ['CO dans la boîte « pièce au-dessus »', 'CO in the “room above” box'],
  roomSince: ['Depuis l’arrêt', 'Since the stop'],
  roomPlume: ['Gaz qui sort de l’appareil', 'Gas leaving the unit'],
  roomPlumeCo: ['dont CO', 'of which CO'],
  roomLadder: ['Plus haut barreau publié atteint', 'Highest published rung reached'],
  roomEmpty: ['Aucun monoxyde n’est encore entré dans la boîte.', 'No carbon monoxide has entered the box yet.'],
  roomRangeNote: [
    'Chaque chiffre est une fourchette : elle ne couvre que l’aération supposée de la porte et du plancher, pas l’inconnu de la source.',
    'Each figure is a span: it covers only the supposed ventilation of the door and the floor, not the unknown of the source.',
  ],

  // ---- the charts
  secCharts: ['Les courbes', 'The curves'],
  chartPower: ['Puissance à l’arbre', 'Power at the shaft'],
  chartTemps: ['Températures', 'Temperatures'],
  chartFilter: ['Perte de pression du filtre', 'Pressure loss of the filter'],
  chartRoom: ['Monoxyde dans les boîtes', 'Carbon monoxide in the boxes'],
  chartRoomHint: [
    'Échelle logarithmique : chaque graduation est dix fois la précédente. Les deux traits fins de la boîte du garage sont l’aération supposée la plus faible et la plus forte.',
    'Logarithmic scale: each tick is ten times the one before. The two thin lines of the garage box are the least and the most ventilation assumed.',
  ],
  serPower: ['Puissance', 'Power'],
  serOutlet: ['Sortie du gazogène', 'Gasifier outlet'],
  serFilter: ['Gaz au filtre', 'Gas at the filter'],
  serCasing: ['Enveloppe', 'Casing'],
  serDrop: ['Filtre', 'Filter'],
  serGarage: ['Garage', 'Garage'],
  serGarageLow: ['Garage, aération forte', 'Garage, most ventilation'],
  serGarageHigh: ['Garage, aération faible', 'Garage, least ventilation'],
  serAbove: ['Pièce au-dessus', 'Room above'],
  minutes: ['min', 'min'],
  hours: ['h', 'h'],
  noData: ['La courbe commence avec la course.', 'The curve begins with the run.'],
} as const satisfies Record<string, readonly [string, string]>;

/** The alarms the strip leaves to the panel: a remark on the door that no chip can carry with its source (the Swedes found it far from satisfactory to fan or start with the doors open), and which the panel's list says whole. */
export type PanelOnly = 'coDoorOpen';
export const PANEL_ONLY: readonly PanelOnly[] = ['coDoorOpen'];

/** The alarm of the bottom strip is one line: a short form of each. The ones the garage raises together (the engine's gas, the ladder, the room above) stand in about 500 px at 1280, what four values leave the alarms in the kit's strip, so theirs are the shortest. The panel keeps the sentence (src/sim/texts.ts), and `sim.test.ts` holds that the two lists have the same keys and the garage's budget. */
export const STRIP_ALARMS: Record<Exclude<keyof typeof ALARM_TEXTS, PanelOnly>, Pair> = {
  engineShort: ['Puissance demandée non atteinte', 'Power asked not reached'],
  gasTooPoor: ['Gaz sous 4,2 MJ/m³', 'Gas below 4.2 MJ/m³'],
  moistureAboveLimit: ['Plaquettes au-delà de 30 %', 'Chips past 30 % moisture'],
  moistureNoBurn: ['Selon le rapport, le gaz ne brûle plus', 'The report says the gas no longer burns'],
  filterWet: ['Toile mouillée : résistance × 6', 'Cloth wet: resistance × 6'],
  filterHot: ['Filtre au-delà de 300 °C', 'Filter past 300 °C'],
  filterAged: ['Poussière : résistance du filtre × 2', 'Dust: the filter’s resistance × 2'],
  airLeak: ['De l’air brûle le gaz chaud', 'Air is burning the hot gas'],
  vesselOverfull: ['Bac du refroidisseur trop plein', 'Cooler vessel overfull'],
  gasOutAfterStop: ['Le gaz sort encore', 'Gas still comes out'],
  lidLeak: ['Couvercle non étanche', 'Lid does not seal'],
  fanOut: ['Ventilateur : 200 L de CO/min', 'Starting fan: 200 L of CO/min'],
  exhaustIndoors: ['Moteur tournant dans un local', 'Engine running indoors'],
  coWorkLimit: ['Plus de 20 ppm', 'Over 20 ppm'],
  coShortLimit: ['Plus de 100 ppm', 'Over 100 ppm'],
  coLadder: ['Symptômes publiés', 'Published symptoms'],
  coRoomAbove: ['CO au-dessus', 'CO above'],
  coNoAllClear: ['Un chiffre bas ne dit rien', 'A low number says nothing'],
};

registerStrings(PANEL);

export type PanelKey = keyof typeof PANEL;

/** A word of the panel, in the language of the moment. */
export const st = (key: PanelKey): string => tx(key);

/** A pair of the simulation's, in the language of the moment. */
export const say = (p: Pair): string => p[getLang() === 'fr' ? 0 : 1];

type Family = {
  preset: keyof typeof PRESET_TEXTS;
  scenario: keyof typeof SCENARIO_TEXTS;
  lesson: keyof typeof SCENARIO_TEXTS;
  alarm: keyof typeof ALARM_TEXTS;
  mode: keyof typeof MODE_TEXTS;
  grade: keyof typeof GRADE_TEXTS;
  door: keyof typeof DOOR_TEXTS;
  truck: keyof typeof TRUCK_TEXTS;
  zone: keyof typeof ZONE_TEXTS;
};

/** The simulation's own words by family and id: `sx('scenario', 'idling')`. */
export function sx<K extends keyof Family>(kind: K, id: Family[K]): string {
  const maps: Record<keyof Family, (id: never) => Pair> = {
    preset: (i: Family['preset']) => PRESET_TEXTS[i],
    scenario: (i: Family['scenario']) => SCENARIO_TEXTS[i].name,
    lesson: (i: Family['lesson']) => SCENARIO_TEXTS[i].lesson,
    alarm: (i: Family['alarm']) => ALARM_TEXTS[i].text,
    mode: (i: Family['mode']) => MODE_TEXTS[i],
    grade: (i: Family['grade']) => GRADE_TEXTS[i],
    door: (i: Family['door']) => DOOR_TEXTS[i],
    truck: (i: Family['truck']) => TRUCK_TEXTS[i],
    zone: (i: Family['zone']) => ZONE_TEXTS[i],
  };
  return say(maps[kind](id as never));
}

/** A number the way the language writes it: 7,5 and 5 700 in French, 7.5 and 5,700 in English; a true minus sign. */
export function num(x: number, digits = 0): string {
  const s = getLang() === 'fr' ? nFr(x, digits) : nEn(x, digits);
  return s.replace('-', '−');
}
