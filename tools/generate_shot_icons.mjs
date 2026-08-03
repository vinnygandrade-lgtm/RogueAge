/**
 * Generate 256×256 Soulshot / Spiritshot icons (bronze frame + crystal).
 * Pure Node (zlib) — no sharp required.
 * Run: node tools/generate_shot_icons.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'assets', 'itens');

const SIZE = 256;
const FRAME = { r: 0x73, g: 0x59, b: 0x39 };
const FRAME_DARK = { r: 0x24, g: 0x17, b: 0x10 };

const GRADES = [
  { slug: 'ng', label: 'NG', glow: [180, 180, 170], crystal: [210, 205, 190] },
  { slug: 'd', label: 'D', glow: [80, 160, 200], crystal: [110, 190, 230] },
  { slug: 'c', label: 'C', glow: [90, 200, 150], crystal: [120, 230, 180] },
  { slug: 'b', label: 'B', glow: [230, 140, 70], crystal: [250, 170, 100] },
  { slug: 'a', label: 'A', glow: [240, 210, 90], crystal: [255, 230, 120] },
  { slug: 's', label: 'S', glow: [255, 160, 220], crystal: [255, 200, 235] },
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba) {
  const width = SIZE;
  const height = SIZE;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPx(rgba, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function fillRect(rgba, x0, y0, x1, y1, r, g, b) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) setPx(rgba, x, y, r, g, b);
  }
}

function drawCircle(rgba, cx, cy, radius, r, g, b, soft = false) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius - 2); y <= Math.ceil(cy + radius + 2); y++) {
    for (let x = Math.floor(cx - radius - 2); x <= Math.ceil(cx + radius + 2); x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        if (soft) {
          const t = Math.sqrt(d2) / radius;
          const a = Math.max(0, Math.min(255, Math.floor((1 - t * t) * 220)));
          const i = (y * SIZE + x) * 4;
          if (i < 0 || i >= rgba.length) continue;
          const inv = a / 255;
          rgba[i] = Math.min(255, Math.floor(rgba[i] * (1 - inv) + r * inv));
          rgba[i + 1] = Math.min(255, Math.floor(rgba[i + 1] * (1 - inv) + g * inv));
          rgba[i + 2] = Math.min(255, Math.floor(rgba[i + 2] * (1 - inv) + b * inv));
        } else {
          setPx(rgba, x, y, r, g, b);
        }
      }
    }
  }
}

/** Tiny 5×7 bitmap digits/letters for NG D C B A S */
const GLYPHS = {
  N: ['11101', '11011', '11011', '11111', '11011', '11011', '11011'],
  G: ['01110', '11011', '11000', '11011', '11011', '11011', '01110'],
  D: ['11110', '11011', '11011', '11011', '11011', '11011', '11110'],
  C: ['01110', '11011', '11000', '11000', '11000', '11011', '01110'],
  B: ['11110', '11011', '11011', '11110', '11011', '11011', '11110'],
  A: ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'],
};

function drawGlyph(rgba, ch, ox, oy, scale, r, g, b) {
  const rows = GLYPHS[ch];
  if (!rows) return;
  for (let gy = 0; gy < rows.length; gy++) {
    for (let gx = 0; gx < 5; gx++) {
      if (rows[gy][gx] !== '1') continue;
      fillRect(
        rgba,
        ox + gx * scale,
        oy + gy * scale,
        ox + (gx + 1) * scale,
        oy + (gy + 1) * scale,
        r,
        g,
        b,
      );
    }
  }
}

function drawLabel(rgba, label, cx, cy, r, g, b) {
  const scale = label.length > 1 ? 4 : 5;
  const charW = 5 * scale + 2;
  const totalW = label.length * charW - 2;
  let x = Math.floor(cx - totalW / 2);
  const y = Math.floor(cy - (7 * scale) / 2);
  for (const ch of label) {
    drawGlyph(rgba, ch, x, y, scale, r, g, b);
    x += charW;
  }
}

function makeIcon(kind, grade) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4, 0);
  const bg = kind === 'soul'
    ? { r: 0x3a, g: 0x24, b: 0x10 }
    : { r: 0x0f, g: 0x27, b: 0x40 };

  // Panel fill
  fillRect(rgba, 10, 10, SIZE - 10, SIZE - 10, bg.r, bg.g, bg.b);
  // Outer bronze frame
  for (let i = 0; i < 10; i++) {
    const c = i < 3 ? FRAME : FRAME_DARK;
    // top/bottom
    fillRect(rgba, i, i, SIZE - i, i + 1, c.r, c.g, c.b);
    fillRect(rgba, i, SIZE - 1 - i, SIZE - i, SIZE - i, c.r, c.g, c.b);
    // left/right
    fillRect(rgba, i, i, i + 1, SIZE - i, c.r, c.g, c.b);
    fillRect(rgba, SIZE - 1 - i, i, SIZE - i, SIZE - i, c.r, c.g, c.b);
  }
  // Inner highlight rim
  fillRect(rgba, 12, 12, SIZE - 12, 14, 0xa0, 0x7a, 0x4a);
  fillRect(rgba, 12, 12, 14, SIZE - 12, 0xa0, 0x7a, 0x4a);

  const cx = SIZE / 2;
  const cy = SIZE / 2 - 8;
  drawCircle(rgba, cx, cy, 78, grade.glow[0], grade.glow[1], grade.glow[2], true);
  drawCircle(rgba, cx, cy, 52, grade.crystal[0], grade.crystal[1], grade.crystal[2], false);
  // Highlight
  drawCircle(rgba, cx - 14, cy - 16, 14, 255, 255, 255, true);

  // Ampoule stem
  const stemColor = kind === 'soul' ? [200, 150, 60] : [100, 180, 230];
  fillRect(rgba, cx - 8, cy + 48, cx + 8, cy + 78, stemColor[0], stemColor[1], stemColor[2]);
  fillRect(rgba, cx - 18, cy + 74, cx + 18, cy + 88, FRAME.r, FRAME.g, FRAME.b);

  drawLabel(rgba, grade.label, cx, SIZE - 36, 245, 230, 190);

  return encodePng(rgba);
}

mkdirSync(outDir, { recursive: true });
for (const grade of GRADES) {
  const ss = makeIcon('soul', grade);
  const bs = makeIcon('spirit', grade);
  writeFileSync(join(outDir, `soulshot_${grade.slug}.png`), ss);
  writeFileSync(join(outDir, `spiritshot_${grade.slug}.png`), bs);
  console.log('wrote', `soulshot_${grade.slug}.png`, `spiritshot_${grade.slug}.png`);
}
console.log('done');
