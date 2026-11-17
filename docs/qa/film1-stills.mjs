// Stills of the lab's 3D at the film's poses, from a headless Chrome with the clocks pinned at 30 frames a second (the way the film
// driver and the kit's flicker tool run it), written for the film round (docs/film-round-1-report.md). One Chrome at a time: run it under
// ~/Dev/onigam-video/tools/with-chrome-lock.sh.
//
//   npm run dev                                   (or any dev server of the lab: dev mode exposes window.__lab)
//   URL=http://localhost:5883/ ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film1-stills.mjs docs/qa/film1-specs/film.json
//   npm i --prefix ~/.cache/lab-review puppeteer-core      once, outside the repo
//
// The spec: { out, tag, width, height, dpr, film, shots: [ { name, scene, cues, runIn, frame, home, padding, steps, small } ] }.
//   cues     the spoken guide's lab cues, [name, arg] each, run through the app's own `planCue` equivalent (set / preset / scenario)
//   runIn    simulated seconds stepped without drawing, at 30 a second (the clock's scale is whatever the cues set)
//   frame    part ids framed as the film's `[[frame:...]]` does (the world's own padding, at most 1.9 for one part, 1.5 for several)
//   path     { from: [ids], to: [ids], t }: the camera a fraction t of the way along the straight flight between two framings
//   camera   { position, target }: an explicit pose
//   dayStart the farm's hour (scene.userData.filmHour)
//   home     `[[home]]`: the world's overview
//   film     the look of a film capture (kit `setLook`: 8 samples, ambient occlusion in the worlds that ask for it)
//   small    also write the same picture at 200 px wide (the owner's test: readable at 200 px, without sound)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const deps = path.join(os.homedir(), '.cache/lab-review');
const puppeteer = createRequire(path.join(deps, 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const BASE = process.env.URL ?? 'http://localhost:5883/';
const W = spec.width ?? 1280;
const H = spec.height ?? 720;
fs.mkdirSync(spec.out, { recursive: true });

const PADDING = { farm: 1.7, tractor: 2.2, gasifier: 1.8, 'gas-train': 2.0, garage: 2.2 };

const HIDE = `#app > .topbar, #app > .rail, #app > .panel, #app > .strip, #viewport > .toolbar, #viewport > .peek,
  #viewport > .panel-toggle, #viewport > .narr, #viewport > .dv, #viewport > .label-layer { display: none !important; }
  #viewport { position: fixed !important; inset: 0 !important; }`;

function pinClocks() {
  let now = 0;
  let queue = new Map();
  let id = 0;
  performance.now = () => now;
  const RealDate = Date;
  const epoch = RealDate.UTC(2026, 5, 21, 10, 0, 0);
  window.Date = class extends RealDate {
    constructor(...a) {
      if (a.length) super(...a);
      else super(epoch + now);
    }
    static now() {
      return epoch + now;
    }
  };
  window.requestAnimationFrame = (cb) => (queue.set(++id, cb), id);
  window.cancelAnimationFrame = (k) => void queue.delete(k);
  let seed = 42;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      now += 1000 / 30;
      const q = queue;
      queue = new Map();
      for (const cb of q.values()) cb(now);
    }
  };
}

const GL = ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 0,
  args: [...GL, '--hide-scrollbars', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: spec.dpr ?? 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
await page.evaluateOnNewDocument((css) => {
  const add = () => {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.append(s);
  };
  if (document.head) add();
  else document.addEventListener('DOMContentLoaded', add);
  localStorage.setItem('gasifier-lab:entry-notice', '1');
}, HIDE);
await page.evaluateOnNewDocument(pinClocks);
await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 900 && !(await page.evaluate(() => !!window.__lab?.stage)); i++)
  await new Promise((r) => setTimeout(r, 100));
await page.evaluate((film) => {
  const st = window.__lab.stage;
  st.outline.enabled = false;
  st.outlineHover.enabled = false;
  window.__lab.store.set({ labels: 'none', panelOpen: false });
  document.querySelector('.narr-invite__x')?.click();
  document.querySelector('dialog')?.close?.();
  if (film) st.setLook({ adaptive: false, supersample: 3, ao: true });
  window.__step(10);
}, !!spec.film);

const firstFrame = {};
const frames = {};
async function setWorld(scene) {
  const before = await page.evaluate(() => window.__lab.store.state.scene);
  if (before === scene) return;
  await page.evaluate((s) => window.__lab.store.set({ scene: s }), scene);
  const t0 = process.hrtime.bigint();
  await page.evaluate(() => {
    window.__step(1);
    window.__lab.stage.renderer.getContext().finish();
  });
  const t1 = process.hrtime.bigint();
  await page.evaluate(() => window.__step(20));
  if (!(scene in firstFrame)) firstFrame[scene] = Number(t1 - t0) / 1e6;
}

