/**
 * First-class skill combat buffs (atk / def / spd).
 * Survives calcularStatusGlobais — applied at the end of every recalc while active.
 */

import {
  EXPEDITION_ATK_SPEED_ABS_MIN_MS,
  isExpeditionRunEffectsActive,
} from './expedition_combat';
import { MAX_CAST_SPEED_PCT } from './skill_cast';

export type SkillCombatBuffKind = 'atk' | 'def' | 'spd';

export interface SkillCombatBuffEntry {
  skillName: string;
  expiresAt: number;
  pAtkMult: number;
  mAtkMult: number;
  pDefMult: number;
  mDefMult: number;
  /** Multiplier on atkSpeed ms (< 1 = faster). */
  atkSpeedMult: number;
  /** Additive Casting Speed % (shortens skill castMs). */
  castSpeedBonus: number;
}

const DEFAULT_DURATION_MS = 30_000;

const slots: Record<SkillCombatBuffKind, SkillCombatBuffEntry | null> = {
  atk: null,
  def: null,
  spd: null,
};

const timers: Record<SkillCombatBuffKind, ReturnType<typeof setTimeout> | null> = {
  atk: null,
  def: null,
  spd: null,
};

function pruneExpired(now = Date.now()): void {
  (['atk', 'def', 'spd'] as const).forEach((kind) => {
    const entry = slots[kind];
    if (entry && entry.expiresAt <= now) {
      slots[kind] = null;
      if (timers[kind]) {
        clearTimeout(timers[kind]!);
        timers[kind] = null;
      }
    }
  });
}

/** Clears all skill combat buffs (new character / character load). */
export function clearSkillCombatBuffs(): void {
  (['atk', 'def', 'spd'] as const).forEach((kind) => {
    if (timers[kind]) {
      clearTimeout(timers[kind]!);
      timers[kind] = null;
    }
    slots[kind] = null;
  });
}

/**
 * Activate or refresh one buff slot. Replacing the same kind does not stack
 * on already-buffed stats — it overwrites the previous multiplier.
 */
export function setSkillCombatBuff(
  kind: SkillCombatBuffKind,
  opts: {
    skillName: string;
    pAtkMult?: number;
    mAtkMult?: number;
    pDefMult?: number;
    mDefMult?: number;
    atkSpeedMult?: number;
    castSpeedBonus?: number;
    durationMs?: number;
  },
): void {
  if (timers[kind]) {
    clearTimeout(timers[kind]!);
    timers[kind] = null;
  }

  const durationMs = opts.durationMs != null && opts.durationMs > 0 ? opts.durationMs : DEFAULT_DURATION_MS;
  const castBonusRaw = Number(opts.castSpeedBonus);
  slots[kind] = {
    skillName: opts.skillName,
    expiresAt: Date.now() + durationMs,
    pAtkMult: opts.pAtkMult != null && opts.pAtkMult > 0 ? opts.pAtkMult : 1,
    mAtkMult: opts.mAtkMult != null && opts.mAtkMult > 0 ? opts.mAtkMult : 1,
    pDefMult: opts.pDefMult != null && opts.pDefMult > 0 ? opts.pDefMult : 1,
    mDefMult: opts.mDefMult != null && opts.mDefMult > 0 ? opts.mDefMult : 1,
    atkSpeedMult: opts.atkSpeedMult != null && opts.atkSpeedMult > 0 ? opts.atkSpeedMult : 1,
    castSpeedBonus:
      Number.isFinite(castBonusRaw) && castBonusRaw > 0 ? Math.floor(castBonusRaw) : 0,
  };

  timers[kind] = setTimeout(() => {
    slots[kind] = null;
    timers[kind] = null;
    if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
    if (typeof window.atualizar === 'function') window.atualizar();
  }, durationMs);
}

/** Apply active skill buffs onto the freshly rebuilt playerStats. */
export function applySkillCombatBuffsToPlayerStats(): void {
  // Inspection / FromData must not inherit the local player's Frenzy/etc.
  if ((window as unknown as { _calcStatsSkipSkillBuffs?: boolean })._calcStatsSkipSkillBuffs) {
    return;
  }
  pruneExpired();
  if (!window.playerStats) return;

  let pAtkM = 1;
  let mAtkM = 1;
  let pDefM = 1;
  let mDefM = 1;
  let spdM = 1;
  let castSpdBonus = 0;

  (['atk', 'def', 'spd'] as const).forEach((kind) => {
    const entry = slots[kind];
    if (!entry) return;
    pAtkM *= entry.pAtkMult;
    mAtkM *= entry.mAtkMult;
    pDefM *= entry.pDefMult;
    mDefM *= entry.mDefMult || 1;
    spdM *= entry.atkSpeedMult;
    castSpdBonus += entry.castSpeedBonus || 0;
  });

  if (pAtkM !== 1) window.playerStats.pAtk = Math.floor(window.playerStats.pAtk * pAtkM);
  if (mAtkM !== 1) window.playerStats.mAtk = Math.floor(window.playerStats.mAtk * mAtkM);
  if (pDefM !== 1) window.playerStats.pDef = Math.floor(window.playerStats.pDef * pDefM);
  if (mDefM !== 1) window.playerStats.mDef = Math.floor(window.playerStats.mDef * mDefM);
  const expedition = isExpeditionRunEffectsActive();

  if (spdM !== 1) {
    const nextMs = Math.floor(window.playerStats.atkSpeed * spdM);
    if (expedition) {
      window.playerStats.atkSpeed = Math.max(EXPEDITION_ATK_SPEED_ABS_MIN_MS, nextMs);
    } else {
      window.playerStats.atkSpeed = (typeof window.applyAtkSpeedFloor === 'function')
        ? window.applyAtkSpeedFloor(nextMs)
        : Math.max(160, nextMs);
    }
  }

  // Soft-cap once on (gear raw + buff), matching Crit / Evasion investment curves.
  // Expedition: keep run castSpeedAdd and skip world soft-cap.
  if (castSpdBonus > 0) {
    const win = window as Window & {
      _l2CastSpeedRawGear?: number;
      ExpeditionEngine?: { getCombinedBuffPct?: (stat: string) => number };
    };
    const gearRaw =
      typeof win._l2CastSpeedRawGear === 'number'
        ? Math.max(0, Math.floor(win._l2CastSpeedRawGear))
        : Math.max(0, Math.floor(Number(window.playerStats.castSpeed) || 0));
    const runCastAdd =
      expedition && typeof win.ExpeditionEngine?.getCombinedBuffPct === 'function'
        ? Math.max(0, Math.floor(Number(win.ExpeditionEngine.getCombinedBuffPct('castSpeedPct')) || 0))
        : 0;
    const castRaw = Math.max(0, gearRaw + runCastAdd + Math.floor(castSpdBonus));
    if (expedition) {
      window.playerStats.castSpeed = castRaw;
    } else {
      window.playerStats.castSpeed = (typeof window.applyCastSpeedCap === 'function')
        ? window.applyCastSpeedCap(castRaw)
        : Math.min(MAX_CAST_SPEED_PCT, castRaw);
    }
  }
}

export function getActiveSkillCombatBuffSnapshot(): Record<SkillCombatBuffKind, SkillCombatBuffEntry | null> {
  pruneExpired();
  return { atk: slots.atk, def: slots.def, spd: slots.spd };
}

window.clearSkillCombatBuffs = clearSkillCombatBuffs;
window.applySkillCombatBuffsToPlayerStats = applySkillCombatBuffsToPlayerStats;

export {};
