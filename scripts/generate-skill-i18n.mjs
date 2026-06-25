/**
 * Generates src/i18n/skill_catalog_i18n.ts from src/game/skills.ts + PT catalog.
 *
 * PT source of truth: scripts/skill_pt_catalog.json
 * (maintain via scripts/build-skill-pt-catalog.mjs)
 *
 * Run: npm run generate:skill-i18n
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const skillsPath = path.join(root, 'src/game/skills.ts');
const ptPath = path.join(root, 'scripts/skill_pt_catalog.json');
const outPath = path.join(root, 'src/i18n/skill_catalog_i18n.ts');

function skillSlug(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

/** Last-wins merge like Object.assign on bancoDeSkills blocks. */
function extractSkillsFromSource(src) {
  const merged = new Map();
  const nameRe = /"([^"]+)":\s*\{/g;
  let m;
  while ((m = nameRe.exec(src)) !== null) {
    const name = m[1];
    const bodyStart = m.index + m[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const body = src.slice(bodyStart, i - 1);
    if (!/\btipo\s*:/.test(body)) continue;
    const descM = body.match(/desc\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (!descM) continue;
    const desc = descM[1].replace(/\\"/g, '"');
    merged.set(name, { name, desc, slug: skillSlug(name) });
  }
  return merged;
}

function main() {
  if (!fs.existsSync(ptPath)) {
    console.error('Missing scripts/skill_pt_catalog.json — run: node scripts/build-skill-pt-catalog.mjs');
    process.exit(1);
  }
  const ptCatalog = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

  const src = fs.readFileSync(skillsPath, 'utf8');
  const start = src.indexOf('const bancoDeSkills');
  const end = src.indexOf('// ÁRVORE DE APRENDIZADO');
  if (start < 0 || end < 0) {
    console.error('Could not locate bancoDeSkills in skills.ts');
    process.exit(1);
  }
  const skills = extractSkillsFromSource(src.slice(start, end));
  const sorted = [...skills.values()].sort((a, b) => a.slug.localeCompare(b.slug));

  const missingPt = sorted.filter((s) => !ptCatalog[s.slug]);
  if (missingPt.length) {
    console.error('Missing PT catalog entries for:', missingPt.map((s) => s.slug).join(', '));
    console.error('Add them in scripts/build-skill-pt-catalog.mjs then run build-skill-pt-catalog.mjs');
    process.exit(1);
  }

  const enNames = {};
  const enDesc = {};
  const ptNames = {};
  const ptDescMap = {};

  for (const s of sorted) {
    enNames[s.slug] = s.name;
    enDesc[s.slug] = s.desc;
    ptNames[s.slug] = ptCatalog[s.slug].name;
    ptDescMap[s.slug] = ptCatalog[s.slug].desc;
  }

  const lines = [];
  lines.push('/**');
  lines.push(' * Auto-generated skill i18n catalog — do not edit by hand.');
  lines.push(' * Regenerate: npm run generate:skill-i18n');
  lines.push(' */');
  lines.push('');
  lines.push('export type SkillCatalogI18nLocale = {');
  lines.push('  names: Record<string, string>;');
  lines.push('  desc: Record<string, string>;');
  lines.push('};');
  lines.push('');
  lines.push('export const SKILL_CATALOG_I18N: Record<string, SkillCatalogI18nLocale> = {');
  lines.push("  en: {");
  lines.push('    names: {');
  for (const s of sorted) {
    lines.push(`      ${s.slug}: '${escapeStr(enNames[s.slug])}',`);
  }
  lines.push('    },');
  lines.push('    desc: {');
  for (const s of sorted) {
    lines.push(`      ${s.slug}: '${escapeStr(enDesc[s.slug])}',`);
  }
  lines.push('    },');
  lines.push('  },');
  lines.push("  'pt-BR': {");
  lines.push('    names: {');
  for (const s of sorted) {
    lines.push(`      ${s.slug}: '${escapeStr(ptNames[s.slug])}',`);
  }
  lines.push('    },');
  lines.push('    desc: {');
  for (const s of sorted) {
    lines.push(`      ${s.slug}: '${escapeStr(ptDescMap[s.slug])}',`);
  }
  lines.push('    },');
  lines.push('  },');
  lines.push('};');
  lines.push('');
  lines.push('export function mergeSkillCatalogIntoLocales(locales: Record<string, Record<string, unknown>>): void {');
  lines.push('  for (const locale of Object.keys(SKILL_CATALOG_I18N)) {');
  lines.push('    const pack = SKILL_CATALOG_I18N[locale];');
  lines.push('    if (!pack || !locales[locale]) continue;');
  lines.push('    const game = locales[locale].game as Record<string, unknown> | undefined;');
  lines.push('    if (!game) continue;');
  lines.push('    const skills = (game.skills as Record<string, unknown>) || (game.skills = {});');
  lines.push('    Object.assign(skills, { names: { ...(skills.names as object), ...pack.names }, desc: { ...(skills.desc as object), ...pack.desc } });');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  lines.push('export function skillSlugFromKey(skillKey: string): string {');
  lines.push("  return skillKey.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();");
  lines.push('}');
  lines.push('');
  lines.push('export {};');

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${sorted.length} skills to ${path.relative(root, outPath)}`);
}

main();
