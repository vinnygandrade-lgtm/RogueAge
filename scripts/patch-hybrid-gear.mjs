/**
 * One-shot: hybrid focus on armor + jewels (all stats, weighted by role).
 * Keeps Precision/Arcane peak primaries; adds ~25% off-role secondaries.
 */
import fs from 'fs';

function replaceOnce(file, re, rep, label) {
  let s = fs.readFileSync(file, 'utf8');
  if (!re.test(s)) {
    console.error('MISS', label, file);
    process.exit(1);
  }
  s = s.replace(re, rep);
  fs.writeFileSync(file, s);
  console.log('ok', label);
}

const armorBlock = `const catalogoArmadurasBase: ItemCatalogBase[] = [
    // NO-GRADE — shared secondaries; focus strength differs (~25% off-role vs primary line)
    { id: 'a1', nome: 'Wooden Set', grade: 'No-Grade', pDef: 30, bonusHp: 50, bonusSpd: 18, bonusCrit: 1, bonusDodge: 1, tipo: 'Heavy', preco: 800, img: catalogArmorIconPath('a1'), desc: 'Simple reinforced wood armor. HP first, with a light touch of tempo and crit.' },
    { id: 'a2', nome: 'Leather Set', grade: 'No-Grade', pDef: 22, bonusHp: 25, bonusSpd: 70, bonusCrit: 1, bonusDodge: 1, tipo: 'Light', preco: 800, img: catalogArmorIconPath('a2'), desc: 'Light leather for nimble adventurers. Crit, speed, and Evasion first, with modest HP.' },
    { id: 'a3', nome: 'Devotion Vestments', grade: 'No-Grade', pDef: 15, bonusHp: 20, bonusMp: 50, bonusMDef: 10, bonusCastSpeed: 3, bonusSpd: 15, tipo: 'Robe', preco: 800, img: catalogArmorIconPath('a3'), desc: 'Novice mage vestments. Casting and MP first, with a hint of swing tempo.' },

    // D-GRADE
    { id: 'a4', nome: 'Brigandine Set', grade: 'D', pDef: 80, bonusHp: 150, bonusSpd: 35, bonusCrit: 1, bonusDodge: 1, tipo: 'Heavy', preco: 25000, img: catalogArmorIconPath('a4'), desc: 'Sturdy frontier plates. Endurance first; light crit and speed so tanks keep progressing.' },
    { id: 'a5', nome: 'Manticore Set', grade: 'D', pDef: 60, bonusHp: 60, bonusSpd: 130, bonusCrit: 2, bonusDodge: 2, tipo: 'Light', preco: 25000, img: catalogArmorIconPath('a5'), desc: 'Treated Manticore leather. Mobility and precision first, with supporting HP.' },
    { id: 'a6', nome: 'Knowledge Vestments', grade: 'D', pDef: 40, bonusHp: 40, bonusMp: 150, bonusMDef: 25, bonusCastSpeed: 4, bonusSpd: 25, bonusCrit: 1, tipo: 'Robe', preco: 25000, img: catalogArmorIconPath('a6'), desc: 'Scholar vestments. Cast speed and MP first, with modest tempo and crit.' },

    // C-GRADE
    { id: 'a7', nome: 'Composite Set', grade: 'C', pDef: 150, bonusHp: 300, bonusSpd: 55, bonusCrit: 1, bonusDodge: 1, tipo: 'Heavy', preco: 120000, img: catalogArmorIconPath('a7'), desc: 'Campaign armor for veterans. Fortitude first; secondary tempo keeps the line moving.' },
    { id: 'a8', nome: 'Plated Leather', grade: 'C', pDef: 110, bonusHp: 120, bonusSpd: 220, bonusCrit: 3, bonusDodge: 3, tipo: 'Light', preco: 120000, img: catalogArmorIconPath('a8'), desc: 'Plated leather for duelists. Crit, speed, and Evasion first, with solid HP.' },
    { id: 'a9', nome: 'Karmian Vestments', grade: 'C', pDef: 75, bonusHp: 80, bonusMp: 300, bonusMDef: 45, bonusCastSpeed: 6, bonusSpd: 40, bonusCrit: 1, bonusDodge: 1, tipo: 'Robe', preco: 120000, img: catalogArmorIconPath('a9'), desc: 'Field mage vestments. Casting first; light crit, Evasion, and swing tempo.' },

    // B-GRADE
    { id: 'a10', nome: 'Doom Plate', grade: 'B', pDef: 240, bonusHp: 500, bonusSpd: 85, bonusCrit: 1, bonusDodge: 1, tipo: 'Heavy', preco: 450000, img: catalogArmorIconPath('a10'), desc: 'Elite dark steel. Bastion HP/Def first, with measured secondary offense tempo.' },
    { id: 'a11', nome: 'Doom Leather', grade: 'B', pDef: 180, bonusHp: 200, bonusSpd: 340, bonusCrit: 4, bonusDodge: 4, tipo: 'Light', preco: 450000, img: catalogArmorIconPath('a11'), desc: 'Elite hunter gear. Lethality and tempo first, backed by real HP.' },
    { id: 'a12', nome: 'Avadon Vestments', grade: 'B', pDef: 125, bonusHp: 120, bonusMp: 500, bonusMDef: 70, bonusCastSpeed: 7, bonusSpd: 55, bonusCrit: 1, bonusDodge: 1, tipo: 'Robe', preco: 450000, img: catalogArmorIconPath('a12'), desc: 'Ritual vestments. Cast and M.Def first; supporting crit, Evasion, and tempo.' },

    // A-GRADE
    { id: 'a13', nome: 'Dark Crystal', grade: 'A', pDef: 350, bonusHp: 800, bonusSpd: 125, bonusCrit: 1, bonusDodge: 1, tipo: 'Heavy', preco: 1500000, img: catalogArmorIconPath('a13'), desc: 'Tempered black crystals. Frontline defense first, with disciplined secondary tempo.' },
    { id: 'a14', nome: 'Majestic Leather', grade: 'A', pDef: 260, bonusHp: 320, bonusSpd: 500, bonusCrit: 5, bonusDodge: 5, tipo: 'Light', preco: 1500000, img: catalogArmorIconPath('a14'), desc: 'Majestic elite set. Peak precision tempo, with strong supporting HP.' },
    { id: 'a15', nome: 'Tallum Vestments', grade: 'A', pDef: 180, bonusHp: 200, bonusMp: 800, bonusMDef: 110, bonusCastSpeed: 9, bonusSpd: 80, bonusCrit: 1, bonusDodge: 1, tipo: 'Robe', preco: 1500000, img: catalogArmorIconPath('a15'), desc: 'War arcanist vestments. Casting mastery first; light physical secondaries.' },

    // S-GRADE
    { id: 'a16', nome: 'Imperial Crusader', grade: 'S', pDef: 500, bonusHp: 1500, bonusSpd: 160, bonusCrit: 2, bonusDodge: 2, tipo: 'Heavy', preco: 5000000, img: catalogArmorIconPath('a16'), desc: 'Legendary imperial breastplate. Peak resilience, with secondary crit, Evasion, and tempo (~25% of Light).' },
    { id: 'a17', nome: 'Draconic Leather', grade: 'S', pDef: 380, bonusHp: 500, bonusSpd: 640, bonusCrit: 6, bonusDodge: 6, tipo: 'Light', preco: 5000000, img: catalogArmorIconPath('a17'), desc: 'Rare draconic leather. Peak crit, speed, and Evasion, with meaningful HP.' },
    { id: 'a18', nome: 'Major Arcana Vestments', grade: 'S', pDef: 260, bonusHp: 300, bonusMp: 1500, bonusMDef: 180, bonusCastSpeed: 11, bonusSpd: 100, bonusCrit: 2, bonusDodge: 1, tipo: 'Robe', preco: 5000000, img: catalogArmorIconPath('a18'), desc: 'Supreme mage vestments. Peak cast/MP first; supporting crit, Evasion, and tempo.' },
     
    // --- ELITE S-GRADE (CRAFT EXCLUSIVO - SET VESPER) ---
    { 
        id: 'arm_s_vesper_heavy', nome: 'Vesper Noble Heavy', grade: 'S', tipo: 'Heavy', 
        pDef: 650, bonusHp: 2500, pAtk: 150, bonusMDef: 120, bonusSpd: 190, bonusCrit: 2, bonusDodge: 2, preco: 0, moeda: 'Adena',
        desc: '[Elite Craft] Supreme heavy armor. Colossal HP first; secondary crit, Evasion, and tempo (~25% of Light).', 
        img: catalogArmorIconPath('arm_s_vesper_heavy') 
    },
    { 
        id: 'arm_s_vesper_light', nome: 'Vesper Noble Light', grade: 'S', tipo: 'Light', 
        pDef: 480, bonusSpd: 760, bonusCrit: 6, bonusDodge: 8, pAtk: 100, bonusHp: 1000, preco: 0, moeda: 'Adena',
        desc: '[Elite Craft] Ancient dragon leather. Peak crit, speed, and Evasion, with strong supporting HP and P. Atk.', 
        img: catalogArmorIconPath('arm_s_vesper_light') 
    },
    { 
        id: 'arm_s_vesper_robe', nome: 'Vesper Noble Robe', grade: 'S', tipo: 'Robe', 
        pDef: 300, bonusHp: 400, bonusMp: 3000, bonusMDef: 350, mAtk: 250, bonusSpd: 100, bonusCastSpeed: 12, bonusCrit: 2, bonusDodge: 2, preco: 0, moeda: 'Adena',
        desc: '[Elite Craft] Robe of chaotic magic. Peak cast/MP/M.Atk first; supporting crit, Evasion, and tempo.', 
        img: catalogArmorIconPath('arm_s_vesper_robe') 
    }
];`;

