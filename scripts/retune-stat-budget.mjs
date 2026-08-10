/**
 * One-shot catalog retune for docs/stat-budget.md targets.
 * Safe to re-run only once on current values — check git before applying again.
 */
import fs from 'fs';

function patch(file, replacements) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [re, rep] of replacements) {
    if (!re.test(s)) {
      console.warn('MISS', file, String(re));
      continue;
    }
    s = s.replace(re, rep);
  }
  fs.writeFileSync(file, s);
  console.log('patched', file);
}

patch('src/db/db_items.ts', [
  [/bonusSpd: 10, bonusCrit: 1, bonusDodge: 2/, 'bonusSpd: 40, bonusCrit: 1, bonusDodge: 1'],
  [/bonusSpd: 20, bonusCrit: 2, bonusDodge: 3/, 'bonusSpd: 80, bonusCrit: 2, bonusDodge: 2'],
  [/bonusSpd: 35, bonusCrit: 4, bonusDodge: 5/, 'bonusSpd: 140, bonusCrit: 3, bonusDodge: 3'],
  [/bonusSpd: 50, bonusCrit: 6, bonusDodge: 7/, 'bonusSpd: 220, bonusCrit: 4, bonusDodge: 4'],
  [/bonusSpd: 75, bonusCrit: 8, bonusDodge: 9/, 'bonusSpd: 320, bonusCrit: 5, bonusDodge: 5'],
  [/bonusSpd: 100, bonusCrit: 12, bonusDodge: 12/, 'bonusSpd: 420, bonusCrit: 6, bonusDodge: 6'],
  [/bonusSpd: 150, bonusCrit: 10, bonusDodge: 14/, 'bonusSpd: 520, bonusCrit: 6, bonusDodge: 8'],
  [/bonusCastSpeed: 5, tipo: 'Robe'/, "bonusCastSpeed: 4, tipo: 'Robe'"],
  [/bonusCastSpeed: 7, tipo: 'Robe'/, "bonusCastSpeed: 6, tipo: 'Robe'"],
  [/bonusCastSpeed: 9, tipo: 'Robe'/, "bonusCastSpeed: 7, tipo: 'Robe'"],
  [/bonusCastSpeed: 12, tipo: 'Robe'/, "bonusCastSpeed: 9, tipo: 'Robe'"],
  [/bonusCastSpeed: 15, tipo: 'Robe'/, "bonusCastSpeed: 11, tipo: 'Robe'"],
  [/bonusCastSpeed: 18, preco: 0/, 'bonusCastSpeed: 12, preco: 0'],
  [/bonusCrit: 16, bonusSpd: 45/, 'bonusCrit: 8, bonusSpd: 90'],
  [/bonusCrit: 14, bonusSpd: 60/, 'bonusCrit: 7, bonusSpd: 120'],
  [/bonusCrit: 12, bonusSpd: 38/, 'bonusCrit: 6, bonusSpd: 70'],
  [/bonusCrit: 8, bonusSpd: 25/, 'bonusCrit: 5, bonusSpd: 50'],
  [/bonusCrit: 5, bonusSpd: 18/, 'bonusCrit: 3, bonusSpd: 35'],
  [/bonusCrit: 2, bonusSpd: 10/, 'bonusCrit: 2, bonusSpd: 20'],
  [/bonusSpd: 120([,}])/, 'bonusSpd: 180$1'],
  [/bonusCastSpeed: 12, bonusSpd: 70/, 'bonusCastSpeed: 8, bonusSpd: 70'],
  [/bonusSpd: 70, bonusCrit: 14, bonusDodge: 4/, 'bonusSpd: 28, bonusCrit: 4, bonusDodge: 2'],
  [/bonusCastSpeed: 6, bonusCrit: 4, pAtk: 220/, 'bonusCastSpeed: 4, bonusCrit: 2, pAtk: 220'],
  [/bonusCastSpeed: 7, bonusCrit: 3, bonusSpd: 20/, 'bonusCastSpeed: 4, bonusCrit: 2, bonusSpd: 12'],
  [/bonusCastSpeed: 5, bonusSpd: 12, pAtk: 55/, 'bonusCastSpeed: 3, bonusSpd: 8, pAtk: 55'],
  [/bonusCastSpeed: 4, bonusCrit: 3, pAtk: 40/, 'bonusCastSpeed: 2, bonusCrit: 2, pAtk: 40'],
  [/bonusCastSpeed: 8, mAtk: 90/, 'bonusCastSpeed: 5, mAtk: 90'],
  [/bonusCastSpeed: 5, mAtk: 65/, 'bonusCastSpeed: 3, mAtk: 65'],
  [/bonusCastSpeed: 4, desc: 'Tateossian Arcane ring/, "bonusCastSpeed: 2, desc: 'Tateossian Arcane ring"],
  [/bonusCastSpeed: 6, mAtk: 55/, 'bonusCastSpeed: 4, mAtk: 55'],
  [/atk: 430, bonusCrit: 14/, 'atk: 430, bonusCrit: 7'],
  [/atk: 620, bonusCrit: 12/, 'atk: 620, bonusCrit: 6'],
  [/atk: 250, bonusCrit: 10/, 'atk: 250, bonusCrit: 5'],
  [/atk: 150, bonusCrit: 6/, 'atk: 150, bonusCrit: 4'],
  [/atk: 70, bonusCrit: 4/, 'atk: 70, bonusCrit: 3'],
  [/atk: 24, bonusCrit: 3/, 'atk: 24, bonusCrit: 2'],
  [/atk: 370, bonusCrit: 8/, 'atk: 370, bonusCrit: 5'],
  [/atk: 210, bonusCrit: 5/, 'atk: 210, bonusCrit: 4'],
  [/atk: 600, bonusHp: 850, bonusCrit: 10/, 'atk: 600, bonusHp: 850, bonusCrit: 5'],
]);

