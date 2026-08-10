/**
 * Migrado: js/db_items.js
 */

import type {
  CraftRecipeCatalog,
  EnchantScrollCatalogEntry,
  ItemCatalogBase,
  ShopCatalogItem,
} from '../types/game';
import {
  applyArmorCatalogMeta,
  armorMatchesClass,
  buildExpansionArmors,
  buildExpansionJewels,
  EXPANSION_ARMOR_ICON_SLUGS,
  EXPANSION_ARMOR_OWN_ICON_READY,
  formatArmorLineLabel,
  MAGE_ARMOR_AWAITING_SHOP_ICON,
  resolveExpansionArmorIconSlug,
  tagMediumJewelSets,
} from './armor_jewel_expansion';
import {
  applyMageWeaponMeta,
  buildExpansionMageWeapons,
  isMageExclusiveWeapon,
  weaponMatchesClass,
} from './weapon_mage_expansion';

// ==========================================
// BANCO DE DADOS - ITENS, LOJAS E SCROLLS
// ==========================================

// --- MATERIAIS DE DROP E CRAFT (Para o inventário reconhecer) ---
// --- MATERIAIS DE DROP E CRAFT (Para o inventário reconhecer) ---
const catalogoMateriais: ItemCatalogBase[] = [
    { id: 'Animal Skin', nome: 'Animal Skin', tipo: 'material', desc: 'Monster hide. Can be refined into Leather.', img: 'assets/itens/animal_skin.png', preco: 12 },
    { id: 'Animal Bone', nome: 'Animal Bone', tipo: 'material', desc: 'Sturdy bone. Used in crafting.', img: 'assets/itens/animal_bone.png', preco: 12 },
    { id: 'Coal', nome: 'Coal', tipo: 'material', desc: 'Mineral coal.', img: 'assets/itens/coal.png', preco: 12 },
    { id: 'Charcoal', nome: 'Charcoal', tipo: 'material', desc: 'Charcoal. Burns hot and fast.', img: 'assets/itens/charcoal.png', preco: 14 },
    { id: 'Iron Ore', nome: 'Iron Ore', tipo: 'material', desc: 'Raw iron ore.', img: 'assets/itens/iron_ore.png', preco: 18 },
    // Ícones de moeda: §11.3 — PNG **256×256** (ou set alinhado), quadrado, moldura tipo adena/ancient_coin; cor de fundo por brief do projeto.
    { id: 'Adena', nome: 'Adena', tipo: 'currency', desc: 'Common coin of Aden. Used everywhere for trade.', img: 'assets/itens/adena_coin.png', preco: 0 },
    { id: 'Ancient Coin', nome: 'Ancient Coin', tipo: 'material', desc: 'Coin from a forgotten empire. Priceless.', img: 'assets/itens/ancient_coin.png', preco: 1200 },

    // Processados
    { id: 'Leather', nome: 'Leather', tipo: 'material', desc: 'Leather refined by Dwarven craft.', img: 'assets/itens/leather.png', preco: 58 },
    { id: 'Steel', nome: 'Steel', tipo: 'material', desc: 'Tempered steel.', img: 'assets/itens/steel.png', preco: 118 },
    { id: 'Cokes', nome: 'Cokes', tipo: 'material', desc: 'Purified coal for extreme forges.', img: 'assets/itens/cokes.png', preco: 95 },

    // Receitas como Itens Visuais na Bolsa
    { id: 'Recipe: Vesper Noble Heavy', nome: 'Recipe: Vesper Heavy', tipo: 'recipe', desc: 'Divine instructions to forge Vesper Noble Heavy.', img: 'assets/itens/recipe_s.png', preco: 5000000 },
    { id: 'Recipe: Vesper Noble Light', nome: 'Recipe: Vesper Light', tipo: 'recipe', desc: 'Instructions to forge Vesper Noble Light.', img: 'assets/itens/recipe_s.png', preco: 5000000 },
    { id: 'Recipe: Vesper Noble Robe', nome: 'Recipe: Vesper Robe', tipo: 'recipe', desc: 'Instructions to weave Vesper Noble Robe.', img: 'assets/itens/recipe_s.png', preco: 5000000 },
    { id: 'Recipe: Vesper Weapon', nome: 'Recipe: Vesper Weapon', tipo: 'recipe', desc: 'Mastersmith cipher: one blueprint for any Vesper weapon.', img: 'assets/itens/recipe_s.png', preco: 0 },
    { id: 'Recipe: Vesper Jewel', nome: 'Recipe: Vesper Jewel', tipo: 'recipe', desc: 'Lost art of Aden jewelcraft — necklace, earring, or ring.', img: 'assets/itens/recipe_s.png', preco: 0 },

    // ==========================================
    // 🧩 FRAGMENTOS DE JOIAS ÉPICAS
    // ==========================================
    { id: 'frag_antharas', nome: 'Fragment of Antharas', tipo: 'material', grade: 'S', preco: 50000, desc: 'Shard from the Earth Dragon’s scale. Combine to craft Earring of Antharas.', img: 'assets/itens/frag_antharas.png' },
    { id: 'frag_valakas', nome: 'Fragment of Valakas', tipo: 'material', grade: 'S', preco: 50000, desc: 'Blazing fragment of the Fire Dragon. Combine to craft Necklace of Valakas.', img: 'assets/itens/frag_valakas.png' },
    { id: 'frag_baium', nome: 'Fragment of Baium', tipo: 'material', grade: 'S', preco: 50000, desc: 'Splinter from the Tower of Insolence. Combine to craft Ring of Baium.', img: 'assets/itens/frag_baium.png' }
];

/** Ícone UI de set de armadura (bolsa/loja): `assets/itens/<slug>.png` — 256×256 (§11.3). */
function catalogArmorIconPath(armorId: string): string {
    var slugs = {
        a1: 'set_wooden_ng',
        a2: 'set_leather_ng',
        a3: 'set_devotion_ng',
        a4: 'set_brigandine_d',
        a5: 'set_manticore_d',
        a6: 'set_knowledge_d',
        a7: 'set_composite_c',
        a8: 'set_plated_leather_c',
        a9: 'set_karmian_c',
        a10: 'set_doom_plate_b',
        a11: 'set_doom_leather_b',
        a12: 'set_avadon_b',
        a13: 'set_dark_crystal_a',
        a14: 'set_majestic_leather_a',
        a15: 'set_tallum_a',
        a16: 'set_imperial_crusader_s',
        a17: 'set_draconic_leather_s',
        a18: 'set_major_arcana_s',
        arm_s_vesper_heavy: 'vesper_heavy',
        arm_s_vesper_light: 'vesper_light',
        arm_s_vesper_robe: 'vesper_robe',
    };
    const id = String(armorId || '');
    if (MAGE_ARMOR_AWAITING_SHOP_ICON.has(id)) {
        return 'assets/itens/item_generic.png';
    }
    // Expansion sets with shipped art (e.g. Bronze Chain → set_bronze_chain_ng.png)
    const ownExpansion = EXPANSION_ARMOR_ICON_SLUGS[id];
    if (ownExpansion && EXPANSION_ARMOR_OWN_ICON_READY.has(id)) {
        return 'assets/itens/' + ownExpansion + '.png';
    }
    const expansionSlug = resolveExpansionArmorIconSlug(id);
    if (expansionSlug) return 'assets/itens/' + expansionSlug + '.png';
    var slug = slugs[id];
    return slug ? ('assets/itens/' + slug + '.png') : 'assets/itens/item_generic.png';
}
if (typeof window !== 'undefined') {
    window.catalogArmorIconPath = catalogArmorIconPath;
}

