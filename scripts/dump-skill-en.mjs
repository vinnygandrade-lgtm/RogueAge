import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsPath = path.join(root, 'src/game/skills.ts');
const src = fs.readFileSync(skillsPath, 'utf8');
const start = src.indexOf('const bancoDeSkills');
const end = src.indexOf('// ÁRVORE DE APRENDIZADO');
const catalogSrc = src.slice(start, end);

function skillSlug(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

const merged = new Map();
const nameRe = /"([^"]+)":\s*\{/g;
let m;
while ((m = nameRe.exec(catalogSrc)) !== null) {
  const name = m[1];
  const bodyStart = m.index + m[0].length;
  let depth = 1;
  let i = bodyStart;
  while (i < catalogSrc.length && depth > 0) {
    const ch = catalogSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const body = catalogSrc.slice(bodyStart, i - 1);
  if (!/\btipo\s*:/.test(body)) continue;
  const descM = body.match(/desc\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!descM) continue;
  const desc = descM[1].replace(/\\"/g, '"');
  merged.set(name, { slug: skillSlug(name), name, desc });
}

const out = {};
for (const row of [...merged.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
  out[row.slug] = { name: row.name, desc: row.desc };
}
fs.writeFileSync(path.join(root, 'scripts/skill_en_catalog.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', Object.keys(out).length, 'skills to scripts/skill_en_catalog.json');