replaceOnce(
  'src/db/db_items.ts',
  /const catalogoArmadurasBase: ItemCatalogBase\[\] = \[[\s\S]*?\n\];/,
  armorBlock,
  'armor base+vesper',
);

// Arcane jewels in db_items — add ~25% physical secondaries; do not raise cast peaks.
const arcanePatches = [
  [
    "{ id: 'j_ng_neck', nome: 'Wooden Necklace', tipoItem: 'neck', grade: 'No-Grade', preco: 300, mDef: 12, bonusHp: 8, bonusMp: 22, bonusCastSpeed: 1, desc: 'Arcane beginner necklace. Favors MP and casting focus.', img: catalogJewelIconPath('j_ng_neck') }",
    "{ id: 'j_ng_neck', nome: 'Wooden Necklace', tipoItem: 'neck', grade: 'No-Grade', preco: 300, mDef: 12, bonusHp: 8, bonusMp: 22, bonusCastSpeed: 1, bonusSpd: 2, desc: 'Arcane beginner necklace. MP and cast first, with a hint of swing tempo.', img: catalogJewelIconPath('j_ng_neck') }",
  ],
  [
    "{ id: 'j_ng_ear', nome: 'Wooden Earring', tipoItem: 'ear', grade: 'No-Grade', preco: 200, mDef: 9, bonusHp: 5, bonusMp: 14, desc: 'Simple earrings that steady mana flow.', img: catalogJewelIconPath('j_ng_ear') }",
    "{ id: 'j_ng_ear', nome: 'Wooden Earring', tipoItem: 'ear', grade: 'No-Grade', preco: 200, mDef: 9, bonusHp: 5, bonusMp: 14, bonusSpd: 1, desc: 'Simple earrings that steady mana flow, with a touch of tempo.', img: catalogJewelIconPath('j_ng_ear') }",
  ],
  [
    "{ id: 'j_d_neck', nome: 'Elven Necklace', tipoItem: 'neck', grade: 'D', preco: 2000, mDef: 28, bonusHp: 20, bonusMp: 55, bonusCastSpeed: 2, mAtk: 8, desc: 'Elf-crafted Arcane necklace. MP, M.Atk, and casting speed.', img: catalogJewelIconPath('j_d_neck') }",
    "{ id: 'j_d_neck', nome: 'Elven Necklace', tipoItem: 'neck', grade: 'D', preco: 2000, mDef: 28, bonusHp: 20, bonusMp: 55, bonusCastSpeed: 2, mAtk: 8, bonusSpd: 4, bonusCrit: 1, desc: 'Elf-crafted Arcane necklace. Cast/MP first; light crit and tempo.', img: catalogJewelIconPath('j_d_neck') }",
  ],
  [
    "{ id: 'j_d_ear', nome: 'Elven Earring', tipoItem: 'ear', grade: 'D', preco: 1500, mDef: 21, bonusMp: 40, bonusCastSpeed: 1, mAtk: 5, desc: 'Elven earrings that sharpen spell focus.', img: catalogJewelIconPath('j_d_ear') }",
    "{ id: 'j_d_ear', nome: 'Elven Earring', tipoItem: 'ear', grade: 'D', preco: 1500, mDef: 21, bonusMp: 40, bonusCastSpeed: 1, mAtk: 5, bonusSpd: 2, desc: 'Elven earrings that sharpen spell focus, with a hint of tempo.', img: catalogJewelIconPath('j_d_ear') }",
  ],
  [
    "{ id: 'j_c_neck', nome: 'Aquastone Necklace', tipoItem: 'neck', grade: 'C', preco: 6000, mDef: 50, bonusHp: 40, bonusMp: 110, bonusCastSpeed: 3, mAtk: 18, desc: 'Aquatic Arcane stone. Strong MP and casting tempo.', img: catalogJewelIconPath('j_c_neck') }",
    "{ id: 'j_c_neck', nome: 'Aquastone Necklace', tipoItem: 'neck', grade: 'C', preco: 6000, mDef: 50, bonusHp: 40, bonusMp: 110, bonusCastSpeed: 3, mAtk: 18, bonusSpd: 5, bonusCrit: 1, desc: 'Aquatic Arcane stone. Cast/MP first; light crit and tempo.', img: catalogJewelIconPath('j_c_neck') }",
  ],
  [
    "{ id: 'j_c_ear', nome: 'Aquastone Earring', tipoItem: 'ear', grade: 'C', preco: 4500, mDef: 37, bonusMp: 75, bonusCastSpeed: 2, mAtk: 12, desc: 'Aquastone earrings for channeling spells faster.', img: catalogJewelIconPath('j_c_ear') }",
    "{ id: 'j_c_ear', nome: 'Aquastone Earring', tipoItem: 'ear', grade: 'C', preco: 4500, mDef: 37, bonusMp: 75, bonusCastSpeed: 2, mAtk: 12, bonusSpd: 3, desc: 'Aquastone earrings for faster casting, with a touch of swing tempo.', img: catalogJewelIconPath('j_c_ear') }",
  ],
  [
    "{ id: 'j_c_ring', nome: 'Aquastone Ring', tipoItem: 'ring', grade: 'C', preco: 3000, mDef: 25, bonusMp: 55, mAtk: 14, bonusCastSpeed: 1, desc: 'Magic-infused Arcane ring.', img: catalogJewelIconPath('j_c_ring') }",
    "{ id: 'j_c_ring', nome: 'Aquastone Ring', tipoItem: 'ring', grade: 'C', preco: 3000, mDef: 25, bonusMp: 55, mAtk: 14, bonusCastSpeed: 1, bonusCrit: 1, desc: 'Magic-infused Arcane ring with a light crit edge.', img: catalogJewelIconPath('j_c_ring') }",
  ],
  [
    "{ id: 'j_b_neck', nome: 'Black Ore Necklace', tipoItem: 'neck', grade: 'B', preco: 18000, mDef: 70, bonusHp: 60, bonusMp: 180, bonusCastSpeed: 4, mAtk: 35, desc: 'Black-ore Arcane necklace. Magical power and cast speed.', img: catalogJewelIconPath('j_b_neck') }",
    "{ id: 'j_b_neck', nome: 'Black Ore Necklace', tipoItem: 'neck', grade: 'B', preco: 18000, mDef: 70, bonusHp: 60, bonusMp: 180, bonusCastSpeed: 4, mAtk: 35, bonusSpd: 7, bonusCrit: 1, bonusDodge: 1, desc: 'Black-ore Arcane necklace. Cast/M.Atk first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_b_neck') }",
  ],
  [
    "{ id: 'j_b_ear', nome: 'Black Ore Earring', tipoItem: 'ear', grade: 'B', preco: 13500, mDef: 52, bonusMp: 120, bonusCastSpeed: 3, mAtk: 22, desc: 'Black-ore earrings. M.Atk and casting focus.', img: catalogJewelIconPath('j_b_ear') }",
    "{ id: 'j_b_ear', nome: 'Black Ore Earring', tipoItem: 'ear', grade: 'B', preco: 13500, mDef: 52, bonusMp: 120, bonusCastSpeed: 3, mAtk: 22, bonusSpd: 4, desc: 'Black-ore earrings. Cast focus first, with supporting tempo.', img: catalogJewelIconPath('j_b_ear') }",
  ],
  [
    "{ id: 'j_b_ring', nome: 'Black Ore Ring', tipoItem: 'ring', grade: 'B', preco: 9000, mDef: 35, bonusMp: 90, mAtk: 26, bonusCastSpeed: 2, desc: 'Arcane ring that deepens spell damage.', img: catalogJewelIconPath('j_b_ring') }",
    "{ id: 'j_b_ring', nome: 'Black Ore Ring', tipoItem: 'ring', grade: 'B', preco: 9000, mDef: 35, bonusMp: 90, mAtk: 26, bonusCastSpeed: 2, bonusCrit: 1, desc: 'Arcane ring that deepens spell damage, with a light crit edge.', img: catalogJewelIconPath('j_b_ring') }",
  ],
  [
    "{ id: 'j_a_neck', nome: 'Majestic Necklace', tipoItem: 'neck', grade: 'A', preco: 60000, mDef: 100, bonusHp: 90, bonusMp: 280, bonusCastSpeed: 4, mAtk: 55, desc: 'Majestic Arcane necklace. Formidable MP, M.Atk, and cast speed.', img: catalogJewelIconPath('j_a_neck') }",
    "{ id: 'j_a_neck', nome: 'Majestic Necklace', tipoItem: 'neck', grade: 'A', preco: 60000, mDef: 100, bonusHp: 90, bonusMp: 280, bonusCastSpeed: 4, mAtk: 55, bonusSpd: 9, bonusCrit: 1, bonusDodge: 1, desc: 'Majestic Arcane necklace. Cast/MP first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_a_neck') }",
  ],
  [
    "{ id: 'j_a_ear', nome: 'Majestic Earring', tipoItem: 'ear', grade: 'A', preco: 45000, mDef: 75, bonusMp: 200, bonusCastSpeed: 4, mAtk: 40, desc: 'Speeds the mind — Arcane cast tempo and M.Atk.', img: catalogJewelIconPath('j_a_ear') }",
    "{ id: 'j_a_ear', nome: 'Majestic Earring', tipoItem: 'ear', grade: 'A', preco: 45000, mDef: 75, bonusMp: 200, bonusCastSpeed: 4, mAtk: 40, bonusSpd: 5, desc: 'Speeds the mind — Arcane cast first, with supporting swing tempo.', img: catalogJewelIconPath('j_a_ear') }",
  ],
  [
    "{ id: 'j_a_ring', nome: 'Majestic Ring', tipoItem: 'ring', grade: 'A', preco: 30000, mDef: 50, bonusMp: 140, mAtk: 45, bonusCastSpeed: 3, desc: 'Solid Arcane band for battle mages.', img: catalogJewelIconPath('j_a_ring') }",
    "{ id: 'j_a_ring', nome: 'Majestic Ring', tipoItem: 'ring', grade: 'A', preco: 30000, mDef: 50, bonusMp: 140, mAtk: 45, bonusCastSpeed: 3, bonusCrit: 1, desc: 'Solid Arcane band for battle mages, with a light crit edge.', img: catalogJewelIconPath('j_a_ring') }",
  ],
  [
    "{ id: 'j_s_neck', nome: 'Tateossian Necklace', tipoItem: 'neck', grade: 'S', preco: 250000, mDef: 140, bonusHp: 120, bonusMp: 420, bonusCastSpeed: 5, mAtk: 90, desc: 'Lordly Arcane necklace. Peak MP, M.Atk, and casting speed.', img: catalogJewelIconPath('j_s_neck') }",
    "{ id: 'j_s_neck', nome: 'Tateossian Necklace', tipoItem: 'neck', grade: 'S', preco: 250000, mDef: 140, bonusHp: 120, bonusMp: 420, bonusCastSpeed: 5, mAtk: 90, bonusSpd: 11, bonusCrit: 1, bonusDodge: 1, desc: 'Lordly Arcane necklace. Peak cast/MP first; secondary crit, Evasion, and tempo (~25% of Precision).', img: catalogJewelIconPath('j_s_neck') }",
  ],
  [
    "{ id: 'j_s_ear', nome: 'Tateossian Earring', tipoItem: 'ear', grade: 'S', preco: 180000, mDef: 105, bonusMp: 300, bonusCastSpeed: 3, mAtk: 65, desc: 'Tateossian Arcane earrings.', img: catalogJewelIconPath('j_s_ear') }",
    "{ id: 'j_s_ear', nome: 'Tateossian Earring', tipoItem: 'ear', grade: 'S', preco: 180000, mDef: 105, bonusMp: 300, bonusCastSpeed: 3, mAtk: 65, bonusSpd: 7, desc: 'Tateossian Arcane earrings — cast first, with supporting tempo.', img: catalogJewelIconPath('j_s_ear') }",
  ],
  [
    "{ id: 'j_s_ring', nome: 'Tateossian Ring', tipoItem: 'ring', grade: 'S', preco: 125000, mDef: 70, bonusMp: 220, mAtk: 70, bonusCastSpeed: 2, desc: 'Tateossian Arcane ring for endgame casters.', img: catalogJewelIconPath('j_s_ring') }",
    "{ id: 'j_s_ring', nome: 'Tateossian Ring', tipoItem: 'ring', grade: 'S', preco: 125000, mDef: 70, bonusMp: 220, mAtk: 70, bonusCastSpeed: 2, bonusCrit: 1, desc: 'Tateossian Arcane ring — cast/M.Atk first, with a light crit edge.', img: catalogJewelIconPath('j_s_ring') }",
  ],
  [
    "{ id: 'j_epic_antharas', nome: 'Earring of Antharas', tipoItem: 'ear', grade: 'S', preco: 0, mDef: 180, bonusHp: 1100, bonusMp: 200, pAtk: 180, mAtk: 80, desc: 'Earth Dragon earring. Colossal Vitality and resilience.', img: catalogJewelIconPath('j_epic_antharas') }",
    "{ id: 'j_epic_antharas', nome: 'Earring of Antharas', tipoItem: 'ear', grade: 'S', preco: 0, mDef: 180, bonusHp: 1100, bonusMp: 200, pAtk: 180, mAtk: 80, bonusSpd: 12, bonusCrit: 1, bonusDodge: 1, desc: 'Earth Dragon earring. Peak Vitality first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_epic_antharas') }",
  ],
  [
    "{ id: 'j_epic_baium', nome: 'Ring of Baium', tipoItem: 'ring', grade: 'S', preco: 0, mDef: 100, bonusSpd: 50, bonusCrit: 3, bonusDodge: 2, pAtk: 220, mAtk: 100, desc: 'Emperor’s Precision ring. Extreme crit, speed, and a touch of Evasion.', img: catalogJewelIconPath('j_epic_baium') }",
    "{ id: 'j_epic_baium', nome: 'Ring of Baium', tipoItem: 'ring', grade: 'S', preco: 0, mDef: 100, bonusHp: 80, bonusSpd: 50, bonusCrit: 3, bonusDodge: 2, pAtk: 220, mAtk: 100, desc: 'Emperor’s Precision ring. Peak crit/speed/Evasion, with supporting HP.', img: catalogJewelIconPath('j_epic_baium') }",
  ],
];

