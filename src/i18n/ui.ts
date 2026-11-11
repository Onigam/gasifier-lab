import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit; the simulation panel's words are in src/panels/strings.ts. This file holds the frame's words for this lab: the title, the worlds and their shortcuts, the intros of the
// Drawings and Lessons modes, the notices of the Sources panel (the warning, the reconstruction, how to read the figures, the law, what the model does not find), each said once, here (docs/research.md §A.4, §7), and the notice on the way in (research Q5: the warning once on entering, as well as at the top of the Sources panel and in the garage's overview).
// « Not for construction » is said by the title block of every sheet, once per sheet.

export const LAB_STRINGS = {
  // the top bar shows about 60 capitals at 1280 px and cuts the rest: the longer line is for the showcase, in public/lab.json
  // mixed case, as written: the kit lower-cases a title that is all capitals (« f-5 »)
  labTitle: ['Labo du gazogène F-5', 'F-5 Wood Gasifier Lab'],
  tagline: [
    'Un tracteur suédois au bois : comment, et ce que ça coûtait',
    'A Swedish tractor on wood: how it worked, and what it cost',
  ],

  // ---- the worlds and the shortcuts between them
  sceneFarm: ['La ferme', 'The farm'],
  sceneTractor: ['Le tracteur', 'The tractor'],
  sceneGasifier: ['Le gazogène', 'The gasifier'],
  sceneGasTrain: ['La ligne de gaz', 'The gas line'],
  sceneGarage: ['Le garage', 'The garage'],
  goFarm: ['Voir la ferme et son bois', 'See the farm and its wood'],
  goTractor: ['Voir le tracteur et son système', 'See the tractor and its system'],
  goGasifier: ['Ouvrir le gazogène en coupe', 'Open the gasifier in section'],
  goGasTrain: ['Suivre le gaz jusqu’au moteur', 'Follow the gas to the engine'],
  goGarage: ['Voir ce qui se passe à l’arrêt', 'See what happens at a stop'],
  goSimulation: ['Ouvrir la simulation', 'Open the simulation'],

  // ---- the kit's pill when no alarm is on says « Tout fonctionne » / « All good »: a model that raises no alert has said nothing about a room. `registerStrings` overwrites a common key
  allGood: ['Aucune alerte', 'No alert'],

  // ---- the intros
  plansIntro: [
    'Dix planches A3 générées à partir des dimensions du modèle 3D et des résultats de la simulation : la machine, le chemin du gaz, le gazogène en coupe, les zones, le bilan d’énergie, la puissance du moteur, une journée de travail, l’échelle du monoxyde, l’arrêt dans un garage, la guerre et ses incendies. Ce sont des schémas explicatifs, avec des cotes d’ensemble seulement : aucun n’est un plan de construction.',
    'Ten A3 sheets generated from the dimensions of the 3D model and the results of the simulation: the machine, the gas’s path, the gasifier in section, the zones, the energy balance, the engine’s power, a working day, the carbon monoxide ladder, the stop in a garage, the war and its fires. They are explanatory diagrams, with overall sizes only: none is a construction drawing.',
  ],
  lessonsIntro: [
    'Sept leçons, chacune ouverte sur un scénario de la simulation, qui les parcourent tous les douze : la flamme qui ne touche pas le bois, le gaz qui tue, le voyage d’une plaquette, ce que reçoit le moteur, un gaz sale, où va l’énergie, ce que coûte une journée. Le cœur est dans la deuxième.',
    'Seven lessons, each opening on a scenario of the simulation, going through all twelve: the flame that does not touch the wood, the gas that kills, the journey of a chip, what the engine gets, a dirty gas, where the energy goes, what a day costs. The heart is in the second.',
  ],

  // ---- the notices of the Sources panel, each said once
  // not `warning`: that is a key of the kit (the label of a guide step's warning), which `registerStrings` would overwrite
  warningFull: [
    'Un gazogène fabrique du monoxyde de carbone, c’est sa raison d’être. Environ un cinquième du gaz dans ces tuyaux en est fait : il ne se voit pas, il ne se sent pas, et il a tué des gens qui faisaient attention. Ce lab explique une machine de l’histoire. Ce n’est ni un plan, ni une procédure, ni un conseil, et rien ici ne montre qu’en construire ou en faire tourner une serait acceptable ou permis. Certaines cotes et tous les gestes sont absents, volontairement. En cas de doute sur une intoxication : à l’air libre, on ne retourne pas à l’intérieur, on appelle le 112 (le 15 en France, le 144 en Suisse).',
    'A gasifier makes carbon monoxide: that is what it is for. About a fifth of the gas in these pipes is made of it: it cannot be seen, it cannot be smelt, and it has killed people who were being careful. This lab explains a machine from history. It is not a plan, a procedure or advice, and nothing here shows that building or running one would be acceptable or allowed. Some dimensions and every gesture are left out, on purpose. If you suspect poisoning: get into the open air, do not go back in, call 112 (15 in France, 144 in Switzerland).',
  ],
  // ---- the notice on the way in (research Q5): the warning in full, then the other hazards, each once, and the button that closes it. Shown once per browser; nothing here softens it
  entryEyebrow: ['Avant d’entrer', 'Before you go in'],
  entryTitle: ['Ce lab parle d’un gaz qui tue', 'This lab is about a gas that kills'],
  entryGarage: [
    'À l’arrêt du moteur, le gaz continue de se former et de sortir, même d’une machine qui paraissait étanche : en Suède, certains des pires accidents sont venus d’un garage fermé, et une porte ouverte n’y a pas suffi.',
    'When the engine stops, the gas goes on forming and coming out, even from a machine that looked tight: in Sweden, some of the worst accidents came from a closed garage, and an open door was not enough.',
  ],
  entryFire: [
    'De l’air qui rencontre le gaz, sous le couvercle, dans un appareil froid ou dans un filtre qui en garde, peut prendre feu ou exploser : un retour de flamme dans le filtre peut être violent.',
    'Air meeting the gas, under the lid, in a cold unit or in a filter that still holds some, can catch fire or explode: a backfire into the filter can be violent.',
  ],
  entryBurns: [
    'Le corps de l’appareil est brûlant, la cendre aussi, et une herbe sèche à côté peut s’enflammer.',
    'The body of the unit is scorching, so is the ash, and dry grass beside it can catch fire.',
  ],
  entryEnter: ['J’ai lu, entrer dans le lab', 'I have read this, enter the lab'],
  refusalsTitle: ['Ce que ce lab ne donne pas, exprès', 'What this lab does not give, on purpose'],
  disclaimer: [
    'Reconstitution pédagogique indépendante d’un gazogène de l’histoire : ce n’est ni un plan officiel, ni le produit de ses constructeurs, et il n’y a aucune affiliation. Aucune image, aucun extrait et aucun dessin d’une source n’est repris : les figures sont redessinées à partir de nombres. Massey Ferguson, Perkins et Scania sont des noms de constructeurs cités par les sources, sans lien, sans logo.',
    'An independent educational reconstruction of a gasifier from history: it is neither an official drawing, nor a product of its makers, and there is no affiliation. No image, clip or drawing from any source is reused: the figures are redrawn from numbers. Massey Ferguson, Perkins and Scania are names of makers cited by the sources, with no link and no logo.',
  ],
  noticeReading: [
    'Comment lire les chiffres. Sans marque : publié par une source, nommée en toutes lettres. † : calculé sur des chiffres publiés, ou résultat du modèle là où cette machine a été mesurée. * : estimation, ou le même modèle là où elle ne l’a pas été : au-delà de 20 % d’humidité, en panne, sur un autre moteur, et tout ce qui concerne le garage et la ferme. Le modèle n’est jamais réglé pour retrouver une mesure : quand il s’en écarte, la fiche le dit.',
    'How to read the figures. No mark: published by a source, named in words. †: computed on published figures, or a result of the model where this machine was measured. *: an estimate, or the same model where it was not: past 20% moisture, in a fault, on another engine, and everything about the garage and the farm. The model is never set to match a measurement: when it differs, the sheet says so.',
  ],
  lawTitle: ['Le droit', 'The law'],
  legal: [
    'Une telle installation, et toute transformation d’un véhicule, relèvent des règles de votre pays : renseignez-vous auprès de vos autorités avant toute autre chose. Rien ici ne dit qu’elles seraient permises, et personne n’a fait vérifier cette phrase par un juriste.',
    'Such an installation, and any change to a vehicle, are subject to the rules of your country: ask your authorities before anything else. Nothing here says they would be allowed, and no lawyer has checked this sentence.',
  ],
  limitsTitle: ['Ce que le modèle ne trouve pas', 'What the model does not find'],
  limitsIntro: [
    'La simulation ne tire aucun de ses chiffres d’une cible. Voici, en un seul endroit, ce qu’elle ne retrouve pas, et pourquoi.',
    'The simulation takes none of its figures from a target. Here, in one place, is what it does not find, and why.',
  ],
  groupMachine: ['La machine et ses essais', 'The machine and its tests'],
  groupHealth: ['La santé et le droit', 'Health and law'],
  groupTractor: ['Le tracteur de base', 'The base tractor'],
  groupFurther: ['Pour aller plus loin, et les crédits', 'To go further, and the credits'],
  sourcesNotLinked: [
    'Ne sont pas liés ici, volontairement : le rapport américain de fabrication d’un gazogène de secours, cité par son titre et son numéro, et les épisodes de construction d’un amateur : ce lab ne renvoie à aucune instruction de fabrication.',
    'Left unlinked on purpose: the American report on making an emergency gasifier, cited by title and number, and an amateur’s episodes on building one: this lab points to no instructions for making one.',
  ],
  sourcesNoCopy: [
    'Merci à la FAO, à l’Académie suédoise des sciences de l’ingénieur et au laboratoire américain qui a traduit son livre, à T. B. Reed et A. Das, à l’INRS, au HSE britannique, à IEA Bioenergy Task 33, à TractorData, au Cirad et à l’UVED. Le texte de la FAO est protégé : ce lab en tire des faits, et ni tableau, ni figure.',
    'Thanks to the FAO, to the Swedish Academy of Engineering Sciences and the American laboratory that translated its book, to T. B. Reed and A. Das, to INRS, to the British HSE, to IEA Bioenergy Task 33, to TractorData, to Cirad and to UVED. The FAO’s text is protected: this lab takes facts from it, and no table and no figure.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
