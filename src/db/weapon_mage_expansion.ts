/**
 * Mage weapons — 3 styles per grade: Focus (Wand), Channel (Staff), Dominion (Scepter).
 */
import type { ItemCatalogBase } from '../types/game';

export type MageWeaponStyle = 'focus' | 'channel' | 'dominion';

const EXISTING_MAGE_WEAPON_META: Record<string, { weaponStyle: MageWeaponStyle; tipo?: string; nome?: string }> = {
    wpn_ng_trainee_focus: { weaponStyle: 'focus', tipo: 'Wand', nome: 'Novice Wand' },
    wpn_ng_magic: { weaponStyle: 'channel', nome: 'Channel Staff' },
    wpn_d_wizard_staff: { weaponStyle: 'channel', nome: 'Wizard Channel Staff' },
    wpn_c_sorcerer_staff: { weaponStyle: 'channel', nome: 'Sorcerer Channel Staff' },
    wpn_b_parasword: { weaponStyle: 'channel', nome: 'Parasword Channel Staff' },
    wpn_a_arcana_mace: { weaponStyle: 'channel', nome: 'Arcana Channel Staff' },
    wpn_s_imperial_staff: { weaponStyle: 'channel', nome: 'Imperial Channel Staff' },
    wpn_s_vesper_buster: { weaponStyle: 'channel', nome: 'Vesper Channel Staff' },
};

export function formatMageWeaponLineLabel(style: MageWeaponStyle): string {
    if (style === 'focus') return 'Mage Focus · Wand';
    if (style === 'dominion') return 'Mage Dominion · Scepter';
    return 'Mage Channel · Staff';
}

export function resolveMageWeaponTipo(style: MageWeaponStyle): string {
    if (style === 'focus') return 'Wand';
    if (style === 'dominion') return 'Scepter';
    return 'Magic Sword';
}

export function isMageExclusiveWeapon(item: ItemCatalogBase | null | undefined): boolean {
    if (!item) return false;
    if (item.weaponArchetype === 'mage') return true;
    const tipo = String(item.tipo || '');
    if (tipo === 'Wand' || tipo === 'Scepter') return true;
    if (tipo === 'Magic Sword' && item.weaponStyle) return true;
    return false;
}

export function weaponMatchesClass(item: ItemCatalogBase | null | undefined, isMage: boolean): boolean {
    if (!item) return false;
    if (isMageExclusiveWeapon(item)) return isMage;
    const arch = item.weaponArchetype as string | undefined;
    if (arch === 'fighter') return !isMage;
    if (arch === 'hybrid') return true;
    const tipo = String(item.tipo || '');
    if (tipo === 'Magic Sword') return isMage;
    return !isMage;
}

export function applyMageWeaponMeta(weapon: ItemCatalogBase): ItemCatalogBase {
    const id = String(weapon.id || '');
    const meta = EXISTING_MAGE_WEAPON_META[id];
    if (!meta) return weapon;
    const style = meta.weaponStyle;
    return {
        ...weapon,
        weaponArchetype: 'mage',
        weaponStyle: style,
        tipo: meta.tipo || resolveMageWeaponTipo(style),
        weaponLineLabel: formatMageWeaponLineLabel(style),
        ...(meta.nome ? { nome: meta.nome } : {}),
    };
}

type NewMageWeaponDef = {
    id: string;
    nome: string;
    grade: string;
    preco: number;
    weaponStyle: MageWeaponStyle;
    desc: string;
    atk: number;
    matk: number;
    bonusMp?: number;
    bonusSpd?: number;
    bonusHp?: number;
    bonusCrit?: number;
};

