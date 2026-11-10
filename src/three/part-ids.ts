// The 67 parts of research §4, in one list: id, the world that registers it, and its name in both languages. `src/data/parts.ts` must carry the same ids (a test holds the registry to this list) and the hotspots of the worlds read their labels
// from here. Kebab-case, stable, unique across worlds. The names are the research's; a short name is for a label that has little room, and the part's sheet keeps the full one.

export type WorldId = 'farm' | 'tractor' | 'gasifier' | 'gas-train' | 'garage';

export interface PartName {
  id: string;
  world: WorldId;
  fr: string;
  en: string;
}

const row = (world: WorldId, id: string, fr: string, en: string): PartName => ({ id, world, fr, en });

export const PART_NAMES: PartName[] = [
  // ---- farm: the setting (10)
  row('farm', 'wood-gas-tractor', 'Tracteur à gaz de bois', 'Wood-gas tractor'),
  row('farm', 'chip-barn', 'Grange à plaquettes', 'Chip barn'),
  row('farm', 'drum-chipper', 'Déchiqueteuse', 'Drum chipper'),
  row('farm', 'chip-sieve', 'Crible', 'Chip sieve'),
  row('farm', 'clod-crusher', 'Brise-mottes', 'Clod crusher'),
  row('farm', 'farmhouse', 'Ferme', 'Farmhouse'),
  row('farm', 'farm-garage', 'Garage', 'Farm garage'),
  row('farm', 'ash-bin', 'Bac à cendres', 'Ash bin'),
  row('farm', 'condensate-barrel', 'Fût de condensats', 'Condensate barrel'),
  row('farm', 'field-ditch', 'Fossé', 'Field ditch'),

  // ---- tractor: the machine (13)
  row('tractor', 'tractor-chassis', 'Châssis', 'Tractor chassis'),
  row('tractor', 'cab', 'Cabine', 'Cab'),
  row('tractor', 'roof-rack', 'Galerie', 'Roof rack'),
  row('tractor', 'roof-headlights', 'Phares de toit', 'Roof headlights'),
  row('tractor', 'rear-wheels', 'Roues arrière', 'Rear wheels'),
  row('tractor', 'front-wheels', 'Roues avant', 'Front wheels'),
  row('tractor', 'diesel-engine', 'Moteur diesel', 'Diesel engine'),
  row('tractor', 'injection-pump', 'Pompe d’injection', 'Injection pump'),
  row('tractor', 'heat-shield', 'Écran thermique', 'Heat shield'),
  row('tractor', 'extra-governor', 'Régulateur ajouté', 'Extra governor'),
  row('tractor', 'left-consoles', 'Consoles', 'Left consoles'),
  row('tractor', 'gasifier-unit', 'Gazogène', 'Gasifier unit'),
  row('tractor', 'gas-line-run', 'Ligne de gaz', 'Gas line run'),

  // ---- gasifier: the sub-assembly, the journey (20)
  row('gasifier', 'spring-lid', 'Couvercle à ressort', 'Spring lid'),
  row('gasifier', 'fuel-casing', 'Corps à combustible', 'Fuel casing'),
  row('gasifier', 'chip-column', 'Colonne de plaquettes', 'Chip column'),
  row('gasifier', 'drying-zone', 'Zone de séchage', 'Drying zone'),
  row('gasifier', 'pyrolysis-zone', 'Zone de pyrolyse', 'Pyrolysis zone'),
  row('gasifier', 'oxidation-zone', 'Zone d’oxydation', 'Oxidation zone'),
  row('gasifier', 'reduction-zone', 'Zone de réduction', 'Reduction zone'),
  row('gasifier', 'fuel-baffle', 'Déflecteur', 'Fuel baffle'),
  row('gasifier', 'condensate-sleeve', 'Manchon de condensation', 'Condensate sleeve'),
  row('gasifier', 'condensate-drain', 'Purge', 'Condensate drain'),
  row('gasifier', 'eccentric-lock', 'Verrou à came', 'Eccentric lock'),
  row('gasifier', 'outer-casing', 'Enveloppe', 'Outer casing'),
  row('gasifier', 'air-intake', 'Prise d’air', 'Air intake'),
  row('gasifier', 'air-nozzles', 'Tuyères', 'Air nozzles'),
  row('gasifier', 'fire-box', 'Foyer', 'Fire box'),
  row('gasifier', 'throat-ring', 'Anneau de gorge', 'Throat ring'),
  row('gasifier', 'grate', 'Grille', 'Grate'),
  row('gasifier', 'grate-linkage', 'Commande de grille', 'Grate linkage'),
  row('gasifier', 'ash-pit', 'Cendrier', 'Ash pit'),
  row('gasifier', 'gas-outlet', 'Sortie de gaz', 'Gas outlet'),

  // ---- gas-train: where the energy goes (17)
  row('gas-train', 'hot-gas-pipe', 'Conduite de gaz chaud', 'Hot gas pipe'),
  row('gas-train', 'stop-valve', 'Vanne d’arrêt', 'Stop valve'),
  row('gas-train', 'starting-fan', 'Ventilateur de démarrage', 'Starting fan'),
  row('gas-train', 'fan-stack', 'Cheminée du ventilateur', 'Fan stack'),
  row('gas-train', 'primary-air-valve', 'Vanne d’air primaire', 'Primary-air valve'),
  row('gas-train', 'cyclone', 'Cyclone', 'Cyclone'),
  row('gas-train', 'filter-box', 'Caisson de filtre', 'Filter box'),
  row('gas-train', 'filter-bags', 'Manches', 'Filter bags'),
  row('gas-train', 'gas-cooler', 'Refroidisseur', 'Gas cooler'),
  row('gas-train', 'cooler-condensate-vessel', 'Bac de condensats', 'Condensate vessel'),
  row('gas-train', 'gas-air-mixer', 'Mélangeur', 'Gas-air mixer'),
  row('gas-train', 'gas-throttle', 'Papillon de gaz', 'Gas throttle'),
  row('gas-train', 'secondary-air-throttle', 'Papillon d’air', 'Secondary-air throttle'),
  row('gas-train', 'pilot-injector', 'Injecteur pilote', 'Pilot injector'),
  row('gas-train', 'cylinder-cutaway', 'Cylindre en coupe', 'Cylinder cutaway'),
  row('gas-train', 'exhaust-pipe', 'Échappement', 'Exhaust pipe'),
  row('gas-train', 'water-gauge', 'Manomètre à eau', 'Water gauge'),

  // ---- garage: what it does when you stop (7)
  row('garage', 'closed-garage', 'Garage fermé', 'Closed garage'),
  row('garage', 'garage-door', 'Porte', 'Garage door'),
  row('garage', 'room-above', 'Chambre au-dessus', 'Room above'),
  row('garage', 'post-gas-plume', 'Panache après l’arrêt', 'Post-gas plume'),
  row('garage', 'exhaust-plume', 'Gaz d’échappement', 'Exhaust plume'),
  row('garage', 'co-indicator', 'Indicateur de CO', 'CO indicator'),
  row('garage', 'old-rescue-set', 'Appareil de 1940', '1940s rescue set'),
];

const BY_ID = new Map(PART_NAMES.map((p) => [p.id, p]));

export const PART_IDS: string[] = PART_NAMES.map((p) => p.id);

export const idsOf = (world: WorldId): string[] => PART_NAMES.filter((p) => p.world === world).map((p) => p.id);

export function partName(id: string): { fr: string; en: string } {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`no such part: ${id}`);
  return { fr: p.fr, en: p.en };
}
