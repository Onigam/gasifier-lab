// The Sources panel: the notices (the warning, the refusals, the reconstruction, how to read the figures, the law, what the model does not find), then the credits and the links, each source saying how it was read. The lead wires it with `about: sourcesPanel` in src/lab.ts. From docs/research.md §1, §7.
// Said once, here: « independent educational reconstruction », the warning in full, the refusals, the law as one plain sentence (research §A.5, Q11), and the model’s limits in one place. No transcript, no image and no footage of a third party is reproduced; the FAO’s text is protected, so facts only, no table and no figure.
// Not linked on purpose (research R10, Q6): the American report on making an emergency gasifier (S4), cited by title and number; an amateur’s construction episodes. Left out because no figure of them is used: S8 (the ministry’s page on approvals), S11 to S13 (Imbert’s dates, the Viking gasifier, a maker’s page).
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { lf } from './part-helpers';

export interface SourceLink {
  /** No link when the source is not linked on purpose. */
  href?: string;
  label: string;
  /** What it gives the lab, and how it was read. */
  note: L;
}

export interface SourceGroup {
  title: 'groupMachine' | 'groupHealth' | 'groupTractor' | 'groupFurther';
  links: SourceLink[];
}

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: 'groupMachine',
    links: [
      {
        href: 'https://www.fao.org/4/T0512E/T0512e00.htm',
        label: 'FAO Forestry Paper 72, Wood gas as engine fuel, 1986 (ISBN 92-5-102436-7)',
        note: l(
          'La source principale. Son chapitre 3 rapporte les travaux de l’institut suédois d’essai des machines agricoles, d’après les rapports de R. Axelsson et O. Nordström, en suédois, que nous n’avons pas lus : cotes d’ensemble, le tracteur et le camion, les bilans d’énergie, le goudron, la poussière, les durées de service, les pannes. Lue dans le texte, les tableaux et les figures en images ; quelques sections (2.3, 2.7, 3.3, chapitres 4 à 7) ne l’ont pas été. Le texte est protégé : ce lab en tire des faits.',
          'The main source. Its chapter 3 reports the Swedish institute for testing agricultural machinery’s work, from the reports of R. Axelsson and O. Nordström, in Swedish, which we have not read: overall dimensions, the tractor and the truck, the energy balances, tar, dust, service times, failures. Read as text, the tables and figures as images; a few sections (2.3, 2.7, 3.3, chapters 4 to 7) were not. The text is protected: this lab takes facts from it.',
        ),
      },
      {
        href: 'https://docs.nlr.gov/docs/legosti/old/140.pdf',
        label:
          'Swedish Academy of Engineering Sciences, Generator Gas: The Swedish Experience from 1939–1945 (SERI/SP-33-140, 1979)',
        note: l(
          'Traduction américaine du livre suédois « Gengas » (1950) : le monoxyde, l’arrêt de la machine, les accidents, la flotte suédoise, les incendies, les essais d’un gazogène Imbert. Son chapitre 12 est le récit d’un médecin et d’un fonctionnaire, E. B. Salén et G. Lindmark. C’est la source du monoxyde dans ce lab. Lue dans le texte : l’OCR brouille les tableaux, dont nous avons vérifié les totaux en les additionnant.',
          'The American translation of the Swedish book “Gengas” (1950): carbon monoxide, the machine’s stop, the accidents, the Swedish fleet, the fires, the tests of an Imbert gasifier. Its chapter 12 is the account of a physician and an official, E. B. Salén and G. Lindmark. It is this lab’s source for carbon monoxide. Read as text: the OCR scrambles the tables, whose totals we checked by adding them.',
        ),
      },
      {
        href: 'https://digital.library.unt.edu/ark:/67531/metadc1061385/m2/1/high_res_d/5206099.pdf',
        label: 'T. B. Reed, A. Das, Handbook of Biomass Downdraft Gasifier Engine Systems (SERI/SP-271-3022, 1988)',
        note: l(
          'Les limites du gazogène à courant descendant, un tableau des goudrons, le monoxyde et la créosote, les condensats et leurs phénols. Lue dans le texte jusqu’à la page 121 environ, le reste non. Les chiffres appartiennent à d’autres auteurs, qui gardent leurs droits.',
          'The limits of the downdraught gasifier, a table of tars, carbon monoxide and creosote, condensates and their phenols. Read as text up to about page 121, the rest not. The figures belong to other authors, who keep their rights.',
        ),
      },
      {
        label:
          'H. LaFontaine, G. P. Zimmerman, Construction of a Simplified Wood Gas Generator for Fueling Internal Combustion Engines in a Petroleum Emergency, ORNL-6404 (Oak Ridge, 1989)',
        note: l(
          'Cité par son titre et son numéro, sans lien : c’est un manuel de fabrication, et il ne mesure ni gaz, ni puissance, ni goudron. Lu dans le texte, en partie, dans le dépôt du ministère américain de l’énergie. Utilisé pour quatre faits seulement : la flamme qui ne touche pas le bois, la tôle chaude comparée à un pot catalytique et l’herbe sèche, un tableau de symptômes du monoxyde, et ce que le manuel ne mesure pas.',
          'Cited by title and number, with no link: it is a manual for making one, and it measures no gas, no power and no tar. Read as text, in part, on the American energy department’s repository. Used for four facts only: the flame that does not touch the wood, the hot sheet compared to a catalytic converter and the dry grass, a table of carbon monoxide symptoms, and what the manual does not measure.',
        ),
      },
    ],
  },
  {
    title: 'groupHealth',
    links: [
      {
        href: 'https://inrs.fr/dam/ficheTox/FicheFicheTox/FICHETOX_47-1.pdf',
        label: 'INRS, Monoxyde de carbone, fiche toxicologique FT 47 (avril 2021)',
        note: l(
          'La référence du lab sur la santé : propriétés, limites françaises et européennes, effets aigus et différés, séquelles, toxicité pour le fœtus. Lue dans le texte, en partie. Quand le rapport de la FAO dit qu’aucune séquelle n’est possible, le lab suit l’INRS.',
          'The lab’s reference on health: properties, French and EU limits, acute and delayed effects, after-effects, toxicity to the fetus. Read as text, in part. Where the FAO’s report says no after-effect can occur, the lab follows INRS.',
        ),
      },
      {
        href: 'https://task33.ieabioenergy.com/wp-content/uploads/sites/33/2022/06/gasification_guide_final_guideline_for_safe_and_eco_friendly_biomass.pdf',
        label:
          'J. Vos et al., Final Guideline for Safe and Eco-friendly Biomass Gasification, BTG and partners, IEA Bioenergy Task 33 (c. 2009)',
        note: l(
          'Les dangers et le droit des installations professionnelles de moins de 5 MW : les détecteurs de monoxyde dans les locaux, le gaz qui sort après l’arrêt, un tableau d’explosion. Lu dans le texte, en partie. Ce n’est pas cette machine, et son titre n’est pas une promesse.',
          'The hazards and the law of professional plants under 5 MW: carbon monoxide detectors in the rooms, gas escaping after the shutdown, a table on explosion. Read as text, in part. It is not this machine, and its title is not a promise.',
        ),
      },
      {
        href: 'https://www.hse.gov.uk/safetybulletins/co-wood-pellets.htm',
        label:
          'UK Health and Safety Executive, Safety Alert OPSTD 3-2012, Carbon monoxide from wood pellets in storage (2012)',
        note: l(
          'Au moins neuf morts dans des stockages de granulés en Europe depuis 2002, et pourquoi le bois en dégage. Lue par un résumé de page : à relire avant d’être citée ailleurs.',
          'At least nine deaths in pellet stores in Europe since 2002, and why wood gives it off. Read through a page summary: to be re-read before it is quoted elsewhere.',
        ),
      },
    ],
  },
  {
    title: 'groupTractor',
    links: [
      {
        href: 'https://tractordata.com/farm-tractors/000/8/2/824-massey-ferguson-1100-dimensions.html',
        label: 'TractorData, Massey Ferguson 1100 dimensions',
        note: l(
          'Les cotes du tracteur de base : un site tiers, sans notice de constructeur, lu par un résumé de page. La largeur de 2,70 m ressemble à la voie maximale, et le modèle exact du moteur est à vérifier : ces chiffres servent à l’échelle, pas à la précision.',
          'The base tractor’s dimensions: a third-party site, with no maker’s brochure, read through a page summary. The width of 2.70 m looks like the maximum tread, and the engine’s exact model is to be checked: these figures serve for scale, not precision.',
        ),
      },
    ],
  },
  {
    title: 'groupFurther',
    links: [
      {
        href: 'https://www.youtube.com/watch?v=v8mM800DqXs',
        label: 'BioWooEB, Cirad, Gazéification étagée de biomasse (2016)',
        note: l(
          'Un institut public de recherche, sous licence CC BY 4.0, indiquée par le Cirad lui-même. Cité pour aller plus loin : les auteurs de ce lab ne l’ont pas regardé, et aucun chiffre ni aucune image n’en est tiré.',
          'A public research institute, under a CC BY 4.0 licence, stated by Cirad itself. Cited to go further: the authors of this lab have not watched it, and no figure and no image is taken from it.',
        ),
      },
      {
        href: 'https://www.youtube.com/watch?v=3MbIt_HQ0-8',
        label: 'UVED, Procédés de pyrolyse et gazéification (2016)',
        note: l(
          'Un cours de L. Van de Steene (Cirad), présenté par G. Vaïtilingom, sous licence CC BY d’après le champ de YouTube, à confirmer sur la page. La gazéification commence à 6 min 19 s. Non regardée par les auteurs, aucun chiffre n’en est tiré.',
          'A course by L. Van de Steene (Cirad), presented by G. Vaïtilingom, under a CC BY licence by YouTube’s field, to be confirmed on the page. Gasification starts at 6 min 19 s. Not watched by the authors, no figure is taken from it.',
        ),
      },
      {
        label: 'FoxTizZo, série « Gazogène » (YouTube, 2020 et après)',
        note: l(
          'Un amateur français qui documente en vidéo la construction et l’essai de gazogènes : c’est la série qui a donné l’idée de ce labo. Licence YouTube standard. Aucun chiffre, aucune image et aucun extrait n’en est repris, et ses épisodes ne sont pas liés ici, parce que ce sont des épisodes de construction.',
          'A French amateur who documents the building and testing of gasifiers on video: it is the series that gave this lab its idea. Standard YouTube licence. No figure, no image and no clip is taken from it, and its episodes are not linked here, because they are building episodes.',
        ),
      },
    ],
  },
];