const catalogoArmadurasBase: ItemCatalogBase[] = [
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
];

const catalogoArmaduras: ItemCatalogBase[] = [
    ...catalogoArmadurasBase.map(applyArmorCatalogMeta),
    ...buildExpansionArmors(catalogArmorIconPath),
];

// --- JOIAS (ACESSÓRIOS) ---
/** Ícone UI global (só bolsa/loja/slots — sem layer no paperdoll): assets/joias/<jewelId>.png — 256×256 */
function catalogJewelIconPath(jewelId: string): string {
    return 'assets/joias/' + String(jewelId) + '.png';
}
if (typeof window !== 'undefined') {
    window.catalogJewelIconPath = catalogJewelIconPath;
}

const catalogoJoiasBase: ItemCatalogBase[] = [
    // --- ARCANE line (medium / robe path): MP, M.Atk, Casting Speed — IDs stable ---
    // --- NO-GRADE ---
    { id: 'j_ng_neck', nome: 'Wooden Necklace', tipoItem: 'neck', grade: 'No-Grade', preco: 300, mDef: 12, bonusHp: 8, bonusMp: 22, bonusCastSpeed: 1, bonusSpd: 2, desc: 'Arcane beginner necklace. MP and cast first, with a hint of swing tempo.', img: catalogJewelIconPath('j_ng_neck') },
    { id: 'j_ng_ear', nome: 'Wooden Earring', tipoItem: 'ear', grade: 'No-Grade', preco: 200, mDef: 9, bonusHp: 5, bonusMp: 14, bonusSpd: 1, desc: 'Simple earrings that steady mana flow, with a touch of tempo.', img: catalogJewelIconPath('j_ng_ear') },
    { id: 'j_ng_ring', nome: 'Wooden Ring', tipoItem: 'ring', grade: 'No-Grade', preco: 150, mDef: 6, bonusMp: 12, mAtk: 2, desc: 'Carved ring for novice spellcasters.', img: catalogJewelIconPath('j_ng_ring') },

    // --- D-GRADE ---
    { id: 'j_d_neck', nome: 'Elven Necklace', tipoItem: 'neck', grade: 'D', preco: 2000, mDef: 28, bonusHp: 20, bonusMp: 55, bonusCastSpeed: 2, mAtk: 8, bonusSpd: 4, bonusCrit: 1, desc: 'Elf-crafted Arcane necklace. Cast/MP first; light crit and tempo.', img: catalogJewelIconPath('j_d_neck') },
    { id: 'j_d_ear', nome: 'Elven Earring', tipoItem: 'ear', grade: 'D', preco: 1500, mDef: 21, bonusMp: 40, bonusCastSpeed: 1, mAtk: 5, bonusSpd: 2, desc: 'Elven earrings that sharpen spell focus, with a hint of tempo.', img: catalogJewelIconPath('j_d_ear') },
    { id: 'j_d_ring', nome: 'Elven Ring', tipoItem: 'ring', grade: 'D', preco: 1000, mDef: 14, bonusMp: 30, mAtk: 6, desc: 'Polished Arcane ring. Raises M.Atk and mana.', img: catalogJewelIconPath('j_d_ring') },

    // --- C-GRADE ---
    { id: 'j_c_neck', nome: 'Aquastone Necklace', tipoItem: 'neck', grade: 'C', preco: 6000, mDef: 50, bonusHp: 40, bonusMp: 110, bonusCastSpeed: 3, mAtk: 18, bonusSpd: 5, bonusCrit: 1, desc: 'Aquatic Arcane stone. Cast/MP first; light crit and tempo.', img: catalogJewelIconPath('j_c_neck') },
    { id: 'j_c_ear', nome: 'Aquastone Earring', tipoItem: 'ear', grade: 'C', preco: 4500, mDef: 37, bonusMp: 75, bonusCastSpeed: 2, mAtk: 12, bonusSpd: 3, desc: 'Aquastone earrings for faster casting, with a touch of swing tempo.', img: catalogJewelIconPath('j_c_ear') },
    { id: 'j_c_ring', nome: 'Aquastone Ring', tipoItem: 'ring', grade: 'C', preco: 3000, mDef: 25, bonusMp: 55, mAtk: 14, bonusCastSpeed: 1, bonusCrit: 1, desc: 'Magic-infused Arcane ring with a light crit edge.', img: catalogJewelIconPath('j_c_ring') },

    // --- B-GRADE ---
    { id: 'j_b_neck', nome: 'Black Ore Necklace', tipoItem: 'neck', grade: 'B', preco: 18000, mDef: 70, bonusHp: 60, bonusMp: 180, bonusCastSpeed: 4, mAtk: 35, bonusSpd: 7, bonusCrit: 1, bonusDodge: 1, desc: 'Black-ore Arcane necklace. Cast/M.Atk first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_b_neck') },
    { id: 'j_b_ear', nome: 'Black Ore Earring', tipoItem: 'ear', grade: 'B', preco: 13500, mDef: 52, bonusMp: 120, bonusCastSpeed: 3, mAtk: 22, bonusSpd: 4, desc: 'Black-ore earrings. Cast focus first, with supporting tempo.', img: catalogJewelIconPath('j_b_ear') },
    { id: 'j_b_ring', nome: 'Black Ore Ring', tipoItem: 'ring', grade: 'B', preco: 9000, mDef: 35, bonusMp: 90, mAtk: 26, bonusCastSpeed: 2, bonusCrit: 1, desc: 'Arcane ring that deepens spell damage, with a light crit edge.', img: catalogJewelIconPath('j_b_ring') },

    // --- A-GRADE ---
    { id: 'j_a_neck', nome: 'Majestic Necklace', tipoItem: 'neck', grade: 'A', preco: 60000, mDef: 100, bonusHp: 90, bonusMp: 280, bonusCastSpeed: 4, mAtk: 55, bonusSpd: 9, bonusCrit: 1, bonusDodge: 1, desc: 'Majestic Arcane necklace. Cast/MP first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_a_neck') },
    { id: 'j_a_ear', nome: 'Majestic Earring', tipoItem: 'ear', grade: 'A', preco: 45000, mDef: 75, bonusMp: 200, bonusCastSpeed: 4, mAtk: 40, bonusSpd: 5, desc: 'Speeds the mind — Arcane cast first, with supporting swing tempo.', img: catalogJewelIconPath('j_a_ear') },
    { id: 'j_a_ring', nome: 'Majestic Ring', tipoItem: 'ring', grade: 'A', preco: 30000, mDef: 50, bonusMp: 140, mAtk: 45, bonusCastSpeed: 3, bonusCrit: 1, desc: 'Solid Arcane band for battle mages, with a light crit edge.', img: catalogJewelIconPath('j_a_ring') },

    // --- S-GRADE ---
    { id: 'j_s_neck', nome: 'Tateossian Necklace', tipoItem: 'neck', grade: 'S', preco: 250000, mDef: 140, bonusHp: 120, bonusMp: 420, bonusCastSpeed: 5, mAtk: 90, bonusSpd: 11, bonusCrit: 1, bonusDodge: 1, desc: 'Lordly Arcane necklace. Peak cast/MP first; secondary crit, Evasion, and tempo (~25% of Precision).', img: catalogJewelIconPath('j_s_neck') },
    { id: 'j_s_ear', nome: 'Tateossian Earring', tipoItem: 'ear', grade: 'S', preco: 180000, mDef: 105, bonusMp: 300, bonusCastSpeed: 3, mAtk: 65, bonusSpd: 7, desc: 'Tateossian Arcane earrings — cast first, with supporting tempo.', img: catalogJewelIconPath('j_s_ear') },
    { id: 'j_s_ring', nome: 'Tateossian Ring', tipoItem: 'ring', grade: 'S', preco: 125000, mDef: 70, bonusMp: 220, mAtk: 70, bonusCastSpeed: 2, bonusCrit: 1, desc: 'Tateossian Arcane ring — cast/M.Atk first, with a light crit edge.', img: catalogJewelIconPath('j_s_ring') },

    // --- ELITE S-GRADE (CRAFT) — hybrid apex, slight Arcane lean on cast/MP ---
    { id: 'j_vesper_neck', nome: 'Vesper Necklace', tipoItem: 'neck', grade: 'S', preco: 0, mDef: 165, bonusHp: 400, bonusMp: 550, bonusCastSpeed: 4, bonusCrit: 2, bonusSpd: 20, pAtk: 80, mAtk: 140, desc: 'Forged by legends. Apex hybrid with strong Arcane casting power.', img: catalogJewelIconPath('j_vesper_neck') },
    { id: 'j_vesper_ear', nome: 'Vesper Earring', tipoItem: 'ear', grade: 'S', preco: 0, mDef: 125, bonusHp: 280, bonusMp: 360, bonusCastSpeed: 3, bonusSpd: 12, pAtk: 55, mAtk: 95, desc: 'Vesper earrings. Amplifies class power with Arcane tempo.', img: catalogJewelIconPath('j_vesper_ear') },
    { id: 'j_vesper_ring', nome: 'Vesper Ring', tipoItem: 'ring', grade: 'S', preco: 0, mDef: 85, bonusHp: 180, bonusMp: 240, bonusCastSpeed: 2, bonusCrit: 2, pAtk: 40, mAtk: 80, desc: 'Vesper ring. Hybrid apex for any path.', img: catalogJewelIconPath('j_vesper_ring') },

    // --- EPIC (boss) — clear role bias ---
    { id: 'j_epic_valakas', nome: 'Necklace of Valakas', tipoItem: 'neck', grade: 'S', preco: 0, mDef: 200, bonusHp: 600, bonusMp: 700, bonusCastSpeed: 4, bonusCrit: 2, pAtk: 220, mAtk: 320, desc: 'Fire Dragon necklace. Peak hybrid offense with Arcane weight.', img: catalogJewelIconPath('j_epic_valakas') },
    { id: 'j_epic_antharas', nome: 'Earring of Antharas', tipoItem: 'ear', grade: 'S', preco: 0, mDef: 180, bonusHp: 1100, bonusMp: 200, pAtk: 180, mAtk: 80, bonusSpd: 12, bonusCrit: 1, bonusDodge: 1, desc: 'Earth Dragon earring. Peak Vitality first; light crit, Evasion, and tempo.', img: catalogJewelIconPath('j_epic_antharas') },
    { id: 'j_epic_baium', nome: 'Ring of Baium', tipoItem: 'ring', grade: 'S', preco: 0, mDef: 100, bonusHp: 80, bonusSpd: 50, bonusCrit: 3, bonusDodge: 2, pAtk: 220, mAtk: 100, desc: 'Emperor’s Precision ring. Peak crit/speed/Evasion, with supporting HP.', img: catalogJewelIconPath('j_epic_baium') },
];

