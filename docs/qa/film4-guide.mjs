// Film round 4 (docs/qa.md « Film round 3 », B1): the farm's part of the spoken guide played at 1280 × 800 in one language, a screenshot every 3 s and where the camera looks, Flux as the guide sets it. It judges nothing.
//   URL=http://localhost:5891/ OUT=/some/dir LANG_=fr ~/Dev/onigam-video/tools/with-chrome-lock.sh node docs/qa/film4-guide.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
const puppeteer = createRequire(path.join(os.homedir(), '.cache/lab-review', 'index.js'))('puppeteer-core');
const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const { URL: BASE, OUT } = process.env;
const LANG = process.env.LANG_ ?? 'fr';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
await page.evaluateOnNewDocument((lang) => { localStorage.setItem('gasifier-lab:entry-notice', '1'); localStorage.setItem('gasifier-lab:lang', lang); }, LANG);
await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 600 && !(await page.evaluate(() => !!window.__lab?.stage)); i++) await sleep(100);
await page.evaluate(() => document.querySelector('.narr-invite__x')?.click());
await sleep(2500);
await page.evaluate(() => window.__lab.narration.play('scene:farm'));
const t0 = Date.now();
let k = 0;
const log = [];
while (Date.now() - t0 < 48000) {
  const s = await page.evaluate(() => ({ sel: window.__lab.store.state.selected, flows: window.__lab.store.state.schematic, tgt: window.__lab.stage.controls.target.toArray().map((v) => +v.toFixed(1)) }));
  log.push({ t: +((Date.now() - t0) / 1000).toFixed(1), ...s });
  if ((Date.now() - t0) / 1000 > k * 3) { await page.screenshot({ path: `${OUT}/guide-${LANG}-${String(k).padStart(2, '0')}.png` }); k++; }
  await sleep(400);
}
fs.writeFileSync(`${OUT}/guide-${LANG}.json`, JSON.stringify({ log, errors }, null, 1));
console.log('guide', LANG, 'errors', errors.length);
await browser.close();
