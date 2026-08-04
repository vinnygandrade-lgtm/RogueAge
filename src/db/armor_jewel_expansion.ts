/**
 * Expansão do catálogo: 6 armaduras/grade (3 fighter + 3 mage × heavy/medium/light)
 * e 3 conjuntos de joias/grade (light / medium / heavy — universais).
 */
import type { ItemCatalogBase } from '../types/game';

export type ArmorArchetype = 'fighter' | 'mage';
export type ArmorWeight = 'heavy' | 'medium' | 'light';
export type JewelSetWeight = 'light' | 'medium' | 'heavy';

const EXISTING_ARMOR_META: Record<string, { armorArchetype: ArmorArchetype; armorWeight: ArmorWeight; armorStyle: string }> = {
    a1: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a2: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a3: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    a4: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a5: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a6: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    a7: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a8: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a9: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    a10: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a11: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a12: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    a13: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a14: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a15: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    a16: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Plate' },
    a17: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Leather' },
    a18: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Vestment' },
    arm_s_vesper_heavy: { armorArchetype: 'fighter', armorWeight: 'heavy', armorStyle: 'Noble Plate' },
    arm_s_vesper_light: { armorArchetype: 'fighter', armorWeight: 'light', armorStyle: 'Noble Leather' },
    arm_s_vesper_robe: { armorArchetype: 'mage', armorWeight: 'medium', armorStyle: 'Noble Vestment' },
};

/** tipo legado usado por paperdoll / saves antigos */
export function resolveArmorTipoLegacy(archetype: ArmorArchetype, weight: ArmorWeight): string {
    if (archetype === 'fighter') {
        if (weight === 'heavy') return 'Heavy';
        if (weight === 'light') return 'Light';
        return 'Medium';
    }
    if (weight === 'light') return 'Mage Light';
    if (weight === 'heavy') return 'Mage Heavy';
    return 'Robe';
}

export function applyArmorCatalogMeta(armor: ItemCatalogBase): ItemCatalogBase {
    const id = String(armor.id || '');
    const meta = EXISTING_ARMOR_META[id];
    if (meta) {
        return {
            ...armor,
            armorArchetype: meta.armorArchetype,
            armorWeight: meta.armorWeight,
            armorStyle: meta.armorStyle,
            armorLineLabel: formatArmorLineLabel(meta.armorArchetype, meta.armorWeight, meta.armorStyle),
        };
    }
    return armor;
}

export function formatArmorLineLabel(archetype: ArmorArchetype, weight: ArmorWeight, style?: string): string {
    const arch = archetype === 'mage' ? 'Mage' : 'Fighter';
    const wt = weight.charAt(0).toUpperCase() + weight.slice(1);
    const st = style ? ` · ${style}` : '';
    return `${arch} ${wt}${st}`;
}

export function armorMatchesClass(armor: ItemCatalogBase | null | undefined, isMage: boolean): boolean {
    if (!armor) return false;
    const arch = armor.armorArchetype as ArmorArchetype | undefined;
    if (!arch) {
        const tipo = String(armor.tipo || '');
        if (isMage) return tipo === 'Robe' || tipo === 'Mage Light' || tipo === 'Mage Heavy';
        return tipo === 'Heavy' || tipo === 'Light' || tipo === 'Medium';
    }
    return isMage ? arch === 'mage' : arch === 'fighter';
}

export function pickRandomArmorWeight(weights: ArmorWeight[]): ArmorWeight {
    return weights[Math.floor(Math.random() * weights.length)];
}

type NewArmorDef = {
    id: string;
    nome: string;
    grade: string;
    preco: number;
    armorArchetype: ArmorArchetype;
    armorWeight: ArmorWeight;
    armorStyle: string;
    iconSlug: string;
    desc: string;
    pDef: number;
    bonusHp?: number;
    bonusMp?: number;
    bonusMDef?: number;
    bonusSpd?: number;
    bonusCrit?: number;
};