{
  let s = fs.readFileSync('src/db/db_items.ts', 'utf8');
  for (const [from, to] of arcanePatches) {
    if (!s.includes(from)) {
      console.error('MISS jewel', from.slice(0, 80));
      process.exit(1);
    }
    s = s.replace(from, to);
  }
  fs.writeFileSync('src/db/db_items.ts', s);
  console.log('ok arcane+epic jewels');
}

// Expansion jewel sets + expansion armors
let exp = fs.readFileSync('src/db/armor_jewel_expansion.ts', 'utf8');

const lightSets = `/** Precision line — crit / AtkSpeed / Evasion first; supporting HP/MP/cast. */
const JEWEL_LIGHT_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'light', prefix: 'Willow', precoNeck: 260, precoEar: 170, precoRing: 130, mDefNeck: 8, mDefEar: 6, mDefRing: 4, bonusHpNeck: 12, bonusHpEar: 8, bonusHpRing: 5, bonusMpNeck: 4, bonusMpEar: 3, bonusMpRing: 2, bonusSpdNeck: 8, bonusSpdEar: 5, bonusCritRing: 1, bonusCastNeck: 1 },
    { grade: 'D', gradeKey: 'd', weight: 'light', prefix: 'Silverleaf', precoNeck: 1800, precoEar: 1350, precoRing: 900, mDefNeck: 18, mDefEar: 14, mDefRing: 9, bonusHpNeck: 28, bonusHpEar: 18, bonusHpRing: 12, bonusMpNeck: 10, bonusMpEar: 8, bonusMpRing: 5, bonusSpdNeck: 14, bonusSpdEar: 9, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeEar: 1, bonusCastNeck: 1 },
    { grade: 'C', gradeKey: 'c', weight: 'light', prefix: 'Moonstone', precoNeck: 5400, precoEar: 4050, precoRing: 2700, mDefNeck: 32, mDefEar: 24, mDefRing: 16, bonusHpNeck: 50, bonusHpEar: 34, bonusHpRing: 20, bonusMpNeck: 18, bonusMpEar: 12, bonusMpRing: 8, bonusSpdNeck: 20, bonusSpdEar: 12, bonusCritNeck: 3, bonusCritRing: 3, bonusDodgeNeck: 1, bonusDodgeEar: 1, pAtkEar: 6, bonusCastNeck: 1 },
    { grade: 'B', gradeKey: 'b', weight: 'light', prefix: 'Nightwind', precoNeck: 16200, precoEar: 12150, precoRing: 8100, mDefNeck: 48, mDefEar: 36, mDefRing: 24, bonusHpNeck: 75, bonusHpEar: 50, bonusHpRing: 30, bonusMpNeck: 28, bonusMpEar: 18, bonusMpRing: 12, bonusSpdNeck: 28, bonusSpdEar: 16, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeNeck: 1, bonusDodgeEar: 1, pAtkNeck: 12, pAtkEar: 8, bonusCastNeck: 1 },
    { grade: 'A', gradeKey: 'a', weight: 'light', prefix: 'Starlight', precoNeck: 54000, precoEar: 40500, precoRing: 27000, mDefNeck: 70, mDefEar: 52, mDefRing: 35, bonusHpNeck: 110, bonusHpEar: 72, bonusHpRing: 42, bonusMpNeck: 40, bonusMpEar: 28, bonusMpRing: 18, bonusSpdNeck: 36, bonusSpdEar: 22, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeNeck: 2, bonusDodgeEar: 1, bonusDodgeRing: 1, pAtkNeck: 28, pAtkEar: 18, bonusCastNeck: 1 },
    { grade: 'S', gradeKey: 's', weight: 'light', prefix: 'Radiant', precoNeck: 225000, precoEar: 162000, precoRing: 112500, mDefNeck: 95, mDefEar: 72, mDefRing: 48, bonusHpNeck: 160, bonusHpEar: 105, bonusHpRing: 64, bonusMpNeck: 60, bonusMpEar: 40, bonusMpRing: 28, bonusSpdNeck: 45, bonusSpdEar: 28, bonusCritNeck: 3, bonusCritRing: 3, bonusDodgeNeck: 2, bonusDodgeEar: 2, bonusDodgeRing: 1, pAtkNeck: 50, pAtkEar: 32, pAtkRing: 20, bonusCastNeck: 1 },
];`;

