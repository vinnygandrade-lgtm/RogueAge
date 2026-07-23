/**
 * Shared skill cast / launch lock.
 * After casting a skill, a short red CD (same drain visual as personal CD) blocks
 * other skills. Does NOT gate basic Attack / potions / shots.
 * Fixed duration (not reduced by expedition skill CDR).
 */

/** Default cast-lock duration between skills (ms). */
export const SKILL_GCD_MS = 1500;

let lastGcdCastSkill: string | null = null;
/** Personal recharge timers deferred until cast lock ends. */
const pendingRechargeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function nowMs(): number {
  return Date.now();
}

function clearPendingRecharge(skillName: string): void {
  const t = pendingRechargeTimers[skillName];
  if (t != null) {
    clearTimeout(t);
    delete pendingRechargeTimers[skillName];
  }
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

/** Skill that armed the current GCD (for hotbar cast highlight). */
export function getSkillGcdCastName(): string | null {
  if (getSkillGcdRemainingMs() <= 0) {
    lastGcdCastSkill = null;
    return null;
  }
  return lastGcdCastSkill;
}

/**
 * Arm the shared skill lock.
 * @param ms optional duration (default SKILL_GCD_MS) — not shortened by skill CDR
 * @param castSkillName skill that started the GCD (UI highlight)
 */
export function armSkillGcd(ms?: number, castSkillName?: string): void {
  const dur = Math.max(200, Math.floor(ms != null && ms > 0 ? ms : SKILL_GCD_MS));
  window.globalCooldownAtivo = nowMs() + dur;
  if (castSkillName) lastGcdCastSkill = castSkillName;
}

/**
 * Cast lock (red) first, then personal recharge CD starts when cast ends.
 * Use this instead of armSkillGcd + dispararAnimacaoCooldown for skills.
 */
export function beginSkillCast(skillName: string, rechargeMs: number, castMs?: number): void {
  const name = String(skillName || '');
  if (!name) return;

  const castDur = Math.max(200, Math.floor(castMs != null && castMs > 0 ? castMs : SKILL_GCD_MS));
  const recharge = Math.max(0, Math.floor(Number(rechargeMs) || 0));

  clearPendingRecharge(name);
  // Keep personal CD clear during cast so the red launch bar is the only overlay.
  if (window.cooldownsAtivos && Object.prototype.hasOwnProperty.call(window.cooldownsAtivos, name)) {
    delete window.cooldownsAtivos[name];
  }

  armSkillGcd(castDur, name);

  // Restart basic Attack swing CD from zero so a nearly-ready AA does not land on cast.
  if (typeof window.resetBasicAttackAposSkill === 'function') {
    window.resetBasicAttackAposSkill();
  }

  if (recharge <= 0) return;

  pendingRechargeTimers[name] = setTimeout(() => {
    delete pendingRechargeTimers[name];
    if (typeof window.dispararAnimacaoCooldown === 'function') {
      window.dispararAnimacaoCooldown(name, recharge);
    } else if (window.cooldownsAtivos) {
      window.cooldownsAtivos[name] = nowMs() + recharge;
    }
  }, castDur);
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

/** 0–100 progress remaining on the shared GCD (for the top rail). */
export function getSkillGcdProgressPct(): number {
  const left = getSkillGcdRemainingMs();
  if (left <= 0) return 0;
  return Math.max(0, Math.min(100, (left / SKILL_GCD_MS) * 100));
}

window.getSkillGcdRemainingMs = getSkillGcdRemainingMs;
window.isSkillGcdBlocked = isSkillGcdBlocked;
window.armSkillGcd = armSkillGcd;
window.beginSkillCast = beginSkillCast;
window.slotUsesSkillGcd = slotUsesSkillGcd;
window.getHotbarSlotLockRemainingMs = getHotbarSlotLockRemainingMs;
window.getHotbarSlotLockTotalMs = getHotbarSlotLockTotalMs;
window.getSkillGcdCastName = getSkillGcdCastName;
window.getSkillGcdProgressPct = getSkillGcdProgressPct;
window.SKILL_GCD_MS = SKILL_GCD_MS;

export {};
