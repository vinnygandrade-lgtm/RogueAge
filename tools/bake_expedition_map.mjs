/**
 * Scale the locked expedition trail painting to the live canvas.
 * Source: assets/world/_incoming/expedition-map-a.png
 * Out:    assets/expedition/map_bg.jpg (1080×1620)
 *
 * Cutouts are manual — do not generate silhouettes here.
 * Drop assets/expedition/_incoming/<id>.png then: npm run export:expedition
 */
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const incomingWorld = join(root, 'assets', 'world', '_incoming');
const dir = join(root, 'assets', 'expedition');
const W = 1080;
const H = 1620;

async function main() {
  const sharp = (await import('sharp')).default;
  const src = join(incomingWorld, 'expedition-map-a.png');
  if (!existsSync(src)) {
    console.error('Missing', src);
    process.exit(1);
  }

  mkdirSync(dir, { recursive: true });
  const bg = join(dir, 'map_bg.jpg');
  const bgTmp = join(dir, '_map_bg_tmp.jpg');
  await sharp(src)
    .resize(W, H, { fit: 'fill' })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(bgTmp);
  if (existsSync(bg)) unlinkSync(bg);
  renameSync(bgTmp, bg);
  const bgMeta = await sharp(bg).metadata();
  console.log('map_bg', `${bgMeta.width}x${bgMeta.height}`, bgMeta.format);
  console.log('Cutouts: drop assets/expedition/_incoming/<id>.png then npm run export:expedition');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
