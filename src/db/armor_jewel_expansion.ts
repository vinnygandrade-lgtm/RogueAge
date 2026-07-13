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

/** Slugs extras para ícones de armadura nova */
export const EXPANSION_ARMOR_ICON_SLUGS: Record<string, string> = Object.fromEntries(
    NEW_ARMOR_DEFS.map((d) => [d.id, d.iconSlug]),
);

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
    pAtkNeck?: number;
    pAtkEar?: number;
    pAtkRing?: number;
    mAtkNeck?: number;
    mAtkEar?: number;
    mAtkRing?: number;
};

const JEWEL_LIGHT_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'light', prefix: 'Willow', precoNeck: 260, precoEar: 170, precoRing: 130, mDefNeck: 10, mDefEar: 8, mDefRing: 5, bonusHpNeck: 10, bonusHpEar: 8, bonusHpRing: 4, bonusMpNeck: 14, bonusMpEar: 8, bonusMpRing: 6, bonusSpdNeck: 4, bonusSpdEar: 2, bonusCritRing: 1 },
    { grade: 'D', gradeKey: 'd', weight: 'light', prefix: 'Silverleaf', precoNeck: 1800, precoEar: 1350, precoRing: 900, mDefNeck: 24, mDefEar: 18, mDefRing: 12, bonusHpNeck: 30, bonusHpEar: 20, bonusHpRing: 12, bonusMpNeck: 32, bonusMpEar: 20, bonusMpRing: 14, bonusSpdNeck: 6, bonusSpdEar: 4, bonusCritNeck: 1, bonusCritRing: 1 },
    { grade: 'C', gradeKey: 'c', weight: 'light', prefix: 'Moonstone', precoNeck: 5400, precoEar: 4050, precoRing: 2700, mDefNeck: 42, mDefEar: 32, mDefRing: 21, bonusHpNeck: 70, bonusHpEar: 45, bonusHpRing: 24, bonusMpNeck: 58, bonusMpEar: 42, bonusMpRing: 24, bonusSpdNeck: 8, bonusSpdEar: 5, bonusCritNeck: 2, bonusCritRing: 2 },
    { grade: 'B', gradeKey: 'b', weight: 'light', prefix: 'Nightwind', precoNeck: 16200, precoEar: 12150, precoRing: 8100, mDefNeck: 58, mDefEar: 44, mDefRing: 29, bonusHpNeck: 120, bonusHpEar: 80, bonusHpRing: 45, bonusMpNeck: 95, bonusMpEar: 65, bonusMpRing: 38, bonusSpdNeck: 14, bonusSpdEar: 8, bonusCritNeck: 2, bonusCritRing: 2, pAtkEar: 6, mAtkEar: 6 },
    { grade: 'A', gradeKey: 'a', weight: 'light', prefix: 'Starlight', precoNeck: 54000, precoEar: 40500, precoRing: 27000, mDefNeck: 82, mDefEar: 62, mDefRing: 41, bonusHpNeck: 200, bonusHpEar: 140, bonusHpRing: 75, bonusMpNeck: 165, bonusMpEar: 120, bonusMpRing: 68, bonusSpdNeck: 24, bonusSpdEar: 14, bonusCritNeck: 3, bonusCritRing: 3, pAtkNeck: 20, mAtkNeck: 20 },
    { grade: 'S', gradeKey: 's', weight: 'light', prefix: 'Radiant', precoNeck: 225000, precoEar: 162000, precoRing: 112500, mDefNeck: 115, mDefEar: 86, mDefRing: 58, bonusHpNeck: 320, bonusHpEar: 220, bonusHpRing: 115, bonusMpNeck: 280, bonusMpEar: 220, bonusMpRing: 115, bonusSpdNeck: 38, bonusSpdEar: 20, bonusCritNeck: 4, bonusCritRing: 4, pAtkNeck: 45, mAtkNeck: 45 },
];

