/**
 * Generates src/i18n/skill_catalog_i18n.ts from src/game/skills.ts catalog.
 * Run: node scripts/generate-skill-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const skillsPath = path.join(root, 'src/game/skills.ts');
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

function ptName(en) {
  if (PT_NAMES[en]) return PT_NAMES[en];
  return autoPtName(en);
}

function ptDesc(en, desc) {
  if (PT_DESCS[en]) return PT_DESCS[en];
  return autoPtDesc(desc);
}

const NAME_WORD_PT = {
  Attack: 'Ataque',
  Power: 'Poder',
  Strike: 'Golpe',
  Wind: 'Vento',
  War: 'Guerra',
  Cry: 'Grito',
  Lion: 'Leão',
  Heart: 'Coração',
  Double: 'Duplo',
  Focus: 'Foco',
  Sonic: 'Sônico',
  Triple: 'Triplo',
  Slash: 'Corte',
  Duelist: 'Duelista',
  Spirit: 'Espírito',
  Barrier: 'Barreira',
  Whirlwind: 'Redemoinho',
  Thunder: 'Trovão',
  Storm: 'Tempestade',
  Thrill: 'Frenesi',
  Fight: 'Combate',
  Howl: 'Uivo',
  Max: 'Máximo',
  Earthquake: 'Terremoto',
  Colossal: 'Colossal',
  Smash: 'Esmagamento',
  Battle: 'Batalha',
  Roar: 'Rugido',
  Iron: 'Ferro',
  Skin: 'Pele',
  Drain: 'Dreno',
  Health: 'Vida',
  Summon: 'Invocar',
  Panther: 'Pantera',
  Will: 'Vontade',
  Hamstring: 'Tendão',
  Touch: 'Toque',
  Of: 'de',
  Death: 'Morte',
  Holy: 'Sagrado',
  Shield: 'Escudo',
  Stun: 'Atordoamento',
  Blessing: 'Bênção',
  Majesty: 'Majestade',
  Phoenix: 'Fênix',
  Mortal: 'Mortal',
  Vicious: 'Vicioso',
  Stance: 'Postura',
  Dash: 'Investida',
  Ultimate: 'Supremo',
  Evasion: 'Esquiva',
  Deadly: 'Letal',
  Blow: 'Golpe',
  Backstab: 'Apunhalada',
  Fake: 'Fingir',
  Stealth: 'Furtividade',
  Lethal: 'Letal',
  Shot: 'Tiro',
  Snipe: 'Franco',
  Rapid: 'Rápido',
  Aura: 'Aura',
  Burn: 'Queimadura',
  Vampiric: 'Vampírico',
  Concentration: 'Concentração',
  Flame: 'Chama',
  Spike: 'Espinho',
  Zombie: 'Zumbi',
  Curse: 'Maldição',
  Gloom: 'Penumbra',
  Corpse: 'Cadáver',
  Burst: 'Explosão',
  Gehenna: 'Gehenna',
  Prominence: 'Proeminência',
  Blazing: 'Flamejante',
  Circle: 'Círculo',
  Surrender: 'Rendição',
  To: 'a',
  Fire: 'Fogo',
  Sleeping: 'Sonolento',
  Cloud: 'Nuvem',
  Volcano: 'Vulcão',
  Kai: 'Kai',
  the: 'o',
  Cat: 'Gato',
  Servitor: 'Servitor',
  Heal: 'Cura',
  Physical: 'Físico',
  Buff: 'Buff',
  Shackle: 'Grilhão',
  Feline: 'Felino',
  King: 'Rei',
  Divine: 'Divino',
  Flash: 'Clarão',
  Greater: 'Maior',
  Trance: 'Transe',
  Armor: 'Armadura',
  Miracle: 'Milagre',
  Might: 'Força',
  Walk: 'Caminhada',
  Major: 'Maior',
  Dryad: 'Dríade',
  Root: 'Raiz',
  Hex: 'Feitiço',
  Twister: 'Tornado',
  Shadow: 'Sombra',
  Spark: 'Faísca',
  Hurricane: 'Furacão',
  Demon: 'Demônio',
  Sting: 'Ferrão',
  Blinding: 'Cegante',
  Silent: 'Silencioso',
  Move: 'Movimento',
  Weakness: 'Fraqueza',
  Flare: 'Clarão',
  Silence: 'Silenciar',
  Poison: 'Veneno',
  Arrow: 'Flecha',
  Freezing: 'Congelante',
  Fatal: 'Fatal',
  Counter: 'Contra',
  Dead: 'Morte',
  Eye: 'Olho',
  Seven: 'Sete',
  Arrows: 'Flechas',
  Dark: 'Sombrio',
  Dance: 'Dança',
  Warrior: 'Guerreiro',
  Symphony: 'Sinfonia',
  Blades: 'Lâminas',
  Defense: 'Defesa',
  Lightning: 'Relâmpago',
  Silhouette: 'Silhueta',
  Spectral: 'Espectral',
  Lord: 'Senhor',
  Empower: 'Empoderar',
  Prophecy: 'Profecia',
  Ice: 'Gelo',
  Elemental: 'Elemental',
  Deflect: 'Desviar',
  Entangle: 'Enredar',
  Tribunal: 'Tribunal',
  Cubic: 'Cúbico',
  Aegis: 'Égide',
  Arrest: 'Prisão',
  Faith: 'Fé',
  Sword: 'Espada',
  Song: 'Canção',
  Earth: 'Terra',
  Hunter: 'Caçador',
  Champion: 'Campeão',
  Sprint: 'Arrancada',
  Sand: 'Areia',
  Bomb: 'Bomba',
  Burst: 'Explosão',
  Aqua: 'Aquático',
  Swirl: 'Redemoinho',
  Solar: 'Solar',
  Hydro: 'Hidro',
  Blast: 'Explosão',
  Wall: 'Muralha',
  Water: 'Água',
  Seed: 'Semente',
  Vortex: 'Vórtice',
  Mirage: 'Miragem',
  Unicorn: 'Unicórnio',
  Magnus: 'Magnus',
  Light: 'Luz',
  Recharge: 'Recarga',
  Heaven: 'Céu',
  Advanced: 'Avançado',
  Agility: 'Agilidade',
  Smash: 'Esmagamento',
  Lionheart: 'Coração de Leão',
  Crush: 'Esmagamento',
  Doom: 'Perdição',
  Frenzy: 'Frenesi',
  Guts: 'Coragem',
  Punch: 'Soco',
  Puma: 'Puma',
  Totem: 'Totem',
  Crippling: 'Paralisante',
  Force: 'Força',
  Assault: 'Assalto',
  Buster: 'Destruidor',
  Ogre: 'Ogros',
  Bison: 'Bisão',
  Destruction: 'Destruição',
  Steal: 'Roubar',
  Essence: 'Essência',
  Dreaming: 'Onírico',
  Chant: 'Canto',
  Despair: 'Desespero',
  Seal: 'Selo',
  Binding: 'Aprisionamento',
  Winter: 'Inverno',
  Gift: 'Dom',
  Disease: 'Doença',
  Vampire: 'Vampiro',
  Fury: 'Fúria',
  Spoil: 'Spoil',
  Sweeper: 'Coletor',
  Hammer: 'Martelo',
  Bounty: 'Recompensa',
  Luck: 'Sorte',
  Festival: 'Festival',
  Mechanic: 'Mecânico',
  Golem: 'Golem',
  Big: 'Grande',
  Boom: 'Explosão',
  Wrath: 'Ira',
  Siege: 'Cerco',
  Maestro: 'Maestro',
  Warsmith: 'Armeiro',
  Fortune: 'Fortuna',
  Seeker: 'Caçador',
};

function autoPtName(en) {
  if (en.includes('_')) {
    return en.replace(/_/g, ' ');
  }
  const tokens = en.match(/[A-Z]?[a-z0-9]+|'[^']+'|[^'\s]+/g) || [en];
  return tokens
    .map((tok) => {
      if (tok === "'") return tok;
      const clean = tok.replace(/^'|'$/g, '');
      if (NAME_WORD_PT[clean]) return NAME_WORD_PT[clean];
      if (NAME_WORD_PT[clean.charAt(0).toUpperCase() + clean.slice(1)]) {
        return NAME_WORD_PT[clean.charAt(0).toUpperCase() + clean.slice(1)];
      }
      return clean;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function autoPtDesc(desc) {
  let d = desc;
  const reps = [
    [/Basic attack\. Essential for hunting\./gi, 'Ataque básico. Essencial para caçar.'],
    [/Heavy physical strike\. Damage x([\d.]+)/gi, 'Golpe físico pesado. Dano ×$1'],
    [/Hurls a sharp wind blade\. Fast magic damage\./gi, 'Dispara uma lâmina de vento cortante. Dano mágico rápido.'],
    [/Increases Attack by (\d+)%\.?/gi, 'Aumenta o Ataque em $1%.'],
    [/Increases P\. Def\. by (\d+)%\.?/gi, 'Aumenta a Def. F. em $1%.'],
    [/Increases P\. Def\.?/gi, 'Aumenta a Def. F.'],
    [/Increases M\. Def\.?/gi, 'Aumenta a Def. M.'],
    [/Increases Defense by (\d+)%\.?/gi, 'Aumenta a Defesa em $1%.'],
    [/Increases Defense/gi, 'Aumenta a Defesa'],
    [/Damage x([\d.]+)/gi, 'Dano ×$1'],
    [/Restores (\d+)% of max HP/gi, 'Restaura $1% do HP máx.'],
    [/Restores (\d+)% of your HP/gi, 'Restaura $1% do seu HP'],
    [/Restores (\d+)% HP/gi, 'Restaura $1% de HP'],
    [/Restores (\d+)%/gi, 'Restaura $1%'],
    [/ALL monsters/gi, 'TODOS os monstros'],
    [/all monsters/gi, 'todos os monstros'],
    [/all enemies/gi, 'todos os inimigos'],
    [/multiple enemies/gi, 'vários inimigos'],
    [/the monster/gi, 'o monstro'],
    [/the enemy/gi, 'o inimigo'],
    [/the target/gi, 'o alvo'],
    [/Summons/gi, 'Invoca'],
    [/summons/gi, 'invoca'],
    [/Greatly increases/gi, 'Aumenta muito'],
    [/Massively/gi, 'Multiplica'],
    [/Supreme/gi, 'Supremo'],
    [/Ultimate/gi, 'Supremo'],
    [/Devastating/gi, 'Devastador'],
    [/Massive damage/gi, 'Dano massivo'],
    [/magic damage/gi, 'dano mágico'],
    [/physical damage/gi, 'dano físico'],
    [/attack speed/gi, 'velocidade de ataque'],
    [/cast speed/gi, 'velocidade de conjuração'],
    [/move speed/gi, 'velocidade de movimento'],
    [/No MP cost!/gi, 'Sem custo de MP!'],
    [/for (\d+)s\./gi, 'por $1s.'],
    [/for 30s\./gi, 'por 30s.'],
    [/for 2 minutes\./gi, 'por 2 minutos.'],
    [/Play dead to drop monsters' aggro\./gi, 'Finge morte para perder aggro dos monstros.'],
    [/Turn invisible to non-aggressive monsters\./gi, 'Fica invisível para monstros não agressivos.'],
    [/Secret greed magic\./gi, 'Magia secreta da ganância.'],
    [/Instantly collects bonus loot/gi, 'Coleta instantaneamente loot bônus'],
    [/Marks the monster/gi, 'Marca o monstro'],
    [/Lowers attack/gi, 'Reduz o ataque'],
    [/lowering defense/gi, 'reduzindo a defesa'],
    [/lowering M\. Def/gi, 'reduzindo a Def. M.'],
    [/stuns the target/gi, 'atordoa o alvo'],
    [/Stuns the target/gi, 'Atordoa o alvo'],
    [/heals you/gi, 'cura você'],
    [/heal you/gi, 'cura você'],
    [/to heal your HP/gi, 'para curar seu HP'],
    [/chance of a one-hit kill/gi, 'chance de abate em um golpe'],
    [/Auto-use:/gi, 'Uso automático:'],
    [/Increases critical damage multiplier by (\d+)%\.?/gi, 'Aumenta o multiplicador de crítico em $1%.'],
    [/Increases attack power and crit chance\./gi, 'Aumenta poder de ataque e chance de crítico.'],
    [/Increases evasion chance\./gi, 'Aumenta a chance de esquiva.'],
    [/Raises P\. Def\./gi, 'Aumenta a Def. F.'],
    [/Raises M\. Def\./gi, 'Aumenta a Def. M.'],
    [/Raises resistance/gi, 'Aumenta a resistência'],
    [/Uses divine magic/gi, 'Usa magia divina'],
    [/Channels magic/gi, 'Canaliza magia'],
    [/Fires/gi, 'Dispara'],
    [/Spin your weapon/gi, 'Gira sua arma'],
    [/Spins your weapon/gi, 'Gira sua arma'],
    [/Detonates corpses/gi, 'Detona cadáveres'],
    [/Puts the monster/gi, 'Coloca o monstro'],
    [/Puts the enemy/gi, 'Coloca o inimigo'],
    [/Pins the monster/gi, 'Prende o monstro'],
    [/Curses the target/gi, 'Amaldiçoa o alvo'],
    [/Curse that/gi, 'Maldição que'],
    [/Shadow curse/gi, 'Maldição sombria'],
    [/Dark magic/gi, 'Magia sombria'],
    [/Blood magic/gi, 'Magia de sangue'],
    [/Holy magic/gi, 'Magia sagrada'],
    [/Divine heal/gi, 'Cura divina'],
    [/Sacred heal/gi, 'Cura sagrada'],
    [/Quickly heals/gi, 'Cura rapidamente'],
    [/Advanced sacred heal/gi, 'Cura sagrada avançada'],
    [/Powerful divine heal/gi, 'Cura divina poderosa'],
    [/The famous mana battery\./gi, 'A famosa bateria de mana.'],
    [/Instantly restores (\d+)% of your mana bar\./gi, 'Restaura instantaneamente $1% da sua barra de mana.'],
    [/Total obliteration\./gi, 'Obliteração total.'],
    [/Catastrophic damage\./gi, 'Dano catastrófico.'],
    [/Extreme physical damage\./gi, 'Dano físico extremo.'],
    [/Total destruction\./gi, 'Destruição total.'],
    [/Total fiery obliteration\./gi, 'Obliteração flamejante total.'],
  ];
  for (const [re, rep] of reps) d = d.replace(re, rep);
  return d;
}

/** Hand-curated PT names for player-facing skills (fallback: EN key). */
const PT_NAMES = {
  Attack: 'Ataque',
  'Power Strike': 'Golpe Poderoso',
  'Wind Strike': 'Golpe de Vento',
  'War Cry': 'Grito de Guerra',
  'Lion Heart': 'Coração de Leão',
  'Double Strike': 'Golpe Duplo',
  'Focus Attack': 'Foco de Ataque',
  Whirlwind: 'Redemoinho',
  'HP Potion': 'Poção de HP',
};

