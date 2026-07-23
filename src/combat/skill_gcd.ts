/**
 * Shared skill GCD (global cooldown) — professional cast pacing.
 * Blocks skill → skill chaining; does NOT gate basic Attack / potions / shots.
 * Fixed duration (not reduced by expedition skill CDR).
 */

/** Default lock between skills (ms). */
export const SKILL_GCD_MS = 1500;

function nowMs(): number {
  return Date.now();
}

/** True for hotbar entries that share the skill GCD. */
export function slotUsesSkillGcd(nome: string | null | undefined): boolean {
  if (!nome || nome === 'Attack') return false;
  if (nome.includes('Potion') || nome.includes('shot') || nome.includes('Soulshot') || nome.includes('Spiritshot')) {
    return false;
  }
  return !!(window.bancoDeSkills && window.bancoDeSkills[nome]);
}

export function getSkillGcdRemainingMs(): number {
  const end = Number(window.globalCooldownAtivo) || 0;
  const left = end - nowMs();
  return left > 0 ? left : 0;
}

export function isSkillGcdBlocked(): boolean {
  return getSkillGcdRemainingMs() > 0;
}

/** Arm the shared skill lock. Duration is fixed — not shortened by skill CDR. */
export function armSkillGcd(ms: number = SKILL_GCD_MS): void {
  const dur = Math.max(200, Math.floor(Number(ms) || SKILL_GCD_MS));
  window.globalCooldownAtivo = nowMs() + dur;
}

/**
 * Remaining lock shown on a hotbar slot: max(personal CD, skill GCD).
 * Attack / potions / shots only use personal CD.
 */
export function getHotbarSlotLockRemainingMs(nome: string): number {
  const personalEnd = Number(window.cooldownsAtivos?.[nome]) || 0;
  const personalLeft = Math.max(0, personalEnd - nowMs());
  if (!slotUsesSkillGcd(nome)) return personalLeft;
  return Math.max(personalLeft, getSkillGcdRemainingMs());
}

/** Denominator for overlay % — personal CD total, or GCD length when only GCD is locking. */
export function getHotbarSlotLockTotalMs(nome: string, personalCdTotalMs: number): number {
  const personalEnd = Number(window.cooldownsAtivos?.[nome]) || 0;
  const personalLeft = Math.max(0, personalEnd - nowMs());
  const gcdLeft = slotUsesSkillGcd(nome) ? getSkillGcdRemainingMs() : 0;
  if (gcdLeft > personalLeft && gcdLeft > 0) return SKILL_GCD_MS;
  return Math.max(1, personalCdTotalMs);
}

window.getSkillGcdRemainingMs = getSkillGcdRemainingMs;
window.isSkillGcdBlocked = isSkillGcdBlocked;
window.armSkillGcd = armSkillGcd;
window.slotUsesSkillGcd = slotUsesSkillGcd;
window.getHotbarSlotLockRemainingMs = getHotbarSlotLockRemainingMs;
window.getHotbarSlotLockTotalMs = getHotbarSlotLockTotalMs;
window.SKILL_GCD_MS = SKILL_GCD_MS;

export {};
