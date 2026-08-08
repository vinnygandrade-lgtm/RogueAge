/**
 * Shared skill cast / launch lock.
 * Cast fills first (red bar); skill effect resolves when cast ends;
 * then personal recharge CD starts. Does NOT gate potions / shots.
 * Starting a skill cancels Attack wind-up (basic attack has its own short cast).
 * Cast duration comes from resolveSkillCastMs (not expedition skill CDR).
 */

/** Fallback cast-lock duration when caller omits castMs (ms). */
export const SKILL_GCD_MS = 1500;

let lastGcdCastSkill: string | null = null;
/** Duration of the current cast lock (denominator for cast rail %). */
let activeCastTotalMs = SKILL_GCD_MS;
let activeCastEndsAt = 0;
/** Personal recharge timers deferred until cast lock ends. */
const pendingRechargeTimers: Record<string, ReturnType<typeof setTimeout>> = {};
/** Active cast completion (effect fires when this timer ends). */
let pendingCastTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCastSkill: string | null = null;

/** UI snapshot for the top cast rail (survives hotbar rebuilds). */
export type SkillCastUiState = {
  name: string | null;
  endsAt: number;
  totalMs: number;
};

function publishCastUi(): void {
  const left = getSkillGcdRemainingMs();
  const name = left > 0 ? lastGcdCastSkill : null;
  window.skillCastUi = {
    name,
    endsAt: name ? activeCastEndsAt : 0,
    totalMs: name ? Math.max(1, activeCastTotalMs) : 0,
  };
}

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

function clearPendingCastTimer(): void {
  if (pendingCastTimer != null) {
    clearTimeout(pendingCastTimer);
    pendingCastTimer = null;
  }
  pendingCastSkill = null;
}

/** True for hotbar entries that share the skill cast lock (not Attack). */
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

/** Denominator for the red cast overlay while a cast lock is active. */
export function getActiveSkillCastTotalMs(): number {
  if (getSkillGcdRemainingMs() <= 0) return SKILL_GCD_MS;
  return Math.max(1, activeCastTotalMs);
}

/**
 * Arm the shared skill lock.
 * @param ms optional duration (default SKILL_GCD_MS) — not shortened by skill CDR
 * @param castSkillName skill that started the GCD (UI highlight)
 */
export function armSkillGcd(ms?: number, castSkillName?: string): void {
  const dur = Math.max(200, Math.floor(ms != null && ms > 0 ? ms : SKILL_GCD_MS));
  const end = nowMs() + dur;
  window.globalCooldownAtivo = end;
  activeCastTotalMs = dur;
  activeCastEndsAt = end;
  if (castSkillName) lastGcdCastSkill = castSkillName;
  publishCastUi();
}

/**
 * Cancel an in-flight cast so its effect never resolves.
 * Clears cast lock unless keepGcd is true.
 */
export function cancelSkillCast(opts?: { keepGcd?: boolean }): void {
  const casting = pendingCastSkill;
  clearPendingCastTimer();
  if (casting) clearPendingRecharge(casting);
  if (!opts?.keepGcd) {
    window.globalCooldownAtivo = 0;
    lastGcdCastSkill = null;
    activeCastEndsAt = 0;
  }
  publishCastUi();
  try {
    if (typeof window.onSkillCastCancelled === 'function') window.onSkillCastCancelled();
  } catch {
    /* ignore */
  }
}

/**
 * Cast lock (red) first → onComplete (skill launch) → personal recharge CD.
 * Prefer this for all skill casts so damage/buffs fire after the cast bar finishes.
 */
