/**
 * Export expedition-map layers to the live canvas 1080×1620 (alpha PNG).
 * Drop the raw cutout in assets/expedition/_incoming/<id>.png then:
 *   npm run export:expedition
 *
 * Cutouts are manual. Same pose as map_bg.jpg — do not recenter.
 * Requires: npm install sharp --no-save
 */
import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'expedition');
const incoming = join(dir, '_incoming');
const W = 1080;
const H = 1620;

/** Grade landmarks on the trail painting. */
const LAYERS = ['ng', 'd', 'c', 'b', 'a', 's'];

function kb(p) {
  return (statSync(p).size / 1024).toFixed(0) + ' KB';
}

function resolveSource(id) {
  const drop = join(incoming, `${id}.png`);
  if (existsSync(drop)) return drop;
  return null;
}

async function exportLayer(sharp, id) {
  const src = resolveSource(id);
  if (!src) {
    console.log('skip   ', id + '.png', '(drop in assets/expedition/_incoming/)');
    return false;
  }
  const out = join(dir, `${id}.png`);
  const tmp = join(dir, `_${id}_tmp.png`);
  console.log('before ', id, kb(src));
  await sharp(src)
    .ensureAlpha()
    .resize(W, H, { fit: 'fill' })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(tmp);
  if (existsSync(out)) {
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
    console.log('\nNo cutouts yet. Save Talking Island as assets/expedition/_incoming/ng.png and run again.');
    process.exitCode = 0;
    return;
  }
  console.log('\nDone. Hard-refresh Expedition in the client (Vite does not watch assets/).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
