/**
 * First-class skill combat buffs (atk / def / spd).
 * Survives calcularStatusGlobais — applied at the end of every recalc while active.
 */

export type SkillCombatBuffKind = 'atk' | 'def' | 'spd';

export interface SkillCombatBuffEntry {
  skillName: string;
  expiresAt: number;
  pAtkMult: number;
  mAtkMult: number;
  pDefMult: number;
  /** Multiplier on atkSpeed ms (< 1 = faster). */
  atkSpeedMult: number;
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
    atkSpeedMult?: number;
    durationMs?: number;
  },
): void {
  if (timers[kind]) {
    clearTimeout(timers[kind]!);
    timers[kind] = null;
  }

  const durationMs = opts.durationMs != null && opts.durationMs > 0 ? opts.durationMs : DEFAULT_DURATION_MS;
  slots[kind] = {
    skillName: opts.skillName,
    expiresAt: Date.now() + durationMs,
    pAtkMult: opts.pAtkMult != null && opts.pAtkMult > 0 ? opts.pAtkMult : 1,
    mAtkMult: opts.mAtkMult != null && opts.mAtkMult > 0 ? opts.mAtkMult : 1,
    pDefMult: opts.pDefMult != null && opts.pDefMult > 0 ? opts.pDefMult : 1,
    atkSpeedMult: opts.atkSpeedMult != null && opts.atkSpeedMult > 0 ? opts.atkSpeedMult : 1,
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
  let spdM = 1;

  (['atk', 'def', 'spd'] as const).forEach((kind) => {
    const entry = slots[kind];
    if (!entry) return;
    pAtkM *= entry.pAtkMult;
    mAtkM *= entry.mAtkMult;
    pDefM *= entry.pDefMult;
    spdM *= entry.atkSpeedMult;
  });

  if (pAtkM !== 1) window.playerStats.pAtk = Math.floor(window.playerStats.pAtk * pAtkM);
  if (mAtkM !== 1) window.playerStats.mAtk = Math.floor(window.playerStats.mAtk * mAtkM);
  if (pDefM !== 1) window.playerStats.pDef = Math.floor(window.playerStats.pDef * pDefM);
  if (spdM !== 1) {
    window.playerStats.atkSpeed = Math.floor(window.playerStats.atkSpeed * spdM);
    if (window.playerStats.atkSpeed < 250) window.playerStats.atkSpeed = 250;
  }
}

export function getActiveSkillCombatBuffSnapshot(): Record<SkillCombatBuffKind, SkillCombatBuffEntry | null> {
  pruneExpired();
  return { atk: slots.atk, def: slots.def, spd: slots.spd };
}

window.clearSkillCombatBuffs = clearSkillCombatBuffs;
window.applySkillCombatBuffsToPlayerStats = applySkillCombatBuffsToPlayerStats;

export {};