/** What the lab refuses to give, in plain words: said here once, and at the head of each guide (research §A.2). */
export const REFUSALS: L[] = [
  l(
    'Aucun plan : ni découpe, ni matière, ni soudure, ni joint, ni outil, ni coût.',
    'No plan: no cut list, no material, no weld, no seal, no tool, no cost.',
  ),
  l(
    'Aucune taille de la gorge, des tuyères, du foyer, de la grille ni des zones : la 3D les dessine à l’échelle, parce qu’un modèle faux ne répondrait à rien, mais aucune planche, fiche, leçon ni voix ne les imprime, et aucune règle ne va d’un moteur à l’une d’elles.',
    'No size of the throat, the nozzles, the fire box, the grate or the zones: the 3D draws them to scale, because a false model would answer nothing, but no sheet, page, lesson or voice prints them, and no rule goes from an engine to any of them.',
  ),
  l(
    'Aucune procédure : ni allumage, ni ventilation, ni essai du gaz, ni remplissage, ni arrêt, ni vidange des cendres, ni redémarrage. Seulement de l’histoire, au passé, avec des durées.',
    'No procedure: no lighting, no fanning, no testing of the gas, no refuelling, no shutting down, no emptying of ash, no restarting. Only history, in the past tense, with durations.',
  ),
  l(
    'Aucune recette de transformation d’un moteur : ni rapport de compression, ni calage, ni quantité de pilote, ni réglage de pompe ou d’injecteur.',
    'No recipe for converting an engine: no compression ratio, no timing, no pilot quantity, no pump or injector setting.',
  ),
  l(
    'Aucun calculateur d’exposition : ni temps avant un malaise, ni dose, ni niveau « à ne pas dépasser » pour une personne.',
    'No exposure calculator: no time before collapse, no dose, no level to stay under for a person.',
  ),
  l(
    'Aucun protocole médical : les traitements des années 1940 sont de l’histoire, et la seule ligne d’aujourd’hui est celle de l’avertissement.',
    'No medical protocol: the 1940s treatments are history, and the only line for today is the warning’s.',
  ),
  l(
    'Aucun conseil sur le sort du goudron, des condensats et des cendres : ce lab dit ce qu’ils contiennent, et renvoie à vos autorités locales.',
    'No advice on what becomes of tar, condensates and ash: this lab says what they contain, and sends you to your local authorities.',
  ),
  l(
    'Aucune image de bricolage : l’appareil est celui d’un institut d’État, avec ses pannes, et personne ne dit ici que n’importe qui pourrait en faire autant.',
    'No do-it-yourself imagery: the apparatus is a state institute’s, with its failures, and nobody here says that anyone could do the same.',
  ),
  l(
    'Aucune phrase qui dit que c’est permis, sur une route ou chez soi.',
    'No sentence that says it is allowed, on a road or at home.',
  ),
  l('Aucun lien vers des instructions de fabrication.', 'No link to instructions for making one.'),
];