const heavySets = `/** Vitality line — HP / M.Def / P.Atk first; ~25% of Precision crit/spd/dodge + tiny cast. */
const JEWEL_HEAVY_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'heavy', prefix: 'Ironheart', precoNeck: 340, precoEar: 230, precoRing: 170, mDefNeck: 16, mDefEar: 12, mDefRing: 8, bonusHpNeck: 30, bonusHpEar: 20, bonusHpRing: 12, bonusMpNeck: 4, bonusMpEar: 3, bonusMpRing: 2, bonusSpdNeck: 2, bonusSpdEar: 1, bonusCritRing: 1 },
    { grade: 'D', gradeKey: 'd', weight: 'heavy', prefix: 'Granite', precoNeck: 2200, precoEar: 1650, precoRing: 1100, mDefNeck: 36, mDefEar: 27, mDefRing: 18, bonusHpNeck: 70, bonusHpEar: 45, bonusHpRing: 28, bonusMpNeck: 12, bonusMpEar: 8, bonusMpRing: 5, pAtkRing: 4, bonusSpdNeck: 4, bonusSpdEar: 2, bonusCritNeck: 1, bonusDodgeEar: 1 },
    { grade: 'C', gradeKey: 'c', weight: 'heavy', prefix: 'Stoneguard', precoNeck: 6600, precoEar: 4950, precoRing: 3300, mDefNeck: 64, mDefEar: 48, mDefRing: 32, bonusHpNeck: 140, bonusHpEar: 95, bonusHpRing: 55, bonusMpNeck: 24, bonusMpEar: 16, bonusMpRing: 10, pAtkNeck: 10, pAtkEar: 6, bonusSpdNeck: 5, bonusSpdEar: 3, bonusCritNeck: 1, bonusCritRing: 1, bonusDodgeNeck: 1 },
    { grade: 'B', gradeKey: 'b', weight: 'heavy', prefix: 'Obsidian', precoNeck: 19800, precoEar: 14850, precoRing: 9900, mDefNeck: 90, mDefEar: 68, mDefRing: 45, bonusHpNeck: 230, bonusHpEar: 155, bonusHpRing: 90, bonusMpNeck: 40, bonusMpEar: 28, bonusMpRing: 16, pAtkNeck: 26, pAtkEar: 16, pAtkRing: 10, bonusSpdNeck: 7, bonusSpdEar: 4, bonusCritNeck: 1, bonusCritRing: 1, bonusDodgeNeck: 1, bonusCastNeck: 1 },
    { grade: 'A', gradeKey: 'a', weight: 'heavy', prefix: 'Titan', precoNeck: 66000, precoEar: 49500, precoRing: 33000, mDefNeck: 128, mDefEar: 96, mDefRing: 64, bonusHpNeck: 380, bonusHpEar: 260, bonusHpRing: 150, bonusMpNeck: 60, bonusMpEar: 42, bonusMpRing: 24, pAtkNeck: 48, pAtkEar: 32, pAtkRing: 20, bonusSpdNeck: 9, bonusSpdEar: 5, bonusCritNeck: 1, bonusCritRing: 1, bonusDodgeNeck: 1, bonusDodgeEar: 1, bonusCastNeck: 1 },
    { grade: 'S', gradeKey: 's', weight: 'heavy', prefix: 'Dominion', precoNeck: 275000, precoEar: 198000, precoRing: 137500, mDefNeck: 175, mDefEar: 132, mDefRing: 88, bonusHpNeck: 560, bonusHpEar: 380, bonusHpRing: 220, bonusMpNeck: 90, bonusMpEar: 60, bonusMpRing: 36, pAtkNeck: 90, pAtkEar: 60, pAtkRing: 40, bonusSpdNeck: 11, bonusSpdEar: 7, bonusSpdRing: 4, bonusCritNeck: 1, bonusCritRing: 1, bonusDodgeNeck: 1, bonusDodgeEar: 1, bonusCastNeck: 1 },
];`;

