// The farm's overview as a visitor meets it, at the three widths of the review (1280 × 800, 768 × 1024, 390 × 844), in French and in English, with the interface on (film round 3, docs/qa.md « Film round 2 », m4):
// a screenshot each, and what can be counted: every label of the 3D view with its box and whether the view clips it, where the tractor stands in the free part of the view (0 = its left or top edge, 1 = its right or bottom edge),
// and how much of the free view's width and height the yard's box takes. It judges nothing.
//   URL=http://localhost:5887/ OUT=/some/dir ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film3-overview.mjs       (WORLDS=farm,garage for more worlds)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const deps = path.join(os.homedir(), '.cache/lab-review');
const puppeteer = createRequire(path.join(deps, 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const { URL: BASE, OUT } = process.env;
if (!BASE || !OUT) throw new Error('Set URL and OUT.');
fs.mkdirSync(OUT, { recursive: true });
const WORLDS = (process.env.WORLDS ?? 'farm').split(',');
const VIEWS = [
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844, isMobile: true, hasTouch: true },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'],
});
const rows = [];
for (const vp of VIEWS)
  for (const lang of ['fr', 'en']) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.evaluateOnNewDocument(() => localStorage.setItem('gasifier-lab:entry-notice', '1'));
    await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__lab && document.querySelector('.rail button'), { timeout: 150000 });
    const settle = async (ms = 900) => {
      await sleep(400);
      await page.waitForFunction(() => !window.__lab.stage.fly, { timeout: 60000 }).catch(() => {});
      await sleep(ms);
    };
    if (lang === 'en')
      await page.evaluate(() =>
        [...document.querySelectorAll('.lang-switch button')].find((b) => /^en$/i.test(b.textContent.trim()))?.click(),
      );
    await settle(1200);
    await page.evaluate(() => document.querySelector('.narr-invite__x')?.click());
    for (const world of WORLDS) {
      await page.evaluate((w) => window.__lab.store.set({ scene: w, selected: null, labels: 'main' }), world);
      await settle(1500);
      await page.evaluate(() => window.__lab.stage.frameAll(0.01));
      await settle(1200);
      const info = await page.evaluate((world) => {
        const st = window.__lab.stage;
        const view = document.querySelector('#viewport').getBoundingClientRect();
        const labels = [...document.querySelectorAll('#viewport .label-layer > *')]
          .filter((e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' && Number(getComputedStyle(e).opacity) > 0.05)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return {
              text: e.textContent.trim().slice(0, 40),
              x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
              clipped: r.left < view.left - 0.5 || r.right > view.right + 0.5 || r.top < view.top - 0.5 || r.bottom > view.bottom + 0.5,
            };
          });
        const ins = st.insetsNow ?? { top: 0, right: 0, bottom: 0, left: 0 };
        const free = { x0: view.left + ins.left, x1: view.right - ins.right, y0: view.top + ins.top, y1: view.bottom - ins.bottom };
        const V = st.camera.position.constructor;
        const toScreen = (p) => {
          const q = p.clone().project(st.camera);
          return { x: view.left + ((q.x + 1) / 2) * view.width, y: view.top + ((1 - q.y) / 2) * view.height };
        };
        const out = { labels, insets: ins, view: [Math.round(view.width), Math.round(view.height)], camera: st.camera.position.toArray().map((v) => +v.toFixed(1)), target: st.controls.target.toArray().map((v) => +v.toFixed(1)) };
        if (world === 'farm') {
          const drive = st.get('farm').scene.getObjectByName('drive');
          const t = toScreen(drive.getWorldPosition(new V()).add(new V(0, 1.4, 0)));
          out.tractor = { fx: +((t.x - free.x0) / (free.x1 - free.x0)).toFixed(3), fy: +((t.y - free.y0) / (free.y1 - free.y0)).toFixed(3) };
          // the yard's buildings and the tractor's loop: how much of the free view they take
          const pts = [];
          for (const x of [-24, 28]) for (const y of [0, 9]) for (const z of [-27, 0]) pts.push(toScreen(new V(x, y, z)));
          const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
          out.yard = { w: +((Math.max(...xs) - Math.min(...xs)) / (free.x1 - free.x0)).toFixed(2), h: +((Math.max(...ys) - Math.min(...ys)) / (free.y1 - free.y0)).toFixed(2) };
        }
        return out;
      }, world);
      const file = `${world}-${vp.width}-${lang}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      rows.push({ world, width: vp.width, lang, file, ...info });
      console.log(world, vp.width, lang, JSON.stringify({ tractor: info.tractor, yard: info.yard, clipped: info.labels.filter((l) => l.clipped).map((l) => l.text), labels: info.labels.length, camera: info.camera }));
    }
    await page.close();
  }
await browser.close();
fs.writeFileSync(path.join(OUT, 'overview.json'), JSON.stringify(rows, null, 1));