const catalogoJoias: ItemCatalogBase[] = [
    ...tagMediumJewelSets(catalogoJoiasBase),
    ...buildExpansionJewels(catalogJewelIconPath),
];



// --- ARMAS ---
/** Ícone UI global (todas as raças): assets/armas/<weaponId>.png — 256×256. Paperdoll por preset: paperdolls/<preset>/equips/<id>.png */
function catalogWeaponIconPath(weaponId: string): string {
    return 'assets/armas/' + String(weaponId) + '.png';
}
if (typeof window !== 'undefined') {
    window.catalogWeaponIconPath = catalogWeaponIconPath;
}

const catalogoArmasBase: ItemCatalogBase[] = [ 
    // ======================
    // NO-GRADE
    // ======================
    /** Arma de partida — grátis no create; repurchase barato na loja NG se quebrar/perder. */
    { id: 'wpn_ng_trainee_blade', nome: 'Wooden Sword', grade: 'No-Grade', tipo: 'Sword', preco: 50, atk: 12, bonusHp: 12, img: catalogWeaponIconPath('wpn_ng_trainee_blade'), desc: 'Basic wooden practice sword for every fighter. Free on your first day; cheap at the village shop if you break one.' },
    { id: 'wpn_ng_trainee_focus', nome: 'Basic Staff', grade: 'No-Grade', tipo: 'Magic Sword', preco: 50, atk: 6, matk: 28, bonusMp: 45, bonusCastSpeed: 2, img: catalogWeaponIconPath('wpn_ng_trainee_focus'), desc: 'Simple wooden staff for novice spellcasters. Free on your first day; cheap at the village shop if you lose yours.' },
    { id: 'wpn_ng_longsword', nome: 'Long Sword', grade: 'No-Grade', tipo: 'Sword', preco: 500, atk: 22, bonusHp: 25, img: catalogWeaponIconPath('wpn_ng_longsword'), desc: 'Reliable starter sword. Balanced for any physical class.' },
    { id: 'wpn_ng_dagger', nome: 'Shining Knife', grade: 'No-Grade', tipo: 'Dagger', preco: 520, atk: 18, bonusCrit: 2, bonusSpd: 30, img: catalogWeaponIconPath('wpn_ng_dagger'), desc: 'Light dagger for fast strikes and frequent crits.' },
    { id: 'wpn_ng_bow', nome: 'Training Bow', grade: 'No-Grade', tipo: 'Bow', preco: 560, atk: 24, bonusCrit: 2, img: catalogWeaponIconPath('wpn_ng_bow'), desc: 'Training bow with solid accuracy for early farming.' },
    { id: 'wpn_ng_mace', nome: 'Apprentice Mace', grade: 'No-Grade', tipo: 'Mace', preco: 600, atk: 20, matk: 17, bonusMp: 40, img: catalogWeaponIconPath('wpn_ng_mace'), desc: 'Hybrid mace for physical classes with light magic support.' },
    { id: 'wpn_ng_magic', nome: 'Channel Staff', grade: 'No-Grade', tipo: 'Magic Sword', preco: 620, atk: 14, matk: 32, bonusMp: 80, bonusCastSpeed: 3, img: catalogWeaponIconPath('wpn_ng_magic'), desc: 'Balanced channel staff for novice mages. Reliable M. Atk, MP, and casting speed.' },

    // ======================
    // D-GRADE
    // ======================
    { id: 'wpn_d_elven_sword', nome: 'Elven Long Sword', grade: 'D', tipo: 'Sword', preco: 2000, atk: 55, bonusHp: 60, img: catalogWeaponIconPath('wpn_d_elven_sword'), desc: 'Refined elven blade with solid base power.' },
    { id: 'wpn_d_heavy_sword', nome: 'Heavy Sword', grade: 'D', tipo: 'Sword', preco: 2500, atk: 65, bonusHp: 90, img: catalogWeaponIconPath('wpn_d_heavy_sword'), desc: 'Heavy sword for steady physical burst.' },
    { id: 'wpn_d_stiletto', nome: 'Stiletto', grade: 'D', tipo: 'Dagger', preco: 2200, atk: 49, bonusCrit: 3, bonusSpd: 55, img: catalogWeaponIconPath('wpn_d_stiletto'), desc: 'Deadly dagger focused on crit rate.' },
    { id: 'wpn_d_hunters_bow', nome: 'Hunter Bow', grade: 'D', tipo: 'Bow', preco: 2600, atk: 70, bonusCrit: 3, img: catalogWeaponIconPath('wpn_d_hunters_bow'), desc: 'Long bow for ranged classes.' },
    { id: 'wpn_d_iron_knuckle', nome: 'Iron Knuckle', grade: 'D', tipo: 'Fist', preco: 2350, atk: 82, bonusSpd: 20, bonusHp: 50, img: catalogWeaponIconPath('wpn_d_iron_knuckle'), desc: 'Reinforced gauntlets for Orc brawlers before true war fists.' },
    { id: 'wpn_d_war_hammer', nome: 'War Hammer', grade: 'D', tipo: 'Mace', preco: 2700, atk: 58, matk: 42, bonusHp: 70, img: catalogWeaponIconPath('wpn_d_war_hammer'), desc: 'Sturdy war hammer with hybrid offense.' },
    { id: 'wpn_d_wizard_staff', nome: 'Wizard Staff', grade: 'D', tipo: 'Magic Sword', preco: 2800, atk: 26, matk: 84, bonusMp: 180, bonusCastSpeed: 4, img: catalogWeaponIconPath('wpn_d_wizard_staff'), desc: 'Mage staff with high M. Atk and casting speed for D-grade.' },

    // ======================
    // C-GRADE
    // ======================
    { id: 'wpn_c_stormbringer', nome: 'Stormbringer', grade: 'C', tipo: 'Sword', preco: 8000, atk: 120, bonusHp: 150, img: catalogWeaponIconPath('wpn_c_stormbringer'), desc: 'Classic C-grade sword with high physical impact.' },
    { id: 'wpn_c_sabre', nome: 'Tempered Sabre', grade: 'C', tipo: 'Sword', preco: 8600, atk: 128, bonusCrit: 3, img: catalogWeaponIconPath('wpn_c_sabre'), desc: 'Balanced saber with stable damage and good handling.' },
    { id: 'wpn_c_dark_screamer', nome: 'Dark Screamer', grade: 'C', tipo: 'Dagger', preco: 8200, atk: 110, bonusCrit: 5, bonusSpd: 85, img: catalogWeaponIconPath('wpn_c_dark_screamer'), desc: 'Legendary assassin dagger of the C progression.' },
    { id: 'wpn_c_akat_bow', nome: 'Akat Long Bow', grade: 'C', tipo: 'Bow', preco: 9000, atk: 150, bonusCrit: 4, img: catalogWeaponIconPath('wpn_c_akat_bow'), desc: 'Powerful bow for ranged burst.' },
    { id: 'wpn_c_knuckle', nome: 'Battle Knuckle', grade: 'C', tipo: 'Fist', preco: 8700, atk: 118, bonusSpd: 35, bonusHp: 120, img: catalogWeaponIconPath('wpn_c_knuckle'), desc: 'Fist weapon for accelerated DPS.' },
    { id: 'wpn_c_sorcerer_staff', nome: 'Sorcerer Staff', grade: 'C', tipo: 'Magic Sword', preco: 9200, atk: 52, matk: 180, bonusMp: 320, bonusSpd: 20, bonusCastSpeed: 6, img: catalogWeaponIconPath('wpn_c_sorcerer_staff'), desc: 'High M. Atk staff for C-grade mages with solid casting speed.' },

    // ======================
    // B-GRADE
    // ======================
    { id: 'wpn_b_damascus', nome: 'Sword of Damascus', grade: 'B', tipo: 'Sword', preco: 25000, atk: 200, bonusHp: 260, img: 'assets/armas/damascus.png', desc: 'Classic B-grade sword of brutal damage.' },
    { id: 'wpn_b_samurai', nome: 'Samurai Longsword', grade: 'B', tipo: 'Sword', preco: 26500, atk: 210, bonusCrit: 4, img: 'assets/armas/claymore.png', desc: 'Elite blade with superior physical aggression.' },
    { id: 'wpn_b_kris', nome: 'Kris', grade: 'B', tipo: 'Dagger', preco: 24000, atk: 184, bonusCrit: 6, bonusSpd: 120, img: 'assets/armas/elven_sword.png', desc: 'A precise dagger for devastating crits.' },
    { id: 'wpn_b_hakens_bow', nome: 'Haken Bow', grade: 'B', tipo: 'Bow', preco: 28000, atk: 250, bonusCrit: 5, img: 'assets/armas/draconic.png', desc: 'B-grade bow for archer builds.' },
    { id: 'wpn_b_spiked_grapple', nome: 'Spiked Grapple', grade: 'B', tipo: 'Fist', preco: 27200, atk: 228, bonusSpd: 40, bonusHp: 195, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'B-grade striking gloves. Bridges C knuckles to endgame fists.' },
    { id: 'wpn_b_demon_splinter', nome: 'Demon Splinter', grade: 'B', tipo: 'Mace', preco: 27500, atk: 196, matk: 120, bonusHp: 180, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'Hybrid mace with solid sustain for heavy PvE.' },
    { id: 'wpn_b_parasword', nome: 'Parasword', grade: 'B', tipo: 'Magic Sword', preco: 28500, atk: 90, matk: 310, bonusMp: 500, bonusSpd: 30, img: 'assets/armas/tallum.png', desc: 'Arcane sword for mages with high M. Atk.' },

    // ======================
    // A-GRADE
    // ======================
    { id: 'wpn_a_tallum', nome: 'Tallum Blade', grade: 'A', tipo: 'Sword', preco: 80000, atk: 350, bonusHp: 420, img: 'assets/armas/tallum.png', desc: 'A-grade blade for late-game physical builds.' },
    { id: 'wpn_a_dragon_slayer', nome: 'Dragon Slayer', grade: 'A', tipo: 'Sword', preco: 86000, atk: 370, bonusCrit: 5, img: 'assets/armas/damascus.png', desc: 'Execution greatsword with high damage.' },
    { id: 'wpn_a_soul_separator', nome: 'Soul Separator', grade: 'A', tipo: 'Dagger', preco: 78000, atk: 320, bonusCrit: 8, bonusSpd: 170, img: 'assets/armas/elven_sword.png', desc: 'A-grade dagger for extreme assassins.' },
    { id: 'wpn_a_carniage_bow', nome: 'Carnage Bow', grade: 'A', tipo: 'Bow', preco: 90000, atk: 430, bonusCrit: 7, img: 'assets/armas/draconic.png', desc: 'Heavy bow for maximum damage per shot.' },
    { id: 'wpn_a_steel_typhoon', nome: 'Steel Typhoon', grade: 'A', tipo: 'Fist', preco: 88500, atk: 405, bonusSpd: 58, bonusHp: 340, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'A-grade war gauntlets for fist masters before Tyrant tier.' },
    { id: 'wpn_a_forgotten_blade', nome: 'Forgotten Blade', grade: 'A', tipo: 'Mace', preco: 87000, atk: 340, matk: 220, bonusHp: 320, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'High-tier hybrid weapon for versatile classes.' },
    { id: 'wpn_a_arcana_mace', nome: 'Arcana Mace', grade: 'A', tipo: 'Magic Sword', preco: 92000, atk: 140, matk: 520, bonusMp: 900, bonusSpd: 45, img: 'assets/armas/tallum.png', desc: 'Advanced arcane catalyst for A-grade mages.' },

    // ======================
    // S-GRADE
    // ======================
    { id: 'wpn_s_infinity_sword', nome: 'Infinity Sword', grade: 'S', tipo: 'Sword', preco: 250000, atk: 600, bonusHp: 850, bonusCrit: 5, img: 'assets/armas/damascus.png', desc: 'S-grade sword for extreme physical DPS.' },
    { id: 'wpn_s_draconic', nome: 'Draconic Bow', grade: 'S', tipo: 'Bow', preco: 250000, atk: 620, bonusCrit: 6, img: 'assets/armas/draconic.png', desc: 'Legendary bow with maximum long-range power.' },
    { id: 'wpn_s_angelslayer', nome: 'Angel Slayer', grade: 'S', tipo: 'Dagger', preco: 245000, atk: 560, bonusCrit: 7, bonusSpd: 270, img: 'assets/armas/elven_sword.png', desc: 'Supreme dagger for brutal endgame crits.' },
    { id: 'wpn_s_dragon_hammer', nome: 'Dragon Hammer', grade: 'S', tipo: 'Mace', preco: 255000, atk: 590, matk: 280, bonusHp: 950, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'Titanic mace for tanks and hybrid classes.' },
    { id: 'wpn_s_imperial_staff', nome: 'Imperial Staff', grade: 'S', tipo: 'Magic Sword', preco: 260000, atk: 220, matk: 700, bonusMp: 1600, bonusSpd: 70, bonusCastSpeed: 8, img: 'assets/armas/tallum.png', desc: 'Imperial staff for S-grade mages with huge burst and fast casting.' },
    { id: 'wpn_s_tyrants_fist', nome: 'Tyrant Fist', grade: 'S', tipo: 'Fist', preco: 252000, atk: 575, bonusSpd: 130, bonusHp: 700, img: 'assets/icons/icon_wpn_heavysword.png', desc: 'Legendary fists focused on speed and relentless pressure.' },
    // --- ELITE S-GRADE (CRAFT EXCLUSIVO - ARMAS VESPER) ---
    // --- ELITE S-GRADE (CRAFT EXCLUSIVO - ARMAS VESPER COM SA) ---
    { 
        id: 'wpn_s_vesper_cutter', nome: 'Vesper Cutter', grade: 'S', tipo: 'Sword', 
        atk: 600, matk: 250, preco: 0, moeda: 'Adena',
        bonusHp: 1500, bonusSpd: 50, // SA: Health & Haste
        desc: '[SA: Health & Haste] Legendary sword. +1500 Max HP and faster attack speed.', 
        img: 'assets/itens/vesper_cutter.png' 
    },
    { 
        id: 'wpn_s_vesper_shaper', nome: 'Vesper Shaper', grade: 'S', tipo: 'Dagger', 
        atk: 520, matk: 250, preco: 0, moeda: 'Adena',
        bonusCrit: 10, bonusSpd: 240, // SA: Focus & Haste
        desc: '[SA: Focus & Haste] Abyssal dagger. +240ms faster swings and +10% Critical Rate.', 
        img: 'assets/itens/vesper_shaper.png' 
    },
    { 
        id: 'wpn_s_vesper_thrower', nome: 'Vesper Thrower', grade: 'S', tipo: 'Bow', 
        atk: 720, matk: 200, preco: 0, moeda: 'Adena',
        bonusCrit: 14, // SA: Focus
        desc: '[SA: Focus] Bow of pure energy. Highest firepower in the game and +14% Critical Rate.', 
        img: 'assets/itens/vesper_thrower.png' 
    },
    { 
        id: 'wpn_s_vesper_fighter', nome: 'Vesper Fighter', grade: 'S', tipo: 'Fist', 
        atk: 620, matk: 250, preco: 0, moeda: 'Adena',
        bonusSpd: 150, bonusHp: 1000, // SA: Haste & Health
        desc: '[SA: Haste & Health] Beast claws for Orcs. +1000 Max HP and lethal attack speed.', 
        img: 'assets/itens/vesper_fighter.png' 
    },
    { 
        id: 'wpn_s_vesper_avenger', nome: 'Vesper Avenger', grade: 'S', tipo: 'Mace', 
        atk: 640, matk: 250, preco: 0, moeda: 'Adena',
        bonusHp: 1800, // SA: Health
        desc: '[SA: Health] War hammer of the Dwarf lords. Grants +1800 raw Max HP.', 
        img: 'assets/itens/vesper_avenger.png' 
    },
    { 
        id: 'wpn_s_vesper_buster', nome: 'Vesper Buster', grade: 'S', tipo: 'Magic Sword', 
        atk: 300, matk: 700, preco: 0, moeda: 'Adena',
        bonusMp: 2000, bonusSpd: 80, // SA: Acumen & Mana
        desc: '[SA: Acumen & Mana] Ultimate arcane focus. +2000 MP and incredibly fast spellcasting.', 
        img: 'assets/itens/vesper_buster.png' 
    }
];

