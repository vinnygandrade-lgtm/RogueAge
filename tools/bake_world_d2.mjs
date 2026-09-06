/**
 * Scale locked D2 to the live world canvas.
 * Source: assets/world/_incoming/world-map-d2.png
 * Out:    assets/world/map_bg.jpg (1080×1620)
 *
 * Cutouts are manual — do not generate silhouettes here.
 * Drop assets/world/_incoming/<id>.png then: npm run export:world
 */
import { copyFileSync, existsSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'world');
const incoming = join(dir, '_incoming');
const W = 1080;
const H = 1620;

async function main() {
  const sharp = (await import('sharp')).default;
  const src = join(incoming, 'world-map-d2.png');
  if (!existsSync(src)) {
    console.error('Missing', src);
    process.exit(1);
  }

  const bg = join(dir, 'map_bg.jpg');
  const bak = join(dir, 'map_bg.vale-blky7o.bak.jpg');
  if (existsSync(bg) && !existsSync(bak)) {
    copyFileSync(bg, bak);
    console.log('backed up old vale map_bg →', bak);
  }

  const bgTmp = join(dir, '_map_bg_tmp.jpg');
  await sharp(src)
    .resize(W, H, { fit: 'fill' })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(bgTmp);
  if (existsSync(bg)) unlinkSync(bg);
  renameSync(bgTmp, bg);
  const bgMeta = await sharp(bg).metadata();
  console.log('map_bg', `${bgMeta.width}x${bgMeta.height}`, bgMeta.format);
  console.log('Cutouts: drop _incoming/<id>.png then npm run export:world');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