/** What the model does not find, in one place (docs/physics.md §3.3, §6, §7.3). Each item carries its marks; no item is a target. */
export const MODEL_LIMITS: L[] = [
  lf(
    'Le bois. À 40 kW, le modèle brûle {chipsModel} de plaquettes, le banc en a mesuré 41 : {woodGap} de moins. Ce tracteur a brûlé au banc environ {thirdMore} d’énergie de plus qu’un bon diesel, et le moteur du modèle ne l’imite pas ; le camion du même rapport brûlait à peu près comme au gazole. Aucun rendement ne fait les deux véhicules.',
    'The wood. At 40 kW, the model burns {chipsModel} of chips, the bench measured 41: {woodGap} less. This tractor burned, on the bench, about {thirdMore} more energy than a good diesel, and the model’s engine does not imitate it; the truck of the same report burned about as on diesel. No single efficiency does both vehicles.',
  ),
  lf(
    'Le gaz. {gasModel} contre 5,60 MJ/Nm³ mesurés : {gasGap} de moins. Aucun bilan sur le bois de la formule du rapport ne ferme à la fois tous ses chiffres.',
    'The gas. {gasModel} against 5.60 MJ/Nm³ measured: {gasGap} less. No balance on the wood’s formula as the report gives it closes all its figures at once.',
  ),
  lf(
    'La flamme. Elle ne s’éteint jamais : à {wetLimit} d’humidité le gaz du modèle tombe aux 4,2 MJ/m³ que demandent les moteurs, mais ce qui arrête un vrai foyer n’y est pas.',
    'The flame. It never goes out: at {wetLimit} moisture the model’s gas falls to the 4.2 MJ/m³ engines ask for, but what stops a real hearth is not in it.',
  ),
  l(
    'Le goudron. Il est porté, mesuré au banc, jamais prédit : le chiffre des vapeurs détruites est de l’arithmétique.',
    'The tar. It is carried, measured on the bench, never predicted: the figure for vapours destroyed is arithmetic.',
  ),
  lf(
    'Le moteur. {powerModel} contre 51 kW mesurés n’est pas un succès : le même modèle lit environ {fleetHigh} trop haut les autres moteurs du livre. Il n’a ni flamme lente, ni cognement, ni calage, ni pilote autre que son énergie.',
    'The engine. {powerModel} against 51 kW measured is not a success: the same model reads about {fleetHigh} high on the book’s other engines. It has no slow flame, no knock, no timing, no pilot but its energy.',
  ),
  lf(
    'Le ralenti. Le foyer du modèle tombe à {idleHearth}, là où aucune réduction ne marcherait, quand le gaz du banc reste aussi riche qu’au travail.',
    'The idle. The model’s hearth falls to {idleHearth}, where no reduction would run, when the bench’s gas stays as rich as at work.',
  ),
  lf(
    'Le service. Les durées des tableaux de l’institut font environ {serviceModel} de service par heure dans le modèle, quand son rapport en compte de 15 à 25.',
    'The service. The durations of the institute’s tables come to about {serviceModel} of service per hour in the model, when its report counts 15 to 25.',
  ),
  lf(
    'Le garage. Sa source de gaz, {postGas}, est l’illustration du livre suédois : personne ne l’a mesurée sur cette machine, ni dans une pièce. La note de la Simulation dit le reste de la boîte.',
    'The garage. Its source of gas, {postGas}, is the Swedish book’s illustration: nobody measured it on this machine, or in a room. The Simulation’s note says the rest of the box.',
  ),
  l(
    'Le démarrage. Il n’y en a pas : une machine arrêtée depuis des heures et remise en marche marche, sans allumage, sans ventilateur, sans échauffement. Le lab n’en dit rien, exprès.',
    'The start. There is none: a machine stopped for hours and set running just runs, with no lighting, no fan, no warm-up. The lab says nothing of it, on purpose.',
  ),
  l(
    'La ligne de gaz. Les tuyaux, les vannes, le ventilateur, le mélangeur et le caisson du filtre n’ont aucune cote dans ce que nous avons lu : ils sont dessinés d’après le schéma, leurs tailles sont des estimations.',
    'The gas line. The pipes, the valves, the fan, the mixer and the filter box have no dimension in what we read: they are drawn from the schematic, their sizes are estimates.',
  ),
];