const catalogoArmas: ItemCatalogBase[] = [
    ...catalogoArmasBase.map(applyMageWeaponMeta),
    ...buildExpansionMageWeapons(catalogWeaponIconPath),
];

const precosVenda: Record<string, number> = { "Animal Skin": 13, "Animal Bone": 18, "Coal": 24, "Charcoal": 30, "Iron Ore": 38 };

// --- CONSUMÍVEIS E SCROLLS ---
// Shot unit prices (Adena): NG 6 → D 20 → C 60 → B 180 → A 500 → S 1500 (SS = BSS).
const catalogoConsumiveis: ShopCatalogItem[] = [
    { id: 'pot_hp', nome: 'HP Potion', preco: 58, img: 'assets/itens/pot_hp.png', desc: 'Instantly restores 50 HP.' },
    { id: 'pot_mp', nome: 'Mana Potion', preco: 58, img: 'assets/itens/pot_mp.png', desc: 'Instantly restores 40 MP.' },
    { id: 'shot_ng', nome: 'Soulshot (NG)', grade: 'No-Grade', preco: 6, img: 'assets/itens/soulshot_ng.png', desc: 'Auto-use: +20% damage on hit. Matches No-Grade weapons. [Fighters]' },
    { id: 'shot_d', nome: 'Soulshot (D)', grade: 'D', preco: 20, img: 'assets/itens/soulshot_d.png', desc: 'Auto-use: +20% damage on hit. Matches D-grade weapons. [Fighters]' },
    { id: 'shot_c', nome: 'Soulshot (C)', grade: 'C', preco: 60, img: 'assets/itens/soulshot_c.png', desc: 'Auto-use: +20% damage on hit. Matches C-grade weapons. [Fighters]' },
    { id: 'shot_b', nome: 'Soulshot (B)', grade: 'B', preco: 180, img: 'assets/itens/soulshot_b.png', desc: 'Auto-use: +20% damage on hit. Matches B-grade weapons. [Fighters]' },
    { id: 'shot_a', nome: 'Soulshot (A)', grade: 'A', preco: 500, img: 'assets/itens/soulshot_a.png', desc: 'Auto-use: +20% damage on hit. Matches A-grade weapons. [Fighters]' },
    { id: 'shot_s', nome: 'Soulshot (S)', grade: 'S', preco: 1500, img: 'assets/itens/soulshot_s.png', desc: 'Auto-use: +20% damage on hit. Matches S-grade weapons. [Fighters]' },
    { id: 'bshot_ng', nome: 'B. Spiritshot (NG)', grade: 'No-Grade', preco: 6, img: 'assets/itens/spiritshot_ng.png', desc: 'Auto-use: +20% damage on hit. Matches No-Grade weapons. [Mages]' },
    { id: 'bshot_d', nome: 'B. Spiritshot (D)', grade: 'D', preco: 20, img: 'assets/itens/spiritshot_d.png', desc: 'Auto-use: +20% damage on hit. Matches D-grade weapons. [Mages]' },
    { id: 'bshot_c', nome: 'B. Spiritshot (C)', grade: 'C', preco: 60, img: 'assets/itens/spiritshot_c.png', desc: 'Auto-use: +20% damage on hit. Matches C-grade weapons. [Mages]' },
    { id: 'bshot_b', nome: 'B. Spiritshot (B)', grade: 'B', preco: 180, img: 'assets/itens/spiritshot_b.png', desc: 'Auto-use: +20% damage on hit. Matches B-grade weapons. [Mages]' },
    { id: 'bshot_a', nome: 'B. Spiritshot (A)', grade: 'A', preco: 500, img: 'assets/itens/spiritshot_a.png', desc: 'Auto-use: +20% damage on hit. Matches A-grade weapons. [Mages]' },
    { id: 'bshot_s', nome: 'B. Spiritshot (S)', grade: 'S', preco: 1500, img: 'assets/itens/spiritshot_s.png', desc: 'Auto-use: +20% damage on hit. Matches S-grade weapons. [Mages]' },
];

