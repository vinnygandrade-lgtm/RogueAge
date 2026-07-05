/**
 * One-off PNG export from assets/pwa/icon.svg (requires: npm i sharp --no-save in repo root).
 * Run: node tools/generate_pwa_icons.mjs
 */
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'assets', 'pwa', 'icon.svg');
const outDir = join(root, 'assets', 'pwa');

async function main() {
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch (e) {
        console.error('Install sharp once: npm install sharp --no-save');
        process.exit(1);
    }

    mkdirSync(outDir, { recursive: true });
    const svg = readFileSync(svgPath);

    const sizes = [
        { name: 'icon-180.png', size: 180 },
        { name: 'icon-192.png', size: 192 },
        { name: 'icon-512.png', size: 512 }
    ];

    for (const { name, size } of sizes) {
        await sharp(svg).resize(size, size).png().toFile(join(outDir, name));
        console.log('wrote', name);
    }

    /* Maskable: extra padding so Android adaptive icon does not crop the mark. */
    const maskableSize = 512;
    const inner = 384;
    const pad = Math.floor((maskableSize - inner) / 2);
    const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({
        create: {
            width: maskableSize,
            height: maskableSize,
            channels: 4,
            background: { r: 10, g: 9, b: 8, alpha: 1 }
        }
    })
        .composite([{ input: innerBuf, left: pad, top: pad }])
        .png()
        .toFile(join(outDir, 'icon-maskable-512.png'));
    console.log('wrote icon-maskable-512.png');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