/** The panel's content, for `about` in src/lab.ts: the warning first, then what the lab refuses, the notices, the law, what the model does not find, and every source with its link and how it was read. */
export function sourcesPanel(): HTMLElement[] {
  const link = (s: SourceLink): HTMLElement =>
    h(
      'li',
      {},
      s.href ? h('a', { href: s.href, target: '_blank', rel: 'noopener noreferrer' }, s.label) : s.label,
      ' — ',
      tr(s.note),
    );
  return [
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('warningFull'))),
    h('h3', { class: 'section-title' }, t('refusalsTitle')),
    h('ul', { class: 'links' }, ...REFUSALS.map((r) => h('li', {}, tr(r)))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer'))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('noticeReading'))),
    h('h3', { class: 'section-title' }, t('lawTitle')),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('legal'))),
    h('h3', { class: 'section-title' }, t('limitsTitle')),
    h('p', { class: 'hint' }, t('limitsIntro')),
    h(
      'ul',
      { class: 'links' },
      ...MODEL_LIMITS.map((m) => {
        // the first sentence is the topic: « Le bois. », « The wood. »
        const text = tr(m);
        const at = text.indexOf('. ');
        return h('li', {}, h('strong', {}, text.slice(0, at + 1)), ' ', text.slice(at + 2));
      }),
    ),
    ...SOURCE_GROUPS.flatMap((g) => [
      h('h3', { class: 'section-title' }, t(g.title)),
      h('ul', { class: 'links' }, ...g.links.map(link)),
    ]),
    h('p', { class: 'hint' }, t('sourcesNotLinked')),
    h('p', { class: 'hint' }, t('sourcesNoCopy')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