export function beginSkillCast(
  skillName: string,
  rechargeMs: number,
  castMs?: number,
  onCastComplete?: (() => void) | null,
): void {
  const name = String(skillName || '');
  if (!name) return;

  // Skills interrupt Attack wind-up so AA + skill never resolve together.
  try {
    window.cancelAttackWindup?.({ preserveCastVisual: true });
  } catch {
    /* ignore */
  }

  const castDur = Math.max(200, Math.floor(castMs != null && castMs > 0 ? castMs : SKILL_GCD_MS));
  const recharge = Math.max(0, Math.floor(Number(rechargeMs) || 0));

  // New cast replaces any unfinished one (should be rare — GCD already blocks).
  clearPendingCastTimer();
  clearPendingRecharge(name);

  // Keep personal CD clear during cast so the red launch bar is the only overlay.
  if (window.cooldownsAtivos && Object.prototype.hasOwnProperty.call(window.cooldownsAtivos, name)) {
    delete window.cooldownsAtivos[name];
  }

  armSkillGcd(castDur, name);
  pendingCastSkill = name;
  publishCastUi();
  try {
    if (typeof window.onSkillCastStarted === 'function') window.onSkillCastStarted(name);
  } catch {
    /* ignore */
  }

  pendingCastTimer = setTimeout(() => {
    pendingCastTimer = null;
    pendingCastSkill = null;
    lastGcdCastSkill = null;
    activeCastEndsAt = 0;
    publishCastUi();

    try {
      if (typeof window.onSkillCastReleased === 'function') window.onSkillCastReleased(name);
    } catch {
      /* ignore */
    }

    try {
      if (typeof onCastComplete === 'function') onCastComplete();
    } catch (err) {
      console.warn('[skill_gcd] cast complete failed:', err);
    }

    if (recharge <= 0) {
      // Skill had no personal CD — still wake AA in case wind-up was interrupted.
      if (window.autoAtaqueAtivo && typeof window.resumeAutoAtaqueLoop === 'function') {
        try {
          window.resumeAutoAtaqueLoop();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    // Personal recharge starts only after cast (and launch) finishes.
    if (typeof window.dispararAnimacaoCooldown === 'function') {
      window.dispararAnimacaoCooldown(name, recharge);
    } else if (window.cooldownsAtivos) {
      window.cooldownsAtivos[name] = nowMs() + recharge;
    }

    // Wake auto-attack after skill release (wind-up may have been cancelled mid-cast).
    if (window.autoAtaqueAtivo && typeof window.resumeAutoAtaqueLoop === 'function') {
      try {
        window.resumeAutoAtaqueLoop();
      } catch {
        /* ignore */
      }
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

/** Denominator for overlay % — personal CD total, or active cast length when only cast is locking. */
export function getHotbarSlotLockTotalMs(nome: string, personalCdTotalMs: number): number {
  const personalEnd = Number(window.cooldownsAtivos?.[nome]) || 0;
  const personalLeft = Math.max(0, personalEnd - nowMs());
  const gcdLeft = slotUsesSkillGcd(nome) ? getSkillGcdRemainingMs() : 0;
  if (gcdLeft > personalLeft && gcdLeft > 0) return getActiveSkillCastTotalMs();
  return Math.max(1, personalCdTotalMs);
}

/** 0–100 progress remaining on the shared cast lock (for the top rail). */
export function getSkillGcdProgressPct(): number {
  const left = getSkillGcdRemainingMs();
  if (left <= 0) return 0;
  const total = getActiveSkillCastTotalMs();
  return Math.max(0, Math.min(100, (left / total) * 100));
}

window.getSkillGcdRemainingMs = getSkillGcdRemainingMs;
window.isSkillGcdBlocked = isSkillGcdBlocked;
window.armSkillGcd = armSkillGcd;
window.beginSkillCast = beginSkillCast;
window.cancelSkillCast = cancelSkillCast;
window.slotUsesSkillGcd = slotUsesSkillGcd;
window.getHotbarSlotLockRemainingMs = getHotbarSlotLockRemainingMs;
window.getHotbarSlotLockTotalMs = getHotbarSlotLockTotalMs;
window.getSkillGcdCastName = getSkillGcdCastName;
window.getSkillGcdProgressPct = getSkillGcdProgressPct;
window.getActiveSkillCastTotalMs = getActiveSkillCastTotalMs;
window.SKILL_GCD_MS = SKILL_GCD_MS;
window.skillCastUi = { name: null, endsAt: 0, totalMs: 0 };

export {};
