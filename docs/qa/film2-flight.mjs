// The camera flights a film makes between its framings (frameParts / frameAll over 2.5 s), frame by frame on pinned clocks, the pixels read back:
// per flight the largest frame-to-frame change over the median of its neighbours (a pop is over 2 once the easing is divided out), the frame where it happens,
// and the count of visible meshes (a switch of level of detail or a visibility toggle shows as a jump). Adapted from the independent reviewer's script of
// the film round 1's review (docs/qa.md, F6), kept so that the garage's flight from the closed garage to the old rescue set can be run again.
//   URL=http://localhost:5885/ OUT=file.json SCENES=garage ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film2-flight.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const deps = path.join(os.homedir(), '.cache/lab-review');
const puppeteer = createRequire(path.join(deps, 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const BASE = process.env.URL;
const OUT = process.env.OUT;
const W = Number(process.env.WIDTH ?? 1280);
const H = Number(process.env.HEIGHT ?? 720);
const DUR = Number(process.env.DUR ?? 2.5);
const URLQ = process.env.URLQ ?? '';
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
const PAD = { farm: 1.7, tractor: 2.2, gasifier: 1.8, 'gas-train': 2.0, garage: 2.2 };
// the film's sequences per world (docs: film-writer-report §4 and the scripts' cues)
const SEQ = {
  farm: [['home'], ['farmhouse', 'farm-garage'], ['farm-garage'], ['wood-gas-tractor'], ['home']],
  garage: [
    ['home'],
    ['room-above'],
    ['closed-garage'],
    ['old-rescue-set'],
    ['post-gas-plume'],
    ['co-indicator'],
    ['closed-garage'],
    ['garage-door'],
    ['post-gas-plume'],
    ['room-above'],
  ],
  gasifier: [
    ['home'],
    ['chip-column'],
    ['pyrolysis-zone'],
    ['oxidation-zone'],
    ['reduction-zone'],
    ['gas-outlet'],
    ['reduction-zone'],
  ],
  'gas-train': [['home'], ['filter-box'], ['gas-cooler'], ['cylinder-cutaway'], ['water-gauge']],
  tractor: [['home'], ['cab'], ['home']],
};
const GL = ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 0,
  args: [...GL, '--hide-scrollbars', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
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
await page.goto(BASE + URLQ, { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 900 && !(await page.evaluate(() => !!window.__lab?.stage)); i++)
  await new Promise((r) => setTimeout(r, 100));
await page.evaluate(() => {
  const st = window.__lab.stage;
  st.outline.enabled = false;
  st.outlineHover.enabled = false;
  window.__lab.store.set({ labels: 'none', panelOpen: false });
  document.querySelector('.narr-invite__x')?.click();
  window.__step(10);
});
const result = {};
for (const [world, seq] of Object.entries(SEQ)) {
  if (process.env.SCENES && !process.env.SCENES.split(',').includes(world)) continue;
  await page.evaluate((w) => {
    window.__lab.store.set({ scene: w });
    window.__step(30);
    const e = window.__lab.engine;
    e.applyPreset('mf-1100');
    if (w === 'garage') e.set({ engineOn: false });
    window.__step(10);
  }, world);
  const flights = [];
  for (let k = 0; k < seq.length; k++) {
    const ids = seq[k];
    const r = await page.evaluate(
      async (ids, pad, dur, world) => {
        const st = window.__lab.stage;
        st.controls.minDistance = 0;
        st.controls.maxDistance = Infinity;
        const gl = st.renderer.getContext();
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        if (ids[0] === 'home') st.frameAll(dur);
        else st.frameParts(ids, Math.min(pad, ids.length > 1 ? 1.5 : 1.9), undefined, dur);
        const house = world === 'garage' ? st.get('garage').scene.children.filter((c) => c.name === 'farmhouse') : [];
        let prev = null;
        const d = [];
        const vis = [];
        const hv = [];
        const camx = [];
        for (let f = 0; f < Math.ceil(dur * 30) + 12; f++) {
          window.__step(1);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
          const l = new Float32Array(w * h);
          for (let i = 0, k = 0; i < l.length; i++, k += 4)
            l[i] = 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
          if (prev) {
            let s = 0;
            for (let i = 0; i < l.length; i++) s += Math.abs(l[i] - prev[i]);
            d.push(s / l.length);
          }
          prev = l;
          let c = 0;
          st.active.scene.traverseVisible((o) => {
            if (o.isMesh || o.isInstancedMesh) c += o.isInstancedMesh ? o.count : 1;
          });
          vis.push(c);
          hv.push(house.length ? (house[0].visible ? 1 : 0) : -1);
          camx.push(+st.camera.position.x.toFixed(2));
        }
        // local ratio: frame diff over the median of the diffs around it (±4), where the diff is above a small floor
        let worst = 0;
        let at = -1;
        for (let i = 0; i < d.length; i++) {
          const nb = d.slice(Math.max(0, i - 4), Math.min(d.length, i + 5)).sort((a, b) => a - b);
          const med = nb[nb.length >> 1] || 1e-6;
          const ratio = d[i] / Math.max(med, 0.05);
          if (ratio > worst) {
            worst = ratio;
            at = i;
          }
        }
        let visJump = 0;
        let visAt = -1;
        for (let i = 1; i < vis.length; i++)
          if (Math.abs(vis[i] - vis[i - 1]) > visJump) {
            visJump = Math.abs(vis[i] - vis[i - 1]);
            visAt = i;
          }
        const hseq = hv.join('');
        return {
          ids,
          worstLocalRatio: +worst.toFixed(2),
          at,
          maxDiff: +Math.max(...d).toFixed(2),
          medDiff: +[...d].sort((a, b) => a - b)[d.length >> 1].toFixed(3),
          visJump,
          visAt,
          houseToggles: hseq.length > 1 ? (hseq.match(/01|10/g) ?? []).length : 0,
          camx: [camx[0], camx[camx.length - 1]],
        };
      },
      ids,
      PAD[world],
      DUR,
      world,
    );
    flights.push(r);
    console.log(world, JSON.stringify(r));
  }
  result[world] = flights;
}
console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no page error');
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ result, errors }, null, 1));
await browser.close();