const catalogoScrolls: EnchantScrollCatalogEntry[] = [
    // --- LIFE STONE ---
    { id: 'ls_1', nome: 'Life Stone', preco: 78, moeda: 'Ancient', desc: 'Rare catalyst for augmentation and master forges. Expensive for a reason.', img: 'assets/itens/life_stone.png' },

    // --- NO-GRADE (Adena + Blessed Ancient) ---
    { id: 'sc_w_ng', nome: 'Enchant Weapon (NG)', preco: 1120, moeda: 'Adena', desc: 'Raises P. Atk / M. Atk on No-Grade weapons.', img: 'assets/itens/scroll_wpn_ng.png' },
    { id: 'sc_a_ng', nome: 'Enchant Armor (NG)', preco: 335, moeda: 'Adena', desc: 'Enchants No-Grade armor and jewels. On jewels, raises M. Def and enchant-linked bonuses.', img: 'assets/itens/scroll_arm_ng.png' },
    { id: 'sc_bw_ng', nome: 'Blessed Enchant Weapon (NG)', preco: 2, moeda: 'Ancient', desc: 'Safe enchant for No-Grade weapons. On failure, the weapon does NOT break.', img: 'assets/itens/scroll_b_wpn_ng.png' },
    { id: 'sc_ba_ng', nome: 'Blessed Enchant Armor (NG)', preco: 1, moeda: 'Ancient', desc: 'Safe enchant for No-Grade armor/jewels. On failure, the item does not break.', img: 'assets/itens/scroll_b_arm_ng.png' },

    // --- D-GRADE ---
    { id: 'sc_w_d', nome: 'Enchant Weapon (D)', preco: 5600, moeda: 'Adena', desc: 'Scroll for D-grade weapons.', img: 'assets/itens/scroll_wpn_d.png' },
    { id: 'sc_bw_d', nome: 'Blessed Enchant Weapon (D)', preco: 6, moeda: 'Ancient', desc: 'Safe enchant: on failure, the weapon does NOT break.', img: 'assets/itens/scroll_b_wpn_d.png' },
    { id: 'sc_a_d', nome: 'Enchant Armor (D)', preco: 1680, moeda: 'Adena', desc: 'Scroll for D-grade armor/jewels. Jewels also use this scroll.', img: 'assets/itens/scroll_arm_d.png' },
    { id: 'sc_ba_d', nome: 'Blessed Enchant Armor (D)', preco: 3, moeda: 'Ancient', desc: 'Safe enchant for D armor/jewels. On failure, the item does not break.', img: 'assets/itens/scroll_b_arm_d.png' },

    // --- C-GRADE ---
    { id: 'sc_w_c', nome: 'Enchant Weapon (C)', preco: 22400, moeda: 'Adena', desc: 'Scroll for C-grade weapons.', img: 'assets/itens/scroll_wpn_c.png' },
    { id: 'sc_bw_c', nome: 'Blessed Enchant Weapon (C)', preco: 17, moeda: 'Ancient', desc: 'Safe enchant for C-grade weapons.', img: 'assets/itens/scroll_b_wpn_c.png' },
    { id: 'sc_a_c', nome: 'Enchant Armor (C)', preco: 6720, moeda: 'Adena', desc: 'Scroll for C-grade armor/jewels. Compatible with C jewels.', img: 'assets/itens/scroll_arm_c.png' },
    { id: 'sc_ba_c', nome: 'Blessed Enchant Armor (C)', preco: 7, moeda: 'Ancient', desc: 'Safe enchant for C armor/jewels. Failure protected.', img: 'assets/itens/scroll_b_arm_c.png' },

    // --- B-GRADE ---
    { id: 'sc_w_b', nome: 'Enchant Weapon (B)', preco: 112000, moeda: 'Adena', desc: 'Scroll for B-grade weapons.', img: 'assets/itens/scroll_wpn_b.png' },
    { id: 'sc_bw_b', nome: 'Blessed Enchant Weapon (B)', preco: 56, moeda: 'Ancient', desc: 'Safe enchant for B-grade weapons.', img: 'assets/itens/scroll_b_wpn_b.png' },
    { id: 'sc_a_b', nome: 'Enchant Armor (B)', preco: 33600, moeda: 'Adena', desc: 'Scroll for B-grade armor/jewels. B jewels use this scroll.', img: 'assets/itens/scroll_arm_b.png' },
    { id: 'sc_ba_b', nome: 'Blessed Enchant Armor (B)', preco: 22, moeda: 'Ancient', desc: 'Safe enchant for B armor/jewels. On failure, keeps the item.', img: 'assets/itens/scroll_b_arm_b.png' },

    // --- A-GRADE ---
    { id: 'sc_w_a', nome: 'Enchant Weapon (A)', preco: 560000, moeda: 'Adena', desc: 'Scroll for A-grade weapons.', img: 'assets/itens/scroll_wpn_a.png' },
    { id: 'sc_bw_a', nome: 'Blessed Enchant Weapon (A)', preco: 168, moeda: 'Ancient', desc: 'Safe enchant for A-grade weapons.', img: 'assets/itens/scroll_b_wpn_a.png' },
    { id: 'sc_a_a', nome: 'Enchant Armor (A)', preco: 168000, moeda: 'Adena', desc: 'Scroll for A-grade armor/jewels. Also used on A jewels.', img: 'assets/itens/scroll_arm_a.png' },
    { id: 'sc_ba_a', nome: 'Blessed Enchant Armor (A)', preco: 68, moeda: 'Ancient', desc: 'Safe enchant for A armor/jewels. Failure protected (no break).', img: 'assets/itens/scroll_b_arm_a.png' },

    // --- S-GRADE ---
    { id: 'sc_w_s', nome: 'Enchant Weapon (S)', preco: 2240000, moeda: 'Adena', desc: 'Scroll for S-grade weapons.', img: 'assets/itens/scroll_wpn_s.png' },
    { id: 'sc_bw_s', nome: 'Blessed Enchant Weapon (S)', preco: 560, moeda: 'Ancient', desc: 'Safe enchant for S-grade weapons.', img: 'assets/itens/scroll_b_wpn_s.png' },
    { id: 'sc_a_s', nome: 'Enchant Armor (S)', preco: 672000, moeda: 'Adena', desc: 'Scroll for S-grade armor/jewels. S jewels enchant here.', img: 'assets/itens/scroll_arm_s.png' },
    { id: 'sc_ba_s', nome: 'Blessed Enchant Armor (S)', preco: 224, moeda: 'Ancient', desc: 'Safe enchant for S armor/jewels. Protects against break.', img: 'assets/itens/scroll_b_arm_s.png' }
];