const NEW_MAGE_WEAPONS: NewMageWeaponDef[] = [
    // NO-GRADE — dominion (focus=trainee, channel=magic staff)
    {
        id: 'wpn_ng_m_scepter', nome: 'Bronze Scepter', grade: 'No-Grade', preco: 640, weaponStyle: 'dominion',
        atk: 18, matk: 30, bonusHp: 35, bonusMp: 55,
        desc: 'Heavy arcane scepter. More M. Atk punch and HP for battle mages starting out.',
    },

    // D
    {
        id: 'wpn_d_m_wand', nome: 'Crystal Wand', grade: 'D', preco: 2650, weaponStyle: 'focus',
        atk: 12, matk: 72, bonusMp: 220, bonusSpd: 22,
        desc: 'Light D-grade wand. Prioritizes MP pool and cast tempo over raw burst.',
    },
    {
        id: 'wpn_d_m_scepter', nome: 'Iron Scepter', grade: 'D', preco: 2900, weaponStyle: 'dominion',
        atk: 38, matk: 78, bonusHp: 95, bonusMp: 140,
        desc: 'Weighted scepter for frontline casters. Strong M. Atk with extra vitality.',
    },

    // C
    {
        id: 'wpn_c_m_wand', nome: 'Aether Wand', grade: 'C', preco: 8800, weaponStyle: 'focus',
        atk: 28, matk: 158, bonusMp: 400, bonusSpd: 32,
        desc: 'C-grade focus wand for rapid spell cycles and large MP reserves.',
    },
    {
        id: 'wpn_c_m_scepter', nome: 'War Scepter', grade: 'C', preco: 9400, weaponStyle: 'dominion',
        atk: 68, matk: 168, bonusHp: 210, bonusMp: 260,
        desc: 'Dominion scepter with brutal M. Atk and sustain for veteran mages.',
    },

    // B
    {
        id: 'wpn_b_m_wand', nome: 'Shadow Wand', grade: 'B', preco: 27800, weaponStyle: 'focus',
        atk: 52, matk: 285, bonusMp: 620, bonusSpd: 42,
        desc: 'B-grade wand tuned for Acumen-style pacing. Best MP and speed profile.',
    },
    {
        id: 'wpn_b_m_scepter', nome: 'Rune Scepter', grade: 'B', preco: 29200, weaponStyle: 'dominion',
        atk: 118, matk: 298, bonusHp: 420, bonusMp: 420,
        desc: 'Runic dominion scepter. Peak burst M. Atk with raid-grade HP padding.',
    },

    // A
    {
        id: 'wpn_a_m_wand', nome: 'Star Wand', grade: 'A', preco: 88500, weaponStyle: 'focus',
        atk: 88, matk: 470, bonusMp: 1100, bonusSpd: 58,
        desc: 'A-grade focus wand for endgame casters who live on MP and cast speed.',
    },
    {
        id: 'wpn_a_m_scepter', nome: 'Titan Scepter', grade: 'A', preco: 93500, weaponStyle: 'dominion',
        atk: 195, matk: 495, bonusHp: 680, bonusMp: 720,
        desc: 'Titan dominion scepter. Maximum M. Atk impact with champion-level HP.',
    },

    // S
    {
        id: 'wpn_s_m_wand', nome: 'Eclipse Wand', grade: 'S', preco: 258000, weaponStyle: 'focus',
        atk: 140, matk: 640, bonusMp: 1900, bonusSpd: 95,
        desc: 'S-grade eclipse wand. Extreme MP and casting tempo for arcane specialists.',
    },
    {
        id: 'wpn_s_m_scepter', nome: 'Void Scepter', grade: 'S', preco: 262000, weaponStyle: 'dominion',
        atk: 280, matk: 680, bonusHp: 1100, bonusMp: 1300,
        desc: 'Void dominion scepter. Highest shop M. Atk for mages who stand their ground.',
    },
];

export function buildExpansionMageWeapons(iconPath: (id: string) => string): ItemCatalogBase[] {
    return NEW_MAGE_WEAPONS.map((def) => ({
        id: def.id,
        nome: def.nome,
        grade: def.grade,
        preco: def.preco,
        tipo: resolveMageWeaponTipo(def.weaponStyle),
        weaponArchetype: 'mage',
        weaponStyle: def.weaponStyle,
        weaponLineLabel: formatMageWeaponLineLabel(def.weaponStyle),
        atk: def.atk,
        matk: def.matk,
        bonusMp: def.bonusMp,
        bonusSpd: def.bonusSpd,
        bonusHp: def.bonusHp,
        bonusCrit: def.bonusCrit,
        desc: def.desc,
        img: iconPath(def.id),
    }));
}
