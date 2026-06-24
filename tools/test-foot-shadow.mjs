import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.join(root, decodeURIComponent(url));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('404');
    return;
  }
  const ext = path.extname(file);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(8765, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });

const logs = [];
page.on('console', (msg) => logs.push(msg.text()));

await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

const result = await page.evaluate(async () => {
  const out = { steps: [] };
  const perfil = document.getElementById('tela-perfil');
  const game = document.getElementById('screen-game');
  if (game) game.classList.add('active-screen');
  if (game) game.style.display = 'flex';
  if (perfil) perfil.style.display = 'flex';

  const stack = document.querySelector('.paperdoll-character-stack');
  const root = document.querySelector('.l2-paperdoll');
  const foot = document.querySelector('.paperdoll-foot-shadow');
  const base = document.getElementById('char-base-layer');
  if (!stack || !root || !foot || !base) {
    out.error = 'missing dom';
    return out;
  }

  const bodySrc = 'assets/paperdolls/human_fighter/body.png';
  await new Promise((resolve, reject) => {
    base.removeAttribute('hidden');
    base.style.display = 'block';
    base.onload = resolve;
    base.onerror = () => reject(new Error('body load fail'));
    base.src = bodySrc;
    if (base.complete) resolve();
  });
  out.steps.push('body loaded ' + base.naturalWidth + 'x' + base.naturalHeight);

  if (typeof window.applyPaperdollConfigAll === 'function') window.applyPaperdollConfigAll();
  if (typeof window.syncPaperdollFootShadow === 'function') window.syncPaperdollFootShadow();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (typeof window.syncPaperdollFootShadow === 'function') window.syncPaperdollFootShadow();

  const cs = getComputedStyle(foot);
  const fr = foot.getBoundingClientRect();
  const br = base.getBoundingClientRect();
  out.foot = {
    display: cs.display,
    opacity: cs.opacity,
    visibility: cs.visibility,
    width: cs.width,
    height: cs.height,
    left: cs.left,
    bottom: cs.bottom,
    zIndex: cs.zIndex,
    rect: { w: fr.width, h: fr.height, top: fr.top, left: fr.left },
    inline: {
      display: foot.style.display,
      opacity: foot.style.opacity,
      bottom: foot.style.bottom,
      left: foot.style.left,
      width: foot.style.width
    },
    dataOn: root.getAttribute('data-pd-shadow-on')
  };
  out.baseHidden = base.hasAttribute('hidden');
  out.baseDisplay = getComputedStyle(base).display;
  out.stackRect = stack.getBoundingClientRect();
  return out;
});

console.log(JSON.stringify(result, null, 2));
console.log('console:', logs.filter((l) => l.includes('paperdoll')).slice(0, 8));

await browser.close();
server.close();