const JEWEL_HEAVY_SETS: JewelSetDef[] = [
    { grade: 'No-Grade', gradeKey: 'ng', weight: 'heavy', prefix: 'Ironheart', precoNeck: 340, precoEar: 230, precoRing: 170, mDefNeck: 14, mDefEar: 10, mDefRing: 7, bonusHpNeck: 22, bonusHpEar: 14, bonusHpRing: 8, bonusMpNeck: 6, bonusMpEar: 4, bonusMpRing: 3 },
    { grade: 'D', gradeKey: 'd', weight: 'heavy', prefix: 'Granite', precoNeck: 2200, precoEar: 1650, precoRing: 1100, mDefNeck: 32, mDefEar: 24, mDefRing: 16, bonusHpNeck: 52, bonusHpEar: 32, bonusHpRing: 18, bonusMpNeck: 18, bonusMpEar: 12, bonusMpRing: 8, pAtkRing: 2, mAtkRing: 2 },
    { grade: 'C', gradeKey: 'c', weight: 'heavy', prefix: 'Stoneguard', precoNeck: 6600, precoEar: 4950, precoRing: 3300, mDefNeck: 58, mDefEar: 43, mDefRing: 29, bonusHpNeck: 110, bonusHpEar: 72, bonusHpRing: 38, bonusMpNeck: 38, bonusMpEar: 28, bonusMpRing: 16, bonusCritNeck: 1, pAtkNeck: 8, mAtkNeck: 8 },
    { grade: 'B', gradeKey: 'b', weight: 'heavy', prefix: 'Obsidian', precoNeck: 19800, precoEar: 14850, precoRing: 9900, mDefNeck: 82, mDefEar: 61, mDefRing: 41, bonusHpNeck: 185, bonusHpEar: 125, bonusHpRing: 72, bonusMpNeck: 70, bonusMpEar: 48, bonusMpRing: 30, bonusCritNeck: 2, pAtkNeck: 22, mAtkNeck: 22, pAtkEar: 12, mAtkEar: 12 },
    { grade: 'A', gradeKey: 'a', weight: 'heavy', prefix: 'Titan', precoNeck: 66000, precoEar: 49500, precoRing: 33000, mDefNeck: 118, mDefEar: 88, mDefRing: 59, bonusHpNeck: 310, bonusHpEar: 220, bonusHpRing: 125, bonusMpNeck: 120, bonusMpEar: 90, bonusMpRing: 48, bonusCritNeck: 3, pAtkNeck: 42, mAtkNeck: 42, pAtkEar: 28, mAtkEar: 28 },
    { grade: 'S', gradeKey: 's', weight: 'heavy', prefix: 'Dominion', precoNeck: 275000, precoEar: 198000, precoRing: 137500, mDefNeck: 165, mDefEar: 124, mDefRing: 83, bonusHpNeck: 480, bonusHpEar: 340, bonusHpRing: 190, bonusMpNeck: 210, bonusMpEar: 165, bonusMpRing: 85, bonusCritNeck: 4, pAtkNeck: 85, mAtkNeck: 85, pAtkEar: 55, mAtkEar: 55, pAtkRing: 40, mAtkRing: 40 },
];

function jewelPieceName(prefix: string, piece: JewelPiece, weight: JewelSetWeight): string {
    const pieceLabel = piece === 'neck' ? 'Necklace' : (piece === 'ear' ? 'Earring' : 'Ring');
    const weightLabel = weight === 'light' ? 'Light' : (weight === 'heavy' ? 'Heavy' : 'Balanced');
    return `${prefix} ${weightLabel} ${pieceLabel}`;
}

function buildJewelSetEntries(set: JewelSetDef, iconPath: (id: string) => string): ItemCatalogBase[] {
    const suffix = set.weight === 'light' ? 'lt' : 'hv';
    const pieces: Array<{ piece: JewelPiece; preco: number; mDef: number; bonusHp: number; bonusMp: number; bonusCrit?: number; bonusSpd?: number; pAtk?: number; mAtk?: number }> = [
        { piece: 'neck', preco: set.precoNeck, mDef: set.mDefNeck, bonusHp: set.bonusHpNeck, bonusMp: set.bonusMpNeck, bonusCrit: set.bonusCritNeck, bonusSpd: set.bonusSpdNeck, pAtk: set.pAtkNeck, mAtk: set.mAtkNeck },
        { piece: 'ear', preco: set.precoEar, mDef: set.mDefEar, bonusHp: set.bonusHpEar, bonusMp: set.bonusMpEar, bonusCrit: set.bonusCritEar, bonusSpd: set.bonusSpdEar, pAtk: set.pAtkEar, mAtk: set.mAtkEar },
        { piece: 'ring', preco: set.precoRing, mDef: set.mDefRing, bonusHp: set.bonusHpRing, bonusMp: set.bonusMpRing, bonusCrit: set.bonusCritRing, bonusSpd: set.bonusSpdRing, pAtk: set.pAtkRing, mAtk: set.mAtkRing },
    ];
    return pieces.map((p) => {
        const id = `j_${set.gradeKey}_${suffix}_${p.piece}`;
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
            pAtk: p.pAtk,
            mAtk: p.mAtk,
            jewelSetWeight: set.weight,
            jewelSetLabel: `${set.prefix} · ${set.weight.charAt(0).toUpperCase() + set.weight.slice(1)} Set`,
            desc: `Universal ${set.weight} jewelry set (${set.grade}). Works for fighters and mages.`,
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
                    jewelSetLabel: `${label} · Medium Set`,
                };
            }
        }
        return j;
    });
}
