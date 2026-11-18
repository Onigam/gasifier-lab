// The shader programs a visit compiles, world by world, in the order of the tabs (film round 4, docs/qa.md « Film round 3 », the garage's first frame): for each world, how many programs the page holds once the world has been shown and left to warm, and, for the
// programs that world added, which meshes use them. Fresh page, the phone profile (390 × 844, pixel ratio 2). It judges nothing.
//   URL=http://localhost:5891/ OUT=file.json ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film4-programs.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const puppeteer = createRequire(path.join(os.homedir(), '.cache/lab-review', 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const { URL: BASE, OUT } = process.env;
if (!BASE || !OUT) throw new Error('Set URL and OUT.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => localStorage.setItem('gasifier-lab:entry-notice', '1'));
await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 900 && !(await page.evaluate(() => !!window.__lab?.stage)); i++) await sleep(100);
await page.evaluate(() => document.querySelector('.narr-invite__x')?.click());
const out = {};
let seen = [];
for (const w of ['farm', 'tractor', 'gasifier', 'gas-train', 'garage']) {
  await page.evaluate((w) => window.__lab.store.set({ scene: w }), w);
  await sleep(6000);
  const r = await page.evaluate((seen) => {
    const st = window.__lab.stage;
    const ren = st.renderer;
    const progs = ren.info.programs ?? [];
    const keys = progs.map((p) => p.cacheKey);
    const fresh = progs.filter((p) => !seen.includes(p.cacheKey));
    const users = new Map();
    st.active.scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        const pr = ren.properties.get(m)?.currentProgram;
        if (!pr) continue;
        if (!users.has(pr)) users.set(pr, []);
        const list = users.get(pr);
        if (list.length < 4) list.push(`${o.name || o.parent?.name || o.type}:${m.type}`);
      }
    });
    return {
      count: progs.length,
      all: progs.map((p) => p.cacheKey),
      keys,
      added: fresh.map((p) => ({ name: p.name, users: users.get(p) ?? [], key: p.cacheKey })),
    };
  }, seen);
  seen = r.keys;
  out[w] = { count: r.count, added: r.added, all: r.all };
  console.log(w, r.count, `+${r.added.length}`, JSON.stringify(r.added.map((a) => `${a.name} ${a.users.join(' ')}`)));
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
await browser.close();
