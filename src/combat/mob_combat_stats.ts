/**
 * Mob physical / magical archetypes — roll at spawn, derive pAtk/pDef/mAtk/mDef from catalog atk/def.
 */

export type MobArchetype = 'fisico' | 'magico';

export interface MobCombatStatBlock {
    tipo: MobArchetype;
    pAtk: number;
    pDef: number;
    mAtk: number;
    mDef: number;
    /** Primary offense used when the mob attacks the player (legacy `atk`). */
    atk: number;
    /** Legacy average defense fallback. */
    def: number;
}

const SECONDARY_ATK_RATIO = 0.38;
const SECONDARY_DEF_RATIO = 0.58;

export function rollMobArchetype(): MobArchetype {
    return Math.random() < 0.5 ? 'magico' : 'fisico';
}

export function buildMobCombatStats(
    baseAtk: number,
    baseDef: number,
    archetype?: MobArchetype
): MobCombatStatBlock {
    const tipo = archetype ?? rollMobArchetype();
    const atk = Math.max(1, Math.floor(baseAtk));
    const def = Math.max(1, Math.floor(baseDef));

    if (tipo === 'magico') {
        const mAtk = atk;
        const mDef = def;
        const pAtk = Math.max(1, Math.floor(atk * SECONDARY_ATK_RATIO));
        const pDef = Math.max(1, Math.floor(def * SECONDARY_DEF_RATIO));
        return {
            tipo,
            pAtk,
            pDef,
            mAtk,
            mDef,
            atk: mAtk,
            def: Math.max(1, Math.floor((pDef + mDef) / 2))
        };
    }

    const pAtk = atk;
    const pDef = def;
    const mAtk = Math.max(1, Math.floor(atk * SECONDARY_ATK_RATIO));
    const mDef = Math.max(1, Math.floor(def * SECONDARY_DEF_RATIO));
    return {
        tipo,
        pAtk,
        pDef,
        mAtk,
        mDef,
        atk: pAtk,
        def: Math.max(1, Math.floor((pDef + mDef) / 2))
    };
}

export function mobAttacksMagically(mob: { tipo?: string }): boolean {
    return mob.tipo === 'magico';
}

export function mobPrimaryAtk(mob: { tipo?: string; pAtk?: number; mAtk?: number; atk?: number }): number {
    if (mobAttacksMagically(mob)) return Math.max(1, Math.floor(Number(mob.mAtk ?? mob.atk) || 1));
    return Math.max(1, Math.floor(Number(mob.pAtk ?? mob.atk) || 1));
}

export function mobDefenseAgainstPlayer(
    isPlayerMage: boolean,
    mob: { pDef?: number; mDef?: number; def?: number }
): number {
    if (isPlayerMage) {
        return Math.max(1, Math.floor(Number(mob.mDef) || Math.floor(Number(mob.def ?? 1) * 0.8) || 1));
    }
    return Math.max(1, Math.floor(Number(mob.pDef ?? mob.def) || 1));
}