exp = exp.replace(/\/\*\* Precision line[\s\S]*?\];\n\n\/\*\* Vitality line[\s\S]*?\];/, `${lightSets}\n\n${heavySets}`);

exp = exp.replace(
  /set\.weight === 'light'\s*\n\s*\? 'Precision jewelry: crit, attack speed, and light Evasion for agile fighters\.'\s*\n\s*: 'Vitality jewelry: HP, magical defense, and physical presence for frontliners\.';/,
  `set.weight === 'light'
                ? 'Precision jewelry: crit, attack speed, and Evasion first — with supporting HP and a touch of cast.'
                : 'Vitality jewelry: HP, M.Def, and P.Atk first — with secondary crit, tempo, and Evasion (~25% of Precision).';`,
);

// Expansion armors — give each weight a full secondary palette (weighted)
const newArmor = `const NEW_ARMOR_DEFS: NewArmorDef[] = [
    // NO-GRADE
    { id: 'arm_ng_f_chain', nome: 'Bronze Chain Set', grade: 'No-Grade', preco: 800, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_bronze_chain_ng', desc: 'Bronze rings and leather backing. Balanced HP and tempo between plate and leather.', pDef: 26, bonusHp: 35, bonusSpd: 35, bonusCrit: 1 },
    { id: 'arm_ng_m_woven', nome: 'Spellweave Set', grade: 'No-Grade', preco: 800, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_spellweave_ng', desc: 'Light enchanted weave. MP and tempo first for novice casters.', pDef: 11, bonusHp: 15, bonusMp: 65, bonusMDef: 12, bonusSpd: 20, bonusCrit: 1 },
    { id: 'arm_ng_m_warden', nome: 'Runic Warden Set', grade: 'No-Grade', preco: 800, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_runic_warden_ng', desc: 'Runed bronze over spellcloth. Arcane bulwark with light tempo.', pDef: 22, bonusHp: 30, bonusMp: 35, bonusMDef: 18, bonusSpd: 10 },

    // D
    { id: 'arm_d_f_chain', nome: 'Half-Plate Set', grade: 'D', preco: 25000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_half_plate_d', desc: 'Hybrid mail and plate. Mid HP with supporting crit and tempo.', pDef: 70, bonusHp: 110, bonusSpd: 70, bonusCrit: 1 },
    { id: 'arm_d_m_woven', nome: 'Arcane Loom Set', grade: 'D', preco: 25000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_arcane_loom_d', desc: 'Woven sigils and silk. MP first, with tempo and a light crit.', pDef: 32, bonusHp: 30, bonusMp: 175, bonusMDef: 28, bonusSpd: 30, bonusCrit: 1 },
    { id: 'arm_d_m_warden', nome: 'Sanctum Guard Set', grade: 'D', preco: 25000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_sanctum_guard_d', desc: 'Ward plates over ritual cloth. M.Def/HP first, light tempo.', pDef: 52, bonusHp: 80, bonusMp: 120, bonusMDef: 32, bonusSpd: 18 },

    // C
    { id: 'arm_c_f_chain', nome: 'Campaign Chain Set', grade: 'C', preco: 120000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_campaign_chain_c', desc: 'Layered chain for skirmish captains. Mid path HP, crit, and tempo.', pDef: 130, bonusHp: 240, bonusSpd: 110, bonusCrit: 2 },
    { id: 'arm_c_m_woven', nome: 'Mystic Thread Set', grade: 'C', preco: 120000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_mystic_thread_c', desc: 'Threaded crystals in light vestments. MP first; tempo and light crit.', pDef: 58, bonusHp: 55, bonusMp: 340, bonusMDef: 50, bonusSpd: 45, bonusCrit: 1 },
    { id: 'arm_c_m_warden', nome: 'Aegis Rite Set', grade: 'C', preco: 120000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_aegis_rite_c', desc: 'Runic ward harness. Arcane plating first; supporting tempo.', pDef: 95, bonusHp: 180, bonusMp: 260, bonusMDef: 58, bonusSpd: 28 },

    // B
    { id: 'arm_b_f_chain', nome: 'Doom Chain Set', grade: 'B', preco: 450000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_doom_chain_b', desc: 'Dark linked steel between plate and leather. Balanced HP, crit, and tempo.', pDef: 210, bonusHp: 420, bonusSpd: 170, bonusCrit: 2 },
    { id: 'arm_b_m_woven', nome: 'Shadow Loom Set', grade: 'B', preco: 450000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_shadow_loom_b', desc: 'Shadow-silk vestments. High MP with agile tempo and light crit.', pDef: 95, bonusHp: 90, bonusMp: 560, bonusMDef: 78, bonusSpd: 60, bonusCrit: 1 },
    { id: 'arm_b_m_warden', nome: 'Obsidian Ward Set', grade: 'B', preco: 450000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_obsidian_ward_b', desc: 'Obsidian ward plates. Elite M.Def/HP first; measured tempo.', pDef: 155, bonusHp: 320, bonusMp: 420, bonusMDef: 88, bonusSpd: 40 },

    // A
    { id: 'arm_a_f_chain', nome: 'Crystal Chain Set', grade: 'A', preco: 1500000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_crystal_chain_a', desc: 'Crystal-linked mail. Mid path between crystal plate and majestic leather.', pDef: 305, bonusHp: 680, bonusSpd: 250, bonusCrit: 3 },
    { id: 'arm_a_m_woven', nome: 'Starweave Set', grade: 'A', preco: 1500000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_starweave_a', desc: 'Starlit weave. Peak MP bias with tempo and supporting crit.', pDef: 140, bonusHp: 140, bonusMp: 920, bonusMDef: 118, bonusSpd: 85, bonusCrit: 1 },
    { id: 'arm_a_m_warden', nome: 'Titan Rite Set', grade: 'A', preco: 1500000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_titan_rite_a', desc: 'Titan ward harness. Frontline caster bulwark with secondary tempo.', pDef: 220, bonusHp: 520, bonusMp: 680, bonusMDef: 128, bonusSpd: 55 },

    // S
    { id: 'arm_s_f_chain', nome: 'Sentinel Chain Set', grade: 'S', preco: 5000000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_sentinel_chain_s', desc: 'Legendary sentinel mail. Mid path HP with strong secondary crit and tempo.', pDef: 440, bonusHp: 1200, bonusSpd: 320, bonusCrit: 3 },
    { id: 'arm_s_m_woven', nome: 'Eclipse Weave Set', grade: 'S', preco: 5000000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_eclipse_weave_s', desc: 'Eclipse-thread vestments. Extreme MP with tempo and light crit.', pDef: 210, bonusHp: 220, bonusMp: 1750, bonusMDef: 165, bonusSpd: 110, bonusCrit: 2 },
    { id: 'arm_s_m_warden', nome: 'Void Warden Set', grade: 'S', preco: 5000000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_void_warden_s', desc: 'Void ward plates. Maximum arcane bulwark with secondary tempo.', pDef: 340, bonusHp: 900, bonusMp: 1250, bonusMDef: 210, bonusSpd: 70 },
];`;

if (!/const NEW_ARMOR_DEFS: NewArmorDef\[\] = \[[\s\S]*?\];/.test(exp)) {
  console.error('MISS NEW_ARMOR_DEFS');
  process.exit(1);
}
exp = exp.replace(/const NEW_ARMOR_DEFS: NewArmorDef\[\] = \[[\s\S]*?\];/, newArmor);

// Extend NewArmorDef type usage — bonusDodge not in type; skip dodge on expansion for simplicity
// Add bonusDodge to type if we need — currently NewArmorDef has bonusCrit/bonusSpd only

fs.writeFileSync('src/db/armor_jewel_expansion.ts', exp);
console.log('ok expansion armors+jewels');
console.log('done');