const NEW_ARMOR_DEFS: NewArmorDef[] = [
    // NO-GRADE
    { id: 'arm_ng_f_chain', nome: 'Bronze Chain Set', grade: 'No-Grade', preco: 800, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_bronze_chain_ng', desc: 'Bronze rings and leather backing. Balanced protection for frontline trainees.', pDef: 26, bonusHp: 35, bonusSpd: 4 },
    { id: 'arm_ng_m_woven', nome: 'Spellweave Set', grade: 'No-Grade', preco: 800, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_spellweave_ng', desc: 'Light enchanted weave. Favors MP and casting tempo over plate.', pDef: 11, bonusMp: 65, bonusMDef: 12, bonusSpd: 6 },
    { id: 'arm_ng_m_warden', nome: 'Runic Warden Set', grade: 'No-Grade', preco: 800, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_runic_warden_ng', desc: 'Runed bronze guards over spellcloth. Arcane bulwark for battle mages.', pDef: 22, bonusHp: 30, bonusMp: 35, bonusMDef: 18 },

    // D
    { id: 'arm_d_f_chain', nome: 'Half-Plate Set', grade: 'D', preco: 25000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_half_plate_d', desc: 'Hybrid mail and plate. Reliable middle ground between brigandine and manticore leather.', pDef: 70, bonusHp: 110, bonusCrit: 1 },
    { id: 'arm_d_m_woven', nome: 'Arcane Loom Set', grade: 'D', preco: 25000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_arcane_loom_d', desc: 'Woven sigils and silk lining. Swift focus for apprentice arcanists.', pDef: 32, bonusMp: 175, bonusMDef: 28, bonusSpd: 8 },
    { id: 'arm_d_m_warden', nome: 'Sanctum Guard Set', grade: 'D', preco: 25000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_sanctum_guard_d', desc: 'Reinforced ward plates over ritual cloth. Higher M. Def for exposed casters.', pDef: 52, bonusHp: 80, bonusMp: 120, bonusMDef: 32 },

    // C
    { id: 'arm_c_f_chain', nome: 'Campaign Chain Set', grade: 'C', preco: 120000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_campaign_chain_c', desc: 'Layered chain for skirmish captains. Between composite plate and plated leather.', pDef: 130, bonusHp: 240, bonusSpd: 12 },
    { id: 'arm_c_m_woven', nome: 'Mystic Thread Set', grade: 'C', preco: 120000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_mystic_thread_c', desc: 'Threaded crystals in light vestments. Strong MP flow with modest defense.', pDef: 58, bonusMp: 340, bonusMDef: 50, bonusSpd: 12 },
    { id: 'arm_c_m_warden', nome: 'Aegis Rite Set', grade: 'C', preco: 120000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_aegis_rite_c', desc: 'Runic ward harness for siege casters. Heavy arcane plating without full plate weight.', pDef: 95, bonusHp: 180, bonusMp: 260, bonusMDef: 58 },

    // B
    { id: 'arm_b_f_chain', nome: 'Doom Chain Set', grade: 'B', preco: 450000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_doom_chain_b', desc: 'Dark linked steel between doom plate and doom leather. Raid-ready versatility.', pDef: 210, bonusHp: 420, bonusCrit: 4 },
    { id: 'arm_b_m_woven', nome: 'Shadow Loom Set', grade: 'B', preco: 450000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_shadow_loom_b', desc: 'Shadow-silk vestments for fast ritualists. High MP with agile casting profile.', pDef: 95, bonusMp: 560, bonusMDef: 78, bonusSpd: 18 },
    { id: 'arm_b_m_warden', nome: 'Obsidian Ward Set', grade: 'B', preco: 450000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_obsidian_ward_b', desc: 'Obsidian ward plates fused to spellcloth. Elite M. Def for prolonged duels.', pDef: 155, bonusHp: 320, bonusMp: 420, bonusMDef: 88 },

    // A
    { id: 'arm_a_f_chain', nome: 'Crystal Chain Set', grade: 'A', preco: 1500000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_crystal_chain_a', desc: 'Crystal-linked mail between dark crystal plate and majestic leather.', pDef: 305, bonusHp: 680, bonusSpd: 28 },
    { id: 'arm_a_m_woven', nome: 'Starweave Set', grade: 'A', preco: 1500000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_starweave_a', desc: 'Starlit weave for high arcane throughput. Peak MP bias with light silhouette.', pDef: 140, bonusMp: 920, bonusMDef: 118, bonusSpd: 22 },
    { id: 'arm_a_m_warden', nome: 'Titan Rite Set', grade: 'A', preco: 1500000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_titan_rite_a', desc: 'Titan ward harness for war arcanists. Heavy magical plating for frontline casters.', pDef: 220, bonusHp: 520, bonusMp: 680, bonusMDef: 128 },

    // S
    { id: 'arm_s_f_chain', nome: 'Sentinel Chain Set', grade: 'S', preco: 5000000, armorArchetype: 'fighter', armorWeight: 'medium', armorStyle: 'Chain', iconSlug: 'set_sentinel_chain_s', desc: 'Legendary sentinel mail. Middle path between imperial crusader and draconic leather.', pDef: 440, bonusHp: 1200, bonusCrit: 8 },
    { id: 'arm_s_m_woven', nome: 'Eclipse Weave Set', grade: 'S', preco: 5000000, armorArchetype: 'mage', armorWeight: 'light', armorStyle: 'Weave', iconSlug: 'set_eclipse_weave_s', desc: 'Eclipse-thread vestments. Extreme MP and cast tempo for S-Grade arcanists.', pDef: 210, bonusMp: 1750, bonusMDef: 165, bonusSpd: 35 },
    { id: 'arm_s_m_warden', nome: 'Void Warden Set', grade: 'S', preco: 5000000, armorArchetype: 'mage', armorWeight: 'heavy', armorStyle: 'Warden', iconSlug: 'set_void_warden_s', desc: 'Void ward plates for battle-sage champions. Maximum arcane bulwark at S-Grade.', pDef: 340, bonusHp: 900, bonusMp: 1250, bonusMDef: 210 },
];

export function buildExpansionArmors(iconPath: (id: string) => string): ItemCatalogBase[] {
    return NEW_ARMOR_DEFS.map((def) => {
        const tipo = resolveArmorTipoLegacy(def.armorArchetype, def.armorWeight);
        return {
            id: def.id,
            nome: def.nome,
            grade: def.grade,
            preco: def.preco,
            tipo,
            armorArchetype: def.armorArchetype,
            armorWeight: def.armorWeight,
            armorStyle: def.armorStyle,
            armorLineLabel: formatArmorLineLabel(def.armorArchetype, def.armorWeight, def.armorStyle),
            pDef: def.pDef,
            bonusHp: def.bonusHp,
            bonusMp: def.bonusMp,
            bonusMDef: def.bonusMDef,
            bonusSpd: def.bonusSpd,
            bonusCrit: def.bonusCrit,
            desc: def.desc,
            img: iconPath(def.id),
        };
    });
}

/** Slugs extras para ícones de armadura nova (destino final em assets/itens/) */
export const EXPANSION_ARMOR_ICON_SLUGS: Record<string, string> = Object.fromEntries(
    NEW_ARMOR_DEFS.map((d) => [d.id, d.iconSlug]),
);

/**
 * Expansion armors whose dedicated PNG already ships in `assets/itens/<iconSlug>.png`.
 * Add the armor id here when you drop the file — otherwise the shop/bag uses FALLBACK.
 */
export const EXPANSION_ARMOR_OWN_ICON_READY = new Set<string>([
    'arm_ng_f_chain', // set_bronze_chain_ng.png
    'arm_ng_m_woven', // set_spellweave_ng.png
    'arm_ng_m_warden', // set_runic_warden_ng.png
]);

/**
 * Mage NG–C: generic shop icon until dedicated PNG ships (do not borrow legacy set icons).
 * D Knowledge (a6) · C Warden / Weave — NG Runic Warden already READY.
 */
export const MAGE_ARMOR_AWAITING_SHOP_ICON = new Set([
    'arm_d_m_woven',
    'arm_d_m_warden',
    'a9',
    'arm_c_m_woven',
]);

/** Temporary borrow of an existing set icon until own art is READY. */
export const EXPANSION_ARMOR_ICON_FALLBACK: Record<string, string> = {
    arm_d_f_chain: 'set_brigandine_d',
    arm_c_f_chain: 'set_composite_c',
    arm_c_m_warden: 'set_karmian_c',
    arm_b_f_chain: 'set_composite_c',
    arm_b_m_woven: 'set_karmian_c',
    arm_b_m_warden: 'set_karmian_c',
    arm_a_f_chain: 'set_composite_c',
    arm_a_m_woven: 'set_karmian_c',
    arm_a_m_warden: 'set_karmian_c',
    arm_s_f_chain: 'set_composite_c',
    arm_s_m_woven: 'set_karmian_c',
    arm_s_m_warden: 'set_karmian_c',
};

export function resolveExpansionArmorIconSlug(armorId: string): string | null {
    const id = String(armorId || '');
    if (MAGE_ARMOR_AWAITING_SHOP_ICON.has(id)) return null;
    const own = EXPANSION_ARMOR_ICON_SLUGS[id];
    if (own && EXPANSION_ARMOR_OWN_ICON_READY.has(id)) return own;
    return EXPANSION_ARMOR_ICON_FALLBACK[id] ?? null;
}

type JewelPiece = 'neck' | 'ear' | 'ring';
type JewelGradeKey = 'ng' | 'd' | 'c' | 'b' | 'a' | 's';

type JewelSetDef = {
    grade: string;
    gradeKey: JewelGradeKey;
    weight: JewelSetWeight;
    prefix: string;
    precoNeck: number;
    precoEar: number;
    precoRing: number;
    mDefNeck: number;
    mDefEar: number;
    mDefRing: number;
    bonusHpNeck: number;
    bonusHpEar: number;
    bonusHpRing: number;
    bonusMpNeck: number;
    bonusMpEar: number;
    bonusMpRing: number;
    bonusCritNeck?: number;
    bonusCritEar?: number;
    bonusCritRing?: number;
    bonusSpdNeck?: number;
    bonusSpdEar?: number;
    bonusSpdRing?: number;
    bonusDodgeNeck?: number;
    bonusDodgeEar?: number;
    bonusDodgeRing?: number;
    bonusCastNeck?: number;
    bonusCastEar?: number;
    bonusCastRing?: number;
    pAtkNeck?: number;
    pAtkEar?: number;
    pAtkRing?: number;
    mAtkNeck?: number;
    mAtkEar?: number;
    mAtkRing?: number;
};

/** Precision line — crit, attack speed, light Evasion. */
const JEWEL_LIGHT_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'light', prefix: 'Willow', precoNeck: 260, precoEar: 170, precoRing: 130, mDefNeck: 8, mDefEar: 6, mDefRing: 4, bonusHpNeck: 8, bonusHpEar: 5, bonusHpRing: 3, bonusMpNeck: 4, bonusMpEar: 3, bonusMpRing: 2, bonusSpdNeck: 5, bonusSpdEar: 3, bonusCritRing: 1 },
    { grade: 'D', gradeKey: 'd', weight: 'light', prefix: 'Silverleaf', precoNeck: 1800, precoEar: 1350, precoRing: 900, mDefNeck: 18, mDefEar: 14, mDefRing: 9, bonusHpNeck: 18, bonusHpEar: 12, bonusHpRing: 8, bonusMpNeck: 10, bonusMpEar: 8, bonusMpRing: 5, bonusSpdNeck: 8, bonusSpdEar: 5, bonusCritNeck: 2, bonusCritRing: 2, bonusDodgeEar: 1 },
    { grade: 'C', gradeKey: 'c', weight: 'light', prefix: 'Moonstone', precoNeck: 5400, precoEar: 4050, precoRing: 2700, mDefNeck: 32, mDefEar: 24, mDefRing: 16, bonusHpNeck: 35, bonusHpEar: 24, bonusHpRing: 14, bonusMpNeck: 18, bonusMpEar: 12, bonusMpRing: 8, bonusSpdNeck: 12, bonusSpdEar: 8, bonusCritNeck: 3, bonusCritRing: 3, bonusDodgeNeck: 1, bonusDodgeEar: 1, pAtkEar: 6 },
    { grade: 'B', gradeKey: 'b', weight: 'light', prefix: 'Nightwind', precoNeck: 16200, precoEar: 12150, precoRing: 8100, mDefNeck: 48, mDefEar: 36, mDefRing: 24, bonusHpNeck: 55, bonusHpEar: 38, bonusHpRing: 22, bonusMpNeck: 28, bonusMpEar: 18, bonusMpRing: 12, bonusSpdNeck: 18, bonusSpdEar: 12, bonusCritNeck: 4, bonusCritRing: 4, bonusDodgeNeck: 2, bonusDodgeEar: 1, pAtkNeck: 12, pAtkEar: 8 },
    { grade: 'A', gradeKey: 'a', weight: 'light', prefix: 'Starlight', precoNeck: 54000, precoEar: 40500, precoRing: 27000, mDefNeck: 70, mDefEar: 52, mDefRing: 35, bonusHpNeck: 80, bonusHpEar: 55, bonusHpRing: 32, bonusMpNeck: 40, bonusMpEar: 28, bonusMpRing: 18, bonusSpdNeck: 28, bonusSpdEar: 18, bonusCritNeck: 5, bonusCritRing: 5, bonusDodgeNeck: 2, bonusDodgeEar: 2, bonusDodgeRing: 1, pAtkNeck: 28, pAtkEar: 18 },
    { grade: 'S', gradeKey: 's', weight: 'light', prefix: 'Radiant', precoNeck: 225000, precoEar: 162000, precoRing: 112500, mDefNeck: 95, mDefEar: 72, mDefRing: 48, bonusHpNeck: 120, bonusHpEar: 80, bonusHpRing: 48, bonusMpNeck: 60, bonusMpEar: 40, bonusMpRing: 28, bonusSpdNeck: 42, bonusSpdEar: 26, bonusCritNeck: 7, bonusCritRing: 7, bonusDodgeNeck: 3, bonusDodgeEar: 2, bonusDodgeRing: 2, pAtkNeck: 50, pAtkEar: 32, pAtkRing: 20 },
];

/** Vitality line — HP, resilience, physical presence. No crit / cast stacking. */
const JEWEL_HEAVY_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'heavy', prefix: 'Ironheart', precoNeck: 340, precoEar: 230, precoRing: 170, mDefNeck: 16, mDefEar: 12, mDefRing: 8, bonusHpNeck: 30, bonusHpEar: 20, bonusHpRing: 12, bonusMpNeck: 4, bonusMpEar: 3, bonusMpRing: 2 },
    { grade: 'D', gradeKey: 'd', weight: 'heavy', prefix: 'Granite', precoNeck: 2200, precoEar: 1650, precoRing: 1100, mDefNeck: 36, mDefEar: 27, mDefRing: 18, bonusHpNeck: 70, bonusHpEar: 45, bonusHpRing: 28, bonusMpNeck: 12, bonusMpEar: 8, bonusMpRing: 5, pAtkRing: 4 },
    { grade: 'C', gradeKey: 'c', weight: 'heavy', prefix: 'Stoneguard', precoNeck: 6600, precoEar: 4950, precoRing: 3300, mDefNeck: 64, mDefEar: 48, mDefRing: 32, bonusHpNeck: 140, bonusHpEar: 95, bonusHpRing: 55, bonusMpNeck: 24, bonusMpEar: 16, bonusMpRing: 10, pAtkNeck: 10, pAtkEar: 6 },
    { grade: 'B', gradeKey: 'b', weight: 'heavy', prefix: 'Obsidian', precoNeck: 19800, precoEar: 14850, precoRing: 9900, mDefNeck: 90, mDefEar: 68, mDefRing: 45, bonusHpNeck: 230, bonusHpEar: 155, bonusHpRing: 90, bonusMpNeck: 40, bonusMpEar: 28, bonusMpRing: 16, pAtkNeck: 26, pAtkEar: 16, pAtkRing: 10 },
    { grade: 'A', gradeKey: 'a', weight: 'heavy', prefix: 'Titan', precoNeck: 66000, precoEar: 49500, precoRing: 33000, mDefNeck: 128, mDefEar: 96, mDefRing: 64, bonusHpNeck: 380, bonusHpEar: 260, bonusHpRing: 150, bonusMpNeck: 60, bonusMpEar: 42, bonusMpRing: 24, pAtkNeck: 48, pAtkEar: 32, pAtkRing: 20 },
    { grade: 'S', gradeKey: 's', weight: 'heavy', prefix: 'Dominion', precoNeck: 275000, precoEar: 198000, precoRing: 137500, mDefNeck: 175, mDefEar: 132, mDefRing: 88, bonusHpNeck: 560, bonusHpEar: 380, bonusHpRing: 220, bonusMpNeck: 90, bonusMpEar: 60, bonusMpRing: 36, pAtkNeck: 90, pAtkEar: 60, pAtkRing: 40 },
];

function jewelIdentityLabel(weight: JewelSetWeight): string {
    if (weight === 'light') return 'Precision';
    if (weight === 'heavy') return 'Vitality';
    return 'Arcane';
}

function jewelPieceName(prefix: string, piece: JewelPiece, weight: JewelSetWeight): string {
    const pieceLabel = piece === 'neck' ? 'Necklace' : (piece === 'ear' ? 'Earring' : 'Ring');
    return `${prefix} ${jewelIdentityLabel(weight)} ${pieceLabel}`;
}

function buildJewelSetEntries(set: JewelSetDef, iconPath: (id: string) => string): ItemCatalogBase[] {
    const suffix = set.weight === 'light' ? 'lt' : 'hv';
    const identity = jewelIdentityLabel(set.weight);
    const pieces: Array<{
        piece: JewelPiece;
        preco: number;
        mDef: number;
        bonusHp: number;
        bonusMp: number;
        bonusCrit?: number;
        bonusSpd?: number;
        bonusDodge?: number;
        bonusCastSpeed?: number;
        pAtk?: number;
        mAtk?: number;
    }> = [
        { piece: 'neck', preco: set.precoNeck, mDef: set.mDefNeck, bonusHp: set.bonusHpNeck, bonusMp: set.bonusMpNeck, bonusCrit: set.bonusCritNeck, bonusSpd: set.bonusSpdNeck, bonusDodge: set.bonusDodgeNeck, bonusCastSpeed: set.bonusCastNeck, pAtk: set.pAtkNeck, mAtk: set.mAtkNeck },
        { piece: 'ear', preco: set.precoEar, mDef: set.mDefEar, bonusHp: set.bonusHpEar, bonusMp: set.bonusMpEar, bonusCrit: set.bonusCritEar, bonusSpd: set.bonusSpdEar, bonusDodge: set.bonusDodgeEar, bonusCastSpeed: set.bonusCastEar, pAtk: set.pAtkEar, mAtk: set.mAtkEar },
        { piece: 'ring', preco: set.precoRing, mDef: set.mDefRing, bonusHp: set.bonusHpRing, bonusMp: set.bonusMpRing, bonusCrit: set.bonusCritRing, bonusSpd: set.bonusSpdRing, bonusDodge: set.bonusDodgeRing, bonusCastSpeed: set.bonusCastRing, pAtk: set.pAtkRing, mAtk: set.mAtkRing },
    ];
    return pieces.map((p) => {
        const id = `j_${set.gradeKey}_${suffix}_${p.piece}`;
        const roleDesc =
            set.weight === 'light'
                ? 'Precision jewelry: crit, attack speed, and light Evasion for agile fighters.'
                : 'Vitality jewelry: HP, magical defense, and physical presence for frontliners.';
        return {
            id,
            nome: jewelPieceName(set.prefix, p.piece, set.weight),
            tipoItem: p.piece,
            grade: set.grade,
            preco: p.preco,
            mDef: p.mDef,
            bonusHp: p.bonusHp,
            bonusMp: p.bonusMp,
            bonusCrit: p.bonusCrit,
            bonusSpd: p.bonusSpd,
            bonusDodge: p.bonusDodge,
            bonusCastSpeed: p.bonusCastSpeed,
            pAtk: p.pAtk,
            mAtk: p.mAtk,
            jewelSetWeight: set.weight,
            jewelSetLabel: `${set.prefix} · ${identity} Set`,
            desc: `${roleDesc} (${set.grade}).`,
            img: iconPath(id),
        };
    });
}

export function buildExpansionJewels(iconPath: (id: string) => string): ItemCatalogBase[] {
    const out: ItemCatalogBase[] = [];
    for (const set of JEWEL_LIGHT_SETS) out.push(...buildJewelSetEntries(set, iconPath));
    for (const set of JEWEL_HEAVY_SETS) out.push(...buildJewelSetEntries(set, iconPath));
    return out;
}

export function tagMediumJewelSets(jewels: ItemCatalogBase[]): ItemCatalogBase[] {
    const mediumSetNames: Record<string, string> = {
        j_ng_: 'Wooden',
        j_d_: 'Elven',
        j_c_: 'Aquastone',
        j_b_: 'Black Ore',
        j_a_: 'Majestic',
        j_s_: 'Tateossian',
    };
    return jewels.map((j) => {
        const id = String(j.id || '');
        if (id.startsWith('j_vesper_') || id.startsWith('j_epic_') || id.includes('_lt_') || id.includes('_hv_')) {
            return j;
        }
        for (const [prefix, label] of Object.entries(mediumSetNames)) {
            if (id.startsWith(prefix)) {
                return {
                    ...j,
                    jewelSetWeight: 'medium' as JewelSetWeight,
                    jewelSetLabel: `${label} · Arcane Set`,
                };
            }
        }
        return j;
    });
}