/** PT descriptions keyed by EN skill name (extend over time). */
const PT_DESCS = {
  Attack: 'Ataque básico. Essencial para caçar.',
  'Power Strike': 'Golpe físico pesado. Dano ×1,5.',
  'Wind Strike': 'Dispara uma lâmina de vento cortante. Dano mágico rápido.',
  'War Cry': 'Aumenta o Ataque em 20%.',
  'Lion Heart': 'Aumenta a Def. F. em 30%.',
  'Double Strike': 'Golpe duplo rápido. Dano ×2,0.',
  'Focus Attack': 'Aumenta a velocidade de ataque em 15%.',
  Whirlwind: 'Gira a arma, atingindo TODOS os monstros.',
  Spoil: 'Magia secreta da ganância. Marca o monstro para materiais extras na morte.',
  Sweeper: 'Coleta instantaneamente loot bônus de um inimigo morto com Spoil.',
};

function main() {
  const src = fs.readFileSync(skillsPath, 'utf8');
  const start = src.indexOf('const bancoDeSkills');
  const end = src.indexOf('// ÁRVORE DE APRENDIZADO');
  if (start < 0 || end < 0) {
    console.error('Could not locate bancoDeSkills in skills.ts');
    process.exit(1);
  }
  const catalogSrc = src.slice(start, end);
  const skills = extractSkillsFromSource(catalogSrc);
  const sorted = [...skills.values()].sort((a, b) => a.slug.localeCompare(b.slug));

  const enNames = {};
  const enDesc = {};
  const ptNames = {};
  const ptDescMap = {};

  for (const s of sorted) {
    enNames[s.slug] = s.name;
    enDesc[s.slug] = s.desc;
    ptNames[s.slug] = ptName(s.name);
    ptDescMap[s.slug] = ptDesc(s.name, s.desc);
  }

  const lines = [];
  lines.push('/**');
  lines.push(' * Auto-generated skill i18n catalog — do not edit by hand.');
  lines.push(' * Regenerate: node scripts/generate-skill-i18n.mjs');
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
