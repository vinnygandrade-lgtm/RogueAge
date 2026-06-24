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

await new Promise((r) => server.listen(8766, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

await page.evaluate(async () => {
  const perfil = document.getElementById('tela-perfil');
  const game = document.getElementById('screen-game');
  if (game) { game.classList.add('active-screen'); game.style.display = 'flex'; }
  if (perfil) perfil.style.display = 'flex';
  const base = document.getElementById('char-base-layer');
  await new Promise((resolve) => {
    base.removeAttribute('hidden');
    base.style.display = 'block';
    base.onload = resolve;
    base.src = 'assets/paperdolls/human_fighter/body.png';
    if (base.complete) resolve();
  });
  if (typeof window.applyPaperdollConfigAll === 'function') window.applyPaperdollConfigAll();
  if (typeof window.syncPaperdollFootShadow === 'function') window.syncPaperdollFootShadow();
});

const pd = page.locator('#tela-perfil .l2-paperdoll--profile');
await pd.scrollIntoViewIfNeeded();
await page.evaluate(() => {
  const pane = document.querySelector('#tela-perfil .profile-scroll-pane');
  const el = document.querySelector('#tela-perfil .l2-paperdoll--profile');
  if (pane && el) {
    const top = el.offsetTop - pane.clientHeight * 0.15;
    pane.scrollTop = Math.max(0, top);
  }
});
await page.waitForTimeout(400);
await pd.screenshot({ path: path.join(root, 'tools', 'paperdoll-debug.png') });
console.log('saved tools/paperdoll-debug.png');

await browser.close();
server.close();
