// What the film round costs, in a headless Chrome on the Mac's Metal GPU with the CPU slowed by the DevTools protocol (a phone's is about 4 times slower than this Mac's):
// for each world, in a fresh page, the wall clock of the first frame after the switch (the world is built there) and the mean of the next 40 frames (one step each, the
// GPU finished), at 390 x 844 and a pixel ratio of 2, with the CPU at 1x and at 4x. It is a proxy, not a phone: the GPU is not slowed.
//   URL=http://localhost:5883/ OUT=file.json ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film1-cost.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const deps = path.join(os.homedir(), '.cache/lab-review');
const puppeteer = createRequire(path.join(deps, 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const BASE = process.env.URL ?? 'http://localhost:5883/';
const OUT = process.env.OUT;
const WORLDS = process.env.WORLDS ? process.env.WORLDS.split(',') : ['farm', 'tractor', 'gasifier', 'gas-train', 'garage'];
const GL = ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];

function pinClocks() {
  let now = 0;
  let queue = new Map();
  let id = 0;
  performance.now = () => now;
  window.requestAnimationFrame = (cb) => (queue.set(++id, cb), id);
  window.cancelAnimationFrame = (k) => void queue.delete(k);
  window.__step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      now += 1000 / 30;
      const q = queue;
      queue = new Map();
      for (const cb of q.values()) cb(now);
    }
  };
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 0, args: [...GL, '--hide-scrollbars', '--mute-audio'] });
const result = {};
for (const rate of [1, 4]) {
  for (const world of WORLDS) {
    const runs = [];
    for (let rep = 0; rep < 3; rep++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.evaluateOnNewDocument(pinClocks);
      await page.evaluateOnNewDocument(() => localStorage.setItem('gasifier-lab:entry-notice', '1'));
      const cdp = await page.createCDPSession();
      // the farm is the page's own world: open the page on another one so that the farm is built at the switch, like the rest
      await page.goto(world === 'farm' ? `${BASE}#garage` : BASE, { waitUntil: 'load', timeout: 180000 });
      for (let i = 0; i < 900 && !(await page.evaluate(() => !!window.__lab?.stage)); i++) await new Promise((r) => setTimeout(r, 100));
      await page.evaluate(() => {
        window.__lab.store.set({ labels: 'none', panelOpen: false });
        window.__step(12);
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const t0 = process.hrtime.bigint();
      await page.evaluate((w) => {
        window.__lab.store.set({ scene: w });
        window.__step(1);
        window.__lab.stage.renderer.getContext().finish();
      }, world);
      const t1 = process.hrtime.bigint();
      const first = Number(t1 - t0) / 1e6;
      await page.evaluate(() => window.__step(6));
      const mean = await page.evaluate(() => {
        const gl = window.__lab.stage.renderer.getContext();
        const start = Date.now();
        for (let i = 0; i < 40; i++) {
          window.__step(1);
          gl.finish();
        }
        return (Date.now() - start) / 40;
      });
      runs.push({ first, mean });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await page.close();
    }
    runs.sort((a, b) => a.first - b.first);
    result[`${world}@x${rate}`] = { firstMs: runs.map((r) => Math.round(r.first)), meanFrameMs: runs.map((r) => +r.mean.toFixed(1)) };
    console.log(world, `x${rate}`, JSON.stringify(result[`${world}@x${rate}`]));
  }
}
await browser.close();
if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