// ==========================================
// RECEITAS ELITE - VESPER / ÉPICAS
// ==========================================

const catalogoReceitas: CraftRecipeCatalog = {
    mats: [
        {
            idReceita: 'rec_mint_ancient_coin',
            nome: 'Mint Ancient Coin',
            img: 'assets/itens/ancient_coin.png',
            desc: 'Burn Adena at the forge for a chance to mint one Ancient Coin. Materials are consumed even on failure.',
            taxaSucesso: (typeof window.EconomyBalance !== 'undefined' && window.EconomyBalance.MINT_ANCIENT_SUCCESS_PCT != null)
                ? window.EconomyBalance.MINT_ANCIENT_SUCCESS_PCT
                : 10,
            itemResultado: { tipoBase: 'material', idBase: 'Ancient Coin', gerado: 1 },
            ingredientes: [
                {
                    id: 'Adena',
                    qtd: (typeof window.EconomyBalance !== 'undefined' && window.EconomyBalance.MINT_ANCIENT_ADENA_COST != null)
                        ? window.EconomyBalance.MINT_ANCIENT_ADENA_COST
                        : 5000000
                }
            ]
        }
    ],
    special: [
        {
            idReceita: 'rec_vesper_heavy',
            itemResultado: { tipoBase: 'armor', idBase: 'arm_s_vesper_heavy' },
            nome: 'Vesper Noble Heavy Set',
            img: 'assets/itens/vesper_heavy.png',
            desc: 'Forge the supreme heavy armor. Requires the rare recipe from Imperial Tomb.',
            ingredientes: [
                { id: 'Recipe: Vesper Noble Heavy', qtd: 1 },
                { id: 'Ancient Coin', qtd: 1400 },
                { id: 'Adena', qtd: 2800000 },
                { id: 'Steel', qtd: 420 },
                { id: 'Iron Ore', qtd: 5200 },
                { id: 'Coal', qtd: 2800 },
                { id: 'Life Stone', qtd: 12 }
            ]
        },
        {
            idReceita: 'rec_vesper_light',
            itemResultado: { tipoBase: 'armor', idBase: 'arm_s_vesper_light' },
            nome: 'Vesper Noble Light Set',
            img: 'assets/itens/vesper_light.png',
            desc: 'Forge the elite leather set.',
            ingredientes: [
                { id: 'Recipe: Vesper Noble Light', qtd: 1 },
                { id: 'Ancient Coin', qtd: 1400 },
                { id: 'Adena', qtd: 2800000 },
                { id: 'Leather', qtd: 420 },
                { id: 'Animal Skin', qtd: 5200 },
                { id: 'Animal Bone', qtd: 2800 },
                { id: 'Life Stone', qtd: 12 }
            ]
        },
        {
            idReceita: 'rec_vesper_robe',
            itemResultado: { tipoBase: 'armor', idBase: 'arm_s_vesper_robe' },
            nome: 'Vesper Noble Robe Set',
            img: 'assets/itens/vesper_robe.png',
            desc: 'Forge the ultimate magic robe.',
            ingredientes: [
                { id: 'Recipe: Vesper Noble Robe', qtd: 1 },
                { id: 'Ancient Coin', qtd: 1400 },
                { id: 'Adena', qtd: 2800000 },
                { id: 'Cokes', qtd: 350 },
                { id: 'Charcoal', qtd: 5200 },
                { id: 'Coal', qtd: 2800 },
                { id: 'Life Stone', qtd: 12 }
            ]
        },
        {
            idReceita: 'rec_vesper_weapon_unified',
            nome: 'Vesper Weapon',
            img: 'assets/itens/vesper_cutter.png',
            desc: 'Universal Vesper weapon forge. Consumes one Recipe: Vesper Weapon. Pick the weapon type before forging.',
            ingredientes: [
                { id: 'Recipe: Vesper Weapon', qtd: 1 },
                { id: 'Ancient Coin', qtd: 2400 },
                { id: 'Adena', qtd: 5800000 },
                { id: 'Steel', qtd: 950 },
                { id: 'Iron Ore', qtd: 5500 },
                { id: 'Coal', qtd: 4200 },
                { id: 'Charcoal', qtd: 3800 },
                { id: 'Life Stone', qtd: 24 }
            ],
            escolhasResultado: [
                { idBase: 'wpn_s_vesper_cutter', tipoBase: 'weapon', label: 'Cutter (Sword)' },
                { idBase: 'wpn_s_vesper_shaper', tipoBase: 'weapon', label: 'Shaper (Dagger)' },
                { idBase: 'wpn_s_vesper_thrower', tipoBase: 'weapon', label: 'Thrower (Bow)' },
                { idBase: 'wpn_s_vesper_fighter', tipoBase: 'weapon', label: 'Fighter (Fist)' },
                { idBase: 'wpn_s_vesper_avenger', tipoBase: 'weapon', label: 'Avenger (Mace)' },
                { idBase: 'wpn_s_vesper_buster', tipoBase: 'weapon', label: 'Buster (Staff)' }
            ]
        },
        {
            idReceita: 'rec_vesper_jewel_unified',
            nome: 'Vesper Jewel',
            img: catalogJewelIconPath('j_vesper_neck'),
            desc: 'Universal Vesper jewel forge. Consumes one Recipe: Vesper Jewel. Pick necklace, earring, or ring.',
            ingredientes: [
                { id: 'Recipe: Vesper Jewel', qtd: 1 },
                { id: 'Ancient Coin', qtd: 1450 },
                { id: 'Adena', qtd: 3400000 },
                { id: 'Steel', qtd: 480 },
                { id: 'Cokes', qtd: 260 },
                { id: 'Leather', qtd: 380 },
                { id: 'Animal Bone', qtd: 4200 },
                { id: 'Life Stone', qtd: 30 }
            ],
            escolhasResultado: [
                { idBase: 'j_vesper_neck', tipoBase: 'jewel', label: 'Necklace' },
                { idBase: 'j_vesper_ear', tipoBase: 'jewel', label: 'Earring' },
                { idBase: 'j_vesper_ring', tipoBase: 'jewel', label: 'Ring' }
            ]
        },
        // ==========================================
        // 💎 RECEITAS ÉPICAS (JOIAS DE BOSS)
        // ==========================================
        {
            idReceita: 'rec_epic_antharas',
            itemResultado: { tipoBase: 'jewel', idBase: 'j_epic_antharas' }, // <-- O tipoBase agora é 'jewel'
            nome: 'Earring of Antharas',
            img: catalogJewelIconPath('j_epic_antharas'),
            desc: 'Forge the legendary Earth Dragon jewel. Requires fragments from the Grand Raid.',
            ingredientes: [
                { id: 'Fragment of Antharas', qtd: 130 },
                { id: 'Ancient Coin', qtd: 3400 },
                { id: 'Adena', qtd: 5500000 },
                { id: 'Steel', qtd: 400 },
                { id: 'Cokes', qtd: 120 }
            ]
        }
    ]
};

// Ponte para módulos ES (Vite) — onclick HTML e TS leem via window.*
window.catalogoScrolls = catalogoScrolls;
window.catalogoConsumiveis = catalogoConsumiveis;
window.catalogoMateriais = catalogoMateriais;
window.catalogoArmas = catalogoArmas;
window.catalogoArmaduras = catalogoArmaduras;
window.catalogoJoias = catalogoJoias;
window.armorMatchesClass = armorMatchesClass;
window.formatArmorLineLabel = formatArmorLineLabel;
window.weaponMatchesClass = weaponMatchesClass;
window.isMageExclusiveWeapon = isMageExclusiveWeapon;
window.catalogoReceitas = catalogoReceitas;
window.precosVenda = precosVenda;


export {};
