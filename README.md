# Gasifier Lab

An interactive 3D lab of a **Swedish wood-chip gasifier on a tractor**: the F-5 of a state institute, on a Massey Ferguson 1100 with a 5.8-litre diesel, worked for more than 2,500 hours on two farms in southern Sweden and described in the FAO's Forestry Paper 72. A fire that is short of air on purpose, a gas that is a fifth carbon monoxide, an engine that still burns a thread of diesel, and the minute the lab is really about: **what the machine does when it is stopped.** **It explains a machine from history; it gives no plan, no procedure and no advice.**

**▶ https://gasifier-lab.vercel.app** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes.

> **Warning.** A gasifier makes carbon monoxide: that is what it is for. It cannot be seen or smelt, and it has killed people. The lab shows this warning when it opens and again in its Sources panel. Nothing in it shows that building or running such a machine would be acceptable or allowed; some dimensions and every operating gesture are left out on purpose.

## What is in it

- **Five 3D worlds**: the **farm** in southern Sweden around 1970 (the tractor going round its field with a clod crusher, the chip barn, the chipper and the sieve, the ash, the black water), the **tractor** with its whole system bolted on, the **gasifier** always in section (« the journey of a chip »: a cursor takes one chip through drying, pyrolysis, oxidation and reduction, in false colours from the model), the **gas line** laid flat in the order the gas flows (with one cylinder cut open and the energy's ribbons on the floor), and the **garage** (what the machine does when it stops, in a closed garage under a bedroom, with nobody in the picture).
- **A catalogue of 67 parts**, each with a sheet: what it does, how it fails and is looked after, why it is designed that way. **Two guides**, told in the past tense and tagged step by step as reported, usual practice or our reading: how the institute's system went together (20 steps) and the working day it was made for (10 steps), with no tool, no torque and no procedure.
- **Seven lessons with fourteen questions**, going through the simulation's twelve scenarios: the fire that never touches the wood, the gas that kills, the journey of a chip, what the engine gets, a dirty gas, where the energy goes, what a day costs.
- **A simulation** (pure, unit-tested): the gas from one equilibrium and four balances, three thermal masses, the engine on gas, the filter and the cooler, the chip's journey, the stop and a room of well-mixed boxes. Conditions only: a load, a moisture, a sieve, a fault, a place; never a size.
- **Ten A3 explanatory sheets** generated from the same dimensions as the 3D model and from the model's results, overall sizes only, each marked as not for construction.
- **A spoken guide** in both languages, 73 segments each (the introduction, the five worlds, the 67 parts), in a local synthetic voice with subtitles: the 3D and the simulation follow the voice (`narration/`, `src/cues.ts`). Nobody has listened to it yet.

## What is real and what is not

- **The bench's hour is reported, and the model does not find it.** Given the bench's power and speed, 40 kW at the shaft, the model burns **34 kg** of chips an hour, with its own diesel. The bench took 41 kg of chips and 2.2 kg of diesel for the same work: 221 kW in, 18 % out. The model is 16 % under: its engine burns better than the bench's, and so does its gasifier. The bench's tractor burned about a third more than a good diesel would, the truck beside it did not, and no single efficiency fits both. The lab says so and does not push the model to the table. The 55 kW it finds on dual fuel against the 51 measured is the one agreement, and it is worth little: the efficiencies in the book move it from 47 to 60 kW.
- **The garage rests on a source term that nobody measured.** The cubic metre of gas that a stop lets out comes from a book's example of a concentration in air, the buildings are imagined, and the model's room mixes perfectly where a real one does not. Every figure of the room is an estimate and a span, and none says when anything ends or that any room is fit.
- **Some limits of the model are said in the open**: it does not find 41 kg, its flame never goes out where a real hearth's does, its tar is carried from the measurements and not predicted, and it reads about 30 % high on the other engines of the same book.
- **Marks.** No mark: published by a source. † : computed on published figures, or the model where this machine was measured. \* : an estimate, or the same model where it was not measured. Where the sources disagree, the sheet says which one the lab follows and why.
- **An independent educational reconstruction**, nobody's product: no logo, no footage, no image or drawing taken from a source. The law is one plain sentence in the Sources panel, which no lawyer has checked.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the five worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel, the strip and the notice on the way in; `src/cues.ts` the cues of the spoken guide; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), 3D, data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to the sources are in the app, in _Sources_.

---

## Français

Un labo 3D interactif d’un **gazogène suédois à plaquettes de bois sur un tracteur** : le F-5 d’un institut d’État, sur un Massey Ferguson 1100 à moteur diesel de 5,8 litres, qui a travaillé plus de 2 500 heures dans deux fermes du sud de la Suède et que décrit le document forestier n° 72 de la FAO. Un feu qui manque d’air exprès, un gaz fait pour un cinquième de monoxyde de carbone, un moteur qui brûle encore un filet de gazole, et la minute dont parle vraiment le labo : **ce que fait la machine quand on l’arrête.** **Il explique une machine de l’histoire ; il ne donne aucun plan, aucune procédure, aucun conseil.**

**▶ https://gasifier-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le labo est en construction : `public/lab.json` reste à `building` tant que le niveau de la série n’est pas atteint et que le propriétaire n’a pas dit oui.

> **Avertissement.** Un gazogène fabrique du monoxyde de carbone, c’est sa raison d’être. Il ne se voit pas, il ne se sent pas, et il a tué des gens. Le labo affiche cet avertissement à l’ouverture, puis dans son panneau Sources. Rien ici ne montre qu’en construire ou en faire tourner une serait acceptable ou permis ; certaines cotes et tous les gestes sont absents, volontairement.

**Ce qu’il contient.** Cinq mondes 3D (la ferme du sud de la Suède vers 1970, le tracteur et tout son système, le gazogène toujours en coupe avec « le voyage d’une plaquette » en fausses couleurs, la ligne de gaz à plat avec un cylindre ouvert et les rubans de l’énergie, le garage où l’on voit ce que fait la machine à l’arrêt, sans personne dans l’image) ; un catalogue de 67 pièces avec leur fiche ; deux guides racontés au passé, chaque étape marquée « rapporté », « pratique courante » ou « notre lecture » (20 étapes pour l’assemblage, 10 pour la journée de travail), sans outil, sans couple, sans procédure ; sept leçons et quatorze questions, qui parcourent les douze scénarios de la simulation ; une simulation pure et testée, qui ne change que des conditions (une charge, une humidité, un crible, une panne, un lieu), jamais une taille ; dix planches A3 explicatives générées à partir des dimensions du modèle et de ses résultats, avec des cotes d’ensemble seulement, chacune marquée comme n’étant pas un plan de construction. Un guide parlé, en français et en anglais (73 plages chacun : l’introduction, les cinq mondes, les 67 pièces), en voix de synthèse locale et sous-titré, où la 3D et la simulation suivent la voix (`narration/`, `src/cues.ts`) ; personne ne l’a encore écouté.

**Ce qui est réel et ce qui ne l’est pas.** À qui l’on donne la puissance et le régime du banc, 40 kW à l’arbre, le modèle brûle **34 kg** de plaquettes par heure, avec son propre gazole. Le banc a pris 41 kg de plaquettes et 2,2 kg de gazole pour le même travail : 221 kW en entrée, 18 % en sortie. Le modèle est 16 % en dessous : son moteur brûle mieux que celui du banc, et son gazogène aussi. Le tracteur du banc brûlait environ un tiers de plus qu’un bon diesel, le camion à côté non, et aucun rendement ne convient aux deux. Le labo le dit et ne pousse pas le modèle vers la table. **Le garage repose sur une source que personne n’a mesurée** : le mètre cube de gaz que laisse sortir un arrêt vient d’un exemple de livre sur une concentration dans l’air, les bâtiments sont imaginés, et la boîte du modèle est parfaitement mélangée là où une vraie pièce ne l’est pas ; chaque chiffre de la pièce est une estimation et une fourchette, et aucun ne dit quand quoi que ce soit finit ni qu’une pièce convient. Les limites du modèle sont dites au grand jour : il ne retrouve pas les 41 kg, sa flamme ne s’éteint jamais là où celle d’un vrai foyer s’éteint, son goudron est repris des mesures et non prédit. Sans marque : publié par une source ; † : calculé sur des chiffres publiés, ou résultat du modèle là où cette machine a été mesurée ; \* : estimation, ou le même modèle là où elle ne l’a pas été.

**Reconstitution pédagogique indépendante**, le produit de personne, sans logo, sans extrait, sans image ni dessin repris d’une source. Le droit tient en une phrase dans le panneau Sources, qu’aucun juriste n’a relue.

`npm install` puis `npm run dev` pour lancer en local ; chaque push sur `main` déploie sur Vercel. Les crédits et les liens vers les sources sont dans l’application, dans _Sources_.
