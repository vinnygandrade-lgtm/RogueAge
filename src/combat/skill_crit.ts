/**
 * Shared skill critical roll — forest, raid, Olympiad, and other skill damage paths.
 * Special kit bonuses (Mortal Strike / Deadly Blow +12) stack on top of gear critRate.
 */

function motorCritMult(): number {
  const m = Number(window.motorBuffsEspeciais?.critMult);
  return Number.isFinite(m) && m > 1 ? m : 2;
}

/** Effective crit chance % for a damaging skill (after soft/hard cap). */
export function resolveSkillCritChancePct(skillName: string, baseChance?: number): number {
  let chance =
    baseChance != null && Number.isFinite(baseChance)
      ? Number(baseChance)
      : Number(window.playerStats?.critRate) || 0;
  if (skillName === 'Mortal Strike' || skillName === 'Deadly Blow') {
    chance += 12;
  }
  if (typeof window.applyCritRateCap === 'function') {
    return window.applyCritRateCap(chance);
  }
  return Math.min(90, Math.max(0, Math.floor(chance)));
}

/**
 * Roll crit for a damaging skill.
 * Magic skills use 1.5×; physical use motorBuffs critMult (default 2×).
 */
export function rollSkillDamageCrit(opts: {
  skillName: string;
  isMagic: boolean;
  baseChance?: number;
}): { isCrit: boolean; damageMult: number; chancePct: number } {
  const chancePct = resolveSkillCritChancePct(opts.skillName, opts.baseChance);
  const isCrit = Math.random() * 100 < chancePct;
  if (!isCrit) {
    return { isCrit: false, damageMult: 1, chancePct };
  }
  const damageMult = opts.isMagic ? 1.5 : motorCritMult();
  return { isCrit: true, damageMult, chancePct };
}

window.rollSkillDamageCrit = rollSkillDamageCrit;
window.resolveSkillCritChancePct = resolveSkillCritChancePct;

export {};