let n = 0;
for (const shot of spec.shots) {
  const label = shot.name ?? `shot-${n}`;
  n++;
  await setWorld(shot.scene);
  await page.evaluate(
    (shot) => {
      const e = window.__lab.engine;
      const st = window.__lab.store;
      if (shot.reset) e.reset?.();
      for (const [name, arg] of shot.cues ?? []) {
        if (name === 'preset') e.applyPreset(arg);
        else if (name === 'scenario') {
          e.applyScenario(arg);
          e.set({ running: true });
        } else if (name === 'journey') e.set({ journey: Number(arg) });
        else if (name === 'engine') e.set({ engineOn: arg === 'on' });
        else if (name === 'door') e.set({ door: arg });
        else if (name === 'speed') e.set({ timeScale: Number(arg), running: true });
        else if (name === 'pause') e.set({ running: false });
        else if (name === 'place') e.set({ place: arg });
        else if (name === 'load') e.set({ load: Number(arg), fullPower: false });
        else if (name === 'raw') e.set(arg);
      }
      st.set({ schematic: !!shot.flows, explode: shot.explode ?? 0 });
      // a film's own hour for the farm's sun (scene.userData.filmHour, docs/3d.md, « Film round 1 »)
      // (set for this shot only: a later shot without `dayStart` has the model's own day)
      const ud = window.__lab.stage.get(shot.scene).scene.userData;
      if (shot.dayStart !== undefined) ud.filmHour = shot.dayStart;
      else delete ud.filmHour;
      for (let i = 0; i < (shot.runIn ?? 0) * 30; i++) e.step(1 / 30);
    },
    shot,
  );
  await page.evaluate(() => window.__step(4));
  await page.evaluate(
    (shot, pad) => {
      const stage = window.__lab.stage;
      stage.controls.minDistance = 0;
      stage.controls.maxDistance = Infinity;
      if (shot.path) {
        // a point on the straight flight between two framings (the kit's flyTo lerps the camera and its target): { from: [ids], to: [ids], t }
        const pose = (ids) => {
          stage.frameParts(ids, Math.min(pad, ids.length > 1 ? 1.5 : 1.9), undefined, 0.01);
          window.__step(12);
          return { p: stage.camera.position.clone(), q: stage.controls.target.clone() };
        };
        const a = pose(shot.path.from);
        const b = pose(shot.path.to);
        stage.fly = null;
        stage.camera.position.lerpVectors(a.p, b.p, shot.path.t);
        stage.controls.target.lerpVectors(a.q, b.q, shot.path.t);
        stage.camera.updateProjectionMatrix();
        stage.controls.update();
      } else if (shot.camera) {
        stage.fly = null;
        stage.camera.position.set(...shot.camera.position);
        stage.controls.target.set(...shot.camera.target);
        stage.camera.updateProjectionMatrix();
        stage.controls.update();
      } else if (shot.frame) {
        const ids = shot.frame;
        stage.frameParts(ids, shot.padding ?? Math.min(pad, ids.length > 1 ? 1.5 : 1.9), undefined, 0.01);
      } else stage.frameAll(0.01);
    },
    shot,
    PADDING[shot.scene],
  );
  await page.evaluate((k) => window.__step(k), shot.steps ?? 12);
  const info = await page.evaluate(() => {
    const ri = window.__lab.stage.renderer.info;
    const s = window.__lab.engine.state;
    return {
      calls: ri.render.calls,
      tris: ri.render.triangles,
      clock: +(s.minutesSinceStop ?? 0).toFixed(1),
      co: Math.round(s.garageCoPpm ?? 0),
      oxT: Math.round(s.zoneOxidationT ?? 0),
    };
  });
  const file = path.join(spec.out, `${spec.tag}-${label}.png`);
  await page.screenshot({ path: file });
  if (shot.small !== false) {
    const small = path.join(spec.out, `${spec.tag}-${label}-200px.png`);
    execFileSync('sips', ['--resampleWidth', '200', file, '--out', small], { stdio: 'ignore' });
  }
  console.log(file, JSON.stringify(info));
}
console.log('first frame after a world switch (ms, wall clock, GPU finished):', JSON.stringify(firstFrame));
console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no page error');
await browser.close();