patch('src/db/armor_jewel_expansion.ts', [
  // Precision S (Radiant light)
  [
    /bonusSpdNeck: 42, bonusSpdEar: 26, bonusCritNeck: 7, bonusCritRing: 7, bonusDodgeNeck: 3, bonusDodgeEar: 2, bonusDodgeRing: 2/,
    'bonusSpdNeck: 16, bonusSpdEar: 10, bonusCritNeck: 3, bonusCritRing: 3, bonusDodgeNeck: 2, bonusDodgeEar: 2, bonusDodgeRing: 1',
  ],
  [
    /bonusSpdNeck: 28, bonusSpdEar: 18, bonusCritNeck: 5, bonusCritRing: 5, bonusDodgeNeck: 2, bonusDodgeEar: 2, bonusDodgeRing: 1/,
    'bonusSpdNeck: 12, bonusSpdEar: 8, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeNeck: 2, bonusDodgeEar: 1, bonusDodgeRing: 1',
  ],
  [
    /bonusSpdNeck: 18, bonusSpdEar: 12, bonusCritNeck: 4, bonusCritRing: 4, bonusDodgeNeck: 2, bonusDodgeEar: 1/,
    'bonusSpdNeck: 10, bonusSpdEar: 6, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeNeck: 1, bonusDodgeEar: 1',
  ],
  [/bonusCrit: 8([,}])/, 'bonusCrit: 4$1'], // sentinel chain
]);

patch('src/game/blessing_catalog.ts', [
  [/critAdd: 6/, 'critAdd: 3'],
  [/dodgeAdd: 4/, 'dodgeAdd: 3'],
  [/castAdd: 8/, 'castAdd: 4'],
  [/atkSpeedMult: 0\.88/, 'atkSpeedMult: 0.92'],
]);

patch('src/game/gameplay_title_bonuses.ts', [
  [/critRate: 0\.9,/, 'critRate: 0.32,'],
  [/atkSpeedMs: 12,/, 'atkSpeedMs: 4,'],
  [/castSpeedPct: 3,/, 'castSpeedPct: 0.7,'],
]);

patch('src/ui/ui_enchant.ts', [
  [
    /\{ prop: 'augSpd',  txt: 'Speed',    val: Math\.floor\(Math\.random\(\) \* \(20 \* mult\)\) \+ \(10 \* mult\) \}/,
    "{ prop: 'augSpd',  txt: 'Speed',    val: Math.floor(Math.random() * (6 * mult)) + (4 * mult) }",
  ],
  [
    /\{ prop: 'augCrit', txt: 'Crit Rate',val: Math\.floor\(Math\.random\(\) \* \(2 \* mult\)\) \+ \(1 \* mult\) \}/,
    "{ prop: 'augCrit', txt: 'Crit Rate',val: Math.floor(Math.random() * (1 * mult)) + (1 * mult) }",
  ],
]);

console.log('done');
