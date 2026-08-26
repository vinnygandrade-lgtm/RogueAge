/**
 * Export world-map layers to the live canvas 1080×1620 (alpha PNG).
 * Drop the raw cutout in assets/world/_incoming/<id>.png then:
 *   npm run export:world
 *
 * Landmark cutouts live: forest, clanwar, daily, olympiad, raid.
 * Requires: npm install sharp --no-save
 */
import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'world');
const incoming = join(dir, '_incoming');
const W = 1080;
const H = 1620;

/** Expedition first; add an id here when the next cutout is ready. */
const LAYERS = ['forest', 'daily', 'clanwar', 'olympiad', 'raid'];

function kb(p) {
  return (statSync(p).size / 1024).toFixed(0) + ' KB';
}

function resolveSource(id) {
  const drop = join(incoming, `${id}.png`);
  const live = join(dir, `${id}.png`);
  if (existsSync(drop)) return drop;
  if (existsSync(live)) return live;
  return null;
}

async function exportLayer(sharp, id) {
  const src = resolveSource(id);
  if (!src) {
    console.log('skip   ', id + '.png', '(drop in assets/world/_incoming/)');
    return false;
  }
  const out = join(dir, `${id}.png`);
  const tmp = join(dir, `_${id}_tmp.png`);
  console.log('before ', id, kb(src));
  // Same crop as map_bg.jpg when the drop matches the locked Gemini master (1696×2528).
  let pipeline = sharp(src).ensureAlpha();
  const srcMeta = await sharp(src).metadata();
  if (srcMeta.width === 1696 && srcMeta.height === 2528) {
    pipeline = pipeline.extract({ left: 6, top: 0, width: 1685, height: 2528 });
  }
  await pipeline
    .resize(W, H, { fit: 'fill' })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(tmp);
  if (existsSync(out) && src !== out) {
    try { unlinkSync(out); } catch { /* ignore */ }
  }
  if (src === out) {
    try { unlinkSync(out); } catch { /* ignore */ }
  }
  renameSync(tmp, out);
  const outMeta = await sharp(out).metadata();
  console.log(
    'after  ',
    id,
    kb(out),
    `${outMeta.width}x${outMeta.height}`,
    outMeta.format,
    outMeta.hasAlpha ? 'alpha' : 'no-alpha',
  );
  return true;
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp once: npm install sharp --no-save');
    process.exit(1);
  }

  mkdirSync(incoming, { recursive: true });

  const bg = join(dir, 'map_bg.jpg');
  if (existsSync(bg)) {
    const meta = await sharp(bg).metadata();
    console.log('bg     ', kb(bg), `${meta.width}x${meta.height}`);
  }

  let any = false;
  for (const id of LAYERS) {
    any = (await exportLayer(sharp, id)) || any;
  }
  if (!any) {
    console.log('\nNo cutouts yet. Save Deepgrove as assets/world/_incoming/forest.png and run again.');
    process.exitCode = 0;
    return;
  }
  console.log('\nDone. Hard-refresh World in the client (Vite does not watch assets/).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
