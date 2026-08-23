/**
 * Export town plaza art to the live canvas 1080×1620.
 * Requires: npm install sharp --no-save
 */
import { renameSync, unlinkSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'town');
const W = 1080;
const H = 1620;
const NPCS = ['crafting.png', 'grocer.png', 'equipment.png', 'classmaster.png', 'enchanter.png'];

function kb(p) {
  return (statSync(p).size / 1024).toFixed(0) + ' KB';
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp once: npm install sharp --no-save');
    process.exit(1);
  }

  const bgIn = join(dir, 'plaza_bg.jpg');
  console.log('before  bg', kb(bgIn));

  await sharp(bgIn)
    .resize(W, H, { fit: 'fill' })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(join(dir, '_plaza_bg_tmp.jpg'));

  try { unlinkSync(bgIn); } catch { /* ignore */ }
  renameSync(join(dir, '_plaza_bg_tmp.jpg'), bgIn);
  const bgMeta = await sharp(bgIn).metadata();
  console.log('after   bg', kb(bgIn), bgMeta.width + 'x' + bgMeta.height, bgMeta.format);

  for (const name of NPCS) {
    const npcIn = join(dir, name);
    if (!existsSync(npcIn)) {
      console.log('skip   ', name, '(missing)');
      continue;
    }
    console.log('before ', name, kb(npcIn));
    const tmp = join(dir, '_' + name.replace('.png', '_tmp.png'));
    await sharp(npcIn)
      .ensureAlpha()
      .resize(W, H, { fit: 'fill' })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(tmp);
    try { unlinkSync(npcIn); } catch { /* ignore */ }
    renameSync(tmp, npcIn);
    const meta = await sharp(npcIn).metadata();
    console.log('after  ', name, kb(npcIn), meta.width + 'x' + meta.height, meta.format, meta.hasAlpha ? 'alpha' : 'no-alpha');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
